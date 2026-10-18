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
- O painel ainda não edita nada: avisa que a edição das etapas chega em breve.
- A área do funil mostra um funil de exemplo fixo, marcado como "Exemplo": Impressões → Cliques → Leads → Vendas, cada faixa com nome, volume e custo por resultado, e a taxa de conversão entre as faixas. As larguras são fixas, não proporcionais.

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

## Limitações conhecidas

- Só em português e em reais.
- Os dados ficam presos ao navegador em que foram criados.
- Sem internet, as fontes do produto não carregam e a aparência usa as fontes do sistema.
