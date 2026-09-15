// Optional native-browser review. Playwright is supplied by the reviewer, not
// installed in Whistlevale or shipped with its dependency-free browser build.
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const modulePath=process.env.PLAYWRIGHT_MODULE_PATH;
if(!modulePath)throw new Error('Set PLAYWRIGHT_MODULE_PATH to a reviewer-owned Playwright index.mjs.');
const {chromium}=await import(pathToFileURL(modulePath));
const output='evidence/safari';await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
const context=await browser.newContext({viewport:{width:1600,height:1050},deviceScaleFactor:1,acceptDownloads:true});
const page=await context.newPage(),errors=[],consoleErrors=[],report={renderer:null,checks:[],errors,consoleErrors};
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});
page.setDefaultTimeout(90000);
async function settle(){await page.evaluate(()=>{updateCamera(20);updateUI();render();});await page.waitForTimeout(180);}
async function snap(name){await settle();await page.screenshot({path:`${output}/${name}.png`});}
async function spot(index,trainDistance=44){await page.evaluate(({index,trainDistance})=>{paused=true;hobby.scene.trains[0].distance=trainDistance;hobby.scene.trains[0].collectionMotion=null;shadowDirty=true;document.querySelectorAll('#roomPlaces button')[index].click();closeQuietControls();},{index,trainDistance});await settle();}
try{
 await page.goto('http://127.0.0.1:4175/?room=safari&profile',{waitUntil:'load',timeout:90000});
 await page.waitForFunction(()=>window.HOBBY_HOUSE?.state.ready&&hobby.room==='safari'&&!hobby.transition,{},{timeout:120000});
 report.renderer=await page.evaluate(()=>{const e=gl.getExtension('WEBGL_debug_renderer_info');return e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);});
 await page.evaluate(()=>{paused=true;setMood('day',{immediate:true,persist:false});document.getElementById('performancePanel').open=false;});
 await snap('01-gallery-day');await spot(0);await snap('02-landscape-day');
 await spot(2);await snap('03-river-bridge');await spot(1,20);await snap('04-acacia-gate');
 await spot(3);await snap('05-acacia-country');await spot(4,139);await snap('06-rift-lookout');
 await spot(5);await snap('07-river');await spot(6,81);await snap('08-east-sweep');await spot(7);await snap('09-observation-deck');
 await page.evaluate(()=>{hobby.scene.trains[0].distance=43;viewMode='engine';hobby.spot=-1;shadowDirty=true;});await snap('10-solstice');
 await page.evaluate(()=>{cutaway=true;shadowDirty=true;});await snap('11-solstice-cutaway');
 await page.evaluate(()=>{cutaway=false;setView('cab',false);shadowDirty=true;});await snap('12-cab');
 await page.evaluate(()=>{setMood('evening',{immediate:true,persist:false});});await spot(0);await snap('13-lamplight');
 await page.evaluate(()=>{setMood('night',{immediate:true,persist:false});});await spot(2);await snap('14-night-crossing');
 // Running motion is measured from the actual frame loop, not a second model.
 await page.evaluate(()=>{setMood('day',{immediate:true,persist:false});setView('engine',false);paused=false;setThrottle(48);});
 const before=await page.evaluate(()=>hobby.scene.trains[0].distance);await page.waitForTimeout(1800);const after=await page.evaluate(()=>hobby.scene.trains[0].distance);
 assert.ok(after>before,'native animation advances the monorail');report.checks.push({motionDistance:after-before});await page.evaluate(()=>{paused=true;});
 for(const width of[390,320]){
  await page.setViewportSize({width,height:width===390?844:693});await page.evaluate(()=>setView('room',false));await snap(`15-phone-${width}-gallery`);
  await spot(2);await snap(`16-phone-${width}-bridge`);
  await page.evaluate(()=>{openQuietPanel('trainPanel',document.getElementById('trainBtn'));});await snap(`17-phone-${width}-controls`);
  assert.equal(await page.locator('#trainCollectionButton').isVisible(),false,'cabinet choices hidden for the incompatible beamway');
  assert.ok((await page.locator('.engine-title').innerText()).includes('Solstice'));await page.evaluate(()=>closeQuietControls());
  report.checks.push({width,horizontalOverflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)});
 }
 await page.setViewportSize({width:1600,height:1050});await page.evaluate(()=>{setMood('day',{immediate:true,persist:false});});
 await page.evaluate(()=>openHouseMap());await page.waitForFunction(()=>shopMap.open&&!shopMap.loading,{},{timeout:120000});
 await page.evaluate(()=>shopMapSelect('safari'));await snap('18-house-map');
 report.checks.push({mapPlot:await page.evaluate(()=>HOUSE_ROOMS.safari.map.plot),mapRooms:await page.evaluate(()=>SHOP_HOUSE_LAYOUT.rooms.length)});
 await page.evaluate(()=>closeHouseMap());await page.waitForTimeout(400);
 await page.evaluate(()=>{activateHouseRoom('commons');openQuietPanel('trainPanel',document.getElementById('trainBtn'));updateUI();});
 assert.equal(await page.locator('#trainCollectionButton').isVisible(),true,'ordinary train selection returns in a conventional railway');
 await page.evaluate(()=>{activateHouseRoom('safari');HOBBY_HOUSE.cinema();});await page.waitForTimeout(1200);await snap('19-cinema');
 await page.evaluate(()=>{HOBBY_HOUSE.leaveCinema();setView('room',false);document.getElementById('resetPerformance').click();});await page.waitForTimeout(2200);
 report.profile=await page.evaluate(()=>JSON.parse(document.getElementById('performanceReport').textContent));
 // Exercise the real house packer. Its normal download includes every room.
 const downloadPromise=page.waitForEvent('download',{timeout:120000});await page.evaluate(()=>exportPlayable());
 const download=await downloadPromise;const exportedPath=`${output}/whistlevale-safari-review.html`;await download.saveAs(exportedPath);
 const html=await readFile(exportedPath,'utf8');assert.ok(html.includes("registerHouseRoom('safari'"));assert.ok(html.includes('function safariDrawFormation'));assert.ok(html.includes('Original safari landscape, monorail'));
 report.checks.push({exportBytes:Buffer.byteLength(html),exportContainsRoom:true,exportContainsMonorail:true,exportContainsCredit:true});
 assert.deepEqual(errors,[],'no uncaught native application errors');
 report.complete=true;
}catch(error){report.complete=false;report.failure=String(error.stack||error);await page.screenshot({path:`${output}/review-failure.png`}).catch(()=>{});throw error;}
finally{await writeFile(`${output}/browser-review.json`,JSON.stringify(report,null,2));await browser.close();}
