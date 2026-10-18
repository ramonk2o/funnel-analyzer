import { useState } from 'react'
import { texts } from '../texts'
import { COST_UNITS, type CostUnit } from './calc'
import {
  addStage,
  MAX_STAGES,
  MIN_STAGES,
  moveStage,
  removeStage,
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
  const count = form.stages.length

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
        {form.stages.map((stage, i) => (
          <div
            key={stage.id}
            role="group"
            aria-labelledby={`${stage.id}-title`}
            className={`stage${dragging === i ? ' stage-dragging' : ''}`}
            onDragOver={(e) => dragging !== null && e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              if (dragging !== null) update((f) => moveStage(f, dragging, i))
              setDragging(null)
            }}
          >
            <StageHeader
              titleId={`${stage.id}-title`}
              index={i}
              count={count}
              onMove={(to) => update((f) => moveStage(f, i, to))}
              onRemove={() => update((f) => removeStage(f, stage.id))}
              onDragStart={() => setDragging(i)}
              onDragEnd={() => setDragging(null)}
            />

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
        ))}
      </div>

      <button
        type="button"
        className="btn"
        disabled={count >= MAX_STAGES}
        onClick={() => update(addStage)}
      >
        <span aria-hidden="true">{t.icons.add}</span>
        {t.addStage}
      </button>
    </div>
  )
}

interface HeaderProps {
  titleId: string
  index: number
  count: number
  onMove: (to: number) => void
  onRemove: () => void
  onDragStart: () => void
  onDragEnd: () => void
}

function StageHeader({ titleId, index, count, onMove, onRemove, onDragStart, onDragEnd }: HeaderProps) {
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
      <span id={titleId} className="stage-title">
        {t.stageGroup(index + 1)}
      </span>
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
