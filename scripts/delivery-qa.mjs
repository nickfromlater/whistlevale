#!/usr/bin/env node
// Exercise real builds in an isolated fixture. No network, deployment or generation.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {cp,mkdir,mkdtemp,readFile,readdir,rm,writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const fixture=await mkdtemp(path.join(os.tmpdir(),'whistlevale-delivery-'));
const digest=buffer=>createHash('sha256').update(buffer).digest('hex').slice(0,16);
const walk=async directory=>(await Promise.all((await readdir(directory,{withFileTypes:true})).map(entry=>entry.isDirectory()?walk(path.join(directory,entry.name)):path.join(directory,entry.name)))).flat();
const external=html=>[...html.matchAll(/\b(?:src|href)=["']([^"']+)["']/g)].map(match=>match[1]).filter(url=>!url.startsWith('#')&&!/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(url));
// A small DOM adapter for asset replacement only. The real Hall document and
// renderer source are packed; inline scripts are never executed by this parser.
class PackingDocument{
 constructor(html){
  this.html=html;this.nodes=[];
  for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>|<link\b([^>]*)>/gi)){
   const script=match[1]!==undefined,attributes=script?match[1]:match[3];
   if(script&&!/\bsrc=/.test(attributes))continue;
   const node={tag:script?'script':'link',attributes,textContent:script?match[2]:'',start:match.index,end:match.index+match[0].length,replacement:null,
    getAttribute(name){return this.attributes.match(new RegExp('\\b'+name+'=["\\\']([^"\\\']*)["\\\']'))?.[1]??null;},
    removeAttribute(name){this.attributes=this.attributes.replace(new RegExp('\\s*'+name+'=["\\\'][^"\\\']*["\\\']'),'');},
    setAttribute(name,value){this.removeAttribute(name);this.attributes+=' '+name+'="'+value+'"';},
    replaceWith(other){this.replacement=other;},
    get outerHTML(){if(this.replacement)return this.replacement.outerHTML;return this.tag==='script'?'<script'+this.attributes+'>'+this.textContent+'</script>':'<link'+this.attributes+'>';}
   };this.nodes.push(node);
  }
  this.documentElement=this;
 }
 querySelectorAll(selector){
  if(selector==='script[src]')return this.nodes.filter(n=>n.tag==='script'&&n.getAttribute('src'));
  if(selector==='link[rel=stylesheet]')return this.nodes.filter(n=>n.tag==='link'&&n.getAttribute('rel')==='stylesheet');
  if(selector==='link[rel~="icon"]')return this.nodes.filter(n=>n.tag==='link'&&(n.getAttribute('rel')||'').split(/\s+/).includes('icon'));
  throw new Error('Unexpected packing selector '+selector);
 }
 createElement(tag){return{tag,textContent:'',get outerHTML(){return'<'+tag+'>'+this.textContent+'</'+tag+'>';}};}
 get outerHTML(){let html=this.html;for(const node of [...this.nodes].reverse())html=html.slice(0,node.start)+node.outerHTML+html.slice(node.end);return html.replace(/^<!doctype[^>]*>\s*/i,'');}
}
async function checkPortableHall(build){
 const hobby=await readFile(path.join(root,'src/hobby.js'),'utf8'),requests=[],blobs=[],navigations=[];
 const sandbox={Blob,URLSearchParams,console,window:{},HOUSE_ROOMS:{grandhall:{map:{destination:'grandhall.html'}},commons:{}},hobby:{room:'commons'},
  location:{href:'https://fixture.test/index.html?room=commons',origin:'https://fixture.test',assign:url=>navigations.push(url)},
  URL:class extends URL{static createObjectURL(blob){blobs.push(blob);return'blob:https://fixture.test/portable-hall-'+blobs.length;}},
  DOMParser:class{parseFromString(html,type){assert.equal(type,'text/html');return new PackingDocument(html);}},
  fetch:async value=>{const url=new URL(value);requests.push(url.href);assert.equal(url.origin,'https://fixture.test','packing uses this build');try{const data=await readFile(path.join(fixture,'dist',url.pathname));return{ok:true,text:async()=>data.toString('utf8')};}catch{return{ok:false};}}
 };
 const context=vm.createContext(sandbox),run=code=>vm.runInContext(code,context);
 run(hobby.slice(hobby.indexOf('async function packHouseHall('),hobby.indexOf('\nexportPlayable=async function(')));
 run(hobby.slice(hobby.indexOf('function visitHouseDestination('),hobby.indexOf('\nfunction visitHouseRoom(')));
 run(hobby.slice(hobby.indexOf('function houseInitialParams('),hobby.indexOf('\nsetTimeout(startHouse,50)')));
 const packed=await run('packHouseHall()');
 assert.ok(packed.startsWith('<!DOCTYPE html>'),'portable Hall is a standalone HTML document');
 assert.deepEqual(external(packed),[],'portable Hall needs no external scripts, styles or icon');
 assert.equal(requests.length,1+build.hallRefs.filter(url=>url.endsWith('.js')).length,'Hall page and each external renderer source are packed once');
 const registry=(await readFile(path.join(root,'src/grandhall-exhibits.js'),'utf8')).replace(/<\/script/gi,'<\\/script');
 assert.ok(packed.includes(registry),'native exhibit definitions and original creator credits survive packing');
 assert.ok(packed.includes('function willowbankPottery('),'the actual native model is present');

 // Execute the exporter's exact payload block. An already packed document
 // replaces its prior payload, preserves script safety and performs no fetch.
 sandbox.window.HOUSE_EMBEDDED_HALL=packed;
 const payloads=[{id:'embeddedHouseHall',textContent:'obsolete'}];
 const source={querySelector:selector=>selector==='head'?{append:node=>payloads.push(node)}:selector==='#embeddedHouseHall'?{remove:()=>payloads.splice(0,payloads.length)}:null};
 sandbox.source=source;sandbox.document={createElement:()=>({id:'',textContent:''})};
 const blockStart=hobby.indexOf('  const hall=await packHouseHall();'),blockEnd=hobby.indexOf("  for(const node of source.querySelectorAll('script[src]'))",blockStart);
 assert.ok(blockStart>0&&blockEnd>blockStart);
 const beforeRepack=requests.length;
 await run('(async()=>{'+hobby.slice(blockStart,blockEnd)+'})()');
 assert.equal(requests.length,beforeRepack,'repacking an offline house makes no Hall requests');
 assert.equal(payloads.length,1,'repacking keeps one Hall payload');
 assert.ok(!payloads[0].textContent.includes('</script>'),'Hall HTML cannot close its containing payload script');
 const restored={};vm.runInNewContext(payloads[0].textContent,{window:restored});assert.equal(restored.HOUSE_EMBEDDED_HALL,packed,'script-safe embedding preserves every Hall byte');

 for(const address of ['file:///tmp/whistlevale.html?room=commons','blob:https://fixture.test/offline-house']){
  sandbox.location.href=address;sandbox.location.origin=address.startsWith('file:')?'null':'https://fixture.test';
  assert.equal(run("visitHouseDestination('grandhall')"),true,'portable Hall opens from file and blob house URLs');
  const entry=await blobs.at(-1).text(),bootstrap=entry.match(/<head\b[^>]*><script>([\s\S]*?)<\/script>/i);
  assert.ok(bootstrap,'return context precedes Hall startup');const window={};vm.runInNewContext(bootstrap[1],{window});
  assert.equal(window.HOUSE_RETURN_URL,address);assert.equal(window.HOUSE_HALL_FROM,'commons');
  assert.ok(entry.includes('function willowbankPottery('));assert.ok(navigations.at(-1).startsWith('blob:'));
 }
 assert.equal(requests.length,beforeRepack,'portable Hall entry needs no network');
 const returnStart=build.hallHTML.indexOf('function hallReturnAddress('),returnEnd=build.hallHTML.indexOf('\nfunction syncHallAddress(',returnStart);
 assert.ok(returnStart>0&&returnEnd>returnStart,'the Hall exposes its shared return-address resolver');
 for(const address of ['file:///tmp/whistlevale.html?room=commons','blob:https://fixture.test/offline-house']){
  const back=vm.runInNewContext(build.hallHTML.slice(returnStart,returnEnd)+'\nhallReturnAddress();',{URL,URLSearchParams,window:{HOUSE_RETURN_URL:address,HOUSE_HALL_FROM:'commons'},location:{href:'blob:https://fixture.test/portable-hall'},hallInitialURL:new URL('blob:https://fixture.test/portable-hall')});
  assert.equal(back.pathname,new URL(address).pathname,'return preserves the file or blob identity');
  if(back.protocol==='blob:')assert.equal(back.href.split('#')[0],address,'a blob return uses only its fragment');
  Object.assign(sandbox.location,{protocol:back.protocol,search:back.search,hash:back.hash});
  const params=run('houseInitialParams()');assert.equal(params.get('map'),'grandhall');assert.equal(params.get('room'),'commons','return restores the prior room under the map');
 }
 Object.assign(sandbox.location,{protocol:'blob:',search:'',hash:'#map=unknown&room=commons'});
 assert.equal(run('houseInitialParams().has("room")'),false,'unrecognized blob map fragments are ignored');
 Object.assign(sandbox.location,{protocol:'https:',search:'?room=commons',hash:'#map=grandhall'});
 assert.equal(run('houseInitialParams().has("map")'),false,'normal pages retain their query-string navigation contract');
 sandbox.HOUSE_ROOMS.elsewhere={map:{destination:'https://elsewhere.test/'}};
 sandbox.location.href='https://fixture.test/index.html';sandbox.location.origin='https://fixture.test';
 assert.throws(()=>run("visitHouseDestination('elsewhere')"),/must stay on this site/,'embedding does not relax other destinations');
 delete sandbox.window.HOUSE_EMBEDDED_HALL;sandbox.fetch=async()=>({ok:false});
 await assert.rejects(run('packHouseHall()'),/Could not pack the Grand Hall/,'a missing Hall aborts an incomplete export');
}
async function build(){
 execFileSync(process.execPath,['scripts/build.mjs'],{cwd:fixture,stdio:'pipe'});
 const html=await readFile(path.join(fixture,'dist/index.html'),'utf8'),hallHTML=await readFile(path.join(fixture,'dist/grandhall.html'),'utf8'),window={};
 const catalog=html.match(/<script id="audioCatalog">([\s\S]*?)<\/script>/);assert.ok(catalog,'built page has the audio catalog');
 vm.runInNewContext(catalog[1],{window});
 const community=html.match(/<script id="communityCatalog">([\s\S]*?)<\/script>/);assert.ok(community,'built page embeds the reviewed contribution catalogue');
 vm.runInNewContext(community[1],{window});
 assert.deepEqual(JSON.parse(JSON.stringify(window.HOUSE_COMMUNITY)),JSON.parse(await readFile(path.join(fixture,'contributions/world.json'),'utf8')),'contribution data and credits survive the public build');
 const files=(await walk(path.join(fixture,'dist'))).map(file=>path.relative(path.join(fixture,'dist'),file).split(path.sep).join('/')).sort();
 const refs=external(html),hallRefs=external(hallHTML);
 for(const [page,references]of [['index.html',refs],['grandhall.html',hallRefs]]){
  for(const url of references){
   const file=new URL(url,'https://fixture.test/'+page).pathname.replace(/^\//,'')||'index.html';
   await readFile(path.join(fixture,'dist',file));
   assert.ok(file.startsWith('immutable/')||['index.html','grandhall.html'].includes(file),page+' references only versioned assets or public pages: '+url);
  }
  const source=await readFile(path.join(fixture,page),'utf8');
  for(const file of external(source).filter(url=>url.startsWith('src/')&&url.endsWith('.js'))){
   const fingerprint='immutable/'+file.replace(/\.js$/,'.'+digest(await readFile(path.join(fixture,file)))+'.js');
   assert.ok(references.includes(fingerprint),page+' points at the current public source: '+file);
  }
 }
 assert.ok(!files.some(file=>/^(src\/.*\.(js|css)|assets\/audio\/.*\.mp3|assets\/favicon\.svg)$/.test(file)),'no original app/audio duplicates are emitted');
 for(const file of files.filter(file=>file.startsWith('immutable/'))){
  const match=file.match(/\.([a-f0-9]{16})\.(js|css|mp3|svg)$/);assert.ok(match,'only content-fingerprinted files occupy the immutable directory');
  const original=file.replace(/^immutable\//,'').replace(/\.[a-f0-9]{16}(?=\.[^.]+$)/,'');
  const before=await readFile(path.join(fixture,original)),after=await readFile(path.join(fixture,'dist',file));
  assert.ok(before.equals(after),'versioning preserves every byte: '+original);assert.equal(digest(after),match[1],'filename matches actual content');
 }
 assert.deepEqual([...window.HOUSE_AUDIO_AVAILABLE].sort(),Object.keys(window.HOUSE_AUDIO_URLS).sort(),'catalog and URL manifest agree');
 for(const url of Object.values(window.HOUSE_AUDIO_URLS))assert.ok(files.includes(url),'every declared recording is deployed');
 assert.ok(!files.some(file=>file.includes('.private')||(file.startsWith('assets/')&&file.endsWith('.json'))),'private fixture and receipts stay out');
 return {html,hallHTML,files,refs,hallRefs,window:JSON.parse(JSON.stringify(window))};
}
try{
 await mkdir(path.join(fixture,'scripts'),{recursive:true});
 await cp(path.join(root,'scripts/build.mjs'),path.join(fixture,'scripts/build.mjs'));
 await cp(path.join(root,'scripts/community-lib.mjs'),path.join(fixture,'scripts/community-lib.mjs'));
 await cp(path.join(root,'contributions'),path.join(fixture,'contributions'),{recursive:true});
 await cp(path.join(root,'grandhall.html'),path.join(fixture,'grandhall.html'));
 const originalHallHTML=await readFile(path.join(fixture,'grandhall.html'),'utf8');
 const originalHTML=await readFile(path.join(root,'index.html'),'utf8');await writeFile(path.join(fixture,'index.html'),originalHTML);
 await cp(path.join(root,'src'),path.join(fixture,'src'),{recursive:true,filter:file=>!path.basename(file).startsWith('.')});
 await cp(path.join(root,'assets'),path.join(fixture,'assets'),{recursive:true,filter:file=>!path.basename(file).startsWith('.')&&!file.endsWith('.mp3')});
 await mkdir(path.join(fixture,'assets/.private'),{recursive:true});await writeFile(path.join(fixture,'assets/.private/secret.js'),'not public');
 await mkdir(path.join(fixture,'assets/audio'),{recursive:true});
 const empty=await build();assert.equal(empty.window.HOUSE_AUDIO_AVAILABLE.length,0,'a source-only clone needs no recordings');
 assert.equal(await readFile(path.join(fixture,'index.html'),'utf8'),originalHTML,'the source page is unchanged');
 assert.equal(await readFile(path.join(fixture,'grandhall.html'),'utf8'),originalHallHTML,'the Hall source page is unchanged');

 // Use local recordings if present. A clean CI clone uses opaque byte fixtures
 // for packaging checks; these are never decoded, published or treated as audio.
 const available=await readdir(path.join(root,'assets/audio')).catch(error=>{if(error.code==='ENOENT')return[];throw error;});
 const recordings=available.filter(file=>file.endsWith('.mp3')&&!file.startsWith('.'));
 if(recordings.length)for(const file of recordings)await cp(path.join(root,'assets/audio',file),path.join(fixture,'assets/audio',file));
 else for(const id of ['town','arrival'])await writeFile(path.join(fixture,'assets/audio',id+'.mp3'),Buffer.from('delivery byte fixture: '+id));
 const populated=await build();assert.equal(populated.window.HOUSE_AUDIO_AVAILABLE.length,recordings.length||2);
 const stable=await build();assert.equal(stable.html,populated.html,'unchanged content keeps identical URLs and HTML');assert.deepEqual(stable.files,populated.files);
 assert.equal(stable.hallHTML,populated.hallHTML,'unchanged Hall content keeps identical URLs and HTML');assert.deepEqual(stable.hallRefs,populated.hallRefs);

 const cssFile=path.join(fixture,'src/hobby.css');await writeFile(cssFile,(await readFile(cssFile,'utf8'))+'\n/* isolated fingerprint check */\n');
 const cssChanged=await build();assert.equal(cssChanged.refs.filter(url=>!populated.refs.includes(url)).length,1,'one changed stylesheet changes only its fingerprint');
 assert.equal(cssChanged.refs.filter(url=>!populated.refs.includes(url))[0].includes('hobby.'),true);
 assert.deepEqual(cssChanged.window.HOUSE_AUDIO_URLS,populated.window.HOUSE_AUDIO_URLS,'unrelated recordings retain cacheable URLs');
 assert.notEqual(cssChanged.html,populated.html,'fresh HTML points at the new stylesheet');
 assert.equal(cssChanged.hallHTML,populated.hallHTML,'a main-page stylesheet does not invalidate the Hall');

 const changedId=populated.window.HOUSE_AUDIO_AVAILABLE[0],recording=path.join(fixture,'assets/audio',changedId+'.mp3');
 await writeFile(recording,Buffer.concat([await readFile(recording),Buffer.from([1])]));
 const audioChanged=await build();
 assert.notEqual(audioChanged.window.HOUSE_AUDIO_URLS[changedId],cssChanged.window.HOUSE_AUDIO_URLS[changedId],'a replaced recording receives a new URL');
 for(const id of populated.window.HOUSE_AUDIO_AVAILABLE)if(id!==changedId)assert.equal(audioChanged.window.HOUSE_AUDIO_URLS[id],cssChanged.window.HOUSE_AUDIO_URLS[id],'other recording fingerprints stay stable');
 assert.deepEqual(audioChanged.refs,cssChanged.refs,'an audio replacement does not invalidate unchanged application files');
 assert.deepEqual(audioChanged.hallRefs,cssChanged.hallRefs,'an audio replacement does not invalidate Hall sources');
 assert.ok(!audioChanged.files.includes(cssChanged.window.HOUSE_AUDIO_URLS[changedId]),'no obsolete recording duplicate remains');

 const hallData=path.join(fixture,'src/grandhall-data.js');await writeFile(hallData,(await readFile(hallData,'utf8'))+'\n// isolated shared Hall fingerprint check\n');
 const hallChanged=await build();
 for(const key of ['refs','hallRefs']){
  const changed=hallChanged[key].filter(url=>!audioChanged[key].includes(url));
  assert.equal(changed.length,1,'a Hall catalogue change updates one shared source per page');
  assert.ok(changed[0].includes('/grandhall-data.'),'both pages receive the updated gallery and bay catalogue');
  const obsolete=audioChanged[key].find(url=>url.includes('/grandhall-data.'));
  assert.ok(!hallChanged.files.includes(obsolete),'no obsolete Hall catalogue remains in the build');
 }
 assert.notEqual(hallChanged.hallHTML,audioChanged.hallHTML,'fresh Hall HTML points at the changed shared catalogue');
 await checkPortableHall(hallChanged);
 console.log('Portable Hall QA passed: native models and credits packed, offline repacking and file/blob entry, return context, script-safe embedding and incomplete-export rejection.');

 const config=JSON.parse(await readFile(path.join(root,'vercel.json'),'utf8'));
 const cacheRules=config.headers.filter(rule=>rule.headers.some(header=>header.key.toLowerCase()==='cache-control'));
 const value=rule=>rule.headers.find(header=>header.key.toLowerCase()==='cache-control').value;
 for(const route of ['/','/index.html','/grandhall.html'])assert.match(value(cacheRules.find(rule=>rule.source===route)),/max-age=0, must-revalidate/,'HTML always revalidates');
 const immutable=cacheRules.filter(rule=>value(rule).includes('immutable'));assert.equal(immutable.length,1);assert.equal(immutable[0].source,'/immutable/(.*)');assert.match(value(immutable[0]),/max-age=31536000/);
 for(const rule of cacheRules.filter(rule=>rule.source!=='/immutable/(.*)'))assert.ok(!value(rule).includes('immutable'),'original same-name URLs never get immutable caching');
 console.log(`Delivery QA passed: source-only and ${recordings.length||2}-recording builds, main/Hall public references, byte identity, deterministic fingerprints, isolated CSS/audio/shared-Hall invalidation, complete manifests, no unversioned duplicates, and fresh HTML cache policy.`);
}finally{await rm(fixture,{recursive:true,force:true});}
