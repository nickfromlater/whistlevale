'use strict';

// BRIARWATCH. An original limestone castle and estate railway by nickfromlater,
// with agent assistance. Approved whole-room proposal #42. No creature systems.
// Every placement uses the finished, emitted terrain surface. No shared RNG.
const BRIAR={width:124,depth:88,step:.8,water:-2.8,bed:-4.8,rail:3.2,court:12.2};
const BRIAR_COLORS={stone:'#aaa592',light:'#c7bfaa',shadow:'#797c72',slate:'#485862',wood:'#62513b',oak:'#93754d',grass:'#7f8b64',iron:'#343e3b',red:'#873e3e',brass:'#b9a16d'};
const BRIAR_RIDGE=[[-45,-26],[-37,-37],[-22,-39],[-7,-33],[2,-24],[3,-8],[-1,7],[-16,12],[-33,10],[-44,-2]];
const BRIAR_ROAD=[[24,26,2.65],[24,16,2.6],[12,16,2.6],[1,18,2.6],[-13,18,2.6],[-27,20,3.4],[-42,15,6.0],[-43,5,8.0],[-35,9,10.2],[-24,12,11.8],[-24,5,12.2]];
const BRIAR_LEAT=[[10.5,-8.4],[10.5,0],[8.4,1],[6.5,1.2]];
const BRIAR_TUNNEL={x0:-38,x1:-16,z:-33,half:1.65};
const BRIAR_ROUTE=(()=>{
 const p=(x,z)=>[x,BRIAR.rail,z],line=(a,q)=>[a,lerpV(a,q,1/3),lerpV(a,q,2/3),q];
 return new Edge('The Crown & Cinder Line',[
  line(p(-35,31),p(33,31)),
  [p(33,31),p(49,31),p(54,24),p(54,9)],
  [p(54,9),p(54,-7),p(54,-23),p(41,-28)],
  [p(41,-28),p(26,-34),p(15,-33),p(2,-33)],
  line(p(2,-33),p(-37,-33)),
  [p(-37,-33),p(-50,-33),p(-54,-25),p(-54,-10)],
  [p(-54,-10),p(-54,5),p(-54,18),p(-48,25)],
  [p(-48,25),p(-43,31),p(-40,31),p(-35,31)]
 ]);
})();
const BRIAR_RAIL_GRID=(()=>{
 const cells=new Map();for(let d=0;d<BRIAR_ROUTE.length;d+=.35){const a=BRIAR_ROUTE.at(d),key=Math.floor(a.p[0]/6)+','+Math.floor(a.p[2]/6);if(!cells.has(key))cells.set(key,[]);cells.get(key).push(a);}
 return cells;
})();
function briarRailNear(x,z){
 let distance=Infinity,point=null;const ix=Math.floor(x/6),iz=Math.floor(z/6);
 for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++)for(const q of BRIAR_RAIL_GRID.get((ix+i)+','+(iz+j))||[]){const d=Math.hypot(x-q.p[0],z-q.p[2]);if(d<distance){distance=d;point=q.p;}}
 return {distance,point};
}
function briarSegment(x,z,a,q){const dx=q[0]-a[0],dz=q[1]-a[1],t=clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1));return {distance:Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz),t};}
function briarPolygonDistance(x,z,polygon){
 let inside=false,d=Infinity;
 for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
  const a=polygon[i],q=polygon[j];d=Math.min(d,briarSegment(x,z,a,q).distance);
  if((a[1]>z)!==(q[1]>z)&&x<(q[0]-a[0])*(z-a[1])/(q[1]-a[1])+a[0])inside=!inside;
 }
 return (inside?1:-1)*d;
}
function briarRoadNear(x,z){
 let nearest={distance:Infinity,height:0,index:-1};
 for(let i=1;i<BRIAR_ROAD.length;i++){const a=BRIAR_ROAD[i-1],q=BRIAR_ROAD[i],v=briarSegment(x,z,a,q);if(v.distance<nearest.distance)nearest={...v,height:mix(a[2],q[2],v.t),index:i-1};}
 return nearest;
}
function briarRiverX(z){return 4.5-z*.54+2.5*Math.sin(z*.092+.6);}
function briarRiverWidth(z){return 2.8+1.1*Math.exp(-(((z-25)/13)**2))+.35*Math.cos(z*.16);}
function briarBank(x,z){return Math.abs(x-briarRiverX(z))-briarRiverWidth(z);}
function briarInTunnel(x,z,margin=0){return x>BRIAR_TUNNEL.x0-margin&&x<BRIAR_TUNNEL.x1+margin&&Math.abs(z-BRIAR_TUNNEL.z)<BRIAR_TUNNEL.half+margin;}
function briarRawHeight(x,z){
 const bank=briarBank(x,z),sd=briarPolygonDistance(x,z,BRIAR_RIDGE),strata=sd+.24*Math.sin(x*.7+z*.33);
 let h=.9+.30*Math.sin(x*.13+z*.04)+.23*Math.cos(z*.19)+.11*(noise(x*.4,z*.4)-.5);
 h+=3.3*smooth(-7,-2.5,strata)+4.5*smooth(-2.5,.2,strata)+3.4*smooth(.4,2.8,strata);
 h=mix(h,11.85,smooth(2.8,4,sd));
 // Broad woodland shelves and the town's modest building terrace.
 h+=1.45*Math.exp(-((x-40)**2/120+(z+16)**2/260));
 const town=(1-smooth(17,21,Math.abs(x-29)))*(1-smooth(15,19,Math.abs(z-7)));
 h=mix(h,2.32,town);
 h=mix(BRIAR.bed,h,smooth(-.45,3.6,bank));
 // The mill race has a cut bed and an outlet that rejoins the river.
 let leat=Infinity;for(let i=1;i<BRIAR_LEAT.length;i++)leat=Math.min(leat,briarSegment(x,z,BRIAR_LEAT[i-1],BRIAR_LEAT[i]).distance);
 if(leat<1.4)h=mix(Math.min(h,BRIAR.water-1.2),h,smooth(.66,1.4,leat));
 // Roads are shaped into the land, except across the real river bridge.
 const road=briarRoadNear(x,z);
 if(bank>1.0&&road.distance<3.5)h=mix(h,road.height-.10,1-smooth(1.35,3.5,road.distance));
 // A short dry ditch stays open below the castle's timber drawbridge.
 if(x>-29&&x<-19&&z>7.1&&z<10.4)h-=1.8*Math.sin((z-7.1)/3.3*PI)*smooth(-29,-27,x)*(1-smooth(-21,-19,x));
 const rail=briarRailNear(x,z);
 if(rail.distance<3.2&&bank>1.2&&!briarInTunnel(x,z,1.2))h=mix(h,BRIAR.rail-.245,1-smooth(1.75,3.2,rail.distance));
 // Railway shoulder remains a rock roof rather than a clipped green tunnel.
 if(briarInTunnel(x,z,.25))h=Math.max(h,BRIAR.rail+3.6);
 return h;
}
const BRIAR_GRID={nx:Math.ceil(BRIAR.width/BRIAR.step),nz:Math.ceil(BRIAR.depth/BRIAR.step)};
BRIAR_GRID.dx=BRIAR.width/BRIAR_GRID.nx;BRIAR_GRID.dz=BRIAR.depth/BRIAR_GRID.nz;
const BRIAR_HEIGHT_CACHE=new Map();
function briarGridHeight(ix,iz){const key=iz*(BRIAR_GRID.nx+1)+ix;if(!BRIAR_HEIGHT_CACHE.has(key))BRIAR_HEIGHT_CACHE.set(key,briarRawHeight(-BRIAR.width/2+ix*BRIAR_GRID.dx,-BRIAR.depth/2+iz*BRIAR_GRID.dz));return BRIAR_HEIGHT_CACHE.get(key);}
function briarSurface(x,z){
 const g=BRIAR_GRID,ix=clamp(Math.floor((x+62)/g.dx),0,g.nx-1),iz=clamp(Math.floor((z+44)/g.dz),0,g.nz-1),u=clamp((x+62-ix*g.dx)/g.dx),v=clamp((z+44-iz*g.dz)/g.dz);
 const a=briarGridHeight(ix,iz),r=briarGridHeight(ix+1,iz),f=briarGridHeight(ix,iz+1),q=briarGridHeight(ix+1,iz+1);
 return u+v<=1?a+(r-a)*u+(f-a)*v:q+(f-q)*(1-u)+(r-q)*(1-v);
}
function briarGroundColor(x,y,z,n){
 const patch=.5+.24*Math.sin(x*.11+Math.sin(z*.08)*2)+.16*Math.cos(z*.16-x*.045);
 let c=lerpV(col('#657d61'),col('#a5aa79'),clamp(patch));
 c=lerpV(c,col('#ada994'),smooth(.10,.37,1-n[1])*.87);
 c=lerpV(c,col('#b4aa8c'),(1-smooth(1.25,2.1,briarRoadNear(x,z).distance))*.65);
 if(y<BRIAR.water+.7)c=lerpV(col('#566761'),col('#9ba08a'),smooth(BRIAR.bed,BRIAR.water+.7,y));
 return c;
}
function briarTerrain(b){
 const g=BRIAR_GRID,verts=[],normals=[],colors=[];
 for(let j=0;j<=g.nz;j++)for(let i=0;i<=g.nx;i++){
  const x=-62+i*g.dx,z=-44+j*g.dz,y=briarGridHeight(i,j),n=norm([briarRawHeight(x-.18,z)-briarRawHeight(x+.18,z),.36,briarRawHeight(x,z-.18)-briarRawHeight(x,z+.18)]);
  verts.push([x,y,z]);normals.push(n);colors.push(briarGroundColor(x,y,z,n));
 }
 const water=points=>{
  const out=[];for(let i=0;i<points.length;i++){const a=points[i],q=points[(i+1)%points.length],inside=a[1]<BRIAR.water,next=q[1]<BRIAR.water;if(inside)out.push(a);if(inside!==next)out.push(lerpV(a,q,(BRIAR.water-a[1])/(q[1]-a[1])));}
  for(let i=1;i+1<out.length;i++)for(const p of[out[0],out[i],out[i+1]])b.vertex([p[0],BRIAR.water+.009,p[2]],[0,1,0],lerpV(col('#355b58'),col('#83998b'),smooth(-2.2,.55,briarBank(p[0],p[2]))),7);
 };
 for(let j=0;j<g.nz;j++)for(let i=0;i<g.nx;i++){
  const a=j*(g.nx+1)+i;for(const ids of[[a,a+g.nx+1,a+1],[a+1,a+g.nx+1,a+g.nx+2]]){
   const mid=mul(ids.map(k=>verts[k]).reduce(add),1/3),face=norm(cross(sub(verts[ids[1]],verts[ids[0]]),sub(verts[ids[2]],verts[ids[0]])));
   if(briarInTunnel(mid[0],mid[2],.20)&&mid[1]<BRIAR.rail+3.15)continue;
   for(const k of ids)b.vertex(verts[k],face[1]<.76?norm(lerpV(normals[k],face,.5)):normals[k],colors[k],face[1]<.76?86:88);
   water(ids.map(k=>verts[k]));
  }
 }
 // Exposed scenic cross-sections meet the cabinet; no hanging turf curtains.
 for(const side of[-1,1])for(const alongX of[true,false]){
  const n=alongX?g.nx:g.nz,step=alongX?g.dx:g.dz,half=alongX?62:44;
  for(let i=0;i<n;i++){
   const t=-half+i*step,q=t+step,a=alongX?[t,side*44]:[side*62,t],r=alongX?[q,side*44]:[side*62,q];
   b.quad([a[0],-6.8,a[1]],[r[0],-6.8,r[1]],[r[0],briarSurface(...r),r[1]],[a[0],briarSurface(...a),a[1]],'#7c7968',86);
   if(briarSurface(...a)<BRIAR.water&&briarSurface(...r)<BRIAR.water)b.quad([a[0],briarSurface(...a),a[1]],[r[0],briarSurface(...r),r[1]],[r[0],BRIAR.water,r[1]],[a[0],BRIAR.water,a[1]],'#4c7069',7);
  }
 }
}
function briarTable(b){
 b.box(0,-8.65,0,126,3.6,90,'#415348',22);b.box(0,-6.77,0,126.5,.25,90.5,'#8a7352',22);
 b.box(0,-10.45,0,126.5,.20,90.5,'#9c8057',22);
 for(const x of[-55,55])for(const z of[-37,37]){
  b.box(x,(FLOOR-10.5)/2,z,3.7,-10.5-FLOOR,3.7,'#68543b',22);b.box(x,FLOOR+.4,z,4.3,.8,4.3,'#4c4334',22);
  b.beam([x,-12,z],[x-Math.sign(x)*8,-10.2,z],.55,'#715b3e',22,4);
 }
 for(const z of[-45.08,45.08])for(let x=-56;x<=56;x+=16){b.box(x,-8.7,z,14.2,2.5,.07,'#34473e',22);b.box(x,-7.43,z,14.4,.08,.10,'#aa9366',41);}
 b.box(0,-8.65,45.18,29,2.15,.12,'#b29b6b',41);
 const plaque='house-'+Object.keys(HOUSE_ROOMS).indexOf('briarwatch');if(roomLabels[plaque])roomSign(b,plaque,0,-8.65,45.27,28,1.95);
 for(const x of[-14.1,14.1])for(const y of[-9.48,-7.82])b.sphere(x,y,45.3,.08,.08,.035,'#e1cca0',41,6,4);
}
function briarRailway(b){
 createRail(b,BRIAR_ROUTE);
 // Five structurally closed arches, with true voids and buried spread footings.
 const start=-29,end=4,n=5,span=(end-start)/n,top=BRIAR.rail-.22,r=2.47,spring=top-r-.42,z=31;
 for(let i=0;i<n;i++){
  const x=start+(i+.5)*span;b.push(x,0,z);
  briarArcadeBay(b,span,top,2.28,r,spring,BRIAR.bed-.45,BRIAR_COLORS.stone);
  for(const s of[-1,1]){
   const px=x+s*span/2,ground=briarSurface(px,z),foot=Math.min(ground,spring-.6);
   b.box(s*span/2,(foot+spring)/2,0,1.12,Math.max(.15,spring-foot),2.6,'#939588',4);
   b.box(s*span/2,foot-.14,0,1.65,.50,3.1,'#8b8d80',4);
   // Tapered upstream cutwater noses, not piers ending at the water surface.
   b.tri([s*span/2-.48,foot,1.27],[s*span/2+.48,foot,1.27],[s*span/2,foot,2.2],'#8c9387',4);
   b.quad([s*span/2-.48,foot,1.27],[s*span/2,foot,2.2],[s*span/2,spring-.2,1.55],[s*span/2-.48,spring-.2,1.27],'#999d8d',4);
   b.quad([s*span/2,foot,2.2],[s*span/2+.48,foot,1.27],[s*span/2+.48,spring-.2,1.27],[s*span/2,spring-.2,1.55],'#999d8d',4);
  }
  b.pop();
 }
 for(const side of[-1,1]){
  b.box((start+end)/2,BRIAR.rail+.23,z+side*1.08,end-start,.70,.28,'#b5ae99',4);
  b.box((start+end)/2,BRIAR.rail+.64,z+side*1.08,end-start+.3,.16,.37,'#ccc2a7',4);
 }
 // The rear tunnel has actual intrados, sidewalls and two deep portals.
 for(const [x,angle]of[[BRIAR_TUNNEL.x0,PI/2],[BRIAR_TUNNEL.x1,-PI/2]]){
  b.push(x,BRIAR.rail-.2,-33,0,angle);briarArchWall(b,7.4,6.2,1.3,3.4,1.52,'#999b8c',.29);
  for(const side of[-1,1]){b.box(side*3.3,2.3,0,1.0,4.6,1.8,'#999789',4);b.box(side*3.3,4.8,0,1.2,.35,2.0,'#b4ae99',4);}
  b.box(0,6.35,0,7.8,.32,1.8,'#bcb49e',4);b.pop();
 }
 const {x0,x1}=BRIAR_TUNNEL;
 for(const side of[-1,1])b.box((x0+x1)/2,BRIAR.rail+.7,-33+side*1.64,x1-x0,1.8,.24,'#494e49',4);
 for(let i=0;i<20;i++){
  const a=i*PI/20,q=(i+1)*PI/20,pt=(x,t)=>[x,BRIAR.rail+1.45+Math.sin(t)*1.72,-33+Math.cos(t)*1.72];
  b.quad(pt(x0,a),pt(x1,a),pt(x1,q),pt(x0,q),'#545952',4);
 }
}
function briarRoads(b){
 for(let i=1;i<BRIAR_ROAD.length;i++){
  const a=BRIAR_ROAD[i-1],q=BRIAR_ROAD[i],n=Math.ceil(Math.hypot(q[0]-a[0],q[1]-a[1])/.55),f=norm([q[0]-a[0],0,q[1]-a[1]]),r=[f[2],0,-f[0]],width=i===10?1.62:1.25;
  for(let k=0;k<n;k++){
   const t=k/n,v=(k+1)/n,x=mix(a[0],q[0],t),z=mix(a[1],q[1],t),xx=mix(a[0],q[0],v),zz=mix(a[1],q[1],v);
   if(briarBank((x+xx)/2,(z+zz)/2)<1.1||((z+zz)/2>7.1&&(z+zz)/2<10.4&&x>-29&&x<-19))continue;
   const pt=(px,pz,s)=>[px+r[0]*s,briarSurface(px+r[0]*s,pz+r[2]*s)+.045,pz+r[2]*s];
   b.quad(pt(x,z,-width),pt(xx,zz,-width),pt(xx,zz,width),pt(x,z,width),i>6?'#b1a791':'#b4ab8d',9);
   if(k%2===0&&i>5)for(const s of[-1,1]){const p=pt(x,z,s*(width+.07));b.box(p[0],p[1]+.045,p[2],.28,.13,.32,'#969781',4);}
  }
 }
 // A separate low road bridge connects the town to the ascending old road.
 const x=briarRiverX(18),span=11.4,top=2.56;
 b.push(x,0,18);briarArcadeBay(b,span,top,3.3,4.25,top-4.25-.30,BRIAR.bed-.2,'#a39f8c');
 b.box(0,top+.13,0,span+.7,.25,3.75,'#b3aa91',9);
 for(const s of[-1,1]){b.box(0,top+.48,s*1.76,span+.3,.58,.25,'#a5a18a',4);b.box(0,top+.81,s*1.76,span+.5,.13,.35,'#c4b99e',4);}
 b.pop();
 // Heavy drawbridge planks span the dry ditch beneath the gate passage.
 for(let i=0;i<17;i++){
  const z=6+i*.31,y=12.14-(z-6)*.062;b.box(-24,y-.12,z,3.75,.22,.30,i%4?'#8c7350':'#786445',22);
 }
 for(const x of[-25.45,-22.55])b.beam([x,11.7,6],[x,11.36,11.1],.15,'#5d503d',22,4);
 for(const x of[-25.7,-22.3]){b.beam([x,16.8,5.8],[x,12.0,10.6],.029,'#484d43',42,6);b.beam([x,12,7],[x,11.7,10.8],.047,'#736247',22,5);}
}
// Each tree is built from a branching skeleton and individually shaped crowns.
const BRIAR_TREES=[
 [-41,24,7.8,'oak'],[-35,22,5.2,'beech'],[-48,3,5.5,'beech'],[-46,-16,6,'pine'],[-49,-22,4.8,'pine'],
 [37,-19,7.0,'oak'],[43,-21,8.1,'pine'],[46,-18,6.9,'pine'],[45,-13,6.0,'beech'],[39,-12,5.6,'beech'],[34,-23,5.4,'pine'],[30,-21,4.7,'beech'],[47,-5,6.2,'oak'],[41,-3,5.3,'beech'],
 [13,-13,5.5,'willow'],[5,5,5.8,'willow'],[-13,24,4.7,'willow'],[-25,37,5.6,'willow'],[-33,38,6.4,'oak'],
 [15,-23,4.8,'beech'],[19,-25,6.2,'pine'],[25,-26,5.1,'pine'],[8,36,5.4,'oak'],[45,22,7.7,'oak'],[49,16,4.4,'beech'],
 [31,19,3.9,'apple'],[36,20,4.1,'apple'],[40,19,3.7,'apple'],[33,24,3.6,'apple'],[39,24,3.8,'apple'],
 [-53,36,5.5,'dead'],[56,-31,5.7,'pine'],[51,-35,4.8,'beech'],[-9,-40,4.1,'beech']
];
function briarTree(b,x,z,h,kind='oak'){
 const y=briarSurface(x,z),id=x*3+z,lean=.30*Math.sin(id),trunk=h*(kind==='pine'?.66:.43),bark=kind==='beech'?'#8a8b76':'#716851';
 const root=[x,y-.14,z],fork=[x+lean,y+trunk,z+.22];b.beam(root,fork,h*.042,bark,22,7);
 for(let i=0;i<5;i++){const a=i*TAU/5+.4,p=[x+Math.cos(a)*h*.17,0,z+Math.sin(a)*h*.15];p[1]=briarSurface(p[0],p[2])+.04;b.beam([x,y+.34,z],p,h*.023,bark,22,5);}
 if(kind==='pine'){
  for(let k=0;k<5;k++){
   const yy=y+h*(.29+k*.125),r=h*(.24-k*.032),count=9;
   for(let j=0;j<count;j++){
    const a=j*TAU/count,q=(j+1)*TAU/count,rr=r*(.85+.22*hash(j+k,id));
    b.tri([x+lean*.6,yy+h*.31,z+.15],[x+Math.cos(a)*rr,yy,z+Math.sin(a)*rr],[x+Math.cos(q)*rr,yy,z+Math.sin(q)*rr],['#486956','#55735a','#647f60'][(j+k)%3],8);
   }
  }return;
 }
 const count=kind==='dead'?5:kind==='willow'?7:6;
 for(let i=0;i<count;i++){
  const a=i*2.4+id*.2,r=h*(.19+.10*hash(i,id)),end=[x+Math.cos(a)*r+lean,y+h*(.64+.16*hash(i,id+4)),z+Math.sin(a)*r],mid=lerpV(fork,end,.48);mid[1]-=.16;
  b.beam(fork,mid,h*.023,bark,22,5);b.beam(mid,end,h*.013,bark,22,5);
  if(kind==='dead'){
   b.beam(mid,add(end,[.6,.5,-.1]),h*.010,bark,22,5);continue;
  }
  const c=kind==='apple'?['#788a54','#8c985d','#637b50'][i%3]:kind==='willow'?['#7c956e','#93a780','#69856a'][i%3]:['#627d58','#839365','#718962'][i%3];
  b.sphere(...end,h*.22,h*(kind==='willow'?.17:.23),h*.21,c,8,8,5,true);
  for(let j=0;j<2;j++){const aa=a+j*2.3;b.sphere(end[0]+Math.cos(aa)*h*.16,end[1]-.28,end[2]+Math.sin(aa)*h*.14,h*.15,h*.17,h*.14,shade(c,.94+j*.07),8,7,4,true);}
  if(kind==='willow')for(let j=0;j<5;j++){
   const aa=a+j*1.26,dx=Math.cos(aa)*h*.17,dz=Math.sin(aa)*h*.17,p=[end[0]+dx,end[1],end[2]+dz],q=[p[0]+dx*.25,p[1]-h*(.22+.11*hash(j,i)),p[2]+dz*.3];
   b.quad(add(p,[-.10,0,0]),add(q,[-.03,0,0]),add(q,[.03,0,0]),add(p,[.10,0,0]),shade(c,.85),8);
  }
  if(kind==='apple'&&i%2===0)for(let k=0;k<3;k++)b.sphere(end[0]+Math.cos(k*2.1)*.43,end[1]-.38,end[2]+Math.sin(k*2.1)*.5,.10,.11,.10,'#a75f40',23,6,4);
 }
}
function briarRock(b,x,z,s=1){
 const y=briarSurface(x,z);b.push(x,y-.12,z,.08*Math.sin(x),hash(x,z)*TAU,0,s,s,s);
 b.sphere(0,.19,0,.78,.43,.65,'#a8a895',86,7,4,true);b.pop();
}
function briarNature(b){
 for(const [x,z,h,kind]of BRIAR_TREES)briarTree(b,x,z,h,kind);
 for(let i=0;i<125;i++){
  const z=-40+hash(i,111)*80,x=briarRiverX(z)+(i%2?1:-1)*(briarRiverWidth(z)+.3+hash(i,57)*1.3);
  if(briarRailNear(x,z).distance<2.15||briarRoadNear(x,z).distance<2.2)continue;
  const y=briarSurface(x,z);if(y>1.1||y<BRIAR.water-.1)continue;
  for(let j=0;j<3;j++){
   const a=j*2.6+i,h=.38+hash(j,i)*.75,xx=x+Math.cos(a)*.17,zz=z+Math.sin(a)*.17;
   b.beam([xx,y,zz],[xx+.08,y+h,zz+.1],.015,'#718463',8,4);
   b.tri([xx,y+.13,zz],[xx+.19,y+h*.68,zz+.1],[xx+.05,y+.2,zz],'#87966d',8);
   if(j===1)b.cylinder(xx+.08,y+h,zz+.1,.028,.023,.17,'#675f43',23,5);
  }
 }
 for(let i=0;i<290;i++){
  const x=-58+hash(i,443)*116,z=-41+hash(i,772)*82,y=briarSurface(x,z);
  if(y<.3||briarRailNear(x,z).distance<2||briarRoadNear(x,z).distance<2.6||briarPolygonDistance(x,z,BRIAR_RIDGE)>-2||(x>9&&x<45&&z>-13&&z<27))continue;
  if(i%6===0){briarRock(b,x,z,.4+hash(i,32)*1.1);continue;}
  for(let j=0;j<3;j++){const a=i+j*2.2,h=.14+hash(i,j)*.24;b.tri([x-.05,y,z],[x+Math.sin(a)*.20,y+h,z+Math.cos(a)*.14],[x+.05,y,z],i%2?'#a8ad7e':'#8b9d71',8);}
 }
 // Rock ledges follow the final ridge; the facade does not float above it.
 for(const [x,z,s]of[[-40,-8,2.2],[-42,-17,1.9],[-36,-29,1.4],[-8,-26,2.1],[-3,-17,2.2],[-2,-6,2.0],[-7,7,1.6],[-15,10,1.3]])briarRock(b,x,z,s);
 // A small abandoned wall and fallen oak reward the quiet western orbit.
 for(let i=0;i<12;i++){const x=-47+i*.58,z=31.8+.1*Math.sin(i);b.box(x,briarSurface(x,z)+.25,z,.58,.48,.64,i%3?'#979986':'#b0ab95',4);}
 const a=[-40,briarSurface(-40,37)+.3,37],q=[-35,briarSurface(-35,39)+.4,39];b.beam(a,q,.31,'#74694e',22,9);b.beam(lerpV(a,q,.6),[-37,1.3,41],.12,'#74694e',22,6);
}
function briarShell(b){
 const walls=[];b.box(0,FLOOR-.25,0,158,.45,130,'#8d7756',21);
 // Low furniture stays away from the landscape's sight lines.
 b.box(-64,-18,-53,19,1.0,8,'#775f43',22);
 for(const x of[-71,-57])for(const z of[-56,-50])b.box(x,-21,z,.6,6,.6,'#6f583e',22);
 b.box(-63,-17.25,-53,7,.36,4.8,'#d8c9a6',23);b.push(-63,-17.02,-53,-PI/2);roomSign(b,'blueprint',0,0,0,6.8,4.5);b.pop();
 for(const which of['back','left','right','front']){
  const w=new Builder(),back=which==='back',front=which==='front',width=back||front?156:128,pos=back?[0,0,-64]:front?[0,0,64]:which==='left'?[-78,0,0]:[78,0,0],angle=back?0:front?PI:which==='left'?PI/2:-PI/2;
  w.push(...pos,0,angle);w.box(0,13,0,width,74,.6,'#c3b99d',20);w.box(0,-16,.45,width,16,.6,'#45574b',22);
  for(let x=-width/2+5;x<width/2;x+=12){w.box(x,-16,.82,.2,14,.2,'#957e57',22);w.box(x,14,.82,.65,59,.6,'#786347',22);}
  for(const y of[-23.2,-8,43])w.box(0,y,.8,width,.5,.8,'#927a53',22);
  if(back){
   for(const x of[-42,42]){
    roomSign(w,'window',x,18,.84,21,29,0,33);
    for(const dx of[-10.6,0,10.6])w.box(x+dx,18,1.0,.48,29.6,.8,'#b4a17a',22);
    for(const y of[3.1,18,32.9])w.box(x,y,1,22,.55,.8,'#baa984',22);
    archRing(w,x,33,1.0,10.5,11.3,.8,'#a79978',20);
   }
   const key='house-'+Object.keys(HOUSE_ROOMS).indexOf('briarwatch');if(roomLabels[key])roomFrame(w,key,0,33,1,42,10);
  }else if(!front){roomFrame(w,'blueprint',-29,11,1,23,18);roomFrame(w,'slow',29,10,1,14,20);}
  if(front){w.box(0,-3,1,19,42,1,'#756044',22);w.box(0,-3,1.6,16,39,.2,'#42554a',22);w.cylinder(6,-4,1.95,.35,.35,.5,'#c3a977',41,14,PI/2);roomFrame(w,'shop-sign',0,24,1,35,8);}
  // Roof fittings follow their wall's native cutaway instead of bisecting the miniature.
  if(back||front){
   const z=back?15:18,lampZ=back?19:20;
   w.beam([-77,43,z],[77,43,z],.50,'#755d3f',22,4);
   for(const x of[-68,68])w.beam([x,35,z],[x-Math.sign(x)*11,43,z],.40,'#886d48',22,4);
   for(const x of[-44,44]){
    w.beam([x,43,lampZ],[x,46,lampZ],.045,'#5b5141',41,6);w.cylinder(x,42.5,lampZ,2.9,1.3,1.1,'#a48e61',41,20);w.cylinder(x,41.93,lampZ,2.65,2.65,.07,'#f0dcb0',25,20);
   }
  }
  w.pop();walls.push({which,mesh:w.mesh()});
 }
 return walls;
}
function briarwatchRoom(scene,b){
 briarTable(b);briarTerrain(b);briarRailway(b);briarRoads(b);briarCastle(b);briarVillage(scene,b);briarNature(b);
 scene.routes=[BRIAR_ROUTE];scene.trains=[{edge:BRIAR_ROUTE,distance:42,speed:.85,type:'steam',stock:'coast',cars:3}];
 scene.height=(x,z)=>Math.abs(x)<=62&&Math.abs(z)<=44?Math.max(BRIAR.water,briarSurface(x,z)):FLOOR;
 scene.canPlace=()=>false;
 scene.briarwatch={revision:1,castle:'Briarwatch',railway:'The Crown & Cinder Line',villageBuildings:8,trees:BRIAR_TREES.length};
 scene.spots=[
  {name:'Briarwatch Castle',target:[-7,10,-3],distance:143,phoneDistance:410,phonePitch:.74,phoneYaw:.12,pitch:.55,yaw:.40,detail:'A limestone fortress above a river, a small working town, and the Crown & Cinder train taking the long way around.'},
  {name:'The old keep',target:[-27,26,-19],distance:44,phoneDistance:77,pitch:.34,yaw:-.65,detail:'Deep-set windows, a weathered stair turret and layered slate roofs. The oldest masonry grows straight out of the ridge.'},
  {name:'Through the gate',target:[-24,15,6],distance:33,phoneDistance:61,pitch:.30,yaw:.15,detail:'A timber drawbridge crosses the dry ditch. Iron-bound doors and a raised portcullis frame the sheltered courtyard beyond.'},
  {name:'The sheltered courtyard',target:[-22,14,-7],distance:37,phoneDistance:67,pitch:1.04,yaw:-.15,detail:'A well, covered walks, kitchen steps and a little herb garden connect the great hall to the keep.'},
  {name:'The river gallery',target:[-5,20,-10],distance:36,phoneDistance:63,pitch:.30,yaw:1.34,detail:'An oak gallery hangs on substantial braces above the gorge. Warm hall windows sit beneath the long slate roof.'},
  {name:'Crown & Cinder viaduct',target:[-13,3,30],distance:49,phoneDistance:91,pitch:.22,yaw:.18,detail:'Five stone arches carry the steam train across the river. Cutwater piers meet the streambed, and the castle rises behind.'},
  {name:'The lower town',target:[27,5,7],distance:46,phoneDistance:81,pitch:.46,yaw:.53,detail:'The inn, bakery and smithy gather along a crooked lane. Every gable and little working yard has a different purpose.'},
  {name:'The mill leat',target:[11.5,1.7,-3.5],distance:21,phoneDistance:40,pitch:.42,yaw:-.30,detail:'A timber mill, a stone-lined watercourse and an undershot wheel at the edge of the willow bank.'},
  {name:'The orchard station',target:[24,4,28],distance:35,phoneDistance:62,pitch:.33,yaw:.46,detail:'Luggage beneath a timber canopy, a short path into town, and apple trees beyond the platform.'},
  {name:'The western road',target:[-38,7,15],distance:43,phoneDistance:76,pitch:.38,yaw:-.82,detail:'A worn approach climbs around the ridge, passing an ancient spreading oak before finding the castle gate.'},
  {name:'The estate gallery',target:[0,5,-1],distance:172,phoneDistance:420,phonePitch:1.1,phoneYaw:PI/2,pitch:.51,yaw:.35,detail:'Oak beams, plaster walls, brass exhibition lamps and a deep walnut-and-green cabinet. A complete miniature world, held in a quiet room.'}
 ];
}
registerHouseRoom('briarwatch',{
 name:'Briarwatch Castle',layout:'The Crown & Cinder Line',tag:'STONE, STEAM & STORY',
 description:'A storied limestone castle above a river gorge. Follow a little steam train past an inhabited town, a watermill, orchards and five stone arches.',
 color:'#9b9a7b',ambient:'forest',target:[-7,10,-3],distance:147,phoneDistance:410,pitch:.55,yaw:.40,
 credits:[{name:'nickfromlater',platform:'github',handle:'nickfromlater',note:'Original Briarwatch castle, village, terrain and exhibition room, with agent assistance. Native Whistlevale geometry; no external model assets.'}],
 map:{plot:'west-5',scale:.40,footprint:[158,130],focus:[-7,10,-3]},
 lights:[[-44,41.9,-45],[44,41.9,-45],[-44,41.9,44],[44,41.9,44],[-42,17,-62],[42,17,-62]],
 layoutLights:[[-28,17.8,5.9],[-20,17.8,5.9],[-9,19,-9],[-21,14,-7],[20,5,8],[32,4.8,8],[24,5.7,27],[10,2.4,-3]],
 build:briarwatchRoom,shell:briarShell
});
