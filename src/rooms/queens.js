'use strict';

// THE QUEENS PAVILION. Original miniature and room: nickfromlater,
// with agent assistance. See docs/rooms/queens.md and proposal #36.
const QUEENS_TABLE={top:-7.8,halfWidth:51.3,halfDepth:43.5};
const QUEENS_PROJECT=registerEmbeddedProject('queens',{
 base:'vendor/queens-miniature/',create:createQueensMiniature,
 roomName:'The Queens Pavilion',title:'A little Queens',subtitle:'Arthur Ashe · Flushing Meadows · The 7 line',
 source:'https://github.com/nickfromlater/whistlevale',licence:'MIT',
 credits:[{name:'nickfromlater',platform:'github',handle:'nickfromlater',note:'Original US Open tabletop world and Queens Pavilion; built with agent assistance.'}],
 table:QUEENS_TABLE,focus:queensWorld([0,7,0]),distance:132,phoneDistance:240,
 buildShapes:queensBuildShapes,buildStages:QUEENS_BUILD_STAGES,
 buildStageNames:['Court','Stadium','Roof','Park','Queens','Railway','Trains','Light'],
 cinemaLabels:['Arthur Ashe','At the station','A little Queens','Follow the 7'],cinemaShot:'drift'
});
const QUEENS_PALETTE={green:'#284c42',deep:'#20392f',sage:'#8f9f83',cream:'#ded2b4',oak:'#927047',walnut:'#634931',gold:'#b9a16a',dark:'#30362c',clay:'#aa785d'};
function queensText(b,text,x,y,z,w,color=QUEENS_PALETTE.cream){hudsonText(b,text,x,y,z,w,color);}
function queensFrame(b,x,y,z,w,h,color=QUEENS_PALETTE.green){
 b.box(x,y,z,w+1.7,h+1.7,.68,QUEENS_PALETTE.walnut,22);
 b.box(x,y,z+.38,w+.65,h+.65,.18,QUEENS_PALETTE.gold,41);
 b.box(x,y,z+.50,w,h,.12,color,23);
 for(const side of[-1,1]){b.box(x+side*(w/2+.71),y,z+.23,.13,h+1.5,.5,'#352d23',22);b.box(x,y+side*(h/2+.71),z+.23,w+1.5,.13,.5,'#352d23',22);}
}
function queensLoop(b,x,y,z,rx,ry,r,color=QUEENS_PALETTE.gold,segments=48){
 for(let i=0;i<segments;i++){const a=i*TAU/segments,c=(i+1)*TAU/segments;b.beam([x+Math.cos(a)*rx,y+Math.sin(a)*ry,z],[x+Math.cos(c)*rx,y+Math.sin(c)*ry,z],r,color,41,6);}
}
function queensRacquet(b,x,y,z,angle=0,wood=false){
 b.push(x,y,z,0,0,angle);
 queensLoop(b,0,2.5,0,3.35,4.45,.20,wood?'#b58a51':'#e0d5b7');
 queensLoop(b,0,2.5,.05,3.12,4.22,.055,'#33443a');
 for(let i=-5;i<=5;i++){
  const xx=i*.5,dy=4.1*Math.sqrt(1-(xx/3.08)**2);b.beam([xx,2.5-dy,.045],[xx,2.5+dy,.045],.019,'#d4caa3',0,4);
 }
 for(let i=-7;i<=7;i++){
  const yy=i*.5,dx=3.08*Math.sqrt(1-(yy/4.1)**2);b.beam([-dx,2.5+yy,.06],[dx,2.5+yy,.06],.019,'#d4caa3',0,4);
 }
 for(const side of[-1,1])b.beam([side*1.52,-1.25,0],[side*.35,-5.0,0],.15,wood?'#a37c47':'#bcc7ac',41,6);
 b.box(0,-6.45,0,.66,3.1,.57,wood?'#583d2b':'#596d57',22);
 for(let y=-7.7;y<-5;y+=.26)b.beam([-.32,y,.30],[.32,y+.16,.30],.023,'#baa685',0,4);
 b.box(0,-8.06,0,.78,.22,.67,QUEENS_PALETTE.gold,41);b.pop();
}
function queensCourtDrawing(b,x,y,z,w=32,h=25){
 queensFrame(b,x,y,z,w,h,'#304e53');
 const ink='#ddd6b7',face=z+.59,cw=w*.40,ch=h*.74;
 const line=(x0,y0,x1,y1,r=.035)=>b.beam([x+x0,y+y0,face],[x+x1,y+y1,face],r,ink,0,4);
 for(const xx of[-cw/2,cw/2])line(xx,-ch/2,xx,ch/2);
 for(const yy of[-ch/2,ch/2])line(-cw/2,yy,cw/2,yy);
 for(const xx of[-cw*.375,cw*.375])line(xx,-ch/2,xx,ch/2);
 for(const yy of[-ch*.27,ch*.27])line(-cw*.375,yy,cw*.375,yy);
 line(0,-ch*.27,0,ch*.27);line(-cw*.56,0,cw*.56,0,.06);
 for(let yy=-ch*.47;yy<ch*.49;yy+=.55)line(-cw*.63,yy,-cw*.60,yy,.025);
 queensText(b,'THE COURT',x,y+h*.40,face,w*.52);queensText(b,'23.77 M',x,y-h*.43,face,w*.30);
 for(const [dx,dy]of[[-w*.34,-h*.34],[w*.32,h*.30]]){queensLoop(b,x+dx,y+dy,face,1.1,1.1,.05,'#c3ae72',24);}
}
function queensPictureLight(b,x,y,z,w=10){
 const g=QUEENS_PALETTE.gold;
 b.box(x,y,z,.8,2,.6,g,41);b.beam([x,y+.5,z+.2],[x,y+.5,z+2.3],.13,g,41,8);
 b.cylinder(x,y+.3,z+2.5,.38,.38,w,g,41,14,0,PI/2);
 b.box(x,y-.05,z+2.5,w*.88,.07,.38,'#ffe1a1',6);
}
function queensWindow(b,x,y,z,w=26,h=29){
 queensFrame(b,x,y,z,w+1.6,h+1.6,'#b6ba9e');roomSign(b,'window',x,y,z+.62,w,h,0,33);
 for(const xx of[-w/2,0,w/2])b.box(x+xx,y,z+.91,.5,h+1.1,.5,'#d5c7a5',22);
 for(const yy of[-h/2,-h*.16,h*.18,h/2])b.box(x,y+yy,z+.93,w+.8,.43,.55,'#d5c7a5',22);
 b.box(x,y-h/2-.65,z+1.50,w+4,.78,3.7,QUEENS_PALETTE.oak,22);
 for(const side of[-1,1]){b.box(x+side*(w/2+2),y,z+.90,2.1,h+3.3,.65,QUEENS_PALETTE.deep,22);for(let yy=y-h/2;yy<y+h/2;yy+=1.15)b.box(x+side*(w/2+2),yy,z+1.31,1.6,.24,.25,'#73846c',22);}
}
function queensSconce(b,x,y,z){
 b.box(x,y,z,1.9,7.2,.45,QUEENS_PALETTE.gold,41);
 b.beam([x,y-1.8,z+.3],[x,y-1.8,z+2.6],.17,QUEENS_PALETTE.gold,41,8);
 b.cylinder(x,y+.4,z+2.6,1.18,1.64,3.7,'#e5d5a8',23,14);
 b.cylinder(x,y-1.51,z+2.6,1.7,1.7,.15,QUEENS_PALETTE.gold,41,14);
 b.cylinder(x,y-1.59,z+2.6,1.35,1.35,.04,'#ffe7ad',6,14);
}
function queensShell(b){
 const P=QUEENS_PALETTE,walls=[];
 b.box(0,FLOOR-.25,0,158,.5,130,P.walnut,21);
 // Basket-weave parquet, with individual planks and a dark perimeter inlay.
 for(let ix=0;ix<12;ix++)for(let iz=0;iz<10;iz++){
  const x=-66+ix*12,z=-54+iz*12,turn=(ix+iz)%2;
  for(let k=0;k<4;k++){b.push(x,FLOOR+.015,z,0,turn?PI/2:0);b.box(-4.5+k*3,0,0,2.94,.026,11.94,['#8e714d','#a08057','#9b774d','#896943'][(ix+iz+k)%4],21);b.pop();}
 }
 for(const z of[-61,61]){b.box(0,FLOOR+.055,z,150,.055,.24,P.deep,22);b.box(0,FLOOR+.055,z+Math.sign(z)*.45,150,.05,.16,P.gold,41);}
 for(const x of[-73,73]){b.box(x,FLOOR+.055,0,.24,.055,122,P.deep,22);b.box(x+Math.sign(x)*.45,FLOOR+.055,0,.16,.05,122,P.gold,41);}
 // A bound green exhibition carpet makes the timber table feel placed.
 b.box(0,FLOOR+.08,0,115,.1,99,'#536a50',23);
 for(const z of[-48.3,48.3])b.box(0,FLOOR+.15,z,113,.022,.35,'#c6b684',23);
 for(const x of[-56.3,56.3])b.box(x,FLOOR+.15,0,.35,.022,96.8,'#c6b684',23);
 for(const which of['back','left','right','front']){
  const w=new Builder(),back=which==='back',front=which==='front',width=back||front?156:128;
  const pos=back?[0,0,-64]:front?[0,0,64]:which==='left'?[-78,0,0]:[78,0,0],angle=back?0:front?PI:which==='left'?PI/2:-PI/2;
  w.push(...pos,0,angle);w.box(0,5,0,width,58,.7,P.green,20);
  w.box(0,FLOOR+6.8,.52,width,13.6,.55,P.walnut,22);
  for(let x=-width/2+6;x<width/2-3;x+=12){
   w.box(x,FLOOR+6.8,.86,10.4,10.7,.25,'#796044',22);w.box(x,FLOOR+6.8,1.02,9.35,9.55,.13,'#4c4934',22);
   for(const side of[-1,1]){w.box(x+side*4.83,FLOOR+6.8,1.10,.16,9.9,.16,P.oak,22);w.box(x,FLOOR+6.8+side*4.86,1.1,9.7,.15,.16,P.oak,22);}
  }
  for(const y of[FLOOR+.5,FLOOR+13.5,32.5]){w.box(0,y,.9,width,.6,1.3,P.oak,22);w.box(0,y+.5,1.08,width,.13,.7,P.gold,41);}
  for(const x of[-width/2+1.2,width/2-1.2]){w.box(x,5,1.2,2.4,58,2.2,P.walnut,22);for(const dx of[-.62,.62])w.box(x+dx,5,2.33,.09,56,.05,P.gold,41);}
  // Cornice dentils carry all the way around the pavilion.
  w.box(0,34,.6,width,1.4,2.8,P.walnut,22);for(let x=-width/2+2;x<width/2;x+=2.1)w.box(x,32.8,1.7,.8,.7,1.25,P.oak,22);
  if(back){
   for(const x of[-52,52])queensWindow(w,x,8.3,1.0,25,30);
   queensFrame(w,0,22,1.05,61,15.35,P.deep);
   roomSign(w,QUEENS_PROJECT.plaque,0,22,1.68,60.6,15.0);
   queensPictureLight(w,0,31.2,1.2,17);
   queensCourtDrawing(w,0,-.5,1.1,31,23);
   for(const x of[-30.5,30.5])queensSconce(w,x,7,1.1);
  }else if(which==='left'){
   for(const [x,a,wood]of[[-37,-.12,true],[-5,.10,false],[27,-.14,true]]){
    queensFrame(w,x,9.4,1.2,20,30,'#b5b498');queensRacquet(w,x,10,1.93,a,wood);
    queensPictureLight(w,x,27,1.3,8);queensText(w,wood?'THE CLASSIC':'CENTRE COURT',x,-2.5,1.87,16,P.deep);
   }
  }else if(which==='right'){
   queensCourtDrawing(w,-29,13,1.15,28,27);
   queensFrame(w,17,13,1.15,35,28,'#aa9877');
   for(let x=2;x<33;x+=2.2)for(let y=1;y<26;y+=2.2)w.box(x,y,1.78,.11,.11,.05,'#6c684e',22);
   for(let i=0;i<7;i++){const x=5+i*3.9;w.beam([x,7+(i%3),2.0],[x+.4,21-(i%2)*3,2.0],i%2?.12:.20,i%2?'#d8c08c':'#6b7252',41,6);w.box(x,7+(i%3),2.1,.7,3.2,.55,P.walnut,22);}
   queensPictureLight(w,17,30,1.2,14);queensText(w,'THE MAKERS BENCH',17,30.6,1.78,31);
   queensWindow(w,49,10.5,1.1,17,27);
  }else{
   // Framed double doors line up with the native room's open entrance.
   w.box(0,FLOOR+19,1.0,29,38,.9,P.walnut,22);
   for(const side of[-1,1]){w.box(side*7,FLOOR+19,1.54,12.8,35.3,.3,P.deep,22);queensFrame(w,side*7,FLOOR+23.8,1.67,9.6,18.3,'#91a08a');w.cylinder(side*2,FLOOR+17,2.7,.25,.25,3.2,P.gold,41,10);}
   const key='house-'+Object.keys(HOUSE_ROOMS).indexOf('queens');roomFrame(w,key,0,21,1.75,42,10.3);
   for(const x of[-43,43]){queensFrame(w,x,9,1.0,28,32,P.cream);queensLoop(w,x,13,1.68,8,8,.09,P.green,64);queensText(w,x<0?'QUEENS':'THE FINAL',x,14.8,1.70,22,P.green);queensText(w,x<0?'NEW YORK':'UNDER LIGHTS',x,-1.4,1.70,22,P.green);queensPictureLight(w,x,28,1.2,12);}
  }
  w.pop();walls.push({which,mesh:w.mesh()});
 }
 return walls;
}

