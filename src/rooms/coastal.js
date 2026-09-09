'use strict';

Object.assign(HOUSE_ROOMS.coast,{tag:'THE SEA-GLASS CONSERVATORY',description:'A harbor railway in a sunlit conservatory. The line climbs chalk bluffs, crosses the tide on timber piers, and returns to the fishing quay.',distance:145,target:[0,1,-2],pitch:.59,yaw:.34});

// These long windows belong to the sea, rather than borrowing the woodland
// illustration from the original railway room. The atlas slot is coastal-only.
function coastWindowArt(){
 if(roomLabels['coast-window'])return;
 artSlot('coast-window',3390,620,690,420,(c,w,h)=>{
  const sky=c.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#98b6bd');sky.addColorStop(.54,'#d3dbca');sky.addColorStop(.565,'#c0d2c3');sky.addColorStop(1,'#709b99');c.fillStyle=sky;c.fillRect(0,0,w,h);
  const haze=c.createRadialGradient(w*.67,h*.44,0,w*.67,h*.44,w*.36);haze.addColorStop(0,'#fff0c984');haze.addColorStop(1,'#f2e6bd00');c.fillStyle=haze;c.fillRect(0,0,w,h);
  c.fillStyle='#a7bbb0';c.beginPath();c.moveTo(0,h*.59);c.bezierCurveTo(w*.08,h*.58,w*.13,h*.47,w*.23,h*.54);c.bezierCurveTo(w*.30,h*.51,w*.33,h*.59,w*.45,h*.595);c.lineTo(0,h*.615);c.closePath();c.fill();
  c.fillStyle='#afc0b4';c.beginPath();c.moveTo(w,h*.52);c.bezierCurveTo(w*.94,h*.49,w*.88,h*.575,w*.70,h*.597);c.lineTo(w,h*.615);c.closePath();c.fill();
  for(let i=0;i<70;i++){const x=hash(i,311)*w,y=h*(.615+hash(i,918)*.38),span=4+hash(i,418)*31;c.strokeStyle=i%3?'#d1ddd035':'#e7e7cf55';c.lineWidth=.6+hash(i,193);c.beginPath();c.moveTo(x,y);c.lineTo(x+span,y);c.stroke();}
  for(const [x,y,s]of[[w*.51,h*.65,1],[w*.78,h*.73,.73],[w*.29,h*.72,.50]]){c.strokeStyle='#819d94';c.lineWidth=.8;c.beginPath();c.moveTo(x,y);c.lineTo(x,y-24*s);c.stroke();c.fillStyle='#ece9d1';c.beginPath();c.moveTo(x-1,y-23*s);c.lineTo(x-12*s,y-2*s);c.lineTo(x-1,y-3*s);c.closePath();c.fill();c.fillStyle='#f4edda';c.beginPath();c.moveTo(x+2,y-19*s);c.lineTo(x+10*s,y-4*s);c.lineTo(x+2,y-3*s);c.closePath();c.fill();c.fillStyle='#667f75';c.fillRect(x-7*s,y,16*s,1.5*s);}
  for(const [x,y]of[[w*.21,h*.27],[w*.25,h*.29],[w*.83,h*.38]]){c.strokeStyle='#7a949077';c.lineWidth=1.1;c.beginPath();c.moveTo(x-5,y+2);c.quadraticCurveTo(x-2,y-2,x,y+1);c.quadraticCurveTo(x+2,y-2,x+5,y+1);c.stroke();}
 });
 gl.bindTexture(gl.TEXTURE_2D,roomAtlasTexture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,roomArt);gl.generateMipmap(gl.TEXTURE_2D);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
}
function coastSeaPane(b,x,y,z,w,h,u0=0,u1=1){
 const q=roomLabels['coast-window'],a=mix(q.u0,q.u1,u0),d=mix(q.u0,q.u1,u1);
 b.quad([x-w/2,y-h/2,z],[x+w/2,y-h/2,z],[x+w/2,y+h/2,z],[x-w/2,y+h/2,z],'#ffffff',33,[0,0,1],[[a,q.v0],[d,q.v0],[d,q.v1],[a,q.v1]]);
}
function coastLantern(b,x,y,z,s=1){
 b.push(x,y,z,0,0,0,s);b.cylinder(0,0,0,1.02,1.02,2.8,'#d2d2b4',43,14);b.cylinder(0,-1.48,0,1.22,1.22,.21,'#b19a66',41,16);b.cylinder(0,1.49,0,1.24,.82,.40,'#a78e5e',41,16);b.sphere(0,.05,0,.45,1.05,.45,'#f0dca4',25,12,8);
 for(let i=0;i<8;i++){const a=i*TAU/8;b.beam([Math.cos(a)*1.1,-1.5,Math.sin(a)*1.1],[Math.cos(a)*1.1,1.5,Math.sin(a)*1.1],.044,'#a08d60',41,6);}b.pop();
}
function coastSeaGrass(b,x,z,s=1){
 b.push(x,FLOOR,z,0,0,0,s);b.cylinder(0,1.8,0,1.6,2.2,3.6,'#ad9d7b',24,16);b.cylinder(0,3.64,0,1.95,1.95,.12,'#6e7560',3,14);
 for(let i=0;i<18;i++){const a=i*2.4,r=.2+hash(i,55)*1.4,h=4+hash(i,72)*4.0,dx=Math.sin(a),dz=Math.cos(a);b.tri([dx*r-.09,3.6,dz*r],[dx*(r+1.7),3.6+h,dz*(r+1.7)],[dx*r+.09,3.6,dz*r],i%3?'#a5b090':'#80967f',8);}b.pop();
}
ROOM_SHELLS.coast=b=>{
 coastWindowArt();const walls=[];
 // Limestone squares and a quiet sea-glass border, with the grain of the oak
 // entirely absent. Nothing competes with the water on the model board.
 b.box(0,FLOOR-.30,0,158,.6,130,'#c8c5ad',24);
 for(let ix=0;ix<18;ix++)for(let iz=0;iz<15;iz++){
  const x=-78+(ix+.5)*156/18,z=-64+(iz+.5)*128/15,c=(ix===1||ix===16||iz===1||iz===13)?'#a4b7ab':['#d4d0b9','#cccbb3','#dad4bd','#d0cdb7'][(ix+iz*3)%4];
  b.box(x,FLOOR+.015,z,156/18-.07,.035,128/15-.07,c,24);
 }
 for(const side of[-1,1]){b.box(side*71,FLOOR+.04,0,.18,.04,119,'#a7ac92',41);b.box(0,FLOOR+.04,side*57,143,.04,.18,'#a7ac92',41);}
 for(let i=0;i<8;i++){const a=i*PI/4,q=a+PI/8,r=i%2?3.8:5.3;b.tri([0,FLOOR+.075,48],[Math.sin(a)*r,FLOOR+.075,48+Math.cos(a)*r],[Math.sin(q)*1.5,FLOOR+.075,48+Math.cos(q)*1.5],i%2?'#aeb59c':'#718e81',24);}
 for(const which of['back','left','right','front']){
  const w=new Builder(),back=which==='back',front=which==='front',width=back||front?156:128,pos=back?[0,0,-64]:front?[0,0,64]:which==='left'?[-78,0,0]:[78,0,0],angle=back?0:front?PI:which==='left'?PI/2:-PI/2;
  w.push(...pos,0,angle);
  w.box(0,-17.2,0,width,13.5,.7,'#b3c1b6',22);w.box(0,-10.5,.7,width,.65,1.7,'#e1dcc3',22);w.box(0,FLOOR+.65,.55,width,1.25,1.1,'#e1dcc3',22);
  for(let xx=-width/2+3;xx<width/2;xx+=4.8)w.box(xx,-17.1,.41,.065,12.3,.1,'#849e94',22);
  if(!front){
   const bays=back?6:5,bay=(width-7)/bays;
   for(let i=0;i<bays;i++){
    const xx=-width/2+3.5+(i+.5)*bay;coastSeaPane(w,xx,10.4,.38,bay-.65,40.8,i/bays,(i+1)/bays);
    for(const yy of[-10.1,16,30.8])w.box(xx,yy,.75,bay,.45,.85,'#dedec7',22);
    w.box(xx,24,.68,.27,13.7,.62,'#bdcbbb',41);
   }
   for(let i=0;i<=bays;i++){const xx=-width/2+3.5+i*bay;w.box(xx,10.5,.65,.63,43.4,.95,'#d8ddc7',22);w.box(xx,10.5,.95,.16,42,.15,'#a5baaa',41);}
   w.box(0,32.1,.2,width,1.65,2.1,'#cfdbc7',22);w.box(0,33.2,.3,width,.32,2.4,'#97afa1',41);
   for(const side of[-1,1]){w.box(side*(width/2-1.4),10.6,.1,2.8,43.3,2.2,'#dde0ca',22);w.beam([side*(width/2-2),24,1],[side*(width/2-11),31,1],.28,'#afc1ac',41,6);}
   if(back){roomFrame(w,'house-1',0,-16.5,.91,29,5.8);w.box(-47,-17.35,3.7,48,13.2,7.5,'#c7c6ab',22);w.box(47,-17.35,3.7,48,13.2,7.5,'#c7c6ab',22);for(const xx of[-61,-47,-33,33,47,61]){w.box(xx,-10.49,4.0,12,.64,5.8,'#8faeaa',23);for(let k=-4;k<=4;k+=2)w.box(xx+k,-10.15,4,.25,.012,5.5,'#d6dcc4',23);}}
  }else{
   w.box(0,11.7,0,width,44.5,.7,'#d9d9c3',20);w.box(0,31.5,.4,width,2.1,1.1,'#b7c9b8',22);
   w.box(0,-3.5,.75,24,40,1.2,'#8fa79d',22);
   for(const side of[-1,1]){w.box(side*5.6,-3.3,1.47,10.7,37.8,.24,'#c1cdbb',22);coastSeaPane(w,side*5.6,4.0,1.62,8.7,19.5,side<0?.14:.5,side<0?.5:.86);w.box(side*5.6,-10.7,1.68,8.2,8.1,.1,'#92b0a8',22);w.box(side*1.35,-4,1.97,.19,2.5,.22,'#b59d69',41);}
   roomFrame(w,'coast-sign',-46,12,.8,35,8.5);roomFrame(w,'house-1',45,12,.8,32,8);
   for(const side of[-1,1]){w.box(side*20,9,1.5,1.4,8,1.2,'#a18d61',41);w.beam([side*20,11,1.5],[side*20,11,4.6],.15,'#ac9665',41,8);coastLantern(w,side*20,7.9,4.8,.68);}
  }
  w.pop();walls.push({which,mesh:w.mesh()});
 }
 // Maritime caged lanterns, no conical shades or repeating workshop fixtures.
 for(const [x,z]of[[-22,-7],[21,0]]){b.beam([x,37,z],[x,29,z],.08,'#af9c6d',41,8);coastLantern(b,x,26.5,z,1.35);}
 // A chart desk and brass telescope make this room a conservatory exhibition.
 b.push(-61,FLOOR,24,0,.12);for(const x of[-7,7])for(const z of[-4,4])b.box(x,7.5,z,.85,15,.85,'#a9b39e',22);b.box(0,15,0,17,1.1,12,'#c9b78f',22);b.box(0,15.58,0,13,.04,8.8,'#e2dac0',23);
 for(let i=0;i<6;i++){const r=1.1+i*.52;for(let j=0;j<40;j++){const a=j*TAU/40,q=(j+1)*TAU/40;b.beam([Math.sin(a)*r,15.61,Math.cos(a)*r],[Math.sin(q)*r,15.61,Math.cos(q)*r],.014,'#9ca98e',0,4);}}b.beam([-5,15.62,0],[5,15.62,0],.016,'#7e9487',0,4);b.beam([0,15.62,-3.6],[0,15.62,3.6],.016,'#7e9487',0,4);b.box(4.3,15.8,2.5,2.8,.30,2.0,'#91a491',22);b.pop();
 b.push(60,FLOOR,-43,0,-.5);for(let i=0;i<3;i++){const a=i*TAU/3;b.beam([Math.sin(a)*4.2,.2,Math.cos(a)*4.2],[0,12.4,0],.20,'#a49167',41,8);}b.cylinder(0,13,0,.72,.72,2.0,'#bfa675',41,16);b.beam([0,13.5,3],[0,17.5,-7],.63,'#bda777',41,18);b.beam([0,17.0,-5.7],[0,17.5,-7],.90,'#cfb784',41,18);b.beam([0,13.5,3],[0,13.1,4],.27,'#5f7f74',41,12);b.pop();
 coastSeaGrass(b,-65,-44,1.4);coastSeaGrass(b,66,43,1.15);
 return walls;
};

