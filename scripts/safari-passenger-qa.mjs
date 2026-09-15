import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {communityContext,loadCommunity,loadContributionDefinitions,prepareCommunityGeometry} from './community-lib.mjs';
const state=await communityContext();state.context.assert=assert;
await loadContributionDefinitions(state,await loadCommunity());prepareCommunityGeometry(state);
const geometry=state.run(`(()=>{
 const train={edge:SAFARI_ROUTE,distance:0,cars:3};let samples=0;
 for(const d of[0,.001,43,79,139,191,SAFARI_ROUTE.length-.001])for(const side of[-1,1]){
  train.distance=d;const m=safariCarMatrix(train,1),pose=safariPassengerPose(train,side);
  const eye=[side*.08,1.53,.30];assert.ok(len(sub(pose.position,transform(eye,m)))<1e-12,'eye follows the actual second carriage');
  assert.equal(pose.car,1);assert.ok(Math.abs(len(sub(pose.target,pose.position))-24)<2e-6,'far focal target through the shared Float32 carriage matrix');
  const right=norm(sub(transform([side,0,0],m),transform([0,0,0],m)));
  assert.ok(dot(norm(sub(pose.target,pose.position)),right)>.97,'looks out the selected side');samples++;
 }
 train.distance=0;const start=safariPassengerPose(train);train.distance=SAFARI_ROUTE.length;const end=safariPassengerPose(train);
 assert.ok(len(sub(start.position,end.position))<1e-8,'camera is continuous at the circuit seam');
 const body=new Builder(),roof=new Builder();safariCarHull(body);safariCarHull(roof,true);
 const clear=b=>b.data.filter((_,i)=>i%12===9&&b.data[i]===76).length;
 assert.equal(clear(body),288,'six rounded transparent side windows');
 assert.equal(clear(roof),48,'two four-strip transparent skylights');
 for(const side of[-1,1]){
  const aperture=new Builder();safariWindow(aperture,side,-.51,.65);
  // A center-window ray crosses actual transparent triangles, not an opaque
  // decorative material. The model's sill and roof are outside eye height.
  assert.ok(aperture.data.some((m,i)=>i%12===9&&m===76));
  for(let i=0;i<aperture.data.length;i+=12)assert.ok(Number.isFinite(aperture.data[i]));
 }
 return {poseSamples:samples,bodyGlazingVertices:clear(body),roofGlazingVertices:clear(roof)};
})()`);
// Isolated lifecycle/input contract. No browser imitation is used as visual
// evidence; the separate native review exercises the real app and DOM.
class Element{
 constructor(id=''){this.id=id;this.hidden=false;this.attributes=new Map();this.listeners=new Map();this.captured=new Set();this.isConnected=true;this.classList={toggle(){},remove(){},add(){}};}
 addEventListener(type,fn){if(!this.listeners.has(type))this.listeners.set(type,[]);this.listeners.get(type).push(fn);}
 dispatch(type,properties={}){const e={button:0,pointerId:1,clientX:0,clientY:0,target:this,preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;},...properties};for(const f of this.listeners.get(type)||[])f(e);return e;}
 setAttribute(k,v){this.attributes.set(k,v);}getClientRects(){return this.hidden?[]:[{}];}closest(){return null;}
 focus(){doc.activeElement=this;}hasPointerCapture(id){return this.captured.has(id);}setPointerCapture(id){this.captured.add(id);}releasePointerCapture(id){this.captured.delete(id);}
}
const elements=new Map(),get=id=>{if(!elements.has(id))elements.set(id,new Element(id));return elements.get(id);};
const doc=new Element('document');doc.body=new Element('body');doc.activeElement=get('viewsBtn');doc.querySelectorAll=()=>[get('safariBoard'),get('windowButton')];
const context={matchMedia:()=>({matches:false}),document:doc,window:new Element('window'),canvas:get('canvas'),$:get,console,Math,Map,Set,assert,
 hobby:{room:'safari',scene:{trains:[{stock:'safari'}]},ready:true,cinema:false,spot:-1},shopMap:{open:false},building:false,viewMode:'overview',paused:true,throttle:42,cutaway:true,reduceMotion:false,quietControls:{panel:null},
 orbit:{target:[1,2,3],distance:55,yaw:.4,pitch:.5},screenW:1280,screenH:900,cameraPos:[],cameraTarget:[],cameraProjection:null,cameraNear:.1,VP:null,
 clamp:(x,a=0,b=1)=>Math.min(b,Math.max(a,x)),mix:(a,b,t)=>a+(b-a)*t,
 safariPassengerPose:()=>({position:[1,2,3],target:[25,2,3]}),perspective:(...a)=>a,mm:(a,b)=>[a,b],lookAt:(a,b)=>[a,b],
 setView:null,updateCamera:()=>{},updateUI:()=>{},openHouseMap:null,closeQuietControls:()=>{},
};
context.setView=mode=>{context.viewMode=mode;};context.openHouseMap=()=>{context.shopMap.open=true;};
vm.createContext(context);const run=s=>vm.runInContext(s,context,{timeout:1000});
run(await readFile(new URL('../src/safari-ride.js',import.meta.url),'utf8'));
run(`setView('window-right');assert.ok(safariPassengerActive());assert.equal(paused,true);assert.equal(throttle,42);assert.equal(cutaway,true);updateCamera(.1);assert.equal(cameraNear,.018);`);
const canvas=context.canvas;canvas.dispatch('pointerdown',{clientX:120,clientY:200});canvas.dispatch('pointermove',{clientX:220,clientY:250});run(`assert.ok(safariRide.yaw<.17);assert.ok(safariRide.pitch>-.035);`);canvas.dispatch('pointercancel');
run(`assert.equal(safariRide.pointers.size,0);assert.equal(safariRide.pinch,null);`);
canvas.dispatch('pointerdown',{pointerId:1,clientX:120,clientY:200});canvas.dispatch('pointerdown',{pointerId:2,clientX:200,clientY:200});canvas.dispatch('pointermove',{pointerId:2,clientX:260,clientY:200});
run(`assert.ok(safariRide.zoom<1);`);context.window.dispatch('blur');run(`assert.equal(safariRide.pointers.size,0);`);
run(`safariResetLook();setView('window-left');updateUI();assert.equal($('safariWindowView').attributes.get('aria-pressed'),'true');assert.equal(safariRide.side,-1);safariRideMotion.matches=true;safariRide.yaw=.45;updateCamera(.001);assert.equal(safariRide.lookYaw,.45);safariRideMotion.matches=false;safariResetLook();`);
context.window.dispatch('keydown',{key:'ArrowLeft',target:canvas});run(`assert.ok(safariRide.yaw<.17);`);
context.window.dispatch('keydown',{key:'Home',target:canvas});run(`assert.equal(safariRide.yaw,.17);`);
context.window.dispatch('keydown',{key:'Escape',target:canvas});run(`assert.equal(viewMode,'overview');assert.ok(!safariRide.mounted);assert.equal(orbit.distance,55);`);
run(`setView('window-right');openHouseMap();assert.ok(!safariPassengerActive());assert.equal(safariRide.pointers.size,0);shopMap.open=false;hobby.room='commons';setView('window-right');assert.equal(viewMode,'overview');updateUI();assert.equal($('safariBoard').hidden,true);`);
run(`hobby.room='safari';setView('window-right');hobby.cinema=true;viewMode='cinema';updateCamera(.1);assert.ok(!safariRide.mounted);assert.equal(safariRide.pointers.size,0);hobby.cinema=false;`);
const listenerCount=[...canvas.listeners.values()].reduce((n,a)=>n+a.length,0);
run(`for(let i=0;i<50;i++){setView('window-left');setView('follow');}assert.equal(paused,true);assert.equal(throttle,42);assert.equal(cutaway,true);`);
assert.equal([...canvas.listeners.values()].reduce((n,a)=>n+a.length,0),listenerCount);
console.log(JSON.stringify({...geometry,inputLifecycle:true,listenersStableAcrossEntries:true},null,2));

const renderer=await readFile(new URL('../src/railway.js',import.meta.url),'utf8');
assert.ok(renderer.includes('if(m==86.||m==89.)n=normalize(cross(dFdx(vPos),dFdy(vPos)));'),'sharp rock and concrete use their geometric surface normal');
