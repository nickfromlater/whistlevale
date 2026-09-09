/* Coarse, optional engagement counts. Nothing here runs in the render loop. */
(()=>{
 'use strict';
 const hosts=['whistlevale.com','www.whistlevale.com','endless-railroad.vercel.app','endless-railroad-project-scope.vercel.app'];
 if(location.protocol!=='https:'||!hosts.includes(location.hostname)||navigator.doNotTrack==='1'||navigator.globalPrivacyControl)return;
 const milestones=[30,60,180,300,900,1800],limit=60;
 const clicks={playBtn:'pause',cinemaPause:'pause',whistleBtn:'whistle',routeBtn:'route',map:'route',stopBtn:'station_stop',audioBtn:'sound_toggle',cinemaMute:'sound_toggle',soundToggle:'sound_toggle',lightBtn:'lighting',rainBtn:'rain',lensBtn:'depth_of_field',photoBtn:'photo',playlistAuto:'music_auto',cinemaAuto:'camera_auto',buildMode:'editor'};
 const changes={throttle:'throttle',musicMix:'music_level',ambienceMix:'ambience_level',trainMix:'train_level',roomDimmer:'room_lights',cinemaShot:'cinema_shot'};
 const panels={viewsPanel:'views',trainPanel:'train',morePanel:'more',ambiencePanel:'atmosphere',soundPanel:'sound',playlistPanel:'music',layoutPanel:'track_map',help:'guide'};
 const shortcuts={' ':'pause',h:'whistle',r:'route',s:'station_stop',n:'lighting',f:'hide_controls',p:'photo',1:'camera_room',2:'camera_overview',3:'camera_station',4:'camera_follow',5:'camera_cab'};
 const allowed=new Set([...Object.values(clicks),...Object.values(changes),...Object.values(shortcuts),...Object.values(panels).map(v=>'panel_'+v),'room_map','train_collection','train_select','camera_manual','camera_auto','place','atmosphere','livery','music_select',...['room','overview','station','engine','follow','cab','tour'].map(v=>'camera_'+v)]);
 let disabled=false,queued=false,timer=0,sent=0,last=performance.now(),wall=Date.now(),visible=false,away=false,current={room:null,cinema:false};
 const seen=new Set(),buckets=new Map();
 const stop=()=>{disabled=true;clearTimeout(timer);};
 const safe=fn=>(...args)=>{if(!disabled)try{fn(...args);}catch{stop();}};
 const emit=(name,data)=>{
  if(sent>=limit)return;sent++;
  // Vercel's existing vanilla event protocol; its async sender owns delivery.
  // The fallback queue is bounded even when a blocker prevents script loading.
  if(typeof window.va==='function')window.va('event',{name,data});
 };
 const once=(name,data,key)=>{if(seen.has(key)||sent>=limit)return;seen.add(key);emit(name,data);};
 const bucket=(name,room)=>{
  const key=name+':'+(room||'');
  if(!buckets.has(key))buckets.set(key,{name,room,ms:0,index:0});
  return buckets.get(key);
 };
 const active=()=>{
  if(!visible)return[];
  const list=[bucket('visit_time')];
  if(current.room){list.push(bucket('room_time',current.room));if(current.cinema)list.push(bucket('cinema_time',current.room));}
  return list;
 };
 function account(){
  const now=performance.now(),date=Date.now(),elapsed=now-last,wallElapsed=date-wall;last=now;wall=date;
  // Discard long suspended/stalled gaps, including OS sleep with a paused clock.
  if(sent>=limit||elapsed<0||elapsed>45000||Math.abs(wallElapsed-elapsed)>5000)return;
  for(const b of active()){
   b.ms+=elapsed;
   while(b.index<milestones.length&&b.ms>=milestones[b.index]*1000){
    const seconds=milestones[b.index++];emit(b.name,b.room?{room:b.room,seconds}:{seconds});
   }
  }
 }
 function schedule(){
  clearTimeout(timer);
  if(disabled||sent>=limit)return;
  const pending=active().filter(b=>b.index<milestones.length);
  if(pending.length)timer=setTimeout(safe(()=>{account();schedule();}),Math.max(1,Math.min(30000,...pending.map(b=>milestones[b.index]*1000-b.ms))));
 }
 function syncNow(){
  account();
  const ready=hobby.ready&&!hobby.transition;
  current={room:ready&&!shopMap.open&&Object.hasOwn(HOUSE_ROOMS,hobby.room)?hobby.room:null,cinema:ready&&!shopMap.open&&hobby.cinema};
  visible=ready&&!away&&document.visibilityState==='visible';
  if(visible){
   if(current.room)once('room_visit',{room:current.room},'room:'+current.room);
   if(current.cinema)once('cinema_start',{room:current.room},'cinema:'+current.room);
   if(shopMap.open)controlNow('room_map');
  }
  schedule();
 }
 function sync(){
  if(queued)return;queued=true;
  // Map entry closes the map and activates a room in the same task. Observe
  // the final state, never the temporary room globals used while drawing it.
  queueMicrotask(safe(()=>{queued=false;syncNow();}));
 }
 function controlNow(control){
  if(!visible||!allowed.has(control))return;
  once('control_used',{control,room:current.room||'map'},'control:'+control);
 }
 function control(control){
  if(!allowed.has(control)||seen.has('control:'+control))return;
  // Leave the gesture handler before handing anything to the analytics sender.
  queueMicrotask(safe(()=>{controlNow(control);if(sent>=limit)clearTimeout(timer);}));
 }
 window.railwayAnalytics={sync:safe(sync),control:safe(control),panel:safe(id=>control('panel_'+panels[id])),shortcut:safe(key=>control(shortcuts[key]))};
 document.addEventListener('visibilitychange',safe(syncNow),{passive:true});
 window.addEventListener('pagehide',safe(()=>{account();away=true;visible=false;clearTimeout(timer);}),{passive:true});
 window.addEventListener('pageshow',safe(()=>{away=false;syncNow();}),{passive:true});
 document.addEventListener('click',safe(event=>{
  if(!event.isTrusted)return;
  const button=event.target.closest('button,#map');if(!button||button.disabled)return;
  let name=clicks[button.id];
  if(button.dataset.camera)name='camera_'+button.dataset.camera;
  else if(button.matches('[data-district],#roomPlaces button'))name='place';
  else if(button.dataset.mood)name='atmosphere';
  else if(button.dataset.livery)name='livery';
  else if(button.matches('#playlistItems [data-track]'))name='music_select';
  control(name);
 }),{capture:true,passive:true});
 document.addEventListener('change',safe(event=>{if(event.isTrusted)control(changes[event.target.id]);}),{passive:true});
 // Keep the same first-party, cookie-free Vercel script as pageview analytics.
 // Local previews, privacy opt-outs and portable exports never load it.
 safe(()=>{
  window.va=window.va||function(){const q=window.vaq=window.vaq||[];if(q.length<limit)q.push(arguments);};
  const script=document.createElement('script');script.src='/_vercel/insights/script.js';script.defer=true;script.dataset.railwayAnalytics='';
  script.onerror=()=>{stop();if(window.vaq)window.vaq.length=0;};
  document.head.append(script);
 })();
})();
