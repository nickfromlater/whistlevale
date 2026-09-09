#!/usr/bin/env node
// Actual model builders and selection lifecycle, with inert canvas/GPU calls.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=file=>fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
const noop=()=>{},gradient={addColorStop:noop};
const drawing=new Proxy({measureText:t=>({width:String(t).length*7}),createLinearGradient:()=>gradient,createRadialGradient:()=>gradient},{get:(o,k)=>k in o?o[k]:noop,set:(o,k,v)=>(o[k]=v,true)});
const nodes=new Map(),element=()=>({textContent:'null',width:0,height:0,style:{setProperty:noop},classList:{add:noop,remove:noop,toggle:noop},getContext:()=>drawing,addEventListener:noop});
const document={getElementById:id=>{if(!nodes.has(id))nodes.set(id,element());return nodes.get(id);},createElement:element,addEventListener:noop,querySelectorAll:()=>[]};
const uploads=[],disposed=[],memory=new Map();let failUpload=false,failUploadAt=0;
const context=vm.createContext({assert,console,document,matchMedia:()=>({matches:false}),innerWidth:1440,innerHeight:900,devicePixelRatio:1,setTimeout:noop,clearTimeout:noop,requestAnimationFrame:noop,localStorage:{getItem:key=>memory.get(key)||null,setItem:(key,value)=>memory.set(key,value)},glStub:new Proxy({getParameter:()=>8192},{get:(o,k)=>k in o?o[k]:noop}),
 record(data){if(failUpload&&uploads.length>=failUploadAt)throw Error('GPU allocation failed');const m={vao:{},buf:{},count:data.length/12};uploads.push(m);return m;},dispose:m=>disposed.push(m)});
