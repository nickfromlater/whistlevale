import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createWorld } from './world.js?v=cinematic-20260911';
import { createGeology } from './geology.js';
import { createLanterns } from './lanterns.js';
import { createArchitecture } from './architecture.js';
import { createVegetation } from './vegetation.js?v=cinematic-20260911';
import { createTrain } from './train.js';
import { createWeather } from './weather.js?v=cinematic-20260911';
import { createAtmosphere,createMountainSky } from './atmosphere.js';
import { createLuminousResponse } from './luminous.js';
import { createCinematography } from './cinematography.js';
import { configureSurfaceLighting,createRenderBudget } from './render-budget.js';
const $=s=>document.querySelector(s),V=(x,y,z)=>new THREE.Vector3(x,y,z);

async function start(){
  configureSurfaceLighting();
  const renderer=new THREE.WebGLRenderer({canvas:$('#scene'),antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.02;renderer.outputColorSpace=THREE.SRGBColorSpace;
  const renderBudget=createRenderBudget(renderer),luminous=createLuminousResponse(renderer);
  const scene=new THREE.Scene();scene.fog=new THREE.FogExp2('#9cadab',.0024);
  const camera=new THREE.PerspectiveCamera(46,innerWidth/innerHeight,.3,1100);camera.position.set(48,34,98);
  const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,13,0);
  controls.enableDamping=true;controls.dampingFactor=.1;controls.minDistance=8;controls.maxDistance=235;
  controls.maxPolarAngle=Math.PI*.68;controls.minPolarAngle=.22;controls.enablePan=true;
  controls.panSpeed=.5;controls.rotateSpeed=.42;controls.zoomSpeed=.75;controls.minTargetRadius=0;controls.maxTargetRadius=66;controls.cursor.set(0,9,0);controls.update();
  const pmrem=new THREE.PMREMGenerator(renderer),env=new RoomEnvironment();scene.environment=pmrem.fromScene(env,.04).texture;env.dispose();pmrem.dispose();
  const sun=new THREE.DirectionalLight('#ffd09b',3.65);sun.position.set(-52,32,34);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera,{left:-76,right:76,top:82,bottom:-67,near:1,far:245});
  sun.shadow.autoUpdate=false;sun.shadow.needsUpdate=true;sun.shadow.bias=-.00013;sun.shadow.normalBias=.105;sun.target.position.set(0,6,0);scene.add(sun,sun.target);
  const hemi=new THREE.HemisphereLight('#a8c9d4','#4c5439',.8);scene.add(hemi);
  const bounce=new THREE.DirectionalLight('#a2c0c9',.15);bounce.position.set(25,14,54);scene.add(bounce);
  const shared={time:{value:0},wind:{value:.45},wetness:{value:0},night:{value:.14},sunDir:{value:V(-.7,.5,.5).normalize()},sunColor:{value:new THREE.Color('#ffc080')},sunAmt:{value:.9}};
  await new Promise(requestAnimationFrame);
  const world=createWorld(scene,shared);createGeology(scene,world,shared);
  const architecture=createArchitecture(scene,world,shared),lanterns=createLanterns(scene,world,shared);
  world.lanternSites=lanterns.sites;world.shrineCenter.copy(architecture.shrineTarget);
  const vegetation=createVegetation(scene,world,shared),train=createTrain(scene,world.curve,shared),weather=createWeather(scene,world,shared);
  const sky=createMountainSky(shared);scene.add(sky.mesh);const atmosphere=createAtmosphere(scene,shared);
  const cinematography=createCinematography(world,architecture,train);
  const initial=cinematography.fitted(cinematography.shots.hero,camera.aspect);camera.position.copy(initial.position);controls.target.copy(initial.target);controls.update();
  // Foliage retains complete sun shadows and receives headlights. Its large
  // instanced batches are excluded from the narrow perspective shadow passes.
  vegetation.group.traverse(o=>{if(!o.isMesh)return;
    o.onBeforeShadow=(_r,_o,_c,shadowCamera,g)=>{if(shadowCamera.isPerspectiveCamera){g.userData.savedRange={...g.drawRange};g.setDrawRange(0,0);}};
    o.onAfterShadow=(_r,_o,_c,_s,g)=>{if(g.userData.savedRange){g.setDrawRange(g.userData.savedRange.start,g.userData.savedRange.count);delete g.userData.savedRange;}};
  });
  train.spotlights.forEach(light=>light.shadow.autoUpdate=false);
  // Soft source halos supplement the HDR luminous response, preserving a compact
  // bright core even when the physical luminaire is smaller than one pixel.
  const haloCanvas=document.createElement('canvas');haloCanvas.width=64;haloCanvas.height=64;
  const hc=haloCanvas.getContext('2d'),gradient=hc.createRadialGradient(32,32,1,32,32,31);
  gradient.addColorStop(0,'rgba(255,237,191,1)');gradient.addColorStop(.15,'rgba(255,210,140,.3)');gradient.addColorStop(.48,'rgba(255,190,95,.055)');gradient.addColorStop(1,'rgba(255,170,60,0)');hc.fillStyle=gradient;hc.fillRect(0,0,64,64);
  const haloTexture=new THREE.CanvasTexture(haloCanvas),haloMat=new THREE.SpriteMaterial({map:haloTexture,color:'#ffd3a0',transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending});
  for(const light of architecture.lights){const halo=new THREE.Sprite(haloMat);halo.scale.set(1.25,1.25,1);light.add(halo);}
  const modes={
    day:{sun:'#fff0cd',sunPower:3.35,sunPos:V(-37,75,30),hemi:'#a5c5d8',ground:'#5a6546',ambient:1.04,bounce:.22,top:'#6d99b2',bottom:'#ccd4c2',fog:'#93ada9',density:.0019,night:0,rain:0,wet:0,exposure:.98,env:.27,warm:.35,sunAmt:1},
    evening:{sun:'#ffaf66',sunPower:3.6,sunPos:V(-63,25,37),hemi:'#8ba8bc',ground:'#484c31',ambient:.55,bounce:.14,top:'#5b7695',bottom:'#c2bfae',fog:'#879c92',density:.0024,night:.14,rain:0,wet:0,exposure:1.02,env:.16,warm:1,sunAmt:.95},
    rain:{sun:'#9dafc2',sunPower:.5,sunPos:V(-28,58,12),hemi:'#6a8497',ground:'#1b2d2a',ambient:.4,bounce:.09,top:'#21374c',bottom:'#6f8789',fog:'#4e686b',density:.0042,night:.79,rain:.68,wet:1,exposure:1.01,env:.09,warm:0,sunAmt:.1},
    night:{sun:'#8eaee0',sunPower:.52,sunPos:V(-24,37,-85),hemi:'#4e7096',ground:'#071114',ambient:.15,bounce:.02,top:'#020a16',bottom:'#152a3e',fog:'#112938',density:.0027,night:1,rain:0,wet:.46,exposure:1.03,env:.03,warm:0,sunAmt:.6}
  };
  const state={mode:'evening',rain:0,wind:.45,speed:1,paused:matchMedia('(prefers-reduced-motion: reduce)').matches,cinematic:false};
  let mode=modes.evening,elapsed=0,last=performance.now(),frame=0,currentRain=0,currentWarm=1;
  let followTrain=false,interacting=false,orbitUntil=0,cameraTween=null;
  function setMode(name){state.mode=name;mode=modes[name];state.rain=mode.rain;$('#rain').value=Math.round(state.rain*100);$('#rainValue').value=Math.round(state.rain*100)+'%';
    document.querySelectorAll('[data-mode]').forEach(b=>{const on=b.dataset.mode===name;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});document.body.classList.toggle('night',name==='night'||name==='rain');
  }
  function goTo(position,target,duration=3.3){followTrain=false;state.cinematic=false;$('#cinematic').setAttribute('aria-pressed','false');cameraTween={start:performance.now(),duration:duration*1000,from:camera.position.clone(),to:position.clone(),fromTarget:controls.target.clone(),target:target.clone()};}
  const views=Object.fromEntries(Object.entries(cinematography.shots).map(([name,shot])=>[name,()=>{const s=cinematography.fitted(shot,camera.aspect);return [s.position,s.target];}]));
  views.lanterns=()=>{const target=lanterns.sites[4].head.clone().add(V(0,-1.3,0));return [target.clone().add(V(6,3,7)),target];};
  views.train=()=>[train.focus.clone().add(V(13,5,15)),train.focus.clone()];
  document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));
  function setSettings(open){$('#settings').hidden=!open;$('#tune').setAttribute('aria-expanded',String(open));}
  $('#view').onchange=e=>{const name=e.target.value;if(name==='night')setMode('night');const [p,t]=views[name]();goTo(p,t);followTrain=name==='train';setSettings(false);$('#tune').focus({preventScroll:true});};
  $('#tune').onclick=()=>setSettings($('#settings').hidden);
  renderer.domElement.addEventListener('pointerdown',()=>setSettings(false));
  $('#home').onclick=()=>{const [p,t]=views.hero();goTo(p,t);$('#view').value='hero';setSettings(false);};
  function pause(){state.paused=!state.paused;$('#pause').setAttribute('aria-pressed',String(state.paused));$('#pause').textContent=state.paused?'▷':'Ⅱ';$('#pause').setAttribute('aria-label',state.paused?'Resume scene':'Pause scene');}
  $('#pause').onclick=pause;if(state.paused){state.paused=false;pause();}
  $('#cinematic').onclick=()=>{followTrain=false;state.cinematic=!state.cinematic;cameraTween=null;cinematography.reset();$('#cinematic').setAttribute('aria-pressed',String(state.cinematic));setSettings(false);};
  $('#rain').oninput=e=>{state.rain=+e.target.value/100;$('#rainValue').value=e.target.value+'%';};
  $('#wind').oninput=e=>{state.wind=+e.target.value/100;$('#windValue').value=e.target.value+'%';};
  $('#speed').oninput=e=>{state.speed=+e.target.value/100;$('#speedValue').value=state.speed.toFixed(2).replace(/0+$/,'').replace(/\.$/,'')+'×';};
  controls.addEventListener('end',()=>{interacting=false;orbitUntil=performance.now()+900;});
  controls.addEventListener('start',()=>{interacting=true;followTrain=false;state.cinematic=false;cameraTween=null;$('#cinematic').setAttribute('aria-pressed','false');$('#hint').style.opacity='.25';});
  addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#settings').hidden){setSettings(false);$('#tune').focus({preventScroll:true});return;}if(e.target.matches('input,select,textarea,button'))return;if(e.code==='Space'){e.preventDefault();pause();}if(e.key==='h')$('#home').click();});
  const targetColor=new THREE.Color(),blendColor=(current,color,k)=>current.lerp(targetColor.set(color),k);
  function lighting(dt){const k=1-Math.exp(-dt*1.5);currentRain=THREE.MathUtils.lerp(currentRain,state.rain,k);currentWarm=THREE.MathUtils.lerp(currentWarm,mode.warm,k);
    shared.night.value=THREE.MathUtils.lerp(shared.night.value,mode.night,k);shared.wind.value=state.wind;shared.wetness.value=THREE.MathUtils.lerp(shared.wetness.value,Math.max(mode.wet,currentRain),k*.45);
    sun.position.lerp(mode.sunPos,k);blendColor(sun.color,mode.sun,k);sun.intensity=THREE.MathUtils.lerp(sun.intensity,mode.sunPower,k);
    blendColor(hemi.color,mode.hemi,k);blendColor(hemi.groundColor,mode.ground,k);hemi.intensity=THREE.MathUtils.lerp(hemi.intensity,mode.ambient,k);bounce.intensity=THREE.MathUtils.lerp(bounce.intensity,mode.bounce,k);
    scene.environmentIntensity=THREE.MathUtils.lerp(scene.environmentIntensity,mode.env,k);blendColor(scene.fog.color,mode.fog,k);scene.fog.density=THREE.MathUtils.lerp(scene.fog.density,mode.density+currentRain*.0005,k);
    renderer.toneMappingExposure=THREE.MathUtils.lerp(renderer.toneMappingExposure,mode.exposure,k);blendColor(sky.uniforms.uTop.value,mode.top,k);blendColor(sky.uniforms.uBottom.value,mode.bottom,k);sky.uniforms.uRain.value=currentRain;sky.uniforms.uWarm.value=currentWarm;
    shared.sunDir.value.copy(sun.position).normalize();shared.sunColor.value.copy(sun.color);shared.sunAmt.value=THREE.MathUtils.lerp(shared.sunAmt.value,mode.sunAmt,k);
    atmosphere.update(currentRain,currentWarm,sky.uniforms.uBottom.value);
  }
  let lastSunShadow=-Infinity,lastHeadShadow=-Infinity,lastStatus='';const shadowSunPosition=sun.position.clone();
  function animate(now){const frameStarted=performance.now(),dt=Math.min((now-last)/1000,.15);last=now;if(!state.paused)elapsed+=dt;shared.time.value=elapsed;lighting(dt);
    for(let step=0,steps=Math.max(1,Math.ceil(dt/.05));step<steps;step++)train.update(dt/steps,elapsed,{speed:state.speed,paused:state.paused,night:shared.night.value,rain:currentRain});
    architecture.update(elapsed,shared.night.value,currentRain);lanterns.update(elapsed,shared.night.value);haloMat.opacity=shared.night.value*.40;weather.update(elapsed,{rain:currentRain,warm:currentWarm},train);
    if(cameraTween){const t=THREE.MathUtils.clamp((now-cameraTween.start)/cameraTween.duration,0,1),e=t*t*(3-2*t);camera.position.lerpVectors(cameraTween.from,cameraTween.to,e);controls.target.lerpVectors(cameraTween.fromTarget,cameraTween.target,e);if(t===1)cameraTween=null;}
    if(followTrain&&!cameraTween){camera.position.lerp(train.focus.clone().add(V(13,5,15)),1-Math.exp(-dt*1.8));controls.target.lerp(train.focus,1-Math.exp(-dt*2.7));}
    if(state.cinematic&&!state.paused)cinematography.update(elapsed*1000,dt,camera,controls,shared.night.value);
    const ground=world.inFootprint(camera.position.x,camera.position.z)?world.height(camera.position.x,camera.position.z):0;
    if(camera.position.y<ground+2.1)camera.position.y=ground+2.1;
    controls.target.y=Math.max(-12,controls.target.y);controls.dampingFactor=1-Math.exp(-dt*6);controls.update(dt);
    const viewDistance=camera.position.distanceTo(controls.target),desiredNear=THREE.MathUtils.clamp(viewDistance*.018,.22,3.5);
    if(Math.abs(camera.near-desiredNear)>.04){camera.near=desiredNear;camera.updateProjectionMatrix();}
    world.updateLOD(camera);vegetation.update(elapsed,camera);camera.updateMatrixWorld(true);
    const sunMoved=sun.position.distanceToSquared(shadowSunPosition)>.002,shadowDue=now-lastSunShadow>=50&&(sunMoved||!state.paused||lastSunShadow===-Infinity);
    if(shadowDue){sun.shadow.needsUpdate=true;lastSunShadow=now;shadowSunPosition.copy(sun.position);}
    if(now-lastHeadShadow>=50&&(!state.paused||lastHeadShadow===-Infinity)){train.spotlights.forEach(l=>l.shadow.needsUpdate=true);lastHeadShadow=now;}
    renderBudget.begin(now,frameStarted);const reflected=weather.refreshReflection(renderer,camera,now,interacting||now<orbitUntil);
    luminous.render(scene,camera,shared.night.value);renderBudget.end(reflected,shadowDue,vegetation);
    document.documentElement.dataset.progress=train.progress.toFixed(5);
    if(frame++%18===0){const u=train.progress;let status=train.status.includes('station stop')?'At Yamaai station':train.status.includes('Approaching')?'Approaching Yamaai':u>world.bridgeStart&&u<world.bridgeEnd?'Crossing Kawasemi':u>world.tunnelStart&&u<world.tunnelEnd?'Through the mountain':'Along the valley';if(state.paused)status='A quiet moment';if(status!==lastStatus){$('#journey').textContent=status;lastStatus=status;}}
    requestAnimationFrame(animate);
  }
  addEventListener('resize',()=>{const before=Math.max(1,1/camera.aspect),aspect=innerWidth/innerHeight,after=Math.max(1,1/aspect);
    camera.position.sub(controls.target).multiplyScalar(after/before).add(controls.target);camera.aspect=aspect;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);cameraTween=null;});
  const query=new URLSearchParams(location.search);
  if(modes[query.get('mode')]){setMode(query.get('mode'));lighting(100);}
  const firstView=query.get('view');if(views[firstView]){const [p,t]=views[firstView]();camera.position.copy(p);controls.target.copy(t);controls.update();}
  if(views[firstView])$('#view').value=firstView;
  if(query.get('cinematic')==='1')$('#cinematic').click();
  // Settle into the composed hero frame with one short, gentle push-in.
  if(!views[firstView]&&query.get('cinematic')!=='1'){
    const arrive=camera.position.clone(),from=arrive.clone().sub(controls.target).multiplyScalar(1.055).add(controls.target);from.y+=1.1;
    camera.position.copy(from);controls.update();
    cameraTween={start:performance.now()+350,duration:2700,from,fromTarget:controls.target.clone(),to:arrive,target:controls.target.clone()};
  }
  window.yamaai={renderer,scene,camera,controls,world,train,vegetation,state,shared,setMode,goTo,views,architecture,weather,lanterns,cinematography};
  world.updateLOD(camera);vegetation.update(0,camera);world.prepareCompile();vegetation.prepareCompile();await renderer.compileAsync(scene,camera);luminous.render(scene,camera,shared.night.value);world.finishCompile();vegetation.finishCompile();
  last=performance.now();requestAnimationFrame(animate);setTimeout(()=>{$('#loading').style.opacity=0;setTimeout(()=>$('#loading')?.remove(),1050);},400);
}
start().catch(e=>{console.error(e);$('#loading').hidden=true;$('#error').hidden=false;$('#error').textContent='The mountain line could not start. '+e.message+' Please use a current browser with WebGL 2 enabled and check that all website files uploaded successfully.';});
