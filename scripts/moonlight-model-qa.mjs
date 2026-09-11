import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {communityContext,loadContributionDefinitions,read} from './community-lib.mjs';

const files=await Promise.all(['grandhall.html','src/community-core.js','src/grandhall-data.js','src/grandhall-exhibits.js','src/scenery/moonlight-drive-in.js'].map(read));
const [html,core,data,exhibits,source]=files,house=await communityContext();
await loadContributionDefinitions(house,JSON.parse(await read('contributions/world.json')));
// Execute the entered Hall's actual primitive adapter, without initializing its
// DOM, GPU or animation. This catches helpers that only work in the house.
const start=html.indexOf('const $=id=>document.getElementById(id), TAU='),end=html.indexOf('const I=ident();',start);
assert.ok(start>=0&&end>start,'locate the actual Hall geometry adapter');
const hallContext=vm.createContext({assert});
vm.runInContext([html.slice(start,end),core,data,exhibits,source].join('\n'),hallContext);
const hall={context:hallContext,run:code=>vm.runInContext(code,hallContext,{timeout:10000})};
const digest=values=>createHash('sha256').update(Buffer.from(new Float64Array(values).buffer)).digest('hex');
const reports=[];
for(const [name,state]of[['house',house],['hall',hall]]){
 Object.assign(state.context,{assert,digest});
 reports.push({renderer:name,...state.run(`(()=>{
  const exhibit=GRAND_HALL_EXHIBITS.find(e=>e.id==='moonlight-drive-in'),bay=GRAND_HALL_BAYS.find(b=>b.id===exhibit.bay);
  assert.equal(bay.id,'LW-04');assert.notEqual(exhibit.mapPreview,true,'full theater stays out of the eager Hall map preview');
  const b=new Builder(),again=new Builder(),saved=seed,people=moonlightDriveIn(b);
  assert.equal(moonlightDriveIn(again),people);assert.equal(people,25,'the authored seated and standing spectators are built');
  assert.equal(seed,saved,'neither build consumes the surrounding landscape random sequence');
  const hash=digest(b.data);assert.equal(digest(again.data),hash,'complete native geometry is deterministic');
  assert.equal(b.stack.length+again.stack.length+b.normalStack.length+again.normalStack.length,0);
  const vertices=b.data.length/12;assert.ok(vertices>0&&vertices<=300000,'complete detailed theater fits its existing contribution ceiling');
  assert.ok(b.data.every(Number.isFinite)&&b.data.length%36===0);
  const bounds=[[Infinity,-Infinity],[Infinity,-Infinity],[Infinity,-Infinity]],materials=new Set([8,10,22,23,41,83,84,85]),screen=[],beam=[],nameplate=[],lamps=[];let bulbs=0,foliage=0;
  for(let i=0;i<b.data.length;i+=12){
   for(let j=0;j<3;j++){bounds[j][0]=Math.min(bounds[j][0],b.data[i+j]);bounds[j][1]=Math.max(bounds[j][1],b.data[i+j]);}
   assert.ok(materials.has(b.data[i+9]),'the model uses finishes supported by both renderers');
   assert.ok(Math.abs(Math.hypot(b.data[i+3],b.data[i+4],b.data[i+5])-1)<1e-6,'transformed normals remain unit length');
   if(b.data[i+9]===83)screen.push(b.data.slice(i,i+12));if(b.data[i+9]===84)beam.push(b.data.slice(i,i+12));if(b.data[i+9]===85)nameplate.push(b.data.slice(i,i+12));if(b.data[i+9]===10){bulbs++;lamps.push(b.data.slice(i,i+3));}if(b.data[i+9]===8)foliage++;
  }
  assert.ok(bulbs>0&&foliage>0,'modeled practical lights and flocked foliage survive the port');
  for(let i=0;i<b.data.length;i+=36){
   assert.equal(b.data[i+9],b.data[i+21]);assert.equal(b.data[i+9],b.data[i+33],'a triangle never crosses shader materials');
   const u=[0,1,2].map(j=>b.data[i+12+j]-b.data[i+j]),v=[0,1,2].map(j=>b.data[i+24+j]-b.data[i+j]);
   const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
   assert.ok(Math.hypot(...n)>1e-12,'every emitted triangle has real area');
   assert.ok(n.reduce((sum,k,j)=>sum+k*(b.data[i+3+j]+b.data[i+15+j]+b.data[i+27+j]),0)>0,'face winding agrees with the authored outward normals');
  }
  assert.equal(screen.length,6,'one unsegmented picture plane');
  assert.deepEqual(screen.map(p=>p.slice(10)),[[0,0],[1,0],[1,1],[0,0],[1,1],[0,1]],'film UVs cover the whole picture without a mirrored seam');
  for(const p of screen){assert.ok(Math.abs(p[2]+9.805)<1e-6);assert.deepEqual(p.slice(3,6),[0,0,1]);assert.ok(Math.abs(p[0]-(p[10]-.5)*12.6)<1e-6);assert.ok(Math.abs(p[1]-(8.1+(p[11]-.5)*9.45))<1e-6);}
  assert.equal(nameplate.length,6,'one small personalized plaque on the real projection booth');
  assert.deepEqual(nameplate.map(p=>p.slice(10)),screen.map(p=>p.slice(10)),'booth lettering uses the complete upright texture');
  for(const p of nameplate){assert.deepEqual(p.slice(3,6),[0,0,1]);assert.ok(Math.abs(p[0]-(-.6+(p[10]-.5)*2.6))<1e-6);assert.ok(Math.abs(p[1]-(2.48+(p[11]-.5)*.48))<1e-6);assert.ok(Math.abs(p[2]-12.208)<1e-6);assert.ok(p[1]>2.145&&p[1]<2.74,'the plaque clears the actual doors, windows and roof');}
  assert.equal(beam.length,18,'three static sheets restore projection light with only six triangles');
  for(let i=0;i<beam.length;i+=6){
   const sheet=beam.slice(i,i+6),tip=sheet[0].slice(0,3).map((v,j)=>(v+sheet[1][j])/2),end=sheet[2].slice(0,3).map((v,j)=>(v+sheet[5][j])/2);
   assert.deepEqual(sheet.map(p=>p.slice(10)),screen.map(p=>p.slice(10)),'UV distance reaches both ends of each sheet');
   assert.ok(lamps.filter(p=>Math.hypot(p[0]-tip[0],p[1]-tip[1])<.17&&Math.abs(p[2]-tip[2])<.025).length>20,'each beam begins inside the modeled projector lens');
   assert.ok(Math.abs(end[0])<1e-6&&Math.abs(end[1]-8.1)<1e-6&&Math.abs(end[2]-screen[0][2]-.003)<1e-6,'the beam ends immediately in front of the actual picture');
   for(const p of sheet){assert.ok(Math.abs(p[0])<=6.3&&p[1]>=3.375&&p[1]<=12.825,'effect remains inside the authored projection volume');assert.ok(p.slice(10).every(v=>v>=0&&v<=1));}
   assert.ok(Math.abs(sheet[0].slice(0,3).map((v,j)=>sheet[5][j]-v).reduce((sum,v,j)=>sum+v*sheet[0][j+3],0))<1e-6,'each sheet is planar, avoiding a visible diagonal crease');
  }
  const placed=new Builder();grandHallPlaceExhibit(exhibit,placed,bay);assert.equal(placed.data.length,b.data.length);
  let minY=Infinity,maxY=-Infinity,minMargin=Infinity;const ca=Math.cos(bay.yaw),sa=Math.sin(bay.yaw);
  for(let i=0;i<placed.data.length;i+=12){const dx=placed.data[i]-bay.x,dz=placed.data[i+2]-bay.z,x=ca*dx-sa*dz,z=sa*dx+ca*dz,y=placed.data[i+1]-bay.surfaceY;minY=Math.min(minY,y);maxY=Math.max(maxY,y);minMargin=Math.min(minMargin,bay.usableWidth/2-Math.abs(x),bay.usableDepth/2-Math.abs(z));}
  assert.ok(Math.abs(minY)<1e-6,'the complete timber base contacts LW-04 cloth');assert.ok(minMargin>.09,'the miniature leaves a margin inside the actual display');assert.ok(maxY<bay.maxHeight);
  const nested=new Builder();nested.push(3,2,-4,.1,.2,.3,.5);const matrix=Array.from(nested.m);moonlightDriveIn(nested,1,2,3,.4);assert.deepEqual(Array.from(nested.m),matrix);assert.equal(nested.stack.length,1);nested.pop();
  const landscape=new Builder();moonlightDriveIn(landscape,0,0,0,0,{landscape:true});let bottom=Infinity;for(let i=1;i<landscape.data.length;i+=12)bottom=Math.min(bottom,landscape.data[i]);assert.equal(bottom,-.25,'railway variant substitutes the shallow earth base');
  return{vertices,landscapeVertices:landscape.data.length/12,beamVertices:beam.length,nameplateVertices:nameplate.length,people,bounds,displayHeight:maxY,displayMargin:minMargin,vertexBufferMiB:vertices*48/2**20,hash};
 })()`)});
}
assert.equal(reports[0].hash,reports[1].hash,'house and entered Hall adapters preserve identical native geometry');
const total=house.run(`GRAND_HALL_EXHIBITS.reduce((sum,exhibit)=>{const b=new Builder();grandHallBuildExhibit(exhibit.builder,b);return sum+b.data.length/12;},0)`),limit=house.run('GRAND_HALL_LIMITS.exhibitVertices');
assert.ok(total<=limit,'the complete Hall catalogue fits its shared allowance: '+total+' / '+limit);
const railway=await read('src/railway.js'),beamBlock=source=>{const match=source.match(/\/\/ MOONLIGHT_BEAM_BEGIN[^\n]*\n([\s\S]*?)\/\/ MOONLIGHT_BEAM_END/);assert.ok(match,'shared projection-beam shader exists');return match[1];};
assert.equal(beamBlock(railway),beamBlock(html),'both renderers use the identical beam treatment');
const declaration=(text,name)=>{const start=text.indexOf('function '+name+'(');assert.ok(start>=0);let depth=0;for(let i=text.indexOf('){',start)+1;i<text.length;i++){if(text[i]==='{')depth++;if(text[i]==='}'&&!--depth)return text.slice(start,i+1);}throw Error('Unclosed '+name);};
// The model's actual 84 triangles must reach the existing alpha lifecycle,
// including its shadow exclusion, depth-write restoration and owned disposal.
let bound=null,buffer=null;const calls=[],deleted=new Set(),noop=()=>{};
const gl={TRIANGLES:4,ARRAY_BUFFER:1,ELEMENT_ARRAY_BUFFER:2,STATIC_DRAW:3,DYNAMIC_DRAW:4,FLOAT:5,UNSIGNED_INT:6,BLEND:7,SRC_ALPHA:8,ONE_MINUS_SRC_ALPHA:9,
 createVertexArray:()=>({}),createBuffer:()=>({}),bindVertexArray:value=>{bound=value;},bindBuffer:(kind,value)=>{buffer=value;if(bound)bound[kind===1?'vertices':'indices']=value;},
 bufferData:(kind,data)=>{buffer.data=data;},bufferSubData:noop,enableVertexAttribArray:noop,vertexAttribPointer:noop,useProgram:noop,uniformMatrix4fv:noop,getUniformLocation:(program,name)=>name,
 drawArrays:(mode,start,count)=>calls.push({op:'opaque',count}),drawElements:(mode,count)=>calls.push({op:'alpha',count}),enable:noop,disable:noop,blendFunc:noop,depthMask:value=>calls.push({op:'depth',value}),
 deleteBuffer:value=>deleted.add(value),deleteVertexArray:value=>deleted.add(value)};
