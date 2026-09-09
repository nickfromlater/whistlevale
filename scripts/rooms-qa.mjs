#!/usr/bin/env node
// Exercise real room registration and house geometry without a browser or GPU.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {loadReviewedHallSources} from './community-lib.mjs';

const read=file=>readFile(new URL('../'+file,import.meta.url),'utf8');
const [railway,rooms,house,trains]=await Promise.all(['src/railway.js','src/rooms.js','src/shop-house.js','src/trains.js'].map(read));

// The renderer is a classic script. Load its pure geometry prefix and only the
// named helpers needed here, leaving canvas creation and the render loop alone.
function declaration(source,name,kind='function'){
 const start=source.lastIndexOf(kind+' '+name+(kind==='class'?'{':'('));
 assert.ok(start>=0,`Missing ${kind} ${name}`);
 let depth=0,quote='',lineComment=false,blockComment=false;
 for(let i=source.indexOf('{',start);i<source.length;i++){
  const c=source[i],next=source[i+1];
  if(lineComment){if(c==='\n')lineComment=false;continue;}
  if(blockComment){if(c==='*'&&next==='/'){blockComment=false;i++;}continue;}
  if(quote){if(c==='\\'){i++;continue;}if(c===quote)quote='';continue;}
  if(c==='/'&&next==='/'){lineComment=true;i++;continue;}
  if(c==='/'&&next==='*'){blockComment=true;i++;continue;}
  if(c==='"'||c==="'"||c==='`'){quote=c;continue;}
  if(c==='{')depth++;else if(c==='}'&&--depth===0)return source.slice(start,i+1);
 }
 throw new Error(`Unclosed ${kind} ${name}`);
}

const uploaded=[],disposed=new Set(),drawn=[];
const context=vm.createContext({assert,console,uploaded,disposed,drawn});
const pureEnd=railway.indexOf("const canvas=$('world')");assert.ok(pureEnd>0,'renderer geometry boundary exists');
vm.runInContext(railway.slice(0,pureEnd)+'\n'+declaration(railway,'Edge','class')+'\n'+
 ['roundRect','slab','roomSign','roomFrame','splineCurves','circuitAt','circuitMatrix'].map(name=>declaration(railway,name)).join('\n')+`
 const FLOOR=-23.97,I=ident(),mainProgram='main';let cutaway=false,viewMode='room';
 const roomLabels=Object.fromEntries(['rug','window','clock','blueprint','poster','slow','shop-sign','mountain-sign',...Array.from({length:6},(_,i)=>'house-'+i)].map(key=>[key,{u0:0,v0:0,u1:1,v1:1}]));
 function upload(data){assert.ok(data.every(Number.isFinite),'uploaded geometry is finite');assert.equal(data.length%36,0,'whole triangles');const mesh={id:uploaded.length,count:data.length/12};uploaded.push(mesh);return mesh;}
 function disposeMesh(mesh){if(!mesh)return;assert.ok(!disposed.has(mesh.id),'a mesh is disposed only once');disposed.add(mesh.id);}
 function draw(mesh){if(mesh)drawn.push(mesh.id);}
 function plant(){} // Decorative foliage is outside registry and layout behavior.
 function buildRoomLifeDetails(){const b=new Builder();b.box(0,.5,0,.1,1,.1,'#9a8763');return{mesh:b.mesh(),population:1};}
 const couplingMesh={id:'coupling'};
 function drawLink(){}function drawCollectionMotion(){}function drawCollectionBogies(){}
 const collectionStock=new Map(['coast','studio','alpine','workshop'].map(key=>[key,Object.fromEntries(['loco','cab','wheels','coach','tail','roof','motor','trailer','motorRoof','trailerRoof'].map(part=>[part,{id:key+'-'+part}]))]));
`,context,{filename:'rooms-qa:geometry'});
vm.runInContext(rooms,context,{filename:'src/rooms.js'});
vm.runInContext(house,context,{filename:'src/shop-house.js'});
vm.runInContext(declaration(trains,'collectionWheelPhase')+'\n'+declaration(trains,'drawHouseTrainFormation'),context,{filename:'rooms-qa:stock-selection'});

