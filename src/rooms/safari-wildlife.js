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
  for(const [name,create]of[['vao','createVertexArray'],['buf','createBuffer'],['ibo','createBuffer'],['skinBuffer','createBuffer'],['skinTexture','createTexture']]){mesh[name]=gl[create]();if(!mesh[name])throw new Error('Unable to allocate wildlife '+name+'.');}
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
   }catch(error){mesh.textureError=true;console.error('The wildlife coat could not be uploaded.',error);}
  };
  image.onerror=()=>{if(!mesh.disposed)console.error('The embedded wildlife coat could not be decoded.');};image.src=source.texture;
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

// The adjoining lawn uses the same native weighted-skin pipeline. Each species
// owns one immutable GPU mesh; its animals only keep poses and root transforms.
function safariBuildCompanions(life){
 life.companionSources={zebra:SAFARI_ZEBRA_MODEL,elephant:SAFARI_ELEPHANT_MODEL};
 for(const [species,source]of Object.entries(life.companionSources))life.parts.push({name:species+'-skin',mesh:safariSkinMesh(source)});
 life.companions=[
  {species:'zebra',center:[-27,-5.4],scale:1.06,phase:0,radius:[1.45,1.0]},
  {species:'zebra',center:[-23,-7.1],scale:.92,phase:11,radius:[1.1,.85]},
  {species:'elephant',center:[17.5,21.7],scale:1.08,phase:5,radius:[1.4,.72]}
 ].map(animal=>({...animal,models:new Map(),position:null,gait:0,planted:new Map(),bones:new Float32Array(life.companionSources[animal.species].bones.length*16)}));
}
function safariBlendLocalPose(a,b,amount){
 const sign=a.slice(3).reduce((sum,v,i)=>sum+v*b[i+3],0)<0?-1:1;
 const pose=a.map((v,i)=>v*(1-amount)+b[i]*amount*(i>2?sign:1)),length=Math.hypot(...pose.slice(3))||1;
 for(let i=3;i<7;i++)pose[i]/=length;return pose;
}
function safariUpdateCompanions(life){
 for(const animal of life.companions||[]){
  const {species,scale,phase,center,radius}=animal,source=life.companionSources[species],frames=source.walk.frames,t=life.time,elephant=species==='elephant',duration=elephant?44:32,walk=elephant?15:10;
  const clock=(t+phase)%duration,half=clock<duration/2?0:1,part=clock-half*duration/2,u=Math.min(1,part/walk),ease=u-Math.sin(TAU*u)/TAU,a=-PI/2+(half+ease)*PI;
  const x=center[0]+radius[0]*Math.cos(a),z=center[1]+radius[1]*Math.sin(a),yaw=Math.atan2(-radius[1]*Math.cos(a),-radius[0]*Math.sin(a));
  const distance=animal.position?Math.hypot(x-animal.position[0],z-animal.position[2]):0,previousGait=animal.gait;animal.gait+=distance/source.walk.stride/scale;
  const moving=reduceMotion?0:part<walk?Math.min(1,(1-Math.cos(TAU*u))*2.5):0,feeding=part>=walk?Math.max(0,Math.min(1,(part-walk)/1.4,(duration/2-part)/1.4)):0;
  animal.behavior=part<walk?'walking':elephant?'foraging':'grazing';animal.feeding=feeding;animal.speed=reduceMotion?0:Math.hypot(radius[0]*Math.sin(a),radius[1]*Math.cos(a))*PI/walk*(1-Math.cos(TAU*u))*(part<walk?1:0);
  const f=((animal.gait%1)+1)%1*(frames.length-1),frame=Math.floor(f),blend=f-frame,global=[];
  const browseFrames=source.browse.frames,browseF=((t+phase)/source.browse.duration%1)*(browseFrames.length-1),browseFrame=Math.floor(browseF);
  for(let i=0;i<source.bones.length;i++){
   const bone=source.bones[i],a=frames[frame][i],b=frames[Math.min(frame+1,frames.length-1)][i];
   const walking=safariBlendLocalPose(a,b,blend),standing=safariBlendLocalPose(bone.rest,walking,moving);
   const browsing=safariBlendLocalPose(browseFrames[browseFrame][i],browseFrames[Math.min(browseFrame+1,browseFrames.length-1)][i],browseF-browseFrame);
   let matrix=safariSkinTRS(standing,browsing,feeding);matrix=bone.parent===null?matrix:mm(global[bone.parent],matrix);
   let rotation=null;
   if(bone.name==='head')rotation=rz((1-feeding)*.012*Math.sin(t*.5+phase));
   if(bone.name==='tail')rotation=rx(.18*Math.sin(t*1.6+phase));
   if(bone.name.startsWith('ear.')){const side=bone.name.endsWith('L')?1:-1;rotation=elephant?ry(side*.18*Math.sin(t*.72+phase)):rx(side*(.035*Math.sin(t*1.8+phase)+.12*Math.max(0,Math.sin(t*.61+phase+side))**16));}
   if(bone.name.startsWith('trunk.')){const n=Number(bone.name.split('.')[1]);rotation=rz((1-feeding)*.028*Math.sin(t*.67+phase-n*.35));}
   if(rotation)matrix=mm(mm(mm(trans(matrix[12],matrix[13],matrix[14]),rotation),trans(-matrix[12],-matrix[13],-matrix[14])),matrix);
   global.push(matrix);animal.bones.set(mm(matrix,bone.inverseBind),i*16);
  }
  const horizontal=mm(mm(trans(x,0,z),ry(yaw)),scaling(scale));
  const contacts=source.feet.map(foot=>{const local=transform(foot.position,animal.bones.subarray(foot.bone*16,foot.bone*16+16)),world=transform(local,horizontal);return{foot,local,terrain:safariSurface(world[0],world[2])};});
  const ground=Math.min(...contacts.map(c=>c.terrain));
  for(const {foot,local,terrain}of contacts){
   const hoof=foot.bone,lower=source.bones[hoof].parent,upper=source.bones[lower].parent;
   const hip=Array.from(global[upper].slice(12,15)),knee=Array.from(global[lower].slice(12,15)),ankle=Array.from(global[hoof].slice(12,15));
   const lift=Math.max(0,local[1]-foot.position[1]),target=ankle.slice();target[1]+=(terrain-ground)/scale+lift-local[1];
   const name=source.bones[upper].name,offset=(name.endsWith('.L')?0:.5)+(name.startsWith('front')?0:.18),footClock=((animal.gait+offset)%1+1)%1;
   if(footClock<.70&&moving>.80&&animal.gait-previousGait<.24){
    if(!animal.planted.has(hoof))animal.planted.set(hoof,transform(local,horizontal));
    const plant=animal.planted.get(hoof),dx=(plant[0]-x)/scale,dz=(plant[2]-z)/scale,px=Math.cos(yaw)*dx-Math.sin(yaw)*dz,pz=Math.sin(yaw)*dx+Math.cos(yaw)*dz;
    const contact=clamp(Math.min(footClock/.08,(.70-footClock)/.16,(moving-.80)/.20),0,1),weight=contact*contact*(3-2*contact);
    target[0]+=clamp(px-local[0],-.18,.18)*weight;target[2]+=clamp(pz-local[2],-.18,.18)*weight;
   }else animal.planted.delete(hoof);
   const l1=len(sub(knee,hip)),l2=len(sub(ankle,knee)),delta=sub(target,hip),distance=clamp(len(delta),.001,l1+l2-.0001),direction=norm(delta);
   let bend=sub(sub(knee,hip),mul(direction,dot(sub(knee,hip),direction)));if(len(bend)<.0001)bend=[source.bones[upper].name.startsWith('front')?1:-1,0,0];
   const along=(l1*l1+distance*distance-l2*l2)/(2*distance),height=Math.sqrt(Math.max(0,l1*l1-along*along)),joint=add(add(hip,mul(direction,along)),mul(norm(bend),height));
   global[upper]=safariAimBone(global[upper],sub(knee,hip),sub(joint,hip),hip);global[lower]=safariAimBone(global[lower],sub(ankle,knee),sub(target,joint),joint);
   global[hoof]=Array.from(global[hoof]);for(let axis=0;axis<3;axis++)global[hoof][12+axis]+=target[axis]-ankle[axis];
   for(const i of[upper,lower,hoof])animal.bones.set(mm(global[i],source.bones[i].inverseBind),i*16);
  }
  animal.position=[x,ground,z];animal.heading=yaw;animal.models.set('skin',mm(mm(trans(x,ground,z),ry(yaw)),scaling(scale)));
 }
}
function safariDrawCompanions(life,p){
 for(const animal of life.companions||[]){
  const mesh=life.parts.find(part=>part.name===animal.species+'-skin').mesh;
  if(p===mainProgram){gl.activeTexture(gl.TEXTURE6);gl.bindTexture(gl.TEXTURE_2D,mesh.skinTexture);gl.uniform1i(uniform(p,'uWildlifeCoat'),6);gl.activeTexture(gl.TEXTURE2);}
  um(p,'uWildlifeBones[0]',animal.bones);draw(mesh,animal.models.get('skin'),p);
 }
}
