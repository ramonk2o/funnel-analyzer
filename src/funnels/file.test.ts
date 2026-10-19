import { initialForm, setMode, updateStage } from '../funnel/form'
import { texts } from '../texts'
import { exportFileName, funnelFromFile, funnelToFile } from './file'
import { formShape } from '../test/formShape'

function funnel() {
  let form = setMode(initialForm(), 'goal', 45)
  form = updateStage(form, form.stages[1].id, { conversion: '2.5' })
  return { name: 'Black Friday', form }
}

test('exportar e importar devolve o mesmo funil', () => {
  const original = funnel()
  const imported = funnelFromFile(funnelToFile(original))!
  expect(imported.name).toBe('Black Friday')
  expect(formShape(imported.form)).toEqual(formShape(original.form))
})

test('o arquivo traz a marca do app e a versão do formato', () => {
  const data = JSON.parse(funnelToFile(funnel()))
  expect(data.app).toBe(texts.funnels.fileApp)
  expect(data.version).toBe(1)
  expect(data.funnel.stages).toHaveLength(4)
})

test('rejeita o que não é um funil válido', () => {
  const valid = JSON.parse(funnelToFile(funnel()))
  const without = (key: string) => {
    const copy = structuredClone(valid)
    delete copy[key]
    return JSON.stringify(copy)
  }
  const missingStageField = structuredClone(valid)
  delete missingStageField.funnel.stages[1].conversion
  // Not JSON.
  expect(funnelFromFile('oi')).toBeNull()
  // JSON, but not from the app.
  expect(funnelFromFile(JSON.stringify({ hello: 'world' }))).toBeNull()
  expect(funnelFromFile('[]')).toBeNull()
  expect(funnelFromFile('null')).toBeNull()
  // Missing fields.
  expect(funnelFromFile(without('name'))).toBeNull()
  expect(funnelFromFile(JSON.stringify(missingStageField))).toBeNull()
  // A newer version of the format.
  expect(funnelFromFile(JSON.stringify({ ...valid, version: 2 }))).toBeNull()
})

test('nome do arquivo: caracteres proibidos viram "-" e termina em .json', () => {
  expect(exportFileName('Black Friday')).toBe('Black Friday.json')
  expect(exportFileName('Q1/Q2: "teste" <a|b>?*\\')).toBe('Q1-Q2- -teste- -a-b----.json')
})

test('rejeita um arquivo com o nome vazio', () => {
  const valid = JSON.parse(funnelToFile(funnel()))
  expect(funnelFromFile(JSON.stringify({ ...valid, name: '  ' }))).toBeNull()
})
