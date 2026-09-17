'use strict';
const {chromium}=require('/tmp/briarwatch-browser/node_modules/playwright');
const fs=require('node:fs');
const phase=process.argv[2]||'after',out='evidence/briarwatch-atmosphere/'+phase;
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const report={errors:[],console:[],views:[],phase,method:'Native URL startup in Chromium/SwiftShader. Animation held and native camera settled for reproducible stills. Not physical-phone or FPS evidence.'};
 const save=()=>fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:1024},deviceScaleFactor:1});page.setDefaultTimeout(150000);
 page.on('pageerror',e=>{report.errors.push(String(e));save();});
 page.on('console',m=>{if(['error','warning'].includes(m.type())){report.console.push({type:m.type(),text:m.text()});save();}});
 await page.addInitScript(()=>{const raf=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>{if(cb.name==='animate'){window.__heldNativeAnimation=cb;return 0;}return raf(cb);};});
 async function shot(name){
  const capture=await page.evaluate(()=>{resize();for(let i=0;i<100;i++)updateCamera(1/30);updateUI();render();gl.finish();return {png:canvas.toDataURL('image/png'),state:HOBBY_HOUSE.state,eye:cameraPos.slice(),target:cameraTarget.slice(),night,lamps:roomLampLevel,glError:gl.getError()};});
  fs.writeFileSync(out+'/'+name+'.png',Buffer.from(capture.png.split(',')[1],'base64'));delete capture.png;report.views.push({name,...capture});save();
  await page.screenshot({path:out+'/'+name+'-ui.png'});console.log(phase,name);
  if(capture.glError)throw new Error('GL error '+capture.glError+' at '+name);
 }
 try{
  await page.goto('http://127.0.0.1:4175/?room=briarwatch',{waitUntil:'networkidle',timeout:150000});
  await page.waitForFunction(()=>window.HOBBY_HOUSE?.state.ready&&HOBBY_HOUSE.state.room==='briarwatch'&&!hobby.transition,{},{timeout:150000});
  await page.evaluate(()=>{paused=true;hobby.scene.trains[0].distance=145;setMood('day',{immediate:true});setView('room',false);});await shot('01-arrival-day');
  await page.evaluate(()=>{setMood('evening',{immediate:true});setView('room',false);});await shot('02-arrival-evening');
  if(phase==='after'){
   await page.evaluate(()=>{viewMode='overview';Object.assign(orbit,{target:[42,23,-60],distance:43,pitch:.08,yaw:.08});setMood('day',{immediate:true});});await shot('03-estate-east-day');
   await page.evaluate(()=>setMood('evening',{immediate:true}));await shot('04-estate-east-evening');
   await page.evaluate(()=>{roomLampTarget=roomLampLevel=0;});await shot('05-estate-east-dimmer-off');
   await page.evaluate(()=>{setMood('evening',{immediate:true});viewMode='overview';Object.assign(orbit,{target:[-42,24,-60],distance:33,pitch:.08,yaw:-.30});});await shot('06-estate-west-evening');
   await page.evaluate(()=>{viewMode='overview';Object.assign(orbit,{target:[-73,21,-15],distance:51,pitch:.18,yaw:PI/2});});await shot('07-sconce-wash');
   await page.evaluate(()=>{viewMode='overview';Object.assign(orbit,{target:[0,-19,51],distance:63,pitch:.36,yaw:PI});});await shot('08-reading-lamps');
   await page.evaluate(()=>{setMood('night',{immediate:true});setView('room',false);});await shot('09-night');
   await page.evaluate(()=>{setMood('evening',{immediate:true});setView('room',false);roomLampTarget=roomLampLevel=0;});await shot('10-room-dimmer-off');
   await page.evaluate(()=>{setMood('evening',{immediate:true});viewMode='overview';Object.assign(orbit,{target:[0,3,-3],distance:179,pitch:.69,yaw:PI+.19});});await shot('11-reverse-cutaway');
   await page.evaluate(()=>{setMood('evening',{immediate:true});setView('engine',false);});await shot('12-train-view');
   for(const width of[390,320]){
    await page.setViewportSize({width,height:844});await page.evaluate(()=>{setMood('evening',{immediate:true});setView('room',false);});await shot('13-phone-'+width);
   }
   await page.setViewportSize({width:1440,height:1024});
   await page.evaluate(()=>{setView('room',false);setMood('evening',{immediate:true});paused=false;for(let i=0;i<3;i++)window.__heldNativeAnimation(performance.now()+i*16);paused=true;});await shot('14-native-frame-smoke');
   report.renderer=await page.evaluate(()=>({version:gl.getParameter(gl.VERSION),renderer:gl.getParameter(gl.RENDERER),staticVertices:hobby.scene.mesh.count,wallVertices:hobby.scene.walls.map(w=>({which:w.which,vertices:w.mesh.count,glass:w.mesh.glass?.count||0})),movingVertices:hobby.scene.movingParts[0].mesh.count}));
   await page.evaluate(async()=>{await openHouseMap();});await shot('15-live-house-map');
  }
 }catch(error){report.fatal=String(error);throw error;}finally{save();await browser.close();}
 if(report.errors.length)throw new Error(report.errors.join('\n'));
})();
