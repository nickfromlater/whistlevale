import assert from 'node:assert/strict';
import {communityContext,loadCommunity,loadContributionDefinitions,read} from './community-lib.mjs';

const {context,run}=await communityContext(),plain=value=>JSON.parse(JSON.stringify(value));
const catalogue=await loadCommunity();context.catalogue=catalogue;
context.credit={name:'River Maker',platform:'github',handle:'river-maker',note:'Built the station.'};
assert.deepEqual(plain(run('validateCredits([credit])')),[context.credit]);
assert.equal(run('communityCreditURL(credit)'),'https://github.com/river-maker');
assert.equal(run('communityCreditURL({name:"A private builder"})'),null);
assert.equal(run('communityCreditURL({name:"nickfromlater",platform:"x",handle:"nickfromlater"})'),'https://x.com/nickfromlater');
for(const change of[{name:'<img src=x>'},{platform:'javascript'},{handle:'../redirect'},{handle:'x?tab=1'},{handle:'@person'},{note:'x'.repeat(161)},{name:'hello\nworld'},{url:'https://example.com'}]){
 context.bad={...context.credit,...change};assert.throws(()=>run('validateCredits([bad])'));
}
context.creditList=Array.from({length:13},(_,i)=>({name:'Builder '+i}));assert.throws(()=>run('validateCredits(creditList)'));
context.layout=run('({format:"alder-valley-workshop",version:1,name:"River station",tracks:divisionDesign(),livery:"green",coaches:3,credits:[credit],objects:[{type:"cottage",x:-8,z:8,angle:0,scale:1,credits:[credit]}]})');
const clean=plain(run('validateProject(layout)'));assert.deepEqual(clean.credits,[context.credit]);assert.deepEqual(clean.objects[0].credits,[context.credit]);
context.clean=clean;
run('layoutCredits=validateCredits(clean.credits);layoutTitle=clean.name;objects=clone(clean.objects);trackDesign=clone(clean.tracks);setCoachOffsets=function(){};');
const snapshot=plain(run('workshopSnapshot()'));assert.deepEqual(snapshot.credits,clean.credits);assert.deepEqual(snapshot.objects[0].credits,clean.objects[0].credits);
assert.deepEqual(plain(run('validateProject(JSON.parse(JSON.stringify(workshopSnapshot())))')).credits,clean.credits,'JSON round trip retains credit');
run('rebuildScenery=updateTrainModels=refreshInspector=saveProjectSoon=renderCatalog=function(){};pushUndo();objects[0].credits=[{name:"An additional builder"}];undoBuild();');
assert.deepEqual(plain(run('objects[0].credits')),clean.objects[0].credits,'undo restores the prior object credit');
run('redoBuild()');assert.equal(run('objects[0].credits[0].name'),'An additional builder','redo retains new attribution');
run('armAsset(objects[0].type,objects[0]);draft.credits[0].note="A copied piece"');
assert.equal(run('objects[0].credits[0].note'),undefined,'duplicate credits do not mutate the original');
assert.equal(run('draft.credits[0].name'),'An additional builder','duplication retains the author');
run('workshopApplySnapshot({...clean,credits:undefined,objects:[]},true)');assert.deepEqual(plain(run('layoutCredits')),[],'old layouts clear prior layout credit');
for(const mutation of[c=>c.works.push(c.works[0]),c=>c.works[0].credits[0].name='<script>',c=>c.works[1].miniatures[0].scale=10,c=>c.works[1].miniatures[0].builder='eval',c=>c.works[1].miniatures.push({...c.works[1].miniatures[0]}),c=>c.works[0].source='../.env']){
 context.bad=structuredClone(catalogue);mutation(context.bad);
 assert.throws(()=>run('validateCommunity(bad)'));
}
context.withView=structuredClone(catalogue);
context.withView.works.find(w=>w.miniatures).view={distance:19,yaw:.45,pitch:.48};
assert.deepEqual(plain(run('validateCommunity(withView).works.find(w=>w.view).view')),{distance:19,yaw:.45,pitch:.48});
for(const view of[{distance:Infinity},{distance:9},{yaw:7},{pitch:.1},{target:[0,0,0]},null]){
 context.bad=structuredClone(context.withView);context.bad.works.find(w=>w.miniatures).view=view;
 assert.throws(()=>run('validateCommunity(bad)'),'reject invalid viewpoint metadata');
}
context.bad=structuredClone(catalogue);context.bad.works[0].view={distance:19};
assert.throws(()=>run('validateCommunity(bad)'),'a workshop-only work cannot create an annex viewpoint');
const hobby=await read('src/hobby.js');assert.match(hobby,/embeddedLayout.*JSON.stringify\(snapshot\(\)\).*replace/,'portable export embeds the credited snapshot with script-safe escaping');
assert.match(hobby,/buildersList.*replaceChildren/,'portable export clears runtime credit markup before rebuilding');

