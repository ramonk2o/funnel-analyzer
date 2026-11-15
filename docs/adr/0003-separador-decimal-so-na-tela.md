# O separador decimal existe só na tela

O que foi digitado é guardado sempre com vírgula: no navegador, nos arquivos de funil, nos modelos e na comparação. Com o separador ponto, os campos mostram o texto com vírgula e ponto trocados e trocam de volta ao digitar; como a troca desfaz a si mesma, mudar o separador não converte nada guardado, e um arquivo exportado por quem usa vírgula abre igual para quem usa ponto. A alternativa, converter os dados a cada troca, arriscaria corromper campos inválidos e deixaria arquivos dependentes de quem os exportou.

## Consequências

- Um campo inválido continua inválido nos dois separadores ("1.234,5" vira "1,234.5").
- A formatação de números recebe o separador, que chega aos componentes por um contexto do React (`SeparatorContext`).
- O app continua só em português e em reais: o separador muda a escrita dos números, não a moeda nem o idioma.
