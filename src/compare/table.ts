import type { BudgetResult } from '../funnel/calc'
import { formatMoney, formatRoas, formatRoi, formatVolume, type Separator } from '../funnel/numbers'
import { texts } from '../texts'

export interface Row {
  label: string
  /** As shown: formatted, or "—". */
  values: string[]
  best: boolean[]
}

/**
 * Which values are the best of the row: all the tied best ones, none when every value is the
 * same. Missing values ("—") don't count.
 */
export function bestOf(values: (number | null)[], better: 'higher' | 'lower'): boolean[] {
  const present = values.filter((v) => v !== null)
  const best = better === 'higher' ? Math.max(...present) : Math.min(...present)
  const allSame = present.every((v) => v === present[0])
  return values.map((v) => v !== null && !allSame && v === best)
}

interface RowSpec {
  label: string
  value: (r: BudgetResult) => number | null
  format: (n: number, sep: Separator) => string
  /** Rounds like the display does, so values that look equal tie. */
  round: (n: number) => number
  better: 'higher' | 'lower'
}

const roundTo = (places: number) => (n: number) => Math.round(n * 10 ** places) / 10 ** places

/** The comparison table's rows; a null result (invalid or impossible funnel) shows "—" throughout. */
export function comparisonRows(stageNames: string[], results: (BudgetResult | null)[], sep: Separator = 'comma'): Row[] {
  const t = texts.funnel.totals
  const money = { format: formatMoney, round: roundTo(2) }
  const specs: RowSpec[] = [
    ...stageNames.flatMap((name, i): RowSpec[] => [
      {
        label: texts.compare.volumeRow(name),
        value: (r) => r.stages[i].volume,
        format: formatVolume,
        round: roundTo(0),
        better: 'higher',
      },
      { label: texts.compare.costRow(name), value: (r) => r.stages[i].costPerResult, ...money, better: 'lower' },
    ]),
    { label: t.media, value: (r) => r.media, ...money, better: 'lower' },
    { label: t.totalCost, value: (r) => r.totalCost, ...money, better: 'lower' },
    { label: t.revenue, value: (r) => r.revenue, ...money, better: 'higher' },
    { label: t.roas, value: (r) => r.roas, format: formatRoas, round: roundTo(2), better: 'higher' },
    { label: t.roi, value: (r) => r.roi, format: formatRoi, round: roundTo(3), better: 'higher' },
  ]
  return specs.map(({ label, value, format, round, better }) => {
    const numbers = results.map((r) => {
      const v = r && value(r)
      return v === null ? null : round(v)
    })
    return {
      label,
      values: numbers.map((n) => (n === null ? texts.funnel.noValue : format(n, sep))),
      best: bestOf(numbers, better),
    }
  })
}
