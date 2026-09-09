#!/usr/bin/env node
// Compare the actual uploaded Float32 bytes with the builder before its CPU
// optimization. Canvas/GPU calls are inert; all geometry, routes and art UVs run.
// Usage: node scripts/geometry-qa.mjs [--quick]
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {gzipSync,gunzipSync} from 'node:zlib';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('..',import.meta.url));
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const args=process.argv.slice(2),quick=args.includes('--quick');
const nearestReference=`function originalNearestTrack(x,z){let gx=Math.floor(x/2),gz=Math.floor(z/2),best={dist:99,p:[0,1.06,0],edge:null,d:0};for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){let c=trackGrid.get((gx+i)+','+(gz+j));if(c)for(let a of c){let d=Math.hypot(x-a.p[0],z-a.p[2]);if(d<best.dist)best={...a,dist:d}}}return best}`;

// Frozen reference operations from the original geometry prefix. Unchanged
// primitive bodies remain shared unless frozen below for a topology change.
const legacy=`
normalTransform=function(n,m){let a=V(m[0],m[1],m[2]),b=V(m[4],m[5],m[6]),c=V(m[8],m[9],m[10]);return norm(add(add(mul(cross(b,c),n[0]),mul(cross(c,a),n[1])),mul(cross(a,b),n[2])))};
Builder.prototype.push=function(x=0,y=0,z=0,ax=0,ay=0,az=0,sx=1,sy=sx,sz=sx){this.stack.push(this.m);this.m=mm(this.m,mm(trans(x,y,z),mm(ry(ay),mm(rx(ax),mm(rz(az),scaling(sx,sy,sz))))));return this};
Builder.prototype.matrix=function(m){this.stack.push(this.m);this.m=mm(this.m,m);return this};
Builder.prototype.pop=function(){this.m=this.stack.pop()||ident();return this};
Builder.prototype.vertex=function(p,n,c,mat=0,uv=[0,0]){let q=transform(p,this.m),nn=normalTransform(n,this.m);this.data.push(...q,...nn,...col(c),mat,...uv)};
Builder.prototype.tri=function(a,b,c,color,mat=0,ns=null,uv=null){let n=norm(cross(sub(b,a),sub(c,a)));this.vertex(a,ns?ns[0]:n,color,mat,uv?uv[0]:[0,0]);this.vertex(b,ns?ns[1]:n,color,mat,uv?uv[1]:[0,0]);this.vertex(c,ns?ns[2]:n,color,mat,uv?uv[2]:[0,0])};
Builder.prototype.cylinder=function(x,y,z,r1,r2,h,color,mat=0,segs=12,ax=0,az=0){this.push(x,y,z,ax,0,az);for(let i=0;i<segs;i++){let a=i*TAU/segs,b=(i+1)*TAU/segs,pa=[Math.cos(a)*r1,-h/2,Math.sin(a)*r1],pb=[Math.cos(b)*r1,-h/2,Math.sin(b)*r1],pc=[Math.cos(b)*r2,h/2,Math.sin(b)*r2],pd=[Math.cos(a)*r2,h/2,Math.sin(a)*r2],na=norm([Math.cos(a),(r1-r2)/h,Math.sin(a)]),nb=norm([Math.cos(b),(r1-r2)/h,Math.sin(b)]);this.tri(pa,pd,pc,color,mat,[na,na,nb]);this.tri(pa,pc,pb,color,mat,[na,nb,nb]);if(r2>0)this.tri([0,h/2,0],pc,pd,shade(color,1.05),mat);if(r1>0)this.tri([0,-h/2,0],pa,pb,color,mat)}this.pop();return this};
Builder.prototype.sphere=function(x,y,z,sx,sy,sz,color,mat=0,segments=10,rings=7,flat=false){this.push(x,y,z,0,0,0,sx,sy,sz);const p=(a,t)=>[Math.sin(t)*Math.cos(a),Math.cos(t),Math.sin(t)*Math.sin(a)];for(let j=0;j<rings;j++)for(let i=0;i<segments;i++){let a=i*TAU/segments,b=(i+1)*TAU/segments,t=j*PI/rings,u=(j+1)*PI/rings,ps=[p(a,t),p(a,u),p(b,u),p(b,t)],c=flat?shade(color,.93+.13*hash(i,j)):color;this.tri(ps[0],ps[2],ps[1],c,mat,flat?null:[ps[0],ps[2],ps[1]]);this.tri(ps[0],ps[3],ps[2],c,mat,flat?null:[ps[0],ps[3],ps[2]])}this.pop();return this};
appendInstance=function(dst,src,m){const a=dst.data;for(let i=0;i<src.length;i+=12){const x=src[i],y=src[i+1],z=src[i+2],nx=src[i+3],ny=src[i+4],nz=src[i+5],s=Math.hypot(m[0],m[1],m[2])||1;a.push(m[0]*x+m[4]*y+m[8]*z+m[12],m[1]*x+m[5]*y+m[9]*z+m[13],m[2]*x+m[6]*y+m[10]*z+m[14],(m[0]*nx+m[4]*ny+m[8]*nz)/s,(m[1]*nx+m[5]*ny+m[9]*nz)/s,(m[2]*nx+m[6]*ny+m[10]*nz)/s,src[i+6],src[i+7],src[i+8],src[i+9],src[i+10],src[i+11]);}};
nearestTrack=originalNearestTrack;
if(typeof createGroundUncached==='function')createGround=createGroundUncached;
`;

