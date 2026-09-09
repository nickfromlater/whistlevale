'use strict';

// Figures share a small, deliberately handmade vocabulary. Static crowds are
// batched into their room; only walkers and the occasional waving arm move.
const PEOPLE_COLORS=['#9b5c4e','#527879','#d0aa66','#6d7955','#746581','#bd8060','#54709a','#cfb997'];
const SKIN_COLORS=['#e0b896','#b98762','#8b5f45','#d0a17a','#ae7856'];
function littleBook(b,x,y,z,open=true,color='#7c5c48',angle=0){
 b.push(x,y,z,-.30,angle);b.box(0,0,0,.18,.018,.135,color,23);
 if(open){for(const side of[-1,1]){b.push(side*.045,.014,0,0,0,-side*.09);b.box(0,0,0,.086,.007,.121,'#dcd1ad',23);for(let line=0;line<4;line++)b.box(0,.005,-.039+line*.025,.062,.002,.004,'#959580',0);b.pop();}b.box(0,.018,0,.007,.007,.126,'#b09c78',23);}
 b.pop();
}
function littleCase(b,x,y,z,size=1,color='#937852',angle=0){
 b.push(x,y,z,0,angle,0,size);b.box(0,.105,0,.22,.21,.13,color,22);for(const xx of[-.069,.069])b.box(xx,.105,.069,.012,.18,.009,'#c2aa7a',22);b.beam([-.033,.22,0],[-.025,.252,0],.009,'#695d43',22,5);b.beam([-.025,.252,0],[.033,.252,0],.009,'#695d43',22,5);b.beam([.033,.252,0],[.040,.22,0],.009,'#695d43',22,5);b.box(0,.158,.076,.019,.024,.006,'#c6ad75',41);b.pop();
}
function littlePack(b,x,y,z,color='#8f8b60'){
 b.box(x,y,z,.14,.18,.075,color,23);b.box(x,y+.065,z-.043,.155,.053,.027,shade(color,1.12),23);for(const side of[-1,1]){b.box(x+side*.055,y,z-.044,.012,.13,.012,'#b5a675',22);b.cylinder(x+side*.088,y-.025,z,.025,.025,.10,'#879c8a',41,8);}b.box(x,y-.045,z-.051,.066,.057,.018,shade(color,.89),23);
}
function littlePerson(b,x,y,z,options={}){
 const {color='#527879',angle=0,scale=1,pose='stand',variant=0,phase=0}=options;
 const v=Math.abs(Math.floor(variant)),skin=SKIN_COLORS[v%SKIN_COLORS.length],hair=['#695847','#ab926a','#c5bfa8','#4a4e42','#856449'][v%5];
 const floorSit=pose==='sitGround',seated=Boolean(options.seated)||floorSit||['sit','perch','read','chair','sip'].includes(pose),walking=pose==='walk'||pose==='hike',carrying=pose==='carry',working=pose==='paint'||pose==='work';
 const style=v%7,skirt=!working&&style===2,coat=!seated&&!working&&(style===5||style===6),pants=['#48594e','#70634c','#45575b','#667166'][v%4];
 const hip=floorSit?.072:seated?(options.seatHeight??(pose==='sit'?.235:pose==='perch'?.048:.18)):.321,shoulder=hip+(floorSit?.179:.186),headY=shoulder+.083,lean=working?.035:pose==='read'||pose==='map'?.024:0;
 const headTilt=pose==='read'||pose==='map'?.15:working?.10:0;
 b.push(x,y,z,0,angle,0,scale);
 // Longer legs, a tapered cloth torso and a small sculpted head keep these
 // figures close to painted railway miniatures at both room and macro scales.
 b.push(0,0,lean*.35,0,0,0,1,1,.67);b.cylinder(0,(hip+shoulder)/2,0,.065,.079,shoulder-hip,color,23,10);b.pop();
 b.cylinder(0,shoulder+.020,lean*.70,.021,.020,.039,skin,23,7);
 if(coat){b.push(0,hip-.040,.004,0,0,0,1,1,.70);b.cylinder(0,0,0,.075,.066,.105,color,23,10);b.pop();b.box(0,hip+.040,.049,.006,.155,.007,shade(color,.68),23);}
 if(skirt){b.push(0,hip-.074,0,0,0,0,1,1,.75);b.cylinder(0,0,0,.087,.065,.15,shade(color,.86),23,10);b.pop();}
 if(style===4&&!working){b.quad([-.052,shoulder-.008,.052],[0,shoulder-.044,.053],[0,hip+.015,.05],[-.056,hip+.015,.048],shade(color,.72),23);b.quad([0,shoulder-.044,.053],[.052,shoulder-.008,.052],[.056,hip+.015,.048],[0,hip+.015,.05],shade(color,.77),23);}
 for(const side of[-1,1])b.tri([side*.028,shoulder+.004,lean+.030],[side*.048,shoulder-.028,lean+.049],[side*.004,shoulder-.018,lean+.051],'#d0c8aa',23);
 if(style===1){b.box(.006,shoulder-.048,.059,.025,.102,.009,'#c6b78e',23);b.box(-.015,shoulder-.086,.059,.020,.090,.008,'#c6b78e',23);}
 if(style===0||style===4||coat)for(let j=0;j<3;j++)b.sphere(.006,shoulder-.061-j*.033,.058,.0035,.0035,.003,'#cab48a',41,5,3);
 if(working){b.box(0,hip+.055,.058,.114,.196,.018,'#aeb18e',23);b.box(0,hip+.065,.071,.075,.057,.008,'#c0b99a',23);for(const side of[-1,1])b.beam([side*.052,shoulder,.019],[side*.043,hip+.055,.071],.006,'#c8bb93',23,5);}
 // Head, hairline, tiny ear/nose planes and quiet painted facial marks.
 b.push(0,headY,lean,headTilt,options.gaze??((v%3)-1)*.12);
 b.sphere(0,0,0,.039,.051,.041,skin,23,10,6);for(const side of[-1,1])b.sphere(side*.038,-.003,-.002,.008,.013,.008,skin,23,6,4);
 b.sphere(0,.019,-.007,.041,.033,.040,hair,23,9,5);
 if(style===2||v%9===7){b.sphere(0,-.011,-.027,.043,.046,.025,hair,23,8,5);b.sphere(.022,-.032,-.059,.017,.024,.015,hair,23,7,4);}
 b.tri([-.007,.006,.038],[.006,.006,.038],[.003,-.004,.053],shade(skin,.97),23);b.tri([-.007,.006,.038],[.003,-.004,.053],[-.006,-.007,.040],shade(skin,.88),23);
 for(const side of[-1,1]){const xx=side*.016;b.quad([xx-.0025,.012,.0388],[xx+.0025,.012,.0388],[xx+.0025,.0148,.0388],[xx-.0025,.0148,.0388],shade(skin,.45),23);}
 b.beam([-.008,-.021,.037],[.008,-.021,.037],.0014,shade(skin,.66),23,4);
 if(v%6===0||pose==='hike'||working){const hat=working?'#aaa170':pose==='hike'?'#8e8b64':'#758572';b.cylinder(0,.048,-.001,.044,.040,.020,hat,23,10);b.cylinder(0,.037,.009,.057,.056,.007,shade(hat,1.12),23,12);if(v%6===0)b.box(0,.047,.040,.023,.006,.012,'#c5b589',23);}
 b.pop();
 const legBase=pose==='perch'?-.155:pose==='sit'&&options.seatHeight===undefined?-.068:.018;
 for(const side of[-1,1]){
  const stride=walking?Math.sin(phase)*side*.061:0;
  const knee=floorSit?[side*.089,.042,.107]:seated?[side*.043,hip-.018,.146]:[side*.042,.165,stride];
  const foot=floorSit?[side*.055,.020,.181]:[side*.043,legBase,seated?.154:stride*.91+.018];
  b.beam([side*.038,hip,0],knee,.024,pants,23,7);b.beam(knee,foot,.020,pants,23,7);b.box(foot[0],foot[1]-.006,foot[2]+.025,.051,.031,.086,'#3f483d',23);
  let elbow=[side*.100,shoulder-.079,-stride*.65+lean*.6],hand=[side*.103,shoulder-.190,-stride*.72+.014+lean*.6];
  if(pose==='wave'&&side===1){elbow=[.13,shoulder+.025,.012];hand=[.118,headY+.055,.032];}
  if(pose==='talk'&&side===1){elbow=[.113,shoulder-.066,.045];hand=[.136,shoulder-.068,.119];}
  if(pose==='point'&&side===1){elbow=[.107,shoulder-.013,.103];hand=[.094,shoulder-.014,.233];}
  if(working){elbow=[side*.106,shoulder-.092,.071+lean];hand=[side*.071,shoulder-.103,.169+lean];}
  if(carrying){elbow=[side*.116,shoulder-.10,.060];hand=[side*.102,hip+.035,.162];}
  if(seated){elbow=[side*.102,shoulder-.08,.060];hand=[side*.047,hip+.045,.132];if(pose==='talk'&&side===1){elbow=[.111,shoulder-.056,.060];hand=[.14,shoulder-.053,.137];}}
  if(pose==='read'||pose==='map'||pose==='readStand'){elbow=[side*.103,shoulder-.095,.082];hand=[side*.066,shoulder-.091,.172];}
  if(pose==='camera'){elbow=[side*.116,shoulder-.033,.083];hand=[side*.058,headY-.034,.113];}
  if(pose==='sip'&&side===1){elbow=[.111,shoulder-.052,.082];hand=[.042,headY-.023,.107];}
  if(pose==='hike'&&side===1){elbow=[.108,shoulder-.08,.095];hand=[.10,shoulder-.135,.177];}
  b.beam([side*.070,shoulder-.008,lean*.40],elbow,.024,color,23,7);b.beam(elbow,hand,.019,color,23,7);
  const cuff=lerpV(elbow,hand,.90);b.beam(cuff,hand,.020,'#c4c3a4',23,7);b.sphere(...hand,.020,.024,.018,skin,23,6,4);
 }
 if(pose==='bag'){if(v%3===0)littlePack(b,0,hip+.100,-.082,'#8e8e64');else littleCase(b,.134,hip-.175,.014,.75,['#98734e','#a58d5e','#617c70'][v%3]);}
 if(pose==='hike'||pose==='map'){littlePack(b,0,hip+.102,-.080,['#a28d59','#8d9060','#738779'][v%3]);for(const side of[-1,1])b.beam([side*.046,shoulder-.005,-.015],[side*.044,hip+.027,.043],.007,'#b4ab7f',23,5);}
 if(pose==='hike')b.beam([.10,shoulder-.135,.177],[.16,.014,.27],.006,'#a5986c',22,5);
 if(pose==='read'||pose==='readStand')littleBook(b,0,shoulder-.088,.168,true,['#7b6050','#61796b','#ac9362'][v%3]);
 if(pose==='map'){b.push(0,shoulder-.088,.185,-.31);b.box(0,0,0,.23,.006,.16,'#dcd4b4',23);for(let j=0;j<4;j++){b.box(-.076+j*.050,.005,0,.015,.001,.14,'#b7c2a4',23);b.beam([-.105,.008,-.041+j*.027],[.106,.008,.018+j*.019],.0025,'#a58c64',23,4);}b.pop();}
 if(carrying){b.box(0,hip+.021,.168,.19,.12,.14,'#b09868',22);for(let j=0;j<4;j++)b.box(-.074+j*.05,hip+.026,.242,.012,.104,.010,'#d3bc87',22);}
 if(pose==='paint'){b.beam([.071,shoulder-.103,.169+lean],[.049,shoulder-.095,.298+lean],.0043,'#b69a61',22,5);b.sphere(.049,shoulder-.095,.306+lean,.006,.006,.014,'#657e61',23,6,4);}
 if(pose==='work')b.beam([-.072,shoulder-.103,.175+lean],[.077,shoulder-.08,.214+lean],.0055,'#b8bba1',41,6);
 if(pose==='camera'){b.box(0,headY-.030,.126,.092,.055,.037,'#4b554b',41);b.cylinder(0,headY-.030,.159,.023,.023,.036,'#293e37',43,12,PI/2);b.beam([-.038,headY-.01,.11],[-.051,shoulder-.12,.066],.003,'#8e8864',22,4);}
 if(pose==='sip'){b.cylinder(.042,headY-.025,.119,.019,.021,.043,'#dcd1ae',23,9);b.cylinder(.042,headY-.002,.119,.015,.015,.003,'#67533c',23,9);}
 b.pop();
}

