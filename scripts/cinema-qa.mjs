#!/usr/bin/env node
// Exercise the real cinema lifecycle, camera and captured inputs without a GPU.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const read=file=>readFile(new URL('../'+file,import.meta.url),'utf8');
const [railway,hobby]=await Promise.all(['src/railway.js','src/hobby.js'].map(read));
const events=new Map(),captured=new Set(),nodes=new Map(),classes=new Set();
const listen=(type,fn)=>{if(!events.has(type))events.set(type,[]);events.get(type).push(fn);};
const document={activeElement:null,hidden:false,addEventListener:listen,querySelector:()=>null,body:{classList:{add:(...names)=>names.forEach(n=>classes.add(n)),remove:(...names)=>names.forEach(n=>classes.delete(n))}}};
const node=id=>{if(!nodes.has(id))nodes.set(id,{hidden:true,style:{},setAttribute(){},focus(){document.activeElement=this;}});return nodes.get(id);};
document.getElementById=node;
const canvas={...node('world'),setPointerCapture:id=>captured.add(id),hasPointerCapture:id=>captured.has(id),releasePointerCapture:id=>captured.delete(id)};
const context=vm.createContext({assert,document,canvas,$:node,window:{addEventListener:listen},setTimeout:()=>1,clearTimeout(){},innerWidth:1440,innerHeight:900,screenW:1440,screenH:900});
const run=code=>vm.runInContext(code,context);
run(railway.slice(0,railway.indexOf("const canvas=$('world')"))+`
 let throttle=65,paused=true,viewMode='engine',orbit={target:[2,3,4],distance:47,pitch:.6,yaw:.8},cameraPos=[12,14,28],cameraTarget=[2,3,4],cameraNear=.1,cameraProjection,VP;
 let building=false,hidden=false,reduceMotion=false,roomClock=0,speed=1,leadInfo={p:[0,1,0],f:[0,0,1]},audio={active:true};
 const HOUSE_ROOMS={valley:{layout:'Valley',tag:'A railway'},coast:{layout:'Coast',tag:'The sea'}};
 function start(){}function setView(){}function updateCamera(){}function updateUI(){}function enterBuild(){}function beginManualOrbit(){viewMode='overview';}
 function updateSimulation(dt){if(!paused)leadInfo.p[0]+=dt;roomClock+=dt;}
 function houseTrainAt(train){return {p:[train.distance,1,0],f:[1,0,0]};}
 function inTunnel(){return false;}function naturalH(){return 0;}
 function setThrottle(value){throttle=value;}function togglePause(){paused=!paused;}function enableSound(){throw new Error('Camera gestures must not restart audio');}
 let exportPlayable;
`);
run(hobby);
run('hobby.ready=true;updateUI=function(){};bindCinemaCamera()');
function fire(type,extra={}){
 const e={type,target:canvas,button:0,pointerId:1,clientX:700,clientY:450,deltaY:0,deltaMode:0,preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;},...extra};
 for(const fn of events.get(type)||[]){fn(e);if(e.stopped)break;}return e;
}
const original=run('JSON.stringify({throttle,paused,viewMode,orbit})');
assert.equal(fire('wheel',{deltaY:80}).stopped,undefined,'ordinary camera input is untouched');
run('enterCinema();cinemaCamera(3)');assert.ok(classes.has('cinematic'));assert.equal(run('paused'),false);assert.equal(run('throttle'),28);
fire('pointerdown');fire('pointermove',{clientX:702});fire('pointerup');assert.equal(run('cinemaOrbit.manual'),null,'a tap does not take over the automatic camera');
const eye=run('JSON.stringify(cameraPos)');fire('pointerdown');fire('pointermove',{clientX:760,clientY:470});
assert.ok(!node('cinemaAuto').hidden&&node('cinemaShot').hidden,'one camera slot offers the return to automatic');assert.equal(run('viewMode'),'cinema');assert.equal(run('hobby.cinema'),true);
assert.equal(run('JSON.stringify(cameraPos)'),eye,'taking control starts from the displayed frame');
fire('pointerup');run('cinemaCamera(1)');assert.notEqual(run('JSON.stringify(cameraPos)'),eye,'drag changes the camera');
const yaw=run('cinemaOrbit.manual.yaw'),distance=run('cinemaOrbit.manual.distance');fire('wheel',{deltaY:-80});assert.ok(run('cinemaOrbit.manual.distance')<distance);
assert.equal(fire('wheel',{target:node('musicMix'),deltaY:80}).stopped,undefined,'mixer controls keep their own input');
run('cinemaCamera(2)');const beforeTarget=run('cameraTarget[0]');run('updateSimulation(1);cinemaCamera(2)');assert.ok(run('cameraTarget[0]')>beforeTarget+.99,'manual framing continues to follow the moving train');assert.equal(run('cinemaOrbit.manual.yaw'),yaw,'automatic drift does not take back manual framing');
run('togglePause()');const beforePause=run('JSON.stringify(leadInfo.p)');fire('wheel',{deltaY:80});run('updateSimulation(1);cinemaCamera(1)');assert.equal(run('JSON.stringify(leadInfo.p)'),beforePause,'camera input preserves pause');
fire('pointerdown',{clientX:600});fire('pointerdown',{pointerId:2,clientX:800});
const zoom=run('cinemaOrbit.manual.distance');fire('pointermove',{pointerId:2,clientX:900});assert.ok(run('cinemaOrbit.manual.distance')<zoom,'spreading fingers zooms in');
const pinchYaw=run('cinemaOrbit.manual.yaw');fire('pointerup',{pointerId:2});fire('pointermove',{clientX:610});assert.ok(Math.abs(run('cinemaOrbit.manual.yaw')-pinchYaw+.048)<1e-9,'remaining finger rebases without jumping');fire('pointercancel');assert.equal(captured.size,0);
fire('pointerdown');fire('lostpointercapture');assert.equal(run('cinemaOrbit.pointers.size'),0);
fire('pointerdown');fire('blur');assert.equal(captured.size,0,'blur releases capture');
fire('keydown',{key:'ArrowLeft'});assert.notEqual(run('cinemaOrbit.manual.yaw'),pinchYaw);
node('cinemaAuto').focus();run('resumeCinemaCamera()');assert.equal(run('cinemaOrbit.manual'),null);assert.equal(document.activeElement,node('cinemaShot'),'reset moves focus off the hidden return button');
fire('keydown',{key:'='});fire('keydown',{key:'0'});assert.equal(run('cinemaOrbit.manual'),null,'keyboard can return to automatic');
run('beginCinemaOrbit();leaveCinema(false)');assert.equal(run('JSON.stringify({throttle,paused,viewMode,orbit})'),original,'leaving cinema restores the original controls and camera');
assert.equal(captured.size,0);assert.equal(run('cinemaOrbit.manual'),null);
run(`hobby.room='coast';hobby.scene={height:()=>4,trains:[{distance:8,speed:.7}]};innerWidth=390;screenW=390;screenH=844;reduceMotion=true;enterCinema();cinemaCamera(2);beginCinemaOrbit()`);
for(let i=0;i<40;i++){fire('wheel',{deltaY:i%2?1e8:-1e8});fire('keydown',{key:i%2?'ArrowDown':'ArrowUp'});run('updateSimulation(.016);cinemaCamera(.016)');}
assert.equal(run('[...cameraPos,...cameraTarget,...VP].every(Number.isFinite)'),true,'phone/reduced-motion and extreme zoom produce a finite camera');
assert.ok(run('hobby.scene.trains[0].distance')>8,'annex trains keep advancing');assert.ok(run('cameraPos[1]')>=7.3-1e-4,'camera stays above terrain');
run('leaveCinema(false);enterCinema()');assert.equal(run('cinemaOrbit.manual'),null,'a new cinema visit starts automatically');
run(`leaveCinema(false);HOUSE_ROOMS.commons={layout:'The Commons',tag:'Room to grow',railway:false,target:[0,1,0]};hobby.room='commons';hobby.scene={height:()=>1,trains:[]};paused=true;throttle=51;enterCinema();cinemaCamera(2)`);
assert.equal(run('paused'),true,'landscape cinema preserves the other railways pause state');assert.equal(run('throttle'),51);
assert.equal(run('hobbyHasTrain()'),false);assert.equal(run('[...cameraPos,...cameraTarget,...VP].every(Number.isFinite)'),true);
fire('pointerdown');fire('pointermove',{clientX:760,clientY:470});fire('pointerup');fire('wheel',{deltaY:-30});run('cinemaCamera(1)');
assert.equal(run('hobby.cinema'),true);assert.ok(run('cinemaOrbit.manual'),'landscape cinema accepts manual framing');
fire('keydown',{key:'0'});run('cinemaCamera(1);leaveCinema(false)');assert.equal(run('paused'),true);assert.equal(run('throttle'),51);
console.log('Cinema QA passed: drag, tap threshold, pinch/release, wheel, keyboard, moving train anchor, pause/audio preservation, auto return and focus, capture cleanup, lifecycle restoration and finite phone cameras.');
