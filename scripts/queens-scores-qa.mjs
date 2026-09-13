#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source=await readFile(new URL('../src/queens-scores.js',import.meta.url),'utf8');
const scheduled=JSON.parse(await readFile(new URL('fixtures/queens-final-scheduled.json',import.meta.url),'utf8'));
const timers=new Set(),context=vm.createContext({Intl,Date,AbortController,setTimeout:f=>(timers.add(f),f),clearTimeout:f=>timers.delete(f)});
vm.runInContext(source+'\nglobalThis.api={read:queensReadScore,view:queensScoreView,feed:createQueensScoreFeed};',context);
const {read,view,feed}=context.api,copy=x=>JSON.parse(JSON.stringify(x)),competition=x=>x.events[0].groupings[0].competitions[0];
const pre=read(scheduled);assert.equal(pre.players[0].name,'Alexander Zverev');assert.equal(pre.players[1].name,'Ben Shelton');assert.equal(pre.players[0].sets.length,0);assert.equal(pre.players[0].point,null);
assert.match(view(pre,'ok',Date.parse('2026-09-13T14:00Z')).headline,/13 SEP · 2:00 PM ET/);
// Controlled formatting/lifecycle fixtures, not claims about the real result.
const live=copy(scheduled),c=competition(live);c.status={period:2,type:{state:'in',description:'In Progress'}};
c.competitors.forEach(p=>{p.linescores=[{value:6,tiebreak:5,winner:false},{value:0}];p.score='1';});
c.competitors.find(p=>p.id==='2375').pointScore='AD';c.competitors.find(p=>p.id==='2375').serving=true;
c.competitors.find(p=>p.id==='9250').linescores[0]={value:7,tiebreak:7,winner:true};
const playing=read(live);assert.equal(playing.players[0].sets[1].games,0,'a real zero is retained');assert.equal(playing.players[0].point,'AD');assert.equal(playing.players[1].point,null,'generic score is not mistaken for points');assert.equal(playing.players[1].sets[0].tiebreak,7);assert.equal(playing.players[0].serving,true);
assert.match(view(playing,'ok',Date.now()).headline,/LIVE · SET 2/);assert.doesNotMatch(view(playing,'stale',Date.now()).headline,/LIVE/);
const final=copy(live);competition(final).status.type={state:'post',description:'Final'};competition(final).competitors.find(p=>p.id==='9250').winner=true;
assert.equal(read(final).players[1].winner,true);assert.equal(read(final).players[0].point,null);assert.equal(view(read(final),'ok',Date.now()).headline,'FINAL');
for(const status of['Suspended','Delayed','Postponed']){const interrupted=copy(live);competition(interrupted).status.type.description=status;assert.equal(view(read(interrupted),'ok',Date.now()).headline,status.toUpperCase());}
for(const alter of[x=>x.events[0].id='189-2027',x=>competition(x).id='another',x=>competition(x).date='2027-09-13T18:00Z',x=>competition(x).round.displayName='Semifinal',x=>competition(x).competitors[0].athlete.displayName='Another player',x=>competition(x).status.type.state='unknown']){const bad=copy(scheduled);alter(bad);assert.throws(()=>read(bad));}

let now=Date.parse('2026-09-13T17:50Z'),visible=true,response=scheduled,requests=0,fail=false,deferred=null,lastSignal,updates=[];
const abort=new AbortController(),fetcher=async(url,options)=>{requests++;lastSignal=options.signal;assert.ok(url.endsWith('dates=20260913'));assert.equal(options.credentials,'omit');if(deferred)return deferred.promise;if(fail)throw new Error('Offline');return {ok:true,json:async()=>response};};
const scores=feed({signal:abort.signal,onChange:x=>updates.push(x),clock:()=>now,visible:()=>visible,fetcher});
assert.equal(updates.at(-1).connection,'loading');await scores.tick();assert.equal(updates.at(-1).connection,'ok');assert.equal(requests,1);
now+=59000;await scores.tick();assert.equal(requests,1);response=live;now+=1000;await scores.tick();assert.equal(requests,2);assert.equal(updates.at(-1).players[0].point,'AD');
fail=true;now+=60000;await scores.tick();assert.equal(updates.at(-1).connection,'stale');assert.equal(updates.at(-1).players[0].point,'AD','outage retains the last real data');assert.match(updates.at(-1).footer,/SCORES DELAYED/);
visible=false;now+=300000;await scores.tick();assert.equal(requests,3,'hidden rooms do not poll');visible=true;fail=false;response=final;await scores.tick();assert.equal(updates.at(-1).state,'post');
const afterFinal=requests;now+=60000;await scores.tick();assert.equal(requests,afterFinal,'finished matches use a slower refresh');
deferred={};deferred.promise=new Promise(resolve=>{deferred.resolve=resolve;});now+=900000;const work=scores.tick();await scores.tick();assert.equal(requests,afterFinal+1,'requests never overlap');scores.suspend();assert.equal(lastSignal.aborted,true);const before=updates.length;deferred.resolve({ok:true,json:async()=>scheduled});await work;assert.equal(updates.length,before,'late suspended response is ignored');
deferred=null;response=final;await scores.tick();assert.equal(updates.at(-1).state,'post');
deferred={};deferred.promise=new Promise(resolve=>{deferred.resolve=resolve;});now+=900000;const late=scores.tick();abort.abort();assert.equal(lastSignal.aborted,true);const stopped=updates.length;deferred.resolve({ok:true,json:async()=>live});await late;await scores.tick();assert.equal(updates.length,stopped,'leaving the room prevents all late updates');assert.equal(timers.size,0,'all timeout handles are released');
const offline=feed({signal:new AbortController().signal,onChange:x=>updates.push(x),clock:()=>now,visible:()=>true,fetcher:async()=>({ok:false,status:503})});await offline.tick();assert.equal(updates.at(-1).connection,'stale');assert.equal(updates.at(-1).checkedAt,0);assert.match(updates.at(-1).footer,/SCORES UNAVAILABLE/);assert.equal(updates.at(-1).players[0].sets.length,0,'offline fallback invents no score');offline.dispose();
console.log('Queens scores: verified scheduled fixture, five-set/point/tiebreak formatting, exact match identity, stale/offline data, refresh, visibility, cancellation and disposal PASS');
