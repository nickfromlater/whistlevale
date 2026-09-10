// Synthetic catalogue data stays inside this VM; no public exhibit is added.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source=await readFile(new URL('../src/grandhall-residency.js',import.meta.url),'utf8');
const {createGrandHallResidency,createGrandHallSourceLoader}=vm.runInNewContext(source+';({createGrandHallResidency,createGrandHallSourceLoader})');
const data=await readFile(new URL('../src/grandhall-data.js',import.meta.url),'utf8');
const actual=vm.runInNewContext(data+';({vertices:GRAND_HALL_LIMITS.exhibitVertices,galleries:GRAND_HALL_GALLERIES.length,bays:GRAND_HALL_BAYS.map(b=>({id:b.id,room:b.room}))})');
const plain=value=>JSON.parse(JSON.stringify(value));
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return{promise,resolve,reject};};

// 1,200 exhibits across 120 galleries: startup and every visit depend only on
// the visible galleries, including neighbors seen through their doorways.
const catalogue=Array.from({length:1200},(_,id)=>({id,room:Math.floor(id/10),source:'src/scenery/fixture-'+id+'.js'}));
const built=[],released=[],live=new Set();let allocations=0,peak=0;
const residency=createGrandHallResidency({capacity:3,build:room=>{
 const resource={serial:++allocations,room,exhibits:catalogue.filter(e=>e.room===room).map(e=>e.id)};
 built.push(...resource.exhibits);live.add(resource);peak=Math.max(peak,live.size);return resource;
},dispose:resource=>{assert.ok(live.delete(resource),'each owned GPU group is released exactly once');released.push(resource);}});
assert.equal(allocations,0,'constructing a cache builds nothing');
await residency.setVisible([0,1]);
assert.deepEqual(built,Array.from({length:20},(_,i)=>i),'inactive gallery exhibits never build at startup');
const first=residency.peek(0),neighbor=residency.peek(1);
await residency.setVisible([1,2]);
assert.equal(residency.peek(1),neighbor,'visible adjacent gallery retains its GPU group');
await residency.setVisible([2,3]);
assert.ok(!residency.has(0),'least recently used unpinned gallery is evicted');
assert.ok(released.includes(first));assert.ok(!released.includes(residency.peek(2)));
for(let room=4;room<120;room++)await residency.setVisible([room-1,room]);
assert.equal(peak,3,'resident GPU groups stay bounded while traversing 120 galleries');
assert.equal(residency.stats.resident,3);assert.equal(live.size,3);
await residency.setVisible([0,1]);
assert.notEqual(residency.peek(0),first,'revisiting an evicted gallery builds fresh GPU resources');
assert.equal(built.filter(id=>id===0).length,2);
assert.throws(()=>residency.setVisible([0,1,2,3]),/exceed/,'visible galleries are never silently dropped to satisfy capacity');
assert.equal(residency.stats.resident,3,'invalid requests leave the current cache intact');
await residency.dispose();assert.equal(live.size,0);assert.equal(released.length,allocations);
await assert.rejects(residency.setVisible([0]),/disposed/);

// An interrupted visit must skip queued inactive galleries and dispose a build
// that was already in flight when the visitor chose another destination.
const slow=deferred(),started=[],discarded=[];
const changing=createGrandHallResidency({capacity:2,build:id=>{started.push(id);return id==='old'?slow.promise:{id};},dispose:resource=>discarded.push(resource.id)});
const old=changing.setVisible(['old','never']);
while(!started.length)await Promise.resolve();
const latest=changing.setVisible(['new']);
assert.equal((await old).current,false,'superseded visit resolves without activating the stale room');
slow.resolve({id:'old'});await latest;
assert.deepEqual(started,['old','new']);assert.deepEqual(discarded,['old']);assert.ok(changing.has('new'));
await changing.dispose();assert.deepEqual(discarded,['old','new']);
const abandoned=deferred(),recoveryStarted=[];
const recovery=createGrandHallResidency({capacity:1,build:id=>{recoveryStarted.push(id);return id==='abandoned'?abandoned.promise:{id};},dispose:()=>{}});
const superseded=recovery.setVisible(['abandoned']);while(!recoveryStarted.length)await Promise.resolve();
const recovered=recovery.setVisible(['destination']);abandoned.reject(new Error('old gallery failed'));
assert.equal((await superseded).current,false);await recovered;assert.ok(recovery.has('destination'),'an abandoned gallery failure cannot cancel a new destination');await recovery.dispose();
const scheduled=deferred(),priority=[];
const reprioritized=createGrandHallResidency({capacity:2,schedule:()=>scheduled.promise,build:id=>{priority.push(id);return{id};},dispose:()=>{}});
const priorOrder=reprioritized.setVisible(['neighbor','current']);
const currentFirst=reprioritized.setVisible(['current','neighbor']);scheduled.resolve();await currentFirst;
assert.equal((await priorOrder).current,false);assert.deepEqual(priority,['current','neighbor'],'the latest current gallery takes priority over its visible neighbor');await reprioritized.dispose();