person=function(b,x,y,z,c='#d9ba88',angle=0,scale=1){
 const v=Math.floor(hash(x,z)*100),pose=['stand','talk','bag','stand','readStand','stand','talk','bag'][v%8];
 littlePerson(b,x,y,z,{color:c,angle,scale,variant:v,pose});
};

function littleDog(b,x,y,z,angle=0,s=1){
 b.push(x,y,z,0,angle,0,s);b.sphere(0,.16,0,.075,.075,.17,'#a17e54',23,8,5);b.sphere(0,.24,.14,.07,.075,.08,'#a17e54',23,8,5);
 b.box(0,.225,.213,.07,.05,.07,'#bb9464');for(const side of[-1,1]){b.sphere(side*.068,.245,.125,.025,.067,.04,'#6e513a',23,7,4);for(const zz of[-.105,.095])b.beam([side*.05,.16,zz],[side*.06,.015,zz],.016,'#ae8659',23,5);}
 b.beam([0,.16,-.14],[.02,.28,-.25],.014,'#92704c',23,5);b.pop();
}
function littleBicycle(b,x,y,z,angle=0,s=1){
 b.push(x,y,z,0,angle,0,s);for(const zz of[-.23,.23]){ringX(b,0,.18,zz,.14,.163,.024,'#3d4540',41,16);ringX(b,0,.18,zz,.134,.141,.016,'#a6b09a',41,16);b.cylinder(0,.18,zz,.019,.019,.05,'#a5b29c',41,8,0,PI/2);for(let k=0;k<8;k++){const a=k*TAU/8;b.beam([0,.18,zz],[0,.18+Math.cos(a)*.135,zz+Math.sin(a)*.135],.0025,'#a5b19b',41,4);}}
 for(const [a,q]of[[[0,.18,-.23],[0,.36,-.12]],[[0,.36,-.12],[0,.18,.02]],[[0,.18,.02],[0,.18,-.23]],[[0,.18,.02],[0,.37,.18]],[[0,.37,.18],[0,.36,-.12]],[[0,.18,.23],[0,.43,.16]]])b.beam(a,q,.012,'#788c73',41,5);
 b.box(0,.39,-.13,.09,.03,.13,'#8b6948',23);b.beam([-.09,.43,.16],[.09,.43,.16],.012,'#d4c4a1',41,5);for(const side of[-1,1]){b.beam([0,.18,.02],[side*.063,.18+side*.036,.02],.007,'#a4ae97',41,5);b.box(side*.075,.18+side*.036,.02,.057,.013,.031,'#566657',41);}b.pop();
}
function littleChair(b,x,y,z,angle=0,color='#78866b'){
 b.push(x,y,z,0,angle);b.box(0,.183,0,.205,.027,.19,color,22);for(const side of[-1,1])for(const zz of[-.068,.070])b.beam([side*.075,.17,zz],[side*.086,.01,zz*1.22],.011,'#596c59',41,6);
 for(const side of[-1,1])b.beam([side*.085,.12,-.079],[side*.085,.37,-.106],.010,'#596c59',41,6);for(const yy of[.273,.320,.360])b.box(0,yy,-.100,.195,.021,.018,color,22);b.pop();
}
function cafeScene(b,x,y,z,angle=0){
 b.push(x,y,z,0,angle);b.cylinder(0,.296,0,.32,.32,.034,'#ae9065',22,18);b.cylinder(0,.15,0,.018,.024,.29,'#567361',41,8);
 for(const a of[0,TAU/3,TAU*2/3])b.beam([0,.034,0],[Math.sin(a)*.17,.016,Math.cos(a)*.17],.012,'#6f8069',41,6);
 for(let i=0;i<3;i++){const a=i*TAU/3,px=Math.sin(a)*.55,pz=Math.cos(a)*.55;b.push(px,0,pz,0,a+PI);littleChair(b,0,0,0,0,['#77846b','#aa946b','#6f8c7a'][i]);littlePerson(b,0,0,0,{pose:['read','sip','talk'][i],seated:true,seatHeight:.198,color:PEOPLE_COLORS[i+2],variant:i+3,gaze:i===2?.24:0});b.pop();}
 for(const xx of[-.15,.15]){b.cylinder(xx,.321,.065,.041,.041,.009,'#d9d0af',23,12);b.cylinder(xx,.348,.065,.026,.029,.05,'#ded5b3',23,10);b.cylinder(xx,.374,.065,.022,.022,.003,'#65503a',23,9);}
 b.cylinder(-.08,.318,-.12,.081,.081,.011,'#dad0ac',23,14);b.sphere(-.08,.337,-.12,.048,.020,.032,'#b9995f',23,8,5);b.box(.125,.318,-.13,.11,.006,.09,'#d7c8a3',23);
 b.cylinder(0,.592,0,.011,.011,1.18,'#927d55',41,8);
 for(let i=0;i<14;i++){const a=i*TAU/14,q=(i+1)*TAU/14;b.tri([0,1.19,0],[Math.sin(a)*.89,1.02,Math.cos(a)*.89],[Math.sin(q)*.89,1.02,Math.cos(q)*.89],i%2?'#dacead':'#ac8768',23);b.beam([0,1.175,0],[Math.sin(a)*.86,1.018,Math.cos(a)*.86],.007,'#b4a077',22,5);}
 b.sphere(0,1.211,0,.028,.032,.028,'#b7a175',22,8,5);b.pop();
}
function marketStall(b,x,y,z,variant=0){
 b.push(x,y,z);b.box(0,.198,0,1.65,.31,.77,'#a58a61',22);b.box(0,.361,0,1.74,.025,.85,'#c6b78d',23);
 for(const side of[-1,1])b.beam([side*.79,0,-.28],[side*.79,1.09,-.28],.020,'#a99365',22,7);
 for(let i=0;i<12;i++){b.push(-.9+(i+.5)*.15,1.073,.1,-.11);b.box(0,0,0,.15,.025,1.22,i%2?'#ddcdae':['#a6795e','#709378','#a3a064'][variant%3],23);b.box(0,-.043,.601,.15,.081,.017,i%2?'#ddcdae':['#a6795e','#709378','#a3a064'][variant%3],23);b.pop();}
 for(let tray=0;tray<3;tray++){b.box(-.53+tray*.53,.399,.02,.45,.064,.58,'#786d48',22);for(let j=0;j<9;j++)b.sphere(-.675+tray*.53+(j%3)*.143,.448+(j%2)*.008,-.17+Math.floor(j/3)*.16,.043,.044,.042,['#b88150','#a3aa62','#aa6551'][tray],23,7,4);}
 b.box(.80,.227,.05,.014,.21,.24,'#4e6956',22);b.box(.81,.227,.051,.003,.15,.18,'#d6caa3',23);
 littlePerson(b,.28,0,-.59,{pose:'work',variant:variant+1,color:'#b1a77b'});littlePerson(b,-.42,0,.79,{pose:'bag',angle:PI,variant:variant+2,color:PEOPLE_COLORS[variant%8]});b.pop();
}

