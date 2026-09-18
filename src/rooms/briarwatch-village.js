'use strict';

// Eight individually placed buildings around the lower lane. The common joinery
// vocabulary is shared; footprints, additions, roofs and working yards are not.
const BRIAR_BUILDINGS=[
 {name:'The Copper Hart',x:43.3,z:16.8,w:6.4,d:7.6,h:5.7,roof:3.1,angle:.07,plaster:'#c7bda3',slate:'#6c6055',kind:'inn'},
 {name:'The smithy',x:55.2,z:22.0,w:5.9,d:5.5,h:3.5,roof:2.1,angle:-.10,plaster:'#939e89',slate:'#445e60',kind:'smith'},
 {name:'The bakehouse',x:54,z:8.1,w:5.6,d:6.3,h:4.7,roof:2.8,angle:.13,plaster:'#c9ba92',slate:'#8c7057',kind:'baker'},
 {name:'The mill',x:26,z:-4,w:5.0,d:6.0,h:5.8,roof:2.7,angle:0,plaster:'#afa58d',slate:'#53696e',kind:'mill'},
 {name:'Weavers Cottage',x:42.2,z:3.2,w:4.7,d:5.2,h:5.0,roof:3.1,angle:-.14,plaster:'#a8b49c',slate:'#4b656f',kind:'weaver'},
 {name:'The farrier house',x:57.8,z:-3.0,w:4.8,d:6.0,h:4.2,roof:2.8,angle:.20,plaster:'#c1b89c',slate:'#687464',kind:'house'},
 {name:'The orchard house',x:48,z:-6.8,w:5.6,d:5.1,h:4.3,roof:2.9,angle:-.11,plaster:'#9aaf97',slate:'#876e56',kind:'garden'},
 {name:'The ferryman house',x:34.8,z:17.7,w:4.1,d:4.6,h:3.8,roof:2.6,angle:-.26,plaster:'#bfb69b',slate:'#506b6b',kind:'cottage'}
];
function briarBarrel(b,x,y,z,s=1){
 b.push(x,y,z,0,0,0,s,s,s);b.cylinder(0,.34,0,.29,.33,.68,'#9b8055',22,10);b.cylinder(0,.68,0,.31,.31,.035,'#ad9061',22,10);
 for(const yy of[.12,.56])b.cylinder(0,yy,0,.336,.336,.045,'#64634c',42,10);b.pop();
}
function briarCrate(b,x,y,z,w=.65,h=.55,d=.65){
 b.box(x,y+h/2,z,w,h,d,'#967e57',22);
 for(const zz of[-d/2-.015,d/2+.015]){
  for(const xx of[-w*.38,w*.38])b.box(x+xx,y+h/2,z+zz,.07,h,.06,'#ba9b67',22);
  b.beam([x-w*.38,y+.09,z+zz],[x+w*.38,y+h-.09,z+zz],.031,'#bea16c',22,4);
 }
}
function briarCart(b,x,y,z,angle=0){
 b.push(x,y,z,0,angle);
 for(let i=0;i<5;i++)b.box(-.48+i*.24,.56,0,.22,.09,1.65,'#9c8054',22);
 for(const s of[-1,1]){
  for(const yy of[.76,1.0,1.24])b.box(s*.62,yy,0,.08,.18,1.78,'#aa8b5a',22);
  b.beam([s*.53,.46,-.5],[s*.53,.63,2.5],.045,'#806849',22,6);
  b.push(s*.78,.47,-.18,0,PI/2);ringZ(b,0,0,0,.39,.49,.11,'#625e48',42,18);
  for(let i=0;i<10;i++){const a=i*TAU/10;b.beam([0,0,0],[Math.cos(a)*.43,Math.sin(a)*.43,0],.020,'#b08b54',22,5);}
  b.cylinder(0,0,0,.09,.09,.20,'#b69560',22,10,PI/2);b.pop();
 }
 briarCrate(b,-.15,.64,0,.72,.55,.76);b.pop();
}
function briarHouseWindow(b,x,y,z,w=.70,h=1.15,shutters=true){
 b.push(x,y,z);
 b.box(0,h/2,-.11,w+.18,h+.17,.19,'#4d554b',22);b.box(0,h/2,0,w,h,.035,'#8fa196',6);
 for(const xx of[-w/2,0,w/2])b.box(xx,h/2,.06,.048,h+.08,.065,'#d1bf95',22);
 b.box(0,h*.56,.06,w,.045,.065,'#d1bf95',22);b.box(0,-.04,.14,w+.34,.12,.36,'#ac9770',22);
 if(shutters)for(const s of[-1,1]){
  b.push(s*(w/2+.19),0,.045,0,s*.28);b.box(0,h/2,0,.30,h,.065,'#627264',22);
  for(const yy of[.20,h-.20])b.box(0,yy,.04,.33,.06,.035,'#af9d72',22);b.pop();
 }
 b.pop();
}
function briarTimberHouse(b,q){
 const floor=Math.max(...[-q.w*.45,0,q.w*.45].flatMap(dx=>[-q.d*.45,0,q.d*.45].map(dz=>briarSurface(q.x+dx,q.z+dz))))+.13;
 q.floor=floor;b.push(q.x,floor,q.z,0,q.angle);
 const {w,d,h}=q,jetty=q.kind==='inn'||q.kind==='weaver';
 // A deep stone base reaches the sampled ground, including the mill's cellar.
 const ground=Math.min(...[-w/2,w/2].flatMap(dx=>[-d/2,d/2].map(dz=>briarSurface(q.x+dx,q.z+dz))))-.25;
 b.box(0,(ground-floor)/2,0,w+.25,Math.max(.26,floor-ground),d+.25,'#929681',4);
 if(q.kind==='smith'){
  // Open-front forge building, not an exterior pretending to contain a room.
  b.box(0,h/2,-d/2,w,h,.45,q.plaster,4);
  for(const s of[-1,1])b.box(s*w/2,h/2,0,.45,h,d,q.plaster,4);
  b.box(0,.02,0,w,.06,d,'#8f8770',9);
  for(const xx of[-2.0,2.0])b.box(xx,h/2,d/2,.20,h,.22,'#7c6545',22);
 }else{
  const lower=q.kind==='mill'?'#969d8a':'#ada98e';
  b.box(0,1.2,-d/2,w,2.4,.34,lower,4);for(const side of[-1,1])b.box(side*w/2,1.2,0,.34,2.4,d,lower,4);
  b.push(0,0,d/2);briarArchWall(b,w,2.4,.34,1.16,1.53,lower,.11);b.pop();b.box(0,.02,0,w-.3,.08,d-.3,'#85765a',22);
  if(h>2.4)b.box(0,(h+2.4)/2,0,w+(jetty?.35:0),h-2.4,d+(jetty?.35:0),q.plaster,23);
  for(const side of[-1,1]){
   for(const xx of[-w/2+.12,0,w/2-.12])b.box(xx,h*.69,side*(d/2+.18),.12,h*.62,.13,'#706044',22);
   for(const yy of[2.4,h-.1])b.box(0,yy,side*(d/2+.18),w+.45,.17,.16,'#806a46',22);
   for(const xx of[-w/2+.22,w/2-.22])b.beam([xx,2.55,side*(d/2+.20)],[xx*.40,h-.23,side*(d/2+.20)],.065,'#826b47',22,4);
   for(const xx of[-w*.27,w*.27])briarHouseWindow(b,xx,h>4.5?3.05:2.65,side*(d/2+.24),q.kind==='inn'?.83:.67,Math.min(1.34,h-2.9),true);
  }
  for(const s of[-1,1]){
   b.push(s*(w/2+.11),0,0,0,s*PI/2);
   for(const zz of[-d*.24,d*.24]){b.box(zz,h*.67,.1,.14,h*.66,.13,'#7b6547',22);briarHouseWindow(b,zz,1.0,.19,.65,1.05,false);}
   for(const yy of[.18,2.4,h-.09])b.box(0,yy,.13,d+.25,.16,.14,'#8e7550',22);b.pop();
  }
  // A inset door has a stone step, iron latch and visible plank construction.
  b.box(0,1.0,d/2+.04,1.15,2.0,.13,'#4f5547',22);
  for(let i=0;i<6;i++)b.box(-.45+i*.18,.98,d/2+.125,.167,1.86,.05,'#7d6a49',22);
  for(const yy of[.43,1.4])b.box(0,yy,d/2+.165,.94,.08,.06,'#414b3f',42);
  b.box(0,.06,d/2+.44,1.6,.18,.78,'#b5aa8c',4);b.sphere(.32,.96,d/2+.21,.048,.048,.025,'#b29c67',41,6,4);
 }
 // Gable infill and exposed trusses, separate from the roof's actual thickness.
 for(const s of[-1,1]){
  b.tri([-w/2,h,s*d/2],[w/2,h,s*d/2],[0,h+q.roof-.10,s*d/2],q.plaster,23);
  b.beam([-w/2,h,s*(d/2+.05)],[0,h+q.roof-.10,s*(d/2+.05)],.09,'#7c6547',22,4);b.beam([0,h+q.roof-.10,s*(d/2+.05)],[w/2,h,s*(d/2+.05)],.09,'#7c6547',22,4);
  b.box(0,h+q.roof*.46,s*(d/2+.08),.12,q.roof*.89,.14,'#8c7350',22);
 }
 briarRoof(b,w+.9,d+.9,h,q.roof,q.slate,false);
 const chimneyX=-w*.25,chimneyZ=q.kind==='baker'?-d*.27:d*.12;
 b.box(chimneyX,h+q.roof*.65,chimneyZ,.73,q.roof+1.4,.82,'#a89371',4);b.box(chimneyX,h+q.roof*1.15+.75,chimneyZ,1.0,.18,1.05,'#c1ad86',4);
 b.cylinder(chimneyX,h+q.roof*1.15+1.06,chimneyZ,.18,.20,.45,'#7c7460',4,8);
 if(q.kind==='inn'){
  // A cross-gabled upper room, a narrow covered porch and its own sign.
  b.push(-w*.23,h-.9,d/2-.05);b.box(0,.60,0,2.1,1.2,2.0,q.plaster,23);briarHouseWindow(b,0,.18,1.03,.72,.92,false);briarRoof(b,2.6,2.6,1.2,1.7,q.slate);b.pop();
  for(const xx of[-w*.39,w*.39])b.box(xx,1.40,d/2+1.6,.15,2.8,.15,'#8b714a',22);
  b.box(0,2.77,d/2+1.02,w+.12,.13,2.2,'#806d4f',22);
  b.beam([w/2,3.4,d/2],[w/2+1.5,3.4,d/2],.055,'#574f3b',42,6);b.box(w/2+1.20,2.96,d/2,.75,.72,.12,'#6e7556',22);
  b.cylinder(w/2+1.20,2.99,d/2+.085,.22,.22,.03,'#c3a36c',41,12,PI/2);
  for(const xx of[-2.0,1.9]){b.box(xx,.70,d/2+1.3,1.15,.12,.44,'#96774d',22);for(const dx of[-.42,.42])b.box(xx+dx,.33,d/2+1.3,.09,.65,.29,'#79603f',22);}
 }
 if(q.kind==='smith'){
  b.box(-1.1,.75,-1.35,2.25,1.5,1.50,'#8b8873',4);b.box(-1.1,1.49,-1.22,1.2,.06,.65,'#c18650',10);
  b.box(-1.1,2.1,-1.60,1.95,.30,1.35,'#5f6456',42);b.box(-1.1,3.2,-1.90,.86,2.3,.80,'#969078',4);
  b.box(1.05,.52,.48,.85,1.04,.75,'#837048',22);b.box(1.05,1.10,.48,1.03,.22,.44,'#5b6158',42);b.tri([1.5,1.21,.26],[2.0,1.14,.48],[1.5,1.21,.70],'#83897a',41);
  for(let i=0;i<6;i++)b.beam([1.5+i*.12,.1,-1.9],[1.8+i*.10,2.1,-2.25],.025,'#70766a',42,6);
  for(const xx of[-2.8,2.8])b.box(xx,1.28,d/2+2.0,.16,2.56,.16,'#806949',22);
  b.box(0,2.65,d/2+1.1,6.3,.16,2.6,'#6b796e',22);briarBarrel(b,2.20,0,1.32,.95);
 }
 if(q.kind==='baker'){
  b.push(w/2+.78,0,-1.2);b.box(0,.65,0,2.25,1.3,2.4,'#ac9573',4);b.sphere(0,1.2,0,1.18,1.12,1.20,'#ae997a',4,12,7,true);
  b.push(0,.35,1.15);briarArchWall(b,1.62,1.4,.35,.86,.55,'#b9a584',.12);b.pop();
  b.box(0,.76,1.09,.77,.83,.05,'#4f5041',42);b.box(0,2.32,-.3,.48,1.24,.5,'#a99474',4);b.pop();
  b.box(-1.7,.85,d/2+1.2,2.2,.13,.82,'#a68a59',22);for(let i=0;i<5;i++)b.sphere(-2.45+i*.37,.99,d/2+1.2,.21,.11,.15,'#c2a263',23,8,4);
 }
 if(q.kind==='weaver'){
  for(let i=0;i<5;i++)b.box(w/2+.8,.42+i*.03,-1+i*.52,1.2,.11,.47,['#9b6856','#acaa81','#7b947f'][i%3],23);
  b.beam([w/2+.2,2.6,-2],[w/2+1.8,2.6,1.2],.015,'#a79469',23,5);
 }
 briarHouseDetails(b,q);b.pop();return floor;
}
function briarMillWheel(b){
 const r=2.24;
 for(const z of[-.49,.49]){
  ringZ(b,0,0,z,r-.18,r+.16,.16,'#816b48',22,32);ringZ(b,0,0,z*1.18,r+.15,r+.19,.035,'#62624b',42,32);
  for(let i=0;i<10;i++){const a=i*TAU/10;b.beam([Math.cos(a)*.22,Math.sin(a)*.22,z],[Math.cos(a)*r,Math.sin(a)*r,z],.075,'#a18452',22,5);}
 }
 for(let i=0;i<28;i++){
  const a=i*TAU/28;b.push(Math.cos(a)*r,Math.sin(a)*r,0,0,0,a);b.box(0,0,0,.47,.10,1.2,i%4?'#927748':'#a48a54',22);b.pop();
 }
 b.cylinder(0,0,0,.28,.28,1.65,'#8c7047',22,14,PI/2);b.cylinder(0,0,.86,.15,.15,.17,'#575d4e',42,12,PI/2);
}
function briarMill(scene,b){
 b.push(12,0,0);const millSurface=(x,z)=>briarSurface(x+12,z);
 // The leat is a low, stone-lined branch of the river, not water painted uphill.
 const x=10.5,z=-4,water=BRIAR.water+.02;
 for(const side of[-1,1]){
  const wallX=x+side*.93,foot=Math.min(...Array.from({length:17},(_,i)=>millSurface(wallX,z-4.05+i*8.1/16)))-.15;
  b.box(wallX,(foot+.36)/2,z,.25,.36-foot,8.1,'#999c86',4);
  b.box(x+side*.93,.43,z,.36,.15,8.25,'#bab194',4);
 }
 b.quad([x-.8,water,-8.1],[x+.8,water,-8.1],[x+.8,water,.1],[x-.8,water,.1],'#476c61',7);
 // Trestle bearings visibly carry the axle above the channel.
 for(const xx of[9.65,11.4]){const foot=Math.min(millSurface(xx,z-.45),millSurface(xx,z+.45))-.15;b.box(xx,(foot+.34)/2,z,.5,.34-foot,.9,'#888e79',4);b.box(xx,.46,z,.68,.25,1.1,'#a9a58c',4);}
 b.beam([9.5,-.67,z],[12.2,-.67,z],.14,'#6e5d40',22,9);
 const wheel=new Builder();briarMillWheel(wheel);
 scene.movingParts=[{mesh:wheel.mesh(),model:current=>mm(trans(x+12,-.67,z),mm(ry(PI/2),rz(reduceMotion?0:-current.trains[0].distance*.085)))}];
 // Sack hoist, receiving platform and a millstone explain the building's work.
 const floor=BRIAR_BUILDINGS.find(q=>q.kind==='mill').floor;
 for(let i=0;i<9;i++)b.box(15.7,floor+.02,-.1+i*.27,2.3,.15,.255,'#9a8056',22);
 for(const xx of[14.65,16.75])b.box(xx,floor+1.15,1.9,.14,2.3,.14,'#7f6847',22);
 b.beam([14.6,floor+2.37,1.9],[16.8,floor+2.37,1.9],.09,'#8e7250',22,5);b.beam([15.7,floor+2.37,1.9],[15.7,floor+.6,1.9],.022,'#b8a370',23,5);
 for(const [xx,zz]of[[16.6,.4],[15.9,.2],[16.7,1.1]])b.sphere(xx,floor+.43,zz,.25,.48,.28,'#c4b58c',23,8,6,true);
 b.cylinder(17.2,floor+.43,-6,.66,.66,.19,'#9b9c87',4,20,PI/2);b.cylinder(17.2,floor+.43,-5.89,.10,.10,.025,'#575e50',42,12,PI/2);
 b.pop();
}

