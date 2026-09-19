import React, { useState, useRef, useEffect } from 'react';
import { Target, Activity, RotateCcw, Camera, Upload, Settings, UserCheck, TrendingUp, X, Sliders, Volume2, VolumeX, Cpu } from 'lucide-react';
import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { SovietPunchAnalyzer, PunchEvent } from './engine/punchDetector';
import { AICoachEngine, AIAdvice } from './engine/aiCoachEngine';
import { FIGHTER_STYLES, StyleProfile } from './engine/styleProfiles';
import { UserDataEngine, UserStats } from './engine/userDataEngine';

type Theme = 'bivol' | 'ggg' | 'loma';

interface ThemeConfig {
  primary: string;
  accentHex: string;
  badgeBg: string;
}

const THEMES: Record<Theme, ThemeConfig> = {
  bivol: { primary: 'text-cyan-400', accentHex: '#06b6d4', badgeBg: 'bg-cyan-950/80 text-cyan-400 border-cyan-800' },
  ggg: { primary: 'text-red-500', accentHex: '#ef4444', badgeBg: 'bg-red-950/80 text-red-400 border-red-800' },
  loma: { primary: 'text-amber-400', accentHex: '#f59e0b', badgeBg: 'bg-amber-950/80 text-amber-400 border-amber-800' }
};

