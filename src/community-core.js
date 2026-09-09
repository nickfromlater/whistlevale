'use strict';

// Shared by the browser and the Node contribution checker. No DOM, network,
// storage or executable contribution data. Keep errors useful to PR authors.
// works is an initial curation cap, not a measured renderer limit. Revisit it
// as the catalogue grows; geometry and clearance checks still apply separately.
const COMMUNITY_LIMITS=Object.freeze({works:128,perRoom:64,credits:12,vertices:300000});
const COMMUNITY_KINDS=['building','people','vignette','prop','planting','furniture','structure','district','room','train','livery','art','audio','code'];
const COMMUNITY_BUILDERS=Object.freeze({harbor:1.2,porter:1,mapParty:.95,reading:1.15,atelier:1,person:.4,bird:.16,dog:.45,bicycle:.8,chair:.45,case:.3,pack:.3,book:.22,rope:.3,trolley:.65,cottage:2.7,tree:1.8,lamp:.3,bench:.65,willowbank:5.3,wintergarden:11.4});
function communityAssert(ok,message){if(!ok)throw new Error(message);}
function communityText(value,max,label){communityAssert(typeof value==='string'&&value.trim().length>0&&value.length<=max&&!/[\u0000-\u001f\u007f<>]/.test(value),label+' must be plain text, 1–'+max+' characters.');return value.trim();}
function communityFields(value,allowed,label){communityAssert(value&&typeof value==='object'&&!Array.isArray(value),label+' must be an object.');for(const key of Object.keys(value))communityAssert(allowed.includes(key),label+': unknown field '+key+'.');}
function validateCredits(value){
 if(value===undefined)return[];
 communityAssert(Array.isArray(value)&&value.length<=COMMUNITY_LIMITS.credits,'Use at most 12 credits.');
 const seen=new Set();return value.map(c=>{
  communityFields(c,['name','platform','handle','note'],'Credit');const clean={name:communityText(c.name,64,'Credit name')};
  if(c.platform!==undefined||c.handle!==undefined){
   communityAssert(['github','x','bluesky'].includes(c.platform),'Credit platform must be github, x or bluesky.');
   const handle=communityText(c.handle,253,'Credit handle');
   const valid=c.platform==='github'?/^[a-z0-9](?:[a-z0-9-]{0,37}[a-z0-9])?$/i.test(handle)&&!handle.includes('--'):c.platform==='x'?/^[a-z0-9_]{1,15}$/i.test(handle):/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(handle);
   communityAssert(valid,'Invalid '+c.platform+' handle; omit @, URLs and paths.');clean.platform=c.platform;clean.handle=handle;
  }
  if(c.note!==undefined)clean.note=communityText(c.note,160,'Credit note');
  const key=JSON.stringify(clean);communityAssert(!seen.has(key),'Duplicate credit.');seen.add(key);return clean;
 });
}
function communityCreditURL(credit){
 const c=validateCredits([credit])[0];if(!c.platform)return null;
 return ({github:'https://github.com/',x:'https://x.com/',bluesky:'https://bsky.app/profile/'})[c.platform]+encodeURIComponent(c.handle);
}
function communityNumber(value,min,max,label){communityAssert(typeof value==='number'&&Number.isFinite(value)&&value>=min&&value<=max,label+' must be between '+min+' and '+max+'.');return value;}
function validateCommunity(value){
 communityFields(value,['format','version','works'],'Community catalogue');
 communityAssert(value.format==='whistlevale-community'&&value.version===1,'Unsupported community format/version.');
 communityAssert(Array.isArray(value.works)&&value.works.length<=COMMUNITY_LIMITS.works,'Use at most 128 community works.');
 const ids=new Set(),counts=new Map(),footprints=new Map();
 const works=value.works.map(w=>{
  communityFields(w,['id','title','kind','room','source','credits','workshop','miniatures','view'],'Work');
  communityAssert(typeof w.id==='string'&&/^[a-z][a-z0-9-]{0,63}$/.test(w.id)&&!ids.has(w.id),'Work IDs must be unique lowercase slugs.');ids.add(w.id);
  const clean={id:w.id,title:communityText(w.title,80,'Work title'),kind:w.kind,room:w.room,source:w.source,credits:validateCredits(w.credits)};
  communityAssert(COMMUNITY_KINDS.includes(w.kind),'Unknown contribution kind: '+w.kind+'.');
  communityAssert(w.room==='house'||typeof w.room==='string'&&/^[a-z][a-z0-9-]{0,63}$/.test(w.room),'Use a registered room key or house.');
  communityAssert(typeof w.source==='string'&&/^(src|contributions|assets)\/[a-zA-Z0-9_./-]+$/.test(w.source)&&!w.source.split('/').includes('..'),'Source must be a repository path under src, contributions or assets.');
  communityAssert(clean.credits.length>0,'A community work needs a chosen public credit.');
  if(w.view!==undefined){
   communityFields(w.view,['distance','yaw','pitch'],w.id+' view');
   communityAssert(w.miniatures?.length>0,w.id+': a view needs a miniature placement.');clean.view={...w.view};
   if(w.view.distance!==undefined)communityNumber(w.view.distance,10,120,w.id+' view distance');
   if(w.view.yaw!==undefined)communityNumber(w.view.yaw,-Math.PI*2,Math.PI*2,w.id+' view yaw');
   if(w.view.pitch!==undefined)communityNumber(w.view.pitch,.2,1.35,w.id+' view pitch');
  }
  for(const field of ['workshop','miniatures']){
   if(w[field]===undefined)continue;
   communityAssert(Array.isArray(w[field])&&w[field].length>0&&w[field].length<=64,field+' needs 1–64 placements.');
   communityAssert(field!=='workshop'||w.room==='valley','Editable workshop pieces belong to valley.');
   communityAssert(field!=='miniatures'||!['house','valley'].includes(w.room),'Miniatures use annex room layouts; valley uses editable workshop assets.');
   counts.set(w.room,(counts.get(w.room)||0)+w[field].length);
   communityAssert(counts.get(w.room)<=COMMUNITY_LIMITS.perRoom,'Room '+w.room+' exceeds 64 community placements.');
   clean[field]=w[field].map((p,index)=>{
    const where=w.id+' '+field+'['+index+']';
    communityFields(p,field==='workshop'?['type','at','angle','scale','params']:['builder','at','angle','y','scale','pose','variant','color'],where);
    communityAssert(Array.isArray(p.at)&&p.at.length===2,where+': at needs [x,z].');
    const q={...p,at:[communityNumber(p.at[0],-54,54,where+' x'),communityNumber(p.at[1],-33,33,where+' z')]};
    communityNumber(p.angle??0,-Math.PI*2,Math.PI*2,where+' angle');communityNumber(p.scale??1,.4,1.5,where+' scale');
    if(field==='workshop'){communityAssert(typeof p.type==='string'&&/^[a-z]+$/.test(p.type),where+': type must name an editor asset.');if(p.params!==undefined&&p.params!==null)communityFields(p.params,['w','d','h','paint','roof','name'],where+' params');}
    else{
     communityAssert(Object.hasOwn(COMMUNITY_BUILDERS,p.builder),where+': unknown miniature builder.');
     if(p.y!==undefined)communityNumber(p.y,-24,24,where+' deck height');
     if(p.color!==undefined)communityAssert(['person','book','case','pack','chair'].includes(p.builder)&&/^#[0-9a-f]{6}$/i.test(p.color),where+': color needs a supported person/prop and six-digit hex value.');
     if(p.variant!==undefined)communityAssert(p.builder==='person'&&Number.isInteger(p.variant)&&p.variant>=0&&p.variant<=999,where+': variant must be 0–999.');
     if(p.pose!==undefined)communityAssert(p.builder==='person'&&['stand','sitGround','sit','perch','read','chair','sip','walk','hike','carry','paint','work','wave','talk','point','readStand','camera','bag','map'].includes(p.pose),where+': unknown person pose.');
     const radius=COMMUNITY_BUILDERS[p.builder]*(p.scale??1),prior=footprints.get(w.room)||[];
     communityAssert(prior.every(o=>Math.hypot(o.x-p.at[0],o.z-p.at[1])>=o.r+radius),where+': overlaps another community miniature. Compose touching props in a reviewed builder.');
     prior.push({x:p.at[0],z:p.at[1],r:radius});footprints.set(w.room,prior);
    }
    return q;
   });
  }
  return clean;
 });return{format:value.format,version:1,works};
}
