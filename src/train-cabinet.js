'use strict';

// The cabinet is optional. It owns one on-demand preview context; the railway's
// simulation keeps running, but its obscured scene need not spend GPU time.
const trainCabinet={open:false,room:null,draft:null,filter:'all',full:false,lift:false,moving:false,preview:null,token:0,opener:null,ready:false};
const cabinetIcons={close:'<path d="m7 7 10 10M17 7 7 17"/>',arrow:'<path d="M4 12h15m-6-6 6 6-6 6"/>',reset:'<path d="M5 8a8 8 0 1 1-1 7M5 3v5h5"/>',roof:'<path d="m3 11 9-6 9 6M5 15h14M5 19h14M12 5V2"/>',play:'<path d="m9 5 10 7-10 7Z"/>',pause:'<path d="M9 5v14M15 5v14"/>',zoom:'<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5M7 10h6M10 7v6"/>'};
const cabinetIcon=name=>'<svg viewBox="0 0 24 24" aria-hidden="true">'+cabinetIcons[name]+'</svg>';
function cabinetSilhouette(q){
 const paint=q.liveries[0][1],line=q.liveries[0][2],steam=q.power==='steam',tender=['tender','express'].includes(q.family);
 let shape='';
 if(steam){
  shape=`<path d="M38 56h98v5H38Z" fill="#39463d"/><rect x="49" y="34" width="76" height="23" rx="10" fill="${paint}"/><path d="M46 27h23v29H46Z" fill="${paint}"/><path d="M43 26h29v4H43Z" fill="#425248"/><path d="M50 32h14v11H50Z" fill="#bec7ae"/><path d="M116 36V21h8v15M88 34v-9h10v9" fill="${line}"/>`;
  if(q.family==='tank')shape+=`<path d="M65 43h42v13H65Z" fill="${paint}" stroke="${line}" stroke-width="1"/>`;
  if(q.family==='saddle')shape+=`<path d="M65 45V32q22-13 42 0v13Z" fill="${paint}" stroke="${line}"/>`;
  if(tender)shape+=`<path d="M6 42h30v18H6Z" fill="${paint}"/><path d="M7 42q15-9 28 0" fill="#39463d"/>`;
  if(q.family==='express')shape+=`<path d="M103 28h17v27h-17Z" fill="${paint}" stroke="${line}"/>`;
  for(const x of[60,78,96])shape+=`<circle cx="${x}" cy="60" r="10" fill="#344138" stroke="${line}" stroke-width="2"/><path d="M${x-6} 60h12m-6-6v12" stroke="${paint}" stroke-width="2"/>`;
  shape+='<path d="M58 62h41" stroke="#d3c396" stroke-width="2"/>';
  if(tender)for(const x of[13,29])shape+=`<circle cx="${x}" cy="62" r="6" fill="#374439"/>`;
 }else if(q.family==='shunter'){
  shape=`<path d="M17 56h123v6H17Z" fill="#39483c"/><path d="M27 24h33v33H27Z" fill="${paint}"/><path d="M25 23h37v5H25Z" fill="#344c3e"/><path d="M33 30h20v14H33Z" fill="#c4ccb5"/><path d="M59 37h63v20H59Z" fill="${paint}"/><path d="M100 37V24h5v13" fill="#3b493e"/>`;
  for(let i=0;i<7;i++)shape+=`<path d="M${68+i*7} 41v13" stroke="#384c40" stroke-width="2"/>`;
  shape+=`<path d="M18 53v-9h112v9" fill="none" stroke="${line}" stroke-width="2"/>`;
  for(const x of[35,49,105,119])shape+=`<circle cx="${x}" cy="63" r="6" fill="#33473b" stroke="#a6b39b"/>`;
 }else{
  shape=`<path d="m12 58 5-25q3-6 11-6h100q8 0 11 6l5 25Z" fill="${paint}"/><path d="M21 28h113v21H21Z" fill="#e4d6b7"/><path d="M17 56h125v5H17Z" fill="#394c3f"/>`;
  for(let i=0;i<8;i++)shape+=`<rect x="${24+i*13}" y="32" width="9" height="13" rx="1" fill="#698881"/>`;
  if(q.power==='electric')shape+=`<path d="m75 25-12-9 12-10 12 10-12 9M66 5h18" fill="none" stroke="${line}" stroke-width="2"/>`;
  if(q.family==='panorama')shape+=`<path d="M32 27v-7h79v7" fill="#8caaa0" stroke="${line}"/>`;
  for(const x of[28,42,112,126])shape+=`<circle cx="${x}" cy="62" r="6" fill="#33473b" stroke="#a6b39b"/>`;
 }
 return `<svg viewBox="0 0 156 80" aria-hidden="true"><path d="M2 71h150" stroke="#b7ae90" stroke-width="1"/>${shape}</svg>`;
}

