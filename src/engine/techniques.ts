export type TechniqueCategory =
  | "punch"
  | "defense"
  | "footwork"
  | "movement"
  | "combination";

export interface TechniqueDefinition {
  id: string;

  name: string;

  category: TechniqueCategory;

  description: string;

  requiredFeatures: string[];

  coachingCues: string[];

  commonErrors: string[];
}

const techniques: TechniqueDefinition[] = [
  {
    id: "jab",

    name: "Jab",

    category: "punch",

    description:
      "A straight lead-hand punch used to establish range, disrupt rhythm, or set up combinations.",

    requiredFeatures: [
      "left_wrist_x",
      "left_wrist_y",
      "left_elbow_angle",
      "left_shoulder_angle",
    ],

    coachingCues: [
      "Keep the lead hand connected to the guard.",
      "Extend the punch directly toward the target.",
      "Recover the hand quickly after extension.",
    ],

    commonErrors: [
      "Dropping the opposite hand.",
      "Overextending the shoulder.",
      "Lifting the elbow excessively.",
    ],
  },

  {
    id: "cross",

    name: "Cross",

    category: "punch",

    description:
      "A straight rear-hand punch that uses coordinated rotation through the lower and upper body.",

    requiredFeatures: [
      "right_wrist_x",
      "right_wrist_y",
      "right_elbow_angle",
      "right_shoulder_angle",
      "right_hip_angle",
    ],

    coachingCues: [
      "Drive the punch from the rear side of the body.",
      "Coordinate hip and shoulder rotation.",
      "Return the hand to the guard after extension.",
    ],

    commonErrors: [
      "Arm-only punching.",
      "Excessive torso rotation.",
      "Leaving the rear hand extended.",
    ],
  },

  {
    id: "lead_hook",

    name: "Lead Hook",

    category: "punch",

    description:
      "A lead-side rotational punch delivered with a bent arm.",

    requiredFeatures: [
      "left_wrist_x",
      "left_wrist_y",
      "left_elbow_angle",
      "left_shoulder_angle",
      "left_hip_angle",
    ],

    coachingCues: [
      "Rotate the body with the punch.",
      "Maintain appropriate elbow position.",
      "Keep the movement compact.",
    ],

    commonErrors: [
      "Swinging the arm without body rotation.",
      "Overextending the punch.",
      "Dropping the opposite hand.",
    ],
  },

  {
    id: "rear_hook",

    name: "Rear Hook",

    category: "punch",

    description:
      "A rear-side rotational punch delivered with a bent arm.",

    requiredFeatures: [
      "right_wrist_x",
      "right_wrist_y",
      "right_elbow_angle",
      "right_shoulder_angle",
      "right_hip_angle",
    ],

    coachingCues: [
      "Coordinate rear-side rotation.",
      "Keep the punch compact.",
      "Recover the hand efficiently.",
    ],

    commonErrors: [
      "Arm-only movement.",
      "Excessive rotation.",
      "Poor balance during recovery.",
    ],
  },

  {
    id: "slip",

    name: "Slip",

    category: "defense",

    description:
      "A defensive head movement that moves the upper body off the center line.",

    requiredFeatures: [
      "shoulder_center_x",
      "shoulder_center_y",
      "hip_center_x",
      "hip_center_y",
      "torso_length",
    ],

    coachingCues: [
      "Move the head off the center line.",
      "Keep the movement controlled.",
      "Maintain balance and punching readiness.",
    ],

    commonErrors: [
      "Bending excessively at the waist.",
      "Moving too far outside position.",
      "Losing the ability to counter.",
    ],
  },

  {
    id: "roll",

    name: "Roll",

    category: "defense",

    description:
      "A defensive movement that changes level and moves underneath a punch.",

    requiredFeatures: [
      "left_knee_angle",
      "right_knee_angle",
      "shoulder_center_y",
      "hip_center_y",
      "torso_length",
    ],

    coachingCues: [
      "Change level through the legs.",
      "Keep the movement controlled.",
      "Stay balanced while exiting the line of attack.",
    ],

    commonErrors: [
      "Squatting excessively.",
      "Folding at the waist.",
      "Standing upright before completing the movement.",
    ],
  },

  {
    id: "step_forward",

    name: "Step Forward",

    category: "footwork",

    description:
      "A controlled movement that advances the fighter while maintaining stance structure.",

    requiredFeatures: [
      "left_ankle_x",
      "right_ankle_x",
      "left_hip_angle",
      "right_hip_angle",
    ],

    coachingCues: [
      "Maintain stance structure.",
      "Move the feet under control.",
      "Keep the body balanced during the step.",
    ],

    commonErrors: [
      "Crossing the feet.",
      "Becoming too square.",
      "Overstepping.",
    ],
  },

  {
    id: "step_back",

    name: "Step Back",

    category: "footwork",

    description:
      "A controlled retreat that preserves balance and punching readiness.",

    requiredFeatures: [
      "left_ankle_x",
      "right_ankle_x",
      "left_hip_angle",
      "right_hip_angle",
    ],

    coachingCues: [
      "Maintain stance width.",
      "Keep the movement controlled.",
      "Stay ready to counter.",
    ],

    commonErrors: [
      "Crossing the feet.",
      "Leaning excessively backward.",
      "Moving too far in one step.",
    ],
  },

  {
    id: "pivot",

    name: "Pivot",

    category: "footwork",

    description:
      "A rotational footwork movement used to change angle while maintaining balance.",

    requiredFeatures: [
      "left_ankle_x",
      "right_ankle_x",
      "left_hip_angle",
      "right_hip_angle",
      "shoulder_center_x",
    ],

    coachingCues: [
      "Rotate around a controlled base.",
      "Maintain balance throughout the turn.",
      "Keep the hands ready during the movement.",
    ],

    commonErrors: [
      "Spinning excessively.",
      "Losing stance structure.",
      "Rotating only through the upper body.",
    ],
  },
];

export function getAllTechniques():
  TechniqueDefinition[] {
  return techniques.map(
    (technique) => ({
      ...technique,

      requiredFeatures: [
        ...technique.requiredFeatures,
      ],

      coachingCues: [
        ...technique.coachingCues,
      ],

      commonErrors: [
        ...technique.commonErrors,
      ],
    })
  );
}

export function getTechnique(
  id: string
): TechniqueDefinition | null {
  const technique =
    techniques.find(
      (item) =>
        item.id === id
    );

  if (!technique) {
    return null;
  }

  return {
    ...technique,

    requiredFeatures: [
      ...technique.requiredFeatures,
    ],

    coachingCues: [
      ...technique.coachingCues,
    ],

    commonErrors: [
      ...technique.commonErrors,
    ],
  };
}

export function getTechniquesByCategory(
  category: TechniqueCategory
): TechniqueDefinition[] {
  return getAllTechniques().filter(
    (technique) =>
      technique.category ===
      category
  );
}
