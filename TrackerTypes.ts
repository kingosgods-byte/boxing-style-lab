export type TrackerId = "mediapipe" | "movenet-thunder" | "movenet-lightning";

export interface Landmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
  score?: number;
  name?: string;
}

export interface TrackerResult {
  tracker: TrackerId;
  timestamp: number;
  landmarks: Landmark[];
  confidence: number;
  latencyMs: number;
  detected: boolean;
  availableLandmarks: number;
  error?: string;
}

export interface FusionResult {
  timestamp: number;
  landmarks: Landmark[] | null;
  confidence: number;
  contributingTrackers: TrackerId[];
  agreement: number;
  health: "excellent" | "good" | "degraded" | "lost";
}
