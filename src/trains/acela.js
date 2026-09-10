'use strict';

// Original, selectively compressed first-generation Acela-inspired miniature.
// Public credit: nickfromlater. No downloaded train geometry, logos or textures.
// +Z is the cab end. Wheels belong to the separate, animated bogie assembly.
function acelaHull(b,sections,color,roof=false){
 const profile=(s)=>{const [z,w,lo,hi]=s;return [[-w*.83,lo,z],[w*.83,lo,z],[w,lo+.13,z],[w,hi-.12,z],[w*.78,hi,z],[-w*.78,hi,z],[-w,hi-.12,z],[-w,lo+.13,z]];};
 for(let i=0;i<sections.length-1;i++){
  const a=profile(sections[i]),q=profile(sections[i+1]);
  for(let j=0;j<8;j++){
   if(roof!==(j>=3&&j<=5))continue;
   const k=(j+1)%8;b.quad(a[j],q[j],q[k],a[k],color,40);
  }
 }
 for(const s of[sections[0],sections.at(-1)]){
  const p=profile(s),c=[0,(s[2]+s[3])/2,s[0]];
  for(let j=0;j<8;j++){if(roof!==(j>=3&&j<=5))continue;b.tri(c,p[j],p[(j+1)%8],color,40);}
 }
}
function acelaPowerCar(tail=false){
 const b=new Builder(),paint=trainPaint(),silver=paint.body,blue=paint.coach;
 const sections=[[-2.35,.565,.46,1.64],[.82,.565,.46,1.64],[1.26,.56,.48,1.57],[1.76,.51,.52,1.37],[2.16,.44,.57,1.14],[2.48,.29,.65,.91]];
 acelaHull(b,sections,silver);b.box(0,.425,-.13,1.02,.14,4.47,'#273744',42);
 // Blue shoulder sweeps over the lowered cab and fades into a narrow red sill.
 for(const side of[-1,1]){
  for(let i=0;i<sections.length-1;i++){
   const a=sections[i],q=sections[i+1];
   b.quad([side*(a[1]+.004),a[3]-.13,a[0]],[side*(q[1]+.004),q[3]-.13,q[0]],[side*(q[1]+.005),q[3]-.34,q[0]],[side*(a[1]+.005),a[3]-.34,a[0]],blue,40);
   b.beam([side*a[1]*.96,a[2]+.055,a[0]],[side*q[1]*.96,q[2]+.055,q[0]],.012,'#c24c4c',40,4);
  }
  b.box(side*.572,1.025,-.62,.016,.68,2.16,'#839198',41);
  for(let i=0;i<34;i++)b.box(side*.584,1.025,-1.65+i*.063,.012,.64,.012,'#4d616e',42);
  b.box(side*.573,.92,-2.075,.018,.80,.30,silver,40);
  b.box(side*.586,1.20,-2.075,.014,.22,.20,'#203e51',43);
  b.box(side*.597,.83,-1.955,.022,.15,.018,'#dadbca',41);
  for(let j=0;j<3;j++)b.box(side*.51,.31+j*.07,-2.045,.17,.025,.32,'#738793',41);
  b.push(side*.58,.78,.40,0,side*PI/2);sign(b,'collection-name-acela',0,0,0,.61,.13);b.pop();
  // Cab quarter-light follows the taper, rather than a window on a square box.
  b.quad([side*.565,1.42,.87],[side*.541,1.41,1.27],[side*.536,1.19,1.28],[side*.568,1.20,.87],'#203c51',43);
  b.beam([side*.571,1.12,.85],[side*.55,1.12,1.30],.012,'#c9d2d2',41,5);
  b.box(side*.35,.72,.88,.26,.18,.32,'#243443',23);b.box(side*.35,.96,.73,.27,.39,.10,'#253947',23);
 }
 // Split sloping windscreen, wipers, instrument binnacle, a recessed coupler.
 for(const s of[-1,1]){
  b.quad([s*.038,1.586,1.285],[s*.415,1.586,1.285],[s*.382,1.38,1.79],[s*.034,1.38,1.79],'#19374b',43);
  b.beam([s*.065,1.396,1.792],[s*.31,1.505,1.50],.008,'#a5adb0',41,5);
  stockLamp(b,s*.114,.84,2.492,tail,.041);
  stockLamp(b,s*.34,.66,2.17,tail,.027);
 }
 b.box(0,1.08,1.26,.83,.10,.30,'#263d48',42);
 for(const x of[-.22,.16])b.box(x,1.147,1.29,.17,.025,.12,'#8ac7c9',6);
 b.box(0,.51,2.20,.30,.10,.22,'#1f303a',42);b.box(0,.46,2.36,.12,.10,.19,'#576872',41);
 b.push(0,1.53,1.22,-.38);sign(b,'collection-number-acela',0,0,.065,.23,.12);b.pop();
 b.box(0,.33,-.35,.63,.14,1.4,'#445661',42);
 return b.mesh();
}
function acelaPowerRoof(){
 const b=new Builder(),paint=trainPaint();
 acelaHull(b,[[-2.35,.565,.46,1.64],[.82,.565,.46,1.64],[1.26,.56,.48,1.57],[1.76,.51,.52,1.37],[2.16,.44,.57,1.14],[2.48,.29,.65,.91]],paint.coach,true);
 b.box(0,1.68,-.14,.73,.095,1.60,'#758991',41);
 for(let i=0;i<20;i++)b.box(0,1.734,-.85+i*.072,.67,.014,.030,'#263b49',42);
 for(const z of[-.53,.20]){
  b.cylinder(0,1.758,z,.21,.21,.025,'#344e5a',42,18);
  for(let i=0;i<6;i++){const a=i*PI/3;b.beam([0,1.777,z],[Math.sin(a)*.185,1.777,z+Math.cos(a)*.185],.010,'#acb6b8',41,4);}
 }
 // Insulators, copper bus, articulated collector and its contact shoe.
 for(const x of[-.28,.28])for(const z of[-1.94,-1.34]){
  b.cylinder(x,1.73,z,.045,.041,.18,'#d4c5ac',24,8);
  for(let k=0;k<3;k++)b.cylinder(x,1.69+k*.055,z,.065,.065,.025,'#bda889',24,8);
 }
 b.box(0,1.84,-1.65,.68,.055,.78,'#475b65',41);
 for(const x of[-.16,.16]){
  b.beam([x,1.865,-1.85],[x,2.15,-1.30],.024,'#a35949',41,6);
  b.beam([x,2.15,-1.30],[x,2.49,-1.81],.018,'#ab6250',41,6);
  b.beam([x,1.865,-1.50],[x,2.49,-1.81],.009,'#667983',41,5);
 }
 b.box(0,2.505,-1.81,.97,.026,.065,'#364851',41);
 b.beam([-.32,1.73,-1.08],[-.32,1.73,.80],.013,'#bd8b5d',41,6);
 return b.mesh();
}
function acelaCoach(kind='business'){
 const b=new Builder(),p=trainPaint(),half=2.64;
 b.box(0,.43,0,1.06,.13,5.26,'#354b59',42);b.box(0,.53,0,1.075,.07,5.23,'#a7b4ba',41);
 b.box(0,.31,0,.65,.17,3.62,'#415662',42);
 for(const s of[-1,1]){
  b.box(s*.547,.76,0,.045,.40,5.24,p.body,40);
  b.box(s*.552,1.385,0,.043,.13,5.23,p.body,40);
  b.box(s*.578,.948,0,.012,.045,5.12,p.coach,40);
  b.box(s*.575,.57,0,.014,.025,5.18,'#c24c4c',40);
  b.box(s*.575,.68,0,.014,.014,5.18,'#e0e5de',41);
  for(let i=0;i<10;i++){
   const z=-1.90+i*.423,lit=(i%4===1);
   b.box(s*.552,1.152,z,.048,.355,.387,p.coach,40);
   if(kind!=='cafe'||i<4||i>6)b.box(s*.579,1.155,z,.013,.290,.313,lit?'#81989e':'#28495d',43);
   b.box(s*.585,1.314,z,.009,.012,.312,'#afbdc1',41);
   if(kind!=='cafe'||i<4||i>7){
    b.box(s*.30,.65,z,.30,.11,.28,kind==='first'?'#746f8a':'#365c76',23);
    b.box(s*.30,.86,z-.12,.30,.36,.05,kind==='first'?'#746f8a':'#365c76',23);
    if(i%2===0)b.box(s*.29,.81,z+.14,.34,.028,.20,'#c8c7b4',24);
   }
  }
  for(const z of[-2.34,2.34]){
   b.box(s*.555,.99,z,.051,.84,.30,p.body,40);
   b.box(s*.587,1.165,z,.012,.275,.19,'#25475b',43);
   b.box(s*.586,.77,z+.11,.025,.09,.015,'#cbd5d4',41);
   b.box(s*.566,.485,z,.13,.024,.33,'#9bacb5',41);
  }
  b.push(s*.588,.77,0,0,s*PI/2);sign(b,'collection-name-acela',0,0,0,.63,.11);b.pop();
 }
 for(const z of[-half,half]){
  b.box(0,.95,z,1.055,.93,.035,p.body,40);b.box(0,.96,z*1.018,.60,.75,.12,'#293e4c',42);
  for(let k=0;k<4;k++)b.box(0,.96,z*1.012+Math.sign(z)*k*.026,.65,.80,.012,'#586c76',42);
  b.box(0,.96,z*1.027,.38,.62,.010,'#40515b',42);
 }
 if(kind==='cafe'){
  b.box(.25,.88,.35,.45,.65,1.55,'#b7aa8b',22);b.box(.20,1.22,.35,.61,.05,1.65,'#c5c9c1',24);
  for(const z of[-.14,.32,.77]){b.cylinder(-.29,.61,z,.09,.09,.42,'#334f68',41,8);b.cylinder(-.29,.84,z,.15,.15,.055,'#496c82',23,12);}
 }
 return b.mesh();
}
function acelaCoachRoof(){
 const b=new Builder(),p=trainPaint();
 acelaHull(b,[[-2.65,.571,.46,1.565],[2.65,.571,.46,1.565]],p.body,true);
 for(const z of[-1.82,1.82]){
  b.box(0,1.63,z,.69,.15,.66,'#8298a4',41);
  for(let i=0;i<8;i++)b.box(0,1.708,z-.27+i*.075,.58,.013,.021,'#344e5e',42);
 }
 for(const s of[-1,1])b.beam([s*.33,1.591,-2.5],[s*.33,1.591,2.5],.012,'#bcc9ce',41,5);
 return b.mesh();
}

