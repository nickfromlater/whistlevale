'use strict';
const {chromium}=require('/tmp/briarwatch-browser/node_modules/playwright');
const fs=require('node:fs');
const out='evidence/briarwatch-atmosphere';
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:1024},deviceScaleFactor:1});page.setDefaultTimeout(150000);
 const report={errors:[],console:[],views:[],method:'Native app served by scripts/serve.py, Chromium/SwiftShader. Animation RAF held; native cameras settled for reproducible stills. Not FPS or physical-phone evidence.'};
 fs.mkdirSync(out,{recursive:true});const save=()=>fs.writeFileSync(out+'/browser-report.json',JSON.stringify(report,null,2));
 page.on('pageerror',e=>{report.errors.push(String(e));save();});
 page.on('console',m=>{if(['error','warning'].includes(m.type())){report.console.push(m.text());save();}});
 await page.addInitScript(()=>{const raf=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>{if(cb.name==='animate'){window.__heldNativeAnimation=cb;return 0;}return raf(cb);};});
 async function shot(name){
  const s=await page.evaluate(()=>{resize();for(let i=0;i<100;i++)updateCamera(1/30);updateUI();render();gl.finish();return {png:canvas.toDataURL('image/png'),state:HOBBY_HOUSE.state,night,lamps:roomLampLevel,glError:gl.getError()};});
  fs.writeFileSync(out+'/'+name+'.png',Buffer.from(s.png.split(',')[1],'base64'));delete s.png;
  report.views.push({name,...s});save();console.log('Captured '+name);
  if(s.glError)throw new Error('WebGL error '+s.glError+' in '+name);
 }
 try{
  await page.goto('http://127.0.0.1:4175/?room=briarwatch',{waitUntil:'networkidle',timeout:150000});
  await page.waitForFunction(()=>window.HOBBY_HOUSE?.state.ready&&HOBBY_HOUSE.state.room==='briarwatch'&&!hobby.transition);
  await page.evaluate(()=>{paused=true;hobby.scene.trains[0].distance=145;});
  for(const mood of['day','evening','night']){await page.evaluate(m=>{setView('room',false);setMood(m,{immediate:true});},mood);await shot('room-'+mood);}
  await page.evaluate(()=>{viewMode='overview';lensAmount=0;Object.assign(orbit,{target:[40,23,-64],distance:44,pitch:.10,yaw:.15});});
  for(const mood of['day','evening','night']){await page.evaluate(m=>setMood(m,{immediate:true}),mood);await shot('estate-window-'+mood);}
  await page.evaluate(()=>{setMood('evening',{immediate:true});orbit.yaw=-.32;});await shot('estate-window-oblique');
  await page.evaluate(()=>{viewMode='overview';Object.assign(orbit,{target:[0,22,-64],distance:85,pitch:.10,yaw:0});setMood('evening',{immediate:true});});await shot('gallery-lamplight');
  await page.evaluate(()=>{roomLampLevel=0;roomLampTarget=0;});await shot('gallery-dimmer-off');
  await page.evaluate(()=>{viewMode='overview';Object.assign(orbit,{target:[-74,16,0],distance:65,pitch:.13,yaw:1.38});setMood('evening',{immediate:true});});await shot('side-gallery-lamplight');
  for(const width of[390,320]){await page.setViewportSize({width,height:844});await page.evaluate(()=>{setView('room',false);setMood('evening',{immediate:true});});await shot('phone-'+width);}
  await page.setViewportSize({width:1440,height:1024});await page.evaluate(()=>{setView('follow',false);});await shot('train-follow');
  await page.evaluate(()=>{setView('room',false);});await page.evaluate(()=>HOBBY_HOUSE.openMap());await shot('house-map');await page.evaluate(()=>closeHouseMap());
  await page.evaluate(()=>HOBBY_HOUSE.visit('coast'));await page.waitForFunction(()=>HOBBY_HOUSE.state.room==='coast'&&!hobby.transition);await shot('coast-regression');
  report.renderer=await page.evaluate(()=>({version:gl.getParameter(gl.VERSION),renderer:gl.getParameter(gl.RENDERER)}));
 }catch(e){report.fatal=String(e);throw e;}finally{save();await browser.close();}
 if(report.errors.length||report.console.length)throw new Error(JSON.stringify({errors:report.errors,console:report.console}));
})();
