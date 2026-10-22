import { useId } from 'react'
import { texts } from '../texts'
import { stageDisplayName } from './form'
import { formatConversion, formatMoney, formatRoas, formatRoi, formatVolume } from './numbers'
import { useSeparator } from '../settings/separator'
import type { Calculated } from './useFunnelEditor'
import './funnel.css'

const t = texts.funnel

// Fixed widths, narrowing from 100% to 40%: the proportional drawing is a separate feature.
function width(index: number, count: number) {
  return 100 - (60 * index) / (count - 1)
}

interface Props {
  /** Undefined when the funnel was opened with invalid fields: there is no valid result to show yet. */
  calculated: Calculated | undefined
  /** Goal mode: the block shows the investment needed (or that the goal can't be reached), and the target is tagged. */
  goalMode: boolean
  impossible: boolean
  /** The stage being edited; its band (with the conversion above it) is highlighted. */
  highlightId: string | null
  /** Opens the stage in the panel, focusing its name or its conversion. */
  onEdit: (stageId: string, field: 'name' | 'conversion') => void
}

export function Funnel({ calculated, goalMode, impossible, highlightId, onEdit }: Props) {
  const sep = useSeparator()
  if (!calculated) return <FunnelEmpty impossible={goalMode && impossible} />
  const { result } = calculated
  const target = goalMode ? calculated.goal?.target : undefined

  return (
    <>
      <section className="investment" aria-label={goalMode ? t.investment : t.investmentTotal}>
        <span className="investment-label">{goalMode ? t.investment : t.investmentTotal}</span>
        {goalMode && impossible ? (
          <span className="investment-impossible">{t.impossible}</span>
        ) : goalMode && !calculated.goal ? (
          <span className="investment-value num">{t.noValue}</span>
        ) : (
          <>
            <span className="investment-value num">
              {formatMoney(goalMode ? calculated.goal!.investment : result.totalCost, sep)}
            </span>
            <span className="investment-detail num">
              {t.investmentDetail(formatMoney(result.media, sep), formatMoney(result.extraCosts, sep))}
            </span>
          </>
        )}
      </section>

      <FunnelBands calculated={calculated} goalMode={goalMode} highlightId={highlightId} onEdit={onEdit} />

      <dl className="totals" aria-label={t.totals.label}>
        <Total label={t.totals.media} value={formatMoney(result.media, sep)} />
        <Total label={t.totals.extraCosts} value={formatMoney(result.extraCosts, sep)} />
        <Total label={t.totals.totalCost} value={formatMoney(result.totalCost, sep)} />
        {result.revenue !== null && (
          <>
            <Total label={t.totals.revenue} value={formatMoney(result.revenue, sep)} tagged={target === 'revenue'} />
            <Total label={t.totals.roas} value={result.roas === null ? t.noValue : formatRoas(result.roas, sep)} />
            <Total label={t.totals.roi} value={result.roi === null ? t.noValue : formatRoi(result.roi, sep)} />
          </>
        )}
      </dl>
    </>
  )
}

function Total({ label, value, tagged = false }: { label: string; value: string; tagged?: boolean }) {
  return (
    <div className="total">
      <dt>
        {label}
        {tagged && <GoalTag />}
      </dt>
      <dd className="num">{value}</dd>
    </div>
  )
}

function GoalTag() {
  return <span className="goal-tag">{t.goalTag}</span>
}

type BandsProps = Pick<Props, 'goalMode' | 'highlightId' | 'onEdit'> & { calculated: Calculated }

/** The funnel's bands, with the conversions between them. */
export function FunnelBands({ calculated, goalMode, highlightId, onEdit }: BandsProps) {
  const { form, input, result } = calculated
  const count = form.stages.length
  const highlighting = form.stages.some((s) => s.id === highlightId)
  const target = goalMode ? calculated.goal?.target : undefined
  // Compared funnels can share stage ids (a duplicate keeps them), so element ids get a prefix.
  const uid = useId()
  const sep = useSeparator()

  return (
    <ol className={`funnel${highlighting ? ' funnel-highlighting' : ''}`} aria-label={t.listLabel}>
      {form.stages.map((stage, i) => {
        const { volume, costPerResult } = result.stages[i]
        const name = stageDisplayName(stage, i)
        const cost =
          i === 0
            ? `${formatMoney(input.unitCost, sep)} ${t.firstStageCost[input.costUnit]}`
            : costPerResult === null
              ? t.noValue
              : `${formatMoney(costPerResult, sep)} ${t.perResult}`
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
                <span className="num">{formatConversion(input.stages[i].conversion, sep)}</span>
              </button>
            )}
            <button
              type="button"
              className="funnel-band"
              style={{ width: `${width(i, count)}%` }}
              aria-label={t.editStage(name)}
              aria-describedby={`${uid}-${stage.id}-volume ${uid}-${stage.id}-cost`}
              onClick={() => onEdit(stage.id, 'name')}
            >
              <span className="funnel-band-title">
                <span className="funnel-band-name">{name}</span>
                {target === i && <GoalTag />}
              </span>
              <span id={`${uid}-${stage.id}-volume`} className="funnel-band-volume num">
                {formatVolume(volume, sep)}
              </span>
              <span id={`${uid}-${stage.id}-cost`} className="funnel-band-cost num">
                {cost}
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}

/** In place of a funnel with nothing calculated: fields to fix, or a goal that can't be reached. */
export function FunnelEmpty({ impossible, className = '' }: { impossible: boolean; className?: string }) {
  return <p className={`funnel-empty ${className}`}>{impossible ? t.impossible : t.fixFields}</p>
}
