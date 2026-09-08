'use strict';

// Figures share a small, deliberately handmade vocabulary. Static crowds are
// batched into their room; only walkers and the occasional waving arm move.
const PEOPLE_COLORS=['#9b5c4e','#527879','#d0aa66','#6d7955','#746581','#bd8060','#54709a','#cfb997'];
const SKIN_COLORS=['#e0b896','#b98762','#8b5f45','#d0a17a','#ae7856'];
function littlePerson(b,x,y,z,options={}){
 const {color='#527879',angle=0,scale=1,pose='stand',variant=0,phase=0}=options;
 const skin=SKIN_COLORS[Math.abs(variant)%SKIN_COLORS.length],pants=variant%3===0?'#74614f':'#3e4b4e';
 b.push(x,y,z,0,angle,0,scale);
 const seated=pose==='sit', hip=seated?.24:.245, shoulder=seated?.39:.445, head=seated?.525:.575;
 b.cylinder(0,(hip+shoulder)/2,0,.085,.098,shoulder-hip,color,23,8);
 b.cylinder(0,shoulder+.022,0,.033,.030,.06,skin,0,7);
 b.sphere(0,head,0,.074,.085,.071,skin,0,9,6);
 b.sphere(0,head+.038,-.018,.077,.057,.064,variant%4===0?'#c6b7a1':'#524435',23,8,5);
 b.sphere(0,head-.005,.071,.019,.021,.024,skin,0,6,4);
 for(const s of[-1,1])b.sphere(s*.028,head+.018,.066,.006,.007,.004,'#343431',0,5,3);
 if(variant%3===0||pose==='work'){
  b.cylinder(0,head+.086,0,.085,.066,.04,pose==='work'?'#caa653':'#74634d',23,10);
  b.cylinder(0,head+.066,.015,.105,.105,.013,pose==='work'?'#d3b76b':'#74634d',23,10);
 }
 if(variant%3===1){b.box(0,shoulder-.015,.09,.036,.09,.014,'#e4cf9d',23);b.box(.027,shoulder-.096,.095,.036,.095,.014,'#e4cf9d',23);}
 if(pose==='paint'){b.box(0,(hip+shoulder)/2,.081,.144,.23,.022,'#b4aa88',23);b.beam([-.057,shoulder,0],[-.042,hip,.08],.009,'#c9b994',23);}
 for(const s of[-1,1]){
  const stride=pose==='walk'?Math.sin(phase)*s*.08:0;
  const knee=seated?[s*.05,.235,.15]:[s*.052,.13,stride];
  const foot=[s*.055,.025,seated?.18:stride*.8+.02];
  b.beam([s*.044,hip,0],knee,.031,pants,23,6);b.beam(knee,foot,.027,pants,23,6);
  b.box(foot[0],.022,foot[2]+.029,.072,.045,.12,'#3a3932',0);
  let elbow=[s*.128,shoulder-.10,-stride],hand=[s*.14,shoulder-.19,-stride*.8+.025];
  if(pose==='wave'&&s===1){elbow=[.15,shoulder+.025,0];hand=[.175,head+.12,.015];}
  if(pose==='talk'&&s===1){elbow=[.14,shoulder-.09,.035];hand=[.18,shoulder-.06,.13];}
  if(pose==='paint'||pose==='work'){elbow=[s*.14,shoulder-.1,.075];hand=[s*.07,shoulder-.04,.21];}
  if(seated){elbow=[s*.115,shoulder-.12,.06];hand=[s*.065,.265,.17];}
  b.beam([s*.076,shoulder,0],elbow,.029,color,23,6);b.beam(elbow,hand,.025,color,23,6);b.sphere(...hand,.027,.033,.027,skin,0,6,4);
 }
 if(pose==='bag'){b.box(.18,.16,.04,.13,.18,.10,'#b19159',22);b.beam([.15,.25,.04],[.18,.29,.04],.009,'#755d40',22);}
 if(pose==='paint')b.beam([.068,shoulder-.04,.20],[.06,shoulder+.045,.38],.006,'#b08958',22,5);
 if(pose==='work')b.beam([.06,shoulder-.04,.18],[.06,.11,.45],.008,'#b7b5a2',41,5);
 b.pop();
}
person=function(b,x,y,z,c='#d9ba88',angle=0,scale=1){
 const v=Math.floor(hash(x,z)*100),pose=['stand','talk','bag','stand','wave'][v%5];
 littlePerson(b,x,y,z,{color:c,angle,scale,variant:v,pose});
};

