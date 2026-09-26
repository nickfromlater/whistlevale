'use strict';

// The city is composed as districts, not a scattering of standalone buildings.
// These smaller houses form calle walls behind the eleven canal palazzi.
const VENETIAN_CALLE_BLOCKS=[
 {x:-46,z:-23.0,w:7.1,d:4.0,h:6.9,c:'#b38770',v:0},
 {x:-35.8,z:-23.4,w:8.8,d:3.8,h:7.8,c:'#859992',v:1},
 {x:-22.2,z:-24.0,w:9.0,d:3.8,h:7.2,c:'#c1a581',v:2},
 {x:-10.9,z:-23.3,w:6.7,d:4.4,h:8.1,c:'#ac7770',v:3},
 {x:-46,z:25.8,w:7.8,d:5.8,h:8.1,c:'#b9a481',v:4},
 {x:-15.1,z:28.4,w:6.4,d:5.2,h:7.3,c:'#899f98',v:5},
 {x:-7.5,z:25.7,w:5.7,d:8.0,h:6.6,c:'#b57c70',v:6},
 {x:20.5,z:28.3,w:5.4,d:5.4,h:6.2,c:'#d0b393',v:7},
 {x:30.6,z:27.5,w:7.3,d:5.2,h:8.7,c:'#a38277',v:8},
 {x:49.1,z:28.1,w:6.2,d:5.4,h:7.3,c:'#8c9b83',v:9},
 {x:48.2,z:-27.4,w:7.5,d:7.0,h:8.8,c:'#ba9678',v:10}
];
function venetianCalleHouse(b,o){
 const C=VENETIAN_COLORS,{x,z,w,d,h,c,v}=o;b.push(x,VENETIAN.quay,z);
 b.box(0,h/2,0,w,h,d,c,103);b.box(0,.20,0,w+.15,.40,d+.15,C.shadow,104);
 const floors=h>7.5?3:2;
 for(let face=0;face<4;face++){
  const wide=face%2?d:w,depth=face%2?w:d;b.push(0,0,0,0,face*PI/2);
  for(let f=0;f<floors;f++)for(let j=0;j<Math.max(2,Math.floor(wide/2.7));j++){
   const bays=Math.max(2,Math.floor(wide/2.7)),xx=(j-(bays-1)/2)*wide/(bays+.25),yy=.95+f*(h-.8)/floors,H=f?1.45:1.6,W=.82;
   // Inset dark reveals, a thin sill and working-depth shutters, not a
   // borrowed full palace window builder repeated on a low-detail house.
   b.box(xx,yy+.22,depth/2+.018,W+.18,H+.15,.045,C.shadow,104);
   b.quad([xx-W/2,yy-H/2+.22,depth/2+.044],[xx+W/2,yy-H/2+.22,depth/2+.044],[xx+W/2,yy+H/2+.22,depth/2+.044],[xx-W/2,yy+H/2+.22,depth/2+.044],(j+v+f)%5===0?'#cdb49a':'#34514d',(j+v+f)%5===0?6:43,[0,0,1]);
   b.box(xx,yy-H/2+.18,depth/2+.12,W+.30,.12,.28,C.stone,104);
   b.box(xx,yy+.22,depth/2+.080,.042,H,.045,C.stone,104);
   if(f>0&&face<2)for(const side of[-1,1])b.box(xx+side*.59,yy+.22,depth/2+.14,.28,H+.12,.07,v%2?'#486a61':'#71867a',22);
  }
  b.box(0,h-.13,depth/2+.06,wide+.3,.21,.28,C.stone,104);b.pop();
 }
 const X=w/2+.25,Z=d/2+.25,rise=1.0+(v%3)*.20,R=w*.24;
 const a=[-X,h,Z],q=[X,h,Z],d0=[-X,h,-Z],e=[X,h,-Z],l=[-R,h+rise,0],r=[R,h+rise,0];
 const roof=v%2?'#945f4f':'#ac795e';b.quad(a,q,r,l,roof,5);b.quad(e,d0,l,r,shade(roof,.90),5);b.tri(d0,a,l,roof,5);b.tri(q,e,r,roof,5);
 b.beam(l,r,.065,shade(roof,1.12),5,5);
 b.box(-w*.26,h+.74,-.55,.44,1.28,.46,C.brick,4);b.box(-w*.26,h+1.42,-.55,.75,.12,.77,C.stone,104);
 b.pop();
}
function venetianPiercedRose(b,x,y,z,r,halfW,halfH,depth=.18){
 const C=VENETIAN_COLORS,N=32;
 // A four-lobed aperture cut right through a stone panel. The radial strip
 // closes on the rectangular perimeter; there is no opaque backing disk.
 const point=(a,outer,d)=>{
  const cs=Math.cos(a),sn=Math.sin(a),radius=outer?Math.min(halfW/Math.max(Math.abs(cs),1e-9),halfH/Math.max(Math.abs(sn),1e-9)):r*(.84+.16*Math.cos(4*a));
  return[x+cs*radius,y+sn*radius,z+d];
 };
 const corner=Math.atan2(halfH,halfW),angles=[...Array.from({length:N},(_,i)=>i*TAU/N),corner,PI-corner,PI+corner,TAU-corner].sort((a,b)=>a-b);
 for(let i=0;i<angles.length;i++){
  const a=angles[i],q=i+1<angles.length?angles[i+1]:TAU;
  b.quad(point(a,false,0),point(q,false,0),point(q,true,0),point(a,true,0),C.stone,104,[0,0,1]);
  b.quad(point(q,false,-depth),point(a,false,-depth),point(a,true,-depth),point(q,true,-depth),C.shadow,104,[0,0,-1]);
  b.quad(point(a,false,0),point(a,false,-depth),point(q,false,-depth),point(q,false,0),C.shadow,104);
 }
}
function venetianLacePalace(b){
 const C=VENETIAN_COLORS;b.push(17.5,1.2,-9.9);
 const W=21.8,D=5.8,pitch=W/9;
 b.box(0,.13,0,W+.45,.26,D+.35,'#a98b77',104);
 b.box(0,4.05,-D/2,W,8.1,.28,'#b88f86',103);
 for(const side of[-1,1])b.box(side*(W/2-.10),4.05,0,.20,8.1,D,C.stone,104);
 for(const y of[2.94,6.22,8.02])b.box(0,y,0,W+.30,.22,D+.25,C.stone,104);
 for(let i=0;i<9;i++){
  const x=(i-4)*pitch;
  for(const side of[-1,1])if(i===0||side===1){
   b.cylinder(x+side*pitch/2,1.28,D/2,.13,.115,2.40,C.stone,104,8);
   b.box(x+side*pitch/2,2.51,D/2,.38,.18,.40,C.stone,104);
  }
  venetianArch(b,x,2.30,D/2,pitch*.41,.60,.13,.30,C.stone);
  // The upper gallery is open and shaded, with an interlaced quatrefoil band.
  venetianFacadeCell(b,{x,y0:3.10,y1:5.25,pitch,r:.71,front:D/2,color:C.stone,variant:2,open:true,pointed:true,segments:8});
  venetianPiercedRose(b,x,5.60,D/2+.04,.43,pitch/2,.50,.22);
  if(i%2===0){
   venetianFacadeCell(b,{x,y0:6.30,y1:7.84,pitch,r:.34,front:D/2+.08,color:'#d3afa1',variant:i,pointed:true,segments:6});
  }else{
   b.box(x,7.05,D/2,pitch,1.68,.22,'#cfa697',103);
   for(const yy of[6.6,7.25])for(const dx of[-.6,0,.6])b.quad([x+dx-.19,yy,D/2+.13],[x+dx,yy-.24,D/2+.13],[x+dx+.19,yy,D/2+.13],[x+dx,yy+.24,D/2+.13],C.stone,104,[0,0,1]);
  }
  b.box(x,3.08,D/2+.03,pitch,.16,.41,C.stone,104);
  b.box(x,8.27,D/2,.30,.35,.38,C.stone,104);b.sphere(x,8.53,D/2,.16,.18,.16,C.stone,104,6,4);
 }
 // Diamond terrace floor and real objects visible through the open colonnade.
 b.box(0,3.06,0,W,.10,D,'#937564',104);
 for(const x of[-7,0,7]){b.box(x,3.68,-1.5,2.0,1.1,.55,'#875c5c',23);b.cylinder(x,3.30,.6,.31,.31,.48,C.gold,41,7);}
 const A=[-W/2-.3,8.1,D/2+.3],B=[W/2+.3,8.1,D/2+.3],L=[-W/2+1,9.08,0],R=[W/2-1,9.08,0];
 b.quad(A,B,R,L,'#ad785c',5);b.quad([B[0],8.1,-D/2-.3],[A[0],8.1,-D/2-.3],L,R,'#92614f',5);
 for(const side of[-1,1])b.tri([side*(W/2+.3),8.1,-D/2-.3],[side*(W/2+.3),8.1,D/2+.3],[side*(W/2-1),9.08,0],'#a46f58',5);
 b.pop();
}
function venetianBridgeShops(b,width){
 const C=VENETIAN_COLORS;
 for(const side of[-1,1]){
  const z=side*(width/2-1.01);
  for(const x of[-7.0,-4.45,4.45,7.0]){
   const w=2.28,d=1.90,y=venetianBridgeHeight(x-Math.sign(x)*w/2);
   // Each shop sits on its own stepped masonry wedge. Its uphill sill is
   // level; the downhill end is supported all the way to the stair deck.
   const a=x-w/2,q=x+w/2;
   for(const edge of[-d/2,d/2])b.quad([a,venetianBridgeHeight(a)-.06,z+edge],[q,venetianBridgeHeight(q)-.06,z+edge],[q,y,z+edge],[a,y,z+edge],C.stone,104);
   for(const end of[a,q])b.box(end,(y+venetianBridgeHeight(end))*.5-.015,z,.08,Math.max(.03,y-venetianBridgeHeight(end)),d,C.stone,104);
   b.push(x,y,z,0,side>0?PI:0);
   // The shopfront is genuinely open. Dark backing, side walls and a
   // counter give the little wares depth instead of a painted solid door.
   const left=-w/2,right=w/2,rear=-d/2,front=d/2;
   b.quad([left,0,rear],[right,0,rear],[right,2.2,rear],[left,2.2,rear],'#c8bba3',104);
   // The counter faces the pedestrian aisle; the canal elevation has a small
   // framed rear window instead of an unarticulated dark wall.
   const pane=(x0,x1,y0,y1,depth,color,material)=>b.quad([x1,y0,depth],[x0,y0,depth],[x0,y1,depth],[x1,y1,depth],color,material,[0,0,-1]);
   pane(-.37,.37,.95,1.83,rear-.015,'#4d7069',43);
   for(const xx of[-.41,.41])pane(xx-.05,xx+.05,.90,1.88,rear-.025,C.stone,104);
   for(const yy of[.91,1.87])pane(-.46,.46,yy-.045,yy+.045,rear-.026,C.stone,104);
   pane(-.025,.025,.95,1.83,rear-.028,C.stone,104);
   for(const xx of[left,right])b.quad([xx,0,rear],[xx,0,front],[xx,2.2,front],[xx,2.2,rear],'#d4c6ad',104);
   b.quad([left,2.2,rear],[right,2.2,rear],[right,2.2,front],[left,2.2,front],C.shadow,104);
   for(const xx of[-.99,.99])b.box(xx,1.1,front,.25,2.2,.25,C.stone,104);
   b.box(0,2.03,front,1.8,.34,.27,C.stone,104);
   b.box(0,.45,front-.24,1.8,.9,.46,'#607c6b',22);b.box(0,.94,front-.20,1.94,.08,.59,'#b49b70',22);
   for(let j=0;j<3;j++){
    const xx=-.54+j*.54,h=.20+(j%2)*.13;
    b.box(xx,1.02+h/2,front-.13,.32,h,.27,[C.brick,'#749d91','#bda364'][j],23);
    b.box(xx,1.01+h,front-.13,.34,.025,.29,C.stone,24);
   }
   b.box(0,1.94,d/2+.16,w*.80,.20,.08,'#886648',22);
   gable(b,w+.19,d+.28,2.28,.44,'#a86f56');
   b.pop();
  }
  for(const x of[-2.45,0,2.45]){b.box(x,6.48,z,.27,3.02,.34,C.stone,104);b.box(x,7.94,z,.51,.19,.52,C.stone,104);}
  for(const x of[-1.225,1.225])venetianArch(b,x,7.11,z,1.075,.76,.15,.36,C.stone);
  b.box(0,8.13,z,5.52,.25,2.12,C.stone,104);
 }
 // One cross-vaulted portico joins the two shop rows over an open stair aisle.
 gable(b,5.80,width+.48,8.34,1.06,'#a36d53');
 for(const side of[-1,1]){
  b.push(0,0,side*(width/2+.14),0,side<0?PI:0);
  b.box(0,8.47,0,4.35,.43,.13,'#3b5c59',22);hudsonText(b,'PONTE DELLE LANTERNE',0,8.46,.09,3.96,C.stone);
  b.cylinder(0,9.12,.14,.32,.32,.06,C.gold,41,12,PI/2);b.pop();
 }
 for(const x of[-2.1,2.1])for(const side of[-1,1]){
  const z=side*1.44;b.beam([x,8.3,z],[x,7.7,z],.025,C.gold,41,5);
  b.cylinder(x,7.5,z,.17,.17,.36,'#e1ba82',6,8);b.cylinder(x,7.71,z,.23,.08,.12,C.ink,41,8);
 }
}
function venetianCityEnsemble(b){
 for(const house of VENETIAN_CALLE_BLOCKS)venetianCalleHouse(b,house);
 venetianLacePalace(b);
 // Four authored small lives, with their feet on the actual gallery/paving.
 for(const [x,y,z,a,c]of[[12.4,4.31,-8.6,0,'#8f6d68'],[20.8,4.31,-8.6,.4,'#879f96'],[-15,1.23,24.5,1.1,'#b7aa88'],[33,1.23,23.6,-.7,'#9b827b']])venetianPerson(b,x,y,z,a,c);
 const rear=venetianBuildingSpec(VENETIAN_BLOCKS[1]),A=[-37,7,rear.z-rear.d/2],B=[-37,7,-21.5];
 const rope=t=>[mix(A[0],B[0],t),7-.22*Math.sin(PI*t),mix(A[2],B[2],t)];
 for(let i=0;i<6;i++)b.beam(rope(i/6),rope((i+1)/6),.018,'#726b57',22,4);
 for(let i=0;i<3;i++){const p=rope((i+1)/4);b.quad([p[0]-.35,p[1],p[2]],[p[0]+.35,p[1],p[2]],[p[0]+.30,p[1]-.90,p[2]+.08],[p[0]-.32,p[1]-.86,p[2]+.04],['#c3ab92','#9caaa1','#b18b82'][i],23);}
}


