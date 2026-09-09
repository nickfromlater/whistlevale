'use strict';

// Willowbank Pottery — the first Commons contribution, by nickfromlater.
// Authored for Whistlevale with the shared Builder primitives. The reviewed
// placement, chosen public credit and viewpoint live in contributions/world.json.
function willowbankVessel(b,x,y,z,scale=1,color='#b77e59',bowl=false){
 b.push(x,y,z,0,0,0,scale);
 const profile=bowl?[[0,.067],[.035,.081],[.095,.137],[.145,.154]]:[[0,.057],[.035,.073],[.11,.112],[.20,.102],[.255,.061],[.29,.067]];
 for(let i=1;i<profile.length;i++){const a=profile[i-1],q=profile[i];b.cylinder(0,(a[0]+q[0])/2,0,a[1],q[1],q[0]-a[0],color,23,12);}
 const [top,r]=profile.at(-1);b.cylinder(0,top+.003,0,r,r,.012,shade(color,1.1),23,12);b.cylinder(0,top+.010,0,r*.76,r*.76,.003,shade(color,.43),23,12);b.pop();
}
function willowbankPottery(b,x,y,z,angle=0){
 b.push(x,y,z,0,angle);
 const stone='#b6ad94',timber='#b5996d',trim='#ded0ac',green='#527b6e',roof='#5b7175';
 // A low, deep foundation meets gentle terrain instead of floating over it.
 b.box(0,-.10,.38,6.2,.60,6.35,stone,4);b.box(0,.205,.38,6.28,.05,6.41,'#c8bea4',4);
 for(const zz of[-2.75,3.5])for(let i=0;i<13;i++)b.box(-2.88+i*.48,.05,zz,.018,.27,.018,'#8f927e',4);
 // Small planks over the porch; the front door has a clear approach.
 for(let i=0;i<18;i++)b.box(-2.79+i*.328,.265,2.66,.317,.075,1.58,i%3?timber:'#ad9167',22);
 b.box(-1.42,.105,3.87,1.48,.21,.68,'#b5b199',4);b.box(-1.42,-.025,4.19,1.72,.19,.36,stone,4);
 const bottom=.23,eave=3.03,peak=4.26;
 b.box(-2.48,(bottom+eave)/2,0,.16,eave-bottom,4.02,'#c9baa0',4);
 b.box(2.48,(bottom+eave)/2,0,.16,eave-bottom,4.02,'#d1c1a3',4);
 b.box(0,(bottom+eave)/2,-1.97,4.96,eave-bottom,.18,'#c4b69b',4);
 // Front wall segments form actual recesses around the door and display.
 for(const [cx,w]of[[-2.26,.44],[-.59,.88],[2.18,.60]])b.box(cx,1.63,2,w,2.8,.16,'#d8c9a9',4);
 b.box(-1.51,2.70,2,1.06,.65,.16,'#d8c9a9',4);b.box(.91,.62,2,2.10,.78,.16,'#d8c9a9',4);b.box(.91,2.76,2,2.10,.55,.16,'#d8c9a9',4);
 for(const zz of[-2.02,2.02]){const side=zz>0?1:-1;b.tri([-2.49*side,eave,zz],[2.49*side,eave,zz],[0,peak,zz],zz>0?'#cab894':'#bbad93',4);}
 // Weatherboards and a calm, slightly open painted door.
 for(const xx of[-2.49,2.49])for(const zz of[-2.07,2.07])b.box(xx,1.63,zz,.12,2.91,.13,timber,22);
 b.box(-1.51,1.19,1.77,1.02,1.91,.06,'#344f47',23);
 for(const xx of[-2.07,-.95])b.box(xx,1.29,2.12,.10,2.13,.14,trim,22);b.box(-1.51,2.34,2.12,1.22,.11,.14,trim,22);
 b.push(-2.01,.29,2.10,0,-.20);b.box(.49,.96,0,.98,1.92,.075,green,22);
 for(let i=1;i<6;i++)b.box(i*.163,.89,.044,.014,1.70,.012,'#42675b',22);
 b.box(.49,1.42,.052,.63,.58,.018,'#38564e',6);for(const xx of[.15,.49,.83])b.box(xx,1.42,.066,.028,.64,.027,trim,22);
 for(const yy of[1.10,1.73])b.box(.49,yy,.067,.70,.035,.025,trim,22);
 b.sphere(.83,.94,.094,.035,.035,.027,'#c6ad6d',41,8,5);for(const yy of[.30,1.67])b.box(.06,yy,.067,.11,.043,.038,'#4d5f52',41);b.pop();
 // Open display hatch: shadowed shelves and individually thrown pots.
 b.box(.91,1.71,1.58,2.10,1.40,.07,'#465c51',22);
 for(const xx of[-.16,1.98])b.box(xx,1.73,2.10,.10,1.60,.18,trim,22);
 for(const yy of[.94,1.66,2.47])b.box(.91,yy,1.97,2.30,.085,.48,timber,22);
 b.box(.91,2.54,2.15,2.36,.11,.24,trim,22);
 for(let row=0;row<2;row++)for(let i=0;i<5;i++)willowbankVessel(b,.12+i*.38,.99+row*.715,1.96,.78+(i%3)*.17,['#b98564','#aab4a0','#6e9691','#d2bd91','#b77557'][(i+row)%5],i===3);
 // A round vent and an unlettered maker's plaque avoid another atlas slot.
 b.cylinder(0,3.43,2.075,.205,.205,.06,'#536c60',22,20,PI/2);
 for(let i=-2;i<=2;i++)b.box(i*.055,3.43,2.116,.018,.31,.018,timber,22);
 b.box(-1.51,2.64,2.12,1.08,.24,.12,green,22);b.cylinder(-1.51,2.64,2.193,.074,.074,.016,'#d7c397',23,12,PI/2);
 // Thin courses and raised seams describe the slate without dense tessellation.
 for(const side of[-1,1])for(let course=0;course<7;course++){
  const a=course/7,q=(course+1)/7,xx=t=>side*2.79*t,yy=t=>peak+.07-(peak-eave+.13)*t;
  const points=[[xx(a),yy(a),-2.29],[xx(a),yy(a),2.29],[xx(q),yy(q),2.29],[xx(q),yy(q),-2.29]];if(side<0)points.reverse();
  b.quad(...points,shade(roof,1+(course%3-1)*.035),5);
  b.beam([xx(q),yy(q)+.016,-2.29],[xx(q),yy(q)+.016,2.29],.016,'#778c8b',5,4);
 }
 b.beam([0,peak+.085,-2.32],[0,peak+.085,2.32],.045,'#899893',5,6);
 for(const side of[-1,1]){
  b.beam([side*2.79,eave-.09,-2.33],[side*2.79,eave-.09,2.33],.045,'#697b72',41,7);
  b.beam([side*2.72,eave-.12,-2.07],[side*2.72,.38,-2.07],.035,'#7d8c7b',41,7);
 }
 // A lean-to keeps a practical worktable and greenware out of the rain.
 for(const xx of[-2.67,2.67]){b.box(xx,1.28,3.43,.11,2.08,.11,timber,22);b.beam([xx,1.84,3.43],[xx,2.25,2.91],.035,timber,22,4);}
 b.box(0,2.30,3.43,5.56,.13,.13,timber,22);
 b.quad([-2.82,2.37,3.65],[2.82,2.37,3.65],[2.82,2.76,2.14],[-2.82,2.76,2.14],'#879b8a',5);
 for(let i=0;i<11;i++)b.beam([-2.78+i*.556,2.78,2.14],[-2.78+i*.556,2.39,3.65],.012,'#b3b9a1',5,4);
 b.box(1.04,1.03,2.86,1.69,.10,.68,'#bba279',22);
 for(const xx of[.32,1.76])for(const zz of[2.61,3.11])b.box(xx,.65,zz,.075,.73,.075,timber,22);
 b.box(1.04,.45,2.86,1.51,.07,.56,'#a38b62',22);
 for(const [xx,zz,s,c,bowl]of[[.55,2.8,1.05,'#b18b65',false],[1.12,2.87,1.35,'#c6ad86',true],[1.60,2.84,.85,'#8daca0',false]])willowbankVessel(b,xx,1.09,zz,s,c,bowl);
 b.box(.71,.505,2.82,.55,.05,.39,'#d3c3a0',23);b.box(.74,.55,2.81,.54,.04,.38,'#bfae8d',23);
 // One glazed planter, a supply crate, and a small side window finish the scene.
 willowbankVessel(b,-2.67,.24,2.56,1.85,'#759a88');
 for(let i=0;i<5;i++){const a=i*2.4;b.beam([-2.67,.71,2.56],[-2.67+Math.sin(a)*.18,1.12+hash(i,29)*.12,2.56+Math.cos(a)*.18],.009,'#678660',8,5);}
 b.box(1.89,.44,3.29,.56,.33,.42,'#aa8e62',22);for(let i=0;i<4;i++)b.box(1.66+i*.15,.45,3.507,.045,.31,.025,'#c4ac7e',22);
 b.push(2.58,0,-.30,0,PI/2);windowPane(b,0,1.78,0,.85,.95);b.pop();
 b.pop();return 0;
}

