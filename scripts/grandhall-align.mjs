#!/usr/bin/env node
// A Hall GLB/image/link draft is not a Commons procedural miniature.
// Fail explicitly: the former converter could emit an empty "valid" catalogue
// or place exhibits far outside the Commons at gallery coordinates.
export function alignExport(){
 throw new Error('Hall drafts cannot be converted into Commons miniatures. Keep the bay draft for review; see docs/contributing/grandhall.md.');
}
if(process.argv[1]?.endsWith('grandhall-align.mjs')){
 try{alignExport();}catch(error){console.error(error.message);process.exitCode=1;}
}
