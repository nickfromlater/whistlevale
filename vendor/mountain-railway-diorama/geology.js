import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Jointed greywacke: a few deliberately placed buttresses carry the gorge wall.
// The closed, asymmetric rock volumes use the same geological strike throughout.
export function createGeology(scene, world, shared) {
  const group = new THREE.Group(); group.name = 'Fractured gorge and summit crags'; scene.add(group);
  let seed = 18374;
  const random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
  const batches = [[], [], [], []];
  const color = new THREE.Color();
  function rockMaterial(name, shade, roughness, moss = false) {
    const m = new THREE.MeshStandardMaterial({ color:shade,roughness,vertexColors:true,metalness:.015,flatShading:true });
    m.name=name;
    m.onBeforeCompile = s => {
      s.uniforms.uGeologyWet = shared.wetness;
      s.vertexShader = 'varying vec3 vGeology;\nvarying vec3 vRockNormal;\n' + s.vertexShader;
      s.vertexShader = s.vertexShader.replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvGeology = (modelMatrix * vec4(transformed,1.0)).xyz;\nvRockNormal = normalize(mat3(modelMatrix)*normal);');
      s.fragmentShader = `uniform float uGeologyWet;
varying vec3 vGeology;
varying vec3 vRockNormal;
float gHash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
float gNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(mix(gHash(i),gHash(i+vec3(1,0,0)),f.x),mix(gHash(i+vec3(0,1,0)),gHash(i+vec3(1,1,0)),f.x),f.y),mix(mix(gHash(i+vec3(0,0,1)),gHash(i+vec3(1,0,1)),f.x),mix(gHash(i+vec3(0,1,1)),gHash(i+vec3(1,1,1)),f.x),f.y),f.z);}
` + s.fragmentShader;
      s.fragmentShader = s.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
vec3 gp=vGeology;
float broad=gNoise(gp*.43),grain=mix(.5,gNoise(gp*15.0),1.-smoothstep(.5,2.,length(fwidth(gp*15.0)))),fault=gNoise(vec3(gp.x*.8,gp.y*.095,gp.z*.73));
float bed=gp.y*.78+gp.z*.135+gp.x*.043+(broad-.5)*.42;
float bedCell=floor(bed),bedPhase=fract(bed);
float seam=1.0-smoothstep(0.0,.032,abs(bedPhase-(.18+.24*gHash(vec3(bedCell,2.3,1.4)))));
seam*=smoothstep(.37,.69,gNoise(vec3(gp.x*.71,bedCell*.34,gp.z*.71)));
float mineral=smoothstep(.73,.87,gNoise(gp*2.1+vec3(2.0,0.0,1.0)));
// A second, broader geological rhythm keeps large faces from reading flat.
float mass=gNoise(gp*.16+vec3(4.7,1.3,2.9));
diffuseColor.rgb*=.92+.12*broad+.045*(grain-.5)-.14*seam;
diffuseColor.rgb*=.94+.09*(mass-.5)*2.;
diffuseColor.rgb+=mineral*.028;
// Gorge moisture: rock near the water reads cooler, darker and wetter.
float riverLine=16.+6.2*sin(gp.z*.060)+1.7*sin(gp.z*.16);
float riverDist=abs(gp.x-riverLine);
float riverDamp=(1.-smoothstep(2.6,8.,riverDist))*smoothstep(12.,8.,gp.y);
diffuseColor.rgb*=1.-riverDamp*(.14+uGeologyWet*.12);
diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.83,.94,1.05),riverDamp*.55);
// Moss settles into sheltered, upward-facing ledges rather than open faces.
float mossUp=smoothstep(.55,.92,vRockNormal.y)*smoothstep(.34,.72,gNoise(gp*1.25+vec3(7.,2.,5.)));
diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.80,1.05,.70),mossUp*${moss?'.30':'.13'});
float damp=uGeologyWet*(.34+.42*(1.0-max(0.0,vRockNormal.y))+.19*fault);
diffuseColor.rgb*=1.0-damp*${moss?'.22':'.19'};
`);
      s.fragmentShader = s.fragmentShader.replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = max(.42,roughnessFactor-uGeologyWet*.24);');
    };
    m.customProgramCacheKey=()=>`fractured-geology-${moss?1:0}`;
    return m;
  }
  const materials = [
    rockMaterial('pale exposed greywacke','#989b8c',.93),
    rockMaterial('weathered slate cleavage','#67726a',.97),
    rockMaterial('moss on protected ledges','#687746',1,true),
    rockMaterial('warm mineral fractures','#a6a18e',.91)
  ];
  function triangle(a,b,c,bucket,shade=1){
    const g=new THREE.BufferGeometry();const p=[...a,...b,...c];
    g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.computeVertexNormals();
    color.setRGB(shade,shade*(.985+random()*.025),shade*(.96+random()*.035));
    const col=[];for(let i=0;i<3;i++)col.push(color.r,color.g,color.b);
    g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));batches[bucket].push(g);
  }
  const baseOutline=[[-1.00,-.79],[-.50,-1.01],[.46,-.95],[.96,-.41],[1.00,.22],[.68,.91],[-.48,1.04],[-1.08,.56]];
  // Ring offsets are fractured bedding planes, not rotationally symmetric scales.
  function wedge({x,z,width,depth,top,base,angle=.18,peak=false,phase=0}){
    const rings=[],levels=peak?[0,.26,.33,.59,.66,1]:[0,.18,.23,.43,.47,.67,.73,.90,1];
    const jut=peak?[1,1.02,.86,.83,.69,.22]:[1,1.01,1.12,.85,.98,.68,.81,.57,.32];
    const sin=Math.sin(angle),cos=Math.cos(angle),chips=baseOutline.map(()=>random()*.14-.07);
    const topChips=baseOutline.map((_,j)=>peak?(j===3?.82:(random()-.5)*.94):(.3+random()*.6));
    for(let r=0;r<levels.length;r++){
      const t=levels[r],ring=[];
      for(let j=0;j<baseOutline.length;j++){
        const outline=baseOutline[j],front=outline[0]>0;
        let u=outline[0]*depth*.5;
        // Faces recede uphill, with fresh steps where bedding fractures outward.
        u+=front?(jut[r]-1)*depth*.72:-t*depth*.16;
        u+=chips[j]*depth*(.7+.3*Math.sin(r+phase));
        const v=outline[1]*width*.5*(1-t*.09)+(Math.sin(phase+r*.81)*.055*width);
        const yy=THREE.MathUtils.lerp(base,top,t)+v*.115-u*.025+(r===levels.length-1?topChips[j]:Math.sin(j*2.3+r+phase)*.10);
        ring.push([x+u*cos+v*sin,yy,z-u*sin+v*cos]);
      }
      rings.push(ring);
    }
    for(let r=0;r<rings.length-1;r++)for(let j=0;j<baseOutline.length;j++){
      const k=(j+1)%baseOutline.length,a=rings[r][j],b=rings[r][k],c=rings[r+1][j],d=rings[r+1][k];
      const ab=new THREE.Vector3(...c).sub(new THREE.Vector3(...a)),ac=new THREE.Vector3(...b).sub(new THREE.Vector3(...a)),normal=ab.cross(ac).normalize();
      let bucket=normal.x>.43?0:1;
      if((j===2||j===3)&&r%3===1)bucket=3;
      if(normal.y>.6&&r>1&&random()<.55)bucket=2;
      const shade=.84+random()*.16+(j===2?.06:0);
      triangle(a,c,b,bucket,shade);triangle(b,c,d,bucket,shade);
    }
    const bottom=rings[0],crest=rings.at(-1),bc=[0,0,0],tc=[0,0,0];
    for(let j=0;j<bottom.length;j++)for(let k=0;k<3;k++){bc[k]+=bottom[j][k]/bottom.length;tc[k]+=crest[j][k]/crest.length;}
    // An uneven split crest breaks the upper silhouette, with sparse moss pockets.
    tc[1]+=.13;
    for(let j=0;j<bottom.length;j++){
      const k=(j+1)%bottom.length;triangle(bc,bottom[j],bottom[k],1,.86);
      triangle(tc,crest[k],crest[j],peak?(j%3===0?2:0):(j%3===0?0:2),.92+random()*.08);
    }
  }
  const buttresses=[
    {z:-20.7,width:4.3,depth:4.1,angle:.24,phase:1.2},
    {z:-16.1,width:4.8,depth:4.7,angle:.14,phase:2.7},
    {z:-11.3,width:4.9,depth:4.5,angle:.29,phase:4.4},
    {z:-6.8,width:4.2,depth:4.2,angle:.23,phase:5.1},
    {z:-2.9,width:3.4,depth:3.6,angle:.13,phase:6.5}
  ];
  for(const b of buttresses){
    const x=world.riverX(b.z)-6.8;
    const shoulder=world.height(world.riverX(b.z)-8.4,b.z);
    if(shoulder<15||world.railDistance(x,b.z)<5)continue;
    const foot=world.height(world.riverX(b.z)-4.35,b.z)-.65;
    wedge({...b,x,top:shoulder-.3,base:Math.max(world.waterLevel(b.z)-.35,foot)});
    // Narrow split flakes expose a different plane at selected vertical joints.
    if(b.phase<6){
      const sx=x+.43,sz=b.z+b.width*.37;
      wedge({x:sx,z:sz,width:.84,depth:1.65,base:world.height(sx+.78,sz)-.9,top:shoulder-2.25,angle:b.angle-.24,phase:b.phase+.6,peak:true});
    }
  }
  // Three distinct summit blades share the same strike as the valley rock.
  for(const p of [{x:-9.2,z:-16.2,width:3.45,depth:3.7,rise:3.6,angle:.27},{x:-6.25,z:-14.8,width:2.8,depth:3.05,rise:4.5,angle:.34},{x:-4.3,z:-17.0,width:2.2,depth:2.6,rise:2.8,angle:.21}]){
    if(world.railDistance(p.x,p.z)<5)continue;
    const ground=world.height(p.x,p.z),around=baseOutline.map(([u,v])=>world.height(p.x+u*p.depth*.6,p.z+v*p.width*.6));
    wedge({...p,base:Math.min(...around)-.9,top:ground+p.rise,phase:random()*4,peak:true});
  }
  // Tall jointed faces follow the gorge, with a clean engineered gap below
  // the existing bridge deck. No rock may enter the railway loading envelope.
  for(const z of [-.5,4.4,9.8,15.1,20.7,26.5,32.3])for(const side of [-1,1]){
    const x=world.riverX(z)+side*5.7;
    let top=world.height(world.riverX(z)+side*6.9,z)-.15;
    if(world.railDistance(x,z)<5.3)top=Math.min(top,world.railHeight(x,z)-3.2);
    const base=world.waterLevel(z)-1.15;
    if(top>base+1.5)wedge({x,z,width:5.4,depth:3.2,top,base,angle:side<0?.15:Math.PI+.15,phase:z*.3});
  }
  // Broken foot slabs remain on dry talus above the narrow river channel.
  for(const z of [-18.8,-14.2,-8.9,-5.1]){
    const x=world.riverX(z)-4.1,h=world.height(x,z);
    if(world.railDistance(x,z)>4.4)wedge({x,z,width:1.7,depth:1.35,base:h-1.2,top:h+.8,phase:z,angle:.19,peak:true});
  }
  let triangles=0;
  for(let i=0;i<batches.length;i++){
    if(!batches[i].length)continue;
    const geometry=mergeGeometries(batches[i],false);for(const g of batches[i])g.dispose();
    const mesh=new THREE.Mesh(geometry,materials[i]);mesh.castShadow=true;mesh.receiveShadow=true;mesh.name=materials[i].name;group.add(mesh);triangles+=geometry.attributes.position.count/3;
  }
  return {group,triangles};
}
