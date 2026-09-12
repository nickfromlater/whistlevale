'use strict';

const HOUSE_ROOMS={
 valley:{number:'01',name:'Alder Valley',layout:'Alder Valley',tag:'THE ORIGINAL COLLECTION',description:'A whole county in miniature. Market mornings, busy platforms, and three trains taking the long way home.',color:'#94aa78',distance:153,target:[0,-1.5,-1],pitch:.57,yaw:.38,ambient:'town'},
 coast:{number:'02',name:'The Coastal Gallery',layout:'Tidewater Bay',tag:'SALT AIR & SLOW TRAINS',description:'A harbor railway around a sheltered bay. Fishing boats, striped parasols, and a lighthouse keeping watch.',color:'#83b1b4',distance:139,target:[0,-1,0],pitch:.62,yaw:.31,ambient:'coast'},
 alpine:{number:'03',name:'The Mountain Loft',layout:'Bergwald Railway',tag:'UP AMONG THE PINES',description:'Timber chalets and a red mountain train. Follow the high viaduct past hikers, a forest lake, and snowy peaks.',color:'#b2bac4',distance:151,target:[0,3,-1],pitch:.65,yaw:.32,ambient:'forest'},
 studio:{number:'04',name:'The Makers’ Shop',layout:'Little beginnings',tag:'WHERE WORLDS ARE MADE',description:'A proper hobby shop. Browse the kits, explore the workbenches, and discover two working tabletop railways.',color:'#c6a27c',distance:151,target:[0,-5,0],pitch:.62,yaw:.39,ambient:'workshop'}
};
const roomScenes=new Map();
const ROOM_SHELLS={};
const HOUSE_ROOM_BUILDERS=new Map();
let houseRoomRevision=0;
function houseRoomLights(key){return HOUSE_ROOMS[key]?.lights||roomLightPositions;}
function houseLayoutLights(key){return HOUSE_ROOMS[key]?.layoutLights||lampPositions.slice(0,8);}

// Register a room once; navigation, the 3D house and scene loading discover it.
function registerHouseRoom(key,definition){
 if(!/^[a-z][a-z0-9-]*$/.test(key))throw new Error('Room keys must be lowercase URL-safe names.');
 if(!definition||typeof definition.build!=='function')throw new Error('A room needs a build(scene, builder) function.');
 const {build,shell,...metadata}=definition;
 if(metadata.railway!==undefined&&typeof metadata.railway!=='boolean')throw new Error('Room railway must be a boolean.');
 if(metadata.credits!==undefined)metadata.credits=validateCredits(metadata.credits);
 HOUSE_ROOMS[key]={number:String(Object.keys(HOUSE_ROOMS).length+1).padStart(2,'0'),name:key,layout:key,tag:'A LITTLE WORLD',description:'A railway waiting to be explored.',color:'#99ad83',distance:150,target:[0,0,0],pitch:.65,yaw:.35,ambient:'forest',...HOUSE_ROOMS[key],...metadata};
 HOUSE_ROOM_BUILDERS.set(key,build);if(shell)ROOM_SHELLS[key]=shell;
 const cached=roomScenes.get(key);
 if(cached){for(const mesh of[cached.mesh,cached.lifeDetails?.mesh,...cached.walls.map(w=>w.mesh),...(cached.ownedMeshes||[])])disposeMesh(mesh);roomScenes.delete(key);}
 houseRoomRevision++;
 return HOUSE_ROOMS[key];
}

// One lettered credit plaque per embedded project, in the free atlas band
// below the Coastal window, then below the blueprint. These slots must not
// overlap the lazily painted coast-window (3390,620,690,420). Omitted when the
// atlas runs out, rather than overrunning it.
function initEmbeddedArt(){
 if(typeof EMBEDDED_PROJECTS!=='object')return;
 for(const [i,project] of Object.values(EMBEDDED_PROJECTS).entries()){
  const [x,y]=[[3310,1056],[610,524]][i]||[-1,-1],w=780,h=196;
  if(x<0||y+h>roomArt.height||x+w>roomArt.width){delete roomLabels[project.plaque];continue;}
  artSlot(project.plaque,x,y,w,h,(c,cw,ch)=>{
   const by=project.credits?.[0];
   c.fillStyle='#2c3832';c.fillRect(0,0,cw,ch);
   c.strokeStyle='#b19a62';c.lineWidth=3;c.strokeRect(11,11,cw-22,ch-22);
   c.textAlign='center';
   c.fillStyle='#e6d6a9';c.font='34px Georgia';c.fillText(project.title,cw/2,60);
   if(project.subtitle){c.fillStyle='#c3b483';c.font='italic 22px Georgia';c.fillText(project.subtitle,cw/2,92);}
   c.fillStyle='#efe2bd';c.font='27px Georgia';c.fillText('Made by '+(by?.name||'a guest'),cw/2,project.subtitle?136:122);
   c.fillStyle='#a9b79c';c.font='17px Arial';
   c.fillText(by&&by.platform==='x'?'@'+by.handle:by?.handle||'',cw/2,project.subtitle?170:158);
  });
 }
}

