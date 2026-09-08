'use strict';
/*
 * The record shelf — the house's score, as a playlist.
 *
 * The original soundscape crossfaded exactly two pieces on time of day alone,
 * so one cue had to carry every room. This adds a small library instead: each
 * room has a piece that belongs to it, cinema mode and nightfall have their
 * own, and the visitor can pin one piece everywhere if they would rather
 * choose. Selection is automatic by default and the panel says so.
 *
 * Written to be additive. It appends to SCORE_ASSETS and AUDIO_TRIM_DB (both
 * `const` bindings, but arrays and objects are still mutable) and wraps
 * HouseSoundscape's scoreMix hook selects the music in the base mixer, so
 * score selection has a single automation owner. The full asset registry is
 * retained for portable exports; normal playback loads pieces as needed.
 */

const PLAYLIST_TRACKS = [
 {id:'toy-shop-waltz',    title:'Toy Shop Waltz',    blurb:'A wind-up music box, turning in 3/4.',        trim:0},
 {id:'waltz-woodwind-warm',title:'Woodwind Waltz',   blurb:'The same lilt, in wood and wool.',            trim:0},
 {id:'waltz-slow-cinema',  title:'The Slow Way Round',blurb:'Opened out, for following the train.',       trim:0},
 {id:'waltz-after-hours',  title:'After Hours',      blurb:'Music box and lamplight, once the shop shuts.',trim:0},
 {id:'village-fete-band',  title:'Village Fête',blurb:'A tiny brass band on the green.',             trim:0},
 {id:'clockwork-parade',   title:'Clockwork Parade', blurb:'Marimba and bassoon at the workbench.',       trim:0},
 {id:'workbench-sunday',   title:'Workbench Sunday', blurb:'Fingerpicked and sunlit.',                    trim:0},
 {id:'coast-gallery',      title:'Sea Air',          blurb:'Concertina and bright water.',                trim:0},
 {id:'alpine-loft',        title:'High Clear Air',   blurb:'Flute and clarinet, a window open.',          trim:0},
];

// Which piece belongs where. Cinema and night win over the room, because both
// change what the visitor is doing rather than only where they are standing.
const PLAYLIST_ROOM = {valley:'village-fete-band',coast:'coast-gallery',alpine:'alpine-loft',studio:'clockwork-parade'};
const PLAYLIST_CINEMA = 'waltz-slow-cinema';
const PLAYLIST_NIGHT = 'waltz-after-hours';
const PLAYLIST_FALLBACK = 'toy-shop-waltz';
const PLAYLIST_STORE = 'alder-valley-playlist-v1';

let playlistChoice = 'auto';   // 'auto', or a track id the visitor pinned
let playlistCurrent = null;    // what is actually sounding right now
let playlistReady = false;

function playlistKnown(id){return PLAYLIST_TRACKS.some(t=>t.id===id);}
function playlistAvailableTracks(){return PLAYLIST_TRACKS.filter(track=>houseRecordingAvailable(track.id));}

/* Which piece should be playing, given where we are and what time it is.
 * Always returns something, even while the score is silent, so the loader can
 * open the right piece before cinema starts rather than after. */
function playlistWanted(){
 if(playlistChoice!=='auto'&&playlistKnown(playlistChoice))return playlistChoice;
 if(typeof night==='number'&&night>.62)return PLAYLIST_NIGHT;
 // The room decides, not the fact that cinema is running. Cinema is now the
 // only time the score sounds at all, so checking it first here made every
 // room play the same piece and left the four room cues unreachable.
 return PLAYLIST_ROOM[hobby?.room]||PLAYLIST_CINEMA;
}

/* Should anything be sounding at all?
 *
 * Operating the railway is meant to be a room you are standing in — birds,
 * water, the workshop, the engine — not a room with a soundtrack. The score
 * belongs to the slow tour, where you have stopped doing anything and are just
 * watching. So in automatic mode the music waits for cinema mode.
 *
 * Pinning a piece from the shelf is a deliberate ask, so that still plays
 * wherever you are. */
