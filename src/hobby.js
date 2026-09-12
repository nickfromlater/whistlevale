'use strict';

const hobby={room:'valley',life:null,ready:false,cinema:false,shot:'drift',scene:null,spot:-1,transition:false,cinemaStart:0,heading:[0,0,1],saved:null,transitionTimer:null};
const baseHobbyStart=start,baseHobbySetView=setView,baseHobbyCamera=updateCamera,baseHobbySimulation=updateSimulation,baseHobbyUI=updateUI,baseHobbyBuild=enterBuild,baseManualOrbit=beginManualOrbit;
const icon=(name)=>`<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;

// Observe navigation boundaries only; analytics never samples the renderer.
function syncHouseAnalytics(){
 try{window.railwayAnalytics?.sync({ready:hobby.ready&&!hobby.transition,room:Object.hasOwn(HOUSE_ROOMS,hobby.room)?hobby.room:null,cinema:hobby.cinema,map:typeof shopMap!=='undefined'&&shopMap.open});}catch{}
}

const hobbyGuestTrain=()=>typeof embeddedTrainInfo==='function'?embeddedTrainInfo():null;
function hobbyHasNativeTrain(){return hobby.room==='valley'||!!hobby.scene?.trains.length;}
function hobbyHasTrain(){return hobbyHasNativeTrain()||!!hobbyGuestTrain();}
function hobbyTrainInfo(){
 if(hobby.room==='valley'||!hobby.scene)return leadInfo;
 // A guest room's railway runs inside the guest's own scene; its pose arrives
 // already converted into house coordinates.
 const guest=hobbyGuestTrain();if(guest)return guest;
 return hobby.scene.trains.length?houseTrainAt(hobby.scene.trains[0]):{p:HOUSE_ROOMS[hobby.room].target,f:[0,0,1]};
}
function hobbyTrainMatrix(){return hobby.room==='valley'||!hobby.scene?trainModels[0]:hobby.scene.trains.length?circuitMatrix(hobby.scene.trains[0].edge,hobby.scene.trains[0].distance):I;}
function hobbyTrainInTunnel(){return hobby.room==='valley'&&leadInfo&&inTunnel(leadInfo.edge,leadInfo.d,2);}
function hobbyTrainLabel(key=hobby.room){
 if(typeof collectionTrainLabel==='function')return collectionTrainLabel(key);
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
 if(!hobbyHasNativeTrain())return;
 if(hobby.room==='valley'){if(typeof collectionPower!=='function'||collectionPower('valley')==='steam')drawSteam();return;}
 // Reuse the steam system at the active exhibit locomotive, including room dust.
 const savedSteam=steam.map(p=>p.p),source=trainModels[0],destination=hobbyTrainMatrix();
 const origin=transform([0,1.7,1.03],source),target=transform([0,1.7,1.03],destination);
 if(hobby.scene.trains[0].type==='steam'){steam.forEach((s,i)=>{s.p=add(savedSteam[i],sub(target,origin));});drawSteam();steam.forEach((s,i)=>{s.p=savedSteam[i];});}
}

function houseOrbit(room,close=false){
 const q=HOUSE_ROOMS[room],phone=innerWidth<700;
 orbit.target=q.target.slice();orbit.distance=(phone?(q.phoneDistance??q.distance*1.78):q.distance)*(close?.82:1);orbit.pitch=phone?Math.max(.74,q.pitch):q.pitch;orbit.yaw=phone?.12:q.yaw;
}

setView=function(mode,announce=true){
 if(hobby.cinema)leaveCinema(false);
 if(hobby.room==='valley'){baseHobbySetView(mode,announce);return;}
 if(!hobbyHasNativeTrain()&&!['room','overview','tour','follow'].includes(mode))mode='overview';
 viewMode=mode;currentPlace='';
 if(mode==='room'||mode==='overview')houseOrbit(hobby.room,mode==='overview');
 if(mode==='tour'){enterCinema();return;}
 document.body.classList.toggle('train-focus',mode==='engine');$('trainInspector').hidden=true;
 for(const b of document.querySelectorAll('button[data-camera]')){b.classList.toggle('selected',b.dataset.camera===mode);b.setAttribute('aria-pressed',String(b.dataset.camera===mode));}
 updateUI();
};
enterBuild=function(on=true){
 if(typeof closeQuietControls==='function')closeQuietControls();
 if(hobby.cinema)leaveCinema(false);
 if(on&&hobby.room!=='valley'){visitHouseRoom('valley',()=>baseHobbyBuild(true));return;}
 baseHobbyBuild(on);shadowDirty=true;
};
beginManualOrbit=function(){if(hobby.cinema){beginCinemaOrbit();return;}baseManualOrbit();};

// Shared synchronous entry. The caller owns map state, fades and error handling.
// Resolve geometry first so a failed room build leaves the active room intact.
function activateHouseRoom(key){
 if(!HOUSE_ROOMS[key])throw new Error('Unknown hobby house room: '+key);
 const scene=key==='valley'?null:getHouseScene(key);
 if(typeof closeQuietControls==='function')closeQuietControls();
 if(building)baseHobbyBuild(false);if(hobby.cinema)leaveCinema(false);
 hobby.room=key;hobby.scene=scene;hobby.spot=-1;
 if(typeof embeddedEnter==='function')embeddedEnter(key);
 syncRoomControls();
 document.body.classList.toggle('annex',key!=='valley');document.body.dataset.room=key;shadowDirty=true;
 setView('room',false);houseOrbit(key);cameraTarget=orbit.target.slice();cameraPos=add(orbit.target,[Math.sin(orbit.yaw)*Math.cos(orbit.pitch)*orbit.distance,Math.sin(orbit.pitch)*orbit.distance,Math.cos(orbit.yaw)*Math.cos(orbit.pitch)*orbit.distance]);
 renderRoomPlaces();updateUI();
 $('layoutPanel').hidden=true;$('ambiencePanel').hidden=true;
 try{sessionStorage.setItem('hobby-house-room',key);const url=new URL(location.href);url.searchParams.set('room',key);window.history.replaceState(null,'',url);}catch{}
 syncHouseAnalytics();return scene;
}

function visitHouseDestination(key){
 const path=HOUSE_ROOMS[key]?.map?.destination;if(!path)return false;
 if(path==='grandhall.html'&&typeof window.HOUSE_EMBEDDED_HALL==='string'&&window.HOUSE_EMBEDDED_HALL){
  const safe=value=>JSON.stringify(value).replace(/</g,'\\u003c');
  const catalogue=typeof communityCatalogue==='undefined'?null:communityCatalogue,roomNames=Object.fromEntries(Object.entries(HOUSE_ROOMS).map(([id,room])=>[id,room.name]));
  const film=typeof moonlightExportPreferences==='function'?moonlightExportPreferences():{};
  const context='<script>window.HOUSE_RETURN_URL='+safe(location.href)+';window.HOUSE_HALL_FROM='+safe(hobby.room)+';window.HOUSE_ROOM_NAMES='+safe(roomNames)+';window.HOUSE_COMMUNITY='+safe(catalogue)+';window.HOUSE_EMBEDDED_MEDIA='+safe(window.HOUSE_EMBEDDED_MEDIA||{})+';window.HOUSE_EMBEDDED_MOONLIGHT='+safe(film)+';</script>';
  const html=window.HOUSE_EMBEDDED_HALL.replace(/<head\b[^>]*>/i,head=>head+context);
  const url=URL.createObjectURL(new Blob([html],{type:'text/html'}));location.assign(url);return true;
 }
 const url=new URL(path,location.href);if(url.origin!==location.origin)throw new Error('House destinations must stay on this site.');
 url.searchParams.set('from',hobby.room);location.assign(url.href);return true;
}

function visitHouseRoom(key,after){
 if(!HOUSE_ROOMS[key]||hobby.transition)return;
 if(visitHouseDestination(key))return;
 if(typeof closeHouseMap==='function')closeHouseMap();
 if(key===hobby.room){setView('room',false);after?.();return;}
 if(building)baseHobbyBuild(false);if(hobby.cinema)leaveCinema(false);
 hobby.transition=true;syncHouseAnalytics();$('roomTransition').classList.add('visible');$('transitionNumber').textContent=HOUSE_ROOMS[key].number;$('transitionName').textContent=HOUSE_ROOMS[key].name;
 setTimeout(()=>{
  try{
   activateHouseRoom(key);
  }catch(error){console.error(error);toast('This room could not open. Please try again.');}
  requestAnimationFrame(()=>{requestAnimationFrame(()=>{$('roomTransition').classList.remove('visible');hobby.transition=false;after?.();syncHouseAnalytics();});});
 },reduceMotion?0:260);
}

function renderRoomPlaces(){
 const container=$('roomPlaces');container.replaceChildren();
 const places=hobby.room==='valley'?communityWorkshopPlaces():hobby.scene.spots;
 for(const [i,spot]of places.entries()){
  const button=document.createElement('button');button.textContent=spot.name;button.onclick=()=>{
   if(hobby.room==='valley'){if(hobby.cinema)leaveCinema(false);focusHouseWork(spot.contribution,spot.placement);return;}
   if(hobby.cinema)leaveCinema(false);viewMode='overview';hobby.spot=i;orbit.target=spot.target.slice();orbit.distance=innerWidth<700?(spot.phoneDistance??(spot.distance??HOUSE_ROOMS[hobby.room].distance)*1.7):(spot.distance??HOUSE_ROOMS[hobby.room].distance);orbit.pitch=spot.pitch??HOUSE_ROOMS[hobby.room].pitch;orbit.yaw=spot.yaw??HOUSE_ROOMS[hobby.room].yaw;
   for(const b of container.querySelectorAll('button'))b.classList.toggle('chosen',b===button);updateUI();
  };container.append(button);
  if(hobby.room==='valley'&&spot.contribution==='moonlight-drive-in'){
   const programme=document.createElement('button');programme.type='button';programme.textContent='Programme & booth';programme.dataset.moonlightOpener='';programme.dataset.quietOpener='';programme.setAttribute('aria-controls','moonlightPanel');programme.setAttribute('aria-expanded','false');
   programme.onclick=()=>{focusHouseWork(spot.contribution,spot.placement);openQuietPanel('moonlightPanel',programme);};container.append(programme);
  }
 }
}

function renderMoonlightProgramme(){
 const host=$('moonlightProgramme');if(!host||!houseMoonlight)return;
 if(!host.querySelector('[data-moonlight-programme]'))host.append(houseMoonlight.createProgramme({onBoothView:focusMoonlightBooth}));
}

function focusMoonlightBooth(){
 const work=objects.find(o=>o.type==='moonlight'&&o.contribution==='moonlight-drive-in');if(!work)return;
 focusHouseWork(work.contribution,work.placement??0);
 orbit.target=transform([-.6*.32,2.15*.32,12.20*.32],objectMatrix(work));orbit.distance=innerWidth<700?5.5:4;orbit.yaw=work.angle+.14;orbit.pitch=.20;
 closeQuietControls(true);
}

function syncRoomControls(){
 const railway=hobbyHasNativeTrain();document.body.classList.toggle('landscape-room',!railway);
 $('railControls').setAttribute('aria-label',railway?'Railway controls':'Landscape controls');
 $('buildMode').querySelector('span').textContent=hobby.room==='valley'?'Build your railway':'Build in Alder Valley';
 for(const id of['trainBtn','playBtn','cinemaPause'])$(id).hidden=!railway;
 for(const button of document.querySelectorAll('button[data-camera]'))button.hidden=!railway&&!['room','overview','tour'].includes(button.dataset.camera);
 const names=(typeof embeddedProject==='function'&&embeddedProject(hobby.room)?.cinemaLabels)|| (railway?['Gentle drift','Alongside','Wide landscape','Following behind']:['Gentle drift','Closer view','Wide landscape','Room view']);
 for(const [i,option]of [...$('cinemaShot').options].entries())option.textContent=names[i];
}

function enterCinema(){
 if(hobby.cinema||!hobby.ready)return;if(building)baseHobbyBuild(false);
 if(typeof closeQuietControls==='function')closeQuietControls();
 hobby.saved={throttle,paused,view:viewMode,target:orbit.target.slice(),distance:orbit.distance,pitch:orbit.pitch,yaw:orbit.yaw};
 hobby.cinema=true;resumeCinemaCamera();hobby.cinemaStart=roomClock;hobby.heading=hobbyTrainInfo().f.slice();hobby.tunnelBlend=hobbyTrainInTunnel()?1:0;hobby.shotBlend={side:9,back:-14,height:8.5};
 viewMode='cinema';document.body.classList.add('cinematic');document.body.classList.remove('hidden-ui','train-focus');hidden=false;
 $('trainInspector').hidden=true;$('ambiencePanel').hidden=true;$('layoutPanel').hidden=true;
 if(hobbyHasNativeTrain()){setThrottle(Math.min(throttle||28,28));if(paused)togglePause();}if(!audio?.active)enableSound(true);
 $('cinemaRoom').textContent=HOUSE_ROOMS[hobby.room].layout;$('cinemaSubtitle').textContent=HOUSE_ROOMS[hobby.room].tag;
 $('cinemaStart').setAttribute('aria-pressed','true');$('cinemaExit').focus();wakeCinema();syncHouseAnalytics();
}
function leaveCinema(restore=true){
 if(!hobby.cinema)return;clearCinemaPointers();cinemaOrbit.manual=null;clearTimeout(cinemaIdleTimer);hobby.cinema=false;document.body.classList.remove('cinematic','cinema-idle');$('cinemaStart').setAttribute('aria-pressed','false');
 const saved=hobby.saved;hobby.saved=null;
 if(saved){setThrottle(saved.throttle);if(paused!==saved.paused)togglePause();viewMode=saved.view==='cinema'?'room':saved.view;Object.assign(orbit,{target:saved.target,distance:saved.distance,pitch:saved.pitch,yaw:saved.yaw});}
 else viewMode='room';
 if(restore){$('cinemaStart').focus();updateUI();}
 syncHouseAnalytics();
}
let cinemaIdleTimer=0;
function wakeCinema(){if(!hobby.cinema)return;document.body.classList.remove('cinema-idle');clearTimeout(cinemaIdleTimer);cinemaIdleTimer=setTimeout(()=>{if(hobby.cinema&&$('soundPanel').hidden&&!document.querySelector('#cinemaControls :focus-visible'))document.body.classList.add('cinema-idle');},5500);}

// Cinema has its own gesture state: adjusting the frame must not restore the
// pre-cinema throttle, pause state or room camera. The train remains the anchor.
const cinemaOrbit={manual:null,pointers:new Map(),origin:null};
function beginCinemaOrbit(){
 if(cinemaOrbit.manual)return cinemaOrbit.manual;
 const delta=sub(cameraPos,cameraTarget),distance=Math.max(.1,len(delta));
 cinemaOrbit.manual={offset:sub(cameraTarget,hobbyTrainInfo().p),distance,yaw:Math.atan2(delta[0],delta[2]),pitch:Math.asin(clamp(delta[1]/distance,-1,1))};
 $('cinemaShot').hidden=true;$('cinemaCameraLabel').hidden=true;$('cinemaAuto').hidden=false;wakeCinema();
 window.railwayAnalytics?.control('camera_manual');return cinemaOrbit.manual;
}
function clearCinemaPointers(){
 const ids=[...cinemaOrbit.pointers.keys()];cinemaOrbit.pointers.clear();cinemaOrbit.origin=null;
 for(const id of ids)if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);
 canvas.style.cursor='';
}
function resumeCinemaCamera(){
 if(cinemaOrbit.manual)window.railwayAnalytics?.control('camera_auto');
 clearCinemaPointers();cinemaOrbit.manual=null;
 const restoreFocus=document.activeElement===$('cinemaAuto');
 $('cinemaAuto').hidden=true;$('cinemaShot').hidden=false;$('cinemaCameraLabel').hidden=false;
 if(restoreFocus)$('cinemaShot').focus();wakeCinema();
}
function bindCinemaCamera(){
 const block=e=>{e.preventDefault();e.stopImmediatePropagation();};
 // Capture before the canvas's normal orbit/editor listeners, as the map does.
 window.addEventListener('pointerdown',e=>{
  if(!hobby.cinema||e.target!==canvas)return;block(e);wakeCinema();
  if(e.button!==0||cinemaOrbit.pointers.size>=2)return;
  if(typeof closeQuietControls==='function')closeQuietControls();
  canvas.focus({preventScroll:true});canvas.setPointerCapture(e.pointerId);
  cinemaOrbit.pointers.set(e.pointerId,[e.clientX,e.clientY]);
  cinemaOrbit.origin=[e.clientX,e.clientY];canvas.style.cursor='grabbing';
 },true);
 window.addEventListener('pointermove',e=>{
  if(!hobby.cinema||e.target!==canvas)return;wakeCinema();
  const previous=cinemaOrbit.pointers.get(e.pointerId);if(!previous)return;block(e);
  const next=[e.clientX,e.clientY],other=[...cinemaOrbit.pointers].find(([id])=>id!==e.pointerId)?.[1];
  if(other){
   const before=Math.hypot(previous[0]-other[0],previous[1]-other[1]),after=Math.hypot(next[0]-other[0],next[1]-other[1]);
   if(before>8&&after>8&&Math.abs(after-before)>.1){const orbit=beginCinemaOrbit();orbit.distance=clamp(orbit.distance*before/after,6,hobbyHasTrain()?180:360);}
  }else{
   if(cinemaOrbit.origin&&Math.hypot(next[0]-cinemaOrbit.origin[0],next[1]-cinemaOrbit.origin[1])<4)return;
   cinemaOrbit.origin=null;const orbit=beginCinemaOrbit();
   orbit.yaw-=(next[0]-previous[0])*.0048;orbit.pitch=clamp(orbit.pitch+(next[1]-previous[1])*.0036,.08,1.43);
  }
  cinemaOrbit.pointers.set(e.pointerId,next);
 },true);
 const release=e=>{
  if(!cinemaOrbit.pointers.has(e.pointerId))return;block(e);
  cinemaOrbit.pointers.delete(e.pointerId);
  if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
  // Rebase the remaining finger after a pinch instead of reusing the first drag.
  cinemaOrbit.origin=cinemaOrbit.pointers.values().next().value||null;
  if(!cinemaOrbit.pointers.size)canvas.style.cursor='';
 };
 for(const type of['pointerup','pointercancel','lostpointercapture'])window.addEventListener(type,release,true);
 window.addEventListener('wheel',e=>{
  if(!hobby.cinema||e.target!==canvas)return;block(e);wakeCinema();if(!e.deltaY)return;
  const orbit=beginCinemaOrbit(),pixels=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1);
  orbit.distance=clamp(orbit.distance*Math.exp(clamp(pixels,-160,160)*.0015),6,hobbyHasTrain()?180:360);
 },{capture:true,passive:false});
 for(const type of['click','dblclick','contextmenu'])window.addEventListener(type,e=>{if(hobby.cinema&&e.target===canvas)block(e);},true);
 window.addEventListener('keydown',e=>{
  if(!hobby.cinema||e.target!==canvas||e.ctrlKey||e.metaKey||e.altKey)return;
  const key=e.key;if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','0'].includes(key))return;
  block(e);if(key==='0'){resumeCinemaCamera();return;}const orbit=beginCinemaOrbit();
  if(key==='ArrowLeft'||key==='ArrowRight')orbit.yaw+=key==='ArrowLeft'?.08:-.08;
  else if(key==='ArrowUp'||key==='ArrowDown')orbit.pitch=clamp(orbit.pitch+(key==='ArrowUp'?-.06:.06),.08,1.43);
  else orbit.distance=clamp(orbit.distance*(key==='-'?1.1:1/1.1),6,hobbyHasTrain()?180:360);
  wakeCinema();
 },true);
 window.addEventListener('blur',clearCinemaPointers);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)clearCinemaPointers();});
}

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
 const manual=cinemaOrbit.manual;let target=manual?add(p,manual.offset):add(add(p,mul(f,-3.0)),[0,1.1,0]);
 let desired=add(add(add(p,mul(f,a.back*portrait)),mul(r,a.side*portrait)),[0,(a.height+hobby.tunnelBlend*13)*portrait,0]);
 const guestShot=!manual&&typeof embeddedCinemaView==='function'&&embeddedCinemaView(hobby.shot,elapsed);
 if(guestShot){target=guestShot.target;desired=guestShot.position;}
 else if(!hobbyHasTrain()){
  const angle=.35+(reduceMotion?0:Math.sin(elapsed*.025)*.13),distance=(hobby.shot==='wide'?94:hobby.shot==='side'?61:hobby.shot==='tail'?120:73)*portrait;
  desired=add(p,[Math.sin(angle)*distance,.62*distance,Math.cos(angle)*distance]);
 }
 if(manual){const {yaw,pitch,distance}=manual;desired=add(target,[Math.sin(yaw)*Math.cos(pitch)*distance,Math.sin(pitch)*distance,Math.cos(yaw)*Math.cos(pitch)*distance]);}
 const ground=(x,z)=>hobby.room==='valley'?naturalH(x,z):hobby.scene.height(x,z);
 desired[1]=Math.max(desired[1],ground(desired[0],desired[2])+3.3);
 // Keep the line of sight above ridges without twitching at each terrain sample.
 for(let i=1;i<9;i++){const u=i/10,s=lerpV(target,desired,u),h=ground(s[0],s[2]);if(h>s[1]&&u>.20)desired[1]=Math.max(desired[1],target[1]+(h+1-target[1])/u);}
 cameraPos=lerpV(cameraPos,desired,1-Math.exp(-dt*(manual?10:1.45)));cameraTarget=lerpV(cameraTarget,target,1-Math.exp(-dt*(manual?10:2.5)));
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
 if(typeof isShopMapActive==='function'&&isShopMapActive())return;
 baseHobbyUI();if(!hobby.ready)return;
 const room=HOUSE_ROOMS[hobby.room],stock=hobbyTrainLabel();$('currentRoomName').textContent=room.name.replace(/^The /,'');$('currentRoomNumber').textContent=room.number;$('houseMapButton').setAttribute('aria-label','Switch room. Current room: '+room.name);
 const electric=typeof collectionPower==='function'?collectionPower(hobby.room)!=='steam':/electric|railcar/i.test(stock.type||'');
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
  $('speedValue').textContent=Math.round((paused?0:speed)*(hobby.scene.trains[0]?.speed??0)*8.073);$('runState').textContent=hobbyHasTrain()?(paused?'Railway paused':stock.service||'Scenic service'):'A landscape to explore';
 }
 if(typeof collectionPower==='function'){
  const steamTrain=collectionPower(hobby.room)==='steam';
  $('whistleBtn').querySelector('span').textContent=steamTrain?'Whistle':'Horn';$('whistleBtn').title=steamTrain?'Sound the whistle (H)':'Sound the horn (H)';
  if(hobby.room==='valley'&&!paused&&!atStation&&!stopRequested)$('engineStatus').textContent=stock.type+' · '+stock.service;
  const throttleMeta=document.querySelector('.throttle-meta span:last-child');if(throttleMeta)throttleMeta.textContent=steamTrain?'Full steam':'Full power';
 }
 $('lifeCount').textContent='A world quietly going about its day';
 if(hobby.cinema){$('cinemaPause').innerHTML=icon(paused?'play':'pause')+(paused?'Continue journey':'Pause journey');$('cinemaPause').setAttribute('aria-pressed',String(paused));const elapsed=Math.floor(roomClock-hobby.cinemaStart);$('cinemaTime').textContent=String(Math.floor(elapsed/60)).padStart(2,'0')+':'+String(elapsed%60).padStart(2,'0');}
};

function createHobbyUI(){
 const ui=document.createElement('div');ui.id='houseUI';ui.innerHTML=`
  <div class="house-wayfinding"><button id="houseMapButton" aria-controls="shopMapUI" aria-label="Switch room" title="Explore the house and choose another room"><span class="house-map-icon"><svg viewBox="0 0 28 28" aria-hidden="true"><path d="M3 11 14 4l11 7v13H3Z M3 14h22M14 4v20M8 14v10M20 14v10M8 8v6M20 8v6"/></svg></span><span class="room-switch-copy"><span class="room-switch-label">Switch room</span><strong id="currentRoomName">Alder Valley</strong></span><span class="room-number" id="currentRoomNumber" aria-hidden="true">01</span><svg class="room-switch-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5"/></svg></button><span id="lifeCount" class="life-count"></span></div>
  <div class="immersion-entry"><button id="cinemaStart" aria-pressed="false">${icon('play')}<span>Slow cinema</span><kbd>C</kbd></button><button id="soundMixerButton" aria-label="Open soundscape mixer">${icon('sound')}</button></div>
  <section id="soundPanel" class="sound-panel" aria-label="Soundscape mixer" hidden><div class="sound-panel-top"><span class="eyebrow">A LITTLE LESS HURRY</span><button id="soundClose" aria-label="Close soundscape mixer">×</button></div><h2>The sound of being here.</h2><p>A quiet score, soft wheels, and a world going about its day.</p><button id="soundToggle" class="sound-enable" aria-pressed="false">Enable sound</button>
   <label for="musicMix"><span>Original score</span><output id="musicMixValue">40%</output></label><input id="musicMix" aria-label="Music volume" type="range" min="0" max="100" value="40">
   <label for="ambienceMix"><span>The world around you</span><output id="ambienceMixValue">47%</output></label><input id="ambienceMix" aria-label="Ambience volume" type="range" min="0" max="100" value="47">
   <label for="trainMix"><span>Steam & wheels</span><output id="trainMixValue">42%</output></label><input id="trainMix" aria-label="Train sounds volume" type="range" min="0" max="100" value="42">
   <button id="soundStatus" class="sound-status" title="Retry any unavailable sounds">Original music & ambience · ElevenLabs</button><small class="headphone-note">A little lovelier with headphones.</small>
  </section>
  <div id="roomTransition" class="room-transition" aria-hidden="true"><span id="transitionNumber">02</span><div class="eyebrow">WHISTLEVALE HOBBY HOUSE</div><h2 id="transitionName">The Coastal Gallery</h2><div class="transition-rule"></div></div>
 `;document.body.append(ui);
 const cinema=document.createElement('div');cinema.id='cinemaUI';cinema.innerHTML=`<div class="cinema-matte top"></div><div class="cinema-matte bottom"></div><span class="cinema-wordmark">WHISTLEVALE <i>A HOUSE OF LITTLE WORLDS</i></span><button id="cinemaExit">Leave cinema <kbd>Esc</kbd></button><div class="cinema-caption"><span id="cinemaSubtitle">THE LONG WAY HOME</span><h2 id="cinemaRoom">Alder Valley</h2><p class="cinema-camera-hint">Drag to look around · Scroll or pinch to zoom</p></div><div id="cinemaControls"><button id="cinemaPause">${icon('pause')}Pause journey</button><span class="cinema-separator"></span><label id="cinemaCameraLabel" class="cinema-camera-label" for="cinemaShot">Camera</label><select id="cinemaShot" aria-label="Cinematic camera"><option value="drift">Gentle drift</option><option value="side">Alongside</option><option value="wide">Wide landscape</option><option value="tail">Following behind</option></select><button id="cinemaAuto" title="Resume the automatic camera" hidden>Auto camera</button><button id="cinemaMute" aria-pressed="false">Sound on</button><button id="cinemaMix" aria-label="Adjust cinematic soundscape">${icon('settings')}</button></div><div class="cinema-session"><span class="cinema-live-dot"></span>NOWHERE ELSE TO BE <time id="cinemaTime">00:00</time></div>`;document.body.append(cinema);
 $('houseMapButton').onclick=()=>openHouseMap();$('cinemaStart').onclick=enterCinema;$('cinemaExit').onclick=()=>leaveCinema();$('cinemaPause').onclick=togglePause;
 $('cinemaShot').onchange=e=>{hobby.shot=e.target.value;resumeCinemaCamera();};$('cinemaAuto').onclick=resumeCinemaCamera;bindCinemaCamera();$('cinemaMute').onclick=()=>enableSound();
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
function removeHouseAnalytics(source,base=location.href){
 let removed=false;
 for(const node of source.querySelectorAll('script')){
  const marked=node.getAttribute('id')==='analyticsBootstrap'||['data-railway-analytics','data-house-analytics','data-whistlevale-analytics'].some(name=>node.hasAttribute(name));
  const tracker=['src','data-src','data-source'].some(name=>{
   const value=node.getAttribute(name);if(!value)return false;
   try{const url=new URL(value,/^(?:https?|file):/i.test(base)?base:'https://whistlevale.invalid/');return /\/(?:immutable\/)?src\/analytics(?:\.[a-f0-9]+)?\.js$/i.test(url.pathname)||/\/_vercel\/insights(?:\/|$)/i.test(url.pathname);}catch{return false;}
  });
  if(marked||tracker){node.remove();removed=true;}
 }
 return removed;
}
async function packHouseHall(){
 if(typeof window.HOUSE_EMBEDDED_HALL==='string'&&window.HOUSE_EMBEDDED_HALL){
  const embedded=window.HOUSE_EMBEDDED_HALL,source=new DOMParser().parseFromString(embedded,'text/html').documentElement;
  return removeHouseAnalytics(source)?'<!DOCTYPE html>\n'+source.outerHTML:embedded;
 }
 if(!Object.values(HOUSE_ROOMS).some(room=>room.map?.destination==='grandhall.html'))return null;
 const url=new URL('grandhall.html',location.href),response=await fetch(url.href);
 if(!response.ok)throw new Error('Could not pack the Grand Hall');
 const page=new DOMParser().parseFromString(await response.text(),'text/html'),source=page.documentElement;
 removeHouseAnalytics(source,url.href);
 for(const node of source.querySelectorAll('script[src],script[data-src]')){
  const attribute=node.hasAttribute('data-src')?'data-src':'src';
  const result=await fetch(new URL(node.getAttribute(attribute),url).href);if(!result.ok)throw new Error('Could not pack a Hall script');
  node.textContent=(await result.text()).replace(/<\/script/gi,'<\\/script');node.removeAttribute(attribute);
 }
 for(const node of source.querySelectorAll('link[rel=stylesheet]')){
  const result=await fetch(new URL(node.getAttribute('href'),url).href);if(!result.ok)throw new Error('Could not pack Hall styles');
  const style=page.createElement('style');style.textContent=await result.text();node.replaceWith(style);
 }
 // Icons are a mixed set now: a scalable SVG plus PNG tab and touch icons.
 // Inline each by its own type, and include apple-touch-icon, which rel~="icon"
 // does not match. A portable Hall may reference nothing outside itself.
 for(const node of source.querySelectorAll('link[rel~="icon"],link[rel~="apple-touch-icon"]')){
  const href=node.getAttribute('href');if(!href||href.startsWith('data:'))continue;
  const result=await fetch(new URL(href,url).href);if(!result.ok)throw new Error('Could not pack the Hall icon');
  if(/\.svg(\?|#|$)/i.test(href)){node.setAttribute('href','data:image/svg+xml;charset=utf-8,'+encodeURIComponent(await result.text()));continue;}
  const bytes=new Uint8Array(await result.arrayBuffer());let binary='';
  for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
  node.setAttribute('href','data:image/png;base64,'+btoa(binary));
 }
 // Shared film bytes live once in the outer export. visitHouseDestination adds
 // that embedded payload when opening this Hall as its own portable Blob page.
 return '<!DOCTYPE html>\n'+source.outerHTML;
}
exportPlayable=async function(){
 try{
  toast('Packing your little world, including its soundtrack…');const source=document.documentElement.cloneNode(true);
  removeHouseAnalytics(source);
  for(const node of source.querySelectorAll('[data-guest-import],#embedStage'))node.remove();
  for(const node of source.querySelectorAll('video[data-moonlight-film]'))node.remove();
  for(const node of source.querySelectorAll('[data-moonlight-programme]'))node.remove();
  if(typeof packMoonlightMedia==='function'){
   const media=await packMoonlightMedia();source.querySelector('#embeddedHouseMedia')?.remove();
   const payload=document.createElement('script');payload.id='embeddedHouseMedia';payload.textContent='window.HOUSE_EMBEDDED_MEDIA='+JSON.stringify(media).replace(/</g,'\\u003c')+';window.HOUSE_EMBEDDED_MOONLIGHT='+JSON.stringify(moonlightExportPreferences())+';';source.querySelector('head').append(payload);
  }
  const hall=await packHouseHall();source.querySelector('#embeddedHouseHall')?.remove();
  if(hall){const payload=document.createElement('script');payload.id='embeddedHouseHall';payload.textContent='window.HOUSE_EMBEDDED_HALL='+JSON.stringify(hall).replace(/</g,'\\u003c')+';';source.querySelector('head').append(payload);}
  for(const node of source.querySelectorAll('script[src]')){const r=await fetch(node.getAttribute('src'));if(!r.ok)throw new Error('Could not pack a script');node.textContent=(await r.text()).replace(/<\/script/gi,'<\\/script');node.removeAttribute('src');}
  for(const node of source.querySelectorAll('link[rel=stylesheet]')){const r=await fetch(node.getAttribute('href'));if(!r.ok)throw new Error('Could not pack styles');const style=document.createElement('style');style.textContent=await r.text();node.replaceWith(style);}
  for(const node of source.querySelectorAll('link[rel~="icon"]')){const href=node.getAttribute('href');if(!href||href.startsWith('data:'))continue;const r=await fetch(href);if(!r.ok)throw new Error('Could not pack the shop icon');node.setAttribute('href','data:image/svg+xml;charset=utf-8,'+encodeURIComponent(await r.text()));}
  const exportAudioIds=[...new Set([...AUDIO_ASSETS,typeof ARRIVAL_ID==='string'?ARRIVAL_ID:'arrival'])].filter(houseRecordingAvailable);
  const embedded={};await Promise.all(exportAudioIds.map(async id=>{if(window.HOUSE_EMBEDDED_AUDIO?.[id]){embedded[id]=window.HOUSE_EMBEDDED_AUDIO[id];return;}const response=await fetch(houseRecordingURL(id));if(!response.ok)throw new Error('Could not pack audio');const blob=await response.blob();embedded[id]=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});}));
  // Replace the prior audio payload when repacking an already portable world.
  for(const node of source.querySelectorAll('script'))if(node.id==='embeddedHouseAudio'||/^\s*window\.HOUSE_EMBEDDED_AUDIO\s*=/.test(node.textContent))node.remove();
  const embed=document.createElement('script');embed.id='embeddedHouseAudio';embed.textContent='window.HOUSE_EMBEDDED_AUDIO='+JSON.stringify(embedded)+';';source.querySelector('head').append(embed);
  const catalog=source.querySelector('#audioCatalog')||document.createElement('script');catalog.id='audioCatalog';catalog.textContent='window.HOUSE_AUDIO_AVAILABLE='+JSON.stringify(Object.keys(embedded))+';';if(!catalog.parentNode)source.querySelector('head').append(catalog);
  if(typeof collectionExport==='function')source.querySelector('#embeddedTrainCollection').textContent=JSON.stringify(collectionExport()).replace(/</g,'\\u003c');
  if(typeof collectionPortraitURL==='function'){
   const portraits={};await Promise.all(TRAIN_COLLECTION.map(async q=>{const url=collectionPortraitURL(q.id);if(url.startsWith('data:')){portraits[q.id]=url;return;}const response=await fetch(url);if(!response.ok)throw new Error('Could not pack the train portraits');const blob=await response.blob();portraits[q.id]=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});}));
   source.querySelector('#embeddedTrainPortraits').textContent=JSON.stringify(portraits);
  }
  source.querySelector('#trainCabinet')?.remove();source.querySelector('#trainCollectionButton')?.remove();
  source.querySelector('#embeddedLayout').textContent=JSON.stringify(snapshot()).replace(/</g,'\\u003c');source.querySelector('#loader').classList.remove('done');
  for(const selector of['#houseUI','#cinemaUI','#cinemaStart','#houseMap','#shopMapUI','#playlistPanel','#playlistBtn','#playlistStyle','#atmosphereSoundMixer','#performancePanel'])source.querySelector(selector)?.remove();
  for(const node of source.querySelectorAll('.quiet-generated'))node.remove();
  for(const node of source.querySelectorAll('.quiet-panel'))node.hidden=true;
  for(const node of source.querySelectorAll('[data-quiet-opener]'))node.setAttribute('aria-expanded','false');
  source.querySelector('#roomPlaces').replaceChildren();source.querySelector('#buildersList')?.replaceChildren();
  for(const node of source.querySelectorAll('dialog'))node.removeAttribute('open');for(const id of['builderUI','trainInspector','projectMenu','workshopBusy','worldTip'])source.querySelector('#'+id).hidden=true;
  // A new runtime starts running at its default throttle, with sound off.
  // Saved preferences can then update these controls together during startup.
  const soundButton=source.querySelector('#audioBtn');soundButton.classList.remove('on');soundButton.setAttribute('aria-pressed','false');soundButton.setAttribute('aria-label','Enable railway sounds');soundButton.querySelector('use').setAttribute('href','#i-mute');
  const playButton=source.querySelector('#playBtn');playButton.classList.remove('active');playButton.setAttribute('aria-pressed','false');playButton.setAttribute('aria-label','Pause the railway');playButton.querySelector('use').setAttribute('href','#i-pause');
  const regulator=source.querySelector('#throttle');regulator.value='42';regulator.setAttribute('value','42');regulator.style.setProperty('--fill','42%');source.querySelector('#throttleValue').textContent='42%';
  const notice=source.querySelector('#toast');notice.classList.remove('show');notice.textContent='';
  source.querySelector('body').className='quiet-ui';source.querySelector('#error').removeAttribute('style');exportBlob('<!DOCTYPE html>\n'+source.outerHTML,'text/html','whistlevale.html');$('projectMenu').hidden=true;toast('Your hobby house is packed, soundtrack and all.');
 }catch(error){console.error(error);toast('Could not pack the full house. Export the layout JSON to keep your edits.');}
};

function startHouse(){
 createHobbyUI();baseHobbyStart();
 if(!window.READY)return;
 const atmosphereClick=$('ambienceBtn').onclick;
 $('ambienceBtn').onclick=e=>{atmosphereClick(e);$('soundPanel').hidden=true;if($('playlistPanel'))$('playlistPanel').hidden=true;$('playlistBtn')?.setAttribute('aria-expanded','false');$('playlistBtn')?.classList.remove('on');};
 try{
  initHouseArt();hobby.life=buildValleyLife();initWalkingFigures();if(typeof initHouseMap==='function')initHouseMap();hobby.ready=true;shadowDirty=true;updateUI();
  if(typeof initQuietControls==='function')initQuietControls();
  if(typeof restoreCollectionSelections==='function')restoreCollectionSelections();
  if(typeof initTrainCabinet==='function')initTrainCabinet();
  syncRoomControls();renderRoomPlaces();
  window.HOBBY_HOUSE={visit:visitHouseRoom,cinema:enterCinema,leaveCinema,openMap:()=>openHouseMap(),get state(){return{room:hobby.room,ready:hobby.ready,cinema:hobby.cinema,shot:hobby.shot,paused,throttle,population:hobby.room==='valley'?hobby.life.population:hobby.scene.population,walking:hobby.room==='valley'?hobby.life.actors.length:hobby.scene.actors.length,roomsLoaded:[...roomScenes.keys()],audio:soundscape?{loaded:soundscape.loaded,on:soundscape.on,buffers:[...soundscape.buffers.keys()],failed:soundscape.failed.slice(),context:soundscape.ctx.state,music:soundscape.music,ambience:soundscape.ambience,train:soundscape.train}:null,cam:cameraPos.slice(),target:cameraTarget.slice(),train:hobbyHasTrain()?hobbyTrainInfo().p.slice():null,sceneTriangles:hobby.scene?hobby.scene.mesh.count/3:staticMesh.count/3,frame}}};
  document.body.dataset.room='valley';restoreHouseLocation();syncHouseAnalytics();
 }catch(error){console.error(error);$('error').style.display='block';$('error').textContent='The hobby house could not finish opening: '+error.message;}
}
// One hit test on a completed tap; the existing Places buttons provide the
// keyboard route and both paths resolve the current editable contribution.
function focusHouseWorkAt(x,y){
 if(!hobby.ready||hobby.room!=='valley'||hobby.cinema||hobby.transition||building||(typeof shopMap!=='undefined'&&shopMap.open)||!['room','overview'].includes(viewMode))return false;
 const id=pickObject(x,y),object=objects.find(o=>o.id===id);
 if(!object?.contribution||!communityWorkshopPlaces().some(place=>place.contribution===object.contribution&&place.placement===(object.placement??0)))return false;
 return focusHouseWork(object.contribution,object.placement??0);
}
function focusHouseWork(id,placement=0){
 const scene=hobby.room==='valley'?{key:'valley'}:hobby.scene,view=communityWorkView(scene,id,placement);if(!view)return false;
 setView('overview',false);orbit.target=view.target.slice();orbit.distance=innerWidth<700?(view.phoneDistance??view.distance*1.7):view.distance;orbit.pitch=view.pitch;orbit.yaw=view.yaw;
 const places=hobby.room==='valley'?communityWorkshopPlaces():hobby.scene.spots;
 hobby.spot=places.findIndex(spot=>spot.contribution===id&&spot.placement===placement);
 cameraTarget=orbit.target.slice();cameraPos=add(cameraTarget,[Math.sin(orbit.yaw)*Math.cos(orbit.pitch)*orbit.distance,Math.sin(orbit.pitch)*orbit.distance,Math.cos(orbit.yaw)*Math.cos(orbit.pitch)*orbit.distance]);
 for(const [index,button]of [...$('roomPlaces').querySelectorAll('button:not([data-moonlight-opener])')].entries())button.classList.toggle('chosen',index===hobby.spot);
 shadowDirty=true;updateUI();return true;
}
function restoreHouseLocation(params=houseInitialParams()){
 const room=params.get('room'),after=()=>{
  if(params.has('work')){
   const placement=params.get('placement')??'0',valid=params.getAll('room').length===1&&params.getAll('work').length===1&&params.getAll('placement').length<=1&&/^(0|[1-9][0-9]*)$/.test(placement);
   if(valid&&hobby.room===room&&focusHouseWork(params.get('work'),Number(placement)))return;
   toast('This miniature is no longer available in this room.');
  }
  const map=params.get('map');if(map&&typeof openHouseMap==='function')openHouseMap().then(()=>{if(HOUSE_ROOMS[map])shopMapSelect(map);});
 };
 if(room&&HOUSE_ROOMS[room]&&room!=='valley')visitHouseRoom(room,after);else after();
}
function houseInitialParams(){
 const params=new URLSearchParams(location.search);
 if(location.protocol==='blob:'){
  const returned=new URLSearchParams(location.hash.slice(1)),map=returned.get('map'),room=returned.get('room');
  if(map&&HOUSE_ROOMS[map]||returned.has('work')&&room&&HOUSE_ROOMS[room])for(const key of['map','room','work','placement'])if(returned.has(key)){params.delete(key);for(const value of returned.getAll(key))params.append(key,value);}
 }
 return params;
}
// Later classic scripts register controls, maps and the train cabinet. A slow
// request can outlast a timer while the parser is still waiting for those files.
function scheduleHouseStartup(){setTimeout(startHouse,50);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scheduleHouseStartup,{once:true});
else scheduleHouseStartup();
