'use strict';

// Architecture for the live house cutaway. Room contents stay in their own modules;
// the map renderer draws those existing meshes and trains under room.model.
const SHOP_HOUSE_DEFAULTS={columns:2,aisle:8,crossAisle:12,scale:.40,footprint:[156,128],margin:4.2};
const SHOP_HOUSE_ROOM_DEFAULTS={
 alpine:{order:0},coast:{order:1},valley:{order:2,scale:.33,footprint:[190,166]},studio:{order:3}
};

function createShopHouseLayout(definitions=HOUSE_ROOMS){
 const config=SHOP_HOUSE_DEFAULTS,floorY=FLOOR*config.scale;
 const entries=Object.entries(definitions).map(([key,definition],index)=>{
  const map={...SHOP_HOUSE_ROOM_DEFAULTS[key],...definition.map};
  const scale=Number.isFinite(map.scale)&&map.scale>0?map.scale:config.scale;
  const footprint=Array.isArray(map.footprint)&&map.footprint.length===2&&map.footprint.every(n=>Number.isFinite(n)&&n>0)?map.footprint:config.footprint;
  return{key,definition,map,scale,footprint,index,order:definition.mapOrder??map.order??100+index};
 }).sort((a,b)=>a.order-b.order||a.index-b.index);
 if(entries.some(entry=>entry.map.position==='central'))return createCentralShopHouseLayout(entries,config,floorY);
 const columnWidths=Array.from({length:config.columns},()=>0),rowDepths=[];
 entries.forEach((entry,index)=>{
  entry.column=index%config.columns;entry.row=Math.floor(index/config.columns);
  columnWidths[entry.column]=Math.max(columnWidths[entry.column],entry.footprint[0]*entry.scale);
  rowDepths[entry.row]=Math.max(rowDepths[entry.row]||0,entry.footprint[1]*entry.scale);
 });
 for(let i=0;i<columnWidths.length;i++)if(!columnWidths[i])columnWidths[i]=config.footprint[0]*config.scale;
 const width=columnWidths.reduce((a,b)=>a+b,0)+config.aisle*(config.columns-1);
 const depth=rowDepths.reduce((a,b)=>a+b,0)+config.crossAisle*Math.max(0,rowDepths.length-1);
 const rowStarts=[];let z=-depth/2;
 for(const d of rowDepths){rowStarts.push(z);z+=d+config.crossAisle;}
 const columnStarts=[];let x=-width/2;
 for(const w of columnWidths){columnStarts.push(x);x+=w+config.aisle;}
 const roomList=entries.map(entry=>{
  const {key,definition,map,scale,footprint,row,column}=entry;
  const centerX=columnStarts[column]+columnWidths[column]/2,centerZ=rowStarts[row]+rowDepths[row]/2;
  const offset=[centerX,floorY-FLOOR*scale,centerZ],model=mm(trans(...offset),scaling(scale));
  const w=footprint[0]*scale,d=footprint[1]*scale;
  const bounds={x0:centerX-w/2,x1:centerX+w/2,z0:centerZ-d/2,z1:centerZ+d/2};
  const inward=column===0?1:-1,doorZ=centerZ+d*.25;
  const doorway=[centerX+inward*w/2,floorY,doorZ];
  const wantedFocus=map.focus||definition.target,localFocus=Array.isArray(wantedFocus)&&wantedFocus.length===3&&wantedFocus.every(Number.isFinite)?wantedFocus:[0,0,0];
  const focus=transform(localFocus,model),outerWalls=[column===0?'left':'right'];
  if(row===0)outerWalls.push('back');if(row===rowDepths.length-1)outerWalls.push('front');
  return{key,row,column,scale,footprint,offset,model,bounds,center:[centerX,0,centerZ],doorway,doorAngle:inward>0?PI/2:-PI/2,
   focus,labelAnchor:[centerX,5.0,centerZ+d*.38],hitBounds:{x0:bounds.x0+.35,x1:bounds.x1-.35,z0:bounds.z0+.35,z1:bounds.z1-.35},
   outerWalls,cutawayWalls:['back','front','left','right'].filter(w=>!outerWalls.includes(w)),
   signKey:map.signKey||'house-'+entry.index,color:definition.color||'#a5ad85',
   mapEntry:{target:focus,distance:Math.max(w,d)*1.65,pitch:.78,yaw:.15}};
 });
 const aisles=[];
 for(let i=0;i<columnWidths.length-1;i++)aisles.push({x:columnStarts[i]+columnWidths[i]+config.aisle/2,z:0,width:config.aisle,depth:depth+1.8});
 for(let i=0;i<rowDepths.length-1;i++)aisles.push({x:0,z:rowStarts[i]+rowDepths[i]+config.crossAisle/2,width:width+1.4,depth:config.crossAisle});
 const spineX=columnStarts[0]+columnWidths[0]+config.aisle/2,entryZ=depth/2+4.0,entry=[spineX,floorY,entryZ];
 const bounds={x0:-width/2-config.margin,x1:width/2+config.margin,z0:-depth/2-config.margin,z1:entryZ+7.3};
 const target=[0,floorY+8,(bounds.z0+bounds.z1)/2];
 return{floorY,rooms:roomList,byKey:Object.fromEntries(roomList.map(r=>[r.key,r])),width,depth,rowDepths,columnWidths,aisles,entry,spineX,bounds,
  mapEntry:{target,distance:Math.max(width,depth+13)*1.55,pitch:.82,yaw:.035},revision:roomList.map(r=>r.key).join('|')};
}


