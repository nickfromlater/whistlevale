'use strict';

// Solstice: purpose-built straddle-beam stock for The Rift Skyway. This is not
// a cabinet railcar variant: its load tyres run on the beam and horizontal
// guide tyres hold both sides. The existing stock cache owns every GPU mesh.
const SAFARI_STOCK={spacing:4.46,bogieSpread:1.26,loadRadius:.20,guideRadius:.12,halfWidth:.69,end:2.11};
function safariCarHull(b,roof=false,cab=false){
 const cream='#e4d6b5',jade='#365d50',trim='#b3975e',glass='#648b83';
 if(roof){
  // Elliptical roof barrel with pale shoulder strips and a glazed central band.
  const seg=16,length=cab?3.76:4.02;
  for(let i=0;i<seg;i++){
   const a=i*PI/seg,q=(i+1)*PI/seg,p=(t,z)=>[Math.cos(t)*.68,1.79+Math.sin(t)*.255,z];
   b.quad(p(a,-2.0),p(a,length-2.0),p(q,length-2.0),p(q,-2.0),i>4&&i<11?glass:cream,i>4&&i<11?43:40);
  }
  for(const z of[-1.83,-.96,-.09,.78,1.63])b.beam([-.47,1.984,z],[.47,1.984,z],.012,trim,41,6);
  for(const x of[-.55,.55])b.beam([x,1.94,-1.98],[x,1.94,cab?1.62:1.98],.018,cream,40,6);
  if(cab){
   const p=(a,z,r,y)=>[Math.cos(a)*.68*r,y+Math.sin(a)*.255*r,z];
   for(let i=0;i<16;i++){
    const a=i*PI/16,q=(i+1)*PI/16;
    b.quad(p(a,1.75,1,1.79),p(a,2.23,.46,1.49),p(q,2.23,.46,1.49),p(q,1.75,1,1.79),cream,40);
    b.tri([0,1.49,2.23],p(q,2.23,.46,1.49),p(a,2.23,.46,1.49),cream,40);
   }
  }
  return;
 }
 // A slim floating-looking sill still has a real floor and exposed straddle frame.
 b.box(0,.62,0,1.23,.105,4.10,'#485548',42);b.box(0,.707,-.08,1.20,.075,3.90,'#bda078',22);
 for(const side of[-1,1]){
  b.box(side*.636,.887,-.07,.089,.32,3.96,cream,40);
  b.box(side*.683,1.049,-.07,.016,.049,3.98,trim,41);
  b.box(side*.683,.767,-.07,.022,.055,3.95,jade,40);
  b.box(side*.625,.54,0,.104,.09,3.9,jade,40);
  // Glazing follows the gently tucked-in shoulders, with genuine open interior.
  const pane=(z0,z1)=>b.quad([side*.682,1.085,z0],[side*.682,1.085,z1],[side*.624,1.79,z1],[side*.624,1.79,z0],glass,43);
  for(let i=0;i<4;i++){
   const z0=-1.85+i*.87,z1=z0+.77;pane(z0,z1);
   b.beam([side*.686,1.05,z0-.038],[side*.622,1.80,z0-.038],.023,cream,40,6);
  }
  b.beam([side*.625,1.796,-1.99],[side*.625,1.796,cab?1.45:2.01],.032,cream,40,7);
  // The end door is separate from the uninterrupted observation windows.
  b.box(side*.646,1.265,-1.90,.040,1.03,.29,jade,40);b.box(side*.674,1.39,-1.90,.024,.54,.20,glass,43);
  b.box(side*.704,1.08,-1.83,.018,.10,.017,trim,41);
  for(const zz of[-1.2,.5])b.box(side*.695,.90,zz,.022,.054,.54,jade,40);
  b.push(side*.699,.91,.42,0,side*PI/2);hudsonText(b,'SOLSTICE',0,0,0,.81,jade);b.pop();
 }
 // Upholstered facing seats, timber tables and a visible driver desk under cutaway.
 for(const side of[-1,1])for(const zz of[-1.2,-.38,.48,1.24]){
  if(cab&&zz>1)continue;
  b.box(side*.38,.87,zz,.37,.10,.39,'#c3a76b',23);b.box(side*.38,1.07,zz-.16,.38,.40,.07,jade,23);
  b.box(side*.38,.77,zz,.14,.13,.22,'#6e6b52',41);
 }
 for(const zz of[-.79,.90]){b.box(0,.987,zz,.055,.5,.055,trim,41);b.box(0,1.24,zz,.46,.040,.29,'#d5c297',22);}
 b.box(0,1.247,-2.05,1.17,1.12,.055,jade,40);b.box(0,1.395,-2.085,.64,.63,.027,glass,43);
 b.box(0,.56,-2.18,.19,.14,.29,'#586655',42);
 if(cab){
  // Six flat sections make a clean, sculpted panoramic nose rather than a sphere.
  const rings=[{z:1.54,w:.68,low:.73,high:1.81},{z:1.99,w:.55,low:.77,high:1.74},{z:2.23,w:.32,low:.91,high:1.49}];
  for(let j=0;j<2;j++){
   const a=rings[j],q=rings[j+1];
   for(const side of[-1,1]){
    b.quad([side*a.w,a.low,a.z],[side*q.w,q.low,q.z],[side*q.w,1.07,q.z],[side*a.w,1.07,a.z],cream,40);
    b.quad([side*a.w,1.10,a.z],[side*q.w,1.10,q.z],[side*q.w*.9,q.high,q.z],[side*a.w*.9,a.high,a.z],glass,43);
    b.beam([side*a.w,1.078,a.z],[side*q.w,1.078,q.z],.017,trim,41,6);
   }
   b.quad([-a.w*.9,a.high,a.z],[a.w*.9,a.high,a.z],[q.w*.9,q.high,q.z],[-q.w*.9,q.high,q.z],glass,43);
   b.quad([-a.w,a.low,a.z],[-q.w,q.low,q.z],[q.w,q.low,q.z],[a.w,a.low,a.z],jade,40);
  }
  const q=rings[2];b.quad([-q.w,q.low,q.z],[q.w,q.low,q.z],[q.w,1.10,q.z],[-q.w,1.10,q.z],cream,40);
  b.quad([-q.w,1.10,q.z],[q.w,1.10,q.z],[q.w*.9,q.high,q.z],[-q.w*.9,q.high,q.z],glass,43);
  b.box(0,1.068,2.241,.40,.033,.025,'#f4dba5',10);b.box(0,.95,2.242,.17,.036,.018,jade,40);
  b.box(0,1.19,1.43,.95,.12,.34,'#57604b',42);
  for(const x of[-.22,.22]){b.box(x,1.257,1.41,.19,.014,.12,'#9eac83',6);b.cylinder(x+.01,1.26,1.28,.023,.023,.03,trim,41,6);}
  b.beam([-.07,1.105,2.263],[.20,1.39,2.193],.006,'#34483c',42,5);
 }else{
  b.box(0,1.247,2.04,1.17,1.12,.055,jade,40);b.box(0,1.395,2.075,.64,.63,.027,glass,43);b.box(0,.56,2.18,.19,.14,.29,'#586655',42);
 }
}
function safariBogieFrame(b){
 // The middle below y=.4 stays empty: that volume is occupied by the guide beam.
 for(const side of[-1,1]){
  b.box(side*.45,-.045,0,.15,.84,.73,'#455347',42);
  b.box(side*.45,-.45,0,.21,.13,.91,'#385044',42);
  b.cylinder(side*.45,.445,0,.058,.058,.14,'#a7946d',41,8);
  // An enamel fairing encloses the guide mechanism, leaving the inner face and
  // tyres exposed. The silhouette reads as a beamway vehicle, not long legs.
  b.box(side*.56,-.015,0,.16,.73,.87,'#cfc39e',40);
  b.box(side*.568,.342,0,.19,.10,.94,'#e4d6b5',40);
  b.box(side*.566,-.37,0,.17,.055,.88,'#365d50',40);
  for(const z of[-.23,-.11,.01,.13,.25])b.box(side*.646,-.08,z,.010,.17,.037,'#576452',42);
 }
 b.box(0,.47,0,1.05,.13,.73,'#4a5d4f',42);b.cylinder(0,.568,0,.20,.20,.070,'#a4a38c',41,14);
}
function safariLoadWheel(b){
 b.cylinder(0,0,0,.20,.20,.21,'#293c32',42,24,0,PI/2);
 for(const side of[-1,1]){b.cylinder(side*.110,0,0,.104,.104,.025,'#a1a58d',41,16,0,PI/2);for(let i=0;i<5;i++){const a=i*TAU/5;b.beam([side*.124,0,0],[side*.124,Math.sin(a)*.085,Math.cos(a)*.085],.008,'#607461',41,5);}}
}
function safariGuideWheel(b){
 b.cylinder(0,0,0,.12,.12,.11,'#334738',42,16);b.cylinder(0,.061,0,.065,.065,.015,'#acaa88',41,12);
 b.beam([-.05,.072,0],[.05,.072,0],.006,'#6f7b61',41,4);
}
function buildSafariStock(){
 const parts={},make=(name,fn)=>{const b=new Builder();fn(b);parts[name]=b.mesh();};
 try{
  make('motor',b=>safariCarHull(b,false,true));make('motorRoof',b=>safariCarHull(b,true,true));
  make('trailer',b=>safariCarHull(b));make('trailerRoof',b=>safariCarHull(b,true));
  make('bogie',safariBogieFrame);make('loadWheel',safariLoadWheel);make('guideWheel',safariGuideWheel);
 }catch(error){for(const mesh of Object.values(parts))disposeMesh(mesh);throw error;}
 return parts;
}
const safariBuildCollectionStock=buildCollectionStock;
buildCollectionStock=function(){safariBuildCollectionStock();collectionStock.set('safari',buildSafariStock());};
function safariDrawFormation(scene,train,p){
 const stock=collectionStock.get('safari');if(!stock)return;
 const open=cutaway&&p===mainProgram,travel=collectionWheelPhase(train)*.305,models=[],count=train.cars+1;
 for(let i=0;i<count;i++){
  const d=train.distance-i*SAFARI_STOCK.spacing,m=circuitMatrix(train.edge,d),tail=i===count-1,cab=i===0||tail,body=tail?mm(m,ry(PI)):m;
  models.push(m);draw(cab?stock.motor:stock.trailer,body,p);
  if(!open&&!(i===0&&viewMode==='cab'&&p===mainProgram))draw(cab?stock.motorRoof:stock.trailerRoof,body,p);
  for(const offset of[-SAFARI_STOCK.bogieSpread,SAFARI_STOCK.bogieSpread]){
   const bogie=circuitMatrix(train.edge,d+offset);draw(stock.bogie,bogie,p);
   for(const zz of[-.24,.24])draw(stock.loadWheel,mm(bogie,mm(trans(0,.14,zz),rx(-travel/SAFARI_STOCK.loadRadius))),p);
   for(const side of[-1,1])for(const zz of[-.27,.27])draw(stock.guideWheel,mm(bogie,mm(trans(side*.406,-.27,zz),ry(side*travel/SAFARI_STOCK.guideRadius))),p);
  }
 }
 for(let i=1;i<models.length;i++){
  const a=transform([0,.59,-2.09],models[i-1]),q=transform([0,.59,2.09],models[i]);drawLink(couplingMesh,a,q,I,p);
 }
}
const safariDrawHouseTrain=drawHouseTrainFormation;
drawHouseTrainFormation=function(scene,train,p){if(train.stock==='safari')safariDrawFormation(scene,train,p);else safariDrawHouseTrain(scene,train,p);};
