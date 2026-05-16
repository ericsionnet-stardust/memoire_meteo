import { Suspense } from 'react'
import HeaderNav from './HeaderNav'
import PeriodTabs from './PeriodTabs'

type Page = 'liste' | 'carte' | 'frise'

export default function Header({ active }: { active: Page }) {
  return (
    <header className="bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">

        {/* Ligne 1 : titre + nav */}
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">Mémoire Météo</h1>
            <p className="text-slate-400 text-xs mt-0.5 hidden sm:block">
              Événements météorologiques historiques en France
            </p>
          </div>
          <Suspense fallback={
            <nav className="flex items-center gap-4 text-sm shrink-0">
              {['Liste', 'Carte', 'Frise'].map(l => (
                <span key={l} className="text-slate-400">{l}</span>
              ))}
            </nav>
          }>
            <HeaderNav active={active} />
          </Suspense>
        </div>

        {/* Ligne 2 : onglets de période — toujours pleine largeur */}
        <div className="mt-3 pt-3 border-t border-slate-700/60">
          <Suspense fallback={<div className="h-8" />}>
            <PeriodTabs />
          </Suspense>
        </div>

      </div>
    </header>
  )
}
