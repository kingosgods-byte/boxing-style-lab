import { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { BIVOL_BENCHMARKS } from '../data/bivolBenchmarks';

export interface AIAdvice {
  score: number;
  metricName: string;
  feedback: string;
  severity: 'good' | 'warning' | 'critical';
  timestamp: number;
}

export class AICoachEngine {
  private lastAdviceTime: number = 0;
  private readonly ADVICE_COOLDOWN_MS = 2000;

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

    const offWrist = type === 'jab' ? landmarks[16] : landmarks[15];
    const offShoulder = type === 'jab' ? landmarks[12] : landmarks[11];
    const userGuardHeight = Math.abs(offWrist.y - offShoulder.y);

    const extensionDiff = targetBenchmark.elbowFlexionAngle - elbowAngle;

    let score = 100;
    if (extensionDiff > 12) score -= Math.min(35, extensionDiff * 1.8);
    if (userGuardHeight > 0.16) score -= 30;

    this.lastAdviceTime = now;

    if (userGuardHeight > 0.16) {
      return {
        score: Math.max(20, Math.round(score)),
        metricName: 'Rear Guard Integrity',
        feedback: `Your ${type === 'jab' ? 'rear' : 'lead'} guard dropped ${Math.round(userGuardHeight * 100)}cm during strike execution. Bivol keeps his glove anchored to his cheek to prevent counters.`,
        severity: 'critical',
        timestamp: now
      };
    }

    if (extensionDiff > 12) {
      return {
        score: Math.max(30, Math.round(score)),
        metricName: 'Kinetic Extension',
        feedback: `Shortened range: Elbow extended to ${Math.round(elbowAngle)}° (Bivol extends to ${targetBenchmark.elbowFlexionAngle}°). Fully snap the kinetic chain at apex.`,
        severity: 'warning',
        timestamp: now
      };
    }

    return {
      score: Math.min(100, Math.round(score)),
      metricName: 'Soviet Precision',
      feedback: `Clean ${type.toUpperCase()} mechanics! Matched Bivol's extension angle and guard protection closely.`,
      severity: 'good',
      timestamp: now
    };
  }
}
