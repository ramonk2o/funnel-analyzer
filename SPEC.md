# Simulador de Funil

Como o Simulador de Funil funciona hoje, em regras (não em detalhes visuais), mais seus dados e decisões técnicas. Gerenciado com a skill `document`: é atualizado quando uma funcionalidade é concluída, descrevendo o que foi construído. As ideias ficam no BACKLOG.md; o que mudou e quando, no CHANGELOG.md.

## Objetivo

Ferramenta visual para profissionais de marketing montarem um funil de vendas (etapas, conversões e custos) e verem o resultado de um investimento ou o investimento necessário para uma meta. Roda inteira no navegador, sem conta nem servidor.

## Comportamento

### Aparência e temas
- O app tem tema escuro e tema claro. Na primeira visita, abre no escuro.
- O botão de tema alterna entre os dois, e a escolha fica salva no navegador para as próximas visitas.
- Se o navegador não deixar ler ou salvar (modo privado, armazenamento bloqueado), o app abre no escuro e o botão continua funcionando, só sem lembrar a escolha. Um valor salvo diferente de "claro" ou "escuro" é ignorado.
- O tema salvo é aplicado antes de a página aparecer, então o tema claro não pisca em escuro ao carregar.
- O nome acessível do botão diz para qual tema ele muda ("Mudar para tema claro" / "Mudar para tema escuro").
- A cor de destaque é violeta: `#A78BFA` no escuro; no claro, um violeta (matiz entre 250° e 290°) mais escuro que o do escuro.
- Toda cor de texto, incluindo o destaque e o violeta forte dos volumes, tem contraste de pelo menos 4,5:1 com todo fundo (página, cartão e botão), nos dois temas.
- Textos em Space Grotesk e números em JetBrains Mono, carregadas do Google Fonts. Sem internet, a página funciona com as fontes do sistema.

### Tela principal
- O cabeçalho mostra o nome "Simulador de Funil" e o botão de tema.
- Abaixo ficam o painel das etapas e a área do funil. Em telas estreitas (até 800 px), o painel vai para baixo do funil.
- O app abre com um funil de exemplo já editável: Impressões → Cliques → Leads → Vendas, CPM R$ 20, conversões de 2,5%, 12% e 15%, verba de R$ 2.000. Recarregar a página volta a esse funil (nada do funil é salvo).

### Editor do funil
- O painel tem a verba de mídia e, abaixo, uma caixa por etapa ("Etapa 1", "Etapa 2"…), com nome e custo extra por unidade (opcional).
- A primeira etapa recebe a unidade de custo (CPM, CPC ou custo por unidade) e o custo de mídia nessa unidade. Cada etapa seguinte recebe a conversão sobre a etapa anterior.
- O ticket médio (opcional) fica na etapa que estiver por último; ele é do funil, não da etapa.
- O funil tem de 2 a 10 etapas. Com 10, adicionar fica desabilitado; com 2, remover fica desabilitado.
- Etapa nova entra no fim, com conversão de 10% e o nome "Etapa N", sendo N a quantidade de etapas mais 1 ou, se esse nome já existir, o próximo número livre.
- Remover pede confirmação na própria etapa ("Remover?" com "Sim" e "Não"), sem janela. Se o funil cair para 2 etapas, uma confirmação aberta fecha sozinha.
- As etapas funcionam como acordeão: no máximo uma fica aberta, com os campos; as outras ficam recolhidas. Abrir uma recolhe a que estava aberta, e clicar na aberta a recolhe, deixando nenhuma aberta. Abre e recolhe pelo cabeçalho (seta ou nome); setas, arrastar e remover funcionam com a etapa recolhida. Abrir e recolher é animado, e a página rola para o cabeçalho clicado ficar no lugar (quando dá para rolar); com "reduzir movimento" ligado no sistema, a troca é imediata.
- Ao carregar, a 1ª etapa vem aberta. Etapa nova entra aberta; remover a etapa aberta deixa nenhuma aberta. O estado aberto/recolhido não é salvo.
- A etapa recolhida mostra no cabeçalho o nome ("Etapa N (sem nome definido)" se vazio) e um resumo: a conversão ou, na 1ª etapa, o custo de mídia com a unidade, formatados como no funil; valor inválido aparece como "—". Se algum campo dela é inválido (incluindo o custo de mídia na 1ª e o ticket na última), o cabeçalho fica marcado em vermelho, sem abrir sozinho.
- As etapas são reordenadas pelas setas (para cima / para baixo) ou arrastando; a etapa movida fica aberta. O custo de mídia e a unidade ficam com a primeira posição. A conversão de quem está em 1º lugar não é usada nem validada; uma etapa que sai do 1º lugar mostra a conversão que tinha antes, ou 10% se nunca teve.
- Tudo recalcula a cada tecla.

