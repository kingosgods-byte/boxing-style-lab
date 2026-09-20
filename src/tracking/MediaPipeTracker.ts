import {
  FilesetResolver,
  PoseLandmarker,
} from "@mediapipe/tasks-vision";

import {
  Landmark,
  PoseTracker,
} from "./TrackerTypes";

export class MediaPipeTracker implements PoseTracker {
  readonly source = "mediapipe" as const;

  private pose: PoseLandmarker | null = null;
  private lastTimestamp = -1;

  async init(): Promise<void> {
    if (this.pose) {
      return;
    }

    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm"
    );

    this.pose = await PoseLandmarker.createFromOptions(
      vision,
      {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
          delegate: "CPU",
        },

        runningMode: "VIDEO",

        numPoses: 1,

        minPoseDetectionConfidence: 0.4,

        minPosePresenceConfidence: 0.4,

        minTrackingConfidence: 0.4,
      }
    );

    this.lastTimestamp = -1;
  }

  detect(
    video: HTMLVideoElement,
    timestamp: number
  ): Landmark[] | null {
    if (!this.pose) {
      return null;
    }

    if (timestamp <= this.lastTimestamp) {
      timestamp = this.lastTimestamp + 1;
    }

    this.lastTimestamp = timestamp;

    try {
      const result = this.pose.detectForVideo(
        video,
        timestamp
      );

      const landmarks = result.landmarks?.[0];

      if (!landmarks) {
        return null;
      }

      return landmarks.map((point) => ({
        x: point.x,
        y: point.y,
        z: point.z,
        visibility: point.visibility,
      }));
    } catch (error) {
      console.error(
        "MediaPipe detection error:",
        error
      );

      return null;
    }
  }

  isReady(): boolean {
    return this.pose !== null;
  }

  dispose(): void {
    this.pose?.close();
    this.pose = null;
    this.lastTimestamp = -1;
  }
}
