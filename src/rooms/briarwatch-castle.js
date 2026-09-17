'use strict';

// Native masonry and timber construction for Briarwatch. Openings are built
// from jambs, arch voussoirs and intrados, never a black rectangle on a solid wall.
function briarArchWall(b,w,h,d,opening,spring,c=BRIAR_COLORS.stone,trim=.18){
 const r=opening/2,pier=(w-opening)/2,n=16;
 if(!(w>opening&&h>=spring+r&&spring>=0))throw new Error('Invalid Briarwatch arch proportions.');
 for(const s of[-1,1])b.box(s*(r+pier/2),h/2,0,pier,h,d,c,4);
 for(let i=0;i<n;i++){
  const a=i*PI/n,q=(i+1)*PI/n,xa=r*Math.cos(a),xb=r*Math.cos(q),ya=spring+r*Math.sin(a),yb=spring+r*Math.sin(q);
  for(const z of[-d/2,d/2])b.quad([xa,ya,z],[xb,yb,z],[xb,h,z],[xa,h,z],shade(c,z>0?1:.88),4);
  b.quad([xa,ya,-d/2],[xa,ya,d/2],[xb,yb,d/2],[xb,yb,-d/2],shade(c,.80),4);
 }
 b.box(0,h-.025,0,opening,.05,d,c,4);
 if(trim>0)for(const z of[-d/2-.025,d/2+.025]){
  archRing(b,0,spring,z,r,r+trim,trim*.65,shade(c,1.10),n);
  for(const s of[-1,1])b.box(s*(r+trim/2),spring/2,z,trim,spring,trim*.65,shade(c,1.08),4);
 }
}
function briarArcadeBay(b,w,top,d,r,spring,base,c){
 b.push(0,base,0);briarArchWall(b,w,top-base,d,r*2,spring-base,c,.23);b.pop();
}
function briarArchedPane(b,w,spring,z,c='#788c87',mullion=true){
 const r=w/2;b.quad([-r,0,z],[r,0,z],[r,spring,z],[-r,spring,z],c,6);
 for(let i=0;i<12;i++){const a=i*PI/12,q=(i+1)*PI/12;b.tri([0,spring,z],[r*Math.cos(a),spring+r*Math.sin(a),z],[r*Math.cos(q),spring+r*Math.sin(q),z],c,6);}
 if(mullion){b.box(0,(spring+r)/2,z+.03,.065,spring+r,.075,'#b6aa88',4);b.box(0,spring*.65,z+.035,w,.065,.075,'#b6aa88',4);}
}
function briarWindowBay(b,w,h,d,opening=.9,sill=1.15,spring=1.12,c=BRIAR_COLORS.stone,glass=true){
 b.box(0,sill/2,0,w,sill,d,c,4);b.push(0,sill,0);briarArchWall(b,w,h-sill,d,opening,spring,c,.12);
 if(glass)briarArchedPane(b,opening,spring,-d*.34,'#758781',opening>1.0);
 b.box(0,-.05,d/2+.12,opening+.4,.16,d*.43,shade(c,1.1),4);b.pop();
}
function briarRoof(b,w,d,y,rise,c=BRIAR_COLORS.slate,gable=true){
 const rows=Math.max(7,Math.ceil(rise/.35)),cols=Math.ceil(d/.8);
 // Individual slate courses catch the light without a noisy texture overlay.
 for(const s of[-1,1])for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
  const a=j/rows,q=(j+1)/rows,z0=-d/2+i*d/cols,z1=-d/2+(i+1)*d/cols,x0=s*w*.5*(1-a),x1=s*w*.5*(1-q),y0=y+rise*a+.025,y1=y+rise*q+.025;
  b.quad([x0,y0,z0],[x0,y0,z1],[x1,y1,z1],[x1,y1,z0],shade(c,.89+.15*hash(i,j+s*17)),5);
 }
 for(const s of[-1,1]){
  const z=s*d/2;if(gable)b.tri([-w/2,y,z],[w/2,y,z],[0,y+rise,z],shade(c,.77),5);
  b.beam([-w/2,y,z],[0,y+rise,z],.07,'#7b7e70',4,5);b.beam([0,y+rise,z],[w/2,y,z],.07,'#7b7e70',4,5);
  b.box(s*w/2,y-.06,0,.12,.19,d,'#555d55',22);
 }
 b.box(0,y-.09,0,w,.16,d,shade(c,.76),22);
 for(let z=-d/2;z<d/2;z+=.7)b.cylinder(0,y+rise+.055,z+.35,.105,.105,Math.min(.7,d/2-z),shade(c,1.11),5,8,PI/2);
}
function briarConeRoof(b,r,y,h,c=BRIAR_COLORS.slate){
 const rows=10,n=24;
 for(let j=0;j<rows;j++)for(let i=0;i<n;i++){
  const a=i*TAU/n,q=(i+1)*TAU/n,r0=r*(1-j/rows)+.045,r1=r*(1-(j+1)/rows)+.045,y0=y+h*j/rows,y1=y+h*(j+1)/rows;
  b.quad([Math.sin(a)*r0,y0,Math.cos(a)*r0],[Math.sin(q)*r0,y0,Math.cos(q)*r0],[Math.sin(q)*r1,y1,Math.cos(q)*r1],[Math.sin(a)*r1,y1,Math.cos(a)*r1],shade(c,.90+.14*hash(i,j)),5);
 }
 b.cylinder(0,y-.07,0,r+.04,r+.04,.16,'#70766c',4,n);
 b.beam([0,y+h-.06,0],[0,y+h+.65,0],.045,'#afa17c',41,6);b.sphere(0,y+h+.24,0,.12,.15,.12,'#b8a370',41,8,5);
}
function briarCornice(b,w,d,y,c=BRIAR_COLORS.light){
 for(const [ww,dd,yy,hh]of[[w,d,y,.23],[w+.25,d+.25,y+.18,.13],[w+.12,d+.12,y+.32,.10]]){
  b.box(0,yy,dd/2,ww,hh,.25,c,4);b.box(0,yy,-dd/2,ww,hh,.25,c,4);b.box(ww/2,yy,0,.25,hh,dd,c,4);b.box(-ww/2,yy,0,.25,hh,dd,c,4);
 }
}
function briarButtress(b,x,y,z,h,angle=0){
 b.push(x,y,z,0,angle);
 for(let i=0;i<3;i++){
  const base=i*h/3,top=(i+1)*h/3,projection=1.4-i*.28,width=1.15-i*.16;
  b.box(0,(base+top)/2,projection/2,width,top-base,projection,'#a49f8b',4);
  b.quad([-width*.55,top-.02,projection+.08],[width*.55,top-.02,projection+.08],[width*.55,top+.36,.1],[-width*.55,top+.36,.1],'#c1b69a',4);
 }
 b.box(0,.1,.7,1.5,.3,1.65,'#8a8a7b',4);b.pop();
}
function briarLantern(b,x,y,z,s=.42){
 b.box(x,y+s*.07,z,s*.67,s*.90,s*.62,'#d7ba7c',10);
 for(const xx of[-1,1])for(const zz of[-1,1])b.beam([x+xx*s*.37,y-s*.44,z+zz*s*.35],[x+xx*s*.37,y+s*.56,z+zz*s*.35],s*.043,'#4b4b3c',42,4);
 b.cylinder(x,y+s*.68,z,s*.60,s*.08,s*.34,'#625d44',42,4);b.box(x,y-s*.48,z,s*.83,s*.10,s*.83,'#544e3a',42);
 b.beam([x,y+s*.77,z],[x,y+s*1.12,z],s*.04,'#4e4c3b',42,5);
}
function briarFlag(b,x,y,z,h=4,angle=0){
 b.push(x,y,z,0,angle);b.beam([0,-h*.7,0],[0,h*.3,0],.043,'#8c805f',41,6);b.sphere(0,h*.34,0,.11,.14,.11,'#bca576',41,8,5);
 const nx=9,ny=5,w=h*.61,hh=h*.58;
 const pt=(i,j)=>{const u=i/nx,v=j/ny;return [u*w,-v*hh+.2,.16*Math.sin(u*7.5-v*.8)*u];};
 for(let j=0;j<ny;j++)for(let i=0;i<nx;i++)b.quad(pt(i,j),pt(i+1,j),pt(i+1,j+1),pt(i,j+1),i===0||j===0?'#bda166':'#873e3e',8);
 b.pop();
}
function briarRoundTower(b,x,z,r,height,{roof='flat',floor=BRIAR.court,windows=true}={}){
 const foot=Math.min(...Array.from({length:12},(_,i)=>briarSurface(x+Math.sin(i*TAU/12)*(r+.42),z+Math.cos(i*TAU/12)*(r+.42))))-.18;
 b.cylinder(x,(foot+floor)/2,z,r+.57,r+.40,Math.max(.15,floor-foot),'#888d80',4,12);
 b.push(x,floor,z);const n=12,ap=r*Math.cos(PI/n),side=2*r*Math.sin(PI/n),low=2.3;
 b.cylinder(0,.55,0,r+.42,r+.16,1.1,'#929383',4,n);b.cylinder(0,(low+1.1)/2,0,r,r,low-1.1,'#a09e8b',4,n);
 const levels=Math.max(1,Math.round((height-low)/4.5)),levelH=(height-low)/levels;
 for(let j=0;j<levels;j++)for(let i=0;i<n;i++){
  const a=i*TAU/n;b.push(Math.sin(a)*ap,low+j*levelH,Math.cos(a)*ap,0,a);
  if(windows&&(i+j)%3===0)briarWindowBay(b,side+.035,levelH,.64,Math.min(.65,side*.44),.9,1.02,j===levels-1?'#b3ad97':'#aaa58f');
  else b.box(0,levelH/2,0,side+.035,levelH,.64,j===levels-1?'#b1ab95':'#a5a18d',4);
  b.pop();
 }
 for(const y of[low,height-.65,height])b.cylinder(0,y,0,r+.14,r+.14,.19,'#c1b79d',4,n);
 b.cylinder(0,height-.17,0,r,r,.25,'#8c8a75',9,n);
 if(roof==='flat'){
  for(let i=0;i<n;i++){
   const a=i*TAU/n;b.push(Math.sin(a)*(ap+.1),height,Math.cos(a)*(ap+.1),0,a);
   b.box(0,.33,0,side+.05,.64,.48,'#bab29a',4);b.box(0,.91,0,side*.57,.58,.55,'#bfb59c',4);
   b.box(0,-.36,.2,.30,.7,.40,'#aaa18b',4);b.pop();
  }
 }else briarConeRoof(b,r+.47,height+.15,roof==='tall'?5.1:3.3);
 b.pop();
}
function briarCurtain(b,a,q,top=18.3){
 const dx=q[0]-a[0],dz=q[1]-a[1],length=Math.hypot(dx,dz),angle=-Math.atan2(dz,dx),base=BRIAR.court;
 b.push((a[0]+q[0])/2,0,(a[1]+q[1])/2,0,angle);
 // Foundations descend to the lower actual terrain at every bay.
 const n=Math.ceil(length/2.4);
 for(let i=0;i<n;i++){
  const t=(i+.5)/n,x=mix(a[0],q[0],t),z=mix(a[1],q[1],t),ground=Math.min(briarSurface(x,z)-.14,base-.25),ww=length/n+.02;
  b.box(-length/2+(i+.5)*length/n,(ground+top-.45)/2,0,ww,top-.45-ground,1.12,'#a09f8c',4);
 }
 b.box(0,top-.35,0,length,.28,1.52,'#c0b69a',4);
 b.box(0,top+.05,.46,length,.60,.42,'#b1a991',4);
 b.box(0,top-.26,-.52,length,.36,.30,'#b6ad96',4);
 for(let x=-length/2+.65;x<length/2;x+=1.55){b.box(x,top+.66,.46,.83,.68,.52,'#bdb39b',4);b.box(x,top-1.08,.63,.28,1.04,.38,'#969581',4);}
 b.pop();
}
function briarKeep(b){
 const x=-28,z=-20,y=BRIAR.court,w=11.8,d=12.6,height=20.3;
 b.push(x,y,z);b.box(0,-.35,0,w+1.3,.75,d+1.3,'#878d80',4);
 b.box(0,1.6,0,w+1.0,3.2,d+1.0,'#929587',4);
 // Three different storeys, with window proportions changing as the keep rises.
 for(const [yy,hh,sill,opening,spring]of[[3.2,5.5,1.1,.72,1.40],[8.7,5.9,1.55,1.28,1.40],[14.6,5.7,1.35,1.50,1.40]]){
  for(const [px,pz,angle,width]of[[0,d/2,0,w],[0,-d/2,PI,w],[w/2,0,PI/2,d],[-w/2,0,-PI/2,d]]){
   b.push(px,yy,pz,0,angle);
   for(let i=0;i<3;i++){b.push((i-1)*width/3,0,0);if(yy===3.2&&angle===0&&i===1)briarArchWall(b,width/3+.01,hh,1.05,1.9,2.5,'#a29e89',.15);else briarWindowBay(b,width/3+.01,hh,1.05,opening,sill,spring);b.pop();}
   b.pop();
  }
  briarCornice(b,w+.05,d+.05,yy+hh-.24,yy<9?'#aca892':'#c1b69b');
  b.box(0,yy-.13,0,w-1,.23,d-1,'#77694f',22);
 }
 for(const side of[-1,1]){
  briarButtress(b,side*(w/2+.02),0,-3.1,10.2,side*PI/2);
  briarButtress(b,side*(w/2+.02),0,4.5,8.8,side*PI/2);
 }
 // Quoins and a restrained repaired patch articulate the corners.
 for(const xx of[-w/2,w/2])for(const zz of[-d/2,d/2])for(let j=0;j<27;j++){
  const yy=1+j*.70;b.box(xx,yy,zz,j%2?.51:.91,.25,j%2?.91:.51,j%6===0?'#a9aa95':'#c0b79f',4);
 }
 b.box(0,height+.05,0,w+.9,.40,d+.9,'#b7ad94',4);
 for(const zz of[-d/2-.18,d/2+.18])for(let xx=-w/2;xx<=w/2;xx+=1.48)b.box(xx,height+.86,zz,.78,1.22,.62,'#b8ae96',4);
 for(const xx of[-w/2-.18,w/2+.18])for(let zz=-d/2+1;zz<d/2;zz+=1.47)b.box(xx,height+.86,zz,.62,1.22,.78,'#b8ae96',4);
 briarRoof(b,w-.65,d-.65,height+.55,4.6,'#47555c');
 // A small lead-roofed dormer breaks the long southern slope.
 b.push(0,height+2.55,3.9);b.box(0,.45,0,1.55,.9,1.25,'#a59f89',4);briarArchedPane(b,.70,.42,.65,'#6d817a');briarRoof(b,1.9,1.7,.90,.85,'#526068');b.pop();
 briarFlag(b,-3.8,height+2.3,4.1,3.7,-.2);b.pop();
 // The attached stair turret is the one slender vertical accent.
 briarRoundTower(b,-21.9,-25.0,2.15,24.2,{roof:'tall'});
 b.push(-21.9,37.5,-25);b.beam([0,4.9,0],[0,6.1,0],.035,'#aca079',41,5);b.beam([-.65,5.7,0],[.65,5.7,0],.032,'#aca079',41,5);b.pop();
 // Exterior stair reaches a projecting vestibule rather than a painted door.
 b.box(-28,BRIAR.court+1.62,-12.40,2.4,3.24,1.85,'#a8a18b',4);
 b.push(-28,BRIAR.court+3.25,-12.85);briarArchWall(b,3.8,5.6,2.0,1.75,2.3,'#a29e89',.17);briarRoof(b,4.2,2.4,5.6,1.5,'#5a6266');b.pop();
 for(let i=0;i<13;i++){const zz=-6.2-i*.44,h=(i+1)*.25;b.box(-28,BRIAR.court+h/2,zz,2.4,h,.45,'#b8af98',4);}
 for(const s of[-1,1])for(let i=0;i<13;i++){const zz=-6.2-i*.44,h=(i+1)*.25;b.box(-28+s*1.3,BRIAR.court+h+.20,zz,.28,.53,.46,'#a8a28c',4);}
}
function briarGatehouse(b){
 const y=BRIAR.court;
 briarRoundTower(b,-28.4,4.7,3.03,11.3,{roof:'flat'});
 briarRoundTower(b,-19.6,4.7,2.87,12.3,{roof:'cone'});
 b.push(-24,y,4.7);
 for(const z of[-2.45,2.45]){b.push(0,0,z);briarArchWall(b,5.4,8.45,.9,3.7,3.1,'#b4aa91',.27);b.pop();}
 // Vaulted passage and deep stone sidewalls.
 for(const s of[-1,1])b.box(s*2.31,3.6,0,.90,7.2,4.9,'#8f8c7a',4);
 for(let j=0;j<5;j++)archRing(b,0,3.1,-2.0+j,1.85,2.16,.20,'#a6a08a',16);
 b.box(0,7.85,0,5.4,1.2,5.8,'#b4aa91',4);
 b.push(0,8.45,0);briarRoof(b,6.1,6.5,0,2.6,'#596368');b.pop();
 // A raised portcullis remains visible without blocking the approach.
 for(let x=-1.6;x<=1.61;x+=.32)b.box(x,5.75,1.98,.055,3.4,.08,'#554f3c',42);
 for(const yy of[4.2,4.9,5.6,6.3,7.0])b.box(0,yy,1.98,3.4,.07,.09,'#554f3c',42);
 for(const s of[-1,1]){
  b.push(s*1.88,0,1.5,0,s*1.26);
  for(let i=0;i<8;i++)b.box(-s*(i+.5)*.225,1.9,0,.216,3.8,.16,i%3?'#746044':'#8a7050',22);
  for(const yy of[.7,2.1,3.2]){b.box(-s*.91,yy,.11,1.82,.10,.10,'#45473a',42);for(let i=0;i<4;i++)b.sphere(-s*(.18+i*.46),yy,.17,.035,.035,.02,'#b2a783',41,5,3);}
  b.pop();briarLantern(b,s*3.2,5.5,3.0,.60);
 }
 // Limestone shield and a carved chevron are geometry, not a raster decal.
 b.box(0,6.9,3.03,.9,1.1,.13,'#c9bda0',4);b.tri([-.46,6.35,3.1],[.46,6.35,3.1],[0,5.95,3.1],'#c9bda0',4);
 b.beam([-.27,6.62,3.18],[0,6.91,3.18],.065,'#8f4540',23,4);b.beam([0,6.91,3.18],[.27,6.62,3.18],.065,'#8f4540',23,4);
 b.pop();
}
function briarHall(b){
 const x=-8.1,z=-10.5,y=BRIAR.court,w=8.8,d=19.0,lower=4.2,upper=6.0;
 const footing=Math.min(...[-1,1].flatMap(a=>[-1,1].map(q=>briarSurface(x+a*(w+.7)/2,z+q*(d+.7)/2))))-.12;
 b.box(x,(footing+y)/2,z,w+.7,y-footing,d+.7,'#858c7e',4);b.push(x,y,z);
 b.box(0,.28,0,w+.7,.56,d+.7,'#939382',4);
 for(const s of[-1,1]){
  b.push(s*w/2,0,0,0,s*PI/2);
  for(let i=0;i<5;i++){
   b.push((i-2)*d/5,0,0);briarWindowBay(b,d/5+.01,lower,.85,.76,1.1,.9,'#9e9d88');
   b.push(0,lower,0);if(s===1&&i===2)briarArchWall(b,d/5+.01,upper,.75,1.75,2.8,'#b7ad96',.16);else briarWindowBay(b,d/5+.01,upper,.75,1.80,1.15,2.5,'#b7ad96');b.pop();b.pop();
  }b.pop();
 }
 for(const s of[-1,1]){
  b.push(0,0,s*d/2,0,s<0?PI:0);briarArchWall(b,w,lower,.85,1.9,1.8,'#a8a18b',.17);
  b.push(0,lower,0);for(const i of[-1,0,1]){b.push(i*w/3,0,0);briarWindowBay(b,w/3+.01,upper,.85,i===0?1.42:1.08,1.4,1.9,'#b7ad96');b.pop();}b.pop();b.pop();
 }
 b.box(0,lower-.18,0,w-.7,.34,d-.7,'#847051',22);
 for(const yy of[lower,lower+upper-.18])briarCornice(b,w+.2,d+.2,yy);
 briarRoof(b,w+1.3,d+1.3,lower+upper+.20,5.2,'#52616a');
 for(const zz of[-6.7,5.7]){
  b.box(-2.8,12.3,zz,1.12,5.0,1.5,'#a39d88',4);b.box(-2.8,14.84,zz,1.48,.28,1.84,'#c2b79a',4);b.box(-2.8,15.06,zz,1.14,.16,1.48,'#726c57',4);
  for(const dz of[-.39,.39])b.cylinder(-2.8,15.52,zz+dz,.23,.25,.8,'#977e60',4,8);
 }
 // Visible great-hall furniture: long tables, high-backed seats and a hearth.
 for(const zz of[-4.4,3.3]){
  b.box(0,lower+1.18,zz,2.1,.17,5.0,'#8a6d44',22);
  for(const xx of[-.7,.7])for(const dz of[-1.8,1.8])b.box(xx,lower+.57,zz+dz,.16,1.13,.16,'#705a3d',22);
  for(const xx of[-1.5,1.5]){b.box(xx,lower+.62,zz,.48,.12,4.7,'#856841',22);for(const dz of[-1.8,1.8])b.box(xx,lower+.30,zz+dz,.16,.6,.28,'#705a3d',22);}
  for(let j=-1;j<=1;j++){b.cylinder(0,lower+1.32,zz+j*1.35,.24,.24,.045,'#b8a37c',41,12);b.cylinder(.48,lower+1.40,zz+j*1.35,.075,.065,.24,'#897555',41,8);}
 }
 b.box(0,lower+.02,-7.6,5.5,.06,2.9,'#8e4b43',23);b.box(-3.62,lower+1.2,-3.5,.50,2.4,3.1,'#8b8773',4);
 b.pop();
 // The projecting oak river gallery is open, braced, and roofed separately.
 const gx=-2.75,gy=y+lower+.08;
 for(let i=0;i<28;i++)b.box(gx,gy,-19.0+i*.62,2.3,.16,.60,i%4?'#907550':'#a1875c',22);
 for(const zz of[-18.5,-15.0,-11.5,-8,-4.5,-1.5]){
  b.beam([-4.1,y+1.7,zz],[-1.6,gy-.1,zz],.15,'#735f42',22,6);b.beam([-4.15,gy-.15,zz],[-1.5,gy-.15,zz],.16,'#8c704b',22,4);
  b.beam([-1.65,gy,zz],[-1.65,gy+3.0,zz],.075,'#786145',22,6);
  b.beam([-1.65,gy+2.3,zz],[-1.65,gy+3,zz+.62],.061,'#8e714a',22,5);
 }
 for(let zz=-19;zz<-1.6;zz+=.44)b.box(-1.62,gy+.6,zz,.065,1.05,.075,'#8b704a',22);
 b.beam([-1.62,gy+1.16,-19.2],[-1.62,gy+1.16,-1.2],.07,'#a08658',22,5);
 b.push(gx,gy+3.15,-10.3);briarRoof(b,3.0,19.0,0,1.3,'#4f6066');b.pop();
 for(const zz of[-16,-5])briarLantern(b,-1.75,gy+2.22,zz,.40);
}
function briarChapel(b){
 const y=BRIAR.court;b.push(-15.7,y,-24.5);b.box(0,-.31,0,6.8,.70,10.3,'#929583',4);
 for(const s of[-1,1]){
  b.push(s*3.0,0,0,0,s*PI/2);for(const i of[-1,0,1]){b.push(i*3.2,0,0);briarWindowBay(b,3.21,6.6,.70,1.15,1.85,2.7,'#b8b19b');b.pop();}b.pop();
 }
 b.push(0,0,4.8);briarArchWall(b,6.3,6.6,.8,1.9,2.0,'#c0b69d',.19);b.pop();
 b.box(0,3.3,-4.8,6.3,6.6,.75,'#aaa691',4);
 briarRoof(b,7.0,10.5,6.7,4.4,'#626c70');
 for(const s of[-1,1])for(const zz of[-3.1,2.7])briarButtress(b,s*3.07,0,zz,4.8,s*PI/2);
 // Bellcote with an open arch and suspended bronze bell.
 b.push(0,9.1,3.8);briarArchWall(b,2.6,3.4,.85,1.25,1.7,'#bdb299',.14);briarRoof(b,3.1,1.5,3.4,1.3,'#657076');
 b.cylinder(0,1.51,0,.46,.22,.70,'#ad9868',41,16);b.beam([0,1.9,0],[0,2.5,0],.044,'#696347',42,6);b.pop();
 // Pews are visible through the genuine side openings.
 for(let zz=-3;zz<3.5;zz+=1.25)for(const xx of[-1.45,1.45]){b.box(xx,.62,zz,1.55,.12,.55,'#7f6848',22);b.box(xx,1.06,zz-.24,1.55,.87,.12,'#7f6848',22);}
 b.pop();
}
function briarWell(b,x,y,z){
 b.push(x,y,z);const n=18,r=.90,R=1.19;
 for(let j=0;j<3;j++)for(let i=0;i<n;i++){
  const a=(i+j*.5)*TAU/n,q=a+TAU/n,pt=(rr,yy,t)=>[Math.sin(t)*rr,yy,Math.cos(t)*rr],c=(i+j)%4?'#b2ac93':'#c0b69b';
  b.quad(pt(R,j*.30,a),pt(R,j*.30,q),pt(R,(j+1)*.30,q),pt(R,(j+1)*.30,a),c,4);
  b.quad(pt(r,j*.30,q),pt(r,j*.30,a),pt(r,(j+1)*.30,a),pt(r,(j+1)*.30,q),shade(c,.74),4);
  if(j===2)b.quad(pt(r,.90,a),pt(R,.90,a),pt(R,.90,q),pt(r,.90,q),'#c9bea0',4);
 }
 b.cylinder(0,.05,0,.88,.88,.02,'#3c4b43',7,n);
 for(const s of[-1,1])b.box(s*1.25,1.55,0,.17,3.1,.17,'#866b47',22);
 b.beam([-1.30,2.52,0],[1.30,2.52,0],.075,'#69573c',22,8);b.beam([0,2.52,0],[0,.53,0],.02,'#b29b6a',23,5);
 b.cylinder(0,.68,0,.22,.27,.42,'#9e8356',22,12);briarRoof(b,3.3,2.9,3.0,.98,'#606b6b');b.pop();
}
function briarCourtyard(b){
 const y=BRIAR.court;b.box(-23.2,y-.17,-5.8,19.4,.30,20.4,'#8d8b76',9);
 for(let i=0;i<28;i++)for(let j=0;j<29;j++){
  const x=-32.55+i*.67,z=-15.7+j*.67,h=y+.015+hash(i,j)*.013;
  b.quad([x,h,z],[x+.625,h,z],[x+.625,h,z+.625],[x,h,z+.625],['#b5ae96','#bdb49a','#a7a58e','#c1b99f'][(i*7+j*3)%4],9);
 }
 briarWell(b,-21.1,y,-5.3);
 // Kitchen wing: stone lower storey, louvered smoke hood, low uneven roof.
 b.push(-33,y,-3.2);b.box(0,-.32,0,5.9,.74,9.4,'#8b8c7c',4);b.box(0,2.1,0,5.5,4.2,9.0,'#b0a58c',4);
 for(const zz of[-2.6,1.8]){b.push(2.78,0,zz,0,PI/2);briarWindowBay(b,2.7,4.2,.5,.84,1.0,1.15,'#b0a58c');b.pop();}
 briarRoof(b,6.3,9.8,4.2,2.8,'#6b7066');b.box(-1.4,5.7,1.2,1.1,5.2,1.15,'#a99a7c',4);b.box(-1.4,8.33,1.2,1.4,.25,1.45,'#b9aa8b',4);
 for(const s of[-1,1])b.box(s*1.5,.45,5.2,1.3,.9,1.05,'#8f7853',22);b.pop();
 // Open arcade along the hall side; its roof shelters the connected path.
 for(let i=0;i<5;i++){
  const zz=-13.6+i*3.4;b.push(-14.3,y,zz,0,PI/2);briarArchWall(b,3.4,3.8,.50,2.4,2.1,'#b8ac90',.13);b.pop();
 }
 b.push(-13.5,y+3.86,-6.8);briarRoof(b,3.15,17.8,0,1.02,'#65716d');b.pop();
 // A raised herb garden with purposeful rows, separated from the main entry.
 b.box(-18.0,y+.10,-12,3.0,.20,3.5,'#73694c',9);
 for(const xx of[-19.55,-16.45])b.box(xx,y+.25,-12,.18,.46,3.85,'#a19a80',4);
 for(const zz of[-13.85,-10.15])b.box(-18,y+.25,zz,3.3,.46,.18,'#a19a80',4);
 for(let i=0;i<4;i++)for(let j=0;j<4;j++)b.sphere(-18.95+i*.61,y+.37,-13.15+j*.73,.22,.18,.22,j%2?'#6d8a61':'#93996b',8,6,4,true);
 // Timber stock and repair stones form one composed maintenance scene.
 for(let i=0;i<8;i++)b.cylinder(-31.2+(i%4)*.29,y+.18+Math.floor(i/4)*.27,1.1,.15,.15,1.4,'#8b7854',22,7,PI/2);
 for(let i=0;i<5;i++)b.box(-17.2+(i%3)*.5,y+.15+Math.floor(i/3)*.27,2.1,.46,.27,.61,'#b9ae92',4);
 briarLantern(b,-26.7,y+3.15,-.4,.46);
}
function briarCastle(b){
 // An irregular ring has an intentionally open southern gate, not a square kit.
 const walls=[[[-38,-23],[-32,-29],19.0],[[-32,-29],[-22,-30],19.5],[[-22,-30],[-11,-29],18.7],[[-11,-29],[-4,-23],18.5],[[-4,-23],[-2,-8],18.2],[[-2,-8],[-5,3.5],17.6],[[-5,3.5],[-17,5.0],17.5],[[-31,5.0],[-37,2.5],17.6],[[-37,2.5],[-40,-10],18.2],[[-40,-10],[-38,-23],18.8]];
 for(const [a,q,top]of walls)briarCurtain(b,a,q,top);
 briarRoundTower(b,-38.7,-10,2.7,9.0,{roof:'flat'});
 briarRoundTower(b,-5.1,2.3,3.35,7.3,{roof:'flat'});
 briarRoundTower(b,-10.5,-29,2.15,9.7,{roof:'cone'});
 briarCourtyard(b);briarKeep(b);briarGatehouse(b);briarHall(b);briarChapel(b);
 // Service postern, store room and stepped access on the otherwise quiet rear.
 b.push(-35,BRIAR.court,-25,0,-.65);briarArchWall(b,4.5,4.0,.9,1.5,1.35,'#a19f87',.15);briarRoof(b,5,4,4,1.9,'#64706b');b.pop();
 for(let i=0;i<9;i++){const x=-39.8-i*.38,z=-18.2,h=BRIAR.court-i*.22,g=briarSurface(x,z);b.box(x,(h+g)/2,z,.40,Math.max(.15,h-g),1.35,'#ada68b',4);}
 briarFlag(b,-5.1,20.8,2.3,3.8,.7);
}
