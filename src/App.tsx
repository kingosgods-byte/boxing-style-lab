import React, { useState, useRef, useEffect } from 'react';
import { Target, Activity, Award, RotateCcw, Camera, Upload, Settings, Palette } from 'lucide-react';
import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { SovietPunchAnalyzer, PunchEvent } from './engine/punchDetector';
import { AICoachEngine, AIAdvice } from './engine/aiCoachEngine';

// Visual Themes
type Theme = 'bivol' | 'ggg' | 'loma';

interface ThemeConfig {
  primary: string;      // Tailwind color class
  accentHex: string;    // Canvas skeleton line color
  border: string;
  bgGlow: string;
}

const THEMES: Record<Theme, ThemeConfig> = {
  bivol: {
    primary: 'text-cyan-400',
    accentHex: '#06b6d4',
    border: 'border-cyan-500/30',
    bgGlow: 'bg-cyan-500/10'
  },
  ggg: {
    primary: 'text-red-500',
    accentHex: '#ef4444',
    border: 'border-red-500/30',
    bgGlow: 'bg-red-500/10'
  },
  loma: {
    primary: 'text-amber-400',
    accentHex: '#f59e0b',
    border: 'border-amber-500/30',
    bgGlow: 'bg-amber-500/10'
  }
};

export default function App() {
  const [jabs, setJabs] = useState<number>(0);
  const [crosses, setCrosses] = useState<number>(0);
  const [lastPunch, setLastPunch] = useState<PunchEvent | null>(null);
  const [aiAdvice, setAiAdvice] = useState<AIAdvice | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isLoadingModel, setIsLoadingModel] = useState<boolean>(true);

  // Customization States
  const [activeTheme, setActiveTheme] = useState<Theme>('bivol');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [mirrorVideo, setMirrorVideo] = useState<boolean>(true);
  const [showSkeleton, setShowSkeleton] = useState<boolean>(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const analyzerRef = useRef<SovietPunchAnalyzer>(new SovietPunchAnalyzer());
  const aiCoachRef = useRef<AICoachEngine>(new AICoachEngine());

  const currentTheme = THEMES[activeTheme];

  // Initialize MediaPipe PoseLandmarker
  useEffect(() => {
    async function initMediaPipe() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
        landmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numPoses: 1
        });
        setIsLoadingModel(false);
      } catch (err) {
        console.error('Failed to load MediaPipe PoseLandmarker:', err);
      }
    }
    initMediaPipe();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Frame processing loop
  const processVideoFrame = () => {
    if (!videoRef.current || !landmarkerRef.current || videoRef.current.paused || videoRef.current.ended) {
      animFrameRef.current = requestAnimationFrame(processVideoFrame);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.currentTime > 0 && !video.paused) {
      const results = landmarkerRef.current.detectForVideo(video, performance.now());

      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (results.landmarks && results.landmarks[0]) {
            const landmarks = results.landmarks[0];
            if (showSkeleton) {
              drawSkeleton(ctx, landmarks, canvas.width, canvas.height);
            }

            // Process punch telemetry
            const punch = analyzerRef.current.processFrame(landmarks, performance.now());
            if (punch) {
              setLastPunch(punch);
              if (punch.type === 'jab') setJabs((prev) => prev + 1);
              if (punch.type === 'cross') setCrosses((prev) => prev + 1);

              const advice = aiCoachRef.current.evaluatePunch(
                punch.type === 'jab' ? 'jab' : 'cross',
                landmarks,
                punch.elbowAngle,
                punch.peakVelocity
              );
              if (advice) setAiAdvice(advice);
            }
          }
        }
      }
    }

    animFrameRef.current = requestAnimationFrame(processVideoFrame);
  };

  // Start Live Webcam
  const startCamera = async () => {
    if (!videoRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' }
      });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      setIsCameraActive(true);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      processVideoFrame();
    } catch (err) {
      alert('Unable to access camera. Please check permissions.');
    }
  };

  // Handle Local Video Upload
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && videoRef.current) {
      const url = URL.createObjectURL(file);
      videoRef.current.srcObject = null;
      videoRef.current.src = url;
      videoRef.current.play();
      setIsCameraActive(true);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      processVideoFrame();
    }
  };

  // Draw 2D Skeleton Overlay with Selected Theme Hex
  const drawSkeleton = (ctx: CanvasRenderingContext2D, landmarks: any[], width: number, height: number) => {
    ctx.strokeStyle = currentTheme.accentHex;
    ctx.lineWidth = 3;

    // Left Arm (11 -> 13 -> 15)
    ctx.beginPath();
    ctx.moveTo(landmarks[11].x * width, landmarks[11].y * height);
    ctx.lineTo(landmarks[13].x * width, landmarks[13].y * height);
    ctx.lineTo(landmarks[15].x * width, landmarks[15].y * height);
    ctx.stroke();

    // Right Arm (12 -> 14 -> 16)
    ctx.beginPath();
    ctx.moveTo(landmarks[12].x * width, landmarks[12].y * height);
    ctx.lineTo(landmarks[14].x * width, landmarks[14].y * height);
    ctx.lineTo(landmarks[16].x * width, landmarks[16].y * height);
    ctx.stroke();
  };

  const handleReset = () => {
    setJabs(0);
    setCrosses(0);
    setLastPunch(null);
    setAiAdvice(null);
  };

  const totalPunches = jabs + crosses;
  const leadRatio = totalPunches > 0 ? Math.round((jabs / totalPunches) * 100) : 0;

  return (
    <div className="bg-slate-950 text-slate-300 min-h-screen p-3 sm:p-6 font-mono selection:bg-slate-800 selection:text-slate-200">
      {/* Muted Navigation Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-900 pb-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <img
            src={`${import.meta.env.BASE_URL}logo.png`}
            alt="Bivol Boxing Lab"
            className="h-8 sm:h-9 w-auto object-contain opacity-80"
            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
          />
          <div>
            <h1 className={`text-lg sm:text-xl font-bold tracking-wider ${currentTheme.primary}`}>
              BIVOL BOXING LAB
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-500">Vector Biomechanics & Kinetic AI Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
          <button
            onClick={startCamera}
            disabled={isLoadingModel}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 disabled:opacity-40 text-xs font-medium rounded-lg transition-all"
          >
            <Camera className="w-3.5 h-3.5 text-slate-400" /> Live Camera
          </button>

          <label className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium rounded-lg cursor-pointer transition-all">
            <Upload className="w-3.5 h-3.5 text-slate-400" /> Upload
            <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
          </label>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 rounded-lg transition-all ${
              showSettings ? 'border-slate-600 text-slate-200' : ''
            }`}
            title="App Customization Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={handleReset}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 rounded-lg transition-all"
            title="Reset Session Stats"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Slide-out Settings/Customization Drawer */}
      {showSettings && (
        <div className="mb-6 p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-4 text-xs">
          <div className="flex items-center gap-2 text-slate-400 border-b border-slate-800 pb-2">
            <Palette className="w-4 h-4 text-slate-400" />
            <span className="font-semibold uppercase tracking-wider">App Visuals & HUD Controls</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Theme Selector */}
            <div>
              <label className="text-slate-500 block mb-2">Style Archetype Theme</label>
              <div className="flex gap-2">
                {(['bivol', 'ggg', 'loma'] as Theme[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveTheme(t)}
                    className={`px-3 py-1.5 rounded border capitalize transition-all ${
                      activeTheme === t
                        ? 'bg-slate-800 border-slate-600 text-slate-200 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-400'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Video Mirroring Switch */}
            <div>
              <label className="text-slate-500 block mb-2">Camera Feed Options</label>
              <button
                onClick={() => setMirrorVideo(!mirrorVideo)}
                className="px-3 py-1.5 bg-slate-950 border border-slate-800 text-slate-400 rounded hover:text-slate-300"
              >
                Mirror Stream: <span className="text-slate-200 font-bold">{mirrorVideo ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            {/* Skeleton Overlay Switch */}
            <div>
              <label className="text-slate-500 block mb-2">Telemetry Canvas</label>
              <button
                onClick={() => setShowSkeleton(!showSkeleton)}
                className="px-3 py-1.5 bg-slate-950 border border-slate-800 text-slate-400 rounded hover:text-slate-300"
              >
                Pose Overlay: <span className="text-slate-200 font-bold">{showSkeleton ? 'VISIBLE' : 'HIDDEN'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Responsive Video Container */}
        <div className="lg:col-span-2 relative bg-slate-900/60 rounded-xl border border-slate-900 overflow-hidden w-full aspect-[4/3] sm:aspect-video flex items-center justify-center">
          <video
            ref={videoRef}
            playsInline
            muted
            className={`absolute inset-0 w-full h-full object-contain bg-black ${
              mirrorVideo ? 'scale-x-[-1]' : ''
            }`}
          />
          <canvas
            ref={canvasRef}
            className={`absolute inset-0 w-full h-full object-contain pointer-events-none ${
              mirrorVideo ? 'scale-x-[-1]' : ''
            }`}
          />

          {!isCameraActive && (
            <div className="text-slate-500 text-xs sm:text-sm text-center z-10 p-4">
              <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-slate-600 mx-auto mb-2 animate-pulse" />
              <p>{isLoadingModel ? 'Loading MediaPipe Model...' : 'Select "Live Camera" or "Upload" to begin'}</p>
            </div>
          )}
        </div>

        {/* Dashboard Side Panel */}
        <div className="space-y-4">
          {/* Punch Counter Card */}
          <div className="bg-slate-900/50 border border-slate-900 rounded-xl p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Target className="w-4 h-4 text-slate-500" /> PUNCH TELEMETRY
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center mb-4">
              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-900">
                <span className={`text-2xl sm:text-3xl font-extrabold ${currentTheme.primary}`}>{jabs}</span>
                <p className="text-[10px] text-slate-500 mt-1">LEAD JABS</p>
              </div>
              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-900">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-400">{crosses}</span>
                <p className="text-[10px] text-slate-500 mt-1">CROSSES</p>
              </div>
            </div>

            {lastPunch && (
              <div className="bg-slate-950 p-2.5 rounded border border-slate-900 text-xs flex justify-between items-center">
                <span className="text-slate-400">
                  Last: <strong className={`${currentTheme.primary} uppercase`}>{lastPunch.arm} {lastPunch.type}</strong>
                </span>
                <span className="text-slate-500 text-[10px]">
                  {lastPunch.peakVelocity} m/s | {lastPunch.elbowAngle}°
                </span>
              </div>
            )}
          </div>

          {/* Dynamic AI Diagnostic Alert */}
          {aiAdvice && (
            <div className={`p-4 rounded-xl border transition-all duration-300 ${
              aiAdvice.severity === 'critical'
                ? 'bg-red-950/30 border-red-900/50 text-red-300'
                : aiAdvice.severity === 'warning'
                ? 'bg-amber-950/30 border-amber-900/50 text-amber-300'
                : 'bg-emerald-950/30 border-emerald-900/50 text-emerald-300'
            }`}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium uppercase tracking-wider flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${
                    aiAdvice.severity === 'critical' ? 'bg-red-500 animate-ping' : 'bg-emerald-500'
                  }`} />
                  AI DIAGNOSTIC: {aiAdvice.metricName}
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-950/80 border border-slate-800">
                  Match: {aiAdvice.score}%
                </span>
              </div>
              <p className="text-xs leading-relaxed opacity-80">{aiAdvice.feedback}</p>
            </div>
          )}

          {/* Soviet Benchmark Index */}
          <div className="bg-slate-900/50 border border-slate-900 rounded-xl p-4 space-y-3">
            <h3 className="text-xs text-slate-500 flex items-center gap-1 mb-2">
              <Award className="w-4 h-4 text-slate-500" /> SOVIET METRIC BENCHMARKS
            </h3>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Lead Hand Dominance (Target: &gt;65%)</span>
                <span className={`${currentTheme.primary} font-bold`}>{leadRatio}%</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-900">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${currentTheme.bgGlow} bg-current`}
                  style={{ width: `${leadRatio}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
