import {
  FusedTrackingFrame,
  Landmark,
} from "../tracking/TrackerTypes";
import { BiomechanicsMetrics } from "../biomechanics/metrics";

export type PunchType =
  | "jab"
  | "cross"
  | "hook"
  | "uppercut"
  | "unknown";

export interface PunchResult {
  detected: boolean;
  type: PunchType;
  velocity: number;
  extension: number;
  confidence: number;
}

function distance(a: Landmark, b: Landmark): number {
  return Math.sqrt(
    Math.pow(a.x - b.x, 2) +
      Math.pow(a.y - b.y, 2)
  );
}

export function detectPunch(
  frame: FusedTrackingFrame,
  metrics: BiomechanicsMetrics
): PunchResult {
  const points = frame.landmarks;

  /*
   * MediaPipe:
   * 11 = left shoulder
   * 12 = right shoulder
   * 15 = left wrist
   * 16 = right wrist
   */

  const leftShoulder = points[11];
  const rightShoulder = points[12];
  const leftWrist = points[15];
  const rightWrist = points[16];

  if (
    !leftShoulder ||
    !rightShoulder ||
    !leftWrist ||
    !rightWrist
  ) {
    return {
      detected: false,
      type: "unknown",
      velocity: 0,
      extension: 0,
      confidence: 0,
    };
  }

  const leftExtension = distance(
    leftShoulder,
    leftWrist
  );

  const rightExtension = distance(
    rightShoulder,
    rightWrist
  );

  const shoulderWidth =
    metrics.shoulderWidth || 0.1;

  const leftNormalized =
    leftExtension / shoulderWidth;

  const rightNormalized =
    rightExtension / shoulderWidth;

  /*
   * This first detector intentionally uses
   * geometric extension rather than pretending
   * to measure real hand velocity.
   *
   * Temporal velocity will be added once the
   * tracker-history engine is connected.
   */

  const extension =
    Math.max(
      leftNormalized,
      rightNormalized
    );

  const detected = extension > 1.55;

  if (!detected) {
    return {
      detected: false,
      type: "unknown",
      velocity: 0,
      extension,
      confidence: 0,
    };
  }

  const leftDominant =
    leftNormalized > rightNormalized;

  /*
   * Without temporal history we cannot reliably
   * distinguish every punch type yet.
   *
   * We therefore classify the current extended
   * arm conservatively as a provisional jab/cross.
   */

  const type: PunchType =
    leftDominant ? "jab" : "cross";

  const confidence = Math.min(
    1,
    Math.max(
      0,
      (extension - 1.55) / 0.9
    ) * frame.confidence
  );

  return {
    detected: true,
    type,
    velocity: 0,
    extension,
    confidence,
  };
}
