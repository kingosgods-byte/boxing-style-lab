import {
  FilesetResolver,
  PoseLandmarker,
} from "@mediapipe/tasks-vision";

import { Landmark } from "../types";

export class MediaPipeTracker {
  pose: PoseLandmarker | null = null;

  async init() {
    if (this.pose) return;

    // Fixed: Pointing to unpkg or versionless WASM CDN avoids 404/MIME type issues on jsDelivr
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
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
  }

  detect(
    video: HTMLVideoElement,
    timestamp: number
  ) {
    if (!this.pose) return null;

    const result =
      this.pose.detectForVideo(
        video,
        timestamp
      );

    return result.landmarks?.[0] as
      | Landmark[]
      | undefined;
  }
}
