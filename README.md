# Luta de Feio

Jogo de luta em navegador com Marica, Hiro e Lobão. Dois jogadores por sala, até 20 espectadores, melhor de três rounds e modo de treino.

## Controles

A/D: andar. W: pular. S: abaixar. J: soco. K: chute. L: defender. I: especial (60 de energia).

## Funcionamento online

O criador da sala executa a simulação. Os outros participantes recebem o mesmo estado por WebRTC DataChannel. D1 guarda as salas, credenciais efêmeras, sinalização e retransmissão HTTP quando a conexão direta não funciona. A retransmissão tem maior latência. A partida pausa quando o criador deixa a arena em segundo plano ou o rival desconecta. Não há servidor independente de arbitragem nem rollback competitivo nesta versão.

As salas expiram após quatro horas e são encerradas quando o criador sai. Cada jogador escolhe seu personagem antes de entrar; um personagem já ocupado não pode ser escolhido pelo rival. Espectadores não têm permissão para enviar comandos. Credenciais são únicas por sessão; apenas os hashes são guardados.

## Desenvolvimento

Projeto Vinext / React / Cloudflare Workers, D1. Instalar com npm run install:ci e abrir com npm run dev. Migrações em drizzle/. A hospedagem é gerenciada pelo Sites com o projeto identificado em .openai/hosting.json.

Validação: node --experimental-strip-types tests/game.test.ts; node tests/rooms.test.mjs; npx tsc --noEmit; npm run build. O teste de salas aceita uma origem como argumento e remove as salas que cria.

## Arte

Personagens e folhas de sprites foram gerados a partir das referências fornecidas pelo usuário. O cenário foi gerado para o jogo. O recorte das folhas, remoção do fundo e posicionamento são feitos pelo renderizador do jogo. Os sprites são quadros-base e podem receber mais quadros de transição em versões futuras.

## Personagens

O catálogo está em lib/characters.ts. Marica: Brinde Sísmico; Hiro: Galinha das Sombras; Lobão: Uivo Felpudo, uma onda azul-prateada em forma de cabeça de lobo. Todos têm as sete ações e especiais com o mesmo custo e dano-base.
