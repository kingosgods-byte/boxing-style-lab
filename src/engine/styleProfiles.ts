export interface StyleProfile {
  name: string;
  idealStanceWidthRatio: [number, number]; // min, max relative to shoulder width
  maxTorsoLeanAngle: number; // degrees
  requiredGuardHeight: 'high' | 'philly_shell' | 'classic_soviet';
  allowHeadSlipBait: boolean; // True for Canelo style (leaning back to make opponents reach)
  targetElbowAnglePunch: number;
}

export const STYLE_PROFILES: Record<string, StyleProfile> = {
  SOVIET_CLASSIC: {
    name: 'Soviet Strict (Bivol/Loma)',
    idealStanceWidthRatio: [1.3, 1.6],
    maxTorsoLeanAngle: 10,
    requiredGuardHeight: 'classic_soviet',
    allowHeadSlipBait: false,
    targetElbowAnglePunch: 165,
  },
  MEXICAN_PRESSURE: {
    name: 'Mexican Counter-Pressure (Canelo)',
    idealStanceWidthRatio: [1.1, 1.4],
    maxTorsoLeanAngle: 25, // Allows pulling back or slipping outside of range
    requiredGuardHeight: 'high',
    allowHeadSlipBait: true, // Rewards baiting a reach
    targetElbowAnglePunch: 170,
  }
};
