import assert from 'node:assert/strict';
import {communityContext,loadCommunity,loadContributionDefinitions,prepareCommunityGeometry} from './community-lib.mjs';

const s=await communityContext();s.context.assert=assert;
await loadContributionDefinitions(s,await loadCommunity());prepareCommunityGeometry(s);
s.run(`var captureCompanions=false,originalCompanionBuild=safariBuildCompanions,originalUpload=upload;
safariBuildCompanions=function(life){captureCompanions=true;try{return originalCompanionBuild(life);}finally{captureCompanions=false;}};
upload=function(data){const mesh=originalUpload(data);if(captureCompanions)mesh.qaData=Array.from(data);return mesh;};
var companionScene=getHouseScene('safari'),companionLife=companionScene.wildlife;
assert.deepEqual(Array.from(companionLife.companions,a=>a.species).sort(),['elephant','zebra','zebra']);
var companionMeasures=companionLife.companions.map(a=>({species:a.species,states:{},travel:0,maxStep:0,minRailLowerBound:Infinity,minBank:Infinity,minWalk:Infinity,minGround:Infinity,maxFootGap:-Infinity,minFootGap:Infinity,previous:null}));
var companionMeshes=companionLife.parts.filter(p=>p.name!=='skin');
assert.ok(companionMeshes.every(p=>p.mesh.qaData.length>0&&p.mesh.qaData.every(Number.isFinite)));
var companionVertices=companionMeshes.reduce((n,p)=>n+p.mesh.count,0);
assert.ok(companionVertices<100000,'shared companion geometry stays bounded');
var poseCompanions=()=>JSON.stringify(companionLife.companions.map(a=>[...a.models]));
var beforeCompanions=poseCompanions();safariUpdateWildlife(companionScene,.5);assert.notEqual(poseCompanions(),beforeCompanions);
reduceMotion=true;safariUpdateWildlife(companionScene,0);var frozenCompanions=poseCompanions(),frozenTime=companionLife.time;
safariUpdateWildlife(companionScene,5);assert.equal(companionLife.time,frozenTime);assert.equal(poseCompanions(),frozenCompanions);reduceMotion=false;
var oldDraw=draw,companionDraws=[];draw=(mesh,matrix,p)=>companionDraws.push({mesh,matrix,p});
try{safariDrawCompanions(companionLife,'color');safariDrawCompanions(companionLife,'shadow');}finally{draw=oldDraw;}
var companionDrawCount=companionDraws.length/2;
assert.equal(companionDrawCount,companionLife.companions.reduce((n,a)=>n+a.models.size,0),'every posed component has a rendered mesh');
for(let i=0;i<companionDrawCount;i++){assert.equal(companionDraws[i].mesh,companionDraws[i+companionDrawCount].mesh);assert.equal(companionDraws[i].matrix,companionDraws[i+companionDrawCount].matrix);}
assert.equal(companionLife.time,frozenTime,'rendering cannot advance the shared clock');`);

// Two complete elephant cycles at 60 Hz; examine the actual emitted surfaces
// every two seconds, independently of the runtime ground-contact markers.
for(let batch=0;batch<44;batch++)s.run(`for(let frame=0;frame<120;frame++){
 companionLife.time+=1/60;safariUpdateCompanions(companionLife);
 companionLife.companions.forEach((a,i)=>{
  const m=companionMeasures[i];m.states[a.behavior]=(m.states[a.behavior]||0)+1;
  for(const matrix of a.models.values())assert.ok(matrix.every(Number.isFinite),'finite component transforms');
  if(m.previous){const d=Math.hypot(a.position[0]-m.previous[0],a.position[2]-m.previous[2]);m.travel+=d;m.maxStep=Math.max(m.maxStep,Math.hypot(...a.position.map((v,k)=>v-m.previous[k])));if(a.feeding>.99)assert.ok(d<1e-7,'feeding animals stop traveling');}m.previous=[...a.position];
 });
 if(frame!==119)continue;
 const rendered=[],savedDraw=draw;draw=(mesh,matrix)=>rendered.push({mesh,matrix});try{safariDrawCompanions(companionLife,'audit');}finally{draw=savedDraw;}
 for(const {mesh,matrix}of rendered){
  const animalIndex=companionLife.companions.findIndex(a=>Array.from(a.models.values()).includes(matrix)),a=companionLife.companions[animalIndex],m=companionMeasures[animalIndex];
  const part=companionLife.parts.find(p=>p.mesh===mesh),isFoot=part.name.endsWith('-lower');let sole=Infinity;
  for(let k=0;k<mesh.qaData.length;k+=12){
   const p=transform(mesh.qaData.slice(k,k+3),matrix),gap=p[1]-safariSurface(p[0],p[2]);
   assert.ok(Math.abs(p[0])<55&&Math.abs(p[2])<39,'complete animal stays on the board');
   m.minRailLowerBound=Math.min(m.minRailLowerBound,Math.min(5,safariRailNear(p[0],p[2]).distance));m.minBank=Math.min(m.minBank,safariBank(p[0],p[2]));m.minWalk=Math.min(m.minWalk,safariWalkDistance(p[0],p[2]));m.minGround=Math.min(m.minGround,gap);sole=Math.min(sole,gap);
  }
  if(isFoot){m.minFootGap=Math.min(m.minFootGap,sole);m.maxFootGap=Math.max(m.maxFootGap,sole);}
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
}
s.run(`var ownedCompanionMeshes=companionLife.parts.map(p=>p.mesh),releasedCompanionMeshes=[],savedDispose=disposeMesh;
disposeMesh=m=>releasedCompanionMeshes.push(m);
try{registerHouseRoom('safari',{...HOUSE_ROOMS.safari,build:HOUSE_ROOM_BUILDERS.get('safari'),shell:ROOM_SHELLS.safari});}finally{disposeMesh=savedDispose;}
for(const mesh of ownedCompanionMeshes)assert.equal(releasedCompanionMeshes.filter(m=>m===mesh).length,1,'each wildlife mesh is released once');`);
console.log('Companion animation, terrain contact, clearances, shared render passes and disposal verified.');
