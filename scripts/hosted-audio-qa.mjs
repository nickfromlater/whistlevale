#!/usr/bin/env node
// Build-only asset hydration, with temporary fixtures and no network requests.
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,readdir,rm,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {ensureHostedAudio,HOSTED_AUDIO_LIMITS as limits} from './hosted-audio.mjs';

const origin='https://example.com',hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const audio=id=>Buffer.from('Unpublished audio fixture: '+id);
const record=id=>({id,bytes:audio(id).length,sha256:hash(audio(id))});
const manifest=records=>({version:1,recordings:records});
const address=item=>origin+'/immutable/assets/audio/'+item.id+'.'+item.sha256.slice(0,16)+'.mp3';
const response=bytes=>new Response(bytes,{headers:{'content-length':String(bytes.length)}});
const noFetch=()=>{throw new Error('Unexpected network request');};
const audioPath=(root,id)=>path.join(root,'assets/audio',id+'.mp3');
async function files(root){return(await readdir(path.join(root,'assets/audio')).catch(error=>{if(error.code==='ENOENT')return[];throw error;})).sort();}
async function fixture(records,test){
 const root=await mkdtemp(path.join(tmpdir(),'whistlevale-hosted-audio-qa-'));
 try{await mkdir(path.join(root,'scripts'));await writeFile(path.join(root,'scripts/hosted-audio.json'),JSON.stringify(manifest(records)));await test(root);}
 finally{await rm(root,{recursive:true,force:true});}
}
async function eventually(condition){
 for(let i=0;i<1000;i++){if(await condition())return;await new Promise(resolve=>setTimeout(resolve,1));}
 assert.fail('Fixture did not reach its expected asynchronous state.');
}

for(const absent of [undefined,null,''])assert.deepEqual(await ensureHostedAudio({origin:absent,root:'/nonexistent/hosted-audio-fixture',fetchImpl:noFetch}),{enabled:false,recordings:0,reused:0,downloaded:0,bytes:0});
await fixture([],async root=>{
 await writeFile(path.join(root,'scripts/hosted-audio.json'),'not JSON');
 assert.equal((await ensureHostedAudio({root,fetchImpl:noFetch})).enabled,false,'offline builds do not even parse metadata');
});

await fixture(['reused','first','second'].map(record),async root=>{
 await mkdir(path.join(root,'assets/audio'),{recursive:true});await writeFile(audioPath(root,'reused'),audio('reused'));await writeFile(audioPath(root,'unlisted'),'Local replacement');
 const requested=[];
 const result=await ensureHostedAudio({root,origin:origin+'/',fetchImpl:async(url,options)=>{
  requested.push(url);assert.equal(options.redirect,'error');assert.ok(options.signal instanceof AbortSignal);
  const item=['first','second'].map(record).find(item=>address(item)===url);assert.ok(item,'only exact manifest allowlisted immutable URLs are requested');return response(audio(item.id));
 }});
 assert.deepEqual(result,{enabled:true,recordings:3,reused:1,downloaded:2,bytes:['reused','first','second'].reduce((sum,id)=>sum+audio(id).length,0)});
 assert.equal(requested.length,2);
 for(const id of ['reused','first','second'])assert.deepEqual(await readFile(audioPath(root,id)),audio(id));
 assert.equal(await readFile(audioPath(root,'unlisted'),'utf8'),'Local replacement');
 assert.deepEqual(await files(root),['first.mp3','reused.mp3','second.mp3','unlisted.mp3'],'successful hydration removes every staging directory');
 assert.equal((await ensureHostedAudio({root,origin,fetchImpl:noFetch})).reused,3,'a second build reuses every exact local recording');
});

for(const replacement of [Buffer.from('Different length'),Buffer.alloc(audio('changed').length,1)])await fixture(['missing','changed'].map(record),async root=>{
 await mkdir(path.join(root,'assets/audio'),{recursive:true});await writeFile(audioPath(root,'changed'),replacement);
 await assert.rejects(()=>ensureHostedAudio({root,origin,fetchImpl:noFetch}),/local recording differs/);
 assert.deepEqual(await readFile(audioPath(root,'changed')),replacement);assert.deepEqual(await files(root),['changed.mp3']);
});

