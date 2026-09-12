#!/usr/bin/env node
// Deterministic Web Audio scheduling/routing checks; no API calls or audio playback.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

class Param {
 constructor(value=0){this.value=value;this.events=[];}
 event(type,value,time,duration){assert.ok(Number.isFinite(time)&&time>=0,'valid automation time');if(typeof value==='number')assert.ok(Number.isFinite(value),'finite parameter');this.events.push({type,value,time,duration});return this;}
 setTargetAtTime(value,time,duration){return this.event('target',value,time,duration);}
 setValueAtTime(value,time){return this.event('value',value,time);}
 linearRampToValueAtTime(value,time){return this.event('ramp',value,time);}
 setValueCurveAtTime(value,time,duration){return this.event('curve',value,time,duration);}
 get target(){return this.events.at(-1)?.value??this.value;}
}
class Node {
 constructor(){this.connections=[];this.gain=new Param();this.frequency=new Param();this.pan=new Param();this.playbackRate=new Param(1);}
 connect(node){this.connections.push(node);return node;}
 disconnect(){this.connections=[];}
 start(time=0,offset=0){this.startTime=time;this.offset=offset;}
 stop(time){this.stopTime=time;}
}
class Context {
 constructor(){this.currentTime=0;this.state='running';this.destination=new Node();this.sources=[];}
 createGain(){return new Node();}
 createStereoPanner(){return new Node();}
 createBiquadFilter(){return new Node();}
 createDynamicsCompressor(){const n=new Node();for(const p of['threshold','knee','ratio','attack','release'])n[p]=new Param();return n;}
 createBufferSource(){const n=new Node();this.sources.push(n);return n;}
 createBuffer(numberOfChannels,length,sampleRate){const channels=Array.from({length:numberOfChannels},()=>new Float32Array(length));return{numberOfChannels,length,sampleRate,duration:length/sampleRate,getChannelData:channel=>channels[channel]};}
 async decodeAudioData(){return this.createBuffer(2,2400,100);}
 async resume(){this.state='running';}
}
const status={textContent:''},sandbox={window:{},AbortController,setTimeout,clearTimeout,Float32Array,console:{warn(){}},$:()=>status,enableSound(){},whistle(){},audio:null,
 HOUSE_ROOMS:{valley:{ambient:'town'},coast:{ambient:'coast'},alpine:{ambient:'forest'},studio:{ambient:'workshop'},commons:{ambient:'forest',railway:false}},
 hobby:{room:'valley',cinema:true,scene:null},cameraTarget:[0,0,0],cameraPos:[0,0,15],innerWidth:1200,speed:1.9,paused:false,night:0,viewMode:'cinema',travel:3,
 hobbyTrainInfo:()=>({p:[0,0,0]}),hobbyTrainInTunnel:()=>false,project:()=>({x:600}),len:v=>Math.hypot(...v),sub:(a,b)=>a.map((v,i)=>v-b[i]),clamp:(v,a,b)=>Math.min(b,Math.max(a,v)),smooth:(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);},fetch:async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(1)})};
const context=vm.createContext(sandbox);vm.runInContext(await readFile(new URL('../src/soundscape.js',import.meta.url),'utf8'),context);
const HouseSoundscape=vm.runInContext('HouseSoundscape',context);
const c=new Context(),house=new HouseSoundscape(c);

const raw=c.createBuffer(2,2400,100);for(let ch=0;ch<2;ch++)for(let i=0;i<raw.length;i++)raw.getChannelData(ch)[i]=Math.sin(i*.18+ch)*.4;
const loop=house.loopBuffer(raw,'town');assert.equal(loop.length,2315);assert.equal(loop.numberOfChannels,2);
for(let ch=0;ch<2;ch++){
 const input=raw.getChannelData(ch),output=loop.getChannelData(ch);
 assert.equal(output[0],input[loop.length],'loop join continues into the original tail');
 assert.ok(Math.abs(output[84]-input[84])<1e-7,'overlap returns smoothly to the original head');
 assert.ok(Math.abs(output[0]-output.at(-1))<.08,'no large artificial discontinuity at the wrap');
}
const retained=new HouseSoundscape(new Context());
for(const id of ['town','coast','forest','workshop','steam']){
 const expected=retained.loopBuffer(raw,id);retained.buffers.set(id,raw);retained.createLayer(id);
 const played=retained.layers.get(id).source.buffer;
 assert.equal(retained.buffers.get(id),played,'loop cache retains the exact AudioBuffer already playing');
 assert.notEqual(played,raw,'the redundant decoded original can be released');
 for(let channel=0;channel<raw.numberOfChannels;channel++)assert.deepEqual(played.getChannelData(channel),expected.getChannelData(channel),'retained loop output is sample-for-sample unchanged');
}
retained.buffers.set('the-long-way-home',raw);retained.createLayer('the-long-way-home');
assert.equal(retained.buffers.get('the-long-way-home'),raw,'music retains its complete original samples');

