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
- O cabeçalho ocupa a largura toda da janela: à esquerda, o botão da barra de edição, o nome "Simulador de Funil" e o nome do funil ativo; à direita, o botão de tema. Abaixo, o funil e os resultados ficam centralizados (até 1280 px).

### Funis salvos
- Todos os funis ficam salvos no navegador, automaticamente a cada alteração, sem botão de salvar. Cada funil guarda o texto como foi digitado (inclusive campos inválidos), o modo, a verba, a meta e a etapa-alvo.
- Na primeira visita, sem nada salvo, o funil de exemplo vira o primeiro funil salvo, "Meu funil". Ao recarregar, abre o último funil ativo; se ele não existir mais, o primeiro da lista. Um funil salvo que não pode ser lido fica de fora; os outros abrem normalmente.
- O nome do funil ativo, no cabeçalho, é um botão que abre um menu. Clicar fora ou Esc fecha o menu, com o foco de volta no botão. O menu tem:
  - a lista de funis, em ordem de criação, com o ativo marcado; clicar em outro troca para ele;
  - "Novo funil", que mostra os modelos (e "Voltar");
  - "Renomear", "Duplicar", "Apagar" e "Exportar", que valem para o funil ativo;
  - "Importar", que abre a escolha de arquivo.
- Criar, duplicar ou importar torna ativo o funil resultante, no fim da lista. Apagar torna ativo o primeiro da lista. Trocar de funil abre a 1ª etapa no painel e desfaz qualquer destaque.
- Renomear transforma o nome no cabeçalho num campo de texto já selecionado: Enter ou clicar fora confirma, Esc cancela. Espaços nas pontas são removidos; vazio volta ao nome anterior. Dois funis podem ter o mesmo nome.
- Nomes automáticos: funil novo em branco, "Funil N", com o menor número livre; funil de modelo, o nome do modelo, com "(2)", "(3)"… se já existir; cópia, "<nome> (cópia)", depois "(cópia 2)" e assim por diante; importado, o nome do arquivo de funil, com "(2)", "(3)"… se já existir.
- Apagar pede confirmação no próprio menu ("Apagar “<nome>”?" com "Sim" e "Não"), sem janela. Sempre sobra pelo menos um funil: com um só, "Apagar" fica desabilitado.
- Modelos, todos no modo orçamento e sem custos extras:
  - *Em branco:* "Etapa 1" e "Etapa 2", unidade CPC, verba, custo de mídia e conversão vazios.
  - *Tráfego pago → Lead → Venda:* Cliques (CPC R$ 1,50) → Leads 10% → Vendas 5%; verba R$ 3.000; ticket R$ 500.
  - *E-commerce:* Impressões (CPM R$ 15) → Cliques 1,5% → Carrinho 8% → Compra 30%; verba R$ 5.000; ticket R$ 150.
  - *B2B:* Leads (R$ 80 por unidade) → MQL 40% → SQL 30% → Venda 20%; verba R$ 10.000; ticket R$ 10.000.
- Exportar baixa um JSON chamado "<nome do funil>.json" (caracteres que não podem ir num nome de arquivo viram "-"), com o funil como foi digitado, a marca do app e a versão do formato (1).
- Importar sempre cria um funil novo, nunca sobrescreve. Um arquivo que não é JSON, que não vem do app, que tem campos faltando, que tem o nome vazio ou que é de uma versão mais nova do formato não importa nada, e aparece "Este arquivo não é um funil válido" abaixo do cabeçalho (some na próxima troca de funil ou importação que der certo).
- Com o armazenamento bloqueado ou se salvar falhar (modo privado, espaço cheio), o app funciona na sessão e mostra abaixo do cabeçalho o aviso "Seus funis não estão sendo salvos neste navegador". O aviso some quando uma gravação seguinte dá certo.