// A central exhibition keeps its authored size. Railway rooms grow in two
// flanking wings; new registrations add rows instead of shrinking the Hall.
function createCentralShopHouseLayout(entries,config,floorY){
 const centers=entries.filter(e=>e.map.position==='central');
 if(centers.length!==1)throw new Error('The house needs exactly one central room.');
 const hall=centers[0],wings=entries.filter(e=>e!==hall),occupied=new Set();
 // A contribution may name the vacant site it was designed for. Other rooms
 // retain automatic discovery and fill the next unclaimed wing position.
 for(const e of wings){
  if(e.map.plot===undefined)continue;const match=/^(west|east)-([1-9][0-9]?)$/.exec(e.map.plot);
  if(!match)throw new Error('Room map.plot must name a site such as east-3.');
  e.column=match[1]==='west'?0:1;e.row=Number(match[2])-1;const slot=e.row*2+e.column;
  if(occupied.has(slot))throw new Error('Two rooms cannot occupy house site '+e.map.plot+'.');occupied.add(slot);
 }
 let next=0;for(const e of wings){if(e.row!==undefined)continue;while(occupied.has(next))next++;e.column=next%2;e.row=Math.floor(next/2);occupied.add(next++);}
 const rows=wings.length?Math.max(...wings.map(e=>e.row))+1:0;
 const hallWidth=hall.footprint[0]*hall.scale,hallDepth=hall.footprint[1]*hall.scale;
 const columnWidths=[0,0],rowDepths=Array(rows).fill(0);
 wings.forEach(e=>{columnWidths[e.column]=Math.max(columnWidths[e.column],e.footprint[0]*e.scale);rowDepths[e.row]=Math.max(rowDepths[e.row],e.footprint[1]*e.scale);});
 for(let i=0;i<rows;i++)if(!rowDepths[i])rowDepths[i]=config.footprint[1]*config.scale;
 // The initial wing positions follow the Hall's proportions, independently of
 // how many have been filled. Later rows alternate ahead and behind the Hall,
 // so accepting a new room never recenters the whole collection around it.
 const baseRows=Math.max(1,Math.floor(hallDepth/(config.footprint[1]*config.scale*1.6))),defaultDepth=config.footprint[1]*config.scale;
 const slotDepths=Array.from({length:Math.max(rows,baseRows)+2},(_,i)=>rowDepths[i]||defaultDepth),initialDepth=slotDepths.slice(0,baseRows).reduce((a,b)=>a+b,0);
 const depth=Math.max(hallDepth,initialDepth+Math.max(0,baseRows-1)*config.crossAisle),width=hallWidth+2*config.aisle+2*Math.max(...columnWidths);
 const free=baseRows>1?(depth-initialDepth)/(baseRows-1):0,starts=[];
 let z=-depth/2;for(let i=0;i<baseRows;i++){starts.push(z);z+=slotDepths[i]+free;}
 let front=depth/2+config.crossAisle,back=-depth/2-config.crossAisle;
 for(let i=baseRows;i<slotDepths.length;i++){if((i-baseRows)%2===0){starts.push(front);front+=slotDepths[i]+config.crossAisle;}else{back-=slotDepths[i];starts.push(back);back-=config.crossAisle;}}
 const place=(entry,centerX,centerZ,central=false)=>{
  const {key,definition,map,scale,footprint,index}=entry,w=footprint[0]*scale,d=footprint[1]*scale;
  const model=mm(trans(centerX,floorY-FLOOR*scale,centerZ),scaling(scale));
  const bounds={x0:centerX-w/2,x1:centerX+w/2,z0:centerZ-d/2,z1:centerZ+d/2};
  const inward=entry.column===0?1:-1;
  const authoredEntrance=Array.isArray(map.entrance)&&map.entrance.length===3&&map.entrance.every(Number.isFinite)?map.entrance:null;
  const doorway=central?(authoredEntrance?transform(authoredEntrance,model):[centerX,floorY,bounds.z1]):[centerX+inward*w/2,floorY,centerZ+d*.25];
  const wanted=map.focus||definition.target,localFocus=Array.isArray(wanted)&&wanted.length===3&&wanted.every(Number.isFinite)?wanted:[0,0,0];
  const focus=transform(localFocus,model),outerWalls=central?[]:[entry.column===0?'left':'right','back','front'];
  return{key,row:entry.row??0,column:central?1:entry.column,central,scale,footprint,model,offset:[centerX,floorY-FLOOR*scale,centerZ],bounds,center:[centerX,0,centerZ],doorway,doorAngle:central?0:inward>0?PI/2:-PI/2,focus,
   labelAnchor:[centerX,floorY+12,central?centerZ+d*.12:centerZ+d*.38],hitBounds:{x0:bounds.x0+.35,x1:bounds.x1-.35,z0:bounds.z0+.35,z1:bounds.z1-.35},outerWalls,cutawayWalls:['back','front','left','right'].filter(w=>!outerWalls.includes(w)),signKey:map.signKey||'house-'+index,color:definition.color||'#a5ad85',mapEntry:{target:focus,distance:Math.max(w,d)*1.65,pitch:.78,yaw:.15}};
 };
 const roomList=[place(hall,0,0,true),...wings.map(e=>place(e,(e.column===0?-1:1)*(hallWidth/2+config.aisle+e.footprint[0]*e.scale/2),starts[e.row]+rowDepths[e.row]/2))];
 const hallRoom=roomList[0],aisles=[-1,1].map(side=>({x:side*(hallWidth/2+config.aisle/2),z:0,width:config.aisle,depth:depth+2,kind:'promenade'}));
 // Short walks meet real gallery doorways; they never cross a gallery floor.
 for(const door of Array.isArray(hall.map.entrances)?hall.map.entrances:[]){
  if(!['left','right'].includes(door.side)||!Array.isArray(door.point)||door.point.length!==3||!door.point.every(Number.isFinite))continue;
  const p=transform(door.point,hallRoom.model),side=door.side==='left'?-1:1,end=side*(hallWidth/2+config.aisle/2),doorWidth=Number.isFinite(door.width)&&door.width>0?door.width:3;
  aisles.push({x:(p[0]+end)/2,z:p[2],width:Math.abs(end-p[0]),depth:Math.min(6.4,doorWidth*hall.scale),kind:'gallery-link'});
 }
 // A front forecourt joins both wings at the exhibition's own entrance.
 aisles.push({x:0,z:depth/2+2.8,width:hallWidth+2*config.aisle,depth:5.6,kind:'forecourt'});
 if(depth>hallDepth+1)aisles.push({x:hallRoom.doorway[0],z:(hallRoom.doorway[2]+depth/2)/2,width:7,depth:depth/2-hallRoom.doorway[2]+1,kind:'entrance'});
 const entry=[hallRoom.doorway[0],floorY,depth/2+7],bounds={x0:-width/2-config.margin,x1:width/2+config.margin,z0:-depth/2-config.margin,z1:entry[2]+7.3};
 const layout={floorY,rooms:roomList,byKey:Object.fromEntries(roomList.map(r=>[r.key,r])),width,depth,rowDepths,columnWidths,aisles,entry,spineX:entry[0],bounds,centralKey:hall.key,mapEntry:{target:[0,floorY+8,(bounds.z0+bounds.z1)/2],distance:Math.max(width,depth+18)*1.55,pitch:.82,yaw:.035},revision:roomList.map(r=>r.key).join('|')};
 return createShopHousePlots(layout,occupied,starts,slotDepths,hallWidth,config);
}