// These small arrangements have their own purpose and working surface. They
// are placed once, as static geometry, in the finished miniature landscapes.
function littleRope(b,x,y,z,r=.13,turns=3){
 for(let i=0;i<turns*20;i++){const point=j=>{const a=j*TAU/20,rr=r*(.28+.72*j/(turns*20));return[x+Math.sin(a)*rr,y+.007,z+Math.cos(a)*rr];};b.beam(point(i),point(i+1),.006,'#b6a57a',22,5);}
}
function littleTrolley(b,x,y,z,angle=0){
 b.push(x,y,z,0,angle);b.box(0,.137,.08,.38,.035,.56,'#81927a',22);for(const side of[-1,1]){b.cylinder(side*.213,.123,.02,.117,.117,.047,'#4d5d4c',41,12,0,PI/2);b.cylinder(side*.24,.123,.02,.040,.040,.008,'#a8b090',41,10,0,PI/2);b.beam([side*.16,.125,-.22],[side*.16,.448,-.32],.014,'#75816a',41,6);}b.beam([-.16,.448,-.32],[.16,.448,-.32],.016,'#a4966c',22,7);
 littleCase(b,-.037,.156,.12,1.0,'#9b8058',PI/2);littleCase(b,.028,.370,.12,.73,'#688476',PI/2);b.box(.038,.536,.12,.22,.067,.14,'#c7b99a',23);b.pop();
}
function littlePorterScene(b,x,y,z,angle=0){
 b.push(x,y,z,0,angle);littleTrolley(b,0,0,0);littlePerson(b,0,0,-.53,{pose:'work',variant:12,color:'#5f7769'});littlePerson(b,.69,0,.16,{pose:'bag',variant:16,color:'#b39a66',angle:-.7});littleCase(b,.44,0,.60,.82,'#99754e',.16);b.pop();return 2;
}
function littleHarborScene(b,x,y,z,angle=0){
 b.push(x,y,z,0,angle);
 // A net is being repaired over a low frame; the mesh sags between its rails.
 for(const side of[-1,1]){b.beam([side*.34,.015,-.05],[side*.29,.275,-.05],.016,'#8e815d',22,6);b.beam([side*.34,.015,.51],[side*.29,.275,.51],.016,'#8e815d',22,6);b.beam([side*.29,.275,-.05],[side*.29,.275,.51],.012,'#a5996e',22,5);}
 const netPoint=(u,v)=>[(u-.5)*.59,.276-Math.sin(u*PI)*Math.sin(v*PI)*.055,-.05+v*.56];
 for(let i=0;i<=10;i++)for(let j=0;j<10;j++){b.beam(netPoint(i/10,j/10),netPoint(i/10,(j+1)/10),.0027,'#b1b798',22,4);b.beam(netPoint(j/10,i/10),netPoint((j+1)/10,i/10),.0027,'#b1b798',22,4);}
 b.box(0,.085,-.39,.25,.17,.24,'#9a8f68',22);littlePerson(b,0,0,-.39,{pose:'work',seated:true,seatHeight:.184,variant:15,color:'#829790'});
 littlePerson(b,.78,0,.29,{pose:'carry',variant:11,color:'#b09e6e',angle:-.5});
 // Two curved crab pots, a coil, and a sorted fish box beside the work.
 for(const zz of[-.24,.28]){b.push(-.75,.165,zz);for(const xx of[-.17,0,.17])ringX(b,xx,0,0,.143,.155,.014,'#9d956c',22,12);for(let i=0;i<12;i++){const a=i*TAU/12;b.beam([-.18,Math.cos(a)*.15,Math.sin(a)*.15],[.18,Math.cos(a)*.15,Math.sin(a)*.15],.005,'#b1ac7f',22,5);}b.pop();}
 littleRope(b,-.70,.009,.75,.15,3);b.box(.53,.083,-.40,.37,.165,.27,'#9b8d63',22);b.box(.53,.171,-.40,.31,.01,.22,'#697c68',23);
 for(let i=0;i<3;i++){b.sphere(.44+i*.083,.192,-.41,.025,.019,.084,'#aab7a8',41,7,4);b.tri([.44+i*.083,.20,-.33],[.407+i*.083,.20,-.305],[.471+i*.083,.20,-.305],'#93a796',41);}
 b.pop();return 2;
}
function littleMapParty(b,x,y,z,angle=0){
 b.push(x,y,z,0,angle);littlePerson(b,0,0,0,{pose:'map',variant:10,color:'#8d9164'});littlePerson(b,.47,0,.22,{pose:'point',variant:17,color:'#a57f60',angle:-1.5});littlePerson(b,-.33,0,.36,{pose:'hike',variant:14,color:'#6e8d85',scale:.72,angle:2.6});
 b.box(-.59,.35,-.27,.08,.70,.08,'#9b8860',22);for(const [yy,dir,c]of[[.53,1,'#c7b57e'],[.65,-1,'#b6b488']]){b.box(-.59+dir*.09,yy,-.27,.31,.08,.045,c,22);b.tri([-.59+dir*.25,yy-.04,-.245],[-.59+dir*.31,yy,-.245],[-.59+dir*.25,yy+.04,-.245],c,22);}b.pop();return 3;
}
function littleReadingScene(b,x,y,z,angle=0){
 b.push(x,y,z,0,angle);
 for(let i=0;i<3;i++)b.box(0,.196,(i-1)*.076,.79,.025,.064,'#a18d61',22);for(const side of[-1,1]){b.box(side*.29,.096,0,.027,.192,.20,'#697d65',41);b.beam([side*.29,.14,-.095],[side*.29,.43,-.117],.014,'#71846a',41,6);}for(let i=0;i<3;i++)b.box(0,.291+i*.052,-.11,.79,.034,.024,'#a18d61',22);
 littlePerson(b,-.18,0,.015,{pose:'read',seatHeight:.219,variant:9,color:'#7c9485'});littlePerson(b,.21,0,.025,{pose:'sip',seatHeight:.219,variant:20,color:'#b1966d',scale:1});littleCase(b,-.61,0,-.01,.85,'#98774f',-.12);littleDog(b,.71,0,.32,-1.7,.73);b.pop();return 2;
}
function littleAtelierScene(b,x,y,z,angle=0){
 b.push(x,y,z,0,angle);
 b.box(0,.312,0,.91,.045,.54,'#b5a078',22);for(const side of[-1,1])for(const zz of[-.19,.19])b.beam([side*.35,.292,zz],[side*.39,.01,zz*1.12],.019,'#8a8f6b',22,6);
 // A model within the model: short rails, a tiny engine and a partly built
 // cottage on a green cutting mat, with an open plan and sorted paint pots.
 b.box(-.095,.340,.03,.45,.015,.32,'#749181',23);for(let i=0;i<5;i++)b.box(-.27+i*.084,.350,.025,.016,.013,.23,'#b2b69a',22);for(const zz of[-.04,.09])b.box(-.095,.364,zz,.46,.009,.009,'#bfc5ae',41);
 b.box(-.093,.394,.022,.16,.047,.061,'#677d62',23);b.box(-.145,.433,.022,.057,.044,.064,'#71856b',23);b.cylinder(-.045,.429,.022,.010,.012,.036,'#737b5f',41,7);for(const xx of[-.145,-.055])for(const zz of[-.015,.058])b.cylinder(xx,.378,zz,.014,.014,.009,'#454f40',41,8,PI/2);
 b.box(.31,.352,.06,.15,.025,.16,'#c5b997',22);b.box(.31,.411,.06,.108,.09,.13,'#ded1ae',23);b.tri([.24,.461,-.01],[.31,.505,-.01],[.38,.461,-.01],'#92a17f',23);b.quad([.31,.505,-.01],[.31,.505,.13],[.24,.461,.13],[.24,.461,-.01],'#72896b',23);b.quad([.31,.505,.13],[.31,.505,-.01],[.38,.461,-.01],[.38,.461,.13],'#8a9c78',23);
 for(let i=0;i<4;i++){b.cylinder(-.28+i*.094,.365,-.20,.024,.026,.061,['#b59262','#708b78','#c0b79b','#a8785e'][i],23,8);b.cylinder(-.28+i*.094,.4,-.20,.027,.027,.01,'#c9c5a9',41,8);}littleBook(b,.19,.343,-.16,true,'#7f957b',.3);
 littlePerson(b,-.055,0,-.47,{pose:'paint',variant:21,color:'#8e997d'});littlePerson(b,.66,0,.08,{pose:'talk',variant:19,color:'#b19a73',angle:-1.55});littlePerson(b,-.51,0,.45,{pose:'camera',variant:13,color:'#6d8b83',scale:.72,angle:2.5});
 b.box(-.64,.10,-.15,.23,.20,.30,'#ac9c70',22);for(let i=0;i<4;i++)b.box(-.64,.21+i*.035,-.15,.20,.027,.25,['#b5bfa2','#8d9e8c','#c1bda0'][i%3],23);b.pop();return 3;
}
function littleBird(b,x,y,z,angle=0){
 b.push(x,y,z,0,angle);b.sphere(0,.065,0,.055,.05,.098,'#c7c8ae',23,7,4);b.sphere(0,.114,.069,.035,.037,.034,'#dfdac0',23,7,4);b.tri([-.013,.11,.10],[.013,.11,.10],[0,.105,.15],'#c3ac72',23);for(const side of[-1,1])b.beam([side*.027,.05,0],[side*.029,.007,.02],.005,'#a49369',23,5);b.tri([-.045,.073,-.025],[0,.088,-.135],[.045,.073,-.025],'#99aaa0',23);b.pop();
}

