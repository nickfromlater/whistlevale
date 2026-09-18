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
 // Folded limestone ravines and low woodland hummocks are localized, not
 // a blanket noise pass. Engineered grades/water/house terraces are applied last.
 const wild=(1-smooth(-1.6,1.4,sd))*(1-smooth(22,31,Math.abs(x+46)))*(1-smooth(28,44,Math.abs(z-4)));
 h+=wild*(.24*Math.sin(x*.73+z*.23)+.16*Math.sin(z*.79-x*.34));
 for(const [a,q,w,depth]of[[[-53,-9],[-60,4],1.6,.85],[[-23,20],[-18,26],1.2,.72],[[52,-25],[47,-18],1.45,1.0]]){
  const v=briarSegment(x,z,a,q),end=Math.sin(v.t*PI);
  h-=depth*(1-smooth(w*.18,w,v.distance))*end*(1-smooth(0,1.8,sd));
 }
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
function briarGroundColor(x,y,z,n){
 const patch=.5+.24*Math.sin(x*.14+Math.sin(z*.09)*2)+.19*Math.cos(z*.18-x*.045);
 let c=lerpV(col('#3e6348'),col('#879568'),clamp(patch));
 const bedding=.5+.5*Math.sin(y*1.12+x*.12-z*.075),rock=lerpV(col('#747f71'),col('#b7b296'),bedding*.46+.35);
 const rail=briarRailNear(x,z),fill=rail.point&&rail.distance<5.6&&y<rail.point[1]+.15&&!briarBridgeAt(x,z)&&!briarInTunnel(x,z,2);
 c=lerpV(c,rock,smooth(.08,.33,1-n[1])*(fill?.17:1));
 // Thin dry soils on the ridge, damp moss beneath its feet, managed village turf.
 if(y>7)c=lerpV(c,col('#a5a077'),(1-smooth(.09,.24,1-n[1]))*.14);
 if(x>32&&z>-12&&z<32)c=lerpV(c,col('#819460'),.16);
 c=lerpV(c,col('#a99b7c'),(1-smooth(1.25,2.1,briarRoadNear(x,z).distance))*.8);
 if(y<BRIAR.water+.7)c=lerpV(col('#405c50'),col('#93987e'),smooth(BRIAR.bed,BRIAR.water+.7,y));
 return c;
}
function briarClip(points,field){const out=[];for(let i=0;i<points.length;i++){const a=points[i],q=points[(i+1)%points.length],da=field(a),dq=field(q),inside=da>=0,next=dq>=0;if(inside)out.push(a);if(inside!==next)out.push(lerpV(a,q,da/(da-dq)));}return out;}
function briarTerrain(b){
 const g=BRIAR_GRID,verts=[],ns=[],cs=[],bounds=[];
 for(let j=0;j<=g.nz;j++)for(let i=0;i<=g.nx;i++){const x=BRIAR.minX+i*g.dx,z=BRIAR.minZ+j*g.dz,y=briarGridHeight(i,j);verts.push([x,y,z]);bounds.push(briarPolygonDistance(x,z,BRIAR_OUTLINE));
  const ix0=Math.max(0,i-1),ix1=Math.min(g.nx,i+1),iz0=Math.max(0,j-1),iz1=Math.min(g.nz,j+1);
  ns.push(norm([-(briarGridHeight(ix1,j)-briarGridHeight(ix0,j))/((ix1-ix0)*g.dx),1,-(briarGridHeight(i,iz1)-briarGridHeight(i,iz0))/((iz1-iz0)*g.dz)]));
 }
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
    const center=mul(add(add(points[0],points[n]),points[n+1]),1/3),rail=briarRailNear(center[0],center[2]);
    const fill=rail.point&&rail.distance<5.6&&center[1]<rail.point[1]+.15&&!briarBridgeAt(center[0],center[2])&&!briarInTunnel(center[0],center[2],2),material=fill||normal[1]>=.76?88:3;
    for(const v of[points[0],points[n],points[n+1]]){
     // Smooth shared soil normals remove alternating bright triangle strips.
     // Actual cliff faces retain their crisp normals and collision triangles.
     const original=tri.indexOf(v),N=normal[1]>.32&&original>=0?ns[ids[original]]:normal;
     b.vertex(v,N,briarGroundColor(...v,N),material);
    }
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
 b.box(0,43.2,(front+q.back)/2,2*r+2.3,.4,front-q.back,'#bcb59d',20);
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
 b.cylinder(x,-14.1,z,1.59,1.59,.06,'#f6d5a1',100,14);
 b.sphere(x,-14.06,z,.22,.27,.22,'#ffe0a6',100,7,4);
}
function briarGalleryReceiver(b,which,pos,angle){
 // Plaster alone opts into the room-specific practical-light wash. Its local
 // coordinates travel in UVs, so pools remain attached in the transformed map.
 const mat=which==='back'?94:which==='front'?96:95,c=Math.cos(angle),s=Math.sin(angle);
 for(let i=0;i<b.data.length;i+=12)if(b.data[i+9]===20){b.data[i+9]=mat;b.data[i+10]=c*(b.data[i]-pos[0])-s*(b.data[i+2]-pos[2]);b.data[i+11]=b.data[i+1];}
}

