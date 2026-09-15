'use strict';

// SOLSTICE / observation stock. A continuous ivory shell, bronze reveals and
// genuinely clear panoramic glazing around a furnished, usable interior.
// Load and guide tyres share the original beam contact geometry.
const SAFARI_STOCK={spacing:4.46,bogieSpread:1.26,loadRadius:.20,guideRadius:.12,halfWidth:.69,end:2.11,seat:[.08,1.53,.30]};
const SAFARI_TRAIN_PALETTE={ivory:'#e4d9be',jade:'#31594a',bronze:'#ad8f55',rubber:'#2b3931',wood:'#94734c',linen:'#c7c7a4'};
function safariWindow(b,side,z0,z1){
 const P=SAFARI_TRAIN_PALETTE,lo=1.045,hi=1.945,r=.085;
 const loop=[];
 for(const [z,y,start]of[[z1-r,hi-r,0],[z0+r,hi-r,PI/2],[z0+r,lo+r,PI],[z1-r,lo+r,PI*1.5]])for(let i=0;i<=3;i++){
  const a=start+i*PI/6;loop.push([z+Math.cos(a)*r,y+Math.sin(a)*r]);
 }
 // The same rounded aperture is both exterior glass and the actual seat view.
 const x=y=>side*(.680-(y-lo)*.043),mid=(lo+hi)/2,zc=(z0+z1)/2;
 for(let i=0;i<loop.length;i++){
  const [z,y]=loop[i],[zz,yy]=loop[(i+1)%loop.length],outer=(z,y)=>[x(y)+side*.008,mid+(y-mid)*1.044,zc+(z-zc)*1.045];
  b.tri([x(mid),mid,zc],[x(y),y,z],[x(yy),yy,zz],'#879c8c',76);
  b.quad([x(y)+side*.012,y,z],[x(yy)+side*.012,yy,zz],outer(zz,yy),outer(z,y),P.bronze,41);
 }
 // Deep warm inner reveal, a rubber seal and a low wooden window ledge.
 b.box(side*.626,1.011,zc,.12,.075,z1-z0+.07,P.wood,22);
 b.box(side*.619,1.058,zc,.035,.014,z1-z0-.07,'#c6ac79',22);
}
function safariSeat(b,x,z,reverse=false){
 const P=SAFARI_TRAIN_PALETTE;b.push(x,.725,z,0,reverse?PI:0);
 b.box(0,.075,0,.15,.15,.26,P.rubber,42);
 b.box(0,.20,.04,.40,.13,.48,P.linen,23);
 b.box(0,.405,-.20,.41,.46,.105,P.jade,23);
 b.box(0,.425,-.138,.35,.34,.037,'#a3af89',23);
 b.box(0,.65,-.19,.41,.083,.11,P.jade,23);
 for(const side of[-1,1]){b.box(side*.223,.25,-.06,.034,.36,.032,P.bronze,41);b.box(side*.223,.434,.015,.056,.044,.38,P.wood,22);}
 b.pop();
}
function safariCarHull(b,roof=false,cab=false){
 const P=SAFARI_TRAIN_PALETTE,front=cab?1.48:2.03,back=-2.03;
 if(roof){
  // Barrel roof with two wide, optically clear skylight bays and rounded eaves.
  const strips=12,zs=[back,-1.65,-.55,-.35,.73,.94,front];
  const point=(a,z)=>[Math.cos(a)*.673,1.956+Math.sin(a)*.268,z];
  for(let j=0;j+1<zs.length;j++)for(let i=0;i<strips;i++){
   const a=i*PI/strips,q=(i+1)*PI/strips,glass=(j===1||j===3)&&i>=4&&i<8;
   b.quad(point(a,zs[j]),point(a,zs[j+1]),point(q,zs[j+1]),point(q,zs[j]),glass?'#9dac98':P.ivory,glass?76:40);
  }
  for(const z of[-1.66,-.54,-.36,.74])for(let i=3;i<9;i++)b.quad(point(i*PI/strips,z-.012),point((i+1)*PI/strips,z-.012),point((i+1)*PI/strips,z+.012),point(i*PI/strips,z+.012),P.bronze,41);
  for(const side of[-1,1]){
   b.box(side*.610,1.95,(back+front)/2,.063,.11,front-back,P.wood,22);
   b.box(side*.58,1.908,(back+front)/2,.020,.018,front-back-.10,'#e4c88c',6);
   b.beam([side*.54,2.10,back],[side*.54,2.10,front],.013,P.bronze,41,5);
  }
  if(cab){
   const rings=[[front,.673,1.956,.268],[1.86,.555,1.89,.225],[2.17,.29,1.72,.14]],point=(r,a)=>[Math.cos(a)*r[1],r[2]+Math.sin(a)*r[3],r[0]];
   for(let j=0;j<2;j++)for(let i=0;i<strips;i++)b.quad(point(rings[j],i*PI/strips),point(rings[j+1],i*PI/strips),point(rings[j+1],(i+1)*PI/strips),point(rings[j],(i+1)*PI/strips),P.ivory,40);
   for(let i=0;i<strips;i++)b.tri([0,1.72,2.17],point(rings[2],i*PI/strips),point(rings[2],(i+1)*PI/strips),P.ivory,40);
  }
  return;
 }
 // A chamfered, two-tone lower shell runs uninterrupted past the power bogies.
 const levels=[[.50,.49],[.62,.645],[.78,.689],[1.025,.681]];
 for(const side of[-1,1])for(let i=1;i<levels.length;i++){
  const a=levels[i-1],q=levels[i];b.quad([side*a[1],a[0],back],[side*a[1],a[0],front],[side*q[1],q[0],front],[side*q[1],q[0],back],i===1?P.jade:P.ivory,40);
 }
 b.box(0,.635,(back+front)/2,1.18,.13,front-back,P.rubber,42);
 b.box(0,.707,(back+front)/2,1.20,.065,front-back-.03,P.wood,22);
 // Floorboards, a moss-green aisle runner and brass thresholds.
 for(let i=0;i<7;i++){const x=(i-3)*.165;b.quad([x-.004,.744,back+.06],[x-.004,.744,front-.06],[x+.004,.744,front-.06],[x+.004,.744,back+.06],'#654f37',22);}
 b.box(0,.747,-.1,.32,.009,3.72,'#536650',23);
 for(const z of[-1.91,front-.07])b.box(0,.754,z,1.20,.012,.040,P.bronze,41);
 for(const side of[-1,1]){
  b.box(side*.687,.866,(back+front)/2,.011,.060,front-back-.015,P.jade,40);
  b.box(side*.692,.912,(back+front)/2,.014,.012,front-back-.04,P.bronze,41);
  b.box(side*.638,1.990,(back+front)/2,.083,.074,front-back,P.ivory,40);
  for(const [z0,z1]of[[-1.78,-.62],[-.51,.65],[.76,front-.08]])safariWindow(b,side,z0,z1);
  for(const z of[-1.97,-.565,.704,front-.01])b.box(side*.654,1.495,z,.066,.95,z===-1.97?.10:.060,P.ivory,40);
  // Restrained ventilation grilles and a bronze acacia emblem.
  for(const z of[-1.32,1.05])for(let i=0;i<5;i++)b.box(side*.697,.799,z+(i-2)*.045,.008,.032,.017,'#6c7762',42);
  b.push(side*.700,.953,-1.17,0,side*PI/2);
  b.quad([-.005,-.049,.004],[.005,-.049,.004],[.005,.030,.004],[-.005,.030,.004],P.jade,40);
  for(let k=-2;k<=2;k++){const x=k*.025,y=.052-Math.abs(k)*.009;b.tri([-.005,.002,.004],[x-.005,y,.004],[x+.007,y,.004],P.jade,40);}
  b.pop();
 }
 // Observation seats and small window tables are real cabin geometry.
 for(const side of[-1,1]){
  for(const z of[-1.15,.24])safariSeat(b,side*.385,z);
  if(!cab)safariSeat(b,side*.385,1.42,true);
  b.box(side*.46,.985,.91,.31,.034,.28,'#c9ac78',22);
  b.box(side*.46,.855,.91,.027,.26,.027,P.bronze,41);
  b.cylinder(side*.46,1.046,.91,.038,.031,.087,'#e6dbc0',23,8);
  b.box(side*.445,1.008,.83,.15,.008,.095,'#cfc8a6',23);
  b.box(side*.445,1.014,.83,.105,.003,.012,P.jade,0);
 }
 // End vestibules have glazed doors, not solid dark rectangles across the view.
 const end=(z)=>{
  b.box(0,1.30,z,1.25,1.17,.058,P.ivory,40);
  b.box(0,1.25,z+Math.sign(z)*.032,.41,1.02,.023,P.jade,40);
  b.quad([-.17,1.20,z+Math.sign(z)*.046],[.17,1.20,z+Math.sign(z)*.046],[.17,1.80,z+Math.sign(z)*.046],[-.17,1.80,z+Math.sign(z)*.046],'#718c7a',43);
  b.box(.145,1.173,z+Math.sign(z)*.065,.025,.13,.025,P.bronze,41);
  b.box(0,.54,z+Math.sign(z)*.13,.20,.14,.23,P.rubber,42);
 };
 end(back);
 if(cab){
  // A faceted wraparound windscreen meets the tapered nose and glazed roof.
  const rings=[[front,.679,.69,1.955],[1.86,.558,.75,1.89],[2.17,.29,.96,1.72]];
  for(let j=0;j<2;j++){
   const a=rings[j],q=rings[j+1];
   for(const side of[-1,1]){
    b.quad([side*a[1],a[2],a[0]],[side*q[1],q[2],q[0]],[side*q[1],1.09,q[0]],[side*a[1],1.09,a[0]],P.ivory,40);
    b.quad([side*a[1],1.09,a[0]],[side*q[1],1.09,q[0]],[side*q[1]*.99,q[3],q[0]],[side*a[1]*.99,a[3],a[0]],'#869b8a',76);
    b.beam([side*a[1],1.085,a[0]],[side*q[1],1.085,q[0]],.020,P.jade,40,6);
    b.beam([side*a[1]*.99,a[3],a[0]],[side*q[1]*.99,q[3],q[0]],.018,P.ivory,40,5);
   }
   b.quad([-a[1],a[2],a[0]],[-q[1],q[2],q[0]],[q[1],q[2],q[0]],[a[1],a[2],a[0]],P.jade,40);
  }
  b.quad([-.29,.96,2.17],[.29,.96,2.17],[.29,1.09,2.17],[-.29,1.09,2.17],P.ivory,40);
  b.quad([-.29,1.09,2.17],[.29,1.09,2.17],[.287,1.72,2.17],[-.287,1.72,2.17],'#869b8a',76);
  b.box(0,1.073,2.182,.35,.031,.022,'#f0dbb0',10);
  for(const side of[-1,1]){b.box(side*.42,1.045,1.996,.135,.035,.040,'#e9d6a2',10);b.beam([side*.278,1.105,2.183],[side*.08,1.55,2.184],.006,P.rubber,42,4);}
  b.box(0,1.16,1.69,.83,.12,.32,P.jade,40);
  for(const x of[-.20,.20]){b.box(x,1.224,1.66,.20,.015,.11,'#9ea886',6);b.cylinder(x,1.24,1.57,.020,.020,.035,P.bronze,41,6);}
  b.box(0,.80,1.32,.25,.17,.31,P.rubber,42);
 }else end(front);
}
function safariBogieFrame(b){
 const P=SAFARI_TRAIN_PALETTE;
 for(const side of[-1,1]){
  b.box(side*.446,.00,0,.13,.77,.71,P.rubber,42);
  b.box(side*.44,-.365,0,.16,.10,.79,P.jade,40);
  // A rounded ivory equipment capsule wraps the guide truck. The bottom
  // corners turn inward rather than reading as rectangular hanging panels.
  const profile=[[-.47,.35],[.47,.35],[.47,-.14],[.40,-.27],[.25,-.32],[-.25,-.32],[-.40,-.27],[-.47,-.14]];
  const outer=([z,y])=>[side*(.617+.024*(y+.32)/.67),y,z];
  for(let i=0;i<profile.length;i++){
   const a=outer(profile[i]),q=outer(profile[(i+1)%profile.length]),mid=[side*.628,.05,0];
   b.tri(mid,a,q,P.ivory,40);
   b.quad(a,[side*.41,a[1],a[2]], [side*.41,q[1],q[2]],q,P.jade,40);
  }
  b.box(side*.646,.16,0,.008,.021,.60,P.bronze,41);
  for(const z of[-.24,-.12,0,.12,.24])b.quad([side*.646,-.061,z-.009],[side*.646,-.061,z+.009],[side*.646,.061,z+.009],[side*.646,.061,z-.009],'#607660',42);
  b.cylinder(side*.40,.411,0,.052,.052,.19,P.bronze,41,8);
 }
 b.box(0,.457,0,.99,.14,.68,P.rubber,42);b.cylinder(0,.558,0,.18,.18,.063,'#959881',41,12);
}
function safariLoadWheel(b){
 b.cylinder(0,0,0,.20,.20,.21,'#293c32',42,20,0,PI/2);
 for(const side of[-1,1]){b.cylinder(side*.110,0,0,.104,.104,.025,'#a1a58d',41,8,0,PI/2);for(let i=0;i<5;i++){const a=i*TAU/5;b.tri([side*.124,0,0],[side*.124,Math.sin(a-.10)*.085,Math.cos(a-.10)*.085],[side*.124,Math.sin(a+.10)*.085,Math.cos(a+.10)*.085],'#607461',41);}}
}
function safariGuideWheel(b){b.cylinder(0,0,0,.12,.12,.11,'#334738',42,12);b.cylinder(0,.061,0,.065,.065,.015,'#acaa88',41,8);b.beam([-.05,.072,0],[.05,.072,0],.006,'#6f7b61',41,4);}
function buildSafariStock(){
 const parts={},make=(name,fn)=>{const b=new Builder();fn(b);parts[name]=b.mesh();};
 try{
  make('motor',b=>safariCarHull(b,false,true));make('motorRoof',b=>safariCarHull(b,true,true));make('trailer',b=>safariCarHull(b));make('trailerRoof',b=>safariCarHull(b,true));
  make('bogie',safariBogieFrame);make('loadWheel',safariLoadWheel);make('guideWheel',safariGuideWheel);
 }catch(error){for(const mesh of Object.values(parts))disposeMesh(mesh);throw error;}
 return parts;
}
const safariBuildCollectionStock=buildCollectionStock;
buildCollectionStock=function(){safariBuildCollectionStock();collectionStock.set('safari',buildSafariStock());};
function safariCarMatrix(train,index){return circuitMatrix(train.edge,train.distance-index*SAFARI_STOCK.spacing);}
// Camera and visible carriage use the identical transform. World-space lag
// would push the eye through the glazing on curves, so only look angles ease.
function safariPassengerPose(train,side=1,yaw=.17,pitch=-.035){
 const index=Math.min(1,train.cars),m=safariCarMatrix(train,index),eye=[side*SAFARI_STOCK.seat[0],SAFARI_STOCK.seat[1],SAFARI_STOCK.seat[2]];
 const direction=[side*Math.cos(yaw)*Math.cos(pitch),Math.sin(pitch),Math.sin(yaw)*Math.cos(pitch)];
 return {position:transform(eye,m),target:transform(add(eye,mul(direction,24)),m),car:index,localEye:eye};
}
function safariDrawFormation(scene,train,p){
 const stock=collectionStock.get('safari');if(!stock)return;
 const passenger=typeof safariPassengerActive==='function'&&safariPassengerActive(),open=cutaway&&!passenger&&p===mainProgram,travel=collectionWheelPhase(train)*.305,models=[],count=train.cars+1;
 for(let i=0;i<count;i++){
  const d=train.distance-i*SAFARI_STOCK.spacing,m=safariCarMatrix(train,i),tail=i===count-1,cab=i===0||tail,body=tail?mm(m,ry(PI)):m;
  models.push(m);draw(cab?stock.motor:stock.trailer,body,p);
  if(!open&&!(i===0&&viewMode==='cab'&&p===mainProgram))draw(cab?stock.motorRoof:stock.trailerRoof,body,p);
  for(const offset of[-SAFARI_STOCK.bogieSpread,SAFARI_STOCK.bogieSpread]){
   const bogie=circuitMatrix(train.edge,d+offset);draw(stock.bogie,bogie,p);
   for(const zz of[-.24,.24])draw(stock.loadWheel,mm(bogie,mm(trans(0,.14,zz),rx(-travel/SAFARI_STOCK.loadRadius))),p);
   for(const side of[-1,1])for(const zz of[-.27,.27])draw(stock.guideWheel,mm(bogie,mm(trans(side*.406,-.27,zz),ry(side*travel/SAFARI_STOCK.guideRadius))),p);
  }
 }
 for(let i=1;i<models.length;i++){const a=transform([0,.59,-2.09],models[i-1]),q=transform([0,.59,2.09],models[i]);drawLink(couplingMesh,a,q,I,p);}
}
const safariDrawHouseTrain=drawHouseTrainFormation;
drawHouseTrainFormation=function(scene,train,p){if(train.stock==='safari')safariDrawFormation(scene,train,p);else safariDrawHouseTrain(scene,train,p);};
