'use strict';
/*
 * The conductor.
 *
 * Twenty-one calls in one voice, four rooms, each tied to something the railway
 * actually does. Nothing plays at random and nothing plays on a timer: a call
 * fires when the train slows for a platform, comes to a stand, pulls away, is
 * held at a signal, or when night falls. That restraint is the whole design —
 * a PA that talks to itself would wreck the quiet this place is built on.
 *
 * Additive, in the shape of playlist.js: it appends to AUDIO_ASSETS and
 * AUDIO_TRIM_DB, wraps HouseSoundscape.prototype.update to watch for events,
 * and adds its own control. Nothing inside soundscape.js is edited.
 *
 * Routed to the train bus rather than music or ambience, because it belongs to
 * the train — so the visitor's existing "train" slider governs it, and it ducks
 * the score while it speaks the way a real PA overrides the carriage.
 */

const CONDUCTOR_STORE = 'whistlevale-conductor-v1';
const CONDUCTOR_GAP = 26;      // seconds between any two calls
const CONDUCTOR_REPEAT = 240;  // seconds before the same call may repeat
const CONDUCTOR_LEVEL = 0.92;
const CONDUCTOR_DUCK = 0.42;   // how far the score drops while he speaks

/* room -> the calls that belong to it. valley is the original board; the other
 * rooms carry their own stock and place names (Tidewater Bay, Bergwald, the
 * bench) so the conductor can never contradict the railway he is on. */
const CONDUCTOR_CALLS = {
 valley:{approaching:'cond-approaching',arrival:'cond-arrival',away:'cond-away',
         welcome:'cond-welcome',signal:'cond-signal',night:'cond-last',
         colour:['cond-tickets','cond-buffet','cond-next-stop']},
 coast: {approaching:'cond-coast-approaching',arrival:'cond-coast-arrival',
         away:'cond-coast-away',colour:['cond-coast-colour']},
 alpine:{approaching:'cond-alpine-approaching',arrival:'cond-alpine-arrival',
         away:'cond-alpine-away',colour:['cond-alpine-colour']},
 studio:{approaching:'cond-studio-approaching',arrival:'cond-studio-arrival',
         away:'cond-studio-away',colour:['cond-studio-colour']},
};

const CONDUCTOR_IDS = [...new Set(Object.values(CONDUCTOR_CALLS)
 .flatMap(r => Object.values(r).flat()))];

let conductorOn = true;
let conductorReady = false;
let conductorSpeaking = 0;      // context time the current call ends
let conductorLast = -Infinity;  // context time of the last call
const conductorHeard = new Map();
let conductorVoice = null;      // the call currently sounding, so it can be cut
let conductorWas = {room:null, atStation:false, stopped:false, night:false, cinema:false, paused:false};
let conductorTourStart = 0;     // context time the current tour began

function conductorStored(){
 try{const v=localStorage.getItem(CONDUCTOR_STORE);if(v!==null)conductorOn=v!=='off';}catch{}
}
function conductorRemember(){
 try{localStorage.setItem(CONDUCTOR_STORE,conductorOn?'on':'off');}catch{}
}

function conductorRegister(){
 if(conductorReady)return;
 conductorReady=true;
 for(const id of CONDUCTOR_IDS){
  // Deliberately NOT a SCORE_ASSET: these are one-shots, never looped or mixed
  // by the score automation.
  if(!AUDIO_ASSETS.includes(id))AUDIO_ASSETS.push(id);
  if(AUDIO_TRIM_DB[id]===undefined)AUDIO_TRIM_DB[id]=0;
 }
 conductorStored();
}

function conductorAvailable(id){
 return typeof houseRecordingAvailable!=='function'||houseRecordingAvailable(id);
}
function conductorRoomAllowed(){return typeof HOUSE_ROOMS==='undefined'||HOUSE_ROOMS[hobby?.room]?.conductor!==false;}

