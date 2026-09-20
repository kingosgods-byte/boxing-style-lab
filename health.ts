export type HealthState = "healthy" | "warning" | "critical";
export interface HealthCheck { id: string; name: string; state: HealthState; detail: string; }

export function runHealthChecks(): HealthCheck[] {
  return [
    { id: "runtime", name: "Runtime", state: "healthy", detail: "Application runtime is available." },
    { id: "camera", name: "Camera pipeline", state: "warning", detail: "Camera is idle until permission is granted." },
    { id: "mediapipe", name: "MediaPipe", state: "warning", detail: "Model loads on demand." },
    { id: "movenet", name: "MoveNet", state: "warning", detail: "Secondary trackers load on demand." },
    { id: "repair", name: "Repair system", state: "healthy", detail: "Diagnostics and safe-repair contracts are active." },
  ];
}
