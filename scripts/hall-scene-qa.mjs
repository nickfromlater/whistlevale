// Build the entered museum with its real geometry code, without a GPU or DOM.
// This complements the native house renderer and contributor catalogue checks.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const read=file=>readFile(new URL('../'+file,import.meta.url),'utf8');
const [html,data,design,core,exhibits]=await Promise.all(['grandhall.html','src/grandhall-data.js','src/grandhall-design.js','src/community-core.js','src/grandhall-exhibits.js'].map(read));
const source=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).sort((a,b)=>b.length-a.length)[0];
function declaration(source,name){
 const start=source.lastIndexOf('function '+name+'(');assert.ok(start>=0,'Missing '+name);
 let depth=0,quote='',line=false,block=false;
 for(let i=source.indexOf('{',start);i<source.length;i++){
  const c=source[i],next=source[i+1];
  if(line){if(c==='\n')line=false;continue;}
  if(block){if(c==='*'&&next==='/'){block=false;i++;}continue;}
  if(quote){if(c==='\\'){i++;continue;}if(c===quote)quote='';continue;}
  if(c==='/'&&next==='/'){line=true;i++;continue;}if(c==='/'&&next==='*'){block=true;i++;continue;}
  if(c==='"'||c==="'"||c==='`'){quote=c;continue;}
  if(c==='{')depth++;else if(c==='}'&&--depth===0)return source.slice(start,i+1);
 }
 throw new Error('Unclosed '+name);
}
const context=vm.createContext({assert,console});
const run=code=>vm.runInContext(code,context);
run(source.slice(source.indexOf('const $=id=>'),source.indexOf('const I=ident();')));
run(`const I=ident(),labels=new Proxy({},{get:()=>({u0:0,v0:0,u1:1,v1:1})});
const records=[],staticMeshes=records,shadowMeshes=[],portals=[];function gpu(mesh){return mesh;}
function addRecord(mesh,model,room,cast=true,options={}){const r={mesh,model,room,cast,...options};records.push(r);return r;}
function createPortal(from,to){portals.push([from,to]);}`);
for(const name of ['sign','ringX','ringZ','arc','windowBay','pendant','table','windowPane'])run(declaration(source,name));
run(data);run(design);run('buildGrandHallArchitecture()');
const report=run(`(()=>{
 const counts=GRAND_HALL_GALLERIES.map(r=>({gallery:r.id,vertices:0,records:0,glass:0}));
 let total=0;
 for(const r of records){
  const a=r.mesh.data;assert.ok(a.length>0&&a.length%36===0,'museum records contain complete triangles');
  assert.ok(a.every(Number.isFinite),'museum geometry contains only finite values');
  assert.ok(Array.from(r.model).every(Number.isFinite),'record transforms are finite');
  total+=r.mesh.count;
  if(r.room!=null){const q=counts[r.room];q.vertices+=r.mesh.count;q.records++;if(r.displayGlass)q.glass+=r.mesh.count;}
  if(r.displayGlass){assert.equal(r.cast,false,'museum glass never casts an opaque shadow');for(let i=9;i<a.length;i+=12)assert.equal(a[i],76,'glass uses the translucent material');}
 }
 assert.ok(total<650000,'the full entered museum stays below its measured geometry allowance');
 assert.ok(records.length<75,'architecture is batched rather than one draw per object');
 assert.equal(new Set(counts.map(r=>r.vertices)).size,7,'every gallery has a distinct built design');
 assert.ok(counts.filter(r=>r.glass>0).length>=5,'museum displays span the designed galleries');
 for(const [a,b]of GRAND_HALL_CONNECTIONS){assert.ok(portals.some(p=>p[0]===a&&p[1]===b));assert.ok(portals.some(p=>p[0]===b&&p[1]===a));}
 return {counts,total,records:records.length};
})()`);
console.table(report.counts);console.log(`Entered Hall geometry passed: ${report.total.toLocaleString()} vertices, ${report.records} batches, finite architecture, distinct galleries, translucent cases and connected portals.`);

