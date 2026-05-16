'use strict'

// Chargement manuel .env.local (contournement dotenvx)
;(function loadEnv() {
  const fs   = require('fs')
  const path = require('path')
  const envPath = path.resolve(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) return
  fs.readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
    const m = line.match(/^([^#=\s][^=]*)=(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim()
  })
})()

// --------------------------------------------------------------------------
// Configuration des périodes
// --------------------------------------------------------------------------
const PERIODES = {
  'avant-1800': {
    label:    'Avant 1800 (Moyen Âge – Époque Moderne)',
    periode:  'avant-1800',
    yearMin:  1000,
    yearMax:  1799,
    target:   15,
    systemPrompt: `Tu es un historien et climatologue spécialisé dans la météorologie historique française de la période médiévale et de l'Époque Moderne (jusqu'à 1800).

Tu as une connaissance approfondie des événements météorologiques exceptionnels documentés survenus en France entre l'an 1000 et 1799, issus de chroniques médiévales, archives religieuses, journaux de voyage et travaux d'historiens du climat.

CONTEXTE HISTORIQUE PERTINENT :
- Optimum médiéval (950-1250) : période relativement chaude, bons rendements agricoles
- Petit Âge Glaciaire (vers 1300-1850) : refroidissement global, hivers rigoureux, famines
- Grands hivers historiques : 1407-08, 1565, 1608-09, 1684, 1709 (le plus sévère), 1740, 1788-89
- Grandes inondations : crues médiévales de la Loire, de la Seine, du Rhône
- Éruptions volcaniques affectant le climat européen (Laki 1783)

TYPES D'ÉVÉNEMENTS :
- neige_hors_saison : chutes de neige record, blizzards, neige tardive ou précoce
- canicule : vagues de chaleur, étés torrides documentés
- inondation : crues majeures, ruptures de digue, inondations catastrophiques
- tempete : grandes tempêtes, ouragans, grêle dévastatrice
- gel : grands hivers, vagues de froid meurtrières, gel des rivières et de la mer
- secheresse : sécheresses prolongées causant famines ou disettes

CRITÈRES :
- Couvre plusieurs siècles : quelques événements médiévaux (1000-1500), davantage à l'Époque Moderne (1500-1800)
- Date précise si possible ; sinon date_approx décrivant la période (ex: "Hiver 1709", "Été 1540")
- niveau_fiabilite : 2 si documenté dans des sources historiques reconnues, 1 si incertain
- Diversité géographique (différentes régions de France)
- Ne jamais inventer : source_primaire = null si tu n'es pas certain

Retourne UNIQUEMENT le bloc JSON encadré par les marqueurs exacts.
Ne place RIEN après ===FIN_JSON=== :

===JSON_EVENTS===
[
  {
    "date_evenement": "YYYY-MM-DD ou null",
    "date_approx": "ex: 'Grand Hiver de 1709' ou 'Été 1540' — null si date précise fournie",
    "lieu": "commune/région précise ou null si échelle nationale",
    "region": "région administrative actuelle ou null",
    "type_phenomene": "un des types listés",
    "description": "2 à 4 phrases factuelles avec contexte historique et conséquences",
    "citation_exacte": null,
    "source_primaire": "chronique, archive, étude historique connue — null si incertain",
    "source_secondaire": null,
    "niveau_fiabilite": 2,
    "periode": "avant-1800"
  }
]
===FIN_JSON===`,
    userPrompt: (n) =>
      `À partir de tes connaissances historiques, identifie ${n} événements météorologiques exceptionnels survenus en France entre l'an 1000 et 1799. ` +
      `Couvre différents siècles et différentes régions. Inclus les grands hivers du Petit Âge Glaciaire, les crues majeures, les étés exceptionnels. ` +
      `Retourne le JSON structuré selon le format indiqué.`,
  },

  'xx-xxi': {
    label:    'XXe – XXIe siècle (1901 – 2025)',
    periode:  'xx-xxi',
    yearMin:  1901,
    yearMax:  2025,
    target:   15,
    systemPrompt: `Tu es un météorologue et historien spécialisé dans les événements climatiques extrêmes en France du XXe et XXIe siècle.

Tu as une connaissance approfondie des événements météorologiques exceptionnels documentés survenus en France entre 1901 et 2025, issus de rapports de Météo-France, archives de presse, bilans de catastrophes naturelles.

ÉVÉNEMENTS DE RÉFÉRENCE (à inclure si pertinent) :
- Canicule d'août 2003 : 15 000 morts en France, record de chaleur absolu (46,9°C à Conqueyrac)
- Tempêtes Lothar et Martin (26-28 déc. 1999) : 92 morts, 3,4 millions de foyers privés d'électricité
- Inondations de Vaison-la-Romaine (22 sept. 1992) : 37 morts, crue de l'Ouvèze
- Inondations de Nîmes (3 oct. 1988) : 11 morts, 700 mm en 24h
- Canicule de juillet 1947 : 40°C à Paris
- Grand hiver 1956 : -20°C en Provence, mer Méditerranée gelée
- Sécheresse 1976 : la plus sévère du XXe siècle
- Tempête Xynthia (28 fév. 2010) : 59 morts en Europe, submersions côtières
- Inondations de l'Aude (octobre 2018) : 15 morts, 200 mm en 6h
- Canicule 2019 (45,9°C à Gallargues, nouveau record)

TYPES D'ÉVÉNEMENTS :
- neige_hors_saison, canicule, inondation, tempete, gel, secheresse

CRITÈRES :
- Dates précises disponibles pour la plupart (format YYYY-MM-DD)
- niveau_fiabilite : 3 si données officielles Météo-France/bilan officiel, 2 sinon
- Diversité géographique et temporelle (répartir sur tout le siècle)
- source_primaire : Météo-France, presse nationale, rapport de catastrophe officiel

Retourne UNIQUEMENT le bloc JSON encadré par les marqueurs exacts.
Ne place RIEN après ===FIN_JSON=== :

===JSON_EVENTS===
[
  {
    "date_evenement": "YYYY-MM-DD ou null",
    "date_approx": "ex: 'Été 2003' — null si date précise",
    "lieu": "commune/département précis ou null si événement national",
    "region": "région administrative actuelle ou null",
    "type_phenomene": "un des types listés",
    "description": "2 à 4 phrases factuelles avec bilan humain/matériel chiffré si disponible",
    "citation_exacte": null,
    "source_primaire": "Météo-France, rapport officiel, presse nationale — null si incertain",
    "source_secondaire": null,
    "niveau_fiabilite": 3,
    "periode": "xx-xxi"
  }
]
===FIN_JSON===`,
    userPrompt: (n) =>
      `À partir de tes connaissances, identifie ${n} événements météorologiques exceptionnels survenus en France entre 1901 et 2025. ` +
      `Inclus des événements répartis sur tout le siècle, avec les grandes canicules, tempêtes, inondations et sécheresses les plus marquantes. ` +
      `Retourne le JSON structuré selon le format indiqué.`,
  },
}

// --------------------------------------------------------------------------
// Lecture argument CLI
// --------------------------------------------------------------------------
const arg = process.argv[2]
if (!arg || !PERIODES[arg.replace('--', '')]) {
  console.error('Usage : node scripts/collect-periode.js --avant-1800 | --xx-xxi')
  console.error('Périodes disponibles : --avant-1800, --xx-xxi')
  process.exit(1)
}
const config = PERIODES[arg.replace('--', '')]

// --------------------------------------------------------------------------
// Init clients
// --------------------------------------------------------------------------
const MODEL      = 'claude-sonnet-4-6'
const MAX_TOKENS = 4096

let Anthropic
try {
  Anthropic = require('@anthropic-ai/sdk').default
} catch {
  Anthropic = require('@anthropic-ai/sdk')
}

const { createClient } = require('@supabase/supabase-js')

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const supabase  = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

// --------------------------------------------------------------------------
// Génération
// --------------------------------------------------------------------------
async function generateEvents() {
  process.stdout.write('   Appel API...')
  const response = await anthropic.messages.create({
    model:      MODEL,
    max_tokens: MAX_TOKENS,
    system:     config.systemPrompt,
    messages:   [{ role: 'user', content: config.userPrompt(config.target) }],
  })
  process.stdout.write(` [stop: ${response.stop_reason}]\n`)
  return response.content.filter(b => b.type === 'text').map(b => b.text).join('\n')
}

// --------------------------------------------------------------------------
// Parsing
// --------------------------------------------------------------------------
function parseEvents(text) {
  const m = text.match(/===JSON_EVENTS===\s*([\s\S]*?)\s*===FIN_JSON===/m)
  if (m) return JSON.parse(m[1].trim())
  const j = text.match(/\[\s*\{[\s\S]*?\}\s*\]/m)
  if (j) return JSON.parse(j[0])
  throw new Error('Aucun bloc JSON trouvé dans la réponse')
}

// --------------------------------------------------------------------------
// Déduplication + insertion
// --------------------------------------------------------------------------
async function deduplicateAndInsert(events) {
  const { data: existing, error } = await supabase
    .from('evenements_meteo')
    .select('date_evenement, lieu, type_phenomene')
  if (error) throw new Error(`Lecture Supabase : ${error.message}`)

  const keys = new Set(
    (existing ?? []).map(e =>
      `${e.date_evenement ?? ''}|${(e.lieu ?? '').toLowerCase().trim()}|${e.type_phenomene ?? ''}`,
    ),
  )

  const toInsert  = []
  const dupes     = []

  for (const ev of events) {
    const k = `${ev.date_evenement ?? ''}|${(ev.lieu ?? '').toLowerCase().trim()}|${ev.type_phenomene ?? ''}`
    if (keys.has(k)) dupes.push(ev)
    else toInsert.push({ ...ev, statut: 'en_attente' })
  }

  if (toInsert.length === 0) return { inserted: 0, duplicates: dupes.length, total: events.length }

  const { error: insErr } = await supabase.from('evenements_meteo').insert(toInsert)
  if (insErr) throw new Error(`Insertion Supabase : ${insErr.message}`)

  return { inserted: toInsert.length, duplicates: dupes.length, total: events.length }
}

// --------------------------------------------------------------------------
// Main
// --------------------------------------------------------------------------
async function main() {
  console.log('Memoire Meteo — Collecte par periode')
  console.log('=====================================')
  console.log(`Modele  : ${MODEL}`)
  console.log(`Periode : ${config.label}`)
  console.log(`Cible   : ${config.target} evenements\n`)

  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your_api_key_here') {
    console.error('ERREUR : Renseigne ANTHROPIC_API_KEY dans .env.local')
    process.exit(1)
  }

  console.log('1. Generation des evenements...')
  let text
  try { text = await generateEvents() }
  catch (err) { console.error(`\nERREUR generation : ${err.message}`); process.exit(1) }

  console.log('\n2. Extraction JSON...')
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

  console.log('\n3. Deduplication et insertion Supabase...')
  let result
  try { result = await deduplicateAndInsert(events) }
  catch (err) { console.error(`\nERREUR Supabase : ${err.message}`); process.exit(1) }

  console.log('\n=====================================')
  console.log('Collecte terminee')
  console.log(`  Evenements trouves  : ${result.total}`)
  console.log(`  Inseres (en_attente): ${result.inserted}`)
  console.log(`  Doublons ignores    : ${result.duplicates}`)
  if (result.inserted > 0) {
    console.log('\nPenser a lancer : npm run db:geocode')
    console.log('Valider les evenements dans Supabase (statut -> "valide").')
  }
}

main()
