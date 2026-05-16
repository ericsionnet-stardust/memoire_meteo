'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { PERIODES, DEFAULT_PERIODE_KEY } from '@/lib/periodes'

type Page = 'liste' | 'carte' | 'frise'

const NAV_LINKS: { href: string; label: string; key: Page }[] = [
  { href: '/',      label: 'Liste', key: 'liste' },
  { href: '/carte', label: 'Carte', key: 'carte' },
  { href: '/frise', label: 'Frise', key: 'frise' },
]

export default function HeaderNav({ active }: { active: Page }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentPeriode = searchParams.get('periode') ?? DEFAULT_PERIODE_KEY

  function withPeriode(href: string) {
    return `${href}?periode=${currentPeriode}`
  }

  function periodHref(key: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('periode', key)
    return `${pathname}?${params.toString()}`
  }

  return (
    <>
      <nav className="flex items-center gap-5 text-sm shrink-0">
        {NAV_LINKS.map(l =>
          l.key === active ? (
            <span key={l.key} className="font-medium text-white border-b border-white pb-0.5">
              {l.label}
            </span>
          ) : (
            <Link
              key={l.key}
              href={withPeriode(l.href)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              {l.label}
            </Link>
          )
        )}
      </nav>

      <div className="flex items-center gap-1 mt-3 pt-3 border-t border-slate-700/60">
        {PERIODES.map(p => (
          <Link
            key={p.key}
            href={periodHref(p.key)}
            className={
              p.key === currentPeriode
                ? 'px-3 py-1.5 rounded text-sm font-medium bg-white text-slate-900'
                : 'px-3 py-1.5 rounded text-sm text-slate-400 hover:text-white transition-colors'
            }
          >
            {p.label}
          </Link>
        ))}
      </div>
    </>
  )
}
