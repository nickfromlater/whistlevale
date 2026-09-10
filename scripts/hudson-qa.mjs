import assert from 'node:assert/strict';
import {communityContext,loadCommunity,loadContributionDefinitions,prepareCommunityGeometry} from './community-lib.mjs';
const state=await communityContext();state.context.assert=assert;
await loadContributionDefinitions(state,await loadCommunity());prepareCommunityGeometry(state);
state.run(`
 const hudsonRects=[],buildingBuilder=hudsonBuilding;
 hudsonBuilding=function(b,x,z,w,d,h,color,options){hudsonRects.push({x,z,w:w+.4,d:d+.4,front:options?.shop?1.1:options?.escape?1.1:0});return buildingBuilder(b,x,z,w,d,h,color,options);};
 const city=getHouseScene('hudson');hudsonBuilding=buildingBuilder;
 assert.equal(getHouseScene('hudson'),city,'room is cached');
 assert.ok(city.mesh.count>100000&&city.mesh.count<750000,'room stays inside its fixed 750k vertex budget');
 assert.equal(city.walls.length,4);assert.equal(city.spots.length,7);
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
 const poles=[];for(let d=2;d<city.routes[0].length;d+=9.4){const a=city.routes[0].at(d);for(const x of[-1.35,3.65])poles.push(add(a.p,mul([a.f[2],0,-a.f[0]],x)));}
 for(const edge of city.routes)for(let d=0;d<edge.length;d+=.13)for(const pole of poles)poleClearance=Math.min(poleClearance,Math.hypot(...[edge.at(d).p[0]-pole[0],edge.at(d).p[2]-pole[2]]));
 assert.ok(poleClearance>1.12,'catenary masts clear both vehicle envelopes: '+poleClearance);
 // The room default participates in normal mesh ownership, without being
 // written into a visitor's saved selections merely by entering the room.
 const defaultStock=ensureRunningCollection(city.trains[0].collectionChoice);
 pruneRunningCollection();assert.equal(ensureRunningCollection(city.trains[0].collectionChoice),defaultStock);
 assert.equal(selectedCollection.hudson,undefined);
 const originalPower=acelaPowerCar,savedMesh=Builder.prototype.mesh,savedPaint=trainPaint,savedSeed=seed;
 acelaPowerCar=()=>{throw Error('Acela fixture');};
 assert.throws(()=>collectionGeometry({id:'acela',livery:1,cars:6}),/Acela fixture/);acelaPowerCar=originalPower;
 assert.equal(Builder.prototype.mesh,savedMesh);assert.equal(trainPaint,savedPaint);assert.equal(seed,savedSeed);
 globalThis.hudsonReport={roomVertices:city.mesh.count,wallVertices:city.walls.reduce((n,w)=>n+w.mesh.count,0),buildings:hudsonRects.length,population:city.population,viewpoints:city.spots.length,trainVertices:Object.values(collectionGeometry({id:'acela',livery:0,cars:6})).reduce((n,m)=>n+m.count,0),minimumBuildingClearance:buildingClearance,minimumMastClearance:poleClearance,routeLengths:city.routes.map(r=>r.length)};
`);
console.log(JSON.stringify(state.context.hudsonReport,null,2));
console.log('Hudson QA passed: fixed mesh budget, closed parallel circuits, building/mast clearance, Acela defaults, eight-vehicle formation, attribution, cache ownership and failed-build recovery.');
