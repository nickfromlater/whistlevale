'use strict';

// THE ORRERY / a clockmaker's impossible little amusement park.
// Native authored geometry. No images, imported models or extra render context.
const ORRERY={ink:'#243c48',teal:'#3c807e',mint:'#94c5b2',cream:'#e8d7ac',gold:'#b99558',coral:'#be7665',wood:'#69503c',night:'#263441'};
function orreryRing(b,x,y,z,r,radius,color,mat=41,segments=64,vertical=false){
 const point=a=>vertical?[x,y+Math.sin(a)*r,z+Math.cos(a)*r]:[x+Math.cos(a)*r,y,z+Math.sin(a)*r];
 for(let i=0;i<segments;i++)b.beam(point(i*TAU/segments),point((i+1)*TAU/segments),radius,color,mat,5);
}
function orreryStar(b,x,y,z,r,color=ORRERY.cream,mat=25){
 const outer=[],inner=[];
 for(let i=0;i<5;i++){let a=PI/2+i*TAU/5;outer.push([x+Math.cos(a)*r,y+Math.sin(a)*r,z]);a+=PI/5;inner.push([x+Math.cos(a)*r*.40,y+Math.sin(a)*r*.40,z]);}
 for(let i=0;i<5;i++){b.tri([x,y,z+.075],outer[i],inner[i],color,mat);b.tri([x,y,z+.075],inner[i],outer[(i+1)%5],color,mat);}
}
// Single-line modelmaker's lettering. Its stroke widths remain legible close up.
const ORRERY_GLYPHS={A:'06 61 23',B:'04 45 53 31 10 13',C:'54 40 01',D:'04 45 51 10',E:'54 40 01 23',F:'54 40 23',G:'54 40 01 13 32',H:'04 15 23',I:'45 67 01',L:'40 01',M:'04 48 85 51',N:'04 41 15',O:'04 45 51 10',P:'04 45 53 32',R:'04 45 53 32 21',S:'54 42 23 31 10',T:'45 67',U:'40 01 15',V:'47 75',W:'40 08 81 15',Y:'48 58 87',Z:'45 50 01',0:'04 45 51 10',1:'63 37'};
function orreryLetters(b,text,x,y,z,height,color=ORRERY.cream){
 const points=[[0,0],[.62,0],[0,.5],[.62,.5],[0,1],[.62,1],[.31,1],[.31,0],[.31,.5]],advance=.85*height,w=(text.length*.85-.23)*height;
 for(const [i,char]of [...text].entries())for(const stroke of (ORRERY_GLYPHS[char]||'').split(' ').filter(Boolean)){
  const a=points[+stroke[0]],q=points[+stroke[1]];b.beam([x-w/2+i*advance+a[0]*height,y+a[1]*height,z],[x-w/2+i*advance+q[0]*height,y+q[1]*height,z],height*.043,color,41,5);
 }
}
function orrerySlab(b,w,d,y,h,r,color,mat=22){
 const outline=roundRect(w,d,r,12);
 for(let i=0;i<outline.length;i++){const a=outline[i],q=outline[(i+1)%outline.length];b.tri([0,y+h/2,0],[q[0],y+h/2,q[1]],[a[0],y+h/2,a[1]],color,mat);b.quad([a[0],y-h/2,a[1]],[q[0],y-h/2,q[1]],[q[0],y+h/2,q[1]],[a[0],y+h/2,a[1]],shade(color,.8),mat);}
}
function orreryShell(b){
 const P=ORRERY,walls=[];
 b.box(0,FLOOR-.25,0,158,.5,130,'#584b40',22);
 for(let x=-75;x<78;x+=6)b.box(x,FLOOR+.012,0,.035,.02,129,'#aa8a60',22);
 for(const which of ['back','left','right','front']){
  const w=new Builder(),back=which==='back',front=which==='front',width=back||front?158:130,pos=back?[0,0,-65]:front?[0,0,65]:which==='left'?[-79,0,0]:[79,0,0],angle=back?0:front?PI:which==='left'?PI/2:-PI/2;
  w.push(...pos,0,angle);w.box(0,12,0,width,72,.8,P.night,20);w.box(0,-15,.7,width,17,.8,'#35494c',22);
  for(let x=-width/2+5;x<width/2;x+=12){w.box(x,-15,1.2,.19,13,.15,P.gold,41);w.box(x+5.8,-8.65,1.2,10.7,.14,.15,P.gold,41);}
  for(const y of[-23,-6,45])w.box(0,y,.9,width,.55,1.2,P.gold,41);
  for(let i=0;i<90;i++){
   const x=(hash(i+31,13)-.5)*(width-8),y=-1+hash(i+81,17)*43,r=.045+hash(i,92)*.095;
   w.sphere(x,y,.6,r,r,.04,i%3?'#b8c7ba':'#e7c999',25,5,3);
  }
  if(back){
   // Recessed astronomical window and a permanent painted nebula on real depth.
   w.push(0,20,1,0,PI/2);orreryRing(w,0,0,0,20,.45,P.gold,41,96,true);orreryRing(w,0,0,0,18.6,.10,P.cream,25,96,true);w.pop();
   w.quad([-19,1,1.15],[19,1,1.15],[19,39,1.15],[-19,39,1.15],'#8cabbb',78,[0,0,1],[[-1,-1],[1,-1],[1,1],[-1,1]]);
   for(let i=0;i<60;i++){const a=i*TAU/60,r=i%5?19.3:18.9;w.beam([Math.cos(a)*r,20+Math.sin(a)*r,1.4],[Math.cos(a)*19.8,20+Math.sin(a)*19.8,1.4],i%5?.035:.09,P.gold,41,5);}
   orreryLetters(w,'THE ORRERY',0,42,1.5,2.9);orreryLetters(w,'COMET',-47,21,1.5,2.4);orreryStar(w,47,25,1.5,4.5);
   const key='house-'+Object.keys(HOUSE_ROOMS).indexOf('orrery');if(roomLabels[key])roomFrame(w,key,47,12,1.5,36,9);
  }else if(front){
   w.box(0,-3,1,20,42,1.2,'#405553',22);w.box(0,-3,1.8,17,39,.2,P.night,22);orreryStar(w,0,8,2,3.0);w.cylinder(6,-4,2,.3,.3,.5,P.gold,41,10,PI/2);
  }else{
   for(const x of [-35,35]){w.box(x,16,1,24,30,.4,'#172e3b',22);w.box(x,16,1.4,22,28,.2,'#354955',20);orreryStar(w,x,22,1.65,3,P.gold,41);for(let k=0;k<4;k++)w.beam([x-7,13-k*1.8,1.65],[x+7,13-k*1.8,1.65],.035,P.gold,41,5);}
  }
  for(const x of [-width*.36,width*.36]){w.box(x,2,1.2,2,4,.5,P.gold,41);w.beam([x,2,1.5],[x,3,4],.15,P.gold,41,6);w.cylinder(x,4,4,2.5,1.1,2.5,P.ink,41,16);w.cylinder(x,2.73,4,2.2,2.2,.045,P.cream,25,16);}
  w.pop();walls.push({which,mesh:w.mesh()});
 }
 // Clockmaker's cabinets and small objects are outside the miniature's board.
 for(const x of [-66,66]){
  b.box(x,-16,0,10,16,70,P.wood,22);b.box(x,-7.7,0,10.8,.8,71,P.gold,22);
  for(let z=-29;z<35;z+=12){b.box(x+(x<0?5.1:-5.1),-15,z,.2,12,9,'#35494b',22);b.cylinder(x+(x<0?5.35:-5.35),-13,z,.3,.3,.2,P.gold,41,8,0,PI/2);}
  for(const z of [-24,24]){b.push(x,-7.2,z);orreryRing(b,0,3,0,2.6,.06,P.gold,41,24,true);b.cylinder(0,1,0,.1,.1,2,P.gold,41,8);b.cylinder(0,.1,0,2.6,2.8,.2,P.ink,41,16);b.pop();}
 }
 return walls;
}
function orreryTube(b,track,offset,vertical,radius,color){
 const count=Math.ceil(track.length/.57),sides=8;
 for(let i=0;i<count;i++){
  const a=track.at(i*track.length/count),q=track.at((i+1)*track.length/count);
  const point=(f,t)=>add(add(f.p,mul(f.r,offset+Math.cos(t)*radius)),mul(f.u,vertical+Math.sin(t)*radius));
  for(let k=0;k<sides;k++){const t=k*TAU/sides,v=(k+1)*TAU/sides;
   b.quad(point(a,t),point(q,t),point(q,v),point(a,v),typeof color==='function'?color(a):color,41);
  }
 }
}
function orreryRailway(b,scene){
 const P=ORRERY,track=ORRERY_ROUTE.track;
 orreryTube(b,track,-.52,0,.10,P.cream);orreryTube(b,track,.52,0,.10,P.cream);
 orreryTube(b,track,0,-.58,.23,q=>q.section===5?P.coral:P.teal);
 for(let s=0;s<track.length;s+=1.12){const q=track.at(s);b.matrix(orreryMatrix(q));b.beam([-.60,-.17,0],[.60,-.17,0],.075,P.gold,41,5);b.beam([-.48,-.17,0],[0,-.58,0],.045,P.gold,41,5);b.beam([.48,-.17,0],[0,-.58,0],.045,P.gold,41,5);b.pop();}
 // Clearance-tested structural members. Never send a support through a lower
 // track or through the train's inverted envelope merely to reach the floor.
 const envelope=[];for(let s=0;s<track.length;s+=1)envelope.push(track.at(s));
 function clear(a,c,r=.27){
  const d=sub(c,a),dd=dot(d,d);
  for(const q of envelope){const v=add(a,mul(d,clamp(dot(sub(q.p,a),d)/dd))),local=sub(v,q.p);if(Math.abs(dot(local,q.f))<1.8+r&&Math.abs(dot(local,q.r))<.92+r&&dot(local,q.u)>-.32-r&&dot(local,q.u)<2.05+r)return false;}
  return true;
 }
 scene.orrerySupports=[];
 for(let s=7;s<track.length;s+=8){
  const q=track.at(s);if(q.section===0||q.section===5)continue;
  const top=sub(q.p,mul(q.u,.91));
  for(const side of [-1,1]){
   const foot=[top[0]+q.r[0]*side*2.5,.25,top[2]+q.r[2]*side*2.5];
   if(clear(foot,top)){b.beam(foot,top,.21,'#658c89',41,6);b.cylinder(foot[0],.21,foot[2],.85,.68,.42,'#b4ab8b',4,8);scene.orrerySupports.push({a:foot,b:top});}
  }
 }
 // A separate double orbital truss embraces the inversion from the outside.
 for(const x of [-43.8,-28.2]){
  orreryRing(b,x,16,-11,14,.25,P.gold,41,96,true);
  for(const z of [-20,-2]){b.beam([x,.4,z],[x,5.3,z],.30,P.teal,41,8);b.cylinder(x,.25,z,1.05,.9,.5,'#bab391',4,10);}
 }
 const loop=track.sections[5];for(let t=0;t<1;t+=1/20){const q=loop.sample(t),outer=sub(q.p,mul(q.u,2));for(const x of [-43.8,-28.2]){const end=[x,outer[1],outer[2]],a=sub(q.p,mul(q.u,.92));if(clear(a,end,.09)){b.beam(a,end,.09,P.gold,41,5);scene.orrerySupports.push({a,b:end});}}}
 // Lift-chain and walk-on maintenance stair, offset outside the vehicle sweep.
 const lift=track.sections[2];for(let t=.025;t<.98;t+=.019){const q=lift.sample(t);b.matrix(orreryMatrix(q));b.box(1.62,-.15,0,1.15,.16,.76,'#77644a',22);b.box(2.18,.68,0,.065,1.6,.065,P.gold,41);b.pop();}
 for(let i=0;i<100;i++){const a=lift.sample(i/100),q=lift.sample((i+1)/100),shift=f=>add(add(f.p,mul(f.r,2.18)),mul(f.u,1.4));b.beam(shift(a),shift(q),.065,P.gold,41,5);}
}
function orreryPlanet(b){
 const P=ORRERY;
 b.cylinder(6,1,-5,15,15,1.9,P.ink,41,72);orreryRing(b,6,2.02,-5,14.4,.11,P.gold);orreryRing(b,6,2.04,-5,12,.045,P.gold);
 // The pedestal is a visible mechanical column, not a floating prop.
 b.cylinder(6,8,-5,1.3,.8,12,P.gold,41,16);
 for(const y of [3,5,8,11,13]){b.cylinder(6,y,-5,2,2,.3,P.ink,41,24);orreryRing(b,6,y+.17,-5,1.85,.06,P.gold,41,32);}
 b.push(6,21,-5,0,0,-.30);
 const palette=['#92aaa6','#c2b993','#d9caa5','#899f9c','#cab596','#e4d2ac'];
 const rows=28,segs=56,r=7.4,point=(a,t)=>[Math.sin(t)*Math.cos(a)*r,Math.cos(t)*r,Math.sin(t)*Math.sin(a)*r];
 for(let j=0;j<rows;j++)for(let i=0;i<segs;i++){const a=i*TAU/segs,c=(i+1)*TAU/segs,t=j*PI/rows,u=(j+1)*PI/rows;b.quad(point(a,t),point(c,t),point(c,u),point(a,u),palette[Math.floor(j/2)%palette.length],40);}
 for(let band=0;band<5;band++){const r0=9.2+band*.67,r1=r0+.48;for(let i=0;i<120;i++){const a=i*TAU/120,q=(i+1)*TAU/120;b.quad([Math.cos(a)*r0,0,Math.sin(a)*r0],[Math.cos(q)*r0,0,Math.sin(q)*r0],[Math.cos(q)*r1,0,Math.sin(q)*r1],[Math.cos(a)*r1,0,Math.sin(a)*r1],band%2?P.gold:P.cream,41);}}
 orreryRing(b,0,0,0,12.55,.055,P.cream,25,120);b.pop();
 for(let i=0;i<36;i++){const a=i*TAU/36;b.cylinder(6+Math.cos(a)*13,2.17,-5+Math.sin(a)*13,.09,.09,.16,P.cream,25,5);}
}
function orreryStation(b,scene){
 const P=ORRERY;
 // Platform on the OUTSIDE of the straight, with a continuous open ride side.
 b.box(-24,3.28,36.1,34,6.55,5.9,'#657e77',4);b.box(-24,6.66,36.1,35,.23,6.1,P.cream,4);
 for(let x=-40;x<-7;x+=1.2)b.box(x,6.8,33.45,.7,.055,.24,P.gold,41);
 for(const x of [-39,-8]){b.box(x,10,38.1,.44,6.5,.44,P.gold,41);b.box(x,10,34.1,.30,6.5,.30,P.gold,41);}
 for(let i=0;i<16;i++){const a=i*PI/16,q=(i+1)*PI/16;const p=(x,t)=>[x,12.2+Math.sin(t)*1.6,36.4+Math.cos(t)*2.7];b.quad(p(-41,a),p(-7,a),p(-7,q),p(-41,q),i%2?P.cream:P.teal,23);}
 b.box(-24,13.4,39.15,23,3.1,.25,P.ink,22);orreryLetters(b,'COMET',-24,12.7,39.34,1.55);
 for(const x of [-37,-32,-27,-22,-17,-12]){b.cylinder(x,11.7,38.8,.16,.16,.23,P.cream,25,8);scenePerson(scene,b,x,6.78,36.6,'stand',PI,1.7);}
 for(let i=0;i<12;i++)b.box(-44-i*.6,6.45-i*.53,36.1,1.15,.48,4.4,P.cream,4);
 for(const z of [34.1,38.1])b.beam([-43,8,z],[-51,.95,z],.065,P.gold,41,6);
 // Ticket kiosk, scalloped roof and brass clock.
 b.box(-53,2.5,26,5,5,5,P.teal,22);b.box(-53,3.3,28.55,3,1.5,.10,P.ink,0);b.box(-53,2.45,29,4,.22,1.1,P.gold,22);b.cylinder(-53,5.4,26,4,0,2.5,P.cream,23,6);b.sphere(-53,6.82,26,.25,.25,.25,P.gold,41,8,6);
 for(let i=0;i<4;i++){b.cylinder(-53+i*2,1.1,30.8,.06,.06,2.2,P.gold,41,6);if(i<3)b.beam([-53+i*2,1.8,30.8],[-51+i*2,1.8,30.8],.05,P.coral,23,6);}
}
function orreryLandscape(b,scene){
 const P=ORRERY;
 // Promenades, lunar gardens and hand-chiselled meteor fragments.
 for(const [x,z,r]of[[-50,-38,8],[47,-34,9],[45,43,6],[-4,-44,6]]){
  b.cylinder(x,.12,z,r,r,.24,'#7b9588',3,40);orreryRing(b,x,.25,z,r-.3,.10,P.gold,41,48);
  for(let i=0;i<12;i++){const a=i*2.4,rr=1+hash(i,x)*r*.7,xx=x+Math.cos(a)*rr,zz=z+Math.sin(a)*rr,h=.3+hash(i,z)*1.7;b.sphere(xx,h*.42,zz,h*.68,h*.55,h*.50,i%2?'#819b94':'#b5bda4',4,7,4,true);}
 }
 for(const [x,z]of[[52,11],[53,1],[-50,8],[-53,17],[1,49],[18,49],[45,-47]]){
  b.cylinder(x,2,z,.07,.07,4,P.gold,41,8);b.sphere(x,4.05,z,.35,.45,.35,P.cream,25,10,7);b.cylinder(x,4.53,z,.50,0,.42,P.ink,41,10);b.cylinder(x,.1,z,.36,.46,.2,P.ink,41,10);
 }
 for(let i=0;i<22;i++){const x=-12+i*2.4,z=50+(i%3)*.6;scenePerson(scene,b,x,.02,z,i%4?'stand':'walk',.3+i*.5,1.6);}
 // Curved lookout with benches: a second scale cue beside the towering rails.
 b.cylinder(45,.2,-6,6,6,.4,'#adac8d',4,40);
 for(let i=1;i<18;i++){const a=i*TAU/18,x=45+Math.cos(a)*5.6,z=-6+Math.sin(a)*5.6;b.beam([x,.4,z],[x,2,z],.05,P.gold,41,5);}
 for(let i=0;i<48;i++){const a=.24+i*(TAU-.48)/48,q=.24+(i+1)*(TAU-.48)/48;b.beam([45+Math.cos(a)*5.6,2,-6+Math.sin(a)*5.6],[45+Math.cos(q)*5.6,2,-6+Math.sin(q)*5.6],.065,P.gold,41,5);}for(const x of [42,47]){b.box(x,.9,-6,1,.2,3.5,P.wood,22);for(const z of [-7.2,-4.8])b.box(x,.45,z,.7,.9,.12,P.gold,41);}
 // A sculptural crescent over the meteor garden, mounted on its own pedestal.
 b.cylinder(-51,10,-38,.3,.3,19,P.gold,41,12);b.push(-51,26,-38,0,.25,.05);
 for(let i=0;i<70;i++){const a=PI*.30+i*PI*1.40/70,q=PI*.30+(i+1)*PI*1.40/70,p=t=>[Math.cos(t)*6,Math.sin(t)*6,0],inner=t=>[1.6+Math.cos(t)*5.3,Math.sin(t)*5.3,.12];b.quad(p(a),p(q),inner(q),inner(a),P.cream,25);}b.pop();
}
function orreryMovingPart(scene,b,kind,model){
 // Register every uploaded mesh immediately so partial room failures release it.
 scene.movingParts.push({kind,mesh:b.mesh(),model});
}
function orreryCog(b,r,teeth,color){
 // An annular, open-spoked wheel with physical teeth, not a textured disk.
 const hole=r*.72,h=.22,count=teeth*4,point=(i,y,inside=false)=>{const a=i*TAU/count,rr=inside?hole:r+(i%4===1||i%4===2?.16:-.12);return [Math.cos(a)*rr,y,Math.sin(a)*rr];};
 for(let i=0;i<count;i++){
  const j=(i+1)%count,a=point(i,h),q=point(j,h),c=point(j,h,true),d=point(i,h,true);
  b.quad(a,d,c,q,color,41);b.quad(point(i,0),a,q,point(j,0),shade(color,.78),41);
  b.quad(point(i,0,true),point(j,0,true),c,d,color,41);b.quad(point(i,0),point(j,0),point(j,0,true),point(i,0,true),shade(color,.75),41);
 }
 for(let i=0;i<6;i++){const a=i*TAU/6;b.beam([Math.cos(a)*.35,h*.5,Math.sin(a)*.35],[Math.cos(a)*hole,h*.5,Math.sin(a)*hole],.105,color,41,5);}
 b.cylinder(0,.12,0,.48,.48,.28,color,41,16);b.cylinder(0,.31,0,.17,.17,.13,ORRERY.ink,42,10);
}
function orreryClockwork(b,scene){
 const P=ORRERY;
 // Tooth counts and centers match: the smaller wheels counter-rotate at 30/18.
 scene.orreryGears=[{x:6,z:-5,r:3.5,teeth:30,ratio:1},{x:.4,z:-5,r:2.1,teeth:18,ratio:-30/18},{x:11.6,z:-5,r:2.1,teeth:18,ratio:-30/18}];
 for(const [i,g]of scene.orreryGears.entries()){
  b.cylinder(g.x,2.20,g.z,.37,.37,.50,P.gold,41,12);
  const cog=new Builder();orreryCog(cog,g.r,g.teeth,i?P.gold:P.teal);
  orreryMovingPart(scene,cog,'gear',s=>mm(trans(g.x,2.32,g.z),ry((reduceMotion?0:s.trains[0].distance*.12)*g.ratio+(i?PI/g.teeth:0))));
 }
 // Three enameled bearings connect the gear train to the planet's spindle.
 for(const x of [.4,6,11.6]){b.cylinder(x,2.78,-5,.29,.29,.35,P.cream,40,12);b.box(x,2.99,-5,.31,.08,.07,P.ink,42);}
 // A modelmaker's graduated brass ring makes the mechanism feel calibrated.
 for(let i=0;i<48;i++){const a=i*TAU/48,r=i%4?13.85:13.48;b.beam([6+Math.cos(a)*r,2.07,-5+Math.sin(a)*r],[6+Math.cos(a)*14.15,2.07,-5+Math.sin(a)*14.15],.022,P.cream,41,4);}
}
function orreryDispatchClock(b,scene){
 const P=ORRERY,x=-4,y=11.6,z=36.9;
 b.cylinder(x,5.5,z,.15,.15,11,P.gold,41,10);b.cylinder(x,.16,z,.85,.95,.32,P.ink,41,12);
 b.push(x,y,z,0,PI/2);orreryRing(b,0,0,0,2.5,.12,P.gold,41,48,true);b.pop();
 b.cylinder(x,y,z,2.42,2.42,.24,P.ink,40,48,PI/2);
 for(let i=0;i<24;i++){const a=i*TAU/24,r=i%2?2.13:1.94;b.beam([x+Math.sin(a)*r,y+Math.cos(a)*r,z+.17],[x+Math.sin(a)*2.27,y+Math.cos(a)*2.27,z+.17],.035,P.cream,41,5);}
 orreryLetters(b,'COMET',x,y-.9,z+.2,.38);
 const hand=new Builder();hand.beam([0,-.4,0],[0,1.8,0],.065,P.coral,41,6);hand.sphere(0,0,0,.16,.16,.10,P.gold,41,10,6);
 orreryMovingPart(scene,hand,'departure-clock',s=>{const e=s.trains[0].edge,m=e.motionAt(s.trains[0].distance),a=reduceMotion?0:((m.time-e.boarding+e.seconds)%e.seconds)/e.seconds*TAU;return mm(trans(x,y,z+.24),rz(-a));});
}
function orreryBoardingGates(b,scene){
 const P=ORRERY;scene.orreryGates=[];
 for(let i=0;i<5;i++){
  const x=-38+ORRERY_ROUTE.track.stop-i*ORRERY_STOCK.spacing-.8,y=6.8,z=33.35;
  for(const dx of [0,1.6]){b.cylinder(x+dx,y+.58,z,.055,.055,1.16,P.gold,41,7);b.sphere(x+dx,y+1.2,z,.11,.11,.11,P.cream,40,8,5);}
  const gate=new Builder();gate.beam([0,1.05,0],[1.6,1.05,0],.045,P.gold,41,6);gate.beam([0,.25,0],[1.6,.25,0],.035,P.gold,41,6);
  for(const dx of [.30,.65,1,1.35])gate.beam([dx,.25,0],[dx,1.05,0],.025,P.gold,41,5);
  gate.box(.8,.7,.02,.65,.40,.06,P.teal,40);orreryStar(gate,.8,.7,.07,.13,P.cream,41);
  scene.orreryGates.push({x,y,z,width:1.6});
  orreryMovingPart(scene,gate,'boarding-gate',s=>{const r=s.trains[0].edge.motionAt(s.trains[0].distance).restraint;return mm(trans(x,y,z),ry(-(reduceMotion?(r>.5?1:0):r)*PI/2));});
 }
 // Low bench, luggage and paneled platform fascia stay behind the boarding lane.
 for(const x of [-35,-29]){b.box(x,7.38,37.65,3.5,.18,.7,P.wood,22);b.box(x,7.92,37.98,3.5,.75,.13,P.teal,22);for(const dx of [-1.3,1.3])b.box(x+dx,7.05,37.65,.10,.50,.6,P.gold,41);}
 for(let x=-39;x<-8;x+=3.2){b.box(x,3.5,39.1,2.8,4.8,.12,P.ink,22);b.box(x,3.5,39.18,2.35,4.35,.07,'#7a9188',22);}
 orreryDispatchClock(b,scene);
}
function orreryPromenade(b,points,width=2.6){
 const P=ORRERY;
 for(let i=0;i<points.length-1;i++){
  const prev=points[Math.max(0,i-1)],a=points[i],q=points[i+1],next=points[Math.min(points.length-1,i+2)];
  const sample=t=>{const bez=orreryBezier([a[0],.038,a[1]],[a[0]+(q[0]-prev[0])/6,.038,a[1]+(q[1]-prev[1])/6],[q[0]-(next[0]-a[0])/6,.038,q[1]-(next[1]-a[1])/6],[q[0],.038,q[1]],t);return {p:bez.p,r:norm([-bez.f[2],0,bez.f[0]])};};
  for(let j=0;j<18;j++){
   const l=sample(j/18),r=sample((j+1)/18),edge=(s,w,h=0)=>add(add(s.p,mul(s.r,w)),[0,h,0]);
   b.quad(edge(l,width/2),edge(r,width/2),edge(r,-width/2),edge(l,-width/2),'#aaa98e',4);
   for(const side of [-1,1]){const hi=Math.max(side*width/2,side*(width/2-.12)),lo=Math.min(side*width/2,side*(width/2-.12));b.quad(edge(l,hi,.007),edge(r,hi,.007),edge(r,lo,.007),edge(l,lo,.007),P.cream,4);}
  }
 }
}
function orreryPark(b){
 const P=ORRERY;
 // One continuous perimeter walk joins kiosk, stair foot and the eastern lookout.
 orreryPromenade(b,[[-53,29],[-53,38],[-43,48],[-20,49],[8,49],[30,49],[53,35],[55,10],[55,-12],[52,-25]],2.8);
 orreryPromenade(b,[[55,-6],[51,-6],[48,-6]],2.2);
 for(let i=0;i<2;i++)b.box(52-i*.7,.085+i*.10,-6,.8,.17+i*.20,2.4,P.cream,4);
 // An inlaid compass rose fills the quiet space beneath the orbital truss.
 const x=-15,z=-20,r=5.2;orreryRing(b,x,.055,z,r,.045,P.gold,41,48);
 for(let i=0;i<8;i++){const a=i*TAU/8,rr=i%2?r*.65:r-.25;
  b.tri([x,.06,z],[x+Math.cos(a)*rr,.06,z+Math.sin(a)*rr],[x+Math.cos(a-.11)*.6,.06,z+Math.sin(a-.11)*.6],P.cream,41);
  b.tri([x,.06,z],[x+Math.cos(a+.11)*.6,.06,z+Math.sin(a+.11)*.6],[x+Math.cos(a)*rr,.06,z+Math.sin(a)*rr],P.gold,41);
 }
 // Three small planters frame the path without random clutter or track encroachment.
 for(const [x,z]of[[-34,46],[4,46],[52,20]]){
  b.cylinder(x,.34,z,1.45,1.6,.65,P.ink,41,16);orreryRing(b,x,.66,z,1.5,.055,P.gold,41,24);
  for(let i=0;i<7;i++){const a=i*2.4,rr=i?.85:0,xx=x+Math.cos(a)*rr,zz=z+Math.sin(a)*rr;b.sphere(xx,1.15+(i%2)*.16,zz,.48,.55,.48,['#638e79','#87a893','#9db7a0'][i%3],8,7,5);b.sphere(xx,1.72+(i%2)*.16,zz,.1,.13,.10,P.cream,25,6,4);}
 }
}

