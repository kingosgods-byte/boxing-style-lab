import type { Landmark } from "../tracking/TrackerTypes";

export function distance(a: Landmark, b: Landmark) { return Math.hypot(a.x - b.x, a.y - b.y); }
export function angle(a: Landmark, b: Landmark, c: Landmark) {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const mag = Math.hypot(ab.x, ab.y) * Math.hypot(cb.x, cb.y) || 1;
  return Math.acos(Math.max(-1, Math.min(1, dot / mag))) * 180 / Math.PI;
}

export interface BiomechanicsSnapshot {
  posture: number;
  balance: number;
  rotation: number;
  extension: number;
  kineticChain: number;
}

export function analyzeBiomechanics(points: Landmark[]): BiomechanicsSnapshot {
  if (points.length < 17) return { posture: 0, balance: 0, rotation: 0, extension: 0, kineticChain: 0 };
  const leftShoulder = points[11], rightShoulder = points[12], leftHip = points[23], rightHip = points[24];
  const shoulderWidth = distance(leftShoulder, rightShoulder) || 1;
  const hipWidth = distance(leftHip, rightHip) || 1;
  const posture = Math.max(0, Math.min(100, 100 - Math.abs(shoulderWidth - hipWidth) * 80));
  const balance = Math.max(0, Math.min(100, 100 - Math.abs(((leftHip.x + rightHip.x) / 2) - 0.5) * 100));
  const rotation = Math.max(0, Math.min(100, Math.abs(leftShoulder.y - rightShoulder.y) * 500));
  const extension = points[15] && points[11] ? Math.max(0, Math.min(100, distance(points[15], points[11]) * 100)) : 0;
  const kineticChain = Math.round((posture + balance + rotation + extension) / 4);
  return { posture: Math.round(posture), balance: Math.round(balance), rotation: Math.round(rotation), extension: Math.round(extension), kineticChain };
}
