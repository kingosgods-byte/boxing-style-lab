import { NormalizedLandmark } from '@mediapipe/tasks-vision';

export interface PunchEvent {
  type: 'jab' | 'cross' | 'hook' | 'uppercut';
  arm: 'left' | 'right';
  peakVelocity: number;
  extensionRatio: number;
  timestamp: number;
}

export class SovietPunchAnalyzer {
  private leftArmState: 'GUARD' | 'EXTENDING' | 'RETRACTING' = 'GUARD';
  private rightArmState: 'GUARD' | 'EXTENDING' | 'RETRACTING' = 'GUARD';
  
  private prevLeftWrist: NormalizedLandmark | null = null;
  private prevRightWrist: NormalizedLandmark | null = null;
  private lastTimestamp: number = 0;

  // Calibrated thresholds for real webcam streams
  private readonly MIN_VISIBILITY = 0.65;      // Ignore flickering/low confidence joints
  private readonly MIN_PUNCH_DISTANCE = 0.18;   // Minimum 18% screen extension (kills idle jitter)
  private readonly VELOCITY_THRESHOLD = 0.45;   // True acceleration threshold
  private readonly MIN_EXTENSION_ANGLE = 140;  // Elbow extension at apex
  private readonly RETRACTION_ZONE = 0.22;     // Must return near guard box

  public processFrame(landmarks: NormalizedLandmark[], timestamp: number): PunchEvent | null {
    if (!landmarks || landmarks.length < 33) return null;

    // Fix 1: Ensure valid delta time (dt) in seconds (min 15ms frame gap)
    if (!this.lastTimestamp) {
      this.lastTimestamp = timestamp;
      return null;
    }

    const dt = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;

    if (dt < 0.015 || dt > 0.5) return null; // Reject dropped frames or zero-dt spikes

    // MediaPipe Landmarks
    const lShoulder = landmarks[11], lElbow = landmarks[13], lWrist = landmarks[15];
    const rShoulder = landmarks[12], rElbow = landmarks[14], rWrist = landmarks[16];

    // Fix 2: Check Joint Visibility Confidence
    const leftVisible = (lShoulder?.visibility ?? 1) > this.MIN_VISIBILITY &&
                        (lElbow?.visibility ?? 1) > this.MIN_VISIBILITY &&
                        (lWrist?.visibility ?? 1) > this.MIN_VISIBILITY;

    const rightVisible = (rShoulder?.visibility ?? 1) > this.MIN_VISIBILITY &&
                         (rElbow?.visibility ?? 1) > this.MIN_VISIBILITY &&
                         (rWrist?.visibility ?? 1) > this.MIN_VISIBILITY;

    let punchEvent: PunchEvent | null = null;

    if (leftVisible) {
      punchEvent = this.analyzeArm(
        'left', lShoulder, lElbow, lWrist,
        this.prevLeftWrist, dt, this.leftArmState,
        (s) => { this.leftArmState = s; }
      );
    }

    if (!punchEvent && rightVisible) {
      punchEvent = this.analyzeArm(
        'right', rShoulder, rElbow, rWrist,
        this.prevRightWrist, dt, this.rightArmState,
        (s) => { this.rightArmState = s; }
      );
    }

    this.prevLeftWrist = lWrist;
    this.prevRightWrist = rWrist;

    return punchEvent;
  }

  private analyzeArm(
    arm: 'left' | 'right',
    shoulder: NormalizedLandmark,
    elbow: NormalizedLandmark,
    wrist: NormalizedLandmark,
    prevWrist: NormalizedLandmark | null,
    dt: number,
    currentState: 'GUARD' | 'EXTENDING' | 'RETRACTING',
    setState: (s: 'GUARD' | 'EXTENDING' | 'RETRACTING') => void
  ): PunchEvent | null {
    if (!prevWrist) return null;

    // Calculate actual 2D distance from shoulder to wrist
    const currentDist = Math.hypot(wrist.x - shoulder.x, wrist.y - shoulder.y);
    
    // Displacement frame over frame (relative to shoulder to negate body swaying)
    const dx = (wrist.x - shoulder.x) - (prevWrist.x - shoulder.x);
    const dy = (wrist.y - shoulder.y) - (prevWrist.y - shoulder.y);
    const displacement = Math.hypot(dx, dy);

    // Filter micro-noise jitter while standing still
    if (displacement < 0.01) return null;

    const velocity = displacement / dt;
    const angle = this.calculateAngle(shoulder, elbow, wrist);

    // State Machine logic with deadzone filters
    if (currentState === 'GUARD') {
      // Must have acceleration AND significant physical movement away from body
      if (velocity > this.VELOCITY_THRESHOLD && currentDist > this.MIN_PUNCH_DISTANCE && angle > 115) {
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
      // Must return back to the guard box before resetting state
      if (currentDist < this.RETRACTION_ZONE || angle < 95) {
        setState('GUARD');
      }
    }

    return null;
  }

  private calculateAngle(a: NormalizedLandmark, b: NormalizedLandmark, c: NormalizedLandmark): number {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    if (angle > 180.0) angle = 360 - angle;
    return angle;
  }
}
