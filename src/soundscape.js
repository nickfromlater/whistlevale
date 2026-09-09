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
function houseRecordingURL(id){return window.HOUSE_EMBEDDED_AUDIO?.[id]||window.HOUSE_AUDIO_URLS?.[id]||'assets/audio/'+id+'.mp3';}
const HOUSE_ROOM_AUDIO={
 valley:{recording:'town',high:75,low:780,air:.029,pan:-.10,nature:[18,34]},
 coast:{recording:'coast',high:80,low:1100,air:.080,pan:.12,nature:[42,70]},
 alpine:{recording:'forest',high:110,low:980,air:.055,pan:-.18,nature:[29,52]},
 studio:{recording:'workshop',high:45,low:390,air:.025,pan:.03,nature:null}
};
let soundscape=null;
class HouseSoundscape{
 constructor(ctx){
  this.ctx=ctx;this.buffers=new Map();this.layers=new Map();this.scoreSources=[];this.nextScore=new Map();this.failed=[];this.loading=false;this.loaded=false;this.loadPromise=null;
  this.roomSound=null;this.music=.40;this.ambience=.47;this.train=.42;this.on=true;this.lastWhistle=-Infinity;this.paramTargets=new WeakMap();
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
  // Each room now owns its nature cues. Suppress the original identical bird
  // phrase before it runs, and suppress steam at the electric engine itself.
  const originalUpdate=railway.update;
  if(typeof originalUpdate==='function')railway.update=function(dt){
   this.nextBird=Infinity;
   if(typeof collectionPower==='function'?collectionPower(hobby.room)!=='steam':hobby.room!=='valley'&&hobby.scene?.trains[0]?.type!=='steam')this.lastChuff=Math.floor(travel/.45);
   return originalUpdate.call(this,dt);
  };
  this.prepareRoomSound();
 }
 prepareRoomSound(){
  if(this.roomSound||typeof this.ctx.createOscillator!=='function')return;
  const c=this.ctx,rate=c.sampleRate||44100,noise=c.createBuffer(1,Math.round(rate*5),rate),data=noise.getChannelData(0);let slow=0,soft=0;
  // A soft, correlated noise bed has considerably less high-frequency energy
  // than white noise. It is shared by the four filtered room textures.
  for(let i=0;i<data.length;i++){const n=Math.random()*2-1;slow=slow*.997+n*.021;soft=soft*.96+n*.045;data[i]=slow*.74+soft*.32+n*.014;}
  const texture=this.loopBuffer(noise,'room-air'),rooms={};
  for(const [key,p]of Object.entries(HOUSE_ROOM_AUDIO)){
   const source=c.createBufferSource(),high=c.createBiquadFilter(),filter=c.createBiquadFilter(),gain=c.createGain(),pan=c.createStereoPanner(),mix=c.createGain();
   source.buffer=texture;source.loop=true;high.type='highpass';high.frequency.value=p.high;filter.type='lowpass';filter.frequency.value=p.low;if(filter.Q)filter.Q.value=.35;
   gain.gain.value=0;mix.gain.value=0;pan.pan.value=p.pan;
   source.connect(high).connect(filter).connect(gain).connect(pan).connect(mix).connect(this.buses.ambience);source.start(0,Math.random()*texture.duration);rooms[key]={source,high,filter,gain,pan,mix};
  }
  // A low motor hum belongs only to the electric mountain train. Its wheels
  // still come from RailwayAudio and every part follows the train slider.
  const motor=c.createGain(),motorFilter=c.createBiquadFilter();motor.gain.value=0;motorFilter.type='lowpass';motorFilter.frequency.value=460;motor.connect(motorFilter).connect(this.buses.train);
  const motors=[1,2.01].map((ratio,i)=>{const source=c.createOscillator(),gain=c.createGain();source.type=i?'sine':'triangle';source.frequency.value=84*ratio;gain.gain.value=i?.16:1;source.connect(gain).connect(motor);source.start();return {source,ratio};});
  this.roomSound={rooms,texture,motor,motors,room:null,nextUpdate:0,nextNature:Infinity,nextMaterial:Infinity};
 }
 roomTone(room,start,frequency,endFrequency,duration,level,pan=0,type='sine'){
  const bed=this.roomSound?.rooms[room];if(!bed||!this.on)return;
  const c=this.ctx,source=c.createOscillator(),gain=c.createGain(),filter=c.createBiquadFilter(),panner=c.createStereoPanner(),curve=new Float32Array(33);
  source.type=type;source.frequency.setValueAtTime(frequency,start);source.frequency.linearRampToValueAtTime(endFrequency,start+duration*.82);
  filter.type='lowpass';filter.frequency.value=room==='coast'?1550:room==='studio'?1100:2350;panner.pan.value=pan;
  for(let i=0;i<curve.length;i++){const t=i/(curve.length-1);curve[i]=Math.sin(Math.PI*t)**2*level*(1-.48*t);}
  gain.gain.setValueCurveAtTime(curve,start,duration);source.connect(filter).connect(gain).connect(panner).connect(bed.mix);
  source.start(start);source.stop(start+duration+.04);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();panner.disconnect();};
 }
 roomNature(room,strength){
  const c=this.ctx,start=c.currentTime+.04,pan=(Math.random()-.5)*1.12;
  if(room==='coast'){
   // One distant, soft falling call, with none of a close gull's harsh attack.
   this.roomTone(room,start,840,610,1.05,.0060*strength,pan);
   this.roomTone(room,start+.28,990,765,.60,.0011*strength,pan);
  }else if(room==='alpine'){
   const f=1050+Math.random()*240;
   this.roomTone(room,start,f,f*1.18,.19,.0048*strength,pan);
   this.roomTone(room,start+.38,f*.92,f*1.07,.24,.0039*strength,pan);
  }else if(room==='valley'){
   const f=1250+Math.random()*320;
   this.roomTone(room,start,f,f*1.16,.17,.0054*strength,pan);
   this.roomTone(room,start+.25,f*1.23,f*.97,.21,.0044*strength,pan);
   if(Math.random()>.55)this.roomTone(room,start+.60,f*.94,f*1.03,.16,.0030*strength,pan);
  }
 }
 roomMaterial(strength){
  const now=this.ctx.currentTime+.03,pan=(Math.random()-.5)*.75,frequency=220+Math.random()*140;
  // A short, rounded wooden contact, occasionally followed by setting a tool
  // down. The little pauses are more important than the sound itself.
  this.roomTone('studio',now,frequency,frequency*.76,.105,.0040*strength,pan,'triangle');
  if(Math.random()>.60)this.roomTone('studio',now+.19,frequency*.86,frequency*.69,.075,.0022*strength,pan,'triangle');
 }
 updateRoomSound(room,isSteam,visibleSpeed,distance){
  if(!HOUSE_ROOM_AUDIO[room])room=({coast:'coast',forest:'alpine',workshop:'studio',town:'valley'}[HOUSE_ROOMS[room]?.ambient]||'valley');
  const sound=this.roomSound;if(!sound)return;const now=this.ctx.currentTime,p=HOUSE_ROOM_AUDIO[room]||HOUSE_ROOM_AUDIO.valley;
  if(sound.room!==room){sound.room=room;sound.nextUpdate=0;sound.nextNature=now+10+Math.random()*12;sound.nextMaterial=now+13+Math.random()*15;}
  if(now<sound.nextUpdate)return;sound.nextUpdate=now+.16;
  const recorded=this.buffers.has(p.recording),support=recorded?.12:1,day=1-smooth(.20,.88,night);
  for(const [key,bed]of Object.entries(sound.rooms)){
   this.target(bed.mix.gain,key===room?1:0,1.5);
   if(key!==room)continue;
   let swell=1,cutoff=p.low;
   if(room==='coast'){const wave=(Math.sin(now*.37-.9)+1)*.5;swell=.42+.58*wave*wave;cutoff=560+650*wave;}
   else if(room==='alpine'){const breath=(Math.sin(now*.18)+Math.sin(now*.071+1.6)+2)*.25;swell=.42+.58*breath;cutoff=650+480*breath;}
   else if(room==='valley'){swell=.80+.20*Math.sin(now*.12+.4);cutoff=780;}
   this.target(bed.gain.gain,p.air*support*swell,1.4);this.target(bed.filter.frequency,cutoff,2.6);
  }
  const proximity=hobby.cinema?.75:clamp(20/(distance+20),.08,.65),motorLevel=!paused&&!isSteam?.0042*Math.sqrt(clamp(visibleSpeed/1.5,0,1))*proximity:0;
  const diesel=typeof collectionPower==='function'&&collectionPower(hobby.room)==='diesel';
  this.target(sound.motor.gain,motorLevel*(diesel?1.3:1),.85);for(const motor of sound.motors)this.target(motor.source.frequency,((diesel?48:78)+clamp(visibleSpeed,0,3)*(diesel?23:38))*motor.ratio,1.8);
  // Existing recordings remain the primary soundscape. Procedural cues become
  // both rarer and quieter when a room recording is available.
  if(now>=sound.nextNature){
   const interval=p.nature||[60,90];sound.nextNature=now+interval[0]+Math.random()*(interval[1]-interval[0])+(recorded?24:0);
   if(room!=='studio'&&day>.13&&this.ambience>.01)this.roomNature(room,(recorded?.20:1)*day);
  }
  if(room==='studio'&&now>=sound.nextMaterial){sound.nextMaterial=now+20+Math.random()*25+(recorded?20:0);if(this.ambience>.01)this.roomMaterial(recorded?.18:1);}
 }
 async loadAsset(id){
  if(!this.canLoad(id))return;
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),30000);
  try{
   const source=houseRecordingURL(id);
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
  const filter=this.ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=id==='steam'?2200:({town:3500,coast:2400,forest:3000,workshop:1700}[id]||9500);
  const pan=this.ctx.createStereoPanner(),trim=this.ctx.createGain();trim.gain.value=audioAmplitude(AUDIO_TRIM_DB[id]||0);
  const score=SCORE_ASSETS.includes(id),bus=score?'music':id==='steam'?'train':'ambience';
  gain.connect(filter).connect(pan).connect(trim).connect(this.buses[bus]);
  const layer={gain,filter,pan,trim,source:null};this.layers.set(id,layer);
  if(!score){
   const source=this.ctx.createBufferSource();source.buffer=this.loopBuffer(this.buffers.get(id),id);
   // Retain the repaired buffer that actually plays, releasing the unused PCM
   // original. Music and one-shot buffers keep their complete original samples.
   this.buffers.set(id,source.buffer);source.loop=true;source.connect(gain);source.start(0,Math.random()*source.buffer.duration);layer.source=source;
  }
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
  if(on){if(this.roomSound)this.roomSound.room=null;this.ctx.resume().catch(()=>this.status('Tap Enable sound to reopen the soundscape'));this.load();}
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
  const town=room==='valley'?.12+.65*near(-21,10,27):room==='coast'?.035:0;
  const coast=room==='coast'?.70:room==='valley'?.45*near(8,1,18):0;
  const forest=room==='alpine'?.62:room==='valley'?.14+.28*near(-8,-24,22):0;
  const workshop=room==='studio'?.65:room==='valley'&&(!hobby.cinema&&viewMode==='room')?.14:room==='coast'&&viewMode==='room'?.035:0;
  const p=hobbyTrainInfo().p,dist=len(sub(cameraPos,p)),exhibitTrain=hobby.scene?.trains[0];
  const visibleSpeed=speed*(room==='valley'?1:exhibitTrain?.speed??1),isSteam=typeof collectionPower==='function'?collectionPower(room)==='steam':room==='valley'||exhibitTrain?.type==='steam';
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
  this.updateRoomSound(room,isSteam,visibleSpeed,dist);
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
whistle=function(){if(!audio?.active)enableSound(true);if(typeof collectionPower==='function'&&collectionPower(hobby.room)!=='steam'){
 const c=soundscape?.ctx;if(c&&soundscape.on&&c.currentTime-soundscape.lastWhistle>.75){const now=c.currentTime;soundscape.lastWhistle=now;for(const [frequency,level]of[[262,.055],[349,.030]]){const o=c.createOscillator(),g=c.createGain();o.type='triangle';o.frequency.value=frequency;g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(level,now+.05);g.gain.setValueAtTime(level,now+.45);g.gain.linearRampToValueAtTime(0,now+.68);o.connect(g).connect(soundscape.buses.train);o.start();o.stop(now+.70);o.onended=()=>{o.disconnect();g.disconnect();};}}
 $('whistleBtn').classList.add('active');setTimeout(()=>$('whistleBtn').classList.remove('active'),700);return;
 }if(soundscape?.whistle()){whistleSteam=1.6;for(let i=0;i<5;i++)emitSteam(true);$('whistleBtn').classList.add('active');setTimeout(()=>$('whistleBtn').classList.remove('active'),1500);}else originalWhistle();};
function updateHobbyAudio(){soundscape?.update();}