const CABINET_VS=`#version 300 es
precision highp float;
layout(location=0)in vec3 aPosition;layout(location=1)in vec3 aNormal;layout(location=2)in vec3 aColor;layout(location=3)in float aMat;layout(location=4)in vec2 aUV;
uniform mat4 uModel,uVP,uLightVP;out vec3 vPosition,vNormal,vColor;out float vMat;out vec2 vUV;out vec4 vShadow;
void main(){vec4 p=uModel*vec4(aPosition,1.);vPosition=p.xyz;vNormal=transpose(inverse(mat3(uModel)))*aNormal;vColor=aColor;vMat=aMat;vUV=aUV;vShadow=uLightVP*p;gl_Position=uVP*p;}`;
const CABINET_FS=`#version 300 es
precision highp float;
in vec3 vPosition,vNormal,vColor;in float vMat;in vec2 vUV;in vec4 vShadow;uniform vec3 uEye;uniform sampler2D uAtlas,uShadow;out vec4 frag;
float shadow(vec3 n){vec3 p=vShadow.xyz/vShadow.w*.5+.5;if(p.x<0.||p.x>1.||p.y<0.||p.y>1.||p.z>1.)return 1.;float s=0.,bias=max(.0012*(1.-dot(n,normalize(vec3(-3.,7.,4.)))),.00025);for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++)s+=p.z-bias<=texture(uShadow,p.xy+vec2(x,y)/1024.).r?1.:.38;return s/9.;}
void main(){vec3 n=normalize(vNormal),v=normalize(uEye-vPosition),base=vMat>14.5&&vMat<15.5?texture(uAtlas,vUV).rgb:vColor;
 float metal=abs(vMat-41.)<.5?.72:.12,rough=abs(vMat-41.)<.5?.21:.43;
 if(abs(vMat-43.)<.5){base=mix(base,vec3(.73,.86,.82),pow(1.-max(dot(n,v),0.),3.)*.58);rough=.13;metal=.45;}
 if(abs(vMat-22.)<.5)base*=.96+.04*sin(vPosition.z*110.+sin(vPosition.x*28.)*3.);
 vec3 key=normalize(vec3(-3.,7.,4.)),fill=normalize(vec3(5.,3.,-4.)),halfway=normalize(key+v);float shade=shadow(n),hemi=n.y*.5+.5;
 vec3 linear=pow(base,vec3(2.2));vec3 light=linear*(vec3(.40,.45,.43)*(.5+.5*hemi)+vec3(1.8,1.63,1.34)*max(dot(n,key),0.)*shade+vec3(.39,.51,.60)*max(dot(n,fill),0.));
 light+=vec3(1.1,1.0,.83)*pow(max(dot(n,halfway),0.),mix(18.,160.,1.-rough))*mix(.08,.50,metal)*shade;
 light+=linear*.11*pow(1.-max(dot(n,v),0.),2.);if(abs(vMat-10.)<.5)light+=linear*.55;
 frag=vec4(pow(light/(vec3(1.)+light*.32),vec3(1./2.2)),1.);}`;
