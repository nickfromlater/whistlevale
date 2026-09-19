'use strict';

// MORROW HOUSE / SECOND PASS: the terraced estate and the collector's parlour.
// MORROW HOUSE / THE MIDNIGHT LINE. Original native geometry, no guest runtime,
// assets, atlas allocations, frame listeners, network calls or persistent state.
const MORROW={railY:1.5,deckY:7.3,width:118,depth:78};
const MH={stone:'#827c71',stoneLight:'#b9aa90',mortar:'#49484c',wall:'#72616d',panel:'#65535f',roof:'#333e47',roofLight:'#4f6169',iron:'#303b38',brass:'#9c8256',gold:'#c9aa73',glow:'#dbb984',ghost:'#94bca9',wood:'#594136',moss:'#56614f',ground:'#48594a'};
const MORROW_ROUTE=(()=>{
 const points=[[-38,19],[-16,26],[15,24],[39,18],[46,0],[39,-23],[23,-16],[14,-16],[-10,-16],[-20,-16],[-38,-24],[-47,-3],[-43,10]].map(([x,z])=>[x,MORROW.railY,z]);
 const n=points.length,curves=points.map((p,i)=>{const a=points[(i+n-1)%n],q=points[(i+1)%n],d=points[(i+2)%n];return[p,add(p,mul(sub(q,a),1/6)),sub(q,mul(sub(d,p),1/6)),q];});
 return new Edge('The Midnight Line',curves);
})();
const MORROW_TRACK_SAMPLES=Array.from({length:Math.ceil(MORROW_ROUTE.length/.65)},(_,i)=>MORROW_ROUTE.at(i*.65).p);
function morrowRailDistance(x,z){let d=Infinity;for(const p of MORROW_TRACK_SAMPLES)d=Math.min(d,(x-p[0])**2+(z-p[2])**2);return Math.sqrt(d);}
function morrowHeight(x,z){
 const hill=7.2*Math.exp(-((x+35)**2/135+(z+23)**2/90))+6.8*Math.exp(-((x-34)**2/115+(z+22)**2/88));
 let land=.62+hill+1.5*Math.exp(-((x+43)**2/74+(z-9)**2/125))+1.9*Math.exp(-((x-44)**2/74+(z-10)**2/95))+.12*Math.sin(x*.19+z*.14)+.13*Math.cos(z*.25);
 // Terraced garden rooms, not independent buildings sprinkled on a noisy plane.
 const terrace=(cx,cz,w,d,y)=>{const edge=Math.max(Math.abs(x-cx)-w/2,Math.abs(z-cz)-d/2);land=mix(land,y,1-smooth(-.2,2.2,edge));};
 terrace(-30,-6,12,15,3.9);terrace(-25,10,20,13,2.6);terrace(30,12,17,12,1.06);terrace(26,-6,15,12,2.35);
 const lake=Math.hypot((x+1)/11.3,(z-15.7)/6.45);
 land=mix(-1.05,land,smooth(.76,1.14,lake));
 const streamX=5.5+1.5*Math.sin((z-18)*.25);
 if(z>18)land=mix(-.86,land,smooth(1.15,2.7,Math.abs(x-streamX)));
 const track=morrowRailDistance(x,z),bridge=z>22.5&&Math.abs(x-streamX)<2.8;
 return mix(land,MORROW.railY-.21,(1-smooth(1,2.85,track))*(bridge?0:1));
}
// Continuous profiles, folded foliage and open fretwork keep ornament three-dimensional.
function mhLathe(b,x,y,z,profile,color,mat=4,n=10){
 for(let j=1;j<profile.length;j++){
  const [lo,r]=profile[j-1],[hi,R]=profile[j];
  for(let i=0;i<n;i++){const a=i*TAU/n,q=(i+1)*TAU/n,p=(a,h,r)=>[x+Math.cos(a)*r,y+h,z+Math.sin(a)*r];
   b.quad(p(a,lo,r),p(a,hi,R),p(q,hi,R),p(q,lo,r),color,mat);
  }
 }
}
function mhCurve(b,points,r,color=MH.brass,mat=41,n=5){
 if(points.length<2)return;
 const closed=len(sub(points[0],points[points.length-1]))<.0001,frames=points.map((p,i)=>{
  const a=points[i?i-1:closed?points.length-2:0],q=points[i+1<points.length?i+1:closed?1:i],f=norm(sub(q,a));
  const right=norm(cross(Math.abs(f[2])>.85?[0,1,0]:[0,0,1],f)),up=cross(f,right);
  return Array.from({length:n},(_,j)=>add(p,add(mul(right,Math.cos(j*TAU/n)*r),mul(up,Math.sin(j*TAU/n)*r))));
 });
 for(let i=1;i<points.length;i++)if(len(sub(points[i],points[i-1]))>.0001)for(let j=0;j<n;j++)b.quad(frames[i-1][j],frames[i-1][(j+1)%n],frames[i][(j+1)%n],frames[i][j],color,mat);
}
function mhScroll(b,x,y,z,s=1,flip=1,color=MH.brass){
 const p=[];for(let i=0;i<=12;i++){const a=i*PI*1.7/12,r=s*(.46-.32*i/12);p.push([x+Math.cos(a)*r*flip,y+Math.sin(a)*r,z]);}mhCurve(b,p,s*.027,color,41,4);
}
function mhLeaf(b,x,y,z,s,a,color){
 const f=[Math.cos(a)*s*.6,s*.43,Math.sin(a)*s*.6],q=[-Math.sin(a)*s*.40,0,Math.cos(a)*s*.40];
 const p=[x,y,z],tip=add(p,f),low=sub(p,mul(f,.5)),mid=add(p,[0,s*.1,0]);
 b.tri(tip,add(p,q),mid,color,3);b.tri(add(p,q),low,mid,shade(color,.91),3);b.tri(low,sub(p,q),mid,shade(color,.83),3);b.tri(sub(p,q),tip,mid,color,3);
}
function mhIvy(b,x,y,z,h,spread=1.5,seed=0){
 const p=[];for(let j=0;j<=Math.ceil(h/.36);j++){
  const yy=y+j*.36,xx=x+Math.sin(j*.54+seed)*spread*.22;p.push([xx,yy,z+.03*Math.sin(j)]);
  for(let k=0;k<4;k++){const a=k*2.399+j*.39,dx=Math.cos(a)*(spread*.24+hash(j,k+seed)*spread*.6);mhLeaf(b,xx+dx,yy+hash(k,j)*.26,z+.09+Math.sin(k)*.10,.27+hash(j,k)*.20,a,shade('#536448',.79+hash(j,seed+k)*.4));}
  if(j%6===0)for(let k=0;k<4;k++){const xx2=xx+(k-1.5)*.13;b.sphere(xx2,yy-.1*k,z+.25,.095,.12,.07,k%2?'#a37c99':'#cec3b4',3,5,3);}
 }mhCurve(b,p,.025,'#61583f',22,4);
}
function mhUrn(b,x,y,z,s=1,flowers=false){
 b.push(x,y,z,0,0,0,s);b.box(0,.12,0,.58,.24,.58,MH.stone,4);
 mhLathe(b,0,0,0,[[.22,.23],[.34,.14],[.48,.14],[.60,.27],[.88,.42],[1.03,.43],[1.12,.31],[1.18,.45],[1.24,.45]],MH.stoneLight,4,8);
 if(flowers)for(let j=0;j<12;j++){const a=j*2.399,r=.18+hash(j,x)*.30,xx=Math.cos(a)*r,zz=Math.sin(a)*r;mhLeaf(b,xx,1.28,zz,.34,a,'#576c50');if(j%3===0)b.sphere(xx,1.42,zz,.11,.09,.11,j%2?'#b287a0':'#e0c9ac',3,6,4);}
 b.pop();
}
function mhRail(b,a,q,y,h=.95,stone=false){
 const d=Math.hypot(q[0]-a[0],q[1]-a[1]),n=Math.max(1,Math.round(d/(stone?.62:.50))),p=t=>[mix(a[0],q[0],t),y,mix(a[1],q[1],t)];
 for(const yy of[.12,h]){const A=p(0),B=p(1);A[1]+=yy;B[1]+=yy;mhCurve(b,[A,B],stone?.075:.035,stone?MH.stoneLight:MH.iron,stone?4:41,5);}
 for(let i=0;i<=n;i++){const [x,,z]=p(i/n);if(stone)mhLathe(b,x,y,z,[[.12,.072],[.23,.073],[.32,.041],[.48,.088],[.62,.09],[.72,.044],[.88,.053]],MH.stoneLight,4,5);else{b.box(x,y+h*.53,z,.047,h,.047,MH.iron,41);b.cylinder(x,y+h+.07,z,.070,0,.18,MH.brass,41,4);}}
}
function mhAshlar(b,x,y,z,w,h,depth=.08,color=MH.stone,row=.47){
 // Shallow, individually jointed face stones. No hundreds of hidden back faces.
 const rows=Math.ceil(h/row);for(let j=0;j<rows;j++){
  const yy=y+j*row,hh=Math.min(row,h-j*row)-.045;if(hh<=0)continue;
  for(let k=-1;k<Math.ceil(w/.9)+1;k++){const lo=Math.max(-w/2,-w/2+k*.9+(j%2)*.45),hi=Math.min(w/2,-w/2+(k+1)*.9+(j%2)*.45);if(hi-lo<.07)continue;
   const left=x+lo+.025,right=x+hi-.025,top=yy+hh,zz=z+depth*(.4+hash(j,k)*.6),c=shade(color,.88+hash(k,j)*.16);
   b.quad([left,yy,zz],[right,yy,zz],[right,top,zz],[left,top,zz],c,4);b.quad([left,top,z],[left,top,zz],[right,top,zz],[right,top,z],shade(c,1.12),4);
  }
 }
}
function mhArchWall(b,x,z,width,bottom,spring,rise,r,top,depth=.75){
 // A masonry wall with an actual elliptic aperture and solid extrados spandrels.
 const pier=(width-r*2)/2;
 for(const s of[-1,1]){b.box(x+s*(r+pier/2),(bottom+top)/2,z,pier,top-bottom,depth,MH.stone,4);mhAshlar(b,x+s*(r+pier/2),bottom,z+depth/2+.005,pier,top-bottom);}
 mhArch(b,x,spring,z,r,rise,.30,depth+.08,MH.stoneLight,18);
 for(let i=0;i<18;i++){const a=i*PI/18,q=(i+1)*PI/18,xa=x+Math.cos(a)*(r+.30),xb=x+Math.cos(q)*(r+.30),ya=spring+Math.sin(a)*(rise+.30),yb=spring+Math.sin(q)*(rise+.30);
  for(const s of[-1,1])b.quad([xa,ya,z+s*depth/2],[xb,yb,z+s*depth/2],[xb,top,z+s*depth/2],[xa,top,z+s*depth/2],MH.stone,4);
 }
 b.box(x,top+.08,z,width+.1,.18,depth+.2,MH.stoneLight,4);
 b.box(x,spring+rise+.16,z+depth/2+.10,.32,.56,.19,MH.stoneLight,4);
}
function mhStair(b,x,z,width,steps,rise,run,top=0,angle=0){
 b.push(x,top,z,0,angle);for(let i=0;i<steps;i++){
  const yy=(i+1)*rise,zz=-i*run;b.box(0,yy-.13,zz,width,.26,run+.035,MH.stone,4);b.box(0,yy+.018,zz+run*.40,width+.05,.05,.12,MH.stoneLight,4);
 }b.pop();
}

