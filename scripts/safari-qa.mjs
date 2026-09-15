import assert from 'node:assert/strict';
import {communityContext,loadCommunity,loadContributionDefinitions,prepareCommunityGeometry,read} from './community-lib.mjs';
const state=await communityContext();state.context.assert=assert;
await loadContributionDefinitions(state,await loadCommunity());prepareCommunityGeometry(state);
// Independent checks keep the existing bounded VM timeout. Do not make one
// large scene build plus all clearance proofs share a single execution window.
const sceneReport=state.run(`(()=>{
 const startSeed=seed,scene=getHouseScene('safari');
 assert.equal(seed,startSeed,'room build preserves the shared random stream');
 assert.equal(getHouseScene('safari'),scene,'room geometry is cached');
 assert.equal(scene.walls.length,4);assert.equal(scene.spots.length,12);for(const name of ['The zebra lawn','The elephant trail','The expedition archive'])assert.ok(scene.spots.some(s=>s.name===name),'new wildlife and archive viewpoints');assert.equal(scene.trains.length,1);
 assert.ok(scene.mesh.count>250000&&scene.mesh.count<650000,'fixed room vertex budget');
 assert.ok(scene.spots.every(s=>s.phoneDistance>s.distance&&s.target.every(Number.isFinite)));
 assert.equal(scene.actors.length,0);assert.equal(scene.population,0,'no human visitors are placed in the habitat');
 assert.equal(scene.wildlife.herd.length,3,'two adult giraffes and a calf');
 assert.equal(HOUSE_ROOMS.safari.map.plot,'west-4');assert.equal(HOUSE_ROOMS.safari.trainCollection,false);
 assert.ok(validateCredits(HOUSE_ROOMS.safari.credits).some(c=>c.handle==='nickfromlater'));
 assert.equal(collectionTrainLabel('safari').name,'Solstice');assert.equal(collectionPower('safari'),'electric');
 assert.throws(()=>chooseCollectionTrain('safari',{id:'tern',livery:0,cars:2}),/unavailable/);
 selectedCollection.safari={id:'tern',livery:0,cars:2};applyCollectionToScene(scene);
 assert.equal(scene.trains[0].stock,'safari','persisted ordinary stock cannot enter the monorail');
 assert.equal(collectionPower('safari'),'electric','incompatible saved stock cannot change the monorail audio identity');delete selectedCollection.safari;
 return {room:'safari',sceneVertices:scene.mesh.count,wallVertices:scene.walls.map(w=>w.mesh.count),trees:SAFARI_TREES.length};
})()`);
const terrainReport=state.run(`(()=>{
 const edge=SAFARI_ROUTE,a=edge.at(0),q=edge.at(edge.length);
 assert.ok(len(sub(a.p,q.p))<1e-8,'closed rail position');assert.ok(dot(a.f,q.f)>.9999,'closed rail tangent');
 let grade=0,clearance=Infinity;
 for(let d=0;d<edge.length;d+=.17){const p=edge.at(d),r=norm([p.f[2],0,-p.f[0]]);grade=Math.max(grade,Math.abs(p.f[1])/Math.hypot(p.f[0],p.f[2]));
  for(const side of[-.72,0,.72]){const x=p.p[0]+r[0]*side,z=p.p[2]+r[2]*side;clearance=Math.min(clearance,p.p[1]-SAFARI.beamDepth-safariSurface(x,z));}
  assert.ok(Math.abs(p.p[0])<53&&Math.abs(p.p[2])<35,'route stays on the board');
 }
 assert.ok(grade<.11,'maximum grade is bounded: '+grade);assert.ok(clearance>.20,'finished terrain clears beam and car envelope: '+clearance);
 // Platforms and their complete stair widths stay above finished terrain.
 const stationClearances={};
 for(const [name,x0,x1,z0,z1,y]of[['gate',-38,-18,28.85,33.45,7.44],['ridge',6,26,-33.45,-28.85,11.84]]){
  let min=Infinity;for(let x=x0;x<=x1;x+=.23)for(let z=z0;z<=z1;z+=.23)min=Math.min(min,y-safariSurface(x,z));
  assert.ok(min>.40,name+' platform clears terrain: '+min);stationClearances[name]=min;
 }
 for(const [name,x0,x1,z,top,n,half]of[['gate',-18,-10,31.3,7.44,32,1.08],['ridge',6,.5,-31.15,11.84,24,.85]]){
  const bottom=safariLandingHeight(x1,z,half);assert.ok((top-bottom)/Math.abs(x1-x0)<.85,name+' stair gradient');
  for(let i=0;i<n;i++){const x=mix(x0,x1,(i+.5)/n),y=mix(top,bottom,(i+1)/n);for(const side of[-half,0,half])assert.ok(y-safariSurface(x,z+side)>0,name+' tread is not buried');}
 }
 const path=new Builder();housePath(path,SAFARI_RIDGE_PATH,.7,safariSurface,'#c9b385');
 const heights=path.data.filter((_,i)=>i%12===1);assert.ok(Math.max(...heights)-Math.min(...heights)<.12,'ridge footpath stays on its planting shelf');
 // A forward rolling load tyre moves backward at its contact patch.
 const r=SAFARI_STOCK.loadRadius,p0=[0,-r,0],p1=transform(p0,rx(.001/r));assert.ok(p1[2]<p0[2],'correct load tyre rolling direction');
 // Check the exact emitted terrain triangle interpolation at both halves.
 const g=SAFARI_GRID;
 for(let i=0;i<110;i++){const ix=i*31%g.nx,iz=i*19%g.nz,x=-56+ix*g.dx,z=-40+iz*g.dz;
  for(const [u,v]of[[.17,.29],[.71,.82]]){const a=safariRawHeight(x,z),r=safariRawHeight(x+g.dx,z),f=safariRawHeight(x,z+g.dz),q=safariRawHeight(x+g.dx,z+g.dz),expected=u+v<=1?a+(r-a)*u+(f-a)*v:q+(f-q)*(1-u)+(r-q)*(1-v);
   assert.ok(Math.abs(safariSurface(x+u*g.dx,z+v*g.dz)-expected)<1e-9,'finished triangle sampler');}
 }
 for(let z=-39;z<40;z+=.5)assert.ok(safariSurface(safariRiverX(z),z)<SAFARI.water,'continuous submerged river bed');
 for(const t of SAFARI_TREES){const foot=t.h*.17,levels=[-foot,0,foot].flatMap(dx=>[-foot,0,foot].map(dz=>safariSurface(t.x+dx,t.z+dz)));assert.ok(Math.max(...levels)-Math.min(...levels)<=1.1,'acacia roots occupy a geological shelf, not a sheer face');}
 for(let i=0;i<SAFARI_SPRING.length;i++){
  const [x,z]=SAFARI_SPRING[i];assert.ok(safariRailNear(x,z).distance>3,'spring stays clear of the monorail');
  if(i){const [px,pz]=SAFARI_SPRING[i-1];assert.ok(safariSurface(x,z)<=safariSurface(px,pz)+.06,'spring runs downhill');}
 }
 return {routeLength:edge.length,stationClearances,maxGrade:grade,minimumTerrainClearance:clearance};
})()`);
let treeClearance=Infinity,treeVertices=0;
for(let index=0;index<sceneReport.trees;index++){
 const tree=state.run(`(()=>{
  const t=SAFARI_TREES[${index}],b=new Builder();safariAcacia(b,t.x,t.z,t.h,t.variant);let clearance=Infinity;
  for(let i=0;i<b.data.length;i+=12){const x=b.data[i],z=b.data[i+2];assert.ok(Math.abs(x)<56&&Math.abs(z)<40,'acacia stays on the board');clearance=Math.min(clearance,safariRailNear(x,z).distance);}
  return {vertices:b.data.length/12,clearance};
 })()`);
 treeClearance=Math.min(treeClearance,tree.clearance);treeVertices+=tree.vertices;
}
assert.ok(treeClearance>1,'finished crowns and roots clear the railway: '+treeClearance);
const stockReport=state.run(`(()=>{
 const builds=[];for(let i=0;i<2;i++){const b=new Builder();safariCarHull(b,false,true);builds.push(b.data);}
 assert.deepEqual(builds[0],builds[1],'deterministic vehicle geometry');
 buildCollectionStock();const stock=collectionStock.get('safari');assert.equal(Object.keys(stock).length,7);
 const vertices=Object.values(stock).reduce((sum,m)=>sum+m.count,0);assert.ok(vertices<15000,'stock vertex budget');
 assert.ok(Math.abs(.072+.14-SAFARI_STOCK.loadRadius-.012)<1e-10,'load tyre sits on the running strip');
 assert.ok(Math.abs(.406-SAFARI_STOCK.guideRadius-(SAFARI.beamWidth/2+.006))<1e-10,'guide tyres meet the side strips');
 const disposed=[],oldDispose=disposeMesh;disposeMesh=mesh=>disposed.push(mesh);try{buildCollectionStock();}finally{disposeMesh=oldDispose;}
 for(const mesh of Object.values(stock))assert.ok(disposed.includes(mesh),'rebuild releases every monorail mesh');
 return {stockVertices:vertices};
})()`);
const lodgeReport=state.run(`(()=>{
 const b=new Builder();safariLodge(b);const count=b.data.length/12;
 assert.ok(count>150000&&count<225000,'lodge retains its detailed but bounded authored geometry');
 assert.ok(b.data.every(Number.isFinite),'finite lodge and furniture');
 let clearance=Infinity,groundClearance=Infinity;
 for(let i=0;i<b.data.length;i+=12*11){const near=safariRailNear(b.data[i],b.data[i+2]);if(near.point&&b.data[i+1]>near.point[1]-.9&&b.data[i+1]<near.point[1]+2.4)clearance=Math.min(clearance,near.distance);}
 assert.ok(clearance>1.35,'lodge roof, hide, equipment and approach clear the monorail: '+clearance);
 for(let x=17.45;x<37.6;x+=.8)for(let z=-5.2;z<3.5;z+=.8)groundClearance=Math.min(groundClearance,SAFARI_LODGE.floor-.40-safariSurface(x,z));
 assert.ok(groundClearance>.3,'building floor is above finished terrain');
 const test=new Builder();safariAcacia(test,-30,10,5.8,4);assert.ok(test.data.length/12<3500,'new acacias use detailed open crowns without the old sphere budget');
 assert.equal(getHouseScene('safari').safari.lodge,'Kopje House');
 assert.ok(getHouseScene('safari').spots.some(s=>s.name==='Kopje House'));
 assert.ok(getHouseScene('safari').spots.some(s=>s.name==='The expedition approach'));
 // User removal is a geometry invariant, not just hidden UI or a material change.
 assert.equal(typeof kopjePool,'undefined');assert.equal(typeof kopjeFireCourt,'undefined');assert.equal(typeof kopjePergola,'undefined');
 for(let i=9;i<b.data.length;i+=12)assert.ok(b.data[i]!==7&&b.data[i]!==44,'no pool or spillway water remains in lodge geometry');
 const buildings=new Builder();kopjeMainHall(buildings);kopjeGearWing(buildings);kopjeMessTent(buildings);kopjeStoneSteps(buildings);
 for(let i=2;i<buildings.data.length;i+=12)assert.ok(buildings.data[i]<8.5,'buildings do not occupy the removed rear leisure deck');
 assert.ok(safariLodgeClear(16.2,12.05,1),'old basin footprint is returned to planting');
 assert.ok(safariLodgeClear(33,16,1),'old fire court footprint is returned to planting');
 assert.ok(!getHouseScene('safari').spots.some(s=>/sundowner/i.test(s.name)),'obsolete leisure viewpoint removed');
 for(const x of[17.75,30.25])assert.ok(SAFARI_LODGE.floor+4.515<kopjeFieldRoofY(x)-.10,'column and tie ends remain beneath the thatch');
 const hide=new Builder();kopjeGearWing(hide);const floorY=SAFARI_LODGE.floor+5.9+.11;
 const inside=(p,a,b,c)=>{const cross=(u,v,w)=>(v[0]-u[0])*(w[1]-u[1])-(v[1]-u[1])*(w[0]-u[0]);const v=[cross(a,b,p),cross(b,c,p),cross(c,a,p)];return v.every(x=>x>=-1e-8)||v.every(x=>x<=1e-8);};
 for(let i=0;i<hide.data.length;i+=36){
  const yy=[hide.data[i+1],hide.data[i+13],hide.data[i+25]];
  if(yy.every(y=>Math.abs(y-floorY)<1e-7))assert.ok(!inside([33.29,-2.1],[hide.data[i],hide.data[i+2]],[hide.data[i+12],hide.data[i+14]],[hide.data[i+24],hide.data[i+26]]),'ladder arrives through a real floor opening');
 }

 return {lodgeVertices:count,lodgeRailClearance:clearance,lodgeTerrainClearance:groundClearance};
})()`);
const report={...sceneReport,...terrainReport,...stockReport,...lodgeReport,treeVertices,minimumTreeClearance:treeClearance};
state.run(await read('src/shop-house.js'));
state.run(`assert.equal(SHOP_HOUSE_LAYOUT.byKey.safari.row,3);assert.equal(SHOP_HOUSE_LAYOUT.byKey.safari.column,0);assert.ok(!SHOP_HOUSE_LAYOUT.plots.some(p=>p.id==='west-4'));`);
assert.match(await read('src/train-cabinet.css'),/\.train-collection-link\[hidden\]\{display:none!important\}/);
console.log(JSON.stringify(report,null,2));console.log('Safari room, terrain, beam clearance, stock isolation and disposal verified.');
