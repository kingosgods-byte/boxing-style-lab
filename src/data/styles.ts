import { StyleProfile } from "../types";

export const STYLES: Record<string,StyleProfile> = {
  bivol:{
    name:"Bivol-inspired",
    description:"A technical reference profile emphasizing balance, distance, straight punching, compact recovery and economical movement.",
    priorities:["Position before speed","Straight-punch efficiency","Fast recovery","Stable base","Lateral exits"],
    cues:[
      "Keep your head stacked over your base instead of reaching for the target.",
      "Recover the hands and feet together after the combination.",
      "Use small steps to maintain punching range rather than over-stepping.",
      "Let the combination finish with you balanced and ready to fire again."
    ]
  },
  ggg:{
    name:"GGG-inspired",
    description:"A pressure-oriented reference profile emphasizing jab control, distance compression, balance and forward positioning.",
    priorities:["Jab control","Pressure","Cutting distance","Compact mechanics","Positioning"],
    cues:[
      "Step into range without letting the feet cross.",
      "Use the jab to manage the opponent's position.",
      "Keep the base underneath the hips while applying pressure.",
      "Finish combinations in a position that can immediately support another attack."
    ]
  },
  soviet:{
    name:"Soviet fundamentals",
    description:"A broad technical framework based on balance, footwork, straight punches, positioning and efficient movement.",
    priorities:["Balance","Footwork","Straight punches","Timing","Recovery"],
    cues:[
      "Build every punch from a stable stance.",
      "Move the feet efficiently and avoid unnecessary travel.",
      "Recover to a usable stance after every action.",
      "Separate speed from rushing: clean mechanics come first."
    ]
  },
  neutral:{
    name:"Technical fundamentals",
    description:"Neutral biomechanics coaching without matching a particular boxer.",
    priorities:["Alignment","Balance","Efficiency","Speed","Recovery"],
    cues:[
      "Stay centered through the movement.",
      "Avoid reaching beyond your base.",
      "Return to your guard after every punch.",
      "Increase speed only after the movement stays repeatable."
    ]
  }
};
