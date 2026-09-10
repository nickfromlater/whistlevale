import assert from 'node:assert/strict';
import {communityContext,loadContributionDefinitions,read} from './community-lib.mjs';
const geometry=await communityContext(),catalogue=JSON.parse(await read('contributions/world.json'));
await loadContributionDefinitions(geometry,catalogue);geometry.context.assert=assert;
const report=geometry.run(`(()=>{
 const before=seed,b=new Builder(),again=new Builder();meridianCelestialTheatre(b);meridianCelestialTheatre(again);
 assert.equal(seed,before);assert.deepEqual(b.data,again.data);assert.equal(b.stack.length,0);assert.equal(b.normalStack.length,0);
 assert.ok(b.data.length&&b.data.length%36===0&&b.data.every(Number.isFinite));assert.ok(b.data.length/12<8000,'the sky keeps its original static geometry budget');
 const bounds=[[Infinity,-Infinity],[Infinity,-Infinity],[Infinity,-Infinity]],materials={},phases=new Set();
 for(let i=0;i<b.data.length;i+=12){
  for(let a=0;a<3;a++){bounds[a][0]=Math.min(bounds[a][0],b.data[i+a]);bounds[a][1]=Math.max(bounds[a][1],b.data[i+a]);}
  const m=b.data[i+9];materials[m]=(materials[m]||0)+1;
  if(m===79){const phase=Math.floor(b.data[i+10]/4),local=b.data[i+10]-phase*4;assert.ok(local>=0&&local<=2&&b.data[i+11]>=0&&b.data[i+11]<=2);phases.add(phase);}
 }
 for(const m of[78,79,80,81,82])assert.ok(materials[m]>0,'the native miniature includes nebula, stars, haze, worlds and a meteor');
 assert.ok(phases.size>100,'stars have independent phases, not one synchronized flash');
 assert.ok(bounds[0][0]>-4.544&&bounds[0][1]<4.544&&bounds[2][0]>-4.244&&bounds[2][1]<4.244,'effects stay in the original horizontal envelope');
 assert.ok(bounds[1][1]<14.5&&bounds[1][0]>8.4,'the night remains in miniature above the dome');
 // Explicit spherical normals must agree with triangle winding, otherwise
 // two-sided renderer lighting reverses them and leaves the worlds black.
 for(let i=0;i<b.data.length;i+=36){if(b.data[i+9]!==81)continue;
  const a=b.data.slice(i,i+3),c=b.data.slice(i+12,i+15),d=b.data.slice(i+24,i+27),normal=add(add(b.data.slice(i+3,i+6),b.data.slice(i+15,i+18)),b.data.slice(i+27,i+30));
  assert.ok(dot(cross(sub(c,a),sub(d,a)),normal)>0,'planet faces point outward in both renderers');
 }
 const nested=new Builder();nested.push(2,3,4,.1,.2,.3,.6);const matrix=Array.from(nested.m),depth=nested.stack.length;meridianCelestialTheatre(nested);assert.deepEqual(Array.from(nested.m),matrix);assert.equal(nested.stack.length,depth);nested.pop();
 const hall=GRAND_HALL_EXHIBITS.find(e=>e.id==='meridian-hill-observatory'),work=communityCatalogue.works.find(e=>e.id===hall.id);assert.equal(hall.source,work.source);assert.equal(hall.bay,'AR-03');assert.equal(COMMUNITY_BUILDERS.meridian,5.9);
 const detail={contribution:work.id,placement:0,x:-15,y:.961,z:14},scene={key:'commons',lifeDetails:{details:[detail]}},piece=work.miniatures[0],view=communityWorkView(scene,work.id);assert.equal(view.target[1],detail.y+work.view.targetHeight*(piece.scale??1));assert.ok(view.phoneDistance>=view.distance);
 const scale=piece.scale;try{piece.scale=.8;assert.equal(communityWorkView(scene,work.id).target[1],detail.y+work.view.targetHeight*.8);}finally{if(scale===undefined)delete piece.scale;else piece.scale=scale;}
 const saved=work.view;try{delete work.view;assert.equal(communityWorkView(scene,work.id).target[1],detail.y+2);}finally{work.view=saved;}
 for(const field of['phoneDistance','targetHeight'])for(const v of[NaN,Infinity,-1,'12',field==='phoneDistance'?121:25]){const copy=JSON.parse(JSON.stringify(communityCatalogue));copy.works.find(w=>w.id===work.id).view[field]=v;assert.throws(()=>validateCommunity(copy));}
 assert.deepEqual(JSON.parse(JSON.stringify(validateCommunity(JSON.parse(JSON.stringify(communityCatalogue))))).works.find(w=>w.id===work.id).view,JSON.parse(JSON.stringify(work.view)));
 return{vertices:b.data.length/12,materials,phases:phases.size,bounds};
})()`);
const railway=await read('src/railway.js'),hall=await read('grandhall.html');
const effect=source=>source.match(/\/\/ MERIDIAN_ATMOSPHERE_BEGIN[\s\S]*?\/\/ MERIDIAN_ATMOSPHERE_END/)[0];
assert.equal(effect(railway),effect(hall),'both renderers use byte-identical linear-light effects');
assert.match(hall,/uniform\(main,'uTime'\),reduced\?0:t/);assert.match(railway,/clock\*\(reduceMotion\?0:1\)/);
assert.match(railway,/data\[i\]>=78&&data\[i\]<=80/,'alpha effects use the owned clear pass, not opaque depth/shadows');
assert.match(hall,/b\.data\[i\+9\]>=78&&b\.data\[i\+9\]<=80/);
assert.match(effect(railway),/mod\(time\+5\.,19\.\)/,'meteor has a real intermittent cycle and is absent at reduced-motion time zero');
assert.ok(!/Date\.now|Math\.random|requestAnimationFrame|fetch\(/.test(await read('src/scenery/meridian-observatory.js')),'model builds once with no random, clock or network ownership');
console.log('Meridian ambience QA passed: '+JSON.stringify(report));

assert.match(hall,/float atmosphereMaterial=floor\(vMat\+\.5\)/,'interpolated material IDs are rounded before effect dispatch');
