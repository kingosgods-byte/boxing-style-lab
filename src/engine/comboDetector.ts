import { PunchEvent } from './punchDetector';

export interface ComboEvent {
  comboName: string;
  sequence: string[];
  totalTimeMs: number;
  avgVelocity: number;
  timestamp: number;
}

export class ComboDetector {
  private punchHistory: PunchEvent[] = [];
  private readonly COMBO_WINDOW_MS = 1800;

  public processPunch(punch: PunchEvent): ComboEvent | null {
    const now = Date.now();
    this.punchHistory = this.punchHistory.filter(
      (p) => now - p.timestamp < this.COMBO_WINDOW_MS
    );
    this.punchHistory.push(punch);

    if (this.punchHistory.length < 2) return null;

    const seq = this.punchHistory.map((p) => p.type);
    const lastTwo = seq.slice(-2).join('-');
    const lastThree = seq.slice(-3).join('-');

    let comboName = '';
    if (lastThree === 'jab-jab-cross') comboName = 'Double Jab-Cross Blitz';
    else if (lastTwo === 'jab-cross') comboName = '1-2 Classic Combo';

    if (!comboName) return null;

    const firstPunch = this.punchHistory[0];
    const totalTimeMs = now - firstPunch.timestamp;
    const avgVelocity = Number(
      (
        this.punchHistory.reduce((acc, p) => acc + p.peakVelocity, 0) /
        this.punchHistory.length
      ).toFixed(2)
    );

    this.punchHistory = [];

    return {
      comboName,
      sequence: seq,
      totalTimeMs,
      avgVelocity,
      timestamp: now
    };
  }

  public reset() {
    this.punchHistory = [];
  }
}
