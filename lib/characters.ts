export const HEROES = ["marica", "hiro", "lobao"] as const;
export type Hero = (typeof HEROES)[number];

export const CHARACTERS: Record<Hero, { name: string; number: string; special: string; description: string; color: string }> = {
  marica: { name: "MARICA", number: "01", special: "Brinde Sísmico", description: "Uma onda dourada. Nenhuma gota derramada.", color: "#edc17a" },
  hiro: { name: "HIRO", number: "02", special: "Galinha das Sombras", description: "Uma galinha preta invocada entre velas e energia violeta.", color: "#c895ff" },
  lobao: { name: "LOBÃO", number: "03", special: "Uivo Felpudo", description: "Um uivo que lança uma onda azul-prateada na forma de um lobo.", color: "#9cdbff" },
};

export function isHero(value: unknown): value is Hero {
  return typeof value === "string" && HEROES.includes(value as Hero);
}

export function defaultOpponent(hero: Hero): Hero {
  return HEROES.find(candidate => candidate !== hero)!;
}
