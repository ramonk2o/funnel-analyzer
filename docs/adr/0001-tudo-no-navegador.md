# Tudo no navegador, guardado no localStorage

O app não tem conta, servidor nem banco: roda inteiro no navegador, e os funis e as preferências ficam no `localStorage`, em chaves com o prefixo `analisador-de-funil:`. Escolhemos assim para o app ser pequeno, abrir sem cadastro e não ter custo de hospedagem de dados; trocar por um servidor depois mudaria onde os dados vivem e exigiria migrar o que cada pessoa já tem no navegador.

## Consequências

- Os dados ficam presos ao navegador em que foram criados; para levar um funil a outro lugar, só exportando e importando o arquivo.
- Várias abas abertas não se sincronizam: cada uma salva o que tem, e vale a última gravação.
- Renomear as chaves (como na troca de "Simulador de Funil" para "Analisador de Funil") faz o app esquecer o que estava salvo com o nome antigo.
- Com o armazenamento bloqueado ou cheio, o app funciona só na sessão e avisa que não está salvando.
