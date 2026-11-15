# Tema e cor de destaque aplicados por um script antes do React

Um script no `index.html` aplica o tema e a cor de destaque salvos antes de o React carregar, para a página não piscar no tema ou na cor errada. Para o script não repetir o cálculo de cor, o app calcula em TypeScript (`src/settings/accent.ts`) o ajuste de brilho e as variações de cada tema e grava tudo pronto junto com a escolha; o script só aplica as variáveis de uma cor com nome conhecido. Aceitamos repetir no script as chaves de armazenamento e os nomes das cores em troca de uma primeira pintura certa.

## Consequências

- O script repete as chaves e os nomes das cores, e os fundos usados no ajuste repetem os de `src/styles/tokens.css`; testes conferem que continuam iguais ao código. Ao mudar um, mude o outro.
- As cores de texto e de fundo em `tokens.css` precisam ficar em `#rrggbb`, porque um teste lê o arquivo para conferir contraste e cor de destaque.
- As cores já calculadas que vêm salvas não são conferidas antes de o app carregar: um valor adulterado à mão aparece por um instante, e o app corrige ao carregar.
