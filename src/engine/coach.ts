import { Metrics, Punch, StyleProfile } from "../types";
import { STYLES } from "../data/styles";

export function coach(metrics:Metrics, style:StyleProfile, punch?:Punch){
  const messages:string[]=[];
  if(metrics.headDrift>8) messages.push("Your head is drifting forward. Keep the head stacked over the base instead of reaching with the upper body.");
  if(metrics.footwork<78) messages.push("Your base is traveling too much. Use smaller steps and recover underneath your hips.");
  if(metrics.guard<80) messages.push("Your hands are getting away from the guard position. Finish the action with the hands ready for the next shot.");
  if(metrics.balance<82) messages.push("Balance is the priority. Slow the movement down until the stance remains stable.");
  if(punch && punch.speed>3.5 && punch.extension<70) messages.push("You are creating speed without full extension. Do not chase the speed number; make the line of the punch cleaner first.");
  if(!messages.length) messages.push(style.cues[Math.floor(Date.now()/5000)%style.cues.length]);
  return messages[0];
}
export function compareStyle(metrics:Metrics,style:StyleProfile){
  const target = style.name.startsWith("Bivol") ? {form:90,footwork:91,guard:91,balance:93} :
    style.name.startsWith("GGG") ? {form:87,footwork:84,guard:89,balance:90} :
    {form:88,footwork:88,guard:88,balance:90};
  return {
    form:Math.round(metrics.form-target.form),
    footwork:Math.round(metrics.footwork-target.footwork),
    guard:Math.round(metrics.guard-target.guard),
    balance:Math.round(metrics.balance-target.balance)
  };
}
export { STYLES };
