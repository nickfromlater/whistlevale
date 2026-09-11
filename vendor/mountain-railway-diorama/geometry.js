import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
export const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
export function rng(seed=742){return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
export function mesh(g,m,parent,cast=true){let o=new THREE.Mesh(g,m);o.castShadow=cast;o.receiveShadow=true;parent?.add(o);return o;}
export function shapeExtrude(points,depth,bevel=.02){let s=new THREE.Shape();points.forEach((p,i)=>i?s.lineTo(...p):s.moveTo(...p));s.closePath();let g=new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:bevel>0,bevelSegments:1,steps:1,bevelSize:bevel,bevelThickness:bevel,curveSegments:6});g.translate(0,0,-depth/2);return g;}
export function plank(w,h,d,b=.015){let x=w/2,y=h/2;return shapeExtrude([[-x+b,-y],[x-b,-y],[x,-y+b],[x,y-b],[x-b,y],[-x+b,y],[-x,y-b],[-x,-y+b]],d,b*.25);}
export function strut(a,b,w,d=w){let g=plank(w,a.distanceTo(b),d,Math.min(.015,w*.15));let mid=a.clone().add(b).multiplyScalar(.5),q=new THREE.Quaternion().setFromUnitVectors(V(0,1,0),b.clone().sub(a).normalize());g.applyQuaternion(q);g.translate(...mid.toArray());return g;}
export function tube(points,radii,sides=7){let p=[],idx=[],uv=[];for(let i=0;i<points.length;i++){let tangent=points[Math.min(i+1,points.length-1)].clone().sub(points[Math.max(i-1,0)]).normalize();let ref=Math.abs(tangent.y)>.95?V(1,0,0):V(0,1,0),u=ref.cross(tangent).normalize(),v=tangent.clone().cross(u).normalize();for(let j=0;j<sides;j++){let a=j/sides*Math.PI*2,r=Array.isArray(radii)?radii[i]:radii;let pt=points[i].clone().addScaledVector(u,Math.cos(a)*r).addScaledVector(v,Math.sin(a)*r);p.push(...pt.toArray());uv.push(j/sides,i/(points.length-1));if(i<points.length-1){let k=i*sides+j,l=i*sides+(j+1)%sides;idx.push(k,l,k+sides,l,l+sides,k+sides);}}}let g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;}
export function ribbon(points,widths){let p=[],uv=[],idx=[];for(let i=0;i<points.length;i++){let t=points[Math.min(i+1,points.length-1)].clone().sub(points[Math.max(0,i-1)]).normalize(),n=V(t.z,0,-t.x),w=Array.isArray(widths)?widths[i]:widths;for(let side of [-1,1]){let q=points[i].clone().addScaledVector(n,side*w/2);p.push(...q.toArray());uv.push((side+1)/2,i/(points.length-1));}if(i<points.length-1){let j=i*2;idx.push(j,j+2,j+1,j+1,j+2,j+3);}}let g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;}
export function batch(parent,geos,mat,cast=true){if(!geos.length)return;let list=geos.map(g=>{g.deleteAttribute('uv');return g.index?g.toNonIndexed():g;});let g=mergeGeometries(list,false);let o=mesh(g,mat,parent,cast);list.forEach(x=>x.dispose());return o;}
export function rockGeo(seed=1){let r=rng(seed),pos=[],idx=[],rings=6,sides=9;for(let i=0;i<rings;i++){let t=i/(rings-1),y=t*2-1,rad=Math.pow(Math.sin(t*Math.PI),.43)*(.8+r()*.2)+.08;for(let j=0;j<sides;j++){let a=j/sides*Math.PI*2+.10*Math.sin(i*2+j),rr=rad*(.82+r()*.27);pos.push(Math.cos(a)*rr+.14*y,y*.65+Math.sin(a*2+i)*.09,Math.sin(a)*rr);}}for(let i=0;i<rings-1;i++)for(let j=0;j<sides;j++){let a=i*sides+j,b=i*sides+(j+1)%sides;idx.push(a,a+sides,b,b,a+sides,b+sides);}let g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();return g;}
export function textTexture(text,sub='',bg='#eae6cf',fg='#243e3b'){let c=document.createElement('canvas');c.width=512;c.height=192;let x=c.getContext('2d');x.fillStyle=bg;x.fillRect(0,0,512,192);x.fillStyle=fg;x.fillRect(0,160,512,14);x.textAlign='center';x.font='bold 66px serif';x.fillText(text,256,91);x.font='24px sans-serif';x.fillText(sub,256,138);let t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
export function surfaceMaterial(color,roughness,shared,kind=0){let m=new THREE.MeshStandardMaterial({color,roughness,metalness:kind===2?.65:0});const glint=kind===2&&shared.sunDir;m.onBeforeCompile=s=>{s.uniforms.uWet=shared.wetness;s.uniforms.uTime=shared.time;if(glint){s.uniforms.uSunDir=shared.sunDir;s.uniforms.uSunCol=shared.sunColor;s.uniforms.uSunAmt=shared.sunAmt;}s.vertexShader='varying vec3 vWorld;\nvarying vec3 vNormalW;\n'+s.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvec4 surfacePosition=vec4(transformed,1.);\nvec3 surfaceNormal=normal;\n#ifdef USE_INSTANCING\nsurfacePosition=instanceMatrix*surfacePosition;surfaceNormal=mat3(instanceMatrix)*surfaceNormal;\n#endif\nvWorld=(modelMatrix*surfacePosition).xyz;vNormalW=normalize(mat3(modelMatrix)*surfaceNormal);');s.fragmentShader=`uniform float uWet; uniform float uTime; varying vec3 vWorld; varying vec3 vNormalW;\n${glint?'uniform vec3 uSunDir; uniform vec3 uSunCol; uniform float uSunAmt;\n':''}`+s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
float grain=sin(vWorld.x*37.+sin(vWorld.z*47.))*sin(vWorld.y*41.+vWorld.z*31.);grain*=1.-smoothstep(.35,1.7,max(fwidth(vWorld.x*37.),fwidth(vWorld.z*47.)));float stratum=sin(vWorld.y*7.+sin(vWorld.x*.42)+sin(vWorld.z*.38));
float mottled=sin(vWorld.x*.72+sin(vWorld.z*.41))*sin(vWorld.z*.91+vWorld.y*.7);
diffuseColor.rgb*=.93+grain*.04+mottled*.07${kind===1?'+stratum*.018':''}; diffuseColor.rgb*=1.-uWet*.20;
${kind===1?`{
// River corridor moisture: lower banks and nearby ground read cooler, darker,
// damper; sheltered upward faces carry a restrained moss preference.
float riverLine=16.+6.2*sin(vWorld.z*.060)+1.7*sin(vWorld.z*.16);
float riverDist=abs(vWorld.x-riverLine);
float dampBand=(1.-smoothstep(3.2,8.2,riverDist))*smoothstep(12.,8.6,vWorld.y);
diffuseColor.rgb*=1.-dampBand*(.11+uWet*.10);
diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.85,.96,1.04),dampBand*.55);
float shelterMoss=smoothstep(.62,.96,vNormalW.y)*(.5+.5*sin(vWorld.x*.53+vWorld.z*.71+1.3));
diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.88,1.05,.83),shelterMoss*.08);
}`:''}
`).replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nvec3 faceCross=cross(dFdx(vWorld),dFdy(vWorld));float upness=abs(faceCross.y)*inversesqrt(max(dot(faceCross,faceCross),1e-12));roughnessFactor=mix(roughnessFactor,max(.19,roughnessFactor*.44),uWet*clamp(upness,.25,.9));');
if(glint)s.fragmentShader=s.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
{
// Grazing-light glint: polished upward metal (rail heads, bridge edges,
// lantern iron) catches a thin directional highlight only at favourable angles.
vec3 glintN=normalize(vNormalW);
vec3 glintV=normalize(cameraPosition-vWorld);
vec3 glintR=reflect(-glintV,glintN);
float glintBase=max(dot(glintR,uSunDir),0.);
float thinGlint=pow(glintBase,72.)*smoothstep(.52,.92,glintN.y)*metalnessFactor;
float wetSheen=pow(glintBase,10.)*uWet*smoothstep(.3,.9,glintN.y)*metalnessFactor;
totalEmissiveRadiance+=uSunCol*uSunAmt*(thinGlint*(.14+.42*uWet)+wetSheen*.045);
}`);};m.customProgramCacheKey=()=>`surface-${kind}-${glint?1:0}`;return m;}
