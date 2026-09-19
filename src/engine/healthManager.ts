import {
  checkBackendHealth,
} from "./api";

import {
  initializeServiceRegistry,
  updateServiceHealth,
  getAllServiceHealth,
  getOverallServiceStatus,
} from "./serviceRegistry";

import {
  reportServiceHealth,
} from "./serviceDiagnostics";

import {
  HealthResponse,
} from "./backendTypes";

export interface HealthCheckResult {
  overall:
    | "online"
    | "offline"
    | "degraded"
    | "unknown";

  checkedAt: string;

  services: ReturnType<
    typeof getAllServiceHealth
  >;
}

let initialized = false;

function ensureInitialized(): void {
  if (initialized) {
    return;
  }

  initializeServiceRegistry();

  initialized = true;
}

export async function checkServiceHealth():
  Promise<HealthCheckResult> {
  ensureInitialized();

  const checkedAt =
    new Date().toISOString();

  const response =
    await checkBackendHealth();

  if (
    !response.success ||
    !response.data
  ) {
    updateServiceHealth(
      "api",
      {
        status: "offline",

        error:
          response.error ??
          "Backend health check failed.",
      }
    );

    reportServiceHealth(
      updateServiceHealth(
        "api",
        {
          status: "offline",

          error:
            response.error ??
            "Backend health check failed.",
        }
      )
    );

    return {
      overall:
        getOverallServiceStatus(),

      checkedAt,

      services:
        getAllServiceHealth(),
    };
  }

  applyHealthResponse(
    response.data
  );

  return {
    overall:
      getOverallServiceStatus(),

    checkedAt,

    services:
      getAllServiceHealth(),
  };
}

function applyHealthResponse(
  health: HealthResponse
): void {
  updateServiceHealth(
    "api",
    {
      status:
        health.services.api,

      version:
        health.version,
    }
  );

  updateServiceHealth(
    "database",
    {
      status:
        health.services.database,
    }
  );

  updateServiceHealth(
    "storage",
    {
      status:
        health.services.storage,
    }
  );

  updateServiceHealth(
    "video_processor",
    {
      status:
        health.services
          .videoProcessor,
    }
  );

  updateServiceHealth(
    "ml_service",
    {
      status:
        health.services
          .mlService,
    }
  );

  for (
    const service of
      getAllServiceHealth()
  ) {
    reportServiceHealth(
      service
    );
  }
}

export function getCurrentHealth():
  HealthCheckResult {
  ensureInitialized();

  return {
    overall:
      getOverallServiceStatus(),

    checkedAt:
      new Date().toISOString(),

    services:
      getAllServiceHealth(),
  };
}

export function resetHealthManager():
  void {
  initialized = false;
}
