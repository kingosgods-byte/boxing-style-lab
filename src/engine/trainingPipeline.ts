import {
  createDatasetVersion,
  updateDatasetStatus,
  DatasetVersion,
} from "./datasetVersioning";

import {
  getDatasetStatistics,
} from "./dataset";

import {
  getAllModels,
  registerModel,
  ModelVersion,
} from "./modelRegistry";

export interface TrainingJob {
  id: string;

  createdAt: string;

  datasetVersion: string;

  modelVersion: string;

  status:
    | "created"
    | "queued"
    | "training"
    | "completed"
    | "failed"
    | "cancelled";

  startedAt?: string;

  completedAt?: string;

  error?: string;
}

const trainingJobs:
  TrainingJob[] = [];

function createId(): string {
  return (
    `training_job_${Date.now()}_` +
    Math.random()
      .toString(36)
      .slice(2, 10)
  );
}

function getNextModelVersion():
  string {
  const models =
    getAllModels();

  if (models.length === 0) {
    return "1.0.0";
  }

  const versions =
    models.map(
      (model) =>
        model.version
    );

  const latest =
    versions[versions.length - 1];

  const parts =
    latest.split(".").map(Number);

  const major =
    parts[0] ?? 1;

  const minor =
    parts[1] ?? 0;

  const patch =
    (parts[2] ?? 0) + 1;

  return `${major}.${minor}.${patch}`;
}

export function prepareTrainingRun(
  description: string
): {
  dataset: DatasetVersion;

  job: TrainingJob;
} {
  const statistics =
    getDatasetStatistics();

  if (
    statistics.trainingExamples === 0
  ) {
    throw new Error(
      "Cannot prepare a training run without training examples."
    );
  }

  const dataset =
    createDatasetVersion(
      description
    );

  updateDatasetStatus(
    dataset.id,
    "ready"
  );

  const modelVersion =
    getNextModelVersion();

  const job: TrainingJob = {
    id: createId(),

    createdAt:
      new Date().toISOString(),

    datasetVersion:
      dataset.version,

    modelVersion:
      modelVersion,

    status: "created",
  };

  trainingJobs.push(job);

  return {
    dataset:
      dataset,

    job:
      job,
  };
}

export function queueTrainingJob(
  jobId: string
): boolean {
  const job =
    trainingJobs.find(
      (item) =>
        item.id === jobId
    );

  if (!job) {
    return false;
  }

  if (
    job.status !== "created"
  ) {
    return false;
  }

  job.status = "queued";

  return true;
}

export function startTrainingJob(
  jobId: string
): boolean {
  const job =
    trainingJobs.find(
      (item) =>
        item.id === jobId
    );

  if (!job) {
    return false;
  }

  if (
    job.status !== "queued"
  ) {
    return false;
  }

  job.status = "training";

  job.startedAt =
    new Date().toISOString();

  return true;
}

export function completeTrainingJob(
  jobId: string,
  description: string
): ModelVersion | null {
  const job =
    trainingJobs.find(
      (item) =>
        item.id === jobId
    );

  if (!job) {
    return null;
  }

  if (
    job.status !== "training"
  ) {
    return null;
  }

  const model: ModelVersion = {
    id:
      `bivol-model-${job.modelVersion}`,

    name:
      "Bivol Boxing Learned Model",

    version:
      job.modelVersion,

    type:
      "experimental",

    createdAt:
      new Date().toISOString(),

    description,

    trainingDatasetVersion:
      job.datasetVersion,

    active: false,
  };

  registerModel(model);

  job.status = "completed";

  job.completedAt =
    new Date().toISOString();

  return {
    ...model,
  };
}

export function failTrainingJob(
  jobId: string,
  error: string
): boolean {
  const job =
    trainingJobs.find(
      (item) =>
        item.id === jobId
    );

  if (!job) {
    return false;
  }

  job.status = "failed";

  job.error = error;

  job.completedAt =
    new Date().toISOString();

  return true;
}

export function cancelTrainingJob(
  jobId: string
): boolean {
  const job =
    trainingJobs.find(
      (item) =>
        item.id === jobId
    );

  if (!job) {
    return false;
  }

  if (
    job.status === "completed" ||
    job.status === "failed"
  ) {
    return false;
  }

  job.status = "cancelled";

  job.completedAt =
    new Date().toISOString();

  return true;
}

export function getTrainingJobs():
  TrainingJob[] {
  return trainingJobs.map(
    (job) => ({
      ...job,
    })
  );
}

export function getTrainingJob(
  jobId: string
): TrainingJob | null {
  const job =
    trainingJobs.find(
      (item) =>
        item.id === jobId
    );

  return job
    ? { ...job }
    : null;
}
