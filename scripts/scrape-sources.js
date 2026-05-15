'use strict'

// Chargement manuel de .env.local (contourne l'interception dotenvx)
;(function loadEnv() {
  const fs = require('fs')
  const path = require('path')
  const envPath = path.resolve(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) return
  fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .forEach((line) => {
      const m = line.match(/^([^#=\s][^=]*)=(.*)$/)
      if (m) process.env[m[1].trim()] = m[2].trim()
    })
})()

const MODEL = 'claude-sonnet-4-6'
const MAX_EVENTS_PER_SOURCE = 5
// Délai entre chaque appel HTTP Wikipedia
const HTTP_DELAY_MS = 2500

let Anthropic
try {
  Anthropic = require('@anthropic-ai/sdk').default
} catch {
  Anthropic = require('@anthropic-ai/sdk')
}
const { createClient } = require('@supabase/supabase-js')

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// --------------------------------------------------------------------------
// Articles Wikipedia FR confirmés comme existants et contenant des données XIXe
// --------------------------------------------------------------------------
const WIKIPEDIA_PAGES = [
  'Inondation de 1856 en France',
  'Garonne',
  'Seine',
  'Loire',
  'Grand hiver de 1709',
  'Catastrophe naturelle',
  'Histoire du climat de la Terre',
]

// --------------------------------------------------------------------------
// Fetch Wikipedia et extrait uniquement les paragraphes mentionnant 18xx
// Évite d'envoyer 50k chars d'intro géographique à Claude
// --------------------------------------------------------------------------
async function fetchRelevantSections(title) {
  const url =
    `https://fr.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=true` +
    `&titles=${encodeURIComponent(title)}&format=json&origin=*`

  const res = await fetch(url, { headers: { 'User-Agent': 'MemoireMeteo/1.0 (educational)' } })
  if (!res.ok) return null

  const data = await res.json()
  const page = Object.values(data?.query?.pages ?? {})[0]
  if (!page || page.missing !== undefined) return null

  const fullText = page.extract ?? ''
  if (fullText.length < 200) return null

  // Découpe en paragraphes et ne garde que ceux mentionnant 18xx
  const paragraphs = fullText
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 50 && /18\d\d/.test(p))

  if (paragraphs.length === 0) return null

  // Plafond à 12 000 chars pour rester dans les limites de tokens
  let result = paragraphs.join('\n\n')
  if (result.length > 12_000) result = result.substring(0, 12_000)

  return result
}

// --------------------------------------------------------------------------
// Prompt d'extraction : Claude est extracteur, pas générateur
// --------------------------------------------------------------------------
const EXTRACTION_SYSTEM = `Tu es un expert en météorologie historique française.
On te fournit des extraits d'un article encyclopédique (paragraphes contenant des années entre 1800 et 1900).

RÈGLES STRICTES :
- N'extrais QUE les événements météorologiques explicitement mentionnés dans le texte
- Uniquement les événements survenus en France entre 1800 et 1900
- Ne génère rien qui n'est pas dans le texte fourni
- Si aucun événement qualifié → retourne tableau vide []
- citation_exacte : uniquement si une phrase verbatim apparaît dans le texte (copie exacte)
- lien_scan : URL de la page Wikipedia fournie en en-tête
- niveau_fiabilite : 2 (source secondaire encyclopédique)
- type_phenomene : neige_hors_saison | canicule | inondation | tempete | gel | secheresse

Retourne UNIQUEMENT le bloc JSON entre les marqueurs. Rien après ===FIN_JSON=== :

===JSON_EVENTS===
[
  {
    "date_evenement": "YYYY-MM-DD ou null",
    "date_approx": "description si date imprécise, sinon null",
    "lieu": "commune et département ou région précise",
    "region": "région administrative actuelle",
    "type_phenomene": "type parmi la liste ci-dessus",
    "description": "2 à 4 phrases factuelles tirées du texte source",
    "citation_exacte": null,
    "source_primaire": "Titre de l'article Wikipedia cité",
    "source_secondaire": null,
    "niveau_fiabilite": 2,
    "lien_scan": "URL Wikipedia de la page source",
    "periode": "XIXe siècle"
  }
]
===FIN_JSON===`

async function extractEvents(text, title) {
  const wikiUrl = `https://fr.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: EXTRACTION_SYSTEM,
    messages: [
      {
        role: 'user',
        content:
          `Source : ${wikiUrl}\n` +
          `Article Wikipedia : "${title}"\n\n` +
          `--- EXTRAITS (paragraphes mentionnant 18xx) ---\n${text}\n--- FIN ---\n\n` +
          `Extrais jusqu'à ${MAX_EVENTS_PER_SOURCE} événements météorologiques français du XIXe siècle.`,
      },
    ],
  })

  const raw = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n')

  return parseEvents(raw)
}