function initHouseArt(){
 let omittedPlaques=0;
 for(const [i,room]of Object.values(HOUSE_ROOMS).entries()){
  const column=i<4?i:(i-4)%4,x=1100+column*742,y=i<4?1610:2048+Math.floor((i-4)/4)*200;
  if(x+730>roomArt.width||y+180>roomArt.height){delete roomLabels['house-'+i];omittedPlaques++;continue;}
  artSlot('house-'+i,x,y,730,180,(c,w,h)=>{
   c.fillStyle=i===1?'#254a51':i===2?'#414a4e':'#273e35';c.fillRect(0,0,w,h);c.strokeStyle='#c2a672';c.lineWidth=2;c.strokeRect(9,9,w-18,h-18);
   c.textAlign='center';c.fillStyle='#e6d6b2';c.font='38px Georgia';c.fillText(room.name.toUpperCase(),w/2,83);c.font='15px Arial';c.fillText('WHISTLEVALE  /  HOBBY HOUSE  /  ROOM '+room.number,w/2,130);
  });
 }
 if(omittedPlaques)console.warn(`Whistlevale: ${omittedPlaques} room plaques omitted because the illustration atlas is full. Register rooms before startup; runtime additions need a full atlas and scene rebuild.`);
 const signs=[['shop-sign','WHISTLEVALE','A HOUSE OF LITTLE WORLDS'],['kits-sign','LITTLE WORLDS','LOCOMOTIVES  ·  KITS  ·  SCENERY'],['coast-sign','TIDEWATER BAY','THE COASTAL RAILWAY'],['mountain-sign','BERGWALD','THE MOUNTAIN RAILWAY']];
 signs.forEach(([key,title,sub],i)=>artSlot(key,1100+i*742,1810,730,180,(c,w,h)=>{c.fillStyle='#ede0c2';c.fillRect(0,0,w,h);c.strokeStyle='#877048';c.strokeRect(8,8,w-16,h-16);c.textAlign='center';c.fillStyle='#37524a';c.font='46px Georgia';c.fillText(title,w/2,83);c.font='16px Arial';c.fillText(sub,w/2,131);}));
 const smallSigns=[['bay-station','TIDEWATER BAY','HARBOUR LINE  ·  PLATFORM 1'],['alpine-station','BERGWALD','1,240 METRES ABOVE THE EVERYDAY'],['fresh-fish','THE FISH SHED','THE MORNING CATCH'],['sea-cafe','SALT & BUTTER','COFFEE  ·  FRESH BREAD'],['workshop-class','THE SATURDAY WORKSHOP','MAKE SOMETHING SMALL.'],['shop-counter','GOOD THINGS TAKE TIME','ASK US ABOUT YOUR NEXT LITTLE WORLD']];
 smallSigns.forEach(([key,title,sub],i)=>artSlot(key,1090+i*480,1380,466,150,(c,w,h)=>{c.fillStyle='#244a46';c.fillRect(0,0,w,h);c.strokeStyle='#ac9970';c.strokeRect(5,5,w-10,h-10);c.textAlign='center';c.fillStyle='#eadcc0';c.font='25px Georgia';c.fillText(title,w/2,66);c.font='10px Arial';c.fillStyle='#bfbd9d';c.fillText(sub,w/2,106);}));
 ['STEAM DAYS','MOUNTAIN LINE','HARBOUR HOUSE','WOODLAND KIT'].forEach((title,i)=>artSlot('kit-'+i,4+i*267,1826,255,200,(c,w,h)=>{
  c.fillStyle='#e0d1ae';c.fillRect(0,0,w,h);c.fillStyle=['#546e67','#647b78','#a08b66','#6e805d'][i];c.fillRect(6,6,w-12,131);
  c.fillStyle='#a9b39a';c.beginPath();c.moveTo(6,117);for(let x=6;x<w-5;x+=4)c.lineTo(x,78+Math.sin(x*.021+i)*16+Math.sin(x*.06+i)*6);c.lineTo(w-6,137);c.lineTo(6,137);c.closePath();c.fill();
  c.fillStyle='#d7c599';c.beginPath();c.arc(204,35,17,0,TAU);c.fill();
  if(i<2){c.fillStyle=i?'#a56c54':'#294a40';c.fillRect(48,89,156,25);if(!i){c.fillRect(56,68,34,27);c.fillRect(144,71,10,20);c.fillRect(115,83,15,10);}else{c.fillRect(44,84,163,8);c.fillStyle='#d8d6b2';for(let k=0;k<8;k++)c.fillRect(57+k*18,94,11,9);}c.fillStyle='#3e4d3d';for(let k=0;k<5;k++){c.beginPath();c.arc(63+k*31,116,i?5:8,0,TAU);c.fill();}c.fillStyle='#e1cda0';c.fillRect(28,125,197,3);}
  else if(i===2){c.fillStyle='#d8c7a0';c.fillRect(75,64,110,60);c.fillStyle='#456d63';c.beginPath();c.moveTo(60,67);c.lineTo(128,29);c.lineTo(197,67);c.closePath();c.fill();for(const x of[91,144]){c.fillStyle='#628c83';c.fillRect(x,77,20,24);c.fillStyle='#e9daba';c.fillRect(x+9,77,2,24);}c.fillStyle='#5a7668';c.fillRect(121,93,18,31);}
  else for(let k=0;k<7;k++){const x=32+k*32,y=113+(k%2)*7;c.fillStyle=k%2?'#3d6852':'#51775a';c.beginPath();c.moveTo(x,y-64-k%3*8);c.lineTo(x-23,y);c.lineTo(x+23,y);c.closePath();c.fill();c.fillStyle='#817052';c.fillRect(x-2,y-5,4,18);}
  c.fillStyle='#334c40';c.textAlign='center';c.font='21px Georgia';c.fillText(title,w/2,164);c.font='8px Arial';c.fillText('WHISTLEVALE  /  THE MINIATURE COLLECTION',w/2,186);
 }));
 initEmbeddedArt();
 gl.bindTexture(gl.TEXTURE_2D,roomAtlasTexture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,roomArt);gl.generateMipmap(gl.TEXTURE_2D);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
}

