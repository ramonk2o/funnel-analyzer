# Changelog

Todas as mudanças relevantes deste projeto ficam registradas aqui. O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/), e as versões seguem o [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Adicionado
- **Editor do funil e modo orçamento**: o painel monta o funil (criar, nomear, remover e reordenar etapas, com setas ou arrastando) e, a partir da verba de mídia, o app calcula volumes, custo por resultado, custos extras e custo total e, com ticket médio, receita, ROAS e ROI. Tudo recalcula a cada tecla.
- **Modo meta**: além de partir de um orçamento, dá para partir de uma meta (quantidade numa etapa ou receita) e ver o investimento necessário, com mídia e custos extras. Um bloco acima do funil passa a mostrar o investimento nos dois modos.
- **Arrastar etapas com pré-visualização**: ao arrastar uma etapa, a lista mostra na hora a ordem que vai ter ao soltar; funciona também por toque, e Esc ou soltar fora da barra cancela.
- **Edição em barra lateral**: o painel de edição vira uma barra lateral recolhível à esquerda, sobre o funil, aberta pelo botão do cabeçalho ou ao clicar numa faixa; o app lembra se ela ficou aberta. O cabeçalho passa a ocupar a largura toda.
- **Clicar na faixa para editar**: clicar numa faixa (ou na conversão) do funil abre a etapa no painel com o foco no campo certo.
- **Destaque da etapa em edição**: enquanto se edita um campo de uma etapa, a faixa dela fica destacada no funil e as outras esmaecem.
- **Etapas colapsáveis**: as etapas do painel viram um acordeão, com uma aberta por vez; as recolhidas mostram o nome, o valor principal e um aviso quando têm campo inválido.
- **Visual e temas**: interface com cara de painel de controle, em tema escuro (padrão) e claro, com a escolha lembrada entre visitas. A tela já mostra um funil de exemplo.

### Corrigido
- Na etapa recolhida, o nome e o resumo ficam numa segunda linha, inteiros; antes, no painel em tela larga, o nome sumia e o resumo invadia os botões.
- Abrir e recolher etapas agora é animado, e a etapa clicada fica no lugar, em vez de pular quando uma etapa acima dela fecha.
