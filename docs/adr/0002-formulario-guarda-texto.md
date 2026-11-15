# O funil guarda o texto digitado, não números

O funil (`FunnelForm`) guarda cada campo como o texto que a pessoa digitou, e só vira número na hora de calcular (`readForm`). Assim um campo inválido continua na tela, no navegador e no arquivo exportado exatamente como foi digitado, e o funil fica congelado no último cálculo válido em vez de sumir ou de corrigir o texto sozinho. A alternativa óbvia, guardar números, perderia o que a pessoa estava digitando.

## Consequências

- O que é salvo no navegador e o formato do arquivo de funil são texto; mudar isso exige converter os dados e os arquivos já existentes.
- Todo lugar que mostra números (funil, comparação, tabela) parte do último formulário válido, não do formulário atual.
