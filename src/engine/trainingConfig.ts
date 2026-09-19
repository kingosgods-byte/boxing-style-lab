export interface TrainingConfig {
  modelFamily:
    | "technique_classifier"
    | "biomechanics_regressor"
    | "sequence_model";

  inputType:
    | "pose_sequence"
    | "metrics"
    | "pose_and_metrics";

  sequenceLength: number;

  featureCount: number;

  learningRate: number;

  batchSize: number;

  epochs: number;

  validationSplit: number;

  testSplit: number;

  randomSeed: number;

  augmentation: {
    enabled: boolean;

    horizontalFlip: boolean;

    timeWarp: boolean;

    noise: boolean;
  };
}

export const DEFAULT_TRAINING_CONFIG:
  TrainingConfig = {
    modelFamily:
      "technique_classifier",

    inputType:
      "pose_and_metrics",

    sequenceLength:
      60,

    featureCount:
      0,

    learningRate:
      0.001,

    batchSize:
      32,

    epochs:
      50,

    validationSplit:
      0.15,

    testSplit:
      0.15,

    randomSeed:
      42,

    augmentation: {
      enabled: true,

      horizontalFlip:
        true,

      timeWarp:
        true,

      noise:
        true,
    },
  };

export function validateTrainingConfig(
  config: TrainingConfig
): {
  valid: boolean;

  problems: string[];
} {
  const problems: string[] = [];

  if (
    config.sequenceLength <= 0
  ) {
    problems.push(
      "Sequence length must be greater than zero."
    );
  }

  if (
    config.batchSize <= 0
  ) {
    problems.push(
      "Batch size must be greater than zero."
    );
  }

  if (
    config.epochs <= 0
  ) {
    problems.push(
      "Epoch count must be greater than zero."
    );
  }

  if (
    config.learningRate <= 0
  ) {
    problems.push(
      "Learning rate must be greater than zero."
    );
  }

  if (
    config.validationSplit < 0 ||
    config.validationSplit >= 1
  ) {
    problems.push(
      "Validation split must be between 0 and 1."
    );
  }

  if (
    config.testSplit < 0 ||
    config.testSplit >= 1
  ) {
    problems.push(
      "Test split must be between 0 and 1."
    );
  }

  if (
    config.validationSplit +
      config.testSplit >=
    1
  ) {
    problems.push(
      "Validation and test splits must leave training data available."
    );
  }

  if (
    config.randomSeed < 0
  ) {
    problems.push(
      "Random seed cannot be negative."
    );
  }

  return {
    valid:
      problems.length === 0,

    problems,
  };
}

export function cloneTrainingConfig(
  config: TrainingConfig
): TrainingConfig {
  return {
    ...config,

    augmentation: {
      ...config.augmentation,
    },
  };
}
