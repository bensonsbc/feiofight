// Fighters are grouped in rosters. A room, a training session or an arcade run uses one roster;
// the page picks it from the URL (?elenco=rockstar) and the API derives it from the host's hero.
export const ROSTERS = {
  turma: ["marica", "hiro", "lobao", "ratao", "bale", "veio", "catlaca"],
  rockstar: ["jim-morrison", "john-lennon", "kurt-cobain", "ozzy-osbourne", "lemmy-kilmister", "elvis-presley", "sid-vicious", "keith-richards", "robert-smith", "joey-ramone", "iggy-pop", "sergey", "rogerio-skylab"],
} as const;
export type Roster = keyof typeof ROSTERS;
export type Hero = (typeof ROSTERS)[Roster][number];
export const DEFAULT_ROSTER: Roster = "turma";
export const HEROES: readonly Hero[] = [...ROSTERS.turma, ...ROSTERS.rockstar];

// `brand`/`title` name the game on the top bar and the tab; `arena` is the background the renderer loads for the roster; `boss` is the roster's final arcade
// opponent (always last in the roster order) and fights with the strongest AI level.
export const ROSTER_INFO: Record<Roster, { name: string; caption: string; edition: string; arena: string; champion: string; brand: [string, string]; title: string; boss?: Hero }> = {
  turma: { name: "Turma do Feio", caption: "ETE LAURO GOMES", edition: "VOL. 01", arena: "/assets/arena.png", champion: "CAMPEÃO DA TURMA!", brand: ["LUTA", "DE FEIO"], title: "Luta de Feio" },
  rockstar: { name: "Rock Star", caption: "CBGB", edition: "VOL. 02 · ROCK STAR", arena: "/assets/rockstar/arena.png", champion: "REI DO ROCK!", brand: ["CLUBE DA LUTA", "DO ROCK"], title: "Clube da Luta do Rock", boss: "rogerio-skylab" },
};

/**
 * Body stats. `hp` is the life bar; `speed` scales walking; `power` scales every hit dealt;
 * `height` scales the drawn sprite and the box a projectile can hit. Heavy fighters trade speed
 * for life and punch, light ones the opposite. Defaults are 100 / 1 / 1 / 1.
 */
export type Stats = { hp: number; speed: number; power: number; height: number };
/**
 * The special. Every special is a projectile, but each flies its own way: `height` is the pixel
 * above the floor it travels at (low ones are jumped over, high ones are crouched under), `speed`
 * in pixels per second and `damage` before the thrower's power.
 */
export type Shot = { speed: number; height: number; damage: number };
const STATS: Stats = { hp: 100, speed: 1, power: 1, height: 1 };
const SHOT: Shot = { speed: 470, height: 65, damage: 23 };

