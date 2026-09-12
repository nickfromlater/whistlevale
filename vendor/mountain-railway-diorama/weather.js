import * as THREE from 'three';
import { createRiver } from './river.js';
import { createCascade } from './cascade.js';
import {V,rng,mesh,ribbon,rockGeo,batch,surfaceMaterial,tube} from './geometry.js';
export function createWeather(scene,world,shared){
 const rand=rng(951),group=new THREE.Group();scene.add(group);
 const uniforms={uTime:shared.time,uRain:{value:0},uNight:shared.night,uWind:shared.wind,uWarm:{value:1},uTrain:{value:V()},uTrainDirection:{value:V(0,0,1)},uSun:{value:V(-.5,.8,.5)},uSunDir:shared.sunDir??{value:V(-.7,.5,.5).normalize()},uSunCol:shared.sunColor??{value:new THREE.Color('#ffc080')},uSunAmt:shared.sunAmt??{value:.9}};
 const river=createRiver(scene,group,world,shared,uniforms);const {water}=river;const cascade=createCascade(group,world,shared,uniforms);
 let branchG=[];for(let i=0;i<6;i++){let z=-30+rand()*63,x=world.riverX(z)+(i%2?2.8:-2.8);branchG.push(tube([V(x,world.waterLevel(z)+.13,z),V(x+.6,world.waterLevel(z+.6)+.09,z+.6),V(x+1.7,world.waterLevel(z+.9)+.02,z+.9)],[.075,.055,.02],7));}batch(group,branchG,surfaceMaterial('#5d5942',.88,shared));
 // Irregular puddles collect on the platform, with wetness confined to their footprints.
 const puddleGroup=new THREE.Group();let origin=world.curve.getPointAt(world.stationU),heading=world.curve.getTangentAt(world.stationU);puddleGroup.position.copy(origin);puddleGroup.rotation.y=-Math.atan2(heading.z,heading.x);group.add(puddleGroup);
 const puddleMat=new THREE.MeshPhysicalMaterial({color:'#3b514c',roughness:.12,metalness:.32,clearcoat:1,transparent:true,opacity:0,depthWrite:false});
 for(let i=0;i<7;i++){let p=[0,0,0],idx=[],r=.25+rand()*.4;for(let j=0;j<17;j++){let a=j/16*Math.PI*2,rr=r*(.72+rand()*.35);p.push(Math.cos(a)*rr,0,Math.sin(a)*rr*.54);if(j<16)idx.push(0,j+2,j+1);}let g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();let m=mesh(g,puddleMat,puddleGroup,false);m.position.set(-9+i*2.8,.625,2.25+rand()*1.2);m.renderOrder=2;}
 // A few roof-edge drips provide a close-range rain cue at the station eaves.
 let runoffPos=[];for(let i=0;i<28;i++){let x=-8+rand()*10,z=9.1+rand()*.2,y=3.2;runoffPos.push(x,y,z,x+.02,y-.22-rand()*.4,z);}
 let runoffG=new THREE.BufferGeometry();runoffG.setAttribute('position',new THREE.Float32BufferAttribute(runoffPos,3));let runoffMat=new THREE.ShaderMaterial({uniforms,vertexShader:`uniform float uTime;varying float vY;void main(){vec3 p=position;p.y-=mod(uTime*3.2+position.x*.7,2.8);vY=p.y;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,fragmentShader:`uniform float uRain;varying float vY;void main(){gl_FragColor=vec4(.65,.75,.74,uRain*.29*step(.4,vY));}`,transparent:true,depthWrite:false});puddleGroup.add(new THREE.LineSegments(runoffG,runoffMat));
 // Local valley mist: camera-facing soft plumes, confined around stream and portal mouths.
 const mistG=new THREE.BufferGeometry();let mp=[],ms=[],ma=[];for(let i=0;i<44;i++){let z=-39+rand()*78;mp.push(world.riverX(z)+(rand()-.5)*9,world.waterLevel(z)+.9+rand()*2.2,z);ms.push(5+rand()*8);ma.push(rand()*6);}for(let p of world.portals)for(let j=0;j<4;j++){mp.push(p.x+(rand()-.5)*5,p.y+1,p.z+(rand()-.5)*3);ms.push(4+rand()*2);ma.push(rand()*6);}
 // Impact-zone plumes where the cascade strikes rock and pool.
 for(const z of [4.9,9.1,14.9])for(let j=0;j<2;j++){mp.push(world.riverX(z)+(rand()-.5)*3,world.waterLevel(z)+.5+rand()*.9,z+(rand()-.5)*1.4);ms.push(3.5+rand()*2.5);ma.push(rand()*6);}
 mistG.setAttribute('position',new THREE.Float32BufferAttribute(mp,3));mistG.setAttribute('aSize',new THREE.Float32BufferAttribute(ms,1));mistG.setAttribute('aPhase',new THREE.Float32BufferAttribute(ma,1));
 const mistMat=new THREE.ShaderMaterial({uniforms:{...uniforms,uPixelRatio:{value:Math.min(devicePixelRatio,1.6)}},vertexShader:`uniform float uTime;attribute float aSize;attribute float aPhase;varying float vPhase;varying float vBeam;varying float vFront;uniform vec3 uTrain,uTrainDirection;void main(){vec3 p=position;p.x+=sin(uTime*.065+aPhase)*1.2;p.y+=sin(uTime*.09+aPhase)*.25;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(aSize*650./max(.1,-mv.z),1.,320.);vPhase=aPhase;vFront=step(.5,-mv.z);vec3 delta=p-uTrain;float d=length(delta);vBeam=smoothstep(.92,.992,dot(normalize(delta),uTrainDirection))*exp(-d*.045);}`,fragmentShader:`uniform float uTime;uniform float uRain;uniform float uNight;varying float vPhase;varying float vBeam;varying float vFront;void main(){vec2 p=gl_PointCoord-.5;p.y*=2.;float a=exp(-dot(p,p)*13.)*.085*(.28+uRain*1.6+uNight*.25);a*=1.-smoothstep(.18,.52,length(gl_PointCoord-.5));a*=.7+.3*sin(p.x*14.+uTime*.12+vPhase);gl_FragColor=vec4(mix(vec3(.72,.78,.73),vec3(.14,.23,.34),uNight)+vec3(1.,.77,.43)*vBeam*uNight*2.2,a*vFront);}`,transparent:true,depthWrite:false,blending:THREE.NormalBlending});let mist=new THREE.Points(mistG,mistMat);group.add(mist);mist.renderOrder=4;
 // Rain uses two depths and individual velocity/length, one draw call.
 let rp=[],rseed=[],rtail=[];for(let i=0;i<8400;i++){let x=(rand()-.5)*124,z=(rand()-.5)*99,y=rand()*74-16;rp.push(x,y,z,x,y,z);rtail.push(0,.40+rand()*.85);let v=rand();rseed.push(v,v);}let rg=new THREE.BufferGeometry();rg.setAttribute('position',new THREE.Float32BufferAttribute(rp,3));rg.setAttribute('aSeed',new THREE.Float32BufferAttribute(rseed,1));rg.setAttribute('aTail',new THREE.Float32BufferAttribute(rtail,1));let rainMat=new THREE.ShaderMaterial({uniforms,vertexShader:`uniform float uTime;uniform float uWind;uniform float uRain;attribute float aSeed;attribute float aTail;varying float vVisible;varying float vDepth;void main(){vec3 p=position;float y=mod(p.y+16.-uTime*(20.+aSeed*9.),74.)-16.+aTail;p.y=y;p.x+=y*.08*uWind;p.z+=y*.018;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;vVisible=smoothstep(aSeed,aSeed+.06,uRain);vDepth=clamp(70./max(.1,-mv.z),.3,1.);}`,fragmentShader:`uniform float uNight;varying float vVisible;varying float vDepth;void main(){gl_FragColor=vec4(mix(vec3(.72,.82,.84),vec3(.48,.60,.72),uNight),vVisible*vDepth*.34);}`,transparent:true,depthWrite:false});let rain=new THREE.LineSegments(rg,rainMat);rain.frustumCulled=false;group.add(rain);
 // Firefly pockets with individual slow paths and independent, sparse pulses.
 let fp=[],fseed=[];let pockets=[[20,2,12],[-43,14,-12],[-40,6,24],[18,2,-7],[-28,6,18]];for(let i=0;i<85;i++){let c=pockets[i%5],x=c[0]+(rand()-.5)*10,z=c[2]+(rand()-.5)*10;fp.push(x,Math.max(world.height(x,z),world.waterLevel(z))+.5+rand()*2,z);fseed.push(rand()*100);}let fg=new THREE.BufferGeometry();fg.setAttribute('position',new THREE.Float32BufferAttribute(fp,3));fg.setAttribute('aSeed',new THREE.Float32BufferAttribute(fseed,1));let fm=new THREE.ShaderMaterial({uniforms,vertexShader:`uniform float uTime;attribute float aSeed;varying float vPulse;void main(){vec3 p=position+vec3(sin(uTime*.31+aSeed)*1.2,sin(uTime*.47+aSeed)*.6,cos(uTime*.23+aSeed)*.9);vPulse=.06+.94*pow(max(0.,sin(uTime*(.6+fract(aSeed)*.4)+aSeed)),2.3);vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(780./-mv.z,4.,12.);}`,fragmentShader:`uniform float uNight;varying float vPulse;void main(){float r=length(gl_PointCoord-.5);gl_FragColor=vec4(1.,.89,.39,(exp(-r*r*22.)*.58+exp(-r*r*140.)*.8)*vPulse*uNight);}`,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});group.add(new THREE.Points(fg,fm));
 // Small momiji leaves drift from actual deciduous groves, in staggered gusts.
 const lp=[],li=[],lse=[],lo=[],lc=[],lf=[];
 const leafOutline=[[0,1.1],[.19,.49],[.64,.75],[.47,.23],[.91,.21],[.39,-.09],[.32,-.49],[0,-.22],[-.32,-.49],[-.39,-.09],[-.91,.21],[-.47,.23],[-.64,.75],[-.19,.49]];
 const groves=world.autumnGroves?.length?world.autumnGroves:[{x:-32,y:7,z:20}];
 for(let i=0;i<54;i++){
  const grove=groves[(Math.floor(i/9)*17)%groves.length],x=grove.x+(rand()-.5)*2,z=grove.z+(rand()-.5)*2;
  let floor=world.height(x,z);for(let k=0;k<6;k++)floor=Math.max(floor,world.height(x+k*.95,z+Math.sin(k)*.7));
  const y=Math.max(grove.y+3+rand()*2,floor+1.4),size=.095+rand()*.065,n=lp.length/3;
  const shade=new THREE.Color(['#bd512d','#dba547','#a73b38'][i%3]);
  const vertices=[[0,.045,0],...leafOutline.map(([a,b])=>[a,-Math.abs(a)*.08,b])];
  for(const [a,b,c] of vertices){lp.push(x+a*size,y+b*size,z+c*size);lo.push(x,y,z);lse.push(i*.79);lf.push(floor+.10);lc.push(shade.r,shade.g,shade.b);}
  leafOutline.forEach((_,j)=>li.push(n,n+1+j,n+1+(j+1)%leafOutline.length));
 }
 const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.Float32BufferAttribute(lp,3));lg.setAttribute('aOrigin',new THREE.Float32BufferAttribute(lo,3));lg.setAttribute('aSeed',new THREE.Float32BufferAttribute(lse,1));lg.setAttribute('aFloor',new THREE.Float32BufferAttribute(lf,1));lg.setAttribute('color',new THREE.Float32BufferAttribute(lc,3));lg.setIndex(li);lg.computeVertexNormals();
 const lm=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.92,side:THREE.DoubleSide,transparent:true,depthWrite:false});
 lm.onBeforeCompile=shader=>{
  shader.uniforms.uLeafTime=shared.time;shader.uniforms.uLeafWind=shared.wind;
  shader.vertexShader='uniform float uLeafTime,uLeafWind;attribute vec3 aOrigin;attribute float aSeed,aFloor;varying float vLeafFade;\n'+shader.vertexShader.replace('#include <begin_vertex>',`
   float cycle=mod(uLeafTime+aSeed*.63,34.);float t=min(cycle,9.);float a=t*1.7+aSeed;
   vec3 local=position-aOrigin;vec3 transformed=aOrigin+vec3(local.x*cos(a)-local.z*sin(a),local.y+local.z*sin(a*1.3),local.x*sin(a)+local.z*cos(a));
   transformed.x+=t*.57*uLeafWind+sin(t*2.+aSeed)*.35;transformed.z+=sin(t*.5+aSeed)*.65;transformed.y-=t*.48;
   vLeafFade=smoothstep(0.,.8,cycle)*(1.-smoothstep(6.,9.,cycle))*smoothstep(aFloor,aFloor+.65,transformed.y)*(.35+uLeafWind*.65);
  `);
  shader.fragmentShader='varying float vLeafFade;\n'+shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a*=vLeafFade;');
 };
 lm.customProgramCacheKey=()=>'autumn-momiji-drift';const leafDrift=new THREE.Mesh(lg,lm);leafDrift.name='Gust-carried maple leaves';leafDrift.frustumCulled=false;group.add(leafDrift);
 return {water,cascade,uniforms,refreshReflection:river.refreshReflection,update(time,opts,train){uniforms.uRain.value=opts.rain;puddleMat.opacity=shared.wetness.value*.58;uniforms.uWarm.value=opts.warm;uniforms.uTrain.value.copy(train.focus);uniforms.uTrainDirection.value.copy(world.curve.getTangentAt(train.progress));rain.visible=opts.rain>.01;fm.uniforms.uNight.value=shared.night.value;},};
}
export function createSky(){
 const skyScene=new THREE.Scene(),camera=new THREE.Camera();let geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute([-1,-1,0,3,-1,0,-1,3,0],3));
 let uniforms={uTime:{value:0},uNight:{value:0},uRain:{value:0},uTop:{value:new THREE.Color('#9daeb3')},uBottom:{value:new THREE.Color('#e7dcc3')}};
 let mat=new THREE.ShaderMaterial({uniforms,vertexShader:`varying vec2 vUv;void main(){vUv=position.xy*.5+.5;gl_Position=vec4(position,1.);}`,fragmentShader:`varying vec2 vUv;uniform float uTime;uniform float uNight;uniform float uRain;uniform vec3 uTop;uniform vec3 uBottom;float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}void main(){vec3 col=mix(uBottom,uTop,smoothstep(0.,1.,vUv.y));float c=sin(vUv.x*7.+uTime*.008+sin(vUv.y*11.))*sin(vUv.y*15.-vUv.x*6.+uTime*.005);col+=c*.017*(1.-uNight*.8);vec2 grid=floor(vUv*vec2(560.,340.));vec2 st=fract(vUv*vec2(560.,340.))-.5;float star=step(.996,hash(grid))*exp(-dot(st,st)*42.)*(.65+.35*sin(uTime*.5+hash(grid)*40.));col+=vec3(.6,.7,.85)*star*uNight*(1.-uRain)*smoothstep(.3,.8,vUv.y);float vignette=1.-dot(vUv-.5,vUv-.5)*.20;gl_FragColor=vec4(col*vignette,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`,depthTest:false,depthWrite:false});skyScene.add(new THREE.Mesh(geo,mat));return {scene:skyScene,camera,uniforms};
}
