const {chromium}=require(process.env.PLAYWRIGHT_PATH);
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {execFileSync}=require('node:child_process');
const root='evidence/integration-48-49';
const report={source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),tree:execFileSync('git',['rev-parse','HEAD^{tree}'],{encoding:'utf8'}).trim(),checks:[],errors:[],method:'Chromium 140 / SwiftShader. Both rooms in the same application and actual downloaded portable files. Synthetic input and stepped simulation, not physical iPhone certification.'};
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--disable-dev-shm-usage']});
 async function context(offline=false){
  const c=await browser.newContext({viewport:{width:960,height:720},deviceScaleFactor:1});
  await c.addInitScript(()=>{const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=fn=>fn.name==='animate'?0:raf(fn);});
  if(offline)await c.setOffline(true);
  const p=await c.newPage();p.setDefaultTimeout(180000);p.on('pageerror',e=>report.errors.push(String(e)));
  return {c,p};
 }
 async function ready(p,room){await p.waitForFunction(room=>window.HOBBY_HOUSE?.state.ready&&hobby.room===room&&!hobby.transition,room);}
 async function visit(p,room){await p.evaluate(room=>HOBBY_HOUSE.visit(room),room);await ready(p,room);}
 async function inspect(p,label){
  const registration=await p.evaluate(()=>({venetian:HOUSE_ROOMS.venetian.map.plot,orrery:HOUSE_ROOMS.orrery.map.plot,venetianModules:[...document.scripts].filter(s=>s.src.includes('/venetian')).length,orreryControls:document.querySelectorAll('#orreryTicket').length}));
  assert.equal(registration.venetian,'east-7');assert.equal(registration.orrery,'east-6');assert.equal(registration.orreryControls,1);
  await visit(p,'venetian');
  const venice=await p.evaluate(()=>{paused=false;reduceMotion=false;const s=hobby.scene,before=s.venetian.time;updateSimulation(.5);resize();updateCamera(20);render();gl.finish();return {advanced:s.venetian.time>before,reflection:!!venetianReflection&&!venetianReflection.failed,parts:s.movingParts.length,glError:gl.getError()};});
  assert.deepEqual(venice,{advanced:true,reflection:true,parts:29,glError:0});
  await visit(p,'orrery');
  assert.equal(await p.evaluate(()=>{resize();updateCamera(20);render();gl.finish();return venetianReflection===null;}),true);
  await p.evaluate(()=>{orreryBoardFromStation();orreryDispatch();});
  const ride=await p.evaluate(()=>{const t=hobby.scene.trains[0],d=t.distance;updateSimulation(.5);resize();updateCamera(20);render();gl.finish();return {moving:t.distance>d,state:orreryRide.trip.state,parts:hobby.scene.movingParts.length,glError:gl.getError()};});
  assert.deepEqual(ride,{moving:true,state:'riding',parts:12,glError:0});
  await p.evaluate(async()=>{await openHouseMap();});
  const map=await p.evaluate(()=>{
   const v=roomScenes.get('venetian'),o=roomScenes.get('orrery');
   const capture=()=>({v:v.venetian.time,vt:v.trains[0].distance,ot:o.trains[0].distance});
   paused=false;const before=capture();updateSimulation(.5);const after=capture();paused=true;updateSimulation(.5);const stopped=capture();
   resize();updateCamera(20);render();gl.finish();
   const plots=['venetian','orrery'].map(key=>{const room=SHOP_HOUSE_LAYOUT.byKey[key];return (room.column===1?'east':'west')+'-'+(room.row+1);});
   return {active:shopMap.active,plots,before,after,stopped,reflectionReleased:venetianReflection===null,tripReleased:orreryRide.trip===null,glError:gl.getError()};
  });
  assert.equal(map.active,true);assert.deepEqual(map.plots,['east-7','east-6']);assert.equal(map.reflectionReleased,true);assert.equal(map.tripReleased,true);assert.equal(map.glError,0);
  for(const key of ['v','vt','ot'])assert.ok(map.after[key]>map.before[key],label+' live map advances '+key);
  assert.deepEqual(map.after,map.stopped);
  await p.screenshot({path:path.join(root,label+'-map.png')});
  await p.evaluate(()=>closeHouseMap());await visit(p,'venetian');
  const restored=await p.evaluate(()=>{resize();updateCamera(20);render();gl.finish();return {reflection:!!venetianReflection&&!venetianReflection.failed,ticketHidden:document.querySelector('#orreryTicket').hidden,glError:gl.getError()};});
  assert.deepEqual(restored,{reflection:true,ticketHidden:true,glError:0});
  report.checks.push({label,registration,venice,ride,map,restored});
 }
 try{
  const {c,p}=await context();await p.goto('http://127.0.0.1:4175/?room=venetian',{waitUntil:'domcontentloaded'});await ready(p,'venetian');await inspect(p,'combined-source');await c.close();
  for(const file of ['evidence/venetian/whistlevale-portable.html','evidence/orrery/whistlevale.html']){
   const {c,p}=await context(true);await p.goto(pathToFileURL(path.resolve(file)).href+'?room=venetian',{waitUntil:'domcontentloaded'});await ready(p,'venetian');await inspect(p,file.includes('/venetian/')?'venetian-export':'orrery-export');await c.close();
  }
  assert.deepEqual(report.errors,[]);report.passed=true;
 }catch(e){report.failure=String(e.stack||e);throw e;}finally{fs.writeFileSync(path.join(root,'combined-browser-report.json'),JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
