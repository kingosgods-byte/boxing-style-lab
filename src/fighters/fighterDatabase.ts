export interface FighterProfile {
  name: string;
  stance: "orthodox" | "southpaw";
  style: string;
  notes: string[];
}

export class FighterDatabase {
  private static fighters: FighterProfile[] = [
    {
      name: "Dmitry Bivol",
      stance: "orthodox",
      style: "Technical boxer",
      notes: [
        "Structured footwork",
        "Efficient combinations",
        "Distance control",
        "High defensive discipline",
      ],
    },
    {
      name: "Canelo Alvarez",
      stance: "orthodox",
      style: "Counter-puncher",
      notes: [
        "Compact guard",
        "Body punching",
        "Head movement",
        "Counter timing",
      ],
    },
    {
      name: "Vasiliy Lomachenko",
      stance: "southpaw",
      style: "Angle-based technician",
      notes: [
        "Lateral movement",
        "Angle creation",
        "Combination transitions",
        "Position changes",
      ],
    },
    {
      name: "Naoya Inoue",
      stance: "orthodox",
      style: "Explosive combination boxer",
      notes: [
        "Fast entries",
        "Combination punching",
        "Distance changes",
        "Power generation",
      ],
    },
    {
      name: "Oleksandr Usyk",
      stance: "southpaw",
      style: "Mobile pressure boxer",
      notes: [
        "Constant footwork",
        "Angle changes",
        "Volume punching",
        "Distance manipulation",
      ],
    },
    {
      name: "Floyd Mayweather Jr.",
      stance: "orthodox",
      style: "Defensive counter-puncher",
      notes: [
        "Defensive positioning",
        "Counter punching",
        "Distance control",
        "Timing",
      ],
    },
  ];

  static getFeaturedFighters(): FighterProfile[] {
    return this.fighters;
  }

  static getByName(
    name: string
  ): FighterProfile | undefined {
    return this.fighters.find(
      (fighter) =>
        fighter.name.toLowerCase() ===
        name.toLowerCase()
    );
  }
}