const nearestQueries=`(()=>{
 const savedGrid=trackGrid,savedSeed=seed;trackGrid=new Map();seed=32452843;
 try{
  const put=(x,z,id)=>{const key=Math.floor(x/2)+','+Math.floor(z/2),a={p:[x,id*.031,z],f:[0,0,1],d:id*.43,edge:{name:'query-'+id}};if(!trackGrid.has(key))trackGrid.set(key,[]);trackGrid.get(key).push(a);};
  for(let i=0;i<1800;i++)put(rnd(-30,30),rnd(-24,24),i);
  // Exact ties and coincident points keep the original first-candidate order.
  for(const [x,z,id]of[[-1,0,1801],[1,0,1802],[0,1,1803],[0,-1,1804],[7.5,9.5,1805],[7.5,9.5,1806]])put(x,z,id);
  const queries=[[0,0],[7.5,9.5],[-0,-0],[1000,1000],[-1000,-1000],[-2,-2],[2,2]];
  for(let i=0;i<12000;i++)queries.push([rnd(-34,34),rnd(-28,28)]);
  for(const [x,z]of queries){const a=nearestTrack(x,z),b=originalNearestTrack(x,z);assert.equal(a.dist,b.dist,'exact nearest distance');assert.equal(a.d,b.d,'exact route offset');assert.equal(a.edge,b.edge,'same winning track candidate');assert.deepEqual(a.p,b.p,'same nearest point');assert.deepEqual(a.f,b.f,'same tangent');}
 }finally{trackGrid=savedGrid;seed=savedSeed;}
})()`;

const primitives=`(()=>{
 seed=982451653;const b=new Builder();
 function shapes(i){
  b.box(.3,-.2,.4,1.1,.71,2.4,'#91ad76',3);
  b.cylinder(-.2,.4,.3,.82,i%3?0.37:0,1.31,'#ac916e',41,7+i%7,.21,-.43);
  b.sphere(.1,.2,-.4,.72,1.16,.31,'#678575',8,7+i%5,4+i%4,i%2===0);
  b.beam([0,0,0],[.31,1.3,-.29],.08,'#adbb83',22,7);
  b.beam([0,0,0],[0,-1.2,0],.03,'#85988b',41,6);
  b.tri([0,0,0],[.7,.2,0],[.1,.8,.3],'#728956',4);
  b.tri([0,0,0],[.7,.2,0],[.1,.8,.3],[.1,.5,.8],15,[[0,1,0],[.1,.7,.2],[-.4,.2,.8]],[[.2,.7],[.6,.3],[.8,.9]]);
  b.quad([0,0,0],[.8,0,0],[.8,.6,0],[0,.6,0],'#b1a687',6,[0,0,1],[[0,0],[1,0],[1,1],[0,1]]);
 }
 shapes(0);
 for(let i=0;i<36;i++){
  b.push(rnd(-4,4),rnd(-3,3),rnd(-5,5),rnd(-3,3),rnd(-3,3),rnd(-3,3),rnd(.1,3)*(i%4===0?-1:1),rnd(.1,2),rnd(.1,4));shapes(i);
  b.push(1,-2,.5,.7,-.3,.9,.13,2.3,.84);shapes(i+1);b.pop();shapes(i+2);
  const shear=ident();shear[4]=.37;shear[8]=-.23;shear[9]=.19;b.matrix(shear);shapes(i+3);b.pop();
  b.pop();
 }
 // Degenerate normals, zero scale, and stack underflow preserve their bytes.
 b.push(0,0,0,0,0,0,0,1,1);b.tri([0,0,0],[0,0,0],[0,0,0],'#aabbcc');b.pop();b.pop();shapes(2);
 // Topology reuse must retain seams, fractional subdivisions and independently
 // transformed normals/colours, including a second use of the same template.
 for(const flat of[false,true,false]){
  b.push(1,2,3,.2,.4,.7,.5,1.7,-.3);
  b.sphere(0,0,0,.8,.4,1.2,'#aabbcc',8,7.5,4.5,flat);
  b.cylinder(0,0,0,.7,.1,1.3,'#98b276',41,8.5,.1,-.3);b.pop();
 }
 b.mesh();const instance=new Builder();
 for(const m of[ident(),mm(trans(2,-4,3),mm(ry(.52),scaling(1.4))),mm(rx(-.71),scaling(-.6)),scaling(0)])appendInstance(instance,b.data,m);
 instance.mesh();
})()`;

