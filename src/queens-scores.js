'use strict';

// The requested 13 September final stays pinned after today, including its result.
// Only the active room's host adapter polls. The miniature itself has no network.
const QUEENS_FINAL={event:'189-2026',match:'182677',date:'2026-09-13T18:00:00Z',
 url:'https://site.api.espn.com/apis/site/v2/sports/tennis/atp/scoreboard?dates=20260913',
 source:'https://www.espn.com/tennis/scoreboard/tournament/_/year/2026/eventId/189-2026',
 players:[{id:'2375',name:'Alexander Zverev',shortName:'A. Zverev',seed:1},{id:'9250',name:'Ben Shelton',shortName:'B. Shelton',seed:8}]};
function queensScoreFallback(){return {state:'pre',status:'Scheduled',date:QUEENS_FINAL.date,period:0,players:QUEENS_FINAL.players.map(p=>({...p,sets:[],point:null,winner:false,serving:false}))};}
function queensReadScore(data){
 const event=data?.events?.find(e=>e.id===QUEENS_FINAL.event&&e.name==='US Open');
 const group=event?.groupings?.find(g=>g.grouping?.slug==='mens-singles');
 const match=group?.competitions?.find(c=>c.id===QUEENS_FINAL.match);
 if(!match||match.round?.displayName!=='Final'||!match.date?.startsWith('2026-09-13')||match.competitors?.length!==2)throw new Error('Requested US Open final missing');
 const type=match.status?.type;
 if(!['pre','in','post'].includes(type?.state))throw new Error('Unknown match status');
 const number=v=>v!==null&&v!==undefined&&v!==''&&Number.isInteger(Number(v))&&Number(v)>=0?Number(v):null;
 const point=v=>v!==null&&v!==undefined&&/^(?:\d{1,3}|AD|A)$/i.test(String(v))?String(v).toUpperCase().replace(/^A$/,'AD'):null;
 const players=QUEENS_FINAL.players.map(expected=>{
  const c=match.competitors.find(p=>p.id===expected.id);
  if(!c||c.athlete?.displayName!==expected.name)throw new Error('Unexpected finalist');
  // A generic competitor.score can mean sets won. Never label it as game points.
  const sets=(Array.isArray(c.linescores)?c.linescores:[]).slice(0,5).map(s=>({games:number(s.value),tiebreak:number(s.tiebreak),won:s.winner===true}));
  // ESPN's live tennis feed marks the server with possession.
  return {...expected,sets,point:type.state==='in'?point(c.pointScore??c.point):null,winner:c.winner===true,serving:type.state==='in'&&(c.possession??c.serving)===true};
 });
 return {state:type.state,status:String(type.description||type.shortDetail||'').slice(0,60),date:match.date,period:number(match.status.period)||0,players};
}
function queensScoreView(score,connection,checkedAt=0){
 const et=date=>new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',hour:'numeric',minute:'2-digit'}).format(new Date(date))+' ET';
 const scheduled='13 SEP · '+et(score.date),fresh=connection==='ok';
 let headline=score.state==='pre'?scheduled:score.state==='post'?score.status.toUpperCase():'SET '+Math.max(1,score.period);
 const suspended=/suspend|delay|interrupt|postpon/i.test(score.status);
 if(suspended)headline=score.status.toUpperCase();
 else if(score.state==='in')headline=(fresh?'LIVE · ':'')+headline;
 const footer=fresh?'ESPN · CHECKED '+et(checkedAt):connection==='loading'?'CONNECTING TO ESPN':checkedAt?'SCORES DELAYED · LAST '+et(checkedAt):'SCORES UNAVAILABLE';
 const rows=score.players.map(p=>p.name+(p.winner?', winner':p.serving?', serving':'')+': '+(p.sets.length?p.sets.map(s=>s.games??'–').join(', '):'awaiting play')+(p.point!==null?', '+p.point+' points':''));
 return {...score,connection,checkedAt,headline,footer,summary:"US Open men's final, 13 September 2026. "+headline+'. '+rows.join('. ')+'. '+footer+'. Court animation is an imagined exhibition.'};
}
function createQueensScoreFeed({signal,onChange,fetcher=fetch,clock=Date.now,visible=()=>!document.hidden}){
 let disposed=false,pending=null,nextAt=0,checkedAt=0,interval=60000,connection='loading',score=queensScoreFallback(),signature='';
 const publish=()=>{if(disposed||signal.aborted)return;const view=queensScoreView(score,connection,checkedAt),key=JSON.stringify(view);if(key!==signature){signature=key;onChange(view);}};
 const dispose=()=>{if(disposed)return;disposed=true;pending?.abort();signal.removeEventListener('abort',dispose);};
 signal.addEventListener('abort',dispose,{once:true});
 async function refresh(){
  const request=new AbortController();pending=request;
  const timeout=setTimeout(()=>request.abort(),12000);
  try{
   const response=await fetcher(QUEENS_FINAL.url,{signal:request.signal,credentials:'omit',referrerPolicy:'no-referrer',cache:'no-cache'});
   if(!response.ok)throw new Error('Score feed '+response.status);
   const current=queensReadScore(await response.json());
   if(disposed||signal.aborted||request.signal.aborted||pending!==request)return;
   score=current;checkedAt=clock();connection='ok';
   interval=score.state==='post'?900000:score.state==='pre'&&Date.parse(score.date)-checkedAt>900000?300000:60000;
  }catch(error){if(!disposed&&!signal.aborted&&pending===request)connection='stale';}
  finally{clearTimeout(timeout);if(pending===request){pending=null;nextAt=clock()+interval;publish();}}
 }
 publish();
 return {dispose,suspend(){if(pending){const request=pending;pending=null;request.abort();}nextAt=0;},tick(){
  if(disposed||signal.aborted||!visible())return;
  if(checkedAt&&clock()-checkedAt>interval*2+15000&&connection==='ok'){connection='stale';publish();}
  if(!pending&&clock()>=nextAt)return refresh();
 }};
}
