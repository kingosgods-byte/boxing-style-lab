import {
  requestVideoProcessing,
} from "./api";

export type VideoJobStatus =
  | "created"
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export interface VideoProcessingJob {
  id: string;

  videoReference: string;

  status: VideoJobStatus;

  createdAt: string;

  startedAt?: string;

  completedAt?: string;

  outputReference?: string;

  error?: string;
}

const jobs:
  VideoProcessingJob[] = [];

function createId(): string {
  return (
    `video_job_${Date.now()}_` +
    Math.random()
      .toString(36)
      .slice(2, 10)
  );
}

export function createLocalVideoJob(
  videoReference: string
): VideoProcessingJob {
  const job: VideoProcessingJob = {
    id: createId(),

    videoReference,

    status: "created",

    createdAt:
      new Date().toISOString(),
  };

  jobs.push(job);

  return {
    ...job,
  };
}

export async function submitVideoJob(
  videoReference: string
): Promise<VideoProcessingJob> {
  const localJob =
    createLocalVideoJob(
      videoReference
    );

  const response =
    await requestVideoProcessing(
      videoReference
    );

  if (!response.success) {
    localJob.status = "failed";

    localJob.error =
      response.error ??
      "Unable to submit video processing job.";

    localJob.completedAt =
      new Date().toISOString();

    return {
      ...localJob,
    };
  }

  localJob.status = "queued";

  if (response.data?.jobId) {
    localJob.id =
      response.data.jobId;
  }

  return {
    ...localJob,
  };
}

export function updateVideoJob(
  jobId: string,
  update: Partial<
    VideoProcessingJob
  >
): VideoProcessingJob | null {
  const job =
    jobs.find(
      (item) =>
        item.id === jobId
    );

  if (!job) {
    return null;
  }

  Object.assign(job, update);

  return {
    ...job,
  };
}

export function getVideoJob(
  jobId: string
): VideoProcessingJob | null {
  const job =
    jobs.find(
      (item) =>
        item.id === jobId
    );

  return job
    ? { ...job }
    : null;
}

export function getVideoJobs():
  VideoProcessingJob[] {
  return jobs.map(
    (job) => ({
      ...job,
    })
  );
}

export function markVideoJobProcessing(
  jobId: string
): VideoProcessingJob | null {
  return updateVideoJob(
    jobId,
    {
      status: "processing",

      startedAt:
        new Date().toISOString(),
    }
  );
}

export function completeVideoJob(
  jobId: string,
  outputReference: string
): VideoProcessingJob | null {
  return updateVideoJob(
    jobId,
    {
      status: "completed",

      outputReference,

      completedAt:
        new Date().toISOString(),
    }
  );
}

export function failVideoJob(
  jobId: string,
  error: string
): VideoProcessingJob | null {
  return updateVideoJob(
    jobId,
    {
      status: "failed",

      error,

      completedAt:
        new Date().toISOString(),
    }
  );
}

export function cancelVideoJob(
  jobId: string
): VideoProcessingJob | null {
  return updateVideoJob(
    jobId,
    {
      status: "cancelled",

      completedAt:
        new Date().toISOString(),
    }
  );
}

export function clearVideoJobs(): void {
  jobs.length = 0;
}
