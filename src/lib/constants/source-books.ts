export const SOURCE_BOOKS = [
  "Boboc - Aparatul dento-maxilar",
  "Zarnea - Pedodonție",
  "Luca - Protetică dentară",
  "Topoliceanu - Odontoterapie restauratoare",
  "Fontana - Endodonție",
  "Grivu - Chirurgie orală",
  "Zetu - Parodontologie",
  "Forna - Reabilitare orală",
  "Căruntu - Ortodonție",
  "Platforma online",
  "Altele",
] as const

export type SourceBook = (typeof SOURCE_BOOKS)[number]
