#!/usr/bin/env node
// Controller state/input regressions. Uses real map code and camera math, with
// small adapters for UI, animation frames and the existing scene/audio services.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const read=file=>readFile(new URL('../'+file,import.meta.url),'utf8');
const [railway,rooms,house,controller,hobbySource]=await Promise.all(['src/railway.js','src/rooms.js','src/shop-house.js','src/shop-map.js','src/hobby.js'].map(read));
function declaration(source,name){
 const start=source.lastIndexOf('function '+name+'(');assert.ok(start>=0,'Missing '+name);
 let depth=0,quote='',line=false,block=false;
 for(let i=source.indexOf('{',start);i<source.length;i++){
  const c=source[i],next=source[i+1];
  if(line){if(c==='\n')line=false;continue;}
  if(block){if(c==='*'&&next==='/'){block=false;i++;}continue;}
  if(quote){if(c==='\\'){i++;continue;}if(c===quote)quote='';continue;}
  if(c==='/'&&next==='/'){line=true;i++;continue;}if(c==='/'&&next==='*'){block=true;i++;continue;}
  if(c==='"'||c==="'"||c==='`'){quote=c;continue;}
  if(c==='{')depth++;else if(c==='}'&&--depth===0)return source.slice(start,i+1);
 }
 throw new Error('Unclosed '+name);
}
const raf=[],events=new Map(),records={builds:[],activations:[],errors:[],toasts:[],audio:[],draws:[],normalCameras:0};
const listeners={addEventListener(type,fn){if(!events.has(type))events.set(type,[]);events.get(type).push(fn);}};
const classes=new Set(),captured=new Set();
const canvas={style:{},setAttribute(){},closest:()=>null,setPointerCapture:id=>captured.add(id),hasPointerCapture:id=>captured.has(id),releasePointerCapture:id=>captured.delete(id)};
const node={hidden:false,focus(){},setAttribute(){}};
const ui={visible:false,loading:null,selected:null,current:null,roomKeys:[],init(){},show(key){this.visible=true;this.selected=this.current=key;this.refresh();},hide(){this.visible=false;},select(key,current){this.selected=key;this.current=current;},setLoading(text){this.loading=text;},setMarkerPositions(){},refresh(){this.roomKeys=Array.from(this.getRoomKeys?.()||[]);}};
const navigations=[];
const context=vm.createContext({URL,location:{href:'https://example.test/index.html',origin:'https://example.test',assign:url=>navigations.push(url)},assert,records,console:{...console,error:error=>records.errors.push(error.message)},requestAnimationFrame:fn=>{raf.push(fn);return raf.length;},
 window:listeners,canvas,document:{getElementById:()=>node,body:{classList:{add:name=>classes.add(name),remove:(...names)=>names.forEach(name=>classes.delete(name))}}},ShopMapUI:ui,
 innerWidth:1440,innerHeight:900,screenW:1440,screenH:900,$:()=>node});
