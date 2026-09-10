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
function hudsonWindow(b,x,y,z,w,h,lit=false,trim=true,dayColor=null){
 // Recesses and stone sill faces, not six invisible faces for every trim strip.
 // This leaves the fixed geometry budget for silhouettes and street details.
 const pane=(xx,yy,ww,hh,zz,c,m=24)=>b.quad([xx-ww/2,yy-hh/2,zz],[xx+ww/2,yy-hh/2,zz],[xx+ww/2,yy+hh/2,zz],[xx-ww/2,yy+hh/2,zz],c,m,[0,0,1]);
 if(trim)pane(x,y,w+.12,h+.14,z-.008,'#344750',42);
 pane(x,y,w,h,z,dayColor||(lit?'#c6c3a8':'#2c4657'),lit?6:43);
 if(trim){
  pane(x,y-h/2-.043,w+.17,.09,z+.095,'#bdc0b3');
  b.quad([x-w/2-.085,y-h/2+.002,z],[x+w/2+.085,y-h/2+.002,z],[x+w/2+.085,y-h/2+.002,z+.10],[x-w/2-.085,y-h/2+.002,z+.10],'#d0ccbb',24);
  pane(x,y+h/2+.032,w+.12,.065,z+.055,'#aead9b');
  pane(x,y,.029,h,z+.018,'#89908b',41);
  if(lit)pane(x-w*.27,y,w*.12,h*.97,z+.024,'#9e9c89',23);
 }
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
  if(!(options.brownstone&&face===0))for(let f=0;f<floors;f++)for(let c=0;c<cols;c++){
   const xx=-width/2+(c+.5)*width/cols,yy=1.08+f*ny;
   hudsonWindow(b,xx,yy,depth/2+.058,width/cols*.58,ny*.61,hash(c+f*31,x+z+face*77)>.74,!options.glass,options.glass?'#3b6474':null);
  }
  if(options.glass)for(let f=0;f<floors;f++)b.box(0,.59+f*ny,depth/2+.07,width-.24,.105,.06,'#8d9d9c',41);
  b.pop();
 }
 b.box(0,h+.535,0,w-.27,.07,d-.27,'#40545b',9);
 for(let seam=-d/2+.55;seam<d/2-.3;seam+=.72)b.box(0,h+.574,seam,w-.35,.006,.012,'#7d8882',42);
 for(const s of[-1,1]){b.box(s*(w/2-.07),h+.70,0,.14,.49,d,HUDSON_STONE,4);b.box(0,h+.70,s*(d/2-.07),w,.49,.14,HUDSON_STONE,4);}
 if(!options.roof){
 b.box(-w*.18,h+.81,-d*.20,w*.34,.74,d*.27,'#879292',41);
 for(let i=0;i<5;i++)b.box(-w*.18,h+1.20,-d*.30+i*d*.042,w*.29,.025,.028,'#4e636c',42);
 b.box(w*.27,h+.8,-d*.24,.37,.88,.40,'#b48766',4);
 if(options.tank)hudsonWaterTank(b,w*.19,h+.48,d*.18,Math.min(w,d)*.14);
 }
 if(options.escape)hudsonFireEscape(b,w,h,d);
 if(options.shop){
  for(const xx of[-w*.29,w*.29])hudsonWindow(b,xx,.99,d/2+.067,w*.35,1.13,true,false);
  b.box(0,.84,d/2+.09,.66,1.34,.06,HUDSON_INK,40);
  hudsonSign(b,options.shop,0,1.76,d/2+.15,w*.83,.44,options.awning||HUDSON_INK);
  b.box(0,1.62,d/2+.56,w+.13,.075,.99,options.awning||'#5e7a6c',23);
  for(let i=0;i<Math.floor(w/.29);i++)b.box(-w/2+i*.29,1.628,d/2+.58,.12,.012,.92,'#d6caa7',23);
  b.box(0,1.46,d/2+1.01,w+.11,.29,.045,options.awning||'#5e7a6c',23);
  for(let i=0;i<Math.floor(w/.29);i++){const x=-w/2+i*.29;b.quad([x-.06,1.32,d/2+1.036],[x+.06,1.32,d/2+1.036],[x+.06,1.60,d/2+1.036],[x-.06,1.60,d/2+1.036],'#d6caa7',23);}
 }
 b.pop();
}
function hudsonDecoTower(b,x,z){
 b.push(x,HUDSON.ground,z);
 const tiers=[[10,8.3,0,6.0],[8.8,7.4,6.0,13.0],[6.9,5.9,19.0,5.6],[4.7,4.3,24.6,4.0],[2.7,2.5,28.6,2.5]];
 for(const [w,d,y,h]of tiers){
  b.box(0,y+h/2,0,w,h,d,'#b3b6a6',24);b.box(0,y+h,0,w+.25,.20,d+.25,'#d7c9a5',24);
  for(let face=0;face<4;face++){
   b.push(0,0,0,0,face*PI/2);const ww=face%2?d:w,dd=face%2?w:d,cols=Math.max(2,Math.floor(ww/.93));
   for(let c=0;c<cols;c++){const xx=-ww/2+(c+.5)*ww/cols;
    b.box(xx,y+h/2,dd/2+.09,.125,h-.2,.18,'#c9c4aa',24);
    for(let yy=y+.72;yy<y+h-.2;yy+=1.10)hudsonWindow(b,xx+ww/cols*.30,yy,dd/2+.087,ww/cols*.44,.75,hash(c,yy+face*8)>.70,false);
   }
   for(const side of[-1,1]){b.box(side*(ww/2-.17),y+h/2,dd/2+.1,.20,h,.23,'#dbcaa3',24);b.box(side*(ww/2-.17),y+h-.25,dd/2+.23,.08,.42,.05,HUDSON_BRASS,41);}
   b.pop();
  }
 }
 // A stepped, ribbed copper lantern gives the tower an unmistakable crown.
 for(let tier=0;tier<3;tier++){
  const yy=31.2+tier*.93,rr=1.79-tier*.35;b.cylinder(0,yy,0,rr,rr*.54,1.05,'#45827a',41,8);
  for(let i=0;i<8;i++){const a=(i+.5)*TAU/8;b.beam([Math.cos(a)*rr,yy-.50,Math.sin(a)*rr],[Math.cos(a)*rr*.54,yy+.51,Math.sin(a)*rr*.54],.039,'#bcc6a8',41,5);}
 }
 b.cylinder(0,34.65,0,.44,.06,1.2,'#a9bda6',41,8);b.beam([0,35.1,0],[0,39.0,0],.042,HUDSON_BRASS,41,6);b.sphere(0,39,0,.075,.075,.075,'#ebc484',6,6,4);
 for(const side of[-1,1]){b.box(side*1.9,1.7,4.22,.30,3.4,.30,HUDSON_BRASS,41);hudsonWindow(b,side*3.5,2.1,4.21,1.05,2.65,true);}
 hudsonSign(b,'HUDSON EXCHANGE',0,3.9,4.24,6.8,.74);hudsonArch(b,0,2.6,4.32,1.5,1.10,.14,HUDSON_BRASS,41,14);
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
 ribbon(b,edge,1.7,0,-.23,'#52626b',9,0,edge.length,.65);
 for(let d=0;d<edge.length;d+=.44){const a=edge.at(d);b.matrix(basis(a.p,a.f));
  b.quad([-.56,-.027,-.065],[.56,-.027,-.065],[.56,-.027,.065],[-.56,-.027,.065],'#aeb5ad',24,[0,1,0]);
  for(const z of[-.065,.065])b.quad([-.56,-.095,z],[.56,-.095,z],[.56,-.027,z],[-.56,-.027,z],'#707e7d',24);b.pop();
 }
 for(const side of[-1,1]){ribbon(b,edge,.048,side*.32,.012,'#435765',11,0,edge.length,.48);ribbon(b,edge,.068,side*.32,.059,'#b8c6ca',1,0,edge.length,.48);}
}

