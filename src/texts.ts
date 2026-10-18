// Every user-facing text lives here (PT-BR only for now).
export const texts = {
  appName: 'Simulador de Funil',
  theme: {
    switchToLight: 'Mudar para tema claro',
    switchToDark: 'Mudar para tema escuro',
  },
  panel: {
    label: 'Painel do funil',
    title: 'Etapas',
    placeholder: 'A edição das etapas chega em breve. Por enquanto, o funil mostrado é só um exemplo.',
  },
  funnel: {
    label: 'Funil',
    title: 'Funil',
    sampleBadge: 'Exemplo',
    sampleLabel: 'Funil de exemplo',
    sampleStages: [
      { name: 'Impressões', volume: '100.000', cost: 'R$ 20,00 CPM' },
      { name: 'Cliques', volume: '2.500', cost: 'R$ 0,80 por clique', conversion: '2,5%' },
      { name: 'Leads', volume: '300', cost: 'R$ 6,67 por lead', conversion: '12%' },
      { name: 'Vendas', volume: '45', cost: 'R$ 44,44 por venda', conversion: '15%' },
    ] as { name: string; volume: string; cost: string; conversion?: string }[],
  },
}
