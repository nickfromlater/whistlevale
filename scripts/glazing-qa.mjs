#!/usr/bin/env node
// Exercise the real opt-in glazing upload/draw/disposal path without a GPU.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=await readFile(new URL('../src/railway.js',import.meta.url),'utf8');
function declaration(name){
 const start=source.indexOf('function '+name+'(');assert.ok(start>=0);
 let depth=0;for(let i=source.indexOf('{',start);i<source.length;i++){if(source[i]==='{')depth++;if(source[i]==='}'&&!--depth)return source.slice(start,i+1);}
 throw Error('Unclosed '+name);
}
let serial=0,bound=null,element=null,failDraw=false;
const calls=[],uploads=[],deleted=[];
const gl={TRIANGLES:4,ARRAY_BUFFER:1,ELEMENT_ARRAY_BUFFER:2,STATIC_DRAW:3,DYNAMIC_DRAW:4,FLOAT:5,UNSIGNED_INT:6,BLEND:7,SRC_ALPHA:8,ONE_MINUS_SRC_ALPHA:9,
 createVertexArray:()=>({kind:'vao',id:++serial}),createBuffer:()=>({kind:'buffer',id:++serial}),
 bindVertexArray:value=>{bound=value;},bindBuffer:(target,value)=>{if(target===2)element=value;},
 bufferData:(target,data)=>uploads.push({target,data:Array.from(data)}),bufferSubData:(target,offset,data)=>calls.push({op:'indices',data:Array.from(data)}),
 enableVertexAttribArray(){},vertexAttribPointer(){},useProgram(){},
 drawArrays:(mode,start,count)=>calls.push({op:'opaque',count,vao:bound}),
 drawElements:(mode,count,type,offset)=>{if(failDraw)throw Error('fixture draw failure');calls.push({op:'glass',count,vao:bound,element});},
 enable:cap=>calls.push({op:'enable',cap}),disable:cap=>calls.push({op:'disable',cap}),blendFunc:(a,b)=>calls.push({op:'blend',a,b}),depthMask:value=>calls.push({op:'depth',value}),
 deleteVertexArray:value=>deleted.push(value),deleteBuffer:value=>deleted.push(value)
};
const context=vm.createContext({assert,gl,calls,console});
const run=code=>vm.runInContext(code,context);
run(source.slice(0,source.indexOf("const canvas=$('world')")));
run("const I=ident(),mainProgram='main';let cameraPos=[0,0,10],cameraTarget=[0,0,0];function um(p,name,model){calls.push({op:'model',model:Array.from(model)});}");
run(source.slice(source.indexOf('function uploadTriangles('),source.indexOf('function createTexture(')));
run(declaration('disposeMesh'));
run("const old=new Builder();old.box(0,0,0,1,1,1,'#778877',6);const oldData=old.data.slice(),legacy=old.mesh();assert.equal(legacy.count,36);assert.equal(legacy.glass,undefined);assert.equal(legacy.opaqueCount,undefined);draw(legacy);draw(legacy,I,'shadow');");
assert.deepEqual(uploads[0].data,Array.from(new Float32Array(run('oldData'))),'opaque upload bytes stay identical');
assert.deepEqual(calls.filter(q=>q.op==='opaque').map(q=>q.count),[36,36],'legacy main and shadow counts unchanged');
calls.length=0;uploads.length=0;
run("const b=new Builder();b.box(0,0,0,1,1,1,'#778877',4);b.quad([-1,0,2],[1,0,2],[1,1,2],[-1,1,2],'#88bbaa',76);b.quad([-1,0,-2],[1,0,-2],[1,1,-2],[-1,1,-2],'#88bbaa',76);const mesh=b.mesh();assert.equal(mesh.count,48);assert.equal(mesh.opaqueCount,36);assert.equal(mesh.glass.count,12);assert.equal(mesh.glass.centers.length,4);draw(mesh,I,'shadow');assert.equal(architecturalGlassDraws.length,0);draw(mesh,trans(3,0,0));assert.equal(architecturalGlassDraws.length,1);drawArchitecturalGlass();assert.equal(architecturalGlassDraws.length,0);");
assert.deepEqual(calls.filter(q=>q.op==='opaque').map(q=>q.count),[36,36]);
assert.equal(calls.filter(q=>q.op==='glass').length,1);
assert.deepEqual(calls.find(q=>q.op==='indices').data,[6,7,8,9,10,11,0,1,2,3,4,5],'far glazing triangles draw first');
assert.equal(calls.filter(q=>q.op==='model').at(-1).model[12],3,'captured map model reaches the glass pass');
assert.deepEqual(calls.filter(q=>q.op==='depth').map(q=>q.value),[false,true]);
assert.equal(calls.at(-1).op,'disable');
assert.equal(calls.at(-1).cap,gl.BLEND);
calls.length=0;
run('draw(mesh,trans(3,0,0));drawArchitecturalGlass();');
assert.equal(calls.filter(q=>q.op==='indices').length,0,'idle camera reuses sorted indices');
run('cameraPos=[0,0,-10];draw(mesh,trans(3,0,0));drawArchitecturalGlass();');
assert.deepEqual(calls.find(q=>q.op==='indices').data,[0,1,2,3,4,5,6,7,8,9,10,11],'reverse camera reverses pane order');
failDraw=true;calls.length=0;
assert.throws(()=>run('draw(mesh);drawArchitecturalGlass();'),/fixture draw failure/);
assert.equal(run('architecturalGlassDraws.length'),0);assert.deepEqual(calls.filter(q=>q.op==='depth').map(q=>q.value),[false,true]);assert.equal(calls.at(-1).op,'disable');
failDraw=false;calls.length=0;
const diagnostics=await readFile(new URL('../src/performance.js',import.meta.url),'utf8');
const wrapper=diagnostics.match(/ draw=function\(mesh,\.\.\.args\)\{[^\n]+/);assert.ok(wrapper);
run('let drawCalls=0,vertices=0;const originalDraw=draw;'+wrapper[0]);
run("draw(mesh,I,'shadow');draw(mesh);draw(legacy);drawArchitecturalGlass();assert.equal(drawCalls,4);assert.equal(vertices,120);");
assert.equal(calls.filter(q=>q.op==='opaque'||q.op==='glass').length,4,'profile draw count matches actual opaque and clear GPU draws');
run('disposeMesh(mesh);');
assert.equal(deleted.length,5,'opaque vao/buffer plus clear vao/buffer/index are released');assert.equal(new Set(deleted).size,5);
assert.ok(source.includes('drawArchitecturalGlass();drawMoonlightHouseAir();drawHobbyParticles();'),'clear panes render after opaque world and before particles');
assert.ok(source.indexOf('drawArchitecturalGlass();drawMoonlightHouseAir();drawHobbyParticles();')<source.indexOf('if(msaaFbo){gl.bindFramebuffer(gl.READ_FRAMEBUFFER,msaaFbo);'),'glass is resolved through the existing MSAA and cinematic postprocess');
assert.ok(source.includes("webglcontextlost',e=>{e.preventDefault();architecturalGlassDraws.length=0;"),'context loss releases queued model references and retains the existing reload flow');
console.log('Architectural glazing QA passed: original opaque bytes, split counts, no opaque shadows, captured map transforms, cached far-to-near triangle order, blend/depth recovery, and full GPU ownership cleanup.');

// Celestial haze and light share the existing alpha lifecycle. The planet
// material remains opaque, while no fog/star/meteor quad casts a hard shadow.
calls.length=0;
run("const fx=new Builder();for(const m of[78,79,80,81,82])fx.quad([-1,0,m],[1,0,m],[1,1,m],[-1,1,m],'#6688aa',m);const effects=fx.mesh();assert.equal(effects.opaqueCount,6);assert.equal(effects.glass.count,24);draw(effects,I,'shadow');assert.equal(architecturalGlassDraws.length,0);draw(effects);drawArchitecturalGlass();disposeMesh(effects);");
assert.deepEqual(calls.filter(q=>q.op==='opaque').map(q=>q.count),[6,6]);
assert.deepEqual(calls.filter(q=>q.op==='glass').map(q=>q.count),[24]);
console.log('Celestial transparency QA passed: bounded alpha batches, opaque worlds, no hard effect shadows, complete cleanup.');
