'use strict';

// One bounded scene clock, owned by the existing room and map update loops.
// Every moving mesh is registered in scene.movingParts for normal disposal.
function venetianLantern(b,x,y,z,s=1){
 const C=VENETIAN_COLORS;b.push(x,y,z,0,0,0,s);
 b.cylinder(0,.1,0,.27,.23,.2,C.stone,24,10);b.cylinder(0,1.65,0,.065,.045,3.1,C.ink,41,8);
 b.sphere(0,2.92,0,.18,.18,.18,C.gold,41,9,5);b.cylinder(0,3.16,0,.28,.22,.13,C.gold,41,10);
 b.box(0,3.54,0,.39,.63,.39,'#ecd5a4',6);
 for(const a of[-.22,.22])for(const z of[-.22,.22])b.beam([a,3.2,z],[a*.76,3.88,z*.76],.022,C.ink,41,5);
 b.cylinder(0,3.92,0,.34,.075,.29,C.ink,41,4,0,PI/4);b.sphere(0,4.11,0,.06,.09,.06,C.gold,41,8,4);b.pop();
}
function venetianCanalRoute(){
 const Y=VENETIAN.water+.015,r=VENETIAN.lane,k=.5522847498,curves=[],p=(x,z)=>[x,Y,z];
 const tangent=x=>(venetianCenter(x+.001)-venetianCenter(x-.001))/.002;
 for(let x=-48;x<48;x+=12){const q=x+12,a=p(x,venetianCenter(x)+r),d=p(q,venetianCenter(q)+r);curves.push([a,add(a,[4,0,4*tangent(x)]),add(d,[-4,0,-4*tangent(q)]),d]);}
 curves.push([p(48,r),p(48+k*r,r),p(48+r,k*r),p(48+r,0)],[p(48+r,0),p(48+r,-k*r),p(48+k*r,-r),p(48,-r)]);
 for(let x=48;x>-48;x-=12){const q=x-12,a=p(x,venetianCenter(x)-r),d=p(q,venetianCenter(q)-r);curves.push([a,add(a,[-4,0,-4*tangent(x)]),add(d,[4,0,4*tangent(q)]),d]);}
 curves.push([p(-48,-r),p(-48-k*r,-r),p(-48-r,-k*r),p(-48-r,0)],[p(-48-r,0),p(-48-r,k*r),p(-48-k*r,r),p(-48,r)]);
 return new Edge('The lantern canal navigation circuit',curves);
}
function venetianPerson(b,x,y,z,angle=0,shirt='#c5d2b3',seated=false){
 b.push(x,y,z,0,angle);const feet=seated?.30:0;
 if(seated){for(const s of[-1,1]){b.beam([s*.10,.52,0],[s*.10,.45,.28],.075,'#405453',0,7);b.beam([s*.10,.45,.28],[s*.10,.13,.30],.066,'#405453',0,7);}}
 else for(const s of[-1,1])b.beam([s*.10,.53,0],[s*.10,feet,0],.071,'#405453',0,7);
 b.cylinder(0,.77,0,.20,.23,.48,shirt,23,9);b.sphere(0,1.15,0,.145,.19,.15,'#d8af86',0,9,6);
 for(const s of[-1,1])b.beam([s*.23,.93,0],[s*.28,.61,.13],.052,shirt,0,7);
 b.pop();
}
function venetianGondola(b,index){
 const C=VENETIAN_COLORS,n=28;
 const hull=(t,side,upper)=>{const z=-3.3+t*6.6,width=.63*Math.sin(PI*t)**.72,ends=(Math.abs(t-.5)*2)**4;return [side*width*(upper?1:.48),upper?.20+.37*ends:-.18+.35*ends,z];};
 for(let i=0;i<n;i++){
  const t=i/n,u=(i+1)/n;
  for(const side of[-1,1]){
   b.quad(hull(t,side,true),hull(u,side,true),hull(u,side,false),hull(t,side,false),'#253f43',41);
   b.beam(hull(t,side,true),hull(u,side,true),.026,C.gold,41,6);
  }
  b.quad(hull(t,-1,false),hull(u,-1,false),hull(u,1,false),hull(t,1,false),'#263e3e',0);
  if(t<.2||t>.80)b.quad(hull(t,-1,true),hull(u,-1,true),hull(u,1,true),hull(t,1,true),'#315053',22);
 }
 b.box(0,.10,0,.87,.10,3.6,'#6b5a48',22);
 for(const z of[-.72,.63]){b.box(0,.27,z,1.0,.24,.55,index%2?'#a36569':'#9b5360',23);b.box(0,.49,z-.28,1.02,.54,.13,index%2?'#b17674':'#a6636b',23);}
 b.box(0,.16,-2.07,.74,.12,.63,'#61766b',22);
 // The characteristic iron bow comb and a rising stern are actual thin geometry.
 b.beam([0,.56,3.28],[0,1.12,3.43],.035,'#c5c5b0',41,8);
 for(let i=0;i<6;i++)b.beam([0,.62+i*.073,3.30+i*.019],[.27,.62+i*.073,3.30+i*.019],.022,'#c5c5b0',41,6);
 b.beam([0,.58,-3.28],[0,.86,-3.47],.035,C.gold,41,7);
 venetianPerson(b,0,.23,-2.03,0,'#e1dac0');
 for(let i=0;i<4;i++)b.box(0,.88+i*.095,-1.825,.38,.035,.014,'#425e62',23);
 b.cylinder(0,1.62,-2.03,.26,.26,.045,'#d1b77f',22,14);b.cylinder(0,1.70,-2.03,.17,.15,.16,'#d9bd84',22,12);b.cylinder(0,1.65,-2.03,.174,.174,.045,'#a96d66',23,12);
 b.beam([.15,1.08,-2.03],[.75,.87,-1.86],.055,'#d8af86',0,7);
 venetianPerson(b,-.12,.05,.57,0,index%2?'#bb9993':'#91a799',true);
 b.cylinder(.58,.55,-1.62,.047,.045,.62,C.gold,41,7);b.beam([.58,.8,-1.62],[.75,.88,-1.62],.035,C.gold,41,6);
}
function venetianWake(b){
 for(const side of[-1,1])for(let i=0;i<12;i++){
  const a=i/12,q=(i+1)/12,p=t=>[side*(.6+t*.65),.028,-2.3-t*3.0],A=p(a),Q=p(q);
  b.quad(A,Q,[Q[0]+side*.035*(1-q),Q[1],Q[2]],[A[0]+side*.035*(1-a),A[1],A[2]],shade('#84bdb4',.90+.1*a),7,[0,1,0]);
 }
}
function venetianBoatPose(scene,index){
 const v=scene.venetian,d=v.time*.82+index*v.route.length/4+18,q=circuitAt(v.route,d),front=circuitAt(v.route,d+.3),rear=circuitAt(v.route,d-.3);
 const t=reduceMotion?0:v.time,position=add(q.p,[0,Math.sin(t*.9+index)*.023,0]),f=norm(sub(front.p,rear.p));
 return {position,f,model:mm(basis(position,f),rz(Math.sin(t*.67+index)*.012))};
}
function venetianUpdate(scene,dt){
 if(!scene.venetian||reduceMotion||!Number.isFinite(dt)||dt<=0)return;
 scene.venetian.time+=Math.min(dt,.1);
}
function venetianBuildLife(scene,b){
 const C=VENETIAN_COLORS;
 scene.venetian={time:0,route:venetianCanalRoute()};scene.movingParts=[];
 // Each entry owns a distinct mesh. The house's existing failed-build and cache
 // invalidation paths can therefore release every buffer exactly once.
 const part=(builder,model)=>scene.movingParts.push({mesh:builder.mesh(),model});
 for(let i=0;i<4;i++){
  const hull=new Builder();venetianGondola(hull,i);part(hull,current=>venetianBoatPose(current,i).model);
  const oar=new Builder();oar.beam([0,0,0],[1.30,-.64,.24],.025,'#a78d66',22,8);oar.box(1.40,-.69,.26,.32,.11,.21,'#b7986a',22);
  part(oar,current=>{const pose=venetianBoatPose(current,i),t=reduceMotion?0:current.venetian.time;return mm(pose.model,mm(trans(.71,.86,-1.62),ry(Math.sin(t*1.25+i)*.29)));});
  const wake=new Builder();venetianWake(wake);part(wake,current=>{const q=venetianBoatPose(current,i);return basis([q.position[0],VENETIAN.water,q.position[2]],q.f);});
 }
 const bell=new Builder();bell.cylinder(0,-.43,0,.64,.30,.83,'#af8c56',41,20);bell.cylinder(0,-.89,0,.77,.69,.17,C.gold,41,20);bell.sphere(0,-.86,0,.09,.17,.09,'#624e3a',41,8,5);bell.beam([-.8,.08,0],[.8,.08,0],.10,'#6b6650',22,8);
 part(bell,current=>mm(trans(37,22.1,-25),rx(reduceMotion?0:Math.sin(current.venetian.time*.85)*.12)));
 for(const x of[-45,-37,-15,15,25,45])for(const side of[-1,1]){
  const z=venetianCenter(x)+side*6.25;
  b.cylinder(x,.07,z,.115,.115,1.6,C.stone,24,9);
  for(let i=0;i<7;i++)b.cylinder(x,-.56+i*.23,z,.122,.122,.11,'#ab6f68',23,9);
  b.cylinder(x,.92,z,.16,.10,.16,C.gold,41,10);
 }
 // Small timber landings sit against the actual bank, not across the canal.
 for(const [x,side]of[[-38,1],[23,-1],[45,1]]){
  const z=venetianCenter(x)+side*6.8;
  for(let i=0;i<9;i++)b.box(x-1.7+i*.43,.30,z,.4,.12,1.65,'#aa8b65',22);
  for(const dx of[-1.8,1.8])b.cylinder(x+dx,-.33,z-side*.65,.09,.09,1.38,'#6c7563',22,8);
  for(let i=0;i<3;i++)b.box(x,.49+i*.23,z+side*(.7+i*.25),2,.18,.5,C.stone,24);
 }
 for(const [x,z,a,c]of[[-26,20,.4,'#bec7a8'],[-31,28,1.2,'#a8837d'],[-25,28,-1.1,'#879f95'],[-15,-8,0,'#c0a575'],[12,-12,.4,'#92aaa5'],[22,-13,-.6,'#b7897e'],[27,-15,2,'#c2bb9f'],[32,-12,.4,'#9ba796'],[5,22,.9,'#c4a99c'],[-24,33,0,'#b7bfa6'],[-29,33,1.3,'#ad9390'],[42,9,2.3,'#b49a81']])venetianPerson(b,x,1.23,z,a,c);
 for(const x of[-1.1,1.3])venetianPerson(b,x,4.98,0,PI/2,'#b8b9a6');
 scene.population=22;
 // Reflected lantern glints: restrained strips on the water, not a second world
 // render. The house water shader supplies the actual ripple/specular motion.
 for(const x of[-45,-36,-17,12,25,46])for(const side of[-1,1]){
  const z=venetianCenter(x)+side*5.9;
  for(let j=0;j<8;j++){const xx=x+Math.sin(j*2.1+x)*.1,w=.32*(1-j/10);b.quad([xx-w,-.623,z-side*j*.18],[xx+w,-.623,z-side*j*.18],[xx+w,-.623,z-side*(j*.18+.055)],[xx-w,-.623,z-side*(j*.18+.055)],'#c9b99a',6,[0,1,0]);}
 }
}
function venetianCinemaView(scene,shot){
 if(!scene?.venetian)return null;
 if(shot==='drift'){
  // A real bow-seat ride inside the navigable swept envelope. It fits beneath
  // all three arch intrados; manual orbit still belongs to the house controller.
  const pose=venetianBoatPose(scene,0),p=pose.position,f=pose.f;
  return {position:add(add(p,mul(f,.85)),[0,1.35,0]),target:add(add(p,mul(f,13)),[0,1.7,0]),groundHandled:true,fov:innerWidth<700?.95:.82};
 }
 if(shot==='side')return {position:[-19,9,18],target:[0,3,0],groundHandled:true,fov:innerWidth<700?1.1:.8};
 if(shot==='wide')return {position:innerWidth<700?[39,128,209]:[38,73,122],target:[0,5,-2],groundHandled:true,fov:.84};
 return null; // The fourth shot retains the house's native train-follow camera.
}
