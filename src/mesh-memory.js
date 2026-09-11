'use strict';

// Consume an owned Float32 upload buffer. Share only byte-identical complete
// vertex records: positions, normals, colours, materials and UV seams survive.
// Triangle order is unchanged. The returned views are uploaded, never cached.
function compactMeshVertices(data){
 const count=data.length/12;
 if(count<50000)return{data,indices:null};
 const words=new Uint32Array(data.buffer,data.byteOffset,data.length),indices=new Uint32Array(count);
 let capacity=1;while(capacity<count*1.5)capacity*=2;
 const slots=new Uint32Array(capacity),mask=capacity-1;let unique=0;
 for(let vertex=0;vertex<count;vertex++){
  const start=vertex*12;let hash=2166136261;
  for(let j=0;j<12;j++)hash=Math.imul(hash^words[start+j],16777619);
  let slot=hash&mask,index;
  for(;;){
   const entry=slots[slot];
   if(!entry){index=unique++;slots[slot]=index+1;const destination=index*12;for(let j=0;j<12;j++)words[destination+j]=words[start+j];break;}
   index=entry-1;let equal=true;for(let j=0;j<12;j++)if(words[index*12+j]!==words[start+j]){equal=false;break;}
   if(equal)break;slot=(slot+1)&mask;
  }
  indices[vertex]=index;
 }
 if(unique*48+indices.byteLength>=data.byteLength*.97){
  // A mostly unique mesh gains nothing. Restore its original stream in place;
  // first-use ordering guarantees each source record precedes its destination.
  for(let vertex=count-1;vertex>=0;vertex--){const source=indices[vertex]*12,destination=vertex*12;for(let j=0;j<12;j++)words[destination+j]=words[source+j];}
  return{data,indices:null};
 }
 return{data:data.subarray(0,unique*12),indices};
}
