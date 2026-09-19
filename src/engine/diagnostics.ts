export type DiagnosticSeverity =
  | "info"
  | "warning"
  | "error"
  | "critical";

export type DiagnosticCategory =
  | "camera"
  | "model"
  | "media"
  | "network"
  | "runtime"
  | "deployment"
  | "unknown";

export interface DiagnosticEvent {
  id: string;
  timestamp: string;
  severity: DiagnosticSeverity;
  category: DiagnosticCategory;
  message: string;
  details?: string;
  resource?: string;
  stack?: string;
  userAgent: string;
  online: boolean;
}

const MAX_EVENTS = 100;

let events: DiagnosticEvent[] = [];

function createId(): string {
  return `diag_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function detectCategory(
  message: string,
  details?: string
): DiagnosticCategory {
  const text = `${message} ${details ?? ""}`.toLowerCase();

  if (
    text.includes("camera") ||
    text.includes("getusermedia") ||
    text.includes("permission") ||
    text.includes("notallowederror") ||
    text.includes("notreadableerror")
  ) {
    return "camera";
  }

  if (
    text.includes("mediapipe") ||
    text.includes("pose") ||
    text.includes("model") ||
    text.includes("landmarker")
  ) {
    return "model";
  }

  if (
    text.includes("video") ||
    text.includes("codec") ||
    text.includes("hevc") ||
    text.includes("h264") ||
    text.includes("media")
  ) {
    return "media";
  }

  if (
    text.includes("404") ||
    text.includes("fetch") ||
    text.includes("network") ||
    text.includes("failed to load resource") ||
    text.includes("cors")
  ) {
    return "network";
  }

  if (
    text.includes("github pages") ||
    text.includes("deployment") ||
    text.includes("vite")
  ) {
    return "deployment";
  }

  if (
    text.includes("typeerror") ||
    text.includes("referenceerror") ||
    text.includes("syntaxerror")
  ) {
    return "runtime";
  }

  return "unknown";
}

export function recordDiagnostic(
  message: string,
  options: {
    severity?: DiagnosticSeverity;
    category?: DiagnosticCategory;
    details?: string;
    resource?: string;
    stack?: string;
  } = {}
): DiagnosticEvent {
  const event: DiagnosticEvent = {
    id: createId(),
    timestamp: new Date().toISOString(),
    severity: options.severity ?? "error",
    category:
      options.category ??
      detectCategory(message, options.details),
    message,
    details: options.details,
    resource: options.resource,
    stack: options.stack,
    userAgent: navigator.userAgent,
    online: navigator.onLine,
  };

  events = [...events, event].slice(-MAX_EVENTS);

  console.error("[Bivol Diagnostics]", event);

  return event;
}

export function getDiagnostics(): DiagnosticEvent[] {
  return [...events];
}

export function getLatestDiagnostic(): DiagnosticEvent | null {
  return events.length > 0
    ? events[events.length - 1]
    : null;
}

export function clearDiagnostics(): void {
  events = [];
}

export function exportDiagnostics(): string {
  return JSON.stringify(
    {
      app: "Bivol Boxing Lab",
      exportedAt: new Date().toISOString(),
      eventCount: events.length,
      events,
    },
    null,
    2
  );
}

export function installGlobalDiagnostics(): () => void {
  const handleError = (event: ErrorEvent) => {
    recordDiagnostic(event.message || "Unknown JavaScript error", {
      severity: "critical",
      category: "runtime",
      details: event.filename
        ? `File: ${event.filename}:${event.lineno}:${event.colno}`
        : undefined,
      stack: event.error?.stack,
    });
  };

  const handleUnhandledRejection = (
    event: PromiseRejectionEvent
  ) => {
    const reason =
      event.reason instanceof Error
        ? event.reason.message
        : String(event.reason);

    recordDiagnostic(
      `Unhandled promise rejection: ${reason}`,
      {
        severity: "critical",
        category: "runtime",
        stack:
          event.reason instanceof Error
            ? event.reason.stack
            : undefined,
      }
    );
  };

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> => {
    const response = await originalFetch(input, init);

    if (!response.ok) {
      const resource =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url;

      recordDiagnostic(
        `HTTP ${response.status} while loading resource`,
        {
          severity:
            response.status >= 500
              ? "critical"
              : "error",
          category: "network",
          resource,
          details: response.statusText || undefined,
        }
      );
    }

    return response;
  };

  window.addEventListener(
    "error",
    handleError
  );

  window.addEventListener(
    "unhandledrejection",
    handleUnhandledRejection
  );

  return () => {
    window.removeEventListener(
      "error",
      handleError
    );

    window.removeEventListener(
      "unhandledrejection",
      handleUnhandledRejection
    );

    window.fetch = originalFetch;
  };
}
