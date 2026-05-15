import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase'
import Header from '@/app/components/Header'

const LABELS_PHENOMENE: Record<string, string> = {
  inondation:        'Inondation',
  canicule:          'Canicule',
  neige_hors_saison: 'Neige hors saison',
  tempete:           'Tempête',
  secheresse:        'Sécheresse',
  gel:               'Gel',
}

const COULEURS_PHENOMENE: Record<string, string> = {
  inondation:        'bg-blue-100 text-blue-800',
  canicule:          'bg-orange-100 text-orange-800',
  neige_hors_saison: 'bg-sky-100 text-sky-800',
  tempete:           'bg-gray-100 text-gray-800',
  secheresse:        'bg-yellow-100 text-yellow-800',
  gel:               'bg-indigo-100 text-indigo-800',
}

function fiabiliteLabel(n: number | null) {
  if (n === 3) return { label: 'Haute fiabilité', class: 'text-green-700' }
  if (n === 2) return { label: 'Fiabilité moyenne', class: 'text-yellow-600' }
  return { label: 'Fiabilité à vérifier', class: 'text-red-600' }
}

function formatDate(d: string | null, approx: string | null) {
  if (d) return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  return approx ?? '—'
}

async function getEvenement(id: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('evenements_meteo')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data
}

export default async function EvenementPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const e = await getEvenement(id)
  if (!e) notFound()

  const fiab = fiabiliteLabel(e.niveau_fiabilite)
  const phenoKey = e.type_phenomene ?? ''

  return (
    <div className="min-h-screen bg-slate-50">
      <Header active="frise" />

      <main className="max-w-2xl mx-auto px-6 py-10">
        <Link href="/frise" className="text-sm text-slate-400 hover:text-slate-600 inline-flex items-center gap-1 mb-8">
          ← Retour à la frise
        </Link>

        <article className="bg-white rounded-xl border border-slate-200 p-7 shadow-sm space-y-5">
          {/* En-tête */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${COULEURS_PHENOMENE[phenoKey] ?? 'bg-slate-100 text-slate-700'}`}>
                {LABELS_PHENOMENE[phenoKey] ?? phenoKey}
              </span>
              <span className="text-slate-500 text-sm">
                {formatDate(e.date_evenement, e.date_approx)}
              </span>
            </div>
            <span className={`text-xs font-medium ${fiab.class}`}>{fiab.label}</span>
          </div>

          {/* Lieu */}
          <h2 className="text-xl font-bold text-slate-900 leading-snug">
            {e.lieu}
            {e.region && <span className="font-normal text-slate-500 text-base"> — {e.region}</span>}
          </h2>

          {/* Description complète */}
          <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
            {e.description}
          </p>

          {/* Source */}
          {(e.source_primaire || e.lien_scan) && (
            <div className="border-t border-slate-100 pt-4 flex items-center justify-between gap-3 flex-wrap">
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
      </main>
    </div>
  )
}