const original=record('track');
await fixture([{...record('new-score'),origin:'https://preview.example.com'}],async root=>{
 const item=record('new-score');
 const result=await ensureHostedAudio({root,origin,fetchImpl:async(url,options)=>{
  assert.equal(url,address(item).replace(origin,'https://preview.example.com'));assert.equal(options.redirect,'error');return response(audio(item.id));
 }});
 assert.equal(result.downloaded,1);assert.deepEqual(await readFile(audioPath(root,item.id)),audio(item.id));
});
for(const bad of ['http://example.com','https://localhost','https://127.0.0.1','https://user:secret@example.com','https://example.com/path',null,17])await fixture([{...record('new-score'),origin:bad}],async root=>{
 await assert.rejects(()=>ensureHostedAudio({root,origin,fetchImpl:noFetch}),/origin/);assert.deepEqual(await files(root),[]);
});
await fixture([{...record('new-score'),origin:'https://preview.example.com'}],async root=>{
 await assert.rejects(()=>ensureHostedAudio({root,origin,fetchImpl:async()=>response(Buffer.alloc(audio('new-score').length))}),/SHA-256/);
 assert.deepEqual(await files(root),[],'preview sources must pass the same content validation');
});
const malformed=[
 manifest([]),manifest([null]),{version:2,recordings:[]},{version:1,recordings:{}},{...manifest([]),extra:true},manifest([original,original]),
 ...['../outside','a/b','a%2fb','.hidden','Uppercase'].map(id=>manifest([{...original,id}])),
 ...[0,-1,1.5,limits.fileBytes+1].map(bytes=>manifest([{...original,bytes}])),
 ...['0'.repeat(63),'Z'.repeat(64)].map(sha256=>manifest([{...original,sha256}])),
 manifest([{...original,url:'https://other.example.com/audio.mp3'}]),
 manifest(Array.from({length:limits.recordings+1},(_,i)=>({...original,id:'track-'+i}))),
 manifest(Array.from({length:9},(_,i)=>({...original,id:'track-'+i,bytes:limits.fileBytes})))
];
for(const bad of malformed)await fixture([],async root=>{
 await writeFile(path.join(root,'scripts/hosted-audio.json'),JSON.stringify(bad));
 await assert.rejects(()=>ensureHostedAudio({root,origin,fetchImpl:noFetch}),/manifest|recording list/);assert.deepEqual(await files(root),[]);
});
for(const content of ['{bad JSON',' '.repeat(limits.manifestBytes+1)])await fixture([],async root=>{
 await writeFile(path.join(root,'scripts/hosted-audio.json'),content);
 await assert.rejects(()=>ensureHostedAudio({root,origin,fetchImpl:noFetch}),/manifest/);
});
for(const bad of ['http://example.com','https://localhost','https://one.localhost','https://127.0.0.1','https://10.0.0.1','https://[::1]','https://example.com:8443','https://maker:secret@example.com','https://@example.com','https://example.com/path','https://example.com?','https://example.com#','https://exa\nmple.com','https://example.com/../','https://example.com.evil.local'])await assert.rejects(()=>ensureHostedAudio({root:'/nonexistent/hosted-audio-fixture',origin:bad,fetchImpl:noFetch}),/origin/);

for(const returned of [()=>new Response(null,{status:302,headers:{location:'https://elsewhere.example.com'}}),()=>Object.defineProperty(response(audio('track')),'redirected',{value:true}),()=>Object.defineProperty(response(audio('track')),'url',{value:'https://elsewhere.example.com'})])await fixture([original],async root=>{
 await assert.rejects(()=>ensureHostedAudio({root,origin,fetchImpl:async(url,options)=>{assert.equal(options.redirect,'error');return returned();}}),/exact immutable URL/);
 assert.deepEqual(await files(root),[]);
});

for(const returned of [
 ()=>response(Buffer.alloc(original.bytes,0)),
 ()=>response(Buffer.alloc(original.bytes+1)),
 ()=>new Response(Buffer.alloc(original.bytes-1)),
 ()=>new Response(new ReadableStream({start(controller){controller.enqueue(audio('track'));controller.enqueue(new Uint8Array([1]));controller.close();}}))
])await fixture([original],async root=>{
 await assert.rejects(()=>ensureHostedAudio({root,origin,fetchImpl:async()=>returned()}),/SHA-256|response size|byte limit/);
 assert.deepEqual(await files(root),[],'failed responses leave no recordings or temporary files');
});

