import { fireEvent, render, screen, within } from '@testing-library/react'
import App from '../App'
import { texts } from '../texts'

// Extra tests written by the tester for "Arrastar etapas com pré-visualização".

const stage = (n: number) => screen.getByRole('group', { name: texts.panel.stageGroup(n) })
const openStages = () =>
  [1, 2, 3, 4].filter((n) => within(stage(n)).queryByRole('button', { expanded: true }) !== null)

test('extra: pressionar o ícone e soltar sem mover não abre, não recolhe nem reordena', () => {
  render(<App />)
  const handle = stage(3).querySelector('.stage-handle') as HTMLElement
  fireEvent.pointerDown(handle, { button: 0, clientX: 10, clientY: 10 })
  fireEvent.pointerMove(window, { clientX: 12, clientY: 12 })
  fireEvent.pointerUp(window, { clientX: 12, clientY: 12 })
  expect(openStages()).toEqual([1])
  expect(document.querySelector('.stage-placeholder')).toBeNull()
  expect(document.querySelector('.stage-ghost')).toBeNull()
})

test('extra: ícone de arrastar fica fora da árvore de acessibilidade e não é focável', () => {
  render(<App />)
  const handle = stage(2).querySelector('.stage-handle') as HTMLElement
  expect(handle).toHaveAttribute('aria-hidden', 'true')
  expect(handle.tabIndex).toBe(-1)
})
