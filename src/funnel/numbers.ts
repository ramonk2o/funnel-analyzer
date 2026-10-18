// Typed numbers use a comma as the decimal separator and no thousands separator.
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

// Intl uses non-breaking spaces ("R$ 2,00"); plain spaces keep the texts predictable.
const plain = (text: string) => text.replace(/\s/g, ' ')

export const formatVolume = (n: number) => volume.format(n)
export const formatMoney = (n: number) => plain(money.format(n))
export const formatRoas = (n: number) => `${twoDecimals.format(n)}x`
export const formatRoi = (fraction: number) => `${oneDecimal.format(fraction * 100)}%`
export const formatConversion = (percent: number) => `${asTyped.format(percent)}%`
