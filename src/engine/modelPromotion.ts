import {
  evaluateModel,
  hasEnoughEvaluationData,
  ModelEvaluation,
} from "./modelEvaluation";

import {
  getModel,
  activateModel,
} from "./modelRegistry";

export interface PromotionDecision {
  modelVersion: string;

  evaluated: boolean;

  enoughData: boolean;

  approved: boolean;

  reason: string;

  evaluation: ModelEvaluation;
}

export function evaluatePromotion(
  modelVersion: string,
  minimumExamples = 20
): PromotionDecision {
  const model =
    getModel(modelVersion);

  if (!model) {
    throw new Error(
      `Model ${modelVersion} is not registered.`
    );
  }

  const evaluation =
    evaluateModel(modelVersion);

  const enoughData =
    hasEnoughEvaluationData(
      evaluation,
      minimumExamples
    );

  if (!enoughData) {
    return {
      modelVersion,

      evaluated:
        evaluation.status ===
        "evaluated",

      enoughData: false,

      approved: false,

      reason:
        `Not enough labeled examples. ` +
        `Requires at least ${minimumExamples}.`,

      evaluation,
    };
  }

  if (
    evaluation.accuracy < 0.8
  ) {
    return {
      modelVersion,

      evaluated: true,

      enoughData: true,

      approved: false,

      reason:
        "Model did not meet the minimum evaluation accuracy.",

      evaluation,
    };
  }

  return {
    modelVersion,

    evaluated: true,

    enoughData: true,

    approved: true,

    reason:
      "Model passed the current evaluation gate.",

    evaluation,
  };
}

export function promoteModel(
  modelVersion: string,
  minimumExamples = 20
): PromotionDecision {
  const decision =
    evaluatePromotion(
      modelVersion,
      minimumExamples
    );

  if (!decision.approved) {
    return decision;
  }

  const activated =
    activateModel(
      modelVersion
    );

  if (!activated) {
    return {
      ...decision,

      approved: false,

      reason:
        "Model passed evaluation but could not be activated.",
    };
  }

  return decision;
}
