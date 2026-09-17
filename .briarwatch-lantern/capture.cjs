'use strict';
const {chromium}=require('/tmp/briarwatch-browser/node_modules/playwright');
const fs=require('node:fs');
const out='evidence/briarwatch-lantern',report={errors:[],console:[],views:[],method:'Actual native application in Chromium/SwiftShader. Animation held and native cameras settled for repeatable stills; not physical-device FPS evidence.'};
fs.mkdirSync(out,{recursive:true});const save=()=>fs.writeFileSync(out+'/browser-report.json',JSON.stringify(report,null,2));
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:1024},deviceScaleFactor:1});page.setDefaultTimeout(150000);
 page.on('pageerror',e=>{report.errors.push(String(e));save();});
 page.on('console',m=>{if(['error','warning'].includes(m.type())){report.console.push({type:m.type(),text:m.text()});save();}});
 await page.addInitScript(()=>{const raf=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>{if(cb.name==='animate'){window.__heldNativeAnimation=cb;return 0;}return raf(cb);};});
 async function shot(name){
  const r=await page.evaluate(()=>{resize();for(let i=0;i<100;i++)updateCamera(1/30);updateUI();render();gl.finish();return {png:canvas.toDataURL('image/png'),state:HOBBY_HOUSE.state,eye:cameraPos.slice(),target:cameraTarget.slice(),night,lamps:roomLampLevel,glError:gl.getError()};});
  fs.writeFileSync(out+'/'+name+'.png',Buffer.from(r.png.split(',')[1],'base64'));delete r.png;report.views.push({name,...r});save();console.log(name);
  if(r.glError)throw new Error('WebGL error '+r.glError);
 }
 const camera=async(target,distance,pitch,yaw)=>page.evaluate(q=>{viewMode='overview';Object.assign(orbit,q);},{target,distance,pitch,yaw});
 try{
  await page.goto('http://127.0.0.1:4175/?room=briarwatch',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.HOBBY_HOUSE?.state.ready&&HOBBY_HOUSE.state.room==='briarwatch'&&!hobby.transition);
  await page.evaluate(()=>{paused=true;hobby.scene.trains[0].distance=145;setView('room',false);setMood('evening',{immediate:true});});await shot('01-evening-gallery');
  await page.evaluate(()=>setMood('day',{immediate:true}));await shot('02-day-gallery');
  await page.evaluate(()=>setMood('evening',{immediate:true}));await camera([0,22,-60],66,.10,.12);await shot('03-clock-and-lanterns');
  await camera([0,20,-61.5],30,.06,.12);await shot('04-clock-detail');
  await camera([42,23,-60],43,.08,.08);await shot('05-curtained-estate');
  await camera([-40,-7,59.5],25,.08,-2.0);await shot('06-railway-archive');
  await camera([2,-17.4,47],27,.55,Math.PI+.20);await shot('07-survey-table');
  await camera([6,-23.9,14],32,1.16,.15);await shot('08-aisle-marquetry');
  await page.evaluate(()=>{setView('room',false);setMood('night',{immediate:true});});await shot('09-night-gallery');
  await page.evaluate(()=>{setMood('evening',{immediate:true});roomLampLevel=roomLampTarget=0;});await shot('10-dimmer-off');
  await page.evaluate(()=>setMood('evening',{immediate:true}));await camera([0,3,-3],179,.69,Math.PI+.19);await shot('11-entrance-cutaway');
  for(const width of[390,320]){
   await page.setViewportSize({width,height:844});await page.evaluate(()=>{setView('room',false);setMood('evening',{immediate:true});});await shot('12-phone-'+width);
   await page.screenshot({path:out+'/12-phone-'+width+'-ui.png'});
  }
  await page.setViewportSize({width:1440,height:1024});await page.evaluate(()=>setView('engine',false));await shot('13-train-view');
  await page.evaluate(()=>{setView('room',false);paused=false;for(let i=0;i<3;i++)window.__heldNativeAnimation(performance.now()+i*16);paused=true;});await shot('14-native-frame-smoke');
  report.renderer=await page.evaluate(()=>({version:gl.getParameter(gl.VERSION),renderer:gl.getParameter(gl.RENDERER),staticVertices:hobby.scene.mesh.count,wallVertices:hobby.scene.walls.map(w=>({which:w.which,vertices:w.mesh.count,opaque:w.mesh.opaqueCount??w.mesh.count,glass:w.mesh.glass?.count||0})),movingVertices:hobby.scene.movingParts[0].mesh.count}));save();
  await page.evaluate(()=>openHouseMap());await shot('15-live-map');await page.evaluate(()=>closeHouseMap());
  await page.evaluate(()=>HOBBY_HOUSE.visit('coast'));await page.waitForFunction(()=>HOBBY_HOUSE.state.room==='coast'&&!hobby.transition);await page.evaluate(()=>{setMood('evening',{immediate:true});setView('room',false);});await shot('16-coast-regression');
  await page.evaluate(()=>HOBBY_HOUSE.visit('briarwatch'));await page.waitForFunction(()=>HOBBY_HOUSE.state.room==='briarwatch'&&!hobby.transition);await page.evaluate(()=>{setMood('evening',{immediate:true});setView('room',false);});await shot('17-return-to-gallery');
 }catch(e){report.fatal=String(e);throw e;}finally{save();await browser.close();}
 if(report.errors.length||report.console.length)throw new Error(JSON.stringify({errors:report.errors,console:report.console}));
})();
