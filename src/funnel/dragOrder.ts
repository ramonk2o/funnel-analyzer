/**
 * The list order while a stage is being dragged: the dragged stage goes before the first of the
 * other stages whose vertical midpoint is still below the pointer.
 * `midpoints` are the other stages' midpoints, in list order.
 */
export function previewOrder(order: string[], id: string, pointerY: number, midpoints: number[]): string[] {
  const others = order.filter((o) => o !== id)
  const at = midpoints.filter((mid) => mid < pointerY).length
  return [...others.slice(0, at), id, ...others.slice(at)]
}