function mhDormer(b,x,y,z,w=1.65,h=1.95){
 b.box(x,y,z,w,h,1.28,MH.wall,4);mhWindow(b,x,y,z+.70,w*.50,h*.71,true,1);
 const top=y+h/2,rz=z-.10;
 b.quad([x-w*.66,top,z+.9],[x,top+1.3,z+.9],[x,top+1.3,z-1.0],[x-w*.66,top,z-1.0],MH.roof,42);
 b.quad([x,top+1.3,z+.9],[x+w*.66,top,z+.9],[x+w*.66,top,z-1.0],[x,top+1.3,z-1.0],MH.roofLight,42);
 mhCurve(b,[[x-w*.72,top,z+.94],[x,top+1.4,z+.94],[x+w*.72,top,z+.94]],.065,MH.stoneLight,4,5);
 for(const s of[-1,1])mhScroll(b,x+s*.45,top+.22,z+.94,.35,s,MH.stoneLight);
 mhFinial(b,x,top+1.4,z+.8,.52);
}
function mhGothic(b,x,y,z,r,rise,t=.2,depth=.25,color=MH.stoneLight){
 const path=[];for(let side=-1;side<=1;side+=2){for(let i=0;i<=12;i++){const u=(side===-1?i:12-i)/12;path.push([x+side*r*(1-u*u),y+rise*(1.24*u-.24*u*u),z]);}}
 for(let i=1;i<path.length;i++){const a=path[i-1],q=path[i];if(len(sub(a,q))<.001)continue;const N=norm([-(q[1]-a[1]),q[0]-a[0],0]);
  b.quad(add(a,mul(N,t)),add(q,mul(N,t)),sub(q,mul(N,t)),sub(a,mul(N,t)),color,4);b.quad(add(a,[0,0,-depth]),add(q,[0,0,-depth]),q,a,shade(color,.72),4);
 }
}
function mhHedge(b,points,y,h=.93){
 const section=[[-.30,0],[-.37,.17],[-.33,.81],[-.22,1],[.22,1],[.33,.81],[.37,.17],[.30,0]];
 for(let i=1;i<points.length;i++){
  const a=points[i-1],q=points[i],d=Math.hypot(q[0]-a[0],q[1]-a[1]),n=Math.ceil(d/.5),nx=(q[1]-a[1])/d,nz=-(q[0]-a[0])/d;
  const ring=j=>section.map(([dx,yy])=>[mix(a[0],q[0],j/n)+nx*dx,y+yy*h+Math.sin(j*1.3+i)*.032,mix(a[1],q[1],j/n)+nz*dx]);
  let last=ring(0);for(let j=1;j<=n;j++){const r=ring(j);for(let k=0;k<8;k++)b.quad(last[k],r[k],r[(k+1)%8],last[(k+1)%8],shade('#485b44',.85+hash(j,k+i)*.19),3);
   if(j%2===0){const x=mix(a[0],q[0],j/n),z=mix(a[1],q[1],j/n);for(let k=0;k<3;k++)mhLeaf(b,x+nx*(k-1)*.20,y+h,z+nz*(k-1)*.20,.24,k*2.3,'#6a7650');}last=r;
  }
  for(const j of[0,n]){const r=ring(j),mid=[mix(a[0],q[0],j/n),y+h*.5,mix(a[1],q[1],j/n)];for(let k=0;k<8;k++)b.tri(mid,r[k],r[(k+1)%8],'#485b44',3);}
 }
}
function mhMaze(b){
 const cx=30,cz=12,y=1.10;
 b.box(cx,y-.11,cz,18.9,.22,13.6,MH.stone,4);
 for(let x=-8.8;x<9;x+=.76)for(let z=-6;z<6.6;z+=.76)b.quad([cx+x-.36,y+.035,cz+z-.36],[cx+x-.36,y+.035,cz+z+.36],[cx+x+.36,y+.035,cz+z+.36],[cx+x+.36,y+.035,cz+z-.36],(Math.round((x+8.8)/.76)+Math.round((z+6)/.76))%2?'#8b8c76':'#9d9980',4);
 const maze=[ [[-9,-6],[-9,6],[-1.5,6]],[[1.5,6],[9,6],[9,-6],[-9,-6]], [[-6.6,-3.8],[-6.6,3.7],[-3.0,3.7],[-3,-.8]], [[-4.5,-3.8],[6.6,-3.8],[6.6,3.7],[3.2,3.7]], [[-4.5,-3.8],[-4.5,1.5]], [[3.9,-1.6],[3.9,1.5],[.8,1.5]], [[1.5,-3.8],[1.5,-1.6],[-.8,-1.6]] ];
 for(const p of maze)mhHedge(b,p.map(([x,z])=>[cx+x,cz+z]),y,.94);
 for(const s of[-1,1]){b.box(cx+s*1.55,y+.7,cz+6.1,.67,1.4,.67,MH.stone,4);mhUrn(b,cx+s*1.55,y+1.4,cz+6.1,.55,true);mhLantern(b,cx+s*9.3,y,cz+5.9,2.8,.62);}
 mhStair(b,cx,cz+8.25,3.8,4,.24,.45,.16);
 // An armillary sundial has no practical purpose here. Its shadow points to midnight.
 b.cylinder(cx-.3,y+.15,cz+.05,.75,.75,.30,MH.stone,4,16);mhLathe(b,cx-.3,y+.3,cz+.05,[[0,.25],[.2,.34],[.8,.18],[1.05,.39],[1.13,.42]],MH.stoneLight,4,10);
 for(const a of[0,PI/2]){b.push(cx-.3,y+1.91,cz+.05,0,a,.33);mhRing(b,0,0,0,.66,.025,MH.brass,41,24);b.pop();}
 b.beam([cx-.55,y+1.40,cz+.05],[cx+.05,y+2.66,cz+.05],.019,MH.brass,41,6);
 for(const [x,z]of[[20,10],[39,10],[23,19],[38,18]])mhUrn(b,x,morrowHeight(x,z)+.1,z,.7,true);
}
function mhLibrary(b,x,y,z,w=27,h=42){
 b.push(x,y,z);b.box(0,h/2,-.6,w,h,1.3,'#332b2b',22);
 for(const s of[-1,1]){b.box(s*(w/2+.15),h/2,.7,1.3,h,4,'#685044',22);for(const dx of[-.31,.31])b.box(s*(w/2+.15)+dx,h/2,2.78,.085,h-1,.10,'#aa8355',22);}
 for(let row=0;row<5;row++){
  const yy=1+row*8.1;b.box(0,yy,.7,w,.48,4,'#765445',22);b.box(0,yy+.04,2.8,w,.18,.18,'#a08055',22);
  const count=15;let at=-w/2+.55;
  for(let i=0;i<count;i++){
   const bw=.87+hash(i,row+x)*.73,bh=4.2+hash(row,i+x)*2.6;
   b.push(at+bw/2,yy+.26,1.13,0,0,i===count-2?.075:0);b.box(0,bh/2,0,bw,bh,2.7,['#725e51','#5a6356','#59434d','#827159','#3d5250'][(i+row)%5],22);
   for(const band of[.27,bh-.31])b.box(0,band,1.37,bw*.92,.075,.04,'#bd9b65',41);b.box(0,bh*.63,1.38,bw*.48,.14,.026,'#c3ae86',23);b.pop();at+=bw+.14;if(at>w/2-1.6)break;
  }
 }
 b.box(0,h+.24,.7,w+2.3,.83,4.6,'#8e6b45',22);b.box(0,h+1.0,.7,w+.5,.65,3.4,MH.wood,22);
 for(let i=0;i<Math.ceil(w/1.1);i++)b.box(-w/2+.5+i*1.1,h-.46,2.6,.42,1.08,.8,'#a48458',22);
 b.pop();
}
function mhCurtain(b,side){
 const x=side*22.5;
 for(let j=0;j<26;j++){
  const f=j/25,ff=(j+1)/25,p=(f,t)=>{const bulge=Math.sin(t*PI);return[x+side*(f*7.5+bulge*(5.1-4*f)),29.8-t*36.9,2.65+.42*Math.sin(f*TAU*6)+.7*bulge];};
  for(let k=0;k<18;k++){const t=k/18,tt=(k+1)/18;b.quad(p(f,t),p(ff,t),p(ff,tt),p(f,tt),shade('#583449',.77+.2*Math.sin(f*TAU*6)),23);}
 }
 const tie=[];for(let i=0;i<14;i++){const a=i*PI/13;tie.push([x+side*(2.8+Math.cos(a)*4.2),3.5+Math.sin(a)*.42,4.2+Math.sin(a)*.72]);}mhCurve(b,tie,.09,'#a28451',41,7);
 const xx=x+side*5.0;b.beam([xx,3.5,4.4],[xx+.3,-.9,4.7],.08,MH.brass,41,6);mhLathe(b,xx+.3,-2.1,4.7,[[0,.25],[.25,.35],[.9,.19],[1.1,.29]],MH.brass,41,10);
}
function mhMoonWindow(b){
 const w=41,h=37;
 b.box(0,10,1,w,h,.55,'#253744',23);
 // The moon is a quietly mottled disc, not oversized dark polka-dot craters.
 for(let row=0;row<18;row++)for(let i=0;i<64;i++){
  const a=i*TAU/64,q=(i+1)*TAU/64,r=row/18*7.7,R=(row+1)/18*7.7,p=(a,r)=>[Math.cos(a)*r,15+Math.sin(a)*r,1.36];
  const c=P=>{const x=P[0],y=P[1]-15;return shade('#c8c8b1',.96-.10*Math.exp(-((x+2.8)**2/9+(y-1.2)**2/5))-.08*Math.exp(-((x-1.7)**2/6+(y+2.6)**2/3))+.019*Math.sin(x*1.6+y*.4)*Math.sin(y*1.3));};
  const A=p(a,r),B=p(q,r),C=p(a,R),D=p(q,R);if(row)for(const P of[A,B,C])b.vertex(P,[0,0,1],c(P),25);for(const P of[B,D,C])b.vertex(P,[0,0,1],c(P),25);
 }
 // Silhouetted garden branches are beyond the glass, at human rather than model scale.
 for(const side of[-1,1]){
  const p=[[side*18,-8,1.48],[side*16,2,1.48],[side*19,11,1.48],[side*15,21,1.48],[side*18,28,1.48]];mhCurve(b,p,.23,'#23323a',23,5);
  for(let i=1;i<4;i++){const A=p[i],B=[A[0]-side*(4+i),A[1]+3.2,1.48],C=[B[0]-side*2,B[1]+5,1.48];mhCurve(b,[A,B,C],.12,'#23323a',23,5);}
 }
 for(const x of[-21,-10.5,0,10.5,21])b.box(x,10,1.82,x===0?.45:.28,h,.28,'#776957',22);
 for(const y of[-8.5,2.4,13.3,24.2,28.5])b.box(0,y,1.84,w+.4,.28,.32,'#776957',22);
 mhArch(b,0,13,2.0,21,16,.8,.7,'#785c45',28);
 b.box(0,-9.05,2.7,45,.65,4,'#85684a',22);for(const s of[-1,1])b.box(s*21.2,1.8,2.1,.95,22.8,.8,'#785c45',22);
 mhCurtain(b,-1);mhCurtain(b,1);
}
function mhBook(b,x,y,z,w,d,h,c,angle=0){
 b.push(x,y,z,0,angle);for(const yy of[0,h])b.box(0,yy,0,w,.12,d,c,22);b.box(0,h/2,0,w-.20,h-.1,d-.21,'#c1ad8b',23);b.box(-w/2,h/2,0,.18,h,d,c,22);
 for(const zz of[-d*.35,d*.35])b.box(-w/2-.10,h/2,zz,.025,h,.10,MH.brass,41);for(const s of[-1,1])b.box(s*w*.41,h+.071,0,.032,.012,d*.8,'#b29565',41);b.pop();
}
function mhWillow(b){
 const x=-12,z=10,y=morrowHeight(x,z),h=6.0;
 mhTree(b,x,y,z,h,2);
 for(let i=0;i<19;i++){
  const a=i*2.399,r=1.3+hash(i,9)*1.5,xx=x+Math.cos(a)*r,zz=z+Math.sin(a)*r*.68,p=[];
  for(let j=0;j<=12;j++){const t=j/12;p.push([xx+.17*Math.sin(t*3+i),y+5.2-t*(3.3+hash(i,6)),zz+.18*Math.sin(t*2)]);if(j%2)for(const side of[-1,1])mhLeaf(b,p[j][0]+side*.13,p[j][1],p[j][2],.33,a+side,shade('#607355',.83+.18*hash(i,j)));}
  mhCurve(b,p,.016,'#69745a',22,4);
 }
}

