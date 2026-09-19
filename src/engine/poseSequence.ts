import {
  FeatureVector,
} from "./features";

export interface PoseSequence {
  id: string;

  createdAt: string;

  frameCount: number;

  durationMs: number;

  featureNames: string[];

  frames: FeatureVector[];
}

const DEFAULT_MAX_FRAMES = 60;

function createId(): string {
  return (
    `sequence_${Date.now()}_` +
    Math.random()
      .toString(36)
      .slice(2, 10)
  );
}

export function createPoseSequence(
  frames: FeatureVector[]
): PoseSequence {
  if (frames.length === 0) {
    throw new Error(
      "Cannot create a pose sequence without frames."
    );
  }

  const sortedFrames =
    [...frames].sort(
      (a, b) =>
        a.timestampMs -
        b.timestampMs
    );

  const first =
    sortedFrames[0];

  const last =
    sortedFrames[
      sortedFrames.length - 1
    ];

  return {
    id: createId(),

    createdAt:
      new Date().toISOString(),

    frameCount:
      sortedFrames.length,

    durationMs:
      Math.max(
        0,
        last.timestampMs -
          first.timestampMs
      ),

    featureNames:
      [...first.names],

    frames:
      sortedFrames.map(
        (frame) => ({
          values: [
            ...frame.values,
          ],

          names: [
            ...frame.names,
          ],

          timestampMs:
            frame.timestampMs,
        })
      ),
  };
}

export function limitPoseSequence(
  sequence: PoseSequence,
  maxFrames = DEFAULT_MAX_FRAMES
): PoseSequence {
  if (
    sequence.frames.length <=
    maxFrames
  ) {
    return {
      ...sequence,

      frames:
        sequence.frames.map(
          (frame) => ({
            ...frame,

            values: [
              ...frame.values,
            ],

            names: [
              ...frame.names,
            ],
          })
        ),
    };
  }

  const step =
    (sequence.frames.length - 1) /
    (maxFrames - 1);

  const selectedFrames:
    FeatureVector[] = [];

  for (
    let i = 0;
    i < maxFrames;
    i++
  ) {
    const index =
      Math.round(i * step);

    const frame =
      sequence.frames[index];

    if (frame) {
      selectedFrames.push({
        ...frame,

        values: [
          ...frame.values,
        ],

        names: [
          ...frame.names,
        ],
      });
    }
  }

  const first =
    selectedFrames[0];

  const last =
    selectedFrames[
      selectedFrames.length - 1
    ];

  return {
    ...sequence,

    frameCount:
      selectedFrames.length,

    durationMs:
      first && last
        ? Math.max(
            0,
            last.timestampMs -
              first.timestampMs
          )
        : 0,

    frames:
      selectedFrames,
  };
}

export function normalizePoseSequence(
  sequence: PoseSequence
): PoseSequence {
  if (
    sequence.frames.length === 0
  ) {
    return {
      ...sequence,
    };
  }

  const featureCount =
    sequence.frames[0]
      ?.values.length ?? 0;

  if (featureCount === 0) {
    return {
      ...sequence,
    };
  }

  const means =
    new Array<number>(
      featureCount
    ).fill(0);

  const standardDeviations =
    new Array<number>(
      featureCount
    ).fill(0);

  for (const frame of sequence.frames) {
    for (
      let i = 0;
      i < featureCount;
      i++
    ) {
      means[i] +=
        frame.values[i] ?? 0;
    }
  }

  for (
    let i = 0;
    i < featureCount;
    i++
  ) {
    means[i] /=
      sequence.frames.length;
  }

  for (const frame of sequence.frames) {
    for (
      let i = 0;
      i < featureCount;
      i++
    ) {
      const difference =
        (frame.values[i] ?? 0) -
        (means[i] ?? 0);

      standardDeviations[i] +=
        difference *
        difference;
    }
  }

  for (
    let i = 0;
    i < featureCount;
    i++
  ) {
    standardDeviations[i] =
      Math.sqrt(
        standardDeviations[i] /
          sequence.frames.length
      );
  }

  const normalizedFrames =
    sequence.frames.map(
      (frame) => ({
        ...frame,

        values:
          frame.values.map(
            (value, index) => {
              const mean =
                means[index] ?? 0;

              const deviation =
                standardDeviations[
                  index
                ] ?? 0;

              if (
                deviation === 0
              ) {
                return 0;
              }

              return (
                (value - mean) /
                deviation
              );
            }
          ),

        names: [
          ...frame.names,
        ],
      })
    );

  return {
    ...sequence,

    frames:
      normalizedFrames,
  };
}

export function flattenPoseSequence(
  sequence: PoseSequence
): number[] {
  return sequence.frames.flatMap(
    (frame) => [
      ...frame.values,
    ]
  );
}

export function getSequenceDuration(
  sequence: PoseSequence
): number {
  return sequence.durationMs;
}

export function getSequenceFeatureCount(
  sequence: PoseSequence
): number {
  return (
    sequence.frames[0]
      ?.values.length ?? 0
  );
}
