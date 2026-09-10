import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {alignExport} from './grandhall-align.mjs';
import {communityContext,loadContributionDefinitions,loadReviewedHallSources,prepareCommunityGeometry} from './community-lib.mjs';

const read=file=>readFile(new URL('../'+file,import.meta.url),'utf8');
const [html,index,data,exhibits,prompts,core]=await Promise.all(['grandhall.html','index.html','src/grandhall-data.js','src/grandhall-exhibits.js','src/grandhall-contribute.js','src/community-core.js'].map(read));
for(const [,script]of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(script);
const catalog=vm.runInNewContext([core,data,exhibits,prompts].join('\n')+';({limits:GRAND_HALL_LIMITS,rooms:GRAND_HALL_GALLERIES,bays:GRAND_HALL_BAYS,featured:GRAND_HALL_FEATURED_BAY,exhibits:GRAND_HALL_EXHIBITS,prompt:grandHallAgentPrompt,roomPrompt:grandHallRoomPrompt,credits:grandHallExhibitCredits,creditURL:communityCreditURL,view:grandHallExhibitView})');
const roomIds=new Set(),bayIds=new Set(),workIds=new Set(),occupied=new Set();
const displayFormats=new Set(['open-table','low-vitrine','tall-vitrine','wall-case','round-vitrine']);
const finiteVector=(vector,length,label)=>assert.ok(Array.isArray(vector)&&vector.length===length&&vector.every(Number.isFinite),label);
const positive=(n,label)=>assert.ok(Number.isFinite(n)&&n>0,label);
const community=JSON.parse(await read('contributions/world.json'));
const scriptTags=page=>[...page.matchAll(/<script\b([^>]*)>/g)].map(([,attributes])=>Object.fromEntries([...attributes.matchAll(/(?:^|\s)([\w-]+)=(['"])(.*?)\2/g)].map(([,name,,value])=>[name,value])));
function checkSourceDeclarations(exhibit,housePage,hallPage,works){
 assert.ok(exhibit.mapPreview===undefined||typeof exhibit.mapPreview==='boolean',exhibit.id+' optional mapPreview is a boolean');
 const placeholders=scriptTags(hallPage).filter(tag=>tag['data-source']===exhibit.source);
 assert.equal(placeholders.length,1,exhibit.source+' has one deferred declaration in grandhall.html');
 const placeholder=placeholders[0];
 assert.equal(placeholder.type,'application/x-whistlevale-exhibit',exhibit.source+' uses the Hall deferred script type');
 assert.equal(placeholder['data-src'],exhibit.source,exhibit.source+' deferred URL matches its reviewed source');
 assert.equal(placeholder.src,undefined,exhibit.source+' defers execution until its gallery is needed');
 const railwayPlacement=works.some(work=>work.source===exhibit.source&&work.room!=='house'&&(work.miniatures?.length||work.workshop?.length));
 if(exhibit.mapPreview===true||railwayPlacement)assert.ok(scriptTags(housePage).some(tag=>tag.src===exhibit.source&&(!tag.type||['text/javascript','application/javascript'].includes(tag.type))),exhibit.source+' needs an eager index.html script for its map preview or railway placement');
}
for(const room of catalog.rooms){
 assert.ok(/^[a-z][a-z0-9-]*$/.test(room.id)&&!roomIds.has(room.id),'gallery IDs are unique and URL-safe');roomIds.add(room.id);
 for(const key of ['x','z'])assert.ok(Number.isFinite(room[key]),room.id+' '+key);
 for(const key of ['width','depth','height'])positive(room[key],room.id+' '+key);
}
for(const bay of catalog.bays){
 const room=catalog.rooms[bay.room];assert.ok(room,'bay has a known gallery');
 assert.ok(new RegExp('^'+room.code+'-\\d{2}$').test(bay.id)&&!bayIds.has(bay.id),'bay IDs are unique within their gallery');bayIds.add(bay.id);
 for(const key of ['x','y','z','yaw','surfaceY'])assert.ok(Number.isFinite(bay[key]),bay.id+' '+key);
 for(const key of ['width','depth'])positive(bay[key],bay.id+' '+key);
 for(const key of ['usableWidth','usableDepth','maxHeight'])positive(bay[key],bay.id+' '+key);
 assert.ok(displayFormats.has(bay.displayFormat),bay.id+' has a known display format');
 assert.ok(bay.usableWidth<=bay.width&&bay.usableDepth<=bay.depth,bay.id+' usable space lies inside the furniture');
 assert.ok(bay.surfaceY+bay.maxHeight<room.height,bay.id+' model envelope clears the gallery ceiling');
 if(bay.usableRadius!=null){positive(bay.usableRadius,bay.id+' usable radius');assert.ok(bay.usableRadius*2<=Math.min(bay.usableWidth,bay.usableDepth),bay.id+' circular space fits its clear dimensions');}
 if(bay.displayFormat==='round-vitrine')positive(bay.usableRadius,bay.id+' round case has a clear radius');
 const halfX=(Math.abs(Math.cos(bay.yaw))*bay.width+Math.abs(Math.sin(bay.yaw))*bay.depth)/2,halfZ=(Math.abs(Math.sin(bay.yaw))*bay.width+Math.abs(Math.cos(bay.yaw))*bay.depth)/2;
 assert.ok(Math.abs(bay.x-room.x)+halfX<room.width/2&&Math.abs(bay.z-room.z)+halfZ<room.depth/2,bay.id+' display stays inside its gallery');
 for(const key of ['camera','target','marker'])finiteVector(bay[key],3,bay.id+' '+key);
}
// Every authored display keeps a visitor-width route to its front, including
// the new wall windows. This exercises spatial composition instead of merely
// checking that each object fits independently inside the room rectangle.
for(const [ri,room]of catalog.rooms.entries()){
 const bays=catalog.bays.filter(b=>b.room===ri),clearance=.32,step=.45;
 const blocked=(x,z)=>bays.some(b=>{
  const dx=x-b.x+room.x,dz=z-b.z+room.z,ca=Math.cos(b.yaw),sa=Math.sin(b.yaw),lx=ca*dx-sa*dz,lz=sa*dx+ca*dz;
  return b.furniture==='round'?Math.hypot(lx,lz)<b.width/2+clearance:Math.abs(lx)<b.width/2+clearance&&Math.abs(lz)<b.depth/2+clearance;
 });
 const nx=Math.floor((room.width-1)/step),nz=Math.floor((room.depth-1)/step),x0=-room.width/2+.5,z0=-room.depth/2+.5;
 const grid=(x,z)=>[Math.max(0,Math.min(nx-1,Math.round((x-x0)/step))),Math.max(0,Math.min(nz-1,Math.round((z-z0)/step)))];
 const [sx,sz]=grid(room.view.camera[0],room.view.camera[2]),seen=new Set(),queue=[[sx,sz]];
 assert.ok(!blocked(x0+sx*step,z0+sz*step),room.id+' arrival camera has physical clearance');
 for(let k=0;k<queue.length;k++){const [x,z]=queue[k],key=x+z*nx;if(seen.has(key)||x<0||z<0||x>=nx||z>=nz||blocked(x0+x*step,z0+z*step))continue;seen.add(key);queue.push([x-1,z],[x+1,z],[x,z-1],[x,z+1]);}
 for(const bay of bays){const front=bay.depth/2+.85,x=bay.x-room.x+Math.sin(bay.yaw)*front,z=bay.z-room.z+Math.cos(bay.yaw)*front,[gx,gz]=grid(x,z);assert.ok(seen.has(gx+gz*nx),bay.id+' has a connected visitor approach');}
}
const protectedBay=catalog.bays.find(b=>b.id==='GH-08');
assert.deepEqual([protectedBay.x,protectedBay.z,protectedBay.width,protectedBay.depth,protectedBay.y,protectedBay.surfaceY,protectedBay.maxHeight],[-5,10,3.3,3.35,1.24,1.252,1.7],'the published Willowbank display keeps its complete placement envelope');

assert.ok(bayIds.has(catalog.featured),'featured bay exists');
for(const exhibit of catalog.exhibits){
 assert.ok(/^[a-z][a-z0-9-]*$/.test(exhibit.id)&&!workIds.has(exhibit.id),'exhibit IDs are unique and URL-safe');workIds.add(exhibit.id);
 assert.ok(bayIds.has(exhibit.bay)&&!occupied.has(exhibit.bay),'one exhibit per known bay');occupied.add(exhibit.bay);
 positive(exhibit.scale,exhibit.id+' scale');
 for(const key of ['title','story','builder'])assert.ok(typeof exhibit[key]==='string'&&exhibit[key].trim(),exhibit.id+' '+key+' is present');
 assert.ok(catalog.credits(exhibit).length,'every exhibit has normalized public credits');
 if(exhibit.maker!==undefined)assert.ok(typeof exhibit.maker==='string'&&!/[<>\u0000-\u001f]/.test(exhibit.maker),'legacy maker credit is plain text');
 if(exhibit.handle!==undefined)assert.ok(typeof exhibit.handle==='string'&&exhibit.handle.trim()&&!/[<>\u0000-\u001f]/.test(exhibit.handle),'optional handle is plain text');
 if(exhibit.link!==undefined){const link=new URL(exhibit.link);assert.equal(link.protocol,'https:','credit links use HTTPS');assert.equal(link.username+link.password,'','credit links contain no credentials');}
 assert.ok(/^src\/scenery\/[a-z][a-z0-9-]*\.js$/.test(exhibit.source),'native exhibit declares its source');
 await read(exhibit.source);
 checkSourceDeclarations(exhibit,index,html,community.works);
}
// Authored framing follows the bay's rotation/scale; ordinary bays keep theirs.
{
 const bay={x:10,z:20,surfaceY:2,yaw:Math.PI/2,camera:[1,2,3],target:[4,5,6]};
 const same=catalog.view(undefined,bay);assert.equal(same.camera,bay.camera);assert.equal(same.target,bay.target);
 const framed=catalog.view({scale:.5,view:{target:[2,4,0],distance:8,yaw:0,pitch:.4}},bay);
 assert.ok(Math.abs(framed.target[0]-10)<1e-8&&Math.abs(framed.target[1]-4)<1e-8&&Math.abs(framed.target[2]-19)<1e-8,'view target follows native scale and bay rotation');
 assert.ok(Math.abs(Math.hypot(...framed.camera.map((v,i)=>v-framed.target[i]))-4)<1e-8,'view camera distance follows exhibit scale');
 for(const view of [{target:[0,0],distance:2,yaw:0,pitch:.4},{target:[0,0,0],distance:0,yaw:0,pitch:.4},{target:[0,0,0],distance:4,yaw:NaN,pitch:.4},{target:[0,0,0],distance:4,yaw:0,pitch:2}])assert.throws(()=>catalog.view({scale:.5,view},bay));
 for(const exhibit of catalog.exhibits){const ownBay=catalog.bays.find(b=>b.id===exhibit.bay),view=catalog.view(exhibit,ownBay);finiteVector(view.camera,3,exhibit.id+' inspection camera');finiteVector(view.target,3,exhibit.id+' inspection target');}
}
const first=catalog.exhibits.find(e=>e.id==='willowbank-pottery');
assert.ok(first,'the original Willowbank contribution remains');assert.equal(first.bay,catalog.featured);assert.equal(first.maker,'nickfromlater');assert.equal(first.link,'https://x.com/nickfromlater');assert.equal(first.builder,'willowbank');
const plain=value=>JSON.parse(JSON.stringify(value)),originalPottery=community.works.find(work=>work.id===first.id);
assert.deepEqual(plain(catalog.credits(first)),originalPottery.credits,'Willowbank preserves every original Commons credit');
assert.deepEqual(plain(catalog.credits({maker:'Legacy maker',link:'https://x.com/legacy_maker'})),[{name:'Legacy maker',platform:'x',handle:'legacy_maker'}]);
assert.deepEqual(plain(catalog.credits({credits:[{name:'Pseudonym'}]})),[{name:'Pseudonym'}]);
for(const entry of [{credits:[]},{credits:[{name:'<script>'}]},{credits:[{name:'Maker',platform:'x',handle:'@invalid'}]},{maker:'Maker',link:'javascript:alert(1)'}])assert.throws(()=>catalog.credits(entry));

// The same public source must run through the native house renderer. Inspect
// emitted vertices, not declared bounds, so roof overhangs and props count too.
const geometry=await communityContext();
await loadContributionDefinitions(geometry,{format:'whistlevale-community',version:1,works:[]});
prepareCommunityGeometry(geometry);geometry.context.assert=assert;
const measurements=geometry.run(`(()=>{
 const result=[];
 assert.throws(()=>grandHallBuildExhibit('unknown-hall-builder',new Builder()),/Unknown reviewed Hall builder/);
 for(const exhibit of GRAND_HALL_EXHIBITS){
  const bay=GRAND_HALL_BAYS.find(b=>b.id===exhibit.bay),room=GRAND_HALL_GALLERIES[bay.room],b=new Builder();
  grandHallPlaceExhibit(exhibit,b,bay);
  assert.ok(b.data.length>0&&b.data.length%36===0&&b.data.every(Number.isFinite),exhibit.id+' emits finite triangles');
  assert.equal(b.stack.length,0,exhibit.id+' balances its transform stack');
  let minY=Infinity,maxY=-Infinity,radius=0;
  for(let i=0;i<b.data.length;i+=12){
   const dx=b.data[i]-bay.x,dz=b.data[i+2]-bay.z,ca=Math.cos(bay.yaw),sa=Math.sin(bay.yaw);
   const x=ca*dx-sa*dz,y=b.data[i+1]-bay.surfaceY,z=sa*dx+ca*dz;
   assert.ok(Math.abs(x)<bay.usableWidth/2&&Math.abs(z)<bay.usableDepth/2,exhibit.id+' fits its usable display area');
   if(bay.usableRadius!=null)assert.ok(Math.hypot(x,z)<bay.usableRadius,exhibit.id+' fits its circular display');
   minY=Math.min(minY,y);maxY=Math.max(maxY,y);radius=Math.max(radius,Math.hypot(x,z));
  }
  assert.ok(bay.surfaceY+maxY<room.height,exhibit.id+' clears the gallery ceiling');
  assert.ok(maxY<=bay.maxHeight,exhibit.id+' fits the usable height above its display surface');
  assert.ok(Math.abs(minY)<1e-6,exhibit.id+' rests on the actual display surface');
  result.push({id:exhibit.id,bay:bay.id,vertices:b.data.length/12,radius:Math.round(radius*10000)/10000,height:Math.round(maxY*10000)/10000,baseOffset:Math.round(minY*10000)/10000});
 }
 return result;
})()`);

const exhibitVertices=measurements.reduce((sum,model)=>sum+model.vertices,0);
assert.ok(exhibitVertices<=catalog.limits.exhibitVertices,'complete Hall catalogue stays within its aggregate exhibit allowance: '+exhibitVertices+' / '+catalog.limits.exhibitVertices);

// Follow the Hall-only recipe in a fresh VM: one native source and a deferred
// Hall declaration, with no index script or Commons placement. Nothing here
// changes the public collection or creates a file that a build could publish.
const deferredExhibit={id:'qa-deferred-native',bay:catalog.bays.find(b=>!occupied.has(b.id)).id,title:'Unpublished native fixture',credits:[{name:'Example Maker'}],story:'QA only',builder:'qa-deferred-native',scale:1,source:'src/scenery/qa-deferred-native.js'};
const deferredTag='<script type="application/x-whistlevale-exhibit" data-source="'+deferredExhibit.source+'" data-src="'+deferredExhibit.source+'"></script>';
assert.ok(!index.includes(deferredExhibit.source),'new Hall-only fixture has no initial house script');
checkSourceDeclarations(deferredExhibit,index,html+deferredTag,community.works);
checkSourceDeclarations({...deferredExhibit,mapPreview:false},index,html+deferredTag,community.works);
assert.throws(()=>checkSourceDeclarations({...deferredExhibit,mapPreview:'true'},index,html+deferredTag,community.works),/mapPreview is a boolean/);
assert.throws(()=>checkSourceDeclarations({...deferredExhibit,mapPreview:true},index,html+deferredTag,community.works),/eager index.html script/);
assert.throws(()=>checkSourceDeclarations(deferredExhibit,index,html+deferredTag,[{source:deferredExhibit.source,room:'commons',miniatures:[{}]}]),/eager index.html script/);
assert.throws(()=>checkSourceDeclarations(deferredExhibit,index,html,community.works),/one deferred declaration/);
const deferred=await communityContext(),sourceReads=new Map();
await loadContributionDefinitions(deferred,{format:'whistlevale-community',version:1,works:[]},{readSource:async file=>{
 sourceReads.set(file,(sourceReads.get(file)||0)+1);
 if(file===deferredExhibit.source)return "const qaDeferredLoaded=true;function qaDeferredNative(b){b.box(0,.1,0,.2,.2,.2,'#bda167',41);}";
 const source=await read(file);
 if(file==='src/grandhall-exhibits.js')return source+'\nGRAND_HALL_EXHIBITS.push('+JSON.stringify(deferredExhibit)+');\nconst qaOriginalBuilder=grandHallBuildExhibit;grandHallBuildExhibit=(name,b)=>name===\'qa-deferred-native\'?qaDeferredNative(b):qaOriginalBuilder(name,b);';
 return source;
}});
assert.equal(sourceReads.get(deferredExhibit.source),1,'headless geometry review discovers the new source from the reviewed Hall registry');
assert.equal(sourceReads.get(first.source),1,'an eager Commons source is not executed again for Hall review');
prepareCommunityGeometry(deferred);
const deferredModel=deferred.run(`(()=>{const exhibit=GRAND_HALL_EXHIBITS.at(-1),bay=GRAND_HALL_BAYS.find(b=>b.id===exhibit.bay),b=new Builder();grandHallPlaceExhibit(exhibit,b,bay);return{vertices:b.data.length/12,minY:Math.min(...b.data.filter((_,i)=>i%12===1)),surfaceY:bay.surfaceY,credits:grandHallExhibitCredits(exhibit)};})()`);
assert.equal(deferredModel.vertices,36,'Hall-only source constructs its actual native triangles through the shared placement helper');
assert.ok(Math.abs(deferredModel.minY-deferredModel.surfaceY)<1e-6,'deferred source rests on its display surface');
assert.deepEqual(plain(deferredModel.credits),deferredExhibit.credits,'the unpublished work retains its chosen public credit');
deferred.run("GRAND_HALL_EXHIBITS.unshift({source:'../outside.js'});");
await assert.rejects(()=>loadReviewedHallSources(deferred,{readSource:()=>{throw new Error('Unexpected source read');}}),/Invalid reviewed Hall source/);
console.log('Deferred contribution QA passed: Hall-only source absent from index, native geometry and credit, eager-source deduplication, source allowlist and preview/railway loading requirements.');

// A Hall-only work must appear in the house's existing credit UI, without a
// duplicate placement in the Commons. This fixture is never published.
class CreditNode{
 constructor(tag){this.tag=tag;this.children=[];this.textContent='';this.attributes={};}
 append(...nodes){this.children.push(...nodes);}
 replaceChildren(...nodes){this.children=nodes;}
 setAttribute(name,value){this.attributes[name]=value;}
}
const builderList=new CreditNode('ul'),originalGetElement=geometry.context.document.getElementById,originalCreateElement=geometry.context.document.createElement;
geometry.context.document.getElementById=id=>id==='buildersList'?builderList:originalGetElement(id);
geometry.context.document.createElement=tag=>new CreditNode(tag);
const exampleCredits=[{name:'ExampleMaker',platform:'github',handle:'example-maker',note:'New scene.'},{name:'OriginalMaker',note:'Original design.'}];
geometry.context.qaHallCredit={id:'qa-hall-credit',bay:catalog.bays.find(b=>!occupied.has(b.id)).id,title:'A Hall-only test work',credits:exampleCredits,story:'Isolated credit fixture',builder:'willowbank',scale:.2,source:first.source};
const descendants=node=>[node,...node.children.flatMap(descendants)],nodeText=node=>descendants(node).map(n=>n.textContent).join(' ');
try{
 geometry.run('GRAND_HALL_EXHIBITS.push(qaHallCredit);paintBuilders();');
 for(const name of ['ExampleMaker','OriginalMaker'])assert.ok(builderList.children.some(row=>nodeText(row).includes(name)&&nodeText(row).includes('A Hall-only test work')),'main Builders displays '+name+' without a Commons placement');
 const link=descendants(builderList).find(node=>node.tag==='a'&&node.textContent==='ExampleMaker');assert.ok(link);assert.equal(link.href,'https://github.com/example-maker');assert.equal(link.target,'_blank');assert.equal(link.rel,'noopener noreferrer');
 const exported=geometry.run('JSON.stringify(GRAND_HALL_EXHIBITS.find(e=>e.id==="qa-hall-credit"))');
 assert.deepEqual(plain(catalog.credits(JSON.parse(exported))),exampleCredits,'serialized Hall source preserves all chosen and original credits');
}finally{
 geometry.run('GRAND_HALL_EXHIBITS.pop();');geometry.context.document.getElementById=originalGetElement;geometry.context.document.createElement=originalCreateElement;
}
geometry.run("(()=>{const real=grandHallBuildExhibit,target=new Builder(),bay=GRAND_HALL_BAYS[0],exhibit=GRAND_HALL_EXHIBITS[0];target.push(2,3,4);const original=target.m.slice();try{for(const fail of [b=>{},b=>{b.push();b.box(0,0,0,1,1,1,'#aaa');},b=>{b.data=[NaN,...Array(35).fill(0)];}]){grandHallBuildExhibit=(name,b)=>fail(b);assert.throws(()=>grandHallPlaceExhibit(exhibit,target,bay),/finite triangles/);assert.equal(target.stack.length,1);assert.deepEqual(target.m,original);assert.equal(target.data.length,0);}}finally{grandHallBuildExhibit=real;target.pop();}})()");

// Keep the terminal and on-page copy action identical for every current bay.
// Testing the command also catches missing public scripts and stale paths.
const cli=fileURLToPath(new URL('bay.mjs',import.meta.url));
const dimension=n=>String(Number(n.toFixed(2)));
for(const bay of catalog.bays){
 const prompt=catalog.prompt(bay.id),printed=spawnSync(process.execPath,[cli,bay.id],{encoding:'utf8'});
 assert.equal(printed.status,0,printed.stderr);assert.equal(printed.stdout,prompt+'\n',bay.id+' CLI matches the copy action');
 assert.ok(prompt.includes('exhibition bay '+bay.id)&&prompt.includes('x '+dimension(bay.x)+', z '+dimension(bay.z)),'prompt uses the selected bay');
 assert.ok(prompt.includes(dimension(bay.usableWidth)+' metres wide')||prompt.includes(dimension((bay.usableRadius||0)*2)+' metres across'),'prompt describes its usable display area');
 assert.ok(prompt.includes('maximum model height of '+dimension(bay.maxHeight)+' metres above'),'prompt states usable height above the surface');
 assert.ok(prompt.includes(catalog.limits.exhibitVertices.toLocaleString('en-US')+'-vertex allowance; this is not a per-bay budget'),'prompt uses the checked catalogue allowance');
 assert.ok(!/\d+\.\d{3}/.test(prompt),'visible measurements omit floating-point noise');
 assert.ok(prompt.includes('src/grandhall-exhibits.js')&&prompt.includes('Do not merge, deploy'),'prompt reaches a reviewable source contribution');
}
assert.equal(catalog.prompt(' ar-03 '),catalog.prompt('AR-03'),'bay IDs normalize safely');
assert.throws(()=>catalog.prompt('NO-99'),error=>error.name==='RangeError');
for(const args of [[],['NO-99'],['AR-03','--bad'],['AR-03','GH-08']]){
 const bad=spawnSync(process.execPath,[cli,...args],{encoding:'utf8'});assert.equal(bad.status,1);assert.equal(bad.stdout,'');assert.ok(bad.stderr.length);
}
const markdown=spawnSync(process.execPath,[cli,'AR-03','--markdown'],{encoding:'utf8'});
assert.equal(markdown.status,0);assert.equal(markdown.stdout,'```text\n'+catalog.prompt('AR-03')+'\n```\n');
for(const plot of [{id:'east-3',name:'East garden room',side:'right'},{id:'west-4',name:'West light room',side:'left'}]){
 const prompt=catalog.roomPrompt(plot);
 assert.ok(prompt.includes(plot.name)&&prompt.includes("map.plot to '"+plot.id+"'"),'room prompt replaces the selected plot');
 assert.ok(prompt.includes('accepted proposal')&&prompt.includes('chosen credits')&&prompt.includes('src/rooms/<key>.js'),'room prompt includes proposal, credit and actual implementation');
 assert.ok(prompt.includes('railway: false')&&prompt.includes('portable export')&&prompt.includes('Do not merge, deploy'),'room prompt preserves room and review requirements');
}
for(const invalid of [undefined,{}, {id:'../outside',name:'Room',side:'left'}])assert.throws(()=>catalog.roomPrompt(invalid),error=>error.name==='TypeError');
assert.throws(()=>alignExport({schema:'whistlevale.community.v1',entries:[]}),/cannot be converted/);
console.table(measurements);
console.log('Hall exhibit allowance: '+exhibitVertices+' / '+catalog.limits.exhibitVertices+' vertices ('+(catalog.limits.exhibitVertices-exhibitVertices)+' available).');
console.log('Hall QA passed: '+catalog.rooms.length+' galleries, '+catalog.bays.length+' unique bays, '+catalog.exhibits.length+' credited native exhibits, display bounds, shared agent prompts and rejected incompatible conversion.');
