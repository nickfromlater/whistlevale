// Recessed, forced-perspective estate outlooks. Everything stays inside the
// room footprint and belongs to the back wall's existing cutaway/cache mesh.
const BRIAR_OUTLOOK={radius:10.2,bottom:3.3,spring:31.3,front:4.8,back:.72};
function briarEstateTree(b,x,y,z,h,kind=0){
 const bark='#545d50';b.beam([x,y,z],[x+.14,y+h*.76,z],.095,bark,93,5);
 if(kind){
  for(let k=0;k<4;k++){const r=h*(.27-k*.048),yy=y+h*(.40+k*.16);b.push(x,yy,z,0,0,0,1,1,.22);b.cylinder(0,0,0,r,.045,h*.37,['#3b5e55','#53766a','#6b8875'][k%3],93,7);b.pop();}
 }else for(let k=0;k<4;k++){
  const a=k*2.4,r=h*.19,xx=x+Math.sin(a)*r,yy=y+h*(.65+.07*k),zz=z+Math.cos(a)*.19;
  b.beam([x,y+h*.4,z],[xx,yy,zz],.055,bark,93,5);
  b.sphere(xx,yy,zz,h*.25,h*.24,.30,['#648775','#73947c','#597967','#819e81'][k],93,7,4);
 }
}
function briarEstateOutlook(b,x,index){
 const q=BRIAR_OUTLOOK,r=q.radius,lo=q.bottom,sy=q.spring,front=q.front;
 b.push(x,0,0);
 // Sky and distant land are separate opaque surfaces; neither receives the
 // gallery dimmer. UVs retain local coordinates through house-map transforms.
 b.quad([-r,lo,q.back],[r,lo,q.back],[r,43,q.back],[-r,43,q.back],'#aec4b7',92,[0,0,1],[[index,0],[index+1,0],[index+1,1],[index,1]]);
 for(let layer=0;layer<3;layer++){
  const zz=1.0+layer*.66,n=24,profile=t=>10.9+(2-layer)*1.20+Math.sin(t*.23+index*2+layer)*1.48+Math.sin(t*.56-layer)*.54;
  for(let i=0;i<n;i++){const a=-r+i*2*r/n,c=a+2*r/n;b.quad([a,lo,zz],[c,lo,zz],[c,profile(c),zz],[a,profile(a),zz],['#93aea2','#739589','#527967'][layer],93);}
 }
 // A different estate vignette in each window, not a repeated image: the
 // west lodge and orchard, and the east walled garden with a little pavilion.
 const hx=index?3.0:-3.0,hy=index?11.1:11.5,hz=2.8,hw=index?4.1:5.9,hh=index?3.5:4.2;
 b.box(hx,hy+hh*.5,hz,hw,hh,.70,index?'#b2b29b':'#c5bf9f',93);
 b.quad([hx-hw*.57,hy+hh,hz+.49],[hx+hw*.57,hy+hh,hz+.49],[hx+hw*.48,hy+hh+1.7,hz-.08],[hx-hw*.48,hy+hh+1.7,hz-.08],'#68736c',93);
 b.tri([hx-hw*.57,hy+hh,hz+.49],[hx,hy+hh+1.7,hz+.49],[hx+hw*.57,hy+hh,hz+.49],'#8b8c77',93);
 if(!index)b.box(hx-1.8,hy+hh+1.50,hz,.42,1.45,.46,'#9c9f88',93);
 for(const dx of[-hw*.31,0,hw*.31]){
  b.box(hx+dx,hy+1.45,hz+.375,.73,1.05,.035,'#d9b77b',98);
  b.box(hx+dx,hy+1.45,hz+.41,.08,1.12,.05,'#667467',93);
 }
 // Terrace, winding garden path and a foreground stone balustrade. The
 // landscape is a shallow theatrical perspective, not a navigable world.
 b.quad([-r,lo,4.02],[r,lo,4.02],[r,8.5,3.0],[-r,8.5,3.0],'#718e69',93);
 b.quad([-4.4,lo+.03,4.05],[-2.4,lo+.03,4.05],[3.8,8.53,3.03],[2.9,8.53,3.03],'#c0b99a',93);
 b.box(0,6.4,3.78,20.2,.30,.31,'#9d9f84',93);
 for(let i=0;i<15;i++)b.box(-9.5+i*1.35,5.25,3.8,.19,2.35,.24,'#8a957e',93);
 for(const [i,t]of [[-4.5,9.7,3.35,11.5,0],[-7.2,11.0,2.45,7.4,1],[4.8,10.1,3.28,10.5,0],[7.1,11.5,2.40,8.7,1],[-.4,12.0,1.95,5.8,0]].entries()){
  const [xx,yy,zz,h,k]=t;briarEstateTree(b,index?-xx:xx,yy,zz,h*(1+index*.06),k);
 }
 // Real reveal depth, with a segmented semicircular intrados. The backing
 // wall stays behind the vista; the front aperture is clear up to the glass.
 for(const s of[-1,1])b.box(s*(r+.56),(lo+sy)/2,(front+q.back)/2,1.12,sy-lo,front-q.back,'#b5ad92',20);
 b.box(0,lo-.43,(front+q.back)/2,2*r+2.3,.86,front-q.back+.4,'#b8ab8b',20);
 for(let i=0;i<20;i++){
  const a=i*PI/20,c=(i+1)*PI/20,A=[Math.cos(a)*r,sy+Math.sin(a)*r],C=[Math.cos(c)*r,sy+Math.sin(c)*r];
  b.quad([A[0],A[1],q.back],[A[0],A[1],front],[C[0],C[1],front],[C[0],C[1],q.back],'#ada88e',20);
  b.quad([A[0],A[1],front],[C[0],C[1],front],[C[0],43,front],[A[0],43,front],'#bcb59d',20);
 }
 archRing(b,0,sy,front,r,r+.62,.38,'#baad8b',20);
 for(const xx of[-r,-r/3,r/3,r]){
  const top=sy+Math.sqrt(Math.max(0,r*r-xx*xx));b.box(xx,(lo+top)/2,front+.12,.24,top-lo,.28,'#8a7755',22);
 }
 for(const yy of[lo,17,sy])b.box(0,yy,front+.16,2*r+.55,.26,.35,'#a18b62',22);
 b.box(0,lo-.78,front+.24,2*r+3.2,.40,1.55,'#897550',22);
 for(const xx of[-r/3,r/3]){b.box(xx+.20,17.55,front+.35,.10,.66,.10,'#c3a46b',41);b.box(xx+.31,17.24,front+.35,.31,.10,.10,'#c3a46b',41);}
 // Clear panes use the existing sorted glazing pass and its disposal contract.
 const glassZ=front-.05;b.quad([-r,lo,glassZ],[r,lo,glassZ],[r,sy,glassZ],[-r,sy,glassZ],'#b7c9bc',76);
 for(let i=0;i<20;i++){const a=i*PI/20,c=(i+1)*PI/20;b.tri([0,sy,glassZ],[r*Math.cos(a),sy+r*Math.sin(a),glassZ],[r*Math.cos(c),sy+r*Math.sin(c),glassZ],'#b7c9bc',76);}
 b.pop();
}
function briarReadingLamp(b,x,z){
 b.cylinder(x,FLOOR+.20,z,.94,.88,.40,'#7d6c4c',41,12);
 b.cylinder(x,FLOOR+4.95,z,.095,.095,9.4,'#ac9163',41,9);
 b.cylinder(x,-13.25,z,1.74,.78,1.65,'#afa078',23,14);
 b.cylinder(x,-14.1,z,1.59,1.59,.06,'#f6d5a1',25,14);
 b.sphere(x,-14.06,z,.22,.27,.22,'#ffe0a6',25,7,4);
}
function briarGalleryReceiver(b,which,pos,angle){
 // Plaster alone opts into the room-specific practical-light wash. Its local
 // coordinates travel in UVs, so pools remain attached in the transformed map.
 const mat=which==='back'?94:which==='front'?96:95,c=Math.cos(angle),s=Math.sin(angle);
 for(let i=0;i<b.data.length;i+=12)if(b.data[i+9]===20){b.data[i+9]=mat;b.data[i+10]=c*(b.data[i]-pos[0])-s*(b.data[i+2]-pos[2]);b.data[i+11]=b.data[i+1];}
}
