# Luta de Feio — handoff para a equipe

## 1. Ponto de partida

Esta entrega contém o código-fonte e os recursos da sétima versão de **Luta de Feio**, um jogo de luta 2D em pixel art para navegador. A equipe pode executar, testar, modificar e versionar esta pasta em seu próprio ambiente.

- **Jogo publicado:** https://luta-de-feio.alexandrebensonsmith.chatgpt.site/
- **Revisão de origem:** o commit `HEAD` do repositório que acompanha esta pasta; o pacote externo registra o SHA completo em `ENTREGA.json`.
- **Versão publicada no Sites:** 7.
- **Estado do código:** cópia dos arquivos versionados desta revisão, incluindo este handoff. O código de execução não foi alterado para empacotar a entrega.
- **Estado do produto:** protótipo jogável. Não é uma implementação de netcode competitivo nem uma operação validada para grande volume de usuários.

A pasta não depende dos caminhos pessoais da máquina em que o jogo foi criado. O checkout original e o site publicado foram preservados. Este pacote não publica alterações automaticamente.

### Conteúdo e exclusões

Estão incluídos código de interface e servidor, regras de combate, rede, renderizador, imagens finais, sprites, migrações, testes, scripts, configurações e `package-lock.json`. Também permanecem os componentes e exemplos fornecidos pelo starter.

Não estão incluídos `node_modules`, resultados de build, caches, banco local, dados de partidas de produção, credenciais de publicação ou a pasta `.git`. As fotografias originais usadas como referências não são necessárias para executar o jogo e não integram esta entrega. Os PNGs usados no jogo estão em `public/assets/`.

## 2. Escopo implementado

| Área | Comportamento atual |
| --- | --- |
| Personagens | Marica, Hiro, Lobão, Ratão, Bale, Véio e Catlaca; cada jogador escolhe um personagem, sem duplicidade na sala |
| Partida | Dois jogadores, 99 segundos por round, vence quem conquista dois rounds |
| Empate | Não concede vitória; inicia outro round, podendo ultrapassar três rounds |
| Ações | Andar, pular, abaixar, soco, chute, defesa e especial |
| Especial do Marica | Brinde Sísmico: projétil de energia dourada |
| Especial do Hiro | Galinha das Sombras: galinha preta com velas e energia violeta |
| Especial do Lobão | Uivo Felpudo: onda azul-prateada em forma de cabeça de lobo |
| Especial do Ratão | Bicicleta Voadora: bicicleta giratória arremessada contra o oponente |
| Especial do Bale | Turma dos Sete: sete pequenos guerreiros de conto de fadas avançam em grupo |
| Especial do Véio | Arroto Radioativo: nuvem tóxica verde em forma de caveira |
| Especial do Catlaca | Ataque de Morcegos: enxame escuro com brilho roxo |
| Salas | Código de oito caracteres; validade de quatro horas |
| Espectadores | Limite configurado de 20; recebem o estado da luta sem controlar jogadores |
| Treino | Um lutador controlável e um alvo parado |
| Arcade (1 jogador) | Modo padrão da tela inicial. O jogador enfrenta os outros lutadores do elenco em sequência, em ordem sorteada a cada partida (o chefe do rock star por último), contra um adversário controlado pelo jogo; cada etapa reage mais rápido, defende e usa o especial com mais frequência. Derrota permite repetir a etapa; vencer todos mostra a tela de campeão |
| Interface | Teclado, botões de toque, som simples opcional e tela cheia |
| Acesso | Site público; não é necessário criar conta no jogo |
| Cenário | Entrada da ETE Lauro Gomes em pixel art; a esquina original permanece em `public/assets/arena-esquina-original.png` |

### Controles

| Tecla | Ação |
| --- | --- |
| A / D | Andar para esquerda / direita |
| W | Pular |
| S | Abaixar |
| J | Soco |
| K | Chute |
| L | Defender enquanto mantida pressionada |
| I | Especial, desde que haja pelo menos 60 de energia |

Os ataques podem se repetir quando a tecla permanece pressionada. O cliente mantém pulsos mínimos de 120 ms para salto, soco, chute e especial, tanto no teclado quanto nos botões de toque, permitindo que toques rápidos sejam observados pela simulação/rede. Não há reconhecimento de comandos como meia-lua nem sistema de combos.

## 3. Executar em uma máquina nova

### Requisitos

- Node.js com npm instalado. O ambiente usado para validar a versão tinha **Node 24.19.0**; use Node 24 como referência inicial. O `package.json` declara `>=22.13.0`.
- Rede para instalar as dependências do lockfile.
- Navegador com Canvas 2D e, para conexão direta, WebRTC DataChannel.
- Para desenvolver localmente não é necessário ter acesso à conta de hospedagem.

Abra o terminal **na raiz desta pasta**, onde está `package.json`:

