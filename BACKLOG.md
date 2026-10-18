# Backlog

Ideias de funcionalidades e a funcionalidade em construção, gerenciadas com a skill `document`. Funcionalidades implementadas saem deste arquivo: o que mudou vai para o CHANGELOG.md e as regras para o SPEC.md.

Status: **Ideia** → **Em andamento** (uma por vez) → concluída (sai do arquivo no commit que a implementa). Ideias descartadas vão para a última seção.

## Funil

### Modo meta
- **Status:** Ideia
- **Motivação:** Responder o caminho inverso do planejamento: quanto investir para atingir uma meta.
- **Descrição:** Um seletor no topo alterna entre "Tenho um orçamento" e "Tenho uma meta". No modo meta, a pessoa escolhe a meta e vê a verba necessária em destaque. Tudo recalcula a cada tecla.
- **Decisões:**
  - Vem depois de "Editor do funil e modo orçamento" e usa o mesmo funil e o mesmo cálculo.
  - A meta é a quantidade em qualquer etapa ou a receita. Taxas e custos ficam fixos, e só a verba muda.
  - A verba calculada é arredondada para cima, para garantir a meta.
  - Meta impossível (conversão 0% antes da etapa-alvo, ou meta de receita sem ticket médio): aparece "meta impossível com estes valores", sem número.
- **Perguntas em aberto:**
  - Que valores de meta são válidos (zero? fracionária?) e como o campo da meta se comporta quando é inválido.

### Desenho proporcional do funil
- **Status:** Ideia
- **Motivação:** Ver o funil reagir aos números torna o planejamento visual. Larguras proporcionais mostram de verdade onde o volume se perde.
- **Descrição:** Funil clássico, com uma faixa por etapa. Em cada faixa aparecem nome, volume e custo por resultado; entre as faixas, a taxa de conversão. A largura das faixas é proporcional ao volume, e quedas grandes demais são mostradas com uma quebra de escala.
- **Decisões:**
  - Quebra de escala: quando a conversão entre duas etapas fica abaixo de 10%, aparece um corte em zigue-zague com o aviso "fora de escala". A faixa seguinte recomeça em 60% da largura da anterior, e a proporção volta a valer a partir dela.
  - Os valores 10% e 60% são pontos de partida, para ajustar vendo na tela.
  - Quando um valor muda, os números rolam até o valor novo, numa animação discreta.

### Clicar na faixa para editar a etapa
- **Status:** Ideia
- **Motivação:** Partir do desenho do funil para mudar uma etapa hoje exige achá-la no painel e abri-la à mão.
- **Descrição:** Clicar numa faixa do funil abre a etapa no painel, com o foco no primeiro campo.
- **Decisões:**
  - Vem depois de "Destaque da etapa em edição": com o foco no campo, a faixa fica destacada.
  - Clicar na faixa abre a etapa (recolhendo a que estava aberta) e põe o foco no Nome.
  - Clicar na conversão entre duas faixas abre a etapa de baixo, com o foco na Conversão.
  - Faixas e conversões também são acionadas pelo teclado (Tab, depois Enter ou Espaço). O leitor de tela anuncia a faixa como "Editar etapa <nome>".
  - Se a etapa está fora da área visível (por exemplo, em tela estreita, onde o painel fica embaixo do funil), a página rola suavemente até ela, sem animação com "reduzir movimento".
  - Com o funil congelado, clicar na faixa de uma etapa já removida não faz nada. As outras funcionam, mesmo que a etapa tenha mudado de posição.
  - Muda o SPEC.md (Funil e resultados): entra a regra do clique.