function createShopHousePlots(layout,occupied,starts,slotDepths,hallWidth,config){
 const plots=[],w=config.footprint[0]*config.scale,d=config.footprint[1]*config.scale;
 for(let slot=0;plots.length<3;slot++){
  if(occupied.has(slot))continue;const column=slot%2,row=Math.floor(slot/2),side=column===0?-1:1;
  const x=side*(hallWidth/2+config.aisle+w/2),z=starts[row]+slotDepths[row]/2;
  const bounds={x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2},id=(column===0?'west':'east')+'-'+(row+1);
  plots.push({id,name:(column===0?'West':'East')+' wing · space '+(row+1),side:column===0?'left':'right',row,column,scale:config.scale,footprint:config.footprint.slice(),bounds,center:[x,layout.floorY,z],doorway:[x-side*w/2,layout.floorY,z+d*.25],labelAnchor:[x,layout.floorY+3.8,z],hitBounds:{x0:bounds.x0+.4,x1:bounds.x1-.4,z0:bounds.z0+.4,z1:bounds.z1-.4}});
 }
 for(const side of[-1,1]){
  const wing=[...layout.rooms.filter(r=>!r.central),...plots].filter(p=>p.column===(side<0?0:1));
  const end=Math.max(layout.depth/2+1,...wing.map(p=>p.bounds.z1)),start=Math.min(-layout.depth/2-1,...wing.map(p=>p.bounds.z0)),x=side*(hallWidth/2+config.aisle/2);
  if(end>layout.depth/2+1)layout.aisles.push({x,z:(layout.depth/2+end)/2,width:config.aisle,depth:end-layout.depth/2,kind:'expansion'});
  if(start<-layout.depth/2-1)layout.aisles.push({x,z:(-layout.depth/2+start)/2,width:config.aisle,depth:-layout.depth/2-start,kind:'expansion'});
 }
 for(const p of [...layout.rooms,...plots]){const q=p.bounds;layout.bounds.x0=Math.min(layout.bounds.x0,q.x0-config.margin);layout.bounds.x1=Math.max(layout.bounds.x1,q.x1+config.margin);layout.bounds.z0=Math.min(layout.bounds.z0,q.z0-config.margin);layout.bounds.z1=Math.max(layout.bounds.z1,q.z1+config.margin);}
 layout.width=Math.max(layout.width,layout.bounds.x1-layout.bounds.x0-2*config.margin);
 layout.mapEntry.target=[(layout.bounds.x0+layout.bounds.x1)/2,layout.floorY+8,(layout.bounds.z0+layout.bounds.z1)/2];
 layout.mapEntry.distance=Math.max(layout.width,layout.bounds.z1-layout.bounds.z0)*1.55;layout.plots=plots;return layout;
}