const run=code=>vm.runInContext(code,context);
run(declaration(hobbySource,'visitHouseDestination'));
vm.runInContext(railway.slice(0,railway.indexOf("const canvas=$('world')"))+'\n'+
 ['roundRect','slab','project','screenRay'].map(name=>declaration(railway,name)).join('\n')+`
 const FLOOR=-23.97,I=ident(),mainProgram='main',roomLabels={};
 let meshId=0;function upload(data){return{id:++meshId,count:data.length/12};}function disposeMesh(){}
 let viewMode='engine',orbit={target:[2,3,4],distance:41,yaw:.7,pitch:.6},cameraPos=[12,14,28],cameraTarget=[2,3,4];
 let cameraFar=500,cameraNear=.1,cameraProjection=perspective(.64,screenW/screenH,.1,500),VP=mm(cameraProjection,lookAt(cameraPos,cameraTarget)),lightVP=ident();
 let lensAmount=.63,cutaway=true,building=false,hidden=false,shadowDirty=false,paused=false,speed=2,reduceMotion=false;
 let sunDir=norm([-48,74,-25]),travel=4,leadInfo={p:[1,2,3],f:[0,0,1]},failRoom=null;
 const hobby={ready:true,room:'valley',scene:null,cinema:false,transition:false};
 function draw(mesh,m){records.draws.push({mesh,m:Array.from(m)});}function drawHobbyStatic(){}function drawHobbyTrains(){}function drawHobbyParticles(){}
 function updateCamera(){records.normalCameras++;cameraProjection=perspective(.64,screenW/screenH,.1,500);VP=mm(cameraProjection,lookAt(cameraPos,cameraTarget));}
 function updateSimulation(dt){if(hobby.scene&&!paused)for(const train of hobby.scene.trains)train.distance+=dt*train.speed*speed;}
 function updateHobbyAudio(){records.audio.push({kind:'ambience',room:hobby.room,point:project(hobbyTrainInfo().p),eye:cameraPos.slice()});}
 function hobbyTrainInfo(){return hobby.scene?{p:[3,2,-4],f:[0,0,1]}:leadInfo;}
 function hobbyHasTrain(){return hobby.room==='valley'||!!hobby.scene?.trains.length;}
 function hobbyTrainMatrix(){return ident();}function hobbyTrainInTunnel(){return false;}
 class RailwayAudio{update(){
  records.audio.push({kind:'railway',room:hobby.room,point:project(hobbyTrainInfo().p),eye:cameraPos.slice(),travel,speed,lead:leadInfo,lastChuff:this.lastChuff});
  if(this.fail)throw new Error('audio fixture failed');
  this.lastChuff=Math.floor(travel/.45);this.lastJoint=Math.floor(travel/1.42);
 }}
 let audio=new RailwayAudio();audio.active=true;function soundMuted(){return false;}function enableSound(){audio.active=true;}
 function updateUI(){}function toast(message){records.toasts.push(message);}
 function enterBuild(on){building=on;}function leaveCinema(){hobby.cinema=false;}function enterCinema(){hobby.cinema=true;}
`,context,{filename:'shop-map-qa:adapters'});
vm.runInContext(rooms,context,{filename:'src/rooms.js'});
run(`ShopMapUI.getRoomKeys=()=>Object.keys(HOUSE_ROOMS);getHouseScene=function(key){
 if(roomScenes.has(key))return roomScenes.get(key);if(key===failRoom)throw new Error('fixture room failed');
 records.builds.push(key);const scene={key,trains:[{distance:10,speed:.5,type:key==='alpine'?'mountain':'steam'}],walls:[]};roomScenes.set(key,scene);return scene;
};
function activateHouseRoom(key){records.activations.push(key);hobby.room=key;hobby.scene=key==='valley'?null:getHouseScene(key);viewMode='room';orbit.target=HOUSE_ROOMS[key].target.slice();cameraTarget=orbit.target.slice();cameraPos=add(cameraTarget,[15,20,30]);}
`);
vm.runInContext(house,context,{filename:'src/shop-house.js'});
vm.runInContext(controller,context,{filename:'src/shop-map.js'});
run('initHouseMap()');
async function settle(promise){
 let done=false,error;promise.then(()=>{done=true;},reason=>{done=true;error=reason;});
 for(let i=0;i<80&&!done;i++){await Promise.resolve();const frame=raf.splice(0);for(const fn of frame)fn(16*i);}
 assert.ok(done,'controller resolves within bounded animation frames');if(error)throw error;
}
async function until(predicate){
 for(let i=0;i<80;i++){await Promise.resolve();const frame=raf.splice(0);for(const fn of frame)fn(16*i);if(predicate())return;}
 assert.fail('controller did not reach the expected state within bounded animation frames');
}
function fire(type,extra={}){
 const event={type,target:canvas,pointerId:1,clientX:700,clientY:450,deltaY:0,key:'',preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;},...extra};
 for(const fn of events.get(type)||[]){fn(event);if(event.stopped)break;}return event;
}
const snapshot=()=>run('JSON.stringify({room:hobby.room,scene:hobby.scene?.key,view:viewMode,orbit,eye:cameraPos,target:cameraTarget,lens:lensAmount,light:Array.from(lightVP)})');
const original=snapshot();
let pending=run('openHouseMap()');assert.ok(ui.visible&&ui.loading,'cold open announces loading');
run('closeShopMap()');await settle(pending);
assert.equal(snapshot(),original,'cancelled open restores camera and room');assert.equal(records.builds.length,0,'cancelled loader cannot build or reopen later');

