import assert from 'node:assert/strict';
import {communityContext,loadContributionDefinitions,prepareCommunityGeometry,read} from './community-lib.mjs';

const [railway,hobbySource,controls,mapSource,catalogue]=await Promise.all([read('src/railway.js'),read('src/hobby.js'),read('src/controls.js'),read('src/shop-map.js'),read('contributions/world.json').then(JSON.parse)]);
const state=await communityContext(),{context,run}=state;await loadContributionDefinitions(state,catalogue);prepareCommunityGeometry(state);
const declaration=(source,name)=>{const start=source.indexOf('function '+name+'(');assert.ok(start>=0);let depth=0;for(let i=source.indexOf('){',start)+1;i<source.length;i++){if(source[i]==='{')depth++;if(source[i]==='}'&&!--depth)return source.slice(start,i+1);}throw Error('Missing '+name);};
const handlers=new Map(),nodes=new Map(),canvas=run('canvas'),captured=new Set();
const listen=(type,fn)=>{if(!handlers.has(type))handlers.set(type,[]);handlers.get(type).push(fn);};
Object.assign(canvas,{addEventListener:listen,setPointerCapture:id=>captured.add(id),hasPointerCapture:id=>captured.has(id),releasePointerCapture:id=>captured.delete(id)});
context.document.getElementById=id=>{if(id==='world')return canvas;if(!nodes.has(id))nodes.set(id,{hidden:true,style:{},classList:{toggle(){},add(){},remove(){}},querySelectorAll:()=>[],setAttribute(){}});return nodes.get(id);};
context.assert=assert;
run(`const hobby={ready:true,room:'valley',cinema:false,transition:false,spot:-1},shopMap={open:false,active:false};let qaFocuses=0,qaRoutes=0,qaToasts=0;
 setView=mode=>{viewMode=mode;};updateUI=()=>{qaFocuses++;};switchRoute=()=>{qaRoutes++;};toast=()=>{qaToasts++;};
 ${declaration(hobbySource,'focusHouseWorkAt')}\n${declaration(hobbySource,'focusHouseWork')}
 flatTerrain=true;initTracks();leadInfo={p:[0,1,0]};
 const work=communityCatalogue.works.find(w=>w.id==='moonlight-drive-in'),piece=work.workshop[0];
 const theater={...piece,id:'qa-drive-in',x:piece.at[0],z:piece.at[1],scale:piece.scale??1,angle:piece.angle??0,seed:0,contribution:work.id,placement:0,credits:work.credits};objects=[theater];
 function qaAim(){pointers.clear();drag=null;pinchStart=null;dragMoved=false;hobby.room='valley';hobby.ready=true;hobby.cinema=false;hobby.transition=false;shopMap.open=false;shopMap.active=false;building=false;viewMode='overview';
  cameraTarget=[theater.x,objectY(theater)+1.5,theater.z];cameraPos=add(cameraTarget,[0,10,25]);orbit={target:cameraTarget.slice(),distance:70,pitch:.5,yaw:0};cameraProjection=perspective(.88,innerWidth/innerHeight,.1,500);VP=mm(cameraProjection,lookAt(cameraPos,cameraTarget));
 }qaAim();
`);
const start=railway.indexOf(' let contributionTap=null;'),end=railway.indexOf(" document.addEventListener('visibilitychange'",start);assert.ok(start>=0&&end>start);run(railway.slice(start,end));
let time=1000;
function fire(type,extra={}){time+=30;const e={type,target:canvas,button:0,pointerId:1,clientX:context.innerWidth/2,clientY:context.innerHeight/2,timeStamp:time,preventDefault(){},...extra};for(const fn of handlers.get(type)||[])fn(e);return e;}
function tap(extra={}){fire('pointerdown',extra);fire('pointerup',extra);}
const plain=value=>JSON.parse(JSON.stringify(value)),focuses=()=>run('qaFocuses');
assert.equal(run('pickObject(innerWidth/2,innerHeight/2)'),'qa-drive-in','the real ray and native editable bounds hit the theater');
tap();assert.equal(focuses(),1);const authored=plain(run("communityWorkView({key:'valley'},'moonlight-drive-in',0)"));
assert.deepEqual(plain(run('orbit.target')),authored.target);assert.equal(run('orbit.distance'),authored.distance);assert.equal(run('orbit.yaw'),authored.yaw);
fire('dblclick');assert.equal(run('qaToasts'),0,'double tapping the contribution does not jump from its close-up to the train');
for(const type of['pointercancel','lostpointercapture']){run('qaAim()');const before=focuses();fire('pointerdown');fire(type);fire('pointerup');assert.equal(focuses(),before,type+' cannot focus');}
run('qaAim()');const beforeDrag=focuses(),yaw=run('orbit.yaw');fire('pointerdown');fire('pointermove',{clientX:context.innerWidth/2+40});fire('pointerup',{clientX:context.innerWidth/2+40});assert.notEqual(run('orbit.yaw'),yaw);assert.equal(focuses(),beforeDrag,'dragging across the theater still orbits');
run('qaAim()');fire('pointerdown');fire('pointerup',{clientX:context.innerWidth/2+20});assert.equal(focuses(),beforeDrag,'release movement counts even without an intermediate move event');
for(const moved of[false,true]){run('qaAim()');const before=focuses();fire('pointerdown');fire('pointerdown',{pointerId:2,clientX:context.innerWidth/2+50});if(moved)fire('pointermove',{pointerId:2,clientX:context.innerWidth/2+100});fire('pointerup',{pointerId:2});fire('pointerup');assert.equal(focuses(),before,'two-finger gestures never focus, even without movement');}
for(const extra of[{button:1},{button:2},{shiftKey:true},{ctrlKey:true},{metaKey:true},{altKey:true}]){run('qaAim()');const before=focuses();tap(extra);assert.equal(focuses(),before,'pan and nonprimary clicks do not focus');}
for(const mode of["building=true","hobby.cinema=true","hobby.room='coast'","hobby.transition=true","shopMap.open=true","hobby.ready=false","viewMode='follow'"]){run('qaAim();'+mode);const before=focuses();tap();assert.equal(focuses(),before,mode+' leaves its own interaction intact');}
// A different piece in front must win the existing nearest-object picker.
run("qaAim();objects.push({...theater,id:'qa-front-object',z:theater.z+9,contribution:undefined});");assert.equal(run('pickObject(innerWidth/2,innerHeight/2)'),'qa-front-object');const beforeOccluded=focuses();tap();assert.equal(focuses(),beforeOccluded,'do not click through an unrelated foreground object');run('objects=[theater];');
run('qaAim()');const beforeMiss=focuses();tap({clientX:0,clientY:0});assert.equal(focuses(),beforeMiss,'ordinary empty-space taps remain ordinary');time+=700;fire('dblclick',{clientX:0,clientY:0});assert.equal(run('qaToasts'),1,'unrelated double-click retains the train shortcut');
run('theater.x+=3;theater.z-=2;theater.angle+=.2;theater.scale*=.8;innerWidth=390;innerHeight=844;qaAim();');tap({pointerType:'touch'});
const moved=plain(run("communityWorkView({key:'valley'},'moonlight-drive-in',0)"));assert.deepEqual(plain(run('orbit.target')),moved.target);assert.equal(run('orbit.distance'),moved.phoneDistance);assert.equal(run('orbit.yaw'),moved.yaw,'phone taps frame the actual rotated and resized saved object');
run('qaAim();objects=[];');assert.equal(run('focusHouseWorkAt(innerWidth/2,innerHeight/2)'),false,'removed contributions have no fabricated target');

