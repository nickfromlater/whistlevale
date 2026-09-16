import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {communityContext,loadCommunity,loadContributionDefinitions,prepareCommunityGeometry} from './community-lib.mjs';

const s=await communityContext();s.context.assert=assert;
await loadContributionDefinitions(s,await loadCommunity());prepareCommunityGeometry(s);
for(const species of ['zebra','elephant']){
 const dir=new URL('../models/safari-companions/'+species+'/',import.meta.url);
 const receipt=JSON.parse(await readFile(new URL('export-report.json',dir),'utf8'));
 assert.equal(createHash('sha256').update(await readFile(new URL('../src/scenery/safari-'+species+'-model.js',import.meta.url))).digest('hex'),receipt.sha256);
 assert.equal(createHash('sha256').update(await readFile(new URL('safari-'+species+'.blend',dir))).digest('hex'),receipt.blendSHA256);
 for(const [file,key]of [['reference.png','referenceSHA256'],['landmarks.json','landmarksSHA256'],['../build-source.py','authoringScriptSHA256'],['../export.py','exporterSHA256']])assert.equal(createHash('sha256').update(await readFile(new URL(file,dir))).digest('hex'),receipt[key],file+' matches export provenance');
}
s.run(`var companionScene=getHouseScene('safari'),companionLife=companionScene.wildlife;
assert.deepEqual(Array.from(companionLife.companions,a=>a.species).sort(),['elephant','zebra','zebra']);
var companionGeometry={};
for(const [species,source]of Object.entries(companionLife.companionSources)){
 assert.equal(source.format,'whistlevale-skinned-v1');assert.ok(source.bones.length>=18&&source.bones.length<=24);
 const vertices=safariSkinDecode(source.vertexData,Float32Array),indices=safariSkinDecode(source.indexData,Uint32Array);
 assert.equal(vertices.length,source.vertices*19);assert.ok(indices.length<=60000&&indices.length%3===0);assert.ok(indices.every(i=>i<source.vertices));
 source.bones.forEach((bone,i)=>{assert.ok(bone.parent===null||bone.parent<i);assert.ok([...bone.rest,...bone.inverseBind].every(Number.isFinite));});
 for(let i=0;i<vertices.length;i+=19){const v=vertices.subarray(i,i+19);assert.ok(v.every(Number.isFinite));assert.ok(v.subarray(8,12).every(j=>Number.isInteger(j)&&j>=0&&j<source.bones.length));assert.ok(v.subarray(12,16).every(w=>w>=0&&w<=1));assert.ok(Math.abs(v.subarray(12,16).reduce((a,b)=>a+b,0)-1)<.0001);}
 for(const action of [source.walk,source.browse]){assert.ok(action.frames.length>=12);for(const frame of action.frames){assert.equal(frame.length,source.bones.length);assert.ok(frame.every(b=>b.length===7&&b.every(Number.isFinite)));}}
 const feet=source.feet.map(foot=>{const candidates=[];for(let i=0;i<vertices.length;i+=19){const v=vertices.subarray(i,i+19);let weight=0;for(let k=0;k<4;k++)if(v[8+k]===foot.bone)weight+=v[12+k];if(weight>.5)candidates.push(i);}assert.ok(candidates.length>0,'each foot has a weighted surface');const low=Math.min(...candidates.map(i=>vertices[i+1]));return candidates.filter(i=>vertices[i+1]<low+.035);});
 const feedingBone=source.bones.findIndex(b=>b.name===(species==='zebra'?'head':'trunk.5')),feedingCandidates=[];
 for(let i=0;i<vertices.length;i+=19){const v=vertices.subarray(i,i+19);let weight=0;for(let k=0;k<4;k++)if(v[8+k]===feedingBone)weight+=v[12+k];if(weight>.65)feedingCandidates.push(i);}
 assert.ok(feedingCandidates.length>0,'feeding surface has anatomical weights');
 const muzzleX=Math.max(...feedingCandidates.map(i=>vertices[i])),feeding=species==='zebra'?feedingCandidates.filter(i=>vertices[i]>muzzleX-.12):feedingCandidates;
 companionGeometry[species]={vertices,indices,feet,feeding};
}
var companionMeasures=companionLife.companions.map(a=>({species:a.species,states:{},travel:0,maxStep:0,minRailLowerBound:Infinity,minBank:Infinity,minWalk:Infinity,minGround:Infinity,maxFootGap:-Infinity,minFootGap:Infinity,minFeedingGap:Infinity,maxFeedingGap:-Infinity,previous:null}));
var companionMeshes=companionLife.parts.filter(p=>p.name!=='skin');
assert.equal(companionMeshes.length,2,'one shared skin per species');
var companionVertices=companionMeshes.reduce((n,p)=>n+p.mesh.count,0);
assert.ok(companionVertices<100000,'shared companion geometry stays bounded');
var poseCompanions=()=>JSON.stringify(companionLife.companions.map(a=>[[...a.models],Array.from(a.bones)]));
var beforeCompanions=poseCompanions();safariUpdateWildlife(companionScene,.5);assert.notEqual(poseCompanions(),beforeCompanions);
reduceMotion=true;safariUpdateWildlife(companionScene,0);var frozenCompanions=poseCompanions(),frozenTime=companionLife.time;
safariUpdateWildlife(companionScene,5);assert.equal(companionLife.time,frozenTime);assert.equal(poseCompanions(),frozenCompanions);reduceMotion=false;
var oldDraw=draw,oldUniform=gl.uniformMatrix4fv,oldLocation=gl.getUniformLocation,companionDraws=[],palette,companionColor={u:{}},companionShadow={u:{}};
gl.getUniformLocation=(p,name)=>name;gl.uniformMatrix4fv=(name,transpose,m)=>{if(name==='uWildlifeBones[0]')palette=Array.from(m);};draw=(mesh,matrix,p)=>companionDraws.push({mesh,matrix,p,palette});
try{safariDrawCompanions(companionLife,companionColor);safariDrawCompanions(companionLife,companionShadow);}finally{draw=oldDraw;gl.uniformMatrix4fv=oldUniform;gl.getUniformLocation=oldLocation;}
var companionDrawCount=companionDraws.length/2;
assert.equal(companionDrawCount,companionLife.companions.reduce((n,a)=>n+a.models.size,0),'every posed component has a rendered mesh');
for(let i=0;i<companionDrawCount;i++){assert.equal(companionDraws[i].mesh,companionDraws[i+companionDrawCount].mesh);assert.equal(companionDraws[i].matrix,companionDraws[i+companionDrawCount].matrix);assert.deepEqual(companionDraws[i].palette,companionDraws[i+companionDrawCount].palette,'identical color and shadow poses');}
assert.equal(companionLife.time,frozenTime,'rendering cannot advance the shared clock');`);

