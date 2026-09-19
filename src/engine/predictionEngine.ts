import {
  extractFeatures,
  FeatureVector,
} from "./features";

import {
  createPoseSequence,
  limitPoseSequence,
  PoseSequence,
} from "./poseSequence";

import {
  getAllTechniques,
  TechniqueDefinition,
} from "./techniques";

import {
  createPrediction,
  createPredictionResult,
  PredictionResult,
} from "./prediction";

import {
  getActiveModel,
} from "./modelRegistry";

import {
  Landmark,
} from "../types";

export interface PredictionEngineState {
  frames: FeatureVector[];

  sequence: PoseSequence | null;

  latestPrediction:
    | PredictionResult
    | null;

  frameCount: number;
}

export function createPredictionEngine():
  PredictionEngineState {
  return {
    frames: [],

    sequence: null,

    latestPrediction: null,

    frameCount: 0,
  };
}

export function processPoseFrame(
  state: PredictionEngineState,
  landmarks: Landmark[],
  timestampMs: number
): PredictionEngineState {
  const features =
    extractFeatures(
      landmarks,
      timestampMs
    );

  if (
    features.values.length === 0
  ) {
    return {
      ...state,
    };
  }

  const frames = [
    ...state.frames,
    features,
  ];

  const sequence =
    createPoseSequence(frames);

  const limitedSequence =
    limitPoseSequence(
      sequence,
      60
    );

  return {
    ...state,

    frames,

    sequence:
      limitedSequence,

    frameCount:
      frames.length,
  };
}

export function predictFromSequence(
  sequence: PoseSequence
): PredictionResult {
  const start =
    performance.now();

  const model =
    getActiveModel();

  const techniques =
    getAllTechniques();

  /*
   * This is currently a prediction
   * interface/fallback layer.
   *
   * The actual trained ML model will
   * eventually replace this logic.
   */

  const latestFrame =
    sequence.frames[
      sequence.frames.length - 1
    ];

  if (!latestFrame) {
    return createPredictionResult(
      [],
      model.version,
      Date.now(),
      performance.now() -
        start
    );
  }

  const predictions =
    techniques.map(
      (
        technique: TechniqueDefinition
      ) => {
        const evidence =
          technique.requiredFeatures.filter(
            (featureName) =>
              latestFrame.names.includes(
                featureName
              )
          );

        const availability =
          technique.requiredFeatures
            .length > 0
            ? evidence.length /
              technique
                .requiredFeatures
                .length
            : 0;

        return createPrediction(
          technique,

          Math.min(
            0.95,
            availability * 0.75
          ),

          latestFrame.timestampMs,

          model.version,

          evidence
        );
      }
    );

  return createPredictionResult(
    predictions,
    model.version,
    latestFrame.timestampMs,
    performance.now() -
      start
  );
}

export function runPrediction(
  state: PredictionEngineState
): PredictionResult | null {
  if (!state.sequence) {
    return null;
  }

  const result =
    predictFromSequence(
      state.sequence
    );

  return result;
}

export function resetPredictionEngine():
  PredictionEngineState {
  return createPredictionEngine();
}
