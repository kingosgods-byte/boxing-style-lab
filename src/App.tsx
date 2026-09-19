import React, { useState, useRef, useEffect } from 'react';
import { Target, Activity, Award, RotateCcw, Camera, Upload } from 'lucide-react';
import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { SovietPunchAnalyzer, PunchEvent } from './engine/punchDetector';
import { AICoachEngine, AIAdvice } from './engine/aiCoachEngine';

export default function App() {
  const [jabs, setJabs] = useState<number>(0);
  const [crosses, setCrosses] = useState<number>(0);
  const [lastPunch, setLastPunch] = useState<PunchEvent | null>(null);
  const [aiAdvice, setAiAdvice] = useState<AIAdvice | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<'bivol' | 'beterbiev' | 'loma'>('bivol');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isLoadingModel, setIsLoadingModel] = useState<boolean>(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const analyzerRef = useRef<SovietPunchAnalyzer>(new SovietPunchAnalyzer());
  const aiCoachRef = useRef<AICoachEngine>(new AICoachEngine());

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
            drawSkeleton(ctx, landmarks, canvas.width, canvas.height);

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
      alert('Unable to access camera. Please check camera permissions.');
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

  // Draw 2D Pose Skeleton Overlay
  const drawSkeleton = (ctx: CanvasRenderingContext2D, landmarks: any[], width: number, height: number) => {
    ctx.strokeStyle = '#06b6d4'; // Cyan joints
    ctx.lineWidth = 3;

    // Left Arm (11 -> 13 -> 15)
    ctx.beginPath();
    ctx.moveTo(landmarks[11].x * width, landmarks[11].y * height);
    ctx.lineTo(landmarks[13].x * width, landmarks[13].y * height);
    ctx.lineTo(landmarks[15].x * width, landmarks[15].y * height);
    ctx.stroke();

    // Right Arm (12 -> 14 -> 16)
    ctx.strokeStyle = '#818cf8'; // Indigo joints
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
    <div className="bg-slate-950 text-slate-100 min-h-screen p-6 font-mono">
      {/* Header Bar */}
      <header className="flex justify-between items-center border-b border-slate-800 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <img
            src={`${import.meta.env.BASE_URL}logo.png`}
            alt="Bivol Boxing Lab"
            className="h-9 w-auto object-contain"
            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
          />
          <div>
            <h1 className="text-xl font-bold tracking-wider text-cyan-400">BIVOL BOXING LAB</h1>
            <p className="text-xs text-slate-400">Vector Biomechanics & Kinetic AI Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={startCamera}
            disabled={isLoadingModel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-xs font-semibold rounded-lg transition-all"
          >
            <Camera className="w-3.5 h-3.5" /> Live Camera
          </button>

          <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg cursor-pointer transition-all">
            <Upload className="w-3.5 h-3.5 text-slate-300" /> Upload Video
            <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
          </label>

          <button
            onClick={handleReset}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 border border-slate-800 rounded-lg transition-all"
            title="Reset Session Stats"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Container */}
        <div className="lg:col-span-2 relative bg-slate-900 rounded-xl border border-slate-800 overflow-hidden min-h-[480px] flex items-center justify-center">
          <video
            ref={videoRef}
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />

          {!isCameraActive && (
            <div className="text-slate-500 text-sm text-center z-10">
              <Activity className="w-8 h-8 text-cyan-400 mx-auto mb-2 animate-bounce" />
              <p>{isLoadingModel ? 'Loading MediaPipe Pose Model...' : 'Click "Live Camera" or "Upload Video" to start'}</p>
            </div>
          )}
        </div>

        {/* Dashboard Side Panel */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Target className="w-4 h-4 text-cyan-400" /> PUNCH TELEMETRY
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center mb-4">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                <span className="text-3xl font-extrabold text-cyan-400">{jabs}</span>
                <p className="text-[10px] text-slate-400 mt-1">LEAD JABS</p>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                <span className="text-3xl font-extrabold text-indigo-400">{crosses}</span>
                <p className="text-[10px] text-slate-400 mt-1">CROSSES</p>
              </div>
            </div>

            {lastPunch && (
              <div className="bg-slate-950 p-2.5 rounded border border-cyan-500/30 text-xs flex justify-between items-center">
                <span className="text-slate-300">
                  Last: <strong className="text-cyan-400 uppercase">{lastPunch.arm} {lastPunch.type}</strong>
                </span>
                <span className="text-slate-400 text-[10px]">
                  Vel: {lastPunch.peakVelocity} m/s | Angle: {lastPunch.elbowAngle}°
                </span>
              </div>
            )}
          </div>

          {aiAdvice && (
            <div className={`p-4 rounded-xl border transition-all duration-300 ${
              aiAdvice.severity === 'critical'
                ? 'bg-red-950/40 border-red-500/50 text-red-200'
                : aiAdvice.severity === 'warning'
                ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
            }`}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${
                    aiAdvice.severity === 'critical' ? 'bg-red-500 animate-ping' : 'bg-emerald-400'
                  }`} />
                  AI DIAGNOSTIC: {aiAdvice.metricName}
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-900/80 border border-slate-700">
                  Bivol Match: {aiAdvice.score}%
                </span>
              </div>
              <p className="text-xs leading-relaxed opacity-90">{aiAdvice.feedback}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
