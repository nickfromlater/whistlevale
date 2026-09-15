'use strict';

// Pixal3D surface, UV coat and a Blender-authored weighted armature. A single
// immutable skin is shared by the family. Simulation owns poses; draw passes
// consume the same matrices for native lighting, depth, shadows and the map.
function safariSkinDecode(text,Type){
 const raw=atob(text),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);return new Type(bytes.buffer);
}
function safariSkinMesh(source){
 const input=safariSkinDecode(source.vertexData,Float32Array),indices=safariSkinDecode(source.indexData,Uint32Array);
 const data=new Float32Array(source.vertices*12),skin=new Float32Array(source.vertices*8);
 for(let i=0;i<source.vertices;i++){
  data.set(input.subarray(i*19,i*19+6),i*12);data.set([input[i*19+16],input[i*19+17],input[i*19+18],90,input[i*19+6],input[i*19+7]],i*12+6);
  skin.set(input.subarray(i*19+8,i*19+16),i*8);
 }
 const mesh={indexed:true,count:indices.length,bytes:data.byteLength+skin.byteLength+indices.byteLength};
 const previousVAO=gl.getParameter(gl.VERTEX_ARRAY_BINDING),previousBuffer=gl.getParameter(gl.ARRAY_BUFFER_BINDING);
 try{
  for(const [name,create]of[['vao','createVertexArray'],['buf','createBuffer'],['ibo','createBuffer'],['skinBuffer','createBuffer'],['skinTexture','createTexture']]){mesh[name]=gl[create]();if(!mesh[name])throw new Error('Unable to allocate giraffe '+name+'.');}
  gl.bindVertexArray(mesh.vao);gl.bindBuffer(gl.ARRAY_BUFFER,mesh.buf);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);
  [3,3,3,1,2].forEach((n,i)=>{gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,n,gl.FLOAT,false,48,[0,12,24,36,40][i]);});
  gl.bindBuffer(gl.ARRAY_BUFFER,mesh.skinBuffer);gl.bufferData(gl.ARRAY_BUFFER,skin,gl.STATIC_DRAW);
  for(let i=0;i<2;i++){gl.enableVertexAttribArray(5+i);gl.vertexAttribPointer(5+i,4,gl.FLOAT,false,32,i*16);}
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,mesh.ibo);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indices,gl.STATIC_DRAW);
  function withCoatTexture(callback){
   const active=gl.getParameter(gl.ACTIVE_TEXTURE),flip=gl.getParameter(gl.UNPACK_FLIP_Y_WEBGL);
   gl.activeTexture(gl.TEXTURE6);const binding=gl.getParameter(gl.TEXTURE_BINDING_2D);
   try{gl.bindTexture(gl.TEXTURE_2D,mesh.skinTexture);callback();}
   finally{gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,flip);gl.bindTexture(gl.TEXTURE_2D,binding);gl.activeTexture(active);}
  }
  withCoatTexture(()=>{
   gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([173,126,71,255]));
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  });
  const image=new Image();mesh.textureReady=false;
  image.onload=()=>{
   if(mesh.disposed)return;
   try{
    withCoatTexture(()=>{
     gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);gl.generateMipmap(gl.TEXTURE_2D);
     gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
    });
    mesh.textureReady=true;
   }catch(error){mesh.textureError=true;console.error('The giraffe coat could not be uploaded.',error);}
  };
  image.onerror=()=>{if(!mesh.disposed)console.error('The embedded giraffe coat could not be decoded.');};image.src=source.texture;
  return mesh;
 }catch(error){disposeMesh(mesh);throw error;}finally{gl.bindVertexArray(previousVAO);gl.bindBuffer(gl.ARRAY_BUFFER,previousBuffer);}
}
const SAFARI_GIRAFFE_HABITAT=[[-27.4,15.1,.98,0],[-24.2,15.2,.58,1.8],[-21,15.5,.93,3.4]];
function safariBrowseTarget(x,z,scale){
 // The end of the muzzle meets the underside of a real, authored leaf crown.
 return [x-2.48*scale,safariSurface(x,z+1.35)+4.78*scale,z+1.35];
}
function safariCreateWildlife(scene){
 const mesh=safariSkinMesh(SAFARI_GIRAFFE_MODEL),herd=[];
 for(const [x,z,scale,phase]of SAFARI_GIRAFFE_HABITAT){
  herd.push({center:[x,z],scale,phase,models:new Map(),position:null,bones:new Float32Array(SAFARI_GIRAFFE_MODEL.bones.length*16),gait:phase/TAU,travel:0,planted:new Map(),browseTarget:safariBrowseTarget(x,z,scale)});
 }
 scene.wildlife={parts:[{name:'skin',mesh}],herd,time:0,bones:SAFARI_GIRAFFE_MODEL.bones};
 try{safariBuildCompanions(scene.wildlife);safariUpdateWildlife(scene,0);}catch(error){for(const part of scene.wildlife.parts)disposeMesh(part.mesh);delete scene.wildlife;throw error;}
}
function safariSkinTRS(a,b,mix){
 const q=[0,0,0,0],sign=a.slice(3).reduce((s,v,i)=>s+v*b[i+3],0)<0?-1:1;
 for(let i=0;i<4;i++)q[i]=a[i+3]*(1-mix)+b[i+3]*mix*sign;
 const length=Math.hypot(...q)||1;for(let i=0;i<4;i++)q[i]/=length;
 const [x,y,z,w]=q,xx=x*x,yy=y*y,zz=z*z,xy=x*y,xz=x*z,yz=y*z,wx=w*x,wy=w*y,wz=w*z;
 return [1-2*(yy+zz),2*(xy+wz),2*(xz-wy),0,2*(xy-wz),1-2*(xx+zz),2*(yz+wx),0,2*(xz+wy),2*(yz-wx),1-2*(xx+yy),0,a[0]*(1-mix)+b[0]*mix,a[1]*(1-mix)+b[1]*mix,a[2]*(1-mix)+b[2]*mix,1];
}
function safariAimBone(matrix,from,to,origin){
 const a=norm(from),b=norm(to),axis=cross(a,b),q=[0,0,0,...axis,1+clamp(dot(a,b),-1,1)];
 const rotation=safariSkinTRS(q,q,0),result=mm(rotation,matrix);
 result[12]=origin[0];result[13]=origin[1];result[14]=origin[2];return result;
}
function safariUpdateWildlife(scene,dt){
 const life=scene.wildlife;if(!life)return;
 life.time+=reduceMotion?0:dt;
 const source=SAFARI_GIRAFFE_MODEL,frames=source.walk.frames;
 for(const animal of life.herd){
  const t=life.time,scale=animal.scale;
  // Twelve-second walking arcs replace the former 53-second shuffle. The
  // family stops independently at its own reachable acacia, then walks on.
  const cycle=(t+animal.phase*2.5)/32,turn=Math.floor(cycle),clock=(cycle-turn)*32;
  const browsing=clock>=12&&clock<20,u=clock<12?clock/12:clock<20?1:(clock-20)/12;
  const ease=u-Math.sin(TAU*u)/TAU;
  const travel=turn*TAU+(clock<20?0:PI)+ease*PI,a=-PI/2+travel;
  const x=animal.center[0]+1.25*Math.cos(a),z=animal.center[1]+1.35*Math.sin(a);
  const vx=-1.25*Math.sin(a),vz=1.35*Math.cos(a),yaw=Math.atan2(-vz,vx);
  const distance=animal.position?Math.hypot(x-animal.position[0],z-animal.position[2]):0;
  const previousGait=animal.gait;animal.gait+=distance/(source.walk.stride*scale);
  const moving=reduceMotion||browsing?0:Math.min(1,(1-Math.cos(TAU*u))*3);
  const feeding=browsing?Math.min(1,(clock-12)/1.1,(20-clock)/1.1):0;
  animal.behavior=browsing?(clock<13.1?'settling':clock>18.9?'departing':'browsing'):'walking';animal.feeding=feeding;
  animal.speed=reduceMotion||browsing?0:Math.hypot(vx,vz)*PI/12*(1-Math.cos(TAU*u));
  const f=((animal.gait%1)+1)%1*(frames.length-1),frame=Math.floor(f),blend=f-frame;
  const global=[];
  for(let i=0;i<source.bones.length;i++){
   const bone=source.bones[i],a=frames[frame][i],b=frames[Math.min(frame+1,frames.length-1)][i];
   // Interpolate the authored local translations and rotations, then ease into
   // the planted neutral pose at each rest. No vertex buffers change per frame.
   const sign=a.slice(3).reduce((s,v,j)=>s+v*b[j+3],0)<0?-1:1;
   const walk=a.map((v,j)=>v*(1-blend)+b[j]*blend*(j>2?sign:1));
   let matrix=safariSkinTRS(bone.rest,walk,moving);matrix=bone.parent===null?matrix:mm(global[bone.parent],matrix);
   let rotation=null;
   if(bone.name==='neck')rotation=rz((1-feeding)*(.014*Math.sin(t*.47+animal.phase)+(1-moving)*.03*Math.sin(t*.17+animal.phase))+feeding*.018*Math.sin(t*2.3+animal.phase));
   if(bone.name==='head')rotation=mm(ry((1-feeding)*.055*Math.sin(t*.29+animal.phase)),rz(feeding*(.025+.032*Math.sin(t*4.6+animal.phase))));
   if(bone.name==='tail')rotation=rx(.15*Math.sin(t*1.8+animal.phase)+.08*Math.sin(t*.37));
   if(bone.name.startsWith('ear')){const twitch=Math.max(0,Math.sin(t*.61+animal.phase+(bone.name==='ear.L'?0:1.4)));rotation=rx(.045*Math.sin(t*1.9+animal.phase)+.13*twitch**18);}
   if(rotation)matrix=mm(mm(mm(trans(matrix[12],matrix[13],matrix[14]),rotation),trans(-matrix[12],-matrix[13],-matrix[14])),matrix);
   global.push(matrix);animal.bones.set(mm(matrix,bone.inverseBind),i*16);
  }
  const horizontal=mm(mm(trans(x,0,z),ry(yaw)),scaling(scale));
  const contacts=source.feet.map(foot=>{
   const local=transform(foot.position,animal.bones.subarray(foot.bone*16,foot.bone*16+16)),world=transform(local,horizontal);
   return {foot,local,terrain:safariSurface(world[0],world[2])};
  });
  // The four hooves stand on different terrain heights. Set the body over the
  // lower contact, then solve each weighted leg to its own ground plane while
  // preserving the authored swing lift and lateral foot path.
  const ground=Math.min(...contacts.map(c=>c.terrain))-.02*scale;
  for(const {foot,local,terrain}of contacts){
   const hoof=foot.bone,lower=source.bones[hoof].parent,upper=source.bones[lower].parent;
   const hip=Array.from(global[upper].slice(12,15)),knee=Array.from(global[lower].slice(12,15)),ankle=Array.from(global[hoof].slice(12,15));
   const lift=Math.max(0,local[1]-foot.position[1]);
   const target=ankle.slice();target[1]+=(terrain-ground)/scale+lift-local[1];
   const name=source.bones[upper].name,offset=(name.endsWith('.L')?0:.5)+(name.startsWith('front')?0:.18);
   const footClock=((animal.gait+offset)%1+1)%1,stance=footClock<.70;
   // Keep a stance hoof at its world contact through a turn. The source action
   // owns lift/recovery; these small IK corrections remove sideways skating.
   if(stance&&moving>.80&&animal.gait-previousGait<.24){
    if(!animal.planted.has(hoof))animal.planted.set(hoof,transform(local,horizontal));
    const plant=animal.planted.get(hoof),dx=(plant[0]-x)/scale,dz=(plant[2]-z)/scale;
    const px=Math.cos(yaw)*dx-Math.sin(yaw)*dz,pz=Math.sin(yaw)*dx+Math.cos(yaw)*dz;
    // Release before toe-off rather than dropping the accumulated turn
    // correction in one frame. The same smooth envelope eases into contact
    // and out of the walking pose while approaching the browse stop.
    const contact=clamp(Math.min(footClock/.08,(.70-footClock)/.16,(moving-.80)/.20),0,1),weight=contact*contact*(3-2*contact);
    target[0]+=clamp(px-local[0],-.24,.24)*weight;target[2]+=clamp(pz-local[2],-.24,.24)*weight;
   }else animal.planted.delete(hoof);
   const l1=len(sub(knee,hip)),l2=len(sub(ankle,knee)),delta=sub(target,hip),distance=clamp(len(delta),.001,l1+l2-.0001),direction=norm(delta);
   let bend=sub(sub(knee,hip),mul(direction,dot(sub(knee,hip),direction)));
   if(len(bend)<.0001)bend=[source.bones[upper].name.startsWith('front')?1:-1,0,0];
   const along=(l1*l1+distance*distance-l2*l2)/(2*distance),height=Math.sqrt(Math.max(0,l1*l1-along*along));
   const joint=add(add(hip,mul(direction,along)),mul(norm(bend),height));
   global[upper]=safariAimBone(global[upper],sub(knee,hip),sub(joint,hip),hip);
   global[lower]=safariAimBone(global[lower],sub(ankle,knee),sub(target,joint),joint);
   global[hoof]=Array.from(global[hoof]);for(let axis=0;axis<3;axis++)global[hoof][12+axis]+=target[axis]-ankle[axis];
   for(const i of[upper,lower,hoof])animal.bones.set(mm(global[i],source.bones[i].inverseBind),i*16);
  }
  animal.position=[x,ground,z];animal.heading=yaw;animal.travel=travel;
  animal.models.set('skin',mm(mm(trans(x,ground,z),ry(yaw)),scaling(scale)));
 }
 safariUpdateCompanions(life);
}
function safariDrawWildlife(scene,p){
 if(!scene.wildlife)return;
 const mesh=scene.wildlife.parts[0].mesh;
 if(p===mainProgram){gl.activeTexture(gl.TEXTURE6);gl.bindTexture(gl.TEXTURE_2D,mesh.skinTexture);gl.uniform1i(uniform(p,'uWildlifeCoat'),6);gl.activeTexture(gl.TEXTURE2);}
 for(const animal of scene.wildlife.herd){um(p,'uWildlifeBones[0]',animal.bones);draw(mesh,animal.models.get('skin'),p);}
 safariDrawCompanions(scene.wildlife,p);
}

