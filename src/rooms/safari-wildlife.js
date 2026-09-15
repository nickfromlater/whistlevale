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
function safariCreateWildlife(scene){
 const mesh=safariSkinMesh(SAFARI_GIRAFFE_MODEL),herd=[];
 for(const [x,z,scale,phase]of[[-27.4,15.1,.98,0],[-24.2,15.2,.58,1.8],[-21,15.5,.93,3.4]]){
  herd.push({center:[x,z],scale,phase,direction:phase>3?-1:1,models:new Map(),position:null,bones:new Float32Array(SAFARI_GIRAFFE_MODEL.bones.length*16),gait:phase/TAU,travel:0});
 }
 scene.wildlife={parts:[{name:'skin',mesh}],herd,time:0,bones:SAFARI_GIRAFFE_MODEL.bones};
 try{safariUpdateWildlife(scene,0);}catch(error){disposeMesh(mesh);delete scene.wildlife;throw error;}
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
  const cycle=(t+animal.phase*2.5)/130,turn=Math.floor(cycle),clock=(cycle-turn)*130;
  const u=clock<12?0:clock<65?(clock-12)/53:clock<77?0:(clock-77)/53;
  const resting=clock<12||(clock>=65&&clock<77),ease=u*u*(3-2*u);
  const travel=turn*TAU+(clock<65?0:PI)+ease*PI,a=-PI/2+travel*animal.direction-.42+animal.phase*.10;
  const x=animal.center[0]+1.05*Math.cos(a),z=animal.center[1]+.65*Math.sin(a);
  const vx=-1.05*Math.sin(a)*animal.direction,vz=.65*Math.cos(a)*animal.direction,yaw=Math.atan2(-vz,vx);
  const distance=animal.position?Math.hypot(x-animal.position[0],z-animal.position[2]):0;
  animal.gait+=distance/(source.walk.stride*scale);
  const moving=reduceMotion||resting?0:Math.min(1,Math.sin(PI*u)*3),f=((animal.gait%1)+1)%1*(frames.length-1),frame=Math.floor(f),blend=f-frame;
  const global=[];
  for(let i=0;i<source.bones.length;i++){
   const bone=source.bones[i],a=frames[frame][i],b=frames[Math.min(frame+1,frames.length-1)][i];
   // Interpolate the authored local translations and rotations, then ease into
   // the planted neutral pose at each rest. No vertex buffers change per frame.
   const sign=a.slice(3).reduce((s,v,j)=>s+v*b[j+3],0)<0?-1:1;
   const walk=a.map((v,j)=>v*(1-blend)+b[j]*blend*(j>2?sign:1));
   let matrix=safariSkinTRS(bone.rest,walk,moving);matrix=bone.parent===null?matrix:mm(global[bone.parent],matrix);
   let rotation=null;
   if(bone.name==='neck')rotation=rz(.014*Math.sin(t*.47+animal.phase)+(1-moving)*.03*Math.sin(t*.17+animal.phase));
   if(bone.name==='head')rotation=ry(.055*Math.sin(t*.29+animal.phase));
   if(bone.name==='tail')rotation=rx(.15*Math.sin(t*1.8+animal.phase)+.08*Math.sin(t*.37));
   if(bone.name.startsWith('ear'))rotation=rx(.045*Math.sin(t*1.9+animal.phase)+(Math.sin(t*.61+animal.phase)>.94?.13:0));
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
   const l1=len(sub(knee,hip)),l2=len(sub(ankle,knee)),delta=sub(target,hip),distance=clamp(len(delta),.001,l1+l2-.0001),direction=norm(delta);
   let bend=sub(sub(knee,hip),mul(direction,dot(sub(knee,hip),direction)));
   if(len(bend)<.0001)bend=[source.bones[upper].name.startsWith('front')?1:-1,0,0];
   const along=(l1*l1+distance*distance-l2*l2)/(2*distance),height=Math.sqrt(Math.max(0,l1*l1-along*along));
   const joint=add(add(hip,mul(direction,along)),mul(norm(bend),height));
   global[upper]=safariAimBone(global[upper],sub(knee,hip),sub(joint,hip),hip);
   global[lower]=safariAimBone(global[lower],sub(ankle,knee),sub(target,joint),joint);
   global[hoof]=Array.from(global[hoof]);global[hoof][13]+=target[1]-ankle[1];
   for(const i of[upper,lower,hoof])animal.bones.set(mm(global[i],source.bones[i].inverseBind),i*16);
  }
  animal.position=[x,ground,z];animal.heading=yaw;animal.travel=travel;
  animal.models.set('skin',mm(mm(trans(x,ground,z),ry(yaw)),scaling(scale)));
 }
}
function safariDrawWildlife(scene,p){
 if(!scene.wildlife)return;
 const mesh=scene.wildlife.parts[0].mesh;
 if(p===mainProgram){gl.activeTexture(gl.TEXTURE6);gl.bindTexture(gl.TEXTURE_2D,mesh.skinTexture);gl.uniform1i(uniform(p,'uWildlifeCoat'),6);gl.activeTexture(gl.TEXTURE2);}
 for(const animal of scene.wildlife.herd){um(p,'uWildlifeBones[0]',animal.bones);draw(mesh,animal.models.get('skin'),p);}
}
