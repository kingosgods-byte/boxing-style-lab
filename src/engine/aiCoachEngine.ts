import { STYLE_PROFILES, StyleProfile } from './styleProfiles';

export class AICoachEngine {
  private activeProfile: StyleProfile;

  constructor(profileKey: 'SOVIET_CLASSIC' | 'MEXICAN_PRESSURE') {
    this.activeProfile = STYLE_PROFILES[profileKey];
  }

  public evaluatePosture(landmarks: any[]): string[] {
    const feedback: string[] = [];
    
    // Extract key joints (MediaPipe Indices: Nose=0, Shoulders=11/12, Hips=23/24)
    const nose = landmarks[0];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    
    // Calculate torso lean for slip/bait mechanics
    const hipCenterZ = (leftHip.z + rightHip.z) / 2;
    const torsoLean = Math.abs(nose.x - (leftHip.x + rightHip.x) / 2);

    if (this.activeProfile.allowHeadSlipBait) {
      // Canelo style: Checking if user is successfully shifting weight back without losing balance
      if (torsoLean > 0.15 && nose.z < hipCenterZ) {
        feedback.push("Good weight transfer! Excellent reactive pull-back.");
      } else {
        feedback.push("Plant your feet and let them come to you—wait to counter off the slip.");
      }
    } else {
      // Soviet style: Strict upright posture
      if (torsoLean > 0.08) {
        feedback.push("Torso leaning too far. Keep your spine vertical, Soviet style.");
      }
    }

    return feedback;
  }
}
