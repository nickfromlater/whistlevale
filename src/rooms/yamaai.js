'use strict';

// Yamaai — the guest room.
//
// The house builds its own rooms. This one holds somebody else's work: the
// Mountain Railway Diorama by Techartist, vendored whole under its MIT licence
// and run unmodified inside a sandboxed frame that only exists while a visitor
// is standing here. See src/embedded.js for the mechanism and
// docs/contributing/embedded-projects.md for how to add another.
//
// Everything this room is built to do is point at the table and say whose work
// is on it: the plaque behind it, the rail around it, the credit dock in the
// interface, and the room's own name on the map.

const YAMAAI_TABLE={top:FLOOR+11.4,halfWidth:37,halfDepth:23.1};

// The four corners the frame is mapped onto, far edge first so the miniature
// stands up the right way under the room's default view.
function yamaaiSurface(){
 const {top,halfWidth,halfDepth}=YAMAAI_TABLE;
 return [[-halfWidth,top,-halfDepth],[halfWidth,top,-halfDepth],[halfWidth,top,halfDepth],[-halfWidth,top,halfDepth]];
}

function yamaaiTable(b){
 const {top,halfWidth,halfDepth}=YAMAAI_TABLE;
 const w=halfWidth*2,d=halfDepth*2,oak='#6b5336',dark='#4a3a28',felt='#2f4034';
 // A plain display table: the work on it is the thing worth looking at.
 slab(b,w+5.2,d+5.2,1.5,top-.75,2.2,oak,22);
 slab(b,w+4.4,d+4.4,.22,top+.06,2,dark,22);
 b.box(0,top-3.1,0,w+2.6,3.2,d+2.6,dark,22);
 b.box(0,top-4.9,0,w-1.4,1.2,d-1.4,felt,23);
 for(const x of[-halfWidth-.4,halfWidth+.4])for(const z of[-halfDepth-.2,halfDepth+.2]){
  b.box(x,(top+FLOOR)/2-2,z,2.5,top-FLOOR-3.4,2.5,oak,22);
  b.box(x,FLOOR+.7,z,3.3,1.4,3.3,dark,22);
 }
 // Stretchers, so the table reads as furniture rather than a floating plane.
 for(const z of[-halfDepth-.2,halfDepth+.2])b.box(0,FLOOR+6.4,z,w+.8,1.1,1.5,oak,22);
 b.box(0,FLOOR+6.4,0,1.5,1.1,d+.4,oak,22);
 // A low brass rail: museum furniture, and it keeps the eye on the tabletop.
 for(const [x,z,rw,rd] of[[0,-halfDepth-4.6,w+11,1],[0,halfDepth+4.6,w+11,1],[-halfWidth-5.5,0,1,d+9],[halfWidth+5.5,0,1,d+9]]){
  b.box(x,FLOOR+7.2,z,rw,.42,rd,'#b09a63',41);
  const posts=rw>rd?[[-rw/2+1,z],[0,z],[rw/2-1,z]]:[[x,-rd/2+1],[x,0],[x,rd/2-1]];
  for(const [px,pz] of posts)b.cylinder(rw>rd?px:x,(FLOOR+7.2+FLOOR)/2+.3,rw>rd?z:pz,.42,.42,7.4,'#8d7a4e',41,10);
 }
}

// The plaque. Geometry always; the lettering only when the atlas has room for
// it, exactly as the house's own room plaques behave.
function yamaaiPlaque(b){
 const y=FLOOR+19.5,z=-61.2;
 b.box(0,y,z+.9,66,25,1.1,'#33403a',22);
 b.box(0,y,z+.3,62.4,21.6,.5,'#b19a62',41);
 b.box(0,y,z+.1,61,20.2,.4,'#2c3832',23);
 if(roomLabels['embed-credit-0'])roomSign(b,'embed-credit-0',0,y,z-.2,58.6,18.4);
 // Two picture lights over it, so the credit is lit even at night.
 for(const x of[-19,19]){
  b.cylinder(x,y+14.6,z+2.4,.5,.5,4.2,'#8d7a4e',41,10,Math.PI/2);
  b.box(x,y+13.1,z+4.1,5.6,1.5,2.6,'#c9b177',41);
 }
}

function yamaaiRoom(scene,b){
 yamaaiTable(b);
 yamaaiPlaque(b);
 // Two benches facing the table. A guest room still belongs to the house.
 for(const z of[42,-42]){
  b.box(0,FLOOR+4.2,z,44,1.6,4.4,'#7a6244',22);
  for(const x of[-18,18])b.box(x,FLOOR+2.1,z,2.4,4.2,4,'#4a3a28',22);
 }
 scene.routes=[];scene.trains=[];
 scene.spots=[
  {name:'The table',target:[0,YAMAAI_TABLE.top-2,0],distance:104,phoneDistance:176,pitch:.5,yaw:.3},
  {name:'The plaque',target:[0,FLOOR+19.5,-46],distance:76,phoneDistance:128,pitch:.2,yaw:0}
 ];
 return scene;
}

registerHouseRoom('yamaai',{
 name:'Yamaai',layout:'The Guest Room',tag:'A ROOM FOR SOMEONE ELSE’S WORK',
 description:'Yamaai — a miniature Japanese mountain railway by Techartist, running on its own renderer on the table. A local train winds through a gorge, over a bridge and into the tunnel, past a station, a shrine, a river and a waterfall.',
 color:'#8fa38c',ambient:'forest',railway:false,target:[0,FLOOR+9,0],distance:118,phoneDistance:208,pitch:.5,yaw:.3,
 credits:[
  {name:'Techartist',platform:'x',handle:'techartist_',note:'Created the Mountain Railway Diorama; gave permission for it to be shown here.'},
  {name:'iamtechartist',platform:'github',handle:'iamtechartist',note:'Original source, MIT licensed.'},
  {name:'nickfromlater',platform:'github',handle:'nickfromlater',note:'Built the guest room that hosts it; built with agent assistance.'}
 ],
 build:yamaaiRoom
});

registerEmbeddedProject('yamaai',{
 entry:'vendor/mountain-railway-diorama/index.html',
 title:'Mountain Railway Diorama',
 subtitle:'Yamaai 山あい',
 source:'https://github.com/iamtechartist/mountain-railway-diorama',
 licence:'MIT',
 permission:'Shown here with the author’s permission, given publicly on 11 September 2026. The project runs unmodified from its own source.',
 credits:[
  {name:'Techartist',platform:'x',handle:'techartist_'},
  {name:'iamtechartist',platform:'github',handle:'iamtechartist'}
 ],
 frame:[1024,640],
 surface:yamaaiSurface
});
