'use strict';

// The collection shares a gauge and working motion, but each railway has its own stock.
const TRAIN_ROSTER={
 valley:{name:'Nightingale',number:'07',service:'The Alder Valley local',type:'tender steam'},
 coast:{name:'Tern',number:'14',service:'The Tidewater local',type:'side-tank steam',body:'#286369',line:'#d4c390',wheel:'#3c4b47',coach:'#38747a'},
 studio:{name:'Wren',number:'03',service:'The workshop local',type:'saddle-tank steam',body:'#b58a43',line:'#ead2a1',wheel:'#644337',coach:'#886443'},
 alpine:{name:'Bergwald',number:'12',service:'The Bergwald express',type:'electric railcar',body:'#a54438',line:'#e3cf9d',coach:'#aa4e40'}
};
const collectionStock=new Map();

// Train plates live in the original label atlas, so portable exports stay self-contained.
const collectionInitLabels=initLabels;
initLabels=function(){
 collectionInitLabels();
 for(const key of['coast','studio','alpine']){
  const q=TRAIN_ROSTER[key];
  label('stock-'+key,q.name.toUpperCase(),246,48,q.body,q.line,29,true);
  label('stock-number-'+key,q.number,70,66,q.body,q.line,42,true);
 }
};

function stockLamp(b,x,y,z,rear=false,r=.068){
 const s=Math.sign(z)||1;
 b.cylinder(x,y,z,r*1.28,r*1.28,.075,'#29312d',42,20,PI/2);
 ringZ(b,x,y,z+s*.041,r*.88,r*1.19,.014,'#c5bb92',41,20);
 b.cylinder(x,y,z+s*.052,r*.85,r*.85,.008,rear?'#bb4936':'#ffe2aa',10,20,PI/2);
 b.box(x,y+r*1.30,z,.056,.028,.040,'#29312d',42);
}

function stockBuffers(b,z,width=.35){
 const s=Math.sign(z);
 b.box(0,.354,z,.98,.18,.105,'#953f32',40);
 for(const x of[-width,width]){
  b.cylinder(x,.355,z+s*.10,.045,.054,.18,'#38413a',42,14,PI/2);
  b.cylinder(x,.355,z+s*.19,.087,.087,.031,'#a6aca0',41,22,PI/2);
 }
 b.beam([0,.30,z],[0,.27,z+s*.23],.027,'#758072',41,8);
 ringZ(b,0,.27,z+s*.23,.036,.056,.029,'#9fa695',41,16);
 // Hanging vacuum hose, bent below the buffer beam rather than a rigid pipe.
 b.beam([.18,.32,z],[.20,.19,z+s*.085],.013,'#363c34',42,8);
 b.beam([.20,.19,z+s*.085],[.14,.16,z+s*.10],.013,'#363c34',42,8);
}

function stockGauge(b,x,y,z,r){
 ringZ(b,x,y,z,r,r+.013,.029,'#c7b27d',41,20);
 b.cylinder(x,y,z-.018,r,r,.008,'#e6dcc3',0,20,PI/2);
 b.beam([x,y,z-.025],[x+r*.48,y+r*.39,z-.025],.004,'#303c35',42,5);
}

function stockTankEngine(key,roof=true){
 const b=new Builder(),q=TRAIN_ROSTER[key],saddle=key==='studio',black='#26332e',steel='#b0b7a6';
 b.box(0,.355,.05,.89,.13,3.11,black,42);
 for(const s of[-1,1]){
  b.box(s*.43,.52,.17,.19,.065,2.53,black,42);
  b.box(s*.529,.536,.17,.017,.021,2.54,q.line,41);
  b.box(s*.36,.35,-.16,.08,.16,1.78,black,42);
 }
 stockBuffers(b,-1.53);stockBuffers(b,1.62);
 // The same three quartered driving axles as the valley engine, without a tender.
 b.cylinder(0,.982,.29,.305,.310,1.91,black,42,40,PI/2);
 if(saddle){
  // A curved saddle tank wraps over the boiler, with visibly separate end plates.
  for(let j=0;j<24;j++){
   const a=-PI*.55+j*PI*1.1/24,c=a+PI*1.1/24;
   const pt=(angle,z)=>[Math.sin(angle)*.408,1.002+Math.cos(angle)*.397,z];
   b.quad(pt(a,-.54),pt(a,.83),pt(c,.83),pt(c,-.54),q.body,40);
   for(const z of[-.54,.83])b.tri([0,1.002,z],pt(a,z),pt(c,z),q.body,40);
  }
  for(const z of[-.46,.75])ringZ(b,0,1.002,z,.405,.416,.015,q.line,41,40);
  b.cylinder(0,1.425,.43,.101,.101,.038,q.line,41,20);
 }else{
  b.cylinder(0,.982,.22,.309,.311,1.75,q.body,40,40,PI/2);
  for(const s of[-1,1]){
   b.box(s*.341,.875,-.05,.263,.49,1.69,q.body,40);
   b.box(s*.341,1.135,-.05,.281,.036,1.73,'#335951',40);
   for(const y of[.682,1.07])b.box(s*.48,y,-.05,.012,.012,1.52,q.line,41);
   for(const z of[-.79,.69])b.box(s*.48,.876,z,.012,.386,.012,q.line,41);
   b.cylinder(s*.34,1.174,.43,.076,.076,.042,q.line,41,18);
   b.beam([s*.474,1.17,-.62],[s*.474,1.17,.60],.012,q.line,41,8);
  }
 }
 // A dark exposed smokebox, copper cap and a small useful amount of polished brass.
 b.cylinder(0,.982,1.148,.324,.324,.255,black,42,40,PI/2);
 b.cylinder(0,.982,1.289,.298,.298,.029,'#334139',42,40,PI/2);
 ringZ(b,0,.982,1.308,.268,.293,.018,steel,41,36);
 b.sphere(0,.982,1.326,.263,.263,.025,black,40,28,14);
 b.beam([-.073,.982,1.36],[.073,.982,1.36],.013,q.line,41,8);
 b.beam([0,.91,1.36],[0,1.055,1.36],.013,q.line,41,8);
 for(const y of[.86,1.10])b.box(-.243,y,1.337,.071,.025,.026,steel,41);
 b.cylinder(0,1.393,1.03,.120,.094,.285,black,42,30);
 b.cylinder(0,1.569,1.03,.094,.139,.09,black,40,30);
 b.cylinder(0,1.632,1.03,.148,.148,.040,'#b58151',41,32);
 b.cylinder(0,1.656,1.03,.109,.109,.004,'#101e19',42,28);
 b.cylinder(0,1.370,-.16,.129,.109,.125,q.line,41,24);
 b.sphere(0,1.439,-.16,.110,.081,.110,q.line,41,20,10);
 b.cylinder(-.091,1.477,-.47,.022,.022,.17,q.line,41,12);
 b.cylinder(.064,1.443,-.47,.029,.026,.10,q.line,41,12);
 for(const s of[-1,1]){
  b.cylinder(s*.475,.345,1.115,.109,.109,.36,q.body,40,24,PI/2);
  ringZ(b,s*.475,.345,1.308,.076,.106,.021,steel,41,20);
  for(const y of[.278,.415])b.beam([s*.573,y,.28],[s*.573,y,1.02],.014,steel,41,8);
  b.beam([s*.43,.75,-.55],[s*.54,.55,-.42],.019,'#b68150',41,8);
  b.beam([s*.54,.55,-.42],[s*.54,.50,1.09],.018,'#b68150',41,8);
  for(const z of[-.70,-.15,.40])for(let i=0;i<12;i++){
   const a=i*PI/12,c=(i+1)*PI/12;
   b.quad([s*.37,.325+Math.sin(a)*.339,z+Math.cos(a)*.339],[s*.52,.325+Math.sin(a)*.339,z+Math.cos(a)*.339],[s*.52,.325+Math.sin(c)*.339,z+Math.cos(c)*.339],[s*.37,.325+Math.sin(c)*.339,z+Math.cos(c)*.339],q.body,40);
  }
  b.push(s*(saddle?.407:.487),saddle?1.09:.876,-.035,0,s*PI/2);
  b.box(0,0,0,.54,.122,.022,q.line,41);sign(b,'stock-'+key,0,0,.016,.50,.097);b.pop();
 }
 // Open cab, low rear bunker and a handful of irregular coal lumps.
 b.box(0,.566,-1.055,.86,.07,.91,'#796244',22);
 b.box(0,.73,-1.429,.87,.33,.12,q.body,40);
 b.box(0,.79,-1.30,.75,.023,.29,'#1d2924',42);
 for(let i=0;i<24;i++){const x=rnd(-.33,.33),z=rnd(-1.40,-1.17);b.sphere(x,.815+rnd(0,.035),z,.045,.038,.047,'#343a31',42,6,4,true);}
 for(const s of[-1,1]){
  b.box(s*.429,.804,-1.06,.059,.41,.88,q.body,40);
  b.box(s*.429,1.454,-1.06,.061,.098,.88,q.body,40);
  for(const z of[-1.48,-.65])b.box(s*.428,1.20,z,.054,.46,.055,q.body,40);
  b.box(s*.464,1.017,-1.06,.020,.029,.82,q.line,41);
  b.push(s*.463,.82,-1.06,0,s*PI/2);sign(b,'stock-number-'+key,0,0,0,.24,.225);b.pop();
  b.beam([s*.46,.63,-1.5],[s*.46,1.36,-1.5],.014,q.line,41,8);
  for(let j=0;j<2;j++)b.box(s*.50,.43-j*.14,-1.36,.21,.031,.30,black,42);
  b.box(s*.29,.903,-1.07,.16,.042,.17,'#875c3d',23);
 }
 b.box(0,.915,-.655,.80,.61,.046,q.body,40);
 for(const x of[-.392,0,.392])b.box(x,1.312,-.655,.038,.244,.04,q.body,40);
 b.box(0,1.446,-.655,.83,.05,.05,q.body,40);
 b.box(0,.891,-.697,.42,.40,.08,black,42);
 b.cylinder(0,.783,-.75,.10,.10,.018,'#d38b43',10,20,PI/2);
 ringZ(b,0,.783,-.765,.085,.116,.019,'#79664b',41,20);
 stockGauge(b,-.19,1.154,-.714,.061);stockGauge(b,.16,1.162,-.714,.052);
 b.beam([-.13,1.13,-.74],[.20,1.23,-.92],.017,q.line,41,8);
 for(const s of[-1,1]){b.beam([s*.24,.78,-.731],[s*.24,1.08,-.731],.012,q.line,41,8);ringZ(b,s*.24,.984,-.75,.036,.049,.013,'#a44832',40,14);}
 if(roof){b.push(0,0,-1.065);barrelRoof(b,.99,.99,1.499,'#253b36');b.box(0,1.806,0,.26,.033,.31,'#546052',41);for(const x of[-.558,.558])b.box(x,1.51,0,.02,.037,1.02,q.line,41);b.pop();}
 stockLamp(b,0,1.33,1.42,false,.069);stockLamp(b,-.29,.955,-1.51,true,.043);
 return b.mesh();
}

