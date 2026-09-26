'use strict';

// Original modelmaking for the Venetian Salon. All detail is native geometry.
function venetianArch(b,x,y,z,r,rise,thick,depth,color){
 const n=14;
 for(let i=0;i<n;i++){
  const a=i*PI/n,q=(i+1)*PI/n,p=(t,R,H,d)=>[x+Math.cos(t)*R,y+Math.sin(t)*H,z+d];
  for(const d of[-depth/2,depth/2])b.quad(p(a,r,rise,d),p(q,r,rise,d),p(q,r+thick,rise+thick,d),p(a,r+thick,rise+thick,d),shade(color,i%2?1:.96),24);
  b.quad(p(a,r,rise,-depth/2),p(a,r,rise,depth/2),p(q,r,rise,depth/2),p(q,r,rise,-depth/2),color,24);
 }
}
function venetianWindow(b,x,y,z,w,h,balcony=false,lit=true){
 const C=VENETIAN_COLORS,r=w/2,spring=y+h/2-r;
 b.box(x,y-r*.28,z-.075,w,h-r*.5,.12,'#345052',0);
 b.quad([x-r,y-h/2,z],[x+r,y-h/2,z],[x+r,spring,z],[x-r,spring,z],lit?'#dbc398':'#527a77',lit?6:43,[0,0,1]);
 for(let i=0;i<12;i++){const a=i*PI/12,q=(i+1)*PI/12;b.tri([x,spring,z],[x+r*Math.cos(a),spring+r*Math.sin(a),z],[x+r*Math.cos(q),spring+r*Math.sin(q),z],lit?'#e7cea1':'#527a77',lit?6:43);}
 venetianArch(b,x,spring,z+.055,r,r,.10,.14,C.stone);
 for(const side of[-1,1])b.box(x+side*(r+.07),y-r/2,z+.08,.12,h-r,.20,C.stone,24);
 b.box(x,y-.12,z+.095,.067,h-.18,.08,C.stone,24);b.box(x,spring-.07,z+.09,w,.06,.07,C.stone,24);
 b.box(x,y-h/2-.07,z+.12,w+.30,.17,.35,C.stone,24);
 if(balcony){
  b.box(x,y-h/2-.13,z+.52,w+.6,.17,1.18,C.stone,24);
  for(const side of[-1,1])b.beam([x+side*r,y-h/2-.70,z],[x+side*r,y-h/2-.18,z+.8],.085,C.stone,24,6);
  for(let k=0;k<=6;k++)b.cylinder(x-(w+.4)/2+k*(w+.4)/6,y-h/2+.26,z+1.02,.035,.05,.68,C.ink,41,6);
  b.beam([x-(w+.5)/2,y-h/2+.62,z+1.02],[x+(w+.5)/2,y-h/2+.62,z+1.02],.054,C.ink,41,6);
 }
}
function venetianFlowers(b,x,y,z,w=1.6){
 b.box(x,y,z,w,.24,.38,'#a26652',24);
 for(let i=0;i<7;i++){const xx=x-w*.43+i*w*.86/6,h=.15+hash(i,x)*.14;b.sphere(xx,y+h,z,.19,.18,.23,i%3?'#6d8765':'#497f69',8,6,3);b.sphere(xx,y+h+.12,z+.08,.13,.10,.12,i%2?'#d59b9b':'#e4c6a6',0,6,3);}
}
function venetianPalazzo(b,{x,z,w=8,d=6,h=9,color='#ce9a88',angle=0,variant=0}){
 const C=VENETIAN_COLORS;
 b.push(x,VENETIAN.quay,z,0,angle);
 b.box(0,.25,0,w+.25,.5,d+.2,C.shadow,24);b.box(0,h/2+.45,0,w,h,d,color,20);
 for(const y of[.7,3.1,h+.35,h+.70])b.box(0,y,0,w+.36,.18,d+.34,C.stone,24);
 for(const side of[-1,1]){
  for(let i=0;i<Math.floor(h/.65);i++)b.box(side*(w/2-.19),.9+i*.65,d/2+.08,.41,.30,.19,shade(C.stone,i%2?.94:1),24);
 }
 const bays=w>8?3:2;
 for(let i=0;i<bays;i++){
  const xx=(i-(bays-1)/2)*(w/(bays+.25));
  venetianWindow(b,xx,1.85,d/2+.09,1.35,2.2,false,i%2===0);
  venetianWindow(b,xx,4.65,d/2+.11,1.18,2.0,true,(i+variant)%3!==0);
  if(h>8)venetianWindow(b,xx,7.45,d/2+.11,1.18,1.78,false,(i+variant)%2===0);
  for(const side of[-1,1]){
   b.push(xx+side*.9,4.7,d/2+.22,0,side*.13);b.box(0,0,0,.45,1.9,.12,['#618d7c','#577b7a','#8b9987'][variant%3],22);
   for(let j=0;j<7;j++)b.box(0,-.76+j*.25,.065,.38,.044,.02,'#335d58',22);b.pop();
  }
  if(i%2===0)venetianFlowers(b,xx,3.76,d/2+1.04,1.55);
 }
 // Side windows are recessed, too: orbiting does not reveal a blank cardboard facade.
 for(const side of[-1,1]){
  b.push(side*(w/2+.03),0,0,0,side*PI/2);
  for(const zz of[-1.6,1.6])for(const yy of[4.6,...(h>8?[7.4]:[])])venetianWindow(b,zz,yy,0,.95,1.7,false,false);b.pop();
 }
 gable(b,w+.35,d+.3,h+.86,1.25,C.roof);
 for(const xx of[-w*.31,w*.31]){b.box(xx,h+1.3,-.7,.55,1.1,.6,C.brick,4);b.box(xx,h+1.92,-.7,.78,.17,.82,C.stone,24);}
 if(variant%2===0){
  b.box(0,2.86,d/2+.36,w*.78,.53,.10,C.ink,22);hudsonText(b,['PALAZZO LUNA','CASA DEL MARE','AL VENTO'][variant%3],0,2.82,d/2+.42,w*.68,C.stone);
 }
 b.pop();
}
function venetianDome(b,x,y,z,r,h){
 const C=VENETIAN_COLORS;
 b.cylinder(x,y+.36,z,r*.97,r*.97,.72,C.stone,24,24);
 const point=(a,t)=>[x+r*Math.cos(t)*Math.cos(a),y+.7+h*Math.sin(t),z+r*Math.cos(t)*Math.sin(a)];
 for(let i=0;i<28;i++)for(let j=0;j<9;j++){
  const a=i*TAU/28,q=(i+1)*TAU/28,t=j*PI/18,u=(j+1)*PI/18;
  b.quad(point(a,t),point(q,t),point(q,u),point(a,u),shade(C.green,i%2?.94:1.05),41);
 }
 for(let i=0;i<14;i++)for(let j=0;j<10;j++){const a=i*TAU/14;b.beam(point(a,j*PI/20),point(a,(j+1)*PI/20),.035,'#9eb5a0',41,5);}
 b.cylinder(x,y+h+1.0,z,.22,.16,.72,C.gold,41,10);b.sphere(x,y+h+1.5,z,.21,.21,.21,C.gold,41,10,6);
 b.beam([x,y+h+1.5,z],[x,y+h+2.25,z],.037,C.gold,41,6);b.beam([x-.23,y+h+1.99,z],[x+.23,y+h+1.99,z],.037,C.gold,41,6);
}
function venetianBasilica(b){
 const C=VENETIAN_COLORS;
 b.push(17.8,1.2,-25.2);
 b.box(0,.15,0,21,.3,14.2,C.stone,24);b.box(0,3.45,0,18,6.4,11.4,'#d6c3a2',24);
 b.box(0,6.6,0,18.7,.32,12.1,C.gold,41);
 for(const xx of[-6,0,6]){
  // Dark set-back portal and its two nested archivolts, not flat painted doors.
  b.box(xx,2.6,5.79,3.6,4.7,.12,C.ink,0);
  venetianWindow(b,xx,2.6,5.89,3.3,4.6,false,false);
  venetianArch(b,xx,3.25,6.04,1.85,2.12,.23,.5,C.stone);
  for(const side of[-1,1]){
   b.cylinder(xx+side*2.15,1.8,6.06,.16,.16,3.4,'#b7a990',24,10);b.cylinder(xx+side*2.15,3.58,6.06,.26,.26,.25,C.gold,41,10);
   b.cylinder(xx+side*2.52,1.8,6.08,.15,.15,3.4,C.stone,24,10);b.cylinder(xx+side*2.52,3.58,6.08,.24,.24,.25,C.gold,41,10);
  }
  // Curved gables and gold mosaic tympana make a distinct Venetian silhouette.
  for(let i=0;i<20;i++){const a=i*PI/20,q=(i+1)*PI/20;b.tri([xx,6.73,5.9],[xx+2.9*Math.cos(a),6.73+2.55*Math.sin(a),5.9],[xx+2.9*Math.cos(q),6.73+2.55*Math.sin(q),5.9],i%2?'#bea374':'#c6b182',24);}
  venetianArch(b,xx,6.73,6.03,2.87,2.55,.17,.28,C.stone);
  b.cylinder(xx,7.56,6.10,.68,.68,.05,C.gold,41,20,PI/2);
  b.cylinder(xx,7.56,6.15,.49,.49,.05,'#799e97',43,18,PI/2);
  for(let k=0;k<8;k++){const a=k*TAU/8;b.beam([xx,7.56,6.19],[xx+.48*Math.cos(a),7.56+.48*Math.sin(a),6.19],.037,C.stone,24,6);}
 }
 for(let i=0;i<=14;i++){const x=-8.7+i*1.24;b.cylinder(x,6.16,6.2,.055,.055,.64,C.stone,24,6);}
 b.box(0,6.54,6.2,18.2,.13,.20,C.stone,24);
 for(const [x,z,r,h]of[[-5.8,-2,2.9,2.5],[5.8,-2,2.9,2.5],[-5.8,3,2.65,2.25],[5.8,3,2.65,2.25],[0,-.2,3.65,4.15]])venetianDome(b,x,7.1,z,r,h);
 for(let i=0;i<3;i++)b.box(0,.10+i*.10,7.2-i*.32,20-i*.5,.2,.7,C.stone,24);
 b.pop();
}
function venetianCampanile(b){
 const C=VENETIAN_COLORS;
 b.push(37,1.2,-25);
 b.box(0,.24,0,5.5,.48,5.5,C.stone,24);b.box(0,9.3,0,4.1,18.2,4.1,'#b67e65',4);
 for(const y of[1,4,8,12,16,18.4])b.box(0,y,0,4.32,.16,4.32,C.stone,24);
 for(const side of[-1,1])for(const z of[-1.84,1.84])b.box(side*1.84,9.3,z,.3,18.1,.3,'#ccb091',24);
 for(let i=0;i<4;i++){
  b.push(0,0,0,0,i*PI/2);
  b.box(0,12.5,2.07,.54,2.4,.06,'#506463',0);venetianWindow(b,0,5.6,2.10,.58,1.5,false,false);
  b.cylinder(0,16.2,2.10,.90,.90,.10,C.stone,24,24,PI/2);
  b.cylinder(0,16.2,2.17,.75,.75,.055,'#477270',41,24,PI/2);
  for(let k=0;k<12;k++){const a=k*TAU/12;b.beam([Math.sin(a)*.6,16.2+Math.cos(a)*.6,2.205],[Math.sin(a)*.68,16.2+Math.cos(a)*.68,2.205],.022,C.gold,41,5);}
  b.beam([0,16.2,2.23],[.35,16.43,2.23],.036,C.gold,41,6);b.beam([0,16.2,2.24],[-.05,16.79,2.24],.028,C.gold,41,6);
  // Belfry is open on all four sides and contains a modeled swinging bell.
  for(const x of[-1.87,1.87])b.box(x,20.0,1.87,.38,2.95,.38,C.stone,24);
  venetianArch(b,0,20.65,1.87,1.67,.75,.28,.38,C.stone);
  b.pop();
 }
 b.box(0,18.5,0,5.15,.45,5.15,C.stone,24);b.box(0,21.8,0,5.2,.43,5.2,C.stone,24);
 b.cylinder(0,22.55,0,2.65,2.65,1.15,'#b9c5ae',24,4,0,PI/4);
 const corners=[[-2.7,-2.7],[2.7,-2.7],[2.7,2.7],[-2.7,2.7]];
 for(let i=0;i<4;i++){const a=corners[i],q=corners[(i+1)%4];b.tri([a[0],23.1,a[1]],[q[0],23.1,q[1]],[0,28,0],shade(C.green,.85+i*.065),41);b.beam([a[0],23.1,a[1]],[0,28,0],.055,C.gold,41,6);}
 b.cylinder(0,28.55,0,.09,.09,1.2,C.gold,41,8);b.sphere(0,29.2,0,.27,.27,.27,C.gold,41,10,6);
 b.tri([0,29.35,0],[1.4,29.70,0],[0,30.05,0],C.gold,41);
 b.pop();
}
function venetianChair(b,x,z,angle=0){
 b.push(x,1.2,z,0,angle);for(const a of[-.24,.24])for(const d of[-.22,.22])b.beam([a,0,d],[a*.85,.55,d*.85],.028,'#405b58',41,5);
 b.cylinder(0,.58,0,.33,.33,.10,'#a8765e',22,10);b.beam([-.25,.55,-.25],[-.25,1.12,-.25],.03,'#405b58',41,5);b.beam([.25,.55,-.25],[.25,1.12,-.25],.03,'#405b58',41,5);b.beam([-.25,1.12,-.25],[.25,1.12,-.25],.045,'#a8765e',22,6);b.pop();
}
function venetianCafe(b){
 const C=VENETIAN_COLORS;
 b.push(-27,1.2,22);
 b.box(0,2.0,0,12.7,4,4.8,'#a87969',20);b.box(0,.25,2.45,13,.5,.24,C.stone,24);
 for(const x of[-4,0,4])venetianWindow(b,x,1.95,2.48,2.2,2.8,false,true);
 for(let i=0;i<24;i++){const x=-6.9+i*.6;b.quad([x,3.2,2.5],[x+.6,3.2,2.5],[x+.6,2.73,5.9],[x,2.73,5.9],i%2?'#dfcba8':'#547f7b',23);b.box(x+.3,2.65,5.89,.6,.23,.10,i%2?'#dfcba8':'#547f7b',23);}
 b.box(0,3.95,2.62,9,.56,.13,C.ink,22);hudsonText(b,'CAFFE DELLA LUNA',0,3.93,2.70,8.6,C.stone);
 for(const x of[-6.8,6.8])b.cylinder(x,1.4,5.8,.045,.045,2.8,C.ink,41,7);
 gable(b,13.1,5.0,4.2,1.1,C.roof);b.pop();
 for(const x of[-32,-27,-22]){
  b.cylinder(x,2.12,28.1,.61,.61,.11,C.stone,24,14);b.cylinder(x,1.64,28.1,.065,.065,.94,C.ink,41,8);
  b.cylinder(x,1.23,28.1,.33,.33,.07,C.ink,41,10);
  for(const side of[-1,1])venetianChair(b,x+side*.96,28.1,side*PI/2);
  b.cylinder(x-.17,2.24,28.04,.07,.09,.17,'#efe0c3',24,8);b.cylinder(x+.19,2.23,28.2,.10,.08,.13,'#e5c29c',24,8);
 }
}
function venetianCompass(b,x,z,r,y=1.23){
 for(let i=0;i<16;i++){const a=i*TAU/16,q=(i+1)*TAU/16,m=(a+q)/2,R=i%2?r*.67:r;
  b.tri([x,y,z],[x+Math.sin(a)*r*.25,y,z+Math.cos(a)*r*.25],[x+Math.sin(m)*R,y,z+Math.cos(m)*R],i%2?'#bfa67d':'#577b76',24);
  b.tri([x,y,z],[x+Math.sin(m)*R,y,z+Math.cos(m)*R],[x+Math.sin(q)*r*.25,y,z+Math.cos(q)*r*.25],i%2?'#d4c4a3':'#98afa0',24);
 }
 for(let i=0;i<64;i++){const a=i*TAU/64,q=(i+1)*TAU/64;b.beam([x+Math.sin(a)*r,y,z+Math.cos(a)*r],[x+Math.sin(q)*r,y,z+Math.cos(q)*r],.035,'#c2a276',41,5);}
}
function venetianArchitecture(scene,b){
 const P=[
  {x:-45,w:7.5,h:8.2,color:'#d0a479'},{x:-35,w:8.4,h:11.0,color:'#c78f86'},
  {x:-23.5,w:8.9,h:9.2,color:'#c6b497'},{x:-13,w:7.1,h:7.1,color:'#97b1a5'},
  {x:46,w:8,h:10.4,color:'#bf9984'}
 ];
 for(const [i,p]of P.entries())venetianPalazzo(b,{...p,z:venetianCenter(p.x)-11.5,variant:i});
 for(const [i,p]of[{x:-44,w:7.8,h:6.5,color:'#8eafa5'},{x:-33,w:8.4,h:7,color:'#caa28e'},{x:-19,w:7.8,h:6.9,color:'#d0b390'},{x:19,w:8.4,h:7.2,color:'#c69082'},{x:28.8,w:7,h:6.6,color:'#9caf9e'},{x:46,w:7.5,h:7.1,color:'#d0ad83'}].entries())venetianPalazzo(b,{...p,z:venetianCenter(p.x)+12.0,angle:PI,variant:i+1});
 venetianBasilica(b);venetianCampanile(b);venetianCafe(b);
 venetianCompass(b,17.8,-12.1,3.6);venetianCompass(b,6.5,23,5.0);
 // Colonnaded garden and cypress silhouettes behind the little city.
 for(const x of[-45,-36,-27,-18,-9]){
  b.box(x,1.5,-29,4.6,.6,4.8,'#bbae95',24);b.cylinder(x,3.1,-29,.17,.13,3.4,'#776c51',2,8);
  b.sphere(x,6,-29,1.18,3.5,1.12,'#527d6c',8,9,7);
 }
 for(const [x,z]of[[-53,19],[-51,-23],[51,-26],[52,22],[11,28],[27,25]]){
  b.cylinder(x,1.58,z,.6,.8,.78,'#ab7d64',24,10);b.sphere(x,2.88,z,1.15,1.45,1.1,'#6d9277',8,10,7);
 }
 // One suspended laundry line in an alley; deterministic, not random scatter.
 b.beam([-40,7.5,15],[-37.5,7.1,21],.025,'#968b70',2,5);
 for(let i=0;i<4;i++){const t=(i+.5)/5,p=lerpV([-40,7.5,15],[-37.5,7.1,21],t);b.box(p[0],p[1]-.45,p[2],.8,.95,.055,i%2?'#e6d5b6':'#b29998',23);}
 // A slim lantern promenade follows the banks and leaves the bridge landings clear.
 for(const x of[-45,-36,-17,12,25,46])for(const side of[-1,1])venetianLantern(b,x,1.2,venetianCenter(x)+side*8.3,.76);
}
function venetianChandelier(b,x,y,z,s=1){
 const C=VENETIAN_COLORS;b.push(x,y,z,0,0,0,s);
 b.beam([0,1.4,0],[0,7,0],.06,C.gold,41,8);b.sphere(0,.2,0,.82,1.5,.82,'#accdc0',43,12,8);
 b.cylinder(0,-.7,0,1.1,.8,.45,C.gold,41,16);
 for(let i=0;i<8;i++){
  const a=i*TAU/8,x=Math.cos(a),z=Math.sin(a);
  b.beam([0,-.3,0],[x*2.4,-1.4,z*2.4],.09,C.gold,41,7);b.beam([x*2.4,-1.4,z*2.4],[x*3.3,-.5,z*3.3],.09,C.gold,41,7);
  b.cylinder(x*3.3,-.36,z*3.3,.49,.24,.4,'#b6d4bf',43,12);b.cylinder(x*3.3,.21,z*3.3,.12,.12,.92,'#ecddba',25,8);
  b.sphere(x*3.3,.78,z*3.3,.16,.30,.16,'#f0d8a1',25,8,5);
  b.sphere(x*2.4,-2.05,z*2.4,.18,.50,.18,'#a2c4b5',43,8,5);
 }
 b.sphere(0,-2.1,0,.28,.57,.28,'#b8d0b5',43,10,6);b.pop();
}
function venetianShell(b){
 const C=VENETIAN_COLORS,walls=[];
 b.box(0,FLOOR-.3,0,158,.6,130,'#adbdad',24);
 for(let x=-75;x<78;x+=6)for(let z=-61;z<64;z+=6){b.push(x,FLOOR+.025,z,0,PI/4);b.box(0,0,0,3.8,.035,3.8,(Math.round(x+z)/6)%2?'#a7b9aa':'#c7cbb6',24);b.pop();}
 for(const z of[-59,59])b.box(0,FLOOR+.045,z,146,.045,.18,C.gold,41);
 for(const x of[-73,73])b.box(x,FLOOR+.045,0,.18,.045,118,C.gold,41);
 venetianCompass(b,0,55,6.5,FLOOR+.09);
 for(const which of['back','left','right','front']){
  const w=new Builder(),back=which==='back',front=which==='front',wide=back||front,width=wide?156:128,pos=back?[0,0,-64]:front?[0,0,64]:which==='left'?[-78,0,0]:[78,0,0],angle=back?0:front?PI:which==='left'?PI/2:-PI/2;
  w.push(...pos,0,angle);w.box(0,4,0,width,56,.6,'#a0b6aa',20);
  w.box(0,-16,.4,width,16,.45,'#3e6265',22);w.box(0,-8,.8,width,.45,1,C.gold,41);w.box(0,-23.3,.7,width,1.2,.9,'#496c6b',22);
  w.box(0,30.7,.7,width,1.6,1.8,C.stone,24);w.box(0,29.4,1,width,.21,1.1,C.gold,41);
  for(let xx=-width/2+4;xx<width/2;xx+=9.5){w.box(xx,-16,.73,.14,12,.14,C.gold,41);w.box(xx+4.5,-10.3,.74,8.4,.13,.14,C.gold,41);w.box(xx+4.5,-21.7,.74,8.4,.13,.14,C.gold,41);}
  if(!front){
   const count=wide?5:4,spacing=(width-17)/count;
   for(let i=0;i<count;i++){
    const xx=(i-(count-1)/2)*spacing,r=spacing*.33;
    // A painted lagoon beyond each recessed arched window, made from native
    // geometry rather than a newly allocated atlas or external image asset.
    w.box(xx,8.6,.43,r*2,28,.10,'#93b7b0',0);
    w.box(xx,.4,.53,r*2,8.5,.065,'#6d9d99',0);w.box(xx,-4.9,.54,r*2,2.0,.07,'#527d7d',0);
    for(let k=0;k<6;k++){const cx=xx-r+1.4+k*r*.30,h=1.4+hash(k,i)*2.8;w.box(cx,3.25+h/2,.57,r*.3,h,.08,k%2?'#adc2b4':'#a2b9ad',0);}
    venetianArch(w,xx,15.9,.95,r,r*.93,.8,1.0,C.stone);
    for(const side of[-1,1]){w.box(xx+side*(r+.36),4.1,.95,.8,24.1,1.0,C.stone,24);w.box(xx+side*(r+.36),-7.75,1.05,1.5,.5,1.4,C.gold,41);}
    w.box(xx,-7.6,1.12,r*2+1.9,.5,2.0,C.stone,24);
    for(const dx of[-r*.48,0,r*.48])w.box(xx+dx,5.2,1.07,.19,25.9,.28,'#7d9c92',41);
    for(const y of[-1.2,9.0,15.7])w.box(xx,y,1.07,r*2,.19,.28,'#7d9c92',41);
   }
   if(back){const key='house-'+Object.keys(HOUSE_ROOMS).indexOf('venetian');if(roomLabels[key])roomFrame(w,key,0,-16,1.1,39,7);}
  }else{
   w.box(0,-4,1,20,40,1.1,'#385b5f',22);
   for(const s of[-1,1]){w.box(s*4.8,-3.7,1.7,8.6,37.5,.22,'#668b83',22);w.box(s*1.4,-4,1.95,.15,2.2,.24,C.gold,41);}
   w.box(0,19.7,1.2,28,3,.6,C.ink,22);hudsonText(w,'LA SERENISSIMA',0,19.5,1.54,25,C.stone);
   for(const xx of[-44,44]){w.box(xx,6,1,23,25,.6,'#6e9690',22);for(const s of[-1,1]){w.box(xx+s*11.6,6,1.5,.15,25.4,.2,C.gold,41);w.box(xx,6+s*12.6,1.5,23.2,.15,.2,C.gold,41);}w.sphere(xx,7,1.75,3.0,4,1.25,C.stone,24,16,10);for(const s of[-1,1])w.sphere(xx+s*1.12,7.5,2.8,.64,.42,.2,C.ink,0,10,6);w.beam([xx,6.8,3],[xx,5.4,3.8],.21,C.gold,41,8);}
  }
  w.pop();walls.push({which,mesh:w.mesh()});
 }
 for(const [x,z]of[[-34,-8],[34,-8],[0,29]])venetianChandelier(b,x,29,z,1.1);
 // Squero workbench, timber ribs and a hand-built model hull in the west aisle.
 b.push(-71,FLOOR,21,0,PI/2);
 b.box(0,11.6,0,18,.7,6.5,'#9e7859',22);for(const x of[-7,7])for(const z of[-2.3,2.3])b.box(x,5.8,z,.7,11.6,.7,C.ink,22);
 for(let i=0;i<7;i++){const x=-5+i*1.7,r=1.35*Math.sin((i+1)*PI/8);b.beam([x,12.1,-r],[x,11.97,0],.07,C.stone,22,6);b.beam([x,11.97,0],[x,12.1,r],.07,C.stone,22,6);}
 b.beam([-6.3,12,0],[6.3,12,0],.09,'#a97953',22,7);for(let i=0;i<5;i++)b.box(4+i*.35,12.1,2,.11,.16,1.8,'#c8b58c',22);b.pop();
 for(const x of[-38,38]){
  b.box(x,FLOOR+4,55,20,1.2,5.5,'#ac7770',23);b.box(x,FLOOR+6.3,57.3,20,4.5,.9,'#ba8d80',23);
  for(const side of[-1,1])b.box(x+side*8.8,FLOOR+1.9,55,.5,3.8,4.1,C.gold,41);
 }
 return walls;
}