// Scoped residency reconstructs exactly the same room geometry, including its
// own half-links, without building another gallery or duplicating portal UI.
run(`(()=>{
 const original=records.slice(),portalCount=portals.length;let rebuilt=0;
 for(let ri=0;ri<GRAND_HALL_GALLERIES.length;ri++){
  const before=records.length;buildGrandHallArchitecture(ri);const scoped=records.splice(before),expected=original.filter(r=>r.room===ri);
  assert.equal(scoped.length,expected.length,'scoped room has the same batches');
  scoped.forEach((r,i)=>{assert.equal(r.room,ri,'scoped geometry belongs to the requested room');assert.deepEqual(r.mesh.data,expected[i].mesh.data,'room rebuild preserves its triangles');rebuilt+=r.mesh.count;});
  assert.equal(portals.length,portalCount,'residency rebuild creates no duplicate portal controls');
 }
 assert.equal(rebuilt,original.reduce((sum,r)=>sum+r.mesh.count,0),'owned half-passages neither disappear nor duplicate');
 for(const invalid of [-1,99,1.5])assert.throws(()=>buildGrandHallArchitecture(invalid),/Unknown Hall gallery/);
})()`);
console.log('Entered Hall residency geometry passed: independent gallery builds, identical reconstruction, owned half-links and stable portal controls.');

// Window art must sit inside real openings. Shoot through the actual triangles
// so a later solid-wall simplification cannot silently flatten the reveals.
run(`(()=>{
 const contains=(x,y,a,i)=>{
  const ax=a[i],ay=a[i+1],bx=a[i+12],by=a[i+13],cx=a[i+24],cy=a[i+25],den=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy);if(Math.abs(den)<1e-8)return false;
  const u=((by-cy)*(x-cx)+(cx-bx)*(y-cy))/den,v=((cy-ay)*(x-cx)+(ax-cx)*(y-cy))/den;return u>1e-5&&v>1e-5&&u+v<1-1e-5;
 };
 for(const [ri,r]of GRAND_HALL_GALLERIES.entries()){
  const b=new Builder();grandHallWall(b,r,'back',grandHallRoomDoors(ri).back);const a=b.mesh().data,wall=[];let panes=0;
  for(let i=0;i<a.length;i+=36)if(a[i+9]===51&&Math.abs(a[i+5])>.99)wall.push(i);
  for(let i=0;i<a.length;i+=36){if(a[i+9]!==71)continue;panes++;
   const x=(a[i]+a[i+12]+a[i+24])/3,y=(a[i+1]+a[i+13]+a[i+25])/3,z=(a[i+2]+a[i+14]+a[i+26])/3;
   assert.ok(wall.every(j=>a[j+2]<=z+.02||!contains(x,y,a,j)),r.id+' glazing is recessed into a wall opening');
   for(let j=0;j<36;j+=12)assert.ok(a[i+j+10]>=0&&a[i+j+10]<=1&&a[i+j+11]>=0&&a[i+j+11]<=1,'window crops stay in the atlas slot');
  }
  assert.ok(panes>0,r.id+' has window glazing');
 }
 const r=GRAND_HALL_GALLERIES[0],b=new Builder();grandHallRoof(b,r);const a=b.mesh().data;
 for(const side of[-1,1]){
  const triangles=[];for(let i=0;i<a.length;i+=36)if(a[i+9]===71&&Math.abs(a[i+2]-side*r.depth/2)<.25)triangles.push(i);
  for(const x of[-10.2,-5.3,.37,5.4,10.1])for(const t of[.2,.55,.8]){
   const y=8.38+Math.sqrt(1-x*x/(15.36*15.36))*3.5*t;
   assert.ok(triangles.some(i=>contains(x,y,a,i)),'the vault end is closed by a fitted clerestory');
  }
 }
})()`);
console.log('Entered Hall construction passed: recessed window openings, bounded outlook crops and closed barrel-vault ends.');

