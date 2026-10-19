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

### Lista de funis, modelos e arquivo
- **Status:** Ideia
- **Motivação:** Quem planeja trabalha com vários funis e cenários e precisa voltar a eles depois ou levá-los a outro computador.
- **Descrição:** O nome do funil ativo aparece no cabeçalho, e clicar nele abre um menu. No menu, a pessoa troca de funil, cria um novo (em branco ou de um modelo), renomeia, duplica, apaga, exporta e importa. Tudo fica salvo no navegador, sem botão de salvar.
- **Decisões:**
  - **Salvar:** tudo é salvo no navegador automaticamente, a cada alteração.
  - **O que cada funil guarda:** o texto como foi digitado, inclusive campos inválidos, mais o modo, a verba, a meta e a etapa-alvo.
  - **Muda no SPEC.md:**
    - "O modo não é salvo: recarregar volta ao modo orçamento" passa a ser "recarregar abre o funil no modo em que ele estava".
    - "Recarregar a página volta a esse funil (nada do funil é salvo)" passa a ser: o funil de exemplo só aparece na primeira visita.
    - Sai a limitação "O funil ainda não é salvo".
  - **Primeira visita:** sem nada salvo, o funil de exemplo de hoje vira o primeiro funil salvo, com o nome "Meu funil".
  - **Ao recarregar:** abre o último funil ativo. Se ele não existir mais, abre o primeiro da lista.
  - **Funil inválido ao abrir:** com algum campo inválido, não há último cálculo válido para mostrar. O funil dá lugar a "Corrija os campos marcados para ver o funil", e os campos aparecem marcados.
  - **Menu do cabeçalho:**
    - a lista de funis, em ordem de criação, com o ativo marcado; clicar em outro troca para ele;
    - "Novo funil", que abre a escolha do modelo;
    - "Renomear", "Duplicar", "Apagar" e "Exportar", que valem para o funil ativo;
    - "Importar".
  - **Funil ativo:** criar, duplicar ou importar torna ativo o funil resultante. Apagar torna ativo o primeiro da lista.
  - **Renomear:** o nome no cabeçalho vira um campo de texto já selecionado. Enter ou clicar fora confirma, e Esc cancela. Vazio volta ao nome anterior. Dois funis podem ter o mesmo nome.
  - **Nomes automáticos:**
    - funil novo em branco: "Funil N", com o próximo número livre;
    - funil de modelo: o nome do modelo;
    - cópia: "<nome> (cópia)", depois "(cópia 2)" e assim por diante;
    - importado com nome que já existe: "<nome> (2)", "(3)"…
  - **Apagar:**
    - a confirmação fica no próprio menu ("Apagar "<nome>"?" com "Sim" e "Não"), sem janela do navegador;
    - sempre sobra pelo menos um funil: com um só, "Apagar" fica desabilitado.
  - **Modelos** (todos no modo orçamento, sem custos extras):
    - *Em branco:* "Etapa 1" e "Etapa 2", unidade CPC, campos obrigatórios vazios.
    - *Tráfego pago → Lead → Venda:* Cliques (CPC R$ 1,50) → Leads 10% → Vendas 5%; verba R$ 3.000; ticket R$ 500.
    - *E-commerce:* Impressões (CPM R$ 15) → Cliques 1,5% → Carrinho 8% → Compra 30%; verba R$ 5.000; ticket R$ 150.
    - *B2B:* Leads (R$ 80 por unidade) → MQL 40% → SQL 30% → Venda 20%; verba R$ 10.000; ticket R$ 10.000.
  - **Exportar:**
    - um JSON chamado "<nome do funil>.json", com caracteres que não podem ir num nome de arquivo trocados por "-";
    - leva o texto como foi digitado e a versão do formato.
  - **Importar:**
    - sempre cria um funil novo e nunca sobrescreve;
    - um arquivo que não é JSON, que não vem do app, que tem campos faltando ou que é de uma versão mais nova do formato não importa nada e mostra "Este arquivo não é um funil válido".
  - **Armazenamento bloqueado ou falha ao salvar** (modo privado, espaço cheio): o app funciona na sessão e mostra um aviso fixo discreto: "Seus funis não estão sendo salvos neste navegador".
- **Fora do escopo:** sincronizar várias abas abertas. Cada aba salva o que tem, e vale a última gravação.

### Escolher a ordenação da lista de funis
- **Status:** Ideia
- **Motivação:** não registrada
- **Descrição:** A pessoa escolhe como a lista de funis é ordenada, em vez de ver sempre a ordem de criação.

## Comparação

### Comparar cenários
- **Status:** Ideia
- **Motivação:** Responder perguntas como "com R$ 10 mil, qual destes cenários rende mais?", comparando variações de um mesmo funil.
- **Descrição:** A pessoa escolhe de 2 a 4 funis com as mesmas etapas e os vê lado a lado. Embaixo vem uma tabela comparativa.
- **Decisões:**
  - Mesmas etapas: mesma quantidade e mesmos nomes na mesma ordem, sem diferenciar maiúsculas nem espaços sobrando. A unidade de custo da primeira etapa pode ser diferente.
  - Na escolha, depois do primeiro funil marcado, só os compatíveis ficam habilitados. Os outros ficam acinzentados, com o motivo. Se não houver nenhum compatível, aparece a dica para duplicar o funil.
  - Cada funil aparece como na tela principal, com faixas de largura fixa. As faixas da mesma etapa ficam alinhadas na mesma altura.
  - A tabela tem volume e custo por resultado de cada etapa, depois mídia, custo total, receita, ROAS e ROI. O melhor valor de cada linha fica destacado.
  - A opção "usar o mesmo orçamento (ou meta) para todos" vem ligada por padrão. Desligada, cada funil usa o seu valor.
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
