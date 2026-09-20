import type { BiomechanicsSnapshot } from "../biomechanics/metrics";
import type { PunchEvent } from "../boxing/punchEngine";

export interface CoachReport { headline: string; feedback: string; confidence: number; agents: string[]; }

export function runCoachCouncil(metrics: BiomechanicsSnapshot, punch: PunchEvent | null): CoachReport {
  const agents: string[] = [];
  const notes: string[] = [];
  if (metrics.balance < 55) { agents.push("Balance Coach"); notes.push("Stabilize your base before chasing more speed."); }
  if (metrics.posture < 55) { agents.push("Technique Coach"); notes.push("Keep your torso organized as the hands move."); }
  if (metrics.kineticChain < 55) { agents.push("Kinetic Chain Coach"); notes.push("Work on sequencing the lower body, hips, torso, then hands."); }
  if (punch) { agents.push("Punch Analyst"); notes.push(`${punch.type.toUpperCase()} detected with ${(punch.confidence * 100).toFixed(0)}% event confidence.`); }
  if (!agents.length) { agents.push("Head Coach"); notes.push("Movement is currently within the stable analysis band."); }
  return { headline: punch ? `${punch.type.toUpperCase()} analyzed` : "Council awaiting a clean punch", feedback: notes.join(" "), confidence: punch ? punch.confidence : metrics.kineticChain / 100, agents };
}
