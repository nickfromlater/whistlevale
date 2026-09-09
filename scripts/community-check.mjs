#!/usr/bin/env node
import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {communityContext,loadCommunity,loadContributionDefinitions,read,root} from './community-lib.mjs';

const json=process.argv.includes('--json');
try{
 const catalogue=await loadCommunity(),{context,run}=await communityContext();context.HOUSE_COMMUNITY=catalogue;
 await loadContributionDefinitions({context,run},catalogue);
 // Use the real railway factory and editor clearance check, without a GPU.
 run('initTracks();seedDivisionScenery();');
 const report=run(`(()=>{
  const credited=objects.filter(o=>o.credits?.length),solid=o=>!['hill','pine','fir','oak','autumn','willow','orchard','rock','flowers','fence','sheep','lamp','bench','picnic'].includes(o.type);
  const corners=o=>{const a=assetById[o.type],w=(o.params?.w||a.w)*o.scale*.5,d=(o.params?.d||a.d)*o.scale*.5,c=Math.cos(o.angle),s=Math.sin(o.angle);return[[-w,-d],[w,-d],[w,d],[-w,d]].map(([x,z])=>[o.x+c*x+s*z,o.z-s*x+c*z]);};
  const overlap=(a,b)=>{const aa=corners(a),bb=corners(b);for(const points of[aa,bb])for(let i=0;i<4;i++){const p=points[i],q=points[(i+1)%4],axis=[p[1]-q[1],q[0]-p[0]],project=v=>v[0]*axis[0]+v[1]*axis[1],u=aa.map(project),v=bb.map(project);if(Math.max(...u)<=Math.min(...v)||Math.max(...v)<=Math.min(...u))return false;}return true;};
  for(const o of credited){const check=placementCheck(o);if(!check.ok)throw new Error('Community '+o.type+' at '+o.x+','+o.z+': '+check.reason);if(solid(o))for(const other of objects)if(other!==o&&solid(other)&&overlap(o,other))throw new Error('Community '+o.type+' overlaps '+other.type+' at '+other.x+','+other.z);}
  const seen=new Set();for(const q of TRAIN_COLLECTION){
   communityAssert(/^[a-z][a-z0-9-]{0,63}$/.test(q.id)&&!seen.has(q.id),'Train IDs must be unique slugs.');seen.add(q.id);
   communityAssert(typeof q.family==='string'&&/^[a-z][a-z0-9-]{0,31}$/.test(q.family),'Train '+q.id+' needs a model family slug.');
   for(const key of ['name','number','arrangement','tag','service','description'])communityText(q[key],key==='description'?500:80,'Train '+q.id+' '+key);
   communityAssert(['steam','electric','diesel'].includes(q.power),'Invalid train power.');
   communityAssert(['coaches','wagons','trailers'].includes(q.formation),'Invalid formation.');
   communityAssert(Number.isInteger(q.cars)&&q.cars>=1&&q.cars<=6,'Train cars must be 1–6.');
   communityAssert(Array.isArray(q.details)&&q.details.length>=1&&q.details.length<=8,'Train needs 1–8 model details.');for(const detail of q.details)communityText(detail,140,'Model detail');
   communityAssert(Array.isArray(q.liveries)&&q.liveries.length>=1&&q.liveries.length<=6,'Train needs 1–6 finishes.');
   for(const livery of q.liveries){communityAssert(Array.isArray(livery)&&livery.length===4,'Livery needs [name,body,lining,coach].');communityText(livery[0],48,'Livery name');for(const color of livery.slice(1))communityAssert(/^#[0-9a-f]{6}$/i.test(color),'Invalid livery color.');}
   communityAssert(validateCredits(q.credits).length>0,'Train '+q.id+' needs a chosen public credit.');
  }
  return{workshopPieces:credited.length,trains:TRAIN_COLLECTION.map(q=>q.id)};
 })()`);
 for(const id of report.trains){const bytes=await readFile(path.join(root,'assets/trains',id+'.webp'));if(bytes.length>150000)throw new Error(id+' portrait exceeds 150 KB.');if(bytes.length<20||bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WEBP')throw new Error(id+' needs a WebP portrait.');}
 const layouts=[];
 const walk=async directory=>{for(const entry of await readdir(path.join(root,directory),{withFileTypes:true})){const file=path.posix.join(directory,entry.name);if(entry.isDirectory())await walk(file);else if(entry.name.endsWith('.railway.json'))layouts.push(file);}};
 await walk('contributions/layouts');
 for(const file of layouts){context.layout=JSON.parse(await read(file));run('validateProject(layout);communityAssert(validateCredits(layout.credits).length>0,"Layout needs a public credit.");');}
 const result={ok:true,works:catalogue.works.length,...report,layouts};console.log(json?JSON.stringify(result,null,2):'Contribution checks passed: '+catalogue.works.length+' works, '+report.workshopPieces+' editable pieces, '+report.trains.length+' credited trains, '+layouts.length+' layouts.');
}catch(error){console.error(json?JSON.stringify({ok:false,error:error.message}):'Contribution check failed: '+error.message);process.exitCode=1;}
