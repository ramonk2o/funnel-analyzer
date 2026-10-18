import { useState } from 'react'
import './App.css'
import { Funnel } from './funnel/Funnel'
import { StagesPanel } from './funnel/StagesPanel'
import { useFunnelEditor } from './funnel/useFunnelEditor'
import { texts } from './texts'
import { ThemeToggle } from './theme/ThemeToggle'
import { useTheme } from './theme/useTheme'

function App() {
  const [theme, toggleTheme] = useTheme()
  const { form, invalid, calculated, update } = useFunnelEditor()
  // The stage whose fields have focus: its band is highlighted in the funnel.
  const [editingId, setEditingId] = useState<string | null>(null)

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-brand">
          <span className="app-logo" aria-hidden="true" />
          <h1>{texts.appName}</h1>
        </div>
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </header>
      <main className="app-main">
        <aside className="card app-panel" aria-label={texts.panel.label}>
          <h2 className="card-title">{texts.panel.title}</h2>
          <StagesPanel form={form} invalid={invalid} update={update} onEditingChange={setEditingId} />
        </aside>
        <section className="card app-funnel" aria-label={texts.funnel.label}>
          <div className="card-header">
            <h2 className="card-title">{texts.funnel.title}</h2>
          </div>
          <Funnel calculated={calculated} highlightId={editingId} />
        </section>
      </main>
    </div>
  )
}

export default App
