'use strict';

// Eight individually placed buildings around the lower lane. The common joinery
// vocabulary is shared; footprints, additions, roofs and working yards are not.
const BRIAR_BUILDINGS=[
 {name:'The Copper Hart',x:20.8,z:6.5,w:6.4,d:7.6,h:5.7,roof:3.0,angle:.07,plaster:'#d1c3a0',slate:'#695e53',kind:'inn'},
 {name:'The smithy',x:32.6,z:9.0,w:5.9,d:5.5,h:3.5,roof:2.1,angle:-.07,plaster:'#a59d85',slate:'#536365',kind:'smith'},
 {name:'The bakehouse',x:30.1,z:-3.8,w:5.6,d:6.3,h:4.7,roof:2.7,angle:.10,plaster:'#c6b78f',slate:'#856b56',kind:'baker'},
 {name:'The mill',x:14,z:-4,w:5.0,d:6.0,h:5.8,roof:2.7,angle:0,plaster:'#b8ac8c',slate:'#637174',kind:'mill'},
 {name:'Weavers Cottage',x:20.8,z:-5.1,w:4.7,d:5.2,h:5.0,roof:2.9,angle:-.12,plaster:'#b4bea1',slate:'#586770',kind:'weaver'},
 {name:'The farrier house',x:39.8,z:3.4,w:4.8,d:6.0,h:4.2,roof:2.7,angle:.18,plaster:'#c9bf9e',slate:'#797462',kind:'house'},
 {name:'The orchard house',x:38.0,z:-7.7,w:5.6,d:5.1,h:4.3,roof:2.9,angle:-.12,plaster:'#a8b5a0',slate:'#886f54',kind:'garden'},
 {name:'The ferryman house',x:13.5,z:10.4,w:4.1,d:4.6,h:3.8,roof:2.5,angle:-.22,plaster:'#c5bda5',slate:'#5c7172',kind:'cottage'}
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
  b.box(0,1.2,0,w,2.4,d,q.kind==='mill'?'#a2a08a':'#b8ae91',4);
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
 b.pop();return floor;
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
 // The leat is a low, stone-lined branch of the river, not water painted uphill.
 const x=10.5,z=-4,water=BRIAR.water+.02;
 for(const side of[-1,1]){
  const wallX=x+side*.93,foot=Math.min(...Array.from({length:17},(_,i)=>briarSurface(wallX,z-4.05+i*8.1/16)))-.15;
  b.box(wallX,(foot+.36)/2,z,.25,.36-foot,8.1,'#999c86',4);
  b.box(x+side*.93,.43,z,.36,.15,8.25,'#bab194',4);
 }
 b.quad([x-.8,water,-8.1],[x+.8,water,-8.1],[x+.8,water,.1],[x-.8,water,.1],'#476c61',7);
 // Trestle bearings visibly carry the axle above the channel.
 for(const xx of[9.65,11.4]){const foot=Math.min(briarSurface(xx,z-.45),briarSurface(xx,z+.45))-.15;b.box(xx,(foot+.34)/2,z,.5,.34-foot,.9,'#888e79',4);b.box(xx,.46,z,.68,.25,1.1,'#a9a58c',4);}
 b.beam([9.5,-.67,z],[12.2,-.67,z],.14,'#6e5d40',22,9);
 const wheel=new Builder();briarMillWheel(wheel);
 scene.movingParts=[{mesh:wheel.mesh(),model:current=>mm(trans(x,-.67,z),mm(ry(PI/2),rz(reduceMotion?0:-current.trains[0].distance*.085)))}];
 // Sack hoist, receiving platform and a millstone explain the building's work.
 const floor=BRIAR_BUILDINGS.find(q=>q.kind==='mill').floor;
 for(let i=0;i<9;i++)b.box(15.7,floor+.02,-.1+i*.27,2.3,.15,.255,'#9a8056',22);
 for(const xx of[14.65,16.75])b.box(xx,floor+1.15,1.9,.14,2.3,.14,'#7f6847',22);
 b.beam([14.6,floor+2.37,1.9],[16.8,floor+2.37,1.9],.09,'#8e7250',22,5);b.beam([15.7,floor+2.37,1.9],[15.7,floor+.6,1.9],.022,'#b8a370',23,5);
 for(const [xx,zz]of[[16.6,.4],[15.9,.2],[16.7,1.1]])b.sphere(xx,floor+.43,zz,.25,.48,.28,'#c4b58c',23,8,6,true);
 b.cylinder(17.2,floor+.43,-6,.66,.66,.19,'#9b9c87',4,20,PI/2);b.cylinder(17.2,floor+.43,-5.89,.10,.10,.025,'#575e50',42,12,PI/2);
}
function briarStation(scene,b){
 const x=24,y=BRIAR.rail-.12,z=27.4,w=18,d=3.5;
 b.box(x,y-.28,z,w,.56,d,'#a29f86',4);b.box(x,y+.03,z,w+.15,.12,d+.12,'#c1b79b',9);
 for(let i=0;i<26;i++)b.box(x-w/2+(i+.5)*w/26,y+.14,z+d/2-.05,w/26-.025,.10,.35,'#d4c7a5',4);
 b.push(x-1.0,y+.08,z-.6);b.box(0,1.45,0,5.4,2.9,2.4,'#b8ae8d',4);briarRoof(b,6.1,3.1,2.95,1.4,'#59695f');
 for(const xx of[-1.6,1.6])briarHouseWindow(b,xx,.96,1.25,.7,.95,false);b.box(0,1.0,1.25,.83,1.9,.12,'#536958',22);b.pop();
 for(const xx of[x-7.7,x-4.3,x+4.3,x+7.7]){b.box(xx,y+1.25,z+.96,.10,2.5,.11,'#617061',41);b.beam([xx,y+1.96,z+.96],[xx+.50,y+2.48,z+.96],.038,'#71816a',41,5);}
 b.box(x,y+2.55,z+.80,w-.7,.14,2.1,'#5e7165',5);b.box(x,y+2.41,z+1.81,w-.6,.22,.08,'#c6bc96',22);
 for(const xx of[x-6,x+5.8]){bench(b,xx,y+.10,z+.6);briarLantern(b,xx,y+2.14,z+.85,.30);}
 briarCrate(b,x+7,y+.14,z-.65,.7,.65,.75);briarCrate(b,x+6.0,y+.14,z-.65,.8,.50,.6);
 for(const [xx,zz,angle]of[[19,28.2,.3],[28,28.2,2.2]])scenePerson(scene,b,xx,y+.16,zz,'bag',angle,.80);
 housePath(b,[[24,25.6],[24,21],[24,17]],1.15,briarSurface,'#b8ad8c');
}
function briarVillage(scene,b){
 for(const q of BRIAR_BUILDINGS)briarTimberHouse(b,q);
 briarMill(scene,b);briarStation(scene,b);
 housePath(b,[[24,16],[25.8,10.2],[26.0,3],[26.4,-3],[28.4,-10]],1.0,briarSurface,'#b6aa88');
 housePath(b,[[26,3],[34.1,1.0],[42,-1.4]],.78,briarSurface,'#b6aa88');
 housePath(b,[[22,13.5],[17,15],[13.2,13.5]],.64,briarSurface,'#b4a885');
 // A small market court, not a sprawling collection of random market props.
 const y=briarSurface(25.8,3)+.06;
 for(let i=0;i<9;i++)for(let j=0;j<7;j++){
  const x=24.0+i*.43,z=1.6+j*.43;b.box(x,briarSurface(x,z)+.035,z,.40,.07,.40,(i+j)%3?'#aaa48b':'#beb294',9);
 }
 for(const xx of[24.5,27.1])b.box(xx,y+1.08,2.5,.08,2.16,.08,'#8b7250',22);
 b.quad([24.2,y+2.25,1.9],[27.4,y+2.25,1.9],[27.4,y+2.04,3.2],[24.2,y+2.04,3.2],'#bbb48a',23);
 b.box(25.8,y+.87,2.65,2.8,.12,.85,'#9c8054',22);
 for(let i=0;i<6;i++)b.sphere(24.9+i*.34,y+1.02,2.65,.17,.12,.15,i%2?'#9aab6a':'#bfaa6d',23,6,4);
 // Working yards tell different stories through a few legible arrangements.
 briarCart(b,22.8,briarSurface(22.8,13.3)+.07,13.3,-.22);
 briarBarrel(b,18.0,BRIAR_BUILDINGS[0].floor,11.6,.9);briarBarrel(b,18.65,BRIAR_BUILDINGS[0].floor,11.7,.75);
 briarCrate(b,33.7,BRIAR_BUILDINGS[1].floor,13.3,.9,.65,.65);
 for(let i=0;i<6;i++)b.cylinder(38.1+i*.19,briarSurface(38.1,9)+.18,9,.13,.13,1.6,'#997c4f',22,7,PI/2);
 // Garden fences are low and have actual openings to the lanes.
 for(const [a,q]of[[[35,15],[43,15]],[[43,15],[44,24]],[[30,23],[30,18]],[[35,-13],[42,-13]],[[42,-13],[43,-6]]]){
  const n=Math.ceil(Math.hypot(q[0]-a[0],q[1]-a[1])/.7);
  for(let i=0;i<=n;i++){const x=mix(a[0],q[0],i/n),z=mix(a[1],q[1],i/n),h=briarSurface(x,z);b.box(x,h+.45,z,.075,.90,.075,'#92825b',22);}
  for(const h of[.35,.70])b.beam([a[0],briarSurface(...a)+h,a[1]],[q[0],briarSurface(...q)+h,q[1]],.034,'#ac9566',22,5);
 }
 for(let i=0;i<3;i++)for(let j=0;j<8;j++){
  const x=35.1+i*.65,z=-12.1+j*.29,h=briarSurface(x,z);b.sphere(x,h+.13,z,.15,.12,.17,'#80905c',8,6,4,true);
 }
 // Small figures reinforce scale; no full-size gallery visitors.
 for(const [x,z,pose,angle]of[[24.4,10.9,'bag',.4],[26.3,5.8,'talk',2.6],[25.7,5.4,'talk',.2],[32,12.8,'work',1.4],[16.5,.7,'work',.9]])scenePerson(scene,b,x,briarSurface(x,z)+.12,z,pose,angle,.75);
 for(const [x,z]of[[24.1,11.3],[33.8,12.7],[12.3,10.8]])briarLantern(b,x,briarSurface(x,z)+2.2,z,.30);
}
