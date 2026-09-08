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

function drawCollectionMotion(m,phase,p,wheels=wheelMesh){
 for(const z of[-.70,-.15,.40])draw(wheels,mm(m,mm(trans(0,.325,z),rx(phase))),p);
 for(const s of[-1,1]){
  const q=phase+(s<0?PI/2:0),cy=.325+.143*Math.cos(q),cz=.143*Math.sin(q),xx=s*.447;
  const back=[xx,cy,-.70+cz],front=[xx,cy,.40+cz],middle=[xx,cy,-.15+cz];
  drawLink(rodMesh,back,front,m,p);
  for(const z of[-.70,-.15,.40])draw(jointMesh,mm(m,trans(xx,cy,z+cz)),p);
  const sliderZ=middle[2]+Math.sqrt(Math.max(.01,.91*.91-(.345-cy)**2)),crosshead=[s*.565,.345,sliderZ];
  drawLink(rodMesh,[s*.474,cy,middle[2]],crosshead,m,p);draw(pistonMesh,mm(m,trans(...crosshead)),p);
  drawLink(couplingMesh,crosshead,[s*.565,.345,1.23],m,p);
  const ecc=[s*.492,.325+.054*Math.cos(q+.85),-.15+.054*Math.sin(q+.85)];
  drawLink(couplingMesh,ecc,[s*.583,.50,.83],m,p);draw(jointMesh,mm(m,trans(...ecc)),p);
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
