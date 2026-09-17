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
 const again=new Builder();briarEstateOutlook(again,-42,0);assert.deepEqual(again.data,outlook.data,'outlook is deterministic');
 // Receiver UVs retain the same wall-local positions regardless of which
 // wall owns them; the map renderer transforms positions but not these UVs.
 for(const [which,pos,angle,material]of[['back',[0,0,-64],0,94],['left',[-78,0,0],PI/2,95],['front',[0,0,64],PI,96]]){
  const b=new Builder(),points=[[-7,4,.3],[7,4,.3],[7,27,.3],[-7,27,.3]];b.push(...pos,0,angle);b.quad(...points,'#c2bca7',20);b.pop();briarGalleryReceiver(b,which,pos,angle);
  const sequence=[0,1,2,0,2,3];for(let i=0;i<6;i++){assert.equal(b.data[i*12+9],material);assert.ok(Math.abs(b.data[i*12+10]-points[sequence[i]][0])<1e-10);assert.equal(b.data[i*12+11],points[sequence[i]][1]);}
 }
 const scene=getHouseScene('briarwatch');assert.ok(scene.walls.reduce((n,w)=>n+w.mesh.count,0)<40000,'bounded atmosphere wall geometry');
 assert.deepEqual(houseRoomLights('briarwatch').slice(4),[[-24,-14.1,56],[24,-14.1,56]],'native task lights coincide with modeled reading lamps');
 return {estateParallaxDepth:front-back,estateClearPaneVertices:glass*2,galleryWallVertexCeiling:40000};
})()`));
const atmosphereSource=await read('src/railway.js'),skyStart=atmosphereSource.indexOf('vec3 briarEstateSky('),skyEnd=atmosphereSource.indexOf('float briarPracticalWash(',skyStart);
assert.ok(skyStart>0&&skyEnd>skyStart);assert.ok(!/uRoomLevel|uTime/.test(atmosphereSource.slice(skyStart,skyEnd)),'estate sky is independent of dimmer and motion clock');
assert.match(atmosphereSource,/if\(m>=94\.&&m<=96\.\)lit\+=albedo[^\n]*uRoomLevel/,'only opt-in plaster receives the dimmable surface light wash');
