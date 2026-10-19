import type { FunnelForm } from '../funnel/form'
import { texts } from '../texts'
import { isObject, parseForm } from './parse'

const VERSION = 1

/** The exported file: the funnel as typed, with the app's mark and the format version. */
export function funnelToFile({ name, form }: { name: string; form: FunnelForm }): string {
  return JSON.stringify({ app: texts.funnels.fileApp, version: VERSION, name, funnel: form }, null, 2)
}

/** The funnel in an imported file, or null if it isn't a valid funnel from this app's format. */
export function funnelFromFile(text: string): { name: string; form: FunnelForm } | null {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return null
  }
  if (!isObject(data) || data.app !== texts.funnels.fileApp || data.version !== VERSION) return null
  if (typeof data.name !== 'string' || data.name.trim() === '') return null
  const form = parseForm(data.funnel)
  return form && { name: data.name, form }
}

/** "<name>.json", with the characters a file name can't have replaced by "-". */
export function exportFileName(name: string): string {
  // eslint-disable-next-line no-control-regex
  return `${name.replace(/[\\/:*?"<>|\u0000-\u001f]/g, '-')}.json`
}
