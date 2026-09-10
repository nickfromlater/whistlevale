'use strict';

// Original, selectively compressed first-generation Acela-inspired miniature.
// Public credit: nickfromlater. No downloaded train geometry, logos or textures.
// +Z is the cab end. Wheels belong to the separate, animated bogie assembly.
const ACELA_POWER_SECTIONS=[[-2.35,.56,.46,1.64],[-2.15,.565,.46,1.64],[.54,.565,.46,1.64],[.99,.559,.47,1.628],[1.26,.548,.48,1.574],[1.55,.526,.50,1.46],[1.83,.485,.525,1.32],[2.06,.424,.56,1.18],[2.27,.352,.60,1.06],[2.44,.267,.665,.96],[2.50,.205,.70,.87]];
function acelaHull(b,sections,color,roof=false){
 const profile=(s)=>{const [z,w,lo,hi]=s;return [[-w*.83,lo,z],[w*.83,lo,z],[w,lo+.13,z],[w,hi-.18,z],[w*.93,hi-.075,z],[w*.68,hi,z],[-w*.68,hi,z],[-w*.93,hi-.075,z],[-w,hi-.18,z],[-w,lo+.13,z]];};
 for(let i=0;i<sections.length-1;i++){
  const a=profile(sections[i]),q=profile(sections[i+1]);
  for(let j=0;j<10;j++){
   if(roof!==(j>=3&&j<=7))continue;
   const k=(j+1)%10;b.quad(a[j],q[j],q[k],a[k],color,40);
  }
 }
 for(const s of[sections[0],sections.at(-1)]){
  const p=profile(s),c=[0,(s[2]+s[3])/2,s[0]];
  for(let j=0;j<10;j++){if(roof!==(j>=3&&j<=7))continue;b.tri(c,p[j],p[(j+1)%10],color,40);}
 }
}
function acelaPowerCar(tail=false){
 const b=new Builder(),paint=trainPaint(),silver=paint.body,blue=paint.coach;
 const sections=ACELA_POWER_SECTIONS;
 acelaHull(b,sections,silver);b.box(0,.425,-.13,1.02,.14,4.47,'#273744',42);
 // Blue shoulder sweeps over the lowered cab and fades into a narrow red sill.
 for(const side of[-1,1]){
  for(let i=0;i<sections.length-1;i++){
   const a=sections[i],q=sections[i+1];
   b.quad([side*(a[1]+.004),a[3]-.18,a[0]],[side*(q[1]+.004),q[3]-.18,q[0]],[side*(q[1]+.005),q[3]-.34,q[0]],[side*(a[1]+.005),a[3]-.34,a[0]],blue,40);
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
 // Compound-curve glazing follows the nose surface, with a central mullion.
 const glass=[[1.18,1.603,.388],[1.39,1.536,.373],[1.60,1.447,.348],[1.79,1.354,.319]];
 for(const side of[-1,1]){
  for(let i=0;i<glass.length-1;i++){
   const a=glass[i],q=glass[i+1];b.quad([side*.028,a[1],a[0]],[side*a[2],a[1]-.040,a[0]],[side*q[2],q[1]-.037,q[0]],[side*.027,q[1],q[0]],'#153244',43);
  }
  b.beam([side*.056,1.368,1.773],[side*.26,1.497,1.435],.008,'#a3b1b7',41,5);
  b.beam([side*.04,1.610,1.175],[side*.39,1.571,1.175],.012,'#aebdc0',41,5);
  stockLamp(b,side*.108,.805,2.511,tail,.041);
  stockLamp(b,side*.30,.68,2.25,tail,.030);
  b.beam([side*.52,.64,1.39],[side*.435,.66,1.89],.012,'#94a6ad',41,5);
  // Recessed equipment cabinets, latches, skirt seams and underbody cables.
  for(let i=0;i<4;i++){
   const z=-1.20+i*.39;b.box(side*.482,.387,z,.035,.14,.31,'#647986',41);
   b.box(side*.505,.41,z+.10,.012,.055,.024,'#b8c4bf',41);
  }
  for(const z of[-1.79,-.82,.59])b.box(side*.572,.735,z,.006,.22,.010,'#788e98',41);
  b.beam([side*.30,.29,-1.25],[side*.30,.29,.50],.026,'#263e4a',42,6);
 }
 b.quad([-.25,.64,2.38],[.25,.64,2.38],[.13,.43,2.32],[-.13,.43,2.32],'#405e6e',42);
 b.box(0,1.08,1.26,.83,.10,.30,'#263d48',42);
 for(const x of[-.22,.16])b.box(x,1.147,1.29,.17,.025,.12,'#8ac7c9',6);
 b.box(0,.53,2.32,.24,.12,.15,'#152c38',42);b.box(0,.49,2.43,.12,.09,.15,'#80939b',41);
 b.box(0,.49,2.517,.18,.12,.035,'#4f6b79',41);
 b.push(0,1.30,1.90,-.49);sign(b,'collection-number-acela',0,0,.065,.23,.12);b.pop();
 b.box(0,.33,-.35,.63,.14,1.4,'#445661',42);
 return b.mesh();
}
function acelaPowerRoof(){
 const b=new Builder(),paint=trainPaint();
 acelaHull(b,ACELA_POWER_SECTIONS,paint.coach,true);
 for(const z of[-2.23,-1.10,.71])b.box(0,1.649,z,.73,.018,.015,'#849daa',41);
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
 b.box(.23,1.703,.64,.13,.10,.21,'#bdc7be',41);b.beam([.23,1.75,.64],[.23,1.97,.64],.010,'#839aa2',41,5);
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
  for(const y of[.615,.715,.82])b.box(s*.573,y,0,.008,.009,5.18,'#99afb5',41);
  for(const z of[-2.11,2.11])b.box(s*.587,.974,z,.011,.82,.012,'#778e9b',41);
  b.box(s*.365,1.409,0,.21,.034,3.94,'#bec7be',24);
  for(const z of[-1.42,.28,1.53])b.box(s*.40,1.448,z,.13,.069,.20,'#5f767e',23);
  for(let i=0;i<10;i++){
   const z=-1.90+i*.423,lit=(i%4===1);
   b.box(s*.552,1.152,z,.048,.355,.387,p.coach,40);
   if(kind!=='cafe'||i<4||i>6)b.box(s*.579,1.155,z,.013,.290,.313,lit?'#81989e':'#28495d',43);
   b.box(s*.585,1.314,z,.009,.012,.312,'#afbdc1',41);
   if(i%3===0)b.box(s*.588,1.156,z-.10,.008,.27,.026,'#839aa0',23);
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
  for(let j=0;j<4;j++){const z=-1.12+j*.74;b.box(s*.417,.328,z,.19,.16,.62,'#607782',41);b.box(s*.517,.332,z,.015,.087,.42,'#3b5665',42);for(let k=0;k<4;k++)b.box(s*.530,.335,z-.16+k*.105,.008,.063,.017,'#9baeb1',41);}
  b.push(s*.588,.77,0,0,s*PI/2);sign(b,'collection-name-acela',0,0,0,.63,.11);b.pop();
 }
 for(const z of[-half,half]){
  b.box(0,.95,z,1.055,.93,.035,p.body,40);b.box(0,.96,z*1.018,.60,.75,.12,'#293e4c',42);
  for(let k=0;k<4;k++)b.box(0,.96,z*1.012+Math.sign(z)*k*.026,.65,.80,.012,'#586c76',42);
  b.box(0,.96,z*1.027,.38,.62,.010,'#40515b',42);
  for(const x of[-.24,.24])b.beam([x,.50,z],[x,1.25,z],.014,'#95a9ab',41,5);
  b.box(0,.503,z*1.026,.43,.047,.14,'#a5b5b4',41);
  b.box(-.35,1.12,z*.961,.16,.24,.029,'#bec7c0',24);
 }
 if(kind==='cafe'){
  b.box(.25,.88,.35,.45,.65,1.55,'#b7aa8b',22);b.box(.20,1.22,.35,.61,.05,1.65,'#c5c9c1',24);
  b.box(.31,1.36,-.15,.24,.22,.28,'#405d6d',41);b.cylinder(.14,1.294,.24,.05,.05,.10,'#ddd6bd',24,8);
  for(const z of[-.14,.32,.77]){b.cylinder(-.29,.61,z,.09,.09,.42,'#334f68',41,8);b.cylinder(-.29,.84,z,.15,.15,.055,'#496c82',23,12);}
 }
 return b.mesh();
}
function acelaCoachRoof(){
 const b=new Builder(),p=trainPaint();
 acelaHull(b,[[-2.65,.516,.46,1.52],[-2.40,.571,.46,1.565],[2.40,.571,.46,1.565],[2.65,.516,.46,1.52]],p.body,true);
 for(let z=-2.28;z<2.4;z+=.56)b.box(0,1.571,z,.74,.010,.010,'#899faa',41);
 for(const z of[-1.82,1.82]){
  b.box(0,1.63,z,.69,.15,.66,'#8298a4',41);
  for(let i=0;i<8;i++)b.box(0,1.708,z-.27+i*.075,.58,.013,.021,'#344e5e',42);
 }
 for(const s of[-1,1])b.beam([s*.33,1.591,-2.5],[s*.33,1.591,2.5],.012,'#bcc9ce',41,5);
 return b.mesh();
}

// The Acela has its own visible suspension. The shared axle mesh still owns
// all wheels, so wheel motion and gauge cannot diverge from the railway.
function acelaBogie(){
 const b=new Builder(),steel='#6b818b',dark='#263e4b';b.box(0,.264,0,.54,.12,.77,dark,42);
 for(const side of[-1,1]){
  b.box(side*.425,.241,0,.09,.12,.78,steel,41);
  b.box(side*.432,.284,0,.10,.07,.27,'#a1b1b1',41);
  for(const z of[-.22,.22]){
   b.box(side*.42,.215,z,.15,.14,.18,'#4a6270',41);b.cylinder(side*.505,.214,z,.051,.051,.027,'#a8b8b6',41,12,0,PI/2);
   for(let j=0;j<3;j++)b.cylinder(side*.35,.329+j*.022,z,.06,.06,.014,'#9caaa8',41,8);
   b.box(side*.255,.14,z+.12,.046,.16,.08,'#9aa9aa',41);
  }
  b.cylinder(side*.28,.38,0,.125,.125,.12,dark,42,12);
  for(const y of[.339,.364,.389,.414])b.cylinder(side*.28,y,0,.13,.13,.012,'#5e7480',42,12);
  b.beam([side*.48,.34,-.30],[side*.48,.28,.18],.023,'#a0b4b7',41,6);
  b.beam([side*.48,.34,-.3],[side*.48,.317,-.13],.033,'#4b6b7b',41,6);
 }
 b.box(0,.43,0,.43,.11,.28,'#637983',41);return b.mesh();
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
  const parts=collectionBogieParts(),b=new Builder();parts.bogie=acelaBogie();b.cylinder(0,0,.5,.025,.025,1,'#6f8590',41,8,PI/2);parts.coupling=b.mesh();
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
