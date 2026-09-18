import assert from 'node:assert/strict';
import {communityContext,loadCommunity,loadContributionDefinitions,prepareCommunityGeometry,read} from './community-lib.mjs';
const state=await communityContext();state.context.assert=assert;
await loadContributionDefinitions(state,await loadCommunity());prepareCommunityGeometry(state);
const report=state.run(`(()=>{
 const before=seed,s=getHouseScene('briarwatch');assert.equal(seed,before);assert.equal(getHouseScene('briarwatch'),s);
 assert.equal(s.trains.length,1);assert.equal(s.trains[0].type,'steam');assert.equal(s.routes.length,1);
 assert.equal(s.walls.length,4);assert.equal(s.spots.length,11);assert.equal(s.movingParts.length,1);
 assert.ok(s.mesh.count<900000,'fixed complete room vertex ceiling');assert.ok(s.movingParts[0].mesh.count<6000,'mechanism ceiling');
 assert.ok(s.spots.every(p=>p.phoneDistance>p.distance&&p.target.every(Number.isFinite)));
 assert.ok(validateCredits(HOUSE_ROOMS.briarwatch.credits).some(c=>c.handle==='nickfromlater'));
 assert.equal(HOUSE_ROOMS.briarwatch.map.plot,'west-5');assert.equal(BRIAR_BUILDINGS.length,8);
 assert.equal(s.height(6,20),FLOOR,'walk-in aisle has real room floor');assert.equal(s.height(12,37),FLOOR);
 for(const [x,z]of[[-40,0],[50,20],[0,-44]])assert.ok(briarInside(x,z),'three room-wrapping scenic arms');
 return {room:'briarwatch',sceneVertices:s.mesh.count,wallVertices:s.walls.map(w=>w.mesh.count),movingVertices:s.movingParts[0].mesh.count,viewpoints:s.spots.length,buildings:BRIAR_BUILDINGS.length,trees:BRIAR_TREES.length};
})()`);
Object.assign(report,state.run(`(()=>{
 const e=BRIAR_ROUTE;assert.ok(len(sub(e.at(0).p,e.at(e.length).p))<1e-8);assert.ok(dot(e.at(0).f,e.at(e.length).f)>.9999);
 let clearance=Infinity,grade=0;
 for(let d=0;d<e.length;d+=.17){const p=e.at(d),r=norm([p.f[2],0,-p.f[0]]);grade=Math.max(grade,Math.abs(p.f[1]));
  assert.ok(briarInside(p.p[0],p.p[2],1.1));
  for(const side of[-.8,0,.8]){const x=p.p[0]+side*r[0],z=p.p[2]+side*r[2];if(!briarInTunnel(x,z,2))clearance=Math.min(clearance,p.p[1]-briarSurface(x,z));}
 }
 assert.ok(grade>.02&&grade<.065,'the graded folded circuit stays under a 6.5 percent vertical direction envelope');assert.ok(clearance>.20,'finished triangle mesh clears the running envelope: '+clearance);
 const g=BRIAR_GRID;
 for(let i=0;i<120;i++)for(const [u,v]of[[.17,.29],[.73,.82]]){
  const ix=i*31%g.nx,iz=i*19%g.nz,x=BRIAR.minX+ix*g.dx,z=BRIAR.minZ+iz*g.dz,a=briarRawHeight(x,z),r=briarRawHeight(x+g.dx,z),f=briarRawHeight(x,z+g.dz),q=briarRawHeight(x+g.dx,z+g.dz);
  const y=u+v<=1?a+(r-a)*u+(f-a)*v:q+(f-q)*(1-u)+(r-q)*(1-v);
  assert.ok(Math.abs(briarSurface(x+u*g.dx,z+v*g.dz)-y)<1e-9,'props sample the actual emitted triangles');
 }
 for(let z=-53;z<45;z+=.5){const x=briarRiverX(z);if(briarInside(x,z,1))assert.ok(briarSurface(x,z)<BRIAR.water,'continuous submerged river on the clipped scenery');}
 for(let i=1;i<BRIAR_LEAT.length;i++)for(let t=0;t<=1;t+=.1){const a=BRIAR_LEAT[i-1],q=BRIAR_LEAT[i];assert.ok(briarSurface(mix(a[0],q[0],t),mix(a[1],q[1],t))<BRIAR.water-.20,'mill race stays submerged through its outlet');}
 for(let x=BRIAR_TUNNEL.x0+1;x<BRIAR_TUNNEL.x1-1;x+=.4)assert.ok(briarSurface(x,BRIAR_TUNNEL.z)>BRIAR_TUNNEL.y+3.1,'real rock roof above tunnel intrados');
 return {routeLength:e.length,maxGrade:grade,minimumTrackTerrainClearance:clearance};
})()`));
Object.assign(report,state.run(`(()=>{
 const ds=briarTrackStations(BRIAR_ROUTE),at=(d,w)=>{const q=BRIAR_ROUTE.at(d);return add(q.p,mul(norm([q.f[2],0,-q.f[0]]),w));};
 assert.equal(ds[0],0);assert.equal(ds[ds.length-1],BRIAR_ROUTE.length);assert.equal(briarTrackStations(BRIAR_ROUTE),ds,'sampling is cached per route');
 assert.ok(ds.length<600,'straight rails no longer consume uniformly dense ribbons');let maxError=0;
 for(let i=1;i<ds.length;i++){
  assert.ok(ds[i]>ds[i-1]&&ds[i]-ds[i-1]<=2.000001);
  for(let j=1;j<10;j++)for(const w of[-.80,.80]){const t=j/10;maxError=Math.max(maxError,len(sub(at(mix(ds[i-1],ds[i],t),w),lerpV(at(ds[i-1],w),at(ds[i],w),t))));}
 }
 assert.ok(maxError<.026,'rail/ballast edges stay within .026 model units of the native segmented route: '+maxError);
 assert.equal(BRIAR_HERO_TREES.length,7);assert.equal(new Set(BRIAR_HERO_TREES.map(t=>t.x+','+t.z)).size,7);
 for(const hero of BRIAR_HERO_TREES){const t=BRIAR_TREES.find(t=>t[0]===hero.x&&t[1]===hero.z);assert.ok(t,'each hero is an existing surveyed tree');const a=new Builder(),b=new Builder();briarTree(a,...t);briarTree(b,...t);assert.ok(a.data.length>0&&a.data.every(Number.isFinite));assert.deepEqual(a.data,b.data,'authored tree is deterministic');}
 return {heroTrees:7,adaptiveTrackSegments:ds.length-1,maximumTrackSurfaceDeviation:maxError};
})()`));
// The default is an estate finish of Tern, not a replacement catalogue family.
Object.assign(report,state.run(`(()=>{
 const initialSeed=seed,initialPaint=trainPaint,roster=JSON.stringify(TRAIN_ROSTER),mesh=Builder.prototype.mesh,dispose=disposeMesh;
 let released=[],attempt=0;collectionStock.delete('briarwatch-estate');
 try{
  Builder.prototype.mesh=function(){if(++attempt===4)throw new Error('simulated estate stock upload');return {count:this.data.length/12};};
  disposeMesh=q=>released.push(q);
  assert.throws(()=>briarEstateStock(),/simulated estate stock upload/);assert.equal(released.length,3,'all partial stock uploads are released');
  assert.ok(!collectionStock.has('briarwatch-estate'));assert.equal(seed,initialSeed);assert.equal(trainPaint,initialPaint);
  Builder.prototype.mesh=function(){return {count:this.data.length/12,data:this.data.slice()};};
  const stock=briarEstateStock();assert.equal(briarEstateStock(),stock,'one cached finish, never per-frame regeneration');
  assert.equal(Object.keys(stock).length,6);assert.ok(stock.cab.count<stock.loco.count,'native cab cutaway remains open');
  const counts={};for(const [name,q]of Object.entries(stock)){
   counts[name]=q.count;assert.ok(q.data.every(Number.isFinite));
   assert.ok(q.count<70000,'bounded estate stock part');
   if(name!=='wheels')for(let i=0;i<q.data.length;i+=12){assert.ok(Math.abs(q.data[i])<.70,'existing train width preserved');assert.ok(q.data[i+1]<2.0,'no tall fittings enter the tunnel');assert.ok(Math.abs(q.data[i+2])<1.865,'coupling end clearance preserved');}
  }
  assert.ok(Object.values(counts).reduce((a,v)=>a+v,0)<180000,'entire cached stock finish budget');
  assert.equal(seed,initialSeed);assert.equal(trainPaint,initialPaint);assert.equal(JSON.stringify(TRAIN_ROSTER),roster,'other train colors and labels are untouched');
  assert.equal(getHouseScene('briarwatch').trains[0].finish,'briarwatch');assert.equal(getHouseScene('coast').trains[0].finish,undefined,'room-scoped finish');
  return {estateTernVertices:counts};
 }finally{Builder.prototype.mesh=mesh;disposeMesh=dispose;collectionStock.delete('briarwatch-estate');}
})()`));

