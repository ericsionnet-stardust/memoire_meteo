'use client'

import Link from 'next/link'
import { useState, useMemo } from 'react'

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
}

const COULEURS: Record<string, string> = {
  inondation:        '#3b82f6',
  canicule:          '#f97316',
  neige_hors_saison: '#0ea5e9',
  tempete:           '#6b7280',
  secheresse:        '#eab308',
  gel:               '#6366f1',
}

const LABELS: Record<string, string> = {
  inondation:        'Inondation',
  canicule:          'Canicule',
  neige_hors_saison: 'Neige hors saison',
  tempete:           'Tempête',
  secheresse:        'Sécheresse',
  gel:               'Gel',
}

// Layout SVG
const SVG_W    = 1160
const PAD_X    = 48
const STEP_Y   = 30
const DOT_R    = 7
const MAX_ROWS = 4

const ZONE_H  = MAX_ROWS * STEP_Y + DOT_R * 2 + 20
const AXIS_Y  = ZONE_H + 16
const LABEL_H = 24
const SVG_H   = AXIS_Y + ZONE_H + LABEL_H + 16

function yearToX(year: number, yearMin: number, yearMax: number) {
  return PAD_X + ((year - yearMin) / (yearMax - yearMin)) * (SVG_W - PAD_X * 2)
}

function extractYear(e: Evenement, yearMin: number, yearMax: number): number | null {
  if (e.date_evenement) {
    const y = new Date(e.date_evenement).getFullYear()
    return y >= yearMin && y <= yearMax ? y : null
  }
  if (e.date_approx) {
    const matches = e.date_approx.match(/\b(\d{3,4})\b/g)
    if (matches) {
      for (const m of matches) {
        const y = parseInt(m)
        if (y >= yearMin && y <= yearMax) return y
      }
    }
  }
  return null
}

function formatDate(d: string | null, approx: string | null) {
  if (d) return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  return approx ?? '—'
}

type Selected = { event: Evenement; cx: number; cy: number }

type Props = {
  events: Evenement[]
  yearMin: number
  yearMax: number
  tickStep: number
}

