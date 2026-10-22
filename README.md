# Analisador de Funil

App web para profissionais de marketing montarem um funil de vendas (etapas, conversões e custos) e verem o resultado de um orçamento ou o investimento necessário para chegar a uma meta. Roda inteiro no navegador, sem conta nem servidor.

## O que dá para fazer

- Montar o funil num painel lateral: criar, nomear, reordenar e remover etapas, com unidade de custo (CPM, CPC ou por unidade), conversões, custos extras e ticket médio.
- Partir de um orçamento e ver volumes, custo por resultado, custo total, receita, ROAS e ROI, ou partir de uma meta e ver o investimento necessário.
- Comparar de 2 a 3 cenários lado a lado, com uma tabela que destaca o melhor valor de cada linha.
- Ter vários funis salvos no navegador, criar a partir de modelos e exportar ou importar como arquivo.
- Escolher o tema, a cor de destaque e o separador decimal (vírgula ou ponto) nas configurações.

As regras de cada parte estão no [SPEC.md](SPEC.md).

## Rodando

Precisa de Node.js.

```sh
npm install
npm run dev
```

O app abre em http://localhost:5173.

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento (Vite) |
| `npm run build` | Confere os tipos e gera a versão final em `dist/` |
| `npm test` | Testes de unidade e de componentes (Vitest + Testing Library) |
| `npm run test:e2e` | Testes no navegador (Playwright); antes, rode `npx playwright install chromium` uma vez |
| `npm run lint` | Lint (oxlint) |

## Documentação

- [SPEC.md](SPEC.md): como o app funciona hoje, com regras, dados guardados e decisões técnicas.
- [BACKLOG.md](BACKLOG.md): ideias e a funcionalidade em construção.
- [CHANGELOG.md](CHANGELOG.md): o que mudou em cada versão.

## Tecnologia

React, TypeScript (modo estrito) e Vite. Os dados ficam no `localStorage` do navegador. Os textos da interface estão em português e num módulo único, para poderem ser traduzidos depois.

## Licença

[MIT](LICENSE)
