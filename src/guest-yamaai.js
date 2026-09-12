'use strict';

// This adapter is house code, deliberately separate from the unmodified vendor.
// Only import() crosses the classic-script boundary, and only on room entry.
let yamaaiModulePromise=null;
async function yamaaiModules(project){
 if(!yamaaiModulePromise)yamaaiModulePromise=(async()=>{
  const base=new URL(project.base,document.baseURI).href;
  const map=document.createElement('script');map.type='importmap';map.dataset.guestImport='yamaai';
  map.textContent=JSON.stringify({scopes:{[base]:{'three':base+'vendor/three.module.js','three/addons/':base+'vendor/addons/'}}});document.head.append(map);
  const paths=['vendor/three.module.js','world.js','geology.js','architecture.js','lanterns.js','vegetation.js','train.js','weather.js','render-budget.js','vendor/addons/environments/RoomEnvironment.js'];
  const modules=await Promise.all(paths.map(path=>import(base+path)));
  modules[8].configureSurfaceLighting();return modules;
 })();
 return yamaaiModulePromise;
}
// Yield between original synchronous builders, and wait for a foreground tab
// before each stage. Aborting immediately frees a partially constructed scene.
function yamaaiYield(signal){
 return new Promise((resolve,reject)=>{
  let timer=0;
  const clean=()=>{clearTimeout(timer);document.removeEventListener('visibilitychange',visible);signal.removeEventListener('abort',abort);};
  const abort=()=>{clean();reject(new DOMException('Room left','AbortError'));};
  const visible=()=>{if(!document.hidden&&!timer)timer=setTimeout(()=>{timer=0;if(document.hidden)return;clean();resolve();},32);};
  if(signal.aborted){abort();return;}signal.addEventListener('abort',abort,{once:true});document.addEventListener('visibilitychange',visible);visible();
 });
}
function yamaaiCamera(THREE,camera,state,toLocal,scale){
 camera.position.fromArray(state.eye).applyMatrix4(toLocal);
 camera.up.set(0,1,0);camera.lookAt(new THREE.Vector3().fromArray(state.target).applyMatrix4(toLocal));
 camera.near=state.near/scale;camera.far=500/scale;
 camera.projectionMatrix.fromArray(state.projection);camera.projectionMatrix.elements[14]/=scale;
 camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();camera.updateMatrixWorld(true);
}
function yamaaiDisposeScene(scene){
 const geometries=new Set(),materials=new Set(),textures=new Set();
 scene.traverse(node=>{
  if(node.geometry)geometries.add(node.geometry);
  for(const material of[...(Array.isArray(node.material)?node.material:[node.material]),node.customDepthMaterial,node.customDistanceMaterial])if(material)materials.add(material);
  node.shadow?.dispose();
 });
 for(const material of materials){for(const value of Object.values(material))if(value?.isTexture)textures.add(value);for(const uniform of Object.values(material.uniforms||{}))if(uniform.value?.isTexture)textures.add(uniform.value);material.dispose();}
 for(const geometry of geometries)geometry.dispose();for(const texture of textures)texture.dispose();scene.clear();
}
async function createYamaaiMiniature({project,signal,host,mount,progress}){
 await yamaaiYield(signal);progress('Opening Techartist’s mountain railway…');
 const [THREE,worldModule,geologyModule,architectureModule,lanternModule,vegetationModule,trainModule,weatherModule,,environmentModule]=await yamaaiModules(project);
 signal.throwIfAborted();await yamaaiYield(signal);
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'}),canvas=renderer.domElement;
 canvas.className='embed-canvas';canvas.setAttribute('aria-label',embeddedCreditLine(project));canvas.dataset.context='active';
 canvas.addEventListener('webglcontextlost',()=>{canvas.dataset.context='released';},{once:true});
 renderer.setClearColor(0,0);renderer.autoClear=false;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.outputColorSpace=THREE.SRGBColorSpace;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(),started=performance.now();let environment=null,vegetation=null,depth=null,disposed=false;
 const dispose=()=>{
  if(disposed)return;disposed=true;signal.removeEventListener('abort',dispose);
  vegetation?.dispose();yamaaiDisposeScene(scene);if(depth)yamaaiDisposeScene(depth.scene);environment?.dispose();
  // Includes the upstream river's private reflection target. Losing this
  // context releases every allocation, even resources hidden in its closures.
  renderer.setAnimationLoop(null);renderer.dispose();renderer.forceContextLoss();canvas.remove();
  embeddedStage().dataset.context=renderer.getContext().isContextLost()?'released':'release-requested';
 };
 signal.addEventListener('abort',dispose,{once:true});mount(canvas);embeddedStage().dataset.context='active';
 try{
  const pmrem=new THREE.PMREMGenerator(renderer),env=new environmentModule.RoomEnvironment();
  try{environment=pmrem.fromScene(env,.04);scene.environment=environment.texture;}finally{env.dispose();pmrem.dispose();}
  const V=(x,y,z)=>new THREE.Vector3(x,y,z),shared={time:{value:0},wind:{value:.45},wetness:{value:0},night:{value:0},sunDir:{value:V(-.7,.5,.5).normalize()},sunColor:{value:new THREE.Color('#ffc080')},sunAmt:{value:1}};
  const sun=new THREE.DirectionalLight('#fff0cd',3.35);sun.position.set(-37,75,30);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera,{left:-76,right:76,top:82,bottom:-67,near:1,far:245});sun.shadow.autoUpdate=false;sun.shadow.needsUpdate=true;sun.shadow.bias=-.00013;sun.shadow.normalBias=.105;sun.target.position.set(0,6,0);scene.add(sun,sun.target);
  const hemi=new THREE.HemisphereLight('#a5c5d8','#5a6546',1.04),bounce=new THREE.DirectionalLight('#a2c0c9',.22);bounce.position.set(25,14,54);scene.add(hemi,bounce);
  async function step(label,build){embeddedStage().dataset.foreground=String(document.visibilityState==='visible'&&document.hasFocus());progress(label);await yamaaiYield(signal);return build();}
  const world=await step('Sculpting the gorge and railway…',()=>worldModule.createWorld(scene,shared));
  await step('Laying the mountain’s rock faces…',()=>geologyModule.createGeology(scene,world,shared));
  const architecture=await step('Opening the station and shrine…',()=>architectureModule.createArchitecture(scene,world,shared));
  const lanterns=await step('Hanging the lanterns…',()=>lanternModule.createLanterns(scene,world,shared));
  world.lanternSites=lanterns.sites;world.shrineCenter.copy(architecture.shrineTarget);
  vegetation=await step('Planting the mountain forest…',()=>vegetationModule.createVegetation(scene,world,shared));
  const train=await step('Putting the local train on the line…',()=>trainModule.createTrain(scene,world.curve,shared));
  // Fit authored physical geometry, before weather particles with deliberately
  // oversized bounds. Original shaders continue to run in original local units.
  scene.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(scene),size=bounds.getSize(V()),center=bounds.getCenter(V());
  const scale=Math.min((project.table.halfWidth*2-2)/size.x,(project.table.halfDepth*2-2)/size.z,40/size.y);
  const model=new THREE.Matrix4().makeScale(scale,scale,scale);model.setPosition(-center.x*scale,project.table.top+.18-bounds.min.y*scale,-center.z*scale);
  const toLocal=model.clone().invert();depth=embeddedRoomDepth(THREE,host,toLocal);
  const anchor=point=>point.clone().applyMatrix4(model).toArray();
  const views={
   drift:{target:anchor(V(0,10,4)),distance:73,pitch:.42,yaw:.36},
   side:{target:anchor(architecture.stationTarget),distance:36,pitch:.30,yaw:.38},
   wide:{target:project.focus.slice(),distance:105,pitch:.53,yaw:.3},
   tail:{target:anchor(world.bridgeTarget),distance:42,pitch:.25,yaw:-.24}
  };
  const weather=await step('Filling the river and waterfall…',()=>weatherModule.createWeather(scene,world,shared));
  vegetation.group.traverse(o=>{if(!o.isMesh)return;
   o.onBeforeShadow=(_r,_o,_c,shadowCamera,g)=>{if(shadowCamera.isPerspectiveCamera){g.userData.savedRange={...g.drawRange};g.setDrawRange(0,0);}};
   o.onAfterShadow=(_r,_o,_c,_s,g)=>{if(g.userData.savedRange){g.setDrawRange(g.userData.savedRange.start,g.userData.savedRange.count);delete g.userData.savedRange;}};
  });
  train.spotlights.forEach(light=>light.shadow.autoUpdate=false);
  const day={sun:new THREE.Color('#fff0cd'),hemi:new THREE.Color('#a5c5d8'),ground:new THREE.Color('#5a6546'),pos:V(-37,75,30)},dusk={sun:new THREE.Color('#ffaf66'),hemi:new THREE.Color('#8ba8bc'),ground:new THREE.Color('#484c31'),pos:V(-63,25,37)},dark={sun:new THREE.Color('#8eaee0'),hemi:new THREE.Color('#4e7096'),ground:new THREE.Color('#071114'),pos:V(-24,37,-85)};
  let last=0,elapsed=0,lastShadow=-Infinity,reportAt=0,width=0,height=0,frameCount=0,cpuTime=0;
  const data=embeddedStage().dataset;data.scale=scale.toFixed(5);data.bounds=JSON.stringify({min:bounds.min.toArray(),max:bounds.max.toArray(),tableTop:project.table.top+.18});
  progress('Lighting the miniature…');await yamaaiYield(signal);
  camera.position.set(48,34,98);camera.lookAt(0,13,0);camera.updateMatrixWorld(true);
  world.prepareCompile();vegetation.prepareCompile();
  try{renderer.compile(scene,camera);}finally{world.finishCompile();vegetation.finishCompile();}
  signal.throwIfAborted();data.buildMs=String(Math.round(performance.now()-started));
  // The original curve is the exact path; sampling it beats differencing the
 // car's position between frames, which stalls whenever the train is paused.
 const curvePoint=new THREE.Vector3(),curveTangent=new THREE.Vector3();
 const trainPose={p:[0,0,0],f:[0,0,1]};
 const readTrainPose=()=>{
  const t=train.progress;
  world.curve.getPointAt(t,curvePoint);world.curve.getTangentAt(t,curveTangent);
  curvePoint.applyMatrix4(model);
  curveTangent.transformDirection(model).normalize();
  trainPose.p[0]=curvePoint.x;trainPose.p[1]=curvePoint.y;trainPose.p[2]=curvePoint.z;
  trainPose.f[0]=curveTangent.x;trainPose.f[1]=curveTangent.y;trainPose.f[2]=curveTangent.z;
  return trainPose;
 };
 readTrainPose();
 return {dispose,views,train:trainPose,readTrainPose,frame(state){
   if(disposed)return;
   const frameStart=performance.now();
   if(width!==state.width||height!==state.height){width=state.width;height=state.height;renderer.setPixelRatio(Math.min(devicePixelRatio||1,width<700?1.25:1.5));renderer.setSize(width,height,false);}
   yamaaiCamera(THREE,camera,state,toLocal,scale);depth.update(state.eye);
   const dt=last?Math.min((state.now-last)/1000,.065):0;last=state.now;if(!state.paused)elapsed+=dt;shared.time.value=elapsed;
   const n=state.night,r=state.rain,blend=n<.62?n/.62:(n-.62)/.38,a=n<.62?day:dusk,b=n<.62?dusk:dark,lerp=THREE.MathUtils.lerp;
   sun.color.copy(a.sun).lerp(b.sun,blend);sun.position.copy(a.pos).lerp(b.pos,blend);sun.intensity=lerp(n<.62?3.35:3.6,n<.62?3.6:.52,blend)*(1-r*.75);
   hemi.color.copy(a.hemi).lerp(b.hemi,blend);hemi.groundColor.copy(a.ground).lerp(b.ground,blend);hemi.intensity=lerp(n<.62?1.04:.55,n<.62?.55:.15,blend)+n*.14;bounce.intensity=lerp(.22,.08,n);
   shared.night.value=n;shared.wetness.value=Math.max(r,n*.46);shared.sunDir.value.copy(sun.position).sub(sun.target.position).normalize();shared.sunColor.value.copy(sun.color);shared.sunAmt.value=(1-n*.4)*(1-r*.9);
   renderer.toneMappingExposure=lerp(.98,1.03,n);scene.environmentIntensity=lerp(.27,.03,n);
   train.update(state.paused?0:dt,elapsed,{speed:1,paused:state.paused,night:n,rain:r});architecture.update(elapsed,n,r);lanterns.update(elapsed,n);weather.update(elapsed,{rain:r,warm:Math.sin(n*Math.PI)},train);
   readTrainPose();
   world.updateLOD(camera);vegetation.update(elapsed,camera);
   if(state.now-lastShadow>=50){lastShadow=state.now;sun.shadow.needsUpdate=true;train.spotlights.forEach(light=>light.shadow.needsUpdate=true);}
   renderer.info.reset();weather.refreshReflection(renderer,camera,state.now,false);
   renderer.setRenderTarget(null);renderer.clear();renderer.render(depth.scene,camera);renderer.render(scene,camera);
   frameCount++;cpuTime+=performance.now()-frameStart;
   if(state.now-reportAt>1000){data.fps=String(Math.round(frameCount*1000/(state.now-reportAt)));data.cpuMs=(cpuTime/frameCount).toFixed(2);frameCount=0;cpuTime=0;reportAt=state.now;data.drawCalls=String(renderer.info.render.calls);data.triangles=String(renderer.info.render.triangles);data.geometries=String(renderer.info.memory.geometries);data.textures=String(renderer.info.memory.textures);data.trainProgress=String(train.progress);data.foreground=String(document.visibilityState==='visible'&&document.hasFocus());data.camera=JSON.stringify({eye:state.eye,target:state.target});}
  }};
 }catch(error){dispose();throw error;}
}