context.window=context;context.addEventListener=noop;
const run=code=>vm.runInContext(code,context);
run(read('src/railway.js'));run('gl=glStub;upload=record;disposeMesh=dispose;');
for(const file of['people.js','rooms.js','rooms/coastal.js','rooms/alpine.js','rooms/studio.js','trains.js'])run(read('src/'+file));
run(`
 assert.equal(runningCollectionMeshes.size,0,'catalogue does not allocate stock at startup');
 initLabels();
 assert.ok(atlasY+atlasRow<=1024,'fixed label atlas remains within capacity');
 for(const q of TRAIN_COLLECTION)for(const kind of['name','number']){
  const uv=labels['collection-'+kind+'-'+q.id];assert.ok(uv,'each model has its own plate');
  for(const v of Object.values(uv))assert.ok(v>=0&&v<=1,'plate UV remains within atlas');
 }
 const qaGeometry=new Map(),qaBudget=[];
 const originalMesh=Builder.prototype.mesh,originalPaint=trainPaint,originalSeed=seed,originalRoster=TRAIN_ROSTER.alpine,originalLabels=JSON.stringify(labels);
 for(const q of TRAIN_COLLECTION){
  const variants=[];
  for(let livery=0;livery<q.liveries.length;livery++){
   const stock=collectionGeometry({id:q.id,livery,cars:q.cars});let count=0;
   for(const [part,mesh]of Object.entries(stock)){
    assert.equal(mesh.count%3,0,q.id+' '+part+' contains whole triangles');
    assert.ok(mesh.data instanceof Float32Array);count+=mesh.count;
    for(let i=0;i<mesh.data.length;i++)assert.ok(Number.isFinite(mesh.data[i]),q.id+' '+part+' has finite attributes');
   }
   assert.ok(count<280000,q.id+' stays within its model vertex budget');
   variants.push(stock.loco||stock.motor);
   if(livery===0){qaGeometry.set(q.id,stock);qaBudget.push({train:q.name,vertices:count});}
   assert.equal(Builder.prototype.mesh,originalMesh);assert.equal(trainPaint,originalPaint);assert.equal(seed,originalSeed);assert.equal(TRAIN_ROSTER.alpine,originalRoster);assert.equal(JSON.stringify(labels),originalLabels);
  }
  assert.notDeepEqual(variants[0].data,variants[1].data,q.id+' changes actual paint geometry');
  assert.notDeepEqual(variants[1].data,variants[2].data,q.id+' has three distinct finishes');
 }
 assert.equal(runningCollectionMeshes.size,0,'inspection builds no running stock');
 const savedShunter=collectionShunter;collectionShunter=()=>{throw Error('broken model');};
 assert.throws(()=>collectionGeometry({id:'cinder',livery:0,cars:3}),/broken model/);collectionShunter=savedShunter;
 assert.equal(Builder.prototype.mesh,originalMesh);assert.equal(trainPaint,originalPaint);assert.equal(seed,originalSeed);assert.equal(TRAIN_ROSTER.alpine,originalRoster);assert.equal(JSON.stringify(labels),originalLabels,'failed builds restore all shared state');
 const originalDraw=draw;let calls=[];draw=(mesh,model)=>{assert.ok(mesh);for(const v of model)assert.ok(Number.isFinite(v));calls.push({mesh,model});};
 const previewProgram={},realMain=mainProgram;mainProgram={};viewMode='engine';
 for(const q of TRAIN_COLLECTION){
  const stock=qaGeometry.get(q.id),choice={id:q.id,livery:0,cars:6};
  for(const p of[previewProgram,mainProgram]){
   calls=[];drawSelectedCollection(choice,d=>trans(0,0,-d),p,0,stock,false);const closed=calls.slice();
   assert.ok(closed.some(c=>c.mesh===stock.axle),q.id+' uses moving bogie axles');
   calls=[];drawSelectedCollection(choice,d=>trans(0,0,-d),p,.8,stock,true);
   assert.ok(!calls.some(c=>c.mesh===stock.roof||c.mesh===stock.motorRoof||c.mesh===stock.trailerRoof),q.id+' roofs can be removed');
   if(stock.cab)assert.ok(calls.some(c=>c.mesh===stock.cab),q.id+' opens its cab');
   assert.notDeepEqual(calls.find(c=>c.mesh===stock.axle).model,closed.find(c=>c.mesh===stock.axle).model,'bogie wheels rotate');
   if(q.power==='steam')assert.notDeepEqual(calls.find(c=>c.mesh===stock.wheels).model,closed.find(c=>c.mesh===stock.wheels).model,'steam driving wheels rotate');
  }
  viewMode='cab';calls=[];drawSelectedCollection(choice,d=>trans(0,0,-d),mainProgram,0,stock,false);
  if(stock.cab)assert.ok(calls.some(c=>c.mesh===stock.cab));else assert.ok(!calls.some(c=>c.mesh===stock.motorRoof));viewMode='engine';
 }
 draw=originalDraw;mainProgram=realMain;
 const oldHistory=journeyHistory,oldTravel=travel,oldPaused=paused,oldThrottle=throttle;
 chooseCollectionTrain('valley',{id:'kingfisher',livery:1,cars:2});
 assert.equal(collectionPower('valley'),'diesel');assert.equal(collectionTrainLabel('valley').name,'Kingfisher');
 assert.equal(journeyHistory,oldHistory);assert.equal(travel,oldTravel);assert.equal(paused,oldPaused);assert.equal(throttle,oldThrottle);
 assert.equal(runningCollectionMeshes.size,1);
 const edge={length:100,at:d=>({p:[0,0,d],f:[0,0,1]})};
 const primary={edge,distance:13,speed:.8,type:'steam',cars:2},secondary={edge,distance:44,speed:.7,type:'mountain',cars:1};
 roomScenes.set('coast',{key:'coast',trains:[primary,secondary]});
 chooseCollectionTrain('coast',{id:'juniper',livery:2,cars:3});
 assert.equal(primary.type,'mountain');assert.equal(primary.distance,13);assert.equal(primary.speed,.8);assert.equal(primary.cars,3);assert.equal(primary.stock,'collection:juniper');
 assert.equal(secondary.type,'mountain');assert.equal(secondary.cars,1);assert.equal(secondary.collectionChoice,undefined,'secondary exhibits remain intact');
 assert.equal(collectionChoice('valley').id,'kingfisher','room selections are independent');
 chooseCollectionTrain('coast',{id:'kingfisher',livery:1,cars:4});assert.equal(runningCollectionMeshes.size,1,'rooms with the same paint share geometry');
 chooseCollectionTrain('valley',{id:'tern',livery:2,cars:2});assert.equal(runningCollectionMeshes.size,2,'other room still owns its geometry');
 chooseCollectionTrain('coast',{id:'tern',livery:2,cars:4});assert.equal(runningCollectionMeshes.size,1,'last user leaving a model releases it');
 assert.equal(primary.type,'steam');assert.equal(collectionPower('coast'),'steam');
 for(const bad of[null,{}, {id:'unknown',livery:0,cars:1},{id:'tern',livery:-1,cars:1},{id:'tern',livery:3,cars:1},{id:'tern',livery:0,cars:0},{id:'tern',livery:0,cars:7},{id:'tern',livery:0,cars:1.5}])assert.equal(validateCollectionChoice(bad),null);
 assert.throws(()=>chooseCollectionTrain('unknown',{id:'tern',livery:0,cars:2}));
 const beforeFailure=collectionChoice('valley');
`);
assert.equal(uploads.length-disposed.length,run('Object.values(runningCollectionMeshes.values().next().value).length'),'no abandoned running meshes');
failUploadAt=uploads.length+3;const partialDisposed=disposed.length;failUpload=true;assert.throws(()=>run("chooseCollectionTrain('valley',{id:'meridian',livery:0,cars:4})"),/GPU allocation/);failUpload=false;assert.equal(disposed.length-partialDisposed,3,'failed partial uploads are disposed');
run(`assert.equal(collectionChoice('valley'),beforeFailure,'allocation failure does not switch the train');`);
// Reject unknown rooms/invalid stored values; embedded exports take precedence.
run(`
 const qaSnapshot=collectionExport();assert.equal(qaSnapshot.version,1);assert.equal(qaSnapshot.rooms.coast.id,'tern');
 for(const key of Object.keys(selectedCollection))delete selectedCollection[key];
 restoreCollectionSelections();assert.equal(collectionChoice('valley').id,'tern');assert.equal(collectionChoice('coast').cars,4);
 const embedded=$('embeddedTrainCollection');embedded.textContent=JSON.stringify({version:1,rooms:{alpine:{id:'bergwald',livery:1,cars:2},ghost:{id:'tern',livery:0,cars:1},studio:{id:'wren',livery:99,cars:1}}});
 restoreCollectionSelections();assert.equal(collectionChoice('alpine').livery,1);assert.equal(selectedCollection.ghost,undefined);assert.equal(selectedCollection.studio,undefined);embedded.textContent='null';
 const setItem=localStorage.setItem;localStorage.setItem=()=>{throw Error('private mode');};assert.equal(chooseCollectionTrain('valley',{id:'wren',livery:0,cars:2}),false);assert.equal(collectionChoice('valley').id,'wren');localStorage.setItem=setItem;
 console.table(qaBudget);
`);
console.log('Train collection QA passed: 24 finite livery models, atlas bounds, working wheels and roofs, room isolation, shared mesh ownership/disposal, failure recovery, state preservation, persistence, and portable selection precedence.');

