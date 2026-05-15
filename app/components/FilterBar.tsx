'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

const TYPES = [
  { value: 'inondation', label: 'Inondation', active: 'bg-blue-100 text-blue-800 border-blue-300', idle: 'bg-blue-50 text-blue-400 border-blue-100' },
  { value: 'canicule', label: 'Canicule', active: 'bg-orange-100 text-orange-800 border-orange-300', idle: 'bg-orange-50 text-orange-300 border-orange-100' },
  { value: 'neige_hors_saison', label: 'Neige hors saison', active: 'bg-sky-100 text-sky-800 border-sky-300', idle: 'bg-sky-50 text-sky-300 border-sky-100' },
  { value: 'tempete', label: 'Tempête', active: 'bg-gray-100 text-gray-800 border-gray-300', idle: 'bg-gray-50 text-gray-400 border-gray-100' },
  { value: 'secheresse', label: 'Sécheresse', active: 'bg-yellow-100 text-yellow-800 border-yellow-300', idle: 'bg-yellow-50 text-yellow-300 border-yellow-100' },
  { value: 'gel', label: 'Gel', active: 'bg-indigo-100 text-indigo-800 border-indigo-300', idle: 'bg-indigo-50 text-indigo-300 border-indigo-100' },
]

export default function FilterBar({ regions }: { regions: string[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentType = searchParams.get('type') ?? ''
  const currentRegion = searchParams.get('region') ?? ''

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) params.set(key, value)
      else params.delete(key)
      const qs = params.toString()
      router.push(qs ? `${pathname}?${qs}` : pathname)
    },
    [searchParams, pathname, router],
  )

  const hasFilters = currentType || currentRegion

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Pills par type */}
      <div className="flex flex-wrap gap-1.5">
        {TYPES.map((t) => {
          const isActive = currentType === t.value
          const isDimmed = currentType && !isActive
          return (
            <button
              key={t.value}
              onClick={() => setParam('type', isActive ? '' : t.value)}
              className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-all ${
                isDimmed ? t.idle : t.active
              }`}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Sélecteur région */}
      {regions.length > 0 && (
        <select
          value={currentRegion}
          onChange={(e) => setParam('region', e.target.value)}
          className="text-sm border border-slate-200 rounded-md px-2.5 py-1 text-slate-600 bg-white cursor-pointer"
        >
          <option value="">Toutes les régions</option>
          {regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      )}

      {/* Réinitialiser */}
      {hasFilters && (
        <button
          onClick={() => router.push(pathname)}
          className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2"
        >
          Tout afficher
        </button>
      )}
    </div>
  )
}
