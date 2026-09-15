// Native Safari visual + passenger integration review; Playwright stays outside
// the application. Run with scripts/serve.py --port 4175 already listening.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const modulePath=process.env.PLAYWRIGHT_MODULE_PATH;
if(!modulePath)throw new Error('Supply reviewer-owned PLAYWRIGHT_MODULE_PATH.');
const {chromium}=await import(pathToFileURL(modulePath));
const output='evidence/safari-ride';await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
const context=await browser.newContext({viewport:{width:1280,height:900},deviceScaleFactor:1,acceptDownloads:true});
await context.addInitScript(()=>{
 const raf=window.requestAnimationFrame.bind(window);let held=null,frozen=true;
 window.requestAnimationFrame=callback=>{if(frozen&&callback.name==='animate'){held=callback;return 0;}return raf(callback);};
 window.__reviewFreeze=()=>{frozen=true;};window.__reviewResume=()=>{frozen=false;if(held){const callback=held;held=null;raf(callback);}};
});
const page=await context.newPage(),errors=[],consoleErrors=[],report={views:[],checks:[],errors,consoleErrors,physicalPhoneVerified:false};
page.setDefaultTimeout(120000);page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});
async function image(name,ui=false){
 console.log('Capture',name);
 const result=await page.evaluate(()=>{resize();updateCamera(20);updateUI();render();updateEditorOverlay();gl.finish();return {image:canvas.toDataURL('image/png'),error:gl.getError(),view:viewMode,position:cameraPos,mode:safariPassengerActive(),vertices:hobby.scene.mesh.count,width:canvas.width,height:canvas.height};});
 assert.equal(result.error,0,name+' WebGL');await writeFile(`${output}/${name}.png`,Buffer.from(result.image.split(',')[1],'base64'));delete result.image;report.views.push({name,...result});
 if(ui)await page.screenshot({path:`${output}/${name}-ui.png`,animations:'disabled',timeout:30000});
}
async function orbitView(name,target,distance,yaw,pitch){
 await page.evaluate(({target,distance,yaw,pitch})=>{setView('overview',false);hobby.spot=-1;orbit.target=target;orbit.distance=distance;orbit.yaw=yaw;orbit.pitch=pitch;},{target,distance,yaw,pitch});await image(name);
}
async function seat(name,side,distance,ui=false){await page.evaluate(({side,distance})=>{hobby.scene.trains[0].distance=distance;shadowDirty=true;setView('window-'+side,false);safariResetLook();},{side,distance});await image(name,ui);}
try{
 await page.goto('http://127.0.0.1:4175/?room=safari',{waitUntil:'load'});
 await page.waitForFunction(()=>window.HOBBY_HOUSE?.state.ready&&hobby.room==='safari'&&!hobby.transition);
 await page.evaluate(()=>{paused=true;setMood('day',{immediate:true,persist:false});hobby.scene.trains[0].distance=43;shadowDirty=true;});
 report.renderer=await page.evaluate(()=>{const e=gl.getExtension('WEBGL_debug_renderer_info');return e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);});
 await orbitView('01-rift-landscape',[0,5,-1],138,.32,.60);
 await orbitView('02-eastern-bedding',[26,8,-21],52,-.45,.44);
 await orbitView('03-western-gorge',[-30,6,-23],46,.49,.34);
 await orbitView('04-water-and-stone',[13,6,-13],26,-.48,.42);
 await orbitView('05-acacia-ground',[-25,4,8],34,.12,.34);
 await page.evaluate(()=>setView('engine',false));await image('06-solstice',true);
 await page.evaluate(()=>{cutaway=true;shadowDirty=true;});await image('07-carriage-interior');
 await page.evaluate(()=>{cutaway=false;shadowDirty=true;});
 await seat('08-river-window','right',43,true);
 await seat('09-lodge-window','left',80,true);
 await seat('10-ridge-window','right',138);
 await page.evaluate(()=>{setView('cab',false);});await image('11-driver-view');
 await page.evaluate(()=>setMood('evening',{immediate:true,persist:false}));await seat('12-window-lamplight','right',43);
 await page.evaluate(()=>setMood('day',{immediate:true,persist:false}));
 // Native passenger behavior is tested independently of camera stills.
 const controls=await page.evaluate(()=>{setView('window-right',false);return {throttle,paused,cutaway,orbit:JSON.stringify(orbit),distance:hobby.scene.trains[0].distance};});
 await page.mouse.move(630,360);await page.mouse.down();await page.mouse.move(790,445,{steps:4});await page.mouse.up();await image('13-look-around');
 assert.ok(await page.evaluate(()=>safariPassengerActive()&&Math.abs(safariRide.yaw-.17)>.1));
 await page.keyboard.press('Home');await page.keyboard.press('ArrowLeft');assert.ok(await page.evaluate(()=>safariRide.yaw>.17));
 await page.locator('#safariSeatLeft').click();assert.equal(await page.evaluate(()=>viewMode),'window-left');
 await page.locator('#safariSeatRight').click();
 assert.deepEqual(await page.evaluate(()=>({throttle,paused,cutaway})),{throttle:controls.throttle,paused:controls.paused,cutaway:controls.cutaway});
 await page.evaluate(()=>{canvas.focus();});await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>safariPassengerActive()),false);
 report.checks.push('Drag, keyboard, left/right selection, pause/throttle preservation and Escape exit');
 for(const width of[390,320]){
  await page.setViewportSize({width,height:width===390?844:693});await seat('14-phone-window-'+width,'right',43,true);
  const safe=await page.evaluate(()=>{const r=$('safariSeatControls').getBoundingClientRect();return {overflow:document.documentElement.scrollWidth>innerWidth,left:r.left,right:r.right,width:innerWidth,targets:[...$('safariSeatControls').querySelectorAll('button')].map(b=>b.getBoundingClientRect().height)};});
  assert.equal(safe.overflow,false);assert.ok(safe.left>=0&&safe.right<=width);assert.ok(safe.targets.every(h=>h>=44));
  await page.evaluate(()=>{
   const event=(type,id,x,y)=>canvas.dispatchEvent(new PointerEvent(type,{pointerId:id,pointerType:'touch',clientX:x,clientY:y,bubbles:true,cancelable:true}));
   event('pointerdown',101,100,300);event('pointerdown',102,210,300);event('pointermove',102,270,300);event('pointercancel',101,100,300);event('pointerup',102,270,300);
  });
  assert.ok(await page.evaluate(()=>safariRide.zoom<1&&safariRide.pointers.size===0));
  await page.locator('#safariSeatLeave').click();assert.equal(await page.evaluate(()=>safariPassengerActive()),false);
  report.checks.push({width,...safe,pinchAndCancel:true});
 }
 await page.setViewportSize({width:1280,height:900});
 await seat('15-roof-preserved','right',43);
 await page.evaluate(()=>{cutaway=true;});await image('16-cutaway-does-not-remove-passenger-roof');
 await page.evaluate(()=>{cutaway=false;openHouseMap();});await page.waitForFunction(()=>shopMap.open&&!shopMap.loading);
 assert.equal(await page.evaluate(()=>safariPassengerActive()),false);await page.evaluate(()=>closeHouseMap());
 await page.evaluate(()=>{activateHouseRoom('commons');updateUI();});assert.equal(await page.locator('[data-camera="window-right"]').isVisible(),false);
 assert.equal(await page.evaluate(()=>{setView('window-right',false);return viewMode==='window-right';}),false);
 await page.evaluate(()=>{activateHouseRoom('safari');setView('window-right',false);});
 const baseline=await page.evaluate(()=>({frame,distance:hobby.scene.trains[0].distance}));await page.evaluate(()=>{paused=false;window.__reviewResume();});await page.waitForTimeout(1500);
 const moved=await page.evaluate(()=>{window.__reviewFreeze();return{frame,distance:hobby.scene.trains[0].distance,active:safariPassengerActive()};});
 assert.ok(moved.frame>baseline.frame&&moved.distance>baseline.distance&&moved.active);await page.evaluate(()=>{paused=true;});
 report.checks.push({nativeMovingPassengerFrames:moved.frame-baseline.frame,nativeTravel:moved.distance-baseline.distance});
 assert.deepEqual(errors,[]);assert.deepEqual(consoleErrors,[]);report.complete=true;
}catch(error){report.complete=false;report.failure=String(error.stack||error);console.error(report.failure);process.exitCode=1;}
finally{await writeFile(`${output}/review.json`,JSON.stringify(report,null,2));await browser.close();}