function littleDog(b,x,y,z,angle=0,s=1){
 b.push(x,y,z,0,angle,0,s);b.sphere(0,.16,0,.075,.075,.17,'#a17e54',23,8,5);b.sphere(0,.24,.14,.07,.075,.08,'#a17e54',23,8,5);
 b.box(0,.225,.213,.07,.05,.07,'#bb9464');for(const side of[-1,1]){b.sphere(side*.068,.245,.125,.025,.067,.04,'#6e513a',23,7,4);for(const zz of[-.105,.095])b.beam([side*.05,.16,zz],[side*.06,.015,zz],.016,'#ae8659',23,5);}
 b.beam([0,.16,-.14],[.02,.28,-.25],.014,'#92704c',23,5);b.pop();
}
function littleBicycle(b,x,y,z,angle=0,s=1){
 b.push(x,y,z,0,angle,0,s);for(const zz of[-.23,.23]){ringX(b,0,.18,zz,.14,.163,.024,'#3d4540',41,16);}
 for(const [a,q]of[[[0,.18,-.23],[0,.36,-.12]],[[0,.36,-.12],[0,.18,.02]],[[0,.18,.02],[0,.18,-.23]],[[0,.18,.02],[0,.37,.18]],[[0,.37,.18],[0,.36,-.12]],[[0,.18,.23],[0,.43,.16]]])b.beam(a,q,.012,'#788c73',41,5);
 b.box(0,.39,-.13,.09,.03,.13,'#8b6948',23);b.beam([-.09,.43,.16],[.09,.43,.16],.012,'#d4c4a1',41,5);b.pop();
}
function cafeScene(b,x,y,z,angle=0){
 b.push(x,y,z,0,angle);b.cylinder(0,.42,0,.38,.38,.055,'#bb9465',22,16);b.cylinder(0,.20,0,.035,.04,.40,'#526c62',41,8);
 for(let i=0;i<3;i++){const a=i*TAU/3,px=Math.sin(a)*.67,pz=Math.cos(a)*.67;b.push(px,0,pz,0,a+PI);bench(b,0,0,0);littlePerson(b,0,.10,.08,{pose:'sit',color:PEOPLE_COLORS[i+2],variant:i+3});b.pop();}
 for(const xx of[-.16,.16]){b.cylinder(xx,.48,.02,.035,.035,.07,'#e6d6b3',23,8);b.cylinder(xx,.519,.02,.026,.026,.005,'#5c4634',0,8);}
 b.box(.02,.461,-.16,.20,.006,.15,'#e5d6b3',0);
 b.cylinder(0,.94,0,.017,.017,1.85,'#807056',41,8);for(let i=0;i<12;i++){const a=i*TAU/12,q=(i+1)*TAU/12;b.tri([0,1.85,0],[Math.sin(a)*1.03,1.54,Math.cos(a)*1.03],[Math.sin(q)*1.03,1.54,Math.cos(q)*1.03],i%2?'#e7d8b4':'#b87e62',23);}
 b.pop();
}
function marketStall(b,x,y,z,variant=0){
 b.push(x,y,z);b.box(0,.45,0,1.8,.70,.9,'#a9855b',22);for(const s of[-1,1])b.beam([s*.88,0,-.30],[s*.88,1.68,-.30],.027,'#c0a273',22,6);
 for(let i=0;i<10;i++){b.push(-.9+(i+.5)*.18,1.60,0,-.13);b.box(0,0,0,.18,.035,1.30,i%2?'#eadbbc':['#9b6c57','#6f9276','#b3a264'][variant%3],23);b.pop();}
 for(let tray=0;tray<3;tray++){b.box(-.58+tray*.58,.83,.02,.5,.10,.66,'#7b6344',22);for(let j=0;j<8;j++)b.sphere(-.75+tray*.58+(j%2)*.18,.92+(j%3)*.016,-.19+Math.floor(j/2)*.14,.06,.059,.06,['#bf794c','#a8ab5c','#b55744'][tray],0,6,4);}
 littlePerson(b,.25,0,-.74,{pose:'talk',variant:variant+1,color:'#dfbd84'});littlePerson(b,-.56,0,1.10,{pose:'bag',angle:PI,variant:variant+2,color:PEOPLE_COLORS[variant%8]});b.pop();
}

