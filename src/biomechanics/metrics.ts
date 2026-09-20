import {
  FusedTrackingFrame,
  Landmark,
} from "../tracking/TrackerTypes";

export interface BiomechanicsMetrics {
  stanceWidth: number;
  shoulderWidth: number;
  hipWidth: number;
  torsoRotation: number;
  centerOfMassX: number;
  centerOfMassY: number;
  balanceScore: number;
  postureScore: number;
}

function distance(a: Landmark, b: Landmark): number {
  return Math.sqrt(
    Math.pow(a.x - b.x, 2) +
      Math.pow(a.y - b.y, 2)
  );
}

function midpoint(
  a: Landmark,
  b: Landmark
): Landmark {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z:
      a.z !== undefined && b.z !== undefined
        ? (a.z + b.z) / 2
        : undefined,
  };
}

function clamp(
  value: number,
  min = 0,
  max = 1
): number {
  return Math.max(min, Math.min(max, value));
}

export function calculateMetrics(
  frame: FusedTrackingFrame
): BiomechanicsMetrics {
  const points = frame.landmarks;

  /*
   * MediaPipe's canonical landmark indices:
   *
   * 11 = left shoulder
   * 12 = right shoulder
   * 23 = left hip
   * 24 = right hip
   * 27 = left ankle
   * 28 = right ankle
   *
   * MoveNet also uses a compatible core set for
   * these major body regions, although its indices
   * are not identical. Tracker normalization will
   * expand this mapping later.
   */

  const leftShoulder = points[11];
  const rightShoulder = points[12];
  const leftHip = points[23];
  const rightHip = points[24];
  const leftAnkle = points[27];
  const rightAnkle = points[28];

  if (
    !leftShoulder ||
    !rightShoulder ||
    !leftHip ||
    !rightHip
  ) {
    return {
      stanceWidth: 0,
      shoulderWidth: 0,
      hipWidth: 0,
      torsoRotation: 0,
      centerOfMassX: 0.5,
      centerOfMassY: 0.5,
      balanceScore: 0,
      postureScore: 0,
    };
  }

  const shoulderWidth = distance(
    leftShoulder,
    rightShoulder
  );

  const hipWidth = distance(
    leftHip,
    rightHip
  );

  const stanceWidth =
    leftAnkle && rightAnkle
      ? distance(leftAnkle, rightAnkle)
      : 0;

  const shoulderCenter = midpoint(
    leftShoulder,
    rightShoulder
  );

  const hipCenter = midpoint(
    leftHip,
    rightHip
  );

  const centerOfMassX =
    (shoulderCenter.x + hipCenter.x) / 2;

  const centerOfMassY =
    (shoulderCenter.y + hipCenter.y) / 2;

  const shoulderAngle =
    Math.atan2(
      rightShoulder.y - leftShoulder.y,
      rightShoulder.x - leftShoulder.x
    );

  const hipAngle =
    Math.atan2(
      rightHip.y - leftHip.y,
      rightHip.x - leftHip.x
    );

  const torsoRotation =
    ((shoulderAngle - hipAngle) * 180) /
    Math.PI;

  /*
   * These are normalized geometric indicators,
   * not medical or force-plate measurements.
   */

  const stanceRatio =
    hipWidth > 0
      ? stanceWidth / hipWidth
      : 0;

  const stanceScore =
    stanceRatio >= 0.8 &&
    stanceRatio <= 2.2
      ? 1
      : clamp(
          1 -
            Math.abs(
              stanceRatio - 1.5
            ) /
              1.5
        );

  const rotationScore = clamp(
    1 -
      Math.abs(torsoRotation) / 45
  );

  const centerScore = clamp(
    1 -
      Math.abs(
        centerOfMassX - 0.5
      ) *
        2
  );

  const balanceScore =
    stanceScore * 0.45 +
    centerScore * 0.35 +
    rotationScore * 0.2;

  const postureScore = clamp(
    0.5 * centerScore +
      0.5 * rotationScore
  );

  return {
    stanceWidth,
    shoulderWidth,
    hipWidth,
    torsoRotation,
    centerOfMassX,
    centerOfMassY,
    balanceScore,
    postureScore,
  };
}
