import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import {
  Camera,
  Square,
  RotateCcw,
  Gauge,
  Footprints,
  Shield,
  Activity,
  Upload,
  Video,
} from "lucide-react";

import { MediaPipeTracker } from "./tracking/MediaPipeTracker";
import { analyzePose, detectPunch } from "./engine/analyzer";
import { coach, compareStyle, STYLES } from "./engine/coach";
import { Landmark, Metrics, Punch } from "./types";

import MetricCard from "./components/MetricCard";
import CoachPanel from "./components/CoachPanel";
import SkeletonOverlay from "./components/SkeletonOverlay";

const empty: Metrics = {
  form: 0,
  footwork: 0,
  guard: 0,
  balance: 0,
  speed: 0,
  punches: 0,
  peakSpeed: 0,
  stanceWidth: 0,
  headDrift: 0,
  recoveryMs: 0,
  footDrift: 0,
};

export default function App() {
  const video = useRef<HTMLVideoElement>(null);
  const raf = useRef<number>(0);
  const tracker = useRef(new MediaPipeTracker());

  const previous = useRef<Landmark[] | null>(null);

  const lastVideoTime = useRef<number>(-1);
  const previousVideoTime = useRef<number | null>(null);
  const lastInferenceTimestamp = useRef<number>(0);

  const modeRef = useRef<"idle" | "camera" | "upload">("idle");
  const runningRef = useRef(false);
  const readyRef = useRef(false);

  const [mode, setMode] = useState<"idle" | "camera" | "upload">("idle");
  const [running, setRunning] = useState(false);
  const [ready, setReady] = useState(false);

  const [landmarks, setLandmarks] = useState<Landmark[] | null>(null);
  const [metrics, setMetrics] = useState<Metrics>(empty);

  const [styleKey, setStyleKey] = useState("bivol");
  const [lastPunch, setLastPunch] = useState<Punch>();
  const [error, setError] = useState("");
  const [videoName, setVideoName] = useState("");

  const style = STYLES[styleKey];

  const message = useMemo(
    () => coach(metrics, style, lastPunch),
    [metrics, style, lastPunch]
  );

  const delta = useMemo(
    () => compareStyle(metrics, style),
    [metrics, style]
  );

  useEffect(() => {
    return () => {
      if (raf.current) {
        cancelAnimationFrame(raf.current);
      }

      const stream = video.current?.srcObject as MediaStream | null;

      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  function resetFrameTracking() {
    lastVideoTime.current = -1;
    previousVideoTime.current = null;
    lastInferenceTimestamp.current = 0;
    previous.current = null;
  }

  function resetAnalysisOnly() {
    setMetrics(empty);
    setLastPunch(undefined);
    setLandmarks(null);
    setError("");
    resetFrameTracking();
  }

  async function initializeTracker() {
    if (readyRef.current) {
      return;
    }

    await tracker.current.init();

    readyRef.current = true;
    setReady(true);
  }

  async function startCamera() {
    try {
      setError("");

      if (!video.current) {
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 1280,
          height: 720,
          facingMode: "user",
        },
        audio: false,
      });

      video.current.srcObject = stream;
      video.current.controls = false;
      video.current.muted = true;
      video.current.playsInline = true;

      modeRef.current = "camera";
      runningRef.current = true;

      setMode("camera");
      setRunning(true);
      setVideoName("");

      resetAnalysisOnly();

      await initializeTracker();

      await video.current.play();

      resetFrameTracking();

      loop();
    } catch (e) {
      console.error(e);

      runningRef.current = false;
      setRunning(false);

      setError(
        "Camera or model initialization failed. Use HTTPS/localhost and allow camera access."
      );
    }
  }

  function stopCamera() {
    runningRef.current = false;
    setRunning(false);

    if (raf.current) {
      cancelAnimationFrame(raf.current);
      raf.current = 0;
    }

    const stream = video.current?.srcObject as MediaStream | null;

    stream?.getTracks().forEach((track) => track.stop());

    if (video.current) {
      video.current.srcObject = null;
    }

    setMode("idle");
    modeRef.current = "idle";
  }

  async function handleVideoUpload(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file || !video.current) {
      return;
    }

    try {
      setError("");

      if (raf.current) {
        cancelAnimationFrame(raf.current);
        raf.current = 0;
      }

      const oldStream = video.current.srcObject as MediaStream | null;

      oldStream?.getTracks().forEach((track) => track.stop());

      video.current.srcObject = null;

      const url = URL.createObjectURL(file);

      video.current.src = url;
      video.current.controls = true;
      video.current.muted = true;
      video.current.playsInline = true;

      modeRef.current = "upload";
      runningRef.current = false;

      setMode("upload");
      setRunning(false);
      setVideoName(file.name);

      resetAnalysisOnly();

      video.current.load();

      await new Promise<void>((resolve, reject) => {
        const currentVideo = video.current;

        if (!currentVideo) {
          reject(new Error("Video element unavailable."));
          return;
        }

        const handleLoaded = () => {
          cleanup();
          resolve();
        };

        const handleError = () => {
          cleanup();
          reject(
            new Error(
              "The browser could not decode this video format."
            )
          );
        };

        const cleanup = () => {
          currentVideo.removeEventListener(
            "loadeddata",
            handleLoaded
          );
          currentVideo.removeEventListener(
            "error",
            handleError
          );
        };

        currentVideo.addEventListener(
          "loadeddata",
          handleLoaded
        );

        currentVideo.addEventListener(
          "error",
          handleError
        );
      });

      await initializeTracker();

      resetFrameTracking();

      await video.current.play();

      runningRef.current = true;
      setRunning(true);

      loop();
    } catch (e) {
      console.error("Video analysis error:", e);

      runningRef.current = false;
      setRunning(false);

      const message =
        e instanceof Error ? e.message : String(e);

      setError(
        `The video loaded, but pose analysis could not start. ${message}`
      );
    }
  }

  function loop() {
    if (
      !video.current ||
      !tracker.current.pose ||
      !runningRef.current
    ) {
      return;
    }

    const currentVideo = video.current;

    if (
      modeRef.current === "upload" &&
      currentVideo.ended
    ) {
      runningRef.current = false;
      setRunning(false);

      if (raf.current) {
        cancelAnimationFrame(raf.current);
        raf.current = 0;
      }

      return;
    }

    if (
      currentVideo.readyState >= 2 &&
      !currentVideo.seeking
    ) {
      const videoTime = currentVideo.currentTime;

      if (videoTime !== lastVideoTime.current) {
        const now = Math.max(
          performance.now(),
          lastInferenceTimestamp.current + 1
        );

        let dt = 1 / 30;

        if (previousVideoTime.current !== null) {
          const difference =
            videoTime - previousVideoTime.current;

          if (difference > 0) {
            dt = difference;
          }
        }

        try {
          const lm = tracker.current.detect(
            currentVideo,
            now
          );

          if (lm) {
            const m = analyzePose(lm);

            if (m) {
              const punch = detectPunch(
                previous.current,
                lm,
                dt,
                now
              );

              if (punch) {
                setLastPunch(punch);

                setMetrics((prev) => ({
                  ...m,
                  punches: prev.punches + 1,
                  peakSpeed: Math.max(
                    prev.peakSpeed,
                    punch.speed
                  ),
                  speed: punch.speed,
                }));
              } else {
                setMetrics((prev) => ({
                  ...m,
                  speed: prev.speed * 0.92,
                  peakSpeed: prev.peakSpeed,
                  punches: prev.punches,
                }));
              }
            }

            previous.current = lm;
            setLandmarks(lm);
          }

          lastVideoTime.current = videoTime;
          previousVideoTime.current = videoTime;
          lastInferenceTimestamp.current = now;
        } catch (e) {
          console.error("Pose detection error:", e);

          runningRef.current = false;
          setRunning(false);

          const message =
            e instanceof Error ? e.message : String(e);

          setError(`Pose analysis stopped. ${message}`);

          return;
        }
      }
    }

    raf.current = requestAnimationFrame(loop);
  }

  function reset() {
    resetAnalysisOnly();
  }

  function handleVideoPlay() {
    if (
      modeRef.current === "upload" &&
      !runningRef.current
    ) {
      runningRef.current = true;
      setRunning(true);

      resetFrameTracking();
      loop();
    }
  }

  function handleVideoPause() {
    if (modeRef.current === "upload") {
      runningRef.current = false;
      setRunning(false);

      if (raf.current) {
        cancelAnimationFrame(raf.current);
        raf.current = 0;
      }
    }
  }

  function handleVideoSeeking() {
    if (modeRef.current === "upload") {
      lastVideoTime.current = -1;
      previousVideoTime.current = null;
      previous.current = null;
    }
  }

  function handleVideoEnded() {
    runningRef.current = false;
    setRunning(false);

    if (raf.current) {
      cancelAnimationFrame(raf.current);
      raf.current = 0;
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-area">
          <img
            src="/boxing-style-lab/logo.png"
            alt="Bivol Boxing Lab"
            className="app-logo"
          />

          <div>
            <h1>Bivol Boxing Lab</h1>
            <p>REAL-TIME BIOMECHANICS COACH</p>
          </div>
        </div>

        <div className="status">
          <span
            className={`status-dot ${
              ready ? "online" : ""
            }`}
          />
          {ready ? "MODEL READY" : "MODEL OFFLINE"}
        </div>
      </header>

      <section className="control-panel">
        <div className="mode-buttons">
          <button
            className="primary-button"
            onClick={startCamera}
            disabled={running && mode === "camera"}
          >
            <Camera size={18} />
            Live Camera
          </button>

          <label className="secondary-button upload-button">
            <Upload size={18} />
            Upload Video

            <input
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
              hidden
            />
          </label>

          {mode === "camera" && running && (
            <button
              className="danger-button"
              onClick={stopCamera}
            >
              <Square size={18} />
              Stop
            </button>
          )}

          <button
            className="secondary-button"
            onClick={reset}
          >
            <RotateCcw size={18} />
            Reset
          </button>
        </div>

        {videoName && (
          <div className="video-name">
            <Video size={16} />
            {videoName}
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
      </section>

      <section className="video-section">
        <div className="video-card">
          <video
            ref={video}
            className="analysis-video"
            playsInline
            muted
            onPlay={handleVideoPlay}
            onPause={handleVideoPause}
            onSeeking={handleVideoSeeking}
            onEnded={handleVideoEnded}
          />

          {landmarks && (
            <SkeletonOverlay landmarks={landmarks} />
          )}

          {!video.current?.src && (
            <div className="video-placeholder">
              <Activity size={48} />
              <h2>Ready to Analyze</h2>
              <p>
                Start your camera or upload a boxing video.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="style-panel">
        <div className="section-title">
          <h2>Style Target</h2>
          <span>Compare your mechanics</span>
        </div>

        <div className="style-buttons">
          {Object.entries(STYLES).map(
            ([key, targetStyle]) => (
              <button
                key={key}
                className={
                  styleKey === key
                    ? "style-button active"
                    : "style-button"
                }
                onClick={() => setStyleKey(key)}
              >
                {targetStyle.name}
              </button>
            )
          )}
        </div>
      </section>

      <section className="metrics-grid">
        <MetricCard
          title="Form"
          value={metrics.form}
          icon={<Gauge size={20} />}
        />

        <MetricCard
          title="Footwork"
          value={metrics.footwork}
          icon={<Footprints size={20} />}
        />

        <MetricCard
          title="Guard"
          value={metrics.guard}
          icon={<Shield size={20} />}
        />

        <MetricCard
          title="Balance"
          value={metrics.balance}
          icon={<Activity size={20} />}
        />

        <MetricCard
          title="Punch Speed"
          value={metrics.speed}
          suffix=" px/s"
          icon={<Gauge size={20} />}
        />

        <MetricCard
          title="Punches"
          value={metrics.punches}
          icon={<Activity size={20} />}
        />
      </section>

      <section className="analysis-grid">
        <CoachPanel
          message={message}
          delta={delta}
          style={style}
        />

        <div className="stats-card">
          <div className="section-title">
            <h2>Biomechanics</h2>
            <span>Live measurements</span>
          </div>

          <div className="stats-list">
            <div>
              <span>Peak Speed</span>
              <strong>
                {metrics.peakSpeed.toFixed(1)}
              </strong>
            </div>

            <div>
              <span>Stance Width</span>
              <strong>
                {metrics.stanceWidth.toFixed(3)}
              </strong>
            </div>

            <div>
              <span>Head Drift</span>
              <strong>
                {metrics.headDrift.toFixed(3)}
              </strong>
            </div>

            <div>
              <span>Recovery</span>
              <strong>
                {metrics.recoveryMs.toFixed(0)} ms
              </strong>
            </div>

            <div>
              <span>Foot Drift</span>
              <strong>
                {metrics.footDrift.toFixed(3)}
              </strong>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