state.run(`(()=>{
 const terrain=new Builder();briarTerrain(terrain);
 for(let i=0;i<terrain.data.length;i+=36)assert.ok(terrain.data[i+9]===terrain.data[i+21]&&terrain.data[i+9]===terrain.data[i+33],'terrain material is constant within each triangle');
 const station=new Builder();briarWorkingRailway(station);let bottom=Infinity;
 for(let i=0;i<station.data.length;i+=12){const [x,y,z]=station.data.slice(i,i+3);if(x>36.25&&x<37.4&&z>31.3&&z<32.5)bottom=Math.min(bottom,y);}
 assert.ok(Math.abs(bottom-(BRIAR.rail-.03))<.0001,'milk churns touch the platform cap');
})()`);
let treeClearance=Infinity;
for(let i=0;i<report.trees;i++){
 const c=state.run(`(()=>{const t=BRIAR_TREES[${i}],b=new Builder();if(briarRailNear(t[0],t[1]).distance>2)briarTree(b,...t);let c=Infinity;
  for(let j=0;j<b.data.length;j+=12){const x=b.data[j],y=b.data[j+1],z=b.data[j+2];const rail=briarRailNear(x,z);if(rail.point&&y>rail.point[1]-.12&&y<rail.point[1]+2.6)c=Math.min(c,rail.distance);}
  return c;
 })()`);treeClearance=Math.min(treeClearance,c);
}
assert.ok(treeClearance>1.2,'branches and roots clear rolling stock');report.minimumTreeRailClearance=treeClearance;
// New scenery is checked as emitted geometry, not only terrain samples. Clip
// each candidate triangle against a swept train-sized box at half-unit steps.
Object.assign(report,state.run(`(()=>{
 const b=new Builder();for(const build of[briarEscarpments,briarWoodlandFloor,briarWatchRuin,briarSpring,briarVillageGardens,briarFieldDetails,briarWorkingRailway,briarVillageLife,briarRailwayPatina])build(b);
 const cells=new Map(),triangles=[];
 for(let j=0;j<b.data.length;j+=36){
  const t=[b.data.slice(j,j+3),b.data.slice(j+12,j+15),b.data.slice(j+24,j+27)],id=triangles.push(t)-1;
  const minX=Math.min(...t.map(p=>p[0])),maxX=Math.max(...t.map(p=>p[0])),minZ=Math.min(...t.map(p=>p[2])),maxZ=Math.max(...t.map(p=>p[2]));
  for(let x=Math.floor(minX/4);x<=Math.floor(maxX/4);x++)for(let z=Math.floor(minZ/4);z<=Math.floor(maxZ/4);z++){const key=x+','+z;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(id);}
 }
 let tested=0;
 for(let d=0;d<BRIAR_ROUTE.length;d+=.5){
  const pose=BRIAR_ROUTE.at(d),f=norm([pose.f[0],0,pose.f[2]]),r=[f[2],0,-f[0]],cx=Math.floor(pose.p[0]/4),cz=Math.floor(pose.p[2]/4),ids=new Set();
  for(let x=-1;x<=1;x++)for(let z=-1;z<=1;z++)for(const id of cells.get((cx+x)+','+(cz+z))||[])ids.add(id);
  for(const id of ids){
   let polygon=triangles[id].map(p=>{const v=sub(p,pose.p);return [dot(v,r),v[1],dot(v,f)];});
   if(polygon.every(p=>p[1]<.13)||polygon.every(p=>p[1]>2.48))continue;
   for(const plane of[p=>p[0]+.72,p=>.72-p[0],p=>p[2]+.30,p=>.30-p[2],p=>p[1]-.13,p=>2.48-p[1]]){polygon=briarClip(polygon,plane);if(!polygon.length)break;}
   tested++;assert.ok(polygon.length<3,'new scenic triangle enters rolling-stock envelope at '+d.toFixed(2)+' '+JSON.stringify(triangles[id]));
  }
 }
 const spring=new Builder();briarSpring(spring);let waterClearance=Infinity;
 for(let j=0;j<spring.data.length;j+=12)if([7,87].includes(spring.data[j+9])){const x=spring.data[j],y=spring.data[j+1],z=spring.data[j+2];assert.ok(briarInside(x,z,.5),'spring stays on its scenic peninsula');waterClearance=Math.min(waterClearance,y-briarSurface(x,z));}
 assert.ok(waterClearance>.04,'spring ribbon and source pool stay above the actual carved bed: '+waterClearance);
 assert.ok(BRIAR_SPRING.every((p,i)=>!i||p[2]<BRIAR_SPRING[i-1][2]),'spring flows downhill into the existing river');
 assert.equal(new Set(BRIAR_TREES.map(t=>t[0]+','+t[1])).size,BRIAR_TREES.length,'no duplicate woodland placements');
 assert.equal(getHouseScene('briarwatch').briarwatch.revision,4);
 return {sceneryEnvelopeTriangleChecks:tested,minimumSpringBedClearance:waterClearance};
})()`));

