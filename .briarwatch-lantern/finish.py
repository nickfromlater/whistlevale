from pathlib import Path
import hashlib

# Apply after the already-reviewed Lantern Gallery revision. Validate every
# source and resulting byte stream before replacing any runtime file.
expected={
 'src/rooms/briarwatch.js':'d00f1171a5581674ef25ad8d15acd860bd212faeef2c7a96f66a262f54bb29c4',
 'src/railway.js':'7a83bb15aa2764e3eba5a0b0d1e5a971852ba5365e717c3cb2991e0648f2e1b3',
 'scripts/briarwatch-qa.mjs':'f26d37919df7f11408bb882b2b8ceb9d02cd8ff0d87cfebbba61a6442e48ad7f'
}
source={f:Path(f).read_text() for f in expected}
for f,s in source.items():
    assert hashlib.sha256(s.encode()).hexdigest()==expected[f],f
extra=r'''function briarGalleryCove(b,width){
 // A shallow, mitered ceiling cove belongs to its wall's native cutaway.
 // It replaces the repeated dentil strip, not the open center of the ceiling.
 const profile=[[44.55,1.04],[45.4,2.40],[46.65,4.0],[48.1,5.15],[49.25,5.55]];
 const P=(x,i)=>[x,profile[i][0],profile[i][1]];
 for(let i=1;i<profile.length;i++){
  const a=width/2-profile[i-1][1],q=width/2-profile[i][1];
  b.quad(P(-a,i-1),P(a,i-1),P(q,i),P(-q,i),['#354d48','#3d574f','#465e54','#536c5d'][i-1],22);
 }
 // Thin brass seams run into the corner miters. Nothing projects below the
 // window heads, and each rib has exactly the same profile as its backing.
 for(const i of[0,4]){const [y,z]=profile[i],w=width/2-z;b.quad([-w,y,z+.025],[w,y,z+.025],[w-.06,y+.09,z+.055],[-w+.06,y+.09,z+.055],'#b69963',41);}
 const bays=Math.floor((width-18)/22),span=(width-18)/bays;
 for(let k=0;k<=bays;k++){
  const x=-width/2+9+k*span;
  for(let i=1;i<profile.length;i++){const a=P(x-.052,i-1),q=P(x+.052,i-1),r=P(x+.052,i),t=P(x-.052,i);for(const p of[a,q,r,t])p[2]+=.035;b.quad(a,q,r,t,'#aa8b55',41);}
 }
 // Inlaid compass stars on the inclined middle panel, not luminous particles.
 // The surface parameterization keeps each point flush on the actual cove.
 const motif=(x,u,v)=>[x+u,47.23+v,4.0+(47.23+v-46.65)*1.15/1.45+.045];
 for(let k=0;k<bays;k+=2){
  const x=-width/2+9+(k+.5)*span;
  for(let i=0;i<16;i++){
   const a=i*TAU/16,q=(i+1)*TAU/16,r=i%2?.18:(i%4===0?.58:.37),R=(i+1)%2?.18:((i+1)%4===0?.58:.37);
   b.tri(motif(x,0,0),motif(x,Math.sin(a)*r,Math.cos(a)*r),motif(x,Math.sin(q)*R,Math.cos(q)*R),i%2?'#b99c69':'#d4bb83',41);
  }
 }
}
function briarGalleryBench(b,x){
 // A full-size, leather-upholstered viewing bench. Splayed legs and low arms
 // stay on the visitor floor, safely in front of the scenic peninsula ends.
 b.push(x,FLOOR,50);
 for(const side of[-1,1])for(const end of[-1,1]){
  const X=side*4.35,Z=end*1.08;
  b.beam([X*1.04,.16,Z*1.10],[X,3.40,Z],.27,'#6e5439',22,4);
  b.box(X*1.04,.10,Z*1.10,.44,.20,.44,'#ad9061',41);
 }
 b.box(0,1.36,0,8.9,.26,.43,'#70573a',22);
 b.box(0,3.43,0,10.8,.42,3.1,'#866844',22);
 b.push(0,3.66,0,-PI/2);
 for(const xx of[-3.43,0,3.43])briarGalleryPanel(b,xx,0,0,3.30,2.84,'#41594b','#61765c');
 b.pop();
 b.box(0,4.94,1.36,10.48,2.45,.40,'#745839',22);
 for(const xx of[-3.43,0,3.43]){b.push(xx,4.94,1.13,0,PI);briarGalleryPanel(b,0,0,0,3.20,1.88,'#3e594b','#7b7959');b.pop();}
 for(const side of[-1,1]){
  b.box(side*5.06,4.13,-1.10,.26,1.20,.26,'#816442',22);
  b.box(side*5.06,4.76,0,.38,.23,2.91,'#a18a60',22);
 }
 b.pop();
}
'''
qa=r'''// The cove replaces dentils without filling the open ceiling. Upholstered
// benches stay below the miniature and remain wholly on the visitor floor.
Object.assign(report,state.run(`(()=>{
 const saved=seed,coves=[];
 for(const width of[156,128]){
  const a=new Builder(),b=new Builder();briarGalleryCove(a,width);briarGalleryCove(b,width);
  assert.deepEqual(a.data,b.data,'ceiling cove is deterministic');assert.equal(a.stack.length,0);
  assert.ok(a.data.every(Number.isFinite));
  for(let i=0;i<a.data.length;i+=12){const x=a.data[i],y=a.data[i+1],z=a.data[i+2];assert.ok(y>=44.55&&y<49.6&&z>=1&&z<5.8&&Math.abs(x)<width/2,'cove stays in the high perimeter cutaway');}
  coves.push({width,vertices:a.data.length/12});
 }
 const benches=[];
 for(const x of[-24,24]){
  const a=new Builder(),b=new Builder();briarGalleryBench(a,x);briarGalleryBench(b,x);
  assert.deepEqual(a.data,b.data,'bench is deterministic');assert.equal(a.stack.length,0);
  assert.ok(a.data.every(Number.isFinite));let low=Infinity;
  for(let i=0;i<a.data.length;i+=12){const X=a.data[i],y=a.data[i+1],z=a.data[i+2];low=Math.min(low,y);assert.ok(!briarInside(X,z),'bench never enters scenic terrain');assert.ok(Math.abs(X-x)<5.5&&z>48&&z<52&&y>=FLOOR&&y<FLOOR+6.3,'bench respects the surveyed visitor zone');}
  assert.ok(Math.abs(low-FLOOR)<1e-5,'bench feet meet the room floor within matrix precision');
  assert.ok(briarQASegmentHits(a,[x,FLOOR+3,50],[x,FLOOR+4.4,50])>0,'upholstered seat has a solid supported surface');
  benches.push({x,vertices:a.data.length/12});
 }
 assert.equal(seed,saved,'finishing details preserve the shared scene seed');
 return {galleryCeilingCoves:coves,galleryUpholsteredBenches:benches};
})()`));
'''
s=source['src/rooms/briarwatch.js']
assert s.count('function briarShell(b){')==1
s=s.replace('function briarShell(b){',extra+'\nfunction briarShell(b){',1)
old=" for(const x of[-24,24]){b.box(x,-20.72,50,10,.55,2.1,'#70573b',22);for(const dx of[-4.1,4.1])b.box(x+dx,-22.25,50,.45,3,.45,'#5b4936',22);}"
assert s.count(old)==1
s=s.replace(old,' for(const x of[-24,24])briarGalleryBench(b,x);',1)
old="  // Frieze dentils are small visible faces, not box meshes hidden in plaster.\n  for(let x=-width/2+2;x<width/2-1;x+=3.2)w.quad([x-.40,43.8,1.05],[x+.4,43.8,1.05],[x+.40,44.6,1.05],[x-.4,44.6,1.05],'#a78d61',22);"
assert s.count(old)==1
source['src/rooms/briarwatch.js']=s.replace(old,'  briarGalleryCove(w,width);',1)
s=source['scripts/briarwatch-qa.mjs']
anchor="Object.assign(report,state.run(`(()=>{\n const s=getHouseScene('briarwatch'),part="
assert s.count(anchor)==1
source['scripts/briarwatch-qa.mjs']=s.replace(anchor,qa+'\n'+anchor,1)
final={
 'src/rooms/briarwatch.js':'8ba6e7815eaeda5eadb5d0db14c639fcd91f5904ad77f3b34687105a7f09bdab',
 'src/railway.js':expected['src/railway.js'],
 'scripts/briarwatch-qa.mjs':'02c6bcdf5d900ae493054a5648233267d60e52e3d32edb9e861e79204167db8d'
}
for f,s in source.items():assert hashlib.sha256(s.encode()).hexdigest()==final[f],f
for f,s in source.items():
    Path(f).write_text(s)
    print(final[f],f)
