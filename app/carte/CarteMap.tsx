'use client'

import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'

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

function formatDate(d: string | null, approx: string | null) {
  if (d) return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  return approx ?? '—'
}

export default function CarteMap({ events }: { events: EventPoint[] }) {
  return (
    <div className="relative w-full h-[400px] sm:h-[500px] lg:h-[600px]">
      <MapContainer
        center={[46.5, 2.5]}
        zoom={6}
        style={{ width: '100%', height: '100%', borderRadius: '0.5rem' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {events.map(e => {
          const color = COULEURS[e.type_phenomene ?? ''] ?? '#94a3b8'
          const label = LABELS[e.type_phenomene ?? ''] ?? e.type_phenomene
          return (
            <CircleMarker
              key={e.id}
              center={[e.latitude, e.longitude]}
              radius={8}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.8, weight: 1.5 }}
            >
              <Popup maxWidth={300}>
                <div className="space-y-1.5 py-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium" style={{ color }}>
                      {label}
                    </span>
                    <span className="text-xs text-slate-400 tabular-nums">
                      {formatDate(e.date_evenement, e.date_approx)}
                    </span>
                  </div>
                  <div className="font-semibold text-slate-900 text-sm leading-snug">
                    {e.lieu}
                    {e.region && <span className="font-normal text-slate-400"> — {e.region}</span>}
                  </div>
                  {e.description && (
                    <p className="text-xs text-slate-600 leading-relaxed">{e.description}</p>
                  )}
                  {e.lien_scan && (
                    <a
                      href={e.lien_scan}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline block pt-0.5"
                    >
                      Consulter la source →
                    </a>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>

      {/* Légende */}
      <div className="absolute bottom-6 left-3 z-[1000] bg-white rounded-lg border border-slate-200 p-3 space-y-1.5">
        {Object.entries(LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COULEURS[key] }} />
            <span className="text-xs text-slate-600">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
