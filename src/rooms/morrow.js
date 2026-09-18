'use strict';

// MORROW HOUSE / THE MIDNIGHT LINE. Original native geometry, no guest runtime,
// assets, atlas allocations, frame listeners, network calls or persistent state.
const MORROW={railY:1.5,deckY:7.3,width:118,depth:78};
const MH={stone:'#7c777c',stoneLight:'#b1a495',mortar:'#403d4b',wall:'#6b667b',panel:'#514959',roof:'#323648',roofLight:'#596079',iron:'#303540',brass:'#b69a60',gold:'#d6bb7d',glow:'#ffd592',ghost:'#8ccbb9',wood:'#523c38',moss:'#56614f',ground:'#3d5148'};
const MORROW_ROUTE=(()=>{
 const points=[[-38,19],[-16,26],[15,24],[39,18],[46,0],[39,-23],[23,-16],[14,-16],[-10,-16],[-20,-16],[-38,-24],[-47,-3],[-43,10]].map(([x,z])=>[x,MORROW.railY,z]);
 const n=points.length,curves=points.map((p,i)=>{const a=points[(i+n-1)%n],q=points[(i+1)%n],d=points[(i+2)%n];return[p,add(p,mul(sub(q,a),1/6)),sub(q,mul(sub(d,p),1/6)),q];});
 return new Edge('The Midnight Line',curves);
})();
const MORROW_TRACK_SAMPLES=Array.from({length:Math.ceil(MORROW_ROUTE.length/.65)},(_,i)=>MORROW_ROUTE.at(i*.65).p);
function morrowRailDistance(x,z){let d=Infinity;for(const p of MORROW_TRACK_SAMPLES)d=Math.min(d,(x-p[0])**2+(z-p[2])**2);return Math.sqrt(d);}
function morrowHeight(x,z){
 const hill=4.0*Math.exp(-((x+32)**2/130+(z+21)**2/90))+3.5*Math.exp(-((x-31)**2/110+(z+22)**2/90));
 const pool=Math.exp(-((x-30)**2/80+(z-5)**2/42));
 const land=.73+hill+.18*Math.sin(x*.22+z*.11)+.16*Math.cos(z*.31)-1.65*pool;
 return mix(land,MORROW.railY-.21,1-smooth(1,3,morrowRailDistance(x,z)));
}
function mhRing(b,x,y,z,r,t,color=MH.brass,mat=41,n=24){
 for(let i=0;i<n;i++){const a=i*TAU/n,q=(i+1)*TAU/n;b.beam([x+Math.cos(a)*r,y+Math.sin(a)*r,z],[x+Math.cos(q)*r,y+Math.sin(q)*r,z],t,color,mat,5);}
}
function mhArch(b,x,y,z,r,rise,t,depth,color=MH.stoneLight,n=16){
 // A real, empty elliptical arch, not a black rectangle over a solid wall.
 for(let i=0;i<n;i++){
  const a=i*PI/n,q=(i+1)*PI/n,p=(a,rr,hh,d)=>[x+Math.cos(a)*rr,y+Math.sin(a)*hh,z+d];
  b.quad(p(a,r,rise,depth/2),p(q,r,rise,depth/2),p(q,r+t,rise+t,depth/2),p(a,r+t,rise+t,depth/2),i%3?color:shade(color,.88),4);
  b.quad(p(q,r,rise,-depth/2),p(a,r,rise,-depth/2),p(a,r+t,rise+t,-depth/2),p(q,r+t,rise+t,-depth/2),color,4);
  b.quad(p(a,r,rise,-depth/2),p(q,r,rise,-depth/2),p(q,r,rise,depth/2),p(a,r,rise,depth/2),shade(color,.68),4);
  b.quad(p(q,r+t,rise+t,-depth/2),p(a,r+t,rise+t,-depth/2),p(a,r+t,rise+t,depth/2),p(q,r+t,rise+t,depth/2),color,4);
 }
}
function mhFinial(b,x,y,z,s=1){
 b.cylinder(x,y+.2*s,z,.17*s,.13*s,.4*s,MH.brass,41,8);b.sphere(x,y+.47*s,z,.19*s,.25*s,.19*s,MH.gold,41,8,5);b.cylinder(x,y+.96*s,z,.12*s,0,.68*s,MH.brass,41,8);
}
function mhCornice(b,x,y,z,w,d){
 for(const [dy,extra,h,c]of[[0,0,.18,MH.mortar],[.18,.25,.18,MH.stoneLight],[.37,.65,.23,MH.wall],[.55,.86,.12,MH.gold]])b.box(x,y+dy,z,w+extra,h,d+extra,c,dy===.55?41:4);
}
function mhWindow(b,x,y,z,w=1.05,h=2.2,lit=true,variant=0){
 b.box(x,y,z,w+.35,h+.45,.20,MH.mortar,4);b.box(x,y,z+.115,w,h,.07,lit?(variant%3===0?'#b0dbbf':MH.glow):'#354551',lit?6:0);
 for(const side of[-1,1])b.box(x+side*(w/2+.08),y,z+.22,.13,h+.24,.16,MH.stoneLight,4);
 for(const dy of[-h/2,h/2])b.box(x,y+dy,z+.235,w+.38,.13,.24,MH.stoneLight,4);
 b.box(x,y,z+.24,.07,h,.11,MH.iron,41);b.box(x,y+.23,z+.24,w,.07,.11,MH.iron,41);
 b.box(x,y-h/2-.14,z+.28,w+.56,.14,.45,MH.stoneLight,4);
 if(variant%2===0){b.tri([x-w*.7,y+h/2+.2,z+.24],[x+w*.7,y+h/2+.2,z+.24],[x,y+h/2+.72,z+.24],MH.wall,4);b.beam([x-w*.7,y+h/2+.2,z+.29],[x,y+h/2+.72,z+.29],.065,MH.gold,41,4);b.beam([x+w*.7,y+h/2+.2,z+.29],[x,y+h/2+.72,z+.29],.065,MH.gold,41,4);}
 // Parted curtains stay outside the illuminated central aperture.
 if(lit)for(const side of[-1,1])b.tri([x+side*w*.45,y+h*.47,z+.27],[x+side*w*.17,y+h*.47,z+.27],[x+side*w*.40,y-h*.37,z+.27],variant%3?'#765367':'#52706a',23);
}
function mhSlateRoof(b,x,y,z,w,d,h,hip=.38){
 const corners=[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]],top=corners.map(([xx,zz])=>[xx*hip,zz*hip]);
 for(let side=0;side<4;side++){
  const a=corners[side],q=corners[(side+1)%4],u=top[side],v=top[(side+1)%4];
  for(let row=0;row<8;row++){
   const t=row/8,tt=(row+1)/8,p=(p,r,t)=>[x+mix(p[0],r[0],t),y+h*t,z+mix(p[1],r[1],t)];
   b.quad(p(a,u,t),p(q,v,t),p(q,v,tt),p(a,u,tt),shade(MH.roof,.9+.17*hash(row,side+7)),42);
   b.beam(p(a,u,tt),p(q,v,tt),.034,MH.roofLight,42,4);
   const count=Math.ceil((side%2?d:w)*(1-t*(1-hip))/.72);
   for(let j=1;j<count;j++){const f=(j+(row%2)*.5)/count,A=lerpV(p(a,u,t),p(q,v,t),f),B=lerpV(p(a,u,tt),p(q,v,tt),f);b.beam(A,B,.014,shade(MH.roofLight,.7),42,4);}
  }
 }
 b.box(x,y+h,z,w*hip,.18,d*hip,MH.roofLight,42);mhCornice(b,x,y-.4,z,w,d);
}
function mhLantern(b,x,y,z,h=2.7,s=.7){
 b.cylinder(x,y+.12,z,.23*s,.17*s,.24,MH.iron,41,10);b.cylinder(x,y+h*.48,z,.055*s,.043*s,h*.92,MH.iron,41,8);
 b.box(x,y+h,z,.36*s,.53*s,.36*s,MH.glow,6);
 for(const xx of[-1,1])for(const zz of[-1,1])b.box(x+xx*.20*s,y+h,z+zz*.20*s,.045*s,.66*s,.045*s,MH.iron,41);
 b.cylinder(x,y+h+.43*s,z,.39*s,0,.32*s,MH.iron,41,4);b.box(x,y+h-.32*s,z,.48*s,.09*s,.48*s,MH.brass,41);mhFinial(b,x,y+h+.6*s,z,.26*s);
}
function mhFence(b,points,y,h=.9,color=MH.iron){
 for(let j=1;j<points.length;j++){
  const a=points[j-1],q=points[j],n=Math.max(1,Math.ceil(Math.hypot(a[0]-q[0],a[1]-q[1])/.5));
  for(const height of[.25,h*.82])b.beam([a[0],y+height,a[1]],[q[0],y+height,q[1]],.035,color,41,5);
  for(let i=0;i<=n;i++){const x=mix(a[0],q[0],i/n),z=mix(a[1],q[1],i/n);b.beam([x,y,z],[x,y+h,z],.029,color,41,5);b.cylinder(x,y+h+.07,z,.08,0,.20,MH.brass,41,5);}
 }
}
function mhTree(b,x,y,z,h,seed=0){
 // Authored, tapering branch skeletons with elbows, drooping twigs and air.
 const c=seed%2?'#534c55':'#626366',trunk=[[0,0,0],[.12,h*.30,.12],[-.12,h*.58,-.07],[.3,h*.85,.17],[.12,h,0]];
 b.push(x,y,z,0,seed*.73);
 for(let i=1;i<trunk.length;i++)b.beam(trunk[i-1],trunk[i],h*(.051-.009*i),c,22,7);
 for(let k=0;k<7;k++){
  const t=.30+k*.075,a=k*2.399+seed,len=h*(.39-.015*k),root=[.03,h*t,0],elbow=[Math.cos(a)*len*.50,h*(t+.13),Math.sin(a)*len*.50],tip=[Math.cos(a)*len,h*(t+.24),Math.sin(a)*len];
  b.beam(root,elbow,h*.019,c,22,6);b.beam(elbow,tip,h*.012,c,22,5);
  for(const s of[-1,1]){const p=[tip[0]+Math.cos(a+s*.7)*h*.16,tip[1]+h*.13,tip[2]+Math.sin(a+s*.7)*h*.16];b.beam(tip,p,h*.006,c,22,4);b.beam(p,[p[0]+Math.cos(a+s)*h*.06,p[1]-h*.04,p[2]+Math.sin(a+s)*h*.06],h*.003,c,22,4);}
  b.beam(elbow,[elbow[0]+Math.cos(a+.6)*h*.16,elbow[1]-h*.09,elbow[2]+Math.sin(a+.6)*h*.16],h*.007,c,22,4);
 }
 for(let i=0;i<5;i++){const a=i*TAU/5;b.beam([0,.5,0],[Math.cos(a)*h*.13,.04,Math.sin(a)*h*.13],h*.021,c,22,5);}b.pop();
}
function mhTerrain(b){
 const n=112,rings=34,point=(i,r)=>{const a=i*TAU/n,s=1+.045*Math.sin(3*a+.3)+.023*Math.cos(7*a),x=Math.cos(a)*57.5*s*r,z=Math.sin(a)*35.5*s*r;return[x,morrowHeight(x,z),z];};
 for(let r=0;r<rings;r++)for(let i=0;i<n;i++){
  const a=point(i,r/rings),q=point(i+1,r/rings),u=point(i,(r+1)/rings),v=point(i+1,(r+1)/rings),c=shade(MH.ground,.97+.045*Math.sin((a[0]+u[0])*.11+(a[2]+u[2])*.14));
  if(r)b.tri(a,q,u,c,3);b.tri(q,v,u,c,3);
 }
 // A scalloped walnut display cabinet, not another rectangular railway table.
 const levels=[[-4.2,.97,MH.wood],[-3.65,1,'#715447'],[-.7,1,'#4b3836'],[-.43,1.008,MH.brass],[-.20,1.012,'#927451']];
 for(let j=0;j<levels.length-1;j++)for(let i=0;i<n;i++){
  const a=point(i,1),q=point(i+1,1),[y,s,c]=levels[j],[yy,ss]=levels[j+1];b.quad([a[0]*s,y,a[2]*s],[q[0]*s,y,q[2]*s],[q[0]*ss,yy,q[2]*ss],[a[0]*ss,yy,a[2]*ss],c,22);
 }
 for(let i=0;i<n;i++){const a=point(i,1),q=point(i+1,1);b.quad([a[0],-.18,a[2]],[q[0],-.18,q[2]],q,a,MH.mortar,4);if(i%4===0)b.beam([a[0],-3.55,a[2]],[a[0],-.7,a[2]],.025,MH.brass,41,4);}
 for(const [x,z]of[[-39,19],[38,18],[-36,-20],[36,-20]]){
  b.cylinder(x,FLOOR+9.7,z,1.0,.68,17.8,MH.wood,22,10);b.sphere(x,FLOOR+.85,z,1.45,.85,1.45,MH.wood,22,10,6);b.cylinder(x,-5.2,z,1.32,1.05,2.1,MH.wood,22,10);
  b.beam([x,FLOOR+10,z],[x*.63,-5.1,z*.65],.38,MH.wood,22,8);
 }
}
function mhCrypt(b){
 const top=MORROW.deckY;
 for(const z of[-22.6,-11.1]){
  b.box(3,3.75,z,29,6.2,1.0,MH.mortar,4);
  for(let row=0;row<11;row++)for(let i=0;i<24;i++){const x=-11+i*1.22+(row%2)*.58;if(x>17.1)continue;b.box(x,.85+row*.56,z+(z>-16?.53:-.53),1.16,.49,.11,shade(MH.stone,.83+.24*hash(i,row)),4);}
 }
 // East and west portals run along the railway's actual centerline.
 for(const x of[-11.9,17.9]){
  b.push(x,0,-16,0,PI/2);mhArch(b,0,3.9,0,2.13,2.35,.54,.95);
  for(const s of[-1,1])b.box(s*2.42,2.25,0,.58,3.3,.98,MH.stone,4);
  b.box(0,6.93,0,6.0,.74,1.0,MH.stone,4);b.box(0,6.3,.55,.64,.82,.25,MH.gold,41);
  for(const s of[-1,1])mhLantern(b,s*3.1,1.3,.7,2.6,.6);b.pop();
 }
 b.box(3,top-.32,-16.3,31,.64,14.2,MH.stone,4);mhCornice(b,3,top-.14,-16.3,31,14.3);
 // A broad, gently fanning entrance stair, completely outside the railway.
 for(let i=0;i<17;i++){const z=3.55-i*.62,y=.88+i*.39,w=8.8-i*.12;b.box(3,y-.22,z,w,.48,.68,MH.stone,4);b.box(3,y+.05,z+.29,w+.14,.09,.18,MH.stoneLight,4);}
 for(const s of[-1,1]){
  const pts=[];for(let i=0;i<17;i++){const x=3+s*(4.38-i*.06),z=3.5-i*.62,y=.93+i*.39;b.box(x,y+.34,z,.17,.9,.17,MH.iron,41);pts.push([x,y+.88,z]);}
  for(let i=1;i<pts.length;i++)b.beam(pts[i-1],pts[i],.07,MH.brass,41,6);mhLantern(b,3+s*4.8,.85,4.3,3.0,.95);
 }
}
function mhMansion(b){
 const y=MORROW.deckY;
 // An asymmetric Second-Empire composition with a wraparound verandah.
 b.box(3,y+4.4,-16.2,18,8.8,11,MH.wall,4);b.box(-7.5,y+5.1,-13.1,6.2,10.2,8,MH.panel,4);b.box(13,y+3.6,-16.8,6.8,7.2,10,MH.wall,4);
 for(const yy of[y+.5,y+4.1,y+8.35])mhCornice(b,3,yy,-16.2,18,11);
 // Chalky horizontal siding is selectively worn, not randomly noisy.
 for(let i=0;i<26;i++){const yy=y+.15+i*.32;b.box(3,yy,-10.675,18,.032,.038,shade(MH.stoneLight,.64),4);b.box(12.03,yy,-16.2,.035,.035,11,MH.mortar,4);}
 for(const x of[-5.78,11.78])for(let i=0;i<14;i++)b.box(x,y+.33+i*.60,-10.50,.5+(i%2)*.22,.37,.38,MH.stoneLight,4);
 for(const floor of[0,1])for(let i=0;i<6;i++)mhWindow(b,-4.35+i*2.82,y+2.05+floor*4.08,-10.45,1.18,2.34,!(i===5&&floor===0),i+floor);
 for(const x of[-6,12]){
  b.push(x,y+2.1,-16.2,0,x<0?-PI/2:PI/2);for(const z of[-3,0,3])for(const level of[0,4.1])mhWindow(b,z,level,.04,1.12,2.2,true,Math.round(z)+2);b.pop();
 }
 // Front entrance and an eyebrow fanlight under a filigree porch.
 b.box(3,y+1.6,-10.12,2.35,3.2,.22,MH.wood,22);for(const s of[-1,1]){b.box(3+s*.49,y+2,-9.98,.74,1.2,.07,MH.glow,6);b.box(3+s*.49,y+.7,-9.94,.72,.85,.08,MH.panel,22);b.sphere(3+s*.15,y+1.46,-9.84,.075,.075,.075,MH.gold,41,8,5);}
 mhArch(b,3,y+3.2,-9.98,1.26,.66,.14,.18,MH.brass,12);
 b.box(3,y+.13,-8.25,19.6,.24,4.8,MH.wood,22);b.box(3,y+3.78,-8.3,20.2,.28,5.2,MH.roof,42);
 for(let i=0;i<10;i++){const x=-6+i*2;for(const z of[-6.0,-9.85]){b.cylinder(x,y+1.95,z,.085,.068,3.6,MH.stoneLight,4,8);b.cylinder(x,y+3.39,z,.20,.14,.16,MH.brass,41,8);}
  if(i<9&&i!==4){mhArch(b,x+1,y+3.2,-5.91,.92,.43,.065,.10,MH.stoneLight,10);for(let k=0;k<3;k++)b.cylinder(x+.45+k*.5,y+3.61,-5.86,.06,0,.26,MH.gold,41,5);}}
 mhFence(b,[[-6,-6],[-1,-6]],y,.78);mhFence(b,[[7,-6],[12,-6]],y,.78);
 mhSlateRoof(b,3,y+8.9,-16.2,19.3,12.2,5.1,.51);
 // Five projecting dormers make the mansard read as authored architecture.
 for(let i=0;i<5;i++){const x=-4.1+i*3.55,zz=-10.27;b.box(x,y+10.2,zz,1.7,2.15,1.15,MH.wall,4);mhWindow(b,x,y+10.2,zz+.61,.85,1.6,i!==3,i);b.tri([x-1.1,y+11.2,zz+.75],[x+1.1,y+11.2,zz+.75],[x,y+12.7,zz+.75],MH.roof,42);b.beam([x-1.15,y+11.2,zz+.80],[x,y+12.7,zz+.80],.065,MH.gold,41,5);b.beam([x+1.15,y+11.2,zz+.80],[x,y+12.7,zz+.80],.065,MH.gold,41,5);mhFinial(b,x,y+12.7,zz+.77,.55);}
 mhFence(b,[[-1.9,-19.3],[7.9,-19.3],[7.9,-13.1],[-1.9,-13.1],[-1.9,-19.3]],y+14.2,1.25);
 for(const x of[-1.9,7.9])for(const z of[-19.3,-13.1])mhFinial(b,x,y+15.45,z,.62);
 // The clock tower is taller, slimmer and slightly eccentric, not symmetric.
 b.box(-7.5,y+11.5,-13.1,5.9,4.8,7.5,MH.wall,4);mhCornice(b,-7.5,y+13.8,-13.1,6.0,7.6);
 for(const x of[-9.5,-5.5])mhWindow(b,x,y+11.4,-9.20,1.10,2.5,true,1);
 b.box(-7.5,y+15.5,-13.1,5.3,3.2,6.6,MH.panel,4);b.cylinder(-7.5,y+15.55,-9.71,1.33,1.33,.15,MH.mortar,41,32,PI/2);b.cylinder(-7.5,y+15.55,-9.61,1.15,1.15,.06,MH.glow,6,32,PI/2);mhRing(b,-7.5,y+15.55,-9.54,1.19,.056,MH.brass,41,32);
 for(let i=0;i<12;i++){const a=i*TAU/12;b.beam([-7.5+Math.sin(a)*.92,y+15.55+Math.cos(a)*.92,-9.49],[-7.5+Math.sin(a)*1.04,y+15.55+Math.cos(a)*1.04,-9.49],.024,MH.iron,41,4);}
 mhSlateRoof(b,-7.5,y+17.18,-13.1,6.9,8.0,6.1,.12);mhFinial(b,-7.5,y+23.38,-13.1,1.7);
 for(const xx of[-9.22,-6.13])for(const floor of[0,1])mhWindow(b,xx,y+2.1+floor*4.1,-9.04,1.08,2.3,true,floor+1);
 for(const xx of[-10.44,-4.56])for(let k=0;k<16;k++)b.box(xx,y+.4+k*.65,-9.02,.34+(k%2)*.18,.46,.20,MH.stoneLight,4);
 for(const xx of[-10.25,-4.75]){b.box(xx,y+12.15,-9.34,.20,5.4,.25,MH.stoneLight,4);mhFinial(b,xx,y+14.9,-9.34,.53);}
 // Octagonal oriel tower on the eastern wing, with copper seams and crown.
 b.cylinder(16,y+5.2,-12.0,2.9,2.9,10.4,MH.wall,4,8);
 for(let face=0;face<8;face++){const a=face*TAU/8+PI/8;b.push(16,y,-12,0,a);for(const yy of[2.6,6.5])mhWindow(b,0,yy,2.75,.94,2.30,face!==6,face);b.pop();}
 b.cylinder(16,y+10.48,-12,3.28,3.28,.42,MH.stoneLight,4,8);b.cylinder(16,y+13.25,-12,3.5,.34,5.2,MH.roof,42,8);
 for(let i=0;i<8;i++){const a=i*TAU/8;b.beam([16+Math.cos(a)*3.5,y+10.65,-12+Math.sin(a)*3.5],[16+Math.cos(a)*.34,y+15.85,-12+Math.sin(a)*.34],.045,MH.brass,41,5);}mhFinial(b,16,y+15.9,-12,1.2);
 for(const [x,z]of[[-1,-20],[8,-18.5],[13,-19.5]]){
  b.box(x,y+14.5,z,.8,3.5,1.2,MH.mortar,4);for(let k=0;k<8;k++)b.box(x,y+13.0+k*.4,z,.85,.05,1.25,MH.stone,4);b.box(x,y+16.35,z,1.2,.22,1.6,MH.stoneLight,4);for(const zz of[-.3,.3])b.cylinder(x,y+16.78,z+zz,.22,.28,.7,MH.stone,4,10);
 }
}
function mhConservatory(b){
 const x=26,z=-6,y=2.6,rx=7,rz=5.6;
 b.cylinder(x,y-.35,z,7.4,7.4,.7,MH.mortar,4,12);b.cylinder(x,y-.03,z,7.65,7.65,.18,MH.stoneLight,4,12);
 for(let i=0;i<12;i++){
  const a=i*TAU/12,q=(i+1)*TAU/12,A=[x+Math.cos(a)*rx,z+Math.sin(a)*rz],B=[x+Math.cos(q)*rx,z+Math.sin(q)*rz];
  b.beam([A[0],y,A[1]],[A[0],y+4.9,A[1]],.10,MH.iron,41,6);
  if(i!==3){b.quad([A[0],y+.55,A[1]],[B[0],y+.55,B[1]],[B[0],y+4.5,B[1]],[A[0],y+4.5,A[1]],'#608e84',76);for(const h of[.55,2.4,4.5])b.beam([A[0],y+h,A[1]],[B[0],y+h,B[1]],.045,MH.brass,41,5);const m=lerpV(A,B,.5);b.beam([m[0],y+.55,m[1]],[m[0],y+4.5,m[1]],.035,MH.iron,41,5);}
  const top=[x,y+8,z];b.quad([A[0],y+4.65,A[1]],[B[0],y+4.65,B[1]],[x+(B[0]-x)*.26,y+7.6,z+(B[1]-z)*.26],[x+(A[0]-x)*.26,y+7.6,z+(A[1]-z)*.26],'#658e86',76);b.beam([A[0],y+4.65,A[1]],top,.065,MH.brass,41,6);
 }
 b.cylinder(x,y+7.9,z,1.9,.6,.9,MH.iron,41,12);mhFinial(b,x,y+8.3,z,1.4);
 // A luminous terrarium specimen in a real furnished winter garden.
 b.cylinder(x,y+.46,z,1.1,.8,.86,MH.stone,4,12);b.cylinder(x,y+1.25,z,.14,.12,1.6,MH.brass,41,10);
 for(let i=0;i<11;i++){const a=i*2.399,r=1.6+hash(i,6)*.5,yy=y+1.4+i*.16,tip=[x+Math.cos(a)*r,yy+1.2,z+Math.sin(a)*r];b.beam([x,y+1.0,z],tip,.028,MH.iron,41,5);b.sphere(...tip,.43,.12,.85,'#8aa999',3,8,5);}
 b.sphere(x,y+3.75,z,.34,.47,.34,MH.ghost,6,12,8);
 for(const s of[-1,1]){b.box(x+s*3.2,y+.5,z+1.5,1.4,.16,3.3,MH.wood,22);for(const zz of[.2,2.8])for(const xx of[-.5,.5])b.box(x+s*3.2+xx,y+.25,z+zz,.12,.5,.12,MH.iron,41);}
 for(let k=0;k<5;k++)b.box(x,y-.15-k*.35,z+6+k*.65,3.5+k*.18,.4,.72,MH.stone,4);
 // Narrow glazed gallery joins the elevated house to the garden.
 for(let i=0;i<6;i++){const xx=17.9+i*.65,yy=7.4-i*.70;b.box(xx,yy,-7,1.0,.19,2.0,MH.stoneLight,4);for(const s of[-1,1])b.box(xx,yy+.75,-7+s,.05,1.4,.06,MH.brass,41);}
}
function mhAbbey(b){
 const x=-30,z=-6,y=morrowHeight(x,z);
 b.push(x,y,z,0,-.22);b.box(0,.25,0,11,.5,15,MH.mortar,4);
 for(const side of[-1,1])for(let i=0;i<4;i++){
  const zz=-5+i*3.3,h=side===-1?5.4+(i%3)*.8:3.3+i*.5;b.box(side*4.9,h/2,zz,1.25,h,1.4,MH.stone,4);b.box(side*5.45,1.5,zz,.7,3,2.1,shade(MH.stone,.87),4);b.box(side*4.9,h+.16,zz,1.5,.32,1.8,MH.stoneLight,4);
  if(i<3&&side===-1){b.push(side*4.9,0,zz+1.65,0,PI/2);mhArch(b,0,4.1,0,1.04,2,.34,.75,MH.stone,10);b.pop();}
 }
 // Broken west front: open lancets and a rose window with real tracery.
 b.box(-3.7,5.2,6.5,2.3,10.4,1,MH.stone,4);b.box(3.7,5.9,6.5,2.3,11.8,1,MH.stone,4);mhArch(b,0,4.8,6.5,2.5,3.8,.7,1.05,MH.stoneLight,20);
 b.box(0,9.6,6.5,4.1,1.2,1,MH.stone,4);mhRing(b,0,11.35,6.57,2.04,.33,MH.stoneLight,4,24);mhRing(b,0,11.35,6.62,1.45,.07,MH.brass,41,24);
 for(let i=0;i<8;i++){const a=i*TAU/8;mhRing(b,Math.cos(a)*.95,11.35+Math.sin(a)*.95,6.63,.46,.065,MH.stoneLight,4,12);b.beam([Math.cos(a)*1.42,11.35+Math.sin(a)*1.42,6.62],[Math.cos(a)*1.79,11.35+Math.sin(a)*1.79,6.62],.065,MH.stoneLight,4,5);}
 b.cylinder(0,11.35,6.54,.40,.40,.10,MH.ghost,6,12,PI/2);
 for(const side of[-1,1]){b.box(side*4.9,8.7,6.5,1.15,2.5,1.7,MH.stone,4);b.cylinder(side*4.9,10.75,6.5,.8,0,2.0,MH.roof,42,4);}
 for(let i=0;i<18;i++){const xx=-4+hash(i,47)*8,zz=-6+hash(i,98)*11;if(Math.hypot(xx,zz)<2.6)continue;b.push(xx,.3,zz,0,i*.9,.1);b.box(0,0,0,.65+hash(i,5),.35,.7,MH.stone,4);b.pop();}
 // The midnight rehearsal: a miniature organ, keys, stool and music stand.
 b.box(0,1.35,-5.9,4.3,2.5,1.2,MH.wood,22);for(let i=0;i<13;i++){const xx=-1.8+i*.3,h=3.7+Math.abs(i-6)*.22;b.cylinder(xx,2.2+h/2,-6.1,.11,.11,h,MH.brass,41,10);b.box(xx,2.35,-5.96,.14,.40,.02,MH.iron,41);}
 b.box(0,1.25,-4.94,3.6,.2,.65,MH.stoneLight,23);for(let i=0;i<24;i++)if(i%7!==2&&i%7!==6)b.box(-1.65+i*.143,1.39,-5.08,.07,.10,.26,MH.iron,41);
 b.box(0,.71,-3.7,2.0,.20,.55,MH.wood,22);for(const s of[-1,1])b.box(s*.78,.32,-3.7,.13,.64,.4,MH.iron,41);
 for(const [xx,zz]of[[-2.8,-3.5],[2.8,-3.5],[-3.6,4.2],[3.6,4.2]])mhLantern(b,xx,.6,zz,1.0,.65);b.pop();
}
function mhGraveyard(b){
 const x=-24,z=9;
 for(let i=0;i<19;i++){
  const xx=x+(i%5-2)*2.45+(Math.floor(i/5)%2)*.7,zz=z+Math.floor(i/5)*2.5,y=morrowHeight(xx,zz),h=.95+hash(i,52)*.8;
  if(morrowRailDistance(xx,zz)<2.1)continue;
  b.push(xx,y,zz,0,.13*Math.sin(i*3.1),.10*Math.sin(i*2.3));b.box(0,.05,.5,1.2,.1,1.7,MH.mortar,4);b.box(0,h*.40,0,.8,h*.8,.20,MH.stone,4);b.cylinder(0,h*.8,0,.40,.40,.20,MH.stone,4,12,PI/2);
  for(let k=0;k<3;k++)b.box(0,h*.43+k*.13,.113,.39-k*.07,.035,.015,MH.mortar,0);
  if(i%4===0){b.box(0,h+ .23,0,.1,.65,.15,MH.stoneLight,4);b.box(0,h+.3,0,.46,.09,.15,MH.stoneLight,4);}b.pop();
 }
 for(const [xx,zz]of[[-34,7],[-12,13],[-25,20]])mhTree(b,xx,morrowHeight(xx,zz),zz,6.5+hash(xx,zz)*2,xx+zz);
 mhFence(b,[[-33,5],[-14,5],[-12,17]],1.1,1.35);mhFence(b,[[-35,6],[-35,16]],1.1,1.35);
 // The mausoleum door has been left ajar, its lantern still warm.
 b.push(-38,morrowHeight(-38,3),3,0,.25);b.box(0,1.5,0,4.2,3,4.8,MH.mortar,4);b.box(0,1.4,2.45,1.65,2.8,.07,MH.ghost,6);for(const s of[-1,1])b.box(s*1.55,1.6,2.4,.44,3.2,.65,MH.stoneLight,4);b.box(0,3.35,0,4.8,.38,5.4,MH.stone,4);mhSlateRoof(b,0,3.63,0,4.9,5.5,1.8,.08);b.push(-.77,1.4,2.56,0,-.57);b.box(.76,0,0,1.5,2.76,.1,MH.iron,41);for(let k=0;k<5;k++)b.box(.15+k*.3,0,.07,.06,2.5,.06,MH.brass,41);b.pop();b.pop();
}
function mhStation(b){
 const y=1.72;
 // A crescent platform follows the front rail instead of piercing it.
 for(let i=0;i<35;i++){
  const x=-7+i*.73,z=21.6-.0038*(x+5)**2;b.box(x,y-.19,z,.78,.46,2.55,MH.stone,4);b.box(x,y+.07,z+1.25,.77,.09,.16,MH.stoneLight,4);
 }
 b.push(7,y,18.65,0,.055);b.box(0,1.30,0,5.6,2.6,3.3,MH.wood,22);for(const x of[-1.7,1.7])mhWindow(b,x,1.4,1.73,.85,1.4,true,1);b.box(0,1.03,1.73,1.0,2.04,.12,MH.panel,22);b.box(0,1.5,1.81,.64,.83,.05,MH.glow,6);mhSlateRoof(b,0,2.8,0,6.4,4.2,2,.13);
 b.box(0,2.77,2.02,6.7,.26,2.2,MH.roof,42);for(const x of[-3,3]){b.cylinder(x,1.5,3,.06,.06,3,MH.iron,41,8);mhArch(b,x>0?1.5:-1.5,2.3,3,1.4,.35,.07,.10,MH.brass,12);}b.pop();
 for(const x of[-5,0,16.5]){const z=21.6-.0038*(x+5)**2;mhLantern(b,x,y,z-.8,2.6,.75);}
 // A full canopy with open trusses and individual scalloped valance boards.
 for(let i=0;i<7;i++){
  const x=-3+i*3.3,z=20.7-.0038*(x+5)**2;
  b.cylinder(x,y+1.65,z-.4,.055,.055,3.3,MH.iron,41,8);b.beam([x,y+2.6,z-.4],[x,y+3.65,z+1.2],.045,MH.brass,41,5);b.beam([x,y+3.45,z-1],[x,y+3.65,z+1.2],.06,MH.iron,41,6);
  b.box(x+1.55,y+3.53,z,3.4,.1,2.6,MH.roof,42);for(let j=0;j<10;j++){const xx=x+j*.33;b.cylinder(xx,y+3.36,z+1.35,.14,.14,.04,MH.brass,41,8,PI/2);}
 }
 for(const x of[-1,14]){b.box(x,y+.48,20,2.1,.14,.55,MH.wood,22);b.box(x,y+.86,19.78,2.1,.62,.08,MH.wood,22);for(const s of[-1,1])b.box(x+s*.8,y+.26,20,.1,.52,.45,MH.iron,41);}
 for(let i=0;i<5;i++){const x=11+i*.47;b.box(x,y+.2+(i%2)*.1,19.5,.42,.42+(i%2)*.2,.54,i%2?'#9f7351':'#555866',22);for(const s of[-1,1])b.box(x+s*.13,y+.2+(i%2)*.1,19.79,.04,.41,.015,MH.brass,41);}
 // Waiting-room time is deliberately 11:59, in contrast to the living clock.
 b.cylinder(-4,y+3.25,21.1,.48,.48,.14,MH.iron,41,20,PI/2);b.cylinder(-4,y+3.25,21.2,.4,.4,.03,MH.glow,6,20,PI/2);b.beam([-4,y+3.25,21.23],[-4.05,y+3.57,21.23],.019,MH.iron,41,5);b.beam([-4,y+3.25,21.23],[-4.10,y+3.43,21.23],.02,MH.iron,41,5);
}
function mhPond(b){
 const x=31,z=7,y=.07,n=64;
 for(let i=0;i<n;i++){const a=i*TAU/n,q=(i+1)*TAU/n,r=a=>1+.07*Math.sin(a*3);b.tri([x,y,z],[x+Math.cos(q)*7*r(q),y,z+Math.sin(q)*4.6*r(q)],[x+Math.cos(a)*7*r(a),y,z+Math.sin(a)*4.6*r(a)],'#467371',7);}
 for(let i=0;i<26;i++){const a=i*2.399,xx=x+Math.cos(a)*(7.2+hash(i,13)*.5),zz=z+Math.sin(a)*5.0,yy=morrowHeight(xx,zz);b.sphere(xx,yy+.13,zz,.50+hash(i,17)*.4,.28,.40,MH.stone,4,8,5,true);}
 // A derelict boathouse jetty and one little black skiff.
 for(let i=0;i<13;i++)b.box(x+2,.48,z+4.5-i*.32,1.8,.12,.29,MH.wood,22);
 for(const xx of[x+1.2,x+2.8])for(const zz of[z+1,z+4.6])b.cylinder(xx,.34,zz,.10,.10,1.0,MH.wood,22,8);
 b.push(x-1,y+.15,z+1,0,.55);b.box(0,.05,0,1.25,.15,2.4,MH.wood,22);for(const s of[-1,1])b.beam([s*.55,.20,-1],[s*.55,.20,1],.1,MH.wood,22,6);b.tri([-.6,.1,1.1],[.6,.1,1.1],[0,.1,1.9],MH.wood,22);b.tri([.6,.1,-1.1],[-.6,.1,-1.1],[0,.1,-1.9],MH.wood,22);b.box(0,.24,0,1.18,.13,.30,MH.stoneLight,22);b.beam([-.8,.28,-.8],[.9,.28,1.1],.036,MH.wood,22,6);b.pop();
}
function mhRails(b){
 const e=MORROW_ROUTE;
 ribbon(b,e,1.66,0,-.19,'#66636c',9,0,e.length,.38);ribbon(b,e,1.38,0,-.12,'#82787a',9,0,e.length,.32);
 for(let d=0;d<e.length;d+=.39){const a=e.at(d);b.matrix(basis(a.p,a.f));b.box(0,-.065,0,1.14,.085,.13,'#5a4a45',2);for(const s of[-1,1])b.box(s*.32,-.01,0,.13,.045,.17,MH.iron,11);b.pop();}
 for(const s of[-1,1]){ribbon(b,e,.07,s*.32,.027,MH.iron,11,0,e.length,.25);ribbon(b,e,.065,s*.32,.068,'#b5aca0',1,0,e.length,.25);}
}
function mhPaths(b){
 // Worn stepping stones lead to doors, graves and the glasshouse, never rails.
 for(const points of[[[3,5],[3,11],[8,16]],[[1,5],[-9,8],[-20,7]],[[8,5],[17,4],[25,1]],[[0,9],[-6,13],[-7,20]]])for(let k=1;k<points.length;k++){
  const a=points[k-1],q=points[k],n=Math.ceil(Math.hypot(a[0]-q[0],a[1]-q[1])/.55);for(let i=0;i<n;i++){const t=i/n,x=mix(a[0],q[0],t),z=mix(a[1],q[1],t);if(morrowRailDistance(x,z)<1.2)continue;b.push(x,morrowHeight(x,z)+.06,z,0,Math.atan2(q[0]-a[0],q[1]-a[1])+.03*Math.sin(i));b.box(0,0,0,1.5,.09,.48,MH.stone,4);b.pop();}
 }
}
function mhRoomCandle(b,x,y,z,s=1){
 b.cylinder(x,y+.12*s,z,.65*s,.55*s,.24*s,MH.brass,41,14);b.cylinder(x,y+1.55*s,z,.12*s,.08*s,2.9*s,MH.brass,41,10);
 for(const t of[-1,0,1]){const xx=x+t*.94*s,yy=y+(t?2.6:3.4)*s;if(t){b.beam([x,y+1.6*s,z],[xx,y+1.9*s,z],.08*s,MH.brass,41,6);b.beam([xx,y+1.9*s,z],[xx,yy,z],.075*s,MH.brass,41,6);}b.cylinder(xx,yy,z,.32*s,.32*s,.12*s,MH.brass,41,12);b.cylinder(xx,yy+.51*s,z,.14*s,.14*s,.96*s,'#d5c6a7',23,10);b.sphere(xx,yy+1.06*s,z,.10*s,.26*s,.10*s,MH.glow,25,8,6);}
}
function mhPortrait(b,x,y,z,w,h,kind=0){
 b.push(x,y,z);b.box(0,0,0,w+1.2,h+1.2,.8,MH.wood,22);b.box(0,0,.45,w+.48,h+.48,.20,MH.brass,41);b.box(0,0,.59,w,h,.08,'#3b303b',23);
 // Burnished oval mount, then a small painted profile, not a borrowed portrait.
 b.sphere(0,0,.72,w*.46,h*.46,.07,'#b39668',41,40,20);b.sphere(0,0,.80,w*.417,h*.427,.055,'#918574',23,40,20);
 const face=[[-.13,.36],[.04,.39],[.13,.34],[.15,.23],[.23,.19],[.16,.14],[.18,.08],[.11,.04],[.10,-.04],[.24,-.10],[.31,-.31],[-.31,-.31],[-.28,-.13],[-.13,-.06],[-.13,.02],[-.21,.12],[-.22,.25]],c='#283239',flip=kind%2?-1:1;
 for(let i=0;i<face.length;i++){const p=face[i],q=face[(i+1)%face.length];b.tri([0,0,.88],[p[0]*w*flip,p[1]*h,.88],[q[0]*w*flip,q[1]*h,.88],c,23);}
 if(kind%2===0){b.box(-.045*w,.38*h,.91,.36*w,.045*h,.035,c,23);b.box(-.045*w,.49*h,.91,.23*w,.19*h,.035,c,23);}else{b.sphere(-.16*w,.24*h,.9,.105*w,.11*h,.04,c,23,14,8);b.tri([-.08*w,-.055*h,.92],[.12*w,-.12*h,.92],[-.08*w,-.17*h,.92],'#b6a68c',23);}
 b.sphere(flip*.109*w,.22*h,.94,.045,.035,.013,MH.ghost,6,7,4);
 for(const side of[-1,1])for(const t of[-1,1]){b.sphere(side*w*.50,t*h*.50,.61,.40,.40,.13,MH.gold,41,8,5);for(let j=0;j<3;j++)b.beam([side*(w*.5-j*.48),t*h*.5,.63],[side*w*.5,t*(h*.5-j*.48),.63],.05,MH.brass,41,5);}
 b.pop();
}
function morrowShell(b){
 const walls=[],panel='#403840',paint='#514959';
 b.box(0,FLOOR-.3,0,158,.5,130,'#624d44',21);
 // Herringbone parquet and an Aubergine carpet anchor the human-scale parlour.
 for(let x=-74;x<76;x+=8)for(let z=-60;z<62;z+=8){b.push(x,FLOOR+.01,z,0,((Math.round(x/8)+Math.round(z/8))%2)*PI/2);for(let j=0;j<4;j++)b.box(-3+j*2,.02,0,1.9,.055,7.9,j%2?'#725746':'#685143',22);b.pop();}
 b.box(0,FLOOR+.10,0,125,.12,91,'#413646',23);for(const s of[-1,1]){b.box(s*60,FLOOR+.18,0,.22,.03,87,MH.brass,41);b.box(0,FLOOR+.18,s*42.5,120,.03,.22,MH.brass,41);}
 for(const which of['back','left','right','front']){
  const w=new Builder(),back=which==='back',front=which==='front',width=back||front?156:128,pos=back?[0,0,-64]:front?[0,0,64]:which==='left'?[-78,0,0]:[78,0,0],angle=back?0:front?PI:which==='left'?PI/2:-PI/2;
  w.push(...pos,0,angle);w.box(0,4,0,width,56,.6,paint,20);w.box(0,FLOOR+8,.5,width,16,.6,panel,22);
  for(const y of[FLOOR+.6,FLOOR+15.8,29.7,31.3])w.box(0,y,.9,width,.5,1.2,MH.brass,41);
  for(let x=-width/2+4;x<width/2;x+=8){w.box(x,FLOOR+8,.91,.18,14,.15,MH.brass,41);for(const yy of[FLOOR+2,FLOOR+14])w.box(x+4,yy,.91,7.8,.16,.15,MH.brass,41);}
  // Restrained diamond-and-flower damask, geometry rather than a borrowed image.
  for(let x=-width/2+3;x<width/2;x+=6)for(let y=-5;y<29;y+=6){const xx=x+(Math.round(y/6)%2)*3;if(Math.abs(xx)>width/2-1)continue;w.beam([xx,y-1.4,.34],[xx+1,y,.34],.022,'#79636f',23,4);w.beam([xx+1,y,.34],[xx,y+1.4,.34],.022,'#79636f',23,4);w.beam([xx,y+1.4,.34],[xx-1,y,.34],.022,'#79636f',23,4);w.beam([xx-1,y,.34],[xx,y-1.4,.34],.022,'#79636f',23,4);}
  if(back){
   // Arched theatrical moon window. The moon is a modeled disc, not an image.
   w.box(0,11,1,33,36,1.1,'#1e2c39',23);mhArch(w,0,16,1.9,16,13,.9,1.1,MH.wood,24);for(const s of[-1,1])w.box(s*16,4,1.9,.9,24,1.1,MH.wood,22);
   w.cylinder(0,17,1.66,6.5,6.5,.10,'#dddbbd',25,64,PI/2);for(let i=0;i<14;i++){const a=i*2.399,r=1.3+hash(i,71)*3.7;w.sphere(Math.cos(a)*r,17+Math.sin(a)*r,1.74,.25+hash(i,72)*.75,.25+hash(i,72)*.5,.02,'#b7bfae',23,10,6);}
   for(const x of[-10,0,10])w.box(x,10,2.25,.27,34,.28,MH.brass,41);w.box(0,5,2.25,31,.27,.28,MH.brass,41);w.box(0,18,2.25,31,.27,.28,MH.brass,41);
   for(const s of[-1,1])for(let j=0;j<10;j++){const x=s*(19+j*.67);w.cylinder(x,11.6,3,1,1,38,'#4d3043',23,10);w.cylinder(x,29.9,3,1.02,1.02,.3,MH.brass,41,10);}
   mhPortrait(w,-49,11,1.4,17,23,0);mhPortrait(w,49,11,1.4,17,23,1);
   const plaque='house-'+Object.keys(HOUSE_ROOMS).indexOf('morrow');if(roomLabels[plaque])roomFrame(w,plaque,0,-9,2,34,8);
  }else if(!front){for(const x of[-30,0,30])mhPortrait(w,x,11,1.4,14,19,Math.abs(x)%3);}
  else{w.box(0,-3,1,23,42,1.2,MH.wood,22);for(const s of[-1,1]){w.box(s*5.4,-3,1.8,9.7,38,.18,MH.panel,22);for(const yy of[-13,6])w.box(s*5.4,yy,1.98,7.2,13,.10,MH.wood,22);w.sphere(s*1.3,-4,2.3,.27,.27,.27,MH.gold,41,10,6);}}
  for(const x of[-width*.36,width*.36])mhRoomCandle(w,x,-4,3.2,1.4);w.pop();walls.push({which,mesh:w.mesh()});
 }
 return walls;
}
function mhParlour(b){
 // Tall clock, writing bureau, wingback chair and a lit Gothic fireplace.
 b.push(-62,FLOOR,-43,0,.18);b.box(0,14,0,7,28,5,MH.wood,22);b.box(0,1.2,0,8.4,2.4,6,MH.wood,22);b.box(0,25.5,.5,8.2,7,6,MH.wood,22);b.cylinder(0,25.7,3.56,2.55,2.55,.18,MH.gold,41,32,PI/2);b.cylinder(0,25.7,3.68,2.23,2.23,.06,'#c6bfaa',23,32,PI/2);b.beam([0,25.7,3.77],[1.3,26.5,3.77],.07,MH.iron,41,5);b.beam([0,25.7,3.77],[-.2,27.45,3.77],.05,MH.iron,41,5);b.box(0,13,2.54,4.5,17,.06,'#262e38',23);b.beam([0,21,2.68],[0,9,2.68],.055,MH.brass,41,6);b.cylinder(0,9,2.74,1.5,1.5,.10,MH.brass,41,24,PI/2);mhSlateRoof(b,0,29.2,.5,8.5,6.5,3,.05);b.pop();
 b.push(62,FLOOR,-33,0,-PI/2);b.box(0,6.2,0,22,12.4,6,MH.mortar,4);b.box(0,5,3.06,14,8,.1,'#222733',23);mhArch(b,0,6,3.3,6.5,3,.8,.5,MH.stoneLight,20);for(const s of[-1,1])b.box(s*7.5,4.2,3.4,1.2,8.4,1.5,MH.stoneLight,4);b.box(0,12.7,0,25,.8,8,MH.wood,22);for(let i=0;i<9;i++){b.sphere(-4+i,1.7,3.2,.65,.6,.65,'#d48859',25,8,5);b.beam([-4+i,1.5,2.5],[-2+i,1.5,4],.2,MH.wood,22,6);}mhRoomCandle(b,-8,13.1,0,1.2);mhRoomCandle(b,8,13.1,0,1.2);b.pop();
 b.push(-61,FLOOR,17,0,-.55);b.box(0,5,0,11,1.1,10,'#614052',23);b.box(0,10.5,-4.5,11,12,1.5,'#614052',23);for(const s of[-1,1]){b.box(s*5.2,7.3,0,1.5,4.1,10,'#614052',23);b.box(s*5.2,12.2,-3,2.3,6.5,3,'#614052',23);for(const zz of[-3,3])b.cylinder(s*4,2.4,zz,.40,.27,4.8,MH.wood,22,8);}for(let x=-3;x<=3;x+=3)for(let yy=8;yy<=14;yy+=3)b.sphere(x,yy,-3.69,.12,.12,.07,MH.brass,41,6,4);b.pop();
 b.cylinder(-63,FLOOR+5.5,34,5,5,.65,MH.wood,22,24);b.cylinder(-63,FLOOR+2.7,34,.5,.4,5.4,MH.wood,22,10);mhRoomCandle(b,-63,FLOOR+5.83,34,.8);
}
function mhOvergrowth(b){
 // Wind-pruned yews and tactile clumps of ivy are placed outside the loading gauge.
 for(const [cx,cz,h]of[[-41,-12,7],[-36,-18,5.7],[35,-22,6],[42,-8,6.7],[-42,13,4.8],[38,15,4.3],[-12,16,4.0]]){
  if(morrowRailDistance(cx,cz)<2.3)continue;const y=morrowHeight(cx,cz);b.beam([cx,y,cz],[cx-.3,y+h*.75,cz+.2],.15,MH.wood,22,7);
  for(let j=0;j<7;j++){const t=j/7,r=(1-t)*h*.21+.23,xx=cx+.2*Math.sin(j*1.7),zz=cz+.14*Math.cos(j);b.sphere(xx,y+.9+j*h*.12,zz,r,h*.21,r*.72,shade('#3f564c',.93+j*.023),3,9,6,true);}
 }
 for(let i=0;i<54;i++){
  const a=i*2.399,rx=15+hash(i,487)*36,x=Math.cos(a)*rx,z=Math.sin(a)*rx*.66;
  if(morrowRailDistance(x,z)<2||Math.hypot((x-3)/22,(z+13)/16)<1||Math.hypot((x-30)/11,(z-6)/9)<1||Math.abs(x-3)<6&&z>2&&z<15)continue;
  const y=morrowHeight(x,z),r=.55+hash(i,42)*.58;
  for(let j=0;j<3;j++)b.sphere(x+Math.sin(j*2.1)*r*.5,y+r*.23,z+Math.cos(j*2.1)*r*.5,r*.7,r*.44,r*.6,shade('#52624e',.89+.17*hash(i,j)),3,8,5,true);
 }
 // Climbing ivy follows masonry corners, leaving every window readable.
 for(const [cx,cz]of[[-10.85,-9.08],[18.88,-11.3]])for(let k=0;k<25;k++){
  const y=1+k*.44,x=cx+.27*Math.sin(k*.75),z=cz+.20*Math.cos(k*.7);b.beam([x,y,z],[x+.12,y+.42,z],.022,'#4c513e',22,4);
  for(let j=0;j<3;j++)b.sphere(x+(j-1)*.25,y+.15+j*.08,z+.1,.27,.18,.14,shade('#566750',.82+hash(k,j)*.28),3,7,4,true);
 }
 // The raven fountain sits beyond the stairs, beside a deliberately incomplete hedge maze.
 const x=15,z=8,y=morrowHeight(x,z);
 b.cylinder(x,y+.2,z,2.3,2.3,.40,MH.stone,4,28);b.cylinder(x,y+.42,z,1.97,1.97,.06,'#466d67',7,28);b.cylinder(x,y+1.1,z,.23,.30,1.5,MH.stoneLight,4,14);
 b.cylinder(x,y+1.86,z,1.08,1.29,.18,MH.stoneLight,4,24);b.cylinder(x,y+2.03,z,1.11,1.11,.06,'#466d67',7,24);b.cylinder(x,y+2.5,z,.14,.23,.9,MH.stone,4,12);
 b.sphere(x,y+3.13,z,.20,.36,.18,MH.iron,42,12,8);b.sphere(x,y+3.45,z+.06,.14,.14,.16,MH.iron,42,10,6);b.beam([x,y+3.41,z+.18],[x,y+3.37,z+.43],.055,MH.iron,42,5);b.tri([x-.13,y+2.98,z],[x+.13,y+2.98,z],[x,y+2.79,z-.42],MH.iron,42);
 for(const [xx,zz,w,d]of[[-9,11,7,.65],[-12.2,14,.65,6],[-8.5,17,7.8,.65],[-5,14.7,.65,4.9],[-8.5,14,3.7,.65]]){
  const yy=morrowHeight(xx,zz);b.box(xx,yy+.42,zz,w,.84,d,'#425645',3);
  const n=Math.ceil(Math.max(w,d)/.5);for(let j=0;j<n;j++)b.sphere(xx+(w>d?(j/(n-1)-.5)*w:0),yy+.84,zz+(d>w?(j/(n-1)-.5)*d:0),.44,.22,.42,'#54634c',3,7,4,true);
 }
}
function morrowRoom(scene,b){
 mhParlour(b);mhTerrain(b);mhPaths(b);mhRails(b);mhCrypt(b);mhMansion(b);mhConservatory(b);mhAbbey(b);mhGraveyard(b);mhPond(b);mhStation(b);mhOvergrowth(b);
 for(const [x,z,h,s]of[[-43,-20,10,2],[-22,-28,8,6],[23,-28,9,4],[44,-14,9,3],[45,10,8,6],[-49,7,6,8],[36,28,6,9],[23,16,4,7],[-9,-29,7,1]]){if(morrowRailDistance(x,z)>2)mhTree(b,x,morrowHeight(x,z),z,h,s);}
 // Hand-placed small stories: mushrooms, fallen masonry, autumn leaves.
 for(let i=0;i<110;i++){
  const a=i*2.399,r=12+hash(i,223)*36,x=Math.cos(a)*r,z=Math.sin(a)*r*.62;if(morrowRailDistance(x,z)<1.4||Math.hypot((x-3)/20,(z+15)/13)<1||Math.hypot((x-30)/9,(z-6)/7)<1)continue;const y=morrowHeight(x,z);
  if(i%6===0){b.cylinder(x,y+.17,z,.026,.026,.34,MH.stoneLight,23,6);b.sphere(x,y+.36,z,.19,.09,.19,i%12?MH.ghost:'#b59487',i%12?6:3,8,4);}
  else b.tri([x-.13,y+.035,z-.07],[x+.16,y+.035,z],[x,y+.048,z+.25],i%2?'#9d7e65':'#80746e',3);
 }
 scene.routes=[MORROW_ROUTE];scene.trains=[{edge:MORROW_ROUTE,distance:86,speed:.65,type:'steam',stock:'morrow',cars:3}];
 scene.height=(x,z)=>Math.abs(x)<58&&Math.abs(z)<38?morrowHeight(x,z):FLOOR;
 scene.spots=[
  {name:'Morrow House',target:[3,13,-12],distance:65,phoneDistance:105,pitch:.35,yaw:.36,detail:'A house that has not slept since 1893. Watch the clock; the last train runs beneath its foundations.'},
  {name:'The Midnight Line',target:[7,3,21],distance:30,phoneDistance:51,pitch:.27,yaw:-.30,detail:'No. XIII, The Mourning Star. A plum-and-brass locomotive with upholstered, lamplit observation carriages.'},
  {name:'The winter garden',target:[26,6,-5],distance:29,phoneDistance:48,pitch:.37,yaw:.72,detail:'Something is still growing in the glasshouse. The greenhouse, not the garden, appears to be keeping it in.'},
  {name:'The unfinished requiem',target:[-30,6,-4],distance:31,phoneDistance:50,pitch:.31,yaw:-.32,detail:'An open-air pipe organ beneath the ruined abbey. Its congregation is small, but remarkably patient.'},
  {name:'The family plot',target:[-25,3,11],distance:29,phoneDistance:48,pitch:.40,yaw:.45,detail:'Crooked stones, restless lanterns and one mausoleum door that nobody remembers opening.'},
  {name:'The undercroft',target:[18,4,-16],distance:20,phoneDistance:34,pitch:.18,yaw:1.32,detail:'A genuine railway passage through the house, with clear portals, vaulted stonework and no painted-on darkness.'},
  {name:'The haunted parlour',target:[0,1,-6],distance:167,phoneDistance:420,pitch:.52,yaw:.28,detail:'A miniature estate in a Victorian collector’s room. Moonlit curtains, portraits, a grandfather clock and a fire still burning.'}
 ];
}
registerHouseRoom('morrow',{
 name:'Morrow House',layout:'The Midnight Line',tag:'THE LAST DEPARTURE · 11:59',
 description:'A haunted Victorian estate in a candlelit collector’s parlour. A purple-and-brass steam train threads a ruined abbey, a restless garden and the open crypt beneath the mansion.',
 color:'#8c7a92',ambient:'forest',target:[0,7,-4],distance:147,phoneDistance:360,pitch:.52,yaw:.29,
 credits:[{name:'nickfromlater',platform:'github',handle:'nickfromlater',note:'Original room and Victorian rolling stock, built with agent assistance.'}],
 map:{order:12},
 lights:[[-56.16,2.244,-60.8],[56.16,2.244,-60.8],[-74.8,2.244,-46.08],[74.8,2.244,-46.08],[-63,-14.572,34],[62,-5.518,-25]],
 layoutLights:[[-1.8,4.8,4.3],[7.8,4.8,4.3],[14.8,4.8,-15.3],[-8.8,4.8,-15.3],[26,6.35,-6],[-30,3.0,-9.5],[-5,4.32,20.8],[16.5,4.32,19.1]],
 build:morrowRoom,shell:morrowShell
});