// Two complete elephant cycles at 60 Hz; examine the actual emitted surfaces
// every two seconds, independently of the runtime ground-contact markers.
for(let batch=0;batch<44;batch++)s.run(`for(let frame=0;frame<120;frame++){
 companionLife.time+=1/60;safariUpdateCompanions(companionLife);
 companionLife.companions.forEach((a,i)=>{
  const m=companionMeasures[i];m.states[a.behavior]=(m.states[a.behavior]||0)+1;
  assert.ok(a.bones.every(Number.isFinite));for(const matrix of a.models.values())assert.ok(matrix.every(Number.isFinite),'finite component transforms');
  if(m.previous){const d=Math.hypot(a.position[0]-m.previous[0],a.position[2]-m.previous[2]);m.travel+=d;m.maxStep=Math.max(m.maxStep,Math.hypot(...a.position.map((v,k)=>v-m.previous[k])));if(a.feeding>.99)assert.ok(d<1e-7,'feeding animals stop traveling');}m.previous=[...a.position];
  if(frame%15===0&&a.feeding>.99){
   const geometry=companionGeometry[a.species],matrix=a.models.get('skin');let bottom=Infinity;
   for(const k of geometry.feeding){const v=geometry.vertices.subarray(k,k+19),local=[0,0,0];for(let influence=0;influence<4;influence++){const q=transform(v.subarray(0,3),a.bones.subarray(v[8+influence]*16,v[8+influence]*16+16));for(let axis=0;axis<3;axis++)local[axis]+=q[axis]*v[12+influence];}const p=transform(local,matrix);bottom=Math.min(bottom,p[1]-safariSurface(p[0],p[2]));}
   m.minFeedingGap=Math.min(m.minFeedingGap,bottom);m.maxFeedingGap=Math.max(m.maxFeedingGap,bottom);
  }
 });
 if(frame!==119)continue;
 const rendered=[],savedDraw=draw;draw=(mesh,matrix)=>rendered.push({mesh,matrix});try{safariDrawCompanions(companionLife,{u:{}});}finally{draw=savedDraw;}
 for(const {mesh,matrix}of rendered){
  const animalIndex=companionLife.companions.findIndex(a=>Array.from(a.models.values()).includes(matrix)),a=companionLife.companions[animalIndex],m=companionMeasures[animalIndex];
  const geometry=companionGeometry[a.species],positions=new Map();
  for(let k=0;k<geometry.vertices.length;k+=19){
   const v=geometry.vertices.subarray(k,k+19),local=[0,0,0];for(let influence=0;influence<4;influence++){const q=transform(v.subarray(0,3),a.bones.subarray(v[8+influence]*16,v[8+influence]*16+16));for(let axis=0;axis<3;axis++)local[axis]+=q[axis]*v[12+influence];}
   const p=transform(local,matrix),gap=p[1]-safariSurface(p[0],p[2]);positions.set(k,gap);
   assert.ok(Math.abs(p[0])<55&&Math.abs(p[2])<39,'complete animal stays on the board');
   m.minRailLowerBound=Math.min(m.minRailLowerBound,Math.min(5,safariRailNear(p[0],p[2]).distance));m.minBank=Math.min(m.minBank,safariBank(p[0],p[2]));m.minWalk=Math.min(m.minWalk,safariWalkDistance(p[0],p[2]));m.minGround=Math.min(m.minGround,gap);
  }
  for(const foot of geometry.feet){const sole=Math.min(...foot.map(k=>positions.get(k)));m.minFootGap=Math.min(m.minFootGap,sole);m.maxFootGap=Math.max(m.maxFootGap,sole);}
 }
}`);
const report=s.run(`({sharedVertices:companionVertices,drawCallsPerPass:companionDrawCount,animals:companionMeasures.map(({previous,...m})=>m)})`);
console.log(JSON.stringify(report,null,2));
for(const a of report.animals){
 assert.ok(a.states.walking>0&&a.states[a.species==='elephant'?'foraging':'grazing']>0,'each species walks and feeds');
 assert.ok(a.travel>10&&a.maxStep<.08,'visible continuous travel');
 assert.ok(a.minRailLowerBound>1.35&&a.minBank>1&&a.minWalk>.25,'whole surfaces clear railway, river and walking paths');
 assert.ok(a.minGround>-.15,'animal surfaces do not penetrate the ground deeply');
 assert.ok(a.minFootGap>-.10&&a.maxFootGap<.30,'feet stay grounded with a bounded swing lift');
 assert.ok(a.minFeedingGap>-.15&&a.minFeedingGap<.30,'weighted muzzle or trunk surface reaches the grass');
 if(a.species==='elephant')assert.ok(a.maxFeedingGap-a.minFeedingGap>.15,'trunk has a visible reach-and-lift cycle');
}
s.run(`var ownedCompanionMeshes=companionLife.parts.map(p=>p.mesh),releasedCompanionMeshes=[],savedDispose=disposeMesh;
disposeMesh=m=>releasedCompanionMeshes.push(m);
try{registerHouseRoom('safari',{...HOUSE_ROOMS.safari,build:HOUSE_ROOM_BUILDERS.get('safari'),shell:ROOM_SHELLS.safari});}finally{disposeMesh=savedDispose;}
for(const mesh of ownedCompanionMeshes)assert.equal(releasedCompanionMeshes.filter(m=>m===mesh).length,1,'each wildlife mesh is released once');`);
console.log('Companion animation, terrain contact, clearances, shared render passes and disposal verified.');