let SHOP_HOUSE_LAYOUT=createShopHouseLayout();
let shopHouseBuilt=null;

function shopHouseFloor(b,layout){
 const {width,depth,floorY,aisles}=layout;
 // Foundations follow the exhibition and its wings. A single rectangular case
 // would fill the spaces between its galleries with an enormous empty slab.
 if(layout.centralKey){
  for(const plot of layout.plots)shopHousePlot(b,plot,floorY);
  for(const room of layout.rooms){if(room.central)continue;const {bounds:q}=room;
   b.box(room.center[0],floorY-1.24,room.center[2],q.x1-q.x0+.9,2.3,q.z1-q.z0+.9,'#594c3c',22);
   b.box(room.center[0],floorY-.19,room.center[2],q.x1-q.x0+1.05,.12,q.z1-q.z0+1.05,'#a79770',41);
  }
  for(const a of aisles)b.box(a.x,floorY-1.21,a.z,a.width+.36,2.25,a.depth,'#807967',24);
  b.box(layout.spineX,floorY-1.21,depth/2+4.8,20,2.25,9.6,'#807967',24);
 }else{
  b.push(0,0,1.0);slab(b,width+8.4,depth+10.4,2.8,floorY-1.72,2.4,'#49392d',22);
  slab(b,width+8.55,depth+10.55,.10,floorY-.33,2.5,'#b59b65',41);
  slab(b,width+8.15,depth+10.15,.16,floorY-.205,2.3,'#806a4c',22);b.pop();
 }
 for(const aisle of aisles){
  b.box(aisle.x,floorY-.005,aisle.z,aisle.width+.16,.16,aisle.depth,'#b8a787',24);
  // Broad limestone flags read clearly at map scale, with warm terracotta inserts.
  const flag=layout.centralKey?5.4:3.6,nx=Math.max(1,Math.ceil(aisle.width/flag)),nz=Math.max(1,Math.ceil(aisle.depth/flag));
  for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){
   const w=aisle.width/nx,d=aisle.depth/nz,x=aisle.x-aisle.width/2+(i+.5)*w,z=aisle.z-aisle.depth/2+(j+.5)*d;
   const tone=(i+j)%4===0?'#c9b695':(i+j)%2?'#ded1b3':'#d4c7a8';
   b.box(x,floorY+.094,z,w-.046,.035,d-.046,tone,24);
  }
  if(aisle.width<aisle.depth){for(const side of[-1,1])b.box(aisle.x+side*(aisle.width/2-.27),floorY+.122,aisle.z,.11,.018,aisle.depth,'#a18d5d',41);}
  else for(const side of[-1,1])b.box(aisle.x,floorY+.124,aisle.z+side*(aisle.depth/2-.29),aisle.width,.018,.11,'#a18d5d',41);
 }
 // The central walk continues through the porch without a floor-level discontinuity.
 b.box(layout.spineX,floorY+.058,depth/2+2.8,15.5,.22,8.0,'#b9ad8e',24);
 for(const x of[-6.8,6.8])b.box(layout.spineX+x,floorY+.177,depth/2+2.8,.08,.015,7.2,'#8e9474',41);
}