export default function FriseClient({ events, yearMin, yearMax, tickStep }: Props) {
  const [selected,     setSelected]     = useState<Selected | null>(null)
  const [hiddenTypes,  setHiddenTypes]  = useState<Set<string>>(new Set())

  function toggleType(type: string) {
    setHiddenTypes(prev => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
    setSelected(null)
  }

  const ticks = useMemo(() =>
    Array.from(
      { length: Math.floor((yearMax - yearMin) / tickStep) + 1 },
      (_, i) => yearMin + i * tickStep,
    ),
    [yearMin, yearMax, tickStep],
  )

  const { dated, undated } = useMemo(() => {
    const dated: (Evenement & { year: number })[] = []
    const undated: Evenement[] = []
    for (const e of events) {
      const year = extractYear(e, yearMin, yearMax)
      if (year !== null) dated.push({ ...e, year })
      else undated.push(e)
    }
    dated.sort((a, b) => a.year - b.year)
    return { dated, undated }
  }, [events, yearMin, yearMax])

  const positioned = useMemo(() => {
    const countPerYear = new Map<number, number>()
    return dated.map(e => {
      const idx   = countPerYear.get(e.year) ?? 0
      countPerYear.set(e.year, idx + 1)
      const above = idx % 2 === 0
      const rank  = Math.floor(idx / 2)
      const cy    = above
        ? AXIS_Y - DOT_R * 2 - rank * STEP_Y
        : AXIS_Y + DOT_R * 2 + rank * STEP_Y
      return { ...e, cx: yearToX(e.year, yearMin, yearMax), cy }
    })
  }, [dated, yearMin, yearMax])

  const visible = useMemo(
    () => positioned.filter(e => !hiddenTypes.has(e.type_phenomene ?? '')),
    [positioned, hiddenTypes],
  )

  function handleDotClick(e: (typeof positioned)[number]) {
    setSelected(prev => prev?.event.id === e.id ? null : { event: e, cx: e.cx, cy: e.cy })
  }

  const TOOLTIP_W     = 420
  const TOOLTIP_EST_H = 180
  const tooltipStyle = selected ? (() => {
    const rawLeft   = selected.cx - TOOLTIP_W / 2
    const left      = Math.min(Math.max(rawLeft, 4), SVG_W - TOOLTIP_W - 4)
    const showAbove = selected.cy > AXIS_Y
    const top       = showAbove
      ? selected.cy - TOOLTIP_EST_H - DOT_R - 8
      : selected.cy + DOT_R + 8
    return { left, top, width: TOOLTIP_W }
  })() : null

  const allTypes = Object.keys(LABELS)
  const hasFilter = hiddenTypes.size > 0

  return (
    <div className="space-y-4">

      {/* Filtres par type */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5">
          {allTypes.map(type => {
            const hidden  = hiddenTypes.has(type)
            const color   = COULEURS[type]
            return (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-all ${
                  hidden
                    ? 'bg-white text-slate-300 border-slate-200'
                    : 'border-transparent'
                }`}
                style={hidden ? {} : {
                  backgroundColor: color + '20',
                  color,
                  borderColor: color + '40',
                }}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: hidden ? '#cbd5e1' : color }}
                />
                {LABELS[type]}
              </button>
            )
          })}
        </div>
        {hasFilter && (
          <button
            onClick={() => { setHiddenTypes(new Set()); setSelected(null) }}
            className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2"
          >
            Tout afficher
          </button>
        )}
        <span className="text-xs text-slate-400 ml-auto tabular-nums">
          {visible.length} / {positioned.length} événement{positioned.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* SVG + tooltip */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <div className="relative" style={{ width: SVG_W, minWidth: SVG_W }}>

          <svg width={SVG_W} height={SVG_H} className="block">
            {/* Axe */}
            <line x1={PAD_X} y1={AXIS_Y} x2={SVG_W - PAD_X} y2={AXIS_Y} stroke="#cbd5e1" strokeWidth={2} />

            {/* Graduations principales */}
            {ticks.map(yr => {
              const x = yearToX(yr, yearMin, yearMax)
              return (
                <g key={yr}>
                  <line x1={x} y1={AXIS_Y - 7} x2={x} y2={AXIS_Y + 7} stroke="#94a3b8" strokeWidth={1.5} />
                  <text x={x} y={AXIS_Y + 20} textAnchor="middle" fontSize={11} fill="#94a3b8" fontFamily="inherit">
                    {yr}
                  </text>
                </g>
              )
            })}

            {/* Demi-graduations */}
            {tickStep <= 10 && Array.from(
              { length: Math.floor((yearMax - yearMin) / 5) + 1 },
              (_, i) => yearMin + i * 5,
            ).filter(yr => yr % tickStep !== 0).map(yr => (
              <line key={yr}
                x1={yearToX(yr, yearMin, yearMax)} y1={AXIS_Y - 3}
                x2={yearToX(yr, yearMin, yearMax)} y2={AXIS_Y + 3}
                stroke="#e2e8f0" strokeWidth={1}
              />
            ))}

            {/* Événements */}
            {visible.map(e => {
              const color      = COULEURS[e.type_phenomene ?? ''] ?? '#94a3b8'
              const isSelected = selected?.event.id === e.id
              return (
                <g key={e.id} onClick={() => handleDotClick(e)} style={{ cursor: 'pointer' }}>
                  <line
                    x1={e.cx} y1={e.cy > AXIS_Y ? e.cy - DOT_R : e.cy + DOT_R}
                    x2={e.cx} y2={AXIS_Y}
                    stroke={color} strokeWidth={1} strokeOpacity={0.3} strokeDasharray="3 2"
                  />
                  <circle
                    cx={e.cx} cy={e.cy}
                    r={isSelected ? DOT_R + 2 : DOT_R}
                    fill={color}
                    fillOpacity={isSelected ? 1 : 0.82}
                    stroke={isSelected ? '#1e293b' : 'white'}
                    strokeWidth={isSelected ? 2 : 1.5}
                  />
                </g>
              )
            })}
          </svg>

          {/* Tooltip */}
          {selected && tooltipStyle && (
            <div
              className="absolute z-10 bg-white border border-slate-200 rounded-lg shadow-lg p-3.5 space-y-1.5"
              style={{ left: tooltipStyle.left, top: tooltipStyle.top, width: tooltipStyle.width }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: (COULEURS[selected.event.type_phenomene ?? ''] ?? '#94a3b8') + '22',
                      color: COULEURS[selected.event.type_phenomene ?? ''] ?? '#94a3b8',
                    }}
                  >
                    {LABELS[selected.event.type_phenomene ?? ''] ?? selected.event.type_phenomene}
                  </span>
                  <span className="text-xs text-slate-400 tabular-nums">
                    {formatDate(selected.event.date_evenement, selected.event.date_approx)}
                  </span>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="text-slate-300 hover:text-slate-500 text-base leading-none shrink-0 mt-0.5"
                  aria-label="Fermer"
                >×</button>
              </div>

              <p className="text-sm font-semibold text-slate-800 leading-snug">
                {selected.event.lieu}
                {selected.event.region && (
                  <span className="font-normal text-slate-400"> — {selected.event.region}</span>
                )}
              </p>

              <p className="text-xs text-slate-600 leading-relaxed line-clamp-4">
                {selected.event.description}
              </p>

              <div className="flex items-center justify-between gap-2 pt-0.5 flex-wrap">
                {(selected.event.description?.length ?? 0) > 300 && (
                  <Link href={`/evenements/${selected.event.id}`} className="text-xs text-blue-500 hover:underline">
                    Lire la suite →
                  </Link>
                )}
                {selected.event.lien_scan && (
                  <a
                    href={selected.event.lien_scan}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-slate-400 hover:text-blue-500 hover:underline ml-auto"
                  >
                    Source →
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Événements sans date */}
      {undated.length > 0 && (
        <details className="group">
          <summary className="text-sm text-slate-400 cursor-pointer select-none hover:text-slate-600 list-none flex items-center gap-1.5">
            <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
            {undated.length} événement{undated.length > 1 ? 's' : ''} sans date précise pour cette période
          </summary>
          <div className="mt-3 space-y-1.5 pl-3 border-l-2 border-slate-100">
            {undated.map(e => (
              <div key={e.id} className="text-sm">
                <span
                  className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle"
                  style={{ backgroundColor: COULEURS[e.type_phenomene ?? ''] ?? '#94a3b8' }}
                />
                <span className="text-slate-700 font-medium">{e.lieu}</span>
                <span className="text-slate-400 ml-1.5">{e.date_approx ?? '—'}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
