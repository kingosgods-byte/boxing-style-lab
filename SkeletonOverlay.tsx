import React from "react";
import { Landmark } from "../types";
const edges=[[11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24],[23,25],[25,27],[24,26],[26,28],[27,29],[28,30],[29,31],[30,32]];
export default function SkeletonOverlay({landmarks}:{landmarks:Landmark[]|null}){
 if(!landmarks) return null;
 return <svg className="skeleton" viewBox="0 0 1 1" preserveAspectRatio="none">
  {edges.map(([a,b])=><line key={`${a}-${b}`} x1={landmarks[a].x} y1={landmarks[a].y} x2={landmarks[b].x} y2={landmarks[b].y}/>)}
  {landmarks.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r=".012"/>)}
 </svg>
}