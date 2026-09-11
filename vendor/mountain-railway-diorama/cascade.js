import * as THREE from 'three';
import {V,rng,mesh,rockGeo,batch,surfaceMaterial,tube} from './geometry.js';

// The existing river remains the wet surface; these irregular moving sheets,
// impact plumes and lodged rock are authored around its three geological drops.
export function createCascade(parent,world,shared,uniforms){
  const group=new THREE.Group();group.name='Three-stage Kawasemi cascade';parent.add(group);
  const material=new THREE.MeshStandardMaterial({color:'#c1d8c6',roughness:.27,metalness:.07,transparent:true,opacity:.8,depthWrite:false,side:THREE.DoubleSide});
  material.onBeforeCompile=s=>{
    Object.assign(s.uniforms,uniforms);
    s.vertexShader='varying vec2 vFlowUV;varying float vEnergy;varying float vImpact;varying vec3 vCasWorld;attribute float aEnergy;attribute float aImpact;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvFlowUV=uv;vEnergy=aEnergy;vImpact=aImpact;vCasWorld=(modelMatrix*vec4(transformed,1.)).xyz;');
    s.fragmentShader=`uniform float uTime;uniform float uNight;uniform float uRain;uniform vec3 uSunDir;uniform vec3 uSunCol;uniform float uSunAmt;varying vec2 vFlowUV;varying float vEnergy;varying float vImpact;varying vec3 vCasWorld;
      float flowHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float flowNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(flowHash(i),flowHash(i+vec2(1,0)),f.x),mix(flowHash(i+vec2(0,1)),flowHash(i+vec2(1,1)),f.x),f.y);}
      `+s.fragmentShader;
    s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      vec2 flow=vec2(vFlowUV.x*15.,vFlowUV.y*2.4-uTime*(.7+vEnergy*.4));
      float n=flowNoise(flow*vec2(1.4,.55)),fine=flowNoise(flow*vec2(3.2,1.6)+vec2(0.,-uTime*.37));
      float strands=smoothstep(.38,.72,n*.7+fine*.3);float edge=1.-smoothstep(.65,.98,abs(vFlowUV.x*2.-1.)+(n-.5)*.22);
      float broken=smoothstep(.20,.61,n+fine*.15);diffuseColor.a=edge*(.12+strands*.60)*broken*mix(.48,1.,vEnergy);
      diffuseColor.rgb=mix(vec3(.12,.30,.25),vec3(.67,.81,.74),strands*.83+vEnergy*.10);
      // Aerated impact water: bright, opaque foam concentrated where the fall
      // decelerates against rock or pools, not spread across the whole sheet.
      float impactFoam=smoothstep(.30,.85,vImpact+n*.30+fine*.10);
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.83,.91,.86),impactFoam*.55);
      diffuseColor.a=max(diffuseColor.a,edge*impactFoam*(.30+.35*vImpact));
      // Smooth accelerating stretches stay glassier and darker by contrast.
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.09,.24,.21),(1.-broken)*(1.-vImpact)*.25);
    `);
    s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
      normal=normalize(normal+vec3((n-.5)*.14,(fine-.5)*.12,0.));
    `);
    s.fragmentShader=s.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
      // Occasional low sun or moonlight catches the fastest moving strands.
      vec3 casEye=normalize(cameraPosition-vCasWorld);
      vec3 casN=normalize(vec3((n-.5)*.5,1.,(fine-.5)*.4));
      float strandGlint=pow(max(dot(reflect(-casEye,casN),uSunDir),0.),26.)*strands;
      totalEmissiveRadiance+=uSunCol*strandGlint*uSunAmt*(1.-uRain*.5)*.16;
    `);
  };
  for(const [start,end,width] of [[-2.2,3.1,4.6],[4.0,8.9,4.4],[8.9,11.5,6.8],[11.5,17.2,4.8]]){
    const positions=[],uv=[],energy=[],impacts=[],indices=[],rows=100,cols=24;
    let distance=0,last=V(world.riverX(start),world.waterLevel(start),start);
    for(let i=0;i<=rows;i++){
      const z=THREE.MathUtils.lerp(start,end,i/rows),y=world.waterLevel(z),center=world.riverX(z),current=V(center,y,z);distance+=current.distanceTo(last);last.copy(current);
      const slope=Math.abs(world.waterLevel(z+.08)-world.waterLevel(z-.08))/.16,e=THREE.MathUtils.clamp(slope*.42,0,1);
      // Deceleration at the foot of a drop and the final outfall lip mark impact.
      const ahead=THREE.MathUtils.clamp(Math.abs(world.waterLevel(z+.30)-world.waterLevel(z+.14))/.16*.42,0,1);
      const impact=Math.max(THREE.MathUtils.clamp((e-ahead)*2.4,0,1),i>rows-5?(i-(rows-5))/5*.9:0);
      for(let j=0;j<=cols;j++){
        const u=j/cols,w=width*(.92+Math.sin(z*1.73)*.055),x=center+(u-.5)*w;
        positions.push(x,y+.082+Math.sin(u*17+z*4)*.008,z);uv.push(u,distance);energy.push(.36+e*.64);impacts.push(impact);
        if(i<rows&&j<cols){const a=i*(cols+1)+j,b=a+cols+1;indices.push(a,b,a+1,a+1,b,b+1);}
      }
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setAttribute('aEnergy',new THREE.Float32BufferAttribute(energy,1));g.setAttribute('aImpact',new THREE.Float32BufferAttribute(impacts,1));g.setIndex(indices);g.computeVertexNormals();
    const sheet=mesh(g,material,group,false);sheet.name='Broken accelerated cascade sheet';sheet.renderOrder=2;
  }
  const random=rng(9087),rocks=[],moss=[],branches=[];
  for(const [z,side,size] of [[2.8,-1,.8],[3.1,1,.7],[8.8,-1,1.1],[9.6,1,.65],[12.3,-1,.55],[13.2,1,.64],[16.8,-1,.72],[19.4,1,.5],[25.7,-1,.62]]){
    const x=world.riverX(z)+side*(1.8+size*.35),g=rockGeo(1300+Math.floor(z*10));g.scale(size*1.6,size*.74,size);g.rotateY(.28);g.translate(x,world.waterLevel(z)-size*.15,z);rocks.push(g);
    const cap=rockGeo(1700+Math.floor(z*10));cap.scale(size*1.02,size*.17,size*.68);cap.rotateY(.28);cap.translate(x,world.waterLevel(z)+size*.31,z);moss.push(cap);
  }
  batch(group,rocks,surfaceMaterial('#4e655c',.57,shared,1));batch(group,moss,surfaceMaterial('#586b36',.91,shared,1),false);
  for(const z of [10.9,27.2]){
    const x=world.riverX(z)-3.05,y=world.height(x,z)+.12;
    branches.push(tube([V(x-.7,y+.32,z-1.1),V(x+.2,y+.1,z),V(x+.8,y-.03,z+1.5),V(x+.98,y-.11,z+2.1)],[.19,.16,.13,.04],8));
    branches.push(tube([V(x+.2,y+.1,z),V(x-.38,y+.45,z+.55),V(x-.72,y+.49,z+.7)],[.085,.047,.011],7));
  }
  batch(group,branches,surfaceMaterial('#4b4b38',.88,shared),false);
  const sprayG=new THREE.BufferGeometry(),positions=[],seeds=[],sizes=[];
  for(let i=0;i<150;i++){const z=i<105?9.0:i<132?15.2:2.8;positions.push(world.riverX(z)+(random()-.5)*3.5,world.waterLevel(z)+.06,z+(random()-.5)*1.3);seeds.push(random()*100);sizes.push(.12+random()*.47);}
  sprayG.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));sprayG.setAttribute('aSeed',new THREE.Float32BufferAttribute(seeds,1));sprayG.setAttribute('aSize',new THREE.Float32BufferAttribute(sizes,1));
  const sprayM=new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,
    vertexShader:`uniform float uTime,uWind;attribute float aSeed,aSize;varying float vAlpha;void main(){float t=fract(uTime*(.23+fract(aSeed)*.14)+aSeed);vec3 p=position;p.x+=sin(aSeed*1.2)*t*2.+t*uWind;p.y+=sin(t*3.14159)*(1.1+fract(aSeed*3.7)*1.7);p.z+=t*(.7+fract(aSeed)*1.4);vAlpha=sin(t*3.14159)*.22;vec4 mv=modelViewMatrix*vec4(p,1.);vAlpha*=step(.5,-mv.z);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(aSize*650./max(.1,-mv.z),2.,34.);}`,
    fragmentShader:`uniform float uNight;varying float vAlpha;void main(){vec2 p=gl_PointCoord-.5;float a=exp(-dot(p,p)*20.)*(1.-smoothstep(.34,.5,length(p)));gl_FragColor=vec4(mix(vec3(.60,.75,.69),vec3(.12,.24,.32),uNight),a*vAlpha);}`});
  const spray=new THREE.Points(sprayG,sprayM);spray.renderOrder=3;group.add(spray);
  return {group};
}
