import { useEffect, useRef, useState } from "react";
import { Activity, Camera, CheckCircle2, Cpu, Gauge, ShieldCheck, Upload, Zap } from "lucide-react";
import { MediaPipeTracker } from "../tracking/MediaPipeTracker";
import { fuseTrackers } from "../tracking/TrackerFusion";
import { analyzeBiomechanics, type BiomechanicsSnapshot } from "../biomechanics/metrics";
import { detectPunch, type PunchEvent } from "../boxing/punchEngine";
import { runCoachCouncil, type CoachReport } from "../intelligence/coachEngine";
import { fighters } from "../fighters/fighterDatabase";
import { runHealthChecks } from "../engineering/health";
import type { Landmark } from "../tracking/TrackerTypes";

const edges = [[11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24],[23,25],[25,27],[24,26],[26,28]];

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trackerRef = useRef<MediaPipeTracker | null>(null);
  const previousRef = useRef<Landmark[] | null>(null);
  const frameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [trackerState, setTrackerState] = useState("Standby");
  const [fusion, setFusion] = useState(0);
  const [metrics, setMetrics] = useState<BiomechanicsSnapshot>({ posture: 0, balance: 0, rotation: 0, extension: 0, kineticChain: 0 });
  const [punches, setPunches] = useState(0);
  const [lastPunch, setLastPunch] = useState<PunchEvent | null>(null);
  const [coach, setCoach] = useState<CoachReport>({ headline: "Head Coach", feedback: "Start the camera to begin multi-layer analysis.", confidence: 0, agents: ["Head Coach"] });
  const health = runHealthChecks();

  useEffect(() => () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); streamRef.current?.getTracks().forEach(t => t.stop()); }, []);

  async function startCamera() {
    try {
      setTrackerState("Requesting camera…");
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      if (!trackerRef.current) {
        const tracker = new MediaPipeTracker();
        setTrackerState("Loading primary tracker…");
        await tracker.init();
        trackerRef.current = tracker;
      }
      setCameraOn(true); setTrackerState("Live • fusion ready");
      processFrame();
    } catch (error) {
      setTrackerState(`Startup failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  function processFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const tracker = trackerRef.current;
    if (!video || !canvas || !tracker || video.readyState < 2) { frameRef.current = requestAnimationFrame(processFrame); return; }
    const result = tracker.detect(video, performance.now());
    const fused = fuseTrackers([result]);
    setFusion(fused.confidence);
    if (fused.landmarks) {
      const b = analyzeBiomechanics(fused.landmarks); setMetrics(b);
      const punch = detectPunch(fused.landmarks, previousRef.current, fused.timestamp);
      if (punch) { setPunches(v => v + 1); setLastPunch(punch); setCoach(runCoachCouncil(b, punch)); }
      previousRef.current = fused.landmarks;
      draw(canvas, fused.landmarks);
    }
    frameRef.current = requestAnimationFrame(processFrame);
  }

  function draw(canvas: HTMLCanvasElement, points: Landmark[]) {
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const video = videoRef.current; canvas.width = video?.videoWidth || 1280; canvas.height = video?.videoHeight || 720;
    ctx.clearRect(0,0,canvas.width,canvas.height); ctx.lineWidth = 4; ctx.strokeStyle = "#5eead4"; ctx.fillStyle = "#f8fafc";
    for (const [a,b] of edges) { if (!points[a] || !points[b]) continue; ctx.beginPath(); ctx.moveTo(points[a].x*canvas.width, points[a].y*canvas.height); ctx.lineTo(points[b].x*canvas.width, points[b].y*canvas.height); ctx.stroke(); }
    for (const p of points) { if ((p.visibility ?? 1) < .25) continue; ctx.beginPath(); ctx.arc(p.x*canvas.width,p.y*canvas.height,4,0,Math.PI*2); ctx.fill(); }
  }

  return <div className="app">
    <header className="topbar"><div><div className="eyebrow">BRAWLER LABS / BOXING INTELLIGENCE</div><h1>Biomechanics Lab <span>2.0</span></h1></div><div className="system-pill"><span className="pulse"/> {trackerState}</div></header>
    <main className="grid">
      <section className="hero panel"><div className="video-shell"><video ref={videoRef} muted playsInline className="video"/><canvas ref={canvasRef} className="video overlay"/><div className="video-empty">{cameraOn ? "" : <><Activity size={42}/><strong>Live movement viewport</strong><small>Multi-layer pose analysis begins here</small></>}</div></div><div className="controls"><button className="primary" onClick={startCamera}><Camera size={18}/> Start Camera</button><label className="secondary"><Upload size={18}/> Analyze Video<input type="file" accept="video/*" hidden onChange={() => setTrackerState("Video queued for analysis")}/></label><div className="live-status"><span className="dot"/> {trackerState}</div></div></section>
      <section className="panel score"><div className="section-title"><Gauge size={18}/> Fusion confidence</div><div className="big-number">{Math.round(fusion*100)}<span>%</span></div><div className="bar"><i style={{width:`${fusion*100}%`}}/></div><p>Confidence is based on tracker output and landmark agreement. More trackers can be enabled as secondary models.</p></section>
      <section className="panel"><div className="section-title"><Zap size={18}/> Live punches</div><div className="big-number">{punches}</div><div className="mini-grid"><Metric label="Last" value={lastPunch?.type.toUpperCase() ?? "—"}/><Metric label="Speed" value={lastPunch ? lastPunch.speed.toFixed(3) : "—"}/></div></section>
      <section className="panel wide"><div className="section-title"><Activity size={18}/> Biomechanics matrix</div><div className="metric-grid"><Metric label="Posture" value={`${metrics.posture}%`}/><Metric label="Balance" value={`${metrics.balance}%`}/><Metric label="Rotation" value={`${metrics.rotation}%`}/><Metric label="Extension" value={`${metrics.extension}%`}/><Metric label="Kinetic chain" value={`${metrics.kineticChain}%`}/></div></section>
      <section className="panel coach"><div className="section-title"><Cpu size={18}/> Coach council</div><h2>{coach.headline}</h2><p>{coach.feedback}</p><div className="agent-row">{coach.agents.map(a => <span key={a}>{a}</span>)}</div></section>
      <section className="panel"><div className="section-title"><ShieldCheck size={18}/> Engineering health</div>{health.map(h => <div className="health" key={h.id}><CheckCircle2 size={15}/><div><b>{h.name}</b><small>{h.detail}</small></div></div>)}</section>
      <section className="panel wide"><div className="section-title">Fighter reference library</div><div className="fighters">{fighters.map(f => <div className="fighter" key={f.name}><b>{f.name}</b><small>{f.stance} · {f.traits.slice(0,2).join(" · ")}</small><em>{f.provenance}</em></div>)}</div></section>
    </main>
    <footer>Self-repair architecture: diagnostics → proposed repair → verification → safe deployment. No secret credentials belong in this public client.</footer>
  </div>;
}

function Metric({label,value}:{label:string;value:string}) { return <div className="metric"><small>{label}</small><strong>{value}</strong></div>; }
