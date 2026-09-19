import { NormalizedLandmark } from '@mediapipe/tasks-vision';

export interface UserBiomechanicsProfile {
  guardBoxRadius: number;      // Personalized distance threshold for returning to guard
  armReachLength: number;      // Maximum shoulder-to-wrist extension ratio
  velocityBaseline: number;    // Idle noise vs real movement threshold
  calibrationComplete: boolean;
}

export class AdaptiveBoxingBrain {
  private profile: UserBiomechanicsProfile = {
    guardBoxRadius: 0.20,
    armReachLength: 0.40,
    velocityBaseline: 0.35,
    calibrationComplete: false
  };

  private calibrationFrames: { dist: number; velocity: number }[] = [];

  // Calibrates the engine based on 3-5 seconds of idle stance
  public calibrateIdleState(landmarks: NormalizedLandmark[], dt: number): boolean {
    if (!landmarks || landmarks.length < 33) return false;

    const lShoulder = landmarks[11], lWrist = landmarks[15];
    const dist = Math.hypot(lWrist.x - lShoulder.x, lWrist.y - lShoulder.y);

    this.calibrationFrames.push({ dist, velocity: dist / dt });

    if (this.calibrationFrames.length >= 90) { // ~3 seconds at 30fps
      const avgDist = this.calibrationFrames.reduce((a, b) => a + b.dist, 0) / 90;
      const maxNoiseVelocity = Math.max(...this.calibrationFrames.map(f => f.velocity));

      // Adaptively compute personal thresholds
      this.profile.guardBoxRadius = avgDist * 1.25;
      this.profile.velocityBaseline = Math.max(0.30, maxNoiseVelocity * 1.8);
      this.profile.calibrationComplete = true;

      console.log('Brain Calibrated to User:', this.profile);
      return true;
    }
    return false;
  }

  public getProfile(): UserBiomechanicsProfile {
    return this.profile;
  }
}
