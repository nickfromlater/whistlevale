import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { V, tube, shapeExtrude, surfaceMaterial } from './geometry.js';

// Small rural utility lanterns mark inhabited paths, ridge turns and river views.
export function createLanterns(scene, world, shared) {
  const group=new THREE.Group();group.name='Mountain path lanterns';scene.add(group);
  const geos=[[],[],[],[]],lights=[],bulbs=[],sites=[];
  const iron=surfaceMaterial('#4c6057',.71,shared,2);
  iron.vertexColors=true;
  const bronze=surfaceMaterial('#9b805a',.65,shared,2);
  const granite=surfaceMaterial('#929789',.96,shared,0);
  const opal=new THREE.MeshStandardMaterial({color:'#f6e5be',emissive:'#ffc171',emissiveIntensity:.15,roughness:.42});
  const materials=[iron,bronze,granite,opal];
  const power=[58,53,67,57,64,62,69,58];
  const requested=[[-42,23],[-27,12],[-20,-13],[2,12],[world.riverX(25)+5,25],[36,11],[42,-10],[-14,-31]];
  let ironTint=[1,1,1];
  function chooseSite(x,z){
    let best=null,bestScore=Infinity;
    for(let ring=0;ring<=3;ring++)for(let j=0;j<(ring?12:1);j++){
      const a=j/12*Math.PI*2,px=x+Math.cos(a)*ring*1.45,pz=z+Math.sin(a)*ring*1.45;
      if(!world.inFootprint(px,pz)||world.railDistance(px,pz)<5.20||Math.abs(px-world.riverX(pz))<4.1||world.nearFarmhouse?.(px,pz,.9))continue;
      const h=world.height(px,pz),slope=Math.hypot(world.height(px+.5,pz)-world.height(px-.5,pz),world.height(px,pz+.5)-world.height(px,pz-.5));
      if(h<1.4)continue;
      const score=ring*.7+slope*.65;
      if(score<bestScore){bestScore=score;best={x:px,z:pz,h};}
    }
    return best;
  }
  function store(g,mat,origin,yaw=0){
    if(mat===0){const colors=[];for(let i=0;i<g.attributes.position.count;i++)colors.push(...ironTint);g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));}
    g.deleteAttribute('uv');g.rotateY(yaw);g.translate(origin.x,origin.y,origin.z);geos[mat].push(g);
  }
  function turned(profile,sides=10){
    const positions=[],indices=[];
    for(const [r,y] of profile)for(let j=0;j<sides;j++){const a=j/sides*Math.PI*2;positions.push(Math.cos(a)*r,y,Math.sin(a)*r);}
    for(let i=0;i<profile.length-1;i++)for(let j=0;j<sides;j++){const a=i*sides+j,b=i*sides+(j+1)%sides;indices.push(a,a+sides,b,b,a+sides,b+sides);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;
  }
  function stonePad(x,z,w=1.05,d=.98){
    const outline=[[-.53,-.30],[-.34,-.53],[.27,-.50],[.51,-.24],[.48,.36],[.14,.52],[-.35,.43],[-.55,.10]];
    const heights=outline.map(([u,v])=>world.height(x+u*w,z+v*d));
    const top=Math.max(...heights)+.055,positions=[],indices=[];
    for(let level=0;level<3;level++)for(let j=0;j<outline.length;j++){
      const [u,v]=outline[j],inset=level===2?.93:1;
      positions.push(x+u*w*inset,level===0?heights[j]-.13:top-(level===1?.045:0),z+v*d*inset);
    }
    for(let row=0;row<2;row++)for(let j=0;j<8;j++){const a=row*8+j,b=row*8+(j+1)%8;indices.push(a,a+8,b,b,a+8,b+8);}
    for(let j=1;j<7;j++)indices.push(16,16+j+1,16+j);
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();geos[2].push(g);return top;
  }
  function lanternGlass(){
    const outline=[[-.12,-.17],[.12,-.17],[.17,-.12],[.17,.12],[.12,.17],[-.12,.17],[-.17,.12],[-.17,-.12]];
    const profile=[[.77,-.25],[1,-.19],[1,.15],[.86,.235],[.7,.25]],positions=[],indices=[];
    for(const [scale,y]of profile)for(const[x,z]of outline)positions.push(x*scale,y,z*scale);
    for(let r=0;r<profile.length-1;r++)for(let j=0;j<8;j++){const a=r*8+j,b=r*8+(j+1)%8;indices.push(a,a+8,b,b,a+8,b+8);}
    for(let j=1;j<7;j++){indices.push(0,j,j+1,32,32+j+1,32+j);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;
  }
  function foldedShade(){
    const positions=[],indices=[],N=7;
    // Four gently curved folded surfaces have distinct triangular corner joins.
    for(let side=0;side<4;side++){
      const angle=side*Math.PI/2,cs=Math.cos(angle),sn=Math.sin(angle),start=positions.length/3;
      for(let r=0;r<=N;r++)for(let j=0;j<=4;j++){
        const u=r/N,v=j/4*2-1,width=.08+.35*u,x=v*width,z=.08+.35*u;
        const y=.25-.32*u+.105*u*u+.035*Math.pow(u,7)+.018*Math.abs(v);
        positions.push(x*cs+z*sn,y,-x*sn+z*cs);
      }
      for(let r=0;r<N;r++)for(let j=0;j<4;j++){const a=start+r*5+j;indices.push(a,a+5,a+1,a+1,a+5,a+6);}
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;
  }
  for(let i=0;i<requested.length;i++){
    const site=chooseSite(...requested[i]);if(!site)continue;
    const olderStyle=i%2===1;ironTint=olderStyle?[1.14,1.05,.87]:[.96,1.02,1.04];
    const top=stonePad(site.x,site.z),origin=V(site.x,top+.006,site.z);
    const yaw=[-.35,.7,1.15,-.42,2.54,-1.2,.83,2.91][i],height=3.62+(i%3)*.22,headY=height-.42,reach=olderStyle?.77:.65;
    // Individually bent shafts lean subtly, with a short overhanging crook.
    const shaft=[];
    for(let j=0;j<=14;j++){
      const f=j/14,y=f*(height-.43),x=.035*Math.sin(f*2.7+i*.37)*f;
      shaft.push(V(x,y,Math.sin(i*.83)*.025*f*f));
    }
    const radii=shaft.map((_,j)=>THREE.MathUtils.lerp(.072,.045,j/(shaft.length-1)));
    store(tube(shaft,radii,8),0,origin,yaw);
    store(turned([[0,0],[.15,0],[.185,.065],[.16,.15],[.108,.20],[.096,.61],[.078,.69],[.072,.72]],10),0,origin,yaw);
    store(turned([[.104,.21],[.109,.24],[.109,.28],[.104,.31]],10),1,origin,yaw);
    const neck=[shaft.at(-1),V(.02,height-.15,0),V(.20,height+.035,0),V(reach*.66,height+(olderStyle?.105:.04),0),V(reach-.02,height-.105,0),V(reach,height-.26,0)];
    const crook=new THREE.CatmullRomCurve3(neck,false,'centripetal');
    store(tube(crook.getPoints(28),.040,8),0,origin,yaw);
    // The curved brace and bolted collar are visible when inspecting a post.
    const brace=new THREE.CatmullRomCurve3([V(.025,height-.91,0),V(.23,height-.65,0),V(.51,height-.28,0)]);
    store(tube(brace.getPoints(14),.022,6),0,origin,yaw);
    if(olderStyle){
      const curl=[];for(let j=0;j<=23;j++){const f=j/23,a=-.25+f*Math.PI*1.72,r=.15-f*.105;curl.push(V(.235+Math.cos(a)*r,height-.65+Math.sin(a)*r,0));}
      store(tube(curl,.017,6),1,origin,yaw);
    }
    store(turned([[.072,height-1.02],[.085,height-.98],[.085,height-.88],[.072,height-.85]],10),1,origin,yaw);
    const headOrigin=origin.clone().add(V(reach,headY,0).applyAxisAngle(V(0,1,0),yaw));
    store(lanternGlass(),3,headOrigin,yaw);
    const shade=foldedShade();shade.translate(0,.19,0);store(shade,0,headOrigin,yaw);
    const underside=foldedShade();underside.translate(0,.169,0);const undersideIndices=underside.index.array;
    for(let j=0;j<undersideIndices.length;j+=3){const temp=undersideIndices[j];undersideIndices[j]=undersideIndices[j+1];undersideIndices[j+1]=temp;}underside.computeVertexNormals();store(underside,0,headOrigin,yaw);
    for(let j=0;j<4;j++){
      const a=j*Math.PI/2,pts=[V(-.43,.278,.43),V(0,.260,.43),V(.43,.278,.43)].map(p=>p.applyAxisAngle(V(0,1,0),a));
      store(tube(new THREE.CatmullRomCurve3(pts).getPoints(12),.014,6),olderStyle?1:0,headOrigin,yaw);
    }
    if(olderStyle){const smallCrown=foldedShade();smallCrown.scale(.40,.55,.40);smallCrown.translate(0,.385,0);store(smallCrown,0,headOrigin,yaw);}
    store(turned([[.07,.395],[.095,.42],[.065,.46],[.028,.49],[0,.51]],10),1,headOrigin,yaw);
    store(turned([[.11,-.29],[.19,-.26],[.20,-.23],[.16,-.20]],10),0,headOrigin,yaw);
    // Corner stiles frame the warm opal glass without hiding its lower surface.
    for(let j=0;j<4;j++){
      const a=Math.PI*.25+j*Math.PI*.5,x=Math.cos(a)*.225,z=Math.sin(a)*.225;
      store(tube([V(x*.84,-.24,z*.84),V(x,-.13,z),V(x,.14,z),V(x*.78,.25,z*.78)],.014,5),0,headOrigin,yaw);
    }
    // Maintenance hatch, raised maker's plate, and two visible fasteners.
    const hatch=shapeExtrude([[-.048,0],[.048,0],[.055,.04],[.048,.30],[-.048,.30],[-.055,.04]],.017,.007);hatch.translate(0,.83,.064);store(hatch,0,origin,yaw);
    const plate=shapeExtrude([[-.039,0],[.039,0],[.039,.10],[-.039,.10]],.011,.003);plate.translate(0,1.28,.064);store(plate,1,origin,yaw);
    for(const y of [.874,1.094])store(tube([V(0,y,.072),V(0,y,.086)],.010,6),1,origin,yaw);
    const cable=new THREE.CatmullRomCurve3([V(.071,height-.86,.035),V(.26,height-.48,.04),V(reach-.03,height-.25,.028)]);
    store(tube(cable.getPoints(17),.009,5),0,origin,yaw);
    const light=new THREE.PointLight('#ffd29a',0,12.8+(i%3)*.55,2);light.position.copy(headOrigin).add(V(0,-.12,0));light.castShadow=false;group.add(light);
    lights.push(light);bulbs.push(headOrigin);sites.push({...site,head:headOrigin,power:power[i]});
    // A short stepping stone beside the footing helps establish a human path.
    const step=V(.81,0,.22).applyAxisAngle(V(0,1,0),yaw);
    if(world.inFootprint(site.x+step.x,site.z+step.z))stonePad(site.x+step.x,site.z+step.z,.64,.53);
  }
  for(let i=0;i<geos.length;i++){
    if(!geos[i].length)continue;
    const list=geos[i].map(g=>{g.deleteAttribute('uv');return g.index?g.toNonIndexed():g;});
    const geometry=mergeGeometries(list,false);for(const g of list)g.dispose();for(const g of geos[i])g.dispose();
    const mesh=new THREE.Mesh(geometry,materials[i]);mesh.castShadow=true;mesh.receiveShadow=true;mesh.name=['painted lantern joinery','bronze collars and caps','level stone footings','warm opal lantern glass'][i];group.add(mesh);
  }
  const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;
  const ctx=canvas.getContext('2d'),gradient=ctx.createRadialGradient(32,32,0,32,32,31);
  gradient.addColorStop(0,'rgba(255,234,187,.65)');gradient.addColorStop(.14,'rgba(255,216,157,.34)');gradient.addColorStop(.42,'rgba(255,194,113,.095)');gradient.addColorStop(1,'rgba(255,178,93,0)');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);const haloTexture=new THREE.CanvasTexture(canvas);haloTexture.colorSpace=THREE.SRGBColorSpace;
  const haloGeometry=new THREE.BufferGeometry();haloGeometry.setAttribute('position',new THREE.Float32BufferAttribute(bulbs.flatMap(p=>p.toArray()),3));
  const haloMaterial=new THREE.PointsMaterial({color:'#ffcb87',map:haloTexture,size:1.65,sizeAttenuation:true,transparent:true,opacity:0,depthWrite:false,depthTest:true,blending:THREE.AdditiveBlending});
  const halos=new THREE.Points(haloGeometry,haloMaterial);halos.name='soft lantern halos';halos.frustumCulled=false;group.add(halos);
  const update=(time,night)=>{
    const level=THREE.MathUtils.smoothstep(night,.18,.93);
    for(let i=0;i<lights.length;i++)lights[i].intensity=sites[i].power*level;
    opal.emissiveIntensity=.17+level*2.1;haloMaterial.opacity=level*.42;
  };
  update(0,shared.night.value);
  return {update,lights,group,sites};
}