export type Character = { name: string; number: string; special: string; description: string; color: string; ending: string; story: string; stats?: Partial<Stats>; shot?: Partial<Shot> };
export const CHARACTERS: Record<Hero, Character> = {
  marica: { name: "MARICA", number: "01", special: "Brinde Sísmico", description: "Uma onda dourada rasteira. Pule ou tome no pé.", color: "#edc17a", ending: "Marica ergueu o copo para a turma inteira. Nenhuma gota derramada, nenhum rival de pé.", story: "Cresceu na porta da ETE Lauro Gomes com um copo na mão e nenhum derramado até hoje, o que na turma vale como diploma. Luta equilibrada, de pé firme e paciência: espera o erro do outro e cobra. O Brinde Sísmico é a onda dourada que sai do copo batido no chão, rasteira o bastante para pegar quem esqueceu de pular.", shot: { height: 26, speed: 430 } },
  hiro: { name: "HIRO", number: "02", special: "Galinha das Sombras", description: "Uma galinha preta invocada entre velas e energia violeta.", color: "#c895ff", ending: "Hiro apagou as velas. A galinha das sombras voltou para o quintal, satisfeita.", story: "Aprendeu a lutar entre velas, incensos e uma galinha preta que apareceu no quintal e nunca mais foi embora. É um pouco mais rápido que a média e gosta de trocar golpes de perto. A Galinha das Sombras é a invocação dessa amiga, envolta em energia violeta, que atravessa a arena na altura do peito.", stats: { speed: 1.05 } },
  lobao: { name: "LOBÃO", number: "03", special: "Uivo Felpudo", description: "Um uivo rápido em forma de lobo azul-prateado.", color: "#9cdbff", ending: "Lobão uivou para a lua da ETE. A turma inteira uivou junto, sem saber por quê.", story: "O maior da turma, de barba e voz de trovão, sempre o último a se levantar da mesa e o primeiro a defender um amigo. Peso-pesado: anda devagar, aguenta muito e cada soco pesa. O Uivo Felpudo lança um lobo azul-prateado rápido, para quem acha que pode manter distância dele.", stats: { hp: 110, speed: .92, power: 1.08 }, shot: { speed: 540, damage: 21 } },
  ratao: { name: "RATÃO", number: "04", special: "Bicicleta Voadora", description: "Arremessa uma bicicleta giratória, rápida mas leve.", color: "#ff9c70", ending: "Ratão pedalou para casa com o troféu no guidão. A bicicleta, milagrosamente, inteira.", story: "Nunca foi visto sem a bicicleta, nem dentro de casa. É o mais veloz da turma, entra e sai antes de o rival entender, mas cada golpe seu é leve. A Bicicleta Voadora é a própria bicicleta arremessada girando, o projétil mais rápido da ETE, e ele jura que ela sempre volta inteira.", stats: { hp: 92, speed: 1.15, power: .95 }, shot: { speed: 620, damage: 19 } },
  bale: { name: "BALE", number: "05", special: "Turma dos Sete", description: "Convoca sete pequenos guerreiros, lentos e pesados.", color: "#8ff0a4", ending: "Os sete guerreiros voltaram para o bolso do Bale. Ele é pequeno, mas a turma é grande.", story: "Pequeno, mas vive contando que tem sete amigos de conto de fadas do seu tamanho, e ninguém acredita até apanhar deles. Ágil e difícil de acertar, compensa a pouca vida com esquiva. A Turma dos Sete convoca os sete guerreiros numa marcha lenta e pesada que dói mais que qualquer especial da turma.", stats: { hp: 90, speed: 1.1, power: .9, height: .78 }, shot: { speed: 330, damage: 28 } },
  veio: { name: "VÉIO", number: "06", special: "Arroto Radioativo", description: "Uma nuvem verde alta e pesada em forma de caveira. Abaixe-se.", color: "#83f26b", ending: "Véio arrotou uma última vez e sentou no banco da praça. Ninguém sentou perto.", story: "O mais velho do grupo, dono do banco da praça e de uma dieta que a ciência não recomenda. Luta devagar e bate forte, como quem tem todo o tempo do mundo. O Arroto Radioativo solta uma caveira verde alta e lenta; quem abaixa passa por baixo, quem fica de pé sente o cheiro por dias.", stats: { hp: 106, speed: .9, power: 1.05 }, shot: { speed: 360, height: 110, damage: 26 } },
  catlaca: { name: "CATLACA", number: "07", special: "Ataque de Morcegos", description: "Um enxame alto e rápido de morcegos. Abaixe-se.", color: "#d09cff", ending: "Catlaca pendurou-se de cabeça para baixo na goleira. Os morcegos fizeram o mesmo.", story: "Apareceu na turma numa noite sem lua, de preto, e ficou. Rápido, imprevisível, prefere atacar de cima. O Ataque de Morcegos manda um enxame alto e veloz na altura da cabeça, feito para quem esquece de abaixar.", stats: { speed: 1.05, hp: 96 }, shot: { speed: 540, height: 120, damage: 20 } },
  "jim-morrison": { name: "JIM MORRISON", number: "01", special: "Ataque dos Lagartos", description: "Um lagarto verde corre rasteiro pela arena. Pule.", color: "#8ee36a", ending: "O Rei Lagarto atravessou a porta. Do outro lado, só o deserto e uma canção sem fim.", story: "O Rei Lagarto: poeta de Los Angeles, voz dos Doors e o primeiro a subir no palco do CBGB em transe. Luta equilibrado e teatral, de braços abertos. O Ataque dos Lagartos solta um lagarto verde rasteiro que corre pelo chão da arena; pule ou seja mordido.", shot: { height: 22, speed: 480, damage: 22 } },
  "john-lennon": { name: "JOHN LENNON", number: "02", special: "Chuva de Pétalas", description: "Pétalas caem alto e devagar. Abaixe-se.", color: "#ff9fb8", ending: "Lennon deitou na cama e declarou a paz. O CBGB, por uma noite, obedeceu.", story: "De Liverpool para o mundo com os Beatles, depois cantou a paz de terno branco e óculos redondos. Estilo calmo, de quem espera o momento. A Chuva de Pétalas cai alta e lenta sobre o rival; abaixar resolve, insistir em ficar de pé é romântico e doloroso.", shot: { height: 135, speed: 380, damage: 22 } },
  "kurt-cobain": { name: "KURT COBAIN", number: "03", special: "Onda Sonora do Riff", description: "Um riff produz uma onda serrilhada veloz na altura do peito.", color: "#7fd4ff", ending: "Kurt quebrou a guitarra no palco. Ninguém reclamou: era a melhor parte do show.", story: "Cardigã verde, guitarra desafinada de propósito e o grunge de Seattle nas costas. Um pouco menos resistente que a média, ataca em rajadas. A Onda Sonora do Riff é um acorde que vira uma onda serrilhada veloz na altura do peito.", stats: { hp: 96 }, shot: { speed: 560, damage: 22 } },
  "ozzy-osbourne": { name: "OZZY OSBOURNE", number: "04", special: "Morcego Sem Cabeça", description: "Arremessa um morcego sem cabeça, alto e rápido.", color: "#c27dff", ending: "Ozzy mordeu o troféu. Era de chocolate. Ainda assim, ninguém quis o resto.", story: "O Príncipe das Trevas, do Black Sabbath ao reality show, com uma história famosa envolvendo um morcego e um palco. Luta na média em tudo e aposta no medo. O Morcego Sem Cabeça é esse morcego, arremessado alto e rápido, para quem não abaixa a tempo.", shot: { speed: 560, height: 110, damage: 21 } },
  "lemmy-kilmister": { name: "LEMMY KILMISTER", number: "05", special: "Garrafa de Whiskey", description: "Uma garrafa pesada gira devagar até o adversário.", color: "#e0a45c", ending: "Lemmy pediu outra dose e ligou o amplificador no onze. O bairro inteiro ouviu.", story: "Baixo, chapéu, verrugas e o Motörhead no volume máximo por quarenta anos. Peso-pesado do elenco: o que tem mais vida, o soco mais forte, e a pressa de ninguém. A Garrafa de Whiskey gira devagar pela arena e derruba quem ficar no caminho.", stats: { hp: 116, speed: .88, power: 1.1 }, shot: { speed: 400, damage: 27 } },
  "elvis-presley": { name: "ELVIS PRESLEY", number: "06", special: "Terremoto do Rebolado", description: "Um rebolado racha o chão e manda uma onda sísmica rasteira. Pule.", color: "#ffd75e", ending: "Elvis deixou o prédio. O prédio ainda tremia.", story: "O Rei do rock, de Memphis, macacão branco e um rebolado que assustou os pais dos anos 50. Resistente e um pouco lento, gosta de encurralar. O Terremoto do Rebolado racha o chão e manda uma onda dourada rasteira que só se evita pulando.", stats: { hp: 104, speed: .96 }, shot: { height: 22, speed: 430, damage: 25 } },
  "sid-vicious": { name: "SID VICIOUS", number: "07", special: "Baixo Voador", description: "Arremessa o baixo girando, o projétil mais rápido do elenco.", color: "#ff6b6b", ending: "Sid não sabia tocar, mas venceu do jeito dele. Sem futuro, com troféu.", story: "Baixista dos Sex Pistols que mal sabia tocar, cadeado no pescoço e o punk de Londres inteiro na atitude. O mais rápido do CBGB, frágil e agressivo. O Baixo Voador é o próprio baixo arremessado girando, o projétil mais veloz do jogo.", stats: { hp: 90, speed: 1.15, power: .95 }, shot: { speed: 620, damage: 20 } },
  "keith-richards": { name: "KEITH RICHARDS", number: "08", special: "Chuva de Cigarros", description: "Cigarros caem alto sobre o adversário. Abaixe-se.", color: "#f3e3b0", ending: "Keith acendeu mais um, sobreviveu a mais uma. A ciência desistiu de explicar.", story: "Guitarrista dos Rolling Stones e, segundo a lenda, imortal. Aguenta mais que parece e nunca sai do lugar sem motivo. A Chuva de Cigarros joga um maço para o alto e os cigarros caem sobre o rival; abaixe-se, ou fume passivamente.", stats: { hp: 108 }, shot: { height: 130, speed: 420, damage: 21 } },
  "robert-smith": { name: "ROBERT SMITH", number: "09", special: "Choro da Morte", description: "Lágrimas azuis luminosas na altura do peito.", color: "#79c6ff", ending: "Robert chorou de alegria pela primeira vez. Borrou o batom, valeu a pena.", story: "Cabelo armado, batom borrado e o The Cure inteiro numa expressão de tristeza. Luta equilibrado e de perto, chorando ou não. O Choro da Morte lança lágrimas azuis luminosas na altura do peito que atravessam a arena.", shot: { damage: 23 } },
  "joey-ramone": { name: "JOEY RAMONE", number: "10", special: "Ondas de Telepatia", description: "Anéis psíquicos magenta avançam na altura da cabeça.", color: "#ff7ae0", ending: "Hey ho, let's go: Joey voltou para o palco e tocou vinte músicas em meia hora.", story: "Dois metros de altura, óculos escuros e jaqueta de couro, o cantor dos Ramones que fez do CBGB a sua casa. Um pouco mais rápido que a média, ataca em sequência de três, como as músicas da banda. As Ondas de Telepatia são anéis psíquicos magenta na altura da cabeça; abaixe-se.", stats: { speed: 1.08, hp: 94 }, shot: { speed: 500, height: 100, damage: 22 } },
  "iggy-pop": { name: "IGGY POP", number: "11", special: "Chamado do Cão", description: "Chama um cão que dispara rasteiro atrás do adversário. Pule.", color: "#d9a066", ending: "Iggy mergulhou na plateia sem camisa, como sempre. O cão o esperou na saída.", story: "O padrinho do punk, dos Stooges, o primeiro a mergulhar na plateia e a subir no palco sem camisa. O mais veloz do elenco, com pouca vida e muita vontade. O Chamado do Cão manda um cão rasteiro disparado atrás do rival, para quem não pular.", stats: { hp: 92, speed: 1.18, power: .95 }, shot: { height: 24, speed: 520, damage: 22 } },
  sergey: { name: "SERGEY", number: "12", special: "Cogumelo Gigante", description: "Um cogumelo roxo enorme avança devagar. O golpe mais forte do elenco.", color: "#b56cff", ending: "Sergey colheu o cogumelo e fez sopa. Os derrotados, por educação, elogiaram.", story: "Chegou ao CBGB sem explicar de onde veio, com o colete, as calças rasgadas e um saco de cogumelos. Peso-pesado: mais vida, soco pesado, passo lento. O Cogumelo Gigante brota roxo e enorme e avança devagar; é o golpe mais forte do jogo, e o mais fácil de ver chegando.", stats: { hp: 112, speed: .9, power: 1.12, height: 1.05 }, shot: { speed: 300, damage: 32, height: 60 } },
  "rogerio-skylab": { name: "ROGÉRIO SKYLAB", number: "CHEFE", special: "Arremesso de Dildo", description: "O chefe do CBGB arremessa um dildo rosa veloz que cruza a arena.", color: "#ff7ad9", ending: "Skylab pegou o microfone e cantou sobre a derrota. Foi a música mais bonita da noite.", story: "O chefe do CBGB. Cantor carioca de letras que ninguém ousa cantar em voz alta, cabelo branco, óculos e humor de quem já viu tudo. Tem a maior vida do jogo, bate forte e reage mais rápido que qualquer adversário do arcade. O Arremesso de Dildo é exatamente o que o nome diz, rosa, veloz e cruzando a arena inteira.", stats: { hp: 120, power: 1.1, speed: .95 }, shot: { speed: 580, damage: 24 } },
};

