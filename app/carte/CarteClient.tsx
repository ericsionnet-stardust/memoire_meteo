'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'

type EventPoint = {
  id: string
  lieu: string | null
  region: string | null
  type_phenomene: string | null
  description: string | null
  date_evenement: string | null
  date_approx: string | null
  latitude: number
  longitude: number
  lien_scan: string | null
}

const TYPES = [
  { value: 'inondation',       label: 'Inondation',       active: 'bg-blue-100 text-blue-800 border-blue-300',   idle: 'bg-blue-50 text-blue-300 border-blue-100' },
  { value: 'canicule',         label: 'Canicule',         active: 'bg-orange-100 text-orange-800 border-orange-300', idle: 'bg-orange-50 text-orange-300 border-orange-100' },
  { value: 'neige_hors_saison',label: 'Neige hors saison',active: 'bg-sky-100 text-sky-800 border-sky-300',      idle: 'bg-sky-50 text-sky-300 border-sky-100' },
  { value: 'tempete',          label: 'Tempête',          active: 'bg-gray-100 text-gray-800 border-gray-300',   idle: 'bg-gray-50 text-gray-400 border-gray-100' },
  { value: 'secheresse',       label: 'Sécheresse',       active: 'bg-yellow-100 text-yellow-800 border-yellow-300', idle: 'bg-yellow-50 text-yellow-300 border-yellow-100' },
  { value: 'gel',              label: 'Gel',              active: 'bg-indigo-100 text-indigo-800 border-indigo-300', idle: 'bg-indigo-50 text-indigo-300 border-indigo-100' },
]

const CarteMap = dynamic(() => import('./CarteMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-100 rounded-lg">
      <span className="text-slate-400 text-sm">Chargement de la carte…</span>
    </div>
  ),
})

export default function CarteClient({ events }: { events: EventPoint[] }) {
  const [selectedType, setSelectedType] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('')

  const regions = useMemo(() => {
    const unique = [...new Set(events.map((e) => e.region).filter(Boolean) as string[])]
    return unique.sort((a, b) => a.localeCompare(b, 'fr'))
  }, [events])

  const filtered = useMemo(
    () =>
      events.filter((e) => {
        if (selectedType && e.type_phenomene !== selectedType) return false
        if (selectedRegion && e.region !== selectedRegion) return false
        return true
      }),
    [events, selectedType, selectedRegion],
  )

  const hasFilter = selectedType || selectedRegion

  return (
    <div className="flex flex-col gap-3">
      {/* Barre de filtres */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex flex-wrap gap-1.5">
          {TYPES.map((t) => {
            const isActive = selectedType === t.value
            const isDimmed = selectedType && !isActive
            return (
              <button
                key={t.value}
                onClick={() => setSelectedType(isActive ? '' : t.value)}
                className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-all ${
                  isDimmed ? t.idle : t.active
                }`}
              >
                {t.label}
              </button>
            )
          })}
        </div>

        {regions.length > 0 && (
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="text-sm border border-slate-200 rounded-md px-2.5 py-1 text-slate-600 bg-white cursor-pointer"
          >
            <option value="">Toutes les régions</option>
            {regions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        )}

        {hasFilter && (
          <button
            onClick={() => { setSelectedType(''); setSelectedRegion('') }}
            className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2"
          >
            Tout afficher
          </button>
        )}

        <span className="text-xs text-slate-400 ml-auto">
          {filtered.length} / {events.length} événement{events.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Carte */}
      <CarteMap events={filtered} />
    </div>
  )
}
