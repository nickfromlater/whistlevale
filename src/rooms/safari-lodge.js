'use strict';

// KOPJE HOUSE. Original safari architecture and habitat details by
// nickfromlater, with agent assistance. Native, deterministic geometry only.
// A compact expedition lodge on fieldstone foundations, without resort amenities.
const KOPJE={timber:'#614831',teak:'#957447',endgrain:'#755739',linen:'#d7c7a0',stone:'#a79573',dark:'#2d4036',bronze:'#a0834f',reed:'#9c814f'};
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
function kopjeMasonry(b,x,y,z,w,h,d,variant=0){
 b.box(x,y+h/2,z,w,h,d,'#706b55',3);
 const rows=Math.ceil(h/.40),pitch=h/rows;
 for(const [axis,sign,length]of[['z',1,w],['z',-1,w],['x',1,d],['x',-1,d]]){
  const alongX=axis==='z',cols=Math.ceil(length/.69),step=length/cols;
  for(let row=0;row<rows;row++)for(let i=0;i<=cols;i++){
   const edge=k=>-length/2+(k-(row%2)*.5)*step+(k>0&&k<cols?(hash(k+variant,row)-.5)*step*.45:0);
   const lo=Math.max(-length/2,edge(i)),hi=Math.min(length/2,edge(i+1));
   if(hi-lo<.05)continue;
   const mid=(lo+hi)/2,ww=(hi-lo-.027)/2,hh=(pitch-.025)/2,yy=y+(row+.5)*pitch;
   const c=shade(['#a59776','#958a6d','#b2a381','#8c856c'][(row+i+Math.abs(variant))%4],.91+hash(i+variant,row)*.16);
   const depth=.022+hash(row+variant,i)*.039,face=alongX?d/2:w/2;
   const point=(u,v,relief)=>alongX?[x+mid+u,yy+v,z+sign*(face+relief)]:[x+sign*(face+relief),yy+v,z+mid+u];
   const rim=[[-ww,-hh],[ww,-hh],[ww,hh],[-ww,hh]],core=rim.map(([u,v],j)=>[u*.80+(hash(j+i,row+variant)-.5)*.024,v*.74]);
   b.quad(...core.map(([u,v])=>point(u,v,depth)),c,3);
   for(let k=0;k<4;k++){const j=(k+1)%4;b.quad(point(...rim[k],.006),point(...rim[j],.006),point(...core[j],depth),point(...core[k],depth),shade(c,k===2?1.06:.88),3);}
  }
 }
}
function kopjeFoundation(b,x,z,w,d){
 const y=SAFARI_LODGE.floor;
 const bottom=Math.min(...[-w/2,0,w/2].flatMap(dx=>[-d/2,0,d/2].map(dz=>safariSurface(x+dx,z+dz))))-.16;
 kopjeMasonry(b,x,bottom,z,w,y-.10-bottom,d,Math.round(x));
 b.box(x,y-.075,z,w+.14,.15,d+.14,'#a6926d',3);
 // Interior floor only. There is no projecting leisure deck or rear porch.
 const n=Math.ceil(w/.34);for(let i=0;i<n;i++)b.box(x-w/2+(i+.5)*w/n,y+.008,z,w/n-.011,.033,d-.14,shade('#816641',.92+hash(i,x)*.16),22);
}
function kopjeFieldRoofY(x){const v=1-Math.abs(x-24)/7.9;return SAFARI_LODGE.floor+4.05+3.65*v-.22*Math.sin(v*PI);}
function kopjeFieldRoof(b){
 const x=24,z=-.8,y=SAFARI_LODGE.floor+4.05,w=15.8,d=11.2,rise=3.65;
 // A steep longitudinal ridge and open triangular gable replace the broad,
 // resort-like hipped canopy. Every reed course follows the roof slope.
 for(const side of[-1,1]){
  const point=(u,v,lift=0)=>[x+side*w/2*(1-v),kopjeFieldRoofY(x+side*w/2*(1-v))+lift,z-d/2+u*d];
  const cols=30,rows=10;
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
   const u=i/cols,uu=(i+1)/cols,v=j/rows,vv=(j+1)/rows,c=shade(['#806441','#927448','#9d7e4c'][j%3],.92+hash(i,j+side)*.14);
   b.quad(point(u,v),point(uu,v),point(uu,vv),point(u,vv),c,23);
   b.quad(point(u,v,.04),point(uu,v,.04),point(uu,v+.014,.028),point(u,v+.014,.028),'#b0925f',23);
  }
  for(let i=0;i<100;i++)for(let j=0;j<3;j++){
   const u=(i+.4)/100,v0=j/3+.008,v1=(j+1)/3-.01,p=point(u,v0,.055),q=point(u+.001,v1,.055);
   b.quad(add(p,[0,0,-.008]),add(p,[0,0,.008]),add(q,[0,0,.008]),add(q,[0,0,-.008]),i%3?'#ae8e58':'#635036',23);
  }
  b.quad(point(0,0),point(1,0),point(1,0,-.27),point(0,0,-.27),'#624b2f',23);
  for(const u of[0,1])for(let j=0;j<20;j++){const a=point(u,j/20),q=point(u,(j+1)/20);b.quad(a,q,add(q,[0,-.21,0]),add(a,[0,-.21,0]),'#795c36',23);}
  for(const zz of[-4.6,-.8,3.0]){
   for(let k=0;k<5;k++){const a=k/5,q=(k+1)/5;b.beam([x+side*6.2*(1-a),y+rise*(1-6.2/w*2+6.2/w*2*a)-.34,zz],[x+side*6.2*(1-q),y+rise*(1-6.2/w*2+6.2/w*2*q)-.34,zz],.11,KOPJE.timber,22,7);}
  }
 }
 b.beam([24,y+rise+.02,z-d/2-.05],[24,y+rise+.02,z+d/2+.05],.17,'#60482b',23,10);
 for(let zz=z-d/2;zz<z+d/2;zz+=.31)b.beam([23.85,y+rise+.08,zz],[24.15,y+rise+.08,zz+.07],.022,'#bda172',22,4);
}
function kopjeShutter(b,x,y,z,w=1.25,h=1.55,angle=0){
 b.push(x,y,z,0,angle);
 b.box(0,0,0,w+.16,h+.19,.17,'#59482f',22);b.box(0,0,.097,w-.07,h-.08,.02,'#263d35',42);
 for(const side of[-1,1]){
  b.push(side*w*.69,0,.21,0,side*-.47);b.box(0,0,0,w*.40,h,.11,'#52634a',22);
  for(let yy=-h/2+.10;yy<h/2;yy+=.16)b.box(0,yy,.065,w*.37,.075,.034,'#75805c',22);
  for(const yy of[-h*.34,h*.34])b.box(0,yy,.085,w*.42,.039,.036,'#3e4a38',41);
  b.pop();
 }
 b.box(0,0,.126,.038,h-.10,.05,'#b49e70',22);b.box(0,0,.129,w-.08,.036,.05,'#b49e70',22);
 b.box(0,-h/2-.13,.16,w+.43,.16,.47,'#b2a182',3);b.pop();
}
function kopjeCase(b,x,y,z,w=.95,d=.62,h=.57,variant=0){
 b.box(x,y+h/2,z,w,h,d,variant%2?'#4d6049':'#896c44',22);
 b.box(x,y+h+.02,z,w+.045,.07,d+.045,variant%2?'#738261':'#9d8050',22);
 for(const side of[-1,1]){
  b.box(x+side*w*.32,y+h/2,z+d/2+.014,.045,h+.08,.025,'#363e2e',41);
  b.box(x+side*w*.32,y+h*.70,z+d/2+.035,.085,.10,.034,'#ad9360',41);
 }
 b.box(x,y+h*.51,z+d/2+.035,.22,.066,.044,'#333e2e',41);
}
function kopjeMapDesk(b){
 const y=SAFARI_LODGE.floor,x=23.8,z=.25,w=5.5,d=2.4,top=y+1.00;
 b.box(x,top,z,w,.14,d,'#ae8b56',22);
 for(const side of[-1,1]){const xx=x+side*2.05;b.beam([xx-.23,y,z-.83],[xx+.23,top-.08,z+.83],.105,KOPJE.timber,22,6);b.beam([xx+.23,y,z+.83],[xx-.23,top-.08,z-.83],.105,KOPJE.timber,22,6);}
 b.beam([x-2.05,y+.32,z],[x+2.05,y+.32,z],.07,KOPJE.timber,22,5);
 b.box(x,top+.085,z,3.9,.018,1.87,'#cbbd92',23);
 // Contours and the blue river are drawn in geometry, not an unrelated texture.
 for(let k=0;k<5;k++)for(let i=0;i<26;i++){
  const a=i*TAU/26,q=(i+1)*TAU/26,r=.18+k*.12;
  const p=t=>[x+.82+Math.cos(t)*r*(1+.15*Math.sin(t*3)),top+.099,z+.06+Math.sin(t)*r*.60];b.beam(p(a),p(q),.008,'#96885c',0,3);
 }
 for(let i=0;i<25;i++){const xx=x-1.8+i*.14,q=xx+.14,p=t=>[t,top+.102,z+.18*Math.sin((t-x)*3.1)-.12];b.beam(p(xx),p(q),.027,'#648b7b',0,4);}
 b.push(x-1.30,top+.11,z+.68,-PI/2);hudsonText(b,'RIFT SURVEY',0,0,0,.98,'#5a6145');b.pop();
 for(const [dx,dz]of[[-2.25,.48],[2.20,-.61]]){
  b.cylinder(x+dx,top+.15,z+dz,.07,.07,.91,'#d8c9a0',23,8,0,PI/2);
  for(const side of[-1,1])b.cylinder(x+dx+side*.25,top+.15,z+dz,.075,.075,.043,'#6d6950',22,8,0,PI/2);
 }
 // Brass compass, notebook, enamel mug and binoculars at the briefing table.
 b.cylinder(x+1.30,top+.14,z-.63,.16,.16,.067,'#b09a63',41,16);b.cylinder(x+1.30,top+.179,z-.63,.129,.129,.008,'#d3c498',23,16);
 b.beam([x+1.20,top+.188,z-.65],[x+1.39,top+.188,z-.61],.011,'#4e644c',41,4);
 kopjeCase(b,x+2.03,top+.08,z+.38,.72,.55,.24,1);
 for(const dx of[-.15,.15])b.cylinder(x-1.56+dx,top+.19,z-.75,.081,.065,.32,'#3b4d3b',42,10,PI/2);
 b.box(x-1.56,top+.18,z-.73,.24,.07,.08,'#867952',41);b.cylinder(x-.2,top+.18,z+.67,.075,.083,.16,'#d5ccb0',24,12);
 for(const side of[-1,1]){
  const zz=z+side*1.8;b.box(x,y+.48,zz,4.45,.10,.51,'#8e7147',22);
  for(const xx of[x-1.65,x+1.65])for(const s of[-1,1])b.beam([xx+s*.16,y,zz+s*.13],[xx-s*.16,y+.46,zz-s*.13],.04,KOPJE.timber,22,5);
 }
 kopjePendant(b,x,y+4.0,z,.46);b.beam([x,y+5.25,z],[x,y+7.34,z],.016,KOPJE.dark,41,5);
}
function kopjeMainHall(b){
 const y=SAFARI_LODGE.floor;
 kopjeFoundation(b,24,-.8,13.1,8.7);kopjeFieldRoof(b);
 // Rubble rear walls and short piers shelter the hall without glazing it shut.
 kopjeMasonry(b,24,y,-5.01,13.0,3.05,.43,81);
 for(const side of[-1,1]){
  const xx=24+side*6.35;kopjeMasonry(b,xx,y,-2.8,.50,2.6,4.4,90+side);
  kopjeMasonry(b,xx,y,2.77,.60,2.85,1.05,94+side);
 }
 for(const xx of[17.75,30.25])for(const zz of[-4.5,-.65,3.07]){
  b.cylinder(xx,y+2.245,zz,.16,.115,4.49,KOPJE.timber,22,9);
  for(const side of[-1,1])b.beam([xx,y+3.61,zz],[xx+side*.52,y+4.24,zz],.065,KOPJE.teak,22,6);
 }
 for(const zz of[-4.5,-.65,3.07]){
  b.beam([17.75,y+4.40,zz],[30.25,y+4.40,zz],.115,KOPJE.timber,22,6);
  b.beam([24,y+4.40,zz],[24,y+7.34,zz],.09,KOPJE.timber,22,6);
  for(const side of[-1,1])b.beam([24,y+4.72,zz],[24+side*2.9,y+5.9,zz],.075,KOPJE.teak,22,6);
 }
 // The entry remains open. Canvas storm curtains are rolled up and tied back.
 b.box(24,y+3.92,3.10,5.90,.48,.15,'#334c3d',22);hudsonText(b,'KOPJE FIELD LODGE',24,y+3.92,3.19,5.20,'#d5c195');
 for(const xx of[22,26])b.beam([xx,y+4.17,3.10],[xx,y+4.40,3.10],.018,KOPJE.bronze,41,5);
 for(const xx of[19.45,28.55]){
  b.cylinder(xx,y+3.53,3.07,.115,.115,2.40,'#aea17a',23,10,0,PI/2);
  for(const s of[-1,1])b.box(xx+s*.73,y+3.52,3.18,.047,.22,.03,'#655b3a',22);
 }
 kopjeMapDesk(b);
 // Field library and radio desk replace the glass-backed mezzanine lounge.
 b.box(23.8,y+1.20,-4.61,5.8,2.36,.42,'#3b4a34',22);
 for(const yy of[.15,.69,1.27,1.85,2.39])b.box(23.8,y+yy,-4.35,5.95,.09,.78,KOPJE.teak,22);
 for(let row=0;row<3;row++)for(let i=0;i<22;i++){
  const xx=21.08+i*.25,h=.24+hash(i,row+98)*.14;b.box(xx,y+.77+row*.58+h/2,-4.25,.14,h,.36,['#746849','#ada17b','#56634b','#97704d'][i%4],23);
 }
 b.box(28.48,y+.96,-3.58,2.1,.13,1.13,'#997c4e',22);
 for(const xx of[27.70,29.25])b.box(xx,y+.46,-3.58,.13,.91,.84,KOPJE.timber,22);
 b.box(28.43,y+1.31,-3.72,1.07,.53,.62,'#485b43',41);b.box(28.35,y+1.41,-3.40,.52,.13,.02,'#9da479',6);
 for(const xx of[28.12,28.69])b.cylinder(xx,y+1.20,-3.39,.052,.052,.046,'#bba375',41,12,PI/2);
 for(let i=0;i<6;i++)b.box(28.81,y+1.17+i*.056,-3.397,.17,.018,.015,'#28362b',42);
 b.beam([28.87,y+1.52,-3.72],[28.93,y+2.22,-3.72],.008,'#b1ad8d',41,5);
 kopjeChair(b,28.5,y,-2.48,PI,.68);kopjeLantern(b,27.6,y+1.05,-3.57,.48);
 // A compact dark stone hearth is part of the west wall, with a real chimney.
 kopjeMasonry(b,19.1,y,-3.0,1.8,.24,1.15,4);
 for(const xx of[18.35,19.85])kopjeMasonry(b,xx,y+.24,-3.0,.30,1.44,1.15,4);
 kopjeMasonry(b,19.1,y+1.68,-3.0,1.8,.72,1.15,4);b.box(19.1,y+.95,-3.49,1.18,1.42,.12,'#28342a',42);
 kopjeMasonry(b,19.1,y+2.4,-3.0,1.24,4.0,.96,31);b.box(19.1,y+6.50,-3.0,1.51,.20,1.22,'#6b634e',3);
 for(let i=0;i<4;i++)b.beam([18.73+i*.17,y+.40,-2.73],[19.23+i*.13,y+.49,-2.63],.046,'#59432a',22,6);
 for(const xx of[18.32,29.64])kopjeLantern(b,xx,y+.12,3.18,.72);
}
function kopjeGearWing(b){
 const y=SAFARI_LODGE.floor,cx=34.25,cz=-1.45;
 kopjeFoundation(b,cx,cz,6.75,7.45);
 kopjeMasonry(b,cx,y,-5.05,6.65,3.05,.45,13);
 // Split the masonry around a real opening; the shutters do not hide a wall.
 kopjeMasonry(b,37.35,y,cz,.50,1.0,7.45,14);
 kopjeMasonry(b,37.35,y+2.6,cz,.50,.45,7.45,14);
 for(const zz of[-3.7375,.8375])kopjeMasonry(b,37.35,y+1.0,zz,.50,1.6,2.875,14);
 kopjeShutter(b,37.635,y+1.8,cz,1.55,1.55,PI/2);
 kopjeMasonry(b,31.15,y,cz,.42,3.05,7.45,15);
 // Front wall pieces form a broad equipment doorway and shuttered aperture.
 kopjeMasonry(b,31.86,y,2.1,1.48,3.05,.45,16);kopjeMasonry(b,36.5,y,2.1,1.7,3.05,.45,17);
 b.box(34.15,y+2.77,2.1,3.42,.33,.59,'#5a482e',22);
 for(const side of[-1,1]){
  b.push(34.15+side*1.60,y+1.35,2.15,0,side*.75);
  for(let i=0;i<5;i++)b.box((i-2)*.21,0,0,.197,2.62,.11,'#576749',22);
  for(const yy of[-.87,.85])b.box(0,yy,.076,1.12,.11,.058,'#8a744a',22);
  b.beam([-.47,-1.1,.081],[.47,1.1,.081],.045,'#8a744a',22,4);b.pop();
 }
 // A working observation hide, not another guest-suite pavilion.
 const top=y+5.9,towerX=34.45,towerZ=-2.2;
 for(const xx of[towerX-1.45,towerX+1.45])for(const zz of[towerZ-1.60,towerZ+1.60]){
  b.box(xx,y+2.95,zz,.18,5.9,.18,'#4f4730',22);
  b.box(xx,top+.57,zz,.17,1.25,.17,KOPJE.timber,22);
 }
 // The ladder terminates in an actual hatch, not through a solid floor.
 b.box(34.90,top,towerZ,2.32,.22,3.65,KOPJE.teak,22);
 b.box(33.29,top,-3.3375,.90,.22,1.375,KOPJE.teak,22);
 b.box(33.29,top,-.9875,.90,.22,1.225,KOPJE.teak,22);
 for(const xx of[32.65,36.24])b.box(xx,y+4.48,-2.2,.12,2.66,3.86,'#796b4a',22);
 for(const zz of[-4.09,-.31])for(let i=0;i<15;i++)b.box(34.445,y+3.20+i*.177,zz,3.60,.164,.11,'#80714d',22);
 for(const zz of[towerZ-1.67,towerZ+1.67]){
  for(let j=0;j<5;j++)b.box(towerX,top+.20+j*.16,zz,3.18,.145,.10,j%2?'#897349':'#746344',22);
  b.box(towerX,top+1.42,zz,3.20,.11,.12,'#9f8656',22);
  for(const xx of[towerX-.78,towerX+.78])b.box(xx,top+1.13,zz,.068,.52,.09,KOPJE.timber,22);
 }
 for(const xx of[towerX-1.55,towerX+1.55])for(let j=0;j<5;j++)b.box(xx,top+.20+j*.16,towerZ,.10,.145,3.42,'#7d6e49',22);
 for(const xx of[towerX-1.44,towerX+1.44])for(const zz of[towerZ-1.60,towerZ+1.60])b.box(xx,top+1.13,zz,.13,2.02,.13,KOPJE.timber,22);
 kopjeRoof(b,towerX,top+2.1,towerZ,4.48,4.86,1.53,73);
 // Lean-to iron roof runs up to the hide. Individually modeled corrugations.
 for(let i=0;i<37;i++){
  const xx=30.80+i*.195,z0=2.80,yy=y+3.06;
  if(xx>32.64&&xx<36.23){
   b.quad([xx,yy,2.8],[xx+.193,yy,2.8],[xx+.193,yy+.43,-.31],[xx,yy+.43,-.31],'#6d7560',41);
   b.quad([xx,yy+.765,-4.09],[xx+.193,yy+.765,-4.09],[xx+.193,yy+.92,-5.5],[xx,yy+.92,-5.5],'#6d7560',41);
  }else b.quad([xx,yy,2.8],[xx+.193,yy,2.8],[xx+.193,yy+.92,-5.5],[xx,yy+.92,-5.5],'#6d7560',41);
  const stop=xx>32.64&&xx<36.23?-.31:-5.5;b.beam([xx+.065,yy+.029,z0],[xx+.065,yy+.029+(z0-stop)*.111,stop],.018,'#8c8b6a',41,5);
 }
 for(const xx of[32.98,33.59])b.beam([xx,y,-2.0],[xx,top+.65,-2.0],.040,KOPJE.timber,22,6);
 for(let i=0;i<26;i++)b.beam([32.98,y+.20+i*.245,-2.0],[33.59,y+.20+i*.245,-2.0],.027,'#b09a64',22,5);
 // Tripod optics and an aerial make the hide read as a surveying station.
 for(let i=0;i<3;i++){const a=i*TAU/3;b.beam([towerX+.85+Math.cos(a)*.37,top+.14,towerZ+.63+Math.sin(a)*.37],[towerX+.85,top+1.11,towerZ+.63],.022,'#9a8152',41,5);}
 b.cylinder(towerX+.85,top+1.25,towerZ+.63,.075,.10,.64,'#364e3c',42,12,PI/2);
 b.beam([36.1,y+4.4,-3.68],[36.1,y+10.08,-3.68],.032,'#a4946b',41,6);
 for(const yy of[y+9.3,y+9.76])b.beam([35.68,yy,-3.68],[36.52,yy,-3.68],.012,'#b0a681',41,4);
 for(let i=0;i<5;i++)kopjeCase(b,32.3+(i%2)*1.25,y+Math.floor(i/2)*.65,.3,1.05,.71,.57,i);
 b.box(36.42,y+1.24,-1.9,1.13,2.48,.24,'#6e6244',22);
 for(let i=0;i<4;i++){const xx=36.06+i*.24;b.beam([xx,y+.24,-1.75],[xx+.08,y+2.16,-1.75],.026,'#a38a5b',22,6);b.box(xx,y+1.61,-1.70,.16,.21,.06,'#516448',23);}
 b.box(34.30,y+2.49,2.46,2.8,.33,.068,'#3b503c',22);hudsonText(b,'FIELD STORES',34.30,y+2.49,2.505,2.53,'#d5c095');
}
function kopjeMessTent(b){
 const x=12.25,z=-.6,base=safariSurface(x,z)+.20;
 // A khaki canvas mess fly beside the stone lodge, on the earth. No deck.
 const ridge=base+3.7,eave=base+2.55,w=6.1,d=7.2;
 b.box(x,base-.15,z,5.96,.30,6.92,'#a08e66',3);
 for(const zz of[z-d/2,z+d/2]){
  b.cylinder(x,base+1.85,zz,.075,.055,3.7,'#806641',22,8);
  for(const s of[-1,1])b.beam([x,base+3.66,zz],[x+s*w*.49,base+2.44,zz],.053,KOPJE.timber,22,6);
 }
 for(const s of[-1,1]){
  const point=(u,v)=>[x+s*w/2*v,ridge-(ridge-eave)*v-.20*Math.sin(v*PI)-.16*Math.sin(u*PI)*v,z-d/2+u*d];
  for(let i=0;i<18;i++)for(let j=0;j<8;j++)b.quad(point(i/18,j/8),point((i+1)/18,j/8),point((i+1)/18,(j+1)/8),point(i/18,(j+1)/8),(i%6===0)?'#a49466':'#b8aa7d',23);
  for(const zz of[z-d/2,z+d/2]){
   const xx=x+s*w/2,g=safariSurface(xx,zz);b.cylinder(xx,(g+eave)/2,zz,.043,.037,eave-g,'#6e5b38',22,7);
   const peg=[xx+s*.72,safariSurface(xx+s*.72,zz+.55)+.05,zz+.55];b.beam([xx,eave,zz],peg,.014,'#cbbb8c',23,4);b.beam(add(peg,[0,-.13,0]),add(peg,[0,.20,0]),.030,'#6b5a3c',22,5);
  }
 }
 b.box(x,base+.86,z,4.38,.10,1.36,'#8f7349',22);
 for(const xx of[x-1.6,x+1.6])b.box(xx,base+.43,z,.15,.86,.93,KOPJE.timber,22);
 for(const s of[-1,1]){b.box(x,base+.44,z+s*1.08,4.23,.10,.38,'#8d7348',22);for(const xx of[x-1.6,x+1.6])b.box(xx,base+.22,z+s*1.08,.15,.44,.34,KOPJE.timber,22);}
 for(let i=0;i<4;i++)for(const s of[-1,1])b.cylinder(x-1.45+i*.97,base+.973,z+s*.44,.065,.075,.13,'#d4c7a4',24,10);
 kopjeLantern(b,x,base+.91,z,.57);
 // Water barrels, a wash stand and expedition trunks are practical, not resort furniture.
 for(const [xx,zz]of[[9.60,3.57],[10.44,3.57]]){
  const yy=safariSurface(xx,zz);b.cylinder(xx,yy+.56,zz,.36,.34,1.1,'#606d4a',41,14);
  for(const dy of[.18,.53,.94])b.cylinder(xx,yy+dy,zz,.374,.374,.047,'#3e4b36',41,14);
  b.cylinder(xx,yy+1.14,zz,.36,.36,.056,'#8a8962',41,14);
 }
 kopjeCase(b,14.2,safariSurface(14.2,4.6)+.05,4.6,1.3,.86,.68,1);
 kopjeCase(b,12.7,safariSurface(12.7,4.2)+.05,4.2,1.1,.72,.55,0);
}
function kopjeStoneSteps(b){
 const x=24,z0=3.53,z1=7.8,top=SAFARI_LODGE.floor+.025,width=3.9;
 const bottom=Math.max(...[-width/2,0,width/2].map(dx=>safariSurface(x+dx,z1)))+.045,n=Math.max(2,Math.ceil((top-bottom)/.17));
 for(let i=0;i<n;i++){
  const z=mix(z0,z1,(i+.5)/n),yy=mix(top,bottom,(i+1)/n),ground=Math.min(...[-width/2,0,width/2].map(dx=>safariSurface(x+dx,z)))-.08;
  b.box(x,(ground+yy)/2,z,width,yy-ground,(z1-z0)/n+.012,'#9c8f6f',3);
  for(let j=0;j<7;j++)b.box(x-width/2+(j+.5)*width/7,yy+.012,z,width/7-.019,.035,(z1-z0)/n-.014,j%2?'#b6a47f':'#a39372',3);
 }
 for(const s of[-1,1]){
  const xx=x+s*2.4,g=safariSurface(xx,5.1);kopjeMasonry(b,xx,g-.1,5.1,.84,1.45,.91,s+3);kopjeLantern(b,xx,g+1.37,5.1,.65);
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
 // A quiet entrance gate and engraved trail marker, below the station railway.
 for(const x of[-6.9,-4.6]){const yy=safariSurface(x,22.0);b.cylinder(x,yy+.85,22,.08,.063,1.70,KOPJE.timber,22,8);}
 const signY=safariSurface(-5.75,22)+1.68;b.box(-5.75,signY,22.0,2.66,.41,.09,KOPJE.dark,22);hudsonText(b,'KOPJE HOUSE',-5.75,signY,22.057,2.4,'#d7c295');
 for(const [x,z]of[[-10.8,25],[-35,20],[-21,1],[-12.8,14],[12.5,19.7]]){kopjeLantern(b,x,safariSurface(x,z)+.05,z,.62);}
}
function safariLodge(b){
 kopjeMainHall(b);kopjeGearWing(b);kopjeMessTent(b);kopjeStoneSteps(b);kopjeArrival(b);
 // The old pool and rear porch footprint is earth again, crossed by a narrow
 // footpath. A field noticeboard gives the approach a purpose, not a terrace.
 const x=18.6,z=9.0,y=safariSurface(x,z);
 for(const xx of[x-1.18,x+1.18])b.cylinder(xx,y+1.0,z,.073,.058,2.05,KOPJE.timber,22,7);
 b.box(x,y+1.6,z,2.8,1.3,.14,'#3b513d',22);
 b.box(x,y+1.6,z+.079,2.42,.96,.018,'#bbae80',23);
 for(let i=0;i<5;i++)b.beam([x-.92,y+1.91-i*.14,z+.094],[x+.28+(i%2)*.55,y+1.91-i*.14,z+.094],.011,'#596849',0,4);
 b.push(x,y+2.21,z+.03,-.10);b.box(0,0,0,3.10,.10,.68,'#655237',22);b.pop();
 kopjeLantern(b,18.0,y+.10,9.65,.60);
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
