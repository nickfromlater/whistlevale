/* Optional coarse engagement counts. Adapters supply state; nothing runs in the render loop. */
(()=>{
 'use strict';
 const optedOut=()=>window.HOUSE_PORTABLE===true||typeof window.HOUSE_RETURN_URL==='string'||navigator.doNotTrack==='1'||navigator.globalPrivacyControl===true;
 if(location.protocol!=='https:'||!['whistlevale.com','www.whistlevale.com'].includes(location.hostname)||optedOut()||window.railwayAnalytics?.sync)return;
 const milestones=[30,60,180,300,900,1800],limit=60;
 const clicks={playBtn:'pause',cinemaPause:'pause',whistleBtn:'whistle',routeBtn:'route',map:'route',stopBtn:'station_stop',audioBtn:'sound_toggle',cinemaMute:'sound_toggle',soundToggle:'sound_toggle',lightBtn:'lighting',rainBtn:'rain',lensBtn:'depth_of_field',photoBtn:'photo',playlistAuto:'music_auto',cinemaAuto:'camera_auto',buildMode:'editor',hallInvitationLink:'contribute_open',visitGrandHall:'contribute_open'};
 const changes={throttle:'throttle',musicMix:'music_level',ambienceMix:'ambience_level',trainMix:'train_level',roomDimmer:'room_lights',cinemaShot:'cinema_shot'};
 const panels={viewsPanel:'views',trainPanel:'train',morePanel:'more',ambiencePanel:'atmosphere',soundPanel:'sound',playlistPanel:'music',layoutPanel:'track_map',help:'guide',buildersPanel:'builders',contributePanel:'contribute'};
 const shortcuts={' ':'pause',h:'whistle',r:'route',s:'station_stop',n:'lighting',f:'hide_controls',p:'photo',1:'camera_room',2:'camera_overview',3:'camera_station',4:'camera_follow',5:'camera_cab',6:'camera_tour'};
 const allowed=new Set([...Object.values(clicks),...Object.values(changes),...Object.values(shortcuts),...Object.values(panels).map(v=>'panel_'+v),'room_map','house_map','train_collection','train_select','camera_manual','camera_auto','place','atmosphere','livery','music_select','hall_bay','hall_gallery','hall_map','contribute_open','contribute_prompt','exhibit_view','exhibit_room',...['room','overview','station','engine','follow','cab','tour'].map(v=>'camera_'+v)]);
 let disabled=false,queued=false,timer=0,sent=0,last=performance.now(),wall=Date.now(),visible=false,away=false;
 let latest={ready:false,room:null,cinema:false,map:false},current=latest;
 const seen=new Set(),buckets=new Map();
 const stop=()=>{disabled=true;clearTimeout(timer);if(Array.isArray(window.vaq))window.vaq.length=0;};
 const safe=fn=>(...args)=>{if(!disabled)try{if(optedOut())stop();else fn(...args);}catch{stop();}};
 const emit=(name,data)=>{
  if(sent>=limit)return;sent++;
  window.va('event',{name,data});
  if(sent>=limit)clearTimeout(timer);
 };
 const once=(name,data,key)=>{if(seen.has(key)||sent>=limit)return;seen.add(key);emit(name,data);};
 const bucket=(name,room)=>{
  const key=name+':'+(room||'');
  if(!buckets.has(key))buckets.set(key,{name,room,ms:0,index:0});
  return buckets.get(key);
 };
 const active=()=>{
  if(!visible||sent>=limit)return[];
  const list=[bucket('visit_time')];
  if(current.room&&!current.map){list.push(bucket('room_time',current.room));if(current.cinema)list.push(bucket('cinema_time',current.room));}
  return list;
 };
 function account(){
  const now=performance.now(),date=Date.now(),elapsed=now-last,wallElapsed=date-wall;last=now;wall=date;
  // Ignore suspended/stalled gaps, including OS sleep with a paused performance clock.
  if(elapsed<0||elapsed>45000||Math.abs(wallElapsed-elapsed)>5000)return;
  for(const b of active()){
   b.ms+=elapsed;
   while(sent<limit&&b.index<milestones.length&&b.ms>=milestones[b.index]*1000){
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
  account(); // All elapsed time belongs to the previous snapshot.
  current=latest;
  visible=current.ready&&!away&&document.visibilityState==='visible';
  if(visible&&current.room&&!current.map){
   once('room_visit',{room:current.room},'room:'+current.room);
   if(current.cinema)once('cinema_start',{room:current.room},'cinema:'+current.room);
  }
  schedule();
 }
 function sync(snapshot){
  if(sent>=limit)return;
  const room=typeof snapshot?.room==='string'&&/^[a-z][a-z0-9_-]{0,63}$/.test(snapshot.room)?snapshot.room:null;
  latest={ready:snapshot?.ready===true,room,cinema:snapshot?.cinema===true,map:snapshot?.map===true};
  if(queued)return;queued=true;
  queueMicrotask(safe(()=>{queued=false;syncNow();}));
 }
 function control(name){
  if(!allowed.has(name)||sent>=limit)return;
  queueMicrotask(safe(()=>{
   // A same-task navigation may queue its snapshot after this control.
   if(queued){queued=false;syncNow();}
   if(!visible)return;
   const room=current.map?'map':current.room;
   if(room)once('control_used',{control:name,room},'control:'+room+':'+name);
  }));
 }
 window.railwayAnalytics={sync:safe(sync),control:safe(control),panel:safe(id=>control('panel_'+panels[id])),shortcut:safe(key=>control(shortcuts[key]))};
 document.addEventListener('visibilitychange',safe(syncNow),{passive:true});
 window.addEventListener('pagehide',safe(()=>{account();away=true;visible=false;clearTimeout(timer);}),{passive:true});
 window.addEventListener('pageshow',safe(()=>{away=false;syncNow();}),{passive:true});
 document.addEventListener('click',safe(event=>{
  if(!event.isTrusted)return;
  const button=event.target?.closest?.('button,#map,#hallInvitationLink');if(!button||button.disabled)return;
  let name=clicks[button.id];
  if(button.dataset.camera)name='camera_'+button.dataset.camera;
  else if(button.matches('[data-district],#roomPlaces button'))name='place';
  else if(button.dataset.mood)name='atmosphere';
  else if(button.dataset.livery)name='livery';
  else if(button.matches('#playlistItems [data-track]'))name='music_select';
  control(name);
 }),{capture:true,passive:true});
 document.addEventListener('change',safe(event=>{if(event.isTrusted)control(changes[event.target?.id]);}),{passive:true});
 safe(()=>{
  // One beforeSend registration plus at most 60 custom events while loading or blocked.
  if(typeof window.va!=='function')window.va=function(){if(disabled)return;const q=window.vaq=window.vaq||[];if(q.length<limit+1)q.push(arguments);};
  // Vercel's documented hook filters event URLs; it does not expose the referrer.
  window.va('beforeSend',event=>{
   if(disabled||optedOut())return null;
   try{const url=new URL(event.url);if(url.protocol!=='https:')return null;url.username='';url.password='';url.search='';url.hash='';return {...event,url:url.href};}catch{return null;}
  });
  const script=document.createElement('script');script.src='/_vercel/insights/script.js';script.async=true;script.referrerPolicy='no-referrer';script.dataset.railwayAnalytics='';
  script.onerror=stop;
  document.head.append(script);
 })();
})();