function mhEstatePlanting(b){
 // Tapered, broken yew foliage connects the towers with the landscape silhouette.
 for(const [x,z,h]of[[-35,-18,7.2],[-31,-22,6.4],[-22,-24,7.8],[-17,-27,5.6],[24,-24,6.9],[32,-25,7.5],[39,-18,5.8],[40,-6,7],[-41,2,4.8],[-37,14,5.2],[36,21,4.1],[21,3,3.2]]){
  if(morrowRailDistance(x,z)<2.3)continue;const y=morrowHeight(x,z);b.cylinder(x,y+h*.38,z,.12,.075,h*.76,MH.wood,22,6);
  for(let row=0;row<8;row++){
   const t=row/8,yy=y+h*(.12+t*.86),r=h*.16*(1-t)+.12,top=yy+h*.18;
   for(let i=0;i<10;i++){const a=i*TAU/10,q=(i+1)*TAU/10,r1=r*(.86+.16*Math.sin(i*2.4+row)),r2=r*(.86+.16*Math.sin((i+1)*2.4+row));b.tri([x+Math.cos(a)*r1,yy+.035*Math.sin(i),z+Math.sin(a)*r1],[x+Math.cos(q)*r2,yy+.035*Math.sin(i+1),z+Math.sin(q)*r2],[x+.15*Math.sin(row),top,z+.10*Math.cos(row)],shade('#3c5544',.78+.16*hash(row,i)),3);}
  }
 }
 // Beds are clustered against architecture, with folded leaves and flower spikes.
 for(const [cx,cz,n,angle]of[[-22,-.4,15,.25],[-9,3,12,0],[17,3,10,1.3],[28,3.2,13,0],[26,21,12,0],[-37,9,12,1.4],[12,-25,8,0]])for(let i=0;i<n;i++){
  const x=cx+(i-n/2)*.53*Math.cos(angle),z=cz+(i-n/2)*.53*Math.sin(angle);if(morrowRailDistance(x,z)<1.8)continue;const y=morrowHeight(x,z);
  for(let k=0;k<7;k++){const a=k*2.399;mhLeaf(b,x+Math.cos(a)*.32,y+.10+hash(i,k)*.23,z+Math.sin(a)*.32,.44,a,shade('#60714f',.83+hash(i,k)*.2));}
  if(i%4===0){b.beam([x,y,z],[x,y+.85,z],.011,MH.moss,22,4);for(let j=0;j<5;j++)b.tri([x-.10,y+.33+j*.10,z],[x+.10,y+.33+j*.10,z],[x,y+.49+j*.10,z+.08],i%3?'#98789b':'#c2baa2',3);}
 }
}
function mhTerraceGarden(b){
 // An elevated, three-arched garden stair joins the house to the winter garden.
 b.push(20.4,0,-4.4,0,PI/2);
 for(let i=0;i<3;i++){const x=-4.2+i*3.0,top=3.6+i*1.38;mhArchWall(b,x,0,3.05,.75,1.85,1.04,1.05,top,.95);b.box(x,top+.13,0,3.15,.20,2.1,MH.stoneLight,4);}
 b.pop();
 for(let i=0;i<15;i++){
  const zz=.4-i*.62,yy=2.63+i*.335;b.box(20.4,yy-.07,zz,2.1,.14,.62,MH.stone,4);b.box(20.4,yy+.018,zz+.26,2.14,.035,.11,MH.stoneLight,4);
  for(const s of[-1,1]){b.box(20.4+s*1.10,yy+.40,zz,.08,.8,.08,MH.iron,41);if(i){const previousY=2.63+(i-1)*.335;b.beam([20.4+s*1.10,previousY+.82,zz+.62],[20.4+s*1.10,yy+.82,zz],.038,MH.brass,41,5);}}
 }
 for(const [x,z,y]of[[19.3,-8.35,7.42],[21.5,-8.35,7.42],[19.3,.4,2.65],[21.5,.4,2.65]])mhUrn(b,x,y,z,.53,true);
 // A curved limestone promenade gives the family plot a substantial planted edge.
 const points=[];for(let i=0;i<=18;i++){const t=i/18;points.push([-38+23*t,16.5+2.7*Math.sin(t*PI)]);}
 for(let i=1;i<points.length;i++){
  const A=points[i-1],B=points[i],mid=[(A[0]+B[0])/2,(A[1]+B[1])/2],length=Math.hypot(B[0]-A[0],B[1]-A[1]);
  b.matrix(basis([mid[0],0,mid[1]],[B[0]-A[0],0,B[1]-A[1]]));b.push(0,0,0,0,PI/2);
  b.box(0,1.26,0,length+.05,2.52,.60,MH.stone,4);mhAshlar(b,0,.08,.33,length,2.47,.065);b.box(0,2.57,0,length+.12,.18,.90,MH.stoneLight,4);
  if(i%2===0){b.box(0,3.15,0,.12,1.1,.13,MH.iron,41);b.cylinder(0,3.78,0,.10,0,.23,MH.brass,41,4);}b.pop();b.pop();
  b.quad([A[0],2.62,14.8],[A[0],2.62,A[1]-.35],[B[0],2.62,B[1]-.35],[B[0],2.62,14.8],'#50604a',3);
  if(i>1&&i!==8&&i!==9)mhRail(b,A,B,2.68,1.1);
  if(i%6===0)mhLantern(b,mid[0],2.68,mid[1],1.8,.6);
 }
 mhStair(b,-27,21.3,2.5,4,.25,.50,1.63);b.box(-27,2.55,19.1,2.5,.17,1.9,MH.stone,4);
 // Flowering creepers soften the retaining wall rather than fill its arch openings.
 for(const [x,z,h,spread]of[[-36,17.5,2.6,1.9],[-31,19.0,2.65,1.7],[-20,18.6,2.55,1.8],[21,-4,2.8,1.0]])mhIvy(b,x,.1,z,h,spread,x);
 // Moonwater banks: ferns, exposed roots, reeds and low limestone ledges.
 for(let i=0;i<27;i++){
  const a=i*TAU/27,xx=-1+Math.cos(a)*12.2,zz=15.7+Math.sin(a)*7.25;if(morrowRailDistance(xx,zz)<1.7||zz>21||xx>9&&zz<11)continue;const yy=morrowHeight(xx,zz);
  b.sphere(xx,yy+.14,zz,.58,.28,.48,shade('#4c5f49',.93+hash(i,1)*.12),3,6,4,true);
  for(let j=0;j<8;j++){
   const ang=j*TAU/8,tip=[xx+Math.cos(ang)*.72,yy+.5+Math.sin(j)*.10,zz+Math.sin(ang)*.72];b.beam([xx,yy+.08,zz],tip,.011,'#89916a',3,4);
   for(let k=1;k<4;k++){const t=k/4;mhLeaf(b,mix(xx,tip[0],t),mix(yy+.08,tip[1],t),mix(zz,tip[2],t),.17,ang+.7,'#6f8055');}
  }
 }
}
function mhGalleryBridge(b){
 const A=[-24.5,-2.2],B=[-8.5,-6.2],angle=Math.atan2(-(B[1]-A[1]),B[0]-A[0]);
 for(let i=0;i<4;i++){
  const t=(i+.5)/4,x=mix(A[0],B[0],t),z=mix(A[1],B[1],t),top=mix(3.92,7.43,t);
  b.push(x,0,z,0,angle);mhArchWall(b,0,0,4.18,.55,2.35,1.13,1.40,top-.16,1.20);b.box(0,top,0,4.25,.18,2.05,MH.stoneLight,4);b.pop();
 }
 for(let i=0;i<20;i++){
  const t=i/19,x=mix(A[0],B[0],t),z=mix(A[1],B[1],t),y=mix(3.92,7.43,t);b.push(x,y,z,0,angle);b.box(0,.08,0,.83,.14,2.12,MH.stone,4);b.box(.37,.166,0,.1,.04,2.15,MH.stoneLight,4);
  for(const s of[-1,1])b.box(0,.72,s*1.08,.047,1.08,.047,MH.iron,41);b.pop();
  if(i){const tt=(i-1)/19,xx=mix(A[0],B[0],tt),zz=mix(A[1],B[1],tt),yy=mix(3.92,7.43,tt);for(const s of[-1,1])b.beam([xx+Math.sin(angle)*s*1.08,yy+1.27,zz+Math.cos(angle)*s*1.08],[x+Math.sin(angle)*s*1.08,y+1.27,z+Math.cos(angle)*s*1.08],.038,MH.brass,41,5);}
 }
 b.box(-8.5,7.47,-7.2,4.4,.22,3.0,MH.stoneLight,4);
 for(const [x,z,y]of[[-24.5,-2.2,3.92],[-8.5,-6.2,7.43]]){mhUrn(b,x,y+.2,z+1.15,.57,true);mhLantern(b,x,y+.1,z-1.15,1.7,.54);}
 mhIvy(b,-17.0,.5,-3.0,3.9,1.2,4);
}