// The full overview must fit the actual camera frustum at both phone widths.
state.run(`(()=>{const q=HOUSE_ROOMS.briarwatch;
 for(const width of[320,390]){const eye=add(q.target,[Math.sin(q.phoneYaw)*Math.cos(q.phonePitch)*q.phoneDistance,Math.sin(q.phonePitch)*q.phoneDistance,Math.cos(q.phoneYaw)*Math.cos(q.phonePitch)*q.phoneDistance]);const vp=mm(perspective(.87,width/844,.1,500),lookAt(eye,q.target));
  for(const x of[-73,71])for(const z of[-56,47])for(const y of[-10.55,0]){const clip=[0,1,2,3].map(i=>vp[i]*x+vp[i+4]*y+vp[i+8]*z+vp[i+12]);assert.ok(Math.abs(clip[0]/clip[3])<.975&&Math.abs(clip[1]/clip[3])<.975&&clip[2]<clip[3],'portrait overview frames the full scenic cabinet');}
 }
})()`);
// A segment-triangle intersection checks actual masonry, not black door decals.
state.run(`
 function briarQASegmentHits(b,a,q){const d=sub(q,a);let hits=0;
  for(let i=0;i<b.data.length;i+=36){const p=b.data.slice(i,i+3),v=b.data.slice(i+12,i+15),w=b.data.slice(i+24,i+27),e1=sub(v,p),e2=sub(w,p),h=cross(d,e2),det=dot(e1,h);if(Math.abs(det)<1e-9)continue;
   const s=sub(a,p),u=dot(s,h)/det;if(u<-1e-8||u>1+1e-8)continue;const r=cross(s,e1),vv=dot(d,r)/det,t=dot(e2,r)/det;if(vv>=-1e-8&&u+vv<=1+1e-8&&t>1e-7&&t<1-1e-7)hits++;
  }return hits;
 }
 const underside=new Builder();briarCabinetUnderside(underside);assert.equal(briarQASegmentHits(underside,[6,0,20],[6,-20,20]),0,'cabinet triangulation does not fill the visitor aisle');assert.ok(briarQASegmentHits(underside,[-40,0,0],[-40,-20,0])>0,'castle peninsula has a closed underside');
 const arch=new Builder();briarArchWall(arch,5.4,8.45,.9,3.7,3.1);
 assert.equal(briarQASegmentHits(arch,[0,2,-2],[0,2,2]),0,'true open arch');
 assert.ok(briarQASegmentHits(arch,[2.4,2,-2],[2.4,2,2])>0,'solid jamb');
 const ruin=new Builder();briarWatchRuin(ruin);const rq=BRIAR_WATCH_RUIN,ruinY=briarSurface(rq.x,rq.z)+.92;
 assert.equal(briarQASegmentHits(ruin,[rq.x,ruinY,rq.z+3.2],[rq.x,ruinY,rq.z+1.1]),0,'ruined watchtower retains a genuine open doorway');
 const curtains=new Builder();for(const [a,q,top]of BRIAR_CURTAINS)briarCurtain(curtains,a,q,top);
 for(const index of[4,6,7,8]){const a=briarCurtainAnchor(index),y=BRIAR.court+2;assert.ok(briarQASegmentHits(curtains,[a.x+a.nx*.1,y,a.z+a.nz*.1],[a.x-a.nx*.7,y,a.z-a.nz*.7])>0,'ivy and rainspout anchors have actual masonry backing');}
 const gate=new Builder();briarGatehouse(gate);assert.equal(briarQASegmentHits(gate,[-24,14.3,8.2],[-24,14.3,1.0]),0,'clear gate passage including open doors and raised portcullis');
 const keep=new Builder();briarKeep(keep);assert.equal(briarQASegmentHits(keep,[-28,16.4,-11.7],[-28,16.4,-15]),0,'stair landing opens into the keep');
`);
// Estate outlooks have depth and actual open casements, not painted panes.
Object.assign(report,state.run(`(()=>{
 const q=BRIAR_OUTLOOK,outlook=new Builder();briarEstateOutlook(outlook,-42,0);
 assert.ok(outlook.data.every(Number.isFinite));const opaque=new Builder();let sky=0,glass=0,windows=0,front=-Infinity,back=Infinity;
 for(let i=0;i<outlook.data.length;i+=36){const m=outlook.data[i+9];if(m!==76)opaque.data.push(...outlook.data.slice(i,i+36));if(m===92)sky+=3;if(m===76)glass+=3;if(m===98)windows+=3;
  for(let j=i;j<i+36;j+=12){assert.ok(outlook.data[j]>=-55&&outlook.data[j]<=-29&&outlook.data[j+2]>=.4&&outlook.data[j+2]<=6,'window scenery stays inside its bounded reveal');if(m===93){front=Math.max(front,outlook.data[j+2]);back=Math.min(back,outlook.data[j+2]);}}
 }
 assert.equal(sky,6);assert.equal(glass,66);assert.ok(windows>0);assert.ok(front-back>2.5,'foreground and distant estate geometry have real parallax depth');
 assert.equal(briarQASegmentHits(opaque,[-40.3,25,1.1],[-40.3,25,4.7]),0,'clear upper casement in front of the sky');
 assert.ok(briarQASegmentHits(opaque,[-40.3,25,.4],[-40.3,25,.9])>0,'closed sky backing behind the view');
 assert.ok(briarQASegmentHits(opaque,[-31.25,25,.4],[-31.25,25,5.2])>0,'solid jamb beside the opening');
 // Above and oblique rays must meet the closed casing before its sky.
 assert.ok(briarQASegmentHits(opaque,[-42,48,8],[-42,42,1.1])>0,'no sky leak above the arch');
 assert.ok(briarQASegmentHits(opaque,[-28,38,8],[-34,38,1.1])>0,'upper side return seals oblique views');
 const again=new Builder();briarEstateOutlook(again,-42,0);assert.deepEqual(again.data,outlook.data,'outlook is deterministic');
 // Receiver UVs retain the same wall-local positions regardless of which
 // wall owns them; the map renderer transforms positions but not these UVs.
 for(const [which,pos,angle,material]of[['back',[0,0,-64],0,94],['left',[-78,0,0],PI/2,95],['front',[0,0,64],PI,96]]){
  const b=new Builder(),points=[[-7,4,.3],[7,4,.3],[7,27,.3],[-7,27,.3]];b.push(...pos,0,angle);b.quad(...points,'#c2bca7',20);b.pop();briarGalleryReceiver(b,which,pos,angle);
  const sequence=[0,1,2,0,2,3];for(let i=0;i<6;i++){assert.equal(b.data[i*12+9],material);assert.ok(Math.abs(b.data[i*12+10]-points[sequence[i]][0])<1e-10);assert.equal(b.data[i*12+11],points[sequence[i]][1]);}
 }
 const scene=getHouseScene('briarwatch');assert.ok(scene.walls.reduce((n,w)=>n+w.mesh.count,0)<40000,'bounded atmosphere wall geometry');
 assert.deepEqual(houseRoomLights('briarwatch').slice(0,4),[[-44,38.7,-45],[44,38.7,-45],[-44,38.7,44],[44,38.7,44]],'pendant lights meet the lowered supported fixtures');
 assert.deepEqual(houseRoomLights('briarwatch').slice(4),[[-24,-14.1,56],[24,-14.1,56]],'native task lights coincide with modeled reading lamps');
 return {estateParallaxDepth:front-back,estateClearPaneVertices:glass*2,galleryWallVertexCeiling:40000};
})()`));
const atmosphereSource=await read('src/railway.js'),skyStart=atmosphereSource.indexOf('vec3 briarEstateSky('),skyEnd=atmosphereSource.indexOf('float briarPracticalWash(',skyStart);
assert.ok(skyStart>0&&skyEnd>skyStart);assert.ok(!/uRoomLevel|uTime/.test(atmosphereSource.slice(skyStart,skyEnd)),'estate sky is independent of dimmer and motion clock');
assert.match(atmosphereSource,/if\(m>=94\.&&m<=96\.\)lit\+=albedo[^\n]*uRoomLevel/,'only opt-in plaster receives the dimmable surface light wash');

