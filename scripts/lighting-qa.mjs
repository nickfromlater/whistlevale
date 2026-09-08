#!/usr/bin/env node
// Exercise the actual lighting/persistence helpers with a controllable local
// clock. No renderer, geometry or browser harness is needed for this contract.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';

const source=await readFile(new URL('../src/railway.js',import.meta.url),'utf8');
const block=source.slice(source.indexOf('const LIGHT_MOODS='),source.indexOf('function workshopUpdateUI()'));
assert.ok(block.includes('function restoreLightingPrefs('),'lighting helpers can be loaded independently');
const singleLine=name=>{
 const start=source.indexOf('function '+name+'(');assert.ok(start>=0,'Missing '+name);
 return source.slice(start,source.indexOf('\n',start));
};
let hour=12,timerSerial=0,saved=null,storageFailure=false;
const timers=new Map(),listeners=new Map();
const node=()=>({attributes:{},textContent:'',value:'',title:'',style:{values:{},setProperty(key,value){this.values[key]=value;}},setAttribute(key,value){this.attributes[key]=value;}});
const nodes=new Map(['lightBtn','roomDimmer','lampValue','throttle','throttleValue'].map(key=>[key,node()]));
const lightText=node(),lightIcon=node();nodes.get('lightBtn').querySelector=selector=>selector==='span'?lightText:lightIcon;
const buttons=['auto','day','evening','night'].map(mood=>Object.assign(node(),{dataset:{mood}}));
const document={hidden:false,querySelectorAll:()=>buttons,addEventListener(type,fn){
 if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn);
}};
class LocalDate extends Date{getHours(){return hour;}getUTCHours(){throw new Error('Lighting must use local time, not UTC.');}}
const context=vm.createContext({Date:LocalDate,document,$:key=>nodes.get(key),
 setTimeout(fn,delay){assert.equal(delay,60000,'automatic clock checks once per minute');const id=++timerSerial;timers.set(id,fn);return id;},
 clearTimeout:id=>timers.delete(id),localStorage:{setItem(key,value){if(storageFailure)throw new Error('Storage unavailable');assert.equal(key,'alder-valley-grand-prefs-v1');saved=JSON.parse(value);}}
});
const run=code=>vm.runInContext(code,context);
run(`function clamp(v,a=0,b=1){return Math.max(a,Math.min(b,v));}
 let night=.62,targetNight=.62,roomLampTarget=1,roomLampLevel=1,throttle=42,chosenRoute='highline';
 const hobby={cinema:false,saved:null};
 ${singleLine('savePrefs')}
 ${singleLine('setThrottle')}
 ${block}`);
const state=()=>JSON.parse(run('JSON.stringify({lightingMode,night,targetNight,roomLampTarget,roomLampLevel})'));
const restore=value=>{context.savedFixture=value;run('restoreLightingPrefs(savedFixture)');};
const preset=()=>run('lightingMoodForNight(targetNight)');
const tick=()=>{assert.equal(timers.size,1);const [id,fn]=timers.entries().next().value;timers.delete(id);fn();};
const visibility=hidden=>{document.hidden=hidden;for(const fn of listeners.get('visibilitychange')||[])fn();};

// A fresh visit uses the viewer's current local hour, with exact boundary hours.
for(const [h,expected]of[[0,'night'],[6,'night'],[7,'day'],[12,'day'],[18,'day'],[19,'night'],[23,'night']]){
 hour=h;restore(null);assert.equal(preset(),expected,'fresh visit at '+h);
 assert.equal(state().lightingMode,'auto');assert.equal(state().night,state().targetNight,'startup applies lighting immediately');
 assert.equal(state().roomLampLevel,expected==='day'?.40:.38,'existing preset brightness is unchanged');
}
assert.equal(buttons.find(b=>b.dataset.mood==='auto').attributes['aria-pressed'],'true');
assert.equal(buttons.find(b=>b.dataset.mood==='night').attributes['aria-pressed'],'false','automatic choice is distinct from a manual night preset');
assert.match(nodes.get('lightBtn').attributes['aria-label'],/matching local time/);
assert.equal(lightText.textContent,'Night run');
assert.equal(listeners.get('visibilitychange').length,1,'one tab-return listener across restores');
assert.equal(timers.size,1,'one pending clock check across restores');