function playlistAudible(){
 if(playlistChoice!=='auto'&&playlistKnown(playlistChoice))return true;
 return !!(typeof hobby==='object'&&hobby?.cinema);
}

/* Fall back down the shelf if a piece never loaded, so silence is never the
  * result of one failed download. */
function playlistResolve(soundscape){
 const wanted=playlistWanted();
 if(soundscape.buffers.has(wanted))return wanted;
 if(playlistCurrent&&soundscape.buffers.has(playlistCurrent))return playlistCurrent;
 for(const id of [PLAYLIST_FALLBACK,...PLAYLIST_TRACKS.map(t=>t.id),'the-long-way-home','lamplight-nocturne'])
  if(soundscape.buffers.has(id))return id;
 return null;
}

function playlistRegister(){
 if(playlistReady)return;
 playlistReady=true;
 for(const track of PLAYLIST_TRACKS){
  if(!SCORE_ASSETS.includes(track.id))SCORE_ASSETS.push(track.id);
  // Exports pack this full registry. The load wrapper below opens only the
  // room effects and requested piece during normal playback.
  if(!AUDIO_ASSETS.includes(track.id))AUDIO_ASSETS.push(track.id);
  if(AUDIO_TRIM_DB[track.id]===undefined)AUDIO_TRIM_DB[track.id]=track.trim;
 }
 try{const saved=localStorage.getItem(PLAYLIST_STORE);if(saved&&(saved==='auto'||(playlistKnown(saved)&&houseRecordingAvailable(saved))))playlistChoice=saved;}catch{}
}

function playlistSelect(choice){
 if(choice!=='auto'&&(!playlistKnown(choice)||!houseRecordingAvailable(choice)))return;
 playlistChoice=choice;
 try{localStorage.setItem(PLAYLIST_STORE,choice);}catch{}
 playlistPaint();
 if(!audio?.active)enableSound(true);
 if(soundscape&&audio?.active)soundscape.load([playlistWanted()]);
 const track=PLAYLIST_TRACKS.find(t=>t.id===choice);
 toast(choice==='auto'?'The score follows each room in slow cinema.':`Playing “${track.title}” everywhere.`);
}

/* ---- the panel ---------------------------------------------------------- */

