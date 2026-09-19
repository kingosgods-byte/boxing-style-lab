import {
  getDatasetStatistics,
} from "./dataset";

export interface DatasetVersion {
  id: string;

  version: string;

  createdAt: string;

  description: string;

  trainingExampleCount: number;

  learningRecordCount: number;

  feedbackCount: number;

  status:
    | "draft"
    | "ready"
    | "training"
    | "validated"
    | "archived";
}

const datasetVersions:
  DatasetVersion[] = [];

function createId(): string {
  return (
    `dataset_${Date.now()}_` +
    Math.random()
      .toString(36)
      .slice(2, 10)
  );
}

function getNextVersion():
  string {
  if (datasetVersions.length === 0) {
    return "1.0.0";
  }

  const versions =
    datasetVersions.map(
      (dataset) =>
        dataset.version
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

export function createDatasetVersion(
  description: string
): DatasetVersion {
  const statistics =
    getDatasetStatistics();

  const dataset: DatasetVersion = {
    id: createId(),

    version:
      getNextVersion(),

    createdAt:
      new Date().toISOString(),

    description,

    trainingExampleCount:
      statistics.trainingExamples,

    learningRecordCount:
      statistics.learningRecords,

    feedbackCount:
      statistics.feedback,

    status: "draft",
  };

  datasetVersions.push(
    dataset
  );

  return {
    ...dataset,
  };
}

export function getDatasetVersion(
  id: string
): DatasetVersion | null {
  const dataset =
    datasetVersions.find(
      (item) =>
        item.id === id
    );

  return dataset
    ? { ...dataset }
    : null;
}

export function getAllDatasetVersions():
  DatasetVersion[] {
  return datasetVersions.map(
    (dataset) => ({
      ...dataset,
    })
  );
}

export function updateDatasetStatus(
  id: string,
  status: DatasetVersion["status"]
): boolean {
  const dataset =
    datasetVersions.find(
      (item) =>
        item.id === id
    );

  if (!dataset) {
    return false;
  }

  dataset.status = status;

  return true;
}

export function getLatestDatasetVersion():
  DatasetVersion | null {
  if (
    datasetVersions.length === 0
  ) {
    return null;
  }

  const dataset =
    datasetVersions[
      datasetVersions.length - 1
    ];

  return {
    ...dataset,
  };
}

export function exportDatasetVersions():
  string {
  return JSON.stringify(
    {
      dataset:
        "Bivol Boxing Lab Dataset Versions",

      exportedAt:
        new Date().toISOString(),

      versions:
        getAllDatasetVersions(),
    },
    null,
    2
  );
}
