export interface StyleProfile {
  id: string;
  name: string;
  idealStanceWidthRatio: [number, number]; // min, max relative to shoulders
  maxTorsoLeanAngle: number; // degrees
  allowHeadSlipBait: boolean; // True for counter-punchers like Canelo
  requiredGuard: 'high' | 'classic_soviet';
}

export const STYLE_PROFILES: Record<string, StyleProfile> = {
  SOVIET_CLASSIC: {
    id: 'SOVIET_CLASSIC',
    name: 'Soviet Strict (Bivol / Lomachenko)',
    idealStanceWidthRatio: [1.3, 1.6],
    maxTorsoLeanAngle: 10,
    allowHeadSlipBait: false,
    requiredGuard: 'classic_soviet',
  },
  MEXICAN_PRESSURE: {
    id: 'MEXICAN_PRESSURE',
    name: 'Mexican Counter-Pressure (Canelo Álvarez)',
    idealStanceWidthRatio: [1.1, 1.4],
    maxTorsoLeanAngle: 24, // Allows defensive pulls and slips
    allowHeadSlipBait: true,
    requiredGuard: 'high',
  },
};

// Alias to fix the import error across aiCoachEngine.ts and App.tsx
export const FIGHTER_STYLES = STYLE_PROFILES;