const terrainQueries=`(()=>{
 const b=new Builder(),surface=alpineRelief(b,(x,z)=>4+Math.sin(x*1.1)*Math.cos(z*.8),()=>[.4,.5,.3]);
 // Read the emitted triangles directly. Barycentric points must meet the
 // returned ground sampler even where the analytic height bends between them.
 for(let triangle=370;triangle<150*96*2-370;triangle+=173){
  const i=triangle*36,a=b.data.slice(i,i+3),q=b.data.slice(i+12,i+15),r=b.data.slice(i+24,i+27);
  for(const weights of[[.2,.3,.5],[.1,.7,.2]]){
   const p=a.map((v,k)=>v*weights[0]+q[k]*weights[1]+r[k]*weights[2]);
   if(Math.abs(p[0])>43||Math.abs(p[2])>24)continue;
   assert.ok(Math.abs(surface(p[0],p[2])-p[1])<1e-10,'detail heights meet the drawn terrain triangle');
  }
 }
 for(const p of[[52,0],[-52,0],[0,33],[0,-33],[51,32],[-51,-32]])assert.ok(Number.isFinite(surface(...p)),'edge and rounded-corner queries remain finite');
})()`;

function worker(mode,output){
 const noop=()=>{},gradient={addColorStop:noop};
 const drawing=new Proxy({measureText:text=>({width:String(text).length*7}),createLinearGradient:()=>gradient,createRadialGradient:()=>gradient},{get:(o,k)=>k in o?o[k]:noop,set:(o,k,v)=>(o[k]=v,true)});
 const element=()=>({width:0,height:0,style:{setProperty:noop},classList:{add:noop,remove:noop,toggle:noop},getContext:()=>drawing,addEventListener:noop});
 const document={getElementById:()=>element(),createElement:()=>element(),addEventListener:noop,querySelectorAll:()=>[]};
 const glStub=new Proxy({getParameter:()=>8192},{get:(o,k)=>k in o?o[k]:noop});
 let group='setup',serial=0;const meshes=[],timings={};
 const context=vm.createContext({assert,console,document,matchMedia:()=>({matches:false}),innerWidth:1440,innerHeight:1000,devicePixelRatio:2,setTimeout:noop,clearTimeout:noop,requestAnimationFrame:noop,glStub,
  profileGeometryStage(name,fn){const start=performance.now();try{return fn();}finally{timings[name]=Math.round(((timings[name]||0)+performance.now()-start)*10)/10;}},
  record(data){
   assert.equal(data.length%36,0,group+' has whole triangles');
   const floats=new Float32Array(data);
   for(let i=0;i<floats.length;i++)assert.ok(Number.isFinite(floats[i]),group+' finite attribute '+i);
   const name=String(serial++).padStart(4,'0')+'.bin.gz';
   // Lossless receipts limit temporary disk use; comparison still uses every
   // uncompressed Float32 byte, including signed zeros and exact attributes.
   fs.writeFileSync(path.join(output,name),gzipSync(Buffer.from(floats.buffer),{level:1}));
   meshes.push({file:name,group,count:data.length/12});return{count:data.length/12};
  }});
 context.window=context;context.addEventListener=noop;
 vm.runInContext(read('src/community-core.js'),context);context.HOUSE_COMMUNITY=JSON.parse(read('contributions/world.json'));
 vm.runInContext(read('src/railway.js'),context,{filename:'src/railway.js'});
 vm.runInContext('gl=glStub;upload=record;disposeMesh=function(){};',context);
 vm.runInContext(nearestReference,context);
 if(mode==='reference')vm.runInContext(legacy,context,{filename:'pre-optimization-builder'});
 vm.runInContext('const qaCreateGround=createGround;createGround=function(){return profileGeometryStage("createGround",()=>qaCreateGround());};',context);
 const moduleFiles=[...read('index.html').matchAll(/<script src="(src\/[^"?]+\.js)"/g)].map(m=>m[1]);
 for(const file of moduleFiles){if(file==='src/hobby.js')break;if(!['src/community-core.js','src/railway.js'].includes(file))vm.runInContext(read(file),context,{filename:file});}
 function run(name,code){group=name;const start=performance.now();vm.runInContext(code,context,{filename:'geometry-qa:'+name});timings[name]=Math.round((performance.now()-start)*10)/10;}
 run('primitives-and-transforms',primitives);
 run('nearest-track-queries',nearestQueries);
 run('terrain-surface-queries',terrainQueries);
 if(!quick){
  run('valley','seed=72491;buildWorld();rebuildScenery();');
  run('valley-room','createRoom();');
  run('valley-people','buildValleyLife();initWalkingFigures();');
  run('train-collection','buildTrains();');
  run('selectable-trains',"for(const q of TRAIN_COLLECTION)for(let livery=0;livery<q.liveries.length;livery++)for(const part of Object.values(collectionGeometry({id:q.id,livery,cars:q.cars})))upload(part.data);");
  run('room-atlas','initHouseArt();');
  for(const key of vm.runInContext('[...HOUSE_ROOM_BUILDERS.keys()]',context))run(key,`getHouseScene(${JSON.stringify(key)});`);
 }
 fs.writeFileSync(path.join(output,'manifest.json'),JSON.stringify({meshes,timings}));
}

