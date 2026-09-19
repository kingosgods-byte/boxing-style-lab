import {
  submitTechniqueFeedback,
  TechniqueFeedback,
} from "./feedback";

import {
  TechniqueObservation,
  LearningOutcome,
} from "./learning";

export interface UserFeedbackInput {
  modelVersion: string;

  observation: TechniqueObservation;

  outcome: LearningOutcome;

  correction?: string;

  feedback?: string;
}

export interface UserFeedbackResult {
  accepted: boolean;

  record:
    | TechniqueFeedback
    | null;

  message: string;
}

export function submitUserFeedback(
  input: UserFeedbackInput
): UserFeedbackResult {
  if (
    !input.modelVersion.trim()
  ) {
    return {
      accepted: false,

      record: null,

      message:
        "A model version is required.",
    };
  }

  if (
    !input.observation.technique.trim()
  ) {
    return {
      accepted: false,

      record: null,

      message:
        "A predicted technique is required.",
    };
  }

  const record =
    submitTechniqueFeedback({
      modelVersion:
        input.modelVersion,

      observation:
        input.observation,

      outcome:
        input.outcome,

      correction:
        input.correction,

      feedback:
        input.feedback,

      submittedBy: "user",
    });

  return {
    accepted: true,

    record,

    message:
      "Feedback recorded successfully.",
  };
}

export function markPredictionCorrect(
  input: Omit<
    UserFeedbackInput,
    "outcome"
  >
): UserFeedbackResult {
  return submitUserFeedback({
    ...input,

    outcome: "correct",
  });
}

export function markPredictionIncorrect(
  input: Omit<
    UserFeedbackInput,
    "outcome"
  >
): UserFeedbackResult {
  return submitUserFeedback({
    ...input,

    outcome: "incorrect",
  });
}

export function markPredictionPartiallyCorrect(
  input: Omit<
    UserFeedbackInput,
    "outcome"
  >
): UserFeedbackResult {
  return submitUserFeedback({
    ...input,

    outcome:
      "partially_correct",
  });
}

export function markPredictionUnknown(
  input: Omit<
    UserFeedbackInput,
    "outcome"
  >
): UserFeedbackResult {
  return submitUserFeedback({
    ...input,

    outcome: "unknown",
  });
}
