'use strict';

// An architectural cutaway at the exhibition's actual scale. It shares the
// gallery plans and furniture with the Hall, while leaving its renderer asleep.
const grandHallMapBounds=[GRAND_HALL_BOUNDS.x1-GRAND_HALL_BOUNDS.x0,GRAND_HALL_BOUNDS.z1-GRAND_HALL_BOUNDS.z0].map(n=>n*GRAND_HALL_UNIT_SCALE);
const grandHallMapCenter=[(GRAND_HALL_BOUNDS.x0+GRAND_HALL_BOUNDS.x1)/2,(GRAND_HALL_BOUNDS.z0+GRAND_HALL_BOUNDS.z1)/2];
function grandHallMapPoint(x,z){return[(x-grandHallMapCenter[0])*GRAND_HALL_UNIT_SCALE,FLOOR,(z-grandHallMapCenter[1])*GRAND_HALL_UNIT_SCALE];}
function grandHallMapDoor(door){
 const r=GRAND_HALL_GALLERIES[door.room],side=door.side;
 return{x:r.x+(side==='left'?-r.width/2:side==='right'?r.width/2:door.at),z:r.z+(side==='back'?-r.depth/2:side==='front'?r.depth/2:door.at),side};
}
function grandHallMapOpenings(index,side){
 const r=GRAND_HALL_GALLERIES[index],openings=[];
 for(const p of GRAND_HALL_PASSAGES){
  const end=p.from===index?p.p0:p.to===index?p.p1:null;if(!end)continue;
  if(side==='left'&&Math.abs(end[0]-(r.x-r.width/2))<.01||side==='right'&&Math.abs(end[0]-(r.x+r.width/2))<.01)openings.push([end[1]-r.z,p.width]);
  if(side==='back'&&Math.abs(end[1]-(r.z-r.depth/2))<.01||side==='front'&&Math.abs(end[1]-(r.z+r.depth/2))<.01)openings.push([end[0]-r.x,p.width]);
 }
 for(const door of GRAND_HALL_HOUSE_DOORS)if(door.room===index&&door.side===side)openings.push([door.at,5.4]);
 return openings;
}
function grandHallMapWall(b,r,index,side){
 const vertical=side==='left'||side==='right',length=vertical?r.depth:r.width,half=length/2;
 const openings=grandHallMapOpenings(index,side).map(([at,width])=>[Math.max(-half,at-width/2),Math.min(half,at+width/2)]).sort((a,c)=>a[0]-c[0]);
 let start=-half;const spans=[];
 for(const [lo,hi]of openings){if(lo>start)spans.push([start,lo]);start=Math.max(start,hi);}if(start<half)spans.push([start,half]);
 const wallHeight=r.roof==='glasshouse'?.58:side==='back'?2.18:r.roof==='clerestory'?1.4:1.14;
 for(const [lo,hi]of spans){
  const along=(lo+hi)/2,span=hi-lo,x=vertical?(side==='left'?-r.width/2:r.width/2):along,z=vertical?along:(side==='back'?-r.depth/2:r.depth/2);
  b.box(x,wallHeight/2,z,vertical?.38:span,wallHeight,vertical?span:.38,r.palette.wall,24);
  b.box(x,wallHeight+.07,z,vertical?.47:span,.14,vertical?span:.47,r.palette.trim,22);
 }
 // Door reveals, rather than an unbroken edge, explain how galleries connect.
 for(const [at,width]of grandHallMapOpenings(index,side))for(const sign of[-1,1]){
  const along=at+sign*(width/2+.18),x=vertical?(side==='left'?-r.width/2:r.width/2):along,z=vertical?along:(side==='back'?-r.depth/2:r.depth/2);
  b.box(x,2.55,z,.46,5.1,.46,r.palette.trim,24);
  b.box(x,5.17,z,.63,.22,.63,r.palette.metal,41);
 }
}
function grandHallMapRib(b,points,radius,color){for(let i=1;i<points.length;i++)b.beam(points[i-1],points[i],radius*1.35,color,42,4);}
function grandHallMapRoof(b,r){
 const w=r.width/2-.35,d=r.depth/2-.35,h=r.height,c=r.palette.metal;
 if(r.roof==='vault'){
  for(const z of[-d*.82,0,d*.82]){
   for(const side of[-1,1])b.box(side*w,4.1,z,.43,8.2,.43,r.palette.trim,24);
   const points=[];for(let j=0;j<=12;j++){const a=j*PI/12;points.push([-Math.cos(a)*w,8.2+Math.sin(a)*(h-8.2),z]);}grandHallMapRib(b,points,.11,c);
  }
  b.beam([0,h,-d*.82],[0,h,d*.82],.10,c,41,4);
  // Lifted roof margins retain the barrel-vault silhouette of the real Hall.
  for(const side of[-1,1])b.quad([side*w,8.2,-d*.82],[side*w*.84,8.2+Math.sqrt(1-.84*.84)*(h-8.2),-d*.82],[side*w*.84,8.2+Math.sqrt(1-.84*.84)*(h-8.2),d*.82],[side*w,8.2,d*.82],'#718677',20);

  // The rear glazed tympanum closes the real vault. Retain that silhouette in
  // the cutaway without raising a solid front wall across the collection.
  const z=-d+.12;
  for(let i=0;i<12;i++){const a=i*PI/12,q=(i+1)*PI/12,p0=[Math.cos(a)*w,8.2+Math.sin(a)*(h-8.2),z],p1=[Math.cos(q)*w,8.2+Math.sin(q)*(h-8.2),z];
   b.tri([0,8.2,z],p0,p1,'#b4c6b8',6);b.beam(p0,p1,.075,c,41,4);
  }
  b.box(0,8.2,z,w*2,.18,.26,r.palette.trim,24);
  for(const x of[-w*.75,-w*.5,-w*.25,0,w*.25,w*.5,w*.75]){const top=8.2+Math.sqrt(1-x*x/(w*w))*(h-8.2);b.box(x,(top+8.2)/2,z+.06,.07,top-8.2,.12,c,41);}
 }else if(r.roof==='sawtooth'){
  for(const side of[-1,1]){
   const x=side*w;for(let j=0;j<4;j++){const z=-d+j*(2*d/3);b.box(x,3.3,z,.7,6.6,.7,r.palette.wall,24);}
   for(let j=0;j<3;j++){const z=-d+j*2*d/3;grandHallMapRib(b,[[x,6.6,z],[x,h,z+2*d/3-.9],[x,6.6,z+2*d/3]],.13,c);}
  }
  for(const z of[-d,d])b.beam([-w,6.6,z],[w,6.6,z],.13,c,41,4);
  for(let j=0;j<3;j++){const z=-d+j*2*d/3,q=z+2*d/3-.9;b.quad([-w,6.6,z],[-w*.64,6.6,z],[-w*.64,h,q],[-w,h,q],'#748279',20);}
 }else if(r.roof==='glasshouse'){
  for(let j=0;j<5;j++){
   const z=-d+j*d/2;grandHallMapRib(b,[[-w,.6,z],[-w,6.8,z],[0,h,z],[w,6.8,z],[w,.6,z]],.075,c);
  }
  for(const x of[-w,0,w])b.beam([x,x===0?h:6.8,-d],[x,x===0?h:6.8,d],.065,c,41,4);
  for(const end of[-d,d-2.4])for(const side of[-1,1])b.quad([side*w,6.8,end],[0,h,end],[0,h,end+2.4],[side*w,6.8,end+2.4],'#9fb7a3',43);
 }else if(r.roof==='lantern'){
  for(const side of[-1,1])for(const sign of[-1,1]){
   b.box(side*w,3,sign*d,.5,6,.5,r.palette.trim,22);
   grandHallMapRib(b,[[side*w,6,sign*d],[side*w*.43,h,sign*d*.42]],.11,c);
  }
  for(const side of[-1,1]){b.beam([-w*.43,h,side*d*.42],[w*.43,h,side*d*.42],.09,c,41,4);b.beam([side*w*.43,h,-d*.42],[side*w*.43,h,d*.42],.09,c,41,4);
   b.quad([-w,6,side*d],[w,6,side*d],[w*.88,6.51,side*d*.88],[-w*.88,6.51,side*d*.88],'#a9ae8e',20);
  }
 }else if(r.roof==='clerestory'){
  for(const side of[-1,1])for(const z of[-d,d])b.box(side*w,3.45,z,.55,6.9,.55,r.palette.wall,24);
  for(const side of[-1,1])b.box(0,6.84,side*d,r.width,.32,.5,r.palette.trim,24);
  for(let j=0;j<=6;j++)b.box(-w+j*2*w/6,7.77,-d,.15,1.7,.21,c,41);
  b.box(0,h,-d+.6,r.width,.20,1.6,r.palette.trim,24);
 }else if(r.roof==='octagon'){
  const points=Array.from({length:8},(_,i)=>{const a=(i+.5)*PI/4;return[Math.sin(a)*w*.76,h,Math.cos(a)*d*.68];});
  for(let i=0;i<8;i++){
   const p=points[i],q=points[(i+1)%8];b.beam(p,q,.10,c,41,4);
   b.quad(p,q,[q[0]*.86,h,q[2]*.86],[p[0]*.86,h,p[2]*.86],'#a3906c',22);
   if(i%2===0)b.box(p[0],h/2,p[2],.29,h,.29,r.palette.trim,22);
  }
 }else if(r.roof==='shed'){
  for(const z of[-d,0,d]){
   for(const side of[-1,1])b.box(side*w,(side<0?h:5.8)/2,z,.48,side<0?h:5.8,.48,r.palette.trim,22);
   b.beam([-w,h,z],[w,5.8,z],.16,r.palette.trim,22,4);
   b.beam([-w,h-1.1,z],[w,4.7,z],.035,c,41,4);
  }
  b.quad([-w,h,-d],[w,5.8,-d],[w,5.8,-d+2.6],[-w,h,-d+2.6],'#9d9f80',20);
 }
}
function grandHallMapRearWindows(b,r){
 const width=Math.min(6,r.width*.18),height=r.roof==='vault'?4.5:r.roof==='glasshouse'?4.0:3.2,z=-r.depth/2+.14,bottom=r.roof==='glasshouse'?1.25:2.18;
 for(const side of[-1,1]){
  const x=side*r.width*.29,y=bottom+height/2;
  b.quad([x-width/2,bottom,z],[x+width/2,bottom,z],[x+width/2,bottom+height,z],[x-width/2,bottom+height,z],r.roof==='octagon'?'#a89875':'#92a99a',6);
  for(const dx of[-width/2,width/2])b.box(x+dx,y,z+.07,.21,height+.2,.23,r.palette.trim,22);
  for(const dy of[-height/2,height/2])b.box(x,y+dy,z+.07,width+.3,.20,.24,r.palette.trim,22);
  b.box(x,y+.24,z+.12,width,.085,.15,r.palette.trim,22);
  b.box(x,bottom-.1,z+.18,width+.42,.18,.65,r.palette.trim,24);
  for(const dx of[-width/4,0,width/4])b.box(x+dx,y,z+.10,dx===0?.085:.045,height,.13,r.palette.metal,41);
 }
}
function grandHallMapCase(b,bay){
 if(!bay.displayFormat||bay.displayFormat==='open-table')return;
 const w=bay.w-.22,d=bay.d-.22,y=bay.y+.025,h=bay.maxHeight+.075,c=GRAND_HALL_GALLERIES[bay.room].palette.metal,t=.045;
 // Crossed ribbons keep the case frames readable from any map orbit without
 // opaque glass panels hiding empty surfaces or introducing another renderer.
 if(bay.displayFormat==='round-vitrine'){
  const radius=w/2;
  for(let i=0;i<12;i++){
   const a=i*TAU/12,q=(i+1)*TAU/12;
   b.quad([Math.sin(a)*(radius-t),y+h,Math.cos(a)*(radius-t)],[Math.sin(q)*(radius-t),y+h,Math.cos(q)*(radius-t)],[Math.sin(q)*(radius+t),y+h,Math.cos(q)*(radius+t)],[Math.sin(a)*(radius+t),y+h,Math.cos(a)*(radius+t)],c,42);
   if(i%3===0){const x=Math.sin(a)*radius,z=Math.cos(a)*radius;
    b.quad([x-t,y,z],[x+t,y,z],[x+t,y+h,z],[x-t,y+h,z],c,42);
    b.quad([x,y,z-t],[x,y,z+t],[x,y+h,z+t],[x,y+h,z-t],c,42);
   }
  }
  return;
 }
 for(const x of[-w/2,w/2])for(const z of[-d/2,d/2]){
  b.quad([x-t,y,z],[x+t,y,z],[x+t,y+h,z],[x-t,y+h,z],c,42);
  b.quad([x,y,z-t],[x,y,z+t],[x,y+h,z+t],[x,y+h,z-t],c,42);
 }
 for(const side of[-1,1]){
  b.quad([-w/2,y+h,side*d/2-t],[w/2,y+h,side*d/2-t],[w/2,y+h,side*d/2+t],[-w/2,y+h,side*d/2+t],c,42);
  b.quad([side*w/2-t,y+h,-d/2],[side*w/2+t,y+h,-d/2],[side*w/2+t,y+h,d/2],[side*w/2-t,y+h,d/2],c,42);
 }
 if(bay.displayFormat==='wall-case')b.quad([-w/2,y,-d/2],[w/2,y,-d/2],[w/2,y+h,-d/2],[-w/2,y+h,-d/2],'#a9a28d',23);
}
function grandHallMapFurniture(b,bay,occupied=false){
 const r=GRAND_HALL_GALLERIES[bay.room],{w,d,y,surfaceY}=bay,kind=bay.furniture;
 b.push(bay.x,0,bay.z,0,bay.yaw);
 if(kind==='round'){
  b.cylinder(0,(y-.18)/2,0,w*.28,w*.23,y-.18,'#8c9781',24,10);
  b.cylinder(0,surfaceY-.09,0,w/2,w/2,.18,r.cloth,23,12);
 }else if(kind==='trestle'||kind==='study'||kind==='landscape'){
  for(const x of[-w*.34,w*.34]){
   if(kind==='trestle')for(const sign of[-1,1])b.beam([x,.04,sign*d*.35],[x,y-.15,sign*d*.22],.10,r.palette.trim,22,4);
   else b.box(x,(y-.17)/2,0,.22,y-.17,d*.69,r.palette.trim,22);
  }
  b.box(0,y-.12,0,w,.24,d,r.palette.trim,22);b.quad([-w/2+.075,surfaceY,-d/2+.075],[-w/2+.075,surfaceY,d/2-.075],[w/2-.075,surfaceY,d/2-.075],[w/2-.075,surfaceY,-d/2+.075],r.cloth,23);
 }else if(kind==='platform'){
  b.box(0,(y-.15)/2,0,w-.3,y-.15,d-.3,r.palette.wall,24);b.box(0,y-.07,0,w,.14,d,r.cloth,23);
  for(const x of[-.38,.38])b.box(x,surfaceY-.02,0,.045,.04,d*.89,r.palette.metal,41);
 }else{
  const stone=kind==='honour',color=stone?'#b9b396':r.palette.trim;
  b.box(0,(y-.18)/2,0,w*.75,y-.18,d*.75,color,stone?24:22);
  b.box(0,surfaceY-.09,0,w,.18,d,stone?'#d2c9ab':r.cloth,stone?24:23);
  if(kind==='cabinet')b.box(0,.11,0,w*.83,.22,d*.83,'#493e31',22);
 }
 grandHallMapCase(b,bay);
 // A small edge plaque marks reviewed occupancy without inventing a miniature
 // or constructing a full Hall-only model for the distant house overview.
 if(occupied)b.quad([-.24,y-.18,d/2+.025],[.24,y-.18,d/2+.025],[.24,y-.05,d/2+.025],[-.24,y-.05,d/2+.025],'#c9ad73',41);
 b.pop();
}
function buildGrandHallMap(scene,b){
 b.push(-grandHallMapCenter[0]*GRAND_HALL_UNIT_SCALE,FLOOR,-grandHallMapCenter[1]*GRAND_HALL_UNIT_SCALE,0,0,0,GRAND_HALL_UNIT_SCALE);
 for(const p of GRAND_HALL_PASSAGES){
  const [x,z]=p.p0,[qx,qz]=p.p1,w=Math.abs(x-qx)||p.width,d=Math.abs(z-qz)||p.width;
  b.box((x+qx)/2,-.20,(z+qz)/2,w+.12,.40,d+.12,'#aca68c',24);
  b.box((x+qx)/2,.015,(z+qz)/2,w,.035,d,'#d4cab0',24);
  // Light covered links read as a sequence of thresholds, not extra rooms.
  if(x===qx)for(const side of[-1,1])b.beam([x+side*(w/2-.15),4.9,z],[qx+side*(w/2-.15),4.9,qz],.07,'#7e8b73',41,4);
  else for(const side of[-1,1])b.beam([x,4.9,z+side*(d/2-.15)],[qx,4.9,qz+side*(d/2-.15)],.07,'#7e8b73',41,4);
 }
 for(const [index,r]of GRAND_HALL_GALLERIES.entries()){
  b.push(r.x,0,r.z);
  b.box(0,-.26,0,r.width,.52,r.depth,r.palette.trim,22);
  b.box(0,.012,0,r.width-.08,.025,r.depth-.08,r.palette.floor,24);
  if(r.roof==='vault'){
   b.box(0,.033,0,5.8,.02,r.depth-.4,r.cloth,23);
   for(const side of[-1,1])b.box(side*3.03,.046,0,.08,.016,r.depth-.5,'#baa777',41);
   for(const z of[-18,-9,0,9,18])b.box(0,.049,z,5.7,.018,.13,'#a2ad88',23);
  }else if(r.roof==='glasshouse'){
   for(const side of[-1,1])b.box(side*2.2,.036,0,.1,.022,r.depth-.3,'#9daa8b',24);
   b.box(0,.034,0,4.2,.02,r.depth-.3,'#d2cfb1',24);
  }else if(r.roof==='octagon'){
   const points=Array.from({length:8},(_,i)=>{const a=(i+.5)*PI/4;return[Math.sin(a)*r.width*.31,.041,Math.cos(a)*r.depth*.28];});
   for(let i=0;i<8;i++)b.tri([0,.041,0],points[(i+1)%8],points[i],'#8e7d61',23);
  }else{
   const count=r.roof==='shed'?18:9;for(let j=1;j<count;j++)b.box(0,.029,-r.depth/2+j*r.depth/count,r.width-.2,.012,.025,r.roof==='clerestory'?'#a7a28d':'#7d765f',24);
  }
  for(const side of['left','right','back','front'])grandHallMapWall(b,r,index,side);
  grandHallMapRoof(b,r);grandHallMapRearWindows(b,r);
  // Built-in seats belong to the architecture and leave every exhibit bay empty.
  if(r.roof==='lantern'||r.roof==='glasshouse')for(const side of[-1,1]){
   b.box(side*(r.width/2-.85),.35,-r.depth*.30,.95,.7,4.1,r.palette.trim,22);
   b.box(side*(r.width/2-.85),.76,-r.depth*.30,1.08,.12,4.3,r.cloth,23);
  }
  b.pop();
 }
 const markedBays=new Set(GRAND_HALL_EXHIBITS.filter(exhibit=>exhibit.mapPreview!==true).map(exhibit=>exhibit.bay));
 for(const bay of GRAND_HALL_BAYS)grandHallMapFurniture(b,bay,markedBays.has(bay.id));
 for(const exhibit of GRAND_HALL_EXHIBITS){
  if(exhibit.mapPreview!==true)continue;
  const bay=GRAND_HALL_BAYS.find(item=>item.id===exhibit.bay);if(!bay)continue;
  grandHallPlaceExhibit(exhibit,b,bay);
 }
 b.pop();scene.height=()=>FLOOR;scene.spots=[];
}
const grandHallMapEntrances=GRAND_HALL_HOUSE_DOORS.map(door=>{const p=grandHallMapDoor(door);return{side:p.side,point:grandHallMapPoint(p.x,p.z),width:5.4*GRAND_HALL_UNIT_SCALE};});
const grandHallFrontDoor=grandHallMapEntrances.find(door=>door.side==='front');
registerHouseRoom('grandhall',{
 name:'The Grand Hall',layout:'The Grand Exhibition',tag:'MADE BY MANY HANDS',
 description:`${GRAND_HALL_GALLERIES.length} distinct galleries, ${GRAND_HALL_BAYS.length} places to make your own. Follow the exhibition through glasshouse, railway works, quiet studies and a shared workshop.`,
 railway:false,color:'#c5ad79',target:[0,FLOOR+12,0],distance:1100,pitch:.8,yaw:.1,
 map:{position:'central',footprint:grandHallMapBounds,scale:.4,entrance:grandHallFrontDoor.point,entrances:grandHallMapEntrances,destination:'grandhall.html'},
 build:buildGrandHallMap,shell:()=>[]
});