// Original native anatomy for the adjoining grazing lawn. All surfaces are
// authored once; articulated transforms are shared by the room, shadow and map.
// +X is forward. This intentionally uses no external model or runtime package.
function safariAnimalSurface(b,center,radii,kind,segments=56,rings=24){
 const [cx,cy,cz]=center,[sx,sy,sz]=radii;
 const normal=p=>norm([(p[0]-cx)/(sx*sx),(p[1]-cy)/(sy*sy),(p[2]-cz)/(sz*sz)]);
 if(kind==='zebra'){
  // The topology follows each stripe's exact curved boundary. Alternating
  // surface ribbons meet at shared positions, avoiding raster-like stair steps
  // without a texture, overlapping decals or additional draw calls.
  const first=Math.floor(((cx-sx)*22-1.7)/PI),last=Math.ceil(((cx+sx)*22+1.7)/PI),around=Math.max(24,rings);
  const point=(phase,v)=>{
   const a=v*TAU;let x=phase/22;
   for(let k=0;k<5;k++)x=(phase-1.15*Math.sin(a*2)-.42*Math.sin(x*8+a))/22;
   x=clamp(x,cx-sx,cx+sx);const r=Math.sqrt(Math.max(0,1-((x-cx)/sx)**2));
   return[x,cy+sy*r*Math.cos(a),cz+sz*r*Math.sin(a)];
  };
  for(let k=first;k<last;k++)for(let half=0;half<2;half++)for(let j=0;j<around;j++){
   const phase=(k+half/2)*PI,next=phase+PI/2,a=point(phase,j/around),q=point(next,j/around),r=point(next,(j+1)/around),v=point(phase,(j+1)/around),c=((k%2)+2)%2===0?'#34372f':'#d2cfba';
   b.tri(a,r,q,c,0,[normal(a),normal(r),normal(q)]);b.tri(a,v,r,c,0,[normal(a),normal(v),normal(r)]);
  }
  return;
 }
 const point=(u,v)=>{const a=u*PI,q=v*TAU;return[cx+sx*Math.cos(a),cy+sy*Math.sin(a)*Math.cos(q),cz+sz*Math.sin(a)*Math.sin(q)];};
 for(let i=0;i<segments;i++)for(let j=0;j<rings;j++){
  const u=(i+.5)/segments,v=(j+.5)/rings,p=point(u,v),a=point(i/segments,j/rings),q=point((i+1)/segments,j/rings),r=point((i+1)/segments,(j+1)/rings),s=point(i/segments,(j+1)/rings),c='#89887b';
  b.tri(a,q,r,c,0,[normal(a),normal(q),normal(r)]);b.tri(a,r,s,c,0,[normal(a),normal(r),normal(s)]);
 }
}
function safariZebraNeck(b){
 // A broad lower neck flows out of the chest and narrows toward the poll.
 // Curved transverse stripes follow its changing cross section.
 const profile=[[-.20,-.08,.22,.20],[0,-.015,.33,.27],[.28,.07,.31,.25],[.55,.16,.24,.205],[.80,.25,.165,.155],[1.04,.32,.13,.13]];
 const at=y=>{let k=0;while(k+1<profile.length-1&&y>profile[k+1][0])k++;const a=profile[k],q=profile[k+1],u=clamp((y-a[0])/(q[0]-a[0]));return a.map((v,i)=>mix(v,q[i],u));};
 const point=(phase,v)=>{const a=v*TAU,y=clamp((phase-.42*Math.sin(a)-.22*Math.sin(a*3))/20,-.2,1.04),p=at(y);return[p[1]+p[2]*Math.cos(a),y,p[3]*Math.sin(a)];};
 const normal=p=>{const row=at(p[1]);return norm([(p[0]-row[1])/(row[2]*row[2]),-.15,(p[2])/(row[3]*row[3])]);};
 for(let k=-2;k<8;k++)for(let half=0;half<2;half++)for(let j=0;j<28;j++){
  const phase=(k+half/2)*PI,a=point(phase,j/28),q=point(phase+PI/2,j/28),r=point(phase+PI/2,(j+1)/28),v=point(phase,(j+1)/28),c=((k%2)+2)%2===0?'#34372f':'#d2cfba';
  b.tri(a,q,r,c,0,[normal(a),normal(q),normal(r)]);b.tri(a,r,v,c,0,[normal(a),normal(r),normal(v)]);
 }
 // The dark hog mane follows the curved nape, with fine upright hair tips.
 for(let i=0;i<20;i++){
  const y=-.06+i*.052,row=at(y),next=at(y+.06),x=row[1]-row[2];
  b.quad([x-.09,y,-.04],[x,y,-.045],[next[1]-next[2],y+.06,-.045],[next[1]-next[2]-.10,y+.06,-.04],'#363a30',0);
  b.quad([x,y,.045],[x-.09,y,.04],[next[1]-next[2]-.10,y+.06,.04],[next[1]-next[2],y+.06,.045],'#45483a',0);
 }
}
function safariAnimalTube(b,points,radii,color,sides=12){
 for(let k=0;k+1<points.length;k++){
  const a=points[k],q=points[k+1],f=norm(sub(q,a)),right=norm(cross(f,Math.abs(f[1])>.95?[1,0,0]:[0,1,0])),up=cross(right,f);
  for(let i=0;i<sides;i++){
   const n=t=>add(mul(right,Math.cos(t)),mul(up,Math.sin(t))),v=(p,r,t)=>add(p,mul(n(t),r)),t=i*TAU/sides,tt=(i+1)*TAU/sides;
   const p0=v(a,radii[k],t),p1=v(q,radii[k+1],t),p2=v(q,radii[k+1],tt),p3=v(a,radii[k],tt);
   b.tri(p0,p1,p2,color,0,[n(t),n(t),n(tt)]);b.tri(p0,p2,p3,color,0,[n(t),n(tt),n(tt)]);
  }
 }
}
function safariBuildCompanions(life){
 const make=(name,build)=>{const b=new Builder();build(b);life.parts.push({name,mesh:b.mesh()});};
 make('zebra-body',b=>{
  safariAnimalSurface(b,[0,1.34,0],[1.02,.52,.37],'zebra');
  for(const x of[-.65,.61])safariAnimalSurface(b,[x,1.24,0],[.37,.48,.35],'zebra',32,20);
 });
 make('zebra-neck',safariZebraNeck);
 make('zebra-head',b=>{
  b.push(0,0,0,0,0,-.45);safariAnimalSurface(b,[.16,0,0],[.48,.205,.19],'zebra',40,24);
  b.sphere(.54,-.027,0,.16,.135,.16,'#454740',0,16,10);
  for(const side of[-1,1]){
   b.sphere(.15,.065,side*.177,.046,.046,.021,'#8e8c78',0,12,8);b.sphere(.163,.073,side*.195,.024,.027,.011,'#171f1c',0,12,8);
   b.sphere(.171,.080,side*.206,.006,.007,.004,'#e5dfca',0,8,5);
   b.sphere(.53,.015,side*.141,.055,.028,.025,'#232925',0,10,6);
   b.beam([.42,-.103,side*.145],[.59,-.097,side*.106],.008,'#232925',0,4);
  }b.pop();
 });
 make('zebra-ear',b=>{b.push(0,0,0,0,0,-.18);safariAnimalSurface(b,[0,.115,0],[.064,.175,.055],'zebra',20,12);b.sphere(.031,.14,0,.040,.109,.035,'#a09a85',0,12,8);b.pop();});
 for(const [name,length,radius]of[['upper',.60,.12],['lower',.57,.060]])make('zebra-'+name,b=>{
  safariAnimalSurface(b,[0,-length*.47,0],[radius,length*.60,radius*.86],'zebra',32,14);
  b.sphere(0,-length,0,radius*.68,.062,radius*.67,'#bbb9a8',0,10,6);
  if(name==='lower')b.sphere(.042,-length-.012,0,.108,.090,.095,'#343a32',0,12,7);
 });
 make('zebra-tail',b=>{safariAnimalTube(b,[[0,0,0],[-.13,-.25,0],[-.12,-.51,.02]],[.045,.031,.018],'#bbb7a0',8);b.sphere(-.13,-.59,.015,.075,.16,.061,'#34382e',0,12,8);});
 make('elephant-body',b=>{
  safariAnimalSurface(b,[0,2.03,0],[1.64,1.05,.88],'elephant',48,28);
  safariAnimalSurface(b,[.96,2.13,0],[.74,1.03,.78],'elephant',36,24);
  // Soft spinal ridge and shoulder folds, never separate armour plates.
  for(const side of[-1,1])for(let i=0;i<5;i++)safariAnimalTube(b,[[.54+i*.095,2.71,side*.50],[.70+i*.095,2.40,side*.74],[.74+i*.095,2.08,side*.79]],[.009,.012,.007],'#777b72',5);
 });
 make('elephant-head',b=>{
  safariAnimalSurface(b,[.24,.04,0],[.70,.79,.61],'elephant',40,26);
  b.sphere(.53,.47,0,.39,.37,.47,'#8e8c80',0,20,14);
  for(const side of[-1,1]){
   b.sphere(.68,.12,side*.444,.14,.10,.052,'#71796f',0,14,8);b.sphere(.707,.11,side*.477,.051,.042,.022,'#242d27',0,12,8);b.sphere(.723,.121,side*.494,.010,.009,.005,'#d7d3bd',0,8,5);
   safariAnimalTube(b,[[.68,-.32,side*.37],[1.02,-.43,side*.44],[1.29,-.40,side*.46],[1.46,-.23,side*.43]],[.095,.070,.039,.003],'#d8cbaa',14);
  }
 });
 for(const side of[-1,1])make('elephant-ear'+side,b=>{
  // Smooth curved pinnae: rounded upper fans taper to the lower lobe. The
  // shallow bowl has continuous normals rather than a flat triangle fan.
  const outline=[[0,.59,0],[-.28,.77,.30],[-.48,.49,.61],[-.53,.03,.77],[-.45,-.47,.73],[-.32,-.84,.49],[-.14,-.67,.19],[.03,-.27,0]],center=[-.17,-.03,.26];
  const rim=t=>{
   const u=((t%1)+1)%1*outline.length,k=Math.floor(u),f=u-k,n=outline.length;
   return[0,1,2].map(axis=>{const a=outline[(k+n-1)%n][axis],q=outline[k][axis],r=outline[(k+1)%n][axis],v=outline[(k+2)%n][axis];return .5*((2*q)+(-a+r)*f+(2*a-5*q+4*r-v)*f*f+(-a+3*q-3*r+v)*f*f*f);});
  };
  const point=(r,t,back=false)=>{const p=lerpV(center,rim(t),r);p[0]+=.12*Math.sin(r*PI)-(back?.035:0);p[2]*=side;return p;};
  const normal=(r,t,back)=>{const radial=sub(point(Math.min(1,r+.002),t),point(Math.max(0,r-.002),t)),angular=sub(point(Math.max(.002,r),t+.002),point(Math.max(.002,r),t-.002));let n=norm(cross(radial,angular));if(n[0]<0)n=mul(n,-1);return back?mul(n,-1):n;};
  for(const back of[false,true])for(let row=0;row<5;row++)for(let j=0;j<32;j++){
   const a=point(row/5,j/32,back),q=point((row+1)/5,j/32,back),r=point((row+1)/5,(j+1)/32,back),v=point(row/5,(j+1)/32,back),ns=[normal(row/5,j/32,back),normal((row+1)/5,j/32,back),normal((row+1)/5,(j+1)/32,back),normal(row/5,(j+1)/32,back)],c=back?'#818578':'#939080';
   b.tri(a,q,r,c,0,[ns[0],ns[1],ns[2]]);b.tri(a,r,v,c,0,[ns[0],ns[2],ns[3]]);
  }
  for(let j=0;j<32;j++)b.beam(point(1,j/32),point(1,(j+1)/32),.014,'#838677',0,5);
  for(const t of[.16,.29,.43,.57,.72])for(let row=1;row<5;row++){const a=point(row/6,t),q=point((row+1)/6,t);a[0]+=.005;q[0]+=.005;b.beam(a,q,.005,'#888a7a',0,4);}
 });
 for(const [name,length,radius]of[['upper',.89,.34],['lower',.81,.25]])make('elephant-'+name,b=>{
  safariAnimalSurface(b,[0,-length*.42,0],[radius,length*.68,radius*.91],'elephant',28,20);
  if(name==='lower'){
   b.sphere(.035,-length+.06,0,.30,.17,.28,'#777e72',0,18,10);
   for(const z of[-.16,0,.16])b.sphere(.26,-length+.027,z,.045,.074,.066,'#b4ac91',0,10,6);
   for(let i=0;i<3;i++)safariAnimalTube(b,[[.21,-.55-i*.055,-.13],[.25,-.56-i*.055,0],[.21,-.55-i*.055,.13]],[.007,.010,.007],'#69756b',5);
  }
 });
 for(let i=0;i<6;i++)make('elephant-trunk'+i,b=>{
  const r=.245-i*.031;safariAnimalTube(b,[[0,.035,0],[.008,-.165,0],[.025,-.335,0]],[r,r-.011,r-.028],'#88897d',16);
  for(let j=0;j<4;j++)safariAnimalTube(b,[[r*.71,-.055-j*.070,-r*.63],[r,-.069-j*.070,0],[r*.71,-.055-j*.070,r*.63]],[.006,.008,.006],'#727d72',5);
  if(i===5)b.sphere(.025,-.345,0,.067,.065,.064,'#747e72',0,12,8);
 });
 make('elephant-tail',b=>{safariAnimalTube(b,[[0,0,0],[-.18,-.39,0],[-.12,-.88,0]],[.060,.036,.020],'#7c8275',10);b.sphere(-.12,-.94,0,.055,.17,.085,'#414e42',0,10,7);});
 life.companions=[
  {species:'zebra',center:[-27,-5.4],scale:1.06,phase:0,radius:[1.45,1.0]},
  {species:'zebra',center:[-23,-7.1],scale:.92,phase:11,radius:[1.1,.85]},
  {species:'elephant',center:[17.5,21.7],scale:1.08,phase:5,radius:[1.4,.72]}
 ].map(animal=>({...animal,models:new Map(),position:null,gait:0}));
}
function safariUpdateCompanions(life){
 for(const animal of life.companions||[]){
  const {species,scale,phase,center,radius}=animal,t=life.time,elephant=species==='elephant',duration=elephant?44:32,walk=elephant?15:10;
  const clock=(t+phase)%duration,half=clock<duration/2?0:1,part=clock-half*duration/2,u=Math.min(1,part/walk),ease=u-Math.sin(TAU*u)/TAU,a=-PI/2+(half+ease)*PI;
  const x=center[0]+radius[0]*Math.cos(a),z=center[1]+radius[1]*Math.sin(a),yaw=Math.atan2(-radius[1]*Math.cos(a),-radius[0]*Math.sin(a));
  const distance=animal.position?Math.hypot(x-animal.position[0],z-animal.position[2]):0;animal.gait+=distance/(elephant?1.46:1.05)/scale;
  const moving=part<walk?Math.min(1,(1-Math.cos(TAU*u))*2.5):0,feeding=part>=walk?Math.max(0,Math.min(1,(part-walk)/1.4,(duration/2-part)/1.4)):0;
  animal.behavior=part<walk?'walking':elephant?'foraging':'grazing';animal.feeding=feeding;animal.speed=reduceMotion?0:Math.hypot(radius[0]*Math.sin(a),radius[1]*Math.cos(a))*PI/walk*(1-Math.cos(TAU*u))*(part<walk?1:0);
  const horizontal=mm(mm(trans(x,0,z),ry(yaw)),scaling(scale)),feet=[];
  for(const front of[-1,1])for(const side of[-1,1]){
   const hipX=front*(elephant?.96:.66),hipZ=side*(elephant?.57:.25),phaseOffset=(front===1?0:.18)+(side===1?0:.5),cycle=((animal.gait+phaseOffset)%1+1)%1;
   const stance=.68,stride=elephant?.75:.56,fx=cycle<stance?mix(stride/2,-stride/2,cycle/stance):mix(-stride/2,stride/2,(cycle-stance)/(1-stance)),lift=cycle<stance?0:Math.sin((cycle-stance)/(1-stance)*PI)*(elephant?.13:.15);
   const local=[hipX+fx*moving,0,hipZ],world=transform(local,horizontal);feet.push({front,side,hipX,hipZ,local,ground:safariSurface(world[0],world[2]),lift:lift*moving});
  }
  const ground=Math.min(...feet.map(f=>f.ground)),base=mm(mm(trans(x,ground,z),ry(yaw)),scaling(scale));animal.position=[x,ground,z];animal.heading=yaw;
  const put=(name,m)=>animal.models.set(species+'-'+name,mm(base,m));
  put('body',I);
  const neck=mm(trans(.63,1.43,0),rz(-feeding*1.73));if(!elephant)put('neck',neck);
  const head=elephant?mm(trans(1.25,2.36,0),rz(-feeding*.07+.014*Math.sin(t*.5+phase))):mm(neck,mm(trans(.32,1.01,0),rz(feeding*.57+.025*Math.sin(t*.8+phase))));
  put('head',head);
  if(elephant){
   for(const side of[-1,1])put('ear'+side,mm(mm(trans(1.10,2.62,side*.46),ry(side*(.12+.19*Math.sin(t*.72+phase)))),rx(side*.05*Math.sin(t*.37))));
   let trunk=mm(head,trans(.76,-.25,0));
   for(let i=0;i<6;i++){trunk=mm(trunk,rz(.02+(i/5)**2*(.18+.20*Math.sin(t*.67+phase))+.035*Math.sin(t*.9-i*.4)));put('trunk'+i,trunk);trunk=mm(trunk,trans(.025,-.335,0));}
  }else for(const side of[-1,1])put('ear'+side,mm(head,mm(trans(-.04,.16,side*.14),rx(side*(.20+.13*Math.sin(t*1.8+phase+side))))));
  put('tail',mm(trans(elephant?-1.48:-.95,elephant?2.19:1.50,0),rx(.22*Math.sin(t*1.6+phase))));
  for(const foot of feet){
   const l1=elephant?.89:.60,l2=elephant?.81:.57,hip=[foot.hipX,elephant?1.82:1.25,foot.hipZ],target=[foot.local[0],(foot.ground-ground)/scale+(elephant?.19:.10)+foot.lift,foot.hipZ];
   const delta=sub(target,hip),d=clamp(len(delta),.001,l1+l2-.001),dir=norm(delta),along=(l1*l1+d*d-l2*l2)/(2*d),height=Math.sqrt(Math.max(0,l1*l1-along*along)),bend=norm([-dir[1],dir[0],0]),joint=add(add(hip,mul(dir,along)),mul(bend,height*(foot.front===1?-1:1)));
   const upper=mm(trans(...hip),rz(Math.atan2(joint[0]-hip[0],hip[1]-joint[1]))),lower=mm(trans(...joint),rz(Math.atan2(target[0]-joint[0],joint[1]-target[1])));
   put('upper'+foot.front+','+foot.side,upper);put('lower'+foot.front+','+foot.side,lower);
  }
 }
}
function safariDrawCompanions(life,p){
 for(const animal of life.companions||[])for(const [name,matrix]of animal.models){
  const key=name.replace(/(upper|lower)-?1,-?1$/,'$1').replace(/zebra-ear-?1$/,'zebra-ear');
  const part=life.parts.find(part=>part.name===key);if(part)draw(part.mesh,matrix,p);
 }
}
