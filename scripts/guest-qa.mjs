#!/usr/bin/env node
// Camera equivalence, native depth geometry, attribution atlas and cancellable
// room residency. Uses the real vendored math library, without a GPU or install.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import * as THREE from '../vendor/mountain-railway-diorama/vendor/three.module.js';
import {communityContext,loadContributionDefinitions,prepareCommunityGeometry,read} from './community-lib.mjs';

const f=await communityContext();await loadContributionDefinitions(f,JSON.parse(await read('contributions/world.json')));
const paints=[],uploads=[];f.context.paints=paints;f.context.atlasUploads=uploads;
f.run(`const savedArtSlot=artSlot;artSlot=function(key,x,y,w,h,paint){paints.push({key,x,y,w,h});return savedArtSlot(key,x,y,w,h,paint);};`);
prepareCommunityGeometry(f);
f.context.THREE=THREE;
const record=JSON.parse(f.run('JSON.stringify(YAMAAI_PROJECT)'));
assert.equal(record.credits[0].handle,'techartist_');assert.equal(record.credits[1].handle,'iamtechartist');
assert.equal(f.run('HOUSE_ROOMS.yamaai.name'),record.roomName);
assert.ok(f.run('HOUSE_ROOMS.yamaai.tag').includes(record.credits[0].name.toUpperCase()));
assert.ok(f.run('HOUSE_ROOMS.yamaai.description').includes(record.title));
assert.deepEqual(JSON.parse(f.run('JSON.stringify(HOUSE_ROOMS.yamaai.credits)')),[...record.credits,...record.hostCredits]);
// Coast paints on first room build, after the house atlas was first uploaded.
const plaque=paints.find(q=>q.key===record.plaque);assert.ok(plaque,'plaque allocated before room construction');
f.run('coastWindowArt()');
for(const other of paints){if(other.key===plaque.key)continue;assert.ok(plaque.x+plaque.w<=other.x||other.x+other.w<=plaque.x||plaque.y+plaque.h<=other.y||other.y+other.h<=plaque.y,`guest credit must not overlap ${other.key}`);}
f.run(`gl.texImage2D=function(){atlasUploads.push(paints.length);};initHouseArt();`);
assert.ok(uploads.length);assert.equal(paints[uploads.at(-1)-1].key,record.plaque,'credit paint precedes final texture upload');
const sign=JSON.parse(JSON.stringify(f.run(`(()=>{const b=new Builder();yamaaiPlaque(b);const text=[],front=[];for(let i=0;i<b.data.length;i+=12){if(b.data[i+9]===32)text.push(b.data.slice(i,i+12));if(b.data[i+9]===23)front.push(b.data[i+2]);}return {text,front};})()`)));
assert.equal(sign.text.length,6,'lettering has two real triangles');assert.ok(sign.text.every(v=>v[2]>Math.max(...sign.front)),'lettering sits in front of panel');
assert.ok(sign.text.every(v=>v[0]>29),'plaque clears the mountain on the back wall');
for(const [which,eye,expected] of [['back',[0,0,-70],false],['back',[0,0,0],true],['front',[0,0,70],false],['left',[-80,0,0],false],['right',[80,0,0],false]]){
 f.context.wallWhich=which;f.context.wallEye=eye;assert.equal(f.run('houseRoomWallVisible(wallWhich,wallEye)'),expected);
}
// House points and miniature points must produce exactly the same screen/depth
// coordinates, including off-axis projections and near-plane scaling.
for(const scale of [.2,.49721,1.4])for(const yaw of [-.8,0,1.7]){
 const model=new THREE.Matrix4().compose(new THREE.Vector3(3,-5,-2),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),yaw),new THREE.Vector3(scale,scale,scale)),inverse=model.clone().invert();
 const house=new THREE.PerspectiveCamera(43,1.73,.4,500);house.position.set(60,30,110);house.lookAt(0,4,0);house.updateMatrixWorld(true);house.projectionMatrix.elements[8]=.13;house.projectionMatrix.elements[9]=-.08;
 const guest=new THREE.PerspectiveCamera();f.context.guestCamera=guest;f.context.inverse=inverse;f.context.fixtureScale=scale;f.context.cameraState={eye:house.position.toArray(),target:[0,4,0],projection:house.projectionMatrix.elements,near:.4};
 f.run('yamaaiCamera(THREE,guestCamera,cameraState,inverse,fixtureScale)');
 for(let i=0;i<150;i++){
  const local=new THREE.Vector3(Math.sin(i)*60,Math.cos(i*.7)*30,Math.sin(i*.3)*45),a=local.clone().applyMatrix4(model).project(house),b=local.clone().project(guest);
  assert.ok(a.distanceTo(b)<1e-10,'camera parallax and depth match the house');
 }
}
// Depth copies compact/interleaved house vertices and uint32 indices exactly;
// only positions survive. The original COPY_READ_BUFFER binding is restored.
const packed=new Float32Array(36);packed.set([0,1,2],0);packed.set([3,4,5],12);packed.set([6,7,8],24);
const buffers=new Map([['vertices',packed],['indices',new Uint32Array([2,0,1])]]);let binding='original';
f.context.depthGL={COPY_READ_BUFFER:1,COPY_READ_BUFFER_BINDING:2,BUFFER_SIZE:3,getParameter:()=>binding,bindBuffer:(_,v)=>{binding=v;},getBufferParameter:()=>buffers.get(binding).byteLength,getBufferSubData:(_,offset,out)=>out.set(buffers.get(binding))};
f.run('gl=depthGL');f.context.nativeDepthHost={mesh:{buf:'vertices',ibo:'indices',indexed:true,count:3},walls:[]};f.context.identity=new THREE.Matrix4();
const depth=f.run('embeddedRoomDepth(THREE,nativeDepthHost,identity)');assert.equal(binding,'original');assert.deepEqual(Array.from(depth.scene.children[0].geometry.attributes.position.array),[0,1,2,3,4,5,6,7,8]);assert.deepEqual(Array.from(depth.scene.children[0].geometry.index.array),[2,0,1]);assert.equal(depth.scene.children[0].material.colorWrite,false);
f.context.depthScene=depth.scene;f.run('yamaaiDisposeScene(depthScene)');

