import {
  getDatasetStatistics,
  exportDataset,
  exportTrainingDataset,
  exportLearningDataset,
  exportFeedbackDataset,
  deleteLocalTrainingData,
} from "./dataset";

import {
  getConsentState,
  revokeSharedTrainingConsent,
} from "./consent";

export interface DataManagementSummary {
  trainingExamples: number;

  learningRecords: number;

  feedbackRecords: number;

  totalRecords: number;

  sharedTrainingEnabled: boolean;

  privateAnalysisEnabled: boolean;
}

export function getDataManagementSummary():
  DataManagementSummary {
  const statistics =
    getDatasetStatistics();

  const consent =
    getConsentState();

  return {
    trainingExamples:
      statistics.trainingExamples,

    learningRecords:
      statistics.learningRecords,

    feedbackRecords:
      statistics.feedback,

    totalRecords:
      statistics.totalRecords,

    sharedTrainingEnabled:
      consent.sharedTrainingAllowed,

    privateAnalysisEnabled:
      consent.privateAnalysisAllowed,
  };
}

export function exportAllUserData():
  string {
  return exportDataset();
}

export function exportTrainingData():
  string {
  return exportTrainingDataset();
}

export function exportLearningData():
  string {
  return exportLearningDataset();
}

export function exportFeedbackData():
  string {
  return exportFeedbackDataset();
}

export function deleteTrainingData():
  void {
  deleteLocalTrainingData();
}

export function revokeTrainingAndDeleteLocalData():
  void {
  revokeSharedTrainingConsent();

  deleteLocalTrainingData();
}

export function hasStoredData():
  boolean {
  const summary =
    getDataManagementSummary();

  return (
    summary.totalRecords > 0
  );
}
