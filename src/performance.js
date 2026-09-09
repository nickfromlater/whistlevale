'use strict';

// Opt-in, local diagnostics. No telemetry, network requests, or work in normal visits.
if(new URLSearchParams(location.search).has('profile')){
 const started=performance.now(),samples=[],stages=[],costs={},meshSizes=new WeakMap();
 let gpuBytes=0,meshes=0,drawCalls=0,vertices=0,lastRender=0,windowStart=performance.now(),lastPublish=0,longTasks=0,longestTask=0,readyAt=null;
 let timerExt=null,gpuPending=[],gpuTimes=[],gpuInfo='Unavailable',measuring=false;
 const panel=document.createElement('details');panel.id='performancePanel';panel.open=true;
 panel.style.cssText='position:fixed;right:12px;top:85px;z-index:1000;max-width:min(460px,90vw);max-height:50vh;overflow:auto;padding:12px;background:#10231fec;color:#eae3cb;border:1px solid #b9a57966;border-radius:10px;font:11px/1.5 monospace;pointer-events:auto';
 panel.innerHTML='<summary>Performance diagnostics</summary><button type="button" id="resetPerformance" style="padding:8px;margin:6px 0;color:inherit">Reset measurements</button><pre id="performanceReport" style="white-space:pre-wrap;margin:0">Opening the railway…</pre>';
 document.body.appendChild(panel);
 const report=panel.querySelector('pre'),round=n=>Math.round(n*100)/100;
 const percentile=(values,p)=>{if(!values.length)return 0;const sorted=values.slice().sort((a,b)=>a-b);return sorted[Math.min(sorted.length-1,Math.floor((sorted.length-1)*p))];};
 const cost=(key,ms)=>{const item=costs[key]||(costs[key]={ms:0,calls:0,max:0});item.ms+=ms;item.calls++;item.max=Math.max(item.max,ms);};
 function reset(){samples.length=0;gpuTimes.length=0;for(const key of Object.keys(costs))delete costs[key];longTasks=0;longestTask=0;lastRender=0;windowStart=performance.now();}
 panel.querySelector('button').onclick=reset;
 for(const type of['pointerdown','pointerup','click','keydown','wheel'])panel.addEventListener(type,e=>e.stopPropagation());
 try{new PerformanceObserver(list=>{for(const task of list.getEntries()){longTasks++;longestTask=Math.max(longestTask,task.duration);}}).observe({type:'longtask',buffered:true});}catch{}
 const measure=(name,fn)=>function(...args){const t=performance.now();try{return fn.apply(this,args);}finally{const elapsed=performance.now()-t;cost(name,elapsed);if(['createGround','rebuildGrid','buildWorld','createRoom','initializeWorkshop','buildTrains','buildValleyLife','initWalkingFigures','getHouseScene','buildShopHouse'].includes(name))stages.push({stage:name,room:typeof args[0]==='string'?args[0]:undefined,ms:round(elapsed)});}};
 createGround=measure('createGround',createGround);rebuildGrid=measure('rebuildGrid',rebuildGrid);
 buildWorld=measure('buildWorld',buildWorld);createRoom=measure('createRoom',createRoom);initializeWorkshop=measure('initializeWorkshop',initializeWorkshop);buildTrains=measure('buildTrains',buildTrains);
 buildValleyLife=measure('buildValleyLife',buildValleyLife);initWalkingFigures=measure('initWalkingFigures',initWalkingFigures);getHouseScene=measure('getHouseScene',getHouseScene);buildShopHouse=measure('buildShopHouse',buildShopHouse);
 updateSimulation=measure('simulation',updateSimulation);updateCamera=measure('camera',updateCamera);updateHobbyAudio=measure('soundscape',updateHobbyAudio);updateUI=measure('ui',updateUI);updateEditorOverlay=measure('editorOverlay',updateEditorOverlay);
 const originalUpload=upload,originalDispose=disposeMesh,originalDraw=draw,originalRender=render,originalInitGL=initGL;
 upload=function(data){const mesh=originalUpload(data),bytes=data.length*4;meshSizes.set(mesh,bytes);gpuBytes+=bytes;meshes++;return mesh;};
 disposeMesh=function(mesh){const bytes=mesh&&meshSizes.get(mesh);if(bytes){gpuBytes-=bytes;meshes--;meshSizes.delete(mesh);}return originalDispose(mesh);};
 draw=function(mesh,...args){if(mesh){const opaque=mesh.opaqueCount??mesh.count;if(opaque){drawCalls++;vertices+=opaque;}if(mesh.glass&&(args[1]??mainProgram)===mainProgram){drawCalls++;vertices+=mesh.glass.count;}}return originalDraw(mesh,...args);};
 initGL=function(){const t=performance.now();originalInitGL();stages.push({stage:'initGL',ms:round(performance.now()-t)});timerExt=gl.getExtension('EXT_disjoint_timer_query_webgl2');const debug=gl.getExtension('WEBGL_debug_renderer_info');gpuInfo=debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);};
 function publish(now){
  const dt=samples.map(s=>s.interval).filter(n=>n>0),mean=values=>values.length?values.reduce((a,b)=>a+b,0)/values.length:0;
  let audioBytes=0;if(typeof soundscape==='object'&&soundscape){const buffers=new Set([...soundscape.buffers.values(),...[...soundscape.layers.values()].map(layer=>layer.source?.buffer),...soundscape.scoreSources.map(source=>source.buffer)]);for(const buffer of buffers)if(buffer)audioBytes+=buffer.length*buffer.numberOfChannels*4;}
  const data={room:shopMap.active?'shop map':hobby.room,view:hobby.cinema?'cinema':viewMode,seconds:round((now-windowStart)/1000),frames:samples.length,fps:round(1000/mean(dt)||0),frameMs:{median:round(percentile(dt,.5)),p95:round(percentile(dt,.95)),p99:round(percentile(dt,.99))},cpuMs:Object.fromEntries(Object.entries(costs).filter(([,v])=>v.calls>4).map(([key,v])=>[key,{mean:round(v.ms/v.calls),max:round(v.max)}])),gpuMs:{median:round(percentile(gpuTimes,.5)),p95:round(percentile(gpuTimes,.95)),samples:gpuTimes.length},drawCalls:Math.round(mean(samples.map(s=>s.draws))),triangles:Math.round(mean(samples.map(s=>s.vertices/3))),memoryMB:{vertexBuffers:round(gpuBytes/1048576),decodedAudio:round(audioBytes/1048576),jsHeap:performance.memory?round(performance.memory.usedJSHeapSize/1048576):null},meshes,quality:{width:screenW,height:screenH,shadow:shadowSize,msaa:msaaSamples},gpu:gpuInfo,readyMs:readyAt,longTasks,longestTaskMs:round(longestTask),stages};
  report.textContent=JSON.stringify(data,null,2);lastPublish=now;
 }
 render=function(){
  if(measuring)return originalRender();measuring=true;const now=performance.now();
  if(hobby.ready&&readyAt===null){readyAt=round(now-started);reset();}
  drawCalls=0;vertices=0;let query=null;
  if(timerExt){
   for(let i=gpuPending.length-1;i>=0;i--){const q=gpuPending[i];if(gl.getQueryParameter(q,gl.QUERY_RESULT_AVAILABLE)){if(!gl.getParameter(timerExt.GPU_DISJOINT_EXT)){gpuTimes.push(gl.getQueryParameter(q,gl.QUERY_RESULT)/1e6);if(gpuTimes.length>900)gpuTimes.shift();}gl.deleteQuery(q);gpuPending.splice(i,1);}}
   if(frame%30===0&&gpuPending.length<4){query=gl.createQuery();gl.beginQuery(timerExt.TIME_ELAPSED_EXT,query);}
  }
  try{originalRender();}finally{
   if(query){gl.endQuery(timerExt.TIME_ELAPSED_EXT);gpuPending.push(query);}cost('render',performance.now()-now);
   if(hobby.ready){samples.push({interval:lastRender?now-lastRender:0,draws:drawCalls,vertices});if(samples.length>900)samples.shift();lastRender=now;}
   if(now-lastPublish>1000)publish(now);measuring=false;
  }
 };
 document.addEventListener('visibilitychange',()=>{lastRender=0;});
}
