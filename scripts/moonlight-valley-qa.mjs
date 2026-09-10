import assert from 'node:assert/strict';
import {communityContext,loadContributionDefinitions,prepareCommunityGeometry,read} from './community-lib.mjs';

const geometry=await communityContext(),catalogue=JSON.parse(await read('contributions/world.json'));
await loadContributionDefinitions(geometry,catalogue);prepareCommunityGeometry(geometry);
Object.assign(geometry.context,{assert,URL,URLSearchParams,location:new URL('https://whistlevale.com/grandhall.html?bay=LW-04')});
// Build the real pristine railway twice. The comparison catches inadvertent
// changes to the seeded village, forests, tracks or saved-layout identities.
const baseline=geometry.run(`(()=>{
 const works=communityCatalogue.works;communityCatalogue.works=works.filter(w=>w.id!=='moonlight-drive-in');
 try{buildWorld();return JSON.stringify({objects,tracks:trackDesign,roads:roads.map(e=>e.curves)});}finally{communityCatalogue.works=works;}
})()`);
geometry.context.moonlightBaseline=JSON.parse(baseline);
geometry.run('objects=[];objectSerial=0;captureScenery=true;buildWorld();');
const report=geometry.run(`(()=>{
 const plain=value=>JSON.parse(JSON.stringify(value)),id='moonlight-drive-in';
 const work=communityCatalogue.works.find(w=>w.id===id),hall=GRAND_HALL_EXHIBITS.find(w=>w.id===id);
 assert.ok(work&&hall,'the same contribution is in the Hall and Alder Valley');
 assert.equal(work.room,'valley');assert.equal(hall.bay,'LW-04');assert.equal(work.source,hall.source);
 assert.deepEqual(plain(work.credits),plain(grandHallExhibitCredits(hall)),'keep every original public credit');
 assert.equal(work.workshop.length,1);assert.equal(work.miniatures,undefined,'Valley uses its editable scenery pipeline');
 const piece=work.workshop[0],matches=objects.filter(o=>o.contribution===id&&o.placement===0);
 assert.equal(matches.length,1);const object=matches[0],asset=assetById[object.type];
 assert.equal(object.type,'moonlight');assert.equal(object.x,piece.at[0]);assert.equal(object.z,piece.at[1]);
 assert.equal(object.scale,piece.scale??1);assert.equal(object.angle,piece.angle??0);
 assert.deepEqual(plain(object.credits),plain(work.credits));assert.ok(placementCheck(object).ok);
 assert.deepEqual(plain(trackDesign),plain(moonlightBaseline.tracks),'all railway alignments are untouched');
 const oldObjects=new Map(moonlightBaseline.objects.map(o=>[o.id,o])),removed=[];
 for(const o of objects)if(o!==object){assert.ok(oldObjects.has(o.id),'only the requested theater is added');assert.deepEqual(plain(o),plain(oldObjects.get(o.id)),'every retained factory object stays unchanged');}
 for(const o of moonlightBaseline.objects)if(!objects.some(q=>q.id===o.id)){assert.ok(!o.credits?.length&&['oak','autumn','pine','fir','willow','orchard'].includes(o.type),'only nearby uncredited foliage may be cleared');removed.push({type:o.type,at:[o.x,o.z]});}
 const approach=moonlightValleyApproach();assert.ok(approach);
 for(const o of removed){
  const [px,pz]=o.at,c=Math.cos(object.angle),s=Math.sin(object.angle),dx=px-object.x,dz=pz-object.z;
  const garden=Math.abs(c*dx-s*dz)<asset.w*object.scale*.5+.12&&Math.abs(s*dx+c*dz)<asset.d*object.scale*.5+.12;
  let lane=false;for(let d=0;d<=approach.edge.length;d+=.20){const p=approach.edge.at(d).p;if(Math.hypot(px-p[0],pz-p[2])<approach.width(d/approach.edge.length)/2+.35)lane=true;}
  assert.ok(garden||lane,'every removed trunk belongs to the actual garden or narrow access lane');
 }
 assert.deepEqual(plain(roads.slice(0,moonlightBaseline.roads.length).map(e=>e.curves)),plain(moonlightBaseline.roads),'all five original streets keep their alignment');
 const template=getTemplate(object),data=template.data,vertices=data.length/12;
 assert.ok(vertices>10000&&vertices<=COMMUNITY_LIMITS.vertices,'the complete detailed theater stays within the room contribution allowance');
 assert.ok(data.every(Number.isFinite)&&data.length%36===0);
 assert.ok(template.min[0]>=-asset.w/2&&template.max[0]<=asset.w/2&&template.min[2]>=-asset.d/2&&template.max[2]<=asset.d/2,'editor bounds cover the complete garden and trees');
 assert.ok(template.max[1]<=asset.h,'picking and clearance cover the full screen');
 const oldSeed=seed,direct=new Builder();direct.push(0,0,0,0,0,0,.32);moonlightDriveIn(direct,0,0,0,0,{landscape:true});direct.pop();
 assert.deepEqual(data,direct.data,'the editor uses the same authored miniature with its landscape base');assert.equal(seed,oldSeed,'building the theater does not consume procedural scenery randomness');
 assert.equal(direct.stack.length,0);assert.equal(direct.normalStack.length,0);
 const matrix=objectMatrix(object),ca=Math.cos(object.angle),sa=Math.sin(object.angle),w=asset.w*object.scale/2,d=asset.d*object.scale/2;
 let trackClearance=Infinity;
 for(const edge of edges)for(let offset=0;offset<=edge.length;offset+=.35){const p=edge.at(Math.min(offset,edge.length)).p,dx=p[0]-object.x,dz=p[2]-object.z,xx=ca*dx-sa*dz,zz=sa*dx+ca*dz;trackClearance=Math.min(trackClearance,Math.hypot(Math.max(0,Math.abs(xx)-w),Math.max(0,Math.abs(zz)-d)));}
 assert.ok(trackClearance>1.3,'every track clears the full garden footprint, not just its center');
 // Sample the actual top triangles of the broad turf foundation. Each point
 // must sit above the finished terrain while its earth edge reaches below it.
 let samples=0,minGround=Infinity,maxGround=-Infinity,streetClearance=Infinity,lakeClearance=Infinity;
 const streetPoints=roads.filter(e=>e.name!=='moonlight-lane').flatMap(edge=>{const p=[];for(let d=0;d<=edge.length;d+=.2)p.push(edge.at(Math.min(d,edge.length)).p);return p;});
 const bottom=objectY(object)-.25*.32*object.scale;
 for(let i=0;i<data.length;i+=36){
  if(![1,13,25].every(j=>Math.abs(data[i+j]-.30*.32)<1e-8))continue;
  const a=data.slice(i,i+3),b=data.slice(i+12,i+15),c=data.slice(i+24,i+27);
  for(let u=0;u<=6;u++)for(let v=0;v<=6-u;v++){
   const p=transform(a.map((n,k)=>n*(1-(u+v)/6)+b[k]*u/6+c[k]*v/6),matrix),ground=terrainH(p[0],p[2]);
   assert.ok(Number.isFinite(ground)&&ground>bottom+.002&&ground<p[1]-.002,'the earth foundation meets terrain without a floating rim or buried lawn');
   minGround=Math.min(minGround,ground);maxGround=Math.max(maxGround,ground);samples++;
   lakeClearance=Math.min(lakeClearance,Math.abs(p[0]-riverX(p[2]))-riverWidth(p[2]));
   for(const q of streetPoints)streetClearance=Math.min(streetClearance,Math.hypot(p[0]-q[0],p[2]-q[2]));
  }
 }
 assert.ok(samples>=400,'verify the complete emitted foundation');
 assert.ok(streetClearance>1.45,'the garden clears both traffic lanes and the existing raised curb');
 assert.ok(lakeClearance>.8,'the whole garden remains above the sheltered lake bank');
 const laneMesh=new Builder();buildMoonlightValleyApproach(laneMesh);roads.pop();assert.ok(laneMesh.data.every(Number.isFinite)&&laneMesh.data.length/12<2000,'the access lane stays a small static mesh');
 const start=approach.edge.at(0).p,street=roads[4].at(0).p,end=approach.edge.at(approach.edge.length).p,gate=transform([-.32,.45*.32,14.10*.32],matrix);
 assert.ok(Math.hypot(start[0]-street[0],start[2]-street[2])<1e-6&&start[1]-street[1]<.05,'the lane opens directly onto the existing street at curb height');
 assert.ok(Math.hypot(end[0]-gate[0],end[2]-gate[2])<1e-6&&Math.abs(end[1]-gate[1]-.005)<1e-6,'the approach meets the authored entrance with no plinth step');
 let laneTrackClearance=Infinity;
 for(let d=0;d<=approach.edge.length;d+=.10){const p=approach.edge.at(d).p,width=approach.width(d/approach.edge.length)/2+.20;
  for(const edge of edges)for(let offset=0;offset<=edge.length;offset+=.5){const q=edge.at(Math.min(offset,edge.length)).p;laneTrackClearance=Math.min(laneTrackClearance,Math.hypot(p[0]-q[0],p[2]-q[2])-width);}
  assert.ok(p[1]>terrainH(p[0],p[2]),'the gravel crown remains above the finished ground');
 }
 assert.ok(laneTrackClearance>1.3,'cars reach the theater without crossing a railway');
 assert.deepEqual([-12,-9.45,-6.9].map(x=>valleyFigureClear(x,17.4,.8,true)),[true,true,false],'retain the two original café tables clear of the garden');
 const walkers=buildValleyLife().actors;assert.equal(walkers.length,16,'the same miniature visitors remain in the valley');
 for(const actor of walkers.slice(6,12))for(let i=0;i<=20;i++){const p=lerpV(actor.a,actor.b,i/20);assert.ok(valleyFigureClear(p[0],p[2],.18,true),'forecourt walkers stop before the drive-in garden');}
 const view=communityWorkView({key:'valley'},id),places=communityWorkshopPlaces();assert.ok(view&&places.some(v=>v.contribution===id));
 assert.equal(view.target[0],object.x);assert.equal(view.target[2],object.z);assert.equal(view.distance,work.view.distance);
 assert.equal(communityWorkView({key:'commons'},id),null);assert.equal(communityWorkView({key:'valley'},id,1),null);
 const saved=snapshot(),roundTrip=validateProject(JSON.parse(JSON.stringify(saved))),savedObject=roundTrip.objects.find(o=>o.contribution===id);
 assert.deepEqual(plain(savedObject.credits),plain(object.credits));assert.equal(savedObject.placement,0,'save/import retains the actual contribution identity');
 for(const bad of [{contribution:'../bad'},{placement:-1},{placement:64}])assert.throws(()=>validateProject({...saved,objects:[{...object,...bad}]}),'invalid identity metadata is rejected');
 const original=objects;
 try{
  objects=clone(roundTrip.objects);let moved=objects.find(o=>o.contribution===id);moved.x-=2;moved.z-=1;moved.angle+=.2;moved.scale*=.8;
  const changed=communityWorkView({key:'valley'},id);assert.equal(changed.target[0],moved.x);assert.equal(changed.target[2],moved.z);assert.ok(Math.abs(changed.yaw-view.yaw-.2)<1e-9);assert.ok(Math.abs(changed.distance-view.distance*.8)<1e-9,'Views follow an edited model and scale');
  objects.push(clone(moved));assert.equal(communityWorkView({key:'valley'},id),null,'ambiguous duplicated identities cannot frame an arbitrary object');objects=objects.filter(o=>o.contribution!==id);
  assert.equal(communityWorkView({key:'valley'},id),null,'a removed miniature has no invented camera target');assert.ok(!communityWorkshopPlaces().some(v=>v.contribution===id));
 }finally{objects=original;}
 const links=grandHallRailwayLocations(hall);assert.equal(links.length,1);assert.equal(links[0].room,'valley');const url=new URL(links[0].href);assert.equal(url.searchParams.get('work'),id);assert.equal(url.searchParams.get('placement'),'0');
 return{id,at:piece.at,angle:object.angle,scale:object.scale,nativeScale:.32,vertices,trackClearance,streetClearance,lakeClearance,laneVertices:laneMesh.data.length/12,laneTrackClearance,foundationSamples:samples,minGround,maxGround,removed,view};
})()`);
class CreditNode{
 constructor(tag){this.tag=tag;this.children=[];this.textContent='';}
 append(...nodes){this.children.push(...nodes);}
 replaceChildren(...nodes){this.children=nodes;}
 setAttribute(){}
}
const list=new CreditNode('ul'),descendants=node=>[node,...node.children.flatMap(descendants)];
geometry.context.document.getElementById=()=>list;geometry.context.document.createElement=tag=>new CreditNode(tag);
geometry.run('paintBuilders();');
const author=list.children.find(row=>descendants(row).some(n=>n.tag==='a'&&n.href==='https://x.com/nickfromlater'));
assert.ok(author);const works=descendants(author).filter(n=>n.tag==='li'&&n.children.some(c=>c.tag==='strong'&&c.textContent==='Moonlight Drive-In'));
assert.equal(works.length,1,'the editable object, railway catalogue and Hall share one artwork credit');
const creditText=descendants(works[0]).map(n=>n.textContent).join(' ');
for(const room of geometry.run('[HOUSE_ROOMS.valley.name,HOUSE_ROOMS.grandhall.name]'))assert.ok(creditText.includes(room),'both homes are named beside the one work');
console.log('Moonlight Valley QA passed: '+JSON.stringify(report));
