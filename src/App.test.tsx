import { render, screen } from '@testing-library/react'
import App from './App'

test('mostra o nome do produto', () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: 'Simulador de Funil' })).toBeInTheDocument()
})
