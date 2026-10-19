import { initialForm, setMode, updateStage, type FunnelForm } from '../funnel/form'
import { texts } from '../texts'
import { formShape } from '../test/formShape'
import { loadLibrary, saveLibrary, type Library } from './storage'

function edited(): FunnelForm {
  let form = setMode(initialForm(), 'goal', 45)
  form = { ...form, budget: '2.000', goal: '90', goalTarget: form.stages[2].id, ticket: '300' }
  return updateStage(form, form.stages[1].id, { name: '', conversion: 'abc', extraCost: '0,5' })
}

function library(): Library {
  return {
    activeId: 'b',
    funnels: [
      { id: 'a', name: 'Meu funil', form: initialForm() },
      { id: 'b', name: 'Natal', form: edited() },
    ],
  }
}

test('salvar e ler de volta devolve os funis iguais, inclusive texto inválido, modo, meta e etapa-alvo', () => {
  const saved = library()
  expect(saveLibrary(saved, localStorage)).toBe(true)
  const loaded = loadLibrary(localStorage)!
  expect(loaded.funnels.map((f) => f.name)).toEqual(['Meu funil', 'Natal'])
  expect(loaded.funnels.map((f) => formShape(f.form))).toEqual(saved.funnels.map((f) => formShape(f.form)))
  // The active funnel is still the second one.
  expect(loaded.activeId).toBe(loaded.funnels[1].id)
})

test('nada salvo, valor quebrado ou armazenamento bloqueado: não há funis para ler', () => {
  expect(loadLibrary(localStorage)).toBeNull()
  localStorage.setItem(texts.funnels.storageKey, '{quebrado')
  expect(loadLibrary(localStorage)).toBeNull()
  expect(loadLibrary(null)).toBeNull()
})

test('salvar sem armazenamento ou com falha ao gravar avisa que não salvou', () => {
  expect(saveLibrary(library(), null)).toBe(false)
  const full = { setItem: () => { throw new DOMException('full', 'QuotaExceededError') } } as unknown as Storage
  expect(saveLibrary(library(), full)).toBe(false)
})

test('um funil salvo ilegível fica de fora; os outros abrem', () => {
  saveLibrary(library(), localStorage)
  const data = JSON.parse(localStorage.getItem(texts.funnels.storageKey)!)
  data.funnels[0].form.stages = 'quebrado'
  localStorage.setItem(texts.funnels.storageKey, JSON.stringify(data))
  const loaded = loadLibrary(localStorage)!
  expect(loaded.funnels.map((f) => f.name)).toEqual(['Natal'])
  expect(loaded.activeId).toBe(loaded.funnels[0].id)
})