const BRIAR_GLYPHS={A:['01110','10001','10001','11111','10001','10001','10001'],B:['11110','10001','10001','11110','10001','10001','11110'],C:['01111','10000','10000','10000','10000','10000','01111'],D:['11110','10001','10001','10001','10001','10001','11110'],E:['11111','10000','10000','11110','10000','10000','11111'],F:['11111','10000','10000','11110','10000','10000','10000'],G:['01111','10000','10000','10111','10001','10001','01110'],H:['10001','10001','10001','11111','10001','10001','10001'],I:['11111','00100','00100','00100','00100','00100','11111'],K:['10001','10010','10100','11000','10100','10010','10001'],L:['10000','10000','10000','10000','10000','10000','11111'],M:['10001','11011','10101','10101','10001','10001','10001'],N:['10001','11001','10101','10011','10001','10001','10001'],O:['01110','10001','10001','10001','10001','10001','01110'],P:['11110','10001','10001','11110','10000','10000','10000'],R:['11110','10001','10001','11110','10100','10010','10001'],S:['01111','10000','10000','01110','00001','00001','11110'],T:['11111','00100','00100','00100','00100','00100','00100'],U:['10001','10001','10001','10001','10001','10001','01110'],V:['10001','10001','10001','10001','01010','01010','00100'],W:['10001','10001','10001','10101','10101','11011','10001'],Y:['10001','01010','01010','00100','00100','00100','00100']};
function briarLettering(b,text,x,y,z,w,h,c='#ded0a6'){
 const cw=w/(text.length*6-1),ch=h/7;for(let k=0;k<text.length;k++){const glyph=BRIAR_GLYPHS[text[k]];if(!glyph)continue;for(let j=0;j<7;j++)for(let i=0;i<5;i++)if(glyph[j][i]==='1'){const xx=x-w/2+(k*6+i)*cw,yy=y+h/2-j*ch;b.quad([xx,yy,z],[xx+cw*.91,yy,z],[xx+cw*.91,yy-ch*.93,z],[xx,yy-ch*.93,z],c,23);}}
}
function briarSignboard(b,text,x,y,z,w=3.2,h=.55){b.box(x,y,z,w+.36,h+.32,.12,'#34594d',22);for(const s of[-1,1])b.box(x,y+s*(h/2+.11),z+.08,w+.35,.055,.045,'#b1a076',41);briarLettering(b,text,x,y,z+.085,w,h);}
function briarAwning(b,x,y,z,w,depth=1.7,c='#9b5b48'){
 const cols=10,rows=5;for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){const pt=(u,v)=>[x+(u-.5)*w,y-.34*v-.16*Math.sin(v*PI),z+v*depth];b.quad(pt(i/cols,j/rows),pt((i+1)/cols,j/rows),pt((i+1)/cols,(j+1)/rows),pt(i/cols,(j+1)/rows),i%2?'#c7bf9b':c,23);}
 for(let i=0;i<cols;i++){const xx=x-w/2+(i+.5)*w/cols;for(let j=0;j<4;j++){const a=-PI/2+j*PI/4,q=-PI/2+(j+1)*PI/4;b.tri([xx,y-.34,z+depth],[xx+Math.sin(a)*w/cols/2,y-.42-Math.cos(a)*.13,z+depth],[xx+Math.sin(q)*w/cols/2,y-.42-Math.cos(q)*.13,z+depth],i%2?'#c7bf9b':c,23);}}
 for(const s of[-1,1])b.beam([x+s*w*.48,y-.34,z+depth],[x+s*w*.48,y-1.0,z-.05],.040,'#7b6b4a',42,5);
}
function briarHouseDetails(b,q){
 const {w,d,h}=q;
 // Carved bargeboards, pegged braces, jetty brackets and rain chains give each
 // timber house a plausible construction rather than a painted block facade.
 for(const side of[-1,1]){
  const z=side*(d/2+.10);
  for(let i=0;i<5;i++){const t=(i+.5)/5,xx=(w/2+.28)*(1-t),yy=h+q.roof*t-.06;for(const s of[-1,1]){b.box(s*xx,yy,z,.17,.33,.20,'#c0ab7c',22);b.sphere(s*xx,yy-.12,z+side*.13,.045,.045,.025,'#75694e',42,5,3);}}
  for(const xx of[-w*.35,0,w*.35]){b.beam([xx,1.65,z],[xx,2.48,z+side*.36],.074,'#776746',22,4);b.box(xx,2.43,z+side*.19,.28,.15,.54,'#9a8356',22);}
  for(let i=0;i<4;i++){const xx=-w*.42+i*w*.28;b.box(xx,.42,z,.69,.26,.08,'#a8a58c',4);}
 }
 // Stone sill brackets and deep, jettied projecting bays vary the silhouette.
 if(['inn','weaver','house'].includes(q.kind)){
  const xx=q.kind==='inn'?w*.30:-w*.21,yy=h>4.7?3.0:2.55,zz=d/2+.50;
  b.push(xx,yy,zz);b.box(0,.58,0,1.6,1.16,.95,q.plaster,23);briarHouseWindow(b,0,.02,.50,1.12,1.05,false);b.box(0,-.11,0,1.83,.16,1.15,'#a28a5a',22);
  for(const s of[-1,1])b.beam([s*.59,-.81,-.38],[s*.59,-.14,.50],.065,'#8b7550',22,4);
  b.quad([-.94,1.3,-.53],[.94,1.3,-.53],[.94,1.17,.64],[-.94,1.17,.64],q.slate,5);b.pop();
 }
 if(['inn','baker','weaver','garden'].includes(q.kind))briarDormer(b,w*.28,h+q.roof*.43,-d*.1,PI/2,.69,q.slate);
 // Roof gutters are supported, with chains and a rain barrel, not free piping.
 b.beam([w/2+.41,h-.09,-d/2-.3],[w/2+.41,h-.09,d/2+.3],.038,'#778171',42,6);
 for(let i=0;i<8;i++)ringZ(b,w/2+.43,h-.17-i*.23,d/2+.31,.047,.063,.025,'#8e8b68',41,7);
 if(q.kind!=='smith')briarBarrel(b,w/2+.45,0,d/2+.30,.68);
 if(q.kind==='inn'){
  briarSignboard(b,'COPPER HART',0,2.55,d/2+.21,w*.78,.36);
  b.push(w/2+.62,0,-d*.22);b.box(0,1.9,0,1.6,3.8,2.9,q.plaster,23);briarRoof(b,2.05,3.4,3.85,1.25,q.slate,false);briarHouseWindow(b,0,2.0,1.48,.72,1.08);b.pop();
  briarLantern(b,-w/2-.26,2.24,d/2+.33,.34);
 }else if(q.kind==='baker'){
  briarAwning(b,-.3,2.43,d/2+.26,w*.86,1.82,'#9f7350');briarSignboard(b,'BAKERY',0,h-.65,d/2+.24,2.4,.31);
  for(let i=0;i<3;i++)briarCrate(b,-2.7+i*.60,0,d/2+2.0,.56,.42,.55);
 }else if(q.kind==='smith'){
  // Bellows, tool hooks, horse shoes and an open timber fuel store.
  b.push(1.65,.42,-1.20,0,-.4);b.box(0,.13,0,.75,.26,1.30,'#876b4c',22);b.beam([0,.3,-.5],[0,.65,.65],.08,'#6d5a3e',22,4);b.pop();
  for(let i=0;i<5;i++){const xx=-2.1+i*.35;b.beam([xx,1.8,-d/2+.3],[xx,2.5,-d/2+.3],.025,'#596858',42,5);b.box(xx,2.49,-d/2+.3,.25,.07,.12,'#8d9786',41);}
  for(const xx of[-1.9,-1.35])archRing(b,xx,1.35,-d/2+.27,.15,.20,.04,'#717f6b',9,0,PI*1.65);
 }else if(q.kind==='mill'){
  briarSignboard(b,'BRIAR MILL',0,h-.58,d/2+.22,3.3,.40);
  b.push(0,h-1.0,d/2+.44);b.box(0,.58,.20,1.4,1.16,1.4,'#8b7753',22);briarRoof(b,1.9,1.95,1.16,.83,q.slate,false);b.pop();
  b.beam([0,h+.28,d/2+.2],[0,h+.28,d/2+2.6],.095,'#715f44',22,5);b.beam([0,h-.5,d/2+.2],[0,h+.28,d/2+2],.06,'#927a52',22,4);
  ringZ(b,0,h+.1,d/2+2.6,.13,.19,.09,'#998452',41,10);b.beam([0,h+.1,d/2+2.63],[0,.6,d/2+2.63],.018,'#a99469',23,4);
 }else if(q.kind==='weaver'){
  briarAwning(b,-.2,2.44,d/2+.28,w*.93,1.4,'#6d8c7b');
  for(let i=0;i<4;i++)b.box(-1.1+i*.65,.63,d/2+1.0,.57,.12,.81,['#aa7860','#919d86','#b7ad86'][i%3],23);
 }
}
function briarStation(scene,b){
 const x=44,y=BRIAR.rail-.12,z=31.4,w=18,d=3.5;
 b.box(x,y-.31,z,w,.62,d,'#939e87',4);b.box(x,y+.03,z,w+.15,.12,d+.12,'#bfb69b',9);
 for(let i=0;i<26;i++)b.box(x-w/2+(i+.5)*w/26,y+.14,z+d/2-.05,w/26-.025,.10,.35,'#d2c7aa',4);
 b.push(x-1,y+.08,z-.6);b.box(0,1.45,0,5.4,2.9,2.4,'#b6b095',4);briarRoof(b,6.1,3.1,2.95,1.4,'#50645d',false);
 for(const xx of[-1.6,1.6])briarHouseWindow(b,xx,.96,1.25,.7,.95,false);b.box(0,1,1.25,.83,1.9,.12,'#486250',22);briarSignboard(b,'BRIARWATCH',0,2.48,1.27,3.7,.35);b.pop();
 for(const xx of[x-7.7,x-4.3,x+4.3,x+7.7]){b.box(xx,y+1.25,z+.96,.10,2.5,.11,'#536b59',41);for(const s of[-1,1])b.beam([xx,y+1.93,z+.96],[xx+s*.53,y+2.48,z+.96],.038,'#768467',41,5);}
 b.box(x,y+2.55,z+.80,w-.7,.14,2.1,'#486156',5);b.box(x,y+2.41,z+1.81,w-.6,.22,.08,'#c3b996',22);
 // Open fretwork valance, small clock and station flower troughs.
 for(let i=0;i<48;i++)b.box(x-w*.46+i*w*.92/47,y+2.24,z+1.81,.075,.26,.07,'#c8bc99',22);
 for(const xx of[x-6,x+5.8]){bench(b,xx,y+.10,z+.6);briarLantern(b,xx,y+2.14,z+.85,.30);}
 b.push(x+3.6,y+1.88,z+1.38);sign(b,'clock',0,0,0,.72,.72);b.pop();
 briarCrate(b,x+7,y+.14,z-.65,.7,.65,.75);briarCrate(b,x+6,y+.14,z-.65,.8,.5,.6);
 for(const [xx,zz,angle]of[[39,32.2,.3],[48,32.2,2.2]])scenePerson(scene,b,xx,y+.16,zz,'bag',angle,.80);
 housePath(b,[[44,29.6],[46,26],[47.8,22.5]],.88,briarSurface,'#b7ab8b');
}
function briarGoodsYard(b){
 const y=BRIAR.rail,curve=[[36,y,35],[43,y,35],[40,y,40],[48,y,40]],e=new Edge('Briarwatch goods siding',[curve,[[48,y,40],[51,y,40],[54,y,40],[57,y,40]]]);briarTrack(b,e);
 // Point blades and the connected spur are real track geometry; they are not
 // presented as an interactive dispatch or automatic switching simulation.
 for(const side of[-1,1])b.beam([37,y+.018,35+side*.31],[41,y+.018,35.3+side*.32],.022,'#aeb6a1',1,5);
 b.beam([38,y+.10,36],[38,y+.48,36.55],.045,'#7b8672',42,6);b.sphere(38,y+.48,36.55,.11,.11,.11,'#b79f64',41,8,4);
 const foot=briarSurface(51,42.7);b.box(51,(foot+y+.6)/2,42.7,8,y+.6-foot,2.6,'#929c87',4);
 for(let i=0;i<25;i++)b.box(47.1+i*.33,y+.67,42.7,.30,.15,2.6,'#95805a',22);
 briarSignboard(b,'GOODS',51,y+1.0,41.34,2,.29);
 for(const [x,z,w,h]of[[49,42.7,1.1,.8],[50.6,43,.9,1.05],[48.2,43.4,.65,.65]])briarCrate(b,x,y+.78,z,w,h,.9);
 for(const x of[53,54])briarBarrel(b,x,y+.76,43,.85);
 // A diagonal loading crane: pedestal, gear housing, tie and hanging chain.
 b.box(55.2,y+.27,43,.88,.54,.90,'#838e7d',4);b.cylinder(55.2,y+2.5,43,.14,.14,4.5,'#57705c',42,10);
 b.beam([55.2,y+4.35,43],[52.8,y+3.8,40.3],.10,'#8a7952',22,6);b.beam([55.2,y+1.9,43],[52.8,y+3.8,40.3],.063,'#a58e5f',22,5);b.beam([52.8,y+3.8,40.3],[52.8,y+1.43,40.3],.017,'#6d775f',42,5);archRing(b,52.8,y+1.29,40.3,.12,.17,.045,'#929e87',9,PI*.7,PI*2.1);
 // A stationary plank-sided goods wagon with gauge-matched wheels and buffers.
 const a=e.at(e.length-4.5);b.matrix(basis(a.p,a.f));b.box(0,.46,0,1.12,.17,2.5,'#655e48',42);
 for(const z of[-.77,.77])for(const side of[-1,1])b.cylinder(side*.39,.265,z,.21,.21,.10,'#485d4f',42,12,0,PI/2);
 for(const side of[-1,1])for(let j=0;j<4;j++)b.box(side*.56,.66+j*.15,0,.085,.13,2.48,'#9a8a5c',22);
 for(const side of[-1,1])b.box(0,.88,side*1.20,1.12,.70,.08,'#8e7b55',22);
 for(const x of[-.33,.33])for(const side of[-1,1])b.cylinder(x,.44,side*1.40,.085,.085,.21,'#566b57',42,8,PI/2);
 for(let i=0;i<7;i++)b.box((i%3-.9)*.31,.69+Math.floor(i/3)*.27,(i%2-.5)*.8,.38,.28,.48,'#aeb197',4);b.pop();
}
function briarVillage(scene,b){
 briarVillageGardens(b);briarWorkingRailway(b);briarVillageLife(b);briarRailwayPatina(b);
 for(const q of BRIAR_BUILDINGS)briarTimberHouse(b,q);
 briarMill(scene,b);briarStation(scene,b);briarGoodsYard(b);
 const lanes=[[[47.8,25.5],[48.2,18],[48.3,10],[47.6,3],[46,-3]],[[39,22],[47.9,24],[56,26]],[[29.5,0],[33,-3],[41,-1],[47.6,3],[58,3]]];
 for(const lane of lanes)housePath(b,lane,.94,briarSurface,'#b3a586');
 // A paved market court with curved striped cloth, baskets and useful space.
 const x=48.6,z=16.8,y=briarSurface(x,z)+.06;
 for(let i=0;i<9;i++)for(let j=0;j<8;j++){const xx=x-1.8+i*.43,zz=z-1.6+j*.43;b.quad([xx,y,zz],[xx+.395,y,zz],[xx+.395,y,zz+.395],[xx,y,zz+.395],(i+j)%3?'#aaa88c':'#bfb497',9);}
 for(const xx of[x-1.2,x+1.2])b.box(xx,y+1.08,z,.09,2.16,.09,'#8b7551',22);
 briarAwning(b,x,y+2.25,z-.5,3,1.45,'#768965');b.box(x,y+.86,z+.12,2.6,.13,.88,'#9a8358',22);
 for(let i=0;i<6;i++)b.sphere(x-.86+i*.34,y+1.04,z+.12,.17,.12,.15,i%2?'#819c5c':'#be9e64',23,6,4);
 briarCart(b,46.1,briarSurface(46.1,26.3)+.07,26.3,-.32);
 briarBarrel(b,40.3,BRIAR_BUILDINGS[0].floor,22.1,.9);briarCrate(b,54.5,BRIAR_BUILDINGS[1].floor,26.2,.9,.65,.65);
 // A low orchard wall, trellises and kitchen beds separate yards without
 // turning all available ground into scattered props.
 for(const [a,q]of[[[52,-12],[59,-12]],[[59,-12],[61,-6]],[[36,12],[38,8]],[[34,24],[35,28]]]){
  const n=Math.ceil(Math.hypot(q[0]-a[0],q[1]-a[1])/.65);for(let i=0;i<=n;i++){const xx=mix(a[0],q[0],i/n),zz=mix(a[1],q[1],i/n),h=briarSurface(xx,zz);b.box(xx,h+.4,zz,.07,.8,.07,'#8c815b',22);}for(const h of[.3,.65])b.beam([a[0],briarSurface(...a)+h,a[1]],[q[0],briarSurface(...q)+h,q[1]],.033,'#a08d5f',22,5);
 }
 for(let i=0;i<3;i++)for(let j=0;j<7;j++){const xx=51.4+i*.55,zz=-11.3+j*.30,y=briarSurface(xx,zz);briarLeafCloud(b,[xx,y+.13,zz],.17,'#7e965a',i*7+j);}
 for(const [xx,zz,pose,angle]of[[47.5,23.3,'bag',.4],[49.3,18.4,'talk',2.6],[49.1,17.9,'talk',.2],[55.5,26.1,'work',1.4],[28.5,.7,'work',.9]])scenePerson(scene,b,xx,briarSurface(xx,zz)+.12,zz,pose,angle,.75);
 for(const [xx,zz]of[[46.5,24.5],[53,26.6],[29,-.4]])briarLantern(b,xx,briarSurface(xx,zz)+2.2,zz,.30);
}


