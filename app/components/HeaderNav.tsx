'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { DEFAULT_PERIODE_KEY } from '@/lib/periodes'

type Page = 'liste' | 'carte' | 'frise'

const NAV_LINKS: { href: string; label: string; key: Page }[] = [
  { href: '/',      label: 'Liste', key: 'liste' },
  { href: '/carte', label: 'Carte', key: 'carte' },
  { href: '/frise', label: 'Frise', key: 'frise' },
]

export default function HeaderNav({ active }: { active: Page }) {
  const searchParams   = useSearchParams()
  const currentPeriode = searchParams.get('periode') ?? DEFAULT_PERIODE_KEY

  return (
    <nav className="flex items-center gap-4 sm:gap-5 text-sm shrink-0">
      {NAV_LINKS.map(l =>
        l.key === active ? (
          <span key={l.key} className="font-medium text-white border-b border-white pb-0.5">
            {l.label}
          </span>
        ) : (
          <Link
            key={l.key}
            href={`${l.href}?periode=${currentPeriode}`}
            className="text-slate-400 hover:text-white transition-colors"
          >
            {l.label}
          </Link>
        )
      )}
    </nav>
  )
}
