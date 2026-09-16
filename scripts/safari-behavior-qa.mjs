import assert from 'node:assert/strict';
import {communityContext,loadCommunity,loadContributionDefinitions,prepareCommunityGeometry} from './community-lib.mjs';
const s=await communityContext();s.context.assert=assert;await loadContributionDefinitions(s,await loadCommunity());prepareCommunityGeometry(s);
s.run(`var probe=getHouseScene('safari'),probeSource=SAFARI_GIRAFFE_MODEL,probeVerts=safariSkinDecode(probeSource.vertexData,Float32Array),headID=probeSource.bones.findIndex(b=>b.name==='head'),nose=[];
for(let i=0;i<probeSource.vertices;i++){const v=Array.from(probeVerts.subarray(i*19,i*19+19));let w=0;for(let k=0;k<4;k++)if(v[8+k]===headID)w+=v[12+k];if(w>.5)nose.push(v);}
var tipX=Math.max(...nose.map(v=>v[0]));nose=nose.filter(v=>v[0]>tipX-.08);
var independentMoments=0;var measures=probe.wildlife.herd.map(()=>({states:{},minNose:Infinity,maxNose:0,maxStep:0,maxBodyStep:0,previousFeet:null,previousBody:null,worst:null,distance:0,walkingSeconds:0,initialGait:null,finalGait:null}));
function probePoint(v,a){const p=[0,0,0];for(let k=0;k<4;k++){const q=transform(v.slice(0,3),a.bones.subarray(v[8+k]*16,v[8+k]*16+16));for(let axis=0;axis<3;axis++)p[axis]+=q[axis]*v[12+k];}return transform(p,a.models.get('skin'));}`);
for(let batch=0;batch<8;batch++)s.run(`for(let step=0;step<240;step++){
 safariUpdateWildlife(probe,1/60);if(new Set(probe.wildlife.herd.map(a=>a.behavior)).size>1)independentMoments++;
 probe.wildlife.herd.forEach((a,i)=>{
  const m=measures[i];if(m.initialGait===null)m.initialGait=a.gait;m.finalGait=a.gait;m.states[a.behavior]=(m.states[a.behavior]||0)+1;
  const feet=probeSource.feet.map(f=>transform(transform(f.position,a.bones.subarray(f.bone*16,f.bone*16+16)),a.models.get('skin')));
  if(m.previousFeet)feet.forEach((p,j)=>{const delta=Math.hypot(...p.map((x,k)=>x-m.previousFeet[j][k]));if(delta>m.maxStep){m.maxStep=delta;m.worst={time:probe.wildlife.time,foot:j,behavior:a.behavior,gait:a.gait};}});
  if(m.previousBody){const delta=Math.hypot(a.position[0]-m.previousBody[0],a.position[2]-m.previousBody[2]);m.maxBodyStep=Math.max(m.maxBodyStep,Math.hypot(...a.position.map((x,k)=>x-m.previousBody[k])));m.distance+=delta;if(delta>.0005)m.walkingSeconds+=1/60;if(a.behavior==='browsing')assert.ok(delta<1e-6,'feeding animal must stop translating');}
  m.previousFeet=feet;m.previousBody=[...a.position];
  if(a.behavior==='browsing'&&a.feeding>.99){const d=Math.min(...nose.map(v=>Math.hypot(...probePoint(v,a).map((x,k)=>x-a.browseTarget[k]))))/a.scale;m.minNose=Math.min(m.minNose,d);m.maxNose=Math.max(m.maxNose,d);}
 });
}`);
const report=s.run('measures.map(({previousFeet,previousBody,...m})=>({...m,secondsPerStride:m.walkingSeconds/(m.finalGait-m.initialGait)}))');
assert.ok(s.run('independentMoments')>200,'family behaviors are independently phased');
for(const animal of report){
 for(const state of ['walking','settling','browsing','departing'])assert.ok(animal.states[state]>0,'each animal walks, settles, browses and departs');
 assert.ok(Number.isFinite(animal.minNose)&&animal.maxNose<.2,'deformed muzzle reaches the actual feeding crown');
 assert.ok(animal.maxStep<.08,'stance release cannot snap a hoof at 60 Hz');
 assert.ok(animal.maxBodyStep<.04,'body motion stays continuous');
 assert.ok(animal.distance>7,'animal visibly travels during the behavior cycle');
 assert.ok(animal.secondsPerStride>.5&&animal.secondsPerStride<4,'walking cadence avoids the previous slow-motion stride');
}
console.log(JSON.stringify(report,null,2));
console.log('Giraffe walking cadence, feeding contact, stopped browsing and smooth hoof release verified.');
