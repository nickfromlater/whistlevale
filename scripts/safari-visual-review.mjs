// Optional native-browser review. Playwright is supplied by the reviewer, not
// installed in Whistlevale or shipped with its dependency-free browser build.
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const modulePath=process.env.PLAYWRIGHT_MODULE_PATH;
if(!modulePath)throw new Error('Set PLAYWRIGHT_MODULE_PATH to a reviewer-owned Playwright index.mjs.');
const {chromium}=await import(pathToFileURL(modulePath));
const output='evidence/safari';await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
const context=await browser.newContext({viewport:{width:1280,height:900},deviceScaleFactor:1,acceptDownloads:true});
// Hold only the native animation loop between captures. Startup, transitions,
// packer yields, DOM events and every other RAF callback keep their normal path.
// A software GPU must finish a composed frame before more frames are submitted.
await context.addInitScript(()=>{
 const raf=window.requestAnimationFrame.bind(window);let held=null,frozen=true;
 window.requestAnimationFrame=callback=>{if(frozen&&callback.name==='animate'){held=callback;return 0;}return raf(callback);};
 window.__reviewFreeze=()=>{frozen=true;};
 window.__reviewResume=()=>{frozen=false;if(held){const callback=held;held=null;raf(callback);}};
});
const page=await context.newPage(),errors=[],consoleErrors=[];
const report={renderer:null,capture:'native WebGL readback, paused animation between captures',hardwarePerformanceVerified:false,views:[],checks:[],uiCaptureErrors:[],errors,consoleErrors};
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});
page.setDefaultTimeout(90000);
async function settle(target=page){await target.evaluate(()=>{resize();updateCamera(20);updateUI();render();gl.finish();});}
async function snap(name,{ui=false,target=page}={}){
 console.log('Capture:',name);await settle(target);
 const result=await target.evaluate(()=>({png:canvas.toDataURL('image/png'),width:canvas.width,height:canvas.height,error:gl.getError()}));
 assert.equal(result.error,0,'WebGL error during '+name);assert.ok(result.png.startsWith('data:image/png;base64,'));
 await writeFile(`${output}/${name}.png`,Buffer.from(result.png.split(',')[1],'base64'));
 report.views.push({name,width:result.width,height:result.height,nativeWebGL:true});
 if(ui){try{await target.screenshot({path:`${output}/${name}-ui.png`,timeout:15000,animations:'disabled'});report.views.at(-1).browserUI=true;}catch(error){report.uiCaptureErrors.push({name,error:String(error)});}}
}
async function spot(index,trainDistance=44){await page.evaluate(({index,trainDistance})=>{paused=true;hobby.scene.trains[0].distance=trainDistance;hobby.scene.trains[0].collectionMotion=null;shadowDirty=true;document.querySelectorAll('#roomPlaces button')[index].click();closeQuietControls();},{index,trainDistance});}
try{
 await page.goto('http://127.0.0.1:4175/?room=safari&profile',{waitUntil:'load',timeout:90000});
 await page.waitForFunction(()=>window.HOBBY_HOUSE?.state.ready&&hobby.room==='safari'&&!hobby.transition,{},{timeout:120000});
 report.renderer=await page.evaluate(()=>{const e=gl.getExtension('WEBGL_debug_renderer_info');return e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);});
 await page.evaluate(()=>{paused=true;setMood('day',{immediate:true,persist:false});document.getElementById('performancePanel').style.display='none';});
 await snap('01-gallery-day',{ui:true});await spot(0);await snap('02-landscape-day');
 await spot(2);await snap('03-river-bridge');await spot(1,20);await snap('04-acacia-gate',{ui:true});
 await spot(3);await snap('05-acacia-country');await spot(4,139);await snap('06-rift-lookout');
 await spot(5);await snap('07-river');await spot(6,81);await snap('08-east-sweep');await spot(7);await snap('09-observation-deck');
 await page.evaluate(()=>{hobby.scene.trains[0].distance=43;viewMode='engine';hobby.spot=-1;shadowDirty=true;});await snap('10-solstice');
 await page.evaluate(()=>{cutaway=true;shadowDirty=true;});await snap('11-solstice-cutaway');
 await page.evaluate(()=>{cutaway=false;setView('cab',false);shadowDirty=true;});await snap('12-cab');
 await page.evaluate(()=>{setMood('evening',{immediate:true,persist:false});});await spot(0);await snap('13-lamplight');
 await page.evaluate(()=>{setMood('night',{immediate:true,persist:false});});await spot(2);await snap('14-night-crossing');
 // Running motion is measured from the actual animation loop, not a second model.
 await page.evaluate(()=>{setMood('day',{immediate:true,persist:false});setView('engine',false);paused=false;setThrottle(48);window.__reviewResume();});
 const before=await page.evaluate(()=>({distance:hobby.scene.trains[0].distance,frame}));await page.waitForTimeout(1800);
 const after=await page.evaluate(()=>{window.__reviewFreeze();return {distance:hobby.scene.trains[0].distance,frame};});
 assert.ok(after.distance>before.distance&&after.frame>before.frame,'native animation advances the monorail');
 report.checks.push({motionDistance:after.distance-before.distance,nativeFrames:after.frame-before.frame});await page.evaluate(()=>{paused=true;});
 for(const width of[390,320]){
  await page.setViewportSize({width,height:width===390?844:693});await page.evaluate(()=>setView('room',false));await snap(`15-phone-${width}-gallery`,{ui:true});
  await spot(2);await snap(`16-phone-${width}-bridge`);
  await page.evaluate(()=>{openQuietPanel('trainPanel',document.getElementById('trainBtn'));});await snap(`17-phone-${width}-controls`,{ui:true});
  assert.equal(await page.locator('#trainCollectionButton').isVisible(),false,'cabinet choices hidden for the incompatible beamway');
  assert.ok((await page.locator('.engine-title').innerText()).includes('Solstice'));await page.evaluate(()=>closeQuietControls());
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);assert.equal(overflow,false,'no horizontal phone overflow');
  report.checks.push({width,horizontalOverflow:overflow});
 }
 await page.setViewportSize({width:1280,height:900});await page.evaluate(()=>{setMood('day',{immediate:true,persist:false});});
 await page.evaluate(()=>openHouseMap());await page.waitForFunction(()=>shopMap.open&&!shopMap.loading,{},{timeout:120000});
 await page.evaluate(()=>shopMapSelect('safari'));await snap('18-house-map',{ui:true});
 report.checks.push({mapPlot:await page.evaluate(()=>HOUSE_ROOMS.safari.map.plot),mapRooms:await page.evaluate(()=>SHOP_HOUSE_LAYOUT.rooms.length)});
 await page.evaluate(()=>closeHouseMap());await page.waitForTimeout(400);
 await page.evaluate(()=>{activateHouseRoom('commons');openQuietPanel('trainPanel',document.getElementById('trainBtn'));updateUI();});
 assert.equal(await page.locator('#trainCollectionButton').isVisible(),true,'ordinary train selection returns in a conventional railway');
 await page.evaluate(()=>{activateHouseRoom('safari');HOBBY_HOUSE.cinema();});await snap('19-cinema');
 await page.evaluate(()=>{HOBBY_HOUSE.leaveCinema();setView('room',false);});
 report.profile=await page.evaluate(()=>JSON.parse(document.getElementById('performanceReport').textContent));
 // Exercise the real house packer and its local-file playback, not source alone.
 const downloadPromise=page.waitForEvent('download',{timeout:120000});await page.evaluate(()=>exportPlayable());
 const download=await downloadPromise;const exportedPath=`${output}/whistlevale-safari-review.html`;await download.saveAs(exportedPath);
 const html=await readFile(exportedPath,'utf8');assert.ok(html.includes("registerHouseRoom('safari'"));assert.ok(html.includes('function safariDrawFormation'));assert.ok(html.includes('Original safari landscape, monorail'));
 report.checks.push({exportBytes:Buffer.byteLength(html),exportContainsRoom:true,exportContainsMonorail:true,exportContainsCredit:true});
 const exported=await context.newPage();exported.on('pageerror',e=>errors.push('Export: '+e.message));
 await exported.goto(pathToFileURL(resolve(exportedPath)).href,{waitUntil:'load',timeout:120000});
 await exported.waitForFunction(()=>window.HOBBY_HOUSE?.state.ready&&!hobby.transition,{},{timeout:120000});
 await exported.evaluate(()=>{activateHouseRoom('safari');paused=true;setMood('day',{immediate:true,persist:false});});
 await snap('20-exported-safari',{target:exported,ui:true});report.checks.push({exportPlayback:true});
 assert.deepEqual(errors,[],'no uncaught native application errors');assert.deepEqual(report.uiCaptureErrors,[],'browser UI captures complete');report.complete=true;
}catch(error){report.complete=false;report.failure=String(error.stack||error);throw error;}
finally{await writeFile(`${output}/browser-review.json`,JSON.stringify(report,null,2));await browser.close();}
