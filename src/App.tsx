import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Play, Square, RotateCcw, Gauge, Footprints, Shield, Activity } from "lucide-react";
import { MediaPipeTracker } from "./tracking/MediaPipeTracker";
import { analyzePose, detectPunch } from "./engine/analyzer";
import { coach, compareStyle, STYLES } from "./engine/coach";
import { Landmark, Metrics, Punch } from "./types";
import MetricCard from "./components/MetricCard";
import CoachPanel from "./components/CoachPanel";
import SkeletonOverlay from "./components/SkeletonOverlay";

const empty:Metrics={form:0,footwork:0,guard:0,balance:0,speed:0,punches:0,peakSpeed:0,stanceWidth:0,headDrift:0,recoveryMs:0,footDrift:0};

export default function App(){
 const video=useRef<HTMLVideoElement>(null);
 const raf=useRef<number>(0);
 const tracker=useRef(new MediaPipeTracker());
 const previous=useRef<Landmark[]|null>(null);
 const [running,setRunning]=useState(false);
 const [ready,setReady]=useState(false);
 const [landmarks,setLandmarks]=useState<Landmark[]|null>(null);
 const [metrics,setMetrics]=useState<Metrics>(empty);
 const [styleKey,setStyleKey]=useState("bivol");
 const [lastPunch,setLastPunch]=useState<Punch>();
 const [error,setError]=useState("");

 const style=STYLES[styleKey];
 const message=useMemo(()=>coach(metrics,style,lastPunch),[metrics,style,lastPunch]);
 const delta=useMemo(()=>compareStyle(metrics,style),[metrics,style]);

 useEffect(()=>()=>{ if(raf.current) cancelAnimationFrame(raf.current); },[]);

 async function start(){
   try{
    setError("");
    if(!video.current) return;
    const stream=await navigator.mediaDevices.getUserMedia({video:{width:1280,height:720,facingMode:"user"},audio:false});
    video.current.srcObject=stream;
    await video.current.play();
    if(!ready){ await tracker.current.init(); setReady(true); }
    setRunning(true);
    loop();
   }catch(e){ setError("Camera or model initialization failed. Use HTTPS/localhost and allow camera access."); }
 }
 function stop(){
   setRunning(false);
   if(raf.current) cancelAnimationFrame(raf.current);
   const s=video.current?.srcObject as MediaStream|null;
   s?.getTracks().forEach(t=>t.stop());
 }
 function reset(){setMetrics(empty);setLastPunch(undefined);setLandmarks(null);previous.current=null;}
 function loop(){
   if(!video.current || !tracker.current.pose) return;
   const now=performance.now();
   const lm=tracker.current.detect(video.current,now);
   if(lm){
     const m=analyzePose(lm);
     if(m){
       const punch=detectPunch(previous.current,lm,1/30,now);
       if(punch){
         setLastPunch(punch);
         setMetrics(prev=>({...m,punches:prev.punches+1,peakSpeed:Math.max(prev.peakSpeed,punch.speed),speed:punch.speed}));
       } else setMetrics(prev=>({...m,speed:prev.speed*0.92,peakSpeed:prev.peakSpeed,punches:prev.punches}));
     }
     previous.current=lm;
     setLandmarks(lm);
   }
   raf.current=requestAnimationFrame(loop);
 }
 return <div className="app">
   <header>
    <div><div className="brand">BIVOL <span>BOXING LAB</span></div><div className="sub">REAL-TIME BIOMECHANICS COACH</div></div>
    <div className={`status ${running?"live":""}`}><i/> {running?"LIVE TRACKING":"READY"}</div>
   </header>
   <main>
    <section className="camera-card">
      <div className="camera-wrap">
       <video ref={video} muted playsInline className="video"/>
       <SkeletonOverlay landmarks={landmarks}/>
       {!running && <div className="camera-empty"><Camera size={44}/><h2>Enter the Lab</h2><p>Camera-based pose, hand and foot analysis</p></div>}
       <div className="camera-badge">POSE • FEET • HANDS</div>
      </div>
      <div className="controls">
       {!running ? <button className="primary" onClick={start}><Play size={17}/> Start Session</button> :
       <button className="danger" onClick={stop}><Square size={16}/> Stop</button>}
       <button onClick={reset}><RotateCcw size={16}/> Reset</button>
       <label>REFERENCE STYLE
        <select value={styleKey} onChange={e=>setStyleKey(e.target.value)}>
         {Object.entries(STYLES).map(([k,v])=><option value={k} key={k}>{v.name}</option>)}
        </select>
       </label>
      </div>
      {error && <div className="error">{error}</div>}
    </section>

    <aside>
      <div className="section-title">LIVE METRICS</div>
      <div className="metric-grid">
       <MetricCard label="FORM" value={Math.round(metrics.form)}/>
       <MetricCard label="FOOTWORK" value={Math.round(metrics.footwork)}/>
       <MetricCard label="GUARD" value={Math.round(metrics.guard)}/>
       <MetricCard label="BALANCE" value={Math.round(metrics.balance)}/>
       <MetricCard label="PUNCH SPEED" value={metrics.speed.toFixed(2)} unit=" m/s"/>
       <MetricCard label="PEAK SPEED" value={metrics.peakSpeed.toFixed(2)} unit=" m/s"/>
       <MetricCard label="PUNCHES" value={metrics.punches}/>
       <MetricCard label="HEAD DRIFT" value={metrics.headDrift.toFixed(1)} unit=" cm*"/>
      </div>
      <div className="style-box">
       <div className="eyebrow">STYLE GAP</div>
       <h3>{style.name}</h3>
       <div className="gap"><span>Form</span><b>{delta.form>0?"+":""}{delta.form}</b></div>
       <div className="gap"><span>Footwork</span><b>{delta.footwork>0?"+":""}{delta.footwork}</b></div>
       <div className="gap"><span>Guard</span><b>{delta.guard>0?"+":""}{delta.guard}</b></div>
       <div className="gap"><span>Balance</span><b>{delta.balance>0?"+":""}{delta.balance}</b></div>
      </div>
    </aside>

    <CoachPanel style={style} message={message}/>

    <section className="analysis">
      <div className="section-title">CURRENT ACTION</div>
      <div className="action-row">
       <div><Activity/><span>{lastPunch?.type || "Waiting"}</span><small>{lastPunch?lastPunch.hand.toUpperCase()+" HAND":"Throw a punch"}</small></div>
       <div><Gauge/><span>{lastPunch?lastPunch.speed.toFixed(2):"—"} m/s</span><small>PEAK VELOCITY</small></div>
       <div><Footprints/><span>{metrics.footwork.toFixed(0)}</span><small>FOOTWORK SCORE</small></div>
       <div><Shield/><span>{metrics.guard.toFixed(0)}</span><small>GUARD SCORE</small></div>
      </div>
    </section>
   </main>
   <footer>Biomechanics reference system • *camera-based estimates are normalized and should not be treated as laboratory measurements.</footer>
 </div>
}
