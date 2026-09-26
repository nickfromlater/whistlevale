import assert from 'node:assert/strict';
import {communityContext,read} from './community-lib.mjs';
const state=await communityContext();
const live=new Set(),deleted=new Set(),uniforms=new Map();let serial=0,draws=0,map=false,throwDraw=false;
const values=new Map(),textures=new Map();
const names=['FRAMEBUFFER_BINDING','VIEWPORT','ACTIVE_TEXTURE','RENDERBUFFER_BINDING','FRONT_FACE','TEXTURE_BINDING_2D','FRAMEBUFFER','TEXTURE_2D','TEXTURE7','TEXTURE2','CCW','CW','RENDERBUFFER','RGBA8','RGBA','UNSIGNED_BYTE','TEXTURE_MIN_FILTER','TEXTURE_MAG_FILTER','LINEAR','TEXTURE_WRAP_S','TEXTURE_WRAP_T','CLAMP_TO_EDGE','COLOR_ATTACHMENT0','DEPTH_COMPONENT16','DEPTH_ATTACHMENT','FRAMEBUFFER_COMPLETE','COLOR_BUFFER_BIT','DEPTH_BUFFER_BIT','BLEND'];
const gl=Object.fromEntries(names.map((n,i)=>[n,i+1]));
const make=kind=>{const o={id:++serial,kind};live.add(o);return o;};
const release=o=>{if(!o)return;assert.ok(live.has(o)&&!deleted.has(o),'resource released once');live.delete(o);deleted.add(o);};
Object.assign(gl,{
 createFramebuffer:()=>make('framebuffer'),createRenderbuffer:()=>make('depth'),createTexture:()=>make('texture'),deleteFramebuffer:release,deleteRenderbuffer:release,deleteTexture:release,
 getParameter:key=>key===gl.TEXTURE_BINDING_2D?textures.get(values.get(gl.ACTIVE_TEXTURE)):values.get(key),
 activeTexture:unit=>values.set(gl.ACTIVE_TEXTURE,unit),bindTexture:(_,texture)=>textures.set(values.get(gl.ACTIVE_TEXTURE),texture),
 bindFramebuffer:(_,buffer)=>values.set(gl.FRAMEBUFFER_BINDING,buffer),bindRenderbuffer:(_,buffer)=>values.set(gl.RENDERBUFFER_BINDING,buffer),viewport:(...v)=>values.set(gl.VIEWPORT,v),frontFace:v=>values.set(gl.FRONT_FACE,v),
 getUniformLocation:(_,name)=>name,uniform1f:(n,v)=>uniforms.set(n,v),uniform1i:(n,v)=>uniforms.set(n,v),uniform2f:(n,...v)=>uniforms.set(n,v),uniform3fv:(n,v)=>uniforms.set(n,Array.from(v)),uniformMatrix4fv:(n,_,v)=>uniforms.set(n,Array.from(v)),
 checkFramebufferStatus:()=>gl.incomplete?0:gl.FRAMEBUFFER_COMPLETE,isContextLost:()=>!!gl.lost,
 texImage2D(){},texParameteri(){},framebufferTexture2D(){},renderbufferStorage(){},framebufferRenderbuffer(){},clearColor(){},clear(){},depthMask(){},disable(){}
});
const outerFramebuffer={},outerDepth={},oldTexture={};
values.set(gl.FRAMEBUFFER_BINDING,outerFramebuffer);values.set(gl.RENDERBUFFER_BINDING,outerDepth);values.set(gl.VIEWPORT,[0,0,1440,1024]);values.set(gl.ACTIVE_TEXTURE,gl.TEXTURE2);values.set(gl.FRONT_FACE,gl.CCW);textures.set(gl.TEXTURE7,oldTexture);
Object.assign(state.context,{fixtureGL:gl,VENETIAN:{water:-.65},hobby:{room:'venetian',scene:{venetian:{},trains:[{distance:0}]}},isShopMapActive:()=>map,drawHouseRoom(){draws++;assert.equal(uniforms.get('uVenetianReflectionPass'),1);assert.equal(textures.get(gl.TEXTURE7),null,'attached target is not sampled');assert.equal(values.get(gl.FRONT_FACE),gl.CW);assert.ok(uniforms.get('uEye')[1]<-.65,'eye reflected below water');if(throwDraw)throw new Error('injected reflection draw failure');},drawHouseTrains(){}});
state.run(await read('src/rooms/venetian-render.js'));
state.run("gl=fixtureGL;mainProgram={u:{}};screenW=1440;screenH=1024;cameraPos=[10,20,30];cameraTarget=[0,4,0];VP=I;clock=0;drawArchitecturalGlass=function(){};");
const prepare=()=>state.run('venetianPrepareReflection()');
const restored=()=>{assert.equal(values.get(gl.FRAMEBUFFER_BINDING),outerFramebuffer);assert.equal(values.get(gl.RENDERBUFFER_BINDING),outerDepth);assert.deepEqual(values.get(gl.VIEWPORT),[0,0,1440,1024]);assert.equal(values.get(gl.ACTIVE_TEXTURE),gl.TEXTURE2);assert.equal(values.get(gl.FRONT_FACE),gl.CCW);assert.deepEqual(uniforms.get('uEye'),[10,20,30]);assert.equal(uniforms.get('uVenetianReflectionPass'),0);assert.equal(state.run('cameraPos[1]'),20);assert.equal(state.run('cameraTarget[1]'),4);};
prepare();restored();assert.equal(live.size,3);assert.equal(draws,1);prepare();assert.equal(draws,1,'unchanged view reuses reflection');restored();
state.run('clock=.1;');prepare();assert.equal(draws,2,'time invalidates reflection');restored();
state.run('screenW=390;screenH=844;innerWidth=390;');prepare();assert.equal(live.size,3);assert.equal(deleted.size,3,'resize releases previous target');restored();
map=true;prepare();assert.equal(live.size,0,'map owns no reflection target');assert.equal(uniforms.get('uVenetianReflectionReady'),0);
map=false;gl.incomplete=true;prepare();restored();const allocated=serial;prepare();assert.equal(serial,allocated,'incomplete target is not retried each frame');assert.equal(uniforms.get('uVenetianReflectionReady'),0);state.run('venetianDisposeReflection()');assert.equal(live.size,0);
gl.incomplete=false;throwDraw=true;assert.throws(prepare,/injected/);restored();assert.equal(uniforms.get('uVenetianReflectionReady'),0);throwDraw=false;prepare();assert.equal(uniforms.get('uVenetianReflectionReady'),1);restored();
state.context.hobby.scene={venetian:{},trains:[]};prepare();assert.equal(live.size,3,'scene replacement owns one target');restored();
state.run('venetianDisposeReflection()');gl.lost=true;prepare();assert.equal(live.size,0,'lost context allocates nothing');gl.lost=false;
state.context.hobby.room='coast';prepare();assert.equal(live.size,0);assert.equal(uniforms.get('uVenetianReflectionReady'),0);
console.log('Venetian reflection: bounded allocation, reuse, mirrored camera, map/resize/scene disposal, failure fallback and complete host-state recovery passed.');
