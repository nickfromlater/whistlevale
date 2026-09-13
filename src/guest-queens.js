'use strict';

// The house owns the camera, gestures, scheduling and audio. The original
// miniature is imported only after actual room entry, never for the map.
const QUEENS_MODEL={scale:.49,y:-8.5};
const queensWorld=p=>[p[0]*QUEENS_MODEL.scale,p[1]*QUEENS_MODEL.scale+QUEENS_MODEL.y,p[2]*QUEENS_MODEL.scale];
const QUEENS_BUILD_STAGES=[
 'Painting the court and materials…','Building Arthur Ashe Stadium…',
 'Assembling the roof trusses…','Carving the landscape and creek…',
 'Opening the Queens shopfronts…','Laying both railway circuits…',
 'Putting the trains into service…','Lighting the little world…'
];
let queensModulePromise=null;
function queensModules(project){
 if(!queensModulePromise){const base=new URL(project.base,document.baseURI).href;queensModulePromise=Promise.all([import(base+'three.module.min.js'),import(base+'model.js')]).catch(error=>{queensModulePromise=null;throw error;});}
 return queensModulePromise;
}
function queensYield(signal){
 return new Promise((resolve,reject)=>{
  let timer=0;
  const clean=()=>{clearTimeout(timer);document.removeEventListener('visibilitychange',visible);signal.removeEventListener('abort',abort);};
  const abort=()=>{clean();reject(new DOMException('Room left','AbortError'));};
  const visible=()=>{if(!document.hidden&&!timer)timer=setTimeout(()=>{timer=0;if(document.hidden)return;clean();resolve();},32);};
  if(signal.aborted){abort();return;}signal.addEventListener('abort',abort,{once:true});document.addEventListener('visibilitychange',visible);visible();
 });
}
function queensCamera(THREE,camera,state,toLocal,scale){
 camera.position.fromArray(state.eye).applyMatrix4(toLocal);camera.up.set(0,1,0);
 camera.lookAt(new THREE.Vector3().fromArray(state.target).applyMatrix4(toLocal));
 camera.near=state.near/scale;camera.far=500/scale;
 camera.projectionMatrix.fromArray(state.projection);camera.projectionMatrix.elements[14]/=scale;
 camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();camera.updateMatrixWorld(true);
}
function queensDisposeScene(scene){
 const geometries=new Set(),materials=new Set(),textures=new Set();
 scene.traverse(node=>{if(node.geometry)geometries.add(node.geometry);for(const material of Array.isArray(node.material)?node.material:[node.material])if(material)materials.add(material);node.shadow?.dispose();});
 for(const material of materials){for(const value of Object.values(material))if(value?.isTexture)textures.add(value);material.dispose();}
 for(const geometry of geometries)geometry.dispose();for(const texture of textures)texture.dispose();scene.clear();
}

// The build sketch follows this model's court, bowl, park, street blocks and
// two continuous circuits. It is deliberately line work, below the final model.
function queensBuildShapes(){
 const stages=Array.from({length:8},()=>({lines:[]}));
 const path=(stage,points)=>stages[stage].lines.push(points.map(queensWorld));
 const rect=(stage,x,z,w,d,y)=>path(stage,[[x-w/2,y,z-d/2],[x+w/2,y,z-d/2],[x+w/2,y,z+d/2],[x-w/2,y,z+d/2],[x-w/2,y,z-d/2]]);
 const ellipse=(stage,x,z,rx,rz,y)=>path(stage,Array.from({length:65},(_,i)=>[x+Math.cos(i*TAU/64)*rx,y,z+Math.sin(i*TAU/64)*rz]));
 rect(0,0,0,208,176,1);rect(0,-25,-16,8,17.5,2);rect(0,-25,-16,13,24,2);
 for(let i=0;i<5;i++)ellipse(1,-25,-16,14+i*3.2,19+i*3.2,2+i*3.3);
 rect(2,-25,-16,58,66,24);rect(2,-25,-16,41,49,24);
 for(const x of[-53,3])for(const z of[-46,14])path(2,[[x,1,z],[x,24,z]]);
 ellipse(3,-46,42,12,12,2);ellipse(3,-46,42,3.6,3.6,7);path(3,[[78,2,-55],[72,2,-32],[74,2,-12],[61,2,36],[49,2,82]]);
 for(const [x,z,w,d,h]of[[29,-28,9,9,14],[43,-28,10,10,21],[58,-28,12,10,18],[32,8,10,10,15],[52,8,11,10,18]]){rect(4,x,z,w,d,2);rect(4,x,z,w,d,h);for(const side of[-1,1])path(4,[[x+side*w/2,2,z+d/2],[x+side*w/2,h,z+d/2]]);}
 for(const [rx,rz,y]of[[89,68,5.5],[82.8,61.8,1.85]]){
  const r=24,points=[];
  for(const [cx,cz,a]of[[rx-r,rz-r,0],[-rx+r,rz-r,Math.PI/2],[-rx+r,-rz+r,Math.PI],[rx-r,-rz+r,Math.PI*1.5]])for(let i=0;i<=16;i++){const q=a+i*Math.PI/32;points.push([cx+Math.cos(q)*r,y,cz+Math.sin(q)*r]);}
  points.push(points[0]);path(5,points);
 }
 rect(6,-16,64.5,54,5,6.2);for(let i=0;i<6;i++)rect(6,-36+i*7.66,68,7.2,2.6,8.1);
 for(const x of[-50,0,50])path(7,[[x,1,48],[x,8,48],[x+1.5,8,48]]);
 return stages.map(s=>({...s,points:s.lines.reduce((n,line)=>n+line.length,0)}));
}