for(const [id,duration]of[['the-long-way-home',150],['lamplight-nocturne',120]]){house.buffers.set(id,c.createBuffer(2,duration*100,100));house.createLayer(id);house.scheduleScore(id);}
assert.equal(house.scoreSources.length,2);assert.equal(house.nextScore.get('the-long-way-home'),142.1);
c.currentTime=128;house.scheduleScore('the-long-way-home');assert.equal(house.scoreSources.length,3);assert.equal(house.scoreSources[2].startTime,142.1);
const first=house.scoreSources[0],second=house.scoreSources[2];assert.ok(Math.abs(first.stopTime-second.startTime-8.05)<1e-9);
house.scheduleScore('the-long-way-home');assert.equal(house.scoreSources.length,3,'lookahead does not schedule duplicate copies');
const incoming=second.connections[0].gain.events.find(e=>e.type==='curve').value;
const outgoing=first.connections[0].gain.events.filter(e=>e.type==='curve').at(-1).value;
for(let i=0;i<incoming.length;i++)assert.ok(Math.abs(incoming[i]**2+outgoing[i]**2-1)<1e-6,'repeat overlap is equal power');
first.onended();assert.equal(house.scoreSources.length,2,'ended sources are released');

house.buffers.set('steam',raw);house.createLayer('steam');house.buffers.set('whistle',c.createBuffer(2,400,100));
const railway={master:new Node(),panner:new Node(),tone(){return this.panner;}};railway.master.connect(c.destination);house.connectRailway(railway);
assert.equal(railway.master.connections[0],house.buses.train);assert.equal(railway.tone(1900),house.birdPan);assert.equal(railway.tone(1046),railway.panner);
assert.ok(house.whistle());const whistle=c.sources.at(-1);assert.equal(whistle.connections[0].connections[0],house.buses.train);
const sourceCount=c.sources.length;house.whistle();assert.equal(c.sources.length,sourceCount,'repeated whistle press does not pile up sources');
house.music=0;house.train=0;house.ambience=.8;house.update();assert.equal(house.buses.music.gain.target,0);assert.equal(house.buses.train.gain.target,0);assert.equal(house.buses.ambience.gain.target,.8);
assert.equal(whistle.connections[0].connections[0].gain.target,0,'train slider controls an already-playing whistle');
sandbox.paused=true;house.update();assert.equal(house.layers.get('steam').gain.gain.target,0);assert.equal(house.layers.get('the-long-way-home').gain.gain.target,.66,'pausing the train keeps the score');
sandbox.paused=false;sandbox.hobby.room='alpine';sandbox.hobby.scene={trains:[{type:'mountain',speed:.63}]};house.update();assert.equal(house.layers.get('steam').gain.gain.target,0,'electric train has no steam loop');
sandbox.hobby.room='coast';sandbox.hobby.scene={trains:[{type:'steam',speed:.78}]};house.update();assert.ok(Math.abs(house.layers.get('steam').source.playbackRate.target-.78)<1e-9,'chuffs use the visible exhibit speed');
sandbox.hobby.room='commons';sandbox.hobby.scene={trains:[]};house.update();assert.equal(house.layers.get('steam').gain.gain.target,0,'landscape has no train loop');assert.equal(railway.master.gain.target,0,'landscape mutes legacy wheel sounds');
 sandbox.hobby.room='coast';sandbox.hobby.scene={trains:[{type:'steam',speed:.78}]};house.update();assert.ok(railway.master.gain.target>0,'railway sound returns when leaving the landscape');
 house.setEnabled(false);assert.equal(house.output.gain.target,0);assert.equal(house.whistle(),false);

