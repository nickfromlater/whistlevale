'use strict';

// Presentation only: this miniature never reads or changes account usage.
// No timers, new animation loop, network, storage, audio, or GPU allocations.
function codexResetPhase(seconds,reduced=false){
 if(seconds<0)return 'idle';
 if(reduced)return seconds<2.5?'complete':'idle';
 return seconds<1.65?'charging':seconds<2.25?'holding':seconds<3.15?'release':seconds<7?'complete':'idle';
}
function createHallResetExhibit(){
 let active=null,elapsed=-1,phase='idle',canvas,ctx,pin,cue,trigger,live,label,ratio=1,canvasW=0,canvasH=0;
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 const tau=Math.PI*2,clamp=n=>Math.max(0,Math.min(1,n));
 const samples=Array.from({length:112},(_,i)=>({a:i*2.39996323,r:.2+((i*37)%101)/101,h:((i*19)%97)/97}));
 function ensure(){
  if(canvas)return;
  canvas=document.createElement('canvas');canvas.className='reset-fx';canvas.setAttribute('aria-hidden','true');ctx=canvas.getContext('2d');
  pin=document.createElement('button');pin.className='reset-pin';pin.type='button';pin.textContent='↻';pin.setAttribute('aria-label','Press the miniature reset button');pin.onclick=press;
  cue=document.createElement('div');cue.className='reset-cue';cue.setAttribute('aria-hidden','true');
  document.body.append(canvas,pin,cue);hide();
 }
 function hide(){if(canvas){canvas.hidden=true;pin.hidden=true;cue.hidden=true;ctx?.clearRect(0,0,canvasW,canvasH);}}
 function setPhase(next){
  if(next===phase)return;phase=next;
  const busy=phase!=='idle';for(const b of[trigger,pin])b?.setAttribute('aria-disabled',String(busy));
  if(label)label.textContent=phase==='idle'?'Press to reset':phase==='charging'?'Winding up…':phase==='holding'?'Here we go…':phase==='release'?'A fresh start.':'Codex usage reset!';
  if(live)live.textContent=phase==='complete'?'Codex usage reset!':phase==='charging'?'Reset engine charging.':phase==='idle'?'Ready to reset again.':'';
  if(cue)cue.innerHTML=phase==='idle'?'<small>The reset engine</small><strong>Go on. Press it.</strong><span class="reset-line"></span>':phase==='complete'?'<small>Room for another idea</small><strong>Codex usage reset!</strong><span class="reset-line"></span>':phase==='release'?'<small>And just like that</small><strong>A fresh start.</strong>':'<small>'+ (phase==='holding'?'Make a little room':'Gathering possibilities')+'</small><strong>'+(phase==='holding'?'Ready?':'Something good<br>is winding up.')+'</strong>';
 }
 function press(){
  if(!active||elapsed>=0)return;
  elapsed=0;setPhase(codexResetPhase(0,motion.matches));
 }
 function clear(){active=null;elapsed=-1;hide();trigger=null;label=null;live=null;phase='idle';}
 function mount(entry,bay,container){
  clear();if(entry.id!=='codex-usage-reset')return;
  ensure();active={bay,scale:entry.scale};
  const panel=document.createElement('div');panel.className='reset-controls';
  trigger=document.createElement('button');trigger.type='button';trigger.className='reset-trigger';trigger.setAttribute('aria-describedby','resetCaption');
  label=document.createElement('span');label.textContent='Press to reset';trigger.append(label);
  const arrow=document.createElement('span');arrow.textContent='↻';arrow.setAttribute('aria-hidden','true');trigger.append(arrow);trigger.onclick=press;
  const caption=document.createElement('small');caption.id='resetCaption';caption.className='reset-caption';caption.textContent='A tiny ceremony for a fresh start.';
  live=document.createElement('span');live.className='reset-sr';live.setAttribute('role','status');live.setAttribute('aria-live','polite');live.setAttribute('aria-atomic','true');
  panel.append(trigger,caption,live);container.prepend(panel);phase='';setPhase('idle');
 }
 function frame({dt,project,width,height,obscured}){
  if(!active)return;
  if(obscured){hide();return;}
  if(!ctx)return;
  // Use the Hall's clamped dt: hidden tabs pause without finishing offscreen.
  if(elapsed>=0){elapsed+=dt;const next=codexResetPhase(elapsed,motion.matches);setPhase(next);if(next==='idle')elapsed=-1;}
  const {bay,scale}=active,c=Math.cos(bay.yaw||0),s=Math.sin(bay.yaw||0);
  const at=(x,y,z)=>project([bay.x+(x*c+z*s)*scale,bay.surfaceY+y*scale,bay.z+(z*c-x*s)*scale]);
  const center=at(0,1.92,.65),top=at(0,6.1,-.3);
  if(center.w<=.1||center.x<20||center.x>width-20||center.y<100||center.y>height-90){hide();return;}
  if(canvasW!==width||canvasH!==height){canvasW=width;canvasH=height;ratio=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);}
  canvas.hidden=false;pin.hidden=false;cue.hidden=false;ctx.clearRect(0,0,width,height);
  const inMotion=!motion.matches,progress=elapsed>=0?elapsed:0;
  pin.style.left=center.x+'px';pin.style.top=(center.y+(phase==='charging'?3:0))+'px';
  // Keep the headline on the miniature; clamp against the masthead on phones.
  cue.style.left=Math.max(130,Math.min(width-130,top.x))+'px';cue.style.top=Math.max(195,top.y)+'px';
  const radius=Math.max(25,Math.hypot(at(3.8,1.92,.65).x-center.x,at(3.8,1.92,.65).y-center.y));
  const busy=elapsed>=0;
  if(busy&&inMotion){
   const envelope=Math.min(clamp(progress/.7),clamp((7-progress)/1.1));
   const glow=ctx.createRadialGradient(center.x,center.y,0,center.x,center.y,Math.max(width,height)*.8);
   glow.addColorStop(0,'rgba(7,29,24,0)');glow.addColorStop(.25,'rgba(6,21,20,'+envelope*.22+')');glow.addColorStop(1,'rgba(6,18,19,'+envelope*.52+')');ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);
  }
  function glow(x,y,r,alpha,color='144,255,211'){
   if(r<=0||alpha<=0)return;const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba('+color+','+alpha+')');g.addColorStop(.25,'rgba('+color+','+alpha*.3+')');g.addColorStop(1,'rgba('+color+',0)');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);
  }
  function line(points,color,alpha,w=1){
   if(alpha<=0||points.some(p=>p.w<=.1))return;ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=w;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();ctx.globalAlpha=1;
  }
  function ring(r,y,alpha,rotation=0,tilt=0){
   const points=[];for(let i=0;i<=80;i++){const a=i*tau/80+rotation;points.push(at(Math.cos(a)*r,y+Math.sin(a)*r*tilt,Math.sin(a)*r));}line(points,'#bcffdf',alpha,1.2);
  }
  glow(center.x,center.y,radius*1.8,busy?.23:.07);
  if(!busy||!inMotion)return;
  ctx.globalCompositeOperation='screen';
  if(progress<2.25){
   const charge=clamp(progress/1.65),compress=progress>1.65?1-clamp((progress-1.65)/.6)*.82:1;
   // A double helix draws tiny possibilities into the ceramic cap.
   for(let j=0;j<2;j++){
    const points=[];for(let i=0;i<100;i++){const q=i/99,a=q*tau*2-progress*(1+charge*5)+j*Math.PI,r=(.5+q*2.6)*compress;points.push(at(Math.cos(a)*r,2+q*2.3,Math.sin(a)*r));}line(points,j?'#e7cc91':'#b8ffe0',charge*.72,1.2);
   }
   for(const p of samples.slice(0,64)){const q=(p.h+progress*.38)%1,r=(1-q)*3.7*compress,a=p.a-progress*(1+charge*2),v=at(Math.cos(a)*r,2+(1-q)*3.6,Math.sin(a)*r);glow(v.x,v.y,2+q*3,charge*.65,p.r>.5?'176,255,219':'255,222,151');}
   glow(center.x,center.y,radius*(.5+charge*.7)*compress,.3+charge*.35);
  }else{
   const release=progress-2.25,fade=clamp((7-progress)/1.8);
   // Three travelling halos crown the little machine, then dissolve.
   for(let i=0;i<3;i++){const q=release-i*.17;if(q>=0&&q<1.55)ring(.25+Math.sin(clamp(q/1.55)*Math.PI/2)*3.7,2+q*(1.4+i*.6),(1-q/1.55)*.86,release,.12*i);}
   glow(center.x,center.y,radius*(1+release*2),Math.max(0,1-release)*.6);
   // Bounded world-space fountain: golden ribbons, mint stars and slow embers.
   for(const [i,p]of samples.entries()){
    const age=release-p.h*.8;if(age<0)continue;
    const life=clamp(1-age/4.5)*fade,r=Math.min(3.65,(.45+p.r*2.8)*Math.sin(Math.min(age,3)*.5)),a=p.a+age*(p.r-.5)*.6;
    const yy=2+Math.max(0,age*(2.2+p.h*1.4)-age*age*.64);
    const v=at(Math.cos(a)*r,yy,Math.sin(a)*r);if(v.w<=.1||life<=0)continue;
    const color=i%3?'#bbffdd':'#ffe0a0';
    glow(v.x,v.y,i%7===0?11:4,life*.45,i%3?'168,255,213':'255,218,145');
    if(i%5===0){const tail=at(Math.cos(a-.035)*r,yy-.24,Math.sin(a-.035)*r);line([tail,v],color,life*.8,1.4);}
    else{ctx.save();ctx.globalAlpha=life;ctx.translate(v.x,v.y);ctx.rotate(a+age*2);ctx.fillStyle=color;const size=i%7===0?3:1.4;ctx.fillRect(-size,-.65,size*2,1.3);ctx.fillRect(-.65,-size,1.3,size*2);ctx.restore();}
   }
   if(release>.55&&release<3.8){
    const crown=at(0,5.6,0);glow(crown.x,crown.y,radius*2,Math.sin((release-.55)/3.25*Math.PI)*.14,'255,222,161');
   }
  }
  ctx.globalCompositeOperation='source-over';
 }
 return {mount,clear,frame};
}
