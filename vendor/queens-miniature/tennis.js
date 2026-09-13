// Deterministic exhibition choreography, independent of live match scores.
// Ballistic segments share horizontal velocity through each elastic bounce.
const G=6.4,FLOOR=1.435;
const mix=(a,b,t)=>a+(b-a)*t,clamp=t=>Math.max(0,Math.min(1,t));
export function queensRally(index=0){
 const server=index%2,sign=server?-1:1,mirror=Math.floor(index/2)%2?-1:1;
 const patterns=[[-3.4,2.8,3.2,-2.9,-3.5,2.4],[-3.4,-2.2,3.4,2.9,-3.0,1.6,3.6,-2.8],[-3.4,3.3,-2.5,-3.4,2.9]];
 const xs=patterns[Math.floor(index/2)%patterns.length],serve={t:1.62,p:[1.3*mirror,3.55,12.5*sign],player:server,serve:true,stroke:'serve'};
 const toss={t:.46,p:[serve.p[0],2.71,serve.p[2]]},apex={t:1.11,p:[serve.p[0],4.32,serve.p[2]]};
 const contacts=[serve],segments=[{a:{t:0,p:toss.p},b:toss,g:0},{a:toss,b:apex,g:7.62},{a:apex,b:serve,g:5.92}],bounces=[];
 let a=serve;
 for(let i=0;i<xs.length;i++){
  const side=-Math.sign(a.p[2]),isServe=i===0,total=isServe?1.31:1.43+((i+index)%3)*.10;
  const z=side*(12.5+(i%3)*.23),fraction=isServe?(12.5+5.35)/(12.5+Math.abs(z)):.78;
  const fall=total*fraction,rise=total-fall,x=xs[i]*mirror;
  const bounce={t:a.t+fall,p:[mix(a.p[0],x,fraction),FLOOR,mix(a.p[2],z,fraction)]};
  const up=.79*((a.p[1]-FLOOR)/fall+G*fall/2);
  const b={t:a.t+total,p:[x,FLOOR+up*rise-G*rise*rise/2,z],player:side>0?0:1,serve:false,stroke:i%3===1?'backhand':'forehand'};
  segments.push({a,b:bounce,g:G},{a:bounce,b,g:G});bounces.push(bounce);contacts.push(b);a=b;
 }
 // A clean winner lands inside the singles court, then skips into the runoff.
 const side=-Math.sign(a.p[2]),bounce={t:a.t+1.12,p:[-3.75*mirror,FLOOR,side*8.7]},rise=.53,up=.79*((a.p[1]-FLOOR)/1.12+G*1.12/2);
 const end={t:a.t+1.65,p:[bounce.p[0]+(bounce.p[0]-a.p[0])*rise/1.12,FLOOR+up*rise-G*rise*rise/2,bounce.p[2]+(bounce.p[2]-a.p[2])*rise/1.12]};
 segments.push({a,b:bounce,g:G},{a:bounce,b:end,g:G});bounces.push(bounce);
 return {index,server,contacts,segments,bounces,end:end.t,duration:end.t+3.1};
}
export function queensBall(plan,time){
 const s=plan.segments.find(s=>time<=s.b.t)||plan.segments.at(-1),d=s.b.t-s.a.t,u=clamp((time-s.a.t)/d);
 return [mix(s.a.p[0],s.b.p[0],u),mix(s.a.p[1],s.b.p[1],u)+s.g*d*d*u*(1-u)/2,mix(s.a.p[2],s.b.p[2],u)];
}
export function queensFootwork(plan,player,time){
 const sign=player===0?1:-1,hits=plan.contacts.filter(h=>h.player===player),home={t:plan.contacts[0].t-.24,p:[0,2.35,sign*13.3],stroke:'forehand'};
 const nextServing=player!==plan.server,nextMirror=Math.floor((plan.index+1)/2)%2?-1:1;
 const finish={t:plan.duration,p:nextServing?[1.3*nextMirror,3.55,sign*12.5]:home.p,stroke:nextServing?'serve':'forehand'};
 let before=home,after=finish,nearest=hits[0];
 for(const hit of hits){if(hit.t<time)before=hit;else if(after===finish)after=hit;if(Math.abs(time-hit.t)<Math.abs(time-nearest.t))nearest=hit;}
 if(before===home&&after.serve)return {p:after.p,nearest,phase:time-nearest.t,moving:0,step:time*14,sign,hand:-1};
 const start=before.t+.24,end=after.t-.24,d=Math.max(.1,end-start),u=clamp((time-start)/d);
 // Recover toward the centre after hitting, then use an adjustment step to plant.
 const middle=[mix(before.p[0],after.p[0],.5)*.58,2.35,sign*13.25],ease=v=>v*v*(3-2*v);
 let from,to,v;
 if(u<.48){from=before.p;to=middle;v=ease(u/.48);}else{from=middle;to=after.p;v=ease((u-.48)/.52);}
 return {p:from.map((n,i)=>mix(n,to[i],v)),nearest,phase:time-nearest.t,moving:Math.sin(Math.PI*u)**2,step:time*14,sign,hand:mix(before.stroke==='backhand'?1:-1,after.stroke==='backhand'?1:-1,ease(u))};
}