// Exercise the real programme/open-panel/camera integration, including hobby's
// setView wrapper: its cinema exit must not be hidden by a camera fixture.
function node(tag='div'){
 const attrs=new Map(),classes=new Set(),children=[];
 const n={tag,hidden:true,dataset:{},children,style:{},setAttribute:(key,value)=>attrs.set(key,value),getAttribute:key=>attrs.get(key),getClientRects:()=>n.hidden?[]:[{}],focus(){context.document.activeElement=n;},append(...items){children.push(...items);},replaceChildren(...items){children.splice(0,children.length,...items);},classList:{add:value=>classes.add(value),remove:value=>classes.delete(value),toggle(value,force){force??=!classes.has(value);force?classes.add(value):classes.delete(value);},contains:value=>classes.has(value)},querySelectorAll(selector){return children.filter(child=>selector.startsWith('button')?child.tag==='button'&&(!selector.includes(':not')||child.dataset.moonlightOpener===undefined):false);},querySelector(selector){if(selector.includes('h2'))return n.heading??=(node('h2'));if(selector==='[data-panel-back]')return n.back??=node('button');if(selector==='[data-moonlight-programme]')return children.find(child=>child.dataset.moonlightProgramme!==undefined)||null;return null;}};
 return n;
}
nodes.clear();context.document.createElement=node;context.document.body=node('body');context.document.querySelectorAll=()=>[];
context.document.getElementById=id=>{if(id==='world')return canvas;if(!nodes.has(id)){const n=node();n.id=id;nodes.set(id,n);}return nodes.get(id);};
context.performance={now:()=>10000};context.qaProgramme=node('section');context.qaProgramme.dataset.moonlightProgramme='true';
run(controls);
const wrapperStart=hobbySource.indexOf('setView=function('),wrapperEnd=hobbySource.indexOf('\n};',wrapperStart);assert.ok(wrapperStart>=0&&wrapperEnd>wrapperStart);
run(`let qaCinemaExits=0,qaProgrammeMounts=0,qaProjectionState=null,qaBoothAction=null;
 const baseHobbySetView=mode=>{viewMode=mode;};leaveCinema=()=>{qaCinemaExits++;hobby.cinema=false;};
 ${declaration(mapSource,'isShopMapActive')}
 ${hobbySource.slice(wrapperStart,wrapperEnd+3)}
 ${['renderRoomPlaces','renderMoonlightProgramme','focusMoonlightBooth'].map(name=>declaration(hobbySource,name)).join('\n')}
 houseMoonlight={update:next=>{qaProjectionState=next;},createProgramme:options=>{qaProgrammeMounts++;qaBoothAction=options.onBoothView;return qaProgramme;}};
 quietControls.panels.push($('viewsPanel'),$('moonlightPanel'));objects=[theater];qaAim();
 openQuietPanel('viewsPanel',$('viewsBtn'));
`);
const programmeOpener=nodes.get('roomPlaces').children.find(button=>button.dataset.moonlightOpener!==undefined);assert.ok(programmeOpener,'the actual Places renderer creates a programme button');
run('hobby.cinema=true;');programmeOpener.onclick();assert.equal(run('hobby.cinema'),false);assert.equal(run('qaCinemaExits'),1,'programme entry exits cinema through the actual setView wrapper');assert.equal(run('quietControls.panel.id'),'moonlightPanel');assert.equal(run('qaProgrammeMounts'),1);
run('updateMoonlightHouse();');assert.equal(run('quietControls.panel.id'),'moonlightPanel','context gating keeps the just-opened programme visible');assert.equal(nodes.get('moonlightOpen').hidden,false);assert.equal(run('qaProjectionState.nameplateVisible'),true);
run("closeQuietControls();openQuietPanel('moonlightPanel',$('moonlightOpen'));openQuietPanel('moonlightPanel',$('moonlightOpen'));");assert.equal(run('qaProgrammeMounts'),1,'reopening retains one programme and one set of listeners');assert.equal(run('quietControls.panel'),null,'the opener also closes its panel');
run("openQuietPanel('moonlightPanel',$('moonlightOpen'));qaBoothAction();");assert.equal(run('quietControls.panel'),null,'the booth camera closes controls to reveal the sign');assert.equal(context.document.activeElement,nodes.get('moonlightOpen'),'booth inspection restores keyboard focus outside the hidden panel');assert.deepEqual(plain(run('orbit.target')),plain(run('transform([-.6*.32,2.15*.32,12.20*.32],objectMatrix(theater))')),'booth focus follows the rotated, scaled and moved native building');
for(const mode of["building=true","hobby.cinema=true","hobby.room='coast'","shopMap.open=shopMap.active=true","viewMode='follow'","orbit.target=[100,0,100]"]){
 run("qaAim();focusHouseWork('moonlight-drive-in',0);openQuietPanel('moonlightPanel',$('moonlightOpen'));"+mode+";updateMoonlightHouse();");
 assert.equal(nodes.get('moonlightOpen').hidden,true,mode+' hides the contextual opener');assert.equal(run('quietControls.panel'),null,mode+' closes the programme');
}
run('objects=[];qaAim();updateMoonlightHouse();');assert.equal(nodes.get('moonlightOpen').hidden,true);assert.equal(run('qaProjectionState.nameplateVisible'),false,'removed models release their visibility request');
console.log('Moonlight click QA passed: actual picking and edited desktop/phone framing, gesture and mode exclusions, occlusion, double-click preservation, programme lifecycle, cinema exit and booth focus.');
