export interface APIResponse<T> {
  success: boolean;

  data?: T;

  error?: string;

  requestId?: string;
}

export interface AnalysisRequest {
  sessionId: string;

  modelVersion?: string;

  videoReference?: string;

  poseSequence?: unknown[];

  metrics?: Record<
    string,
    number
  >;
}

export interface AnalysisResponse {
  sessionId: string;

  modelVersion: string;

  predictions: unknown[];

  coaching: unknown[];

  processingTimeMs: number;
}

export interface TrainingDataUpload {
  examples: unknown[];

  consentVersion: string;

  anonymized: boolean;
}

export interface TrainingDataResponse {
  accepted: boolean;

  exampleCount: number;

  datasetVersion?: string;
}

export interface BackendHealth {
  status:
    | "online"
    | "offline"
    | "unknown";

  version?: string;

  checkedAt: string;
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<APIResponse<T>> {
  if (!API_BASE_URL) {
    return {
      success: false,

      error:
        "Backend API is not configured yet.",
    };
  }

  const response =
    await fetch(
      `${API_BASE_URL}${path}`,
      {
        ...options,

        headers: {
          "Content-Type":
            "application/json",

          ...(options.headers ?? {}),
        },
      }
    );

  let body:
    | APIResponse<T>
    | null = null;

  try {
    body =
      (await response.json()) as APIResponse<T>;
  } catch {
    body = null;
  }

  if (!response.ok) {
    return {
      success: false,

      error:
        body?.error ??
        `Backend request failed with HTTP ${response.status}.`,
    };
  }

  return (
    body ?? {
      success: true,
    }
  );
}

export function isBackendConfigured():
  boolean {
  return API_BASE_URL.length > 0;
}

export async function checkBackendHealth():
  Promise<APIResponse<BackendHealth>> {
  if (!isBackendConfigured()) {
    return {
      success: false,

      error:
        "Backend API is not configured yet.",
    };
  }

  return request<BackendHealth>(
    "/health"
  );
}

export async function submitAnalysis(
  input: AnalysisRequest
): Promise<
  APIResponse<AnalysisResponse>
> {
  return request<AnalysisResponse>(
    "/analysis",
    {
      method: "POST",

      body: JSON.stringify(
        input
      ),
    }
  );
}

export async function uploadTrainingData(
  input: TrainingDataUpload
): Promise<
  APIResponse<TrainingDataResponse>
> {
  return request<TrainingDataResponse>(
    "/training-data",
    {
      method: "POST",

      body: JSON.stringify(
        input
      ),
    }
  );
}

export async function requestVideoProcessing(
  videoReference: string
): Promise<
  APIResponse<{
    jobId: string;
  }>
> {
  return request<{
    jobId: string;
  }>(
    "/video/process",
    {
      method: "POST",

      body: JSON.stringify({
        videoReference,
      }),
    }
  );
}
