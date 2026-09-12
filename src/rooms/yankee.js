'use strict';

// THE BRONX GALLERY. Original room and miniature direction: nickfromlater.
// Authored native geometry, with agent assistance. See docs/rooms/yankee.md.
const YANKEE={floor:-23.97,width:290,depth:280,spacing:7.12,period:108};
function yankeeText(b,text,x,y,z,w,h=2,color='#e8d5ad',mat=0){YankeeModel.lettering(b,text,x,y,z,w,h,color,0,'bold 44px Georgia',mat);}
function yankeeFrame(b,x,y,z,w,h){
 b.box(x,y,z,w+.9,h+.9,.52,'#60442e',22);b.box(x,y,z+.28,w+.32,h+.32,.06,'#b79b61',41);b.box(x,y,z+.32,w,h,.04,'#dfd3b5',0);b.box(x,y,z+.35,w-1.5,h-1.5,.025,'#213b4e',0);
}
function yankeeSconce(b,x,y){
 b.cylinder(x,y,.92,.68,.68,.16,'#af9058',41,16,PI/2);b.beam([x,y,1],[x,y+.3,2.6],.12,'#c1a46d',41,8);b.cylinder(x,y+1.35,2.6,1.0,.62,2.1,'#d8c9a3',0,16);b.cylinder(x,y+.30,2.6,1.01,1.01,.05,'#ffe3a5',25,16);b.cylinder(x,y+2.41,2.6,.65,.65,.06,'#b99a5e',41,16);
}
function yankeeJersey(b,x,y,z,number){
 yankeeFrame(b,x,y,z,16,21);b.push(x,y,z+.42);
 const outline=[[-4,7],[-7,5],[-5,1],[-3.5,2],[-3.5,-7],[3.5,-7],[3.5,2],[5,1],[7,5],[4,7],[1.7,5.9],[-1.7,5.9]];
 for(let i=0;i<outline.length;i++){const a=outline[i],q=outline[(i+1)%outline.length];b.tri([0,0,.04],[a[0],a[1],.04],[q[0],q[1],.04],'#e9e3d0',0);}
 // Clip every pinstripe to the actual shoulders and sleeves of the fabric.
 for(let xx=-6.8;xx<6.9;xx+=.47){const hits=[];for(let i=0;i<outline.length;i++){const a=outline[i],q=outline[(i+1)%outline.length];if((a[0]<=xx&&q[0]>xx)||(q[0]<=xx&&a[0]>xx))hits.push(a[1]+(q[1]-a[1])*(xx-a[0])/(q[0]-a[0]));}hits.sort((a,q)=>a-q);for(let i=0;i+1<hits.length;i+=2)b.box(xx,(hits[i]+hits[i+1])/2,.063,.027,hits[i+1]-hits[i]-.08,.01,'#657b89',0);}
 for(let i=0;i<outline.length;i++){const a=outline[i],q=outline[(i+1)%outline.length];b.beam([a[0]*.97,a[1]*.97,.083],[q[0]*.97,q[1]*.97,.083],.025,'#c8c0aa',0,5);}
 b.beam([-1.7,5.9,.09],[0,5.45,.09],.09,'#c5baa3',0,6);b.beam([0,5.45,.09],[1.7,5.9,.09],.09,'#c5baa3',0,6);
 // Individually cut twill numerals, with a contrasting stitched edge.
 const numerals={
  '2':[[[0,.75],[0,.87],[.14,1],[.85,1],[1,.86],[1,.7],[.78,.7],[.78,.79],[.70,.82],[.28,.82],[.22,.78],[.22,.75]],[[.78,.74],[1,.7],[.22,.18],[0,.18],[0,.33]],[[0,0],[1,0],[1,.2],[0,.2]]],
  '4':[[[0,.4],[.48,1],[.72,1],[.26,.4]],[[0,.23],[1,.23],[1,.43],[0,.43]],[[.60,0],[.83,0],[.83,1],[.60,1]]]
 };
 const width=number.length>1?2.25:3.1,gap=.35;
 for(const [i,digit]of [...number].entries()){
  const cx=(i-(number.length-1)/2)*(width+gap);
  for(const points of numerals[digit]){const p=points.map(([u,v])=>[cx+(u-.5)*width,-3+v*4.7,.12]);
   // The cap is a narrow ring; a simple strip follows its concave edge.
   if(digit==='2'&&points===numerals['2'][0]){const a=p.slice(0,6),q=p.slice(6).reverse();for(let j=0;j<5;j++)b.quad(a[j],a[j+1],q[j+1],q[j],'#17364d',0);}
   else for(let j=1;j<p.length-1;j++)b.tri(p[0],p[j],p[j+1],'#17364d',0);
   for(let j=0;j<p.length;j++){const a=p[j],q=p[(j+1)%p.length],length=Math.hypot(q[0]-a[0],q[1]-a[1]);for(let t=.04;t<length;t+=.13){const at=d=>[a[0]+(q[0]-a[0])*d/length,a[1]+(q[1]-a[1])*d/length,.14];b.beam(at(t),at(Math.min(t+.047,length)),.013,'#a5afac',0,4);}}
  }
 }
 b.box(0,-8.5,.07,7,.62,.06,'#b59b64',41);yankeeText(b,number,0,-8.5,.108,2,.42,'#243d4c');b.pop();
}
function yankeePictureLight(b,x,y,width){
 for(const dx of[-width*.32,width*.32]){b.box(x+dx,y,.7,.8,1.0,.40,'#aa8a55',41);b.beam([x+dx,y,.85],[x+dx,y,3.6],.085,'#bca06b',41,8);}
 YankeeModel.softBox(b,x,y,3.6,width,.58,.76,'#b89a60',41,.12);b.box(x,y-.3,3.62,width-.3,.035,.52,'#ffe2ad',25);
}
function yankeeBlueprint(b,x,y,z,w=46,h=26){
 yankeeFrame(b,x,y,z,w,h);b.push(x,y,z+.40);
 for(let xx=-w/2+2;xx<w/2-1;xx+=2)b.box(xx,0,.012,.015,h-2,.01,'#395363',0);
 for(let yy=-h/2+2;yy<h/2-1;yy+=2)b.box(0,yy,.015,w-2,.015,.01,'#395363',0);
 const p=[0,-7,.05],left=[-9,2,.05],second=[0,11,.05],right=[9,2,.05];
 for(const[a,c]of[[p,left],[left,second],[second,right],[right,p],[p,[-16,9,.05]],[p,[16,9,.05]]])b.beam(a,c,.055,'#d9ca9f',0,5);
 for(let i=0;i<32;i++){const a=i*PI/32,q=(i+1)*PI/32;b.beam([Math.cos(a)*17,Math.sin(a)*10-1,.05],[Math.cos(q)*17,Math.sin(q)*10-1,.05],.08,'#dfd2b2',0,5);}
 for(const a of[p,left,second,right])b.box(a[0],a[1],.12,.45,.45,.08,'#f3e7cc',0);b.pop();
}
function yankeeGallery(b){
 const walls=[];b.box(0,YANKEE.floor-.28,0,290,.55,280,'#806a50',21);
 // A woven runner, brass borders and four trestles beneath the walnut cabinet.
 b.box(0,YANKEE.floor+.04,2,260,.06,247,'#283944',0);
 for(const x of[-128,128])b.box(x,YANKEE.floor+.084,2,.15,.018,243,'#b59b65',0);
 for(const z of[-119,123])b.box(0,YANKEE.floor+.084,z,256,.018,.15,'#b59b65',0);
 for(const x of[-90,90])for(const z of[-76,78]){YankeeModel.softBox(b,x,-15,z,3.8,17.2,4.4,'#60412c',22,.15);b.box(x,-23.3,z,5.2,.6,6,'#344449',41);}
 for(const z of[-76,78])b.box(0,-18,z,180,1.8,2.1,'#60412c',22);
 // Ceiling fittings lift out of the way for the aerial modelmaker's view.
 const ceiling=new Builder();
 for(const z of[-35,24]){ceiling.box(0,55,z,288,1.6,2.1,'#5a412e',22);const x=z<0?48:-48;ceiling.cylinder(x,53,z,.095,.095,4,'#bda16a',41,8);ceiling.cylinder(x,50.8,z,3.2,.65,2,'#284554',41,24);ceiling.cylinder(x,49.8,z,3.08,3.08,.08,'#ffdfa3',25,24);}
 walls.push({which:'ceiling',mesh:ceiling.mesh(),boundary:48});
 for(const which of['back','left','right','front']){
  const w=new Builder(),across=which==='back'||which==='front',width=across?290:280,pos=which==='back'?[0,0,-140]:which==='front'?[0,0,140]:which==='left'?[-145,0,0]:[145,0,0],angle=which==='back'?0:which==='front'?PI:which==='left'?PI/2:-PI/2;
  w.push(...pos,0,angle);w.box(0,14.1,0,width,76,1.0,'#253c4c',20);
  w.box(0,-15.1,.75,width,17.4,.5,'#61462f',22);w.box(0,-6.2,1,width,.5,.65,'#c1a26b',41);w.box(0,-23.1,1,width,1.2,.65,'#382d24',22);
  for(let x=-width/2+3;x<width/2;x+=9){w.box(x,-15.1,1.04,.18,14.8,.20,'#a0875d',22);w.box(x+4,-8.1,1.04,8,.16,.2,'#a0875d',22);w.box(x+4,-22,1.04,8,.16,.2,'#a0875d',22);}
  w.box(0,49.8,.6,width,1.2,1.1,'#a38b5d',22);w.box(0,48.85,.78,width,.13,.35,'#d1b477',41);
  for(const x of[-74,74])yankeeSconce(w,x,13);
  if(which==='back'){
   yankeePictureLight(w,0,29,17);
   yankeeText(w,'YANKEE STADIUM',0,40,1.2,82,6,'#e0cca0');yankeeText(w,'THE BRONX, IN MINIATURE',0,31.4,1.21,61,2.4);
   yankeeBlueprint(w,0,10,1.25,47,28);
   for(const x of[-42,42]){yankeeFrame(w,x,11,1.2,18,24);yankeeText(w,x<0?'1923':'2009',x,15,1.62,13,4);yankeeText(w,'NEW YORK',x,6,1.63,12,1.8);}
  }else if(which==='left'){
   for(const x of[-40,0,40])yankeePictureLight(w,x,26,11);
   for(const[x,n]of[[-40,'4'],[0,'2'],[40,'42']])yankeeJersey(w,x,13,1.2,n);
   yankeeText(w,'PINSTRIPES & POSSIBILITIES',0,34,1.2,77,3.2);
   for(let x=-54;x<=54;x+=18){w.box(x,-11,4,15,8,5.8,'#58422e',22);w.box(x,-6.8,4,15.5,.4,6.2,'#aa8c5e',22);w.box(x,-6.55,4,13,.06,4.8,'#e4d4af',0);for(let k=0;k<5;k++)w.box(x-5+k*2.1,-10,7.0,1.7,6,.05,['#233e50','#8e5440','#b09565'][k%3],22);}
  }else if(which==='right'){
   yankeePictureLight(w,0,29,17);
   yankeeText(w,'RIVER AVENUE',0,35,1.2,67,4);yankeeFrame(w,0,12,1.2,62,29);
   w.box(-15,11,1.66,.8,20,.03,'#4da272',0);w.box(10,11,1.66,.8,20,.03,'#d9864c',0);
   for(let y=3;y<22;y+=5){for(const x of[-15,10])w.cylinder(x,y,1.7,.8,.8,.04,'#eadbc0',0,16,PI/2);}
   yankeeText(w,'161 ST',0,12,1.78,10,2);yankeeText(w,'4',-15,26,1.78,3,4);yankeeText(w,'B D',10,26,1.78,7,4);
   // A shelf of individually stitched balls, two bats and a little trophy.
   w.box(0,-4,4,58,.7,7,'#af8a55',22);w.box(0,-4.45,6.8,58,.15,.2,'#d2b574',41);
   for(const x of[-18,0,18]){w.cylinder(x,-3.2,4,1.7,1.6,.7,'#253d49',0,16);w.sphere(x,-1.4,4,1.58,1.58,1.58,'#e6d9bc',0,20,12);for(let a=0;a<36;a++){let t=a*TAU/36;w.beam([x+Math.cos(t)*1.54,-1.4+Math.sin(t)*1.54,4-.28],[x+Math.cos(t+.04)*1.58,-1.4+Math.sin(t+.04)*1.58,4+.28],.027,'#ae5845',0,4);}}
  }else{
   yankeePictureLight(w,0,35,17);
   yankeeText(w,'A LITTLE CLOSER TO THE GAME',0,27,1.1,102,4);yankeeText(w,'WHISTLEVALE',0,18,1.1,42,2.8);
   for(const x of[-84,84]){yankeeFrame(w,x,14,1.1,23,30);w.tri([x-8,24,1.52],[x+8,24,1.52],[x-8,6,1.52],'#c8b07a',0);yankeeText(w,'NY',x-2,19,1.55,8,4,'#243d50');}
  }
  w.pop();walls.push({which,mesh:w.mesh(),boundary:across?139:144});
 }
 // A reading bench and open modelmaker's chest in the visitor aisle.
 for(const x of[-77,-40]){b.box(x,-19.3,131,3,7,3,'#4f3b2a',22);}
 YankeeModel.softBox(b,-58.5,-15.4,131,43,3.0,9,'#6d4a38',22,.4);
 for(let i=0;i<12;i++)b.box(-78+i*3.5,-13.87,131,.045,.01,7,'#b29668',0);
 for(const x of[-135,135])for(const z of[-115,113]){
  b.cylinder(x,-21,z,3.1,3.5,5.8,'#b9a480',4,18);b.cylinder(x,-18,z,3.3,3.3,.3,'#594c32',9,18);
  for(let k=0;k<14;k++){let a=k*2.399,h=7+hash(k,x+z)*8;const end=[x+Math.cos(a)*4,-18+h,z+Math.sin(a)*4];b.beam([x,-18,z],end,.12,'#53664a',8,5);b.sphere(...end,1.2,2.2,.6,k%2?'#66805a':'#829267',8,8,6,true);}
 }
 return walls;
}

