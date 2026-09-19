import {
  TechniqueDefinition,
} from "./techniques";

export interface TechniquePrediction {
  techniqueId: string;

  techniqueName: string;

  category: TechniqueDefinition["category"];

  confidence: number;

  timestampMs: number;

  modelVersion: string;

  evidence: string[];

  coachingCues: string[];
}

export interface PredictionResult {
  predictions: TechniquePrediction[];

  modelVersion: string;

  timestampMs: number;

  processingTimeMs: number;
}

export function createPrediction(
  technique: TechniqueDefinition,
  confidence: number,
  timestampMs: number,
  modelVersion: string,
  evidence: string[] = []
): TechniquePrediction {
  return {
    techniqueId: technique.id,

    techniqueName:
      technique.name,

    category:
      technique.category,

    confidence:
      Math.max(
        0,
        Math.min(1, confidence)
      ),

    timestampMs,

    modelVersion,

    evidence: [
      ...evidence,
    ],

    coachingCues: [
      ...technique.coachingCues,
    ],
  };
}

export function createPredictionResult(
  predictions: TechniquePrediction[],
  modelVersion: string,
  timestampMs: number,
  processingTimeMs: number
): PredictionResult {
  return {
    predictions:
      predictions.map(
        (prediction) => ({
          ...prediction,

          evidence: [
            ...prediction.evidence,
          ],

          coachingCues: [
            ...prediction.coachingCues,
          ],
        })
      ),

    modelVersion,

    timestampMs,

    processingTimeMs,
  };
}

export function getTopPrediction(
  result: PredictionResult
): TechniquePrediction | null {
  if (
    result.predictions.length === 0
  ) {
    return null;
  }

  return (
    [...result.predictions].sort(
      (a, b) =>
        b.confidence -
        a.confidence
    )[0] ?? null
  );
}

export function filterPredictions(
  result: PredictionResult,
  minimumConfidence = 0.5
): TechniquePrediction[] {
  return result.predictions.filter(
    (prediction) =>
      prediction.confidence >=
      minimumConfidence
  );
}

export function exportPrediction(
  result: PredictionResult
): string {
  return JSON.stringify(
    result,
    null,
    2
  );
}
