import {
  getTechniqueFeedback,
  TechniqueFeedback,
} from "./feedback";

export interface ModelEvaluation {
  modelVersion: string;

  evaluatedAt: string;

  totalExamples: number;

  correct: number;

  incorrect: number;

  partiallyCorrect: number;

  unknown: number;

  accuracy: number;

  labeledAccuracy: number;

  status:
    | "insufficient_data"
    | "evaluated";
}

function getModelFeedback(
  modelVersion: string
): TechniqueFeedback[] {
  return getTechniqueFeedback().filter(
    (record) =>
      record.modelVersion ===
      modelVersion
  );
}

export function evaluateModel(
  modelVersion: string
): ModelEvaluation {
  const feedback =
    getModelFeedback(modelVersion);

  const total =
    feedback.length;

  const correct =
    feedback.filter(
      (record) =>
        record.outcome === "correct"
    ).length;

  const incorrect =
    feedback.filter(
      (record) =>
        record.outcome === "incorrect"
    ).length;

  const partiallyCorrect =
    feedback.filter(
      (record) =>
        record.outcome ===
        "partially_correct"
    ).length;

  const unknown =
    feedback.filter(
      (record) =>
        record.outcome === "unknown"
    ).length;

  const labeledTotal =
    correct +
    incorrect +
    partiallyCorrect;

  return {
    modelVersion,

    evaluatedAt:
      new Date().toISOString(),

    totalExamples: total,

    correct,

    incorrect,

    partiallyCorrect,

    unknown,

    accuracy:
      total > 0
        ? correct / total
        : 0,

    labeledAccuracy:
      labeledTotal > 0
        ? (
            correct +
            partiallyCorrect * 0.5
          ) / labeledTotal
        : 0,

    status:
      total > 0
        ? "evaluated"
        : "insufficient_data",
  };
}

export function evaluateModels(
  modelVersions: string[]
): ModelEvaluation[] {
  return modelVersions.map(
    (version) =>
      evaluateModel(version)
  );
}

export function hasEnoughEvaluationData(
  evaluation: ModelEvaluation,
  minimumExamples = 20
): boolean {
  return (
    evaluation.totalExamples >=
    minimumExamples
  );
}

export function exportModelEvaluation(
  evaluation: ModelEvaluation
): string {
  return JSON.stringify(
    evaluation,
    null,
    2
  );
}
