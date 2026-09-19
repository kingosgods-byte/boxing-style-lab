import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";
import { Landmark } from "../types";

export class MediaPipeTracker {
  pose: PoseLandmarker | null = null;

  async init() {
    if (this.pose) return;

    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm"
    );

    this.pose = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
      },
      runningMode: "VIDEO",
      numPoses: 1,
    });
  }

  detect(video: HTMLVideoElement, time: number) {
    if (!this.pose) return null;

    const result = this.pose.detectForVideo(video, time);

    return result.landmarks?.[0] as Landmark[] | undefined;
  }
}
