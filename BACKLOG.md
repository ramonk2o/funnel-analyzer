# Backlog

Ideias de funcionalidades e a funcionalidade em construção, gerenciadas com a skill `document`. Funcionalidades implementadas saem deste arquivo: o que mudou vai para o CHANGELOG.md e as regras para o SPEC.md.

Status: **Ideia** → **Em andamento** (uma por vez) → concluída (sai do arquivo no commit que a implementa). Ideias descartadas vão para a última seção.

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
