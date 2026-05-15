import Link from 'next/link'

type Page = 'liste' | 'carte' | 'frise'

export default function Header({ active }: { active: Page }) {
  const links: { href: string; label: string; key: Page }[] = [
    { href: '/',       label: 'Liste',  key: 'liste' },
    { href: '/carte',  label: 'Carte',  key: 'carte' },
    { href: '/frise',  label: 'Frise',  key: 'frise' },
  ]

  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Mémoire Météo</h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Événements météorologiques historiques en France — XIXe siècle
          </p>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          {links.map((l) =>
            l.key === active ? (
              <span key={l.key} className="font-medium text-slate-900 border-b-2 border-slate-900 pb-0.5">
                {l.label}
              </span>
            ) : (
              <Link key={l.key} href={l.href} className="text-slate-500 hover:text-slate-900 transition-colors">
                {l.label}
              </Link>
            ),
          )}
        </nav>
      </div>
    </header>
  )
}
