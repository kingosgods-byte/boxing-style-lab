export type ServiceStatus =
  | "unknown"
  | "online"
  | "offline"
  | "degraded";

export type ServiceName =
  | "api"
  | "database"
  | "storage"
  | "video_processor"
  | "ml_service";

export interface ServiceHealth {
  name: ServiceName;

  status: ServiceStatus;

  version?: string;

  checkedAt: string;

  responseTimeMs?: number;

  error?: string;
}

const services: ServiceHealth[] = [];

function createHealth(
  name: ServiceName
): ServiceHealth {
  return {
    name,

    status: "unknown",

    checkedAt:
      new Date().toISOString(),
  };
}

export function initializeServiceRegistry():
  void {
  services.length = 0;

  services.push(
    createHealth("api"),
    createHealth("database"),
    createHealth("storage"),
    createHealth(
      "video_processor"
    ),
    createHealth("ml_service")
  );
}

export function updateServiceHealth(
  name: ServiceName,
  update: Partial<
    ServiceHealth
  >
): ServiceHealth {
  const existing =
    services.find(
      (service) =>
        service.name === name
    );

  if (existing) {
    Object.assign(
      existing,
      update,
      {
        name,
        checkedAt:
          new Date().toISOString(),
      }
    );

    return {
      ...existing,
    };
  }

  const created: ServiceHealth = {
    ...createHealth(name),
    ...update,

    name,

    checkedAt:
      new Date().toISOString(),
  };

  services.push(created);

  return {
    ...created,
  };
}

export function getServiceHealth(
  name: ServiceName
): ServiceHealth {
  const service =
    services.find(
      (item) =>
        item.name === name
    );

  return service
    ? { ...service }
    : createHealth(name);
}

export function getAllServiceHealth():
  ServiceHealth[] {
  return services.map(
    (service) => ({
      ...service,
    })
  );
}

export function getOverallServiceStatus():
  ServiceStatus {
  if (services.length === 0) {
    return "unknown";
  }

  if (
    services.some(
      (service) =>
        service.status === "offline"
    )
  ) {
    return "offline";
  }

  if (
    services.some(
      (service) =>
        service.status === "degraded"
    )
  ) {
    return "degraded";
  }

  if (
    services.every(
      (service) =>
        service.status === "online"
    )
  ) {
    return "online";
  }

  return "unknown";
}

export function resetServiceRegistry():
  void {
  services.length = 0;
}