function stockCoach(key,tail=false){
 const b=new Builder(),q=TRAIN_ROSTER[key],studio=key==='studio',cream=studio?'#d7c29a':'#e2d6b5';
 const length=studio?2.20:2.65,half=length/2,windows=studio?5:6,pitch=(length-.24)/windows;
 b.box(0,.36,0,.91,.12,length,'#30443c',42);b.box(0,.44,0,.83,.046,length-.12,'#a88b60',22);
 for(const s of[-1,1]){
  b.box(s*.426,.686,0,.061,.44,length-.14,q.coach,studio?22:40);
  b.box(s*.428,.936,0,.072,.045,length-.11,cream,0);
  b.box(s*.428,1.366,0,.075,.071,length-.11,cream,0);
  for(const y of[.501,.858])b.box(s*.465,y,0,.012,.014,length-.23,q.line,41);
  for(let i=0;i<=windows;i++)b.box(s*.431,1.149,-half+.12+i*pitch,.065,.412,.037,cream,0);
  for(let i=0;i<windows;i++){
   const z=-half+.12+(i+.5)*pitch;
   b.box(s*.464,.675,z,.012,.315,pitch-.10,studio?'#9e784d':'#3f7877',studio?22:40);
   b.box(s*.31,.573,z,.22,.10,pitch*.66,studio?'#806753':'#a57860',23);
   b.box(s*.387,.722,z,.041,.28,pitch*.66,studio?'#6d614e':'#886352',23);
   if(i%3===1){b.sphere(s*.27,.820,z,.042,.051,.042,'#c7a480',0,8,5);b.sphere(s*.27,.723,z,.051,.074,.038,i%2?'#7c8c7b':'#8e7761',23,8,5);}
   if(!studio){b.box(s*.395,1.202,z-pitch*.33,.03,.22,.027,'#c0af8d',23);b.box(s*.395,1.202,z+pitch*.33,.03,.22,.027,'#c0af8d',23);}
  }
  b.push(s*.48,.674,0,0,s*PI/2);sign(b,'stock-'+key,0,0,0,.69,.105);b.pop();
  b.beam([s*.27,.32,-half+.27],[s*.27,.18,0],.011,'#858f7d',41,8);b.beam([s*.27,.18,0],[s*.27,.32,half-.27],.011,'#858f7d',41,8);
 }
 for(const s of[-1,1]){
  const z=s*(half-.072);
  b.box(0,.84,z,.83,.77,.044,q.coach,40);
  b.box(0,1.28,z,.83,.17,.044,cream,0);
  b.box(0,.969,z+s*.031,.28,.99,.02,cream,0);b.box(0,.89,z+s*.045,.233,.80,.014,q.coach,40);
  b.box(0,1.174,z+s*.056,.18,.26,.011,'#8a9c85',6);
  b.box(0,.43,s*(half+.083),.82,.050,.22,'#746547',22);
  for(const x of[-.37,.37]){b.beam([x,.43,s*(half+.17)],[x,1.06,s*(half+.17)],.013,q.line,41,8);for(let j=0;j<2;j++)b.box(x*1.20,.32-j*.12,s*(half-.01),.18,.027,.23,'#43554a',42);}
  b.beam([-.37,1.06,s*(half+.17)],[.37,1.06,s*(half+.17)],.013,q.line,41,8);
  b.beam([-.37,.74,s*(half+.17)],[.37,.74,s*(half+.17)],.009,q.line,41,6);
  b.beam([0,.28,s*half],[0,.28,s*(half+.25)],.022,'#88947d',41,8);
 }
 b.cylinder(0,.26,0,.081,.081,.44,'#36473b',42,16,PI/2);
 if(tail)for(const x of[-.31,.31])stockLamp(b,x,1.056,-half-.19,true,.038);
 return b.mesh();
}

function stockCoachRoof(key){
 const b=new Builder(),studio=key==='studio',length=studio?2.24:2.70;
 barrelRoof(b,.985,length,1.409,studio?'#5b6052':'#61766f');
 if(!studio){
  // A narrow clerestory makes the coastal coaches readable even at room scale.
  b.box(0,1.704,0,.28,.102,length-.35,'#dae0bf',0);
  for(const s of[-1,1])for(let i=0;i<6;i++)b.box(s*.145,1.712,(i-2.5)*.32,.012,.053,.20,'#516e63',43);
  b.push(0,1.764,0,0,0,0,1,.20,1);barrelRoof(b,.29,length-.27,0,'#49625b');b.pop();
 }else for(const z of[-.69,0,.69]){b.cylinder(0,1.738,z,.035,.042,.070,'#b6b18e',41,12);b.sphere(0,1.78,z,.066,.022,.066,'#798375',41,12,6);}
 for(const x of[-.57,.57])b.box(x,1.427,0,.017,.026,length,'#c7c3a0',41);
 return b.mesh();
}