await settle(run('openHouseMap()'));assert.equal(run('shopMap.active'),true);assert.equal(records.builds.length,3);
assert.equal(ui.selected,'valley');assert.equal(ui.loading,null);
run(`(()=>{
 const before={room:hobby.room,scene:hobby.scene,eye:cameraPos,target:cameraTarget,view:viewMode,cutaway,projection:cameraProjection,VP};
 const entry=SHOP_HOUSE_LAYOUT.byKey.coast,local=[3,2,-4],expected=project(transform(local,entry.model));
 assert.throws(()=>shopRoomScope(entry,()=>{
  assert.equal(hobby.room,'coast');const p=project(local);assert.ok(Math.abs(p.x-expected.x)<.0001&&Math.abs(p.y-expected.y)<.0001,'scoped project maps local points into house coordinates');
  draw({id:'probe'},I);throw new Error('scope failure');
 }),/scope failure/);
 assert.equal(shopRoomModel,null);assert.equal(hobby.room,before.room);assert.equal(hobby.scene,before.scene);assert.equal(cameraPos,before.eye);assert.equal(cameraTarget,before.target);assert.equal(viewMode,before.view);assert.equal(cutaway,before.cutaway);assert.equal(cameraProjection,before.projection);assert.equal(VP,before.VP);
 assert.deepEqual(records.draws.at(-1).m,Array.from(entry.model),'draw transform is applied exactly once');
 const distances=Object.fromEntries([...roomScenes].map(([key,scene])=>[key,scene.trains[0].distance]));updateSimulation(.25);
 for(const [key,scene]of roomScenes)assert.ok(Math.abs(scene.trains[0].distance-distances[key]-.25)<1e-9,'every map train advances once');
 paused=true;const d=roomScenes.get('coast').trains[0].distance;updateSimulation(.25);assert.equal(roomScenes.get('coast').trains[0].distance,d,'pause holds all trains');paused=false;
 shopMapSelect('alpine');const expectedAudioPoint=project(transform([3,2,-4],SHOP_HOUSE_LAYOUT.byKey.alpine.model)),savedAudioGlobals={lead:leadInfo,travel,speed,eye:cameraPos,target:cameraTarget};audio.update(.016);updateHobbyAudio(.016);
 for(const tick of records.audio.slice(-2)){assert.equal(tick.room,'alpine','railway and ambience use the selected room');assert.ok(Math.abs(tick.point.x-expectedAudioPoint.x)<.0001,'both audio layers pan in house coordinates');}
 const railwayTick=records.audio.at(-2),electric=roomScenes.get('alpine').trains[0];
 assert.equal(railwayTick.travel,electric.distance,'procedural wheels use the selected train distance');assert.equal(railwayTick.speed,savedAudioGlobals.speed*electric.speed,'procedural wheels use the selected train speed');
 assert.equal(railwayTick.lastChuff,Math.floor(electric.distance/.45),'electric chuff is suppressed before the original audio tick');
 assert.equal(leadInfo,savedAudioGlobals.lead);assert.equal(travel,savedAudioGlobals.travel);assert.equal(speed,savedAudioGlobals.speed);
 audio.fail=true;assert.throws(()=>audio.update(.016),/audio fixture failed/);audio.fail=false;
 assert.equal(leadInfo,savedAudioGlobals.lead);assert.equal(travel,savedAudioGlobals.travel);assert.equal(speed,savedAudioGlobals.speed);assert.equal(cameraPos,savedAudioGlobals.eye);assert.equal(cameraTarget,savedAudioGlobals.target);assert.equal(shopRoomModel,null,'audio failure cannot leak a room transform');
 assert.equal(hobby.room,'valley','audio leaves current-room globals intact');
})()`);
const yaw=run('shopMap.orbit.yaw');fire('pointerdown');fire('pointermove',{clientX:730});fire('pointerup',{clientX:730});
assert.notEqual(run('shopMap.orbit.yaw'),yaw);assert.equal(run('shopMap.entry'),null,'a drag does not enter a room');
fire('pointerdown');fire('pointercancel');assert.equal(run('shopMap.entry'),null,'cancelled pointer does not enter');
const zoom=run('shopMap.orbit.distance');fire('wheel',{deltaY:80});assert.ok(run('shopMap.orbit.distance')>zoom,'wheel zooms the house');
fire('pointerdown',{pointerId:1,clientX:600});fire('pointerdown',{pointerId:2,clientX:800});
const beforePinch=run('shopMap.orbit.distance');fire('pointermove',{pointerId:2,clientX:900});
assert.ok(run('shopMap.orbit.distance')<beforePinch,'pinching out gets closer');fire('pointerup',{pointerId:2,clientX:900});fire('pointerup',{pointerId:1,clientX:600});
assert.equal(run('shopMap.entry'),null,'pinch release does not enter a room');

run("shopMapEnter('coast')");assert.ok(ui.loading);fire('keydown',{key:'Escape'});
assert.equal(run('shopMap.active'),false);assert.equal(snapshot(),original,'Escape during flight returns to the original railway');
const cachedBuildCount=records.builds.length;await settle(run('openHouseMap()'));assert.equal(records.builds.length,cachedBuildCount,'warm open reuses room scenes');
run("shopMapEnter('alpine');updateCamera(2)");assert.equal(run('shopMap.active'),false);assert.equal(run('hobby.room'),'alpine');
assert.ok(records.normalCameras>0,'entry recomputes the normal projection before the same frame renders');
assert.equal(run('cameraProjection[8]'),0);assert.equal(run('cameraProjection[9]'),0,'entry clears house projection offsets');
const alpineSnapshot=snapshot();await settle(run('openHouseMap()'));
run(`(()=>{const d=roomScenes.get('alpine').trains[0].distance;updateSimulation(.25);assert.ok(Math.abs(roomScenes.get('alpine').trains[0].distance-d-.25)<1e-9,'underlying annex is not simulated twice');})()`);
run('closeHouseMap()');assert.equal(snapshot(),alpineSnapshot,'Back preserves an annex camera');

