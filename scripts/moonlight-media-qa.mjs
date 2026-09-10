#!/usr/bin/env node
// Exercise decoder ownership, stale callbacks, GL state and actual portable media.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=await readFile(path.join(root,'src/moonlight-projection.js'),'utf8');
class Events{
 constructor(){this.listeners=new Map();}
 addEventListener(type,fn){if(!this.listeners.has(type))this.listeners.set(type,new Set());this.listeners.get(type).add(fn);}
 removeEventListener(type,fn){this.listeners.get(type)?.delete(fn);}
 dispatch(type,event={}){for(const fn of this.listeners.get(type)||[])fn(event);}
}
class Element extends Events{
 constructor(tag){super();this.tag=tag;this.dataset={};this.attrs={};this.children=[];this.textContent='';this.value='';}
 setAttribute(name,value){this.attrs[name]=value;}
 append(...nodes){this.children.push(...nodes);}
 remove(){this.removed=true;}
 set innerHTML(value){throw new Error('User text must never become HTML: '+value);}
}
const descendant=(node,predicate)=>predicate(node)?node:node.children?.map(child=>descendant(child,predicate)).find(Boolean);
function fixture({frames=true,rejectPlay=false,saved={},storageBlocked=false,embeddedFilm}={}){
 const globalEvents=new Events(),document=new Events(),images=[],videos=[],canvases=[],uploads=[],textures=[],deleted=[],stored=new Map([['whistlevale-moonlight-v1',JSON.stringify(saved)]]),bindings=new Map([[4,{name:'prior-four'}],[7,{name:'prior-seven'}]]);
 document.hidden=false;document.body={append(video){video.appended=true;}};
 const gl={canvas:new Events(),ACTIVE_TEXTURE:1,TEXTURE_BINDING_2D:2,UNPACK_FLIP_Y_WEBGL:3,UNPACK_ALIGNMENT:4,TEXTURE0:0,TEXTURE_2D:10,RGBA:11,UNSIGNED_BYTE:12,LINEAR:13,CLAMP_TO_EDGE:14,TEXTURE_MIN_FILTER:15,TEXTURE_MAG_FILTER:16,TEXTURE_WRAP_S:17,TEXTURE_WRAP_T:18,
  active:7,flip:false,alignment:8,lost:false,isContextLost(){return this.lost;},
  getParameter(key){return key===this.ACTIVE_TEXTURE?this.active:key===this.TEXTURE_BINDING_2D?bindings.get(this.active):key===this.UNPACK_FLIP_Y_WEBGL?this.flip:this.alignment;},
  activeTexture(unit){this.active=unit;},bindTexture(target,value){bindings.set(this.active,value);},pixelStorei(key,value){if(key===this.UNPACK_FLIP_Y_WEBGL)this.flip=value;else this.alignment=value;},
  createTexture(){const texture={id:textures.length};textures.push(texture);return texture;},deleteTexture(texture){deleted.push(texture);},
  texImage2D(...args){uploads.push(args.at(-1));},texParameteri(){}
 };
 const gpu={uploads:[],draws:[],deleted:[],uniforms:{},program:null,vao:null,depth:true,blend:false};
 Object.assign(gl,{VERTEX_SHADER:20,FRAGMENT_SHADER:21,COMPILE_STATUS:22,LINK_STATUS:23,ARRAY_BUFFER:24,STATIC_DRAW:25,FLOAT:26,BLEND:27,SRC_ALPHA:28,ONE:29,ONE_MINUS_SRC_ALPHA:30,POINTS:31,
  createShader:()=>({}),shaderSource(){},compileShader(){},getShaderParameter:()=>true,attachShader(){},deleteShader(){},createProgram:()=>({}),linkProgram(){},getProgramParameter:()=>true,getUniformLocation:(p,n)=>n,
  createBuffer:()=>({}),createVertexArray:()=>({}),bindVertexArray:v=>gpu.vao=v,bindBuffer(){},bufferData:(target,data,usage)=>gpu.uploads.push({data,usage}),enableVertexAttribArray(){},vertexAttribPointer(){},
  useProgram:p=>gpu.program=p,uniformMatrix4fv:(n,t,v)=>gpu.uniforms[n]=v,uniform3fv:(n,v)=>gpu.uniforms[n]=v,uniform1f:(n,v)=>gpu.uniforms[n]=v,uniform1i:(n,v)=>gpu.uniforms[n]=v,
  enable:()=>gpu.blend=true,disable:()=>gpu.blend=false,depthMask:v=>gpu.depth=v,blendFunc:(a,b)=>gpu.blendMode=[a,b],drawArrays:(mode,start,count)=>{if(gpu.fail)throw Error('draw interrupted');gpu.draws.push({mode,count,uniforms:{...gpu.uniforms},depth:gpu.depth,blend:gpu.blendMode});},
  deleteBuffer:v=>gpu.deleted.push(v),deleteVertexArray:v=>gpu.deleted.push(v),deleteProgram:v=>gpu.deleted.push(v)});
 document.createElement=tag=>{
  if(tag==='canvas'){const canvas=new Element('canvas'),context={text:[],fillRect(){},strokeRect(){},fillText(text){this.text.push(text);},measureText(text){return{width:Array.from(text).length*parseInt(this.font,10)*.6};}};canvas.getContext=()=>context;canvas.context=context;canvases.push(canvas);return canvas;}
  if(tag!=='video')return new Element(tag);
  const video={dataset:{},attrs:{},currentTime:0,duration:64,readyState:0,paused:true,playCalls:0,pauseCalls:0,loadCalls:0,callbacks:new Map(),nextCallback:1,
   setAttribute(name,value){this.attrs[name]=value;},removeAttribute(name){delete this[name];},remove(){this.removed=true;},
   play(){this.playCalls++;if(rejectPlay)return Promise.reject(new Error('autoplay denied'));this.paused=false;return Promise.resolve();},pause(){this.pauseCalls++;this.paused=true;},load(){this.loadCalls++;},
   requestVideoFrameCallback:frames?function(fn){const id=this.nextCallback++;this.callbacks.set(id,fn);return id;}:undefined,
   cancelVideoFrameCallback(id){this.callbacks.delete(id);}
  };videos.push(video);return video;
 };
 const context=vm.createContext({console,document,performance:{now:()=>0},Uint8Array,Image:class{constructor(){images.push(this);}},
  HOUSE_EMBEDDED_MOONLIGHT:embeddedFilm?{film:embeddedFilm}:undefined,localStorage:{getItem(key){if(storageBlocked)throw new Error('blocked');return stored.get(key)||null;},setItem(key,value){if(storageBlocked)throw new Error('blocked');stored.set(key,value);}},
  addEventListener:globalEvents.addEventListener.bind(globalEvents),removeEventListener:globalEvents.removeEventListener.bind(globalEvents)});
 vm.runInContext(source,context);const controller=vm.runInContext('createMoonlightProjection',context)(gl);
 return{gpu,context,controller,document,images,videos,canvases,uploads,textures,deleted,gl,bindings,globalEvents,stored};
}
const viewing={visible:true,active:true,paused:false,reduced:false};
{
 const f=fixture(),c=f.controller,g=f.gpu,model=[.3,0,0,0,0,.3,0,0,0,0,.3,0,-2.5,1,17,1],vp=Array(16).fill(0),program={name:'room'};
 const options={vp,model,eye:[0,6,24],height:900,night:1,restoreProgram:program,restoreUnit:2};
 c.drawAir(options);assert.equal(g.uploads.length,0,'unseen exhibits allocate no dust buffer');
 c.update({visible:true,active:false});f.images[0].onload();c.drawAir(options);assert.equal(g.uploads.length,0,'map and distant views omit projection dust');
 c.update({...viewing,now:100});c.drawAir(options);
 assert.equal(g.uploads.length,1);assert.equal(g.uploads[0].data.byteLength,86400,'dust has a fixed small buffer');assert.equal(g.uploads[0].usage,f.gl.STATIC_DRAW);
 assert.deepEqual(Array.from(g.uploads[0].data),Array.from(vm.runInContext('moonlightAirSeeds()',f.context)),'seed generation is repeatable without consuming the scenery random sequence');
 assert.ok(g.uploads[0].data.every(Number.isFinite));assert.equal(g.draws[0].count,3600);assert.equal(g.draws[0].depth,false,'particles cannot write opaque depth');assert.deepEqual(g.draws[0].blend,[f.gl.SRC_ALPHA,f.gl.ONE]);
 assert.equal(g.draws[0].uniforms.uModel,model,'dust follows the actual placed model transform');assert.equal(g.draws[0].uniforms.uVP,vp);assert.equal(g.draws[0].uniforms.uFilm,4,'dust samples the same picture as the screen');
 for(let now=116;now<500;now+=16){c.update({...viewing,now});c.drawAir(options);}
 assert.equal(g.uploads.length,1,'animation never reuploads particle data');assert.ok(g.draws.at(-1).uniforms.uTime>g.draws[0].uniforms.uTime,'drift advances through the existing renderer update');
 const time=g.draws.at(-1).uniforms.uTime;c.toggle();c.update({...viewing,now:600});c.drawAir(options);assert.equal(g.draws.at(-1).uniforms.uTime,time,'visitor pause freezes dust drift');assert.equal(g.draws.at(-1).uniforms.uPower,.28);
 c.update({...viewing,reduced:true,now:700});c.drawAir(options);assert.equal(g.draws.at(-1).uniforms.uTime,0,'reduced motion renders stationary dust');
 const count=g.draws.length;f.document.hidden=true;f.document.dispatch('visibilitychange');c.drawAir(options);assert.equal(g.draws.length,count,'hidden tabs cannot draw');f.document.hidden=false;
 f.globalEvents.dispatch('pagehide',{persisted:true});c.drawAir(options);assert.equal(g.draws.length,count,'BFCache suspension cannot draw');f.globalEvents.dispatch('pageshow');
 g.fail=true;assert.throws(()=>c.drawAir(options),/draw interrupted/);assert.equal(g.depth,true);assert.equal(g.blend,false);assert.equal(g.vao,null);assert.equal(g.program,program);assert.equal(f.gl.active,2,'even interrupted draws restore the renderer pass');g.fail=false;
 c.dispose();assert.equal(g.deleted.length,3,'disposal releases the owned dust buffer, VAO and shader program');c.dispose();assert.equal(g.deleted.length,3);c.drawAir(options);assert.equal(g.draws.length,count);
}

