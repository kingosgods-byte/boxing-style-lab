import {
  submitAnalysis,
  AnalysisRequest,
  AnalysisResponse,
} from "./api";

import {
  PoseSequence,
} from "./poseSequence";

import {
  PredictionResult,
} from "./prediction";

import {
  CoachingResult,
} from "./predictionCoach";

export interface MLAnalysisRequest {
  sessionId: string;

  modelVersion?: string;

  sequence: PoseSequence;

  metrics?: Record<
    string,
    number
  >;
}

export interface MLAnalysisResponse {
  sessionId: string;

  modelVersion: string;

  predictions: PredictionResult;

  coaching: CoachingResult;

  processingTimeMs: number;
}

export interface MLServiceStatus {
  configured: boolean;

  available: boolean;

  modelVersion?: string;

  checkedAt: string;
}

export function isMLServiceConfigured():
  boolean {
  return (
    import.meta.env
      .VITE_API_BASE_URL
      ?.trim()
      .length > 0
  );
}

export async function analyzePoseSequence(
  input: MLAnalysisRequest
): Promise<
  MLAnalysisResponse | null
> {
  if (
    !isMLServiceConfigured()
  ) {
    return null;
  }

  const request:
    AnalysisRequest = {
    sessionId:
      input.sessionId,

    modelVersion:
      input.modelVersion,

    poseSequence:
      input.sequence.frames,

    metrics:
      input.metrics,
  };

  const response =
    await submitAnalysis(
      request
    );

  if (
    !response.success ||
    !response.data
  ) {
    return null;
  }

  return {
    sessionId:
      response.data.sessionId,

    modelVersion:
      response.data.modelVersion,

    predictions:
      response.data
        .predictions as PredictionResult,

    coaching:
      response.data
        .coaching as CoachingResult,

    processingTimeMs:
      response.data
        .processingTimeMs,
  };
}

export async function getMLServiceStatus():
  Promise<MLServiceStatus> {
  const configured =
    isMLServiceConfigured();

  if (!configured) {
    return {
      configured: false,

      available: false,

      checkedAt:
        new Date().toISOString(),
    };
  }

  try {
    const response =
      await import("./api").then(
        ({ checkBackendHealth }) =>
          checkBackendHealth()
      );

    return {
      configured: true,

      available:
        response.success,

      modelVersion:
        response.data?.version,

      checkedAt:
        new Date().toISOString(),
    };
  } catch {
    return {
      configured: true,

      available: false,

      checkedAt:
        new Date().toISOString(),
    };
  }
}