function shopHousePlot(b,plot,y){
 const {bounds:q,center:[x,,z]}=plot,w=q.x1-q.x0,d=q.z1-q.z0;
 b.box(x,y-1.24,z,w+.9,2.3,d+.9,'#777665',24);
 b.box(x,y-.10,z,w,.20,d,'#b4b6a0',24);
 // An unbuilt floor: pale drafting stone, a restrained broken outline, and a
 // small brass plus. It cannot be mistaken for another occupied miniature.
 for(const side of[-1,1]){
  for(let i=0;i<7;i++)b.box(x-w/2+3.2+i*(w-6.4)/6,y+.025,z+side*(d/2-2),2.6,.05,.10,'#827c5d',41);
  for(let i=0;i<5;i++)b.box(x+side*(w/2-2),y+.025,z-d/2+3.2+i*(d-6.4)/4,.10,.05,2.6,'#827c5d',41);
 }
 b.box(x,y+.08,z,6.4,.10,.52,'#8b896a',41);b.box(x,y+.085,z,.52,.10,6.4,'#8b896a',41);
 const [dx,,dz]=plot.doorway;b.box(dx,y+.035,dz,.65,.07,6.2,'#c4b380',41);
}

function shopHousePartition(b,a,z0,z1,y,color,doorZ=null){
 const opening=doorZ===null?[]:[Math.max(z0,doorZ-3.25),Math.min(z1,doorZ+3.25)];
 const segments=opening.length?[[z0,opening[0]],[opening[1],z1]]:[[z0,z1]];
 for(const [start,end]of segments){if(end-start<.15)continue;const d=end-start,z=(start+end)/2;
  b.box(a,y+1.32,z,.39,2.65,d,color,22);b.box(a,y+2.72,z,.58,.19,d+.06,'#c1ac7f',22);
  b.box(a,y+.20,z,.54,.40,d+.03,'#5b5942',22);
  for(let p=start+.5;p<end-.35;p+=3.2)b.box(a+.205,y+1.4,p,.028,2.1,.053,'#c4bd98',22);
 }
}

