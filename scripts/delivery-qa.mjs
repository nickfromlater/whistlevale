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
// Vercel serves this first-party endpoint itself; it is not a built app asset.
const external=html=>[...html.matchAll(/\b(?:src|href)=["']([^"']+)["']/g)].map(match=>match[1]).filter(url=>!url.startsWith('#')&&!/^https?:/.test(url)&&url!=='/_vercel/insights/script.js');
async function build(){
 execFileSync(process.execPath,['scripts/build.mjs'],{cwd:fixture,stdio:'pipe'});
 const html=await readFile(path.join(fixture,'dist/index.html'),'utf8'),window={};
 const catalog=html.match(/<script id="audioCatalog">([\s\S]*?)<\/script>/);assert.ok(catalog,'built page has the audio catalog');
 vm.runInNewContext(catalog[1],{window});
 const files=(await walk(path.join(fixture,'dist'))).map(file=>path.relative(path.join(fixture,'dist'),file).split(path.sep).join('/')).sort();
 const refs=external(html);
 for(const url of refs)await readFile(path.join(fixture,'dist',url));
 assert.ok(refs.every(url=>url.startsWith('immutable/')),'all local HTML app references are versioned');
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
 return {html,files,refs,window:JSON.parse(JSON.stringify(window))};
}
try{
 await mkdir(path.join(fixture,'scripts'),{recursive:true});
 await cp(path.join(root,'scripts/build.mjs'),path.join(fixture,'scripts/build.mjs'));
 const originalHTML=await readFile(path.join(root,'index.html'),'utf8');await writeFile(path.join(fixture,'index.html'),originalHTML);
 await cp(path.join(root,'src'),path.join(fixture,'src'),{recursive:true,filter:file=>!path.basename(file).startsWith('.')});
 await cp(path.join(root,'assets'),path.join(fixture,'assets'),{recursive:true,filter:file=>!path.basename(file).startsWith('.')&&!file.endsWith('.mp3')});
 await mkdir(path.join(fixture,'assets/.private'),{recursive:true});await writeFile(path.join(fixture,'assets/.private/secret.js'),'not public');
 await mkdir(path.join(fixture,'assets/audio'),{recursive:true});
 const empty=await build();assert.equal(empty.window.HOUSE_AUDIO_AVAILABLE.length,0,'a source-only clone needs no recordings');
 assert.equal(await readFile(path.join(fixture,'index.html'),'utf8'),originalHTML,'the source page is unchanged');

 // Use local recordings if present. A clean CI clone uses opaque byte fixtures
 // for packaging checks; these are never decoded, published or treated as audio.
 const available=await readdir(path.join(root,'assets/audio')).catch(error=>{if(error.code==='ENOENT')return[];throw error;});
 const recordings=available.filter(file=>file.endsWith('.mp3')&&!file.startsWith('.'));
 if(recordings.length)for(const file of recordings)await cp(path.join(root,'assets/audio',file),path.join(fixture,'assets/audio',file));
 else for(const id of ['town','arrival'])await writeFile(path.join(fixture,'assets/audio',id+'.mp3'),Buffer.from('delivery byte fixture: '+id));
 const populated=await build();assert.equal(populated.window.HOUSE_AUDIO_AVAILABLE.length,recordings.length||2);
 const stable=await build();assert.equal(stable.html,populated.html,'unchanged content keeps identical URLs and HTML');assert.deepEqual(stable.files,populated.files);

 const cssFile=path.join(fixture,'src/hobby.css');await writeFile(cssFile,(await readFile(cssFile,'utf8'))+'\n/* isolated fingerprint check */\n');
 const cssChanged=await build();assert.equal(cssChanged.refs.filter(url=>!populated.refs.includes(url)).length,1,'one changed stylesheet changes only its fingerprint');
 assert.equal(cssChanged.refs.filter(url=>!populated.refs.includes(url))[0].includes('hobby.'),true);
 assert.deepEqual(cssChanged.window.HOUSE_AUDIO_URLS,populated.window.HOUSE_AUDIO_URLS,'unrelated recordings retain cacheable URLs');
 assert.notEqual(cssChanged.html,populated.html,'fresh HTML points at the new stylesheet');

 const changedId=populated.window.HOUSE_AUDIO_AVAILABLE[0],recording=path.join(fixture,'assets/audio',changedId+'.mp3');
 await writeFile(recording,Buffer.concat([await readFile(recording),Buffer.from([1])]));
 const audioChanged=await build();
 assert.notEqual(audioChanged.window.HOUSE_AUDIO_URLS[changedId],cssChanged.window.HOUSE_AUDIO_URLS[changedId],'a replaced recording receives a new URL');
 for(const id of populated.window.HOUSE_AUDIO_AVAILABLE)if(id!==changedId)assert.equal(audioChanged.window.HOUSE_AUDIO_URLS[id],cssChanged.window.HOUSE_AUDIO_URLS[id],'other recording fingerprints stay stable');
 assert.deepEqual(audioChanged.refs,cssChanged.refs,'an audio replacement does not invalidate unchanged application files');
 assert.ok(!audioChanged.files.includes(cssChanged.window.HOUSE_AUDIO_URLS[changedId]),'no obsolete recording duplicate remains');

 const config=JSON.parse(await readFile(path.join(root,'vercel.json'),'utf8'));
 const cacheRules=config.headers.filter(rule=>rule.headers.some(header=>header.key.toLowerCase()==='cache-control'));
 const value=rule=>rule.headers.find(header=>header.key.toLowerCase()==='cache-control').value;
 for(const route of ['/','/index.html'])assert.match(value(cacheRules.find(rule=>rule.source===route)),/max-age=0, must-revalidate/,'HTML always revalidates');
 const immutable=cacheRules.filter(rule=>value(rule).includes('immutable'));assert.equal(immutable.length,1);assert.equal(immutable[0].source,'/immutable/(.*)');assert.match(value(immutable[0]),/max-age=31536000/);
 for(const rule of cacheRules.filter(rule=>rule.source!=='/immutable/(.*)'))assert.ok(!value(rule).includes('immutable'),'original same-name URLs never get immutable caching');
 console.log(`Delivery QA passed: source-only and ${recordings.length||2}-recording builds, byte identity, deterministic fingerprints, isolated CSS/audio invalidation, complete manifests, no unversioned duplicates, and fresh HTML cache policy.`);
}finally{await rm(fixture,{recursive:true,force:true});}
