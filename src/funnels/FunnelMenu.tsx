import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { texts } from '../texts'
import type { SavedFunnel } from './storage'
import { TEMPLATE_IDS, type TemplateId } from './templates'
import './funnels.css'

const fx = texts.funnels

interface Props {
  funnels: SavedFunnel[]
  active: SavedFunnel
  onSelect: (id: string) => void
  onCreate: (template: TemplateId) => void
  onRename: (name: string) => void
  onDuplicate: () => void
  onRemove: () => void
  onExport: () => void
  /** Called with the chosen file's text. */
  onImport: (text: string) => void
}

type View = 'main' | 'templates' | 'confirmRemove'

/** The active funnel's name in the header; clicking it opens the menu with the funnels and their actions. */
export function FunnelMenu(props: Props) {
  const { funnels, active, onSelect, onCreate, onRename, onDuplicate, onRemove, onExport, onImport } = props
  const [view, setView] = useState<View | null>(null)
  const [renaming, setRenaming] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const open = view !== null

  // Clicking outside closes the menu.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setView(null)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  // Each view starts with focus on its first useful button: the active funnel, the first template, "No".
  useEffect(() => {
    const selector = { main: '[aria-current="true"]', templates: 'button', confirmRemove: '[data-cancel]' }
    if (view) menuRef.current?.querySelector<HTMLElement>(selector[view])?.focus()
  }, [view])

  // Closes the menu after an action, with focus back on the button.
  function done(action?: () => void) {
    action?.()
    setView(null)
    buttonRef.current?.focus()
  }

  function onMenuKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.stopPropagation()
      done()
    }
  }

  return (
    <div className="funnel-menu-root" ref={rootRef}>
      {renaming ? (
        <RenameField
          name={active.name}
          onDone={(name) => {
            setRenaming(false)
            // An empty name keeps the previous one.
            if (name !== null && name.trim() !== '') onRename(name.trim())
            requestAnimationFrame(() => buttonRef.current?.focus())
          }}
        />
      ) : (
        <button
          ref={buttonRef}
          type="button"
          className="funnel-menu-button"
          aria-label={fx.menuButton(active.name)}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setView(open ? null : 'main')}
        >
          <span className="funnel-menu-name">{active.name}</span>
          <span className="funnel-menu-chevron" aria-hidden="true">
            {texts.panel.icons.expand}
          </span>
        </button>
      )}

      {open && (
        <div ref={menuRef} className="funnel-menu" role="dialog" aria-label={fx.menuLabel} onKeyDown={onMenuKeyDown}>
          {view === 'templates' ? (
            <>
              <p className="funnel-menu-heading">{fx.templatesLabel}</p>
              <div className="funnel-menu-actions">
                {TEMPLATE_IDS.map((id) => (
                  <button key={id} type="button" className="funnel-menu-item" onClick={() => done(() => onCreate(id))}>
                    {fx.templates[id]}
                  </button>
                ))}
                <button type="button" className="funnel-menu-item funnel-menu-back" onClick={() => setView('main')}>
                  {fx.back}
                </button>
              </div>
            </>
          ) : (
            <>
              <ul className="funnel-menu-list" aria-label={fx.listLabel}>
                {funnels.map((f) => (
                  <li key={f.id}>
                    <button
                      type="button"
                      className="funnel-menu-item"
                      aria-current={f.id === active.id || undefined}
                      onClick={() => done(() => onSelect(f.id))}
                    >
                      {f.name}
                    </button>
                  </li>
                ))}
              </ul>
              {view === 'confirmRemove' ? (
                <div className="funnel-menu-confirm">
                  <p>{fx.confirmRemove(active.name)}</p>
                  <div className="funnel-menu-confirm-buttons">
                    <button type="button" className="btn btn-small btn-danger" onClick={() => done(onRemove)}>
                      {fx.yes}
                    </button>
                    <button type="button" className="btn btn-small" data-cancel onClick={() => setView('main')}>
                      {fx.no}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="funnel-menu-actions">
                  <button type="button" className="funnel-menu-item" onClick={() => setView('templates')}>
                    {fx.newFunnel}
                  </button>
                  <button
                    type="button"
                    className="funnel-menu-item"
                    onClick={() => {
                      setView(null)
                      setRenaming(true)
                    }}
                  >
                    {fx.rename}
                  </button>
                  <button type="button" className="funnel-menu-item" onClick={() => done(onDuplicate)}>
                    {fx.duplicate}
                  </button>
                  <button
                    type="button"
                    className="funnel-menu-item"
                    disabled={funnels.length <= 1}
                    onClick={() => setView('confirmRemove')}
                  >
                    {fx.remove}
                  </button>
                  <button type="button" className="funnel-menu-item" onClick={() => done(onExport)}>
                    {fx.export}
                  </button>
                  <button type="button" className="funnel-menu-item" onClick={() => done(() => fileRef.current?.click())}>
                    {fx.import}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        className="visually-hidden"
        aria-label={fx.importFile}
        tabIndex={-1}
        onChange={async (e) => {
          const file = e.currentTarget.files?.[0]
          // Cleared, so choosing the same file again still imports it.
          e.currentTarget.value = ''
          if (file) onImport(await file.text())
        }}
      />
    </div>
  )
}

/** The name as a text field, already selected: Enter or clicking outside confirms, Esc cancels (null). */
function RenameField({ name, onDone }: { name: string; onDone: (name: string | null) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const finished = useRef(false)

  useEffect(() => {
    ref.current?.focus()
    ref.current?.select()
  }, [])

  function finish(value: string | null) {
    if (finished.current) return
    finished.current = true
    onDone(value)
  }

  return (
    <input
      ref={ref}
      className="input funnel-menu-rename"
      aria-label={fx.renameLabel}
      defaultValue={name}
      onBlur={(e) => finish(e.currentTarget.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') finish(e.currentTarget.value)
        if (e.key === 'Escape') finish(null)
      }}
    />
  )
}
