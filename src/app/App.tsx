import { useEffect, useRef, useState } from "react";
import { Activity, Brain, Camera, ShieldCheck, Upload } from "lucide-react";

import { MediaPipeTracker } from "../tracking/MediaPipeTracker";
import { TrackerFusion } from "../tracking/TrackerFusion";
import { CoachEngine } from "../intelligence/coachEngine";
import { FighterDatabase } from "../fighters/fighterDatabase";
import { HealthMonitor } from "../engineering/health";
import { detectPunch } from "../boxing/punchEngine";
import { calculateMetrics } from "../biomechanics/metrics";

export default function App() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const trackerRef = useRef<MediaPipeTracker | null>(null);
  const fusionRef = useRef(new TrackerFusion());
  const coachRef = useRef(new CoachEngine());
  const healthRef = useRef(new HealthMonitor());

  const [cameraActive, setCameraActive] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [punches, setPunches] = useState(0);
  const [coachAdvice, setCoachAdvice] = useState(
    "Awaiting movement telemetry..."
  );

  const fighters = FighterDatabase.getFeaturedFighters();

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      try {
        const tracker = new MediaPipeTracker();
        await tracker.init();

        if (cancelled) {
          tracker.dispose();
          return;
        }

        trackerRef.current = tracker;
        setModelReady(true);
        healthRef.current.record("MediaPipe", "healthy");
      } catch (error) {
        console.error(error);

        if (!cancelled) {
          setModelError(
            "AI pose tracking could not initialize. Camera can still be opened."
          );
          healthRef.current.record("MediaPipe", "error");
        }
      }
    }

    initialize();

    return () => {
      cancelled = true;

      trackerRef.current?.dispose();
      trackerRef.current = null;

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  async function startCamera() {
    try {
      setModelError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.src = "";
        videoRef.current.controls = false;
        videoRef.current.srcObject = stream;

        await videoRef.current.play();
      }

      setCameraActive(true);
    } catch (error) {
      console.error("Camera error:", error);

      setModelError(
        "Camera access was not available. Check your browser permission."
      );

      setCameraActive(false);
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
      videoRef.current.removeAttribute("src");
      videoRef.current.controls = false;
      videoRef.current.load();
    }

    setCameraActive(false);
  }

  function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file || !videoRef.current) {
      return;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    const url = URL.createObjectURL(file);

    videoRef.current.srcObject = null;
    videoRef.current.src = url;
    videoRef.current.controls = true;

    videoRef.current.play().catch(() => {
      // Browser may require a user gesture before playback.
    });

    setCameraActive(false);
    setModelError(null);
  }

  function analyzeFrame() {
    const video = videoRef.current;
    const tracker = trackerRef.current;

    if (!video || !tracker || video.readyState < 2) {
      return;
    }

    const timestamp = performance.now();
    const landmarks = tracker.detect(video, timestamp);

    if (!landmarks) {
      return;
    }

    const fused = fusionRef.current.update({
      source: "mediapipe",
      landmarks,
      timestamp,
      confidence: 0.9,
    });

    if (!fused) {
      return;
    }

    const metrics = calculateMetrics(fused);
    const punch = detectPunch(fused, metrics);

    if (punch.detected) {
      setPunches((value) => value + 1);
      setCoachAdvice(
        coachRef.current.analyzePunch(punch, metrics)
      );
    }
  }

  useEffect(() => {
    let frame = 0;

    function loop() {
      analyzeFrame();
      frame = requestAnimationFrame(loop);
    }

    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <main className="app">
      <header className="topbar">
        <div>
          <div className="eyebrow">
            AI BOXING BIOMECHANICS LAB
          </div>

          <h1>
            BRAWLER <span>LABS</span>
          </h1>
        </div>

        <div className="system-pill">
          <span className="pulse" />
          {modelReady
            ? "TRACKING SYSTEM READY"
            : "INITIALIZING TRACKING"}
        </div>
      </header>

      <section className="grid">
        <article className="panel hero">
          <div className="video-shell">
            <video
              ref={videoRef}
              playsInline
              muted
              className="video"
            />

            {!cameraActive && !videoRef.current?.src && (
              <div className="video-empty">
                <Camera size={34} />

                <strong>
                  Training camera offline
                </strong>

                <span>
                  Start your camera or upload a video.
                </span>
              </div>
            )}
          </div>

          <div className="controls">
            <button
              className="primary"
              onClick={startCamera}
            >
              <Camera size={17} />
              Start Camera
            </button>

            <button
              className="secondary"
              onClick={stopCamera}
            >
              Stop Camera
            </button>

            <label className="secondary">
              <Upload size={17} />
              Upload Video

              <input
                type="file"
                accept="video/*"
                hidden
                onChange={handleUpload}
              />
            </label>

            <span className="live-status">
              {cameraActive ? "LIVE" : "STANDBY"}
            </span>
          </div>
        </article>

        <article className="panel">
          <div className="section-title">
            <Activity size={15} />
            Live Punches
          </div>

          <div className="big-number">
            {punches}
            <span>detected</span>
          </div>

          <div className="bar">
            <i
              style={{
                width: `${Math.min(
                  punches * 4,
                  100
                )}%`,
              }}
            />
          </div>

          <p>
            Punch detection combines pose landmarks,
            motion metrics, and temporal movement
            analysis.
          </p>
        </article>

        <article className="panel wide coach">
          <div className="section-title">
            <Brain size={15} />
            AI Coach Council
          </div>

          <h2>Live Technique Analysis</h2>

          <p>{coachAdvice}</p>

          <div className="agent-row">
            <span>Technique Coach</span>
            <span>Biomechanics Analyst</span>
            <span>Tactical Analyst</span>
            <span>Style Analyst</span>
            <span>Critical Coach</span>
          </div>
        </article>

        <article className="panel">
          <div className="section-title">
            <ShieldCheck size={15} />
            System Health
          </div>

          <div className="health">
            <Activity size={16} />

            <div>
              <strong>Pose Tracking</strong>

              <small>
                {modelReady
                  ? "Operational"
                  : "Initializing"}
              </small>
            </div>
          </div>

          <div className="health">
            <Activity size={16} />

            <div>
              <strong>Tracker Fusion</strong>
              <small>Ready</small>
            </div>
          </div>

          <div className="health">
            <Activity size={16} />

            <div>
              <strong>AI Coach</strong>
              <small>Ready</small>
            </div>
          </div>

          {modelError && (
            <p>{modelError}</p>
          )}
        </article>

        <article className="panel wide">
          <div className="section-title">
            Fighter Reference Database
          </div>

          <p>
            Reference profiles are separated from
            measured user data and are used for style
            comparison rather than unsupported ratings.
          </p>

          <div className="fighters">
            {fighters.map((fighter) => (
              <div
                className="fighter"
                key={fighter.name}
              >
                <b>{fighter.name}</b>

                <small>
                  {fighter.stance}
                </small>

                <em>
                  {fighter.style}
                </em>
              </div>
            ))}
          </div>
        </article>
      </section>

      <footer>
        Brawler Labs 2.0 · Real-time biomechanics
        research environment
      </footer>
    </main>
  );
}
