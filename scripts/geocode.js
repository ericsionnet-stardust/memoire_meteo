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

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

// Nominatim (OpenStreetMap) — gratuit, sans clé, max 1 req/seconde
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
const USER_AGENT = 'MemoireMeteo/1.0 (educational project, eric.sionnet@gmail.com)'
// Délai imposé par la politique d'usage Nominatim : 1 req/s minimum
const DELAY_MS = 1200

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// --------------------------------------------------------------------------
// Appel Nominatim avec fallback progressif sur le nom de lieu
// --------------------------------------------------------------------------
async function geocode(lieu) {
  // On essaie plusieurs variantes du lieu pour maximiser le taux de succès
  const candidates = buildCandidates(lieu)

  for (const q of candidates) {
    await sleep(DELAY_MS)
    const url =
      `${NOMINATIM_URL}?format=json&limit=1&countrycodes=fr` +
      `&q=${encodeURIComponent(q)}`

    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
    if (!res.ok) continue

    const results = await res.json()
    if (results.length > 0) {
      const { lat, lon } = results[0]
      return { latitude: parseFloat(lat), longitude: parseFloat(lon), query: q }
    }
  }

  return null
}

// Construit une liste de requêtes de la plus précise à la plus large
function buildCandidates(lieu) {
  if (!lieu) return []

  const candidates = []

  // 1. Lieu complet + France
  candidates.push(`${lieu}, France`)

  // 2. Première partie avant la virgule (commune seule)
  const commune = lieu.split(',')[0].trim()
  if (commune !== lieu.trim()) {
    candidates.push(`${commune}, France`)
  }

  // 3. Première partie avant un tiret (ex: "Vendée" depuis "La Roche-sur-Yon")
  const parts = commune.split(' ')
  if (parts.length > 2) {
    candidates.push(`${parts.slice(0, 2).join(' ')}, France`)
  }

  return candidates
}

// --------------------------------------------------------------------------
// Récupère les événements sans coordonnées
// --------------------------------------------------------------------------
async function fetchUngeocodedEvents() {
  const { data, error } = await supabase
    .from('evenements_meteo')
    .select('id, lieu, region')
    .or('latitude.is.null,longitude.is.null')
    .order('created_at', { ascending: true })

  if (error) throw new Error(`Supabase read: ${error.message}`)
  return data ?? []
}

// --------------------------------------------------------------------------
// Met à jour un événement avec ses coordonnées
// --------------------------------------------------------------------------
async function updateCoords(id, latitude, longitude) {
  const { error } = await supabase
    .from('evenements_meteo')
    .update({ latitude, longitude })
    .eq('id', id)

  if (error) throw new Error(`Supabase update (${id}): ${error.message}`)
}

// --------------------------------------------------------------------------
// Point d'entrée
// --------------------------------------------------------------------------
async function main() {
  console.log('Memoire Meteo — Géocodage Nominatim (OpenStreetMap)')
  console.log('====================================================')
  console.log('Source  : Nominatim OSM (gratuit, sans clé API)')
  console.log('Cadence : 1 requête / 1.2 secondes (politique Nominatim)\n')

  // 1. Événements à géocoder
  let events
  try {
    events = await fetchUngeocodedEvents()
  } catch (err) {
    console.error(`ERREUR Supabase : ${err.message}`)
    process.exit(1)
  }

  if (events.length === 0) {
    console.log('Tous les événements sont déjà géocodés.')
    process.exit(0)
  }

  console.log(`${events.length} événement(s) à géocoder\n`)

  let success = 0
  let failed = 0

  for (const event of events) {
    const label = (event.lieu ?? '(sans lieu)').substring(0, 50)
    process.stdout.write(`→ ${label} ... `)

    if (!event.lieu) {
      console.log('SKIP (lieu vide)')
      failed++
      continue
    }

    const result = await geocode(event.lieu)

    if (!result) {
      console.log('non trouvé')
      failed++
      continue
    }

    try {
      await updateCoords(event.id, result.latitude, result.longitude)
      console.log(`${result.latitude.toFixed(4)}, ${result.longitude.toFixed(4)}  [via "${result.query}"]`)
      success++
    } catch (err) {
      console.log(`ERREUR mise à jour : ${err.message}`)
      failed++
    }
  }

  console.log('\n====================================================')
  console.log('Géocodage terminé')
  console.log(`  Géocodés avec succès : ${success}`)
  console.log(`  Non trouvés / erreurs: ${failed}`)

  if (failed > 0) {
    console.log('\nPour les lieux non trouvés, tu peux corriger manuellement')
    console.log('dans Supabase en ajoutant latitude et longitude.')
  }
}

main()
