'use strict';

// Geometry ownership is separate from the gallery catalogue and source code.
// build(id) returns one resource group; dispose(group,id) releases it completely.
// A failed build must release its own partial allocations before rejecting.
// schedule() may yield to the next frame before each new gallery is built.
function createGrandHallResidency({capacity=3,build,dispose,schedule=()=>Promise.resolve()}={}){
 if(!Number.isInteger(capacity)||capacity<1)throw new RangeError('Hall residency needs a positive integer capacity.');
 if(typeof build!=='function'||typeof dispose!=='function'||typeof schedule!=='function')throw new TypeError('Hall residency needs build, dispose and schedule callbacks.');
 const entries=new Map(),counts={builds:0,evictions:0,disposals:0,failures:0};
 let pinned=new Set(),request=null,running=null,inFlight=null,clock=0,epoch=0,closed=false;
 const snapshot=()=>({capacity,resident:entries.size,building:inFlight===null?0:1,pinned:[...pinned],residentIds:[...entries.keys()],...counts});
 function release(id,entry,evicted=false){
  entries.delete(id);dispose(entry.value,id);counts.disposals++;if(evicted)counts.evictions++;
 }
 function settle(job,error=null,current=true){
  if(!job||job.settled)return;job.settled=true;
  if(error)job.reject(error);else job.resolve({current,residentIds:[...entries.keys()]});
 }
 function makeSpace(){
  if(entries.size<capacity)return;
  let oldest=null;for(const [id,entry]of entries)if(!pinned.has(id)&&(!oldest||entry.used<oldest[1].used))oldest=[id,entry];
  if(!oldest)throw new Error('Hall residency cannot evict a visible gallery.');
  release(oldest[0],oldest[1],true);
 }
 async function pump(){
  while(!closed&&request&&!request.settled){
   const job=request,id=job.ids.find(key=>!entries.has(key)),generation=epoch;
   if(id===undefined){settle(job);continue;}
   try{
    await schedule();if(closed||request!==job||job.settled)continue;
    makeSpace();const started=epoch;inFlight=id;counts.builds++;
    let value;
    try{value=await build(id);}finally{inFlight=null;}
    if(closed||started!==epoch||!pinned.has(id)){dispose(value,id);counts.disposals++;}
    else entries.set(id,{value,used:++clock});
   }catch(error){counts.failures++;if(request&&!request.settled&&generation===epoch&&pinned.has(id))settle(request,error);}
  }
 }
 function start(){
  if(running)return;
  running=Promise.resolve().then(pump).finally(()=>{running=null;if(!closed&&request&&!request.settled)start();});
 }
 function setVisible(ids){
  if(closed)return Promise.reject(new Error('Hall residency has been disposed.'));
  const next=[...new Set(ids)];
  if(next.some(id=>!(typeof id==='string'&&id.length||Number.isInteger(id)&&id>=0)))throw new TypeError('Hall gallery IDs must be nonempty strings or nonnegative integers.');
  if(next.length>capacity)throw new RangeError('Visible Hall galleries exceed the residency capacity.');
  if(request&&!request.settled&&next.length===request.ids.length&&next.every((id,index)=>id===request.ids[index]))return request.promise;
  settle(request,null,false);pinned=new Set(next);
  for(const id of next){const entry=entries.get(id);if(entry)entry.used=++clock;}
  const job={ids:next,settled:false};job.promise=new Promise((resolve,reject)=>{job.resolve=resolve;job.reject=reject;});request=job;
  start();return job.promise;
 }
 function clear(){
  epoch++;pinned=new Set();settle(request,null,false);request=null;
  for(const [id,entry]of entries)release(id,entry);
  return running||Promise.resolve();
 }
 return{setVisible,has:id=>entries.has(id),peek:id=>entries.get(id)?.value,clear,
  dispose(){closed=true;return clear();},get stats(){return snapshot();}};
}

// The caller executes only reviewed classic scripts from its document's source
// placeholders (or their packed inline text). This queue owns authorization,
// deduplication and concurrency; it never evaluates source or fetches URLs.
function createGrandHallSourceLoader({sources,load,concurrency=1}={}){
 if(!Array.isArray(sources)||sources.some(source=>typeof source!=='string'||!source))throw new TypeError('Hall source loading needs an exact source allowlist.');
 if(typeof load!=='function')throw new TypeError('Hall source loading needs a load callback.');
 if(!Number.isInteger(concurrency)||concurrency<1)throw new RangeError('Hall source concurrency must be a positive integer.');
 const allowed=new Set(sources),jobs=new Map(),queue=[];let active=0,completed=0,failures=0;
 function drain(){
  while(active<concurrency&&queue.length){
   const job=queue.shift();active++;job.state='loading';
   Promise.resolve().then(()=>load(job.source)).then(value=>{job.state='loaded';job.value=value;completed++;job.resolve(value);},error=>{jobs.delete(job.source);failures++;job.reject(error);}).finally(()=>{active--;drain();});
  }
 }
 function ensure(source){
  if(!allowed.has(source))return Promise.reject(new RangeError('Unregistered Hall exhibit source: '+source));
  const existing=jobs.get(source);if(existing)return existing.promise;
  const job={source,state:'queued'};job.promise=new Promise((resolve,reject)=>{job.resolve=resolve;job.reject=reject;});jobs.set(source,job);queue.push(job);drain();return job.promise;
 }
 function ensureMany(sources){
  const unique=[...new Set(sources)];
  if(unique.some(source=>!allowed.has(source)))return Promise.reject(new RangeError('Unregistered Hall exhibit source.'));
  return Promise.all(unique.map(ensure));
 }
 return{ensure,ensureMany,has:source=>jobs.get(source)?.state==='loaded',get stats(){return{active,queued:queue.length,loaded:[...jobs.values()].filter(job=>job.state==='loaded').length,completed,failures,concurrency};}};
}
