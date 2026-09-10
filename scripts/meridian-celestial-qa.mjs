import assert from 'node:assert/strict';
import {communityContext,loadContributionDefinitions,read} from './community-lib.mjs';

// The shared source is the deliverable, not a second preview-only sky.
const geometry=await communityContext(),catalogue=JSON.parse(await read('contributions/world.json'));
await loadContributionDefinitions(geometry,catalogue);geometry.context.assert=assert;
const report=geometry.run(`(()=>{
 const before=seed,b=new Builder(),again=new Builder();
 meridianCelestialTheatre(b);meridianCelestialTheatre(again);
 assert.equal(seed,before);assert.deepEqual(b.data,again.data);
 assert.ok(b.data.length>0&&b.data.length%36===0&&b.data.every(Number.isFinite));
 assert.equal(b.stack.length,0);assert.equal(b.normalStack.length,0);
 assert.ok(b.data.length/12<8000,'the complete miniature sky is a small, static mesh');
 let stars=0,starTriangles=0,skyTriangles=0,minStar=Infinity,maxStar=-Infinity;
 const phases=new Set(),colors=new Set(),bounds=[[Infinity,-Infinity],[Infinity,-Infinity],[Infinity,-Infinity]];
 for(let i=0;i<b.data.length;i+=36){
  for(let j=0;j<36;j+=12)for(let axis=0;axis<3;axis++){
   bounds[axis][0]=Math.min(bounds[axis][0],b.data[i+j+axis]);bounds[axis][1]=Math.max(bounds[axis][1],b.data[i+j+axis]);
  }
  if(b.data[i+9]!==77)continue;
  if(b.data[i+11]===0){skyTriangles++;continue;}
  starTriangles++;if(b.data[i+11]===.24)stars++;
  assert.ok(b.data[i+11]>0&&b.data[i+11]<=.24,'twinkle is restrained, never an on/off flash');
  phases.add(b.data[i+10]);colors.add(b.data.slice(i+6,i+9).join(','));
  for(let j=0;j<36;j+=12){
   assert.equal(b.data[i+j+10],b.data[i+10]);assert.equal(b.data[i+j+11],b.data[i+11],'each star keeps constant UV light controls');
   minStar=Math.min(minStar,b.data[i+j+1]);maxStar=Math.max(maxStar,b.data[i+j+1]);
   assert.ok(b.data[i+j+1]>9,'all stars are above the original copper dome');
  }
 }
 assert.ok(stars>=500&&starTriangles>stars&&skyTriangles>250,'dense pinlights, guide-star rays and a real enamel shell');
 assert.ok(phases.size>300&&colors.size>=5,'the sky has independent twinkle phases and warm/cool stars');
 assert.ok(bounds[0][0]>-4.544&&bounds[0][1]<4.544&&bounds[2][0]>-4.244&&bounds[2][1]<4.244,'theatre stays inside the original plinth footprint');
 assert.ok(bounds[1][1]<14.5&&minStar>8.6,'the complete sky is miniature and clears the telescope');
 const nested=new Builder();nested.push(2,3,4,.1,.2,.3,.6);const matrix=Array.from(nested.m),depth=nested.stack.length;
 meridianCelestialTheatre(nested);assert.deepEqual(Array.from(nested.m),matrix);assert.equal(nested.stack.length,depth);nested.pop();
 const hall=GRAND_HALL_EXHIBITS.find(e=>e.id==='meridian-hill-observatory'),work=communityCatalogue.works.find(e=>e.id===hall.id);
 assert.equal(hall.source,work.source);assert.equal(hall.bay,'AR-03');
 assert.equal(COMMUNITY_BUILDERS.meridian,5.9,'keep the accepted footprint, not a smaller clearance trick');
 const detail={contribution:work.id,placement:0,x:-15,y:.961,z:14},scene={key:'commons',lifeDetails:{details:[detail]}};
 const view=communityWorkView(scene,work.id),piece=work.miniatures[0];
 assert.equal(view.target[1],detail.y+work.view.targetHeight*(piece.scale??1));assert.ok(view.phoneDistance>=view.distance);
 const originalScale=piece.scale;
 try{piece.scale=.8;assert.equal(communityWorkView(scene,work.id).target[1],detail.y+work.view.targetHeight*.8,'native target height follows placement scale');}
 finally{if(originalScale===undefined)delete piece.scale;else piece.scale=originalScale;}
 const originalView=work.view;
 try{delete work.view;assert.equal(communityWorkView(scene,work.id).target[1],detail.y+2,'legacy views keep the original default');}
 finally{work.view=originalView;}
 for(const field of ['phoneDistance','targetHeight'])for(const value of [NaN,Infinity,-1,'12',field==='phoneDistance'?121:25]){
  const copy=JSON.parse(JSON.stringify(communityCatalogue));copy.works.find(w=>w.id===work.id).view[field]=value;
  assert.throws(()=>validateCommunity(copy),'reject malformed '+field);
 }
 const roundTrip=JSON.parse(JSON.stringify(validateCommunity(JSON.parse(JSON.stringify(communityCatalogue))))).works.find(w=>w.id===work.id);
 assert.deepEqual(roundTrip.view,JSON.parse(JSON.stringify(work.view)),'new camera fields survive portable catalogue serialization');
 return{vertices:b.data.length/12,pinlights:stars,guideTriangles:starTriangles-stars,skyTriangles,independentPhases:phases.size,minStar,maxStar,bounds};
})()`);
const railway=await read('src/railway.js'),hall=await read('grandhall.html');
assert.match(railway,/if\(m==77\.\).*vUV\.y\*sin\(uTime\*\.7\+vUV\.x\)/,'native shader supports the pinlight material');
assert.match(hall,/if\(abs\(vMat-77\.\)<\.5\).*vUV\.y\*sin\(uTime\*\.7\+vUV\.x\)/,'Hall shader supports the same pinlight material');
assert.match(hall,/uniform\(main,'uTime'\),reduced\?0:t/,'reduced motion freezes the Hall star display');
assert.match(railway,/clock\*\(reduceMotion\?0:1\)/,'native reduced-motion time remains frozen');
console.log('Meridian celestial QA passed: '+JSON.stringify(report));
assert.match(railway,/min\(vec3\(\.83\),pow/,'pinlights stay below the native coarse bloom threshold');
assert.ok(.83*(1+.24)<1.05,'even the brightest twinkle cannot create displaced bloom copies');
