'use strict';

// Guest geometry keeps its original builders and its own GPU context. The house
// owns navigation, camera and scheduling. No guest modules load during startup
// or a map preview. See docs/contributing/embedded-projects.md.
const EMBEDDED_PROJECTS={};
let embeddedActive=null;

function registerEmbeddedProject(room,definition){
 if(!/^[a-z][a-z0-9-]*$/.test(room))throw new Error('Guest project keys must be lowercase URL-safe names.');
 if(!/^vendor\/[a-z0-9-]+\/$/.test(definition.base))throw new Error('Guest modules must be vendored in this repository.');
 if(!definition.title||typeof definition.create!=='function')throw new Error('A guest project needs a title and a reviewed scene adapter.');
 const record={...definition,room,plaque:'embed-credit-'+room,credits:validateCredits(definition.credits),hostCredits:validateCredits(definition.hostCredits||[])};
 EMBEDDED_PROJECTS[room]=record;return record;
}
const embeddedProject=room=>EMBEDDED_PROJECTS[room]||null;
const embeddedCreditLine=project=>project.title+' · by '+project.credits[0].name;

function embeddedAttribution(project){
 const wrap=document.createElement('div');wrap.className='embed-credit';
 const link=(text,url)=>{const a=document.createElement('a');a.textContent=text;a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;};
 const lead=document.createElement('p');lead.className='embed-credit-lead';
 const strong=document.createElement('strong');strong.textContent=project.title;lead.append(strong);wrap.append(lead);
 const by=document.createElement('p');by.className='embed-credit-by';by.append('Made by ');
 project.credits.forEach((credit,i)=>{if(i)by.append(' · ');by.append(link(credit.name,communityCreditURL(credit)));});wrap.append(by);
 const meta=document.createElement('p');meta.className='embed-credit-meta';
 meta.append(link('Original project ↗',project.source));wrap.append(meta);
 return wrap;
}

