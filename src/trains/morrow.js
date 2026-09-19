'use strict';

// The Mourning Star, No. XIII. A distinct 4-4-0 engine, tender and clerestory
// observation coaches. +Z is forward; wheel contact uses the house .64 gauge.
TRAIN_ROSTER.morrow={name:'The Mourning Star',number:'XIII',service:'The Midnight Line',type:'Victorian 4-4-0 steam',body:'#543b59',line:'#d6bb7d',coach:'#53415c'};
const MORROW_STOCK={driveRadius:.38,leadingRadius:.205,coachRadius:.235,coachSpacing:5.0,tenderOffset:3.95,firstCoach:7.92};
const MT={plum:'#573d60',plumLight:'#77506e',brass:'#bb995e',gold:'#e0bf7b',black:'#262d38',steel:'#a4aaa6',velvet:'#6f4759',wood:'#86644a',light:'#ffd292',glass:'#658589'};
function mtBand(b,x,y,z,r,width,color=MT.brass){b.cylinder(x,y,z,r,r,width,color,41,24,PI/2);}
function mtRing(b,x,y,z,r,t,c=MT.brass,n=20){for(let i=0;i<n;i++){const a=i*TAU/n,q=(i+1)*TAU/n;b.beam([x+Math.cos(a)*r,y+Math.sin(a)*r,z],[x+Math.cos(q)*r,y+Math.sin(q)*r,z],t,c,41,5);}}
function mtRail(b,x,z0,z1,y=1.13){
 b.beam([x,y,z0],[x,y,z1],.016,MT.brass,41,6);for(let i=0;i<=5;i++)b.beam([x,y-.48,mix(z0,z1,i/5)],[x,y,mix(z0,z1,i/5)],.013,MT.brass,41,5);
}
function mtBuffers(b,z){const s=Math.sign(z)||1;b.box(0,.40,z,1.02,.17,.11,MT.plum,40);for(const x of[-.35,.35]){b.cylinder(x,.4,z+s*.12,.044,.044,.23,MT.black,42,10,PI/2);b.cylinder(x,.4,z+s*.24,.083,.083,.035,MT.steel,41,16,PI/2);}}
function mtCoachWindow(b,x,z,w=.45,h=.57,y=1.40){
 const s=Math.sign(x);
 // Four independent reveals surround a real aperture, not an opaque gold slab.
 for(const zz of[-w/2-.018,w/2+.018])b.box(x,y,z+zz,.048,h+.1,.042,MT.brass,41);
 for(const yy of[-h/2-.022,h/2+.022])b.box(x,y+yy,z,.048,.045,w+.08,MT.brass,41);
 b.quad([x+s*.026,y-h/2,z-w/2],[x+s*.026,y+h/2,z-w/2],[x+s*.026,y+h/2,z+w/2],[x+s*.026,y-h/2,z+w/2],MT.glass,76);
 b.box(x+s*.04,y+.025,z,.018,.025,w,MT.plum,40);b.box(x+s*.04,y,z,.018,h,.019,MT.plum,40);
 for(const side of[-1,1])b.box(x-s*.029,y,z+side*(w/2-.035),.055,h,.060,MT.velvet,23);
}
function mtEngine(b,roof=false){
 if(roof){
  // A shallow rolled roof, independently removable with the house cutaway.
  for(let i=0;i<14;i++){const a=i*PI/14,q=(i+1)*PI/14,p=(a,z)=>[Math.cos(a)*.67,1.96+Math.sin(a)*.24,z];b.quad(p(a,-2.22),p(a,-.92),p(q,-.92),p(q,-2.22),MT.black,42);}
  for(const z of[-2.23,-.91])b.beam([-.67,1.96,z],[.67,1.96,z],.025,MT.brass,41,6);b.box(0,2.26,-1.57,.45,.15,.50,MT.plum,40);return;
 }
 b.box(0,.45,0,.84,.18,4.50,MT.black,42);for(const s of[-1,1]){b.box(s*.48,.63,.04,.22,.08,4.37,MT.plum,40);b.box(s*.59,.68,.04,.02,.025,4.38,MT.gold,41);}
 mtBuffers(b,-2.3);mtBuffers(b,2.35);
 // Long plum boiler, separate smokebox, six brass bands and riveted seams.
 b.cylinder(0,1.04,.14,.367,.367,2.84,MT.plum,40,32,PI/2);b.cylinder(0,1.04,1.46,.38,.38,.52,MT.black,42,32,PI/2);
 for(const z of[-1.10,-.64,-.03,.60,1.22,1.75])mtBand(b,0,1.04,z,.385,.044,z===1.75?MT.gold:MT.brass);
 b.cylinder(0,1.04,1.77,.31,.31,.08,MT.black,42,28,PI/2);mtRing(b,0,1.04,1.823,.315,.017);b.beam([-.12,1.04,1.85],[.12,1.04,1.85],.018,MT.brass,41,6);b.beam([0,.91,1.85],[0,1.17,1.85],.018,MT.brass,41,6);
 for(let i=0;i<16;i++){const a=i*TAU/16;b.sphere(Math.cos(a)*.285,1.04+Math.sin(a)*.285,1.84,.018,.018,.011,MT.brass,41,6,4);}
 b.cylinder(0,1.75,1.34,.105,.125,.79,MT.black,42,18);b.cylinder(0,2.20,1.34,.13,.25,.26,MT.brass,41,18);b.cylinder(0,2.36,1.34,.27,.27,.065,MT.gold,41,18);b.cylinder(0,2.394,1.34,.19,.19,.005,MT.black,42,18);
 for(const z of[-.49,.35]){b.cylinder(0,1.45,z,.18,.14,.25,MT.brass,41,18);b.sphere(0,1.60,z,.15,.13,.15,MT.gold,41,16,8);}
 // A working cab with two quarterlights, firebox, gauges, levers and bench.
 b.box(0,.69,-1.54,1.12,.13,1.10,MT.wood,22);for(const side of[-1,1])b.box(side*.52,1.0,-1.54,.10,.52,1.10,MT.plum,40);b.box(0,1.54,-2.10,1.07,.91,.10,MT.plum,40);b.box(0,1.55,-2.16,.76,.53,.015,MT.light,6);
 for(const s of[-1,1]){b.box(s*.55,1.94,-1.55,.07,.08,1.2,MT.plum,40);for(const z of[-2.10,-1.0])b.box(s*.55,1.57,z,.07,.8,.10,MT.plum,40);mtCoachWindow(b,s*.596,-1.63,.53,.55,1.63);b.box(s*.28,1.64,-.98,.38,.52,.09,MT.brass,41);b.box(s*.28,1.64,-.922,.29,.43,.015,MT.glass,76);b.box(s*.61,.43,-1.77,.21,.10,.45,MT.black,42);b.box(s*.63,.27,-1.77,.21,.08,.45,MT.brass,41);}
 b.box(0,1.05,-1.18,.47,.47,.13,MT.black,42);b.box(0,.99,-1.26,.25,.18,.013,'#ffc889',6);for(const x of[-.17,.17])b.cylinder(x,1.44,-1.28,.06,.06,.018,MT.gold,41,12,PI/2);
 for(const x of[-.4,.4])b.beam([x,.77,-1.76],[x,1.14,-1.68],.015,MT.brass,41,6);
 // Polished handrails, the front lamp, a bell, a slatted cowcatcher.
 for(const s of[-1,1]){b.beam([s*.39,1.19,-.92],[s*.39,1.19,1.38],.020,MT.brass,41,6);for(const z of[-.8,.2,1.2])b.beam([s*.30,1.16,z],[s*.39,1.19,z],.015,MT.brass,41,5);}
 b.cylinder(0,1.68,1.87,.15,.15,.23,MT.black,42,18,PI/2);b.cylinder(0,1.68,2.0,.116,.116,.017,MT.light,10,18,PI/2);mtRing(b,0,1.68,2.02,.137,.018,MT.gold);
 b.cylinder(0,1.61,-.10,.13,.065,.16,MT.gold,41,16);b.beam([-.16,1.64,-.1],[.16,1.64,-.1],.016,MT.brass,41,5);
 for(let i=-5;i<=5;i++)b.beam([i*.08,.51,2.23],[i*.12,.20,2.66-Math.abs(i)*.035],.018,MT.brass,41,5);b.beam([-.62,.20,2.49],[0,.20,2.69],.024,MT.brass,41,5);b.beam([0,.20,2.69],[.62,.20,2.49],.024,MT.brass,41,5);
 // Raised Roman XIII brass numerals, readable without extra label atlas space.
 for(const s of[-1,1]){b.box(s*.635,.94,-1.57,.025,.30,.64,MT.black,42);b.beam([s*.66,.85,-1.79],[s*.66,1.04,-1.66],.012,MT.gold,41,5);b.beam([s*.66,1.04,-1.79],[s*.66,.85,-1.66],.012,MT.gold,41,5);for(let i=0;i<3;i++)b.beam([s*.66,.85,-1.53+i*.08],[s*.66,1.04,-1.53+i*.08],.012,MT.gold,41,5);}
}
function mtTender(b){
 b.box(0,.47,0,.89,.16,2.17,MT.black,42);b.box(0,.85,0,1.02,.67,1.92,MT.plum,40);
 for(const s of[-1,1]){b.box(s*.522,.85,0,.02,.46,1.72,MT.brass,41);b.box(s*.537,.85,0,.015,.40,1.65,MT.plum,40);b.box(s*.544,.72,0,.013,.018,1.59,MT.gold,41);}
 b.box(0,1.19,0,.86,.015,1.65,MT.black,42);for(let i=0;i<30;i++)b.sphere((hash(i,19)-.5)*.75,1.20+hash(i,8)*.12,(hash(i,29)-.5)*1.4,.10,.08,.09,'#333239',42,6,4,true);
 b.cylinder(0,1.27,-.72,.2,.2,.10,MT.brass,41,12);mtBuffers(b,-1.14);mtBuffers(b,1.14);
}
function mtCoach(b,roof=false){
 const lo=-1.83,hi=1.83;
 if(roof){
  for(let i=0;i<14;i++){const a=i*PI/14,q=(i+1)*PI/14,p=(a,z)=>[Math.cos(a)*.63,1.96+Math.sin(a)*.22,z];b.quad(p(a,lo),p(a,hi),p(q,hi),p(q,lo),MT.black,42);}
  b.box(0,2.24,0,.63,.20,2.88,MT.plum,40);for(const s of[-1,1]){for(let i=0;i<8;i++)b.box(s*.324,2.25,-1.22+i*.35,.02,.12,.20,MT.light,6);b.beam([s*.56,2.08,-1.65],[s*.56,2.08,1.65],.02,MT.brass,41,6);}
  b.box(0,2.39,0,.80,.10,3.06,MT.black,42);for(const z of[-1.5,1.5])b.cylinder(0,2.57,z,.055,.055,.24,MT.brass,41,10);return;
 }
 b.box(0,.48,0,.88,.14,4.04,MT.black,42);b.box(0,.67,0,1.12,.10,3.58,MT.wood,22);for(const side of[-1,1])b.box(side*.56,.93,0,.08,.54,3.40,MT.plum,40);
 for(const s of[-1,1]){
  b.beam([s*.40,.42,-1.45],[s*.40,.27,0],.015,MT.brass,41,5);b.beam([s*.40,.27,0],[s*.40,.42,1.45],.015,MT.brass,41,5);
  for(const yy of[.75,1.15,1.82,1.93])b.box(s*.618,yy,0,.023,.028,3.48,MT.gold,41);
  for(let i=0;i<6;i++){const z=-1.39+i*.56;mtCoachWindow(b,s*.607,z,.43,.57,1.49);b.box(s*.625,.96,z,.025,.28,.41,MT.brass,41);b.box(s*.642,.96,z,.011,.235,.355,MT.plum,40);}
  // Upholstered facing seats and miniature brass table lamps.
  for(const z of[-1.12,0,1.12]){b.box(s*.37,.91,z,.34,.18,.50,MT.velvet,23);b.box(s*.37,1.09,z-.22,.34,.37,.07,MT.velvet,23);}
  b.box(s*.47,1.14,0,.19,.05,.34,MT.wood,22);b.cylinder(s*.47,1.31,0,.022,.02,.31,MT.brass,41,8);b.cylinder(s*.47,1.48,0,.10,.05,.16,MT.light,6,10);
 }
 for(const z of[lo,hi]){b.box(0,1.35,z,1.10,1.28,.08,MT.plum,40);b.box(0,1.48,z+Math.sign(z)*.052,.43,.75,.025,MT.glass,76);b.box(0,.64,z+Math.sign(z)*.20,1.12,.10,.37,MT.wood,22);for(const s of[-1,1])mtRail(b,s*.53,z,z+Math.sign(z)*.30,1.22);b.beam([-.51,1.22,z+Math.sign(z)*.32],[.51,1.22,z+Math.sign(z)*.32],.017,MT.brass,41,6);for(let i=-2;i<=2;i++)b.beam([i*.2,.7,z+Math.sign(z)*.32],[i*.2,1.22,z+Math.sign(z)*.32],.012,MT.brass,41,5);mtBuffers(b,z+Math.sign(z)*.32);}
}
function mtWheel(b,r=.38){
 // An annular tire and forged spokes leave genuine air through each driver.
 const n=28,inner=r*.79;
 for(let i=0;i<n;i++){
  const a=i*TAU/n,q=(i+1)*TAU/n,p=(x,r,a)=>[x,Math.cos(a)*r,Math.sin(a)*r];
  b.quad(p(-.036,r,a),p(.036,r,a),p(.036,r,q),p(-.036,r,q),MT.steel,41);
  b.quad(p(.036,r,a),p(.042,inner,a),p(.042,inner,q),p(.036,r,q),MT.plum,40);
  b.quad(p(-.036,inner,a),p(-.036,r,a),p(-.036,r,q),p(-.036,inner,q),MT.black,42);
  b.quad(p(.042,inner,a),p(-.036,inner,a),p(-.036,inner,q),p(.042,inner,q),MT.black,42);
 }
 for(let i=0;i<12;i++){
  const a=i*TAU/12; b.beam([.035,Math.cos(a)*r*.16,Math.sin(a)*r*.16],[.035,Math.cos(a)*inner,Math.sin(a)*inner],.016,MT.plumLight,40,5);
 }
 b.cylinder(.041,0,0,r*.20,r*.20,.094,MT.brass,41,16,0,PI/2);
 b.cylinder(.072,r*.51,0,r*.075,r*.075,.062,MT.gold,41,10,0,PI/2);
}
function mtBogie(b){
 for(const s of[-1,1]){b.box(s*.34,.27,0,.11,.10,.80,MT.black,42);for(let i=0;i<4;i++)b.box(s*.406,.28+i*.024,0,.012,.016,.44-i*.055,MT.steel,41);}b.box(0,.33,0,.62,.07,.49,MT.black,42);
}
function mtGhost(b){
 // Long tapered folds, an irregular hem and a bowed head, all miniature scale.
 const n=24,rows=12,point=(i,j)=>{const a=i*TAU/n,t=j/rows,r=(.13+.36*Math.sin(t*PI*.61))*(1+.035*Math.sin(a*6));return[Math.cos(a)*r,(1-t)*1.43+.05*Math.sin(a*5+.3)*t,Math.sin(a)*r*.73+.09*(1-t)];};
 for(let j=0;j<rows;j++)for(let i=0;i<n;i++)b.quad(point(i,j),point(i+1,j),point(i+1,j+1),point(i,j+1),shade('#b7c8b7',.88+.08*Math.cos(i*TAU/n*6)),76);
 b.sphere(0,1.43,.10,.17,.21,.17,'#b7c8b7',76,12,7);for(const s of[-1,1])b.sphere(s*.061,1.45,.249,.019,.030,.012,'#3c5452',42,7,4);
}

