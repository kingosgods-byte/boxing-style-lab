import { Landmark } from "../types";

export function dist(a:Landmark,b:Landmark){
  return Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
}
export function angle(a:Landmark,b:Landmark,c:Landmark){
  const ab={x:a.x-b.x,y:a.y-b.y,z:a.z-b.z};
  const cb={x:c.x-b.x,y:c.y-b.y,z:c.z-b.z};
  const dot=ab.x*cb.x+ab.y*cb.y+ab.z*cb.z;
  const mag=Math.hypot(ab.x,ab.y,ab.z)*Math.hypot(cb.x,cb.y,cb.z);
  return mag ? Math.acos(Math.max(-1,Math.min(1,dot/mag)))*180/Math.PI : 0;
}
export function clamp(v:number,min=0,max=100){ return Math.max(min,Math.min(max,v)); }
export function smooth(prev:number,next:number,a=.25){ return prev+(next-prev)*a; }