function stockElectricBody(b,trailer=false,workshop=false){
 const q=TRAIN_ROSTER.alpine,paint=workshop?'#b39a60':q.body,cream='#e6d6ae',length=trailer?2.70:3.16,half=length/2;
 b.box(0,.343,0,.91,.14,length-.10,'#35423c',42);b.box(0,.427,0,.84,.046,length-.22,'#ad9371',22);
 b.box(0,.253,-.15,.57,.15,.74,'#49554a',42);
 for(const s of[-1,1]){
  b.box(s*.425,.670,0,.067,.435,length-.20,paint,40);
  b.box(s*.424,.917,0,.079,.055,length-.19,cream,0);
  b.box(s*.424,1.392,0,.079,.096,length-.24,cream,0);
  b.box(s*.464,.508,0,.012,.023,length-.27,q.line,41);
  const n=trailer?5:6,pitch=(length-.35)/n;
  for(let i=0;i<=n;i++)b.box(s*.425,1.151,-half+.18+i*pitch,.066,.42,.041,cream,0);
  for(let i=0;i<n;i++){
   const z=-half+.18+(i+.5)*pitch;
   // Tall open apertures reveal the seats and warm wood trim, even with the roof on.
   b.box(s*.455,1.05,z,.011,.014,pitch-.07,'#9a9b80',41);
   if(i>0&&i<n-1){b.box(s*.28,.571,z,.23,.105,.23,'#698377',23);b.box(s*.38,.731,z,.054,.27,.23,'#586e65',23);if(i===2){b.sphere(s*.26,.820,z,.042,.050,.042,'#ceae88',0,8,5);b.sphere(s*.26,.720,z,.052,.076,.040,'#967e59',23,8,5);}}
  }
  for(const z of[-half+.37,half-.38]){
   b.box(s*.467,.716,z,.012,.338,.029,q.line,41);
   b.beam([s*.486,.63,z-.085],[s*.486,1.22,z-.085],.012,'#c4cbb7',41,8);
   for(let j=0;j<2;j++)b.box(s*.48,.369-j*.11,z,.17,.026,.30,'#737e6a',41);
  }
  b.push(s*.472,.710,0,0,s*PI/2);sign(b,'stock-alpine',0,0,0,.73,.14);b.pop();
 }
 for(const s of[-1,1]){
  const z=s*(half-.10),nose=s*(half+.035);
  b.box(0,.69,z,.82,.43,.15,paint,40);
  b.box(0,.938,z,.84,.044,.145,cream,0);b.box(0,1.394,z,.84,.08,.132,cream,0);
  for(const x of[-.398,0,.398])b.box(x,1.164,z,.040,.414,.11,cream,0);
  // A slight sloped apron and wipers give the blunt heritage cab a precise face.
  b.quad([-.40,.46,nose],[.40,.46,nose],[.42,.58,z+s*.07],[-.42,.58,z+s*.07],paint,40);
  for(const x of[-.214,.214]){
   b.beam([x,.966,z+s*.062],[x+.08,1.176,z+s*.069],.008,'#2f4037',42,6);
   stockLamp(b,x,.79,nose,s<0,.047);
  }
  if(!trailer)stockLamp(b,0,1.355,nose,s<0,.046);
  b.box(0,.391,nose,.81,.080,.055,'#829181',41);
  b.beam([0,.29,nose],[0,.29,nose+s*.18],.037,'#929c88',41,8);
  ringZ(b,0,.29,nose+s*.18,.034,.055,.028,'#a4ac98',41,16);
  for(const x of[-.30,.30])b.cylinder(x,.36,nose+s*.07,.060,.060,.095,'#5b695a',42,16,PI/2);
  b.box(0,.903,z-s*.16,.69,.061,.24,'#606f61',42);
  for(const x of[-.22,.17])stockGauge(b,x,.952,z-s*.16,.036);
  b.beam([.10,.94,z-s*.17],[.10,1.056,z-s*.23],.012,'#b5ad8e',41,7);
  b.box(.10,1.057,z-s*.24,.084,.018,.035,'#344338',42);
  b.box(-.18,.623,z-s*.37,.21,.052,.20,'#735d4b',23);b.box(-.18,.746,z-s*.47,.21,.20,.041,'#735d4b',23);
 }
}

function stockElectricRoof(b,trailer=false,workshop=false){
 const length=trailer?2.74:3.20;
 barrelRoof(b,1.00,length,1.444,'#586b63');
 for(const x of[-.572,.572])b.box(x,1.465,0,.025,.027,length,'#bcbfa4',41);
 if(trailer){for(const z of[-.7,0,.7]){b.cylinder(0,1.776,z,.047,.047,.065,'#99a18b',41,12);b.sphere(0,1.814,z,.077,.021,.077,'#647869',41,12,5);}return;}
 // Porcelain insulators, resistor bank and copper bus remain distinct from the collector.
 for(const x of[-.24,.24])for(const z of[-.42,.60]){
  b.cylinder(x,1.798,z,.048,.041,.15,'#c1bb99',0,14);
  for(const y of[1.758,1.80,1.84])b.cylinder(x,y,z,.063,.063,.015,'#d6ccaa',0,14);
 }
 b.box(0,1.897,.09,.55,.040,1.13,'#718574',41);
 b.box(0,1.759,-1.01,.42,.10,.62,'#7d8672',42);
 for(let i=0;i<9;i++)b.box(0,1.82,-1.265+i*.064,.42,.041,.023,'#a6ad96',41);
 b.beam([.26,1.867,-1.13],[.26,1.867,.61],.012,'#b78654',41,8);
 b.cylinder(.27,1.807,.94,.045,.045,.19,'#d0c5a2',0,14);
 const base=1.934,top=workshop?2.10:2.58,middle=(base+top)/2,span=workshop?.48:.42,center=.12;
 // Two parallel diamond linkages; a folded collector belongs on the workshop board.
 for(const x of[-.15,.15]){
  for(const s of[-1,1]){
   b.beam([x,base,center],[x,middle,center+s*span],.017,'#9e6250',41,8);
   b.beam([x,middle,center+s*span],[x,top,center],.017,'#9e6250',41,8);
   b.cylinder(x,middle,center+s*span,.034,.034,.046,'#c1bd9b',41,12,0,PI/2);
  }
 }
 b.beam([-.15,base,center],[.15,base,center],.025,'#97a08b',41,8);
 b.beam([-.38,top,center],[.38,top,center],.023,'#b6bca3',41,10);
 b.beam([-.45,top-.045,center],[.45,top-.045,center],.018,'#56665a',42,8);
 b.beam([-.45,top-.045,center],[-.50,top-.13,center],.016,'#84917d',41,8);
 b.beam([.45,top-.045,center],[.50,top-.13,center],.016,'#84917d',41,8);
}

function stockElectric(trailer=false,workshop=false,roof=false){
 const b=new Builder();if(roof)stockElectricRoof(b,trailer,workshop);else stockElectricBody(b,trailer,workshop);return b.mesh();
}

// Upgrade the little mountain service in Alder Valley too. Its legacy renderer expects
// a complete mesh; annex formations below use separate roofs and swivelling bogies.
makeMountainRailcar=function(trailer=false){
 const b=new Builder(),scale=trailer?2.40/2.70:2.95/3.16;
 b.push(0,0,0,0,0,0,1,1,scale);stockElectricBody(b,trailer);stockElectricRoof(b,trailer);
 for(const z of[-(trailer?.86:1.03),trailer?.86:1.03]){b.push(0,0,z);for(const axle of[-.22,.22])smallAxle(b,axle,.17,.66);b.box(0,.215,0,.67,.08,.72,'#415245',42);b.pop();}b.pop();return b.mesh();
};

