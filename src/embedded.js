'use strict';

// Embedded projects — rooms that host somebody else's renderer.
//
// Whistlevale's own rooms are dependency-free WebGL 2. A project that already
// exists somewhere else is not rewritten to match: it is vendored whole, under
// its own licence, and run unmodified inside a sandboxed frame. Rewriting a
// finished piece of work loses the thing that made it worth showing, and the
// author's own commits stop being the record of who built it.
//
// Two rules make that safe to do inside a dependency-free house:
//
//   Nothing loads until someone walks in. The frame is created on room entry
//   and destroyed on exit, so a visitor who never opens this room never fetches
//   the project, never parses its renderer, and never pays for a second WebGL
//   context. That is why the entry is a URL held in data and not a <script> or
//   an <iframe src> in index.html.
//
//   It sits on the table. The frame is mapped onto a display surface in the
//   room with a projective transform, so the work reads as a miniature under
//   the house lights rather than a web page covering the house. Step closer and
//   it fills the view and takes its own controls back.
//
// Adding another one is data, not code: see docs/contributing/embedded-projects.md.

const EMBEDDED_PROJECTS={};
let embeddedActive=null,embeddedFrameNode=null,embeddedClose=false,embeddedFailed=false,embeddedPending=0;

function registerEmbeddedProject(room,definition){
 if(!/^[a-z][a-z0-9-]*$/.test(room))throw new Error('Embedded project keys must be lowercase URL-safe names.');
 const {entry,title,surface}=definition;
 if(typeof entry!=='string'||!entry)throw new Error('An embedded project needs an entry URL.');
 if(/^[a-z]+:|^\/\//i.test(entry))throw new Error('Embedded project entries must be vendored in this repository, not fetched from another origin.');
 if(typeof title!=='string'||!title)throw new Error('An embedded project needs a title.');
 if(typeof surface!=='function')throw new Error('An embedded project needs a surface() returning four world-space corners.');
 EMBEDDED_PROJECTS[room]={frame:[640,400],closeFrame:[1280,800],...definition};
 return EMBEDDED_PROJECTS[room];
}

const embeddedProject=room=>EMBEDDED_PROJECTS[room]||null;

// The credit line every surface reads from, so the room, the plaque, the map
// card and the panel can never disagree about who made this.
function embeddedCreditLine(project){
 const by=project.credits?.[0];
 return project.title+(by?' · by '+by.name:'');
}

function embeddedAttribution(project){
 const wrap=document.createElement('div');wrap.className='embed-credit';
 const link=(credit)=>{
  const url=typeof communityCreditURL==='function'?communityCreditURL(credit):null;
  if(!url)return document.createTextNode(credit.name);
  const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';
  a.textContent=credit.platform==='x'?'@'+credit.handle:credit.name;return a;
 };
 const lead=document.createElement('p');lead.className='embed-credit-lead';
 const strong=document.createElement('strong');strong.textContent=project.title;lead.append(strong);
 if(project.subtitle){const em=document.createElement('em');em.textContent=project.subtitle;lead.append(em);}
 wrap.append(lead);
 const line=document.createElement('p');line.className='embed-credit-by';
 line.append(document.createTextNode('Made by '));
 for(const [i,credit] of (project.credits||[]).entries()){
  if(i)line.append(document.createTextNode(' · '));
  line.append(link(credit));
 }
 wrap.append(line);
 const meta=document.createElement('p');meta.className='embed-credit-meta';
 if(project.source){
  const a=document.createElement('a');a.href=project.source;a.target='_blank';a.rel='noopener noreferrer';
  a.textContent='Original project ↗';meta.append(a);
 }
 if(project.licence){
  if(meta.childNodes.length)meta.append(document.createTextNode(' · '));
  meta.append(document.createTextNode(project.licence+'-licensed, used with permission'));
 }
 wrap.append(meta);
 if(project.permission){
  const note=document.createElement('p');note.className='embed-credit-note';note.textContent=project.permission;wrap.append(note);
 }
 return wrap;
}

function embeddedStage(){
 let stage=document.getElementById('embedStage');
 if(stage)return stage;
 stage=document.createElement('div');stage.id='embedStage';stage.hidden=true;
 stage.innerHTML='<div class="embed-surface"><div class="embed-plate"></div></div>';
 const credit=document.createElement('div');credit.className='embed-credit-dock';credit.id='embedCredit';
 const closer=document.createElement('button');closer.id='embedCloser';closer.type='button';closer.className='embed-closer';
 closer.onclick=()=>embeddedStepCloser(!embeddedClose);
 stage.append(credit,closer);
 (document.getElementById('app')||document.body).append(stage);
 return stage;
}

// Room entry. Nothing above this line has fetched the project.
function embeddedEnter(room){
 const project=embeddedProject(room);
 if(embeddedActive&&embeddedActive.room!==room)embeddedLeave();
 if(!project){document.body.classList.remove('has-embed');return null;}
 if(embeddedActive&&embeddedActive.room===room)return embeddedActive;
 // Let the room finish building before a second renderer starts. Both racing
 // in the same tick locks the tab on the way in, which reads as a broken room.
 if(embeddedPending)clearTimeout(embeddedPending);
 embeddedPending=setTimeout(()=>{embeddedPending=0;if(typeof hobby==='object'&&hobby.room===room)embeddedMount(room,project);},
  typeof reduceMotion!=='undefined'&&reduceMotion?60:520);
 document.body.classList.add('has-embed');
 return {room,project,pending:true};
}

function embeddedMount(room,project){
 const stage=embeddedStage(),surface=stage.querySelector('.embed-surface');
 embeddedFailed=false;embeddedClose=false;
 const node=document.createElement('iframe');
 node.className='embed-frame';node.title=embeddedCreditLine(project);
 node.setAttribute('loading','lazy');
 // Scripts only: the project may render, but may not reach this document, this
 // origin's storage, the top window, or anywhere a click could navigate us.
 node.setAttribute('sandbox','allow-scripts');
 node.setAttribute('referrerpolicy','no-referrer');
 node.width=String(project.frame[0]);node.height=String(project.frame[1]);
 node.style.width=project.frame[0]+'px';node.style.height=project.frame[1]+'px';
 node.onerror=()=>embeddedReportFailure(project);
 const waiting=document.createElement('div');waiting.className='embed-plate embed-waiting';
 waiting.style.width=project.frame[0]+'px';waiting.style.height=project.frame[1]+'px';
 waiting.textContent=project.title+' is being set up on the table…';
 node.onload=()=>{waiting.remove();node.classList.add('ready');};
 node.src=project.entry;
 surface.replaceChildren(waiting,node);
 embeddedFrameNode=node;embeddedActive={room,project};
 const credit=document.getElementById('embedCredit');
 credit.replaceChildren(embeddedAttribution(project));
 stage.hidden=false;document.body.classList.add('has-embed');
 embeddedSyncCloser();
 return embeddedActive;
}

function embeddedLeave(){
 if(embeddedPending){clearTimeout(embeddedPending);embeddedPending=0;}
 if(!embeddedActive)return;
 // Destroy the frame rather than hide it: that releases its WebGL context,
 // its animation loop and its audio, none of which a hidden iframe gives back.
 embeddedFrameNode?.remove();
 embeddedFrameNode=null;embeddedActive=null;embeddedClose=false;
 const stage=document.getElementById('embedStage');
 if(stage){stage.hidden=true;stage.querySelector('.embed-surface').replaceChildren();}
 document.body.classList.remove('has-embed','embed-close');
}

function embeddedReportFailure(project){
 embeddedFailed=true;
 const surface=document.getElementById('embedStage')?.querySelector('.embed-surface');
 if(!surface)return;
 const plate=document.createElement('div');plate.className='embed-plate';
 plate.style.width=project.frame[0]+'px';plate.style.height=project.frame[1]+'px';
 plate.textContent=project.title+' could not open here. The original is linked below.';
 surface.replaceChildren(plate);
}

function embeddedStepCloser(on){
 if(!embeddedActive)return;
 embeddedClose=!!on;
 document.body.classList.toggle('embed-close',embeddedClose);
 // Docked on the table the room owns the camera, so the frame must not swallow
 // drags. Stepping closer hands the project its own controls back.
 if(embeddedFrameNode){
  embeddedFrameNode.style.pointerEvents=embeddedClose?'auto':'none';
  const [w,h]=embeddedClose?(embeddedActive.project.closeFrame||embeddedActive.project.frame):embeddedActive.project.frame;
  embeddedFrameNode.width=String(w);embeddedFrameNode.height=String(h);
  embeddedFrameNode.style.width=w+'px';embeddedFrameNode.style.height=h+'px';
 }
 embeddedSyncCloser();
}

function embeddedSyncCloser(){
 const button=document.getElementById('embedCloser');
 if(!button||!embeddedActive)return;
 button.textContent=embeddedClose?'Back to the room':'Step closer';
 button.setAttribute('aria-pressed',String(embeddedClose));
 button.setAttribute('aria-label',embeddedClose
  ? 'Return to the room and put '+embeddedActive.project.title+' back on its table'
  : 'Fill the view with '+embeddedCreditLine(embeddedActive.project)+' and use its own controls');
}

// Map a rectangle onto the four projected corners of the display surface.
// Unit square to quad (Heckbert); CSS then walks the element through it, so the
// miniature keeps the room's perspective as the camera orbits.
function embeddedQuadTransform(corners,w,h){
 const [p0,p1,p2,p3]=corners;
 const dx1=p1.x-p2.x,dx2=p3.x-p2.x,dx3=p0.x-p1.x+p2.x-p3.x;
 const dy1=p1.y-p2.y,dy2=p3.y-p2.y,dy3=p0.y-p1.y+p2.y-p3.y;
 let a,b,c,d,e,f,g,hh;
 if(Math.abs(dx3)<1e-9&&Math.abs(dy3)<1e-9){
  a=p1.x-p0.x;b=p2.x-p1.x;c=p0.x;d=p1.y-p0.y;e=p2.y-p1.y;f=p0.y;g=0;hh=0;
 }else{
  const den=dx1*dy2-dx2*dy1;
  if(!den)return null;
  g=(dx3*dy2-dx2*dy3)/den;hh=(dx1*dy3-dx3*dy1)/den;
  a=p1.x-p0.x+g*p1.x;b=p3.x-p0.x+hh*p3.x;c=p0.x;
  d=p1.y-p0.y+g*p1.y;e=p3.y-p0.y+hh*p3.y;f=p0.y;
 }
 if(![a,b,c,d,e,f,g,hh].every(Number.isFinite))return null;
 return 'matrix3d('+[a,d,0,g,b,e,0,hh,0,0,1,0,c,f,0,1].join(',')+') scale('+(1/w)+','+(1/h)+')';
}

// Called once per rendered frame, after the view-projection is current.
function embeddedFrameUpdate(){
 if(!embeddedActive||embeddedFailed)return;
 const stage=document.getElementById('embedStage');
 if(!stage||stage.hidden)return;
 const surface=stage.querySelector('.embed-surface');
 if(embeddedClose){surface.style.transform='';surface.style.visibility='';return;}
 if(typeof project!=='function'){surface.style.visibility='hidden';return;}
 const corners=embeddedActive.project.surface().map(point=>project(point));
 if(!corners.every(corner=>corner&&corner.visible&&Number.isFinite(corner.x)&&Number.isFinite(corner.y))){
  // A corner behind the camera makes the transform meaningless, not merely ugly.
  surface.style.visibility='hidden';return;
 }
 const node=embeddedFrameNode;if(!node)return;
 const w=Number(node.width)||embeddedActive.project.frame[0],h=Number(node.height)||embeddedActive.project.frame[1];
 const matrix=embeddedQuadTransform(corners,w,h);
 if(!matrix){surface.style.visibility='hidden';return;}
 surface.style.visibility='';surface.style.transform=matrix;
}