function buildOrreryRoom(scene,b){
 const P=ORRERY;scene.movingParts=[];
 // Separate the wood, brass trim and enamel top: no coplanar fan triangles.
 orrerySlab(b,126,108,-2.8,5,12,P.wood);orrerySlab(b,126.3,108.3,-.36,.24,12,P.gold,41);orrerySlab(b,125.8,107.8,-.10,.20,12,'#395456',23);
 for(const x of [-47,47])for(const z of [-38,38]){b.box(x,(FLOOR-5)/2,z,5,-5-FLOOR,5,P.wood,22);b.box(x,-21.8,z,5.5,1.0,5.5,P.gold,41);}
 for(const z of [-53.6,53.6])b.box(0,-3,z,72,1.8,.2,P.ink,22);
 orreryLetters(b,'COMET',0,-3.65,53.78,1.4);for(const x of [-18,18])orreryStar(b,x,-2.7,53.85,.65,P.gold,41);
 scene.routes=[ORRERY_ROUTE];scene.trains=[{edge:ORRERY_ROUTE,distance:ORRERY_ROUTE.boarding*ORRERY_ROUTE.normalDrive,speed:1,type:'mountain',cars:4,stock:'orrery'}];
 scene.height=(x,z)=>Math.abs(x)<62&&Math.abs(z)<53?0:FLOOR;
 scene.canPlace=()=>false;
 orreryRailway(b,scene);orreryPlanet(b);orreryStation(b,scene);orreryLandscape(b,scene);orreryPark(b);
 // A mobile moon and its counterweight turn on an actual brass arm. One cached
 // mesh, owned by movingParts; pause freezes it and reduced-motion parks it.
 const mobile=new Builder();mobile.beam([0,0,0],[14,0,0],.08,P.gold,41,6);mobile.sphere(14,0,0,1.55,1.55,1.55,'#d5d1b5',4,18,12);mobile.sphere(-4,0,0,.7,.7,.7,P.gold,41,12,8);mobile.beam([-4,0,0],[0,0,0],.08,P.gold,41,6);
 b.cylinder(6,30,-5,.10,.10,7,P.gold,41,10);
 orreryMovingPart(scene,mobile,'mobile-moon',s=>mm(trans(6,33.5,-5),ry(reduceMotion?0:s.trains[0].distance*.025)));
 orreryClockwork(b,scene);orreryBoardingGates(b,scene);
 scene.spots=[
  {name:'The whole constellation',detail:'A clockmaker’s impossible amusement park.',target:[0,12,0],distance:158,phoneDistance:420,yaw:.35,pitch:.50},
  {name:'At the edge of the universe',detail:'The slow climb before the stardrop.',target:[23,28,-24],distance:56,phoneDistance:86,yaw:1.0,pitch:.22},
  {name:'The lunar loop',detail:'A complete inversion, held inside twin brass orbital trusses.',target:[-37,15,-11],distance:50,phoneDistance:100,yaw:-1.03,pitch:.26},
  {name:'A ringed world',detail:'Hand-turned brass, painted cloud belts and an orbiting moon.',target:[6,21,-5],distance:52,phoneDistance:81,yaw:.42,pitch:.3},
  {name:'Platform zero',detail:'Board the Comet. Five open cars, one extraordinary little journey.',target:[-25,9,33],distance:33,phoneDistance:52,yaw:.10,pitch:.28},
  {name:'Under the comet',detail:'The low return sweeps beneath the departure line.',target:[27,6,26],distance:48,phoneDistance:73,yaw:1.0,pitch:.28},
  {name:'The clockwork heart',detail:'Three open-spoked gears drive the little universe. Watch them counter-rotate.',target:[5,3.3,-5],distance:24,phoneDistance:43,yaw:-.40,pitch:.55}
 ];
}
registerHouseRoom('orrery',{
 name:'The Orrery',layout:'Comet — the celestial coaster',tag:'A LITTLE ESCAPE FROM GRAVITY',description:'A clockmaker’s impossible amusement park. Climb into the stars, fall through a lunar loop, and orbit a ringed world in five tiny open cars.',
 color:'#7eaaa6',ambient:'workshop',target:[0,11,0],distance:163,phoneDistance:420,pitch:.50,yaw:.35,
 trainCollection:false,train:{name:'Comet',number:'01',service:'Platform zero · The Orrery',type:'celestial rollercoaster',power:'electric'},
 credits:[{name:'nickfromlater',platform:'github',handle:'nickfromlater',note:'Original celestial rollercoaster, native miniature geometry, Comet stock and room, with agent assistance. No external assets.'}],
 map:{plot:'east-6',scale:.4,footprint:[158,130],focus:[0,11,0]},
 lights:[[-46,40,-43],[46,40,-43],[-46,33,45],[46,33,45],[-40,5,61],[40,5,61]],
 layoutLights:[[-24,12,38],[45,8,-6],[-51,27,-38],[6,35,-5]],build:buildOrreryRoom,shell:orreryShell
});
