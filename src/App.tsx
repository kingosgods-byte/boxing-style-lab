import React, { useState, useRef, useEffect } from 'react';
import { Target, Activity, Award, Shield } from 'lucide-react';
import { SovietPunchAnalyzer, PunchEvent } from './engine/punchDetector';

export default function App() {
  const [jabs, setJabs] = useState<number>(0);
  const [crosses, setCrosses] = useState<number>(0);
  const [lastPunch, setLastPunch] = useState<PunchEvent | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<'bivol' | 'beterbiev' | 'loma'>('bivol');

  // Persistent reference to our Soviet Punch Analyzer
  const analyzerRef = useRef<SovietPunchAnalyzer>(new SovietPunchAnalyzer());

  // This function gets called whenever MediaPipe produces landmark frame data
  const handlePoseFrame = (landmarks: any[]) => {
    if (!landmarks || landmarks.length === 0) return;

    const punch = analyzerRef.current.processFrame(landmarks, performance.now());
    if (punch) {
      setLastPunch(punch);
      if (punch.type === 'jab') {
        setJabs((prev) => prev + 1);
      } else if (punch.type === 'cross') {
        setCrosses((prev) => prev + 1);
      }
    }
  };

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen p-6 font-mono">
      {/* Header Controls */}
      <header className="flex justify-between items-center border-b border-slate-800 pb-4 mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-wider text-cyan-400">BIVOL BOXING LAB</h1>
          <p className="text-xs text-slate-400">Soviet Biomechanics & Velocity-Filtered Kinetic Engine</p>
        </div>

        {/* Archetype Selector */}
        <div className="flex gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800">
          {[
            { id: 'bivol', name: 'Bivol (Distance)' },
            { id: 'beterbiev', name: 'Beterbiev (Pressure)' },
            { id: 'loma', name: 'Lomachenko (Angles)' }
          ].map((style) => (
            <button
              key={style.id}
              onClick={() => setSelectedStyle(style.id as any)}
              className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                selectedStyle === style.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {style.name}
            </button>
          ))}
        </div>
      </header>

      {/* Main Grid: Video/Pose Stream + Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera / Visual Feed Container */}
        <div className="lg:col-span-2 relative bg-slate-900 rounded-xl border border-slate-800 overflow-hidden min-h-[480px] flex items-center justify-center">
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            <span className="bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] px-2 py-1 rounded flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> LIVE ANALYSIS
            </span>
            <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-1 rounded">
              MODEL: MediaPipe 3D Pose
            </span>
          </div>

          <div className="text-slate-500 text-sm text-center">
            <Activity className="w-8 h-8 text-cyan-400 mx-auto mb-2 animate-bounce" />
            <p>Connect video stream or webcam feed</p>
          </div>
        </div>

        {/* Real-time Punch Metrics Panel */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Target className="w-4 h-4 text-cyan-400" /> PUNCH COUNTER
              </span>
              <span className="text-[10px] bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800">
                STATE MACHINE ACTIVE
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

            {/* Latest Punch Event Banner */}
            {lastPunch && (
              <div className="bg-slate-950 p-2.5 rounded border border-cyan-500/30 text-xs flex justify-between items-center">
                <span className="text-slate-300">
                  Last Punch: <strong className="text-cyan-400 uppercase">{lastPunch.arm} {lastPunch.type}</strong>
                </span>
                <span className="text-slate-400 text-[10px]">
                  Vel: {lastPunch.peakVelocity} m/s
                </span>
              </div>
            )}
          </div>

          {/* Soviet Index Indicators */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="text-xs text-slate-400 flex items-center gap-1 mb-2">
              <Award className="w-4 h-4 text-amber-400" /> SOVIET METRIC BENCHMARKS
            </h3>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Lead Hand Ratio</span>
                <span className="text-cyan-400 font-bold">
                  {jabs + crosses > 0 ? Math.round((jabs / (jabs + crosses)) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-500 h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${jabs + crosses > 0 ? (jabs / (jabs + crosses)) * 100 : 0}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