// Gallery fittings stay inside the room envelope and outside the railway.
Object.assign(report,state.run(`(()=>{
 const saved=seed,parts=[];
 for(const fn of[briarGalleryClock,briarGalleryCurtains,briarGalleryLantern,briarGalleryBookcase,briarGalleryDrafting,briarGalleryCompass]){
  const a=new Builder(),b=new Builder();fn(a,0,19);fn(b,0,19);
  assert.ok(a.data.length>0&&a.data.every(Number.isFinite),fn.name+' has finite geometry');assert.deepEqual(a.data,b.data,fn.name+' is deterministic');
  assert.equal(a.stack.length,0,fn.name+' balances transforms');parts.push({name:fn.name,vertices:a.data.length/12});
 }
 assert.equal(seed,saved,'gallery details do not consume the shared landscape seed');
 for(const x of[-42,42]){
  const b=new Builder();briarGalleryCurtains(b,x);
  for(let i=0;i<b.data.length;i+=12){const xx=b.data[i],y=b.data[i+1],z=b.data[i+2];assert.ok(Math.abs(xx)<59&&y>=2&&y<44&&z<6,'curtains stay outside the miniature and within the window bay');}
  assert.equal(briarQASegmentHits(b,[x,24,0],[x,24,7]),0,'curtains leave the estate aperture clear');
  assert.ok(b.data.some((v,i)=>i%12===1&&v>=43.17&&b.data[i+8]===23),'fabric pleats reach the actual curtain rail');
 }
 const opal=new Builder();briarGalleryLantern(opal,0,19);let opalVertices=0;for(let i=9;i<opal.data.length;i+=12){assert.notEqual(opal.data[i],25,'large lanterns do not use high-energy bulb material');if(opal.data[i]===100)opalVertices++;}assert.equal(opalVertices,54,'six opal panes and underside');
 const clockFace=new Builder();briarGalleryClock(clockFace);assert.ok(briarQASegmentHits(clockFace,[0,20,0],[0,20,4])>0,'clock has a solid backing and bezel');
 const archive=new Builder();briarGalleryBookcase(archive);
 let low=Infinity;for(let i=0;i<archive.data.length;i+=12){low=Math.min(low,archive.data[i+1]);assert.ok(archive.data[i+2]<5.6&&archive.data[i]>27&&archive.data[i]<53,'archive remains against its owning entrance wall');}
 assert.ok(Math.abs(low-FLOOR)<1e-6,'archive case reaches the actual floor');
 const compass=new Builder();briarGalleryCompass(compass);
 for(let i=0;i<compass.data.length;i+=12){const x=compass.data[i],y=compass.data[i+1],z=compass.data[i+2];assert.ok(!briarInside(x,z),'marquetry stays on visitor floor, not scenery');assert.ok(y>FLOOR&&y<FLOOR+.06,'marquetry is flush, not a visitor obstruction');}
 const floor=new Builder();briarShell(floor);let parquet=0;
 for(let i=0;i<floor.data.length;i+=12)if(floor.data[i+9]===99){parquet++;assert.equal(floor.data[i+10],floor.data[i]);assert.equal(floor.data[i+11],floor.data[i+2]);}
 assert.equal(parquet,36,'only the room floor opts into room-local parquet');
 return {galleryDetails:parts,galleryParquetVertices:parquet,galleryWallVertices:getHouseScene('briarwatch').walls.reduce((n,w)=>n+w.mesh.count,0)};
})()`));
assert.match(atmosphereSource,/if\(m==99\.\)[\s\S]*?vec2 q=vec2\(vUV.x\+vUV.y/,'parquet coordinates remain local in the house map');
assert.match(atmosphereSource,/if\(m==100\.\)lit=min\(lit,vec3\(1\.02\)\)/,'opal radiance stays below the sparse bloom extraction threshold');

// The cove replaces dentils without filling the open ceiling. Upholstered
// benches stay below the miniature and remain wholly on the visitor floor.
Object.assign(report,state.run(`(()=>{
 const saved=seed,coves=[];
 for(const width of[156,128]){
  const a=new Builder(),b=new Builder();briarGalleryCove(a,width);briarGalleryCove(b,width);
  assert.deepEqual(a.data,b.data,'ceiling cove is deterministic');assert.equal(a.stack.length,0);
  assert.ok(a.data.every(Number.isFinite));
  for(let i=0;i<a.data.length;i+=12){const x=a.data[i],y=a.data[i+1],z=a.data[i+2];assert.ok(y>=44.55&&y<49.6&&z>=1&&z<5.8&&Math.abs(x)<width/2,'cove stays in the high perimeter cutaway');}
  coves.push({width,vertices:a.data.length/12});
 }
 const benches=[];
 for(const x of[-24,24]){
  const a=new Builder(),b=new Builder();briarGalleryBench(a,x);briarGalleryBench(b,x);
  assert.deepEqual(a.data,b.data,'bench is deterministic');assert.equal(a.stack.length,0);
  assert.ok(a.data.every(Number.isFinite));let low=Infinity;
  for(let i=0;i<a.data.length;i+=12){const X=a.data[i],y=a.data[i+1],z=a.data[i+2];low=Math.min(low,y);assert.ok(!briarInside(X,z),'bench never enters scenic terrain');assert.ok(Math.abs(X-x)<5.5&&z>48&&z<52&&y>=FLOOR&&y<FLOOR+6.3,'bench respects the surveyed visitor zone');}
  assert.equal(a.data.filter((v,i)=>i%12===9&&v===23).length,180,'six cushion panels use textile shading instead of timber grain');
  assert.ok(Math.abs(low-FLOOR)<1e-5,'bench feet meet the room floor within matrix precision');
  assert.ok(briarQASegmentHits(a,[x,FLOOR+3,50],[x,FLOOR+4.4,50])>0,'upholstered seat has a solid supported surface');
  benches.push({x,vertices:a.data.length/12});
 }
 const lamp=new Builder();briarReadingLamp(lamp,24,56);assert.ok(lamp.data.every(Number.isFinite));assert.ok(!lamp.data.some((v,i)=>i%12===9&&v===25),'reading lamp diffusers avoid the high-energy bloom material');assert.equal(lamp.data.filter((v,i)=>i%12===9&&v===100).length,336,'reading lamp uses bounded opal radiance');
 assert.equal(seed,saved,'finishing details preserve the shared scene seed');
 return {galleryCeilingCoves:coves,galleryUpholsteredBenches:benches};
})()`));

Object.assign(report,state.run(`(()=>{
 const s=getHouseScene('briarwatch'),part=s.movingParts[0],distance=s.trains[0].distance,m=part.model(s),savedClock=clock;clock+=10;
 assert.deepEqual(part.model(s),m,'stationary train gives a stationary mill wheel');clock=savedClock;
 s.trains[0].distance+=1;assert.notDeepEqual(part.model(s),m,'wheel is a working native mechanism');assert.ok(part.model(s).every(Number.isFinite));
 const motion=reduceMotion;reduceMotion=true;const still=part.model(s);s.trains[0].distance+=1;assert.deepEqual(part.model(s),still,'reduced motion freezes mechanism');reduceMotion=motion;s.trains[0].distance=distance;
 const seen=[],oldDraw=draw,oldFormation=drawHouseTrainFormation;draw=(mesh)=>seen.push(mesh);drawHouseTrainFormation=()=>{};try{drawHouseTrains(s,{});}finally{draw=oldDraw;drawHouseTrainFormation=oldFormation;}
 assert.deepEqual(seen,[part.mesh],'mechanism shares native dynamic rendering');
 const a=new Builder(),b=new Builder();briarMillWheel(a);briarMillWheel(b);assert.deepEqual(a.data,b.data,'deterministic mechanism geometry');
 const disposed=[],oldDispose=disposeMesh;disposeMesh=mesh=>{if(mesh)disposed.push(mesh);};
 try{registerHouseRoom('briarwatch',{...HOUSE_ROOMS.briarwatch,build:briarwatchRoom,shell:briarShell});}finally{disposeMesh=oldDispose;}
 for(const mesh of[s.mesh,s.lifeDetails.mesh,part.mesh,...s.walls.map(w=>w.mesh)])assert.ok(disposed.includes(mesh),'all room-owned buffers are released on rebuild');
 assert.ok(!roomScenes.has('briarwatch'));
 return {ownedMeshesReleased:disposed.length};
})()`));
state.run(await read('src/shop-house.js'));
state.run(`assert.equal(SHOP_HOUSE_LAYOUT.byKey.briarwatch.row,4);assert.equal(SHOP_HOUSE_LAYOUT.byKey.briarwatch.column,0);assert.ok(!SHOP_HOUSE_LAYOUT.plots.some(p=>p.id==='west-5'));`);
const html=await read('index.html');for(const file of['briarwatch','briarwatch-castle','briarwatch-village'])assert.ok(html.indexOf('src/rooms/'+file+'.js')>html.indexOf('src/rooms.js')&&html.indexOf('src/rooms/'+file+'.js')<html.indexOf('src/hobby.js'),'module is included before startup and in portable exports');
console.log(JSON.stringify(report,null,2));console.log('Briarwatch native geometry, clearances, open architecture, train circuit, mechanism, credits and map registration verified.');
