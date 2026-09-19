import {
  createTrainingExample,
  canCollectTrainingData,
} from "./trainingData";

export type LearningOutcome =
  | "correct"
  | "incorrect"
  | "partially_correct"
  | "unknown";

export interface TechniqueObservation {
  technique: string;

  confidence: number;

  timestampMs: number;

  metrics: Record<string, number>;
}

export interface LearningRecord {
  id: string;

  createdAt: string;

  modelVersion: string;

  observation: TechniqueObservation;

  outcome: LearningOutcome;

  userCorrection?: string;

  userFeedback?: string;

  notes?: string;
}

const records: LearningRecord[] = [];

function createId(): string {
  return (
    `learning_${Date.now()}_` +
    Math.random()
      .toString(36)
      .slice(2, 10)
  );
}

export function recordLearningExample(
  input: Omit<
    LearningRecord,
    "id" | "createdAt"
  >
): LearningRecord {
  const record: LearningRecord = {
    ...input,

    id: createId(),

    createdAt:
      new Date().toISOString(),
  };

  records.push(record);

  if (canCollectTrainingData()) {
    createTrainingExample({
      dataType: "feedback",

      metrics:
        input.observation.metrics,

      predictedTechnique:
        input.observation.technique,

      userCorrection:
        input.userCorrection,

      feedback:
        input.userFeedback,

      modelVersion:
        input.modelVersion,
    });
  }

  return record;
}

export function getLearningRecords():
  LearningRecord[] {
  return records.map(
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

export function getLearningStatistics() {
  const total = records.length;

  const correct = records.filter(
    (record) =>
      record.outcome === "correct"
  ).length;

  const incorrect = records.filter(
    (record) =>
      record.outcome === "incorrect"
  ).length;

  const partiallyCorrect =
    records.filter(
      (record) =>
        record.outcome ===
        "partially_correct"
    ).length;

  const unknown = records.filter(
    (record) =>
      record.outcome === "unknown"
  ).length;

  return {
    total,
    correct,
    incorrect,
    partiallyCorrect,
    unknown,

    accuracy:
      total > 0
        ? correct / total
        : 0,
  };
}

export function exportLearningRecords():
  string {
  return JSON.stringify(
    {
      dataset:
        "Bivol Boxing Lab Learning Records",

      exportedAt:
        new Date().toISOString(),

      statistics:
        getLearningStatistics(),

      records:
        getLearningRecords(),
    },
    null,
    2
  );
}