const retry=new HouseSoundscape(new Context()),attempted=[];let rejectAsset=true;sandbox.window.HOUSE_EMBEDDED_AUDIO={town:'data:audio/mp3;base64,AA=='};
sandbox.fetch=async url=>{attempted.push(url);return{ok:!rejectAsset,arrayBuffer:async()=>new ArrayBuffer(1)};};
const pending=retry.load(['town']);assert.equal(retry.load(['town']),pending,'concurrent loads share the pending request');await pending;assert.deepEqual([...retry.failed],['town']);
rejectAsset=false;await retry.retry();assert.equal(retry.failed.length,0);assert.ok(retry.buffers.has('town'));assert.ok(retry.layers.has('town'));assert.equal(attempted.length,2);assert.equal(attempted[1],'data:audio/mp3;base64,AA==','retry preserves embedded exports');
await retry.retry();assert.equal(attempted.length,2,'successful retries do not reload assets');
console.log('Audio QA passed: loop joins, equal-power score scheduling, cleanup, category routing, live whistle volume, pause, electric/steam exhibits, mute, and embedded-asset recovery.');

// Run the real playlist extension against the same mixer, without creating UI.
sandbox.$=id=>id==='soundStatus'?status:null;sandbox.document={readyState:'loading',addEventListener(){}};
sandbox.addEventListener=()=>{};sandbox.localStorage={getItem(){return null;},setItem(){}};sandbox.toast=()=>{};
sandbox.hobby={room:'valley',cinema:false,scene:null};sandbox.night=0;sandbox.paused=false;sandbox.window.HOUSE_EMBEDDED_AUDIO={};
vm.runInContext(await readFile(new URL('../src/playlist.js',import.meta.url),'utf8'),context);
sandbox.window.HOUSE_AUDIO_AVAILABLE=vm.runInContext('[...AUDIO_ASSETS]',context);
assert.equal(vm.runInContext('AUDIO_ASSETS.length',context),18,'portable export retains the full soundtrack registry including Yamaai');
const downloaded=[];sandbox.fetch=async url=>{downloaded.push(url);return{ok:true,arrayBuffer:async()=>new ArrayBuffer(1)};};
const playlistContext=new Context(),mixer=new HouseSoundscape(playlistContext);await mixer.load();
assert.equal(downloaded.length,7,'initial load is six room effects and the selected piece');assert.equal(mixer.buffers.size,7);
assert.ok(mixer.buffers.has('toy-shop-waltz'));assert.ok(!mixer.buffers.has('the-long-way-home'));assert.ok(!mixer.buffers.has('lamplight-nocturne'));assert.ok(!mixer.buffers.has('village-fete-band'));
const scheduled=[];const schedule=mixer.scheduleScore.bind(mixer);mixer.scheduleScore=id=>{scheduled.push(id);return schedule(id);};
mixer.update();const selectedGain=mixer.layers.get('toy-shop-waltz').gain.gain;
assert.equal(selectedGain.target,0,'automatic music is silent outside slow cinema');assert.equal(scheduled.length,0,'operating mode does not keep scheduling silent music');
sandbox.hobby.cinema=true;mixer.update();assert.equal(selectedGain.target,.66,'slow cinema starts the room score');const automationCount=selectedGain.events.length;
for(let i=0;i<100;i++){playlistContext.currentTime+=1/60;mixer.update();}
assert.equal(selectedGain.events.length,automationCount,'base mixer and playlist do not fight over score gain each frame');
assert.deepEqual([...new Set(scheduled)],['toy-shop-waltz'],'only the selected score is scheduled');assert.equal(downloaded.length,7,'idle playback does not fetch the rest of the library');

let finishCoast;
sandbox.fetch=url=>{downloaded.push(url);return new Promise(resolve=>{finishCoast=()=>resolve({ok:true,arrayBuffer:async()=>new ArrayBuffer(1)});});};
sandbox.hobby={room:'coast',cinema:true,scene:{trains:[{type:'steam',speed:.78}]}};mixer.update();
assert.equal(selectedGain.target,.66,'current music stays up while the new room track loads');assert.equal(mixer.loading,true);
for(let i=0;i<5;i++)mixer.update();assert.equal(downloaded.length,8,'pending room change issues only one download');
finishCoast();await mixer.loadPromise;mixer.update();assert.equal(selectedGain.target,0);assert.equal(mixer.layers.get('coast-gallery').gain.gain.target,.66);