// A native collection extension, loaded after trains.js and before startup.
// Existing models and their geometry paths are deliberately left untouched.
const ACELA_COLLECTION={id:'acela',name:'Acela',number:'2009',family:'acela',power:'electric',arrangement:'Bo–Bo',tag:'Silver through the city',service:'Northeast express',formation:'coaches',cars:6,description:'A sculpted silver express with two tapered power cars, six passenger coaches and an articulated roof collector. An original Acela-inspired miniature, not an Amtrak asset or endorsement.',details:['Two power cars, business coaches, cafe and first class','Turning bogies, spinning axles and removable roofs','Split windscreens, louvers, insulators and pantographs'],credits:[{name:'nickfromlater',platform:'github',handle:'nickfromlater',note:'Original Acela-inspired geometry.'}],liveries:[['Northeast silver','#c5cdd0','#d2dae0','#25475d'],['Midnight demonstrator','#9aaeb9','#dce4da','#263647'],['Pearl & Atlantic','#e1e3da','#d5c49a','#4c7381']]};
TRAIN_COLLECTION.push(ACELA_COLLECTION);collectionById.set(ACELA_COLLECTION.id,ACELA_COLLECTION);
const acelaOriginalDefault=collectionDefault;
collectionDefault=function(room){return validateCollectionChoice(HOUSE_ROOMS[room]?.defaultCollection)||acelaOriginalDefault(room);};
const acelaOriginalOffsets=collectionOffsets;
collectionOffsets=function(choice){
 if(choice.id!=='acela')return acelaOriginalOffsets(choice);
 const key='acela:'+choice.cars;if(collectionOffsetCache.has(key))return collectionOffsetCache.get(key);
 const out=[0];for(let i=0;i<choice.cars;i++)out.push(5.35+i*5.65);
 if(choice.cars>0)out.push(out.at(-1)+5.35);
 collectionOffsetCache.set(key,out);return out;
};
const acelaOriginalGeometry=collectionGeometry;
collectionGeometry=function(choice){
 if(choice.id!=='acela')return acelaOriginalGeometry(choice);
 const saved={mesh:Builder.prototype.mesh,paint:trainPaint,seed};
 Builder.prototype.mesh=function(){return {data:new Float32Array(this.data),count:this.data.length/12};};
 try{
  seed=86492;const paint=collectionPaint(choice);trainPaint=()=>paint;
  const parts=collectionBogieParts(),b=new Builder();b.cylinder(0,0,.5,.025,.025,1,'#6f8590',41,8,PI/2);parts.coupling=b.mesh();
  parts.motor=acelaPowerCar();parts.tailMotor=acelaPowerCar(true);parts.trailer=acelaCoach();parts.first=acelaCoach('first');parts.cafe=acelaCoach('cafe');
  parts.motorRoof=acelaPowerRoof();parts.tailRoof=acelaPowerRoof();parts.trailerRoof=acelaCoachRoof();return parts;
 }finally{Builder.prototype.mesh=saved.mesh;trainPaint=saved.paint;seed=saved.seed;}
};
const acelaOriginalDraw=drawSelectedCollection;
drawSelectedCollection=function(choice,matrixAt,p,phase=0,stock=ensureRunningCollection(choice),open=cutaway&&p===mainProgram){
 if(choice.id!=='acela')return acelaOriginalDraw(choice,matrixAt,p,phase,stock,open);
 const ds=collectionOffsets(choice),models=[],ends=[];
 for(let i=0;i<ds.length;i++){
  const tail=choice.cars>0&&i===ds.length-1,power=i===0||tail,m=matrixAt(ds[i]),body=tail?mm(m,ry(PI)):m;
  models.push(m);ends.push(power?2.45:2.755);
  draw(power?(tail?stock.tailMotor:stock.motor):i===choice.cars?stock.first:i===3&&choice.cars>=4?stock.cafe:stock.trailer,body,p);
  if(!open&&!(i===0&&viewMode==='cab'&&p===mainProgram))draw(power?(tail?stock.tailRoof:stock.motorRoof):stock.trailerRoof,body,p);
  const spread=power?1.45:1.83;
  for(const z of[-spread,spread]){
   const bogie=matrixAt(ds[i]-z);draw(stock.bogie,bogie,p);
   for(const zz of[-.22,.22])draw(stock.axle,mm(bogie,mm(trans(0,.186,zz),rx(phase*.305/.17))),p);
  }
 }
 for(let i=1;i<models.length;i++)drawLink(stock.coupling,transform([0,.29,-ends[i-1]],models[i-1]),transform([0,.29,ends[i]],models[i]),I,p);
};
// Authored room defaults own their running meshes just like an explicit cabinet
// selection. Keep only actual occupants, not every possible room default.
pruneRunningCollection=function(){
 const occupants=[...Object.values(selectedCollection),...[...roomScenes.values()].flatMap(scene=>scene.trains.filter(t=>t.collectionChoice).map(t=>t.collectionChoice))];
 const used=new Set(occupants.map(q=>q.id+':'+q.livery));
 for(const [key,stock]of runningCollectionMeshes)if(!used.has(key)){for(const mesh of Object.values(stock))if(mesh?.vao)disposeMesh(mesh);runningCollectionMeshes.delete(key);}
};
