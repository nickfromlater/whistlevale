import assert from 'node:assert/strict';
import vm from 'node:vm';
import {communityContext,loadContributionDefinitions,read} from './community-lib.mjs';

const utility=await read('src/mesh-memory.js'),ctx=vm.createContext({});vm.runInContext(utility,ctx);
const pack=vm.runInContext('compactMeshVertices',ctx);
function verify(source,expectIndexed){
 const original=new Uint32Array(source.buffer,source.byteOffset,source.length).slice(),result=pack(source),words=new Uint32Array(result.data.buffer,result.data.byteOffset,result.data.length);
 assert.equal(Boolean(result.indices),expectIndexed);
 for(let i=0;i<original.length;i++)assert.equal(words[(result.indices?result.indices[Math.floor(i/12)]*12:Math.floor(i/12)*12)+i%12],original[i],'expanded GPU stream is bit-for-bit identical, including signed zero and seams');
 return result.data.byteLength+(result.indices?.byteLength||0);
}
const repeated=new Float32Array(96000*12);
for(let i=0;i<96000;i++)for(let j=0;j<12;j++)repeated[i*12+j]=j===1&&i%2===0?-0:((i%4000)*(j+1)%7919)/997;
assert.ok(verify(repeated,true)<repeated.byteLength*.2);
const distinct=new Float32Array(60000*12);for(let i=0;i<60000;i++)distinct[i*12]=i;
assert.equal(verify(distinct,false),distinct.byteLength,'an uncompressible mesh retains the original stream without an index overhead');
const offset=new Float32Array(new ArrayBuffer(50004*48),48,50001*12);assert.ok(verify(offset,true)<offset.byteLength*.1,'subarray offsets are respected');

const state=await communityContext();await loadContributionDefinitions(state,JSON.parse(await read('contributions/world.json')));
const resources=new Map(),bindings=new Map(),draws=[];let vao=null;const noop=()=>{};
const gl={ARRAY_BUFFER:1,ELEMENT_ARRAY_BUFFER:2,STATIC_DRAW:3,DYNAMIC_DRAW:4,FLOAT:5,UNSIGNED_INT:6,TRIANGLES:7,
 createBuffer:()=>{const r={};resources.set(r,0);return r;},createVertexArray:()=>({}),bindVertexArray:value=>vao=value,
 bindBuffer:(kind,value)=>{bindings.set(kind,value);if(vao)vao[kind]=value;},bufferData:(kind,data)=>{const b=bindings.get(kind);resources.set(b,data.byteLength);b.data=data.slice();},
 enableVertexAttribArray:noop,vertexAttribPointer:noop,deleteBuffer:r=>resources.delete(r),deleteVertexArray:noop,drawArrays:(mode,start,count)=>draws.push({start,count,indexed:false}),drawElements:(mode,count,type,offset)=>draws.push({start:offset/4,count,indexed:true}),getUniformLocation:()=>0,uniformMatrix4fv:noop};