function buildCollectionStock(){
 for(const q of collectionStock.values())for(const mesh of Object.values(q))if(mesh&&typeof mesh.count==='number')disposeMesh(mesh);
 collectionStock.clear();const previousSeed=seed,previousPaint=trainPaint;
 try{
  for(const key of['coast','studio']){
   seed=key==='coast'?141414:30303;
   trainPaint=()=>TRAIN_ROSTER[key];
   collectionStock.set(key,{loco:stockTankEngine(key),cab:stockTankEngine(key,false),wheels:makeWheels(),coach:stockCoach(key),tail:stockCoach(key,true),roof:stockCoachRoof(key)});
  }
  for(const key of['alpine','workshop']){const workshop=key==='workshop';collectionStock.set(key,{motor:stockElectric(false,workshop),trailer:stockElectric(true,workshop),motorRoof:stockElectric(false,workshop,true),trailerRoof:stockElectric(true,workshop,true)});}
 }finally{seed=previousSeed;trainPaint=previousPaint;}
}
const collectionBuildTrains=buildTrains;
buildTrains=function(){collectionBuildTrains();buildCollectionStock();};

function drawCollectionMotion(m,phase,p,wheels=wheelMesh,mechanism=null){
 const rod=mechanism?.rod||rodMesh,joint=mechanism?.joint||jointMesh,piston=mechanism?.piston||pistonMesh,coupling=mechanism?.coupling||couplingMesh;
 for(const z of[-.70,-.15,.40])draw(wheels,mm(m,mm(trans(0,.325,z),rx(phase))),p);
 for(const s of[-1,1]){
  const q=phase+(s<0?PI/2:0),cy=.325+.143*Math.cos(q),cz=.143*Math.sin(q),xx=s*.447;
  const back=[xx,cy,-.70+cz],front=[xx,cy,.40+cz],middle=[xx,cy,-.15+cz];
  drawLink(rod,back,front,m,p);
  for(const z of[-.70,-.15,.40])draw(joint,mm(m,trans(xx,cy,z+cz)),p);
  const sliderZ=middle[2]+Math.sqrt(Math.max(.01,.91*.91-(.345-cy)**2)),crosshead=[s*.565,.345,sliderZ];
  drawLink(rod,[s*.474,cy,middle[2]],crosshead,m,p);draw(piston,mm(m,trans(...crosshead)),p);
  drawLink(coupling,crosshead,[s*.565,.345,1.23],m,p);
  const ecc=[s*.492,.325+.054*Math.cos(q+.85),-.15+.054*Math.sin(q+.85)];
  drawLink(coupling,ecc,[s*.583,.50,.83],m,p);draw(joint,mm(m,trans(...ecc)),p);
 }
}

function drawCollectionBogies(edge,d,spread,p){
 for(const offset of[-spread,spread])draw(bogieMesh,circuitMatrix(edge,d+offset),p);
}

function collectionWheelPhase(train){
 // Scene distances wrap at the circuit seam. Keep the crank's travel unwrapped so
 // the valve gear cannot jump when the locomotive completes a lap.
 if(!train.collectionMotion)train.collectionMotion={last:train.distance,travel:train.distance};
 const motion=train.collectionMotion,length=train.edge.length;
 let delta=train.distance-motion.last;
 if(delta<-length/2)delta+=length;else if(delta>length/2)delta-=length;
 motion.travel+=delta;motion.last=train.distance;
 return -motion.travel/.305;
}

function drawHouseTrainFormation(scene,train,p){
 const electric=train.type==='mountain',key=train.stock||(electric?(scene.key==='studio'?'workshop':'alpine'):(collectionStock.has(scene.key)?scene.key:'coast'));
 const stock=collectionStock.get(key);if(!stock)return;
 const open=cutaway&&p===mainProgram,models=[],ends=[];
 for(let i=0;i<=train.cars;i++){
  const studio=key==='studio',off=electric?(i===0?0:3.48+(i-1)*3.26):i===0?0:(studio?3.15:3.43)+(i-1)*(studio?2.81:3.26);
  const d=train.distance-off,m=circuitMatrix(train.edge,d);models.push(m);
  if(electric){
   draw(i?stock.trailer:stock.motor,m,p);if(!open&&!(i===0&&viewMode==='cab'&&p===mainProgram))draw(i?stock.trailerRoof:stock.motorRoof,m,p);
   drawCollectionBogies(train.edge,d,i?.86:1.03,p);ends.push(i?1.565:1.795);
  }else if(i===0){
   draw((open||viewMode==='cab'&&p===mainProgram)?stock.cab:stock.loco,m,p);
   drawCollectionMotion(m,collectionWheelPhase(train),p,stock.wheels);ends.push(1.76);
  }else{
   draw(i===train.cars?stock.tail:stock.coach,m,p);if(!open)draw(stock.roof,m,p);
   drawCollectionBogies(train.edge,d,studio?.66:.88,p);ends.push(studio?1.35:1.575);
  }
 }
 for(let i=1;i<models.length;i++){
  const a=transform([0,.285,-ends[i-1]],models[i-1]),b=transform([0,.285,ends[i]],models[i]);
  drawLink(couplingMesh,a,b,I,p);
 }
}

