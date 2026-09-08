'use strict';

const AUDIO_ASSETS=['the-long-way-home','lamplight-nocturne','town','coast','forest','workshop','steam','whistle'];
const SCORE_ASSETS=['the-long-way-home','lamplight-nocturne'];
// Measured with FFmpeg loudnorm. Generated files differ by almost 58 LUFS;
// these playback trims keep the quiet room details audible and the whistle soft.
const AUDIO_TRIM_DB={'the-long-way-home':-3.26,'lamplight-nocturne':2.70,town:23,coast:6,forest:39,workshop:35,steam:5,whistle:-10};
const audioAmplitude=db=>Math.pow(10,db/20);
// The preview/build supplies the optional recordings present in this edition.
// A source-only checkout still has the procedural railway, without 404 probes.
function houseRecordingAvailable(id){return !!window.HOUSE_EMBEDDED_AUDIO?.[id]||(Array.isArray(window.HOUSE_AUDIO_AVAILABLE)&&window.HOUSE_AUDIO_AVAILABLE.includes(id));}
let soundscape=null;
class HouseSoundscape{
 constructor(ctx){
  this.ctx=ctx;this.buffers=new Map();this.layers=new Map();this.scoreSources=[];this.nextScore=new Map();this.failed=[];this.loading=false;this.loaded=false;this.loadPromise=null;
  this.music=.40;this.ambience=.47;this.train=.42;this.on=true;this.lastWhistle=-Infinity;this.paramTargets=new WeakMap();
  this.output=ctx.createGain();this.output.gain.value=0;
  const compressor=ctx.createDynamicsCompressor();compressor.threshold.value=-12;compressor.knee.value=18;compressor.ratio.value=3;compressor.attack.value=.035;compressor.release.value=.65;
  this.output.connect(compressor).connect(ctx.destination);
  this.buses={};for(const key of['music','ambience','train']){const bus=ctx.createGain();bus.gain.value=this[key];bus.connect(this.output);this.buses[key]=bus;}
 }
 target(param,value,timeConstant=.35){
  const previous=this.paramTargets.get(param);if(previous!==undefined&&Math.abs(previous-value)<.0005)return;
  param.setTargetAtTime(value,this.ctx.currentTime,timeConstant);this.paramTargets.set(param,value);
 }
 canLoad(id){return houseRecordingAvailable(id);}
 connectRailway(railway){
  this.railway=railway;
  railway.master.disconnect();railway.master.connect(this.buses.train);
  // The original synthesizer sends birds and wheels through the same panner.
  // Give its bird tones the ambience bus so all three sliders remain independent.
  this.birdPan=this.ctx.createStereoPanner();const birdTrim=this.ctx.createGain();birdTrim.gain.value=.10;
  this.birdPan.connect(birdTrim).connect(this.buses.ambience);
  const originalTone=railway.tone;
  railway.tone=(frequency,...args)=>{
   if(frequency<1700)return originalTone.call(railway,frequency,...args);
   const trainPan=railway.panner;railway.panner=this.birdPan;
   try{return originalTone.call(railway,frequency,...args);}finally{railway.panner=trainPan;}
  };
 }
 async loadAsset(id){
  if(!this.canLoad(id))return;
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),30000);
  try{
   const source=window.HOUSE_EMBEDDED_AUDIO?.[id]||'assets/audio/'+id+'.mp3';
   const response=await fetch(source,{signal:controller.signal});if(!response.ok)throw new Error('Audio file unavailable');
   const buffer=await this.ctx.decodeAudioData(await response.arrayBuffer());this.buffers.set(id,buffer);
   if(id!=='whistle')this.createLayer(id);if(SCORE_ASSETS.includes(id))this.scheduleScore(id);
   this.failed=this.failed.filter(failedId=>failedId!==id);
  }catch(error){if(!this.failed.includes(id))this.failed.push(id);console.warn('Soundscape asset unavailable:',id,error.message);}
  finally{clearTimeout(timeout);}
 }
 load(ids=AUDIO_ASSETS){
  if(this.loading)return this.loadPromise;
  const missing=ids.filter(id=>this.canLoad(id)&&!this.buffers.has(id));
  if(!missing.length){this.loaded=true;this.updateStatus();return Promise.resolve();}
  this.loading=true;this.status(this.loaded?'Reopening the missing sounds…':'Opening the soundscape…');
  this.loadPromise=Promise.all(missing.map(id=>this.loadAsset(id))).finally(()=>{
   this.loading=false;this.loaded=true;this.loadPromise=null;this.updateStatus();
  });return this.loadPromise;
 }
 loopBuffer(buffer,id){
  // Fold the tail into the head with an equal-power overlap. A hard MP3 loop can
  // click even when a generation prompt asks for a seamless ambience.
  const overlap=Math.min(Math.round(buffer.sampleRate*(id==='steam'?.12:.85)),Math.floor(buffer.length/8));
  if(overlap<2)return buffer;
  const length=buffer.length-overlap,loop=this.ctx.createBuffer(buffer.numberOfChannels,length,buffer.sampleRate);
  for(let channel=0;channel<buffer.numberOfChannels;channel++){
   const input=buffer.getChannelData(channel),output=loop.getChannelData(channel);output.set(input.subarray(0,length));
   for(let i=0;i<overlap;i++){const angle=i/(overlap-1)*Math.PI/2;output[i]=input[i]*Math.sin(angle)+input[length+i]*Math.cos(angle);}
  }return loop;
 }
 createLayer(id){
  if(this.layers.has(id))return;
  const gain=this.ctx.createGain();gain.gain.value=0;
  const filter=this.ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=id==='steam'?2200:9500;
  const pan=this.ctx.createStereoPanner(),trim=this.ctx.createGain();trim.gain.value=audioAmplitude(AUDIO_TRIM_DB[id]||0);
  const score=SCORE_ASSETS.includes(id),bus=score?'music':id==='steam'?'train':'ambience';
  gain.connect(filter).connect(pan).connect(trim).connect(this.buses[bus]);
  const layer={gain,filter,pan,trim,source:null};this.layers.set(id,layer);
  if(!score){const source=this.ctx.createBufferSource();source.buffer=this.loopBuffer(this.buffers.get(id),id);source.loop=true;source.connect(gain);source.start(0,Math.random()*source.buffer.duration);layer.source=source;}
 }
 scheduleScore(id){
  const buffer=this.buffers.get(id),layer=this.layers.get(id);if(!buffer||!layer)return;
  const c=this.ctx,now=c.currentTime,start=this.nextScore.get(id)??now+.1,fade=Math.min(8,buffer.duration/5);
  if(start>now+15)return;
  const source=c.createBufferSource(),envelope=c.createGain();source.buffer=buffer;source.connect(envelope).connect(layer.gain);
  const t=Math.max(now+.03,start),fadeIn=new Float32Array(65),fadeOut=new Float32Array(65);
  for(let i=0;i<65;i++){fadeIn[i]=Math.sin(i/64*Math.PI/2);fadeOut[i]=Math.cos(i/64*Math.PI/2);}
  envelope.gain.value=0;envelope.gain.setValueCurveAtTime(fadeIn,t,fade);envelope.gain.setValueCurveAtTime(fadeOut,t+buffer.duration-fade,fade);
  source.start(t);source.stop(t+buffer.duration+.05);source.onended=()=>{source.disconnect();envelope.disconnect();this.scoreSources=this.scoreSources.filter(s=>s!==source);};this.scoreSources.push(source);this.nextScore.set(id,t+buffer.duration-fade);
 }
 status(text){const node=$('soundStatus');if(node&&node.textContent!==text)node.textContent=text;}
 updateStatus(){
  if(this.loading)return;
  if(this.failed.length){this.status('Some sounds could not load · tap to retry');return;}
  if(!SCORE_ASSETS.some(id=>this.canLoad(id))){this.status('Steam, wheels & birds · a quiet railway');return;}
  this.status(night>.58?'Original score · Lamplight nocturne':'Original score · The long way home');
 }
 setEnabled(on){
  this.on=on;this.target(this.output.gain,on?.70:0,on?.7:.08);
  if(on){this.ctx.resume().catch(()=>this.status('Tap Enable sound to reopen the soundscape'));this.load();}
 }
 retry(){if(!this.failed.length||this.loading)return this.loadPromise;return this.load(this.failed.slice());}
 whistle(){
  const buffer=this.buffers.get('whistle'),now=this.ctx.currentTime;if(!buffer||!this.on)return false;
  // Repeated presses still animate the engine, without piling up loud whistles.
  if(now-this.lastWhistle<1.8)return true;this.lastWhistle=now;
  const source=this.ctx.createBufferSource(),gain=this.ctx.createGain();source.buffer=buffer;
  const level=.46*audioAmplitude(AUDIO_TRIM_DB.whistle);gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(level,now+.03);gain.gain.setValueAtTime(level,now+Math.max(.04,buffer.duration-.18));gain.gain.linearRampToValueAtTime(0,now+buffer.duration);
  source.connect(gain).connect(this.buses.train);source.start();source.onended=()=>{source.disconnect();gain.disconnect();};return true;
 }
 scoreMix(){
  const nightMix=smooth(.30,.85,night),mix={'the-long-way-home':Math.cos(nightMix*Math.PI/2)*.66,'lamplight-nocturne':Math.sin(nightMix*Math.PI/2)*.66};
  if(this.buffers.has('the-long-way-home')&&!this.buffers.has('lamplight-nocturne'))mix['the-long-way-home']=.66;
  if(this.buffers.has('lamplight-nocturne')&&!this.buffers.has('the-long-way-home'))mix['lamplight-nocturne']=.66;
  return mix;
 }
 update(){
  if(!this.on)return;
  // A playlist can own selection without fighting the base layer automation.
  const score=this.scoreMix();for(const [id,level]of Object.entries(score))if(level>0)this.scheduleScore(id);
  for(const key of['music','ambience','train'])this.target(this.buses[key].gain,clamp(this[key],0,1),.18);
  const position=hobby.cinema?hobbyTrainInfo().p:cameraTarget,room=hobby.room;
  const near=(x,z,r)=>Math.exp(-((position[0]-x)**2+(position[2]-z)**2)/(r*r));
  const town=room==='valley'?.12+.65*near(-21,10,27):room==='coast'?.12:0;
  const coast=room==='coast'?.70:room==='valley'?.45*near(8,1,18):0;
  const forest=room==='alpine'?.62:room==='valley'?.14+.28*near(-8,-24,22):0;
  const workshop=room==='studio'?.70:(!hobby.cinema&&viewMode==='room'?.17:.025);
  const p=hobbyTrainInfo().p,dist=len(sub(cameraPos,p)),exhibitTrain=hobby.scene?.trains[0];
  const visibleSpeed=speed*(room==='valley'?1:exhibitTrain?.speed||1),isSteam=room==='valley'||exhibitTrain?.type==='steam';
  const trainLevel=paused||!isSteam?0:Math.sqrt(Math.min(visibleSpeed/1.5,1))*(hobby.cinema?.52:clamp(18/(dist+12),.06,.5));
  const targets={...score,town:town*.55,coast:coast*.62,forest:forest*.40,workshop:workshop*.46,steam:trainLevel*.90};
  for(const [id,layer]of this.layers){
   this.target(layer.gain.gain,targets[id]||0,id==='steam'?.28:2.5);
   if(id==='steam'){
    const projected=project(p),pan=Number.isFinite(projected.x)?clamp((projected.x/innerWidth-.5)*1.1,-.7,.7):0;
    this.target(layer.pan.pan,pan,.8);this.target(layer.filter.frequency,hobbyTrainInTunnel()?750:2200,1.5);
    if(layer.source)this.target(layer.source.playbackRate,clamp(visibleSpeed/1.9,.65,1.35),1.8);
    if(this.railway)this.railway.panner.pan.setTargetAtTime(pan,this.ctx.currentTime,.8);
   }
  }
  if(this.railway){
   // Retain the original wheel detail and interactive bells at a gentle level.
   this.railway.master.gain.setTargetAtTime(this.buffers.has('steam')?.22:.48,this.ctx.currentTime,.6);
   if(!isSteam)this.railway.lastChuff=Math.floor(travel/.45);
  }
  if(this.loaded)this.updateStatus();
 }
}

const originalEnableSound=enableSound;
enableSound=function(force=false){
 originalEnableSound(force);
 if(audio){if(!soundscape){soundscape=new HouseSoundscape(audio.ctx);soundscape.connectRailway(audio);}soundscape.setEnabled(audio.active);}
 if($('soundToggle')){$('soundToggle').textContent=audio?.active?'Sound is on':'Enable sound';$('soundToggle').setAttribute('aria-pressed',String(!!audio?.active));}
 if($('cinemaMute')){$('cinemaMute').textContent=audio?.active?'Sound on':'Sound off';$('cinemaMute').setAttribute('aria-pressed',String(!!audio?.active));}
};
const originalWhistle=whistle;
whistle=function(){if(!audio?.active)enableSound(true);if(soundscape?.whistle()){whistleSteam=1.6;for(let i=0;i<5;i++)emitSteam(true);$('whistleBtn').classList.add('active');setTimeout(()=>$('whistleBtn').classList.remove('active'),1500);}else originalWhistle();};
function updateHobbyAudio(){soundscape?.update();}