// Small DOM fixture: exercise actual entry, map, stale-load and exit code.
function node(tag='div'){
 const n={tag,children:[],dataset:{},style:{},hidden:false,classList:{add(){},remove(){}},setAttribute(){},append(...items){this.children.push(...items);},prepend(...items){this.children.unshift(...items);},replaceChildren(...items){this.children=items;},remove(){this.removed=true;}};
 n.querySelector=selector=>n.querySelectorAll(selector)[0]||null;
 n.querySelectorAll=selector=>n.children.flatMap(c=>typeof c==='object'?[...(selector==='#'+c.id||selector===c.tag||selector==='.'+(c.className||'').split(' ').join(' .')?[c]:[]),...c.querySelectorAll(selector)]:[]).filter(c=>!c.removed);return n;
}
const body=node('body'),head=node('head'),document={body,head,baseURI:'http://localhost/',createElement:node,getElementById:id=>body.querySelector('#'+id)};
let nextTimer=0,builds=0,frames=0,disposals=0,aborts=0;const timers=new Map(),resolvers=[];
const context=vm.createContext({document,URL,AbortController,console,location:{protocol:'http:'},setTimeout:fn=>{timers.set(++nextTimer,fn);return nextTimer;},clearTimeout:id=>timers.delete(id),validateCredits:x=>x,communityCreditURL:c=>'https://x.com/'+c.handle,
 hobby:{room:'valley',scene:{}},reduceMotion:false,paused:false,innerWidth:1400,innerHeight:900,performance:{now:()=>1},cameraPos:[0,0,0],cameraTarget:[0,0,0],cameraProjection:[],cameraNear:.1,night:0,rainAmount:0,
 project:()=>({x:500,y:300,visible:true}),isShopMapActive:()=>context.mapOpen,create:({signal})=>{builds++;signal.addEventListener('abort',()=>aborts++);return new Promise(resolve=>resolvers.push(()=>resolve({frame:()=>frames++,dispose:()=>disposals++})));}});
