import assert from 'node:assert/strict';
import {communityContext,loadCommunity,loadContributionDefinitions,prepareCommunityGeometry,read} from './community-lib.mjs';
const state=await communityContext();state.context.assert=assert;
await loadContributionDefinitions(state,await loadCommunity());prepareCommunityGeometry(state);
const report=state.run(`(()=>{
 const bounds=b=>{const r={x0:Infinity,x1:-Infinity,z0:Infinity,z1:-Infinity,y0:Infinity,y1:-Infinity};for(let i=0;i<b.data.length;i+=12){const [x,y,z]=b.data.slice(i,i+3);assert.ok(Number.isFinite(x+y+z));r.x0=Math.min(r.x0,x);r.x1=Math.max(r.x1,x);r.z0=Math.min(r.z0,z);r.z1=Math.max(r.z1,z);r.y0=Math.min(r.y0,y);r.y1=Math.max(r.y1,y);}return r;};
 const palazzi=VENETIAN_BLOCKS.map(o=>{const b=new Builder();venetianPalazzo(b,venetianBuildingSpec(o));return{...bounds(b),id:o.id};});
 const houses=VENETIAN_CALLE_BLOCKS.map((o,i)=>{const b=new Builder();venetianCalleHouse(b,o);const r=bounds(b);assert.ok(Math.abs(r.y0-VENETIAN.quay)<1e-7,'house foundation meets the paving');for(let j=0;j<b.data.length;j+=12){const x=b.data[j],z=b.data[j+2];assert.ok(!venetianIsWater(x,z),'secondary house stays on dry land');assert.ok(Math.abs(x)<57&&Math.abs(z)<36,'new roofs clear perimeter railway');}return{...r,id:'calle-'+i};});
 const landmark=new Builder();venetianLacePalace(landmark);const lace={...bounds(landmark),id:'lace'};
 const all=[...palazzi,...houses,lace];
 for(let i=0;i<all.length;i++)for(let j=0;j<i;j++){const a=all[i],b=all[j];assert.ok(a.x1<=b.x0||a.x0>=b.x1||a.z1<=b.z0||a.z0>=b.z1,'authored envelopes overlap: '+a.id+' / '+b.id);}
 for(const o of [lace,...houses])for(const bridge of VENETIAN_BRIDGES){const z=venetianCenter(bridge.x),half=bridge.width/2+.3;assert.ok(o.x1<=bridge.x-half||o.x0>=bridge.x+half||o.z1<=z-11.7||o.z0>=z+11.7,'new architecture blocks bridge: '+o.id);}
 // Intersect the actual pierced-stone triangles: a quatrefoil is an aperture,
 // not a dark decal; its surrounding masonry still has thickness.
 const rose=new Builder();venetianPiercedRose(rose,0,0,0,.43,1.2,.5,.22);
 const hit=(x,y)=>{for(let i=0;i<rose.data.length;i+=36){const a=rose.data.slice(i,i+3),b=rose.data.slice(i+12,i+15),c=rose.data.slice(i+24,i+27);const den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(den)<1e-8)continue;const u=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/den,v=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/den;if(u>=0&&v>=0&&u+v<=1)return true;}return false;};
 for(const p of[[0,0],[.30,0],[0,.30]])assert.equal(hit(...p),false,'pierced opening is clear');assert.equal(hit(.86,.20),true,'pierced band retains surrounding masonry');
 // Every stepped shop must open into the stair aisle, not turn a blank
 // backing wall towards visitors. Trace through the actual middle of its counter opening.
 const shopGeometry=new Builder();venetianBridgeShops(shopGeometry,8.4);
 for(const side of[-1,1])for(const x of[-7,-4.45,4.45,7]){
  const y=venetianBridgeHeight(x-Math.sign(x)*1.14)+1.55,eye=[x,y,0],direction=[0,0,side*3.19],d=shopGeometry.data;
  for(let j=0;j<d.length;j+=36){
   const a=d.slice(j,j+3),b=d.slice(j+12,j+15),c=d.slice(j+24,j+27),e1=sub(b,a),e2=sub(c,a),h=cross(direction,e2),det=dot(e1,h);if(Math.abs(det)<1e-8)continue;
   const u=dot(sub(eye,a),h)/det;if(u<0||u>1)continue;const q=cross(sub(eye,a),e1),v=dot(direction,q)/det;if(v<0||u+v>1)continue;const t=dot(e2,q)/det;
   assert.ok(t<0||t>1,'shop counter must face the pedestrian aisle');
  }
 }
 // Hands follow the physical oar handle without stretching the two-link
 // arms; the blade both immerses and lifts rather than orbiting above water.
 let low=Infinity,high=-Infinity;
 for(let j=0;j<120;j++){
  const scene={venetian:{time:j*TAU/(120*1.25)}};
  for(const side of[-1,1]){const arm=venetianRowingArm(scene,0,side);assert.ok(arm.distance<arm.upper+arm.lower&&arm.distance>Math.abs(arm.upper-arm.lower),'hand is within physical reach');assert.ok(Math.abs(len(sub(arm.elbow,arm.shoulder))-arm.upper)<1e-6);assert.ok(Math.abs(len(sub(arm.hand,arm.elbow))-arm.lower)<1e-6);}
  const tip=transform(VENETIAN_OAR_BLADE[2],venetianOarLocal(scene,0));low=Math.min(low,tip[1]);high=Math.max(high,tip[1]);
 }
 assert.ok(low<-.08&&high>.10,'oar blade enters and leaves the waterline');
 // Trace the authored desktop palace camera through actual world geometry.
 // Stop short of its own reveals: a foreground bridge roof must not be the view.
 const camera=getHouseScene('venetian').spots.find(s=>s.name==='The lace palace');
 const eye=add(camera.target,[Math.sin(camera.yaw)*Math.cos(camera.pitch)*camera.distance,Math.sin(camera.pitch)*camera.distance,Math.cos(camera.yaw)*Math.cos(camera.pitch)*camera.distance]);
 const viewGeometry=new Builder();venetianArchitecture({},viewGeometry);venetianCityEnsemble(viewGeometry);for(const bridge of VENETIAN_BRIDGES)venetianBridge(viewGeometry,bridge);
 const data=viewGeometry.data;
 for(const target of[[12,5.5,-6.95],[17.5,5.5,-6.95],[23,5.5,-6.95]]){
  const direction=sub(target,eye);
  for(let j=0;j<data.length;j+=36){
   const a=data.slice(j,j+3),b=data.slice(j+12,j+15),c=data.slice(j+24,j+27),e1=sub(b,a),e2=sub(c,a),h=cross(direction,e2),det=dot(e1,h);if(Math.abs(det)<1e-8)continue;
   const u=dot(sub(eye,a),h)/det;if(u<0||u>1)continue;const q=cross(sub(eye,a),e1),v=dot(direction,q)/det;if(v<0||u+v>1)continue;const t=dot(e2,q)/det;
   assert.ok(t<=.001||t>.975,'palace view is obscured by foreground geometry');
  }
 }
 // Reflection projection fixes every point on the water plane, and mirrors
 // equal distances above/below it. The world geometry itself is never moved.
 const matrix=venetianReflectedVP(I);
 for(const x of[-50,0,50])for(const z of[-4,0,4]){const p=[x,VENETIAN.water,z],q=transform(p,matrix);assert.ok(len(sub(p,q))<1e-6,'Float32 mirror fixes the water plane');}
 assert.ok(Math.abs(transform([4,9,-3],matrix)[1]-(2*VENETIAN.water-9))<1e-6);
 for(const [w,h,phone]of[[1440,1024,false],[390,844,true],[7680,4320,false],[1,1,true]]){const [x,y]=venetianReflectionSize(w,h,phone);assert.ok(x>0&&y>0&&Math.max(x,y)<=(phone?512:896));assert.ok(x*y*6<=896*896*6,'bounded color/depth payload');}
 return{canalPalazzi:palazzi.length,secondaryHouses:houses.length,landmarks:1,openBridgeShops:8,quatrefoilVertices:rose.data.length/12};
})()`);
const renderer=await read('src/rooms/venetian-render.js'),railway=await read('src/railway.js');
assert.match(renderer,/isShopMapActive\(\)/,'live map uses fallback');
assert.match(renderer,/finally\s*\{/,'render state is restored after failure');
assert.match(renderer,/deleteFramebuffer/);assert.match(renderer,/deleteTexture/);assert.match(renderer,/deleteRenderbuffer/);
assert.match(renderer,/gl\.frontFace\(facing\)/,'mirror winding is restored');
assert.match(railway,/uVenetianReflectionPass>.5&&\(vPos.y<-.64/,'waterline clip is active only inside mirror pass');
assert.match(renderer,/gl\.bindTexture\(gl\.TEXTURE_2D,null\)/,'never sample attached reflection target');
console.log('Venetian craft: district envelopes, real tracery openings and bounded reflection projection passed.');
console.log(JSON.stringify(report,null,2));