// Exercise the real Builders rendering with reviewed records and isolated
// same-title works. Credits count artwork, while locations count its displays.
const builders=await communityContext();await loadContributionDefinitions(builders,catalogue);
class CreditNode{
 constructor(tag){this.tag=tag;this.children=[];this.textContent='';this.attributes={};}
 append(...nodes){this.children.push(...nodes);}
 replaceChildren(...nodes){this.children=nodes;}
 setAttribute(name,value){this.attributes[name]=value;}
}
const builderList=new CreditNode('ul');
builders.context.document.getElementById=id=>{assert.equal(id,'buildersList');return builderList;};
builders.context.document.createElement=tag=>new CreditNode(tag);
const authorFor=name=>builderList.children.find(row=>row.children[0]?.children[0]?.textContent===name);
const worksFor=author=>author.children[1].children[1].children;
const notesFor=work=>work.children.filter(node=>node.tag==='p').map(node=>node.textContent);
builders.run('paintBuilders()');
const potteryAuthor=authorFor('nickfromlater'),potteryWorks=worksFor(potteryAuthor);
assert.equal(potteryAuthor.children[1].children[0].textContent,'1 contribution','Willowbank counts once across the two catalogues');
assert.equal(potteryWorks.length,1);assert.equal(potteryWorks[0].children[0].textContent,'Willowbank Pottery');
assert.equal(potteryWorks[0].children[1].textContent,'The Commons · The Grand Hall','one work lists both display locations');
assert.deepEqual(notesFor(potteryWorks[0]),catalogue.works.find(work=>work.id==='willowbank-pottery').credits.filter(credit=>credit.name==='nickfromlater').map(credit=>credit.note),'the original creator note is preserved without duplication');
const maker=note=>({name:'QA maker',platform:'github',handle:'qa-maker',note}),helper={name:'QA helper',note:'Shared foliage.'};
builders.context.qaWorks=[
 {id:'qa-shared',title:'Same title',source:'src/scenery/qa-shared.js',room:'commons',credits:[maker('Original design.'),helper]},
 {id:'qa-distinct',title:'Same title',source:'src/scenery/qa-shared.js',room:'commons',credits:[maker('Separate sculpture.')]},
 {id:'qa-reused-id',title:'Same title',source:'src/scenery/qa-original.js',room:'commons',credits:[maker('Original sculpture.')]}
];
builders.context.qaExhibits=[
 {...builders.context.qaWorks[0],credits:[maker('Exhibition mounting.'),helper]},
 {id:'qa-reused-id',title:'Same title',source:'src/scenery/qa-adaptation.js',credits:[maker('A separate adaptation.')]}
];
builders.run('communityCatalogue.works=qaWorks;GRAND_HALL_EXHIBITS.splice(0,GRAND_HALL_EXHIBITS.length,...qaExhibits);paintBuilders();');
const author=authorFor('QA maker'),works=worksFor(author),creator=author.children[0].children[0];
assert.equal(author.children[1].children[0].textContent,'4 contributions','different IDs or sources remain distinct despite identical titles');
assert.equal(works.length,4);assert.equal(works[0].children[1].textContent,'The Commons · The Grand Hall');
assert.deepEqual(notesFor(works[0]),['Original design.','Exhibition mounting.'],'each distinct creator note survives grouping');
assert.deepEqual(works.slice(1).map(notesFor),[['Separate sculpture.'],['Original sculpture.'],['A separate adaptation.']]);
const helperWorks=worksFor(authorFor('QA helper'));assert.equal(helperWorks.length,1);
assert.deepEqual(notesFor(helperWorks[0]),['Shared foliage.'],'notes remain with the credited person and repeated notes appear once');
assert.equal(helperWorks[0].children[1].textContent,'The Commons · The Grand Hall');
assert.equal(creator.href,'https://github.com/qa-maker');assert.equal(creator.target,'_blank');assert.equal(creator.rel,'noopener noreferrer');
builders.run('paintBuilders()');assert.equal(worksFor(authorFor('QA maker')).length,4,'reopening Builders does not duplicate contributions');

// Hall links use reviewed identities and resolve the same placed model in the
// house. Both regular links and portable file/blob returns reach its camera.
const navigation=await communityContext();await loadContributionDefinitions(navigation,structuredClone(catalogue));
const nav=navigation.run,navContext=navigation.context;
Object.assign(navContext,{URL,URLSearchParams,location:new URL('https://fixture.test/grandhall.html'),navCalls:[],mapCalls:[],notices:[]});
const destination=plain(nav('grandHallRailwayLocations(GRAND_HALL_EXHIBITS[0])'));
assert.deepEqual(destination,[{room:'commons',name:'The Commons',work:'willowbank-pottery',placement:0,href:'https://fixture.test/index.html?room=commons&work=willowbank-pottery&placement=0'}]);
assert.deepEqual(plain(nav('grandHallRailwayLocations({id:"missing",source:"src/scenery/willowbank.js"})')),[]);
assert.deepEqual(plain(nav('grandHallRailwayLocations({id:"../invalid",source:"src/scenery/willowbank.js"})')),[]);
assert.deepEqual(plain(nav('grandHallRailwayLocations({...GRAND_HALL_EXHIBITS[0],source:"src/scenery/different.js"})')),[],'a same-name work with another source does not acquire this placement');
nav('HOUSE_COMMUNITY.works.push(HOUSE_COMMUNITY.works.find(work=>work.id==="willowbank-pottery"))');
assert.deepEqual(plain(nav('grandHallRailwayLocations(GRAND_HALL_EXHIBITS[0])')),[],'ambiguous catalogue IDs produce no link');nav('HOUSE_COMMUNITY.works.pop()');
const originalCatalogue=navContext.HOUSE_COMMUNITY;navContext.HOUSE_COMMUNITY=null;
assert.deepEqual(plain(nav('grandHallRailwayLocations(GRAND_HALL_EXHIBITS[0])')),[],'missing public data leaves the Hall usable');navContext.HOUSE_COMMUNITY=originalCatalogue;

