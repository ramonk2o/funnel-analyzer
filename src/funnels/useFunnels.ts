import { useRef, useState } from 'react'
import { initialForm, type FunnelForm, type Mode } from '../funnel/form'
import { changeMode, editForm, editorState, type EditorState } from '../funnel/useFunnelEditor'
import { texts } from '../texts'
import { browserStorage } from '../theme/theme'
import { funnelFromFile } from './file'
import { blankFunnelName, copyName, importedName } from './names'
import { loadLibrary, newFunnelId, saveLibrary, type Library, type SavedFunnel } from './storage'
import { templateForm, type TemplateId } from './templates'

interface State {
  library: Library
  /** The active funnel being edited. */
  editor: EditorState
}

function opened(library: Library): State {
  const active = library.funnels.find((f) => f.id === library.activeId)!
  return { library, editor: editorState(active.form) }
}

// First visit: the sample funnel becomes the first saved funnel.
function firstLibrary(): Library {
  const funnel = { id: newFunnelId(), name: texts.funnels.firstName, form: initialForm() }
  return { activeId: funnel.id, funnels: [funnel] }
}

const names = (library: Library) => library.funnels.map((f) => f.name)

/** The saved funnels and the active one's editor; every change is saved in the browser. */
export function useFunnels() {
  const [{ state, saved }, setCurrent] = useState(() => {
    const state = opened(loadLibrary(browserStorage()) ?? firstLibrary())
    return { state, saved: saveLibrary(state.library, browserStorage()) }
  })
  // Changes come one at a time from the person's actions, each building on the latest state.
  const latest = useRef(state)
  const { library, editor } = state

  // Applies a change and saves the funnels right away.
  function setState(change: (state: State) => State) {
    const next = change(latest.current)
    latest.current = next
    setCurrent({ state: next, saved: saveLibrary(next.library, browserStorage()) })
  }

  // Edits the active funnel, keeping its saved form in step.
  function edit(change: (editor: EditorState) => EditorState) {
    setState(({ library, editor }) => {
      const next = change(editor)
      const funnels = library.funnels.map((f) => (f.id === library.activeId ? { ...f, form: next.form } : f))
      return { library: { ...library, funnels }, editor: next }
    })
  }

  // Adds a funnel at the end of the list and opens it.
  function add(name: (library: Library) => string, form: FunnelForm) {
    setState(({ library }) => {
      const funnel: SavedFunnel = { id: newFunnelId(), name: name(library), form }
      return opened({ activeId: funnel.id, funnels: [...library.funnels, funnel] })
    })
  }

  const active = library.funnels.find((f) => f.id === library.activeId)!

  return {
    ...editor,
    funnels: library.funnels,
    active,
    /** False when the browser isn't keeping the funnels (blocked storage, failed save). */
    saved,
    update: (change: (form: FunnelForm) => FunnelForm) => edit((e) => editForm(e, change)),
    changeMode: (mode: Mode) => edit((e) => changeMode(e, mode)),
    select: (id: string) => setState((s) => (id === s.library.activeId ? s : opened({ ...s.library, activeId: id }))),
    create: (template: TemplateId) =>
      add(
        (l) => (template === 'blank' ? blankFunnelName(names(l)) : importedName(texts.funnels.templates[template], names(l))),
        templateForm(template),
      ),
    duplicate: () => add((l) => copyName(active.name, names(l)), active.form),
    rename(name: string) {
      setState(({ library, editor }) => {
        const funnels = library.funnels.map((f) => (f.id === library.activeId ? { ...f, name } : f))
        return { library: { ...library, funnels }, editor }
      })
    },
    remove() {
      setState(({ library }) => {
        // At least one funnel always remains.
        if (library.funnels.length <= 1) return { library, editor }
        const funnels = library.funnels.filter((f) => f.id !== library.activeId)
        return opened({ activeId: funnels[0].id, funnels })
      })
    },
    /** Imports a funnel file as a new funnel; false if the file isn't a valid funnel. */
    importFile(text: string): boolean {
      const funnel = funnelFromFile(text)
      if (funnel) add((l) => importedName(funnel.name, names(l)), funnel.form)
      return funnel !== null
    },
  }
}
