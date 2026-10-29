# Desenvolver pela nuvem (Claude Code on the web)

Passos para trabalhar neste projeto em claude.ai/code, sem nada instalado na máquina. Feitos uma vez; depois é só abrir uma sessão com o repositório `ramonk2o/funnel-analyzer`.

## O que já está no repositório

- `CLAUDE.md`: carregado em toda sessão na nuvem.
- `.claude/settings.json`: permissões dos comandos do ciclo e o hook de início de sessão.
- `.claude/hooks/session-start.sh`: só na nuvem, roda `npm install` e baixa o Chromium do Playwright. Na máquina local não faz nada.

O que **não** vem pelo repositório: o plugin `minidev`. Sessões na nuvem não instalam plugins declarados no `.claude/settings.json` nem os do seu `~/.claude`. Por isso o script de inicialização do ambiente (passo 3) instala o plugin.

## 1. Conectar o GitHub

Em claude.ai/code, autorize o Claude GitHub App, ou rode `/web-setup` no terminal (usa o token do `gh`). Os dois repositórios (`funnel-analyzer` e `minidev`) são públicos.

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
# Plugin do ciclo de desenvolvimento (grilling, document, build, tester)
claude plugin marketplace add ramonk2o/minidev || true
claude plugin install minidev@minidev || true
# Bibliotecas do sistema que o Chromium do Playwright precisa
npx -y playwright install-deps chromium || true
```

O script roda antes do Claude Code abrir e o resultado fica em cache por cerca de 7 dias. Para pegar uma versão nova do minidev, edite o script (qualquer mudança reconstrói o cache) ou peça na sessão: `claude plugin marketplace update minidev`.

## 4. Conferir na primeira sessão

Peça ao Claude, na primeira sessão:

1. "Liste as skills e agentes disponíveis": precisam aparecer `build`, `document`, `grilling` e o agente `tester`.
2. "Rode `npm test` e `npm run test:e2e`": os dois precisam passar.

Se algo falhar:

- **Plugin não aparece:** não está confirmado na documentação que um plugin instalado pelo script dentro da máquina da nuvem carrega, nem que a nuvem consegue clonar o `minidev` sem ele estar anexado à sessão. Alternativa: copiar `skills/` e `agents/tester.md` do minidev para `.claude/skills/` e `.claude/agents/` deste repositório (sessões na nuvem carregam esses).
- **Chromium não baixa:** confira os domínios do passo 2.
- **Push para a main recusado:** o ciclo termina com merge na main e push. Se a nuvem só permitir branches próprias, finalize abrindo um pull request e fazendo o merge pelo GitHub.