// Failed gallery builds are retryable and never occupy cache space. Partial
// allocations remain the build callback's responsibility before it rejects.
let attempts=0;const retry=createGrandHallResidency({capacity:1,build:id=>{if(++attempts===1)throw new Error('fixture build failed');return{id};},dispose:()=>{}});
await assert.rejects(retry.setVisible([8]),/fixture build failed/);assert.equal(retry.stats.resident,0);
await retry.setVisible([8]);assert.equal(attempts,2);assert.ok(retry.has(8));await retry.dispose();
const clearing=deferred(),clearDisposals=[];
const cleared=createGrandHallResidency({capacity:1,build:()=>clearing.promise,dispose:value=>clearDisposals.push(value)});
const pending=cleared.setVisible([1]);
while(!cleared.stats.building)await Promise.resolve();
const done=cleared.clear();clearing.resolve('late');await done;assert.equal((await pending).current,false);assert.deepEqual(clearDisposals,['late']);assert.equal(cleared.stats.resident,0);

// Exact registered sources execute at most once after success, regardless of
// how many exhibits share one source. Network and parse failures can retry.
const sources=catalogue.map(e=>e.source),loads=[],gates=[];let sourceActive=0,sourcePeak=0;
const loader=createGrandHallSourceLoader({sources,concurrency:2,load:async path=>{loads.push(path);sourceActive++;sourcePeak=Math.max(sourcePeak,sourceActive);const gate=deferred();gates.push(gate);await gate.promise;sourceActive--;return path;}});
assert.equal(loader.stats.loaded,0);assert.deepEqual(loads,[]);
const duplicate=loader.ensure(sources[0]);assert.equal(loader.ensure(sources[0]),duplicate,'concurrent source requests share their promise');
const many=loader.ensureMany(sources.slice(0,100));
while(gates.length<2)await Promise.resolve();
assert.equal(loads.length,2,'source execution obeys the concurrency limit');
await assert.rejects(loader.ensure('https://unregistered.invalid/exhibit.js'),/Unregistered/);
await assert.rejects(loader.ensureMany([sources[200],'unregistered']),/Unregistered/);assert.equal(loads.length,2,'invalid batches do not start a partial load');
for(let finished=0;finished<100;finished++){while(gates.length<=finished)await Promise.resolve();gates[finished].resolve();}
await many;await duplicate;assert.equal(sourcePeak,2);assert.equal(loads.length,100);
await loader.ensure(sources[0]);assert.equal(loads.length,100,'successfully executed source is reused');
assert.equal(loader.stats.loaded,100,'unrequested sources remain unloaded');
let sourceAttempts=0;const flaky=createGrandHallSourceLoader({sources:['known'],load:()=>{if(++sourceAttempts===1)throw new Error('source failed');return 'loaded';}});
await assert.rejects(flaky.ensure('known'),/source failed/);assert.equal(flaky.has('known'),false);
assert.equal(await flaky.ensure('known'),'loaded');assert.equal(sourceAttempts,2);
assert.deepEqual(plain(residency.stats.pinned),[]);

// Exercise both production group capacities against the actual Hall catalogue
// and aggregate contribution allowance. These counts model buffers without
// allocating synthetic hundreds-of-thousands-vertex arrays in the test runner.
const perBay=Math.floor(actual.vertices/(actual.bays.length*3))*3;
const galleryVertices=Array(actual.galleries).fill(0);
for(const bay of actual.bays)galleryVertices[bay.room]+=perBay;
galleryVertices[actual.bays[0].room]+=actual.vertices-perBay*actual.bays.length;
for(const capacity of [2,3]){
 let liveVertices=0,liveGroups=0,peakGroups=0,peakBytes=0;
 const cache=createGrandHallResidency({capacity,build:id=>{const value={vertices:galleryVertices[id]};liveVertices+=value.vertices;liveGroups++;peakGroups=Math.max(peakGroups,liveGroups);peakBytes=Math.max(peakBytes,liveVertices*48);return value;},dispose:value=>{liveVertices-=value.vertices;liveGroups--;}});
 for(let id=0;id<actual.galleries;id++)await cache.setVisible([id,...id>0?[id-1]:[]]);
 assert.equal(peakGroups,capacity,'actual gallery catalogue respects the phone/desktop group cap');
 assert.ok(peakBytes<=actual.vertices*48,'resident exhibit buffers share one aggregate Hall contribution allowance');
 await cache.dispose();assert.equal(liveVertices,0);assert.equal(liveGroups,0);
}
// Geometry can be concentrated in one gallery: a count cap alone must not be
// reported as a smaller byte cap or as a per-model complexity guarantee.
let concentratedBytes=0;
const concentrated=createGrandHallResidency({capacity:2,build:id=>{const bytes=id===0?actual.vertices*48:0;concentratedBytes+=bytes;return{bytes};},dispose:value=>{concentratedBytes-=value.bytes;}});
await concentrated.setVisible([0,1]);assert.equal(concentratedBytes,actual.vertices*48);await concentrated.dispose();assert.equal(concentratedBytes,0);
console.log('Hall residency QA passed: 1,200 inactive-aware exhibits, 120 galleries, three resident GPU groups, disposal/revisit, superseded navigation, retries, and 100 deduplicated source loads at concurrency two.');
console.log('Hall catalogue capacity QA passed: '+actual.bays.length+' bays, '+actual.galleries+' galleries, desktop/phone group caps and one '+actual.vertices+'-vertex aggregate exhibit allowance ('+(actual.vertices*48/1048576).toFixed(2)+' MiB of vertex buffers).');