function roomShell(kind,b,backPlaque=null){
 const walls=[],coast=kind==='coast',alpine=kind==='alpine',yamaai=kind==='yamaai';
 const panel=coast?'#456971':alpine?'#686052':yamaai?'#4a4536':'#4b5b49',paint=coast?'#d5d4c0':alpine?'#c4bba5':yamaai?'#ddd0b2':'#d1c4a9';
 b.box(0,FLOOR-.25,0,158,.45,130,'#9b7951',21);
 b.push(0,FLOOR+.03,0,-PI/2);roomSign(b,'rug',0,0,0,113,83);b.pop();
 for(const which of['back','left','right','front']){
  const w=new Builder(),back=which==='back',front=which==='front',width=back||front?156:128,pos=back?[0,0,-64]:front?[0,0,64]:which==='left'?[-78,0,0]:[78,0,0],angle=back?0:front?PI:which==='left'?PI/2:-PI/2;
  w.push(...pos,0,angle);w.box(0,4,0,width,56,.6,paint,20);
  w.box(0,-16,.45,width,16,.5,panel,22);w.box(0,-8,.7,width,.4,.7,'#b39a72',22);w.box(0,-23,.7,width,1.1,.7,'#887957',22);
  for(let x=-width/2+3;x<width/2;x+=7){w.box(x,-16,.77,.15,13,.15,'#9caa8a',22);w.box(x+3,-9.8,.77,6,.16,.15,'#9caa8a',22);w.box(x+3,-22,.77,6,.16,.15,'#9caa8a',22);}
  w.box(0,30.7,.4,width,1.5,1.2,'#846949',22);
  if(back){
   roomSign(w,'window',0,12,.8,43,28,0,33);for(const x of[-22,-11,0,11,22])w.box(x,12,1,.45,29,.65,'#c4b590',22);for(const y of[-2.3,12,26.3])w.box(0,y,1,44,.5,.7,'#c4b590',22);
   w.box(0,-2.8,1.6,46,.60,3.0,'#b59a72',22);roomFrame(w,'clock',26.3,12,1,5.4,5.4);
   const plaqueKey='house-'+Object.keys(HOUSE_ROOMS).indexOf(kind);if(roomLabels[plaqueKey])roomFrame(w,plaqueKey,-49,20,1,41,10);
   if(backPlaque)backPlaque(w);else roomFrame(w,kind==='studio'?'kits-sign':kind==='coast'?'coast-sign':'mountain-sign',49,19,1,37,10);
  }else if(!front){roomFrame(w,coast?'poster':'blueprint',-28,10,1,25,17);roomFrame(w,'slow',29,9,1,15,21);}
  if(front){w.box(0,-3,1,19,42,1,'#79674a',22);w.box(0,-3,1.6,16,39,.2,panel,22);w.cylinder(6,-4,1.95,.35,.35,.5,'#c6ae71',41,14,PI/2);roomFrame(w,'shop-sign',0,23,1,35,8);}
  w.pop();walls.push({which,mesh:w.mesh()});
 }
 // A timber gable gives the loft its character while the roof is cut away.
 if(alpine){b.beam([-78,29,-64],[0,43,-64],.65,'#74583d',22,4);b.beam([0,43,-64],[78,29,-64],.65,'#74583d',22,4);for(let x=-60;x<=60;x+=30)b.beam([x,30,-64],[x,43-Math.abs(x)*14/78,-64],.42,'#8b6c48',22,4);}
 for(const x of[-28,28]){
  b.beam([x,27,0],[x,38,0],.055,'#4c4939',41,8);b.cylinder(x,26,0,4.5,1.1,3,'#416257',41,24);b.cylinder(x,24.49,0,4.1,4.1,.05,'#efdba7',25,24);
 }
 plant(b,-68,45,1.05);plant(b,65,-43,1.2);
 return walls;
}

