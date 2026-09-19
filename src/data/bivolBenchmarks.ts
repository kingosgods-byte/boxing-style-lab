export interface PoseVector {
  elbowFlexionAngle: number;
  guardHeightRatio: number;
  shoulderDipAngle: number;
  weightDistribution: number;
  recoilSpeedMs: number;
}

export const BIVOL_BENCHMARKS: Record<string, PoseVector> = {
  LEAD_JAB_APEX: {
    elbowFlexionAngle: 168.5,
    guardHeightRatio: 0.08,
    shoulderDipAngle: 12.0,
    weightDistribution: 0.52,
    recoilSpeedMs: 140
  },
  CROSS_DRIVE: {
    elbowFlexionAngle: 172.0,
    guardHeightRatio: 0.05,
    shoulderDipAngle: 24.0,
    weightDistribution: 0.65,
    recoilSpeedMs: 180
  }
};
