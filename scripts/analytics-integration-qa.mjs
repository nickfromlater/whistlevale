#!/usr/bin/env node
// Execute the actual navigation adapters with the analytics core; GPU/UI output
// is stubbed. Native input dispatch and rendering remain browser-review checks.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const read=file=>readFile(new URL('../'+file,import.meta.url),'utf8');
const [analytics,hobby,map,hall,controls,cabinet,railway]=await Promise.all(['src/analytics.js','src/hobby.js','src/shop-map.js','grandhall.html','src/controls.js','src/train-cabinet.js','src/railway.js'].map(read));
const noop=()=>{},plain=value=>JSON.parse(JSON.stringify(value));
function body(source,start,open=source.indexOf('{',start)){
 let depth=0,quote='',line=false,block=false;
 for(let i=open;i<source.length;i++){
  const c=source[i],next=source[i+1];
  if(line){if(c==='\n')line=false;continue;}
  if(block){if(c==='*'&&next==='/'){block=false;i++;}continue;}
  if(quote){if(c==='\\'){i++;continue;}if(c===quote)quote='';continue;}
  if(c==='/'&&next==='/'){line=true;i++;continue;}if(c==='/'&&next==='*'){block=true;i++;continue;}
  if(c==='"'||c==="'"||c==='`'){quote=c;continue;}
  if(c==='{')depth++;else if(c==='}'&&--depth===0)return source.slice(start,i+1);
 }
 throw Error('Unclosed source block');
}
function declaration(source,name){
 let start=source.lastIndexOf('function '+name+'(');assert.ok(start>=0,'Missing real adapter '+name);
 if(source.slice(start-6,start)==='async ')start-=6;
 let depth=0;
 for(let i=source.indexOf('(',start);i<source.length;i++){
  if(source[i]==='(')depth++;else if(source[i]===')'&&--depth===0)return body(source,start,source.indexOf('{',i+1));
 }
 throw Error('Unclosed parameters: '+name);
}
function fixture({search='',tracking=true}={}){
 const nodes=new Map(),events=[],calls=[],errors=[],timers=new Map(),frames=[],microtasks=[],listeners=new Map();let timer=0;
 const listen=(type,fn)=>{if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn);};
 const node=id=>{
  if(!nodes.has(id)){
   const classes=new Set();nodes.set(id,{id,hidden:true,style:{},dataset:{},value:'',onclick:noop,textContent:'',
    classList:{add:(...names)=>names.forEach(n=>classes.add(n)),remove:(...names)=>names.forEach(n=>classes.delete(n)),contains:n=>classes.has(n),toggle:(n,on)=>on?classes.add(n):classes.delete(n)},
    focus:noop,setAttribute:noop,removeAttribute:noop,showModal:noop,close:noop,querySelector:()=>null,querySelectorAll:()=>[],addEventListener:listen});
  }
  return nodes.get(id);
 };
 const document={visibilityState:'visible',activeElement:null,body:node('body'),addEventListener:listen,querySelectorAll:()=>[],querySelector:()=>null,createElement:()=>({dataset:{}}),head:{append:noop}};
 const context=vm.createContext({document,$:node,location:new URL('https://whistlevale.com/index.html'+search),URL,URLSearchParams,navigator:{clipboard:{writeText:async()=>{}}},performance:{now:()=>0},Date:{now:()=>0},
  console:{error:error=>errors.push(error.message),warn:noop},addEventListener:listen,queueMicrotask:fn=>microtasks.push(fn),
  setTimeout:(fn,ms)=>{timers.set(++timer,{fn,ms});return timer;},clearTimeout:id=>timers.delete(id),requestAnimationFrame:fn=>frames.push(fn),
  sessionStorage:{setItem:noop},history:{replaceState:noop},toast:noop});
 context.window=context;
 const run=code=>vm.runInContext(code,context);
 if(tracking){
  context.va=(command,data)=>{if(command==='event')events.push(plain(data));};run(analytics);
  const core=context.railwayAnalytics;context.railwayAnalytics=Object.fromEntries(Object.entries(core).map(([name,fn])=>[name,(...args)=>{calls.push([name,...plain(args)]);return fn(...args);} ]));
 }
 const flush=()=>{while(microtasks.length)microtasks.shift()();};
 const settle=async()=>{
  for(let i=0;i<8;i++){
   flush();for(const [id,task]of [...timers])if(task.ms<1000){timers.delete(id);task.fn();}
   const pending=frames.splice(0);for(const fn of pending)fn();await Promise.resolve();
  }
  flush();assert.deepEqual(errors,[],'adapter lifecycle has no swallowed app errors');
 };
 return{context,run,node,events,calls,errors,frames,listeners,flush,settle,of:name=>events.filter(event=>event.name===name)};
}
function houseFixture(options={}){
 const f=fixture(options),{run}=f;
 run(hobby.match(/^const hobby=.*;$/m)[0]);run(map.match(/^const shopMap=.*;$/m)[0]);
 run(`
  const HOUSE_ROOMS=Object.fromEntries(['valley','coast','grandhall'].map(id=>[id,{name:'The '+id,number:id,target:[0,0,0]}]));
  const roomScenes=new Map(['coast','grandhall'].map(id=>[id,{trains:[],spots:[]} ]));
  let building=false,shadowDirty=false,hidden=false,viewMode='room',orbit={target:[0,0,0],yaw:0,pitch:0,distance:20},cameraTarget=[0,0,0],cameraPos=[0,0,20],lightVP=[],lensAmount=0,shopLightCache,shopHouseBuilt=true,houseRoomRevision=0;
  let paused=false,throttle=42;const reduceMotion=true,sunDir=[1,1,1],shopBase={camera(){}},SHOP_HOUSE_LAYOUT={width:100,depth:100,mapEntry:{target:[0,0,0]}};
  const canvas={style:{}},ShopMapUI={setLoading(){},hide(){},show(){},refresh(){}};
  const noop=()=>{};const createHobbyUI= noop,initHouseArt=noop,initWalkingFigures=noop,initHouseMap=noop,updateUI=noop,syncRoomControls=noop,renderRoomPlaces=noop,houseOrbit=noop;
  const baseHobbyStart=()=>{window.READY=true;},buildValleyLife=()=>({actors:[],population:0}),baseHobbyBuild=noop;
  const getHouseScene=key=>roomScenes.get(key),setView=()=>{},focusHouseWork=()=>false;
  const leaveCinema=()=>{hobby.cinema=false;},enterCinema=()=>{hobby.cinema=true;syncHouseAnalytics();};
  const add=(a,b)=>a.map((v,i)=>v+b[i]),mul=(a,n)=>a.map(v=>v*n),mm=()=>[],ortho=()=>[],lookAt=()=>[];
  const buildShopHouse=noop,shopOverview=()=>({target:[0,0,0]}),shopCameraPosition=()=>[0,50,50],shopProjection=noop,shopMapSelect=key=>{shopMap.selected=key;};
 `);
 for(const name of ['syncHouseAnalytics','startHouse','houseInitialParams','restoreHouseLocation','visitHouseDestination','visitHouseRoom','activateHouseRoom'])run(declaration(hobby,name));
 for(const name of ['shopRestore','closeShopMap','closeHouseMap','openHouseMap','shopFinishEntry'])run(declaration(map,name));
 return f;
}

