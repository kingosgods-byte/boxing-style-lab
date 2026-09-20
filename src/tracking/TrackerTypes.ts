export type TrackerSource =
  | "mediapipe"
  | "movenet-thunder"
  | "movenet-lightning";

export interface Landmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
  score?: number;
}

export interface TrackingFrame {
  source: TrackerSource;
  landmarks: Landmark[];
  timestamp: number;
  confidence: number;
}

export interface FusedTrackingFrame {
  landmarks: Landmark[];
  timestamp: number;
  confidence: number;
  sources: TrackerSource[];
  sourceFrames: TrackingFrame[];
}

export interface PoseTracker {
  readonly source: TrackerSource;

  init(): Promise<void>;

  detect(
    video: HTMLVideoElement,
    timestamp: number
  ): Landmark[] | null;

  isReady(): boolean;

  dispose?(): void;
}
