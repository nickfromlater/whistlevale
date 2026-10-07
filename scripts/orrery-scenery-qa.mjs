import assert from 'node:assert/strict';
import {communityContext,loadCommunity,loadContributionDefinitions,prepareCommunityGeometry,read} from './community-lib.mjs';

const state=await communityContext();state.context.assert=assert;
await loadContributionDefinitions(state,await loadCommunity());prepareCommunityGeometry(state);
const rails=state.run(`(()=>{
 const t=ORRERY_ROUTE.track,knots=orreryRailSamples(t),offsets=[[-.62,0],[.62,0],[0,-.81],[0,.10]];
 const point=(q,p)=>add(add(q.p,mul(q.r,p[0])),mul(q.u,p[1]));let maximumError=0;
 for(let i=1;i<knots.length;i++){
  const a=knots[i-1],b=knots[i];assert.ok(b.distance>a.distance);
  for(let j=1;j<20;j++){const f=j/20,q=t.at(mix(a.distance,b.distance,f));for(const p of offsets)maximumError=Math.max(maximumError,len(sub(point(q,p),lerpV(point(a,p),point(b,p),f))));}
 }
 assert.ok(maximumError<.008,'rail cross-section deviation '+maximumError);assert.ok(knots.length<900);
 assert.equal(knots[0].distance,0);assert.equal(knots.at(-1).distance,t.length);
 for(const s of t.sections)assert.ok(knots.some(k=>k.distance===s.end),'every section/material boundary retained');
 return {segments:knots.length-1,maximumError};
})()`);
// Inspect the emitted triangles, not just an artist-entered clearance radius.
// Sparse world-space bins limit the independent triangle/occupied-OBB SAT test.
const geometry=state.run(`(()=>{
 const b=new Builder(),s={population:6,movingParts:[]};orreryScenicRoom(s,b);orreryScenicVisitors(s,b);
 assert.equal(s.orreryScenicRanges.length,5);assert.equal(s.orreryVignettes.length,8);assert.equal(s.population,28);
 assert.ok(b.data.every(Number.isFinite));assert.equal(b.stack.length,0,'balanced authored transforms');
 const poses=[];for(let d=0;d<ORRERY_ROUTE.track.length;d+=.35)poses.push(ORRERY_ROUTE.track.at(d));
 return {data:b.data,groups:[...s.orreryScenicRanges,...s.orreryVignettes],poses};
})()`);
const {data,groups,poses}=geometry,cell=6,bins=new Map(),half=[.96,1.25,1.7];
const vertex=i=>[data[i],data[i+1],data[i+2]],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const sub=(a,b)=>a.map((x,i)=>x-b[i]),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const key=(x,y,z)=>`${x}/${y}/${z}`;
for(let i=0;i<data.length;i+=36){
 const p=[vertex(i),vertex(i+12),vertex(i+24)],lo=[0,1,2].map(k=>Math.floor(Math.min(...p.map(v=>v[k]))/cell)),hi=[0,1,2].map(k=>Math.floor(Math.max(...p.map(v=>v[k]))/cell));
 for(let x=lo[0];x<=hi[0];x++)for(let y=lo[1];y<=hi[1];y++)for(let z=lo[2];z<=hi[2];z++){const k=key(x,y,z);if(!bins.has(k))bins.set(k,[]);bins.get(k).push(i);}
}
function overlaps(p){
 const edges=[sub(p[1],p[0]),sub(p[2],p[1]),sub(p[0],p[2])],axes=[[1,0,0],[0,1,0],[0,0,1],cross(edges[0],edges[1])];
 for(const e of edges)axes.push([0,e[2],-e[1]],[-e[2],0,e[0]],[e[1],-e[0],0]);
 for(const a of axes){if(dot(a,a)<1e-15)continue;const r=dot(a.map(Math.abs),half),v=p.map(q=>dot(a,q));if(Math.min(...v)>=r-1e-6||Math.max(...v)<=-r+1e-6)return false;}
 return true;
}
let candidates=0;const conflicts=[];
for(const q of poses){
 const center=q.p.map((v,i)=>v+q.u[i]*.92),lo=center.map(v=>Math.floor((v-2.4)/cell)),hi=center.map(v=>Math.floor((v+2.4)/cell)),seen=new Set();
 for(let x=lo[0];x<=hi[0];x++)for(let y=lo[1];y<=hi[1];y++)for(let z=lo[2];z<=hi[2];z++)for(const i of bins.get(key(x,y,z))||[]){
  if(seen.has(i))continue;seen.add(i);candidates++;
  const vertices=[vertex(i),vertex(i+12),vertex(i+24)],local=vertices.map(v=>{const d=sub(v,center);return [dot(d,q.r),dot(d,q.u),dot(d,q.f)];});
  if(overlaps(local)&&conflicts.length<24)conflicts.push({feature:groups.find(g=>i/12>=g.first&&i/12<g.first+g.count)?.name,routeDistance:q.s,triangle:vertices});
 }
}
assert.deepEqual(conflicts,[],'new scenic triangles must avoid the occupied ride envelope');
const html=await read('index.html'),source=await read('src/rooms/orrery.js');
assert.ok(html.includes('src="src/rooms/orrery.js"'),'native module remains included in startup and export');
assert.ok(source.includes('orreryScenicRoom(scene,b)'),'scenery is built inside the owned native room');
console.log(JSON.stringify({rails,scenicVertices:data.length/12,poses:poses.length,candidates,clearanceConflicts:conflicts.length},null,2));
console.log('Orrery scenery, rail tessellation and baked-triangle ride-clearance checks passed.');
