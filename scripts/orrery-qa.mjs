import assert from 'node:assert/strict';
import {communityContext,loadCommunity,loadContributionDefinitions,prepareCommunityGeometry,read} from './community-lib.mjs';
const state=await communityContext();state.context.assert=assert;
await loadContributionDefinitions(state,await loadCommunity());prepareCommunityGeometry(state);
const report=state.run(`(()=>{
 const e=ORRERY_ROUTE,t=e.track;
 assert.ok(t.length>600&&t.length<700);assert.ok(e.seconds>80&&e.seconds<110);
 for(const s of [-1e6,-.1,0,.01,t.length,t.length*1000]){
  const q=t.at(s);assert.ok([...q.p,...q.f,...q.u,...q.r].every(Number.isFinite));
  assert.ok(Math.abs(dot(q.r,cross(q.u,q.f))-1)<1e-6,'right-handed car frame');
 }
 assert.ok(len(sub(t.at(0).p,t.at(t.length).p))<1e-8);
 for(let s=0;s<t.length;s+=.2){
  const a=t.at(s),b=t.at(s+.01);
  assert.ok(dot(a.f,b.f)>.998,'no tangent jumps');assert.ok(dot(a.u,b.u)>.998,'no inversion-frame flips');
  for(const axis of [a.f,a.u,a.r])assert.ok(Math.abs(len(axis)-1)<1e-8);
  assert.ok(Math.abs(dot(a.u,a.f))<1e-8);assert.ok(Math.abs(a.p[0])<61&&Math.abs(a.p[2])<53&&a.p[1]>2.7&&a.p[1]<36);
 }
 assert.ok(t.sections[5].sample(.5).u[1]<-.99,'full upside-down inversion, not a flat approximation');
 const poses=[];for(let s=0;s<t.length;s+=.8)poses.push(t.at(s));let clearance=Infinity;
 for(let i=0;i<poses.length;i++)for(let j=i+12;j<poses.length;j++){
  const gap=poses[j].s-poses[i].s;if(t.length-gap<9)continue;
  clearance=Math.min(clearance,len(sub(poses[i].p,poses[j].p)));
 }
 assert.ok(clearance>4.4,'grade-separated running lines: '+clearance);
 for(let d=-e.length;d<e.length*2;d+=.031){const q=e.motionAt(d);assert.ok(Number.isFinite(q.s)&&q.s>=0&&q.s<t.length);assert.ok(q.restraint>=0&&q.restraint<=1);if(q.restraint>0)assert.equal(q.velocity,0,'restraints only open at a standstill');}
 const boarding=e.boarding*e.normalDrive;
 assert.equal(e.motionAt(boarding+e.normalDrive).s,t.stop);assert.equal(e.motionAt(boarding+2*e.normalDrive).s,t.stop);
 for(let d=0;d<e.length;d+=.5)assert.ok(len(sub(e.at(d).p,e.at(d+e.length).p))<1e-8);
 return {physicalRouteLength:t.length,nominalLapSeconds:e.seconds,minimumNonlocalTrackSeparation:clearance};
})()`);
Object.assign(report,state.run(`(()=>{
 const before=seed,s=getHouseScene('orrery');assert.equal(seed,before);assert.equal(getHouseScene('orrery'),s);
 assert.equal(s.trains.length,1);assert.equal(s.trains[0].cars,4);assert.equal(s.trains[0].stock,'orrery');assert.equal(s.routes.length,1);assert.equal(s.walls.length,4);assert.equal(s.spots.length,9);
 assert.ok(s.mesh.count<550000,'fixed new-room geometry ceiling');assert.ok(s.walls.reduce((a,w)=>a+w.mesh.count,0)<65000,'shell ceiling');
 assert.ok(s.movingParts[0].mesh.count<4000);assert.equal(s.movingParts.length,12);assert.ok(s.movingParts.reduce((n,p)=>n+p.mesh.count,0)<16000,'bounded complete mechanisms');assert.equal(s.orreryGates.length,5);assert.equal(s.orreryGears.length,3);assert.ok(s.orrerySupports.length>100,'real structural supports');
 assert.ok(s.spots.every(p=>p.phoneDistance>p.distance));assert.ok(s.spots[2].yaw<0,'lunar loop viewed from the clear west side, not through the planet');assert.equal(HOUSE_ROOMS.orrery.trainCollection,false);
 assert.ok(validateCredits(HOUSE_ROOMS.orrery.credits).some(c=>c.handle==='nickfromlater'));
 // Every accepted support is checked again with a finer sampling interval.
 for(const support of s.orrerySupports){const d=sub(support.b,support.a),dd=dot(d,d);
  for(let a=0;a<ORRERY_ROUTE.track.length;a+=.45){const q=ORRERY_ROUTE.track.at(a),v=add(support.a,mul(d,clamp(dot(sub(q.p,support.a),d)/dd))),local=sub(v,q.p);
   assert.ok(!(Math.abs(dot(local,q.f))<1.6&&Math.abs(dot(local,q.r))<.85&&dot(local,q.u)>-.20&&dot(local,q.u)<1.9),'supports avoid the swept occupied envelope');
  }
 }
 const pose=s.movingParts[0].model(s);assert.deepEqual(s.movingParts[0].model(s),pose,'no wall-clock motion');
 const old=reduceMotion;try{reduceMotion=true;const a=s.movingParts[0].model(s);s.trains[0].distance+=10;assert.deepEqual(s.movingParts[0].model(s),a,'ornaments stop with reduced motion');s.trains[0].distance-=10;}finally{reduceMotion=old;}
 return {sceneVertices:s.mesh.count,wallVertices:s.walls.map(w=>w.mesh.count),supports:s.orrerySupports.length,mobileVertices:s.movingParts[0].mesh.count,mechanismVertices:s.movingParts.reduce((n,p)=>n+p.mesh.count,0)};
})()`));
Object.assign(report,state.run(`(()=>{
 const mesh=Builder.prototype.mesh,dispose=disposeMesh;let allocations=0,released=[];
 try{
  Builder.prototype.mesh=function(){if(++allocations===4)throw new Error('simulated upload');return {count:this.data.length/12};};disposeMesh=m=>released.push(m);
  assert.throws(buildOrreryStock,/simulated upload/);assert.equal(released.length,3,'failed uploads release every completed part');
  Builder.prototype.mesh=function(){assert.ok(this.data.every(Number.isFinite));return {count:this.data.length/12};};
  const stock=buildOrreryStock(),count=Object.values(stock).reduce((n,m)=>n+m.count,0);assert.ok(count<15000,'bounded complete custom stock');
  collectionStock.set('orrery',stock);
  const originalDraw=draw,link=drawLink;let draws=0;const train=getHouseScene('orrery').trains[0],originalDistance=train.distance;
  try{
   draw=(mesh,m)=>{assert.ok(mesh);assert.ok([...m].every(Number.isFinite));draws++;};drawLink=(mesh,a,b)=>assert.ok([...a,...b].every(Number.isFinite));
   Builder.prototype.mesh=()=>{throw new Error('per-frame allocation');};
   for(let d=0;d<ORRERY_ROUTE.length;d+=1.3){train.distance=d;orreryDrawFormation(getHouseScene('orrery'),train,{});}
  }finally{draw=originalDraw;drawLink=link;train.distance=originalDistance;}
  return {stockVertices:count,exerciseDrawCalls:draws};
 }finally{Builder.prototype.mesh=mesh;disposeMesh=dispose;collectionStock.delete('orrery');}
})()`));
state.run(`(()=>{
 const s=getHouseScene('orrery'),oldDistance=s.trains[0].distance,oldMotion=reduceMotion;
 try{
  for(const part of s.movingParts){const a=part.model(s);assert.ok([...a].every(Number.isFinite));s.trains[0].distance+=2;assert.ok([...part.model(s)].every(Number.isFinite));s.trains[0].distance-=2;}
  reduceMotion=true;
  for(const part of s.movingParts.filter(p=>!['boarding-gate','dispatch-signal'].includes(p.kind))){const a=part.model(s);s.trains[0].distance+=5;assert.deepEqual(part.model(s),a,'ornaments park under reduced motion');s.trains[0].distance-=5;}
  const e=ORRERY_ROUTE;s.trains[0].distance=(e.boarding+1.3)*e.normalDrive;
  const signal=s.movingParts.find(p=>p.kind==='dispatch-signal'),stopSignal=signal.model(s);assert.ok(Math.abs(stopSignal[0]-1)<1e-6,'signal holds at the open platform');
  for(const [i,gate]of s.movingParts.filter(p=>p.kind==='boarding-gate').entries()){
   const g=s.orreryGates[i],m=gate.model(s),tip=transform([g.width,0,0],m);
   assert.ok(tip[2]>g.z+1.5,'boarding gates open AWAY from the running line');
  }
  s.trains[0].distance=(e.boarding+e.dwell+.2)*e.normalDrive;
  for(const [i,gate]of s.movingParts.filter(p=>p.kind==='boarding-gate').entries())assert.ok(Math.abs(transform([1.6,0,0],gate.model(s))[2]-s.orreryGates[i].z)<1e-5,'gates closed before departure');
  assert.ok(Math.abs(signal.model(s)[0]-.5)<1e-6,'signal explicitly changes to departure with reduced motion');
  assert.equal(s.orreryGears[0].teeth*s.orreryGears[0].ratio+s.orreryGears[1].teeth*s.orreryGears[1].ratio,0,'intermeshing tooth speed');
 }finally{s.trains[0].distance=oldDistance;reduceMotion=oldMotion;}
 // Partial scene failure after some of the new mechanisms have been uploaded.
 const mesh=Builder.prototype.mesh,dispose=disposeMesh,allocated=[],released=[];let attempts=0;
 registerHouseRoom('orrery',{...HOUSE_ROOMS.orrery,build:buildOrreryRoom,shell:orreryShell});
 try{
  Builder.prototype.mesh=function(){if(++attempts===11)throw new Error('mechanism upload failed');const m={count:this.data.length/12};allocated.push(m);return m;};disposeMesh=m=>released.push(m);
  assert.throws(()=>getHouseScene('orrery'),/mechanism upload failed/);assert.equal(roomScenes.has('orrery'),false);
  assert.equal(allocated.length,10);assert.equal(released.length,allocated.length);assert.ok(allocated.every(m=>released.includes(m)),'all uploaded mechanisms and shell walls released');
 }finally{Builder.prototype.mesh=mesh;disposeMesh=dispose;}
})()`);
const html=await read('index.html');
for(const file of ['src/rooms/orrery-track.js','src/rooms/orrery.js','src/trains/orrery.js','src/orrery-ride.js'])assert.ok(html.includes(`src="${file}"`),'classic scripts included in the app and playable export');
assert.ok(html.indexOf('src/rooms/orrery-track.js')<html.indexOf('src/rooms/orrery.js'));
assert.ok(html.indexOf('src/orrery-ride.js')>html.indexOf('src/controls.js'));
assert.ok((await read('src/orrery-ride.js')).includes('quiet-generated'),'generated controls are stripped by portable export');
console.log(JSON.stringify(report,null,2));
console.log('Orrery route, frame, clearance, timetable, geometry, stock and ownership checks passed.');
