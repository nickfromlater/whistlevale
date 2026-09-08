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

let SHOP_HOUSE_LAYOUT=createShopHouseLayout();
let shopHouseBuilt=null;

function shopHouseFloor(b,layout){
 const {width,depth,floorY,aisles}=layout;
 // The case is visibly an architectural miniature, with a walnut edge and inlay.
 b.push(0,0,1.0);slab(b,width+8.4,depth+10.4,2.8,floorY-1.72,2.4,'#49392d',22);
 slab(b,width+8.55,depth+10.55,.10,floorY-.33,2.5,'#b59b65',41);
 slab(b,width+8.15,depth+10.15,.16,floorY-.205,2.3,'#806a4c',22);b.pop();
 for(const aisle of aisles){
  b.box(aisle.x,floorY-.005,aisle.z,aisle.width+.16,.16,aisle.depth,'#b8a787',24);
  // Broad limestone flags read clearly at map scale, with warm terracotta inserts.
  const nx=Math.max(1,Math.ceil(aisle.width/3.6)),nz=Math.max(1,Math.ceil(aisle.depth/3.6));
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
  for(const aisle of layout.aisles.filter(a=>a.width>a.depth)){
   shopHouseBench(b,-layout.width*.375,layout.floorY,aisle.z+2.1);
   shopHouseBench(b,layout.width*.375,layout.floorY,aisle.z-2.1,PI);
   for(const side of[-1,1])shopHouseFern(b,side*(layout.width*.375+6.4),layout.floorY,aisle.z+side*.7,.88);
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