function hudsonViaduct(b,outer,inner){
 for(const edge of[outer,inner]){
  ribbon(b,edge,2.03,0,-.41,'#5b7378',24,0,edge.length,.70);
  for(const side of[-1,1])ribbon(b,edge,.13,side*.99,-.25,'#90a59d',41,0,edge.length,.70);
  for(let d=2;d<edge.length;d+=5.4){const a=edge.at(d);if(a.p[2]>23&&a.p[0]>16&&a.p[0]<40)continue;b.matrix(basis(a.p,a.f));
   b.box(0,-1.35,0,.72,1.84,.62,'#a5a18e',4);b.box(0,-.56,0,2.0,.27,.77,'#bcc1b4',24);b.box(0,-2.17,0,1.2,.20,1.12,'#8c9690',24);b.pop();
  }
 }
 // The station vault and river bridge have their own overhead suspension.
 for(let d=2;d<outer.length;d+=9.4){
  const a=outer.at(d);if(a.p[2]>23&&a.p[0]>16&&a.p[0]<40)continue;b.matrix(basis(a.p,a.f));
  for(const x of[-1.35,3.65]){b.box(x,1.28,0,.065,4.74,.078,HUDSON_INK,41);b.box(x,-1.08,0,.29,.18,.28,'#9ba597',24);}
  b.box(1.15,3.59,0,5.23,.070,.10,'#51656c',41);
  for(const x of[0,2.4]){hudsonWire(b,[x,3.57,0],[x,2.54,0],.014,'#a6987f');b.cylinder(x,3.09,0,.065,.065,.19,'#b3a48f',24,6);}b.pop();
 }
 for(const edge of[outer,inner])for(let d=0;d<edge.length;d+=2){const a=edge.at(d),q=edge.at(Math.min(edge.length,d+2));
  hudsonWire(b,add(a.p,[0,2.52,0]),add(q.p,[0,2.52,0]),.009,'#798f91');
  hudsonWire(b,add(a.p,[0,3.11,0]),add(q.p,[0,3.11,0]),.010,'#677d80');
  if(Math.floor(d)%4===0)hudsonWire(b,add(a.p,[0,2.52,0]),add(a.p,[0,3.11,0]),.008,'#87998f');
 }
 // Brick arches under the station, individually jointed at the voussoirs.
 for(let x=-34;x<4;x+=4.8){
  for(const z of[23.49,28.02]){
   b.box(x-2.2,1.21,z,.45,1.65,.22,'#8f7766',4);
   hudsonArch(b,x,.81,z,1.93,1.35,.29,'#a29a85',24,10);
   b.box(x,2.34,z,4.8,.19,.26,'#c0b8a2',24);
  }
 }
 hudsonRiverBridge(b);
}

