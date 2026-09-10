'use strict';

// HUDSON TERMINAL / An authored Northeast city, not a map of a real station.
// Original city, gallery architecture and train direction: nickfromlater.
// All detail is baked once into the native room mesh. No frame-loop geometry.
const HUDSON={ground:.38,rail:2.68,water:-.14,width:118,depth:82};
const HUDSON_INK='#28424c',HUDSON_STONE='#c8b899',HUDSON_BRASS='#bba477';
const HUDSON_GLYPHS={
 A:['01110','10001','11111','10001','10001'],B:['11110','10001','11110','10001','11110'],C:['01111','10000','10000','10000','01111'],D:['11110','10001','10001','10001','11110'],E:['11111','10000','11110','10000','11111'],F:['11111','10000','11110','10000','10000'],G:['01111','10000','10111','10001','01110'],H:['10001','10001','11111','10001','10001'],I:['11111','00100','00100','00100','11111'],J:['00111','00010','00010','10010','01100'],K:['10001','10010','11100','10010','10001'],L:['10000','10000','10000','10000','11111'],M:['10001','11011','10101','10001','10001'],N:['10001','11001','10101','10011','10001'],O:['01110','10001','10001','10001','01110'],P:['11110','10001','11110','10000','10000'],Q:['01110','10001','10101','10010','01101'],R:['11110','10001','11110','10010','10001'],S:['01111','10000','01110','00001','11110'],T:['11111','00100','00100','00100','00100'],U:['10001','10001','10001','10001','01110'],V:['10001','10001','10001','01010','00100'],W:['10001','10001','10101','11011','10001'],X:['10001','01010','00100','01010','10001'],Y:['10001','01010','00100','00100','00100'],Z:['11111','00010','00100','01000','11111'],'0':['01110','10011','10101','11001','01110'],'1':['00100','01100','00100','00100','01110'],'2':['11110','00001','01110','10000','11111'],'3':['11110','00001','01110','00001','11110'],'4':['10010','10010','11111','00010','00010'],'5':['11111','10000','11110','00001','11110'],'6':['01111','10000','11110','10001','01110'],'7':['11111','00010','00100','01000','01000'],'8':['01110','10001','01110','10001','01110'],'9':['01110','10001','01111','00001','11110']
};
function hudsonText(b,text,x,y,z,w,color='#ead5a7',mat=0){
 const size=w/Math.max(1,text.length*6-1),left=x-w/2;
 [...text.toUpperCase()].forEach((ch,i)=>{const glyph=HUDSON_GLYPHS[ch];if(!glyph)return;glyph.forEach((row,r)=>{for(let c=0;c<5;c++)if(row[c]==='1'){
  const xx=left+(i*6+c)*size,yy=y+(2-r)*size;b.quad([xx,yy,z],[xx+size*.84,yy,z],[xx+size*.84,yy+size*.85,z],[xx,yy+size*.85,z],color,mat,[0,0,1]);
 }});});
}
function hudsonSign(b,text,x,y,z,w,h=.62,color=HUDSON_INK){
 b.box(x,y,z,w+.20,h,.085,color,40);b.box(x,y+h/2,z+.047,w+.15,.025,.02,HUDSON_BRASS,41);b.box(x,y-h/2,z+.047,w+.15,.025,.02,HUDSON_BRASS,41);
 hudsonText(b,text,x,y-.03,z+.052,Math.min(w,h*.78/5*Math.max(1,text.length*6-1)),'#ead9b2');
}
function hudsonArch(b,x,y,z,r,rise,width,color,mat=4,segments=18){
 for(let i=0;i<segments;i++){
  const a=i*PI/segments,q=(i+1)*PI/segments;
  const p=(t,outer)=>[x+Math.cos(t)*(r+(outer?width:0)),y+Math.sin(t)*(rise+(outer?width:0)),z];
  b.quad(p(a,false),p(q,false),p(q,true),p(a,true),color,mat);
 }
}
function hudsonWindow(b,x,y,z,w,h,lit=false,trim=true){
 b.quad([x-w/2,y-h/2,z],[x+w/2,y-h/2,z],[x+w/2,y+h/2,z],[x-w/2,y+h/2,z],lit?'#c4bd97':'#426170',lit?6:43);
 if(trim){b.box(x,y-h/2-.045,z+.025,w+.13,.09,.16,HUDSON_STONE,24);b.box(x,y+h/2+.035,z+.01,w+.10,.07,.11,HUDSON_STONE,24);b.box(x,y,z+.035,.027,h,.035,'#697676',41);}
}
function hudsonFireEscape(b,w,h,d){
 const ink='#37494c';
 for(let y=2.2;y<h-.7;y+=1.65){
  b.box(0,y,d/2+.58,w*.61,.055,1.05,ink,41);
  for(const s of[-1,1])b.beam([s*w*.29,y,d/2+1.07],[s*w*.29,y+.62,d/2+1.07],.023,ink,41,4);
  b.beam([-w*.29,y+.62,d/2+1.07],[w*.29,y+.62,d/2+1.07],.022,ink,41,4);
  for(let i=0;i<6;i++)b.box(-w*.27+i*w*.108,y+.29,d/2+1.07,.024,.58,.024,ink,41);
  if(y+1.7<h){
   for(let i=0;i<9;i++)b.box(-w*.22+i*w*.05,y+.12+i*.18,d/2+.61,.36,.035,.48,ink,41);
   for(const z of[d/2+.34,d/2+.87])b.beam([-w*.24,y+.22,z],[w*.25,y+1.90,z],.025,ink,41,4);
  }
 }
}
function hudsonWaterTank(b,x,y,z,s=1){
 b.push(x,y,z,0,0,0,s);
 for(const xx of[-.51,.51])for(const zz of[-.51,.51]){b.box(xx,.55,zz,.08,1.1,.08,'#586166',41);b.beam([xx,0,-.51],[xx,1.05,.51],.025,'#586166',41,4);}
 b.cylinder(0,1.65,0,.78,.78,1.42,'#90775d',22,18);
 for(const yy of[1.03,1.37,1.86,2.25])b.cylinder(0,yy,0,.797,.797,.055,'#46545b',41,18);
 b.cylinder(0,2.45,0,.85,0,.41,'#596b70',41,18);
 for(let k=0;k<9;k++)b.box(.91,.16+k*.26,0,.32,.022,.024,'#8e9897',41);
 for(const zz of[-.12,.12])b.beam([.91,0,zz],[.91,2.38,zz],.016,'#8e9897',41,4);b.pop();
}
function hudsonBuilding(b,x,z,w,d,h,color,options={}){
 b.push(x,HUDSON.ground,z,0,options.angle||0);
 b.box(0,.14,0,w+.38,.28,d+.38,'#aeaa98',24);
 b.box(0,h/2+.28,0,w,h,d,color,options.glass?40:4);
 for(const y of[.58,h+.20,h+.42])b.box(0,y,0,w+.27,.14,d+.27,HUDSON_STONE,24);
 const floors=Math.max(2,Math.floor((h-.65)/1.3)),ny=(h-.85)/floors;
 for(let face=0;face<4;face++){
  const width=face%2?d:w,depth=face%2?w:d,cols=Math.max(2,Math.floor(width/1.16));
  b.push(0,0,0,0,face*PI/2);
  if(options.glass){
   b.box(0,h*.54,depth/2+.015,width-.3,h-.9,.026,'#375d70',43);
   for(let k=1;k<cols;k++)b.box(-width/2+k*width/cols,h*.54,depth/2+.045,.038,h-.90,.038,'#a4b4b7',41);
  }
  for(let f=0;f<floors;f++)for(let c=0;c<cols;c++){
   const xx=-width/2+(c+.5)*width/cols,yy=1.08+f*ny;
   hudsonWindow(b,xx,yy,depth/2+.058,width/cols*.58,ny*.61,hash(c+f*31,x+z+face*77)>.74,!options.glass);
  }
  if(options.glass)for(let f=0;f<floors;f++)b.box(0,.59+f*ny,depth/2+.07,width-.24,.105,.06,'#8d9d9c',41);
  b.pop();
 }
 b.box(0,h+.40,0,w-.22,.07,d-.22,'#4e5c5d',9);
 for(const s of[-1,1]){b.box(s*(w/2-.07),h+.70,0,.14,.49,d,HUDSON_STONE,4);b.box(0,h+.70,s*(d/2-.07),w,.49,.14,HUDSON_STONE,4);}
 b.box(-w*.18,h+.81,-d*.20,w*.34,.74,d*.27,'#879292',41);
 for(let i=0;i<5;i++)b.box(-w*.18,h+1.20,-d*.30+i*d*.042,w*.29,.025,.028,'#4e636c',42);
 b.box(w*.27,h+.8,-d*.24,.37,.88,.40,'#b48766',4);
 if(options.tank)hudsonWaterTank(b,w*.19,h+.48,d*.18,Math.min(w,d)*.14);
 if(options.escape)hudsonFireEscape(b,w,h,d);
 if(options.shop){
  for(const xx of[-w*.29,w*.29])hudsonWindow(b,xx,.99,d/2+.067,w*.35,1.13,true,false);
  b.box(0,.84,d/2+.09,.66,1.34,.06,HUDSON_INK,40);
  hudsonSign(b,options.shop,0,1.76,d/2+.15,w*.83,.44,options.awning||HUDSON_INK);
  b.box(0,1.62,d/2+.56,w+.13,.075,.99,options.awning||'#5e7a6c',23);
  for(let i=0;i<Math.floor(w/.29);i++)b.box(-w/2+i*.29,1.628,d/2+.58,.12,.012,.92,'#d6caa7',23);
  b.box(0,1.46,d/2+1.01,w+.11,.29,.045,options.awning||'#5e7a6c',23);
 }
 b.pop();
}
function hudsonDecoTower(b,x,z){
 b.push(x,HUDSON.ground,z);
 const tiers=[[10,8.3,0,5.7],[8.8,7.4,5.7,9.0],[6.9,5.9,14.7,4.2],[4.7,4.3,18.9,3.0],[2.7,2.5,21.9,2.4]];
 for(const [w,d,y,h]of tiers){
  b.box(0,y+h/2,0,w,h,d,'#b8b6a1',4);b.box(0,y+h,0,w+.25,.23,d+.25,'#d1c4a4',24);
  for(let face=0;face<4;face++){
   b.push(0,0,0,0,face*PI/2);const ww=face%2?d:w,dd=face%2?w:d,cols=Math.max(2,Math.floor(ww/1.05));
   for(let c=0;c<cols;c++){
    const xx=-ww/2+(c+.5)*ww/cols;b.box(xx,y+h/2,dd/2+.08,.16,h-.2,.16,'#d1c6a9',24);
    for(let yy=y+.66;yy<y+h-.2;yy+=1.06)hudsonWindow(b,xx+ww/cols*.30,yy,dd/2+.087,ww/cols*.46,.67,hash(c,yy+face*8)>.71,false);
   }b.pop();
  }
 }
 b.cylinder(0,25.12,0,1.55,.62,1.65,'#62877e',41,8);b.cylinder(0,26.55,0,.62,.04,1.30,'#9eae9b',41,8);
 b.beam([0,27,0],[0,29.7,0],.044,HUDSON_BRASS,41,8);b.sphere(0,29.7,0,.10,.10,.10,'#e7bd85',10,8,5);
 for(const s of[-1,1]){b.box(s*1.9,1.25,4.22,.30,2.5,.30,HUDSON_BRASS,41);}
 hudsonSign(b,'HUDSON EXCHANGE',0,3.5,4.22,6.8,.74);
 b.pop();
}
function hudsonRoute(name,inset=0){
 const x=51-inset,z=27-inset,r=12-inset,k=.5522847498307936,curves=[],p=(xx,zz)=>[xx,HUDSON.rail,zz];
 const line=(a,q)=>curves.push([a,lerpV(a,q,1/3),lerpV(a,q,2/3),q]);
 line(p(-x+r,z),p(x-r,z));
 curves.push([p(x-r,z),p(x-r+k*r,z),p(x,z-r+k*r),p(x,z-r)]);
 line(p(x,z-r),p(x,-z+r));curves.push([p(x,-z+r),p(x,-z+r-k*r),p(x-r+k*r,-z),p(x-r,-z)]);
 line(p(x-r,-z),p(-x+r,-z));curves.push([p(-x+r,-z),p(-x+r-k*r,-z),p(-x,-z+r-k*r),p(-x,-z+r)]);
 line(p(-x,-z+r),p(-x,z-r));curves.push([p(-x,z-r),p(-x,z-r+k*r),p(-x+r-k*r,z),p(-x+r,z)]);
 return new Edge(name,curves);
}
function hudsonRails(b,edge){
 ribbon(b,edge,1.8,0,-.23,'#67777a',9,0,edge.length,.55);
 for(let d=0;d<edge.length;d+=.39){const a=edge.at(d);b.matrix(basis(a.p,a.f));b.box(0,-.066,0,1.11,.072,.125,'#a7a898',24);b.pop();}
 for(const s of[-1,1]){ribbon(b,edge,.042,s*.32,.012,'#5e7178',11,0,edge.length,.34);ribbon(b,edge,.066,s*.32,.059,'#c8d0c6',1,0,edge.length,.34);}
}
function hudsonViaduct(b,outer,inner){
 // Piers actually carry the decks; a clear street underpass remains between them.
 for(const edge of[outer,inner]){
  ribbon(b,edge,2.03,0,-.41,'#78888a',24,0,edge.length,.65);
  for(const s of[-1,1])ribbon(b,edge,.13,s*.99,-.25,'#9ea69a',41,0,edge.length,.65);
  for(let d=2;d<edge.length;d+=5.4){const a=edge.at(d);b.matrix(basis(a.p,a.f));
   b.box(0,-1.35,0,.72,1.84,.62,HUDSON_STONE,4);b.box(0,-.56,0,2.0,.27,.77,'#b6bbaa',24);b.box(0,-2.17,0,1.2,.20,1.12,'#8c9690',24);b.pop();
  }
 }
 // Catenary portals span both running lines without crossing vehicle envelopes.
 for(let d=2;d<outer.length;d+=9.4){
  const a=outer.at(d);b.matrix(basis(a.p,a.f));
  for(const x of[-1.35,3.65]){b.box(x,1.28,0,.065,4.74,.078,HUDSON_INK,41);b.box(x,-1.08,0,.29,.18,.28,'#9ba597',24);}
  b.box(1.15,3.59,0,5.23,.070,.10,'#51656c',41);
  for(const x of[0,2.4]){b.beam([x,3.57,0],[x,2.54,0],.021,'#a6987f',41,5);b.cylinder(x,3.09,0,.065,.065,.19,'#b3a48f',24,6);}
  b.pop();
 }
 for(const edge of[outer,inner]){
  for(let d=0;d<edge.length;d+=2){const a=edge.at(d),q=edge.at(Math.min(edge.length,d+2));
   b.beam(add(a.p,[0,2.52,0]),add(q.p,[0,2.52,0]),.009,'#74898f',41,4);
   b.beam(add(a.p,[0,3.11,0]),add(q.p,[0,3.11,0]),.011,'#667b82',41,4);
   if(Math.floor(d)%4===0)b.beam(add(a.p,[0,2.52,0]),add(a.p,[0,3.11,0]),.008,'#889998',41,4);
  }
 }
}
function hudsonStreet(b,x,z,w,d){
 b.box(x,HUDSON.ground-.045,z,w,.08,d,'#4b5b61',9);
 const horizontal=w>d,length=horizontal?w:d;
 for(let p=-length/2+1;p<length/2;p+=1.6)b.box(x+(horizontal?p:0),HUDSON.ground+.003,z+(horizontal?0:p),horizontal?.69:.055,.014,horizontal?.055:.69,'#d1b573',24);
 for(const s of[-1,1]){
  b.box(x+(horizontal?0:s*(w/2+.38)),HUDSON.ground+.07,z+(horizontal?s*(d/2+.38):0),horizontal?w:.72,.15,horizontal?.72:d,'#b7b9aa',24);
  b.box(x+(horizontal?0:s*(w/2+.015)),HUDSON.ground+.15,z+(horizontal?s*(d/2+.015):0),horizontal?w:.085,.05,horizontal?.085:d,'#d8cdb5',24);
 }
}
function hudsonCrosswalk(b,x,z,angle=0){
 b.push(x,HUDSON.ground+.012,z,0,angle);for(let i=0;i<7;i++)b.box(-1.35+i*.45,0,0,.25,.012,1.06,'#d9d3b7',24);b.pop();
}
function hudsonCar(b,x,z,angle=0,taxi=false,color='#715357'){
 b.push(x,HUDSON.ground+.04,z,0,angle);const c=taxi?'#dca843':color;
 b.box(0,.28,0,.66,.28,1.35,c,40);b.box(0,.49,-.08,.58,.24,.77,'#315163',43);b.box(0,.64,-.09,.60,.07,.67,c,40);
 b.box(0,.27,.692,.48,.05,.015,'#dfd7b8',41);b.box(0,.28,-.692,.52,.045,.015,'#ad4b43',40);
 for(const xx of[-.345,.345])for(const zz of[-.44,.44])b.cylinder(xx,.17,zz,.125,.125,.07,'#263943',42,10,0,PI/2);
 if(taxi)b.box(0,.735,-.05,.20,.13,.28,'#ead8a6',6);b.pop();
}
function hudsonLamp(b,x,z,h=3.3){
 b.cylinder(x,HUDSON.ground+.13,z,.11,.08,.25,HUDSON_INK,41,8);b.beam([x,HUDSON.ground,z],[x,h,z],.035,HUDSON_INK,41,6);
 b.beam([x,h,z],[x+.46,h+.10,z],.031,HUDSON_INK,41,6);b.box(x+.46,h+.08,z,.38,.08,.20,'#455b62',41);b.box(x+.46,h+.031,z,.31,.021,.15,'#f0d6a3',6);
}
function hudsonClock(b,x,y,z,r){
 b.cylinder(x,y,z,r,r,.12,'#bca575',41,28,PI/2);
 b.cylinder(x,y,z+.067,r*.88,r*.88,.017,'#e4d7b5',24,28,PI/2);
 for(let i=0;i<12;i++){const a=i*PI/6;b.beam([x+Math.sin(a)*r*.72,y+Math.cos(a)*r*.72,z+.082],[x+Math.sin(a)*r*.81,y+Math.cos(a)*r*.81,z+.082],.014,HUDSON_INK,41,4);}
 b.beam([x,y,z+.10],[x-r*.47,y+r*.24,z+.10],.025,HUDSON_INK,41,5);b.beam([x,y,z+.108],[x+r*.17,y+r*.68,z+.108],.018,HUDSON_INK,41,5);
}
function hudsonTerminal(scene,b){
 const y=HUDSON.rail+.40;
 // A narrow island and a generous landward platform. No platform intersects rails.
 b.box(-16,y-.19,25.80,40,.38,.90,'#c0b69b',24);
 b.box(-20,y-.19,21.00,37,.38,3.8,'#b6b6a3',24);
 for(const z of[25.40,26.20,22.84])b.box(-17,y+.012,z,37,.025,.10,'#dcb251',24);
 for(let x=-33;x<2;x+=.55){b.box(x,y+.031,25.46,.23,.013,.042,'#9e8245',24);b.box(x,y+.031,26.14,.23,.013,.042,'#9e8245',24);}
 for(const x of[-32,-23,-14,-5]){
  b.box(x,y+1.72,21.8,.12,3.44,.13,HUDSON_INK,41);b.box(x,y+1.75,28.65,.12,3.5,.13,HUDSON_INK,41);
  // Vault ribs and an open clerestory. Partial panes leave the train legible.
  for(let j=0;j<16;j++){
   const a=j*PI/16,q=(j+1)*PI/16,p=t=>[x,y+3.4+Math.sin(t)*1.42,25.23+Math.cos(t)*3.42];b.beam(p(a),p(q),.045,'#6b8585',41,5);
  }
  b.beam([x,y+3.4,21.8],[x,y+3.4,28.65],.042,HUDSON_INK,41,5);
  hudsonSign(b,'HUDSON',x,y+2.2,22.0,1.90,.47);
 }
 for(const z of[21.83,22.63,27.83,28.63])b.beam([-34,y+3.46,z],[1,y+3.46,z],.045,'#81978d',41,5);
 // Thin weathered-copper side strips imply the train shed without an opaque lid.
 for(const s of[-1,1])b.box(-16.5,y+3.44,25.23+s*3.15,35.8,.06,.58,'#698d81',40);
 for(const x of[-29,-20,-11,-2]){bench(b,x,y,20.43);scenePerson(scene,b,x,y,20.44,'sit',0,.90);scenePerson(scene,b,x+1.1,y,22.15,'bag',.9,.84);}
 b.push(-40,y,14);
 b.box(0,2.23,0,8.4,4.46,12.2,'#c0aa86',4);b.box(0,4.58,0,9,.30,12.8,'#d8c5a0',24);
 for(const x of[-3.44,0,3.44]){
  b.box(x,2.42,6.13,.29,4.4,.33,HUDSON_STONE,24);hudsonWindow(b,x===0?1.63:x+1.6,2.66,6.18,2.36,2.55,true,false);
 }
 hudsonSign(b,'HUDSON TERMINAL',0,4.04,6.37,7.18,.58);
 for(const x of[-3.3,0,3.3]){hudsonArch(b,x,2.3,-6.17,1.24,1.62,.20,'#ead4aa');hudsonWindow(b,x,1.82,-6.185,1.75,2.76,true,false);}
 b.box(0,6.05,-1,4.45,3.10,4.70,'#b29f7b',4);b.box(0,7.64,-1,4.88,.23,5.0,'#dbcaab',24);
 for(let face=0;face<4;face++){b.push(0,0,-1,0,face*PI/2);hudsonClock(b,0,6.35,2.37,.89);b.pop();}
 b.cylinder(0,8.72,-1,3.35,.60,1.91,'#6d8c80',41,4);b.cylinder(0,9.93,-1,.43,.055,.68,'#b8ab81',41,8);b.beam([0,10.2,-1],[0,11.2,-1],.035,HUDSON_BRASS,41,6);
 b.pop();
 // Street stairs arrive at the station elevation, with parallel brass handrails.
 for(let i=0;i<13;i++)b.box(-34.1,HUDSON.ground+(i+1)*.21/2,14.8+i*.35,2.3,(i+1)*.21,.36,'#c0b293',24);
 for(const x of[-35.14,-33.06])b.beam([x,1.13,14.7],[x,y+.77,19.0],.027,HUDSON_BRASS,41,6);
 // Departures board, information counter and a kiosk, all original lettering.
 b.box(-26,y+1.49,20.07,4.4,1.4,.10,HUDSON_INK,40);
 for(const [i,text]of['DEPARTURES','ACELA  BOSTON','REGIONAL  NY'].entries())hudsonText(b,text,-26,y+1.85-i*.39,20.133,3.88,i?'#c6c5ae':'#e9c884',i?0:6);
 b.box(-6.3,y+.56,20.3,1.50,1.12,1.12,'#3d6670',40);hudsonSign(b,'NEWS',-6.3,y+1.24,20.88,1.3,.30);
 for(const x of[-7.2,-6.6,-6.0])b.box(x,y+.77,21.04,.26,.45,.045,'#d4c4a1',24);
}
function hudsonPark(scene,b){
 const x=4,z=9,y=HUDSON.ground;
 b.box(x,y+.05,z,12,.1,10,'#b9b394',24);b.box(x,y+.14,z,10.9,.16,8.9,'#71896d',3);
 b.box(x,y+.24,z,1.3,.08,9.1,'#c8ba98',9);b.box(x,y+.24,z,11,.08,1.3,'#c8ba98',9);
 b.cylinder(x,y+.4,z,1.51,1.51,.38,HUDSON_STONE,24,28);b.cylinder(x,y+.61,z,1.28,1.28,.04,'#8eb3a9',7,28);
 b.cylinder(x,y+.93,z,.27,.16,.69,'#95a694',41,12);b.cylinder(x,y+1.25,z,.83,.66,.12,'#93a9a0',41,24);
 b.cylinder(x,y+1.32,z,.66,.66,.018,'#aac4b7',7,24);b.sphere(x,y+1.70,z,.19,.28,.19,'#b3c6a7',44,10,7);
 for(const [xx,zz]of[[-.4,6.2],[8.4,6.2],[-.4,11.8],[8.4,11.8]]){
  roomTree(b,xx,y+.2,zz,3.2);b.cylinder(xx,y+.18,zz,.73,.73,.14,'#8f9980',24,12);
 }
 for(const xx of[1.3,6.7]){bench(b,xx,y+.22,6.9,PI);bench(b,xx,y+.22,11.1);scenePerson(scene,b,xx,y+.22,11.1,'read',0,.88);}
 for(let i=0;i<6;i++)b.sphere(2.0+i*.35,y+.24,9.6,.055,.072,.086,'#68777e',42,6,4);
}
function hudsonWaterfront(scene,b){
 const y=HUDSON.water;
 b.box(0,y-.05,35,117,.12,11.6,'#487d85',7);
 // Water has broad vertex-color bands, not a costly field of surface boxes.
 for(let i=0;i<24;i++){
  const x=-56+i*4.8;b.quad([x,y+.015,29.5],[x+4.8,y+.015,29.5],[x+4.8,y+.015,40.5],[x,y+.015,40.5],i%3?'#739994':'#668e8e',7,[0,1,0]);
 }
 b.box(0,.12,29.4,111,.74,1.1,'#9f9d86',4);b.box(0,.53,29.5,112,.14,1.2,'#c3ba9e',24);
 houseRailing(b,[[-54,30.0],[54,30.0]],.62,.60,'#78928a');
 for(let x=-48;x<=45;x+=7.8){hudsonLamp(b,x,29.25,2.55);bench(b,x+.9,.60,29.30,PI);}
 for(const x of[25,34]){
  b.box(x,.2,34.3,2.5,.25,7.6,'#8e7960',22);
  for(let z=31;z<38;z+=.35)b.box(x,.345,z,2.42,.03,.22,'#b09c7a',22);
  for(const s of[-1,1])for(const z of[31,34,37.3])b.cylinder(x+s*1.05,-.11,z,.12,.12,1.3,'#736e58',22,8);
 }
 b.push(29.6,y+.16,35.2,0,.16);
 b.box(0,.39,0,2.15,.59,5.32,'#ddd5b9',40);b.box(0,.61,0,2.2,.10,5.42,'#284e61',40);
 b.box(0,1.09,-.28,1.76,.85,3.56,'#d7d9c8',40);b.box(0,1.55,-.28,1.91,.09,3.82,'#315767',40);
 for(const s of[-1,1])for(let i=0;i<8;i++)b.box(s*.89,1.18,-1.72+i*.42,.021,.32,.27,'#496b78',43);
 b.box(0,1.94,-.75,1.02,.72,1.25,'#e3d8b9',40);b.box(0,1.99,-.105,.74,.29,.021,'#3a6274',43);
 b.cylinder(0,2.56,-1.03,.20,.20,.65,'#375567',41,12);b.beam([0,2.46,-.6],[0,3.35,-.6],.029,'#aeae98',41,6);
 b.pop();hudsonSign(b,'RIVER FERRY',40,1.85,30.16,5.4,.67);
 for(const [x,z]of[[41,31.7],[45,33.8],[-24,35.6]]){
  b.push(x,y+.22,z,0,.32);b.cylinder(0,.05,0,.62,.39,.30,'#d7d1ae',40,10);b.beam([0,.22,0],[0,2.67,0],.022,'#b9b09a',41,5);
  b.tri([.045,2.53,0],[.045,.49,0],[1.04,.49,0],'#e4d9b4',23);b.pop();
 }
 scenePerson(scene,b,20.0,.6,29.4,'camera',PI,.85);
}
function hudsonCity(scene,b){
 hudsonStreet(b,0,-3,88,3.5);hudsonStreet(b,0,-17,84,3.4);hudsonStreet(b,15,-1,3.6,38);
 hudsonStreet(b,-30,-3,3.2,35);hudsonStreet(b,35,0,3.1,35);
 for(const x of[-30,15,35])for(const z of[-17,-3]){hudsonCrosswalk(b,x-2.5,z);hudsonCrosswalk(b,x,z+2.5,PI/2);}
 const blocks=[
  [-38,-10,7.6,8.6,8.2,'#99775f',{shop:'BOND CO',tank:true}],[-38,3,7.6,7.4,6.7,'#aa8a70',{shop:'MARKET',awning:'#866246',escape:true}],
  [-22,-10,9,7.7,11.7,'#a99070',{shop:'ATLAS HOTEL',tank:true}],[-9,-10,8.5,7.7,8.8,'#b69774',{shop:'RECORDS',escape:true,tank:true}],
  [-21,-21,10.6,4.0,8.2,'#8f6d58',{tank:true}],[-6,-21,10.4,4.0,13.1,'#b4a184',{}],
  [26,-21,10.0,4.0,11.7,'#73908d',{glass:true}],[26,-10,10.1,7.6,17.7,'#6f8990',{glass:true}],
  [41,-10,7.2,8.2,7.8,'#ac956f',{tank:true}],[41,3,6.9,7.5,6.4,'#ad9a7c',{shop:'ROAST',awning:'#4c7077'}],
  [25,4.8,10.4,10.0,7.6,'#b49070',{shop:'PALACE',awning:'#90674e',escape:true}],
  [-23,4.5,4.8,7,5.3,'#96715b',{shop:'BOOKS',awning:'#516a60',escape:true}],[-17.4,4.5,4.8,7,6.4,'#b49b79',{shop:'FLORIST',awning:'#7c8d66',tank:true}],[-11.8,4.5,4.8,7,5.7,'#9c8067',{shop:'COFFEE',awning:'#587b78',escape:true}]
 ];
 for(const a of blocks)hudsonBuilding(b,...a);
 hudsonDecoTower(b,5,-9.6);hudsonPark(scene,b);
 // A blade marquee, roof terraces, newspaper boxes and pavement cafe tables.
 b.box(19.64,5.2,8.2,.40,5.8,1.13,'#456873',40);
 for(let i=0;i<6;i++)hudsonText(b,'PALACE'[i],19.64,7.42-i*.88,8.78,.30,'#e5ba83',6);
 b.box(25,2.01,10.26,10.1,.55,1.45,'#be9d70',41);
 for(let i=0;i<26;i++)b.sphere(20.3+i*.37,1.91,11.02,.034,.034,.034,'#ebc38e',6,6,4);
 for(const x of[-25,-19,-12,22,29]){
  b.cylinder(x,.92,10.35,.42,.42,.06,'#b5a17b',22,12);b.cylinder(x,.66,10.35,.032,.045,.52,'#465d61',41,6);
  for(const s of[-1,1]){b.box(x+s*.62,.66,10.35,.34,.055,.34,'#7e8e79',22);b.box(x+s*.62,.87,10.19,.34,.44,.047,'#6d7d69',22);}
  if(x<0){b.cylinder(x,1.95,10.35,.95,.02,.40,x===-19?'#b28b64':'#d0c09c',23,12);b.beam([x,.99,10.35],[x,2.1,10.35],.020,'#8e8d74',41,6);}
 }
 for(const [x,z,a,t,c]of[[-26,-3.9,PI/2,true],[-6,-2.2,-PI/2,false,'#718c8c'],[20,-3.9,PI/2,true],[15.85,3,0,false,'#923f43'],[14.2,-13,PI,true],[-30.8,-8,0,false,'#b2b19d'],[35.8,9,0,true],[7,-17.7,PI/2,false,'#78909b'],[-15,-16.2,-PI/2,false,'#805a54'],[39,-3.8,PI/2,true]])hudsonCar(b,x,z,a,t,c);
 for(let x=-39;x<45;x+=8.6){hudsonLamp(b,x,-.43);hudsonLamp(b,x,-14.7);}
 for(const z of[-13,-6,4,11]){hudsonLamp(b,17.6,z);b.box(18.3,.91,z,.44,1.0,.45,'#5b6c65',41);}
 // Small pedestrians are grouped around places, never scattered onto the tracks.
 for(let i=0;i<24;i++){
  const x=-38+(i%12)*6.2,z=i<12?-.64:-14.53;scenePerson(scene,b,x,HUDSON.ground+.17,z,i%4?'walk':'bag',i%2?1.2:-1.0,.78);
 }
 for(const [x,z]of[[-27,2],[-7,3],[11,14],[31,12],[40,12]])roomTree(b,x,HUDSON.ground,z,3.1);
}
function hudsonShell(b){
 const walls=[],paint='#c3b69b',brick='#8b7562',iron='#34515a';
 b.box(0,FLOOR-.26,0,158,.52,130,'#999382',24);
 for(let x=-76;x<78;x+=8)for(let z=-62;z<64;z+=8)b.box(x,FLOOR+.015,z,7.93,.025,7.93,(Math.round((x+76)/8)+Math.round((z+62)/8))%2?'#b6ad96':'#c3b9a0',24);
 for(const which of['back','left','right','front']){
  const w=new Builder(),back=which==='back',front=which==='front',width=back||front?156:128,pos=back?[0,0,-64]:front?[0,0,64]:which==='left'?[-78,0,0]:[78,0,0],angle=back?0:front?PI:which==='left'?PI/2:-PI/2;
  w.push(...pos,0,angle);w.box(0,3,0,width,54,.7,brick,4);w.box(0,-18.2,.40,width,11,.40,iron,40);
  for(const y of[-23.3,-12.6,28.2])w.box(0,y,.80,width,.58,1.1,paint,24);
  const n=back?5:front?4:4;
  for(let i=0;i<n;i++){
   const x=(i-(n-1)/2)*(width-10)/n,ww=(width-10)/n-4;
   if(front&&Math.abs(x)<20)continue;
   // City-window glass is original geometry with visible steel mullions.
   w.box(x,7.1,.41,ww,33.6,.04,'#81989a',43);w.box(x,7.1,.48,ww-.8,32.8,.025,'#76959e',43);
   for(let k=0;k<=4;k++)w.box(x-ww/2+k*ww/4,7.1,.79,.16,33.7,.20,'#a6ac9d',41);
   for(const y of[-9.7,-2,6,14,22,24])w.box(x,y,.79,ww,.18,.20,'#acb0a1',41);
   hudsonArch(w,x,20,.93,ww/2,4.6,.35,HUDSON_BRASS,41,18);
   w.box(x,-10.2,1.20,ww+1,.64,2.0,paint,24);
  }
  for(let x=-width/2+2;x<=width/2-1;x+=25){w.box(x,3,1,1.1,52,1.25,iron,41);w.box(x,27.2,1.4,2.0,.9,2.0,HUDSON_BRASS,41);}
  if(back){const key='house-'+Object.keys(HOUSE_ROOMS).indexOf('hudson');if(roomLabels[key])roomFrame(w,key,0,-17.5,.91,43,7.4);}
  if(front){w.box(0,-5,1,19,37,1,iron,40);for(const s of[-1,1]){w.box(s*4.6,-4,1.57,8.4,34,.11,'#a8b9af',43);w.box(s*1.1,-5,1.81,.12,3.0,.12,HUDSON_BRASS,41);}hudsonSign(w,'HUDSON TERMINAL',0,17,1.51,29,4);}
  w.pop();walls.push({which,mesh:w.mesh()});
 }
 for(const z of[-55]){
  b.box(0,28.6,z,154,.95,.40,iron,41);b.box(0,29.2,z,156,.15,1.3,HUDSON_BRASS,41);
  for(const s of[-1,1])b.beam([s*77,20,z],[s*62,28,z],.42,iron,41,4);
 }
 for(const x of[-63,63])for(const z of[-44,44]){
  b.beam([x,29,z],[x,21.5,z],.065,'#4a5554',41,6);b.cylinder(x,21.0,z,3.1,1.35,1.24,iron,41,18);b.cylinder(x,20.365,z,2.78,2.78,.045,'#e8d4a0',25,18);
 }
 // A viewing bench and two small railway cabinets keep this recognisably a room.
 for(const x of[-65,65]){b.box(x,FLOOR+1.9,0,6.6,3.8,38,iron,40);b.box(x,FLOOR+4.0,0,7.2,.3,39,'#a1845e',22);for(let z=-15;z<16;z+=6)b.box(x,FLOOR+4.24,z,5.8,.26,4.8,'#8b9e8a',23);}
 return walls;
}
function hudsonRoom(scene,b){
 modelTable(b,0,0,HUDSON.width,HUDSON.depth,-.7,'#9b9c82');
 b.box(0,.05,-5.65,116,.66,69.1,'#a7a78d',24);
 const outer=hudsonRoute('Hudson electric main'),inner=hudsonRoute('Hudson return line',2.4);
 hudsonCity(scene,b);hudsonWaterfront(scene,b);hudsonViaduct(b,outer,inner);hudsonRails(b,outer);hudsonRails(b,inner);hudsonTerminal(scene,b);
 for(const x of[-53,53]){b.box(x,.85,-22,5,1.0,8,'#829286',3);roomTree(b,x,1.35,-22,4.1);roomTree(b,x+1.0,1.35,-25.2,3.3);}
 // A destination board fixed to the table edge and a miniature builders plate.
 b.push(0,-.64,41.27);hudsonSign(b,'HUDSON TERMINAL',0,0,0,31,1.22);hudsonText(b,'BY NICKFROMLATER',0,-.98,.04,15,'#d9c59d');b.pop();
 scene.routes=[outer,inner];scene.trains=[{edge:outer,distance:64,speed:2.20,type:'mountain',stock:'collection:acela',cars:6,collectionChoice:HOUSE_ROOMS.hudson.defaultCollection}];
 scene.height=(x,z)=>Math.abs(x)<=59&&Math.abs(z)<=41?(z>29.4?HUDSON.water:HUDSON.ground):FLOOR;
 scene.canPlace=()=>false;
 scene.spots=[
  {name:'Hudson, in miniature',target:[0,5,0],distance:126,phoneDistance:248,pitch:.66,yaw:.38,detail:'A grand terminal, brownstone streets, copper crowns and the silver Acela. A whole Northeast city on a brass-edged model table.'},
  {name:'The Acela platforms',target:[-17,4.2,24],distance:40,phoneDistance:79,pitch:.40,yaw:.36,detail:'Six passenger cars between two tapered electric power cars. Watch the bogies turn beneath the copper ribs of the train shed.'},
  {name:'Hudson Exchange',target:[4,12,-9],distance:54,phoneDistance:93,pitch:.37,yaw:.56,detail:'Limestone setbacks, a copper crown, rooftop water tanks and hundreds of individually placed windows.'},
  {name:'Brownstone mornings',target:[-19,3.7,6],distance:26,phoneDistance:51,pitch:.38,yaw:-.38,detail:'Fire escapes, striped shop awnings, pavement tables, flowers and a small record shop just across the avenue.'},
  {name:'Riverside departures',target:[28,2.5,31],distance:43,phoneDistance:76,pitch:.44,yaw:-.47,detail:'An electrified viaduct, a waiting ferry, sailing dinghies and a promenade for watching the express pass.'},
  {name:'The clock tower',target:[-39,7,14],distance:34,phoneDistance:60,pitch:.36,yaw:-.64,detail:'Four clock faces above the headhouse, station stairs and a departure board below.'},
  {name:'A pocket of green',target:[4,2,9],distance:24,phoneDistance:43,pitch:.52,yaw:.15,detail:'The fountain, little reading benches and a few pigeons. A quieter square between the tower and the terminal.'}
 ];
 scene.hudson={buildings:15,passengerCars:6,railHeight:HUDSON.rail};
}
registerHouseRoom('hudson',{
 name:'Hudson Terminal',layout:'The Northeast City Room',tag:'THE CITY NEVER QUITE STOPS',
 description:'A silver Acela threads a dense waterfront city. Limestone towers, copper roofs, brownstone stoops, cafe tables and the next departure beneath a grand clock.',
 color:'#91a9aa',ambient:'town',target:[0,5,0],distance:157,phoneDistance:280,pitch:.63,yaw:.38,
 train:{name:'Acela',number:'2009',service:'Hudson express',type:'electric trainset'},
 defaultCollection:{id:'acela',livery:0,cars:6},
 credits:[{name:'nickfromlater',platform:'github',handle:'nickfromlater',note:'Original Hudson Terminal city room and Acela-inspired miniature; built with agent assistance.'}],
 map:{plot:'east-4',scale:.40,footprint:[158,130],focus:[0,5,0]},
 lights:[[-63,20.36,-44],[63,20.36,-44],[-63,20.36,44],[63,20.36,44]],
 layoutLights:[[-26,5.53,20.07],[-40,9.43,20.18],[19.64,7.42,8.78],[4,1.97,9],[28,2.9,29],[5,24,-9.6],[-10,3,-.43],[24,3,-14.7]],
 build:hudsonRoom,shell:hudsonShell
});