function miniatureTrackClear(scene,x,z,radius=0){
 const routes=scene.routes||[];
 for(const edge of routes)for(let d=0;d<edge.length;d+=.65){const a=edge.at(d).p,q=edge.at(Math.min(edge.length,d+.65)).p,dx=q[0]-a[0],dz=q[2]-a[2],t=clamp(((x-a[0])*dx+(z-a[2])*dz)/(dx*dx+dz*dz||1));if(Math.hypot(x-a[0]-dx*t,z-a[2]-dz*t)<1.30+radius)return false;}
 return true;
}
function buildRoomLifeDetails(key,scene){
 const b=new Builder(),details=[],omitted=[];let population=0;
 let communityVertices=0;
 const place=(name,fn,x,z,angle=0,radius=1,y=null,credits=[],contribution=null,placement=null)=>{
  const before=b.data.length;
  const reject=reason=>{if(contribution)omitted.push({id:contribution,placement,at:[x,z],reason});};
  if(scene.canPlace&&!scene.canPlace(x,z,radius))return reject(scene.placementIssue?.(x,z,radius)||'The footprint is outside this room’s buildable ground.');
  if(!miniatureTrackClear(scene,x,z,radius))return reject('The footprint is too close to a railway.');
  let surface=y??scene.height(x,z)+.012;if(!Number.isFinite(surface))return reject('The placement has no finite ground height.');
  // A tiny arrangement only occupies stable ground. Explicit deck heights
  // identify existing paving, never a guessed height over water or a slope.
  const terrace=fn===littleAtelierScene||fn===littleReadingScene||fn.communityTerrace;
  const boundary=[[-1,-.72],[-.72,-1],[.72,-1],[1,-.72],[1,.72],[.72,1],[-.72,1],[-1,.72]].map(([dx,dz])=>[x+dx*radius,z+dz*radius]);
  const heights=boundary.map(([x,z])=>scene.height(x,z));
  if(y===null&&heights.some(h=>!Number.isFinite(h)||Math.abs(h-surface)>.30))return reject('The ground changes by more than 0.30 across the footprint. Choose flatter ground.');
  if(y===null&&terrace){
   // A modest stone terrace levels the bench or the cottage worktable. Its
   // low retaining edge meets the actual slope instead of leaving feet aloft.
   surface=Math.max(surface,...heights)+.025;const color=key==='studio'?'#bab396':'#b0b298';
   for(let i=0;i<boundary.length;i++){const a=boundary[i],q=boundary[(i+1)%boundary.length];b.tri([x,surface-.003,z],[q[0],surface-.003,q[1]],[a[0],surface-.003,a[1]],color,4);b.quad([a[0],scene.height(...a)-.014,a[1]],[q[0],scene.height(...q)-.014,q[1]],[q[0],surface-.003,q[1]],[a[0],surface-.003,a[1]],shade(color,.88),4);}
   for(const side of[-1,1])b.beam([x+side*radius*.40,surface-.001,z-radius*.92],[x+side*radius*.40,surface-.001,z+radius*.92],.006,shade(color,.84),4,4);
  }
  const count=fn(b,x,surface,z,angle)||0;
  if(contribution){communityVertices+=(b.data.length-before)/12;if(communityVertices>COMMUNITY_LIMITS.vertices)throw new Error(key+' community scenery exceeds its vertex budget.');}
  population+=count;details.push({name,x,y:surface,z,population:count,credits,contribution,placement});
 };
 communityMiniatures(key,place);
 if(key==='coast'){
  // An existing harbor bench supplies its own correct seat level.
  littlePerson(b,-13.25,1.34,5.8,{pose:'read',seatHeight:.353,variant:24,color:'#ac946e',angle:PI/2});population++;
  littleBird(b,-11.28,1.37,5.1,1.1);littleBird(b,-11.25,1.37,5.48,-.5);littleRope(b,-11.31,1.38,12.1,.19,3);
 }else if(key==='alpine'){
  // The refuge terrace is a constructed level surface in alpineRoom.
  const hutY=scene.height(31,-17)+.06;place('A photographer at the refuge',(b,x,y,z,a)=>{littlePerson(b,x,y,z,{pose:'camera',variant:27,color:'#83958b',angle:a});littlePack(b,x+.43,y+.10,z-.10,'#a29669');return 1;},32.5,-14.9,-.35,.50,hutY);
 }else if(key==='studio'){
  place('Watching the pond',(b,x,y,z,a)=>{littlePerson(b,x,y,z,{pose:'camera',variant:26,color:'#8b9b76',angle:a});littlePerson(b,x+.35,scene.height(x+.35,z+.37)+.012,z+.37,{pose:'point',variant:25,scale:.66,color:'#b69c71',angle:a});littleBird(b,x-.40,scene.height(x-.40,z-.23)+.012,z-.23,.8);return 2;},-12.9,12.1,-1.9,.68);
 }
 return {mesh:b.mesh(),population,details,omitted,communityVertices};
}

