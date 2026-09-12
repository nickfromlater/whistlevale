// Optional build-time hydration of exact, previously published recordings.
// The application never downloads or generates source assets at runtime.
import {lstat,readFile,mkdir,mkdtemp,writeFile,link,unlink,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';

export const HOSTED_AUDIO_LIMITS=Object.freeze({recordings:128,fileBytes:16*1024*1024,totalBytes:128*1024*1024,manifestBytes:64*1024,concurrency:3,timeoutMs:30000});
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const fail=message=>new Error('Hosted audio: '+message);
const keysAre=(value,keys)=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).sort().join(',')===keys.slice().sort().join(',');

function publicOrigin(origin){
 let url;
 try{url=new URL(origin);}catch{throw fail('origin must be a public HTTPS origin.');}
 const hostname=url.hostname,labels=hostname.split('.');
 if(typeof origin!=='string'||(origin!==url.origin&&origin!==url.origin+'/')||!/^https:\/\/[^/?#]+\/?$/.test(origin)||url.protocol!=='https:'||url.username||url.password||url.port||url.search||url.hash||url.pathname!=='/'||hostname.length>253||labels.length<2||labels.some(label=>!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))||!/^[a-z]{2,63}$/.test(labels.at(-1))||/\.(?:localhost|local|internal|test|invalid|example|home|lan)$/.test(hostname))throw fail('origin must be a public HTTPS DNS origin without credentials, port, path, query or fragment.');
 return url.origin;
}

async function readManifest(root){
 const file=path.join(root,'scripts/hosted-audio.json'),info=await lstat(file);
 if(!info.isFile()||info.size>HOSTED_AUDIO_LIMITS.manifestBytes)throw fail('manifest must be a bounded regular JSON file.');
 let manifest;
 try{manifest=JSON.parse(await readFile(file,'utf8'));}catch(error){throw fail('manifest is not valid JSON: '+error.message);}
 if(!keysAre(manifest,['version','recordings'])||manifest.version!==1||!Array.isArray(manifest.recordings)||!manifest.recordings.length||manifest.recordings.length>HOSTED_AUDIO_LIMITS.recordings)throw fail('invalid manifest version or empty/oversized recording list.');
 const ids=new Set();let bytes=0;
 for(const record of manifest.recordings){
  if(!keysAre(record,record?.origin===undefined?['id','bytes','sha256']:['id','bytes','sha256','origin'])||typeof record.id!=='string'||record.id.length>100||!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(record.id)||ids.has(record.id)||!Number.isSafeInteger(record.bytes)||record.bytes<=0||record.bytes>HOSTED_AUDIO_LIMITS.fileBytes||typeof record.sha256!=='string'||!/^[a-f0-9]{64}$/.test(record.sha256))throw fail('invalid, duplicate or oversized recording in manifest.');
  // A newly published master can be preserved from a reviewed preview until
  // production carries it. It has the same exact-path, hash and byte checks.
  if(record.origin!==undefined)publicOrigin(record.origin);
  ids.add(record.id);bytes+=record.bytes;
  if(bytes>HOSTED_AUDIO_LIMITS.totalBytes)throw fail('manifest exceeds the total recording byte limit.');
 }
 return{recordings:manifest.recordings,bytes};
}

async function existingFile(file){
 try{return await lstat(file);}catch(error){if(error.code==='ENOENT')return null;throw error;}
}

async function recordingBytes(record,origin,fetchImpl,timeoutMs,batchSignal){
 const address=(record.origin?publicOrigin(record.origin):origin)+'/immutable/assets/audio/'+record.id+'.'+record.sha256.slice(0,16)+'.mp3';
 const timeout=new AbortController(),signal=AbortSignal.any([batchSignal,timeout.signal]);
 const timer=setTimeout(()=>timeout.abort(fail(record.id+' download timed out.')),timeoutMs);
 let onAbort,reader,response;
 const aborted=new Promise((_,reject)=>{onAbort=()=>reject(signal.reason);signal.addEventListener('abort',onAbort,{once:true});if(signal.aborted)onAbort();});
 const wait=promise=>Promise.race([promise,aborted]);
 try{
  response=await wait(fetchImpl(address,{redirect:'error',signal,headers:{Accept:'audio/mpeg'}}));
  if(response.status!==200||response.redirected||(response.url&&response.url!==address))throw fail(record.id+' did not return its exact immutable URL with HTTP 200.');
  const length=response.headers.get('content-length');
  if(length!==null&&(!/^\d+$/.test(length)||Number(length)!==record.bytes))throw fail(record.id+' response size differs from its manifest.');
  if(!response.body||typeof response.body.getReader!=='function')throw fail(record.id+' has no readable response body.');
  reader=response.body.getReader();
  const data=Buffer.allocUnsafe(record.bytes),hash=createHash('sha256');let bytes=0;
  while(true){
   const {done,value}=await wait(reader.read());if(done)break;
   if(!(value instanceof Uint8Array))throw fail(record.id+' returned invalid response bytes.');
   if(value.byteLength>record.bytes-bytes)throw fail(record.id+' response exceeds its manifest byte limit.');
   data.set(value,bytes);bytes+=value.byteLength;hash.update(value);
  }
  if(bytes!==record.bytes)throw fail(record.id+' response size differs from its manifest.');
  if(hash.digest('hex')!==record.sha256)throw fail(record.id+' SHA-256 differs from its manifest.');
  return data;
 }finally{
  clearTimeout(timer);signal.removeEventListener('abort',onAbort);timeout.abort();
  if(reader){void reader.cancel().catch(()=>{});reader.releaseLock();}
  else if(response?.body)void response.body.cancel().catch(()=>{});
 }
}

export async function ensureHostedAudio({root,origin,fetchImpl=globalThis.fetch,timeoutMs=HOSTED_AUDIO_LIMITS.timeoutMs}={}){
 // Offline/source builds do not read a manifest, touch disk or contact a host.
 if(origin===undefined||origin===null||origin==='')return{enabled:false,recordings:0,reused:0,downloaded:0,bytes:0};
 const source=publicOrigin(origin);
 if(typeof root!=='string'||!root)throw fail('a project root is required.');
 if(typeof fetchImpl!=='function'||!Number.isSafeInteger(timeoutMs)||timeoutMs<=0||timeoutMs>HOSTED_AUDIO_LIMITS.timeoutMs)throw fail('invalid fetch implementation or bounded timeout.');
 const manifest=await readManifest(root),assets=path.join(root,'assets'),directory=path.join(assets,'audio');
 for(const dir of [assets,directory]){const info=await existingFile(dir);if(info&&!info.isDirectory())throw fail('audio directories must be real directories, not links.');}
 const missing=[];
 for(const record of manifest.recordings){
  const file=path.join(directory,record.id+'.mp3'),info=await existingFile(file);
  if(!info){missing.push(record);continue;}
  if(!info.isFile()||info.size!==record.bytes||digest(await readFile(file))!==record.sha256)throw fail(record.id+' local recording differs from its manifest; keep the local file and review the recording metadata.');
 }
 const result={enabled:true,recordings:manifest.recordings.length,reused:manifest.recordings.length-missing.length,downloaded:missing.length,bytes:manifest.bytes};
 if(!missing.length)return result;
 for(const dir of [assets,directory]){
  try{await mkdir(dir);}catch(error){if(error.code!=='EEXIST')throw error;}
  if(!(await lstat(dir)).isDirectory())throw fail('audio directories must be real directories, not links.');
 }
 const staging=await mkdtemp(path.join(directory,'.hosted-audio-')),published=[],batch=new AbortController();
 let next=0,failure;
 try{
  await Promise.all(Array.from({length:Math.min(HOSTED_AUDIO_LIMITS.concurrency,missing.length)},async()=>{
   while(!batch.signal.aborted){
    const record=missing[next++];if(!record)return;
    try{
     const bytes=await recordingBytes(record,source,fetchImpl,timeoutMs,batch.signal);
     if(batch.signal.aborted)return;
     await writeFile(path.join(staging,record.id+'.mp3'),bytes,{flag:'wx',mode:0o600});
    }catch(error){if(!failure){failure=error;batch.abort(error);}return;}
   }
  }));
  if(failure)throw failure;
  // Publish only after every download has passed its full size and hash check.
  // Hard links create whole files atomically and refuse to replace local work.
  for(const record of missing){
   const file=path.join(directory,record.id+'.mp3');
   try{await link(path.join(staging,record.id+'.mp3'),file);}catch(error){throw fail(record.id+' could not be published without replacing a local recording: '+error.message);}
   published.push(file);
  }
  return result;
 }catch(error){
  const cleanup=await Promise.allSettled(published.map(file=>unlink(file))),errors=cleanup.filter(r=>r.status==='rejected').map(r=>r.reason);
  if(errors.length)throw new AggregateError([error,...errors],'Hosted audio failed and could not completely roll back its new files.');
  throw error;
 }finally{await rm(staging,{recursive:true,force:true});}
}