// Meridian Hill Observatory, an original Hall miniature by nickfromlater.
// Native, deterministic Builder geometry only. The Hall owns placement,
// materials, GPU lifetime and creator credits. Positive Z is the entrance.
// This reviewed source bundle is already declared in both Hall and house;
// sharing its definitions preserves deferred loading and portable packing.
function meridianObservatory(b,x,y,z,angle=0){
 const pi=Math.PI,tau=pi*2;
 const stone='#b4ab92',lightStone='#d5c8a9',darkStone='#817d6f';
 const copper='#58897e',copperLight='#80a493',copperDark='#38665f';
 const brass='#c2a66b',iron='#3b514d',wood='#846d50',paper='#dfd1a8';
 const cx=-.62,cz=-.60,deck=5.62,domeY=6.05,domeR=2.51,aim=-.42;
 // Annular arcs have an actual hole, unlike capped cylinders. All four faces
 // are intentional, including the dark underside of the open dome's rim.
 const arc=(radius,yy,start,end,thickness,color,mat=41,segments=24,origin=[0,0])=>{
  for(let i=0;i<segments;i++){
   const a=start+(end-start)*i/segments,q=start+(end-start)*(i+1)/segments;
   const p=(r,t,h)=>[origin[0]+Math.sin(t)*r,h,origin[1]+Math.cos(t)*r];
   const r0=radius-thickness/2,r1=radius+thickness/2,lo=yy-thickness/2,hi=yy+thickness/2;
   b.quad(p(r0,a,hi),p(r1,a,hi),p(r1,q,hi),p(r0,q,hi),color,mat);
   b.quad(p(r1,a,lo),p(r0,a,lo),p(r0,q,lo),p(r1,q,lo),color,mat);
   b.quad(p(r1,a,hi),p(r1,a,lo),p(r1,q,lo),p(r1,q,hi),color,mat);
   b.quad(p(r0,a,lo),p(r0,a,hi),p(r0,q,hi),p(r0,q,lo),color,mat);
  }
 };
 const lamp=(xx,yy,zz)=>{
  b.cylinder(xx,yy+.035,zz,.115,.085,.07,iron,41,8);
  b.cylinder(xx,yy+.46,zz,.025,.022,.85,iron,41,6);
  b.box(xx,yy+.91,zz,.18,.25,.18,'#edc780',6);
  for(const dx of[-.10,.10])for(const dz of[-.10,.10])b.box(xx+dx,yy+.91,zz+dz,.025,.30,.025,iron,41);
  b.cylinder(xx,yy+1.10,zz,.18,.025,.13,iron,41,4);
 };
 const window=(xx,yy,zz,width,height,rotation=0)=>{
  b.push(xx,yy,zz,0,rotation);
  b.box(0,0,-.04,width+.18,height+.18,.14,lightStone,4);
  b.box(0,0,.035,width,height,.035,iron,23);
  b.box(0,0,.059,width-.10,height-.10,.025,'#b7b784',6);
  b.box(0,0,.084,.037,height,.035,brass,41);
  b.box(0,0,.085,width,.035,.035,brass,41);
  b.box(0,-height/2-.04,.09,width+.25,.10,.27,lightStone,4);
  b.pop();
 };
 b.push(x,y,z,0,angle);
 // An eight-sided exhibition plinth, with a brass inset and beveled corners.
 const outline=[[-3.95,-4.22],[3.95,-4.22],[4.52,-3.65],[4.52,3.65],[3.95,4.22],[-3.95,4.22],[-4.52,3.65],[-4.52,-3.65]];
 for(let i=0;i<outline.length;i++){
  const a=outline[i],q=outline[(i+1)%outline.length];
  b.tri([0,.02,0],[q[0],.02,q[1]],[a[0],.02,a[1]],'#788478',23);
  b.quad([q[0],-.30,q[1]],[a[0],-.30,a[1]],[a[0],.02,a[1]],[q[0],.02,q[1]],iron,22);
  b.tri([0,-.30,0],[a[0],-.30,a[1]],[q[0],-.30,q[1]],iron,22);
  b.beam([a[0],-.06,a[1]],[q[0],-.06,q[1]],.024,brass,41,4);
 }
 // Stepped limestone podium and clipped garden corners.
 b.cylinder(cx,.21,cz,3.36,3.36,.38,darkStone,4,16);
 b.cylinder(cx,.46,cz,3.18,3.18,.16,lightStone,4,16);
 b.cylinder(cx,.565,cz,3.06,3.06,.05,'#b5b49b',23,16);
 for(let i=0;i<4;i++){const h=.14+i*.15;b.box(cx,.02+h/2,3.49-i*.31,1.50+i*.05,h,1.03,lightStone,4);}
 // Radial promenade slabs are individually readable without random noise.
 for(let i=0;i<24;i++){
  const a=tau*i/24,p=[cx+Math.sin(a)*2.91,.608,cz+Math.cos(a)*2.91];
  b.push(...p,0,a);b.box(0,0,0,.68,.036,.40,i%3===0?'#d0c5a9':'#c2bba1',4);b.pop();
 }
 // Ten wall faces around a genuinely hollow tower. Each has a recessed arched
 // opening assembled from jambs and voussoirs, not a pane over a solid wall.
 const sides=10,r=2.32,face=r*Math.cos(pi/sides),span=2*r*Math.sin(pi/sides);
 b.cylinder(cx,.77,cz,2.46,2.46,.36,lightStone,4,20);
 b.cylinder(cx,1.005,cz,2.42,2.37,.11,stone,4,20);
 // Two entrance treads bridge the raised tower footing to the promenade.
 b.box(cx,.70,2.16,1.35,.20,.42,lightStone,4);
 b.box(cx,.895,1.96,1.25,.19,.40,lightStone,4);
 for(let i=0;i<sides;i++){
  const a=i*tau/sides,w=.63,base=1.06,spring=3.77,top=5.31;
  b.push(cx+Math.sin(a)*face,0,cz+Math.cos(a)*face,0,a);
  const jambBase=i===0?2.80:base;
  for(const side of[-1,1])b.box(side*(span/4+w/4),(jambBase+top)/2,0,(span-w)/2,top-jambBase,.27,i%2?stone:'#bdb398',4);
  if(i===0){
   // A real recessed entrance meets the stair and the circular promenade.
   for(const side of[-1,1])b.box(side*(span+1.02)/4,1.93,0,(span-1.02)/2,1.74,.27,stone,4);
   b.box(0,1.89,-.075,1.02,1.64,.045,iron,23);
   for(const side of[-1,1]){
    b.box(side*.245,1.88,-.015,.465,1.55,.065,copperDark,22);
    for(const yy of[1.50,2.19])b.box(side*.245,yy,.026,.32,.46,.035,wood,22);
    b.sphere(side*.075,1.91,.072,.029,.029,.024,brass,41,6,4);
    b.box(side*.55,1.92,.09,.11,1.73,.32,lightStone,4);
   }
   b.box(0,2.74,.09,1.24,.13,.35,lightStone,4);
   b.box(0,1.075,.16,1.17,.08,.48,lightStone,4);
  }else b.box(0,1.93,0,w,1.74,.27,stone,4);
  // A dark reveal behind the warm, narrow instrument-room windows.
  b.box(0,3.30,-.065,w-.08,.91,.04,'#4b6058',23);
  b.box(0,3.30,-.033,w-.16,.85,.025,'#b2b38b',6);
  b.box(0,3.32,.015,.035,.98,.035,iron,41);
  b.box(0,3.29,.016,w-.07,.033,.035,iron,41);
  for(const side of[-1,1])b.box(side*(w/2+.05),3.30,.06,.10,1.04,.38,lightStone,4);
  b.box(0,2.74,.085,w+.22,.12,.44,lightStone,4);
  const rr=w/2;
  for(let k=0;k<8;k++){
   const aa=k*pi/8,qq=(k+1)*pi/8;
   const p=(rad,t,zz)=>[Math.cos(t)*rad,spring+Math.sin(t)*rad,zz];
   b.quad(p(rr,aa,.195),p(rr+.13,aa,.195),p(rr+.13,qq,.195),p(rr,qq,.195),k%2?lightStone:stone,4);
   b.quad(p(rr,qq,-.13),p(rr,qq,.195),p(rr,aa,.195),p(rr,aa,-.13),darkStone,4);
   b.tri([0,spring,-.07],p(rr,aa,-.07),p(rr,qq,-.07),'#767f65',6);
   // Close the spandrel above the curved opening all the way through the wall.
   b.quad(p(rr,aa,.135),[Math.cos(aa)*rr,top,.135],[Math.cos(qq)*rr,top,.135],p(rr,qq,.135),stone,4);
   b.quad(p(rr,qq,-.135),[Math.cos(qq)*rr,top,-.135],[Math.cos(aa)*rr,top,-.135],p(rr,aa,-.135),stone,4);
  }
  for(const yy of[1.17,2.17,4.47,5.12]){
   if(i===0&&yy<2.8){for(const side of[-1,1])b.box(side*(span+1.15)/4,yy,.15,(span-1.15)/2,.045,.075,'#cbbfa1',4);}
   else b.box(0,yy,.15,span+.015,.045,.075,'#cbbfa1',4);
  }
  b.pop();
 }
 b.cylinder(cx,5.39,cz,2.44,2.50,.16,lightStone,4,20);
 b.cylinder(cx,5.54,cz,2.62,2.62,.14,iron,41,32);
 b.cylinder(cx,deck,cz,2.53,2.53,.035,wood,22,32);
 // Ring of short carved corbels under the observing deck.
 for(let i=0;i<20;i++){
  const a=i*tau/20;b.push(cx+Math.sin(a)*2.41,5.18,cz+Math.cos(a)*2.41,0,a);
  b.box(0,0,0,.15,.32,.34,lightStone,4);b.pop();
 }
 // External iron stair winds up the back/left, leaving the front entrance and
 // right-hand workshop visible. A single stringer supports every actual tread.
 const stairStart=2.36,stairEnd=5.40,steps=31,stairR=2.76;
 for(let i=0;i<steps;i++){
  const t=i/(steps-1),a=stairStart+(stairEnd-stairStart)*t,yy=.65+(deck-.65)*t;
  b.push(cx+Math.sin(a)*stairR,yy,cz+Math.cos(a)*stairR,0,a);
  b.box(0,0,0,.36,.075,.60,wood,22);
  b.box(0,-.10,0,.055,.20,.51,iron,41);
  if(i%2===0){b.box(0,.39,.31,.034,.82,.034,iron,41);b.box(0,.81,.31,.074,.065,.074,brass,41);}
  b.pop();
  if(i){
   const prev=(i-1)/(steps-1),pa=stairStart+(stairEnd-stairStart)*prev,py=.65+(deck-.65)*prev;
   for(const [rad,dy,thick,color]of[[stairR,-.13,.035,iron],[stairR+.31,.81,.034,brass]])
    b.beam([cx+Math.sin(pa)*rad,py+dy,cz+Math.cos(pa)*rad],[cx+Math.sin(a)*rad,yy+dy,cz+Math.cos(a)*rad],thick,color,41,5);
  }
 }
 // Copper hemisphere, split open toward the telescope. No filled cap crosses
 // the viewing aperture; the shell has both an outer and an inner skin.
 const opening=.56,start=aim+opening,end=aim+tau-opening,bands=8,sectors=24;
 const domePoint=(a,t,rad)=>[cx+Math.sin(a)*Math.cos(t)*rad,domeY+Math.sin(t)*rad,cz+Math.cos(a)*Math.cos(t)*rad];
 for(let i=0;i<sectors;i++){
  const a=start+(end-start)*i/sectors,q=start+(end-start)*(i+1)/sectors;
  for(let j=0;j<bands;j++){
   const t=j*pi/(2*bands),u=(j+1)*pi/(2*bands),color=[copper,copperLight,copper,copper,copperDark,copper][i%6];
   if(j===bands-1){
    b.tri(domePoint(a,t,domeR),domePoint(q,t,domeR),[cx,domeY+domeR,cz],color,41);
    b.tri(domePoint(q,t,domeR-.07),domePoint(a,t,domeR-.07),[cx,domeY+domeR-.07,cz],copperDark,23);
   }else{
    b.quad(domePoint(a,t,domeR),domePoint(q,t,domeR),domePoint(q,u,domeR),domePoint(a,u,domeR),color,41);
    b.quad(domePoint(q,t,domeR-.07),domePoint(a,t,domeR-.07),domePoint(a,u,domeR-.07),domePoint(q,u,domeR-.07),copperDark,23);
   }
  }
  if(i%2===0)for(let j=0;j<bands;j++){
   const t=j*pi/(2*bands),u=(j+1)*pi/(2*bands);
   b.quad(domePoint(a-.008,t,domeR+.025),domePoint(a+.008,t,domeR+.025),domePoint(a+.008,u,domeR+.025),domePoint(a-.008,u,domeR+.025),brass,41);
  }
 }
 for(const a of[start,end])for(let j=0;j<bands;j++){
  const t=j*pi/(2*bands),u=(j+1)*pi/(2*bands);
  b.beam(domePoint(a,t,domeR+.02),domePoint(a,u,domeR+.02),.060,brass,41,6);
 }
 arc(domeR,domeY,0,tau,.12,iron,41,36,[cx,cz]);
 arc(domeR+.02,domeY+.10,start,end,.07,brass,41,32,[cx,cz]);
 // Small shutter rollers beneath the drum, rather than another solid cylinder.
 for(let i=0;i<12;i++){
  const a=i*tau/12;b.push(cx+Math.sin(a)*domeR,domeY-.20,cz+Math.cos(a)*domeR,0,a);
  b.box(0,-.165,0,.12,.13,.12,iron,41);
  b.cylinder(0,0,0,.10,.10,.10,brass,41,8,pi/2);b.pop();
 }
 for(const yy of[5.73,5.96])arc(domeR,yy,0,tau,.045,iron,41,32,[cx,cz]);
 // A proper equatorial refractor: pier, yoke, two axes, counterweight, tube
 // bands, objective glass, finder scope and a reachable eyepiece.
 b.cylinder(cx,deck+.12,cz,.54,.54,.24,darkStone,4,12);
 b.cylinder(cx,deck+.64,cz,.25,.19,1.02,iron,41,12);
 b.sphere(cx,deck+1.22,cz,.27,.27,.27,brass,41,10,6);
 b.push(cx,deck+1.18,cz,0,aim);
 for(const side of[-1,1])b.box(side*.35,.12,0,.12,.57,.18,iron,41);
 b.beam([-.46,.36,0],[.98,-.10,0],.05,brass,41,8);
 b.sphere(.89,-.065,0,.22,.24,.23,iron,41,10,6);
 b.push(0,.34,0,pi/2-.62);
 b.cylinder(0,.28,0,.25,.29,2.45,'#315d5e',41,20);
 for(const yy of[-.77,-.24,.88,1.48])b.cylinder(0,yy,0,.315,.315,.12,brass,41,20);
 b.cylinder(0,1.61,0,.37,.37,.26,iron,41,24);
 b.cylinder(0,1.749,0,.315,.315,.018,'#578a95',41,24);
 b.cylinder(0,1.761,0,.21,.21,.007,'#a9d1c9',41,20);
 b.cylinder(0,-1.09,0,.095,.095,.24,brass,41,12);
 b.cylinder(0,-1.25,0,.135,.135,.09,iron,41,12);
 b.beam([.27,-.50,0],[.42,-.50,0],.045,brass,41,6);
 b.sphere(.45,-.50,0,.095,.095,.06,iron,41,8,5);
 for(const yy of[.13,.66])b.box(-.39,yy,0,.25,.05,.05,brass,41);
 b.cylinder(-.48,.40,0,.075,.085,.91,iron,41,10);
 b.cylinder(-.48,.88,0,.10,.10,.055,brass,41,10);
 b.pop();b.pop();
 // Low observer's seat, kept behind the eyepiece rather than under the lens.
 b.cylinder(cx+.31,deck+.44,cz-.93,.035,.035,.72,iron,41,6);
 b.cylinder(cx+.31,deck+.82,cz-.93,.27,.27,.10,wood,22,12);
 // A ground-level chart room attached on the right, with an open front. Its
 // sloped standing-seam roof leaves the warm interior legible from the bay.
 b.box(2.87,.38,1.37,2.70,.38,3.46,lightStone,4);
 b.box(2.87,.60,1.37,2.45,.06,3.18,wood,22);
 b.box(4.04,1.78,1.36,.18,2.36,3.14,stone,4);
 b.box(2.87,1.78,-.17,2.45,2.36,.18,stone,4);
 b.box(1.69,1.78,1.36,.15,2.36,3.14,stone,4);
 for(const xx of[1.69,4.04])b.box(xx,1.76,2.88,.17,2.34,.20,lightStone,4);
 b.box(2.87,2.90,2.88,2.60,.20,.22,lightStone,4);
 b.box(2.87,.49,3.21,2.42,.16,.48,lightStone,4);
 for(let i=0;i<9;i++){
  const xx=1.53+i*.31,xx2=xx+.308;
  b.quad([xx,3.11,3.05],[xx2,3.11,3.05],[xx2,3.54,-.37],[xx,3.54,-.37],i%3?copper:copperLight,5);
  b.beam([xx,3.13,3.05],[xx,3.56,-.37],.017,brass,41,4);
 }
 b.box(2.87,3.13,3.07,2.96,.12,.10,copperDark,41);
 window(4.15,1.99,1.37,.71,.87,pi/2);
 // Chart desk and three folded atlases. Paper is geometry, not a new atlas slot.
 b.box(2.88,1.33,2.24,1.77,.09,.80,wood,22);
 for(const xx of[2.10,3.66])for(const zz of[1.94,2.54])b.box(xx,.96,zz,.08,.66,.08,wood,22);
 b.push(2.71,1.40,2.29,.10);
 b.box(0,0,0,.96,.015,.58,paper,23);
 for(let i=0;i<5;i++)b.box(-.35+i*.16,.01,0,.009,.004,.46,'#899681',23);
 for(let i=0;i<3;i++)b.box(0,.011,-.18+i*.18,.85,.004,.009,'#899681',23);
 b.beam([-.28,.020,.16],[-.11,.020,-.13],.008,brass,41,4);
 b.beam([-.11,.020,-.13],[.23,.020,.04],.008,brass,41,4);
 b.pop();
 for(let i=0;i<3;i++)b.box(3.48,1.42+i*.055,2.14,.32,.050,.45,['#395d58','#a77650',paper][i],22);
 b.box(2.87,2.15,-.03,1.42,1.05,.045,wood,22);
 b.box(2.87,2.15,.001,1.27,.89,.012,'#354c50',23);
 for(let i=0;i<9;i++){
  const xx=2.38+(i%3)*.46,yy=1.85+Math.floor(i/3)*.29;
  b.push(xx,yy,.023,0,0,pi/4);b.box(0,0,0,.033,.033,.014,brass,41);b.pop();
 }
 b.box(2.03,1.42,.52,.39,1.60,.38,wood,22);
 for(let i=0;i<3;i++){b.box(2.05,1.06+i*.44,.74,.37,.055,.12,paper,23);}
 lamp(3.63,1.38,2.34);
 // A brass armillary in the foreground, three open great circles and a globe.
 b.cylinder(-2.92,.36,2.71,.46,.43,.64,lightStone,4,10);
 b.cylinder(-2.92,.77,2.71,.57,.57,.16,lightStone,4,12);
 b.push(-2.92,1.51,2.71,.35,0,.20);
 arc(.56,0,0,tau,.037,brass,41,24);
 b.push(0,0,0,pi/2);arc(.56,0,0,tau,.037,brass,41,24);b.pop();
 b.push(0,0,0,0,0,pi/2);arc(.59,0,0,tau,.043,brass,41,24);b.pop();
 b.sphere(0,0,0,.17,.17,.17,'#5b8f86',41,12,8);
 b.beam([0,-.76,0],[0,.76,0],.022,iron,41,6);b.pop();
 // Two clipped yews and gravel beds keep the scene grounded, not overgrown.
 for(const [xx,zz]of[[-3.84,-2.98],[3.76,-2.99]]){
  b.cylinder(xx,.21,zz,.39,.31,.38,darkStone,4,8);
  b.cylinder(xx,.74,zz,.25,.10,.78,'#506d58',8,9);
  b.cylinder(xx,1.17,zz,.19,.01,.63,'#62816a',8,9);
 }
 lamp(.51,.07,3.70);
 // An unlettered maker's plate echoes the Hall's own accessible text label.
 b.box(1.43,.061,3.75,1.02,.045,.43,brass,41);
 b.box(1.43,.088,3.75,.89,.012,.30,iron,23);
 for(let i=0;i<3;i++)b.box(1.16+i*.26,.098,3.75,.14,.006,.016,brass,41);
 b.pop();return 0;
}
