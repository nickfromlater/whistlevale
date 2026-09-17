'use strict';

// BRIARWATCH / THE WALK-IN GALLERY. Original native miniature by nickfromlater,
// with agent assistance. Proposal #42, PR #43. No dragon or creature placeholders.
// The scenery is a concave, room-wrapping cabinet, not a rectangular terrain slab.
const BRIAR={width:148,depth:112,minX:-74,minZ:-58,step:1.06,water:-2.8,bed:-5.1,rail:3.2,highRail:6.7,court:12.2};
const BRIAR_COLORS={stone:'#aaa99b',light:'#c8c3af',shadow:'#727b73',slate:'#3f505a',wood:'#62513b',oak:'#93754d',grass:'#58724f',iron:'#343e3b',red:'#873e3e',brass:'#b9a16d'};
const BRIAR_CASTLE_OFFSET=[-10,10];
const BRIAR_OUTLINE=[[-71,-51],[-58,-56],[-31,-55],[-7,-54],[16,-56],[43,-55],[64,-49],[70,-36],[71,-12],[69,16],[65,33],[55,44],[38,47],[24,43],[19,33],[16,20],[15,7],[16,-8],[20,-19],[11,-24],[-1,-24],[-5,-16],[-1,2],[-2,16],[-8,29],[-21,39],[-40,43],[-57,38],[-68,25],[-72,7],[-73,-21]];
const BRIAR_RIDGE=[[-45,-26],[-37,-37],[-22,-39],[-7,-33],[2,-24],[3,-8],[-1,7],[-16,12],[-33,10],[-44,-2]].map(([x,z])=>[x-10,z+10]);
const BRIAR_ROAD=[[-15,19,3.0],[-28,25,3.2],[-42,25,4.4],[-56,20,6.0],[-54,12,8.0],[-45,19,10.2],[-34,22,11.8],[-34,15,12.2]];
const BRIAR_LEAT=[[22.5,-8.4],[22.5,0],[20.4,1],[18.5,1.2]];
// A separate hillside spring descends into the gorge. Its surveyed water
// levels drive both the carved bed and the rendered downhill ribbon.
const BRIAR_SPRING=[[24,-50,.56],[21,-50,.48],[18,-50,.39],[16,-49,.29],[14,-48,-2.33],[13.5,-47.75,-2.8]];
function briarSpringNear(x,z){let q={distance:Infinity,height:0};for(let i=1;i<BRIAR_SPRING.length;i++){const a=BRIAR_SPRING[i-1],b=BRIAR_SPRING[i],p=briarSegment(x,z,a,b);if(p.distance<q.distance)q={distance:p.distance,height:mix(a[2],b[2],p.t)};}return q;}

