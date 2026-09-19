import {
  getTrainingConsent,
  grantTrainingConsent,
  declineTrainingConsent,
  revokeTrainingConsent,
  canCollectTrainingData,
  TrainingConsentRecord,
} from "./trainingData";

export type DataPermission =
  | "private_analysis"
  | "shared_training";

export interface PrivacySettings {
  privateAnalysis: boolean;

  sharedTraining: boolean;

  consent: TrainingConsentRecord;

  updatedAt: string;
}

export function getPrivacySettings():
  PrivacySettings {
  const consent =
    getTrainingConsent();

  return {
    privateAnalysis: true,

    sharedTraining:
      canCollectTrainingData(),

    consent,

    updatedAt:
      new Date().toISOString(),
  };
}

export function allowPrivateAnalysis(): void {
  // Private analysis is always allowed.
  // This function exists so the permission
  // model can be expanded later.
}

export function enableSharedTraining(): void {
  grantTrainingConsent();
}

export function disableSharedTraining(): void {
  revokeTrainingConsent();
}

export function declineSharedTraining(): void {
  declineTrainingConsent();
}

export function canUseForPrivateAnalysis():
  boolean {
  return true;
}

export function canUseForSharedTraining():
  boolean {
  return canCollectTrainingData();
}

export function getDataPermissions(): {
  privateAnalysis: boolean;

  sharedTraining: boolean;
} {
  return {
    privateAnalysis:
      canUseForPrivateAnalysis(),

    sharedTraining:
      canUseForSharedTraining(),
  };
}