export default function App() {
  const [jabs, setJabs] = useState<number>(0);
  const [crosses, setCrosses] = useState<number>(0);
  const [lastPunch, setLastPunch] = useState<PunchEvent | null>(null);
  const [aiAdvice, setAiAdvice] = useState<AIAdvice | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isLoadingModel, setIsLoadingModel] = useState<boolean>(true);

  // Brawler-style Settings State
  const [selectedFighter, setSelectedFighter] = useState<string>('bivol');
  const [activeTheme, setActiveTheme] = useState<Theme>('bivol');
  const [showSettingsDrawer, setShowSettingsDrawer] = useState<boolean>(false);
  
  // Custom Controls
  const [mirrorVideo, setMirrorVideo] = useState<boolean>(true);
  const [showSkeleton, setShowSkeleton] = useState<boolean>(true);
  const [audioFeedback, setAudioFeedback] = useState<boolean>(true);
  const [cameraQuality, setCameraQuality] = useState<'720p' | '1080p'>('720p');

  // User Profile Learning Memory
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
        console.error('Failed to load MediaPipe PoseLandmarker:', err);
      }
    }
    initMediaPipe();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const speakFeedback = (text: string) => {
    if (!audioFeedback || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

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

              userDataRef.current.saveSample({
                timestamp: Date.now(),
                type: punch.type === 'jab' ? 'jab' : 'cross',
                elbowAngle: punch.elbowAngle,
                peakVelocity: punch.peakVelocity
              });
              const updatedStats = userDataRef.current.getUserStats();
              setUserStats(updatedStats);

              const advice = aiCoachRef.current.evaluatePunch(
                punch.type === 'jab' ? 'jab' : 'cross',
                landmarks,
                punch.elbowAngle,
                punch.peakVelocity,
                selectedFighter,
                updatedStats
              );
              if (advice) {
                setAiAdvice(advice);
                speakFeedback(advice.feedback);
              }
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
      const targetWidth = cameraQuality === '1080p' ? 1920 : 1280;
      const targetHeight = cameraQuality === '1080p' ? 1080 : 720;

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'user',
          width: { ideal: targetWidth },
          height: { ideal: targetHeight },
          frameRate: { ideal: 60 }
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
      alert('Camera access failed. Check device permissions.');
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
    ctx.lineWidth = Math.max(2, Math.round(width / 280));

    const drawLine = (p1: number, p2: number) => {
      if (landmarks[p1].visibility > 0.4 && landmarks[p2].visibility > 0.4) {
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

  return (
    <div className="bg-slate-950 text-slate-300 min-h-screen p-2 sm:p-5 font-mono relative overflow-x-hidden selection:bg-slate-800">
      
      {/* Top Header Navigation */}
      <header className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2.5 border-b border-slate-900 pb-3 mb-3 sm:mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-slate-900 rounded-lg border border-slate-800">
            <Cpu className={`w-5 h-5 ${currentTheme.primary}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-base sm:text-lg font-bold tracking-wider uppercase ${currentTheme.primary}`}>
                BRAWLER LABS
              </h1>
              <span className={`text-[9px] px-2 py-0.5 rounded border font-semibold ${currentTheme.badgeBg}`}>
                PRO EDITION
              </span>
            </div>
            <p className="text-[10px] text-slate-500">Real Fighter Kinetic Intelligence</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-4 gap-1.5 sm:flex sm:items-center sm:gap-2">
          <button
            onClick={startCamera}
            disabled={isLoadingModel}
            className="flex items-center justify-center gap-1 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-semibold rounded-lg transition-all"
          >
            <Camera className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Camera</span>
          </button>

          <label className="flex items-center justify-center gap-1 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-semibold rounded-lg cursor-pointer transition-all">
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Upload</span>
            <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
          </label>

          <button
            onClick={() => setShowSettingsDrawer(true)}
            className="flex items-center justify-center p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg transition-all relative"
            title="App Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={handleReset}
            className="flex items-center justify-center p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 rounded-lg transition-all"
            title="Reset Session"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-5">
        
        {/* Mobile & Desktop Video Canvas Window */}
        <div className="lg:col-span-2 relative bg-slate-900/90 rounded-2xl border border-slate-900 overflow-hidden w-full aspect-[3/4] sm:aspect-video flex items-center justify-center shadow-2xl">
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
              <Activity className="w-8 h-8 text-slate-600 mx-auto mb-2 animate-pulse" />
              <p className="leading-relaxed">
                {isLoadingModel ? 'Initializing MediaPipe AI Engine...' : 'Tap Camera or Upload to Start Real-Time Kinetic Analysis'}
              </p>
            </div>
          )}

          {/* Real-time Overlay Status Pill */}
          {isCameraActive && (
            <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-800/80 text-[10px] text-slate-300 flex items-center gap-1.5 z-20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              LIVE TELEMETRY
            </div>
          )}
        </div>

        {/* Dashboard Right Sidebar */}
        <div className="space-y-3">
          
          {/* Active Target Fighter Benchmark */}
          <div className="bg-slate-900/60 border border-slate-900 rounded-xl p-3.5 space-y-2">
            <label className="text-[10px] text-slate-500 flex items-center gap-1 uppercase tracking-wider font-bold">
              <UserCheck className="w-3.5 h-3.5 text-slate-400" /> Target Fighter Archetype
            </label>
            <select
              value={selectedFighter}
              onChange={(e) => {
                setSelectedFighter(e.target.value);
                if (e.target.value === 'ggg') setActiveTheme('ggg');
                else if (e.target.value === 'loma') setActiveTheme('loma');
                else setActiveTheme('bivol');
              }}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-slate-700"
            >
              {Object.values(FIGHTER_STYLES).map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.nickname})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 leading-normal">
              {currentFighter.description}
            </p>
          </div>

          {/* Punch Telemetry */}
          <div className="bg-slate-900/60 border border-slate-900 rounded-xl p-3.5">
            <span className="text-[10px] text-slate-500 flex items-center gap-1 mb-2.5 uppercase tracking-wider font-bold">
              <Target className="w-3.5 h-3.5 text-slate-500" /> Kinetic Session Stats
            </span>

            <div className="grid grid-cols-2 gap-2.5 text-center mb-3">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-900">
                <span className={`text-2xl sm:text-3xl font-extrabold ${currentTheme.primary}`}>{jabs}</span>
                <p className="text-[10px] text-slate-500 mt-0.5">LEAD JABS</p>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-900">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-300">{crosses}</span>
                <p className="text-[10px] text-slate-500 mt-0.5">CROSSES</p>
              </div>
            </div>

            {lastPunch && (
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-900 text-xs flex justify-between items-center">
                <span className="text-slate-400">
                  Apex: <strong className={`${currentTheme.primary} uppercase`}>{lastPunch.type}</strong>
                </span>
                <span className="text-slate-400 text-[11px]">
                  {lastPunch.peakVelocity} m/s | {lastPunch.elbowAngle}°
                </span>
              </div>
            )}
          </div>

          {/* Personalized Continuous Learning Memory */}
          <div className="bg-slate-900/60 border border-slate-900 rounded-xl p-3.5 text-xs space-y-2">
            <span className="text-[10px] text-slate-500 flex items-center gap-1 uppercase tracking-wider font-bold">
              <TrendingUp className="w-3.5 h-3.5 text-slate-400" /> Continuous User Memory
            </span>
            <div className="flex justify-between text-slate-400">
              <span>Saved Punches:</span>
              <strong className="text-slate-200 font-mono">{userStats.samplesCount}</strong>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Personal Extension Averages:</span>
              <strong className="text-slate-200 font-mono">{userStats.avgJabAngle}° Jab / {userStats.avgCrossAngle}° Cross</strong>
            </div>
          </div>

          {/* AI Diagnostic Alert */}
          {aiAdvice && (
            <div className={`p-3.5 rounded-xl border transition-all duration-300 ${
              aiAdvice.severity === 'critical'
                ? 'bg-red-950/30 border-red-900/50 text-red-300'
                : aiAdvice.severity === 'warning'
                ? 'bg-amber-950/30 border-amber-900/50 text-amber-300'
                : 'bg-emerald-950/30 border-emerald-900/50 text-emerald-300'
            }`}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">{aiAdvice.metricName}</span>
                <span className="font-mono font-bold text-xs">{aiAdvice.score}% Match</span>
              </div>
              <p className="text-xs leading-relaxed opacity-90">{aiAdvice.feedback}</p>
            </div>
          )}
        </div>
      </div>

      {/* Brawler-Style Sliding App Settings Drawer */}
      {showSettingsDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm transition-all">
          <div className="w-full max-w-md bg-slate-950 border-l border-slate-800 h-full p-5 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-5">
              
              {/* Drawer Header */}
              <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-slate-400" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">Brawler Preferences</h2>
                </div>
                <button
                  onClick={() => setShowSettingsDrawer(false)}
                  className="p-1.5 text-slate-500 hover:text-slate-300 bg-slate-900 rounded-lg border border-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Theme Selector */}
              <div className="space-y-2">
                <label className="text-xs text-slate-500 block uppercase font-bold">Theme Palette</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['bivol', 'ggg', 'loma'] as Theme[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setActiveTheme(t)}
                      className={`py-2 px-3 rounded-lg border text-xs capitalize transition-all ${
                        activeTheme === t
                          ? 'bg-slate-900 border-slate-700 text-slate-100 font-bold'
                          : 'bg-slate-950 border-slate-900 text-slate-500 hover:text-slate-400'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Speech AI Settings */}
              <div className="space-y-2">
                <label className="text-xs text-slate-500 block uppercase font-bold">Voice Coaching & Audio</label>
                <button
                  onClick={() => setAudioFeedback(!audioFeedback)}
                  className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-left flex justify-between items-center"
                >
                  <div className="flex items-center gap-2">
                    {audioFeedback ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                    <span className="text-xs text-slate-300">Live Voice Correction</span>
                  </div>
                  <span className={`text-xs font-bold ${audioFeedback ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {audioFeedback ? 'ENABLED' : 'MUTED'}
                  </span>
                </button>
              </div>

              {/* Camera Preferences */}
              <div className="space-y-2">
                <label className="text-xs text-slate-500 block uppercase font-bold">Camera Feed Controls</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setMirrorVideo(!mirrorVideo)}
                    className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-left"
                  >
                    <div className="text-[10px] text-slate-500">Mirror Feed</div>
                    <div className="text-xs font-bold text-slate-200 mt-0.5">{mirrorVideo ? 'ACTIVE' : 'OFF'}</div>
                  </button>
                  <button
                    onClick={() => setShowSkeleton(!showSkeleton)}
                    className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-left"
                  >
                    <div className="text-[10px] text-slate-500">Skeleton Wireframe</div>
                    <div className="text-xs font-bold text-slate-200 mt-0.5">{showSkeleton ? 'VISIBLE' : 'HIDDEN'}</div>
                  </button>
                </div>
              </div>

              {/* Quality Preset */}
              <div className="space-y-2">
                <label className="text-xs text-slate-500 block uppercase font-bold">Target Resolution</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['720p', '1080p'] as const).map((q) => (
                    <button
                      key={q}
                      onClick={() => setCameraQuality(q)}
                      className={`p-2.5 rounded-xl border text-xs text-center font-bold transition-all ${
                        cameraQuality === q
                          ? 'bg-slate-900 border-slate-700 text-slate-200'
                          : 'bg-slate-950 border-slate-900 text-slate-500'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* User Profile Reset */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    userDataRef.current.clearData();
                    setUserStats(userDataRef.current.getUserStats());
                    alert('Local user memory cleared.');
                  }}
                  className="w-full p-3 bg-red-950/30 border border-red-900/50 text-red-400 rounded-xl text-xs font-bold text-center hover:bg-red-950/50 transition-all"
                >
                  Reset User Training Memory
                </button>
              </div>
            </div>

            <div className="text-[10px] text-slate-600 text-center border-t border-slate-900 pt-3">
              Brawler Boxing Labs v2.0 • On-Device Biomechanical Learning
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
