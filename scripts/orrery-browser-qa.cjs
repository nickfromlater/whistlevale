// Optional review harness; Playwright is installed outside the dependency-free app.
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const path=require('node:path');const {pathToFileURL}=require('node:url');
const out='evidence/orrery';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--disable-dev-shm-usage']});
 const errors=[],report={checks:[],screenshots:[],method:'Native WebGL/SwiftShader; animation RAF held for stills, actual render() and gl.finish(), with separate native motion check. Not physical-device or FPS evidence.'};
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1,acceptDownloads:true});
  await context.addInitScript(()=>{
   const raf=window.requestAnimationFrame.bind(window);let held=null,frozen=true;
   window.requestAnimationFrame=callback=>{if(frozen&&callback.name==='animate'){held=callback;return 0;}return raf(callback);};
   window.__reviewFreeze=()=>{frozen=true;};window.__reviewResume=()=>{frozen=false;if(held){const fn=held;held=null;raf(fn);}};
  });
  const page=await context.newPage();page.setDefaultTimeout(120000);
  page.on('pageerror',error=>errors.push(String(error)));
  await page.goto('http://127.0.0.1:4175/?room=orrery',{waitUntil:'load',timeout:120000});
  await page.waitForFunction(()=>window.READY&&HOBBY_HOUSE.state.room==='orrery'&&!hobby.transition,null,{timeout:120000});
  if(await page.locator('#dismissHallInvitation').isVisible())await page.locator('#dismissHallInvitation').click();
  await page.evaluate(()=>{paused=true;setMood('evening',{immediate:true,persist:false});updateCamera(10);updateUI();});
  async function capture(name,target=page){
   console.log('Capture',name);
   const shot=await target.evaluate(()=>{resize();updateCamera(20);updateUI();render();gl.finish();return {png:canvas.toDataURL('image/png'),error:gl.getError()};});
   assert.equal(shot.error,0,name+' native WebGL');fs.writeFileSync(`${out}/${name}-canvas.png`,Buffer.from(shot.png.split(',')[1],'base64'));
   await target.screenshot({path:`${out}/${name}.png`,animations:'disabled',timeout:120000});report.screenshots.push(name);
  }
  report.scene=await page.evaluate(()=>({vertices:hobby.scene.mesh.count,room:hobby.room,routeLength:ORRERY_ROUTE.track.length,seconds:ORRERY_ROUTE.seconds,renderer:gl.getParameter(gl.RENDERER)}));
  await capture('overview');
  await page.evaluate(()=>{setMood('day',{immediate:true,persist:false});});await capture('day');
  for(const [name,index]of [['loop',2],['planet',3],['station',4],['clockwork',6]]){
   await page.evaluate(i=>{document.querySelectorAll('#roomPlaces button')[i].click();updateCamera(10);},index);await capture(name);
  }
  await page.locator('#orreryBoard').click();
  assert.equal(await page.evaluate(()=>orrerySeatActive()),true);
  assert.equal(await page.evaluate(()=>orreryRide.trip.state),'boarding');
  assert.equal(await page.evaluate(()=>hobby.scene.trains[0].speed),0);
  assert.equal(await page.evaluate(()=>document.activeElement.id),'orreryDispatch');
  await capture('boarding-seat');
  await page.locator('#orreryDispatch').click();
  assert.equal(await page.evaluate(()=>orreryRide.trip.state),'riding');
  const circuit=await page.evaluate(()=>{
   const phases=new Set(),t=hobby.scene.trains[0];let steps=0;
   while(orreryRide.trip.state==='riding'&&steps++<3000){updateSimulation(.05);phases.add(t.edge.motionAt(t.distance).phase);}
   updateUI();return {state:orreryRide.trip.state,phases:[...phases],speed:t.speed,progress:orreryTripProgress(),paused};
  });
  assert.equal(circuit.state,'arrived');assert.equal(circuit.speed,0);assert.equal(circuit.progress,1);assert.equal(circuit.paused,false);
  for(const phase of ['Chain lift','Stardrop','Lunar loop','Ring run','Brake run'])assert.ok(circuit.phases.includes(phase),phase+' actually traversed');
  assert.equal(await page.locator('#orreryDispatch').textContent(),'Ride again');
  await capture('arrival-seat');report.checks.push('full native-simulation circuit, every hero section, station arrival, open gates, replay and no global pause');
  await page.locator('#orreryDispatch').click();
  await page.evaluate(()=>{paused=true;});report.checks.push('ticket enters a waiting front seat and explicit dispatch starts a complete trip');
  await page.evaluate(()=>{const t=hobby.scene.trains[0];for(let d=0;d<t.edge.length;d+=.03)if(t.edge.motionAt(d).phase==='Stardrop'){t.distance=d;break;}orreryRide.moving=true;updateCamera(10);updateUI();});
  await capture('front-row');
  await page.evaluate(()=>{const t=hobby.scene.trains[0],section=t.edge.track.sections[5],target=(section.start+section.end)/2;let best=Infinity;for(let d=0;d<t.edge.length;d+=.03){const delta=Math.abs(t.edge.motionAt(d).s-target);if(delta<best){best=delta;t.distance=d;}}});
  assert.ok(await page.evaluate(()=>orrerySeatPose(hobby.scene.trains[0]).up[1]<-.95));await capture('front-row-inversion');report.checks.push('actual inverted front-seat pose and native render');
  await page.locator('#world').focus();await page.keyboard.press('ArrowRight');
  assert.ok(await page.evaluate(()=>orreryRide.yaw<0));
  await page.keyboard.press('Home');assert.equal(await page.evaluate(()=>orreryRide.yaw),0);
  await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>orrerySeatActive()),false);report.checks.push('keyboard look/recenter/exit');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'orreryBoard');report.checks.push('focus restored to ticket');
  const pauseCheck=await page.evaluate(()=>{const t=hobby.scene.trains[0],old=t.distance;paused=true;updateSimulation(.5);const frozen=t.distance===old;paused=false;speed=2.226;updateSimulation(.5);const advanced=t.distance>old;paused=true;return {frozen,advanced};});
  assert.deepEqual(pauseCheck,{frozen:true,advanced:true});report.checks.push('native simulation pause and advance');
  for(const width of [390,320]){
   await page.setViewportSize({width,height:844});
   await page.evaluate(()=>{setView('room',false);updateCamera(10);updateUI();});
   await capture(`phone-${width}`);
   const fits=await page.evaluate(()=>[-60,60].every(x=>[-49,49].every(z=>{const p=project([x,0,z]);return p.visible&&p.x>3&&p.x<innerWidth-3;})));
   assert.ok(fits,`${width}px overview contains the whole miniature's corners`);
   await page.locator('#orreryBoard').click();await capture(`phone-${width}-seat`);
   for(const id of ['orreryDispatch','orreryMotion','orreryCenter','orreryLeave']){const box=await page.locator('#'+id).boundingBox();assert.ok(box&&box.x>=0&&box.x+box.width<=width&&box.height>=44);}
   await page.locator('#orreryDispatch').click();
   await page.evaluate(()=>{paused=true;
    const event=(type,id,x,y)=>canvas.dispatchEvent(new PointerEvent(type,{pointerId:id,pointerType:'touch',clientX:x,clientY:y,bubbles:true,cancelable:true}));
    event('pointerdown',101,90,320);event('pointerdown',102,205,320);event('pointermove',102,260,320);event('pointercancel',101,90,320);event('pointerup',102,260,320);
   });
   assert.ok(await page.evaluate(()=>orreryRide.zoom<1&&orreryRide.pointers.size===0));
   await page.locator('#orreryLeave').click();report.checks.push(`${width}px ticket, seat, 44px controls, synthetic pinch/cancel and exit`);
  }
  await page.locator('#orreryBoard').click();
  await page.evaluate(()=>{document.querySelectorAll('#roomPlaces button')[2].click();updateCamera(.1);});assert.equal(await page.evaluate(()=>orreryRide.mounted),false);
  await page.locator('#orreryBoard').click();await page.locator('#orreryLeave').click();
  assert.ok(await page.evaluate(()=>orbit.target.every((v,i)=>v===hobby.scene.spots[2].target[i])));report.checks.push('direct viewpoint change releases the seat and reboarding saves the new view');
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>!orreryRide.moving);await page.locator('#orreryBoard').click();
  assert.equal(await page.evaluate(()=>orreryRide.moving),false);
  const steady=await page.evaluate(()=>{updateCamera(.1);const a=cameraPos.slice();hobby.scene.trains[0].distance+=10;updateCamera(.1);return a.every((v,i)=>v===cameraPos[i]);});assert.ok(steady);
  await capture('reduced-motion');report.checks.push('reduced motion defaults to truly fixed overlook');
  await page.locator('#orreryLeave').click();await page.emulateMedia({reducedMotion:'no-preference'});
  assert.equal(await page.evaluate(()=>orreryRide.moving),false);report.checks.push('removing the OS motion preference does not silently start an inverting camera');
  await page.setViewportSize({width:1440,height:1000});
  await page.evaluate(async()=>{await openHouseMap();});await page.waitForFunction(()=>shopMap.open&&!shopMap.loading);await capture('map');
  assert.equal(await page.evaluate(()=>shopMap.open),true);report.checks.push('native live house map opens');
  await page.evaluate(()=>closeHouseMap());
  await page.evaluate(()=>HOBBY_HOUSE.visit('coast'));await page.waitForFunction(()=>hobby.room==='coast'&&!hobby.transition);
  assert.equal(await page.locator('#orreryTicket').isVisible(),false);
  await page.evaluate(()=>HOBBY_HOUSE.visit('orrery'));await page.waitForFunction(()=>hobby.room==='orrery'&&!hobby.transition);
  assert.equal(await page.locator('#orreryTicket').count(),1);report.checks.push('room navigation hides controls and does not duplicate them');
  await page.locator('#orreryBoard').click();
  await page.locator('#orreryDispatch').click();
  if(!await page.evaluate(()=>orreryRide.moving))await page.locator('#orreryMotion').click();
  const baseline=await page.evaluate(()=>({frame,distance:hobby.scene.trains[0].distance}));
  await page.evaluate(()=>{paused=false;window.__reviewResume();});await page.waitForTimeout(1500);
  const moved=await page.evaluate(()=>{window.__reviewFreeze();paused=true;return {frame,distance:hobby.scene.trains[0].distance,active:orrerySeatActive()};});
  assert.ok(moved.frame>baseline.frame&&moved.distance>baseline.distance&&moved.active);report.checks.push({nativeMovingFrames:moved.frame-baseline.frame,nativeTravel:moved.distance-baseline.distance});
  // Pack the actual application, save its download, then reopen it offline.
  // No surrogate HTML, file-origin workaround or replacement renderer.
  const downloading=page.waitForEvent('download',{timeout:120000});
  await page.evaluate(()=>exportPlayable());
  const download=await downloading,saved=path.resolve(out,'whistlevale.html');await download.saveAs(saved);
  const packed=fs.readFileSync(saved,'utf8');
  assert.ok(packed.includes('orreryBoardFromStation')&&packed.includes('orreryClockwork'));
  const portableContext=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1});
  await portableContext.addInitScript(()=>{const raf=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=fn=>fn.name==='animate'?0:raf(fn);});
  await portableContext.setOffline(true);const portable=await portableContext.newPage();portable.setDefaultTimeout(120000);
  portable.on('pageerror',error=>errors.push('portable: '+String(error)));
  await portable.goto(pathToFileURL(saved).href+'?room=orrery',{waitUntil:'load',timeout:120000});
  await portable.waitForFunction(()=>window.READY&&hobby.room==='orrery'&&!hobby.transition,null,{timeout:120000});
  if(await portable.locator('#dismissHallInvitation').isVisible())await portable.locator('#dismissHallInvitation').click();
  assert.equal(await portable.locator('#orreryTicket').count(),1);assert.equal(await portable.locator('#orrerySeat').count(),1);
  assert.equal(await portable.evaluate(()=>orreryRide.trip),null);
  await portable.locator('#orreryBoard').click();await portable.locator('#orreryDispatch').click();
  const portableTrip=await portable.evaluate(()=>{const t=hobby.scene.trains[0],d=t.distance;updateSimulation(.5);updateUI();return {moving:t.distance>d,state:orreryRide.trip.state,mechanisms:hobby.scene.movingParts.length};});
  assert.deepEqual(portableTrip,{moving:true,state:'riding',mechanisms:10});
  await capture('offline-portable-seat',portable);await portableContext.close();
  report.checks.push('actual downloaded standalone HTML reopened offline: one control set, fresh trip, working dispatch, native motion and all mechanisms');
  assert.deepEqual(errors,[],'uncaught browser errors');report.checks.push('no uncaught browser errors');
 }catch(error){report.failure=String(error.stack||error);throw error;}finally{
  report.errors=errors;fs.writeFileSync(`${out}/browser-report.json`,JSON.stringify(report,null,2));await browser.close();
 }
 console.log('Orrery browser checks passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