function playlistBuild(){
 if($('playlistPanel'))return;
 const style=document.createElement('style');
 style.id='playlistStyle';
 style.textContent=`
 .playlist-panel{position:absolute;right:33px;top:88px;width:288px;max-height:min(70vh,620px);overflow:auto;
  background:var(--glass);border:1px solid var(--line);border-radius:18px;padding:20px;backdrop-filter:blur(24px);
  box-shadow:0 15px 50px #0003;z-index:6}
 .playlist-panel[hidden]{display:none}
 .playlist-panel h3{font:20px Georgia,serif;margin:4px 0 3px;font-weight:400}
 .playlist-note{font-size:10px;color:#a6b09f;line-height:1.6;margin:0 0 15px}
 .playlist-auto{width:100%;display:flex;gap:10px;align-items:flex-start;text-align:left;padding:11px 12px;
  border-radius:11px;border:1px solid var(--line);background:#ffffff05;margin-bottom:6px;transition:background .2s}
 .playlist-auto:hover{background:#c6af7719}
 .playlist-item{width:100%;display:flex;gap:10px;align-items:flex-start;text-align:left;padding:10px 12px;
  border-radius:11px;border:1px solid transparent;background:none;transition:background .2s}
 .playlist-item:hover{background:#ffffff09}
 .playlist-auto.on,.playlist-item.on{background:#cab07924;border-color:#e9bc7155}
 .playlist-dot{width:7px;height:7px;border-radius:50%;background:#6f7d6b;margin-top:6px;flex:none;transition:background .2s}
 .playlist-auto.on .playlist-dot,.playlist-item.on .playlist-dot{background:var(--gold);box-shadow:0 0 9px #e2bd7d99}
 .playlist-item.sounding .playlist-dot{background:var(--green)}
 .playlist-title{font-size:11.5px;color:#e8e2cb;display:block;line-height:1.4}
 .playlist-blurb{font-size:9.5px;color:#9daa96;display:block;margin-top:2px;line-height:1.5}
 .playlist-now{font-size:9px;color:#d9bd85;letter-spacing:.05em;margin-left:6px}
 .playlist-sep{font-size:7.5px;letter-spacing:.22em;text-transform:uppercase;color:#8b9787;margin:15px 0 7px;padding-top:12px;border-top:1px solid var(--line)}
 .playlist-sep:first-of-type{border-top:0;padding-top:0}
 @media(max-width:1000px){.playlist-panel{right:16px;left:16px;width:auto}}`;
 document.head.appendChild(style);

 const panel=document.createElement('div');
 panel.className='playlist-panel';panel.id='playlistPanel';panel.hidden=true;
 panel.setAttribute('role','group');panel.setAttribute('aria-label','The record shelf');
 const available=playlistAvailableTracks();
 panel.innerHTML=`<div class="eyebrow">THE RECORD SHELF</div><h3>What’s playing</h3>
  <p class="playlist-note">${available.length?(available.length===9?'Nine pieces, written for this house. ':'')+'The score plays during the slow cinema &mdash; the rest of the time you just hear the room. Choose a piece and it plays wherever you are.':'No records on this shelf yet. Steam, wheels, and birds are still here.'}</p>
  <button class="playlist-auto" id="playlistAuto" type="button"><span class="playlist-dot"></span>
   <span><span class="playlist-title">Only in slow cinema<span class="playlist-now" id="playlistNow"></span></span>
   <span class="playlist-blurb">Each room brings its own piece to the tour, and nightfall its own.</span></span></button>
  <div id="playlistItems"></div>`;
 (document.getElementById('ui')||document.body).appendChild(panel);

 const items=panel.querySelector('#playlistItems');
 const groups=[['The waltzes',['toy-shop-waltz','waltz-woodwind-warm','waltz-slow-cinema','waltz-after-hours']],
               ['The rooms',['village-fete-band','clockwork-parade','coast-gallery','alpine-loft']],
               ['Also on the shelf',['workbench-sunday']]];
 for(const [label,ids] of groups){
  const present=ids.filter(id=>houseRecordingAvailable(id));if(!present.length)continue;
  const head=document.createElement('div');head.className='playlist-sep';head.textContent=label;items.appendChild(head);
  for(const id of present){
   const track=PLAYLIST_TRACKS.find(t=>t.id===id);if(!track)continue;
   const button=document.createElement('button');
   button.type='button';button.className='playlist-item';button.dataset.track=id;
   button.innerHTML=`<span class="playlist-dot"></span><span><span class="playlist-title">${track.title}</span>
    <span class="playlist-blurb">${track.blurb}</span></span>`;
   button.onclick=()=>playlistSelect(id);
   items.appendChild(button);
  }
 }
 panel.querySelector('#playlistAuto').onclick=()=>playlistSelect('auto');
 panel.querySelector('#playlistAuto').hidden=!available.length;

 // Sit beside the ambience control, in the same round-button language.
 const actions=document.querySelector('.top-actions');
 if(actions&&!$('playlistBtn')){
  const button=document.createElement('button');
  button.className='round-btn';button.id='playlistBtn';button.type='button';
  button.title='The record shelf';button.setAttribute('aria-label','The record shelf');
  button.setAttribute('aria-expanded','false');
  button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2.4"/></svg>';
  button.onclick=playlistToggle;
  actions.insertBefore(button,actions.firstChild);
 }
 playlistPaint();
 document.addEventListener('keydown',event=>{
  if(event.key!=='Escape'||panel.hidden)return;
  event.preventDefault();playlistToggle();$('playlistBtn')?.focus();
 });
}

