import React, { useState, useRef, useEffect } from 'react';
import { Target, Activity, Award, RotateCcw, Camera, Upload, Settings, Palette, UserCheck, TrendingUp } from 'lucide-react';
import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { SovietPunchAnalyzer, PunchEvent } from './engine/punchDetector';
import { AICoachEngine, AIAdvice } from './engine/aiCoachEngine';
import { FIGHTER_STYLES, StyleProfile } from './engine/styleProfiles';
import { UserDataEngine, UserStats } from './engine/userDataEngine';

type Theme = 'bivol' | 'ggg' | 'loma';

interface ThemeConfig {
  primary: string;
  accentHex: string;
  bgGlow: string;
}

const THEMES: Record<Theme, ThemeConfig> = {
  bivol: { primary: 'text-cyan-400', accentHex: '#06b6d4', bgGlow: 'bg-cyan-500' },
  ggg: { primary: 'text-red-500', accentHex: '#ef4444', bgGlow: 'bg-red-500' },
  loma: { primary: 'text-amber-400', accentHex: '#f59e0b', bgGlow: 'bg-amber-500' }
};

export default function App() {
  const [jabs, setJabs] = useState<number>(0);
  const [crosses, setCrosses] = useState<number>(0);
  const [lastPunch, setLastPunch] = useState<PunchEvent | null>(null);
  const [aiAdvice, setAiAdvice] = useState<AIAdvice | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isLoadingModel, setIsLoadingModel] = useState<boolean>(true);

  const [selectedFighter, setSelectedFighter] = useState<string>('bivol');
  const [activeTheme, setActiveTheme] = useState<Theme>('bivol');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [mirrorVideo, setMirrorVideo] = useState<boolean>(true);
  const [showSkeleton, setShowSkeleton] = useState<boolean>(true);

  // User Learning State
  const [userStats, setUserStats] = useState<UserStats>({
    totalPunches: 0,
    avgJabAngle: 150,
    avgCrossAngle: 155,
    avgVelocity: 4.0,
    samplesCount: 0
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const analyzerRef = useRef<SovietPunchAnalyzer>(new SovietPunchAnalyzer());
  const aiCoachRef = useRef<AICoachEngine>(new AICoachEngine());
  const userDataRef = useRef<UserDataEngine>(new UserDataEngine());

  const currentTheme = THEMES[activeTheme];
  const currentFighter: StyleProfile = FIGHTER_STYLES[selectedFighter] || FIGHTER_STYLES.bivol;

  useEffect(() => {
    setUserStats(userDataRef.current.getUserStats());

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
        console.error('Failed to load MediaPipe:', err);
      }
    }
    initMediaPipe();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

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
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (results.landmarks && results.landmarks[0]) {
            const landmarks = results.landmarks[0];
            if (showSkeleton) {
              drawSkeleton(ctx, landmarks, canvas.width, canvas.height);
            }

            const punch = analyzerRef.current.processFrame(landmarks, performance.now());
            if (punch) {
              setLastPunch(punch);
              if (punch.type === 'jab') setJabs((prev) => prev + 1);
              if (punch.type === 'cross') setCrosses((prev) => prev + 1);

              // 1. Save data locally to build user profile
              userDataRef.current.saveSample({
                timestamp: Date.now(),
                type: punch.type === 'jab' ? 'jab' : 'cross',
                elbowAngle: punch.elbowAngle,
                peakVelocity: punch.peakVelocity
              });
              const updatedStats = userDataRef.current.getUserStats();
              setUserStats(updatedStats);

              // 2. Evaluate with adaptive stats
              const advice = aiCoachRef.current.evaluatePunch(
                punch.type === 'jab' ? 'jab' : 'cross',
                landmarks,
                punch.elbowAngle,
                punch.peakVelocity,
                selectedFighter,
                updatedStats
              );
              if (advice) setAiAdvice(advice);
            }
          }
        }
      }
    }

    animFrameRef.current = requestAnimationFrame(processVideoFrame);
  };

  const startCamera = async () => {
    if (!videoRef.current) return;
    try {
      // Mobile-optimized constraints with facingMode fallback
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoRef.current.srcObject = stream;
      videoRef.current.setAttribute('playsinline', 'true');
      await videoRef.current.play();
      setIsCameraActive(true);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      processVideoFrame();
    } catch (err) {
      alert('Camera access failed. Please ensure camera permissions are granted.');
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && videoRef.current) {
      const url = URL.createObjectURL(file);
      videoRef.current.srcObject = null;
      videoRef.current.src = url;
      videoRef.current.setAttribute('playsinline', 'true');
      videoRef.current.play();
      setIsCameraActive(true);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      processVideoFrame();
    }
  };

  const drawSkeleton = (ctx: CanvasRenderingContext2D, landmarks: any[], width: number, height: number) => {
    ctx.strokeStyle = currentTheme.accentHex;
    ctx.lineWidth = Math.max(2, Math.round(width / 300));

    // Arms drawing
    const drawLine = (p1: number, p2: number) => {
      if (landmarks[p1].visibility > 0.5 && landmarks[p2].visibility > 0.5) {
        ctx.beginPath();
        ctx.moveTo(landmarks[p1].x * width, landmarks[p1].y * height);
        ctx.lineTo(landmarks[p2].x * width, landmarks[p2].y * height);
        ctx.stroke();
      }
    };

    drawLine(11, 13); drawLine(13, 15);
    drawLine(12, 14); drawLine(14, 16);
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
    <div className="bg-slate-950 text-slate-300 min-h-screen p-2 sm:p-6 font-mono selection:bg-slate-800">
      {/* Top Navigation */}
      <header className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 border-b border-slate-900 pb-3 mb-3 sm:mb-6">
        <div className="flex items-center gap-2">
          <h1 className={`text-base sm:text-xl font-bold tracking-wider ${currentTheme.primary}`}>
            BOXING LAB
          </h1>
          <span className="text-[10px] bg-slate-900 text-slate-500 px-2 py-0.5 rounded border border-slate-800">
            AI PRECISION
          </span>
        </div>

        {/* Responsive Mobile Button Bar */}
        <div className="grid grid-cols-4 gap-1.5 sm:flex sm:items-center sm:gap-2">
          <button
            onClick={startCamera}
            disabled={isLoadingModel}
            className="flex items-center justify-center gap-1 px-2.5 py-2 sm:py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] font-medium rounded-lg"
          >
            <Camera className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Live</span>
          </button>

          <label className="flex items-center justify-center gap-1 px-2.5 py-2 sm:py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] font-medium rounded-lg cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Upload</span>
            <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
          </label>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center justify-center p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 rounded-lg"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={handleReset}
            className="flex items-center justify-center p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 rounded-lg"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Slide-out Settings */}
      {showSettings && (
        <div className="mb-4 p-3 bg-slate-900/90 border border-slate-800 rounded-xl space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-semibold text-slate-400 flex items-center gap-1">
              <Palette className="w-3.5 h-3.5" /> APP PREFERENCES
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              onClick={() => setMirrorVideo(!mirrorVideo)}
              className="p-2 bg-slate-950 border border-slate-800 rounded text-left"
            >
              <div className="text-[10px] text-slate-500">Mirror Feed</div>
              <div className="font-bold text-slate-200">{mirrorVideo ? 'ON' : 'OFF'}</div>
            </button>
            <button
              onClick={() => setShowSkeleton(!showSkeleton)}
              className="p-2 bg-slate-950 border border-slate-800 rounded text-left"
            >
              <div className="text-[10px] text-slate-500">Skeleton Wireframe</div>
              <div className="font-bold text-slate-200">{showSkeleton ? 'SHOW' : 'HIDE'}</div>
            </button>
            <button
              onClick={() => {
                userDataRef.current.clearData();
                setUserStats(userDataRef.current.getUserStats());
              }}
              className="p-2 bg-red-950/40 border border-red-900/40 rounded text-left col-span-2 sm:col-span-1"
            >
              <div className="text-[10px] text-red-400">User Memory</div>
              <div className="font-bold text-red-300">Reset Local Profile</div>
            </button>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
        {/* Mobile-Friendly Video Player Container */}
        <div className="lg:col-span-2 relative bg-slate-900/80 rounded-xl border border-slate-900 overflow-hidden w-full aspect-[3/4] min-h-[360px] sm:aspect-video flex items-center justify-center">
          <video
            ref={videoRef}
            playsInline
            muted
            className={`absolute inset-0 w-full h-full object-cover sm:object-contain bg-black ${
              mirrorVideo ? 'scale-x-[-1]' : ''
            }`}
          />
          <canvas
            ref={canvasRef}
            className={`absolute inset-0 w-full h-full object-cover sm:object-contain pointer-events-none ${
              mirrorVideo ? 'scale-x-[-1]' : ''
            }`}
          />

          {!isCameraActive && (
            <div className="text-slate-500 text-xs text-center z-10 p-4 max-w-xs">
              <Activity className="w-7 h-7 text-slate-600 mx-auto mb-2 animate-pulse" />
              <p>{isLoadingModel ? 'Preparing MediaPipe AI Engine...' : 'Tap Live Camera or Upload Video to Start Session'}</p>
            </div>
          )}
        </div>

        {/* Right Dashboard */}
        <div className="space-y-3">
          {/* Target Fighter Picker */}
          <div className="bg-slate-900/50 border border-slate-900 rounded-xl p-3">
            <label className="text-[10px] text-slate-500 flex items-center gap-1 mb-1.5 uppercase tracking-wider">
              <UserCheck className="w-3.5 h-3.5 text-slate-400" /> Archetype Profile
            </label>
            <select
              value={selectedFighter}
              onChange={(e) => {
                setSelectedFighter(e.target.value);
                if (e.target.value === 'ggg') setActiveTheme('ggg');
                else if (e.target.value === 'loma') setActiveTheme('loma');
                else setActiveTheme('bivol');
              }}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2 focus:outline-none"
            >
              {Object.values(FIGHTER_STYLES).map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.nickname})
                </option>
              ))}
            </select>
          </div>

          {/* Telemetry Counter */}
          <div className="bg-slate-900/50 border border-slate-900 rounded-xl p-3">
            <span className="text-[10px] text-slate-500 flex items-center gap-1 mb-2 uppercase tracking-wider">
              <Target className="w-3.5 h-3.5 text-slate-500" /> Punch Counter
            </span>

            <div className="grid grid-cols-2 gap-2 text-center mb-2">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-900">
                <span className={`text-2xl font-extrabold ${currentTheme.primary}`}>{jabs}</span>
                <p className="text-[9px] text-slate-500 mt-0.5">JABS</p>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-900">
                <span className="text-2xl font-extrabold text-slate-400">{crosses}</span>
                <p className="text-[9px] text-slate-500 mt-0.5">CROSSES</p>
              </div>
            </div>

            {lastPunch && (
              <div className="bg-slate-950 p-2 rounded border border-slate-900 text-[11px] flex justify-between items-center">
                <span className="text-slate-400">
                  Last: <strong className={`${currentTheme.primary} uppercase`}>{lastPunch.type}</strong>
                </span>
                <span className="text-slate-500 text-[10px]">
                  {lastPunch.peakVelocity} m/s | {lastPunch.elbowAngle}°
                </span>
              </div>
            )}
          </div>

          {/* User Profile Adaptation Trends */}
          <div className="bg-slate-900/50 border border-slate-900 rounded-xl p-3 text-xs space-y-1.5">
            <span className="text-[10px] text-slate-500 flex items-center gap-1 uppercase tracking-wider">
              <TrendingUp className="w-3.5 h-3.5 text-slate-400" /> Personal Baseline Profile
            </span>
            <div className="flex justify-between text-slate-400">
              <span>Recorded Punches:</span>
              <strong className="text-slate-200">{userStats.samplesCount}</strong>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Avg Extension (Jab/Cross):</span>
              <strong className="text-slate-200">{userStats.avgJabAngle}° / {userStats.avgCrossAngle}°</strong>
            </div>
          </div>

          {/* Real-time AI Diagnostic Alert */}
          {aiAdvice && (
            <div className={`p-3 rounded-xl border text-xs ${
              aiAdvice.severity === 'critical'
                ? 'bg-red-950/30 border-red-900/50 text-red-300'
                : aiAdvice.severity === 'warning'
                ? 'bg-amber-950/30 border-amber-900/50 text-amber-300'
                : 'bg-emerald-950/30 border-emerald-900/50 text-emerald-300'
            }`}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">{aiAdvice.metricName}</span>
                <span className="font-mono font-bold">{aiAdvice.score}%</span>
              </div>
              <p className="leading-relaxed opacity-90">{aiAdvice.feedback}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