for(const phase of ['headers','body'])await fixture([original],async root=>{
 let signal,canceled=false;
 await assert.rejects(()=>ensureHostedAudio({root,origin,timeoutMs:20,fetchImpl:async(url,options)=>{
  signal=options.signal;
  return phase==='headers'?new Promise(()=>{}):new Response(new ReadableStream({pull(){return new Promise(()=>{});},cancel(){canceled=true;}}));
 }}),/timed out/);
 assert.equal(signal.aborted,true,'the deadline aborts even a fetch implementation that does not cooperate');
 if(phase==='body')assert.equal(canceled,true,'a stalled response body is canceled');
 assert.deepEqual(await files(root),[]);
});

await fixture(['kept','good','bad','stalled','waiting','never-started'].map(record),async root=>{
 await mkdir(path.join(root,'assets/audio'),{recursive:true});await writeFile(audioPath(root,'kept'),audio('kept'));
 let releaseBad;const requested=[],signals=[];
 const pending=ensureHostedAudio({root,origin,fetchImpl:async(url,options)=>{
  const item=['good','bad','stalled','waiting','never-started'].map(record).find(item=>address(item)===url);requested.push(item.id);signals.push(options.signal);
  if(item.id==='good')return response(audio(item.id));
  if(item.id==='bad')return new Promise(resolve=>{releaseBad=()=>resolve(response(Buffer.alloc(item.bytes,0)));});
  return new Promise(()=>{});
 }});
 const rejected=assert.rejects(pending,/SHA-256/);
 await eventually(async()=>{
  const staging=(await files(root)).find(name=>name.startsWith('.hosted-audio-'));
  return staging&&(await readdir(path.join(root,'assets/audio',staging))).includes('good.mp3');
 });
 releaseBad();await rejected;
 assert.ok(signals.every(signal=>signal.aborted),'one failed download aborts the other active requests');
 assert.ok(!requested.includes('never-started'),'failure stops queued downloads');
 assert.deepEqual(await files(root),['kept.mp3'],'verified staged files and interrupted downloads are removed together');
 assert.deepEqual(await readFile(audioPath(root,'kept')),audio('kept'));
});

await fixture(Array.from({length:11},(_,i)=>record('bounded-'+i)),async root=>{
 const waiting=[],requests=[];let active=0,peak=0;
 const pending=ensureHostedAudio({root,origin,fetchImpl:async(url)=>{
  const item=Array.from({length:11},(_,i)=>record('bounded-'+i)).find(item=>address(item)===url);assert.ok(item);requests.push(item.id);active++;peak=Math.max(peak,active);
  return new Response(new ReadableStream({start(controller){waiting.push(()=>{controller.enqueue(audio(item.id));controller.close();active--;});}}));
 }});
 await eventually(()=>waiting.length===3);assert.equal(requests.length,3,'a pending response body occupies a download slot');
 for(let i=0;i<11;i++){await eventually(()=>waiting.length>0);waiting.shift()();}
 const result=await pending;assert.equal(peak,3);assert.equal(active,0);assert.equal(result.downloaded,11);
 for(const id of requests)assert.deepEqual(await readFile(audioPath(root,id)),audio(id));
 assert.equal((await files(root)).length,11);
});

await fixture(['first','conflict'].map(record),async root=>{
 await assert.rejects(()=>ensureHostedAudio({root,origin,fetchImpl:async url=>{
  const id=url===address(record('first'))?'first':'conflict';
  if(id==='conflict')await writeFile(audioPath(root,id),'A recording created during the download');
  return response(audio(id));
 }}),/without replacing a local recording/);
 assert.deepEqual(await files(root),['conflict.mp3'],'a publication conflict rolls back earlier newly published files');
 assert.equal(await readFile(audioPath(root,'conflict'),'utf8'),'A recording created during the download');
});

await fixture([original],async root=>{
 await mkdir(path.join(root,'assets/audio'),{recursive:true});const outside=path.join(root,'outside.mp3');await writeFile(outside,audio('track'));await symlink(outside,audioPath(root,'track'));
 await assert.rejects(()=>ensureHostedAudio({root,origin,fetchImpl:noFetch}),/local recording differs/);assert.deepEqual(await readFile(outside),audio('track'));
});

console.log('Hosted audio QA passed: offline builds, exact immutable sources, local reuse and preservation, manifest/origin limits, hash and size verification, redirects, deadlines, three-download concurrency, staged cleanup and publication rollback. No external requests.');