async function createQueensMiniature({project,signal,host,mount,progress}){
 progress('Opening the Queens miniature…');await queensYield(signal);
 const [THREE,{buildQueens}]=await queensModules(project);signal.throwIfAborted();await queensYield(signal);
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'}),canvas=renderer.domElement;
 canvas.className='embed-canvas';canvas.setAttribute('aria-label',embeddedCreditLine(project));canvas.dataset.context='active';
 canvas.addEventListener('webglcontextlost',()=>{canvas.dataset.context='released';},{once:true});
 renderer.setClearColor(0,0);renderer.autoClear=false;renderer.shadowMap.enabled=true;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.info.autoReset=false;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(),started=performance.now();
 let disposed=false,depth=null,model=null,tools=null;
 const data=embeddedStage().dataset;
 const dispose=()=>{
  if(disposed)return;disposed=true;signal.removeEventListener('abort',dispose);tools?.remove();
  queensDisposeScene(scene);if(depth)queensDisposeScene(depth.scene);
  renderer.setAnimationLoop(null);renderer.dispose();renderer.forceContextLoss();canvas.remove();
  data.context=renderer.getContext().isContextLost()?'released':'release-requested';
 };
 signal.addEventListener('abort',dispose,{once:true});mount(canvas);data.context='active';
 try{
  model=await buildQueens({THREE,scene,renderer,mobile:innerWidth<700,reduced:!!reduceMotion,step:async text=>{progress(text);await queensYield(signal);}});
  signal.throwIfAborted();
  const transform=new THREE.Matrix4().makeScale(QUEENS_MODEL.scale,QUEENS_MODEL.scale,QUEENS_MODEL.scale);transform.setPosition(0,QUEENS_MODEL.y,0);
  const toLocal=transform.clone().invert();depth=embeddedRoomDepth(THREE,host,toLocal);
  scene.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(scene);data.scale=String(QUEENS_MODEL.scale);data.bounds=JSON.stringify({min:bounds.min.toArray(),max:bounds.max.toArray()});
  camera.position.set(130,120,210);camera.lookAt(0,0,0);camera.updateMatrixWorld(true);
  renderer.compile(scene,camera);await queensYield(signal);data.buildMs=String(Math.round(performance.now()-started));
  const views={
   drift:{target:queensWorld([-25,8,-16]),distance:49,pitch:.76,yaw:.22},
   side:{target:queensWorld([-23,7,65]),distance:25,pitch:.38,yaw:.70},
   wide:{target:project.focus.slice(),distance:132,pitch:.65,yaw:.26}
  };
  const point=new THREE.Vector3(),tangent=new THREE.Vector3(),train={p:[0,0,0],f:[0,0,1]};
  function readTrainPose(){
   model.seven.curve.getPointAt(model.seven.u,point);model.seven.curve.getTangentAt(model.seven.u,tangent);
   train.p=queensWorld(point.toArray());train.f=tangent.toArray();return train;
  }
  readTrainPose();
  function cinemaView(key){
   if(key!=='tail')return null;
   readTrainPose();const portrait=innerWidth<700?1.12:1;
   // An outboard three-quarter angle stays in the clear perimeter aisle.
   const p=train.p,f=train.f,side=p[0]*f[2]-p[2]*f[0]>0?1:-1;
   return {target:[p[0],p[1]+.8,p[2]],position:[p[0]+f[2]*side*9*portrait+f[0]*6,p[1]+5.4,p[2]-f[0]*side*9*portrait+f[2]*6],groundHandled:true};
  }
  tools=document.createElement('details');tools.className='queens-tools';
  const heading=document.createElement('summary');heading.textContent='At the stadium';
  const actions=document.createElement('div');actions.className='embed-actions';
  const roof=document.createElement('button');roof.id='queensRoof';roof.textContent='Lift stadium roof';roof.setAttribute('aria-pressed','false');
  roof.onclick=()=>{const open=model.stats().roofTarget<.5;model.setRoof(open);roof.setAttribute('aria-pressed',String(open));roof.textContent=open?'Replace roof':'Lift stadium roof';};
  const play=document.createElement('button');play.id='queensPoint';play.textContent='Play final point';
  play.onclick=()=>{if(embeddedActive?.paused)document.getElementById('embedPause').click();if(paused)togglePause();model.play();setView('overview',false);Object.assign(orbit,{target:queensWorld([-25,3,-16]),distance:innerWidth<700?31:28,pitch:1.03,yaw:.10});};
  const note=document.createElement('p');note.className='queens-point-note';note.textContent='A miniature final, imagined for this little world.';
  actions.append(roof,play);tools.append(heading,actions,note);embeddedStage().querySelector('#embedCredit').append(tools);
  let last=0,width=0,height=0,lastNight=-1,lastShadow=-Infinity,reportAt=0,frames=0,cpu=0,wasPlaying=false;
  return {dispose,views,cinemaView,train,readTrainPose,inspect:()=>model.stats(),frame(state){
   if(disposed)return;const start=performance.now();
   if(width!==state.width||height!==state.height){width=state.width;height=state.height;const ratio=Math.min(devicePixelRatio||1,width<700?1.25:1.5,Math.sqrt(2100000/(width*height)));renderer.setPixelRatio(ratio);renderer.setSize(width,height,false);data.pixels=String(canvas.width*canvas.height);}
   queensCamera(THREE,camera,state,toLocal,QUEENS_MODEL.scale);depth.update(state.eye);
   const dt=last?Math.min((state.now-last)/1000,.065):0;last=state.now;
   model.tick(dt,state.night,state.paused);readTrainPose();
   if(Math.abs(state.night-lastNight)>.04&&state.now-lastShadow>180){renderer.shadowMap.needsUpdate=true;lastNight=state.night;lastShadow=state.now;}
   const status=model.stats();if(status.playing!==wasPlaying){wasPlaying=status.playing;play.disabled=wasPlaying;play.textContent=wasPlaying?'The final point…':status.matchWon?'Replay final point':'Play final point';}
   if(roof.getAttribute('aria-pressed')!==String(status.roofTarget>.5)){roof.setAttribute('aria-pressed',String(status.roofTarget>.5));roof.textContent=status.roofTarget>.5?'Replace roof':'Lift stadium roof';}
   renderer.info.reset();renderer.setRenderTarget(null);renderer.clear();
   // The depth pass must not consume the guest's one-shot shadow refresh.
   const refresh=renderer.shadowMap.needsUpdate;renderer.shadowMap.needsUpdate=false;renderer.render(depth.scene,camera);renderer.shadowMap.needsUpdate=refresh;renderer.render(scene,camera);
   frames++;cpu+=performance.now()-start;
   if(state.now-reportAt>1000){data.fps=String(Math.round(frames*1000/(state.now-reportAt)));data.cpuMs=(cpu/frames).toFixed(2);reportAt=state.now;frames=0;cpu=0;data.drawCalls=String(renderer.info.render.calls);data.triangles=String(renderer.info.render.triangles);data.geometries=String(renderer.info.memory.geometries);data.textures=String(renderer.info.memory.textures);data.trainProgress=String(model.seven.u);data.foreground=String(document.visibilityState==='visible'&&document.hasFocus());data.seats=String(status.seats);data.spectators=String(status.spectators);}
  }};
 }catch(error){dispose();throw error;}
}