if(args[0]==='--worker'){
 worker(args[1],args[2]);
}else{
 const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'whistlevale-geometry-'));
 try{
  for(const mode of['reference','optimized']){
   const output=path.join(temporary,mode);fs.mkdirSync(output);
   const child=spawnSync(process.execPath,['--max-old-space-size=6144',fileURLToPath(import.meta.url),'--worker',mode,output,...(quick?['--quick']:[])],{cwd:root,encoding:'utf8',maxBuffer:1024*1024});
   if(child.status!==0)throw new Error(mode+' failed:\n'+child.stdout+child.stderr);
  }
  const reference=JSON.parse(fs.readFileSync(path.join(temporary,'reference/manifest.json'))),optimized=JSON.parse(fs.readFileSync(path.join(temporary,'optimized/manifest.json')));
  assert.deepEqual(optimized.meshes,reference.meshes,'mesh order, group, and vertex counts match');
  let vertices=0;
  for(const mesh of reference.meshes){
   const a=gunzipSync(fs.readFileSync(path.join(temporary,'reference',mesh.file))),b=gunzipSync(fs.readFileSync(path.join(temporary,'optimized',mesh.file)));
   if(!a.equals(b)){
    let i=0;while(i<a.length&&a[i]===b[i])i++;
    const attribute=Math.floor(i/4);throw new Error(`${mesh.group} ${mesh.file}: mismatch at vertex ${Math.floor(attribute/12)}, attribute ${attribute%12}; original=${a.readFloatLE(Math.floor(i/4)*4)}, optimized=${b.readFloatLE(Math.floor(i/4)*4)}`);
   }
   vertices+=mesh.count;
  }
  console.log(`PASS: ${reference.meshes.length} meshes, ${vertices.toLocaleString()} vertices, ${(vertices*12).toLocaleString()} Float32 attributes are bitwise identical.`);
  console.log('Node CPU timings include byte receipts and validation; use the browser baseline for startup impact.');
  console.table(Object.entries(reference.timings).map(([group,ms])=>({group,referenceMs:ms,optimizedMs:optimized.timings[group],speedup:(ms/(optimized.timings[group]||1)).toFixed(2)+'x'})));
 }finally{fs.rmSync(temporary,{recursive:true,force:true});}
}
