import {
  getPrivacySettings,
  enableSharedTraining,
  disableSharedTraining,
  declineSharedTraining,
  canUseForPrivateAnalysis,
  canUseForSharedTraining,
} from "./privacy";

export type ConsentChoice =
  | "grant"
  | "decline"
  | "revoke";

export interface ConsentState {
  privateAnalysisAllowed: boolean;

  sharedTrainingAllowed: boolean;

  consentVersion: string;

  updatedAt: string;
}

export function getConsentState():
  ConsentState {
  const privacy =
    getPrivacySettings();

  return {
    privateAnalysisAllowed:
      canUseForPrivateAnalysis(),

    sharedTrainingAllowed:
      canUseForSharedTraining(),

    consentVersion:
      privacy.consent.version,

    updatedAt:
      privacy.updatedAt,
  };
}

export function grantSharedTrainingConsent():
  ConsentState {
  enableSharedTraining();

  return getConsentState();
}

export function declineSharedTrainingConsent():
  ConsentState {
  declineSharedTraining();

  return getConsentState();
}

export function revokeSharedTrainingConsent():
  ConsentState {
  disableSharedTraining();

  return getConsentState();
}

export function applyConsentChoice(
  choice: ConsentChoice
): ConsentState {
  switch (choice) {
    case "grant":
      return grantSharedTrainingConsent();

    case "decline":
      return declineSharedTrainingConsent();

    case "revoke":
      return revokeSharedTrainingConsent();

    default:
      return getConsentState();
  }
}

export function canAnalyzePrivately():
  boolean {
  return canUseForPrivateAnalysis();
}

export function canShareForTraining():
  boolean {
  return canUseForSharedTraining();
}

export function getConsentExplanation():
  string {
  return [
    "Your boxing analysis can remain private.",

    "Shared training is optional and requires explicit consent.",

    "Private analysis does not require permission to contribute data to training.",

    "You can revoke shared-training permission later.",
  ].join(" ");
}
