import { NormalizedLandmark } from '@mediapipe/tasks-vision';

export interface PunchEvent {
  type: 'jab' | 'cross' | 'hook' | 'uppercut';
  arm: 'left' | 'right';
  peakVelocity: number;
  extensionRatio: number;
  timestamp: number;
}

// Low-Pass Exponential Moving Average Filter to kill webcam micro-jitter
class LandmarkSmoother {
  private smoothedX: number | null = null;
  private smoothedY: number | null = null;
  private alpha: number = 0.35; // Lower = smoother (kills noise), Higher = faster response

  public smooth(x: number, y: number): { x: number; y: number } {
    if (this.smoothedX === null || this.smoothedY === null) {
      this.smoothedX = x;
      this.smoothedY = y;
    } else {
      this.smoothedX = this.alpha * x + (1 - this.alpha) * this.smoothedX;
      this.smoothedY = this.alpha * y + (1 - this.alpha) * this.smoothedY;
    }
    return { x: this.smoothedX, y: this.smoothedY };
  }

  public reset() {
    this.smoothedX = null;
    this.smoothedY = null;
  }
}

export class SovietPunchAnalyzer {
  private leftArmState: 'GUARD' | 'EXTENDING' | 'RETRACTING' = 'GUARD';
  private rightArmState: 'GUARD' | 'EXTENDING' | 'RETRACTING' = 'GUARD';

  private leftWristSmoother = new LandmarkSmoother();
  private rightWristSmoother = new LandmarkSmoother();

  private prevLeftWrist: { x: number; y: number } | null = null;
  private prevRightWrist: { x: number; y: number } | null = null;
  private lastTimestamp: number = 0;

  // STRICT DEADZONES TO KILL SITTING JITTER
  private readonly MIN_VISIBILITY = 0.75;       // Must clearly see arm joints
  private readonly JITTER_DEADZONE = 0.025;      // Ignore movements < 2.5% of screen width
  private readonly VELOCITY_THRESHOLD = 0.85;    // Velocity required to trigger punch extension
  private readonly MIN_EXTENSION_ANGLE = 145;   // Elbow angle at apex
  private readonly RETRACTION_ZONE = 0.20;      // Distance from shoulder to reset to GUARD

  public processFrame(landmarks: NormalizedLandmark[], timestamp: number): PunchEvent | null {
    if (!landmarks || landmarks.length < 33) return null;

    if (!this.lastTimestamp) {
      this.lastTimestamp = timestamp;
      return null;
    }

    const dt = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;

    // Reject bad frame intervals or tab switches
    if (dt < 0.015 || dt > 0.4) return null;

    const lShoulder = landmarks[11], lElbow = landmarks[13], lWrist = landmarks[15];
    const rShoulder = landmarks[12], rElbow = landmarks[14], rWrist = landmarks[16];

    // Filter 1: Joints must be visible and confident
    const leftVisible = (lShoulder?.visibility ?? 0) > this.MIN_VISIBILITY &&
                        (lElbow?.visibility ?? 0) > this.MIN_VISIBILITY &&
                        (lWrist?.visibility ?? 0) > this.MIN_VISIBILITY;

    const rightVisible = (rShoulder?.visibility ?? 0) > this.MIN_VISIBILITY &&
                         (rElbow?.visibility ?? 0) > this.MIN_VISIBILITY &&
                         (rWrist?.visibility ?? 0) > this.MIN_VISIBILITY;

    let punchEvent: PunchEvent | null = null;

    if (leftVisible) {
      const smoothed = this.leftWristSmoother.smooth(lWrist.x, lWrist.y);
      punchEvent = this.analyzeArm(
        'left', lShoulder, lElbow, smoothed,
        this.prevLeftWrist, dt, this.leftArmState,
        (s) => { this.leftArmState = s; }
      );
      this.prevLeftWrist = smoothed;
    } else {
      this.leftWristSmoother.reset();
      this.prevLeftWrist = null;
      this.leftArmState = 'GUARD';
    }

    if (!punchEvent && rightVisible) {
      const smoothed = this.rightWristSmoother.smooth(rWrist.x, rWrist.y);
      punchEvent = this.analyzeArm(
        'right', rShoulder, rElbow, smoothed,
        this.prevRightWrist, dt, this.rightArmState,
        (s) => { this.rightArmState = s; }
      );
      this.prevRightWrist = smoothed;
    } else {
      this.rightWristSmoother.reset();
      this.prevRightWrist = null;
      this.rightArmState = 'GUARD';
    }

    return punchEvent;
  }

  private analyzeArm(
    arm: 'left' | 'right',
    shoulder: NormalizedLandmark,
    elbow: NormalizedLandmark,
    wrist: { x: number; y: number },
    prevWrist: { x: number; y: number } | null,
    dt: number,
    currentState: 'GUARD' | 'EXTENDING' | 'RETRACTING',
    setState: (s: 'GUARD' | 'EXTENDING' | 'RETRACTING') => void
  ): PunchEvent | null {
    if (!prevWrist) return null;

    // Distance from current position to shoulder
    const currentDist = Math.hypot(wrist.x - shoulder.x, wrist.y - shoulder.y);

    // Frame-over-frame displacement
    const dx = wrist.x - prevWrist.x;
    const dy = wrist.y - prevWrist.y;
    const displacement = Math.hypot(dx, dy);

    // DEADZONE FILTER: Completely zero-out small sitting noise/camera shake
    if (displacement < this.JITTER_DEADZONE) {
      return null;
    }

    const velocity = displacement / dt;
    const angle = this.calculateAngle(shoulder, elbow, wrist);

    // State Machine
    if (currentState === 'GUARD') {
      if (velocity > this.VELOCITY_THRESHOLD && currentDist > 0.22 && angle > 115) {
        setState('EXTENDING');
      }
    } else if (currentState === 'EXTENDING') {
      if (angle >= this.MIN_EXTENSION_ANGLE) {
        setState('RETRACTING');
        const isStraight = Math.abs(wrist.x - shoulder.x) < 0.25;

        return {
          type: arm === 'left' ? (isStraight ? 'jab' : 'hook') : 'cross',
          arm,
          peakVelocity: Number(velocity.toFixed(2)),
          extensionRatio: Math.min(100, Math.round((angle / 180) * 100)),
          timestamp: Date.now()
        };
      }
    } else if (currentState === 'RETRACTING') {
      if (currentDist < this.RETRACTION_ZONE || angle < 95) {
        setState('GUARD');
      }
    }

    return null;
  }

  private calculateAngle(
    a: NormalizedLandmark, 
    b: NormalizedLandmark, 
    c: { x: number; y: number }
  ): number {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    if (angle > 180.0) angle = 360 - angle;
    return angle;
  }
}
