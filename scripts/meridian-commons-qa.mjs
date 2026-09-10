import assert from 'node:assert/strict';
import {communityContext,loadContributionDefinitions,prepareCommunityGeometry,read} from './community-lib.mjs';

// Exercise the approved model through the real Commons adapter and scene, not
// a second copy of the geometry or a fixture that never reaches the renderer.
const geometry=await communityContext(),catalogue=JSON.parse(await read('contributions/world.json'));
await loadContributionDefinitions(geometry,catalogue);
prepareCommunityGeometry(geometry);
Object.assign(geometry.context,{assert,URL,URLSearchParams,location:{href:'https://whistlevale.com/grandhall.html?bay=AR-03'}});
geometry.run('initTracks();');
const report=geometry.run(`(()=>{
 // The input catalogue crosses the VM boundary; compare JSON values rather than Array prototypes.
 const plain=value=>JSON.parse(JSON.stringify(value));
 const id='meridian-hill-observatory',work=communityCatalogue.works.find(w=>w.id===id),hall=GRAND_HALL_EXHIBITS.find(w=>w.id===id);
 assert.ok(work&&hall,'the approved observatory exists in both catalogues');
 assert.equal(work.room,'commons');assert.equal(hall.bay,'AR-03');
 assert.equal(work.source,hall.source,'both locations use the same approved source');
 assert.deepEqual(plain(validateCredits(work.credits)),plain(grandHallExhibitCredits(hall)),'preserve every original author and note');
 assert.equal(work.miniatures.length,1,'one Commons placement, not a second contribution identity');
 const piece=work.miniatures[0],scale=piece.scale??1,angle=piece.angle??0,radius=COMMUNITY_BUILDERS[piece.builder]*scale,[x,z]=piece.at;
 assert.equal(piece.builder,hall.builder);assert.equal(scale,1,'keep the native full-size model');
 assert.equal(piece.y,undefined,'the terrain adapter, not a guessed deck height, grounds the model');
 const scene=getHouseScene('commons'),placements=scene.lifeDetails.details.filter(d=>d.contribution===id);
 assert.equal(scene.lifeDetails.omitted.length,0,'neither the new work nor its neighbors may be silently omitted');
 assert.equal(placements.length,1);const placed=placements[0];
 assert.equal(placed.x,x);assert.equal(placed.z,z);
 assert.ok(Math.abs(placed.y-scene.height(x,z)-.012)<1e-6,'use the actual finished terrain');
 assert.equal(commonsPlacementIssue(x,z,radius),null,'clear the railway, stream, trees, halt and board margin');
 assert.ok(miniatureTrackClear(scene,x,z,radius),'the full declared footprint clears moving stock');
 const local=new Builder(),direct=new Builder(),mapped=new Builder(),beforeSeed=seed;
 meridianObservatory(local,0,0,0);
 direct.push(x,placed.y,z,0,angle,0,scale);meridianObservatory(direct,0,0,0);direct.pop();
 let calls=0;
 communityMiniatures('commons',(name,fn,px,pz,a,r,y,credits,workId,index)=>{
  if(workId!==id)return;calls++;assert.equal(index,0);assert.equal(r,radius);assert.equal(y,null);
  assert.deepEqual(credits,work.credits);fn(mapped,px,placed.y,pz,a);
 });
 assert.equal(calls,1);assert.deepEqual(mapped.data,direct.data,'apply catalogue rotation and scale exactly once');
 assert.equal(mapped.stack.length,0);assert.equal(mapped.normalStack.length,0);assert.equal(seed,beforeSeed);
 assert.ok(mapped.data.every(Number.isFinite));const vertices=local.data.length/12;
 assert.ok(vertices>0&&vertices<40000,'retain the approved native geometry budget');
 let measuredRadius=0,minY=Infinity;
 for(let i=0;i<local.data.length;i+=12){measuredRadius=Math.max(measuredRadius,Math.hypot(local.data[i],local.data[i+2]));minY=Math.min(minY,local.data[i+1]);}
 assert.ok(measuredRadius*scale<=radius,'the footprint includes the roof, stair, annex and plinth');
 // Sample the actual top triangles of the plinth throughout their interiors
 // and edges. The foundation must straddle the finished surface everywhere,
 // not merely pass the adapter's eight coarse slope probes.
 let samples=0,topTriangles=0,minGround=Infinity,maxGround=-Infinity;
 const ca=Math.cos(angle),sa=Math.sin(angle),bottom=placed.y+minY*scale,top=placed.y+.02*scale;
 for(let i=0;i<local.data.length;i+=36){
  if(local.data[i+9]!==23||![1,13,25].every(j=>Math.abs(local.data[i+j]-.02)<1e-6))continue;
  topTriangles++;const a=local.data.slice(i,i+3),b=local.data.slice(i+12,i+15),c=local.data.slice(i+24,i+27);
  for(let u=0;u<=8;u++)for(let v=0;v<=8-u;v++){
   const w=1-(u+v)/8,px=a[0]*w+b[0]*u/8+c[0]*v/8,pz=a[2]*w+b[2]*u/8+c[2]*v/8;
   const ground=scene.height(x+(px*ca+pz*sa)*scale,z+(pz*ca-px*sa)*scale);
   assert.ok(Number.isFinite(ground)&&ground>bottom+.005&&ground<top-.005,'the original foundation meets terrain without floating or buried paving');
   minGround=Math.min(minGround,ground);maxGround=Math.max(maxGround,ground);samples++;
  }
 }
 assert.ok(topTriangles>=8&&samples>=360,'sample the complete authored eight-sided foundation');
 const view=communityWorkView(scene,id,0),spot=scene.spots.find(s=>s.contribution===id);
 assert.ok(view&&spot,'Views / Places and direct work links resolve the built miniature');
 assert.deepEqual(view.target,spot.target);assert.equal(view.target[0],x);assert.equal(view.target[2],z);
 for(const key of ['distance','yaw','pitch'])assert.equal(view[key],work.view[key]);
 assert.equal(communityWorkView(scene,id,1),null,'invalid placement links cannot frame unrelated geometry');
 const savedReturn=window.HOUSE_RETURN_URL;
 try{
  for(const home of [null,'file:///tmp/whistlevale-export.html','blob:https://whistlevale.com/qa-export']){
   window.HOUSE_RETURN_URL=home;const links=grandHallRailwayLocations(hall);assert.equal(links.length,1);
   const url=new URL(links[0].href),params=url.protocol==='blob:'?new URLSearchParams(url.hash.slice(1)):url.searchParams;
   assert.equal(params.get('room'),'commons');assert.equal(params.get('work'),id);assert.equal(params.get('placement'),'0');assert.equal(params.has('map'),false);
   if(home){const target=new URL(home);assert.equal(url.protocol,target.protocol);assert.equal(url.pathname,target.pathname,'portable navigation stays in the exported house');}
  }
 }finally{if(savedReturn===undefined)delete window.HOUSE_RETURN_URL;else window.HOUSE_RETURN_URL=savedReturn;}
 const roundTrip=validateCommunity(JSON.parse(JSON.stringify(communityCatalogue))).works.find(w=>w.id===id);
 assert.deepEqual(plain(roundTrip),plain(work),'catalogue serialization retains identity, source, placement, camera and credits');
 const original=communityCatalogue.works;let baselineVertices;
 try{
  communityCatalogue.works=original.filter(w=>w.id!==id);
  const baseline=buildRoomLifeDetails('commons',scene);assert.equal(baseline.omitted.length,0);baselineVertices=baseline.communityVertices;
 }finally{communityCatalogue.works=original;}
 assert.equal(scene.lifeDetails.communityVertices-baselineVertices,vertices,'only the native observatory mesh is added');
 assert.ok(scene.lifeDetails.communityVertices<=COMMUNITY_LIMITS.vertices,'retain the existing Commons contribution budget');
 return {id,at:piece.at,angle,scale,vertices,measuredRadius,declaredRadius:radius,foundationSamples:samples,minGround,maxGround,foundationBottom:bottom,foundationTop:top,baselineVertices,commonsVertices:scene.lifeDetails.communityVertices};
})()`);

