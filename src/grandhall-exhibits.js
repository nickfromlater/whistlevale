'use strict';

// Reviewed public exhibits. New work arrives through a pull request, with a
// stable bay, original geometry and the maker's chosen public attribution.
const GRAND_HALL_EXHIBITS=[{
 bay:'GH-08',id:'willowbank-pottery',title:'Willowbank Pottery',maker:'nickfromlater',
 handle:'@nickfromlater',link:'https://x.com/nickfromlater',
 credits:[
  {name:'nickfromlater',platform:'x',handle:'nickfromlater',note:'The first contribution to The Commons.'},
  {name:'Whistlevale contributors',note:'Shared geometry and window details.'}
 ],
 story:'A small pottery workshop, with a covered worktable, greenware and a carefully stocked window. The first contribution to Whistlevale.',
 builder:'willowbank',scale:.28,source:'src/scenery/willowbank.js',mapPreview:true
},{
 bay:'AR-03',id:'meridian-hill-observatory',title:'Meridian Hill Observatory',
 credits:[
  {name:'nickfromlater',platform:'github',handle:'nickfromlater',note:'Original observatory design.'},
  {name:'Whistlevale contributors',note:'Shared native geometry primitives.'}
 ],
 story:'A copper dome opens over a brass refractor. A winding stair climbs from the limestone terrace; below, charts, an armillary sphere and a lamplit workroom await the next clear night.',
 builder:'meridian',scale:.15,source:'src/scenery/meridian-observatory.js',mapPreview:true
},{

 bay:'LW-07',id:'wintergarden-station',title:'Wintergarden Station',
 credits:[
  {name:'nickfromlater',platform:'x',handle:'nickfromlater',note:'Original station and botanical conservatory.'},
  {name:'Whistlevale contributors',note:'Shared native geometry primitives and railway landscape.'}
 ],
 story:'A station for taking the slower train. Beyond the copper clock tower, a complete iron-and-glass vault shelters palms, citrus trees and a little fountain. Follow the tiled garden paths past hanging plants and the ticket window, to luggage waiting beneath the platform canopy. This same miniature has a home beside the railway in The Commons.',
 view:{target:[-1,4.4,.8],distance:24,yaw:.48,pitch:.35},
 builder:'wintergarden',scale:.205,source:'src/scenery/wintergarden.js',mapPreview:true
}];
// View targets are offsets from the bay center/display surface in native units:
// Y is height above the model's lowest plane, not its original modeling origin.
// Framing therefore travels with a miniature when its placement is resized/rotated.
function grandHallExhibitView(exhibit,bay){
 if(!exhibit?.view)return{camera:bay.camera,target:bay.target};
 const v=exhibit.view;
 if(!Array.isArray(v.target)||v.target.length!==3||!v.target.every(Number.isFinite)||!Number.isFinite(v.distance)||v.distance<=0||!Number.isFinite(v.yaw)||!Number.isFinite(v.pitch)||v.pitch<.15||v.pitch>1.35)throw new Error('An exhibit view needs a finite target, positive distance and valid camera angles.');
 const s=exhibit.scale,a=bay.yaw||0,c=Math.cos(a),n=Math.sin(a),[x,y,z]=v.target;
 const target=[bay.x+(x*c+z*n)*s,bay.surfaceY+y*s,bay.z+(z*c-x*n)*s],yaw=v.yaw+a,d=v.distance*s;
 return{target,camera:[target[0]+Math.sin(yaw)*Math.cos(v.pitch)*d,target[1]+Math.sin(v.pitch)*d,target[2]+Math.cos(yaw)*Math.cos(v.pitch)*d]};
}
function grandHallExhibitCredits(exhibit){
 let credits=exhibit.credits;
 if(credits===undefined){
  const legacy={name:exhibit.maker};
  if(exhibit.link){
   const profile=/^https:\/\/(github\.com|x\.com|bsky\.app\/profile)\/([^/?#]+)\/?$/i.exec(exhibit.link);
   if(!profile)throw new Error('Hall credit links must use a supported GitHub, X or Bluesky profile.');
   legacy.platform={'github.com':'github','x.com':'x','bsky.app/profile':'bluesky'}[profile[1].toLowerCase()];
   legacy.handle=decodeURIComponent(profile[2]);
  }
  credits=[legacy];
 }
 const clean=validateCredits(credits);
 if(!clean.length)throw new Error('A Hall exhibit needs a chosen public credit.');
 return clean;
}
function grandHallRailwayLocations(exhibit){
 const catalogue=typeof window==='undefined'?null:window.HOUSE_COMMUNITY;
 if(!exhibit||typeof exhibit.id!=='string'||!/^[a-z][a-z0-9-]*$/.test(exhibit.id)||typeof exhibit.source!=='string'||!Array.isArray(catalogue?.works))return[];
 const matches=catalogue.works.filter(work=>work.id===exhibit.id);if(matches.length!==1||matches[0].source!==exhibit.source)return[];
 const work=matches[0];if(typeof work.room!=='string'||!/^[a-z][a-z0-9-]*$/.test(work.room)||work.room==='house'||!Array.isArray(work.miniatures))return[];
 const result=[];
 for(const [placement,piece]of work.miniatures.entries()){
  if(!piece||!Array.isArray(piece.at)||piece.at.length!==2||!piece.at.every(Number.isFinite)||!Object.hasOwn(COMMUNITY_BUILDERS,piece.builder))continue;
  const address=new URL(window.HOUSE_RETURN_URL||'index.html',location.href),params=address.protocol==='blob:'?new URLSearchParams():address.searchParams;
  params.delete('map');params.set('room',work.room);params.set('work',work.id);params.set('placement',String(placement));
  if(address.protocol==='blob:')address.hash=params.toString();
  const name=(typeof HOUSE_ROOMS==='undefined'?null:HOUSE_ROOMS[work.room]?.name)||window.HOUSE_ROOM_NAMES?.[work.room]||work.room.replace(/(^|-)([a-z])/g,(_,prefix,letter)=>(prefix?' ':'')+letter.toUpperCase());
  result.push({room:work.room,name,work:work.id,placement,href:address.href});
 }
 return result;
}
function grandHallBuildExhibit(name,b){
 const builders={willowbank:(...args)=>willowbankPottery(...args),meridian:(...args)=>meridianObservatory(...args),wintergarden:(...args)=>wintergardenStation(...args)};
 const build=builders[name];if(!build)throw new Error('Unknown reviewed Hall builder: '+name);
 return build(b,0,0,0);
}
function grandHallPlaceExhibit(exhibit,target,bay){
 if(!Number.isFinite(exhibit.scale)||exhibit.scale<=0||![bay.x,bay.z,bay.surfaceY,bay.yaw??0].every(Number.isFinite))throw new Error('A Hall exhibit needs a finite placement and positive scale.');
 const local=new Builder();grandHallBuildExhibit(exhibit.builder,local);
 if(!local.data.length||local.data.length%36||!local.data.every(Number.isFinite)||local.stack.length)throw new Error('A Hall exhibit must emit finite triangles with a balanced transform stack.');
 let minY=Infinity;for(let i=1;i<local.data.length;i+=12)minY=Math.min(minY,local.data[i]);
 target.push(bay.x,bay.surfaceY-minY*exhibit.scale,bay.z,0,bay.yaw??0,0,exhibit.scale);
 try{
  for(let i=0;i<local.data.length;i+=12)target.vertex(local.data.slice(i,i+3),local.data.slice(i+3,i+6),local.data.slice(i+6,i+9),local.data[i+9],local.data.slice(i+10,i+12));
 }finally{target.pop();}
 return local.data.length/12;
}
