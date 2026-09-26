'use strict';

// One room-owned planar reflection, not a second renderer. Draw the same native
// geometry through a reflected camera. No geometry is copied or rebuilt.
// The live map deliberately uses the inexpensive water fallback.
let venetianReflection=null;
function venetianDisposeReflection(){
 const r=venetianReflection;if(!r)return;
 r.gl.deleteFramebuffer(r.framebuffer);r.gl.deleteRenderbuffer(r.depth);r.gl.deleteTexture(r.texture);
 venetianReflection=null;
}
function venetianReflectionSize(w,h,phone){
 const scale=Math.min(.55,(phone?512:896)/Math.max(w,h));
 return [Math.max(1,Math.round(w*scale)),Math.max(1,Math.round(h*scale))];
}
function venetianReflectedVP(vp){return mm(vp,mm(trans(0,2*VENETIAN.water,0),scaling(1,-1,1)));}
function venetianPrepareReflection(){
 uf(mainProgram,'uVenetianReflectionPass',0);uf(mainProgram,'uVenetianReflectionReady',0);
 gl.uniform1i(uniform(mainProgram,'uVenetianReflection'),7);
 const scene=hobby.scene,active=hobby.room==='venetian'&&scene?.venetian&&!(typeof isShopMapActive==='function'&&isShopMapActive());
 if(!active){venetianDisposeReflection();return;}
 if(cameraPos[1]<=VENETIAN.water+.08||gl.isContextLost())return;
 const [width,height]=venetianReflectionSize(screenW,screenH,innerWidth<700);
 if(venetianReflection&&(venetianReflection.gl!==gl||venetianReflection.scene!==scene||venetianReflection.width!==width||venetianReflection.height!==height))venetianDisposeReflection();
 const originalEye=cameraPos,originalTarget=cameraTarget;let ready=false;
 const framebuffer=gl.getParameter(gl.FRAMEBUFFER_BINDING),viewport=gl.getParameter(gl.VIEWPORT),unit=gl.getParameter(gl.ACTIVE_TEXTURE),rb=gl.getParameter(gl.RENDERBUFFER_BINDING),facing=gl.getParameter(gl.FRONT_FACE);
 gl.activeTexture(gl.TEXTURE7);const binding=gl.getParameter(gl.TEXTURE_BINDING_2D);
 try{
  if(!venetianReflection){
   const r={gl,scene,width,height,framebuffer:gl.createFramebuffer(),texture:gl.createTexture(),depth:gl.createRenderbuffer(),vp:null,time:-1,night:-1,level:-1,passes:0,failed:false};
   venetianReflection=r;gl.bindFramebuffer(gl.FRAMEBUFFER,r.framebuffer);gl.bindTexture(gl.TEXTURE_2D,r.texture);
   gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,width,height,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
   for(const [parameter,value]of[[gl.TEXTURE_MIN_FILTER,gl.LINEAR],[gl.TEXTURE_MAG_FILTER,gl.LINEAR],[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE]])gl.texParameteri(gl.TEXTURE_2D,parameter,value);
   gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,r.texture,0);
   gl.bindRenderbuffer(gl.RENDERBUFFER,r.depth);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,width,height);
   gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,r.depth);
   r.failed=gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE;
  }
  const r=venetianReflection;
  if(r.failed)return; // Keep the fallback, and do not retry allocation each frame.
  const moved=!r.vp||VP.some((v,i)=>Math.abs(v-r.vp[i])>1e-7),time=clock;
  const refresh=moved||Math.abs(time-r.time)>1/(innerWidth<700?20:30)||night!==r.night||roomLampLevel!==r.level||(time===r.time&&r.train!==scene.trains[0]?.distance);
  if(refresh){
   // Never sample the texture while it is attached as the active draw target.
   gl.bindTexture(gl.TEXTURE_2D,null);gl.bindFramebuffer(gl.FRAMEBUFFER,r.framebuffer);gl.viewport(0,0,width,height);
   gl.clearColor(...lerpV([.11,.17,.17],[.006,.013,.026],night),1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
   const reflectedVP=venetianReflectedVP(VP),eye=[originalEye[0],2*VENETIAN.water-originalEye[1],originalEye[2]];
   cameraPos=eye;cameraTarget=[originalTarget[0],2*VENETIAN.water-originalTarget[1],originalTarget[2]];
   um(mainProgram,'uVP',reflectedVP);uv3(mainProgram,'uEye',eye);uf(mainProgram,'uVenetianReflectionPass',1);gl.frontFace(facing===gl.CCW?gl.CW:gl.CCW);
   drawHouseRoom(scene,mainProgram,false);drawHouseTrains(scene,mainProgram);drawArchitecturalGlass();
   r.vp=Array.from(VP);r.reflectedVP=reflectedVP;r.time=time;r.night=night;r.level=roomLampLevel;r.train=scene.trains[0]?.distance;r.passes++;
  }
  gl.activeTexture(gl.TEXTURE7);gl.bindTexture(gl.TEXTURE_2D,r.texture);um(mainProgram,'uVenetianReflectionVP',r.reflectedVP);
  gl.uniform2f(uniform(mainProgram,'uVenetianReflectionTexel'),1/width,1/height);uf(mainProgram,'uVenetianReflectionReady',1);ready=true;
 }finally{
  cameraPos=originalEye;cameraTarget=originalTarget;
  uf(mainProgram,'uVenetianReflectionPass',0);um(mainProgram,'uVP',VP);uv3(mainProgram,'uEye',cameraPos);
  architecturalGlassDraws.length=0;gl.bindFramebuffer(gl.FRAMEBUFFER,framebuffer);gl.viewport(...viewport);gl.bindRenderbuffer(gl.RENDERBUFFER,rb);
  if(!ready){gl.activeTexture(gl.TEXTURE7);gl.bindTexture(gl.TEXTURE_2D,binding);}
  gl.frontFace(facing);gl.activeTexture(unit);gl.depthMask(true);gl.disable(gl.BLEND);
 }
}