// Exercise the real preview renderer and captured pointer handlers without a GPU.
const frames=new Map();let nextFrame=0,draws=0,gpuDeleted=0,observed=0;
context.AbortController=AbortController;context.performance=performance;
context.requestAnimationFrame=fn=>{const id=++nextFrame;frames.set(id,fn);return id;};context.cancelAnimationFrame=id=>frames.delete(id);
context.ResizeObserver=class{observe(){observed++;}disconnect(){observed--;}};
const gpu=new Proxy({FRAMEBUFFER_COMPLETE:99,checkFramebufferStatus:()=>99,getShaderParameter:()=>true,getProgramParameter:()=>true,isContextLost:()=>false,createShader:()=>({}),createProgram:()=>({}),createTexture:()=>({}),createFramebuffer:()=>({}),createVertexArray:()=>({}),createBuffer:()=>({}),deleteBuffer:()=>gpuDeleted++,drawArrays:()=>draws++,uniformMatrix4fv:(_l,_t,m)=>{for(const n of m)assert.ok(Number.isFinite(n),'finite preview matrix');}},{get:(o,k)=>k in o?o[k]:noop});
const handlers=new Map(),captured=new Set();
context.previewCanvas={width:0,height:0,clientWidth:390,clientHeight:210,focus:noop,getContext:()=>gpu,addEventListener(type,handler,{signal}){handlers.set(type,handler);signal.addEventListener('abort',()=>handlers.delete(type));},setPointerCapture:id=>captured.add(id),hasPointerCapture:id=>captured.has(id),releasePointerCapture:id=>captured.delete(id)};
let worldFrames=0;context.worldDrawProbe=()=>worldFrames++;run('render=worldDrawProbe;');
run(read('src/train-cabinet.js'));
run('render();trainCabinet.open=true;render();');assert.equal(worldFrames,1,'the covered railway does not render behind the cabinet');
run("trainCabinet.open=true;const qaPreview=new CabinetPreview(previewCanvas,()=>{});trainCabinet.preview=qaPreview;qaPreview.setModel({id:'juniper',livery:0,cars:6});");
assert.equal(frames.size,1,'preview construction coalesces to one frame');
const flush=time=>{const pending=[...frames.values()];frames.clear();for(const fn of pending)fn(time);};
flush(100);assert.ok(draws>0);assert.equal(frames.size,0,'a still preview has no animation loop');
run('qaPreview.request();qaPreview.request();qaPreview.request();');assert.equal(frames.size,1);flush(116);
const pointer=(type,id,x,y)=>handlers.get(type)({button:0,pointerId:id,clientX:x,clientY:y,preventDefault:noop});
const yaw=run('qaPreview.yaw');pointer('pointerdown',1,100,100);pointer('pointermove',1,130,120);assert.notEqual(run('qaPreview.yaw'),yaw);
pointer('pointerdown',2,220,100);const zoom=run('qaPreview.zoom');pointer('pointermove',2,270,100);assert.ok(run('qaPreview.zoom')<zoom,'pinch apart zooms in');
pointer('pointercancel',2,270,100);assert.equal(captured.size,1);run('qaPreview.stop()');assert.equal(captured.size,0);assert.equal(frames.size,0,'stop releases captures and frames');
run('trainCabinet.full=true;qaPreview.setFormation();trainCabinet.lift=true;trainCabinet.moving=true;');flush(160);assert.equal(frames.size,1,'requested wheel motion schedules one successor');
run('document.hidden=true;qaPreview.stop();qaPreview.request();');assert.equal(frames.size,0,'hidden previews cannot schedule work');run('document.hidden=false;');
const beforeRelease=gpuDeleted;run('trainCabinet.open=false;qaPreview.release();qaPreview.request();');assert.equal(frames.size,0);assert.ok(gpuDeleted>beforeRelease);assert.equal(run('qaPreview.stock'),null,'closing releases all model meshes');
run('qaPreview.destroy()');assert.equal(observed,0);assert.equal(handlers.size,0,'destroying a context releases observers and pointer handlers');
console.log('Cabinet preview QA passed: finite phone/formation cameras, idle-frame coalescing, opt-in motion, pinch/drag/cancel, hidden/closed suspension, and GPU/listener cleanup.');