// One author/work row must show both locations, rather than double-counting
// an exhibit now that the same source also stands in the shared landscape.
class CreditNode{
 constructor(tag){this.tag=tag;this.children=[];this.textContent='';this.attributes={};}
 append(...nodes){this.children.push(...nodes);}
 replaceChildren(...nodes){this.children=nodes;}
 setAttribute(name,value){this.attributes[name]=value;}
}
const list=new CreditNode('ul'),document=geometry.context.document,originalGet=document.getElementById,originalCreate=document.createElement;
const descendants=node=>[node,...node.children.flatMap(descendants)];
try{
 document.getElementById=id=>id==='buildersList'?list:originalGet(id);document.createElement=tag=>new CreditNode(tag);
 geometry.run('paintBuilders();');
 const author=list.children.find(row=>descendants(row).some(n=>n.tag==='a'&&n.href==='https://github.com/nickfromlater'));
 assert.ok(author);const rows=descendants(author).filter(n=>n.tag==='li'&&n.children.some(c=>c.tag==='strong'&&c.textContent==='Meridian Hill Observatory'));
 assert.equal(rows.length,1,'the creator has one observatory contribution');
 const names=geometry.run('[HOUSE_ROOMS.commons.name,HOUSE_ROOMS.grandhall.name]'),text=descendants(rows[0]).map(n=>n.textContent).join(' ');
 for(const name of names)assert.ok(text.includes(name),'both locations appear in the same credit row');
}finally{document.getElementById=originalGet;document.createElement=originalCreate;}
console.log('Meridian Commons QA passed: '+JSON.stringify(report));
