import { Suspense } from 'react'
import HeaderNav from './HeaderNav'

type Page = 'liste' | 'carte' | 'frise'

export default function Header({ active }: { active: Page }) {
  return (
    <header className="bg-slate-900">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-start justify-between gap-6">
          <div className="shrink-0">
            <h1 className="text-xl font-bold text-white tracking-tight">Mémoire Météo</h1>
            <p className="text-slate-400 text-xs mt-0.5">
              Événements météorologiques historiques en France
            </p>
          </div>
          <Suspense fallback={
            <nav className="flex items-center gap-5 text-sm">
              {['Liste', 'Carte', 'Frise'].map(l => (
                <span key={l} className="text-slate-400">{l}</span>
              ))}
            </nav>
          }>
            <HeaderNav active={active} />
          </Suspense>
        </div>
      </div>
    </header>
  )
}
