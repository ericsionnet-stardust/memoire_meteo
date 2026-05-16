export type PeriodeKey = 'avant-1800' | 'xix' | 'xx-xxi'

export type Periode = {
  key: PeriodeKey
  label: string
  yearMin: number
  yearMax: number
  tickStep: number
}

export const PERIODES: readonly Periode[] = [
  { key: 'avant-1800', label: 'Avant 1800',  yearMin: 1000, yearMax: 1799, tickStep: 100 },
  { key: 'xix',        label: 'XIXe siècle', yearMin: 1800, yearMax: 1900, tickStep: 10  },
  { key: 'xx-xxi',     label: 'XXe – XXIe',  yearMin: 1901, yearMax: 2025, tickStep: 10  },
]

export const DEFAULT_PERIODE_KEY: PeriodeKey = 'xix'

export function getPeriode(key: string | undefined): Periode {
  return PERIODES.find(p => p.key === key) ?? PERIODES.find(p => p.key === DEFAULT_PERIODE_KEY)!
}