function hudsonStreet(b,x,z,w,d){
 b.box(x,HUDSON.ground-.046,z,w,.08,d,'#263b47',9);
 const horizontal=w>d,length=horizontal?w:d;
 for(let p=-length/2+1;p<length/2;p+=1.9)b.box(x+(horizontal?p:0),HUDSON.ground+.003,z+(horizontal?0:p),horizontal?.88:.045,.012,horizontal?.045:.88,'#c0a65f',24);
 for(const side of[-1,1]){
  b.box(x+(horizontal?0:side*(w/2+.42)),HUDSON.ground+.07,z+(horizontal?side*(d/2+.42):0),horizontal?w:.80,.15,horizontal?.80:d,'#a9ae9f',24);
  b.box(x+(horizontal?0:side*(w/2+.015)),HUDSON.ground+.15,z+(horizontal?side*(d/2+.015):0),horizontal?w:.08,.05,horizontal?.08:d,'#cbd0ba',24);
  for(let p=-length/2+1;p<length/2;p+=1.9){const xx=x+(horizontal?p:side*(w/2+.43)),zz=z+(horizontal?side*(d/2+.43):p);b.box(xx,HUDSON.ground+.148,zz,horizontal?.018:.76,.006,horizontal?.76:.018,'#899389',24);}
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
 b.box(-18,y-.19,21.00,40,.38,3.8,'#b6b6a3',24);
 for(const z of[25.40,26.20,22.84])b.box(-17,y+.012,z,37,.025,.10,'#dcb251',24);
 for(let x=-33;x<2;x+=.55){b.box(x,y+.031,25.46,.23,.013,.042,'#9e8245',24);b.box(x,y+.031,26.14,.23,.013,.042,'#9e8245',24);}
 for(let x=-35;x<3;x+=4.6){for(const z of[19.6,22.2])b.box(x,1.52,z,.46,2.28,.46,'#8f8c77',4);b.box(x,2.60,21,1.1,.27,3.50,'#a9aa96',24);}
 hudsonStationVault(b,y);
 for(const x of[-29,-20,-11,-2]){bench(b,x,y,21.13);scenePerson(scene,b,x,y,21.13,'sit',0,.90);scenePerson(scene,b,x+1.1,y,21.25,'bag',.9,.84);}
 b.push(-40,y,14);
 b.box(0,2.23,0,8.4,4.46,12.2,'#c0aa86',4);b.box(0,4.58,0,9,.30,12.8,'#d8c5a0',24);
 for(const x of[-3.9,-1.3,1.3,3.9])b.box(x,2.42,6.13,.25,4.4,.33,HUDSON_STONE,24);
 for(const x of[-2.6,0,2.6]){hudsonWindow(b,x,2.36,6.18,2.02,2.55,true,false);hudsonArch(b,x,3.05,6.23,1.04,.61,.12,'#dac6a0',24,12);}
 hudsonSign(b,'HUDSON TERMINAL',0,4.04,6.37,7.18,.58);
 for(const x of[-2.65,0,2.65]){hudsonArch(b,x,2.3,-6.17,1.10,1.62,.20,'#ead4aa');hudsonWindow(b,x,1.82,-6.185,1.75,2.76,true,false);}
 b.box(0,6.05,-1,4.45,3.10,4.70,'#b29f7b',4);b.box(0,7.64,-1,4.88,.23,5.0,'#dbcaab',24);
 for(let face=0;face<4;face++){b.push(0,0,-1,0,face*PI/2);hudsonClock(b,0,6.35,2.37,.89);b.pop();}
 b.cylinder(0,8.72,-1,3.35,.60,1.91,'#6d8c80',41,4);b.cylinder(0,9.93,-1,.43,.055,.68,'#b8ab81',41,8);b.beam([0,10.2,-1],[0,11.2,-1],.035,HUDSON_BRASS,41,6);
 hudsonHeadHouseDetail(b);b.pop();
 // Street stairs arrive at the station elevation, with parallel brass handrails.
 for(let i=0;i<13;i++)b.box(-34.1,HUDSON.ground+(i+1)*.21/2,14.8+i*.35,2.3,(i+1)*.21,.36,'#c0b293',24);
 for(const x of[-35.14,-33.06])b.beam([x,1.13,14.7],[x,y+.77,19.0],.027,HUDSON_BRASS,41,6);
 // Departures board, information counter and a kiosk, all original lettering.
 b.box(-26,y+1.49,20.80,4.4,1.4,.10,HUDSON_INK,40);
 for(const [i,text]of['DEPARTURES','ACELA  BOSTON','REGIONAL  NY'].entries())hudsonText(b,text,-26,y+1.85-i*.39,20.863,3.88,i?'#c6c5ae':'#e9c884',i?0:6);
 b.box(-6.3,y+.56,20.75,1.50,1.12,1.12,'#3d6670',40);hudsonSign(b,'NEWS',-6.3,y+1.24,21.33,1.3,.30);
 for(const x of[-7.2,-6.6,-6.0])b.box(x,y+.77,21.49,.26,.45,.045,'#d4c4a1',24);
}

function hudsonPark(scene,b){
 const x=4,z=9,y=HUDSON.ground;
 b.box(x,y+.05,z,12,.1,10,'#b9b394',24);b.box(x,y+.14,z,10.9,.16,8.9,'#71896d',3);
 b.box(x,y+.24,z,1.3,.08,9.1,'#c8ba98',9);b.box(x,y+.24,z,11,.08,1.3,'#c8ba98',9);
 b.cylinder(x,y+.4,z,1.51,1.51,.38,HUDSON_STONE,24,28);b.cylinder(x,y+.61,z,1.28,1.28,.04,'#8eb3a9',7,28);
 b.cylinder(x,y+.93,z,.27,.16,.69,'#95a694',41,12);b.cylinder(x,y+1.25,z,.83,.66,.12,'#93a9a0',41,24);
 b.cylinder(x,y+1.32,z,.66,.66,.018,'#aac4b7',7,24);b.sphere(x,y+1.70,z,.15,.32,.15,'#b3c6a7',44,10,7);
 for(let k=0;k<8;k++){const a=k*TAU/8;for(let i=0;i<7;i++){const t=i/7,u=(i+1)/7,p=t=>[x+Math.cos(a)*t*1.12,y+1.63+.25*Math.sin(t*PI)-t*.91,z+Math.sin(a)*t*1.12];b.beam(p(t),p(u),.011,'#b4d2bc',44,4);}}
 for(const [xx,zz]of[[-.4,6.2],[8.4,6.2],[-.4,11.8],[8.4,11.8]]){
  hudsonTree(b,xx,y+.2,zz,3.35);b.cylinder(xx,y+.18,zz,.73,.73,.14,'#8f9980',24,12);
 }
 for(const xx of[1.3,6.7]){bench(b,xx,y+.22,6.9,PI);bench(b,xx,y+.22,11.1);scenePerson(scene,b,xx,y+.22,11.1,'read',0,.88);}
 for(let i=0;i<6;i++)b.sphere(2.0+i*.35,y+.24,9.6,.055,.072,.086,'#68777e',42,6,4);
}
function hudsonFerry(scene,b){
 b.push(29.6,HUDSON.water+.16,35.2,0,.16);
 const sections=[[-2.65,.96],[-2.32,1.08],[1.35,1.08],[1.97,.89],[2.48,.49],[2.78,.04]];
 for(let i=0;i<sections.length-1;i++){
  const [z,w]=sections[i],[q,v]=sections[i+1];
  for(const side of[-1,1]){
   b.quad([side*w,.60,z],[side*v,.60,q],[side*v*.89,.03,q],[side*w*.89,.03,z],'#d7d8c3',40);
   b.quad([side*w*.89,.03,z],[side*v*.89,.03,q],[side*v*.50,-.17,q],[side*w*.50,-.17,z],'#354f5a',40);
   b.quad([side*(w+.01),.44,z],[side*(v+.01),.44,q],[side*(v+.01),.56,q],[side*(w+.01),.56,z],'#2e626f',40);
   b.beam([side*w,.63,z],[side*v,.63,q],.028,'#99ada0',41,5);
  }
  b.quad([-w,.62,z],[w,.62,z],[v,.62,q],[-v,.62,q],'#b6b69a',24,[0,1,0]);
 }
 b.box(0,.32,-2.66,1.94,.61,.035,'#bbc6b7',40);
 b.box(0,1.08,-.45,1.75,.85,3.28,'#d3d8c2',40);
 for(const side of[-1,1]){
  for(let i=0;i<8;i++){const z=-1.80+i*.385;b.box(side*.89,1.16,z,.022,.35,.28,i%3===1?'#7d9b96':'#365f70',i%3===1?6:43);}
  b.box(side*.907,1.39,-.45,.029,.065,3.31,'#547d83',41);
  for(const z of[-1.55,.53])ringX(b,side*.945,1.18,z,.12,.19,.045,'#c77c55',40,16);
  for(const z of[-2.45,-2.07,1.29,1.63,1.97]){const w=z>1.3?.94:1.0;b.beam([side*w,.65,z],[side*w,1.02,z],.015,'#657f77',41,5);}
  b.beam([side*.99,1.03,-2.47],[side*.99,1.03,-1.95],.015,'#becab7',41,5);
  b.beam([side*1.02,1.03,1.21],[side*.76,1.03,2.13],.015,'#becab7',41,5);
  b.cylinder(side*.94,.74,-2.4,.060,.083,.16,'#456666',41,6);
 }
 b.box(0,1.54,-.45,1.98,.13,3.54,'#467581',40);
 b.box(0,1.66,-.72,1.24,.12,2.27,'#b4baa5',24);
 b.box(0,2.0,.21,1.15,.63,1.08,'#dce0cd',40);
 b.box(0,2.10,.76,.95,.28,.024,'#315669',43);b.box(0,2.34,.21,1.29,.11,1.21,'#4c7480',40);
 for(const side of[-1,1]){b.box(side*.587,2.10,.25,.023,.29,.70,'#345d6a',43);b.box(side*.68,1.85,.76,.12,.10,.16,side<0?'#aa6652':'#6ca789',6);}
 for(const side of[-1,1]){b.cylinder(side*.64,1.84,-1.04,.18,.18,.72,'#d7d7c1',40,12,PI/2);for(const z of[-1.27,-.79])b.box(side*.64,1.85,z,.38,.045,.044,'#627f7b',41);}
 b.cylinder(0,2.12,-1.20,.19,.19,.91,'#3b6171',41,12);b.cylinder(0,2.57,-1.20,.20,.20,.13,'#bbc6b0',41,12);
 b.beam([0,2.39,.10],[0,3.17,.10],.027,'#b1c0ad',41,6);b.beam([-.36,2.94,.10],[.36,2.94,.10],.018,'#b1c0ad',41,5);
 b.tri([0,2.89,.1],[0,2.59,.1],[.39,2.72,.1],'#a2745c',23);
 for(let i=0;i<6;i++)b.box(-.70,.72+i*.14,-2.15+i*.1,.40,.04,.19,'#879b90',41);
 hudsonSign(b,'HUDSON',0,1.10,1.208,1.2,.23);
 scenePerson(scene,b,.41,.65,1.91,'camera',.3,.57);scenePerson(scene,b,-.45,.65,-2.24,'stand',-.4,.56);
 b.pop();
}
function hudsonSailboat(b,x,z){
 b.push(x,HUDSON.water+.14,z,0,.32);
 const shape=[[-.47,.02,-.94],[.47,.02,-.94],[.56,.02,.34],[.23,.02,1.04],[0,.02,1.25],[-.23,.02,1.04],[-.56,.02,.34]];
 for(let i=0;i<shape.length;i++){
  const a=shape[i],q=shape[(i+1)%shape.length];b.tri([0,-.16,-.03],a,q,'#6f9996',40);
  b.quad(a,q,[q[0],.23,q[2]],[a[0],.23,a[2]],'#dcd9bb',40);b.beam([a[0],.24,a[2]],[q[0],.24,q[2]],.018,'#adad91',22,4);
 }
 b.box(0,.12,-.20,.77,.05,.83,'#638779',22);b.box(0,.29,-.57,.94,.09,.19,'#c2af87',22);
 b.beam([0,.15,.19],[0,3.36,.19],.025,'#b6b39a',41,5);b.beam([0,.66,.17],[0,.66,-1.02],.023,'#aaa989',41,5);
 b.tri([.012,3.20,.16],[.075,.76,.16],[.075,.69,-1.0],'#ded4b3',23);b.tri([.015,2.80,.25],[.02,.64,1.1],[.04,.66,.25],'#cfc6a7',23);
 hudsonWire(b,[0,3.2,.19],[0,.24,-.94],.006,'#a5b3a0');hudsonWire(b,[0,3.2,.19],[0,.24,1.2],.006,'#a5b3a0');
 b.tri([0,3.34,.19],[0,3.16,.19],[.33,3.25,.19],'#b6845e',23);b.pop();
}

function hudsonWaterfront(scene,b){
 const y=HUDSON.water;
 hudsonWaterSurface(b,-58,58,29.55,40.65);hudsonWaterSurface(b,16,40,16.9,29.6);
 // The river enters a tidal basin under the open bowstring railway bridge.
 for(const [cx,w]of[[-20,72],[48,16]]){
  b.box(cx,.13,29.45,w,.75,.85,'#727f7c',4);b.box(cx,.56,29.45,w+.1,.16,.98,'#b6b9a4',24);
  houseRailing(b,[[cx-w/2+.2,29.93],[cx+w/2-.2,29.93]],.64,.54,'#52716f');
 }
 for(const x of[16,40]){b.box(x,.13,23.2,.45,.75,12.4,'#6c7d7c',4);b.box(x,.58,23.2,.64,.16,12.5,'#aeb79f',24);houseRailing(b,[[x,17.1],[x,22.6]],.67,.50,'#507470');}
 b.box(28,.13,17,24,.75,.40,'#73827b',4);b.box(28,.59,17,24.1,.17,.75,'#b7b9a4',24);houseRailing(b,[[16.4,16.8],[39.6,16.8]],.68,.53,'#547573');
 for(const x of[-49,-40,-31,-22,-13,-4,6,46,52]){hudsonLamp(b,x,29.43,3);bench(b,x-1.3,.62,29.13,PI);}
 for(const x of[26,33]){
  b.box(x,.24,34.1,2.55,.25,7.6,'#807863',22);
  for(let z=30.8;z<38;z+=.32)b.box(x,.385,z,2.5,.025,.25,'#a38f6f',22);
  for(const side of[-1,1])for(const z of[31,34,37.3]){b.cylinder(x+side*1.08,-.09,z,.12,.12,1.25,'#646853',22,6);b.cylinder(x+side*1.04,.52,z,.083,.105,.19,'#344c51',41,6);}
 }
 hudsonFerry(scene,b);hudsonSign(b,'RIVER FERRY',40,1.85,30.16,5.4,.67);
 for(const [x,z]of[[41,31.7],[53.8,35.7],[-24,35.6]])hudsonSailboat(b,x,z);

 // Recessed stone stairs into the basin and mooring ropes, not a painted dock.
 for(let i=0;i<7;i++)b.box(36.8,.49-i*.095,18.0+i*.31,2.8,.10,.35,'#aaa78f',24);
 for(const z of[32.0,36.8])hudsonWire(b,[28.5,.67,z],[27.03,.62,z+.4],.018,'#b9a880');
 for(const [x,z]of[[23.1,35.8],[24.2,37.1],[42.3,36.5],[-34.7,34.2]]){
  b.quad([x,y+.021,z],[x+2.4,y+.021,z+.13],[x+2.1,y+.021,z+.23],[x+.1,y+.021,z+.08],'#6e9590',7,[0,1,0]);
 }
 hudsonFerryLanding(b);scenePerson(scene,b,12.1,.62,29.4,'camera',PI,.85);
}

// Fine wire is a crossed pair of ribbons. A round capped cylinder spends most
// of its vertices on faces that never span a pixel at railway scale.
function hudsonWire(b,a,q,r,c){
 const f=norm(sub(q,a)),u=norm(cross(f,Math.abs(f[1])>.9?[1,0,0]:[0,1,0])),v=norm(cross(f,u));
 for(const n of[u,v])b.quad(add(a,mul(n,-r)),add(q,mul(n,-r)),add(q,mul(n,r)),add(a,mul(n,r)),c,41);
}
function hudsonTree(b,x,y,z,h){
 b.cylinder(x,y+h*.24,z,.075,.045,h*.48,'#776f55',22,6);
 b.sphere(x,y+h*.70,z,h*.26,h*.34,h*.24,'#6e8d69',8,9,6,true);
 b.sphere(x+h*.17,y+h*.65,z-h*.06,h*.19,h*.25,h*.20,'#879b73',8,8,5,true);
 b.box(x,y+.015,z,.73,.025,.73,'#475b50',42);
}
function hudsonWaterSurface(b,x0,x1,z0,z1){
 const nx=Math.max(3,Math.ceil((x1-x0)/4)),nz=Math.max(3,Math.ceil((z1-z0)/2)),y=HUDSON.water;
 const vertex=(x,z)=>{const f=clamp((z-17)/24,0,1),j=hash(x*3,z*7)*.035;return [x,y+.009,z,.24+j-f*.08,.43+j-f*.055,.44+j-f*.025];};
 for(let ix=0;ix<nx;ix++)for(let iz=0;iz<nz;iz++){
  const a=vertex(mix(x0,x1,ix/nx),mix(z0,z1,iz/nz)),q=vertex(mix(x0,x1,(ix+1)/nx),mix(z0,z1,iz/nz)),r=vertex(q[0],mix(z0,z1,(iz+1)/nz)),t=vertex(a[0],r[2]);
  for(const p of[a,t,r,a,r,q])b.vertex(p.slice(0,3),[0,1,0],p.slice(3),7,[0,0]);
 }
}
function hudsonRiverBridge(b){
 const y=HUDSON.rail,arch=x=>y+.33+5.55*Math.sin((x-16)*PI/24),ink='#3f7174',edge='#79a49a';
 for(const x of[15.4,40.6]){b.box(x,.99,25.8,1.6,2.28,6.3,'#7b8983',4);b.box(x,2.12,25.8,2.0,.30,6.65,'#bac1aa',24);}
 for(const z of[23.15,28.45]){
  b.box(28,y-.37,z,24,.48,.28,ink,41);b.box(28,y-.13,z,24,.09,.41,edge,41);
  for(let i=0;i<24;i++){const x=16+i,q=x+1;b.beam([x,arch(x),z],[q,arch(q),z],.13,ink,41,4);b.beam([x,arch(x)+.16,z],[q,arch(q)+.16,z],.045,edge,41,4);}
  for(let i=1;i<12;i++){const x=16+i*2,top=arch(x);b.beam([x,y-.25,z],[x,top,z],.054,ink,41,4);
   if(i<11)b.beam([x,y+.10,z],[x+2,arch(x+2),z],.030,'#71938e',41,4);
   b.box(x,y+.08,z+.035,.31,.26,.09,ink,41);
   for(const dx of[-.095,.095])b.sphere(x+dx,y+.10,z+.092,.023,.023,.022,'#a5b3a2',41,5,3);
  }
 }
 for(const x of[23,28,33]){const h=arch(x);b.beam([x,h,23.15],[x,h,28.45],.08,ink,41,4);b.beam([x-.8,h-.10,23.15],[x+.8,h-.10,28.45],.029,edge,41,4);
  b.beam([x,h,25.8],[x,y+3.11,25.8],.027,ink,41,4);b.box(x,y+3.11,25.8,.10,.09,3.8,ink,41);
 }
 for(const z of[23.18,28.42]){b.box(28,y-.59,z,24,.10,.47,'#658984',41);}
 hudsonSign(b,'HUDSON RIVER',28,y+.25,28.65,5.8,.62,'#2d555b');
}
function hudsonSetbackCrown(b,x,z,w,d,h){
 b.push(x,HUDSON.ground,z);
 for(let i=0;i<2;i++){
  const ww=w*(.75-i*.18),dd=d*(.72-i*.15),base=h+.46+i*2.0;
  b.box(0,base+.96,0,ww,1.90,dd,i?'#789084':'#a39a84',i?41:24);
  for(const side of[-1,1])for(let col=0;col<Math.floor(ww/.88);col++)hudsonWindow(b,-ww/2+.46+col*.87,base+1.02,side*(dd/2+.021),.48,1.19,col%3===1,false);
  b.box(0,base+1.93,0,ww+.16,.16,dd+.16,'#c4baa0',24);
 }
 for(let i=0;i<5;i++)b.box(-w*.37+i*w*.19,h+.92,d*.47,.60,.88,.75,'#5e7a62',8);
 b.pop();
}
function hudsonGlassCrown(b,x,z,h){
 b.push(x,HUDSON.ground,z);
 const w=7.6,d=5.5;
 b.box(0,h+1.10,0,w,1.36,d,'#3e6270',43);
 for(let i=0;i<7;i++)b.box(-3.65+i*1.21,h+1.85,0,.10,2.32,d+.2,'#a6b6ae',41);
 for(const zz of[-d/2,d/2])b.box(0,h+2.88,zz,w+.25,.12,.13,'#adc0b0',41);for(const xx of[-w/2,w/2])b.box(xx,h+2.88,0,.13,.12,d,'#adc0b0',41);
 b.quad([-w/2+.07,h+2.89,-d/2+.07],[w/2-.07,h+2.89,-d/2+.07],[w/2-.07,h+2.89,d/2-.07],[-w/2+.07,h+2.89,d/2-.07],'#9cbca7',76);
 b.beam([2,h+3,0],[2,h+6.5,0],.04,'#a8b9b0',41,5);b.sphere(2,h+6.55,0,.065,.065,.065,'#d8ae73',6,6,4);b.pop();
}
function hudsonBrownstone(b,x,z,h){
 b.push(x,HUDSON.ground,z);
 // Paired bay windows, stoops, entrance fanlights, roof cornice brackets.
 for(const xx of[-1.2,1.15])for(let y=3.1;y<h-.4;y+=1.47){
  b.box(xx,y,3.65,1.06,1.20,.35,'#816955',24);hudsonWindow(b,xx,y,3.837,.73,.91,(Math.floor(y)+Math.round(x))%3===0);
  b.box(xx,y+.67,3.66,1.22,.14,.44,'#beab87',24);
 }
 for(let i=0;i<9;i++)b.box(-2.1+i*.52,h+.77,3.55,.18,.30,.43,'#b5a07b',24);
 b.box(0,h+.98,3.6,5.10,.19,.62,'#887c65',24);
 for(const xx of[-1.10,1.15]){
  b.box(xx,2.33,3.80,.97,.15,.46,'#626d53',22);
  for(let i=0;i<5;i++){b.sphere(xx-.36+i*.18,2.5,3.82,.12,.17,.13,'#7d9867',8,6,4);b.sphere(xx-.36+i*.18,2.62,3.84,.049,.049,.05,i%2?'#b47464':'#d2b776',0,5,3);}
 }
 b.pop();
}
function hudsonTrafficLight(b,x,z,green){
 const y=HUDSON.ground;b.cylinder(x,y+1.2,z,.035,.035,2.4,'#375055',41,5);
 b.box(x,y+2.36,z,.22,.68,.19,'#303c3c',42);
 for(let i=0;i<3;i++)b.cylinder(x,y+2.60-i*.21,z+.11,.060,.060,.035,i===(green?2:0)?(green?'#83be8a':'#d1684c'):'#273b3b',i===(green?2:0)?6:42,8,PI/2);
 b.box(x,y+1.69,z+.03,.32,.31,.26,'#a9945a',41);
 b.box(x,y+1.69,z+.17,.20,.19,.014,'#273c42',42);b.box(x,y+1.69,z+.18,.075,.12,.012,'#e1c17d',6);
}
function hudsonDeliveryVan(b,x,z,angle){
 b.push(x,HUDSON.ground,z,0,angle);b.box(0,.53,0,.90,.77,1.89,'#c5c5b2',40);b.box(0,.98,-.12,.83,.10,1.58,'#b1bbb1',40);
 b.box(0,.84,.98,.74,.31,.032,'#345663',43);b.box(0,.34,1.06,.84,.12,.10,'#5b7073',41);
 for(const side of[-1,1])for(const zz of[-.62,.62])b.cylinder(side*.46,.19,zz,.16,.16,.08,'#26393e',42,8,0,PI/2);
 hudsonSign(b,'POST',0,.61,1.015,.61,.23,'#425f69');b.pop();
}
function hudsonStationVault(b,y){
 const ink='#345b61',copper='#588e80',x0=-35.2,x1=1.6,center=25.22,r=3.44,spring=y+3.33,rise=3.45;
 const p=(x,a)=>[x,spring+Math.sin(a)*rise,center+Math.cos(a)*r];
 for(let i=0;i<=10;i++){
  const x=mix(x0,x1,i/10);
  for(const z of[center-r,center+r]){
   b.box(x,y+1.64,z,.145,3.28,.16,ink,41);b.box(x,y+.17,z,.32,.34,.32,'#9bada0',24);b.box(x,spring-.20,z,.45,.12,.36,'#84a59a',41);
   b.beam([x,y+2.57,z],[x-.60,y+3.28,z],.038,ink,41,4);b.beam([x,y+2.57,z],[x+.60,y+3.28,z],.038,ink,41,4);
  }
  for(let j=0;j<18;j++)b.beam(p(x,j*PI/18),p(x,(j+1)*PI/18),i===0||i===10?.072:.043,ink,41,4);
  if(i%2===1){hudsonSign(b,'HUDSON',x,y+2.17,22.04,1.95,.47);b.beam([x,y+3.1,24.6],[x,y+3.1,27],.025,'#d8cfac',41,4);}
 }
 for(let j=0;j<=12;j++){const a=j*PI/12;b.beam(p(x0,a),p(x1,a),j===6?.078:.028,j===6?copper:ink,41,4);}
 for(let i=0;i<10;i++)for(let j=0;j<12;j++){
  const a=j*PI/12,q=(j+1)*PI/12,xx=mix(x0,x1,i/10)+.055,xe=mix(x0,x1,(i+1)/10)-.055;
  b.quad(p(xx,a+.009),p(xe,a+.009),p(xe,q-.009),p(xx,q-.009),'#87b5a7',j===0||j===11?40:76);
 }
 // Tall glazed terminal screens, radial fanlights and a raised ridge lantern.
 for(const x of[x0,x1]){
  b.quad([x,y+.9,center-r],[x,y+.9,center+r],[x,spring,center+r],[x,spring,center-r],'#9bb9a7',76);
  for(let j=1;j<12;j++){const a=j*PI/12;b.beam([x,spring,center],p(x,a),.026,'#91afa1',41,4);}
 }
 b.box(-16.8,spring+rise+.12,center,35.8,.20,.78,copper,41);
 for(const x of[-32,-24,-16,-8,0]){b.box(x,spring+rise+.38,center,.20,.50,.22,'#c2c7a8',41);}
 // Illuminated arched ticket arcade along the landward platform.
 b.box(-16.8,y+1.60,19.9,35.8,3.2,1.3,'#b6aa8b',24);
 for(let x=-33;x<=0;x+=3.25){hudsonWindow(b,x,y+1.62,20.568,2.12,2.44,true,false);hudsonArch(b,x,y+2.26,20.60,1.14,.67,.12,'#d6c6a0',24,12);b.box(x-1.43,y+1.71,20.62,.24,3.42,.26,'#d3c3a0',24);}
 b.box(-16.8,y+3.35,19.9,36.4,.23,1.7,'#d2c4a4',24);b.box(-16.8,y+3.57,19.9,36.0,.16,1.85,copper,41);
 hudsonSign(b,'HUDSON TERMINAL',-16.8,y+3.03,20.66,8.6,.64);
}
function hudsonHeadHouseDetail(b){
 for(const side of[-1,1]){
  b.push(0,0,0,0,side*PI/2);
  for(const x of[-4,-1.35,1.35,4]){hudsonWindow(b,x,2.33,4.24,1.52,2.52,true);hudsonArch(b,x,3.07,4.34,.86,.70,.14,'#dcc5a2',24,12);b.box(x,3.86,4.36,.26,.39,.19,'#d6c4a2',24);}
  b.pop();
 }
 for(let x=-3.8;x<4;x+=.63)for(const z of[-6.3,6.3]){b.box(x,4.95,z,.15,.54,.16,'#d0bb95',24);}
 for(const z of[-6.3,6.3])b.box(0,5.26,z,8.45,.11,.26,'#d6c4a3',24);
 for(const side of[-1,1]){b.box(side*3.9,2.3,6.40,.35,4.3,.48,'#d4c19e',24);b.box(side*3.9,4.3,6.55,.67,.25,.63,'#dcc8a2',24);}
 b.box(0,3.39,6.89,7.6,.13,1.25,'#4c8078',41);
 for(let x=-3.3;x<=3.4;x+=1.1)b.beam([x,2.8,6.32],[x,3.33,7.34],.026,HUDSON_BRASS,41,4);
}
function hudsonFerryLanding(b){
 b.push(46.4,HUDSON.ground,33.3);
 b.box(0,-.06,0,9,.22,5.6,'#acac95',24);
 for(const x of[-3.7,0,3.7])for(const z of[-1.8,1.8])b.box(x,1.0,z,.12,2,.12,'#375d60',41);
 for(const x of[-3.7,0,3.7])for(let j=0;j<12;j++){
  const a=j*PI/12,q=(j+1)*PI/12;b.beam([x,2+Math.sin(a)*.95,Math.cos(a)*1.8],[x,2+Math.sin(q)*.95,Math.cos(q)*1.8],.04,'#497970',41,4);
 }
 for(let j=0;j<12;j++){
  const a=j*PI/12,q=(j+1)*PI/12;b.quad([-3.8,2+Math.sin(a)*.95,Math.cos(a)*1.8],[3.8,2+Math.sin(a)*.95,Math.cos(a)*1.8],[3.8,2+Math.sin(q)*.95,Math.cos(q)*1.8],[-3.8,2+Math.sin(q)*.95,Math.cos(q)*1.8],'#9bbba7',76);
 }
 hudsonSign(b,'FERRY LANDING',0,2.1,1.91,6.8,.55);b.box(2.8,.53,0,1,1.05,.9,'#4a6c6f',40);b.box(2.8,.88,.46,.65,.38,.02,'#94a7a1',43);b.pop();
}
function hudsonMarket(b){
 for(const [x,c]of[[-24,'#a87753'],[-19,'#507769'],[-14,'#a29963']]){
  b.push(x,HUDSON.ground,13);
  b.box(0,.47,0,3.1,.85,1.4,'#776752',22);b.box(0,.90,0,3.3,.08,1.54,'#b69d70',22);
  for(const side of[-1,1])b.box(side*1.43,1.21,-.50,.07,2.38,.07,'#526b62',41);
  b.box(0,2.35,0,3.3,.08,1.95,c,23);for(let i=0;i<11;i++)b.box(-1.50+i*.3,2.399,0,.13,.008,1.95,'#d9c6a3',23);
  b.box(0,2.19,1.0,3.3,.31,.04,c,23);
  for(let i=0;i<6;i++)for(let k=0;k<2;k++)b.sphere(-1.15+i*.46,1.06,k*.43-.16,.18,.15,.18,i%3===0?'#ad6345':i%3===1?'#cbac62':'#6d8e54',0,6,4);
  b.pop();
 }
}
function hudsonStationForecourt(scene,b){
 // Paving, planters and a cab rank join the station to the streets above it.
 b.box(-14,HUDSON.ground+.07,16.4,34,.14,3.25,'#b2ac96',24);
 for(let x=-30;x<3;x+=1.6)b.box(x,HUDSON.ground+.149,16.4,.021,.012,3.18,'#92988c',24);
 for(const x of[-28,-5,1]){b.box(x,.78,15.0,1.30,.68,1.2,'#778e83',24);b.sphere(x,1.21,15,.65,.57,.55,'#6e906b',8,8,5,true);}
 hudsonSign(b,'TAXI',-30.5,2.31,17.5,1.15,.44);b.beam([-30.5,.52,17.5],[-30.5,2.12,17.5],.025,HUDSON_INK,41,5);
 for(const [x,z]of[[-26,14.2],[-18,14.4],[-9,16.4]])scenePerson(scene,b,x,.57,z,'bag',.6,.8);
}

function hudsonMansard(b,x,z,w,d,h){
 b.push(x,HUDSON.ground,z);const lo=h+.54,hi=lo+3.08;
 for(let face=0;face<4;face++){
  b.push(0,0,0,0,face*PI/2);const ww=face%2?d:w,dd=face%2?w:d;
  b.quad([-ww/2,lo,dd/2],[ww/2,lo,dd/2],[ww*.35,hi,dd*.32],[-ww*.35,hi,dd*.32],'#557771',41);
  for(let q=-ww/2+.45;q<ww/2;q+=.70)hudsonWire(b,[q,lo,dd/2+.015],[q*.70,hi,dd*.32+.015],.014,'#85a095');
  if(face%2===0)for(const xx of[-w*.32,0,w*.32]){
   b.box(xx,lo+1.25,dd/2-.43,1.15,1.65,1.08,'#b7b59b',24);hudsonWindow(b,xx,lo+1.32,dd/2+.118,.76,1.09,xx===0);
   b.tri([xx-.71,lo+2.09,dd/2+.19],[xx+.71,lo+2.09,dd/2+.19],[xx,lo+2.68,dd/2+.19],'#91a293',41);
   b.beam([xx-.71,lo+2.08,dd/2+.21],[xx,lo+2.68,dd/2+.21],.038,HUDSON_STONE,24,4);b.beam([xx+.71,lo+2.08,dd/2+.21],[xx,lo+2.68,dd/2+.21],.038,HUDSON_STONE,24,4);
  }
  b.pop();
 }
 b.box(0,hi+.035,0,w*.71,.09,d*.65,'#748f80',41);
 for(const xx of[-w*.39,w*.39]){b.box(xx,lo+2.31,-.7,.68,2.9,.95,'#927d65',4);b.box(xx,lo+3.78,-.7,.83,.12,1.08,'#b7ab8c',24);for(const dz of[-.27,.27])b.cylinder(xx,lo+4.01,-.7+dz,.11,.12,.40,'#887857',24,8);}
 b.pop();
}
function hudsonRoofGarden(b,x,z,h){
 b.push(x,HUDSON.ground+h+.585,z);b.box(0,.04,.2,8.9,.08,8.1,'#697e69',3);
 for(let q=-3.6;q<4;q+=.26)b.box(q,.096,1.1,.19,.022,5.6,'#9c8e6a',22);
 for(const xx of[-3.65,0,3.65])for(const zz of[-.9,3.5])b.box(xx,1.01,zz,.12,2,.12,'#60786c',41);
 for(let xx=-3.8;xx<4;xx+=.48)b.box(xx,2.10,1.3,.105,.10,4.85,'#a7af8e',22);
 for(const z of[-1.05,3.65])b.box(0,2.04,z,8.1,.13,.12,'#547469',41);
 for(const xx of[-3.9,3.9])for(const zz of[-2.8,2.8]){
  b.box(xx,.23,zz,.83,.43,.83,'#787b63',24);b.sphere(xx,.71,zz,.45,.61,.43,'#758957',8,8,5,true);
 }
 for(const xx of[-2.4,2.4]){
  b.cylinder(xx,.60,1.3,.43,.43,.07,'#bdad87',24,12);b.cylinder(xx,.32,1.3,.055,.055,.55,'#49645f',41,6);
  for(const z of[.55,2.05]){b.box(xx,.35,z,.39,.075,.38,'#718784',23);b.box(xx,.58,z+(z<1?-.2:.2),.39,.50,.055,'#678077',23);}
 }
 for(const xx of[-3.45,-1.2,1.2,3.45]){b.sphere(xx,1.88,-.84,.055,.083,.055,'#e6c28d',6,6,4);}
 hudsonWire(b,[-3.65,1.96,-.84],[3.65,1.96,-.84],.01,'#40564f');b.pop();
}
function hudsonRoofLife(b){
 for(const [x,z,w,d,h]of[[-38,-10,7.6,8.6,12.2],[-9,-10,8.5,7.7,12.1],[-38,-33,9.8,5.9,13.4],[41,-10,7.2,8.2,10.8]]){
  b.push(x,HUDSON.ground+h+.57,z);
  b.box(-w*.23,.55,d*.12,w*.22,1.1,d*.31,'#859189',24);b.box(-w*.23,1.12,d*.12,w*.24,.08,d*.34,'#abb4a2',24);
  b.box(-w*.23,.52,d*.279,.53,.93,.031,'#405b5c',40);b.box(-w*.20,.54,d*.3,.04,.12,.025,HUDSON_BRASS,41);
  for(let i=0;i<3;i++){
   const xx=w*.23-i*.57;b.cylinder(xx,.41,-d*.15,.10,.10,.82,'#9aada9',41,8);b.cylinder(xx,.82,-d*.15,.17,.13,.08,'#b1bca9',41,8);
  }
  b.box(w*.29,.32,-d*.29,.84,.64,1.23,'#929f94',41);
  for(const zz of[-d*.29-.31,-d*.29+.31]){b.cylinder(w*.29,.65,zz,.22,.22,.026,'#40575f',42,12);for(let k=0;k<5;k++){const a=k*TAU/5;b.beam([w*.29,.67,zz],[w*.29+.20*Math.cos(a),.67,zz+.20*Math.sin(a)],.012,'#92a49e',41,4);}}
  b.pop();
 }
 // Laundry above the bookshop and a roof hatch above the coffee bar.
 b.push(-23,HUDSON.ground+8.09,4.5);
 for(const x of[-1.8,1.8])b.beam([x,0,.5],[x,1.32,.5],.021,'#718a7b',41,5);
 hudsonWire(b,[-1.8,1.29,.5],[1.8,1.29,.5],.009,'#5a6f63');
 for(let i=0;i<4;i++){const x=-1.40+i*.70;b.quad([x,1.25,.505],[x+.53,1.24,.5],[x+.49,.47+i%2*.20,.58],[x-.025,.44+i%2*.2,.57],i%2?'#7f9a9b':'#d5c8a8',23);}
 b.pop();
 b.push(-11.8,HUDSON.ground+8.79,4.5);b.box(-.9,.30,-.6,1.4,.6,1.2,'#647b75',41);b.box(-.9,.625,-.6,1.5,.07,1.3,'#9eafa0',41);b.box(-.9,.68,-.3,.52,.06,.09,HUDSON_BRASS,41);b.pop();
}
function hudsonStreetFurniture(b){
 for(const [x,z]of[[-27.5,-.6],[11.8,-.7],[38,-14.5],[-7.5,13.7]]){
  b.cylinder(x,.74,z,.095,.09,.65,'#9c674b',40,8);b.sphere(x,1.05,z,.13,.11,.13,'#c49a68',41,8,5);
  b.beam([x-.19,.85,z],[x+.19,.85,z],.07,'#a17552',40,6);b.cylinder(x,1.14,z,.05,.05,.1,'#aaa18a',41,6);
 }
 for(const [x,z]of[[-25,9.1],[-11,9.1],[18.5,2.1]]){
  b.push(x,HUDSON.ground+.15,z);
  // Two wheel rings and a real triangular bicycle frame, parked beside the cafe.
  for(const xx of[-.40,.40])ringZ(b,xx,.30,0,.23,.26,.034,'#3c5255',41,14);
  for(const [a,q]of[[[-.40,.30,0],[-.07,.30,0]],[[-.07,.30,0],[-.24,.70,0]],[[-.24,.70,0],[-.40,.30,0]],[[-.24,.70,0],[.25,.67,0]],[[.25,.67,0],[-.07,.30,0]],[[.25,.67,0],[.40,.30,0]]])b.beam(a,q,.021,'#a77650',40,4);
  b.box(-.23,.74,0,.21,.043,.16,'#3c504a',42);b.box(.22,.82,0,.06,.04,.32,'#879b91',41);b.beam([.25,.67,0],[.22,.82,0],.018,'#9ba899',41,4);b.pop();
 }
 // A slim glass bus shelter sits wholly on the eastern pavement.
 b.push(38.2,HUDSON.ground,15);
 b.box(0,1.2,0,3.9,2.4,.06,'#97b6a4',76);for(const xx of[-1.85,1.85])b.box(xx,1.24,0,.07,2.48,.10,'#57796e',41);
 b.box(0,2.5,.6,4.2,.10,1.65,'#53776d',41);b.box(0,2.43,.73,3.9,.025,1.3,'#cbccac',6);bench(b,0,.01,.48);
 b.box(-1.55,1.05,.07,.48,1.38,.06,'#d2c4a0',24);for(let i=0;i<7;i++)b.box(-1.55,1.53-i*.13,.11,.33,.023,.008,'#637e76',41);
 hudsonSign(b,'RIVERSIDE',0,2.05,.095,2.35,.38);b.pop();
 for(const [x,z]of[[-3,14],[8,14],[-44,29.4]]){
  b.box(x,HUDSON.ground+.62,z,.39,1.12,.45,'#35585a',41);b.box(x,HUDSON.ground+1.03,z+.24,.29,.22,.018,'#112c33',42);
  for(let i=0;i<5;i++)b.box(x,HUDSON.ground+.29+i*.13,z+.24,.29,.018,.014,'#7e9688',41);
 }
}

function hudsonCity(scene,b){
 hudsonStreet(b,0,-3,88,3.5);hudsonStreet(b,0,-17,84,3.4);hudsonStreet(b,15,-1,3.6,38);
 hudsonStreet(b,-30,-3,3.2,35);hudsonStreet(b,35,0,3.1,35);hudsonStreet(b,0,-38.1,93,2.7);
 for(const x of[-30,15,35])for(const z of[-17,-3]){hudsonCrosswalk(b,x-2.5,z);hudsonCrosswalk(b,x,z+2.5,PI/2);hudsonTrafficLight(b,x+2.45,z+2.45,x!==15);}
 const blocks=[
  [-38,-10,7.6,8.6,12.2,'#96715b',{shop:'BOND CO',tank:true}],[-38,3,7.6,7.4,8.7,'#ad856c',{shop:'MARKET',awning:'#567772',escape:true}],
  [-22,-10,9,7.7,17.7,'#ac9270',{shop:'ATLAS HOTEL',roof:'setback'}],[-9,-10,8.5,7.7,12.1,'#887760',{shop:'RECORDS',escape:true,tank:true}],
  [-21,-21,10.6,4.0,9.2,'#796758',{tank:true}],[-6,-21,10.4,4.0,17.1,'#a5987f',{}],
  [26,-21,10.0,4.0,14.7,'#52777b',{glass:true}],[26,-10,10.1,7.6,27.7,'#466d78',{glass:true,roof:'glass'}],
  [41,-10,7.2,8.2,10.8,'#ab9470',{tank:true}],[41,3,6.9,7.5,8.4,'#b39577',{shop:'ROAST',awning:'#4f7477'}],
  [25,4.8,10.4,10.0,9.6,'#947860',{shop:'PALACE',awning:'#9a5d43',escape:true}],
  [-23,4.5,4.8,7,7.5,'#a57053',{shop:'BOOKS',awning:'#466b5d',escape:true,brownstone:true}],[-17.4,4.5,4.8,7,9.0,'#b29a75',{shop:'FLORIST',awning:'#858955',tank:true,brownstone:true}],[-11.8,4.5,4.8,7,8.2,'#875f4d',{shop:'COFFEE',awning:'#527f80',escape:true,brownstone:true}],
  [-38,-33.0,9.8,5.9,13.4,'#8a755e',{tank:true}],[-25,-33.0,10.1,5.9,22.3,'#987f68',{roof:'setback'}],
  [-11,-33.0,10.8,5.9,27.2,'#526873',{glass:true,roof:'glass'}], [4,-33.0,11.2,5.9,19.7,'#a89f89',{roof:'mansard'}],
  [20,-33.0,12.0,5.9,21.5,'#866b59',{roof:'setback'}],[36,-33.0,10.1,5.9,15.6,'#748b88',{glass:true}]
 ];
 for(const a of blocks)hudsonBuilding(b,...a);
 // Each district earns a distinct skyline rather than repeating flat boxes.
 for(const [x,z,w,d,h]of[[-22,-10,9,7.7,17.7],[-25,-33,10.1,5.9,22.3],[20,-33,12,5.9,21.5]])hudsonSetbackCrown(b,x,z,w,d,h);
 hudsonGlassCrown(b,26,-10,27.7);hudsonGlassCrown(b,-11,-33,27.2);
 hudsonMansard(b,4,-33,11.2,5.9,19.7);hudsonRoofGarden(b,25,4.8,9.6);hudsonRoofLife(b);
 for(const [x,h]of[[-23,7.5],[-17.4,9],[-11.8,8.2]])hudsonBrownstone(b,x,4.5,h);
 hudsonDecoTower(b,5,-9.6);hudsonPark(scene,b);hudsonMarket(b);hudsonStationForecourt(scene,b);hudsonStreetFurniture(b);
 b.box(19.64,6.2,8.2,.4,7.8,1.13,'#306069',40);
 for(let i=0;i<6;i++)hudsonText(b,'PALACE'[i],19.64,9.22-i*1.03,8.79,.34,'#f2c57c',6);
 b.box(25,2.01,10.26,10.1,.55,1.45,'#b59163',41);
 for(let i=0;i<26;i++)b.sphere(20.3+i*.37,1.91,11.02,.036,.036,.036,'#eabc7c',6,6,4);
 for(const x of[-25,-19,-12,22,29]){
  b.cylinder(x,.92,10.35,.42,.42,.06,'#bc9b6b',22,10);b.cylinder(x,.66,10.35,.032,.045,.52,'#465d61',41,5);
  for(const side of[-1,1]){b.box(x+side*.62,.66,10.35,.34,.055,.34,'#768c72',22);b.box(x+side*.62,.87,10.19,.34,.44,.047,'#627f66',22);}
  if(x<0){b.cylinder(x,1.95,10.35,.95,.02,.40,x===-19?'#b57453':'#d0c09c',23,10);b.beam([x,.99,10.35],[x,2.1,10.35],.020,'#8e8d74',41,5);}
 }
 for(const [x,z,a,t,c]of[[-26,-3.9,PI/2,true],[-6,-2.2,-PI/2,false,'#799394'],[20,-3.9,PI/2,true],[15.85,3,0,false,'#a74b3f'],[14.2,-13,PI,true],[-30.8,-8,0,false,'#b2b19d'],[35.8,9,0,true],[7,-17.7,PI/2,false,'#78909b'],[-15,-16.2,-PI/2,false,'#805a54'],[39,-3.8,PI/2,true],[-36,-38.6,PI/2,true],[22,-37.5,-PI/2,false,'#52736e']])hudsonCar(b,x,z,a,t,c);
 hudsonDeliveryVan(b,-29.3,7.6,PI);hudsonDeliveryVan(b,34.2,-10,0);
 for(let x=-39;x<45;x+=8.6){hudsonLamp(b,x,-.43);hudsonLamp(b,x,-14.7);}
 for(const z of[-13,-6,4,11]){hudsonLamp(b,17.6,z);b.box(18.3,.91,z,.44,1.0,.45,'#476761',41);}
 for(let i=0;i<18;i++){const x=-38+(i%9)*9.1,z=i<9?-.64:-14.53;scenePerson(scene,b,x,HUDSON.ground+.17,z,i%4?'walk':'bag',i%2?1.2:-1,.78);}
 for(const [x,z]of[[-27,2],[-7,3],[11,14],[31,12],[40,12],[-44,-36],[44,-35]])hudsonTree(b,x,HUDSON.ground,z,3.2);
 // Live miniature walkers reuse the house's cached figures and motion clock.
 for(const [i,a,q]of[[0,[-26,.56,-.64],[-6,.56,-.64]],[1,[18.6,.56,-13],[18.6,.56,8]],[2,[-15,.66,29.45],[9,.66,29.45]],[3,[-26,3.10,22.32],[-4,3.10,22.32]]]){
  scene.actors.push({a,b:q,speed:.06,offset:i*.19,variant:i+2,scale:.80});scene.population++;
 }
}

function hudsonShell(b){
 const walls=[],paint='#aaa994',brick='#696b60',iron='#304f56';
 b.box(0,FLOOR-.26,0,158,.52,130,'#686f68',24);
 for(let x=-76;x<78;x+=8)for(let z=-62;z<64;z+=8)b.box(x,FLOOR+.015,z,7.93,.025,7.93,(Math.round((x+76)/8)+Math.round((z+62)/8))%2?'#858e81':'#9b9e8d',24);
 for(const which of['back','left','right','front']){
  const w=new Builder(),back=which==='back',front=which==='front',width=back||front?156:128,pos=back?[0,0,-64]:front?[0,0,64]:which==='left'?[-78,0,0]:[78,0,0],angle=back?0:front?PI:which==='left'?PI/2:-PI/2;
  w.push(...pos,0,angle);w.box(0,10,0,width,68,.7,brick,4);w.box(0,-18.2,.40,width,11,.40,iron,40);
  for(const y of[-23.3,-12.6,42.2])w.box(0,y,.80,width,.58,1.1,paint,24);
  const n=back?5:front?4:4;
  for(let i=0;i<n;i++){
   const x=(i-(n-1)/2)*(width-10)/n,ww=(width-10)/n-4;
   if(front&&Math.abs(x)<20)continue;
   // City-window glass is original geometry with visible steel mullions.
   w.box(x,11.8,.41,ww,43,.04,'#4c6f7a',43);w.box(x,11.8,.48,ww-.8,42.4,.025,'#597c85',43);
   w.box(x,36.8,.46,ww,3.6,.08,'#77958b',43);for(let k=0;k<5;k++)w.box(x-ww*.4+k*ww*.2,36.8,.76,.14,3.7,.18,'#829991',41);
   for(let k=0;k<=4;k++)w.box(x-ww/2+k*ww/4,11.8,.79,.16,43.1,.20,'#a6ac9d',41);
   for(const y of[-9.7,-2,6,14,22,30,33.3,34.7,38.8])w.box(x,y,.79,ww,.18,.20,'#acb0a1',41);
   hudsonArch(w,x,28.7,.93,ww/2,4.6,.25,'#92a79a',41,18);
   w.box(x,-10.2,1.20,ww+1,.64,2.0,paint,24);
  }
  for(let x=-width/2+2;x<=width/2-1;x+=25){w.box(x,10,1,1.1,66,1.25,iron,41);w.box(x,41.2,1.4,2.0,.9,2.0,HUDSON_BRASS,41);
   for(const yy of[-10,14,39]){w.box(x,yy,1.72,1.8,.76,.15,'#657d71',41);for(const dx of[-.54,.54])for(const dy of[-.19,.19])w.sphere(x+dx,yy+dy,1.83,.06,.06,.045,HUDSON_BRASS,41,6,4);}}
  if(back){const key='house-'+Object.keys(HOUSE_ROOMS).indexOf('hudson');if(roomLabels[key])roomFrame(w,key,0,-17.5,.91,43,7.4);}
  if(front){w.box(0,-5,1,19,37,1,iron,40);for(const s of[-1,1]){w.box(s*4.6,-4,1.57,8.4,34,.11,'#a8b9af',43);w.box(s*1.1,-5,1.81,.12,3.0,.12,HUDSON_BRASS,41);}hudsonSign(w,'HUDSON TERMINAL',0,17,1.51,29,4);}
  w.pop();walls.push({which,mesh:w.mesh()});
 }
 for(const z of[-55]){
  b.box(0,42.6,z,154,.95,.40,iron,41);b.box(0,43.2,z,156,.15,1.3,HUDSON_BRASS,41);
  b.box(0,39.8,z,154,.18,.65,iron,41);for(let x=-72;x<72;x+=12){b.beam([x,39.8,z],[x+6,42.6,z],.07,'#617e77',41,4);b.beam([x+6,42.6,z],[x+12,39.8,z],.07,'#617e77',41,4);}
  for(const s of[-1,1])b.beam([s*77,33,z],[s*62,42,z],.42,iron,41,4);
 }
 for(const x of[-63,63])for(const z of[-44,44]){
  b.beam([x,43,z],[x,25.5,z],.065,'#4a5554',41,6);b.cylinder(x,25.0,z,3.1,1.35,1.24,iron,41,18);b.cylinder(x,24.365,z,2.78,2.78,.045,'#e8d4a0',25,18);
 }
 // A viewing bench and two small railway cabinets keep this recognisably a room.
 for(const x of[-65,65]){b.box(x,FLOOR+1.9,0,6.6,3.8,38,iron,40);b.box(x,FLOOR+4.0,0,7.2,.3,39,'#a1845e',22);for(let z=-15;z<16;z+=6)b.box(x,FLOOR+4.24,z,5.8,.26,4.8,'#8b9e8a',23);}
 return walls;
}
function hudsonRoom(scene,b){
 modelTable(b,0,0,HUDSON.width,HUDSON.depth,-.7,'#9b9c82');
 b.box(0,.05,-11.6,116,.66,57.2,'#919b91',24);
 b.box(-21,.05,23.15,74,.66,12.3,'#9aa191',24);b.box(49,.05,23.15,18,.66,12.3,'#9aa191',24);
 const outer=hudsonRoute('Hudson electric main'),inner=hudsonRoute('Hudson return line',2.4);
 hudsonCity(scene,b);hudsonWaterfront(scene,b);hudsonViaduct(b,outer,inner);hudsonRails(b,outer);hudsonRails(b,inner);hudsonTerminal(scene,b);
 for(const x of[-53,53]){b.box(x,.85,-22,5,1.0,8,'#829286',3);roomTree(b,x,1.35,-22,4.1);roomTree(b,x+1.0,1.35,-25.2,3.3);}
 // A destination board fixed to the table edge and a miniature builders plate.
 b.push(0,-.64,41.27);hudsonSign(b,'HUDSON TERMINAL',0,0,0,31,1.22);hudsonText(b,'BY NICKFROMLATER',0,-.98,.04,15,'#d9c59d');b.pop();
 scene.routes=[outer,inner];scene.trains=[{edge:outer,distance:64,speed:2.20,type:'mountain',stock:'collection:acela',cars:6,collectionChoice:HOUSE_ROOMS.hudson.defaultCollection}];
 scene.height=(x,z)=>Math.abs(x)<=59&&Math.abs(z)<=41?((z>29.4||(x>16&&x<40&&z>17))?HUDSON.water:HUDSON.ground):FLOOR;
 scene.canPlace=()=>false;
 scene.spots=[
  {name:'Hudson, in miniature',target:[0,8.5,-2],distance:142,phoneDistance:251,pitch:.53,yaw:.33,detail:'A grand terminal, brownstone streets, copper crowns and the silver Acela. A whole Northeast city on a brass-edged model table.'},
  {name:'The Acela platforms',target:[-16,4.8,24.7],distance:42,phoneDistance:81,pitch:.32,yaw:.57,detail:'Six passenger cars between two tapered electric power cars. Watch the bogies turn beneath the copper ribs of the train shed.'},
  {name:'Hudson Exchange',target:[4,20,-9],distance:62,phoneDistance:106,pitch:.31,yaw:.49,detail:'Limestone setbacks, a copper crown, rooftop water tanks and hundreds of individually placed windows.'},
  {name:'Brownstone mornings',target:[-18,4.25,6.8],distance:19,phoneDistance:23,pitch:.19,yaw:1.10,detail:'Fire escapes, striped shop awnings, pavement tables, flowers and a small record shop just across the avenue.'},
  {name:'Riverside departures',target:[30,3.8,27],distance:46,phoneDistance:82,pitch:.32,yaw:.45,detail:'An electrified viaduct, a waiting ferry, sailing dinghies and a promenade for watching the express pass.'},
  {name:'The clock tower',target:[-39,7,14],distance:34,phoneDistance:60,pitch:.36,yaw:-.64,detail:'Four clock faces above the headhouse, station stairs and a departure board below.'},
  {name:'The river bowstring',target:[28,4.3,25.8],distance:33,phoneDistance:65,pitch:.20,yaw:.46,detail:'A riveted steel bowstring carries the silver express across the tidal basin. Look through its open trusses to the ferry and the city.'},
  {name:'The northern skyline',target:[-7,16,-27],distance:78,phoneDistance:138,pitch:.37,yaw:.48,detail:'Water towers, terraced hotels, roof gardens and the brass fins of the Exchange form a deliberately layered skyline.'},
  {name:'A pocket of green',target:[4,2,9],distance:24,phoneDistance:43,pitch:.52,yaw:.15,detail:'The fountain, little reading benches and a few pigeons. A quieter square between the tower and the terminal.'}
 ];
 scene.hudson={buildings:22,passengerCars:6,railHeight:HUDSON.rail,revision:2,bridge:{x:[16,40],z:[23.15,28.45]},waterBasin:{x:[16,40],z:[17,29.6]}};
}
registerHouseRoom('hudson',{
 name:'Hudson Terminal',layout:'The Northeast City Room',tag:'THE CITY NEVER QUITE STOPS',
 description:'A silver Acela slips beneath a glass-vaulted terminal and over a riveted river bridge. Copper-crowned towers, brownstone terraces, a bustling market and a ferry beneath the skyline.',
 color:'#91a9aa',ambient:'town',target:[0,8.5,-2],distance:148,phoneDistance:267,pitch:.54,yaw:.33,
 train:{name:'Acela',number:'2009',service:'Hudson express',type:'electric trainset'},
 defaultCollection:{id:'acela',livery:0,cars:6},
 credits:[{name:'nickfromlater',platform:'github',handle:'nickfromlater',note:'Original Hudson Terminal city room and Acela-inspired miniature; built with agent assistance.'}],
 map:{plot:'east-4',scale:.40,footprint:[158,130],focus:[0,8.5,-2]},
 lights:[[-63,24.36,-44],[63,24.36,-44],[-63,24.36,44],[63,24.36,44]],
 layoutLights:[[-26,5.53,20.95],[-40,9.43,20.18],[19.64,7.42,8.78],[4,1.97,9],[28,2.9,29],[5,24,-9.6],[-10,3,-.43],[24,3,-14.7]],
 build:hudsonRoom,shell:hudsonShell
});