// A grid of short track segments lets the terrain respect the railway grade
// without evaluating the entire circuit for every landscape vertex.
function coastTrackSampler(edge){
 const grid=new Map(),step=4;
 for(let d=0;d<edge.length;d+=.8){const a=edge.at(d).p,c=edge.at(Math.min(edge.length,d+.8)).p,k=Math.floor((a[0]+c[0])*.5/step)+','+Math.floor((a[2]+c[2])*.5/step);if(!grid.has(k))grid.set(k,[]);grid.get(k).push([a,c]);}
 return (x,z)=>{let dist=Infinity,y=1.65;const gx=Math.floor(x/step),gz=Math.floor(z/step);for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++)for(const [a,c]of grid.get((gx+i)+','+(gz+j))||[]){const dx=c[0]-a[0],dz=c[2]-a[2],t=clamp(((x-a[0])*dx+(z-a[2])*dz)/(dx*dx+dz*dz||1)),dd=Math.hypot(x-a[0]-dx*t,z-a[2]-dz*t);if(dd<dist){dist=dd;y=mix(a[1],c[1],t);}}return {dist,y};};
}
function coastPine(b,x,y,z,h=3.3,angle=.3){
 const lean=[Math.cos(angle)*h*.18,Math.sin(angle)*h*.18];b.beam([x,y,z],[x+lean[0],y+h*.77,z+lean[1]],.075,'#817255',22,7);
 for(let i=0;i<4;i++){const a=i*2.4,xx=x+lean[0]+Math.cos(a)*h*.20,zz=z+lean[1]+Math.sin(a)*h*.18,yy=y+h*(.77+i*.035);b.beam([x+lean[0]*.6,y+h*.53,z+lean[1]*.6],[xx,yy,zz],.038,'#867659',22,6);b.sphere(xx,yy,zz,h*.28,h*.17,h*.25,i%2?'#6b8665':'#849778',8,9,5);}
}
function coastBoat(b,x,z,angle,kind=0,s=1){
 b.push(x,.52,z,0,angle,0,s);
 const section=[[-1.9,0],[-1.55,.43],[-.7,.65],[.7,.58],[1.6,.36],[1.9,0]],hull=['#b67f62','#4f8180','#d2bb8c'][kind%3];
 for(let i=0;i<section.length-1;i++){const [a,r]=section[i],[c,t]=section[i+1];for(const side of[-1,1]){b.quad([side*r,.19,a],[side*t,.19,c],[side*t*.40,-.17,c],[side*r*.40,-.17,a],hull,41);b.beam([side*r,.21,a],[side*t,.21,c],.036,'#dbc797',22,7);}b.quad([-r,.17,a],[r,.17,a],[t,.17,c],[-t,.17,c],'#c2af83',22);}
 for(let i=0;i<7;i++)b.box(0,.20,-1.35+i*.43,.72,.024,.018,'#8d825f',22);
 if(kind===1){b.beam([0,.2,-.15],[0,4.1,-.15],.028,'#bdab7d',41,7);b.beam([0,1.05,-.15],[0,.74,1.53],.026,'#b5a476',22,7);b.tri([0,4.03,-.15],[0,1.07,-.10],[0,.80,1.49],'#e7e0c4',23);b.tri([0,3.58,-.24],[0,.58,-1.69],[0,.65,-.22],'#d9d9bc',23);b.beam([0,3.98,-.15],[0,.2,-1.77],.007,'#c7c7a7',22,5);}
 else{b.box(0,.43,-.55,.80,.48,.76,'#d7ccac',23);b.box(0,.7,-.55,.91,.10,.89,'#6f8b7e',41);b.box(0,.46,-.15,.57,.22,.03,'#699997',6);b.beam([0,.21,.50],[0,2.85,.50],.027,'#bdab7d',41,7);b.beam([-.79,2,.50],[.79,2,.50],.02,'#b5a476',41,7);b.beam([0,2.81,.50],[0,.2,-1.75],.007,'#c9c2a1',22,5);for(let j=0;j<3;j++)b.sphere(.63,.17,-.8+j*.65,.09,.15,.12,'#ddcda6',23,7,5);b.box(0,.37,1.1,.67,.25,.62,'#9b9f79',22);}
 b.pop();
}
// Small, fixed groups make the shoreline feel worked by tides and wind.
// All samples use the finished terrain and keep the railway envelope clear.
function coastShoreDetails(b,land,shore,near,east,north){
 // Broken chalk at the foot of the headland, with darker stone at the tide line.
 for(let i=0;i<48;i++){
  const z=-10.8+i*.45,x=east(z)-.30+Math.sin(i*2.4)*.52,y=land(x,z),r=.20+hash(i,918)*.33;
  if(y>2.3||near(x,z).dist<2.0||Math.hypot(x-27.5,z+1.2)<3.6)continue;
  b.push(x,Math.max(.25,y)-.02,z,0,hash(i,287)*PI);
  b.sphere(0,.10,0,r,.18+hash(i,76)*.26,r*.72,y<.6?'#9eae9e':'#c7c8ae',4,6,4,true);b.pop();
 }
 // Two small shingle coves on the northern shore, away from the working quay.
 for(const [cx,spread]of[[-1,5.2],[14,4.0]])for(let i=0;i<34;i++){
  const x=cx+(hash(i,cx+83)-.5)*spread,z=north(x)+(hash(i,74)-.2)*.7,y=land(x,z);
  if(y<.38||y>1.22||near(x,z).dist<2)continue;
  const r=.07+hash(i,155)*.14;b.sphere(x,y+.03,z,r,r*.5,r*.76,i%3?'#b7b69b':'#909e8c',4,6,3,true);
 }
 // Marram clumps and small sea-pink flowers on the dune shoulders. The low
 // clusters leave the keeper's path, beach blankets and harbor paving clear.
 for(const [cx,cz,rx,rz,count]of[[-7,-17,5,1.7,23],[17,-18,4,1.8,22],[41,12,3,5,26],[-43,22,2.2,3.5,16],[39,-25,4,2.5,18]])for(let i=0;i<count;i++){
  const a=i*2.39996,r=Math.sqrt((i+.5)/count),x=cx+Math.cos(a)*rx*r,z=cz+Math.sin(a)*rz*r,y=land(x,z);
  if(near(x,z).dist<2.1||shore(x,z)<1.35||Math.abs(z)>30)continue;
  for(let j=0;j<5;j++){
   const a=j*2.4,h=.20+hash(i,j)*.24,dx=Math.cos(a)*.15,dz=Math.sin(a)*.15;
   b.tri([x-.025,y,z],[x+dx+.12,y+h,z+dz],[x+.025,y,z],j%2?'#90965c':'#b3ad78',8);
   b.tri([x,y,z-.025],[x+dx+.12,y+h,z+dz],[x,y,z+.025],'#a7a372',8);
  }
  if(i%4===0)for(let j=0;j<3;j++)b.sphere(x+.15*j,y+.24+hash(i,j)*.08,z+.15,.07,.045,.065,'#b59492',8,5,3);
 }
 // A pair of low driftwood pieces rests above the tide on the quiet cove.
 for(const [x,z,a]of[[12,-11.8,.35],[16.4,-12.6,-.21]]){
  const y=land(x,z);if(y<.55||y>1.5||near(x,z).dist<2)continue;
  b.push(x,y+.07,z,0,a);b.beam([-.65,0,0],[.65,.035,.14],.065,'#a99f7e',22,6);b.beam([-.18,.015,.05],[.04,.08,.38],.028,'#b7af8f',22,5);b.pop();
 }
}

