import { Landmark, Metrics, Punch } from "../types";
import { clamp, dist, angle } from "./math";

export function analyzePose(l:Landmark[]):Metrics|null{
  if(!l || l.length<33) return null;
  const ls=l[11],rs=l[12],lh=l[23],rh=l[24],la=l[27],ra=l[28], nose=l[0];
  const lw=l[15],rw=l[16];
  const stanceWidth=dist(la,ra);
  const shoulderWidth=dist(ls,rs)||.2;
  const hipWidth=dist(lh,rh)||.2;
  const leftKnee=angle(lh,l[25],la);
  const rightKnee=angle(rh,l[26],ra);
  const balance=clamp(100-Math.abs(leftKnee-175)*.35-Math.abs(rightKnee-175)*.35);
  const guard=clamp(100-Math.min(dist(lw,ls),dist(rw,rs))*180);
  const footwork=clamp(100-Math.max(0,stanceWidth/shoulderWidth-1.7)*35);
  const form=clamp((balance+guard+footwork)/3);
  const headDrift=Math.abs(nose.x-(lh.x+rh.x)/2)*100;
  return {
    form,footwork,guard,balance,speed:0,punches:0,peakSpeed:0,
    stanceWidth:stanceWidth/hipWidth,headDrift,recoveryMs:0,footDrift:0
  };
}

export function detectPunch(
  previous:Landmark[]|null,current:Landmark[]|null,dt:number,now:number
):Punch|null{
  if(!previous||!current||current.length<33||previous.length<33||dt<=0) return null;
  const candidates=[
    {i:15,hand:"lead" as const},{i:16,hand:"rear" as const}
  ];
  let best:Punch|null=null;
  for(const c of candidates){
    const d=dist(previous[c.i],current[c.i]);
    const speed=d/dt;
    if(speed>1.7){
      const shoulder=c.hand==="lead"?current[11]:current[12];
      const extension=clamp(100*(1-Math.min(1,dist(current[c.i],shoulder)/.65)));
      best={type:"Straight",hand:c.hand,speed,duration:dt*1000,extension,headDrift:0,recovery:0,timestamp:now};
    }
  }
  return best;
}