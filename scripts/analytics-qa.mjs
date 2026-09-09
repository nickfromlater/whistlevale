#!/usr/bin/env node
// Real tracker, deterministic browser clock and delivery failures; no network.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=await readFile(new URL('../src/analytics.js',import.meta.url),'utf8');
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
assert.doesNotMatch(html,/\bid=["']railwayAnalytics["']/,'script IDs must not create a named window property that shadows the optional API');
function fixture(options={}){
 let now=0,wall=0,id=0;
 const tasks=new Map(),microtasks=[],events=[],listeners=new Map(),scripts=[];
 const listen=(type,fn,opts)=>{assert.equal(opts.passive,true,'telemetry listeners cannot cancel input');if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn);};
 const document={visibilityState:'visible',addEventListener:listen,createElement:()=>({dataset:{}}),head:{append:script=>scripts.push(script)}};
 const window={addEventListener:listen};
 if(!options.blocked)window.va=(command,event)=>{if(options.throwing)throw Error('sender failed');events.push(JSON.parse(JSON.stringify({command,...event})));};
 const context=vm.createContext({window,document,navigator:options.navigator||{},location:{hostname:options.host||'whistlevale.com',protocol:options.protocol||'https:'},performance:{now:()=>now},Date:{now:()=>wall},hobby:{ready:false,transition:false,room:'valley',cinema:false},shopMap:{open:false},HOUSE_ROOMS:{valley:{},coast:{},alpine:{},studio:{},marsh:{}},queueMicrotask:fn=>microtasks.push(fn),setTimeout:(fn,ms)=>{const key=++id;tasks.set(key,{at:now+ms,fn});return key;},clearTimeout:key=>tasks.delete(key)});
 vm.runInContext(source,context);
 const flush=()=>{while(microtasks.length)microtasks.shift()();};
 const fire=(type,event={})=>{for(const fn of listeners.get(type)||[])fn(event);flush();};
 const advance=ms=>{const end=now+ms;while(tasks.size){const [key,next]=[...tasks].sort((a,b)=>a[1].at-b[1].at)[0];if(next.at>end)break;wall+=next.at-now;now=next.at;tasks.delete(key);next.fn();flush();}wall+=end-now;now=end;};
 const state=(changes,map)=>{Object.assign(context.hobby,changes);if(map!==undefined)context.shopMap.open=map;window.railwayAnalytics?.sync();flush();};
 return {window,document,events,scripts,tasks,listeners,state,fire,advance,flush,context,stall:(ms,clockRuns=true)=>{wall+=ms;if(clockRuns)now+=ms;},of:name=>events.filter(e=>e.name===name)};
}
for(const options of [{host:'localhost'},{host:'preview-123.vercel.app'},{protocol:'file:'},{navigator:{doNotTrack:'1'}},{navigator:{globalPrivacyControl:true}}]){
 const f=fixture(options);assert.equal(f.scripts.length,0);assert.equal(f.listeners.size,0);assert.equal(f.window.railwayAnalytics,undefined,'local/export/privacy opt-out does no telemetry work');
}
{
 const f=fixture();f.advance(10000);assert.equal(f.events.length,0,'startup construction is not viewing time');
 f.state({ready:true,transition:true});f.advance(1000);f.state({transition:false,room:'coast'});
 assert.deepEqual(f.of('room_visit').map(e=>e.data.room),['coast'],'deep link has no phantom valley visit');
 f.advance(29000);assert.equal(f.of('room_time').length,0);f.advance(1000);
 assert.deepEqual(f.of('room_time').map(e=>e.data),[{room:'coast',seconds:30}]);
 f.document.visibilityState='hidden';f.fire('visibilitychange');assert.equal(f.tasks.size,0);
 f.advance(600000);f.document.visibilityState='visible';f.fire('visibilitychange');f.advance(30000);
 assert.deepEqual(f.of('room_time').map(e=>e.data.seconds),[30,60],'hidden time never contributes');
 f.state({},true);f.advance(120000);assert.equal(f.of('room_time').length,2,'map time is not credited to the last room');
 assert.ok(f.of('visit_time').some(e=>e.data.seconds===180),'map time still contributes to the visit');
 // Same-task map exit and room activation are collapsed to their final state.
 f.context.shopMap.open=false;f.window.railwayAnalytics.sync();f.context.hobby.room='marsh';f.window.railwayAnalytics.sync();f.flush();
 f.advance(30000);assert.equal(f.of('room_time').at(-1).data.room,'marsh','new registry rooms work without a fixed room list');
 f.state({room:'coast'});f.advance(120000);assert.equal(f.of('room_time').at(-1).data.seconds,180,'return visits accumulate room time');
 assert.equal(f.of('room_visit').filter(e=>e.data.room==='coast').length,1);
 f.state({cinema:true});f.advance(30000);assert.deepEqual(f.of('cinema_time').at(-1).data,{room:'coast',seconds:30});
 f.state({cinema:false});f.advance(60000);assert.equal(f.of('cinema_time').length,1);
 f.state({cinema:true});f.advance(30000);assert.equal(f.of('cinema_time').at(-1).data.seconds,60);
 assert.equal(f.of('cinema_start').length,1);
 f.fire('pagehide');assert.equal(f.tasks.size,0);f.advance(600000);f.fire('pageshow');f.advance(30000);
 assert.equal(f.of('cinema_time').length,2,'BFCache restore does not include time away or duplicate milestones');
}
for(const clockRuns of [true,false]){
 const f=fixture();f.state({ready:true});f.advance(10000);f.stall(3600000,clockRuns);f.state({});
 assert.equal(f.of('visit_time').length,0,'OS sleep or long stalled tasks never become a long visit');f.advance(30000);assert.equal(f.of('visit_time')[0].data.seconds,30);
}
{
 const f=fixture();f.state({ready:true});f.advance(20000);
 f.window.railwayAnalytics.control('pause');f.flush();f.advance(10000);
 assert.equal(f.of('visit_time')[0]?.data.seconds,30,'using controls must not delay or reset the timing clock');
 f.advance(20000);f.window.railwayAnalytics.panel('trainPanel');f.flush();f.advance(10000);
 assert.equal(f.of('room_time').at(-1).data.seconds,60);
}
{
 const f=fixture();f.state({ready:true});
 const target={id:'playBtn',disabled:false,dataset:{},closest(){return this;},matches(){return false;}};
 let action=0;const event={isTrusted:true,target,preventDefault(){throw Error('must not cancel');},stopImmediatePropagation(){throw Error('must not intercept');}};
 for(let i=0;i<100;i++){f.fire('click',event);action++;}
 f.window.railwayAnalytics.shortcut(' ');f.flush();assert.equal(action,100);
 assert.equal(f.of('control_used').length,1,'click and keyboard pause deduplicate');
 f.fire('change',{isTrusted:true,target:{id:'throttle',value:'99'}});
 assert.deepEqual(f.of('control_used').at(-1).data,{control:'throttle',room:'valley'},'slider values are never sent');
 f.fire('change',{isTrusted:true,target:{id:'projectName',value:'a private name'}});
 f.fire('click',{...event,isTrusted:false});f.window.railwayAnalytics.control('a private name');f.flush();assert.equal(f.of('control_used').length,2);
 for(const type of ['input','pointerdown','pointermove','wheel','touchstart','keydown'])assert.equal(f.listeners.has(type),false,'no high frequency input listeners');
 f.window.railwayAnalytics.panel('soundPanel');f.flush();assert.equal(f.of('control_used').at(-1).data.control,'panel_sound');
 f.state({},true);f.state({},false);f.state({},true);assert.equal(f.of('control_used').filter(e=>e.data.control==='room_map').length,1);
}
{
 const f=fixture({blocked:true});f.state({ready:true,cinema:true});
 for(const room of Object.keys(f.context.HOUSE_ROOMS)){f.state({room});f.advance(1800000);}
 assert.equal(f.window.vaq.length,60,'even a silently blocked script has a hard queue cap');assert.equal(f.tasks.size,0,'timing stops at the cap');
 f.scripts[0].onerror();assert.equal(f.window.vaq.length,0,'failed loading releases queued events');
}
{
 const f=fixture({throwing:true});assert.doesNotThrow(()=>f.state({ready:true}));assert.equal(f.tasks.size,0);
 assert.doesNotThrow(()=>{f.window.railwayAnalytics.control('pause');f.fire('visibilitychange');f.advance(120000);});
}
{
 const f=fixture();f.state({ready:true});f.advance(1800000);assert.deepEqual(f.of('visit_time').map(e=>e.data.seconds),[30,60,180,300,900,1800]);
 assert.equal(f.tasks.size,0,'a completed set of milestones needs no background timer');
}
// Exercise the actual export prelude against source and hashed script tags.
const hobby=await readFile(new URL('../src/hobby.js',import.meta.url),'utf8');
const exportBody=hobby.slice(hobby.indexOf('exportPlayable=async function(){'),hobby.indexOf('\nfunction startHouse(){'));
for(const asset of ['src/analytics.js','immutable/src/analytics.0123456789abcdef.js']){
 const removed=new Set(),fetched=[];
 const nodes=[{id:'analyticsBootstrap',src:asset},{src:'/_vercel/insights/script.js',analytics:true},{src:'src/railway.js'}].map(node=>({...node,remove(){removed.add(this);},getAttribute(){return this.src;}}));
 const clone={querySelectorAll:selector=>nodes.filter(node=>!removed.has(node)&&(selector==='script[src]'||node.id==='analyticsBootstrap'&&selector.includes('#analyticsBootstrap')||node.analytics&&selector.includes('[data-railway-analytics]')))};
 const context=vm.createContext({document:{documentElement:{cloneNode:()=>clone}},toast(){},console:{error(){}},fetch:async url=>{fetched.push(url);throw Error('end export fixture');}});
 vm.runInContext(exportBody,context);await context.exportPlayable();assert.deepEqual(fetched,['src/railway.js']);assert.equal(removed.size,2,'both tracking scripts are removed before export fetches anything');
}
console.log('Analytics QA passed: production-only loading, opt-outs, deep links, registry rooms, map exclusion, cumulative visible/cinema time, BFCache, sleep, input noninterference, deduplication, bounded/failed delivery and portable exports.');
