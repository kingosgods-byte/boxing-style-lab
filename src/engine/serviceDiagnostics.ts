import {
  getAllServiceHealth,
  ServiceHealth,
  ServiceStatus,
} from "./serviceRegistry";

import {
  recordDiagnostic,
} from "./diagnostics";

function severityForStatus(
  status: ServiceStatus
) {
  switch (status) {
    case "offline":
      return "critical" as const;

    case "degraded":
      return "warning" as const;

    case "online":
      return "info" as const;

    default:
      return "warning" as const;
  }
}

export function reportServiceHealth(
  service: ServiceHealth
): void {
  const severity =
    severityForStatus(
      service.status
    );

  const message =
    service.status === "online"
      ? `${service.name} service is online.`
      : `${service.name} service is ${service.status}.`;

  recordDiagnostic(
    message,
    {
      severity,

      category:
        service.name ===
        "video_processor"
          ? "media"
          : service.name ===
              "ml_service"
            ? "model"
            : service.name ===
                "api"
              ? "network"
              : "runtime",

      details:
        service.error ??
        service.version,

      resource:
        service.name,

    }
  );
}

export function reportAllServiceHealth():
  void {
  const services =
    getAllServiceHealth();

  for (const service of services) {
    reportServiceHealth(
      service
    );
  }
}

export function reportServiceFailure(
  service: ServiceHealth,
  error: unknown
): void {
  const message =
    error instanceof Error
      ? error.message
      : String(error);

  recordDiagnostic(
    `${service.name} service failure`,
    {
      severity: "critical",

      category:
        service.name ===
        "video_processor"
          ? "media"
          : service.name ===
              "ml_service"
            ? "model"
            : service.name ===
                "api"
              ? "network"
              : "runtime",

      details: message,

      resource:
        service.name,

      stack:
        error instanceof Error
          ? error.stack
          : undefined,
    }
  );
}
