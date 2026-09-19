import { Landmark } from "../types";

export interface FeatureVector {
  values: number[];

  names: string[];

  timestampMs: number;
}

function distance(
  a: Landmark,
  b: Landmark
): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz =
    (a.z ?? 0) -
    (b.z ?? 0);

  return Math.sqrt(
    dx * dx +
      dy * dy +
      dz * dz
  );
}

function angle(
  a: Landmark,
  b: Landmark,
  c: Landmark
): number {
  const abx = a.x - b.x;
  const aby = a.y - b.y;

  const cbx = c.x - b.x;
  const cby = c.y - b.y;

  const dot =
    abx * cbx +
    aby * cby;

  const magnitude =
    Math.sqrt(
      abx * abx +
        aby * aby
    ) *
    Math.sqrt(
      cbx * cbx +
        cby * cby
    );

  if (magnitude === 0) {
    return 0;
  }

  const cosine =
    Math.max(
      -1,
      Math.min(
        1,
        dot / magnitude
      )
    );

  return (
    Math.acos(cosine) *
    (180 / Math.PI)
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
      ((a.z ?? 0) +
        (b.z ?? 0)) /
      2,
  };
}

function safeLandmark(
  landmarks: Landmark[],
  index: number
): Landmark | null {
  return (
    landmarks[index] ??
    null
  );
}

/*
 * MediaPipe Pose landmark indices:
 *
 * 11 = left shoulder
 * 12 = right shoulder
 * 13 = left elbow
 * 14 = right elbow
 * 15 = left wrist
 * 16 = right wrist
 * 23 = left hip
 * 24 = right hip
 * 25 = left knee
 * 26 = right knee
 * 27 = left ankle
 * 28 = right ankle
 */

export function extractFeatures(
  landmarks: Landmark[],
  timestampMs: number
): FeatureVector {
  const leftShoulder =
    safeLandmark(landmarks, 11);

  const rightShoulder =
    safeLandmark(landmarks, 12);

  const leftElbow =
    safeLandmark(landmarks, 13);

  const rightElbow =
    safeLandmark(landmarks, 14);

  const leftWrist =
    safeLandmark(landmarks, 15);

  const rightWrist =
    safeLandmark(landmarks, 16);

  const leftHip =
    safeLandmark(landmarks, 23);

  const rightHip =
    safeLandmark(landmarks, 24);

  const leftKnee =
    safeLandmark(landmarks, 25);

  const rightKnee =
    safeLandmark(landmarks, 26);

  const leftAnkle =
    safeLandmark(landmarks, 27);

  const rightAnkle =
    safeLandmark(landmarks, 28);

  const required = [
    leftShoulder,
    rightShoulder,
    leftElbow,
    rightElbow,
    leftWrist,
    rightWrist,
    leftHip,
    rightHip,
    leftKnee,
    rightKnee,
    leftAnkle,
    rightAnkle,
  ];

  if (
    required.some(
      (landmark) =>
        landmark === null
    )
  ) {
    return {
      values: [],

      names: [],

      timestampMs,
    };
  }

  const ls = leftShoulder!;
  const rs = rightShoulder!;
  const le = leftElbow!;
  const re = rightElbow!;
  const lw = leftWrist!;
  const rw = rightWrist!;
  const lh = leftHip!;
  const rh = rightHip!;
  const lk = leftKnee!;
  const rk = rightKnee!;
  const la = leftAnkle!;
  const ra = rightAnkle!;

  const shoulderCenter =
    midpoint(ls, rs);

  const hipCenter =
    midpoint(lh, rh);

  const values = [
    distance(ls, rs),

    distance(lh, rh),

    distance(
      shoulderCenter,
      hipCenter
    ),

    distance(lw, ls),

    distance(rw, rs),

    distance(lw, rw),

    angle(ls, le, lw),

    angle(rs, re, rw),

    angle(lh, lk, la),

    angle(rh, rk, ra),

    angle(le, ls, lh),

    angle(re, rs, rh),

    angle(lk, lh, ls),

    angle(rk, rh, rs),

    shoulderCenter.x,

    shoulderCenter.y,

    hipCenter.x,

    hipCenter.y,

    lw.x,

    lw.y,

    rw.x,

    rw.y,
  ];

  const names = [
    "shoulder_width",

    "hip_width",

    "torso_length",

    "left_hand_to_shoulder",

    "right_hand_to_shoulder",

    "hand_distance",

    "left_elbow_angle",

    "right_elbow_angle",

    "left_knee_angle",

    "right_knee_angle",

    "left_shoulder_angle",

    "right_shoulder_angle",

    "left_hip_angle",

    "right_hip_angle",

    "shoulder_center_x",

    "shoulder_center_y",

    "hip_center_x",

    "hip_center_y",

    "left_wrist_x",

    "left_wrist_y",

    "right_wrist_x",

    "right_wrist_y",
  ];

  return {
    values,

    names,

    timestampMs,
  };
}
