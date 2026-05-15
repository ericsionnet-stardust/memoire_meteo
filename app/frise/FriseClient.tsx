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

const YEAR_MIN  = 1800
const YEAR_MAX  = 1900
const DECADES   = Array.from({ length: 11 }, (_, i) => YEAR_MIN + i * 10)

// Layout SVG — réduit et centré
const SVG_W   = 1160
const PAD_X   = 48    // marge gauche / droite
const STEP_Y  = 30    // espacement vertical entre événements superposés
const DOT_R   = 7
const MAX_ROWS = 4    // nombre max de rangées estimé (haut ou bas)

// Espace nécessaire : MAX_ROWS * STEP_Y + DOT_R*2 + marge
const ZONE_H  = MAX_ROWS * STEP_Y + DOT_R * 2 + 20
const AXIS_Y  = ZONE_H + 16           // marge haute + zone haute
const LABEL_H = 24                    // hauteur labels années
const SVG_H   = AXIS_Y + ZONE_H + LABEL_H + 16  // marge basse

function yearToX(year: number) {
  return PAD_X + ((year - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * (SVG_W - PAD_X * 2)
}

function extractYear(e: Evenement): number | null {
  if (e.date_evenement) return new Date(e.date_evenement).getFullYear()
  if (e.date_approx) {
    const m = e.date_approx.match(/\b(18\d\d)\b/)
    if (m) return parseInt(m[1])
  }
  return null
}

function formatDate(d: string | null, approx: string | null) {
  if (d) return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  return approx ?? '—'
}

type Selected = { event: Evenement; cx: number; cy: number }

export default function FriseClient({ events }: { events: Evenement[] }) {
  const [selected, setSelected] = useState<Selected | null>(null)

  const { dated, undated } = useMemo(() => {
    const dated: (Evenement & { year: number })[] = []
    const undated: Evenement[] = []
    for (const e of events) {
      const year = extractYear(e)
      if (year !== null && year >= YEAR_MIN && year <= YEAR_MAX) {
        dated.push({ ...e, year })
      } else {
        undated.push(e)
      }
    }
    dated.sort((a, b) => a.year - b.year)
    return { dated, undated }
  }, [events])

  // Position (cx, cy) de chaque événement
  const positioned = useMemo(() => {
    const countPerYear = new Map<number, number>()
    return dated.map((e) => {
      const idx = countPerYear.get(e.year) ?? 0
      countPerYear.set(e.year, idx + 1)
      const above = idx % 2 === 0
      const rank  = Math.floor(idx / 2)
      const cy    = above
        ? AXIS_Y - DOT_R * 2 - rank * STEP_Y
        : AXIS_Y + DOT_R * 2 + rank * STEP_Y
      return { ...e, cx: yearToX(e.year), cy }
    })
  }, [dated])

  function handleDotClick(e: (typeof positioned)[number]) {
    if (selected?.event.id === e.id) {
      setSelected(null)
    } else {
      setSelected({ event: e, cx: e.cx, cy: e.cy })
    }
  }

  // Position du tooltip : centré sur le dot, au-dessus si dot en bas, en dessous sinon
  const TOOLTIP_W = 420
  const TOOLTIP_EST_H = 180  // hauteur estimée pour le placement
  const tooltipStyle = selected ? (() => {
    const rawLeft = selected.cx - TOOLTIP_W / 2
    const left = Math.min(Math.max(rawLeft, 4), SVG_W - TOOLTIP_W - 4)
    const showAbove = selected.cy > AXIS_Y  // dot sous l'axe → tooltip au-dessus
    const top = showAbove
      ? selected.cy - TOOLTIP_EST_H - DOT_R - 8
      : selected.cy + DOT_R + 8
    return { left, top, width: TOOLTIP_W }
  })() : null

  return (
    <div className="space-y-5">
      {/* Conteneur SVG + tooltip superposé */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="relative" style={{ width: SVG_W, minWidth: SVG_W }}>

          <svg width={SVG_W} height={SVG_H} className="block">
            {/* Axe */}
            <line
              x1={PAD_X} y1={AXIS_Y}
              x2={SVG_W - PAD_X} y2={AXIS_Y}
              stroke="#cbd5e1" strokeWidth={2}
            />

            {/* Graduations décennie */}
            {DECADES.map((yr) => {
              const x = yearToX(yr)
              return (
                <g key={yr}>
                  <line x1={x} y1={AXIS_Y - 7} x2={x} y2={AXIS_Y + 7} stroke="#94a3b8" strokeWidth={1.5} />
                  <text x={x} y={AXIS_Y + 20} textAnchor="middle" fontSize={11} fill="#94a3b8" fontFamily="inherit">
                    {yr}
                  </text>
                </g>
              )
            })}

            {/* Demi-graduations (5 ans) */}
            {Array.from({ length: 21 }, (_, i) => YEAR_MIN + i * 5)
              .filter((yr) => yr % 10 !== 0)
              .map((yr) => (
                <line key={yr}
                  x1={yearToX(yr)} y1={AXIS_Y - 3}
                  x2={yearToX(yr)} y2={AXIS_Y + 3}
                  stroke="#e2e8f0" strokeWidth={1}
                />
              ))}

            {/* Événements */}
            {positioned.map((e) => {
              const color = COULEURS[e.type_phenomene ?? ''] ?? '#94a3b8'
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

          {/* Tooltip flottant — absolument positionné dans le conteneur SVG */}
          {selected && tooltipStyle && (
            <div
              className="absolute z-10 bg-white border border-slate-200 rounded-lg shadow-lg p-3.5 space-y-1.5"
              style={{ left: tooltipStyle.left, top: tooltipStyle.top, width: tooltipStyle.width }}
            >
              {/* En-tête */}
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
                  <span className="text-xs text-slate-400">
                    {formatDate(selected.event.date_evenement, selected.event.date_approx)}
                  </span>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="text-slate-300 hover:text-slate-500 text-base leading-none shrink-0 mt-0.5"
                  aria-label="Fermer"
                >×</button>
              </div>

              {/* Lieu */}
              <p className="text-sm font-semibold text-slate-800 leading-snug">
                {selected.event.lieu}
                {selected.event.region && (
                  <span className="font-normal text-slate-400"> — {selected.event.region}</span>
                )}
              </p>

              {/* Description */}
              <p className="text-xs text-slate-600 leading-relaxed line-clamp-4">
                {selected.event.description}
              </p>

              {/* Liens bas de carte */}
              <div className="flex items-center justify-between gap-2 pt-0.5 flex-wrap">
                {(selected.event.description?.length ?? 0) > 300 && (
                  <Link
                    href={`/evenements/${selected.event.id}`}
                    className="text-xs text-blue-500 hover:underline"
                  >
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

      {/* Légende */}
      <div className="flex flex-wrap gap-x-5 gap-y-1.5">
        {Object.entries(LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COULEURS[key] }} />
            <span className="text-xs text-slate-500">{label}</span>
          </div>
        ))}
      </div>

      {/* Événements sans date exploitable */}
      {undated.length > 0 && (
        <details className="group">
          <summary className="text-sm text-slate-400 cursor-pointer select-none hover:text-slate-600 list-none flex items-center gap-1.5">
            <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
            {undated.length} événement{undated.length > 1 ? 's' : ''} sans date précise
          </summary>
          <div className="mt-3 space-y-1.5 pl-3 border-l-2 border-slate-100">
            {undated.map((e) => (
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
