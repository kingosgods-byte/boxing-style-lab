import type { FusionResult, Landmark, TrackerResult } from "./TrackerTypes";

export function fuseTrackers(results: TrackerResult[]): FusionResult {
  const usable = results.filter(r => r.detected && r.landmarks.length);
  if (!usable.length) return { timestamp: performance.now(), landmarks: null, confidence: 0, contributingTrackers: [], agreement: 0, health: "lost" };

  const maxLength = Math.max(...usable.map(r => r.landmarks.length));
  const fused: Landmark[] = [];
  for (let i = 0; i < maxLength; i++) {
    const points = usable.map(r => r.landmarks[i]).filter(Boolean);
    if (!points.length) continue;
    const weightSum = points.reduce((s, p) => s + Math.max(0.05, p.visibility ?? p.score ?? 1), 0);
    fused.push({
      x: points.reduce((s, p) => s + p.x * Math.max(0.05, p.visibility ?? p.score ?? 1), 0) / weightSum,
      y: points.reduce((s, p) => s + p.y * Math.max(0.05, p.visibility ?? p.score ?? 1), 0) / weightSum,
      z: points.some(p => p.z !== undefined) ? points.reduce((s, p) => s + (p.z ?? 0), 0) / points.length : undefined,
      visibility: points.reduce((s, p) => s + (p.visibility ?? p.score ?? 1), 0) / points.length,
    });
  }
  let agreement = 1;
  if (usable.length > 1) {
    const pairs: number[] = [];
    for (let i = 0; i < maxLength; i++) {
      const pts = usable.map(r => r.landmarks[i]).filter(Boolean);
      if (pts.length < 2) continue;
      for (let a = 1; a < pts.length; a++) pairs.push(Math.hypot(pts[a].x - pts[0].x, pts[a].y - pts[0].y));
    }
    const avg = pairs.length ? pairs.reduce((a, b) => a + b, 0) / pairs.length : 0;
    agreement = Math.max(0, Math.min(1, 1 - avg * 5));
  }
  const confidence = usable.reduce((s, r) => s + r.confidence, 0) / usable.length;
  const score = confidence * 0.7 + agreement * 0.3;
  return {
    timestamp: Math.max(...usable.map(r => r.timestamp)),
    landmarks: fused,
    confidence: score,
    contributingTrackers: usable.map(r => r.tracker),
    agreement,
    health: score > 0.85 ? "excellent" : score > 0.65 ? "good" : score > 0.35 ? "degraded" : "lost",
  };
}
