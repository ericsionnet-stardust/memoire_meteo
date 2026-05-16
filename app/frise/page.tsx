import { createServiceClient } from '@/lib/supabase'
import { getPeriode } from '@/lib/periodes'
import Header from '@/app/components/Header'
import FriseClient from './FriseClient'

async function getEvenements() {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('evenements_meteo')
    .select('id, date_evenement, date_approx, lieu, region, type_phenomene, description, source_primaire, niveau_fiabilite, lien_scan')
    .order('date_evenement', { ascending: true })

  if (error) { console.error('Supabase error:', error.message); return [] }
  return data ?? []
}

export default async function FrisePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params  = await searchParams
  const periode = getPeriode(typeof params.periode === 'string' ? params.periode : undefined)
  const events  = await getEvenements()

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header active="frise" />

      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Frise chronologique</h2>
          <p className="text-sm text-slate-400 mt-0.5 tabular-nums">
            {events.length} événement{events.length > 1 ? 's' : ''} — cliquer un point pour les détails
          </p>
        </div>

        <FriseClient
          events={events}
          yearMin={periode.yearMin}
          yearMax={periode.yearMax}
          tickStep={periode.tickStep}
        />
      </main>
    </div>
  )
}
