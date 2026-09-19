export interface BackendError {
  code: string;

  message: string;

  requestId?: string;

  retryable: boolean;
}

export interface VideoUploadRequest {
  fileName: string;

  mimeType: string;

  sizeBytes: number;

  purpose: "private_analysis";
}

export interface VideoUploadResponse {
  uploadId: string;

  storageReference: string;

  expiresAt?: string;
}

export interface VideoProcessingRequest {
  uploadId: string;

  storageReference: string;

  outputFormat:
    | "mp4"
    | "webm";

  targetCodec:
    | "h264"
    | "vp9";

  preserveAudio: boolean;
}

export interface VideoProcessingResponse {
  jobId: string;

  status:
    | "queued"
    | "processing"
    | "completed"
    | "failed";
}

export interface PoseFramePayload {
  timestampMs: number;

  values: number[];

  featureNames: string[];
}

export interface PoseSequencePayload {
  sequenceId: string;

  frameCount: number;

  durationMs: number;

  featureNames: string[];

  frames: PoseFramePayload[];
}

export interface MLInferenceRequest {
  requestId: string;

  sessionId: string;

  modelVersion?: string;

  sequence: PoseSequencePayload;

  metrics?: Record<
    string,
    number
  >;
}

export interface MLTechniquePrediction {
  techniqueId: string;

  confidence: number;

  timestampMs: number;

  evidence: string[];
}

export interface MLInferenceResponse {
  requestId: string;

  sessionId: string;

  modelVersion: string;

  predictions:
    MLTechniquePrediction[];

  processingTimeMs: number;
}

export interface TrainingExamplePayload {
  exampleId: string;

  dataType:
    | "pose_sequence"
    | "metrics"
    | "feedback";

  consentVersion: string;

  consentGrantedAt: string;

  anonymized: true;

  poseSequence?: PoseSequencePayload;

  metrics?: Record<
    string,
    number
  >;

  predictedTechnique?: string;

  userCorrection?: string;

  feedback?: string;

  modelVersion?: string;
}

export interface TrainingDatasetUpload {
  datasetVersion?: string;

  examples:
    TrainingExamplePayload[];
}

export interface TrainingDatasetResponse {
  accepted: boolean;

  datasetVersion: string;

  acceptedExampleCount: number;

  rejectedExampleCount: number;

  errors?: BackendError[];
}

export interface DiagnosticUpload {
  appVersion: string;

  generatedAt: string;

  environment: {
    userAgent: string;

    language: string;

    platform: string;

    online: boolean;
  };

  events: unknown[];
}

export interface HealthResponse {
  status: "ok";

  version: string;

  services: {
    api: "online" | "offline";

    storage: "online" | "offline";

    videoProcessor:
      | "online"
      | "offline";

    mlService:
      | "online"
      | "offline";

    database:
      | "online"
      | "offline";
  };

  checkedAt: string;
}