let failNight=true;
sandbox.fetch=async url=>{downloaded.push(url);return{ok:!(failNight&&url.includes('waltz-after-hours')),arrayBuffer:async()=>new ArrayBuffer(1)};};
sandbox.night=1;mixer.update();await mixer.loadPromise;mixer.update();assert.equal(mixer.layers.get('coast-gallery').gain.gain.target,.66,'a failed requested piece preserves the current music');
const afterFailure=downloaded.length;for(let i=0;i<10;i++)mixer.update();assert.equal(downloaded.length,afterFailure,'failed music does not trigger a per-frame retry storm');
failNight=false;await mixer.retry();mixer.update();assert.equal(mixer.layers.get('waltz-after-hours').gain.gain.target,.66);assert.equal(mixer.failed.length,0);

sandbox.night=0;sandbox.hobby={room:'valley',cinema:true,scene:null};let failValley=true;
sandbox.fetch=async url=>{downloaded.push(url);return{ok:!(failValley&&url.includes('toy-shop-waltz')),arrayBuffer:async()=>new ArrayBuffer(1)};};
const fallback=new HouseSoundscape(new Context());await fallback.load();const beforeFallback=downloaded.length;
fallback.update();await fallback.loadPromise;fallback.update();assert.equal(downloaded.length,beforeFallback+1,'initial score failure downloads one fallback');assert.equal(fallback.layers.get('waltz-woodwind-warm').gain.gain.target,.66);
failValley=false;await fallback.retry();fallback.update();assert.equal(fallback.layers.get('toy-shop-waltz').gain.gain.target,.66,'retry restores the requested score');

sandbox.hobby.cinema=false;mixer.update();assert.equal(mixer.layers.get('waltz-after-hours').gain.gain.target,0,'leaving cinema fades out automatic music');
sandbox.playlistTest=mixer;vm.runInContext('soundscape=playlistTest; audio={active:false}; enableSound=force=>{globalThis.playlistEnableArgument=force;audio.active=true;}; playlistSelect("workbench-sunday");',context);
assert.equal(sandbox.playlistEnableArgument,true,'deliberate record selection enables audio in the user gesture');await mixer.loadPromise;
assert.ok(mixer.buffers.has('workbench-sunday'));assert.equal(vm.runInContext('playlistChoice',context),'workbench-sunday');mixer.update();assert.equal(mixer.layers.get('workbench-sunday').gain.gain.target,.66,'a pinned piece plays outside cinema');
console.log('Playlist QA passed: cinema-only automatic music, per-room cues, lazy start, one score automation owner, room-change continuity, bounded fallback, retry, and pinned playback.');

// Yamaai has a quiet room score in both lighting states; pinned choices win.
sandbox.HOUSE_ROOMS.yamaai={ambient:'forest',railway:false,conductor:false};
sandbox.hobby={room:'yamaai',cinema:true,scene:{trains:[]}};
vm.runInContext('playlistChoice="auto"',context);
for(const lighting of [0,1]){sandbox.night=lighting;assert.equal(vm.runInContext('playlistWanted()',context),'yamaai-between-mountains');}
vm.runInContext('playlistChoice="workbench-sunday"',context);
assert.equal(vm.runInContext('playlistWanted()',context),'workbench-sunday');
// A direct guest-room visit never starts the spoken house greeting.
const greetingRequests=downloaded.length;
await vm.runInContext('playArrival()',context);assert.equal(downloaded.length,greetingRequests);
assert.equal(vm.runInContext('arrivalPlayed',context),false,'a quiet room does not consume another room’s greeting');
// The conductor cannot start here, leak in after a late fetch, or remain
// sounding on room entry. Suppression preserves the visitor’s global choice.
vm.runInContext(await readFile(new URL('../src/conductor.js',import.meta.url),'utf8'),context);
vm.runInContext('conductorShowNow=function(){};conductorHideNow=function(){};',context);
sandbox.window.HOUSE_AUDIO_AVAILABLE.push('cond-welcome');
await vm.runInContext('conductorSay("cond-welcome")',context);
assert.equal(downloaded.length,greetingRequests,'no conductor request in Yamaai');
sandbox.hobby.room='valley';let finishCall;
sandbox.fetch=()=>new Promise(resolve=>{finishCall=()=>resolve({ok:true,arrayBuffer:async()=>new ArrayBuffer(1)});});
const pendingCall=vm.runInContext('conductorSay("cond-welcome")',context),voicesBefore=playlistContext.sources.length;
sandbox.hobby.room='yamaai';finishCall();await pendingCall;
assert.equal(playlistContext.sources.length,voicesBefore,'late decoded conductor cannot enter a quiet room');
sandbox.hobby.room='valley';playlistContext.currentTime+=300;
await vm.runInContext('conductorSay("cond-welcome")',context);
const speaking=playlistContext.sources.at(-1);assert.ok(vm.runInContext('conductorVoice',context));
sandbox.hobby.room='yamaai';vm.runInContext('conductorWatch()',context);
assert.equal(vm.runInContext('conductorVoice',context),null);assert.ok(speaking.stopTime<=playlistContext.currentTime+.21);
assert.equal(vm.runInContext('conductorOn',context),true,'room suppression never writes a global mute');
assert.equal(vm.runInContext('conductorSpeaking',context),0,'quiet room does not duck its ambient score');
console.log('Yamaai audio QA passed: day/night score, pinned overrides, silent entry, late voice cancellation and room-only conductor suppression.');