function kitShelf(b,x,z,w=30,angle=0){
 b.push(x,FLOOR,z,0,angle);b.box(0,18,-1.8,w,36,.8,'#445548',22);
 for(const s of[-1,1])b.box(s*w/2,18,0,.65,36,5.5,'#8f6d46',22);
 for(let shelf=0;shelf<5;shelf++){
  const y=2+shelf*7.5;b.box(0,y,0,w,.42,5.7,'#a17e4e',22);b.box(0,y-.35,2.6,w-.5,.14,.15,'#e5be79',25);
  if(shelf===4)continue;
  for(let j=0;j<5;j++){
   const xx=-w/2+3+j*(w-5)/5,h=3.5+hash(j,shelf)*2.1,c=['#718783','#c5b082','#a47b60','#70778b','#8b9b6c'][(j+shelf)%5];
   b.box(xx,y+h/2+.22,.2,4.7,h,4.2,c,23);roomSign(b,'kit-'+((j+shelf)%4),xx,y+h/2+.22,2.325,4.25,h*.80);
  }
 }
 b.box(0,37,0,w+1.5,1,6,'#b0915d',22);b.pop();
}

function modelTable(b,x,z,w,d,height=-1,finish='#637950'){
 b.push(x,0,z);slab(b,w,d,2.0,height-1.1,2,'#795737',22);slab(b,w+.15,d+.15,.08,height-.065,2.02,'#d8bc7a',41);slab(b,w-.4,d-.4,.50,height+.22,1.8,finish,3);
 for(const xx of[-w*.34,w*.34])for(const zz of[-d*.33,d*.33]){b.box(xx,(FLOOR+height-2)/2,zz,1.6,height-2-FLOOR,1.6,'#65503a',22);b.box(xx,FLOOR+.10,zz,1.9,.2,1.9,'#464536',0);}
 b.box(0,FLOOR+4,0,w*.76,.7,1.1,'#716043',22);b.pop();
}

