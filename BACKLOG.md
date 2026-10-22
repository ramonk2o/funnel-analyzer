# Backlog

Ideias de funcionalidades e a funcionalidade em construção, gerenciadas com a skill `document`. Funcionalidades implementadas saem deste arquivo: o que mudou vai para o CHANGELOG.md e as regras para o SPEC.md.

Status: **Ideia** → **Em andamento** (uma por vez) → concluída (sai do arquivo no commit que a implementa). Ideias descartadas vão para a última seção.

## Configurações

### Tela de configurações
- **Status:** Ideia
- **Motivação:** Cada pessoa digita números de um jeito; hoje o separador decimal é fixo na vírgula.
- **Descrição:** Um botão de engrenagem no cabeçalho abre o modal de configurações, que reúne as preferências do app. A primeira é o separador decimal: vírgula ou ponto. Ele vale para digitar e para mostrar os números.
- **Decisões:**
  - O padrão é a vírgula.
  - Botão "Configurações" (engrenagem) no cabeçalho, à direita, ao lado do botão de tema. O tema continua no cabeçalho, fora das configurações.
  - Modal com título "Configurações" e a opção "Separador decimal": "Vírgula (1,50)" / "Ponto (1.50)". A escolha vale assim que é marcada; o modal tem só "Fechar".
  - Fundo escurecido e foco preso no modal; ao abrir, o foco vai para a opção marcada. Esc, "Fechar" ou clicar no fundo fecham, com o foco de volta na engrenagem. Funciona igual na tela principal e na comparação.
  - Digitar: a regra fica simétrica. Com ponto, "1.50", ".5" e "1." valem, e qualquer vírgula ("2,000", "1,5") deixa o campo inválido. Muda a regra do SPEC.md em "Números digitados e validação", que hoje fixa a vírgula.
  - Mostrar: os números da tela seguem o separador, e o milhar usa o outro sinal ("R$ 2,000.00", "3.20x", "45.0%"). Vale para o funil, os resultados, o resumo da etapa recolhida e a tabela da comparação. Muda a regra do SPEC.md em "Funil e resultados" sobre o separador de milhar.
  - Trocar o separador converte todo texto numérico digitado: todos os funis salvos, inclusive campos inválidos, e o valor comum da comparação. Num campo com os dois sinais ("1.234,5"), eles são trocados entre si ("1,234.5") e o campo continua inválido.
  - Os modelos entram com o separador atual (com ponto, CPC "1.50").
  - O arquivo de funil é sempre gravado com vírgula. Ao importar, o texto é convertido para o separador atual. O formato continua na versão 1, e os arquivos antigos continuam importando.
  - A escolha fica salva no navegador, na chave `analisador-de-funil:separador`, com os valores `virgula` ou `ponto`. Um valor ausente ou inválido equivale à vírgula. Com o armazenamento bloqueado, a troca funciona na sessão, só sem ficar lembrada.

## Funis salvos

### Escolher a ordenação da lista de funis
- **Status:** Ideia
- **Motivação:** não registrada
- **Descrição:** A pessoa escolhe como a lista de funis é ordenada, em vez de ver sempre a ordem de criação.

## Exportação

### Exportar imagem e PDF
- **Status:** Ideia
- **Motivação:** Levar o funil e a comparação para apresentações, mensagens e clientes.
- **Descrição:** O funil e a comparação podem ser exportados em PNG e em PDF.
- **Decisões:**
  - PNG: o funil, como aparece na tela, com título e os números principais (mídia, resultado final, custo por resultado e, se houver, receita, ROAS e ROI).
  - PDF de 1 página: a mesma imagem, a tabela das etapas (volume, conversão, custo por resultado, custo extra) e a data de geração.
  - Comparação: os funis lado a lado, mais a tabela.
  - A exportação segue o tema ativo (escuro ou claro).
  - Tudo é gerado no navegador.
- **Fora do escopo:** logo ou marca própria.

## Descartadas

### Desenho proporcional do funil
- **Descrição:** Uma barra por etapa, com largura proporcional ao volume, e quebra de escala em zigue-zague quando a conversão fica abaixo de 10%.
- **Motivo do descarte:** Construído num branch (barras alinhadas pela direita, informações numa coluna à direita, números animados) e descartado pelo usuário depois de ver o resultado. O trabalho ficou guardado no branch `desenho-proporcional`. (2026-10-19)
