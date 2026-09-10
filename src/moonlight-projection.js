'use strict';

// One silent picture per renderer. The screen shares this texture; it never
// resizes an illustration atlas or starts another animation loop.
const MOONLIGHT_FILMS=Object.freeze([
 Object.freeze({id:'trip-to-the-moon',title:'A Trip to the Moon',year:1902,maker:'Georges Méliès',excerpt:'64-second excerpt',film:'assets/moonlight/moon-clip.mp4',poster:'assets/moonlight/poster.jpg',source:'https://commons.wikimedia.org/wiki/File:Le_Voyage_dans_la_lune_(black_and_white,_1902).webm'}),
 Object.freeze({id:'arrival',title:'Arrival of a Train at La Ciotat',menuTitle:'Arrival of a Train',year:1896,maker:'Auguste and Louis Lumière',excerpt:'Complete short · 52 sec',film:'assets/moonlight/arrival-clip.mp4',poster:'assets/moonlight/arrival-poster.jpg',source:'https://commons.wikimedia.org/wiki/File:L%27Arriv%C3%A9e_d%27un_train_en_gare_de_La_Ciotat,_Complete.webm'}),
 Object.freeze({id:'train-robbery',title:'The Great Train Robbery',year:1903,maker:'Edwin S. Porter',excerpt:'Water-tower excerpt · 62 sec',film:'assets/moonlight/train-robbery-clip.mp4',poster:'assets/moonlight/train-robbery-poster.jpg',source:'https://www.loc.gov/item/00694220/'})
]);
const MOONLIGHT_STORAGE_KEY='whistlevale-moonlight-v1';let moonlightCurrentSelection=null,moonlightProgrammeSerial=0;
function moonlightName(value){return typeof value==='string'?Array.from(value.slice(0,512).normalize('NFC').replace(/\s+/gu,' ').replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/gu,'').trim()).filter(char=>char.codePointAt(0)<0xd800||char.codePointAt(0)>0xdfff).slice(0,32).join(''):'';}
function moonlightPreferences(){
 let saved={};try{saved=JSON.parse(globalThis.localStorage?.getItem(MOONLIGHT_STORAGE_KEY)||'{}')||{};}catch{}
 const embedded=globalThis.HOUSE_EMBEDDED_MOONLIGHT,film=embedded?.film??saved.film;
 return{film:MOONLIGHT_FILMS.some(item=>item.id===film)?film:MOONLIGHT_FILMS[0].id,name:moonlightName(saved.name)};
}
function moonlightExportPreferences(){return{film:moonlightCurrentSelection||moonlightPreferences().film};}
function moonlightMediaURL(kind,film=MOONLIGHT_FILMS[0].id){
 const entry=MOONLIGHT_FILMS.find(item=>item.id===film),path=entry&&['film','poster'].includes(kind)&&entry[kind];if(!path)throw new Error('Unknown Moonlight media asset.');
 return globalThis.HOUSE_EMBEDDED_MEDIA?.[path]||path;
}
async function packMoonlightMedia(){
 const media={};
 for(const path of new Set(MOONLIGHT_FILMS.flatMap(film=>[film.film,film.poster]))){
  const embedded=globalThis.HOUSE_EMBEDDED_MEDIA?.[path];if(embedded){media[path]=embedded;continue;}
  const response=await fetch(path);if(!response.ok)throw new Error('Could not pack the Moonlight picture.');
  const blob=await response.blob();media[path]=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});
 }
 return media;
}
function createMoonlightProjection(gl){
 let air=null,airTime=0,lastAirNow=null;
 let texture=null,poster=null,video=null,button=null,dirty=false,frameCallback=null,epoch=0,disposed=false,lost=false,pageSuspended=false;
 let nameTexture=null,nameCanvas=null,nameDirty=true,programme=null,nameStored=true;const preferences=moonlightPreferences();moonlightCurrentSelection=preferences.film;
 let posterStarted=false,hasPicture=false,blocked=false,failed=false,userPlay=null,lastPosition=0,lastMediaTime=-1,lastUpload=-Infinity;
 const state={visible:false,active:false,nameplateVisible:false,paused:false,reduced:false};let controlText='',controlPressed='',controlState='';
 const canPlay=()=>!disposed&&!lost&&!pageSuspended&&!document.hidden&&state.visible&&state.active&&!state.paused&&(userPlay===true||(!state.reduced&&userPlay!==false));
 const wantsPlay=()=>canPlay()&&!blocked&&!failed;
 function syncControl(){
  if(!button)return;
  const playing=wantsPlay(),text=playing?'Pause film':failed?'Retry film':'Play film',pressed=String(playing);
  if(text!==controlText){button.textContent=text;controlText=text;}
  if(pressed!==controlPressed){button.setAttribute('aria-pressed',pressed);controlPressed=pressed;}
  const disabled=disposed||lost||!state.visible||state.paused,filmState=failed?'unavailable':blocked?'paused':video&&!video.paused?'playing':playing?'loading':'paused';
  if(button.disabled!==disabled)button.disabled=disabled;
  if(button.hidden!==!state.active)button.hidden=!state.active;
  if(filmState!==controlState){button.dataset.filmState=filmState;controlState=filmState;}
 }
 function withTexture(action,destination=texture){
  const unit=gl.getParameter(gl.ACTIVE_TEXTURE),bound=gl.getParameter(gl.TEXTURE_BINDING_2D),flip=gl.getParameter(gl.UNPACK_FLIP_Y_WEBGL),alignment=gl.getParameter(gl.UNPACK_ALIGNMENT);
  try{gl.bindTexture(gl.TEXTURE_2D,destination);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.pixelStorei(gl.UNPACK_ALIGNMENT,4);action();}
  finally{gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,flip);gl.pixelStorei(gl.UNPACK_ALIGNMENT,alignment);gl.activeTexture(unit);gl.bindTexture(gl.TEXTURE_2D,bound);}
 }
 function ensureTexture(){
  if(texture)return;texture=gl.createTexture();
  withTexture(()=>{gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([44,49,44,255]));gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);});
 }
 function upload(source){
  if(disposed||lost||gl.isContextLost())return false;
  ensureTexture();withTexture(()=>gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source));hasPicture=true;return true;
 }
 function updateNameplate(){
  if(!nameDirty||!state.nameplateVisible||document.hidden||pageSuspended||disposed||lost)return;
  if(!nameCanvas){nameCanvas=document.createElement('canvas');nameCanvas.width=650;nameCanvas.height=120;}
  const c=nameCanvas.getContext('2d');if(!c)return;
  c.fillStyle='#29403a';c.fillRect(0,0,650,120);c.strokeStyle='#b9a875';c.lineWidth=2;c.strokeRect(8,8,634,104);c.strokeStyle='#7b805f';c.lineWidth=1;c.strokeRect(13,13,624,94);
  c.textAlign='center';c.textBaseline='middle';c.fillStyle='#c7bc93';c.font='12px Arial';c.fillText(preferences.name?'TONIGHT’S PROJECTIONIST':'MOONLIGHT PICTURES',325,35);
  const text=preferences.name||'PROJECTION BOOTH';let size=34;c.font=size+'px Georgia';while(size>16&&c.measureText(text).width>594)c.font=(--size)+'px Georgia';
  c.fillStyle='#f0e6c8';c.fillText(text,325,77);
  if(!nameTexture)nameTexture=gl.createTexture();
  withTexture(()=>{gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,nameCanvas);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);},nameTexture);nameDirty=false;
 }
 function ensurePoster(){
  if(posterStarted)return;posterStarted=true;const current=new Image();poster=current;
  current.onload=()=>{if(poster!==current)return;if(!disposed&&!lost&&!hasPicture)upload(current);poster=null;};
  current.onerror=()=>{if(poster===current)poster=null;};current.src=moonlightMediaURL('poster',preferences.film);
 }
 function releaseVideo(){
  if(!video)return;epoch++;
  const old=video;video=null;if(Number.isFinite(old.currentTime))lastPosition=old.currentTime;
  if(frameCallback!==null&&old.cancelVideoFrameCallback)old.cancelVideoFrameCallback(frameCallback);frameCallback=null;
  old.onloadedmetadata=old.onloadeddata=old.onplaying=old.onpause=old.onerror=null;old.pause();old.removeAttribute('src');old.load();old.remove();dirty=false;lastMediaTime=-1;
 }
 function watchFrame(current,version){
  if(!current.requestVideoFrameCallback||frameCallback!==null||!wantsPlay())return;
  frameCallback=current.requestVideoFrameCallback(()=>{if(video!==current||epoch!==version)return;frameCallback=null;if(!wantsPlay())return;dirty=true;watchFrame(current,version);});
 }
 function ensureVideo(){
  if(video)return;
  const current=document.createElement('video'),version=++epoch;video=current;
  current.hidden=true;current.tabIndex=-1;current.setAttribute('aria-hidden','true');current.dataset.moonlightFilm='true';current.muted=true;current.defaultMuted=true;current.loop=true;current.playsInline=true;current.preload='auto';
  const valid=()=>video===current&&epoch===version&&!disposed&&!lost;
  current.onloadedmetadata=()=>{if(valid()&&lastPosition>0&&Number.isFinite(current.duration))current.currentTime=Math.min(lastPosition,Math.max(0,current.duration-.05));};
  current.onloadeddata=()=>{if(valid())dirty=true;};
  current.onplaying=()=>{if(!valid())return;dirty=true;watchFrame(current,version);syncControl();};
  current.onpause=()=>{if(valid())syncControl();};
  current.onerror=()=>{if(!valid())return;failed=true;releaseVideo();syncControl();};
  current.src=moonlightMediaURL('film',preferences.film);document.body.append(current);
  try{const playing=current.play();playing?.catch(()=>{if(!valid())return;blocked=true;releaseVideo();syncControl();});}
  catch{blocked=true;releaseVideo();}syncControl();
 }
 function reconcile(){
  if(disposed||lost)return;
  if(state.visible&&!document.hidden){ensureTexture();ensurePoster();}updateNameplate();
  if(wantsPlay())ensureVideo();else releaseVideo();syncControl();
 }
 function update(next={}){
  if(disposed||lost)return;
  state.visible=Boolean(next.visible);state.active=Boolean(next.active);state.nameplateVisible=Boolean(next.nameplateVisible??next.visible);state.paused=Boolean(next.paused);state.reduced=Boolean(next.reduced);reconcile();
  const now=next.now??performance.now();
  if(lastAirNow!==null&&!state.reduced&&wantsPlay())airTime+=Math.max(0,Math.min(.065,(now-lastAirNow)/1000));lastAirNow=now;
  // Some browsers stop reporting video frames for the hidden texture source.
  // Advancing media time must still refresh the screen, within the same 24fps cap.
  if(video&&video.readyState>=2&&now-lastUpload>=1000/24-1&&(dirty||video.currentTime!==lastMediaTime)){
   try{if(upload(video)){lastMediaTime=video.currentTime;lastUpload=now;dirty=false;}}
   catch{failed=true;releaseVideo();syncControl();}
  }
 }
 function bind(unit=4,fallbackTexture=null,restoreUnit=null){
  const active=restoreUnit===null?gl.getParameter(gl.ACTIVE_TEXTURE):gl.TEXTURE0+restoreUnit;gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,texture||fallbackTexture);gl.activeTexture(active);return Boolean(texture);
 }
 function bindNameplate(unit=5,fallbackTexture=null,restoreUnit=null){
  const active=restoreUnit===null?gl.getParameter(gl.ACTIVE_TEXTURE):gl.TEXTURE0+restoreUnit;gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,nameTexture||fallbackTexture);gl.activeTexture(active);return Boolean(nameTexture);
 }
 function drawAir(options){
  if(disposed||lost||pageSuspended||document.hidden||!state.visible||!state.active||!hasPicture)return;
  if(!air)air=createMoonlightAir(gl);
  air.draw({...options,texture,time:state.reduced?0:airTime,power:wantsPlay()?1:.28});
 }
 function persist(){try{if(!globalThis.localStorage)return false;globalThis.localStorage.setItem(MOONLIGHT_STORAGE_KEY,JSON.stringify(preferences));return true;}catch{return false;}}
 function selectFilm(id){
  if(disposed||lost||!MOONLIGHT_FILMS.some(film=>film.id===id))return false;if(id===preferences.film)return true;
  releaseVideo();lastPosition=0;lastUpload=-Infinity;preferences.film=id;moonlightCurrentSelection=id;blocked=false;failed=false;hasPicture=false;posterStarted=false;
  if(poster){poster.onload=poster.onerror=null;poster.src='';poster=null;}persist();syncProgramme();reconcile();return true;
 }
 function setName(value){
  if(disposed||lost)return '';const name=moonlightName(value);if(name!==preferences.name){preferences.name=name;nameDirty=true;nameStored=persist();updateNameplate();}syncProgramme();return name;
 }
 function syncProgramme(){
  if(!programme)return;const film=MOONLIGHT_FILMS.find(item=>item.id===preferences.film);
  programme.select.value=film.id;programme.credit.textContent=film.title+' · '+film.year+' · '+film.maker+' · '+film.excerpt;
  programme.source.href=film.source;programme.summary.textContent=preferences.name?'Projectionist: '+preferences.name:'Put your name on the booth';
  programme.clear.hidden=!preferences.name;
 }
 function createProgramme({onBoothView}={}){
  setProgramme(null);const make=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text)node.textContent=text;return node;},id='moonlight-programme-'+(++moonlightProgrammeSerial);
  const root=make('section','moonlight-programme');root.dataset.moonlightProgramme='true';root.setAttribute('aria-label','Moonlight Drive-In programme');
  const label=make('label','moonlight-programme-label','Now showing'),row=make('div','moonlight-programme-transport'),select=make('select'),play=make('button','moonlight-programme-play');select.id=id+'-film';label.htmlFor=select.id;play.type='button';
  for(const film of MOONLIGHT_FILMS){const option=make('option','',film.menuTitle||film.title);option.value=film.id;select.append(option);}
  const credit=make('p','moonlight-programme-credit'),source=make('a','moonlight-programme-source','Film source ↗');source.target='_blank';source.rel='noopener noreferrer';
  const details=make('details','moonlight-programme-name'),summary=make('summary'),form=make('form'),nameLabel=make('label','moonlight-programme-label','Tonight’s projectionist'),fields=make('div','moonlight-programme-fields'),input=make('input'),save=make('button','','Save name'),actions=make('div','moonlight-programme-name-actions'),clear=make('button','','Clear name'),booth=typeof onBoothView==='function'?make('button','','Look at the booth'):null,hint=make('p','moonlight-programme-hint','Just for you, on this device.'),status=make('p','moonlight-programme-status');
  input.id=id+'-name';input.type='text';input.name='projectionist';input.maxLength=128;input.autocomplete='nickname';input.placeholder='Your name';input.value=preferences.name;nameLabel.htmlFor=input.id;hint.id=id+'-hint';input.setAttribute('aria-describedby',hint.id);save.type='submit';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  clear.type='button';if(booth){booth.type='button';actions.append(booth);}actions.append(clear);
  row.append(select,play);fields.append(input,save);form.append(nameLabel,fields,actions,hint,status);details.append(summary,form);root.append(label,row,credit,source,details);
  const change=()=>{if(!selectFilm(select.value))select.value=preferences.film;};
  const submit=event=>{event.preventDefault();input.value=setName(input.value);status.textContent=input.value?(nameStored?'Your name is on the booth. Saved on this device.':'Your name is on the booth for this visit.'):'The original booth sign is back.';};
  const clearName=()=>{input.value=setName('');status.textContent='The original booth sign is back.';};
  select.addEventListener('change',change);form.addEventListener('submit',submit);clear.addEventListener('click',clearName);booth?.addEventListener('click',onBoothView);programme={root,select,credit,source,summary,input,form,change,submit,clear,clearName,booth,onBoothView};setControl(play);syncProgramme();return root;
 }
 function setProgramme(next){
  if(next!==null)throw new Error('Use createProgramme to open the drive-in programme.');if(!programme)return;
  programme.select.removeEventListener('change',programme.change);programme.form.removeEventListener('submit',programme.submit);programme.clear.removeEventListener('click',programme.clearName);programme.booth?.removeEventListener('click',programme.onBoothView);programme=null;setControl(null);
 }
 function toggle(){if(disposed||lost)return;userPlay=!(canPlay()&&!blocked&&!failed);blocked=false;failed=false;reconcile();}
 function setControl(next){if(button===next)return;if(button)button.removeEventListener('click',toggle);button=next;controlText='';controlPressed='';controlState='';if(button){button.addEventListener('click',toggle);syncControl();}}
 function onVisibility(){lastAirNow=null;reconcile();}
 function onPageHide(event){if(event.persisted){pageSuspended=true;releaseVideo();syncControl();}else dispose();}
 function onPageShow(){if(!pageSuspended)return;pageSuspended=false;reconcile();}
 function onLost(){air?.dispose();air=null;lost=true;releaseVideo();texture=null;nameTexture=null;syncControl();}
 function dispose(){
  if(disposed)return;disposed=true;air?.dispose();air=null;releaseVideo();if(poster){poster.onload=poster.onerror=null;poster.src='';poster=null;}
  if(!lost&&!gl.isContextLost()){if(texture)gl.deleteTexture(texture);if(nameTexture)gl.deleteTexture(nameTexture);}texture=null;nameTexture=null;nameCanvas=null;setProgramme(null);setControl(null);
  document.removeEventListener('visibilitychange',onVisibility);globalThis.removeEventListener('pagehide',onPageHide);globalThis.removeEventListener('pageshow',onPageShow);gl.canvas.removeEventListener('webglcontextlost',onLost);
 }
 document.addEventListener('visibilitychange',onVisibility);globalThis.addEventListener('pagehide',onPageHide);globalThis.addEventListener('pageshow',onPageShow);gl.canvas.addEventListener('webglcontextlost',onLost);
 return{update,bind,bindNameplate,drawAir,toggle,setControl,createProgramme,setProgramme,selectFilm,setName,dispose};
}

