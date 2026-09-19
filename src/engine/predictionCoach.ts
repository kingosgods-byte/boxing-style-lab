import {
  PredictionResult,
  TechniquePrediction,
  getTopPrediction,
} from "./prediction";

export interface CoachingMessage {
  techniqueId: string;

  techniqueName: string;

  confidence: number;

  message: string;

  cues: string[];

  evidence: string[];

  modelVersion: string;

  timestampMs: number;
}

export interface CoachingResult {
  primary:
    | CoachingMessage
    | null;

  alternatives: CoachingMessage[];

  generatedAt: string;
}

function buildMessage(
  prediction: TechniquePrediction
): CoachingMessage {
  const confidencePercent =
    Math.round(
      prediction.confidence * 100
    );

  const message =
    prediction.confidence >= 0.8
      ? `Detected ${prediction.techniqueName} with ${confidencePercent}% confidence.`
      : prediction.confidence >= 0.5
        ? `Possible ${prediction.techniqueName} detected with ${confidencePercent}% confidence.`
        : `Low-confidence ${prediction.techniqueName} signal detected.`;

  return {
    techniqueId:
      prediction.techniqueId,

    techniqueName:
      prediction.techniqueName,

    confidence:
      prediction.confidence,

    message,

    cues: [
      ...prediction.coachingCues,
    ],

    evidence: [
      ...prediction.evidence,
    ],

    modelVersion:
      prediction.modelVersion,

    timestampMs:
      prediction.timestampMs,
  };
}

export function generateCoaching(
  result: PredictionResult,
  minimumConfidence = 0.5
): CoachingResult {
  const eligible =
    result.predictions
      .filter(
        (prediction) =>
          prediction.confidence >=
          minimumConfidence
      )
      .sort(
        (a, b) =>
          b.confidence -
          a.confidence
      );

  const primaryPrediction =
    getTopPrediction({
      ...result,

      predictions:
        eligible,
    });

  const primary =
    primaryPrediction
      ? buildMessage(
          primaryPrediction
        )
      : null;

  const alternatives =
    eligible
      .filter(
        (prediction) =>
          prediction.techniqueId !==
          primaryPrediction?.techniqueId
      )
      .slice(0, 3)
      .map(buildMessage);

  return {
    primary,

    alternatives,

    generatedAt:
      new Date().toISOString(),
  };
}

export function getPrimaryCoaching(
  result: PredictionResult
): CoachingMessage | null {
  return generateCoaching(
    result
  ).primary;
}

export function getCoachingText(
  coaching: CoachingResult
): string {
  if (!coaching.primary) {
    return "No confident technique detected.";
  }

  return coaching.primary.message;
}

export function exportCoaching(
  coaching: CoachingResult
): string {
  return JSON.stringify(
    coaching,
    null,
    2
  );
}
