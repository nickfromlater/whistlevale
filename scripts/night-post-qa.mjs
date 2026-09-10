import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {communityContext,loadReviewedHallSources,read} from './community-lib.mjs';

const report=JSON.parse(await read('models/night-post/export-report.json'));
const bytes=await readFile(new URL('../models/night-post/night-post.blend',import.meta.url));
assert.equal(createHash('sha256').update(bytes).digest('hex'),report.blendSHA256,'the export identifies the current editable Blender source');
assert.equal(createHash('sha256').update(await read('src/scenery/night-post.js')).digest('hex'),report.sha256,'generated geometry matches its measured export');
const geometry=await communityContext();geometry.context.assert=assert;geometry.context.exportReport=report;
geometry.run(await read('src/grandhall-data.js'));geometry.run(await read('src/grandhall-exhibits.js'));await loadReviewedHallSources(geometry);
const measured=geometry.run(`(()=>{
 const exhibit=GRAND_HALL_EXHIBITS.find(e=>e.id==='the-night-post');
 assert.equal(exhibit.bay,'LW-01');assert.equal(exhibit.mapPreview,undefined);
 assert.ok(grandHallExhibitCredits(exhibit).some(c=>c.name==='nickfromlater'));
 const b=new Builder(),again=new Builder(),savedSeed=seed;
 nightPost(b);nightPost(again);
 assert.deepEqual(b.data,again.data);assert.equal(seed,savedSeed);
 assert.equal(b.data.length/12,exportReport.vertices);assert.ok(exportReport.vertices<=60000);
 assert.equal(b.stack.length,0);assert.equal(b.normalStack.length,0);
 assert.ok(b.data.length%36===0&&b.data.every(Number.isFinite));
 const materials=new Set([0,4,5,6,8,10,22,23,41,76]);let glass=0,lamps=0;
 for(let i=0;i<b.data.length;i+=12){
  assert.ok(materials.has(b.data[i+9]));
  assert.ok(Math.abs(Math.hypot(...b.data.slice(i+3,i+6))-1)<1e-5,'exported normals are unit length');
  if(b.data[i+9]===76)glass++;if(b.data[i+9]===10)lamps++;
 }
 assert.ok(glass>0&&lamps>0,'the roof glazing and modeled lamps survive export');
 const nested=new Builder();nested.push(1,2,3,.1,.2,.3,.4);const m=Array.from(nested.m);nightPost(nested,2,3,4,.5);
 assert.deepEqual(Array.from(nested.m),m);assert.equal(nested.stack.length,1);nested.pop();
 const bay=GRAND_HALL_BAYS.find(b=>b.id===exhibit.bay),placed=new Builder();grandHallPlaceExhibit(exhibit,placed,bay);
 const bounds=[[Infinity,-Infinity],[Infinity,-Infinity],[Infinity,-Infinity]],ca=Math.cos(bay.yaw),sa=Math.sin(bay.yaw);
 for(let i=0;i<placed.data.length;i+=12){
  const x=placed.data[i]-bay.x,z=placed.data[i+2]-bay.z,p=[ca*x-sa*z,placed.data[i+1]-bay.surfaceY,sa*x+ca*z];
  for(let j=0;j<3;j++){bounds[j][0]=Math.min(bounds[j][0],p[j]);bounds[j][1]=Math.max(bounds[j][1],p[j]);}
 }
 assert.ok(Math.abs(bounds[1][0])<1e-6,'the plinth rests on the display surface');
 assert.ok(Math.max(...bounds[0].map(Math.abs))<bay.usableWidth/2-.03);
 assert.ok(Math.max(...bounds[2].map(Math.abs))<bay.usableDepth/2-.03);
 assert.ok(bounds[1][1]<bay.maxHeight);
 return {vertices:b.data.length/12,vertexBufferMiB:b.data.length*4/2**20,bounds,glass,lamps};
})()`);
console.log('Night Post Blender source and Hall QA passed: '+JSON.stringify(measured));
