import { FilesetResolver, PoseLandmarker, HandLandmarker } from "@mediapipe/tasks-vision";
import { Landmark } from "../types";

export class MediaPipeTracker {
  pose:PoseLandmarker|null=null;
  hands:HandLandmarker|null=null;
  async init(){
    const vision=await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm");
    this.pose=await PoseLandmarker.createFromOptions(vision,{
      baseOptions:{modelAssetPath:"https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task"},
      runningMode:"VIDEO",numPoses:1
    });
    this.hands=await HandLandmarker.createFromOptions(vision,{
      baseOptions:{modelAssetPath:"https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task"},
      runningMode:"VIDEO",numHands:2
    });
  }
  detect(video:HTMLVideoElement,time:number){
    if(!this.pose) return null;
    const p=this.pose.detectForVideo(video,time);
    return p.landmarks?.[0] as Landmark[]|undefined;
  }
}