Object.assign(house.context,{beamGL:gl,beamCalls:calls});
house.run(`gl=beamGL;mainProgram={u:{}};shadowProgram={u:{}};
 (()=>{const b=new Builder();moonlightDriveIn(b);const mesh=b.mesh();assert.equal(mesh.glass.count,18);assert.equal(mesh.opaqueCount,mesh.count-18);
  for(let i=9;i<mesh.vao.vertices.data.length;i+=12)assert.notEqual(mesh.vao.vertices.data[i],84,'no beam in opaque GPU geometry');
  for(let i=9;i<mesh.glass.vao.vertices.data.length;i+=12)assert.equal(mesh.glass.vao.vertices.data[i],84);
  draw(mesh,I,shadowProgram);assert.equal(architecturalGlassDraws.length,0,'shadow drawing never queues the beam');
  draw(mesh);assert.equal(architecturalGlassDraws.length,1);drawArchitecturalGlass();assert.equal(architecturalGlassDraws.length,0);disposeMesh(mesh);
 })();`);
assert.deepEqual(calls.filter(q=>q.op==='opaque').map(q=>q.count),[reports[0].vertices-18,reports[0].vertices-18]);
assert.deepEqual(calls.filter(q=>q.op==='alpha').map(q=>q.count),[18]);assert.deepEqual(calls.filter(q=>q.op==='depth').map(q=>q.value),[false,true]);assert.equal(deleted.size,5,'both vertex buffers, arrays and alpha index buffer are released');
Object.assign(hall.context,{GL:gl,beamCalls:calls});calls.length=0;
hall.run(`const I=ident(),BAY_BY_ID=new Map(GRAND_HALL_BAYS.map(b=>[b.id,b])),staticMeshes=[],glassMeshes=[],shadowMeshes=[],main={};
 function gpu(cpu,transparent=false){return{...cpu,transparent};}
 function paint(program,projection,records){assert.equal(records,glassMeshes);beamCalls.push({op:'alpha',count:records.reduce((n,r)=>n+r.mesh.count,0)});}
 ${declaration(html,'addRecord')}\n${declaration(html,'buildPublishedPottery')}\n${declaration(html,'paintHallGlass')}
 buildPublishedPottery(null,'moonlight-drive-in');
 assert.equal(staticMeshes.length,1);assert.equal(glassMeshes.length,1);assert.equal(shadowMeshes.length,1);assert.equal(shadowMeshes[0],staticMeshes[0]);
 assert.equal(glassMeshes[0].mesh.count,18);assert.equal(glassMeshes[0].mesh.transparent,true);
 for(let i=9;i<shadowMeshes[0].mesh.data.length;i+=12)assert.notEqual(shadowMeshes[0].mesh.data[i],84,'entered Hall beam never casts a hard shadow');
 for(let i=9;i<glassMeshes[0].mesh.data.length;i+=12)assert.equal(glassMeshes[0].mesh.data[i],84);
 paintHallGlass(I);`);
