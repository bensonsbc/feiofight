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

// `arena` is the background the renderer loads for the roster; `boss` is the roster's final arcade
// opponent (always last in the roster order) and fights with the strongest AI level.
export const ROSTER_INFO: Record<Roster, { name: string; caption: string; edition: string; arena: string; champion: string; boss?: Hero }> = {
  turma: { name: "Turma do Feio", caption: "ETE LAURO GOMES", edition: "VOL. 01", arena: "/assets/arena.png", champion: "CAMPEÃO DA TURMA!" },
  rockstar: { name: "Rock Star", caption: "CBGB", edition: "VOL. 02 · ROCK STAR", arena: "/assets/rockstar/arena.png", champion: "REI DO ROCK!", boss: "rogerio-skylab" },
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

export type Character = { name: string; number: string; special: string; description: string; color: string; ending: string; stats?: Partial<Stats>; shot?: Partial<Shot> };
export const CHARACTERS: Record<Hero, Character> = {
  marica: { name: "MARICA", number: "01", special: "Brinde Sísmico", description: "Uma onda dourada rasteira. Pule ou tome no pé.", color: "#edc17a", ending: "Marica ergueu o copo para a turma inteira. Nenhuma gota derramada, nenhum rival de pé.", shot: { height: 26, speed: 430 } },
  hiro: { name: "HIRO", number: "02", special: "Galinha das Sombras", description: "Uma galinha preta invocada entre velas e energia violeta.", color: "#c895ff", ending: "Hiro apagou as velas. A galinha das sombras voltou para o quintal, satisfeita.", stats: { speed: 1.05 } },
  lobao: { name: "LOBÃO", number: "03", special: "Uivo Felpudo", description: "Um uivo rápido em forma de lobo azul-prateado.", color: "#9cdbff", ending: "Lobão uivou para a lua da ETE. A turma inteira uivou junto, sem saber por quê.", stats: { hp: 110, speed: .92, power: 1.08 }, shot: { speed: 540, damage: 21 } },
  ratao: { name: "RATÃO", number: "04", special: "Bicicleta Voadora", description: "Arremessa uma bicicleta giratória, rápida mas leve.", color: "#ff9c70", ending: "Ratão pedalou para casa com o troféu no guidão. A bicicleta, milagrosamente, inteira.", stats: { hp: 92, speed: 1.15, power: .95 }, shot: { speed: 620, damage: 19 } },
  bale: { name: "BALE", number: "05", special: "Turma dos Sete", description: "Convoca sete pequenos guerreiros, lentos e pesados.", color: "#8ff0a4", ending: "Os sete guerreiros voltaram para o bolso do Bale. Ele é pequeno, mas a turma é grande.", stats: { hp: 90, speed: 1.1, power: .9, height: .78 }, shot: { speed: 330, damage: 28 } },
  veio: { name: "VÉIO", number: "06", special: "Arroto Radioativo", description: "Uma nuvem verde alta e pesada em forma de caveira. Abaixe-se.", color: "#83f26b", ending: "Véio arrotou uma última vez e sentou no banco da praça. Ninguém sentou perto.", stats: { hp: 106, speed: .9, power: 1.05 }, shot: { speed: 360, height: 110, damage: 26 } },
  catlaca: { name: "CATLACA", number: "07", special: "Ataque de Morcegos", description: "Um enxame alto e rápido de morcegos. Abaixe-se.", color: "#d09cff", ending: "Catlaca pendurou-se de cabeça para baixo na goleira. Os morcegos fizeram o mesmo.", stats: { speed: 1.05, hp: 96 }, shot: { speed: 540, height: 120, damage: 20 } },
  "jim-morrison": { name: "JIM MORRISON", number: "01", special: "Ataque dos Lagartos", description: "Um lagarto verde corre rasteiro pela arena. Pule.", color: "#8ee36a", ending: "O Rei Lagarto atravessou a porta. Do outro lado, só o deserto e uma canção sem fim.", shot: { height: 22, speed: 480, damage: 22 } },
  "john-lennon": { name: "JOHN LENNON", number: "02", special: "Chuva de Pétalas", description: "Pétalas caem alto e devagar. Abaixe-se.", color: "#ff9fb8", ending: "Lennon deitou na cama e declarou a paz. O CBGB, por uma noite, obedeceu.", shot: { height: 135, speed: 380, damage: 22 } },
  "kurt-cobain": { name: "KURT COBAIN", number: "03", special: "Onda Sonora do Riff", description: "Um riff produz uma onda serrilhada veloz na altura do peito.", color: "#7fd4ff", ending: "Kurt quebrou a guitarra no palco. Ninguém reclamou: era a melhor parte do show.", stats: { hp: 96 }, shot: { speed: 560, damage: 22 } },
  "ozzy-osbourne": { name: "OZZY OSBOURNE", number: "04", special: "Morcego Sem Cabeça", description: "Arremessa um morcego sem cabeça, alto e rápido.", color: "#c27dff", ending: "Ozzy mordeu o troféu. Era de chocolate. Ainda assim, ninguém quis o resto.", shot: { speed: 560, height: 110, damage: 21 } },
  "lemmy-kilmister": { name: "LEMMY KILMISTER", number: "05", special: "Garrafa de Whiskey", description: "Uma garrafa pesada gira devagar até o adversário.", color: "#e0a45c", ending: "Lemmy pediu outra dose e ligou o amplificador no onze. O bairro inteiro ouviu.", stats: { hp: 116, speed: .88, power: 1.1 }, shot: { speed: 400, damage: 27 } },
  "elvis-presley": { name: "ELVIS PRESLEY", number: "06", special: "Terremoto do Rebolado", description: "Um rebolado racha o chão e manda uma onda sísmica rasteira. Pule.", color: "#ffd75e", ending: "Elvis deixou o prédio. O prédio ainda tremia.", stats: { hp: 104, speed: .96 }, shot: { height: 22, speed: 430, damage: 25 } },
  "sid-vicious": { name: "SID VICIOUS", number: "07", special: "Baixo Voador", description: "Arremessa o baixo girando, o projétil mais rápido do elenco.", color: "#ff6b6b", ending: "Sid não sabia tocar, mas venceu do jeito dele. Sem futuro, com troféu.", stats: { hp: 90, speed: 1.15, power: .95 }, shot: { speed: 620, damage: 20 } },
  "keith-richards": { name: "KEITH RICHARDS", number: "08", special: "Chuva de Cigarros", description: "Cigarros caem alto sobre o adversário. Abaixe-se.", color: "#f3e3b0", ending: "Keith acendeu mais um, sobreviveu a mais uma. A ciência desistiu de explicar.", stats: { hp: 108 }, shot: { height: 130, speed: 420, damage: 21 } },
  "robert-smith": { name: "ROBERT SMITH", number: "09", special: "Choro da Morte", description: "Lágrimas azuis luminosas na altura do peito.", color: "#79c6ff", ending: "Robert chorou de alegria pela primeira vez. Borrou o batom, valeu a pena.", shot: { damage: 23 } },
  "joey-ramone": { name: "JOEY RAMONE", number: "10", special: "Ondas de Telepatia", description: "Anéis psíquicos magenta avançam na altura da cabeça.", color: "#ff7ae0", ending: "Hey ho, let's go: Joey voltou para o palco e tocou vinte músicas em meia hora.", stats: { speed: 1.08, hp: 94 }, shot: { speed: 500, height: 100, damage: 22 } },
  "iggy-pop": { name: "IGGY POP", number: "11", special: "Chamado do Cão", description: "Chama um cão que dispara rasteiro atrás do adversário. Pule.", color: "#d9a066", ending: "Iggy mergulhou na plateia sem camisa, como sempre. O cão o esperou na saída.", stats: { hp: 92, speed: 1.18, power: .95 }, shot: { height: 24, speed: 520, damage: 22 } },
  sergey: { name: "SERGEY", number: "12", special: "Cogumelo Gigante", description: "Um cogumelo roxo enorme avança devagar. O golpe mais forte do elenco.", color: "#b56cff", ending: "Sergey colheu o cogumelo e fez sopa. Os derrotados, por educação, elogiaram.", stats: { hp: 112, speed: .9, power: 1.12, height: 1.05 }, shot: { speed: 300, damage: 32, height: 60 } },
  "rogerio-skylab": { name: "ROGÉRIO SKYLAB", number: "CHEFE", special: "Arremesso de Dildo", description: "O chefe do CBGB arremessa um dildo rosa veloz que cruza a arena.", color: "#ff7ad9", ending: "Skylab pegou o microfone e cantou sobre a derrota. Foi a música mais bonita da noite.", stats: { hp: 120, power: 1.1, speed: .95 }, shot: { speed: 580, damage: 24 } },
};

export const statsOf = (hero: Hero): Stats => ({ ...STATS, ...CHARACTERS[hero].stats });
export const shotOf = (hero: Hero): Shot => ({ ...SHOT, ...CHARACTERS[hero].shot });
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
