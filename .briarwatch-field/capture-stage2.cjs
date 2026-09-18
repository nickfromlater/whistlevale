'use strict';
const {chromium}=require('/tmp/briarwatch-browser/node_modules/playwright');
const fs=require('node:fs');const out='evidence/briarwatch-field';
(async()=>{
 fs.mkdirSync(out,{recursive:true});const report={errors:[],console:[],views:[],method:'Actual native room in Chromium/SwiftShader; held animation and settled cameras for reproducible stills, not physical-device FPS evidence.'};
 const save=()=>fs.writeFileSync(out+'/browser-report.json',JSON.stringify(report,null,2));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1400,height:1000},deviceScaleFactor:1});page.setDefaultTimeout(150000);
 page.on('pageerror',e=>{report.errors.push(String(e));save();});page.on('console',m=>{if(['error','warning'].includes(m.type())){report.console.push(m.text());save();}});
 await page.addInitScript(()=>{const raf=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>{if(cb.name==='animate'){window.__heldNativeAnimation=cb;return 0;}return raf(cb);};});
 async function shot(name){const q=await page.evaluate(()=>{resize();for(let i=0;i<100;i++)updateCamera(1/30);updateUI();render();gl.finish();return {png:canvas.toDataURL('image/png'),state:HOBBY_HOUSE.state,eye:cameraPos.slice(),target:cameraTarget.slice(),glError:gl.getError()};});fs.writeFileSync(out+'/'+name+'.png',Buffer.from(q.png.split(',')[1],'base64'));delete q.png;report.views.push({name,...q});save();console.log(name);if(q.glError)throw new Error('WebGL '+q.glError+' at '+name);}
 async function camera(name,target,distance,pitch,yaw){await page.evaluate(q=>{viewMode='overview';Object.assign(orbit,q);},{target,distance,pitch,yaw});await shot(name);}
 try{
  await page.goto('http://127.0.0.1:4175/?room=briarwatch',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.HOBBY_HOUSE?.state.ready&&HOBBY_HOUSE.state.room==='briarwatch'&&!hobby.transition);
  await page.evaluate(()=>{paused=true;hobby.scene.trains[0].distance=145;setMood('day',{immediate:true});setView('room',false);});await shot('01-overview');
  for(const q of[['02-gate-oak',[-57,7,10],20,.24,-1.3],['03-mill-willow',[28,4,-10],23,.28,.25],['04-quarry-woodland',[-48,13,-50],32,.34,.10],['05-village',[44,5,21],40,.43,.4],['06-trestle',[-27,4,34],30,.22,.2],['07-gorge',[8,4,-38],35,.24,.25]])await camera(...q);
  await page.evaluate(()=>{hobby.scene.trains[0].distance=11;});await camera('08-estate-tern',[46,4.15,35],6.7,.26,.77);
  await camera('09-claret-consist',[42,4.1,35],16,.34,.1);await camera('10-water-column',[53.1,4.65,32.0],11,.31,.70);
  await camera('11-orchard-ladder',[33,3.9,26],11,.35,-.7);await camera('12-platelayer-hut',[61,4.1,21],10,.22,.3);
  await page.evaluate(()=>{setView('cab',false);});await shot('13-native-cab');
  await page.evaluate(()=>{setView('room',false);setMood('evening',{immediate:true});});await shot('14-evening');
  for(const width of[390,320]){await page.setViewportSize({width,height:844});await page.evaluate(()=>setView('room',false));await shot('15-phone-'+width);await page.screenshot({path:out+'/15-phone-'+width+'-ui.png'});}
  await page.setViewportSize({width:1400,height:1000});await page.evaluate(()=>{paused=false;for(let i=0;i<3;i++)window.__heldNativeAnimation(performance.now()+i*16);paused=true;});await shot('16-native-motion');
  report.geometry=await page.evaluate(()=>({scene:hobby.scene.mesh.count,walls:hobby.scene.walls.map(w=>w.mesh.count),moving:hobby.scene.movingParts.map(m=>m.mesh.count),estateTrain:Object.fromEntries(Object.entries(briarEstateStock()).map(([k,v])=>[k,v.count]))}));
  await page.evaluate(()=>openHouseMap());await shot('17-house-map');await page.evaluate(()=>closeHouseMap());
  await page.evaluate(()=>HOBBY_HOUSE.visit('coast'));await page.waitForFunction(()=>HOBBY_HOUSE.state.room==='coast'&&!hobby.transition);await shot('18-coast-unchanged');
  await page.evaluate(()=>HOBBY_HOUSE.visit('briarwatch'));await page.waitForFunction(()=>HOBBY_HOUSE.state.room==='briarwatch'&&!hobby.transition);await shot('19-briarwatch-return');
  await page.evaluate(()=>{chooseCollectionTrain('briarwatch',{id:'cinder',livery:0,cars:2});setView('room',false);});await shot('20-user-train-selection');
  report.selection=await page.evaluate(()=>({selected:collectionChoice('briarwatch'),stock:hobby.scene.trains[0].stock}));
  if(report.selection.stock!=='collection:cinder')throw new Error('User train selection did not override estate default');
 }catch(e){report.fatal=String(e);throw e;}finally{save();await browser.close();}
 if(report.errors.length||report.console.length)throw new Error(JSON.stringify(report));
})();
