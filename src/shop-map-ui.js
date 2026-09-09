'use strict';

/* The canvas owns the house. This layer only supplies its room controls.
 * Marker positions are CSS pixels relative to the viewport.
 * Selection never calls back into the scene; only deliberate UI input does.
 */
window.ShopMapUI=(()=>{
 let root,selected=null,current=null,lastFocus=null,loading=false,opened=false,paintedSelection=null;
 let rooms=[],nodes={},directory=new Map(),markers=new Map();
 const icons={
  back:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 5-7 7 7 7M3 12h18"/></svg>',
  arrow:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h18m-7-7 7 7-7 7"/></svg>',
  play:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7Z"/></svg>',
  orbit:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 6 3-3 3 3M8 3v6M19 18l-3 3-3-3m3 3v-6M4 9c-5 6 10 12 16 6M20 15c5-6-10-12-16-6"/></svg>'
 };
 const plots=()=>typeof SHOP_HOUSE_LAYOUT!=='undefined'?(SHOP_HOUSE_LAYOUT.plots||[]):[];
 const registry=()=>typeof HOUSE_ROOMS!=='undefined'?HOUSE_ROOMS:(window.HOUSE_ROOMS||{});
 const roomFor=key=>rooms.find(([id])=>id===key)?.[1];
 const nameFor=room=>String(room?.name||'Untitled room').replace(/^The /,'');
 const call=(name,...args)=>{if(typeof window[name]==='function')window[name](...args);};
 function button(className,label){const b=document.createElement('button');b.type='button';b.className=className;b.textContent=label;return b;}
 function preview(key){if(loading||!roomFor(key))return;const changed=key!==selected;select(key,current);if(changed)call('shopMapSelect',key);}
 function enter(key,cinema=false){if(!loading&&roomFor(key))call('shopMapEnter',key,cinema);}
 function init(){
  if(root?.isConnected)return root;
  // Exported pages may contain a clone of this runtime layer.
  document.getElementById('shopMapUI')?.remove();
  root=document.createElement('section');root.id='shopMapUI';root.className='shop-map-ui';root.hidden=true;
  root.setAttribute('role','region');root.setAttribute('aria-label','Shop map');
  root.innerHTML=`
   <header class="sm-heading"><span class="sm-brand">Whistlevale</span><h1 id="smTitle" tabindex="-1">Choose a room<span class="sm-title-dot" aria-hidden="true"></span></h1><p id="smRoomCount"></p></header>
   <button type="button" class="sm-back">${icons.back}<span class="sm-back-full">Back to the room</span><span class="sm-back-short">Back</span></button>
   <div class="sm-markers" aria-label="Room entrances"></div>
   <section class="sm-preview" aria-labelledby="smRoomName">
    <div class="sm-preview-summary"><span class="sm-room-number" id="smRoomNumber"></span><h2 id="smRoomName"></h2><button type="button" class="sm-info" aria-label="About this room" aria-controls="smDetails" aria-expanded="false"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 11v5M12 7.5v.5"/></svg></button><button type="button" class="sm-enter"><span id="smEnterLabel">Enter</span>${icons.arrow}</button></div>
    <div id="smDetails" hidden><div class="sm-preview-top"><span id="smRoomTag"></span><span class="sm-current" id="smCurrent">Your room</span></div><p class="sm-description" id="smDescription"></p><button type="button" class="sm-cinema">${icons.play}<span>Watch cinema</span></button></div>
   </section>
   <div class="sm-view-tools"><span class="sm-orbit-hint"><span class="sm-mouse-hint">Drag to turn · Scroll to explore</span><span class="sm-touch-hint">Drag to turn · Pinch to explore</span></span><button type="button" class="sm-reset" aria-label="Reset view">${icons.orbit}<span>Reset view</span></button></div>
   <nav class="sm-directory" aria-label="Room directory"></nav>
   <dialog class="sm-prompt" aria-labelledby="smPromptTitle"><form method="dialog"><button class="sm-prompt-close" aria-label="Close room contribution prompt" value="close">×</button></form><span class="sm-prompt-kicker">A new room in Whistlevale</span><h2 id="smPromptTitle">Room for your imagination</h2><p id="smPromptIntro">Copy this into Codex, Claude Code or Copilot. Your agent will help you shape a room proposal and prepare it for review.</p><label for="smRoomPrompt">Your agent prompt</label><textarea id="smRoomPrompt" readonly spellcheck="false"></textarea><div class="sm-prompt-actions"><span role="status" id="smCopyStatus"></span><button type="button" class="sm-copy">Copy prompt</button></div></dialog>
   <div class="sm-status" role="status" aria-live="polite" aria-atomic="true" hidden></div>`;
  document.body.appendChild(root);
  for(const [key,query]of Object.entries({heading:'#smTitle',count:'#smRoomCount',back:'.sm-back',markerLayer:'.sm-markers',panel:'.sm-preview',number:'#smRoomNumber',tag:'#smRoomTag',title:'#smRoomName',description:'#smDescription',current:'#smCurrent',enter:'.sm-enter',enterLabel:'#smEnterLabel',cinema:'.sm-cinema',info:'.sm-info',details:'#smDetails',reset:'.sm-reset',directory:'.sm-directory',status:'.sm-status',prompt:'.sm-prompt',promptTitle:'#smPromptTitle',promptText:'#smRoomPrompt',copy:'.sm-copy',copyStatus:'#smCopyStatus'}))nodes[key]=root.querySelector(query);
  nodes.copy.addEventListener('click',copyPlotPrompt);
  nodes.prompt.addEventListener('click',event=>{if(event.target===nodes.prompt){const b=nodes.prompt.getBoundingClientRect();if(event.clientX<b.left||event.clientX>b.right||event.clientY<b.top||event.clientY>b.bottom)nodes.prompt.close();}});
  nodes.back.addEventListener('click',()=>call('closeShopMap'));
  nodes.enter.addEventListener('click',()=>enter(selected));
  nodes.cinema.addEventListener('click',()=>enter(selected,true));
  nodes.reset.addEventListener('click',()=>call('shopMapResetView'));
  nodes.info.addEventListener('click',()=>{nodes.details.hidden=!nodes.details.hidden;nodes.info.setAttribute('aria-expanded',String(!nodes.details.hidden));});
  // These listeners run only on this layer's controls, never on the canvas.
  root.addEventListener('keydown',event=>{
   event.stopPropagation();
   if(nodes.prompt.open)return;
   if(event.key==='Escape'){event.preventDefault();if(!nodes.details.hidden){nodes.details.hidden=true;nodes.info.setAttribute('aria-expanded','false');nodes.info.focus();}else call('closeShopMap');return;}
   const b=event.target.closest('.sm-directory-room');
   if(!b||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
   event.preventDefault();const keys=rooms.map(([key])=>key),at=keys.indexOf(b.dataset.room);
   const index=event.key==='Home'?0:event.key==='End'?keys.length-1:(at+(event.key==='ArrowRight'?1:-1)+keys.length)%keys.length;
   const next=directory.get(keys[index]);next?.focus({preventScroll:true});next?.scrollIntoView({block:'nearest',inline:'nearest',behavior:'auto'});
  });
  root.addEventListener('keyup',event=>event.stopPropagation());
  for(const type of ['pointerdown','pointerup','click','dblclick','wheel'])root.addEventListener(type,event=>event.stopPropagation(),{passive:true});
  refresh();return root;
 }
 function refresh(){
  if(!root?.isConnected){init();return;}
  rooms=Object.entries(registry()).filter(([,room])=>room&&typeof room==='object');
  const roomCount=rooms.length;
  for(const plot of plots())rooms.push([plot.id,{name:plot.name,number:'+',plot,tag:'An open room site',color:'#bfd0ab',description:'A place for a new world. Copy a prompt for your coding agent to design an original room and prepare a contribution for review.'}]);
  if(!roomFor(current))current=rooms[0]?.[0]||null;
  if(!roomFor(selected))selected=current;
  directory.clear();markers.clear();paintedSelection=null;nodes.directory.replaceChildren();nodes.markerLayer.replaceChildren();
  rooms.forEach(([key,room],index)=>{
   const name=nameFor(room),number=String(room.number||String(index+1).padStart(2,'0'));
   const b=button('sm-directory-room','');b.dataset.room=key;if(room.plot)b.classList.add('is-plot');
   const n=document.createElement('span');n.className='sm-directory-number';n.textContent=number;
   const label=document.createElement('span');label.className='sm-directory-name';label.textContent=name;
   const dot=document.createElement('span');dot.className='sm-directory-current';dot.setAttribute('aria-hidden','true');
   b.append(n,label,dot);b.addEventListener('focus',()=>preview(key));b.addEventListener('click',()=>preview(key));
   nodes.directory.appendChild(b);directory.set(key,b);
   const marker=button('sm-marker','');marker.dataset.room=key;marker.hidden=true;if(room.plot)marker.classList.add('is-plot');
   const badge=document.createElement('span');badge.className='sm-marker-number';badge.textContent=number;
   const text=document.createElement('span');text.textContent=name;
   marker.append(badge,text);marker.insertAdjacentHTML('beforeend',icons.arrow);
   marker.addEventListener('click',()=>enter(key));nodes.markerLayer.appendChild(marker);markers.set(key,marker);
  });
  nodes.count.textContent=roomCount?`${roomCount} rooms · ${plots().length} places to grow`:'A new world is taking shape';
  nodes.directory.hidden=!rooms.length;nodes.panel.hidden=!rooms.length;
  select(selected,current);setLoading(loading?nodes.status.textContent:null);
 }
 function select(key,currentKey){
  if(!root?.isConnected)init();
  if(currentKey!==undefined&&roomFor(currentKey))current=currentKey;
  const room=roomFor(key);if(!room)return;selected=key;
  if(paintedSelection?.key===selected&&paintedSelection.current===current)return;
  paintedSelection={key:selected,current};
  const name=nameFor(room),index=rooms.findIndex(([id])=>id===key),isCurrent=key===current;
  root.style.setProperty('--sm-accent',room.color||'#d3b47b');
  nodes.number.textContent=room.number||String(index+1).padStart(2,'0');
  nodes.tag.textContent=room.tag||room.layout||'A little world';
  nodes.title.textContent=name;nodes.description.textContent=room.description||'Step inside and explore this little railway world.';
  nodes.current.hidden=!isCurrent;nodes.enterLabel.textContent=room.plot?'Get prompt':isCurrent?'Return':'Enter';
  nodes.info.setAttribute('aria-label',`About ${name}`);
  nodes.enter.setAttribute('aria-label',`${room.plot?'Get an agent prompt for':isCurrent?'Return to':'Enter'} ${name}`);
  nodes.cinema.setAttribute('aria-label',`Watch cinema in ${name}`);nodes.cinema.hidden=!!room.map?.destination||!!room.plot;
  for(const [id,b]of directory){
   const here=id===current;b.classList.toggle('is-selected',id===selected);b.classList.toggle('is-current',here);b.setAttribute('aria-pressed',String(id===selected));
   b.setAttribute('aria-label',`Preview ${nameFor(roomFor(id))}${here?', your current room':''}`);
   if(here)b.setAttribute('aria-current','location');else b.removeAttribute('aria-current');
  }
  for(const [id,b]of markers){
   b.classList.toggle('is-selected',id===selected);b.classList.toggle('is-current',id===current);
   b.setAttribute('aria-label',`${roomFor(id)?.plot?'Get an agent prompt for':id===current?'Return to':'Enter'} ${nameFor(roomFor(id))}`);
   if(id===current)b.setAttribute('aria-current','location');else b.removeAttribute('aria-current');
  }
 }
 function show(currentKey){
  init();if(!opened)lastFocus=document.activeElement===document.body?document.getElementById('houseMapButton'):document.activeElement;
  current=currentKey;selected=currentKey;refresh();opened=true;root.hidden=false;
  nodes.details.hidden=true;nodes.info.setAttribute('aria-expanded','false');
  nodes.heading.focus({preventScroll:true});
 }
 function hide(){
  if(!root)return;if(nodes.prompt.open)nodes.prompt.close();const restore=root.contains(document.activeElement);opened=false;root.hidden=true;
  for(const marker of markers.values())marker.hidden=true;
  // Room controls are visible before hide() runs. Restore now: during the next
  // animation frame, browsers can still report the just-hidden heading as active.
  if(restore&&lastFocus?.isConnected&&lastFocus.getClientRects().length)lastFocus.focus({preventScroll:true});
 }
 function setLoading(text){
  if(!root?.isConnected)init();loading=typeof text==='string'&&text.length>0;
  nodes.status.hidden=!loading;nodes.status.textContent=loading?text:'';nodes.panel.setAttribute('aria-busy',String(loading));
  for(const b of [nodes.enter,nodes.cinema,nodes.reset,...directory.values(),...markers.values()])b.disabled=loading;
 }
 function setMarkerPositions(positions){
  if(!opened||!root)return;
  const seen=new Set(),placed=[];
  for(const point of positions||[]){
   const {key,x,visible}=point;let y=point.y;
   // At phone scale, neighboring open sites are closer than a finger target.
   // Let their invitations sit just below nearby labels instead of overlapping.
   if(innerWidth<=1000&&roomFor(key)?.plot)for(const prior of placed)if(Math.abs(x-prior.x)<46&&Math.abs(y-prior.y)<48)y=prior.y+48;
   const marker=markers.get(key);if(!marker)continue;seen.add(key);
   const show=visible!==false&&Number.isFinite(x)&&Number.isFinite(y)&&x>=16&&x<=innerWidth-16&&y>=16&&y<=innerHeight-16;
   if(marker.hidden===show)marker.hidden=!show;
   if(show){placed.push({x,y});const position=`translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) translate(-50%,-100%)`;if(marker.style.transform!==position)marker.style.transform=position;}
  }
  for(const [key,marker]of markers)if(!seen.has(key))marker.hidden=true;
 }
 function openPlot(plot){
  if(!opened||loading||!plots().some(item=>item.id===plot.id))return;
  nodes.promptTitle.textContent=plot.name;
  nodes.promptText.value=grandHallRoomPrompt(plot);nodes.copyStatus.textContent='';nodes.copy.textContent='Copy prompt';
  if(!nodes.prompt.open)nodes.prompt.showModal();nodes.copy.focus();
 }
 async function copyPlotPrompt(){
  try{await navigator.clipboard.writeText(nodes.promptText.value);nodes.copy.textContent='Copied';nodes.copyStatus.textContent='Ready to paste into your coding agent.';}
  catch{nodes.promptText.focus();nodes.promptText.select();nodes.copyStatus.textContent='Prompt selected. Use your device’s Copy command.';}
 }
 return {init,show,hide,select,setLoading,setMarkerPositions,refresh,openPlot};
})();