// A single authored centerpiece gives the campo an identity without filling
// every empty space. The remaining paving is a usable pedestrian approach.
const VENETIAN_PIAZZA_MONUMENT={x:9.2,z:18.1};
function venetianWingedLion(b){
 const bronze='#53766b',edge='#849780';
 b.sphere(0,.42,0,.69,.33,.29,bronze,41,10,6);
 b.sphere(.50,.66,0,.32,.35,.30,bronze,41,10,6);
 b.sphere(.72,.76,0,.24,.24,.23,edge,41,9,5);
 b.sphere(.92,.66,0,.24,.13,.16,bronze,41,8,5);
 b.sphere(1.08,.70,0,.075,.06,.11,'#344e46',41,7,4);
 for(const side of[-1,1]){
  b.beam([.42,.51,side*.20],[.78,.13,side*.21],.085,bronze,41,7);
  b.sphere(.88,.11,side*.21,.22,.09,.12,edge,41,7,4);
  b.beam([-.44,.38,side*.20],[-.63,.12,side*.24],.11,bronze,41,7);
  b.sphere(-.44,.10,side*.24,.27,.09,.12,bronze,41,7,4);
  b.sphere(.75,.83,side*.17,.040,.036,.035,'#303e37',0,6,4);
  b.sphere(.53,.99,side*.18,.10,.11,.085,bronze,41,7,4);
  // Tapered feather shells fan from a thick wing root, not a flat triangle.
  for(let i=0;i<7;i++){
   const t=i/6,a=[.19,.57,side*.18],tip=[-.82+t*.54,1.04+t*.67,side*(.36+t*.27)],bend=lerpV(a,tip,.48),spread=.085;
   const left=[bend[0]-spread,bend[1],bend[2]],right=[bend[0]+spread,bend[1],bend[2]],ridge=[bend[0],bend[1]+.035,bend[2]+side*.045];
   b.tri(a,left,ridge,bronze,41);b.tri(a,ridge,right,edge,41);b.tri(left,tip,ridge,bronze,41);b.tri(ridge,tip,right,edge,41);
   b.tri(a,tip,left,bronze,41);b.tri(a,right,tip,bronze,41);
  }
 }
 for(let i=0;i<9;i++){const a=i*TAU/9;b.sphere(.49,.68+Math.sin(a)*.28,Math.cos(a)*.26,.13,.12,.11,bronze,41,6,4);}
 let last=[-.61,.45,0];
 for(let i=1;i<=9;i++){const t=i/9,p=[-.61-.36*Math.sin(t*PI*.85),.45+.42*t,Math.sin(t*PI)*.16];b.beam(last,p,.032,bronze,41,5);last=p;}
 // Open book and raised page edges under the front paws.
 b.push(.92,.06,.03,0,0,0,.7);b.box(0,.03,0,.75,.09,.65,'#526458',41);
 for(const side of[-1,1]){b.quad([0,.15,-.29],[side*.34,.10,-.29],[side*.34,.10,.29],[0,.15,.29],'#b3a77a',41);for(let j=0;j<4;j++)b.beam([side*.05,.155,-.17+j*.10],[side*.27,.12,-.17+j*.10],.007,'#697662',41,4);}b.pop();
}
function venetianGonfalon(b,x,z,angle){
 const C=VENETIAN_COLORS;b.push(x,VENETIAN.quay,z,0,angle);
 b.cylinder(0,.14,0,.32,.32,.28,C.stone,104,10);b.cylinder(0,3.39,0,.056,.035,6.55,C.ink,41,8);
 b.beam([-.16,6.17,0],[1.41,6.17,0],.044,C.gold,41,7);b.sphere(0,6.77,0,.11,.18,.11,C.gold,41,8,5);
 const point=(u,v)=>[.10+u*1.18,6.10-v*2.05-(v>.99?.27*Math.abs(u-.5)*2:0),.07*Math.sin(PI*u)+.025*Math.sin(v*PI*2)];
 for(let i=0;i<10;i++)for(let j=0;j<5;j++){
  const a=i/10,q=(i+1)/10,t=j/5,r=(j+1)/5;
  b.quad(point(a,t),point(q,t),point(q,r),point(a,r),i===0||i===9?'#bb965f':'#894e4c',23);
 }
 for(const u of[.05,.95])for(let j=0;j<5;j++)b.beam(point(u,j/5),point(u,(j+1)/5),.011,C.gold,41,4);
 // A gilt medallion and small rays read at canal distance without text clutter.
 const p=point(.50,.34);b.cylinder(p[0],p[1],p[2]+.03,.19,.19,.024,C.gold,41,12,PI/2);
 for(let i=0;i<8;i++){const a=i*TAU/8;b.beam([p[0]+Math.sin(a)*.22,p[1]+Math.cos(a)*.22,p[2]+.032],[p[0]+Math.sin(a)*.28,p[1]+Math.cos(a)*.28,p[2]+.032],.012,C.gold,41,4);}
 b.pop();
}
function venetianPiazzaMonument(b){
 const C=VENETIAN_COLORS,{x,z}=VENETIAN_PIAZZA_MONUMENT;
 b.push(x,VENETIAN.quay,z);
 for(const [y,r,h]of[[.10,1.03,.20],[.30,.88,.20],[.55,.64,.30],[.80,.46,.20]])b.cylinder(0,y,0,r,r,h,C.stone,104,12);
 b.cylinder(0,2.56,0,.27,.32,3.30,'#9daa9d',104,16);
 for(let i=0;i<12;i++){const a=i*TAU/12;b.beam([Math.cos(a)*.28,.92,Math.sin(a)*.28],[Math.cos(a)*.31,4.14,Math.sin(a)*.31],.012,'#b6bca7',104,4);}
 b.cylinder(0,4.25,0,.39,.48,.28,C.stone,104,12);b.box(0,4.46,0,1.25,.16,.92,C.stone,104);
 b.push(0,4.55,0,0,-.55,0,1.22);venetianWingedLion(b);b.pop();b.pop();
 venetianGonfalon(b,4.4,29.8,-.16);venetianGonfalon(b,14.0,29.8,.14);
}

