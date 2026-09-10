import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=await readFile(new URL('../grandhall.html',import.meta.url),'utf8');
const section=(start,end)=>{const a=source.indexOf(start),b=source.indexOf(end,a);assert.ok(a>=0&&b>a);return source.slice(a,b);};
let vao,bound,uploads=0;const draws=[],deleted=new Set(),noop=()=>{};
const GL={ARRAY_BUFFER:1,ELEMENT_ARRAY_BUFFER:2,STATIC_DRAW:3,DYNAMIC_DRAW:4,TRIANGLES:5,UNSIGNED_INT:6,
 createVertexArray:()=>({}),createBuffer:()=>({}),bindVertexArray:value=>{vao=value;},
 bindBuffer(type,value){bound=value;if(type===this.ELEMENT_ARRAY_BUFFER)vao.indices=value;},
 bufferData(type,data){bound.data=Array.from(data);},bufferSubData(type,offset,data){bound.data=Array.from(data);uploads++;},
 deleteBuffer:value=>deleted.add(value),deleteVertexArray:value=>deleted.add(value),
 drawElements(){draws.push({vao,indices:vao.indices.data.slice()});},drawArrays(){draws.push({vao,indices:null});},
 enableVertexAttribArray:noop,vertexAttribPointer:noop,useProgram:noop,uniformMatrix4fv:noop,uniform3f:noop,uniform2f:noop,activeTexture:noop,bindTexture:noop};
const I=new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
const context=vm.createContext({GL,I,main:{},shadow:{},eye:[0,0,10],target:[0,0,0],shadowVP:I,ROOMS:[{x:0,z:0,height:5,width:10,depth:10}],state:{room:0},atlasTexture:{},uniform:(_,name)=>name,recordVisible:r=>!r.hidden,staticMeshes:[],shadowMeshes:[],glassMeshes:[],lightDirty:false,paint:noop});
const run=text=>vm.runInContext(text,context);
run(section('function gpu(', 'function finish('));
run(section('const hallGlassVisible=[]', 'function recenterLight('));
run(section('function disposeHallRecords(', 'async function buildHallGallery('));
function cpu(depths){const data=new Float32Array(depths.length*36);depths.forEach((z,i)=>{for(let j=0;j<3;j++){data[i*36+j*12]=j-1;data[i*36+j*12+2]=z;}});return{data,count:depths.length*3};}
context.cpu=cpu([1,6,3]);const mesh=run('gpu(cpu,true)'),record={mesh,model:I,room:0};context.glassMeshes.push(record);
run('paint(main,I,glassMeshes)');assert.deepEqual(draws.at(-1).indices,[0,1,2,6,7,8,3,4,5],'front view draws farther triangles first');
const afterFirst=uploads;run('paint(main,I,glassMeshes)');assert.equal(uploads,afterFirst,'fixed camera reuses sorted index data');
context.eye=[0,0,-10];run('paint(main,I,glassMeshes)');assert.deepEqual(draws.at(-1).indices,[3,4,5,6,7,8,0,1,2],'rear view reverses the actual indexed draw order');
const moved=new Float32Array(I);moved[14]=20;const second={mesh:run('gpu(cpu,true)'),model:moved,room:0};context.glassMeshes.push(second);
draws.length=0;run('paint(main,I,glassMeshes)');assert.equal(draws[0].vao,second.mesh.vao,'record ordering includes model translation');
second.hidden=true;draws.length=0;run('paint(main,I,glassMeshes)');assert.equal(draws.length,1,'hidden records are excluded');
context.staticMeshes.push({mesh:run('gpu(cpu)'),model:I,room:0});run('paint(main,I,staticMeshes)');assert.equal(draws.at(-1).indices,null,'opaque geometry retains its nonindexed draw path');
const ibo=mesh.ibo;context.toDispose=[record];run('disposeHallRecords(toDispose)');assert.ok(deleted.has(ibo)&&deleted.has(mesh.buffer)&&deleted.has(mesh.vao));assert.equal(mesh.centers,null);assert.equal(mesh.indices,null);
assert.equal(context.glassMeshes.includes(record),false);assert.equal(run('hallGlassDraws.length'),0,'disposal clears cached record references');
console.log('Hall glass QA passed: actual front/rear indexed draw order, stationary reuse, transformed record order, visibility, opaque path and owned-buffer disposal.');
