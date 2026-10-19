import { useState } from 'react'
import './App.css'
import { Funnel } from './funnel/Funnel'
import { BUDGET_FIELD_ID, GOAL_FIELD_ID } from './funnel/ModeFields'
import { StagesPanel, type EditRequest } from './funnel/StagesPanel'
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
  // Opening the sidebar by its button focuses the value the current mode starts from.
  const sidebar = useSidebar(form.mode === 'goal' ? GOAL_FIELD_ID : BUDGET_FIELD_ID)
  const { buttonRef: sidebarButtonRef } = sidebar

  function edit(stageId: string, field: EditRequest['field']) {
    // The frozen funnel may still show a stage that was removed meanwhile: nothing to open.
    if (!form.stages.some((s) => s.id === stageId)) return
    sidebar.show()
    setEditRequest({ stageId, field })
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
            onSelect={(id) => switching(() => funnels.select(id))}
            onCreate={(template) => switching(() => funnels.create(template))}
            onRename={funnels.rename}
            onDuplicate={() => switching(funnels.duplicate)}
            onRemove={() => switching(funnels.remove)}
            onExport={exportActive}
            onImport={(text) => {
              const imported = funnels.importFile(text)
              if (imported) switching(() => {})
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
            form={form}
            invalid={invalid}
            update={update}
            onModeChange={changeMode}
            onEditingChange={setEditingId}
            editRequest={editRequest}
          />
        </aside>
      </Sidebar>
      <main className="app-main">
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
      </main>
    </div>
  )
}

export default App
