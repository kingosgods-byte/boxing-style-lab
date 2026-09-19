export interface PunchSample {
  timestamp: number;
  type: 'jab' | 'cross';
  elbowAngle: number;
  peakVelocity: number;
}

export interface UserStats {
  totalPunches: number;
  avgJabAngle: number;
  avgCrossAngle: number;
  avgVelocity: number;
  samplesCount: number;
}

const STORAGE_KEY = 'boxing_lab_user_data_v1';

export class UserDataEngine {
  private samples: PunchSample[] = [];

  constructor() {
    this.loadData();
  }

  private loadData(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.samples = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Failed to load user data from localStorage', e);
    }
  }

  public saveSample(sample: PunchSample): void {
    this.samples.push(sample);
    // Keep last 500 punch samples for local adaptation
    if (this.samples.length > 500) {
      this.samples = this.samples.slice(-500);
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.samples));
    } catch (e) {
      console.warn('Failed to save user data to localStorage', e);
    }
  }

  public getUserStats(): UserStats {
    if (this.samples.length === 0) {
      return { totalPunches: 0, avgJabAngle: 150, avgCrossAngle: 155, avgVelocity: 4.0, samplesCount: 0 };
    }

    const jabs = this.samples.filter(s => s.type === 'jab');
    const crosses = this.samples.filter(s => s.type === 'cross');

    const avgJabAngle = jabs.length > 0
      ? jabs.reduce((acc, s) => acc + s.elbowAngle, 0) / jabs.length
      : 150;

    const avgCrossAngle = crosses.length > 0
      ? crosses.reduce((acc, s) => acc + s.elbowAngle, 0) / crosses.length
      : 155;

    const avgVelocity = this.samples.reduce((acc, s) => acc + s.peakVelocity, 0) / this.samples.length;

    return {
      totalPunches: this.samples.length,
      avgJabAngle: Math.round(avgJabAngle),
      avgCrossAngle: Math.round(avgCrossAngle),
      avgVelocity: parseFloat(avgVelocity.toFixed(1)),
      samplesCount: this.samples.length
    };
  }

  public clearData(): void {
    this.samples = [];
    localStorage.removeItem(STORAGE_KEY);
  }
}