const BRIAR_TUNNEL={x0:-47,x1:-25,z:-43,half:1.72,y:6.7};
function briarCurve(a,q,fa,fq,k=1/3){const d=len(sub(q,a))*k;return [a,add(a,mul(fa,d)),sub(q,mul(fq,d)),q];}
const BRIAR_ROUTE=(()=>{
 const p=(x,y,z)=>[x,y,z],line=(a,q)=>[a,lerpV(a,q,1/3),lerpV(a,q,2/3),q];
 // A folded dogbone. The high rear line and low returning line are separate,
 // visibly engineered passages over the gorge. Only the tunnel section is hidden.
 return new Edge('The Crown & Cinder Line',[
  line(p(35,3.2,35),p(50,3.2,35)),
  [p(50,3.2,35),p(62,3.2,35),p(65,3.5,25),p(65,4,14)],
  [p(65,4,14),p(65,4.5,2),p(66,6.7,-26),p(57,7.7,-37)],
  [p(57,7.7,-37),p(51,8.2,-45),p(44,8.2,-43),p(33,8.2,-43)],
  line(p(33,8.2,-43),p(-47,8.2,-43)),
  [p(-47,8.2,-43),p(-62,8.2,-43),p(-65,7.4,-29),p(-65,6.9,-17)],
  [p(-65,6.9,-17),p(-65,6.4,-5),p(-66,4.8,16),p(-57,4.2,26)],
  [p(-57,4.2,26),p(-49,3.67,35),p(-39,3.2,34),p(-29,3.2,33)],
  [p(-29,3.2,33),p(-17,3.2,32),p(-9,3.2,24),p(-6,3.2,13)],
  [p(-6,3.2,13),p(-3,3.2,2),p(-7,3.2,-7),p(-8,3.2,-15)],
  [p(-8,3.2,-15),p(-9,3.2,-27),p(-8,3.2,-31),p(-3,3.2,-31)],
  line(p(-3,3.2,-31),p(22,3.2,-31)),
  [p(22,3.2,-31),p(29,3.2,-31),p(33,3.2,-29),p(38,3.2,-23)],
  [p(38,3.2,-23),p(45,3.2,-15),p(40,3.2,-7),p(34,3.2,1)],
  [p(34,3.2,1),p(28,3.2,9),p(25,3.2,17),p(24,3.2,25)],
  [p(24,3.2,25),p(23,3.2,33),p(28,3.2,35),p(35,3.2,35)]
 ].map(c=>c.map(([x,y,z])=>[x,BRIAR.rail+(y-BRIAR.rail)*.70,z])));
})();
const BRIAR_RAIL_GRID=(()=>{const cells=new Map();for(let d=0;d<BRIAR_ROUTE.length;d+=.28){const a=BRIAR_ROUTE.at(d),key=Math.floor(a.p[0]/6)+','+Math.floor(a.p[2]/6);if(!cells.has(key))cells.set(key,[]);cells.get(key).push({...a,d});}return cells;})();
function briarRailNear(x,z){let distance=Infinity,point=null,along=0;const ix=Math.floor(x/6),iz=Math.floor(z/6);for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++)for(const q of BRIAR_RAIL_GRID.get((ix+i)+','+(iz+j))||[]){const d=Math.hypot(x-q.p[0],z-q.p[2]);if(d<distance){distance=d;point=q.p;along=q.d;}}return {distance,point,along};}
function briarSegment(x,z,a,q){const dx=q[0]-a[0],dz=q[1]-a[1],t=clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1));return {distance:Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz),t};}
function briarPolygonDistance(x,z,polygon){let inside=false,d=Infinity;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],q=polygon[j];d=Math.min(d,briarSegment(x,z,a,q).distance);if((a[1]>z)!==(q[1]>z)&&x<(q[0]-a[0])*(z-a[1])/(q[1]-a[1])+a[0])inside=!inside;}return (inside?1:-1)*d;}
function briarInside(x,z,margin=0){return briarPolygonDistance(x,z,BRIAR_OUTLINE)>margin;}
function briarCastleSurface(x,z){return briarSurface(x+BRIAR_CASTLE_OFFSET[0],z+BRIAR_CASTLE_OFFSET[1]);}
function briarRoadNear(x,z){let nearest={distance:Infinity,height:0,index:-1};for(let i=1;i<BRIAR_ROAD.length;i++){const a=BRIAR_ROAD[i-1],q=BRIAR_ROAD[i],v=briarSegment(x,z,a,q);if(v.distance<nearest.distance)nearest={...v,height:mix(a[2],q[2],v.t),index:i-1};}return nearest;}
function briarRiverX(z){const upper=5.5+2.2*Math.sin(z*.12),lower=20.4-z*.12+Math.sin(z*.10+.6);return mix(upper,lower,smooth(-35,-20,z));}
function briarRiverWidth(z){return 2.0+.7*Math.exp(-(((z+32)/12)**2))+.25*Math.cos(z*.16);}
function briarBank(x,z){return Math.abs(x-briarRiverX(z))-briarRiverWidth(z);}
function briarInTunnel(x,z,margin=0){return x>BRIAR_TUNNEL.x0-margin&&x<BRIAR_TUNNEL.x1+margin&&Math.abs(z-BRIAR_TUNNEL.z)<BRIAR_TUNNEL.half+margin;}
function briarGorge(x,z){return Math.abs(x-(5.5+2.2*Math.sin(z*.12)))-5.4;}
function briarBridgeAt(x,z){return (x>-5&&x<22&&z<-27)||(x>-35&&x<-11&&z>25);}
function briarRawHeight(x,z){
 const bank=briarBank(x,z),sd=briarPolygonDistance(x,z,BRIAR_RIDGE);
 let h=.65+.43*Math.sin(x*.09+z*.035)+.31*Math.cos(z*.15-x*.03);
 // One steep, broken limestone escarpment, not evenly stacked concentric hills.
 const fold=sd+.76*Math.sin(x*.32+z*.21)+.46*Math.sin(z*.58-x*.31)+.21*Math.sin(x*.87+z*.79);
 h+=11.5*smooth(-4.2,2.5,fold);h=mix(h,11.85,smooth(2.3,4.5,sd));
 const gully=(a,q,w)=>1-smooth(w*.28,w,briarSegment(x,z,a,q).distance);
 h-=2.5*gully([-52,-12],[-61,1],2.0)*(1-smooth(-1,1.7,sd));
 h-=2.9*gully([-16,-7],[-8,8],1.7)*(1-smooth(-.8,1.7,sd));
 // Rear quarry and eastern wooded scarp have different geological profiles.
 const rear=(1-smooth(12,18,Math.abs(x+41)))*(1-smooth(4,9,Math.abs(z+50)));
 h+=rear*(12.4+1.9*Math.sin(x*.21+z*.08)+1.15*Math.cos(x*.37-z*.16));
 const east=(1-smooth(10,17,Math.abs(x-57)))*(1-smooth(9,20,Math.abs(z+26)));
 h+=10.4*east*(.84+.16*Math.sin(x*.26+z*.13));
 h-=2.5*east*gully([53,-34],[48,-16],2.1);
 h-=1.8*rear*gully([-36,-55],[-31,-45],1.8);
 const town=(1-smooth(16,20,Math.abs(x-47)))*(1-smooth(21,25,Math.abs(z-11)));
 h=mix(h,2.32,town);
 const yard=(1-smooth(10.5,13,Math.abs(x-47)))*(1-smooth(3.5,5.5,Math.abs(z-39)));h=mix(h,2.87,yard);
 if(z<-24&&x>-8&&x<25)h=mix(-5.3,h,smooth(-.6,4.3,briarGorge(x,z)));
 h=mix(BRIAR.bed,h,smooth(-.25,3.4,bank));
 let leat=Infinity;for(let i=1;i<BRIAR_LEAT.length;i++)leat=Math.min(leat,briarSegment(x,z,BRIAR_LEAT[i-1],BRIAR_LEAT[i]).distance);
 if(leat<1.4)h=mix(Math.min(h,BRIAR.water-1.2),h,smooth(.66,1.4,leat));
 // A fern-filled ravine under the inner return bend earns its timber trestle.
 if(x>-36&&x<-10&&z>24)h=mix(h,-3.7,(1-smooth(8,13,Math.abs(x+23)))*(1-smooth(1,7,Math.abs(z-32))));
 const road=briarRoadNear(x,z);if(road.distance<3.0)h=mix(h,road.height-.10,1-smooth(1.35,3,road.distance));
 if(x>-39&&x<-29&&z>17.1&&z<20.4)h-=1.8*Math.sin((z-17.1)/3.3*PI)*smooth(-39,-37,x)*(1-smooth(-31,-29,x));
 const rail=briarRailNear(x,z);
 if(rail.point&&rail.distance<3.6&&!briarInTunnel(x,z,1.1)){
  const bench=rail.point[1]-.30;
  h=mix(h,briarBridgeAt(x,z)?Math.min(h,bench-3.2):bench,1-smooth(1.55,3.6,rail.distance));
 }
 if(briarInTunnel(x,z,.18))h=Math.max(h,BRIAR_TUNNEL.y+3.65);
 if(x>11&&x<27&&z<-44&&z>-54){const spring=briarSpringNear(x,z);if(spring.distance<2.2)h=Math.min(h,mix(spring.height-.66,h,smooth(1.1,2.2,spring.distance)));}
 return h;
}
const BRIAR_GRID={nx:Math.ceil(BRIAR.width/BRIAR.step),nz:Math.ceil(BRIAR.depth/BRIAR.step)};
BRIAR_GRID.dx=BRIAR.width/BRIAR_GRID.nx;BRIAR_GRID.dz=BRIAR.depth/BRIAR_GRID.nz;
const BRIAR_HEIGHT_CACHE=new Map();
function briarGridHeight(ix,iz){const key=iz*(BRIAR_GRID.nx+1)+ix;if(!BRIAR_HEIGHT_CACHE.has(key))BRIAR_HEIGHT_CACHE.set(key,briarRawHeight(BRIAR.minX+ix*BRIAR_GRID.dx,BRIAR.minZ+iz*BRIAR_GRID.dz));return BRIAR_HEIGHT_CACHE.get(key);}
function briarSurface(x,z){const g=BRIAR_GRID,ix=clamp(Math.floor((x-BRIAR.minX)/g.dx),0,g.nx-1),iz=clamp(Math.floor((z-BRIAR.minZ)/g.dz),0,g.nz-1),u=clamp((x-BRIAR.minX-ix*g.dx)/g.dx),v=clamp((z-BRIAR.minZ-iz*g.dz)/g.dz),a=briarGridHeight(ix,iz),r=briarGridHeight(ix+1,iz),f=briarGridHeight(ix,iz+1),q=briarGridHeight(ix+1,iz+1);return u+v<=1?a+(r-a)*u+(f-a)*v:q+(f-q)*(1-u)+(r-q)*(1-v);}
function briarGroundColor(x,y,z,n){const patch=.5+.25*Math.sin(x*.14+Math.sin(z*.09)*2)+.19*Math.cos(z*.18-x*.045);let c=lerpV(col('#385e46'),col('#81946a'),clamp(patch));c=lerpV(c,lerpV(col('#768378'),col('#a7aa94'),.52+.20*Math.sin(y*.43+x*.28+z*.17)),smooth(.09,.36,1-n[1]));c=lerpV(c,col('#a99b7c'),(1-smooth(1.25,2.1,briarRoadNear(x,z).distance))*.8);if(y<BRIAR.water+.7)c=lerpV(col('#405c50'),col('#93987e'),smooth(BRIAR.bed,BRIAR.water+.7,y));return c;}
function briarClip(points,field){const out=[];for(let i=0;i<points.length;i++){const a=points[i],q=points[(i+1)%points.length],da=field(a),dq=field(q),inside=da>=0,next=dq>=0;if(inside)out.push(a);if(inside!==next)out.push(lerpV(a,q,da/(da-dq)));}return out;}
function briarTerrain(b){
 const g=BRIAR_GRID,verts=[],ns=[],cs=[],bounds=[];
 for(let j=0;j<=g.nz;j++)for(let i=0;i<=g.nx;i++){const x=BRIAR.minX+i*g.dx,z=BRIAR.minZ+j*g.dz,y=briarGridHeight(i,j);verts.push([x,y,z]);bounds.push(briarPolygonDistance(x,z,BRIAR_OUTLINE));}
 const cap=(a,q)=>{
  // The same clipped terrain edges close the scenic earth, curved fascia and
  // underside. No rectangular fill, invisible collision slab or floating edge.
  for(const [lo,hi,c,mat]of[[-10.8,-10.55,'#b29a69',41],[-10.55,-7.3,'#30493f',22],[-7.3,-7.12,'#ad9465',41]])b.quad([a[0],lo,a[2]],[q[0],lo,q[2]],[q[0],hi,q[2]],[a[0],hi,a[2]],c,mat);
  b.quad([a[0],-7.12,a[2]],[q[0],-7.12,q[2]],q,a,'#727565',86);
 };
 for(let j=0;j<g.nz;j++)for(let i=0;i<g.nx;i++){
  const k=j*(g.nx+1)+i;
  for(const ids of[[k,k+g.nx+1,k+1],[k+1,k+g.nx+1,k+g.nx+2]]){
   const ds=ids.map(v=>bounds[v]);if(ds.every(d=>d<0))continue;
   const tri=ids.map(v=>verts[v]);let points=tri;
   if(ds.some(d=>d<0)){
    points=[];const crossings=[];
    for(let n=0;n<3;n++){const nn=(n+1)%3,a=tri[n],q=tri[nn],da=ds[n],dq=ds[nn];if(da>=0)points.push(a);if((da>=0)!==(dq>=0)){const cut=lerpV(a,q,da/(da-dq));points.push(cut);crossings.push(cut);}}
    if(crossings.length===2)cap(...crossings);
   }
   const normal=norm(cross(sub(tri[1],tri[0]),sub(tri[2],tri[0])));
   for(let n=1;n+1<points.length;n++){
    for(const v of[points[0],points[n],points[n+1]])b.vertex(v,normal,briarGroundColor(...v,normal),normal[1]<.76?3:88);
    // The underside is triangulated once from the concave outline below.
   }
   const wet=briarClip(points,p=>BRIAR.water-p[1]);
   for(let n=1;n+1<wet.length;n++)for(const v of[wet[0],wet[n],wet[n+1]])b.vertex([v[0],BRIAR.water+.012,v[2]],[0,1,0],lerpV(col('#234d47'),col('#6f9480'),smooth(-2,.7,briarBank(v[0],v[2]))),7);
  }
 }
}
function briarCabinetUnderside(b){
 // Ear clipping preserves the walk-in void. A fan from the origin would fill it.
 const points=BRIAR_OUTLINE.map(p=>p.slice()),area=points.reduce((a,p,i)=>{const q=points[(i+1)%points.length];return a+p[0]*q[1]-q[0]*p[1];},0);
 if(area<0)points.reverse();const cross2=(a,q,r)=>(q[0]-a[0])*(r[1]-a[1])-(q[1]-a[1])*(r[0]-a[0]);let guard=0;
 while(points.length>2&&guard++<500){let cut=false;for(let i=0;i<points.length;i++){const a=points[(i+points.length-1)%points.length],q=points[i],r=points[(i+1)%points.length];if(cross2(a,q,r)<=0)continue;
  if(points.some(v=>v!==a&&v!==q&&v!==r&&cross2(a,q,v)>=0&&cross2(q,r,v)>=0&&cross2(r,a,v)>=0))continue;
  b.tri(...[a,q,r].map(v=>[v[0],-10.8,v[1]]),'#2e3d33',22);points.splice(i,1);cut=true;break;
 }if(!cut)throw new Error('Briarwatch cabinet outline cannot be triangulated.');}
}
function briarTable(b){
 briarCabinetUnderside(b);
 for(const [x,z]of[[-63,-42],[-30,-48],[40,-47],[63,-24],[57,28],[29,36],[-20,29],[-56,29],[-62,-5]]){
  b.box(x,(FLOOR-10.8)/2,z,2.4,-10.8-FLOOR,2.4,'#544935',22);b.box(x,FLOOR+.28,z,3.1,.55,3.1,'#3c3d2f',22);
  for(const s of[-1,1])b.beam([x,-15,z],[x+s*4.5,-10.85,z],.28,'#776143',22,4);
 }
 // The visitor can walk into the negative space between the two peninsulas.
 // A full-size low stool and a narrow control shelf reinforce that room scale.
 for(const x of[4,8])for(const z of[31,35])b.box(x,FLOOR+2.9,z,.45,5.8,.45,'#806847',22);
 b.box(6,FLOOR+5.9,33,6.2,.60,6.2,'#807354',22);b.box(6,FLOOR+6.25,33,5.8,.25,5.8,'#6c7960',23);
 b.box(-7,-12.3,29,4.4,.45,5.5,'#806949',22);
}