function briarVillageGardens(b){
 // The gap between the inn and weaver is a cultivated garden, not another
 // building or an even scatter of props. The lane stays clear to its east.
 for(let i=0;i<3;i++){
  const x=39.6+i*1.8,z=9.0,y=briarSurface(x,z);
  b.box(x,y+.09,z,1.3,.17,2.4,'#5e6650',9);
  for(const side of[-1,1]){b.box(x+side*.67,y+.22,z,.10,.33,2.5,'#928366',22);b.box(x,y+.22,z+side*1.23,1.4,.33,.10,'#928366',22);}
  for(let j=0;j<4;j++)for(const side of[-1,1])briarLeafCloud(b,[x+side*.28,y+.34,z-.84+j*.55],.21,i===1?'#8b9e63':'#63845b',i*12+j+side);
 }
 for(let i=0;i<13;i++){
  const x=38.7+i*.52,z=11.0+Math.sin(i*.32)*.15,y=briarSurface(x,z);
  briarLeafCloud(b,[x,y+.48,z],.49,'#57794f',170+i);
 }
 // A trellis frames the garden gate; it never projects into the main street.
 for(const x of[45.5,46.6]){const y=briarSurface(x,10.4);b.box(x,y+.82,10.4,.10,1.64,.12,'#938463',22);}
 b.beam([45.5,briarSurface(45.5,10.4)+1.48,10.4],[46.6,briarSurface(46.6,10.4)+1.48,10.4],.045,'#ac9a71',22,4);
}

