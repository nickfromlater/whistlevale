from pathlib import Path
import hashlib

room=Path('src/rooms/briarwatch.js');qa=Path('scripts/briarwatch-qa.mjs')
s=room.read_text();t=qa.read_text()
assert hashlib.sha256(s.encode()).hexdigest()=='8ba6e7815eaeda5eadb5d0db14c639fcd91f5904ad77f3b34687105a7f09bdab'
assert hashlib.sha256(t.encode()).hexdigest()=='02c6bcdf5d900ae493054a5648233267d60e52e3d32edb9e861e79204167db8d'
helper=r'''function briarGalleryCushion(b,x,y,z,w,h,color){
 // A softly shaded raised cushion, not the recessed timber panel helper.
 // Five visible faces keep the same geometry cost; textile material avoids
 // the wood-grain shader. Its buried back meets the bench frame.
 const X=w/2,Y=h/2,r=.18;
 const outer=[[-X,-Y,-.035],[X,-Y,-.035],[X,Y,-.035],[-X,Y,-.035]];
 const inner=[[-X+r,-Y+r,.20],[X-r,-Y+r,.20],[X-r,Y-r,.20],[-X+r,Y-r,.20]];
 const n=i=>norm([Math.sign(outer[i][0])*.70,Math.sign(outer[i][1])*.70,1]),front=[0,0,1];
 b.push(x,y,z);
 for(let i=0;i<4;i++){const j=(i+1)%4;b.tri(outer[i],outer[j],inner[j],shade(color,.95),23,[n(i),n(j),front]);b.tri(outer[i],inner[j],inner[i],color,23,[n(i),front,front]);}
 b.quad(...inner,color,23,front);b.pop();
}
'''
assert s.count('function briarGalleryBench(b,x){')==1
s=s.replace('function briarGalleryBench(b,x){',helper+'function briarGalleryBench(b,x){',1)
s=s.replace("briarGalleryPanel(b,xx,0,0,3.30,2.84,'#41594b','#61765c')","briarGalleryCushion(b,xx,0,0,3.30,2.84,'#41594b')",1)
s=s.replace("briarGalleryPanel(b,0,0,0,3.20,1.88,'#3e594b','#7b7959')","briarGalleryCushion(b,0,0,0,3.20,1.88,'#3e594b')",1)
a=s.index('function briarReadingLamp(');b=s.index('function briarGalleryReceiver(',a)
part=s[a:b];assert part.count("'#f6d5a1',25")==1 and part.count("'#ffe0a6',25")==1
s=s[:a]+part.replace("'#f6d5a1',25","'#f6d5a1',100").replace("'#ffe0a6',25","'#ffe0a6',100")+s[b:]
anchor="  assert.ok(Math.abs(low-FLOOR)<1e-5,'bench feet meet the room floor within matrix precision');"
assert t.count(anchor)==1
t=t.replace(anchor,"  assert.equal(a.data.filter((v,i)=>i%12===9&&v===23).length,180,'six cushion panels use textile shading instead of timber grain');\n"+anchor,1)
anchor=" assert.equal(seed,saved,'finishing details preserve the shared scene seed');"
assert t.count(anchor)==1
t=t.replace(anchor," const lamp=new Builder();briarReadingLamp(lamp,24,56);assert.ok(lamp.data.every(Number.isFinite));assert.ok(!lamp.data.some((v,i)=>i%12===9&&v===25),'reading lamp diffusers avoid the high-energy bloom material');assert.equal(lamp.data.filter((v,i)=>i%12===9&&v===100).length,336,'reading lamp uses bounded opal radiance');\n"+anchor,1)
final={
 'src/rooms/briarwatch.js':'57709d042f479328c12a6f91d470e43400e4d283d1c094ffd63b10d4e3bfd0c6',
 'scripts/briarwatch-qa.mjs':'90cc8e68cf6b03ae0e5dc633bd8d70b2dbf9b7931cea0fa6e0d178dcf8753b03',
 'src/railway.js':'7a83bb15aa2764e3eba5a0b0d1e5a971852ba5365e717c3cb2991e0648f2e1b3'
}
assert hashlib.sha256(s.encode()).hexdigest()==final[str(room)]
assert hashlib.sha256(t.encode()).hexdigest()==final[str(qa)]
assert hashlib.sha256(Path('src/railway.js').read_bytes()).hexdigest()==final['src/railway.js']
room.write_text(s);qa.write_text(t)
for f,digest in final.items():print(digest,f)
