# Backlog

Ideias de funcionalidades e a funcionalidade em construção, gerenciadas com a skill `document`. Funcionalidades implementadas saem deste arquivo: o que mudou vai para o CHANGELOG.md e as regras para o SPEC.md.

Status: **Ideia** → **Em andamento** (uma por vez) → concluída (sai do arquivo no commit que a implementa). Ideias descartadas vão para a última seção.

## Configurações

### Tela de configurações
- **Status:** Ideia
- **Motivação:** Cada pessoa digita números de um jeito; hoje o separador decimal é fixo na vírgula.
- **Descrição:** Uma tela de configurações reúne as preferências do app. A primeira é o separador decimal: vírgula ou ponto.
- **Decisões:**
  - O padrão é a vírgula.

## Funis salvos

### Escolher a ordenação da lista de funis
- **Status:** Ideia
- **Motivação:** não registrada
- **Descrição:** A pessoa escolhe como a lista de funis é ordenada, em vez de ver sempre a ordem de criação.

## Comparação

### Comparar cenários
- **Status:** Ideia
- **Motivação:** Responder perguntas como "com R$ 10 mil, qual destes cenários rende mais?", comparando variações de um mesmo funil.
- **Descrição:** No menu de funis, "Comparar" troca a área do funil por uma comparação de 2 a 3 funis com as mesmas etapas, lado a lado. Embaixo vem uma tabela comparativa. Os funis continuam editáveis pela barra lateral.
- **Decisões:**
  - **Entrar e sair:** "Comparar" fica no menu de funis. "Voltar ao funil" volta ao funil ativo.
  - **Escolha dos funis:**
    - Aparece a lista de funis com caixas de marcar, e o funil ativo já vem marcado.
    - "Mesmas etapas" quer dizer mesma quantidade e mesmos nomes na mesma ordem, sem diferenciar maiúsculas nem espaços sobrando. A unidade de custo da primeira etapa pode ser diferente.
    - Depois do primeiro marcado, só os compatíveis ficam habilitados. Os outros ficam acinzentados, com o motivo. Sem nenhum compatível, aparece a dica para duplicar o funil.
    - O máximo é 3 funis. Com 3 marcados, os outros ficam desabilitados com o motivo "Máximo de 3 funis".
    - A comparação aparece assim que houver 2 marcados, e a seleção pode mudar a qualquer momento, numa barra acima dela.
  - **Exibição:**
    - Cada funil aparece como na tela principal, com faixas de largura fixa e o nome do funil no topo, sem o bloco de investimento.
    - As faixas da mesma etapa ficam alinhadas na mesma altura.
    - A coluna do funil ativo tem borda na cor de destaque, e o destaque da etapa em edição funciona nela.
    - Em tela estreita, as colunas ficam lado a lado, com rolagem horizontal só na área da comparação.
  - **Modo e valor:**
    - A comparação tem o próprio seletor de modo, que vale para todos os funis. Ele começa no modo do funil ativo.
    - "Usar o mesmo orçamento (ou meta) para todos" vem ligada por padrão. Ligada, há um só campo (no modo meta, com "Meta em": as etapas em comum, por posição, mais "Receita"). Esse valor começa com o do funil ativo nesse modo (vazio se ele não tiver) e não muda nenhum funil salvo.
    - Desligada, cada funil usa a própria verba, ou a própria meta e etapa-alvo. Uma meta nunca definida fica vazia e conta como campo inválido.
  - **Editar durante a comparação:**
    - Clicar numa faixa ou conversão faz daquele funil o ativo (o nome dele vai para o cabeçalho) e abre a barra na etapa clicada. O botão da barra abre o funil ativo.
    - A barra esconde o seletor de modo. Com o valor comum ligado, esconde também a verba e a meta. Desligado, mostra a verba (ou a meta, com "Meta em") do próprio funil, no modo da comparação.
    - Nome, ordem e quantidade de etapas mudam em todos os funis comparados, e a barra avisa isso no topo:
      - Adicionar: a etapa nova entra no fim de todos, com o mesmo nome "Etapa N" e 10% em cada um.
      - Remover: tira a etapa da mesma posição em todos; a confirmação é "Remover de todos?".
      - Reordenar: move a mesma posição em todos; cada etapa leva os próprios números.
      - Renomear: o nome vai igual para a mesma posição em todos.
    - Conversões, custos extras, unidade e custo de mídia e ticket continuam de cada funil. Todos os funis afetados são salvos, e a meta de cada um segue a própria etapa.
    - Desmarcar o funil ativo torna ativo o primeiro marcado.
  - **Menu de funis durante a comparação:**
    - Trocar para um funil comparado o torna ativo.
    - Trocar para outro funil, Novo, Duplicar e Importar saem da comparação.
    - Renomear e Exportar mantêm a comparação.
    - Apagar o ativo tira ele da comparação; com só 1 marcado, volta a escolha.
  - **Tabela:**
    - Linhas: volume e custo por resultado de cada etapa, depois mídia, custo total, receita, ROAS e ROI.
    - O melhor valor de cada linha fica destacado: o maior em volume, receita, ROAS e ROI; o menor em custo por resultado, mídia e custo total. Empatados ficam todos destacados, e uma linha toda igual fica sem destaque. "—" não conta.
  - **Funil inválido ou com meta impossível:** pode ser comparado. A coluna mostra "Corrija os campos marcados para ver o funil" ou "Meta impossível com estes valores", e as células dele na tabela ficam com "—".
  - **Não é lembrada:** recarregar volta ao funil ativo, sem comparação.
- **Fora do escopo:** comparar funis com etapas diferentes.

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
