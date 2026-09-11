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
 const clampX=x=>Math.max(-W+1.4,Math.min(W-1.4,x));
 const clampZ=z=>Math.max(-D+1.4,Math.min(D-1.4,z));
 const stages=[];

 // A closed contour at one height. Nested rings are what make a wireframe read
 // as a landform instead of a scribble, so the mountain is drawn the way a
 // survey would draw it.
 const ring=(cx,cz,rx,rz,y,wobble,seed)=>{
  const r=embeddedBuildRandom(seed),out=[];
  for(let i=0;i<=22;i++){
   const a=i/22*Math.PI*2,k=1+(r()-.5)*wobble;
   out.push([clampX(cx+Math.cos(a)*rx*k),y,clampZ(cz+Math.sin(a)*rz*k)]);
  }
  return out;
 };

 // 1 — the ground, the massif and the line across it.
 const ground=[[-W,top,-D],[W,top,-D],[W,top,D],[-W,top,D],[-W,top,-D]];
 const massif=[];
 const hill=(cx,cz,rx,rz,height,steps,seed)=>{
  const rings=[];
  for(let i=0;i<steps;i++){
   const t=i/(steps-1);
   rings.push(ring(cx,cz,rx*(1-t*.82),rz*(1-t*.82),top+1+t*height,.16,seed+i));
  }
  massif.push(...rings);
  // Eight fall lines from the summit to the foot, each following the contours
  // it crosses, so the slope has surface rather than floating outlines.
  for(let k=0;k<8;k++){
   const step=Math.round(k/8*22);
   massif.push(rings.map(r=>r[step%22]).reverse());
  }
  const summit=rings[rings.length-1];
  massif.push(summit.filter((_,i)=>i%3===0).map(([x,y,z])=>[x,y+.9,z]).concat([summit[0]]));
 };
 hill(-W*.34,-D*.34,W*.52,D*.62,15.5,5,0x11);
 hill(W*.46,-D*.42,W*.30,D*.34,9.5,4,0x31);
 const rail=[],sleepers=[];
 for(let i=0;i<=44;i++)rail.push(embeddedBuildRail(table,i/44));
 for(let i=0;i<=44;i+=2){
  const [x,y,z]=embeddedBuildRail(table,i/44),[nx,,nz]=embeddedBuildRail(table,Math.min(1,i/44+.02));
  const a=Math.atan2(nz-z,nx-x),ox=Math.sin(a)*1.5,oz=-Math.cos(a)*1.5;
  sleepers.push(line([x-ox,y,z-oz],[x+ox,y,z+oz]));
 }
 stages.push({lines:[ground,...massif,rail,...sleepers]});

 // 2 — the cut, and the truss that carries the line over it.
 const cutX=W*.06,rock=[];
 for(const side of[-1,1]){
  const wall=[];
  for(let i=0;i<=16;i++){
   const t=i/16;
   wall.push([clampX(cutX+side*(4.6+Math.sin(t*4.1)*1.5)),top+7.4-t*.6,clampZ(-D*.62+t*D*1.28)]);
  }
  rock.push(wall);
  const foot=wall.map(([x,,z])=>[x-side*1.9,top+.4,z]);
  rock.push(foot);
  for(let i=0;i<=16;i+=2)rock.push(line(wall[i],foot[i]));
 }
 const deckZ0=-D*.10,deckZ1=D*.10,deckY=top+7.2;
 for(const z of[deckZ0,deckZ1]){
  rock.push(line([cutX-7.4,deckY,z],[cutX+7.4,deckY,z]));
  rock.push(line([cutX-7.4,deckY-1.5,z],[cutX+7.4,deckY-1.5,z]));
 }
 for(let i=0;i<=4;i++){
  const x=cutX-7.4+i*(14.8/4);
  rock.push(line([x,deckY,deckZ0],[x,deckY,deckZ1]));
  rock.push(line([x,deckY,deckZ0],[x,deckY-1.5,deckZ0]),line([x,deckY,deckZ1],[x,deckY-1.5,deckZ1]));
  if(i<4){
   const x2=cutX-7.4+(i+1)*(14.8/4);
   rock.push(line([x,deckY-1.5,deckZ0],[x2,deckY,deckZ0]));
  }
 }
 stages.push({lines:rock});

 // 3 — the station under its long roof, and the shrine behind its torii.
 const hall=(cx,cy,cz,w,h,d,ridge)=>{
  const X=w/2,Z=d/2,out=[];
  out.push([[cx-X,cy,cz-Z],[cx+X,cy,cz-Z],[cx+X,cy,cz+Z],[cx-X,cy,cz+Z],[cx-X,cy,cz-Z]]);
  out.push([[cx-X,cy+h,cz-Z],[cx+X,cy+h,cz-Z],[cx+X,cy+h,cz+Z],[cx-X,cy+h,cz+Z],[cx-X,cy+h,cz-Z]]);
  for(const [a,b] of[[-1,-1],[1,-1],[1,1],[-1,1]])out.push(line([cx+a*X,cy,cz+b*Z],[cx+a*X,cy+h,cz+b*Z]));
  out.push(line([cx-X,cy+h,cz],[cx,cy+h+ridge,cz-Z*.1],[cx+X,cy+h,cz]));
  out.push(line([cx,cy+h+ridge,cz-Z],[cx,cy+h+ridge,cz+Z]));
  return out;
 };
 const stationX=clampX(-W*.60),stationZ=clampZ(D*.30);
 const shrineX=clampX(W*.58),shrineZ=clampZ(-D*.10);
 const build=[...hall(stationX,top,stationZ,14.5,3.4,5.6,1.8),
  ...hall(shrineX,top,shrineZ,5.6,3.6,5.6,2.2)];
 build.push([[stationX-9,top+.5,stationZ-4.2],[stationX+9,top+.5,stationZ-4.2],[stationX+9,top+.5,stationZ-3],[stationX-9,top+.5,stationZ-3],[stationX-9,top+.5,stationZ-4.2]]);
 for(const dz of[4.6,6.4]){
  build.push(line([shrineX-2.7,top,shrineZ+dz],[shrineX-2.7,top+4.4,shrineZ+dz]));
  build.push(line([shrineX+2.7,top,shrineZ+dz],[shrineX+2.7,top+4.4,shrineZ+dz]));
  build.push(line([shrineX-3.8,top+4.4,shrineZ+dz],[shrineX+3.8,top+4.4,shrineZ+dz]));
  build.push(line([shrineX-3.2,top+3.5,shrineZ+dz],[shrineX+3.2,top+3.5,shrineZ+dz]));
 }
 stages.push({lines:build});

 // 4 — lanterns along the approach.
 const lanterns=[];
 for(let i=0;i<12;i++){
  const t=.06+i/11*.88,[x,y,z]=embeddedBuildRail(table,t);
  const side=i%2?1:-1,ox=clampX(x+side*3.6),oz=clampZ(z+side*2.4);
  lanterns.push(line([ox,top,oz],[ox,top+3.2,oz]));
  lanterns.push([[ox-.7,top+3.2,oz],[ox+.7,top+3.2,oz],[ox+.7,top+4.3,oz],[ox-.7,top+4.3,oz],[ox-.7,top+3.2,oz]]);
 }
 stages.push({lines:lanterns});

 // 5 — the forest. Cones need a base ring or they read as spiders.
 const forest=[];
 for(let i=0;i<74;i++){
  const x=clampX(-W*.94+rnd()*W*1.88),z=clampZ(-D*.92+rnd()*D*1.84);
  if(Math.abs(x-cutX)<6.4&&Math.abs(z)<D*.7)continue;
  if(Math.abs(x-stationX)<9&&Math.abs(z-stationZ)<5)continue;
  const h=2.8+rnd()*3.4,r=.85+rnd()*.6,base=top+.2;
  const apex=[x,base+h,z];
  const ringPts=[];
  for(let k=0;k<=6;k++){const a=k/6*Math.PI*2;ringPts.push([x+Math.cos(a)*r,base,z+Math.sin(a)*r]);}
  forest.push(ringPts);
  for(let k=0;k<6;k+=2)forest.push(line(apex,ringPts[k]));
 }
 stages.push({lines:forest});

 // 6 — the local train on the line.
 const train=[];
 for(let c=0;c<3;c++){
  const t=.40+c*.058,[x,y,z]=embeddedBuildRail(table,t);
  const [nx,,nz]=embeddedBuildRail(table,t+.02);
  const a=Math.atan2(nz-z,nx-x),ca=Math.cos(a),sa=Math.sin(a);
  const at=(dx,dy,dz)=>[x+dx*ca-dz*sa,y+dy,z+dx*sa+dz*ca];
  const X=2.3,Z=1.0;
  train.push([at(-X,.2,-Z),at(X,.2,-Z),at(X,.2,Z),at(-X,.2,Z),at(-X,.2,-Z)]);
  train.push([at(-X,2.3,-Z),at(X,2.3,-Z),at(X,2.3,Z),at(-X,2.3,Z),at(-X,2.3,-Z)]);
  for(const [dx,dz] of[[-X,-Z],[X,-Z],[X,Z],[-X,Z]])train.push(line(at(dx,.2,dz),at(dx,2.3,dz)));
  train.push(line(at(-X,2.3,0),at(0,2.9,0),at(X,2.3,0)));
 }
 stages.push({lines:train});

 // 7 — the river down the cut, the fall, and the pool it lands in.
 const water=[],river=[];
 for(let i=0;i<=24;i++){
  const t=i/24;
  river.push([clampX(cutX+Math.sin(t*3.1)*2.4),top+.5-t*.25,clampZ(-D*.58+t*D*1.36)]);
 }
 water.push(river);
 for(let i=0;i<6;i++){
  const x=cutX-2.4+i*.96;
  water.push(line([x,top+7,-D*.02],[x-.2,top+1.2,D*.10]));
 }
 for(let i=0;i<4;i++){
  const y=top+1.6+i*1.3;
  water.push(line([cutX-2.6,y,-D*.01+i*.2],[cutX+2.6,y,-D*.01+i*.2]));
 }
 water.push(ring(cutX,D*.16,4.2,2.6,top+.8,.12,0x77));
 stages.push({lines:water});

 // 8 — lighting adds no new shapes; the sketch warms, then gives way.
 stages.push({lines:[]});
 return stages;
}

