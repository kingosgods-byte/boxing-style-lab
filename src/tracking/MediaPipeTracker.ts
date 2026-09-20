import {
  FilesetResolver,
  PoseLandmarker,
} from "@mediapipe/tasks-vision";

import { Landmark } from "../types";

export class MediaPipeTracker {
  pose: PoseLandmarker | null = null;

  private lastTimestamp = -1;

  async init() {
    if (this.pose) return;

    const vision =
      await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm"
      );

    this.pose =
      await PoseLandmarker.createFromOptions(
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

    /*
     * MediaPipe VIDEO mode requires
     * monotonically increasing timestamps.
     */
    if (timestamp <= this.lastTimestamp) {
      timestamp =
        this.lastTimestamp + 1;
    }

    this.lastTimestamp = timestamp;

    const result =
      this.pose.detectForVideo(
        video,
        timestamp
      );

    return (
      (result.landmarks?.[0] as
        | Landmark[]
        | undefined) ?? null
    );
  }
}
