const {chromium}=require('/tmp/briarwatch-browser/node_modules/playwright');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
 const report={errors:[],console:[],views:[]};
 page.on('pageerror',e=>report.errors.push(String(e)));
 page.on('console',m=>{if(['error','warning'].includes(m.type()))report.console.push(m.text());});
 try{
  await page.goto('http://127.0.0.1:4175/?room=briarwatch',{waitUntil:'networkidle',timeout:120000});
  await page.waitForFunction(()=>window.HOBBY_HOUSE?.state.ready&&HOBBY_HOUSE.state.room==='briarwatch'&&!hobby.transition,{},{timeout:120000});
  await page.evaluate(()=>{setMood('day',{immediate:true});paused=true;hobby.scene.trains[0].distance=12;});
  async function shot(name){await page.waitForTimeout(1400);await page.screenshot({path:'evidence/briarwatch/'+name+'.png',timeout:90000});report.views.push({name,state:await page.evaluate(()=>HOBBY_HOUSE.state)});fs.writeFileSync('evidence/briarwatch/report.json',JSON.stringify(report,null,2));}
  await shot('01-arrival-day');
  for(const [i,name]of[[1,'02-old-keep'],[2,'03-gatehouse'],[3,'04-courtyard'],[4,'05-river-gallery'],[5,'06-viaduct'],[6,'07-town'],[7,'08-mill'],[8,'09-woodland'],[9,'10-station'],[10,'11-estate-room']]){
   await page.evaluate(i=>document.querySelector('#roomPlaces').children[i].click(),i);await shot(name);
  }
  await page.evaluate(()=>{setView('room',false);setMood('evening',{immediate:true});});await shot('12-evening');
  for(const width of[390,320]){
   await page.setViewportSize({width,height:844});await page.evaluate(()=>{setMood('day',{immediate:true});setView('room',false);});await shot('phone-'+width);
  }
  await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>setView('follow',false));await shot('13-train-follow');
  await page.evaluate(()=>enterCinema());await shot('14-cinema');await page.evaluate(()=>leaveCinema(false));
  await page.evaluate(()=>openHouseMap());await shot('15-live-map');
  report.renderer=await page.evaluate(()=>({version:gl.getParameter(gl.VERSION),renderer:gl.getParameter(gl.RENDERER)}));
 }catch(e){report.fatal=String(e);throw e;}
 finally{fs.writeFileSync('evidence/briarwatch/report.json',JSON.stringify(report,null,2));await browser.close();}
 if(report.errors.length)throw new Error(report.errors.join('\n'));
})();
