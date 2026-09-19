export interface ModelVersion {
  id: string;

  name: string;

  version: string;

  type:
    | "baseline"
    | "experimental"
    | "production";

  createdAt: string;

  description: string;

  trainingDatasetVersion?: string;

  active: boolean;
}

const models: ModelVersion[] = [
  {
    id: "bivol-baseline-v1",

    name: "Bivol Boxing Baseline",

    version: "1.0.0",

    type: "baseline",

    createdAt:
      new Date().toISOString(),

    description:
      "Initial biomechanics and technique analysis model.",

    active: true,
  },
];

export function getActiveModel():
  ModelVersion {
  const active =
    models.find(
      (model) => model.active
    );

  if (!active) {
    throw new Error(
      "No active boxing model is registered."
    );
  }

  return {
    ...active,
  };
}

export function getModel(
  id: string
): ModelVersion | null {
  const model =
    models.find(
      (item) => item.id === id
    );

  return model
    ? { ...model }
    : null;
}

export function getAllModels():
  ModelVersion[] {
  return models.map(
    (model) => ({
      ...model,
    })
  );
}

export function registerModel(
  model: ModelVersion
): void {
  const existingIndex =
    models.findIndex(
      (item) => item.id === model.id
    );

  if (existingIndex >= 0) {
    models[existingIndex] = {
      ...model,
    };

    return;
  }

  models.push({
    ...model,
  });
}

export function activateModel(
  id: string
): boolean {
  const exists =
    models.some(
      (model) => model.id === id
    );

  if (!exists) {
    return false;
  }

  for (const model of models) {
    model.active =
      model.id === id;
  }

  return true;
}
