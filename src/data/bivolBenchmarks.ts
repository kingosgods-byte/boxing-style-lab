export interface PoseVector {
  elbowFlexionAngle: number;    // Elbow apex at jab extension (~168°)
  guardHeightRatio: number;     // Off-hand wrist-to-chin vertical distance
  shoulderDipAngle: number;     // Lead shoulder tilt during entry
  weightDistribution: number;  // Center-of-mass shift between feet (0.5 = balanced)
  recoilSpeedMs: number;       // Time from apex back to guard frame
}

export const BIVOL_BENCHMARKS: Record<string, PoseVector> = {
  LEAD_JAB_APEX: {
    elbowFlexionAngle: 168.5,
    guardHeightRatio: 0.08,    // Extremely tight off-hand guard
    shoulderDipAngle: 12.0,     // Slight dip to protect chin
    weightDistribution: 0.52,  // Neutral 52/48 balance on pendulum footwork
    recoilSpeedMs: 140          // Ultra-fast snap back
  },
  CROSS_DRIVE: {
    elbowFlexionAngle: 172.0,
    guardHeightRatio: 0.05,
    shoulderDipAngle: 24.0,     // Heavy rear shoulder rotation
    weightDistribution: 0.65,  // Front leg weight shift
    recoilSpeedMs: 180
  }
};
