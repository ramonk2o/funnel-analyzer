# Backlog

Ideias de funcionalidades e a funcionalidade em construção, gerenciadas com a skill `document`. Funcionalidades implementadas saem deste arquivo: o que mudou vai para o CHANGELOG.md e as regras para o SPEC.md.

Status: **Ideia** → **Em andamento** (uma por vez) → concluída (sai do arquivo no commit que a implementa). Ideias descartadas vão para a última seção.

## Funil

### Editor do funil e modo orçamento
- **Status:** Ideia
- **Motivação:** Profissionais de marketing precisam planejar campanhas sabendo o que um investimento rende ao longo do funil. Hoje isso é feito em planilhas improvisadas.
- **Descrição:** Num painel lateral, a pessoa monta o funil: cria, nomeia, remove e reordena etapas (arrastando ou com setas) e informa os valores de cada uma. Digita a verba de mídia e vê volumes, custos e resultados. Tudo recalcula a cada tecla.
- **Decisões:**
  - A primeira etapa recebe o custo unitário de mídia, numa destas unidades: CPM, CPC ou custo por unidade genérico. As etapas seguintes recebem a taxa de conversão sobre a etapa anterior.
  - O custo por resultado de cada etapa é calculado, nunca digitado.
  - Cada etapa pode ter um custo extra opcional por unidade (ex.: ferramenta por lead, comissão por venda), somado por cima da mídia.
  - O investimento é a verba de mídia. O app mostra mídia, custos extras e custo total separados.
  - Ticket médio opcional na última etapa. Com ele aparecem receita, ROAS (receita ÷ mídia) e ROI (lucro ÷ custo total).
  - Os cálculos usam as casas decimais completas. A tela mostra volumes inteiros e R$ com 2 casas.
  - Validação: conversão de 0% a 100%; custos, verba e ticket ≥ 0; de 2 a 10 etapas. Campo inválido fica em vermelho, e o funil mantém o último cálculo válido.
  - Só PT-BR e R$, com os textos centralizados para facilitar traduzir depois.
  - Feito para desktop. No celular deve funcionar de forma aceitável, com o painel embaixo do funil.
  - Stack: React + TypeScript (modo estrito) + Vite, com Vitest para cálculo e componentes e Playwright para testes no navegador.
- **Fora do escopo:** contas, login e nuvem; desfazer; outros idiomas e moedas; publicação; modo meta (entrada própria).

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