// Little working scenes, kept in the railway's service strip rather than
// scattered over the miniature. Grounded feet use the emitted terrain surface.
function briarMilkChurn(b,x,y,z){
 const metal='#9aa798';
 b.cylinder(x,y+.25,z,.18,.145,.5,metal,41,9);b.cylinder(x,y+.51,z,.145,.10,.10,metal,41,9);
 b.cylinder(x,y+.60,z,.095,.095,.09,metal,41,9);b.cylinder(x,y+.66,z,.12,.12,.032,'#b3bca9',41,9);
 for(const side of[-1,1]){b.beam([x+side*.15,y+.40,z],[x+side*.25,y+.42,z],.018,metal,41,5);b.beam([x+side*.25,y+.42,z],[x+side*.25,y+.31,z],.018,metal,41,5);}
}
function briarWorkingRailway(b){
 // Ornamental cast-iron water column, valve wheel and a swung-away hose.
 const x=54.1,z=31.25,y=briarSurface(x,z);
 b.cylinder(x,y+.13,z,.50,.44,.26,'#878c75',4,8);b.cylinder(x,y+1.52,z,.15,.105,2.8,'#425c49',42,10);
 for(const yy of[.31,2.45,2.82])b.cylinder(x,y+yy,z,.20,.20,.085,'#ae9668',41,10);
 b.beam([x,y+2.82,z],[x,y+2.82,z+1.85],.12,'#3a5342',42,8);
 b.beam([x,y+2.22,z],[x,y+2.80,z+1.05],.05,'#a08c61',41,5);
 b.beam([x,y+2.82,z+1.85],[x+.10,y+1.15,z+1.80],.065,'#363e32',42,8);
 ringZ(b,x,y+.94,z+.19,.18,.21,.035,'#9f7b52',41,12);
 for(const a of[0,PI/3,2*PI/3])b.beam([x-Math.cos(a)*.17,y+.94-Math.sin(a)*.17,z+.20],[x+Math.cos(a)*.17,y+.94+Math.sin(a)*.17,z+.20],.014,'#bc9c63',41,5);
 // Silver churns and a low luggage trolley sit on the platform, not the track.
 for(const [xx,zz]of[[36.6,31.7],[37,31.6],[36.8,32.15]])briarMilkChurn(b,xx,BRIAR.rail-.03,zz);
 const tx=51.8,tz=32.0,ty=BRIAR.rail-.03;
 b.box(tx,ty+.31,tz,1.1,.09,.60,'#826e4f',22);
 for(const xx of[-.43,.43])for(const zz of[-.25,.25])b.cylinder(tx+xx,ty+.13,tz+zz,.13,.13,.065,'#455544',42,9,PI/2);
 for(const zz of[-.25,.25])b.beam([tx-.50,ty+.30,tz+zz],[tx-.85,ty+.81,tz+zz],.023,'#5c7157',42,5);
 b.beam([tx-.85,ty+.81,tz-.25],[tx-.85,ty+.81,tz+.25],.026,'#987f55',22,5);
 for(const [dx,h,w]of[[-.20,.34,.5],[.25,.27,.39]]){
  b.box(tx+dx,ty+.37+h/2,tz,w,h,.45,dx<0?'#79573f':'#8c7754',23);
  for(const zz of[-.13,.13])b.box(tx+dx,ty+.38+h,tz+zz,w,.018,.045,'#b29a70',23);
 }
 // Platelayer's hut with a real dark recess, timber siding, gutter and bench.
 const hx=61,hz=21,hy=briarSurface(hx,hz);
 b.box(hx,hy+.12,hz,2.05,.24,1.8,'#8e9480',4);
 b.push(hx,hy+.24,hz,0,-.18);
 b.box(0,.95,-.78,1.8,1.9,.11,'#738272',22);for(const side of[-1,1])b.box(side*.84,.95,0,.12,1.9,1.6,'#738272',22);
 for(const xx of[-.62,.62])b.box(xx,.95,.75,.5,1.9,.10,'#8b9178',22);
 b.box(0,1.74,.75,.78,.31,.12,'#8b9178',22);b.box(0,.82,.03,.58,1.64,.05,'#435545',22);
 for(const yy of[.42,.8,1.2,1.57])for(const side of[-1,1])b.box(side*.91,yy,0,.025,.025,1.66,'#546552',22);
 briarRoof(b,2.30,2.14,1.99,.49,'#546966',false);
 b.box(-.43,1.30,-.85,.45,.50,.02,'#b5b894',6);b.box(-.43,1.30,-.88,.025,.51,.04,'#657360',22);
 b.box(.13,.45,1.10,1.40,.09,.33,'#ac9464',22);for(const xx of[-.39,.65])b.box(xx,.23,1.10,.09,.46,.27,'#7a6d4d',22);
 b.beam([1.03,1.9,-.65],[1.03,.14,-.65],.025,'#4f6657',42,6);b.pop();
 // Spare sleepers on cribbing near the goods dock, and a hand shovel.
 const sx=58,sz=41.9,sy=briarSurface(sx,sz);
 for(const dx of[-.45,.45])b.box(sx+dx,sy+.1,sz,.16,.2,1.50,'#78684b',22);
 for(let j=0;j<3;j++)for(let i=0;i<4;i++)b.box(sx+(i-1.5)*.25,sy+.25+j*.17,sz,.21,.14,1.26,'#897955',22);
 const shovelY=briarSurface(56.78,42);
 b.beam([56.8,shovelY+.06,42],[56.3,shovelY+1.5,42],.027,'#b49a65',22,6);
 b.box(56.78,shovelY+.15,42,.24,.3,.038,'#596958',42);
}
function briarVillageLife(b){
 // An orchard ladder leans into the cultivated tree fork. Both feet touch turf.
 const x=33,z=26,ground=briarSurface(x,z+1.12);
 for(const side of[-1,1])b.beam([x+side*.31,ground+.04,z+1.12],[x+side*.23,ground+2.15,z+.22],.033,'#b5a17a',22,5);
 for(let i=0;i<7;i++){const t=(i+.6)/7;b.beam([x-mix(.31,.23,t),ground+.04+t*2.11,z+1.12-t*.9],[x+mix(.31,.23,t),ground+.04+t*2.11,z+1.12-t*.9],.025,'#a29169',22,5);}
 for(const [xx,zz]of[[32,27.3],[31.9,28]]){const y=briarSurface(xx,zz);briarCrate(b,xx,y+.03,zz,.62,.3,.53);for(let i=0;i<5;i++)b.sphere(xx+(i%3-1)*.14,y+.36,zz+(i%2-.5)*.18,.068,.06,.06,i%2?'#a86745':'#b2aa5a',23,5,3);}
 // Laundry is kept in the weaver's back yard, clear of the lane and garden.
 const ax=39.5,az=-.6,qx=42.6,qz=-.6,ya=briarSurface(ax,az),yq=briarSurface(qx,qz);
 for(const [x,z,y]of[[ax,az,ya],[qx,qz,yq]])b.beam([x,y,z],[x,y+2.20,z],.035,'#8c7855',22,5);
 const line=t=>[mix(ax,qx,t),mix(ya,yq,t)+2.1-.12*Math.sin(t*PI),az];
 for(let i=0;i<8;i++)b.beam(line(i/8),line((i+1)/8),.008,'#a59979',23,4);
 for(let i=0;i<3;i++){const a=line(.15+i*.26),q=line(.31+i*.26);b.quad(a,q,[q[0]+.02,q[1]-.80,az+.10],[a[0]-.05,a[1]-.76,az+.08],i===1?'#9eaba1':'#d5cdb2',23);}
 // Split timber, bark and pale cut ends behind the smithy.
 const lx=57.7,lz=25.35,ly=briarSurface(lx,lz);
 for(let j=0;j<3;j++)for(let i=0;i<4-j;i++){
  const xx=lx+(i-(3-j)/2)*.30,yy=ly+.14+j*.24;
  b.beam([xx,yy,lz-.50],[xx,yy,lz+.50],.14,'#6c654c',22,6);
  b.cylinder(xx,yy,lz+.512,.129,.129,.012,'#c2a774',22,6,PI/2);
  b.beam([xx-.09,yy+.05,lz+.52],[xx+.07,yy-.08,lz+.52],.008,'#897147',22,4);
 }
}
function briarRailwayPatina(b){
 // Drainage stains and dressed joints live on the faces of the actual bridge.
 for(let i=0;i<6;i++)for(const side of[-1,1]){
  const x=-4+i*5.4,z=-43+side*1.383,y=briarSurface(x,z),top=BRIAR.highRail-2.1;
  if(top<=y+.7)continue;
  b.quad([x-.09,y+.3,z],[x+.14,y+.3,z],[x+.06,top,z],[x-.045,top,z],'#707e67',4);
  for(let j=0;j<3;j++){const yy=mix(y+.3,top,(j+.5)/3);b.box(x,yy,z,.88,.023,.012,'#77826f',4);}
 }
 for(const side of[-1,1])for(let x=-3;x<22;x+=3.12){
  // Iron washers at the covered bridge's upper/lower brace joints.
  for(const y of[BRIAR.rail+.02,BRIAR.rail+2.65]){
   b.box(x,y,-31+side*1.465,.20,.18,.035,'#4e5642',42);
   b.cylinder(x,y,-31+side*1.491,.035,.035,.016,'#b4a784',41,6,PI/2);
  }
 }
 // Tunnel soot follows the intrados crown; the opening remains actual air.
 for(const [x,angle]of[[BRIAR_TUNNEL.x0,PI/2],[BRIAR_TUNNEL.x1,-PI/2]]){
  b.push(x,BRIAR_TUNNEL.y-.22,-43,0,angle);
  for(let i=0;i<12;i++){const a=i*PI/12,q=(i+1)*PI/12,r=1.76,R=1.95+.045*Math.sin(i*1.7);b.quad([r*Math.cos(a),1.54+r*Math.sin(a),.67],[r*Math.cos(q),1.54+r*Math.sin(q),.67],[R*Math.cos(q),1.54+R*Math.sin(q),.67],[R*Math.cos(a),1.54+R*Math.sin(a),.67],'#5a6455',4);}
  b.pop();
 }
 // Whistle boards and boundary posts alternate with the route's actual bends.
 for(const d of[26,87,185,266,344,453]){
  const a=BRIAR_ROUTE.at(d),r=norm([a.f[2],0,-a.f[0]]),p=add(a.p,mul(r,1.85)),y=briarSurface(p[0],p[2]);
  if(!briarInside(p[0],p[2],.6)||briarInTunnel(p[0],p[2],3)||y<a.p[1]-1.2||y>a.p[1]+.3)continue;
  b.push(p[0],y,p[2],0,Math.atan2(a.f[0],a.f[2]));
  b.box(0,.70,0,.075,1.40,.08,'#e0d4ac',23);b.box(0,1.35,0,.37,.38,.065,'#eadfc1',23);
  b.beam([-.13,1.48,.042],[-.06,1.24,.042],.019,'#4c5b46',42,4);b.beam([-.06,1.24,.042],[0,1.42,.042],.019,'#4c5b46',42,4);b.beam([0,1.42,.042],[.06,1.24,.042],.019,'#4c5b46',42,4);b.beam([.06,1.24,.042],[.13,1.48,.042],.019,'#4c5b46',42,4);b.pop();
 }
}