### Barra de edição
- O painel de edição (verba, etapas e "Adicionar etapa") fica numa barra lateral colada à esquerda, abaixo do cabeçalho, que cobre o funil sem mudar a largura dele. O fundo da barra é levemente translúcido (90%), e ela rola por conta própria.
- O botão do cabeçalho ("Abrir edição" / "Fechar edição") abre e fecha a barra. Abrir pelo botão põe o foco na verba (no modo meta, no valor da meta). Esc com o foco dentro da barra também fecha. Ao fechar, o foco vai para o botão.
- Enquanto a barra está aberta, o cabeçalho fica fixo no topo. Fechada, nada da barra é alcançável por Tab ou leitor de tela.
- Tela larga: sem fundo escurecido nem foco preso; clicar fora não fecha.
- Tela estreita (até 800 px): a barra ocupa ~85% da largura, e o resto fica escurecido; tocar nele fecha. O Tab fica entre o botão do cabeçalho e a barra, e Esc com o foco no botão também fecha.
- Abrir e fechar desliza em ~200 ms (imediato com "reduzir movimento").
- Na primeira visita (tela larga) a barra vem aberta; depois, o app lembra se ela ficou aberta ou fechada. Em tela estreita ela sempre começa fechada, e abrir ou fechar ali não muda o que fica lembrado.
- Na primeira visita, o app abre com um funil de exemplo já editável, "Meu funil": Impressões → Cliques → Leads → Vendas, CPM R$ 20, conversões de 2,5%, 12% e 15%, verba de R$ 2.000. Depois, abre o último funil ativo (veja Funis salvos).

### Modos
- No topo da barra, um seletor alterna entre "Tenho um orçamento" (padrão) e "Tenho uma meta". As etapas, taxas e custos são os mesmos nos dois modos; cada modo guarda o seu valor (a verba ou a meta) ao alternar. O modo é salvo com o funil: recarregar abre o funil no modo em que ele estava.
- No modo meta, a verba dá lugar a "Meta em" (as etapas na ordem do funil, mais "Receita") e ao valor da meta: "Meta (quantidade)" ou, para receita, "Meta (R$)".
- Na primeira entrada no modo meta, a meta vem na última etapa, com o volume que o funil mostra arredondado para cima (ou 1, se for 0).
- A meta segue a etapa pela identidade: vai junto ao reordenar e, se a etapa for removida, passa para a última etapa com o mesmo valor.

### Editor do funil
- O painel tem o seletor de modo, a verba de mídia (ou a meta) e, abaixo, uma caixa por etapa ("Etapa 1", "Etapa 2"…), com nome e custo extra por unidade (opcional).
- A primeira etapa recebe a unidade de custo (CPM, CPC ou custo por unidade) e o custo de mídia nessa unidade. Cada etapa seguinte recebe a conversão sobre a etapa anterior.
- O ticket médio (opcional) fica na etapa que estiver por último; ele é do funil, não da etapa.
- O funil tem de 2 a 10 etapas. Com 10, adicionar fica desabilitado; com 2, remover fica desabilitado.
- Etapa nova entra no fim, com conversão de 10% e o nome "Etapa N", sendo N a quantidade de etapas mais 1 ou, se esse nome já existir, o próximo número livre.
- Remover pede confirmação na própria etapa ("Remover?" com "Sim" e "Não"), sem janela. Se o funil cair para 2 etapas, uma confirmação aberta fecha sozinha.
- As etapas funcionam como acordeão: no máximo uma fica aberta, com os campos; as outras ficam recolhidas. Abrir uma recolhe a que estava aberta, e clicar na aberta a recolhe, deixando nenhuma aberta. Abre e recolhe pelo cabeçalho (seta ou nome); setas, arrastar e remover funcionam com a etapa recolhida. Abrir e recolher é animado, e a página rola para o cabeçalho clicado ficar no lugar (quando dá para rolar); com "reduzir movimento" ligado no sistema, a troca é imediata.
- Ao carregar, a 1ª etapa vem aberta. Etapa nova entra aberta; remover a etapa aberta deixa nenhuma aberta. O estado aberto/recolhido não é salvo.
- A etapa recolhida mostra no cabeçalho o nome ("Etapa N (sem nome definido)" se vazio) e um resumo: a conversão ou, na 1ª etapa, o custo de mídia com a unidade, formatados como no funil; valor inválido aparece como "—". Se algum campo dela é inválido (incluindo o custo de mídia na 1ª e o ticket na última), o cabeçalho fica marcado em vermelho, sem abrir sozinho.
- As etapas são reordenadas pelas setas (para cima / para baixo) ou arrastando pelo ícone; a etapa movida fica aberta.
- Arrastar funciona com mouse e com toque e começa depois de o ponteiro andar ~5 px (um clique parado no ícone não faz nada). Durante o arraste, todas as etapas ficam recolhidas, a lista se reorganiza na hora para mostrar a ordem que vai ter ao soltar (a arrastada vira um espaço tracejado), e uma cópia do cabeçalho segue o ponteiro. Perto da borda de cima ou de baixo da barra, ela rola sozinha. O funil só muda ao soltar.
- Soltar em qualquer ponto da barra aplica a ordem mostrada e abre a etapa arrastada. Esc ou soltar fora da barra cancela: volta a ordem original e a etapa que estava aberta. Esc durante o arraste não fecha a barra. Pelo teclado, a reordenação é só pelas setas.
- O custo de mídia e a unidade ficam com a primeira posição. A conversão de quem está em 1º lugar não é usada nem validada; uma etapa que sai do 1º lugar mostra a conversão que tinha antes, ou 10% se nunca teve.
- Tudo recalcula a cada tecla.

