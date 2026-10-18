import { useState } from 'react'
import { texts } from '../texts'
import { COST_UNITS, type CostUnit } from './calc'
import { formatConversion, formatMoney, parseDecimal } from './numbers'
import {
  addStage,
  MAX_STAGES,
  MIN_STAGES,
  moveStage,
  removeStage,
  stageDisplayName,
  stageField,
  updateStage,
  type FunnelForm,
  type StageForm,
} from './form'
import './panel.css'

const t = texts.panel

interface Props {
  form: FunnelForm
  invalid: Set<string>
  update: (change: (form: FunnelForm) => FunnelForm) => void
}

export function StagesPanel({ form, invalid, update }: Props) {
  const [dragging, setDragging] = useState<number | null>(null)
  // Accordion: at most one stage open at a time (null = all collapsed).
  const [openId, setOpenId] = useState<string | null>(form.stages[0].id)
  const [knownIds, setKnownIds] = useState(() => form.stages.map((s) => s.id))
  const count = form.stages.length

  // A stage that just appeared (added) opens; a removed open stage leaves none open.
  const ids = form.stages.map((s) => s.id)
  if (ids.join() !== knownIds.join()) {
    const added = ids.find((id) => !knownIds.includes(id))
    setKnownIds(ids)
    if (added) setOpenId(added)
  }

  const setField = (changes: Partial<FunnelForm>) => update((f) => ({ ...f, ...changes }))
  const setStage = (id: string, changes: Partial<StageForm>) => update((f) => updateStage(f, id, changes))

  return (
    <div className="stages-panel">
      <NumberField
        label={t.budget}
        value={form.budget}
        invalid={invalid.has('budget')}
        onChange={(budget) => setField({ budget })}
      />

      <div className="stages">
        {form.stages.map((stage, i) => {
          const open = openId === stage.id
          const { hasInvalid, summary } = collapsedView(form, invalid, i)

          return (
            <div
              key={stage.id}
              role="group"
              aria-labelledby={`${stage.id}-title`}
              className={`stage${open ? ' stage-open' : ''}${!open && hasInvalid ? ' stage-has-invalid' : ''}${dragging === i ? ' stage-dragging' : ''}`}
              onDragOver={(e) => dragging !== null && e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                if (dragging !== null) {
                  update((f) => moveStage(f, dragging, i))
                  setOpenId(form.stages[dragging].id)
                }
                setDragging(null)
              }}
            >
              <StageHeader
                titleId={`${stage.id}-title`}
                bodyId={`${stage.id}-body`}
                index={i}
                count={count}
                open={open}
                name={stageDisplayName(stage, i)}
                summary={summary}
                invalid={hasInvalid}
                onToggle={() => setOpenId(open ? null : stage.id)}
                onMove={(to) => {
                  update((f) => moveStage(f, i, to))
                  setOpenId(stage.id)
                }}
                onRemove={() => update((f) => removeStage(f, stage.id))}
                onDragStart={() => setDragging(i)}
                onDragEnd={() => setDragging(null)}
              />

              {open && (
                <div id={`${stage.id}-body`} className="stage-body">
                  <label className="field">
                    <span className="field-label">{t.name}</span>
                    <input
                      className="input"
                      value={stage.name}
                      onChange={(e) => setStage(stage.id, { name: e.target.value })}
                    />
                  </label>

                  {i === 0 ? (
                    <div className="field-row">
                      <label className="field">
                        <span className="field-label">{t.costUnit}</span>
                        <select
                          className="input"
                          value={form.costUnit}
                          onChange={(e) => setField({ costUnit: e.target.value as CostUnit })}
                        >
                          {COST_UNITS.map((unit) => (
                            <option key={unit} value={unit}>
                              {t.costUnits[unit]}
                            </option>
                          ))}
                        </select>
                      </label>
                      <NumberField
                        label={t.unitCost}
                        value={form.unitCost}
                        invalid={invalid.has('unitCost')}
                        onChange={(unitCost) => setField({ unitCost })}
                      />
                    </div>
                  ) : (
                    <NumberField
                      label={t.conversion}
                      value={stage.conversion}
                      invalid={invalid.has(stageField(stage.id, 'conversion'))}
                      onChange={(conversion) => setStage(stage.id, { conversion })}
                    />
                  )}

                  <NumberField
                    label={t.extraCost}
                    value={stage.extraCost}
                    invalid={invalid.has(stageField(stage.id, 'extraCost'))}
                    onChange={(extraCost) => setStage(stage.id, { extraCost })}
                  />

                  {i === count - 1 && (
                    <NumberField
                      label={t.ticket}
                      value={form.ticket}
                      invalid={invalid.has('ticket')}
                      onChange={(ticket) => setField({ ticket })}
                    />
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <button type="button" className="btn" disabled={count >= MAX_STAGES} onClick={() => update(addStage)}>
        <span aria-hidden="true">{t.icons.add}</span>
        {t.addStage}
      </button>
    </div>
  )
}

// What a collapsed stage shows: its main value, and whether any of its fields is invalid.
function collapsedView(form: FunnelForm, invalid: Set<string>, i: number) {
  const stage = form.stages[i]
  const keys = [stageField(stage.id, 'conversion'), stageField(stage.id, 'extraCost')]
  if (i === 0) keys.push('unitCost')
  if (i === form.stages.length - 1) keys.push('ticket')
  const hasInvalid = keys.some((key) => invalid.has(key))

  let summary: string
  if (i === 0) {
    const cost = parseDecimal(form.unitCost)
    summary =
      invalid.has('unitCost') || cost === null
        ? texts.funnel.noValue
        : `${formatMoney(cost)} ${texts.funnel.firstStageCost[form.costUnit]}`
  } else {
    const conversion = parseDecimal(stage.conversion)
    summary = invalid.has(keys[0]) || conversion === null ? texts.funnel.noValue : formatConversion(conversion)
  }
  return { hasInvalid, summary }
}

interface HeaderProps {
  titleId: string
  bodyId: string
  index: number
  count: number
  open: boolean
  name: string
  summary: string
  invalid: boolean
  onToggle: () => void
  onMove: (to: number) => void
  onRemove: () => void
  onDragStart: () => void
  onDragEnd: () => void
}

function StageHeader(props: HeaderProps) {
  const { titleId, bodyId, index, count, open, name, summary, invalid, onToggle } = props
  const { onMove, onRemove, onDragStart, onDragEnd } = props
  const [confirming, setConfirming] = useState(false)
  // Down to the minimum while open (another stage was removed): close it.
  if (confirming && count <= MIN_STAGES) setConfirming(false)

  return (
    <div className="stage-header">
      <span
        className="stage-handle"
        draggable
        title={t.drag}
        aria-hidden="true"
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = 'move'
          onDragStart()
        }}
        onDragEnd={onDragEnd}
      >
        {t.icons.drag}
      </span>
      <button
        type="button"
        className="stage-toggle"
        aria-expanded={open}
        aria-controls={open ? bodyId : undefined}
        onClick={onToggle}
      >
        <span className="stage-chevron" aria-hidden="true">
          {t.icons.expand}
        </span>
        <span id={titleId} className="stage-title">
          {t.stageGroup(index + 1)}
        </span>
        {!open && (
          <span className="stage-summary">
            <span className="stage-name">{name}</span>
            <span className="stage-value num">{summary}</span>
          </span>
        )}
        {!open && invalid && (
          <span className="stage-invalid" role="img" aria-label={t.invalidStage} title={t.invalidStage}>
            {t.icons.invalid}
          </span>
        )}
      </button>
      {confirming ? (
        <div className="stage-actions">
          <span className="stage-confirm">{t.confirmRemove}</span>
          <button type="button" className="btn btn-small btn-danger" onClick={onRemove}>
            {t.yes}
          </button>
          <button type="button" className="btn btn-small" onClick={() => setConfirming(false)}>
            {t.no}
          </button>
        </div>
      ) : (
        <div className="stage-actions">
          <button
            type="button"
            className="btn btn-icon btn-small"
            aria-label={t.moveUp}
            title={t.moveUp}
            disabled={index === 0}
            onClick={() => onMove(index - 1)}
          >
            {t.icons.moveUp}
          </button>
          <button
            type="button"
            className="btn btn-icon btn-small"
            aria-label={t.moveDown}
            title={t.moveDown}
            disabled={index === count - 1}
            onClick={() => onMove(index + 1)}
          >
            {t.icons.moveDown}
          </button>
          <button
            type="button"
            className="btn btn-icon btn-small"
            aria-label={t.remove}
            title={t.remove}
            disabled={count <= MIN_STAGES}
            onClick={() => setConfirming(true)}
          >
            {t.icons.remove}
          </button>
        </div>
      )}
    </div>
  )
}

interface NumberFieldProps {
  label: string
  value: string
  invalid: boolean
  onChange: (value: string) => void
}

function NumberField({ label, value, invalid, onChange }: NumberFieldProps) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <input
        className="input"
        inputMode="decimal"
        value={value}
        aria-invalid={invalid || undefined}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}