export const statsOf = (hero: Hero): Stats => ({ ...STATS, ...CHARACTERS[hero].stats });
export const shotOf = (hero: Hero): Shot => ({ ...SHOT, ...CHARACTERS[hero].shot });
/** Fighting style label read off the stats: heavy, fast or balanced. */
export const styleOf = (hero: Hero): string => { const st = statsOf(hero); return st.hp >= 106 || st.power >= 1.08 ? "PESO-PESADO" : st.speed >= 1.08 ? "VELOZ" : "EQUILIBRADO"; };
export const portrait = (hero: Hero, thumb = false) => "/assets/portraits/" + hero + (thumb ? "-thumb" : "") + ".png";

export function isRoster(value: unknown): value is Roster {
  return typeof value === "string" && value in ROSTERS;
}

export function isHero(value: unknown): value is Hero {
  return typeof value === "string" && (HEROES as readonly string[]).includes(value);
}

export function heroesOf(roster: Roster): readonly Hero[] {
  return ROSTERS[roster];
}

export function rosterOf(hero: Hero): Roster {
  return (ROSTERS.rockstar as readonly string[]).includes(hero) ? "rockstar" : "turma";
}

/** The roster boss: last opponent of the arcade ladder, with the strongest AI. */
export function isBoss(hero: Hero): boolean {
  return ROSTER_INFO[rosterOf(hero)].boss === hero;
}

/** First fighter of the same roster that is not `hero`. */
export function defaultOpponent(hero: Hero): Hero {
  return heroesOf(rosterOf(hero)).find(candidate => candidate !== hero)!;
}