const result=vm.runInContext(`(()=>{
 const near=(a,b,message)=>assert.ok(Math.abs(a-b)<.00002,message);
 function checkLayout(layout,count){
  assert.equal(layout.rooms.length,count,'every registered room appears');
  assert.equal(new Set(layout.rooms.map(r=>r.key)).size,count,'no duplicate rooms');
  assert.ok(layout.mapEntry.target.every(Number.isFinite),'overview target is finite');
  assert.ok(Number.isFinite(layout.mapEntry.distance)&&layout.mapEntry.distance>0,'overview frames the house');
  for(const room of layout.rooms){
   assert.ok(Array.from(room.model).every(Number.isFinite),'finite room transform');
   near(transform([0,FLOOR,0],room.model)[1],layout.floorY,'all room floors align');
   assert.ok(room.focus.every(Number.isFinite)&&room.doorway.every(Number.isFinite),'focus and doorway are finite');
   const {bounds:b,hitBounds:h}=room;
   assert.ok(b.x0>=layout.bounds.x0&&b.x1<=layout.bounds.x1&&b.z0>=layout.bounds.z0&&b.z1<=layout.bounds.z1,'room lies within the house');
   assert.ok(h.x0>=b.x0&&h.x1<=b.x1&&h.z0>=b.z0&&h.z1<=b.z1,'picking bounds stay inside the room');
   assert.ok(h.x0<h.x1&&h.z0<h.z1,'room has a usable picking area');
   for(const other of layout.rooms){
    if(other===room)continue;const q=other.bounds;
    assert.ok(!(b.x0<q.x1&&b.x1>q.x0&&b.z0<q.z1&&b.z1>q.z0),'rooms do not overlap');
   }
  }
 }
 const base=createShopHouseLayout();checkLayout(base,4);
 assert.deepEqual(base.rooms.map(r=>r.key),['alpine','coast','valley','studio'],'original visual order is stable');
 const initialRevision=houseRoomRevision,initialCount=Object.keys(HOUSE_ROOMS).length;
 assert.throws(()=>registerHouseRoom('Invalid Key',{build(){}}),/lowercase URL-safe/);
 assert.throws(()=>registerHouseRoom('missing-builder',{}),/build/);
 assert.equal(houseRoomRevision,initialRevision,'rejected registration changes no revision');
 assert.equal(Object.keys(HOUSE_ROOMS).length,initialCount,'rejected room is not visible');

 const counts={marsh:0,garden:0,shell:0};
 function buildMarsh(scene,b){
  counts.marsh++;b.box(0,.5,0,28,1,20,'#859571');
  const edge=ovalRoute('Marsh branch',0,0,11,7,1);
  scene.routes.push(edge);scene.trains.push({edge,distance:3,speed:.6,type:'steam',cars:1});
  scene.height=()=>.5;scene.spots.push({name:'The wetland platform',target:[0,1,4],distance:20});rand();
 }
 function buildGarden(scene,b){counts.garden++;b.box(0,.6,0,30,1.2,22,'#87997c');const edge=ovalRoute('Garden tramway',0,0,12,8,1.2);scene.routes.push(edge);scene.trains.push({edge,distance:5,speed:.45,type:'mountain',cars:1});rand();}
 function gardenShell(b){counts.shell++;b.box(0,FLOOR-.1,0,180,.2,140,'#aa9573');const wall=new Builder();wall.box(0,1,-69,180,50,.4,'#cec3a3');return[{which:'back',mesh:wall.mesh()}];}
 registerHouseRoom('marsh',{name:'The Marsh Room',build:buildMarsh});
 const five=createShopHouseLayout();checkLayout(five,5);
 assert.equal(five.rooms.at(-1).key,'marsh','a fifth room appends automatically');
 assert.equal(five.rowDepths.length,3,'a new row is allocated');
 assert.ok(five.depth>base.depth&&five.entry[2]>base.entry[2],'hall and entry grow with the house');
 assert.equal(five.byKey.marsh.signKey,'house-4','fifth room plaque uses registry identity');
 const seedBefore=seed,marsh=getHouseScene('marsh');
 assert.equal(seed,seedBefore,'building a room restores global randomness');
 assert.equal(marsh.key,'marsh');assert.equal(marsh.routes.length,1);assert.equal(marsh.trains.length,1);
 assert.equal(marsh.walls.length,4,'a new room can use the default shell');
 assert.equal(marsh.population,1,'room detail population is included');
 assert.equal(getHouseScene('marsh'),marsh,'cached scene identity is preserved');
 assert.equal(counts.marsh,1,'cached scene is not rebuilt');
 const fiveHouse=buildShopHouse();assert.ok(fiveHouse.mesh.count<60000,'five-room connectors keep a bounded geometry budget');
 checkLayout(fiveHouse.layout,5);

 registerHouseRoom('garden',{name:'The Garden Room',build:buildGarden,shell:gardenShell,map:{scale:.37,footprint:[180,140],focus:[3,4,-2]}});
 const six=createShopHouseLayout();checkLayout(six,6);
 assert.deepEqual(six.rooms.slice(-2).map(r=>r.key),['marsh','garden'],'sixth room appears without editing map code');
 assert.equal(six.rowDepths.length,3,'sixth room shares the new row');
 near(six.byKey.garden.bounds.x1-six.byKey.garden.bounds.x0,180*.37,'custom footprint is respected');
 const expectedFocus=transform([3,4,-2],six.byKey.garden.model);
 for(let i=0;i<3;i++)near(six.byKey.garden.focus[i],expectedFocus[i],'custom focus transforms to house space');
 const garden=getHouseScene('garden');assert.equal(counts.shell,1,'registered custom shell is dispatched');
 assert.equal(garden.walls.length,1,'custom shell owns its wall set');
 const sixHouse=buildShopHouse();assert.ok(disposed.has(fiveHouse.mesh.id),'old house architecture is released on rebuild');
 assert.ok(sixHouse.mesh.count<70000,'six-room connectors keep a bounded geometry budget');checkLayout(sixHouse.layout,6);

 const oldMeshes=[marsh.mesh,marsh.lifeDetails.mesh,...marsh.walls.map(w=>w.mesh)];
 const previousRevision=houseRoomRevision;
 registerHouseRoom('marsh',{name:'The Marsh Gallery',build:buildMarsh});
 assert.equal(houseRoomRevision,previousRevision+1,'replacement invalidates registry consumers');
 assert.equal(HOUSE_ROOMS.marsh.number,'05','replacement preserves the room number');
 assert.equal(Object.keys(HOUSE_ROOMS).length,6,'replacement does not add a duplicate room');
 for(const mesh of oldMeshes)assert.ok(disposed.has(mesh.id),'replacing a room releases scenery, wall and life buffers');
 assert.ok(!roomScenes.has('marsh'),'replaced scene leaves the cache');
 assert.equal(getHouseScene('garden'),garden,'another cached room is untouched');
 const replacement=getHouseScene('marsh');assert.notEqual(replacement,marsh);assert.equal(counts.marsh,2);
 assert.throws(()=>getHouseScene('unregistered'),/No scene builder/);
 const successfulBuild=HOUSE_ROOM_BUILDERS.get('marsh');
 HOUSE_ROOM_BUILDERS.set('marsh',()=>{rand();throw new Error('fixture build failed');});roomScenes.delete('marsh');
 const beforeFailure=seed,uploadsBeforeFailure=uploaded.length;assert.throws(()=>getHouseScene('marsh'),/fixture build failed/);
 assert.equal(seed,beforeFailure,'failed build also restores randomness');assert.ok(!roomScenes.has('marsh'),'partial scene never enters the cache');
 for(const mesh of uploaded.slice(uploadsBeforeFailure))assert.ok(disposed.has(mesh.id),'builder failure releases uploaded walls');
 const route=ovalRoute('Validation fixture',0,0,9,6,1),valid={edge:route,distance:0,speed:0,type:'steam',cars:0};
 const malformed=[
  {trains:[],error:/Room "marsh" needs at least one train/},
  {trains:null,error:/Room "marsh" needs at least one train/},
  {trains:[null],error:/Room "marsh", train 1 needs a route edge/},
  {trains:[{...valid,edge:{length:30}}],error:/at\\(distance\\)/},
  ...[0,-2,Infinity,NaN].map(length=>({trains:[{...valid,edge:{at(){},length}}],error:/positive finite length/})),
  {trains:[{...valid,distance:NaN}],error:/finite distance and speed/},
  {trains:[{...valid,speed:Infinity}],error:/finite distance and speed/},
  {trains:[valid,{...valid,speed:undefined}],error:/Room "marsh", train 2 needs finite/}
 ];
 for(const fixture of malformed){
  HOUSE_ROOM_BUILDERS.set('marsh',(scene,b)=>{b.box(0,1,0,2,2,2,'#79906a');scene.trains=fixture.trains;rand();});
  const before=uploaded.length,previousSeed=seed;assert.throws(()=>getHouseScene('marsh'),fixture.error);
  assert.equal(uploaded.length-before,4,'invalid trains are rejected before scenery upload');
  for(const mesh of uploaded.slice(before))assert.ok(disposed.has(mesh.id),'validation failure releases each shell wall');
  assert.equal(seed,previousSeed);assert.ok(!roomScenes.has('marsh'),'invalid room is never cached');
 }
 const savedLifeBuilder=buildRoomLifeDetails,uploadsBeforeLifeFailure=uploaded.length;
 HOUSE_ROOM_BUILDERS.set('marsh',(scene,b)=>{b.box(0,1,0,2,2,2,'#79906a');scene.trains=[valid];});
 buildRoomLifeDetails=()=>{throw new Error('fixture life details failed');};
 assert.throws(()=>getHouseScene('marsh'),/fixture life details failed/);buildRoomLifeDetails=savedLifeBuilder;
 assert.equal(uploaded.length-uploadsBeforeLifeFailure,5,'a stationary valid train reaches scenery upload');
 for(const mesh of uploaded.slice(uploadsBeforeLifeFailure))assert.ok(disposed.has(mesh.id),'detail failure releases scenery and walls');
 assert.ok(!roomScenes.has('marsh'),'detail failure leaves no cached scene');
 HOUSE_ROOM_BUILDERS.set('marsh',successfulBuild);
 assert.equal(getHouseScene('marsh').key,'marsh','a corrected builder can load after failure');assert.equal(counts.marsh,3);

 const ordered=createShopHouseLayout({...HOUSE_ROOMS,garden:{...HOUSE_ROOMS.garden,mapOrder:-1}});
 assert.equal(ordered.rooms[0].key,'garden','map order can be explicitly changed');checkLayout(ordered,6);
 const badMap=createShopHouseLayout({...HOUSE_ROOMS,garden:{...HOUSE_ROOMS.garden,map:{scale:NaN,footprint:[0,-1],focus:[Infinity,0,0]}}});
 checkLayout(badMap,6);

 const train={...replacement.trains[0],cars:2};
 for(const [type,stock,expected]of[['steam',undefined,'coast'],['steam','studio','studio'],['mountain',undefined,'alpine'],['mountain','workshop','workshop']]){
  drawn.length=0;drawHouseTrainFormation(replacement,{...train,type,stock},mainProgram);
  assert.ok(drawn.includes(expected+(type==='steam'?'-loco':'-motor')),'new room gets the expected locomotive');
  assert.ok(drawn.includes(expected+(type==='steam'?'-tail':'-trailer')),'new room gets matching coaches');
 }
 assert.throws(()=>registerHouseRoom('empty',{railway:'false',build(){}}),/boolean/);
 registerHouseRoom('empty',{railway:false,build(){},shell:()=>[]});
 const empty=getHouseScene('empty');assert.equal(empty.trains.length,0);assert.equal(empty.routes.length,0);assert.equal(getHouseScene('empty'),empty);
 registerHouseRoom('empty',{railway:false,build(scene){scene.trains=[valid];},shell:()=>[]});
 assert.throws(()=>getHouseScene('empty'),/declares no railway/);assert.ok(!roomScenes.has('empty'));
 registerHouseRoom('empty',{railway:false,build(scene){scene.routes=[route];},shell:()=>[]});
 assert.throws(()=>getHouseScene('empty'),/declares no railway/);
 registerHouseRoom('empty',{railway:true,build(scene){scene.routes=[route];scene.trains=[valid];},shell:()=>[]});
 assert.equal(getHouseScene('empty').trains.length,1,'a landscape can graduate to a valid railway');
 return{rooms:six.rooms.length,connectorVertices:sixHouse.mesh.count};
})()`,context,{filename:'rooms-qa:regressions'});