### Números digitados e validação
- Vírgula é o separador decimal ("1,50"). Pode faltar dígito de um lado da vírgula (",5" = 0,5; "1," = 1), e espaços nas pontas são ignorados. Separador de milhar não é aceito: qualquer ponto ("2.000", "1.5") deixa o campo inválido, assim como sinal, expoente ou texto.
- Conversão: de 0% a 100%. Verba, custos extras e ticket: ≥ 0. Custo de mídia da primeira etapa: > 0.
- Meta: > 0, com as mesmas regras de escrita (fração aceita). Só o valor do modo atual é validado.
- Verba, meta, custo de mídia e conversão são obrigatórios; vazios são inválidos. Custo extra e ticket vazios significam "não informado".
- Campo inválido fica marcado em vermelho. Enquanto houver algum, o funil inteiro (números, nomes e lista de etapas) fica congelado no último cálculo válido.
- O nome da etapa é livre; vazio, a faixa mostra "Etapa N (sem nome definido)", com N a posição.

### Cálculo (modo orçamento)
- Volume da primeira etapa: CPM → verba ÷ CPM × 1000; CPC → verba ÷ CPC; custo por unidade → verba ÷ custo.
- Volume de cada etapa seguinte = volume anterior × conversão.
- Custo extra de uma etapa = volume × custo extra por unidade. Custo total = mídia (a verba) + soma dos custos extras.
- Custo por resultado de cada etapa = (mídia + custos extras de todas as etapas até ela) ÷ volume da etapa.
- Com ticket médio: receita = volume da última etapa × ticket; ROAS = receita ÷ mídia; lucro = receita − custo total; ROI = lucro ÷ custo total.
- Os cálculos usam as casas decimais completas; o arredondamento é só na tela. A exceção é o investimento do modo meta, arredondado para cima no centavo.

### Cálculo (modo meta)
- O investimento necessário é a mídia mais os custos extras que fazem a etapa-alvo chegar à meta (ou a receita, para meta de receita), arredondado para cima no centavo. Como volumes e custos extras crescem na proporção da mídia, a mídia é a parte do investimento que, somada aos custos extras dela, dá o total.
- Meta impossível: conversão 0% antes da etapa-alvo, ou meta de receita sem ticket médio (ou com ticket 0). Conversão 0% depois da etapa-alvo não impede a meta.

