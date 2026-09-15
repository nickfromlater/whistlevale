function kopjeMasonry(b,x,y,z,w,h,d,variant=0){
 b.box(x,y+h/2,z,w,h,d,'#706b55',3);
 const rows=Math.ceil(h/.40),pitch=h/rows;
 for(const [axis,sign,length]of[['z',1,w],['z',-1,w],['x',1,d],['x',-1,d]]){
  const alongX=axis==='z',cols=Math.ceil(length/.69),step=length/cols;
  for(let row=0;row<rows;row++)for(let i=0;i<=cols;i++){
   const lo=Math.max(-length/2,-length/2+(i-(row%2)*.5)*step),hi=Math.min(length/2,-length/2+(i+1-(row%2)*.5)*step);
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
function kopjeFieldRoof(b){
 const x=24,z=-.8,y=SAFARI_LODGE.floor+4.05,w=15.8,d=11.2,rise=3.65;
 // A steep longitudinal ridge and open triangular gable replace the broad,
 // resort-like hipped canopy. Every reed course follows the roof slope.
 for(const side of[-1,1]){
  const point=(u,v,lift=0)=>[x+side*w/2*(1-v),y+rise*v-.22*Math.sin(v*PI)+lift,z-d/2+u*d];
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
 kopjePendant(b,x,y+4.0,z,.46);
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
  b.cylinder(xx,y+2.38,zz,.16,.115,4.76,KOPJE.timber,22,9);
  for(const side of[-1,1])b.beam([xx,y+3.76,zz],[xx+side*.52,y+4.46,zz],.065,KOPJE.teak,22,6);
 }
 for(const zz of[-4.5,-.65,3.07]){
  b.beam([17.75,y+4.63,zz],[30.25,y+4.63,zz],.115,KOPJE.timber,22,6);
  b.beam([24,y+4.63,zz],[24,y+7.34,zz],.09,KOPJE.timber,22,6);
  for(const side of[-1,1])b.beam([24,y+4.72,zz],[24+side*2.9,y+5.9,zz],.075,KOPJE.teak,22,6);
 }
 // The entry remains open. Canvas storm curtains are rolled up and tied back.
 b.box(24,y+3.5,3.10,6.2,.60,.15,'#334c3d',22);hudsonText(b,'KOPJE FIELD LODGE',24,y+3.5,3.19,5.62,'#d5c195');
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
 kopjeMasonry(b,19.1,y,-3.0,1.8,2.4,1.15,4);b.box(19.1,y+1.0,-2.406,1.08,1.25,.028,'#28342a',42);
 kopjeMasonry(b,19.1,y+2.4,-3.0,1.24,4.0,.96,31);b.box(19.1,y+6.50,-3.0,1.51,.20,1.22,'#6b634e',3);
 for(let i=0;i<4;i++)b.beam([18.73+i*.17,y+.40,-2.39],[19.23+i*.13,y+.49,-2.37],.046,'#59432a',22,6);
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
 b.box(towerX,top,towerZ,3.22,.22,3.65,KOPJE.teak,22);
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
  const xx=30.80+i*.195,z0=2.80,z1=-5.5,yy=y+3.06;
  if(xx>32.64&&xx<36.23){
   b.quad([xx,yy,2.8],[xx+.193,yy,2.8],[xx+.193,yy+.43,-.31],[xx,yy+.43,-.31],'#6d7560',41);
  }else b.quad([xx,yy,2.8],[xx+.193,yy,2.8],[xx+.193,yy+.92,-5.5],[xx,yy+.92,-5.5],'#6d7560',41);
  const stop=xx>32.64&&xx<36.23?-.31:-5.5;b.beam([xx+.065,yy+.029,z0],[xx+.065,yy+.029+(z0-stop)*.111,stop],.018,'#8c8b6a',41,5);
 }
 for(const xx of[32.5,33.24])b.beam([xx,y,-2.0],[xx,top,-2.0],.040,KOPJE.timber,22,6);
 for(let i=0;i<23;i++)b.beam([32.5,y+.20+i*.245,-2.0],[33.24,y+.20+i*.245,-2.0],.027,'#b09a64',22,5);
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
 const x=24,z0=3.74,z1=7.8,top=SAFARI_LODGE.floor+.025,width=3.9;
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
