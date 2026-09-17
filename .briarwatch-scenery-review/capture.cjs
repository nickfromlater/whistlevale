'use strict';
const {chromium}=require('/tmp/briarwatch-browser/node_modules/playwright');
const fs=require('node:fs');
const output='evidence/briarwatch-scenery';
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:1024},deviceScaleFactor:1});
 page.setDefaultTimeout(150000);
 const report={errors:[],console:[],views:[],method:'Actual unmodified native WebGL room loaded by URL in Chromium/SwiftShader. Only the animation RAF is held and cameras are manually settled for reproducible stills. Not an FPS or physical-phone test.'};
 fs.mkdirSync(output,{recursive:true});
 const save=()=>fs.writeFileSync(output+'/browser-report.json',JSON.stringify(report,null,2));
 page.on('pageerror',e=>{report.errors.push(String(e));save();});
 page.on('console',m=>{if(['error','warning'].includes(m.type())){report.console.push(m.text());save();}});
 await page.addInitScript(()=>{const raf=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=callback=>{if(callback.name==='animate'){window.__heldNativeAnimation=callback;return 0;}return raf(callback);};});
 async function shot(name){
  const capture=await page.evaluate(()=>{resize();for(let i=0;i<100;i++)updateCamera(1/30);updateUI();render();gl.finish();return {png:canvas.toDataURL('image/png'),state:HOBBY_HOUSE.state};});
  fs.writeFileSync(output+'/'+name+'-canvas.png',Buffer.from(capture.png.split(',')[1],'base64'));
  report.views.push({name,state:capture.state});save();
  await page.screenshot({path:output+'/'+name+'.png',timeout:150000});console.log('Captured',name);
 }
 try{
  await page.goto('http://127.0.0.1:4175/?room=briarwatch',{waitUntil:'networkidle',timeout:150000});
  await page.waitForFunction(()=>window.HOBBY_HOUSE?.state.ready&&HOBBY_HOUSE.state.room==='briarwatch'&&!hobby.transition,{},{timeout:150000});
  await page.evaluate(()=>{setMood('day',{immediate:true});paused=true;hobby.scene.trains[0].distance=145;});
  await shot('01-room-wrapping-arrival');
  for(const [i,name]of[[1,'02-keep'],[2,'03-gate'],[3,'04-courtyard'],[4,'05-hall'],[5,'06-gorge-bridges'],[6,'07-town'],[7,'08-mill'],[8,'09-station'],[9,'10-trestle']]){
   await page.evaluate(i=>document.querySelector('#roomPlaces').children[i].click(),i);await shot(name);
  }
  await page.evaluate(()=>{viewMode='overview';Object.assign(orbit,{target:[54.5,10.5,-27],distance:29,pitch:.54,yaw:1.05});});await shot('11-woodland-watchtower');
  await page.evaluate(()=>{viewMode='overview';Object.assign(orbit,{target:[18,-.5,-49.5],distance:22,pitch:.70,yaw:-.15});});await shot('12-spring-packhorse-bridge');
  await page.evaluate(()=>{setView('room',false);setMood('evening',{immediate:true});});await shot('13-evening');
  for(const width of[390,320]){
   await page.setViewportSize({width,height:844});await page.evaluate(()=>{setMood('day',{immediate:true});setView('room',false);});await shot('phone-'+width);
  }
  report.renderer=await page.evaluate(()=>({version:gl.getParameter(gl.VERSION),renderer:gl.getParameter(gl.RENDERER),sceneVertices:hobby.scene.mesh.count,movingVertices:hobby.scene.movingParts[0].mesh.count,revision:hobby.scene.briarwatch.revision}));
 }catch(error){report.fatal=String(error);throw error;}finally{save();await browser.close();}
 if(report.errors.length)throw new Error(report.errors.join('\n'));
})();
