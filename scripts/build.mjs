import {mkdir,rm,readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {loadCommunity,scriptJSON} from './community-lib.mjs';
import {ensureHostedAudio} from './hosted-audio.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'dist');
const hostedAudio=await ensureHostedAudio({root,origin:process.env.WHISTLEVALE_AUDIO_ORIGIN});
if(hostedAudio.enabled)console.log(`Whistlevale: verified ${hostedAudio.recordings} hosted recordings (${hostedAudio.downloaded} downloaded, ${hostedAudio.reused} reused).`);
await rm(out,{recursive:true,force:true});
await mkdir(out,{recursive:true});
const manifest=new Map(),audioURLs={};
async function copyPublic(directory){
 const entries=await readdir(path.join(root,directory),{withFileTypes:true}).catch(error=>{if(error.code==='ENOENT')return[];throw error;});
 for(const entry of entries.sort((a,b)=>a.name.localeCompare(b.name))){
  if(entry.name.startsWith('.'))continue;
  const relative=path.posix.join(directory,entry.name);
  if(entry.isDirectory()){await copyPublic(relative);continue;}
  if(!entry.isFile()||(relative.startsWith('assets/')&&relative.endsWith('.json')))continue;
  const data=await readFile(path.join(root,relative));
  const vendored=relative.startsWith('vendor/');
  const versioned=!vendored&&(/\.(js|css|mp3)$/.test(relative)||/^assets\/(favicon\.svg|favicon-\d+\.png|apple-touch-icon\.png)$/.test(relative));
  let target=relative;
  if(versioned){
   const extension=path.posix.extname(relative),hash=createHash('sha256').update(data).digest('hex').slice(0,16);
   target='immutable/'+relative.slice(0,-extension.length)+'.'+hash+extension;
  }
  manifest.set(relative,target);
  await mkdir(path.dirname(path.join(out,target)),{recursive:true});
  // Fingerprint the original bytes; no transcoding or sample changes.
  await writeFile(path.join(out,target),data);
  if(path.posix.dirname(relative)==='assets/audio'&&relative.endsWith('.mp3'))audioURLs[entry.name.slice(0,-4)]=target;
 }
}
await copyPublic('src');await copyPublic('assets');await copyPublic('vendor');
const audioIds=Object.keys(audioURLs).sort(),json=value=>JSON.stringify(value).replace(/</g,'\\u003c');
const catalog=`<script id="audioCatalog">window.HOUSE_AUDIO_AVAILABLE=${json(audioIds)};window.HOUSE_AUDIO_URLS=${json(audioURLs)};</script>`;
const community=await loadCommunity();
const sourceHTML=await readFile(path.join(root,'index.html'),'utf8'),communitySlot=/<script id="communityCatalog">[\s\S]*?<\/script>/;
if(!communitySlot.test(sourceHTML))throw new Error('The reviewed community catalogue placeholder is missing.');
const html=sourceHTML.replace(communitySlot,()=>'<script id="communityCatalog">window.HOUSE_COMMUNITY='+scriptJSON(community)+';</script>');
if(!/<script id="audioCatalog">[\s\S]*?<\/script>/.test(html))throw new Error('The optional audio catalog placeholder is missing.');
const builtHTML=html.replace(/<script id="audioCatalog">[\s\S]*?<\/script>/,()=>catalog).replace(/\b(src|href)=(["'])([^"']+)\2/g,(attribute,name,quote,url)=>{
 const suffixAt=url.search(/[?#]/),file=suffixAt<0?url:url.slice(0,suffixAt),suffix=suffixAt<0?'':url.slice(suffixAt);
 return manifest.has(file)?`${name}=${quote}${manifest.get(file)}${suffix}${quote}`:attribute;
});
await writeFile(path.join(out,'index.html'),builtHTML);
const hall=(await readFile(path.join(root,'grandhall.html'),'utf8')).replace(communitySlot,()=>'<script id="communityCatalog">window.HOUSE_COMMUNITY='+scriptJSON(community)+';</script>');
await writeFile(path.join(out,'grandhall.html'),hall.replace(/\b(src|href)=(["'])([^"']+)\2/g,(attribute,name,quote,url)=>manifest.has(url)?`${name}=${quote}${manifest.get(url)}${quote}`:attribute));
const walk=async dir=>(await Promise.all((await readdir(dir,{withFileTypes:true})).map(async p=>p.isDirectory()?walk(path.join(dir,p.name)):path.join(dir,p.name)))).flat();
const files=await walk(out);
if(files.some(f=>path.basename(f).startsWith('.')))throw new Error('A private file reached the public build.');
console.log(`Whistlevale: ${files.length} public files built in dist/, with ${audioIds.length} optional recordings. App assets are content-versioned; original bytes preserved.`);
