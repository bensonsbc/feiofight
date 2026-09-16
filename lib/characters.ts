export const HEROES = ["marica", "hiro", "lobao", "ratao", "bale", "veio", "catlaca"] as const;
export type Hero = (typeof HEROES)[number];

export const CHARACTERS: Record<Hero, { name: string; number: string; special: string; description: string; color: string }> = {
  marica: { name: "MARICA", number: "01", special: "Brinde Sísmico", description: "Uma onda dourada. Nenhuma gota derramada.", color: "#edc17a" },
  hiro: { name: "HIRO", number: "02", special: "Galinha das Sombras", description: "Uma galinha preta invocada entre velas e energia violeta.", color: "#c895ff" },
  lobao: { name: "LOBÃO", number: "03", special: "Uivo Felpudo", description: "Um uivo que lança uma onda azul-prateada na forma de um lobo.", color: "#9cdbff" },
  ratao: { name: "RATÃO", number: "04", special: "Bicicleta Voadora", description: "Arremessa uma bicicleta giratória contra o oponente.", color: "#ff9c70" },
  bale: { name: "BALE", number: "05", special: "Turma dos Sete", description: "Convoca sete pequenos guerreiros de conto de fadas para atacar em grupo.", color: "#8ff0a4" },
  veio: { name: "VÉIO", number: "06", special: "Arroto Radioativo", description: "Expele uma nuvem verde radioativa em forma de caveira.", color: "#83f26b" },
  catlaca: { name: "CATLACA", number: "07", special: "Ataque de Morcegos", description: "Invoca um enxame de morcegos que avança contra o rival.", color: "#d09cff" },
};

export function isHero(value: unknown): value is Hero {
  return typeof value === "string" && HEROES.includes(value as Hero);
}

export function defaultOpponent(hero: Hero): Hero {
  return HEROES.find(candidate => candidate !== hero)!;
}
