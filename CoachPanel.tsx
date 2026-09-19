import { StyleProfile } from "../types";
export default function CoachPanel({style,message}:{style:StyleProfile,message:string}){
 return <section className="coach">
   <div className="eyebrow">COACHING ENGINE</div>
   <h2>{style.name}</h2>
   <p className="coach-message">“{message}”</p>
   <div className="coach-grid">{style.priorities.map(x=><span key={x}>{x}</span>)}</div>
 </section>
}