function embeddedStage(){
 let stage=document.getElementById('embedStage');if(stage)return stage;
 stage=document.createElement('section');stage.id='embedStage';stage.hidden=true;stage.setAttribute('aria-label','Guest miniature');
 const loading=document.createElement('div');loading.className='embed-loading';loading.setAttribute('aria-label','Loading guest miniature');
 loading.innerHTML='<p class="embed-loading-kicker">A small world takes shape</p><strong class="embed-loading-title"></strong><span class="embed-loading-by"></span><div class="embed-progress" aria-hidden="true"><span></span></div><ol class="embed-steps" aria-hidden="true"></ol>';
 const status=document.createElement('p');status.id='embedStatus';status.className='embed-status';status.setAttribute('role','status');
 const dock=document.createElement('div');dock.id='embedCredit';dock.className='embed-credit-dock';
 const sketch=document.createElement('canvas');sketch.id='embedBuild';sketch.className='embed-build';sketch.setAttribute('aria-hidden','true');
 const back=document.createElement('button');back.className='embed-loading-back';back.textContent='Back to rooms';back.onclick=()=>openHouseMap();
 loading.append(status,back);stage.append(sketch,loading,dock);(document.getElementById('app')||document.body).append(stage);return stage;
}
function embeddedOnStage(room){
 return hobby.room===room&&!(typeof shopMap!=='undefined'&&shopMap.open)&&!(typeof isShopMapActive==='function'&&isShopMapActive());
}
function embeddedEnter(room){
 if(embeddedActive?.room===room)return embeddedActive;
 embeddedLeave();const project=embeddedProject(room);if(!project||!embeddedOnStage(room))return null;
 const stage=embeddedStage(),controller=new AbortController();
 const active={room,project,controller,session:null,timer:0,paused:!!reduceMotion};embeddedActive=active;
 stage.hidden=false;stage.dataset.state='loading';document.body.classList.add('has-embed');
 stage.setAttribute('aria-busy','true');
 const title=stage.querySelector('.embed-loading-title'),by=stage.querySelector('.embed-loading-by');
 if(title)title.textContent=project.title;if(by)by.textContent='An original miniature by '+project.credits[0].name;
 const sketch=stage.querySelector('#embedBuild');if(sketch)sketch.classList.remove('done');
 if(typeof embeddedBuildShapes==='function'&&project.table){
  active.build={stages:embeddedBuildShapes(project.table),revealed:-1,edge:0,at:performance.now(),warm:0};
  embeddedBuildSteps(stage);
 }
 const dock=stage.querySelector('#embedCredit');dock.replaceChildren(embeddedAttribution(project));
 const actions=document.createElement('div');actions.className='embed-actions';
 const closer=document.createElement('button');closer.id='embedCloser';closer.textContent='Explore the miniature';
 closer.onclick=()=>{setView('overview',false);Object.assign(orbit,{target:project.focus.slice(),distance:innerWidth<700?project.phoneDistance:project.distance,pitch:.43,yaw:.3});};
 const pause=document.createElement('button');pause.id='embedPause';pause.disabled=true;
 const syncPause=()=>{pause.textContent=active.paused?'Run train':'Pause train';pause.setAttribute('aria-pressed',String(active.paused));};
 syncPause();pause.onclick=()=>{active.paused=!active.paused;syncPause();};actions.append(closer,pause);dock.append(actions);
 const status=stage.querySelector('#embedStatus');status.hidden=false;status.textContent='Setting up '+project.roomName+' on the table…';stage.querySelector('.embed-loading').hidden=false;
 // A portable HTML keeps the room and credits; the vendored module graph is
 // intentionally not embedded into that file. Do not try to fetch file:// URLs.
 if(!/^https?:$/.test(location.protocol)){
  stage.dataset.state='unavailable';stage.setAttribute('aria-busy','false');status.textContent='Visit the online house to explore this guest miniature. The original project is linked below.';return active;
 }
 active.timer=setTimeout(()=>{active.timer=0;embeddedMount(active);},520);
 return active;
}
async function embeddedMount(active){
 const stage=embeddedStage(),status=stage.querySelector('#embedStatus');
 try{
  const session=await active.project.create({project:active.project,signal:active.controller.signal,host:hobby.scene,
   mount:canvas=>{if(embeddedActive===active)stage.prepend(canvas);},
   progress:text=>{if(embeddedActive!==active)return;status.textContent=text;embeddedBuildAdvance(active,text);}});
  if(embeddedActive!==active||!embeddedOnStage(active.room)){session.dispose();return;}
  active.session=session;if(typeof embeddedBuildFinish==='function')embeddedBuildFinish();stage.dataset.state='ready';stage.setAttribute('aria-busy','false');status.hidden=true;stage.querySelector('.embed-loading').hidden=true;stage.querySelector('#embedPause').disabled=false;
 }catch(error){
  if(embeddedActive!==active||active.controller.signal.aborted)return;
  console.error('Guest miniature could not open:',error);stage.dataset.state='error';stage.setAttribute('aria-busy','false');
  status.hidden=false;stage.querySelector('.embed-loading').hidden=false;status.textContent='The miniature could not open here. You can still visit the original project below.';
 }
}
function embeddedLeave(){
 const active=embeddedActive;embeddedActive=null;if(!active)return;
 clearTimeout(active.timer);clearTimeout(active.finishTimer);active.controller.abort();active.session?.dispose();active.session=null;
 const stage=document.getElementById('embedStage');
 if(stage){stage.hidden=true;stage.dataset.state='idle';stage.querySelector('.embed-loading').hidden=false;stage.querySelectorAll('.embed-canvas').forEach(node=>node.remove());}
 document.body.classList.remove('has-embed');
}
// One call after the final house camera update, including cinema and all room
// views. Map entry destroys the guest; returning creates a new GPU session.
function embeddedFrameUpdate(){
 if(embeddedActive&&!embeddedOnStage(embeddedActive.room))embeddedLeave();
 if(!embeddedActive&&embeddedProject(hobby.room)&&embeddedOnStage(hobby.room))embeddedEnter(hobby.room);
 const active=embeddedActive;if(!active)return;
 const status=document.getElementById('embedStatus');
 if(!status.hidden&&!active.session){status.style.visibility='visible';}
 if(!active.session){if(typeof embeddedBuildFrame==='function')embeddedBuildFrame(active);return;}
 try{active.session.frame({eye:cameraPos,target:cameraTarget,projection:cameraProjection,near:cameraNear,width:innerWidth,height:innerHeight,night,rain:rainAmount,paused:paused||active.paused,now:performance.now()});}
 catch(error){active.controller.abort();active.session=null;embeddedStage().dataset.state='error';status.hidden=false;status.textContent='The miniature stopped. Re-enter the room to try again.';console.error('Guest renderer stopped:',error);}
}

