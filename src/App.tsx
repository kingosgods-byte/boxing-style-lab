import React, {
  useState,
  useRef,
  useEffect,
} from "react";

import {
  Target,
  Activity,
  RotateCcw,
  Camera,
  Upload,
  Settings,
  UserCheck,
  X,
  Sliders,
  Volume2,
  VolumeX,
  Cpu,
  Flame,
  Play,
  Square,
  Timer,
  Award,
  Cloud,
} from "lucide-react";

import {
  SovietPunchAnalyzer,
  PunchEvent,
} from "./engine/punchDetector";

import {
  AICoachEngine,
  AIAdvice,
} from "./engine/aiCoachEngine";

import { FIGHTER_STYLES } from "./engine/styleProfiles";

import {
  UserDataEngine,
  UserStats,
} from "./engine/userDataEngine";

import {
  ComboDetector,
  ComboEvent,
} from "./engine/comboDetector";

import { uploadWorkoutSession } from "./services/supabaseService";

import { MediaPipeTracker } from "./tracking/MediaPipeTracker";

import type { Landmark } from "./types";

type Theme =
  | "bivol"
  | "ggg"
  | "loma";

interface ThemeConfig {
  primary: string;
  accentHex: string;
  badgeBg: string;
}

const THEMES: Record<
  Theme,
  ThemeConfig
> = {
  bivol: {
    primary: "text-cyan-400",
    accentHex: "#06b6d4",
    badgeBg:
      "bg-cyan-950/80 text-cyan-400 border-cyan-800",
  },

  ggg: {
    primary: "text-red-500",
    accentHex: "#ef4444",
    badgeBg:
      "bg-red-950/80 text-red-400 border-red-800",
  },

  loma: {
    primary: "text-amber-400",
    accentHex: "#f59e0b",
    badgeBg:
      "bg-amber-950/80 text-amber-400 border-amber-800",
  },
};

interface SessionReport {
  durationSeconds: number;
  jabsCount: number;
  crossesCount: number;
  combosCount: number;
  avgVelocity: number;
  formScore: number;
  videoUrl?: string;
}

const POSE_CONNECTIONS: Array<
  [number, number]
> = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 7],
  [0, 4],
  [4, 5],
  [5, 6],
  [6, 8],

  [9, 10],

  [11, 12],
  [11, 23],
  [12, 24],
  [23, 24],

  [11, 13],
  [13, 15],

  [12, 14],
  [14, 16],

  [15, 17],
  [15, 19],
  [15, 21],

  [16, 18],
  [16, 20],
  [16, 22],

  [23, 25],
  [25, 27],

  [24, 26],
  [26, 28],

  [27, 29],
  [29, 31],
  [28, 30],
  [30, 32],
];

