import assert from 'node:assert/strict';
import {communityContext,loadCommunity,loadContributionDefinitions,inspectCommunityScenes} from './community-lib.mjs';

const state=await communityContext(),{context,run}=state,catalogue=await loadCommunity();
await loadContributionDefinitions(state,catalogue);
const noop=()=>{};context.glStub=new Proxy({getParameter:()=>8192},{get:(o,k)=>k in o?o[k]:noop});context.assert=assert;context.inspectScenes=keys=>inspectCommunityScenes(state,keys);
context.uploadCheck=data=>{assert.equal(data.length%36,0);for(const n of data)assert.ok(Number.isFinite(n),'geometry attributes must be finite');return{count:data.length/12};};
run('gl=glStub;upload=uploadCheck;disposeMesh=function(){};initTracks();initLabels();initRoomArt();initHouseArt();');
const results=run(`(()=>{
 const reports=[];
 // The contribution path follows the registry when another room is added.
 registerHouseRoom('qa-gallery',{name:'QA gallery',build(scene){const route={length:1,at:()=>({p:[20,1,20]})};scene.routes=[route];scene.height=()=>1;scene.trains=[{edge:route,distance:0,speed:0}];},shell:()=>[]});
 communityCatalogue.works.push({id:'qa-gallery-person',title:'QA figure',room:'qa-gallery',credits:[{name:'Test fixture'}],miniatures:[{builder:'person',at:[0,0]}]});

 for(const key of HOUSE_ROOM_BUILDERS.keys()){
  const scene=getHouseScene(key),expected=communityCatalogue.works.filter(w=>w.room===key).reduce((n,w)=>n+(w.miniatures?.length||0),0),actual=scene.lifeDetails.details.filter(d=>d.contribution).length;
  assert.equal(actual,expected,key+' has no silently omitted community placements; inspect slope and rail clearances');
  assert.ok(scene.lifeDetails.communityVertices<=COMMUNITY_LIMITS.vertices,key+' miniature vertex budget');
  reports.push({room:key,placements:actual,vertices:scene.lifeDetails.communityVertices});
 }
 // Every allowed miniature builder runs through the actual mapping, including
 // scaled compositions and the default pose/prop parameter paths.
 const original=communityCatalogue.works;
 try{
  const commons=getHouseScene('commons');
  assert.equal(commons.trains.length,0,'the shared starting landscape has no trains');assert.equal(commons.routes.length,0);
  assert.equal(HOUSE_ROOMS.commons.railway,false);assert.ok(houseLayoutLights('commons').every(p=>p[1]<FLOOR),'no inherited village street lights in the starting meadow');
  // Documented starting sites accept a cottage alongside existing contributions.
  for(const at of[[-23,-3],[25,7],[18,-9]]){
   communityCatalogue.works=[...original.filter(w=>w.room==='commons'),{id:'fixture-cottage',title:'QA cottage',kind:'building',source:'contributions/world.json',room:'commons',credits:[{name:'Test fixture'}],miniatures:[{builder:'cottage',at}]}];
   validateCommunity({format:'whistlevale-community',version:1,works:communityCatalogue.works});
   const detail=buildRoomLifeDetails('commons',commons),placed=detail.details.find(d=>d.contribution==='fixture-cottage');assert.ok(placed,'documented site accepts a cottage beside existing works');
   assert.equal(placed.credits[0].name,'Test fixture');assert.ok(detail.communityVertices>0);
  }
  for(const at of[[commonsStream(0),0],[54,0],[COMMONS_TREES[0].x,COMMONS_TREES[0].z]]){
   communityCatalogue.works=[{id:'fixture-cottage',title:'QA cottage',kind:'building',source:'contributions/world.json',room:'commons',credits:[{name:'Test fixture'}],miniatures:[{builder:'cottage',at}]}];
   const rejected=buildRoomLifeDetails('commons',commons);
   assert.equal(rejected.details.length,0,'water, board edges and woodland stay clear');
   assert.equal(rejected.omitted.length,1);assert.equal(rejected.omitted[0].id,'fixture-cottage');assert.equal(rejected.omitted[0].placement,0);
   assert.ok(rejected.omitted[0].reason.length>10,'placement failure explains how to choose safe ground');
   const prior=commons.lifeDetails;try{commons.lifeDetails=rejected;assert.throws(()=>inspectScenes(['commons']),error=>error.message.includes('fixture-cottage miniatures[0] in commons at'));}finally{commons.lifeDetails=prior;}
  }
  for(const work of original.filter(w=>w.room==='commons'&&w.view)){const spot=commons.spots.find(p=>p.name===work.title);assert.ok(spot,'authored contribution is discoverable in Places');assert.ok(spot.target.every(Number.isFinite));assert.equal(spot.distance,work.view.distance);}
  assert.ok(commons.mesh.count<300000,'starting landscape stays within its measured geometry allowance');
  // Compare the surface sampler with barycentric positions in both triangles.
  for(const [u,v]of[[.2,.3],[.8,.7]]){
   const x0=17.25,z0=-9.75,a=commonsHeight(x0,z0),r=commonsHeight(x0+.75,z0),f=commonsHeight(x0,z0+.75),q=commonsHeight(x0+.75,z0+.75);
   const expected=u+v<=1?a+(r-a)*u+(f-a)*v:q+(f-q)*(1-u)+(r-q)*(1-v);
   assert.ok(Math.abs(commonsSurface(x0+u*.75,z0+v*.75)-expected)<1e-12);
  }
  console.log('Commons base geometry: '+commons.mesh.count.toLocaleString()+' vertices; three cottage sites verified.');
  for(const pose of ['stand','sitGround','sit','perch','read','chair','sip','walk','hike','carry','paint','work','wave','talk','point','readStand','camera','bag','map']){
   communityCatalogue.works=[{id:'fixture-person',title:'Fixture',room:'commons',credits:[{name:'Test fixture'}],miniatures:[{builder:'person',at:[0,0],pose}]}];
   const b=new Builder();communityMiniatures('commons',(name,fn)=>fn(b,0,0,0,0));
   for(let i=0;i<b.data.length;i+=12)assert.ok(Math.hypot(b.data[i],b.data[i+2])<=COMMUNITY_BUILDERS.person,pose+' stays inside the person footprint');
  }
  for(const builder of Object.keys(COMMUNITY_BUILDERS))for(const scale of[1,.8]){
   communityCatalogue.works=[{id:'fixture',title:'Fixture',room:'coast',credits:[{name:'Test fixture'}],miniatures:[{builder,at:[0,0],scale}]}];
   const b=new Builder();let calls=0;
   communityMiniatures('coast',(name,fn,x,z,angle)=>{calls++;const count=fn(b,x,1,z,angle);assert.ok(Number.isFinite(count));});
   assert.equal(calls,1,builder+' called');assert.ok(b.data.length>0,builder+' emits geometry');uploadCheck(b.data);
   for(let i=0;i<b.data.length;i+=12)assert.ok(Math.hypot(b.data[i],b.data[i+2])<=COMMUNITY_BUILDERS[builder]*scale+1e-8,builder+' geometry exceeds its declared footprint');
  }
 }finally{communityCatalogue.works=original;}
 return reports;
})()`);
console.table(results);
console.log('Community scene QA passed: every registered annex, visible placements, finite geometry, all miniature builders and per-room budgets.');
