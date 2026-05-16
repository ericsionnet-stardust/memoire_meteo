import { createServiceClient } from '@/lib/supabase'
import { getPeriode } from '@/lib/periodes'
import Header from '@/app/components/Header'
import CarteClient from './CarteClient'

async function getGeocodedEvents(yearMin: number, yearMax: number) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('evenements_meteo')
    .select('id, lieu, region, type_phenomene, description, date_evenement, date_approx, latitude, longitude, lien_scan')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .gte('date_evenement', `${yearMin}-01-01`)
    .lte('date_evenement', `${yearMax}-12-31`)
    .order('date_evenement', { ascending: true })

  if (error) { console.error('Supabase error:', error.message); return [] }
  return data ?? []
}

export default async function CartePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params  = await searchParams
  const periode = getPeriode(typeof params.periode === 'string' ? params.periode : undefined)
  const events  = await getGeocodedEvents(periode.yearMin, periode.yearMax)

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header active="carte" />

      <div className="flex-1 max-w-6xl w-full mx-auto px-6 py-6 flex flex-col gap-4">
        <p className="text-sm text-slate-400 tabular-nums">
          {events.length} événement{events.length > 1 ? 's' : ''} géolocalisé{events.length > 1 ? 's' : ''}
          {' — '}cliquer un marqueur pour les détails
        </p>

        <div className="flex-1 min-h-[600px]">
          <CarteClient events={events} />
        </div>
      </div>
    </div>
  )
}
