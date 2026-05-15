'use strict'

// Chargement manuel pour contourner l'interception dotenvx qui filtre ANTHROPIC_API_KEY
;(function loadEnv() {
  const fs = require('fs')
  const path = require('path')
  const envPath = path.resolve(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) return
  fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .forEach((line) => {
      const m = line.match(/^([^#=\s][^=]*)=(.*)$/)
      if (m) {
        process.env[m[1].trim()] = m[2].trim()
      }
    })
})()

const MODEL = 'claude-sonnet-4-6'
const TARGET_COUNT = 10
const MAX_TOKENS = 4096

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

// --------------------------------------------------------------------------
// Prompt système
// --------------------------------------------------------------------------
const SYSTEM_PROMPT = `Tu es un historien et climatologue spécialisé dans la météorologie historique française du XIXe siècle.

Tu as une connaissance approfondie des événements météorologiques exceptionnels documentés survenus en France entre 1800 et 1900, issus de tes données d'entraînement (journaux d'époque numérisés, archives météorologiques, études historiques).

TYPES D'ÉVÉNEMENTS :
- neige_hors_saison : chutes de neige record, blizzards, neige en printemps ou été
- canicule : vagues de chaleur mortelles ou températures record
- inondation : crues majeures, ruptures de digue, inondations catastrophiques
- tempete : ouragans, tornades, grêle dévastatrice, vents records
- gel : vagues de froid meurtrières, hivers extrêmes, gelées exceptionnelles
- secheresse : sécheresses prolongées avec impact agricole ou humain majeur

CRITÈRES :
- Priorité aux événements avec une date précise (jour/mois/année)
- Diversité géographique (Nord, Sud, Est, Ouest, Centre)
- Diversité des types (au moins 4 types différents)
- niveau_fiabilite : 2 si event bien documenté dans les sources historiques, 1 si moins certain
- Ne jamais inventer de citations : citation_exacte = null si tu n'es pas certain du verbatim exact

Retourne UNIQUEMENT le bloc JSON ci-dessous encadré par les marqueurs exacts.
Ne place RIEN après ===FIN_JSON=== :

===JSON_EVENTS===
[
  {
    "date_evenement": "YYYY-MM-DD ou null si inconnue",
    "date_approx": "description textuelle si date imprécise, sinon null",
    "lieu": "commune et département ou région précise",
    "region": "région administrative actuelle (ex: Occitanie, Bretagne...)",
    "type_phenomene": "un des types listés ci-dessus",
    "description": "2 à 4 phrases factuelles et précises sur l'événement et ses conséquences",
    "citation_exacte": null,
    "source_primaire": "source historique connue (journal, rapport, archive) — null si incertain",
    "source_secondaire": "autre source confirmant l'événement ou null",
    "niveau_fiabilite": 2,
    "periode": "XIXe siècle"
  }
]
===FIN_JSON===`

// --------------------------------------------------------------------------
// Appel simple — pas de web_search, une seule requête
// --------------------------------------------------------------------------
async function generateEvents() {
  process.stdout.write('   Appel API...')

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content:
          `À partir de tes connaissances historiques, identifie ${TARGET_COUNT} événements météorologiques ` +
          `exceptionnels survenus en France au XIXe siècle (1800-1900). ` +
          `Vise la diversité géographique et thématique. ` +
          `Retourne le JSON structuré selon le format indiqué dans tes instructions.`,
      },
    ],
  })

  process.stdout.write(` [stop: ${response.stop_reason}]\n`)

  const textBlocks = response.content.filter((b) => b.type === 'text')
  return textBlocks.map((b) => b.text).join('\n')
}

