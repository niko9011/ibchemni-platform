export const chapterProducts = [
  ["matter-and-atomic-structure", 1, "Matter and Atomic Structure", 999],
  ["mole-and-stoichiometry", 2, "Mole and Stoichiometry", 999],
  ["chemical-bonding", 3, "Chemical Bonding", 1499],
  ["periodic-trends", 4, "Periodic Trends", 999],
  ["organic-structure", 5, "Organic Structure", 999],
  ["thermochemistry", 6, "Thermochemistry", 999],
  ["kinetics", 7, "Kinetics", 1499],
  ["chemical-equilibrium", 8, "Chemical Equilibrium", 999],
  ["acid-and-base", 9, "Acid and Base", 999],
  ["redox", 10, "Redox", 999],
  ["organic-reactions", 11, "Organic Reactions", 999]
] as const;

export const sectionTitles = ["Concept Foundation", "Worked Examples", "IB Exam Practice", "Common Mistakes"] as const;

export function productId(level: "SL" | "HL", slug: string) {
  return `${level.toLowerCase()}-${slug}`;
}
