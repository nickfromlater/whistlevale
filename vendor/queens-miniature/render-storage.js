/* Lossless storage sharing for the reviewed Queens adapter. MIT licensed.
 * Never run this on the original snapshot or on mutable cloth/particle data. */
export function shareQueensGeometry(scene){
 const buckets=new Map(),seen=new Map();let shared=0,bytesSaved=0;
 function signature(g){return JSON.stringify([Object.entries(g.attributes).map(([key,a])=>[key,a.itemSize,a.normalized,a.array.constructor.name,a.array.length,a.usage,a.gpuType]),g.index&&[g.index.array.constructor.name,g.index.count],g.groups,g.drawRange]);}
 function arrays(g){return [...Object.values(g.attributes).map(a=>a.array),...(g.index?[g.index.array]:[])];}
 function words(a){return a.byteOffset%4===0&&a.byteLength%4===0?new Uint32Array(a.buffer,a.byteOffset,a.byteLength/4):new Uint8Array(a.buffer,a.byteOffset,a.byteLength);}
 function same(a,b){const x=arrays(a),y=arrays(b);return x.every((array,i)=>{const u=words(array),v=words(y[i]);if(u.length!==v.length)return false;for(let j=0;j<u.length;j++)if(u[j]!==v[j])return false;return true;});}
 scene.traverse(node=>{
  const g=node.geometry;
  if(!node.isMesh||node.userData.queensAnimated||!g||g.isInstancedBufferGeometry||Object.keys(g.morphAttributes).length||Object.values(g.attributes).some(a=>a.isInterleavedBufferAttribute))return;
  if(seen.has(g)){node.geometry=seen.get(g);return;}
  let hash=2166136261;for(const a of arrays(g))for(const bit of words(a))hash=Math.imul(hash^bit,16777619);
  const key=signature(g)+':'+hash,bucket=buckets.get(key)||[],match=bucket.find(other=>same(g,other));
  if(match){seen.set(g,match);node.geometry=match;shared++;bytesSaved+=arrays(g).reduce((n,a)=>n+a.byteLength,0);g.dispose();}
  else{seen.set(g,g);bucket.push(g);buckets.set(key,bucket);}
 });
 return {shared,bytesSaved};
}
