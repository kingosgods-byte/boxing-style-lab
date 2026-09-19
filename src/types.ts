export type Landmark = { x:number; y:number; z:number; visibility?:number };
export type Metrics = {
  form:number; footwork:number; guard:number; balance:number; speed:number;
  punches:number; peakSpeed:number; stanceWidth:number; headDrift:number;
  recoveryMs:number; footDrift:number;
};
export type StyleProfile = {
  name:string; description:string;
  priorities:string[];
  cues:string[];
};
export type Punch = {
  type:string; hand:"lead"|"rear"; speed:number; duration:number;
  extension:number; headDrift:number; recovery:number; timestamp:number;
};
