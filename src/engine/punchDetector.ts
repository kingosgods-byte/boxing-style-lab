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
  private prevTime: number = 0;

  // Calibrated for Bivol's compact Soviet mechanics
  private readonly VELOCITY_THRESHOLD = 1.8;  // Spikes required to trigger
  private readonly MIN_EXTENSION_ANGLE = 145; // Minimum elbow extension (degrees)
  private readonly RETRACTION_ZONE = 0.25;    // Must return near shoulder before next punch

  public processFrame(landmarks: NormalizedLandmark[], timestamp: number): PunchEvent | null {
    if (!landmarks || landmarks.length < 33) return null;

    const dt = (timestamp - this.prevTime) / 1000;
    this.prevTime = timestamp;
    if (dt <= 0) return null;

    // MediaPipe pose indices: 
    // Left: Shoulder=11, Elbow=13, Wrist=15
    // Right: Shoulder=12, Elbow=14, Wrist=16
    const lShoulder = landmarks[11], lElbow = landmarks[13], lWrist = landmarks[15];
    const rShoulder = landmarks[12], rElbow = landmarks[14], rWrist = landmarks[16];

    // Analyze Left Lead (Bivol Jab Engine)
    const leftEvent = this.analyzeArm(
      'left', lShoulder, lElbow, lWrist, 
      this.prevLeftWrist, dt, this.leftArmState, 
      (state) => { this.leftArmState = state; }
    );

    // Analyze Right Hand (Cross)
    const rightEvent = this.analyzeArm(
      'right', rShoulder, rElbow, rWrist, 
      this.prevRightWrist, dt, this.rightArmState, 
      (state) => { this.rightArmState = state; }
    );

    this.prevLeftWrist = lWrist;
    this.prevRightWrist = rWrist;

    return leftEvent || rightEvent;
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

    // Relative velocity (isolates arm motion from footwork/torso shifts)
    const dx = (wrist.x - shoulder.x) - (prevWrist.x - shoulder.x);
    const dy = (wrist.y - shoulder.y) - (prevWrist.y - shoulder.y);
    const dz = (wrist.z - shoulder.z) - (prevWrist.z - shoulder.z);
    const velocity = Math.sqrt(dx * dx + dy * dy + dz * dz) / dt;

    const angle = this.calculateAngle(shoulder, elbow, wrist);
    const distToShoulder = Math.hypot(wrist.x - shoulder.x, wrist.y - shoulder.y);

    if (currentState === 'GUARD') {
      if (velocity > this.VELOCITY_THRESHOLD && angle > 110) {
        setState('EXTENDING');
      }
    } else if (currentState === 'EXTENDING') {
      if (angle >= this.MIN_EXTENSION_ANGLE) {
        setState('RETRACTING');
        
        const isStraight = Math.abs(wrist.x - shoulder.x) < 0.3;
        return {
          type: arm === 'left' ? (isStraight ? 'jab' : 'hook') : 'cross',
          arm,
          peakVelocity: Number(velocity.toFixed(2)),
          extensionRatio: Math.min(100, Math.round((angle / 180) * 100)),
          timestamp: Date.now()
        };
      }
    } else if (currentState === 'RETRACTING') {
      if (distToShoulder < this.RETRACTION_ZONE || angle < 90) {
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