function parseEvents(text) {
  const markerMatch = text.match(/===JSON_EVENTS===\s*([\s\S]*?)\s*===FIN_JSON===/m)
  if (markerMatch) {
    try {
      const parsed = JSON.parse(markerMatch[1].trim())
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  const jsonMatch = text.match(/\[\s*(?:\{[\s\S]*?\})?\s*\]/m)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0])
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

// --------------------------------------------------------------------------
// Déduplication et insertion Supabase
// --------------------------------------------------------------------------
async function deduplicateAndInsert(events) {
  if (events.length === 0) return { inserted: 0, duplicates: 0, total: 0 }

  const { data: existing, error } = await supabase
    .from('evenements_meteo')
    .select('date_evenement, lieu, type_phenomene')
  if (error) throw new Error(`Supabase read: ${error.message}`)

  const keys = new Set(
    (existing ?? []).map(
      (e) =>
        `${e.date_evenement ?? ''}|${(e.lieu ?? '').toLowerCase().trim()}|${e.type_phenomene ?? ''}`,
    ),
  )

  const toInsert = []
  const dups = []
  for (const ev of events) {
    const k = `${ev.date_evenement ?? ''}|${(ev.lieu ?? '').toLowerCase().trim()}|${ev.type_phenomene ?? ''}`
    if (keys.has(k)) dups.push(ev)
    else toInsert.push({ ...ev, statut: 'en_attente' })
  }

  if (toInsert.length > 0) {
    const { error: insertErr } = await supabase.from('evenements_meteo').insert(toInsert)
    if (insertErr) throw new Error(`Supabase insert: ${insertErr.message}`)
  }

  return { inserted: toInsert.length, duplicates: dups.length, total: events.length }
}

// --------------------------------------------------------------------------
// Point d'entrée
// --------------------------------------------------------------------------
async function main() {
  console.log('Memoire Meteo — Collecte Wikipedia (sections XIXe)')
  console.log('===================================================')
  console.log(`Modèle   : ${MODEL}`)
  console.log(`Sources  : ${WIKIPEDIA_PAGES.length} articles Wikipedia FR`)
  console.log(`Stratégie: extraction des paragraphes mentionnant 18xx → Claude\n`)

  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your_api_key_here') {
    console.error('ERREUR : Renseigne ANTHROPIC_API_KEY dans .env.local')
    process.exit(1)
  }

  let totalInserted = 0
  let totalDuplicates = 0
  let totalFound = 0

  for (const title of WIKIPEDIA_PAGES) {
    process.stdout.write(`\n→ ${title}\n`)

    // 1. Fetch + filtre paragraphes XIXe
    await sleep(HTTP_DELAY_MS)
    let text
    try {
      text = await fetchRelevantSections(title)
    } catch (err) {
      console.log(`   SKIP (fetch: ${err.message})`)
      continue
    }

    if (!text) {
      console.log('   SKIP (pas de paragraphes mentionnant 18xx)')
      continue
    }
    console.log(`   ${text.length} chars de contenu XIXe trouvés`)

    // 2. Extraction via Claude
    let events
    try {
      process.stdout.write('   Claude extraction ... ')
      events = await extractEvents(text, title)
      console.log(`${events.length} événement(s)`)
    } catch (err) {
      console.log(`ERREUR : ${err.message}`)
      continue
    }

    if (events.length === 0) continue

    // 3. Dédup + insert
    try {
      const result = await deduplicateAndInsert(events)
      console.log(`   → +${result.inserted} insérés, ${result.duplicates} doublons`)
      totalInserted += result.inserted
      totalDuplicates += result.duplicates
      totalFound += result.total
    } catch (err) {
      console.log(`   ERREUR Supabase : ${err.message}`)
    }
  }

  console.log('\n===================================================')
  console.log('Collecte terminée')
  console.log(`  Événements trouvés  : ${totalFound}`)
  console.log(`  Insérés (en_attente): ${totalInserted}`)
  console.log(`  Doublons ignorés    : ${totalDuplicates}`)
  if (totalInserted > 0) {
    console.log('\nStatut "en_attente" : validation requise.')
    console.log('Champ lien_scan renseigné avec les URLs Wikipedia sources.')
  }
}

main()