/* One-shot straight to the train bus, with its own envelope. */
async function conductorSay(id){
 if(!conductorRoomAllowed()||!conductorOn||!soundscape||!audio?.active||!id||!conductorAvailable(id))return;
 const room=hobby?.room;
 const ctx=soundscape.ctx,now=ctx.currentTime;
 if(now<conductorSpeaking||now-conductorLast<CONDUCTOR_GAP)return;
 if(now-(conductorHeard.get(id)??-Infinity)<CONDUCTOR_REPEAT)return;
 conductorLast=now;conductorHeard.set(id,now);
 try{
  let buffer=soundscape.buffers.get(id);
  if(!buffer){
   // Must go through the app's resolver: the build content-versions assets, so
   // the raw 'assets/audio/<id>.mp3' path 404s in production even though it
   // works locally. houseRecordingURL consults HOUSE_AUDIO_URLS.
   const src=typeof houseRecordingURL==='function'
    ? houseRecordingURL(id)
    : (window.HOUSE_EMBEDDED_AUDIO?.[id]||'assets/audio/'+id+'.mp3');
   const res=await fetch(src);if(!res.ok)return;
   buffer=await ctx.decodeAudioData(await res.arrayBuffer());
   soundscape.buffers.set(id,buffer);
  }
  // Navigation or muting may have happened while the recording was decoding.
  if(!conductorRoomAllowed()||hobby?.room!==room||!conductorOn||!audio?.active)return;
  const start=Math.max(ctx.currentTime,now);
  conductorSpeaking=start+buffer.duration;
  const node=ctx.createBufferSource(),gain=ctx.createGain();
  node.buffer=buffer;node.connect(gain).connect(soundscape.buses.train);
  gain.gain.setValueAtTime(0,start);
  gain.gain.linearRampToValueAtTime(CONDUCTOR_LEVEL,start+.12);
  // Hold level until the very end. The old 0.35s fade clipped the last words of
  // longer lines; the files now carry their own 1.4s of tail instead.
  gain.gain.setValueAtTime(CONDUCTOR_LEVEL,start+Math.max(.2,buffer.duration-.12));
  gain.gain.linearRampToValueAtTime(0,start+buffer.duration);
  node.start(start);node.stop(start+buffer.duration+.05);
  conductorVoice={node,gain};
  conductorShowNow();
  node.onended=()=>{node.disconnect();gain.disconnect();
   if(conductorVoice&&conductorVoice.node===node)conductorVoice=null;
   conductorHideNow();};
 }catch(error){console.warn('Conductor unavailable:',id,error.message);}
}

/* Room changes stop the voice without changing the saved preference. */
function conductorStop(){
 if(conductorVoice&&soundscape){
  const g=conductorVoice.gain.gain,t=soundscape.ctx.currentTime;
  try{g.cancelScheduledValues(t);g.setValueAtTime(g.value,t);g.linearRampToValueAtTime(0,t+.18);}catch{}
  try{conductorVoice.node.stop(t+.2);}catch{}
 }
 conductorVoice=null;conductorSpeaking=0;
 conductorHideNow();
}
function conductorSilence(){
 conductorStop();
 conductorOn=false;conductorRemember();
 conductorPaintControl();conductorHideNow();
 toast('The conductor has stepped off. Turn him back on in Sound & music.');
}

function conductorPick(room,kind){
 const set=CONDUCTOR_CALLS[room]||CONDUCTOR_CALLS.valley;
 const value=set[kind];
 if(!value)return null;
 if(!Array.isArray(value))return value;
 const usable=value.filter(conductorAvailable);
 return usable.length?usable[Math.floor(Math.random()*usable.length)]:null;
}

/* Watch the railway and speak only on real transitions.
 *
 * Cinema only, matching the score. Operating the railway you are the driver and
 * a conductor talking at you is noise; on the slow tour you are a passenger,
 * which is the only footing on which any of this makes sense. It also puts the
 * welcome call exactly where it belongs — the moment the tour begins. */
