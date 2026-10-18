import './App.css'
import { SampleFunnel } from './funnel/SampleFunnel'
import { texts } from './texts'
import { ThemeToggle } from './theme/ThemeToggle'
import { useTheme } from './theme/useTheme'

function App() {
  const [theme, toggleTheme] = useTheme()

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
          <p className="muted">{texts.panel.placeholder}</p>
        </aside>
        <section className="card app-funnel" aria-label={texts.funnel.label}>
          <div className="card-header">
            <h2 className="card-title">{texts.funnel.title}</h2>
            <span className="badge">{texts.funnel.sampleBadge}</span>
          </div>
          <SampleFunnel />
        </section>
      </main>
    </div>
  )
}

export default App