// A public source checkout carries no optional recordings. It must make no
// recording requests, including fallback probes, and retain its synthesizer.
sandbox.window.HOUSE_AUDIO_AVAILABLE=null;sandbox.window.HOUSE_EMBEDDED_AUDIO={};sandbox.hobby={room:'valley',cinema:true,scene:null};
vm.runInContext('playlistChoice="auto";playlistCurrent=null;',context);
const catalogRequests=[];sandbox.fetch=async url=>{catalogRequests.push(url);return{ok:true,arrayBuffer:async()=>new ArrayBuffer(1)};};
const empty=new HouseSoundscape(new Context()),procedural={master:new Node(),panner:new Node(),tone(){return this.panner;}};
empty.connectRailway(procedural);await empty.load();for(let i=0;i<100;i++)empty.update();
assert.equal(catalogRequests.length,0,'empty source edition makes zero recording requests');assert.equal(empty.loaded,true);assert.equal(empty.failed.length,0);assert.equal(empty.scoreSources.length,0);
assert.equal(procedural.master.connections[0],empty.buses.train);assert.equal(procedural.master.gain.target,.48,'the original railway remains active without recordings');assert.equal(empty.whistle(),false,'missing recorded whistle defers to the original synthesizer');
assert.equal(vm.runInContext('playlistAvailableTracks().length',context),0,'the empty record shelf has no unavailable options');assert.match(status.textContent,/Steam, wheels & birds/);
sandbox.playlistEnableArgument=null;vm.runInContext('playlistSelect("toy-shop-waltz")',context);assert.equal(sandbox.playlistEnableArgument,null,'unavailable selection does not claim playback');
assert.equal(vm.runInContext('AUDIO_ASSETS.filter(houseRecordingAvailable).length',context),0,'source-only export needs no recording fetches');

sandbox.window.HOUSE_AUDIO_AVAILABLE=[];sandbox.window.HOUSE_EMBEDDED_AUDIO={whistle:'data:audio/mp3;base64,AA=='};
assert.equal(empty.canLoad('whistle'),true);assert.equal(empty.canLoad('forest'),false);await empty.load(['whistle','forest']);
assert.deepEqual(catalogRequests,['data:audio/mp3;base64,AA=='],'portable embedded audio takes precedence over an empty catalog');

sandbox.window.HOUSE_AUDIO_AVAILABLE=['steam','coast-gallery'];sandbox.window.HOUSE_EMBEDDED_AUDIO={};catalogRequests.length=0;
const partial=new HouseSoundscape(new Context());await partial.load();assert.deepEqual(catalogRequests,['assets/audio/steam.mp3'],'partial editions load only existing effects');
partial.update();await partial.loadPromise;partial.update();assert.deepEqual(catalogRequests,['assets/audio/steam.mp3','assets/audio/coast-gallery.mp3'],'fallback selects the available room cue without probing missing tracks');
assert.equal(partial.failed.length,0);assert.equal(partial.layers.get('coast-gallery').gain.gain.target,.66);assert.equal(vm.runInContext('playlistAvailableTracks().length',context),1);
assert.deepEqual([...vm.runInContext('AUDIO_ASSETS.filter(houseRecordingAvailable)',context)],['steam','coast-gallery'],'partial export includes exactly the available recordings');
console.log('Optional audio QA passed: null/empty catalogs, zero missing-file probes, procedural fallback, truthful empty shelf, embedded precedence, partial catalog loading/fallback, and export asset selection.');