// Approximate static sky exposure from authored building masses. Bake once
// into the otherwise-unused masonry UV.x, never compute it on the frame loop.
// World-map motion cannot move this contact shading off its miniature.
function venetianMasonryMasses(){
 return [...VENETIAN_BLOCKS.map(venetianBuildingSpec),...VENETIAN_CALLE_BLOCKS,
  {x:17.5,z:-9.9,w:21.8,d:5.8,h:8.1},{x:17.8,z:-25.2,w:18,d:11.4,h:6.6},{x:37,z:-25,w:4.1,d:4.1,h:22}];
}
function venetianSkyExposure(x,y,z,nx,ny,nz,masses){
 let shadeAmount=ny<-.5?.36:0;
 for(const o of masses){
  const height=VENETIAN.quay+o.h-y;if(height<=.06)continue;
  const ax=Math.abs(x-o.x)-o.w/2,az=Math.abs(z-o.z)-o.d/2;
  if(ax<-.03&&az<-.03){
   // Interior floors see light through their nearby opening, not an opaque
   // wall of extra shadows. The analytical mass is not a sun-shadow caster.
   shadeAmount=Math.max(shadeAmount,.36*Math.min(1,Math.min(-ax,-az)/.95));continue;
  }
  const dx=Math.max(0,ax),dz=Math.max(0,az),distance=Math.hypot(dx,dz);
  if(distance>6.0)continue;
  const vx=o.x-x,vz=o.z-z,length=Math.hypot(vx,vz)||1,towards=Math.max(0,(vx*nx+vz*nz)/length);
  const cover=height/(height+distance*2.4+.45),reach=Math.max(0,1-distance/6);
  shadeAmount=Math.max(shadeAmount,cover*reach*(.28*towards+.13*Math.max(0,ny)));
 }
 return Math.max(.52,1-shadeAmount);
}
function venetianBakeMasonry(b,start){
 const d=b.data,masses=venetianMasonryMasses();
 for(let i=start;i<d.length;i+=12){
  const material=d[i+9];if(material!==24&&material!==103&&material!==104)continue;
  if(material===24)d[i+9]=104;
  d[i+10]=venetianSkyExposure(d[i],d[i+1],d[i+2],d[i+3],d[i+4],d[i+5],masses);d[i+11]=0;
 }
}
