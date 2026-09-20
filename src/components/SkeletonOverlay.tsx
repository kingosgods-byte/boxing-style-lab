import { Landmark } from "../types";

const edges = [
  // Shoulders
  [11, 12],

  // Left arm
  [11, 13],
  [13, 15],

  // Right arm
  [12, 14],
  [14, 16],

  // Torso
  [11, 23],
  [12, 24],
  [23, 24],

  // Left leg
  [23, 25],
  [25, 27],
  [27, 29],
  [29, 31],

  // Right leg
  [24, 26],
  [26, 28],
  [28, 30],
].filter(
  ([a, b]) => a < 33 && b < 33
);

type SkeletonOverlayProps = {
  landmarks: Landmark[] | null;
};

export default function SkeletonOverlay({
  landmarks,
}: SkeletonOverlayProps) {
  if (!landmarks || landmarks.length < 33) {
    return null;
  }

  return (
    <svg
      className="skeleton"
      viewBox="0 0 1 1"
      preserveAspectRatio="none"
    >
      {edges.map(([a, b]) => (
        <line
          key={`${a}-${b}`}
          x1={landmarks[a].x}
          y1={landmarks[a].y}
          x2={landmarks[b].x}
          y2={landmarks[b].y}
        />
      ))}

      {landmarks.map((point, index) => (
        <circle
          key={index}
          cx={point.x}
          cy={point.y}
          r="0.012"
        />
      ))}
    </svg>
  );
}
