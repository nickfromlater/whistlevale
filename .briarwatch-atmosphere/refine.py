from pathlib import Path
import hashlib

root=Path('.')
expected={
 'src/rooms/briarwatch.js':'3f30c7663be92635bd6767d4e99b66fee345504c9f08f39290ed334755306d30',
 'src/railway.js':'b0bfa3aa2ab1c14a96c1e15b52649a6bd1b73e15cbff69e80bd3cd3a03dd0813',
 'scripts/briarwatch-qa.mjs':'b5735cfa7cf9cb386a23af72b5e60992d6f7780cb0919090ac776786a939e1be'}
final={
 'src/rooms/briarwatch.js':'2bee9234e9f57f528197129a67c0c225d46bc4041a714afbaf89f0cb7d4f7912',
 'src/railway.js':'b0bfa3aa2ab1c14a96c1e15b52649a6bd1b73e15cbff69e80bd3cd3a03dd0813',
 'scripts/briarwatch-qa.mjs':'2e183807a187ef2b0aee16e4c189a31ed488fcad876f9041746e021906577e72'}
sources={f:(root/f).read_text() for f in expected}
for f,s in sources.items():assert hashlib.sha256(s.encode()).hexdigest()==expected[f],f
s=sources['src/rooms/briarwatch.js']
a=s.index('function briarEstateTree(');z=s.index('function briarEstateOutlook(',a)
s=s[:a]+'''function briarEstateTree(b,x,y,z,h,kind=0){
 const start=b.data.length,bark='#545d50';
 if(kind){
  briarTaperBranch(b,[x,y,z],[x+.14,y+h*.9,z],h*.024,.015,bark);
  for(let k=0;k<4;k++){
   const r=h*(.27-k*.048),yy=y+h*(.40+k*.16);
   b.push(x+Math.sin(k*2.1+x)*h*.022,yy,z,0,0,0,1,1,.22);
   b.cylinder(0,0,0,r,.045,h*.37,['#3b5e55','#53766a','#6b8875'][k%3],93,7);b.pop();
  }
 }else{
  // The same authored branching language as the miniature, not polygon balls.
  // Compress only depth to fit the theatrical recess; keep the canopy airy.
  b.push(x,y,z,0,0,0,1,1,.27);
  const fork=[h*.035,h*.43,0];
  briarTaperBranch(b,[0,0,0],[h*.012,h*.22,.03],h*.040,h*.028,bark);
  briarTaperBranch(b,[h*.012,h*.22,.03],fork,h*.028,h*.020,bark);
  for(let k=0;k<6;k++){
   const a=k*2.399+x*.17,r=h*(.20+.045*hash(k,x)),q=[Math.cos(a)*r+h*.035,h*(.60+.12*hash(x,k)),Math.sin(a)*r],mid=lerpV(fork,q,.57);
   mid[1]-=h*.055;briarTaperBranch(b,fork,mid,h*.015,h*.010,bark);briarTaperBranch(b,mid,q,h*.010,.008,bark);
   briarLeafCloud(b,q,h*(.175+.018*(k%3)),['#557c65','#719279','#5d836b'][k%3],x+k*7);
  }b.pop();
 }
 for(let i=start;i<b.data.length;i+=12)b.data[i+9]=93;
}
''' +s[z:]
s=s.replace(" b.box(0,lo-.43,(front+q.back)/2,2*r+2.3,.86,front-q.back+.4,'#b8ab8b',20);", """ b.box(0,lo-.43,(front+q.back)/2,2*r+2.3,.86,front-q.back+.4,'#b8ab8b',20);
 // Close the top and upper sides of the casing. Without these returns the
 // backing sky escaped above the arch in the high arrival camera.
 b.box(0,46.5,(front+q.back)/2,2*r+2.3,7,front-q.back,'#bcb59d',20);
 for(const side of[-1,1])b.box(side*(r+.56),(sy+43)/2,(front+q.back)/2,1.12,43-sy,front-q.back,'#bcb59d',20);""",1)
s=s.replace("w.beam([x,43,lampZ],[x,46,lampZ],.045,'#51473a',41,6);w.cylinder(x,42.5,lampZ,3.0,1.35,1.15,'#94794f',41,20);w.cylinder(x,41.91,lampZ,2.72,2.72,.07,'#f0dcb0',25,20);", "w.beam([x,43,z],[x,43,lampZ],.12,'#665039',22,4);w.beam([x,43,lampZ],[x,39.8,lampZ],.045,'#51473a',41,6);w.cylinder(x,39.3,lampZ,3.0,1.35,1.15,'#94794f',41,20);w.cylinder(x,38.71,lampZ,2.72,2.72,.07,'#f0dcb0',25,20);",1)
s=s.replace("w.beam([x,42.35,lampZ],[x+Math.cos(a)*2.2,41.55,lampZ+Math.sin(a)*2.2]", "w.beam([x,39.15,lampZ],[x+Math.cos(a)*2.2,38.35,lampZ+Math.sin(a)*2.2]",1)
s=s.replace("w.sphere(x+Math.cos(a)*2.2,41.5,lampZ+Math.sin(a)*2.2", "w.sphere(x+Math.cos(a)*2.2,38.3,lampZ+Math.sin(a)*2.2",1)
s=s.replace("lights:[[-44,41.9,-45],[44,41.9,-45],[-44,41.9,44],[44,41.9,44]", "lights:[[-44,38.7,-45],[44,38.7,-45],[-44,38.7,44],[44,38.7,44]",1)
sources['src/rooms/briarwatch.js']=s
s=sources['scripts/briarwatch-qa.mjs']
s=s.replace(" const again=new Builder();briarEstateOutlook(again,-42,0);", """ // Above and oblique rays must meet the closed casing before its sky.
 assert.ok(briarQASegmentHits(opaque,[-42,48,8],[-42,42,1.1])>0,'no sky leak above the arch');
 assert.ok(briarQASegmentHits(opaque,[-28,38,8],[-34,38,1.1])>0,'upper side return seals oblique views');
 const again=new Builder();briarEstateOutlook(again,-42,0);""",1)
s=s.replace(" assert.deepEqual(houseRoomLights('briarwatch').slice(4)", " assert.deepEqual(houseRoomLights('briarwatch').slice(0,4),[[-44,38.7,-45],[44,38.7,-45],[-44,38.7,44],[44,38.7,44]],'pendant lights meet the lowered supported fixtures');\n assert.deepEqual(houseRoomLights('briarwatch').slice(4)",1)
sources['scripts/briarwatch-qa.mjs']=s
for f,s in sources.items():assert hashlib.sha256(s.encode()).hexdigest()==final[f],f
for f,s in sources.items():
 (root/f).write_text(s);print(f,final[f])
