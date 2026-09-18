'use strict';
const {chromium}=require('/tmp/briarwatch-browser/node_modules/playwright');
const fs=require('node:fs');
const out='evidence/briarwatch-field';
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const report={errors:[],console:[],views:[],method:'Actual native room, Chromium/SwiftShader; held animation and settled native cameras for stills. Not a physical-device FPS test.'};
 const save=()=>fs.writeFileSync(out+'/browser-report.json',JSON.stringify(report,null,2));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1400,height:1000},deviceScaleFactor:1});page.setDefaultTimeout(150000);
 page.on('pageerror',e=>{report.errors.push(String(e));save();});
 page.on('console',m=>{if(['error','warning'].includes(m.type())){report.console.push(m.text());save();}});
 await page.addInitScript(()=>{const raf=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>{if(cb.name==='animate'){window.__heldNativeAnimation=cb;return 0;}return raf(cb);};});
 async function shot(name){
  const q=await page.evaluate(()=>{resize();for(let i=0;i<100;i++)updateCamera(1/30);updateUI();render();gl.finish();return {png:canvas.toDataURL('image/png'),state:HOBBY_HOUSE.state,eye:cameraPos.slice(),target:cameraTarget.slice(),glError:gl.getError()};});
  fs.writeFileSync(out+'/'+name+'.png',Buffer.from(q.png.split(',')[1],'base64'));delete q.png;report.views.push({name,...q});save();console.log(name);
  if(q.glError)throw new Error('WebGL '+q.glError+' at '+name);
 }
 try{
  await page.goto('http://127.0.0.1:4175/?room=briarwatch',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.HOBBY_HOUSE?.state.ready&&HOBBY_HOUSE.state.room==='briarwatch'&&!hobby.transition);
  await page.evaluate(()=>{paused=true;hobby.scene.trains[0].distance=145;setMood('day',{immediate:true});setView('room',false);});await shot('01-overview');
  const views=[['02-gate-oak',[-57,7,10],20,.24,-1.3],['03-mill-willow',[28,4,-10],23,.28,.25],['04-quarry-woodland',[-48,13,-50],32,.34,.10],['05-village',[44,5,21],40,.43,.4],['06-trestle',[-27,4,34],30,.22,.2],['07-gorge',[8,4,-38],35,.24,.25],['08-station',[46,5,33],24,.27,.2]];
  for(const [name,target,distance,pitch,yaw]of views){await page.evaluate(q=>{viewMode='overview';Object.assign(orbit,q);},{target,distance,pitch,yaw});await shot(name);}
  await page.evaluate(()=>{setMood('evening',{immediate:true});setView('room',false);});await shot('09-evening');
  for(const width of[390,320]){await page.setViewportSize({width,height:844});await page.evaluate(()=>setView('room',false));await shot('10-phone-'+width);await page.screenshot({path:out+'/10-phone-'+width+'-ui.png'});}
  report.geometry=await page.evaluate(()=>({scene:hobby.scene.mesh.count,walls:hobby.scene.walls.map(w=>w.mesh.count),moving:hobby.scene.movingParts.map(m=>m.mesh.count)}));
 }catch(error){report.fatal=String(error);throw error;}finally{save();await browser.close();}
 if(report.errors.length||report.console.length)throw new Error(JSON.stringify(report));
})();