// The Lantern Gallery: room-scale joinery with a quiet railway-club identity.
// Fixed scenic clock, hand-pleated curtains and marquetry; no live clock or new
// frame-loop work. All wall fittings live in their wall's existing cutaway mesh.
function briarGalleryRing(b,x,y,z,r,R,color,mat=41,n=48){
 for(let i=0;i<n;i++){const a=i*TAU/n,q=(i+1)*TAU/n,p=(rr,t)=>[x+Math.sin(t)*rr,y+Math.cos(t)*rr,z];b.quad(p(r,a),p(r,q),p(R,q),p(R,a),color,mat);}
}
function briarGalleryPanel(b,x,y,z,w,h,color,rim='#8e7452'){
 // Five visible bevel faces, with the back buried in an existing wall/case.
 const a=[[-w/2,-h/2,0],[w/2,-h/2,0],[w/2,h/2,0],[-w/2,h/2,0]],t=.22;
 b.push(x,y,z);for(let i=0;i<4;i++){const j=(i+1)%4,p=a[i],q=a[j],into=p=>[p[0]-Math.sign(p[0])*t,p[1]-Math.sign(p[1])*t,.13];b.quad(p,q,into(q),into(p),rim,22);}
 b.quad([-w/2+t,-h/2+t,.10],[w/2-t,-h/2+t,.10],[w/2-t,h/2-t,.10],[-w/2+t,h/2-t,.10],color,22);b.pop();
}
function briarGalleryClock(b){
 b.push(0,20,1.7);
 b.cylinder(0,0,0,9.9,9.9,.70,'#403e31',22,40,PI/2);
 // Backed face discs omit hidden caps and sides within the solid oak bezel.
 for(const [r,z,c,m]of[[9.3,.53,'#aa8753',41],[8.91,.68,'#233f3b',23]])for(let i=0;i<40;i++){const a=i*TAU/40,q=(i+1)*TAU/40;b.tri([0,0,z],[Math.sin(a)*r,Math.cos(a)*r,z],[Math.sin(q)*r,Math.cos(q)*r,z],c,m);}
 for(const [r,R,c]of[[8.48,8.60,'#c8a36b'],[7.26,7.31,'#92764f'],[8.98,9.05,'#edd0a0']])briarGalleryRing(b,0,0,.70,r,R,c);
 for(let i=0;i<60;i++){
  const a=i*TAU/60,major=i%5===0,r=major?7.51:8.02,R=8.32,w=major?.11:.032;
  b.push(0,0,.73,0,0,-a);b.quad([-w,r,0],[w,r,0],[w,R,0],[-w,R,0],major?'#e2c28c':'#a79062',41);b.pop();
 }
 // Small moon-phase subdial and engraved constellation dots. A crafted object,
 // not a working astronomical instrument or a new animated mechanism.
 b.cylinder(0,3.6,.73,1.72,1.72,.06,'#172e30',23,20,PI/2);
 briarGalleryRing(b,0,3.6,.78,1.72,1.77,'#a98c60',41,28);
 for(let i=0;i<16;i++){
  const a=-PI/2+i*PI/16,q=a+PI/16,p=t=>[Math.cos(t)*1.09-.36,3.6+Math.sin(t)*1.09,.80],v=t=>[Math.cos(t)*.69-.36,3.6+Math.sin(t)*1.09,.80];b.quad(p(a),p(q),v(q),v(a),'#dacba0',41);
 }
 for(const [x,y]of[[-1.0,4.45],[-.92,3.05],[.95,3.92],[1.1,3.12]])b.quad([x-.06,y,.80],[x,y+.09,.80],[x+.06,y,.80],[x,y-.09,.80],'#bea781',41);
 // Railway-inspired skeleton hands fixed at ten past ten.
 for(const [a,L,W]of[[PI/3,6.65,.16],[-PI/3,4.50,.25]]){
  b.push(0,0,.87,0,0,-a);b.quad([-W,-.75,0],[W,-.75,0],[W*.45,L-.52,0],[-W*.45,L-.52,0],'#d5b275',41);b.tri([-W*.95,L-.72,0],[0,L,0],[W*.95,L-.72,0],'#ead3a0',41);b.pop();
 }
 b.cylinder(0,0,.95,.33,.33,.12,'#dfbd7d',41,12,PI/2);
 // Brass winged-wheel device below the dial, an original railway-club motif.
 for(const side of[-1,1])for(let i=0;i<3;i++){
  const y=-3.4-i*.43;b.quad([side*.95,y,.77],[side*(3.2-i*.42),y+.35,.77],[side*(2.72-i*.32),y-.03,.77],[side*.95,y-.17,.77],'#b09361',41);
 }
 briarGalleryRing(b,0,-4,.77,.68,.87,'#c4a16c',41,20);
 for(let i=0;i<6;i++){const a=i*TAU/6;b.beam([0,-4,.77],[Math.sin(a)*.66,-4+Math.cos(a)*.66,.77],.026,'#c4a16c',41,4);}
 b.pop();
}
function briarGalleryCurtains(b,x){
 const color='#394f48';b.push(x,0,0);
 b.box(0,43.35,5.3,28,.36,.43,'#715738',22);
 for(const side of[-1,1]){
  const point=(u,v)=>{
   const tie=Math.exp(-(((v-.725)/.17)**2)),spread=2.8-1.30*tie;
   return [side*(10.7+1.5*tie+u*spread),43.15-v*40.5+.15*Math.sin(u*PI),5.22+.34*Math.cos(u*TAU*3)*(1-.50*tie)];
  };
  for(let j=0;j<7;j++)for(let i=0;i<12;i++){
   const u=i/12,U=(i+1)/12,v=j/7,V=(j+1)/7;b.quad(point(u,v),point(U,v),point(U,V),point(u,V),shade(color,.91+.08*Math.cos(u*TAU*3)),23);
  }
  // A narrow sewn hem, visible restrained tieback and hanging tassel.
  for(let j=0;j<9;j++){const a=point(0,j/9),q=point(0,(j+1)/9);b.quad(a,q,add(q,[side*.10,0,.035]),add(a,[side*.10,0,.035]),'#b39a66',23);}
  b.box(side*12.95,13.8,5.70,2.0,.18,.16,'#b29a64',41);
  b.beam([side*13.65,13.8,5.8],[side*13.65,12.15,5.8],.035,'#c1a774',23,4);
  b.cylinder(side*13.65,11.9,5.8,.12,.19,.6,'#ac9260',23,6);
 }
 b.pop();
}
function briarGalleryLantern(b,x,z){
 // Six opal panes replace the collection of little floating light bulbs.
 // The lower light aperture stays at the already surveyed 38.7 light height.
 const n=6,r=1.9,base=38.73,top=41.40,p=(a,y,R=r)=>[x+Math.cos(a)*R,y,z+Math.sin(a)*R];
 b.beam([x,43,z],[x,42.18,z],.065,'#5b4a36',41,5);
 for(let i=0;i<n;i++){
  const a=i*TAU/n,q=(i+1)*TAU/n;
  b.tri(p(a,top,2.06),[x,42.2,z],p(q,top,2.06),'#897047',41);
  b.quad(p(a,base),p(q,base),p(q,top),p(a,top),'#eed4a0',100);
  b.beam(p(a,base-.08),p(a,top+.08),.072,'#745b39',41,4);
  for(const y of[base,base+.25,top-.18,top])b.quad(p(a,y-.055,1.94),p(q,y-.055,1.94),p(q,y+.055,1.94),p(a,y+.055,1.94),'#927547',41);
  // One diamond tracery per pane, assembled from slender solid ribs.
  const mid=(a+q)/2,A=p(mid,40.97,1.68),B=p(q-.16,40.06,1.82),C=p(mid,39.17,1.68),D=p(a+.16,40.06,1.82);
  for(const [v,w]of[[A,B],[B,C],[C,D],[D,A]]){const r=[Math.sin(mid)*.035,0,-Math.cos(mid)*.035];b.quad(sub(v,r),sub(w,r),add(w,r),add(v,r),'#967846',41);}
  b.tri([x,base-.03,z],p(q,base-.03),p(a,base-.03),'#f4dcaf',100);
 }
 b.cylinder(x,base-.3,z,.30,.16,.42,'#96784c',41,8);
}
function briarGalleryBracket(b,x,z,side){
 // Solid curved corbel in the wall plane; both ends meet the post/beam.
 const outline=[[0,33.4],[0,43],[9.3,43],[8.7,42.1],[6.5,41.6],[4.5,40.8],[2.8,39.3],[1.7,37.1],[1.0,34.2]];
 b.push(x,0,z,0,0,0,side,1,1);
 for(let i=1;i<outline.length-1;i++)for(const zz of[-.43,.43])b.tri([...outline[0],zz],[...outline[i],zz],[...outline[i+1],zz],'#795e3f',22);
 for(let i=0;i<outline.length;i++){const a=outline[i],q=outline[(i+1)%outline.length];b.quad([...a,-.43],[...q,-.43],[...q,.43],[...a,.43],'#9b7c51',22);}
 b.pop();
}
function briarGalleryBookcase(b){
 // A single shallow archive cabinet on the entrance wall, well outside the
 // scenic cabinet and aisle. Spines are authored groups, not random clutter.
 b.push(40,0,1.3);b.box(0,(FLOOR+9)/2,1.4,22,9-FLOOR,2.9,'#3d473a',22);
 for(const x of[-11,11])b.box(x,-7,3.12,.85,33,.7,'#897047',22);
 for(const y of[FLOOR+.30,-14.7,-6.5,1.7,9.2])b.box(0,y,3.0,23,.6,1.3,'#9c7c4d',22);
 for(let j=0;j<3;j++)for(let i=0;i<10;i++){
  const x=-9.2+i*2.02,y=-14.4+j*8.2,h=4.3+hash(i,j)*1.7,color=['#6d4c3e','#6c7760','#aa9165','#475d52','#596c6a'][(i+j*2)%5];
  b.box(x,y+h/2,3.04,1.48,h,.38,color,23);
  for(const dy of[.62,h-.58])b.quad([x-.58,y+dy,3.241],[x+.58,y+dy,3.241],[x+.58,y+dy+.09,3.241],[x-.58,y+dy+.09,3.241],'#c5af7d',41);
 }
 b.box(0,9.62,2.0,24,.54,4.2,'#715638',22);
 for(const x of[-5.3,5.3])briarGalleryPanel(b,x,-19,3.1,9.4,6.4,'#405646');
 b.pop();
}
function briarGalleryDrafting(b){
 // The old survey table gets a believable lived-in scale without figures.
 b.push(2,-17.49,47);
 b.box(4.7,.20,.0,1.0,.32,3.1,'#705442',22);b.box(4.7,.38,0,.89,.055,2.88,'#c3b28d',23);
 for(const x of[-4.65,-4.15])b.cylinder(x,.20,-.7,.21,.21,3.3,'#d6c5a0',23,8,PI/2);
 b.box(-.3,.53,1.72,6.4,.08,.20,'#b9a071',41);
 b.beam([2.8,.53,-1.7],[3.2,.53,.4],.040,'#553f2d',22,5);
 b.cylinder(4.1,.035,1.8,.54,.54,.07,'#d5c9a6',23,12);b.cylinder(4.1,.32,1.8,.29,.39,.5,'#d9cfb5',23,10);
 b.cylinder(4.1,.55,1.8,.32,.32,.02,'#60553d',23,10);b.pop();
}
function briarGalleryCompass(b){
 // Flush eight-point timber marquetry in the visitor aisle, not an obstacle.
 const x=6,z=14,y=FLOOR+.035;
 for(let i=0;i<16;i++){
  const a=i*TAU/16,q=(i+1)*TAU/16,r=i%2?2.0:4.7,R=(i+1)%2?2.0:4.7;
  b.tri([x,y,z],[x+Math.sin(a)*r,y,z+Math.cos(a)*r],[x+Math.sin(q)*R,y,z+Math.cos(q)*R],i%2?'#be9e69':'#60553c',22);
 }
 b.push(x,y+.004,z,-PI/2);briarGalleryRing(b,0,0,0,5.15,5.27,'#b79b65',22,48);b.pop();
}

