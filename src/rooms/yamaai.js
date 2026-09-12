'use strict';

// Original guest geometry, adapted to the house camera; vendor files stay intact.
const YAMAAI_TABLE={top:FLOOR+11.4,halfWidth:37,halfDepth:23.1};
const YAMAAI_PROJECT=registerEmbeddedProject('yamaai',{
 base:'vendor/mountain-railway-diorama/',create:createYamaaiMiniature,
 cinemaLabels:['Mountain drift','Station side','Whole miniature','Follow the local'],
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

// The room is dressed for a guest. A tokonoma is the alcove a Japanese house
// keeps for showing work that is not furniture and changes with the season —
// which is this whole room's argument, built into a wall. The rest is the kit a
// person accumulates while making something on a table: a step chest of parts,
// lanterns over the work, a maple that has already turned, tea going cold.

// The alcove, on the back wall: raised sill, timber post and lintel, a hanging
// scroll, and one branch in a vase. Traditionally a single thing, well placed.
function yamaaiTokonoma(b){
 const cedar='#7c6142',dark='#3b3025',paper='#ded2b4',shadow='#232c26';
 b.push(-44,FLOOR,-62.4);
 b.box(0,14,1.2,27,30,1.6,shadow,20);                       // the recess itself
 b.box(0,1.6,3.4,26,3.2,5.6,cedar,22);                      // raised sill
 b.box(0,2,5.9,26,.5,.7,'#5d4a32',22);
 for(const x of[-13.4,13.4])b.box(x,15,4.2,1.5,32,1.5,cedar,22);   // posts
 b.box(0,30.4,4.2,29,1.7,1.7,cedar,22);                     // lintel
 // The scroll: paper between two rollers, hung slightly proud of the back.
 b.box(0,20,2.4,9.4,19,.16,paper,23);
 for(const y of[29.7,10.4])b.cylinder(0,y,2.4,.42,.42,10.6,dark,22,10,0,Math.PI/2);
 b.box(0,25.6,2.5,6.2,.9,.06,'#6d5a3c',23);b.box(0,23.4,2.5,4.4,.7,.06,'#8a7352',23);
 // A vase with one branch, because the alcove holds one thing at a time.
 b.cylinder(-6.4,4.9,4.6,1.5,1.1,3.3,'#48584c',23,12);
 b.cylinder(-6.4,8.6,4.6,.2,.16,4.6,'#5c4a34',22,6,0,.22);
 for(const [dx,dy,dz,r] of[[-1.5,11.6,.3,.9],[1.2,12.4,-.4,.75],[-.4,13.6,.6,.6]])
  b.sphere(-6.4+dx,dy,4.6+dz,r,r*.8,r*.9,'#b4693c',23,7,5);
 b.pop();
}

// A tansu step chest. The stair form is the point: it is a chest and a staircase
// at once, and it gives the long wall something to do.
function yamaaiTansu(b){
 const cedar='#6d5334',face='#7f6440',iron='#2f3a33';
 b.push(-70,FLOOR,8,0,PI/2);
 for(let step=0;step<4;step++){
  const h=9+step*5.2,w=13,z=-19.5+step*13;
  b.box(0,h/2,z,w,h,12.6,cedar,22);
  for(let d=0;d<2+step;d++){
   const y=2.6+d*4.2;if(y>h-2)continue;
   b.box(.9,y,z,w-2.2,3.2,.5,face,22);
   b.cylinder(.9,y,z+6.6,.55,.55,.5,'#b09a63',41,8,0,PI/2);
   b.box(.9,y,z-6.5,w-2.2,3.2,.18,iron,41);
  }
 }
 b.pop();
}

// Three paper lanterns over the table, hung at different heights the way they
// actually are along a shrine approach — and the way they are on the model.
// Paper lanterns on iron wall brackets, echoing the ones along the model's
// shrine approach. They live near the walls rather than over the table: the
// miniature is scaled to rise as much as forty units off the top, and anything
// above the surface ends up inside somebody else's mountain.
function yamaaiLanterns(b){
 for(const [side,z,drop] of[[-1,-20,0],[-1,16,-3.2],[1,-16,-2.1],[1,20,-4.6]]){
  const wall=side*73,x=side*63,y=FLOOR+29+drop;
  // Bracket: a short arm off the wall with a diagonal stay under it.
  b.box((wall+x)/2,y+7.4,z,Math.abs(wall-x),.7,.7,'#3b3025',41);
  b.box(wall-side*.6,y+4.4,z,.8,6.6,.8,'#3b3025',41);
  b.cylinder(x,y+3.7,z,.09,.09,7.4,'#3b3025',22,6);
  b.cylinder(x,y,z,2.5,2.5,5.4,'#e7d7a8',23,14);
  for(let i=0;i<5;i++)b.cylinder(x,y-2.2+i*1.1,z,2.56,2.56,.12,'#c3ab77',23,14);
  b.cylinder(x,y+2.9,z,1.2,1.5,.8,'#4a3a28',22,12);
  b.cylinder(x,y-2.9,z,1.5,1.2,.8,'#4a3a28',22,12);
 }
}

// A maple that has already turned, and the tea nobody finished.
function yamaaiCorner(b){
 b.push(60,FLOOR,42);
 b.cylinder(0,2.6,0,5.2,4.4,5.2,'#5b4a3a',23,14);
 b.cylinder(0,5.6,0,5.3,5.1,.6,'#41352a',23,14);
 b.cylinder(0,10,0,.8,.55,9,'#584736',22,8);
 for(const [dx,dy,dz,r,c] of[[0,15.6,0,4.6,'#b4693c'],[-3.4,13.4,1.2,3.1,'#c07f3a'],[3,13.8,-1,2.9,'#9d5233'],[.6,18.2,-.4,2.4,'#cb9448']])
  b.sphere(dx,dy,dz,r,r*.62,r*.92,c,23,9,6);
 b.pop();
 // Tea beside the near bench, gone cold while the work went on.
 b.push(-36,FLOOR,50);
 b.box(0,3.1,0,13,.9,8,'#6d5334',22);
 for(const x of[-4.4,4.4])for(const z of[-2.6,2.6])b.box(x,1.5,z,.9,3.2,.9,'#4a3a28',22);
 for(const [x,z] of[[-3,.4],[3.2,-.6]]){
  b.cylinder(x,4.2,z,1.1,.85,1.7,'#dcd2ba',23,10);
  b.cylinder(x,5.05,z,1.0,1.0,.1,'#6a5c3e',23,10);
 }
 b.box(3.6,3.6,2.8,5.4,.12,3.6,'#e2d7bb',23);
 b.pop();
}

function yamaaiRoom(scene,b){
 yamaaiTable(b);
 yamaaiTokonoma(b);yamaaiTansu(b);yamaaiLanterns(b);yamaaiCorner(b);
 // Two benches facing the table. A guest room still belongs to the house.
 for(const z of[42,-42]){
  b.box(0,FLOOR+4.2,z,44,1.6,4.4,'#7a6244',22);
  for(const x of[-18,18])b.box(x,FLOOR+2.1,z,2.4,4.2,4,'#4a3a28',22);
 }
 scene.routes=[];scene.trains=[];
 scene.spots=[
  {name:'The miniature',target:YAMAAI_PROJECT.focus,distance:90,phoneDistance:160,pitch:.43,yaw:.3},
  {name:'The plaque',target:[49,19,-61],distance:45,phoneDistance:86,pitch:.02,yaw:0},
  {name:'The alcove',target:[-44,FLOOR+16,-58],distance:52,phoneDistance:94,pitch:.08,yaw:-.16}
 ];
 return scene;
}

registerHouseRoom('yamaai',{
 name:YAMAAI_PROJECT.roomName,layout:YAMAAI_PROJECT.title,
 tag:'MOUNTAIN RAILWAY · BY '+YAMAAI_PROJECT.credits[0].name.toUpperCase(),
 description:embeddedCreditLine(YAMAAI_PROJECT)+'. A local train winds through a Japanese mountain gorge, over a bridge and into the tunnel, past a station, a shrine, a river and a waterfall.',
 color:'#8fa38c',ambient:'forest',railway:false,target:[0,FLOOR+23,0],distance:118,phoneDistance:208,pitch:.5,yaw:.3,
 credits:[...YAMAAI_PROJECT.credits,...YAMAAI_PROJECT.hostCredits],build:yamaaiRoom,shell:b=>roomShell('yamaai',b,yamaaiPlaque),
 lights:[
  [-22,26,-7],[21,27,0],
  [-63,FLOOR+29,-20],[-63,FLOOR+25.8,16],[63,FLOOR+26.9,-16],[63,FLOOR+24.4,20],
  [-44,FLOOR+21,-57],[49,28,-58]
 ]
});
