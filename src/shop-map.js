'use strict';

// One renderer, one set of railway meshes: the house is a change of scale and
// viewpoint. Room modules never need to know where their room sits in the shop.
const shopMap={open:false,active:false,loading:false,selected:'valley',saved:null,revision:-1,token:0,entry:null,pointers:new Map(),drag:null,orbit:null};
const shopBase={draw,static:drawHobbyStatic,trains:drawHobbyTrains,particles:drawHobbyParticles,camera:updateCamera,simulation:updateSimulation,audio:updateHobbyAudio};
const shopBaseProject=project,shopBaseRailwayAudio=RailwayAudio.prototype.update;
let shopRoomModel=null,shopLightCache=new WeakMap();
draw=function(mesh,model=I,p=mainProgram){if(mesh)shopBase.draw(mesh,shopRoomModel?(model===I?shopRoomModel:mm(shopRoomModel,model)):model,p);};
project=function(point){return shopBaseProject(shopRoomModel?transform(point,shopRoomModel):point);};
RailwayAudio.prototype.update=function(dt){
 const run=()=>{
  if(HOUSE_ROOMS[hobby.room]?.railway===false)return;
  const saved={lead:leadInfo,travel,speed},train=hobby.scene?.trains[0];
  try{
   if(hobby.room!=='valley'&&train){leadInfo=hobbyTrainInfo();travel=train.distance;speed*=train.speed;}
   this.houseMotion??=new Map();const motion=this.houseMotion.get(hobby.room);
   this.lastChuff=motion?.chuff??Math.floor(travel/.45);this.lastJoint=motion?.joint??Math.floor(travel/1.42);
   if(train&&train.type!=='steam')this.lastChuff=Math.floor(travel/.45);
   shopBaseRailwayAudio.call(this,dt);
   this.houseMotion.set(hobby.room,{chuff:this.lastChuff,joint:this.lastJoint});
  }finally{leadInfo=saved.lead;travel=saved.travel;speed=saved.speed;}
 };
 const entry=shopMap.active&&SHOP_HOUSE_LAYOUT.byKey[shopMap.selected];
 if(entry)return shopRoomScope(entry,run);return run();
};
function isShopMapActive(){return shopMap.active;}
function shopRoomScope(entry,callback){
 const old={model:shopRoomModel,room:hobby.room,scene:hobby.scene,eye:cameraPos,target:cameraTarget,view:viewMode,cutaway};
 shopRoomModel=entry.model;hobby.room=entry.key;hobby.scene=entry.key==='valley'?null:roomScenes.get(entry.key);
 cameraPos=mul(sub(cameraPos,entry.offset),1/entry.scale);cameraTarget=mul(sub(cameraTarget,entry.offset),1/entry.scale);viewMode='overview';cutaway=false;
 try{return callback();}finally{shopRoomModel=old.model;hobby.room=old.room;hobby.scene=old.scene;cameraPos=old.eye;cameraTarget=old.target;viewMode=old.view;cutaway=old.cutaway;}
}
function shopWallVisible(w,entry){
 if(!entry.outerWalls.includes(w.which))return false;
 const halfX=entry.footprint[0]/2-1,halfZ=entry.footprint[1]/2-1;
 return w.which==='back'?cameraPos[2]>-halfZ:w.which==='front'?cameraPos[2]<halfZ:w.which==='left'?cameraPos[0]>-halfX:cameraPos[0]<halfX;
}
function shopRoomLights(entry,p){
 if(p!==mainProgram)return;
 let lights=shopLightCache.get(entry);
 if(!lights){lights={room:new Float32Array(houseRoomLights(entry.key).map(point=>transform(point,entry.model)).flat()),layout:new Float32Array(houseLayoutLights(entry.key).map(point=>transform(point,entry.model)).flat())};shopLightCache.set(entry,lights);}
 gl.uniform3fv(uniform(p,'uRoomLights[0]'),lights.room);
 gl.uniform3fv(uniform(p,'uLamps[0]'),lights.layout);
 uv3(p,'uHead',transform(transform([0,1.3,1.7],hobbyTrainMatrix()),entry.model));uv3(p,'uForward',hobbyHasTrain()?hobbyTrainInfo().f:[0,0,0]);
}
drawHobbyStatic=function(p,shadow){
 if(!shopMap.active)return shopBase.static(p,shadow);
 draw(shopHouseBuilt.mesh,I,p);
 for(const entry of SHOP_HOUSE_LAYOUT.rooms)shopRoomScope(entry,()=>{
  shopRoomLights(entry,p);
  if(entry.key==='valley'){
   if(!shadow){draw(roomFloorMesh,I,p);draw(waterMesh,I,p);for(const w of roomWalls)if(shopWallVisible(w,entry))draw(w.mesh,I,p);}
   draw(roomFurnitureMesh,I,p);draw(staticMesh,I,p);drawWorkshop(p,shadow);draw(hobby.life?.mesh,I,p);
  }else{
   const scene=hobby.scene;draw(scene.mesh,I,p);draw(scene.lifeDetails?.mesh,I,p);
   if(!shadow)for(const w of scene.walls)if(shopWallVisible(w,entry))draw(w.mesh,I,p);
  }
 });
};
drawHobbyTrains=function(p){
 if(!shopMap.active)return shopBase.trains(p);
 for(const entry of SHOP_HOUSE_LAYOUT.rooms)shopRoomScope(entry,()=>{
  shopRoomLights(entry,p);
  shopBase.trains(p);
  if(entry.key==='valley'&&p===mainProgram)for(const model of signalModels)draw(signalGreenMesh,model,p);
 });
};
drawHobbyParticles=function(){if(!shopMap.active)shopBase.particles();};
updateSimulation=function(dt){
 if(shopMap.active&&shopMap.revision!==houseRoomRevision){
  const selected=shopMap.selected;closeShopMap();
  try{activateHouseRoom(hobby.room);openHouseMap().then(()=>shopMapSelect(selected));}
  catch(error){console.error(error);toast('The updated room could not open. Please try again.');}
 }
 shopBase.simulation(dt);
 if(shopMap.active&&!paused)for(const [key,scene]of roomScenes)if(key!==hobby.room)for(const train of scene.trains)train.distance+=dt*train.speed*speed;
};
updateHobbyAudio=function(dt){
 if(!shopMap.active)return shopBase.audio(dt);
 const entry=SHOP_HOUSE_LAYOUT.byKey[shopMap.selected];
 if(entry)shopRoomScope(entry,()=>shopBase.audio(dt));
};
function shopCameraPosition(q){return add(q.target,[Math.sin(q.yaw)*Math.cos(q.pitch)*q.distance,Math.sin(q.pitch)*q.distance,Math.cos(q.yaw)*Math.cos(q.pitch)*q.distance]);}
function shopOverview(){
 const q=SHOP_HOUSE_LAYOUT.mapEntry,phone=innerWidth<700;
 // Fit the house between the small header and the room directory.
 const fitWidth=SHOP_HOUSE_LAYOUT.width/(2*Math.tan(.36)*(innerWidth/innerHeight)*.80);
 return{target:q.target.slice(),distance:Math.max(q.distance*(phone?1.38:1.05),fitWidth),pitch:phone?1.02:.87,yaw:.035};
}
function shopProjection(){
 const phone=innerWidth<700;cameraNear=.3;
 cameraProjection=perspective(.72,screenW/screenH,cameraNear,Math.max(700,shopMap.orbit.distance*4));
 cameraProjection[9]=phone?-.07:0;
 VP=mm(cameraProjection,lookAt(cameraPos,cameraTarget));
}
updateCamera=function(dt){
 if(!shopMap.active)return shopBase.camera(dt);
 if(shopMap.entry){
  const e=shopMap.entry;e.elapsed+=dt;const t=clamp(e.elapsed/e.duration,0,1),u=t*t*(3-2*t);
  cameraPos=lerpV(e.fromPos,e.toPos,u);cameraTarget=lerpV(e.fromTarget,e.toTarget,u);
  shopProjection();cameraProjection[8]*=1-u;cameraProjection[9]*=1-u;VP=mm(cameraProjection,lookAt(cameraPos,cameraTarget));
  if(t===1){shopMap.entry=null;shopFinishEntry(e.key,e.cinema);return;}
 }else{
  const blend=reduceMotion?1:1-Math.exp(-dt*6);
  cameraPos=lerpV(cameraPos,shopCameraPosition(shopMap.orbit),blend);cameraTarget=lerpV(cameraTarget,shopMap.orbit.target,blend);shopProjection();
 }
 ShopMapUI.setMarkerPositions(SHOP_HOUSE_LAYOUT.rooms.map(entry=>{const point=project(entry.labelAnchor);return{key:entry.key,...point,visible:!shopMap.entry&&point.visible};}));
};
function shopMapSelect(key){
 if(!SHOP_HOUSE_LAYOUT.byKey[key]||shopMap.loading||shopMap.entry)return;
 shopMap.selected=key;ShopMapUI.select(key,hobby.room);
}
function shopMapResetView(){if(shopMap.loading||shopMap.entry)return;shopMap.orbit=shopOverview();}
function shopRestore(){
 const saved=shopMap.saved;if(!saved)return;
 viewMode=saved.view;Object.assign(orbit,saved.orbit);cameraPos=saved.eye;cameraTarget=saved.target;lightVP=saved.light; lensAmount=saved.lens;
 shopMap.saved=null;shadowDirty=true;
}
function closeShopMap(){
 if(!shopMap.open)return;
 shopMap.token++;shopMap.open=false;shopMap.active=false;shopMap.loading=false;shopMap.entry=null;shopMap.pointers.clear();shopMap.drag=null;
 canvas.style.cursor='';document.body.classList.remove('shop-map-open');ShopMapUI.setLoading(null);ShopMapUI.hide();shopRestore();updateUI();
}
function closeHouseMap(){closeShopMap();}
async function openHouseMap(){
 if(!hobby.ready||shopMap.open||hobby.transition)return;
 if(typeof closeQuietControls==='function')closeQuietControls();
 if(building)enterBuild(false);if(hobby.cinema)leaveCinema(false);
 shopMap.saved={view:viewMode,orbit:{...orbit,target:orbit.target.slice()},eye:cameraPos.slice(),target:cameraTarget.slice(),light:lightVP,lens:lensAmount};
 shopMap.open=true;shopMap.loading=true;shopMap.selected=hobby.room;shopLightCache=new WeakMap();const token=++shopMap.token;
 for(const id of['soundPanel','playlistPanel','ambiencePanel','layoutPanel','trainInspector'])if($(id))$(id).hidden=true;
 // Capture the opener before hiding the room controls, which can blur it.
 document.body.classList.remove('hidden-ui');hidden=false;ShopMapUI.show(hobby.room);document.body.classList.add('shop-map-open');
 try{
  // Re-read the registry after each yield: a new module may register while
  // earlier rooms are being prepared, including a replacement of a cached one.
  for(;;){
   const pending=Object.entries(HOUSE_ROOMS).find(([key])=>key!=='valley'&&!roomScenes.has(key));if(!pending)break;
   const [key,room]=pending;
   ShopMapUI.setLoading('Opening '+room.name.replace(/^The /,'')+'…');
   await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   if(token!==shopMap.token)return;getHouseScene(key);
  }
  if(token!==shopMap.token)return;
  if(!shopHouseBuilt||shopMap.revision!==houseRoomRevision){buildShopHouse();shopMap.revision=houseRoomRevision;}
  ShopMapUI.refresh();
  shopMap.orbit=shopOverview();cameraPos=shopCameraPosition(shopMap.orbit);cameraTarget=shopMap.orbit.target.slice();
  const extent=Math.max(SHOP_HOUSE_LAYOUT.width,SHOP_HOUSE_LAYOUT.depth)*.9+40,center=SHOP_HOUSE_LAYOUT.mapEntry.target;
  lightVP=mm(ortho(-extent,extent,-extent,extent,1,extent*4),lookAt(add(center,mul(sunDir,extent*2)),center));
  lensAmount=0;viewMode='overview';shopMap.active=true;shopMap.loading=false;shadowDirty=true;canvas.style.cursor='grab';ShopMapUI.setLoading(null);shopProjection();
 }catch(error){console.error(error);closeShopMap();toast('The shop map could not open. Please try again.');}
}
function shopFinishEntry(key,cinema){
 closeShopMap();
 try{activateHouseRoom(key);if(cinema)enterCinema();else $('houseMapButton')?.focus({preventScroll:true});shopBase.camera(0);}
 catch(error){console.error(error);toast('This room could not open. Please try again.');}
}
function shopMapEnter(key,cinema=false){
 if(!shopMap.active||shopMap.loading||shopMap.entry)return;
 const entry=SHOP_HOUSE_LAYOUT.byKey[key],room=HOUSE_ROOMS[key];if(!entry||!room)return;
 shopMapSelect(key);ShopMapUI.setLoading('Entering '+room.name.replace(/^The /,'')+'…');
 const phone=innerWidth<700,q={target:room.target,distance:room.distance*(phone?1.78:1),pitch:phone?Math.max(.74,room.pitch):room.pitch,yaw:phone?.12:room.yaw};
 shopMap.entry={key,cinema,elapsed:0,duration:reduceMotion?.01:1.2,fromPos:cameraPos.slice(),fromTarget:cameraTarget.slice(),toPos:transform(shopCameraPosition(q),entry.model),toTarget:transform(q.target,entry.model)};
 shopMap.pointers.clear();shopMap.drag=null;canvas.style.cursor='';
}
function shopPick(x,y){
 const ray=screenRay(x,y);if(ray.dir[1]>=-.001)return null;
 const t=(SHOP_HOUSE_LAYOUT.floorY+9-ray.origin[1])/ray.dir[1];if(t<0)return null;
 const p=add(ray.origin,mul(ray.dir,t));
 return SHOP_HOUSE_LAYOUT.rooms.find(({hitBounds:b})=>p[0]>=b.x0&&p[0]<=b.x1&&p[2]>=b.z0&&p[2]<=b.z1)?.key||null;
}
function initHouseMap(){
 ShopMapUI.init();
 canvas.setAttribute('aria-label',`${Object.keys(HOUSE_ROOMS).length} miniature worlds in Whistlevale. Drag to explore; scroll or pinch to zoom.`);
 // Installed on window capture so the legacy editor's canvas capture listeners
 // cannot also consume a shop gesture. Normal room controls remain unchanged.
 const block=e=>{e.preventDefault();e.stopImmediatePropagation();};
 window.addEventListener('pointerdown',e=>{
  if(!shopMap.open||e.target!==canvas)return;
  if(typeof soundMuted==='function'&&!soundMuted()&&!audio?.active)enableSound(true);
  block(e);if(!shopMap.active||shopMap.entry)return;
  canvas.setPointerCapture(e.pointerId);shopMap.pointers.set(e.pointerId,[e.clientX,e.clientY]);
  shopMap.drag={x:e.clientX,y:e.clientY,moved:shopMap.pointers.size>1};canvas.style.cursor='grabbing';
 },true);
 window.addEventListener('pointermove',e=>{
  if(!shopMap.open||e.target!==canvas)return;block(e);if(!shopMap.active||shopMap.entry)return;
  const previous=shopMap.pointers.get(e.pointerId);
  if(!previous){canvas.style.cursor=shopPick(e.clientX,e.clientY)?'pointer':'grab';return;}
  const next=[e.clientX,e.clientY],other=[...shopMap.pointers].find(([id])=>id!==e.pointerId)?.[1];
  if(other){const before=Math.hypot(previous[0]-other[0],previous[1]-other[1]),after=Math.hypot(next[0]-other[0],next[1]-other[1]);if(after>4)shopMap.orbit.distance=clamp(shopMap.orbit.distance*before/after,45,SHOP_HOUSE_LAYOUT.mapEntry.distance*3);}
  else{shopMap.orbit.yaw-=(next[0]-previous[0])*.005;shopMap.orbit.pitch=clamp(shopMap.orbit.pitch+(next[1]-previous[1])*.004,.35,1.42);}
  if(shopMap.drag&&Math.hypot(next[0]-shopMap.drag.x,next[1]-shopMap.drag.y)>5)shopMap.drag.moved=true;
  shopMap.pointers.set(e.pointerId,next);
 },true);
 const release=e=>{
  if(!shopMap.open||e.target!==canvas)return;block(e);
  const click=e.type==='pointerup'&&shopMap.drag&&!shopMap.drag.moved&&shopMap.pointers.size===1;
  shopMap.pointers.delete(e.pointerId);if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
  if(!shopMap.pointers.size){shopMap.drag=null;canvas.style.cursor='grab';}
  if(click){const key=shopPick(e.clientX,e.clientY);if(key)shopMapEnter(key);}
 };
 window.addEventListener('pointerup',release,true);window.addEventListener('pointercancel',release,true);
 window.addEventListener('wheel',e=>{if(!shopMap.open||e.target!==canvas)return;block(e);if(shopMap.active&&!shopMap.entry)shopMap.orbit.distance=clamp(shopMap.orbit.distance*Math.exp(clamp(e.deltaY,-100,100)*.0015),45,SHOP_HOUSE_LAYOUT.mapEntry.distance*3);},{capture:true,passive:false});
 for(const type of['click','dblclick','contextmenu'])window.addEventListener(type,e=>{if(shopMap.open&&e.target===canvas)block(e);},true);
 window.addEventListener('keydown',e=>{
  if(!shopMap.open||e.target.closest?.('#shopMapUI'))return;
  if(e.key==='Escape'||e.key.toLowerCase()==='g'){block(e);closeShopMap();}
  else if(e.key!=='Tab'&&!e.metaKey&&!e.ctrlKey)block(e);
 },true);
 window.addEventListener('resize',()=>{if(shopMap.active&&!shopMap.entry)shopMapResetView();});
}