// The original film-lit dust, kept in native model coordinates. Seeds stay on
// the GPU; slow curling drift and flutter need no CPU particle/frame loop.
function moonlightAirSeeds(){
 let seed=481516;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296),data=new Float32Array(3600*6);
 for(let i=0;i<data.length;i+=6){data[i]=rand()*15.2-7.6;data[i+1]=1.3+rand()*12.3;data[i+2]=rand()*21.2-10.7;data[i+3]=rand()*Math.PI*2;data[i+4]=rand()>.91?1.05+rand()*.85:.20+rand()*.52;data[i+5]=.35+rand()*.65;}
 return data;
}
function createMoonlightAir(gl){
 const vs=`#version 300 es
 precision highp float;
 layout(location=0)in vec3 aPosition;layout(location=1)in vec3 aParams;
 uniform mat4 uVP,uModel;uniform vec3 uEye;uniform float uTime,uHeight;
 out vec2 movieUV;out float opacityBase,flutter,rotation,elongation,scatter;
 void main(){
  float t=uTime;vec3 p=aPosition;
  // Broad, slow currents with individual drift; every path stays bounded.
  p.x+=sin(t*.13+aPosition.z*.23)*.72+sin(t*.21+aParams.x)*.16;
  p.y+=cos(t*.11+aPosition.x*.31)*.43+sin(t*.17+aParams.x)*.12;
  p.z+=sin(t*.09+aPosition.y*.30+aParams.x)*.38;
  vec3 lens=vec3(-.6,3.52,9.59);float f=(p.z-lens.z)/(-9.805-lens.z);
  movieUV=(p.xy-mix(lens.xy,vec2(0.,8.1),f))/(vec2(12.6,9.45)*max(f,.002)+vec2(.025))+.5;
  opacityBase=aParams.z*step(.005,f)*step(f,.995);
  flutter=.56+.44*pow(abs(sin(t*(.32+aParams.z*.23)+aParams.x)),.65);
  rotation=aParams.x+t*.21;elongation=mix(1.,.42,smoothstep(.9,1.8,aParams.y));
  vec3 world=(uModel*vec4(p,1.)).xyz,worldLens=(uModel*vec4(lens,1.)).xyz;
  float mu=dot(normalize(world-worldLens),normalize(uEye-world));
  scatter=.33+.22*.8775/pow(1.1225-.7*mu,1.5);
  gl_Position=uVP*vec4(world,1.);
  float scale=length(uModel[0].xyz);
  gl_PointSize=clamp(aParams.y*uHeight*.10*scale/max(.02,gl_Position.w),.7,9.);
 }`;
 const fs=`#version 300 es
 precision highp float;
 uniform sampler2D uFilm;uniform float uPower,uTime;
 in vec2 movieUV;in float opacityBase,flutter,rotation,elongation,scatter;out vec4 frag;
 void main(){
  vec2 q=gl_PointCoord-.5;float cs=cos(rotation),sn=sin(rotation);q=mat2(cs,-sn,sn,cs)*q;q.y/=elongation;
  float r=length(q)*2.;if(r>1.||opacityBase==0.)discard;
  float edge=smoothstep(0.,.045,movieUV.x)*smoothstep(0.,.045,movieUV.y)*smoothstep(0.,.045,1.-movieUV.x)*smoothstep(0.,.045,1.-movieUV.y);
  if(edge<.001)discard;
  float l=dot(texture(uFilm,clamp(movieUV,.001,.999)).rgb,vec3(.299,.587,.114));
  float spot=exp(-r*r*5.5)*.84+exp(-r*r*1.8)*.16;
  float lit=(.025+.975*pow(l,.72))*(.997+.003*sin(uTime*19.));
  float a=spot*lit*opacityBase*edge*uPower*flutter*scatter;
  frag=vec4(vec3(.93,.955,.80)*1.5,a*.92);
 }`;
 let program=null,vao=null,buffer=null;const uniforms={};
 function dispose(){if(!gl.isContextLost()){if(buffer)gl.deleteBuffer(buffer);if(vao)gl.deleteVertexArray(vao);if(program)gl.deleteProgram(program);}buffer=vao=program=null;}
 try{
  program=gl.createProgram();
  for(const [type,source]of[[gl.VERTEX_SHADER,vs],[gl.FRAGMENT_SHADER,fs]]){
   const shader=gl.createShader(type);try{gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));gl.attachShader(program,shader);}finally{gl.deleteShader(shader);}
  }
  gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
  for(const name of ['uVP','uModel','uEye','uTime','uHeight','uFilm','uPower'])uniforms[name]=gl.getUniformLocation(program,name);
  vao=gl.createVertexArray();buffer=gl.createBuffer();gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,moonlightAirSeeds(),gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,24,0);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,3,gl.FLOAT,false,24,12);
 }catch(error){dispose();throw error;}finally{gl.bindVertexArray(null);gl.bindBuffer(gl.ARRAY_BUFFER,null);}
 // Called between transparent scene geometry and the existing room particles:
 // depth test remains enabled; restore the caller's program/texture unit and
 // the pass's normal blend/depth-write baseline, including when drawing fails.
 function draw({vp,model,eye,height,night,time,power,texture,restoreProgram,restoreUnit}){
  if(!program)return;
  try{
   gl.useProgram(program);gl.uniformMatrix4fv(uniforms.uVP,false,vp);gl.uniformMatrix4fv(uniforms.uModel,false,model);gl.uniform3fv(uniforms.uEye,eye);
   gl.uniform1f(uniforms.uTime,time);gl.uniform1f(uniforms.uHeight,height);gl.uniform1f(uniforms.uPower,power*(.22+.78*night));gl.uniform1i(uniforms.uFilm,4);
   gl.activeTexture(gl.TEXTURE0+4);gl.bindTexture(gl.TEXTURE_2D,texture);gl.bindVertexArray(vao);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.depthMask(false);gl.drawArrays(gl.POINTS,0,3600);
  }finally{gl.depthMask(true);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.disable(gl.BLEND);gl.bindVertexArray(null);gl.activeTexture(gl.TEXTURE0+restoreUnit);gl.useProgram(restoreProgram);}
 }
 return{draw,dispose};
}
