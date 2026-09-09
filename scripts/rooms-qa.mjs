#!/usr/bin/env node
// Exercise real room registration and house geometry without a browser or GPU.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

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
