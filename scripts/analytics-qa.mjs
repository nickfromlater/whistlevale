#!/usr/bin/env node
// Execute the shared core with a deterministic browser clock; no network or app globals.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=await readFile(new URL('../src/analytics.js',import.meta.url),'utf8');
function fixture(options={}){
 let now=0,wall=0,id=0,beforeSend;
 const tasks=new Map(),microtasks=[],events=[],listeners=new Map(),scripts=[];
 const listen=(type,fn,opts)=>{assert.equal(opts.passive,true,'telemetry cannot cancel input');if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn);};
 const document={visibilityState:options.hidden?'hidden':'visible',addEventListener:listen,createElement:()=>({dataset:{}}),head:{append:script=>scripts.push(script)}};
 const window={addEventListener:listen,...options.window};
 if(!options.blocked)window.va=(command,data)=>{
  if(options.throwing)throw Error('sender failed');
  if(command==='beforeSend'){assert.equal(typeof data,'function');beforeSend=data;return;}
  assert.equal(command,'event','use the Vercel vanilla custom-event protocol');
  events.push(JSON.parse(JSON.stringify(data)));
 };
 const context=vm.createContext({window,document,navigator:options.navigator||{},location:{hostname:options.host||'whistlevale.com',protocol:options.protocol||'https:'},performance:{now:()=>now},Date:{now:()=>wall},URL,queueMicrotask:fn=>microtasks.push(fn),setTimeout:(fn,ms)=>{const key=++id;tasks.set(key,{at:now+ms,fn});return key;},clearTimeout:key=>tasks.delete(key)});
 vm.runInContext(source,context);
 const flush=()=>{while(microtasks.length)microtasks.shift()();};
 const fire=(type,event={})=>{for(const fn of listeners.get(type)||[])fn(event);flush();};
 const advance=ms=>{const end=now+ms;while(tasks.size){const [key,next]=[...tasks].sort((a,b)=>a[1].at-b[1].at)[0];if(next.at>end)break;wall+=next.at-now;now=next.at;tasks.delete(key);next.fn();flush();}wall+=end-now;now=end;};
 const state=snapshot=>{window.railwayAnalytics?.sync(snapshot);flush();};
 const api=window.railwayAnalytics;
 return {window,document,events,scripts,tasks,listeners,context,api,state,fire,advance,flush,microtasks,filter:event=>beforeSend(event),stall:(ms,clockRuns=true)=>{wall+=ms;if(clockRuns)now+=ms;},of:name=>events.filter(e=>e.name===name)};
}
const room=(name='valley',extra={})=>({ready:true,room:name,cinema:false,map:false,...extra});
for(const options of [{host:'localhost'},{host:'127.0.0.1'},{host:'preview-123.vercel.app'},{host:'endless-railroad.vercel.app'},{host:'endless-railroad-nick-paolinos-projects.vercel.app'},{host:'whistlevale.com.example.com'},{protocol:'http:'},{protocol:'file:'},{protocol:'blob:'},{navigator:{doNotTrack:'1'}},{navigator:{globalPrivacyControl:true}},{window:{HOUSE_PORTABLE:true}},{window:{HOUSE_RETURN_URL:'https://whistlevale.com/index.html'}}]){
 const f=fixture(options);assert.equal(f.scripts.length,0);assert.equal(f.listeners.size,0);assert.equal(f.api,undefined,'nonproduction, portable and privacy opt-outs do no telemetry work');
}
for(const host of ['whistlevale.com','www.whistlevale.com']){
 const f=fixture({host});assert.equal(f.scripts.length,1);assert.equal(f.scripts[0].src,'/_vercel/insights/script.js');assert.equal(f.scripts[0].async,true);assert.equal(f.scripts[0].referrerPolicy,'no-referrer');
 vm.runInContext(source,f.context);assert.equal(f.scripts.length,1,'duplicate evaluation does not double-track');
}
{
 const f=fixture();
 for(const type of ['pageview','event']){
  const event={type,url:'https://whistlevale.com/grandhall.html?room=private&work=secret#private',payload:{name:'room_visit',data:{room:'grandhall'}}};
  const filtered=f.filter(event);assert.equal(filtered.url,'https://whistlevale.com/grandhall.html');assert.equal(filtered.type,type);assert.equal(filtered.payload,event.payload);assert.match(event.url,/private/,'filter does not mutate sender input');
 }
 assert.equal(f.filter({type:'pageview',url:'not a URL'}),null);
 assert.equal(f.filter({type:'pageview',url:'file:///private/project.html'}),null);
 assert.equal(f.filter({type:'pageview',url:'https://private:secret@whistlevale.com/?hidden#fragment'}).url,'https://whistlevale.com/');
 f.context.navigator.globalPrivacyControl=true;
 assert.equal(f.filter({type:'pageview',url:'https://whistlevale.com/'}),null,'late privacy opt-out blocks automatic events');
 f.state(room());assert.equal(f.events.length,0);assert.equal(f.tasks.size,0);
}
{
 const f=fixture();f.advance(10000);assert.equal(f.events.length,0,'startup construction is not viewing time');
 f.state(room('valley',{ready:false}));f.advance(1000);
 const deepLink=room('hudson');f.api.sync(room());f.api.sync(deepLink);deepLink.room='mutated';assert.equal(f.microtasks.length,1);f.flush();
 assert.deepEqual(f.of('room_visit').map(e=>e.data.room),['hudson'],'snapshots are copied and coalesced: no phantom initial room');
 f.advance(29000);assert.equal(f.of('room_time').length,0);f.advance(1000);
 assert.deepEqual(f.of('room_time').map(e=>e.data),[{room:'hudson',seconds:30}]);
 f.document.visibilityState='hidden';f.fire('visibilitychange');assert.equal(f.tasks.size,0);
 f.advance(600000);f.document.visibilityState='visible';f.fire('visibilitychange');f.advance(30000);
 assert.deepEqual(f.of('room_time').map(e=>e.data.seconds),[30,60],'hidden time never contributes');
 f.state(room('hudson',{map:true}));f.advance(120000);assert.equal(f.of('room_time').length,2,'map time is not credited to the previous room');
 assert.ok(f.of('visit_time').some(e=>e.data.seconds===180),'map time contributes to the visible visit');
 assert.ok(f.of('visit_time').every(e=>Object.keys(e.data).join()==='seconds'),'visit duration is roomless');
 f.state(room('marsh'));f.advance(30000);assert.equal(f.of('room_time').at(-1).data.room,'marsh','no fixed registry or house globals');
 f.state(room('hudson'));f.advance(120000);assert.equal(f.of('room_time').at(-1).data.seconds,180,'return visits accumulate room time');
 assert.equal(f.of('room_visit').filter(e=>e.data.room==='hudson').length,1);
}
{
 const f=fixture();f.state(room('coast'));f.stall(29000);f.state(room('grandhall'));f.advance(1000);
 assert.equal(f.of('room_time').length,0,'room transition never gives the old room elapsed time to the new room');
 f.state(room('coast'));f.advance(1000);assert.deepEqual(f.of('room_time').at(-1).data,{room:'coast',seconds:30});
 f.state(room('grandhall'));f.advance(29000);assert.deepEqual(f.of('room_time').at(-1).data,{room:'grandhall',seconds:30},'generic Hall snapshots accumulate independently');
 f.state(room('grandhall',{ready:false}));f.advance(600000);f.state(room('grandhall'));f.advance(30000);
 assert.equal(f.of('room_time').at(-1).data.seconds,60,'loading transitions are excluded');
}
{
 const f=fixture({hidden:true});f.state(room('grandhall'));f.advance(600000);assert.equal(f.events.length,0,'hidden initial load is not a visit');
 f.document.visibilityState='visible';f.fire('visibilitychange');assert.deepEqual(f.of('room_visit').map(e=>e.data.room),['grandhall']);
 f.advance(10000);f.document.visibilityState='hidden';f.fire('visibilitychange');f.state(room('coast'));f.advance(600000);
 f.document.visibilityState='visible';f.fire('visibilitychange');f.advance(30000);
 assert.deepEqual(f.of('room_time').map(e=>e.data),[{room:'coast',seconds:30}],'hidden navigation does not credit the old or new room');
}
{
 const f=fixture();f.state(room('coast',{cinema:true}));f.advance(30000);
 assert.deepEqual(f.of('cinema_time').at(-1).data,{room:'coast',seconds:30});
 f.state(room('coast'));f.advance(60000);assert.equal(f.of('cinema_time').length,1);
 f.state(room('coast',{cinema:true,map:true}));f.advance(60000);assert.equal(f.of('cinema_time').length,1,'map suppresses stale cinema state');
 f.state(room('coast',{cinema:true}));f.advance(30000);assert.equal(f.of('cinema_time').at(-1).data.seconds,60);
 f.fire('pagehide',{persisted:true});assert.equal(f.tasks.size,0);f.advance(600000);f.fire('pageshow',{persisted:true});f.advance(30000);
 assert.equal(f.of('cinema_time').length,2,'BFCache excludes time away and does not duplicate milestones');
 assert.equal(f.of('cinema_start').length,1,'cinema restarts count once per room');
 f.state(room('hudson',{cinema:true}));f.advance(30000);assert.equal(f.of('cinema_start').length,2);assert.equal(f.of('cinema_time').at(-1).data.room,'hudson');
}
for(const clockRuns of [true,false]){
 const f=fixture();f.state(room());f.advance(10000);f.stall(3600000,clockRuns);f.state(room());
 assert.equal(f.of('visit_time').length,0,'sleep and long stalled tasks never become a long visit');f.advance(30000);assert.equal(f.of('visit_time')[0].data.seconds,30);
}
{
 const f=fixture();f.state(room());f.advance(20000);f.api.control('pause');f.flush();f.advance(10000);
 assert.equal(f.of('visit_time')[0]?.data.seconds,30,'controls do not reset the timing clock');
 f.advance(20000);f.api.panel('trainPanel');f.flush();f.advance(10000);assert.equal(f.of('room_time').at(-1).data.seconds,60);
 f.api.control('house_map');f.api.sync(room('valley',{map:true}));f.flush();
 assert.deepEqual(f.of('control_used').at(-1).data,{control:'house_map',room:'map'},'same-task control uses the final coalesced context');
 f.api.sync(room('hudson'));f.fire('pagehide',{persisted:true});f.advance(120000);f.fire('pageshow',{persisted:true});f.advance(30000);
 assert.deepEqual(f.of('room_time').at(-1).data,{room:'hudson',seconds:30},'pending navigation plus pagehide never includes time away');
}
{
 const f=fixture();f.state(room());
 const target={id:'playBtn',disabled:false,dataset:{},closest(){return this;},matches(){return false;}};
 let action=0;const event={isTrusted:true,target,preventDefault(){throw Error('must not cancel');},stopImmediatePropagation(){throw Error('must not intercept');}};
 for(let i=0;i<100;i++){f.fire('click',event);action++;}
 f.api.shortcut(' ');f.flush();assert.equal(action,100);assert.equal(f.of('control_used').length,1,'mouse and keyboard first use deduplicate');
 f.state(room('hudson'));f.api.control('pause');f.flush();assert.equal(f.of('control_used').length,2,'first use is independently counted per room');
 f.state(room());f.api.control('pause');f.flush();assert.equal(f.of('control_used').length,2,'returning to a room does not recount controls');
 f.fire('change',{isTrusted:true,target:{id:'throttle',value:'99'}});
 assert.deepEqual(f.of('control_used').at(-1).data,{control:'throttle',room:'valley'},'slider values are not collected');
 f.fire('change',{isTrusted:true,target:{id:'projectName',value:'a private name'}});
 f.fire('click',{...event,isTrusted:false});f.fire('click',{isTrusted:true,target:{}});f.api.control('https://example.com/private');f.api.panel('private');f.api.shortcut('private');f.flush();
 assert.equal(f.of('control_used').length,3,'unknown names, values and synthetic inputs are excluded');
 for(const type of ['input','pointerdown','pointermove','wheel','touchstart','keydown'])assert.equal(f.listeners.has(type),false,'no high frequency input listeners');
 f.api.panel('soundPanel');f.flush();assert.equal(f.of('control_used').at(-1).data.control,'panel_sound');
 f.api.panel('buildersPanel');f.api.panel('contributePanel');f.api.shortcut('6');f.flush();
 assert.deepEqual(f.of('control_used').slice(-3).map(e=>e.data.control),['panel_builders','panel_contribute','camera_tour']);
 const link={...target,id:'hallInvitationLink',href:'grandhall.html?private'};
 f.fire('click',{isTrusted:true,target:link});assert.deepEqual(f.of('control_used').at(-1).data,{control:'contribute_open',room:'valley'},'the named Hall invitation sends no link URL');
}
{
 const f=fixture();f.state(room('grandhall',{extra:'private title',profile:'https://example.com/user'}));
 for(const control of ['hall_bay','hall_gallery','hall_map','contribute_open','contribute_prompt','exhibit_view','exhibit_room','house_map']){f.api.control(control);f.api.control(control);}
 f.flush();assert.equal(f.of('control_used').length,8);
 assert.ok(f.of('control_used').every(e=>e.data.room==='grandhall'&&Object.keys(e.data).sort().join()==='control,room'),'Hall only sends generic actions, never exhibit or credit data');
 f.state(room('invalid private room'));f.api.control('hall_bay');f.flush();assert.equal(f.of('room_visit').length,1);assert.equal(f.of('control_used').length,8);
}
{
 const f=fixture({blocked:true});f.state(room('valley',{cinema:true}));
 for(const name of ['valley','coast','alpine','studio','marsh']){f.state(room(name,{cinema:true}));f.advance(1800000);}
 assert.equal(f.window.vaq.length,61,'bounded fallback keeps one filter and at most 60 custom events');
 assert.equal(f.window.vaq[0][0],'beforeSend');assert.equal(f.window.vaq.filter(args=>args[0]==='event').length,60);assert.equal(f.tasks.size,0,'no timers after custom event cap');
 for(let i=0;i<100;i++){f.api.sync(room('new-room-'+i));f.api.control('pause');}f.flush();assert.equal(f.window.vaq.length,61);assert.equal(f.tasks.size,0);
 f.scripts[0].onerror();assert.equal(f.window.vaq.length,0,'failed script releases the queue');f.state(room());assert.equal(f.window.vaq.length,0);
}
{
 const f=fixture();for(let i=0;i<100;i++){f.state(room('room-'+i));f.api.control('pause');f.flush();}
 assert.equal(f.events.length,60,'working sender has the same hard custom-event cap');assert.equal(f.tasks.size,0);
}
{
 const f=fixture({throwing:true});assert.doesNotThrow(()=>f.state(room()));assert.equal(f.tasks.size,0);
 assert.doesNotThrow(()=>{f.api.control('pause');f.fire('visibilitychange');f.advance(120000);});
 const later=fixture();later.state(room());later.window.va=()=>{throw Error('late failure');};assert.doesNotThrow(()=>later.advance(30000));assert.equal(later.tasks.size,0);
}
{
 const f=fixture();f.state(room('valley',{cinema:true}));f.advance(1800000);
 for(const name of ['visit_time','room_time','cinema_time'])assert.deepEqual(f.of(name).map(e=>e.data.seconds),[30,60,180,300,900,1800]);
 assert.equal(f.tasks.size,0,'completed milestones need no background timer');
}
console.log('Analytics QA passed: shared snapshots, coalescing, generic Hall actions, URL filtering, production/privacy/portable gates, visible cumulative time, map and transition exclusion, BFCache/sleep, per-room first use, input noninterference, hard cap and failed delivery.');
