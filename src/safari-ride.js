'use strict';

// Passenger view belongs to a real carriage, not an overlay or a second scene.
// Only the local look angles ease. Camera translation uses the exact transform
// used by the visible stock, including the existing wheel-to-beam height.
const safariRideMotion=matchMedia('(prefers-reduced-motion: reduce)');
const safariRide={mounted:false,side:1,yaw:.17,pitch:-.035,lookYaw:.17,lookPitch:-.035,zoom:1,opener:null,saved:null,pointers:new Map(),pinch:null};
function safariPassengerAvailable(){return hobby.room==='safari'&&hobby.scene?.trains[0]?.stock==='safari'&&!building;}
function safariPassengerActive(){return safariPassengerAvailable()&&!hobby.cinema&&!shopMap.open&&(viewMode==='window-left'||viewMode==='window-right');}
function safariReleasePointers(){
 const ids=[...safariRide.pointers.keys()];safariRide.pointers.clear();safariRide.pinch=null;
 for(const id of ids)try{if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);}catch{}
}
function safariResetLook(){safariRide.yaw=.17;safariRide.pitch=-.035;safariRide.zoom=1;}
function safariUnmountSeat(){
 safariReleasePointers();safariRide.mounted=false;document.body.classList.remove('passenger-seat');$('safariSeatControls').hidden=true;
}
const safariSetView=setView;
setView=function(mode,announce=true){
 const seat=mode==='window-left'||mode==='window-right';
 if(seat&&!safariPassengerAvailable())return;
 if(seat){
  if(!safariRide.mounted){
   safariRide.saved={view:['room','overview','engine','follow','station','cab'].includes(viewMode)?viewMode:'overview',target:orbit.target.slice(),distance:orbit.distance,yaw:orbit.yaw,pitch:orbit.pitch};
   safariRide.opener=document.activeElement; safariResetLook();safariRide.lookYaw=safariRide.yaw;safariRide.lookPitch=safariRide.pitch;
  }
  safariReleasePointers();safariRide.side=mode==='window-left'?-1:1;
 }else if(safariRide.mounted)safariUnmountSeat();
 safariSetView(mode,announce);
 if(seat){safariRide.mounted=true;hobby.spot=-1;document.body.classList.add('passenger-seat');$('safariSeatControls').hidden=false;closeQuietControls();updateCamera(1);updateUI();}
};
function safariLeaveSeat(){
 const saved=safariRide.saved,opener=safariRide.opener;
 safariUnmountSeat();setView(saved?.view||'overview',false);
 if(saved&&['room','overview'].includes(saved.view)){orbit.target=saved.target;orbit.distance=saved.distance;orbit.yaw=saved.yaw;orbit.pitch=saved.pitch;}
 safariRide.saved=null;(opener?.isConnected&&opener.getClientRects().length?opener:$('viewsBtn'))?.focus({preventScroll:true});
}
const safariRideCamera=updateCamera;
updateCamera=function(dt){
 if(!safariPassengerActive()){
  if(safariRide.mounted)safariUnmountSeat();
  // Solstice's driving position is ahead of the passenger seating, not on the
  // steam engine's rear footplate. This remains distinct from Window seat.
  if(safariPassengerAvailable()&&viewMode==='cab'&&!hobby.cinema&&!shopMap.open){
   const m=safariCarMatrix(hobby.scene.trains[0],0);cameraPos=transform([0,1.58,1.28],m);cameraTarget=transform([0,1.52,25],m);cameraNear=.018;cameraProjection=perspective(1.20,screenW/screenH,cameraNear,500);VP=mm(cameraProjection,lookAt(cameraPos,cameraTarget));return;
  }
  safariRideCamera(dt);return;
 }
 const immediate=reduceMotion||safariRideMotion.matches,ease=1-Math.exp(-Math.max(0,dt)*16);
 safariRide.lookYaw=immediate?safariRide.yaw:mix(safariRide.lookYaw,safariRide.yaw,ease);safariRide.lookPitch=immediate?safariRide.pitch:mix(safariRide.lookPitch,safariRide.pitch,ease);
 const pose=safariPassengerPose(hobby.scene.trains[0],safariRide.side,safariRide.lookYaw,safariRide.lookPitch);
 cameraPos=pose.position;cameraTarget=pose.target;cameraNear=.018;
 const fov=(screenW<screenH?1.72:1.45)*safariRide.zoom;
 cameraProjection=perspective(clamp(fov,1.02,1.90),screenW/screenH,cameraNear,500);VP=mm(cameraProjection,lookAt(cameraPos,cameraTarget));
};
const safariRideUI=updateUI;
updateUI=function(){
 safariRideUI();if(!hobby.ready)return;
 const available=safariPassengerAvailable(),active=safariPassengerActive();
 for(const button of document.querySelectorAll('[data-passenger-only]'))button.hidden=!available;
 $('safariSeatControls').hidden=!active;document.body.classList.toggle('passenger-seat',active);
 $('safariWindowView').classList.toggle('selected',active);$('safariWindowView').setAttribute('aria-pressed',String(active));
 if(!active)return;
 $('safariSeatLeft').setAttribute('aria-pressed',String(safariRide.side===-1));$('safariSeatRight').setAttribute('aria-pressed',String(safariRide.side===1));
 $('safariSeatSide').textContent=safariRide.side===1?'Right window':'Left window';
 $('locationTitle').textContent='A seat in the savanna';$('locationDetail').textContent='Drag to look around. Pinch to adjust your view.';
};
const safariRideMap=openHouseMap;
openHouseMap=function(...args){if(safariRide.mounted)safariLeaveSeat();return safariRideMap(...args);};
// Standalone export may have captured a visible control. Always start clean.
safariUnmountSeat();
$('safariBoard').onclick=()=>{setView('window-right');canvas.focus({preventScroll:true});};
$('safariSeatLeft').onclick=()=>setView('window-left',false);
$('safariSeatRight').onclick=()=>setView('window-right',false);
$('safariSeatCenter').onclick=safariResetLook;
$('safariSeatLeave').onclick=safariLeaveSeat;
function safariStopGesture(event){event.preventDefault();event.stopImmediatePropagation();}
function safariBeginPinch(){
 const p=[...safariRide.pointers.values()];safariRide.pinch=p.length>=2?{distance:Math.max(10,Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)),zoom:safariRide.zoom}:null;
}
canvas.addEventListener('pointerdown',event=>{
 if(!safariPassengerActive()||event.button>0)return;
 safariStopGesture(event);canvas.focus({preventScroll:true});safariRide.pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
 try{canvas.setPointerCapture(event.pointerId);}catch{} safariBeginPinch();
},true);
canvas.addEventListener('pointermove',event=>{
 if(!safariPassengerActive()||!safariRide.pointers.has(event.pointerId))return;
 safariStopGesture(event);const old=safariRide.pointers.get(event.pointerId),point={x:event.clientX,y:event.clientY};safariRide.pointers.set(event.pointerId,point);
 if(safariRide.pointers.size>=2){
  const p=[...safariRide.pointers.values()],pinch=safariRide.pinch;if(pinch)safariRide.zoom=clamp(pinch.zoom*pinch.distance/Math.max(10,Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)),.75,1.12);
 }else{
  safariRide.yaw=clamp(safariRide.yaw-(point.x-old.x)*.0045*safariRide.side,-1.30,1.30);
  safariRide.pitch=clamp(safariRide.pitch+(point.y-old.y)*.0036,-.58,.60);
 }
},true);
function safariEndGesture(event){
 if(!safariRide.pointers.has(event.pointerId))return;
 safariStopGesture(event);safariRide.pointers.delete(event.pointerId);try{if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);}catch{} safariBeginPinch();
}
for(const type of['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,safariEndGesture,true);
canvas.addEventListener('wheel',event=>{if(safariPassengerActive()){safariStopGesture(event);safariRide.zoom=clamp(safariRide.zoom*Math.exp(clamp(event.deltaY,-160,160)*.0015),.75,1.12);}},{capture:true,passive:false});
canvas.addEventListener('dblclick',event=>{if(safariPassengerActive()){safariStopGesture(event);safariResetLook();}},true);
window.addEventListener('blur',safariReleasePointers);
document.addEventListener('visibilitychange',()=>{if(document.hidden)safariReleasePointers();});
window.addEventListener('keydown',event=>{
 if(!safariPassengerActive()||event.ctrlKey||event.metaKey||event.altKey||quietControls.panel||event.target.closest('input,textarea,select,[contenteditable="true"]'))return;
 if(event.key==='Escape'){safariStopGesture(event);safariLeaveSeat();return;}
 if(event.target.closest('button,a,summary'))return;
 if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','0','+','-','='].includes(event.key))return;
 safariStopGesture(event);
 if(event.key==='Home'||event.key==='0')safariResetLook();
 if(event.key==='ArrowLeft')safariRide.yaw=clamp(safariRide.yaw+.075*safariRide.side,-1.30,1.30);
 if(event.key==='ArrowRight')safariRide.yaw=clamp(safariRide.yaw-.075*safariRide.side,-1.30,1.30);
 if(event.key==='ArrowUp')safariRide.pitch=clamp(safariRide.pitch+.06,-.58,.60);
 if(event.key==='ArrowDown')safariRide.pitch=clamp(safariRide.pitch-.06,-.58,.60);
 if(event.key==='+'||event.key==='=')safariRide.zoom=clamp(safariRide.zoom*.95,.75,1.12);
 if(event.key==='-')safariRide.zoom=clamp(safariRide.zoom*1.05,.75,1.12);
},true);
