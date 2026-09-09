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
 builder:'willowbank',scale:.28,source:'src/scenery/willowbank.js'
}];
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
function grandHallBuildExhibit(name,b){
 const builders={willowbank:willowbankPottery};
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