// Verify support metadata against upward-facing triangles, independently of
// the placement code. Rail displays support the model at their rail heads.
run(`(()=>{
 for(const bay of GRAND_HALL_BAYS){
  const b=new Builder();grandHallBayShape(b,bay);const data=b.mesh().data,px=bay.furniture==='platform'?.38:0,pz=0;let top=-Infinity;
  if(bay.furniture==='round')for(let i=0;i<data.length;i+=12)if(data[i+9]===53){assert.ok(Math.abs(data[i+1]-bay.surfaceY)<1e-6,'round display finish uses one actual support plane');assert.ok(data[i+4]>.999,'round felt has no hidden coplanar bottom cap');}
  for(let i=0;i<data.length;i+=36){
   if(data[i+4]<.999)continue;
   const ax=data[i],az=data[i+2],bx=data[i+12],bz=data[i+14],cx=data[i+24],cz=data[i+26],den=(bz-cz)*(ax-cx)+(cx-bx)*(az-cz);if(Math.abs(den)<1e-12)continue;
   const u=((bz-cz)*(px-cx)+(cx-bx)*(pz-cz))/den,v=((cz-az)*(px-cx)+(ax-cx)*(pz-cz))/den,w=1-u-v;if(Math.min(u,v,w)<-1e-6)continue;
   top=Math.max(top,u*data[i+1]+v*data[i+13]+w*data[i+25]);
  }
  assert.ok(Math.abs(top-bay.surfaceY)<1e-6,bay.id+' support matches its actual furniture');
 }
})()`);

// The real entered renderer must execute every reviewed model, too. This
// catches scenery helpers that exist in a railway room but not in the museum.
run(core);run(exhibits);
for(const path of run('Array.from(new Set(GRAND_HALL_EXHIBITS.map(e=>e.source)))'))run(await read(path));
run('const BAY_BY_ID=new Map(GRAND_HALL_BAYS.map(b=>[b.id,b]));');
run(declaration(source,'buildPublishedPottery'));
run(`(()=>{
 const before=records.length;buildPublishedPottery();
 const built=records.slice(before);assert.equal(new Set(built.map(r=>r.exhibitId)).size,GRAND_HALL_EXHIBITS.length,'every reviewed exhibit reaches the entered renderer');
 for(const exhibit of GRAND_HALL_EXHIBITS){
  const bay=BAY_BY_ID.get(exhibit.bay),parts=built.filter(r=>r.exhibitId===exhibit.id),a=parts.flatMap(r=>Array.from(r.mesh.data));let minY=Infinity,maxY=-Infinity;
  for(const part of parts){const data=part.mesh.data;for(let j=9;j<data.length;j+=12)assert.equal(data[j]===76,!!part.displayGlass,'architectural glazing uses its separate transparent pass');if(part.displayGlass)assert.equal(part.cast,false,'architectural glazing casts no opaque shadow');}
  assert.ok(a.length>0&&a.length%36===0&&a.every(Number.isFinite),exhibit.id+' builds finite entered-Hall triangles');
  for(let j=0;j<a.length;j+=12){minY=Math.min(minY,a[j+1]);maxY=Math.max(maxY,a[j+1]);}
  assert.ok(Math.abs(minY-bay.surfaceY)<1e-5,exhibit.id+' touches its actual display surface');
  assert.ok(maxY<=bay.surfaceY+bay.maxHeight,exhibit.id+' fits below the display limit');
  assert.ok(grandHallExhibitCredits(exhibit).length>0,'the entered work retains validated attribution');
 }
})()`);
console.log('Entered Hall exhibits passed: every native model, real material adapter, measured surface contact, height clearance and validated credits.');

// Real projected-surface picking must select rotated cases as well as tables.
run(declaration(source,'pickHallBay'));
run(`const BAYS=GRAND_HALL_BAYS,state={room:0};let eye=[0,20,50];
function project(p){return{x:p[0]*20,y:-p[2]*20-p[1]*3,w:1};}`);
run(`(()=>{
 for(const b of BAYS){state.room=b.room;eye=[b.x,20,b.z+40];const p=project([b.x,b.y+.08,b.z]);assert.equal(pickHallBay(p.x,p.y),b.id,b.id+' is selectable at the center of its surface');}
 assert.equal(pickHallBay(-100000,100000),null,'empty space cannot select a distant bay');
})()`);
console.log('Entered Hall picking passed: all 112 rotated bay surfaces and empty-space rejection.');
