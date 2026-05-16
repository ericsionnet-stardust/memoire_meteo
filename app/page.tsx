import { Suspense } from 'react'
import { createServiceClient } from '@/lib/supabase'
import { getPeriode } from '@/lib/periodes'
import Header from './components/Header'
import FilterBar from './components/FilterBar'

type Evenement = {
  id: string
  date_evenement: string | null
  date_approx: string | null
  lieu: string | null
  region: string | null
  type_phenomene: string | null
  description: string | null
  source_primaire: string | null
  niveau_fiabilite: number | null
  lien_scan: string | null
  statut: string | null
}

const TYPES_META = [
  { value: 'inondation',        label: 'Inondation',        dot: '#3b82f6', badge: 'bg-blue-100 text-blue-800' },
  { value: 'canicule',          label: 'Canicule',          dot: '#f97316', badge: 'bg-orange-100 text-orange-800' },
  { value: 'neige_hors_saison', label: 'Neige hors saison', dot: '#0ea5e9', badge: 'bg-sky-100 text-sky-800' },
  { value: 'tempete',           label: 'Tempête',           dot: '#6b7280', badge: 'bg-gray-100 text-gray-800' },
  { value: 'secheresse',        label: 'Sécheresse',        dot: '#eab308', badge: 'bg-yellow-100 text-yellow-800' },
  { value: 'gel',               label: 'Gel',               dot: '#6366f1', badge: 'bg-indigo-100 text-indigo-800' },
]

function fiabiliteLabel(n: number | null) {
  if (n === 3) return { label: 'Haute fiabilité',     class: 'text-green-700' }
  if (n === 2) return { label: 'Fiabilité moyenne',   class: 'text-yellow-600' }
  return             { label: 'Fiabilité à vérifier', class: 'text-red-600' }
}

function formatDate(d: string | null, approx: string | null) {
  if (d) return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  return approx ?? '—'
}

async function getEvenements(
  type?: string,
  region?: string,
  yearMin?: number,
  yearMax?: number,
): Promise<Evenement[]> {
  const supabase = createServiceClient()
  let query = supabase
    .from('evenements_meteo')
    .select('id, date_evenement, date_approx, lieu, region, type_phenomene, description, source_primaire, niveau_fiabilite, lien_scan, statut')
    .order('date_evenement', { ascending: false })

  if (type)    query = query.eq('type_phenomene', type)
  if (region)  query = query.eq('region', region)
  if (yearMin) query = query.gte('date_evenement', `${yearMin}-01-01`)
  if (yearMax) query = query.lte('date_evenement', `${yearMax}-12-31`)

  const { data, error } = await query
  if (error) { console.error('Supabase error:', error.message); return [] }
  return data ?? []
}

async function getRegions(): Promise<string[]> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('evenements_meteo').select('region').not('region', 'is', null).order('region')
  if (error) return []
  const unique = [...new Set((data ?? []).map(r => r.region as string))]
  return unique.sort((a, b) => a.localeCompare(b, 'fr'))
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params  = await searchParams
  const type    = typeof params.type   === 'string' ? params.type   : undefined
  const region  = typeof params.region === 'string' ? params.region : undefined
  const periode = getPeriode(typeof params.periode === 'string' ? params.periode : undefined)

  const [evenements, regions] = await Promise.all([
    getEvenements(type, region, periode.yearMin, periode.yearMax),
    getRegions(),
  ])

  // Comptage par type pour la barre de stats
  const countByType = TYPES_META.map(t => ({
    ...t,
    count: evenements.filter(e => e.type_phenomene === t.value).length,
  })).filter(t => t.count > 0)

  return (
    <div className="min-h-screen bg-white">
      <Header active="liste" />

      <main className="max-w-4xl mx-auto px-6 py-8">

        {/* Filtres */}
        <div className="mb-5">
          <Suspense fallback={null}>
            <FilterBar regions={regions} />
          </Suspense>
        </div>

        {evenements.length === 0 ? (
          <p className="text-slate-400 text-center py-16">
            Aucun événement pour cette période et ces filtres.
          </p>
        ) : (
          <div className="space-y-4">

            {/* Barre de stats */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 py-3 border-y border-slate-100">
              <span className="text-sm font-semibold text-slate-900 tabular-nums">
                {evenements.length} événement{evenements.length > 1 ? 's' : ''}
              </span>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                {countByType.map(t => (
                  <span key={t.value} className="flex items-center gap-1.5 text-xs text-slate-500 tabular-nums">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: t.dot }} />
                    {t.label}
                    <span className="font-semibold text-slate-700">{t.count}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Liste des événements */}
            {evenements.map(e => {
              const fiab     = fiabiliteLabel(e.niveau_fiabilite)
              const phenoKey = e.type_phenomene ?? ''
              const meta     = TYPES_META.find(t => t.value === phenoKey)
              return (
                <article key={e.id} className="bg-white rounded-lg border border-slate-200 p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${meta?.badge ?? 'bg-slate-100 text-slate-700'}`}>
                        {meta?.label ?? phenoKey}
                      </span>
                      <span className="text-slate-500 text-sm tabular-nums">
                        {formatDate(e.date_evenement, e.date_approx)}
                      </span>
                    </div>
                    <span className={`text-xs font-medium ${fiab.class}`}>{fiab.label}</span>
                  </div>

                  <h2 className="mt-3 font-semibold text-slate-900">
                    {e.lieu}
                    {e.region && <span className="font-normal text-slate-500"> — {e.region}</span>}
                  </h2>

                  <p className="mt-2 text-slate-600 text-sm leading-relaxed">{e.description}</p>

                  {(e.source_primaire || e.lien_scan) && (
                    <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                      {e.source_primaire && (
                        <p className="text-xs text-slate-400 italic">Source : {e.source_primaire}</p>
                      )}
                      {e.lien_scan && (
                        <a
                          href={e.lien_scan}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:text-blue-700 hover:underline shrink-0"
                        >
                          Consulter la source →
                        </a>
                      )}
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
