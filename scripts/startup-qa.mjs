#!/usr/bin/env node
// Real startup/cache, validation, snapshots and world seed lifecycle. Geometry
// emitters are small adapters: this checks build selection and scene identity,
// while geometry-qa checks the renderer's actual uploaded vertex bytes.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source=await readFile(new URL('../src/railway.js',import.meta.url),'utf8');
const communitySource=await readFile(new URL('../src/community-core.js',import.meta.url),'utf8');
const communityRuntime='window.HOUSE_COMMUNITY='+await readFile(new URL('../contributions/world.json',import.meta.url),'utf8')+';'+await readFile(new URL('../src/community.js',import.meta.url),'utf8');
assert.match(source,/function start\(\)\{try\{initGL\(\);prepareWorkshopStartup\(\);buildWorld\(\);createRoom\(\);initializeWorkshop\(\);/,'startup prepares the saved world before its first build');
assert.match(source,/view:viewMode,night,lightingMode,mood:/,'diagnostics expose automatic/manual lighting');
const STORAGE_KEY='alder-valley-grand-division-v2',CACHE_KEY='whistlevale-factory-snapshot';
const noop=()=>{};
const plain=value=>JSON.parse(JSON.stringify(value));
function fixture({storage=new Map(),embedded=null,denyCache=false,denyStorage=false}={}){
 const records={builds:[],roomSeeds:[],warnings:[],scenery:[],queued:0},nodes=new Map();
 const drawing=new Proxy({measureText:text=>({width:String(text).length*7})},{get:(o,key)=>o[key]||noop,set:(o,key,value)=>(o[key]=value,true)});
 const element=()=>({textContent:'',value:'',style:{setProperty:noop},classList:{add:noop,remove:noop,toggle:noop},setAttribute:noop,addEventListener:noop,getContext:()=>drawing,querySelector:()=>element(),showModal:noop});
 const document={getElementById(id){if(!nodes.has(id))nodes.set(id,element());return nodes.get(id);},createElement:element,addEventListener:noop,querySelectorAll:()=>[]};
 document.getElementById('embeddedLayout').textContent=embedded===null?'null':typeof embedded==='string'?embedded:JSON.stringify(embedded);
 const context=vm.createContext({assert,records,document,console:{...console,warn:(...args)=>records.warnings.push(args.join(' '))},matchMedia:()=>({matches:false}),innerWidth:1440,innerHeight:1000,devicePixelRatio:1,setTimeout:noop,clearTimeout:noop,requestAnimationFrame:noop,
  localStorage:{getItem(key){if(denyStorage||denyCache&&key===CACHE_KEY)throw new Error('Storage unavailable');return storage.get(key)||null;},setItem(key,value){if(denyStorage||denyCache&&key===CACHE_KEY)throw new Error('Storage unavailable');storage.set(key,value);}}
 });
 context.window=context;context.addEventListener=noop;
 const run=code=>vm.runInContext(code,context);
 run(communitySource);run(source);run(communityRuntime);
 run(`
  // Keep the actual buildWorld, initTracks and seedDivisionScenery. Replace only
  // expensive geometry/GL output, consistently for both startup paths.
  createGround=function(){for(let i=0;i<31;i++)rand();return{mesh(){return{count:3};}};};
  makeRoad=function(){roads.length=0;};createRail=function(){};bridgeRange=function(){return[];};buildTunnelRange=function(){};
  initLabels=function(){};createWater=function(){};uploadAtlas=function(){};disposeMesh=function(){};
  buildValleyDetails=function(){records.builds.push({capture:captureScenery,flat:flatTerrain,tracks:JSON.stringify(trackDesign),objects:JSON.stringify(objects),samples:Array.from({length:12},()=>rand())});};
  signals=function(){};createRoom=function(){records.roomSeeds.push(Array.from({length:7},()=>rand()));};
  rebuildScenery=function(){records.scenery.push(JSON.stringify(objects));};buildSetDetails=function(){};rebuildGrid=function(){};bindWorkshop=function(){};
  queueWorldRebuild=function(){records.queued++;};updateTrainModels=function(){};refreshInspector=function(){};renderCatalog=function(){};buildTrains=function(){};updateUI=function(){};
 `);
 return{run,records,storage,start(){run('prepareWorkshopStartup();buildWorld();createRoom();initializeWorkshop();');},snapshot(){return JSON.parse(run('JSON.stringify(snapshot())'));},factory(){return JSON.parse(run('JSON.stringify(factorySnapshot)'));}};
}

const fresh=fixture();fresh.start();
assert.equal(fresh.records.builds.length,1,'fresh visits capture the factory once');
assert.equal(fresh.records.builds[0].capture,true);assert.ok(fresh.factory().objects.length>600,'fixture uses the actual authored factory scenery');
assert.equal(fresh.factory().coaches,6);assert.equal(fresh.run('captureScenery'),false);
const pristine=fresh.factory(),cache=JSON.parse(fresh.storage.get(CACHE_KEY));
assert.equal(cache.version,'grand-v2-factory-2-community');assert.deepEqual(cache.snapshot,pristine,'only the pristine factory is cached');
const saved={...structuredClone(pristine),name:'My blue railway',flat:true,livery:'blue',coaches:2,services:{freight:false,mountain:true}};
saved.objects=saved.objects.slice(0,5);saved.objects[0].x+=.25;
const stored=()=>new Map([[STORAGE_KEY,JSON.stringify(saved)],[CACHE_KEY,JSON.stringify(cache)]]);

const cold=fixture({storage:new Map([[STORAGE_KEY,JSON.stringify(saved)]])});cold.start();
assert.equal(cold.records.builds.length,2,'saved layouts without a factory cache keep the original safe path');
assert.deepEqual(cold.records.builds.map(b=>b.capture),[true,false]);assert.equal(cold.snapshot().name,saved.name);
assert.deepEqual(cold.factory(),pristine,'an uncached saved visit still retains a pristine reset');
assert.deepEqual(JSON.parse(cold.storage.get(CACHE_KEY)).snapshot,pristine,'saved edits never contaminate the factory cache');

const warm=fixture({storage:stored()});warm.start();
assert.equal(warm.records.builds.length,1,'validated saved layout and factory cache build the valley once');
assert.equal(warm.records.builds[0].capture,false,'saved startup never recaptures factory scenery');
assert.deepEqual(warm.snapshot(),cold.snapshot(),'the loaded editable world is identical');
assert.deepEqual(warm.factory(),pristine,'cached factory stays separate from the saved world');
assert.deepEqual(plain(warm.records.builds[0]),plain(cold.records.builds[1]),'saved-world random sequence, terrain, tracks and scenery are identical');
assert.deepEqual(plain(warm.records.roomSeeds),plain(cold.records.roomSeeds),'room shell randomness is unchanged');
assert.equal(warm.run('seed'),cold.run('seed'),'global seed state is unchanged');
assert.equal(warm.run('offsets.length-2'),2,'saved coach count is not replaced by factory stock');
assert.equal(warm.run('freightRunning'),false);assert.equal(warm.run('livery'),'blue');
assert.equal(warm.records.scenery.length,1,'scenery is uploaded once');

// Reset, meadow, undo and import continue to use independent snapshots.
warm.run("askReset('valley');confirmAction();");assert.deepEqual(warm.snapshot(),pristine,'reset restores the pristine factory');
warm.run('undoBuild()');assert.deepEqual(warm.snapshot(),cold.snapshot(),'undo restores the saved railway after reset');
warm.run("askReset('meadow');confirmAction();");
assert.equal(warm.snapshot().flat,true);assert.equal(warm.snapshot().objects.length,0);assert.equal(warm.snapshot().name,'My little railway');
assert.ok(warm.snapshot().tracks.highline.every(curve=>curve.every(point=>point[1]===1.06)));
assert.deepEqual(warm.factory(),pristine,'meadow edits cannot mutate the cached factory');
warm.run('undoBuild()');assert.deepEqual(warm.snapshot(),cold.snapshot());
const imported={...structuredClone(saved),name:'An imported railway',coaches:4};warm.run(`WORKSHOP.load(${JSON.stringify(imported)})`);
assert.equal(warm.snapshot().name,imported.name);assert.equal(warm.snapshot().coaches,4);assert.deepEqual(warm.factory(),pristine);

// Cached state is only a shortcut when both documents are valid and current.
const withChecksum=value=>({...cache,snapshot:value,checksum:fresh.run(`workshopFactoryChecksum(${JSON.stringify(JSON.stringify(value))})`)});
const badFactory=structuredClone(pristine);badFactory.objects[0].x=9000;
const alteredTracks=structuredClone(pristine);alteredTracks.tracks.common[0][1][0]+=.01;
for(const [label,value]of[
 ['invalid JSON','{'],['missing snapshot',JSON.stringify({version:cache.version})],
 ['old version',JSON.stringify({...cache,version:'old'})],['bad checksum',JSON.stringify({...cache,checksum:'broken'})],
 ['invalid factory data',JSON.stringify(withChecksum(badFactory))],['edited factory tracks',JSON.stringify(withChecksum(alteredTracks))],
 ['saved world posing as factory',JSON.stringify(withChecksum(saved))]
]){
 const storage=stored();storage.set(CACHE_KEY,value);const app=fixture({storage});app.start();
 assert.equal(app.records.builds.length,2,label+' safely captures defaults before loading');assert.deepEqual(app.snapshot(),cold.snapshot());assert.deepEqual(app.factory(),pristine);
}
for(const savedValue of['{',JSON.stringify({format:'wrong'}),JSON.stringify({...saved,objects:[{type:'unknown'}]})]){
 const storage=stored();storage.set(STORAGE_KEY,savedValue);const app=fixture({storage});app.start();
 assert.equal(app.records.builds.length,1,'invalid saved layout cannot activate the shortcut');assert.equal(app.records.builds[0].capture,true);assert.deepEqual(app.snapshot(),pristine);assert.equal(app.records.warnings.length,1);
}
const onlyCache=fixture({storage:new Map([[CACHE_KEY,JSON.stringify(cache)]])});onlyCache.start();
assert.equal(onlyCache.records.builds[0].capture,true,'a cache alone cannot replace a fresh factory capture');
const denied=fixture({storage:stored(),denyCache:true});denied.start();assert.equal(denied.records.builds.length,2);assert.deepEqual(denied.snapshot(),cold.snapshot());

// Portable embedded layouts retain precedence over local edits. They can use a
// valid local factory cache, and still work when the browser denies all storage.
const embedded={...structuredClone(saved),name:'The portable railway',livery:'claret',coaches:3};
const portable=fixture({storage:stored(),embedded});portable.start();assert.equal(portable.records.builds.length,1);assert.equal(portable.snapshot().name,embedded.name);
const privatePortable=fixture({embedded,denyStorage:true});privatePortable.start();assert.equal(privatePortable.records.builds.length,2);assert.deepEqual(privatePortable.snapshot(),portable.snapshot());
const malformedEmbed=fixture({storage:stored(),embedded:'{'});malformedEmbed.start();assert.equal(malformedEmbed.records.builds[0].capture,true);assert.deepEqual(malformedEmbed.snapshot(),pristine,'corrupt embedded data preserves the previous safe fallback');
const noStorage=fixture({denyStorage:true});noStorage.start();assert.deepEqual(noStorage.snapshot(),pristine);

// Run the real controls initialization across fresh page lifetimes. An old
// dismissal must not permanently remove the contribution path on later visits.
const controlsSource=await readFile(new URL('../src/controls.js',import.meta.url),'utf8');
function invitationPage({storage=new Map(),blocked=false,hall=true}={}){
 const nodes=new Map(),visits=[],focus=[];
 for(const id of ['hallInvitation','dismissHallInvitation','hallInvitationLink','moreBtn','soundClose','closeNetwork','helpClose','visitCommons','visitGrandHall','quietHide','restore','railControls','cinemaStart'])nodes.set(id,{
  hidden:true,dataset:{},setAttribute:noop,insertBefore:noop,querySelector:()=>({textContent:''}),focus:()=>focus.push(id)
 });
 const context=vm.createContext({$:id=>nodes.get(id),HOUSE_ROOMS:hall?{grandhall:{}}:{},visitHouseRoom:key=>visits.push(key),
  hideUI:noop,toggleDiagram:noop,playlistToggle:noop,showHelp:noop,closeHelp:noop,
  document:{querySelectorAll:()=>[],addEventListener:noop},window:{addEventListener:noop},
  localStorage:{getItem(key){if(blocked)throw new Error('Storage unavailable');return storage.get(key)||null;},setItem(key,value){if(blocked)throw new Error('Storage unavailable');storage.set(key,value);}}
 });
 vm.runInContext(controlsSource,context);const init=()=>vm.runInContext('initQuietControls()',context);init();
 return{nodes,visits,focus,init,click(modifier=null){let prevented=false;nodes.get('hallInvitationLink').onclick({[modifier]:true,preventDefault(){prevented=true;}});return prevented;}};
}
const invitationStorage=new Map([['whistlevale-hall-invitation','dismissed'],['unrelated-preference','keep']]);
const arrival=invitationPage({storage:invitationStorage});
assert.equal(arrival.nodes.get('hallInvitation').hidden,false,'an old permanent dismissal cannot suppress a new arrival');
assert.deepEqual(arrival.focus,[],'showing the invitation never steals focus');
arrival.nodes.get('dismissHallInvitation').onclick();
assert.equal(arrival.nodes.get('hallInvitation').hidden,true);assert.deepEqual(arrival.focus,['moreBtn']);
arrival.init();assert.equal(arrival.nodes.get('hallInvitation').hidden,true,'initializing controls again does not undo dismissal during this page visit');
const reloaded=invitationPage({storage:invitationStorage});
assert.equal(reloaded.nodes.get('hallInvitation').hidden,false,'reloading restores the contribution invitation');
assert.equal(reloaded.click(),true);assert.deepEqual(reloaded.visits,['grandhall']);assert.equal(reloaded.nodes.get('hallInvitation').hidden,true);
assert.deepEqual([...invitationStorage],[['whistlevale-hall-invitation','dismissed'],['unrelated-preference','keep']],'invitation actions leave existing preferences untouched');
assert.equal(invitationPage({storage:invitationStorage}).nodes.get('hallInvitation').hidden,false,'visiting the Hall cannot suppress a subsequent arrival');
for(const modifier of ['metaKey','ctrlKey','shiftKey','altKey']){
 const page=invitationPage();assert.equal(page.click(modifier),false);assert.deepEqual(page.visits,[]);
 assert.equal(page.nodes.get('hallInvitation').hidden,false,'modified links retain native browser behavior');
}
const privateArrival=invitationPage({blocked:true});assert.equal(privateArrival.nodes.get('hallInvitation').hidden,false);assert.equal(privateArrival.click(),true);
assert.equal(invitationPage({hall:false}).nodes.get('hallInvitation').hidden,true,'a house without the Hall does not offer a missing destination');
console.log('Contribution invitation verified: visible on every new page, page-only dismissal, legacy/blocked storage, focus, modified links and Hall navigation.');

console.log('Startup verified: one saved-world build with a valid factory cache; identical saved state and random sequence; pristine reset/meadow/undo/import; invalid, stale, missing, blocked and embedded-storage fallbacks.');
