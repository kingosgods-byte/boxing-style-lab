export type HealthStatus =
  | "healthy"
  | "warning"
  | "error";

export interface HealthRecord {
  service: string;
  status: HealthStatus;
  timestamp: number;
  message?: string;
}

export class HealthMonitor {
  private records = new Map<
    string,
    HealthRecord
  >();

  record(
    service: string,
    status: HealthStatus,
    message?: string
  ): void {
    this.records.set(service, {
      service,
      status,
      timestamp: Date.now(),
      message,
    });
  }

  get(service: string): HealthRecord | undefined {
    return this.records.get(service);
  }

  getAll(): HealthRecord[] {
    return Array.from(this.records.values());
  }

  isHealthy(): boolean {
    return Array.from(this.records.values()).every(
      (record) => record.status !== "error"
    );
  }

  clear(): void {
    this.records.clear();
  }
}