### Arrastar etapas com pré-visualização
- **Status:** Ideia
- **Motivação:** Ao arrastar uma etapa para reordenar, não dá para ver como a lista vai ficar antes de soltar.
- **Descrição:** Durante o arraste, todas as etapas ficam recolhidas, e a lista se reorganiza na hora para mostrar a ordem que vai ter ao soltar.
- **Decisões:**
  - Vem depois de "Etapas colapsáveis".
  - As outras etapas abrem espaço na hora, e a arrastada deixa um espaço reservado (contorno tracejado) na posição nova.
  - Só a lista muda durante o arraste. O desenho do funil e os números recalculam ao soltar.
  - Todas as etapas ficam recolhidas enquanto o arraste dura. Ao soltar, abre a etapa arrastada.
  - Esc ou soltar fora da lista cancela: a ordem original volta, e a etapa que estava aberta antes volta a abrir.
  - Funciona com mouse e com toque (segurar e arrastar pelo ícone). Pelo teclado, a reordenação continua só pelas setas.
  - Muda o SPEC.md (Editor do funil, regra da reordenação): passa a descrever o arraste com pré-visualização, o cancelamento e o toque.

## Configurações

### Tela de configurações
- **Status:** Ideia
- **Motivação:** Cada pessoa digita números de um jeito; hoje o separador decimal é fixo na vírgula.
- **Descrição:** Uma tela de configurações reúne as preferências do app. A primeira é o separador decimal: vírgula ou ponto.
- **Decisões:**
  - O padrão é a vírgula.

## Funis salvos

### Lista de funis, modelos e arquivo
- **Status:** Ideia
- **Motivação:** Quem planeja trabalha com vários funis e cenários e precisa voltar a eles depois ou levá-los a outro computador.
- **Descrição:** Uma lista de funis permite criar, renomear, duplicar e apagar. Um funil novo começa em branco ou de um modelo. Cada funil pode ser exportado e importado como arquivo.
- **Decisões:**
  - Tudo fica salvo no navegador, automaticamente a cada alteração, sem botão de salvar.
  - Cada funil guarda etapas, valores, modo (orçamento ou meta) e o valor digitado.
  - Modelos com taxas de exemplo: *Tráfego pago → Lead → Venda*, *E-commerce* (impressões → cliques → carrinho → compra) e *B2B* (lead → MQL → SQL → venda), além de "em branco".
  - Exportação e importação em JSON. Importar sempre cria um funil novo; se o nome já existir, ganha "(2)". Nunca sobrescreve.
  - Apagar pede confirmação.

## Comparação

### Comparar cenários
- **Status:** Ideia
- **Motivação:** Responder perguntas como "com R$ 10 mil, qual destes cenários rende mais?", comparando variações de um mesmo funil.
- **Descrição:** A pessoa escolhe de 2 a 4 funis com as mesmas etapas e os vê lado a lado. Embaixo vem uma tabela comparativa.
- **Decisões:**
  - Mesmas etapas: mesma quantidade e mesmos nomes na mesma ordem, sem diferenciar maiúsculas nem espaços sobrando. A unidade de custo da primeira etapa pode ser diferente.
  - Na escolha, depois do primeiro funil marcado, só os compatíveis ficam habilitados. Os outros ficam acinzentados, com o motivo. Se não houver nenhum compatível, aparece a dica para duplicar o funil.
  - As faixas da mesma etapa ficam alinhadas na mesma altura. Cada funil usa a própria escala e as próprias quebras.
  - A tabela tem volume e custo por resultado de cada etapa, depois mídia, custo total, receita, ROAS e ROI. O melhor valor de cada linha fica destacado.
  - A opção "usar o mesmo orçamento (ou meta) para todos" vem ligada por padrão. Desligada, cada funil usa o seu valor.
- **Fora do escopo:** comparar funis com etapas diferentes.

## Exportação

### Exportar imagem e PDF
- **Status:** Ideia
- **Motivação:** Levar o funil e a comparação para apresentações, mensagens e clientes.
- **Descrição:** O funil e a comparação podem ser exportados em PNG e em PDF.
- **Decisões:**
  - PNG: o desenho com título e os números principais (mídia, resultado final, custo por resultado e, se houver, receita, ROAS e ROI).
  - PDF de 1 página: a mesma imagem, a tabela das etapas (volume, conversão, custo por resultado, custo extra) e a data de geração.
  - Comparação: os funis lado a lado, mais a tabela.
  - A exportação segue o tema ativo (escuro ou claro).
  - Tudo é gerado no navegador.
- **Fora do escopo:** logo ou marca própria.
