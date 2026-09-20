import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";
import type { Landmark, TrackerResult } from "./TrackerTypes";

export class MediaPipeTracker {
  readonly id = "mediapipe" as const;
  private pose: PoseLandmarker | null = null;
  private lastTimestamp = -1;

  async init() {
    if (this.pose) return;
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm"
    );
    this.pose = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    this.lastTimestamp = -1;
  }

  detect(video: HTMLVideoElement, timestamp: number): TrackerResult {
    const started = performance.now();
    if (!this.pose) {
      return { tracker: this.id, timestamp, landmarks: [], confidence: 0, latencyMs: 0, detected: false, availableLandmarks: 0, error: "Tracker not initialized" };
    }
    const safeTimestamp = timestamp <= this.lastTimestamp ? this.lastTimestamp + 1 : timestamp;
    this.lastTimestamp = safeTimestamp;
    try {
      const result = this.pose.detectForVideo(video, safeTimestamp);
      const raw = result.landmarks?.[0] as Landmark[] | undefined;
      const landmarks = raw ?? [];
      const confidence = landmarks.length
        ? landmarks.reduce((sum, p) => sum + (p.visibility ?? 1), 0) / landmarks.length
        : 0;
      return {
        tracker: this.id,
        timestamp: safeTimestamp,
        landmarks,
        confidence,
        latencyMs: performance.now() - started,
        detected: landmarks.length > 0,
        availableLandmarks: landmarks.length,
      };
    } catch (error) {
      return {
        tracker: this.id,
        timestamp: safeTimestamp,
        landmarks: [],
        confidence: 0,
        latencyMs: performance.now() - started,
        detected: false,
        availableLandmarks: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
