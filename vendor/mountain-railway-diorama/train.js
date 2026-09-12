import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const UP = new THREE.Vector3(0, 1, 0);
const clamp = THREE.MathUtils.clamp;
const mod = (x, n) => ((x % n) + n) % n;

// Every visible component is made from profiles, rings, or purpose-built surfaces.
function roundedPath(w, h, r, steps = 4) {
  const p = [];
  for (const [cx, cy, a] of [[w/2-r,h/2-r,0],[-w/2+r,h/2-r,Math.PI/2],[-w/2+r,-h/2+r,Math.PI],[w/2-r,-h/2+r,Math.PI*1.5]]) {
    for(let i=0;i<=steps;i++) {
      const t=a+i/steps*Math.PI/2;
      p.push(new THREE.Vector2(cx+Math.cos(t)*r,cy+Math.sin(t)*r));
    }
  }
  return p;
}
function extrusion(points, depth, bevel = .02) {
  const sh = new THREE.Shape(points);
  const g = new THREE.ExtrudeGeometry(sh, {depth,steps:1,bevelEnabled:bevel>0,bevelSegments:2,bevelSize:bevel,bevelThickness:bevel,curveSegments:4});
  g.translate(0,0,-depth/2);
  return g;
}
function slab(w,h,d,r=.035,bevel=.012) { return extrusion(roundedPath(w,h,Math.min(r,w*.48,h*.48)),d,bevel); }
function sheet(points) {
  // Glazing has one optical surface; closed transparent slabs draw the same pane twice.
  return new THREE.ShapeGeometry(new THREE.Shape(points));
}
function ring(w,h,border,depth,r=.05) {
  const shape = new THREE.Shape(roundedPath(w,h,r));
  const inner = new THREE.Path(roundedPath(w-2*border,h-2*border,Math.max(.01,r-border)).reverse());
  shape.holes.push(inner);
  const g = new THREE.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:true,bevelSize:.006,bevelThickness:.006,bevelSegments:1});
  g.translate(0,0,-depth/2); return g;
}
function skin(profile, sections, shouldSkip) {
  const p=[],idx=[];const n=profile.length;
  sections.forEach(s=>profile.forEach(([x,y])=>p.push(x*s.w,y*s.h+s.y,s.z)));
  for(let j=0;j<sections.length-1;j++)for(let i=0;i<n;i++) {
    const k=(i+1)%n;
    if(shouldSkip?.(profile[i],profile[k],(sections[j].z+sections[j+1].z)/2))continue;
    const a=j*n+i,b=j*n+k,c=(j+1)*n+k,d=(j+1)*n+i;
    idx.push(a,b,d,b,c,d);
  }
  // A folded roof is concave: a centre fan would overlap coplanar triangles.
  const caps=THREE.ShapeUtils.triangulateShape(profile.map(([x,y])=>new THREE.Vector2(x,y)),[]);
  for(const j of [0,sections.length-1])for(const [a,b,c] of caps) {
    const offset=j*n;
    j===0?idx.push(offset+c,offset+b,offset+a):idx.push(offset+a,offset+b,offset+c);
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();return g;
}
function sweep(points, radii, sides=8) {
  const p=[],idx=[];
  points.forEach((pt,i)=>{
    const prev=points[Math.max(0,i-1)],next=points[Math.min(points.length-1,i+1)];
    const dir=new THREE.Vector3().subVectors(next,prev).normalize();
    const axis=Math.abs(dir.y)>.9?new THREE.Vector3(1,0,0):UP;
    const u=new THREE.Vector3().crossVectors(dir,axis).normalize(),v=new THREE.Vector3().crossVectors(dir,u).normalize();
    for(let k=0;k<sides;k++){const a=k/sides*Math.PI*2,r=Array.isArray(radii)?radii[i]:radii;p.push(pt.x+r*(u.x*Math.cos(a)+v.x*Math.sin(a)),pt.y+r*(u.y*Math.cos(a)+v.y*Math.sin(a)),pt.z+r*(u.z*Math.cos(a)+v.z*Math.sin(a)));}
  });
  for(let j=0;j<points.length-1;j++)for(let k=0;k<sides;k++){const a=j*sides+k,b=j*sides+(k+1)%sides,c=b+sides,d=a+sides;idx.push(a,b,d,b,c,d);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();return g;
}
function latheX(profile, sides=24) {
  const p=[],idx=[];
  profile.forEach(([x,r])=>{for(let k=0;k<sides;k++){const a=k/sides*Math.PI*2;p.push(x,r*Math.cos(a),r*Math.sin(a));}});
  for(let j=0;j<profile.length-1;j++)for(let k=0;k<sides;k++){const a=j*sides+k,b=j*sides+(k+1)%sides;idx.push(a,b,a+sides,b,b+sides,a+sides);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();return g;
}
function transform(g,x,y,z,rx=0,ry=0,rz=0) {
  g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new THREE.Vector3(1,1,1)));return g;
}
function batch() {const m=new Map();return {add(mat,g){if(!g.attributes.uv)g.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count*2),2));if(!m.has(mat))m.set(mat,[]);m.get(mat).push(g);},build(group){for(const[mat,gs]of m){const g=mergeGeometries(gs.map(g=>g.index?g.toNonIndexed():g),false);g.computeBoundingSphere();const mesh=new THREE.Mesh(g,mat);mesh.castShadow=!mat.transparent;mesh.receiveShadow=!mat.transparent;group.add(mesh);}}};}
function label(text,w=512,h=96) {
  const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');ctx.fillStyle='#172929';ctx.fillRect(0,0,w,h);ctx.fillStyle='#fff6cf';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`500 ${h*.65}px "Hiragino Kaku Gothic ProN",sans-serif`;ctx.fillText(text,w/2,h*.54);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;
}

