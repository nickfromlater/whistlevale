// Focused native-art inspection. Reviewer-owned Playwright, not an app dependency.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
if(!process.env.PLAYWRIGHT_MODULE_PATH)throw new Error('Set PLAYWRIGHT_MODULE_PATH to a reviewer-owned Playwright installation.');
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE_PATH));
const output='evidence/safari-lodge';await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
const context=await browser.newContext({viewport:{width:1280,height:900},deviceScaleFactor:1});
await context.addInitScript(()=>{const raf=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=callback=>callback.name==='animate'?0:raf(callback);});
const page=await context.newPage(),errors=[],report={scope:'native art, not hardware frame-rate testing',views:[],errors};page.on('pageerror',e=>errors.push(e.message));
page.setDefaultTimeout(120000);
async function capture(name,target,distance,yaw,pitch,mood='day'){
 console.log('Render',name);
 const image=await page.evaluate(({target,distance,yaw,pitch,mood})=>{
  paused=true;viewMode='overview';hobby.spot=-1;orbit.target=target;orbit.distance=distance;orbit.yaw=yaw;orbit.pitch=pitch;
  setMood(mood,{immediate:true,persist:false});hobby.scene.trains[0].distance=43;shadowDirty=true;
  resize();updateCamera(20);updateUI();render();updateEditorOverlay();gl.finish();
  return {png:canvas.toDataURL('image/png'),error:gl.getError(),width:canvas.width,height:canvas.height,vertices:hobby.scene.mesh.count};
 },{target,distance,yaw,pitch,mood});
 assert.equal(image.error,0);await writeFile(`${output}/${name}.png`,Buffer.from(image.png.split(',')[1],'base64'));delete image.png;report.views.push({name,...image});
}
try{
 await page.goto('http://127.0.0.1:4175/?room=safari',{waitUntil:'load'});
 await page.waitForFunction(()=>window.HOBBY_HOUSE?.state.ready&&hobby.room==='safari'&&!hobby.transition);
 report.renderer=await page.evaluate(()=>{const e=gl.getExtension('WEBGL_debug_renderer_info');return e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);});
 await capture('01-complete-landscape',[0,5,-1],138,.32,.60);
 await capture('02-field-lodge',[24,7,0],44,.40,.32);
 await capture('03-earth-approach',[23,4.8,6],31,-.68,.27);
 await capture('04-map-room',[23.8,6.6,-.3],15,.10,.16);
 await capture('05-lodge-evening',[24,7,0],44,.40,.32,'evening');
 await capture('06-survey-hide',[34.5,10,-2],18,.65,.28);
 await capture('07-acacia-country',[-25,5,7],36,-.40,.40);
 await capture('08-rear-stonework',[24,7,-2],38,2.9,.31);
 for(const width of[390,320]){
  await page.setViewportSize({width,height:width===390?844:693});await capture('09-lodge-phone-'+width,[24,7,0],80,.40,.34);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 }
 report.horizontalOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
 assert.equal(report.horizontalOverflow,false);assert.deepEqual(errors,[]);report.complete=true;
}catch(error){report.complete=false;report.failure=String(error.stack||error);throw error;}
finally{await writeFile(`${output}/native-art-review.json`,JSON.stringify(report,null,2));await browser.close();}