navContext.document.getElementById=()=>({querySelectorAll:()=>[]});
navContext.hobby={room:'valley',scene:null,spot:-1};
navContext.qaScene={key:'commons',lifeDetails:{details:[{contribution:'willowbank-pottery',placement:0,x:-27,y:1.5,z:8}]},spots:[],trains:[{distance:8,speed:.3}]};
nav(`communityRoomPlaces(qaScene);setView=function(mode){viewMode=mode;};updateUI=function(){};
function visitHouseRoom(key,after){navCalls.push(key);hobby.room=key;hobby.scene=key==='commons'?qaScene:null;after?.();}
function openHouseMap(){mapCalls.push(true);return Promise.resolve();}function shopMapSelect(){}function toast(message){notices.push(message);}`);
nav(hobby.slice(hobby.indexOf('function focusHouseWork('),hobby.indexOf('\nsetTimeout(startHouse,50)')));
const portableAddresses=['file:///tmp/whistlevale.html?map=grandhall','blob:https://fixture.test/portable-house#map=grandhall'];
const addresses=[destination[0].href];
for(const address of portableAddresses){
 navContext.HOUSE_RETURN_URL=address;const link=new URL(nav('grandHallRailwayLocations(GRAND_HALL_EXHIBITS[0])[0].href'));
 assert.equal(link.pathname,new URL(address).pathname,'portable work links retain the exported house identity');
 const params=link.protocol==='blob:'?new URLSearchParams(link.hash.slice(1)):link.searchParams;
 assert.equal(params.get('work'),'willowbank-pottery');assert.equal(params.get('placement'),'0');assert.equal(params.has('map'),false,'a contribution link enters its room instead of reopening the map');addresses.push(link.href);
}
const beforeMotion=nav('JSON.stringify({paused,throttle,trains:qaScene.trains})');
for(const address of addresses){
 navContext.location=new URL(address);nav('hobby.room="valley";hobby.scene=null;restoreHouseLocation()');
 assert.equal(nav('hobby.room'),'commons');assert.equal(nav('viewMode'),'overview');assert.equal(nav('hobby.spot'),0);
 assert.deepEqual(plain(nav('cameraTarget')),plain(nav('qaScene.spots[0].target')),'camera centers the live placement surface and matches its existing Places view');
 assert.equal(nav('orbit.distance'),19,'Willowbank uses its authored close view');
 assert.equal(nav('JSON.stringify({paused,throttle,trains:qaScene.trains})'),beforeMotion,'work navigation preserves train state');
}
assert.equal(navContext.mapCalls.length,0);assert.equal(navContext.notices.length,0);
navContext.innerWidth=390;nav('restoreHouseLocation()');assert.ok(Math.abs(nav('orbit.distance')-32.3)<1e-8,'phone entry keeps the established wider framing');navContext.innerWidth=1440;
for(const suffix of ['work=missing','work=../bad','work=willowbank-pottery&work=willowbank-pottery','work=willowbank-pottery&placement=-1','work=willowbank-pottery&placement=1','work=willowbank-pottery&placement=0&placement=1']){
 navContext.location=new URL('https://fixture.test/index.html?room=commons&'+suffix);const before=nav('JSON.stringify(orbit)'),notices=navContext.notices.length;
 nav('restoreHouseLocation()');assert.equal(nav('JSON.stringify(orbit)'),before,'invalid or ambiguous work links never focus another object');assert.equal(navContext.notices.length,notices+1);
}
nav('communityCatalogue.works.push(communityCatalogue.works.find(work=>work.id==="willowbank-pottery"))');
assert.equal(nav('focusHouseWork("willowbank-pottery",0)'),false,'duplicate source IDs cannot select an arbitrary placement');nav('communityCatalogue.works.pop()');
nav('qaScene.lifeDetails.details.push(qaScene.lifeDetails.details[0])');
assert.equal(nav('focusHouseWork("willowbank-pottery",0)'),false,'duplicate built placement IDs cannot select an arbitrary model');nav('qaScene.lifeDetails.details.length=0');
assert.equal(nav('focusHouseWork("willowbank-pottery",0)'),false,'an omitted model has no fabricated camera target');
console.log('Contribution QA passed: bounded metadata, safe profiles, credit round trips, grouped artwork locations and public/file/blob links to actual railway placements.');
