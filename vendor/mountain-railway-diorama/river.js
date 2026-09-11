import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { V,rng,mesh,rockGeo,batch,surfaceMaterial } from './geometry.js';

// Water follows the terrain's actual waterline. Cross-channel subdivisions carry
// measured depth, so shallows fade into a gravel bed instead of ending in a ribbon.
export function createRiver(scene,parent,world,shared,environmentUniforms){
 const random=rng(8631),waterLevel=world.waterLevel;
 const obstacles=[];
 for(let i=0;i<16;i++){let z=-22+i*3.62+(random()-.5)*1.2;if(Math.abs(waterLevel(z+.1)-waterLevel(z-.1))>.10)z=9.0+i*.12;let x=world.riverX(z)+(random()-.5)*3.1,r=.30+random()*.43;obstacles.push(new THREE.Vector4(x,z,r,0));}
 const uniforms={...environmentUniforms,uReflection:{value:null},uReflectionMatrix:{value:new THREE.Matrix4()},uReflectionReady:{value:0},uObstacles:{value:obstacles},uSunDir:shared.sunDir??{value:V(-.7,.5,.5).normalize()},uSunCol:shared.sunColor??{value:new THREE.Color('#ffc080')},uSunAmt:shared.sunAmt??{value:.9},uMoonDir:{value:V(-.04,.20,-1).normalize()}};
 let pos=[],uv=[],depths=[],indices=[],rows=300,columns=22,wetRows=[];
 for(let i=0;i<=rows;i++){
   let z=-36+i/rows*76,center=world.riverX(z),level=waterLevel(z),centerBed=world.height(center,z),wet=centerBed<level-.035;wetRows.push(wet);
   const shore=sign=>{let inside=0,outside=.1;for(;outside<11;outside+=.15){if(world.height(center+outside*sign,z)>level+.008)break;inside=outside;}for(let k=0;k<9;k++){let mid=(inside+outside)/2;if(world.height(center+mid*sign,z)>level+.008)outside=mid;else inside=mid;}return center+outside*sign;};
   let left=shore(-1),right=shore(1);
   for(let j=0;j<=columns;j++){let u=j/columns,x=THREE.MathUtils.lerp(left,right,u),d=Math.max(0,level-world.height(x,z));pos.push(x,level,z);uv.push(u,z);depths.push(d);}
 }
 for(let i=0;i<rows;i++)if(wetRows[i]&&wetRows[i+1])for(let j=0;j<columns;j++){let a=i*(columns+1)+j,b=a+columns+1;indices.push(a,b,a+1,a+1,b,b+1);}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setAttribute('aDepth',new THREE.Float32BufferAttribute(depths,1));geometry.setIndex(indices);geometry.computeVertexNormals();
 const waterMat=new THREE.MeshPhysicalMaterial({color:'#24756b',roughness:.21,metalness:0,ior:1.333,clearcoat:1,clearcoatRoughness:.13,transparent:true,opacity:.82,depthWrite:true,side:THREE.FrontSide});
 const noiseGLSL=`
 float waterHash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
 float waterNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(waterHash(i),waterHash(i+vec2(1,0)),f.x),mix(waterHash(i+vec2(0,1)),waterHash(i+vec2(1,1)),f.x),f.y);}
 float riverNoise(vec2 p){return waterNoise(p)*.65+waterNoise(p*2.07+vec2(9.2,4.7))*.25+waterNoise(p*4.13)*.10;}
 `;
 waterMat.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,uniforms);
  shader.vertexShader=`uniform float uTime;attribute float aDepth;varying float vWaterDepth;varying vec3 vWaterWorld;varying vec3 vWaterGeomNormal;varying vec2 vWaterUV;varying vec4 vReflection;uniform mat4 uReflectionMatrix;\n`+shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   vWaterDepth=aDepth;vWaterUV=uv;vWaterGeomNormal=normalize(mat3(modelMatrix)*normal);float shoreFade=smoothstep(.025,.22,aDepth);
   transformed.y+=(sin(position.x*2.2+position.z*1.1-uTime*1.5)*.018+sin(position.z*2.8-position.x*.7-uTime*2.2)*.009)*shoreFade;
   vWaterWorld=(modelMatrix*vec4(transformed,1.)).xyz;vReflection=uReflectionMatrix*vec4(vWaterWorld,1.);
  `);
  shader.fragmentShader=`uniform float uTime;uniform float uRain;uniform float uNight;uniform float uWarm;uniform vec3 uTrain;uniform sampler2D uReflection;uniform float uReflectionReady;uniform vec4 uObstacles[16];uniform vec3 uSunDir;uniform vec3 uSunCol;uniform float uSunAmt;uniform vec3 uMoonDir;varying float vWaterDepth;varying vec3 vWaterWorld;varying vec3 vWaterGeomNormal;varying vec2 vWaterUV;varying vec4 vReflection;\n${noiseGLSL}\n`+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   vec2 current=vec2(vWaterUV.x*3.5+sin(vWaterWorld.z*.17)*.25,vWaterWorld.z*.28-uTime*.31);
   float broad=riverNoise(current);float detail=waterNoise(current*3.2+vec2(-uTime*.06,uTime*.04));
   float depth=clamp(vWaterDepth,0.,1.4);float shoreFade=smoothstep(.012,.17,depth);
   // Mineral-green shallows reveal the real gravel bed; deeper pools absorb light.
   vec3 shallow=vec3(.13,.235,.165),deep=vec3(.017,.10,.096);
   diffuseColor.rgb=mix(shallow,deep,smoothstep(.07,.72,depth));diffuseColor.rgb*=.90+broad*.16;
   // Gravel beds warm the thinnest edges; disturbed current runs a touch cooler.
   diffuseColor.rgb=mix(vec3(.175,.215,.145),diffuseColor.rgb,smoothstep(.004,.10,depth));
   diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.90,1.02,1.05),smoothstep(.6,.9,broad)*.22);
   float rockFoam=0.;
   for(int k=0;k<16;k++){vec2 rel=vWaterWorld.xz-uObstacles[k].xy;float radius=uObstacles[k].z;
     float ring=abs(length(rel/vec2(1.35,1.))-radius*1.12);float collar=(1.-smoothstep(.025,.11+fwidth(ring),ring))*smoothstep(.30,.68,broad+detail*.17)*(.3+.7*(1.-smoothstep(-radius*.4,radius*.7,rel.y)));
     float wakeWidth=rel.x/(radius*.72+.12);
     float wake=exp(-wakeWidth*wakeWidth)*exp(-max(0.,rel.y)/(radius*4.))*smoothstep(0.,radius,rel.y);
     rockFoam=max(rockFoam,collar*.27+wake*.19*smoothstep(.43,.76,broad));
   }
   float bankFoam=(1.-smoothstep(.05,.16,depth))*smoothstep(.012,.035,depth)*smoothstep(.57,.78,detail)*.27;
   float foam=clamp(rockFoam+bankFoam,0.,.42)*shoreFade;
   diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.56,.68,.61),foam);
   diffuseColor.a=shoreFade*mix(.24,.91,smoothstep(0.,.62,depth));
  `);
  shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
   float w1=vWaterWorld.x*2.2+vWaterWorld.z*1.1-uTime*1.5,w2=vWaterWorld.z*2.8-vWaterWorld.x*.7-uTime*2.2;
   float du=.052*cos(w1)-.022*cos(w2)+(broad-.5)*.12;
   float dv=.030*cos(w1)+.065*cos(w2)+(detail-.5)*.055;
   vec2 rainCell=floor(vWaterWorld.xz*1.2),rainLocal=fract(vWaterWorld.xz*1.2)-.5;float age=fract(uTime*1.3+waterHash(rainCell));float ringDistance=length(rainLocal)-age*.62;
   float rainRipple=sin(ringDistance*32.)*exp(-abs(ringDistance)*18.)*(1.-age)*uRain*.045;
   vec3 worldNormal=normalize(vWaterGeomNormal+vec3(-(du+rainRipple)*shoreFade,0.,-(dv+rainRipple)*shoreFade));normal=normalize(mat3(viewMatrix)*worldNormal);
  `);
  shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
   vec3 eye=normalize(cameraPosition-vWaterWorld);float fresnel=.055+.42*pow(1.-clamp(dot(eye,worldNormal),0.,1.),3.);
   vec2 reflectedUV=vReflection.xy/max(.001,vReflection.w);reflectedUV+=vec2(du,dv)*.024;
   float inReflection=step(.001,reflectedUV.x)*step(reflectedUV.x,.999)*step(.001,reflectedUV.y)*step(reflectedUV.y,.999);
   vec3 reflected=texture2D(uReflection,clamp(reflectedUV,vec2(.002),vec2(.998))).rgb;
   outgoingLight=mix(outgoingLight,reflected*(.83+detail*.12),fresnel*uReflectionReady*inReflection*shoreFade*(1.-smoothstep(-10.5,-8.,vWaterWorld.y))*smoothstep(.75,.95,vWaterGeomNormal.y));
   // Analytical elongated highlights: a warm sun path by day/evening and a
   // narrower cool moon path at night. They ride the moving micro-normals, so
   // the glints tremble with the current instead of sitting as static streaks.
   {
    vec3 sunH=normalize(eye+uSunDir);
    float glint=pow(max(dot(normalize(worldNormal*vec3(.55,1.,.88)),sunH),0.),120.);
    float sparkle=.5+.5*sin(uTime*2.1+vWaterWorld.x*6.3+vWaterWorld.z*4.7);
    outgoingLight+=uSunCol*glint*(.35+.65*sparkle)*uSunAmt*(1.-uNight*.9)*(1.-uRain*.65)*1.1*shoreFade;
    vec3 moonH=normalize(eye+uMoonDir);
    float moon=pow(max(dot(normalize(worldNormal*vec3(.30,1.,.93)),moonH),0.),170.);
    outgoingLight+=vec3(.60,.72,.92)*moon*uNight*(1.-uRain*.55)*.5*shoreFade;
   }
   #include <opaque_fragment>
  `);
 };
 const water=mesh(geometry,waterMat,parent,false);water.name='Bank-fitted river with depth and reflected landscape';water.renderOrder=1;
 // A submerged bed and half-submerged boulders give the fluid a visible volume.
 const pebbles=[],boulders=[];
 for(let i=0;i<320;i++){let z=-25+random()*65,x=world.riverX(z)+(random()-.5)*6.5,bed=world.height(x,z),level=waterLevel(z);if(bed>level-.08||Math.abs(waterLevel(z+.1)-waterLevel(z-.1))>.10)continue;let g=rockGeo(i+48),r=.10+random()*.21;g.scale(r*1.5,r*.55,r);g.rotateY(random()*6.3);g.translate(x,bed+.025,z);pebbles.push(g);}
 for(let i=0;i<obstacles.length;i++){let o=obstacles[i],g=rockGeo(i+827);g.scale(o.z*1.4,o.z*.78,o.z);g.rotateY(random()*6);g.translate(o.x,waterLevel(o.y)-o.z*.08,o.y);boulders.push(g);}
 batch(parent,pebbles,surfaceMaterial('#9b9f79',.8,shared,1),false);batch(parent,boulders,surfaceMaterial('#616e5b',.61,shared,1));
 // A folded lip follows the section edge; the waterfall narrows and breaks up as it falls.
 const fallP=[],fallUV=[],fallDepth=[],fallIdx=[];let fallRows=40,fallCols=12;
 for(let i=0;i<=fallRows;i++){let f=i/fallRows,z=40+f*1.2,y=waterLevel(40)-f*f*4.8,width=(1-f*.4)*(4.5+.30*Math.sin(f*7.));for(let j=0;j<=fallCols;j++){let u=j/fallCols;fallP.push(world.riverX(40)+(u-.5)*width,y+.018*Math.sin(u*17+f*8),z);fallUV.push(u,z+f*4);fallDepth.push(.4*Math.sin(u*Math.PI));if(i<fallRows&&j<fallCols){let a=i*(fallCols+1)+j,b=a+fallCols+1;fallIdx.push(a,b,a+1,a+1,b,b+1);}}}
 let fg=new THREE.BufferGeometry();fg.setAttribute('position',new THREE.Float32BufferAttribute(fallP,3));fg.setAttribute('uv',new THREE.Float32BufferAttribute(fallUV,2));fg.setAttribute('aDepth',new THREE.Float32BufferAttribute(fallDepth,1));fg.setIndex(fallIdx);fg.computeVertexNormals();const cascade=mesh(fg,waterMat,parent,false);cascade.name='Broken stream outfall';cascade.renderOrder=1;
 // Reflector is an invisible mathematical camera helper, never visible geometry.
 const helperGeometry=new THREE.BufferGeometry();helperGeometry.setAttribute('position',new THREE.Float32BufferAttribute([-1,-1,0,1,-1,0,0,1,0],3));
 const reflector=new Reflector(helperGeometry,{textureWidth:384,textureHeight:384,clipBias:.003,multisample:0});reflector.position.y=waterLevel(22);reflector.rotation.x=-Math.PI/2;reflector.updateMatrixWorld(true);
 const reflectionTarget=reflector.getRenderTarget();reflectionTarget.texture.type=THREE.HalfFloatType;uniforms.uReflection.value=reflectionTarget.texture;
 const inverseHelper=new THREE.Matrix4().copy(reflector.matrixWorld).invert();let lastReflection=-Infinity;
 return {water,cascade,uniforms,refreshReflection(renderer,camera,now,interacting=false){
   // A camera move must not bypass the reflection budget. Reprojection keeps the
   // previous capture attached to the river while the main view renders freely.
   if(now-lastReflection<(interacting?125:100))return false;
   const wasVisible=parent.visible;parent.visible=false;camera.updateMatrixWorld(true);
   try { reflector.onBeforeRender(renderer,scene,camera); }
   finally { parent.visible=wasVisible; }
   uniforms.uReflectionMatrix.value.copy(reflector.material.uniforms.textureMatrix.value).multiply(inverseHelper);uniforms.uReflectionReady.value=1;lastReflection=now;return true;
 },dispose(){reflector.dispose();waterMat.dispose();}};
}
