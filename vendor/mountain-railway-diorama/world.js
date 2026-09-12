import * as THREE from 'three';
import {V,rng,mesh,plank,strut,tube,ribbon,batch,rockGeo,surfaceMaterial,shapeExtrude,textTexture} from './geometry.js';
const TAU=Math.PI*2, clamp=THREE.MathUtils.clamp, smooth=(a,b,x)=>THREE.MathUtils.smoothstep(x,a,b);
export function createWorld(scene,shared){
 const land=new THREE.Group();scene.add(land);land.name='Sculpted mountain section';
 const curve=new THREE.CatmullRomCurve3([V(-33,6,22),V(-17,6,25),V(-1,6.8,24),V(15,8,22),V(31,8.8,18),V(40,9,5),V(36,10,-12),V(23,11,-26),V(1,11,-31),V(-20,9,-26),V(-34,7.2,-12),V(-38,6,6)],true,'catmullrom',.34);curve.arcLengthDivisions=1800;curve.updateArcLengths();
 const samples=Array.from({length:680},(_,i)=>({p:curve.getPointAt(i/680),t:i/680}));
 function closest(x,z){let best=samples[0],d=1e9;for(let s of samples){let dd=(s.p.x-x)**2+(s.p.z-z)**2;if(dd<d){d=dd;best=s;}}return {d:Math.sqrt(d),p:best.p,t:best.t};}
 function uNear(x,z){return closest(x,z).t;}
 const stationU=uNear(-23,25),tunnelStart=uNear(40,3),tunnelEnd=uNear(1,-31),bridgeStart=uNear(5,23.5),bridgeEnd=uNear(30,18.5);
 Object.assign(shared,{stationU,tunnelStart,tunnelEnd,startU:bridgeStart+.038});
 const riverX=z=>16+6.2*Math.sin(z*.060)+1.7*Math.sin(z*.16);
 // Three bedrock steps connect the upper stream to the deep bridge gorge.
 const waterLevel=z=>10.08-.0035*z-2.35*smooth(-.3,2.4,z)-17.60*smooth(4.5,8.5,z)-1.20*smooth(11.8,14.8,z);
 function boundary(a){return 1+.065*Math.sin(a*3+.3)+.045*Math.cos(a*5-.5)+.025*Math.sin(a*8);}
 function inFootprint(x,z){let a=Math.atan2(z/43,x/56);return Math.hypot(x/56,z/43)<boundary(a);}
 function baseHeight(x,z){let mountain=32*Math.exp(-((x+8)**2/620+(z+13)**2/350))+19*Math.exp(-((x-27)**2/170+(z+17)**2/320))+12*Math.exp(-((x+37)**2/110+(z+6)**2/185));let ridge=6.1*Math.exp(-((x+12+Math.sin(z*.12)*10)**2/85+(z+21)**2/780));let ripples=(Math.sin(x*.48+z*.24)+Math.sin(z*.57-x*.2))*.42+Math.sin(x*.15-z*.31)*.72;let erosion=Math.abs(Math.sin(x*.21+z*.23+Math.sin(z*.19)))*1.3;const crest=3.7*Math.exp(-((x+7.4)**2/90+(z+16.7)**2/110))+4.1*Math.exp(-((x+21)**2/130+(z+19)**2/95));return 4.5+mountain+ridge+crest+ripples-erosion;}
 function height(x,z){let h=baseHeight(x,z);let bank=Math.abs(x-riverX(z));const gorge=smooth(-4,5,z)*(1-smooth(30,43,z));h=THREE.MathUtils.lerp(waterLevel(z)-.65+.13*Math.sin(z*.5),h,smooth(2.25+1.05*Math.exp(-Math.pow((z-10.1)/1.9,2)),7.8-gorge*1.6,bank));let c=closest(x,z),inTunnel=c.t>tunnelStart&&c.t<tunnelEnd,bridge=c.t>bridgeStart&&c.t<bridgeEnd;
 if(inTunnel){let along=Math.min((c.t-tunnelStart)*curve.getLength(),(tunnelEnd-c.t)*curve.getLength());let cap=c.p.y+5.7+Math.min(5.2,along*.30)-c.d*c.d*.047+(.42*Math.sin(c.p.x*.31+c.p.z*.23)+.24*Math.cos(c.p.z*.47))*smooth(0,5,along);h=Math.max(h,cap*(1-smooth(4,11,c.d)));}else if(!bridge){h=THREE.MathUtils.lerp(c.p.y-.34,h,smooth(2.05,5.4,c.d));}
 // Inhabited station terrace and approach, deliberately flattened.
 let stationMask=(1-smooth(10,16,Math.abs(x+22)))*(1-smooth(4.3,7.2,Math.abs(z-31)));h=THREE.MathUtils.lerp(h,5.98,stationMask);
 h=THREE.MathUtils.lerp(h,13.70,1-smooth(2.8,4.3,Math.hypot(x+43,z+12)));
 let edge=Math.hypot(x/56,z/43)/boundary(Math.atan2(z/43,x/56));h-=smooth(.90,1,edge)*.55;return h;}
 const world={curve,height,inFootprint,riverX,waterLevel,railHeight:(x,z)=>closest(x,z).p.y,railDistance:(x,z)=>closest(x,z).d,stationU,tunnelStart,tunnelEnd,bridgeStart,bridgeEnd,stationCenter:curve.getPointAt(stationU),shrineCenter:V(-37,height(-37,-7),-7)};
 // Polar terrain topology follows the irregular edge, with sculpted geological masses.
 let pos=[],cols=[],indices=[],R=112,A=216;let green=new THREE.Color('#636648'),rock=new THREE.Color('#72766a'),low=new THREE.Color('#96845b'),leafEarth=new THREE.Color('#9b7148'),dampMoss=new THREE.Color('#65734b');
 for(let i=0;i<=R;i++){let r=i/R;for(let j=0;j<A;j++){let a=j/A*TAU,rad=r*boundary(a),x=Math.cos(a)*56*rad,z=Math.sin(a)*43*rad,h=height(x,z);pos.push(x,h,z);let slope=Math.hypot(height(x+.45,z)-height(x-.45,z),height(x,z+.45)-height(x,z-.45));let c=low.clone().lerp(green,smooth(4,28,h));const grove=.5+.27*Math.sin(x*.105+z*.062)+.23*Math.cos(z*.13-x*.04);c.lerp(leafEarth,grove*.46*(1-smooth(22,32,h)));c.lerp(dampMoss,(1-smooth(3.8,8,Math.abs(x-riverX(z))))*.65);c.lerp(rock,smooth(.9,2.6,slope)*.86);c.multiplyScalar(.91+.09*Math.sin(x*.29+z*.7)+.05*Math.sin(x*.91-z*.34));cols.push(c.r,c.g,c.b);if(i<R){let n=i*A+j,b=i*A+(j+1)%A;indices.push(n,b,n+A,b,b+A,n+A);}}}
 // Excavate the two actual portal throats. A height field alone creates a curtain
 // between the approach cutting and mountain roof; clip that curtain against the
 // same horseshoe clearance as the masonry, retaining interpolated rock colour.
 const normalSource=new THREE.BufferGeometry();normalSource.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));normalSource.setIndex(indices);normalSource.computeVertexNormals();const terrainNormals=normalSource.attributes.normal.array;
 const throatCuts=[];
 for(const [u,dir] of [[tunnelStart,-1],[tunnelEnd,1]]){
  const center=curve.getPointAt(u),forward=curve.getTangentAt(u).multiplyScalar(dir);forward.y=0;forward.normalize();
  const right=V(forward.z,0,-forward.x),outline=[[-2.14,-.63],[2.14,-.63],[2.14,1.7]];
  for(let j=1;j<=24;j++){const a=j/24*Math.PI;outline.push([Math.cos(a)*2.14,1.7+Math.sin(a)*2.14]);}
  const planes=[];
  for(let j=0;j<outline.length;j++){
   const a=outline[j],b=outline[(j+1)%outline.length],dx=b[0]-a[0],dy=b[1]-a[1];
   planes.push(p=>-dy*((p[0]-center.x)*right.x+(p[2]-center.z)*right.z-a[0])+dx*(p[1]-center.y-a[1]));
  }
  planes.push(p=>2.7+(p[0]-center.x)*forward.x+(p[2]-center.z)*forward.z);
  planes.push(p=>2.7-(p[0]-center.x)*forward.x-(p[2]-center.z)*forward.z);
  throatCuts.push({center,planes});
 }
 function clipPolygon(poly,plane,inside){
  const out=[];
  for(let j=0;j<poly.length;j++){
   const a=poly[j],b=poly[(j+1)%poly.length],da=plane(a),db=plane(b),ia=inside?da>=0:da<=0,ib=inside?db>=0:db<=0;
   if(ia)out.push(a);
   if(ia!==ib){const f=da/(da-db);out.push(a.map((v,k)=>v+(b[k]-v)*f));}
  }
  return out;
 }
 let cutPositions=[],cutColors=[],cutNormals=[];
 function emitPolygon(poly){for(let j=1;j<poly.length-1;j++)for(const v of [poly[0],poly[j],poly[j+1]]){cutPositions.push(v[0],v[1],v[2]);cutColors.push(v[3],v[4],v[5]);const nl=Math.hypot(v[6],v[7],v[8])||1;cutNormals.push(v[6]/nl,v[7]/nl,v[8]/nl);}}
 for(let k=0;k<indices.length;k+=3){
  let polygons=[[0,1,2].map(j=>{const n=indices[k+j]*3;return [...pos.slice(n,n+3),...cols.slice(n,n+3),...terrainNormals.slice(n,n+3)];})];
  for(const cut of throatCuts){
   const next=[];
   for(const poly of polygons){
    if(poly.every(p=>p[0]<cut.center.x-5)||poly.every(p=>p[0]>cut.center.x+5)||poly.every(p=>p[2]<cut.center.z-5)||poly.every(p=>p[2]>cut.center.z+5)||poly.every(p=>p[1]>cut.center.y+3.86)||poly.every(p=>p[1]<cut.center.y-.64)){next.push(poly);continue;}
    let remaining=poly;
    for(const plane of cut.planes){const outside=clipPolygon(remaining,plane,false);if(outside.length>=3)next.push(outside);remaining=clipPolygon(remaining,plane,true);if(remaining.length<3)break;}
   }
   polygons=next;
  }
  for(const poly of polygons)emitPolygon(poly);
 }
 normalSource.dispose();
 let g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(cutPositions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(cutColors,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(cutNormals,3));let terrainMat=surfaceMaterial('#ffffff',.94,shared,1);terrainMat.vertexColors=true;mesh(g,terrainMat,land);
 // Cutaway wall: offset fracture rings, visible beds of shale, oxidised earth, and roots.
 let wallPos=[],wallColors=[],wallIdx=[];let strata=['#414c44','#665a46','#4e5550','#757566','#4b514b','#3c4542'];let wallR=11;
 for(let k=0;k<=wallR;k++)for(let j=0;j<A;j++){let a=j/A*TAU,bd=boundary(a),top=height(Math.cos(a)*56*bd,Math.sin(a)*43*bd),f=k/wallR;let rr=bd*(1-.025*Math.sin(f*Math.PI)+.012*Math.sin(a*17+Math.floor(k/2))*(Math.sin(f*Math.PI)));let x=Math.cos(a)*56*rr,z=Math.sin(a)*43*rr,y=THREE.MathUtils.lerp(top,-17.8,f)+Math.sin(a*15+k)*.11*Math.sin(f*Math.PI);wallPos.push(x,y,z);let c=new THREE.Color(strata[Math.min(5,Math.floor(f*6))]);c.multiplyScalar(.88+.12*Math.sin(a*13+k*.7));wallColors.push(c.r,c.g,c.b);if(k<wallR){let q=k*A+j,n=k*A+(j+1)%A;wallIdx.push(q,n,q+A,n,n+A,q+A);}}
 let wg=new THREE.BufferGeometry();wg.setAttribute('position',new THREE.Float32BufferAttribute(wallPos,3));wg.setAttribute('color',new THREE.Float32BufferAttribute(wallColors,3));wg.setIndex(wallIdx);wg.computeVertexNormals();mesh(wg,terrainMat,land);
 const steel=surfaceMaterial('#595b51',.47,shared,2),rust=surfaceMaterial('#784932',.73,shared,2),concrete=surfaceMaterial('#9b9a83',.9,shared,1),stone=surfaceMaterial('#686e60',.96,shared,1),timber=surfaceMaterial('#4b4636',.96,shared,1),ballastMat=surfaceMaterial('#7b7e6a',.94,shared,1),railMat=surfaceMaterial('#a2a69c',.27,shared,2);
 // Continuous track ribbons use an actual rail profile: base, web, and polished head.
 let railGeos=[],sleepers=[],ballasts=[],drains=[],guards=[],clips=[];
 let count=Math.round(curve.getLength()/.76),railProfile=[[-.095,-.05],[.095,-.05],[.095,-.02],[.029,.00],[.029,.095],[.068,.115],[.068,.16],[-.068,.16],[-.068,.115],[-.029,.095],[-.029,0],[-.095,-.02]];
 function sweptProfile(t1,t2,offset,profile,segments,closed=true){let p=[],idx=[];for(let i=0;i<=segments;i++){let u=t1+(t2-t1)*i/segments,pt=curve.getPointAt((u+1)%1),t=curve.getTangentAt((u+1)%1),n=V(t.z,0,-t.x);for(let [x,y] of profile)p.push(pt.x+n.x*(x+offset),pt.y+y,pt.z+n.z*(x+offset));if(i<segments)for(let j=0;j<profile.length-(closed?0:1);j++){let a=i*profile.length+j,b=i*profile.length+(j+1)%profile.length;idx.push(a,b,a+profile.length,b,b+profile.length,a+profile.length);}}let g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();return g;}
 for(let off of [-.75,.75])railGeos.push(sweptProfile(0,1,off,railProfile,1100));batch(land,railGeos,railMat);
 for(let i=0;i<count;i++){let u=i/count,p=curve.getPointAt(u),t=curve.getTangentAt(u),ang=Math.atan2(t.x,t.z),n=V(t.z,0,-t.x);let sl=plank(2.62,.16,.25,.025);sl.rotateY(ang);sl.translate(p.x,p.y-.14,p.z);sleepers.push(sl);for(let o of [-.75,.75]){let c=plank(.22,.035,.28,.006);c.rotateY(ang);c.translate(p.x+n.x*o,p.y-.025,p.z+n.z*o);clips.push(c);}}
 batch(land,sleepers,timber);batch(land,clips,steel);
 for(let k=0;k<600;k++){let t1=k/600,t2=(k+1)/600,u=(t1+t2)/2;if(u>bridgeStart&&u<bridgeEnd)continue;ballasts.push(sweptProfile(t1,t2,0,[[1.9,-.40],[1.34,-.14],[-1.34,-.14],[-1.9,-.40]],1));if(!(u>tunnelStart&&u<tunnelEnd))for(let o of [-2.03,2.03])drains.push(sweptProfile(t1,t2,o,[[-.17,-.30],[-.12,-.49],[.12,-.49],[.17,-.30]],1,false));}
 batch(land,ballasts,ballastMat);batch(land,drains,concrete);
 // Broken stone ballast on visible front sections creates granular shadow detail.
 let rand=rng(235),bgeo=rockGeo(82),bcount=2200,dummy=new THREE.Object3D();
 // Preserve every original close stone. Far ballast uses a closed fractured
 // wedge derived from that stone's irregular outline, in independently culled
 // rail sectors. No material or instance distribution changes at the boundary.
 const pebblePositions=[],pebbleIndices=[],sourcePebble=bgeo.attributes.position;
 const lowerCorners=[0,1,3,4,6,7];
 for(let j=0;j<6;j++){const k=2*9+lowerCorners[j];pebblePositions.push(sourcePebble.getX(k),-.39+Math.sin(j*2.1)*.055,sourcePebble.getZ(k));}
 for(let j=0;j<3;j++){const k=3*9+1+j*3;pebblePositions.push(sourcePebble.getX(k)*.76,.50+Math.sin(j*2.7+.2)*.10,sourcePebble.getZ(k)*.76);}
 for(let j=1;j<5;j++)pebbleIndices.push(0,j,j+1);
 pebbleIndices.push(6,8,7);
 for(let j=0;j<3;j++){const a=j*2,b=(a+1)%6,c=(a+2)%6,u=6+j,v=6+(j+1)%3;pebbleIndices.push(a,u,b,b,u,v,b,v,c);}
 const farPebble=new THREE.BufferGeometry();farPebble.setAttribute('position',new THREE.Float32BufferAttribute(pebblePositions,3));farPebble.setIndex(pebbleIndices);farPebble.computeVertexNormals();
 const sectorTransforms=Array.from({length:8},()=>[]),ballastLods=[];
 for(let i=0;i<bcount;i++){let u=rand();let p=curve.getPointAt(u),t=curve.getTangentAt(u),n=V(t.z,0,-t.x),o=(rand()-.5)*3.4;if(u>bridgeStart&&u<bridgeEnd)o=0;dummy.position.copy(p).addScaledVector(n,o);dummy.position.y-=.26;dummy.scale.set(.07+rand()*.08,.06+rand()*.04,.07+rand()*.08);dummy.rotation.set(rand(),rand()*6,rand());dummy.updateMatrix();sectorTransforms[Math.min(7,Math.floor(u*8))].push(dummy.matrix.clone());}
 for(let i=0;i<sectorTransforms.length;i++){
  const matrices=sectorTransforms[i];if(!matrices.length)continue;
  const closeMesh=new THREE.InstancedMesh(bgeo,ballastMat,matrices.length),farMesh=new THREE.InstancedMesh(farPebble,ballastMat,matrices.length);
  for(let j=0;j<matrices.length;j++){closeMesh.setMatrixAt(j,matrices[j]);farMesh.setMatrixAt(j,matrices[j]);}
  closeMesh.name=`detailed ballast sector ${i+1}`;farMesh.name=`distant ballast sector ${i+1}`;
  closeMesh.receiveShadow=true;farMesh.receiveShadow=false;closeMesh.castShadow=false;farMesh.castShadow=false;
  closeMesh.computeBoundingSphere();farMesh.computeBoundingSphere();closeMesh.visible=false;farMesh.visible=true;
  land.add(closeMesh,farMesh);ballastLods.push({closeMesh,farMesh,sphere:closeMesh.boundingSphere.clone(),near:false,count:matrices.length});
 }
 let ballastPrewarming=false;
 const ballastStats={nearCount:0,farCount:bcount,triangles:bcount*(pebbleIndices.length/3)};
 world.ballastLodStats=ballastStats;
 world.updateLOD=camera=>{
  if(ballastPrewarming)return;
  let closeCount=0;
  for(const sector of ballastLods){
   const distance=Math.max(0,camera.position.distanceTo(sector.sphere.center)-sector.sphere.radius);
   // Hysteresis prevents repeated swaps during subtle orbit/cinematic movement;
   // both thresholds keep the silhouette change far beyond inspection distance.
   if(sector.near?distance>72:distance<60)sector.near=!sector.near;
   sector.closeMesh.visible=sector.near;sector.farMesh.visible=!sector.near;
   if(sector.near)closeCount+=sector.count;
  }
  ballastStats.nearCount=closeCount;ballastStats.farCount=bcount-closeCount;ballastStats.triangles=closeCount*90+(bcount-closeCount)*(pebbleIndices.length/3);
 };
 world.prepareCompile=()=>{ballastPrewarming=true;for(const sector of ballastLods){sector.closeMesh.visible=true;sector.farMesh.visible=true;}};
 world.finishCompile=()=>{ballastPrewarming=false;for(const sector of ballastLods){sector.closeMesh.visible=sector.near;sector.farMesh.visible=!sector.near;}};
 // Signature ochre steel deck truss, with complete open bracing and tapered masonry piers.
 let bridge=new THREE.Group();land.add(bridge);bridge.name='Kawasemi gorge bridge';let girders=[],brace=[],deck=[],walk=[],pierGeos=[];let span=bridgeEnd-bridgeStart;let ip=[[-.18,0],[.18,0],[.18,.12],[.055,.12],[.055,1.36],[.18,1.36],[.18,1.48],[-.18,1.48],[-.18,1.36],[-.055,1.36],[-.055,.12],[-.18,.12]];
 for(let o of [-1.48,1.48])girders.push(sweptProfile(bridgeStart,bridgeEnd,o,ip.map(([x,y])=>[x,y-1.70]),150));
 const bridgePaint=surfaceMaterial('#a66636',.49,shared,2);
 for(let k=0;k<=14;k++){let u=bridgeStart+span*k/14,p=curve.getPointAt(u),tan=curve.getTangentAt(u),n=V(tan.z,0,-tan.x),left=p.clone().addScaledVector(n,-1.45),right=p.clone().addScaledVector(n,1.45);left.y-=1.55;right.y-=1.55;brace.push(strut(left,right,.15,.18));if(k<14){let next=curve.getPointAt(u+span/14),nt=curve.getTangentAt(u+span/14),nn=V(nt.z,0,-nt.x);for(let sign of [-1,1]){let a=p.clone().addScaledVector(n,sign*1.5),b=next.clone().addScaledVector(nn,sign*1.5);a.y-=1.58;b.y-=.25;brace.push(strut(a,b,.105,.11));a.y+=1.35;b.y-=1.35;brace.push(strut(a,b,.105,.11));}let b=next.clone().addScaledVector(nn,1.45);b.y-=1.55;brace.push(strut(left,b,.095));}}
 for(let k=0;k<85;k++){let u=bridgeStart+span*k/84,p=curve.getPointAt(u),t=curve.getTangentAt(u),n=V(t.z,0,-t.x);let a=p.clone().addScaledVector(n,1.85),b=p.clone().addScaledVector(n,2.5);a.y-=.08;b.y-=.08;walk.push(strut(a,b,.065,.23));if(k%5===0){let top=b.clone();top.y+=1.15;guards.push(strut(b,top,.055));}}
 for(let y of [.48,1.08])girders.push(sweptProfile(bridgeStart,bridgeEnd,2.48,[[-.03,y],[.03,y],[.03,y+.055],[-.03,y+.055]],130));
 for(let frac of [0,.48,1]){let u=bridgeStart+span*frac,p=curve.getPointAt(u),t=curve.getTangentAt(u);let top=p.y-1.7,base=Math.min(height(p.x,p.z)-.2,top-.75);for(let sign of [-1,1]){let n=V(t.z,0,-t.x),center=p.clone().addScaledVector(n,sign*.94);let poly=[[-.95,base],[.95,base],[.63,top-.35],[.75,top-.35],[.75,top],[-.75,top],[-.75,top-.35],[-.63,top-.35]];let pg=shapeExtrude(poly,1.45,.04);pg.rotateY(Math.atan2(t.x,t.z));pg.translate(center.x,0,center.z);pierGeos.push(pg);}}
 batch(bridge,girders,bridgePaint);batch(bridge,brace,bridgePaint);batch(bridge,walk,steel);batch(bridge,guards,steel);batch(bridge,pierGeos,concrete);
 // Horse-shoe tunnel bore is a continuous vault under an actual mountain cap.
 let borePos=[],boreIdx=[],S=140,J=28,boreProfile=[[2.13,-.46],[2.13,1.7]];
 for(let j=1;j<=J;j++){const a=j/J*Math.PI;boreProfile.push([Math.cos(a)*2.13,1.7+Math.sin(a)*2.13]);}boreProfile.push([-2.13,-.46]);
 for(let i=0;i<=S;i++){let u=tunnelStart+(tunnelEnd-tunnelStart)*i/S,p=curve.getPointAt(u),t=curve.getTangentAt(u),n=V(t.z,0,-t.x);n.normalize();for(let [x,y] of boreProfile)borePos.push(p.x+n.x*x,p.y+y,p.z+n.z*x);if(i<S)for(let j=0;j<boreProfile.length-1;j++){let a=i*boreProfile.length+j;boreIdx.push(a,a+boreProfile.length,a+1,a+1,a+boreProfile.length,a+boreProfile.length+1);}}
 let bg=new THREE.BufferGeometry();bg.setAttribute('position',new THREE.Float32BufferAttribute(borePos,3));bg.setIndex(boreIdx);bg.computeVertexNormals();let bm=surfaceMaterial('#353d38',.91,shared,1);bm.side=THREE.DoubleSide;mesh(bg,bm,land);
 let portals=[];for(let [u,dir] of [[tunnelStart,-1],[tunnelEnd,1]]){let p=curve.getPointAt(u),tan=curve.getTangentAt(u).multiplyScalar(dir),portal=new THREE.Group();portal.position.copy(p);portal.rotation.y=Math.atan2(tan.x,tan.z);land.add(portal);portals.push(p);let arch=new THREE.Shape();arch.moveTo(-3.16,-.5);arch.lineTo(-3.16,2);arch.absarc(0,2,3.16,Math.PI,0,true);arch.lineTo(3.16,-.5);arch.lineTo(2.1,-.5);arch.lineTo(2.1,1.7);arch.absarc(0,1.7,2.1,0,Math.PI,false);arch.lineTo(-2.1,-.5);arch.closePath();let ag=new THREE.ExtrudeGeometry(arch,{depth:.72,bevelEnabled:true,bevelSize:.05,bevelThickness:.05,bevelSegments:2,curveSegments:28});mesh(ag,concrete,portal);
 let voussoirs=[];for(let j=0;j<19;j++){let a=j/19*Math.PI+.015,b=(j+1)/19*Math.PI-.015;let pts=[[Math.cos(a)*2.12,1.7+Math.sin(a)*2.12],[Math.cos(a)*2.72,1.7+Math.sin(a)*2.72],[Math.cos(b)*2.72,1.7+Math.sin(b)*2.72],[Math.cos(b)*2.12,1.7+Math.sin(b)*2.12]];let gg=shapeExtrude(pts,.16,.008);gg.translate(0,0,.80);voussoirs.push(gg);}batch(portal,voussoirs,stone);
 let wings=[];for(let side of [-1,1])for(let row=0;row<5;row++)for(let k=0;k<5-row/2;k++){let gg=plank(.91,.48,.76,.032);gg.translate(side*(3.2+k*.92),row*.5-.13,-k*.23);wings.push(gg);}batch(portal,wings,stone);
 let plaque=mesh(plank(1.10,.42,.12,.025),concrete,portal);plaque.position.set(0,4.6,.80);
 let stains=[];for(let i=0;i<20;i++){let x=(rand()-.5)*5.8,y=2.5+rand()*2;if(Math.abs(x)<1.9&&y<3.9)continue;let gg=plank(.025+rand()*.07,.25+rand()*.7,.012,.003);gg.translate(x,y,.817);stains.push(gg);}batch(portal,stains,surfaceMaterial('#536455',.99,shared,1),false);
 }
 // Fractured outcrops arranged along geological strike and the cuttings.
 let rgeo=rockGeo(212),rockMat=surfaceMaterial('#858a77',.93,shared,1),out=[];rockMat.flatShading=true;for(let i=0;i<280;i++){let x=(rand()-.5)*109,z=(rand()-.5)*80;if(!inFootprint(x,z)||closest(x,z).d<3.4)continue;let bank=Math.abs(x-riverX(z));if(bank<3.5&&Math.abs(waterLevel(z+.1)-waterLevel(z-.1))>.10)continue;let h=height(x,z);if((h<13&&bank>6)&&rand()>.14)continue;let q=rgeo.clone(),s=bank<5?.3+rand()*.9:.6+rand()*2.9;q.scale(s*(1+rand()),s*.62,s*.72);q.rotateY(.5+rand()*.8);q.rotateZ(-.13);q.translate(x,h+.1,z);out.push(q);}batch(land,out,rockMat);
 // Small approach path, retaining terraces, utility poles and sagging communication lines.
 let pathPoints=[];for(let i=0;i<50;i++){let z=38-i*.55,x=-42+Math.sin(i*.07)*4;if(inFootprint(x,z))pathPoints.push(V(x,height(x,z)+.05,z));}mesh(ribbon(pathPoints,1.4),surfaceMaterial('#a49a7b',1,shared),land);
 let poles=[],wires=[],insulators=[];let polesPts=[];for(let u=.01;u<.99;u+=.068){if(u>tunnelStart-.03&&u<tunnelEnd+.03)continue;let p=curve.getPointAt(u),t=curve.getTangentAt(u),n=V(t.z,0,-t.x);p.addScaledVector(n,-3.55);p.y=height(p.x,p.z);if(p.y<3)p.y=curve.getPointAt(u).y-.3;let top=p.clone().add(V(.1,7.5,0));poles.push(tube([p,p.clone().add(V(.025,4,0)),top],[.105,.084,.069],7));poles.push(strut(top.clone().add(V(-.85,-.55,0)),top.clone().add(V(.85,-.55,0)),.09));polesPts.push(top);for(let x of [-.7,0,.7]){insulators.push(tube([top.clone().add(V(x,-.55,0)),top.clone().add(V(x,-.2,0))],[.07,.058],7));}}
 for(let i=0;i<polesPts.length-1;i++){let a=polesPts[i],b=polesPts[i+1];if(a.distanceTo(b)>29)continue;for(let o of [-.7,0,.7]){let pts=[];for(let j=0;j<=25;j++){let f=j/25,p=a.clone().lerp(b,f);p.x+=o;p.y-=.2+Math.sin(f*Math.PI)*1.6;pts.push(p);}wires.push(tube(pts,.014,4));}}
 batch(land,poles,surfaceMaterial('#665845',.91,shared));batch(land,wires,new THREE.MeshStandardMaterial({color:'#262f2a',roughness:.85}),false);batch(land,insulators,concrete);
 // Signal heads, cabinets and gradient signs establish railway scale.
 const signalLights=[];for(let u of [stationU+.058,bridgeEnd+.021,tunnelEnd+.025,.87]){let p=curve.getPointAt(u),t=curve.getTangentAt(u),n=V(t.z,0,-t.x),s=new THREE.Group();s.position.copy(p).addScaledVector(n,-2.6);s.rotation.y=Math.atan2(t.x,t.z);land.add(s);mesh(tube([V(0,-.2,0),V(.02,3.3,0)],[.06,.047],8),steel,s);let head=mesh(shapeExtrude([[-.22,0],[.22,0],[.26,.12],[.26,.88],[.14,1.02],[-.14,1.02],[-.26,.88],[-.26,.12]],.24,.025),steel,s);head.position.y=2.9;let lmat=new THREE.MeshStandardMaterial({color:'#94d788',emissive:'#56e471',emissiveIntensity:1.2});let lamp=mesh(shapeExtrude([[-.08,0],[.08,0],[.11,.05],[.11,.17],[.05,.22],[-.05,.22],[-.11,.17],[-.11,.05]],.025,.025),lmat,s);lamp.position.set(0,3.48,.145);signalLights.push(lmat);let cabinet=mesh(plank(.55,.85,.43,.045),concrete,s);cabinet.position.set(-.45,.38,0);}
 world.cascadeTarget=V(riverX(6.5),-4.8,6.5);world.gorgeTarget=V(riverX(20),-3.5,20);world.peakTarget=V(-7.4,height(-7.4,-16.7)+2,-16.7);world.portals=portals;world.bridgeTarget=curve.getPointAt((bridgeStart+bridgeEnd)/2);world.group=land;world.update=()=>{};
 return world;
}