function cottage(b,x,y,z,w=3.5,d=3,h=3,c='#d6c4a0',roof='#6a7e6b',angle=0){
 b.push(x,y,z,0,angle);b.box(0,.09,0,w+.22,.18,d+.22,'#aaa88e',4);b.box(0,h/2,0,w,h,d,c,4);gable(b,w,d,h,.85,roof);
 for(const s of[-1,1])for(let j=0;j<(h>3.2?2:1);j++){windowPane(b,s*w*.27,1.15+j*1.5,d/2+.03,.58,.69);b.box(s*w*.27,1.48+j*1.5,d/2+.085,.72,.07,.14,'#e4d4b2',22);flowerBox(b,s*w*.27,.70+j*1.5,d/2+.23,.62);}
 b.box(0,.65,d/2+.04,.55,1.3,.09,'#5b7870',22);b.box(0,.07,d/2+.35,.95,.13,.5,'#b9b395',4);b.box(w*.3,h+.65,-.55,.45,1.35,.45,'#a3957c',4);
 for(const s of[-1,1]){b.push(s*(w/2+.035),1.25,0,0,s*PI/2);windowPane(b,0,0,0,.63,.73);b.pop();}b.pop();
}

function roomTree(b,x,y,z,h=4,pineTree=false,snow=false){
 b.cylinder(x,y+h*.32,z,.11,.045,h*.65,'#77634a',22,7);
 if(pineTree){for(let i=0;i<4;i++){const t=i/4,r=h*(.23-t*.16);b.cylinder(x,y+h*(.37+t*.55),z,r,.025,h*.34,i%2?'#456752':'#56765c',8,9);if(snow)b.cylinder(x,y+h*(.43+t*.55),z,r*.73,0,h*.25,'#d5ded9',3,9);}}
 else for(let i=0;i<5;i++){const a=i*2.4;b.sphere(x+Math.sin(a)*h*.17,y+h*(.7+i*.03),z+Math.cos(a)*h*.17,h*.27,h*.32,h*.26,['#92a073','#788e60','#b8b17d'][i%3],8,9,6);}
}

function ovalRoute(name,cx,cz,rx,rz,y=1.0){
 const points=[];for(let i=0;i<12;i++){const a=i*TAU/12;points.push([cx+Math.cos(a)*rx,y,cz+Math.sin(a)*rz]);}return new Edge(name,splineCurves(points,true,.82));
}
function scenePerson(scene,b,x,y,z,pose='stand',angle=0,scale=1){const i=scene.population++;littlePerson(b,x,y,z,{pose,angle,scale,variant:i,color:PEOPLE_COLORS[i%8]});}

