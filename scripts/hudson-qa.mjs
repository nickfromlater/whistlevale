import assert from 'node:assert/strict';
import {communityContext,loadCommunity,loadContributionDefinitions,prepareCommunityGeometry} from './community-lib.mjs';
const state=await communityContext();state.context.assert=assert;
await loadContributionDefinitions(state,await loadCommunity());prepareCommunityGeometry(state);
state.run(`(()=>{
 const hudsonRects=[],buildingBuilder=hudsonBuilding;
 hudsonBuilding=function(b,x,z,w,d,h,color,options){hudsonRects.push({x,z,w:w+.4,d:d+.4,front:options?.shop?1.1:options?.escape?1.1:0});return buildingBuilder(b,x,z,w,d,h,color,options);};
 const city=getHouseScene('hudson');hudsonBuilding=buildingBuilder;
 assert.equal(getHouseScene('hudson'),city,'room is cached');
 assert.ok(city.mesh.count>100000&&city.mesh.count<750000,'room stays inside its fixed 750k vertex budget');
 assert.equal(city.walls.length,4);assert.equal(city.spots.length,9);
 assert.equal(city.trains.length,1);assert.equal(collectionChoice('hudson').id,'acela');
 assert.equal(collectionPower('hudson'),'electric');assert.equal(collectionTrainLabel('hudson').name,'Acela');
 assert.equal(city.trains[0].cars,6);assert.equal(city.trains[0].collectionChoice.id,'acela');
 assert.equal(collectionOffsets(city.trains[0].collectionChoice).length,8,'six coaches and two power cars');
 assert.equal(collectionOffsets({id:'acela',cars:0}).length,1,'engine-only preview stays compact');
 assert.ok(validateCredits(HOUSE_ROOMS.hudson.credits).some(c=>c.handle==='nickfromlater'));
 assert.ok(validateCredits(ACELA_COLLECTION.credits).some(c=>c.handle==='nickfromlater'));
 assert.equal(HOUSE_ROOMS.hudson.map.plot,'east-4');
 for(const edge of city.routes){
  const a=edge.at(0),q=edge.at(edge.length);
  assert.ok(len(sub(a.p,q.p))<1e-7,'rail circuit closes');assert.ok(dot(a.f,q.f)>.9999,'rail tangent closes');
  for(let d=0;d<edge.length;d+=.15){const p=edge.at(d).p;assert.ok(p.every(Number.isFinite));assert.ok(Math.abs(p[1]-HUDSON.rail)<1e-10);assert.ok(Math.abs(p[0])<HUDSON.width/2-3&&Math.abs(p[2])<HUDSON.depth/2-3);}
 }
 // Measure vehicle-envelope clearance against authored building footprints,
 // including foundations, projecting awnings, the tower and station headhouse.
 hudsonRects.push({x:5,z:-9.6,w:10.5,d:8.8,front:0},{x:-40,z:14,w:9,d:12.8,front:0});
 const rectDistance=(p,r)=>Math.hypot(Math.max(0,Math.abs(p[0]-r.x)-r.w/2),Math.max(0,r.z-r.d/2-p[2],p[2]-(r.z+r.d/2+r.front)));
 let buildingClearance=Infinity,poleClearance=Infinity;
 for(const edge of city.routes)for(let d=0;d<edge.length;d+=.13)for(const rect of hudsonRects)buildingClearance=Math.min(buildingClearance,rectDistance(edge.at(d).p,rect));
 assert.ok(buildingClearance>.85,'buildings clear both running lines: '+buildingClearance);
 const poles=[];for(let d=2;d<city.routes[0].length;d+=9.4){const a=city.routes[0].at(d);if(a.p[2]>23&&a.p[0]>16&&a.p[0]<40)continue;for(const x of[-1.35,3.65])poles.push(add(a.p,mul([a.f[2],0,-a.f[0]],x)));}
 for(const edge of city.routes)for(let d=0;d<edge.length;d+=.13)for(const pole of poles)poleClearance=Math.min(poleClearance,Math.hypot(...[edge.at(d).p[0]-pole[0],edge.at(d).p[2]-pole[2]]));
 assert.ok(poleClearance>1.12,'catenary masts clear both vehicle envelopes: '+poleClearance);
 // The expanded city has a real water opening beneath the bridge, rather
 // than water drawn over solid ground, and an enclosed architectural volume.
 assert.equal(city.hudson.revision,2);assert.equal(hudsonRects.length,22);
 assert.equal(city.actors.length,4,'four walkers reuse the existing animated-figure cache');
 assert.equal(city.height(28,25.8),HUDSON.water);assert.equal(city.height(10,25.8),HUDSON.ground);
 assert.equal(city.height(29,36),HUDSON.water);assert.equal(city.height(0,-10),HUDSON.ground);
 const station=new Builder(),columns=[],box=station.box;
 station.box=function(...a){if(a[3]===.145&&a[4]===3.28)columns.push({x:a[0],z:a[2],w:a[3],d:a[5],front:0});return box.apply(this,a);};
 hudsonStationVault(station,HUDSON.rail+.4);
 assert.equal(columns.length,22,'eleven structural ribs, each supported at both sides');
 let glazingVertices=0;for(let i=9;i<station.data.length;i+=12)if(station.data[i]===76)glazingVertices++;
 assert.ok(glazingVertices>=600&&glazingVertices<1500,'the native transparent-glass pass owns the bounded vault glazing');
 const platformWalker=city.actors[3];let walkingClearance=Infinity;
 for(let i=0;i<=100;i++){const p=lerpV(platformWalker.a,platformWalker.b,i/100);for(const c of columns)walkingClearance=Math.min(walkingClearance,rectDistance(p,c));}
 assert.ok(walkingClearance>.30,'the walking platform passenger cannot pass through a shed column');
 for(const actor of city.actors)for(const p of[actor.a,actor.b]){assert.equal(p.length,3);assert.ok(p.every(Number.isFinite));}
 const bridge=new Builder();hudsonRiverBridge(bridge);
 // Only the high transverse members may cross a running rail envelope. Side
 // ribs and abutments are measured separately from the approach track deck.
 let lowestOverhead=Infinity;
 for(let i=0;i<bridge.data.length;i+=36){
  const tri=[0,12,24].map(k=>bridge.data.slice(i+k,i+k+3));
  for(const z of[24.6,27])for(let j=0;j<3;j++){const a=tri[j],q=tri[(j+1)%3],dz=q[2]-a[2];if(Math.abs(dz)<1e-10)continue;const t=(z-a[2])/dz;if(t<0||t>1)continue;const x=mix(a[0],q[0],t),y=mix(a[1],q[1],t);if(x>19&&x<37&&y>HUDSON.rail+.5)lowestOverhead=Math.min(lowestOverhead,y);}
 }
 assert.ok(Number.isFinite(lowestOverhead)&&lowestOverhead>HUDSON.rail+2.65,'bridge bracing clears the raised collectors');
 let shellTop=-Infinity;const mesh=Builder.prototype.mesh;
 try{
  Builder.prototype.mesh=function(){return {data:this.data,count:this.data.length/12};};
  for(const wall of hudsonShell(new Builder()))for(let i=1;i<wall.mesh.data.length;i+=12)shellTop=Math.max(shellTop,wall.mesh.data[i]);
 }finally{Builder.prototype.mesh=mesh;}
 const tower=new Builder();hudsonDecoTower(tower,5,-9.6);let towerTop=-Infinity;
 for(let i=1;i<tower.data.length;i+=12)towerTop=Math.max(towerTop,tower.data[i]);
 assert.ok(towerTop<shellTop-1,'the copper spire remains below the gallery roofline');
 // Every vehicle uses the new suspension, not wheels baked into its body.
 const parts=collectionGeometry({id:'acela',livery:0,cars:6}),savedDraw=draw,savedLink=drawLink,drawn=[];
 try{
  draw=(part,matrix)=>drawn.push({part,matrix});drawLink=()=>{};
  drawSelectedCollection({id:'acela',livery:0,cars:6},d=>trans(0,0,-d),null,.7,parts,false);
  assert.equal(drawn.filter(r=>r.part===parts.bogie).length,16);
  assert.equal(drawn.filter(r=>r.part===parts.axle).length,32);
  assert.ok(drawn.every(r=>Array.from(r.matrix).every(Number.isFinite)));
  drawn.length=0;drawSelectedCollection({id:'acela',livery:0,cars:6},d=>trans(0,0,-d),null,.7,parts,true);
  assert.equal(drawn.filter(r=>[parts.motorRoof,parts.tailRoof,parts.trailerRoof].includes(r.part)).length,0,'all eight roofs lift in cutaway mode');
 }finally{draw=savedDraw;drawLink=savedLink;}
 // The room default participates in normal mesh ownership, without being
 // written into a visitor's saved selections merely by entering the room.
 const defaultStock=ensureRunningCollection(city.trains[0].collectionChoice);
 pruneRunningCollection();assert.equal(ensureRunningCollection(city.trains[0].collectionChoice),defaultStock);
 assert.equal(selectedCollection.hudson,undefined);
 const originalPower=acelaPowerCar,savedMesh=Builder.prototype.mesh,savedPaint=trainPaint,savedSeed=seed;
 acelaPowerCar=()=>{throw Error('Acela fixture');};
 assert.throws(()=>collectionGeometry({id:'acela',livery:1,cars:6}),/Acela fixture/);acelaPowerCar=originalPower;
 assert.equal(Builder.prototype.mesh,savedMesh);assert.equal(trainPaint,savedPaint);assert.equal(seed,savedSeed);
 globalThis.hudsonReport={roomVertices:city.mesh.count,wallVertices:city.walls.reduce((n,w)=>n+w.mesh.count,0),buildings:hudsonRects.length,population:city.population,viewpoints:city.spots.length,trainVertices:Object.values(collectionGeometry({id:'acela',livery:0,cars:6})).reduce((n,m)=>n+m.count,0),minimumBuildingClearance:buildingClearance,minimumMastClearance:poleClearance,minimumWalkingClearance:walkingClearance,bridgeCollectorClearance:lowestOverhead-HUDSON.rail,shellTop,towerTop,glazingVertices,routeLengths:city.routes.map(r=>r.length)};
})()`);
console.log(JSON.stringify(state.context.hudsonReport,null,2));
console.log('Hudson QA passed: fixed mesh budget, closed parallel circuits, building/mast clearance, Acela defaults, eight-vehicle formation, glazed station, river-bridge collector clearance, walkers, full suspension, cutaways, attribution, cache ownership and failed-build recovery.');