function conductorWatch(){
 if(!conductorRoomAllowed()){if(conductorVoice)conductorStop();if(conductorWas.cinema)conductorWas={...conductorWas,cinema:false};return;}
 if(!conductorOn||!audio?.active)return;
 if(!hobby?.cinema){conductorWas={...conductorWas,cinema:false};return;}
 const room=hobby?.room||'valley';
 const clock=soundscape?soundscape.ctx.currentTime:0;
 const now={
  room,
  atStation:!!(typeof atStation!=='undefined'&&atStation),
  stopped:!!(typeof stopRequested!=='undefined'&&stopRequested),
  night:typeof night==='number'&&night>.62,
  cinema:true,
  paused:!!(typeof paused!=='undefined'&&paused),
 };
 const was=conductorWas;
 if(!was.cinema)conductorTourStart=clock;                    // the tour just began

 // Changing rooms mid-tour is not an event. But entering the tour is: on the
 // first tick was.room is still null, and treating that as a room change
 // swallowed the welcome call every single time.
 if(was.cinema&&room!==was.room){conductorWas={...now};return;}
 if(!was.cinema)conductorSay(conductorPick(room,'welcome'));
 else if(now.atStation&&!was.atStation)conductorSay(conductorPick(room,'arrival'));
 else if(!now.atStation&&was.atStation)conductorSay(conductorPick(room,'away'));
 else if(now.stopped&&!was.stopped)conductorSay(conductorPick(room,'approaching'));
 else if(now.night&&!was.night)conductorSay(conductorPick(room,'night'));
 else if(now.paused&&!was.paused)conductorSay(conductorPick(room,'signal'));
 // A long uneventful stretch is itself a state, not a coin flip: after two
 // quiet minutes on the tour he says something in character. This is the only
 // path that reaches the colour lines, which would otherwise ship as dead bytes.
 else if(clock-conductorTourStart>120&&clock-conductorLast>110)
  conductorSay(conductorPick(room,'colour'));
 conductorWas=now;
}

/* ---- the in-context control ------------------------------------------------
 *
 * The panel toggle is fine but it is two clicks away and you only ever want it
 * at one moment: while he is talking. So a chip appears whenever he speaks,
 * naming him and offering to silence him, and disappears when he stops. The
 * off switch is present exactly when the thought occurs.
 */
function conductorBuildNow(){
 if($('conductorNow'))return;
 const style=document.createElement('style');
 style.id='conductorNowStyle';
 style.textContent=`
 .conductor-now{position:absolute;left:50%;top:78px;transform:translate(-50%,-8px);
  display:flex;align-items:center;gap:12px;padding:9px 10px 9px 15px;border-radius:30px;
  background:#1c3029ee;border:1px solid #d8c38e55;box-shadow:0 8px 32px #0004;
  backdrop-filter:blur(20px);opacity:0;pointer-events:none;z-index:8;
  transition:opacity .3s,transform .3s}
 .conductor-now.show{opacity:1;transform:translate(-50%,0);pointer-events:auto}
 .conductor-now-label{font-size:11px;color:#f1e4c1;white-space:nowrap;letter-spacing:.01em}
 .conductor-now-label b{color:#e2bd7d;font-weight:500}
 .conductor-now button{font-size:10px;letter-spacing:.06em;text-transform:uppercase;
  color:#e8e2cb;border:1px solid #d8c38e4d;background:#ffffff0d;border-radius:20px;
  padding:6px 13px;transition:background .2s}
 .conductor-now button:hover{background:#c6af7733;color:#fff3d6}
 .conductor-now button:focus-visible{outline:2px solid var(--gold);outline-offset:3px}
 @media(max-width:720px){.conductor-now{left:12px;right:12px;transform:translateY(-8px);width:auto}
  .conductor-now.show{transform:translateY(0)}}
 @media(prefers-reduced-motion:reduce){.conductor-now{transition:none}}`;
 document.head.appendChild(style);
 const chip=document.createElement('div');
 chip.className='conductor-now';chip.id='conductorNow';
 chip.setAttribute('role','status');
 chip.innerHTML='<span class="conductor-now-label"><b>The conductor</b> is speaking</span>'
  +'<button type="button" id="conductorSilence">Silence</button>';
 (document.getElementById('ui')||document.body).appendChild(chip);
 $('conductorSilence').onclick=conductorSilence;
}

