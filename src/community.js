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
 const builders={willowbank:willowbankPottery,wintergarden:wintergardenStation,meridian:meridianObservatory,harbor:littleHarborScene,porter:littlePorterScene,mapParty:littleMapParty,reading:littleReadingScene,atelier:littleAtelierScene,
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
  const view=communityWorkView(scene,work.id,0);if(!view)continue;
  scene.spots.push({...view,detail:'Made by '+communityCreditLine(work.credits)+'.'});
 }
}
function communityWorkView(scene,id,placement=0){
 if(!scene||typeof id!=='string'||!/^[a-z][a-z0-9-]*$/.test(id)||!Number.isSafeInteger(placement)||placement<0)return null;
 const works=communityCatalogue.works.filter(work=>work.id===id);if(works.length!==1)return null;
 const work=works[0],piece=work.miniatures?.[placement];if(work.room!==scene.key||!piece)return null;
 const matches=(scene.lifeDetails?.details||[]).filter(detail=>detail.contribution===id&&detail.placement===placement);if(matches.length!==1)return null;
 const placed=matches[0],radius=COMMUNITY_BUILDERS[piece.builder]*(piece.scale??1);
 if(![placed.x,placed.y,placed.z,radius].every(Number.isFinite)||radius<=0)return null;
 return{name:work.title,contribution:id,placement,target:[placed.x,placed.y+Math.min(2,radius*.35),placed.z],distance:Math.max(12,radius*4),pitch:.55,yaw:.45,...(placement===0?work.view:{})};
}
function communityCreditLine(credits){return validateCredits(credits).map(c=>c.name).join(', ');}
function paintBuilders(){
 const list=$('buildersList');list.replaceChildren();
 const entries=communityCatalogue.works.map(w=>({key:JSON.stringify(['work',w.id,w.source]),title:w.title,room:w.room,credits:w.credits}));
 if(typeof GRAND_HALL_EXHIBITS!=='undefined'&&typeof grandHallExhibitCredits==='function')for(const exhibit of GRAND_HALL_EXHIBITS)entries.push({key:JSON.stringify(['work',exhibit.id,exhibit.source]),title:exhibit.title,room:'grandhall',credits:grandHallExhibitCredits(exhibit)});
 for(const q of TRAIN_COLLECTION)if(q.credits?.length)entries.push({key:JSON.stringify(['train',q.id]),title:q.name,room:'house',credits:q.credits});
 for(const [key,room]of Object.entries(HOUSE_ROOMS))if(room.credits?.length)entries.push({key:JSON.stringify(['room',key]),title:room.name,room:key,credits:room.credits});
 if(layoutCredits.length)entries.push({key:'layout',title:layoutTitle,room:'valley',credits:layoutCredits});
 const creditedObjects=new Map();for(const o of objects)if(o.credits?.length){const title=assetById[o.type]?.name||'Scenery',key=JSON.stringify(['object',o.type,o.credits]);if(!creditedObjects.has(key))creditedObjects.set(key,{key,title,room:'valley',credits:o.credits});}
 entries.push(...creditedObjects.values());
 const authors=new Map();
 for(const entry of entries)for(const credit of validateCredits(entry.credits)){
  const key=JSON.stringify([credit.name,credit.platform,credit.handle]);
  if(!authors.has(key))authors.set(key,{credit,works:new Map()});
  const author=authors.get(key);
  // One reviewed work can be displayed in several rooms; titles are not IDs.
  if(!author.works.has(entry.key))author.works.set(entry.key,{title:entry.title,rooms:new Set(),notes:new Set()});
  const work=author.works.get(entry.key);work.rooms.add(entry.room);if(credit.note)work.notes.add(credit.note);
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
   const row=document.createElement('li'),title=document.createElement('strong'),room=document.createElement('span');title.textContent=work.title;room.textContent=[...work.rooms].map(key=>HOUSE_ROOMS[key]?.name||'Across the house').join(' · ');row.append(title,room);
   for(const text of work.notes){const note=document.createElement('p');note.textContent=text;row.append(note);}workList.append(row);
  }
  details.append(workList);item.append(details);list.append(item);
 }
 if(!list.children.length){const empty=document.createElement('li');empty.textContent='Made with care by the Whistlevale contributors.';list.append(empty);}
}
