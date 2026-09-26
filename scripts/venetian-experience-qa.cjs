// Native browser evidence only. Playwright lives outside the public application.
const {chromium}=require(process.env.VENETIAN_PLAYWRIGHT||'/tmp/whistlevale-browser/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const {pathToFileURL}=require('node:url');
(async()=>{
 const root='evidence/venetian';fs.mkdirSync(root,{recursive:true});
 const report={source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),errors:[],console:[],method:'Actual Chromium/SwiftShader. Synthetic mouse/touch tests, downloaded standalone playback, and a deterministically stepped in-engine movie. Not physical-phone or real-time frame-rate evidence.'};
 const save=()=>fs.writeFileSync(root+'/experience-report.json',JSON.stringify(report,null,2));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:960,height:640},acceptDownloads:true});
 await context.addInitScript(()=>{const raf=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>cb.name==='animate'?(window.__heldNativeAnimation=cb,0):raf(cb);});
 const page=await context.newPage();page.setDefaultTimeout(180000);
 page.on('pageerror',e=>{report.errors.push(String(e));save();});page.on('console',m=>{if(['error','warning'].includes(m.type())){report.console.push(m.text());save();}});
 const ready=p=>p.waitForFunction(()=>window.HOBBY_HOUSE?.state.ready&&HOBBY_HOUSE.state.room==='venetian'&&!hobby.transition);
 async function still(name){const png=await page.evaluate(()=>{resize();for(let i=0;i<120;i++)updateCamera(1/30);updateUI();render();gl.finish();return canvas.toDataURL('image/png');});fs.writeFileSync(root+'/'+name+'.png',Buffer.from(png.split(',')[1],'base64'));}
 try{
  await page.goto('http://127.0.0.1:4175/?room=venetian',{waitUntil:'domcontentloaded',timeout:180000});await ready(page);
  await page.evaluate(()=>{setMood('evening',{immediate:true});document.querySelector('#roomPlaces').children[9].click();paused=true;});await still('15-palace-evening');
  await page.evaluate(()=>{enterCinema();hobby.shot='side';document.querySelector('#cinemaShot').value='side';paused=true;hobby.scene.venetian.time=30;});await still('16-alongside-gondolier');
  const anchor=await page.evaluate(()=>cameraTarget.slice());
  await page.mouse.move(440,280);await page.mouse.down();await page.mouse.move(540,315,{steps:8});await page.mouse.up();
  report.mouse=await page.evaluate(anchor=>({manual:!!cinemaOrbit.manual,fixedAnchor:!!cinemaOrbit.manual?.anchor&&len(sub(cinemaOrbit.manual.anchor,anchor))<.001,paused,cinema:hobby.cinema,released:cinemaOrbit.pointers.size===0}),anchor);
  if(!Object.values(report.mouse).every(Boolean))throw new Error('Native mouse takeover did not retain the boat-view anchor/pause');
  for(let i=0;i<3;i++)await page.mouse.wheel(0,300);
  const before=await page.evaluate(()=>cinemaOrbit.manual.distance),cdp=await context.newCDPSession(page);
  await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:2});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:360,y:280,id:1},{x:600,y:280,id:2}]});
  for(let i=1;i<=6;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:360-i*6,y:280,id:1},{x:600+i*6,y:280,id:2}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  report.touch=await page.evaluate(before=>({zoomed:cinemaOrbit.manual.distance<before,finite:Number.isFinite(cinemaOrbit.manual.distance),released:cinemaOrbit.pointers.size===0,paused,cinema:hobby.cinema}),before);
  if(!Object.values(report.touch).every(Boolean))throw new Error('Native two-finger pinch/pointer cleanup failed');
  await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:false});await cdp.detach();
  await page.locator('#cinemaAuto').click();
  if(!await page.evaluate(()=>!cinemaOrbit.manual&&hobby.cinema))throw new Error('Actual automatic-camera control failed');
  // Normal room navigation must release the offscreen target and recreate it.
  await page.evaluate(()=>{leaveCinema();HOBBY_HOUSE.visit('coast');});
  await page.waitForFunction(()=>HOBBY_HOUSE.state.room==='coast'&&!hobby.transition);
  report.crossRoom=await page.evaluate(()=>{render();gl.finish();return {released:venetianReflection===null,coast:hobby.room==='coast',glError:gl.getError()};});
  await page.evaluate(()=>HOBBY_HOUSE.visit('venetian'));await ready(page);
  report.crossRoom.restored=await page.evaluate(()=>{resize();render();gl.finish();return !!venetianReflection&&!venetianReflection.failed;});
  if(!report.crossRoom.released||!report.crossRoom.coast||!report.crossRoom.restored||report.crossRoom.glError)throw new Error('Reflection leaked across normal room navigation');
  // Exercise the app's real download path, then open the resulting bytes as a
  // standalone file with every HTTP request blocked, not a served copy of source.
  const downloadPromise=page.waitForEvent('download',{timeout:180000});await page.evaluate(()=>{void exportPlayable();});
  const download=await downloadPromise,portablePath=path.resolve(root,'whistlevale-portable.html');await download.saveAs(portablePath);
  const packed=fs.readFileSync(portablePath,'utf8');
  if(!packed.includes('function venetianPrepareReflection')||!packed.includes('function venetianRowingArm'))throw new Error('Standalone output omitted the new runtime');
  const offline=await browser.newContext({viewport:{width:960,height:640}}),requests=[];
  await offline.addInitScript(()=>{const raf=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>cb.name==='animate'?(window.__heldNativeAnimation=cb,0):raf(cb);});
  await offline.route(/^https?:/,route=>{requests.push(route.request().url());return route.abort();});
  const exported=await offline.newPage();exported.setDefaultTimeout(180000);
  exported.on('pageerror',e=>{report.errors.push('standalone: '+String(e));save();});
  await exported.goto(pathToFileURL(portablePath).href+'?room=venetian',{waitUntil:'domcontentloaded',timeout:180000});await ready(exported);
  report.portable=await exported.evaluate(()=>{
   setMood('night',{immediate:true});paused=false;const before=hobby.scene.venetian.time;for(let i=0;i<60;i++)updateSimulation(1/60);
   resize();for(let i=0;i<100;i++)updateCamera(1/30);render();gl.finish();
   return {room:hobby.room,views:hobby.scene.spots.length,parts:hobby.scene.movingParts.length,reflection:!!venetianReflection&&!venetianReflection.failed,boatsAdvanced:hobby.scene.venetian.time>before,credit:HOUSE_ROOMS.venetian.credits.some(c=>c.handle==='nickfromlater'),glError:gl.getError()};
  });
  report.portable.bytes=fs.statSync(portablePath).size;report.portable.networkRequests=requests;
  if(report.portable.room!=='venetian'||report.portable.views!==10||report.portable.parts!==29||!report.portable.reflection||!report.portable.boatsAdvanced||!report.portable.credit||report.portable.glError||requests.length)throw new Error('Downloaded standalone playback failed');
  const png=await exported.evaluate(()=>canvas.toDataURL('image/png'));fs.writeFileSync(root+'/17-standalone-night.png',Buffer.from(png.split(',')[1],'base64'));await offline.close();
  // This is a rendered sequence of actual simulation steps, not a GPU benchmark.
  if(process.env.VENETIAN_CAPTURE_FILM==='1'){
  const frames=root+'/gondolier-frames';fs.mkdirSync(frames,{recursive:true});
  await page.evaluate(()=>{setMood('evening',{immediate:true});enterCinema();hobby.shot='side';resumeCinemaCamera();hobby.scene.venetian.time=30;clock=20;paused=false;resize();for(let i=0;i<140;i++)updateCamera(1/30);});
  for(let i=0;i<120;i++){
   const png=await page.evaluate(()=>{updateSimulation(1/20);updateCamera(1/20);render();gl.finish();return canvas.toDataURL('image/png');});
   fs.writeFileSync(frames+'/'+String(i).padStart(4,'0')+'.png',Buffer.from(png.split(',')[1],'base64'));
   if(i%20===0)console.log('Rendered gondolier frame '+i+'/120');
  }
  execFileSync('ffmpeg',['-y','-framerate','20','-i',frames+'/%04d.png','-c:v','libx264','-preset','medium','-crf','21','-pix_fmt','yuv420p','-movflags','+faststart',root+'/venetian-gondolier.mp4'],{stdio:'pipe'});
  fs.rmSync(frames,{recursive:true,force:true});report.movie={frames:120,encodedFramesPerSecond:20,simulationSeconds:6,filename:'venetian-gondolier.mp4'};
  }
  report.finalGL=await page.evaluate(()=>gl.getError());if(report.finalGL)throw new Error('GL error after rendered animation');
 }catch(error){report.fatal=String(error);throw error;}finally{save();await browser.close();}
 if(report.errors.length)throw new Error(report.errors.join('\n'));
 console.log('Venetian native experience: mouse/touch, normal navigation, offline downloaded playback and rendered rowing sequence passed.');
})();
