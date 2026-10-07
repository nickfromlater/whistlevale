'use strict';

// COMET: a genuinely three-dimensional closed ribbon, not a flattened railway.
// Frames are authored through the inversion; a world-up Frenet frame would flip.
function orreryBezier(a,b,c,d,t){
 const u=1-t;
 return {p:a.map((v,i)=>u*u*u*v+3*u*u*t*b[i]+3*u*t*t*c[i]+t*t*t*d[i]),f:a.map((v,i)=>3*u*u*(b[i]-v)+6*u*t*(c[i]-b[i])+3*t*t*(d[i]-c[i]))};
}
function orreryFrame(p,f,up=[0,1,0],bank=0){
 f=norm(f);let r=norm(cross(up,f)),u=cross(f,r);
 const co=Math.cos(bank),si=Math.sin(bank),rr=sub(mul(r,co),mul(u,si));
 u=add(mul(u,co),mul(r,si));return {p,f,r:rr,u};
}
function orreryMatrix(q,lift=0){
 const p=add(q.p,mul(q.u,lift));
 return new Float32Array([...q.r,0,...q.u,0,...q.f,0,...p,1]);
}
function buildOrreryRoute(){
 const sections=[],bezier=(name,points,bank=0)=>sections.push({name,sample:t=>{const q=orreryBezier(...points,t);return orreryFrame(q.p,q.f,[0,1,0],bank*Math.sin(PI*t)**2);}});
 bezier('Platform zero',[[-38,7,32],[-25,7,32],[-12,7,32],[0,7,32]]);
 bezier('Departure',[ [0,7,32],[26,7,32],[42,7,24],[42,10,10]],.30);
 bezier('Chain lift',[[42,10,10],[42,13,-4],[35,35,-31],[22,35,-31]]);
 bezier('Stardrop',[[22,35,-31],[2,35,-31],[0,5,-31],[-23,5,-31]]);
 bezier('The slingshot',[[-23,5,-31],[-36,5,-31],[-39,4,-24],[-39,4,-11]],-.46);
 sections.push({name:'Lunar loop',sample:t=>{const a=TAU*t;return orreryFrame([-39+6*t*t*(3-2*t),4+12*(1-Math.cos(a)),-11+12*Math.sin(a)],[36*t*(1-t),12*TAU*Math.sin(a),12*TAU*Math.cos(a)],[0,Math.cos(a),-Math.sin(a)]);}});
 bezier('Starlight bridge',[[-33,4,-11],[-33,4,9],[-14,13.3,17],[6,12,17]],-.22);
 sections.push({name:'Ring run',sample:t=>{const a=TAU*t;return orreryFrame([6+22*Math.sin(a),12-9*t+8*Math.sin(PI*t)**2,-5+22*Math.cos(a)],[22*TAU*Math.cos(a),-9+8*PI*Math.sin(TAU*t),-22*TAU*Math.sin(a)],[0,1,0],.48*Math.sin(PI*t)**2);}});
 bezier('Comet trail',[[6,3,17],[20,2.45,17],[34,3,25],[35,3,36]],.20);
 bezier('Homeward',[[35,3,36],[36,3,47],[-15,5,47],[-37,7,44]],-.18);
 bezier('Brake run',[[-37,7,44],[-56,8.727,41.409],[-56,7,32],[-38,7,32]]);
 const samples=[];let length=0,previous=null;
 for(const [section,part]of sections.entries()){
  // Dense deterministic samples bound chord error without per-frame integration.
  const count=section===7?720:section===5?480:300;
  part.start=length;
  for(let i=section?1:0;i<=count;i++){
   const q=part.sample(i/count);if(previous)length+=len(sub(q.p,previous.p));
   samples.push({...q,s:length,section});previous=q;
  }
  part.end=length;
 }
 function bracket(array,value,field){let lo=0,hi=array.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(array[m][field]<=value)lo=m;else hi=m;}return [array[lo],array[hi]];}
 function at(distance){
  const s=((distance%length)+length)%length,[a,b]=bracket(samples,s,'s'),t=(s-a.s)/(b.s-a.s);
  const q=orreryFrame(lerpV(a.p,b.p,t),lerpV(a.f,b.f,t),lerpV(a.u,b.u,t));
  return {...q,s,section:t<.5?a.section:b.section};
 }
 // A monotone drive-coordinate timetable makes the existing house AND live-map
 // simulation own throttle/pause. Cars still use physical arc distance offsets.
 // No new timer, animation loop, hidden frame state, or delta-time integrator.
 const stop=24,table=[{s:0,time:0}],dwell=3.8,normalDrive=2.226;
 let seconds=0;
 function velocity(s){
  const q=at(s);let v;
  if(q.section===0)v=Math.min(5,Math.sqrt(2*2.2*Math.abs(s-stop))+.12);
  else if(q.section===1)v=5;
  else if(q.section===2)v=3.0;
  else if(q.section===3)v=Math.sqrt(9+2*7.2*(35-q.p[1]));
  else if(q.section===4||q.section===5)v=Math.sqrt(90+2*7.2*(28-q.p[1]));
  else if(q.section===6||q.section===7)v=clamp(Math.sqrt(Math.max(16,290-12*q.p[1])),5,18);
  else v=6;
  return v;
 }
 const stations=[...samples.map(q=>q.s).filter(s=>s>0&&s<length&&Math.abs(s-stop)>1e-7),stop,length].sort((a,b)=>a-b);
 for(const s of stations){const a=table[table.length-1];seconds+=(s-a.s)/velocity((s+a.s)/2);table.push({s,time:seconds});if(s===stop){seconds+=dwell;table.push({s,time:seconds});}}
 const boarding=table.find(q=>q.s===stop).time;
 function motionAt(d){
  const time=(((d/normalDrive)%seconds)+seconds)%seconds,[a,b]=bracket(table,time,'time'),t=(time-a.time)/(b.time-a.time),s=mix(a.s,b.s,t),q=at(s),boardingTime=time-boarding;
  return {s,time,lap:time/seconds,velocity:(b.s-a.s)/(b.time-a.time),phase:a.s===b.s?'Boarding':sections[q.section].name,restraint:a.s===b.s?smooth(0,.55,boardingTime)*(1-smooth(dwell-.7,dwell-.15,boardingTime)):0};
 }
 const track={length,at,samples,sections,stop};
 const edge={name:'Comet',length:seconds*normalDrive,at:d=>at(motionAt(d).s),motionAt,track,seconds,boarding,dwell,normalDrive};
 return edge;
}
const ORRERY_ROUTE=buildOrreryRoute();