// The real startup/restore/transition chain must not emit the default valley
// before a deep link resolves, including room-plus-map links returned by Hall.
for(const tracking of [true,false])for(const [search,expected]of [['','valley'],['?room=coast','coast'],['?map=grandhall',null],['?room=coast&map=grandhall',null]]){
 const f=houseFixture({search,tracking});f.run('startHouse()');f.flush();
 if(search.startsWith('?room=coast'))assert.equal(f.events.length,0,'pending deep-link transition has no visible default room');
 await f.settle();
 assert.equal(f.run('hobby.ready'),true);assert.equal(f.run('hobby.transition'),false);
 if(tracking){
  assert.deepEqual(f.of('room_visit').map(event=>event.data.room),expected?[expected]:[],'startup counts only the displayed room');
  if(!expected)assert.deepEqual(f.of('control_used').map(event=>event.data),[{control:'room_map',room:'map'}]);
 }else assert.equal(f.events.length,0,'startup and map entry work without a tracker');
}
{
 const f=houseFixture({search:'?map=coast'});f.run('startHouse()');await f.settle();
 f.run("shopFinishEntry('coast',false)");f.flush();
 assert.deepEqual(f.of('room_visit').map(event=>event.data.room),['coast'],'map close and room activation coalesce without a phantom valley visit');
 f.run('hobby.cinema=true;syncHouseAnalytics();hobby.transition=true;syncHouseAnalytics()');f.flush();
 assert.equal(f.of('cinema_start').length,0,'a transition suppresses the pending cinema snapshot');
 f.run("hobby.room='private room';hobby.transition=false;syncHouseAnalytics()");f.flush();
 assert.equal(f.calls.at(-1)[1].room,null,'the house adapter rejects unregistered room names');
}

