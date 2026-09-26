import assert from 'node:assert/strict';
import {communityContext,loadCommunity,loadContributionDefinitions,prepareCommunityGeometry,read} from './community-lib.mjs';
const state=await communityContext();state.context.assert=assert;
await loadContributionDefinitions(state,await loadCommunity());prepareCommunityGeometry(state);
const sceneReport=state.run(`(()=>{
 const before=seed,s=getHouseScene('venetian');assert.equal(seed,before,'preserves house random stream');assert.equal(getHouseScene('venetian'),s,'scene cached');
 assert.equal(s.walls.length,4);assert.equal(s.spots.length,8);assert.equal(s.trains.length,1);assert.equal(s.routes.length,1);
 assert.ok(s.mesh.count>350000&&s.mesh.count<550000,'fixed static room budget');
 const moving=s.movingParts.reduce((n,p)=>n+p.mesh.count,0),walls=s.walls.reduce((n,p)=>n+p.mesh.count,0);
 assert.ok(moving<40000,'fixed moving geometry budget');assert.ok(s.mesh.count+moving+walls<620000,'fixed total room budget');
 assert.equal(s.movingParts.length,13,'four independent hull/oar/wake sets and one bell');
 assert.equal(new Set(s.movingParts.map(p=>p.mesh)).size,13,'each part owns a distinct mesh');
 assert.ok(s.spots.every(p=>p.phoneDistance>p.distance&&p.target.every(Number.isFinite)));
 assert.ok(validateCredits(HOUSE_ROOMS.venetian.credits).some(c=>c.handle==='nickfromlater'));
 assert.equal(HOUSE_ROOMS.venetian.map.plot,'east-6');assert.equal(HOUSE_ROOMS.venetian.ambient,'coast');
 assert.equal(s.trains[0].stock,'coast');assert.equal(s.trains[0].type,'steam');
 return {sceneVertices:s.mesh.count,wallVertices:walls,movingVertices:moving,totalVertices:s.mesh.count+walls+moving,viewpoints:s.spots.length};
})()`);
const clearanceReport=state.run(`(()=>{
 const s=getHouseScene('venetian');let bank=Infinity,arch=Infinity;
 for(const e of [VENETIAN_RAIL,s.venetian.route]){
  assert.ok(len(sub(e.at(0).p,e.at(e.length).p))<1e-8,'closed position');assert.ok(dot(e.at(0).f,e.at(e.length).f)>.9999,'closed tangent');
 }
 for(let d=0;d<VENETIAN_RAIL.length;d+=.19){const q=VENETIAN_RAIL.at(d),r=norm([q.f[2],0,-q.f[0]]);
  for(const side of[-1.1,0,1.1]){const p=add(q.p,mul(r,side));assert.ok(Math.abs(p[0])<65&&Math.abs(p[2])<45,'train stays on the board');assert.ok(!venetianIsWater(p[0],p[2]),'rail and vehicle envelope never enter the canal');}
 }
 for(let d=0;d<s.venetian.route.length;d+=.20){const q=circuitAt(s.venetian.route,d),front=circuitAt(s.venetian.route,d+.3),rear=circuitAt(s.venetian.route,d-.3),m=basis(q.p,norm(sub(front.p,rear.p)));
  for(const x of[-.70,0,.70])for(let z=-3.5;z<=3.5;z+=.5){const p=transform([x,1.85,z],m),bounds=venetianWaterBounds(p[0]);assert.ok(bounds,'entire swept hull stays within the basin');
   const gap=Math.min(p[2]-bounds[0],bounds[1]-p[2]);bank=Math.min(bank,gap);assert.ok(gap>.3,'swept hull clears bank');
   for(const bridge of VENETIAN_BRIDGES)if(Math.abs(p[0]-bridge.x)<bridge.width/2+.02){const u=p[2]-venetianCenter(bridge.x),ceiling=.15+3.75*Math.sqrt(Math.max(0,1-(u/8.65)**2));arch=Math.min(arch,ceiling-p[1]);assert.ok(ceiling-p[1]>.35,'gondolier clears actual stone intrados');}
  }
  // Both fixed moving oar extremes remain inside the canal, including turns.
  for(const a of[-.29,.29]){const p=transform(transform([1.56,-.7,.36],mm(trans(.71,.86,-1.62),ry(a))),m);assert.ok(venetianIsWater(p[0],p[2],.20),'oar blade clears bank');}
 }
 assert.equal(s.height(0,0),VENETIAN.water);assert.equal(s.height(0,44),VENETIAN.quay);assert.equal(s.height(72,0),FLOOR);
 return {railLength:VENETIAN_RAIL.length,canalCircuit:s.venetian.route.length,minimumBankClearance:bank,minimumArchClearance:arch};
})()`);
const motionReport=state.run(`(()=>{
 const s=getHouseScene('venetian'),meshIDs=s.movingParts.map(p=>p.mesh),original=Builder.prototype.mesh;
 Builder.prototype.mesh=function(){throw new Error('animation must not create geometry');};
 try{
  const first=s.movingParts[0].model(s);for(let i=0;i<600;i++)venetianUpdate(s,1/60);
  assert.notDeepEqual(s.movingParts[0].model(s),first,'boat actually advances');assert.ok(Math.abs(s.venetian.time-10)<1e-9,'normal clock rate');
  for(const p of s.movingParts)assert.ok([...p.model(s)].every(Number.isFinite),'finite animated transforms');
  const t=s.venetian.time;for(const invalid of[NaN,Infinity,-1,0])venetianUpdate(s,invalid);assert.equal(s.venetian.time,t,'bad deltas ignored');
  venetianUpdate(s,300);assert.ok(Math.abs(s.venetian.time-t-.1)<1e-8,'return from hidden tab is bounded');
  reduceMotion=true;const still=s.movingParts.map(p=>p.model(s)),frozen=s.venetian.time;venetianUpdate(s,1);assert.equal(s.venetian.time,frozen);
  assert.deepEqual(s.movingParts.map(p=>p.model(s)),still,'boat, oar, wake and bell freeze for reduced motion');reduceMotion=false;
  for(const width of[1440,390,320]){innerWidth=width;for(const shot of['drift','side','wide']){const q=venetianCinemaView(s,shot);assert.ok(q.position.every(Number.isFinite)&&q.target.every(Number.isFinite));assert.equal(q.groundHandled,true);assert.ok(q.fov>.3&&q.fov<1.6);}}
  assert.equal(venetianCinemaView(s,'tail'),null,'fourth shot delegates to native railway camera');
 }finally{Builder.prototype.mesh=original;reduceMotion=false;innerWidth=1440;}
 assert.deepEqual(s.movingParts.map(p=>p.mesh),meshIDs,'no mesh replacement over 600 simulation ticks');
 return {ticks:600,ownedParts:meshIDs.length};
})()`);
// Exercise both disposal paths with actual ownership, not only text assertions.
state.run(`(()=>{
 const s=getHouseScene('venetian'),owned=[s.mesh,s.lifeDetails.mesh,...s.walls.map(w=>w.mesh),...s.movingParts.map(p=>p.mesh)],disposed=[],original=disposeMesh;
 disposeMesh=mesh=>{if(mesh)disposed.push(mesh);};
 try{registerHouseRoom('venetian',{...HOUSE_ROOMS.venetian,build:buildVenetianRoom,shell:venetianShell});
  for(const mesh of owned.filter(Boolean))assert.equal(disposed.filter(m=>m===mesh).length,1,'cache invalidation disposes each owned mesh once');
  const brokenKey='venetian-failure-fixture';let partial;
  registerHouseRoom(brokenKey,{railway:false,build:(scene,b)=>{partial=scene;venetianBuildLife(scene,b);throw new Error('intentional failure');},shell:()=>[]});
  assert.throws(()=>getHouseScene(brokenKey),/intentional failure/);assert.equal(roomScenes.has(brokenKey),false);
  for(const part of partial.movingParts)assert.equal(disposed.filter(m=>m===part.mesh).length,1,'failed build releases moving buffers');
  delete HOUSE_ROOMS[brokenKey];delete ROOM_SHELLS[brokenKey];HOUSE_ROOM_BUILDERS.delete(brokenKey);
 }finally{disposeMesh=original;}
})()`);
const index=await read('index.html'),hobby=await read('src/hobby.js'),map=await read('src/shop-map.js');
for(const file of['venetian-architecture.js','venetian-life.js','venetian.js']){
 assert.ok(index.includes(`<script src="src/rooms/${file}"></script>`),'included in normal app and portable script capture');
 assert.ok(index.indexOf(`src/rooms/${file}`)<index.indexOf('src/hobby.js'),'registered before startup');
}
assert.match(hobby,/if\(hobby\.scene\.venetian\)venetianUpdate\(hobby\.scene,dt\)/);
assert.match(map,/if\(scene\.venetian\)venetianUpdate\(scene,dt\)/);
assert.match(hobby,/!manual&&\(\(hobby\.scene\?\.venetian&&venetianCinemaView/,'manual cinema control retains precedence');
console.log('Venetian native room: geometry, route, swept clearances, animation, ownership, cameras and integration passed.');
console.log(JSON.stringify({scene:sceneReport,clearances:clearanceReport,motion:motionReport},null,2));