function buildValleyLife(){
 const b=new Builder(),actors=[];let population=0;
 const addPerson=(x,z,pose='stand',a=0,s=1)=>{const v=population++;littlePerson(b,x,terrainH(x,z)+.035,z,{pose,angle:a,scale:s,variant:v,color:PEOPLE_COLORS[v%8]});};
 // Forecourt: a market, a café, and families meeting before their trains.
 for(let i=0;i<4;i++)marketStall(b,-31+i*2.55,.81,16.4,i);
 for(let i=0;i<3;i++)cafeScene(b,-12+i*2.55,.80,17.4,.12);
 for(let i=0;i<24;i++)addPerson(-34+i*1.1,18.6+(i%3)*.27,['talk','bag','wave'][i%3],i%2?PI:0,i%7===0?.66:1);
 for(let i=0;i<20;i++){const x=27.5+(i%6)*2.7,z=7+Math.floor(i/6)*1.1;if(nearestTrack(x,z).dist>1.2)addPerson(x,z,i%2?'work':'talk',i*.8);}
 for(let i=0;i<18;i++){const x=-37+(i%6)*5,z=-1+Math.floor(i/6)*5;if(nearestTrack(x,z).dist>1.3)addPerson(x,z,['bag','talk','stand'][i%3],i*.7);}
 // Fishing off the quay, complete with lines, buckets and a dog waiting.
 for(let i=0;i<4;i++){const x=.3+i*1.22;littlePerson(b,x,.76,2.95,{pose:'sit',color:PEOPLE_COLORS[i],variant:i});b.beam([x+.07,1.08,3.16],[x+.11,1.8,4.25],.009,'#b79c6d',22,5);b.beam([x+.11,1.8,4.25],[x+.13,.23,4.29],.0025,'#d6cead',0,4);b.cylinder(x-.3,.89,2.95,.10,.11,.23,'#849e92',41,10);population++;}
 for(let i=0;i<9;i++)addPerson(14.7+(i%4)*.8,6.7+Math.floor(i/4)*.42,i%3?'talk':'bag',i*.9);
 for(let i=0;i<14;i++){const x=-32+i*.72,z=30.7+(i%2)*.7;addPerson(x,z,'work',.4);}
 for(let i=0;i<10;i++){const x=-29+i*2.0,z=-25.1;addPerson(x,z,i%3?'bag':'wave',1.2);}
 for(let i=0;i<8;i++){const x=-29+i*3.1;littleBicycle(b,x,.81,18.95,1.4);}
 littleDog(b,-20,.83,19.7,.7);littleDog(b,2.3,.77,2.1,1.7);littleDog(b,-27,terrainH(-27,30.5)+.05,30.5,0);
 for(let i=0;i<12;i++)actors.push({a:[-34+i*.41,.84,19.35+(i%3)*.29],b:[-6-i*.26,.84,19.35+(i%3)*.29],speed:.14+i%3*.025,offset:i*.079,variant:i,scale:i%5===0?.7:1});
 for(let i=0;i<5;i++)actors.push({a:[14.5,.75,7.2+i*.16],b:[17.6,.75,7.2+i*.16],speed:.026,offset:i*.2,variant:i+2,scale:1});
 return {mesh:b.mesh(),actors,population:population+17+21,visitorCount:0};
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
