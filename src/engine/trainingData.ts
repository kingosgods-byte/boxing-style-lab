export type TrainingConsent =
  | "not_asked"
  | "granted"
  | "declined"
  | "revoked";

export type TrainingDataType =
  | "video"
  | "pose_sequence"
  | "metrics"
  | "feedback";

export interface TrainingConsentRecord {
  consent: TrainingConsent;

  grantedAt?: string;

  revokedAt?: string;

  version: string;
}

export interface TrainingExample {
  id: string;

  createdAt: string;

  dataType: TrainingDataType;

  consent: TrainingConsentRecord;

  anonymized: boolean;

  sourceUserId?: string;

  videoReference?: string;

  poseSequence?: unknown[];

  metrics?: Record<
    string,
    number
  >;

  predictedTechnique?: string;

  userCorrection?: string;

  feedback?: string;

  modelVersion?: string;
}

const CONSENT_VERSION = "1.0";

let consentRecord: TrainingConsentRecord = {
  consent: "not_asked",
  version: CONSENT_VERSION,
};

let trainingExamples: TrainingExample[] = [];

function createId(): string {
  return (
    `training_${Date.now()}_` +
    Math.random()
      .toString(36)
      .slice(2, 10)
  );
}

export function getTrainingConsent():
  TrainingConsentRecord {
  return {
    ...consentRecord,
  };
}

export function grantTrainingConsent(): void {
  consentRecord = {
    consent: "granted",
    grantedAt:
      new Date().toISOString(),
    version: CONSENT_VERSION,
  };
}

export function declineTrainingConsent(): void {
  consentRecord = {
    consent: "declined",
    version: CONSENT_VERSION,
  };
}

export function revokeTrainingConsent(): void {
  consentRecord = {
    consent: "revoked",
    revokedAt:
      new Date().toISOString(),
    version: CONSENT_VERSION,
  };
}

export function canCollectTrainingData(): boolean {
  return consentRecord.consent === "granted";
}

export function createTrainingExample(
  example: Omit<
    TrainingExample,
    | "id"
    | "createdAt"
    | "consent"
    | "anonymized"
  >
): TrainingExample | null {
  if (!canCollectTrainingData()) {
    return null;
  }

  const trainingExample: TrainingExample = {
    ...example,

    id: createId(),

    createdAt:
      new Date().toISOString(),

    consent: {
      ...consentRecord,
    },

    anonymized: true,
  };

  trainingExamples = [
    ...trainingExamples,
    trainingExample,
  ];

  return trainingExample;
}

export function getTrainingExamples():
  TrainingExample[] {
  return trainingExamples.map(
    (example) => ({
      ...example,
      consent: {
        ...example.consent,
      },
    })
  );
}

export function clearLocalTrainingExamples(): void {
  trainingExamples = [];
}

export function exportTrainingExamples():
  string {
  return JSON.stringify(
    {
      dataset:
        "Bivol Boxing Lab Training Data",

      exportedAt:
        new Date().toISOString(),

      consentVersion:
        CONSENT_VERSION,

      exampleCount:
        trainingExamples.length,

      examples:
        trainingExamples,
    },
    null,
    2
  );
}
