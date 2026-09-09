'use strict';

// A shared starting landscape. Keep the broad meadows open: reviewed additions
// belong in contributions/world.json, with their own authorship and footprint.
const COMMONS_WIDTH=108,COMMONS_DEPTH=66,COMMONS_WATER=.42;
const commonsStream=z=>-4+7*Math.sin(z*.070)+2*Math.sin(z*.13+.7);
const commonsBank=(x,z)=>Math.abs(x-commonsStream(z));
function commonsHeight(x,z){
 const d=commonsBank(x,z),bank=smooth(1.9,5.6,d);
 const hills=7.2*Math.exp(-((x+37)**2/210+(z+24)**2/55))+9.0*Math.exp(-((x-35)**2/240+(z+25)**2/70));
 const meadow=.95+.11*Math.sin(x*.13)*Math.cos(z*.11);
 return mix(-.32,meadow+hills,bank);
}
// Match houseTerrain's emitted triangles for placements and low cameras.
function commonsSurface(x,z){
 const x0=Math.floor((x+54)/.75)*.75-54,z0=Math.floor((z+33)/.75)*.75-33,u=(x-x0)/.75,v=(z-z0)/.75;
 const a=commonsHeight(x0,z0),r=commonsHeight(x0+.75,z0),f=commonsHeight(x0,z0+.75),q=commonsHeight(x0+.75,z0+.75);
 return u+v<=1?a+(r-a)*u+(f-a)*v:q+(f-q)*(1-u)+(r-q)*(1-v);
}
const COMMONS_TREES=[];
for(const [cx,cz,n]of[[-42,-23,14],[37,-24,15],[-47,20,7],[45,22,6]])for(let i=0;i<n;i++){
 const a=i*2.399,r=2+Math.sqrt(i)*1.3,x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r*.65;
 if(Math.abs(x)<=51&&Math.abs(z)<=30)COMMONS_TREES.push({x,z,h:3.3+hash(i,cx)*2.5,pine:i%5===0});
}
function commonsBuildable(x,z,radius=0){
 return Math.abs(x)+radius<COMMONS_WIDTH/2-1&&Math.abs(z)+radius<COMMONS_DEPTH/2-1&&commonsBank(x,z)>5.6+radius*1.5&&COMMONS_TREES.every(t=>Math.hypot(x-t.x,z-t.z)>radius+t.h*.3);
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
   }
  }else if(which==='front'){
   w.box(0,-3,.85,20,42,.8,'#ad9671',22);w.box(0,-3,1.3,17,39,.18,'#6f897a',22);
   w.cylinder(6,-4,1.65,.32,.32,.4,'#c8b480',41,12,PI/2);
   const plaque='house-'+Object.keys(HOUSE_ROOMS).indexOf('commons');if(roomLabels[plaque])roomFrame(w,plaque,0,23,1,39,9);
  }
  w.pop();walls.push({which,mesh:w.mesh()});
 }
 return walls;
}
function commonsRoom(scene,b){
 modelTable(b,0,0,COMMONS_WIDTH+1,COMMONS_DEPTH+1,-.8,'#8b9b6d');
 houseTerrain(b,COMMONS_WIDTH,COMMONS_DEPTH,commonsHeight,(x,y,z)=>{
  const bank=commonsBank(x,z),grass=lerpV(col('#829b6e'),col('#b2b583'),.35+.2*Math.sin(x*.18+z*.09)+.12*Math.cos(z*.31));
  return bank<5?lerpV(col('#a4a78c'),grass,smooth(2.4,5,bank)):grass;
 },.75);
 // The bed continues under the water; this narrow ribbon ends at the board edge.
 for(let z=-COMMONS_DEPTH/2;z<COMMONS_DEPTH/2;z+=.5){
  const q=Math.min(COMMONS_DEPTH/2,z+.5),a=commonsStream(z),c=commonsStream(q);
  for(let i=0;i<6;i++){
   const l=-4.5+i*9/6,r=l+9/6,points=[[a+l,COMMONS_WATER,z],[c+l,COMMONS_WATER,q],[c+r,COMMONS_WATER,q],[a+r,COMMONS_WATER,z]];
   for(const k of[0,1,2,0,2,3])b.vertex(points[k],[0,1,0],lerpV(col('#648c83'),col('#a0b5a0'),Math.abs(k<2?l:r)/4.5),7);
  }
 }
 // Deliberate woodland edges leave both banks available for later scenes.
 for(const t of COMMONS_TREES)roomTree(b,t.x,commonsSurface(t.x,t.z),t.z,t.h,t.pine);
 // Small stones and sparse reeds describe the water's edge without filling it.
 for(let i=0;i<72;i++){
  const z=-31+hash(i,371)*62,side=i%2?1:-1,x=commonsStream(z)+side*(4.2+hash(i,372)*1.3),y=commonsSurface(x,z);
  if(i%3===0){const r=.10+hash(i,373)*.21;b.sphere(x,y+.05,z,r,.10,r*.7,'#b3b299',4,7,4);}
  else for(let j=0;j<3;j++){const h=.18+hash(i,j+374)*.23;b.beam([x+j*.05,y,z],[x+j*.05+side*.07,y+h,z+.05],.014,'#879967',8,4);}
 }
 scene.height=(x,z)=>Math.abs(x)<=54&&Math.abs(z)<=33?Math.max(COMMONS_WATER,commonsSurface(x,z)):FLOOR;
 scene.canPlace=commonsBuildable;
 scene.spots=[
  {name:'The open meadow',target:[-27,1,8],distance:43,pitch:.66,yaw:.25,detail:'Room for the first little building, a gathering, or a story. This landscape is ours to grow.'},
  {name:'The stream',target:[-3,1,3],distance:43,pitch:.63,yaw:.6,detail:'A gentle bend between grassy banks. Leave space for the water and whatever comes next.'},
  {name:'The eastern field',target:[25,1,7],distance:44,pitch:.68,yaw:-.35,detail:'Open ground below the wooded hill. A place for a thoughtful first contribution.'}
 ];
}
registerHouseRoom('commons',{
 name:'The Commons',layout:'A world we make together',tag:'ROOM TO GROW',railway:false,
 description:'A stream, wooded hills, and open meadows. A shared landscape waiting for the little places we will make together.',
 color:'#a6b58a',ambient:'forest',target:[0,1,0],distance:146,phoneDistance:345,pitch:.66,yaw:.3,
 credits:[{name:'Whistlevale contributors',note:'Original landscape and room.'}],
 // Eight fixed shader slots, kept below the floor until actual lamps are added.
 layoutLights:Array.from({length:8},()=>[0,-10000,0]),
 build:commonsRoom,shell:commonsShell,lights:[[-30,24.5,0],[30,24.5,0],[-45,16,-61],[0,16,-61],[45,16,-61],[0,18,61]]
});
