'use strict';

/* The hobby house is drawn as a small, tangible place, not a collection of cards. */
const HouseMap = (() => {
 let dialog, lastFocus, selected = 'valley';
 const hint={valley:'Three trains · A county in miniature',coast:'A harbor circuit · Salt air & slow trains',alpine:'A mountain railway · Up among the pines',studio:'Two small layouts · A little imagination'};
 function currentRoom(){return typeof hobby!=='undefined'&&hobby.room? hobby.room:'valley';}
 function select(key){
  if(!HOUSE_ROOMS[key])return;selected=key;const r=HOUSE_ROOMS[key];
  dialog.querySelectorAll('[data-room]').forEach(node=>{node.classList.toggle('is-highlighted',node.dataset.room===key);node.classList.toggle('is-current',node.dataset.room===currentRoom());});
  dialog.querySelector('#hmPreviewNumber').textContent=r.number;
  dialog.querySelector('#hmPreviewTag').textContent=r.tag;
  dialog.querySelector('#hmPreviewTitle').textContent=r.name;
  dialog.querySelector('#hmPreviewDescription').textContent=r.description;
  dialog.querySelector('#hmPreviewMeta').textContent=hint[key];
  dialog.querySelector('#hmVisitLabel').textContent=key===currentRoom()?'Return to this room':'Enter the room';
  dialog.querySelector('#hmCurrent').textContent='You’re in '+HOUSE_ROOMS[currentRoom()].name.replace('The ','the ');
  dialog.style.setProperty('--hm-accent',r.color);
 }
 function visit(key){
  if(typeof visitHouseRoom!=='function')return;
  close();visitHouseRoom(key);
 }
 function init(){
  if(dialog)return;dialog=document.createElement('dialog');dialog.id='houseMap';dialog.className='house-map';dialog.setAttribute('aria-labelledby','hmTitle');
  dialog.innerHTML=`<div class="hm-paper"><header class="hm-header"><a class="hm-brand" href="#" aria-label="Whistlevale Hobby House"><svg viewBox="0 0 44 44" aria-hidden="true"><path d="M6 32V16L22 7l16 9v16L22 40 6 32Z"/><path d="M14 29V18h16v11M11 25h22M17 18v7m10-7v7M14 29l-3 6m19-6 3 6M15 33h14"/><circle cx="18" cy="28" r="1.5"/><circle cx="26" cy="28" r="1.5"/></svg><span>WHISTLEVALE<small>A HOUSE OF LITTLE WORLDS</small></span></a><div class="hm-header-note"><span class="hm-open-dot"></span> A LITTLE WORLD, ALWAYS OPEN</div><button type="button" class="hm-close" aria-label="Close the house map"><span>Back to the railway</span><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15"/></svg></button></header><div class="hm-intro"><div><div class="hm-eyebrow">FOUR ROOMS. COUNTLESS LITTLE STORIES.</div><h1 id="hmTitle">Find your little <em>somewhere.</em></h1></div><p>Through every doorway, another world.<br> Choose a room. Let the afternoon disappear.</p></div><div class="hm-map-stage">${HouseMapArt.draw()}<div class="hm-map-hint"><span></span> Select a room to step inside</div></div><nav class="hm-mobile-rooms" aria-label="Choose a room">${Object.entries(HOUSE_ROOMS).map(([key,r])=>`<button type="button" data-room="${key}"><span>${r.number}</span>${r.name.replace('The ','')}<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11m-4-4 4 4-4 4"/></svg></button>`).join('')}</nav><footer class="hm-preview"><div class="hm-preview-number" id="hmPreviewNumber">01</div><div class="hm-preview-copy"><div class="hm-eyebrow" id="hmPreviewTag"></div><h2 id="hmPreviewTitle"></h2><p id="hmPreviewDescription"></p></div><div class="hm-preview-action"><span id="hmPreviewMeta"></span><button type="button" id="hmVisit"><span id="hmVisitLabel">Enter the room</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-5-5 5 5-5 5"/></svg></button></div></footer><div class="hm-bottomline"><span id="hmCurrent"></span><span>BUILT SMALL. FELT DEEPLY.</span><span class="hm-bottom-instruction">Take your time. There’s no last train.</span></div></div>`;
  document.body.appendChild(dialog);
  dialog.querySelector('.hm-close').addEventListener('click',close);
  dialog.querySelector('.hm-brand').addEventListener('click',e=>{e.preventDefault();select(currentRoom());});
  dialog.querySelector('#hmVisit').addEventListener('click',()=>visit(selected));
  dialog.addEventListener('pointerover',e=>{const room=e.target.closest('[data-room]');if(room)select(room.dataset.room);});
  dialog.addEventListener('focusin',e=>{const room=e.target.closest('[data-room]');if(room)select(room.dataset.room);});
  dialog.addEventListener('click',e=>{const room=e.target.closest('[data-room]');if(room)visit(room.dataset.room);else if(e.target===dialog)close();});
  dialog.addEventListener('keydown',e=>{
   if(e.key==='Escape'){e.preventDefault();close();}
   const room=e.target.closest('[data-room]');
   if(room&&(e.key==='Enter'||e.key===' ')&&room.tagName.toLowerCase()!=='button'){e.preventDefault();visit(room.dataset.room);}
   e.stopPropagation();
  });
  dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
  dialog.addEventListener('close',()=>{document.body.classList.remove('house-map-open');});
  select(currentRoom());
 }
 function open(){
  init();if(dialog.open)return;lastFocus=document.activeElement;select(currentRoom());dialog.showModal();document.body.classList.add('house-map-open');
  requestAnimationFrame(()=>dialog.querySelector(`.hm-room-scene[data-room="${currentRoom()}"]`)?.focus({preventScroll:true}));
 }
 function close(){if(!dialog?.open)return;dialog.close();document.body.classList.remove('house-map-open');lastFocus?.focus?.({preventScroll:true});}
 return {init,open,close};
})();
function initHouseMap(){HouseMap.init();}
function openHouseMap(){HouseMap.open();}
function closeHouseMap(){HouseMap.close();}