function mtProjectionBody(b,color='#9fd0bf'){
 b.sphere(0,1.36,0,.22,.27,.018,color,84,14,8);
 b.tri([-.22,1.20,0],[.22,1.20,0],[.52,-.95,0],color,84);b.tri([-.22,1.20,0],[.52,-.95,0],[-.56,-.95,0],color,84);
 for(const s of[-1,1]){b.tri([s*.16,1.05,.002],[s*.54,.58,.002],[s*.28,.38,.002],color,84);b.sphere(s*.55,.57,.002,.09,.12,.012,color,84,8,5);}
 for(let i=0;i<7;i++){const x=-.39+i*.13;b.box(x,-.18,.004,.025,1.16,.006,i%2?color:'#7fa99f',84);}
}
function mtProjectionArm(b,color='#a8d8c7'){b.quad([-.04,-.04,0],[.10,-.04,0],[.54,.63,0],[.41,.69,0],color,84);b.sphere(.51,.66,.002,.09,.11,.012,color,84,8,5);}
function mtProjectorBeam(b,color='#86b5aa'){
 const near=.025,far=.30,z0=-.5,z1=.5;for(let i=0;i<8;i++){const a=i*TAU/8,q=(i+1)*TAU/8;b.quad([Math.cos(a)*near,Math.sin(a)*near,z0],[Math.cos(q)*near,Math.sin(q)*near,z0],[Math.cos(q)*far,Math.sin(q)*far,z1],[Math.cos(a)*far,Math.sin(a)*far,z1],color,84);}
}
function mtHauntGlow(b,color){b.sphere(0,0,0,.52,.52,.52,color,84,10,6);b.sphere(0,0,0,.22,.22,.22,color,84,8,5);}
function mtWatchingEyes(b){for(const s of[-1,1]){b.sphere(s*.09,0,0,.032,.021,.008,'#b8e3d0',84,7,4);b.sphere(s*.09,0,.006,.011,.011,.005,'#e6f3ce',84,6,4);}}
function buildMorrowStock(){
 const stock={},make=(key,fn)=>{const b=new Builder();fn(b);stock[key]=b.mesh();};
 try{
  make('engine',b=>mtEngine(b));make('engineRoof',b=>mtEngine(b,true));make('tender',mtTender);make('coach',b=>mtCoach(b));make('coachRoof',b=>mtCoach(b,true));make('driveWheel',b=>mtWheel(b,MORROW_STOCK.driveRadius));make('smallWheel',b=>mtWheel(b,MORROW_STOCK.coachRadius));make('leadingWheel',b=>mtWheel(b,MORROW_STOCK.leadingRadius));make('bogie',mtBogie);make('ghost',mtGhost);
  make('steam',b=>b.sphere(0,0,0,.50,.40,.48,'#abbac0',76,9,6));
  make('clockHand',b=>{b.beam([0,0,0],[0,1,0],.035,MH.iron,41,6);b.sphere(0,0,0,.09,.09,.055,MH.brass,41,10,5);});
  make('batBody',b=>b.sphere(0,0,0,.10,.07,.26,MH.iron,42,8,5));
  make('batWing',b=>{b.tri([0,0,.12],[.9,.09,.08],[.5,-.10,-.30],MH.iron,42);b.tri([0,0,.12],[.5,-.10,-.30],[.26,-.02,-.16],MH.iron,42);});
  make('projectionBright',b=>mtProjectionBody(b,'#a9d9c8'));make('projectionDim',b=>mtProjectionBody(b,'#789e98'));make('projectionArm',b=>mtProjectionArm(b));
  make('projectorBeam',b=>mtProjectorBeam(b));make('glowWarm',b=>mtHauntGlow(b,'#d8b27a'));make('glowCold',b=>mtHauntGlow(b,'#8ec8b7'));make('watchingEyes',mtWatchingEyes);
 }catch(error){for(const mesh of Object.values(stock))disposeMesh(mesh);throw error;}
 return stock;
}
const morrowBuildCollectionStock=buildCollectionStock;
buildCollectionStock=function(){const previous=collectionStock.get('morrow');morrowBuildCollectionStock();const next=buildMorrowStock();if(previous&&collectionStock.get('morrow')===previous)for(const mesh of Object.values(previous))disposeMesh(mesh);collectionStock.set('morrow',next);};
function morrowDrawHaunt(stock,p){
 const t=reduceMotion?0:clock;
 for(const [i,x,y,z,s]of[[0,-25,2.90,12,.65],[1,-28,3.04,10,.48],[2,-30,4.12,-4,.65],[3,27,4.3,-5.3,.34],[4,1.1,7.6,-7.4,.55],[5,5.0,7.6,-7.4,.52]]){
  const sway=reduceMotion?0:Math.sin(t*.53+i*2)*.14;
  draw(stock.ghost,mm(trans(x+sway*.4,y+sway,z),mm(ry(Math.sin(t*.17+i)*.17),scaling(s))),p);
 }
 // The tower runs backwards. The platform clock never gets beyond 11:59.
 const clockBase=trans(-7.5,MORROW.deckY+15.55,-9.45);
 draw(stock.clockHand,mm(clockBase,mm(rz(t*.022-.13),scaling(.65,.82,1))),p);draw(stock.clockHand,mm(clockBase,mm(rz(t*.003-1.1),scaling(.85,.51,1))),p);
 for(let i=0;i<5;i++){
  const a=t*.21+i*1.256,base=mm(trans(-6+Math.cos(a)*8,28+Math.sin(a*2+i)*.7,-14+Math.sin(a)*5),ry(-a));draw(stock.batBody,base,p);
  for(const s of[-1,1])draw(stock.batWing,mm(base,mm(rz(s*(reduceMotion?.3:Math.sin(t*5+i)*.55)),scaling(s,1,1))),p);
 }
 const walk=reduceMotion?.42:(t*.028)%1,processX=mix(-34,-19,smooth(0,1,walk)),processZ=10.8+Math.sin(walk*PI)*2.1;
 draw(stock.ghost,mm(trans(processX,3.12,processZ),mm(ry(-.72+.18*Math.sin(t*.2)),scaling(.42))),p);
 if(p===mainProgram){
  const lamps=[[-1.55,3.85,4.3,0],[7.55,3.85,4.3,2],[-32.8,5.25,-1.22,5],[27,7.6,-5.3,7],[-23,4.3,21,11],[39.3,3.9,17.9,13],[-15.8,4.15,-3.7,17]];
  for(const [x,y,z,seed]of lamps){
   const f=reduceMotion?.88:.76+.20*Math.sin(t*(6.1+seed*.07)+seed)+.09*Math.sin(t*(17.0+seed*.11)+seed*2.3),cold=!reduceMotion&&Math.sin(t*.43+seed*1.7)>.94;
   draw(cold?stock.glowCold:stock.glowWarm,mm(trans(x,y,z),scaling(Math.max(.45,f))),p);
  }
  const projector=[-14.25,7.25,-1.83],target=[1.4,14.15,-10.12],dir=sub(target,projector),mid=mul(add(projector,target),.5),dist=len(dir),flutter=reduceMotion?0:Math.sin(t*7.3)+.43*Math.sin(t*16.7+1.2),visible=reduceMotion||flutter>-1.17;
  if(visible){
   draw(stock.projectorBeam,mm(basis(mid,dir),scaling(.72,.72,dist)),p);
   const s=reduceMotion?2.55:2.48+.08*Math.sin(t*2.1)+.035*Math.sin(t*13.2),projection=flutter>.28?stock.projectionBright:stock.projectionDim;
   draw(projection,mm(trans(target[0]+(reduceMotion?0:.035*Math.sin(t*11)),target[1]+(reduceMotion?0:.045*Math.sin(t*5.7)),target[2]),mm(rz(reduceMotion?-.04:-.04+.018*Math.sin(t*1.3)),scaling(s))),p);
   const wave=reduceMotion?.18:.10+.42*smooth(-1,1,Math.sin(t*.74));draw(stock.projectionArm,mm(trans(target[0]-.28*s,target[1]+.53*s,target[2]+.006),mm(rz(wave),scaling(s*.83))),p);
  }
  const eyePhase=reduceMotion?-1:(t%17);if(eyePhase>12.8&&eyePhase<15.3)draw(stock.watchingEyes,mm(trans(11.1,13.48,-10.14),scaling(1.35)),p);
 }
}
function morrowDrawFormation(scene,train,p){
 const stock=collectionStock.get('morrow');if(!stock)return;const q=MORROW_STOCK,open=cutaway&&p===mainProgram;
 const wheel=(mesh,m,x,y,z,r,phase)=>draw(mesh,mm(m,mm(trans(x,y,z),mm(rx(phase/r),x<0?ry(PI):I))),p);
 const phase=collectionWheelPhase(train)*.305,m=circuitMatrix(train.edge,train.distance);
 draw(stock.engine,m,p);if(!open&&!(viewMode==='cab'&&p===mainProgram))draw(stock.engineRoof,m,p);
 for(const s of[-1,1]){
  for(const z of[-.42,.42])wheel(stock.driveWheel,m,s*.356,q.driveRadius+.065,z,q.driveRadius,phase+(s<0?PI*.5*q.driveRadius:0));
  // Two driven axles, quartered crank pins and a visibly reciprocating rod.
  const a=phase/q.driveRadius+(s<0?PI*.5:0),rod=mm(m,trans(s*.45,q.driveRadius+.065+Math.cos(a)*q.driveRadius*.51,Math.sin(a)*q.driveRadius*.51));
  if(stock.rod)draw(stock.rod,rod,p);
 }
 const lead=circuitMatrix(train.edge,train.distance+1.74);draw(stock.bogie,lead,p);for(const s of[-1,1])for(const z of[-.25,.25])wheel(stock.leadingWheel,lead,s*.356,q.leadingRadius+.065,z,q.leadingRadius,phase);
 const tender=circuitMatrix(train.edge,train.distance-q.tenderOffset);draw(stock.tender,tender,p);for(const s of[-1,1])for(const z of[-.66,.66])wheel(stock.smallWheel,tender,s*.356,q.coachRadius+.065,z,q.coachRadius,phase);
 drawLink(couplingMesh,transform([0,.40,-2.55],m),transform([0,.40,1.39],tender),I,p);
 let previous=tender,previousEnd=-1.39;
 // The public cars count includes the tender. Keep custom stock and map in sync.
 for(let i=0;i<Math.max(0,train.cars-1);i++){
  const d=train.distance-q.firstCoach-i*q.coachSpacing,car=circuitMatrix(train.edge,d);drawLink(couplingMesh,transform([0,.40,previousEnd],previous),transform([0,.40,2.40],car),I,p);previous=car;previousEnd=-2.40;draw(stock.coach,car,p);if(!open)draw(stock.coachRoof,car,p);
  for(const offset of[-1.12,1.12]){const bogie=circuitMatrix(train.edge,d+offset);draw(stock.bogie,bogie,p);for(const s of[-1,1])for(const z of[-.23,.23])wheel(stock.smallWheel,bogie,s*.356,q.coachRadius+.065,z,q.coachRadius,phase);}
 }
 // A small, slow plume, reused from one translucent mesh. It remains below
 // the crypt ceiling and freezes with the reduced-motion preference.
 for(let i=0;i<6;i++){const t=((reduceMotion?0:clock*.18)+i/6)%1,s=.12+Math.sin(t*PI)*.42,base=circuitMatrix(train.edge,train.distance+1.34-t*1.60);if(base[12]>-13&&base[12]<19&&base[14]>-20&&base[14]<-12)continue;draw(stock.steam,mm(base,mm(trans(Math.sin(t*4+i)*.08,2.53+t*1.25,0),scaling(s))),p);}
 morrowDrawHaunt(stock,p);
}
// Add the slim moving rods to the same disposable stock cache.
const morrowBuildStockParts=buildMorrowStock;
buildMorrowStock=function(){const stock=morrowBuildStockParts();try{const b=new Builder();b.box(0,0,0,.035,.042,.99,MT.steel,41);stock.rod=b.mesh();return stock;}catch(error){for(const mesh of Object.values(stock))disposeMesh(mesh);throw error;}};
const morrowDrawHouseTrain=drawHouseTrainFormation;
drawHouseTrainFormation=function(scene,train,p){if(train.stock==='morrow')morrowDrawFormation(scene,train,p);else morrowDrawHouseTrain(scene,train,p);};
