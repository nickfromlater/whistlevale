'use strict';

// KOPJE HOUSE. Original safari architecture and habitat details by
// nickfromlater, with agent assistance. Native, deterministic geometry only.
// All decking is cut around the pool and fire court, rather than covering it.
const KOPJE={timber:'#614831',teak:'#957447',endgrain:'#755739',linen:'#d7c7a0',stone:'#a79573',dark:'#2d4036',bronze:'#a0834f',reed:'#9c814f'};
function kopjeDeck(b,x,z,w,d,y=SAFARI_LODGE.floor){
 b.box(x,y-.22,z,w,.34,d,KOPJE.timber,22);
 const count=Math.ceil(w/.27),pitch=w/count;
 for(let i=0;i<count;i++){
  const xx=x-w/2+(i+.5)*pitch;
  b.box(xx,y-.025,z,pitch-.015,.06,d-.035,shade(KOPJE.teak,.92+hash(i,Math.round(x*3+z))* .16),22);
  if(i%3===0)for(const side of[-1,1])b.box(xx,y+.007,z+side*(d/2-.18),.012,.006,.012,'#524c36',41);
 }
 // Edge ledgers and visible paired diagonal braces carry the projecting deck.
 for(const side of[-1,1])b.box(x,y-.36,z+side*(d/2-.20),w,.28,.16,KOPJE.endgrain,22);
 for(let xx=x-w/2+.65;xx<x+w/2;xx+=4.1)for(const zz of[z-d/2+.40,z+d/2-.40]){
  const ground=safariSurface(xx,zz),top=y-.40;
  if(top<=ground+.12)continue;
  b.box(xx,(ground+top)/2,zz,.30,top-ground,.30,KOPJE.timber,22);
  b.box(xx,ground+.07,zz,.67,.22,.67,'#8e7e5e',4);
  for(const s of[-1,1])b.beam([xx,Math.max(ground+.15,top-.85),zz],[xx+s*.70,top,zz],.055,KOPJE.teak,22,5);
 }
}
function kopjeRoof(b,x,y,z,w,d,rise,variant=0){
 const ridge=w*.25,eave=(a,side)=>[x+a*w/2,y,z+side*d/2],peak=a=>[x+a*ridge,y+rise,z];
 const faces=[
  [eave(-1,1),eave(1,1),peak(-1),peak(1)],
  [eave(1,-1),eave(-1,-1),peak(1),peak(-1)],
  [eave(-1,-1),eave(-1,1),peak(-1),peak(-1)],
  [eave(1,1),eave(1,-1),peak(1),peak(1)]
 ];
 for(let face=0;face<4;face++){
  const [a,q,r,s]=faces[face],columns=Math.ceil(len(sub(q,a))/.43),rows=8;
  const point=(u,v,lift=0)=>{const p=lerpV(lerpV(a,q,u),lerpV(r,s,u),v);p[1]-=.32*Math.sin(v*PI);p[1]+=.055*Math.sin(u*PI)*Math.sin(v*PI)+lift;return p;};
  for(let j=0;j<rows;j++)for(let i=0;i<columns;i++){
   const u=i/columns,v=j/rows,uu=(i+1)/columns,vv=(j+1)/rows,c=shade(['#84673e','#927447','#a0814e'][j%3],.90+hash(i,face*31+j+variant)*.14);
   b.quad(point(u,v),point(uu,v),point(uu,vv),point(u,vv),c,23);
   // A projecting lower course casts a fine shadow in the woven thatch.
   b.quad(point(u,v,.040),point(uu,v,.040),point(uu,v+.016,.023),point(u,v+.016,.023),'#ad8d56',23);
  }
  // Fine straw bundles lie down the slope, with irregular staggered ends.
  for(let i=0;i<columns*2;i++){
   const u=(i+.45)/(columns*2),v0=.018+hash(i,face+variant)*.04,v1=.8+hash(i,face+48)*.18;
   for(let j=0;j<3;j++){
    const a=point(u,mix(v0,v1,j/3),.052),q=point(u,mix(v0,v1,(j+1)/3),.052);
    const side=mul(norm(sub(faces[face][1],faces[face][0])),.008);
    b.quad(sub(a,side),add(a,side),add(q,side),sub(q,side),i%4?'#b2925a':'#654f32',23);
   }
  }
  // Thick thatched eaves and exposed rafters make the roof bear on the frame.
  for(let i=0;i<columns;i++)b.quad(point(i/columns,0),point((i+1)/columns,0),point((i+1)/columns,0,-.22),point(i/columns,0,-.22),'#6e5333',23);
  for(let i=0;i<=Math.ceil(columns/10);i++){
   const u=i/Math.ceil(columns/10);for(let j=0;j<2;j++)b.beam(point(u,j/2,-.25),point(u,(j+1)/2,-.25),.055,KOPJE.timber,22,6);
  }
 }
 b.beam([x-ridge-.05,y+rise+.045,z],[x+ridge+.05,y+rise+.045,z],.145,'#6f5231',23,10);
 for(let xx=x-ridge;xx<=x+ridge;xx+=.29)b.beam([xx,y+rise+.085,z-.13],[xx+.065,y+rise+.16,z+.13],.018,'#bfa16b',22,4);
}
// The frame meets the underside of the actual hipped roof. End frames are
// lower than the ridge, so no king post or rafter pierces the thatch hips.
function kopjeRoofUnderside(dx,dz,h,rise,rw,rd){
 const v=clamp(Math.min(1-Math.abs(dz)/(rd/2),(rw/2-Math.abs(dx))/(rw*.25)));
 return SAFARI_LODGE.floor+h-.09+rise*v-.32*Math.sin(v*PI);
}
function kopjeFrame(b,x,z,w,d,h=3.8,rise=2.4,rw=w*1.3,rd=d*1.32){
 const y=SAFARI_LODGE.floor,top=(xx,zz)=>kopjeRoofUnderside(xx-x,zz-z,h,rise,rw,rd);
 for(const xx of[x-w/2,x,x+w/2])for(const zz of[z-d/2,z+d/2]){
  const hh=top(xx,zz)-y;
  b.box(xx,y+.09,zz,.44,.19,.44,'#b6a282',4);b.cylinder(xx,y+hh/2,zz,.13,.09,hh,KOPJE.timber,22,8);
  for(const side of[-1,1])b.beam([xx,y+hh-.95,zz],[xx+side*.71,y+hh-.10,zz],.06,KOPJE.teak,22,5);
  b.cylinder(xx,y+.28,zz,.144,.144,.11,KOPJE.bronze,41,8);
 }
 for(const zz of[z-d/2,z+d/2])b.box(x,top(x,zz)-.10,zz,w+.22,.22,.22,KOPJE.timber,22);
 for(const xx of[x-w/2,x,x+w/2]){
  const tie=top(xx,z-d/2)-.13;
  b.beam([xx,tie,z-d/2],[xx,tie,z+d/2],.065,KOPJE.teak,22,5);
  b.beam([xx,tie,z],[xx,top(xx,z)-.06,z],.055,KOPJE.timber,22,5);
  for(const side of[-1,1])for(let i=0;i<3;i++){
   const za=z+side*d/2*(1-i/3),zb=z+side*d/2*(1-(i+1)/3);
   b.beam([xx,top(xx,za)-.05,za],[xx,top(xx,zb)-.05,zb],.075,KOPJE.timber,22,6);
  }
 }
}
function kopjeLantern(b,x,y,z,scale=1){
 b.push(x,y,z,0,0,0,scale,scale,scale);
 b.box(0,.27,0,.20,.38,.20,'#e9c38a',6);
 for(const xx of[-.12,.12])for(const zz of[-.12,.12])b.beam([xx,.055,zz],[xx,.49,zz],.016,KOPJE.dark,41,4);
 b.box(0,.025,0,.30,.055,.30,KOPJE.bronze,41);b.cylinder(0,.56,0,.23,.05,.15,KOPJE.dark,41,4);
 for(let i=0;i<10;i++){const a=i*PI/10,q=(i+1)*PI/10;b.quad([Math.cos(a)*.075,.66+Math.sin(a)*.09,0],[Math.cos(a)*.095,.66+Math.sin(a)*.11,0],[Math.cos(q)*.095,.66+Math.sin(q)*.11,0],[Math.cos(q)*.075,.66+Math.sin(q)*.09,0],KOPJE.bronze,41);}
 b.pop();
}
function kopjePendant(b,x,y,z,r=.55){
 b.beam([x,y+1.25,z],[x,y+.30,z],.016,KOPJE.dark,41,5);
 b.cylinder(x,y,z,r,r*.61,.45,'#ac8f5c',23,16);
 for(let i=0;i<14;i++){const a=i*TAU/14;b.beam([x+Math.cos(a)*r,y-.23,z+Math.sin(a)*r],[x+Math.cos(a)*r*.61,y+.23,z+Math.sin(a)*r*.61],.010,'#5c4e32',22,4);}
 b.cylinder(x,y-.237,z,r*.87,r*.87,.018,'#f0cea0',6,16);
}
function kopjeRug(b,x,y,z,w,d){
 b.box(x,y,z,w,.025,d,'#baaa7a',23);
 for(const s of[-1,1]){b.box(x,y+.018,z+s*(d/2-.15),w-.15,.008,.17,'#6a7150',23);b.box(x+s*(w/2-.15),y+.018,z,.17,.008,d-.15,'#6a7150',23);}
 for(let i=-2;i<=2;i++)for(let j=-1;j<=1;j++){
  const xx=x+i*w*.15,zz=z+j*d*.20,rx=w*.06,rz=d*.07;
  b.quad([xx-rx,y+.024,zz],[xx,y+.024,zz+rz],[xx+rx,y+.024,zz],[xx,y+.024,zz-rz],(i+j)%2?'#836242':'#d9c597',23);
 }
 for(let i=0;i<35;i++)for(const s of[-1,1])b.beam([x-w/2+i*w/34,y,z+s*d/2],[x-w/2+i*w/34+.02,y,z+s*(d/2+.08)],.006,'#d1bb89',23,3);
}
function kopjeSofa(b,x,y,z,w=2.6,angle=0){
 b.push(x,y,z,0,angle);
 for(const xx of[-w*.40,w*.40])for(const zz of[-.36,.36])b.box(xx,.13,zz,.095,.26,.095,KOPJE.timber,22);
 b.box(0,.31,0,w,.25,.99,KOPJE.timber,22);
 const n=Math.ceil(w/.83);for(let i=0;i<n;i++){
  const xx=-w/2+(i+.5)*w/n;b.box(xx,.49,.04,w/n-.036,.17,.84,'#d4c6a5',23);b.box(xx,.83,-.42,w/n-.04,.60,.20,'#c6bb99',23);
  if(i%2===0){b.push(xx,.83,-.21,0,0,.12);b.box(0,0,0,.38,.38,.14,i%3?'#9c633d':'#687e59',23);b.box(0,0,.073,.28,.05,.014,'#cfb27a',23);b.pop();}
 }
 for(const s of[-1,1]){b.box(s*(w/2-.06),.64,0,.17,.41,.95,KOPJE.teak,22);b.box(s*(w/2-.06),.86,0,.19,.065,.95,'#c4ad80',22);}
 b.pop();
}
function kopjeChair(b,x,y,z,angle=0,wide=.65){
 b.push(x,y,z,0,angle);
 for(const side of[-1,1]){
  b.beam([side*wide/2,0,.34],[side*wide/2,.77,-.32],.027,KOPJE.timber,22,5);
  b.beam([side*wide/2,0,-.33],[side*wide/2,.43,.33],.027,KOPJE.timber,22,5);
  b.beam([side*wide/2,.61,.27],[side*wide/2,.73,-.26],.029,KOPJE.teak,22,5);
 }
 b.box(0,.415,.01,wide,.07,.59,'#c0aa7d',23);
 for(let i=0;i<10;i++)b.beam([-wide/2,.49+i*.026,-.23-i*.009],[wide/2,.49+i*.026,-.23-i*.009],.018,i%2?'#9a7b4d':'#c7ae79',22,5);
 b.box(0,.48,-.005,wide-.035,.07,.47,'#dbcdad',23);b.pop();
}
function kopjeTable(b,x,y,z,r=.7){
 b.cylinder(x,y+.38,z,.055,.055,.76,KOPJE.dark,41,8);b.cylinder(x,y+.02,z,r*.40,r*.34,.045,KOPJE.bronze,41,10);
 b.cylinder(x,y+.78,z,r,r,.085,'#bd9c67',22,28);
 for(const side of[-1,1]){
  b.cylinder(x+side*r*.43,y+.831,z,.145,.145,.014,'#dfd5b7',23,16);b.cylinder(x+side*r*.43,y+.878,z+.035,.037,.047,.086,'#e4dabd',24,10);
  b.beam([x+side*r*.66,y+.837,z-.10],[x+side*r*.66,y+.837,z+.10],.009,KOPJE.bronze,41,4);
 }
 kopjeLantern(b,x,y+.827,z,.36);
}
function kopjePot(b,x,y,z,r=.34,variant=0){
 b.cylinder(x,y+r*.56,z,r*.65,r,r*1.12,variant%2?'#87714b':'#a57550',3,10);
 b.cylinder(x,y+r*1.11,z,r*1.04,r*1.04,r*.10,'#c2a47d',3,12);b.cylinder(x,y+r*1.16,z,r*.90,r*.90,.016,'#514931',3,10);
 for(let i=0;i<9;i++){
  const a=i*2.399+variant,h=r*(1.3+hash(i,variant)*1.4),c=[x+Math.cos(a)*r*.20,y+r*1.14,z+Math.sin(a)*r*.20],q=[x+Math.cos(a)*r*.9,y+r+h,z+Math.sin(a)*r*.9],tip=add(q,[Math.cos(a)*r*.25,-r*.24,Math.sin(a)*r*.25]);
  b.tri(c,add(q,[-Math.sin(a)*r*.12,0,Math.cos(a)*r*.12]),tip,i%2?'#526e40':'#70844c',8);b.tri(c,tip,add(q,[Math.sin(a)*r*.12,0,-Math.cos(a)*r*.12]),'#385b3e',8);
 }
}
function kopjeGlass(b,x,y,z,w,h,angle=0){
 b.push(x,y,z,0,angle);b.quad([-w/2,-h/2,0],[w/2,-h/2,0],[w/2,h/2,0],[-w/2,h/2,0],'#94b4a0',76);
 for(const xx of[-w/2,w/2])b.box(xx,0,0,.038,h,.055,'#564a32',41);
 for(const yy of[-h/2,h/2])b.box(0,yy,0,w,.045,.055,'#564a32',41);b.pop();
}
function kopjeScreen(b,x,y,z,w,h,angle=0){
 b.push(x,y,z,0,angle);
 for(const side of[-1,1])b.box(side*w/2,h/2,0,.065,h,.11,KOPJE.timber,22);
 for(let yy=.08;yy<h;yy+=.15)b.box(0,yy,0,w,.046,.035,'#9b7f4d',22);
 for(let xx=-w/2+.07;xx<w/2;xx+=.19)b.box(xx,h/2,.024,.018,h,.018,'#705b39',22);
 b.pop();
}
function kopjeMainHall(b){
 const y=SAFARI_LODGE.floor;
 kopjeFrame(b,24,-.9,12.2,7.6,4.0,3.45,15.9,10);kopjeRoof(b,24,y+4.13,-.9,15.9,10.0,3.45,10);
 // The tall open gable is cross-braced; the rear is sheltered by clear glazing.
 for(const x of[19.8,22.5,25.2,27.9])kopjeGlass(b,x,y+1.85,-4.67,2.52,3.54);
 for(const x of[17.85,30.15])kopjeGlass(b,x,y+1.70,-2.8,3.5,3.20,PI/2);
 b.box(24,y+3.40,3.11,6.2,.61,.17,KOPJE.dark,22);hudsonText(b,'KOPJE HOUSE',24,y+3.39,3.207,5.50,'#d7c08a');
 for(const x of[21.6,26.4])b.beam([x,y+3.73,3.10],[x,y+4.1,3.10],.022,KOPJE.bronze,41,5);
 kopjeRug(b,22.2,y+.025,.28,6.5,4.6);
 kopjeSofa(b,21.9,y+.045,-1.25,3.55);kopjeSofa(b,19.5,y+.045,.30,2.4,PI/2);
 for(const x of[23.4,24.5])kopjeChair(b,x,y+.04,1.52,PI+.13,.77);
 b.push(22.25,y+.52,.35);slab(b,2.1,1.15,.09,0,.25,'#bfa376',22);b.pop();
 for(const xx of[21.45,23.05])for(const zz of[-.05,.75])b.box(xx,y+.27,zz,.05,.51,.05,KOPJE.dark,41);
 for(let i=0;i<3;i++){b.push(21.78+i*.04,y+.58+i*.035,.34,0,.13);b.box(0,0,0,.44,.035,.32,['#586c54','#c4b17e','#7f6044'][i],23);b.pop();}
 kopjePot(b,22.67,y+.58,.46,.10,2);kopjeLantern(b,19.15,y+.04,2.02,.78);
 // Stone fireplace, deep open hearth, chimney, timber storage and a dark flue.
 const fx=28.25,fz=-1.82;
 b.box(fx,y+.12,fz,2.9,.23,1.88,'#a59678',4);
 for(const side of[-1,1])b.box(fx+side*1.04,y+1.15,fz,.60,2.2,1.17,'#8d7c5c',4);
 b.box(fx,y+2.11,fz,2.64,.34,1.21,'#aa9672',4);b.box(fx,y+1.05,fz-.43,1.55,1.7,.22,'#333b30',42);
 b.box(fx,y+4.4,fz,1.74,4.3,.97,'#9e8966',4);b.box(fx,y+6.69,fz,2.03,.19,1.23,'#6b624b',3);
 b.box(fx,y+6.91,fz,1.34,.27,.68,'#313b31',42);b.box(fx,y+7.07,fz,1.75,.08,1.07,'#625c47',41);
 for(let i=0;i<4;i++){b.beam([fx-.5+i*.16,y+.29,fz+.15],[fx+.30+i*.15,y+.34,fz-.20],.078,'#58422a',22,7);b.box(fx-.28+i*.18,y+.365,fz+.15,.16,.015,.14,'#cb7738',6);}
 for(let i=0;i<9;i++)b.cylinder(fx+1.62+(i%3)*.16,y+.15+Math.floor(i/3)*.14,fz+.13,.061,.061,.4,'#927149',22,7,PI/2);
 // A mezzanine reading gallery under the soaring thatch ridge.
 const ly=y+2.48;b.box(24.10,ly,-3.41,7.3,.17,2.03,KOPJE.timber,22);
 for(let i=0;i<28;i++)b.box(20.6+i*.26,ly+.10,-3.41,.244,.047,2.0,'#997848',22);
 safariRailings(b,[[20.47,ly+.14,-2.43],[27.75,ly+.14,-2.43]],.70,'#735936');
 for(const x of[20.55,27.65])b.box(x,y+1.20,-2.51,.13,2.4,.13,KOPJE.timber,22);
 b.box(24.1,ly-.16,-4.39,7.6,.21,.18,KOPJE.timber,22);
 b.box(24.5,ly+.64,-4.14,4.6,1.04,.23,KOPJE.dark,22);
 for(const yy of[ly+.15,ly+.61,ly+1.10])b.box(24.5,yy,-3.96,4.75,.07,.58,KOPJE.teak,22);
 for(let i=0;i<25;i++){const xx=22.29+i*.177,h=.20+hash(i,717)*.15;b.box(xx,ly+.65+h/2,-3.93,.115,h,.23,['#826044','#b6a27b','#54705b','#9d784d'][i%4],23);}
 kopjeChair(b,21.2,ly+.12,-3.3,-.40,.70);kopjeLantern(b,22.06,ly+.15,-3.3,.46);
 // Open timber steps climb at the east edge, with bearing stringers and rails.
 for(let i=0;i<15;i++){const z=2.1-(i+.5)*.305,h=y+(i+1)*2.61/15;b.box(29.1,h-.045,z,1.10,.09,.316,KOPJE.teak,22);}
 for(const side of[-1,1]){b.beam([29.1+side*.45,y,2.23],[29.1+side*.45,ly,-2.43],.08,KOPJE.timber,22,5);safariRailings(b,[[29.1+side*.53,y,2.23],[29.1+side*.53,ly+.12,-2.43]],.69);}
 b.box(28.38,ly,-2.88,1.77,.14,.9,KOPJE.teak,22);
 kopjePendant(b,24,y+3.6,.60,.70);kopjePendant(b,22.6,y+3.3,.25,.40);kopjePendant(b,25.6,y+3.22,.25,.39);
 for(const x of[17.35,30.6])kopjePot(b,x,y,3.50,.46,x);
}
function kopjeWings(b){
 const y=SAFARI_LODGE.floor;
 // Dining pavilion: woven screens, a long table and a tiny coffee bar.
 kopjeFrame(b,13.35,-.55,7.2,6.1,3.25,2.50,9.3,8.4);kopjeRoof(b,13.35,y+3.4,-.55,9.3,8.4,2.50,35);
 kopjeScreen(b,9.74,y,-.60,5.5,2.65,PI/2);kopjeScreen(b,13.35,y,-3.59,7.1,2.65);
 b.box(13.1,y+.86,-.05,4.55,.12,1.45,'#b49660',22);
 for(const x of[11.4,14.8]){b.box(x,y+.44,-.05,.18,.85,1.01,KOPJE.timber,22);b.beam([x-.4,y+.25,-.05],[x+.4,y+.70,-.05],.07,KOPJE.endgrain,22,5);}
 for(let i=0;i<4;i++)for(const side of[-1,1]){
  const x=11.36+i*1.13,z=-.05+side*1.03;kopjeChair(b,x,y,z,side>0?PI:0,.62);
  b.cylinder(x,y+.933,-.05+side*.44,.19,.19,.015,'#e4d5b1',23,16);b.cylinder(x+.27,y+.979,-.05+side*.52,.042,.042,.086,'#c7d8bc',43,8);
 }
 kopjePot(b,13.18,y+.935,-.05,.14,4);kopjePendant(b,12.2,y+2.90,-.05,.47);kopjePendant(b,14.2,y+2.90,-.05,.47);
 b.box(15.9,y+.55,-2.8,1.13,1.1,1.0,KOPJE.dark,22);b.box(15.9,y+1.12,-2.8,1.24,.10,1.06,'#bba37b',3);
 b.box(15.90,y+1.45,-2.90,.62,.55,.50,'#adb9a0',41);b.box(15.9,y+1.44,-2.625,.48,.22,.04,KOPJE.dark,42);
 for(const dx of[-.16,.16])b.cylinder(15.9+dx,y+1.22,-2.56,.061,.064,.12,'#e5d6b3',24,9);
 // Two shaded suites share a thatched wing, with visible beds and verandas.
 kopjeFrame(b,35.2,-1.5,6.8,7.2,3.05,2.42,8.65,9.3);kopjeRoof(b,35.2,y+3.2,-1.5,8.65,9.3,2.42,50);
 kopjeScreen(b,38.61,y,-1.5,7.1,2.7,PI/2);kopjeScreen(b,35.2,y,-5.11,6.7,2.8);
 b.box(35.2,y+1.38,-1.5,.14,2.76,7.08,'#afa786',23);
 for(const side of[-1,1]){
  const x=35.2+side*1.67;
  b.box(x,y+.31,-2.0,2.25,.53,2.82,KOPJE.timber,22);b.box(x,y+.64,-1.92,2.20,.23,2.72,'#d8cfb0',23);
  b.box(x,y+.79,-1.15,2.19,.085,1.10,'#788465',23);b.box(x,y+1.0,-3.38,2.44,1.30,.11,'#997949',22);
  for(const dx of[-.5,.5])b.box(x+dx,y+.87,-2.94,.81,.20,.54,'#ebe0c4',23);
  b.box(x+side*1.25,y+.47,-3.0,.45,.65,.54,KOPJE.teak,22);kopjeLantern(b,x+side*1.25,y+.82,-3.0,.40);
  kopjeGlass(b,x,y+1.40,1.99,3.04,2.7);
  // Tied-back linen curtains do not blanket the glazing or hide the room.
  for(const dx of[-1.38,1.38])for(let i=0;i<4;i++)b.box(x+dx+i*.028,y+1.37,2.055,.041,2.62,.052,shade('#d9cbaa',.94+i*.025),23);
  kopjeChair(b,x-.30,y,3.06,.13,.70);kopjeTable(b,x+.68,y,3.0,.36);
 }
 // Connections sit below the principal rooflines and read as airy verandas.
 for(const [x,w]of[[18.0,1.2],[30.75,1.1]]){
  b.box(x,y+2.95,.2,w,.11,5.0,KOPJE.timber,22);
  for(let z=-2.1;z<2.7;z+=.29)b.box(x,y+3.035,z,w+.16,.055,.08,'#b79861',22);
 }
}
function kopjeLounger(b,x,y,z,angle=0){
 b.push(x,y,z,0,angle);
 for(const side of[-1,1]){b.beam([side*.35,.12,-1],[side*.35,.28,1.03],.04,KOPJE.timber,22,5);for(const zz of[-.75,.78])b.box(side*.32,.12,zz,.06,.24,.10,KOPJE.dark,41);}
 for(let i=0;i<18;i++){const zz=-.97+i*.11,yy=zz<-.32?.27+(-.32-zz)*.57:.27;b.box(0,yy,zz,.75,.045,.095,'#ac8955',22);}
 b.box(0,.345,.27,.68,.09,1.30,'#d1c5a1',23);b.push(0,.50,-.64,-.51);b.box(0,0,0,.68,.085,.74,'#d7cbae',23);b.pop();
 b.box(0,.41,.59,.67,.025,.28,'#5d7968',23);b.pop();
}
function kopjeParasol(b,x,y,z,r=1.55){
 b.cylinder(x,y+.055,z,.36,.32,.11,'#8f8467',3,14);b.cylinder(x,y+1.46,z,.034,.029,2.92,KOPJE.teak,22,9);
 const tip=[x,y+3.1,z];
 for(let i=0;i<12;i++){
  const a=i*TAU/12,q=(i+1)*TAU/12,edge=t=>[x+Math.cos(t)*r,y+2.49,z+Math.sin(t)*r],mid=t=>[x+Math.cos(t)*r*.52,y+2.73,z+Math.sin(t)*r*.52];
  b.tri(tip,mid(a),mid(q),'#d4bd8c',23);b.quad(mid(a),edge(a),edge(q),mid(q),i%2?'#d7c299':'#e1d0aa',23);
  b.beam(tip,edge(a),.014,'#9d8254',22,4);b.beam(edge(a),edge(q),.020,'#af9566',23,5);
 }
 b.cylinder(x,y+3.17,z,.06,.03,.13,KOPJE.bronze,41,8);
}
function kopjePool(b){
 const y=SAFARI_LODGE.floor,px=16.22,pz=12.05,w=12.2,d=5.7,water=y-.19;
 // The structural basin is below the actual opening in the timber terrace.
 b.box(px,y-.68,pz,w,.66,d,'#618276',3);
 for(const side of[-1,1]){
  b.box(px,water-.32,pz+side*d/2,w+.20,.68,.20,'#6d9381',3);
  b.box(px+side*w/2,water-.32,pz,.20,.68,d,'#6d9381',3);
  b.box(px,y-.032,pz+side*(d/2+.12),w+.67,.14,.40,'#c9b58d',3);
  b.box(px+side*(w/2+.12),y-.032,pz,.40,.14,d+.24,'#c9b58d',3);
 }
 for(let i=0;i<24;i++)for(let j=0;j<10;j++){
  const x=px-w/2+.12+i*(w-.24)/24,z=pz-d/2+.12+j*(d-.24)/10,xx=x+(w-.24)/24,zz=z+(d-.24)/10;
  b.quad([x,water,z],[x,water,zz],[xx,water,zz],[xx,water,z],j%3?'#498e83':'#569c8c',7);
 }
 // The long river-facing edge spills into a lower stone catch channel.
 const xx=px-w/2-.04;
 for(let i=0;i<26;i++){
  const z=pz-d/2+.1+i*(d-.2)/26,q=z+(d-.2)/26;
  b.quad([xx,water+.01,z],[xx-.04,water-.88,z],[xx-.04,water-.88,q],[xx,water+.01,q],i%4?'#6eaa96':'#b5d6bb',44);
 }
 b.box(xx-.20,water-.97,pz,.73,.18,d+.36,'#6b8270',3);b.box(xx-.26,water-.85,pz,.41,.05,d+.16,'#416f61',7);
 // Two broad steps and a brass handrail occupy the shallow eastern end.
 for(let i=0;i<3;i++)b.box(px+w/2-.29-i*.34,water-.08-i*.14,pz+1.54,.38,.19,1.08,'#afc0a1',3);
 for(const z of[pz+1.11,pz+1.98]){
  b.beam([px+w/2+.48,y,z],[px+w/2+.48,y+.62,z],.023,KOPJE.bronze,41,7);
  b.beam([px+w/2+.48,y+.62,z],[px+w/2-.35,y+.55,z],.023,KOPJE.bronze,41,7);
 }
 for(const [x,z,a]of[[12.2,7.7,PI/2],[15,7.7,PI/2],[19.1,7.7,PI/2],[22,7.7,PI/2]])kopjeLounger(b,x,y+.01,z,a);
 kopjeParasol(b,13.25,y,6.73,1.48);kopjeParasol(b,20.35,y,6.70,1.55);
 for(const x of[16.8,24.0])kopjeTable(b,x,y,7.65,.38);
}
function kopjeFireCourt(b){
 const y=SAFARI_LODGE.floor,cx=33.0,cz=16.0,r=4.2,inner=1.75,segments=72;
 const point=(a,r,yy)=>[cx+Math.cos(a)*r,yy,cz+Math.sin(a)*r];
 // The north chord meets the rectangular terrace, so there is no coplanar
 // overlap. Clipping is only against the authored terrace line, not the view.
 const clippedQuad=points=>{
  const out=[];for(let i=0;i<points.length;i++){const a=points[i],q=points[(i+1)%points.length],inside=a[2]>=13,next=q[2]>=13;if(inside)out.push(a);if(inside!==next)out.push(lerpV(a,q,(13-a[2])/(q[2]-a[2])));}
  for(let i=1;i+1<out.length;i++)b.tri(out[0],out[i],out[i+1],KOPJE.teak,22);
 };
 for(let i=0;i<segments;i++){
  const a=i*TAU/segments,q=(i+1)*TAU/segments;
  clippedQuad([point(a,inner,y),point(a,r,y),point(q,r,y),point(q,inner,y)]);
  b.quad(point(a,inner,y),point(q,inner,y),point(q,inner,y-.61),point(a,inner,y-.61),'#87765b',4);
  if(Math.sin((a+q)/2)>-.68)b.quad(point(a,r,y),point(a,r,y-.29),point(q,r,y-.29),point(q,r,y),KOPJE.timber,22);
  b.tri([cx,y-.6,cz],point(q,inner,y-.6),point(a,inner,y-.6),'#b7a57c',3);
 }
 // Curved upholstered benches wrap the stone fire bowl, with an entrance gap.
 for(let i=0;i<11;i++){
  const a=.10+i*TAU/13,xx=cx+Math.cos(a)*2.67,zz=cz+Math.sin(a)*2.67;
  if(zz<14.0)continue;
  b.push(xx,y,zz,0,-a-PI/2);kopjeSofa(b,0,0,0,1.23);b.pop();
 }
 b.cylinder(cx,y-.33,cz,.91,.97,.44,'#72674e',3,28);b.cylinder(cx,y-.08,cz,.89,.89,.05,'#354036',42,28);
 for(let i=0;i<6;i++){const a=i*2.399;b.beam([cx+Math.cos(a)*.61,y-.02,cz+Math.sin(a)*.61],[cx-Math.cos(a)*.35,y+.08,cz-Math.sin(a)*.35],.064,'#59432c',22,6);b.sphere(cx+Math.cos(a)*.29,y+.065,cz+Math.sin(a)*.29,.12,.035,.09,'#bf7435',6,6,3);}
 const rail=[];for(let i=0;i<=23;i++){const a=-.05+i*(PI+.10)/23;rail.push(point(a,r-.06,y));}safariRailings(b,rail,.74,'#5b6249');
 for(let i=0;i<7;i++){const a=i*PI/6,xx=cx+Math.cos(a)*(r-.09),zz=cz+Math.sin(a)*(r-.09),base=safariSurface(xx,zz);b.box(xx,(base+y-.28)/2,zz,.24,y-.28-base,.24,KOPJE.timber,22);if(i%2===0)kopjeLantern(b,xx,y+.75,zz,.53);}
}
function kopjePergola(b){
 const y=SAFARI_LODGE.floor,x=30.8,z=9.8;
 for(const xx of[x-3.5,x+3.5])for(const zz of[z-2.15,z+2.15]){b.box(xx,y+1.52,zz,.13,3.04,.13,KOPJE.timber,22);b.box(xx,y+.13,zz,.23,.25,.23,'#a48a5d',4);}
 for(const zz of[z-2.2,z+2.2])b.box(x,y+3.07,zz,7.4,.18,.18,KOPJE.teak,22);
 for(let xx=x-3.5;xx<=x+3.5;xx+=.31)b.box(xx,y+3.22,z,.085,.14,4.8,'#947347',22);
 for(const xx of[x-1.85,x+1.85]){
  kopjeTable(b,xx,y,z,.81);for(const side of[-1,1])kopjeChair(b,xx,y,z+side*1.13,side>0?PI:0,.72);
  kopjePendant(b,xx,y+2.48,z,.42);
 }
 // A light trailing vine follows the pergola, with visible hanging tendrils.
 for(let i=0;i<20;i++){
  const xx=x-3.5+i*.36,zz=z-2.16;b.sphere(xx,y+3.24,zz,.35,.17,.29,i%2?'#4a673b':'#647c47',8,6,3,true);
  if(i%3===0){b.beam([xx,y+3.24,zz],[xx+.11,y+2.66,zz+.03],.010,'#6a6840',22,4);b.sphere(xx+.10,y+2.83,zz+.03,.12,.23,.09,'#738550',8,5,3,true);}
 }
}
function kopjeSteps(b,a,q,width=1.8){
 const height=a[1]-q[1],run=Math.hypot(q[0]-a[0],q[2]-a[2]),n=Math.max(2,Math.ceil(height/.16)),right=norm([q[2]-a[2],0,a[0]-q[0]]),forward=norm([q[0]-a[0],0,q[2]-a[2]]);
 for(let i=0;i<n;i++){
  const t=(i+.5)/n,p=lerpV(a,q,t);p[1]=mix(a[1],q[1],(i+1)/n)-.045;
  b.matrix(basis(p,forward));b.box(0,0,0,width,.09,run/n+.016,KOPJE.teak,22);b.pop();
 }
 for(const side of[-1,1]){
  const p=add(a,mul(right,side*(width/2-.09))),r=add(q,mul(right,side*(width/2-.09)));
  b.beam(add(p,[0,-.14,0]),add(r,[0,-.12,0]),.075,KOPJE.timber,22,5);safariRailings(b,[p,r],.72,'#806746');
 }
}
function kopjeArrival(b){
 const y=SAFARI_LODGE.floor;
 const x0=-5.8,x1=10.3,z=20.0,by=Math.max(...[x0,x1].flatMap(x=>[-.9,.9].map(dz=>safariSurface(x,z+dz))))+.20;
 // A modest pedestrian suspension bridge brings the Acacia Gate trail to
 // the lodge. Deck, abutments, towers and suspenders share a real load path.
 for(let i=0;i<58;i++){const x=mix(x0,x1,(i+.5)/58);b.box(x,by-.04,z,(x1-x0)/58-.014,.12,1.70,KOPJE.teak,22);}
 for(const side of[-1,1]){
  const zz=z+side*.91;
  b.beam([x0,by-.17,zz],[x1,by-.17,zz],.083,KOPJE.timber,22,6);
  for(const x of[x0,x1]){
   const ground=safariSurface(x,zz);b.box(x,(ground+by-.18)/2,zz,.56,Math.max(.15,by-.18-ground),.68,'#a38b60',4);
   b.box(x,by+1.11,zz,.15,2.31,.15,KOPJE.timber,22);
  }
  const cable=t=>[mix(x0,x1,t),by+.82+1.28*(2*t-1)**2,zz];
  for(let i=0;i<38;i++)b.beam(cable(i/38),cable((i+1)/38),.021,'#7b7e61',41,5);
  for(let i=0;i<=16;i++){const t=i/16,p=cable(t);b.beam([p[0],by+.04,zz],p,.016,'#7f8062',41,5);}
  b.beam([x0,by+.71,zz],[x1,by+.71,zz],.032,KOPJE.teak,22,5);
 }
 for(const walk of SAFARI_WALKS)housePath(b,walk,1.08,safariSurface,'#b8a173');
 // Short, supported landings meet the bridge, not its railing or a cliff.
 const left=[-7.1,safariLandingHeight(-7.1,20,.9)+.12,20];kopjeSteps(b,[x0,by,20],left,1.74);
 const bottom=[12.2,safariLandingHeight(12.2,19.0,.82)+.10,19.0];
 kopjeSteps(b,[12.2,y,16.16],bottom,1.62);
 housePath(b,[[x1,20],[11.5,20.1],[12.2,19]],1.35,safariSurface,'#bba475');
 // A quiet entrance gate and engraved trail marker, below the station railway.
 for(const x of[-6.9,-4.6]){const yy=safariSurface(x,22.0);b.cylinder(x,yy+.85,22,.08,.063,1.70,KOPJE.timber,22,8);}
 const signY=safariSurface(-5.75,22)+1.68;b.box(-5.75,signY,22.0,2.66,.41,.09,KOPJE.dark,22);hudsonText(b,'KOPJE HOUSE',-5.75,signY,22.057,2.4,'#d7c295');
 for(const [x,z]of[[-10.8,25],[-35,20],[-21,1],[-12.8,14],[12.5,19.7]]){kopjeLantern(b,x,safariSurface(x,z)+.05,z,.62);}
}
function safariLodge(b){
 const y=SAFARI_LODGE.floor;
 kopjeDeck(b,24,-.5,33,14);kopjeDeck(b,24,7.80,33,2.60);
 kopjeDeck(b,8.77,12.06,2.54,5.92);kopjeDeck(b,31.47,11.0,18.06,3.80);
 kopjeDeck(b,18.02,15.62,21.04,1.32);
 // Basin piers and a broad stone stem wall connect the central court to earth.
 for(const x of[11,21.5])for(const z of[10,14]){const g=safariSurface(x,z);b.box(x,(g+y-.7)/2,z,.52,y-.7-g,.52,'#8a7959',4);}
 kopjeMainHall(b);kopjeWings(b);kopjePool(b);kopjePergola(b);kopjeFireCourt(b);kopjeArrival(b);
 safariRailings(b,[[7.58,y,-7.45],[7.58,y,16.20],[11.28,y,16.20]],.78,'#56604a');
 safariRailings(b,[[13.14,y,16.20],[28.48,y,16.20]],.78,'#56604a');
 safariRailings(b,[[40.42,y,-7.45],[40.42,y,12.9],[37.22,y,12.9]],.78,'#56604a');
 for(const [x,z,r]of[[8.1,4.4,.50],[16.9,4.6,.38],[30.6,5.3,.45],[39.6,6.1,.47],[26.0,15.6,.32]])kopjePot(b,x,y,z,r,x);
 for(const [x,z]of[[7.6,-6],[7.6,5.4],[7.6,15.7],[25.8,16.2],[40.4,4.5],[40.4,12.3]])kopjeLantern(b,x,y+.79,z,.58);
}