function mhRing(b,x,y,z,r,t,color=MH.brass,mat=41,n=24){const points=[];for(let i=0;i<=n;i++){const a=i*TAU/n;points.push([x+Math.cos(a)*r,y+Math.sin(a)*r,z]);}mhCurve(b,points,t,color,mat,5); }
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
 const cream='#c1b096',dark='#313d44',frame='#75665f',lamp=variant%9===0?'#8cbaa9':variant%4===0?'#c29871':'#dcb887';
 b.box(x,y,z,w+.39,h+.43,.23,MH.mortar,4);b.box(x,y,z+.125,w,h,.022,lit?lamp:dark,lit?6:23);
 for(const s of[-1,1]){
  b.box(x+s*(w/2+.06),y,z+.21,.11,h+.15,.15,cream,4);b.box(x+s*(w/2-.015),y,z+.21,.045,h,.07,frame,22);
  // Curtain folds frame, rather than flatten, the light behind the sash.
  if(lit)for(let k=0;k<3;k++){const xx=x+s*(w*.45-k*w*.046);b.quad([xx,y+h*.46,z+.18],[xx-s*w*.043,y+h*.46,z+.2],[x+s*w*.38-s*k*w*.021,y-h*.46,z+.2],[x+s*w*.42-s*k*w*.021,y-h*.46,z+.18],shade('#815263',.8+k*.12),23);}
 }
 for(const yy of[-h/2,h/2])b.box(x,y+yy,z+.23,w+.23,.1,.18,cream,4);
 b.box(x,y,z+.242,.035,h,.035,frame,22);b.box(x,y+h*.05,z+.24,w,.04,.035,frame,22);
 if(w>1.15)for(const dx of[-w*.26,w*.26])b.box(x+dx,y,z+.24,.022,h,.04,frame,22);
 b.box(x,y-h/2-.13,z+.21,w+.58,.13,.53,cream,4);for(const s of[-1,1])b.box(x+s*w*.38,y-h/2-.26,z+.19,.17,.24,.27,MH.stone,4);
 const peak=y+h/2+.60;
 b.tri([x-w*.75,y+h/2+.2,z+.19],[x+w*.75,y+h/2+.2,z+.19],[x,peak,z+.19],MH.panel,4);
 mhCurve(b,[[x-w*.8,y+h/2+.15,z+.30],[x,peak+.10,z+.30],[x+w*.8,y+h/2+.15,z+.30]],.055,cream,4,4);
 b.box(x,y+h/2+.13,z+.27,w*1.65,.09,.30,cream,4);mhRing(b,x,peak-.17,z+.31,.09,.023,MH.brass,41,8);
 if(variant%3===1)for(const s of[-1,1])mhScroll(b,x+s*w*.67,y+h/2+.27,z+.27,.34,s,cream);
}
function mhSlateRoof(b,x,y,z,w,d,h,hip=.38){
 const corners=[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]],rows=Math.max(8,Math.ceil(h/.35));
 for(let side=0;side<4;side++){
  const a=corners[side],q=corners[(side+1)%4],u=a.map(v=>v*hip),v=q.map(v=>v*hip),point=(t,f,lift=0)=>[x+mix(mix(a[0],u[0],t),mix(q[0],v[0],t),f),y+h*t+lift,z+mix(mix(a[1],u[1],t),mix(q[1],v[1],t),f)];
  b.quad(point(0,0),point(0,1),point(1,1),point(1,0),MH.roof,42);
  for(let row=0;row<rows;row++){
   const t=row/rows,tt=(row+1)/rows,n=Math.max(2,Math.round((side%2?d:w)*(1-t*(1-hip))/.48));
   for(let j=-1;j<n;j++){
    const f=Math.max(0,(j+(row%2)*.5)/n),g=Math.min(1,(j+1+(row%2)*.5)/n);if(g-f<.01)continue;
    const c=shade(MH.roofLight,.73+hash(row+17,j+side*79)*.26);
    b.quad(point(t+.018/rows,f+.013/n,.016),point(t+.018/rows,g-.013/n,.016),point(tt,g-.013/n,.032),point(tt,f+.013/n,.032),c,42);
   }
  }
  mhCurve(b,[point(0,0,.06),point(1,0,.06)],.045,MH.brass,41,6);
 }
 b.box(x,y+h+.015,z,w*hip,.12,d*hip,MH.roof,42);mhCornice(b,x,y-.38,z,w,d);
 // Modillions cast a rhythm of small shadows below the deep cornice.
 for(const side of[-1,1])for(let i=0;i<Math.floor(w/.65);i++)b.box(x-w/2+.35+i*.65,y-.45,z+side*(d/2-.08),.15,.26,.40,MH.stoneLight,4);
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
 const bark=seed%2?'#57514f':'#5a5b56';b.push(x,y,z,0,seed*.43);
 const trunk=[[0,0,0],[.04,h*.20,-.11],[.30,h*.38,.05],[-.11,h*.60,.17],[.30,h*.82,-.01],[.48,h,.06]];
 const branch=(points,r)=>{
  const n=6,frames=points.map((p,i)=>{const tangent=norm(sub(points[Math.min(i+1,points.length-1)],points[Math.max(0,i-1)])),right=norm(cross(Math.abs(tangent[2])>.85?[0,1,0]:[0,0,1],tangent)),up=cross(tangent,right),radius=r*(.90-.75*i/(points.length-1));return Array.from({length:n},(_,j)=>add(p,add(mul(right,Math.cos(j*TAU/n)*radius),mul(up,Math.sin(j*TAU/n)*radius))));});
  for(let i=1;i<frames.length;i++)for(let j=0;j<n;j++)b.quad(frames[i-1][j],frames[i-1][(j+1)%n],frames[i][(j+1)%n],frames[i][j],bark,22);
 };
 branch(trunk,h*.056);
 for(let k=0;k<6;k++){
  const a=k*2.399+seed*.1,t=.3+k*.09,r=h*(.30-.014*k),root=lerpV(trunk[1],trunk[4],(t-.2)/.62),elbow=[root[0]+Math.cos(a)*r*.6,h*(t+.10),Math.sin(a)*r*.6],tip=[Math.cos(a)*r,h*(t+.26),Math.sin(a)*r],end=[tip[0]+Math.cos(a+.4)*h*.15,tip[1]+h*.20,tip[2]+Math.sin(a+.4)*h*.15];
  branch([root,elbow,tip,end],h*.021);
  for(const side of[-1,1]){
   const q=[tip[0]+Math.cos(a+side*.7)*h*.15,tip[1]+h*.04,tip[2]+Math.sin(a+side*.7)*h*.15];branch([elbow,q,[q[0]+Math.cos(a+side*.9)*h*.14,q[1]+h*.14,q[2]+Math.sin(a+side*.9)*h*.14]],h*.009);
  }
 }
 for(let i=0;i<6;i++){const a=i*TAU/6;branch([[0,h*.10,0],[Math.cos(a)*h*.09,.18,Math.sin(a)*h*.09],[Math.cos(a)*h*.17,.015,Math.sin(a)*h*.17]],h*.025);}
 b.pop();
}
function mhTerrain(b){
 const n=128,rings=40,grid=[];
 const point=(i,r)=>{const a=i*TAU/n,s=1+.045*Math.sin(3*a+.3)+.023*Math.cos(7*a),x=Math.cos(a)*57.5*s*r,z=Math.sin(a)*35.5*s*r;return[x,morrowHeight(x,z),z];};
 for(let r=0;r<=rings;r++)grid.push(Array.from({length:n},(_,i)=>point(i,r/rings)));
 const normals=grid.map((row,r)=>row.map((p,i)=>{
  if(!r)return[0,1,0];const around=sub(row[(i+1)%n],row[(i+n-1)%n]),radial=sub(grid[Math.min(rings,r+1)][i],grid[Math.max(0,r-1)][i]);let v=norm(cross(around,radial));if(v[1]<0)v=mul(v,-1);return v;
 }));
 for(let r=0;r<rings;r++)for(let i=0;i<n;i++){
  const j=(i+1)%n,a=grid[r][i],q=grid[r][j],u=grid[r+1][i],v=grid[r+1][j],na=normals[r][i],nq=normals[r][j],nu=normals[r+1][i],nv=normals[r+1][j];
  const color=p=>{const lake=Math.hypot((p[0]+1)/11.3,(p[2]-15.7)/6.45),bank=1-smooth(.95,1.32,lake);return lerpV(shade('#505d4c',.83+.13*Math.sin(p[0]*.21+p[2]*.3)),col('#655e55'),bank*.6);};
  if(r)for(const [p,nn]of[[a,na],[q,nq],[u,nu]])b.vertex(p,nn,color(p),3);
  for(const [p,nn]of[[q,nq],[v,nv],[u,nu]])b.vertex(p,nn,color(p),3);
 }
 const rim=grid[rings];
 for(let i=0;i<n;i++){
  const a=rim[i],q=rim[(i+1)%n];
  for(const [lo,hi,s,ss,c]of[[-4.3,-3.75,.96,1,'#372b2a'],[-3.75,-.75,1,1,MH.wood],[-.75,-.51,1,1.007,'#97734c'],[-.51,-.24,1.007,1.012,MH.wood]])b.quad([a[0]*s,lo,a[2]*s],[q[0]*s,lo,q[2]*s],[q[0]*ss,hi,q[2]*ss],[a[0]*ss,hi,a[2]*ss],c,22);
  b.quad([a[0],-.24,a[2]],[q[0],-.24,q[2]],q,a,MH.mortar,4);
  if(i%4===0){const p=[a[0]*1.001,-2.15,a[2]*1.001];b.matrix(basis(p,[a[0],0,a[2]]));b.box(0,0,0,1.9,2.1,.15,'#735245',22);for(const yy of[-.95,.95])b.box(0,yy,.12,1.8,.055,.10,MH.brass,41);for(const x of[-.8,.8])b.box(x,0,.12,.05,1.9,.1,MH.brass,41);b.pop();}
 }
 for(const [x,z]of[[-39,19],[38,18],[-36,-20],[36,-20]]){
  mhLathe(b,x,FLOOR,z,[[.3,1.2],[1.0,1.5],[1.9,.72],[7.2,.62],[8.4,1.04],[9.0,.74],[15.8,.80],[17.0,1.32],[19.7,1.32]],MH.wood,22,10);
  b.beam([x,FLOOR+10,z],[x*.63,-5.1,z*.65],.38,MH.wood,22,8);
 }
}
function mhCrypt(b){
 const top=MORROW.deckY;
 b.box(3,3.9,-22.6,31,6.3,.8,MH.mortar,4);
 // The solid front bunker is replaced by four open, deep-set vaulted bays.
 for(const x of[-8.1,-.7,6.7,14.1])mhArchWall(b,x,-9.42,7.4,.65,3.6,2.05,2.38,7.05,.82);
 for(const x of[-11.9,17.9]){
  b.push(x,0,-16,0,PI/2);mhArchWall(b,0,0,10.5,.65,3.9,2.35,2.13,7.05,1.0);
  for(const s of[-1,1])mhLantern(b,s*3.10,1.3,.74,2.6,.6);b.pop();
 }
 // Barrel-vault ribs, a continuous soffit and lamp niches inside the railway.
 for(const x of[-8,-1,6,13]){b.push(x,0,-16,0,PI/2);mhArch(b,0,3.9,0,2.18,2.30,.13,.22,MH.stone,16);b.pop();}
 b.box(3,top-.14,-16.3,31,.28,14.2,MH.stone,4);mhCornice(b,3,top-.10,-16.3,31,14.3);
 for(const x of[-10.9,-4.0,10.8,17.1]){
  mhLantern(b,x,.95,-9.08,2.6,.7);mhUrn(b,x,7.63,-8.75,.85,true);
  mhIvy(b,x,.9,-8.93,5.9,1.3,Math.abs(x));
 }
 // Cut-stone stairs split briefly around a landing for a changing view.
 mhStair(b,3,3.55,7.8,17,.39,.62,.52);
 // Stone stringers ground the stair on the slope, not an unsupported flight.
 for(const side of[-1,1])for(let i=0;i<17;i++){const top=.87+i*.39,z=3.55-i*.62,base=.46;b.box(3+side*3.8,(base+top)/2,z,.38,top-base,.65,MH.stone,4);}

 for(const s of[-1,1]){
  const points=[];for(let i=0;i<17;i++){const y=.93+i*.39,x=3+s*3.96,z=3.5-i*.62;
   b.box(x,y+.22,z,.17,.62,.19,MH.stoneLight,4);points.push([x,y+.58,z]);
  }mhCurve(b,points,.07,MH.stoneLight,4,6);mhLantern(b,3+s*4.55,.85,4.3,3.0,.95);
 }
 for(const s of[-1,1]){b.box(3+s*4.1,1.02,4.15,.8,1.8,.8,MH.stone,4);mhUrn(b,3+s*4.1,1.95,4.15,.7,true);}
}
function mhMansion(b){
 const y=MORROW.deckY;
 b.box(3,y+4.4,-16.2,18,8.8,11,MH.wall,4);b.box(-7.5,y+5.1,-13.1,6.2,10.2,8,MH.panel,4);b.box(13,y+3.8,-16.8,6.8,7.6,10,MH.wall,4);
 for(const yy of[y+.5,y+4.1,y+8.35])mhCornice(b,3,yy,-16.2,18,11);
 for(let i=0;i<29;i++){const yy=y+.12+i*.30;b.box(3,yy,-10.676,18,.025,.027,'#918281',22);}
 for(const x of[-5.78,11.78])for(let i=0;i<14;i++)b.box(x,y+.33+i*.60,-10.50,.5+(i%2)*.22,.36,.37,MH.stoneLight,4);
 for(const floor of[0,1])for(let i=0;i<6;i++)mhWindow(b,-4.15+i*2.73,y+2.05+floor*4.08,-10.40,1.17,2.25,!(i===5&&floor===0),i+floor);
 // Shallow pilasters, capitals, floral reliefs and deep dentils organize the facade.
 for(let i=0;i<7;i++){const x=-5.5+i*2.74;b.box(x,y+6.1,-10.50,.17,3.2,.16,MH.stoneLight,4);b.box(x,y+7.75,-10.44,.32,.18,.28,MH.stoneLight,4);b.box(x,y+4.48,-10.44,.31,.12,.26,MH.stoneLight,4);}
 for(const x of[-6,12]){
  b.push(x,y+2.1,-16.2,0,x<0?-PI/2:PI/2);for(const z of[-3,0,3])for(const level of[0,4.1])mhWindow(b,z,level,.07,1.05,2.15,true,2);b.pop();
 }
 // Double doors, fanlight and a porch full of small, readable domestic objects.
 b.box(3,y+1.6,-10.12,2.35,3.2,.22,MH.wood,22);
 for(const s of[-1,1]){b.box(3+s*.49,y+2.08,-9.98,.74,1.15,.07,MH.glow,6);b.box(3+s*.49,y+.75,-9.94,.72,.85,.08,MH.panel,22);b.sphere(3+s*.15,y+1.46,-9.84,.058,.058,.058,MH.gold,41,8,5);}
 mhArch(b,3,y+3.2,-9.98,1.26,.66,.14,.18,MH.stoneLight,12);
 b.box(3,y+.13,-8.25,19.6,.24,4.8,MH.wood,22);
 for(let i=0;i<66;i++)b.box(-6.6+i*.29,y+.257,-8.25,.021,.012,4.45,'#423437',22);
 // Curved zinc canopy with a proper ogee section instead of a flat slab.
 for(let j=0;j<10;j++){
  const t=j/10,u=(j+1)/10,p=(x,t)=>[x,y+3.63+.64*t+.12*Math.sin(t*PI),-5.77-t*5.2];
  b.quad(p(-7,t),p(13,t),p(13,u),p(-7,u),shade(MH.roofLight,.85+j*.012),42);
 }
 for(let i=0;i<=20;i++){const x=-7+i;const p=[];for(let j=0;j<=10;j++){const t=j/10;p.push([x,y+3.65+.64*t+.12*Math.sin(t*PI),-5.77-t*5.2]);}mhCurve(b,p,.018,'#817d74',41,4);}
 for(let i=0;i<10;i++){
  const x=-6+i*2;mhLathe(b,x,y+.26,-6.05,[[0,.15],[.18,.15],[.35,.09],[1.9,.065],[2.40,.10],[2.50,.15],[2.7,.10],[3.15,.09],[3.30,.20]],MH.stoneLight,4,8);
  for(const s of[-1,1]){const p=[];for(let k=0;k<=7;k++){const a=k*PI/14;p.push([x+s*(.1+.75*Math.sin(a)),y+2.74+.76*(1-Math.cos(a)),-6.03]);}mhCurve(b,p,.042,MH.stoneLight,4,5);mhScroll(b,x+s*.44,y+3.13,-6.03,.32,s,MH.stoneLight);}
  if(i<9&&i!==4)mhRail(b,[x,-6.05],[x+2,-6.05],y+.25,.94,true);
 }
 for(let i=0;i<59;i++){
  const x=-6.8+i*.334;b.box(x,y+3.58,-5.75,.065,.32,.07,MH.stoneLight,4);
  b.tri([x-.14,y+3.68,-5.77],[x+.14,y+3.68,-5.77],[x,y+3.31,-5.77],MH.stoneLight,4);
 }
 // The upstairs promenade and a crescent bay window on the right-hand wing.
 b.box(3,y+4.47,-9.43,15.0,.17,1.85,MH.stoneLight,4);
 mhRail(b,[-4.5,-8.5],[10.5,-8.5],y+4.56,.95,false);
 for(const x of[-4.5,10.5]){mhRail(b,[x,-8.5],[x,-10.4],y+4.56,.95,false);mhUrn(b,x,y+4.56,-8.5,.48,true);}
 for(const x of[-4.6,10.8]){b.box(x,y+.8,-8.3,1.35,.16,.55,MH.wood,22);b.box(x,y+1.15,-8.55,1.35,.63,.09,MH.wood,22);for(const s of[-1,1])b.box(x+s*.45,y+.46,-8.3,.065,.6,.45,MH.iron,41);}
 mhUrn(b,0,y+.27,-7.15,.62,true);mhUrn(b,6,y+.27,-7.15,.62,true);
 mhSlateRoof(b,3,y+8.9,-16.2,19.3,12.2,5.1,.51);
 for(let i=0;i<5;i++)mhDormer(b,-4.1+i*3.55,y+10.2,-10.43,1.60,2.02);
 for(const z of[-19.3,-13.1])mhRail(b,[-1.9,z],[7.9,z],y+14.2,1.05);
 for(const x of[-1.9,7.9]){mhRail(b,[x,-19.3],[x,-13.1],y+14.2,1.05);for(const z of[-19.3,-13.1])mhFinial(b,x,y+15.2,z,.62);}
 // Belvedere clock stage with four dial faces, corbels and a gilded weather vane.
 b.box(-7.5,y+11.5,-13.1,5.9,4.8,7.5,MH.wall,4);mhCornice(b,-7.5,y+13.8,-13.1,6.0,7.6);
 for(const x of[-9.5,-5.5])mhWindow(b,x,y+11.4,-9.20,1.1,2.45,true,1);
 b.box(-7.5,y+15.5,-13.1,5.3,3.2,6.6,MH.panel,4);
 for(const angle of[0,PI/2,PI,-PI/2]){
  b.push(-7.5,y+15.55,-13.1,0,angle);const zz=Math.abs(Math.sin(angle))>.5?2.72:3.42;
  b.cylinder(0,0,zz,1.35,1.35,.14,MH.mortar,41,32,PI/2);b.cylinder(0,0,zz+.10,1.13,1.13,.045,'#d3b987',6,32,PI/2);mhRing(b,0,0,zz+.13,1.22,.047,MH.brass,41,28);
  for(let i=0;i<12;i++){const a=i*TAU/12;mhCurve(b,[[Math.sin(a)*.9,Math.cos(a)*.9,zz+.15],[Math.sin(a)*1.035,Math.cos(a)*1.035,zz+.15]],.022,MH.iron,41,4);}
  if(angle!==0){b.beam([0,0,zz+.17],[.25,.76,zz+.17],.03,MH.iron,41,5);b.beam([0,0,zz+.17],[-.52,.05,zz+.17],.04,MH.iron,41,5);}
  for(const s of[-1,1])b.box(s*2.35,0,zz-.02,.20,3.25,.15,MH.stoneLight,4);b.pop();
 }
 mhSlateRoof(b,-7.5,y+17.18,-13.1,6.9,8.0,5.25,.12);mhFinial(b,-7.5,y+22.52,-13.1,1.10);
 b.beam([-7.5,y+24,-13.1],[-7.5,y+25.2,-13.1],.035,MH.brass,41,5);b.beam([-8.3,y+24.4,-13.1],[-6.7,y+24.4,-13.1],.031,MH.brass,41,5);b.tri([-6.5,y+24.4,-13.1],[-7,y+24.7,-13.1],[-7,y+24.1,-13.1],MH.gold,41);
 for(const xx of[-9.22,-6.13])for(const floor of[0,1])mhWindow(b,xx,y+2.1+floor*4.1,-9.04,1.08,2.3,true,floor+1);
 for(const xx of[-10.44,-4.56])for(let k=0;k<16;k++)b.box(xx,y+.4+k*.65,-9.02,.34+(k%2)*.18,.46,.20,MH.stoneLight,4);
 // Oriel tower: paneled base, paired windows and a wraparound stone balcony.
 b.cylinder(16,y+5.2,-12,2.9,2.9,10.4,MH.wall,4,8);
 for(let face=0;face<8;face++){
  const a=face*TAU/8+PI/8;b.push(16,y,-12,0,a);
  for(const yy of[2.6,6.5])mhWindow(b,0,yy,2.75,.94,2.20,face!==6,face+1);
  for(const xx of[-1,1])b.box(xx,6.7,2.75,.10,7.0,.1,MH.stoneLight,4);b.pop();
 }
 b.cylinder(16,y+4.28,-12,3.25,3.25,.24,MH.stoneLight,4,8);
 for(let i=0;i<8;i++){const a=i*TAU/8,q=(i+1)*TAU/8;mhRail(b,[16+Math.cos(a)*3.2,-12+Math.sin(a)*3.2],[16+Math.cos(q)*3.2,-12+Math.sin(q)*3.2],y+4.4,.85,true);}
 b.cylinder(16,y+10.48,-12,3.28,3.28,.42,MH.stoneLight,4,8);
 for(let row=0;row<16;row++){
  const t=row/16,u=(row+1)/16,r=3.5*(1-t)+.22*t,R=3.5*(1-u)+.22*u;
  for(let i=0;i<32;i++){const a=i*TAU/32,q=(i+1)*TAU/32;b.quad([16+Math.cos(a)*r,y+10.7+t*5.2,-12+Math.sin(a)*r],[16+Math.cos(q)*r,y+10.7+t*5.2,-12+Math.sin(q)*r],[16+Math.cos(q)*R,y+10.7+u*5.2,-12+Math.sin(q)*R],[16+Math.cos(a)*R,y+10.7+u*5.2,-12+Math.sin(a)*R],shade(MH.roofLight,.75+hash(row,i)*.20),42);}
 }
 for(let i=0;i<8;i++){const a=i*TAU/8;b.beam([16+Math.cos(a)*3.5,y+10.75,-12+Math.sin(a)*3.5],[16+Math.cos(a)*.22,y+15.95,-12+Math.sin(a)*.22],.035,MH.brass,41,5);}mhFinial(b,16,y+15.95,-12,.95);
 for(const [x,z]of[[-1,-20],[8,-18.5],[13,-19.5]]){
  b.box(x,y+14.5,z,.9,3.5,1.2,MH.mortar,4);mhAshlar(b,x,y+12.75,z+.61,.9,3.5,.04,MH.stone,.23);b.box(x,y+16.35,z,1.2,.22,1.6,MH.stoneLight,4);for(const zz of[-.3,.3])mhLathe(b,x,y+16.44,z+zz,[[0,.21],[.1,.24],[.55,.19],[.68,.27],[.78,.27]],MH.stone,4,8);
 }
 for(const [x,z,h,s]of[[-10.80,-8.85,12.5,1.6],[12.08,-10.30,8.3,1.1],[18.76,-10.76,6.9,1.0]])mhIvy(b,x,y+.4,z,h,s,x);
}
function mhConservatory(b){
 const x=27,z=-5.3,y=2.55,rx=6.7,rz=5.8,n=12;
 b.cylinder(x,y-.23,z,7.05,7.05,.5,MH.stone,4,n);b.cylinder(x,y+.04,z,7.3,7.3,.13,MH.stoneLight,4,n);
 const ring=[[0,1],[1.0,.94],[2.08,.72],[2.85,.40],[3.2,.17]],point=(a,j)=>[x+Math.cos(a)*rx*ring[j][1],y+4.8+ring[j][0],z+Math.sin(a)*rz*ring[j][1]];
 for(let i=0;i<n;i++){
  const a=i*TAU/n,q=(i+1)*TAU/n,A=[x+Math.cos(a)*rx,z+Math.sin(a)*rz],B=[x+Math.cos(q)*rx,z+Math.sin(q)*rz],middle=lerpV(A,B,.5);
  mhLathe(b,A[0],y,A[1],[[0,.17],[.15,.17],[.24,.08],[4.25,.072],[4.39,.16],[4.55,.14],[4.8,.09]],MH.iron,41,8);
  if(i!==2&&i!==3){b.quad([A[0],y+.62,A[1]],[B[0],y+.62,B[1]],[B[0],y+4.35,B[1]],[A[0],y+4.35,A[1]],'#6b8b7d',76);
   for(const h of[.62,2.45,4.35])b.beam([A[0],y+h,A[1]],[B[0],y+h,B[1]],.034,MH.brass,41,5);
   b.beam([middle[0],y+.62,middle[1]],[middle[0],y+4.35,middle[1]],.025,MH.iron,41,5);
  }
  for(let j=1;j<ring.length;j++){b.quad(point(a,j-1),point(q,j-1),point(q,j),point(a,j),'#708f82',76);b.beam(point(a,j),point(q,j),.025,MH.brass,41,5);}
  mhCurve(b,ring.map((_,j)=>point(a,j)),.057,MH.iron,41,6);
  const axis=[middle[0]-x,0,middle[1]-z];b.matrix(basis([middle[0],y+4.35,middle[1]],axis));mhArch(b,0,0,.015,1.15,.43,.045,.06,MH.brass,10);for(const s of[-1,1])mhScroll(b,s*.59,.23,0,.35,s);b.pop();
 }
 b.cylinder(x,y+8.15,z,1.28,1.28,.23,MH.brass,41,12);
 for(let i=0;i<8;i++){const a=i*TAU/8; b.beam([x+Math.cos(a)*1.1,y+8.3,z+Math.sin(a)*1.1],[x+Math.cos(a)*.45,y+9.35,z+Math.sin(a)*.45],.045,MH.iron,41,5);}
 mhFinial(b,x,y+9.4,z,.7);
 // Mosaic sunburst, a butterfly specimen tree, hanging planters and a reading nook.
 for(let i=0;i<24;i++){const a=i*TAU/24,q=(i+1)*TAU/24;b.tri([x,y+.12,z],[x+Math.cos(q)*5.6,y+.12,z+Math.sin(q)*4.8],[x+Math.cos(a)*5.6,y+.12,z+Math.sin(a)*4.8],i%2?'#77796b':'#9a9580',4);}
 mhUrn(b,x,y+.13,z,1.25);
 const vine=[[x,y+1.7,z],[x-.50,y+2.8,z+.12],[x+.27,y+4,z-.14],[x-.11,y+5.7,z]];mhCurve(b,vine,.055,'#6d785b',22,7);
 for(let i=0;i<13;i++){const a=i*2.399,yy=y+1.7+i*.27,r=1.4+hash(i,3)*.6,tip=[x+Math.cos(a)*r,yy+.45,z+Math.sin(a)*r];b.beam([x,yy,z],tip,.022,MH.brass,41,5);mhLeaf(b,...tip,.9,a,i%4?'#799d83':'#a4d7bd');if(i%4===0)b.sphere(tip[0],tip[1]+.14,tip[2],.13,.2,.13,'#9fcbb2',6,8,5);}
 for(const i of[0,4,6,8,10]){const a=i*TAU/n,xx=x+Math.cos(a)*4.7,zz=z+Math.sin(a)*4.1;mhUrn(b,xx,y+.15,zz,.8,true);}
 for(const side of[-1,1]){const xx=x+side*3.6;b.box(xx,y+.70,z+.25,1.25,.18,2.4,MH.wood,22);b.box(xx+side*.50,y+1.23,z+.25,.08,1.0,2.4,MH.iron,41);for(const dz of[-.75,.75])for(const dx of[-.40,.40])b.box(xx+dx,y+.39,z+.25+dz,.075,.65,.075,MH.iron,41);}
 mhStair(b,x,z+8.4,3.9,6,.30,.43,.55);
 for(const s of[-1,1]){mhUrn(b,x+s*2.45,y+.12,z+5.7,.9,true);mhLantern(b,x+s*2.45,y+1.2,z+5.7,1.3,.7);}
}
function mhAbbey(b){
 const x=-30,z=-6,y=3.92;b.push(x,y,z,0,-.18);
 b.box(0,-.21,0,12.2,.42,16.1,MH.stone,4);
 // Uneven gable silhouette, layered archivolts and a real open rose window.
 for(const s of[-1,1]){
  const h=s<0?8.8:10.15;b.box(s*4.6,h/2,6.3,2.35,h,1.05,MH.stone,4);mhAshlar(b,s*4.6,.1,6.84,2.35,h-.1,.065,MH.stone,.44);
  b.box(s*5.8,2,5.9,.62,4,2.2,MH.stone,4);b.box(s*5.8,4.1,5.9,.9,.2,2.35,MH.stoneLight,4);
  const p=[[s*5.75,h,6.3],[s*4.7,h+.6,6.3],[s*4.4,h+1.12,6.3],[s*3.8,h+1.05,6.3],[s*3.2,12.8,6.3],[s*.9,14.2,6.3]];mhCurve(b,p,.23,MH.stone,4,5);
 }
 for(const t of[0,.29,.56])mhGothic(b,0,4.3,6.88+t*.2,2.85+t,4.9+t*.6,.14,.60);
 for(const s of[-1,1])for(const dx of[2.93,3.25,3.51])b.cylinder(s*dx,2.2,6.85,.11,.11,4.4,MH.stoneLight,4,8);
 const cy=10.8;
 mhRing(b,0,cy,6.55,2.14,.31,MH.stone,4,28);mhRing(b,0,cy,6.8,1.82,.085,MH.stoneLight,4,28);
 for(let i=0;i<10;i++){const a=i*TAU/10;mhRing(b,Math.cos(a)*1.19,cy+Math.sin(a)*1.19,6.81,.46,.055,MH.stoneLight,4,12);b.beam([Math.cos(a)*.50,cy+Math.sin(a)*.50,6.8],[Math.cos(a)*1.78,cy+Math.sin(a)*1.78,6.8],.039,MH.brass,41,5);}
 mhRing(b,0,cy,6.82,.51,.072,MH.stoneLight,4,18);
 b.cylinder(0,cy,6.54,1.76,1.76,.024,'#b38856',76,32,PI/2);
 for(let side=-1;side<=1;side+=2)for(let i=0;i<4;i++){
  const zz=-5.3+i*3.3,h=side<0?5.6+(i%3)*.7:2.8+i*.75;b.box(side*4.8,h/2,zz,1.1,h,1.05,MH.stone,4);b.box(side*5.4,1.0,zz,.55,2,1.8,MH.stone,4);
  b.box(side*4.8,h+.12,zz,1.30,.23,1.30,MH.stoneLight,4);
  if(i<3&&side<0){b.push(-4.8,0,zz+1.65,0,PI/2);mhGothic(b,0,3.7,0,1.08,2.8,.19,.6);b.pop();}
 }
 // Pipe mouths, ranks, stop knobs and keyboards make the organ a destination.
 b.box(0,1.30,-5.9,4.5,2.6,1.25,MH.wood,22);
 for(let rank=0;rank<2;rank++)for(let i=0;i<11;i++){const xx=-1.85+i*.37,h=3.0+Math.abs(i-5)*.34-rank*.5;mhLathe(b,xx,2.2,-6.2+rank*.25,[[0,.105],[h-.4,.105],[h,.14]],rank?MH.brass:'#a7aaa0',41,8);b.box(xx,2.7,-5.9+rank*.25,.11,.30,.016,MH.iron,41);}
 for(const yy of[1.22,1.49]){b.box(0,yy,-5.04,3.5,.09,.53,MH.stoneLight,23);for(let i=0;i<25;i++){b.box(-1.65+i*.135,yy+.052,-4.91,.010,.014,.21,MH.iron,41);if(i%7!==2&&i%7!==6)b.box(-1.65+i*.135,yy+.08,-5.13,.065,.07,.23,MH.iron,41);}}
 b.box(0,2.02,-5.33,1.10,.66,.075,MH.wood,22);b.box(0,2.05,-5.27,.95,.52,.016,'#c7c1a9',23);for(let i=0;i<4;i++)b.box(0,1.91+i*.07,-5.25,.85,.01,.01,MH.iron,23);
 b.box(0,.66,-3.85,1.9,.18,.48,MH.wood,22);for(const s of[-1,1])b.box(s*.73,.31,-3.85,.13,.62,.30,MH.iron,41);
 for(const s of[-1,1])for(let i=0;i<3;i++){const zz=-1.7+i*2;b.box(s*2.65,.55,zz,2.15,.19,.57,MH.wood,22);b.box(s*2.65,.91,zz+.26,2.15,.65,.08,MH.wood,22);for(const dx of[-.85,.85])b.box(s*2.65+dx,.30,zz,.12,.6,.45,MH.iron,41);}
 for(const xx of[-3.6,3.6])mhLantern(b,xx,.08,4.2,2.35,.75);
 for(const s of[-1,1])mhIvy(b,s*5.3,1,7.0,7.8,1.1,s+2);
 for(let i=0;i<13;i++){const xx=-4+hash(i,4)*8,zz=-5+hash(i,9)*10;if(Math.abs(xx)<2.2)continue;b.push(xx,.13,zz,0,i*.7,.11);b.box(0,0,0,.45+hash(i,5)*.5,.25,.45,MH.stone,4);b.pop();}
 b.pop();mhStair(b,-30,5.8,5.1,5,.25,.47,2.65,-.18);
}
function mhGraveyard(b){
 // A retaining terrace and its processional stair join the abbey, not a grid on grass.
 for(const [cx,z,w,top]of[[-30,2.05,12.8,3.90]]){b.box(cx,top/2,z,w,top,.58,MH.stone,4);mhAshlar(b,cx,.1,z+.3,w,top-.1,.07);b.box(cx,top+.08,z,w+.25,.17,.84,MH.stoneLight,4);}
 for(let i=0;i<17;i++){
  const xx=-32+(i%5)*3.25+(Math.floor(i/5)%2)*.35,zz=6.0+Math.floor(i/5)*3.0,y=morrowHeight(xx,zz),h=1.05+hash(i,52)*.52;
  b.push(xx,y,zz,0,.08*Math.sin(i*3.1),.045*Math.sin(i*2.3));b.box(0,.055,.58,1.13,.11,1.70,MH.mortar,4);
  if(i%5===0){b.box(0,.65,0,.82,1.30,.55,MH.stone,4);mhUrn(b,0,1.32,0,.6);}
  else if(i%5===1){b.box(0,h/2,0,.68,h,.18,MH.stone,4);b.tri([-.44,h, .105],[.44,h,.105],[0,h+.55,.105],MH.stoneLight,4);b.box(0,h+.40,0,.085,.50,.13,MH.stoneLight,4);b.box(0,h+.48,0,.33,.09,.13,MH.stoneLight,4);}
  else{b.box(0,h*.45,0,.77,h*.90,.22,MH.stone,4);for(let k=0;k<14;k++){const a=k*PI/14,q=(k+1)*PI/14;b.tri([0,h*.90,.115],[Math.cos(a)*.385,h*.9+Math.sin(a)*.30,.115],[Math.cos(q)*.385,h*.9+Math.sin(q)*.30,.115],MH.stone,4);}}
  for(let k=0;k<3;k++)b.box(0,h*.35+k*.13,.123,.37-k*.06,.022,.008,MH.mortar,23);
  if(i%4===0){b.sphere(.20,.16,.8,.16,.08,.15,'#866c8a',3,6,4);mhLeaf(b,.11,.12,.85,.28,.8,'#586b49');}b.pop();
 }
 for(const z of[5.5,17.4]){mhRail(b,[-36,z],[-33,z],2.65,1.1);mhRail(b,[-28,z],[-14,z],2.65,1.1);}
 for(const [xx,zz]of[[-34,5.5],[-14,17.4]])mhUrn(b,xx,2.65,zz,.95,true);
 // Weeping angel: robe folds and separate feather fans, at miniature scale.
 b.push(-15,2.65,8.0,0,-.42);b.box(0,.35,0,1.45,.70,1.45,MH.stone,4);mhLathe(b,0,.72,0,[[0,.53],[.25,.50],[1.0,.29],[1.6,.22],[1.87,.35],[2.02,.25]],'#b0ada0',4,9);b.sphere(0,3.02,-.04,.22,.25,.20,MH.stoneLight,4,10,6);
 for(const s of[-1,1]){for(let i=0;i<7;i++){const a=i*.15; b.beam([s*.17,2.3,-.08],[s*(.46+i*.11),2.52+Math.sin(a)*.65,-.2-i*.025],.05,shade(MH.stoneLight,.91+i*.012),4,5);}b.beam([s*.26,2.48,.08],[s*.12,2.78,.17],.082,MH.stoneLight,4,6);}b.pop();
 b.push(-38,morrowHeight(-38,3),3,0,.25);
 // The mausoleum is genuinely hollow, with a door hinged away from its frame.
 b.box(0,.14,0,4.9,.28,5.5,MH.stone,4);for(const s of[-1,1])b.box(s*1.93,1.6,0,.45,3.2,4.7,MH.stone,4);b.box(0,1.6,-2.15,4.3,3.2,.3,MH.stone,4);
 for(const s of[-1,1]){b.box(s*1.31,1.5,2.3,.85,3,.48,MH.stone,4);b.cylinder(s*1.55,1.6,2.57,.13,.11,3,MH.stoneLight,4,8);}b.box(0,3.25,0,4.7,.33,5.2,MH.stone,4);mhSlateRoof(b,0,3.47,0,4.9,5.5,1.55,.08);
 b.push(-.86,1.45,2.48,0,-.62);b.box(.77,0,0,1.54,2.7,.09,MH.iron,41);for(let k=0;k<5;k++)b.box(.15+k*.3,0,.06,.035,2.4,.035,MH.brass,41);b.pop();mhLantern(b,0,.2,-1,1.25,.60);b.pop();
}
function mhStation(b){
 // Sited on the inner left-hand arc, with the actual rail defining its edge.
 const base=1.72,points=[];
 for(let d=9;d<=26;d+=.5){const a=MORROW_ROUTE.at(d),r=norm([a.f[2],0,-a.f[0]]),p=add(a.p,mul(r,2.0));points.push(p);b.matrix(basis([p[0],base-.13,p[2]],a.f));b.box(0,0,0,2.3,.43,.53,MH.stone,4);b.box(-1.12,.27,0,.12,.07,.52,MH.stoneLight,4);b.pop();}
 const anchor=MORROW_ROUTE.at(17),right=norm([anchor.f[2],0,-anchor.f[0]]),at=add(anchor.p,mul(right,3.0));
 b.matrix(basis([at[0],base,at[2]],anchor.f));b.push(0,0,0,0,-PI/2);
 b.box(0,1.15,0,4.9,2.3,2.8,MH.wood,22);for(const x of[-1.55,1.55])mhWindow(b,x,1.25,1.47,.78,1.35,true,1);b.box(0,1.05,1.45,.9,2.1,.10,MH.panel,22);b.box(0,1.43,1.52,.65,.80,.018,MH.glow,6);mhSlateRoof(b,0,2.53,0,5.8,3.7,1.65,.15);
 // A little French iron canopy with a transparent central roof strip.
 for(const s of[-1,1]){b.beam([s*4,0,1.3],[s*4,3,1.3],.055,MH.iron,41,6);mhScroll(b,s*3.60,2.65,1.3,.55,s);}
 b.box(0,3.12,2.1,9.1,.12,2.8,MH.roof,42);b.box(0,3.22,1.9,7.8,.06,.65,'#93a596',76);
 for(let i=0;i<23;i++){const x=-4.4+i*.4;mhArch(b,x+.18,2.92,3.53,.18,.13,.035,.035,MH.brass,6);}
 for(const x of[-3.8,3.8]){b.box(x,.55,1.7,1.9,.14,.48,MH.wood,22);b.box(x,.90,1.50,1.9,.65,.065,MH.wood,22);for(const s of[-1,1])b.box(x+s*.69,.30,1.7,.065,.6,.4,MH.iron,41);}
 for(let i=0;i<4;i++){b.box(2.5+i*.42,.23,1.50,.38,.46,.48,i%2?'#866b53':'#60465e',22);for(const s of[-1,1])b.box(2.5+i*.42+s*.10,.23,1.75,.025,.45,.01,MH.brass,41);}
 mhLantern(b,-4.8,.05,1.7,2.45,.66);mhLantern(b,4.8,.05,1.7,2.45,.66);
 b.cylinder(0,3.67,3.50,.43,.43,.12,MH.iron,41,18,PI/2);b.cylinder(0,3.67,3.59,.35,.35,.022,'#cbb793',6,18,PI/2);b.beam([0,3.67,3.62],[-.06,3.95,3.62],.016,MH.iron,41,5);b.beam([0,3.67,3.62],[-.15,3.80,3.62],.02,MH.iron,41,5);
 b.pop();b.pop();
}
function mhPond(b){
 const x=-1,z=15.7,y=.04,n=72;
 for(let i=0;i<n;i++){const a=i*TAU/n,q=(i+1)*TAU/n,r=a=>1+.023*Math.sin(a*7)+.025*Math.sin(a*3);b.tri([x,y,z],[x+Math.cos(q)*11*r(q),y,z+Math.sin(q)*6.3*r(q)],[x+Math.cos(a)*11*r(a),y,z+Math.sin(a)*6.3*r(a)],'#456a66',7);}
 // A stream exits beneath a little arched railway bridge at the front edge.
 for(let zz=18;zz<34;zz+=.4){const xx=5.5+1.5*Math.sin((zz-18)*.25),qq=5.5+1.5*Math.sin((zz+.4-18)*.25);b.quad([xx-1.4,y,zz],[qq-1.4,y,zz+.4],[qq+1.4,y,zz+.4],[xx+1.4,y,zz],'#456a66',7);}
 for(let i=0;i<48;i++){
  const a=i*TAU/48,xx=x+Math.cos(a)*11.5,zz=z+Math.sin(a)*6.7,yy=morrowHeight(xx,zz),r=.25+hash(i,17)*.28;
  b.sphere(xx,yy+.09,zz,r*1.8,r*.64,r,MH.stone,4,7,4,true);
  for(let j=0;j<3;j++){const ang=a+.6*j;mhLeaf(b,xx+Math.sin(j)*.3,yy+.1,zz+Math.cos(j)*.3,.35,ang,'#606d4b');}
  if(i%3===0)for(let j=0;j<4;j++)b.beam([xx,yy,zz],[xx+Math.cos(a+j)*.25,yy+.50+hash(i,j)*.43,zz+Math.sin(a+j)*.25],.015,'#7c7956',3,4);
 }
 for(let i=0;i<12;i++){const a=i*2.399,xx=x+Math.cos(a)*(5+hash(i,2)*3),zz=z+Math.sin(a)*4;b.cylinder(xx,y+.023,zz,.22,.22,.015,'#66734e',3,9);if(i%4===0)b.sphere(xx,y+.08,zz,.095,.07,.09,'#c7bca2',3,6,4);}
 // Weathered landing: tapering piles, uneven individual boards, cleats and mooring.
 for(let i=0;i<16;i++)b.box(-4,.36,20.3-i*.29,2.0,.11,.26,shade(MH.wood,.95+.15*hash(i,1)),22);
 for(const xx of[-4.86,-3.14])for(const zz of[16.4,20.15]){b.cylinder(xx,.31,zz,.09,.08,1.18,MH.wood,22,8);b.cylinder(xx,.94,zz,.12,.12,.06,MH.stoneLight,22,8);}
 b.beam([-4.86,.67,16.4],[-4.86,.67,20.15],.028,MH.brass,41,5);
 b.push(-.8,y+.13,18,0,.4);
 const stations=[[-2.05,.02],[-1.68,.46],[-1.05,.65],[0,.70],[1.05,.61],[1.70,.40],[2.0,.02]];
 for(let i=1;i<stations.length;i++)for(const s of[-1,1]){const [zz,w]=stations[i-1],[q,W]=stations[i];b.quad([s*w,.36,zz],[s*W,.36,q],[s*W*.55,.03,q],[s*w*.55,.03,zz],MH.wood,22);b.quad([0,.03,zz],[0,.03,q],[s*W*.55,.03,q],[s*w*.55,.03,zz],shade(MH.wood,.7),22);b.beam([s*w,.37,zz],[s*W,.37,q],.035,'#a2835a',22,5);}
 for(const zz of[-.9,.6])b.box(0,.27,zz,1.18,.10,.29,'#99794e',22);b.beam([-.8,.41,-.9],[.84,.41,1.13],.025,'#a2865f',22,5);b.pop();
 // The actual route is bridged, not a bridge prop beside the track.
 let d=0,best=Infinity;for(let k=0;k<MORROW_ROUTE.length;k+=.2){const p=MORROW_ROUTE.at(k).p,v=(p[0]-6.8)**2+(p[2]-25)**2;if(v<best){best=v;d=k;}}
 const pose=MORROW_ROUTE.at(d);b.matrix(basis([pose.p[0],0,pose.p[2]],pose.f));b.push(0,0,0,0,PI/2);
 for(const side of[-1,1]){mhArchWall(b,0,side*.87,5.8,-.65,-.11,1.02,1.80,1.26,.25);for(let j=0;j<10;j++)b.box(-2.6+j*.58,1.62,side*.99,.49,.38,.24,MH.stone,4);b.box(0,1.85,side*.99,6,.14,.38,MH.stoneLight,4);}b.pop();b.pop();
}
function mhRails(b){
 const e=MORROW_ROUTE;
 ribbon(b,e,1.66,0,-.19,'#66636c',9,0,e.length,.38);ribbon(b,e,1.38,0,-.12,'#82787a',9,0,e.length,.32);
 for(let d=0;d<e.length;d+=.39){const a=e.at(d);b.matrix(basis(a.p,a.f));b.box(0,-.065,0,1.14,.085,.13,'#5a4a45',2);for(const s of[-1,1])b.quad([s*.32-.065,.015,-.085],[s*.32-.065,.015,.085],[s*.32+.065,.015,.085],[s*.32+.065,.015,-.085],MH.iron,11);b.pop();}
 for(const s of[-1,1]){ribbon(b,e,.07,s*.32,.027,MH.iron,11,0,e.length,.25);ribbon(b,e,.065,s*.32,.068,'#b5aca0',1,0,e.length,.25);}
}
function mhPaths(b){
 // These paths describe actual circulation around the water and up to the doors.
 const paths=[[[3,4.8],[3,7.2],[-8,8.9],[-17,8],[-28,3.6]],[[7,6],[15,5.5],[23,3.8],[27,3]],[[15,5.5],[21,7],[20,17],[26,20],[30,20]], [[-16,8],[-16,16],[-24,18],[-25,21]]];
 for(const points of paths)for(let k=1;k<points.length;k++){
  const a=points[k-1],q=points[k],n=Math.ceil(Math.hypot(a[0]-q[0],a[1]-q[1])/.55);
  for(let i=0;i<n;i++){const t=i/n,x=mix(a[0],q[0],t),z=mix(a[1],q[1],t);if(morrowRailDistance(x,z)<1.35)continue;b.push(x,morrowHeight(x,z)+.035,z,0,Math.atan2(q[0]-a[0],q[1]-a[1]));b.quad([-.80,.04,-.245],[-.80,.04,.245],[.80,.04,.245],[.80,.04,-.245],MH.stone,4);b.quad([-.80,-.04,.245],[.80,-.04,.245],[.80,.04,.245],[-.80,.04,.245],MH.stone,4);b.quad([-.74,.05,-.22],[-.74,.05,.22],[-.04,.05,.22],[-.04,.05,-.22],MH.stoneLight,4);b.pop();}
 }
}
function mhRoomCandle(b,x,y,z,s=1){
 b.cylinder(x,y+.12*s,z,.65*s,.55*s,.24*s,MH.brass,41,14);b.cylinder(x,y+1.55*s,z,.12*s,.08*s,2.9*s,MH.brass,41,10);
 for(const t of[-1,0,1]){const xx=x+t*.94*s,yy=y+(t?2.6:3.4)*s;if(t){b.beam([x,y+1.6*s,z],[xx,y+1.9*s,z],.08*s,MH.brass,41,6);b.beam([xx,y+1.9*s,z],[xx,yy,z],.075*s,MH.brass,41,6);}b.cylinder(xx,yy,z,.32*s,.32*s,.12*s,MH.brass,41,12);b.cylinder(xx,yy+.51*s,z,.14*s,.14*s,.96*s,'#d5c6a7',23,10);b.sphere(xx,yy+1.06*s,z,.10*s,.26*s,.10*s,MH.glow,25,8,6);}
}
function mhPortrait(b,x,y,z,w,h,kind=0){
 b.push(x,y,z);b.box(0,0,0,w+1.2,h+1.2,.60,MH.wood,22);
 for(const s of[-1,1]){b.box(s*(w/2+.2),0,.37,.42,h+.7,.28,'#8b6946',22);b.box(0,s*(h/2+.2),.37,w+.7,.42,.28,'#8b6946',22);}
 b.box(0,0,.37,w,h,.06,'#42383c',23);
 for(let i=0;i<48;i++){
  const a=i*TAU/48,q=(i+1)*TAU/48,p=(a,s,z)=>[Math.cos(a)*w*.48*s,Math.sin(a)*h*.48*s,z];
  b.quad(p(a,1,.45),p(q,1,.45),p(q,.94,.57),p(a,.94,.57),MH.brass,41);
  b.tri([0,0,.53],p(a,.935,.53),p(q,.935,.53),kind?'#8c8071':'#807b68',23);
 }
 const face=[[-.13,.36],[.04,.39],[.13,.34],[.15,.23],[.23,.19],[.16,.14],[.18,.08],[.11,.04],[.10,-.04],[.24,-.10],[.31,-.31],[-.31,-.31],[-.28,-.13],[-.13,-.06],[-.13,.02],[-.21,.12],[-.22,.25]],c='#293335',flip=kind%2?-1:1;
 for(let i=0;i<face.length;i++){const p=face[i],q=face[(i+1)%face.length];b.tri([0,0,.60],[p[0]*w*flip,p[1]*h,.60],[q[0]*w*flip,q[1]*h,.60],c,23);}
 if(kind%2===0){b.box(-.045*w,.38*h,.63,.36*w,.045*h,.02,c,23);b.box(-.045*w,.46*h,.63,.23*w,.14*h,.02,c,23);}
 for(const s of[-1,1])for(const t of[-1,1])mhScroll(b,s*w*.5,t*h*.5,.62,.50,s);
 b.pop();
}
function morrowShell(b){
 const walls=[];
 b.box(0,FLOOR-.25,0,158,.45,130,'#624d42',21);
 // Board parquet with a slender walnut-and-brass border around the cabinet.
 for(let x=-74;x<76;x+=5.3)for(let z=-61;z<63;z+=10.8){b.box(x,FLOOR+.011,z+(Math.round(x/5.3)%2)*.9,5.22,.035,10.6,shade('#6f5543',.9+.15*hash(x,z)),22);}
 b.box(0,FLOOR+.09,0,125,.09,92,'#3e353e',23);
 for(const s of[-1,1]){b.box(s*60,FLOOR+.15,0,.12,.023,87,MH.brass,41);b.box(0,FLOOR+.15,s*43,120,.023,.12,MH.brass,41);}
 for(const which of['back','left','right','front']){
  const w=new Builder(),back=which==='back',front=which==='front',width=back||front?156:128,pos=back?[0,0,-64]:front?[0,0,64]:which==='left'?[-78,0,0]:[78,0,0],angle=back?0:front?PI:which==='left'?PI/2:-PI/2;
  w.push(...pos,0,angle);w.box(0,4,0,width,56,.65,'#49404b',20);w.box(0,FLOOR+7.3,.45,width,14.6,.65,'#4b3732',22);
  for(const y of[FLOOR+.6,FLOOR+14.6,29.6,31.2]){w.box(0,y,.8,width,.45,1.1,'#906c45',22);w.box(0,y+.26,1.15,width,.08,.14,'#b09768',41);}
  for(let x=-width/2+1;x<width/2-8;x+=8.5){
   w.box(x+4,FLOOR+7.5,.83,6.9,11.1,.08,'#533e36',22);for(const yy of[FLOOR+2.1,FLOOR+12.9])w.box(x+4,yy,1,7.1,.14,.23,'#98734a',22);for(const dx of[.5,7.5])w.box(x+dx,FLOOR+7.5,1,.12,10.8,.23,'#98734a',22);
  }
  // Fine wallpaper sprigs are subdued so the miniature remains the focal point.
  for(let x=-width/2+4;x<width/2;x+=5.2)for(let y=-6;y<29;y+=6.5){const xx=x+(Math.floor(y/6.5)%2)*2.5;if(Math.abs(xx)>width/2-2)continue;for(const s of[-1,1])w.tri([xx,y-1,.36],[xx+s*.58,y+.15,.36],[xx,y+1.1,.36],'#615059',23);}
  if(back){mhMoonWindow(w);for(const s of[-1,1])mhLibrary(w,s*54,FLOOR+1,1.7,27,44);
   const plaque='house-'+Object.keys(HOUSE_ROOMS).indexOf('morrow');if(roomLabels[plaque])roomFrame(w,plaque,0,-14.5,1.2,30,5.8);
  }else if(!front){mhPortrait(w,-26,10,1.4,16,22,which==='left'?0:1);mhPortrait(w,28,10,1.4,13,18,which==='left'?1:0);}
  else{
   w.box(0,-3,1,23,42,1.2,MH.wood,22);for(const s of[-1,1]){w.box(s*5.4,-3,1.7,9.7,38,.17,'#584036',22);for(const yy of[-13,6]){w.box(s*5.4,yy,1.81,7.2,13,.08,'#6a4d3b',22);for(const x of[-3.35,3.35])w.box(s*5.4+x,yy,1.88,.12,12.3,.12,'#9f7d53',22);}w.sphere(s*1.3,-4,2.15,.24,.24,.24,MH.gold,41,8,5);}
  }
  for(const x of[-width*.36,width*.36])if(!back)mhRoomCandle(w,x,-4,3.2,1.4);
  w.pop();walls.push({which,mesh:w.mesh()});
 }
 return walls;
}
function mhParlour(b){
 // Carved open hearth at left, grandfather clock at right. No solid firebox slab.
 b.push(-67,FLOOR,-24,0,.9);
 b.box(0,.35,0,22,.7,9,MH.stone,4);b.box(0,5.4,-3.0,19,10.8,.75,'#332e31',4);
 for(const s of[-1,1]){b.box(s*8.1,5.8,.2,3.8,11.6,5.5,'#675044',22);b.box(s*8.1,5.4,3.04,2.6,9.0,.18,'#98714c',22);for(const dx of[-.9,.9])b.box(s*8.1+dx,5.4,3.18,.15,8.9,.12,'#be9e66',41);}
 mhArch(b,0,7.2,2.52,6.25,2.8,.54,.8,MH.stone,22);b.box(0,11.8,0,23.7,.8,7.7,'#79593e',22);b.box(0,12.37,0,24.4,.26,8.2,'#a58253',22);
 for(let i=0;i<8;i++){const x=-4+i*1.10;b.beam([x,1.1,-.3],[x+1.35,1.0,2.3],.27,'#403331',22,6);b.sphere(x,1.12,1.2,.5,.38,.5,'#b17746',25,7,4);b.sphere(x,1.9,1.3,.13,.85,.17,'#d7a76a',25,8,5);}
 for(const s of[-1,1])mhRoomCandle(b,s*8,12.6,0,1.05);mhPortrait(b,0,23.2,-.6,16,17,1);b.pop();
 b.push(64,FLOOR,-42,0,-.15);b.box(0,14,0,6.6,28,5.0,'#654b35',22);b.box(0,1.0,0,8.2,2,6.6,'#74543a',22);b.box(0,24.4,.2,8.1,8.0,6.0,'#71503a',22);
 for(const s of[-1,1]){b.cylinder(s*3.55,24.8,3.1,.23,.23,7.3,'#a28657',41,10);b.box(s*2.5,12.5,2.67,.13,19,.17,MH.brass,41);}
 b.box(0,12.3,2.61,4.65,18.9,.055,'#2d3437',23);b.beam([0,21.4,2.75],[0,7.8,2.75],.060,MH.brass,41,6);b.cylinder(0,7.8,2.86,1.26,1.26,.13,MH.brass,41,24,PI/2);
 b.cylinder(0,25.0,3.46,2.52,2.52,.15,MH.brass,41,32,PI/2);b.cylinder(0,25.0,3.58,2.27,2.27,.05,'#bcb39a',23,32,PI/2);
 for(let i=0;i<12;i++){const a=i*TAU/12;b.beam([Math.sin(a)*1.94,25+Math.cos(a)*1.94,3.62],[Math.sin(a)*2.13,25+Math.cos(a)*2.13,3.62],.043,MH.iron,41,4);}
 b.beam([0,25,3.65],[1.25,25.76,3.65],.065,MH.iron,41,5);b.beam([0,25,3.65],[-.19,26.8,3.65],.04,MH.iron,41,5);
 for(const s of[-1,1])mhScroll(b,s*1.9,29.3,2.9,2.0,s);b.cylinder(0,30,1.0,.65,0,2.2,MH.wood,22,8);b.pop();
 // Deep buttoned leather chair with rolled arms, cabriole legs and claw feet.
 b.push(62,FLOOR,12,0,-.85);
 b.box(0,5,0,10.8,1.25,9.4,'#684050',23);b.box(0,11,-4.1,11,12,1.4,'#623b4e',23);
 for(const s of[-1,1]){b.cylinder(s*5.2,7.8,0,1.25,1.25,9.6,'#6c4053',23,14,PI/2);b.box(s*5.2,12.6,-3,2.0,6.5,2.7,'#693f51',23);for(const zz of[-3,3]){mhCurve(b,[[s*4,4.5,zz],[s*4.2,2.5,zz+.3],[s*4.1,.55,zz+.75]],.29,MH.wood,22,8);b.sphere(s*4.1,.47,zz+.75,.5,.35,.7,MH.wood,22,8,5);}}
 for(let xx=-3;xx<=3;xx+=2)for(let yy=8;yy<=15;yy+=2.3)b.sphere(xx,yy,-3.33,.10,.10,.045,MH.brass,41,6,4);b.pop();
 b.cylinder(66,FLOOR+6.7,31,5.2,5.2,.65,MH.wood,22,24);mhLathe(b,66,FLOOR,31,[[.2,1.9],[.6,2.3],[1.1,.7],[4.9,.5],[6.4,1.2]],MH.wood,22,12);mhRoomCandle(b,66,FLOOR+7.05,31,.85);
 // A low collector's desk frames the foreground with books and a brass loupe.
 b.push(-59,FLOOR,38,0,.25);b.box(0,9,0,16,1,12,MH.wood,22);for(const xx of[-6,6])for(const zz of[-4.5,4.5])b.box(xx,4.3,zz,.7,8.6,.7,MH.wood,22);
 mhBook(b,-2,9.57,0,7,9,.9,'#5b444d',-.06);mhBook(b,-1.7,10.61,.2,6.7,8.4,.75,'#48594e',.10);mhBook(b,-1.2,11.5,.2,6.1,8,.6,'#765846',-.05);
 b.push(5,9.6,1.8,-PI/2);mhRing(b,0,0,0,1.45,.11,MH.brass,41,24);b.cylinder(0,0,0,1.3,1.3,.03,'#7b998b',76,24,PI/2);b.beam([1.3,0,0],[3.9,0,0],.15,MH.wood,22,8);b.pop();mhRoomCandle(b,5.2,9.55,-3.4,.65);b.pop();
}
function mhOvergrowth(b){
 // Yews are sculpted in staggered lobes; roots and foliage follow each terrace.
 for(const [cx,cz,h]of[[-41,-12,7],[-36,-18,5.7],[35,-23,7.4],[41,-8,7.6],[-42,13,6.3],[40,15,6.0],[-12,4,5.3],[21,-6,4.7],[37,0,6.7]]){
  if(morrowRailDistance(cx,cz)<2.5)continue;const y=morrowHeight(cx,cz);b.beam([cx,y,cz],[cx-.15,y+h*.8,cz+.2],.12,MH.wood,22,6);
  for(let j=0;j<8;j++){const t=j/8,r=(1-t)*h*.17+.14,xx=cx+.15*Math.sin(j*1.7),zz=cz+.16*Math.cos(j);b.sphere(xx,y+.7+j*h*.115,zz,r,h*.19,r*.84,shade('#354d42',.90+j*.035),3,7,5,true);}
 }
 // Shrubs are planted in borders, not uniform confetti across the clear lawns.
 for(const [cx,cz,n,angle]of[[-39,-9,8,.5],[-34,18,9,0],[16,4,7,1.4],[20,-24,8,.2],[36,23,7,0],[-22,-24,7,1],[18,-5,5,.2]])for(let i=0;i<n;i++){
  const x=cx+Math.cos(angle)*(i-n/2)*.8,z=cz+Math.sin(angle)*(i-n/2)*.8,y=morrowHeight(x,z);if(morrowRailDistance(x,z)<1.9)continue;
  const r=.43+hash(i,cx)*.23;b.sphere(x,y+.23,z,r,.36,r*.9,shade('#506347',.84+.18*hash(i,cz)),3,7,4,true);
  for(let k=0;k<7;k++)mhLeaf(b,x+Math.cos(k*2.399)*r,y+.32+hash(i,k)*.15,z+Math.sin(k*2.399)*r,.27,k,shade('#687753',.8+.2*hash(k,i)));
  if(i%3===0)for(let k=0;k<3;k++)b.sphere(x+(k-1)*.19,y+.55,z,.10,.13,.1,i%2?'#a888a3':'#c1ac92',3,6,4);
 }
 // Boulders have ledges and bedding. Their flat faces give scale to the banks.
 for(const [x,z]of[[-39,-4],[-39,0],[40,-17],[42,-14],[-20,-25],[22,-24],[18,3],[-12,12],[-10,20],[17,18]]){
  const y=morrowHeight(x,z);for(let j=0;j<3;j++){b.push(x+j*.18,y+.12+j*.17,z,0,j*.12,.05);b.sphere(0,0,0,1.1-j*.15,.38,.85-j*.1,shade(MH.stone,.82+j*.07),4,7,4,true);b.pop();}
 }
 // Raven fountain now has a stair-edged forecourt and a properly winged sculpture.
 const x=14,z=8,y=morrowHeight(x,z);b.cylinder(x,y+.12,z,2.65,2.65,.24,MH.stone,4,24);b.cylinder(x,y+.33,z,2.3,2.3,.30,MH.stoneLight,4,24);b.cylinder(x,y+.51,z,1.98,1.98,.025,'#456a66',7,28);
 mhLathe(b,x,y+.54,z,[[0,.33],[.18,.40],[.72,.18],[1.0,.28],[1.15,.95],[1.30,1.13],[1.44,.95],[1.55,.15],[2.0,.13]],MH.stoneLight,4,12);
 b.sphere(x,y+2.82,z,.22,.35,.18,MH.iron,42,10,6);b.sphere(x,y+3.1,z+.05,.14,.14,.16,MH.iron,42,8,5);
 for(const s of[-1,1])for(let i=0;i<6;i++)b.beam([x+s*.13,y+2.83,z],[x+s*(.4+i*.13),y+3.1+i*.045,z-.05-i*.065],.045,MH.iron,42,5);
 b.beam([x,y+3.05,z+.15],[x,y+3.04,z+.36],.032,MH.brass,41,5);
 for(const [xx,zz]of[[10.7,8],[17.3,8]])mhLantern(b,xx,morrowHeight(xx,zz),zz,2.3,.6);
}
function morrowRoom(scene,b){
 mhParlour(b);mhTerrain(b);mhPaths(b);mhRails(b);mhCrypt(b);mhMansion(b);mhConservatory(b);mhAbbey(b);mhGraveyard(b);mhPond(b);mhStation(b);mhOvergrowth(b);mhMaze(b);mhWillow(b);mhTerraceGarden(b);mhGalleryBridge(b);mhEstatePlanting(b);
 for(const [x,z,h,s]of[[-43,-20,10,2],[-22,-28,8,6],[23,-28,9,4],[44,-14,9,3],[45,10,8,6],[-49,7,6,8],[36,28,6,9],[-9,-29,7,1]]){if(morrowRailDistance(x,z)>2)mhTree(b,x,morrowHeight(x,z),z,h,s);}
 // Hand-placed small stories: mushrooms, fallen masonry, autumn leaves.
 for(let i=0;i<110;i++){
  const a=i*2.399,r=12+hash(i,223)*36,x=Math.cos(a)*r,z=Math.sin(a)*r*.62;if(morrowRailDistance(x,z)<1.4||Math.hypot((x-3)/20,(z+15)/13)<1||Math.hypot((x+1)/13,(z-15.7)/8)<1||Math.hypot((x-30)/12,(z-12)/9)<1)continue;const y=morrowHeight(x,z);
  if(i%6===0){b.cylinder(x,y+.17,z,.026,.026,.34,MH.stoneLight,23,6);b.sphere(x,y+.36,z,.19,.09,.19,i%12?MH.ghost:'#b59487',i%12?6:3,8,4);}
  else b.tri([x-.13,y+.035,z-.07],[x+.16,y+.035,z],[x,y+.048,z+.25],i%2?'#9d7e65':'#80746e',3);
 }
 scene.routes=[MORROW_ROUTE];scene.trains=[{edge:MORROW_ROUTE,distance:38,speed:.65,type:'steam',stock:'morrow',cars:3}];
 scene.height=(x,z)=>Math.abs(x)<58&&Math.abs(z)<38?morrowHeight(x,z):FLOOR;
 scene.spots=[
  {name:'Morrow House',target:[3,13,-12],distance:65,phoneDistance:105,pitch:.35,yaw:.36,detail:'A house that has not slept since 1893. Watch the clock; the last train runs beneath its foundations.'},
  {name:'The Midnight Line',target:[-23,3,21],distance:30,phoneDistance:51,pitch:.27,yaw:-.30,detail:'No. XIII, The Mourning Star. A plum-and-brass locomotive with upholstered, lamplit observation carriages.'},
  {name:'The winter garden',target:[27,6,-5],distance:29,phoneDistance:48,pitch:.37,yaw:.72,detail:'Something is still growing in the glasshouse. The greenhouse, not the garden, appears to be keeping it in.'},
  {name:'The unfinished requiem',target:[-30,8,-4],distance:31,phoneDistance:50,pitch:.31,yaw:-.32,detail:'An open-air pipe organ beneath the ruined abbey. Its congregation is small, but remarkably patient.'},
  {name:'The family plot',target:[-25,4,11],distance:29,phoneDistance:48,pitch:.40,yaw:.45,detail:'Crooked stones, restless lanterns and one mausoleum door that nobody remembers opening.'},
  {name:'The undercroft',target:[18,4,-16],distance:20,phoneDistance:34,pitch:.18,yaw:1.32,detail:'A genuine railway passage through the house, with clear portals, vaulted stonework and no painted-on darkness.'},
  {name:'The horologist’s garden',target:[30,3,12],distance:29,phoneDistance:52,pitch:.68,yaw:.42,detail:'A labyrinth in yew around a brass armillary. The way in is clear; the way out deserves another look.'},
  {name:'The moonwater landing',target:[-1,1,16],distance:32,phoneDistance:57,pitch:.31,yaw:.14,detail:'A moored skiff, worn landing and a narrow stream beneath a real railway bridge. No one has come for the boat.'},
  {name:'The haunted parlour',target:[0,1,-6],distance:167,phoneDistance:420,pitch:.52,yaw:.28,detail:'A miniature estate in a Victorian collector’s room. Moonlit curtains, portraits, a grandfather clock and a fire still burning.'}
 ];
}
registerHouseRoom('morrow',{
 name:'Morrow House',layout:'The Midnight Line',tag:'THE LAST DEPARTURE · 11:59',
 description:'A haunted Victorian estate in a candlelit collector’s parlour. A purple-and-brass steam train threads a ruined abbey, a restless garden and the open crypt beneath the mansion.',
 color:'#8c7a92',ambient:'forest',target:[0,8,-3],distance:139,phoneDistance:345,pitch:.44,yaw:.30,
 credits:[{name:'nickfromlater',platform:'github',handle:'nickfromlater',note:'Original room and Victorian rolling stock, built with agent assistance.'}],
 map:{order:12},trainCollection:false,train:{name:'The Mourning Star',number:'XIII',service:'The Midnight Line',type:'Victorian 4-4-0 steam',power:'steam'},
 lights:[[-66,-7,-24],[64,2,-42],[-74.8,2.244,-46.08],[74.8,2.244,-46.08],[-54,-11,34],[66,-13.3,31]],
 layoutLights:[[-1.55,3.85,4.3],[7.55,3.85,4.3],[18.64,3.9,-12.9],[-11.16,3.9,-12.9],[27,7.6,-5.3],[-32.8,5.25,-1.22],[-23,4.3,21],[39.3,3.9,17.9]],
 build:morrowRoom,shell:morrowShell
});
