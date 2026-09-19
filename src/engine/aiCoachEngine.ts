import { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { FIGHTER_STYLES, StyleProfile } from './styleProfiles';
import { UserStats } from './userDataEngine';

export interface AIAdvice {
  score: number;
  metricName: string;
  feedback: string;
  severity: 'good' | 'warning' | 'critical';
  timestamp: number;
}

export class AICoachEngine {
  private lastAdviceTime: number = 0;
  private readonly ADVICE_COOLDOWN_MS = 1600;

  public evaluatePunch(
    type: 'jab' | 'cross',
    landmarks: NormalizedLandmark[],
    elbowAngle: number,
    velocity: number,
    styleId: string = 'bivol',
    userStats?: UserStats
  ): AIAdvice | null {
    const now = Date.now();
    if (now - this.lastAdviceTime < this.ADVICE_COOLDOWN_MS) return null;
    if (!landmarks || landmarks.length < 33) return null;

    const profile: StyleProfile = FIGHTER_STYLES[styleId] || FIGHTER_STYLES.bivol;

    const offWrist = type === 'jab' ? landmarks[16] : landmarks[15];
    const offShoulder = type === 'jab' ? landmarks[12] : landmarks[11];
    const userGuardDrop = Math.abs(offWrist.y - offShoulder.y);

    const extensionDiff = profile.minExtensionAngle - elbowAngle;

    let score = 100;
    if (extensionDiff > 10) score -= Math.min(40, extensionDiff * 2);
    if (userGuardDrop > profile.guardThresholdY) score -= 30;

    let personalizedHint = '';
    if (userStats && userStats.samplesCount >= 10) {
      const pastAvg = type === 'jab' ? userStats.avgJabAngle : userStats.avgCrossAngle;
      if (elbowAngle > pastAvg + 3) {
        personalizedHint = ` (+${Math.round(elbowAngle - pastAvg)}° past your average!)`;
      }
    }

    this.lastAdviceTime = now;

    if (userGuardDrop > profile.guardThresholdY) {
      return {
        score: Math.max(20, Math.round(score)),
        metricName: 'Guard Shield Deficit',
        feedback: `Guard dropped! Shield your chin with your off-hand like ${profile.name}.`,
        severity: 'critical',
        timestamp: now
      };
    }

    if (extensionDiff > 10) {
      return {
        score: Math.max(30, Math.round(score)),
        metricName: 'Extension Precision',
        feedback: `Extension reached ${Math.round(elbowAngle)}° (Benchmark for ${profile.name}: ${profile.minExtensionAngle}°). Fully snap into the target.${personalizedHint}`,
        severity: 'warning',
        timestamp: now
      };
    }

    return {
      score: Math.min(100, Math.round(score)),
      metricName: 'Archetype Precision',
      feedback: `Flawless ${type.toUpperCase()} execution! Matched ${profile.name}'s kinematic mechanics and guard level.${personalizedHint}`,
      severity: 'good',
      timestamp: now
    };
  }
}
