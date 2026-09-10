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
const external=html=>[...html.replace(/(<script\b[^>]*>)[\s\S]*?<\/script>/gi,'$1</script>').matchAll(/\s(?:src|href|data-src)=["']([^"']+)["']/g)].map(match=>match[1]).filter(url=>!url.startsWith('#')&&!/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(url));
assert.deepEqual(external('<script>const example=\' data-src="example-only.js"\';</script><script type="application/x-whistlevale-exhibit" data-src="real-source.js"></script>'),['real-source.js'],'source examples inside scripts are not network requests');
const attributes=text=>new Map([...text.matchAll(/(?:^|\s)([a-z][a-z0-9-]*)\s*=\s*(["'])(.*?)\2/gi)].map(match=>[match[1],match[3]]));
// A small DOM adapter for asset replacement only. The real Hall document and
// renderer source are packed; inline scripts are never executed by this parser.
class PackingDocument{
 constructor(html){
  this.html=html;this.nodes=[];
  for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>|<link\b([^>]*)>/gi)){
   const script=match[1]!==undefined,attributes=script?match[1]:match[3];
   const node={tag:script?'script':'link',attributes,textContent:script?match[2]:'',start:match.index,end:match.index+match[0].length,replacement:null,
    getAttribute(name){return this.attributes.match(new RegExp('(?:^|\\s)'+name+'\\s*=\\s*(["\\\'])(.*?)\\1'))?.[2]??null;},
    hasAttribute(name){return new RegExp('(?:^|\\s)'+name+'(?:\\s|=|$)').test(this.attributes);},
    removeAttribute(name){this.attributes=this.attributes.replace(new RegExp('(?:^|\\s)'+name+'\\s*=\\s*(["\\\'])(.*?)\\1'),'');},
    setAttribute(name,value){this.removeAttribute(name);this.attributes+=' '+name+'="'+value+'"';},
    get dataset(){return{source:this.getAttribute('data-source')};},
    remove(){this.removed=true;},
    replaceWith(other){this.replacement=other;},
    get outerHTML(){if(this.removed)return '';if(this.replacement)return this.replacement.outerHTML;return this.tag==='script'?'<script'+this.attributes+'>'+this.textContent+'</script>':'<link'+this.attributes+'>';}
   };this.nodes.push(node);
  }
  this.documentElement=this;
 }
 querySelectorAll(selector){
  const nodes=this.nodes.filter(n=>!n.removed);
  if(selector==='script')return nodes.filter(n=>n.tag==='script');
  if(selector==='script[src]')return nodes.filter(n=>n.tag==='script'&&n.getAttribute('src'));
  if(selector==='script[src],script[data-src]')return nodes.filter(n=>n.tag==='script'&&(n.hasAttribute('src')||n.hasAttribute('data-src')));
  if(selector==='script[type="application/x-whistlevale-exhibit"]')return nodes.filter(n=>n.tag==='script'&&n.getAttribute('type')==='application/x-whistlevale-exhibit');
  if(selector==='link[rel=stylesheet]')return nodes.filter(n=>n.tag==='link'&&n.getAttribute('rel')==='stylesheet');
  const icons=/^link\[rel~="([a-z-]+)"\](?:,link\[rel~="([a-z-]+)"\])?$/.exec(selector);
  if(icons){const wanted=icons.slice(1).filter(Boolean);return nodes.filter(n=>n.tag==='link'&&(n.getAttribute('rel')||'').split(/\s+/).some(rel=>wanted.includes(rel)));}
  throw new Error('Unexpected packing selector '+selector);
 }
 createElement(tag){return{tag,textContent:'',get outerHTML(){return'<'+tag+'>'+this.textContent+'</'+tag+'>';}};}
 get outerHTML(){let html=this.html;for(const node of [...this.nodes].reverse())html=html.slice(0,node.start)+node.outerHTML+html.slice(node.end);return html.replace(/^<!doctype[^>]*>\s*/i,'');}
}
const deferredScripts=html=>new PackingDocument(html).querySelectorAll('script[type="application/x-whistlevale-exhibit"]');
const catalogFrom=html=>{
 const script=new PackingDocument(html).nodes.find(node=>node.tag==='script'&&node.getAttribute('id')==='communityCatalog');
 assert.ok(script,'the page embeds reviewed contribution data');const window={};vm.runInNewContext(script.textContent,{window});return JSON.parse(JSON.stringify(window.HOUSE_COMMUNITY));
};
const analyticsAddress=value=>/(?:^|\/)analytics(?:\.[a-f0-9]+)?\.js(?:[?#]|$)|\/_vercel\/insights(?:\/|$)/i.test(value||'');
const trackingScripts=[
 '<script id="analyticsBootstrap">window.__portableTrackerSentinel=1;</script>',
 ...['data-railway-analytics','data-house-analytics','data-whistlevale-analytics'].map(marker=>'<script '+marker+'>window.__portableTrackerSentinel=1;</script>'),
 ...['src/analytics.js','/src/analytics.js?private=qa-secret#draft','immutable/src/analytics.0123456789abcdef.js',
  'https://fixture.test/immutable/src/analytics.fedcba9876543210.js?private=qa-secret#draft',
  '/_vercel/insights/script.js','//fixture.test/_vercel/insights/script.js?private=qa-secret#draft',
  'https://vendor.test/_vercel/insights/script.js?private=qa-secret#draft'].map(src=>'<script src="'+src+'"></script>'),
 '<script data-src="immutable/src/analytics.0123456789abcdef.js?private=qa-secret"></script>',
 '<script data-source="src/analytics.js">window.__portableTrackerSentinel=1;</script>'
].join('');
const withTracking=html=>html.replace('</head>',trackingScripts+'</head>');
function assertNoPortableAnalytics(html){
 for(const node of new PackingDocument(html).querySelectorAll('script')){
  assert.notEqual(node.getAttribute('id'),'analyticsBootstrap','portable output removes the bootstrap marker');
  for(const marker of ['data-railway-analytics','data-house-analytics','data-whistlevale-analytics'])assert.equal(node.hasAttribute(marker),false,'portable output removes marked inline trackers');
  for(const attribute of ['src','data-src','data-source'])assert.equal(analyticsAddress(node.getAttribute(attribute)),false,'portable output removes all tracker address forms');
  assert.ok(!node.textContent.includes('window.__portableTrackerSentinel=1'),'marked inline analytics never survive packing');
 }
}
async function checkDeferredSourceLoading(html,packed){
 const placeholders=deferredScripts(html),inserted=[],requested=[],errors=new Set();
 assert.ok(placeholders.length,'the Hall declares deferred native source');
 const sandbox={URL,console,location:{href:packed?'blob:https://fixture.test/portable-hall':'https://fixture.test/grandhall.html'},
  window:{addEventListener(type,fn){assert.equal(type,'error');errors.add(fn);},removeEventListener(type,fn){assert.equal(type,'error');errors.delete(fn);}},
  document:{querySelectorAll(selector){assert.equal(selector,'script[type="application/x-whistlevale-exhibit"]');return placeholders;},
   createElement(tag){assert.equal(tag,'script');return{dataset:{},textContent:'',remove(){this.removed=true;}};},head:{append(script){
    inserted.push(script);const execute=source=>{try{vm.runInContext(source,context,{timeout:1000});script.onload?.();}catch(error){for(const fn of [...errors])fn({filename:script.src||'',error});}};
    if(script.src){assert.equal(packed,false,'packed exhibit activation never requests a URL');const url=new URL(script.src);assert.equal(url.origin,'https://fixture.test');requested.push(url.pathname);readFile(path.join(fixture,'dist',url.pathname),'utf8').then(execute,()=>script.onerror());}
    else execute(script.textContent);
   }}}
 };
 const context=vm.createContext(sandbox),run=code=>vm.runInContext(code,context);
 const hall=await readFile(path.join(fixture,'grandhall.html'),'utf8'),start=hall.indexOf('function loadHallSource('),end=hall.indexOf('\nconst hallSources=',start);
 assert.ok(start>0&&end>start,'extract the actual Hall source activation callback');
 run(await readFile(path.join(fixture,'src/grandhall-residency.js'),'utf8'));run(hall.slice(start,end));
 sandbox.sources=placeholders.map(node=>node.dataset.source);run('const loader=createGrandHallSourceLoader({sources,load:loadHallSource,concurrency:1});');
 assert.equal(run('typeof willowbankPottery'),'undefined','parsing deferred source does not define or execute its model');assert.equal(inserted.length,0);assert.equal(requested.length,0);
 await assert.rejects(run('loader.ensure("src/scenery/unreviewed.js")'),/Unregistered/);assert.equal(inserted.length,0,'unregistered source cannot create an executing script');
 const first=placeholders[0],original=first.textContent;
 if(packed){first.textContent='throw new Error("isolated activation failure");';await assert.rejects(run('loader.ensure(sources[0])'),/Could not run/);assert.ok(inserted.at(-1).removed,'a failed inline activation removes its runtime script');assert.equal(errors.size,0);first.textContent=original;}
 const firstLoad=run('loader.ensure(sources[0])');assert.equal(run('loader.ensure(sources[0])'),firstLoad,'concurrent requests share the exact activation promise');await firstLoad;
 await run('loader.ensureMany(sources)');
 assert.equal(run('typeof willowbankPottery'),'function','the actual reviewed model becomes callable after explicit activation');
 assert.equal(run('loader.stats.loaded'),placeholders.length);assert.equal(inserted.filter(script=>!script.removed).length,placeholders.length,'each deferred source activates once');assert.equal(errors.size,0,'activation releases its error listener');
 assert.equal(requested.length,packed?0:placeholders.length,'online activation uses fingerprints; packed activation uses only embedded text');
}
async function checkPortableHall(build){
 const hobby=await readFile(path.join(root,'src/hobby.js'),'utf8'),requests=[],blobs=[],navigations=[];
 let injectTracking=false;
 const sandbox={Blob,URLSearchParams,console,btoa,window:{},HOUSE_ROOMS:{grandhall:{map:{destination:'grandhall.html'}},commons:{}},hobby:{room:'commons'},
  location:{href:'https://fixture.test/index.html?room=commons&private=qa-secret#draft',origin:'https://fixture.test',assign:url=>navigations.push(url)},
  URL:class extends URL{static createObjectURL(blob){blobs.push(blob);return'blob:https://fixture.test/portable-hall-'+blobs.length;}},
  DOMParser:class{parseFromString(html,type){assert.equal(type,'text/html');return new PackingDocument(html);}},
  fetch:async value=>{const url=new URL(value,sandbox.location.href);requests.push(url.href);assert.equal(analyticsAddress(url.href),false,'packing never fetches analytics, including blocked services');assert.equal(url.origin,'https://fixture.test','packing uses this build');try{const data=await readFile(path.join(fixture,'dist',url.pathname));return{ok:true,text:async()=>injectTracking&&url.pathname==='/grandhall.html'?withTracking(data.toString('utf8')):data.toString('utf8'),arrayBuffer:async()=>data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength)};}catch{return{ok:false};}}
 };
 const context=vm.createContext(sandbox),run=code=>vm.runInContext(code,context);
 run(hobby.slice(hobby.indexOf('function removeHouseAnalytics('),hobby.indexOf('\nexportPlayable=async function(')));
 run(hobby.slice(hobby.indexOf('function visitHouseDestination('),hobby.indexOf('\nfunction visitHouseRoom(')));
 run(hobby.slice(hobby.indexOf('function houseInitialParams('),hobby.indexOf('\nfunction scheduleHouseStartup(')));
 const packed=await run('packHouseHall()');
 assert.ok(packed.startsWith('<!DOCTYPE html>'),'portable Hall is a standalone HTML document');
 assert.deepEqual(external(packed),[],'portable Hall needs no external scripts, styles or icon');
 assertNoPortableAnalytics(packed);
 assert.equal(requests.length,1+build.hallRefs.filter(url=>/\.(js|css|svg|png)$/.test(url)&&!analyticsAddress(url)).length,'Hall page and each public renderer source, stylesheet and icon are packed once, without analytics');
 const registry=(await readFile(path.join(root,'src/grandhall-exhibits.js'),'utf8')).replace(/<\/script/gi,'<\\/script');
 assert.ok(packed.includes(registry),'native exhibit definitions and original creator credits survive packing');
 assert.ok(packed.includes('function willowbankPottery('),'the actual native model is present');
 assert.deepEqual(catalogFrom(packed),build.window.HOUSE_COMMUNITY,'the packed Hall retains the same railway placement catalogue and credits');
 const deferred=deferredScripts(packed),originalDeferred=deferredScripts(build.hallHTML);
 assert.equal(deferred.length,originalDeferred.length,'every deferred source stays in an inert script container');
 for(const [index,node]of deferred.entries()){
  assert.equal(node.hasAttribute('src'),false);assert.equal(node.hasAttribute('data-src'),false,'packed source contains no deferred network address');
  assert.equal(node.dataset.source,originalDeferred[index].dataset.source,'packing retains the canonical source identity');
  const expected=(await readFile(path.join(fixture,'dist',originalDeferred[index].getAttribute('data-src')),'utf8')).replace(/<\/script/gi,'<\\/script');
  assert.equal(node.textContent,expected,'all native source bytes are embedded with script-safe escaping');
 }
 await checkDeferredSourceLoading(build.hallHTML,false);await checkDeferredSourceLoading(packed,true);

 // The real packer must remove source, fingerprinted, absolute, marked inline
 // and runtime-injected trackers before attempting any asset requests.
 injectTracking=true;const packedWithTrackers=await run('packHouseHall()');injectTracking=false;
 assertNoPortableAnalytics(packedWithTrackers);assert.equal(packedWithTrackers,packed,'tracker removal preserves every public Hall byte and credit');
 assert.ok(!requests.some(url=>url.includes('qa-secret')),'private query values never reach packing requests');

 // Execute the exact house cleanup and script-packing blocks against a cloned
 // page containing the same runtime trackers. One real app source must survive.
 const houseDocument=new PackingDocument(withTracking('<html><head><script src="'+build.refs.find(url=>url.includes('/people.'))+'"></script><script>window.example="analytics";</script></head><body></body></html>'));
 sandbox.source=houseDocument;
 const cleanupStart=hobby.indexOf('  removeHouseAnalytics(source);',hobby.indexOf('exportPlayable=async function('));
 const housePayloadStart=hobby.indexOf('  const hall=await packHouseHall();',cleanupStart);
 const houseScriptsStart=hobby.indexOf("  for(const node of source.querySelectorAll('script[src]'))",housePayloadStart);
 const houseScriptsEnd=hobby.indexOf("  for(const node of source.querySelectorAll('link[rel=stylesheet]'))",houseScriptsStart);
 assert.ok(cleanupStart>0&&housePayloadStart>cleanupStart&&houseScriptsEnd>houseScriptsStart,'house analytics cleanup precedes all asset packing');
 const beforeHouse=requests.length;
 await run('(async()=>{'+hobby.slice(cleanupStart,housePayloadStart)+hobby.slice(houseScriptsStart,houseScriptsEnd)+'})()');
 assert.equal(requests.length,beforeHouse+1,'the house packs its app source without fetching any tracker');assertNoPortableAnalytics(houseDocument.outerHTML);
 assert.ok(houseDocument.outerHTML.includes('window.example="analytics"'),'ordinary inline scripts are preserved');
 assert.deepEqual(external(houseDocument.outerHTML),[],'the retained house source is embedded');

 // Previously embedded Hall HTML can contain an older marked bootstrap or an
 // SDK left by an earlier export; sanitizing it must remain entirely offline.
 const beforeCached=requests.length;
 for(const address of ['file:///tmp/whistlevale.html?private=qa-secret','blob:https://fixture.test/offline-house']){
  sandbox.location.href=address;sandbox.window.HOUSE_EMBEDDED_HALL=withTracking(packed);
  const repacked=await run('packHouseHall()');assertNoPortableAnalytics(repacked);assert.equal(repacked,packed,'cached Hall cleanup preserves its embedded public content');
 }
 assert.equal(requests.length,beforeCached,'sanitizing a cached Hall never requests tracker or app assets');
 sandbox.location.href='https://fixture.test/index.html?room=commons';

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
 console.log('Portable analytics QA passed: house and Hall source/fingerprinted/absolute/runtime/inline trackers removed before fetch, private-query isolation, and offline cached-Hall cleanup with public scripts and credits preserved.');
}
async function build(){
 execFileSync(process.execPath,['scripts/build.mjs'],{cwd:fixture,stdio:'pipe',env:{...process.env,WHISTLEVALE_AUDIO_ORIGIN:''}});
 const html=await readFile(path.join(fixture,'dist/index.html'),'utf8'),hallHTML=await readFile(path.join(fixture,'dist/grandhall.html'),'utf8'),window={};
 const catalog=html.match(/<script id="audioCatalog">([\s\S]*?)<\/script>/);assert.ok(catalog,'built page has the audio catalog');
 vm.runInNewContext(catalog[1],{window});
 const community=html.match(/<script id="communityCatalog">([\s\S]*?)<\/script>/);assert.ok(community,'built page embeds the reviewed contribution catalogue');
 vm.runInNewContext(community[1],{window});
 assert.deepEqual(JSON.parse(JSON.stringify(window.HOUSE_COMMUNITY)),JSON.parse(await readFile(path.join(fixture,'contributions/world.json'),'utf8')),'contribution data and credits survive the public build');
 assert.deepEqual(catalogFrom(hallHTML),JSON.parse(JSON.stringify(window.HOUSE_COMMUNITY)),'the Hall and house receive the same reviewed catalogue for railway links');
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
  if(page==='grandhall.html'){
   const originalDeferred=deferredScripts(source),builtDeferred=deferredScripts(hallHTML);assert.equal(builtDeferred.length,originalDeferred.length);
   for(const [index,node]of builtDeferred.entries()){
    const canonical=originalDeferred[index].getAttribute('data-source'),fingerprint='immutable/'+canonical.replace(/\.js$/,'.'+digest(await readFile(path.join(fixture,canonical)))+'.js');
    assert.equal(node.getAttribute('data-source'),canonical,'data-source remains the stable reviewed identity');
    assert.equal(node.getAttribute('data-src'),fingerprint,'data-src receives the actual source fingerprint');assert.equal(node.hasAttribute('src'),false,'deferred source is never promoted to an eager script');assert.equal(node.textContent,'');
   }
  }
 }
 assert.ok(!files.some(file=>/^(src\/.*\.(js|css)|assets\/audio\/.*\.mp3|assets\/favicon\.svg)$/.test(file)),'no original app/audio duplicates are emitted');
 for(const file of files.filter(file=>file.startsWith('immutable/'))){
  const match=file.match(/\.([a-f0-9]{16})\.(js|css|mp3|svg|png)$/);assert.ok(match,'only content-fingerprinted files occupy the immutable directory');
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
 const attributeProbe=new PackingDocument('<script type="application/x-whistlevale-exhibit" data-source="src/scenery/model.js" data-src="immutable/model.123.js"></script>').nodes[0];
 assert.equal(attributeProbe.getAttribute('src'),null);assert.equal(attributeProbe.hasAttribute('src'),false);attributeProbe.removeAttribute('src');
 assert.equal(attributeProbe.getAttribute('data-src'),'immutable/model.123.js','src operations cannot match the data-src suffix');
 attributeProbe.removeAttribute('data-src');assert.equal(attributeProbe.hasAttribute('data-src'),false);assert.deepEqual([...attributes(attributeProbe.attributes).keys()],['type','data-source'],'packing removes only the deferred URL attribute');
 await mkdir(path.join(fixture,'scripts'),{recursive:true});
 await cp(path.join(root,'scripts/build.mjs'),path.join(fixture,'scripts/build.mjs'));
 await cp(path.join(root,'scripts/hosted-audio.mjs'),path.join(fixture,'scripts/hosted-audio.mjs'));
 await cp(path.join(root,'scripts/serve.py'),path.join(fixture,'scripts/serve.py'));
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
 // Invoke the real preview handler without opening a socket or browser.
 const preview=JSON.parse(execFileSync('python3',['-c',`import importlib.util, io, json
spec = importlib.util.spec_from_file_location('whistlevale_preview', 'scripts/serve.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
pages = {}
for page in ('index.html', 'grandhall.html'):
    handler = module.Handler.__new__(module.Handler)
    handler.path = '/' + page
    handler.command = 'GET'
    handler.wfile = io.BytesIO()
    handler.send_response = lambda status: None if status == 200 else (_ for _ in ()).throw(AssertionError(status))
    handler.send_header = lambda *args: None
    handler.end_headers = lambda: None
    module.Handler.do_GET(handler)
    pages[page] = handler.wfile.getvalue().decode('utf-8')
print(json.dumps(pages))`],{cwd:fixture,encoding:'utf8'}));
 for(const page of ['index.html','grandhall.html'])assert.deepEqual(catalogFrom(preview[page]),empty.window.HOUSE_COMMUNITY,'preview injects the same public contribution catalogue into '+page);

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
 const modelSource=deferredScripts(hallChanged.hallHTML)[0].dataset.source,modelPath=path.join(fixture,modelSource);
 await writeFile(modelPath,(await readFile(modelPath,'utf8'))+'\n// isolated deferred native source fingerprint check\n');
 const modelChanged=await build();
 for(const key of ['refs','hallRefs']){
  const changed=modelChanged[key].filter(url=>!hallChanged[key].includes(url));assert.equal(changed.length,1,'one native source change updates only its eager/deferred source URL per page');
  assert.ok(changed[0].includes('/scenery/'),'both pages resolve the same new native model bytes');
 }
 await checkPortableHall(modelChanged);
 console.log('Portable Hall QA passed: every deferred source embedded inertly, explicit online/offline activation, source identity and credits, offline repacking and file/blob entry, return context, script-safe embedding and incomplete-export rejection.');

 const config=JSON.parse(await readFile(path.join(root,'vercel.json'),'utf8'));
 const cacheRules=config.headers.filter(rule=>rule.headers.some(header=>header.key.toLowerCase()==='cache-control'));
 const value=rule=>rule.headers.find(header=>header.key.toLowerCase()==='cache-control').value;
 for(const route of ['/','/index.html','/grandhall.html'])assert.match(value(cacheRules.find(rule=>rule.source===route)),/max-age=0, must-revalidate/,'HTML always revalidates');
 const immutable=cacheRules.filter(rule=>value(rule).includes('immutable'));assert.equal(immutable.length,1);assert.equal(immutable[0].source,'/immutable/(.*)');assert.match(value(immutable[0]),/max-age=31536000/);
 for(const rule of cacheRules.filter(rule=>rule.source!=='/immutable/(.*)'))assert.ok(!value(rule).includes('immutable'),'original same-name URLs never get immutable caching');
 console.log(`Delivery QA passed: source-only and ${recordings.length||2}-recording builds, main/Hall public references, byte identity, deterministic fingerprints, isolated CSS/audio/shared-Hall invalidation, complete manifests, no unversioned duplicates, and fresh HTML cache policy.`);
}finally{await rm(fixture,{recursive:true,force:true});}