Object.assign(state.context,{assert,memoryGL:gl});state.run('gl=memoryGL;mainProgram={u:{}};');
const report=state.run(`(()=>{
 const t=getTemplate({type:'moonlight',seed:0}),alias=getTemplate({type:'moonlight',seed:2});
 assert.equal(alias,t,'seeds cannot duplicate the invariant Moonlight template');assert.equal(t.mesh,null,'viewing, picking and thumbnail data never allocate preview GPU geometry');
 const before=new Float32Array(t.data),saved=Array.from(t.data),mesh=templateMesh(t);
 assert.equal(templateMesh(t),mesh,'repeated drag frames reuse the preview');assert.ok(mesh.indexed,'large static previews are indexed');
 assert.ok(mesh.bytes<before.byteLength*.6,'same complete model uses at least 40% less GPU buffer memory');
 assert.deepEqual(Array.from(t.data),saved,'GPU compaction never mutates retained double-precision CPU geometry');
 const result={emittedVertices:before.length/12,unsharedGpuBytes:before.byteLength,sharedGpuBytes:mesh.bytes,cpuTemplateBytes:t.data.byteLength};
 releaseTemplatePreview();assert.equal(t.mesh,null,'returning to normal viewing releases the preview');
 const other=getTemplate({type:'bench',seed:0});templateMesh(t);templateMesh(other);assert.equal(t.mesh,null,'only the active preview remains resident');releaseTemplatePreview();
 return result;
})()`);
assert.equal(resources.size,0,'changing/releasing previews disposes every GPU buffer, including static and transparent indices');
// Verify actual uploaded indexed bytes, not only the pure compressor.
state.run('const actualModel=getTemplate({type:"moonlight",seed:0}),actualMesh=templateMesh(actualModel);');
const {data,mesh}=state.run('({data:actualModel.data,mesh:actualMesh})'),opaque=mesh.vao[1].data,indices=mesh.vao[2].data;let vertex=0;
for(let i=0;i<data.length;i+=36){if(data[i+9]===84)continue;for(let j=0;j<36;j++,vertex++)assert.ok(Object.is(opaque[indices[Math.floor(vertex/12)]*12+vertex%12],Math.fround(data[i+j])));}
assert.equal(mesh.bytes,[...resources.values()].reduce((a,b)=>a+b,0),'reported GPU bytes include opaque and glass index buffers');
state.run('releaseTemplatePreview();');assert.equal(resources.size,0);
// The Hall uses the same compaction and owns its static index independently.
const html=await read('grandhall.html'),start=html.indexOf('function gpu(cpu,'),end=html.indexOf('function finish(',start);
const hall=vm.createContext({GL:gl,assert});vm.runInContext(utility+'\n'+html.slice(start,end),hall);
const floats=new Float32Array(data),copy=floats.slice();Object.assign(hall,{floats});
const hallMesh=vm.runInContext('gpu({data:floats,count:floats.length/12})',hall);
assert.ok(hallMesh.indexed&&hallMesh.bytes<copy.byteLength*.6);assert.equal(hallMesh.bytes,[...resources.values()].reduce((a,b)=>a+b,0));
const values=hallMesh.vao[1].data,order=hallMesh.vao[2].data;
for(let i=0;i<copy.length;i++)assert.ok(Object.is(values[order[Math.floor(i/12)]*12+i%12],copy[i]));
gl.deleteBuffer(hallMesh.buffer);gl.deleteBuffer(hallMesh.ibo);assert.equal(resources.size,0);
// Moving an indexed object omits its original triangles, then rebuilds its
// shared vertices on commit. A transparent object must also leave the batch.
state.run(`
 const fixture=new Float64Array(60000*12);for(let i=0;i<60000;i++){fixture[i*12]=i%3;fixture[i*12+1]=Math.floor(i/3)%2;fixture[i*12+4]=1;}
 getTemplate=()=>({data:fixture});objectMatrix=o=>trans(o.x,0,0);
 objects=[{id:'a',type:'cottage',x:0},{id:'b',type:'cottage',x:5},{id:'c',type:'cottage',x:10}];
 rebuildScenery();assert.ok(sceneryMesh.indexed);assert.equal(sceneryMesh.count,180000);
 gesture={kind:'move',id:'b'};rebuildScenery('b');drawScenery(mainProgram);
`);
assert.deepEqual(draws.splice(0),[{start:0,count:60000,indexed:true},{start:120000,count:60000,indexed:true}],'draw ranges omit the moving object using index-byte offsets');
const allocations=resources.size;
state.run(`
 objects[1].x=7;gesture=null;updateSceneryObject(objects[1]);
 assert.equal(sceneryMesh.count,180000);assert.equal(sceneryMesh.vao[1].data[sceneryMesh.vao[2].data[60000]*12],7,'moved instance reaches the uploaded buffer');
 const pane=fixture.slice(0,36);for(let i=9;i<pane.length;i+=12)pane[i]=76;
 getTemplate=o=>({data:o.id==='b'?pane:fixture});rebuildScenery();assert.ok(sceneryMesh.glass);
 gesture={kind:'move',id:'b'};rebuildScenery('b');assert.equal(sceneryMesh.count,120000);assert.equal(sceneryMesh.glass,undefined);assert.equal(sceneryRanges.has('b'),false);
 gesture=null;updateSceneryObject(objects[1]);assert.equal(sceneryMesh.count,120003);assert.equal(sceneryMesh.glass.count,3,'finishing or cancelling a move restores the transparent object');
 for(let i=0;i<3;i++){objects[1].x++;updateSceneryObject(objects[1]);}
`);
assert.equal(resources.size,allocations+2,'repeated edits retain only the current opaque and glass buffers');
state.run('disposeMesh(sceneryMesh);sceneryMesh=null;');assert.equal(resources.size,0,'scenery rebuilds release both opaque and transparent indices');
console.log('Memory QA passed: exact GPU reconstruction, no-op fallback, seams/signed zero, original CPU precision, one lazy editor preview, indexed/glass editing, complete cleanup, both renderers. '+JSON.stringify(report));