export default function App() {
  const [jabs, setJabs] =
    useState(0);

  const [crosses, setCrosses] =
    useState(0);

  const [combosCount, setCombosCount] =
    useState(0);

  const [lastPunch, setLastPunch] =
    useState<PunchEvent | null>(null);

  const [lastCombo, setLastCombo] =
    useState<ComboEvent | null>(null);

  const [aiAdvice, setAiAdvice] =
    useState<AIAdvice | null>(null);

  const [
    isCameraActive,
    setIsCameraActive,
  ] = useState(false);

  const [
    isLoadingModel,
    setIsLoadingModel,
  ] = useState(true);

  const [
    modelError,
    setModelError,
  ] = useState<string | null>(null);

  const [
    isRecording,
    setIsRecording,
  ] = useState(false);

  const [
    countdown,
    setCountdown,
  ] = useState<number | null>(null);

  const [
    recordingSeconds,
    setRecordingSeconds,
  ] = useState(0);

  const [
    sessionReport,
    setSessionReport,
  ] = useState<SessionReport | null>(
    null
  );

  const [
    isUploading,
    setIsUploading,
  ] = useState(false);

  const [
    selectedFighter,
    setSelectedFighter,
  ] = useState(
    "SOVIET_CLASSIC"
  );

  const [
    activeTheme,
    setActiveTheme,
  ] = useState<Theme>("bivol");

  const [
    showSettingsDrawer,
    setShowSettingsDrawer,
  ] = useState(false);

  const [
    mirrorVideo,
    setMirrorVideo,
  ] = useState(true);

  const [
    showSkeleton,
    setShowSkeleton,
  ] = useState(true);

  const [
    audioFeedback,
    setAudioFeedback,
  ] = useState(true);

  const [
    userStats,
    setUserStats,
  ] = useState<UserStats>({
    totalPunches: 0,
    avgJabAngle: 150,
    avgCrossAngle: 155,
    avgVelocity: 4.0,
    samplesCount: 0,
  });

  const videoRef =
    useRef<HTMLVideoElement | null>(
      null
    );

  const canvasRef =
    useRef<HTMLCanvasElement | null>(
      null
    );

  const trackerRef =
    useRef<MediaPipeTracker | null>(
      null
    );

  const animFrameRef =
    useRef<number | null>(null);

  const timerIntervalRef =
    useRef<number | null>(null);

  const wakeLockRef =
    useRef<any | null>(null);

  const prevLandmarksRef =
    useRef<Landmark[] | null>(null);

  const audioCtxRef =
    useRef<AudioContext | null>(null);

  const mediaRecorderRef =
    useRef<MediaRecorder | null>(
      null
    );

  const recordedChunksRef =
    useRef<Blob[]>([]);

  const mediaStreamRef =
    useRef<MediaStream | null>(null);

  const uploadedVideoUrlRef =
    useRef<string | null>(null);

  const analyzerRef =
    useRef<SovietPunchAnalyzer>(
      new SovietPunchAnalyzer()
    );

  const aiCoachRef =
    useRef<AICoachEngine>(
      new AICoachEngine()
    );

  const userDataRef =
    useRef<UserDataEngine>(
      new UserDataEngine()
    );

  const comboDetectorRef =
    useRef<ComboDetector>(
      new ComboDetector()
    );

  const currentTheme =
    THEMES[activeTheme];

  useEffect(() => {
    let cancelled = false;

    setUserStats(
      userDataRef.current.getUserStats()
    );

    async function initializeTracker() {
      try {
        setIsLoadingModel(true);
        setModelError(null);

        const tracker =
          new MediaPipeTracker();

        await tracker.init();

        if (cancelled) {
          return;
        }

        trackerRef.current =
          tracker;

        setIsLoadingModel(false);
        setModelError(null);

        console.log(
          "MediaPipeTracker initialized successfully."
        );
      } catch (error) {
        console.error(
          "MediaPipeTracker initialization failed:",
          error
        );

        if (!cancelled) {
          setIsLoadingModel(false);

          setModelError(
            "AI pose tracking could not initialize. Camera and video can still be opened."
          );
        }
      }
    }

    initializeTracker();

    return () => {
      cancelled = true;

      if (
        animFrameRef.current !==
        null
      ) {
        cancelAnimationFrame(
          animFrameRef.current
        );

        animFrameRef.current = null;
      }

      if (
        timerIntervalRef.current !==
        null
      ) {
        clearInterval(
          timerIntervalRef.current
        );

        timerIntervalRef.current = null;
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current
          .getTracks()
          .forEach((track) =>
            track.stop()
          );

        mediaStreamRef.current =
          null;
      }

      if (uploadedVideoUrlRef.current) {
        URL.revokeObjectURL(
          uploadedVideoUrlRef.current
        );

        uploadedVideoUrlRef.current =
          null;
      }

      releaseWakeLock();
    };
  }, []);

  const requestWakeLock =
    async () => {
      try {
        if ("wakeLock" in navigator) {
          wakeLockRef.current =
            await (
              navigator as any
            ).wakeLock.request(
              "screen"
            );
        }
      } catch (error) {
        console.log(
          "Wake Lock request failed:",
          error
        );
      }
    };

  const releaseWakeLock =
    async () => {
      try {
        if (wakeLockRef.current) {
          await wakeLockRef.current.release();

          wakeLockRef.current =
            null;
        }
      } catch (error) {
        console.log(
          "Wake Lock release failed:",
          error
        );
      }
    };

  useEffect(() => {
    if (isRecording) {
      requestWakeLock();

      timerIntervalRef.current =
        window.setInterval(() => {
          setRecordingSeconds(
            (previous) =>
              previous + 1
          );
        }, 1000);
    } else {
      releaseWakeLock();

      if (
        timerIntervalRef.current !==
        null
      ) {
        clearInterval(
          timerIntervalRef.current
        );

        timerIntervalRef.current =
          null;
      }
    }

    return () => {
      if (
        timerIntervalRef.current !==
        null
      ) {
        clearInterval(
          timerIntervalRef.current
        );

        timerIntervalRef.current =
          null;
      }
    };
  }, [isRecording]);

  const playPunchSfx = () => {
    if (!audioFeedback) {
      return;
    }

    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current =
          new (window.AudioContext ||
            (window as any)
              .webkitAudioContext)();
      }

      const ctx =
        audioCtxRef.current;

      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const oscillator =
        ctx.createOscillator();

      const gain =
        ctx.createGain();

      oscillator.type =
        "triangle";

      oscillator.frequency.setValueAtTime(
        140,
        ctx.currentTime
      );

      oscillator.frequency.exponentialRampToValueAtTime(
        30,
        ctx.currentTime + 0.12
      );

      gain.gain.setValueAtTime(
        0.5,
        ctx.currentTime
      );

      gain.gain.exponentialRampToValueAtTime(
        0.01,
        ctx.currentTime + 0.12
      );

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.start();

      oscillator.stop(
        ctx.currentTime + 0.12
      );
    } catch {
      // Audio is optional.
    }
  };

  const speakFeedback = (
    text: string
  ) => {
    if (
      !audioFeedback ||
      !("speechSynthesis" in window)
    ) {
      return;
    }

    window.speechSynthesis.cancel();

    const utterance =
      new SpeechSynthesisUtterance(
        text
      );

    utterance.rate = 1.1;
    utterance.pitch = 1.0;

    window.speechSynthesis.speak(
      utterance
    );
  };

  const smoothLandmarks = (
    rawLandmarks: Landmark[]
  ): Landmark[] => {
    const alpha = 0.4;

    if (
      !prevLandmarksRef.current
    ) {
      prevLandmarksRef.current =
        rawLandmarks;

      return rawLandmarks;
    }

    const previous =
      prevLandmarksRef.current;

    const smoothed =
      rawLandmarks.map(
        (point, index) => {
          const oldPoint =
            previous[index] ||
            point;

          return {
            ...point,

            x:
              oldPoint.x *
                alpha +
              point.x *
                (1 - alpha),

            y:
              oldPoint.y *
                alpha +
              point.y *
                (1 - alpha),

            z:
              oldPoint.z *
                alpha +
              point.z *
                (1 - alpha),
          };
        }
      );

    prevLandmarksRef.current =
      smoothed;

    return smoothed;
  };

  const drawSkeleton = (
    ctx: CanvasRenderingContext2D,
    landmarks: Landmark[],
    width: number,
    height: number
  ) => {
    ctx.save();

    ctx.strokeStyle =
      currentTheme.accentHex;

    ctx.fillStyle =
      currentTheme.accentHex;

    ctx.lineWidth = Math.max(
      3,
      Math.round(width / 260)
    );

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const isVisible = (
      point: Landmark
    ) => {
      return (
        (point.visibility ??
          1) > 0.25
      );
    };

    for (const [
      firstIndex,
      secondIndex,
    ] of POSE_CONNECTIONS) {
      const first =
        landmarks[firstIndex];

      const second =
        landmarks[secondIndex];

      if (!first || !second) {
        continue;
      }

      if (
        !isVisible(first) ||
        !isVisible(second)
      ) {
        continue;
      }

      ctx.beginPath();

      ctx.moveTo(
        first.x * width,
        first.y * height
      );

      ctx.lineTo(
        second.x * width,
        second.y * height
      );

      ctx.stroke();
    }

    for (const point of landmarks) {
      if (!point) {
        continue;
      }

      if (!isVisible(point)) {
        continue;
      }

      ctx.beginPath();

      ctx.arc(
        point.x * width,
        point.y * height,
        Math.max(
          3,
          width / 250
        ),
        0,
        Math.PI * 2
      );

      ctx.fill();
    }

    ctx.restore();
  };

  const processVideoFrame =
    () => {
      const video =
        videoRef.current;

      if (!video) {
        animFrameRef.current =
          requestAnimationFrame(
            processVideoFrame
          );

        return;
      }

      if (
        video.paused ||
        video.ended ||
        video.videoWidth === 0 ||
        video.videoHeight === 0
      ) {
        animFrameRef.current =
          requestAnimationFrame(
            processVideoFrame
          );

        return;
      }

      const canvas =
        canvasRef.current;

      const tracker =
        trackerRef.current;

      if (!tracker) {
        animFrameRef.current =
          requestAnimationFrame(
            processVideoFrame
          );

        return;
      }

      try {
        const landmarks =
          tracker.detect(
            video,
            performance.now()
          );

        /*
         * TEMPORARY TRACKING DIAGNOSTIC
         *
         * This tells us whether MediaPipe
         * is actually returning landmarks.
         */
        if (landmarks) {
          console.log(
            "POSE DETECTED:",
            landmarks.length
          );
        } else {
          console.log(
            "NO POSE DETECTED"
          );
        }

        if (canvas) {
          if (
            canvas.width !==
              video.videoWidth ||
            canvas.height !==
              video.videoHeight
          ) {
            canvas.width =
              video.videoWidth;

            canvas.height =
              video.videoHeight;
          }

          const ctx =
            canvas.getContext("2d");

          if (ctx) {
            ctx.clearRect(
              0,
              0,
              canvas.width,
              canvas.height
            );

            if (landmarks) {
              const smoothed =
                smoothLandmarks(
                  landmarks
                );

              if (showSkeleton) {
                drawSkeleton(
                  ctx,
                  smoothed,
                  canvas.width,
                  canvas.height
                );
              }

              const punch =
                analyzerRef.current.update(
                  smoothed
                );

              if (punch) {
                setLastPunch(
                  punch
                );

                playPunchSfx();

                if (
                  punch.type ===
                  "jab"
                ) {
                  setJabs(
                    (previous) =>
                      previous + 1
                  );
                }

                if (
                  punch.type ===
                  "cross"
                ) {
                  setCrosses(
                    (previous) =>
                      previous + 1
                  );
                }

                const detectedCombo =
                  comboDetectorRef.current.registerPunch(
                    punch.type
                  );

                if (detectedCombo) {
                  setLastCombo(
                    detectedCombo
                  );

                  setCombosCount(
                    (previous) =>
                      previous + 1
                  );

                  speakFeedback(
                    `${detectedCombo.name}!`
                  );
                }

                userDataRef.current.saveSample(
                  {
                    timestamp:
                      Date.now(),

                    type:
                      punch.type ===
                      "jab"
                        ? "jab"
                        : "cross",

                    elbowAngle:
                      punch.elbowAngle,

                    peakVelocity:
                      punch.peakVelocity,
                  }
                );

                const updatedStats =
                  userDataRef.current.getUserStats();

                setUserStats(
                  updatedStats
                );

                const advice =
                  aiCoachRef.current.evaluatePunch(
                    punch.type ===
                      "jab"
                      ? "jab"
                      : "cross",

                    smoothed,

                    punch.elbowAngle,

                    punch.peakVelocity,

                    selectedFighter,

                    updatedStats
                  );

                if (
                  advice &&
                  !detectedCombo
                ) {
                  setAiAdvice(
                    advice
                  );

                  speakFeedback(
                    advice.feedback
                  );
                }
              }
            } else {
              prevLandmarksRef.current =
                null;
            }
          }
        }
      } catch (error) {
        console.error(
          "Pose detection error:",
          error
        );
      }

      animFrameRef.current =
        requestAnimationFrame(
          processVideoFrame
        );
    };

  const startCamera =
    async () => {
      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices
          .getUserMedia
      ) {
        alert(
          "Camera access is not supported by this browser."
        );

        return;
      }

      try {
        if (
          "speechSynthesis" in
          window
        ) {
          window.speechSynthesis.speak(
            new SpeechSynthesisUtterance(
              ""
            )
          );
        }

        if (
          mediaStreamRef.current
        ) {
          mediaStreamRef.current
            .getTracks()
            .forEach((track) =>
              track.stop()
            );

          mediaStreamRef.current =
            null;
        }

        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              video: {
                facingMode: "user",

                width: {
                  ideal: 1280,
                },

                height: {
                  ideal: 720,
                },

                frameRate: {
                  ideal: 30,
                },
              },

              audio: false,
            }
          );

        mediaStreamRef.current =
          stream;

        const video =
          videoRef.current;

        if (!video) {
          stream
            .getTracks()
            .forEach((track) =>
              track.stop()
            );

          throw new Error(
            "Video element is unavailable."
          );
        }

        video.pause();

        video.removeAttribute(
          "src"
        );

        video.srcObject = null;

        video.load();

        video.srcObject =
          stream;

        video.setAttribute(
          "playsinline",
          "true"
        );

        video.muted = true;

        await video.play();

        setIsCameraActive(true);

        if (trackerRef.current) {
          setModelError(null);
        } else {
          setModelError(
            "Camera is active, but AI pose tracking is still initializing."
          );
        }

        if (
          animFrameRef.current !==
          null
        ) {
          cancelAnimationFrame(
            animFrameRef.current
          );
        }

        prevLandmarksRef.current =
          null;

        processVideoFrame();
      } catch (error) {
        console.error(
          "Camera access failed:",
          error
        );

        setIsCameraActive(false);

        alert(
          "Camera access failed. Please allow camera permission in Chrome and try again."
        );
      }
    };

  const handleVideoUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (
      "speechSynthesis" in
      window
    ) {
      window.speechSynthesis.speak(
        new SpeechSynthesisUtterance(
          ""
        )
      );
    }

    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    console.log(
      "Selected video:",
      file.name,
      file.type,
      file.size
    );

    if (
      mediaStreamRef.current
    ) {
      mediaStreamRef.current
        .getTracks()
        .forEach((track) =>
          track.stop()
        );

      mediaStreamRef.current =
        null;
    }

    const video =
      videoRef.current;

    if (!video) {
      alert(
        "Video player is unavailable."
      );

      return;
    }

    if (
      uploadedVideoUrlRef.current
    ) {
      URL.revokeObjectURL(
        uploadedVideoUrlRef.current
      );
    }

    const url =
      URL.createObjectURL(file);

    uploadedVideoUrlRef.current =
      url;

    video.pause();

    video.srcObject = null;

    video.src = url;

    video.setAttribute(
      "playsinline",
      "true"
    );

    video.muted = true;

    video.load();

    const startUploadedVideo =
      async () => {
        try {
          await video.play();

          setIsCameraActive(true);

          if (trackerRef.current) {
            setModelError(null);
          } else {
            setModelError(
              "Video is playing, but AI pose tracking is still initializing."
            );
          }

          if (
            animFrameRef.current !==
            null
          ) {
            cancelAnimationFrame(
              animFrameRef.current
            );
          }

          prevLandmarksRef.current =
            null;

          processVideoFrame();
        } catch (error) {
          console.error(
            "Uploaded video playback failed:",
            error
          );

          alert(
            "The video could not be played. Try an MP4 or WebM video."
          );
        }
      };

    if (
      video.readyState >= 2
    ) {
      startUploadedVideo();
    } else {
      video.onloadeddata =
        () => {
          video.onloadeddata =
            null;

          startUploadedVideo();
        };
    }

    event.target.value = "";
  };

  const handleStartTimedSession =
    () => {
      if (
        !isCameraActive ||
        !mediaStreamRef.current
      ) {
        alert(
          "Please start the live camera first."
        );

        return;
      }

      setSessionReport(null);

      setCountdown(3);

      const countInterval =
        window.setInterval(() => {
          setCountdown(
            (previous) => {
              if (previous === 1) {
                clearInterval(
                  countInterval
                );

                recordedChunksRef.current =
                  [];

                try {
                  const mime =
                    MediaRecorder.isTypeSupported(
                      "video/mp4"
                    )
                      ? "video/mp4"
                      : "video/webm";

                  const recorder =
                    new MediaRecorder(
                      mediaStreamRef.current!,
                      {
                        mimeType:
                          mime,
                      }
                    );

                  recorder.ondataavailable =
                    (event) => {
                      if (
                        event.data
                          .size > 0
                      ) {
                        recordedChunksRef.current.push(
                          event.data
                        );
                      }
                    };

                  recorder.start();

                  mediaRecorderRef.current =
                    recorder;
                } catch {
                  const recorder =
                    new MediaRecorder(
                      mediaStreamRef.current!
                    );

                  recorder.ondataavailable =
                    (event) => {
                      if (
                        event.data
                          .size > 0
                      ) {
                        recordedChunksRef.current.push(
                          event.data
                        );
                      }
                    };

                  recorder.start();

                  mediaRecorderRef.current =
                    recorder;
                }

                setIsRecording(
                  true
                );

                setRecordingSeconds(
                  0
                );

                setJabs(0);
                setCrosses(0);
                setCombosCount(
                  0
                );

                speakFeedback(
                  "Fight!"
                );

                return null;
              }

              return previous
                ? previous - 1
                : null;
            }
          );
        }, 1000);
    };

  const handleStopTimedSession =
    () => {
      setIsRecording(false);

      speakFeedback("Time!");

      const recorder =
        mediaRecorderRef.current;

      if (
        recorder &&
        recorder.state !==
          "inactive"
      ) {
        recorder.onstop =
          async () => {
            const mime =
              MediaRecorder.isTypeSupported(
                "video/mp4"
              )
                ? "video/mp4"
                : "video/webm";

            const videoBlob =
              new Blob(
                recordedChunksRef.current,
                {
                  type: mime,
                }
              );

            const totalPunches =
              jabs + crosses;

            const formScore =
              Math.min(
                100,
                Math.round(
                  75 +
                    totalPunches *
                      1.2 +
                    combosCount *
                      4
                )
              );

            setIsUploading(
              true
            );

            try {
              const uploadResult =
                await uploadWorkoutSession(
                  videoBlob,
                  {
                    fighterArchetype:
                      selectedFighter,

                    durationSeconds:
                      recordingSeconds,

                    jabsCount: jabs,

                    crossesCount:
                      crosses,

                    combosCount:
                      combosCount,

                    avgVelocity:
                      userStats.avgVelocity ||
                      4.2,

                    formScore,
                  }
                );

              setSessionReport({
                durationSeconds:
                  recordingSeconds,

                jabsCount: jabs,

                crossesCount:
                  crosses,

                combosCount:
                  combosCount,

                avgVelocity:
                  userStats.avgVelocity ||
                  4.2,

                formScore,

                videoUrl:
                  uploadResult.success
                    ? uploadResult
                        .workoutRecord
                        ?.video_url
                    : undefined,
              });
            } catch (error) {
              console.error(
                "Workout upload failed:",
                error
              );

              setSessionReport({
                durationSeconds:
                  recordingSeconds,

                jabsCount: jabs,

                crossesCount:
                  crosses,

                combosCount:
                  combosCount,

                avgVelocity:
                  userStats.avgVelocity ||
                  4.2,

                formScore,
              });
            } finally {
              setIsUploading(
                false
              );
            }
          };

        recorder.stop();
      }
    };

  const handleReset = () => {
    setJabs(0);
    setCrosses(0);
    setCombosCount(0);

    setLastPunch(null);
    setLastCombo(null);
    setAiAdvice(null);

    setSessionReport(null);

    setIsRecording(false);

    setRecordingSeconds(0);
    setCountdown(null);

    comboDetectorRef.current.reset();

    prevLandmarksRef.current =
      null;

    if (canvasRef.current) {
      const ctx =
        canvasRef.current.getContext(
          "2d"
        );

      if (ctx) {
        ctx.clearRect(
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );
      }
    }
  };

  const formatTimer = (
    seconds: number
  ) => {
    const minutes =
      Math.floor(seconds / 60);

    const remainder =
      seconds % 60;

    return `${minutes
      .toString()
      .padStart(2, "0")}:${remainder
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="bg-slate-950 text-slate-300 w-full h-screen flex flex-col font-mono relative overflow-hidden selection:bg-slate-800">

      <header className="flex justify-between items-center px-4 py-3 bg-slate-900 border-b border-slate-800 shrink-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-slate-950 rounded-xl border border-slate-800">
            <Cpu
              className={`w-4 h-4 ${currentTheme.primary}`}
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1
                className={`text-sm sm:text-base font-bold tracking-wider uppercase ${currentTheme.primary}`}
              >
                BRAWLER LABS
              </h1>

              <span
                className={`text-[9px] px-2 py-0.5 rounded border font-semibold ${currentTheme.badgeBg}`}
              >
                2026 PRO
              </span>
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={startCamera}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-950 hover:bg-slate-800 active:scale-95 text-slate-200 border border-slate-800 text-xs font-semibold rounded-xl transition-all touch-manipulation"
          >
            <Camera className="w-3.5 h-3.5 text-slate-400" />
            <span>Camera</span>
          </button>

          <label className="flex items-center gap-1.5 px-3 py-2 bg-slate-950 hover:bg-slate-800 active:scale-95 text-slate-200 border border-slate-800 text-xs font-semibold rounded-xl cursor-pointer transition-all touch-manipulation">
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span>Upload</span>

            <input
              type="file"
              accept="video/*"
              onChange={
                handleVideoUpload
              }
              className="hidden"
            />
          </label>

          <button
            onClick={() =>
              setShowSettingsDrawer(
                true
              )
            }
            className="p-2 bg-slate-950 hover:bg-slate-800 active:scale-95 text-slate-300 border border-slate-800 rounded-xl transition-all touch-manipulation"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={handleReset}
            className="p-2 bg-slate-950 hover:bg-slate-800 active:scale-95 text-slate-400 border border-slate-800 rounded-xl transition-all touch-manipulation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 overflow-hidden">

        <div className="lg:col-span-2 relative bg-black w-full h-full flex items-center justify-center overflow-hidden">

          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className={`absolute inset-0 w-full h-full object-cover ${
              mirrorVideo
                ? "scale-x-[-1]"
                : ""
            }`}
          />

          <canvas
            ref={canvasRef}
            className={`absolute inset-0 w-full h-full object-cover pointer-events-none ${
              mirrorVideo
                ? "scale-x-[-1]"
                : ""
            }`}
          />

          {!isCameraActive && (
            <div className="absolute text-slate-400 text-xs text-center z-10 p-5 max-w-xs space-y-3 bg-slate-900/90 border border-slate-800 rounded-2xl backdrop-blur-md shadow-2xl">

              <Activity className="w-10 h-10 text-cyan-400 mx-auto animate-pulse" />

              <p className="leading-relaxed">
                {isLoadingModel
                  ? "Initializing MediaPipe AI Engine..."
                  : "Tap Camera or Upload to begin biomechanics analysis"}
              </p>

              {modelError && (
                <p className="text-[10px] text-amber-400 leading-relaxed">
                  {modelError}
                </p>
              )}

              <button
                onClick={
                  startCamera
                }
                className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold uppercase tracking-wider rounded-xl transition-all"
              >
                Start Camera
              </button>
            </div>
          )}

          {countdown !== null && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center z-30">
              <span className="text-8xl font-extrabold text-amber-400 animate-ping">
                {countdown}
              </span>

              <p className="text-xs text-slate-400 mt-4 uppercase tracking-widest font-bold">
                Get In Stance
              </p>
            </div>
          )}

          {isRecording && (
            <div className="absolute top-3 left-3 bg-red-950/90 border border-red-800 text-red-400 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 z-20 backdrop-blur-md">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />

              REC •{" "}
              {formatTimer(
                recordingSeconds
              )}
            </div>
          )}

          {lastCombo && (
            <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-3 bg-slate-950/90 backdrop-blur-md border border-amber-500/50 p-3 rounded-xl flex justify-between items-center z-20 gap-4">
              <div className="flex items-center gap-2.5">
                <Flame className="w-5 h-5 text-amber-400 shrink-0" />

                <div>
                  <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                    {
                      lastCombo.name
                    }
                  </h3>

                  <p className="text-[10px] text-slate-400">
                    Combo sequence completed
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-slate-900/90 border-l border-slate-800 p-4 space-y-3 overflow-y-auto shrink-0 flex flex-col justify-between">

          <div className="space-y-3">

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">

              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-400 flex items-center gap-1.5 uppercase tracking-wider font-bold">
                  <Timer className="w-3.5 h-3.5 text-amber-400" />
                  Round Timer
                </span>

                <span className="text-base font-extrabold text-slate-100 font-mono">
                  {formatTimer(
                    recordingSeconds
                  )}
                </span>
              </div>

              {!isRecording ? (
                <button
                  onClick={
                    handleStartTimedSession
                  }
                  className="w-full h-11 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all touch-manipulation shadow-lg shadow-amber-500/10"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  Start Timed Workout
                </button>
              ) : (
                <button
                  onClick={
                    handleStopTimedSession
                  }
                  className="w-full h-11 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all touch-manipulation shadow-lg shadow-red-600/20"
                >
                  <Square className="w-3.5 h-3.5 fill-white" />
                  Finish & Sync to Cloud
                </button>
              )}

              {isUploading && (
                <div className="flex items-center justify-center gap-2 text-[11px] text-amber-400 py-1 animate-pulse">
                  <Cloud className="w-3.5 h-3.5" />
                  Syncing session data...
                </div>
              )}
            </div>

            {sessionReport && (
              <div className="bg-slate-950 border border-amber-500/40 rounded-2xl p-3.5 space-y-2.5">

                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase">
                    <Award className="w-3.5 h-3.5" />
                    Report Synced
                  </span>

                  <span className="text-xs text-slate-400">
                    {formatTimer(
                      sessionReport.durationSeconds
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center">

                  <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                    <p className="text-[9px] text-slate-500">
                      FORM SCORE
                    </p>

                    <p className="text-lg font-black text-emerald-400">
                      {
                        sessionReport.formScore
                      }
                      /100
                    </p>
                  </div>

                  <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                    <p className="text-[9px] text-slate-500">
                      COMBOS
                    </p>

                    <p className="text-lg font-black text-amber-400">
                      {
                        sessionReport.combosCount
                      }
                    </p>
                  </div>

                </div>

                {sessionReport.videoUrl && (
                  <a
                    href={
                      sessionReport.videoUrl
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="block text-center w-full py-2 bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-900/50 text-xs font-bold rounded-xl transition-all"
                  >
                    View Cloud Recording ➔
                  </a>
                )}
              </div>
            )}

            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 space-y-2">

              <label className="text-[10px] text-slate-400 flex items-center gap-1.5 uppercase tracking-wider font-bold">
                <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                Style Archetype
              </label>

              <select
                value={
                  selectedFighter
                }
                onChange={(event) => {
                  setSelectedFighter(
                    event.target.value
                  );

                  if (
                    event.target.value ===
                    "MEXICAN_PRESSURE"
                  ) {
                    setActiveTheme(
                      "ggg"
                    );
                  } else {
                    setActiveTheme(
                      "bivol"
                    );
                  }
                }}
                className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 focus:outline-none focus:border-cyan-500 h-11 touch-manipulation"
              >
                {Object.values(
                  FIGHTER_STYLES
                ).map((fighter) => (
                  <option
                    key={fighter.id}
                    value={fighter.id}
                  >
                    {fighter.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5">

              <span className="text-[10px] text-slate-400 flex items-center gap-1.5 mb-2.5 uppercase tracking-wider font-bold">
                <Target className="w-3.5 h-3.5 text-slate-400" />
                Live Punches
              </span>

              <div className="grid grid-cols-3 gap-2 text-center">

                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <span
                    className={`text-xl font-extrabold ${currentTheme.primary}`}
                  >
                    {jabs}
                  </span>

                  <p className="text-[9px] text-slate-400 mt-0.5 font-bold">
                    JABS
                  </p>
                </div>

                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-xl font-extrabold text-slate-300">
                    {crosses}
                  </span>

                  <p className="text-[9px] text-slate-400 mt-0.5 font-bold">
                    CROSSES
                  </p>
                </div>

                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-xl font-extrabold text-amber-400">
                    {combosCount}
                  </span>

                  <p className="text-[9px] text-slate-400 mt-0.5 font-bold">
                    COMBOS
                  </p>
                </div>

              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-1">

              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">
                AI Coach Feedback
              </span>

              <p className="text-xs font-medium text-emerald-400 leading-relaxed">
                {aiAdvice
                  ? aiAdvice.feedback
                  : "Awaiting movement telemetry..."}
              </p>

            </div>
          </div>

          <div className="text-[9px] text-slate-500 text-center pt-2">
            Brawler Labs • Multi-Style Biomechanics Engine
          </div>
        </div>
      </div>

      <div className="sm:hidden bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/80 p-2 shrink-0 z-40 flex items-center justify-around gap-2 shadow-2xl">

        <button
          onClick={startCamera}
          className="flex-1 flex flex-col items-center justify-center h-11 bg-slate-900 text-slate-200 border border-slate-800 rounded-xl text-[10px] font-bold touch-manipulation"
        >
          <Camera className="w-3.5 h-3.5 mb-0.5 text-cyan-400" />
          <span>Camera</span>
        </button>

        <label className="flex-1 flex flex-col items-center justify-center h-11 bg-slate-900 text-slate-200 border border-slate-800 rounded-xl text-[10px] font-bold cursor-pointer touch-manipulation">
          <Upload className="w-3.5 h-3.5 mb-0.5 text-slate-400" />
          <span>Upload</span>

          <input
            type="file"
            accept="video/*"
            onChange={
              handleVideoUpload
            }
            className="hidden"
          />
        </label>

        <button
          onClick={() =>
            setShowSettingsDrawer(
              true
            )
          }
          className="flex-1 flex flex-col items-center justify-center h-11 bg-slate-900 text-slate-300 border border-slate-800 rounded-xl text-[10px] font-bold touch-manipulation"
        >
          <Settings className="w-3.5 h-3.5 mb-0.5 text-slate-400" />
          <span>Settings</span>
        </button>

        <button
          onClick={handleReset}
          className="w-11 h-11 flex items-center justify-center bg-slate-900 text-slate-400 border border-slate-800 rounded-xl touch-manipulation shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {showSettingsDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm transition-all">

          <div className="w-full max-w-md bg-slate-950 border-l border-slate-800 h-full p-5 flex flex-col justify-between overflow-y-auto">

            <div className="space-y-6">

              <div className="flex justify-between items-center border-b border-slate-900 pb-4">

                <div className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-slate-400" />

                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                    Preferences
                  </h2>
                </div>

                <button
                  onClick={() =>
                    setShowSettingsDrawer(
                      false
                    )
                  }
                  className="w-10 h-10 flex items-center justify-center text-slate-400 bg-slate-900 rounded-xl border border-slate-800 touch-manipulation"
                >
                  <X className="w-5 h-5" />
                </button>

              </div>

              <div className="space-y-2.5">

                <label className="text-xs text-slate-500 block uppercase font-bold">
                  Theme
                </label>

                <div className="grid grid-cols-3 gap-2">

                  {(
                    [
                      "bivol",
                      "ggg",
                      "loma",
                    ] as Theme[]
                  ).map((theme) => (
                    <button
                      key={theme}
                      onClick={() =>
                        setActiveTheme(
                          theme
                        )
                      }
                      className={`h-11 rounded-xl border text-xs capitalize font-bold touch-manipulation ${
                        activeTheme ===
                        theme
                          ? "bg-slate-900 border-slate-700 text-slate-100"
                          : "bg-slate-950 border-slate-900 text-slate-500"
                      }`}
                    >
                      {theme}
                    </button>
                  ))}

                </div>
              </div>

              <div className="space-y-2.5">

                <label className="text-xs text-slate-500 block uppercase font-bold">
                  Voice & SFX Audio
                </label>

                <button
                  onClick={() =>
                    setAudioFeedback(
                      !audioFeedback
                    )
                  }
                  className="w-full h-14 px-4 bg-slate-900 border border-slate-800 rounded-xl flex justify-between items-center touch-manipulation"
                >
                  <div className="flex items-center gap-2.5">

                    {audioFeedback ? (
                      <Volume2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <VolumeX className="w-5 h-5 text-slate-500" />
                    )}

                    <span className="text-xs text-slate-300">
                      Live Feedback &
                      Hit Audio
                    </span>
                  </div>

                  <span
                    className={`text-xs font-bold ${
                      audioFeedback
                        ? "text-emerald-400"
                        : "text-slate-500"
                    }`}
                  >
                    {audioFeedback
                      ? "ENABLED"
                      : "MUTED"}
                  </span>
                </button>
              </div>

              <div className="space-y-2.5">

                <label className="text-xs text-slate-500 block uppercase font-bold">
                  Video Settings
                </label>

                <div className="grid grid-cols-2 gap-2">

                  <button
                    onClick={() =>
                      setMirrorVideo(
                        !mirrorVideo
                      )
                    }
                    className="h-14 p-3 bg-slate-900 border border-slate-800 rounded-xl text-left touch-manipulation"
                  >
                    <div className="text-[10px] text-slate-500">
                      Mirror Camera
                    </div>

                    <div className="text-xs font-bold text-slate-200 mt-0.5">
                      {mirrorVideo
                        ? "ON"
                        : "OFF"}
                    </div>
                  </button>

                  <button
                    onClick={() =>
                      setShowSkeleton(
                        !showSkeleton
                      )
                    }
                    className="h-14 p-3 bg-slate-900 border border-slate-800 rounded-xl text-left touch-manipulation"
                  >
                    <div className="text-[10px] text-slate-500">
                      Skeleton Overlay
                    </div>

                    <div className="text-xs font-bold text-slate-200 mt-0.5">
                      {showSkeleton
                        ? "ON"
                        : "OFF"}
                    </div>
                  </button>

                </div>
              </div>
            </div>

            <div className="text-[10px] text-slate-600 text-center border-t border-slate-900 pt-4 mt-6">
              Brawler Boxing Labs v2.0 • Full Suite
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
