import assert from 'node:assert/strict';
import {communityContext,loadReviewedHallSources,read} from './community-lib.mjs';

const geometry=await communityContext();
geometry.context.assert=assert;
geometry.run(await read('src/grandhall-data.js'));
geometry.run(await read('src/grandhall-exhibits.js'));
await loadReviewedHallSources(geometry);
const report=geometry.run(`(()=>{
 const work=GRAND_HALL_EXHIBITS.find(e=>e.id==='meridian-hill-observatory');
 assert.ok(work,'the observatory has a real catalogue entry');
 assert.equal(work.bay,'AR-03');
 assert.equal(GRAND_HALL_EXHIBITS.filter(e=>e.bay===work.bay).length,1);
 assert.ok(grandHallExhibitCredits(work).some(c=>c.name==='nickfromlater'));
 const before=seed,b=new Builder(),again=new Builder();
 grandHallBuildExhibit(work.builder,b);grandHallBuildExhibit(work.builder,again);
 assert.equal(seed,before,'the model never consumes the railway random sequence');
 assert.ok(b.data.length>0&&b.data.length%36===0&&b.data.every(Number.isFinite));
 assert.equal(b.stack.length,0);assert.equal(b.normalStack.length,0);
 assert.deepEqual(b.data,again.data,'the model is deterministic');
 const vertices=b.data.length/12;assert.ok(vertices<40000,'keep the original 40,000-vertex ceiling');
 const materials=new Set([0,4,5,6,8,22,23,41]);
 for(let i=9;i<b.data.length;i+=12)assert.ok(materials.has(b.data[i]),'only materials available in both renderers');
 const nested=new Builder();nested.push(2,3,4,.1,.2,.3,.4);
 const saved=Array.from(nested.m),level=nested.stack.length;
 meridianObservatory(nested,1,2,3,.7);
 assert.deepEqual(Array.from(nested.m),saved);assert.equal(nested.stack.length,level);nested.pop();
 // Rays start beyond the telescope and leave the dome. A filled hemisphere
 // must fail the front ray; deleting the entire roof must fail the back ray.
 const intersections=(origin,direction)=>{
  let hits=0;
  for(let i=0;i<b.data.length;i+=36){
   const a=b.data.slice(i,i+3),v=b.data.slice(i+12,i+15),w=b.data.slice(i+24,i+27);
   const e1=sub(v,a),e2=sub(w,a),p=cross(direction,e2),det=dot(e1,p);
   if(Math.abs(det)<1e-8)continue;
   const t=sub(origin,a),u=dot(t,p)/det;if(u<0||u>1)continue;
   const q=cross(t,e1),vv=dot(direction,q)/det;if(vv<0||u+vv>1)continue;
   if(dot(e2,q)/det>1e-5)hits++;
  }
  return hits;
 };
 const aim=-.42,forward=[Math.sin(aim),0,Math.cos(aim)];
 assert.equal(intersections([-.62+forward[0]*1.9,7.30,-.60+forward[2]*1.9],forward),0,'the observing slit is physically open');
 assert.ok(intersections([-.62-forward[0]*1.9,7.30,-.60-forward[2]*1.9],mul(forward,-1))>0,'the back of the dome is present');
 const bay=GRAND_HALL_BAYS.find(e=>e.id===work.bay),placed=new Builder();grandHallPlaceExhibit(work,placed,bay);
 const bounds=[[Infinity,-Infinity],[Infinity,-Infinity],[Infinity,-Infinity]],ca=Math.cos(bay.yaw),sa=Math.sin(bay.yaw);
 for(let i=0;i<placed.data.length;i+=12){
  const dx=placed.data[i]-bay.x,dz=placed.data[i+2]-bay.z;
  const p=[ca*dx-sa*dz,placed.data[i+1]-bay.surfaceY,sa*dx+ca*dz];
  for(let j=0;j<3;j++){bounds[j][0]=Math.min(bounds[j][0],p[j]);bounds[j][1]=Math.max(bounds[j][1],p[j]);}
 }
 assert.ok(Math.abs(bounds[1][0])<1e-6,'the plinth rests on the display');
 assert.ok(Math.max(...bounds[0].map(Math.abs))<bay.usableWidth/2-.03,'leave real side clearance');
 assert.ok(Math.max(...bounds[2].map(Math.abs))<bay.usableDepth/2-.03,'leave real front/back clearance');
 assert.ok(bounds[1][1]<bay.maxHeight);assert.equal(placed.stack.length,0);
 return {id:work.id,bay:work.bay,vertices,vertexBufferMiB:vertices*48/2**20,width:bounds[0][1]-bounds[0][0],depth:bounds[2][1]-bounds[2][0],height:bounds[1][1]-bounds[1][0]};
})()`);
console.log('Meridian Observatory QA passed: '+JSON.stringify(report));
