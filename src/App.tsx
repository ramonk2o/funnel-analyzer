import { useState } from 'react'
import './App.css'
import { Comparison, type Column } from './compare/Comparison'
import { comparedForm, followTarget } from './compare/scenario'
import { addStageToAll, moveStageInAll, removeStageFromAll, renameStageInAll } from './compare/structure'
import { useComparison } from './compare/useComparison'
import { fieldId, MIN_STAGES } from './funnel/form'
import { Funnel } from './funnel/Funnel'
import { BUDGET_FIELD_ID, GOAL_FIELD_ID } from './funnel/ModeFields'
import { StagesPanel, type EditRequest, type StructureEdits } from './funnel/StagesPanel'
import { editorState } from './funnel/useFunnelEditor'
import { exportFileName, funnelToFile } from './funnels/file'
import { FunnelMenu } from './funnels/FunnelMenu'
import { useFunnels } from './funnels/useFunnels'
import { Sidebar } from './sidebar/Sidebar'
import { SidebarToggle } from './sidebar/SidebarToggle'
import { useSidebar } from './sidebar/useSidebar'
import { texts } from './texts'
import { ThemeToggle } from './theme/ThemeToggle'
import { useTheme } from './theme/useTheme'

function App() {
  const [theme, toggleTheme] = useTheme()
  const funnels = useFunnels()
  const { form, invalid, impossible, calculated, update, changeMode, active } = funnels
  const [importFailed, setImportFailed] = useState(false)
  // The stage whose fields have focus: its band is highlighted in the funnel.
  const [editingId, setEditingId] = useState<string | null>(null)
  // Clicking a band or conversion in the funnel opens that stage for editing.
  const [editRequest, setEditRequest] = useState<EditRequest | null>(null)
  const { comparison, ...compare } = useComparison()
  // The stage open in the sidebar.
  const [openStageId, setOpenStageId] = useState<string | null>(null)

  // The compared funnels, in the order they were marked, calculated with the comparison's values.
  const columns: Column[] = (comparison?.selected ?? []).flatMap((id) => {
    const funnel = funnels.funnels.find((f) => f.id === id)
    return funnel ? [{ funnel, state: editorState(comparedForm(funnel.form, comparison!)) }] : []
  })
  // The active funnel in the comparison (it is one of the compared, unless none is marked).
  const activeColumn = columns.find((col) => col.funnel.id === active.id)

  // Opening the sidebar by its button focuses the value the mode starts from. In a comparison
  // with a shared value (hidden in the sidebar), it focuses the open stage's name instead.
  const shownMode = activeColumn ? activeColumn.state.form.mode : form.mode
  const sidebar = useSidebar(
    activeColumn && comparison!.shared
      ? fieldId(openStageId ?? form.stages[0].id, 'name')
      : shownMode === 'goal'
        ? GOAL_FIELD_ID
        : BUDGET_FIELD_ID,
  )
  const { buttonRef: sidebarButtonRef } = sidebar

  // The stages' names, order and number change in the active funnel or, in a comparison, in every
  // compared funnel; the shared goal follows its stage, like each funnel's own goal.
  const ids = activeColumn ? columns.map((col) => col.funnel.id) : [active.id]
  const stageCount = form.stages.length
  const followShared = (change: Parameters<typeof followTarget>[1], count: number) => {
    if (activeColumn) compare.change({ goalTarget: followTarget(comparison!.goalTarget, change, count) })
  }
  const structure: StructureEdits = {
    add: () => funnels.updateMany(ids, addStageToAll),
    remove(index) {
      if (stageCount <= MIN_STAGES) return
      funnels.updateMany(ids, (forms) => removeStageFromAll(forms, index))
      followShared({ removed: index }, stageCount - 1)
    },
    move(from, to) {
      funnels.updateMany(ids, (forms) => moveStageInAll(forms, from, to))
      followShared({ from, to }, stageCount)
    },
    rename: (index, name) => funnels.updateMany(ids, (forms) => renameStageInAll(forms, index, name)),
  }

  function edit(stageId: string, field: EditRequest['field']) {
    // The frozen funnel may still show a stage that was removed meanwhile: nothing to open.
    if (!form.stages.some((s) => s.id === stageId)) return
    sidebar.show()
    setEditRequest({ stageId, field })
  }

  // Clicking a compared funnel makes it the active one and opens the clicked stage.
  function editCompared(funnelId: string, stageId: string, field: EditRequest['field']) {
    if (funnelId !== active.id) switching(() => funnels.select(funnelId))
    sidebar.show()
    setEditRequest({ stageId, field })
  }

  function toggleCompared(id: string) {
    const selected = comparison!.selected
    const next = selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]
    compare.change({ selected: next })
    // The active funnel is always one of the marked: unmarking it makes the first marked one active,
    // and with none marked, the one marked becomes active.
    if (!next.includes(active.id) && next.length > 0) switching(() => funnels.select(next[0]))
  }

  // Opening another funnel from the menu leaves the comparison, unless it is one of the compared.
  function leaving(action: () => void) {
    compare.stop()
    switching(action)
  }

  // Another funnel opens: nothing of the previous one stays highlighted or requested.
  function switching(action: () => void) {
    setEditingId(null)
    setEditRequest(null)
    setImportFailed(false)
    action()
  }

  function exportActive() {
    const url = URL.createObjectURL(new Blob([funnelToFile(active)], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = exportFileName(active.name)
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={`app${sidebar.open ? '' : ' app-sidebar-closed'}`}>
      <header className="app-header">
        <div className="app-brand">
          <SidebarToggle ref={sidebarButtonRef} open={sidebar.open} onToggle={sidebar.toggle} />
          <span className="app-logo" aria-hidden="true" />
          <h1>{texts.appName}</h1>
          <FunnelMenu
            funnels={funnels.funnels}
            active={active}
            onSelect={(id) =>
              comparison?.selected.includes(id)
                ? switching(() => funnels.select(id))
                : leaving(() => funnels.select(id))
            }
            onCreate={(template) => leaving(() => funnels.create(template))}
            onRename={funnels.rename}
            onDuplicate={() => leaving(funnels.duplicate)}
            onRemove={() => {
              // A compared funnel leaves the comparison; the first one still marked opens next.
              const selected = comparison?.selected.filter((id) => id !== active.id)
              if (selected) compare.change({ selected })
              switching(() => funnels.remove(selected?.[0]))
            }}
            onExport={exportActive}
            comparing={comparison !== null}
            onCompare={() => compare.start(active)}
            onImport={(text) => {
              const imported = funnels.importFile(text)
              if (imported) leaving(() => {})
              setImportFailed(!imported)
            }}
          />
        </div>
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </header>
      {(!funnels.saved || importFailed) && (
        <div className="app-notices">
          {!funnels.saved && (
            <p className="app-notice" role="status">
              {texts.funnels.notSaved}
            </p>
          )}
          {importFailed && (
            <p className="app-notice" role="alert">
              {texts.funnels.invalidFile}
            </p>
          )}
        </div>
      )}
      <Sidebar open={sidebar.open} onClose={sidebar.close} buttonRef={sidebarButtonRef}>
        <aside className="card app-panel" aria-label={texts.panel.label}>
          <h2 className="card-title">{texts.panel.title}</h2>
          <StagesPanel
            key={active.id}
            form={activeColumn?.state.form ?? form}
            invalid={activeColumn?.state.invalid ?? invalid}
            update={update}
            onModeChange={changeMode}
            onEditingChange={setEditingId}
            editRequest={editRequest}
            structure={structure}
            comparing={activeColumn && { showValue: !comparison!.shared }}
            onOpenChange={setOpenStageId}
          />
        </aside>
      </Sidebar>
      <main className="app-main">
        {comparison ? (
          <Comparison
            funnels={funnels.funnels}
            activeId={active.id}
            comparison={comparison}
            columns={columns}
            highlightId={editingId}
            onToggle={toggleCompared}
            onChange={compare.change}
            onEdit={editCompared}
            onBack={compare.stop}
          />
        ) : (
          <section className="card app-funnel" aria-label={texts.funnel.label}>
            <div className="card-header">
              <h2 className="card-title">{texts.funnel.title}</h2>
            </div>
            <Funnel
              calculated={calculated}
              goalMode={form.mode === 'goal'}
              impossible={impossible}
              highlightId={editingId}
              onEdit={edit}
            />
          </section>
        )}
      </main>
    </div>
  )
}

export default App