vm.runInContext(await read('src/embedded-build.js'),context);
vm.runInContext(await read('src/embedded.js'),context);
const run=code=>vm.runInContext(code,context),flush=()=>new Promise(resolve=>setImmediate(resolve));
run(`registerEmbeddedProject('yamaai',{base:'vendor/test/',title:'Test',roomName:'Yamaai',source:'https://example.com',licence:'MIT',permission:'Permission recorded',credits:[{name:'Techartist',handle:'techartist_'}],create,focus:[0,0,0]});`);
function enter(){run("hobby.room='yamaai';embeddedEnter('yamaai');");}
function leave(){run("hobby.room='valley';embeddedEnter('valley');");}
function mount(){const pending=[...timers.values()];timers.clear();pending.forEach(fn=>fn());}
enter();assert.equal(builds,0,'entry defers work past the native room build');leave();assert.equal(timers.size,0);mount();assert.equal(builds,0,'leaving before delay fetches nothing');
enter();mount();assert.equal(builds,1);leave();assert.equal(aborts,1);resolvers.shift()();await flush();assert.equal(disposals,1,'stale completion is disposed');assert.ok(document.getElementById('embedStage').hidden);
enter();mount();resolvers.shift()();await flush();run('embeddedFrameUpdate()');assert.equal(frames,1);assert.equal(document.getElementById('embedStage').dataset.state,'ready');
context.mapOpen=true;run('embeddedFrameUpdate()');assert.equal(disposals,2);assert.equal(aborts,2,'map entry destroys the active session');
context.mapOpen=false;run('embeddedFrameUpdate()');assert.equal(builds,2,'return starts with deferred rebuild');leave();
context.location.protocol='file:';enter();mount();assert.equal(builds,2,'portable file never attempts guest imports');assert.equal(document.getElementById('embedStage').dataset.state,'unavailable');leave();
const adapter=await read('src/guest-yamaai.js');assert.ok(!adapter.includes('compileAsync('),'upstream compileAsync has uncancellable timers after disposal');
assert.ok(!adapter.includes('requestAnimationFrame('),'house is the only animation loop');
assert.match(adapter,/renderer\.forceContextLoss\(\)/);assert.match(adapter,/signal\.addEventListener\('abort',dispose/);
assert.ok(!/iframe|matrix3d/.test(await read('src/embedded.js')),'flat embedded page has been removed');
console.log('Guest QA passed: 1,350 camera/depth equivalence samples, exact compact native depth copies, wall cutaways, credit surfaces, nonoverlapping lazy atlas art, lettered plaque face, deferred entry, load cancellation, map teardown, stale completion cleanup and portable fallback.');
// Photographs must include both renderers and preserve artist/source credit.
const housePhoto={width:800,height:500},guestPhoto={},photoDraws=[],photoText=[],photoContext={drawImage:(...args)=>photoDraws.push(args),fillRect(){},fillText:text=>photoText.push(text)};
f.context.document.querySelector=()=>guestPhoto;f.context.document.createElement=()=>({getContext:()=>photoContext});f.context.housePhoto=housePhoto;
f.run('embeddedActive={project:YAMAAI_PROJECT,session:{}}');const photograph=f.run('embeddedPhotograph(housePhoto)');assert.equal(photograph.height,580);assert.equal(photoDraws[0][0],housePhoto);assert.equal(photoDraws[1][0],guestPhoto);assert.ok(photoText[0].includes('Techartist'));assert.ok(photoText[1].includes(record.source));assert.equal(photoText[2],record.permission);
assert.equal(record.commit,(await read('vendor/mountain-railway-diorama/UPSTREAM-COMMIT.txt')).trim(),'source and licence links refer to the actual vendored revision');
console.log('Guest photograph QA passed: both canvases composited with artist, source and licence retained.');