const CABINET_SHADOW_FS=`#version 300 es
precision highp float;void main(){}`;
class CabinetPreview{
 constructor(canvas,onFrame){
  this.canvas=canvas;this.onFrame=onFrame;this.frame=0;this.phase=0;this.last=0;this.stock=null;this.stage=null;this.pointers=new Map();this.choice=null;this.reset();
  const g=this.g=canvas.getContext('webgl2',{alpha:true,antialias:true,preserveDrawingBuffer:true,powerPreference:'low-power'});if(!g){this.stop();throw Error('The 3D preview is unavailable on this device.');}
  try{
  const compile=(source,type)=>{const shader=g.createShader(type);g.shaderSource(shader,source);g.compileShader(shader);if(!g.getShaderParameter(shader,g.COMPILE_STATUS)){const message=g.getShaderInfoLog(shader);g.deleteShader(shader);throw Error(message);}return shader;};
  const program=fragment=>{const p=g.createProgram();let v,f;try{v=compile(CABINET_VS,g.VERTEX_SHADER);f=compile(fragment,g.FRAGMENT_SHADER);g.attachShader(p,v);g.attachShader(p,f);g.linkProgram(p);if(!g.getProgramParameter(p,g.LINK_STATUS))throw Error(g.getProgramInfoLog(p));return p;}catch(error){g.deleteProgram(p);throw error;}finally{if(v)g.deleteShader(v);if(f)g.deleteShader(f);}};
  this.program=program(CABINET_FS);this.shadow=program(CABINET_SHADOW_FS);this.uniforms=new Map();
  this.atlas=g.createTexture();g.bindTexture(g.TEXTURE_2D,this.atlas);g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL,true);g.texImage2D(g.TEXTURE_2D,0,g.RGBA,g.RGBA,g.UNSIGNED_BYTE,atlas);g.generateMipmap(g.TEXTURE_2D);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,g.LINEAR_MIPMAP_LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MAG_FILTER,g.LINEAR);g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL,false);
  this.depth=g.createTexture();g.bindTexture(g.TEXTURE_2D,this.depth);g.texImage2D(g.TEXTURE_2D,0,g.DEPTH_COMPONENT24,1024,1024,0,g.DEPTH_COMPONENT,g.UNSIGNED_INT,null);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,g.NEAREST);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MAG_FILTER,g.NEAREST);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_S,g.CLAMP_TO_EDGE);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_T,g.CLAMP_TO_EDGE);
  this.fbo=g.createFramebuffer();g.bindFramebuffer(g.FRAMEBUFFER,this.fbo);g.framebufferTexture2D(g.FRAMEBUFFER,g.DEPTH_ATTACHMENT,g.TEXTURE_2D,this.depth,0);g.drawBuffers([g.NONE]);g.readBuffer(g.NONE);if(g.checkFramebufferStatus(g.FRAMEBUFFER)!==g.FRAMEBUFFER_COMPLETE)throw Error('The model lighting could not start.');g.bindFramebuffer(g.FRAMEBUFFER,null);
  this.abort=new AbortController();this.listen=(type,fn,options={})=>canvas.addEventListener(type,fn,{...options,signal:this.abort.signal});
  this.resizeObserver=new ResizeObserver(()=>this.request());this.resizeObserver.observe(canvas);
  this.listen('webglcontextlost',event=>{event.preventDefault();this.stop();$('cabinetPreviewNote').textContent='Restoring the model preview…';});
  this.listen('pointerdown',event=>{if(event.button!==0)return;event.preventDefault();canvas.focus({preventScroll:true});canvas.setPointerCapture(event.pointerId);this.pointers.set(event.pointerId,[event.clientX,event.clientY]);});
  this.listen('pointermove',event=>{
   if(!this.pointers.has(event.pointerId))return;const before=this.pointers.get(event.pointerId),old=[...this.pointers.values()];this.pointers.set(event.pointerId,[event.clientX,event.clientY]);
   if(this.pointers.size===2){const points=[...this.pointers.values()],a=Math.hypot(old[0][0]-old[1][0],old[0][1]-old[1][1]),b=Math.hypot(points[0][0]-points[1][0],points[0][1]-points[1][1]);if(a>6&&b>6)this.zoom=clamp(this.zoom*a/b,.45,1.8);}
   else{this.yaw-=(event.clientX-before[0])*.008;this.pitch=clamp(this.pitch+(event.clientY-before[1])*.006,.04,1.1);}this.request();
  });
  for(const type of['pointerup','pointercancel','lostpointercapture'])this.listen(type,event=>{this.pointers.delete(event.pointerId);if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);});
  this.listen('wheel',event=>{event.preventDefault();this.zoom=clamp(this.zoom*Math.exp(clamp(event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?canvas.clientHeight:1),-200,200)*.002),.45,1.8);this.request();},{passive:false});
  this.listen('webglcontextrestored',()=>{this.destroy();if(trainCabinet.preview===this)trainCabinet.preview=null;if(trainCabinet.open)prepareCabinetPreview();});
  }catch(error){this.destroy();throw error;}
 }
 uniform(program,name){const key=(program===this.program?'main:':'shadow:')+name;if(!this.uniforms.has(key))this.uniforms.set(key,this.g.getUniformLocation(program,name));return this.uniforms.get(key);}
 upload(mesh){const g=this.g,vao=g.createVertexArray(),buffer=g.createBuffer();g.bindVertexArray(vao);g.bindBuffer(g.ARRAY_BUFFER,buffer);g.bufferData(g.ARRAY_BUFFER,mesh.data,g.STATIC_DRAW);[3,3,3,1,2].forEach((n,i)=>{g.enableVertexAttribArray(i);g.vertexAttribPointer(i,n,g.FLOAT,false,48,[0,12,24,36,40][i]);});return {vao,buffer,count:mesh.count};}
 dispose(mesh){if(!mesh)return;this.g.deleteBuffer(mesh.buffer);this.g.deleteVertexArray(mesh.vao);}
 destroy(){this.release();this.abort?.abort();this.resizeObserver?.disconnect();const g=this.g;if(!g)return;for(const p of[this.program,this.shadow])if(p)g.deleteProgram(p);for(const t of[this.atlas,this.depth])if(t)g.deleteTexture(t);if(this.fbo)g.deleteFramebuffer(this.fbo);}
 reset(){this.yaw=trainCabinet.full?-1.28:-1.08;this.pitch=.22;this.zoom=1;this.request();}
 setModel(choice){
  const geometry=collectionGeometry(choice),next={};
  this.bounds={};for(const [part,mesh]of Object.entries(geometry)){const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];for(let i=0;i<mesh.data.length;i+=12)for(let axis=0;axis<3;axis++){min[axis]=Math.min(min[axis],mesh.data[i+axis]);max[axis]=Math.max(max[axis],mesh.data[i+axis]);}this.bounds[part]={min,max};}this.modelHeight=Math.max(...Object.values(this.bounds).map(b=>b.max[1]));
  const g=this.g;g.activeTexture(g.TEXTURE0);g.bindTexture(g.TEXTURE_2D,this.atlas);g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL,true);g.texImage2D(g.TEXTURE_2D,0,g.RGBA,g.RGBA,g.UNSIGNED_BYTE,atlas);g.generateMipmap(g.TEXTURE_2D);g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL,false);
  try{for(const [key,mesh]of Object.entries(geometry))next[key]=this.upload(mesh);}catch(error){for(const mesh of Object.values(next))this.dispose(mesh);throw error;}
  if(this.stock)for(const mesh of Object.values(this.stock))this.dispose(mesh);this.stock=next;this.choice={...choice};this.phase=0;this.setFormation();this.request();
 }
 setFormation(){
  if(!this.choice)return;
  const ds=collectionOffsets({...this.choice,cars:trainCabinet.full?this.choice.cars:0}),last=ds.at(-1),engine=this.bounds.loco||this.bounds.motor,tail=trainCabinet.full?(this.bounds.tail||this.bounds.trailer):this.bounds.tender||engine,front=engine.max[2]+.24,back=last-tail.min[2]+.24,length=front+back,center=(front-back)/2;
  this.span=length;this.center=center;const b=new Builder();
  b.box(0,-.29,center,1.92,.18,length,'#5b4b37',22);b.box(0,-.19,center,1.98,.032,length+.05,'#a28c65',22);
  for(const x of[-.98,.98])b.box(x,-.248,center,.012,.023,length-.04,'#c1a46d',41);
  for(let z=center-length/2+.13;z<center+length/2;z+=.23)b.box(0,-.12,z,1.10,.10,.125,'#807051',22);
  for(const x of[-.32,.32]){b.box(x,-.027,center,.042,.11,length-.05,'#a3ada4',41);b.box(x,.037,center,.064,.027,length-.06,'#c3cabd',41);}
  const next=this.upload({data:new Float32Array(b.data),count:b.data.length/12});this.dispose(this.stage);this.stage=next;this.request();
 }
 request(){if(!trainCabinet.open||document.hidden||this.frame)return;this.frame=requestAnimationFrame(now=>this.render(now));}
 stop(){cancelAnimationFrame(this.frame);this.frame=0;this.last=0;for(const id of this.pointers.keys())if(this.canvas.hasPointerCapture(id))this.canvas.releasePointerCapture(id);this.pointers.clear();}
 release(){this.stop();if(this.stock)for(const mesh of Object.values(this.stock))this.dispose(mesh);this.stock=null;this.dispose(this.stage);this.stage=null;this.choice=null;}
 render(now,pixelRatio=null){
  this.frame=0;if(!trainCabinet.open||document.hidden||!this.stock||this.g.isContextLost())return;
  if(trainCabinet.moving&&this.last&&now-this.last<33){this.request();return;}
  if(trainCabinet.moving)this.phase+=Math.min(.08,this.last?(now-this.last)/1000:0)*2.4;this.last=now;
  const g=this.g,canvas=this.canvas,ratio=pixelRatio??Math.min(devicePixelRatio||1,2),width=Math.max(1,Math.round(canvas.clientWidth*ratio)),height=Math.max(1,Math.round(canvas.clientHeight*ratio));if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
  const target=[0,(this.modelHeight-.308)/2,this.center],outward=[Math.sin(this.yaw)*Math.cos(this.pitch),Math.sin(this.pitch),Math.cos(this.yaw)*Math.cos(this.pitch)],right=norm(cross([0,1,0],outward)),up=cross(outward,right),tan=Math.tan(.40/2);
  let fit=0;for(const x of[-1,1])for(const y of[-.38,this.modelHeight+.072])for(const z of[-this.span/2,this.span/2]){const v=[x,y-target[1],z],depth=dot(v,outward);fit=Math.max(fit,Math.abs(dot(v,right))/(tan*width/height)+depth,Math.abs(dot(v,up))/tan+depth);}
  const eye=add(target,mul(outward,fit*1.10*this.zoom));
  const vp=mm(perspective(.40,width/height,.1,160),lookAt(eye,target)),extent=Math.max(4,this.span*.64),lightVP=mm(ortho(-extent,extent,-extent,extent,.1,90),lookAt(add(target,[-12,24,15]),target));
  const records=[],original=draw;
  try{draw=(mesh,model)=>{if(mesh)records.push({mesh,model});};drawSelectedCollection({...this.choice,cars:trainCabinet.full?this.choice.cars:0},offset=>trans(0,.072,-offset),this.program,this.phase,this.stock,trainCabinet.lift);}finally{draw=original;}
  const paint=(program,matrix,list)=>{g.useProgram(program);g.uniformMatrix4fv(this.uniform(program,'uVP'),false,matrix);g.uniformMatrix4fv(this.uniform(program,'uLightVP'),false,lightVP);for(const {mesh,model}of list){g.uniformMatrix4fv(this.uniform(program,'uModel'),false,model);g.bindVertexArray(mesh.vao);g.drawArrays(g.TRIANGLES,0,mesh.count);}};
  g.enable(g.DEPTH_TEST);g.disable(g.CULL_FACE);g.disable(g.BLEND);g.bindFramebuffer(g.FRAMEBUFFER,this.fbo);g.viewport(0,0,1024,1024);g.clear(g.DEPTH_BUFFER_BIT);paint(this.shadow,lightVP,records);
  g.bindFramebuffer(g.FRAMEBUFFER,null);g.viewport(0,0,width,height);g.clearColor(0,0,0,0);g.clear(g.COLOR_BUFFER_BIT|g.DEPTH_BUFFER_BIT);g.useProgram(this.program);g.uniform3fv(this.uniform(this.program,'uEye'),eye);g.activeTexture(g.TEXTURE0);g.bindTexture(g.TEXTURE_2D,this.atlas);g.uniform1i(this.uniform(this.program,'uAtlas'),0);g.activeTexture(g.TEXTURE1);g.bindTexture(g.TEXTURE_2D,this.depth);g.uniform1i(this.uniform(this.program,'uShadow'),1);paint(this.program,vp,[{mesh:this.stage,model:I},...records]);g.bindVertexArray(null);
  this.onFrame?.();if(trainCabinet.moving)this.request();
 }
}