function conductorShowNow(){
 conductorBuildNow();
 $('conductorNow')?.classList.add('show');
}
function conductorHideNow(){
 $('conductorNow')?.classList.remove('show');
}

/* ---- the panel control ------------------------------------------------------ */

function conductorBuildControl(){
 if($('conductorToggle'))return;
 const panel=$('soundPanel')||document.querySelector('.sound-panel');
 if(!panel)return;
 const style=document.createElement('style');
 style.id='conductorStyle';
 style.textContent=`
 .conductor-row{display:flex;gap:11px;align-items:flex-start;width:100%;text-align:left;
  padding:11px 12px;margin-top:12px;border-radius:11px;border:1px solid var(--line);
  background:#ffffff05;transition:background .2s}
 .conductor-row[hidden]{display:none}
 .conductor-row:hover{background:#c6af7719}
 .conductor-row.on{background:#cab07924;border-color:#e9bc7155}
 .conductor-dot{width:7px;height:7px;border-radius:50%;background:#6f7d6b;margin-top:6px;flex:none;transition:background .2s}
 .conductor-row.on .conductor-dot{background:var(--gold);box-shadow:0 0 9px #e2bd7d99}
 .conductor-title{font-size:11.5px;color:#e8e2cb;display:block;line-height:1.4}
 .conductor-blurb{font-size:9.5px;color:#9daa96;display:block;margin-top:2px;line-height:1.5}`;
 document.head.appendChild(style);

 const button=document.createElement('button');
 button.type='button';button.id='conductorToggle';button.className='conductor-row';
 button.innerHTML='<span class="conductor-dot"></span><span>'
  +'<span class="conductor-title">The conductor</span>'
  +'<span class="conductor-blurb">Calls, departures and delays &mdash; during the slow cinema.</span></span>';
 button.onclick=()=>{
  conductorOn=!conductorOn;conductorRemember();conductorPaintControl();
  if(conductorOn&&!audio?.active)enableSound(true);
  toast(conductorOn?'The conductor is aboard.':'The conductor has stepped off.');
 };
 panel.appendChild(button);
 conductorPaintControl();
}

function conductorPaintControl(){
 const button=$('conductorToggle');if(!button)return;
 button.hidden=!conductorRoomAllowed();
 button.classList.toggle('on',conductorOn);
 button.setAttribute('aria-pressed',String(conductorOn));
}

/* ---- wiring --------------------------------------------------------------- */

if(typeof HouseSoundscape==='function'){
 const baseUpdate=HouseSoundscape.prototype.update;
 HouseSoundscape.prototype.update=function(){
  baseUpdate.call(this);
  if(!this.on)return;
  conductorWatch();
  // Duck the score while he speaks, the way a real PA overrides the carriage.
  if(conductorOn&&this.ctx.currentTime<conductorSpeaking){
   for(const [id,layer] of this.layers){
    if(SCORE_ASSETS.includes(id))this.target(layer.gain.gain,
      (this.paramTargets.get(layer.gain.gain)??0)*CONDUCTOR_DUCK,.25);
   }
  }
 };
}

const conductorOriginalEnable=enableSound;
enableSound=function(force=false){
 conductorRegister();
 conductorOriginalEnable(force);
 conductorBuildControl();
};

conductorRegister();
const conductorBoot=()=>{conductorBuildControl();conductorBuildNow();};
if(document.readyState==='loading')addEventListener('DOMContentLoaded',conductorBoot);
else conductorBoot();
