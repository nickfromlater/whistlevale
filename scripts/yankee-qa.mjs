import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {communityContext,loadCommunity,loadContributionDefinitions,prepareCommunityGeometry} from './community-lib.mjs';
const state=await communityContext();state.context.assert=assert;
const savedCollection=new Map();state.context.localStorage={getItem:key=>savedCollection.get(key)||null,setItem:(key,value)=>savedCollection.set(key,value)};
await loadContributionDefinitions(state,await loadCommunity());prepareCommunityGeometry(state);
// Measure emitted geometry while it is uploaded, rather than rebuilding this
// deliberately detailed model for every assertion.
const uploads=[];state.context.communityUpload=data=>{
 assert.equal(data.length%36,0);const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 for(let i=0;i<data.length;i+=12){for(let j=0;j<12;j++)assert.ok(Number.isFinite(data[i+j]));for(let j=0;j<3;j++){min[j]=Math.min(min[j],data[i+j]);max[j]=Math.max(max[j],data[i+j]);}}
 let reversedGround=0;
 for(let i=0;i<data.length;i+=36)if(data[i+4]>.999&&data[i+16]>.999&&data[i+28]>.999&&(data[i+14]-data[i+2])*(data[i+24]-data[i])-(data[i+12]-data[i])*(data[i+26]-data[i+2])<-.000001)reversedGround++;
 const mesh={id:uploads.length,count:data.length/12,min,max,reversedGround};uploads.push(mesh);return mesh;
};
state.run("upload=communityUpload;globalThis.yankeeScene=getHouseScene('yankee');");
state.context.uploads=uploads;
state.run(`(()=>{
 const s=yankeeScene,q=HOUSE_ROOMS.yankee,near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6);
 assert.equal(getHouseScene('yankee'),s);assert.equal(s.trains.length,2);assert.equal(s.routes.length,2);assert.equal(s.walls.length,5);assert.equal(s.spots.length,6);
 assert.ok(s.mesh.count>4000000&&s.mesh.count<5100000,'fixed 5.1M vertex ceiling for the complete authored room');
 const chunks=s.mesh.parts||[s.mesh];
 assert.ok(s.mesh.buildPeakValues<=65535*12,'dense room construction never retains more than one bounded batch');
 assert.equal(chunks.reduce((n,m)=>n+m.reversedGround,0),0,'ground winding agrees with its normals in the two-sided host shader');assert.equal(s.bronx.seats,35829);assert.equal(s.bronx.population,467);assert.deepEqual(Array.from(s.bronx.fieldFeet),[318,399,408,385,314]);
 assert.equal(YankeeModel.constants.gauge,.64);near(YankeeModel.constants.footUnit*90,12.24);
 assert.equal(q.map.plot,'west-4');assert.ok(validateCredits(q.credits).some(c=>c.handle==='nickfromlater'));
 for(const mesh of[...chunks,...s.walls.map(w=>w.mesh)])for(const axis of[0,2])assert.ok(Math.max(Math.abs(mesh.min[axis]),Math.abs(mesh.max[axis]))<=q.map.footprint[axis===0?0:1]/2+.001,'finished gallery fits its map footprint');
 assert.equal(s.ownedMeshes.length,10);assert.equal(new Set(s.ownedMeshes).size,10);assert.ok(s.ownedMeshes.reduce((n,m)=>n+m.count,0)<18000,'shared stock geometry stays small');
 for(const train of s.trains){
  assert.equal(train.cars,9);assert.equal(train.type,'mountain');assert.ok(train.speed>=0);
  for(let time=0;time<108;time+=.125){train.serviceTime=time;yankeeService(train,0,1);assert.ok(Number.isFinite(train.distance));assert.ok(train.doorOpen>=0&&train.doorOpen<=1);if(train.doorOpen>0){const before=train.distance;yankeeService(train,.001,2.226);near(train.distance,before);}}
  train.serviceTime=48;yankeeService(train,0,1);assert.equal(train.doorOpen,1);assert.equal(train.speed,0,'wheel audio stops while doors are open');const distance=train.distance;advanceHouseTrain(train,1,0);near(train.distance,distance);near(train.serviceTime,48);
  const p=train.edge.at(train.distance).p,rear=train.edge.at(train.distance-9*7.12).p;assert.ok(Math.min(p[2],rear[2])>-1&&Math.max(p[2],rear[2])<73,'all ten cars berth within the platforms');
  near(Math.abs(train.edge.at(train.distance+.1).p[2]-p[2]),.1);near(train.edge.at(train.distance).f[2],train.direction);
  for(const t of[0,107.999]){train.serviceTime=t;yankeeService(train,0,1);for(let i=0;i<10;i++){const z=houseTrainAt(train,i*7.12).p[2];assert.ok(z<-109||z>115,'timetable wraps only with every car outside the model');}}
 }
 for(let t=0;t<108;t+=.5){for(const [i,train]of s.trains.entries()){train.serviceTime=(t+i*49)%108;yankeeService(train,0,1);}const focus=s.trainFocus();assert.ok(focus.p[2]>=-99&&focus.p[2]<=103,'cinema and cab views stay on the display during hidden staging');}
 const width=innerWidth;
 for(const w of[320,390,1440]){innerWidth=w;for(const shot of['drift','side','wide','tail'])for(const time of[0,30,57,107]){
  const camera=s.cinemaView(shot,time);assert.ok([...camera.position,...camera.target].every(Number.isFinite));assert.ok(len(sub(camera.position,camera.target))>10);
  if(shot==='side'||shot==='tail')assert.ok(camera.position[0]>82&&camera.position[0]<90,'the elevated camera stays in the open corridor before the city facades');
 }}innerWidth=width;
 // The same aimed lamps illuminate the room's geometry after map scaling.
 const local=houseFloodLights('yankee'),model=mm(trans(20,3,-40),scaling(.22,.22,.22)),mapped=houseFloodLights('yankee',model);
 assert.equal(local.positions.length,32);assert.ok(local.colors.every(v=>v>0));
 for(let i=0;i<8;i++){const light=q.floodLights[i],p=transform(light.position,model);for(let j=0;j<3;j++)assert.ok(Math.abs(mapped.positions[i*4+j]-p[j])<.0001);near(mapped.positions[i*4+3],light.radius*.22);}
 assert.ok(houseFloodLights('coast').colors.every(v=>v===0),'other rooms do not inherit the stadium lamps');
 const unlit=houseFloodLights('');assert.ok(unlit.colors.every(v=>v===0),'the map architecture has no room definition and must not crash the renderer');assert.equal(houseFloodLights(''),unlit,'unregistered-room lighting can be cached safely');
 const savedDraw=draw,draws=[];mainProgram={u:{}};shadowProgram={u:{}};
 try{
  draw=(mesh,m)=>{assert.ok(Array.from(m).every(Number.isFinite));draws.push(mesh);};
  const train=s.trains[0];train.serviceTime=48;yankeeService(train,0,1);cutaway=false;drawYankeeTrain(s,train,mainProgram);
  assert.equal(draws.filter(m=>m===s.stockMeshes.roof).length,10);assert.equal(draws.filter(m=>m===s.stockMeshes.wheels).length,40);assert.equal(draws.filter(m=>m===s.stockMeshes.bogies).length,10);
  draws.length=0;cutaway=true;drawYankeeTrain(s,train,mainProgram);assert.equal(draws.filter(m=>m===s.stockMeshes.roof).length,0);
  draws.length=0;drawYankeeTrain(s,train,shadowProgram);assert.equal(draws.filter(m=>m===s.stockMeshes.roof).length,10,'cutaway does not delete roof shadows');
 }finally{draw=savedDraw;cutaway=false;}
 assert.equal(collectionTrainLabel('yankee').name,'River Avenue Local');assert.equal(collectionPower('yankee'),'electric');assert.equal(selectedCollection.yankee,undefined);
 assert.equal(collectionActiveChoice('yankee'),null,'a cabinet preview candidate is not the running subway');
 const native=s.trains[0],other=s.trains[1],phase=native.serviceTime,position=native.distance,door=native.doorOpen;
 chooseCollectionTrain('yankee',{id:'kingfisher',livery:0,cars:2});
 assert.equal(collectionActiveChoice('yankee').id,'kingfisher');assert.equal(native.cars,2);assert.equal(s.trains[1],other);
 assert.equal(restoreRoomTrain('yankee'),true);
 assert.equal(native.cars,9);assert.equal(native.type,'mountain');assert.equal(native.stock,undefined);assert.equal(native.collectionChoice,undefined);assert.equal(native.draw,drawYankeeTrain);assert.equal(native.advance,yankeeService);
 assert.equal(native.serviceTime,phase);assert.equal(native.distance,position);assert.equal(native.doorOpen,door);assert.equal(s.trains[1],other,'restore preserves the opposite service');
 assert.equal(collectionExport().rooms.yankee,undefined,'restored defaults survive portable export without an override');
 assert.equal(collectionActiveChoice('yankee'),null);assert.equal(collectionTrainLabel('yankee').name,'River Avenue Local');
 const disposed=new Set();disposeMesh=mesh=>{if(mesh){assert.ok(!disposed.has(mesh));disposed.add(mesh);}};
 registerHouseRoom('yankee',{...q,build:buildYankeeRoom,shell:yankeeGallery});
 for(const mesh of[s.mesh,s.lifeDetails.mesh,...s.walls.map(w=>w.mesh),...s.ownedMeshes])if(mesh)assert.ok(disposed.has(mesh),'cache invalidation releases every room-owned mesh');
 let partial;
 registerHouseRoom('yankee-fixture',{build(scene,b){b.box(0,0,0,1,1,1,'#ffffff');partial=b.mesh();scene.ownedMeshes=[partial];throw Error('fixture');},shell(){return[];}});
 assert.throws(()=>getHouseScene('yankee-fixture'),/fixture/);assert.ok(disposed.has(partial),'failed room construction releases already-uploaded train parts');
 globalThis.report={roomVertices:s.mesh.count,roomBatches:chunks.length,maxBuildValues:s.mesh.buildPeakValues,wallVertices:s.walls.reduce((n,w)=>n+w.mesh.count,0),sharedTrainVertices:s.ownedMeshes.reduce((n,m)=>n+m.count,0),seats:s.bronx.seats,figures:s.bronx.population,services:2,carsPerService:10,floodLights:8,viewpoints:s.spots.length};
})()`);
const railway=await readFile(new URL('../src/railway.js',import.meta.url),'utf8');
assert.ok(railway.includes("uf(postProgram,'uFar',cameraFar)"));
assert.ok(railway.includes('2.*uFar*uNear/(uFar+uNear-'));
console.log(JSON.stringify(state.context.report,null,2));
console.log('Yankee QA passed: field scale, finite bounded geometry, complete formations, station berths, door interlock, throttle stop, hidden staging, shared stock, roof cutaway, mapped floodlights, independent room lighting, public credit and mesh disposal.');
