import { texts } from '../texts'
import { stageDisplayName } from './form'
import { formatConversion, formatMoney, formatRoas, formatRoi, formatVolume } from './numbers'
import type { Calculated } from './useFunnelEditor'
import './funnel.css'

const t = texts.funnel

// Fixed widths, narrowing from 100% to 40%: the proportional drawing is a separate feature.
function width(index: number, count: number) {
  return 100 - (60 * index) / (count - 1)
}

interface Props {
  calculated: Calculated
  /** The stage being edited; its band (with the conversion above it) is highlighted. */
  highlightId: string | null
}

export function Funnel({ calculated, highlightId }: Props) {
  const { form, input, result } = calculated
  const count = form.stages.length
  const highlighting = form.stages.some((s) => s.id === highlightId)

  return (
    <>
      <ol className={`funnel${highlighting ? ' funnel-highlighting' : ''}`} aria-label={t.listLabel}>
        {form.stages.map((stage, i) => {
          const { volume, costPerResult } = result.stages[i]
          const cost =
            i === 0
              ? `${formatMoney(input.unitCost)} ${t.firstStageCost[input.costUnit]}`
              : costPerResult === null
                ? t.noValue
                : `${formatMoney(costPerResult)} ${t.perResult}`
          return (
            <li key={stage.id} className="funnel-step" aria-current={stage.id === highlightId || undefined}>
              {i > 0 && (
                <div className="funnel-conversion">
                  <span className="funnel-conversion-line" aria-hidden="true" />
                  <span className="num">{formatConversion(input.stages[i].conversion)}</span>
                </div>
              )}
              <div className="funnel-band" style={{ width: `${width(i, count)}%` }}>
                <span className="funnel-band-name">{stageDisplayName(stage, i)}</span>
                <span className="funnel-band-volume num">{formatVolume(volume)}</span>
                <span className="funnel-band-cost num">{cost}</span>
              </div>
            </li>
          )
        })}
      </ol>

      <dl className="totals" aria-label={t.totals.label}>
        <Total label={t.totals.media} value={formatMoney(result.media)} />
        <Total label={t.totals.extraCosts} value={formatMoney(result.extraCosts)} />
        <Total label={t.totals.totalCost} value={formatMoney(result.totalCost)} />
        {result.revenue !== null && (
          <>
            <Total label={t.totals.revenue} value={formatMoney(result.revenue)} />
            <Total label={t.totals.roas} value={result.roas === null ? t.noValue : formatRoas(result.roas)} />
            <Total label={t.totals.roi} value={result.roi === null ? t.noValue : formatRoi(result.roi)} />
          </>
        )}
      </dl>
    </>
  )
}

function Total({ label, value }: { label: string; value: string }) {
  return (
    <div className="total">
      <dt>{label}</dt>
      <dd className="num">{value}</dd>
    </div>
  )
}
