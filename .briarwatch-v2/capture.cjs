const {chromium}=require('/tmp/briarwatch-browser/node_modules/playwright');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:1024},deviceScaleFactor:1});page.setDefaultTimeout(150000);
 const report={errors:[],console:[],views:[],method:'Actual native WebGL renderer in Chromium/SwiftShader. Held animation RAF and manually settled cameras for still captures. Not an FPS or physical-phone test.'};
 fs.mkdirSync('evidence/briarwatch-v2',{recursive:true});
 const save=()=>fs.writeFileSync('evidence/briarwatch-v2/browser-report.json',JSON.stringify(report,null,2));
 page.on('pageerror',e=>{report.errors.push(String(e));save();});page.on('console',m=>{if(['error','warning'].includes(m.type())){report.console.push(m.text());save();}});
 await page.addInitScript(()=>{const raf=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=callback=>{if(callback.name==='animate'){window.__heldNativeAnimation=callback;return 0;}return raf(callback);};});
 try{
  await page.goto('http://127.0.0.1:4175/?room=briarwatch',{waitUntil:'networkidle',timeout:150000});
  await page.waitForFunction(()=>window.HOBBY_HOUSE?.state.ready&&HOBBY_HOUSE.state.room==='briarwatch'&&!hobby.transition,{},{timeout:150000});
  await page.evaluate(()=>{setMood('day',{immediate:true});paused=true;hobby.scene.trains[0].distance=145;});
  async function shot(name){const capture=await page.evaluate(()=>{resize();for(let i=0;i<100;i++)updateCamera(1/30);updateUI();render();gl.finish();return {png:canvas.toDataURL('image/png'),state:HOBBY_HOUSE.state};});fs.writeFileSync('evidence/briarwatch-v2/'+name+'-canvas.png',Buffer.from(capture.png.split(',')[1],'base64'));report.views.push({name,state:capture.state});save();await page.screenshot({path:'evidence/briarwatch-v2/'+name+'.png',timeout:150000});console.log('Captured',name);}
  await shot('01-room-wrapping-arrival');
  for(const [i,name]of[[1,'02-keep'],[2,'03-gate'],[3,'04-courtyard'],[4,'05-hall'],[5,'06-gorge-bridges'],[6,'07-town'],[7,'08-mill'],[8,'09-station'],[9,'10-trestle']]){await page.evaluate(i=>document.querySelector('#roomPlaces').children[i].click(),i);await shot(name);}
  await page.evaluate(()=>{setView('room',false);setMood('evening',{immediate:true});});await shot('11-evening');
  for(const width of[390,320]){await page.setViewportSize({width,height:844});await page.evaluate(()=>{setMood('day',{immediate:true});setView('room',false);});await shot('phone-'+width);}
  report.renderer=await page.evaluate(()=>({version:gl.getParameter(gl.VERSION),renderer:gl.getParameter(gl.RENDERER)}));
 }catch(e){report.fatal=String(e);throw e;}finally{save();await browser.close();}
 if(report.errors.length)throw new Error(report.errors.join('\n'));
})();
