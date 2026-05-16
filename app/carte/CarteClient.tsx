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
  { value: 'inondation',        label: 'Inondation',        dot: '#3b82f6', active: 'bg-blue-100 text-blue-800 border-blue-300',      idle: 'bg-white text-blue-300 border-blue-100' },
  { value: 'canicule',          label: 'Canicule',          dot: '#f97316', active: 'bg-orange-100 text-orange-800 border-orange-300',  idle: 'bg-white text-orange-300 border-orange-100' },
  { value: 'neige_hors_saison', label: 'Neige hors saison', dot: '#0ea5e9', active: 'bg-sky-100 text-sky-800 border-sky-300',           idle: 'bg-white text-sky-300 border-sky-100' },
  { value: 'tempete',           label: 'Tempête',           dot: '#6b7280', active: 'bg-gray-100 text-gray-800 border-gray-300',        idle: 'bg-white text-gray-300 border-gray-200' },
  { value: 'secheresse',        label: 'Sécheresse',        dot: '#eab308', active: 'bg-yellow-100 text-yellow-800 border-yellow-300',  idle: 'bg-white text-yellow-300 border-yellow-100' },
  { value: 'gel',               label: 'Gel',               dot: '#6366f1', active: 'bg-indigo-100 text-indigo-800 border-indigo-300',  idle: 'bg-white text-indigo-300 border-indigo-100' },
]

const CarteMap = dynamic(() => import('./CarteMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-50 rounded-lg border border-slate-200">
      <span className="text-slate-400 text-sm">Chargement de la carte…</span>
    </div>
  ),
})

export default function CarteClient({ events }: { events: EventPoint[] }) {
  const [selectedType,   setSelectedType]   = useState('')
  const [selectedRegion, setSelectedRegion] = useState('')

  const regions = useMemo(() => {
    const unique = [...new Set(events.map(e => e.region).filter(Boolean) as string[])]
    return unique.sort((a, b) => a.localeCompare(b, 'fr'))
  }, [events])

  const filtered = useMemo(
    () => events.filter(e => {
      if (selectedType   && e.type_phenomene !== selectedType)   return false
      if (selectedRegion && e.region         !== selectedRegion) return false
      return true
    }),
    [events, selectedType, selectedRegion],
  )

  const countByType = useMemo(
    () => TYPES.map(t => ({ ...t, count: filtered.filter(e => e.type_phenomene === t.value).length }))
               .filter(t => t.count > 0),
    [filtered],
  )

  const hasFilter = selectedType || selectedRegion

  return (
    <div className="flex flex-col gap-3">

      {/* Filtres */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex flex-wrap gap-1.5">
          {TYPES.map(t => {
            const isActive = selectedType === t.value
            const isDimmed = selectedType && !isActive
            return (
              <button
                key={t.value}
                onClick={() => setSelectedType(isActive ? '' : t.value)}
                className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-all ${isDimmed ? t.idle : t.active}`}
              >
                {t.label}
              </button>
            )
          })}
        </div>

        {regions.length > 0 && (
          <select
            value={selectedRegion}
            onChange={e => setSelectedRegion(e.target.value)}
            className="text-sm border border-slate-200 rounded-md px-2.5 py-1 text-slate-600 bg-white cursor-pointer"
          >
            <option value="">Toutes les régions</option>
            {regions.map(r => <option key={r} value={r}>{r}</option>)}
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
      </div>

      {/* Barre de stats */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 py-3 border-y border-slate-100">
        <span className="text-sm font-semibold text-slate-900 tabular-nums">
          {filtered.length} événement{filtered.length > 1 ? 's' : ''}
          {hasFilter && <span className="font-normal text-slate-400"> / {events.length} total</span>}
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

      {/* Carte */}
      <CarteMap events={filtered} />
    </div>
  )
}
