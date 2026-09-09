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
 run(await read('src/community-core.js'));run(await read('src/railway.js'));
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
export async function loadContributionDefinitions({context,run},catalogue){
 context.HOUSE_COMMUNITY=catalogue;
 const files=[...(await read('index.html')).matchAll(/<script src="(src\/[^"?]+\.js)"/g)].map(m=>m[1]);
 for(const file of files){
  if(file==='src/hobby.js')break;
  if(!['src/community-core.js','src/railway.js'].includes(file))run(await read(file));
 }
}
export const scriptJSON=value=>JSON.stringify(value).replace(/</g,'\\u003c');
