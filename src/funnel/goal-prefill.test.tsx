import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { saveLibrary } from '../funnels/storage'
import { texts } from '../texts'
import { initialForm, setMode } from './form'

describe('entrar no modo meta com a meta vazia', () => {
  test('preenche com o que o funil mostra na etapa escolhida, arredondado para cima', () => {
    const form = { ...initialForm(), goalTarget: initialForm().stages[2].id, goal: '' }
    const goal = setMode(form, 'goal', 299.2)
    expect(goal.goal).toBe('300')
    expect(goal.goalTarget).toBe(form.goalTarget)
  })

  test('uma meta já digitada não muda', () => {
    const form = { ...initialForm(), goalTarget: initialForm().stages[2].id, goal: '120' }
    expect(setMode(form, 'goal', 299.2).goal).toBe('120')
  })

  test('no app: com "Meta em" escolhida e sem meta, o modo meta preenche com o volume dessa etapa', async () => {
    const form = initialForm()
    saveLibrary({ activeId: 'a', funnels: [{ id: 'a', name: 'A', form: { ...form, goalTarget: form.stages[2].id } }] }, localStorage)
    render(<App />)
    const panel = within(screen.getByRole('complementary', { name: texts.panel.label }))
    await userEvent.setup().click(panel.getByRole('radio', { name: texts.mode.goal }))
    expect(panel.getByLabelText(texts.panel.goalTarget)).toHaveDisplayValue('Leads')
    expect(panel.getByLabelText(texts.panel.goalQuantity)).toHaveValue('300')
  })
})
