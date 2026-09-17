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
 assert.ok(s.height(0,0)===briarSurface(0,0));
 return {room:'briarwatch',sceneVertices:s.mesh.count,wallVertices:s.walls.map(w=>w.mesh.count),movingVertices:s.movingParts[0].mesh.count,viewpoints:s.spots.length,buildings:BRIAR_BUILDINGS.length,trees:BRIAR_TREES.length};
})()`);
Object.assign(report,state.run(`(()=>{
 const e=BRIAR_ROUTE;assert.ok(len(sub(e.at(0).p,e.at(e.length).p))<1e-8);assert.ok(dot(e.at(0).f,e.at(e.length).f)>.9999);
 let clearance=Infinity,grade=0;
 for(let d=0;d<e.length;d+=.17){const p=e.at(d),r=norm([p.f[2],0,-p.f[0]]);grade=Math.max(grade,Math.abs(p.f[1]));
  assert.ok(Math.abs(p.p[0])<60&&Math.abs(p.p[2])<42);
  for(const side of[-.8,0,.8]){const x=p.p[0]+side*r[0],z=p.p[2]+side*r[2];if(!briarInTunnel(x,z,2))clearance=Math.min(clearance,p.p[1]-briarSurface(x,z));}
 }
 assert.ok(grade<1e-9,'level continuous railway');assert.ok(clearance>.20,'finished triangle mesh clears the running envelope: '+clearance);
 const g=BRIAR_GRID;
 for(let i=0;i<120;i++)for(const [u,v]of[[.17,.29],[.73,.82]]){
  const ix=i*31%g.nx,iz=i*19%g.nz,x=-62+ix*g.dx,z=-44+iz*g.dz,a=briarRawHeight(x,z),r=briarRawHeight(x+g.dx,z),f=briarRawHeight(x,z+g.dz),q=briarRawHeight(x+g.dx,z+g.dz);
  const y=u+v<=1?a+(r-a)*u+(f-a)*v:q+(f-q)*(1-u)+(r-q)*(1-v);
  assert.ok(Math.abs(briarSurface(x+u*g.dx,z+v*g.dz)-y)<1e-9,'props sample the actual emitted triangles');
 }
 for(let z=-43;z<44;z+=.5)assert.ok(briarSurface(briarRiverX(z),z)<BRIAR.water,'continuous submerged channel');
 for(let x=BRIAR_TUNNEL.x0+.3;x<BRIAR_TUNNEL.x1;x+=.4)assert.ok(briarSurface(x,BRIAR_TUNNEL.z)>BRIAR.rail+3.1,'real rock roof above tunnel intrados');
 return {routeLength:e.length,maxGrade:grade,minimumTrackTerrainClearance:clearance};
})()`));
let treeClearance=Infinity;
for(let i=0;i<report.trees;i++){
 const c=state.run(`(()=>{const t=BRIAR_TREES[${i}],b=new Builder();briarTree(b,...t);let c=Infinity;
  for(let j=0;j<b.data.length;j+=12){const x=b.data[j],y=b.data[j+1],z=b.data[j+2];assert.ok(Math.abs(x)<62&&Math.abs(z)<44,'tree stays on the layout');if(y>BRIAR.rail-.12&&y<BRIAR.rail+2.6)c=Math.min(c,briarRailNear(x,z).distance);}
  return c;
 })()`);treeClearance=Math.min(treeClearance,c);
}
assert.ok(treeClearance>1.2,'branches and roots clear rolling stock');report.minimumTreeRailClearance=treeClearance;
// A segment-triangle intersection checks actual masonry, not black door decals.
state.run(`
 function briarQASegmentHits(b,a,q){const d=sub(q,a);let hits=0;
  for(let i=0;i<b.data.length;i+=36){const p=b.data.slice(i,i+3),v=b.data.slice(i+12,i+15),w=b.data.slice(i+24,i+27),e1=sub(v,p),e2=sub(w,p),h=cross(d,e2),det=dot(e1,h);if(Math.abs(det)<1e-9)continue;
   const s=sub(a,p),u=dot(s,h)/det;if(u<-1e-8||u>1+1e-8)continue;const r=cross(s,e1),vv=dot(d,r)/det,t=dot(e2,r)/det;if(vv>=-1e-8&&u+vv<=1+1e-8&&t>1e-7&&t<1-1e-7)hits++;
  }return hits;
 }
 const arch=new Builder();briarArchWall(arch,5.4,8.45,.9,3.7,3.1);
 assert.equal(briarQASegmentHits(arch,[0,2,-2],[0,2,2]),0,'true open arch');
 assert.ok(briarQASegmentHits(arch,[2.4,2,-2],[2.4,2,2])>0,'solid jamb');
 const gate=new Builder();briarGatehouse(gate);assert.equal(briarQASegmentHits(gate,[-24,14.3,8.2],[-24,14.3,1.0]),0,'clear gate passage including open doors and raised portcullis');
 const keep=new Builder();briarKeep(keep);assert.equal(briarQASegmentHits(keep,[-28,16.4,-11.7],[-28,16.4,-15]),0,'stair landing opens into the keep');
`);
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
