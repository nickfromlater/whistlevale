import assert from 'node:assert/strict';
import vm from 'node:vm';
import {communityContext,read,loadReviewedHallSources} from './community-lib.mjs';

const geometry=await communityContext();geometry.context.assert=assert;
geometry.run(await read('src/grandhall-data.js'));geometry.run(await read('src/grandhall-exhibits.js'));
await loadReviewedHallSources(geometry);
console.log('Reset Engine geometry: '+JSON.stringify(geometry.run(`(()=>{
 const entry=GRAND_HALL_EXHIBITS.find(e=>e.id==='codex-usage-reset'),bay=GRAND_HALL_BAYS.find(b=>b.id===entry.bay);
 assert.equal(entry.bay,'CC-03');assert.equal(GRAND_HALL_EXHIBITS.filter(e=>e.bay===entry.bay).length,1);
 assert.equal(grandHallExhibitCredits(entry)[0].name,'nickfromlater');
 const first=new Builder(),second=new Builder(),before=seed;
 grandHallPlaceExhibit(entry,first,bay);grandHallPlaceExhibit(entry,second,bay);
 assert.deepEqual(first.data,second.data);assert.equal(seed,before);assert.equal(first.stack.length,0);
 let radius=0,low=Infinity,high=-Infinity;
 for(let i=0;i<first.data.length;i+=12){
  assert.ok(first.data.slice(i,i+12).every(Number.isFinite));
  radius=Math.max(radius,Math.hypot(first.data[i]-bay.x,first.data[i+2]-bay.z));
  low=Math.min(low,first.data[i+1]-bay.surfaceY);high=Math.max(high,first.data[i+1]-bay.surfaceY);
 }
 assert.ok(radius<bay.usableRadius-.1,'the complete miniature leaves real circular clearance');
 assert.ok(Math.abs(low)<1e-6);assert.ok(high<bay.maxHeight);
 const vertices=first.data.length/12;assert.ok(vertices<30000);
 const cap=[];for(let i=0;i<first.data.length;i+=12)if(first.data[i+10]===-91)cap.push(i);
 assert.ok(cap.length>1000&&cap.length<vertices/3,'only the cap and its label are tagged for physical travel');
 assert.ok(cap.some(i=>first.data[i+6]>.7&&first.data[i+7]<.3&&first.data[i+8]<.3),'the actual cap is unmistakably red');
 return{bay:entry.bay,vertices,vertexBufferMiB:vertices*48/2**20,radius,height:high};
})()`)));

// Exercise real UI ownership and animation transitions with a deterministic DOM.
let drawingCalls=0;
const drawing=new Proxy({createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||((...args)=>{assert.ok(args.filter(a=>typeof a==='number').every(Number.isFinite));drawingCalls++;})});
function element(tag){return {tag,children:[],style:{setProperty(k,v){this[k]=v;}},attributes:{},hidden:false,textContent:'',append(...nodes){this.children.push(...nodes);},prepend(...nodes){this.children.unshift(...nodes);},setAttribute(k,v){this.attributes[k]=v;},getContext(){return drawing;}};}
const body=element('body'),motion={matches:false};
const context=vm.createContext({document:{body,createElement:element},matchMedia:()=>motion,devicePixelRatio:1});
vm.runInContext(await read('src/grandhall-reset.js'),context);
assert.equal(vm.runInContext('codexResetPhase(-1)',context),'idle');
const ui=vm.runInContext('createHallResetExhibit()',context),panel=element('div');
const entry={id:'codex-usage-reset',scale:.2},bay={x:0,z:0,surfaceY:1,yaw:0};
const frame={dt:.025,project:([x,y,z])=>({x:500+x*60,y:450-y*40+z*15,w:2}),width:1000,height:800,obscured:false};
ui.mount(entry,bay,panel);assert.equal(body.children.length,3);const [canvas,pin,cue]=body.children;
const [button,,live]=panel.children[0].children,label=button.children[0];
ui.frame(frame);assert.equal(pin.hidden,false);assert.equal(label.textContent,'Reset Codex usage');
button.onclick();ui.frame(frame);assert.ok(ui.depression>0&&ui.depression<=.05,'the actual cap travels when pressed');assert.equal(button.attributes['aria-disabled'],'true');assert.equal(label.textContent,'Charging…');
// Repeat input must not restart the sequence, including the in-scene control.
for(let i=0;i<300;i++){if(i<180){button.onclick();pin.onclick();}ui.frame(frame);}
assert.equal(label.textContent,'Reset Codex usage');assert.equal(pin.attributes['aria-disabled'],'false');assert.equal(ui.depression,0);assert.ok(drawingCalls>100);
button.onclick();for(let i=0;i<140;i++)ui.frame(frame);
assert.equal(live.textContent,'Codex usage reset!');assert.match(cue.innerHTML,/Codex usage reset!/);
ui.frame({...frame,obscured:true});assert.equal(pin.hidden,true);assert.equal(canvas.hidden,true);
ui.clear();ui.frame(frame);assert.equal(pin.hidden,true);assert.equal(cue.hidden,true);
ui.mount(entry,bay,panel);assert.equal(body.children.length,3,'returning reuses the owned overlay');
motion.matches=true;const reducedButton=panel.children[0].children[0];reducedButton.onclick();ui.frame(frame);
assert.equal(reducedButton.children[0].textContent,'Codex usage reset!');assert.equal(ui.depression,0,'reduced motion never moves the native cap');
for(let i=0;i<110;i++)ui.frame(frame);assert.equal(reducedButton.children[0].textContent,'Reset Codex usage');
ui.frame({...frame,project:()=>({x:500,y:450,w:-1})});assert.equal(pin.hidden,true,'no click target behind the camera');
ui.mount({id:'another-exhibit'},bay,panel);ui.frame(frame);assert.equal(pin.hidden,true);
console.log('Reset Engine interaction passed: full sequence, repeat-input guard, replay, polite announcement, reduced motion, modal pause, navigation cleanup, bounded drawing, and behind-camera hiding.');

// Context loss stops the Hall frame loop before it can hide projected controls.
// Exercise the real event binding so cleanup cannot depend on another frame.
const hall=await read('grandhall.html'),lostStart=hall.indexOf("c.addEventListener('webglcontextlost',"),lostEnd=hall.indexOf("c.addEventListener('webglcontextrestored',",lostStart);
assert.ok(lostStart>=0&&lostEnd>lostStart);
let lostHandler;Object.assign(context,{c:{addEventListener(name,fn){assert.equal(name,'webglcontextlost');lostHandler=fn;}},resetExhibit:ui,hallGraphicsLost:false,toast(){}});
vm.runInContext(hall.slice(lostStart,lostEnd),context);
motion.matches=false;ui.mount(entry,bay,panel);ui.frame(frame);pin.onclick();ui.frame(frame);assert.ok(ui.depression>0);
lostHandler({preventDefault(){}});
assert.equal(context.hallGraphicsLost,true);assert.equal(ui.depression,0);
for(const node of [canvas,pin,cue])assert.equal(node.hidden,true,'context loss immediately hides every overlay node');
const stoppedCue=cue.innerHTML;pin.onclick();ui.frame(frame);assert.equal(cue.innerHTML,stoppedCue,'a retained button cannot reactivate a lost scene');
console.log('Reset context-loss integration passed: immediate cleanup without another frame and inert retained controls.');