function briarGalleryCove(b,width){
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
function briarGalleryCushion(b,x,y,z,w,h,color){
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
 for(const xx of[-3.43,0,3.43])briarGalleryCushion(b,xx,0,0,3.30,2.84,'#41594b');
 b.pop();
 b.box(0,4.94,1.36,10.48,2.45,.40,'#745839',22);
 for(const xx of[-3.43,0,3.43]){b.push(xx,4.94,1.13,0,PI);briarGalleryCushion(b,0,0,0,3.20,1.88,'#3e594b');b.pop();}
 for(const side of[-1,1]){
  b.box(side*5.06,4.13,-1.10,.26,1.20,.26,'#816442',22);
  b.box(side*5.06,4.76,0,.38,.23,2.91,'#a18a60',22);
 }
 b.pop();
}

function briarShell(b){
 const walls=[],floorStart=b.data.length;b.box(0,FLOOR-.25,0,158,.45,130,'#826c4c',99);
 // Floor grain is room-local and survives the live map transform.
 for(let i=floorStart;i<b.data.length;i+=12){b.data[i+10]=b.data[i];b.data[i+11]=b.data[i+2];}
 b.box(2,-18,47,12,1.0,5,'#6d553a',22);
 for(const x of[-2,6])for(const z of[45,49])b.box(x,-21,z,.6,6,.6,'#5d4934',22);
 b.box(2,-17.25,47,7,.36,4.8,'#d8c9a6',23);b.push(2,-17.02,47,-PI/2);roomSign(b,'blueprint',0,0,0,6.8,4.5);b.pop();
 briarGalleryDrafting(b);briarGalleryCompass(b);
 for(const x of[-24,24])briarGalleryBench(b,x);
 for(const x of[-24,24])briarReadingLamp(b,x,56);
 b.box(0,FLOOR+.018,51,53,.035,5.2,'#66463b',23);b.box(0,FLOOR+.038,51,49,.018,4.55,'#8d7250',23);
 for(let i=0;i<22;i++){const x=-23.1+i*2.2;for(const z of[48.94,53.06])b.quad([x-.32,FLOOR+.051,z],[x,FLOOR+.051,z+.2],[x+.32,FLOOR+.051,z],[x,FLOOR+.051,z-.2],'#b6a078',23);}
 for(const which of['back','left','right','front']){
  const w=new Builder(),back=which==='back',front=which==='front',side=!back&&!front,width=back||front?156:128,pos=back?[0,0,-64]:front?[0,0,64]:which==='left'?[-78,0,0]:[78,0,0],angle=back?0:front?PI:which==='left'?PI/2:-PI/2;
  w.push(...pos,0,angle);
  w.box(0,13,0,width,74,.6,'#bcb9a1',20);
  w.box(0,-10.2,.45,width,27.2,.6,'#30453d',22);
  // Substantial dado and a two-tier cornice give the tall room a human scale.
  for(const [y,h,z,d,c]of[[-23.2,.62,.92,1.05,'#594835'],[3.4,.58,1.0,1.5,'#88704b'],[4.1,.14,1.15,1.7,'#b59a67'],[42.7,1.25,1.02,1.65,'#6e5539'],[43.5,.28,1.25,2.2,'#a78957'],[49.1,.55,.85,1.4,'#715637']])w.box(0,y,z,width,h,d,c,22);
  for(let x=-width/2+7;x<width/2-4;x+=12){briarGalleryPanel(w,x,-15.9,.89,9.5,12.4,'#3c5547');briarGalleryPanel(w,x,-2.3,.89,9.5,11.0,'#364b42');}
  // Broad paired pilasters and inset capitals replace the thin scaffolding.
  const posts=back||front?[-72,-60,-25,25,60,72]:[-59,-8,8,59];
  for(const x of posts){
   w.box(x,23.2,1.02,.92,38.5,.96,'#654f38',22);w.box(x,23.2,1.52,.12,37.9,.06,'#b59664',41);
   for(const y of[4.8,39.8])w.box(x,y,1.28,1.65,.75,1.37,'#92734d',22);
  }
  briarGalleryCove(w,width);
  if(back){
   for(const [i,x]of[-42,42].entries()){briarEstateOutlook(w,x,i);briarGalleryCurtains(w,x);}
   w.box(0,21,1.0,36,35,.50,'#2e4741',22);
   briarGalleryPanel(w,0,20,1.33,32,31,'#35554b','#a88a57');briarGalleryClock(w);
   for(const x of[-17.2,17.2])w.box(x,21,1.43,.24,33,.18,'#b49a66',41);
   const key='house-'+Object.keys(HOUSE_ROOMS).indexOf('briarwatch');if(roomLabels[key])roomFrame(w,key,0,40.2,1.65,42,6.0);
  }else if(side){
   roomFrame(w,'blueprint',-30,19,1.15,24,18);roomFrame(w,'slow',30,19,1.15,16,22);
   // Gallery picture rails and fine suspension rods make the artwork belong.
   w.box(0,36.2,1.0,width,.27,.55,'#a88b59',22);
   for(const [x,W,H]of[[-30,24,18],[30,16,22]]){
    for(const s of[-1,1])w.beam([x+s*W*.28,36.2,1.3],[x+s*W*.28,19+H*.5,1.3],.023,'#957e55',41,4);
    w.box(x,19-H*.5-1.2,1.30,7.5,.43,.15,'#baa06b',41);
   }
  }
  if(front){
   w.box(0,-3,1,22,44,1,'#5a4733',22);w.box(0,-3,1.62,16,39,.22,'#344b40',22);
   for(const x of[-4.1,4.1])for(const y of[-14,0,11.3])briarGalleryPanel(w,x,y,1.8,6.65,y===11.3?7.6:11.9,'#365144');
   for(const x of[-10.1,10.1])w.box(x,-3,1.85,1.0,43,1.45,'#a68a5a',22);
   w.box(0,19.0,1.7,24,1.1,2.0,'#92734c',22);w.cylinder(6,-4,2.08,.35,.35,.5,'#c3a977',41,10,PI/2);roomFrame(w,'shop-sign',0,25,1.05,35,7.0);
   briarGalleryBookcase(w);roomFrame(w,'blueprint',-40,7,1.1,24,19);
  }
  const sconces=back?[-65,-19,19,65]:side?[-47,-15,15,47]:[-55,-30,30,55];
  for(const x of sconces){
   w.box(x,25,1.32,.50,3.5,.42,'#76603f',41);w.beam([x,24.4,1.40],[x,23.1,2.3],.06,'#b1945f',41,5);
   w.cylinder(x,22.85,2.3,.81,.38,.80,'#ad8a55',41,8);w.cylinder(x,22.40,2.3,.69,.69,.06,'#f0d9a7',25,8);
  }
  if(back||front){
   // Short outriggers meet the wall's posts; no full-width foreground truss
   // or hanging V-shaped braces obscure the miniature/clock.
   const z=back?15:18,lampZ=back?19:20;
   w.box(0,43.0,z,154,1.15,1.2,'#604b35',22);w.box(0,43.68,z,154,.16,1.40,'#9e8153',22);
   for(const x of[-72,72]){
    w.box(x,43,z/2,1.1,1.05,z+1.1,'#6b5439',22);
    briarGalleryBracket(w,x,1.55,-Math.sign(x));
    w.beam([x,36,1.8],[x,43,z],.25,'#7d623f',22,4);
   }
   for(const x of[-44,44]){w.box(x,43,(z+lampZ)/2,.32,.40,lampZ-z+.2,'#806742',22);briarGalleryLantern(w,x,lampZ);}
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
// Share an error-bounded sampling of both track edges across all six ribbons.
// Straight track needs two endpoints, while curved/graded track keeps its shape.
const BRIAR_TRACK_STATIONS=new WeakMap();
function briarTrackStations(e){
 if(BRIAR_TRACK_STATIONS.has(e))return BRIAR_TRACK_STATIONS.get(e);
 const out=[0],at=d=>{const q=e.at(d),r=norm([q.f[2],0,-q.f[0]]);return [-.80,.80].map(w=>add(q.p,mul(r,w)));};
 const split=(a,z,depth=0)=>{
  const A=at(a),Z=at(z);let error=0;
  for(const t of[.25,.5,.75]){const M=at(mix(a,z,t));for(let side=0;side<2;side++)error=Math.max(error,len(sub(M[side],lerpV(A[side],Z[side],t))));}
  if(error>.012&&z-a>.24&&depth<12){const mid=(a+z)/2;split(a,mid,depth+1);split(mid,z,depth+1);}else out.push(z);
 };
 for(let a=0;a<e.length;a+=2)split(a,Math.min(e.length,a+2));
 BRIAR_TRACK_STATIONS.set(e,out);return out;
}
function briarTrackRibbon(b,e,width,offset,yoff,c,mat){
 const ds=briarTrackStations(e),point=(d,side)=>{const q=e.at(d),r=norm([q.f[2],0,-q.f[0]]);return add(add(q.p,mul(r,offset+side*width/2)),[0,yoff,0]);};
 for(let i=1;i<ds.length;i++){const a=ds[i-1],q=ds[i];b.quad(point(a,-1),point(q,-1),point(q,1),point(a,1),c,mat,[0,1,0],[[0,a],[0,q],[1,q],[1,a]]);}
}
function briarTrack(b,e){
 briarTrackRibbon(b,e,1.55,0,-.245,'#697568',9);briarTrackRibbon(b,e,1.35,0,-.15,'#899082',9);
 for(let d=0;d<e.length;d+=.34){const a=e.at(d);b.matrix(basis(a.p,a.f));briarSleeper(b,shade('#695d46',.85+.22*hash(d,e.length)));
  for(const s of[-1,1])b.quad([s*.32-.073,-.012,-.085],[s*.32+.073,-.012,-.085],[s*.32+.073,-.012,.085],[s*.32-.073,-.012,.085],'#45564e',11);b.pop();
 }
 for(const s of[-1,1]){briarTrackRibbon(b,e,.058,s*.32,.020,'#4f615b',11);briarTrackRibbon(b,e,.072,s*.32,.059,'#b8bfb0',1);}
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
const BRIAR_HERO_TREES=[
 {x:-57,z:11,name:'The gate oak',spread:1.16,lean:.13,angle:2.30},
 {x:-58,z:-8,name:'The quarry veteran',spread:1.10,lean:.09,angle:-1.25},
 {x:-27,z:39,name:'The trestle oak',spread:1.10,lean:.12,angle:1.35},
 {x:29,z:-12,name:'The mill willow',spread:1.08,lean:.14,angle:-2.15},
 {x:20,z:-10,name:'The ferryman willow',spread:1.08,lean:.13,angle:-1.00},
 {x:51,z:-35,name:'The watch-ridge pine',spread:1.05,lean:.095,angle:.70},
 {x:33,z:26,name:'The orchard fork',spread:1.13,lean:.10,angle:-.8}
];
function briarTwig(b,a,q,width,c){
 // A very small twig is a tapered five-sided branch, never a leaf-colored pole.
 briarTaperBranch(b,a,q,width,.005,c);
}
function briarFoliagePad(b,p,w,h,d,c,id){
 b.push(...p,0,hash(id,3)*.4,0,w,h,d);briarLeafCloud(b,[0,0,0],1,c,id);b.pop();
}
function briarTree(b,x,z,h,kind='oak'){
 if(!briarInside(x,z,1))return;
 const y=briarSurface(x,z),id=x*3+z,hero=BRIAR_HERO_TREES.find(t=>t.x===x&&t.z===z),apple=kind==='apple',pine=kind==='pine',willow=kind==='willow',beech=kind==='beech';
 const bark=beech?'#84867a':willow?'#696c52':'#665b44',angle=hero?.angle??hash(x,z)*TAU,lean=hero?.lean??(pine?.045:.06),spread=hero?.spread??1;
 const sway=[Math.sin(angle)*h*lean,0,Math.cos(angle)*h*lean];
 const P=(xx,yy,zz)=>[x+xx,y+yy,z+zz],stem=[P(0,-.12,0),P(-sway[0]*.14,h*.15,-sway[2]*.1),P(sway[0]*.38,h*.31,sway[2]*.33),P(sway[0],h*(beech?.57:apple?.35:.44),sway[2])];
 const radius=h*(apple?.066:beech?.046:pine?.046:hero?.078:.066);
 for(let i=1;i<stem.length;i++)briarTaperBranch(b,stem[i-1],stem[i],radius*[1,.65,.46][i-1],radius*[.65,.46,.31][i-1],bark);
 // Splayed buttress roots bite into the same surface triangles as the terrain.
 for(let i=0;i<5;i++){
  const a=angle+i*1.29,rr=h*(.115+.026*hash(i,id)),xx=x+Math.cos(a)*rr,zz=z+Math.sin(a)*rr;
  if(!briarInside(xx,zz,.25))continue;
  const end=[xx,briarSurface(xx,zz)+.025,zz],mid=lerpV(P(0,.24,0),end,.56);mid[1]=Math.max(mid[1],briarSurface(mid[0],mid[2])+.07);
  if(hero){briarTaperBranch(b,P(0,.23,0),mid,radius*.42,radius*.19,bark);briarTaperBranch(b,mid,end,radius*.19,.012,bark);}else briarTaperBranch(b,P(0,.23,0),end,radius*.36,.012,bark);
 }
 const fork=stem[3];
 if(pine){
  const tip=P(sway[0]*1.55,h,sway[2]*1.35);briarTaperBranch(b,fork,tip,radius*.35,.008,bark);
  // Wind-combed needle shelves alternate with empty whorls and visible elbows.
  for(let j=0;j<6;j++)for(let k=0;k<2;k++){
   const a=angle+j*1.61+k*2.69,rr=h*(.26-j*.030)*(.80+.30*hash(j+k,id)),yy=h*(.35+j*.105);
   const start=lerpV(fork,tip,clamp((yy/h-.44)/.56)),elbow=P(sway[0]*j/6+Math.cos(a)*rr*.66,yy-h*.045,sway[2]*j/6+Math.sin(a)*rr*.66),q=P(sway[0]*j/6+Math.cos(a)*rr,yy+h*.015,sway[2]*j/6+Math.sin(a)*rr);
   briarTaperBranch(b,start,elbow,h*.010,.012,bark);briarTwig(b,elbow,q,.014,bark);
   const w=h*(.157-j*.015)*spread;
   briarFoliagePad(b,add(q,[0,h*.035,0]),w,w*.53,w*.89,['#345c49','#436b50','#628265'][(j+k)%3],id+j*7+k);
  }
  for(let i=0;i<3;i++){
   const a=angle+i*2.2,q=P(Math.cos(a)*h*.17,h*.27,Math.sin(a)*h*.17);briarTwig(b,stem[2],q,h*.012,bark);briarTwig(b,q,add(q,[Math.cos(a+.7)*h*.06,-h*.015,Math.sin(a+.7)*h*.06]),.015,'#8c8b73');
  }
  briarFoliagePad(b,add(tip,[0,-h*.03,0]),h*.065,h*.12,h*.07,'#6b8766',id);return;
 }
 const colors=apple?['#638445','#849951','#759051']:willow?['#6e9062','#8ea67b','#7f9d6d']:beech?['#69814d','#95a36d','#7b955c']:['#486e45','#759056','#597b47'];
 const limbs=beech?5:6;
 for(let i=0;i<limbs;i++){
  const a=angle+i*2.399,reach=h*(beech?.245:apple?.31:.33)*spread*(.77+.25*hash(i,id)),rise=beech?.77:apple?.62:i===4?.90:.58+.14*hash(id,i);
  const start=i<2?stem[2]:fork,end=P(Math.cos(a)*reach+sway[0],h*rise,Math.sin(a)*reach+sway[2]),elbow=lerpV(start,end,.52);
  elbow[1]-=h*(apple?.08:.07);briarTaperBranch(b,start,elbow,radius*(i===0?.43:.34),radius*.18,bark);briarTaperBranch(b,elbow,end,radius*.18,.012,bark);
  // One bleached broken branch creates negative space in an old crown.
  if(kind==='dead'||(hero&&i===2&&!willow&& !apple)){
   const q=add(end,[Math.cos(a)*h*.06,h*.025,Math.sin(a)*h*.06]);briarTwig(b,end,q,h*.02,'#9e9578');
   briarTwig(b,elbow,add(elbow,[Math.sin(a)*h*.12,h*.08,-Math.cos(a)*h*.12]),h*.022,bark);continue;
  }
  for(let j=0;j<2;j++){
   const aa=a+(j-.55)*1.04,q=add(end,[Math.cos(aa)*h*.09,h*(j===0?.06:.015),Math.sin(aa)*h*.09]);briarTwig(b,end,q,h*.011,bark);
   const w=h*(beech?.176:apple?.178:willow?.19:.212)*spread;
   briarFoliagePad(b,q,w,w*(beech?1.30:apple?.71:.79),w*.89,colors[(i+j)%3],id+i*11+j);
   // Tiny detached edge clusters and exposed twigs soften the silhouette without
   // filling every opening in the crown with a second overlapping sphere.
   if(i%3===0){const twig=add(q,[Math.cos(aa+.4)*w*.88,w*.05,Math.sin(aa+.4)*w*.88]);briarTwig(b,q,twig,h*.007,bark);briarFoliagePad(b,twig,w*.37,w*.38,w*.35,colors[(i+j+1)%3],id+i*13+j+83);}
   if(willow)for(let k=0;k<4;k++){
    const a2=aa+k*1.62,origin=add(q,[Math.cos(a2)*w*.8,0,Math.sin(a2)*w*.8]),drop=h*(.24+.10*hash(i+k,id)),drift=[Math.sin(angle)*h*.08,0,Math.cos(angle)*h*.08];
    for(let n=0;n<3;n++){
     const v=n/3,u=(n+1)/3,F=t=>add(origin,[drift[0]*t*t,-drop*t,drift[2]*t*t]),A=F(v),Z=F(u),r=[Math.cos(a2)*.095,0,Math.sin(a2)*.095];
     b.quad(sub(A,r),add(A,r),add(Z,mul(r,.45)),sub(Z,mul(r,.45)),colors[(i+k)%3],8);
    }
   }
   if(apple&&i%2===0){const fruit=add(q,[0,-w*.43,0]);b.sphere(...fruit,.07,.082,.07,'#aa6040',23,5,3);}
  }
 }
 // A weathered trunk seam and a scar, visible only at close range.
 if(hero&&!willow){const q=lerpV(stem[1],stem[2],.55);briarTwig(b,add(q,[radius*.30,0,radius*.33]),add(q,[radius*.27,h*.13,radius*.31]),.014,'#464d39');}
}
function briarFern(b,x,z,s=1){if(!briarInside(x,z,.3))return;const y=briarSurface(x,z);for(let i=0;i<7;i++){const a=i*2.4,p=[x,y,z],q=[x+Math.cos(a)*s*.5,y+s*.38,z+Math.sin(a)*s*.5];briarTaperBranch(b,p,q,.013,.004,'#627850');for(let k=1;k<5;k++){const v=lerpV(p,q,k/5),w=s*.15*(1-k/6),r=[Math.sin(a)*w,0,-Math.cos(a)*w];b.tri(v,add(v,r),add(v,[Math.cos(a)*s*.17,s*.05,Math.sin(a)*s*.17]),'#759659',8);b.tri(v,sub(v,r),add(v,[Math.cos(a)*s*.17,s*.05,Math.sin(a)*s*.17]),'#648c51',8);}}}
// Surface-conforming islands, not large floating grass discs. Edges and centers
// use the emitted terrain sampler, and no patch crosses a path, rail or water.
function briarFieldSafe(x,z,margin=1.8){
 return briarInside(x,z,.8)&&briarRailNear(x,z).distance>margin&&briarRoadNear(x,z).distance>1.6&&briarSurface(x,z)>BRIAR.water+.20;
}
function briarLeafLitter(b,x,z,r,id){
 if(!briarFieldSafe(x,z,2))return;
 for(let i=0;i<9;i++){
  const a=i*2.399,rr=r*Math.sqrt(hash(i,id)),xx=x+Math.cos(a)*rr,zz=z+Math.sin(a)*rr;
  if(!briarFieldSafe(xx,zz,2))continue;
  const y=briarSurface(xx,zz)+.025,rx=.14+.13*hash(i+4,id),rz=rx*.48;
  b.tri([xx-rx,y,zz],[xx,y+.026,zz+rz],[xx+rx,y,zz],i%2?'#858261':'#7b7857',9);
 }
}
function briarFieldDetails(b){
 for(const t of BRIAR_TREES){if(t[3]!=='pine')briarLeafLitter(b,t[0],t[1],t[2]*.30,t[0]-t[1]);}
 // Flower spikes and seed heads only at sunny woodland margins, not scattered
 // uniformly across roofs, paths or the open castle court.
 for(const [x,z,r,id]of[[-55,30,3.3,1],[-43,37,3.1,2],[-17,24,2.1,3],[30,27,1.8,4],[59,-14,2.5,5],[47,-17,2.5,6]])for(let i=0;i<13;i++){
  const a=i*2.399,rr=r*Math.sqrt(hash(i,id)),xx=x+Math.cos(a)*rr,zz=z+Math.sin(a)*rr;
  if(!briarFieldSafe(xx,zz,2.0))continue;
  const y=briarSurface(xx,zz),h=.30+.39*hash(i,id);
  b.tri([xx-.035,y,zz],[xx+.045,y+h,zz+.03],[xx+.035,y,zz], '#76854d',8);
  for(let j=0;j<4;j++){
   const yy=y+h*(.5+j*.12),dx=j%2?.057:-.057,sz=.055-j*.007;
   b.tri([xx+dx-sz,yy,zz],[xx+dx+sz,yy,zz],[xx+dx,yy+.08,zz+.028],id%2?'#b7a9c0':'#d1c99a',8);
  }
 }
 // Quarry spoil: flat angular plates separated by cracks, seated in the slope.
 for(const [id,x,z]of[[1,-59,4],[2,-48,29],[3,-21,24],[4,50,-16],[5,-40,-47]])for(let i=0;i<11;i++){
  const a=i*2.399,rr=2.6*Math.sqrt(hash(i,id)),xx=x+Math.cos(a)*rr,zz=z+Math.sin(a)*rr;if(!briarFieldSafe(xx,zz,2.3))continue;
  const y=briarSurface(xx,zz),w=.16+.38*hash(id,i),q=[xx+w*.18,y+.11,zz-w*.10],rim=[];
  for(let j=0;j<5;j++){const aa=j*TAU/5+i,rx=Math.cos(aa)*w,rz=Math.sin(aa)*w*.66;rim.push([xx+rx,briarSurface(xx+rx,zz+rz)+.035,zz+rz]);}
  for(let j=0;j<5;j++)b.tri(q,rim[j],rim[(j+1)%5],i%3?'#a4a58d':'#8b957b',3);
 }
 // A pollarded stump, a cut face and a moss-covered windfall beside the ravine.
 const x=-32,z=38,y=briarSurface(x,z);briarTaperBranch(b,[x,y-.08,z],[x+.07,y+.8,z-.04],.33,.25,'#74674e');
 b.cylinder(x+.07,y+.805,z-.04,.235,.235,.015,'#bb9d69',22,7);
 for(let i=0;i<4;i++){const xx=x-1.4+i*.65,zz=z-.40-i*.23,yy=briarSurface(xx,zz);briarFoliagePad(b,[xx,yy+.11,zz],.23,.09,.18,'#718754',i*19+126);}
}
function briarNature(b){
 briarEscarpments(b);briarWoodlandFloor(b);briarWatchRuin(b);briarSpring(b);briarFieldDetails(b);
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
 scene.routes=[BRIAR_ROUTE];scene.trains=[{edge:BRIAR_ROUTE,distance:125,speed:.90,type:'steam',stock:'coast',finish:'briarwatch',cars:3}];
 scene.height=(x,z)=>briarInside(x,z)?Math.max(BRIAR.water,briarSurface(x,z)):FLOOR;scene.canPlace=()=>false;
 scene.briarwatch={revision:4,heroTrees:BRIAR_HERO_TREES.length,castle:'Briarwatch',railway:'The Crown & Cinder Line',layout:'Walk-in horseshoe with two scenic peninsulas',villageBuildings:BRIAR_BUILDINGS.length,trees:BRIAR_TREES.length,watchRuin:true,spring:true};
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
