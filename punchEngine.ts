import type { Landmark } from "../tracking/TrackerTypes";

export type PunchType = "jab" | "cross" | "hook" | "uppercut" | "unknown";
export interface PunchEvent { type: PunchType; hand: "left" | "right"; confidence: number; speed: number; timestamp: number; }

export function detectPunch(current: Landmark[], previous: Landmark[] | null, timestamp: number): PunchEvent | null {
  if (!previous || current.length < 17 || previous.length < 17) return null;
  const candidates = [
    { hand: "left" as const, wrist: current[15], old: previous[15], shoulder: current[11] },
    { hand: "right" as const, wrist: current[16], old: previous[16], shoulder: current[12] },
  ];
  let best: PunchEvent | null = null;
  for (const c of candidates) {
    const speed = Math.hypot(c.wrist.x - c.old.x, c.wrist.y - c.old.y);
    if (speed < 0.035) continue;
    const extension = Math.hypot(c.wrist.x - c.shoulder.x, c.wrist.y - c.shoulder.y);
    const type: PunchType = Math.abs(c.wrist.y - c.shoulder.y) > extension * 0.55 ? "uppercut" : Math.abs(c.wrist.y - c.shoulder.y) < extension * 0.3 ? "hook" : "jab";
    const event = { type, hand: c.hand, confidence: Math.min(1, speed * 8), speed, timestamp };
    if (!best || event.confidence > best.confidence) best = event;
  }
  return best;
}