function shopHousePortal(b,room,y){
 const [x,,z]=room.doorway;
 b.push(x,y,z,0,room.doorAngle);
 const color=room.key==='coast'?'#a5bab0':room.key==='alpine'?'#7c694d':'#536c5b';
 for(const side of[-1,1]){
  b.box(side*3.35,5.85,0,.52,11.7,.77,color,22);
  b.box(side*3.35,.43,0,.78,.86,1.03,'#c7b58d',22);
  b.box(side*3.35,11.45,0,.87,.42,1.05,'#b8a16e',22);
  b.box(side*3.69,6.0,.08,.075,10.6,.15,'#d3bc83',41);
 }
 b.box(0,11.98,0,7.6,.67,.85,color,22);b.box(0,12.45,0,8.0,.26,1.06,'#c2aa79',22);
 b.box(0,.11,0,6.6,.12,1.1,'#c5b781',41);
 // The door is open: shallow panelled leaves sit against their room-side reveals.
 for(const side of[-1,1]){
  b.push(side*3.10,0,.24,0,side*PI*.48);b.box(-side*1.20,4.84,0,2.42,9.7,.17,color,22);
  for(const h of[2.4,7.2]){b.box(-side*1.20,h,.104,1.85,3.85,.07,'#b7b18d',22);b.box(-side*1.20,h,.15,1.55,3.52,.028,color,22);}
  b.cylinder(-side*2.13,4.83,.23,.085,.085,.13,'#c9b079',41,10,PI/2);b.pop();
 }
 if(roomLabels[room.signKey])roomSign(b,room.signKey,0,13.42,.20,9.25,2.2);
 b.pop();
}

function shopHouseBench(b,x,y,z,angle=0){
 b.push(x,y,z,0,angle);
 for(const side of[-1,1])for(const back of[-1,1])b.box(side*3.9,.95,back*1.08,.35,1.90,.35,'#4c5241',41);
 b.box(0,1.94,0,9.1,.42,2.85,'#92754b',22);
 for(let j=0;j<3;j++)b.box((j-1)*2.81,2.30,0,2.74,.41,2.46,'#728273',23);
 b.box(0,3.32,-1.32,9.2,2.14,.25,'#758575',22);
 for(const x of[-4.4,4.4]){b.box(x,2.81,0,.22,.19,2.90,'#b1996c',22);b.box(x,2.30,-1.15,.21,1.0,.20,'#9f875e',22);}
 b.box(2.60,2.59,.20,1.58,.18,1.03,'#8f5945',22);b.box(2.6,2.70,.20,1.48,.07,.96,'#d8c9a6',23);
 b.pop();
}

function shopHouseFern(b,x,y,z,scale=1){
 b.push(x,y,z,0,0,0,scale);b.cylinder(0,.72,0,.58,.83,1.44,'#a38059',24,14);
 b.cylinder(0,1.48,0,.87,.87,.13,'#b89d70',24,16);b.cylinder(0,1.56,0,.76,.76,.08,'#605a40',3,14);
 for(let i=0;i<9;i++){
  const a=i*2.399,height=2.7+hash(i,11)*1.2,dx=Math.sin(a),dz=Math.cos(a);
  const end=[dx*1.12,height,dz*1.12];b.beam([0,1.55,0],end,.020,'#8b9e69',0,5);
  for(let j=0;j<5;j++){
   const t=.36+j*.13,c=lerpV([0,1.55,0],end,t),w=.40*(1-t)+.09;
   for(const side of[-1,1])b.tri(c,add(c,[dx*.35+dz*side*w,-.08,dz*.35-dx*side*w]),add(c,[dx*.32,.23,dz*.32]),i%2?'#748f69':'#536f52',24);
  }
 }
 b.pop();
}