{
 const f=fixture(),c=f.controller,prior=f.bindings.get(7);c.update({visible:false,active:false});
 assert.equal(f.images.length+f.videos.length+f.textures.length,0,'unseen models allocate no media or texture');
 const fallback={name:'atlas'};c.bind(4,fallback);assert.equal(f.bindings.get(4),fallback);assert.equal(f.gl.active,7,'binding restores the active unit');
 c.bind(4,fallback,2);assert.equal(f.gl.active,2,'renderer-known restore units need no synchronous state query');f.gl.active=7;
 c.update({visible:true,active:false});assert.equal(f.images.length,1);assert.equal(f.videos.length,0,'map and distant views fetch only the poster');
 f.images[0].onload();assert.equal(f.uploads.at(-1),f.images[0]);assert.equal(f.gl.active,7);assert.equal(f.gl.flip,false);assert.equal(f.gl.alignment,8);assert.equal(f.bindings.get(7),prior,'uploads preserve texture binding and unpack state');
 c.update(viewing);const video=f.videos[0];assert.equal(video.muted,true);assert.equal(video.defaultMuted,true);assert.equal(video.playsInline,true);assert.equal(video.loop,true);assert.equal(video.hidden,true);assert.equal(video.attrs['aria-hidden'],'true');
 video.readyState=2;video.currentTime=12.5;video.onloadeddata();video.onplaying();c.update({...viewing,now:100});const uploadCount=f.uploads.length;
 c.update({...viewing,now:116});c.update({...viewing,now:160});assert.equal(f.uploads.length,uploadCount,'unchanged video frames are never uploaded twice');
 const callback=video.callbacks.values().next().value;callback();video.currentTime+=1/24;c.update({...viewing,now:180});assert.equal(f.uploads.length,uploadCount+1);
 c.update({visible:true,active:false});assert.equal(video.paused,true);assert.equal(video.src,undefined);assert.equal(video.removed,true);assert.equal(video.loadCalls,1,'leaving viewing range releases the decoder');
 callback();c.update({visible:false,active:false,now:250});assert.equal(f.videos.length,1,'a stale frame callback cannot recreate a decoder');
 c.update(viewing);const resumed=f.videos[1];resumed.onloadedmetadata();assert.ok(Math.abs(resumed.currentTime-video.currentTime)<1e-6,'re-entry resumes the last picture position');
 resumed.onplaying();callback();
 f.document.hidden=true;f.document.dispatch('visibilitychange');assert.equal(resumed.src,undefined,'hiding the document releases media even while renderer frames are suspended');
 assert.equal(resumed.callbacks.size,0,'a stale callback cannot erase the new decoder callback handle and defeat cancellation');
 f.document.hidden=false;f.document.dispatch('visibilitychange');assert.equal(f.videos.length,3);
 c.dispose();assert.equal(f.deleted.length,f.textures.length);assert.equal(f.gl.canvas.listeners.get('webglcontextlost').size,0);assert.equal(f.document.listeners.get('visibilitychange').size,0);
 c.update(viewing);assert.equal(f.videos.length,3,'disposed projections cannot resurrect');
}
{
 const f=fixture(),c=f.controller;c.update(viewing);const video=f.videos[0];
 f.globalEvents.dispatch('pagehide',{persisted:true});assert.equal(video.src,undefined,'back-forward cache suspension releases the decoder');
 c.update(viewing);assert.equal(f.videos.length,1,'a cached page cannot decode while suspended');assert.equal(f.deleted.length,0,'a cached page keeps its valid screen texture');
 f.globalEvents.dispatch('pageshow',{persisted:true});assert.equal(f.videos.length,2,'browser Back restores film playback without reloading the scene');
 f.globalEvents.dispatch('pagehide',{persisted:false});assert.equal(f.deleted.length,f.textures.length,'a real departure releases every owned texture');
 assert.equal(f.globalEvents.listeners.get('pageshow').size,0);c.update(viewing);assert.equal(f.videos.length,2,'a departed page cannot restart media');
}
{
 const f=fixture(),c=f.controller;const button=Object.assign(new Events(),{dataset:{},attrs:{},setAttribute(name,value){this.attrs[name]=value;}});c.setControl(button);
 c.update({...viewing,reduced:true});assert.equal(f.videos.length,0);assert.equal(button.textContent,'Play film','reduced motion shows a still by default');
 assert.equal(button.hidden,false,'a nearby screen exposes its contextual film control');
 button.dispatch('click');assert.equal(f.videos.length,1,'explicit play can override reduced motion');assert.equal(button.textContent,'Pause film');
 c.update({...viewing,reduced:true,paused:true});assert.equal(f.videos[0].src,undefined,'global pause still wins over an explicit play request');assert.equal(button.disabled,true,'film control does not offer an ineffective action while the whole scene is paused');
 c.update({...viewing,reduced:true});button.dispatch('click');assert.equal(button.textContent,'Play film');const count=f.videos.length;c.update(viewing);assert.equal(f.videos.length,count,'user pause survives later frame updates');c.update({visible:true,active:false});assert.equal(button.hidden,true,'distant and map views hide the film control');c.dispose();
}
{
 const f=fixture({rejectPlay:true});f.controller.update(viewing);await Promise.resolve();assert.equal(f.videos[0].src,undefined,'blocked autoplay releases the failed decoder');
 for(let i=0;i<10;i++)f.controller.update(viewing);assert.equal(f.videos.length,1,'autoplay rejection is not retried on every frame');f.controller.toggle();assert.equal(f.videos.length,2,'an explicit click can retry autoplay');await Promise.resolve();f.controller.dispose();
}
{
 const f=fixture(),c=f.controller;c.update(viewing);const video=f.videos[0];
 video.readyState=2;video.currentTime=1;video.onplaying();c.update({...viewing,now:100});const count=f.uploads.length;
 // The API exists, but this hidden video never receives its scheduled callback.
 video.currentTime=1.1;c.update({...viewing,now:110});assert.equal(f.uploads.length,count,'silent callback fallback keeps the upload cap');
 c.update({...viewing,now:150});assert.equal(f.uploads.length,count+1,'advancing video updates the projection even when frame callbacks stall');
 c.update({...viewing,now:200});assert.equal(f.uploads.length,count+1,'a stationary frame is not uploaded again');
 video.currentTime=.02;c.update({...viewing,now:250});assert.equal(f.uploads.length,count+2,'the fallback also refreshes after the film loops');
 c.toggle();const stopped=f.uploads.length;c.update({...viewing,now:300});assert.equal(f.uploads.length,stopped,'fallback does not override the visitor pause');c.dispose();
}
{
 const f=fixture({frames:false});f.controller.update(viewing);const video=f.videos[0];video.readyState=2;video.currentTime=1;f.controller.update({...viewing,now:100});const count=f.uploads.length;
 video.currentTime=2;f.controller.update({...viewing,now:110});assert.equal(f.uploads.length,count,'older browsers throttle texture uploads to 24fps');
 f.controller.update({...viewing,now:150});assert.equal(f.uploads.length,count+1);f.controller.update({...viewing,now:200});assert.equal(f.uploads.length,count+1,'fallback also skips identical playback times');
 f.gl.lost=true;f.gl.canvas.dispatch('webglcontextlost');assert.equal(video.src,undefined);f.controller.update(viewing);assert.equal(f.videos.length,1);f.controller.dispose();assert.equal(f.deleted.length,0,'lost GPU resources are not reused or deleted through a dead context');
}
{
 const f=fixture({saved:{name:'  Noe\u0308l\n🚂  ',film:'https://outside.invalid/movie.mp4'}}),c=f.controller;
 assert.equal(f.textures.length+f.images.length+f.videos.length+f.canvases.length,0,'restoring local preferences loads no media');
 assert.equal(vm.runInContext('moonlightExportPreferences().film',f.context),'trip-to-the-moon','unreviewed stored movie URLs fall back to the programme');
 c.update({visible:false,active:false,nameplateVisible:true});assert.equal(f.images.length+f.videos.length,0,'a booth-only view does not load the film screen');
 assert.equal(f.canvases[0].context.text.at(-1),'Noël 🚂','names use trimmed whitespace and Unicode normalization');
 const prior=f.bindings.get(7);c.bindNameplate(5,{name:'atlas'});assert.equal(f.gl.active,7);assert.equal(f.bindings.get(7),prior);
 let count=f.uploads.length;for(let i=0;i<10;i++)c.update({nameplateVisible:true});assert.equal(f.uploads.length,count,'the nameplate is never redrawn on ordinary frames');
 const name=c.setName('🚂'.repeat(40));assert.equal(Array.from(name).length,32);assert.equal(name,'🚂'.repeat(32),'Unicode names are not split at surrogate boundaries');assert.equal(f.uploads.length,count+1);
 count=f.uploads.length;c.setName(name);assert.equal(f.uploads.length,count,'submitting the same name does not update its texture');
 assert.equal(c.setName(' \ud800<Nick & Co.>\u202e '),'<Nick & Co.>','invalid surrogates and direction overrides are stripped while literal text stays literal');
 assert.equal(f.canvases[0].context.text.at(-1),'<Nick & Co.>','nameplate text is drawn as canvas text, never HTML');
 assert.equal(JSON.parse(f.stored.get('whistlevale-moonlight-v1')).name,'<Nick & Co.>');
 assert.deepEqual(Object.keys(vm.runInContext('moonlightExportPreferences()',f.context)),['film'],'personal names never enter exported preferences');
 c.update({nameplateVisible:false});count=f.uploads.length;c.setName('A new visitor');assert.equal(f.uploads.length,count,'hidden name changes wait until the plaque can be seen');
 c.update({nameplateVisible:true});assert.equal(f.uploads.length,count+1);c.dispose();assert.equal(f.deleted.length,f.textures.length);
}
{
 const f=fixture(),c=f.controller;assert.equal(c.selectFilm('arrival'),true);assert.equal(f.images.length+f.videos.length,0,'choosing a film outside the view does not preload it');
 c.update(viewing);const arrival=f.videos[0],oldPoster=f.images[0],latePoster=oldPoster.onload;assert.match(arrival.src,/arrival-clip\.mp4$/);arrival.currentTime=25;
 assert.equal(c.selectFilm('train-robbery'),true);const robbery=f.videos[1];assert.equal(arrival.src,undefined);assert.equal(arrival.removed,true,'choosing another film releases the old decoder');assert.match(robbery.src,/train-robbery-clip\.mp4$/);
 robbery.onloadedmetadata();assert.equal(robbery.currentTime,0,'a different movie starts at its own beginning');const uploads=f.uploads.length;latePoster();assert.equal(f.uploads.length,uploads,'a late previous poster cannot overwrite the new film');
 assert.equal(c.selectFilm('../private.mp4'),false);assert.equal(f.videos.length,2,'only reviewed programme IDs can create media requests');
 assert.equal(JSON.parse(f.stored.get('whistlevale-moonlight-v1')).film,'train-robbery');assert.equal(vm.runInContext('moonlightExportPreferences().film',f.context),'train-robbery');
 c.toggle();const count=f.videos.length;c.selectFilm('trip-to-the-moon');assert.equal(f.videos.length,count,'changing the programme preserves a visitor’s pause choice');c.dispose();
}
{
 const f=fixture({storageBlocked:true}),c=f.controller;let boothViews=0;const panel=c.createProgramme({onBoothView:()=>boothViews++}),input=descendant(panel,node=>node.tag==='input'),form=descendant(panel,node=>node.tag==='form'),summary=descendant(panel,node=>node.tag==='summary'),clear=descendant(panel,node=>node.textContent==='Clear name'),booth=descendant(panel,node=>node.textContent==='Look at the booth'),status=descendant(panel,node=>node.attrs?.role==='status');
 assert.equal(clear.hidden,true);assert.equal(input.maxLength,128,'input capacity does not truncate Unicode to 16 emoji');input.value='  Ada <3  ';form.dispatch('submit',{preventDefault(){}});
 assert.equal(input.value,'Ada <3');assert.equal(summary.textContent,'Projectionist: Ada <3');assert.match(status.textContent,/for this visit/,'blocked storage still works without claiming persistence');assert.equal(clear.hidden,false);
 booth.dispatch('click');assert.equal(boothViews,1,'the optional booth action calls the supplied camera action');clear.dispatch('click');assert.equal(input.value,'');assert.equal(clear.hidden,true);assert.equal(summary.textContent,'Put your name on the booth');
 const select=descendant(panel,node=>node.tag==='select');assert.equal(select.children.length,3);select.value='arrival';select.dispatch('change');assert.equal(select.value,'arrival');assert.equal(f.videos.length,0,'programme controls do not bypass nearby playback gating');
 c.setProgramme(null);input.value='Detached name';form.dispatch('submit',{preventDefault(){}});assert.equal(summary.textContent,'Put your name on the booth','closing the programme removes its form handlers');booth.dispatch('click');assert.equal(boothViews,1);c.dispose();
}
{
 const f=fixture({saved:{film:'arrival',name:'Local visitor'},embeddedFilm:'train-robbery'});assert.equal(vm.runInContext('moonlightExportPreferences().film',f.context),'train-robbery','portable movie selection overrides this device’s saved movie');
 f.controller.update({nameplateVisible:true});assert.equal(f.canvases[0].context.text.at(-1),'Local visitor','the booth still gets its name only from this device');f.controller.dispose();
}