// Built URLs and portable recordings share one resolver; development paths stay unchanged.
sandbox.window.HOUSE_AUDIO_AVAILABLE=['town','arrival'];sandbox.window.HOUSE_AUDIO_URLS={town:'immutable/assets/audio/town.0123456789abcdef.mp3',arrival:'immutable/assets/audio/arrival.fedcba9876543210.mp3'};sandbox.window.HOUSE_EMBEDDED_AUDIO={};catalogRequests.length=0;
const versioned=new HouseSoundscape(new Context());await versioned.load(['town']);
assert.deepEqual(catalogRequests,['immutable/assets/audio/town.0123456789abcdef.mp3'],'normal playback requests its content-versioned recording');
assert.equal(vm.runInContext('houseRecordingURL("arrival")',context),sandbox.window.HOUSE_AUDIO_URLS.arrival,'arrival uses the same versioned URL manifest');
sandbox.window.HOUSE_EMBEDDED_AUDIO={town:'data:audio/mp3;base64,AA==',arrival:'data:audio/mp3;base64,AQ=='};
assert.equal(vm.runInContext('houseRecordingURL("town")',context),sandbox.window.HOUSE_EMBEDDED_AUDIO.town,'embedded audio overrides a stale deployed URL');
assert.equal(vm.runInContext('houseRecordingURL("arrival")',context),sandbox.window.HOUSE_EMBEDDED_AUDIO.arrival,'embedded greeting survives portable re-export');
assert.equal(vm.runInContext('houseRecordingURL("steam")',context),'assets/audio/steam.mp3','unmapped development paths are unchanged');
const hobbySource=await readFile(new URL('../src/hobby.js',import.meta.url),'utf8');
const exportIds=hobbySource.match(/const exportAudioIds=([^;]+);/)[1];
assert.deepEqual([...vm.runInContext(exportIds,context)],['town','arrival'],'portable export includes an available greeting alongside room audio');
console.log('Lossless delivery audio QA passed: identical retained loop samples, shared buffer identity, versioned playback, dev fallback, embedded precedence, and portable arrival inclusion.');

// Newly selectable diesel/electric stock must not inherit steam effects.
Context.prototype.createOscillator=function(){const n=new Node();this.sources.push(n);return n;};
const hornContext=new Context(),hornHouse=new HouseSoundscape(hornContext);
sandbox.hornHouse=hornHouse;sandbox.hobby={room:'valley',cinema:false,scene:null};sandbox.collectionPower=()=> 'diesel';sandbox.$=id=>id==='whistleBtn'?{classList:{add(){},remove(){}}}:id==='soundStatus'?status:null;sandbox.setTimeout=()=>0;
vm.runInContext('soundscape=hornHouse;audio={active:true};whistle();',context);
assert.equal(hornContext.sources.length,2,'a diesel uses the two-tone horn');
for(const source of hornContext.sources){assert.equal(source.connections[0].connections[0],hornHouse.buses.train,'horn follows the independent train mixer');assert.ok(source.stopTime<1,'horn has a bounded tail');}
vm.runInContext('whistle();',context);assert.equal(hornContext.sources.length,2,'rapid horn presses do not accumulate voices');
hornHouse.train=0;hornHouse.update();assert.equal(hornHouse.buses.train.gain.target,0,'muted train category also mutes the horn');
for(const source of hornContext.sources)source.onended();assert.ok(hornContext.sources.every(source=>source.connections.length===0),'finished horn voices disconnect');
hornContext.currentTime=2;hornHouse.setEnabled(false);vm.runInContext('whistle();',context);assert.equal(hornContext.sources.length,2,'muted mixer starts no horn voices');
const selectedSteam=new HouseSoundscape(new Context());selectedSteam.buffers.set('steam',raw);selectedSteam.createLayer('steam');
sandbox.collectionPower=()=> 'electric';selectedSteam.update();assert.equal(selectedSteam.layers.get('steam').gain.gain.target,0,'selected electric in Alder Valley has no steam loop');
sandbox.collectionPower=()=> 'steam';selectedSteam.update();assert.ok(selectedSteam.layers.get('steam').gain.gain.target>0,'switching back to steam restores the loop');
console.log('Selected stock audio QA passed: power-aware steam, bounded horn voices, train-category routing, mute and voice disposal.');
