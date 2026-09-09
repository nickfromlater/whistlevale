import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const read=file=>readFile(new URL('../'+file,import.meta.url),'utf8');
const html=await read('grandhall.html'),residencySource=await read('src/grandhall-residency.js');
function throughBody(source,start,body=source.indexOf('{',start)){
 let depth=0,quote='',line=false,block=false;
 for(let i=body;i<source.length;i++){
  const c=source[i],next=source[i+1];
  if(line){if(c==='\n')line=false;continue;}
  if(block){if(c==='*'&&next==='/'){block=false;i++;}continue;}
  if(quote){if(c==='\\'){i++;continue;}if(c===quote)quote='';continue;}
  if(c==='/'&&next==='/'){line=true;i++;continue;}if(c==='/'&&next==='*'){block=true;i++;continue;}
  if(c==='"'||c==="'"||c==='`'){quote=c;continue;}
  if(c==='{')depth++;else if(c==='}'&&--depth===0)return source.slice(start,i+1);
 }
 throw new Error('Unclosed source block');
}
function declaration(name){
 const start=html.lastIndexOf('function '+name+'(');assert.ok(start>=0,'Missing '+name);let depth=0;
 for(let i=html.indexOf('(',start);i<html.length;i++){if(html[i]==='(')depth++;else if(html[i]===')'&&--depth===0)return throughBody(html,start,html.indexOf('{',i+1));}
 throw new Error('Unclosed parameters for '+name);
}
const flush=async()=>{for(let i=0;i<30;i++)await Promise.resolve();};
async function harness(){
 const nodes=new Map(),timers=new Map(),pending=new Map(),built=[],disposed=[],errors=[],frames=[];let nextTimer=0;
 const node=id=>{
  if(!nodes.has(id)){const classes=new Set();nodes.set(id,{hidden:true,textContent:'',classList:{add:name=>classes.add(name),remove:name=>classes.delete(name),contains:name=>classes.has(name)},focus(){}});}
  return nodes.get(id);
 };
 const context=vm.createContext({URL,URLSearchParams,GL:{},requestAnimationFrame:fn=>frames.push(fn),frame(){},console:{error:error=>errors.push(error.message)},$:node,
  setTimeout:fn=>{timers.set(++nextTimer,fn);return nextTimer;},clearTimeout:id=>timers.delete(id),
  clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),len:v=>Math.hypot(...v),sub:(a,b)=>a.map((v,i)=>v-b[i]),norm:v=>v,dot:(a,b)=>a.reduce((sum,v,i)=>sum+v*b[i],0),project:()=>({w:-1,x:0,y:0}),
  stopTour(){},setBayBrowsing(){},closeAnyModal(){},setWalk(){},clearInspection(){},frameHallRoom(){},updateRoomUI(){},selectBay(){},
  build:id=>{built.push(id);if(id===0)return Promise.resolve({id});return new Promise((resolve,reject)=>pending.set(id,{resolve,reject}));},dispose:group=>disposed.push(group.id)});
 const run=code=>vm.runInContext(code,context);
 run(residencySource);
 const globals=html.match(/^let hallResidency=null,.*;$/m);assert.ok(globals,'Hall integration state is declared');run(globals[0]);
 run(`const state={room:0},ROOMS=[{id:'first',name:'First',x:0,z:0,width:10,depth:10},{id:'second',name:'Second',x:0,z:-12,width:10,depth:10},{id:'third',name:'Third',x:12,z:0,width:10,depth:10}],BAYS=[],portalNodes=[],GRAND_HALL_PASSAGES=[];
 const currentRoom=()=>ROOMS[state.room],hallResidentLimit=2,eye=[0,2.15,0],target=[0,2.15,1],width=1200,height=800,reduced=false;
 let travelToken=0,travelTimer=null,visibleRooms=new Set([0]),lightDirty=false;
 hallResidency=createGrandHallResidency({capacity:hallResidentLimit,build,dispose});`);
 for(const name of ['beginHallFrames','galleryHome','visitRoom','showHallLoadError','requestHallRooms','roomAt','canWalk','updateVisibleRooms'])run(declaration(name));
 const retryStart=html.indexOf("$('retryHallLoad').onclick=");assert.ok(retryStart>0,'Retry is wired in the actual Hall UI');run(throughBody(html,retryStart)+';');
 await run('requestHallRooms([0])');
 const finish=async(id,error=null)=>{await flush();const job=pending.get(id);assert.ok(job,'gallery '+id+' has a pending build');pending.delete(id);error?job.reject(new Error(error)):job.resolve({id});await flush();};
 const runTimers=()=>{const callbacks=[...timers.values()];timers.clear();for(const fn of callbacks)fn();};
 return{run,node,timers,pending,built,disposed,errors,frames,finish,runTimers};
}

