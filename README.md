# Luta de Feio

Jogo de luta em navegador com Marica, Hiro, Lobão, Ratão, Bale, Véio e Catlaca. Dois jogadores por sala, até 20 espectadores, melhor de três rounds, modo de treino e modo arcade para um jogador, em que você enfrenta os outros seis lutadores em sequência contra a máquina.

## Controles

A/D: andar. W: pular. S: abaixar. J: soco. K: chute. L: defender. I: especial (60 de energia).

## Funcionamento online

O criador da sala executa a simulação. Os outros participantes recebem o mesmo estado por WebRTC DataChannel. D1 guarda as salas, credenciais efêmeras, sinalização e retransmissão HTTP quando a conexão direta não funciona. A retransmissão tem maior latência. A partida pausa quando o criador deixa a arena em segundo plano ou o rival desconecta. Não há servidor independente de arbitragem nem rollback competitivo nesta versão.

As salas expiram após quatro horas e são encerradas quando o criador sai. Cada jogador escolhe seu personagem antes de entrar; um personagem já ocupado não pode ser escolhido pelo rival. Um convite com `assistir=1` entra direto na arquibancada. Espectadores não têm permissão para enviar comandos. Credenciais são únicas por sessão; apenas os hashes são guardados.

## Desenvolvimento

Projeto Vinext / React / Cloudflare Workers, D1. Instalar com npm run install:ci e abrir com npm run dev. Migrações em drizzle/. A hospedagem é gerenciada pelo Sites com o projeto identificado em .openai/hosting.json.

Validação: node --experimental-strip-types tests/game.test.ts; node --experimental-strip-types tests/ai.test.ts; node --experimental-strip-types tests/roster.test.ts; node tests/rooms.test.mjs; npx tsc --noEmit; npm run build. O teste de salas aceita uma origem como argumento e remove as salas que cria.

## Arte

Personagens e folhas de sprites foram gerados a partir das referências fornecidas pelo usuário. O cenário atual, inspirado na entrada da ETE Lauro Gomes, está em `public/assets/arena.png`; o cenário anterior, da esquina, foi preservado em `public/assets/arena-esquina-original.png`. Para voltar ao cenário anterior, copie esse arquivo sobre `arena.png` e faça uma nova publicação. As folhas têm fundo transparente gravado por scripts/prepare-sheets.py (Python 3 com Pillow), que também gera previews de conferência; o renderizador só recorta e posiciona. Os sprites são quadros-base e podem receber mais quadros de transição em versões futuras. As folhas existentes estão em paleta de 256 cores para reduzir o download; os originais RGB anteriores ficaram na revisão de origem. O original da folha do Catlaca está em art/source/catlaca-sheet.png e pode ser processado com `python scripts/prepare-sheets.py --sheet catlaca-sheet.png --src art/source --out public/assets`.

## Elencos

O jogo tem dois elencos, definidos em lib/characters.ts. A Turma do Feio é o padrão. O elenco Rock Star, com Jim Morrison, John Lennon, Kurt Cobain, Ozzy Osbourne, Lemmy Kilmister, Elvis Presley, Sid Vicious, Keith Richards, Robert Smith, Joey Ramone, Iggy Pop, Sergey e o chefe Rogério Skylab, é escolhido no lobby ou pela URL com `?elenco=rockstar`. Uma sala pertence a um único elenco, decidido pelo personagem do criador; o convite já leva o parâmetro e o convidado só vê lutadores desse elenco. O modo arcade, padrão da tela inicial (o seletor ARCADE / DUELO ONLINE leva ao jogo em sala), enfrenta os outros lutadores do elenco escolhido em ordem sorteada a cada partida; no Rock Star o chefe é sempre a última luta e reage mais rápido que qualquer etapa anterior. Cada elenco tem o seu cenário: a ETE Lauro Gomes para a turma e a fachada do CBGB para o rock star, em `public/assets/rockstar/arena.png`, com o original RGB em `art/source/rockstar/cbgb-arena.png`. As folhas do Rock Star vêm de `art/source/rockstar/`, são medidas por `scripts/measure-sheets.py`, que gera `atlas.json` com todos os recortes e o projétil de cada um, e recebem transparência por `scripts/prepare-sheets.py --atlas`.

## Personagens

O catálogo está em lib/characters.ts. Marica: Brinde Sísmico; Hiro: Galinha das Sombras; Lobão: Uivo Felpudo, uma onda azul-prateada em forma de cabeça de lobo; Ratão: Bicicleta Voadora, um arremesso giratório de bicicleta; Bale: Turma dos Sete, sete pequenos guerreiros de conto de fadas que avançam em grupo; Véio: Arroto Radioativo, uma nuvem tóxica verde em forma de caveira; Catlaca: Ataque de Morcegos, um enxame que avança contra o rival. Todos têm as sete ações e especiais com o mesmo custo e dano-base. Bale é renderizado em escala menor para representar sua baixa estatura.
