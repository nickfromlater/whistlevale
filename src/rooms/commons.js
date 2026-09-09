'use strict';

// A shared starting landscape. Keep the broad meadows open: reviewed additions
// belong in contributions/world.json, with their own authorship and footprint.
const COMMONS_WIDTH=108,COMMONS_DEPTH=66,COMMONS_WATER=.42;
const commonsStream=z=>-4+7*Math.sin(z*.070)+2*Math.sin(z*.13+.7);
const commonsBank=(x,z)=>Math.abs(x-commonsStream(z));
// A perimeter circuit frames the whole shared landscape. Straight river spans
// and broad corner curves keep the middle available for future contributions.
const COMMONS_RAIL_Y=1.5;
const COMMONS_ROUTE=(()=>{
 const y=COMMONS_RAIL_Y,k=5.5228475,p=(x,z)=>[x,y,z],line=(a,b)=>[a,lerpV(a,b,1/3),lerpV(a,b,2/3),b];
 return new Edge('The Commons circuit',[
  line(p(-37,26),p(37,26)),[p(37,26),p(37+k,26),p(47,16+k),p(47,16)],
  line(p(47,16),p(47,-16)),[p(47,-16),p(47,-16-k),p(37+k,-26),p(37,-26)],
  line(p(37,-26),p(-37,-26)),[p(-37,-26),p(-37-k,-26),p(-47,-16-k),p(-47,-16)],
  line(p(-47,-16),p(-47,16)),[p(-47,16),p(-47,16+k),p(-37-k,26),p(-37,26)]
 ]);
})();
const commonsRailDistance=(x,z)=>{const qx=Math.abs(x)-37,qz=Math.abs(z)-16;return Math.abs(Math.hypot(Math.max(qx,0),Math.max(qz,0))+Math.min(Math.max(qx,qz),0)-10);};
const COMMONS_BRIDGES=[26,-26].map(z=>({x:commonsStream(z),z,half:6.3}));
function commonsHeight(x,z){
 const d=commonsBank(x,z),bank=smooth(1.9,5.6,d);
 const hills=6.8*Math.exp(-((x+33)**2/170+(z+17)**2/38))+7.8*Math.exp(-((x-32)**2/180+(z+17)**2/40));
 const meadow=.97+.12*Math.sin(x*.105+z*.025)*Math.cos(z*.095)+.045*Math.sin(z*.29+x*.07);
 const shoulder=.75*Math.exp(-((x+23)**2/180+(z+16)**2/24))+1.05*Math.exp(-((x-23)**2/140+(z+18)**2/30));
 const natural=mix(-.32,meadow+hills+shoulder,bank);
 // The stream bed remains open beneath both bridges; banks ease into abutments.
 const influence=(1-smooth(1.15,4.2,commonsRailDistance(x,z)))*smooth(4.5,6.2,d);
 return mix(natural,COMMONS_RAIL_Y-.22,influence);
}
// Match houseTerrain's emitted triangles for placements and low cameras.
function commonsSurface(x,z){
 const x0=Math.floor((x+54)/.75)*.75-54,z0=Math.floor((z+33)/.75)*.75-33,u=(x-x0)/.75,v=(z-z0)/.75;
 const a=commonsHeight(x0,z0),r=commonsHeight(x0+.75,z0),f=commonsHeight(x0,z0+.75),q=commonsHeight(x0+.75,z0+.75);
 return u+v<=1?a+(r-a)*u+(f-a)*v:q+(f-q)*(1-u)+(r-q)*(1-v);
}
const COMMONS_TREES=[];
for(const [cx,cz,n]of[[-35,-17,14],[34,-17,15],[-40,16,7],[40,16,6]])for(let i=0;i<n;i++){
 const a=i*2.399,r=2+Math.sqrt(i)*1.3,x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r*.65;
 const kind=i%7===0?'pine':i%3===0?'birch':'oak',h=(kind==='birch'?4.5:3.8)+hash(i,cx)*2.8;
 if(Math.abs(x)<=51&&Math.abs(z)<=30&&commonsRailDistance(x,z)>2+h*.52)COMMONS_TREES.push({x,z,h,kind,variant:i+cx});
}
// Two willows mark the water without filling the open construction meadows.
for(const [z,side]of[[5,1],[-6,-1]])COMMONS_TREES.push({x:commonsStream(z)+side*8.4,z,h:5.8,kind:'willow',variant:z});
function commonsTree(b,t){
 const {x,z,h,kind,variant}=t,y=commonsSurface(x,z),bark=kind==='birch'?'#c3c4ab':'#73694e';
 b.push(x,y,z);
 b.cylinder(0,h*.28,0,h*.036,h*.018,h*.56,bark,22,7);
 for(let i=0;i<3;i++){const a=i*2.1+variant,dx=Math.cos(a)*h*.13,dz=Math.sin(a)*h*.13;b.beam([0,.16,0],[dx,commonsSurface(x+dx,z+dz)-y+.02,dz],h*.018,bark,22,5);}
 if(kind==='pine'){
  for(let i=0;i<6;i++){const q=i/6;b.cylinder(0,h*(.38+q*.57),0,h*(.27-q*.22),.015,h*.31,i%2?'#557956':'#66865b',8,8);}
 }else{
  const willow=kind==='willow',birch=kind==='birch',n=willow?7:5;
  for(let i=0;i<n;i++){
   const a=i*2.399+variant*.37,r=h*(birch?.10:.18),xx=Math.cos(a)*r,zz=Math.sin(a)*r,yy=h*(.61+(i%3)*.11);
   b.beam([0,h*.38,0],[xx,yy,zz],h*.014,bark,22,5);
   const c=willow?['#8da66c','#77945f','#a0b37c'][i%3]:birch?['#91aa6d','#7d9d61','#a6b77b'][i%3]:['#688b57','#789953','#8ba55f'][i%3];
   b.sphere(xx,yy,zz,h*(birch?.17:willow?.19:.26),h*(willow?.34:birch?.23:.22),h*(birch?.16:willow?.18:.24),c,8,8,5,true);
   if(willow)b.beam([xx,yy,zz],[xx*1.2,yy-h*.32,zz*1.2],h*.008,'#879761',8,5);
  }
  if(birch)for(let i=0;i<6;i++)b.box(0,h*(.13+i*.06),h*.027,h*.05,h*.018,.013,'#706f59',23);
 }
 b.pop();
}
function commonsGroundColor(x,y,z,n){
 const bank=commonsBank(x,z),mottle=.5+.22*Math.sin(x*.21+z*.11)*Math.cos(z*.19)+.16*noise(x*.37,z*.37);
 let c=lerpV(col('#71945d'),col('#b5b484'),mottle);
 const swale=.5+.5*Math.sin(x*.08+z*.13+Math.sin(z*.11)*1.4);c=lerpV(c,col('#93a96f'),swale*.18);
 const woodland=Math.max(Math.exp(-((x+35)**2/110+(z+17)**2/48)),Math.exp(-((x-34)**2/120+(z+17)**2/48)));
 c=lerpV(c,col('#708753'),woodland*.42);
 c=lerpV(c,col('#afa98c'),smooth(.09,.42,1-n[1])*.46);
 return bank<5.5?lerpV(col('#a5ab8b'),c,smooth(2.6,5.5,bank)):c;
}
function commonsNaturalDetails(b){
 // Loose groups of exposed stone and groundcover follow the wooded shoulders.
 for(const [cx,cz]of[[-34,-18],[32,-18],[-40,16],[40,16]])for(let i=0;i<11;i++){
  const a=i*2.399,r=2+hash(i,cx)*5,x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r*.7;
  if(commonsRailDistance(x,z)<2.4||commonsBank(x,z)<5.8)continue;
  const y=commonsSurface(x,z),size=.18+hash(i,cz)*.34;
  if(i%3===0)b.sphere(x,y+size*.2,z,size*1.6,size*.7,size,'#aba98f',4,7,4,true);
  else for(let k=0;k<2;k++){const dx=(k-.5)*.25;b.sphere(x+dx,commonsSurface(x+dx,z)+.14,z,.23,.20,.20,k%2?'#7b955f':'#91a26e',8,6,3,true);}
 }
 // Low sedge patches break the bank outline. No scatter in the open plots.
 for(let i=0;i<36;i++){
  const z=-23+hash(i,714)*46,side=i%2?1:-1,x=commonsStream(z)+side*(4.2+hash(i,715)*.65);
  if(commonsRailDistance(x,z)<2.5)continue;
  const y=commonsSurface(x,z);
  for(let k=0;k<3;k++){const dx=(k-1)*.09,top=y+.20+hash(i,k)*.25;b.tri([x+dx-.025,y,z],[x+dx+side*.10,top,z+.06],[x+dx+.025,y,z],'#829565',8);}
 }
}
function commonsBuildable(x,z,radius=0){
 return commonsPlacementIssue(x,z,radius)===null;
}
function commonsPlacementIssue(x,z,radius=0){
 if(Math.abs(x)+radius>=COMMONS_WIDTH/2-1||Math.abs(z)+radius>=COMMONS_DEPTH/2-1)return 'The footprint crosses the model-board margin.';
 if(commonsBank(x,z)<=5.6+radius*1.5)return 'The footprint is too close to the stream. Keep the banks open.';
 if(commonsRailDistance(x,z)<radius+1.55)return 'The footprint is too close to the Commons circuit.';
 if(Math.abs(x+28)<6+radius&&Math.abs(z-23.1)<1.6+radius)return 'Leave the halt platform and its approach clear.';
 if(COMMONS_TREES.some(t=>Math.hypot(x-t.x,z-t.z)<=radius+t.h*.52))return 'The footprint overlaps established woodland.';
 return null;
}
function commonsShell(b){
 const walls=[];b.box(0,FLOOR-.25,0,158,.45,130,'#b09a76',21);
 for(const which of['back','left','right','front']){
  const w=new Builder(),wide=which==='back'||which==='front',width=wide?156:128;
  const pos=which==='back'?[0,0,-64]:which==='front'?[0,0,64]:which==='left'?[-78,0,0]:[78,0,0],angle=which==='back'?0:which==='front'?PI:which==='left'?PI/2:-PI/2;
  w.push(...pos,0,angle);w.box(0,4,0,width,56,.6,'#dbd8bd',20);w.box(0,-16,.45,width,16,.45,'#819587',22);
  for(const y of[-23.6,-8,30.5])w.box(0,y,.7,width,.65,.75,'#b59e77',22);
  for(let x=-width/2+4;x<width/2;x+=9)w.box(x,-16,.74,.16,14,.16,'#a7b09a',22);
  if(which==='back'){
   for(const x of[-45,0,45]){
    roomSign(w,'window',x,11.5,.85,32,31,0,33);
    for(const dx of[-16,0,16])w.box(x+dx,11.5,1.04,.4,32,.6,'#c8bca0',22);
    for(const y of[-4,11.5,27])w.box(x,y,1.06,33,.45,.65,'#c8bca0',22);
    w.box(x,-4.55,1.65,34,.6,3,'#baa37d',22);
    // Built-in window seats make this a shared garden room, not an empty box.
    w.box(x,-18.7,4.7,34,10,8,'#a5ad91',22);w.box(x,-13.4,4.9,35,.65,8.5,'#bda67d',22);
    for(const dx of[-10.5,0,10.5]){w.box(x+dx,-12.8,4.9,9.8,.6,7.1,'#c6c4a4',23);w.box(x+dx,-18,8.76,9.4,7,.12,'#8d9f86',22);w.box(x+dx,-15.6,8.9,1.9,.16,.22,'#b7a575',41);}

   }
  }else if(which==='left'||which==='right'){
   // Shallow framed panels and a picture rail add rhythm to the long walls.
   w.box(0,20,1,116,.25,.5,'#c7b58e',22);
   for(const [x,key]of[[-33,'manual'],[18,'window']]){w.box(x,5,.8,31,24,.6,'#ac9972',22);w.box(x,5,1.13,29,22,.06,'#bac2a2',23);roomFrame(w,key,x,5,1.2,24,16);}
  }else if(which==='front'){
   w.box(0,-3,.85,20,42,.8,'#ad9671',22);w.box(0,-3,1.3,17,39,.18,'#6f897a',22);
   w.cylinder(6,-4,1.65,.32,.32,.4,'#c8b480',41,12,PI/2);
   const plaque='house-'+Object.keys(HOUSE_ROOMS).indexOf('commons');if(roomLabels[plaque])roomFrame(w,plaque,0,23,1,39,9);
  }
  w.pop();walls.push({which,mesh:w.mesh()});
 }
 return walls;
}
function commonsFurnishings(b){
 // A shared drawing bench occupies the room's side aisle, clear of the board.
 b.push(67,FLOOR,-6,0,PI/2);
 b.box(0,12,0,38,1.1,10,'#b79c70',22);
 for(const xx of[-16,16])for(const zz of[-3.5,3.5])b.box(xx,5.8,zz,.85,11.6,.85,'#668071',22);
 b.box(0,4,0,34,.55,7,'#aa936e',22);
 for(let i=0;i<4;i++)b.box(-10,4.5+i*.38,0,10,.34,5.2,['#bfc5ac','#cfc5a4'][i%2],23);
 onTop(b,'manual',-7,12.58,0,12,7);onTop(b,'mat',8,12.58,0,10,7);
 for(let i=0;i<5;i++)b.beam([4+i*.48,12.68,-2],[4+i*.48,12.68,1.6],.07,['#a98058','#809582','#bdad79'][i%3],22,6);
 b.box(12,13.35,1.5,3,1.5,2.4,'#85987b',23);b.box(12,14.15,1.5,3.2,.12,2.6,'#c5b08a',22);
 b.pop();
 // A linen runner defines the approach without filling the shared landscape.
 b.box(0,FLOOR+.03,46,82,.05,10,'#778975',23);
 for(const z of[41.6,50.4])b.box(0,FLOOR+.065,z,79,.02,.18,'#c9c4a6',23);
 // Pendants correspond to the room's actual overhead lighting positions.
 for(const x of[-28,28]){
  b.beam([x,34,0],[x,26.8,0],.07,'#8c805e',41,8);
  b.cylinder(x,25.8,0,3.2,1.35,2.0,'#c7ba95',23,20);
  b.cylinder(x,24.78,0,2.98,2.98,.06,'#ecdbb2',25,20);
 }
}
function commonsHalt(b){
 const y=COMMONS_RAIL_Y;
 b.box(-28,y-.05,23.1,10,.38,1.9,'#a6a68e',4);
 for(let i=0;i<25;i++)b.box(-32.8+i*.4,y+.16,23.1,.38,.055,1.95,'#c1b99b',4);
 b.box(-28,y+.20,24.07,10,.04,.14,'#e1d5b6',23);
 for(const x of[-32.4,-23.6])houseLamp(b,x,y+.19,22.6,2.1);
 bench(b,-30.4,y+.19,22.8,PI);
 for(const x of[-25.5,-24.2])b.box(x,y+.9,22.3,.055,1.4,.055,'#607b6a',22);
 b.box(-24.85,y+1.38,22.3,1.55,.43,.09,'#607b6a',22);
 // A footpath joins the first workshop to the inside of the halt, never the rails.
 housePath(b,[[-27.7,12.5],[-28.6,17],[-28,21.9]],.85,commonsSurface,'#bdb394');
}
function commonsRails(b){
 const edge=COMMONS_ROUTE;
 ribbon(b,edge,1.36,0,-.13,'#858b79',9,0,edge.length,.36);
 ribbon(b,edge,1.51,0,-.21,'#8e927c',9,0,edge.length,.4);
 // Modest branch-line sleeper spacing and plain rail seats avoid hundreds of
 // tiny fastener boxes. Gauge and running rail profiles match the other rooms.
 for(let d=0;d<edge.length;d+=.36){const a=edge.at(d);b.matrix(basis(a.p,a.f));
  b.box(0,-.062,0,1.04,.075,.13,'#746c53',2);
  for(const side of[-1,1])b.box(side*.32,-.011,0,.14,.025,.17,'#576356',11);
  b.pop();
 }
 for(const side of[-1,1]){ribbon(b,edge,.055,side*.32,.021,'#606d64',11,0,edge.length,.24);ribbon(b,edge,.07,side*.32,.057,'#acb3a6',1,0,edge.length,.24);}
}
function commonsBridges(b){
 for(const bridge of COMMONS_BRIDGES){
  const {x,z,half}=bridge,y=COMMONS_RAIL_Y;
  // Low plate-girder sides leave the view across the water open.
  b.box(x,y-.28,z,half*2,.18,1.65,'#667d71',41);
  for(const side of[-1,1]){
   b.box(x,y-.08,z+side*.96,half*2+.5,.58,.14,'#536f63',41);
   b.box(x,y+.23,z+side*.96,half*2+.6,.07,.22,'#a0ad91',41);
   for(let i=0;i<=10;i++){const xx=x-half+i*half/5;b.box(xx,y-.06,z+side*1.045,.05,.5,.035,'#91a28c',41);}
  }
  for(const side of[-1,1]){
   const xx=x+side*half,g=commonsSurface(xx,z);
   b.box(xx,(g+y-.20)/2,z,.72,Math.max(.25,y-.20-g),2.5,'#aaa991',4);
   b.box(xx,y-.23,z,.95,.18,2.7,'#c4bea1',4);
  }
 }
}
function commonsRoom(scene,b){
 commonsFurnishings(b);
 modelTable(b,0,0,COMMONS_WIDTH+1,COMMONS_DEPTH+1,-.8,'#8b9b6d');
 houseTerrain(b,COMMONS_WIDTH,COMMONS_DEPTH,commonsHeight,commonsGroundColor,.75);
 // The bed continues under the water; this narrow ribbon ends at the board edge.
 for(let z=-COMMONS_DEPTH/2;z<COMMONS_DEPTH/2;z+=.5){
  const q=Math.min(COMMONS_DEPTH/2,z+.5),a=commonsStream(z),c=commonsStream(q);
  for(let i=0;i<6;i++){
   const l=-4.5+i*9/6,r=l+9/6,points=[[a+l,COMMONS_WATER,z],[c+l,COMMONS_WATER,q],[c+r,COMMONS_WATER,q],[a+r,COMMONS_WATER,z]];
   for(const k of[0,1,2,0,2,3])b.vertex(points[k],[0,1,0],lerpV(col('#648c83'),col('#a0b5a0'),Math.abs(k<2?l:r)/4.5),7);
  }
 }
 commonsRails(b);commonsBridges(b);commonsHalt(b);
 scene.routes=[COMMONS_ROUTE];scene.trains=[{edge:COMMONS_ROUTE,distance:30,speed:.72,type:'steam',stock:'coast',cars:2}];
 // Deliberate woodland edges leave both banks available for later scenes.
 for(const t of COMMONS_TREES)commonsTree(b,t);
 commonsNaturalDetails(b);
 // Small stones and sparse reeds describe the water's edge without filling it.
 for(let i=0;i<72;i++){
  const z=-31+hash(i,371)*62,side=i%2?1:-1,x=commonsStream(z)+side*(4.2+hash(i,372)*1.3),y=commonsSurface(x,z);
  if(commonsRailDistance(x,z)<2)continue;
  if(i%3===0){const r=.10+hash(i,373)*.21;b.sphere(x,y+.05,z,r,.10,r*.7,'#b3b299',4,7,4);}
  else for(let j=0;j<3;j++){const h=.18+hash(i,j+374)*.23;b.beam([x+j*.05,y,z],[x+j*.05+side*.07,y+h,z+.05],.014,'#879967',8,4);}
 }
 scene.height=(x,z)=>Math.abs(x)<=54&&Math.abs(z)<=33?Math.max(COMMONS_WATER,commonsSurface(x,z)):FLOOR;
 scene.canPlace=commonsBuildable;
 scene.placementIssue=commonsPlacementIssue;
 scene.spots=[
  {name:'The Commons circuit',target:[0,1,0],distance:108,pitch:.66,yaw:.25,detail:'A little pottery workshop begins the story. Leave room for the next thoughtful addition.'},
  {name:'Willowbank Halt',target:[-28,2,23],distance:27,pitch:.45,yaw:.25,detail:'A little platform beside the pottery workshop. Two coaches make an unhurried circuit around the shared landscape.'},
  {name:'The woodland edge',target:[32,4,-16],distance:38,pitch:.47,yaw:-.4,detail:'Birches, oaks and conifers follow the folded ground. Their shade gives way to open meadow.'},
  {name:'The stream',target:[-3,1,3],distance:43,pitch:.63,yaw:.6,detail:'A gentle bend between grassy banks. Leave space for the water and whatever comes next.'},
  {name:'The eastern field',target:[25,1,7],distance:44,pitch:.68,yaw:-.35,detail:'Open ground below the wooded hill. A place for a thoughtful first contribution.'}
 ];
}
registerHouseRoom('commons',{
 name:'The Commons',layout:'A world we make together',tag:'ROOM TO GROW',
 description:'A railway around a landscape we make together, a winding stream, and open meadows. A shared room with space for the places we will make together.',
 color:'#a6b58a',ambient:'forest',target:[0,1,0],distance:146,phoneDistance:345,pitch:.66,yaw:.3,
 credits:[{name:'Whistlevale contributors',note:'Original landscape and room.'}],
 // The two miniature lights match the halt lamps; unused shader slots stay dark.
 layoutLights:[[-32.4,3.79,22.6],[-23.6,3.79,22.6],...Array.from({length:6},()=>[0,-10000,0])],
 build:commonsRoom,shell:commonsShell,lights:[[-28,24.78,0],[28,24.78,0],[-45,16,-61],[0,16,-61],[45,16,-61],[0,18,61]]
});
