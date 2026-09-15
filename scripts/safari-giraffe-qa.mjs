import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {communityContext,loadCommunity,loadContributionDefinitions,prepareCommunityGeometry,read} from './community-lib.mjs';

const state=await communityContext();state.context.assert=assert;
await loadContributionDefinitions(state,await loadCommunity());
state.run('const giraffeNativeDispose=disposeMesh;');
prepareCommunityGeometry(state);
const receipt=JSON.parse(await read('models/safari-giraffe/export-report.json'));
assert.equal(createHash('sha256').update(await read('src/scenery/safari-giraffe-model.js')).digest('hex'),receipt.sha256,'generated skin matches receipt');
assert.equal(createHash('sha256').update(await readFile(new URL('../models/safari-giraffe/safari-giraffe.blend',import.meta.url))).digest('hex'),receipt.blendSHA256,'editable source matches receipt');
const report=state.run(`(()=>{
 const source=SAFARI_GIRAFFE_MODEL,scene=getHouseScene('safari'),life=scene.wildlife;
 assert.equal(source.format,'whistlevale-skinned-v1');assert.equal(life.herd.length,3);assert.equal(life.parts.length,1);
 assert.ok(source.bones.length<=24&&source.bones.length>=14,'articulated rig fits both shader palettes');
 source.bones.forEach((b,i)=>{assert.ok(b.parent===null||b.parent<i);assert.equal(b.rest.length,7);assert.equal(b.inverseBind.length,16);assert.ok([...b.rest,...b.inverseBind].every(Number.isFinite));});
 const vertices=safariSkinDecode(source.vertexData,Float32Array),indices=safariSkinDecode(source.indexData,Uint32Array);
 assert.equal(vertices.length,source.vertices*19);assert.ok(indices.length<=60000&&indices.length%3===0);assert.ok(indices.every(i=>i<source.vertices));
 for(let i=0;i<source.vertices;i++){
  const v=vertices.subarray(i*19,i*19+19);assert.ok(v.every(Number.isFinite));
  assert.ok(v.subarray(8,12).every(j=>Number.isInteger(j)&&j>=0&&j<source.bones.length));
  assert.ok(v.subarray(12,16).every(w=>w>=0&&w<=1));assert.ok(Math.abs(v.subarray(12,16).reduce((a,b)=>a+b,0)-1)<.0001,'normalized skin weights');
 }
 assert.ok(source.walk.stride>0);assert.ok(source.walk.frames.length>=12);
 for(const frame of source.walk.frames){assert.equal(frame.length,source.bones.length);assert.ok(frame.every(b=>b.length===7&&b.every(Number.isFinite)));}
 const pose=()=>JSON.stringify(life.herd.map(a=>[[...a.models],Array.from(a.bones)]));
 const initial=pose();safariUpdateWildlife(scene,1);assert.notEqual(pose(),initial,'weighted pose changes');
 reduceMotion=true;safariUpdateWildlife(scene,0);const still=pose(),time=life.time;
 safariUpdateWildlife(scene,4);assert.equal(life.time,time);assert.equal(pose(),still,'reduced motion freezes all bones');reduceMotion=false;
 const oldDraw=draw,seen=[],oldUniform=gl.uniformMatrix4fv,oldLocation=gl.getUniformLocation;let palette;
 const color={u:{}},shadow={u:{}};mainProgram=color;
 gl.getUniformLocation=(p,name)=>name;gl.uniformMatrix4fv=(name,transpose,m)=>{if(name==='uWildlifeBones[0]')palette=Array.from(m);};
 draw=(mesh,model)=>seen.push({mesh,model,palette});
 try{safariDrawWildlife(scene,color);safariDrawWildlife(scene,shadow);}finally{draw=oldDraw;gl.uniformMatrix4fv=oldUniform;gl.getUniformLocation=oldLocation;}
 assert.equal(seen.length,6);assert.equal(life.time,time,'draw passes do not advance motion');
 for(let i=0;i<3;i++){assert.equal(seen[i].mesh,seen[i+3].mesh);assert.equal(seen[i].model,seen[i+3].model);assert.deepEqual(seen[i].palette,seen[i+3].palette,'shadow and color upload identical bones');assert.equal(seen[i].palette.length,source.bones.length*16);}
 // Test the actual weighted sole surface, independently of runtime foot markers.
 const soles=source.feet.map(foot=>{
  const candidates=[];for(let i=0;i<source.vertices;i++){const v=vertices.subarray(i*19,i*19+19);let weight=0;for(let k=0;k<4;k++)if(v[8+k]===foot.bone)weight+=v[12+k];if(weight>.5)candidates.push(Array.from(v));}
  assert.ok(candidates.length>0,'each hoof has weighted surface geometry');const low=Math.min(...candidates.map(v=>v[1]));return candidates.filter(v=>v[1]<low+.035);
 });
 const railSamples=[];for(let d=0;d<SAFARI_ROUTE.length;d+=.5)railSamples.push(SAFARI_ROUTE.at(d).p);
 let minHoofGap=Infinity,maxHoofGap=-Infinity,minRail=Infinity,minBank=Infinity,minWalk=Infinity,moved=0,worst=null;
 for(let step=0;step<1040;step++){
  safariUpdateWildlife(scene,.25);if(step%16)continue;
  for(const animal of life.herd){
   assert.ok(animal.bones.every(Number.isFinite));const root=animal.models.get('skin');
   for(const sole of soles){let gap=Infinity;
    for(const v of sole){const p=[0,0,0];for(let k=0;k<4;k++){const t=transform(v.slice(0,3),animal.bones.subarray(v[8+k]*16,v[8+k]*16+16));for(let axis=0;axis<3;axis++)p[axis]+=t[axis]*v[12+k];}
     const world=transform(p,root);gap=Math.min(gap,world[1]-safariSurface(world[0],world[2]));
     assert.ok(Math.abs(world[0])<54&&Math.abs(world[2])<38);for(const q of railSamples)minRail=Math.min(minRail,Math.hypot(world[0]-q[0],world[2]-q[2]));minBank=Math.min(minBank,safariBank(world[0],world[2]));minWalk=Math.min(minWalk,safariWalkDistance(world[0],world[2]));
    }
    minHoofGap=Math.min(minHoofGap,gap);if(gap>maxHoofGap)worst={time:life.time,animal:life.herd.indexOf(animal),foot:soles.indexOf(sole),gap};maxHoofGap=Math.max(maxHoofGap,gap);
   }
   moved=Math.max(moved,animal.travel);
  }
 }
 assert.ok(moved>6,'family traverses complete roaming circuit');
 return{sceneVertices:scene.mesh.count,sharedVertices:indices.length,indexedVertices:source.vertices,bones:source.bones.length,sharedBufferBytes:life.parts[0].mesh.bytes,drawCallsPerPass:3,sampledSeconds:260,worst,minHoofGap,maxHoofGap,minRail,minBank,minWalk};
})()`);
console.log(JSON.stringify(report,null,2));
assert.ok(report.minHoofGap>-.08,'hooves do not sink deeply into terrain');
assert.ok(report.maxHoofGap<.23,'walking hooves stay within lift allowance');
assert.ok(report.minRail>2&&report.minBank>4&&report.minWalk>.3,'feet clear railway, river and paths');
state.run(`(()=>{
 const scene=getHouseScene('safari'),skin=scene.wildlife.parts[0].mesh,released=[],original=disposeMesh;
 disposeMesh=mesh=>released.push(mesh);
 try{registerHouseRoom('safari',{...HOUSE_ROOMS.safari,build:HOUSE_ROOM_BUILDERS.get('safari'),shell:ROOM_SHELLS.safari});}finally{disposeMesh=original;}
 assert.equal(released.filter(m=>m===skin).length,1,'cache replacement releases shared skin once');
})()`);
// Inject GPU failures and delayed image completion without requiring a GPU in CI.
const allocated=[],deleted=[],images=[];let fail=false,uploads=0,active=2,flip=false;
const gpu=new Proxy({
 createVertexArray:()=>{const r={kind:'vao'};allocated.push(r);return r;},
 createBuffer:()=>{const r={kind:'buffer'};allocated.push(r);return r;},
 createTexture:()=>{const r={kind:'texture'};allocated.push(r);return r;},
 deleteVertexArray:r=>deleted.push(r),deleteBuffer:r=>deleted.push(r),deleteTexture:r=>deleted.push(r),
 bufferData:()=>{if(fail)throw Error('injected GPU failure');},
 texImage2D:()=>uploads++,activeTexture:v=>active=v,pixelStorei:(k,v)=>flip=v,
 getParameter:k=>k==='ACTIVE_TEXTURE'?active:flip,
 ACTIVE_TEXTURE:'ACTIVE_TEXTURE',UNPACK_FLIP_Y_WEBGL:'UNPACK_FLIP_Y_WEBGL'
},{get:(o,k)=>k in o?o[k]:(typeof k==='string'&&k===k.toUpperCase()?k:()=>{})});
state.context.giraffeTestGL=gpu;state.context.Image=class{constructor(){images.push(this);}};
state.run('gl=giraffeTestGL;disposeMesh=giraffeNativeDispose;');
fail=true;assert.throws(()=>state.run('safariSkinMesh(SAFARI_GIRAFFE_MODEL)'),/injected GPU failure/);
assert.equal(deleted.length,allocated.length);for(const resource of allocated)assert.ok(deleted.includes(resource));
fail=false;state.run('const testSkin=safariSkinMesh(SAFARI_GIRAFFE_MODEL);');
images.at(-1).onload();assert.equal(active,2);assert.equal(flip,false);assert.equal(state.run('testSkin.textureReady'),true);
state.run('disposeMesh(testSkin);');const before=uploads;images.at(-1).onload();assert.equal(uploads,before,'late decode cannot resurrect disposed texture');
assert.equal(deleted.length,allocated.length);for(const resource of allocated)assert.equal(deleted.filter(r=>r===resource).length,1);
console.log('Skinned source, weights, roaming clearance, shared passes, reduced motion and GPU disposal verified.');
