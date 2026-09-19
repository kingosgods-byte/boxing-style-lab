export default function MetricCard({label,value,unit=""}:{label:string,value:number|string,unit?:string}){
 return <div className="metric"><span>{label}</span><strong>{value}{unit}</strong></div>
}