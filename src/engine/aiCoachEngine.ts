import { FIGHTER_STYLES, StyleProfile } from './styleProfiles';
import { UserStats } from './userDataEngine';

export interface AIAdvice {
  feedback: string;
  metricLabel: string;
  score: number;
}

export class AICoachEngine {
  public evaluatePunch(
    punchType: 'jab' | 'cross',
    landmarks: any[],
    elbowAngle: number,
    peakVelocity: number,
    fighterId: string = 'SOVIET_CLASSIC',
    userStats?: UserStats
  ): AIAdvice | null {
    if (!landmarks || landmarks.length < 29) return null;

    const profile: StyleProfile = FIGHTER_STYLES[fighterId] || FIGHTER_STYLES.SOVIET_CLASSIC;
    let feedback = '';
    let score = 85;

    // Extract posture points for advanced 2026 style checking
    const nose = landmarks[0];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    const hipCenterZ = (leftHip.z + rightHip.z) / 2;
    const torsoLeanX = Math.abs(nose.x - (leftHip.x + rightHip.x) / 2);

    if (profile.allowHeadSlipBait) {
      // Canelo / Mexican Pressure style feedback
      if (torsoLeanX > 0.12 && nose.z < hipCenterZ) {
        feedback = "🔥 Perfect slip-counter weight shift! Great Canelo-style pull back.";
        score = 98;
      } else {
        feedback = "Canelo Style: Keep weight balanced on back foot ready to counter off the slip.";
        score = 80;
      }
    } else {
      // Soviet Strict style feedback
      if (torsoLeanX > 0.08) {
        feedback = "⚠️ Torso leaning too far. Maintain vertical Bivol-style posture.";
        score = 72;
      } else if (elbowAngle < profile.targetElbowAnglePunch ?? 160) {
        feedback = "⚠️ Extend your punch fully through the target line.";
        score = 78;
      } else {
        feedback = "⚡ Crisp, linear Soviet snap! Excellent execution.";
        score = 95;
      }
    }

    return {
      feedback,
      metricLabel: `${profile.name} Model`,
      score
    };
  }
}
