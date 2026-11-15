# Desenvolver pela nuvem (Claude Code on the web)

Passos para trabalhar neste projeto em claude.ai/code, sem nada instalado na máquina. Feitos uma vez; depois é só abrir uma sessão com o repositório `ramonk2o/funnel-analyzer`.

## O que já está no repositório

- `CLAUDE.md`: carregado em toda sessão na nuvem.
- `.claude/skills/`: as skills do Matt Pocock (links para `.agents/skills/`), carregadas em toda sessão.
- `.claude/settings.json`: permissões dos comandos de teste, build e git, e o hook de início de sessão.
- `.claude/hooks/session-start.sh`: só na nuvem, roda `npm install` e baixa o Chromium do Playwright. Na máquina local não faz nada.

## 1. Conectar o GitHub

Em claude.ai/code, autorize o Claude GitHub App, ou rode `/web-setup` no terminal (usa o token do `gh`). O repositório é público.

## 2. Criar o ambiente e liberar a rede

Crie (ou edite) um ambiente de nuvem e, em **Network access**, escolha **Custom**, mantendo os domínios padrão e adicionando:

```
cdn.playwright.dev
playwright.download.prss.microsoft.com
```

Sem eles o Chromium não baixa e `npm run test:e2e` não roda. O npm já está na lista padrão.

## 3. Script de inicialização (Setup script) do ambiente

Cole no campo **Setup script** do ambiente:

```bash
#!/bin/bash
# Bibliotecas do sistema que o Chromium do Playwright precisa
npx -y playwright install-deps chromium || true
```

O script roda antes do Claude Code abrir e o resultado fica em cache por cerca de 7 dias.

## 4. Conferir na primeira sessão

Peça ao Claude, na primeira sessão:

1. "Liste as skills disponíveis": precisam aparecer as do Matt Pocock, como `implement`, `tdd`, `code-review` e `triage`.
2. "Rode `npm test` e `npm run test:e2e`": os dois precisam passar.

Se algo falhar:

- **Skills não aparecem:** confira se `.claude/skills/` veio no clone como links para `.agents/skills/`.
- **Chromium não baixa:** confira os domínios do passo 2.