console.log(`Room QA passed: ${result.rooms} registered rooms, fifth/sixth-room expansion, finite transforms, aligned floors, nonoverlap, map metadata, default/custom shells, cache replacement and disposal, malformed-train rejection and cleanup, failed-build recovery, and train stock fallback. ${result.connectorVertices.toLocaleString()} connector vertices.`);

// The real Hall owns its scale and the center of an expanding house.
vm.runInContext(await read('src/community-core.js'),context);
vm.runInContext(await read('src/grandhall-data.js'),context);
vm.runInContext(await read('src/grandhall-exhibits.js'),context);
const loadedHallSources=new Set();
async function loadHallSources(readSource=read){
 await loadReviewedHallSources({run:code=>vm.runInContext(code,context)},{loaded:loadedHallSources,readSource});
}
await loadHallSources();
for(const helper of ['windowPane','ringX','ringZ'])vm.runInContext(declaration(railway,helper),context);
vm.runInContext(await read('src/rooms/grandhall.js'),context);
vm.runInContext(`function checkHallGeometryBudgets(model){
 const records=GRAND_HALL_EXHIBITS.slice(),architecture=new Builder(),place=grandHallPlaceExhibit;
 grandHallPlaceExhibit=()=>0;
 try{buildGrandHallMap({},architecture);}finally{grandHallPlaceExhibit=place;}
 const architectureVertices=architecture.data.length/12;
 let exhibitVertices=0,previewVertices=0;for(const exhibit of records){const b=new Builder(),bay=GRAND_HALL_BAYS.find(q=>q.id===exhibit.bay),vertices=grandHallPlaceExhibit(exhibit,b,bay);exhibitVertices+=vertices;if(exhibit.mapPreview===true)previewVertices+=vertices;}
 assert.ok(architectureVertices<60000,'Hall preview architecture stays lightweight');
 assert.ok(exhibitVertices<=COMMUNITY_LIMITS.vertices,'Hall reviewed exhibits stay within the existing per-room community allowance');
 assert.equal(model.mesh.count,architectureVertices+previewVertices,'Hall overview accounts for architecture, occupancy plaques and opted-in native previews');
 assert.ok(model.mesh.count<60000+COMMUNITY_LIMITS.vertices,'Hall preview stays within its combined architecture and exhibit budgets');
 return{architectureVertices,exhibitVertices,previewVertices,totalVertices:model.mesh.count};
}`,context);
vm.runInContext(`(()=>{
 const layout=createShopHouseLayout(),hall=layout.byKey.grandhall;
 assert.equal(layout.centralKey,'grandhall');assert.equal(hall.center[0],0);assert.equal(hall.center[2],0);
 assert.equal(hall.bounds.x1-hall.bounds.x0,grandHallMapBounds[0]*.4);
 assert.equal(hall.bounds.z1-hall.bounds.z0,grandHallMapBounds[1]*.4);
 assert.ok(GRAND_HALL_BAYS.length>100,'freed display positions add usable bays');
 assert.equal(new Set(GRAND_HALL_BAYS.map(b=>b.id)).size,GRAND_HALL_BAYS.length);
 const model=getHouseScene('grandhall');assert.equal(model.trains.length,0);const budget=checkHallGeometryBudgets(model);
 const more={...HOUSE_ROOMS};for(let i=0;i<20;i++)more['fixture-'+i]={...HOUSE_ROOMS.coast};
 const expanded=createShopHouseLayout(more);assert.equal(expanded.rooms.length,Object.keys(more).length);
 assert.deepEqual(expanded.byKey.grandhall.footprint,hall.footprint,'growth never shrinks the Hall');
 for(const r of expanded.rooms){
  assert.ok(Math.abs(transform([0,FLOOR,0],r.model)[1]-expanded.floorY)<.00002);
  for(const q of expanded.rooms){if(q===r)continue;assert.ok(r.bounds.x1<=q.bounds.x0||r.bounds.x0>=q.bounds.x1||r.bounds.z1<=q.bounds.z0||r.bounds.z0>=q.bounds.z1,'central and wing rooms never overlap');}
 }
 // Vacant sites are architecture, not rooms or extra scene allocations. A
 // contribution should replace the site its author selected, without moving
 // all of the established rooms around a newly expanded bounding rectangle.
 function checkSites(house){
  assert.equal(house.plots.length,3,'the house keeps three open room sites');
  assert.equal(new Set(house.plots.map(p=>p.id)).size,3,'open site IDs are unique');
  for(const plot of house.plots){
   assert.ok(!house.byKey[plot.id],'an open floor does not masquerade as a registered room');
   assert.ok([...plot.center,...plot.doorway,...plot.labelAnchor].every(Number.isFinite),'site geometry has finite anchors');
   assert.equal(plot.center[1],house.floorY,'unbuilt floors align with the house');
   const a=plot.bounds;
   assert.ok(a.x0>=house.bounds.x0&&a.x1<=house.bounds.x1&&a.z0>=house.bounds.z0&&a.z1<=house.bounds.z1,'overview includes every open site');
   for(const other of [...house.rooms,...house.plots]){if(other===plot)continue;const b=other.bounds;
    assert.ok(a.x1<=b.x0||a.x0>=b.x1||a.z1<=b.z0||a.z0>=b.z1,'sites never overlap rooms or other sites');
   }
  }
 }
 checkSites(layout);checkSites(expanded);
 for(const plot of layout.plots){
  const filled=createShopHouseLayout({...HOUSE_ROOMS,contributed:{name:'An original room',map:{plot:plot.id,scale:plot.scale,footprint:plot.footprint}}});
  const room=filled.byKey.contributed;checkSites(filled);
  for(const axis of [0,2])assert.ok(Math.abs(room.center[axis]-plot.center[axis])<.00002,'a contribution replaces the chosen site at its authored scale');
  assert.ok(!filled.plots.some(p=>p.id===plot.id),'occupied sites stop inviting another room');
  for(const before of layout.rooms)for(const axis of [0,2])assert.ok(Math.abs(filled.byKey[before.key].center[axis]-before.center[axis])<.00002,'filling a site preserves existing room positions');
 }
 const far=createShopHouseLayout({...HOUSE_ROOMS,distant:{name:'The farthest gallery',map:{plot:'east-12'}}});checkSites(far);
 assert.equal(far.byKey.distant.column,1);assert.equal(far.byKey.distant.row,11);
 for(const room of far.rooms){const a=room.bounds;assert.ok(a.x0>=far.bounds.x0&&a.x1<=far.bounds.x1&&a.z0>=far.bounds.z0&&a.z1<=far.bounds.z1,'far claimed sites remain inside the overview');
  for(const other of far.rooms){if(other===room)continue;const b=other.bounds;assert.ok(a.x1<=b.x0||a.x0>=b.x1||a.z1<=b.z0||a.z0>=b.z1,'a distant claimed site never overlaps automatic rooms');}
 }
 assert.throws(()=>createShopHouseLayout({...HOUSE_ROOMS,first:{map:{plot:'east-12'}},second:{map:{plot:'east-12'}}}),/Two rooms cannot occupy house site/);
 for(const plot of ['north-3','east-0','west-100','east-3-extra',null])assert.throws(()=>createShopHouseLayout({...HOUSE_ROOMS,invalid:{map:{plot}}}),/map.plot must name a site/);
 assert.throws(()=>createShopHouseLayout({...more,duplicate:{...HOUSE_ROOMS.grandhall}}),/exactly one central/);
 console.log('Room site QA passed: replacement, stable placement, nonoverlap, distant claims, invalid IDs and conflicting claims.');
 console.log('Central Hall QA passed: authored scale, aligned floors, 20-room expansion, nonoverlap, stable bays and '+budget.totalVertices+' preview vertices ('+budget.architectureVertices+' architecture + '+budget.previewVertices+' opted-in previews; '+budget.exhibitVertices+' total reviewed exhibit vertices).');
})()`,context);