```sh
npm run install:ci
npm run build
```

O build gera `dist/server/wrangler.json`, usado para preparar o banco local. Aplique a migração abaixo **somente na primeira configuração de um banco vazio**:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_moaning_iceman.sql
```

Depois inicie o desenvolvimento:

```sh
npm run dev
```

Use o endereço exibido no terminal; o script solicita a porta 5173. O banco local fica em `.wrangler/state` e não é o banco de produção. `npm start` executa o Worker previamente compilado em uma prévia local, usando o endereço informado pelo Wrangler.

### Detalhes que evitam problemas de instalação

- Preserve `package-lock.json`; há dependências beta e versões específicas do starter.
- O nome técnico do pacote ainda é `site-creator-vinext-starter`; o nome do produto é **Luta de Feio**. Isso não impede a execução.
- `scripts/execution-profile.mjs` escolhe `portable` quando `.sites-runtime/execution-profile.json` não existe; a cópia limpa funciona sem esse arquivo.
- Não é necessário criar `.env` para o fluxo atual. O binding de banco `DB` é configurado no Vite/Workers, não por uma senha incluída no código.
- `npm run db:generate` serve para gerar migrações após mudanças de esquema. Não é necessário regenerar a migração existente para iniciar o projeto.
- Preserve `sites()` em `vite.config.ts`: o plugin prepara o pacote de hospedagem e os metadados do Worker.
- Se surgir `no such table: rooms`, confirme que a migração foi aplicada ao banco **local**, usando o mesmo `--persist-to .wrangler/state`.
- Se o binding `DB` estiver indisponível, verifique `d1: "DB"` em `.openai/hosting.json` e reinicie a prévia após alterações nessa configuração.

## 4. Mapa do código

| Caminho | Responsabilidade |
| --- | --- |
| `app/page.tsx` | Lobby, escolha de personagem, sessão, teclado/toque, loop principal, HUD, treino, arcade e convites |
| `lib/ai.ts` | Adversário controlado pelo jogo: escada de oponentes, parâmetros por etapa e decisão de comandos por passo da simulação, com gerador determinístico para testes |
| `app/globals.css` | Aparência, layout responsivo e controles de toque |
| `app/layout.tsx` | Metadados, idioma e documento base |
| `app/api/room/route.ts` | API de salas, autorização por sessão, sinalização e retransmissão HTTP |
| `lib/characters.ts` | Catálogo, identificadores, nomes, especiais e validação dos personagens |
| `lib/game.ts` | Estado e simulação: movimento, colisão, dano, especiais, pausa, rounds e revanche |
| `lib/network.ts` | `RoomNetwork`, conexões WebRTC, polling HTTP e distribuição do estado |
| `lib/render.ts` | Carregamento de arte, recortes dos sprites, remoção de fundo e desenho no Canvas |
| `db/schema.ts` | Esquema Drizzle das tabelas `rooms` e `members` |
| `drizzle/` | SQL e metadados das migrações |
| `db/index.ts` | Helper Drizzle do starter; a API de salas usa diretamente statements preparados de D1 |
| `tests/game.test.ts` | Testes da simulação, executáveis sem navegador ou dependências instaladas |
| `tests/ai.test.ts` | Testes do adversário automático: escada, escala por etapa, nocaute de alvo parado, troca de golpes entre duas IAs e coerência dos comandos |
| `tests/rooms.test.mjs` | Testes HTTP de criação, ocupação, espectadores e permissões; exigem servidor ativo |
| `public/assets/` | Cenário, retratos e folhas de sprites |
| `build/sites-vite-plugin.ts` | Integração de build com Sites |
| `scripts/` | Instalação, execução e configuração de ambiente |
| `scripts/prepare-sheets.py` | Grava o fundo transparente nas folhas de sprites (Python 3 + Pillow); a tabela de recortes espelha `lib/render.ts` |
| `components/`, `hooks/`, `vendor/` | Recursos do starter, em grande parte não usados pela interface atual |
| `examples/` | Exemplo de D1; não faz parte do fluxo de jogo |
| `.openai/hosting.json` | Identidade do Site e bindings lógicos de hospedagem |

## 5. Arquitetura e fluxo de uma partida

```text
Jogador 1 / criador da sala
  ├── executa a simulação em passos fixos de 1/60 s
  ├── recebe comandos do jogador 2
  └── envia snapshots para jogador 2 e espectadores
            │
            ├── preferencialmente: WebRTC DataChannel
            └── alternativa: POST /api/room + Cloudflare D1