export function createTrain(scene, route, shared) {
  const length=route.getLength();
  const material=(c,r=.6,m=0)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
  const cream=material('#e6ddbd',.48,.18);
  cream.onBeforeCompile=shader=>{
    shader.uniforms.uWet=shared.wetness;
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vTrainP;').replace('#include <begin_vertex>','#include <begin_vertex>\nvTrainP=position;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vTrainP; uniform float uWet;')
    .replace('#include <color_fragment>',`#include <color_fragment>
      float redBand = 1.0-smoothstep(1.47,1.495,vTrainP.y);
      redBand=max(redBand,(smoothstep(2.61,2.63,vTrainP.y)-smoothstep(2.685,2.70,vTrainP.y))*.9);
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.52,.095,.057),redBand);
      float grime=(1.-smoothstep(.55,1.1,vTrainP.y))*.14;
      float stripe=.5+.5*sin(vTrainP.z*42.0+sin(vTrainP.y*13.0));
      diffuseColor.rgb*=1.-grime-stripe*.016;
      diffuseColor.rgb*=1.-uWet*.065;`)
    .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor*=1.-uWet*.38;');
  };
  const vermilion=material('#af4b35',.43,.2), ivory=material('#e2dbc1',.5,.1),silver=material('#9caaa8',.31,.7),dark=material('#273332',.65,.28),rubber=material('#142423',.89),steel=material('#667a79',.37,.82),roof=material('#687978',.6,.5),roofDark=material('#394b4a',.8,.15),seat=material('#537870',.87),curtain=material('#c9b995',.9),floor=material('#5d5145',.87);
  const glass=new THREE.MeshPhysicalMaterial({color:'#1d3b41',metalness:.35,roughness:.11,transparent:true,opacity:.62,clearcoat:1,clearcoatRoughness:.09,side:THREE.DoubleSide,emissive:'#f3bf6c',emissiveIntensity:.05,depthWrite:false});
  glass.forceSinglePass=true;
  // A view-angle sheen keeps the body paint alive as the train changes heading:
  // a soft cool sky rim and a low warm grazing response, never a hard outline.
  const paintSheen=(mat,warm)=>{const prev=mat.onBeforeCompile;mat.onBeforeCompile=shader=>{
    prev?.(shader);
    shader.uniforms.uSunDir=shared.sunDir;shader.uniforms.uSunCol=shared.sunColor;shader.uniforms.uSunAmt=shared.sunAmt;
    shader.vertexShader=shader.vertexShader
      .replace('#include <common>','#include <common>\nvarying vec3 vPaintN;varying vec3 vPaintW;')
      .replace('#include <defaultnormal_vertex>','#include <defaultnormal_vertex>\nvPaintN=normalize(mat3(modelMatrix)*objectNormal);')
      .replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvPaintW=(modelMatrix*vec4(transformed,1.)).xyz;');
    shader.fragmentShader=shader.fragmentShader
      .replace('#include <common>','#include <common>\nvarying vec3 vPaintN;varying vec3 vPaintW;uniform vec3 uSunDir;uniform vec3 uSunCol;uniform float uSunAmt;')
      .replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
        float paintRim=pow(1.-max(dot(normalize(normal),normalize(vViewPosition)),0.),3.2);
        totalEmissiveRadiance+=vec3(.10,.13,.14)*paintRim*.35;
        vec3 paintEye=normalize(cameraPosition-vPaintW);
        float paintGraze=pow(max(dot(reflect(-paintEye,normalize(vPaintN)),uSunDir),0.),22.);
        totalEmissiveRadiance+=uSunCol*paintGraze*uSunAmt*${warm};`);
  };};
  const frontGlass=new THREE.MeshPhysicalMaterial({color:'#123840',metalness:.55,roughness:.09,clearcoat:1,emissive:'#6f908c',emissiveIntensity:.06});
  const headmat=new THREE.MeshStandardMaterial({color:'#fff5cb',emissive:'#fff1c1',emissiveIntensity:2.8,roughness:.2});
  const tailmat=new THREE.MeshStandardMaterial({color:'#b91f11',emissive:'#ff331a',emissiveIntensity:.55,roughness:.3});
  const dimlamp=material('#786d5e',.3,.35);
  const cabinmat=new THREE.MeshStandardMaterial({color:'#ffffd5',emissive:'#ffdb8e',emissiveIntensity:.8,roughness:.6});
  const destination=new THREE.MeshStandardMaterial({map:label('山里  YAMAZATO'),emissive:'#f2e3a5',emissiveIntensity:.35,roughness:.5});
  const idMaterial=new THREE.MeshBasicMaterial({map:label('キハ 28-104',512,80),transparent:false});
  paintSheen(cream,'.10');paintSheen(vermilion,'.08');
  const mats={cream,vermilion,ivory,silver,dark,rubber,steel,roof,roofDark,seat,curtain,floor,glass,frontGlass,headmat,tailmat,cabinmat};

  const profile=[[0,.53],[.69,.53],[.89,.6],[1.015,.76],[1.065,1.02],[1.065,1.49],[1.065,1.72],[1.065,2.52],[1.035,2.68],[.945,2.83],[.75,2.99],[.44,3.105],[0,3.155],[-.44,3.105],[-.75,2.99],[-.945,2.83],[-1.035,2.68],[-1.065,2.52],[-1.065,1.72],[-1.065,1.49],[-1.065,1.02],[-1.015,.76],[-.89,.6],[-.69,.53]];
  const winZ=[-1.8,-.6,.6,1.8],winW=.94;
  const stations=[-3.96,-3.9,-3.7,-3.4,-3.25,-2.4,...winZ.flatMap(z=>[z-winW/2,z+winW/2]),2.4,3.25,3.4,3.7,3.9,3.96].sort((a,b)=>a-b);
  const sections=stations.map(z=>{const a=Math.abs(z);return{z,w:a>3.9?.825:a>3.7?.91:a>3.4?.97:1,h:a>3.9?.963:a>3.7?.98:1,y:a>3.9?.034:0};});
  const bodyGeo=skin(profile,sections,(a,b,z)=>Math.abs(a[0])>1.06&&Math.abs(b[0])>1.06&&Math.min(a[1],b[1])>=1.72&&Math.max(a[1],b[1])<=2.52&&winZ.some(v=>Math.abs(z-v)<winW/2-.001));
  const cars=[],bogies=[],wheelGroups=[];
  function buildBogie() {
    const g=new THREE.Group(),b=batch();
    b.add(dark,transform(slab(1.53,.25,1.65,.11,.025),0,.39,0));
    for(const side of [-1,1]) {
      const sill=extrusion([new THREE.Vector2(-.9,-.06),new THREE.Vector2(-.77,.12),new THREE.Vector2(-.44,.14),new THREE.Vector2(-.22,.02),new THREE.Vector2(.24,.02),new THREE.Vector2(.45,.14),new THREE.Vector2(.78,.12),new THREE.Vector2(.9,-.06),new THREE.Vector2(.74,-.18),new THREE.Vector2(-.75,-.18)],.13,.035);
      b.add(dark,transform(sill,side*.84,.37,0,0,Math.PI/2,0));
      for(const z of [-.54,.54]) {
        // Turned steel wheel: inner flange, running surface, dished web and hub.
        const wheel=latheX([[-.12,.10],[-.12,.29],[-.09,.345],[-.075,.37],[-.035,.37],[-.025,.327],[.075,.327],[.105,.30],[.105,.22],[.057,.19],[.045,.10],[.13,.08]],28);
        b.add(steel,transform(wheel,side*.75,.327,z,0,side===-1?Math.PI:0));
        b.add(dark,transform(latheX([[-.07,.10],[.07,.10]],12),side*.91,.327,z));
        b.add(dark,transform(slab(.18,.17,.2,.06,.015),side*.94,.327,z));
        const coils=[];
        for(let j=0;j<=40;j++){const t=j/40;coils.push(new THREE.Vector3(side*.80+Math.cos(t*Math.PI*10)*.069,.5+t*.2,z+Math.sin(t*Math.PI*10)*.069));}
        b.add(steel,sweep(coils,.014,5));
      }
    }
    for(const z of [-.54,.54])b.add(dark,transform(latheX([[-.8,.065],[.8,.065]],12),0,.327,z));
    b.build(g);return g;
  }
  function buildCar(index) {
    const car=new THREE.Group();car.name=`Kiha regional railcar ${index+1}`;
    const b=batch();b.add(cream,bodyGeo.clone());
    // Underframe, tank, alternator, suspension and the unusually low centre of mass.
    b.add(dark,transform(slab(1.51,.22,7.12,.13,.02),0,.57,0));
    b.add(dark,transform(slab(.93,.36,2.1,.13,.035),-.08,.37,0));
    b.add(steel,transform(slab(.55,.30,.9,.07,.025),.51,.4,.5));
    for(const side of [-1,1]) {
      b.add(silver,transform(slab(6.87,.065,.045,.025,.006),side*1.023,.83,0,0,Math.PI/2));
      b.add(silver,transform(slab(6.48,.037,.04,.015,.004),side*1.068,1.515,0,0,Math.PI/2));
      for(const z of winZ) {
        b.add(rubber,transform(ring(winW+.115,.91,.036,.034,.095),side*1.073,2.12,z,0,Math.PI/2));
        b.add(silver,transform(ring(winW+.05,.849,.018,.027,.065),side*1.089,2.12,z,0,Math.PI/2));
        b.add(glass,transform(sheet(roundedPath(winW-.025,.787,.055)),side*1.073,2.12,z,0,Math.PI/2));
        b.add(silver,transform(slab(winW-.01,.025,.025,.005,.003),side*1.1,2.205,z,0,Math.PI/2));
        b.add(ivory,transform(slab(winW-.045,.04,.032,.008,.004),side*1.051,1.696,z,0,Math.PI/2));
        // Real seats are visible through holes in the body, behind the inset glass.
        b.add(seat,transform(slab(.98,.19,.42,.07,.03),side*.73,1.00,z,0,Math.PI/2));
        b.add(seat,transform(slab(.97,.57,.13,.085,.025),side*.88,1.29,z,0,Math.PI/2,side*.09));
        b.add(dark,transform(slab(.067,.38,.057,.016,.006),side*.65,.79,z-.35));
        if((index+Math.round(z*5))%3===0)b.add(curtain,transform(slab(.12,.7,.033,.025,.007),side*.996,2.13,z+.3,0,Math.PI/2));
      }
      for(const z of [-2.94,2.94]) {
        // Explicit outward clearances between the body, seal, door, glazing and trim.
        // The red lower finish is paint in the body shader, not a competing surface.
        b.add(rubber,transform(slab(.77,1.80,.012,.105,.006),side*1.081,1.61,z,0,Math.PI/2));
        b.add(cream,transform(slab(.704,1.738,.020,.08,.008),side*1.099,1.61,z,0,Math.PI/2));
        b.add(rubber,transform(ring(.493,.718,.024,.012,.075),side*1.126,2.026,z,0,Math.PI/2));
        b.add(frontGlass,transform(sheet(roundedPath(.442,.669,.046)),side*1.130,2.026,z,0,side*Math.PI/2));
        b.add(silver,transform(slab(.048,.213,.045,.02,.006),side*1.16,1.55,z+.25,0,Math.PI/2));
        b.add(dark,transform(slab(.75,.045,.31,.025,.006),side*.98,.62,z,0,Math.PI/2));
        for(const dz of [-.09,0,.09])b.add(silver,transform(slab(.68,.013,.012,.003,0),side*1.06,.65,z+dz,0,Math.PI/2));
        const railX=side*1.16;
        for(const dz of [-.44,.44]) b.add(silver,sweep([new THREE.Vector3(railX-.045*side,1.31,z+dz),new THREE.Vector3(railX,1.36,z+dz),new THREE.Vector3(railX,1.83,z+dz),new THREE.Vector3(railX-.045*side,1.88,z+dz)],.018,6));
      }
      b.add(idMaterial,transform(slab(.55,.083,.003,.003,0),side*1.073,1.17,.21,0,Math.PI/2));
      for(const z of [-3.5,3.5]) {
        // A folded metal step beneath each cab access position.
        b.add(dark,transform(slab(.3,.055,.27,.025,.008),side*1.04,.54,z));
      }
    }
    b.add(floor,transform(slab(1.95,.07,6.82,.09,.02),0,.74,0));
    b.add(ivory,transform(slab(1.89,.035,6.6,.1,.006),0,2.77,0));
    for(const z of [-1.6,1.6])b.add(cabinmat,transform(slab(.1,.035,1.65,.035,.004),0,2.71,z));
    for(const z of [-2.26,0,2.26])b.add(silver,sweep([new THREE.Vector3(-.59,2.71,z),new THREE.Vector3(.59,2.71,z)],.017,6));
    // Separate raised metal roof, with rain gutter shadow gaps and pressed ribs.
    const roofProfile=[[-.97,2.76],[-.94,2.88],[-.73,3.04],[-.41,3.15],[0,3.19],[.41,3.15],[.73,3.04],[.94,2.88],[.97,2.76],[.94,2.79],[.70,2.99],[.4,3.10],[0,3.14],[-.4,3.10],[-.7,2.99],[-.94,2.79]];
    b.add(roof,skin(roofProfile,[{z:-3.72,w:.89,h:1,y:0},{z:-3.3,w:1,h:1,y:0},{z:3.3,w:1,h:1,y:0},{z:3.72,w:.89,h:1,y:0}]));
    for(const side of [-1,1])b.add(roofDark,sweep([new THREE.Vector3(side*.96,2.78,-3.59),new THREE.Vector3(side*.99,2.78,-3.2),new THREE.Vector3(side*.99,2.78,3.2),new THREE.Vector3(side*.96,2.78,3.59)],.026,6));
    for(const z of [-2.4,-.8,.8,2.4]) {
      const hood=skin([[-.34,0],[-.36,.09],[-.25,.22],[0,.26],[.25,.22],[.36,.09],[.34,0]],[{z:-.33,w:.8,h:1,y:0},{z:-.2,w:1,h:1,y:0},{z:.2,w:1,h:1,y:0},{z:.33,w:.8,h:1,y:0}]);
      b.add(roofDark,transform(slab(.78,.05,.78,.10,.02),0,3.18,z));
      b.add(roof,transform(hood,0,3.2,z));
      for(const side of[-1,1])for(let j=0;j<5;j++)b.add(dark,transform(slab(.022,.07,.027,.004,0),side*.343,3.275,z-.16+j*.08));
    }
    b.add(roofDark,transform(slab(.25,.2,.6,.08,.03),.2,3.3,-3.08));
    b.add(steel,sweep([new THREE.Vector3(.20,3.36,-3.06),new THREE.Vector3(.2,3.74,-3.06)],.014,6));
    for(const end of [-1,1]) {
      const z=end*3.98;
      // Recessed paired windshields follow the subtly narrowing cab fascia.
      for(const side of[-1,1]) {
        const pts=[new THREE.Vector2(-.363,-.34),new THREE.Vector2(.363,-.34),new THREE.Vector2(.349,.23),new THREE.Vector2(.26,.335),new THREE.Vector2(-.32,.335),new THREE.Vector2(-.363,.27)];
        b.add(rubber,transform(extrusion(pts,.035,.024),side*.426,2.128,z,0,end===1?0:Math.PI));
        const gp=pts.map(p=>new THREE.Vector2(p.x*.904,p.y*.903));
        b.add(frontGlass,transform(sheet(gp),side*.426,2.128,z+end*.055,0,end===1?0:Math.PI));
        b.add(silver,sweep([new THREE.Vector3(side*.68,1.816,z+end*.075),new THREE.Vector3(side*.49,1.871,z+end*.080),new THREE.Vector3(side*.20,2.013,z+end*.085)],.012,5));
        b.add(dark,transform(slab(.253,.208,.079,.078,.012),side*.629,1.239,z+end*.017));
        b.add(silver,transform(ring(.234,.187,.021,.034,.067),side*.629,1.239,z+end*.055));
        const isHead=index===0&&end===1;
        b.add(isHead?headmat:dimlamp,transform(slab(.186,.142,.009,.053,.006),side*.629,1.239,z+end*.076));
        const isTail=index===1&&end===-1;
        b.add(isTail?tailmat:dimlamp,transform(slab(.094,.073,.008,.03,.003),side*.63,1.025,z+end*.065));
        b.add(silver,sweep([new THREE.Vector3(side*.29,1.48,z+end*.031),new THREE.Vector3(side*.29,1.60,z+end*.083),new THREE.Vector3(side*.67,1.60,z+end*.083),new THREE.Vector3(side*.7,1.48,z+end*.031)],.018,6));
      }
      b.add(rubber,transform(slab(.90,.24,.035,.045,.01),0,2.699,z-end*.025));
      b.add(destination,transform(slab(.80,.165,.016,.017,.004),0,2.70,z+end*.001,0,end===1?0:Math.PI));
      b.add(vermilion,transform(slab(1.61,.15,.17,.065,.02),0,.749,z-end*.066));
      b.add(dark,transform(slab(1.09,.105,.07,.035,.01),0,.861,z+end*.014));
      // Coupler and pneumatic hoses have separate silhouettes below the apron.
      b.add(steel,transform(slab(.18,.17,.41,.045,.02),0,.531,z+end*.23));
      b.add(dark,transform(extrusion([new THREE.Vector2(-.15,-.11),new THREE.Vector2(.17,-.11),new THREE.Vector2(.17,.05),new THREE.Vector2(.09,.11),new THREE.Vector2(-.15,.06)],.15,.035),0,.53,z+end*.48));
      for(const side of[-1,1])b.add(rubber,sweep([new THREE.Vector3(side*.28,.75,z),new THREE.Vector3(side*.29,.48,z+end*.08),new THREE.Vector3(side*.18,.41,z+end*.21),new THREE.Vector3(side*.12,.49,z+end*.32)],.032,7));
    }
    b.build(car);
    const pair=[];for(const z of[-2.25,2.25]){const bg=buildBogie();bg.position.z=z;car.add(bg);pair.push(bg);}bogies.push(pair);
    const cabin=new THREE.PointLight('#ffcc8b',0,8.8,2);cabin.position.set(0,2.2,0);car.add(cabin);car.userData.cabin=cabin;
    scene.add(car);cars.push(car);return car;
  }
  buildCar(0);buildCar(1);

  const beams=[];
  const spotlights=[];
  function beamGeometry() {
    const p=[],uv=[],idx=[],segs=24;
    for(let j=0;j<=12;j++){const f=j/12,z=f*31,r=.063+f*2.1;for(let k=0;k<=segs;k++){const a=k/segs*Math.PI*2;p.push(Math.cos(a)*r,Math.sin(a)*r-f*1.3,z);uv.push(k/segs,f);}}
    for(let j=0;j<12;j++)for(let k=0;k<segs;k++){const a=j*(segs+1)+k,b=a+segs+1;idx.push(a,b,a+1,b,b+1,a+1);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
  }
  const beamMaterial=new THREE.ShaderMaterial({uniforms:{uStrength:{value:0},uTime:shared.time,uRain:{value:0}},vertexShader:`varying vec2 vUv;varying vec3 vWorld;varying vec3 vNormal;void main(){vUv=uv;vec4 world=modelMatrix*vec4(position,1.);vWorld=world.xyz;vNormal=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*world;}`,fragmentShader:`uniform float uStrength;uniform float uTime;uniform float uRain;varying vec2 vUv;varying vec3 vWorld;varying vec3 vNormal;void main(){float edge=pow(clamp(1.-abs(dot(normalize(cameraPosition-vWorld),normalize(vNormal))),0.,1.),1.5);float fade=pow(clamp(1.-vUv.y,0.,1.),2.2)*smoothstep(0.,.035,vUv.y);float haze=.84+.16*sin(vWorld.y*5.+vWorld.z*.19-uTime*.2);float alpha=uStrength*fade*edge*haze*(.008+uRain*.052+.022*exp(-abs(vWorld.x-(16.+6.2*sin(vWorld.z*.060)+1.7*sin(vWorld.z*.16)))*.14));gl_FragColor=vec4(.93,.92,.71,alpha);}`,transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});
  for(const side of[-1,1]) {
    const head=new THREE.SpotLight('#fff0d0',8,52,side===-1?.145:.21,.68,1.45);head.position.set(side*.629,1.239,4.07);head.target.position.set(side*.629,-.15,32);head.castShadow=side===-1;head.shadow.mapSize.set(1024,1024);head.shadow.camera.near=.5;head.shadow.camera.far=44;head.shadow.normalBias=.035;head.shadow.bias=-.00015;cars[0].add(head,head.target);spotlights.push(head);
    const beam=new THREE.Mesh(beamGeometry(),beamMaterial);beam.position.copy(head.position);beam.renderOrder=5;beam.frustumCulled=false;cars[0].add(beam);beams.push(beam);
  }
  const tailLight=new THREE.PointLight('#ff4226',0,3,2);tailLight.position.set(0,1.1,-4.1);cars[1].add(tailLight);
  const focus=new THREE.Vector3();
  let s=mod(shared.startU??((shared.stationU??.1)+.04),1)*length,v=3.1,dwell=0,journeyStatus='Mountain local';
  let stationS=(shared.stationU??.1)*length;while(stationS<s+1)stationS+=length;
  const posA=new THREE.Vector3(),posB=new THREE.Vector3(),middle=new THREE.Vector3(),tangent=new THREE.Vector3(),right=new THREE.Vector3(),normal=new THREE.Vector3(),basis=new THREE.Matrix4(),worldQ=new THREE.Quaternion(),invQ=new THREE.Quaternion();
  function sample(distance,out) {out.copy(route.getPointAt(mod(distance/length,1)));out.y+=.16;return out;}
  function placeCar(car,i) {
    const at=s-i*8.3;
    sample(at-2.25,posA);sample(at+2.25,posB);
    middle.copy(posA).add(posB).multiplyScalar(.5);tangent.copy(posB).sub(posA).normalize();right.crossVectors(UP,tangent).normalize();normal.crossVectors(tangent,right).normalize();basis.makeBasis(right,normal,tangent);worldQ.setFromRotationMatrix(basis);
    car.position.copy(middle);car.quaternion.copy(worldQ);invQ.copy(worldQ).invert();
    const coordinates=[at-2.25,at+2.25];
    bogies[i].forEach((bg,j)=>{sample(coordinates[j],middle);bg.position.copy(middle).sub(car.position).applyQuaternion(invQ);tangent.copy(route.getTangentAt(mod(coordinates[j]/length,1))).normalize();right.crossVectors(UP,tangent).normalize();normal.crossVectors(tangent,right).normalize();basis.makeBasis(right,normal,tangent);worldQ.setFromRotationMatrix(basis);bg.quaternion.copy(invQ).multiply(worldQ);});
  }
  function update(dt,time,opts={}) {
    dt=Math.min(dt,.1);
    if(!opts.paused){
      if(dwell>0){dwell-=dt;v=0;journeyStatus='Yamaai · station stop';if(dwell<=0){stationS+=length;journeyStatus='Departing Yamaai';}}
      else {
        const ahead=stationS-s;
        const a=route.getTangentAt(mod((s-4)/length,1)),b=route.getTangentAt(mod((s+4)/length,1));
        const angle=Math.acos(clamp(a.dot(b),-1,1));
        const cruise=4.6*(opts.speed??1)*clamp(1-angle*.95,.53,1);
        const braking=Math.sqrt(Math.max(0,2*.57*(ahead-.06)));
        const target=Math.min(cruise,braking);
        v+=clamp(target-v,-.68*dt,.34*dt);
        s+=Math.max(0,v)*dt;
        if(ahead<.12&&v<.32){s=stationS;v=0;dwell=6.2;journeyStatus='Yamaai · station stop';}
        else if(ahead<23)journeyStatus='Approaching Yamaai';
        else if(v<cruise*.65)journeyStatus='Departing Yamaai';
        else {const u=mod(s/length,1);const tunnel=shared.tunnelStart<shared.tunnelEnd?u>=shared.tunnelStart&&u<=shared.tunnelEnd:u>=shared.tunnelStart||u<=shared.tunnelEnd;journeyStatus=tunnel?'Through the mountain':'Mountain local';}
      }
    }
    cars.forEach(placeCar);
    focus.copy(cars[0].position);focus.y+=1.6;
    const night=opts.night??shared.night.value;
    glass.emissiveIntensity=.012+night*.40+(opts.rain??0)*.10;frontGlass.emissiveIntensity=.04+night*.045;
    headmat.emissiveIntensity=2.3+night*5;tailmat.emissiveIntensity=.35+night*5.5;cabinmat.emissiveIntensity=.25+night*1.4+(opts.rain??0)*.22;
    spotlights.forEach((light,i)=>{light.intensity=5+night*(i?70:185)+(opts.rain??0)*35;});
    cars.forEach(car=>car.userData.cabin.intensity=night*14.5);
    tailLight.intensity=night*3.2;
    beamMaterial.uniforms.uStrength.value=night;beamMaterial.uniforms.uRain.value=opts.rain??0;
  }
  update(0,0,{night:0,speed:1});
  return {update,focus,cars,spotlights,get status(){return journeyStatus;},get progress(){return mod(s/length,1);},get speed(){return v;}};
}
