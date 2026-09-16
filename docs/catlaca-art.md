# Catlaca — direção de arte

O retrato e a folha foram gerados com a ferramenta integrada de imagens a partir da fotografia fornecida. A interface do celular, a mesa e o desenho da camiseta da foto não fazem parte do personagem. A folha do Véio serviu apenas como referência de estrutura e estilo.

## Retrato — prompt final

Use case: stylized-concept. Asset type: main portrait for a 1990s arcade fighting game. Use the attached photo as an identity reference only. Preserve the man's recognizable facial proportions, short dark hair, short dark beard with some gray, light-to-medium brown skin and robust short-to-average build. Ignore the phone interface, furniture, bottles, table, food and photographed shirt graphic. Create one original adult male fighter, full body from head to shoes, facing right in a confident but friendly fighting stance. Use crisp 16-bit 1990s arcade pixel art, a bold silhouette and game-ready detail. Dress him in a plain navy-blue T-shirt without logo, dark pants and understated sneakers. Solid dark navy backdrop; exactly one human, fully inside the frame. No text, protected character costume, weapons, gore or watermark.

## Folha de sprites — prompt final

Use case: stylized-concept. Asset type: production sprite sheet for an original 1990s arcade fighting game. The identity photo supplies only Catlaca's face, body type, skin tone, short dark hair and short beard with gray. Follow the supplied sprite-sheet reference for seven-row, four-frame organization and 16-bit style; keep Catlaca consistent with the generated portrait. Create a 1024 × 1536 sheet with the title CATLACA and exactly seven action rows labeled ANDAR, PULAR, ABAIXAR, CHUTE, SOCO, ESPECIAL, DEFESA. Exactly four distinct full-body right-facing Catlaca figures per row, 28 in total. Use a medium-light gray background. The special shows an invocation, dark bats with purple outlines appearing, a swarm flying right and a recovery frame with a compact group of four to six bats fully detached and crop-ready. Keep the bats within the special row and canvas. No wolf logo, weapons, gore, skulls, protected character costume, watermark or extra labels.

## Integração

A folha gerada tem leve variação azul-acinzentada no fundo. O processamento em `scripts/prepare-sheets.py` usa a cor amostrada em cada recorte para gravar transparência real, inclusive entre as pernas. A versão gerada sem transparência está em `art/source/catlaca-sheet.png`; a versão usada pelo jogo está em `public/assets/catlaca-sheet.png`. Para repetir somente esse processamento: `python scripts/prepare-sheets.py --sheet catlaca-sheet.png --src art/source --out public/assets`. O renderizador recorta o grupo final de morcegos como projétil e aplica brilho roxo durante o voo.