function collectionPortraitURL(id){
 const embedded=$('embeddedTrainPortraits')?.textContent;
 if(embedded&&embedded.trim()!=='null')try{const url=JSON.parse(embedded)[id];if(typeof url==='string'&&url.startsWith('data:image/webp;base64,'))return url;}catch{}
 return 'assets/trains/'+id+'.webp';
}
function cabinetFiltered(){return TRAIN_COLLECTION.filter(q=>trainCabinet.filter==='all'||q.power===trainCabinet.filter);}
function paintCabinetCards(){
 const list=$('cabinetTrains');list.replaceChildren();const active=collectionActiveChoice(trainCabinet.room);
 for(const q of cabinetFiltered()){
  const button=document.createElement('button');button.type='button';button.className='cabinet-card';button.dataset.train=q.id;button.setAttribute('aria-pressed',String(q.id===trainCabinet.draft.id));button.setAttribute('aria-label',q.name+', '+q.arrangement+' '+q.power+(q.id===active?.id?', currently running':''));
  button.innerHTML=`<span class="cabinet-card-art">${cabinetSilhouette(q)}<img alt="" hidden></span><span class="cabinet-card-copy"><strong>${q.name}</strong><span>${q.arrangement} · ${q.power}</span></span><span class="cabinet-card-number">${q.number}</span>${q.id===active?.id?'<span class="cabinet-in-service" title="Currently running">In service</span>':''}`;
  const image=button.querySelector('img');image.decoding='async';image.onload=()=>{image.hidden=false;};image.onerror=()=>{image.hidden=true;};image.src=collectionPortraitURL(q.id);
  button.onclick=()=>selectCabinetTrain(q.id);list.append(button);
 }
 $('cabinetCollectionCount').textContent=String(cabinetFiltered().length).padStart(2,'0');
 for(const button of document.querySelectorAll('[data-train-filter]'))button.setAttribute('aria-pressed',String(button.dataset.trainFilter===trainCabinet.filter));
}
function cabinetUpdateAction(){
 const q=collectionById.get(trainCabinet.draft.id),active=collectionActiveChoice(trainCabinet.room),same=!!active&&['id','livery','cars'].every(key=>active[key]===trainCabinet.draft[key]);
 $('cabinetRun').disabled=same;$('cabinetRun').innerHTML=(same?'On the railway':'Run '+q.name)+cabinetIcon('arrow');
 $('cabinetCurrent').textContent='Currently running · '+collectionTrainLabel(trainCabinet.room).name;
 $('cabinetRestore').hidden=!selectedCollection[trainCabinet.room];
 $('cabinetRestore').textContent='Restore room train';$('cabinetRestore').title=HOUSE_ROOMS[trainCabinet.room]?.train?.name||'Original room train';
}
function paintCabinetDetails(){
 const q=collectionById.get(trainCabinet.draft.id),choice=trainCabinet.draft;
 $('cabinetCredit').textContent=q.credits?.length?'Model by '+communityCreditLine(q.credits):'';
 $('cabinetName').textContent=q.name;$('cabinetNumber').textContent='№ '+q.number;$('cabinetTag').textContent=q.tag;$('cabinetDescription').textContent=q.description;$('cabinetPower').textContent=q.power;$('cabinetWheels').textContent=q.arrangement;
 $('cabinetDetails').replaceChildren(...q.details.map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));
 $('cabinetLiveries').replaceChildren(...q.liveries.map((v,index)=>{const button=document.createElement('button');button.type='button';button.className='cabinet-swatch';button.style.setProperty('--paint',v[1]);button.style.setProperty('--trim',v[2]);button.setAttribute('aria-label',v[0]);button.title=v[0];button.innerHTML='<span class="cabinet-swatch-paint"></span><span>'+v[0]+'</span>';button.setAttribute('aria-pressed',String(index===choice.livery));button.onclick=()=>{if(trainCabinet.draft.livery===index)return;trainCabinet.draft={...trainCabinet.draft,livery:index};paintCabinetDetails();$('cabinetLiveries').children[index].focus({preventScroll:true});prepareCabinetPreview();};return button;}));
 $('cabinetLiveryName').textContent=q.liveries[choice.livery][0];const options=cabinetFiltered();$('cabinetPosition').textContent=String(options.findIndex(v=>v.id===q.id)+1).padStart(2,'0')+' / '+String(options.length).padStart(2,'0');$('cabinetCarsLabel').textContent=q.formation==='wagons'?'Goods wagons':q.formation==='trailers'?'Trailing cars':'Passenger coaches';$('cabinetCars').value=String(choice.cars);$('cabinetPreview').setAttribute('aria-label','3D model of '+q.name+'. Drag or use arrow keys to rotate. Plus and minus zoom. Zero resets.');
 for(const button of $('cabinetTrains').querySelectorAll('button'))button.setAttribute('aria-pressed',String(button.dataset.train===q.id));cabinetUpdateAction();
}
function selectCabinetTrain(id){
 if(!collectionById.has(id)||id===trainCabinet.draft.id)return;
 $('cabinetStatus').textContent='';const active=collectionChoice(trainCabinet.room),q=collectionById.get(id);trainCabinet.draft=id===active.id?{...active}:{id,livery:0,cars:q.cars};trainCabinet.lift=false;$('cabinetLift').setAttribute('aria-pressed','false');trainCabinet.preview?.reset();paintCabinetDetails();$('cabinetTrains').querySelector('[data-train="'+id+'"]')?.scrollIntoView({block:'nearest',inline:'nearest'});prepareCabinetPreview();
}
function prepareCabinetPreview(){
 const token=++trainCabinet.token;$('cabinetPreviewNote').textContent='Preparing the model…';$('cabinetStage').classList.add('preparing');
 // Let the selection and loading state paint before building the chosen model.
 requestAnimationFrame(()=>requestAnimationFrame(()=>{
  if(!trainCabinet.open||token!==trainCabinet.token)return;
  try{
   if(!trainCabinet.preview)trainCabinet.preview=new CabinetPreview($('cabinetPreview'),()=>{
    const preview=trainCabinet.preview,q=preview?.choice,draft=trainCabinet.draft;
    if(!q||q.id!==draft.id||q.livery!==draft.livery)return;
    $('cabinetStage').classList.remove('preparing');if($('cabinetPreviewNote').textContent!=='Drag to rotate · Pinch or scroll to zoom')$('cabinetPreviewNote').textContent='Drag to rotate · Pinch or scroll to zoom';

   });
   trainCabinet.preview.setModel(trainCabinet.draft);
  }catch(error){console.warn('Train preview:',error);$('cabinetStage').classList.remove('preparing');$('cabinetPreviewNote').textContent='The 3D preview is unavailable. You can still choose this train.';}
 }));
}
function openTrainCabinet(opener=$('trainCollectionButton')){
 if(!hobbyHasTrain())return;
 if(!hobby.ready||hobby.transition||building||shopMap.open||trainCabinet.open)return;
 trainCabinet.room=hobby.room;trainCabinet.opener=opener;trainCabinet.draft={...collectionChoice(hobby.room)};trainCabinet.filter='all';trainCabinet.full=false;trainCabinet.lift=false;trainCabinet.moving=false;
 closeQuietControls();$('cabinetStatus').textContent='';trainCabinet.open=true;document.body.classList.add('train-cabinet-open');
 $('cabinetRoom').textContent=HOUSE_ROOMS[hobby.room].name.replace(/^The /,'');$('cabinetLift').setAttribute('aria-pressed','false');$('cabinetMotion').setAttribute('aria-pressed','false');$('cabinetMotion').innerHTML=cabinetIcon('play')+'Watch wheels';
 for(const button of document.querySelectorAll('[data-train-view]'))button.setAttribute('aria-pressed',String(button.dataset.trainView==='engine'));
 paintCabinetCards();paintCabinetDetails();$('trainCabinet').showModal();$('cabinetClose').focus({preventScroll:true});trainCabinet.preview?.reset();prepareCabinetPreview();window.railwayAnalytics?.control('train_collection');
}
function closeTrainCabinet(applied=false){
 if(!trainCabinet.open)return;trainCabinet.open=false;trainCabinet.token++;trainCabinet.moving=false;trainCabinet.preview?.release();$('trainCabinet').close();document.body.classList.remove('train-cabinet-open');shadowDirty=true;
 if(applied){setView('engine',false);$('trainBtn').focus({preventScroll:true});}
 else{openQuietPanel('trainPanel',$('trainBtn'));$('trainCollectionButton').focus({preventScroll:true});}
}
function initTrainCabinet(){
 if(trainCabinet.ready)return;trainCabinet.ready=true;
 const button=document.createElement('button');button.type='button';button.id='trainCollectionButton';button.className='train-collection-link';button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-controls','trainCabinet');button.innerHTML='<span class="collection-link-symbol">'+cabinetSilhouette(TRAIN_COLLECTION[0])+'</span><span><strong>Choose your train</strong><small>Explore the collection · '+TRAIN_COLLECTION.length+' trains</small></span>'+cabinetIcon('arrow');button.onclick=()=>openTrainCabinet(button);$('trainPanel').querySelector('.dock').prepend(button);
 const dialog=document.createElement('dialog');dialog.id='trainCabinet';dialog.className='train-cabinet';dialog.setAttribute('aria-labelledby','cabinetTitle');
 dialog.innerHTML=`<div class="cabinet-shell"><header class="cabinet-header"><div><div class="cabinet-eyebrow">WHISTLEVALE · THE TRAIN COLLECTION</div><h2 id="cabinetTitle">Choose your train</h2></div><button id="cabinetClose" class="cabinet-icon-button" aria-label="Close train collection">${cabinetIcon('close')}</button></header><div class="cabinet-body"><aside class="cabinet-browser"><div class="cabinet-browser-heading"><span>The collection</span><span><span id="cabinetCollectionCount">${TRAIN_COLLECTION.length}</span> trains</span></div><nav class="cabinet-filters" aria-label="Train power"><button data-train-filter="all" aria-pressed="true">All</button><button data-train-filter="steam" aria-pressed="false">Steam</button><button data-train-filter="diesel" aria-pressed="false">Diesel</button><button data-train-filter="electric" aria-pressed="false">Electric</button></nav><div id="cabinetTrains" class="cabinet-trains" role="group" aria-label="Choose a train to inspect"></div><div class="cabinet-browser-foot">A train for every railway.<br>Make this railway your own.</div></aside><div class="cabinet-main"><section class="cabinet-stage" id="cabinetStage" aria-label="Train model"><div class="cabinet-stage-top"><span class="cabinet-edition" id="cabinetNumber">№ 07</span><div class="cabinet-step-through"><button id="cabinetPrevious" class="cabinet-icon-button" aria-label="Previous train">${cabinetIcon('arrow')}</button><span id="cabinetPosition">01 / 08</span><button id="cabinetNext" class="cabinet-icon-button" aria-label="Next train">${cabinetIcon('arrow')}</button></div><div class="cabinet-view-switch" aria-label="Model view"><button data-train-view="engine" aria-pressed="true">Engine</button><button data-train-view="formation" aria-pressed="false">Whole train</button></div></div><div class="cabinet-studio-light"></div><canvas id="cabinetPreview" tabindex="0" role="img" aria-label="3D train model"></canvas><div class="cabinet-preview-toolbar"><span id="cabinetPreviewNote">Preparing the model…</span><div><button id="cabinetLift" aria-pressed="false">${cabinetIcon('roof')}Lift roof</button><button id="cabinetMotion" aria-pressed="false">${cabinetIcon('play')}Watch wheels</button><button id="cabinetReset" class="cabinet-icon-button" aria-label="Reset model view">${cabinetIcon('reset')}</button></div></div></section><section class="cabinet-information"><div class="cabinet-story"><div class="cabinet-eyebrow" id="cabinetTag"></div><div class="cabinet-name-line"><h3 id="cabinetName" aria-live="polite" aria-atomic="true"></h3><span id="cabinetPower" class="cabinet-power"></span></div><p id="cabinetDescription"></p><p id="cabinetCredit" class="cabinet-credit"></p><details class="cabinet-fine-details" open><summary>Model details <span>+</span></summary><ul id="cabinetDetails"></ul></details></div><div class="cabinet-specification"><div class="cabinet-livery-head"><span>Choose a finish</span><span id="cabinetLiveryName"></span></div><div id="cabinetLiveries" class="cabinet-liveries" role="group" aria-label="Choose a livery"></div><div class="cabinet-spec-row"><span>Wheel arrangement</span><strong id="cabinetWheels"></strong></div><div class="cabinet-spec-row"><label for="cabinetCars" id="cabinetCarsLabel">Passenger coaches</label><select id="cabinetCars" aria-label="Number of trailing vehicles">${[1,2,3,4,5,6].map(n=>'<option value="'+n+'">'+n+'</option>').join('')}</select></div></div></section></div></div><footer class="cabinet-footer"><div><span class="cabinet-destination">Your choice for <strong id="cabinetRoom"></strong></span><span id="cabinetCurrent"></span><button id="cabinetRestore" class="cabinet-restore" type="button" hidden>Restore room train</button></div><button id="cabinetRun" class="cabinet-run"></button></footer><p class="cabinet-status" id="cabinetStatus" role="status"></p></div>`;
 document.body.append(dialog);document.body.classList.add('has-train-cabinet');
 $('cabinetClose').onclick=()=>closeTrainCabinet();
 for(const [id,step]of[['cabinetPrevious',-1],['cabinetNext',1]])$(id).onclick=()=>{const list=cabinetFiltered(),index=list.findIndex(q=>q.id===trainCabinet.draft.id);selectCabinetTrain(list[(index+step+list.length)%list.length].id);};dialog.addEventListener('cancel',event=>{event.preventDefault();closeTrainCabinet();});
 let outside=false;dialog.addEventListener('pointerdown',event=>{outside=event.target===dialog;});dialog.addEventListener('click',event=>{if(outside&&event.target===dialog)closeTrainCabinet();outside=false;});
 for(const filter of dialog.querySelectorAll('[data-train-filter]'))filter.onclick=()=>{trainCabinet.filter=filter.dataset.trainFilter;paintCabinetCards();if(!cabinetFiltered().some(q=>q.id===trainCabinet.draft.id))selectCabinetTrain(cabinetFiltered()[0].id);else paintCabinetDetails();};
 for(const view of dialog.querySelectorAll('[data-train-view]'))view.onclick=()=>{trainCabinet.full=view.dataset.trainView==='formation';for(const b of dialog.querySelectorAll('[data-train-view]'))b.setAttribute('aria-pressed',String(b===view));trainCabinet.preview?.reset();trainCabinet.preview?.setFormation();};
 $('cabinetCars').onchange=event=>{trainCabinet.draft={...trainCabinet.draft,cars:Number(event.target.value)};if(trainCabinet.preview){trainCabinet.preview.choice={...trainCabinet.draft};trainCabinet.preview.setFormation();}cabinetUpdateAction();};
 $('cabinetLift').onclick=()=>{trainCabinet.lift=!trainCabinet.lift;$('cabinetLift').setAttribute('aria-pressed',String(trainCabinet.lift));trainCabinet.preview?.request();};
 $('cabinetMotion').onclick=()=>{trainCabinet.moving=!trainCabinet.moving;$('cabinetMotion').setAttribute('aria-pressed',String(trainCabinet.moving));$('cabinetMotion').innerHTML=cabinetIcon(trainCabinet.moving?'pause':'play')+(trainCabinet.moving?'Still model':'Watch wheels');trainCabinet.preview?.request();};
 $('cabinetReset').onclick=()=>trainCabinet.preview?.reset();
 if(['localhost','127.0.0.1','[::1]'].includes(location.hostname)){
  const save=document.createElement('button');save.id='cabinetSavePortrait';save.className='cabinet-save-portrait';save.textContent='Save portrait for contribution';
  save.onclick=()=>{
   const preview=trainCabinet.preview;if(!preview?.stock||preview.g.isContextLost())return;
   if(trainCabinet.draft.livery!==0||trainCabinet.lift||trainCabinet.full||trainCabinet.moving){$('cabinetStatus').textContent='Use the first finish, Engine view, roofs down and a still model for its portrait.';return;}
   preview.stop();preview.render(performance.now(),4);
   const capture=document.createElement('canvas');capture.width=preview.canvas.width;capture.height=preview.canvas.height;const c=capture.getContext('2d');c.drawImage(preview.canvas,0,0);preview.request();
   const pixels=c.getImageData(0,0,capture.width,capture.height).data;let left=capture.width,top=capture.height,right=0,bottom=0;
   for(let y=0;y<capture.height;y++)for(let x=0;x<capture.width;x++)if(pixels[(y*capture.width+x)*4+3]>8){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
   if(right<=left||bottom<=top){$('cabinetStatus').textContent='The model is not ready to photograph yet.';return;}
   const portrait=document.createElement('canvas');portrait.width=640;portrait.height=360;const width=right-left+1,height=bottom-top+1,scale=Math.min(576/width,312/height);
   portrait.getContext('2d').drawImage(capture,left,top,width,height,(640-width*scale)/2,(360-height*scale)/2,width*scale,height*scale);
   const id=trainCabinet.draft.id;portrait.toBlob(blob=>{if(!blob){$('cabinetStatus').textContent='The portrait could not be prepared.';return;}exportBlob(blob,'image/webp',id+'.webp');$('cabinetStatus').textContent='Portrait prepared: '+id+'.webp';},'image/webp',.85);
  };$('cabinetDetails').parentNode.append(save);
 }

 const apply=restore=>{
  if(hobby.room!==trainCabinet.room){$('cabinetStatus').textContent='The room has changed. Reopen the collection to choose its train.';return;}
  try{const saved=restore?restoreRoomTrain(trainCabinet.room):chooseCollectionTrain(trainCabinet.room,trainCabinet.draft),name=collectionTrainLabel(trainCabinet.room).name;closeTrainCabinet(true);updateUI();window.railwayAnalytics?.control('train_select');toast(name+' is on the railway.'+(saved?'':' Saved for this visit.'));}
  catch(error){console.warn('Train selection:',error);$('cabinetStatus').textContent='That train could not be prepared. Your current train is still running.';}
 };
 $('cabinetRun').onclick=()=>apply(false);$('cabinetRestore').onclick=()=>apply(true);
 window.addEventListener('keydown',event=>{
  if(!trainCabinet.open)return;event.stopPropagation();
  if(event.key==='Escape'){event.preventDefault();closeTrainCabinet();return;}
  if(event.key==='Tab'){
   const stops=[...dialog.querySelectorAll('button:not([disabled]),select:not([disabled]),summary,canvas[tabindex="0"]')].filter(node=>node.getClientRects().length),first=stops[0],last=stops.at(-1),active=document.activeElement;
   if(event.shiftKey&&(active===first||!dialog.contains(active))){event.preventDefault();last?.focus();}else if(!event.shiftKey&&(active===last||!dialog.contains(active))){event.preventDefault();first?.focus();}return;
  }
  const card=event.target.closest?.('[data-train]');
  if(card&&['ArrowDown','ArrowUp','ArrowRight','ArrowLeft','Home','End'].includes(event.key)){
   event.preventDefault();const options=cabinetFiltered(),index=options.findIndex(q=>q.id===card.dataset.train),next=event.key==='Home'?0:event.key==='End'?options.length-1:(index+(['ArrowUp','ArrowLeft'].includes(event.key)?-1:1)+options.length)%options.length;selectCabinetTrain(options[next].id);$('cabinetTrains').querySelector('[data-train="'+options[next].id+'"]').focus();
  }else if(event.target===$('cabinetPreview')&&trainCabinet.preview){
   const p=trainCabinet.preview,key=event.key;if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','=','0'].includes(key))return;event.preventDefault();
   if(key==='0')p.reset();else if(key==='ArrowLeft')p.yaw+=.13;else if(key==='ArrowRight')p.yaw-=.13;else if(key==='ArrowUp')p.pitch=clamp(p.pitch+.08,.04,1.1);else if(key==='ArrowDown')p.pitch=clamp(p.pitch-.08,.04,1.1);else p.zoom=clamp(p.zoom*(key==='-'?1.12:.89),.45,1.8);p.request();
  }
 },true);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)trainCabinet.preview?.stop();else if(trainCabinet.open)trainCabinet.preview?.request();});
 window.addEventListener('blur',()=>trainCabinet.preview?.stop());window.addEventListener('focus',()=>{if(trainCabinet.open)trainCabinet.preview?.request();});
}
const cabinetBaseRender=render;
render=function(){if(!trainCabinet.open)cabinetBaseRender();};
