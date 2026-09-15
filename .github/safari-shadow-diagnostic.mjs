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
 await page.evaluate(()=>{paused=true;setMood('day',{immediate:true,persist:false});setView('overview',false);hobby.spot=-1;orbit.target=[13,6,-13];orbit.distance=26;orbit.yaw=-.48;orbit.pitch=.42;window.__originalProgram=mainProgram;window.__static=drawHobbyStatic;window.__trains=drawHobbyTrains;});
 for(const mode of['geometric-normal','caster-offset','receiver-unclamped','center-sample']){
  const png=await page.evaluate(mode=>{
   let fs=FS;drawHobbyStatic=window.__static;drawHobbyTrains=window.__trains;
   if(mode==='geometric-normal')fs=fs.replace('vec3 p=vPos,base=vColor;','if(m==86.){n=normalize(cross(dFdx(vPos),dFdy(vPos)));}vec3 p=vPos,base=vColor;');
   if(mode==='receiver-unclamped')fs=fs.replace('clamp(dot(gradient,center-p.xy),-.004,.004)','dot(gradient,center-p.xy)');
   if(mode==='center-sample')fs=fs.replace('vec2(x,y)*texel*1.05','vec2(0.)');
   if(mode==='caster-offset'){
    drawHobbyStatic=function(p,s){if(s){gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(1.1,2);}try{return window.__static(p,s);}finally{gl.disable(gl.POLYGON_OFFSET_FILL);}};
    drawHobbyTrains=function(p){if(p===shadowProgram){gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(1.1,2);}try{return window.__trains(p);}finally{gl.disable(gl.POLYGON_OFFSET_FILL);}};
   }
   mainProgram=program(VS,fs);resize();updateCamera(20);updateUI();shadowDirty=true;render();gl.finish();return canvas.toDataURL('image/png');
  },mode);
  await writeFile(`${dir}/${mode}.png`,Buffer.from(png.split(',')[1],'base64'));
 }
 assert.deepEqual(errors,[]);await writeFile(`${dir}/report.json`,JSON.stringify({errors,complete:true}));
}finally{await browser.close();}
