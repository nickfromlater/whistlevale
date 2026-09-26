'use strict';

const ORRERY_STOCK={spacing:2.75,wheelRadius:.18,seat:[0,1.57,.62]};
function orreryCarBody(b,nose=false){
 const P=ORRERY;
 // Curved, tapered enamel sides, a brass belt and a dark recessed footwell.
 b.box(0,.43,0,1.29,.17,2.34,P.ink,42);b.box(0,.55,0,1.18,.09,2.15,P.wood,22);
 for(const side of [-1,1]){
  const profile=[[-1.17,.48,.53],[-.9,.70,.68],[.4,.72,.68],[1.16,.50,.52]];
  for(let j=0;j<3;j++){const a=profile[j],c=profile[j+1];b.quad([side*a[2],.42,a[0]],[side*c[2],.42,c[0]],[side*c[2],c[1],c[0]],[side*a[2],a[1],a[0]],P.teal,40);b.beam([side*a[2],a[1],a[0]],[side*c[2],c[1],c[0]],.038,P.gold,41,6);}
  b.box(side*.65,.51,-.03,.028,.055,1.84,P.cream,40);
  b.beam([side*.34,.98,-.62],[side*.52,1.25,-.67],.028,P.gold,41,6);
 }
 b.box(0,.71,-.22,1.10,.24,.83,P.coral,23);
 for(const x of [-.29,.29]){
  b.box(x,.72,-.22,.49,.23,.73,P.coral,23);b.box(x,1.08,-.67,.47,.65,.18,P.coral,23);b.sphere(x,1.40,-.67,.238,.16,.10,P.coral,23,10,6);
  b.box(x,1.08,-.556,.39,.42,.035,'#d4a78b',23);
 }
 b.box(0,.53,1.05,1.06,.24,.16,P.teal,40);
 if(nose){
  const rings=[[.74,.58,.70],[1.04,.49,.64],[1.34,.27,.55],[1.42,.07,.48]];
  for(let j=0;j<rings.length-1;j++)for(let i=0;i<12;i++){
   const a=i*PI/12,c=(i+1)*PI/12,p=(r,t)=>[Math.cos(t)*r[1],.47+Math.sin(t)*(r[2]-.47),r[0]];
   b.quad(p(rings[j],a),p(rings[j],c),p(rings[j+1],c),p(rings[j+1],a),P.cream,40);
  }
  orreryStar(b,0,.65,1.365,.12,P.gold,41);
  for(const side of [-1,1])b.sphere(side*.35,.59,1.18,.055,.055,.04,P.cream,25,8,5);
 }
 // Visible guide-wheel yokes terminate below the train floor.
 for(const z of [-.78,.78]){b.box(0,.25,z,1.24,.10,.19,P.ink,42);for(const x of [-.67,.67])b.box(x,.02,z,.08,.45,.19,P.gold,41);}
}
function buildOrreryStock(){
 const parts={},make=(key,fn)=>{const b=new Builder();fn(b);parts[key]=b.mesh();};
 try{
  make('car',b=>orreryCarBody(b));make('nose',b=>orreryCarBody(b,true));
  make('riders',b=>{for(const [i,x]of [-.29,.29].entries())littlePerson(b,x,.51,-.19,{pose:'sit',scale:1.65,angle:0,variant:i+3,color:i?'#d0b988':'#788ea2'});});
  make('restraint',b=>{for(const x of [-.29,.29]){b.beam([x-.20,0,0],[x-.20,-.25,.58],.038,ORRERY.gold,41,7);b.beam([x+.20,0,0],[x+.20,-.25,.58],.038,ORRERY.gold,41,7);b.beam([x-.20,-.25,.58],[x+.20,-.25,.58],.055,ORRERY.ink,42,8);}});
  make('wheel',b=>{b.cylinder(0,0,0,.18,.18,.12,'#233d40',42,14,0,PI/2);for(const x of [-.069,.069]){b.cylinder(x,0,0,.09,.09,.022,ORRERY.gold,41,10,0,PI/2);b.beam([x,.08,0],[x,-.08,0],.018,ORRERY.cream,41,5);}});
  make('guide',b=>b.cylinder(0,0,0,.11,.11,.09,'#2a3a40',42,10));
 }catch(error){for(const mesh of Object.values(parts))disposeMesh(mesh);throw error;}
 return parts;
}
const orreryBuildCollectionStock=buildCollectionStock;
buildCollectionStock=function(){orreryBuildCollectionStock();collectionStock.set('orrery',buildOrreryStock());};
function orreryCarMatrix(train,index=0){return orreryMatrix(train.edge.track.at(train.edge.motionAt(train.distance).s-index*ORRERY_STOCK.spacing));}
function orreryDrawFormation(scene,train,p){
 const stock=collectionStock.get('orrery');if(!stock)return;
 const motion=train.edge.motionAt(train.distance),models=[];
 for(let i=0;i<=train.cars;i++){
  const s=motion.s-i*ORRERY_STOCK.spacing,m=orreryCarMatrix(train,i);models.push(m);draw(i?stock.car:stock.nose,m,p);
  // Leave the actual front seat clear when occupied by the visitor's camera.
  if(!(i===0&&typeof orrerySeatActive==='function'&&orrerySeatActive()&&p===mainProgram))draw(stock.riders,m,p);
  draw(stock.restraint,mm(m,mm(trans(0,1.13,-.53),rx(-motion.restraint*1.3))),p);
  for(const z of [-.78,.78]){
   const bogie=orreryMatrix(train.edge.track.at(s+z));
   for(const side of [-1,1]){
    draw(stock.wheel,mm(bogie,mm(trans(side*.52,.265,0),rx(-s/.18))),p);
    // Wheel axle is local X, so its spin belongs around X as well.
    const spin=mm(trans(side*.52,-.24,0),mm(rx(-s/.18),scaling(.69,.69,.69)));
    draw(stock.wheel,mm(bogie,spin),p);
    draw(stock.guide,mm(bogie,mm(trans(side*.72,0,0),ry(side*s/.11))),p);
   }
  }
 }
 for(let i=1;i<models.length;i++)drawLink(couplingMesh,transform([0,.47,-1.17],models[i-1]),transform([0,.47,1.17],models[i]),I,p);
}
const orreryDrawHouseTrain=drawHouseTrainFormation;
drawHouseTrainFormation=function(scene,train,p){if(train.stock==='orrery')orreryDrawFormation(scene,train,p);else orreryDrawHouseTrain(scene,train,p);};
