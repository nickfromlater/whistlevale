import assert from 'node:assert/strict';
import {communityContext,loadCommunity,loadContributionDefinitions} from './community-lib.mjs';

const state=await communityContext(),{context,run}=state,catalogue=await loadCommunity();
await loadContributionDefinitions(state,catalogue);
const noop=()=>{};context.glStub=new Proxy({getParameter:()=>8192},{get:(o,k)=>k in o?o[k]:noop});context.assert=assert;
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
  for(const builder of Object.keys(COMMUNITY_BUILDERS))for(const scale of[1,.8]){
   communityCatalogue.works=[{id:'fixture',title:'Fixture',room:'coast',credits:[{name:'Test fixture'}],miniatures:[{builder,at:[0,0],scale}]}];
   const b=new Builder();let calls=0;
   communityMiniatures('coast',(name,fn,x,z,angle)=>{calls++;const count=fn(b,x,1,z,angle);assert.ok(Number.isFinite(count));});
   assert.equal(calls,1,builder+' called');assert.ok(b.data.length>0,builder+' emits geometry');uploadCheck(b.data);
  }
 }finally{communityCatalogue.works=original;}
 return reports;
})()`);
console.table(results);
console.log('Community scene QA passed: every registered annex, visible placements, finite geometry, all miniature builders and per-room budgets.');
