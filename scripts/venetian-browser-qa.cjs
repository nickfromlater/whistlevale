// Review-only dependency, installed outside the application by the CI workflow.
const {chromium}=require(process.env.VENETIAN_PLAYWRIGHT||'/tmp/whistlevale-browser/node_modules/playwright');
const fs=require('node:fs');
const {execFileSync}=require('node:child_process');
(async()=>{
 const root='evidence/venetian';fs.mkdirSync(root,{recursive:true});
 const report={source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),errors:[],console:[],views:[],method:'Actual native WebGL 2 in Chromium/SwiftShader. Held main animation RAF and manually settled cameras for still captures; not a physical-phone or FPS test.'};
 const save=()=>fs.writeFileSync(root+'/browser-report.json',JSON.stringify(report,null,2));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:1024},deviceScaleFactor:1});page.setDefaultTimeout(150000);
 page.on('pageerror',error=>{report.errors.push(String(error));save();});page.on('console',m=>{if(['error','warning'].includes(m.type())){report.console.push(m.text());save();}});
 await page.addInitScript(()=>{const raf=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>cb.name==='animate'?(window.__heldNativeAnimation=cb,0):raf(cb);});
 async function shot(name){
  const capture=await page.evaluate(()=>{resize();for(let i=0;i<140;i++)updateCamera(1/30);updateUI();render();gl.finish();return {png:canvas.toDataURL('image/png'),state:HOBBY_HOUSE.state};});
  fs.writeFileSync(root+'/'+name+'-canvas.png',Buffer.from(capture.png.split(',')[1],'base64'));report.views.push({name,state:capture.state});save();
  await page.screenshot({path:root+'/'+name+'.png',timeout:150000});console.log('Captured '+name);
 }
 try{
  await page.goto('http://127.0.0.1:4175/?room=venetian',{waitUntil:'domcontentloaded',timeout:150000});
  await page.waitForFunction(()=>window.HOBBY_HOUSE?.state.ready&&HOBBY_HOUSE.state.room==='venetian'&&!hobby.transition);
  await page.evaluate(()=>{setMood('day',{immediate:true});paused=true;});
  report.motion=await page.evaluate(()=>{
   const s=hobby.scene,first=s.venetian.time,firstPosition=venetianBoatPose(s,0).position;
   document.querySelector('#playBtn').click();const playing=!paused;
   for(let i=0;i<120;i++)updateSimulation(1/60);
   const advanced=s.venetian.time>first&&len(sub(firstPosition,venetianBoatPose(s,0).position))>.5;
   document.querySelector('#playBtn').click();const stopped=paused,time=s.venetian.time;
   for(let i=0;i<30;i++)updateSimulation(1/60);const frozen=s.venetian.time===time;
   reduceMotion=true;paused=false;for(let i=0;i<30;i++)updateSimulation(1/60);const reduced=s.venetian.time===time;
   reduceMotion=false;paused=true;return {playing,advanced,stopped,frozen,reduced};
  });
  if(!Object.values(report.motion).every(Boolean))throw new Error('Native boat motion/pause/reduced-motion integration failed');
  await shot('01-arrival');
  report.reflection=await page.evaluate(()=>{
   const r=venetianReflection,passes=r?.passes;render();gl.finish();
   return {allocated:!!r&&!r.failed,width:r?.width,height:r?.height,passes,cached:r?.passes===passes,mirroredEyeRestored:Array.from(gl.getUniform(mainProgram,uniform(mainProgram,'uEye'))).every((v,i)=>Math.abs(v-cameraPos[i])<1e-4),windingRestored:gl.getParameter(gl.FRONT_FACE)===gl.CCW,glError:gl.getError()};
  });
  if(!report.reflection.allocated||!report.reflection.cached||!report.reflection.mirroredEyeRestored||!report.reflection.windingRestored||report.reflection.glError)throw new Error('Planar reflection lifecycle/state failed');
  for(const [i,name]of[[1,'02-bridge'],[3,'03-basilica'],[2,'04-canal'],[4,'05-gondolas'],[8,'10-golden-loggia'],[9,'14-lace-palace']]){await page.evaluate(i=>document.querySelector('#roomPlaces').children[i].click(),i);await shot(name);}
  await page.evaluate(()=>{setView('room',false);setMood('evening',{immediate:true});});await shot('06-lamplight');
  await page.evaluate(()=>{setMood('night',{immediate:true});});await shot('07-night');
  await page.evaluate(()=>{setMood('day',{immediate:true});enterCinema();paused=true;hobby.shot='drift';});await shot('08-gondola-ride');
  await page.evaluate(()=>{hobby.scene.venetian.time=160;clock=12;});await shot('11-return-canal');
  await page.evaluate(()=>{setMood('night',{immediate:true});});await shot('12-lantern-water');
  await page.evaluate(()=>{setMood('day',{immediate:true});hobby.scene.venetian.time=88;});await shot('13-basin-turn');
  // A/B the same actual scene, camera and clock. The reflection must change
  // real canvas pixels, not only expose a successful framebuffer allocation.
  report.reflection.pixelsChanged=await page.evaluate(()=>{
   const pixels=()=>{const a=new Uint8Array(screenW*screenH*4);gl.readPixels(0,0,screenW,screenH,gl.RGBA,gl.UNSIGNED_BYTE,a);return a;};
   render();gl.finish();const on=pixels(),original=venetianPrepareReflection;let off;
   try{venetianPrepareReflection=()=>{uf(mainProgram,'uVenetianReflectionReady',0);};render();gl.finish();off=pixels();}
   finally{venetianPrepareReflection=original;render();gl.finish();}
   let changed=0;for(let i=0;i<on.length;i+=4)if(Math.abs(on[i]-off[i])+Math.abs(on[i+1]-off[i+1])+Math.abs(on[i+2]-off[i+2])>8)changed++;return changed;
  });
  if(report.reflection.pixelsChanged<150)throw new Error('Reflection is not visibly contributing to the native scene');
  report.cinema=await page.evaluate(()=>{beginCinemaOrbit();const manual=!!cinemaOrbit.manual;resumeCinemaCamera();const automatic=!cinemaOrbit.manual;leaveCinema();return {manual,automatic,exited:!hobby.cinema};});
  if(!report.cinema.manual||!report.cinema.automatic||!report.cinema.exited)throw new Error('Cinema lifecycle failure');
  for(const width of[390,320]){
   await page.setViewportSize({width,height:844});await page.evaluate(()=>{setView('room',false);setMood('day',{immediate:true});});await shot('phone-'+width);
   report.views.at(-1).overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
   if(report.views.at(-1).overflow)throw new Error('Phone layout overflows '+width);
   report.views.at(-1).framing=await page.evaluate(()=>{
    const points=[[-67.5,1.2,-47.5],[-67.5,1.2,47.5],[67.5,1.2,-47.5],[67.5,1.2,47.5],[37,31.3,-25]].map(project);
    return {points,contained:points.every(p=>p.visible&&p.x>6&&p.x<innerWidth-6&&p.y>70&&p.y<innerHeight-80)};
   });
   if(!report.views.at(-1).framing.contained)throw new Error('Phone camera crops the miniature at '+width);
  }
  await page.setViewportSize({width:1440,height:1024});
  // Exercise the actual map lifecycle, its derived new plot and return navigation.
  await page.evaluate(async()=>{await openHouseMap();resize();render();gl.finish();});
  report.map=await page.evaluate(()=>({active:shopMap.active,reflectionReleased:venetianReflection===null,plot:SHOP_HOUSE_LAYOUT.byKey.venetian?.plot,entry:!!SHOP_HOUSE_LAYOUT.byKey.venetian}));
  if(!report.map.active||!report.map.entry||!report.map.reflectionReleased)throw new Error('Venetian room missing from live map');
  await page.evaluate(()=>{resize();render();gl.finish();});await page.screenshot({path:root+'/09-house-map.png',timeout:150000});
  await page.evaluate(()=>{closeShopMap();});
  report.returned=await page.evaluate(()=>HOBBY_HOUSE.state.room==='venetian'&&!shopMap.active);
  if(!report.returned)throw new Error('Map return failed');
  report.lights=await page.evaluate(()=>{
   resize();render();gl.finish();const expected=houseRoomLights('venetian')[5],actual=Array.from(gl.getUniform(mainProgram,uniform(mainProgram,'uRoomLights[5]')));
   return {roomSlots:houseRoomLights('venetian').length,layoutSlots:houseLayoutLights('venetian').length,lastSlot:actual,correct:actual.every((v,i)=>Math.abs(v-expected[i])<1e-5),glError:gl.getError()};
  });
  if(!report.lights.correct||report.lights.roomSlots!==6||report.lights.layoutSlots!==8||report.lights.glError!==0)throw new Error('Room light state leaked across map return');
  report.renderer=await page.evaluate(()=>({version:gl.getParameter(gl.VERSION),renderer:gl.getParameter(gl.RENDERER)}));
 }catch(error){report.fatal=String(error);throw error;}finally{save();await browser.close();}
 if(report.errors.length)throw new Error(report.errors.join('\n'));
})();
