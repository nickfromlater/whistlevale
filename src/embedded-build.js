'use strict';

// The wireframe that stands in while a guest miniature is being built.
//
// The adapter reports the stages the original code actually runs, in order:
// gorge, rock, buildings, lanterns, forest, train, water, light. This draws an
// approximation of each one as it lands, so the table is visibly being made
// rather than showing a spinner over an empty room. It is line work in the
// room's own space — every point goes through the house's project(), so it
// keeps the room's perspective and parallax and reads as something standing on
// the table rather than a picture laid on it.
//
// Deliberately rough. It is a sketch of somebody else's model, and looking like
// a sketch is how it avoids pretending to be their work.

const EMBEDDED_BUILD_STAGES=[
 'Sculpting the gorge and railway…',
 'Laying the mountain’s rock faces…',
 'Opening the station and shrine…',
 'Hanging the lanterns…',
 'Planting the mountain forest…',
 'Putting the local train on the line…',
 'Filling the river and waterfall…',
 'Lighting the miniature…'
];

// Deterministic, so the sketch is the same every time the room is entered and
// never flickers into a different mountain between frames.
function embeddedBuildRandom(seed){
 let s=seed>>>0;
 return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
}

// The rail centreline, as a gentle S across the table. Everything else hangs
// off it, the way the original's world curve does.
function embeddedBuildRail(table,t){
 const {halfWidth:W,halfDepth:D,top}=table;
 const x=-W*.86+t*W*1.72;
 const z=Math.sin(t*Math.PI*1.15-.35)*D*.52;
 const y=top+5.2+Math.sin(t*Math.PI)*2.1+t*1.4;
 return[x,y,z];
}

function embeddedBuildShapes(table){
 const {halfWidth:W,halfDepth:D,top}=table;
 const rnd=embeddedBuildRandom(0x59a1);
 const line=(...points)=>points;
 const stages=[];

 // 1 — the gorge and the line through it.
 const ridge=[],rail=[],gorge=[];
 for(let i=0;i<=26;i++){
  const t=i/26;
  ridge.push([-W+t*2*W,top+16+Math.sin(t*5.1)*7.4+Math.cos(t*2.3)*4.2,-D*.82]);
 }
 for(let i=0;i<=40;i++)rail.push(embeddedBuildRail(table,i/40));
 for(let i=0;i<=18;i++){
  const t=i/18;
  gorge.push([-W*.12+Math.sin(t*3.3)*W*.1,top+9-t*9,-D*.55+t*D*1.5]);
 }
 stages.push({lines:[ridge,rail,gorge,
  // The bridge deck carrying the line over the cut.
  line([-W*.30,top+7.1,-D*.06],[W*.14,top+7.1,D*.05]),
  line([-W*.30,top+5.6,-D*.06],[W*.14,top+5.6,D*.05]),
  line([-W*.30,top+7.1,-D*.06],[-W*.30,top+.4,-D*.06]),
  line([W*.14,top+7.1,D*.05],[W*.14,top+.4,D*.05])
 ]});

 // 2 — rock faces either side of the cut.
 const rock=[];
 for(let i=0;i<9;i++){
  const t=i/8,side=i%2?1:-1;
  const x=-W*.12+side*(W*.13+rnd()*W*.1),z=-D*.5+t*D*1.4;
  rock.push(line([x,top,z],[x+side*2.4,top+6+rnd()*5,z-1.6],[x+side*1.1,top+10+rnd()*6,z+2.2]));
 }
 for(let i=0;i<6;i++){
  const t=i/5;
  rock.push(line([-W+t*W*.7,top+2,-D*.7+rnd()*D*.4],[-W*.9+t*W*.7,top+11+rnd()*7,-D*.75]));
 }
 stages.push({lines:rock});

 // 3 — the station platform and the shrine, with its torii.
 const box=(cx,cy,cz,w,h,d)=>{
  const X=w/2,Y=h/2,Z=d/2,c=[[-1,-1],[1,-1],[1,1],[-1,1]];
  const out=[];
  for(const y of[-Y,Y])out.push(c.map(([a,b])=>[cx+a*X,cy+y,cz+b*Z]).concat([[cx-X,cy+y,cz-Z]]));
  for(const [a,b] of c)out.push(line([cx+a*X,cy-Y,cz+b*Z],[cx+a*X,cy+Y,cz+b*Z]));
  return out;
 };
 const station=[...box(-W*.52,top+3.1,D*.30,13.5,4.6,6.2),
  ...box(-W*.52,top+6.2,D*.30,15.6,.5,8.2)];
 const shrineX=W*.52,shrineZ=-D*.34;
 const shrine=[...box(shrineX,top+3.4,shrineZ,6.4,5.2,6.4),
  ...box(shrineX,top+6.6,shrineZ,8.6,.5,8.6),
  line([shrineX-3.1,top,shrineZ+7.4],[shrineX-3.1,top+6.1,shrineZ+7.4]),
  line([shrineX+3.1,top,shrineZ+7.4],[shrineX+3.1,top+6.1,shrineZ+7.4]),
  line([shrineX-4.3,top+6.1,shrineZ+7.4],[shrineX+4.3,top+6.1,shrineZ+7.4]),
  line([shrineX-3.8,top+4.9,shrineZ+7.4],[shrineX+3.8,top+4.9,shrineZ+7.4])];
 stages.push({lines:[...station,...shrine]});

 // 4 — lanterns along the approach.
 const lanterns=[];
 for(let i=0;i<11;i++){
  const t=i/10,[x,y,z]=embeddedBuildRail(table,t*.9+.05);
  const ox=x+(i%2?3.4:-3.4),oz=z+(i%2?2.6:-2.6);
  lanterns.push(line([ox,top,oz],[ox,top+3.4,oz]),
   ...box(ox,top+3.9,oz,1.1,1.1,1.1));
 }
 stages.push({lines:lanterns});

 // 5 — the forest, as open cones.
 const forest=[];
 for(let i=0;i<46;i++){
  const x=-W*.95+rnd()*W*1.9,z=-D*.92+rnd()*D*1.84;
  if(Math.abs(x+W*.12)<W*.10&&Math.abs(z)<D*.7)continue; // keep the cut clear
  const h=4.4+rnd()*5.6,r=1.1+rnd()*1.1,base=top+(rnd()*1.2);
  const apex=[x,base+h,z];
  for(let k=0;k<4;k++){
   const a=k/4*Math.PI*2+rnd()*.4;
   forest.push(line(apex,[x+Math.cos(a)*r,base,z+Math.sin(a)*r]));
  }
 }
 stages.push({lines:forest});

 // 6 — the local train on the line.
 const train=[];
 for(let c=0;c<3;c++){
  const t=.46+c*.055,[x,y,z]=embeddedBuildRail(table,t);
  const [nx,,nz]=embeddedBuildRail(table,t+.02);
  const a=Math.atan2(nz-z,nx-x);
  const car=box(x,y+1.5,z,4.6,2.3,2.1);
  for(const poly of car)train.push(poly.map(([px,py,pz])=>{
   const dx=px-x,dz=pz-z;
   return[x+dx*Math.cos(a)-dz*Math.sin(a),py,z+dx*Math.sin(a)+dz*Math.cos(a)];
  }));
 }
 stages.push({lines:train});

 // 7 — the river down the cut, and the fall.
 const river=[],fallX=-W*.12;
 for(let i=0;i<=22;i++){
  const t=i/22;
  river.push([fallX+Math.sin(t*3.3)*W*.1,top+.4-t*.3,-D*.5+t*D*1.42]);
 }
 const water=[river];
 for(let i=0;i<7;i++){
  const x=fallX-2.2+i*.72;
  water.push(line([x,top+6.6,-D*.1],[x-.3,top+1.1,D*.02]));
 }
 water.push(line([fallX-3,top+1.1,D*.02],[fallX+3,top+1.1,D*.06]));
 stages.push({lines:water});

 // 8 — lighting adds no new shapes; the whole sketch warms, then gives way.
 stages.push({lines:[]});
 return stages;
}