function safariPalm(b,x,z,h=6,variant=0){
 const y=safariSurface(x,z),lean=h*.10,top=[x+lean,y+h,z+.13*h];
 for(let i=0;i<8;i++){
  const a=[x+lean*(i/8)**1.4,y+h*i/8,z+.13*h*(i/8)**1.4],q=[x+lean*((i+1)/8)**1.4,y+h*(i+1)/8,z+.13*h*((i+1)/8)**1.4];safariBranch(b,a,q,.15-.08*i/8,.15-.08*(i+1)/8,'#766342',8);
  b.cylinder(q[0],q[1],q[2],.153-.08*(i+1)/8,.16-.08*(i+1)/8,.054,'#988157',22,8);
 }
 for(let i=0;i<11;i++){
  const a=i*2.399+variant,length=h*(.32+hash(i,variant)*.13),p=t=>add(top,[Math.cos(a)*length*t,Math.sin(t*PI)*h*.13-h*.11*t*t,Math.sin(a)*length*t]);
  for(let j=0;j<7;j++){
   const q=p(j/7),r=p((j+1)/7),width=(.12+.13*Math.sin(j/7*PI))*(1-j/9),side=[-Math.sin(a)*width,0,Math.cos(a)*width];
   b.beam(q,r,.011,'#768454',22,4);
   for(const s of[-1,1])b.tri(q,add(q,mul(side,s)),r,i%3?'#466c3e':'#6e8447',8);
  }
 }
}
function safariBaobab(b,x,z,h=8.7){
 const y=safariSurface(x,z),rings=[[-.10,.70],[.45,.87],[1.7,.95],[3.0,.64],[3.8,.41]],n=11;
 const at=(j,i)=>{const [yy,r]=rings[j],a=i*TAU/n;return[x+Math.cos(a)*r*(1+.08*Math.sin(i*4)),y+yy,z+Math.sin(a)*r*.87];};
 for(let j=0;j<4;j++)for(let i=0;i<n;i++)b.quad(at(j,i),at(j,i+1),at(j+1,i+1),at(j+1,i),shade('#8f7b5a',.89+hash(i,j)*.17),22);
 for(let i=0;i<7;i++){
  const a=i*2.399,root=[x+Math.cos(a)*1.6,safariSurface(x+Math.cos(a)*1.6,z+Math.sin(a)*1.6)+.015,z+Math.sin(a)*1.6];safariBranch(b,[x,y+.65,z],root,.26,.025,'#756146',7);
  const elbow=[x+Math.cos(a)*1.3,y+5.0+(i%2)*.5,z+Math.sin(a)*1.2],tip=[x+Math.cos(a)*2.3,y+h-.8+(i%3)*.31,z+Math.sin(a)*2.25];
  safariBranch(b,[x,y+3.1,z],elbow,.23,.13,'#927b57',7);safariBranch(b,elbow,tip,.13,.035,'#9e8762',6);
  for(let j=0;j<3;j++){const t=add(tip,[Math.cos(a+j*2)*.9,(j%2)*.33,Math.sin(a+j*2)*.9]);safariBranch(b,tip,t,.044,.011,'#8e7854',5);safariCrown(b,...t,.80+i*.035,i*11+j+999);}
 }
}
function safariHabitatDetails(b){
 // Dense riverine edges, low silver-green scrub and golden fountain grasses
 // establish different habitats instead of filling the board with one tree.
 for(let i=0;i<250;i++){
  const z=-36+hash(i,910)*72,side=i%2?1:-1,x=safariRiverX(z)+side*(safariRiverWidth(z)+2.1+hash(i,911)*2.2),y=safariSurface(x,z);
  if(!safariLodgeClear(x,z,.8)||safariRailNear(x,z).distance<1.6||safariWalkDistance(x,z)<1.1||Math.abs(z-20)<1.4||y<SAFARI.water+.14||y>4.2)continue;
  const r=.18+hash(i,912)*.40;b.sphere(x,y+r*.40,z,r,r*.47,r*.79,i%3?'#596e43':'#7c8456',8,7,4,true);
  if(i%4===0)for(let j=0;j<6;j++){const a=j*2.399,rr=r*.7,q=[x+Math.cos(a)*rr,y+r*.25,z+Math.sin(a)*rr];b.tri(add(q,[-.04,0,0]),add(q,[.12,r*1.3,.05]),add(q,[.04,0,0]),'#b0a865',8);}
 }
 for(let i=0;i<560;i++){
  const x=-52+hash(i,945)*103,z=-36+hash(i,946)*72,y=safariSurface(x,z),size=.22+hash(i,947)*.4;
  if(!safariLodgeClear(x,z,.9)||safariRailNear(x,z).distance<2.0||safariWalkDistance(x,z)<1.1||safariBank(x,z)<4.8||Math.abs(x+28)<12&&z>28||y>11)continue;
  if(Math.abs(safariSurface(x+.4,z)-safariSurface(x-.4,z))+Math.abs(safariSurface(x,z+.4)-safariSurface(x,z-.4))>.5)continue;
  for(let j=0;j<9;j++){
   const a=j*2.399,r=size*(.35+hash(j,i)),xx=x+Math.cos(a)*r,zz=z+Math.sin(a)*r,top=y+size*(1.1+hash(j,i+20)*.9),base=safariSurface(xx,zz);
   b.tri([xx-.032,base,zz],[xx+Math.cos(a)*size*.4,top,zz+Math.sin(a)*size*.4],[xx+.032,base,zz],j%3?'#b3a46b':'#ccba80',8);
  }
 }
 // A single sculptural baobab anchors the open western savanna.
 safariBaobab(b,-24,10.2,8.6);
 for(const [x,z,h,v]of[[-12.7,-3.1,6.5,2],[-11.5,-4.4,4.9,5],[-10.8,-2.4,5.5,7],[6.4,7.7,6.1,11],[6.8,5.5,4.8,15],[39.7,16.3,5.9,9]]){
  if(safariRailNear(x,z).distance>h*.5+1.25)safariPalm(b,x,z,h,v);
 }
 // Layered angular outcrops crest the shoulders, with a varied stone silhouette.
 for(const [cx,cz,n]of[[-35,-24,11],[21,-21,13],[-43,11,7]])for(let i=0;i<n;i++){
  const a=i*2.399,rr=1.2+Math.sqrt(i)*.64,x=cx+Math.cos(a)*rr,z=cz+Math.sin(a)*rr*.56,size=.8+hash(i,cx)*1.65;
  if(safariRailNear(x,z).distance<2.2+size||!safariLodgeClear(x,z,size))continue;
  const slope=Math.abs(safariSurface(x+.6,z)-safariSurface(x-.6,z))+Math.abs(safariSurface(x,z+.6)-safariSurface(x,z-.6));
  if(slope<1.1)safariRock(b,x,z,size,i*3+cz);
 }
 // A field desk and two rest stops are small rewards along the walking trail.
 for(const [x,z,angle]of[[-34,13,.32],[-18,4,-.65]]){
  const y=safariSurface(x,z);b.push(x,y,z,0,angle);kopjeChair(b,-.4,0,0,0,.65);kopjeTable(b,.57,0,.22,.32);b.pop();
 }
 for(const [x,z,r]of[[6.7,2.8,.72],[7.4,15.6,.65],[39.1,7.6,.58],[27.8,20.1,.46]]){
  const y=safariSurface(x,z);b.sphere(x,y+.24,z,r,.42,r*.8,'#5c7543',8,8,4,true);
  for(let i=0;i<5;i++){const a=i*2.399;b.tri([x-.03,y,z],[x+Math.cos(a)*r*.8,y+r*.9,z+Math.sin(a)*r*.8],[x+.03,y,z],'#8d9561',8);}
 }
}
