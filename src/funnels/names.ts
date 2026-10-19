import { texts } from '../texts'

const fx = texts.funnels

// The first name from `candidate(1)`, `candidate(2)`… that no funnel has yet.
function firstFree(names: string[], candidate: (n: number) => string): string {
  const taken = new Set(names)
  let n = 1
  while (taken.has(candidate(n))) n++
  return candidate(n)
}

/** A new blank funnel: "Funil N", with the next free number. */
export const blankFunnelName = (names: string[]) => firstFree(names, fx.blankName)

/** A duplicate: "<name> (cópia)", then "(cópia 2)" and so on. */
export const copyName = (name: string, names: string[]) => firstFree(names, (n) => fx.copyName(name, n))

/** A funnel from a template or a file keeps its name; if it's taken, it gets "(2)", "(3)"… */
export const importedName = (name: string, names: string[]) =>
  firstFree(names, (n) => (n === 1 ? name : fx.importedName(name, n)))