### Funil e resultados
- Cada faixa mostra nome, volume e custo; entre as faixas aparece a conversão como foi digitada. As larguras são fixas (estreitam de cima para baixo), não proporcionais ao volume.
- A faixa da primeira etapa mostra o custo de mídia como digitado ("R$ 20,00 CPM", "R$ 0,80 CPC", "R$ 1,00 por unidade"); as outras, o custo por resultado ("R$ 0,80 por resultado").
- Com o foco em algum campo de uma etapa (nome, unidade, custo de mídia, conversão, custo extra ou ticket), a faixa dela, com a conversão acima, fica destacada e as outras esmaecem. Os botões do cabeçalho da etapa e a verba não destacam nada. O destaque some quando o foco sai dos campos da etapa. Com o funil congelado, o destaque segue a etapa na faixa do último cálculo válido; uma etapa que não está nele não destaca nada.
- Clicar numa faixa abre a barra de edição (se estiver fechada) e a etapa dela no painel (recolhendo a aberta), com o foco no Nome; clicar na conversão entre duas faixas abre a etapa de baixo, com o foco na Conversão (ou no Nome, se a etapa estiver em 1º lugar no painel). Faixas e conversões são botões ("Editar etapa <nome>", "Editar conversão de <nome>"). Se a etapa está fora da área visível, a barra rola suavemente até ela (sem animação com "reduzir movimento"). Com o funil congelado, o clique segue a etapa pela identidade, e a faixa de uma etapa já removida não faz nada.
- Acima do funil, um bloco em destaque mostra o investimento: no modo orçamento, "Investimento total" (o custo total); no modo meta, "Investimento necessário". Embaixo, o detalhamento "mídia R$ Y + custos extras R$ Z". Com a meta impossível, o bloco mostra "Meta impossível com estes valores", sem número, e o funil e os resultados ficam no último cálculo válido.
- Um funil aberto (ao carregar, trocar pela lista, duplicar ou importar) não tem último cálculo válido para mostrar. Se algum campo é inválido, o funil e os resultados dão lugar a "Corrija os campos marcados para ver o funil", com os campos marcados; se a meta é impossível, a "Meta impossível com estes valores". Passar para o modo meta nessa situação começa a meta em 1.
- No modo meta, a faixa da etapa-alvo (ou a receita, nos resultados) ganha a etiqueta "Meta".
- Abaixo do funil aparecem mídia, custos extras e custo total, separados. Receita, ROAS e ROI só aparecem com ticket médio.
- Volumes aparecem inteiros e valores em R$ com 2 casas, com separador de milhar. ROAS aparece como multiplicador ("3,20x"); ROI em porcentagem com 1 casa ("45,0%"), podendo ser negativo.
- Sem valor possível, aparece "—": custo por resultado com volume 0, ROAS com mídia 0, ROI com custo total 0.

## Dados guardados

Tudo fica no `localStorage` do navegador.

| Chave | Valores | Uso |
|---|---|---|
| `simulador-de-funil:tema` | `dark` ou `light` | Tema escolhido. Ausente ou inválido equivale a `dark`. |
| `simulador-de-funil:funis` | JSON: o funil ativo e a lista de funis (nome e o que foi digitado) | Funis salvos. Ausente ou inválido equivale à primeira visita. |
| `simulador-de-funil:edicao` | `aberta` ou `fechada` | Barra de edição aberta ou fechada (só em tela larga). Ausente ou inválido equivale a `aberta`. |

## Decisões técnicas

- **React + TypeScript (modo estrito) + Vite**, com Vitest + Testing Library para unidade e componentes e Playwright para o navegador real: app pequeno, sem servidor, com testes rápidos.
- **Só no navegador:** sem conta, servidor nem hospedagem; os dados vivem no `localStorage`.
- **Textos num módulo único** (`src/texts.ts`): facilita traduzir depois.
- **Tokens de tema em CSS** (`src/styles/tokens.css`), um bloco por tema em `[data-theme]` no `<html>`. Um teste lê esse arquivo e verifica contraste e cor de destaque, então as cores de texto e de fundo ali precisam estar em `#rrggbb`.
- **Script no `index.html`** aplica o tema salvo antes do React carregar, para não piscar. Ele repete a chave de armazenamento, e um teste confere que ela é a mesma do código.
- **Fontes do Google Fonts**, com fontes do sistema como reserva.
- **Funil em módulos puros** (`src/funnel/`): `numbers.ts` lê e formata números, `form.ts` guarda o que foi digitado como texto e o valida (e faz as operações nas etapas), `calc.ts` calcula. Os componentes só mostram e repassam as mudanças, para que comparação e exportação reusem o mesmo cálculo.
- **Funis salvos em módulos puros** (`src/funnels/`): nomes, modelos, leitura e gravação no navegador e o formato de arquivo ficam separados da tela. A leitura (do navegador ou de arquivo) valida tudo e dá novos ids às etapas, para nunca colidirem com as que já estão na tela.
- **Salvar no momento da alteração**, não num efeito depois da renderização: assim o aviso de "não salvo" já aparece no mesmo passo.
- **O formulário guarda texto, não números:** um campo inválido continua na tela como foi digitado, e o funil usa o último formulário válido.

## Limitações conhecidas

- Só em português e em reais.
- Os dados ficam presos ao navegador em que foram criados.
- Várias abas abertas não se sincronizam: cada uma salva o que tem, e vale a última gravação.
- Sem internet, as fontes do produto não carregam e a aparência usa as fontes do sistema.
