import {
  getTrainingExamples,
  clearLocalTrainingExamples,
  exportTrainingExamples,
  TrainingExample,
} from "./trainingData";

import {
  getLearningRecords,
  exportLearningRecords,
  LearningRecord,
} from "./learning";

import {
  getTechniqueFeedback,
  exportFeedback,
  TechniqueFeedback,
} from "./feedback";

export interface DatasetSnapshot {
  createdAt: string;

  trainingExamples: TrainingExample[];

  learningRecords: LearningRecord[];

  feedback: TechniqueFeedback[];

  trainingExampleCount: number;

  learningRecordCount: number;

  feedbackCount: number;
}

export function buildDatasetSnapshot():
  DatasetSnapshot {
  const trainingExamples =
    getTrainingExamples();

  const learningRecords =
    getLearningRecords();

  const feedback =
    getTechniqueFeedback();

  return {
    createdAt:
      new Date().toISOString(),

    trainingExamples,

    learningRecords,

    feedback,

    trainingExampleCount:
      trainingExamples.length,

    learningRecordCount:
      learningRecords.length,

    feedbackCount:
      feedback.length,
  };
}

export function getDatasetStatistics() {
  const snapshot =
    buildDatasetSnapshot();

  return {
    trainingExamples:
      snapshot.trainingExampleCount,

    learningRecords:
      snapshot.learningRecordCount,

    feedback:
      snapshot.feedbackCount,

    totalRecords:
      snapshot.trainingExampleCount +
      snapshot.learningRecordCount +
      snapshot.feedbackCount,
  };
}

export function exportDataset():
  string {
  return JSON.stringify(
    buildDatasetSnapshot(),
    null,
    2
  );
}

export function exportTrainingDataset():
  string {
  return exportTrainingExamples();
}

export function exportLearningDataset():
  string {
  return exportLearningRecords();
}

export function exportFeedbackDataset():
  string {
  return exportFeedback();
}

export function deleteLocalTrainingData():
  void {
  clearLocalTrainingExamples();
}

export function hasTrainingData():
  boolean {
  return (
    getTrainingExamples().length > 0
  );
}