function hallFixture(options={}){
 const f=fixture(options),{run}=f;
 run(hall.match(/^let hallResidency=null,.*;$/m)[0]);run(hall.match(/^let hallGraphicsLost=.*;$/m)[0]);
 run(`const state={room:0,tour:false},GL={},resident=new Set([0,1,2]);hallResidency={has:id=>resident.has(id)};
  let modalOpener=null,currentTab='estate';const frame=()=>{},stopTour=()=>{state.tour=false;},syncModalAccessibility=()=>{},renderDirectory=()=>{},switchMapTab=()=>{};`);
 for(const name of ['syncHallAnalytics','hallAnalyticsControl','beginHallFrames','closeAnyModal','openMap','closeMap','copyAgentPrompt'])run(declaration(hall,name));
 return f;
}
for(const tracking of [true,false]){
 const f=hallFixture({tracking});f.run("syncHallAnalytics();hallAnalyticsControl('hall_bay');openMap()");f.flush();
 assert.equal(f.events.length,0,'Hall fallback/map UI before the first frame produces no engagement');
 f.run('closeMap();beginHallFrames()');f.flush();assert.equal(f.frames.length,1);
 f.run('beginHallFrames()');f.flush();assert.equal(f.frames.length,1,'analytics cannot start a second renderer');
 if(tracking)assert.deepEqual(f.of('room_visit').map(event=>event.data.room),['grandhall']);
 f.run('openMap()');f.flush();assert.equal(f.node('mapBackdrop').classList.contains('open'),true);
 if(tracking)assert.deepEqual(f.of('control_used').at(-1).data,{control:'hall_map',room:'map'});
 f.run('closeMap();state.room=1;syncHallAnalytics()');f.flush();
 if(tracking)assert.deepEqual(f.of('control_used').at(-1).data,{control:'hall_gallery',room:'grandhall'});
 const before=f.calls.filter(call=>call[0]==='control'&&call[1]==='hall_gallery').length;
 f.run('state.tour=true;state.room=2;syncHallAnalytics()');f.flush();
 assert.equal(f.calls.filter(call=>call[0]==='control'&&call[1]==='hall_gallery').length,before,'automatic gallery tour changes are not manual controls');
 f.node('agentPrompt').value='Private title and author, https://example.com/private';
 await f.run('copyAgentPrompt()');f.flush();assert.equal(f.node('copyAgentPrompt').textContent,'On your clipboard');
 if(tracking)assert.deepEqual(f.of('control_used').at(-1).data,{control:'contribute_prompt',room:'grandhall'});
 const count=f.events.length;f.run("resident.clear();syncHallAnalytics();hallAnalyticsControl('hall_bay')");f.flush();assert.equal(f.events.length,count,'unloaded gallery controls are gated');
 f.run('resident.add(state.room);syncHallAnalytics()');f.flush();
 const start=hall.indexOf("c.addEventListener('webglcontextlost',e=>{");assert.ok(start>=0);
 f.context.c={addEventListener:(_type,fn)=>{f.context.contextLost=fn;}};f.run(body(hall,start)+');');
 f.run('contextLost({preventDefault(){}})');f.flush();const afterLoss=f.events.length;
 f.run("hallAnalyticsControl('hall_bay')");f.flush();assert.equal(f.events.length,afterLoss,'real context-loss callback disables Hall engagement');
 assert.equal(f.run('hallGraphicsLost'),true);
 if(tracking)assert.ok(f.calls.filter(call=>call[0]==='sync').every(call=>call[1].room==='grandhall'&&call[1].cinema===false),'gallery IDs and titles never become room dimensions');
}
{
 const f=hallFixture();f.context.railwayAnalytics={sync(){throw Error('blocked');},control(){throw Error('blocked');}};
 assert.doesNotThrow(()=>f.run("beginHallFrames();syncHallAnalytics();hallAnalyticsControl('hall_bay');openMap();closeMap()"));
 await assert.doesNotReject(()=>f.run('copyAgentPrompt()'));
}