// Continuous terrain and a small family of shared details keep each composition
// coherent when moving from the room view all the way down to a figure's height.
function houseTerrain(b,w,d,height,palette,step=.8){
 const nx=Math.ceil(w/step),nz=Math.ceil(d/step),verts=[],normals=[],colors=[];
 for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
  const x=-w/2+i*w/nx,z=-d/2+j*d/nz,y=height(x,z),n=norm([height(x-.14,z)-height(x+.14,z),.28,height(x,z-.14)-height(x,z+.14)]);
  verts.push([x,y,z]);normals.push(n);colors.push(palette(x,y,z,n));
 }
 for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i;for(const ids of[[a,a+nx+1,a+1],[a+1,a+nx+1,a+nx+2]])for(const k of ids)b.vertex(verts[k],normals[k],colors[k],3);}
 // Exposed model-board edge has the same landscape, with no floating turf.
 for(const side of[-1,1]){
  for(let i=0;i<nx;i++){const x=-w/2+i*w/nx,xx=x+w/nx,z=side*d/2;b.quad([x,.06,z],[xx,.06,z],[xx,height(xx,z),z],[x,height(x,z),z],'#918e69',3);}
  for(let i=0;i<nz;i++){const z=-d/2+i*d/nz,zz=z+d/nz,x=side*w/2;b.quad([x,.06,z],[x,.06,zz],[x,height(x,zz),zz],[x,height(x,z),z],'#918e69',3);}
 }
}
function housePath(b,points,width,height,color='#b4ad8c'){
 const p=points.map(([x,z])=>[x,height(x,z)+.035,z]),edge=new Edge('Footpath',splineCurves(p,false,.58));
 for(let d=0;d<edge.length;d+=.32){const a=edge.at(d),q=edge.at(Math.min(edge.length,d+.32)),r=norm([a.f[2],0,-a.f[0]]),s=norm([q.f[2],0,-q.f[0]]),v=(a,n,t)=>{const x=a.p[0]+n[0]*t,z=a.p[2]+n[2]*t;return[x,height(x,z)+.04,z];};b.quad(v(a,r,-width/2),v(q,s,-width/2),v(q,s,width/2),v(a,r,width/2),color,9);}
 return edge;
}
function houseLamp(b,x,y,z,h=2.15){
 b.cylinder(x,y+.11,z,.12,.095,.22,'#4f6860',41,8);b.cylinder(x,y+h*.47,z,.037,.025,h*.94,'#526f65',41,8);
 b.box(x,y+h,z,.23,.36,.23,'#e3c798',6);for(const s of[-1,1])for(const t of[-1,1])b.beam([x+s*.125,y+h-.20,z+t*.125],[x+s*.125,y+h+.20,z+t*.125],.012,'#465e54',41,5);
 b.cylinder(x,y+h+.25,z,.22,.025,.18,'#476154',41,4);b.cylinder(x,y+h-.20,z,.17,.17,.06,'#526a5b',41,4);
}
function houseRailing(b,points,y,h=.62,color='#b4b59a'){
 for(let i=0;i<points.length-1;i++){
  const a=[points[i][0],y,points[i][1]],q=[points[i+1][0],y,points[i+1][1]],n=Math.max(1,Math.ceil(len(sub(q,a))/.65));
  for(let j=0;j<=n;j++){const p=lerpV(a,q,j/n);b.box(p[0],p[1]+h/2,p[2],.055,h,.055,color,22);}
  for(const yy of[.23,h-.05])b.beam(add(a,[0,yy,0]),add(q,[0,yy,0]),.022,color,22,5);
 }
}
function houseHedge(b,points,height,h=.58){
 for(let i=0;i<points.length-1;i++){
  const a=points[i],q=points[i+1],n=Math.ceil(Math.hypot(q[0]-a[0],q[1]-a[1])/.43);
  for(let j=0;j<=n;j++){const t=j/n,x=mix(a[0],q[0],t),z=mix(a[1],q[1],t),y=height(x,z);b.sphere(x,y+h*.43,z,.36,h*.62,.37,j%3?'#698157':'#839267',8,7,5,true);}
 }
}
function houseStation(scene,b,x,y,z,key,alpine=false,angle=0){
 b.push(x,y,z,0,angle);
 b.box(0,.13,0,9.5,.26,4.8,'#bdb79b',4);b.box(0,1.64,-.2,5.5,3.05,2.7,alpine?'#c6bb9c':'#d2c5a3',4);gable(b,5.8,3,3.2,1.05,alpine?'#675647':'#668177');
 for(const xx of[-1.85,1.85])windowPane(b,xx,1.95,1.19,.83,1.2);b.box(0,.93,1.20,.85,1.62,.08,'#4f6d64',22);windowPane(b,0,1.23,1.26,.58,.77);
 for(const xx of[-4.1,-2.8,2.8,4.1])b.box(xx,1.24,1.70,.095,2.25,.095,'#5e7566',41);
 b.box(0,2.44,1.68,9.1,.16,1.8,alpine?'#7d6650':'#65877b',5);b.box(0,2.33,2.53,9.2,.22,.07,'#dbd1b0',22);
 roomSign(b,key,0,2.93,1.39,3.1,.73);b.box(-3.36,.64,.15,.36,1.0,.35,'#8c7653',22);b.box(-3.36,1.10,.36,.26,.66,.028,'#e3d7b9',0);
 for(const xx of[-3.2,3.3]){bench(b,xx,.27,1.35);scenePerson(scene,b,xx,.39,1.45,'sit');}
 b.cylinder(2.95,.6,.05,.15,.15,.66,'#6d826c',41,12);b.cylinder(2.95,.94,.05,.18,.18,.045,'#b1b49a',41,12);b.pop();
}