// The cabinet's catalogue is authored stock, not a second simulation. Its models
// are built on demand and run on the same rails, motion and coupling code.
const TRAIN_COLLECTION=[
 {id:'nightingale',name:'Nightingale',number:'07',family:'tender',power:'steam',arrangement:'4–6–0',tag:'The original favourite',service:'Passenger service',formation:'coaches',cars:3,description:'Polished brass, a copper-capped chimney, and a proper tender full of coal. The locomotive that started this little house.',details:['Quartered driving wheels & moving valve gear','Riveted boiler, cab gauges & open footplate','Compartment coaches with an observation balcony'],liveries:[['Brunswick green','#315544','#dbbd79','#325342'],['Midnight blue','#344f69','#d8c69b','#32495e'],['Claret & cream','#753d45','#e2bd83','#6b3941']]},
 {id:'tern',name:'Tern',number:'14',family:'tank',power:'steam',arrangement:'0–6–0T',tag:'A little salt in the air',service:'Branch-line passenger',formation:'coaches',cars:2,description:'A compact side-tank engine with sea-glass paintwork and a bright brass nameplate. Made for little platforms and the long way around the bay.',details:['Side tanks, exposed smokebox & copper pipework','Working coupling rods and rear coal bunker','Clerestory coaches with open end platforms'],liveries:[['Sea glass','#286369','#d4c390','#38747a'],['Harbour blue','#375974','#d7caa1','#456880'],['Chalk & olive','#67735a','#ded2aa','#71806a']]},
 {id:'wren',name:'Wren',number:'03',family:'saddle',power:'steam',arrangement:'0–6–0ST',tag:'Small engine. Big personality.',service:'Light passenger',formation:'coaches',cars:2,description:'Honey-coloured paint, a curved saddle tank, and tiny wooden coaches. An industrious little engine that looks as lovely standing still as it does at work.',details:['Curved saddle tank with a brass filler cap','Open cab, handrails & three driven axles','Short timber coaches with roof ventilators'],liveries:[['Honey & teak','#b58a43','#ead2a1','#886443'],['Bottle green','#344c3c','#dbbc7c','#916a43'],['Oxblood','#803e36','#d9bd86','#815641']]},
 {id:'meridian',name:'Meridian',number:'28',family:'express',power:'steam',arrangement:'4–6–0',tag:'An occasion on every departure',service:'Express passenger',formation:'coaches',cars:4,description:'Deep blue enamel and sweeping smoke deflectors give this express a grander presence. The observation carriage is the best seat in the house.',details:['Tall smoke deflectors with fine rivet lines','Brass boiler bands and mechanical valve gear','Matching tender and lined passenger coaches'],liveries:[['Night express','#253e60','#d9c792','#344962'],['Pullman plum','#51354b','#dbb981','#563b4d'],['Ivory & moss','#c5bda5','#8b7047','#536759']]},
 {id:'cinder',name:'Cinder',number:'05',family:'shunter',power:'diesel',arrangement:'B–B',tag:'The useful little one',service:'Mixed goods',formation:'wagons',cars:3,description:'A square-shouldered diesel with a long bonnet, open walkways, and a cab full of small instruments. Give it a string of goods wagons and a job to do.',details:['Louvred engine covers & a deep radiator grille','Handrails, steps, fuel tank & cab instruments','A mixed goods rake ending in a brake van'],liveries:[['Works ochre','#b18b42','#e5d2a3','#825e43'],['Industrial green','#4a6559','#ddcb99','#825e43'],['Signal red','#9b493b','#e1c89a','#825e43']]},
 {id:'kingfisher',name:'Kingfisher',number:'21',family:'railbus',power:'diesel',arrangement:'Bo–Bo',tag:'The slow Sunday service',service:'Diesel railcar',formation:'trailers',cars:1,description:'A two-tone railcar with a softly sloping nose, wide windows, and a warm timber interior. A different kind of railway rhythm, without a plume of steam.',details:['Sloping cab ends and paired headlamps','Roof vents, underfloor engine & luggage racks','Matching trailer with visible passenger seats'],liveries:[['Petrol & cream','#2d6972','#e3ce9e','#367079'],['Sunset orange','#b96c43','#efd9ad','#a86342'],['Wine & parchment','#70414c','#e6d2ab','#774954']]},
 {id:'bergwald',name:'Bergwald',number:'12',family:'electric',power:'electric',arrangement:'Bo–Bo',tag:'A mountain original',service:'Electric railcar',formation:'trailers',cars:1,description:'Heritage red, porcelain insulators, and a delicate diamond pantograph. Watch its bogies find their way around the curve as the valley drops away.',details:['Diamond pantograph & porcelain roof insulators','Copper bus, resistor bank & cab windscreen wipers','Separate swivelling bogies and open interiors'],liveries:[['Alpine red','#a54438','#e3cf9d','#aa4e40'],['Forest & cream','#3c6656','#ddcba4','#456c5b'],['Glacier blue','#587b91','#e5d9b7','#64869b']]},
 {id:'juniper',name:'Juniper',number:'32',family:'panorama',power:'electric',arrangement:'Bo–Bo',tag:'Every window, a view',service:'Panorama electric',formation:'trailers',cars:2,description:'An airy electric train with raised panoramic glazing and a silver roofline. Built around the view, with small tables and a quiet place by the window.',details:['Raised glazed observation roof & slim framing','Articulated diamond collector and roof equipment','Window-side seating, tables & wide cab glazing'],liveries:[['Sage & silver','#7c9480','#e5d7b4','#8c9d85'],['Lake blue','#4d7686','#dedac5','#5f8592'],['Cream & copper','#c9bca0','#9f7656','#b6a48b']]}
];
const collectionById=new Map(TRAIN_COLLECTION.map(q=>[q.id,q]));
const selectedCollection=Object.create(null),runningCollectionMeshes=new Map(),collectionOffsetCache=new Map();
const collectionStorageKey='whistlevale-train-collection-v1';
const cabinetInitLabels=initLabels;
initLabels=function(){
 cabinetInitLabels();
 for(const q of TRAIN_COLLECTION){
  // Fixed allocation during world construction, before any geometry uses UVs.
  const neededRow=atlasX+246+2>2048?atlasY+atlasRow+3:atlasY;
  if(neededRow+50>1024)continue;
  label('collection-name-'+q.id,q.name.toUpperCase(),188,40,'#263d34','#e6cf98',22,true);
  label('collection-number-'+q.id,q.number,54,50,'#263d34','#e6cf98',31,true);
 }
};
function collectionPaint(choice){
 const q=collectionById.get(choice.id),v=q.liveries[choice.livery];
 return {name:v[0],body:v[1],line:v[2],coach:v[3],wheel:shade(v[1],.67)};
}
function validateCollectionChoice(value){
 if(!value||!collectionById.has(value.id))return null;
 const q=collectionById.get(value.id);
 if(!Number.isInteger(value.livery)||value.livery<0||value.livery>=q.liveries.length||!Number.isInteger(value.cars)||value.cars<1||value.cars>6)return null;
 return {id:q.id,livery:value.livery,cars:value.cars};
}
function collectionDefault(room){
 const stock=roomScenes.get(room)?.trains[0],id=room==='valley'?'nightingale':room==='coast'?'tern':room==='studio'?'wren':stock?.type==='steam'?'tern':'bergwald';
 const q=collectionById.get(id);return {id,livery:id==='nightingale'?Math.max(0,['green','blue','claret'].indexOf(livery)):0,cars:room==='valley'?Math.min(6,offsets.length-2):Math.max(1,Math.min(6,stock?.cars??q.cars))};
}
function collectionChoice(room){return selectedCollection[room]||collectionDefault(room);}
function collectionTrainLabel(room){const choice=collectionChoice(room),q=collectionById.get(choice.id);return {...q,type:q.power==='steam'?q.arrangement+' steam':q.service.toLowerCase()};}
function collectionPower(room){
 if(selectedCollection[room])return collectionById.get(selectedCollection[room].id).power;
 return room==='valley'||roomScenes.get(room)?.trains[0]?.type==='steam'?'steam':'electric';
}
function collectionOffsets(choice){
 const key=choice.id+':'+choice.cars;if(collectionOffsetCache.has(key))return collectionOffsetCache.get(key);
 const q=collectionById.get(choice.id),tender=['tender','express'].includes(q.family),out=[0];
 if(tender)out.push(2.75);
 for(let i=0;i<choice.cars;i++)out.push(tender?5.21+3.26*i:q.family==='saddle'?3.15+2.81*i:q.family==='shunter'?3.23+2.80*i:['railbus','panorama'].includes(q.family)?3.78+3.55*i:q.power==='electric'?3.48+3.26*i:3.43+3.26*i);
 collectionOffsetCache.set(key,out);return out;
}
function collectionExport(){return {version:1,rooms:Object.fromEntries(Object.entries(selectedCollection).map(([room,choice])=>[room,{...choice}]))};}
function restoreCollectionSelections(){
 let data;
 try{const embedded=$('embeddedTrainCollection')?.textContent;data=embedded&&embedded.trim()!=='null'?JSON.parse(embedded):JSON.parse(localStorage.getItem(collectionStorageKey)||'null');}catch{return;}
 if(data?.version!==1||!data.rooms||typeof data.rooms!=='object')return;
 for(const [room,value]of Object.entries(data.rooms)){
  const choice=validateCollectionChoice(value);if(!Object.hasOwn(HOUSE_ROOMS,room)||!choice)continue;
  // Build only the train in the initial room; other saved choices are lazy.
  try{if(room==='valley')ensureRunningCollection(choice);selectedCollection[room]=choice;}catch{}
 }
}
function applyCollectionToScene(scene){
 const choice=selectedCollection[scene.key];if(!choice||scene.trains[0].collectionChoice===choice)return;
 ensureRunningCollection(choice);const q=collectionById.get(choice.id),train=scene.trains[0];
 train.collectionChoice=choice;train.cars=choice.cars;train.type=q.power==='electric'?'mountain':q.power;train.stock='collection:'+q.id;
}
const collectionGetHouseScene=getHouseScene;
getHouseScene=function(key){const scene=collectionGetHouseScene(key);if(scene)applyCollectionToScene(scene);return scene;};
function chooseCollectionTrain(room,value){
 const choice=validateCollectionChoice(value);if(!choice||!Object.hasOwn(HOUSE_ROOMS,room))throw new Error('This train choice is unavailable.');
 ensureRunningCollection(choice);selectedCollection[room]=choice;
 if(room!=='valley'&&roomScenes.has(room))applyCollectionToScene(roomScenes.get(room));
 shadowDirty=true;let saved=true;
 try{localStorage.setItem(collectionStorageKey,JSON.stringify(collectionExport()));}catch{saved=false;}
 pruneRunningCollection();return saved;
}
function pruneRunningCollection(){
 const used=new Set(Object.values(selectedCollection).map(q=>q.id+':'+q.livery));
 for(const [key,stock]of runningCollectionMeshes)if(!used.has(key)){for(const mesh of Object.values(stock))if(mesh?.vao)disposeMesh(mesh);runningCollectionMeshes.delete(key);}
}
function ensureRunningCollection(choice){
 const key=choice.id+':'+choice.livery;if(runningCollectionMeshes.has(key))return runningCollectionMeshes.get(key);
 const geometry=collectionGeometry(choice),stock={};
 try{for(const [part,mesh]of Object.entries(geometry))stock[part]=upload(mesh.data);}
 catch(error){for(const mesh of Object.values(stock))disposeMesh(mesh);throw error;}
 runningCollectionMeshes.set(key,stock);return stock;
}
function collectionAppend(mesh,b){const data=new Float32Array(mesh.data.length+b.data.length);data.set(mesh.data);data.set(b.data,mesh.data.length);return {data,count:data.length/12};}
function collectionExpress(roof){
 const mesh=makeLoco(roof),b=new Builder(),q=trainPaint();
 for(const side of[-1,1]){
  b.box(side*.477,1.035,1.02,.038,.65,.77,q.body,40);
  b.beam([side*.502,1.37,.65],[side*.502,1.37,1.40],.012,q.line,41,8);
  fineRivets(b,[side*.505,.74,.70],[side*.505,1.30,.70],9,q.line,.010);
  for(const z of[.74,1.28])b.beam([side*.35,.70,z],[side*.475,.74,z],.019,'#728071',41,8);
 }
 return collectionAppend(mesh,b);
}
function collectionShunter(withRoof=true){
 const b=new Builder(),q=trainPaint(),dark='#293831',steel='#9dada0';
 b.box(0,.34,.03,.95,.15,3.05,dark,42);b.box(0,.19,0,.55,.22,1.26,'#434e43',42);
 stockBuffers(b,-1.54);stockBuffers(b,1.58);
 b.box(0,.82,.38,.68,.80,1.88,q.body,40);b.box(0,1.235,.36,.73,.04,1.96,q.body,40);
 for(const s of[-1,1]){
  b.box(s*.43,.47,.13,.22,.05,2.74,steel,41);
  for(const z of[-.33,.28,.91]){
   b.box(s*.348,.86,z,.023,.56,.50,shade(q.body,.83),40);
   for(let i=0;i<7;i++)b.box(s*.364,.66+i*.062,z,.018,.018,.41,dark,42);
   b.box(s*.381,1.12,z,.027,.026,.115,steel,41);
  }
  for(const z of[-1.34,-.51,.46,1.40])b.beam([s*.48,.48,z],[s*.48,.93,z],.017,q.line,41,8);
  b.beam([s*.48,.94,-1.36],[s*.48,.94,1.41],.019,q.line,41,8);
  for(const z of[-1.33,1.30])for(let i=0;i<2;i++)b.box(s*.48,.33-i*.11,z,.20,.032,.29,dark,42);
  b.box(s*.44,.73,-1.04,.055,.49,.79,q.body,40);
  for(const z of[-1.44,-.63])b.box(s*.44,1.23,z,.055,.59,.055,q.body,40);
  b.box(s*.44,1.55,-1.04,.063,.075,.86,q.body,40);
  b.push(s*.476,.76,-1.04,0,s*PI/2);sign(b,'engine',0,0,0,.23,.22);b.pop();
 }
 for(const z of[-1.44,-.63]){
  b.box(0,.77,z,.86,.52,.053,q.body,40);b.box(0,1.55,z,.89,.075,.056,q.body,40);
  for(const x of[-.43,0,.43])b.box(x,1.25,z,.036,.55,.054,q.body,40);
  for(const x of[-.22,.22])b.beam([x,1.0,z-.031],[x+.10,1.30,z-.032],.008,dark,42,6);
 }
 b.box(0,.58,-1.02,.85,.05,.79,'#8c7657',22);b.box(0,.97,-.72,.66,.07,.20,dark,42);
 for(const x of[-.20,.12])stockGauge(b,x,1.025,-.78,.038);
 b.box(-.21,.76,-1.12,.24,.09,.23,'#7f5945',23);b.box(-.21,.92,-1.25,.24,.28,.045,'#7f5945',23);
 b.box(0,.85,1.332,.61,.66,.028,dark,42);
 for(let i=0;i<12;i++)b.box(-.275+i*.05,.85,1.351,.016,.60,.026,steel,41);
 b.cylinder(.10,1.43,.73,.057,.057,.38,dark,42,18);b.cylinder(.10,1.631,.73,.068,.068,.039,steel,41,18);
 b.cylinder(0,1.28,-.24,.17,.17,.033,dark,42,24);for(let i=0;i<8;i++)b.box((i-3.5)*.039,1.301,-.24,.014,.012,.27,steel,41);
 if(withRoof){b.push(0,0,-1.04);barrelRoof(b,1.02,.99,1.59,dark);b.pop();}
 for(const z of[-1.61,1.65])for(const x of[-.27,.27])stockLamp(b,x,.61,z,z<0,.057);
 return b.mesh();
}
function collectionRailcar(trailer=false,panorama=false){
 const b=new Builder(),q=trainPaint(),half=trailer?1.51:1.70,side=.445,cream=panorama?'#d8ddca':'#e5d4ae',steel='#a9b6a5',dark='#293c34';
 // A continuous rounded cab shell, rather than an apron attached to a flat cab.
 b.box(0,.335,0,.86,.13,half*2-.15,dark,42);b.box(0,.418,0,.81,.045,half*2-.30,'#a38b65',22);
 b.box(0,.242,-.16,.51,.16,.78,'#586657',42);
 if(!panorama){b.box(0,.229,.56,.59,.20,.53,'#4c594d',42);for(let z=.36;z<.79;z+=.07)b.box(0,.121,z,.52,.013,.024,steel,41);}
 for(const sideSign of[-1,1]){
  const x=sideSign*side,end=half-.36;
  b.box(x,.662,0,.055,.45,end*2,q.body,40);
  b.box(x,.91,0,.068,.045,end*2,cream,0);b.box(x,1.419,0,.071,.060,end*2,cream,0);
  b.box(sideSign*.480,.492,0,.011,.017,end*2-.04,q.line,41);
  b.box(sideSign*.482,.866,0,.011,.018,end*2-.04,steel,41);
  const n=trailer?5:6,step=end*2/n;
  for(let i=0;i<=n;i++){
   const z=-end+i*step;b.box(x,1.162,z,.060,.472,.035,cream,0);
   b.box(sideSign*.478,1.162,z,.012,.451,.013,steel,41);
  }
  for(let i=0;i<n;i++){
   const z=-end+(i+.5)*step;
   b.box(sideSign*.480,1.364,z,.011,.018,step-.042,steel,41);
   b.box(sideSign*.480,.962,z,.011,.018,step-.042,steel,41);
   if(!panorama)b.box(sideSign*.469,1.268,z,.019,.013,step-.04,cream,0);
   b.box(sideSign*.285,.569,z,.24,.107,.225,panorama?'#718d76':'#946d57',23);
   b.box(sideSign*.363,.718,z,.055,.27,.225,panorama?'#5b7564':'#79563f',23);
   if(panorama&&i%2===1){b.box(sideSign*.255,.78,z-.14,.32,.027,.16,'#d0c3a3',22);b.cylinder(sideSign*.255,.618,z-.14,.015,.015,.31,steel,41,8);}
   if(i===2){b.sphere(sideSign*.28,.83,z,.039,.049,.039,'#cba984',0,8,5);b.sphere(sideSign*.28,.732,z,.048,.074,.040,panorama?'#b08f60':'#6d877b',23,8,5);}
  }
  // Door recess, handles and two separate step treads at each vestibule.
  for(const endSign of[-1,1]){
   const z=endSign*(half-.22);b.box(x,.662,z,.052,.448,.235,q.body,40);
   for(const zz of[z-.127,z+.127])b.box(x,1.17,zz,.057,.50,.025,cream,0);
   b.box(x,1.42,z,.068,.063,.27,cream,0);
   b.beam([sideSign*.485,.72,z+.062],[sideSign*.485,.88,z+.062],.009,steel,41,8);
   for(let j=0;j<2;j++)b.box(sideSign*.478,.332-j*.092,z,.158,.028,.259,dark,42);
  }
  b.push(sideSign*.482,.683,0,0,sideSign*PI/2);sign(b,'stock-alpine',0,0,0,.69,.116);b.pop();
  if(!panorama)for(let z=-.95;z<1;z+=.065)b.box(sideSign*.478,.610,z,.011,.012,.032,shade(q.body,.77),40);
 }
 for(const endSign of[-1,1]){
  const xs=[-.445,-.37,-.22,0,.22,.37,.445],face=(x,y)=>[x,y,endSign*(half+.035-.20*(Math.abs(x)/.445)**2)];
  for(let i=0;i<xs.length-1;i++){
   const a=face(xs[i],.455),b0=face(xs[i+1],.455),c=face(xs[i+1],.92),d=face(xs[i],.92);
   a[2]-=endSign*.065;b0[2]-=endSign*.065;
   b.quad(a,b0,c,d,q.body,40);
   b.beam(face(xs[i],.872),face(xs[i+1],.872),.012,q.line,41,8);
   b.beam(face(xs[i],.94),face(xs[i+1],.94),.018,cream,0,8);
   const topA=face(xs[i],1.417),topB=face(xs[i+1],1.417);topA[2]-=endSign*.15;topB[2]-=endSign*.15;
   b.beam(topA,topB,.026,cream,0,8);
   if(i===0||i===xs.length-2)b.quad(d,c,topB,topA,cream,0);
  }
  const left=face(-.37,.962),right=face(.37,.962),tl=face(-.37,1.39),tr=face(.37,1.39);tl[2]-=endSign*.15;tr[2]-=endSign*.15;
  b.quad(left,right,tr,tl,panorama?'#779b94':'#768f83',43);
  for(const x of[-.37,0,.37]){const a=face(x,.95),z=face(x,1.413);z[2]-=endSign*.15;b.beam(a,z,x===0?.013:.022,cream,0,8);}
  for(const x of[-.23,.23]){
   stockLamp(b,x,.744,endSign*(half+.045-.20*(Math.abs(x)/.445)**2),endSign<0,.045);
   const a=face(x,1.008),tip=face(x+.075,1.219);a[2]+=endSign*.007;tip[2]-=endSign*.073;b.beam(a,tip,.006,dark,42,6);
  }
  b.box(0,.381,endSign*(half+.014),.72,.065,.06,steel,41);
  b.beam([0,.29,endSign*half],[0,.29,endSign*(half+.17)],.024,dark,42,8);
  b.box(0,.872,endSign*(half-.34),.67,.059,.21,'#506356',42);
  for(const x of[-.20,.12])stockGauge(b,x,.921,endSign*(half-.38),.028);
  b.box(-.20,.60,endSign*(half-.51),.20,.07,.18,'#80634c',23);
 }
 return b.mesh();
}
function collectionRailcarRoof(trailer=false,panorama=false){
 const b=new Builder(),q=trainPaint(),half=trailer?1.51:1.70,steel='#a6b4a6';
 if(panorama){
  // Low glazed shoulders make one continuous observation saloon.
  for(const s of[-1,1]){
   b.quad([s*.477,1.447,-half+.30],[s*.477,1.447,half-.30],[s*.30,1.689,half-.40],[s*.30,1.689,-half+.40],'#87aaa1',43);
   for(let z=-half+.34;z<half-.29;z+=.34)b.beam([s*.480,1.448,z],[s*.30,1.70,z*.92],.013,'#d4dcc8',41,8);
   b.beam([s*.481,1.445,-half+.26],[s*.481,1.445,half-.26],.018,steel,41,8);
   b.beam([s*.302,1.703,-half+.36],[s*.302,1.703,half-.36],.016,steel,41,8);
  }
  b.box(0,1.699,0,.60,.033,half*2-.69,'#c0cbbc',41);
  for(const s of[-1,1]){b.quad([-.475,1.447,s*(half-.29)],[.475,1.447,s*(half-.29)],[.30,1.69,s*(half-.40)],[-.30,1.69,s*(half-.40)],'#c0cbbc',41);b.box(0,1.469,s*(half-.20),.89,.057,.23,'#a3b4a4',41);}
  if(!trailer){
   const z=-half+.43,base=1.76,top=2.24;
   for(const x of[-.18,.18]){for(const y of[1.72,1.76])b.cylinder(x,y,z,.049,.044,.018,'#e0dcc4',0,12);for(const s of[-1,1]){b.beam([x,base,z],[x,2.0,z+s*.27],.013,'#696d60',41,8);b.beam([x,2.0,z+s*.27],[x,top,z],.013,'#696d60',41,8);b.cylinder(x,2,z+s*.27,.025,.025,.025,steel,41,10,0,PI/2);}}
   b.beam([-.40,top,z],[.40,top,z],.018,steel,41,8);
   b.beam([.26,1.725,-half+.5],[.26,1.725,-.25],.009,'#ac8764',41,8);
  }
 }else{
  // Shallow elliptical roof: rounded railbus proportions, with ribbed vents.
  for(let i=0;i<24;i++){
   const a=i*PI/24,c=(i+1)*PI/24,point=(angle,z)=>[Math.cos(angle)*.485,1.445+Math.sin(angle)*.155,z];
   b.quad(point(a,-half+.14),point(a,half-.14),point(c,half-.14),point(c,-half+.14),'#879b8c',41);
   for(const s of[-1,1])b.tri([0,1.445,s*(half-.14)],point(a,s*(half-.14)),point(c,s*(half-.14)),'#879b8c',41);
  }
  for(const s of[-1,1])b.beam([s*.485,1.446,-half+.13],[s*.485,1.446,half-.13],.015,'#d6d3b9',41,8);
  for(const z of[-.87,-.28,.32,.89]){b.box(0,1.616,z,.24,.05,.14,'#617364',42);for(let i=0;i<5;i++)b.box((i-2)*.042,1.646,z,.012,.014,.12,steel,41);}
  if(!trailer)b.cylinder(.24,1.64,-.86,.035,.035,.20,'#596959',42,12);
 }
 return b.mesh();
}
function collectionBogieParts(){
 const axle=smallAxle;
 let bogie;
 try{smallAxle=()=>{};bogie=makeBogie();}finally{smallAxle=axle;}
 const b=new Builder();b.push(0,-.186,0);axle(b,0,.17,.66);b.pop();
 // Small cast ribs make wheel rotation legible without oversized bright spokes.
 for(const s of[-1,1])for(let i=0;i<6;i++){const a=i*TAU/6;b.beam([s*.365,Math.cos(a)*.056,Math.sin(a)*.056],[s*.365,Math.cos(a)*.124,Math.sin(a)*.124],.010,'#607563',41,6);}
 return {bogie,axle:b.mesh()};
}
function collectionGeometry(choice){
 const q=collectionById.get(choice.id),paint=collectionPaint(choice),saved={mesh:Builder.prototype.mesh,paint:trainPaint,seed,coast:TRAIN_ROSTER.coast,studio:TRAIN_ROSTER.studio,alpine:TRAIN_ROSTER.alpine,labels:{...labels}};
 // Capture exactly the same procedural mesh used by the railway. This prevents
 // preview generation from uploading to or changing the active WebGL context.
 Builder.prototype.mesh=function(){return {data:new Float32Array(this.data),count:this.data.length/12};};
 try{
  seed=80183+TRAIN_COLLECTION.indexOf(q)*701;trainPaint=()=>paint;
  for(const key of['coast','studio','alpine'])TRAIN_ROSTER[key]={...TRAIN_ROSTER[key],...paint};
  const name=labels['collection-name-'+q.id],number=labels['collection-number-'+q.id];
  if(name){labels.name=name;for(const key of['coast','studio','alpine'])labels['stock-'+key]=name;}
  if(number){labels.engine=number;for(const key of['coast','studio','alpine'])labels['stock-number-'+key]=number;}
  const parts=collectionBogieParts();
  let mechanism=new Builder();mechanism.box(0,0,.5,.034,.041,1,'#b7c0ab',41);parts.rod=mechanism.mesh();
  mechanism=new Builder();mechanism.box(0,0,0,.067,.091,.131,'#899784',41);parts.piston=mechanism.mesh();
  mechanism=new Builder();mechanism.sphere(0,0,0,.024,.031,.031,'#dbcca7',41,10,6);parts.joint=mechanism.mesh();
  mechanism=new Builder();mechanism.cylinder(0,0,.5,.018,.018,1,'#969d87',41,10,PI/2);parts.coupling=mechanism.mesh();
  if(q.power==='steam'){
   const tender=['tender','express'].includes(q.family),engine=roof=>q.family==='express'?collectionExpress(roof):tender?makeLoco(roof):stockTankEngine(q.family==='saddle'?'studio':'coast',roof);
   parts.loco=engine(true);parts.cab=engine(false);parts.wheels=makeWheels();
   if(tender)parts.tender=makeTender();
   parts.coach=tender?makeCoach():stockCoach(q.family==='saddle'?'studio':'coast');parts.tail=tender?makeCoach(true):stockCoach(q.family==='saddle'?'studio':'coast',true);parts.roof=tender?makeCoachRoof():stockCoachRoof(q.family==='saddle'?'studio':'coast');
  }else if(q.family==='shunter'){
   parts.loco=collectionShunter();parts.cab=collectionShunter(false);parts.coach=makeGoodsVehicle('box');parts.tank=makeGoodsVehicle('tank');parts.tail=makeGoodsVehicle('brake');
  }else{
   const classic=q.family==='electric',panorama=q.family==='panorama';
   parts.motor=classic?stockElectric():collectionRailcar(false,panorama);parts.trailer=classic?stockElectric(true):collectionRailcar(true,panorama);
   parts.motorRoof=classic?stockElectric(false,false,true):collectionRailcarRoof(false,panorama);parts.trailerRoof=classic?stockElectric(true,false,true):collectionRailcarRoof(true,panorama);
  }
  return parts;
 }finally{Builder.prototype.mesh=saved.mesh;trainPaint=saved.paint;seed=saved.seed;TRAIN_ROSTER.coast=saved.coast;TRAIN_ROSTER.studio=saved.studio;TRAIN_ROSTER.alpine=saved.alpine;Object.assign(labels,saved.labels);}
}
function drawSelectedCollection(choice,matrixAt,p,phase=0,stock=ensureRunningCollection(choice),open=cutaway&&p===mainProgram){
 const q=collectionById.get(choice.id),tender=['tender','express'].includes(q.family),ds=collectionOffsets(choice),ends=[],models=[];
 const bogieAt=offset=>{const m=matrixAt(offset);draw(stock.bogie,m,p);for(const z of[-.22,.22])draw(stock.axle,mm(m,mm(trans(0,.186,z),rx(phase*.305/.17))),p);};
 for(let i=0;i<ds.length;i++){
  const m=matrixAt(ds[i]);models.push(m);
  if(i===0&&q.power==='steam'){
   draw(open||viewMode==='cab'&&p===mainProgram?stock.cab:stock.loco,m,p);drawCollectionMotion(m,phase,p,stock.wheels,stock);ends.push(tender?1.82:1.76);
  }else if(tender&&i===1){draw(stock.tender,m,p);ends.push(1.04);}
  else if(q.family==='shunter'){
   draw(i===0?(open||viewMode==='cab'&&p===mainProgram?stock.cab:stock.loco):i===ds.length-1?stock.tail:i%3===2?stock.tank:stock.coach,m,p);
   if(i===0)for(const z of[-.92,.92])bogieAt(ds[i]-z);ends.push(i?1.40:1.82);
  }else if(q.power!=='steam'){
   draw(i?stock.trailer:stock.motor,m,p);if(!open&&!(i===0&&viewMode==='cab'&&p===mainProgram))draw(i?stock.trailerRoof:stock.motorRoof,m,p);
   for(const z of[-(i?.86:1.03),i?.86:1.03])bogieAt(ds[i]-z);ends.push(q.family==='electric'?(i?1.565:1.795):(i?1.69:1.92));
  }else{
   draw(i===ds.length-1?stock.tail:stock.coach,m,p);if(!open)draw(stock.roof,m,p);
   const spread=q.family==='saddle'?.66:tender?.91:.88;for(const z of[-spread,spread])bogieAt(ds[i]-z);ends.push(q.family==='saddle'?1.35:tender?1.64:1.575);
  }
 }
 for(let i=1;i<models.length;i++)drawLink(stock.coupling,transform([0,.29,-ends[i-1]],models[i-1]),transform([0,.29,tender&&i===1?.98:ends[i]],models[i]),I,p);
}
const cabinetDrawMain=workshopDrawTrains;
workshopDrawTrains=function(p=mainProgram){
 const choice=selectedCollection.valley;
 if(choice&&trainModels[0])drawSelectedCollection(choice,offset=>vehicleMatrix(travel-offset),p,wheelPhase);else cabinetDrawMain(p);
};
const cabinetDrawHouse=drawHouseTrainFormation;
drawHouseTrainFormation=function(scene,train,p){
 if(train.collectionChoice)drawSelectedCollection(train.collectionChoice,offset=>circuitMatrix(train.edge,train.distance-offset),p,-collectionWheelPhase(train));
 else cabinetDrawHouse(scene,train,p);
};

const cabinetRebuildTrains=buildTrains;
buildTrains=function(){
 cabinetRebuildTrains();
 for(const stock of runningCollectionMeshes.values())for(const mesh of Object.values(stock))disposeMesh(mesh);
 runningCollectionMeshes.clear();
 if(selectedCollection.valley)ensureRunningCollection(selectedCollection.valley);
 for(const scene of roomScenes.values())if(selectedCollection[scene.key]){scene.trains[0].collectionChoice=null;applyCollectionToScene(scene);}
};

// Hidden steam is unnecessary work while inspecting a diesel/electric service.
const cabinetUpdateSteam=updateSteam;
updateSteam=function(dt){
 if(typeof hobby!=='undefined'&&hobby.ready&&collectionPower(hobby.room)!=='steam'){steam.length=0;steamAccumulator=0;whistleSteam=0;return;}
 cabinetUpdateSteam(dt);
};