function yankeeRoute(direction){return{length:600,at(distance){const d=((distance%600)+600)%600;return{p:[76-direction*1.75,5.1,direction*(d-300)],f:[0,0,direction]};}};}
function yankeeService(train,dt,rate){
 train.serviceTime=(train.serviceTime+dt*rate/2.226)%YANKEE.period;
 const t=train.serviceTime;let lead,velocity;
 if(t<32){lead=-179+226*t/32;velocity=226/32;}
 else if(t<45){const k=(t-32)/13;lead=47+20*(1-(1-k)*(1-k));velocity=40*(1-k)/13;}
 else if(t<57){lead=67;velocity=0;}
 else if(t<71){const k=(t-57)/14;lead=67+39*k*k;velocity=78*k/14;}
 else{lead=106+(t-71)*6.6;velocity=6.6;}
 train.speed=velocity/2.226;
 train.distance=300+lead+(train.direction<0?-70:0);
 train.doorOpen=t>=45&&t<=57?clamp(Math.min((t-45)/1.1,(57-t)/1.1),0,1):0;
}
function drawYankeeTrain(scene,train,p){
 const parts=scene.stockMeshes;
 for(let i=0;i<10;i++){
  const d=train.distance-i*YANKEE.spacing,info=houseTrainAt(train,i*YANKEE.spacing);if(info.p[2]<-109||info.p[2]>115)continue;
  const m=circuitMatrix(train.edge,d),end=i===9,carModel=end?mm(m,ry(PI)):m;
  draw(end?parts.tail:i===0?parts.cab:parts.car,carModel,p);
  if(!(cutaway&&p===mainProgram)&&!(i===0&&viewMode==='cab'&&p===mainProgram))draw(parts.roof,m,p);
  draw(parts.bogies,m,p);
  for(const z of[-2.5,-1.9,1.9,2.5])draw(parts.wheels,mm(m,mm(trans(0,.15,z),rx(-d/.16))),p);
  for(const side of[-1,1])for(const half of[-1,1]){
   const open=side===-1?train.doorOpen:0;draw(parts['door'+side+':'+half],mm(m,trans(0,0,half*.33*open)),p);
  }
 }
}
function buildYankeeRoom(scene,b){
 YankeeModel.build(scene,b);scene.population=scene.bronx.population;scene.trainClip=[-105.2,111.1];
 scene.ownedMeshes=[];scene.stockMeshes={};
 const part=(key,fn)=>{const mesh=new Builder();fn(mesh);const uploaded=mesh.mesh();scene.stockMeshes[key]=uploaded;scene.ownedMeshes.push(uploaded);};
 part('cab',q=>YankeeModel.buildTrain(q,true,false));part('tail',q=>YankeeModel.buildTrain(q,true,false,true));part('car',q=>YankeeModel.buildTrain(q,false,false));
 part('roof',YankeeModel.buildRoof);part('bogies',YankeeModel.buildBogies);part('wheels',YankeeModel.buildWheels);
 for(const side of[-1,1])for(const half of[-1,1])part('door'+side+':'+half,q=>YankeeModel.buildDoors(q,half,side));
 scene.routes=[yankeeRoute(1),yankeeRoute(-1)];scene.trains=scene.routes.map((edge,i)=>({edge,distance:0,speed:1,cars:9,type:'mountain',direction:i?-1:1,serviceTime:i?97:48,doorOpen:0,advance:yankeeService,draw:drawYankeeTrain}));
 for(const train of scene.trains)yankeeService(train,0,1);
 // Follow a visible service; the camera waits at the platform during staging.
 scene.trainFocus=()=>{
  for(const train of scene.trains){const q=houseTrainAt(train);if(q.p[2]>-99&&q.p[2]<103)return q;}
  return {p:[74.25,5.1,40],f:[0,0,1]};
 };
 scene.spots=[
  {name:'Inside the cathedral',target:YankeeModel.world([0,8,0]),distance:183,phoneDistance:360,pitch:.79,yaw:.01},
  {name:'161 St · Yankee Stadium',target:[76,6,39],distance:66,phoneDistance:137,pitch:.32,yaw:-.58},
  {name:'The Great Hall',target:YankeeModel.world([-4,8,63]),distance:84,phoneDistance:171,pitch:.28,yaw:-.21},
  {name:'River Avenue',target:[89,5,18],distance:62,phoneDistance:143,pitch:.28,yaw:-.87},
  {name:'Beyond center field',target:YankeeModel.world([0,13,-42]),distance:97,phoneDistance:165,pitch:.37,yaw:-.48},
  {name:'Pinstripes on the wall',target:[-143,15,0],distance:52,phoneDistance:91,pitch:.09,yaw:1.34}
 ];
}
const yankeeFloodLights=[[-44,29,8],[44,29,8],[-35,29,-30],[35,29,-30],[-12,29,55],[12,29,55]].map(p=>({position:YankeeModel.world(p),target:YankeeModel.world([p[0]*.16,1,4]),color:[1.08,1.13,1.05],radius:70,cone:.81,strength:.70}));
for(const x of[-30,30])yankeeFloodLights.push({position:YankeeModel.world([x,1.5,73]),target:YankeeModel.world([x*.73,15,63]),color:[1,.64,.30],radius:34,cone:.70,strength:3.4});
registerHouseRoom('yankee',{
 name:'The Bronx Gallery',layout:'Yankee Stadium',tag:'PINSTRIPES & THE ELEVATED',description:'The cathedral of baseball, a little silver 4 train, and a whole Bronx block after dark. A handcrafted ballpark in a walnut and navy gallery.',
 color:'#bba575',ambient:'town',distance:422,phoneDistance:950,target:[0,4,4],pitch:.66,yaw:.46,maxDistance:1100,far:1600,shadowBounds:[192,172],
 train:{name:'River Avenue Local',number:'4',service:'Woodlawn / Manhattan',type:'R142-family electric subway',power:'electric'},
 credits:[{name:'nickfromlater',platform:'github',handle:'nickfromlater',note:'Original Yankee Stadium miniature, Bronx gallery and R142-family subway; built with agent assistance.'}],
 map:{plot:'west-4',scale:.22,footprint:[292,282],focus:[0,10,2]},
 layoutLightFalloff:.075,
 lights:[[-48,49.8,24],[48,49.8,-35],[-140,25.7,0],[0,28.7,-135],[140,28.7,0],[0,34.7,135]],
 layoutLights:[[70,8,10],[82,8,32],[70,8,55],[82,8,72],[88,5,-42],[88,5,-76],[89,5,98],[48,5,78]],floodLights:yankeeFloodLights,
 build:buildYankeeRoom,shell:yankeeGallery
});
