# Analisador de Funil

Ferramenta para profissionais de marketing montarem um funil de vendas (etapas, conversões e custos) e verem o resultado de um orçamento ou o investimento necessário para chegar a uma meta. Roda inteira no navegador, sem conta nem servidor.

## Funil e etapas

**Funil** (`FunnelForm`):
Sequência de 2 a 10 etapas com tudo o que a pessoa digitou para calcular um resultado: modo, verba ou meta, unidade e custo de mídia, conversões, custos extras e ticket médio.
_Evite_: simulação, cenário (fora da comparação)

**Etapa** (`StageForm`):
Um degrau do funil (Impressões, Cliques, Leads, Vendas…), com nome, conversão e custo extra.
_Evite_: fase, passo, nível

**Faixa**:
O desenho de uma etapa no funil, com nome, volume e custo. As faixas têm largura fixa, não proporcional ao volume.
_Evite_: barra (a barra é a de edição), camada

**Conversão** (`conversion`):
A porcentagem da etapa anterior que chega a esta. A da etapa em 1º lugar não é usada.
_Evite_: taxa de passagem

**Volume** (`volume`):
Quantas unidades chegam a uma etapa.

**Unidade de custo** (`costUnit`: `cpm`, `cpc`, `unit`):
Como a mídia da primeira etapa é cobrada: CPM, CPC ou custo por unidade.

**Custo de mídia** (`unitCost`):
O preço, na unidade de custo, do que a primeira etapa compra.
_Evite_: CPM/CPC como nome genérico do campo

**Custo extra** (`extraCost`):
Um custo por unidade de uma etapa além da mídia (ex.: comissão por venda). Opcional; vazio é "não informado".

**Ticket médio** (`ticket`):
O valor médio de uma venda. É do funil, não da etapa, e aparece na etapa que estiver por último. Sem ele não há receita, ROAS nem ROI.

## Resultados

**Mídia** (`media`):
O dinheiro gasto em mídia: no modo orçamento, a verba; no modo meta, a parte do investimento calculada.

**Custo total** (`totalCost`):
Mídia mais a soma dos custos extras.

**Custo por resultado** (`costPerResult`):
O custo acumulado até uma etapa (mídia mais custos extras até ela) dividido pelo volume dela.
_Evite_: CPA, custo unitário

**Receita** (`revenue`):
Volume da última etapa vezes o ticket médio.

**ROAS** (`roas`):
Receita dividida pela mídia, mostrada como multiplicador ("3,20x").

**ROI** (`roi`):
Lucro (receita menos custo total) dividido pelo custo total, em porcentagem.

**Investimento**:
O número do bloco acima do funil: "Investimento total" (o custo total) no modo orçamento, "Investimento necessário" no modo meta.

## Modos

**Modo** (`Mode`):
De onde o cálculo parte: o **modo orçamento** (`budget`, "Tenho um orçamento") ou o **modo meta** (`goal`, "Tenho uma meta"). Cada modo guarda o seu valor.

**Verba** (`budget`):
O valor de mídia que a pessoa digita no modo orçamento.
_Evite_: orçamento (é o nome do modo), budget

**Meta** (`goal`):
A quantidade a atingir na etapa-alvo, ou a receita em R$.
_Evite_: objetivo

**Etapa-alvo** (`goalTarget`):
A etapa onde a meta é medida, ou a receita (`'revenue'`). Segue a etapa pela identidade quando ela muda de lugar. Na tela, "Meta em".

**Investimento necessário** (`calculateGoal`):
Mídia mais custos extras que fazem a etapa-alvo chegar à meta, arredondado para cima no centavo.

**Meta impossível**:
Uma meta que nenhum investimento atinge: conversão 0% antes da etapa-alvo, ou meta de receita sem ticket médio.

## Edição

**Barra de edição** (`Sidebar`):
O painel lateral à esquerda onde o funil ativo é editado.
_Evite_: painel lateral, sidebar, drawer

**Campo inválido**:
Um campo cujo texto não passa na validação. Continua na tela como foi digitado, marcado em vermelho.

**Funil congelado**:
O funil enquanto há algum campo inválido: a tela mostra o último cálculo válido.
_Evite_: travado, desatualizado

**Destaque da etapa**:
A faixa realçada (e as outras esmaecidas) enquanto o foco está num campo daquela etapa.
_Evite_: seleção

## Funis salvos

**Funis salvos** (`Library`):
Todos os funis guardados no navegador, em ordem de criação, mais qual é o ativo.
_Evite_: biblioteca, projetos

**Funil ativo** (`activeId`):
O funil aberto na tela, com o nome no cabeçalho.

**Funil de exemplo**:
O funil que a primeira visita mostra, "Meu funil" (Impressões → Cliques → Leads → Vendas).

**Modelo** (`TemplateId`):
Um funil pronto para começar: Em branco, Tráfego pago → Lead → Venda, E-commerce ou B2B.
_Evite_: template

**Arquivo de funil** (`funnelToFile`):
O JSON exportado com um funil como foi digitado, a marca do app e a versão do formato.

## Comparação

**Comparação** (`Comparison`):
De 2 a 3 funis compatíveis lado a lado, com uma tabela que destaca o melhor valor de cada linha.
_Evite_: cenários (como nome da tela)

**Funis compatíveis** (`incompatibility`):
Funis com as mesmas etapas que o primeiro marcado: mesma quantidade e mesmos nomes na mesma ordem. Números e unidade de custo podem ser diferentes.

**Valor comum** (`shared`):
A opção "Usar o mesmo orçamento (ou meta) para todos": um só valor vale para todos os funis comparados, sem mudar nenhum funil salvo.
_Evite_: valor compartilhado

## Configurações

**Separador decimal** (`Separator`: `comma`, `dot`):
Vírgula ("1,50") ou ponto ("1.50"), para digitar e para mostrar números. O milhar usa o outro sinal.

**Cor de destaque** (`AccentChoice`):
A cor de ênfase da interface: Violeta (padrão), Azul, Verde, Laranja, Rosa ou uma personalizada, com uma versão para cada tema.
_Evite_: cor principal, accent

**Destaque forte** (`strong`):
A variação mais intensa da cor de destaque, usada nos volumes.
