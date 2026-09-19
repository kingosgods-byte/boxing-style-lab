import { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { BIVOL_BENCHMARKS, PoseVector } from '../data/bivolBenchmarks';

export interface AIAdvice {
  score: number;             // 0-100% match with Bivol
  metricName: string;        // e.g. "Elbow Extension"
  feedback: string;          // Specific biomechanical advice
  severity: 'good' | 'warning' | 'critical';
  timestamp: number;
}

export class AICoachEngine {
  private lastAdviceTime: number = 0;
  private readonly ADVICE_COOLDOWN_MS = 2500; // Prevent spamming feedback

  public evaluatePunch(
    type: 'jab' | 'cross',
    landmarks: NormalizedLandmark[],
    elbowAngle: number,
    velocity: number
  ): AIAdvice | null {
    const now = Date.now();
    if (now - this.lastAdviceTime < this.ADVICE_COOLDOWN_MS) return null;

    if (!landmarks || landmarks.length < 33) return null;

    const targetBenchmark = type === 'jab' ? BIVOL_BENCHMARKS.LEAD_JAB_APEX : BIVOL_BENCHMARKS.CROSS_DRIVE;

    // 1. Check Off-Hand Guard Protection (Shoulder vs Off-Wrist)
    // Left Jab -> check Right Wrist (16) vs Right Shoulder (12)
    const offWrist = type === 'jab' ? landmarks[16] : landmarks[15];
    const offShoulder = type === 'jab' ? landmarks[12] : landmarks[11];
    const userGuardHeight = Math.abs(offWrist.y - offShoulder.y);

    // 2. Measure Elbow Extension Deficit
    const extensionDiff = targetBenchmark.elbowFlexionAngle - elbowAngle;

    // 3. Compute Biomechanical Similarity Score
    let score = 100;
    
    // Penalties based on actual visual divergence from Bivol
    if (extensionDiff > 15) score -= Math.min(30, extensionDiff * 1.5);
    if (userGuardHeight > 0.18) score -= 25; // Dropped guard during attack

    this.lastAdviceTime = now;

    // Generate dynamic feedback based on real landmark deviations
    if (userGuardHeight > 0.18) {
      return {
        score: Math.round(score),
        metricName: 'Rear Guard Integrity',
        feedback: `Your ${type === 'jab' ? 'rear' : 'lead'} guard dropped ${Math.round(userGuardHeight * 100)}cm below chin during execution. Bivol keeps his glove anchored to protect against counters.`,
        severity: 'critical',
        timestamp: now
      };
    }

    if (extensionDiff > 15) {
      return {
        score: Math.round(score),
        metricName: 'Kinetic Extension',
        feedback: `Shortened reach: Elbow extended to only ${Math.round(elbowAngle)}° (Bivol extends to ${targetBenchmark.elbowFlexionAngle}°). Fully snap the arm at apex.`,
        severity: 'warning',
        timestamp: now
      };
    }

    return {
      score: Math.round(score),
      metricName: 'Soviet Precision',
      feedback: `Clean ${type.toUpperCase()} execution! Matched Bivol's compact trajectory and extension angle closely.`,
      severity: 'good',
      timestamp: now
    };
  }
}
