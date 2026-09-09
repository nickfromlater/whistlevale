import assert from 'node:assert/strict';
import {communityContext,loadCommunity,read} from './community-lib.mjs';

const {context,run}=await communityContext(),plain=value=>JSON.parse(JSON.stringify(value));
const catalogue=await loadCommunity();context.catalogue=catalogue;
context.credit={name:'River Maker',platform:'github',handle:'river-maker',note:'Built the station.'};
assert.deepEqual(plain(run('validateCredits([credit])')),[context.credit]);
assert.equal(run('communityCreditURL(credit)'),'https://github.com/river-maker');
assert.equal(run('communityCreditURL({name:"A private builder"})'),null);
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
const hobby=await read('src/hobby.js');assert.match(hobby,/embeddedLayout.*JSON.stringify\(snapshot\(\)\).*replace/,'portable export embeds the credited snapshot with script-safe escaping');
assert.match(hobby,/buildersList.*replaceChildren/,'portable export clears runtime credit markup before rebuilding');
console.log('Contribution QA passed: bounded metadata, safe profile URLs, rejected malformed data/overlaps, legacy compatibility and credit round trips.');