// Called synchronously after render(), before the guest drawing buffer can be
// cleared by the browser. No preserved extra framebuffer is needed for photos.
function embeddedPhotograph(houseCanvas){
 const active=embeddedActive;if(!active?.session)return houseCanvas;
 const guest=document.querySelector('.embed-canvas');if(!guest)return houseCanvas;
 const photo=document.createElement('canvas');photo.width=houseCanvas.width;photo.height=houseCanvas.height+80;
 const c=photo.getContext('2d');c.drawImage(houseCanvas,0,0);c.drawImage(guest,0,0,houseCanvas.width,houseCanvas.height);
 c.fillStyle='#192b24';c.fillRect(0,houseCanvas.height,photo.width,80);c.fillStyle='#f1ead2';c.font='17px Georgia';
 c.fillText(embeddedCreditLine(active.project),16,houseCanvas.height+27,photo.width-32);
 c.font='12px Arial';c.fillStyle='#c6cfba';c.fillText(active.project.source,16,houseCanvas.height+49,photo.width-32);
 return photo;
}

// Presets are anchors from the original scene, expressed in house coordinates.
// The house still owns interpolation and manual cinema orbit/pan/zoom.
const embeddedTrainInfo=()=>embeddedActive?.session?.train||null;
// Limit both composited renderers together. Independent throttling misaligns
// their cameras; the other house rooms retain their existing refresh cadence.
function embeddedFrameDue(now,last){return !embeddedActive||!last||now-last>=1000/60-1;}

function embeddedCinemaView(key,elapsed){
 // A guest that publishes a train gets the house's own following shot, which
 // already knows how to sit behind a moving locomotive. Returning null here is
 // what hands that shot back to the house rather than pinning it to an anchor.
 if(key==='tail'&&embeddedTrainInfo())return null;
 const shot=embeddedActive?.session?.views?.[key];if(!shot)return null;
 // Close shots keep their subject large in portrait. Only the whole-model
 // view backs out far enough to fit the entire miniature across a narrow frame.
 const portrait=innerWidth<700?(key==='wide'?Math.max(1.9,innerHeight/innerWidth*1.15):1.2):1;
 const yaw=shot.yaw+(reduceMotion?0:Math.sin(elapsed*.035)*.12),distance=shot.distance*portrait,cp=Math.cos(shot.pitch),target=shot.target;
 return {target,position:[target[0]+Math.sin(yaw)*cp*distance,target[1]+Math.sin(shot.pitch)*distance,target[2]+Math.cos(yaw)*cp*distance]};
}

// Copy only position/index data, once per entry. COPY_READ_BUFFER leaves the
// house's VAO, attribute and element bindings untouched. No GPU readback runs
// in the frame loop. Transparent glass is not an opaque depth blocker.
function embeddedRoomDepth(THREE,host,toLocal){
 const scene=new THREE.Scene(),material=new THREE.MeshBasicMaterial({colorWrite:false,side:THREE.DoubleSide}),walls=[];
 const previous=gl.getParameter(gl.COPY_READ_BUFFER_BINDING);
 function copy(source,which){
  if(!source||!(source.opaqueCount??source.count))return;
  gl.bindBuffer(gl.COPY_READ_BUFFER,source.buf);
  const packed=new Float32Array(gl.getBufferParameter(gl.COPY_READ_BUFFER,gl.BUFFER_SIZE)/4);gl.getBufferSubData(gl.COPY_READ_BUFFER,0,packed);
  const positions=new Float32Array(packed.length/4);for(let i=0,j=0;i<packed.length;i+=12,j+=3){positions[j]=packed[i];positions[j+1]=packed[i+1];positions[j+2]=packed[i+2];}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.applyMatrix4(toLocal);
  if(source.indexed){gl.bindBuffer(gl.COPY_READ_BUFFER,source.ibo);const indices=new Uint32Array(source.opaqueCount??source.count);gl.getBufferSubData(gl.COPY_READ_BUFFER,0,indices);geometry.setIndex(new THREE.BufferAttribute(indices,1));}
  const mesh=new THREE.Mesh(geometry,material);mesh.name=which||'House furniture depth';scene.add(mesh);if(which)walls.push({which,mesh});
 }
 try{copy(host.mesh);copy(host.lifeDetails?.mesh);for(const wall of host.walls)copy(wall.mesh,wall.which);}
 catch(error){scene.traverse(node=>node.geometry?.dispose());material.dispose();throw error;}
 finally{gl.bindBuffer(gl.COPY_READ_BUFFER,previous);}
 return {scene,update:eye=>{for(const wall of walls)wall.mesh.visible=houseRoomWallVisible(wall.which,eye);}};
}
