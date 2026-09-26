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
const ORRERY_GLYPHS={A:'06 61 23',B:'04 45 53 31 10 13',C:'54 40 01',D:'04 45 51 10',E:'54 40 01 23',F:'54 40 23',G:'54 40 01 13 32',H:'04 15 23',I:'45 67 01',L:'40 01',M:'04 48 85 51',N:'04 41 15',O:'04 45 51 10',P:'04 45 53 32',R:'04 45 53 32 21',S:'54 42 23 31 10',T:'45 67',U:'40 01 15',V:'47 75',W:'40 08 81 15',Y:'48 58 87',Z:'45 50 01',K:'04 52 21',Q:'04 45 51 10 81',X:'41 05',0:'04 45 51 10',1:'63 37'};
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
   w.quad([x-r,y,.61],[x,y+r*1.4,.61],[x+r,y,.61],[x,y-r*1.4,.61],i%3?'#b8c7ba':'#e7c999',25);
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
  orreryScenicShell(w,which,width);w.pop();walls.push({which,mesh:w.mesh()});
 }
 // Clockmaker's cabinets and small objects are outside the miniature's board.
 for(const x of [-66,66]){
  b.box(x,-16,0,10,16,70,P.wood,22);b.box(x,-7.7,0,10.8,.8,71,P.gold,22);
  for(let z=-29;z<35;z+=12){b.box(x+(x<0?5.1:-5.1),-15,z,.2,12,9,'#35494b',22);b.cylinder(x+(x<0?5.35:-5.35),-13,z,.3,.3,.2,P.gold,41,8,0,PI/2);}
  for(const z of [-24,24]){b.push(x,-7.2,z);orreryRing(b,0,3,0,2.6,.06,P.gold,41,24,true);b.cylinder(0,1,0,.1,.1,2,P.gold,41,8);b.cylinder(0,.1,0,2.6,2.8,.2,P.ink,41,16);b.pop();}
 }
 return walls;
}
// Adaptive longitudinal rails retain the eight-sided cross section and exact
// route. Saved vertices buy authored scenery, not a larger room budget.
function orreryRailSamples(track){
 const out=[],offsets=[[-.62,0],[.62,0],[0,-.81],[0,.10]],point=(q,p)=>add(add(q.p,mul(q.r,p[0])),mul(q.u,p[1]));
 function split(a,b,depth=0){
  let error=0;for(const t of [.25,.5,.75]){const q=track.at(mix(a.distance,b.distance,t));for(const p of offsets)error=Math.max(error,len(sub(point(q,p),lerpV(point(a,p),point(b,p),t))));}
  if((error>.0075||b.distance-a.distance>4||dot(a.f,b.f)<.9985)&&depth<16){const distance=(a.distance+b.distance)/2,q={...track.at(distance),distance};split(a,q,depth+1);split(q,b,depth+1);}else out.push(b);
 }
 out.push({...track.at(0),distance:0});
 for(const section of track.sections){const a=out[out.length-1],b={...track.at(section.end),distance:section.end};split(a,b);}
 return out;
}
function orreryTube(b,samples,offset,vertical,radius,color){
 const sides=8;
 for(let i=0;i<samples.length-1;i++){
  const a=samples[i],q=samples[i+1];
  const point=(f,t)=>add(add(f.p,mul(f.r,offset+Math.cos(t)*radius)),mul(f.u,vertical+Math.sin(t)*radius));
  for(let k=0;k<sides;k++){const t=k*TAU/sides,v=(k+1)*TAU/sides;
   b.quad(point(a,t),point(q,t),point(q,v),point(a,v),typeof color==='function'?color(a):color,41);
  }
 }
}
function orreryBuriedRod(b,a,c,r,color,sides=5){
 // Both ends terminate inside a larger joint or footing. End-cap fans would
 // never be visible. Keep the round side silhouette and analytic normals.
 const h=len(sub(c,a))/2;b.matrix(basis(mul(add(a,c),.5),sub(c,a)));
 for(let i=0;i<sides;i++){
  const t=i*TAU/sides,u=(i+1)*TAU/sides,n=[Math.cos(t),Math.sin(t),0],m=[Math.cos(u),Math.sin(u),0],A=[n[0]*r,n[1]*r,-h],B=[m[0]*r,m[1]*r,-h],C=[m[0]*r,m[1]*r,h],D=[n[0]*r,n[1]*r,h];
  b.tri(A,B,C,color,41,[n,m,m]);b.tri(A,C,D,color,41,[n,m,n]);
 }
 b.pop();
}
function orreryRailway(b,scene){
 const P=ORRERY,track=ORRERY_ROUTE.track,samples=orreryRailSamples(track);scene.orreryRailSegments=samples.length-1;
 orreryTube(b,samples,-.52,0,.10,P.cream);orreryTube(b,samples,.52,0,.10,P.cream);
 orreryTube(b,samples,0,-.58,.23,q=>q.section===5?P.coral:P.teal);
 for(let s=0;s<track.length;s+=1.12){const q=track.at(s);b.matrix(orreryMatrix(q));b.box(0,-.17,0,1.2,.15,.15,P.gold,41);orreryBuriedRod(b,[-.48,-.17,0],[0,-.58,0],.045,P.gold);orreryBuriedRod(b,[.48,-.17,0],[0,-.58,0],.045,P.gold);b.pop();}
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
   if(clear(foot,top)){orreryBuriedRod(b,foot,top,.21,'#658c89',6);b.cylinder(foot[0],.21,foot[2],.85,.68,.42,'#b4ab8b',4,8);scene.orrerySupports.push({a:foot,b:top});}
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
 b.box(-24,13.4,39.15,16,1.6,.25,P.ink,22);orreryLetters(b,'COMET',-24,12.9,39.34,1.05);
 for(const x of [-37,-32,-27,-22,-17,-12]){b.cylinder(x,11.7,38.8,.16,.16,.23,P.cream,25,8);scenePerson(scene,b,x,6.78,36.6,'stand',PI,1.7);}
 for(let i=0;i<12;i++)b.box(-44-i*.6,6.45-i*.53,36.1,1.15,.48,4.4,P.cream,4);
 for(const z of [34.1,38.1])b.beam([-43,8,z],[-51,.95,z],.065,P.gold,41,6);
 // Ticket kiosk, scalloped roof and brass clock.
 b.box(-53,2.5,26,5,5,5,P.teal,22);b.box(-53,1.35,28.55,3,1.5,.10,P.ink,0);b.box(-53,.72,29,4,.22,1.1,P.gold,22);b.cylinder(-53,5.4,26,4,0,2.5,P.cream,23,6);b.sphere(-53,6.82,26,.25,.25,.25,P.gold,41,8,6);
 for(let i=0;i<4;i++){b.cylinder(-53+i*2,1.1,30.8,.06,.06,2.2,P.gold,41,6);if(i<3)b.beam([-53+i*2,1.8,30.8],[-51+i*2,1.8,30.8],.05,P.coral,23,6);}
}
function orreryLandscape(b,scene){
 const P=ORRERY;
 // Promenades, lunar gardens and hand-chiselled meteor fragments.
 for(const [x,z,r]of[[-50,-38,8],[47,-34,9],[45,43,6]]){
  b.cylinder(x,.12,z,r,r,.24,'#7b9588',3,40);orreryRing(b,x,.25,z,r-.3,.10,P.gold,41,48);
  for(let i=0;i<12;i++){const a=i*2.4,rr=1+hash(i,x)*r*.7,xx=x+Math.cos(a)*rr,zz=z+Math.sin(a)*rr,h=.3+hash(i,z)*1.7;b.sphere(xx,h*.42,zz,h*.68,h*.55,h*.50,i%2?'#819b94':'#b5bda4',4,7,4,true);}
 }
 for(const [x,z]of[[52,11],[53,1],[-50,8],[-53,17],[1,49],[18,49],[45,-47]]){
  b.cylinder(x,2,z,.07,.07,4,P.gold,41,8);b.sphere(x,4.05,z,.35,.45,.35,P.cream,25,10,7);b.cylinder(x,4.53,z,.50,0,.42,P.ink,41,10);b.cylinder(x,.1,z,.36,.46,.2,P.ink,41,10);
 }
 orreryScenicVisitors(scene,b);
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
 for(const x of [-35,-29]){b.box(x,7.10,37.65,3.5,.18,.7,P.wood,22);b.box(x,7.45,37.98,3.5,.55,.13,P.teal,22);for(const dx of [-1.3,1.3])b.box(x+dx,6.98,37.65,.10,.35,.6,P.gold,41);}
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
 orreryRailway(b,scene);orreryPlanet(b);orreryStation(b,scene);orreryLandscape(b,scene);orreryPark(b);orreryScenicRoom(scene,b);
 // A mobile moon and its counterweight turn on an actual brass arm. One cached
 // mesh, owned by movingParts; pause freezes it and reduced-motion parks it.
 const mobile=new Builder();mobile.beam([0,0,0],[14,0,0],.08,P.gold,41,6);mobile.sphere(14,0,0,1.55,1.55,1.55,'#d5d1b5',4,18,12);mobile.sphere(-4,0,0,.7,.7,.7,P.gold,41,12,8);mobile.beam([-4,0,0],[0,0,0],.08,P.gold,41,6);
 b.cylinder(6,30,-5,.10,.10,7,P.gold,41,10);
 orreryMovingPart(scene,mobile,'mobile-moon',s=>mm(trans(6,33.5,-5),ry(reduceMotion?0:s.trains[0].distance*.025)));
 orreryClockwork(b,scene);orreryBoardingGates(b,scene);orreryScenicMechanisms(scene,b);
 scene.spots=[
  {name:'The whole constellation',detail:'A clockmaker’s impossible amusement park.',target:[0,12,0],distance:158,phoneDistance:420,yaw:.35,pitch:.50},
  {name:'At the edge of the universe',detail:'The slow climb before the stardrop.',target:[23,28,-24],distance:56,phoneDistance:86,yaw:1.0,pitch:.22},
  {name:'The lunar loop',detail:'A complete inversion, held inside twin brass orbital trusses.',target:[-37,15,-11],distance:50,phoneDistance:100,yaw:-1.03,pitch:.26},
  {name:'A ringed world',detail:'Hand-turned brass, painted cloud belts and an orbiting moon.',target:[6,21,-5],distance:52,phoneDistance:81,yaw:.42,pitch:.3},
  {name:'Platform zero',detail:'Board the Comet. Five open cars, one extraordinary little journey.',target:[-30,8,36],distance:56,phoneDistance:166,yaw:.18,pitch:.47},
  {name:'Under the comet',detail:'The low return sweeps beneath the departure line.',target:[27,6,26],distance:48,phoneDistance:73,yaw:1.0,pitch:.28},
  {name:'The clockwork heart',detail:'Three open-spoked gears drive the little universe. Watch them counter-rotate.',target:[5,3.3,-5],distance:24,phoneDistance:43,yaw:-.40,pitch:.55},
  {name:'The Stardust Gallery',detail:'A brass-ribbed star passage, lit from within. The Comet slips through its open constellation.',target:scene.orreryTunnelTarget,distance:38,phoneDistance:66,yaw:1.12,pitch:.35},
  {name:'Moonwatch pavilion',detail:'A copper-domed observatory, open telescope slit and a garden balcony above the lunar court.',target:scene.orreryMoonwatch.target,distance:40,phoneDistance:64,yaw:-.40,pitch:.35}
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

// Authored pleasure-garden details for The Orrery. Everything here is native
// geometry, batched at room construction. No timers, images or extra renderer.
function orreryFeature(scene,b,name,build){
 const first=b.data.length/12;build();
 (scene.orreryScenicRanges||(scene.orreryScenicRanges=[])).push({name,first,count:b.data.length/12-first});
}
function orreryHoop(b,r,t,color=ORRERY.gold,mat=41,segments=48){
 // Continuous square-section metal, without a pair of hidden end caps per link.
 const p=(a,k)=>[Math.cos(a)*(r+(k===0||k===3?-t:t)),k<2?-t:t,Math.sin(a)*(r+(k===0||k===3?-t:t))];
 for(let i=0;i<segments;i++)for(let k=0;k<4;k++)b.quad(p(i*TAU/segments,k),p((i+1)*TAU/segments,k),p((i+1)*TAU/segments,(k+1)%4),p(i*TAU/segments,(k+1)%4),color,mat);
}
function orreryDome(b,r,h,color,segments=32,rows=8,slit=false){
 const point=(a,t)=>[Math.cos(a)*Math.cos(t)*r,Math.sin(t)*h,Math.sin(a)*Math.cos(t)*r];
 const normal=(a,t)=>norm([Math.cos(a)*Math.cos(t)/r,Math.sin(t)/h,Math.sin(a)*Math.cos(t)/r]);
 for(let j=0;j<rows;j++)for(let i=0;i<segments;i++){
  if(slit&&i>=segments/4-1&&i<=segments/4)continue;
  const a=i*TAU/segments,c=(i+1)*TAU/segments,t=j*PI/(2*rows),u=(j+1)*PI/(2*rows),A=point(a,t),B=point(c,t),C=point(c,u),D=point(a,u),n=[normal(a,t),normal(c,t),normal(c,u),normal(a,u)];
  b.tri(A,D,C,color,41,[n[0],n[3],n[2]]);b.tri(A,C,B,color,41,[n[0],n[2],n[1]]);
 }
 for(let i=0;i<segments;i+=4){const a=i*TAU/segments;for(let j=0;j<rows;j++)b.beam(point(a,j*PI/(2*rows)),point(a,(j+1)*PI/(2*rows)),.035,ORRERY.gold,41,4);}
}
function orreryFence(b,points,y,height=1.3){
 for(let i=0;i<points.length-1;i++){
  const a=points[i],q=points[i+1],length=Math.hypot(q[0]-a[0],q[1]-a[1]),count=Math.max(1,Math.ceil(length/1.8));
  for(const h of [.35,height])b.beam([a[0],y+h,a[1]],[q[0],y+h,q[1]],h===height?.045:.025,ORRERY.gold,41,5);
  for(let j=0;j<count;j++){const t=j/count,x=mix(a[0],q[0],t),z=mix(a[1],q[1],t);b.box(x,y+height/2,z,.075,height,.075,ORRERY.ink,41);b.cylinder(x,y+height+.07,z,.11,0,.14,ORRERY.gold,41,6);}
 }
 const q=points[points.length-1];b.box(q[0],y+height/2,q[1],.075,height,.075,ORRERY.ink,41);
}
function orrerySignboard(b,text,x,y,z,width=4,angle=0){
 b.push(x,y,z,0,angle);for(const side of [-1,1]){b.box(side*(width/2-.25),1.05,0,.13,2.1,.15,ORRERY.gold,41);b.box(side*(width/2-.25),.10,0,.65,.20,.7,ORRERY.cream,4);}
 b.box(0,1.65,0,width,1.15,.20,ORRERY.ink,22);b.box(0,1.65,.115,width-.16,.97,.035,ORRERY.teal,40);
 orreryLetters(b,text,0,1.55,.15,Math.min(.38,(width-.5)/(text.length*.85)),ORRERY.cream);
 b.beam([-width*.36,1.36,.15],[width*.36,1.36,.15],.013,ORRERY.gold,41,4);b.pop();
}
function orreryLantern(b,x,y,z,height=3.5){
 const P=ORRERY;b.cylinder(x,y+.12,z,.42,.33,.24,P.ink,41,8);b.cylinder(x,y+height/2,z,.075,.045,height,P.gold,41,7);
 b.cylinder(x,y+height+.32,z,.24,.29,.62,P.cream,25,6);b.cylinder(x,y+height+.71,z,.48,0,.40,P.ink,41,6);
 for(const dx of [-.28,.28])b.box(x+dx,y+height+.31,z,.035,.68,.035,P.gold,41);
 b.cylinder(x,y+height-.04,z,.37,.37,.08,P.gold,41,8);
}
function orreryBench(b,x,y,z,angle=0){
 b.push(x,y,z,0,angle);
 for(let i=0;i<4;i++){b.box(0,.30,-.30+i*.20,2.9,.10,.15,ORRERY.wood,22);b.box(0,.49+i*.10,-.39,2.9,.075,.10,ORRERY.teal,22);}
 for(const side of [-1,1]){b.box(side*1.13,.14,0,.12,.28,.66,ORRERY.gold,41);b.beam([side*1.28,.47,-.35],[side*1.28,.47,.34],.045,ORRERY.gold,41,5);b.box(side*1.28,.40,.29,.06,.18,.06,ORRERY.gold,41);}b.pop();
}
function orreryTopiary(b,x,y,z,h=3,variant=0){
 const P=ORRERY;b.cylinder(x,y+.32,z,.65,.76,.64,variant%2?P.coral:P.ink,4,8);b.cylinder(x,y+h*.44,z,.09,.065,h*.8,P.wood,22,6);
 const colors=['#44695b','#63836b','#78957b'];
 for(let i=0;i<3;i++)b.sphere(x+Math.sin(i*2.4+variant)*.19,y+h*(.52+i*.19),z+Math.cos(i*2.4+variant)*.16,h*(.30-i*.06),h*.25,h*(.29-i*.055),colors[(i+variant)%3],23,8,5,true);
 b.cylinder(x,y+.67,z,.78,.78,.08,P.gold,41,8);
}
function orreryFlowerBed(b,x,z,w,d,angle=0){
 const P=ORRERY;b.push(x,0,z,0,angle);b.box(0,.22,0,w,.44,d,P.cream,4);b.box(0,.45,0,w-.20,.09,d-.2,'#625744',3);
 // Staggered painted clumps and flower heads, not an unseeded particle field.
 const nx=Math.max(2,Math.floor(w/.95)),nz=Math.max(1,Math.floor(d/.8));
 for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){
  const xx=-w/2+.52+i*(w-1.04)/Math.max(1,nx-1),zz=nz===1?0:-d/2+.45+j*(d-.9)/Math.max(1,nz-1),h=.50+((i+j)%3)*.10;
  b.sphere(xx,.55+h*.35,zz,.43,h,.36,(i+j)%2?'#648574':'#819c7d',23,6,4,true);
  for(let k=0;k<3;k++){const a=k*TAU/3;orreryStar(b,xx+Math.cos(a)*.20,.62+h,zz+Math.sin(a)*.18,.11,(i+j)%3===0?P.coral:P.cream,23);}
 }
 b.pop();
}
function orreryTelescope(b,x,y,z,angle=0,scale=1){
 const P=ORRERY;b.push(x,y,z,0,angle,0,scale);
 for(let i=0;i<3;i++){const a=i*TAU/3;b.beam([0,1.55,0],[Math.cos(a)*.75,.06,Math.sin(a)*.75],.045,P.wood,22,5);}
 b.cylinder(0,1.7,0,.19,.19,.38,P.gold,41,8);
 const a=[0,1.58,-.78],q=[0,2.36,1.32];b.beam(a,q,.20,P.teal,41,12);b.beam([0,2.23,.99],q,.24,P.gold,41,12);b.beam(q,[0,2.40,1.42],.185,'#173e4a',43,12);b.beam(a,[0,1.52,-.96],.075,P.ink,41,8);b.pop();
}
function orreryQueueAndStation(b,scene){
 const P=ORRERY;
 // A ticket court has an open, continuous switchback from the entry arch to
 // the existing western stair. The reverse side of the station stays open.
 b.box(-27,.09,42.15,29,.18,5.8,'#b5b39b',4);
 for(let x=-40;x<-13;x+=1.1)for(let z=39.6;z<45;z+=1.05)if((Math.round(x/1.1)+Math.round(z/1.05))%2===0)b.box(x,.187,z,.98,.014,.94,'#c8c4a7',4);
 orreryFence(b,[[-39,40],[-14,40],[-14,44.65],[-37,44.65]],.20,.78);
 orreryFence(b,[[-17,41.6],[-38,41.6],[-38,43.1],[-17,43.1]],.20,.78);
 orreryPromenade(b,[[-38,44.9],[-43,44.8],[-48,42],[-52,39],[-51,36]],2.1);
 // Coral enamel and pierced brass break up the long green station facade.
 for(let x=-39;x<=-9;x+=5){
  b.box(x,3.6,39.26,.32,5.9,.28,P.cream,4);b.box(x,6.25,39.37,.7,.25,.47,P.gold,41);b.box(x,.50,39.33,.6,.55,.48,P.cream,4);
  b.box(x+1.3,4.1,39.28,1.8,2.3,.12,P.coral,22);b.box(x+1.3,4.1,39.36,1.45,1.95,.08,P.ink,40);orreryStar(b,x+1.3,4.25,39.43,.36,P.gold,41);
 }
 for(const x of [-39,-33,-15,-8]){
  b.beam([x,9.4,38.1],[x+1.3,12.15,38.1],.065,P.gold,41,5);b.beam([x,9.4,34.1],[x+1.3,12.15,34.1],.065,P.gold,41,5);
  for(let i=0;i<12;i++){const a=i*PI/12,q=(i+1)*PI/12;b.beam([x,12.25+Math.sin(a)*1.64,36.4+Math.cos(a)*2.73],[x,12.25+Math.sin(q)*1.64,36.4+Math.cos(q)*2.73],.045,P.gold,41,4);}
 }
 for(const x of [-40,-8]){b.cylinder(x,14.2,36.4,.09,.06,1.9,P.gold,41,6);orreryStar(b,x,15.35,36.4,.45,P.gold,41);}
 // An octagonal copper clock cupola makes the station a second skyline anchor.
 b.push(-24,13.8,36.4);b.cylinder(0,.10,0,2.2,2.2,.25,P.gold,41,8);b.cylinder(0,1.45,0,1.65,1.65,2.7,P.coral,22,8);
 for(let i=0;i<8;i++){const a=i*TAU/8;b.box(Math.cos(a)*1.64,1.4,Math.sin(a)*1.64,.12,2.65,.12,P.gold,41);}
 b.cylinder(0,2.85,0,2.0,2.0,.22,P.gold,41,16);b.push(0,3,0);orreryDome(b,2.0,2.1,'#749d8f',24,6);b.pop();
 b.cylinder(0,5.35,0,.09,.03,1.0,P.gold,41,8);orreryStar(b,0,6.2,0,.62,P.cream,41);
 b.cylinder(0,1.65,1.73,.82,.82,.12,P.cream,40,24,PI/2);
 for(let i=0;i<12;i++){const a=i*TAU/12;b.beam([Math.sin(a)*.60,1.65+Math.cos(a)*.60,1.82],[Math.sin(a)*.73,1.65+Math.cos(a)*.73,1.82],.023,P.ink,41,4);}
 b.beam([0,1.65,1.85],[.36,1.94,1.85],.035,P.ink,41,5);b.beam([0,1.65,1.85],[-.10,2.25,1.85],.026,P.ink,41,5);b.pop();
 // The queue's front door faces the arrival promenade, not a blank fence.
 b.push(-44,0,43,0,-.2);
 for(const side of [-1,1]){b.box(side*3,2.55,0,.45,5.1,.6,P.coral,22);b.box(side*3,.25,0,.85,.5,.95,P.cream,4);b.cylinder(side*3,5.3,0,.26,0,.45,P.gold,41,6);}
 for(let i=0;i<20;i++){const a=i*PI/20,q=(i+1)*PI/20;b.beam([Math.cos(a)*3,4.6+Math.sin(a)*1.2,0],[Math.cos(q)*3,4.6+Math.sin(q)*1.2,0],.12,P.gold,41,5);}
 b.box(0,4.65,0,5.8,1.05,.20,P.ink,22);orreryLetters(b,'COMET',0,4.4,.14,.53,P.cream);orreryStar(b,0,6.2,0,.58,P.gold,41);b.pop();
 // Small things with a job: dispatch console, ticket punch, timetable, luggage.
 b.box(-9.2,7.125,37.4,1.8,.65,1.3,P.ink,22);b.push(-9.2,7.48,37.4,.20);b.box(0,0,0,1.95,.12,1.4,P.gold,41);
 for(let i=0;i<3;i++){b.cylinder(-.55+i*.48,.08,0,.14,.14,.04,i===2?P.coral:P.cream,40,10);b.beam([-.55+i*.48,.13,0],[-.50+i*.48,.13,.08],.012,P.ink,41,4);}b.pop();
 for(const x of [-52.9,-52.1]){b.box(x,.86,29,.46,.11,.36,P.cream,23);b.box(x,.93,29,.32,.025,.02,P.coral,23);}
 b.box(-54.2,.92,29,.36,.18,.42,P.ink,41);b.beam([-54.2,.97,29],[-54.2,1.31,28.92],.04,P.gold,41,5);
 orrerySignboard(b,'ADMIT ONE',-56.3,0,31,3.8,-.28);
 orrerySignboard(b,'DEPARTURES',-11.1,6.79,35.6,2.7,PI/2);
 for(const [x,z]of [[-48,40],[-12.5,44.5]])orreryLantern(b,x,0,z,3.4);
 for(const [x,z,s]of [[-36,37.2,3],[-33.8,37.5,2.5]])littleCase(b,x,6.8,z,s,P.coral,.14);
 orreryFlowerBed(b,-25,46.4,10,1.05);orreryFlowerBed(b,-6.2,41,1.8,4.8);
}
function orreryScenicRodClear(a,c,r=.20){
 const d=sub(c,a),dd=dot(d,d);
 for(let s=0;s<ORRERY_ROUTE.track.length;s+=.5){
  const q=ORRERY_ROUTE.track.at(s),v=add(a,mul(d,clamp(dot(sub(q.p,a),d)/dd))),local=sub(v,q.p);
  if(Math.abs(dot(local,q.f))<1.95+r&&Math.abs(dot(local,q.r))<1.1+r&&dot(local,q.u)>-.4-r&&dot(local,q.u)<2.3+r)return false;
 }
 return true;
}
function orreryStarTunnel(b,scene){
 const P=ORRERY,track=ORRERY_ROUTE.track,start=54,end=79,radius=2.95;
 scene.orreryTunnel={start,end,radius};
 // Open ends and a continuous minimum bore. Roof panels occupy only alternating
 // sectors, so the front-seat compression still lets the miniature show through.
 const point=(s,a,r=radius)=>{const q=track.at(s);return add(add(q.p,mul(q.r,Math.cos(a)*r)),mul(q.u,.68+Math.sin(a)*r));};
 for(let rib=0;rib<=12;rib++){
  const s=mix(start,end,rib/12);
  for(let k=0;k<20;k++){const a=-.30+k*(PI+.60)/20,c=-.30+(k+1)*(PI+.60)/20;b.beam(point(s,a),point(s,c),rib===0||rib===12?.14:.075,P.gold,41,5);}
  if(rib%3===0)for(const side of [-1,1]){
   const top=point(s,side===1?0:PI),q=track.at(s);
   for(const spread of [0,2,4,6]){const foot=[top[0]+q.r[0]*side*spread,.25,top[2]+q.r[2]*side*spread];if(!orreryScenicRodClear(foot,top))continue;b.beam(foot,top,.13,P.teal,41,6);b.cylinder(...foot,.46,.62,.30,P.cream,4,8);break;}
  }
 }
 for(let i=0;i<24;i++)for(let k=0;k<10;k++){
  const s=mix(start,end,i/24),t=mix(start,end,(i+1)/24),a=k*PI/10,c=(k+1)*PI/10;
  if(k<2||k>7||k===4||k===5)b.quad(point(s,a,radius+.06),point(t,a,radius+.06),point(t,c,radius+.06),point(s,c,radius+.06),(k===4||k===5)?P.coral:P.ink,22);
 }
 // Two ten-point star silhouettes frame the ends, with a strictly larger bore.
 for(const s of [start-.18,end+.18]){
  const q=track.at(s);b.matrix(orreryMatrix(q));
  for(let i=0;i<10;i++){const a=PI/2+i*TAU/10,c=PI/2+(i+1)*TAU/10,r=i%2?3.65:4.45,rr=(i+1)%2?3.65:4.45;
   b.beam([Math.cos(a)*r,.68+Math.sin(a)*r,0],[Math.cos(c)*rr,.68+Math.sin(c)*rr,0],.13,P.gold,41,6);
  }
  b.pop();
 }
 // Small luminous star windows run along the high roof spine, above the rider.
 for(let i=0;i<7;i++){const q=track.at(mix(start+1,end-1,i/6));b.matrix(orreryMatrix(q));orreryStar(b,0,4.2,0,.33,P.cream,25);b.pop();}
 const middle=track.at((start+end)/2);scene.orreryTunnelTarget=add(middle.p,[0,1.5,0]);
}
function orreryLunarCourt(b){
 const P=ORRERY,x=-37,z=-10;
 // Pearl-stone water court under the inversion, below its complete train sweep.
 b.cylinder(x,.14,z,8.9,8.9,.28,P.cream,4,48);b.cylinder(x,.31,z,7.95,7.95,.12,'#607e7e',4,48);
 b.cylinder(x,.39,z,7.45,7.45,.09,'#295862',40,48);b.push(x,.50,z);orreryHoop(b,7.88,.14,P.gold,41,48);b.pop();
 for(const r of [2.5,4.4,6.2]){b.push(x,.45,z);orreryHoop(b,r,.018,'#7baba9',40,48);b.pop();}
 b.cylinder(x,.75,z,1.8,1.15,.72,P.cream,4,12);b.sphere(x,1.30,z,.8,.8,.8,P.gold,41,16,10);
 for(let i=0;i<8;i++){const a=i*TAU/8;orreryStar(b,x+Math.cos(a)*8.4,.55,z+Math.sin(a)*8.4,.20,P.gold,41);}
 orreryPromenade(b,[[-52,17],[-49,5],[-48,-9],[-48,-23],[-44,-29]],2.5);
 orreryBench(b,-49,0,-3,PI/2);orrerySignboard(b,'LUNAR COURT',-48,0,11,4.3,.4);
 for(const z of [-17,4])orreryLantern(b,-49,0,z,3.8);
 for(const [xx,zz]of [[-45,-26],[-48,0],[-27,-20],[-26,-3]])orreryTopiary(b,xx,0,zz,2.8,Math.abs(Math.round(zz))%3);
 // Moon gate: a real pass-through on the approach, not decoration on the rails.
 const q=ORRERY_ROUTE.track.sections[4].sample(.60);
 for(const side of [-1,1]){const top=add(add(q.p,mul(q.r,side*3.3)),mul(q.u,3)),foot=[top[0],.18,top[2]];b.beam(foot,top,.20,P.coral,41,4);b.cylinder(...foot,.55,.42,.36,P.cream,4,8);}
 b.matrix(orreryMatrix(q));for(const side of [-1,1])b.box(side*3.3,3,0,.68,.32,.65,P.gold,41);
 b.box(0,3.25,0,7.2,.34,.50,P.gold,41);orreryLetters(b,'LUNA',0,3.63,0,.45,P.cream);orreryStar(b,0,4.65,0,.55,P.gold,41);b.pop();
}
function orreryMoonwatch(b,scene){
 const P=ORRERY,x=-13,z=-42;
 b.push(x,0,z);
 b.cylinder(0,.28,0,8.0,8.0,.56,P.cream,4,8);b.cylinder(0,.66,0,6.5,6.5,.24,P.gold,41,8);
 // Eight masonry piers and recessed window bays surround a paneled entry.
 for(let i=0;i<8;i++){
  const a=i*TAU/8;b.push(0,0,0,0,a);b.box(-2.14,4,5.18,.50,6.7,.55,P.cream,4);
  if(i!==0){b.box(0,3.8,5.28,3.85,5.8,.40,'#c6c7ae',4);b.box(0,4.5,5.51,2.5,3.6,.08,P.ink,40);b.box(0,4.5,5.58,.07,3.6,.05,P.gold,41);b.box(0,4.5,5.58,2.5,.065,.05,P.gold,41);}
  else{b.box(0,6.5,5.18,4.1,1.6,.5,P.cream,4);b.box(0,2.0,5.20,2.7,2.8,.14,P.ink,22);b.box(0,2.0,5.31,2.35,2.47,.05,P.teal,22);orreryLetters(b,'MOONWATCH',0,6.1,5.51,.46,P.ink);}
  b.box(0,7.2,5.22,4.5,.24,.7,P.gold,41);b.pop();
 }
 b.cylinder(0,7.4,0,5.9,5.9,.35,P.ink,41,32);b.push(0,7.6,0);orreryDome(b,5.85,4.3,'#769c8c',32,8,true);b.pop();
 b.cylinder(0,12.2,0,.12,.07,1,P.gold,41,8);orreryStar(b,0,13.2,0,.63,P.gold,41);
 // Balcony and steps stay outside the drop's footprint; the slit is real depth.
 const rail=[];for(let i=0;i<=16;i++){const a=.34+i*(TAU-.68)/16;rail.push([Math.sin(a)*7.35,Math.cos(a)*7.35]);}orreryFence(b,rail,.58,.80);
 b.cylinder(0,7.22,0,4.8,4.8,.16,P.ink,22,16);b.cylinder(0,3.7,0,.32,.32,7.4,P.gold,41,10);orreryTelescope(b,0,7.3,1.3,0,1.2);
 for(let i=0;i<3;i++)b.box(0,.12+i*.19,8.25-i*.48,2.65,.24+i*.38,.75,P.cream,4);b.pop();
 orreryPromenade(b,[[-44,-29],[-32,-34],[-20,-33],[-13,-33],[-4,-36],[14,-41],[35,-44],[53,-25]],2.6);
 orrerySignboard(b,'MOONWATCH',-23,0,-34,5,-.4);
 for(const [xx,zz,h]of [[-23,-46,4],[-4,-45,4.5],[20,-43,4.2],[31,-42,3.6]])orreryTopiary(b,xx,0,zz,h,Math.abs(xx)%3);
 orreryFlowerBed(b,10,-42,8,2);orreryFlowerBed(b,-25,-38,2,5,-.18);
 scene.orreryMoonwatch={target:[x,6,z],entrance:[x,0,z+8.5]};
}
function orreryGardenFurniture(b){
 const P=ORRERY;
 for(const [x,z,h,v]of [[54,25,4,1],[50,18,5,0],[54,-19,4.2,2],[-56,20,3.5,1],[-55,6,4.8,0],[-58,-20,4,2],[35,43,2.6,1],[13,43,2.5,2]])orreryTopiary(b,x,0,z,h,v);
 for(const [x,z,w,d,a]of [[57,6,1.7,9,0],[49,-24,7,1.6,.25],[-56,-4,2,9,-.1],[16,51.3,12,1.3,0],[49,40,2,4,-.55]])orreryFlowerBed(b,x,z,w,d,a);
 orreryBench(b,23,0,50,PI);orreryBench(b,54,0,15,-PI/2);orreryBench(b,-56,0,14,PI/2);
 orrerySignboard(b,'THE RING RUN',53,0,0,4.6,-PI/2);orrerySignboard(b,'STARDUST',43,0,34,4.0,-.5);
 // A telescope crate, wheelbarrow and service kit make one quiet working corner.
 b.push(-56,0,-29,0,.35);b.box(0,.58,0,2.5,1.16,1.6,P.wood,22);for(const x of [-1.0,1.0])b.box(x,.60,.84,.12,1.1,.08,P.gold,41);b.box(0,1.20,0,2.6,.10,1.7,P.coral,22);orreryLetters(b,'GLASS',0,.68,.86,.27,P.cream);b.pop();
 b.push(56,0,30,0,.7);b.box(0,.65,0,1.25,.6,1.6,P.ink,41);for(const x of [-.8,.8])b.beam([x,.75,-1.9],[x,.60,.5],.07,P.wood,22,5);b.cylinder(0,.36,.85,.36,.36,1.4,P.gold,41,12,0,PI/2);for(let i=0;i<3;i++)b.cylinder(-.35+i*.34,.93,0,.13,.13,.18,P.coral,23,8);b.pop();
 // A constellation exhibit and sundial flank the central mechanical dais.
 for(const [x,z]of [[-9,-5],[19,-5]]){b.cylinder(x,.60,z,1.05,.72,1.2,P.cream,4,8);b.cylinder(x,1.25,z,1.35,1.35,.15,P.gold,41,20);}
 b.tri([18.2,1.34,-5],[19.8,1.34,-5],[19,2.7,-5],P.ink,41);
 b.push(-9,2.2,-5,PI/3,.2);orreryHoop(b,1.0,.055,P.gold,41,24);b.pop();b.sphere(-9,2.2,-5,.33,.33,.33,P.coral,40,10,6);
 for(const [x,z]of [[-54,33],[55,12],[30,50]]){b.cylinder(x,.63,z,.42,.48,1.25,P.teal,22,8);b.cylinder(x,1.32,z,.5,.48,.14,P.gold,41,8);b.box(x,1.40,z,.51,.12,.18,P.ink,41);}
}
function orreryScenicVisitors(scene,b){
 // The old line of identical onlookers becomes legible human-scale stories.
 const groups=[
  ['queue',[[-33,.20,42.35,'map',0,1.65],[-30,.20,42.4,'talk',-.6,1.7],[-28.8,.20,42.4,'stand',.8,1.2],[-23,.20,44,'bag',-.4,1.7]]],
  ['ticket',[[-53,0,30,'readStand',PI,1.7],[-55.8,0,33,'talk',.5,1.7],[-54.8,0,33.5,'point',.8,1.15]]],
  ['moon court',[[-48,0,10,'camera',1.2,1.7],[-49,0,12,'point',.8,1.7],[-47.8,0,12.5,'stand',1,1.15]]],
  ['promenade',[[20,0,49.8,'walk',-1.4,1.7],[23,.05,50,'chair',PI,1.7],[25,0,49.9,'talk',-1.1,1.65]]],
  ['moonwatch',[[-14,.57,-35.8,'map',PI,1.7],[-12,.57,-36,'point',.3,1.6],[-56,0,-27,'work',PI,1.7]]],
  ['lookout',[[46,.4,-8,'camera',-.8,1.65],[43,.4,-6.4,'point',-.8,1.7]]],
  ['gardener',[[55,0,28,'carry',-.6,1.7]]],
  ['station',[[3,0,50,'talk',.8,1.7],[4.3,0,50.2,'bag',-.8,1.7],[-10,6.8,36.3,'work',0,1.7]]]
 ];
 scene.orreryVignettes=[];
 for(const [name,people]of groups){const first=b.data.length/12;for(const [x,y,z,pose,angle,scale]of people)scenePerson(scene,b,x,y,z,pose,angle,scale);scene.orreryVignettes.push({name,people:people.length,first,count:b.data.length/12-first});}
}
function orreryScenicMechanisms(scene,b){
 const P=ORRERY;
 // A gently rotating tabletop armillary and a dispatch semaphore share the
 // room's already-owned movingParts lifecycle and never schedule a frame.
 b.cylinder(45,1.3,-6,.33,.23,2.2,P.gold,41,12);b.cylinder(45,.44,-6,1.5,1.5,.12,P.ink,41,20);
 const arm=new Builder();arm.push(0,0,0,PI/3);orreryHoop(arm,1.35,.055,P.gold,41,24);arm.pop();arm.push(0,0,0,-PI/3,PI/2);orreryHoop(arm,1.12,.045,P.coral,41,24);arm.pop();arm.sphere(0,0,0,.38,.38,.38,P.cream,40,12,8);
 orreryMovingPart(scene,arm,'garden-armillary',s=>mm(trans(45,2.8,-6),ry(reduceMotion?0:s.trains[0].distance*.035)));
 b.box(-6.3,9.15,34.5,.18,5.0,.2,P.ink,41);
 const signal=new Builder();signal.box(.65,0,0,1.45,.30,.14,P.coral,40);signal.box(1.22,0,.08,.16,.29,.035,P.cream,40);signal.cylinder(0,0,0,.25,.25,.22,P.gold,41,12,PI/2);
 orreryMovingPart(scene,signal,'dispatch-signal',s=>{const open=s.trains[0].edge.motionAt(s.trains[0].distance).restraint;return mm(trans(-6.3,11.7,34.5),rz(open>.5?0:-PI/3));});
}
function orreryScenicRoom(scene,b){
 scene.orreryScenicRanges=[];
 for(const [name,build]of [['station court',()=>orreryQueueAndStation(b,scene)],['stardust gallery',()=>orreryStarTunnel(b,scene)],['lunar court',()=>orreryLunarCourt(b)],['moonwatch pavilion',()=>orreryMoonwatch(b,scene)],['gardens and instruments',()=>orreryGardenFurniture(b)]])orreryFeature(scene,b,name,build);
}
function orreryScenicShell(b,which,width){
 const P=ORRERY;
 // Recesses, capitals and relief instruments give the collector's room depth.
 for(const x of [-width*.46,-width*.23,width*.23,width*.46]){
  b.box(x,13,1.25,1.8,62,.9,P.ink,22);b.box(x,13,1.77,.21,59,.17,P.gold,41);
  for(const y of [-17,41]){b.box(x,y,1.6,3.6,.6,1.55,P.gold,41);b.box(x,y+(y<0?.6:-.6),1.5,2.7,.6,1.2,P.coral,22);}
 }
 if(which==='left'||which==='right')for(const x of [-35,35]){
  b.push(x,16,2,PI/2);orreryHoop(b,9.6,.12,P.gold,41,48);b.pop();
  for(let i=0;i<12;i++){const a=i*TAU/12;b.beam([x+Math.cos(a)*8.2,16+Math.sin(a)*8.2,2.03],[x+Math.cos(a)*9.1,16+Math.sin(a)*9.1,2.03],.055,P.cream,41,5);}
  b.beam([x-5,10,2.1],[x+4,22,2.1],.075,P.gold,41,5);b.beam([x+4,22,2.1],[x+6,13,2.1],.065,P.gold,41,5);b.beam([x+6,13,2.1],[x-5,10,2.1],.065,P.gold,41,5);
  for(const [dx,dy]of [[-5,10],[4,22],[6,13]])orreryStar(b,x+dx,dy,2.15,.42,P.cream,25);
 }
 if(which==='back'){
  for(const x of [-70,70]){b.box(x,-1,3,9,1.1,5,P.gold,22);b.cylinder(x,2,3,2.1,1.5,4.8,P.ink,41,12);b.push(x,5,3,PI/2);orreryHoop(b,2.6,.13,P.gold,41,32);b.pop();}
  // A low instrument shelf sits behind, rather than across, the miniature.
  b.box(0,-10,3.5,104,1.1,5.5,P.wood,22);for(const x of [-42,-22,23,43]){b.box(x,-7.9,3.5,5,3.1,3,P.ink,22);orreryStar(b,x,-7.5,5.04,.62,P.gold,41);}
 }
}