const expected={
 'assets/moonlight/moon-clip.mp4':'ee37b5d47f682d0c2d91cf66c64a141ba3a59a47d18680f17c008a8677fd8a55',
 'assets/moonlight/poster.jpg':'1d425efa19609c0f205a65837feb865a655a8d684ae3d4d66c58fbb3e755f31a',
 'assets/moonlight/arrival-clip.mp4':'adcf980785cb876f55475436e9770f19ea4508f973b9c6394b16363238d02b5e',
 'assets/moonlight/arrival-poster.jpg':'addde7bdbd2a869ddf2c5ce9777fbea0df3a6078aa94c351a25405e85f5ef28d',
 'assets/moonlight/train-robbery-clip.mp4':'344df243849fda9511a590559569a55e469ee6e25816545f51e7e67ffd4483cd',
 'assets/moonlight/train-robbery-poster.jpg':'74ddb90380f1c7e4d7f2b0765f75669a7d80f6d2b33513bad9021336803f9cf0'
};
const requested=[];const packing=vm.createContext({fetch:async file=>{requested.push(file);return new Response(await readFile(path.join(root,file)),{headers:{'Content-Type':file.endsWith('.mp4')?'video/mp4':'image/jpeg'}});},
 FileReader:class{async readAsDataURL(blob){this.result='data:'+blob.type+';base64,'+Buffer.from(await blob.arrayBuffer()).toString('base64');this.onload();}}});
