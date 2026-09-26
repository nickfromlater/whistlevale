'use strict';

// A camera in the real lead car. The house continues to own simulation,
// rendering, map residency and input outside this explicitly entered seat.
const orreryMotionPreference=matchMedia('(prefers-reduced-motion: reduce)');
const orreryRide={mounted:false,moving:!orreryMotionPreference.matches,yaw:0,pitch:0,zoom:1,pointers:new Map(),pinch:null,saved:null,opener:null,trip:null};
function orreryAvailable(){return hobby.room==='orrery'&&hobby.scene?.trains[0]?.stock==='orrery'&&!building;}
function orrerySeatActive(){return orreryAvailable()&&viewMode==='cab'&&!hobby.cinema&&!shopMap.open;}
// A trip owns only this train's temporary station hold. Global pause/throttle,
// simulation scheduling and other rooms remain owned by the house.
function orreryCancelTrip(){
 const trip=orreryRide.trip;if(!trip)return;
 trip.train.speed=trip.speed;orreryRide.trip=null;
}
function orreryBoardFromStation(){
 if(!orreryAvailable())return;
 orreryCancelTrip();setView('cab');closeQuietControls();
 const train=hobby.scene.trains[0],e=train.edge;
 orreryRide.trip={train,speed:train.speed,state:'boarding',start:0,finish:0};
 train.distance=(e.boarding+1.3)*e.normalDrive;train.speed=0;
 orreryResetLook();updateCamera(0);updateUI();$('orreryDispatch').focus({preventScroll:true});
}
function orreryDispatch(){
 const trip=orreryRide.trip;if(!trip||!orrerySeatActive()||trip.state==='riding')return;
 const e=trip.train.edge;
 // Start at the open dwell's closing phase: gate and restraint close together
 // before the car is allowed to move. The trip ends with both open next lap.
 trip.start=(e.boarding+e.dwell-.70)*e.normalDrive;
 trip.finish=(e.boarding+e.seconds+1.3)*e.normalDrive;
 trip.train.distance=trip.start;trip.train.speed=trip.speed>0?trip.speed:1;trip.state='riding';
 if(throttle===0)setThrottle(42);if(paused)togglePause();
 updateUI();canvas.focus({preventScroll:true});
}
function orreryTripProgress(){
 const trip=orreryRide.trip;
 if(!trip)return 0;if(trip.state==='arrived')return 1;
 return trip.state==='riding'?clamp((trip.train.distance-trip.start)/(trip.finish-trip.start)):0;
}
function orreryAdvanceTrip(){
 const trip=orreryRide.trip;if(!trip)return;
 if(!orrerySeatActive()||hobby.scene.trains[0]!==trip.train){orreryCancelTrip();return;}
 if(trip.state==='riding'&&trip.train.distance>=trip.finish){
  trip.train.distance=trip.finish;trip.train.speed=0;trip.state='arrived';
  // Announce once without pulling focus away from the canvas or an open panel.
  if($('orreryArrival'))$('orreryArrival').textContent='Back at Platform Zero. One complete circuit. Ride again or leave your seat.';
 }
}
const orrerySimulation=updateSimulation;
updateSimulation=function(dt){orrerySimulation(dt);orreryAdvanceTrip();};
function orreryReleasePointers(){
 const ids=[...orreryRide.pointers.keys()];orreryRide.pointers.clear();orreryRide.pinch=null;
 for(const id of ids)try{if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);}catch{}
}
function orreryResetLook(){orreryRide.yaw=0;orreryRide.pitch=0;orreryRide.zoom=1;}
function orreryLeaveSeat(){
 const saved=orreryRide.saved,opener=orreryRide.opener;
 orreryCancelTrip();orreryRide.mounted=false;orreryReleasePointers();setView(saved?.view||'overview',false);
 if(saved&&['room','overview'].includes(saved.view))Object.assign(orbit,{target:saved.target.slice(),distance:saved.distance,yaw:saved.yaw,pitch:saved.pitch});
 orreryRide.saved=null;(opener?.isConnected&&opener.getClientRects().length?opener:$('orreryBoard'))?.focus({preventScroll:true});updateUI();
}
const orrerySetView=setView;
setView=function(mode,announce=true){
 if(orreryAvailable()&&mode==='cab'&&!orreryRide.mounted){
  orreryRide.saved={view:viewMode==='cab'?'overview':viewMode,target:orbit.target.slice(),distance:orbit.distance,yaw:orbit.yaw,pitch:orbit.pitch};
  orreryRide.opener=document.activeElement;orreryRide.mounted=true;orreryResetLook();
 }else if(mode!=='cab'){orreryCancelTrip();orreryRide.mounted=false;orreryReleasePointers();}
 orrerySetView(mode,announce);
};
function orreryLookAt(eye,target,up){
 const z=norm(sub(eye,target)),x=norm(cross(up,z)),y=cross(z,x);
 return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]);
}
function orrerySeatPose(train,yaw=0,pitch=0){
 const m=orreryCarMatrix(train),eye=ORRERY_STOCK.seat,direction=[Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch)];
 return {position:transform(eye,m),target:transform(add(eye,mul(direction,24)),m),up:[m[4],m[5],m[6]]};
}
const orreryHouseTrainMatrix=hobbyTrainMatrix;
hobbyTrainMatrix=function(){return orreryAvailable()?orreryCarMatrix(hobby.scene.trains[0]):orreryHouseTrainMatrix();};
const orreryUpdateCamera=updateCamera;
updateCamera=function(dt){
 if(!orrerySeatActive()){if(orreryRide.mounted){orreryCancelTrip();orreryRide.mounted=false;orreryReleasePointers();}orreryUpdateCamera(dt);return;}
 const pose=orreryRide.moving?orrerySeatPose(hobby.scene.trains[0],orreryRide.yaw,orreryRide.pitch):{position:[-65,29,49],target:[0,13,0],up:[0,1,0]};
 cameraPos=pose.position;cameraTarget=pose.target;cameraNear=orreryRide.moving?.035:.3;
 cameraProjection=perspective((orreryRide.moving?1.28:.95)*orreryRide.zoom,screenW/screenH,cameraNear,500);
 VP=mm(cameraProjection,orreryLookAt(cameraPos,cameraTarget,pose.up));
};
function createOrreryControls(){
 if($('orreryTicket'))return;
 const ticket=document.createElement('section');ticket.id='orreryTicket';ticket.className='orrery-ticket quiet-generated';ticket.hidden=true;ticket.setAttribute('aria-label','Comet rollercoaster');
 ticket.innerHTML='<span class="orrery-eyebrow">PLATFORM ZERO · ADMIT ONE</span><button id="orreryBoard" type="button" aria-describedby="orreryBoardDetail">Ride the Comet <span aria-hidden="true">↗</span></button><span id="orreryBoardDetail" class="orrery-ticket-detail">Take your seat. Dispatch a full circuit.</span><span id="orreryPhase">Boarding</span><span class="orrery-progress" aria-hidden="true"><i id="orreryProgress"></i></span>';
 const seat=document.createElement('section');seat.id='orrerySeat';seat.className='orrery-seat-controls quiet-generated';seat.hidden=true;seat.setAttribute('aria-label','Comet front-seat controls');
 seat.innerHTML='<div class="orrery-seat-heading"><span class="orrery-eyebrow">COMET · FRONT ROW</span><span id="orrerySeatPhase">Platform zero</span><span class="orrery-progress" aria-hidden="true"><i id="orreryTripProgress"></i></span></div><button id="orreryDispatch" type="button">Dispatch Comet</button><button id="orreryMotion" type="button">Moving seat</button><button id="orreryCenter" type="button" aria-label="Recenter the ride camera">Recenter</button><button id="orreryLeave" type="button">Leave seat</button><span id="orreryArrival" class="orrery-announcement" role="status" aria-live="polite" aria-atomic="true"></span>';
 document.body.append(ticket,seat);
 $('orreryBoard').onclick=orreryBoardFromStation;$('orreryDispatch').onclick=orreryDispatch;
 $('orreryLeave').onclick=orreryLeaveSeat;$('orreryCenter').onclick=orreryResetLook;
 $('orreryMotion').onclick=()=>{orreryRide.moving=!orreryRide.moving;orreryResetLook();updateUI();};
 document.body.classList.remove('orrery-in-seat');
}
const orreryInitControls=initQuietControls;
initQuietControls=function(...args){orreryInitControls(...args);createOrreryControls();};
const orreryUpdateUI=updateUI;
updateUI=function(){
 orreryUpdateUI();if(!$('orreryTicket'))return;
 const active=orrerySeatActive(),available=orreryAvailable()&&!hobby.cinema&&!shopMap.open&&!quietControls.panel;
 $('orreryTicket').hidden=!available||active;$('orrerySeat').hidden=!available||!active;document.body.classList.toggle('orrery-in-seat',active);
 if(!available)return;
 const train=hobby.scene.trains[0],motion=train.edge.motionAt(train.distance),trip=orreryRide.trip,phase=trip?.state==='boarding'?'Seated · ready when you are':trip?.state==='arrived'?'Back at Platform Zero':paused?'Paused':motion.phase;
 $('orreryPhase').textContent=phase;$('orrerySeatPhase').textContent=(orreryRide.moving?'':'Steady overlook · ')+phase;
 $('orreryProgress').style.width=(motion.lap*100).toFixed(2)+'%';
 $('orreryTripProgress').style.width=((trip?orreryTripProgress():motion.lap)*100).toFixed(2)+'%';
 $('orreryDispatch').hidden=!trip||trip.state==='riding';$('orreryDispatch').textContent=trip?.state==='arrived'?'Ride again':'Dispatch Comet';
 if(trip?.state!=='arrived')$('orreryArrival').textContent='';
 $('orreryMotion').setAttribute('aria-label',orreryRide.moving?'Switch to a steady overlook':'Switch to the moving seat, which banks and inverts');$('orreryMotion').textContent=orreryRide.moving?'Steady overlook':'Moving seat';$('orreryCenter').hidden=!orreryRide.moving;
 if(active){$('locationTitle').textContent=trip?.state==='arrived'?'Back among the stars.':'A little escape from gravity';$('locationDetail').textContent=trip?.state==='boarding'?'Your train is waiting. Dispatch when you are ready. The moving seat banks and inverts.':trip?.state==='arrived'?'One complete journey. Stay a little longer, or take the Comet round again.':orreryRide.moving?'Drag or use arrow keys to look. Escape leaves your seat.':'Steady overlook. Moving seat is an optional full-motion, inverting camera.';}
};
const orreryOpenMap=openHouseMap;
openHouseMap=function(...args){if(orrerySeatActive())orreryLeaveSeat();return orreryOpenMap(...args);};
function orreryStopGesture(event){event.preventDefault();event.stopImmediatePropagation();}
function orreryPinch(){const p=[...orreryRide.pointers.values()];orreryRide.pinch=p.length===2?{distance:Math.max(10,Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)),zoom:orreryRide.zoom}:null;}
canvas.addEventListener('pointerdown',event=>{
 if(!orrerySeatActive()||event.button>0)return;orreryStopGesture(event);if(orreryRide.pointers.size>=2)return;canvas.focus({preventScroll:true});orreryRide.pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});try{canvas.setPointerCapture(event.pointerId);}catch{}orreryPinch();
},true);
canvas.addEventListener('pointermove',event=>{
 if(!orrerySeatActive()||!orreryRide.pointers.has(event.pointerId))return;orreryStopGesture(event);
 const old=orreryRide.pointers.get(event.pointerId),q={x:event.clientX,y:event.clientY};orreryRide.pointers.set(event.pointerId,q);
 if(orreryRide.pointers.size===2){const p=[...orreryRide.pointers.values()],pinch=orreryRide.pinch;if(pinch)orreryRide.zoom=clamp(pinch.zoom*pinch.distance/Math.max(10,Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)),.78,1.2);}
 else{orreryRide.yaw=clamp(orreryRide.yaw-(q.x-old.x)*.004,-.95,.95);orreryRide.pitch=clamp(orreryRide.pitch+(q.y-old.y)*.0035,-.52,.52);}
},true);
function orreryEndGesture(event){if(!orreryRide.pointers.has(event.pointerId))return;orreryStopGesture(event);orreryRide.pointers.delete(event.pointerId);try{if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);}catch{}orreryPinch();}
for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,orreryEndGesture,true);
canvas.addEventListener('wheel',event=>{if(orrerySeatActive()){orreryStopGesture(event);orreryRide.zoom=clamp(orreryRide.zoom*Math.exp(clamp(event.deltaY,-150,150)*.0015),.78,1.2);}},{capture:true,passive:false});
window.addEventListener('blur',orreryReleasePointers);document.addEventListener('visibilitychange',()=>{if(document.hidden)orreryReleasePointers();});
orreryMotionPreference.addEventListener('change',event=>{if(event.matches)orreryRide.moving=false;orreryReleasePointers();updateUI();});
window.addEventListener('keydown',event=>{
 if(!orrerySeatActive()||event.ctrlKey||event.metaKey||event.altKey||quietControls.panel||event.target.closest('input,textarea,select,[contenteditable="true"]'))return;
 if(event.key==='Escape'){orreryStopGesture(event);orreryLeaveSeat();return;}
 if(event.target.closest('button,a,summary'))return;
 if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(event.key))return;orreryStopGesture(event);
 if(event.key==='Home')orreryResetLook();
 if(event.key==='ArrowLeft')orreryRide.yaw=clamp(orreryRide.yaw+.075,-.95,.95);
 if(event.key==='ArrowRight')orreryRide.yaw=clamp(orreryRide.yaw-.075,-.95,.95);
 if(event.key==='ArrowUp')orreryRide.pitch=clamp(orreryRide.pitch+.06,-.52,.52);
 if(event.key==='ArrowDown')orreryRide.pitch=clamp(orreryRide.pitch-.06,-.52,.52);
},true);
