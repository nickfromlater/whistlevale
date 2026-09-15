'use strict';

// THE RIFT OBSERVATORY. Original landscape, railway and architecture by
// nickfromlater, with agent assistance. Proposal #39; no animal geometry.
// Everything is native, deterministic, and baked outside the frame loop.
const SAFARI={width:112,depth:80,step:.7,water:-2.05,bed:-3.75,beamWidth:.56,beamDepth:.72};
const SAFARI_LODGE={x:24,z:1,floor:4.45,bounds:[8,-7.3,39,8.5]};
const SAFARI_WALKS=[[[-28,35],[-36,24],[-37,16],[-32,8],[-29,0],[-20,1],[-14,10],[-11,17],[-6,20]],[[-10,31.3],[-12,26],[-10,23],[-6,20]],[[10.3,20],[12,18.1],[16.5,12.6],[21.2,9.1],[24,7.8]]];
function safariLodgeClear(x,z,r=0){const a=SAFARI_LODGE.bounds;return x+r<a[0]||x-r>a[2]||z+r<a[1]||z-r>a[3];}
function safariWalkDistance(x,z){let distance=Infinity;for(const walk of SAFARI_WALKS)for(let i=1;i<walk.length;i++){const a=walk[i-1],q=walk[i],dx=q[0]-a[0],dz=q[1]-a[1],t=clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz));distance=Math.min(distance,Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t));}return distance;}
const SAFARI_PALETTE={ivory:'#ead7aa',sand:'#cfb277',grass:'#b4ac61',ochre:'#b77847',rock:'#a96942',shadow:'#73533c',jade:'#345e50',leaf:'#6f8149',brass:'#be9655',wood:'#785637',dark:'#293e35'};
const SAFARI_ROUTE=(()=>{
 const p=(x,y,z)=>[x,y,z],line=(a,b)=>[a,lerpV(a,b,1/3),lerpV(a,b,2/3),b];
 return new Edge('The Rift Skyway',[
  line(p(-35,6.8,28),p(18,6.8,28)),
  [p(18,6.8,28),p(34,6.8,28),p(45,9.2,18),p(45,9.2,3)],
  [p(45,9.2,3),p(45,9.2,-13),p(37,11.2,-28),p(23,11.2,-28)],
  line(p(23,11.2,-28),p(6,11.2,-28)),
  [p(6,11.2,-28),p(-9,11.2,-28),p(-13,9.4,-17),p(-25,9.4,-17)],
  [p(-25,9.4,-17),p(-36,9.4,-17),p(-47,8.2,-23),p(-47,8.2,-7)],
  [p(-47,8.2,-7),p(-47,8.2,9),p(-50,6.8,28),p(-35,6.8,28)]
 ]);
})();
// A small spatial grid makes terrain/clearance queries independent of route size.
const SAFARI_RAIL_CELLS=(()=>{
 const cells=new Map();for(let d=0;d<SAFARI_ROUTE.length;d+=.5){const a=SAFARI_ROUTE.at(d),key=Math.floor(a.p[0]/5)+','+Math.floor(a.p[2]/5);if(!cells.has(key))cells.set(key,[]);cells.get(key).push(a);}
 return cells;
})();
function safariRailNear(x,z){
 let distance=Infinity,point=null;const ix=Math.floor(x/5),iz=Math.floor(z/5);
 for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++)for(const a of SAFARI_RAIL_CELLS.get((ix+dx)+','+(iz+dz))||[]){const d=Math.hypot(x-a.p[0],z-a.p[2]);if(d<distance){distance=d;point=a.p;}}
 return {distance,point};
}
function safariRiverX(z){return -2.6+5.6*Math.sin(z*.078)+2.1*Math.sin(z*.17+.4);}
function safariRiverWidth(z){return 2.25+1.1*Math.exp(-(((z-7)/10)**2))+.28*Math.sin(z*.23);}
function safariBank(x,z){return Math.abs(x-safariRiverX(z))-safariRiverWidth(z);}
// Broad river terraces and broken, stepped escarpments replace the original
// radial mounds. The same authored relief drives the model and every placement.
function safariRawHeight(x,z){
 const bank=safariBank(x,z),roll=.68+.66*Math.sin(x*.079+z*.031)+.34*Math.cos(z*.145-x*.038)+.12*Math.sin(x*.37+z*.23);
 const mesa=(cx,cz,rx,rz,h)=>{
  const xx=(x-cx+(z-cz)*.18)/rx,zz=(z-cz)/rz,angle=Math.atan2(zz,xx);
  const r=Math.pow(Math.abs(xx)**3+Math.abs(zz)**3,1/3)+.046*Math.sin(angle*5+1.4)+.026*Math.sin(angle*11)+.018*Math.sin(x*.92+z*.31);
  // Broad, offset caprock and a steep broken wall, not concentric cones.
  return h*(.13*(1-smooth(.92,1.25,r))+.22*(1-smooth(.74,.96,r))+.65*(1-smooth(.50,.72,r)));
 };
 const ridge=mesa(21,-21.5,18.5,13.6,19.0)+mesa(-35,-24.5,13.4,11.2,12.4);
 const shoulder=1.7*Math.exp(-((x+30)**2/290+(z-12)**2/54))+1.15*Math.exp(-((x-38)**2/140+(z-23)**2/42));
 // A sheltered sandy shelf meets the river before the higher rocky escarpment.
 let h=mix(SAFARI.bed,roll+ridge+shoulder,smooth(-.22,5.7,bank));
 const lodgePad=(1-smooth(17.2,20.5,Math.abs(x-24)))*(1-smooth(12.2,15.5,Math.abs(z-3)))*smooth(1.8,4.3,bank);
 h=mix(h,2.05+.80*(1-smooth(-8,17,z)),lodgePad);
 // Existing station terraces are retained, with a genuine high-level landing.
 h=mix(h,8.1,(1-smooth(11,14,Math.abs(x-16)))*(1-smooth(3.9,6,Math.abs(z+32))));
 h=mix(h,8.1,(1-smooth(3.2,5,Math.abs(x-3.2)))*(1-smooth(1.5,3.2,Math.abs(z+31.15))));
 h=mix(h,1.15,(1-smooth(11,15,Math.abs(x+27)))*(1-smooth(2,4.5,Math.abs(z-35.5))));
 const rail=safariRailNear(x,z);
 if(rail.point&&rail.distance<3.2)h=mix(h,Math.min(h,rail.point[1]-1.18),1-smooth(1.05,3.2,rail.distance));
 return h;
}
// Exact interpolation of the two emitted triangles, not a second analytic hill.
const SAFARI_GRID={nx:Math.ceil(SAFARI.width/SAFARI.step),nz:Math.ceil(SAFARI.depth/SAFARI.step)};
SAFARI_GRID.dx=SAFARI.width/SAFARI_GRID.nx;SAFARI_GRID.dz=SAFARI.depth/SAFARI_GRID.nz;
// Lazy double-precision samples are shared by grounded details, not GPU meshes.
const SAFARI_HEIGHT_CACHE=new Map();
function safariGridHeight(ix,iz){const key=iz*(SAFARI_GRID.nx+1)+ix;if(!SAFARI_HEIGHT_CACHE.has(key))SAFARI_HEIGHT_CACHE.set(key,safariRawHeight(-56+ix*SAFARI_GRID.dx,-40+iz*SAFARI_GRID.dz));return SAFARI_HEIGHT_CACHE.get(key);}
function safariSurface(x,z){
 const g=SAFARI_GRID,ix=clamp(Math.floor((x+56)/g.dx),0,g.nx-1),iz=clamp(Math.floor((z+40)/g.dz),0,g.nz-1),x0=-56+ix*g.dx,z0=-40+iz*g.dz;
 const u=clamp((x-x0)/g.dx),v=clamp((z-z0)/g.dz),a=safariGridHeight(ix,iz),r=safariGridHeight(ix+1,iz),f=safariGridHeight(ix,iz+1),q=safariGridHeight(ix+1,iz+1);
 return u+v<=1?a+(r-a)*u+(f-a)*v:q+(f-q)*(1-u)+(r-q)*(1-v);
}
function safariGroundColor(x,y,z,n){
 const bank=safariBank(x,z),patch=.5+.25*Math.sin(x*.115+Math.sin(z*.13)*2.1)+.18*Math.cos(z*.18+x*.034);
 let c=lerpV(col('#717347'),col('#aa955b'),clamp(patch));
 const earth=smooth(.43,.82,.5+.5*Math.sin(x*.082-z*.12+Math.sin(x*.17)));
 c=lerpV(c,col('#b38c61'),earth*.52);
 c=lerpV(c,col('#546c43'),(1-smooth(2.4,8.5,bank))*.75);
 // Broad sediment beds and narrow mineral seams are confined to the rock.
 const layer=.5+.5*Math.sin(y*2.35+.19*Math.sin(x*.4)+.2*Math.sin(z*.36));
 let rock=lerpV(col('#765840'),col('#b69266'),smooth(.16,.88,layer));
 rock=lerpV(rock,col('#d2b38b'),smooth(.93,.995,layer)*.3);
 c=lerpV(c,rock,smooth(.10,.35,1-n[1]));
 c=lerpV(c,col('#9f875b'),smooth(12,20,y)*.22);
 return y<SAFARI.water+.45?lerpV(col('#49685b'),col('#a8976b'),smooth(SAFARI.bed,SAFARI.water+.45,y)):c;
}
function safariTerrain(b){
 const g=SAFARI_GRID,vertices=[],normals=[],colors=[];
 for(let j=0;j<=g.nz;j++)for(let i=0;i<=g.nx;i++){
  const x=-56+i*g.dx,z=-40+j*g.dz,y=safariRawHeight(x,z),n=norm([safariRawHeight(x-.16,z)-safariRawHeight(x+.16,z),.32,safariRawHeight(x,z-.16)-safariRawHeight(x,z+.16)]);
  vertices.push([x,y,z]);normals.push(n);colors.push(safariGroundColor(x,y,z,n));
 }
 const waterTriangle=points=>{
  // Clip the actual terrain triangle at one water elevation. There are no
  // rectangular water sheets poking through banks or gaps at a low camera.
  const out=[];for(let i=0;i<points.length;i++){const a=points[i],q=points[(i+1)%points.length],inside=a[1]<SAFARI.water,next=q[1]<SAFARI.water;if(inside)out.push(a);if(inside!==next)out.push(lerpV(a,q,(SAFARI.water-a[1])/(q[1]-a[1])));}
  for(let i=1;i+1<out.length;i++)for(const p of[out[0],out[i],out[i+1]]){
   const bank=safariBank(p[0],p[2]),c=lerpV(col('#356a60'),col('#8ea985'),smooth(-2.2,.45,bank));b.vertex([p[0],SAFARI.water+.009,p[2]],[0,1,0],c,7);
  }
 };
 for(let j=0;j<g.nz;j++)for(let i=0;i<g.nx;i++){
  const a=j*(g.nx+1)+i;
  for(const ids of[[a,a+g.nx+1,a+1],[a+1,a+g.nx+1,a+g.nx+2]]){for(const k of ids)b.vertex(vertices[k],normals[k],colors[k],3);waterTriangle(ids.map(k=>vertices[k]));}
 }
 // Exposed geological sections meet the walnut case instead of green curtains.
 for(const side of[-1,1])for(const alongX of[true,false]){
  const count=alongX?g.nx:g.nz,step=alongX?g.dx:g.dz,half=alongX?56:40;
  for(let i=0;i<count;i++){
   const t=-half+i*step,q=t+step,a=alongX?[t,side*40]:[side*56,t],d=alongX?[q,side*40]:[side*56,q];
   const ya=safariSurface(...a),yq=safariSurface(...d);
   for(let k=0;k<5;k++){const lo=k/5,hi=(k+1)/5;b.quad([a[0],mix(-4.62,ya,lo),a[1]],[d[0],mix(-4.62,yq,lo),d[1]],[d[0],mix(-4.62,yq,hi),d[1]],[a[0],mix(-4.62,ya,hi),a[1]],['#6e503b','#8a6346','#af8358','#ba9566','#c2a675'][k],3);}
  }
 }
}
function safariRock(b,x,z,r=1,variant=0){
 const y=safariSurface(x,z),n=8,heights=[0,.19,.52,.82,1],radii=[.90,1,.89,.71,.28],turn=hash(variant,81)*TAU;
 const point=(k,level)=>{const a=turn+k*TAU/n,scale=radii[level]*(.86+hash(k%n,variant+16)*.23);return[x+Math.cos(a)*r*scale,y-.12+heights[level]*r*.74,z+Math.sin(a)*r*scale*.76];};
 for(let j=0;j<4;j++)for(let i=0;i<n;i++){
  const c=shade(['#a07850','#b99464','#c5a475','#d3b581'][j],.88+hash(i,variant)*.18);b.quad(point(i,j),point(i+1,j),point(i+1,j+1),point(i,j+1),c,3);
 }
 for(let i=0;i<n;i++)b.tri([x,y-.12+r*.74,z],point(i,4),point(i+1,4),'#d0b480',3);
}
// Tapered, crooked branches have a real fork structure. Flat, torn-edged
// leaf crowns leave air between branch tips instead of stacking green spheres.
function safariBranch(b,a,q,r0,r1,color='#594a32',segments=7){
 const f=norm(sub(q,a)),right=norm(cross(Math.abs(f[1])>.93?[1,0,0]:[0,1,0],f)),up=norm(cross(f,right));
 const ring=(p,r,i)=>add(p,add(mul(right,Math.cos(i*TAU/segments)*r),mul(up,Math.sin(i*TAU/segments)*r)));
 for(let i=0;i<segments;i++)b.quad(ring(a,r0,i),ring(a,r0,i+1),ring(q,r1,i+1),ring(q,r1,i),shade(color,.82+.20*Math.sin(i+1)**2),22);
}
function safariCrown(b,x,y,z,r,variant){
 const n=10,point=(i,level)=>{
  const a=i*TAU/n,sc=(.82+hash(i%n,variant)*.25)*(level===0?.35:level===1?1:.72),h=level===0?-.13:level===1?0:.19;
  return[x+Math.cos(a)*r*sc,y+r*(h+hash(i%n,variant+70)*.085),z+Math.sin(a)*r*sc*.78];
 };
 for(let i=0;i<n;i++){
  b.quad(point(i,0),point(i+1,0),point(i+1,1),point(i,1),'#304e34',8);
  b.quad(point(i,1),point(i+1,1),point(i+1,2),point(i,2),['#4c632f','#61743a','#778548'][i%3],8);
  b.tri(point(i,2),point(i+1,2),[x,y+r*.27,z],i%3?'#657b3e':'#89934f',8);
  // Leaflets escape the crown edge and break up its silhouette at close range.
  const p=point(i,1),a=i*TAU/n,tip=add(p,[Math.cos(a)*r*.19,r*.08,Math.sin(a)*r*.19]);
  for(let j=0;j<3;j++){
   const c=lerpV(p,tip,(j+1)/3),dx=Math.cos(a+PI/2)*r*.11,dz=Math.sin(a+PI/2)*r*.11;
   b.tri([c[0]-dx,c[1],c[2]-dz],add(c,[Math.cos(a)*r*.08,r*.06,Math.sin(a)*r*.08]),[c[0]+dx,c[1],c[2]+dz],j%2?'#788b45':'#5b7338',8);
  }
 }
}
function safariAcacia(b,x,z,h=5.8,variant=0){
 const y=safariSurface(x,z),a=hash(variant,17)*TAU,bark='#625037',lean=[Math.cos(a)*h*.07,Math.sin(a)*h*.07];
 b.push(x,y,z);
 const trunk=[[0,-.05,0],[-lean[0]*.4,h*.16,lean[1]*.6],[lean[0]*.6,h*.36,lean[1]],[lean[0],h*.49,lean[1]*.65]];
 for(let i=1;i<trunk.length;i++)safariBranch(b,trunk[i-1],trunk[i],h*(.047-i*.007),h*(.04-i*.007),bark,8);
 for(let i=0;i<5;i++){const t=a+i*TAU/5,dx=Math.cos(t)*h*.16,dz=Math.sin(t)*h*.16;safariBranch(b,[0,.12,0],[dx,safariSurface(x+dx,z+dz)-y+.022,dz],h*.023,h*.003,bark,5);}
 for(let i=0;i<5;i++){
  const angle=a+i*2.399,r=h*(i?(.25+hash(i,variant)*.15):.07),xx=lean[0]+Math.cos(angle)*r,zz=lean[1]+Math.sin(angle)*r,yy=h*(.78+hash(i,variant+51)*.12),fork=[lean[0]+Math.cos(angle)*r*.48,h*.64,lean[1]+Math.sin(angle)*r*.48];
  safariBranch(b,trunk[2],fork,h*.024,h*.014,bark,6);safariBranch(b,fork,[xx,yy,zz],h*.014,h*.005,bark,5);
  for(let k=0;k<(i===4?1:2);k++){
   const az=angle+k*2.64,dx=Math.cos(az)*h*.10,dz=Math.sin(az)*h*.10,cy=yy+(k?.03:-.02)*h;
   safariBranch(b,[xx,yy-h*.08,zz],[xx+dx,cy,zz+dz],h*.007,h*.002,bark,4);
   safariCrown(b,xx+dx,cy,zz+dz,h*(.18+hash(i,k+variant)*.055),variant*19+i*3+k);
  }
 }
 b.pop();
}
const SAFARI_TREES=(()=>{
 const trees=[];
 const addTree=(x,z,h,v)=>{
  const near=safariRailNear(x,z),foot=h*.17,levels=[-foot,0,foot].flatMap(dx=>[-foot,0,foot].map(dz=>safariSurface(x+dx,z+dz)));
  if(Math.abs(x)+h*.86>55||Math.abs(z)+h*.86>39||safariBank(x,z)<4.3||near.distance<h*.86+1.2||Math.max(...levels)-Math.min(...levels)>1.1||!safariLodgeClear(x,z,h*.76)||safariWalkDistance(x,z)<1.4||Math.hypot(x+24,z-10.2)<5.8)return;
  if(trees.some(t=>Math.hypot(x-t.x,z-t.z)<1.6))return;
  trees.push({x,z,h,variant:v});
 };
 for(const [x,z,h,v]of[[-17,11,8.2,1],[-29,2,7.6,2],[26,13,7.0,3],[32,-18,6.5,4],[-41,13,6.0,5],[14,0,7.3,6],[-19,-5,5.2,7]])addTree(x,z,h,v);
 for(const [cx,cz,n]of[[-29,4,7], [22,4,6],[-38,-30,6],[34,20,5],[20,-12,4],[-18,20,4],[-30,13,11],[-19,13,8],[-41,0,7],[-20,-7,7],[-44,-30,5],[39,-18,5]])for(let i=0;i<n;i++){
  const a=i*2.399+cx,r=3+Math.sqrt(i)*2.2;addTree(cx+Math.cos(a)*r,cz+Math.sin(a)*r*.7,3.7+hash(i,cx)*2.1,100+cx*3+i);
 }
 for(const [x,z,h,v]of[[15.8,10.0,5.4,901],[30.8,13.3,6.1,902],[21.2,19,5.0,903],[37.1,17.5,4.2,904]])addTree(x,z,h,v);
 return trees;
})();
function safariNaturalDetails(b){
 for(const t of SAFARI_TREES)safariAcacia(b,t.x,t.z,t.h,t.variant);
 // Bands of small wind-combed tufts articulate the ground without noisy dots.
 for(let i=0;i<2400;i++){
  const x=-54+hash(i,501)*108,z=-38+hash(i,502)*76,y=safariSurface(x,z),bank=safariBank(x,z);
  if(bank<2||safariRailNear(x,z).distance<1.4||!safariLodgeClear(x,z,.45)||safariWalkDistance(x,z)<.75||Math.abs(x+26)<15&&z>29||Math.abs(x-16)<12&&z< -28)continue;
  const slope=Math.abs(safariSurface(x+.25,z)-safariSurface(x-.25,z))+Math.abs(safariSurface(x,z+.25)-safariSurface(x,z-.25));if(slope>.33)continue;
  const h=.20+hash(i,503)*.45,color=i%4?'#c3b96c':'#ded091';
  for(let k=0;k<3;k++){const dx=(k-1)*.09,zz=z+(k%2)*.07,base=safariSurface(x+dx,zz);b.tri([x+dx-.035,base,zz],[x+dx+.20,base+h*(.65+k*.13),zz+.09],[x+dx+.045,base,zz],color,8);}
 }
 for(const [cx,cz,count]of[[35,3,16],[-35,-22,15],[18,-14,12],[-42,23,8],[29,23,9]])for(let i=0;i<count;i++){
  const a=i*2.399,r=.6+Math.sqrt(i)*1.3,x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r*.75,size=.35+hash(i,cx)*1.3;
  if(safariRailNear(x,z).distance<2.0+size||safariBank(x,z)<2.5||!safariLodgeClear(x,z,size)||safariWalkDistance(x,z)<1+size||Math.abs(safariSurface(x+.6,z)-safariSurface(x-.6,z))+Math.abs(safariSurface(x,z+.6)-safariSurface(x,z-.6))>1.05)continue;safariRock(b,x,z,size,i+cx);
 }
 for(let i=0;i<130;i++){
  const z=-38+hash(i,607)*76,side=i%2?1:-1,x=safariRiverX(z)+side*(safariRiverWidth(z)+.50+hash(i,608)*.68),y=safariSurface(x,z);
  if(y<SAFARI.water-.05||y>SAFARI.water+1.5)continue;
  for(let k=0;k<4;k++){const dx=(k-1.5)*.07,top=y+.55+hash(i,k)*.60;b.beam([x+dx,y,z],[x+dx+side*.12,top,z+.05],.015,'#7b8951',8,4);if(k%2)b.cylinder(x+dx+side*.12,top,z+.05,.030,.025,.16,'#987e43',8,5);}
 }
 // Low pale sandbars and stones sit at the actual wet-bank contour.
 for(let i=0;i<72;i++){const z=-38+hash(i,632)*76,x=safariRiverX(z)+(i%2?1:-1)*(safariRiverWidth(z)+1.7+hash(i,633)),y=safariSurface(x,z);if(y>SAFARI.water+.1&&safariRailNear(x,z).distance>1.5)b.sphere(x,y+.07,z,.17+hash(i,634)*.24,.13,.21,'#c6b282',4,7,4,true);}
}
// A narrow spring leaves a rocky seep, breaks over the escarpment, and
// follows the finished ground into the river. Material 44 is the native,
// time-driven flowing-water finish; it needs no new shader or frame geometry.
const SAFARI_SPRING=[[10,-14.8],[10,-14],[10,-13],[10,-12],[10.2,-11],[9,-9.2],[6,-7.8],[3,-6.3],[-2,-5.1]];
function safariSpring(b){
 const points=[];
 for(let i=0;i+1<SAFARI_SPRING.length;i++){
  const a=SAFARI_SPRING[i],q=SAFARI_SPRING[i+1],n=Math.ceil(Math.hypot(q[0]-a[0],q[1]-a[1])/.16);
  for(let j=0;j<n;j++)points.push([mix(a[0],q[0],j/n),mix(a[1],q[1],j/n)]);
 }
 points.push(SAFARI_SPRING.at(-1));
 const at=(i,side,lift=0)=>{const p=points[i],a=points[Math.max(0,i-1)],q=points[Math.min(points.length-1,i+1)],length=Math.hypot(q[0]-a[0],q[1]-a[1])||1,x=p[0]+(q[1]-a[1])/length*side,z=p[1]-(q[0]-a[0])/length*side;return[x,Math.max(SAFARI.water,safariSurface(x,z))+.048+lift,z];};
 for(let i=0;i+1<points.length;i++){
  const t=i/(points.length-1),width=.29+.20*Math.sin(t*PI)+.11*Math.sin(t*PI*5)**2;
  b.quad(at(i,-width-.12),at(i+1,-width-.12),at(i+1,width+.12),at(i,width+.12),'#546e54',3);
  b.quad(at(i,-width,.025),at(i+1,-width,.025),at(i+1,width,.025),at(i,width,.025),'#6ca492',44);
  for(let k=0;k<5;k++){
   const side=(k-2)*width*.33+.035*Math.sin(i*.18+k),thin=(k===2?.043:.016)*(1+.5*Math.sin(i*.29+k));
   b.quad(at(i,side-thin,.040),at(i+1,side-thin,.040),at(i+1,side+thin,.040),at(i,side+thin,.040),k===2?'#d7e1ba':'#abcbb2',44);
  }
 }
 // The rock mouth explains the source; wetted ledges and ferns frame the fall.
 for(const side of[-1,1]){
  safariRock(b,10+side*.70,-14.88,.83,720+side);
  for(const z of[-12.4,-10.6]){
   const x=10.4+side*.87,y=safariSurface(x,z);b.sphere(x,y+.11,z,.42,.20,.34,'#71806b',3,9,5,true);
   for(let k=0;k<5;k++){const angle=k*TAU/5,xx=x+Math.cos(angle)*.35,zz=z+Math.sin(angle)*.35,base=safariSurface(xx,zz);b.tri([xx-.07,base,zz],[xx+.13,base+.62,zz+.11],[xx+.08,base,zz],'#62824b',8);}
  }
 }
}
function safariBeam(b){
 const edge=SAFARI_ROUTE,point=(a,side,dy)=>add(add(a.p,mul(norm([a.f[2],0,-a.f[0]]),side)),[0,dy,0]);
 for(let d=0;d<edge.length;d+=.48){const a=edge.at(d),q=edge.at(Math.min(edge.length,d+.48));
  b.quad(point(a,-.28,0),point(q,-.28,0),point(q,.28,0),point(a,.28,0),'#d9c9a3',3);
  for(const s of[-1,1]){b.quad(point(a,s*.28,0),point(a,s*.28,-.72),point(q,s*.28,-.72),point(q,s*.28,0),s>0?'#bba880':'#9f906f',3);b.quad(point(a,s*.286,-.19),point(q,s*.286,-.19),point(q,s*.286,-.25),point(a,s*.286,-.25),'#bfab80',41);}
  b.quad(point(a,-.28,-.72),point(a,.28,-.72),point(q,.28,-.72),point(q,-.28,-.72),'#8f8268',3);
 }
 ribbon(b,edge,.22,0,.012,'#a9a793',41,0,edge.length,.5);
 const river=safariRiverX(28);
 for(let d=0;d<edge.length;d+=6.8){const a=edge.at(d),[x,y,z]=a.p;
  if(Math.abs(z-28)<.1&&Math.abs(x-river)<9.0)continue;
  const ground=safariSurface(x,z),h=y-.75-ground;
  b.matrix(basis([x,ground,z],norm([a.f[0],0,a.f[2]])));
  b.box(0,.12,0,1.24,.40,1.5,'#ac9974',3);b.box(0,.36,0,.91,.12,1.13,'#d1bd95',3);
  b.cylinder(0,(h+.37)/2,0,.32,.22,Math.max(.1,h-.37),'#c6b18a',3,8);
  b.box(0,h-.015,0,1.09,.19,1.30,'#decba5',3);
  for(const s of[-1,1])b.beam([0,Math.max(.45,h-1.55),0],[s*.45,h-.1,0],.10,'#b49d76',3,5);
  // Restrained inspection band, service light and plate on every other pier.
  if(Math.floor(d/6.8)%2===0){b.box(0,h-.31,.675,.28,.11,.055,'#ead29f',6);b.box(.327,.9,0,.025,.27,.28,'#77775b',41);}
  b.pop();
 }
 safariRiverBridge(b,river);
 // Expansion joints are tiny dark seams, not ordinary rail sleepers.
 for(let d=2;d<edge.length;d+=6.8){const a=edge.at(d);b.matrix(basis(a.p,a.f));b.box(0,.018,0,.57,.016,.026,'#6e7362',42);b.pop();}
}
function safariRiverBridge(b,x){
 const z=28,span=10.0,footY=Math.max(safariSurface(x-span,z),safariSurface(x+span,z))+.16,deckY=6.8-.75,top=deckY-.26;
 // Twin under-deck concrete arches keep the view from the train unobstructed.
 for(const side of[-1,1]){
  const zz=z+side*.70,arch=t=>[x-span+2*span*t,footY+(top-footY)*Math.sin(PI*t),zz];
  for(let i=0;i<40;i++)b.beam(arch(i/40),arch((i+1)/40),.19,'#d1b98b',3,6);
  for(let i=0;i<=10;i++){const t=i/10,a=arch(t);b.beam(a,[a[0],deckY,zz],.085,'#beaa7f',3,5);if(i%2===0)b.beam([a[0],deckY,z-.76],[a[0],deckY,z+.76],.11,'#d5bf91',3,5);}
 }
 for(const s of[-1,1]){const xx=x+s*span,ground=safariSurface(xx,z);b.box(xx,(ground+footY+.1)/2,z,1.25,footY+.1-ground,2.4,'#ac9168',3);b.box(xx,footY+.12,z,1.6,.22,2.65,'#ddc698',3);}
 for(const zz of[z-.70,z+.70])b.beam([x-span,deckY,zz],[x+span,deckY,zz],.11,'#b49c70',3,5);
}
function safariRailings(b,points,h=.70,color='#7f6c49'){
 for(let i=0;i+1<points.length;i++){
  const a=points[i],q=points[i+1],n=Math.ceil(len(sub(q,a))/1.2);
  for(let k=0;k<=n;k++){const p=lerpV(a,q,k/n);b.beam(p,add(p,[0,h,0]),.035,color,41,5);}
  for(const y of[.26,h])b.beam(add(a,[0,y,0]),add(q,[0,y,0]),y===h?.037:.018,color,41,5);
 }
}
function safariCanopy(b,x,y,z,w=16,d=4.5){
 const bays=4;
 for(let i=0;i<=bays;i++){
  const xx=x-w/2+i*w/bays;b.beam([xx,y,z+d*.34],[xx,y+2.94,z+d*.34],.062,'#7e6745',22,6);
  for(let j=0;j<8;j++){const p=v=>[xx,y+2.68+.52*Math.sin(v*PI),z-d/2+v*d];b.beam(p(j/8),p((j+1)/8),.050,'#7e6745',22,6);}
 }
 for(let i=0;i<32;i++)for(let j=0;j<8;j++){
  const point=(a,c)=>{const u=a/32,v=c/8,xx=x-w/2+u*w,zz=z-d/2+v*d,yy=y+2.72+.52*Math.sin(v*PI)-.18*Math.sin(u*bays*PI)**2;return[xx,yy,zz];};
  const a=point(i,j),q=point(i+1,j),r=point(i+1,j+1),s=point(i,j+1);b.quad(a,q,r,s,i%8===0?'#b59864':'#e4ce98',23);
 }
 for(const side of[-1,1])b.beam([x-w/2,y+2.73,z+side*d/2],[x+w/2,y+2.73,z+side*d/2],.035,'#a18350',22,6);
 b.beam([x-w/2,y+2.4,z+d*.34],[x+w/2,y+2.4,z+d*.34],.060,'#8b704a',22,6);
}
const SAFARI_RIDGE_PATH=[[.5,-31.15],[2,-31.8],[4,-32]];
function safariLandingHeight(x,z,halfWidth=.9){return Math.max(...[-halfWidth,0,halfWidth].map(dz=>safariSurface(x,z+dz)))+.05;}
function safariStation(b,{x,z,rail,name,flip=false}){
 const side=flip?-1:1,y=rail+.64,cz=z+side*3.15,w=20,d=4.6;
 for(const dx of[-8.8,-3,3,8.8])for(const dz of[-1.8,1.8]){
  const xx=x+dx,zz=cz+dz,ground=safariSurface(xx,zz);b.box(xx,ground+.10,zz,.82,.28,.82,'#a48d64',4);b.box(xx,(ground+y-.20)/2,zz,.28,Math.max(.1,y-.20-ground),.28,'#8d7956',4);
 }
 b.box(x,y-.20,cz,w,.4,d,'#ac9470',4);
 for(let i=0;i<50;i++)b.box(x-w/2+.20+i*.4,y+.035,cz,.384,.070,d-.12,i%3?'#bdaa7d':'#d0bc8e',22);
 b.box(x,y+.07,z+side*.87,w,.065,.12,'#e8d29e',23);
 for(let i=0;i<40;i++)b.box(x-w/2+.2+i*.50,y+.076,z+side*1.02,.20,.016,.06,'#b89953',41);
 safariCanopy(b,x+.8,y,cz,16.7,4.5);
 safariRailings(b,[[x-10,y,cz+side*2.22],[x+10,y,cz+side*2.22]]);
 const closedEnd=x+(flip?10:-10);safariRailings(b,[[closedEnd,y,z+side*1.08],[closedEnd,y,cz+side*2.22]]);
 for(const xx of[x-5.2,x+2.8]){bench(b,xx,y+.075,cz+side*.5,flip?PI:0);houseLamp(b,xx,y+.07,cz+side*1.5,1.8);}
 b.push(x,y+2.06,cz+side*1.67,0,flip?PI:0);b.box(0,0,0,7.9,.67,.12,SAFARI_PALETTE.jade,40);hudsonText(b,name,0,-.035,.071,7.4,SAFARI_PALETTE.ivory);b.pop();
 // The information kiosk has a shallow pitched cap and recessed field map.
 b.push(x-8.1,y+.07,cz,0,flip?PI:0);b.box(0,.75,0,.92,1.5,.4,'#64785c',22);b.box(0,1.06,.215,.73,.62,.055,'#d8c694',23);
 for(let i=0;i<5;i++)b.beam([-.28,1.27-i*.1,.248],[.12+(i%2)*.17,1.27-i*.1,.248],.009,'#73856a',0,4);
 b.box(0,1.53,0,1.04,.11,.54,'#9c8153',22);b.pop();
 if(!flip){
  const x0=x+10,x1=x+18,zz=cz+.15,base=safariLandingHeight(x1,zz,1.08),n=32,run=(x1-x0)/n;
  for(let i=0;i<n;i++){const xx=x0+(i+.5)*run,yy=mix(y,base,(i+1)/n);b.box(xx,yy-.055,zz,run+.01,.11,1.85,'#c5ad7c',22);}
  for(const s of[-1,1]){b.beam([x0,y-.20,zz+s*.70],[x1,base-.07,zz+s*.70],.11,'#796548',41,5);safariRailings(b,[[x0,y,zz+s*.88],[x1,base,zz+s*.88]],.73);}
  b.box(x1,base-.05,zz,1.1,.14,2.15,'#bcac81',4);housePath(b,[[x1,zz],[x1-.9,36],[x1-5,38]],.95,safariSurface,'#d2be8b');
 }else{
  const x0=x-10,x1=x-15.5,zz=cz,ground=safariLandingHeight(x1,zz,.85),n=24;
  for(let i=0;i<n;i++){const px=mix(x0,x1,(i+.5)/n),yy=mix(y,ground,(i+1)/n);b.box(px,yy-.065,zz,.24,.13,1.65,'#bca378',22);}
  for(const side of[-1,1]){b.beam([x0,y-.20,zz+side*.62],[x1,ground-.08,zz+side*.62],.09,'#82734d',41,5);safariRailings(b,[[x0,y,zz+side*.80],[x1,ground,zz+side*.80]],.72);}
  housePath(b,SAFARI_RIDGE_PATH,.7,safariSurface,'#c9b385');
 }
}
function safariLookout(b){
 const x=30,z=-8,y=Math.max(...[-3,3].flatMap(dx=>[-2.5,2.5].map(dz=>safariSurface(x+dx,z+dz))))+.75;
 for(const dx of[-2.4,2.4])for(const dz of[-2.1,2.1]){const ground=safariSurface(x+dx,z+dz);b.box(x+dx,(ground+y)/2,z+dz,.19,y-ground,.19,'#7d6342',22);}
 b.push(x,y,z);slab(b,6.6,5.8,.16,-.08,.75,'#bea47a',22);
 for(let i=0;i<17;i++)b.box(-3.05+i*.38,.01,0,.012,.017,4.6,'#83704f',22);
 safariRailings(b,[[-3,0,-2.5],[3,0,-2.5],[3,0,2.5]],.8);
 // Observation scopes and a hand-lettered orientation table. No wildlife props.
 for(const dx of[-1.4,1.3]){b.cylinder(dx,.59,-1.8,.08,.08,1.18,'#b69a61',41,8);b.beam([dx,.92,-1.8],[dx,1.28,-2.25],.085,'#536653',41,10);b.cylinder(dx,1.27,-2.26,.115,.115,.12,'#c4b38c',41,10,PI/2);}
 b.box(-1.45,.71,1.45,2.1,.09,1.05,'#ae966b',22);for(const dx of[-2.25,-.65])b.box(dx,.35,1.45,.065,.70,.55,'#7d6747',22);
 b.push(-1.45,.765,1.45,-PI/2);hudsonText(b,'THE RIFT',0,0,0,1.76,'#4b644d');b.pop();b.pop();
 const endX=x-7,stairZ=z+1.5,low=safariSurface(endX,stairZ);
 for(let i=0;i<14;i++){const xx=x-3.3-(i+.5)*3.7/14,yy=mix(y,low,(i+1)/14);b.box(xx,yy-.05,stairZ,.28,.10,1.15,'#baa076',22);}
 for(const s of[-1,1]){b.beam([x-3.3,y-.13,stairZ+s*.46],[endX,low-.08,stairZ+s*.46],.08,'#806b48',22,5);safariRailings(b,[[x-3.3,y,stairZ+s*.54],[endX,low,stairZ+s*.54]],.7);}
 housePath(b,[[endX,stairZ],[23,-3],[22,2]],.65,safariSurface,'#cbbb89');
}
function safariTable(b){
 b.push(0,0,0);slab(b,117,85,1.6,-5.4,4.5,'#68472f',22);slab(b,117.3,85.3,.15,-4.67,4.65,'#b99660',41);slab(b,117.6,85.6,.15,-6.17,4.7,'#352f24',22);
 for(const x of[-46,46])for(const z of[-30,30]){
  b.cylinder(x,(FLOOR-6.2)/2,z,1.0,.75,-6.2-FLOOR,'#705035',22,8);b.cylinder(x,FLOOR+.24,z,1.05,1.05,.45,'#b49a65',41,8);
 }
 for(const x of[-46,46])b.beam([x,-17,-30],[x,-17,30],.35,'#74543a',22,4);
 b.beam([-46,-17,0],[46,-17,0],.32,'#74543a',22,4);
 b.box(0,-5.42,42.61,30,.80,.10,'#ad905a',41);hudsonText(b,'THE RIFT OBSERVATORY',0,-5.44,42.675,27.5,'#f1ddb0');
 for(const x of[-14.6,14.6])b.sphere(x,-5.42,42.7,.08,.08,.025,'#dfca94',41,6,4);b.pop();
}
function safariSconce(b,x,y,z){
 b.box(x,y,z,.8,4.6,.42,'#b89a64',41);b.beam([x,y-.5,z],[x,y-.5,z+1.6],.13,'#8a6b43',41,8);
 b.box(x,y+.55,z+1.65,1.17,2.2,1.17,'#e4ca90',6);
 for(const dx of[-.66,.66])for(const dz of[-.66,.66])b.beam([x+dx,y-.65,z+1.65+dz],[x+dx,y+1.78,z+1.65+dz],.055,'#765e3c',41,5);
 b.cylinder(x,y+1.95,z+1.65,1.07,.12,.50,'#987846',41,4);
}
function safariWallRelief(b,x,y,z,w,h){
 b.box(x,y,z,w+1.1,h+1.1,.5,'#9c7b50',22);b.box(x,y,z+.29,w,h,.10,'#dfc28e',23);
 // Three actual relief planes create a layered, sunlit geological panorama.
 b.cylinder(x+w*.23,y+h*.18,z+.40,h*.20,h*.20,.06,'#e5aa52',0,48,PI/2);
 for(let layer=0;layer<3;layer++)for(let i=0;i<40;i++){
  const xx=-w/2+i*w/40,q=xx+w/40,top=t=>y-h*.10+layer*-h*.12+Math.sin(t*.16+layer)*h*.11+Math.sin(t*.39-layer)*h*.035,zz=z+.49+layer*.11;
  b.quad([x+xx,y-h/2,zz],[x+q,y-h/2,zz],[x+q,top(q),zz],[x+xx,top(xx),zz],['#b5a077','#929573','#657b62'][layer],0);
 }
 b.box(x,y-h*.41,z+.87,w*.76,.028,.016,'#d9bb81',41);
}
function safariShell(b){
 const walls=[],P=SAFARI_PALETTE;
 b.box(0,FLOOR-.24,0,158,.48,130,'#87633f',21);
 for(let i=0;i<26;i++)for(let j=0;j<13;j++)b.box(-75+i*6,FLOOR+.012,-60+j*10,5.92,.024,9.92,['#a17d50','#957044','#ab8555'][(i+j*3)%3],21);
 // Bound sisal mat, a generous aisle, and bronze inlays around the plinth.
 b.box(0,FLOOR+.045,0,130,.05,104,'#9b966f',23);
 for(const s of[-1,1]){b.box(0,FLOOR+.08,s*50.5,127,.024,.25,'#c9b98a',23);b.box(s*63.5,FLOOR+.08,0,.25,.024,101,'#c9b98a',23);}
 for(const which of['back','left','right','front']){
  const w=new Builder(),wide=which==='back'||which==='front',width=wide?156:128,pos=which==='back'?[0,0,-64]:which==='front'?[0,0,64]:which==='left'?[-78,0,0]:[78,0,0],angle=which==='back'?0:which==='front'?PI:which==='left'?PI/2:-PI/2;
  w.push(...pos,0,angle);w.box(0,5,0,width,58,.65,'#c9bea0',20);w.box(0,-16,.47,width,16,.3,'#64705a',22);
  for(let x=-width/2+4;x<width/2;x+=8){w.box(x,-16,.68,6.6,12.9,.16,'#7c7e5c',22);w.box(x,-16,.78,5.9,12.2,.045,'#5e6952',22);}
  for(const y of[-23.3,-7.9,32.8]){w.box(0,y,.76,width,.70,1.25,P.wood,22);w.box(0,y+.45,.92,width,.11,.72,P.brass,41);}
  for(let x=-width/2+1.6;x<width/2;x+=24){w.box(x,5,1.0,1.75,57,1.65,P.wood,22);w.box(x,5,1.87,.16,56,.08,P.brass,41);}
  if(which==='back'){
   safariWallRelief(w,0,11,1,66,29);
   for(const x of[-52,52]){
    w.box(x,12,1.05,22,32,.40,'#8f7754',22);roomSign(w,'window',x,12,1.30,20,30,0,33);
    for(const dx of[-10,0,10])w.box(x+dx,12,1.60,.5,31,.58,'#ab9369',22);
    for(const yy of[-3,12,27])w.box(x,yy,1.60,21,.5,.58,'#ab9369',22);
    w.box(x,-3.7,2,24,.6,3.0,'#96764e',22);
   }
   const title='house-'+Object.keys(HOUSE_ROOMS).indexOf('safari');
   if(roomLabels[title])roomFrame(w,title,0,28.4,2.1,33,8.15);
   for(const x of[-36,36])safariSconce(w,x,12,1.1);
  }else if(which!=='front'){
   for(const x of[-34,22])safariWallRelief(w,x,12,1.0,34,24);
   for(const x of[-57,-6,50])safariSconce(w,x,9,1.1);
   w.box(0,-20,3.9,94,7.5,7.2,'#807452',22);w.box(0,-15.9,4,96,.7,7.8,'#b7a071',22);
   for(let x=-38;x<43;x+=13)w.box(x,-15.3,4.2,11.9,.58,6.0,'#b9b68c',23);
  }else{
   for(const side of[-1,1]){w.box(side*7,-3,1.1,13,40,.85,P.wood,22);w.box(side*7,1,1.58,10.8,27,.20,'#a6ad89',43);w.cylinder(side*2,-6,2.05,.22,.22,3,'#be9e63',41,10);safariSconce(w,side*22,8,1.0);}
   for(const side of[-1,1])w.beam([side*72,29,9],[0,40,9],.48,'#866744',22,6);
   w.beam([-72,28,9],[72,28,9],.25,'#8d714a',22,4);
   const plaque='house-'+Object.keys(HOUSE_ROOMS).indexOf('safari');if(roomLabels[plaque])roomFrame(w,plaque,0,23.5,1.3,44,10.8);
  }
  w.pop();walls.push({which,mesh:w.mesh()});
 }
 // Glulam roof ribs stay at the room's perimeter, clear of the miniature view.
 for(const z of[-55]){
  for(const s of[-1,1])b.beam([s*72,29,z],[0,40,z],.48,'#866744',22,6);
  b.beam([-72,28,z],[72,28,z],.25,'#8d714a',22,4);
 }
 for(const x of[-41,41])for(const z of[-46,46]){
  b.beam([x,28,z],[x,34,z],.055,'#665239',41,6);b.cylinder(x,27.4,z,2.6,1.9,1.1,'#a08452',23,24);b.cylinder(x,26.82,z,2.45,2.45,.07,'#efd39b',25,24);
  for(let i=0;i<16;i++){const a=i*TAU/16;b.beam([x+Math.cos(a)*2.6,26.9,z+Math.sin(a)*2.6],[x+Math.cos(a)*1.9,27.9,z+Math.sin(a)*1.9],.025,'#775b37',22,4);}
 }
 return walls;
}
function safariRoom(scene,b){
 safariTable(b);safariTerrain(b);safariBeam(b);safariNaturalDetails(b);safariSpring(b);safariHabitatDetails(b);safariLodge(b);
 safariStation(b,{x:-28,z:28,rail:6.8,name:'ACACIA GATE'});
 safariStation(b,{x:16,z:-28,rail:11.2,name:'RIFT LOOKOUT',flip:true});
 scene.routes=[SAFARI_ROUTE];scene.trains=[{edge:SAFARI_ROUTE,distance:44,speed:1.10,type:'mountain',stock:'safari',cars:3}];
 scene.height=(x,z)=>Math.abs(x)<=56&&Math.abs(z)<=40?Math.max(SAFARI.water,safariSurface(x,z)):FLOOR;
 scene.canPlace=()=>false;
 scene.safari={revision:3,lodge:'Kopje House',trees:SAFARI_TREES.length,trackSystem:'straddle-beam',beamWidth:SAFARI.beamWidth,beamDepth:SAFARI.beamDepth};
 scene.spots=[
  {name:'The Rift Observatory',target:[0,5,-1],distance:138,phoneDistance:330,pitch:.60,yaw:.32,detail:'A savanna in miniature. Kopje House opens onto the river, broken escarpments rise behind the railway, and acacia trails lead to the lodge.'},
  {name:'Acacia Gate',target:[-27,7.8,29],distance:32,phoneDistance:62,pitch:.37,yaw:.20,detail:'Linen canopies, timber platforms, and a cream-and-jade panoramic train. The stairs descend to a red-earth walking terrace.'},
  {name:'Across the river',target:[safariRiverX(28),2.5,28],distance:37,phoneDistance:67,pitch:.35,yaw:.30,detail:'Two slender concrete arches carry the single guide beam. The river stays open beneath the railway.'},
  {name:'Acacia country',target:[-28,5.8,6],distance:36,phoneDistance:65,pitch:.35,yaw:-.30,detail:'Flat-topped crowns, branching trunks and long shadows. The train slips behind the trees without cutting through their canopies.'},
  {name:'Rift Lookout',target:[15,11.8,-28],distance:37,phoneDistance:68,pitch:.39,yaw:2.84,detail:'An elevated timber terrace follows a shelf in the escarpment. The line bends around the rock, leaving the panoramic windows open to the view.'},
  {name:'Kopje House',target:[24,7,-.8],distance:36,phoneDistance:65,pitch:.29,yaw:.43,detail:'A stone-and-thatch expedition lodge. Briefings around a reserve map, a field library and radio, a canvas mess fly and a timber observation hide. No pool or rear leisure deck.'},
  {name:'The eastern sweep',target:[42,9,4],distance:40,phoneDistance:72,pitch:.38,yaw:.85,detail:'The monorail climbs on tapered piers, with visible bearings, guide strips and expansion joints.'},
  {name:'The expedition approach',target:[23,5.6,4],distance:26,phoneDistance:48,pitch:.30,yaw:-.58,detail:'An earth path reaches broad stone steps between lanterns. The former leisure terrace has returned to grasses, acacias and riverbank scrub.'}
 ];
}
registerHouseRoom('safari',{
 name:'The Rift Observatory',layout:'The Rift Skyway',tag:'THE LONGER WAY HOME',
 description:'A richly planted savanna, broken escarpments and a winding green river. Visit Kopje House, a rugged stone-and-thatch expedition lodge with a map room, canvas mess fly and observation hide, then follow Solstice around the rift.',
 color:'#c1a26b',ambient:'forest',target:[0,4,-1],distance:149,phoneDistance:342,pitch:.60,yaw:.32,
 trainCollection:false,train:{name:'Solstice',number:'01',service:'The Rift Skyway',type:'panoramic electric monorail',power:'electric'},
 credits:[{name:'nickfromlater',platform:'github',handle:'nickfromlater',note:'Original safari landscape, monorail, and expedition gallery; built with agent assistance.'}],
 map:{plot:'west-4',scale:.40,footprint:[158,130],focus:[0,4,-1]},
 lights:[[-41,26.75,-46],[41,26.75,-46],[-41,26.75,46],[41,26.75,46],[-36,12,-61],[36,12,-61]],
 layoutLights:[[-33.2,9.3,32.65],[-25.2,9.3,32.65],[10.8,13.7,-32.65],[18.8,13.7,-32.65],[23.8,8.2,.25],[12.25,4.0,-.6],[34.45,11.2,-2.2],[24,4.6,5.1]],
 build:safariRoom,shell:safariShell
});
