import assert from 'node:assert/strict';
import {communityContext,loadCommunity,loadContributionDefinitions,prepareCommunityGeometry,read} from './community-lib.mjs';
const state=await communityContext();state.context.assert=assert;
await loadContributionDefinitions(state,await loadCommunity());prepareCommunityGeometry(state);
const sceneReport=state.run(`(()=>{
 const before=seed,s=getHouseScene('venetian');assert.equal(seed,before,'preserves house random stream');assert.equal(getHouseScene('venetian'),s,'scene cached');
 assert.equal(s.walls.length,4);assert.equal(s.spots.length,10);assert.equal(s.trains.length,1);assert.equal(s.routes.length,1);
 assert.ok(s.mesh.count>350000&&s.mesh.count<550000,'fixed static room budget');
 const moving=s.movingParts.reduce((n,p)=>n+p.mesh.count,0),walls=s.walls.reduce((n,p)=>n+p.mesh.count,0);
 assert.ok(moving<40000,'fixed moving geometry budget');assert.ok(s.mesh.count+moving+walls<620000,'fixed total room budget');
 assert.equal(s.movingParts.length,29,'four hull/oar/wake sets, sixteen arm links and one bell');
 assert.equal(new Set(s.movingParts.map(p=>p.mesh)).size,29,'each part owns a distinct mesh');
 assert.ok(s.spots.every(p=>p.phoneDistance>p.distance&&p.target.every(Number.isFinite)));
 assert.ok(validateCredits(HOUSE_ROOMS.venetian.credits).some(c=>c.handle==='nickfromlater'));
 assert.equal(HOUSE_ROOMS.venetian.map.plot,'east-7');assert.equal(HOUSE_ROOMS.venetian.ambient,'coast');
 assert.equal(houseRoomLights('venetian').length,6,'overwrite every room-light uniform slot');assert.equal(houseLayoutLights('venetian').length,8,'overwrite every miniature-light uniform slot');
 assert.ok([...houseRoomLights('venetian').flat(),...houseLayoutLights('venetian').flat()].every(Number.isFinite),'finite authored lights');
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
  // Power and recovery strokes remain inside the canal, including turns.
  for(let phase=0;phase<TAU;phase+=TAU/12)for(const vertex of VENETIAN_OAR_BLADE){const p=transform(transform(vertex,venetianOarLocal({venetian:{time:phase/1.25}},0)),m);assert.ok(venetianIsWater(p[0],p[2],.20),'every authored oar blade vertex clears bank throughout the rowing cycle');}
 }
 for(const [x,y,z]of VENETIAN_PEDESTRIANS){assert.ok(y>=VENETIAN.quay,'feet are above paving');for(const dx of[-.3,.3])for(const dz of[-.3,.3])assert.ok(!venetianIsWater(x+dx,z+dz),'pedestrians stand wholly on dry land or the station platform');}
 assert.equal(s.height(0,0),VENETIAN.water);assert.equal(s.height(0,44),VENETIAN.quay);assert.equal(s.height(72,0),FLOOR);
 return {railLength:VENETIAN_RAIL.length,canalCircuit:s.venetian.route.length,minimumBankClearance:bank,minimumArchClearance:arch};
})()`);
const architectureReport=state.run(`(()=>{
 const buildings=VENETIAN_BLOCKS.map(venetianBuildingSpec),boxes=[];
 assert.equal(new Set(buildings.map(b=>b.id)).size,11,'distinct authored palazzi');
 for(const building of buildings){
  const b=new Builder();venetianPalazzo(b,building);const a=b.data;
  let x0=Infinity,x1=-Infinity,z0=Infinity,z1=-Infinity;
  for(let i=0;i<a.length;i+=12){
   const x=a[i],y=a[i+1],z=a[i+2];assert.ok(Number.isFinite(x+y+z));
   x0=Math.min(x0,x);x1=Math.max(x1,x);z0=Math.min(z0,z);z1=Math.max(z1,z);
   assert.ok(Math.abs(x)<65&&Math.abs(z)<37,'all roof and balcony vertices stay inside the rail circuit');
   assert.ok(!venetianIsWater(x,z,.01),'actual palace geometry, including balconies, stays off the water');
  }
  for(let floor=0;floor<building.floors;floor++){
   const lo=VENETIAN.quay+.45+floor*(building.h-.45)/building.floors,hi=lo+(building.h-.45)/building.floors;
   let panes=0;for(let i=0;i<a.length;i+=12)if(a[i+1]>lo&&a[i+1]<hi&&(a[i+9]===6||a[i+9]===43))panes++;
   assert.ok(panes>0,'every authored storey has actual recessed fenestration: '+building.id+' / '+floor);
  }
  boxes.push({id:building.id,x0,x1,z0,z1});
 }
 for(let i=0;i<boxes.length;i++)for(let j=0;j<i;j++){
  const a=boxes[i],b=boxes[j];assert.ok(a.x1<=b.x0||a.x0>=b.x1||a.z1<=b.z0||a.z0>=b.z1,'palace roof/balcony envelopes do not overlap: '+a.id+' / '+b.id);
 }
 for(const box of boxes)for(const bridge of VENETIAN_BRIDGES){
  const w=bridge.width/2+(bridge.covered?.64:.2),z=venetianCenter(bridge.x);
  assert.ok(box.x1<bridge.x-w||box.x0>bridge.x+w||box.z1<z-11.7||box.z0>z+11.7,'palaces leave bridge landings open');
 }
 // Project actual triangles onto XY. An open arcade must have no masonry
 // crossing its centre; a window must have glazing set behind the reveal.
 function hits(builder,x,y){
  const hits=[],d=builder.data;
  for(let i=0;i<d.length;i+=36){
   const A=d.slice(i,i+3),B=d.slice(i+12,i+15),C=d.slice(i+24,i+27),den=(B[1]-C[1])*(A[0]-C[0])+(C[0]-B[0])*(A[1]-C[1]);
   if(Math.abs(den)<1e-9)continue;
   const u=((B[1]-C[1])*(x-C[0])+(C[0]-B[0])*(y-C[1]))/den,v=((C[1]-A[1])*(x-C[0])+(A[0]-C[0])*(y-C[1]))/den;
   if(u>=0&&v>=0&&u+v<=1)hits.push({z:u*A[2]+v*B[2]+(1-u-v)*C[2],mat:d[i+9]});
  }return hits;
 }
 for(const pointed of[false,true]){
  const open=new Builder(),window=new Builder(),args={x:0,y0:0,y1:3.3,pitch:2.0,r:.63,front:0,color:'#caa98a',variant:0,pointed};
  venetianFacadeCell(open,{...args,open:true});assert.equal(hits(open,.23,1.3).length,0,'arcade has an actual geometric opening');
  venetianFacadeCell(window,args);const pane=hits(window,.23,1.3);assert.ok(pane.length>0&&pane.every(h=>h.z<-.30&&[6,43].includes(h.mat)),'window centre reaches set-back glass, not a box facade');
 }
 const water=new Builder();venetianBase(water);let vertices=0;
 for(let i=0;i<water.data.length;i+=12)if(water.data[i+9]===102){
  vertices++;assert.equal(water.data[i+1],VENETIAN.water);assert.equal(water.data[i+10],water.data[i]);assert.equal(water.data[i+11],water.data[i+2]);
 }
 assert.ok(vertices>10000,'room-local water UVs reach the native material');
 return {palazzi:buildings.length,openLoggias:buildings.filter(b=>b.loggia).length,roofTerraces:buildings.filter(b=>b.terrace).length,waterVertices:vertices};
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
  const savedTime=s.venetian.time;
  for(let d=0;d<s.venetian.route.length;d+=.25){
   s.venetian.time=d/.82;const q=venetianCinemaView(s,'drift');
   assert.ok(venetianIsWater(q.position[0],q.position[2],.25),'ride eye remains inside the channel');
   assert.ok(venetianIsWater(q.target[0],q.target[2],.25),'ride gaze follows water through both turning basins');
   assert.ok(len(sub(q.target,q.position))>2,'ride gaze never collapses at a turn');
   for(const bridge of VENETIAN_BRIDGES)if(Math.abs(q.position[0]-bridge.x)<bridge.width/2+.02){
    const u=q.position[2]-venetianCenter(bridge.x),ceiling=.15+3.75*Math.sqrt(Math.max(0,1-(u/8.65)**2));
    assert.ok(ceiling-q.position[1]>.35,'raised ride eye clears the actual arch');
   }
  }
  for(let d=0;d<s.venetian.route.length;d+=.35){
   s.venetian.time=d/.82;const q=venetianCinemaView(s,'side');
   assert.ok(q.fixed,'taking over the boat view must not attach to the railway train');
   assert.ok(venetianIsWater(q.position[0],q.position[2],.25),'following eye stays inside the full canal circuit');
   assert.ok(len(sub(q.position,q.target))>1.5,'following gaze remains well-defined at turns');
   for(const bridge of VENETIAN_BRIDGES)if(Math.abs(q.position[0]-bridge.x)<bridge.width/2+.02){const u=q.position[2]-venetianCenter(bridge.x),ceiling=.15+3.75*Math.sqrt(Math.max(0,1-(u/8.65)**2));assert.ok(ceiling-q.position[1]>.35,'following eye clears all bridge intrados');}
  }
  s.venetian.time=savedTime;
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
for(const file of['venetian-architecture.js','venetian-life.js','venetian-city.js','venetian.js','venetian-render.js']){
 assert.ok(index.includes(`<script src="src/rooms/${file}"></script>`),'included in normal app and portable script capture');
 assert.ok(index.indexOf(`src/rooms/${file}`)<index.indexOf('src/hobby.js'),'registered before startup');
}
assert.match(hobby,/if\(hobby\.scene\.venetian\)venetianUpdate\(hobby\.scene,dt\)/);
assert.match(map,/if\(scene\.venetian\)venetianUpdate\(scene,dt\)/);
assert.match(hobby,/!manual&&\(\(hobby\.scene\?\.venetian&&venetianCinemaView/,'manual cinema control retains precedence');
console.log('Venetian native room: geometry, route, swept clearances, animation, ownership, cameras and integration passed.');
console.log(JSON.stringify({scene:sceneReport,clearances:clearanceReport,motion:motionReport,architecture:architectureReport},null,2));
