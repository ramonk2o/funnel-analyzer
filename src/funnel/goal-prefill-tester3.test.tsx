import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { saveLibrary } from '../funnels/storage'
import { texts } from '../texts'
import { initialForm, setMode } from './form'

// Extra tests written by the independent tester (third round).
const panel = () => within(screen.getByRole('complementary', { name: texts.panel.label }))

test('tester3: meta na receita e vazia: preenche com a receita arredondada para cima', () => {
  const form = { ...initialForm(), goalTarget: 'revenue', goal: '' }
  const goal = setMode(form, 'goal', 1234.01)
  expect(goal.goal).toBe('1235')
  expect(goal.goalTarget).toBe('revenue')
})

test('tester3: nenhuma etapa escolhida: vai para a última etapa', () => {
  const form = initialForm()
  const goal = setMode(form, 'goal', 44.2)
  expect(goal.goalTarget).toBe(form.stages.at(-1)!.id)
  expect(goal.goal).toBe('45')
})

test('tester3: volume 0 vira 1', () => {
  expect(setMode({ ...initialForm(), goal: '' }, 'goal', 0).goal).toBe('1')
})

test('tester3: meta só com espaços conta como vazia', () => {
  const form = { ...initialForm(), goalTarget: initialForm().stages[2].id, goal: '   ' }
  expect(setMode(form, 'goal', 299.2).goal).toBe('300')
})

test('tester3: no app, "Meta em" Receita e meta vazia: preenche com a receita mostrada', async () => {
  // 45 sales x R$ 100 = R$ 4.500 revenue.
  const form = { ...initialForm(), ticket: '100', goalTarget: 'revenue' }
  saveLibrary({ activeId: 'a', funnels: [{ id: 'a', name: 'A', form }] }, localStorage)
  render(<App />)
  await userEvent.setup().click(panel().getByRole('radio', { name: texts.mode.goal }))
  expect(panel().getByLabelText(texts.panel.goalTarget)).toHaveDisplayValue(texts.panel.revenueTarget)
  expect(panel().getByLabelText(texts.panel.goalRevenue)).toHaveValue('4500')
})
