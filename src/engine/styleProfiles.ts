export interface StyleProfile {
  id: string;
  name: string;
  nickname: string;
  description: string;
  minExtensionAngle: number;
  guardThresholdY: number;
  preferredStance: 'orthodox' | 'southpaw';
}

export const FIGHTER_STYLES: Record<string, StyleProfile> = {
  bivol: {
    id: 'bivol',
    name: 'Dmitry Bivol',
    nickname: 'In-And-Out Master',
    description: 'High-volume lead-hand control, rapid distance management, and full arm extension on straight punches.',
    minExtensionAngle: 165,
    guardThresholdY: 0.18,
    preferredStance: 'orthodox'
  },
  ggg: {
    id: 'ggg',
    name: 'Gennady Golovkin',
    nickname: 'Mexican Style',
    description: 'Relentless forward pressure, dense high-guard defensive cover, and heavy leverage transfer.',
    minExtensionAngle: 160,
    guardThresholdY: 0.12,
    preferredStance: 'orthodox'
  },
  loma: {
    id: 'loma',
    name: 'Vasiliy Lomachenko',
    nickname: 'The Matrix',
    description: 'Dynamic angle creation, fluid footwork shifts, and rapid multi-angle combinations.',
    minExtensionAngle: 155,
    guardThresholdY: 0.22,
    preferredStance: 'southpaw'
  }
};
