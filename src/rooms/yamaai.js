'use strict';

// Original guest geometry, adapted to the house camera; vendor files stay intact.
const YAMAAI_TABLE={top:FLOOR+11.4,halfWidth:37,halfDepth:23.1};
const YAMAAI_PROJECT=registerEmbeddedProject('yamaai',{
 base:'vendor/mountain-railway-diorama/',create:createYamaaiMiniature,
 cinemaLabels:['Mountain drift','Station side','Whole miniature','Across the bridge'],
 roomName:'Yamaai',title:'Mountain Railway Diorama',subtitle:'Yamaai 山あい',
 commit:'6e8b0fbb806e486d7819b6d297b92f4ecf3d258b',
 source:'https://github.com/iamtechartist/mountain-railway-diorama',licence:'MIT',
 credits:[
  {name:'Techartist',platform:'x',handle:'techartist_',note:'Created the Mountain Railway Diorama; gave permission for it to be shown here.'},
  {name:'iamtechartist',platform:'github',handle:'iamtechartist',note:'Original source, MIT licensed.'}
 ],
 hostCredits:[{name:'nickfromlater',platform:'github',handle:'nickfromlater',note:'Built the guest room that hosts it; built with agent assistance.'}],
 table:YAMAAI_TABLE,focus:[0,FLOOR+26,0],distance:90,phoneDistance:160
});

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
 // This belongs to the back wall, so its cutaway follows the wall too.
 b.push(49,19,1.8,0,0,0,.62);const y=0,z=0;
 b.box(0,y,z,66,25,1.1,'#33403a',22);
 b.box(0,y,z+.65,62.4,21.6,.5,'#b19a62',41);
 b.box(0,y,z+1,61,20.2,.4,'#2c3832',23);
 if(roomLabels[YAMAAI_PROJECT.plaque])roomSign(b,YAMAAI_PROJECT.plaque,0,y,z+1.24,58.6,18.4);
 // Two picture lights over it, so the credit is lit even at night.
 for(const x of[-19,19]){
  b.cylinder(x,y+14.6,z+2.4,.5,.5,4.2,'#8d7a4e',41,10,Math.PI/2);
  b.box(x,y+13.1,z+4.1,5.6,1.5,2.6,'#c9b177',41);
 }
 b.pop();
}

function yamaaiRoom(scene,b){
 yamaaiTable(b);
 // Two benches facing the table. A guest room still belongs to the house.
 for(const z of[42,-42]){
  b.box(0,FLOOR+4.2,z,44,1.6,4.4,'#7a6244',22);
  for(const x of[-18,18])b.box(x,FLOOR+2.1,z,2.4,4.2,4,'#4a3a28',22);
 }
 scene.routes=[];scene.trains=[];
 scene.spots=[
  {name:'The miniature',target:YAMAAI_PROJECT.focus,distance:90,phoneDistance:160,pitch:.43,yaw:.3},
  {name:'The plaque',target:[49,19,-61],distance:45,phoneDistance:86,pitch:.02,yaw:0}
 ];
 return scene;
}

registerHouseRoom('yamaai',{
 name:YAMAAI_PROJECT.roomName,layout:YAMAAI_PROJECT.title,
 tag:'MOUNTAIN RAILWAY · BY '+YAMAAI_PROJECT.credits[0].name.toUpperCase(),
 description:embeddedCreditLine(YAMAAI_PROJECT)+'. A local train winds through a Japanese mountain gorge, over a bridge and into the tunnel, past a station, a shrine, a river and a waterfall.',
 color:'#8fa38c',ambient:'forest',railway:false,target:[0,FLOOR+23,0],distance:118,phoneDistance:208,pitch:.5,yaw:.3,
 credits:[...YAMAAI_PROJECT.credits,...YAMAAI_PROJECT.hostCredits],build:yamaaiRoom,shell:b=>roomShell('yamaai',b,yamaaiPlaque)
});
