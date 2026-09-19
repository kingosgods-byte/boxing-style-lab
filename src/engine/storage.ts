import {
  getBackendConfig,
} from "./backendConfig";

import {
  canUseForSharedTraining,
} from "./consent";

export type StoragePurpose =
  | "private_video"
  | "training_data"
  | "diagnostic_data";

export interface StorageReference {
  id: string;

  purpose: StoragePurpose;

  createdAt: string;

  remoteReference?: string;

  localOnly: boolean;
}

export interface StoragePolicy {
  privateVideoAllowed: boolean;

  trainingDataAllowed: boolean;

  diagnosticDataAllowed: boolean;

  rawVideoForTrainingAllowed: boolean;
}

export function getStoragePolicy():
  StoragePolicy {
  return {
    privateVideoAllowed: true,

    trainingDataAllowed:
      canUseForSharedTraining(),

    diagnosticDataAllowed:
      getBackendConfig()
        .diagnosticsUploadEnabled,

    rawVideoForTrainingAllowed:
      false,
  };
}

export function createPrivateVideoReference(
  localReference: string
): StorageReference {
  return {
    id:
      `private_video_${Date.now()}`,

    purpose:
      "private_video",

    createdAt:
      new Date().toISOString(),

    localOnly: true,

    remoteReference:
      localReference,
  };
}

export function createTrainingDataReference(
  remoteReference: string
): StorageReference | null {
  if (
    !canUseForSharedTraining()
  ) {
    return null;
  }

  return {
    id:
      `training_data_${Date.now()}`,

    purpose:
      "training_data",

    createdAt:
      new Date().toISOString(),

    remoteReference,

    localOnly: false,
  };
}

export function createDiagnosticReference(
  remoteReference: string
): StorageReference {
  return {
    id:
      `diagnostic_${Date.now()}`,

    purpose:
      "diagnostic_data",

    createdAt:
      new Date().toISOString(),

    remoteReference,

    localOnly: false,
  };
}

export function canUploadRawVideoForTraining():
  boolean {
  return false;
}

export function canUploadTrainingData():
  boolean {
  return canUseForSharedTraining();
}

export function shouldKeepVideoPrivate():
  boolean {
  return true;
}
