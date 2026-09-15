import {chromium} from '/tmp/whistlevale-browser/node_modules/playwright/index.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const dir='evidence/safari-shadow';await mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
const context=await browser.newContext({viewport:{width:1280,height:900}});
await context.addInitScript(()=>{const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=f=>f.name==='animate'?0:raf(f);});
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(120000);
try{
 await page.goto('http://127.0.0.1:4175/?room=safari',{waitUntil:'load'});await page.waitForFunction(()=>window.HOBBY_HOUSE?.state.ready&&!hobby.transition);
 await page.evaluate(()=>{paused=true;setMood('day',{immediate:true,persist:false});setView('overview',false);hobby.spot=-1;orbit.target=[13,6,-13];orbit.distance=26;orbit.yaw=-.48;orbit.pitch=.42;window.__originalProgram=mainProgram;});
 for(const mode of['original','precision','no-shadow','large-bias','precision-original-shadow']){
  const png=await page.evaluate(mode=>{
   let fs=FS;
   if(mode==='precision'||mode==='precision-original-shadow')fs=fs.replace('uniform sampler2D uShadow,uAtlas','uniform highp sampler2D uShadow;\nuniform sampler2D uAtlas');
   if(mode==='no-shadow')fs=fs.replace('float sh=shadow(n);','float sh=1.;');
   if(mode==='large-bias')fs=fs.replace('float material=floor(vMat+.5);','bias=max(bias,.005);float material=floor(vMat+.5);');
   if(mode==='precision-original-shadow')fs=fs.replace('bool receiver=material>=86.&&material<=89.;','bool receiver=false;');
   mainProgram=program(VS,fs);resize();updateCamera(20);updateUI();shadowDirty=true;render();gl.finish();return canvas.toDataURL('image/png');
  },mode);
  await writeFile(`${dir}/${mode}.png`,Buffer.from(png.split(',')[1],'base64'));
 }
 assert.deepEqual(errors,[]);await writeFile(`${dir}/report.json`,JSON.stringify({errors,complete:true}));
}finally{await browser.close();}