// An unpublished source exercises the same registry discovery as the next
// contributor. Keep it in this isolated VM, never in the public catalogue.
const fixtureSource='src/scenery/qa-hall-fixture.js';
vm.runInContext(`GRAND_HALL_EXHIBITS.push({id:'qa-hall-fixture',title:'Unpublished Hall test',credits:[{name:'QA fixture'}],builder:'qa-hall-fixture',scale:1,source:'${fixtureSource}',bay:GRAND_HALL_BAYS.find(b=>!GRAND_HALL_EXHIBITS.some(e=>e.bay===b.id)).id});`,context);
vm.runInContext(`(()=>{
 assert.equal(typeof qaHallFixture,'undefined','Hall-only fixture source has not executed');
 const before=getHouseScene('grandhall').mesh.count,b=new Builder();buildGrandHallMap({},b);
 assert.ok(b.data.length/12>before&&b.data.length/12<=before+36,'an unloaded Hall-only work adds only a small occupancy plaque to the map');
})()`,context);
await loadHallSources(source=>source===fixtureSource?Promise.resolve(`function qaHallFixture(b){
 b.box(0,.04,0,.8,.08,.8,'#7e6850',22);b.cylinder(0,.24,0,.035,.035,.40,'#bda167',41,8);
 ringZ(b,0,.31,0,.16,.18,.018,'#bda167',41,12);
 for(let i=0;i<6;i++){const a=i*Math.PI/3;b.sphere(Math.cos(a)*.26,.44,Math.sin(a)*.26,.045,.045,.045,'#bda167',41,8,5);}
}`):read(source));
vm.runInContext(`(()=>{
 const original=grandHallBuildExhibit,fixture=GRAND_HALL_EXHIBITS.at(-1),bay=GRAND_HALL_BAYS.find(b=>b.id===fixture.bay),before=getHouseScene('grandhall').mesh.count;
 const definition={...HOUSE_ROOMS.grandhall,build:HOUSE_ROOM_BUILDERS.get('grandhall'),shell:ROOM_SHELLS.grandhall};
 let fixtureBuilds=0;
 try{
  grandHallBuildExhibit=(name,b)=>{if(name===fixture.builder){fixtureBuilds++;return qaHallFixture(b);}return original(name,b);};
  const b=new Builder(),vertices=grandHallPlaceExhibit(fixture,b,bay),ca=Math.cos(bay.yaw),sa=Math.sin(bay.yaw);let minY=Infinity;
  for(let i=0;i<b.data.length;i+=12){const dx=b.data[i]-bay.x,dz=b.data[i+2]-bay.z,x=ca*dx-sa*dz,z=sa*dx+ca*dz,y=b.data[i+1]-bay.surfaceY;
   assert.ok(Math.abs(x)<bay.usableWidth/2&&Math.abs(z)<bay.usableDepth/2,'new Hall fixture fits its actual bay');
   if(bay.usableRadius!=null)assert.ok(Math.hypot(x,z)<bay.usableRadius,'new Hall fixture fits a circular bay');
   assert.ok(y<=bay.maxHeight,'new Hall fixture clears its display ceiling');minY=Math.min(minY,y);
  }
  assert.ok(Math.abs(minY)<1e-6,'new Hall fixture rests on its display');
  const beforeMapBuilds=fixtureBuilds;registerHouseRoom('grandhall',definition);const marked=getHouseScene('grandhall');
  assert.equal(fixtureBuilds,beforeMapBuilds,'default map rendering does not construct the Hall-only native model');
  assert.ok(marked.mesh.count>before&&marked.mesh.count<=before+36,'default map rendering retains its occupancy plaque');
  checkHallGeometryBudgets(marked);
  fixture.mapPreview=true;
  registerHouseRoom('grandhall',definition);const model=getHouseScene('grandhall'),budget=checkHallGeometryBudgets(model);
  assert.equal(model.mesh.count,before+vertices,'an explicit map preview renders the complete native model');
  console.log('New Hall contribution QA passed: unloaded Hall-only source leaves a small map plaque; explicit preview renders '+vertices+' native vertices with surface contact, bay bounds and '+budget.totalVertices+' total preview vertices within separate budgets.');
 }finally{grandHallBuildExhibit=original;GRAND_HALL_EXHIBITS.pop();registerHouseRoom('grandhall',definition);}
})()`,context);
