import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import {
  Camera,
  Play,
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
  const previousTime = useRef<number | null>(null);

  const videoUrl = useRef<string | null>(null);

  const modeRef = useRef<"idle" | "camera" | "upload">("idle");
  const runningRef = useRef(false);
  const readyRef = useRef(false);

  const [running, setRunning] = useState(false);
  const [ready, setReady] = useState(false);

  const [landmarks, setLandmarks] =
    useState<Landmark[] | null>(null);

  const [metrics, setMetrics] =
    useState<Metrics>(empty);

  const [styleKey, setStyleKey] =
    useState("bivol");

  const [lastPunch, setLastPunch] =
    useState<Punch>();

  const [error, setError] =
    useState("");

  const [mode, setMode] =
    useState<"idle" | "camera" | "upload">("idle");

  const [videoName, setVideoName] =
    useState("");

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

      const stream =
        video.current?.srcObject as MediaStream | null;

      stream?.getTracks().forEach((track) => track.stop());

      if (videoUrl.current) {
        URL.revokeObjectURL(videoUrl.current);
      }
    };
  }, []);

  async function initializeTracker() {
    if (readyRef.current) return;

    await tracker.current.init();

    readyRef.current = true;
    setReady(true);
  }

  function resetAnalysisOnly() {
    setMetrics(empty);
    setLastPunch(undefined);
    setLandmarks(null);

    previous.current = null;
    previousTime.current = null;
  }

  function stopProcessing() {
    runningRef.current = false;

    if (raf.current) {
      cancelAnimationFrame(raf.current);
      raf.current = 0;
    }

    if (video.current) {
      video.current.pause();
    }

    const stream =
      video.current?.srcObject as MediaStream | null;

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  }

  async function startCamera() {
    try {
      setError("");

      stopProcessing();

      if (!video.current) return;

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            width: 1280,
            height: 720,
            facingMode: "user",
          },
          audio: false,
        });

      video.current.srcObject = stream;
      video.current.removeAttribute("controls");
      video.current.removeAttribute("src");

      modeRef.current = "camera";
      runningRef.current = true;

      setMode("camera");
      setRunning(true);

      resetAnalysisOnly();

      await initializeTracker();

      await video.current.play();

      previousTime.current = null;

      loop();
    } catch (e) {
      runningRef.current = false;

      setRunning(false);

      setError(
        "Camera or pose model failed to initialize. Check camera permission and internet access."
      );
    }
  }

  async function handleVideoUpload(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file || !video.current) return;

    try {
      setError("");

      stopProcessing();

      if (videoUrl.current) {
        URL.revokeObjectURL(videoUrl.current);
        videoUrl.current = null;
      }

      const url = URL.createObjectURL(file);

      videoUrl.current = url;

      video.current.srcObject = null;
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

        const onLoaded = () => {
          cleanup();
          resolve();
        };

        const onError = () => {
          cleanup();
          reject(new Error("Video could not be loaded."));
        };

        const cleanup = () => {
          currentVideo.removeEventListener(
            "loadeddata",
            onLoaded
          );

          currentVideo.removeEventListener(
            "error",
            onError
          );
        };

        currentVideo.addEventListener(
          "loadeddata",
          onLoaded
        );

        currentVideo.addEventListener(
          "error",
          onError
        );
      });

      await initializeTracker();

      previous.current = null;
      previousTime.current = null;

      await video.current.play();

      runningRef.current = true;
      setRunning(true);

      loop();
    } catch (e) {
      runningRef.current = false;

      setRunning(false);

      setError(
        "The video loaded, but pose analysis could not start. Check your internet connection and try again."
      );
    }
  }

  function stop() {
    stopProcessing();

    setRunning(false);

    if (modeRef.current === "camera" && video.current) {
      video.current.srcObject = null;
    }
  }

  function reset() {
    stopProcessing();

    modeRef.current = "idle";
    runningRef.current = false;

    setMode("idle");
    setRunning(false);

    resetAnalysisOnly();

    setVideoName("");
    setError("");

    if (video.current) {
      video.current.srcObject = null;
      video.current.removeAttribute("src");
      video.current.removeAttribute("controls");
      video.current.load();
    }

    if (videoUrl.current) {
      URL.revokeObjectURL(videoUrl.current);
      videoUrl.current = null;
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

    if (modeRef.current === "upload" && currentVideo.ended) {
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
      const now =
        modeRef.current === "upload"
          ? currentVideo.currentTime * 1000
          : performance.now();

      if (
        previousTime.current === null ||
        now > previousTime.current
      ) {
        try {
          const lm = tracker.current.detect(
            currentVideo,
            now
          );

          if (lm) {
            const m = analyzePose(lm);

            if (m) {
              const dt =
                previousTime.current === null
                  ? 1 / 30
                  : Math.max(
                      (now - previousTime.current) / 1000,
                      1 / 120
                    );

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

          previousTime.current = now;
        } catch (e) {
          runningRef.current = false;
          setRunning(false);

          setError(
            "Pose analysis stopped. Try refreshing the page and uploading the video again."
          );

          return;
        }
      }
    }

    raf.current = requestAnimationFrame(loop);
  }

  return (
    <div className="app">
      <header>
        <div className="brand-area">
          <img
            src="/boxing-style-lab/logo.png"
            alt="Bivol Boxing Lab"
            className="app-logo"
          />

          <div>
            <div className="brand">
              BIVOL <span>BOXING LAB</span>
            </div>

            <div className="sub">
              REAL-TIME BIOMECHANICS COACH
            </div>
          </div>
        </div>

        <div className={`status ${running ? "live" : ""}`}>
          <i />

          {running
            ? mode === "upload"
              ? "VIDEO ANALYSIS"
              : "LIVE TRACKING"
            : "READY"}
        </div>
      </header>

      <main>
        <section className="camera-card">
          <div className="camera-wrap">
            <video
              ref={video}
              muted
              playsInline
              className="video"

              onPlay={() => {
                if (
                  modeRef.current === "upload" &&
                  !runningRef.current
                ) {
                  runningRef.current = true;
                  setRunning(true);

                  previous.current = null;
                  previousTime.current = null;

                  loop();
                }
              }}

              onPause={() => {
                if (
                  modeRef.current === "upload" &&
                  !video.current?.ended
                ) {
                  runningRef.current = false;
                  setRunning(false);
                }
              }}

              onSeeking={() => {
                previous.current = null;
                previousTime.current = null;
                setLandmarks(null);
              }}

              onEnded={() => {
                runningRef.current = false;
                setRunning(false);

                if (raf.current) {
                  cancelAnimationFrame(raf.current);
                  raf.current = 0;
                }
              }}
            />

            <SkeletonOverlay
              landmarks={landmarks}
            />

            {!running && mode === "idle" && (
              <div className="camera-empty">
                <Video size={44} />

                <h2>Enter the Lab</h2>

                <p>
                  Upload a boxing video or use your
                  camera for live analysis
                </p>
              </div>
            )}

            {mode === "upload" && videoName && (
              <div className="camera-badge">
                VIDEO • {videoName}
              </div>
            )}

            {mode !== "upload" && (
              <div className="camera-badge">
                POSE • FEET • HANDS
              </div>
            )}
          </div>

          <div className="controls">
            {!running ? (
              <>
                <label className="primary">
                  <Upload size={17} />
                  Upload Video

                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    hidden
                  />
                </label>

                <button onClick={startCamera}>
                  <Camera size={17} />
                  Start Session
                </button>
              </>
            ) : (
              <button
                className="danger"
                onClick={stop}
              >
                <Square size={16} />
                Stop
              </button>
            )}

            <button onClick={reset}>
              <RotateCcw size={16} />
              Reset
            </button>

            <label>
              REFERENCE STYLE

              <select
                value={styleKey}
                onChange={(e) =>
                  setStyleKey(e.target.value)
                }
              >
                {Object.entries(STYLES).map(
                  ([k, v]) => (
                    <option
                      value={k}
                      key={k}
                    >
                      {v.name}
                    </option>
                  )
                )}
              </select>
            </label>
          </div>

          {mode === "upload" && (
            <div className="upload-info">
              Upload mode analyzes the video
              frame-by-frame using the same
              biomechanics engine as live tracking.
            </div>
          )}

          {error && (
            <div className="error">
              {error}
            </div>
          )}
        </section>

        <aside>
          <div className="section-title">
            LIVE METRICS
          </div>

          <div className="metric-grid">
            <MetricCard
              label="FORM"
              value={Math.round(metrics.form)}
            />

            <MetricCard
              label="FOOTWORK"
              value={Math.round(metrics.footwork)}
            />

            <MetricCard
              label="GUARD"
              value={Math.round(metrics.guard)}
            />

            <MetricCard
              label="BALANCE"
              value={Math.round(metrics.balance)}
            />

            <MetricCard
              label="PUNCH SPEED"
              value={metrics.speed.toFixed(2)}
              unit=" m/s"
            />

            <MetricCard
              label="PEAK SPEED"
              value={metrics.peakSpeed.toFixed(2)}
              unit=" m/s"
            />

            <MetricCard
              label="PUNCHES"
              value={metrics.punches}
            />

            <MetricCard
              label="HEAD DRIFT"
              value={metrics.headDrift.toFixed(1)}
              unit=" cm*"
            />
          </div>

          <div className="style-box">
            <div className="eyebrow">
              STYLE GAP
            </div>

            <h3>{style.name}</h3>

            <div className="gap">
              <span>Form</span>
              <b>
                {delta.form > 0 ? "+" : ""}
                {delta.form}
              </b>
            </div>

            <div className="gap">
              <span>Footwork</span>
              <b>
                {delta.footwork > 0 ? "+" : ""}
                {delta.footwork}
              </b>
            </div>

            <div className="gap">
              <span>Guard</span>
              <b>
                {delta.guard > 0 ? "+" : ""}
                {delta.guard}
              </b>
            </div>

            <div className="gap">
              <span>Balance</span>
              <b>
                {delta.balance > 0 ? "+" : ""}
                {delta.balance}
              </b>
            </div>
          </div>
        </aside>

        <CoachPanel
          style={style}
          message={message}
        />

        <section className="analysis">
          <div className="section-title">
            CURRENT ACTION
          </div>

          <div className="action-row">
            <div>
              <Activity />

              <span>
                {lastPunch?.type || "Waiting"}
              </span>

              <small>
                {lastPunch
                  ? lastPunch.hand.toUpperCase() +
                    " HAND"
                  : "Throw a punch"}
              </small>
            </div>

            <div>
              <Gauge />

              <span>
                {lastPunch
                  ? lastPunch.speed.toFixed(2)
                  : "—"}{" "}
                m/s
              </span>

              <small>
                PEAK VELOCITY
              </small>
            </div>

            <div>
              <Footprints />

              <span>
                {metrics.footwork.toFixed(0)}
              </span>

              <small>
                FOOTWORK SCORE
              </small>
            </div>

            <div>
              <Shield />

              <span>
                {metrics.guard.toFixed(0)}
              </span>

              <small>
                GUARD SCORE
              </small>
            </div>
          </div>
        </section>
      </main>

      <footer>
        Biomechanics reference system •
        *camera-based estimates are normalized
        and should not be treated as laboratory
        measurements.
      </footer>
    </div>
  );
}
