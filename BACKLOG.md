# Backlog

Ideias de funcionalidades e a funcionalidade em construção, gerenciadas com a skill `document`. Funcionalidades implementadas saem deste arquivo: o que mudou vai para o CHANGELOG.md e as regras para o SPEC.md.

Status: **Ideia** → **Em andamento** (uma por vez) → concluída (sai do arquivo no commit que a implementa). Ideias descartadas vão para a última seção.

## Configurações

### Cor de destaque
- **Status:** Ideia
- **Motivação:** Personalizar o app ao gosto de cada pessoa ou à marca com que ela trabalha; hoje o destaque é sempre violeta.
- **Descrição:** Nas configurações, a pessoa escolhe a cor de destaque entre cores prontas ou digita um hexadecimal próprio. A cor vale na hora, nos dois temas, e fica lembrada.
- **Decisões:**
  - Grupo "Cor de destaque" no modal, entre "Tema" e "Separador decimal": uma bolinha por cor pronta e a opção "Personalizada". As bolinhas não têm texto; o nome da cor é o nome acessível e a dica ao passar o mouse.
  - Cores prontas: Violeta (a atual, padrão), Azul, Verde, Laranja e Rosa, cada uma com uma versão para o tema escuro e outra para o claro. Os tons ficam para a construção, mas um teste garante para todas: destaque e destaque forte com contraste de pelo menos 4,5:1 com todo fundo, e a versão do tema claro mais escura que a do escuro, no mesmo matiz. Muda a regra do SPEC.md em "Aparência e temas" que fixa o violeta.
  - "Personalizada" mostra um campo de texto para o hexadecimal e um seletor de cor do navegador ligado a ele. Aceita "#7c3aed", "7c3aed", "#73e", com letras maiúsculas ou minúsculas. Valor inválido deixa o campo marcado em vermelho, e o app continua com a última cor válida.
  - Ao marcar "Personalizada" pela primeira vez, o campo começa com o hexadecimal da cor que estava marcada (a versão do tema escuro). Trocar para uma cor pronta e voltar traz de volta o último hexadecimal válido.
  - Contraste da personalizada: o app mantém o matiz e ajusta só o brilho em cada tema até passar no contraste. Quando ajusta no tema atual, aparece abaixo do campo "Ajustada para manter a leitura neste tema"; ao lado do campo, uma amostra mostra a cor em uso.
  - A partir da cor ajustada de cada tema, o app gera as outras versões: destaque forte (mais claro no escuro, mais escuro no claro, também dentro do contraste), fundos translúcidos, brilho e grade.
  - A escolha fica salva no navegador, como o tema, e é aplicada antes de a página aparecer, sem piscar o violeta. Com o armazenamento bloqueado, a troca funciona na sessão; um valor salvo inválido volta para o violeta.
- **Fora do escopo:** tratar de forma especial uma cor personalizada parecida com o vermelho de erro.

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