// Draw whatever has been built so far. `revealed` is how many stages are done;
// `edge` is 0..1 through the newest one, so it strokes on rather than popping.
function embeddedBuildVellum(ctx,table,warm){
 const {halfWidth:W,halfDepth:D,top}=table;
 const corners=[[-W,top+.05,-D],[W,top+.05,-D],[W,top+.05,D],[-W,top+.05,D]].map(p=>project(p));
 if(!corners.every(c=>c&&c.visible))return false;
 ctx.save();ctx.beginPath();
 corners.forEach((c,i)=>i?ctx.lineTo(c.x,c.y):ctx.moveTo(c.x,c.y));
 ctx.closePath();
 ctx.globalAlpha=.82*warm;ctx.fillStyle='#16231d';ctx.fill();
 ctx.globalAlpha=.5*warm;ctx.strokeStyle='#c2a672';ctx.lineWidth=1;ctx.stroke();
 ctx.restore();return true;
}

function embeddedBuildDraw(ctx,stages,revealed,edge,warm){
 const cream='#f6ecc9',brass='#bda067';
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
 embeddedBuildVellum(ctx,active.project.table,build.warm);
 embeddedBuildDraw(ctx,build.stages,build.revealed,build.edge,build.warm);
}

// Hand the table over: the sketch fades as the real model takes the surface.
function embeddedBuildFinish(){
 const canvas=document.getElementById('embedBuild');if(!canvas)return;
 canvas.classList.add('done');
 setTimeout(()=>{if(!canvas.isConnected)return;const ctx=canvas.getContext('2d');ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);canvas.classList.remove('done');},900);
}
