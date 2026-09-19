import {
  recordLearningExample,
  LearningOutcome,
  TechniqueObservation,
} from "./learning";

export interface TechniqueFeedback {
  id: string;

  createdAt: string;

  modelVersion: string;

  observation: TechniqueObservation;

  outcome: LearningOutcome;

  correction?: string;

  feedback?: string;

  submittedBy:
    | "user"
    | "coach"
    | "system";
}

const feedbackRecords: TechniqueFeedback[] = [];

function createId(): string {
  return (
    `feedback_${Date.now()}_` +
    Math.random()
      .toString(36)
      .slice(2, 10)
  );
}

export function submitTechniqueFeedback(
  input: {
    modelVersion: string;

    observation: TechniqueObservation;

    outcome: LearningOutcome;

    correction?: string;

    feedback?: string;

    submittedBy?:
      | "user"
      | "coach"
      | "system";
  }
): TechniqueFeedback {
  const record: TechniqueFeedback = {
    id: createId(),

    createdAt:
      new Date().toISOString(),

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

    submittedBy:
      input.submittedBy ?? "user",
  };

  feedbackRecords.push(record);

  recordLearningExample({
    modelVersion:
      input.modelVersion,

    observation:
      input.observation,

    outcome:
      input.outcome,

    userCorrection:
      input.correction,

    userFeedback:
      input.feedback,
  });

  return record;
}

export function getTechniqueFeedback():
  TechniqueFeedback[] {
  return feedbackRecords.map(
    (record) => ({
      ...record,

      observation: {
        ...record.observation,

        metrics: {
          ...record.observation.metrics,
        },
      },
    })
  );
}

export function getFeedbackForModel(
  modelVersion: string
): TechniqueFeedback[] {
  return getTechniqueFeedback().filter(
    (record) =>
      record.modelVersion ===
      modelVersion
  );
}

export function getFeedbackStatistics() {
  const records =
    getTechniqueFeedback();

  const total = records.length;

  const correct =
    records.filter(
      (record) =>
        record.outcome === "correct"
    ).length;

  const incorrect =
    records.filter(
      (record) =>
        record.outcome === "incorrect"
    ).length;

  const partiallyCorrect =
    records.filter(
      (record) =>
        record.outcome ===
        "partially_correct"
    ).length;

  const unknown =
    records.filter(
      (record) =>
        record.outcome === "unknown"
    ).length;

  return {
    total,
    correct,
    incorrect,
    partiallyCorrect,
    unknown,
  };
}

export function exportFeedback():
  string {
  return JSON.stringify(
    {
      dataset:
        "Bivol Boxing Lab Technique Feedback",

      exportedAt:
        new Date().toISOString(),

      statistics:
        getFeedbackStatistics(),

      feedback:
        getTechniqueFeedback(),
    },
    null,
    2
  );
}

export function clearFeedback(): void {
  feedbackRecords.length = 0;
}
