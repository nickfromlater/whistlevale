#!/usr/bin/env node
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as THREE from '../vendor/queens-miniature/three.module.min.js';
import {buildQueens,indexQueensGeometry} from '../vendor/queens-miniature/model.js';
import {communityContext,loadContributionDefinitions,prepareCommunityGeometry,read} from './community-lib.mjs';

const f=await communityContext();await loadContributionDefinitions(f,JSON.parse(await read('contributions/world.json')));
const paints=[];f.context.paints=paints;f.run('const queensSavedArt=artSlot;artSlot=function(key,x,y,w,h,paint){paints.push({key,x,y,w,h});return queensSavedArt(key,x,y,w,h,paint);};');
prepareCommunityGeometry(f);f.run('coastWindowArt();');
const room=f.run('HOUSE_ROOMS.queens'),record=f.run('QUEENS_PROJECT');
assert.equal(room.map.plot,'east-5');assert.equal(room.railway,false);assert.equal(room.credits[0].handle,'nickfromlater');
const credit=paints.find(p=>p.key===record.plaque);assert.ok(credit,'Queens has its own real atlas plaque');
for(const p of paints){if(p.key===credit.key)continue;assert.ok(credit.x+credit.w<=p.x||p.x+p.w<=credit.x||credit.y+credit.h<=p.y||p.y+p.h<=credit.y,'Queens credit overlaps '+p.key);}
const native=f.run(`(()=>{const b=new Builder(),scene={routes:[],trains:[],actors:[],population:0};const walls=queensShell(b);buildQueensRoom(scene,b);let min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];for(let i=0;i<b.data.length;i+=12)for(let j=0;j<3;j++){min[j]=Math.min(min[j],b.data[i+j]);max[j]=Math.max(max[j],b.data[i+j]);}return {vertices:b.data.length/12,walls:walls.map(w=>({which:w.which,count:w.mesh.count})),min,max,spots:scene.spots.length,trains:scene.trains.length};})()`);
assert.ok(native.vertices<130000,'native furnishings and map relief stay below 130k vertices');
assert.ok(native.walls.reduce((n,w)=>n+w.count,0)<110000,'all four gallery walls stay below 110k vertices');
assert.ok(native.min[0]>=-79&&native.max[0]<=79&&native.min[2]>=-65&&native.max[2]<=65,'native room fits registered footprint');
assert.equal(native.spots,6);assert.equal(native.trains,0);
f.context.THREE=THREE;
for(const scale of [.49,1.2])for(const offset of [0,.11]){
 const transform=new THREE.Matrix4().makeScale(scale,scale,scale);transform.setPosition(0,-8.5,0);
 const house=new THREE.PerspectiveCamera(43,1.6,.3,500);house.position.set(50,45,110);house.lookAt(0,-1,0);house.projectionMatrix.elements[8]=offset;house.updateMatrixWorld(true);
 const camera=new THREE.PerspectiveCamera();f.context.qcamera=camera;f.context.qinverse=transform.clone().invert();f.context.qscale=scale;f.context.qstate={eye:house.position.toArray(),target:[0,-1,0],near:.3,projection:house.projectionMatrix.elements};
 f.run('queensCamera(THREE,qcamera,qstate,qinverse,qscale)');
 for(let i=0;i<120;i++){const p=new THREE.Vector3(Math.sin(i)*90,Math.cos(i*.4)*20,Math.sin(i*.7)*75);assert.ok(p.clone().applyMatrix4(transform).project(house).distanceTo(p.clone().project(camera))<1e-10);}
}
// Actual original builders, using a no-op texture canvas rather than a GPU.
// This exercises the whole model and simulation, not a copy of their logic.
globalThis.document={createElement(){const canvas={width:1,height:1};const gradient={addColorStop(){}};const ctx=new Proxy({canvas,createLinearGradient:()=>gradient,createRadialGradient:()=>gradient,measureText:s=>({width:s.length*20})},{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)});canvas.getContext=()=>ctx;return canvas;}};
const scene=new THREE.Scene(),renderer={capabilities:{getMaxAnisotropy:()=>1},shadowMap:{needsUpdate:false}},stages=[];
const model=await buildQueens({THREE,scene,renderer,step:async s=>{stages.push(s);},reduced:true});
assert.equal(stages.length,8);assert.equal(model.seats,8198);assert.equal(model.spectators,6441);assert.deepEqual(model.trains.map(t=>t.cars.length),[6,4]);
scene.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(scene);assert.ok(bounds.min.toArray().concat(bounds.max.toArray()).every(Number.isFinite));
assert.ok(bounds.min.x>=-105&&bounds.max.x<=105&&bounds.min.z>=-89&&bounds.max.z<=89,'complete model fits its board');
// Probe the rendered shell itself, from both sides at every facade level.
// Decorative window panels must never be the only barrier to the room behind.
const shell=[],roofMeshes=[];scene.traverse(o=>{if(o.isMesh&&o.material?.name==='Queens opaque concourse')shell.push(o);});assert.ok(shell.length);model.roof.traverse(o=>{if(o.isMesh)roofMeshes.push(o);});
const modelTransform=model.roof.parent.matrixWorld,ray=new THREE.Raycaster(),origin=new THREE.Vector3(),direction=new THREE.Vector3();
function probe(objects,x,y,z,dx,dy,dz){origin.set(x,y,z).applyMatrix4(modelTransform);direction.set(dx,dy,dz).transformDirection(modelTransform);ray.set(origin,direction);return ray.intersectObjects(objects,true);}
let shellSamples=0,roofSamples=0;
for(const y of[1.7,7.3,12.8,19.8])for(let i=0;i<192;i++)for(const inside of[false,true]){const a=i*Math.PI*2/192,x=Math.sin(a),z=Math.cos(a),r=inside?0:65,sign=inside?1:-1;assert.ok(probe(shell,x*r,y,z*r,x*sign,0,z*sign).length,'opaque shell closes every facade bay from inside and outside');shellSamples++;}
for(let i=0;i<=24;i++)for(const side of[-1,1]){assert.ok(probe(roofMeshes,-24+i*2,40,side*38,0,-1,0).length,'continuous end canopy');assert.ok(probe(roofMeshes,side*33,40,-28+i*56/24,0,-1,0).length,'continuous side canopy');roofSamples+=2;}
assert.equal(probe(roofMeshes,0,40,0,0,-1,0).length,0,'the roof still has its intentional centre opening');
// Test authored spectator cameras against the actual transformed scene, with
// the roof in place. Both baselines and the complete far scoreboard fit.
const opaque=[];scene.traverse(o=>{if(o.isMesh&&o.material&&!o.material.transparent)opaque.push(o);});
let seatSamples=0;
const houseTransform=new THREE.Matrix4().makeScale(.49,.49,.49).setPosition(0,-8.5,0),seatPoint=new THREE.Vector3();
for(const [width,height]of[[1180,850],[390,844],[320,844]]){
 const view=f.run(`queensSeatView(${width},${height})`),camera=new THREE.PerspectiveCamera(view.fov*180/Math.PI,width/height,.1,500);camera.position.fromArray(view.position);camera.lookAt(...view.target);camera.updateMatrixWorld(true);
 for(const x of[-5.485,5.485])for(const z of[-11.885,11.885]){seatPoint.set(x,1.35,z).applyMatrix4(modelTransform).applyMatrix4(houseTransform).project(camera);assert.ok(Math.abs(seatPoint.x)<.9&&seatPoint.y>-.84&&seatPoint.y<.8,'both baselines fit above the controls at '+width);seatSamples++;}
 for(const x of[-10.4,10.4])for(const y of[15.335,23.865]){seatPoint.set(x,y,-30.74).applyMatrix4(modelTransform).applyMatrix4(houseTransform).project(camera);assert.ok(Math.abs(seatPoint.x)<.8&&seatPoint.y>-.7&&seatPoint.y<.8,'the whole scoreboard fits below the header at '+width);seatSamples++;}
 for(const p of[[-4.7,1.36,13.3],[4.7,1.36,13.3],[-5.3,3.2,-13.5],[5.3,3.2,-13.5]]){seatPoint.fromArray(p).applyMatrix4(modelTransform).applyMatrix4(houseTransform).project(camera);assert.ok(Math.abs(seatPoint.x)<.9&&seatPoint.y>-.84&&seatPoint.y<.8,'both players stay clear of cinema controls at '+width);seatSamples++;}
 origin.fromArray(view.position).applyMatrix4(houseTransform.clone().invert());
 for(const p of[[0,1.4,-11.885],[0,1.4,11.885],[-4.115,1.4,-6.4],[4.115,1.4,6.4],[0,19.2,-30.74]]){
  seatPoint.fromArray(p).applyMatrix4(modelTransform);const distance=seatPoint.distanceTo(origin);ray.set(origin,direction.copy(seatPoint).sub(origin).normalize());ray.far=distance+.02;
  const hit=ray.intersectObjects(opaque,false)[0];assert.ok(!hit||hit.distance>=distance-.05,'clear spectator sightline at '+width+' to '+p+'; blocked by '+hit?.object.material.name+' at '+hit?.distance);seatSamples++;
 }
}
ray.far=Infinity;
const arrays=new Set();let instances=0,meshes=0;
scene.traverse(o=>{if(!o.geometry)return;meshes++;for(const attr of Object.values(o.geometry.attributes)){arrays.add(attr.array);assert.ok(attr.array.every(Number.isFinite),'finite vertex attributes');}if(o.geometry.index)arrays.add(o.geometry.index.array);if(o.instanceMatrix){arrays.add(o.instanceMatrix.array);instances+=o.count;}if(o.instanceColor)arrays.add(o.instanceColor.array);});
const bytes=[...arrays].reduce((n,a)=>n+a.byteLength,0);console.log('Model geometry MiB:',bytes/1024/1024);assert.ok(bytes<55*1024*1024,'model GPU geometry stays below 55 MiB');
// Indexing preserves every Float32 attribute at every original triangle corner.
const sample=new THREE.BoxGeometry(3,5,7,2,2,2).toNonIndexed(),saved=Object.fromEntries(Object.entries(sample.attributes).map(([key,a])=>[key,a.array.slice()]));indexQueensGeometry(THREE,sample);assert.ok(sample.index);
for(const [name,a]of Object.entries(sample.attributes))for(let i=0;i<sample.index.count;i++)for(let k=0;k<a.itemSize;k++)assert.ok(Object.is(a.array[sample.index.getX(i)*a.itemSize+k],saved[name][i*a.itemSize+k]),'indexing preserves exact triangle attributes');
for(const t of model.trains){assert.ok(t.length>400);assert.ok(t.curve.getPointAt(0).distanceTo(t.curve.getPointAt(1))<1e-8);let previous=t.curve.getPointAt(0);for(let i=1;i<=1200;i++){const p=t.curve.getPointAt(i/1200);assert.ok(previous.distanceTo(p)<1,'continuous rails');assert.ok(p.toArray().every(Number.isFinite));previous=p;}}
let before=model.trains.map(t=>t.u);model.tick(1,0,true);assert.deepEqual(model.trains.map(t=>t.u),before,'pause freezes both trains');model.tick(1,0,false);assert.ok(model.trains.every((t,i)=>t.u!==before[i]));
model.seven.u=model.stationStop-.00001;model.seven.hold=0;model.tick(.1,0,false);assert.equal(model.seven.u,model.stationStop);assert.equal(model.seven.hold,6,'7 stops at its platform');
model.setRoof(true);for(let i=0;i<80;i++)model.tick(.05,1,true);assert.ok(model.stats().roofLift>.99);assert.equal(model.roof.visible,false);assert.equal(model.stats().night,1);
model.play();for(let i=0;i<230;i++)model.tick(.05,1,false);assert.equal(model.stats().matchWon,true,'point reaches championship state');for(let i=0;i<140;i++)model.tick(.05,1,false);assert.equal(model.stats().playing,false,'replay becomes available');
// Watch mode has real, synchronized racquet contacts and repeating rallies.
const ball=scene.getObjectByName('Queens match ball'),rackets=['01','02'].map(n=>scene.getObjectByName('Queens racket '+n));
model.setWatching(true);assert.equal(model.stats().roofTarget,0,'watching replaces the roof around the spectators');
let contactTime=0;for(const [t,player]of[[.93,0],[2.15,1],[3.5,0],[4.88,1],[6.27,0],[7.72,1],[9.15,0]]){
 model.tick(t-contactTime,0,false);contactTime=t;scene.updateMatrixWorld(true);const face=rackets[player].localToWorld(new THREE.Vector3(0,0,.49)),position=ball.getWorldPosition(new THREE.Vector3());assert.ok(face.distanceTo(position)/.74<.13,'the racquet meets the ball at '+t);
}
const pausedPose=()=>JSON.stringify({time:model.stats().matchTime,ball:ball.position.toArray(),players:['01','02'].map(n=>{const p=scene.getObjectByName('Queens player '+n);return[p.position.toArray(),rackets[n==='01'?0:1].parent.quaternion.toArray()];})});
const frozen=pausedPose();model.tick(5,0,true);assert.equal(pausedPose(),frozen,'pause freezes the ball and both player poses');
for(let i=0;i<650;i++)model.tick(.05,0,false);assert.ok(model.stats().rally>=4&&model.stats().watching&&model.stats().playing,'watching continues into successive rallies');assert.equal(model.stats().matchWon,false,'exhibition rallies do not repeat championship celebrations');
model.setWatching(false);assert.equal(model.stats().playing,false,'leaving the seat stops watch mode');assert.equal(model.stats().rally,0);model.play();assert.equal(model.stats().watching,false);assert.equal(model.stats().roofTarget,1,'the standalone final point still lifts the roof');
const sha=s=>createHash('sha256').update(s).digest('hex');
assert.equal(sha(await read('vendor/queens-miniature/original-model.js')),'9068666955859b62f98eae97afbf108830d24dfa3e0597ef524c78f91f2c478d');
assert.equal(sha(await read('vendor/queens-miniature/three.module.min.js')),'3e690ac7d180b0aadf0891bea39eec643e29e2d3e75c99b18689518665f69ba6');
const adapter=await read('src/guest-queens.js'),modelSource=await read('vendor/queens-miniature/model.js');
assert.ok(!adapter.includes('requestAnimationFrame(')&&!modelSource.includes('requestAnimationFrame('));assert.ok(!modelSource.includes('setTimeout('));assert.match(adapter,/renderer\.forceContextLoss\(\)/);assert.match(adapter,/signal\.addEventListener\('abort',dispose/);
f.context.qscene=scene;f.run('queensDisposeScene(qscene)');assert.equal(scene.children.length,0);
console.log(JSON.stringify({queens:'PASS',native,model:{seats:model.seats,spectators:model.spectators,meshes,instances,geometryMiB:bytes/1024/1024,bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()}},cameraSamples:480,seatSamples,racquetContacts:7,railSamples:2400,shellSamples,roofSamples},null,2));
