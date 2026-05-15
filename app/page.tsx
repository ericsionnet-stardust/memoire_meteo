import { Suspense } from 'react'
import { createServiceClient } from '@/lib/supabase'
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

const LABELS_PHENOMENE: Record<string, string> = {
  inondation: 'Inondation',
  canicule: 'Canicule',
  neige_hors_saison: 'Neige hors saison',
  tempete: 'Tempête',
  secheresse: 'Sécheresse',
  gel: 'Gel',
}

const COULEURS_PHENOMENE: Record<string, string> = {
  inondation: 'bg-blue-100 text-blue-800',
  canicule: 'bg-orange-100 text-orange-800',
  neige_hors_saison: 'bg-sky-100 text-sky-800',
  tempete: 'bg-gray-100 text-gray-800',
  secheresse: 'bg-yellow-100 text-yellow-800',
  gel: 'bg-indigo-100 text-indigo-800',
}

function fiabiliteLabel(n: number | null) {
  if (n === 3) return { label: 'Haute fiabilité', class: 'text-green-700' }
  if (n === 2) return { label: 'Fiabilité moyenne', class: 'text-yellow-600' }
  return { label: 'Fiabilité à vérifier', class: 'text-red-600' }
}

function formatDate(d: string | null, approx: string | null) {
  if (d) {
    return new Date(d).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }
  return approx ?? '—'
}

async function getEvenements(type?: string, region?: string): Promise<Evenement[]> {
  const supabase = createServiceClient()
  let query = supabase
    .from('evenements_meteo')
    .select(
      'id, date_evenement, date_approx, lieu, region, type_phenomene, description, source_primaire, niveau_fiabilite, lien_scan, statut',
    )
    .order('date_evenement', { ascending: false })

  if (type) query = query.eq('type_phenomene', type)
  if (region) query = query.eq('region', region)

  const { data, error } = await query
  if (error) {
    console.error('Supabase error:', error.message)
    return []
  }
  return data ?? []
}

async function getRegions(): Promise<string[]> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('evenements_meteo')
    .select('region')
    .not('region', 'is', null)
    .order('region')

  if (error) return []
  const unique = [...new Set((data ?? []).map((r) => r.region as string))]
  return unique.sort((a, b) => a.localeCompare(b, 'fr'))
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const type = typeof params.type === 'string' ? params.type : undefined
  const region = typeof params.region === 'string' ? params.region : undefined

  const [evenements, regions] = await Promise.all([getEvenements(type, region), getRegions()])

  return (
    <div className="min-h-screen bg-slate-50">
      <Header active="liste" />

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <Suspense fallback={null}>
            <FilterBar regions={regions} />
          </Suspense>
        </div>

        {evenements.length === 0 ? (
          <p className="text-slate-500 text-center py-16">
            Aucun événement correspondant aux filtres sélectionnés.
          </p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-400">
              {evenements.length} événement{evenements.length > 1 ? 's' : ''}
              {type || region ? ' correspondant aux filtres' : ''}
            </p>
            {evenements.map((e) => {
              const fiab = fiabiliteLabel(e.niveau_fiabilite)
              const phenoKey = e.type_phenomene ?? ''
              return (
                <article
                  key={e.id}
                  className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                          COULEURS_PHENOMENE[phenoKey] ?? 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {LABELS_PHENOMENE[phenoKey] ?? phenoKey}
                      </span>
                      <span className="text-slate-500 text-sm">
                        {formatDate(e.date_evenement, e.date_approx)}
                      </span>
                    </div>
                    <span className={`text-xs font-medium ${fiab.class}`}>
                      {fiab.label}
                    </span>
                  </div>

                  <h2 className="mt-3 font-semibold text-slate-800">
                    {e.lieu}
                    {e.region ? (
                      <span className="font-normal text-slate-500"> — {e.region}</span>
                    ) : null}
                  </h2>

                  <p className="mt-2 text-slate-600 text-sm leading-relaxed">
                    {e.description}
                  </p>

                  {(e.source_primaire || e.lien_scan) && (
                    <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                      {e.source_primaire && (
                        <p className="text-xs text-slate-400 italic">
                          Source : {e.source_primaire}
                        </p>
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
