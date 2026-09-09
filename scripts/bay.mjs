#!/usr/bin/env node
// Print exactly the prompt offered by the Hall's Copy prompt action.
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const args=process.argv.slice(2),id=args.find(arg=>!arg.startsWith('--'));
if(!id||args.some(arg=>arg.startsWith('--')&&arg!=='--markdown')||args.filter(arg=>!arg.startsWith('--')).length!==1){
 console.error('Usage: npm run bay -- AR-03 [--markdown]');
 process.exitCode=1;
}else{
 const sources=await Promise.all(['src/grandhall-data.js','src/grandhall-contribute.js'].map(file=>readFile(new URL('../'+file,import.meta.url),'utf8')));
 const promptForBay=runInNewContext(sources.join('\n')+'\ngrandHallAgentPrompt;');
 try{
  const prompt=promptForBay(id);
  console.log(args.includes('--markdown')?'```text\n'+prompt+'\n```':prompt);
 }catch(error){
  console.error(error.message);
  process.exitCode=1;
 }
}
