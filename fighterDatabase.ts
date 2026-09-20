export interface FighterProfile { name: string; stance: "orthodox" | "southpaw"; traits: string[]; provenance: "style-reference" | "public-stats" | "video-derived"; }

export const fighters: FighterProfile[] = [
  { name: "Dmitry Bivol", stance: "orthodox", traits: ["distance control", "straight punching", "high-volume combinations"], provenance: "style-reference" },
  { name: "Canelo Alvarez", stance: "orthodox", traits: ["body work", "head movement", "counterpunching"], provenance: "style-reference" },
  { name: "Gennady Golovkin", stance: "orthodox", traits: ["pressure", "jab", "ring cutting"], provenance: "style-reference" },
  { name: "Terence Crawford", stance: "switch", traits: ["switching", "counterpunching", "adjustment"], provenance: "style-reference" } as FighterProfile,
  { name: "Oleksandr Usyk", stance: "southpaw", traits: ["angles", "footwork", "volume"], provenance: "style-reference" },
  { name: "Naoya Inoue", stance: "orthodox", traits: ["timing", "distance", "combination punching"], provenance: "style-reference" },
  { name: "Artur Beterbiev", stance: "orthodox", traits: ["pressure", "physicality", "combination pressure"], provenance: "style-reference" },
  { name: "Vasiliy Lomachenko", stance: "southpaw", traits: ["angles", "lateral movement", "combination entries"], provenance: "style-reference" },
  { name: "Floyd Mayweather Jr.", stance: "orthodox", traits: ["defense", "distance control", "counterpunching"], provenance: "style-reference" },
  { name: "Manny Pacquiao", stance: "southpaw", traits: ["entry speed", "angles", "volume"], provenance: "style-reference" },
];