// Recessed, forced-perspective estate outlooks. Everything stays inside the
// room footprint and belongs to the back wall's existing cutaway/cache mesh.
const BRIAR_OUTLOOK={radius:10.2,bottom:3.3,spring:31.3,front:4.8,back:.72};
function briarEstateTree(b,x,y,z,h,kind=0){
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
 // Close the top and upper sides of the casing. Without these returns the
 // backing sky escaped above the arch in the high arrival camera.
 b.box(0,46.5,(front+q.back)/2,2*r+2.3,7,front-q.back,'#bcb59d',20);
 for(const side of[-1,1])b.box(side*(r+.56),(sy+43)/2,(front+q.back)/2,1.12,43-sy,front-q.back,'#bcb59d',20);
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

function briarShell(b){
 const walls=[];b.box(0,FLOOR-.25,0,158,.45,130,'#826c4c',21);
 // The room is an old estate railway gallery, not a neutral box. Furniture and
 // fittings hug the perimeter so the miniature remains the visual center.
 b.box(2,-18,47,12,1.0,5,'#6d553a',22);
 for(const x of[-2,6])for(const z of[45,49])b.box(x,-21,z,.6,6,.6,'#5d4934',22);
 b.box(2,-17.25,47,7,.36,4.8,'#d8c9a6',23);b.push(2,-17.02,47,-PI/2);roomSign(b,'blueprint',0,0,0,6.8,4.5);b.pop();
 // Two museum benches and a narrow runner make the central aisle feel inhabited
 // without blocking the horseshoe cabinet or any authored camera.
 for(const x of[-24,24]){b.box(x,-20.72,50,10,.55,2.1,'#70573b',22);for(const dx of[-4.1,4.1])b.box(x+dx,-22.25,50,.45,3,.45,'#5b4936',22);}
 for(const x of[-24,24])briarReadingLamp(b,x,56);
 b.box(0,FLOOR+.018,51,53,.035,5.2,'#6e4038',23);b.box(0,FLOOR+.038,51,49,.018,4.55,'#b18c62',23);
 for(const which of['back','left','right','front']){
  const w=new Builder(),back=which==='back',front=which==='front',side=!back&&!front,width=back||front?156:128,pos=back?[0,0,-64]:front?[0,0,64]:which==='left'?[-78,0,0]:[78,0,0],angle=back?0:front?PI:which==='left'?PI/2:-PI/2;
  w.push(...pos,0,angle);
  // Warm lime plaster above a deep oak dado, with layered skirting/cornice.
  w.box(0,13,0,width,74,.6,'#c2bca7',20);w.box(0,-16,.45,width,16,.6,'#30483e',22);
  w.box(0,-23.2,.92,width,.62,1.05,'#6b5438',22);w.box(0,-8.1,.90,width,.75,.92,'#806746',22);w.box(0,42.7,.82,width,.82,1.05,'#765d3e',22);
  // Authored wall bays: broad recessed plaster fields framed by oak pilasters.
  const bay=side?16:18;
  for(let x=-width/2+5;x<width/2;x+=bay){
   if(back&&Math.abs(Math.abs(x)-42)<12)continue;
   w.box(x,14,.82,.72,58.2,.72,'#70583d',22);
   w.box(x+bay*.42,35.5,.80,bay*.72,.34,.72,'#9a8058',22);
   w.box(x+bay*.42,-7.0,.80,bay*.72,.26,.66,'#9a8058',22);
  }
  // Raised dado panels read at room scale instead of a picket-fence rhythm.
  for(let x=-width/2+8;x<width/2-3;x+=12){w.box(x,-15.7,1.00,9.4,10.7,.16,'#3a5448',22);w.box(x,-15.7,1.10,8.2,9.5,.08,'#56705d',22);}
  if(back){
   for(const [i,x]of[-42,42].entries())briarEstateOutlook(w,x,i);
   // A restrained heraldic centerpiece gives the far wall a focal point.
   w.box(0,20,.92,28,29,.28,'#a9a38f',20);w.box(0,20,1.10,25.5,26.5,.16,'#c8c0aa',20);
   w.push(0,20,1.24,0,0);w.cylinder(0,0,0,5.4,5.4,.16,'#72563d',22,16,PI/2);w.cylinder(0,0,.12,4.5,4.5,.12,'#9b7b50',22,16,PI/2);w.box(0,.2,.24,1.0,6.0,.18,'#3d5145',22);w.box(0,.2,.25,6.0,1.0,.18,'#3d5145',22);w.pop();
   const key='house-'+Object.keys(HOUSE_ROOMS).indexOf('briarwatch');if(roomLabels[key])roomFrame(w,key,0,36,1.15,42,8);
  }else if(side){
   // Framed railway drawings sit inside the wall bays, with small brass labels.
   roomFrame(w,'blueprint',-29,11,1.12,23,18);roomFrame(w,'slow',29,10,1.12,14,20);
   for(const x of[-29,29]){w.box(x,-1.3,1.32,7.5,.42,.16,'#9c8355',41);w.cylinder(x-3.1,-1.3,1.42,.13,.13,.08,'#d0b778',41,10,PI/2);}
  }
  if(front){
   // Entry portal becomes a proper paneled gallery door surround.
   w.box(0,-3,1,21,44,1,'#684f36',22);w.box(0,-3,1.62,16,39,.22,'#3c5145',22);
   for(const x of[-7.2,7.2])w.box(x,-3,1.82,.55,39,.32,'#a0875d',22);
   w.box(0,16.4,1.82,15,.55,.32,'#a0875d',22);w.cylinder(6,-4,1.98,.35,.35,.5,'#c3a977',41,14,PI/2);roomFrame(w,'shop-sign',0,24,1.05,35,8);
  }
  // Wall sconces create pools of warm detail while staying above the layout.
  const sconces=back?[-65,-19,19,65]:side?[-47,-15,15,47]:[-55,-30,30,55];
  for(const x of sconces){w.box(x,25,1.22,.24,3.2,.34,'#725f43',22);w.beam([x,24.4,1.30],[x,23.1,2.2],.055,'#9f875a',41,6);w.cylinder(x,22.75,2.28,.72,.34,.66,'#d7bd83',41,14);w.cylinder(x,22.40,2.28,.61,.61,.05,'#f0d9a7',25,14);}
  // Roof fittings follow their wall's native cutaway. Layered trusses and
  // lanterns suggest a timber gallery ceiling without spanning the miniature.
  if(back||front){
   const z=back?15:18,lampZ=back?19:20;
   w.beam([-77,43,z],[77,43,z],.58,'#665039',22,4);
   for(const x of[-68,-34,0,34,68]){w.beam([x-7,35,z],[x,43,z],.34,'#806343',22,4);w.beam([x+7,35,z],[x,43,z],.34,'#806343',22,4);}
   for(const x of[-44,44]){
    w.beam([x,43,z],[x,43,lampZ],.12,'#665039',22,4);w.beam([x,43,lampZ],[x,39.8,lampZ],.045,'#51473a',41,6);w.cylinder(x,39.3,lampZ,3.0,1.35,1.15,'#94794f',41,20);w.cylinder(x,38.71,lampZ,2.72,2.72,.07,'#f0dcb0',25,20);
    for(let i=0;i<6;i++){const a=i*TAU/6;w.beam([x,39.15,lampZ],[x+Math.cos(a)*2.2,38.35,lampZ+Math.sin(a)*2.2],.045,'#8f744d',41,5);w.sphere(x+Math.cos(a)*2.2,38.3,lampZ+Math.sin(a)*2.2,.18,.24,.18,'#e5c889',25,8,4);}
   }
  }
  briarGalleryReceiver(w,which,pos,angle);w.pop();walls.push({which,mesh:w.mesh()});
 }
 return walls;
}


// Track uses the native gauge and sleeper profile, with surface-only chair plates
// rather than hundreds of thousands of invisible chair-box faces.
function briarSleeper(b,c){
 const X=.54,Z=.07,lo=-.1015,hi=-.0245;
 b.quad([-X,hi,-Z],[-X,hi,Z],[X,hi,Z],[X,hi,-Z],shade(c,1.04),2);
 for(const [a,q]of[[[-X,-Z],[X,-Z]],[[X,-Z],[X,Z]],[[X,Z],[-X,Z]],[[-X,Z],[-X,-Z]]])b.quad([a[0],lo,a[1]],[q[0],lo,q[1]],[q[0],hi,q[1]],[a[0],hi,a[1]],c,2);
}
function briarTrack(b,e){
 ribbon(b,e,1.55,0,-.245,'#697568',9,0,e.length,.55);ribbon(b,e,1.35,0,-.15,'#899082',9,0,e.length,.45);
 for(let d=0;d<e.length;d+=.34){const a=e.at(d);b.matrix(basis(a.p,a.f));briarSleeper(b,shade('#695d46',.85+.22*hash(d,e.length)));
  for(const s of[-1,1])b.quad([s*.32-.073,-.012,-.085],[s*.32+.073,-.012,-.085],[s*.32+.073,-.012,.085],[s*.32-.073,-.012,.085],'#45564e',11);b.pop();
 }
 for(const s of[-1,1]){ribbon(b,e,.058,s*.32,.020,'#4f615b',11,0,e.length,.28);ribbon(b,e,.072,s*.32,.059,'#b8bfb0',1,0,e.length,.28);}
}
function briarRailRange(predicate){let start=Infinity,end=-Infinity;for(let d=0;d<BRIAR_ROUTE.length;d+=.16)if(predicate(BRIAR_ROUTE.at(d).p)){start=Math.min(start,d);end=Math.max(end,d);}return [start,end];}
function briarSignal(b,d,side=1){const a=BRIAR_ROUTE.at(d),r=norm([a.f[2],0,-a.f[0]]),p=add(a.p,mul(r,side*1.66));b.push(...p,0,Math.atan2(a.f[0],a.f[2]));
 b.box(0,-.11,0,.65,.25,.75,'#979983',4);b.cylinder(0,1.9,0,.075,.065,3.8,'#d2c8a9',41,7);
 for(let i=0;i<11;i++)b.beam([-.15,.23+i*.30,-.14],[.15,.23+i*.30,-.14],.018,'#61664e',42,4);
 for(const x of[-.16,.16])b.beam([x,.2,-.14],[x,3.7,-.14],.019,'#61664e',42,4);
 b.box(.39,3.42,0,.91,.20,.08,'#9b4d3c',23);b.box(.65,3.42,.05,.12,.20,.016,'#e1d4b1',23);b.cylinder(0,3.42,.08,.15,.15,.075,'#444f43',42,9,PI/2);b.sphere(0,3.42,.13,.065,.065,.026,'#b1be91',10,8,4);b.pop();
}
function briarViaduct(b){
 const start=-4,end=23,span=(end-start)/5,y=BRIAR.highRail,z=-43,top=y-.24,r=span*.36,spring=top-r-.55;
 for(let i=0;i<5;i++){
  const x=start+(i+.5)*span;b.push(x,0,z);briarArcadeBay(b,span,top,2.4,r,spring,-5.3,'#999e93');
  for(const s of[-1,1]){
   const xx=s*span/2,ground=Math.min(briarSurface(x+xx,z),spring-1.0)-.25;
   b.box(xx,(ground+spring)/2,0,.98,spring-ground,2.75,'#879184',4);b.box(xx,ground+.13,0,1.58,.52,3.4,'#778374',4);
   for(const zz of[-1,1]){b.push(xx,0,zz*1.35,0,zz<0?PI:0);b.quad([-.48,ground,0],[.48,ground,0],[.34,spring-.35,.30],[-.34,spring-.35,.30],'#939b8b',4);b.tri([-.48,ground,0],[0,ground,1.0],[.48,ground,0],'#8c9686',4);b.pop();}
  }
  for(let row=0;row<5;row++)for(const side of[-1,1]){const yy=spring+.3+row*.38;for(let j=0;j<2;j++)b.box((j?1:-1)*(span/2-.24),yy,side*1.23,.42,.25,.08,(row+i)%3?'#aab09d':'#889783',4);}
  b.pop();
 }
 for(const side of[-1,1]){
  b.box((start+end)/2,y+.17,z+side*1.19,end-start+.45,.72,.30,'#a9ad99',4);b.box((start+end)/2,y+.60,z+side*1.19,end-start+.65,.15,.45,'#c2c1a8',4);
  for(let x=start;x<=end;x+=2.7)b.box(x,y+.19,z+side*1.20,.34,.85,.44,'#b3b69e',4);
 }
}
function briarCoveredBridge(b){
 const z=-31,start=-3,end=22,y=3.2,spacing=3.1;
 // Low return line: an open-sided, oak-framed bridge below the stone viaduct.
 b.box((start+end)/2,y-.39,z,end-start, .35,2.6,'#735f43',22);
 for(let x=start;x<end;x+=.28)b.box(x,y-.17,z,.25,.13,2.65,'#8c7853',22);
 for(const side of[-1,1]){
  const zz=z+side*1.34;b.beam([start,y-.5,zz],[end,y-.5,zz],.16,'#61533d',22,4);b.beam([start,y+2.9,zz],[end,y+2.9,zz],.12,'#786243',22,4);
  for(let x=start;x<end;x+=spacing){const q=Math.min(x+spacing,end);b.beam([x,y-.35,zz],[x,y+2.9,zz],.10,'#8b714b',22,4);b.beam([x,y-.20,zz],[q,y+2.85,zz],.10,'#a28a58',22,4);b.beam([q,y-.20,zz],[x,y+2.85,zz],.06,'#786448',22,4);b.beam([x,y+.8,zz],[q,y+.8,zz],.055,'#ad9769',22,4);}
 }
 for(const x of[start,end]){const g=Math.min(briarSurface(x,z),y-1);b.box(x,(g+y-.50)/2,z,1.8,y-.50-g,3.6,'#88927c',4);b.box(x,y-.5,z,2.1,.4,3.9,'#b1b398',4);}
 b.push((start+end)/2,y+3.1,z,0,PI/2);briarRoof(b,3.5,end-start+.5,0,1.1,'#516764',false);b.pop();
}
function briarTrestle(b){
 const [start,end]=briarRailRange(p=>p[0]>-35&&p[0]<-11&&p[2]>25);
 if(!Number.isFinite(start))return;
 for(const side of[-1,1])ribbon(b,BRIAR_ROUTE,.32,side*.84,-.38,'#655b40',22,start,end,.35);
 for(let d=start;d<end;d+=2.9){
  const a=BRIAR_ROUTE.at(d),r=norm([a.f[2],0,-a.f[0]]),foot=Math.min(briarSurface(a.p[0],a.p[2]),a.p[1]-1.0)-.22;
  b.matrix(basis([a.p[0],0,a.p[2]],norm([a.f[0],0,a.f[2]])));
  for(const side of[-1,1]){b.beam([side*1.1,foot,0],[side*.76,a.p[1]-.4,0],.12,'#796a47',22,5);b.box(side*1.1,foot,.0,.78,.28,.83,'#a3a18a',4);}
  for(const y of[foot+1,a.p[1]-1.2])b.beam([-1.04,y,0],[1.04,y,0],.10,'#947c50',22,4);
  b.beam([-1.04,foot+.4,.09],[.91,a.p[1]-.55,.09],.077,'#a48b58',22,4);b.beam([1.04,foot+.4,-.09],[-.91,a.p[1]-.55,-.09],.077,'#8f7750',22,4);b.pop();
 }
 for(const side of[-1,1]){
  ribbon(b,BRIAR_ROUTE,.12,side*1.25,1.05,'#a58f65',22,start,end,.45);
  for(let d=start;d<end;d+=1.0){const a=BRIAR_ROUTE.at(d),r=norm([a.f[2],0,-a.f[0]]),p=add(a.p,mul(r,side*1.25));b.beam(add(p,[0,-.3,0]),add(p,[0,1.08,0]),.035,'#8f805b',22,5);}
 }
}
function briarTunnel(b){
 const t=BRIAR_TUNNEL;
 for(const [x,angle]of[[t.x0,PI/2],[t.x1,-PI/2]]){
  b.push(x,t.y-.22,t.z,0,angle);briarArchWall(b,7.4,6.2,1.3,3.5,1.54,'#899488',.33);
  for(const s of[-1,1]){b.box(s*3.3,2.3,0,.90,4.6,1.8,'#8d9484',4);b.box(s*3.3,4.8,0,1.16,.30,2.0,'#b4b49b',4);for(let yy=.5;yy<4.7;yy+=.42)b.box(s*3.3,yy,1.0,1.0,.11,.08,'#9ea18e',4);}
  b.box(0,6.34,0,7.8,.30,1.8,'#b9b89f',4);b.box(0,5.55,.75,1.3,.43,.13,'#c2bca2',4);b.pop();
 }
 for(const side of[-1,1])b.box((t.x0+t.x1)/2,t.y+.68,t.z+side*1.70,t.x1-t.x0,1.85,.25,'#46584e',4);
 for(let i=0;i<16;i++){const a=i*PI/16,q=(i+1)*PI/16,pt=(x,v)=>[x,t.y+1.42+Math.sin(v)*1.8,t.z+Math.cos(v)*1.8];b.quad(pt(t.x0,a),pt(t.x1,a),pt(t.x1,q),pt(t.x0,q),'#4e5e53',4);}
}
function briarRailway(b){
 briarTrack(b,BRIAR_ROUTE);briarViaduct(b);briarCoveredBridge(b);briarTrestle(b);briarTunnel(b);
 // Curved retaining balcony below the castle's eastern cliff.
 const [a,q]=briarRailRange(p=>p[0]>-10&&p[0]<-3&&p[2]>-17&&p[2]<20);
 for(let d=a;d<q;d+=1.5){const p=BRIAR_ROUTE.at(d),r=norm([p.f[2],0,-p.f[0]]),point=add(p.p,mul(r,-1.50)),g=briarSurface(point[0],point[2]);b.matrix(basis([point[0],0,point[2]],p.f));b.box(0,(g+point[1]-.3)/2,0,.43,Math.max(.2,point[1]-.3-g),1.60,'#939e8b',4);b.box(0,point[1]+.18,0,.25,.72,1.53,'#b1b59d',4);b.pop();}
 for(const [d,side]of[[8,-1],[65,1],[160,-1],[BRIAR_ROUTE.length-21,1]])briarSignal(b,d,side);
}
function briarRoads(b){
 housePath(b,BRIAR_ROAD.map(p=>p.slice(0,2)),1.24,briarSurface,'#ac9f80');
 for(let i=0;i<17;i++){const z=16+i*.31,y=12.14-(z-16)*.062;b.box(-34,y-.12,z,3.75,.22,.30,i%4?'#8c7350':'#786445',22);}
 for(const x of[-35.45,-32.55])b.beam([x,11.7,16],[x,11.36,21.1],.15,'#5d503d',22,4);
 for(const x of[-35.7,-32.3])b.beam([x,16.8,15.8],[x,12,20.6],.029,'#484d43',42,6);
 // Broken curb stones, drainage channels and a retaining parapet articulate the climb.
 for(let i=1;i<BRIAR_ROAD.length-1;i++){const p=BRIAR_ROAD[i-1],q=BRIAR_ROAD[i],n=Math.ceil(Math.hypot(q[0]-p[0],q[1]-p[1])/.7),dx=q[0]-p[0],dz=q[1]-p[1],L=Math.hypot(dx,dz),r=[dz/L,-dx/L];
  for(let j=0;j<n;j++)for(const s of[-1,1]){const x=mix(p[0],q[0],j/n)+s*r[0]*1.4,z=mix(p[1],q[1],j/n)+s*r[1]*1.4,y=briarSurface(x,z);b.push(x,y+.08,z,0,Math.atan2(dx,dz));b.box(0,0,0,.26,.19,.49,j%5?'#aaa78d':'#898f78',4);b.pop();}
 }
}
// A tapered branch skeleton with airy, broken crowns rather than a trunk with
// a pile of identical spheres. All variations are independent coordinate hashes.
const BRIAR_TREES=[[-57,11,7.4,'oak'],[-56,2,7,'beech'],[-59,-16,6.2,'pine'],[-53,-32,5.8,'pine'],[-62,-48,6,'pine'],[-49,-49,5.2,'pine'],[-32,-51,5.7,'pine'],[-21,-48,7.3,'pine'],[-14,-48,5.7,'beech'],[31,-50,6.5,'pine'],[44,-48,7.2,'pine'],[51,-35,8.5,'pine'],[59,-25,7.4,'pine'],[62,-20,6.2,'pine'],[59,-12,5.1,'beech'],[60,-16,4.4,'pine'],[59,3,4.5,'beech'],[60,14,5,'beech'],[53,38,6,'oak'],[35,40,5.3,'oak'],[31,30,3.7,'apple'],[33,26,4.0,'apple'],[33,23,3.3,'apple'],[31,19,3.5,'apple'],[29,-12,5.4,'willow'],[20,-10,5.7,'willow'],[15,-46,5.2,'beech'],[-17,-34,5.6,'beech'],[-17,23,4.6,'beech'],[-27,39,6.8,'oak'],[-36,40.5,5.3,'beech'],[-45,38,6.2,'oak'],[-63,30,5.5,'dead'],[-58,34.5,5.6,'oak']];
// Small woods frame the rear quarry, eastern watch ridge and fern ravine.
// Coordinates are explicit so a tree never migrates onto a route after a seed change.
BRIAR_TREES.push(
 [-67,-37,7.2,'pine'],[-61,-38,8.3,'pine'],[-55,-50,8.5,'pine'],[-45,-52,8.1,'pine'],[-38,-50,6.6,'pine'],[-27,-52,7.6,'pine'],
 [-20,-53,6.3,'beech'],[-57,-26,7.2,'beech'],[-58,-8,8.2,'oak'],[-56.5,5,6.6,'beech'],[-53,30,7.3,'oak'],[-39,40,6.4,'beech'],
 [27,-49,7.8,'pine'],[37,-51,8.8,'pine'],[46,-37,8.1,'pine'],[53,-31,7.6,'pine'],[61,-31,8.2,'pine'],[57,-18,6.9,'pine'],
 [51,-16,6.4,'beech'],[60,6,5.4,'beech'],[59,31,6.1,'oak'],[40,39,4.8,'apple']
);
function briarTaperBranch(b,a,q,r,R,c){
 const f=norm(sub(q,a)),u=norm(cross(Math.abs(f[1])>.98?[1,0,0]:[0,1,0],f)),v=cross(f,u),n=5;
 const pt=(p,rr,t)=>add(p,add(mul(u,Math.cos(t)*rr),mul(v,Math.sin(t)*rr)));
 for(let i=0;i<n;i++){const t=i*TAU/n,k=(i+1)*TAU/n;b.quad(pt(a,r,t),pt(a,r,k),pt(q,R,k),pt(q,R,t),c,22);}
}
function briarLeafCloud(b,p,s,c,id){
 // Three staggered, lobed rings with blended normals. There is no equatorial
 // umbrella disc or pointed top, and no shared sphere primitive to repeat.
 const n=5,rings=[],angle=hash(id,17)*TAU;
 for(let j=0;j<3;j++){
  const ring=[];for(let i=0;i<n;i++){
   const a=i*TAU/n+angle+j*.16,r=s*[.53,1,.72][j]*(.83+.23*hash(i,id));
   ring.push([p[0]+Math.cos(a)*r+s*j*.025,p[1]+s*[-.43,.04,.62][j]+s*(hash(i,id+9)-.5)*.16,p[2]+Math.sin(a)*r-s*j*.04]);
  }rings.push(ring);
 }
 const normal=v=>norm([v[0]-p[0],(v[1]-p[1])*1.20,v[2]-p[2]]);
 const face=(a,q,r,tint)=>b.tri(a,q,r,tint,8,[normal(a),normal(q),normal(r)]);
 for(let j=0;j<2;j++)for(let i=0;i<n;i++){
  const k=(i+1)%n,a=rings[j][i],q=rings[j][k],r=rings[j+1][k],t=rings[j+1][i],cc=shade(c,.88+j*.10+.06*hash(i,id));
  face(a,q,r,cc);face(a,r,t,cc);
 }
 const top=[p[0]+s*.07,p[1]+s*.84,p[2]-s*.08],low=[p[0],p[1]-s*.58,p[2]];
 for(let i=0;i<n;i++){const k=(i+1)%n;face(rings[2][i],rings[2][k],top,shade(c,1.025));face(rings[0][k],rings[0][i],low,shade(c,.80));}
}
function briarTree(b,x,z,h,kind='oak'){
 if(!briarInside(x,z,1))return;
 const y=briarSurface(x,z),id=x*3+z,bark=kind==='beech'?'#858879':'#635d48',pine=kind==='pine',willow=kind==='willow';
 const lean=[h*(pine?.025:.065)*Math.sin(id),0,h*.05*Math.cos(id)];
 const root=[x,y-.16,z],low=[x+lean[0]*.18,y+h*.21,z+lean[2]*.34],fork=[x+lean[0],y+h*.43,z+lean[2]];
 briarTaperBranch(b,root,low,h*.070,h*.045,bark);briarTaperBranch(b,low,fork,h*.045,h*.027,bark);
 for(let i=0;i<5;i++){
  const a=i*TAU/5+.4,xx=x+Math.cos(a)*h*.13,zz=z+Math.sin(a)*h*.13;
  briarTaperBranch(b,[x,y+.45,z],[xx,briarSurface(xx,zz)+.025,zz],h*.027,h*.006,bark);
 }
 if(pine){
  const tip=[x+lean[0]*1.5,y+h,z+lean[2]];briarTaperBranch(b,fork,tip,h*.028,.008,bark);
  // Broken whorls, bare lower limbs and asymmetric pads of needles. Fewer,
  // broader crowns retain branch gaps and avoid a stack of perfect cones.
  for(let j=0;j<6;j++)for(let k=0;k<2;k++){
   const a=k*2.86+j*1.19+id,rr=h*(.245-j*.030)*(.88+.16*hash(k,id+j)),yy=y+h*(.36+j*.10);
   const q=[x+Math.cos(a)*rr+lean[0]*j/6,yy-h*.035,z+Math.sin(a)*rr+lean[2]*j/6],v=[x,yy+h*.025,z];
   briarTaperBranch(b,v,q,h*.009,.009,bark);briarLeafCloud(b,add(q,[0,h*.045,0]),h*(.165-j*.017),['#355b47','#436a4e','#567954'][(j+k)%3],id+j*3+k);
  }
  for(let i=0;i<3;i++){const a=i*2.4+id;briarTaperBranch(b,[x,y+h*.31,z],[x+Math.cos(a)*h*.15,y+h*.27,z+Math.sin(a)*h*.15],h*.011,.008,bark);}
  briarLeafCloud(b,add(tip,[0,-h*.06,0]),h*.063,'#648368',id);return;
 }
 const limbs=5;
 for(let i=0;i<limbs;i++){
  const a=i*2.399+id*.12,r=h*(.27+.09*hash(i,id)),rise=i===4?.88:.62+.18*hash(id,i),end=[x+Math.cos(a)*r+lean[0],y+h*rise,z+Math.sin(a)*r+lean[2]],mid=lerpV(fork,end,.52);
  mid[1]-=h*.075;briarTaperBranch(b,fork,mid,h*.029,h*.018,bark);briarTaperBranch(b,mid,end,h*.018,.012,bark);
  for(let j=0;j<3;j++){
   const aa=a+(j-1)*.94,q=[end[0]+Math.cos(aa)*h*.12,end[1]+h*(j===1?.10:.01),end[2]+Math.sin(aa)*h*.12];
   briarTaperBranch(b,end,q,h*.011,.006,bark);if(kind==='dead')continue;
   const colors=kind==='apple'?['#5e804d','#829450','#74914d']:willow?['#78956c','#8da47b','#6c8b65']:kind==='beech'?['#657d4c','#91a267','#7b9259']:['#416b49','#648451','#789057'];
   briarLeafCloud(b,q,h*(j===1?.21:.18),colors[j],id+i*3+j);
   if(willow)for(let k=0;k<4;k++){
    const a2=k*1.9,xx=q[0]+Math.cos(a2)*h*.11,zz=q[2]+Math.sin(a2)*h*.10,drop=h*(.19+.10*hash(k,id));
    b.quad([xx-.09,q[1],zz],[xx+.10,q[1],zz],[xx+.18,q[1]-drop,zz+.12],[xx-.03,q[1]-drop*.9,zz+.13],shade(colors[j],.96),8);
   }
   if(kind==='apple'&&j===1)b.sphere(q[0],q[1]-.20,q[2],.095,.10,.095,'#a65a3e',23,5,3);
  }
 }
}
function briarFern(b,x,z,s=1){if(!briarInside(x,z,.3))return;const y=briarSurface(x,z);for(let i=0;i<7;i++){const a=i*2.4,p=[x,y,z],q=[x+Math.cos(a)*s*.5,y+s*.38,z+Math.sin(a)*s*.5];briarTaperBranch(b,p,q,.013,.004,'#627850');for(let k=1;k<5;k++){const v=lerpV(p,q,k/5),w=s*.15*(1-k/6),r=[Math.sin(a)*w,0,-Math.cos(a)*w];b.tri(v,add(v,r),add(v,[Math.cos(a)*s*.17,s*.05,Math.sin(a)*s*.17]),'#759659',8);b.tri(v,sub(v,r),add(v,[Math.cos(a)*s*.17,s*.05,Math.sin(a)*s*.17]),'#648c51',8);}}}
function briarNature(b){
 briarEscarpments(b);briarWoodlandFloor(b);briarWatchRuin(b);briarSpring(b);
 for(const t of BRIAR_TREES)if(briarRailNear(t[0],t[1]).distance>2.0)briarTree(b,...t);

 for(let i=0;i<310;i++){
  const x=-70+hash(i,343)*140,z=-53+hash(i,772)*94,y=briarSurface(x,z);if(!briarInside(x,z,1.0)||y<BRIAR.water+.2||briarRailNear(x,z).distance<1.85||briarRoadNear(x,z).distance<2.3||briarPolygonDistance(x,z,BRIAR_RIDGE)>1.5||(x>31&&x<62&&z>-14&&z<37))continue;
  if(i%4===0)briarFern(b,x,z,.45+hash(i,57)*.62);else for(let k=0;k<3;k++){const a=i+k*2.4,h=.12+hash(i,k)*.20;b.tri([x-.04,y,z],[x+Math.sin(a)*.16,y+h,z+Math.cos(a)*.17],[x+.04,y,z],i%2?'#a4a777':'#6f8b58',8);}
 }
 for(let i=0;i<46;i++){const z=-49+i*1.52,x=briarRiverX(z)+briarRiverWidth(z)+.8;if(!briarInside(x,z,1)||briarRailNear(x,z).distance<2)continue;const y=briarSurface(x,z);if(y>0)continue;for(let k=0;k<3;k++){const xx=x+k*.12;b.beam([xx,y,z],[xx+.04,y+.7,z+.1],.012,'#768e5b',8,4);if(k===1)b.cylinder(xx+.04,y+.72,z+.1,.026,.026,.17,'#6e6243',23,5);}}
 // A broken ridge wall and waymarker lie beyond the defended castle, not random rubble.
 for(let i=0;i<18;i++){const x=-48+i*.53,z=36+Math.sin(i*.14);if(briarRailNear(x,z).distance<2)continue;const y=briarSurface(x,z);b.box(x,y+.23,z,.50,.43,.56,i%3?'#909b84':'#b0b195',4);if(i<7)b.box(x,y+.59,z,.48,.27,.52,'#9aa38c',4);}
}
function briarwatchRoom(scene,b){
 briarTable(b);briarTerrain(b);briarRailway(b);briarRoads(b);briarCastle(b);briarVillage(scene,b);briarNature(b);
 scene.routes=[BRIAR_ROUTE];scene.trains=[{edge:BRIAR_ROUTE,distance:125,speed:.90,type:'steam',stock:'coast',cars:3}];
 scene.height=(x,z)=>briarInside(x,z)?Math.max(BRIAR.water,briarSurface(x,z)):FLOOR;scene.canPlace=()=>false;
 scene.briarwatch={revision:3,castle:'Briarwatch',railway:'The Crown & Cinder Line',layout:'Walk-in horseshoe with two scenic peninsulas',villageBuildings:BRIAR_BUILDINGS.length,trees:BRIAR_TREES.length,watchRuin:true,spring:true};
 scene.spots=[
  {name:'The walk-in castle gallery',target:[-1,8,-8],distance:160,phoneDistance:400,phoneYaw:1.48,phonePitch:.84,pitch:.64,yaw:.18,detail:'Two shaped scenic peninsulas wrap around a real visitor aisle. A high stone viaduct, low timber bridge and castle railway connect the little worlds.'},
  {name:'The old keep',target:[-38,27,-9],distance:47,phoneDistance:84,pitch:.37,yaw:-.55,detail:'Crow-stepped limestone gables, traceried loft roses, chamfered archivolts, corbelled bartizans and an oak hoarding articulate the old keep.'},
  {name:'The gate and barbican',target:[-34,15,15],distance:35,phoneDistance:67,pitch:.35,yaw:.12,detail:'Swallowtail standards, carved keystones and mossy stonework frame a braced drawbridge and a genuinely open gate passage.'},
  {name:'The sheltered courtyard',target:[-33,15,3],distance:41,phoneDistance:74,pitch:1.05,yaw:-.2,detail:'Arcades, timber stairs, an open well, kitchen gardens and a narrow working court connect the hall to the keep.'},
  {name:'The river gallery',target:[-14,23,0],distance:42,phoneDistance:76,pitch:.34,yaw:1.25,detail:'Tall hall windows, stone tracery, roof dormers and oak braces above the cliff-side railway balcony.'},
  {name:'Two bridges over the gorge',target:[8,4,-37],distance:48,phoneDistance:90,pitch:.40,yaw:.36,detail:'A hillside spring falls into the gorge beside a tiny packhorse crossing. The train returns below the five-arch viaduct on an open-sided timber bridge.'},
  {name:'The Copper Hart village',target:[47,6,14],distance:48,phoneDistance:84,pitch:.5,yaw:.5,detail:'Timber houses, kitchen gardens, clipped hedges and a small working market sit beneath the ruined watchtower on the wooded ridge.'},
  {name:'The mill and watercourse',target:[25,2,-3],distance:26,phoneDistance:48,pitch:.42,yaw:-.40,detail:'A turning waterwheel, sack hoist, dressed stone millrace and a timber receiving deck along the willow bank.'},
  {name:'The station and goods yard',target:[44,5,31],distance:36,phoneDistance:66,pitch:.39,yaw:.45,detail:'A long timber canopy, railway clock, goods loading dock and sidings at the orchard end of the line.'},
  {name:'The curved timber trestle',target:[-23,2,31],distance:43,phoneDistance:78,pitch:.31,yaw:.1,detail:'Timber bents and diagonal braces carry the sweeping return curve over a fern-filled ravine.'},
  {name:'The estate gallery',target:[0,3,-3],distance:179,phoneDistance:410,phoneYaw:1.48,phonePitch:.84,pitch:.69,yaw:.19,detail:'Scenery follows the room instead of filling a box. Walk between the two cabinet lobes and look back up at the castle.'}
 ];
}
registerHouseRoom('briarwatch',{
 name:'Briarwatch Castle',layout:'The Crown & Cinder Line',tag:'THE WALK-IN CASTLE GALLERY',description:'A limestone fortress and a working medieval town on two room-wrapping peninsulas. A winding steam line crosses stone arches, a covered timber bridge and a curved trestle.',
 color:'#849075',ambient:'forest',target:[-1,8,-8],distance:163,phoneDistance:400,phoneYaw:1.48,phonePitch:.84,pitch:.64,yaw:.18,
 credits:[{name:'nickfromlater',platform:'github',handle:'nickfromlater',note:'Original Briarwatch castle, village, walk-in terrain and exhibition room, with agent assistance. Native geometry; no external model assets.'}],
 map:{plot:'west-5',scale:.40,footprint:[158,130],focus:[-1,8,-8]},
 lights:[[-44,38.7,-45],[44,38.7,-45],[-44,38.7,44],[44,38.7,44],[-24,-14.1,56],[24,-14.1,56]],
 layoutLights:[[-38,17.8,15.9],[-30,17.8,15.9],[-19,23,1],[-31,15,3],[44,6,18],[55,4.8,21],[44,5.7,31],[22,2.4,-3]],
 build:briarwatchRoom,shell:briarShell
});


// Fractured limestone is tied to the slope, never freestanding cylindrical
// boulders. Each toe is sampled against the same triangles used by the railway.
function briarLimestoneRib(b,x,z,w,h,angle,id){
 const c=Math.cos(angle),s=Math.sin(angle),P=(xx,yy,zz)=>[x+xx*c+zz*s,yy,z-xx*s+zz*c],ground=(xx,zz)=>{const p=P(xx,0,zz);return briarSurface(p[0],p[2]);};
 const foot=Math.min(ground(-w*.5,w*.43),ground(w*.5,w*.43),ground(0,0))-.18;
 const crown=Math.max(ground(0,-w*.30),ground(0,0))+h;
 const layers=4,n=6;
 const point=(i,j)=>{
  const a=i*TAU/n+.14,lip=[1,.88,1.02,.78,.64][j],rr=(.86+.19*hash(i,id))*lip;
  const xx=Math.cos(a)*w*.50*rr+(j-2)*w*.025,zz=Math.sin(a)*w*.38*rr-j*w*.018;
  return P(xx,mix(foot,crown,j/layers)+Math.sin(a+.4)*w*.08+(j===0?-.25:.11*Math.sin(i*1.8+j)),zz);
 };
 for(let j=0;j<layers;j++)for(let i=0;i<n;i++){
  const k=(i+1)%n,cc=shade(['#7b897b','#969e8d','#a7aa95','#b4b29a'][j],.90+.10*hash(i,id));
  b.quad(point(i,j),point(k,j),point(k,j+1),point(i,j+1),cc,3);
 }
 const top=P(-w*.07,crown+.02,-w*.06);
 for(let i=0;i<n;i++)b.tri(top,point(i,layers),point((i+1)%n,layers),i%3?'#9b9f85':'#78896a',88);
 // Thin broken bedding, a diagonal fracture and vegetation on the ledge keep
 // the geology legible at close range without contouring the entire hillside.
 for(let j=1;j<4;j++)for(let i=0;i<n;i++)if((i+j+id)%3!==0){
  const a=point(i,j),q=point((i+1)%n,j),f=lerpV(a,q,.83);
  b.quad(add(a,[0,.012,.008]),add(f,[0,.012,.008]),add(f,[0,.065,.012]),add(a,[0,.08,.012]),'#667764',3);
 }
}
function briarEscarpments(b){
 briarCliffButtresses(b);
 // East and south castle faces: projecting ribs alternate with carved gullies.
 const ribs=[[-57,-11,3.9,1.1,-1.4],[-58,-4,3.5,.9,-1.4],[-53,8,4.1,1.1,-.9],[-47,16.8,3.7,.85,-.2],[-39,20.3,3.6,.7,.2],[-26,20.8,3.7,1.25,.3],[-20,16.8,4.2,1.15,.65],[-15,9.4,3.8,1.1,1.1],[-12,1.1,3.2,.95,1.45],[-14,-12,3.4,1.3,1.5],[-19,-24,3.1,1.4,2.5],
 [-57,-48,4.1,1.7,-1.3],[-48,-48,4.6,2.0,.1],[-41,-47,4.2,1.8,.15],[-33,-49,4.0,1.2,.1],
 [50,-28,4.4,1.6,-1.15],[49,-21,4.1,1.2,-1.4],[54,-15,3.7,1.1,.3],[59,-32,4.0,1.6,2.6],[44,-37,3.5,1.7,-1.9],
 [-2.4,-38,3.0,.7,1.5],[13,-38,3.0,.5,-1.5],[15,-27,2.4,.4,-1.5]];
 for(const [i,p]of ribs.entries()){
  const [x,z,w,h,a]=p;if(briarRailNear(x,z).distance<w*.55+1.35&&briarSurface(x,z)<7.7)continue;
  briarLimestoneRib(b,x,z,w,h,a,i);
 }
 // Talus fans occur beneath the outcrops, rather than decorating the plateau.
 for(const [i,a]of [[-57,6],[-48,28],[-24,24],[-12,16],[47,-16],[53,-12],[-3,-35],[14,-37]].entries())for(let j=0;j<7;j++){
  const x=a[0]+(hash(i,j)-.5)*4.4,z=a[1]+(hash(j,i+12)-.5)*3.5;
  if(!briarInside(x,z,1)||briarRoadNear(x,z).distance<2||briarRailNear(x,z).distance<2.1||briarSurface(x,z)<BRIAR.water+.15)continue;
  briarLimestoneRib(b,x,z,.40+hash(i+7,j)*.66,.13,hash(i,j)*6,i*7+j);
 }
}
function briarWoodlandFloor(b){
 // Habitat clusters: bracken under woodland, dry grasses on the sunny cliff,
 // low flowering banks beside paths. Empty areas remain intentional clearings.
 for(const [x,z,r,id]of [[-60,-10,4.2,1],[-55,32,5,2],[-32,35,4,3],[51,-22,5,4],[38,-49,5,5],[58,-9,3,6],[27,-12,2.5,7],[-13,13,2.5,8]]){
  for(let i=0;i<21;i++){
   const a=i*2.399,rr=r*Math.sqrt(hash(i,id)),xx=x+Math.cos(a)*rr,zz=z+Math.sin(a)*rr,y=briarSurface(xx,zz);
   if(!briarInside(xx,zz,.8)||briarRailNear(xx,zz).distance<2||briarRoadNear(xx,zz).distance<1.9||y<BRIAR.water+.18)continue;
   if(i%5===0)briarFern(b,xx,zz,.48+hash(i,id)*.38);
   else{
    for(let k=0;k<5;k++){const aa=k*2.4,dx=Math.sin(aa)*.12,dz=Math.cos(aa)*.12,hh=.19+hash(i,k)*.23;b.tri([xx-.035,y,zz],[xx+dx,y+hh,zz+dz],[xx+.035,y,zz],id%3?'#7f955e':'#abb27d',8);}
    if(i%3===0)for(let k=0;k<3;k++){const xx2=xx+k*.075,yy=y+.26; b.quad([xx2-.035,yy,zz-.04],[xx2+.035,yy+.02,zz-.04],[xx2+.04,yy+.02,zz+.04],[xx2-.035,yy,zz+.04],id%2?'#d3caa1':'#9ca2b3',8);}
   }
  }
 }
 // Fallen oak over the fern bed: raised broken end, branching snag and roots.
 const x=-27,z=35,y=briarSurface(x,z);briarTaperBranch(b,[x-2,y+.28,z+.2],[x+2,y+.55,z-.65],.32,.20,'#635e49');
 briarTaperBranch(b,[x+.5,y+.40,z-.40],[x+1.1,y+1.05,z-1.4],.13,.035,'#79715a');
 for(let i=0;i<4;i++){const a=i*2.2;briarTaperBranch(b,[x-2,y+.30,z+.2],[x-2.5,y+.35+Math.sin(a)*.55,z+.2+Math.cos(a)*.7],.10,.025,'#5d6048');}
}


const BRIAR_CLIFF_FACES=[
 {crest:[-55,-12],toe:[-61,-10],width:3.3},{crest:[-52,6],toe:[-58,7],width:3.6},
 {crest:[-46,15],toe:[-49,20],width:3.6},{crest:[-42,18],toe:[-43,23],width:3.2},
 {crest:[-25,18],toe:[-24,23],width:3.6},{crest:[-20,14],toe:[-14,17],width:4.2},
 {crest:[-16,6],toe:[-11,8],width:3.7},{crest:[-13,-4],toe:[-9,-3],width:3.3},
 {crest:[54,-23],toe:[48,-22],width:4.8},{crest:[57,-18],toe:[53,-13],width:3.6},
 {crest:[-42,-49],toe:[-41,-46],width:3.7}
];
function briarCliffButtresses(b){
 for(const [id,q]of BRIAR_CLIFF_FACES.entries()){
  const [ax,az]=q.crest,[tx,tz]=q.toe,L=Math.hypot(tx-ax,tz-az),r=[-(tz-az)/L,(tx-ax)/L],top=briarSurface(ax,az)-.06,foot=briarSurface(tx,tz)-.23;
  if(top-foot<1.3)continue;
  const P=(u,k)=>{const t=k/5,brow=[0,.12,-.035,.075,-.025,0][k],x=mix(tx,ax,t)+r[0]*u*q.width*(.55-.18*t)+(tx-ax)*brow,z=mix(tz,az,t)+r[1]*u*q.width*(.55-.18*t)+(tz-az)*brow;return [x,mix(foot,top,t)+.12*Math.sin(id+u*2+k*.4),z];};
  // Three non-coplanar vertical facets and occasional receding shelves. Side
  // returns disappear into the terrain, so there is no floating boulder back.
  for(let k=0;k<5;k++)for(let i=0;i<3;i++){
   const u=-1+i*2/3,v=-1+(i+1)*2/3;
   b.quad(P(u,k),P(v,k),P(v,k+1),P(u,k+1),shade(['#7d8877','#989f8b','#a7aa91','#919b86','#b1ae95'][k],.90+.11*hash(id,i)),3);
  }
  for(const side of[-1,1])for(let k=0;k<5;k++){
   const a=P(side,k),q=P(side,k+1),into=p=>[p[0]-(tx-ax)*.55,p[1]-.16,p[2]-(tz-az)*.55];b.quad(a,into(a),into(q),q,'#87927c',3);
  }
  // Grass tears follow the fissure lip instead of a straight contour line.
  for(let i=0;i<9;i++){
   const a=P(-.8+i*.2,5),yy=briarSurface(a[0],a[2]);
   if(Math.abs(a[1]-yy)>.8)continue;
   b.tri([a[0]-.055,yy+.025,a[2]],[a[0]+.12,yy+.30,a[2]+.06],[a[0]+.055,yy+.025,a[2]],i%3?'#80915d':'#a1a273',8);
  }
 }
}
const BRIAR_WATCH_RUIN={x:54.5,z:-27.0,radius:2.4};
function briarWatchRuin(b){
 const {x,z,radius:r}=BRIAR_WATCH_RUIN,n=12,ap=r*Math.cos(PI/n),side=2*r*Math.sin(PI/n),floor=briarSurface(x,z)+.12;
 const foot=Math.min(...Array.from({length:n},(_,i)=>briarSurface(x+Math.sin(i*TAU/n)*(r+.35),z+Math.cos(i*TAU/n)*(r+.35))))-.18;
 b.cylinder(x,(foot+floor)/2,z,r+.36,r+.15,floor-foot,'#89917d',3,12);
 b.push(x,floor,z);
 // A roofless watchtower lost to the trees. A low broken wall on the village
 // side reveals the interior; the rear keeps a recognizable jagged silhouette.
 for(let i=0;i<n;i++){
  const a=i*TAU/n,h=[2.1,2.8,4.2,6.5,7.3,7.7,7.0,6.4,5.7,4.3,2.7,1.8][i];
  b.push(Math.sin(a)*ap,0,Math.cos(a)*ap,0,a);
  if(i===0)briarArchWall(b,side+.04,2.1,.66,.80,1.06,'#aaa98f',.13);
  else if(i===4||i===7)briarWindowBay(b,side+.04,h,.66,.44,3.0,.73,'#9ca38d',false);
  else b.box(0,h/2,0,side+.04,h,.66,i%3?'#a2a58d':'#909b83',4);
  for(let j=0;j<3;j++)b.box((j-1)*side/3,h+.15+(j+i)%3*.13,.02,side/3-.03,.33+(j+i)%2*.18,.76,shade('#b7b298',.93+.07*hash(i,j)),3);
  b.pop();
 }
 b.cylinder(0,.07,0,r-.4,r-.4,.14,'#7e886b',9,12);
 for(const [a,q]of[[[-1.5,3.1,-1.3],[1.8,3.0,-1.3]],[[-1.3,.36,.4],[.8,1.3,-1.5]]])briarTaperBranch(b,a,q,.13,.11,'#6b674d');
 for(let i=0;i<8;i++)b.box((hash(i,31)-.5)*2.9,.17,(hash(i,55)-.5)*2.4,.44,.25,.38,i%3?'#a7aa90':'#b8b398',3);
 briarWallIvy(b,-1.6,0,1.0,1.0,3.8,-.5,32);b.pop();
}


function briarSpring(b){
 const normals=BRIAR_SPRING.map((p,i)=>{
  const a=BRIAR_SPRING[Math.max(0,i-1)],q=BRIAR_SPRING[Math.min(BRIAR_SPRING.length-1,i+1)],before=norm([p[0]-a[0],0,p[1]-a[1]]),after=norm([q[0]-p[0],0,q[1]-p[1]]);
  const f=i===0?after:i===BRIAR_SPRING.length-1?before:norm(add(before,after)),den=Math.max(.8,dot(f,i===0?after:before));
  return [-f[2]/den,f[0]/den];
 });
 let distance=0;
 for(let j=1;j<BRIAR_SPRING.length;j++){
  const a=BRIAR_SPRING[j-1],q=BRIAR_SPRING[j],L=Math.hypot(q[0]-a[0],q[1]-a[1]),n=Math.ceil(L/.25);
  for(let i=0;i<n;i++){
   const t=i/n,u=(i+1)/n,P=(v,side)=>[mix(a[0],q[0],v)+mix(normals[j-1][0],normals[j][0],v)*side*.43,mix(a[2],q[2],v)+.025,mix(a[1],q[1],v)+mix(normals[j-1][1],normals[j][1],v)*side*.43];
   b.quad(P(t,-1),P(u,-1),P(u,1),P(t,1),j===4?'#97c0ae':'#548e7f',87,null,[[-1,distance+t*L],[-1,distance+u*L],[1,distance+u*L],[1,distance+t*L]]);
   if(j===4&&i%2===0)for(const side of[-.45,.23]){
    const A=P(t,side-.07),B=P(u,side-.07),C=P(u,side+.07),D=P(t,side+.07);for(const p of[A,B,C,D])p[1]+=.025;
    b.quad(A,B,C,D,'#c4d5bd',87,null,[[-.6,distance+t*L],[-.6,distance+u*L],[.6,distance+u*L],[.6,distance+t*L]]);
   }
  }distance+=L;
 }
 // An irregular shallow source pool and three mineral outcrops.
 const x=24,z=-50,y=.585,n=12;
 for(let i=0;i<n;i++){
  const a=i*TAU/n,q=(i+1)*TAU/n,r=.69+.10*hash(i,72),R=.69+.10*hash(i+1,72);
  b.tri([x,y,z],[x+Math.cos(a)*r,y,z+Math.sin(a)*r],[x+Math.cos(q)*R,y,z+Math.sin(q)*R],'#609b8a',7);
 }
 for(const [i,x,z,w]of[[1,25.2,-50.8,1.1],[2,23.8,-51.5,.9],[3,16,-50.4,1.1]])briarLimestoneRib(b,x,z,w,.30,i*.8,90+i);
 // Small old packhorse crossing, visibly open beneath the deck.
 b.push(20,.04,-50,0,PI/2);briarArchWall(b,3.3,1.61,1.32,2.40,.26,'#a3aa91',.14);
 b.box(0,1.67,0,3.7,.14,1.65,'#b3b49a',4);
 for(const side of[-1,1]){b.box(0,1.96,side*.75,3.4,.45,.18,'#9ea68a',4);for(let i=0;i<6;i++)b.box(-1.43+i*.57,2.23,side*.75,.54,.13,.28,'#bfc0a3',4);}b.pop();
}
