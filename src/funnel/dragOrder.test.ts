import { previewOrder } from './dragOrder'

// The other stages' vertical midpoints, in list order (the dragged one is left out).
const mids = [100, 200, 300] // B, C, D

test('ponteiro acima de todas: a arrastada vai para o início', () => {
  expect(previewOrder(['A', 'B', 'C', 'D'], 'D', 50, mids)).toEqual(['D', 'A', 'B', 'C'])
})

test('ponteiro entre duas etapas: entra entre elas', () => {
  expect(previewOrder(['A', 'B', 'C', 'D'], 'A', 250, mids)).toEqual(['B', 'C', 'A', 'D'])
})

test('ponteiro abaixo de todas: vai para o fim', () => {
  expect(previewOrder(['A', 'B', 'C', 'D'], 'A', 999, mids)).toEqual(['B', 'C', 'D', 'A'])
})

test('ponteiro exatamente no meio de uma etapa: ainda não passou dela', () => {
  expect(previewOrder(['A', 'B', 'C', 'D'], 'A', 200, mids)).toEqual(['B', 'A', 'C', 'D'])
})

test('a ordem das outras etapas não muda', () => {
  expect(previewOrder(['B', 'A', 'C', 'D'], 'A', 150, mids)).toEqual(['B', 'A', 'C', 'D'])
})
