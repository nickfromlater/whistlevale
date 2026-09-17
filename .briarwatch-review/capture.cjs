const {chromium}=require('/tmp/briarwatch-browser/node_modules/playwright');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1280,height:900},deviceScaleFactor:1});page.setDefaultTimeout(120000);
 const report={errors:[],console:[],views:[],method:'Actual native WebGL renderer, held animation RAF, manually settled camera for still images; not an FPS or physical-phone test.'};
 const save=()=>fs.writeFileSync('evidence/briarwatch/report.json',JSON.stringify(report,null,2));
 page.on('pageerror',e=>{report.errors.push(String(e));save();});page.on('console',m=>{if(['error','warning'].includes(m.type())){report.console.push(m.text());save();}});
 await page.addInitScript(()=>{const raf=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=callback=>{if(callback.name==='animate'){window.__heldNativeAnimation=callback;return 0;}return raf(callback);};});
 try{
  await page.goto('http://127.0.0.1:4175/?room=briarwatch',{waitUntil:'networkidle',timeout:120000});
  await page.waitForFunction(()=>window.HOBBY_HOUSE?.state.ready&&HOBBY_HOUSE.state.room==='briarwatch'&&!hobby.transition,{},{timeout:120000});
  await page.evaluate(()=>{setMood('day',{immediate:true});paused=true;hobby.scene.trains[0].distance=12;});
  async function shot(name){const capture=await page.evaluate(()=>{resize();for(let i=0;i<90;i++)updateCamera(1/30);updateUI();render();gl.finish();return {png:canvas.toDataURL('image/png'),state:HOBBY_HOUSE.state};});fs.writeFileSync('evidence/briarwatch/'+name+'-canvas.png',Buffer.from(capture.png.split(',')[1],'base64'));report.views.push({name,state:capture.state});save();await page.screenshot({path:'evidence/briarwatch/'+name+'.png',timeout:120000});}
  await shot('01-arrival');
  for(const [i,name]of[[1,'02-keep'],[3,'03-courtyard'],[6,'04-town'],[7,'05-mill']]){await page.evaluate(i=>document.querySelector('#roomPlaces').children[i].click(),i);await shot(name);}
  await page.evaluate(()=>{setView('room',false);setMood('evening',{immediate:true});});await shot('06-evening');
  for(const width of[390,320]){await page.setViewportSize({width,height:844});await page.evaluate(()=>{setMood('day',{immediate:true});setView('room',false);});await shot('phone-'+width);}
  report.renderer=await page.evaluate(()=>({version:gl.getParameter(gl.VERSION),renderer:gl.getParameter(gl.RENDERER)}));
 }catch(e){report.fatal=String(e);throw e;}finally{save();await browser.close();}
 if(report.errors.length)throw new Error(report.errors.join('\n'));
})();