### Números digitados e validação
- Vírgula é o separador decimal ("1,50"). Pode faltar dígito de um lado da vírgula (",5" = 0,5; "1," = 1), e espaços nas pontas são ignorados. Separador de milhar não é aceito: qualquer ponto ("2.000", "1.5") deixa o campo inválido, assim como sinal, expoente ou texto.
- Conversão: de 0% a 100%. Verba, custos extras e ticket: ≥ 0. Custo de mídia da primeira etapa: > 0.
- Verba, custo de mídia e conversão são obrigatórios; vazios são inválidos. Custo extra e ticket vazios significam "não informado".
- Campo inválido fica marcado em vermelho. Enquanto houver algum, o funil inteiro (números, nomes e lista de etapas) fica congelado no último cálculo válido.
- O nome da etapa é livre; vazio, a faixa mostra "Etapa N (sem nome definido)", com N a posição.

### Cálculo (modo orçamento)
- Volume da primeira etapa: CPM → verba ÷ CPM × 1000; CPC → verba ÷ CPC; custo por unidade → verba ÷ custo.
- Volume de cada etapa seguinte = volume anterior × conversão.
- Custo extra de uma etapa = volume × custo extra por unidade. Custo total = mídia (a verba) + soma dos custos extras.
- Custo por resultado de cada etapa = (mídia + custos extras de todas as etapas até ela) ÷ volume da etapa.
- Com ticket médio: receita = volume da última etapa × ticket; ROAS = receita ÷ mídia; lucro = receita − custo total; ROI = lucro ÷ custo total.
- Os cálculos usam as casas decimais completas; o arredondamento é só na tela.

### Funil e resultados
- Cada faixa mostra nome, volume e custo; entre as faixas aparece a conversão como foi digitada. As larguras são fixas (estreitam de cima para baixo), não proporcionais ao volume.
- A faixa da primeira etapa mostra o custo de mídia como digitado ("R$ 20,00 CPM", "R$ 0,80 CPC", "R$ 1,00 por unidade"); as outras, o custo por resultado ("R$ 0,80 por resultado").
- Com o foco em algum campo de uma etapa (nome, unidade, custo de mídia, conversão, custo extra ou ticket), a faixa dela, com a conversão acima, fica destacada e as outras esmaecem. Os botões do cabeçalho da etapa e a verba não destacam nada. O destaque some quando o foco sai dos campos da etapa. Com o funil congelado, o destaque segue a etapa na faixa do último cálculo válido; uma etapa que não está nele não destaca nada.
- Clicar numa faixa abre a etapa dela no painel (recolhendo a aberta), com o foco no Nome; clicar na conversão entre duas faixas abre a etapa de baixo, com o foco na Conversão (ou no Nome, se a etapa estiver em 1º lugar no painel). Faixas e conversões são botões ("Editar etapa <nome>", "Editar conversão de <nome>"). Se a etapa está fora da área visível, a página rola suavemente até ela (sem animação com "reduzir movimento"). Com o funil congelado, o clique segue a etapa pela identidade, e a faixa de uma etapa já removida não faz nada.
- Abaixo do funil aparecem mídia, custos extras e custo total, separados. Receita, ROAS e ROI só aparecem com ticket médio.
- Volumes aparecem inteiros e valores em R$ com 2 casas, com separador de milhar. ROAS aparece como multiplicador ("3,20x"); ROI em porcentagem com 1 casa ("45,0%"), podendo ser negativo.
- Sem valor possível, aparece "—": custo por resultado com volume 0, ROAS com mídia 0, ROI com custo total 0.

## Dados guardados

Tudo fica no `localStorage` do navegador.

| Chave | Valores | Uso |
|---|---|---|
| `simulador-de-funil:tema` | `dark` ou `light` | Tema escolhido. Ausente ou inválido equivale a `dark`. |

## Decisões técnicas

- **React + TypeScript (modo estrito) + Vite**, com Vitest + Testing Library para unidade e componentes e Playwright para o navegador real: app pequeno, sem servidor, com testes rápidos.
- **Só no navegador:** sem conta, servidor nem hospedagem; os dados vivem no `localStorage`.
- **Textos num módulo único** (`src/texts.ts`): facilita traduzir depois.
- **Tokens de tema em CSS** (`src/styles/tokens.css`), um bloco por tema em `[data-theme]` no `<html>`. Um teste lê esse arquivo e verifica contraste e cor de destaque, então as cores de texto e de fundo ali precisam estar em `#rrggbb`.
- **Script no `index.html`** aplica o tema salvo antes do React carregar, para não piscar. Ele repete a chave de armazenamento, e um teste confere que ela é a mesma do código.
- **Fontes do Google Fonts**, com fontes do sistema como reserva.
- **Funil em módulos puros** (`src/funnel/`): `numbers.ts` lê e formata números, `form.ts` guarda o que foi digitado como texto e o valida (e faz as operações nas etapas), `calc.ts` calcula. Os componentes só mostram e repassam as mudanças, para que comparação e exportação reusem o mesmo cálculo.
- **O formulário guarda texto, não números:** um campo inválido continua na tela como foi digitado, e o funil usa o último formulário válido.

## Limitações conhecidas

- Só em português e em reais.
- Os dados ficam presos ao navegador em que foram criados.
- O funil ainda não é salvo: recarregar a página volta ao funil de exemplo.
- Sem internet, as fontes do produto não carregam e a aparência usa as fontes do sistema.