Interface React → Canvas 2D → atlas preparado a partir dos PNGs
API de salas → Worker compatível com Cloudflare → binding D1 "DB"
```

O primeiro participante cria a sala e ocupa `slot = 0`. Um segundo participante ocupa `slot = 1`; um índice único no banco impede que dois rivais conquistem esse lugar simultaneamente. Espectadores têm `slot = null`.

O criador inicia a contagem quando detecta o rival. O segundo jogador envia apenas comandos; o criador executa as regras e envia o estado resultante. Os espectadores renderizam esses mesmos snapshots. **O servidor HTTP não calcula o combate nem valida o resultado de cada golpe.**

As fases são `waiting`, `countdown`, `fight`, `round` e `over`. O contador `tick` ordena os snapshots e precisa permanecer crescente, inclusive na revanche. A simulação roda dentro de um loop de `requestAnimationFrame` com acumulador de tempo; o desenho também usa esse loop. O envio direto ocorre aproximadamente a cada 33 ms.

O navegador do criador pausa o combate ao ficar oculto ou quando o rival não é considerado presente. Não há migração automática de host. A ausência é inferida por heartbeats, não por uma conexão permanente do servidor com cada usuário.

### Rede e protocolo

- DataChannel não ordenado, com `maxRetransmits: 0`.
- Mensagem direta do rival: `{ type: "input", input: { ...booleanos } }`.
- Mensagem direta do criador: `{ type: "state", state: { ... } }`.
- Servidores STUN configurados: Cloudflare e Google. Não há TURN configurado.
- A negociação SDP passa pelo banco. A coleta ICE espera no máximo 1.600 ms; não há envio incremental de candidatos posterior.
- Se a conexão com um participante falhar, ou o canal não abrir em 12 s, o criador descarta a conexão e envia uma nova oferta, no máximo três vezes por participante. Depois disso a sessão permanece na alternativa HTTP.
- Na alternativa HTTP, os intervalos são 110 ms para participantes ativos, 220 ms para espectador e 1.000 ms quando as conexões diretas necessárias estão abertas; soma-se a duração da requisição. Erros passam a usar 1.500 ms.
- O número de milissegundos mostrado na interface é o tempo da requisição de sala, **não** o RTT da conexão de luta.

### API `POST /api/room`

Todas as operações usam JSON e respostas sem cache. As operações de sessão recebem `id` no corpo e `Authorization: Bearer <token>` no cabeçalho.

| `op` | Quem usa | Dados principais / efeito |
| --- | --- | --- |
| `create` | Novo participante | `name`, `hero`; devolve código e sessão do criador |
| `join` | Novo participante | `code`, `name`, `hero`, `watch`; devolve sessão de rival ou espectador |
| `peek` | Lobby de quem tem um código | `code`; devolve nome e personagem do criador, rival já sentado (se houver) e quantidade de espectadores. Sem sessão e sem segredos |
| `signal` | Sessão existente | Criador envia `target` e oferta SDP; outro participante responde SDP |
| `sync` | Sessão existente | Atualiza presença; rival pode enviar `input`; somente criador envia `state` |
| `leave` | Sessão existente | Remove participante; a saída explícita do criador apaga a sala |

Erros de ocupação retornam 409; sessão inválida, 401; ação não permitida, 403. O tratamento genérico de exceções retorna 500. Validar melhor payloads malformados é um item do backlog.

### Dados

- `rooms`: código, ID do criador, criação, expiração, último snapshot e horário de atualização.
- `members`: ID, sala, hash de segredo, apelido, slot, personagem, presença, comandos e oferta/resposta SDP.
- O token bruto fica em memória no cliente; D1 armazena seu SHA-256.
- A limpeza de salas expiradas ocorre ao criar novas salas. Membros antigos são limpos no fluxo de entrada e filtrados por presença nas respostas.
- Atualizar a página perde a sessão em memória; não existe retomada persistente após reload.

## 6. Regras iniciais de combate

Os sete personagens compartilham os mesmos números de combate; a diferenciação atual é principalmente visual.

| Parâmetro | Valor atual |
| --- | --- |
| Vida | 100 |
| Energia inicial / limite | 35 / 100 |
| Regeneração | 4,5 de energia por segundo durante combate |
| Custo de especial | 60 |
| Dano do soco / chute / especial | 8 / 13 / 23 |
| Alcance horizontal do soco / chute | 100 / 140 unidades do mundo |
| Bloqueio | Recebe cerca de 12% do dano, arredondado, com mínimo de 1 |
| Movimento | 235 unidades por segundo |
| Velocidade do projétil | 470 unidades por segundo |
| Mundo / Canvas lógico | 960 × 540 |

Soco em pé não acerta o oponente abaixado; chute pode acertá-lo. Defesa exige chão e orientação correta. Há colisão simples entre os corpos e knockback, mas não há hitboxes/hurtboxes por frame. A ordem de processamento dos lutadores pode influenciar trocas simultâneas de golpes; incluir testes e decidir a regra desejada antes de balancear competição.

## 7. Arte e inclusão de personagens

`public/assets/hiro-sheet.png` e `lobao-sheet.png` têm sete linhas de ações; `marica-sheet.png` tem seis e a defesa está em `marica-defense.png`. Cada ação usa quatro quadros-base. Os retratos individuais também estão incluídos. Os recortes, escalas e âncoras estão definidos manualmente em `lib/render.ts`.

As folhas em `public/assets/` já têm o fundo transparente. Essa transparência é gravada uma vez por `scripts/prepare-sheets.py`, que recebe as folhas com fundo cinza, decide o que é fundo por preenchimento a partir da borda de cada recorte mais uma regra para o fundo preso entre as pernas, e salva PNG de 255 cores com um índice reservado para o transparente. A opção `--preview` gera imagens de conferência com os sprites sobre magenta. O renderizador só recorta e apaga a sombra do chão; não há mais heurística de cor em tempo de execução. Ao receber uma folha nova ou alterada, rodar a ferramenta e revisar o preview antes de publicar. Algumas poses de repouso, dano e derrota reutilizam desenhos de outras ações. Os especiais combinam elementos da folha com efeitos desenhados pelo jogo.

Para acrescentar um lutador, atualizar o catálogo `lib/characters.ts`, registrar retrato e atlas em `lib/render.ts`, repetir os mesmos retângulos na tabela de `scripts/prepare-sheets.py` e rodar a ferramenta, implementar seu efeito especial e ampliar os testes. A interface e a validação de entrada usam o catálogo; o estado recebe os dois personagens selecionados. Rounds e revanche preservam essa dupla.

`create` e `join` devolvem `hostHero`. A entrada como jogador aceita `hero`; seleção desconhecida retorna 400 e seleção igual ao criador retorna 409. Se `hero` for omitido, a API escolhe o primeiro personagem diferente do criador para compatibilidade. Espectadores não ocupam um personagem. O host recria o estado sempre que entra um novo rival, qualquer que seja o personagem escolhido, mantendo `tick` crescente. Um rival substituto nunca herda o placar do anterior. Nenhuma migração de banco foi necessária.

O Lobão tem retrato individual e folha de 28 quadros (sete ações por quatro quadros). Seu especial usa a tecla I e os mesmos 60 de energia / 23 de dano-base dos demais. O projétil visual é recortado da quarta célula da linha ESPECIAL. As passadas 1 e 3 são semelhantes; refinar essa animação é trabalho futuro.

O Ratão também tem retrato individual e folha de 28 quadros. Sua sequência especial mostra a preparação, a bicicleta erguida, o arremesso e a recuperação. A bicicleta é recortada separadamente e gira durante o voo. O disparo ocorre em 0,55 s, um pouco depois dos demais especiais, para sincronizar o projétil com a animação; custo e dano-base permanecem 60 e 23. A direção de arte e os prompts finais estão em `docs/ratao-art.md`.

Bale é desenhado a 78% da escala visual dos demais lutadores, com sombra e limite vertical de projéteis reduzidos para acompanhar a menor estatura. Seu especial combina seis mineiros originais da célula final com um sétimo mineiro de outra célula, formando o grupo completo no jogo. Os desenhos são personagens genéricos de conto de fadas e não reproduzem a caracterização da Disney. A direção de arte, os prompts e a composição estão documentados em `docs/bale-art.md`.

O Véio tem retrato individual e folha de 28 quadros. Seu especial mostra o lutador segurando o estômago, soltando vapor verde e lançando uma nuvem radioativa em forma de caveira. O projétil é recortado da terceira célula da linha ESPECIAL, recebe brilho verde no Canvas e usa os mesmos 60 de energia / 23 de dano-base. A geração precisou de uma correção dirigida para manter a nuvem final inteira dentro da folha; os prompts e a decisão de integração estão em `docs/veio-art.md`.

O Catlaca tem retrato individual e folha de 28 quadros. Seu especial lança um grupo de morcegos recortado da quarta célula, com brilho roxo. A folha original está em `art/source/catlaca-sheet.png` e a versão transparente usada pelo jogo está em `public/assets/catlaca-sheet.png`. O processamento também remove um trecho do rótulo ABAIXAR que invadia o primeiro quadro. Os prompts e detalhes estão em `docs/catlaca-art.md`.

## 8. Testes e evidências

Com a instalação concluída:

```sh
node --experimental-strip-types tests/game.test.ts
node --experimental-strip-types tests/ai.test.ts
npm exec tsc -- --noEmit
npm run build
```

Em outro terminal, com `npm run dev` ativo e o banco preparado:

```sh
node tests/rooms.test.mjs
```

É possível fornecer uma origem alternativa como argumento do teste de salas. **Esse teste cria e apaga salas reais no endereço escolhido.** Use uma prévia própria durante o desenvolvimento; não é um teste somente de leitura.

### O que foi validado nesta atualização

- Simulação: alcance de golpes, redução de dano na defesa, esquiva abaixada, chute, salto e aterrissagem, energia/especial, rounds, revanche e pausa.
- API local nesta atualização: consulta do lobby por código, disputa concorrente pela segunda vaga, espectador, autorização por papel, transmissão de comandos e snapshots, isolamento de tokens, substituição do rival, encerramento e Catlaca nos dois lugares.
- TypeScript e build passaram.
- Na primeira versão, três sessões de navegador na prévia local conectaram dois jogadores e um espectador por conexão direta. Nesta atualização foram verificados o Catlaca na seleção e na arena, o Ataque de Morcegos no treino, sua escolha online, a rejeição de escolha duplicada/inválida e espectadores recebendo a dupla escolhida.
- A página pública carregou e a publicação foi confirmada.

Não foi realizado teste de carga com 20 espectadores, nem validação exaustiva em redes distintas, navegadores diferentes, dispositivos móveis ou cenários de perda de pacotes. O teste HTTP não valida sozinho a execução real do WebRTC. O pacote exportado possui verificação de integridade separada em `ENTREGA.json` e `SHA256SUMS.txt`.

## 9. Backlog priorizado

As sugestões abaixo são trabalho futuro; não devem ser interpretadas como recursos já implementados.

### P0 — confiabilidade e limites do protótipo

- Definir a estratégia de autoridade: servidor de partida próprio para maior integridade, ou continuar com host no navegador assumindo suas limitações.
- Melhorar reconexão: ICE restart, retomada de sessão e tratamento de troca/perda do criador. Hoje o criador apenas refaz a oferta até três vezes; depois disso a sessão permanece na alternativa HTTP.
- Incluir sequenciamento dos comandos diretos: o canal é não ordenado e atualmente apenas os snapshots possuem ordenação por `tick`.
- Medir atraso de ponta a ponta, perda de mensagens e custos das leituras/escritas D1 do fallback; não tratar o polling como netcode final.
- Fortalecer validação de JSON, SDP, estados e tamanho do corpo antes de carregar payloads excessivos. Adicionar limites de frequência por sala/participante.
- Testar múltiplas salas, duas redes domésticas, rede móvel, suspensão de aba, fechamento abrupto e retorno de conexão.

### P1 — experiência e qualidade de luta

- Produzir atlas com dimensões uniformes e adicionar quadros intermediários. O fundo transparente já está resolvido pelas folhas preparadas.
- Criar poses próprias de idle, dano, queda, derrota e vitória; revisar sprites de especiais e alinhamento dos pés.
- Modelar hitboxes/hurtboxes por frame, recuperação de golpes e resolução de acertos simultâneos.
- Adicionar interpolação/predição; avaliar rollback somente depois de estabelecer uma simulação e um protocolo adequados.
- Medir e mostrar a latência da luta separadamente do tempo de resposta da API de sala.
- Rever controles de toque, comportamento em tela cheia, acessibilidade e suporte a controles físicos.

### P2 — expansão de produto

- Golpes com parâmetros próprios por personagem; o catálogo e a seleção sem duplicidade já estão implementados.
- Personagens adicionais, cenários, efeitos sonoros e música.
- Adversário de treino com IA e opções para configurar treino.
- Revanche consensual, fila de desafiantes e histórico/ranking, somente se aprovados no escopo do produto.
- Observabilidade operacional e orçamento de infraestrutura compatíveis com o público real.

## 10. Hospedagem e continuidade

O projeto usa **Sites**, executando um Worker compatível com Cloudflare e um banco D1 provisionado pela plataforma. A pasta `.openai/hosting.json` mantém o identificador real `appgprj_6aa9f0b1c6788191b953c55d7111d831` e o binding lógico `DB`.

Para atualizar o **mesmo jogo**, a equipe precisa de acesso autorizado ao Site e ao repositório de origem. O dono deve conceder esse acesso pelos mecanismos da plataforma. A entrega não contém tokens; credenciais temporárias de escrita são obtidas pela integração Sites no momento da publicação.

Repositório oficial da equipe, no GitHub: https://github.com/bensonsbc/feiofight (branch main).

Repositório de origem no Sites, sem credenciais embutidas:

```text
https://git.chatgpt-team.site/43b1b898-d41b-47b1-a93f-f710ab2b6a72/appgprj_6aa9f0b1c6788191b953c55d7111d831.git
```

Fluxo de continuidade no Sites: reutilizar o projeto existente; consultar as instruções e ferramentas Sites disponíveis no ambiente da equipe; compilar e testar; criar commit; enviar o commit exato; empacotar o build correspondente; salvar versão; publicar e confirmar o resultado. Preservar o público atual, salvo decisão do proprietário.

O artefato de publicação contém `dist/server/index.js`, assets e metadados em `dist/.openai/`, incluindo migrações quando existentes. Este ZIP de código **não é** o arquivo de build para publicar diretamente.

Não editar migrações já aplicadas em produção. Alterações futuras devem gerar novas migrações, revisadas e testadas. O ID `00000000-0000-4000-8000-000000000000` em `vite.config.ts` é apenas o identificador do banco de prévia, não o banco real.

Para migrar para hospedagem independente, adaptar a integração de build, o provisionamento de D1 e os bindings. A presença de React/Next no projeto não significa que bastará publicar como site estático: as salas exigem a API de servidor. Para criar uma instalação separada, provisionar uma identidade de projeto própria; não reutilizar acidentalmente o identificador de produção.

### Primeira sessão sugerida para a equipe

1. Ler este handoff, instalar as dependências e preparar um banco local vazio.
2. Executar os testes de simulação, tipos, build e API.
3. Abrir uma sala com dois dispositivos e um espectador; testar todos os comandos e desconexões.
4. Decidir a arquitetura de rede pretendida e o próximo conjunto de melhorias.
5. Estabelecer um repositório/branch de trabalho e acesso autorizado à hospedagem antes da primeira publicação da equipe.

## 11. Alterações da quinta para a sexta versão (16/09/2026)

As mudanças abaixo foram aplicadas sobre a versão 5. O pacote externo atualizado registra os arquivos e checksums desta sexta versão. A publicação paralela na Cloudflare é independente da publicação no Sites.

| Arquivo | Mudança |
| --- | --- |
| `app/page.tsx` | Botões de toque usam o mesmo pulso de 120 ms do teclado. Link com `assistir=1` entra na arquibancada automaticamente. Um novo rival sempre inicia uma partida nova. Nomes dos especiais vêm só do catálogo. |
| `lib/network.ts` | O criador refaz a oferta WebRTC para conexões falhas ou paradas por 12 s, até três vezes por participante. |
| `app/api/room/route.ts` | Limite de 20 espectadores aplicado dentro do `INSERT`, por contagem de `slot IS NULL`, sem janela de concorrência. Nova operação `peek` para o lobby de convidados. |
| `app/page.tsx` (lobby do convidado) | Com um código válido, a página consulta a sala e mostra o criador fixo à esquerda, o convidado à direita, o personagem do criador bloqueado na seleção e o botão de entrar desativado quando o rival já sentou. Antes o convidado via a tela como se fosse o primeiro a escolher. |
| `scripts/prepare-sheets.py` | Decide o fundo de cada recorte fora do jogo e grava como transparência PNG. Corrige três problemas do recorte antigo: o pixel do canto usado como referência mantinha o fundo inteiro em três quadros de defesa do Ratão; o fundo preso entre as pernas ficava cinza no Ratão, Bale e Véio; a limpeza por faixa comia a barra da camisa clara da Marica na defesa. Aceita `--sheet` para processar só a nova folha. |
| `lib/render.ts` | `cut()` apenas recorta e apaga a sombra do chão. Removida toda a heurística de cor e os parâmetros `clearLegGap`, `minBackground` e `sampleBackground`. |
| `public/assets/*-sheet.png`, `marica-defense.png` | Regeradas pela ferramenta a partir das folhas RGB originais: 255 cores mais índice transparente. |
| `public/assets/arena.png` | Redimensionada para 960 × 540, o tamanho em que é desenhada, e quantizada com dithering. |
| `lib/characters.ts`, `lib/render.ts`, `art/source/`, `public/assets/catlaca*` | Catlaca, suas sete ações e o especial de morcegos; folha com transparência preparada fora do jogo. |

### Publicação paralela na Cloudflare (16/09/2026)

Além do Sites, o jogo está publicado na conta Cloudflare do proprietário, plano Workers Free, como Worker `luta-de-feio` com banco D1 `luta-de-feio` (id `8a0bbd6e-fec9-4ab5-a4f5-cf4091278552`, migração aplicada). Endereço: https://luta-de-feio.alexandrebenson.workers.dev. A sexta versão, com o Catlaca, foi publicada nesse endereço em 16/09/2026 a partir do commit `0044e5b`; o teste HTTP de salas passou contra ele e o Catlaca foi conferido no treino. O `vite.config.ts` passou a aceitar `D1_DATABASE_NAME` e `D1_DATABASE_ID` por variável de ambiente; sem elas o build continua usando o placeholder do Sites. Fluxo de atualização:

```sh
D1_DATABASE_NAME=luta-de-feio D1_DATABASE_ID=8a0bbd6e-fec9-4ab5-a4f5-cf4091278552 npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js deploy --config dist/server/wrangler.json --name luta-de-feio
```

Limites do plano gratuito que importam: 100.000 requisições e 100.000 linhas gravadas no D1 por dia. Cada sondagem de presença grava linhas; com conexão direta isso dá cerca de 4 a 5 horas de partida por dia. Reduzir a frequência do heartbeat quando o canal direto está aberto é a melhoria mais barata para ampliar esse teto.

No dia da publicação, a operadora do proprietário bloqueava os dois IPs atribuídos ao primeiro nome escolhido, `alexandrebensonsmith.workers.dev`, embora o site respondesse 200 de fora do país. A troca do subdomínio para `alexandrebenson` no painel da Cloudflare mudou o par de IPs e resolveu o acesso. Se voltar a acontecer, o diagnóstico é `tracert` até o IP: o bloqueio morre no roteador da operadora.

Os arquivos baixados pela página caíram de cerca de 15 MB para 3,5 MB. Os retratos individuais continuam RGB e não são carregados pelo jogo. As folhas RGB originais permanecem na revisão de origem `07d5858`.

Validação desta rodada: `tests/game.test.ts`, TypeScript, build e teste HTTP das salas passaram; o alfa da folha do Catlaca foi conferido sem erros, e seu recorte e ataque de morcegos foram revisados no navegador. O teste de salas cobre a consulta de lobby, rejeição de personagem duplicado, Catlaca como criador e espectador recebendo a dupla. O teste HTTP não substitui uma partida entre dispositivos reais.

## 12. Modo arcade para um jogador (16/09/2026)

O arcade é o modo padrão da tela inicial: o botão **JOGAR ARCADE** inicia uma sequência local contra o resto do elenco, em ordem sorteada a cada partida pelo mesmo gerador determinístico da IA (`ladder(hero, rng)`; sem gerador a ordem é a do catálogo, o que os testes usam), com o chefe sempre por último. O seletor **ARCADE / DUELO ONLINE** troca para o fluxo de sala, apelido e código; um convite (`?sala=`) abre direto em duelo. Nada de sala nem rede no arcade. O adversário é controlado por `lib/ai.ts`: a cada intervalo de reação ele decide um comando e o mantém, o que evita tremor. Ele avança quando está longe, soca ou chuta a curta distância, recua às vezes para reabrir espaço, defende quando o jogador ataca perto, tenta pular ou defender diante de um projétil e usa o especial de longe quando tem energia. A etapa define o intervalo de reação (de 0,34 s a 0,14 s) e as probabilidades de defesa, esquiva, especial e agressão. As regras de combate são as mesmas do modo online; não há vantagem numérica para a máquina.

Vencer dois rounds avança para a próxima etapa; perder permite repetir a mesma etapa; vencer as seis mostra a tela de campeão. A barra lateral lista os adversários com o estado de cada um. A partida pausa se a aba ficar em segundo plano, como no treino. O gerador de números é determinístico por semente, o que permite testes reproduzíveis em `tests/ai.test.ts`; no jogo a semente vem do relógio.

## 13. Elencos e o grupo Rock Star (16/09/2026)

O catálogo em `lib/characters.ts` passou a ter **elencos**: `turma` (os sete originais) e `rockstar` (Jim Morrison, John Lennon, Kurt Cobain, Ozzy Osbourne, Lemmy Kilmister, Elvis Presley, Sid Vicious, Keith Richards, Robert Smith, Joey Ramone e o chefe Rogério Skylab). Os identificadores são únicos entre elencos e `rosterOf(hero)` devolve o elenco de qualquer lutador.

- **Escolha.** O lobby tem um seletor de elenco e a URL aceita `?elenco=rockstar`; o padrão é a turma. O renderizador carrega só as folhas do elenco escolhido, cerca de 3,5 MB para a turma e 5,4 MB para o rock star.
- **Salas são exclusivas por elenco.** O elenco de uma sala é o do personagem do criador; não há coluna nova no banco. `join` com lutador de outro elenco devolve 409, `peek` devolve `roster`, e o convite leva `&elenco=` para o convidado abrir já no elenco certo.
- **Arcade** usa a escada do elenco do jogador: seis adversários na turma, dez no rock star, com o chefe por último.
- **Especiais.** Todos são projéteis com o mesmo custo e dano-base, recortados da folha: lagarto, pétalas, onda sonora, morcego sem cabeça, garrafa (gira), onda sísmica dourada, baixo (gira; o golpe corpo a corpo original virou arremesso por decisão do proprietário), cigarros, lágrimas e anéis psíquicos. O renderizador desenha qualquer projétil do atlas com brilho na cor do personagem.
- **Chefe.** Rogério Skylab entrou no catálogo quando a folha chegou (`ROSTER_INFO.rockstar.boss`). Ele fecha a ordem do elenco, então é sempre a última luta do arcade, e `levelFor(stage, boss)` lhe dá um nível acima da etapa máxima: reação de 0,10 s e quase sempre defende, esquiva e usa o especial. Ele também pode ser escolhido no lobby e em salas online, marcado como CHEFE; se o jogador o escolhe no arcade, a escada é o resto do elenco. O especial é o Arremesso de Dildo, um projétil como os demais.
- **Cenário por elenco.** `ROSTER_INFO[roster].arena` diz qual fundo o renderizador carrega: a ETE Lauro Gomes para a turma e a fachada do CBGB para o rock star (`public/assets/rockstar/arena.png`, 960 × 540 em paleta com dithering; original RGB em `art/source/rockstar/cbgb-arena.png`). A legenda abaixo da arena e a tela de campeão ("REI DO ROCK!") também vêm de `ROSTER_INFO`.

### Ferramenta de medição de folhas

`scripts/measure-sheets.py` detecta as figuras de uma folha no layout padrão (título, sete linhas rotuladas, quatro quadros por linha, fundo cinza) e escreve `atlas.json` com o recorte, a âncora dos pés, a altura de referência e o projétil de cada lutador. Ela separa as linhas pelos rótulos da esquerda, corta entre linhas na varredura mais vazia, ignora as sombras cinza que ligariam figuras vizinhas, divide componentes que um efeito uniu, e atribui cada efeito destacado da linha ESPECIAL ao lutador à sua esquerda. `OVERRIDES` no topo do script cobre o que a detecção não sabe: o projétil do Elvis, que encosta nos pés, e o baixo do Sid, que nunca se solta da mão. A opção `--preview` desenha recortes, âncoras e projétil sobre a folha para revisão.

A base de cada quadro (linha dos pés) vem da figura inteira, com seus fragmentos: um terno branco se parte em pedaços na detecção onde o sombreado se confunde com o fundo, e usar só o maior pedaço deixava quadros isolados do Lennon e do Elvis dezenas de pixels abaixo do chão. Os quatro quadros de uma linha (exceto PULAR) são alinhados pela mediana: um quadro que se afasta mais de 12 px dela assume a mediana. A sombra deixada no chão sob uma figura no ar e os efeitos à direita do lutador na linha ESPECIAL não contam como corpo. Restos do título que pendem para dentro da primeira linha e letras longas de rótulo entram na lista `erase`.

Na transparência (`prepare-sheets.py --atlas`), a sombra pintada no chão, um cinza azulado ao redor dos sapatos, é removida quando alcançável a partir do fundo nas 16 linhas acima da base; solas fechadas pelo contorno e o sombreado cinza das calças brancas, que não é azulado, ficam. Com a sombra fora, o vão entre as pernas se liga ao fundo e some sozinho; um vão grande fechado por um efeito no chão (a onda do Elvis) é reconhecido por ter a cor exata da folha, algo que dobras de roupa nunca têm.

Fluxo para uma folha nova no padrão: colocar o PNG em `art/source/<elenco>/`, rodar a medição com preview, revisar, rodar `scripts/prepare-sheets.py --atlas ... --src art/source/<elenco> --out public/assets/<elenco>` e acrescentar o lutador ao catálogo. `lib/render.ts` lê o atlas e não precisa de tabela escrita à mão; a turma original continua com as tabelas manuais.

Validação: `tests/roster.test.ts` confere os dois elencos, identificadores únicos, catálogo completo, oponente padrão do mesmo elenco, atlas com 7 × 4 quadros e projétil para cada rock star, e uma luta de rock stars com o dano-base do especial. O teste de salas cobre a recusa de lutador de outro elenco.

## 14. Cenário da sétima versão (16/09/2026)

O plano de fundo da arena foi trocado por uma interpretação em pixel art da fotografia da entrada da ETE Lauro Gomes fornecida pelo proprietário. O arquivo ativo é `public/assets/arena.png`. A arte anterior, da esquina, continua disponível em `public/assets/arena-esquina-original.png`, preservada byte a byte a partir da sexta versão. A legenda abaixo da arena foi atualizada em `app/page.tsx`. O renderizador continua carregando `arena.png`; nenhuma regra de combate, posição dos lutadores ou colisão depende do conteúdo da imagem. Para restaurar o cenário anterior, substitua `arena.png` pela cópia, atualize a legenda e publique uma nova versão.

A fotografia de referência não integra o repositório nem o pacote de entrega. A imagem gerada é uma interpretação visual, não uma reprodução documental do local.

O arquivo ativo `public/assets/arena.png` é a versão em 960 × 540 e paleta de 256 cores com dithering, o tamanho em que o jogo a desenha, com cerca de 370 KB. O original RGB de 1672 × 941 gerado para o cenário está em `art/source/arena-ete-lauro-gomes.png`. Ao trocar o cenário de novo, guardar o original em `art/source/` e gerar a versão reduzida para `public/assets/`, para manter o download da página perto de 4 MB.
