// Typed numbers are kept with a comma as the decimal separator and no thousands separator.
// Thousands separators appear only in displayed results.
// Digits may be missing on one side of the comma (",5", "1,"), not on both.
const DECIMAL = /^(\d+,?\d*|,\d+)$/

export function parseDecimal(text: string): number | null {
  const trimmed = text.trim()
  if (!DECIMAL.test(trimmed)) return null
  return Number(trimmed.replace(',', '.'))
}

const volume = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const twoDecimals = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const oneDecimal = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const asTyped = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 10 })

/**
 * The decimal separator the person types and sees. Everything typed is kept with a comma (in the
 * browser and in files); only the fields and the numbers on screen show the chosen separator.
 */
export type Separator = 'comma' | 'dot'

/** Swaps commas and dots, so the same text reads the same with the other separator. */
export const swapSeparators = (text: string) => text.replace(/[.,]/g, (c) => (c === ',' ? '.' : ','))

/** Between the comma form (what is kept, and pt-BR formatting) and the chosen separator; the swap undoes itself. */
export const shown = (text: string, sep: Separator) => (sep === 'dot' ? swapSeparators(text) : text)

// Intl uses non-breaking spaces ("R$ 2,00"); plain spaces keep the texts predictable. With a dot
// as the decimal separator, the thousands separator becomes a comma ("R$ 2,000.00").
const plain = (text: string, sep: Separator) => shown(text.replace(/\s/g, ' '), sep)

export const formatVolume = (n: number, sep: Separator = 'comma') => plain(volume.format(n), sep)
export const formatMoney = (n: number, sep: Separator = 'comma') => plain(money.format(n), sep)
export const formatRoas = (n: number, sep: Separator = 'comma') => `${plain(twoDecimals.format(n), sep)}x`
export const formatRoi = (fraction: number, sep: Separator = 'comma') => `${plain(oneDecimal.format(fraction * 100), sep)}%`
export const formatConversion = (percent: number, sep: Separator = 'comma') => `${plain(asTyped.format(percent), sep)}%`