function coastRoom(scene,b){
 // A blue-painted exhibition case on bleached trestles replaces the heavy oak
 // table. Its full perimeter contains both the landform and the open sea.
 b.push(0,0,0);slab(b,99,67,2.9,-1.48,2.8,'#83a198',22);slab(b,99.25,67.25,.17,.07,2.85,'#d3bc89',41);slab(b,97.5,65.5,.20,.20,2.3,'#c4c2a0',3);b.pop();
 for(const x of[-33,33]){for(const z of[-22,22])b.box(x,(FLOOR-3)/2,z,2.0,-3-FLOOR,2.0,'#b7baa1',22);b.beam([x,FLOOR+1,-24],[x,-4,24],.55,'#a4b19c',22,6);b.beam([x,FLOOR+1,24],[x,-4,-24],.55,'#a4b19c',22,6);b.box(x,FLOOR+.7,0,3,1.2,52,'#a5b29e',22);}
 for(let x=-44;x<=44;x+=7.2)b.box(x,-1.64,33.52,.09,2.5,.035,'#b7c7ad',22);
 const points=[[-40,1.65,-5],[-37,1.65,12],[-26,1.7,23],[-10,1.9,26],[9,2.45,25],[25,3.0,18],[33,3.65,3],[39,4.10,-8],[32,4.10,-22],[16,3.60,-25],[2,2.80,-19],[-15,2.10,-23],[-31,1.65,-19]].map(([x,y,z])=>[x,1.65+(y-1.65)*.72,z]);
 const edge=new Edge('The Tidewater shore line',splineCurves(points,true,.78)),near=coastTrackSampler(edge);scene.routes=[edge];scene.trains=[{edge,distance:edge.length*.08,speed:.67,type:'steam',cars:3}];
 const west=z=>-14.5+1.4*Math.sin(z*.19)+.65*Math.cos(z*.41),east=z=>29+3.4*Math.sin(z*.115)-6.4*Math.exp(-(((z+1)/9.5)**2)),north=x=>-15.2+3.4*Math.cos((x-4)*.105)+1.8*Math.sin(x*.23);
 const shore=(x,z)=>Math.max(west(z)-x,north(x)-z,Math.min(x-east(z),19.4-z),Math.min(-11.55-x,16.4-z,z+15.0));
 const natural=(x,z,trackDistance)=>{
  const k=shore(x,z),dry=smooth(-.8,1.35,k),inland=smooth(1.2,4.5,k),eastRise=(2.9+.38*Math.sin(z*.21)+.16*Math.cos(x*.26))*smooth(16,25,x)*(1-smooth(9,18,z))*smooth(.55,1.7,k),northRise=2.3*Math.exp(-(((x-16)/30)**2+((z+27)/8.5)**2)),westDune=2.2*Math.exp(-(((x+42)/8)**2+((z+27)/8)**2));
  // Low wind-shaped folds break up the turf without moving the rail bench.
  const dunes=(.24+.19*Math.sin(x*.43+z*.24)+.11*Math.sin(z*.71-x*.16))*inland*smooth(1.2,3.4,trackDistance);
  let y=.13+1.12*dry+eastRise+(northRise+westDune)*inland+dunes;
  const town=(1-smooth(8.8,11,Math.abs(x+23.5)))*(1-smooth(15.0,18,Math.abs(z-.3)));y=mix(y,1.25,town*dry);
  y=mix(y,4.85,1-smooth(3.0,5.2,Math.hypot(x-27.5,z+1.2)));
  const beach=Math.exp(-(((x-31)/6.5)**2+((z-12.5)/5.3)**2));y=mix(y,1.25,beach*.91*dry);
  return y;
 };
 const land=(x,z)=>{const q=near(x,z),raw=natural(x,z,q.dist),support=smooth(.5,2.5,shore(x,z))*(1-smooth(.82,2.65,q.dist));return mix(raw,q.y-.25,support);};
 scene.height=(x,z)=>Math.abs(x)<48&&Math.abs(z)<32?Math.max(.49,land(x,z)):FLOOR;
 houseTerrain(b,96,64,land,(x,y,z,n)=>{
  const k=shore(x,z),gr=lerpV(col('#728e6b'),col('#b6b185'),noise(x*.24,z*.24)*.65+(.5+.5*Math.sin(x*.43+z*.24))*.35),beach=Math.exp(-(((x-31)/7)**2+((z-12.5)/6)**2)),grass=smooth(1.4,3.8,k)*(1-beach*.91),chalk=smooth(.77,.47,n[1])*smooth(1.45,3.4,y);
  const strata=lerpV(col('#c1c5ae'),col('#dcdac1'),.5+.5*Math.sin(y*7.0+z*.08));const sand=lerpV(col('#a8ad91'),col('#d7c79e'),smooth(.12,1.35,y));return lerpV(lerpV(sand,gr,grass),strata,chalk*.94);
 },.66);
 // Interpolate shallows at vertices; per-tile colors left a visible grid at sea.
 const waterColor=(x,z)=>lerpV(col('#aac1ad'),col('#548e90'),smooth(.6,-9,shore(x,z)));
 for(let z=-31.95;z<31.95;z+=1.05)for(let x=-47.95;x<47.95;x+=1.05){
  const xx=Math.min(x+1.05,47.95),zz=Math.min(z+1.05,31.95);if(shore((x+xx)/2,(z+zz)/2)>2.2)continue;
  const points=[[x,.49,z],[x,.49,zz],[xx,.49,zz],[xx,.49,z]],colors=points.map(p=>waterColor(p[0],p[2]));
  for(const i of[0,1,2,0,2,3])b.vertex(points[i],[0,1,0],colors[i],7);
 }
 coastShoreDetails(b,land,shore,near,east,north);
 // Thin tide marks, interrupted by wet sand and the working quay.
 for(let z=-10;z<29;z+=.7){if(z>-14&&z<16.5)continue;const a=west(z)+.15,c=west(z+.7)+.15;b.quad([a,.5,z],[c,.5,z+.7],[c+.10,.5,z+.7],[a+.10,.5,z],'#b6c9b0',7);}
 // The causeway follows the authored spline and its changing grade. Piles meet
 // the estuary bed; every land section gets a shaped ballast bench instead.
 for(let d=0;d<edge.length;d+=.48){const a=edge.at(d);if(land(a.p[0],a.p[2])>=a.p[1]-.32)continue;b.matrix(basis(a.p,a.f));b.box(0,-.27,0,1.90,.26,.56,'#bdba9c',4);for(const side of[-1,1]){b.box(side*.91,.15,0,.038,.65,.05,'#889a89',41);b.box(side*.91,.42,0,.047,.05,.57,'#b1bba2',41);}b.pop();}
 for(let d=0;d<edge.length;d+=3.1){const a=edge.at(d),[x,y,z]=a.p;if(land(x,z)>=y-.34)continue;b.matrix(basis([x,0,z],[a.f[0],0,a.f[2]]));for(const side of[-1,1]){b.cylinder(side*.60,(y-.41)/2,0,.16,.145,y-.41,'#829180',22,9);b.box(side*.60,.16,0,.55,.24,.69,'#a4ae96',4);}b.beam([-.60,.5,0],[.60,y-.41,0],.065,'#859581',22,6);b.pop();}
 createRail(b,edge);
 // Low stone retaining courses make the inland cutting read as engineering.
 for(let d=0;d<edge.length;d+=.72){const a=edge.at(d);if(a.p[1]<2.6||a.p[2]>-7)continue;const r=[a.f[2],0,-a.f[0]];for(const side of[-1,1]){const x=a.p[0]+r[0]*side*1.15,z=a.p[2]+r[2]*side*1.15,h=land(x,z)-a.p[1]+.15;if(h<.18)continue;b.matrix(basis([x,a.p[1],z],a.f));b.box(0,h/2-.2,0,.2,h+.3,.77,'#b9bba1',4);b.pop();}}
 // Harbor paving deliberately meets the quay. The village is compact enough
 // that the open water and chalk headland remain the primary landscape forms.
 b.box(-17.1,1.30,.4,7.0,.09,31.6,'#c8bfa1',9);b.box(-27.0,1.30,.2,2.8,.07,31.2,'#b3b69a',9);
 housePath(b,[[-34.2,4.5],[-30,4.5],[-27,1],[-27,-13.5],[-20,-15]],1.25,()=>1.28,'#c4b99b');
 for(const [i,x,z,w,h]of[[0,-21.5,-9.8,4.8,3.0],[1,-21.9,-3.7,4.5,3.6],[2,-22.2,2.4,4.9,3.3],[3,-21.7,8.6,4.7,2.9],[4,-21.0,14.5,4.1,3.5]])cottage(b,x,1.30,z,w,3.6,h,['#d6b798','#afc3b3','#ddcba9','#adc4c1','#c8ae91'][i],['#749286','#a3866b','#658882'][i%3],PI/2);
 b.push(-21.9,1.30,-3.7,0,PI/2);roomSign(b,'sea-cafe',0,2.35,1.88,3.25,.65);for(let i=0;i<12;i++){b.push(-2+(i+.5)/3,1.72,2.25,-.14);b.box(0,0,0,1/3,.035,1.1,i%2?'#e6d8b6':'#b99079',23);b.pop();}b.pop();
 houseStation(scene,b,-35.55,1.35,4.5,'bay-station',false,-PI/2);
 // Individual quay stones, timber joints, mooring rings, ropes and crab pots.
 for(let i=0;i<43;i++){const z=-14.2+i*.72;b.box(-11.3,.87,z,1.4,.73,.68,'#a9b09a',4);b.box(-11.3,1.29,z,1.55,.14,.7,'#cfccb0',4);}
 for(let i=0;i<48;i++)b.box(-12.45,1.33,-14.5+i*.64,.75,.075,.60,'#bea577',22);
 for(let i=0;i<12;i++){const z=-13.5+i*2.6;b.cylinder(-10.93,1.37,z,.105,.12,.19,'#7e9183',41,10);b.cylinder(-10.93,1.49,z,.19,.19,.06,'#a5ae95',41,10);}
 for(let j=0;j<3;j++){const z=-8+j*8.0;for(let i=0;i<23;i++)b.box(-10.9+i*.36,1.25,z,.33,.14,1.68,'#b39d73',22);for(let i=0;i<5;i++)for(const side of[-1,1])b.cylinder(-10.5+i*1.7,.68,z+side*.73,.10,.10,1.45,'#879274',22,8);for(let i=0;i<3;i++){b.box(-8.4+i*.74,1.56,z-.32,.56,.43,.61,'#94a07d',22);for(let k=0;k<5;k++)b.box(-8.63+i*.74+k*.12,1.56,z+.003,.027,.43,.026,'#c8b78e',22);}}
 coastBoat(b,-5.2,-10.5,.24,0,1.05);coastBoat(b,-3.4,-4.2,.35,2,.87);coastBoat(b,-5.7,4.3,-.17,0,.90);coastBoat(b,1.8,8.0,-.38,1,1.06);coastBoat(b,9,-4,.20,1,.71);
 cottage(b,-16.2,1.32,-13.3,4.4,3.0,2.3,'#a1b8ab','#718f83',0);roomSign(b,'fresh-fish',-16.2,3.05,-11.76,3.2,.7);
 for(let i=0;i<6;i++)b.box(-17.6+i%3*.68,1.60+Math.floor(i/3)*.29,-11.1,.59,.26,.43,'#bda77d',22);
 b.box(-13.9,1.55,-11.8,.68,.12,1.1,'#bca278',22);for(const side of[-1,1])b.cylinder(-13.9+side*.36,1.46,-11.8,.17,.17,.075,'#6e8d7b',41,10,0,PI/2);
 for(let i=0;i<3;i++){cafeScene(b,-16.4,1.35,-4.4+i*3.0,.2);scene.population+=3;}
 for(let i=0;i<2;i++){marketStall(b,-27+i*3.2,1.33,16.5,i);scene.population+=2;}
 for(const z of[-9,-2,5,12]){houseLamp(b,-13.9,1.35,z,2.0);bench(b,-13.25,1.34,z+.8,PI/2);}
 // A short breakwater encloses the small working port without closing the bay.
 const breakPoints=[[-11,16.7],[-8,18.8],[-3.2,20.1]];
 for(let j=0;j<breakPoints.length-1;j++){const a=breakPoints[j],c=breakPoints[j+1],n=Math.ceil(Math.hypot(c[0]-a[0],c[1]-a[1])/.52);for(let i=0;i<n;i++){const t=i/n,x=mix(a[0],c[0],t),z=mix(a[1],c[1],t);b.sphere(x,.56,z,.55,.56,.5,'#aeb9a3',4,7,4,true);b.box(x,1.13,z,.63,.18,.62,'#c4c7ad',4);}}
 houseLamp(b,-3.2,1.22,20.1,2.2);
 // The lighthouse stands on a real chalk promontory, with a level keeper's
 // platform, garden wall, and a winding descent to the beach below.
 const lx=27.5,lz=-1.2,ly=4.85;
 b.push(lx,ly,lz);b.cylinder(0,.13,0,2.4,2.4,.26,'#c5c8ae',4,28);b.cylinder(0,4.0,0,1.50,.94,7.8,'#e2dec4',4,28);
 for(const y of[2.55,5.1])b.cylinder(0,y,0,1.50-y*.071,1.50-(y+.7)*.071,.7,'#b4866d',4,28);
 b.cylinder(0,7.92,0,1.49,1.49,.20,'#759287',41,24);b.cylinder(0,8.61,0,.87,.87,1.2,'#d3dfc7',43,18);b.cylinder(0,9.32,0,1.16,.035,.66,'#628376',41,24);b.sphere(0,8.63,0,.23,.42,.23,'#f2dca8',25,12,7);
 for(let i=0;i<18;i++){const a=i*TAU/18,q=(i+1)*TAU/18;b.beam([Math.sin(a)*1.38,8.04,Math.cos(a)*1.38],[Math.sin(a)*1.38,8.64,Math.cos(a)*1.38],.021,'#a8b6a0',41,6);b.beam([Math.sin(a)*1.38,8.63,Math.cos(a)*1.38],[Math.sin(q)*1.38,8.63,Math.cos(q)*1.38],.026,'#a8b6a0',41,6);}
 b.box(0,.88,1.47,.65,1.62,.08,'#638a7c',22);for(const y of[3.4,6.0])windowPane(b,0,y,1.30-y*.02,.32,.53);b.pop();
 const keeperY=land(34.8,-8.8);b.box(34.8,keeperY-.27,-8.8,5.0,.55,4.1,'#bfc0a6',4);cottage(b,34.8,keeperY+.04,-8.8,4.3,3.3,2.55,'#ddd2ae','#829b8b',-.23);
 housePath(b,[[35,-6.5],[32,-4.5],[30,-1],[27.5,1.1]],.72,land,'#d5cead');
 housePath(b,[[27.8,2.0],[30.5,4.5],[28.6,7.5],[31.8,10.0],[32,13.5]],.73,land,'#d5c9a3');
 // A continuous low garden wall, open at the keeper's path. Short courses
 // follow the headland instead of reading as isolated cubes above the cliff.
 const gardenWall=[[24.3,-2.5],[24.1,-.9],[24.7,1.4],[26.1,2.9],[27.3,2.8]];
 for(let i=0;i<gardenWall.length-1;i++){
  const a=gardenWall[i],q=gardenWall[i+1],length=Math.hypot(q[0]-a[0],q[1]-a[1]),n=Math.ceil(length/.45),angle=Math.atan2(q[0]-a[0],q[1]-a[1]);
  for(let j=0;j<n;j++){
   const x=mix(a[0],q[0],(j+.5)/n),z=mix(a[1],q[1],(j+.5)/n),y=land(x,z);
   b.push(x,y,z,0,angle);b.box(0,.18,0,.32,.46,length/n+.025,'#aeb69e',4);b.box(0,.43,0,.40,.08,length/n+.035,'#cccbb0',4);b.pop();
  }
 }
 // Chalk layers are exposed only at the headland's steeper seaward face.
 for(let i=0;i<28;i++){const z=-11+hash(i,854)*22,x=east(z)+.6+hash(i,263)*1.0,y=land(x,z);if(y<1.6||near(x,z).dist<2)continue;b.push(x,y-.18,z,0,.2+hash(i,991));b.sphere(0,0,0,.70+hash(i,375)*.60,.31+hash(i,852)*.30,.62,'#cacbb3',4,7,4,true);b.pop();}
 for(const [i,x,z]of[[0,30.5,10.4],[1,33.0,11.0],[2,30.0,13.0],[3,32.3,13.4],[4,29.6,15.1]]){
  if(near(x,z).dist<2.25||shore(x,z)<1.0)continue;const y=land(x,z)+.07;b.push(x,y,z,0,.10+i*.2);b.box(0,0,0,.82,.017,1.45,['#b99679','#a3bbb1','#cdbb8a'][i%3],23);scenePerson(scene,b,0,.015,0,'sitGround',.3,i%3===0?.72:1);if(i%2===0){b.cylinder(0,.80,0,.018,.018,1.6,'#c7b585',41,6);for(let j=0;j<12;j++){const a=j*TAU/12,q=(j+1)*TAU/12;b.tri([0,1.85,0],[Math.sin(a),1.45,Math.cos(a)],[Math.sin(q),1.45,Math.cos(q)],j%2?'#e2d6b3':'#b89276',23);}}b.pop();
 }
 // Wind-pruned maritime pines occur in authored groves, never a forest carpet.
 for(const [cx,cz,count,spread]of[[-42,-24,7,4.0],[-32,-26,5,3.7],[-15,-28,7,3.1],[8,-28,6,3.3],[25,-29,6,3.0],[42,-20,5,3.2],[-44,16,5,2.7]])for(let i=0;i<count;i++){
  const a=i*2.4,x=cx+Math.cos(a)*(1+hash(i,cx)*spread),z=cz+Math.sin(a)*hash(i,cz)*spread;if(Math.abs(x)>46.7||Math.abs(z)>30.6||near(x,z).dist<2.5||shore(x,z)<2.3)continue;coastPine(b,x,land(x,z),z,2.7+hash(i,21+cz)*2.0,.4);
 }
 for(let i=0;i<290;i++){
  const x=-46+hash(i,118)*92,z=-30+hash(i,863)*60,y=land(x,z);if(near(x,z).dist<1.6||shore(x,z)<1.8||(x<-11&&x>-38&&z>-16&&z<21)||Math.hypot(x-lx,z-lz)<4.3)continue;
  const coast=shore(x,z)<4.5,c=coast?'#b8b78b':i%2?'#97a781':'#b1b58a';for(let j=0;j<3;j++){const a=j*2.3+i,h=.13+hash(i,j)*.34;b.tri([x-.045,y,z],[x+Math.sin(a)*.14,y+h,z+Math.cos(a)*.16],[x+.045,y,z],c,8);}
 }
 // The back dune path and its tiny walkers carry the eye along the high line.
 housePath(b,[[-29,-27],[-16,-28],[0,-25],[14,-29],[27,-29],[40,-24]],.56,land,'#c7bf9b');
 for(const [x,z,a]of[[-22,-28,.2],[12,-28,1.1],[13,-28.2,-.6],[29.6,1.8,2.2]])scenePerson(scene,b,x,land(x,z)+.06,z,'bag',a,.86);
 for(let i=0;i<19;i++){const z=-10.5+(i%7)*3.6,x=-15.1-(i%3)*.8;scenePerson(scene,b,x,1.36,z,['bag','talk','wave'][i%3],i*.7,i%7===0?.7:1);}
 for(let i=0;i<3;i++){scenePerson(scene,b,-4.0,1.33,-8+i*8,'work',PI/2);littleBicycle(b,-25.8,1.34,-8+i*8,.2);}
 littleDog(b,-17.1,1.36,11.4,1.7);scenePerson(scene,b,lx+.4,ly+.26,lz+2.0,'wave',PI/2,.86);
 for(let i=0;i<7;i++)scene.actors.push({a:[-12.75,1.37,-10.5],b:[-12.75,1.37,14],offset:i*.173,speed:.12,variant:i,scale:1});
 b.box(0,-1.52,33.64,24,2.3,.12,'#567c70',22);roomSign(b,'coast-sign',0,-1.5,33.73,22,1.9);
 scene.spots=[{name:'The working harbor',detail:'Crab pots on the jetty. Coffee at Salt & Butter. A train waiting by the quay.',target:[-19,2,0],distance:42,yaw:.72,pitch:.49},{name:'Chalk & lamplight',detail:'Above the tide, the keeper’s path finds a little light at the edge of the world.',target:[27.5,7,-1.2],distance:35,yaw:.66,pitch:.47},{name:'Across the tide',detail:'A long, low causeway carries the little train out over the open water.',target:[5,2.5,23],distance:42,yaw:.24,pitch:.49},{name:'The sea-glass room',detail:'Pale stone, brass lanterns, and windows full of salt air.',target:[0,-2,-10],distance:145,yaw:.34,pitch:.58}];
}

registerHouseRoom('coast',{build:coastRoom,lights:[
 // The two suspended lantern bulbs provide the broad exhibition light.
 [-22,26.5675,-7],[21,26.5675,0],
 // Door lanterns, the breakwater lamp, and the lighthouse lantern.
 [-20,7.934,59.2],[20,7.934,59.2],[-3.2,3.42,20.1],[27.5,13.48,-1.2]
]});
