'use strict';

const hobby={room:'valley',life:null,ready:false,cinema:false,shot:'drift',scene:null,spot:-1,transition:false,cinemaStart:0,heading:[0,0,1],saved:null,transitionTimer:null};
const baseHobbyStart=start,baseHobbySetView=setView,baseHobbyCamera=updateCamera,baseHobbySimulation=updateSimulation,baseHobbyUI=updateUI,baseHobbyBuild=enterBuild,baseManualOrbit=beginManualOrbit;
const icon=(name)=>`<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;

function hobbyTrainInfo(){return hobby.room==='valley'||!hobby.scene?leadInfo:houseTrainAt(hobby.scene.trains[0]);}
function hobbyTrainMatrix(){return hobby.room==='valley'||!hobby.scene?trainModels[0]:circuitMatrix(hobby.scene.trains[0].edge,hobby.scene.trains[0].distance);}
function hobbyTrainInTunnel(){return hobby.room==='valley'&&leadInfo&&inTunnel(leadInfo.edge,leadInfo.d,2);}
function hobbyTrainLabel(key=hobby.room){
 const room=HOUSE_ROOMS[key]||{},stock=typeof TRAIN_ROSTER!=='undefined'?TRAIN_ROSTER[key]:null;
 return stock||{name:room.train?.name||room.layout||room.name||'The local railway',number:room.train?.number||'',service:room.train?.service||room.service||'Scenic service',type:room.train?.type||''};
}

function drawHobbyStatic(p,shadow){
 if(hobby.room==='valley'){
  if(!shadow)draw(groundMesh,I,p);
  drawRoom(p,shadow);draw(staticMesh,I,p);if(!shadow)draw(waterMesh,I,p);drawWorkshop(p,shadow);
  if(hobby.life&&!building)draw(hobby.life.mesh,I,p);
 }else if(hobby.scene)drawHouseRoom(hobby.scene,p,shadow);
}
function drawHobbyTrains(p){
 if(hobby.room==='valley'){drawTrains(p);if(hobby.life&&!building)drawWalkingFigures(hobby.life.actors,p);}
 else if(hobby.scene){drawHouseTrains(hobby.scene,p);drawWalkingFigures(hobby.scene.actors,p);}
}
function drawHobbyParticles(){
 if(hobby.room==='valley'){drawSteam();return;}
 // Reuse the steam system at the active exhibit locomotive, including room dust.
 const savedSteam=steam.map(p=>p.p),source=trainModels[0],destination=hobbyTrainMatrix();
 const origin=transform([0,1.7,1.03],source),target=transform([0,1.7,1.03],destination);
 if(hobby.scene.trains[0].type==='steam'){steam.forEach((s,i)=>{s.p=add(savedSteam[i],sub(target,origin));});drawSteam();steam.forEach((s,i)=>{s.p=savedSteam[i];});}
}

function houseOrbit(room,close=false){
 const q=HOUSE_ROOMS[room],phone=innerWidth<700;
 orbit.target=q.target.slice();orbit.distance=q.distance*(phone?1.78:1)*(close?.82:1);orbit.pitch=phone?Math.max(.74,q.pitch):q.pitch;orbit.yaw=phone?.12:q.yaw;
}

setView=function(mode,announce=true){
 if(hobby.cinema)leaveCinema(false);
 if(hobby.room==='valley'){baseHobbySetView(mode,announce);return;}
 viewMode=mode;currentPlace='';
 if(mode==='room'||mode==='overview')houseOrbit(hobby.room,mode==='overview');
 if(mode==='tour'){enterCinema();return;}
 document.body.classList.toggle('train-focus',mode==='engine');$('trainInspector').hidden=true;
 for(const b of document.querySelectorAll('[data-camera]')){b.classList.toggle('selected',b.dataset.camera===mode);b.setAttribute('aria-pressed',String(b.dataset.camera===mode));}
 updateUI();
};
enterBuild=function(on=true){
 if(hobby.cinema)leaveCinema(false);
 if(on&&hobby.room!=='valley'){visitHouseRoom('valley',()=>baseHobbyBuild(true));return;}
 baseHobbyBuild(on);shadowDirty=true;
};
beginManualOrbit=function(){if(hobby.cinema)leaveCinema(false);baseManualOrbit();};

// Shared synchronous entry. The caller owns map state, fades and error handling.
// Resolve geometry first so a failed room build leaves the active room intact.
function activateHouseRoom(key){
 if(!HOUSE_ROOMS[key])throw new Error('Unknown hobby house room: '+key);
 const scene=key==='valley'?null:getHouseScene(key);
 if(building)baseHobbyBuild(false);if(hobby.cinema)leaveCinema(false);
 hobby.room=key;hobby.scene=scene;hobby.spot=-1;
 document.body.classList.toggle('annex',key!=='valley');document.body.dataset.room=key;shadowDirty=true;
 setView('room',false);houseOrbit(key);cameraTarget=orbit.target.slice();cameraPos=add(orbit.target,[Math.sin(orbit.yaw)*Math.cos(orbit.pitch)*orbit.distance,Math.sin(orbit.pitch)*orbit.distance,Math.cos(orbit.yaw)*Math.cos(orbit.pitch)*orbit.distance]);
 renderRoomPlaces();updateUI();
 $('layoutPanel').hidden=true;$('ambiencePanel').hidden=true;
 try{sessionStorage.setItem('hobby-house-room',key);const url=new URL(location.href);url.searchParams.set('room',key);window.history.replaceState(null,'',url);}catch{}
 return scene;
}

function visitHouseRoom(key,after){
 if(!HOUSE_ROOMS[key]||hobby.transition)return;
 if(typeof closeHouseMap==='function')closeHouseMap();
 if(key===hobby.room){setView('room',false);after?.();return;}
 if(building)baseHobbyBuild(false);if(hobby.cinema)leaveCinema(false);
 hobby.transition=true;$('roomTransition').classList.add('visible');$('transitionNumber').textContent=HOUSE_ROOMS[key].number;$('transitionName').textContent=HOUSE_ROOMS[key].name;
 setTimeout(()=>{
  try{
   activateHouseRoom(key);
  }catch(error){console.error(error);toast('This room could not open. Please try again.');}
  requestAnimationFrame(()=>{requestAnimationFrame(()=>{$('roomTransition').classList.remove('visible');hobby.transition=false;after?.();});});
 },reduceMotion?0:260);
}

function renderRoomPlaces(){
 const container=$('roomPlaces');container.replaceChildren();if(hobby.room==='valley')return;
 for(const [i,spot]of hobby.scene.spots.entries()){
  const button=document.createElement('button');button.textContent=spot.name;button.onclick=()=>{
   if(hobby.cinema)leaveCinema(false);viewMode='overview';hobby.spot=i;orbit.target=spot.target.slice();orbit.distance=(spot.distance??HOUSE_ROOMS[hobby.room].distance)*(innerWidth<700?1.7:1);orbit.pitch=spot.pitch??HOUSE_ROOMS[hobby.room].pitch;orbit.yaw=spot.yaw??HOUSE_ROOMS[hobby.room].yaw;
   for(const b of container.querySelectorAll('button'))b.classList.toggle('chosen',b===button);updateUI();
  };container.append(button);
 }
}

function enterCinema(){
 if(hobby.cinema||!hobby.ready)return;if(building)baseHobbyBuild(false);
 hobby.saved={throttle,paused,view:viewMode,target:orbit.target.slice(),distance:orbit.distance,pitch:orbit.pitch,yaw:orbit.yaw};
 hobby.cinema=true;hobby.cinemaStart=roomClock;hobby.heading=hobbyTrainInfo().f.slice();hobby.tunnelBlend=hobbyTrainInTunnel()?1:0;hobby.shotBlend={side:9,back:-14,height:8.5};
 viewMode='cinema';document.body.classList.add('cinematic');document.body.classList.remove('hidden-ui','train-focus');hidden=false;
 $('trainInspector').hidden=true;$('ambiencePanel').hidden=true;$('layoutPanel').hidden=true;
 setThrottle(Math.min(throttle||28,28));if(paused)togglePause();if(!audio?.active)enableSound(true);
 $('cinemaRoom').textContent=HOUSE_ROOMS[hobby.room].layout;$('cinemaSubtitle').textContent=HOUSE_ROOMS[hobby.room].tag;
 $('cinemaStart').setAttribute('aria-pressed','true');$('cinemaExit').focus();wakeCinema();
}
function leaveCinema(restore=true){
 if(!hobby.cinema)return;hobby.cinema=false;document.body.classList.remove('cinematic','cinema-idle');$('cinemaStart').setAttribute('aria-pressed','false');
 const saved=hobby.saved;hobby.saved=null;
 if(saved){setThrottle(saved.throttle);if(paused!==saved.paused)togglePause();viewMode=saved.view==='cinema'?'room':saved.view;Object.assign(orbit,{target:saved.target,distance:saved.distance,pitch:saved.pitch,yaw:saved.yaw});}
 else viewMode='room';
 if(restore){$('cinemaStart').focus();updateUI();}
}
let cinemaIdleTimer=0;
function wakeCinema(){if(!hobby.cinema)return;document.body.classList.remove('cinema-idle');clearTimeout(cinemaIdleTimer);cinemaIdleTimer=setTimeout(()=>{if(hobby.cinema&&$('soundPanel').hidden&&!document.querySelector('#cinemaControls :focus-visible'))document.body.classList.add('cinema-idle');},5500);}

updateSimulation=function(dt){
 baseHobbySimulation(dt);
 if(hobby.room!=='valley'&&hobby.scene&&!paused)for(const train of hobby.scene.trains)train.distance+=dt*train.speed*speed;
};

function cinemaCamera(dt){
 const info=hobbyTrainInfo(),elapsed=roomClock-hobby.cinemaStart,headingRate=1-Math.exp(-dt*1.0);
 hobby.heading=norm(lerpV(hobby.heading,info.f,headingRate));const f=norm([hobby.heading[0],0,hobby.heading[2]]),r=[f[2],0,-f[0]],p=info.p;
 const drift=reduceMotion?0:Math.sin(elapsed*.031),shots={drift:{side:10+drift*3,back:-14+drift*2,height:9.5},side:{side:14,back:-4,height:5.2},wide:{side:21,back:-22,height:16},tail:{side:3.2,back:-18,height:6.5}};
 const q=shots[hobby.shot]||shots.drift,blend=1-Math.exp(-dt*.35);
 for(const key of['side','back','height'])hobby.shotBlend[key]=mix(hobby.shotBlend[key],q[key],blend);
 hobby.tunnelBlend=mix(hobby.tunnelBlend,hobbyTrainInTunnel()?1:0,1-Math.exp(-dt*.4));
 const a=hobby.shotBlend,portrait=innerWidth<700?1.6:1;
 const target=add(add(p,mul(f,-3.0)),[0,1.1,0]);
 let desired=add(add(add(p,mul(f,a.back*portrait)),mul(r,a.side*portrait)),[0,(a.height+hobby.tunnelBlend*13)*portrait,0]);
 const ground=(x,z)=>hobby.room==='valley'?naturalH(x,z):hobby.scene.height(x,z);
 desired[1]=Math.max(desired[1],ground(desired[0],desired[2])+3.3);
 // Keep the line of sight above ridges without twitching at each terrain sample.
 for(let i=1;i<9;i++){const u=i/10,s=lerpV(target,desired,u),h=ground(s[0],s[2]);if(h>s[1]&&u>.20)desired[1]=Math.max(desired[1],target[1]+(h+1-target[1])/u);}
 cameraPos=lerpV(cameraPos,desired,1-Math.exp(-dt*1.45));cameraTarget=lerpV(cameraTarget,target,1-Math.exp(-dt*2.5));
 cameraNear=.10;cameraProjection=perspective(innerWidth<700?.78:.64,screenW/screenH,cameraNear,500);VP=mm(cameraProjection,lookAt(cameraPos,cameraTarget));
}

updateCamera=function(dt){
 if(hobby.cinema){cinemaCamera(dt);return;}
 if(hobby.room==='valley'||viewMode==='room'||viewMode==='overview'){baseHobbyCamera(dt);return;}
 const info=hobbyTrainInfo(),f=info.f,r=norm([f[2],0,-f[0]]),p=info.p,portrait=innerWidth<700?1.5:1;let pos,target=add(p,[0,.9,0]);
 if(viewMode==='station'){
  const train=hobby.scene.trains[0],station=circuitAt(train.edge,train.edge.length*.24);pos=add(add(station.p,mul(norm([station.f[2],0,-station.f[0]]),7)),[0,3.7,0]);target=station.p;
 }else if(viewMode==='cab'){pos=transform([.33,1.68,-.85],hobbyTrainMatrix());target=add(houseTrainAt(hobby.scene.trains[0],-7).p,[0,1.45,0]);}
 else if(viewMode==='engine'){
  // A raised front quarter keeps the wheels and body readable beside the scenery.
  const framing=/electric|railcar/i.test(hobbyTrainLabel().type||'')?1.16:1,scale=portrait*framing;
  pos=add(add(add(p,mul(r,5.8*scale)),mul(f,3*scale)),[0,3.5*scale,0]);
  const ground=hobby.scene.height(pos[0],pos[2]);if(Number.isFinite(ground))pos[1]=Math.max(pos[1],ground+2.2);
  const ceiling=pos[1]+5*portrait;let sightHeight=pos[1];
  // Sample terrain only. Bound the extra lift when a train passes into a mountain.
  for(let i=2;i<8;i++){const u=i/8,sample=lerpV(target,pos,u),height=hobby.scene.height(sample[0],sample[2]);if(Number.isFinite(height)&&height+.55>sample[1])sightHeight=Math.max(sightHeight,target[1]+(height+.55-target[1])/u);}
  pos[1]=Math.min(sightHeight,ceiling);
 }
 else {pos=add(add(add(p,mul(f,-10*portrait)),mul(r,8*portrait)),[0,6*portrait,0]);pos[1]=Math.max(pos[1],hobby.scene.height(pos[0],pos[2])+2);}
 cameraPos=lerpV(cameraPos,pos,1-Math.exp(-dt*2));
 if(viewMode==='engine'){const ground=hobby.scene.height(cameraPos[0],cameraPos[2]);if(Number.isFinite(ground))cameraPos[1]=Math.max(cameraPos[1],ground+1.6);}
 cameraTarget=lerpV(cameraTarget,target,1-Math.exp(-dt*3));cameraNear=.1;cameraProjection=perspective(viewMode==='cab'?.97:.74,screenW/screenH,cameraNear,500);VP=mm(cameraProjection,lookAt(cameraPos,cameraTarget));
};

updateUI=function(){
 baseHobbyUI();if(!hobby.ready)return;
 const room=HOUSE_ROOMS[hobby.room],stock=hobbyTrainLabel();$('currentRoomName').textContent=room.name;$('currentRoomNumber').textContent=room.number;$('houseMapButton').setAttribute('aria-label','Explore the hobby shop map. Current room: '+room.name);
 const electric=/electric|railcar/i.test(stock.type||'');
 $('cabMark').textContent=(electric?'IN THE CAB · ':'ON THE FOOTPLATE · ')+stock.name.toUpperCase()+(stock.number?' No. '+stock.number:'');$('cabMark').classList.toggle('show',viewMode==='cab');
 const engineTitle=document.querySelector('.engine-title'),label=JSON.stringify([stock.number,stock.name]);
 if(engineTitle.dataset.trainLabel!==label){
  engineTitle.dataset.trainLabel=label;engineTitle.replaceChildren();
  if(stock.number){const number=document.createElement('small');number.textContent='№ '+stock.number;engineTitle.append(number,document.createTextNode(' '));}
  engineTitle.append(document.createTextNode(stock.name));
 }
 if(hobby.room!=='valley'){
  const spot=hobby.scene.spots[hobby.spot];$('locationTitle').textContent=spot?spot.name:room.layout+'.';$('locationOverline').textContent=room.tag;$('locationDetail').textContent=spot?spot.detail:room.description;
  $('engineStatus').textContent=paused?'Taking a little breather':[stock.type,stock.service].filter(Boolean).join(' · ');
  $('speedValue').textContent=Math.round((paused?0:speed)*hobby.scene.trains[0].speed*8.073);$('runState').textContent=paused?'Railway paused':stock.service||'Scenic service';
 }
 $('lifeCount').textContent='A world quietly going about its day';
 if(hobby.cinema){$('cinemaPause').innerHTML=icon(paused?'play':'pause')+(paused?'Continue journey':'Pause journey');$('cinemaPause').setAttribute('aria-pressed',String(paused));const elapsed=Math.floor(roomClock-hobby.cinemaStart);$('cinemaTime').textContent=String(Math.floor(elapsed/60)).padStart(2,'0')+':'+String(elapsed%60).padStart(2,'0');}
};

function createHobbyUI(){
 const ui=document.createElement('div');ui.id='houseUI';ui.innerHTML=`
  <div class="house-wayfinding"><button id="houseMapButton" aria-controls="shopMapUI" aria-label="Explore the hobby shop map"><span class="house-map-icon"><svg viewBox="0 0 28 28" aria-hidden="true"><path d="M3 11 14 4l11 7v13H3Z M3 14h22M14 4v20M8 14v10M20 14v10M8 8v6M20 8v6"/></svg></span><span><small>EXPLORE THE HOUSE</small><strong id="currentRoomName">The Grand Hall</strong></span><span class="room-number" id="currentRoomNumber">01</span><span class="house-map-arrow">↗</span></button><span id="lifeCount" class="life-count"></span></div>
  <nav id="roomPlaces" class="room-places" aria-label="Little places in this room"></nav>
  <div class="immersion-entry"><button id="cinemaStart" aria-pressed="false">${icon('play')}<span>Slow cinema</span><kbd>C</kbd></button><button id="soundMixerButton" aria-label="Open soundscape mixer">${icon('sound')}</button></div>
  <section id="soundPanel" class="sound-panel" aria-label="Soundscape mixer" hidden><div class="sound-panel-top"><span class="eyebrow">A LITTLE LESS HURRY</span><button id="soundClose" aria-label="Close soundscape mixer">×</button></div><h2>The sound of being here.</h2><p>A quiet score, soft wheels, and a world going about its day.</p><button id="soundToggle" class="sound-enable" aria-pressed="false">Enable sound</button>
   <label for="musicMix"><span>Original score</span><output id="musicMixValue">40%</output></label><input id="musicMix" aria-label="Music volume" type="range" min="0" max="100" value="40">
   <label for="ambienceMix"><span>The world around you</span><output id="ambienceMixValue">47%</output></label><input id="ambienceMix" aria-label="Ambience volume" type="range" min="0" max="100" value="47">
   <label for="trainMix"><span>Steam & wheels</span><output id="trainMixValue">42%</output></label><input id="trainMix" aria-label="Train sounds volume" type="range" min="0" max="100" value="42">
   <button id="soundStatus" class="sound-status" title="Retry any unavailable sounds">Original music & ambience · ElevenLabs</button><small class="headphone-note">A little lovelier with headphones.</small>
  </section>
  <div id="roomTransition" class="room-transition" aria-hidden="true"><span id="transitionNumber">02</span><div class="eyebrow">WHISTLEVALE HOBBY HOUSE</div><h2 id="transitionName">The Coastal Gallery</h2><div class="transition-rule"></div></div>
 `;document.body.append(ui);
 const cinema=document.createElement('div');cinema.id='cinemaUI';cinema.innerHTML=`<div class="cinema-matte top"></div><div class="cinema-matte bottom"></div><span class="cinema-wordmark">WHISTLEVALE <i>A HOUSE OF LITTLE WORLDS</i></span><button id="cinemaExit">Leave cinema <kbd>Esc</kbd></button><div class="cinema-caption"><span id="cinemaSubtitle">THE LONG WAY HOME</span><h2 id="cinemaRoom">Alder Valley</h2><p>A small world. A slower pace.</p></div><div id="cinemaControls"><button id="cinemaPause">${icon('pause')}Pause journey</button><span class="cinema-separator"></span><label class="cinema-camera-label" for="cinemaShot">Camera</label><select id="cinemaShot" aria-label="Cinematic camera"><option value="drift">Gentle drift</option><option value="side">Alongside</option><option value="wide">Wide landscape</option><option value="tail">Following behind</option></select><button id="cinemaMute" aria-pressed="false">Sound on</button><button id="cinemaMix" aria-label="Adjust cinematic soundscape">${icon('settings')}</button></div><div class="cinema-session"><span class="cinema-live-dot"></span>NOWHERE ELSE TO BE <time id="cinemaTime">00:00</time></div>`;document.body.append(cinema);
 $('houseMapButton').onclick=()=>openHouseMap();$('cinemaStart').onclick=enterCinema;$('cinemaExit').onclick=()=>leaveCinema();$('cinemaPause').onclick=togglePause;
 $('cinemaShot').onchange=e=>{hobby.shot=e.target.value;wakeCinema();};$('cinemaMute').onclick=()=>enableSound();
 let soundOpener=null;
 const showSound=e=>{
  const show=$('soundPanel').hidden;$('soundPanel').hidden=!show;
  if(show){
   soundOpener=e?.currentTarget;$('ambiencePanel').hidden=true;$('layoutPanel').hidden=true;$('ambienceBtn').setAttribute('aria-expanded','false');
   if($('playlistPanel'))$('playlistPanel').hidden=true;
   $('playlistBtn')?.setAttribute('aria-expanded','false');$('playlistBtn')?.classList.remove('on');
   $('soundClose').focus();wakeCinema();
  }
 };
 const atmosphereMixer=document.createElement('button');atmosphereMixer.id='atmosphereSoundMixer';atmosphereMixer.className='atmosphere-mixer';atmosphereMixer.innerHTML=icon('sound')+'Music & soundscape'+icon('settings');atmosphereMixer.onclick=showSound;
 $('ambiencePanel').insertBefore(atmosphereMixer,$('ambiencePanel').querySelector('.tiny-info'));
 const closeSound=()=>{$('soundPanel').hidden=true;if(hobby.cinema)$('cinemaMix').focus();else if(soundOpener===atmosphereMixer)$('ambienceBtn').focus();else $('soundMixerButton').focus();};
 $('soundMixerButton').onclick=showSound;$('cinemaMix').onclick=showSound;$('soundClose').onclick=closeSound;$('soundToggle').onclick=()=>enableSound();$('soundStatus').onclick=()=>{if(!audio?.active)enableSound(true);else soundscape?.retry();};
 for(const [id,key]of[['musicMix','music'],['ambienceMix','ambience'],['trainMix','train']]){
  $(id).style.setProperty('--fill',$(id).value+'%');$(id).oninput=e=>{if(!audio?.active)enableSound(true);if(soundscape)soundscape[key]=Number(e.target.value)/100;$(id+'Value').textContent=e.target.value+'%';$(id).style.setProperty('--fill',e.target.value+'%');};
 }
 document.addEventListener('pointermove',wakeCinema,{passive:true});document.addEventListener('pointerdown',wakeCinema,{passive:true});
 document.addEventListener('keydown',e=>{
  if(e.defaultPrevented||e.isComposing)return;
  if(document.querySelector('dialog[open]'))return;
  // A focused fader can close its mixer without also leaving cinema behind it.
  if(e.key==='Escape'&&!$('soundPanel').hidden){e.preventDefault();e.stopImmediatePropagation();closeSound();return;}
  if(e.target.matches('input,textarea,select')||e.metaKey||e.ctrlKey||e.altKey||building)return;
  if(e.key==='Escape'){if(hobby.cinema){e.preventDefault();leaveCinema();}}
  else if(e.key.toLowerCase()==='c'){e.preventDefault();hobby.cinema?leaveCinema():enterCinema();}
  else if(e.key.toLowerCase()==='g'){e.preventDefault();openHouseMap();}
 });
 // Keep older keyboard shortcuts from changing the view behind the cinema UI.
 window.addEventListener('keydown',e=>{if(!hobby.cinema||e.target.matches('input,textarea,select'))return;if(['1','2','3','4','5','6','f','p','m','r','s'].includes(e.key.toLowerCase())){e.preventDefault();e.stopImmediatePropagation();}},true);
 const hint=document.querySelector('.key-hint');if(hint)hint.innerHTML='Drag to explore · Scroll to get closer <span class="desktop"> · <b>G</b> Shop map · <b>C</b> Slow cinema · <b>H</b> Whistle</span>';
}

// Exports stay portable even though the editable source is split into files.
exportPlayable=async function(){
 try{
  toast('Packing your little world, including its soundtrack…');const source=document.documentElement.cloneNode(true);
  for(const node of source.querySelectorAll('script[src]')){const r=await fetch(node.getAttribute('src'));if(!r.ok)throw new Error('Could not pack a script');node.textContent=(await r.text()).replace(/<\/script/gi,'<\\/script');node.removeAttribute('src');}
  for(const node of source.querySelectorAll('link[rel=stylesheet]')){const r=await fetch(node.getAttribute('href'));if(!r.ok)throw new Error('Could not pack styles');const style=document.createElement('style');style.textContent=await r.text();node.replaceWith(style);}
  for(const node of source.querySelectorAll('link[rel~="icon"]')){const href=node.getAttribute('href');if(!href||href.startsWith('data:'))continue;const r=await fetch(href);if(!r.ok)throw new Error('Could not pack the shop icon');node.setAttribute('href','data:image/svg+xml;charset=utf-8,'+encodeURIComponent(await r.text()));}
  const embedded={};await Promise.all(AUDIO_ASSETS.filter(houseRecordingAvailable).map(async id=>{if(window.HOUSE_EMBEDDED_AUDIO?.[id]){embedded[id]=window.HOUSE_EMBEDDED_AUDIO[id];return;}const response=await fetch('assets/audio/'+id+'.mp3');if(!response.ok)throw new Error('Could not pack audio');const blob=await response.blob();embedded[id]=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});}));
  // Replace the prior audio payload when repacking an already portable world.
  for(const node of source.querySelectorAll('script'))if(node.id==='embeddedHouseAudio'||/^\s*window\.HOUSE_EMBEDDED_AUDIO\s*=/.test(node.textContent))node.remove();
  const embed=document.createElement('script');embed.id='embeddedHouseAudio';embed.textContent='window.HOUSE_EMBEDDED_AUDIO='+JSON.stringify(embedded)+';';source.querySelector('head').append(embed);
  const catalog=source.querySelector('#audioCatalog')||document.createElement('script');catalog.id='audioCatalog';catalog.textContent='window.HOUSE_AUDIO_AVAILABLE='+JSON.stringify(Object.keys(embedded))+';';if(!catalog.parentNode)source.querySelector('head').append(catalog);
  source.querySelector('#embeddedLayout').textContent=JSON.stringify(snapshot()).replace(/</g,'\\u003c');source.querySelector('#loader').classList.remove('done');
  for(const selector of['#houseUI','#cinemaUI','#houseMap','#shopMapUI','#playlistPanel','#playlistBtn','#playlistStyle','#atmosphereSoundMixer'])source.querySelector(selector)?.remove();
  for(const node of source.querySelectorAll('dialog'))node.removeAttribute('open');for(const id of['builderUI','trainInspector','projectMenu','workshopBusy','worldTip'])source.querySelector('#'+id).hidden=true;
  // A new runtime starts running at its default throttle, with sound off.
  // Saved preferences can then update these controls together during startup.
  const soundButton=source.querySelector('#audioBtn');soundButton.classList.remove('on');soundButton.setAttribute('aria-pressed','false');soundButton.setAttribute('aria-label','Enable railway sounds');soundButton.querySelector('use').setAttribute('href','#i-mute');
  const playButton=source.querySelector('#playBtn');playButton.classList.remove('active');playButton.setAttribute('aria-pressed','false');playButton.setAttribute('aria-label','Pause the railway');playButton.querySelector('use').setAttribute('href','#i-pause');
  const regulator=source.querySelector('#throttle');regulator.value='42';regulator.setAttribute('value','42');regulator.style.setProperty('--fill','42%');source.querySelector('#throttleValue').textContent='42%';
  const notice=source.querySelector('#toast');notice.classList.remove('show');notice.textContent='';
  source.querySelector('body').className='';source.querySelector('#error').removeAttribute('style');exportBlob('<!DOCTYPE html>\n'+source.outerHTML,'text/html','whistlevale.html');$('projectMenu').hidden=true;toast('Your hobby house is packed, soundtrack and all.');
 }catch(error){console.error(error);toast('Could not pack the full house. Export the layout JSON to keep your edits.');}
};

function startHouse(){
 createHobbyUI();baseHobbyStart();
 if(!window.READY)return;
 const atmosphereClick=$('ambienceBtn').onclick;
 $('ambienceBtn').onclick=e=>{atmosphereClick(e);$('soundPanel').hidden=true;if($('playlistPanel'))$('playlistPanel').hidden=true;$('playlistBtn')?.setAttribute('aria-expanded','false');$('playlistBtn')?.classList.remove('on');};
 try{
  initHouseArt();hobby.life=buildValleyLife();initWalkingFigures();if(typeof initHouseMap==='function')initHouseMap();hobby.ready=true;shadowDirty=true;updateUI();
  window.HOBBY_HOUSE={visit:visitHouseRoom,cinema:enterCinema,leaveCinema,openMap:()=>openHouseMap(),get state(){return{room:hobby.room,ready:hobby.ready,cinema:hobby.cinema,shot:hobby.shot,paused,throttle,population:hobby.room==='valley'?hobby.life.population:hobby.scene.population,walking:hobby.room==='valley'?hobby.life.actors.length:hobby.scene.actors.length,roomsLoaded:[...roomScenes.keys()],audio:soundscape?{loaded:soundscape.loaded,on:soundscape.on,buffers:[...soundscape.buffers.keys()],failed:soundscape.failed.slice(),context:soundscape.ctx.state,music:soundscape.music,ambience:soundscape.ambience,train:soundscape.train}:null,cam:cameraPos.slice(),target:cameraTarget.slice(),train:hobbyTrainInfo().p.slice(),sceneTriangles:hobby.scene?hobby.scene.mesh.count/3:staticMesh.count/3,frame}}};
  document.body.dataset.room='valley';const initialRoom=new URLSearchParams(location.search).get('room');if(initialRoom&&HOUSE_ROOMS[initialRoom]&&initialRoom!=='valley')visitHouseRoom(initialRoom);
 }catch(error){console.error(error);$('error').style.display='block';$('error').textContent='The hobby house could not finish opening: '+error.message;}
}
setTimeout(startHouse,50);