assert.deepEqual(calls.filter(q=>q.op==='alpha').map(q=>q.count),[18]);assert.deepEqual(calls.filter(q=>q.op==='depth').map(q=>q.value),[false,true]);
hall.run(`let qaBoothPose=null;function setPose(camera,target){qaBoothPose={camera,target};}
 ${declaration(html,'focusHallMoonlightBooth')}
 focusHallMoonlightBooth();
 (()=>{const vertices=staticMeshes[0].mesh.data,face=[];for(let i=0;i<vertices.length;i+=12)if(vertices[i+9]===85)face.push(vertices.slice(i,i+12));
  const center=[0,1,2].map(axis=>face.reduce((sum,p)=>sum+p[axis],0)/face.length),normal=face[0].slice(3,6),delta=sub(qaBoothPose.camera,center);
  assert.ok(len(sub(qaBoothPose.target,center))<.04,'the Hall booth camera aims at the actual placed plaque');
  assert.ok(delta.reduce((sum,n,i)=>sum+n*normal[i],0)>.15,'the Hall booth camera remains in front of its real lettering and beyond its near plane');
  assert.ok(len(delta)<1.3,'the Hall booth is approached at exhibition scale');
 })();`);
console.log('Moonlight model QA passed: '+JSON.stringify({renderers:reports.map(({hash,...report})=>report),hallVertices:total,hallAllowance:limit}));