function valleyFigureClear(x,z,radius=.18,deck=false){
 if(nearestTrack(x,z).dist<1.30+radius||!deck&&terrainH(x,z)<.34)return false;
 if(typeof objects==='undefined'||typeof assetById==='undefined')return true;
 const solid=['cottage','bakery','inn','church','station','signalbox','watertower','goods','townhouse','warehouse','chalet','barn','windmill','sawmill','crane','silo','lighthouse','boulder'];
 return !objects.some(o=>{
  if(!solid.includes(o.type))return false;const asset=assetById[o.type];if(!asset)return false;
  const c=Math.cos(o.angle),s=Math.sin(o.angle),dx=x-o.x,dz=z-o.z,scale=o.scale||1;let xx=c*dx-s*dz,zz=s*dx+c*dz,w=(o.params?.w||asset.w)*scale,d=(o.params?.d||asset.d)*scale;
  // The station's catalog bounds include its open passenger platform. Only
  // the actual booking hall obstructs a figure or the walking route.
  if(o.type==='station'){xx-=1*scale;zz+=1.1*scale;w=4.6*scale;d=2.1*scale;}
  return Math.abs(xx)<w*.5+radius&&Math.abs(zz)<d*.5+radius;
 });
}
function buildValleyLife(){
 const b=new Builder(),actors=[];let population=0;
 const addPerson=(x,z,pose='stand',a=0,s=1,y=null)=>{if(!valleyFigureClear(x,z,.18,y!==null))return;const v=population++;littlePerson(b,x,y??terrainH(x,z)+.012,z,{pose,angle:a,scale:s,variant:v,color:PEOPLE_COLORS[v%8]});};
 // Forecourt: the morning market, a café, and small groups between the shops.
 for(let i=0;i<4;i++){marketStall(b,-31+i*2.55,.79,16.4,i);population+=2;}
 for(let i=0;i<3;i++){cafeScene(b,-12+i*2.55,.79,17.4,.12);population+=3;}
 for(let i=0;i<24;i++)addPerson(-34+i*1.1,18.6+(i%3)*.27,['talk','bag','stand','readStand'][i%4],i%2?PI:0,i%7===0?.66:1);
 for(const [x,z,a]of[[27.8,7.1,.7],[28.4,7.8,-.4],[32,9.2,.3],[32.6,9.5,2.3],[39.1,7.1,1.2],[39.6,7.4,2.2],[41.2,10.1,-.8],[41.8,10.4,2.2],[43.8,9.2,-.3],[45.4,10.6,.8]])addPerson(x,z,population%3?'work':'carry',a);
 for(let i=0;i<18;i++){const x=-37+(i%6)*5,z=-1+Math.floor(i/6)*5;addPerson(x,z,['bag','talk','stand','readStand'][i%4],i*.7);}
 if(valleyFigureClear(-33.7,16.8,1.1))population+=littlePorterScene(b,-33.7,.79,16.8,-.3);
 // Anglers sit on the actual quay edge with their legs over the water.
 for(let i=0;i<4;i++){const x=.3+i*1.22;littlePerson(b,x,.755,3.28,{pose:'perch',color:PEOPLE_COLORS[i],variant:i});b.beam([x+.07,1.015,3.47],[x+.11,1.8,4.25],.009,'#b79c6d',22,5);b.beam([x+.11,1.8,4.25],[x+.13,.23,4.29],.0025,'#d6cead',0,4);b.cylinder(x-.24,.84,2.98,.064,.070,.16,'#849e92',41,10);population++;}
 population+=littleHarborScene(b,3.60,.755,1.83,0);
 for(let i=0;i<7;i++)addPerson(14.7+(i%4)*.8,6.7+Math.floor(i/4)*.42,i%3?'talk':'bag',i*.9,1,.715);
 for(let i=0;i<10;i++){const x=-29+i*2.0,z=-25.1;addPerson(x,z,i%3?'hike':'map',1.2);}
 // Readers use the village-green benches already present in the layout.
 for(const x of[-23,-20])if(valleyFigureClear(x,2.5,.12)){littlePerson(b,x,terrainH(x,2.5)+.005,2.5,{pose:'read',seatHeight:.353,variant:population,color:x===-23?'#ab956c':'#728c7b',angle:PI});population++;}
 for(let i=0;i<8;i++){const x=-29+i*3.1;if(valleyFigureClear(x,18.95,.25))littleBicycle(b,x,terrainH(x,18.95)+.015,18.95,1.4);}
 littleDog(b,-22.4,.79,18.7,.7);littleDog(b,2.3,.755,2.1,1.7,.82);
 littleBird(b,4.84,.965,1.4,.7);littleRope(b,-.42,.76,2.2,.18,3);
 // Two separate strolls pass on either side of the booking hall. No walker
 // traverses its walls; their ground height stays constant over the paving.
 for(let i=0;i<12;i++){const west=i<6,z=west?18.18+(i%2)*.24:18.29+(i%2)*.24;actors.push({a:[west?-34:-14.7,.79,z],b:[west?-23.1:-6.2,.79,z],speed:.12+i%3*.023,offset:i*.079,variant:i,scale:i%5===0?.7:1});}
 for(let i=0;i<4;i++)actors.push({a:[14.5,.715,7.45+i*.12],b:[17.6,.715,7.45+i*.12],speed:.026,offset:i*.25,variant:i+2,scale:1});
 return {mesh:b.mesh(),actors,population:population+actors.length,visitorCount:0};
}

const walkingMeshes=[];
function initWalkingFigures(){for(let v=0;v<6;v++){walkingMeshes[v]=[];for(let frame=0;frame<12;frame++){const b=new Builder();littlePerson(b,0,0,0,{pose:'walk',color:PEOPLE_COLORS[v],variant:v,phase:frame*TAU/12});walkingMeshes[v].push(b.mesh());}}}
function drawWalkingFigures(actors,p){
 for(const actor of actors){
  const t=(clock*actor.speed/Math.max(len(sub(actor.b,actor.a)),1)+actor.offset)%2,forward=t<1,u=forward?t:2-t;
  const pos=lerpV(actor.a,actor.b,u),f=norm(sub(forward?actor.b:actor.a,forward?actor.a:actor.b));
  const gait=reduceMotion?0:Math.floor((clock*1.45+actor.offset)*12)%12;
  draw(walkingMeshes[actor.variant%6][gait],mm(basis(pos,f),scaling(actor.scale)),p);
 }
}
