#!/usr/bin/env node
// Exercise the real cinema lifecycle, camera and captured inputs without a GPU.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const read=file=>readFile(new URL('../'+file,import.meta.url),'utf8');
const [railway,hobby,rooms]=await Promise.all(['src/railway.js','src/hobby.js','src/rooms.js'].map(read));
const events=new Map(),captured=new Set(),nodes=new Map(),classes=new Set();
const listen=(type,fn)=>{if(!events.has(type))events.set(type,[]);events.get(type).push(fn);};
const document={activeElement:null,hidden:false,addEventListener:listen,querySelector:()=>null,body:{classList:{add:(...names)=>names.forEach(n=>classes.add(n)),remove:(...names)=>names.forEach(n=>classes.delete(n))}}};
const node=id=>{if(!nodes.has(id))nodes.set(id,{hidden:true,style:{},setAttribute(){},focus(){document.activeElement=this;}});return nodes.get(id);};
document.getElementById=node;
const canvas={...node('world'),setPointerCapture:id=>captured.add(id),hasPointerCapture:id=>captured.has(id),releasePointerCapture:id=>captured.delete(id)};
const context=vm.createContext({assert,document,canvas,$:node,window:{addEventListener:listen},setTimeout:()=>1,clearTimeout(){},innerWidth:1440,innerHeight:900,screenW:1440,screenH:900});
const run=code=>vm.runInContext(code,context);
run(railway.slice(0,railway.indexOf("const canvas=$('world')"))+`
 let throttle=65,paused=true,viewMode='engine',orbit={target:[2,3,4],distance:47,pitch:.6,yaw:.8},cameraPos=[12,14,28],cameraTarget=[2,3,4],cameraFar=500,cameraNear=.1,cameraProjection,VP;
 let building=false,hidden=false,reduceMotion=false,roomClock=0,speed=1,leadInfo={p:[0,1,0],f:[0,0,1]},audio={active:true};
 const HOUSE_ROOMS={valley:{layout:'Valley',tag:'A railway'},coast:{layout:'Coast',tag:'The sea'}};
 function start(){}function setView(){}function updateCamera(){}function updateUI(){}function enterBuild(){}function beginManualOrbit(){viewMode='overview';}
 function updateSimulation(dt){if(!paused)leadInfo.p[0]+=dt;roomClock+=dt;}
 function houseTrainAt(train){return {p:[train.distance,1,0],f:[1,0,0]};}
 function inTunnel(){return false;}function naturalH(){return 0;}
 function setThrottle(value){throttle=value;}function togglePause(){paused=!paused;}function enableSound(){throw new Error('Camera gestures must not restart audio');}
 let exportPlayable;
`);
run(railway.match(/function houseCameraFar\(\).*$/m)[0]+'\n'+rooms.match(/function advanceHouseTrain\(.*$/m)[0]);
run(hobby);
run('const I=Object.freeze([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);');
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
fire('keydown',{key:'0'});run("hobby.shot='tail';cinemaCamera(10);beginCinemaOrbit()");
const wideLandscape=run('cinemaOrbit.manual.distance');assert.ok(wideLandscape>180,'phone room view starts beyond the train camera limit');fire('wheel',{deltaY:30});assert.ok(run('cinemaOrbit.manual.distance')>wideLandscape,'zooming out from a wide landscape never jumps inward');assert.ok(run('cinemaOrbit.manual.distance')<=360);
run('cinemaCamera(1);leaveCinema(false)');assert.equal(run('paused'),true);assert.equal(run('throttle'),51);
console.log('Cinema QA passed: drag, tap threshold, pinch/release, wheel, keyboard, moving train anchor, pause/audio preservation, auto return and focus, capture cleanup, lifecycle restoration and finite phone cameras.');
// Guest presets supply original-model anchors; manual house camera input still
// wins, and a guest never changes another railway's throttle or pause state.
run(`let guestPresetCalls=0;function embeddedCinemaView(){guestPresetCalls++;return {target:[8,5,12],position:[20,24,62]};}innerWidth=1440;screenW=1440;screenH=900;enterCinema();cinemaCamera(20);`);
assert.ok(run('len(sub(cameraTarget,[8,5,12]))')<1e-6,'cinema frames the guest model anchor');
assert.ok(run('len(sub(cameraPos,[20,24,62]))')<.001,'cinema uses the guest preset eye');
const presetCalls=run('guestPresetCalls');fire('pointerdown');fire('pointermove',{clientX:780,clientY:430});fire('pointerup');run('cinemaCamera(2)');
assert.equal(run('guestPresetCalls'),presetCalls,'automatic guest presets cannot take back a manual camera');assert.ok(run('cinemaOrbit.manual'));
run('resumeCinemaCamera();cinemaCamera(20);leaveCinema(false)');assert.equal(run('paused'),true);assert.equal(run('throttle'),51);
// Following the guest's own train. A guest room has no house train, so the
// shot is only possible because the adapter publishes the locomotive's pose in
// house coordinates and embeddedCinemaView returns null for that shot.
run(`let guestTrain={p:[30,6,-10],f:[1,0,0]};
 function embeddedTrainInfo(){return guestTrain;}
 function embeddedCinemaView(key){return key==='tail'?null:{target:[8,5,12],position:[20,24,62]};}
 hobby.room='coast';hobby.scene={trains:[],height:()=>0};`);
assert.equal(run('JSON.stringify(hobbyTrainInfo())'),JSON.stringify({p:[30,6,-10],f:[1,0,0]}),'the house reads the guest locomotive as its train');
assert.equal(run('hobbyHasTrain()'),true,'a guest train counts as a train, so the no-train orbit stops firing');
assert.equal(run('hobbyHasNativeTrain()'),false,'a published camera pose is not a native train');
assert.equal(run('hobbyTrainMatrix()===I'),true,'rendering a guest never reads an empty native train list');
assert.doesNotThrow(()=>run('drawHobbyParticles()'),'guest geometry never enters native steam rendering');
const guestControls=run('JSON.stringify({paused,throttle})');
run(`hobby.shot='tail';cameraPos=[0,0,0];cameraTarget=[0,0,0];hobby.heading=[1,0,0];
 hobby.shotBlend={side:0,back:0,height:0};enterCinema();for(let i=0;i<40;i++)cinemaCamera(.1);`);
const near=run('len(sub(cameraTarget,guestTrain.p))');
assert.equal(run('JSON.stringify({paused,throttle})'),guestControls,'following a guest leaves other railways untouched');
assert.ok(near<12,'the following shot looks at the locomotive, not a fixed anchor: '+near.toFixed(2));
run('guestTrain={p:[90,6,-10],f:[1,0,0]};for(let i=0;i<40;i++)cinemaCamera(.1);');
const moved=run('len(sub(cameraTarget,guestTrain.p))');
assert.ok(moved<12,'the shot tracks the locomotive when it moves: '+moved.toFixed(2));
assert.ok(run('cameraPos[0]')>40,'the camera travelled with it');
run('leaveCinema(false);hobby.room="valley";hobby.scene=null;');
run('function embeddedProject(key){return key==="coast"?{cinemaShot:"tail"}:null;}hobby.room="coast";hobby.scene={trains:[],height:()=>0};hobby.shot="wide";enterCinema();');
assert.equal(run('hobby.shot'),'tail','guest cinema opens with its authored close-up');assert.equal(node('cinemaShot').value,'tail');
run('leaveCinema(false)');assert.equal(run('hobby.shot'),'wide','a guest default does not replace the camera selection in other rooms');
run('embeddedCinemaView=()=>({target:[8,1,12],position:[20,2,62],groundHandled:true});enterCinema();cinemaCamera(20);');
assert.ok(Math.abs(run('cameraPos[1]')-2)<.001,'the house floor must not lift a guest camera out of its tunnel clearance');
run('leaveCinema(false)');
console.log('Guest cinema QA passed: model anchors, a followed guest locomotive, house interpolation, manual override, automatic return and original railway controls preserved.');
