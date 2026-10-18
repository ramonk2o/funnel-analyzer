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
  /** Opens the stage in the panel, focusing its name or its conversion. */
  onEdit: (stageId: string, field: 'name' | 'conversion') => void
}

export function Funnel({ calculated, highlightId, onEdit }: Props) {
  const { form, input, result } = calculated
  const count = form.stages.length
  const highlighting = form.stages.some((s) => s.id === highlightId)

  return (
    <>
      <ol className={`funnel${highlighting ? ' funnel-highlighting' : ''}`} aria-label={t.listLabel}>
        {form.stages.map((stage, i) => {
          const { volume, costPerResult } = result.stages[i]
          const name = stageDisplayName(stage, i)
          const cost =
            i === 0
              ? `${formatMoney(input.unitCost)} ${t.firstStageCost[input.costUnit]}`
              : costPerResult === null
                ? t.noValue
                : `${formatMoney(costPerResult)} ${t.perResult}`
          return (
            <li key={stage.id} className="funnel-step" aria-current={stage.id === highlightId || undefined}>
              {i > 0 && (
                <button
                  type="button"
                  className="funnel-conversion"
                  aria-label={t.editConversion(name)}
                  onClick={() => onEdit(stage.id, 'conversion')}
                >
                  <span className="funnel-conversion-line" aria-hidden="true" />
                  <span className="num">{formatConversion(input.stages[i].conversion)}</span>
                </button>
              )}
              <button
                type="button"
                className="funnel-band"
                style={{ width: `${width(i, count)}%` }}
                aria-label={t.editStage(name)}
                aria-describedby={`${stage.id}-band-volume ${stage.id}-band-cost`}
                onClick={() => onEdit(stage.id, 'name')}
              >
                <span className="funnel-band-name">{name}</span>
                <span id={`${stage.id}-band-volume`} className="funnel-band-volume num">
                  {formatVolume(volume)}
                </span>
                <span id={`${stage.id}-band-cost`} className="funnel-band-cost num">
                  {cost}
                </span>
              </button>
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
