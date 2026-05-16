'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { PERIODES, DEFAULT_PERIODE_KEY } from '@/lib/periodes'

export default function PeriodTabs() {
  const pathname    = usePathname()
  const searchParams = useSearchParams()
  const current     = searchParams.get('periode') ?? DEFAULT_PERIODE_KEY

  function periodHref(key: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('periode', key)
    return `${pathname}?${params.toString()}`
  }

  return (
    <div className="flex items-center gap-1">
      {PERIODES.map(p => (
        <Link
          key={p.key}
          href={periodHref(p.key)}
          className={
            p.key === current
              ? 'px-3 py-1.5 rounded text-sm font-medium bg-white text-slate-900'
              : 'px-3 py-1.5 rounded text-sm text-slate-400 hover:text-white transition-colors'
          }
        >
          {p.label}
        </Link>
      ))}
    </div>
  )
}
