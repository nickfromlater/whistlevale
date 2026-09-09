'use strict';

// The server/build embeds the reviewed JSON before this file. Portable HTML
// retains that same catalogue. No runtime requests or frame-loop hooks.
const communityCatalogue=validateCommunity(window.HOUSE_COMMUNITY||{format:'whistlevale-community',version:1,works:[]});
function communityWorkshop(add){
 for(const work of communityCatalogue.works)for(const p of work.workshop||[]){
  const object=add(p.type,...p.at,p.angle??0,p.scale??1,p.params??null);
  object.credits=validateCredits(work.credits);
 }
}
function communityMiniatures(key,place){
 const builders={willowbank:willowbankPottery,harbor:littleHarborScene,porter:littlePorterScene,mapParty:littleMapParty,reading:littleReadingScene,atelier:littleAtelierScene,
  person:(b,x,y,z,a,p)=>{littlePerson(b,x,y,z,{pose:p.pose||'stand',angle:a,variant:p.variant??0,color:p.color||'#83958b'});return 1;},
  bird:littleBird,dog:littleDog,bicycle:littleBicycle,chair:littleChair,case:littleCase,pack:littlePack,book:littleBook,rope:littleRope,trolley:littleTrolley,
  cottage:(b,x,y,z,a)=>cottage(b,x,y,z,3.5,3,3,'#d6c4a0','#6a7e6b',a),tree:(b,x,y,z)=>roomTree(b,x,y,z,4),lamp:(b,x,y,z)=>houseLamp(b,x,y,z),bench};
 for(const work of communityCatalogue.works.filter(w=>w.room===key))for(const [index,p]of (work.miniatures||[]).entries()){
  const original=builders[p.builder],scale=p.scale??1;
  const fn=scale===1&&['harbor','porter','mapParty','reading','atelier'].includes(p.builder)?original:(b,x,y,z,angle)=>{
   b.push(x,y,z,0,angle,0,scale);let count=0;
   try{
    if(p.builder==='case')littleCase(b,0,0,0,1,p.color);else if(p.builder==='pack')littlePack(b,0,0,0,p.color);
    else if(p.builder==='book')littleBook(b,0,0,0,true,p.color);else if(p.builder==='rope')littleRope(b,0,0,0);
    else if(p.builder==='chair')littleChair(b,0,0,0,0,p.color);
    else count=(p.builder==='person'?original(b,0,0,0,0,p):original(b,0,0,0,0))||0;
   }finally{b.pop();}return p.builder==='person'?1:['harbor','porter','mapParty','reading','atelier'].includes(p.builder)?count:0;
  };
  if(scale!==1&&['reading','atelier'].includes(p.builder))fn.communityTerrace=true;
  place(work.title,fn,...p.at,p.angle??0,COMMUNITY_BUILDERS[p.builder]*scale,p.y??null,work.credits,work.id,index);
 }
}
function communityRoomPlaces(scene){
 for(const work of communityCatalogue.works.filter(w=>w.room===scene.key&&w.view)){
  const placed=scene.lifeDetails.details.find(d=>d.contribution===work.id&&d.placement===0);if(!placed)continue;
  const p=work.miniatures[0],r=COMMUNITY_BUILDERS[p.builder]*(p.scale??1);
  scene.spots.push({name:work.title,target:[placed.x,placed.y+Math.min(2,r*.35),placed.z],distance:Math.max(12,r*4),pitch:.55,yaw:.45,...work.view,detail:'Made by '+communityCreditLine(work.credits)+'.'});
 }
}
function communityCreditLine(credits){return validateCredits(credits).map(c=>c.name).join(', ');}
function paintBuilders(){
 const list=$('buildersList');list.replaceChildren();
 const entries=communityCatalogue.works.map(w=>({title:w.title,room:w.room,credits:w.credits}));
 for(const q of TRAIN_COLLECTION)if(q.credits?.length)entries.push({title:q.name,room:'house',credits:q.credits});
 for(const [key,room]of Object.entries(HOUSE_ROOMS))if(room.credits?.length)entries.push({title:room.name,room:key,credits:room.credits});
 if(layoutCredits.length)entries.push({title:layoutTitle,room:'valley',credits:layoutCredits});
 const creditedObjects=new Map();for(const o of objects)if(o.credits?.length){const title=assetById[o.type]?.name||'Scenery',key=title+JSON.stringify(o.credits);if(!creditedObjects.has(key))creditedObjects.set(key,{title,room:'valley',credits:o.credits});}
 entries.push(...creditedObjects.values());
 const authors=new Map();
 for(const entry of entries)for(const credit of validateCredits(entry.credits)){
  const key=JSON.stringify([credit.name,credit.platform,credit.handle]);
  if(!authors.has(key))authors.set(key,{credit,works:new Map()});
  const author=authors.get(key),workKey=entry.title+entry.room;
  if(!author.works.has(workKey))author.works.set(workKey,{...entry,note:credit.note});
 }
 for(const {credit,works}of authors.values()){
  const item=document.createElement('li'),heading=document.createElement('h3'),url=communityCreditURL(credit),name=document.createElement(url?'a':'span');name.textContent=credit.name;
  if(url){
   const platform={github:'GitHub',x:'X',bluesky:'Bluesky'}[credit.platform];
   name.href=url;name.target='_blank';name.rel='noopener noreferrer';name.className='builders-author-link';name.setAttribute('aria-label',credit.name+' on '+platform+' (opens in a new tab)');
   const tag=document.createElement('small');tag.textContent=platform+' ↗';name.append(tag);
  }heading.append(name);item.append(heading);
  const details=document.createElement('details'),summary=document.createElement('summary'),workList=document.createElement('ul');summary.textContent=works.size===1?'1 contribution':works.size+' contributions';details.open=works.size<=3;details.append(summary);workList.className='builders-works';
  for(const work of works.values()){
   const row=document.createElement('li'),title=document.createElement('strong'),room=document.createElement('span');title.textContent=work.title;room.textContent=HOUSE_ROOMS[work.room]?.name||'Across the house';row.append(title,room);
   if(work.note){const note=document.createElement('p');note.textContent=work.note;row.append(note);}workList.append(row);
  }
  details.append(workList);item.append(details);list.append(item);
 }
 if(!list.children.length){const empty=document.createElement('li');empty.textContent='Made with care by the Whistlevale contributors.';list.append(empty);}
}
