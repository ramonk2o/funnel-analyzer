import { useId } from 'react'
import { stageDisplayName, type FunnelForm } from '../funnel/form'
import { FunnelBands } from '../funnel/Funnel'
import { ModeSwitch } from '../funnel/ModeFields'
import { NumberField } from '../funnel/NumberField'
import type { EditorState } from '../funnel/useFunnelEditor'
import type { SavedFunnel } from '../funnels/storage'
import { texts } from '../texts'
import { incompatibility } from './compatible'
import { comparisonRows } from './table'
import { MAX_COMPARED, type Comparison as ComparisonState } from './useComparison'
import './compare.css'

const c = texts.compare
const t = texts.panel

/** A compared funnel, calculated with the comparison's mode and values. */
export interface Column {
  funnel: SavedFunnel
  state: EditorState
}

interface Props {
  funnels: SavedFunnel[]
  activeId: string
  comparison: ComparisonState
  columns: Column[]
  /** The stage being edited in the active funnel: its band is highlighted. */
  highlightId: string | null
  onToggle: (id: string) => void
  onChange: (changes: Partial<ComparisonState>) => void
  onEdit: (funnelId: string, stageId: string, field: 'name' | 'conversion') => void
  onBack: () => void
}

export function Comparison(props: Props) {
  const { funnels, activeId, comparison, columns, highlightId, onToggle, onChange, onEdit, onBack } = props
  const showing = columns.length >= 2

  return (
    <section className="card app-funnel compare" aria-label={c.label}>
      <div className="card-header">
        <h2 className="card-title">{c.title}</h2>
        <button type="button" className="btn btn-small" onClick={onBack}>
          {c.back}
        </button>
      </div>

      <Selection funnels={funnels} selected={comparison.selected} onToggle={onToggle} />

      {showing ? (
        <>
          <Settings comparison={comparison} reference={columns[0]} onChange={onChange} />
          <div className="compare-scroll">
            <div
              className="compare-columns"
              style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(220px, 1fr))` }}
            >
              {columns.map(({ funnel, state }) => (
                <section
                  key={funnel.id}
                  className="compare-column"
                  aria-label={c.columnLabel(funnel.name)}
                  aria-current={funnel.id === activeId || undefined}
                  style={{ gridRow: `span ${state.form.stages.length + 1}` }}
                >
                  <h3 className="compare-column-name">{funnel.name}</h3>
                  {state.calculated ? (
                    <FunnelBands
                      calculated={state.calculated}
                      goalMode={comparison.mode === 'goal'}
                      highlightId={funnel.id === activeId ? highlightId : null}
                      onEdit={(stageId, field) => onEdit(funnel.id, stageId, field)}
                    />
                  ) : (
                    <p className="funnel-empty compare-empty">
                      {state.impossible ? texts.funnel.impossible : texts.funnel.fixFields}
                    </p>
                  )}
                </section>
              ))}
            </div>
            <Table columns={columns} />
          </div>
        </>
      ) : (
        <p className="compare-hint">{c.pickMore}</p>
      )}
    </section>
  )
}

function Selection({ funnels, selected, onToggle }: Pick<Props, 'funnels' | 'onToggle'> & { selected: string[] }) {
  const uid = useId()
  const reference = funnels.find((f) => f.id === selected[0])
  const full = selected.length >= MAX_COMPARED

  // Why a funnel can't be marked, or null.
  function reason(funnel: SavedFunnel): string | null {
    if (selected.includes(funnel.id)) return null
    const problem = reference && incompatibility(reference.form, funnel.form)
    if (problem) return problem === 'count' ? c.differentCount : c.differentStages
    return full ? c.max : null
  }
  // Only the reference is marked and nothing else could be: suggest making a scenario.
  const noneCompatible =
    reference !== undefined &&
    selected.length === 1 &&
    funnels.every((f) => f.id === reference.id || incompatibility(reference.form, f.form) !== null)

  return (
    <fieldset className="compare-selection">
      <legend className="field-label">{c.selectionLabel}</legend>
      <div className="compare-choices">
        {funnels.map((funnel) => {
          const why = reason(funnel)
          return (
            <div key={funnel.id} className={`compare-choice${why ? ' compare-choice-disabled' : ''}`}>
              <label className="compare-choice-label">
                <input
                  type="checkbox"
                  checked={selected.includes(funnel.id)}
                  disabled={why !== null}
                  aria-describedby={why ? `${uid}-${funnel.id}` : undefined}
                  onChange={() => onToggle(funnel.id)}
                />
                <span>{funnel.name}</span>
              </label>
              {why && (
                <span id={`${uid}-${funnel.id}`} className="compare-choice-reason">
                  {why}
                </span>
              )}
            </div>
          )
        })}
      </div>
      {noneCompatible && <p className="compare-hint">{c.duplicateHint}</p>}
    </fieldset>
  )
}

interface SettingsProps {
  comparison: ComparisonState
  reference: Column
  onChange: (changes: Partial<ComparisonState>) => void
}

// The comparison's mode, and the shared budget or goal (on by default).
function Settings({ comparison, reference, onChange }: SettingsProps) {
  const { mode, shared, goalTarget } = comparison
  const stages: FunnelForm['stages'] = reference.funnel.form.stages
  // The shared value is invalid when the funnels, calculated with it, say so.
  const invalid = reference.state.invalid

  return (
    <div className="compare-settings">
      <ModeSwitch name="compare-mode" mode={mode} onChange={(m) => onChange({ mode: m })} />
      <label className="compare-shared">
        <input type="checkbox" checked={shared} onChange={() => onChange({ shared: !shared })} />
        <span>{c.sameValue}</span>
      </label>
      {shared &&
        (mode === 'budget' ? (
          <NumberField
            label={t.budget}
            value={comparison.budget}
            invalid={invalid.has('budget')}
            onChange={(budget) => onChange({ budget })}
          />
        ) : (
          <div className="field-row">
            <label className="field">
              <span className="field-label">{t.goalTarget}</span>
              <select
                className="input"
                value={String(goalTarget)}
                onChange={(e) => onChange({ goalTarget: e.target.value === 'revenue' ? 'revenue' : Number(e.target.value) })}
              >
                {stages.map((stage, i) => (
                  <option key={stage.id} value={i}>
                    {stageDisplayName(stage, i)}
                  </option>
                ))}
                <option value="revenue">{t.revenueTarget}</option>
              </select>
            </label>
            <NumberField
              label={goalTarget === 'revenue' ? t.goalRevenue : t.goalQuantity}
              value={comparison.goal}
              invalid={invalid.has('goal')}
              onChange={(goal) => onChange({ goal })}
            />
          </div>
        ))}
    </div>
  )
}

function Table({ columns }: { columns: Column[] }) {
  const reference = columns[0].state.form
  const rows = comparisonRows(
    reference.stages.map((s, i) => stageDisplayName(s, i)),
    columns.map(({ state }) => (state.calculated ? state.calculated.result : null)),
  )
  return (
    <table className="compare-table">
      <caption>{c.tableLabel}</caption>
      <thead>
        <tr>
          <td />
          {columns.map(({ funnel }) => (
            <th key={funnel.id} scope="col">
              {funnel.name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {/* Stage names can repeat, so rows are keyed by position. */}
        {rows.map((row, r) => (
          <tr key={r}>
            <th scope="row">{row.label}</th>
            {row.values.map((value, i) => (
              <td key={columns[i].funnel.id} className={`num${row.best[i] ? ' compare-best' : ''}`}>
                {value}
                {row.best[i] && <span className="visually-hidden"> {c.best}</span>}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
