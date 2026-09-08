import {readdir,readFile,stat} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const files=await readdir(path.join(root,'src'),{recursive:true});
for(const file of files.filter(f=>f.endsWith('.js')))execFileSync(process.execPath,['--check',path.join(root,'src',file)],{stdio:'inherit'});
const html=await readFile(path.join(root,'index.html'),'utf8');
for(const [,url]of html.matchAll(/(?:src|href)="((?:src|assets)\/[^"#]+)"/g))await stat(path.join(root,url));
const playlist=await readFile(path.join(root,'src/playlist.js'),'utf8');
const tracks=[...playlist.matchAll(/\{id:'([^']+)'/g)].map(m=>m[1]);
const audioIds=new Set(['the-long-way-home','lamplight-nocturne','town','coast','forest','workshop','steam','whistle',...tracks]);
let audioCount=0;
for(const id of audioIds){
 let file;try{file=await stat(path.join(root,'assets/audio',id+'.mp3'));}catch(error){if(error.code==='ENOENT'&&!process.argv.includes('--require-audio'))continue;throw error;}
 if(file.size<1000)throw new Error(`Audio asset ${id} is incomplete`);audioCount++;
}
console.log(`Source syntax and referenced assets verified. ${audioCount}/${audioIds.size} optional recordings present.`);