// Test actual local Date conversion in multiple process timezones, independently
// of the fake clock. Both processes see the same instant and different local moods.
for(const [zone,expected]of[['America/New_York','night'],['Asia/Tokyo','day']]){
 const output=execFileSync(process.execPath,['-e',`${singleLine('localLightingMood')} console.log(localLightingMood(new Date('2026-09-09T02:00:00Z')));`],{encoding:'utf8',env:{...process.env,TZ:zone}}).trim();
 assert.equal(output,expected,'viewer timezone '+zone);
}
for(const value of[undefined,{},[],false,'night',{night:NaN},{mood:'unknown'},{lightingMode:'manual',mood:'unknown'}]){
 hour=8;restore(value);assert.equal(preset(),'day');assert.equal(state().lightingMode,'auto','malformed/missing preference follows the local clock');
}

// A throttle/route save captures auto intent, so the next visit follows the new
// time instead of restoring yesterday's resolved mood or preset lamp brightness.
hour=22;restore(null);run("setThrottle(61);chosenRoute='lowline';savePrefs()");
assert.equal(saved.lightingMode,'auto');assert.equal(saved.mood,'night');assert.equal(saved.throttle,61);assert.equal(saved.route,'lowline');
const automaticNight={...saved};hour=10;restore(automaticNight);
assert.equal(preset(),'day');assert.equal(state().roomLampTarget,.40);
run('setThrottle(37)');assert.equal(saved.lightingMode,'auto');assert.equal(saved.mood,'day');
const automaticDay={...saved};hour=20;restore(automaticDay);assert.equal(preset(),'night');assert.equal(state().roomLampTarget,.38);
hour=10;restore({...automaticDay,roomLamps:.66});assert.equal(state().roomLampTarget,.66,'retain a saved dimmer within the same automatic mood');

// Deliberate presets survive later visits and automatic clock events.
for(const [mood,level]of[['day',.40],['evening',1],['night',.38]]){
 hour=12;run(`setMood('${mood}')`);assert.equal(saved.lightingMode,'manual');assert.equal(saved.mood,mood);
 assert.equal(state().roomLampTarget,level);assert.equal(timers.size,0,'manual preset stops the automatic clock');
 hour=23;restore(saved);assert.equal(preset(),mood);assert.equal(state().lightingMode,'manual');
 visibility(true);visibility(false);assert.equal(preset(),mood,'returning to the tab respects manual lighting');
}
restore({lightingMode:'manual',mood:'night',roomLamps:.21});assert.equal(state().roomLampTarget,.21);
restore({mood:'day',roomLamps:.73});assert.equal(preset(),'day');assert.equal(state().lightingMode,'manual','legacy saved presets remain deliberate choices');
restore({night:.62});assert.equal(preset(),'evening');assert.equal(state().roomLampTarget,1,'legacy continuous night restores its complete preset');
restore({lightingMode:'manual',mood:'day',roomLamps:3});assert.equal(state().roomLampTarget,1,'saved dimmer is clamped');

// Opting back in changes immediately toward the current local mood, keeps the
// current interpolated light level for a gentle transition, and saves auto intent.
hour=6;run("setMood('auto')");assert.equal(preset(),'night');assert.equal(saved.lightingMode,'auto');
assert.equal(state().night,0,'normal interaction retains smooth interpolation');
hour=7;tick();assert.equal(preset(),'day');assert.equal(timers.size,1);assert.equal(state().lightingMode,'auto');
hour=18;tick();assert.equal(preset(),'day');hour=19;tick();assert.equal(preset(),'night');
visibility(true);assert.equal(timers.size,0,'hidden tabs suspend automatic checks');
hour=8;visibility(false);assert.equal(preset(),'day','tab return rechecks the local hour');assert.equal(timers.size,1);
run('toggleLight()');assert.equal(preset(),'evening');assert.equal(saved.lightingMode,'manual');assert.equal(timers.size,0,'toolbar light toggle is an explicit preset choice');
hour=22;visibility(true);visibility(false);assert.equal(preset(),'evening');
storageFailure=true;run("setMood('auto')");assert.equal(preset(),'night','unavailable storage does not break lighting');
assert.equal(timers.size,1);

console.log('Lighting verified: local 07:00/19:00 boundaries, timezone conversion, auto/manual persistence, throttle saves, legacy preferences, preset brightness, tab return and clock lifecycle.');