// Execute actual finite UI hooks, including the existing keyboard action before
// its analytics call. Optional telemetry must not replace any app action.
for(const tracking of [true,false]){
 const f=houseFixture({tracking});f.run('startHouse()');await f.settle();
 f.run(controls.match(/^const quietControls=.*;$/m)[0]);f.run(controls.match(/^const quietPrimaryPanels=.*;$/m)[0]);
 f.run('const wakeCinema=()=>{},drawMap=()=>{},playlistPaint=()=>{},paintBuilders=()=>{};');
 for(const name of ['closeQuietControls','openQuietPanel'])f.run(declaration(controls,name));
 f.run("openQuietPanel('viewsPanel',$('viewsBtn'))");f.flush();assert.equal(f.node('viewsPanel').hidden,false);
 if(tracking)assert.deepEqual(f.of('control_used').at(-1).data,{control:'panel_views',room:'valley'});
 f.run(cabinet.match(/^const trainCabinet=.*;$/m)[0]);
 f.run(`const hobbyHasTrain=()=>true,collectionChoice=()=>({id:'private-train',livery:0}),cabinetIcon=()=>'',paintCabinetCards=()=>{},paintCabinetDetails=()=>{},prepareCabinetPreview=()=>{};`);
 f.run(declaration(cabinet,'openTrainCabinet'));f.run('openTrainCabinet()');f.flush();assert.equal(f.run('trainCabinet.open'),true);
 if(tracking)assert.deepEqual(f.of('control_used').at(-1).data,{control:'train_collection',room:'valley'});
 const start=railway.indexOf("document.addEventListener('keydown',e=>{");assert.ok(start>=0);f.run(body(railway,start)+');');
 f.run('const togglePause=()=>{paused=!paused;},whistle=()=>{},switchRoute=()=>{},toggleStop=()=>{},toggleLight=()=>{},hideUI=()=>{},capturePhoto=()=>{},toggleDiagram=()=>{};');
 const keydown=f.listeners.get('keydown').at(-1),event={key:' ',target:{closest:()=>null,matches:()=>false},preventDefault:noop};
 keydown(event);f.flush();assert.equal(f.run('paused'),true,'keyboard pause still runs');
 if(tracking)assert.deepEqual(f.of('control_used').at(-1).data,{control:'pause',room:'valley'});
 keydown({...event,target:{closest:()=>null,matches:()=>true}});f.flush();assert.equal(f.run('paused'),true,'typing does not activate app shortcuts or analytics');
 assert.deepEqual(f.errors,[]);
}
console.log('Analytics integration QA passed: actual house startup/deep links/map entry, Hall readiness/gallery/map/context loss/copy, finite panel/cabinet/keyboard hooks, and missing-tracker safety.');