vm.runInContext(source,packing);const media=await vm.runInContext('packMoonlightMedia()',packing);
for(const [file,digest]of Object.entries(expected))assert.equal(createHash('sha256').update(Buffer.from(media[file].split(',')[1],'base64')).digest('hex'),digest,'portable media preserves the original bytes');
packing.HOUSE_EMBEDDED_MEDIA=media;await vm.runInContext('packMoonlightMedia()',packing);assert.equal(requested.length,Object.keys(expected).length,'re-export reuses all embedded movie/poster pairs without a network request');
assert.match(vm.runInContext("moonlightMediaURL('film')",packing),/^data:video\/mp4;base64,/,'portable file and Blob pages resolve the embedded picture');
const hobby=await readFile(path.join(root,'src/hobby.js'),'utf8');const destination=hobby.slice(hobby.indexOf('function visitHouseDestination('),hobby.indexOf('\nfunction visitHouseRoom('));let blob;
const navigation=vm.createContext({window:{HOUSE_EMBEDDED_HALL:'<!doctype html><head></head><body></body>',HOUSE_EMBEDDED_MEDIA:media},HOUSE_ROOMS:{hall:{name:'The Grand Hall',map:{destination:'grandhall.html'}}},hobby:{room:'valley'},location:{href:'file:///portable.html',assign(){}},URL:{createObjectURL(value){blob=value;return'blob:portable';}},Blob:class{constructor(parts){this.text=parts.join('');}}});
vm.runInContext(destination+';visitHouseDestination("hall");',navigation);const transported={window:{}};vm.runInNewContext(blob.text.match(/<script>([\s\S]*?)<\/script>/)[1],transported);
assert.equal(createHash('sha256').update(JSON.stringify(transported.window.HOUSE_EMBEDDED_MEDIA)).digest('hex'),createHash('sha256').update(JSON.stringify(media)).digest('hex'),'opening the exported Hall carries its movie without external URLs');
assert.equal(blob.text.split(media['assets/moonlight/moon-clip.mp4']).length-1,1,'the portable Hall receives one film payload');

