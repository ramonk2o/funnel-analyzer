# Changelog

Todas as mudanças relevantes deste projeto ficam registradas aqui. O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/), e as versões seguem o [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Adicionado
- **Cor de destaque**: nas configurações, dá para trocar o violeta por Azul, Verde, Laranja ou Rosa, ou digitar um hexadecimal próprio (com o seletor de cor do navegador). A cor personalizada é ajustada em cada tema, se preciso, para continuar legível, e a escolha fica lembrada.
- **Configurações**: a engrenagem no cabeçalho abre as configurações do app, com o tema e o separador decimal. Com o ponto, os números são digitados e mostrados como "1.50" e "R$ 2,000.00"; trocar o separador muda na hora todos os funis salvos, e os arquivos exportados continuam compatíveis entre quem usa vírgula e quem usa ponto.
- **Comparar cenários**: pelo menu de funis, dá para comparar de 2 a 3 funis com as mesmas etapas, lado a lado, com uma tabela que destaca o melhor valor de cada linha. Por padrão todos usam o mesmo orçamento (ou meta), e os funis continuam editáveis: nome, ordem e quantidade de etapas mudam em todos os comparados. Junto, entrar no modo meta com a meta vazia passa a preenchê-la com o que o funil mostra na etapa escolhida, e não só na primeira vez.
- **Funis salvos**: os funis ficam salvos no navegador a cada alteração. Pelo nome do funil no cabeçalho dá para ter vários funis, trocar entre eles, criar um novo em branco ou de um modelo (Tráfego pago, E-commerce, B2B), renomear, duplicar, apagar, e exportar e importar como arquivo. Recarregar a página abre o último funil, no modo em que ele estava.
- **Editor do funil e modo orçamento**: o painel monta o funil (criar, nomear, remover e reordenar etapas, com setas ou arrastando) e, a partir da verba de mídia, o app calcula volumes, custo por resultado, custos extras e custo total e, com ticket médio, receita, ROAS e ROI. Tudo recalcula a cada tecla.
- **Modo meta**: além de partir de um orçamento, dá para partir de uma meta (quantidade numa etapa ou receita) e ver o investimento necessário, com mídia e custos extras. Um bloco acima do funil passa a mostrar o investimento nos dois modos.
- **Arrastar etapas com pré-visualização**: ao arrastar uma etapa, a lista mostra na hora a ordem que vai ter ao soltar; funciona também por toque, e Esc ou soltar fora da barra cancela.
- **Edição em barra lateral**: o painel de edição vira uma barra lateral recolhível à esquerda, sobre o funil, aberta pelo botão do cabeçalho ou ao clicar numa faixa; o app lembra se ela ficou aberta. O cabeçalho passa a ocupar a largura toda.
- **Clicar na faixa para editar**: clicar numa faixa (ou na conversão) do funil abre a etapa no painel com o foco no campo certo.
- **Destaque da etapa em edição**: enquanto se edita um campo de uma etapa, a faixa dela fica destacada no funil e as outras esmaecem.
- **Etapas colapsáveis**: as etapas do painel viram um acordeão, com uma aberta por vez; as recolhidas mostram o nome, o valor principal e um aviso quando têm campo inválido.
- **Visual e temas**: interface com cara de painel de controle, em tema escuro (padrão) e claro, com a escolha lembrada entre visitas. A tela já mostra um funil de exemplo.

### Alterado
- O botão de tema sai do cabeçalho: o tema passa a ser escolhido nas configurações. Em celulares, o nome do app sai do cabeçalho para caber o nome do funil e a engrenagem.
- O app passa a se chamar **Analisador de Funil** (antes, Simulador de Funil). Funis, tema e estado da barra salvos no navegador com o nome antigo não são carregados, e arquivos exportados antes da troca não são importados.

### Corrigido
- Na etapa recolhida, o nome e o resumo ficam numa segunda linha, inteiros; antes, no painel em tela larga, o nome sumia e o resumo invadia os botões.
- Abrir e recolher etapas agora é animado, e a etapa clicada fica no lugar, em vez de pular quando uma etapa acima dela fecha.