function shopHouseWelcome(b,layout){
 const {floorY:y,entry:[x,,z]}=layout;
 // A recognisable shopfront with its doors open and the roof lifted away.
 for(const side of[-1,1]){
  b.box(x+side*6.0,y+5.9,z,1.15,11.8,1.04,'#526b59',22);
  b.box(x+side*6.0,y+.56,z,1.50,1.12,1.40,'#c1b190',24);
  b.box(x+side*6.0,y+11.62,z,1.68,.61,1.49,'#b99e6b',22);
  b.box(x+side*7.4,y+3.2,z,1.45,6.4,.54,'#e1d2b1',20);
  b.box(x+side*7.4,y+6.6,z,1.49,.24,.76,'#9e8960',22);
  shopHouseFern(b,x+side*8.8,y,z+1.2,1.02);
  // Brass wall lanterns glow through an open cage, rather than opaque glass boxes.
  b.box(x+side*6.0,y+8.5,z+.59,.68,1.64,.20,'#596b58',41);
  b.beam([x+side*6,y+9,z+.64],[x+side*6,y+9,z+1.5],.07,'#b39d68',41,8);
  b.cylinder(x+side*6,y+8.5,z+1.53,.52,.36,.41,'#ac9561',41,16);
  b.sphere(x+side*6,y+7.78,z+1.53,.23,.48,.23,'#e4ce98',25,10,6);
  for(const dx of[-.32,.32])b.beam([x+side*6+dx,y+8.3,z+1.53],[x+side*6+dx,y+7.2,z+1.53],.033,'#a5905e',41,6);
  b.box(x+side*6,y+7.13,z+1.53,.87,.16,.60,'#a28d5d',41);
 }
 b.box(x,y+12.8,z,16.7,1.9,1.03,'#48614f',22);b.box(x,y+13.91,z,17.4,.36,1.33,'#b8a271',22);
 if(roomLabels['shop-sign'])roomSign(b,'shop-sign',x,y+12.83,z+.537,15.70,1.63);
 b.box(x,y+.205,z-.30,9.50,.12,4.15,'#66745b',23);
 for(const side of[-1,1])b.box(x+side*4.56,y+.275,z-.30,.035,.014,3.80,'#baac7d',41);
 for(let i=0;i<3;i++){
  const stepZ=z+3.35+i*1.13,w=12.8+i*1.65,top=y-.015-i*.40,bottom=y-3.12;
  b.box(x,(top+bottom)/2,stepZ,w,top-bottom,1.28,'#b5ad92',24);b.box(x,y-.004-i*.40,stepZ+.47,w+.04,.025,.11,'#d3c6a3',24);
 }
}

function buildShopHouse(){
 const oldSeed=seed;seed=736193;const layout=createShopHouseLayout(),b=new Builder();
 try{
  shopHouseFloor(b,layout);
  for(const room of layout.rooms){
   const {bounds,doorway,column,color}=room,inward=column===0?1:-1,x=inward>0?bounds.x1:bounds.x0;
   if(room.central){shopHousePortal(b,room,layout.floorY);continue;}
   shopHousePartition(b,x,bounds.z0,bounds.z1,layout.floorY,room.key==='coast'?'#9eb1a3':'#5b715c',doorway[2]);
   // Low cross walls preserve the connected-house silhouette when room walls lift.
   for(const z of[bounds.z0,bounds.z1]){
    b.box((bounds.x0+bounds.x1)/2,layout.floorY+1.34,z,bounds.x1-bounds.x0,2.68,.38,room.key==='coast'?'#aebba8':'#747b61',22);
    b.box((bounds.x0+bounds.x1)/2,layout.floorY+2.73,z,bounds.x1-bounds.x0+.10,.19,.56,'#c0ab7a',22);
   }
   shopHousePortal(b,room,layout.floorY);
   // A brass threshold marker links the physical doorway to the room's UI label.
   b.push(doorway[0]+inward*1.03,layout.floorY+.19,doorway[2],0,PI/4);b.box(0,0,0,1.07,.04,1.07,color,41);b.pop();
  }
  for(const aisle of layout.aisles.filter(a=>a.width>a.depth&&(!layout.centralKey||a.kind==='forecourt'))){
   const seatX=layout.centralKey?aisle.width*.29:layout.width*.375,seatZ=layout.centralKey?0:2.1;
   shopHouseBench(b,-seatX,layout.floorY,aisle.z+seatZ);
   shopHouseBench(b,seatX,layout.floorY,aisle.z-seatZ,PI);
   for(const side of[-1,1])shopHouseFern(b,side*(seatX+6.4),layout.floorY,aisle.z+side*.7,.88);
   // A quiet compass in the tiled crossing makes the central hall legible.
   for(let i=0;i<8;i++){
    const a=i*PI/4,r=i%2?2.15:3.15,q=a+PI/8,yy=layout.floorY+.148;
    b.tri([layout.spineX,yy,aisle.z],[layout.spineX+Math.sin(a)*r,yy,aisle.z+Math.cos(a)*r],[layout.spineX+Math.sin(q)*.62,yy,aisle.z+Math.cos(q)*.62],i%2?'#b69e6b':'#73836a',24);
   }
  }
  shopHouseWelcome(b,layout);
  const mesh=b.mesh();if(shopHouseBuilt)disposeMesh(shopHouseBuilt.mesh);
  SHOP_HOUSE_LAYOUT=layout;shopHouseBuilt={mesh,layout};return shopHouseBuilt;
 }finally{seed=oldSeed;}
}
