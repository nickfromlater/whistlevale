'use strict';

// LA SERENISSIMA — an imaginary Venetian model, not a geographic reconstruction.
// Original scene and architecture: nickfromlater, with agent assistance.
// Native house geometry, materials, stock, camera and lifecycle; no guest renderer.
const VENETIAN={water:-.65,quay:1.2,rail:1.58,halfWidth:66,halfDepth:46,canalHalf:7.2,canalEnd:48,lane:2.45};
const VENETIAN_COLORS={stone:'#e4d4b1',shadow:'#b5ad98',brick:'#b57968',gold:'#c7a36a',ink:'#284b51',water:'#3faaa4',roof:'#a76550',green:'#73a99a'};
const VENETIAN_BRIDGES=[{x:-28,width:2.8,covered:false},{x:0,width:5.6,covered:true},{x:36,width:2.6,covered:false}];
function venetianCenter(x){const a=clamp(x,-48,48);return 7*Math.sin(a*.055)*Math.cos(a*PI/96)**2;}
function venetianWaterBounds(x){
 const beyond=Math.max(0,Math.abs(x)-VENETIAN.canalEnd);
 if(beyond>=VENETIAN.canalHalf)return null;
 const half=Math.sqrt(VENETIAN.canalHalf**2-beyond**2),center=venetianCenter(x);
 return [center-half,center+half];
}
function venetianIsWater(x,z,margin=0){const bounds=venetianWaterBounds(x);return !!bounds&&z>bounds[0]+margin&&z<bounds[1]-margin;}
function venetianRailRoute(){
 const y=VENETIAN.rail,k=.5522847498,r=10,X=60,Z=39;
 const p=(x,z)=>[x,y,z],line=(a,q)=>[a,lerpV(a,q,1/3),lerpV(a,q,2/3),q];
 return new Edge('The Serenissima lagoon railway',[
  line(p(-X+r,Z),p(X-r,Z)),[p(X-r,Z),p(X-r+k*r,Z),p(X,Z-r+k*r),p(X,Z-r)],
  line(p(X,Z-r),p(X,-Z+r)),[p(X,-Z+r),p(X,-Z+r-k*r),p(X-r+k*r,-Z),p(X-r,-Z)],
  line(p(X-r,-Z),p(-X+r,-Z)),[p(-X+r,-Z),p(-X+r-k*r,-Z),p(-X,-Z+r-k*r),p(-X,-Z+r)],
  line(p(-X,-Z+r),p(-X,Z-r)),[p(-X,Z-r),p(-X,Z-r+k*r),p(-X+r-k*r,Z),p(-X+r,Z)]
 ]);
}
const VENETIAN_RAIL=venetianRailRoute();
function venetianTrack(b){
 // Native 0.64 gauge and railhead height; surface chair plates omit hidden faces.
 const e=VENETIAN_RAIL;
 ribbon(b,e,1.55,0,-.21,'#aaaf9a',9,0,e.length,.65);
 for(let d=0;d<e.length;d+=.45){const a=e.at(d);b.matrix(basis(a.p,a.f));b.box(0,-.062,0,1.04,.075,.13,shade('#736957',.92+hash(d,6)*.12),2);
  for(const side of[-1,1])b.quad([side*.32-.07,-.011,-.085],[side*.32+.07,-.011,-.085],[side*.32+.07,-.011,.085],[side*.32-.07,-.011,.085],'#586560',11);b.pop();
 }
 for(const side of[-1,1]){ribbon(b,e,.055,side*.32,.021,'#65746c',11,0,e.length,.5);ribbon(b,e,.07,side*.32,.057,'#c4cbbd',1,0,e.length,.5);}
}
function venetianWaterTint(x,z){
 const bounds=venetianWaterBounds(x),side=z<venetianCenter(x)?-1:1,water=col('#398b85');
 if(!bounds)return water;
 const distance=Math.min(z-bounds[0],bounds[1]-z);let tint=water,weight=0;
 for(const block of VENETIAN_BLOCKS)if(block.side===side){
  const w=(1-smooth(block.w*.38,block.w*.63,Math.abs(x-block.x)))*Math.exp(-Math.max(0,distance)*.82)*.35;
  if(w>weight){weight=w;tint=col(block.color);}
 }
 return lerpV(water,tint,weight);
}
function venetianBase(b){
 const C=VENETIAN_COLORS;
 slab(b,134,94,2.4,-3.1,4.5,'#24474c',22);
 slab(b,135,95,.30,-1.79,4.7,C.gold,41);slab(b,133.8,93.8,.36,-1.49,4.2,'#456970',22);
 for(const side of[-1,1]){b.box(0,-3.1,side*47.02,116,.10,.05,C.gold,41);b.box(side*67.02,-3.1,0,.05,.10,76,C.gold,41);}
 for(const x of[-48,48])for(const z of[-29,29]){
  b.cylinder(x,-14.1,z,1.1,1.75,19.9,'#35535a',22,10);b.sphere(x,-7,z,2.0,1.4,2.0,C.gold,41,10,6);
  b.cylinder(x,FLOOR+.7,z,2.2,1.4,1.4,'#345259',22,12);b.cylinder(x,-4.7,z,2.1,2.1,.6,C.gold,41,12);
 }
 b.box(0,-3.0,47.13,29,1.75,.16,C.ink,22);hudsonText(b,'LA SERENISSIMA',0,-3.02,47.225,25,C.stone,41);
 // No land plane is placed under the canal surface. Both shores and the water
 // share exact sample boundaries, including rounded turning basins at the ends.
 const samples=[-66];for(let i=0;i<=240;i++)samples.push(-55.2+110.4*i/240);samples.push(66);
 const land=(x,a,z,d)=>b.quad([x,VENETIAN.quay,a],[x,VENETIAN.quay,z],[d,VENETIAN.quay,z],[d,VENETIAN.quay,a],C.stone,24,[0,1,0]);
 for(let i=1;i<samples.length;i++){
  const x=samples[i-1],q=samples[i],A=venetianWaterBounds(x),B=venetianWaterBounds(q);
  if(!A&&!B){land(x,-46,46,q);continue;}
  const aa=A||[venetianCenter(x),venetianCenter(x)],bb=B||[venetianCenter(q),venetianCenter(q)];
  b.quad([x,1.2,-46],[x,1.2,aa[0]],[q,1.2,bb[0]],[q,1.2,-46],C.stone,24,[0,1,0]);
  b.quad([x,1.2,aa[1]],[x,1.2,46],[q,1.2,46],[q,1.2,bb[1]],C.stone,24,[0,1,0]);
  for(let lane=0;lane<12;lane++){
   const f=lane/12,g=(lane+1)/12,A=[x,VENETIAN.water,mix(...aa,f)],B=[x,VENETIAN.water,mix(...aa,g)],D=[q,VENETIAN.water,mix(...bb,g)],E=[q,VENETIAN.water,mix(...bb,f)];
   // Authored bank colour is carried by the existing vertex-colour channel.
   // Each triangle interpolates it smoothly into the deeper green channel.
   for(const p of [[A,B,D],[A,D,E]])for(const v of p)b.vertex(v,[0,1,0],venetianWaterTint(v[0],v[2]),102,[v[0],v[2]]);
  }
  for(const side of[0,1]){
   const P=[x,aa[side]],Q=[q,bb[side]],out=side?1:-1;
   // Canal wall, damp tide line and individual limestone coping stones.
   b.quad([P[0],-1.3,P[1]],[Q[0],-1.3,Q[1]],[Q[0],1.15,Q[1]],[P[0],1.15,P[1]],side?C.brick:'#ae8675',4);
   b.quad([P[0],-.61,P[1]-out*.014],[Q[0],-.61,Q[1]-out*.014],[Q[0],-.25,Q[1]-out*.014],[P[0],-.25,P[1]-out*.014],'#7d9985',4);
   b.quad([P[0],1.215,P[1]-out*.15],[P[0],1.215,P[1]+out*.48],[Q[0],1.215,Q[1]+out*.48],[Q[0],1.215,Q[1]-out*.15],shade(C.stone,i%3===0?.91:1.02),24,[0,1,0]);
  }
 }
 // Solid perimeter edge remains visible above the lacquered cabinet.
 for(const [x,z,w,d]of[[0,-46,132,.20],[0,46,132,.20],[-66,0,.20,92],[66,0,.20,92]])b.box(x,-.03,z,w,2.48,d,'#c5b69b',4);
 for(const z of[-43.2,43.2])b.box(0,1.22,z,125,.035,.14,C.gold,41);
}
function venetianBridgeHeight(x){const a=Math.abs(x);return a<=3?4.95:mix(4.95,1.2,clamp((a-3)/8.4));}
function venetianBridge(b,bridge){
 const C=VENETIAN_COLORS,{x,width:w,covered}=bridge,center=venetianCenter(x),D=w/2;
 b.push(x,0,center,0,PI/2);
 // An elliptic stone intrados really opens above the navigation channel.
 const n=32,inner=(t,z)=>[8.65*Math.cos(t),.15+3.75*Math.sin(t),z],outer=(t,z)=>[9.03*Math.cos(t),.15+4.16*Math.sin(t),z];
 for(let i=0;i<n;i++){
  const a=i*PI/n,q=(i+1)*PI/n,c=shade(C.stone,i%2?.98:1.07);
  for(const s of[-1,1])b.quad(inner(a,s*D),inner(q,s*D),outer(q,s*D),outer(a,s*D),c,24);
  b.quad(inner(a,-D),inner(a,D),inner(q,D),inner(q,-D),'#bcae91',24);
  // Spandrels follow the stair deck instead of filling the arch with a box.
  for(const s of[-1,1]){const A=outer(a,s*D),Q=outer(q,s*D);b.quad(A,Q,[Q[0],Math.max(Q[1],venetianBridgeHeight(Q[0])-.15),s*D],[A[0],Math.max(A[1],venetianBridgeHeight(A[0])-.15),s*D],C.brick,4);}
 }
 for(const s of[-1,1]){
  b.box(s*10.25,.5,0,2.3,1.4,w,C.shadow,4);
  for(let i=0;i<18;i++){
   const a=3+i*8.4/18,q=3+(i+1)*8.4/18,y=venetianBridgeHeight((a+q)/2);
   b.box(s*(a+q)/2,y-.09,0,q-a+.015,.18,w+.16,C.stone,24);
   for(const z of[-D,D])b.cylinder(s*(a+q)/2,y+.47,z,.046,.046,.92,C.stone,24,6);
  }
 }
 b.box(0,4.88,0,6,.17,w+.16,C.stone,24);
 for(const z of[-D,D]){
  for(let i=0;i<50;i++){const a=-11.4+i*22.8/50,q=-11.4+(i+1)*22.8/50;b.beam([a,venetianBridgeHeight(a)+1.0,z],[q,venetianBridgeHeight(q)+1.0,z],.105,C.stone,24,6);}
  for(let x=-2.7;x<=2.7;x+=.6)b.cylinder(x,5.43,z,.055,.055,.94,C.stone,24,7);
 }
 if(covered){
  for(const s of[-1,1]){
   // Two genuinely open arcade galleries flank the central passage.
   for(const xx of[-2.6,0,2.6]){b.box(xx,6.35,s*(D-.23),.25,2.8,.35,C.stone,24);b.box(xx,7.66,s*(D-.23),.5,.22,.6,C.gold,41);}
   for(const xx of[-1.3,1.3]){archRing(b,xx,6.66,s*(D-.23),1.12,1.29,.35,C.stone,16);}
   b.box(0,7.94,s*(D-.23),6,.3,.62,C.stone,24);
  }
  gable(b,6.5,w+.9,8.08,1.30,C.roof);
  for(const s of[-1,1])venetianLantern(b,s*3.6,5.2,0,.58);
 }
 b.pop();
}
function venetianStation(b){
 const C=VENETIAN_COLORS;
 b.push(-29,1.2,34.2);b.box(0,.12,0,23,.24,4.2,'#c6b89e',24);
 for(let x=-10;x<=10;x+=4){b.cylinder(x,1.65,0,.08,.08,3.1,C.ink,41,8);b.beam([x,2.8,-1.55],[x,3.4,0],.07,C.gold,41,6);}
 for(let i=0;i<20;i++)b.box(-11.4+i*1.2,3.4,0,1.2,.16,4.0,i%2?'#e5d6b3':'#547e7b',23);
 b.box(0,2.84,1.78,12,.75,.09,C.ink,22);hudsonText(b,'SERENISSIMA',0,2.80,1.84,10.9,C.stone);
 for(const x of[-7,6]){b.box(x,.77,-.6,3.4,.12,.85,'#927055',22);b.box(x,1.18,-1.05,3.4,.8,.12,'#927055',22);for(const s of[-1,1])b.box(x+s*1.25,.43,-.6,.1,.74,.65,C.ink,41);}
 for(const [x,z]of[[-5,1],[7.8,-.2],[8.6,-.1]]){b.box(x,.55,z,.62,.65,.40,'#84634e',22);b.beam([x-.13,.9,z],[x+.13,.9,z],.035,C.gold,41,6);}
 b.pop();
}
function buildVenetianRoom(scene,b){
 venetianBase(b);venetianTrack(b);
 for(const bridge of VENETIAN_BRIDGES)venetianBridge(b,bridge);
 venetianArchitecture(scene,b);venetianQuays(b);venetianStation(b);venetianBuildLife(scene,b);
 scene.routes=[VENETIAN_RAIL];scene.trains=[{edge:VENETIAN_RAIL,distance:60,speed:1.04,type:'steam',stock:'coast',cars:3}];
 scene.height=(x,z)=>Math.abs(x)>66||Math.abs(z)>46?FLOOR:venetianIsWater(x,z)?VENETIAN.water:VENETIAN.quay;
 scene.canPlace=()=>false;
 scene.spots=[
  {name:'La Serenissima',detail:'A little city afloat in a collector’s Venetian salon.',target:[0,6,-2],distance:132,phoneDistance:360,phonePitch:.90,phoneYaw:1.48,pitch:.49,yaw:.18},
  {name:'The lantern bridge',detail:'Stone steps, open arcades, and gondolas slipping beneath the Rialto.',target:[0,3.5,0],distance:47,phoneDistance:82,pitch:.43,yaw:.52},
  {name:'The grand canal',detail:'Rose plaster, striped mooring posts and little lives along the water.',target:[-19,4,-2],distance:36,phoneDistance:60,pitch:.28,yaw:-1.18},
  {name:'The basilica & bell tower',detail:'Five copper domes, a working bronze bell and a golden evening piazza.',target:[22,9,-20],distance:67,phoneDistance:106,pitch:.47,yaw:.20},
  {name:'The gondolier’s landing',detail:'Black lacquer, crimson velvet and an oar moving with the current.',target:[39,1,3],distance:36,phoneDistance:57,pitch:.43,yaw:1.13},
  {name:'Caffè della Luna',detail:'An espresso under the awning while the lagoon train passes.',target:[-29,2.5,22],distance:49,phoneDistance:79,pitch:.52,yaw:.12},
  {name:'The lagoon railway',detail:'The house’s coastal steam locomotive brings the last visitors home.',target:[-24,2,36],distance:38,phoneDistance:64,pitch:.35,yaw:.28},
  {name:'The collector’s salon',detail:'Gilt moldings, sea-glass chandeliers and a miniature gondola workshop.',target:[0,-1,0],distance:192,phoneDistance:331,pitch:.64,yaw:-.44},
  {name:'The golden loggia',detail:'Look through the carved stone gallery into the shaded rooms of Palazzo Oro.',target:[-20.6,7,-13],distance:39,phoneDistance:65,pitch:.43,yaw:.24}
 ];
}
registerHouseRoom('venetian',{
 name:'The Venetian Salon',layout:'La Serenissima',tag:'THE CITY OF LANTERNS',
 description:'A winding turquoise canal, covered bridges, copper domes and quietly passing gondolas. The lagoon railway circles a Venetian city in miniature.',
 color:'#6fa9a2',ambient:'coast',target:[0,6,-2],distance:132,phoneDistance:360,phonePitch:.90,phoneYaw:1.48,pitch:.49,yaw:.18,
 credits:[{name:'nickfromlater',platform:'github',handle:'nickfromlater',note:'Original Venetian miniature and salon, with agent assistance.'}],
 map:{plot:'east-7',scale:.40,footprint:[158,130],focus:[0,4,0]},
 // Fill every shader light slot: entering from another room must not retain its lights.
 lights:[[-34,28,-8],[34,28,-8],[0,28,29],[-68,4,-43],[68,4,-43],[0,26,29]],
 layoutLights:[[0,6.8,0],[-28,4.9,venetianCenter(-28)-8.4],[36,4.9,venetianCenter(36)+8.4],[19,8,-14],[35,23,-24],[-30,5,19],[-39,5,-14],[43,5,14]],
 build:buildVenetianRoom,shell:venetianShell
});