execFileSync('python3',['-c',String.raw`
import importlib.util, io
from pathlib import Path
from email.message import Message
spec=importlib.util.spec_from_file_location('preview', 'scripts/serve.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
media=Path('assets/moonlight/moon-clip.mp4');original=media.read_bytes();size=len(original)
def request(value=None, method='GET'):
    h=module.Handler.__new__(module.Handler);h.headers=Message();h.command=method;h.wfile=io.BytesIO();h.sent={}
    if value is not None:h.headers['Range']=value
    h.send_response=lambda code:setattr(h,'status',code)
    h.send_header=lambda key,value:h.sent.update({key:value})
    h.end_headers=lambda:None
    h.send_video(media)
    return h.status,h.sent,h.wfile.getvalue()
for value,span in [('bytes=0-1',(0,1)),('bytes=100-199',(100,199)),('bytes=-17',(size-17,size-1)),('bytes=4141500-',(4141500,size-1)),('bytes=0-99999999',(0,size-1))]:
    status,headers,body=request(value);start,end=span
    assert status==206 and body==original[start:end+1]
    assert headers['Content-Range']==f'bytes {start}-{end}/{size}' and headers['Content-Length']==str(len(body))
for value in ['bytes=99999999-','bytes=3-1','bytes=-0','bytes=-','bytes=1-3,5-7']:
    status,headers,body=request(value)
    assert status==416 and not body and headers['Content-Range']==f'bytes */{size}'
status,headers,body=request('bytes=4-8','HEAD');assert status==206 and not body and headers['Content-Length']=='5'
status,headers,body=request();assert status==200 and body==original and headers['Accept-Ranges']=='bytes'
print('Local MP4 range, suffix, HEAD and invalid-range responses passed.')
`],{cwd:root,stdio:'inherit'});
console.log('Moonlight media: lazy programme playback, Unicode nameplates, local privacy, frame uploads, pause/reduced motion, disposal, GL state, original bytes and portable Hall passed.');
