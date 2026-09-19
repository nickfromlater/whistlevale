import assert from 'node:assert/strict';
import {communityContext,loadContributionDefinitions,prepareCommunityGeometry,read} from './community-lib.mjs';

// Exercise the actual shared Builder, Edge, room registry and train wrappers.
// This deliberately does not import the independent presentation harness.
const index=await read('index.html');
for(const file of ['src/rooms/morrow.js','src/trains/morrow.js'])assert.equal(index.split(`src="${file}"`).length-1,1,`${file} loads once`);
assert.ok(index.indexOf('src/rooms/morrow.js')<index.indexOf('src/trains/morrow.js'));
assert.ok(index.indexOf('src/trains.js')<index.indexOf('src/trains/morrow.js'));
assert.ok(index.indexOf('src/trains/morrow.js')<index.indexOf('src/hobby.js'));
const runtime=await communityContext();
await loadContributionDefinitions(runtime,JSON.parse(await read('contributions/world.json')));
prepareCommunityGeometry(runtime);
const {context,run}=runtime,meshes=[],draws=[],links=[];
context.assert=assert;
context.morrowUpload=data=>{
 assert.equal(data.length%36,0,'complete triangles');
 assert.ok(data.length>0&&data.every(Number.isFinite),'finite geometry');
 const bounds={min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]},materials={};
 for(let i=0;i<data.length;i+=12)for(let k=0;k<3;k++){
  bounds.min[k]=Math.min(bounds.min[k],data[i+k]);bounds.max[k]=Math.max(bounds.max[k],data[i+k]);
 }
 for(let i=9;i<data.length;i+=12)materials[data[i]]=(materials[data[i]]||0)+1;
 const mesh={count:data.length/12,bounds,materials};meshes.push(mesh);return mesh;
};
context.morrowDraw=(mesh,matrix)=>{assert.ok(mesh&&mesh.count>0);assert.ok(Array.from(matrix).every(Number.isFinite));draws.push(mesh);};
context.morrowLink=(mesh,a,b)=>{assert.ok([...a,...b].every(Number.isFinite));links.push([a,b]);};
run('upload=morrowUpload;');
const report=run(`(()=>{
 const originalSeed=seed,b=new Builder(),scene={key:'morrow'};
 morrowRoom(scene,b);const room=b.mesh(),floorBuilder=new Builder(),walls=morrowShell(floorBuilder),floor=floorBuilder.mesh(),stock=buildMorrowStock();
 assert.equal(seed,originalSeed,'build does not consume shared random state');
 assert.equal(scene.routes.length,1);assert.equal(scene.trains.length,1);assert.equal(scene.trains[0].stock,'morrow');assert.equal(scene.trains[0].cars,3);
 assert.equal(scene.spots.length,10);assert.equal(walls.length,4);
 assert.ok(scene.spots.some(s=>s.name==='The horologist’s garden'));
 assert.ok(scene.spots.some(s=>s.name==='The moonwater landing'));
 assert.ok(scene.spots.some(s=>s.name==='The phantasmagoria'));
 assert.equal(b.stack.length,0,'room transform stack balanced');assert.equal(floorBuilder.stack.length,0,'shell transform stack balanced');
 assert.equal(HOUSE_ROOMS.morrow.trainCollection,false,'bespoke stock is not replaced by the cabinet');
 assert.equal(collectionTrainLabel('morrow').name,'The Mourning Star','correct locomotive label');
 assert.equal(collectionTrainLabel('morrow').number,'XIII');assert.equal(collectionPower('morrow'),'steam');
 assert.ok(room.count<650000,'static room budget');assert.ok(walls.every(w=>w.mesh.count<120000),'wall budgets');
 assert.ok(room.count+floor.count<650000,'room including floor remains inside the existing budget');
 assert.ok(stock.engine.materials[76]>0&&stock.coach.materials[76]>=72,'cab and coach glazing remains transparent');
 assert.ok(stock.projectionBright.materials[84]>0&&stock.projectorBeam.materials[84]>0,'projection beam is transparent');
 assert.ok(stock.glowWarm.materials[84]>0&&stock.glowCold.materials[84]>0&&stock.watchingEyes.materials[84]>0,'haunting light effects use the transparent effect path');
 assert.ok(stock.engine.count>1000&&stock.coach.count>1000,'bespoke stock exists');
 assert.ok(room.bounds.max[1]<34&&room.bounds.min[1]>=FLOOR-.01,'world vertical bounds');
 assert.ok(len(sub(MORROW_ROUTE.at(0).p,MORROW_ROUTE.at(MORROW_ROUTE.length).p))<.02,'closed circuit');
 for(let d=0;d<MORROW_ROUTE.length;d+=.1){const p=MORROW_ROUTE.at(d).p;assert.ok(p.every(Number.isFinite));assert.ok(Math.abs(p[1]-MORROW.railY)<1e-6);assert.ok(Math.abs(p[0])<55&&Math.abs(p[2])<33);}
 // Every portal crossing stays inside the actual arched opening.
 for(const x of [-11.9,17.9]){
  let clear=false;for(let d=0;d<MORROW_ROUTE.length;d+=.04){const p=MORROW_ROUTE.at(d).p;if(Math.abs(p[0]-x)<.05&&Math.abs(p[2]+16)<2){assert.ok(Math.abs(p[2]+16)+.72<2.13,'lateral portal clearance');clear=true;}}
  assert.ok(clear,'rail crosses each portal');
 }
 assert.ok(MORROW.railY+stock.coachRoof.bounds.max[1]<6.20,'roof clears vault');
 assert.ok(MORROW_STOCK.coachSpacing>4.8,'coach buffer spacing');
 collectionStock.set('morrow',stock);draw=morrowDraw;drawLink=morrowLink;mainProgram='morrow-qa-main';
 for(const cars of [1,3,8])for(const distance of [0,60,150,MORROW_ROUTE.length-.2])for(const open of [false,true]){
  scene.trains[0].cars=cars;scene.trains[0].distance=distance;cutaway=open;clock=17.25;reduceMotion=false;morrowDrawFormation(scene,scene.trains[0],mainProgram);
 }
 reduceMotion=true;clock=1e6;morrowDrawFormation(scene,scene.trains[0],mainProgram);
 // Decorative motion must freeze at the same pose, not merely render without errors.
 const savedDraw=draw,poses=[];
 try{
  draw=(mesh,matrix)=>poses.push({mesh,model:Array.from(matrix)});
  reduceMotion=true;clock=0;morrowDrawHaunt(stock,mainProgram);const first=JSON.stringify(poses);
  poses.length=0;clock=12345;morrowDrawHaunt(stock,mainProgram);assert.equal(JSON.stringify(poses),first,'reduced motion freezes all haunting poses');
  poses.length=0;reduceMotion=false;clock=17.25;morrowDrawHaunt(stock,mainProgram);assert.notEqual(JSON.stringify(poses),first,'normal haunting is animated');
 }finally{draw=savedDraw;reduceMotion=true;}
 return {room:room.count,floor:floor.count,walls:walls.map(w=>({which:w.which,vertices:w.mesh.count})),stock:Object.fromEntries(Object.entries(stock).map(([key,m])=>[key,m.count])),routeLength:MORROW_ROUTE.length,places:scene.spots.length};
})()`);
const allocations=meshes.length;
run('morrowDrawFormation({},{edge:MORROW_ROUTE,distance:42,cars:3},mainProgram);');
assert.equal(meshes.length,allocations,'drawing never allocates geometry');
assert.ok(draws.length>100&&links.length>0,'stock draws and real couplings are exercised');
console.log('Morrow House: native geometry, route, portal, stock, labeling, glazing, phantasmagoria and motion checks passed.');
console.log(JSON.stringify({...report,draws:draws.length,couplings:links.length,totalVertices:meshes.reduce((n,m)=>n+m.count,0)},null,2));
