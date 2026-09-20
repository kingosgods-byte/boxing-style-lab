import {
  FusedTrackingFrame,
  Landmark,
  TrackerSource,
  TrackingFrame,
} from "./TrackerTypes";

export class TrackerFusion {
  private frames = new Map<TrackerSource, TrackingFrame>();

  update(frame: TrackingFrame): FusedTrackingFrame | null {
    this.frames.set(frame.source, frame);

    if (this.frames.size === 0) {
      return null;
    }

    const frames = Array.from(this.frames.values());

    const primary = frames.reduce((best, current) =>
      current.confidence > best.confidence
        ? current
        : best
    );

    const landmarks = this.fuseLandmarks(frames);

    if (!landmarks.length) {
      return null;
    }

    const confidence = this.calculateConfidence(frames);

    return {
      landmarks,
      timestamp: primary.timestamp,
      confidence,
      sources: frames.map((item) => item.source),
      sourceFrames: frames,
    };
  }

  private fuseLandmarks(
    frames: TrackingFrame[]
  ): Landmark[] {
    /*
     * MediaPipe provides 33 landmarks while MoveNet
     * provides 17. We therefore do not fabricate
     * missing landmarks.
     *
     * For now, the highest-confidence compatible
     * tracker supplies the canonical landmark set.
     */
    const primary = frames.reduce((best, current) =>
      current.confidence > best.confidence
        ? current
        : best
    );

    return primary.landmarks.map((landmark) => ({
      x: landmark.x,
      y: landmark.y,
      z: landmark.z,
      visibility: landmark.visibility,
      score: landmark.score,
    }));
  }

  private calculateConfidence(
    frames: TrackingFrame[]
  ): number {
    if (!frames.length) {
      return 0;
    }

    const total = frames.reduce(
      (sum, frame) => sum + frame.confidence,
      0
    );

    return Math.min(
      1,
      total / frames.length
    );
  }

  clear(): void {
    this.frames.clear();
  }

  getActiveSources(): TrackerSource[] {
    return Array.from(this.frames.keys());
  }
}
