// State/input contracts. The separate browser harness supplies rendered evidence.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {read} from './community-lib.mjs';
class Element{
 constructor(id=''){this.id=id;this.hidden=false;this.style={};this.textContent='';this.attributes=new Map();this.listeners=new Map();this.captured=new Set();this.isConnected=true;this.classList={toggle(){},remove(){},add(){}};}
 addEventListener(type,fn){if(!this.listeners.has(type))this.listeners.set(type,[]);this.listeners.get(type).push(fn);}
 dispatch(type,props={}){const e={button:0,pointerId:1,clientX:0,clientY:0,target:this,preventDefault(){},stopImmediatePropagation(){},...props};for(const fn of this.listeners.get(type)||[])fn(e);return e;}
 setAttribute(k,v){this.attributes.set(k,v);}getClientRects(){return this.hidden?[]:[{}];}closest(){return null;}
 focus(){doc.activeElement=this;}hasPointerCapture(id){return this.captured.has(id);}setPointerCapture(id){this.captured.add(id);}releasePointerCapture(id){this.captured.delete(id);}
}
const nodes=new Map(),get=id=>{if(!nodes.has(id))nodes.set(id,new Element(id));return nodes.get(id);};
const doc=new Element('document');doc.body=new Element('body');doc.getElementById=get;doc.activeElement=get('orreryBoard');
const preference=new Element('preference');preference.matches=false;
const context={assert,console,document:doc,window:new Element('window'),canvas:get('world'),$:get,matchMedia:()=>preference,
 hobby:{room:'orrery',scene:null,cinema:false,ready:true},shopMap:{open:false},building:false,viewMode:'overview',reduceMotion:false,quietControls:{panel:null},
 orbit:{target:[1,2,3],distance:55,yaw:.4,pitch:.5},paused:true,throttle:42,speed:2.226,screenW:1440,screenH:1000,cameraPos:[],cameraTarget:[],cameraNear:.1,cameraProjection:null,VP:null,
 setView:mode=>{context.viewMode=mode;},updateCamera(){},updateUI(){},hobbyTrainMatrix(){},initQuietControls(){},closeQuietControls(){},
 openHouseMap:()=>{context.shopMap.open=true;},setThrottle:v=>{context.throttle=v;},togglePause:()=>{context.paused=!context.paused;},
 buildCollectionStock(){},drawHouseTrainFormation(){},otherDistance:0,
 updateSimulation:dt=>{if(!context.paused){for(const train of context.hobby.scene.trains)train.distance+=dt*train.speed*context.speed;context.otherDistance+=dt*context.speed;}}
};
vm.createContext(context);const run=s=>vm.runInContext(s,context,{timeout:10000});
const railway=await read('src/railway.js');run(railway.slice(0,railway.indexOf("const canvas=$('world')")));
run(await read('src/rooms/orrery-track.js'));run(await read('src/trains/orrery.js'));
run(`hobby.scene={trains:[{edge:ORRERY_ROUTE,distance:123,speed:.7,stock:'orrery',cars:4}]};`);
run(await read('src/orrery-ride.js'));
run(`
 const train=hobby.scene.trains[0],initial=JSON.stringify(orbit);
 orreryBoardFromStation();assert.equal(orreryRide.trip.state,'boarding');assert.equal(train.speed,0);assert.equal(paused,true);assert.equal(throttle,42);
 assert.equal(train.edge.motionAt(train.distance).restraint,1,'gates and restraints are open while waiting');
 const boardingPosition=train.distance;paused=false;updateSimulation(10);assert.equal(train.distance,boardingPosition,'waiting only holds Comet');assert.ok(otherDistance>0);
 orreryDispatch();assert.equal(orreryRide.trip.state,'riding');assert.equal(train.speed,.7);assert.equal(paused,false);
 assert.equal(train.edge.motionAt(train.distance).velocity,0,'dispatch starts with a stationary closing phase');
 const dispatchPosition=train.distance;updateSimulation(.1);assert.ok(train.distance>dispatchPosition);const progressed=train.distance;orreryDispatch();assert.equal(train.distance,progressed,'double dispatch does not restart');
 paused=true;updateSimulation(5);assert.equal(train.distance,progressed,'native pause still holds');paused=false;
 let steps=0;while(orreryRide.trip.state==='riding'&&steps++<220)updateSimulation(1);
 assert.equal(orreryRide.trip.state,'arrived');assert.equal(train.speed,0);assert.equal(train.distance,orreryRide.trip.finish,'arrival cannot overshoot');
 assert.equal(orreryTripProgress(),1);assert.equal(train.edge.motionAt(train.distance).restraint,1);assert.equal(paused,false,'arrival never pauses other rooms');
 assert.ok($('orreryArrival').textContent.includes('complete circuit'));const arrivalPosition=train.distance;updateSimulation(2);assert.equal(train.distance,arrivalPosition);
 updateUI();assert.equal($('orreryDispatch').textContent,'Ride again');assert.equal($('orreryDispatch').hidden,false);
 orreryDispatch();assert.equal(orreryRide.trip.state,'riding');assert.equal(orreryTripProgress(),0);orreryLeaveSeat();
 assert.equal(train.speed,.7);assert.equal(orreryRide.trip,null);assert.equal(viewMode,'overview');assert.equal(JSON.stringify(orbit),initial);
 assert.equal(document.activeElement.id,'orreryBoard');
 paused=true;setView('cab');assert.equal(orreryRide.trip,null,'generic cab joins the current train, not a new full trip');assert.equal(train.speed,.7);orreryLeaveSeat();
 orreryBoardFromStation();setView('follow');assert.equal(train.speed,.7);assert.equal(orreryRide.trip,null);
 orreryBoardFromStation();viewMode='room';updateCamera(.1);assert.equal(train.speed,.7);assert.equal(orreryRide.trip,null,'direct viewpoint cleanup');
 orreryBoardFromStation();openHouseMap();assert.equal(train.speed,.7);assert.equal(orreryRide.trip,null);shopMap.open=false;
 orreryBoardFromStation();hobby.cinema=true;updateSimulation(.1);assert.equal(train.speed,.7);assert.equal(orreryRide.trip,null);hobby.cinema=false;
 orreryBoardFromStation();hobby.room='coast';hobby.scene={trains:[{speed:.5,distance:1,stock:'coast'}]};updateCamera(.1);assert.equal(train.speed,.7);assert.equal(hobby.scene.trains[0].speed,.5,'leaving restores the old train, not the new room');
 hobby.room='orrery';hobby.scene={trains:[train]};setView('overview');orreryBoardFromStation();
`);
const canvas=context.canvas;
for(const [id,x]of [[1,100],[2,200],[3,240]])canvas.dispatch('pointerdown',{pointerId:id,clientX:x,clientY:200});
run(`assert.equal(orreryRide.pointers.size,2,'ignore extra fingers');`);
canvas.dispatch('pointermove',{pointerId:3,clientX:290,clientY:230});run('assert.equal(orreryRide.yaw,0);');
canvas.dispatch('pointermove',{pointerId:2,clientX:260,clientY:200});run('assert.ok(orreryRide.zoom<1);');
context.window.dispatch('blur');run('assert.equal(orreryRide.pointers.size,0);');assert.equal(canvas.captured.size,0);
preference.dispatch('change',{matches:true});run('assert.equal(orreryRide.moving,false);');
preference.dispatch('change',{matches:false});run('assert.equal(orreryRide.moving,false,"OS change must not opt the user into inversion");');
run(`orreryDispatch();updateCamera(.1);const fixed=cameraPos.slice();updateSimulation(5);updateCamera(.1);assert.deepEqual(cameraPos,fixed,'steady overlook stays fixed while riding');`);
context.window.dispatch('keydown',{key:'Escape',target:canvas});run('assert.equal(orreryRide.trip,null);assert.equal(train.speed,.7);');
run(`paused=true;throttle=0;orreryBoardFromStation();orreryDispatch();assert.equal(throttle,42);assert.equal(paused,false);orreryLeaveSeat();`);
const listeners=[...canvas.listeners.values()].reduce((n,v)=>n+v.length,0);
run(`for(let i=0;i<50;i++){orreryBoardFromStation();orreryDispatch();orreryLeaveSeat();}assert.equal(orreryRide.trip,null);assert.equal(train.speed,.7);`);
assert.equal([...canvas.listeners.values()].reduce((n,v)=>n+v.length,0),listeners);
console.log('Orrery trip QA passed: waiting, dispatch interlock, one full lap, arrival, replay, pause, focus, cancel/map/room/cinema, two-pointer input, reduced motion and stable listeners.');