// A failed destination must remain retryable even though the camera continues
// rendering the previous room and asking for its visible neighbors.
{
 const h=await harness();h.run('visitRoom(1,{instant:true})');await h.finish(1,'isolated exhibit source failure');
 assert.equal(h.run('state.room'),0);assert.equal(h.node('hallLoadNotice').hidden,false);
 assert.equal(h.frames.length,0,'a failed initial source has not started rendering');
 for(let i=0;i<3;i++){h.run('updateVisibleRooms()');await flush();}
 assert.equal(h.node('hallLoadNotice').hidden,false,'ordinary camera frames cannot erase a failed destination notice');
 h.node('retryHallLoad').onclick();h.runTimers();await h.finish(1);
 assert.equal(h.run('state.room'),1,'Retry enters the gallery that failed, not the old visible gallery');
 assert.equal(h.node('hallLoadNotice').hidden,true);assert.equal(h.built.filter(id=>id===1).length,2);
 assert.equal(h.run('hallTravelPending'),false);assert.equal(h.node('travelShade').classList.contains('active'),false);
 assert.equal(h.frames.length,1,'a recovered visit starts rendering even when startup never reached its frame loop');
 h.run('beginHallFrames();visitRoom(1,{instant:true})');assert.equal(h.frames.length,1,'recovery and repeated room entry cannot start a second frame loop');
}

// Retry of a background neighbor load retains the entire failed visible set.
{
 const h=await harness();const load=h.run('requestHallRooms([0,1])');await h.finish(1,'isolated neighbor failure');await load;
 h.run('updateVisibleRooms()');await flush();assert.equal(h.node('hallLoadNotice').hidden,false);
 h.node('retryHallLoad').onclick();await h.finish(1);
 assert.equal(h.run('state.room'),0,'retrying a neighbor does not move the visitor');assert.equal(h.run('hallResidency.has(1)'),true);
}

// Escape uses galleryHome. It must cancel both the fade timer and a destination
// already waiting for source/geometry, including a late successful completion.
{
 const h=await harness();h.run('visitRoom(1)');assert.equal(h.timers.size,1);h.run('galleryHome()');h.runTimers();await flush();
 assert.equal(h.timers.size,0);assert.deepEqual(h.built,[0],'Escape cancels a destination before its fade timer runs');
 h.run('visitRoom(1,{instant:true})');await flush();assert.ok(h.pending.has(1));
 h.run('galleryHome();updateVisibleRooms()');await h.finish(1);
 assert.equal(h.run('state.room'),0,'a cancelled async visit cannot teleport the visitor when its build finishes');
 assert.equal(h.run('hallTravelPending'),false);assert.equal(h.node('travelShade').classList.contains('active'),false);
}

// A newer destination wins while the single residency builder drains an older
// request; the old geometry is disposed and never commits as the active room.
{
 const h=await harness();h.run('visitRoom(1,{instant:true})');await flush();h.run('visitRoom(2,{instant:true})');
 await h.finish(1);assert.equal(h.run('state.room'),0);assert.ok(h.disposed.includes(1));
 await h.finish(2);assert.equal(h.run('state.room'),2);assert.equal(h.run('hallTravelPending'),false);
}

// Walking may approach a cold gallery outside the camera's visible portals.
// Its requested room must stay pinned when the same frame recomputes visibility.
{
 const h=await harness();assert.equal(h.run('canWalk([0,2.15,-12])'),false,'walking waits for real destination geometry');await flush();
 assert.ok(h.pending.has(1));h.run('updateVisibleRooms()');await flush();
 assert.equal(h.run('hallResidency.stats.pinned.includes(1)'),true,'visibility cannot replace an outstanding walking destination with only the old room');
 await h.finish(1);assert.equal(h.run('canWalk([0,2.15,-12])'),true,'walking proceeds once the target room is ready');
}

// A return to the map is distinct from a link back to a contribution. Portable
// file URLs can still contain the prior work query; blob returns use a fragment.
for(const original of ['file:///tmp/whistlevale.html?room=commons&work=willowbank-pottery&placement=0','blob:https://fixture.test/house#room=commons&work=willowbank-pottery&placement=0']){
 const result=vm.runInNewContext(declaration('hallReturnAddress')+';hallReturnAddress();',{URL,URLSearchParams,
  window:{HOUSE_RETURN_URL:original,HOUSE_HALL_FROM:'commons'},location:{href:'blob:https://fixture.test/hall'},hallInitialURL:new URL('blob:https://fixture.test/hall')});
 const params=result.protocol==='blob:'?new URLSearchParams(result.hash.slice(1)):result.searchParams;
 assert.equal(result.pathname,new URL(original).pathname);assert.equal(params.get('map'),'grandhall');assert.equal(params.get('room'),'commons');
 assert.equal(params.has('work'),false,'House map return clears a prior contribution target');assert.equal(params.has('placement'),false);
}
console.log('Hall navigation QA passed: persistent failure notices, destination/neighbor retries, Escape and superseded visits, cold walking destinations and portable map returns.');
