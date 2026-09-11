import {readFile,stat} from 'node:fs/promises';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const root=fileURLToPath(new URL('..',import.meta.url));
export const read=file=>readFile(path.join(root,file),'utf8');
export async function communityContext(){
 const noop=()=>{},gradient={addColorStop:noop},drawing=new Proxy({measureText:text=>({width:String(text).length*7}),createLinearGradient:()=>gradient,createRadialGradient:()=>gradient},{get:(o,k)=>o[k]||noop,set:(o,k,v)=>(o[k]=v,true)});
 const element=()=>({textContent:'null',style:{setProperty:noop},classList:{add:noop,remove:noop,toggle:noop},setAttribute:noop,addEventListener:noop,getContext:()=>drawing});
 const context=vm.createContext({console,document:{getElementById:element,createElement:element,addEventListener:noop,querySelectorAll:()=>[]},matchMedia:()=>({matches:false}),innerWidth:1440,innerHeight:900,devicePixelRatio:1,setTimeout:noop,clearTimeout:noop,requestAnimationFrame:noop});
 context.window=context;context.addEventListener=noop;
 const run=code=>vm.runInContext(code,context,{timeout:10000});
 run(await read('src/community-core.js'));run(await read('src/mesh-memory.js'));run(await read('src/railway.js'));
 return {context,run};
}
export async function loadCommunity(){
 const {context,run}=await communityContext();context.catalogue=JSON.parse(await read('contributions/world.json'));
 const clean=run('validateCommunity(catalogue)');
 // Execute project-owned source only. Contributor JSON is passed as data.
 const roomKeys=new Set(['valley']);
 for(const [,file]of (await read('index.html')).matchAll(/src="(src\/rooms\/[^"?]+\.js)"/g))for(const [,key]of (await read(file)).matchAll(/registerHouseRoom\(['"]([a-z][a-z0-9-]*)['"]/g))roomKeys.add(key);
 for(const work of clean.works){
  if(work.room!=='house'&&!roomKeys.has(work.room))throw new Error(work.id+': unknown room '+work.room);
  if(!(await stat(path.join(root,work.source))).isFile())throw new Error(work.id+': missing source file');
  for(const p of work.workshop||[]){context.piece={...p,x:p.at[0],z:p.at[1],angle:p.angle??0,scale:p.scale??1};
   run('validateProject({format:"alder-valley-workshop",version:1,objects:[piece],tracks:divisionDesign(),livery:"green",coaches:3})');
  }
 }
 return JSON.parse(JSON.stringify(clean));
}
export async function loadReviewedHallSources({run},{loaded=new Set(),readSource=read}={}){
 // Only the checked-in Hall registry selects executable sources. Imported
 // contribution JSON stays data, including any source paths it contains.
 const sources=run("typeof GRAND_HALL_EXHIBITS==='undefined'?[]:[...new Set(GRAND_HALL_EXHIBITS.map(exhibit=>exhibit.source))]");
 for(const source of sources){
  if(typeof source!=='string'||!/^src\/scenery\/[a-z][a-z0-9-]*\.js$/.test(source))throw new Error('Invalid reviewed Hall source: '+source);
  if(loaded.has(source))continue;
  run(await readSource(source));loaded.add(source);
 }
}
export async function loadContributionDefinitions({context,run},catalogue,{readSource=read}={}){
 context.HOUSE_COMMUNITY=catalogue;
 const loaded=new Set(['src/community-core.js','src/mesh-memory.js','src/railway.js']);
 const files=[...(await readSource('index.html')).matchAll(/<script src="(src\/[^"?]+\.js)"/g)].map(m=>m[1]);
 for(const file of files){
  if(file==='src/hobby.js')break;
  if(!loaded.has(file)){run(await readSource(file));loaded.add(file);}
 }
 // Browser startup leaves Hall-only code deferred. Geometry review must still
 // exercise every registered native model with the complete shared helpers.
 await loadReviewedHallSources({run},{loaded,readSource});
}
export function prepareCommunityGeometry({context,run}){
 const noop=()=>{};context.communityGL=new Proxy({getParameter:()=>8192},{get:(o,k)=>k in o?o[k]:noop});
 context.communityUpload=data=>{
  if(data.length%36||data.some(n=>!Number.isFinite(n)))throw new Error('A contribution scene contains invalid geometry.');
  return {count:data.length/12};
 };
 run('gl=communityGL;upload=communityUpload;disposeMesh=function(){};initLabels();initRoomArt();initHouseArt();');
}
export function inspectCommunityScenes({run},keys){
 // Give each authored room its own bounded execution window. Building every
 // room in one VM call can time out on shared CI runners as the house grows.
 return keys.map(key=>run(`(()=>{const key=${JSON.stringify(key)};
  const scene=getHouseScene(key),omitted=scene.lifeDetails.omitted||[];
  if(omitted.length){const p=omitted[0];throw new Error(p.id+' miniatures['+p.placement+'] in '+key+' at ['+p.at.join(', ')+']: '+p.reason);}
  const placements=scene.lifeDetails.details.filter(d=>d.contribution).length;
  return {room:key,placements,vertices:scene.lifeDetails.communityVertices};
 })()`));
}
// Check-time model measurements, not a browser startup or frame-loop task.
// Room totals above also include any terrain terrace added by the adapter.
export function inspectCommunityModels({run},keys){
 return run(`(()=>{const result=[],savedSeed=seed;try{for(const key of ${JSON.stringify(keys)}){
  communityMiniatures(key,(name,fn,x,z,angle,declaredRadius,y,credits,id,placement)=>{
   const b=new Builder();fn(b,0,0,0,0);let measuredRadius=0;
   for(let i=0;i<b.data.length;i+=12)measuredRadius=Math.max(measuredRadius,Math.hypot(b.data[i],b.data[i+2]));
   communityAssert(b.data.length>0&&b.data.length%36===0&&b.data.every(Number.isFinite),id+' has invalid model geometry.');
   communityAssert(measuredRadius<=declaredRadius+1e-8,id+' miniatures['+placement+'] exceeds its declared footprint: '+measuredRadius+' > '+declaredRadius+'.');
   const work=communityCatalogue.works.find(w=>w.id===id);
   result.push({id,room:key,placement,builder:work.miniatures[placement].builder,vertices:b.data.length/12,measuredRadius:Math.round(measuredRadius*10000)/10000,declaredRadius});
  });
 }return result;}finally{seed=savedSeed;}})()`);
}
export const scriptJSON=value=>JSON.stringify(value).replace(/</g,'\\u003c');
