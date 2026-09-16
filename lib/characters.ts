// Fighters are grouped in rosters. A room, a training session or an arcade run uses one roster;
// the page picks it from the URL (?elenco=rockstar) and the API derives it from the host's hero.
export const ROSTERS = {
  turma: ["marica", "hiro", "lobao", "ratao", "bale", "veio", "catlaca"],
  rockstar: ["jim-morrison", "john-lennon", "kurt-cobain", "ozzy-osbourne", "lemmy-kilmister", "elvis-presley", "sid-vicious", "keith-richards", "robert-smith", "joey-ramone"],
} as const;
export type Roster = keyof typeof ROSTERS;
export type Hero = (typeof ROSTERS)[Roster][number];
export const DEFAULT_ROSTER: Roster = "turma";
export const HEROES: readonly Hero[] = [...ROSTERS.turma, ...ROSTERS.rockstar];

export const ROSTER_INFO: Record<Roster, { name: string; caption: string; edition: string }> = {
  turma: { name: "Turma do Feio", caption: "ETE LAURO GOMES", edition: "VOL. 01" },
  rockstar: { name: "Rock Star", caption: "PALCO DO ROCK", edition: "VOL. 02 · ROCK STAR" },
};

export const CHARACTERS: Record<Hero, { name: string; number: string; special: string; description: string; color: string }> = {
  marica: { name: "MARICA", number: "01", special: "Brinde Sísmico", description: "Uma onda dourada. Nenhuma gota derramada.", color: "#edc17a" },
  hiro: { name: "HIRO", number: "02", special: "Galinha das Sombras", description: "Uma galinha preta invocada entre velas e energia violeta.", color: "#c895ff" },
  lobao: { name: "LOBÃO", number: "03", special: "Uivo Felpudo", description: "Um uivo que lança uma onda azul-prateada na forma de um lobo.", color: "#9cdbff" },
  ratao: { name: "RATÃO", number: "04", special: "Bicicleta Voadora", description: "Arremessa uma bicicleta giratória contra o oponente.", color: "#ff9c70" },
  bale: { name: "BALE", number: "05", special: "Turma dos Sete", description: "Convoca sete pequenos guerreiros de conto de fadas para atacar em grupo.", color: "#8ff0a4" },
  veio: { name: "VÉIO", number: "06", special: "Arroto Radioativo", description: "Expele uma nuvem verde radioativa em forma de caveira.", color: "#83f26b" },
  catlaca: { name: "CATLACA", number: "07", special: "Ataque de Morcegos", description: "Invoca um enxame de morcegos que avança contra o rival.", color: "#d09cff" },
  "jim-morrison": { name: "JIM MORRISON", number: "01", special: "Ataque dos Lagartos", description: "Invoca um lagarto verde que corre e salta no adversário.", color: "#8ee36a" },
  "john-lennon": { name: "JOHN LENNON", number: "02", special: "Chuva de Pétalas", description: "Pétalas de rosa caem sobre o adversário.", color: "#ff9fb8" },
  "kurt-cobain": { name: "KURT COBAIN", number: "03", special: "Onda Sonora do Riff", description: "Um riff produz uma onda sonora serrilhada que avança pela arena.", color: "#7fd4ff" },
  "ozzy-osbourne": { name: "OZZY OSBOURNE", number: "04", special: "Morcego Sem Cabeça", description: "Arremessa um morcego sem cabeça no adversário.", color: "#c27dff" },
  "lemmy-kilmister": { name: "LEMMY KILMISTER", number: "05", special: "Garrafa de Whiskey", description: "Arremessa uma garrafa de whiskey que gira até o adversário.", color: "#e0a45c" },
  "elvis-presley": { name: "ELVIS PRESLEY", number: "06", special: "Terremoto do Rebolado", description: "Um rebolado racha o chão e manda uma onda sísmica dourada.", color: "#ffd75e" },
  "sid-vicious": { name: "SID VICIOUS", number: "07", special: "Baixo Voador", description: "Arremessa o baixo girando na cabeça do adversário.", color: "#ff6b6b" },
  "keith-richards": { name: "KEITH RICHARDS", number: "08", special: "Chuva de Cigarros", description: "Arremessa um maço; cigarros caem sobre o adversário.", color: "#f3e3b0" },
  "robert-smith": { name: "ROBERT SMITH", number: "09", special: "Choro da Morte", description: "Lágrimas azuis luminosas atingem o adversário.", color: "#79c6ff" },
  "joey-ramone": { name: "JOEY RAMONE", number: "10", special: "Ondas de Telepatia", description: "Anéis psíquicos magenta avançam até o adversário.", color: "#ff7ae0" },
};

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

/** First fighter of the same roster that is not `hero`. */
export function defaultOpponent(hero: Hero): Hero {
  return heroesOf(rosterOf(hero)).find(candidate => candidate !== hero)!;
}
