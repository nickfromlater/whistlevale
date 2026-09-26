// Optional review harness; Playwright is installed outside the dependency-free app.
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const out='evidence/orrery';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--disable-dev-shm-usage']});
 const errors=[],report={checks:[],screenshots:[]};
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
  page.on('pageerror',error=>errors.push(String(error)));
  await page.goto('http://127.0.0.1:4175/?room=orrery',{waitUntil:'load',timeout:120000});
  await page.waitForFunction(()=>window.READY&&HOBBY_HOUSE.state.room==='orrery'&&!hobby.transition,null,{timeout:120000});
  if(await page.locator('#dismissHallInvitation').isVisible())await page.locator('#dismissHallInvitation').click();
  await page.evaluate(()=>{paused=true;setMood('evening',{immediate:true,persist:false});updateCamera(10);updateUI();});
  async function capture(name){await page.waitForTimeout(400);await page.screenshot({path:`${out}/${name}.png`});report.screenshots.push(name);}
  report.scene=await page.evaluate(()=>({vertices:hobby.scene.mesh.count,room:hobby.room,routeLength:ORRERY_ROUTE.track.length,seconds:ORRERY_ROUTE.seconds,renderer:gl.getParameter(gl.RENDERER)}));
  await capture('overview');
  await page.evaluate(()=>{setMood('day',{immediate:true,persist:false});});await capture('day');
  for(const [name,index]of [['loop',2],['planet',3],['station',4]]){
   await page.evaluate(i=>{document.querySelectorAll('#roomPlaces button')[i].click();updateCamera(10);},index);await capture(name);
  }
  await page.locator('#orreryBoard').click();
  assert.equal(await page.evaluate(()=>orrerySeatActive()),true);report.checks.push('ticket enters real front seat');
  await page.evaluate(()=>{const t=hobby.scene.trains[0];for(let d=0;d<t.edge.length;d+=.03)if(t.edge.motionAt(d).phase==='Stardrop'){t.distance=d;break;}orreryRide.moving=true;updateCamera(10);updateUI();});
  await capture('front-row');
  await page.locator('#world').focus();await page.keyboard.press('ArrowRight');
  assert.ok(await page.evaluate(()=>orreryRide.yaw<0));
  await page.keyboard.press('Home');assert.equal(await page.evaluate(()=>orreryRide.yaw),0);
  await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>orrerySeatActive()),false);report.checks.push('keyboard look/recenter/exit');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'orreryBoard');report.checks.push('focus restored to ticket');
  const pauseCheck=await page.evaluate(()=>{const t=hobby.scene.trains[0],old=t.distance;paused=true;updateSimulation(.5);const frozen=t.distance===old;paused=false;speed=2.226;updateSimulation(.5);const advanced=t.distance>old;paused=true;return {frozen,advanced};});
  assert.deepEqual(pauseCheck,{frozen:true,advanced:true});report.checks.push('native simulation pause and advance');
  for(const width of [390,320]){
   await page.setViewportSize({width,height:844});
   await page.evaluate(()=>{setView('room',false);const q=HOUSE_ROOMS.orrery;Object.assign(orbit,{target:q.target.slice(),distance:q.phoneDistance,yaw:q.yaw,pitch:q.pitch});updateCamera(10);updateUI();});
   await capture(`phone-${width}`);
   await page.locator('#orreryBoard').click();await capture(`phone-${width}-seat`);
   for(const id of ['orreryMotion','orreryCenter','orreryLeave']){const box=await page.locator('#'+id).boundingBox();assert.ok(box&&box.x>=0&&box.x+box.width<=width&&box.height>=44);}
   await page.locator('#orreryLeave').click();report.checks.push(`${width}px ticket, seat, 44px controls and exit`);
  }
  await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#orreryBoard').click();
  assert.equal(await page.evaluate(()=>orreryRide.moving),false);
  const steady=await page.evaluate(()=>{updateCamera(.1);const a=cameraPos.slice();hobby.scene.trains[0].distance+=10;updateCamera(.1);return a.every((v,i)=>v===cameraPos[i]);});assert.ok(steady);
  await capture('reduced-motion');report.checks.push('reduced motion defaults to truly fixed overlook');
  await page.locator('#orreryLeave').click();await page.emulateMedia({reducedMotion:'no-preference'});
  await page.setViewportSize({width:1440,height:1000});
  await page.evaluate(async()=>{await openHouseMap();});await capture('map');
  assert.equal(await page.evaluate(()=>shopMap.open),true);report.checks.push('native live house map opens');
  await page.evaluate(()=>closeHouseMap());
  await page.evaluate(()=>HOBBY_HOUSE.visit('coast'));await page.waitForFunction(()=>hobby.room==='coast'&&!hobby.transition);
  assert.equal(await page.locator('#orreryTicket').isVisible(),false);
  await page.evaluate(()=>HOBBY_HOUSE.visit('orrery'));await page.waitForFunction(()=>hobby.room==='orrery'&&!hobby.transition);
  assert.equal(await page.locator('#orreryTicket').count(),1);report.checks.push('room navigation hides controls and does not duplicate them');
  assert.deepEqual(errors,[],'uncaught browser errors');report.checks.push('no uncaught browser errors');
 }finally{
  report.errors=errors;fs.writeFileSync(`${out}/browser-report.json`,JSON.stringify(report,null,2));await browser.close();
 }
 console.log('Orrery browser checks passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
