import {
  DiagnosticEvent,
  getDiagnostics,
} from "./diagnostics";

export interface DiagnosticEnvironment {
  userAgent: string;
  language: string;
  platform: string;
  online: boolean;
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  location: string;
  timestamp: string;
}

export interface DiagnosticReport {
  app: string;
  version: string;
  generatedAt: string;
  environment: DiagnosticEnvironment;
  eventCount: number;
  criticalCount: number;
  errorCount: number;
  warningCount: number;
  events: DiagnosticEvent[];
}

function getEnvironment(): DiagnosticEnvironment {
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    online: navigator.onLine,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    devicePixelRatio: window.devicePixelRatio,
    location: window.location.origin,
    timestamp: new Date().toISOString(),
  };
}

export function buildDiagnosticReport(): DiagnosticReport {
  const events = getDiagnostics();

  return {
    app: "Bivol Boxing Lab",
    version: "1.0.0",
    generatedAt: new Date().toISOString(),

    environment: getEnvironment(),

    eventCount: events.length,

    criticalCount: events.filter(
      (event) => event.severity === "critical"
    ).length,

    errorCount: events.filter(
      (event) => event.severity === "error"
    ).length,

    warningCount: events.filter(
      (event) => event.severity === "warning"
    ).length,

    events,
  };
}

export function exportDiagnosticReport(): string {
  return JSON.stringify(
    buildDiagnosticReport(),
    null,
    2
  );
}

export function getDiagnosticSummary(): string {
  const report = buildDiagnosticReport();

  if (report.eventCount === 0) {
    return "No diagnostic events recorded.";
  }

  const categories = new Map<string, number>();

  for (const event of report.events) {
    categories.set(
      event.category,
      (categories.get(event.category) ?? 0) + 1
    );
  }

  const categorySummary =
    [...categories.entries()]
      .map(
        ([category, count]) =>
          `${category}: ${count}`
      )
      .join(", ");

  return [
    `Bivol Boxing Lab diagnostic summary`,
    `Events: ${report.eventCount}`,
    `Critical: ${report.criticalCount}`,
    `Errors: ${report.errorCount}`,
    `Warnings: ${report.warningCount}`,
    `Categories: ${categorySummary}`,
  ].join("\n");
}