function playlistToggle(){
 const panel=$('playlistPanel');if(!panel)return;
 const show=panel.hidden;
 panel.hidden=!show;
 if($('ambiencePanel'))$('ambiencePanel').hidden=true;
 if($('layoutPanel'))$('layoutPanel').hidden=true;
 if($('soundPanel'))$('soundPanel').hidden=true;
 $('playlistBtn')?.setAttribute('aria-expanded',String(show));
 $('playlistBtn')?.classList.toggle('on',show);
 if(show)playlistPaint();
}

function playlistPaint(){
 const panel=$('playlistPanel');if(!panel)return;
 const auto=$('playlistAuto');
 auto?.classList.toggle('on',playlistChoice==='auto');
 auto?.setAttribute('aria-pressed',String(playlistChoice==='auto'));
 const now=$('playlistNow'),sounding=PLAYLIST_TRACKS.find(t=>t.id===playlistCurrent);
 if(now)now.textContent=playlistChoice==='auto'&&sounding?`· ${sounding.title}`:'';
 for(const button of panel.querySelectorAll('.playlist-item')){
  button.classList.toggle('on',button.dataset.track===playlistChoice);
  button.setAttribute('aria-pressed',String(button.dataset.track===playlistChoice));
  button.classList.toggle('sounding',playlistChoice==='auto'&&button.dataset.track===playlistCurrent);
 }
}

/* ---- driving the soundscape --------------------------------------------- */

if(typeof HouseSoundscape==='function'){
 const originalLoad=HouseSoundscape.prototype.load;
 HouseSoundscape.prototype.load=function(ids){
  const requested=ids??[...AUDIO_ASSETS.filter(id=>!SCORE_ASSETS.includes(id)),playlistWanted()];
  return originalLoad.call(this,requested);
 };

 HouseSoundscape.prototype.scoreMix=function(){
  const desired=playlistWanted();
  if(!this.loading&&this.canLoad(desired)&&!this.buffers.has(desired)&&!this.failed.includes(desired))this.load([desired]);
  // Silent outside the slow tour. Returning {} lets the base mixer fade the
  // score out on its own long constant rather than cutting it.
  if(!playlistAudible()){
   if(playlistCurrent!==null){playlistCurrent=null;playlistPaint();}
   return {};
  }
  const wanted=playlistResolve(this);
  if(!wanted){
   // A failed requested piece should not force a full-library download.
   // Try one fallback at a time; explicit retry still retries the failed ids.
   if(!this.loading){
    const fallback=[PLAYLIST_FALLBACK,...PLAYLIST_TRACKS.map(track=>track.id),'the-long-way-home','lamplight-nocturne'].find(id=>this.canLoad(id)&&!this.failed.includes(id)&&!this.buffers.has(id));
    if(fallback)this.load([fallback]);
   }
   return {};
  }
  if(wanted!==playlistCurrent){playlistCurrent=wanted;playlistPaint();}
  return {[wanted]:.66};
 };

 const originalUpdateStatus=HouseSoundscape.prototype.updateStatus;
 HouseSoundscape.prototype.updateStatus=function(){
  if(this.loading||this.failed.length)return originalUpdateStatus.call(this);
  if(!SCORE_ASSETS.some(id=>this.canLoad(id)))return this.status('Steam, wheels & birds · a quiet railway');
  if(!playlistAudible())return this.status('The room · no score until the slow tour');
  const track=PLAYLIST_TRACKS.find(t=>t.id===playlistCurrent);
  this.status(track?`Original score · ${track.title}`:'Original score');
 };
}

// Open the requested piece alongside the room effects after a user gesture.
const playlistOriginalEnable=enableSound;
enableSound=function(force=false){
 playlistRegister();
 playlistOriginalEnable(force);
 playlistBuild();
};

playlistRegister();
if(document.readyState==='loading')addEventListener('DOMContentLoaded',playlistBuild);
else playlistBuild();
