import assert from 'node:assert/strict';
import {communityContext,loadReviewedHallSources,read} from './community-lib.mjs';

const geometry=await communityContext();
geometry.context.assert=assert;
geometry.run(await read('src/grandhall-data.js'));
geometry.run(await read('src/grandhall-exhibits.js'));
await loadReviewedHallSources(geometry);
const report=geometry.run(`(()=>{
 const work=GRAND_HALL_EXHIBITS.find(e=>e.id==='neonside-city');
 assert.ok(work,'the city has a real catalogue entry');
 assert.equal(work.bay,'GH-01');
 assert.ok(GRAND_HALL_EXHIBITS.filter(e=>e.bay===work.bay).length===1);
 assert.ok(grandHallExhibitCredits(work).some(c=>c.name==='Sonur11'));
 const b=new Builder(),again=new Builder();
 grandHallBuildExhibit(work.builder,b);grandHallBuildExhibit(work.builder,again);
 assert.ok(b.data.length>0&&b.data.length%36===0&&b.data.every(Number.isFinite));
 assert.equal(b.stack.length,0);assert.equal(b.normalStack.length,0);
 assert.deepEqual(b.data,again.data,'the model is deterministic');
 const vertices=b.data.length/12;
 const materials=new Set([0,4,5,6,8,10,22,23,41,76,77,78,79,80,81,82]);
 for(let i=9;i<b.data.length;i+=12)assert.ok(materials.has(b.data[i]),'only materials supported by the Hall');
 const nested=new Builder();nested.push(2,3,4,.1,.2,.3,.4);
 const saved=Array.from(nested.m),level=nested.stack.length;
 scifiCityGH01(nested,1,2,3,.7);
 assert.deepEqual(Array.from(nested.m),saved);assert.equal(nested.stack.length,level);nested.pop();
 const bay=GRAND_HALL_BAYS.find(e=>e.id===work.bay),placed=new Builder();grandHallPlaceExhibit(work,placed,bay);
 const bounds=[[Infinity,-Infinity],[Infinity,-Infinity],[Infinity,-Infinity]],ca=Math.cos(bay.yaw),sa=Math.sin(bay.yaw);
 for(let i=0;i<placed.data.length;i+=12){
  const dx=placed.data[i]-bay.x,dz=placed.data[i+2]-bay.z;
  const p=[ca*dx-sa*dz,placed.data[i+1]-bay.surfaceY,sa*dx+ca*dz];
  for(let j=0;j<3;j++){bounds[j][0]=Math.min(bounds[j][0],p[j]);bounds[j][1]=Math.max(bounds[j][1],p[j]);}
 }
 assert.ok(Math.abs(bounds[1][0])<1e-6,'the foundation rests on the display');
 assert.ok(Math.max(...bounds[0].map(Math.abs))<bay.usableWidth/2-.03,'leave side clearance');
 assert.ok(Math.max(...bounds[2].map(Math.abs))<bay.usableDepth/2-.03,'leave front/back clearance');
 assert.ok(bounds[1][1]<bay.maxHeight,'stay under the model height limit');
 assert.equal(placed.stack.length,0);
 return {id:work.id,bay:work.bay,vertices,vertexBufferMiB:vertices*48/2**20,width:bounds[0][1]-bounds[0][0],depth:bounds[2][1]-bounds[2][0],height:bounds[1][1]-bounds[1][0]};
})()`);
console.log('Sci-Fi City QA passed: '+JSON.stringify(report));