function getHouseScene(key){
 if(roomScenes.has(key))return roomScenes.get(key);
 const build=HOUSE_ROOM_BUILDERS.get(key);
 if(!build)throw new Error('No scene builder is registered for '+key+'.');
 const oldSeed=seed;seed=1783+Object.keys(HOUSE_ROOMS).indexOf(key)*3721;
 const scene={key,mesh:null,walls:[],routes:[],trains:[],actors:[],population:0,spots:[],height:()=>1},b=new Builder();
 try{
  scene.walls=(ROOM_SHELLS[key]||((builder)=>roomShell(key,builder)))(b);
  build(scene,b);
  if(!Array.isArray(scene.trains)||(!scene.trains.length&&HOUSE_ROOMS[key].railway!==false))throw new Error('Room "'+key+'" needs at least one train.');
  if(HOUSE_ROOMS[key].railway===false&&(scene.trains.length||scene.routes.length))throw new Error('Room "'+key+'" declares no railway; remove railway: false before adding routes or trains.');
  for(const [i,train]of scene.trains.entries()){
   if(!train?.edge||typeof train.edge.at!=='function'||!Number.isFinite(train.edge.length)||train.edge.length<=0)
    throw new Error('Room "'+key+'", train '+(i+1)+' needs a route edge with at(distance) and a positive finite length.');
   if(!Number.isFinite(train.distance)||!Number.isFinite(train.speed))
    throw new Error('Room "'+key+'", train '+(i+1)+' needs finite distance and speed values.');
  }
  scene.mesh=b.mesh();
  scene.lifeDetails=buildRoomLifeDetails(key,scene);scene.population+=scene.lifeDetails.population;
  if(typeof communityRoomPlaces==='function')communityRoomPlaces(scene);
  roomScenes.set(key,scene);return scene;
 }catch(error){
  // Shell walls may already be uploaded when a scene builder or its train
  // contract fails. Release those buffers; a partial room never enters the cache.
  const owned=[scene.mesh,scene.lifeDetails?.mesh,...(scene.ownedMeshes||[]),...(Array.isArray(scene.walls)?scene.walls:[]).map(w=>w?.mesh)];
  for(const mesh of new Set(owned))if(mesh)disposeMesh(mesh);
  throw error;
 }finally{seed=oldSeed;}
}

function houseRoomWallVisible(which,eye,boundary=null){const x=boundary??77.4,z=boundary??63.4;return which==='ceiling'?eye[1]<boundary:which==='back'?eye[2]>-z:which==='front'?eye[2]<z:which==='left'?eye[0]>-x:eye[0]<x;}
function drawHouseRoom(scene,p,shadow=false){
 draw(scene.mesh,I,p);draw(scene.lifeDetails?.mesh,I,p);
 if(!shadow)for(const wall of scene.walls){const visible=houseRoomWallVisible(wall.which,cameraPos,wall.boundary);if(visible)draw(wall.mesh,I,p);}
}

// Optional authored timetables still obey the shared pause and throttle controls.
function advanceHouseTrain(train,dt,rate){if(typeof train.advance==='function')train.advance(train,dt,rate);else train.distance+=dt*train.speed*rate;}
const houseFloodCache=new Map();
function houseFloodLights(key,model=null){
 const definition=HOUSE_ROOMS[key],cached=houseFloodCache.get(key);
 if(cached?.definition===definition&&cached.model===model)return cached;
 const value={definition,model,positions:new Float32Array(32),directions:new Float32Array(32),colors:new Float32Array(24)};
 for(const [i,l]of (definition?.floodLights||[]).slice(0,8).entries()){
  const p=model?transform(l.position,model):l.position,t=model?transform(l.target,model):l.target,scale=model?Math.hypot(model[0],model[1],model[2]):1;
  value.positions.set([...p,l.radius*scale],i*4);value.directions.set([...norm(sub(t,p)),l.cone],i*4);value.colors.set(l.color.map(c=>c*l.strength),i*3);
 }
 houseFloodCache.set(key,value);return value;
}
function bindHouseFloodLights(key,p,model=null){
 if(p!==mainProgram)return;const q=houseFloodLights(key,model);uf(p,'uLampFalloff',(HOUSE_ROOMS[key]?.layoutLightFalloff??.65)/(model?model[0]*model[0]:1));
 gl.uniform4fv(uniform(p,'uFloodPositions[0]'),q.positions);gl.uniform4fv(uniform(p,'uFloodDirections[0]'),q.directions);gl.uniform3fv(uniform(p,'uFloodColors[0]'),q.colors);
}
function houseTrainAt(train,offset=0){return circuitAt(train.edge,train.distance-offset);}
function drawHouseTrains(scene,p){
 const clip=scene.trainClip,model=typeof shopRoomModel!=='undefined'?shopRoomModel:null,scale=model?model[10]:1,z=model?model[14]:0;
 if(clip)uv3(p,'uClipZ',[clip[0]*scale+z,clip[1]*scale+z,1]);
 try{for(const train of scene.trains)drawHouseTrainFormation(scene,train,p);}
 finally{if(clip)uv3(p,'uClipZ',[0,0,0]);}
}