// Draw whatever has been built so far. `revealed` is how many stages are done;
// `edge` is 0..1 through the newest one, so it strokes on rather than popping.
function embeddedBuildDraw(ctx,stages,revealed,edge,warm){
 const cream='#efe0b4',brass='#c9ab73';
 ctx.save();
 ctx.lineJoin='round';ctx.lineCap='round';
 for(let s=0;s<Math.min(revealed+1,stages.length);s++){
  const settled=s<revealed;
  const portion=settled?1:edge;
  if(portion<=0)continue;
  const lines=stages[s].lines,count=Math.ceil(lines.length*portion);
  ctx.strokeStyle=settled?brass:cream;
  ctx.globalAlpha=(settled?.5:.95)*warm;
  ctx.lineWidth=settled?1:1.35;
  ctx.beginPath();
  for(let i=0;i<count;i++){
   const points=lines[i];let started=false;
   for(const point of points){
    const p=project(point);
    if(!p.visible){started=false;continue;}
    if(started)ctx.lineTo(p.x,p.y);else{ctx.moveTo(p.x,p.y);started=true;}
   }
  }
  ctx.stroke();
 }
 ctx.restore();
}

// The step list beside the sketch, so a slow build reads as progress rather
// than a stall. Short labels: the long ones are the live status line's job.
const EMBEDDED_BUILD_STEP_NAMES=['Gorge','Rock','Station','Lanterns','Forest','Train','Water','Light'];

function embeddedBuildSteps(stage){
 const list=stage.querySelector('.embed-steps');if(!list)return;
 list.replaceChildren(...EMBEDDED_BUILD_STEP_NAMES.map(name=>{
  const item=document.createElement('li');item.textContent=name;return item;
 }));
}

// Match the adapter's own progress label to a stage. Falling back to "one more"
// keeps the sketch honest if the upstream wording ever changes under us.
function embeddedBuildAdvance(active,text){
 const build=active.build;if(!build)return;
 const index=EMBEDDED_BUILD_STAGES.indexOf(text);
 const next=index>=0?index:Math.min(build.revealed+1,build.stages.length-1);
 if(next<=build.revealed&&build.revealed>0)return;
 build.revealed=next;build.edge=0;build.at=performance.now();
 const list=document.querySelector('.embed-steps');
 if(list)[...list.children].forEach((item,i)=>item.classList.toggle('done',i<next));
}

// Called each frame while the guest is still building.
function embeddedBuildFrame(active){
 const build=active.build,canvas=document.getElementById('embedBuild');
 if(!build||!canvas)return;
 const dpr=Math.min(devicePixelRatio||1,2),w=innerWidth,h=innerHeight;
 if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){
  canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
  canvas.style.width=w+'px';canvas.style.height=h+'px';
 }
 const ctx=canvas.getContext('2d');
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
 const now=performance.now();
 build.edge=reduceMotion?1:Math.min(1,(now-build.at)/620);
 build.warm=Math.min(1,build.warm+(reduceMotion?1:.06));
 embeddedBuildDraw(ctx,build.stages,build.revealed,build.edge,build.warm);
}

// Hand the table over: the sketch fades as the real model takes the surface.
function embeddedBuildFinish(){
 const canvas=document.getElementById('embedBuild');if(!canvas)return;
 canvas.classList.add('done');
 setTimeout(()=>{if(!canvas.isConnected)return;const ctx=canvas.getContext('2d');ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);canvas.classList.remove('done');},900);
}