// Execute the exact portrait-packing block used by the portable HTML exporter.
const hobbySource=read('src/hobby.js'),packStart=hobbySource.indexOf("  if(typeof collectionPortraitURL==='function')"),packEnd=hobbySource.indexOf("  source.querySelector('#trainCabinet')",packStart);
let portraitRequests=0;context.fetch=async url=>{portraitRequests++;const bytes=fs.readFileSync(new URL('../'+url,import.meta.url));return{ok:true,blob:async()=>({bytes,type:'image/webp'})};};
context.FileReader=class{readAsDataURL(blob){this.result='data:'+blob.type+';base64,'+blob.bytes.toString('base64');this.onload();}};
await run('(async()=>{const source={querySelector:selector=>$(selector.slice(1))};'+hobbySource.slice(packStart,packEnd)+'})()');
const packed=JSON.parse(nodes.get('embeddedTrainPortraits').textContent);assert.equal(portraitRequests,8);let totalBytes=0;
for(const [id,data]of Object.entries(packed)){const bytes=Buffer.from(data.split(',')[1],'base64');assert.deepEqual(bytes,fs.readFileSync(new URL('../assets/trains/'+id+'.webp',import.meta.url)));totalBytes+=bytes.length;}
assert.ok(totalBytes<160000,'collection portraits stay within a small lazy-loaded asset budget');
await run('(async()=>{const source={querySelector:selector=>$(selector.slice(1))};'+hobbySource.slice(packStart,packEnd)+'})()');assert.equal(portraitRequests,8,'repacking an offline export makes no portrait requests');
console.log('Portable portrait QA passed: all eight images retain their exact bytes; offline repacking uses the embedded copies.');