// --------------------------------------------------------------------------
// Extraction du JSON depuis la réponse de Claude
// --------------------------------------------------------------------------
function parseEvents(text) {
  const markerMatch = text.match(/===JSON_EVENTS===\s*([\s\S]*?)\s*===FIN_JSON===/m)
  if (markerMatch) {
    return JSON.parse(markerMatch[1].trim())
  }

  // Fallback : premier tableau JSON trouvé dans le texte
  const jsonMatch = text.match(/\[\s*\{[\s\S]*?\}\s*\]/m)
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0])
  }

  throw new Error('Aucun bloc JSON trouvé dans la réponse')
}

// --------------------------------------------------------------------------
// Déduplication et insertion dans Supabase
// --------------------------------------------------------------------------
async function deduplicateAndInsert(events) {
  const { data: existing, error: fetchError } = await supabase
    .from('evenements_meteo')
    .select('date_evenement, lieu, type_phenomene')

  if (fetchError) {
    throw new Error(`Erreur lecture Supabase : ${fetchError.message}`)
  }

  const existingKeys = new Set(
    (existing ?? []).map(
      (e) =>
        `${e.date_evenement ?? ''}|${(e.lieu ?? '').toLowerCase().trim()}|${e.type_phenomene ?? ''}`,
    ),
  )

  const toInsert = []
  const duplicates = []

  for (const event of events) {
    const key = `${event.date_evenement ?? ''}|${(event.lieu ?? '').toLowerCase().trim()}|${event.type_phenomene ?? ''}`
    if (existingKeys.has(key)) {
      duplicates.push(event)
    } else {
      toInsert.push({ ...event, statut: 'en_attente' })
    }
  }

  if (toInsert.length === 0) {
    return { inserted: 0, duplicates: duplicates.length, total: events.length }
  }

  const { error: insertError } = await supabase.from('evenements_meteo').insert(toInsert)

  if (insertError) {
    throw new Error(`Erreur insertion Supabase : ${insertError.message}`)
  }

  return { inserted: toInsert.length, duplicates: duplicates.length, total: events.length }
}

// --------------------------------------------------------------------------
// Point d'entrée
// --------------------------------------------------------------------------
async function main() {
  console.log('Memoire Meteo — Collecte depuis connaissances historiques')
  console.log('==========================================================')
  console.log(`Modele  : ${MODEL}`)
  console.log(`Mode    : Memoire du modele (sans recherche web)`)
  console.log(`Cible   : ${TARGET_COUNT} evenements (France, XIXe siecle)\n`)

  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your_api_key_here') {
    console.error('ERREUR : Renseigne ANTHROPIC_API_KEY dans .env.local')
    process.exit(1)
  }

  // 1. Génération
  console.log('1. Generation des evenements...')
  let text
  try {
    text = await generateEvents()
  } catch (err) {
    console.error(`\nERREUR generation : ${err.message}`)
    process.exit(1)
  }

  // 2. Parsing JSON
  console.log('\n2. Extraction des evenements...')
  let events
  try {
    events = parseEvents(text)
    console.log(`   ${events.length} evenement(s) extrait(s)`)
  } catch (err) {
    console.error(`\nERREUR parsing : ${err.message}`)
    console.log('\n--- Reponse brute ---')
    console.log(text.slice(0, 3000))
    process.exit(1)
  }

  // 3. Dedup + insertion
  console.log('\n3. Verification doublons et insertion Supabase...')
  let result
  try {
    result = await deduplicateAndInsert(events)
  } catch (err) {
    console.error(`\nERREUR Supabase : ${err.message}`)
    process.exit(1)
  }

  // 4. Résumé
  console.log('\n==========================================================')
  console.log('Collecte terminee')
  console.log(`  Evenements trouves  : ${result.total}`)
  console.log(`  Inseres (en_attente): ${result.inserted}`)
  console.log(`  Doublons ignores    : ${result.duplicates}`)

  if (result.inserted > 0) {
    console.log('\nStatut "en_attente" : validation humaine requise avant publication.')
    console.log('Valide via Supabase Table Editor ou en mettant statut = "valide".')
  }
}

main()