function queensDisplayTable(b){
 const P=QUEENS_PALETTE,top=-11.14;
 // The imported timber board rests on a native gallery table. Its underside
 // and these stretchers meet exactly; the source model's legs are omitted.
 b.box(0,top-.31,0,103.8,.6,87.5,P.walnut,22);
 for(const x of[-45,45])for(const z of[-37,37]){
  b.cylinder(x,FLOOR+.42,z,1.82,1.82,.8,P.gold,41,12);
  b.cylinder(x,FLOOR+5.9,z,1.15,1.40,10.2,P.walnut,22,12);
  for(const y of[FLOOR+1.2,FLOOR+8.8,FLOOR+10.4])b.cylinder(x,y,z,1.55,1.55,.43,P.oak,22,12);
  b.box(x,top-1.2,z,3.1,2.4,3.1,P.walnut,22);
 }
 for(const z of[-37,37]){b.box(0,top-2.2,z,92,3.2,2.2,P.walnut,22);b.box(0,top-3.8,z+.08,91,.22,2.35,P.gold,41);b.box(0,FLOOR+3.5,z,91,1.2,1.5,P.walnut,22);}
 for(const x of[-45,45])b.box(x,FLOOR+3.5,0,1.5,1.2,74,P.walnut,22);
 // A lettered maker's drawer on each side, underneath the layout.
 for(const x of[-28,28]){b.box(x,top-2.1,42.2,24,3.5,.7,P.oak,22);b.box(x,top-2.1,42.61,21.8,2.55,.15,P.walnut,22);b.beam([x-2,top-2.1,43.2],[x+2,top-2.1,43.2],.12,P.gold,41,8);}
 // A low relief plan stays visible in the house map and while loading. The
 // original board covers it once the full miniature is ready.
 b.box(0,top+.05,0,101,.08,85,'#53674e',23);
 b.push(0,top+.10,0,-PI/2);queensText(b,'A LITTLE QUEENS',0,-30,.04,41,'#d7c594');b.pop();
 for(const [rx,rz]of[[43,33],[40,30]])for(let i=0;i<96;i++){const a=i*TAU/96,c=(i+1)*TAU/96;b.beam([Math.cos(a)*rx,top+.14,Math.sin(a)*rz],[Math.cos(c)*rx,top+.14,Math.sin(c)*rz],.09,'#b0a37d',41,4);}
 // A small stadium silhouette earns the room's identity even on the live map.
 b.box(-12,top+.22,-8,19,.25,25,'#b7b49a',24);b.box(-12,top+.39,-8,7,.10,14,'#4b8589',23);
 for(let r=0;r<3;r++)for(let i=0;i<48;i++){
  const a=i*TAU/48,c=(i+1)*TAU/48,rx=6.5+r*1.7,rz=10+r*1.5,y=top+.45+r*.6;
  b.beam([-12+Math.cos(a)*rx,y,-8+Math.sin(a)*rz],[-12+Math.cos(c)*rx,y,-8+Math.sin(c)*rz],.32,'#72848b',24,4);
 }
}
function queensTrophy(b,x,y,z,s=1){
 b.push(x,y,z,0,0,0,s);const P=QUEENS_PALETTE;
 b.box(0,.28,0,2.8,.55,2.4,P.deep,22);b.cylinder(0,.67,0,1.08,1.25,.24,P.gold,41,16);
 b.cylinder(0,1.34,0,.22,.38,1.15,P.gold,41,12);b.cylinder(0,2.72,0,1.20,.36,1.65,P.gold,41,20);
 b.cylinder(0,3.58,0,1.25,1.25,.10,'#d8bc77',41,20);b.cylinder(0,3.64,0,1.03,1.03,.015,'#6a5732',22,20);
 for(const side of[-1,1])queensLoop(b,side*1.06,2.88,0,.65,.74,.08,P.gold,28);b.pop();
}
function queensCabinet(b){
 const P=QUEENS_PALETTE;b.push(-69,FLOOR,-10,0,PI/2);
 b.box(0,8,0,40,16,10,P.walnut,22);b.box(0,16.4,0,42,.8,11,P.oak,22);
 for(const x of[-13,0,13])for(const y of[4.5,11]){b.box(x,y,5.12,11.8,5.5,.3,P.green,22);b.box(x,y,5.33,10.5,4.3,.08,'#3a5140',22);b.beam([x-1.3,y,5.7],[x+1.3,y,5.7],.10,P.gold,41,8);}
 for(const x of[-18,18])b.box(x,25,-4.4,1,17,1,P.oak,22);
 b.box(0,25,-4.7,39,17,.4,P.deep,22);b.box(0,34,0,42,1,11,P.oak,22);
 b.box(0,22.9,0,39,.38,10,P.gold,41);b.box(0,28.5,0,39,.38,10,P.gold,41);
 for(const x of[-13,0,13])queensTrophy(b,x,16.85,.2,x===0?1.45:1.05);
 for(let i=0;i<9;i++){const x=-15+i*3.5,h=2.6+(i%3)*.8;b.box(x,23.2+h/2,-1,2.7,h,4.4,['#a17b57','#617f6c','#c3af77'][i%3],23);b.box(x,23.5,1.25,2.5,.12,.02,P.gold,41);}
 for(const [x,color]of[[-10,'#e1d48e'],[0,'#d9c780'],[10,'#a5b875']]){b.box(x,29,.0,4.1,.6,4.1,P.walnut,22);b.sphere(x,31,0,1.5,1.5,1.5,color,23,16,10);queensLoop(b,x,31,1.35,.8,1.0,.024,P.cream,24);}
 b.box(0,25.4,5.09,39,16.2,.035,'#aac1ac',76);for(const x of[-19.5,0,19.5])b.box(x,25.4,5.23,.33,17,.33,P.gold,41);
 b.pop();
}
function queensBench(b){
 const P=QUEENS_PALETTE;b.push(68,FLOOR,9,0,-PI/2);
 for(const x of[-21,21])for(const z of[-3,3])b.box(x,7.2,z,1.2,14.4,1.2,P.walnut,22);
 b.box(0,14.8,0,49,1.4,11,P.oak,22);b.box(0,12.3,1,46,3,8,P.walnut,22);
 for(const x of[-16,0,16]){b.box(x,12.2,5.10,13.6,2.3,.25,P.green,22);b.box(x,12.2,5.36,1.5,.3,.2,P.gold,41);}
 b.box(-7,15.56,0,22,.08,8,'#315a47',23);
 for(let x=-17;x<4;x+=1)b.box(x,15.61,0,.025,.012,7.3,'#9eae7b',23);
 for(let z=-3;z<4;z++)b.box(-7,15.61,z,21,.012,.025,'#9eae7b',23);
 // Tiny card stadium parts, a steel rule, a craft knife and a loose racquet.
 b.box(-8,15.84,-.5,6,.35,4,P.cream,23);b.box(-7,16.13,-.5,3.8,.25,2.6,P.green,23);
 b.box(-12,15.7,2.3,12,.13,.53,'#b3b9a4',41);for(let x=-17;x<-7;x+=.55)b.box(x,15.78,2.15,.025,.014,.2,P.deep,41);
 b.push(-3,15.8,2,0,.3);b.box(0,0,0,5,.21,.36,P.gold,41);b.tri([2.5,.1,-.18],[4,.1,0],[2.5,.1,.18],'#c3c9b4',41);b.pop();
 for(let i=0;i<7;i++){const x=8+i*1.7,z=i%2?1:-2;b.cylinder(x,16.15,z,.6,.64,1.1,['#a8ad81','#567d66','#af8655','#b78469'][i%4],23,12);b.cylinder(x,16.75,z,.65,.65,.18,P.cream,23,12);}
 // Rolled plans, retaining a small visible spiral at the end.
 for(let i=0;i<3;i++){b.cylinder(12+i*2,15.9,-.5,.40,.40,7,P.cream,23,12,PI/2);queensLoop(b,12+i*2,15.9,3.02,.23,.23,.02,P.walnut,20);}
 b.cylinder(20,16.7,-2.8,.72,.56,2.2,P.green,23,12);
 for(let i=0;i<6;i++){const x=19.65+i*.13;b.beam([x,16.4,-2.8],[x+(i-2)*.20,20.1+i%3*.35,-2.8],.065,P.oak,22,6);b.box(x+(i-2)*.20,20.45+i%3*.35,-2.8,.22,.68,.18,P.cream,23);}
 // A green banker lamp with a visible warm underside.
 b.cylinder(-21,15.8,-1.3,1.6,1.7,.3,P.gold,41,20);b.cylinder(-21,19.1,-1.3,.16,.16,6.5,P.gold,41,12);
 b.beam([-21,22.1,-1.3],[-19,22.1,-1.3],.15,P.gold,41,10);b.cylinder(-18.8,21.8,-1.3,1.05,1.05,4.6,P.green,23,18,0,PI/2);b.box(-18.8,21.1,-1.3,4.1,.12,1.3,'#ffe1a6',6);
 // Stool in the aisle, tucked under the edge of the bench.
 b.cylinder(-2,8.3,10,3.8,3.8,1.1,P.walnut,22,20);b.cylinder(-2,8.92,10,3.65,3.65,.20,'#897b52',23,20);
 for(const [dx,dz]of[[-2,-2],[2,-2],[-2,2],[2,2]])b.beam([-2+dx,7.9,10+dz],[-2+dx*1.3,.3,10+dz*1.3],.25,P.walnut,22,8);
 b.pop();
}
function queensAisleLamp(b,x,z){
 const P=QUEENS_PALETTE;b.cylinder(x,FLOOR+.3,z,2.2,2.45,.6,P.deep,41,20);
 b.cylinder(x,FLOOR+20,z,.13,.18,39,P.gold,41,10);
 b.cylinder(x,FLOOR+37.7,z,2.1,4.1,5.4,P.green,23,24);
 b.cylinder(x,FLOOR+34.97,z,4.05,4.05,.1,P.gold,41,24);b.cylinder(x,FLOOR+34.89,z,3.5,3.5,.05,'#ffe5b1',6,24);
 b.sphere(x,FLOOR+40.8,z,.45,.6,.45,P.gold,41,10,7);
}
function queensFern(b,x,z){
 const P=QUEENS_PALETTE;b.cylinder(x,FLOOR+2.0,z,2.9,2.1,4,P.clay,23,18);b.cylinder(x,FLOOR+4.1,z,3.1,3.1,.4,'#ba8966',23,18);
 b.cylinder(x,FLOOR+4.32,z,2.7,2.7,.05,P.dark,23,18);
 for(let i=0;i<13;i++){const a=i*2.399,h=4+(i%4)*.65,end=[x+Math.cos(a)*4.1,FLOOR+5.4+h*.5,z+Math.sin(a)*4.1];b.beam([x,FLOOR+4.3,z],end,.038,P.sage,0,5);for(let j=1;j<6;j++){
  const u=j/6,xx=x+(end[0]-x)*u,zz=z+(end[2]-z)*u,yy=FLOOR+4.3+(end[1]-FLOOR-4.3)*u+Math.sin(u*PI)*2,r=(1-u)*1.2;
  for(const side of[-1,1])b.tri([xx,yy,zz],[xx+Math.cos(a+side*1.0)*r,yy+.35,zz+Math.sin(a+side*1.0)*r],[xx+Math.cos(a)*.55,yy+.22,zz+Math.sin(a)*.55],i%2?'#7b9563':'#567d55',23);
 }}
}
function buildQueensRoom(scene,b){
 const P=QUEENS_PALETTE;queensDisplayTable(b);queensCabinet(b);queensBench(b);
 for(const [x,z]of[[-63,-40],[63,-41],[-63,37],[61,38]])queensAisleLamp(b,x,z);
 for(const [x,z]of[[-68,-53],[68,-53],[-68,51]])queensFern(b,x,z);
 // Leather club bench, piped cushions and a little programme left behind.
 b.box(0,FLOOR+5.0,54,39,2.0,7.5,P.walnut,22);
 for(const x of[-16,16])for(const z of[51.4,56.6])b.box(x,FLOOR+2.2,z,1.3,4.4,1.3,P.walnut,22);
 for(const x of[-13,0,13]){b.box(x,FLOOR+6.6,54,12.6,1.6,7.2,'#8b7f55',23);for(const z of[50.5,57.5])b.box(x,FLOOR+6.7,z,12.6,.09,.06,P.cream,23);}
 for(const x of[-19.5,19.5]){b.box(x,FLOOR+8.2,54,1.2,5,8.1,P.walnut,22);b.box(x,FLOOR+10.8,54,1.5,.45,8.3,P.oak,22);}
 b.push(9,FLOOR+7.48,54,-PI/2,0,.15);b.box(0,0,0,5,6.4,.10,P.cream,23);queensText(b,'THE FINAL',0,.7,.08,4.4,P.green);queensLoop(b,0,-1.0,.08,1.1,1.1,.03,P.green,28);b.pop();
 // Small drinks table with a glazed cup, spoon and folded scorecard.
 b.cylinder(30,FLOOR+6.8,54,4.1,4.1,.65,P.oak,22,24);b.cylinder(30,FLOOR+3.4,54,.38,.62,6.6,P.gold,41,12);b.cylinder(30,FLOOR+.25,54,2.8,2.8,.4,P.deep,41,18);
 b.cylinder(29,FLOOR+7.25,54,1.15,1.15,.18,P.cream,23,18);b.cylinder(29,FLOOR+7.97,54,.68,.49,1.3,P.cream,23,18);b.cylinder(29,FLOOR+8.64,54,.57,.57,.02,'#584632',23,18);queensLoop(b,29.72,FLOOR+8.0,54,.36,.45,.08,P.cream,24);
 b.box(32,FLOOR+7.18,54,1.8,.08,2.8,'#d2c69f',23);
 scene.routes=[];scene.trains=[];scene.height=()=>FLOOR;
 scene.spots=[
  {name:'The whole little world',detail:'Arthur Ashe, the Queens streets and two trains taking the long way home.',target:QUEENS_PROJECT.focus,distance:132,phoneDistance:260,pitch:.65,yaw:.28},
  {name:'Arthur Ashe Stadium',detail:'Thousands of individually painted seats. Lift the roof from At the stadium to see the final point.',target:queensWorld([-25,7,-16]),distance:49,phoneDistance:75,pitch:.82,yaw:.18},
  {name:'Mets–Willets Point',detail:'Wait for the silver 7 at the green-roofed station.',target:queensWorld([-23,7,65]),distance:25,phoneDistance:39,pitch:.40,yaw:.70},
  {name:'The racquet collection',detail:'Wire-strung racquets, leather grips and miniature silverware.',target:[-71,7,-7],distance:46,phoneDistance:65,pitch:.13,yaw:-1.25},
  {name:'The maker’s bench',detail:'Cutting mat, brass tools, paint pots, paper stadium parts and a lamp still on.',target:[68,FLOOR+15,9],distance:37,phoneDistance:57,pitch:.46,yaw:1.4},
  {name:'The maker’s plaque',detail:embeddedCreditLine(QUEENS_PROJECT)+'.',target:[0,22,-62.2],distance:47,phoneDistance:90,pitch:.01,yaw:0}
 ];
 return scene;
}
registerHouseRoom('queens',{
 name:QUEENS_PROJECT.roomName,layout:QUEENS_PROJECT.title,tag:'THE FINAL · THE PARK · THE 7 TRAIN',
 description:'A little Queens by nickfromlater. Arthur Ashe under the lights, two working railways and a whole borough in miniature, inside a walnut and green tennis pavilion.',
 color:'#839778',ambient:'town',railway:false,conductor:false,
 target:[0,-1.5,0],distance:157,phoneDistance:285,pitch:.58,yaw:.32,
 credits:QUEENS_PROJECT.credits,map:{plot:'east-5',scale:.40,footprint:[158,130],focus:[0,-1.5,0]},
 lights:[[-63,11,-40],[63,11,-41],[-63,11,37],[61,11,38],[0,30,-58],[-31,7,-59],[31,7,-59],[67,-2,28]],
 build:buildQueensRoom,shell:queensShell
});