run("registerHouseRoom('marsh',{name:'The Marsh Gallery',build(){}})");pending=run('openHouseMap()');
assert.ok(ui.loading,'new room starts a yielded load');
run("registerHouseRoom('garden',{name:'The Garden Gallery',build(){}})");await settle(pending);
assert.equal(run('SHOP_HOUSE_LAYOUT.rooms.length'),6,'load loop discovers a room registered during an animation-frame yield');
assert.ok(records.builds.includes('marsh')&&records.builds.includes('garden'),'every new layout room has a cached scene');
assert.ok(ui.roomKeys.includes('garden'),'directory and markers refresh after mid-load registration');
run("shopMapSelect('coast');registerHouseRoom('coast',{build(){}})");
const coastBuilds=records.builds.filter(key=>key==='coast').length;
run('updateSimulation(0)');assert.equal(run('shopMap.active'),false,'invalidated rooms leave active rendering before reload');
await until(()=>run("shopMap.active&&shopMap.selected==='coast'&&shopMap.revision===houseRoomRevision"));
assert.equal(records.builds.filter(key=>key==='coast').length,coastBuilds+1,'a replaced room reloads while the map is open');
assert.equal(run('hobby.room'),'alpine','registry reload retains the underlying current room');assert.equal(ui.selected,'coast','registry reload retains selected preview');
run('closeShopMap()');
run("registerHouseRoom('broken',{name:'The Broken Fixture',build(){}});failRoom='broken'");const beforeFailure=snapshot();await settle(run('openHouseMap()'));
assert.equal(run('shopMap.active'),false);assert.equal(snapshot(),beforeFailure,'failed load preserves current room and camera');assert.equal(ui.visible,false);assert.ok(records.errors.includes('fixture room failed'));
run("delete HOUSE_ROOMS.broken;houseRoomRevision++;failRoom=null");await settle(run('openHouseMap()'));
run("reduceMotion=true;shopMapEnter('coast',true);updateCamera(.02)");assert.equal(run('hobby.cinema'),true);assert.equal(run('hobby.room'),'coast');assert.equal(run('shopMap.active'),false);

console.log('Shop map QA passed: cancelled/failed/warm loading, mid-load registration and active revision reload, camera return and entry projection, scoped drawing/audio and exception cleanup, all-room simulation, pause, pointer drag/pinch/cancel, Escape, and reduced-motion cinema entry.');

run("HOUSE_ROOMS.exhibition={map:{destination:'grandhall.html'}};shopFinishEntry('exhibition',false)");
assert.equal(new URL(navigations.at(-1)).pathname,'/grandhall.html');
assert.equal(new URL(navigations.at(-1)).searchParams.get('from'),run('hobby.room'));
run("HOUSE_ROOMS.exhibition.map.destination='https://elsewhere.test/'");
assert.throws(()=>run("visitHouseDestination('exhibition')"),/must stay on this site/);

// A room-sized invitation is selectable without pretending to be a loaded scene.
ui.openPlot=plot=>{ui.plot=plot;};
run("delete HOUSE_ROOMS.exhibition;registerHouseRoom('museum',{name:'The Museum',railway:false,map:{position:'central',footprint:[600,720],scale:.4},build(){}})");
await settle(run('openHouseMap()'));
const roomBuilds=records.builds.length,activations=records.activations.length;
run(`(()=>{
 assert.equal(SHOP_HOUSE_LAYOUT.plots.length,3);
 const plot=SHOP_HOUSE_LAYOUT.plots[0];
 shopMapSelect(plot.id);assert.equal(shopMap.selected,plot.id);assert.equal(ShopMapUI.selected,plot.id);
 shopMapResetView();updateCamera(2);
 const p=project([plot.center[0],SHOP_HOUSE_LAYOUT.floorY+9,plot.center[2]]);
 assert.equal(shopPick(p.x,p.y),plot.id,'the visible expansion floor is picked at its center');
 shopMapEnter(plot.id);
 assert.equal(ShopMapUI.plot.id,plot.id,'a site opens its own agent prompt');
 assert.equal(shopMap.entry,null,'a site cannot start a room flight');assert.equal(shopMap.active,true);
 assert.equal(HOUSE_ROOMS[plot.id],undefined,'open sites never pollute room discovery');
})()`);
assert.equal(records.builds.length,roomBuilds,'copying a plot prompt builds no scene');assert.equal(records.activations.length,activations,'copying a plot prompt changes no current room');
run('closeShopMap()');
console.log('Future-room map QA passed: projected plot picking, selection, prompt dispatch, no fake room or scene activation.');
