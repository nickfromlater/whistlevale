'use strict';

// The full exhibition uses its own Builder, materials and GPU records. Keep this
// module separate from the railway renderer. Both read grandhall-data.js.
function grandHallRecord(builder,room,cast=true,options={}){
 if(!builder.data.length)return;
 const r=GRAND_HALL_GALLERIES[room];
 if(cast&&builder.data.some((v,i)=>i%12===9&&(v===71||v===72))){
  const solid=new Builder(),glazing=new Builder();for(let i=0;i<builder.data.length;i+=36){const target=[71,72].includes(builder.data[i+9])?glazing:solid;for(let j=0;j<36;j++)target.data.push(builder.data[i+j]);}
  if(solid.data.length)addRecord(gpu(solid.mesh()),trans(r.x,0,r.z),room,true,options);
  if(glazing.data.length)addRecord(gpu(glazing.mesh()),trans(r.x,0,r.z),room,false,options);
 }else addRecord(gpu(builder.mesh(),options.displayGlass),trans(r.x,0,r.z),room,cast,options);
}
function grandHallBorder(b,x,z,w,d,color,y=.024){
 for(const s of[-1,1]){b.box(x+s*w/2,y,z,.035,.016,d,color,41);b.box(x,y,z+s*d/2,w,.016,.035,color,41);}
}
// Windows occupy openings in the wall. A recessed sash, splayed plaster reveal
// and projecting stone sill make their depth legible from oblique gallery views.
function grandHallWindowPositions(r,side){
 const lateral=side==='left'||side==='right';
 if(r.id==='grand')return lateral?[-16.75,-5.75,5.75,16.75]:[-10,10];
 if(r.id==='steam')return lateral?[-17,-8,2,11]:[-8.7,8.7];
 if(r.id==='worlds')return lateral?[-11.5,1,12]:[-10,0,10];
 if(r.id==='conservatory')return lateral?[-11.4,-5.7,0,5.7,11.4]:[-13,-6.5,0,6.5,13];
 if(r.id==='architecture')return lateral?[-10,0,10]:[-9,0,9];
 if(r.id==='curiosity')return lateral?[-15]:[-6.3,6.3];
 return lateral?[-7,2,10]:[-15,-7.5,7.5,15];
}
function grandHallWindowSpec(r,x,side){
 const h=r.roof==='vault'?8.2:r.roof==='glasshouse'?5.4:r.height-1.4;
 const shape=r.id==='architecture'?[5.1,1.55,h-1.1,false]:r.id==='curiosity'?[2.25,3.25,3.9,true]:r.id==='conservatory'?[4.55,4.4,3,false]:r.id==='steam'?[4.1,3.2,4.6,false]:r.id==='grand'?[4.25,4.4,5.4,true]:r.id==='worlds'?[4.8,3.8,3.7,false]:[4.3,3.6,3.75,false];
 const [w,height,y,arch]=shape,view=(x+41+['back','right','front','left'].indexOf(side)*13.7+r.x*.3+r.z*.11)*.071;
 return{x,w,h:height,y,arch,view:view-Math.floor(view)};
}
function grandHallWindowOutline(w,h,arch,inset=0){
 const radius=w/2-inset,base=-h/2+inset,spring=h/2-w/2,points=[[-radius,base],[radius,base]];
 if(arch){for(let i=0;i<=18;i++){const a=i*Math.PI/18;points.push([Math.cos(a)*radius,spring+Math.sin(a)*radius]);}}
 else points.push([radius,h/2-inset],[-radius,h/2-inset]);
 return points;
}
function grandHallWindowRing(b,outer,inner,zOuter,zInner,color,mat=52){
 for(let i=0;i<outer.length;i++){const j=(i+1)%outer.length;b.quad([...outer[i],zOuter],[...outer[j],zOuter],[...inner[j],zInner],[...inner[i],zInner],color,mat);}
}
function grandHallGlazing(b,window,r){
 const {x,y,w,h,arch,view}=window,p=r.palette,base=-h/2,spring=h/2-w/2,radius=w/2;
 b.push(x,y,0);
 const hole=grandHallWindowOutline(w,h,arch),sash=grandHallWindowOutline(w,h,arch,.13),glass=grandHallWindowOutline(w,h,arch,.20),surround=grandHallWindowOutline(w,h,arch,-.15);
 // A shallow bevel catches daylight, followed by the darker inner reveal.
 grandHallWindowRing(b,surround,hole,.295,.23,r.id==='steam'?'#beaa8c':'#d1c8ad');
 grandHallWindowRing(b,hole,sash,.23,-.115,r.id==='curiosity'?'#9c8b70':'#bab9a0');
 grandHallWindowRing(b,sash,glass,-.105,-.095,p.metal,41);
 const q=labels.landscape,uw=.36+Math.min(.18,(w/h)*.08),u0=.045+view*(.91-uw),v0=arch?.03:.08,vh=r.id==='architecture'?.58:.88;
 const uv=point=>[mix(q.u0,q.u1,u0+(point[0]+w/2)/w*uw),mix(q.v0,q.v1,v0+(point[1]+h/2)/h*vh)];
 const tint=['#f4f8ef','#eef5ef','#f8f7eb'][Math.floor(view*3)%3],center=[0,arch?spring*.25:0];
 for(let i=0;i<glass.length;i++){const a=glass[i],c=glass[(i+1)%glass.length];b.tri([...center,-.135],[...a,-.135],[...c,-.135],tint,71,[[0,0,1],[0,0,1],[0,0,1]],[uv(center),uv(a),uv(c)]);}
 const sill=base-.065;
 b.box(0,sill,.16,w+.46,.13,.81,r.id==='curiosity'?'#a89673':'#ccc3a6',52);
 b.box(0,sill-.09,.40,w+.36,.055,.15,r.id==='curiosity'?'#8c7655':'#b8b29a',52);
 b.box(0,base+.075,-.035,w-.22,.09,.18,p.metal,41);
 const lowerTop=arch?spring:h/2-.15,lowerH=lowerTop-base-.13,railY=base+lowerH*(r.id==='conservatory'?.47:.52);
 // Structural meeting stiles are heavier than the slender glazing bars.
 for(const xx of[-w/4,0,w/4]){
  const top=arch&&xx===0?spring+radius-.17:lowerTop;
  b.box(xx,(base+.13+top)/2,-.035,xx===0?.075:.037,top-base-.13,.13,p.metal,41);
 }
 b.box(0,railY,-.017,w-.27,.067,.16,p.metal,41);
 if(arch){
  b.box(0,spring,-.025,w-.23,.075,.15,p.metal,41);
  for(const a of[Math.PI/4,Math.PI/2,Math.PI*3/4])b.beam([0,spring,-.035],[Math.cos(a)*(radius-.17),spring+Math.sin(a)*(radius-.17),-.035],.018,p.metal,41,5);
 }else if(r.id==='steam'||r.id==='conservatory'){
  const transom=h/2-.72;b.box(0,transom,-.025,w-.27,.073,.15,p.metal,41);
 }
 // Small brass catches and hinge knuckles give the opening a human scale.
 if(r.id!=='architecture'){
  b.box(.115,railY+.14,.065,.032,.15,.05,'#b39c69',41);
  for(const xx of[-w/2+.17,w/2-.17])for(const yy of[base+.46,lowerTop-.37])b.box(xx,yy,-.018,.055,.13,.16,p.metal,41);
 }
 b.pop();
}
function grandHallRoomDoors(ri){
 const r=GRAND_HALL_GALLERIES[ri],doors={left:[],right:[],back:[],front:[]};
 for(const p of GRAND_HALL_PASSAGES){if(p.from!==ri&&p.to!==ri)continue;const v=p.from===ri?p.p0:p.p1,x=v[0]-r.x,z=v[1]-r.z;
  const side=Math.abs(x)>r.width/2-.1?(x<0?'left':'right'):(z<0?'back':'front');doors[side].push({at:side==='left'||side==='right'?z:x,width:p.width,open:true});}
 for(const d of GRAND_HALL_HOUSE_DOORS)if(d.room===ri)doors[d.side].push({at:d.at,width:5.4,open:false});
 return doors;
}
function grandHallWall(b,r,side,doors){
 const lateral=side==='left'||side==='right',length=lateral?r.depth:r.width,half=length/2,h=r.roof==='vault'?8.2:r.roof==='glasshouse'?5.4:r.height-1.4,p=r.palette;
 const x=lateral?(side==='left'?-r.width/2:r.width/2):0,z=lateral?0:(side==='back'?-r.depth/2:r.depth/2),yaw=side==='left'?Math.PI/2:side==='right'?-Math.PI/2:side==='front'?Math.PI:0;
 b.push(x,0,z,0,yaw);
 // In this local frame +Z always faces into the gallery.
 const localDoors=doors.map(d=>({...d,at:(side==='left'||side==='front')?-d.at:d.at})).sort((a,c)=>a.at-c.at),windows=[];
 for(const xx of grandHallWindowPositions(r,side)){
  const win=grandHallWindowSpec(r,xx,side);if(xx+win.w/2>half-.45||localDoors.some(d=>Math.abs(xx-d.at)<d.width/2+win.w/2+.5))continue;windows.push(win);
 }
 function plain(a,c){if(c-a>.01)b.box((a+c)/2,h/2,0,c-a,h,.40,p.wall,51);}
 function segment(a,c){if(c-a<.05)return;const center=(a+c)/2,w=c-a;let start=a;
  for(const win of windows){const lo=win.x-win.w/2,hi=win.x+win.w/2;if(lo<a||hi>c)continue;plain(start,lo);
   const bottom=win.y-win.h/2,top=win.y+win.h/2;
   b.box(win.x,bottom/2,0,win.w,bottom,.4,p.wall,51);
   if(win.arch){
    const radius=win.w/2,spring=top-radius;
    for(let i=0;i<18;i++){const a=i*Math.PI/18,c=(i+1)*Math.PI/18,xa=win.x+Math.cos(a)*radius,xc=win.x+Math.cos(c)*radius,ya=spring+Math.sin(a)*radius,yc=spring+Math.sin(c)*radius;
     for(const zz of[-.20,.20])b.quad([xa,ya,zz],[xc,yc,zz],[xc,h,zz],[xa,h,zz],p.wall,51);
    }
   }else b.box(win.x,(h+top)/2,0,win.w,h-top,.4,p.wall,51);
   start=hi;
  }
  plain(start,c);
  const dado=r.id==='conservatory'?.66:1.22;b.box(center,dado/2,.23,w,dado,.10,p.trim,22);b.box(center,dado+.04,.29,w,.09,.15,p.trim,22);
  b.box(center,.09,.28,w,.18,.15,p.trim,22);
  // A continuous wall plate and stepped cornice terminate the plaster cleanly.
  b.box(center,h-.23,.22,w,.16,.18,p.wall,52);b.box(center,h-.09,.25,w,.13,.34,p.trim,52);b.box(center,h+.035,.13,w,.10,.52,p.trim,52);
  if(r.id==='curiosity')for(let xx=a+.6;xx<c-.3;xx+=1.7)b.box(xx,.63,.295,.05,1.03,.04,'#bba579',41);
  if(r.id==='steam')for(let yy=1.55;yy<h;yy+=.42){
   let edge=a;for(const win of windows){if(yy<win.y-win.h/2||yy>win.y+win.h/2)continue;const lo=win.x-win.w/2-.02,hi=win.x+win.w/2+.02;if(lo<a||hi>c)continue;if(lo>edge)b.box((edge+lo)/2,yy,.207,lo-edge,.018,.015,'#987a63',0);edge=hi;}if(c>edge)b.box((edge+c)/2,yy,.207,c-edge,.018,.015,'#987a63',0);
  }
 }
 let start=-half;
 for(const d of localDoors){const a=d.at-d.width/2,c=d.at+d.width/2;segment(start,a);b.box(d.at,(h+4.7)/2,0,d.width,h-4.7,.4,p.wall,51);
  for(const s of[-1,1]){b.box(d.at+s*(d.width/2+.12),2.35,.25,.25,4.7,.35,p.trim,52);b.box(d.at+s*(d.width/2+.12),4.73,.29,.48,.18,.48,p.trim,52);}
  b.box(d.at,4.98,.19,d.width+.6,.32,.46,p.metal,41);b.box(d.at,.011,.11,d.width,.022,.46,'#b7a377',41);
  b.box(d.at,h-.09,.25,d.width,.13,.34,p.trim,52);b.box(d.at,h+.035,.13,d.width,.10,.52,p.trim,52);
  if(!d.open){b.box(d.at,2.28,.10,d.width-.16,4.5,.16,p.metal,22);for(const s of[-1,1]){
    b.box(d.at+s*d.width/4,2.8,.21,d.width/2-.30,2.7,.06,'#9baaa1',43);
    b.box(d.at+s*d.width/4,1.26,.24,d.width/2-.30,.12,.06,p.trim,22);b.box(d.at+s*.18,1.91,.34,.045,.37,.09,'#c4ac76',41);
   }}start=c;
 }
 segment(start,half);for(const win of windows)grandHallGlazing(b,win,r);b.pop();
}
function grandHallFloor(b,r){
 const p=r.palette,w=r.width,d=r.depth,stone=['grand','architecture','conservatory','steam'].includes(r.id),material=stone?52:r.id==='worlds'?50:22;
 b.box(0,-.16,0,w,.32,d,p.floor,material);
 grandHallBorder(b,0,0,w-1.1,d-1.1,stone?'#e2dac3':'#ae946d');
 if(r.id==='grand'){
  // Limestone flags and one narrow ceremonial runner leave the first work
  // space to breathe. The paving is quiet enough to see the exhibits clearly.
  for(let x=-12;x<=12;x+=4)b.box(x,.009,0,.018,.012,d-.7,'#b1ae9c',52);
  for(let z=-20;z<=20;z+=4)b.box(0,.009,z,w-.7,.012,.018,'#b1ae9c',52);
  b.box(0,.017,-1.5,3.1,.022,d-3.4,'#526b61',53);grandHallBorder(b,0,-1.5,2.9,d-3.7,'#ad9d72',.034);
  b.push(-5,.031,10,0,0,0,1.06,1,1);b.cylinder(0,0,0,3.0,3.0,.018,'#b6aa8f',52,32);b.cylinder(0,.013,0,2.86,2.86,.012,'#d7cfb8',52,32);b.pop();
 }else if(r.id==='steam'){
  for(const x of[-8.7,8.7]){b.box(x,.015,-1,3.3,.025,d-3.5,'#7d8580',52);for(const side of[-1,1])b.box(x+side*1.8,.028,-1,.065,.012,d-3.5,'#c8b47a',41);}
  b.box(0,.030,-4.7,w-.6,.012,2.55,'#abb0a1',52);
  for(let z=-d/2+1.3;z<d/2;z+=4)b.box(0,.012,z,w-.8,.008,.022,'#818b83',52);
 }else if(r.id==='worlds'){
  for(const [x,z,sx,sz]of[[-9,-10,1.15,.82],[8.5,-6.5,1.2,.95],[-8.2,5.2,1.22,.9],[8.5,9,1.07,.95]]){b.push(x,.018,z,0,0,0,sx,1,sz);b.cylinder(0,0,0,4.5,4.5,.012,'#978468',53,32);b.pop();}
 }else if(r.id==='conservatory'){
  for(let x=-w/2+1.5;x<w/2;x+=3)for(let z=-d/2+1.5;z<d/2;z+=3)b.box(x,.009,z,2.96,.010,2.96,(Math.round(x+z)%2)?'#c8ceba':'#bcc5af',52);
  for(const x of[-2.2,2.2])b.box(x,.026,0,.075,.015,d-.5,'#81977d',41);
  b.box(0,.025,0,4.2,.018,d-.5,'#d6d9c2',52);
 }else if(r.id==='architecture'){
  for(let x=-w/2+2;x<w/2;x+=3.5)b.box(x,.008,0,.015,.01,d,'#9fa79e',52);
  for(let z=-d/2+2;z<d/2;z+=3.5)b.box(0,.008,z,w,.01,.015,'#9fa79e',52);
  grandHallBorder(b,0,-3.5,10.8,12.0,'#dbdccf',.022);
 }else if(r.id==='curiosity'){
  for(let x=-w/2+1;x<w/2;x+=.72)b.box(x,.012,0,.014,.01,d,'#4c3a2f',22);
  b.box(0,.025,0,3.4,.03,d-1.5,'#6b5147',53);grandHallBorder(b,0,0,3.15,d-1.8,'#b28a5b',.045);
  b.cylinder(0,.05,-2,2.5,2.5,.018,'#715e4c',53,8);
 }else{
  for(let z=-d/2+.6;z<d/2;z+=.65)b.box(0,.012,z,w,.01,.015,'#8d7152',22);
  for(const x of[-4.5,4.5])b.box(x,.017,0,.045,.012,d-1,'#c6b08a',41);
 }
}
function grandHallArchFrame(b,x,z,span,spring,rise,color,detail=false){
 const n=30;
 for(const s of[-1,1]){b.box(x+s*span,.19,z,.65,.38,.65,'#989980',52);b.cylinder(x+s*span,spring/2,z,.12,.10,spring,color,41,10);b.box(x+s*span,spring,z,.48,.22,.48,color,41);}
 for(let i=0;i<n;i++){const a=i*Math.PI/n,c=(i+1)*Math.PI/n,p=[x+Math.cos(a)*span,spring+Math.sin(a)*rise,z],q=[x+Math.cos(c)*span,spring+Math.sin(c)*rise,z];b.beam(p,q,.065,color,41,6);
  if(detail&&i>0&&i<n-1){b.beam(p,[x+Math.cos(a)*(span-.43),spring+Math.sin(a)*(rise-.43),z],.019,'#bea878',41,5);b.beam([x+Math.cos(a)*(span-.43),spring+Math.sin(a)*(rise-.43),z],q,.014,'#899784',41,5);}
 }
}
function grandHallVaultEnd(b,r,z,yaw,span,spring,rise){
 b.push(0,0,z,0,yaw);const q=labels.landscape,n=36,inner=span-.56,innerRise=rise-.30,base=spring+.16,depth=.21;
 const uv=(x,y)=>[mix(q.u0,q.u1,.10+(x/inner+1)*.38),mix(q.v0,q.v1,.57+(y-base)/innerRise*.35)];
 b.box(0,spring+.055,.015,span*2,.16,.46,r.palette.trim,52);
 // The glazed tympanum closes the barrel against its end wall. Its masonry
 // border follows the exact same ellipse as the roof instead of a rough seam.
 for(let i=0;i<n;i++){
  const a=i*Math.PI/n,c=(i+1)*Math.PI/n,oa=[Math.cos(a)*span,spring+Math.sin(a)*rise],oc=[Math.cos(c)*span,spring+Math.sin(c)*rise],ia=[Math.cos(a)*inner,base+Math.sin(a)*innerRise],ic=[Math.cos(c)*inner,base+Math.sin(c)*innerRise];
  b.quad([...oa,depth],[...oc,depth],[...ic,depth],[...ia,depth],r.palette.wall,52);
  b.quad([...ia,depth],[...ic,depth],[...ic,-.12],[...ia,-.12],'#aaa995',52);
  b.tri([0,base,-.14],[...ia,-.14],[...ic,-.14],'#eef5ef',71,[[0,0,1],[0,0,1],[0,0,1]],[uv(0,base),uv(...ia),uv(...ic)]);
  b.beam([...ia,-.055],[...ic,-.055],.045,r.palette.metal,41,5);
 }
 b.box(0,base,-.025,inner*2,.10,.16,r.palette.metal,41);
 for(let x=-12;x<=12;x+=3){if(Math.abs(x)>=inner)continue;const top=base+Math.sqrt(1-x*x/(inner*inner))*innerRise;b.box(x,(top+base)/2,-.035,.062,top-base,.14,r.palette.metal,41);}
 b.box(0,base+.9,-.02,2*inner*Math.sqrt(1-.9*.9/(innerRise*innerRise)),.055,.13,r.palette.metal,41);
 b.pop();
}
function grandHallGlazedGable(b,r,z,profile,base){
 b.push(0,0,z,0,z<0?0:Math.PI);const q=labels.landscape,width=profile[profile.length-1][0]-profile[0][0],top=Math.max(...profile.map(p=>p[1]));
 const uv=(x,y)=>[mix(q.u0,q.u1,.09+(x/width+.5)*.82),mix(q.v0,q.v1,.56+(y-base)/(top-base)*.36)];
 for(let i=1;i<profile.length;i++){
  const a=profile[i-1],c=profile[i],pa=[a[0],base,-.12],pc=[c[0],base,-.12],ta=[...a,-.12],tc=[...c,-.12];
  b.quad(pa,pc,tc,ta,'#eef5ef',71,[0,0,1],[uv(pa[0],pa[1]),uv(pc[0],pc[1]),uv(tc[0],tc[1]),uv(ta[0],ta[1])]);
  b.beam([...a,.07],[...c,.07],.085,r.palette.metal,41,6);
  const count=Math.ceil((c[0]-a[0])/2.1);for(let j=0;j<count;j++){const t=j/count,x=mix(a[0],c[0],t),y=mix(a[1],c[1],t);if(y>base+.06)b.box(x,(y+base)/2,.015,.055,y-base,.13,r.palette.metal,41);}
 }
 b.box(0,base,.015,width,.16,.25,r.palette.metal,41);b.pop();
}
function grandHallPendant(b,r,x,y,z){
 const metal=r.palette.metal,ceiling=r.height-.3;
 // Suspension length belongs to the architecture; the light stays above eye
 // level in every arrival view. Small fixtures preserve the generous volume.
 const cy=r.id==='grand'?5.7:r.id==='steam'?4.7:r.id==='worlds'?4.55:r.id==='conservatory'?4.7:r.id==='curiosity'?4.0:4.45;
 if(r.id==='grand'){
  b.box(x,(ceiling+cy)/2,z,.024,ceiling-cy,.024,metal,41);b.cylinder(x,cy,z,.23,.27,.58,'#e5dfc8',72,12);for(const yy of[cy-.30,cy+.30])b.cylinder(x,yy,z,.29,.29,.07,'#a88d5c',41,12);b.sphere(x,cy-.24,z,.15,.13,.15,'#f8e6b8',10,8,5);
 }else if(r.id==='steam'||r.id==='workshop'){
  b.box(x,(ceiling+cy)/2,z,.022,ceiling-cy,.022,metal,41);b.cylinder(x,cy,z,.42,.12,.26,r.id==='steam'?'#c7c6b2':'#697d70',41,12);b.cylinder(x,cy-.15,z,.37,.37,.025,'#e7dcbc',10,12);
 }else if(r.id==='worlds'){
  b.box(x,(ceiling+cy)/2,z,.02,ceiling-cy,.02,'#8d7552',41);b.cylinder(x,cy,z,.36,.33,.55,'#d5c4a0',53,12);b.cylinder(x,cy-.29,z,.31,.31,.018,'#f1e2bd',10,12);for(const side of[-1,1])b.box(x+side*.31,cy,z,.025,.61,.025,'#92754e',22);
 }else if(r.id==='curiosity'){
  b.box(x,(ceiling+cy)/2,z,.018,ceiling-cy,.018,'#8e6d43',41);b.sphere(x,cy,z,.24,.31,.24,'#ede0ba',72,10,6);b.cylinder(x,cy+.30,z,.1,.14,.09,'#a98750',41,10);b.cylinder(x,cy-.28,z,.12,.12,.05,'#ffe7b1',10,10);
 }else{
  b.box(x,(ceiling+cy)/2,z,.02,ceiling-cy,.02,metal,41);b.cylinder(x,cy,z,.14,.10,.32,'#ecebda',72,10);b.cylinder(x,cy-.17,z,.12,.12,.025,'#f2e9c8',10,10);
 }
}
function grandHallRoof(b,r){
 const w=r.width/2-.05,d=r.depth/2-.05,p=r.palette,h=r.height;
 if(r.roof==='vault'){
  const spring=8.2,rise=h-spring,span=r.width/2-.08,end=r.depth/2,frames=[-end+1,-end*.5,0,end*.5,end-1];
  for(const z of frames)grandHallArchFrame(b,0,z,span-.18,spring,rise-.12,p.metal,true);
  for(const side of[-1,1]){
   b.box(side*(span-.06),spring-.025,0,.24,.25,r.depth,p.metal,41);
   b.box(side*(span-.12),spring-.20,0,.39,.10,r.depth,'#a5ab91',52);
  }
  // Continuous curved panes share smooth normals; glazing bars cover their
  // construction joints and land on the same spring line as the wall plate.
  const n=36,normal=a=>norm([Math.cos(a)/span,Math.sin(a)/rise,0]);
  for(let i=0;i<n;i++){
   const a=i*Math.PI/n,c=(i+1)*Math.PI/n,pa=[Math.cos(a)*span,spring+Math.sin(a)*rise],pc=[Math.cos(c)*span,spring+Math.sin(c)*rise],na=normal(a),nc=normal(c),color=i%3===0?'#b9c8b9':'#becbbb';
   b.tri([...pa,-end],[...pc,-end],[...pc,end],color,72,[na,nc,nc]);b.tri([...pa,-end],[...pc,end],[...pa,end],color,72,[na,nc,na]);
   if(i>0&&i%3===0)b.beam([pa[0],pa[1]-.028,-end],[pa[0],pa[1]-.028,end],.037,p.metal,41,5);
  }
  b.box(0,h-.024,0,.20,.10,r.depth,p.metal,41);
  for(const z of[-end,end])grandHallVaultEnd(b,r,z,z<0?0:Math.PI,span,spring,rise);
  // End ribs cover the butt joint between the canopy and its glazed tympanum.
  for(const z of[-end+.16,end-.16])for(let i=0;i<36;i++){const a=i*Math.PI/36,c=(i+1)*Math.PI/36;b.beam([Math.cos(a)*(span-.05),spring+Math.sin(a)*(rise-.045),z],[Math.cos(c)*(span-.05),spring+Math.sin(c)*(rise-.045),z],.075,p.metal,41,6);}
  for(const z of[-13,1,14])grandHallPendant(b,r,0,7.7,z);for(const x of[-10.8,10.8])for(const z of[-13,0,13])grandHallPendant(b,r,x,6.6,z);
 }else if(r.roof==='sawtooth'){
  for(let z=-d;z<d-.1;z+=8.5){const end=Math.min(d,z+8.5),peak=z+(end-z)*.72;
   for(const x of[-w,0,w]){b.beam([x,h-1.4,z],[x,h,peak],.095,p.metal,41,6);b.beam([x,h,peak],[x,h-1.4,end],.095,p.metal,41,6);}
   b.beam([-w,h,peak],[w,h,peak],.11,p.metal,41,6);b.beam([-w,h-1.4,z],[w,h-1.4,z],.085,p.metal,41,6);
   for(let x=-w+1;x<w;x+=3.6){b.beam([x,h-1.43,z],[x,h-.035,peak],.03,p.metal,41,5);}
   b.quad([-w,h-1.38,z],[w,h-1.38,z],[w,h+.02,peak],[-w,h+.02,peak],'#b9b79e',52);
   b.quad([-w,h,peak],[-w,h-1.4,end],[w,h-1.4,end],[w,h,peak],'#adc0b0',72);
   for(const side of[-1,1])b.tri([side*w,h-1.4,z],[side*w,h,peak],[side*w,h-1.4,end],p.wall,51);
   for(const x of[-7.9,7.9])grandHallPendant(b,r,x,5.8,(z+end)/2);
  }
 }else if(r.roof==='glasshouse'){
  for(const z of[-d,-d*.5,0,d*.5,d]){
   for(const s of[-1,1]){b.beam([s*w,0,z],[s*w,5.6,z],.065,p.metal,41,6);b.beam([s*w,5.6,z],[s*5.2,h-1.6,z],.065,p.metal,41,6);b.beam([s*5.2,h-1.6,z],[0,h,z],.065,p.metal,41,6);}
  }
  const profile=[[-w,5.6],[-5.2,h-1.6],[0,h],[5.2,h-1.6],[w,5.6]];
  for(const [x,y]of profile)b.beam([x,y,-d],[x,y,d],.07,p.metal,41,6);
  for(let i=0;i<profile.length-1;i++){const a=profile[i],c=profile[i+1];b.quad([a[0],a[1],-d],[c[0],c[1],-d],[c[0],c[1],d],[a[0],a[1],d],'#b5cab2',72);}
  for(const z of[-r.depth/2,r.depth/2])grandHallGlazedGable(b,r,z,profile,5.48);
  for(const side of[-1,1])b.box(side*w,5.49,0,.24,.24,r.depth,p.metal,41);
  for(const x of[-9,9])for(const z of[-8,7])grandHallPendant(b,r,x,5.8,z);
 }else if(r.roof==='lantern'||r.roof==='octagon'){
  const octagon=r.roof==='octagon',radius=octagon?5.7:7.4,base=h-1.25,n=octagon?8:4;
  b.push(0,0,-1.8,0,octagon?Math.PI/8:Math.PI/4);
  for(let i=0;i<n;i++){const a=i*Math.PI*2/n,c=(i+1)*Math.PI*2/n,p0=[Math.cos(a)*radius,base,Math.sin(a)*radius],p1=[Math.cos(c)*radius,base,Math.sin(c)*radius],q0=[p0[0],h-.3,p0[2]],q1=[p1[0],h-.3,p1[2]];b.beam(p0,p1,.14,p.trim,22,6);b.beam(p0,q0,.07,p.metal,41,6);b.beam(q0,q1,.09,p.metal,41,6);b.beam(q0,[0,h+.25,0],.075,p.metal,41,6);b.tri(q0,q1,[0,h+.25,0],'#c5cdbb',72);b.quad(p0,p1,q1,q0,'#b8c5ae',72);const panes=Math.ceil(Math.hypot(p1[0]-p0[0],p1[2]-p0[2])/1.2);for(let j=1;j<panes;j++){const t=j/panes;b.beam([mix(p0[0],p1[0],t),base,mix(p0[2],p1[2],t)],[mix(p0[0],p1[0],t),h-.3,mix(p0[2],p1[2],t)],.033,p.metal,41,5);}}
  b.pop();
  const opening=radius*(octagon?Math.cos(Math.PI/8):Math.SQRT1_2),edge=h-1.4,cz=-1.8;
  if(octagon){const inset=radius*Math.sin(Math.PI/8);for(const sx of[-1,1])for(const sz of[-1,1])b.tri([sx*opening,base,cz+sz*inset],[sx*inset,base,cz+sz*opening],[sx*opening,base,cz+sz*opening],'#9a977f',72);}
  // The lantern rises out of an actual hipped ceiling, not an unsupported box.
  for(const side of[-1,1]){
   b.quad([side*w,edge,-d],[side*opening,base,cz-opening],[side*opening,base,cz+opening],[side*w,edge,d],octagon?'#9a977f':'#c9ccb2',72);
   b.quad([-w,edge,side*d],[-opening,base,cz+side*opening],[opening,base,cz+side*opening],[w,edge,side*d],octagon?'#9a977f':'#c9ccb2',72);
   const corner=octagon?radius*(Math.cos(Math.PI/8)+Math.sin(Math.PI/8))/2:opening;
   for(const z of[-d,0,d]){
    const reach=z===0?opening:corner;
    b.beam([side*w,edge-.14,z],[side*reach,base-.14,cz+(z===0?0:Math.sign(z)*corner)],.11,p.trim,22,6);
   }
   // The corner rafters already meet each chamfer; add the end's centre rafter.
   b.beam([0,edge-.14,side*d],[0,base-.14,cz+side*opening],.11,p.trim,22,6);
  }
  for(const z of[-d+2,-1.8,d-2]){b.beam([-w,edge-.16,z],[w,edge-.16,z],.10,p.trim,22,6);}
  if(octagon){for(const x of[-7.9,7.9])for(const z of[-10.5,-3.7,5.1])grandHallPendant(b,r,x,4.9,z);}
  else for(const x of[-8.5,8.5])for(const z of[-9,5.5])grandHallPendant(b,r,x,5.5,z);
 }else if(r.roof==='clerestory'){
  for(const side of[-1,1])b.quad([side*w,h-1.39,-d],[side*2.65,h-1.39,-d],[side*2.65,h-1.39,d],[side*w,h-1.39,d],'#d1ceba',51);
  b.quad([-2.65,h-.27,-d],[2.65,h-.27,-d],[2.65,h-.27,d],[-2.65,h-.27,d],'#d7d4c0',51);
  for(const z of[-r.depth/2,r.depth/2])grandHallGlazedGable(b,r,z,[[-2.65,h-.3],[2.65,h-.3]],h-1.39);
  for(const z of[-d+1,-5,5,d-1]){b.box(0,h-1.55,z,r.width-.4,.30,.26,p.trim,52);b.box(0,h-.3,z,5.4,.14,.22,p.trim,52);for(const s of[-1,1]){b.box(s*2.65,h-.88,z,.16,1.15,.23,p.metal,41);b.beam([s*w,h-1.55,z],[s*2.65,h-1.55,z],.09,p.trim,22,6);}}
  for(const x of[-2.65,2.65])b.quad([x,h-1.5,-d],[x,h-1.5,d],[x,h-.3,d],[x,h-.3,-d],'#bcc8b2',72);
  for(const x of[-8,8])for(const z of[-8,6]){b.beam([x,h-1.5,z],[x,4.9,z],.025,p.metal,41,6);b.box(x,4.85,z,3.2,.08,.3,'#e0d7b2',10);}
 }else{
  const roofY=z=>h-1.4+(z+d)/(2*d)*1.4;
  for(const x of[-w+1,-10,0,10,w-1]){b.beam([x,roofY(-d)-.10,-d],[x,roofY(d)-.10,d],.14,'#9b815b',22,6);for(const z of[-d,d])b.box(x,roofY(z)/2,z,.24,roofY(z),.24,p.trim,22);}
  for(const z of[-d,-d/2,0,d/2,d])b.beam([-w,roofY(z)-.10,z],[w,roofY(z)-.10,z],.11,'#a88d66',22,6);
  const deck=(x0,x1,z0,z1,glass=false)=>b.quad([x0,roofY(z0)+.08,z0],[x1,roofY(z0)+.08,z0],[x1,roofY(z1)+.08,z1],[x0,roofY(z1)+.08,z1],glass?'#c3cdb7':'#baaf92',glass?72:22);
  for(const [x0,x1]of[[-w,-11.7],[-8.3,8.3],[11.7,w]])deck(x0,x1,-d,d);
  for(const x of[-10,10]){deck(x-1.7,x+1.7,-d,-d+2);deck(x-1.7,x+1.7,d-2,d);deck(x-1.7,x+1.7,-d+2,d-2,true);for(const side of[-1,1])b.beam([x+side*1.7,roofY(-d+2)+.065,-d+2],[x+side*1.7,roofY(d-2)+.065,d-2],.048,p.metal,41,5);}
  // A high glazed frieze closes the tall end of the sloping workshop roof.
  grandHallGlazedGable(b,r,r.depth/2,[[-w,h],[w,h]],h-1.4);
  for(const side of[-1,1])b.tri([side*w,h-1.4,-d],[side*w,h-1.4,d],[side*w,h,d],p.wall,51);
  for(const x of[-14,-7,7,14])grandHallPendant(b,r,x,5.1,0);
 }
}
function grandHallGarden(b,x,z,size=1,kind='broadleaf'){
 b.push(x,0,z,0,(x+z)*.17,0,size);
 const fern=kind==='fern',pot=fern?'#9c8061':kind==='fig'?'#aaa48d':'#aeb49c',radius=fern?.62:.48,soil=fern?.44:.60;
 b.cylinder(0,soil/2,0,radius*.78,radius,soil,pot,52,10);b.cylinder(0,soil,0,radius+.04,radius+.04,.07,shade(pot,1.09),52,10);b.cylinder(0,soil+.04,0,radius-.035,radius-.035,.016,'#565d43',0,10);
 if(fern){
  // Drooping fronds have paired leaflets, a low broad silhouette and a shallow bowl.
  for(let i=0;i<7;i++){
   const a=i*2.399,reach=.70+(i%3)*.14,lift=.48+(i%2)*.14,point=t=>[Math.cos(a)*reach*t,soil+.05+Math.sin(t*Math.PI*.8)*lift,Math.sin(a)*reach*t];
   let previous=point(0);for(let j=1;j<=3;j++){const next=point(j/3);b.beam(previous,next,.012,'#617749',0,4);previous=next;}
   for(let j=1;j<=4;j++)for(const s of[-1,1]){
    const t=j/5,c=point(t),length=(1-t*.65)*.31,tip=[c[0]+Math.cos(a+s*1.05)*length,c[1]-.06,c[2]+Math.sin(a+s*1.05)*length],half=.047;
    b.quad(c,[c[0]-Math.sin(a)*half,c[1]+.02,c[2]+Math.cos(a)*half],tip,[c[0]+Math.sin(a)*half,c[1]-.01,c[2]-Math.cos(a)*half],j%2?'#76925d':'#53774c',0);
   }
  }
 }else if(kind==='reed'){
  // Narrow bent blades read differently from the broad leaves across the room.
  for(let i=0;i<9;i++){const a=i*2.399,y=1.15+(i%4)*.24,r=.22+(i%3)*.13,xx=Math.cos(a)*r,zz=Math.sin(a)*r,dx=Math.sin(a)*.055,dz=Math.cos(a)*.055;b.quad([-dx,soil+.03,dz],[dx,soil+.03,-dz],[xx+dx,y,zz-dz],[xx-dx,y,zz+dz],i%2?'#7b9461':'#59754c',0);b.tri([xx-dx,y,zz+dz],[xx+dx,y,zz-dz],[xx*1.7,y-.17,zz*1.7],'#738a57',0);}
 }else{
  const fig=kind==='fig';if(fig)b.beam([0,soil,0],[.07,2.04,-.03],.043,'#7d7655',22,6);
  for(let i=0;i<(fig?7:6);i++){const a=i*2.399,r=(fig?.37:.30)+(i%3)*.13,y=(fig?1.32:.87)+(i%4)*.29,xx=Math.cos(a)*r,zz=Math.sin(a)*r;b.beam(fig?[.05,y-.29,0]:[0,soil,0],[xx,y,zz],.018,'#638061',0,5);b.push(xx,y,zz,fig?.95:.35,a);b.sphere(0,.12,0,fig?.25:.20,fig?.34:.46,.065,['#63845e','#839969','#466d52'][i%3],0,6,3);b.pop();}
 }
 b.pop();
}
function grandHallWindowSeat(b,x,z,yaw,w,wood){
 b.push(x,0,z,0,yaw);b.box(0,.23,0,w,.46,.70,wood,22);b.box(0,.51,0,w+.10,.10,.76,'#c6c5ad',53);
 for(const xx of[-w*.28,0,w*.28]){b.box(xx,.24,.362,w*.27,.29,.024,shade(wood,.87),22);b.box(xx,.33,.39,.14,.025,.025,'#a38b60',41);}b.pop();
}
function grandHallRoomDetails(b,r){
 const w=r.width/2,d=r.depth/2,p=r.palette;
 // Names are deliberately at the approach, with no repeated posters or stand-in art.
 sign(b,'room-'+r.id,0,r.id==='architecture'?4.65:5.48,-d+.37,Math.min(5.6,r.width*.23),.38);
 b.push(0,.052,d-1.25,-Math.PI/2);sign(b,'room-'+r.id,0,0,0,5.2,.38);b.pop();
 if(r.id==='grand'){
  for(const s of[-1,1])grandHallWindowSeat(b,s*10.0,d-2.3,Math.PI,4.3,p.trim);
  grandHallGarden(b,-w+1.4,-d+1.5,.94,'fig');
  const z=-19.2;b.beam([0,r.height-.35,z],[0,8.05,z],.035,'#bca778',41,6);b.cylinder(0,7.2,z,.82,.82,.23,p.metal,41,36,Math.PI/2);ringZ(b,0,7.2,z+.15,.72,.83,.08,'#bda776',41,36);const q=labels.clock;
  for(let i=0;i<40;i++){const a=i*Math.PI*2/40,c=(i+1)*Math.PI*2/40;b.tri([0,7.2,z+.2],[Math.cos(a)*.72,7.2+Math.sin(a)*.72,z+.2],[Math.cos(c)*.72,7.2+Math.sin(c)*.72,z+.2],'#ffffff',15,[[0,0,1],[0,0,1],[0,0,1]],[[mix(q.u0,q.u1,.5),mix(q.v0,q.v1,.5)],[mix(q.u0,q.u1,.5+Math.cos(a)*.5),mix(q.v0,q.v1,.5+Math.sin(a)*.5)],[mix(q.u0,q.u1,.5+Math.cos(c)*.5),mix(q.v0,q.v1,.5+Math.sin(c)*.5)]]);}
 }else if(r.id==='steam'){
  for(const s of[-1,1])for(const z of[-21,-12.5,-3,6.5,16.5]){b.box(s*(w-.5),3.4,z,.3,6.8,.7,p.metal,41);b.box(s*(w-.7),.12,z,.9,.24,1.0,'#8b8d78',52);}
  for(const s of[-1,1])grandHallWindowSeat(b,s*7.5,d-1.2,Math.PI,3.5,'#657069');
 }else if(r.id==='worlds'){
  for(const s of[-1,1])grandHallWindowSeat(b,s*(w-.8),7.2,s<0?Math.PI/2:-Math.PI/2,3.7,'#a1865e');
  grandHallGarden(b,w-1.15,-d+1.3,.82);
 }else if(r.id==='conservatory'){
  grandHallGarden(b,-14,-d+1.0,1.0,'fern');grandHallGarden(b,13.8,-d+1.0,.94,'fig');
  grandHallGarden(b,-w+1.0,-6,.95,'reed');grandHallGarden(b,w-1.0,9.5,.78,'fern');
  for(const s of[-1,1])grandHallWindowSeat(b,s*(w-.8),0,s<0?Math.PI/2:-Math.PI/2,3.5,'#869d80');
 }else if(r.id==='architecture'){
  for(const s of[-1,1]){
   grandHallWindowSeat(b,s*9.5,d-1.2,Math.PI,3.1,'#a8afa4');
   b.box(s*(w-.35),2.4,-6.5,.28,4.8,.42,'#c7cbbd',52);
  }
 }else if(r.id==='curiosity'){
  for(const s of[-1,1])grandHallWindowSeat(b,s*8.5,d-1.15,Math.PI,3.1,'#62442f');
 }else{
  // A real shared making bench is room furniture; the numbered displays stay empty.
  const z=-d+1.25;table(b,0,z,6.8,1.7,1.0);for(const x of[-2.2,1.6]){b.box(x,1.066,z,1.6,.018,1.1,'#d3c9a6',0);b.box(x,1.080,z,1.2,.010,.7,'#e0d5b6',0);}
  b.cylinder(2.5,1.22,z,.14,.15,.32,'#8a987b',52,10);for(let i=0;i<5;i++)b.beam([2.45+i*.025,1.22,z],[2.41+i*.06,1.70,z+.04],.012,'#b99859',22,5);
  for(const s of[-1,1])grandHallWindowSeat(b,s*(w-.8),6.0,s<0?Math.PI/2:-Math.PI/2,4.1,'#a88a5f');
  grandHallGarden(b,w-1.35,-d+1.5,.88,'fern');
 }
}
function grandHallDisplayDisk(b,radius,y,color){
 // The felt is a visible finish, not another closed cylinder with a bottom
 // coincident with the stone below. Keep its actual support plane unchanged.
 for(let i=0;i<24;i++){const a=i*Math.PI*2/24,c=(i+1)*Math.PI*2/24;b.tri([0,y,0],[Math.cos(c)*radius,y,Math.sin(c)*radius],[Math.cos(a)*radius,y,Math.sin(a)*radius],color,53,[[0,1,0],[0,1,0],[0,1,0]]);}
}
function grandHallBayShape(b,bay){
 const r=GRAND_HALL_GALLERIES[bay.room],p=r.palette,w=bay.w,d=bay.d,y=bay.y,wood=r.id==='curiosity'?'#61432f':r.id==='workshop'?'#ad8b5a':r.id==='worlds'?'#9a7c50':r.id==='steam'?'#586462':'#b3b4a2',cloth=r.cloth;
 if(bay.furniture==='round'){
  b.cylinder(0,.10,0,w*.32,w*.32,.20,r.id==='curiosity'?'#6d5440':'#a5b195',52,16);b.cylinder(0,(y-.12)/2,0,w*.21,w*.18,y-.24,r.id==='worlds'?'#b09a73':r.id==='curiosity'?'#73543d':'#c1cab0',52,16);b.cylinder(0,y-.08,0,w/2,w/2,.16,r.id==='curiosity'?'#b7986b':'#d2d4bd',52,24);grandHallDisplayDisk(b,w/2-.16,y+.016,cloth);
 }else if(bay.furniture==='honour'||bay.furniture==='landscape'){
  const honour=bay.furniture==='honour',inset=honour?.20:.28,stone=r.id==='grand'||r.id==='architecture',body=honour?p.trim:stone?'#c1bdab':wood,mat=stone&&!honour?52:22;b.box(0,.075,0,w-.45,.15,d-.45,stone?'#a6a797':p.trim,mat);b.box(0,y/2,0,w-inset,y-.22,d-inset,body,mat);b.box(0,y-.04,0,w,.08,d,stone?'#d5ceb9':'#c0aa81',mat);b.box(0,y+.006,0,w-.19,.012,d-.19,cloth,53);
  for(const s of[-1,1])b.box(s*(w/2-.20),y*.54,d/2-.08,.035,y*.65,.02,'#c7b98f',41);
 }else if(bay.furniture==='study'){
  b.box(0,y-.08,0,w,.16,d,'#c7c1a6',52);b.box(0,y+.007,0,w-.12,.015,d-.12,cloth,53);
  for(const s of[-1,1])b.box(s*(w/2-.55),(y-.20)/2,0,.26,y-.20,d-.7,'#a9ab94',52);b.box(0,.13,0,w-.85,.18,d-.80,'#aeae98',52);
  for(const s of[-1,1])b.box(s*(w/2-.25),y+.02,0,.013,.01,d-.45,'#e0dcc4',0);
 }else if(bay.furniture==='cabinet'){
  b.box(0,.12,0,w,.24,d,'#64513e',22);b.box(0,(y-.18)/2,0,w-.22,y-.18,d-.18,wood,22);b.box(0,y-.07,0,w,.14,d,'#a69267',22);b.box(0,y+.007,0,w-.14,.016,d-.14,cloth,53);
  for(const xx of[-w*.25,w*.25]){b.box(xx,y*.43,d/2-.074,w*.41,y*.57,.04,'#695b45',22);b.box(xx,y*.66,d/2-.037,.27,.038,.045,'#b5a173',41);}
 }else if(bay.furniture==='platform'){
  b.box(0,.18,0,w-.22,.36,d-.20,'#797e6b',52);b.box(0,y*.55,0,w-.4,y-.35,d-.3,'#8e927c',52);b.box(0,y-.07,0,w,.14,d,'#c2b792',52);b.box(0,y+.01,0,w-.2,.02,d-.2,cloth,53);
  for(const x of[-.38,.38])b.box(x,y+.035,0,.052,.04,d-.5,'#bfc3aa',41);for(let i=0;i<13;i++)b.box(0,y+.017,-d/2+.35+i*(d-.7)/12,1.20,.025,.10,'#918263',22);
 }else if(bay.furniture==='trestle'){
  b.box(0,y-.065,0,w,.13,d,wood,22);b.box(0,y+.006,0,w-.10,.012,d-.10,cloth,53);
  for(const x of[-w*.30,w*.30]){for(const s of[-1,1])b.beam([x,.06,s*(d*.40)],[x,y-.11,s*d*.23],.095,wood,22,6);b.box(x,.18,0,.19,.17,d*.84,wood,22);}b.box(0,.51,0,w*.70,.13,.16,wood,22);
 }else{
  table(b,0,0,w-.10,d-.10,y-.05);b.box(0,y+.006,0,w-.21,.012,d-.21,cloth,53);
 }
 // Corner marks and a small edge number are the whole invitation. The surface
 // is left genuinely open; repeated cards and fake examples compete with work.
 if(bay.furniture!=='round')for(const sx of[-1,1])for(const sz of[-1,1]){b.box(sx*(w/2-.37),y+.018,sz*(d/2-.23),.32,.012,.018,'#d1c5a1',41);b.box(sx*(w/2-.23),y+.018,sz*(d/2-.37),.018,.012,.30,'#d1c5a1',41);}
 const face=d/2+.045;b.box(0,y-.16,face,.76,.20,.045,p.metal,22);sign(b,'bay-'+bay.id,0,y-.155,face+.027,.62,.145);
}
function grandHallDisplayCase(b,glass,bay){
 if(bay.displayFormat==='open-table')return;
 const r=GRAND_HALL_GALLERIES[bay.room],metal=r.id==='architecture'?'#929c8b':r.id==='curiosity'?'#b3a077':'#8a9d8a',bottom=bay.y+.025,top=bay.y+bay.maxHeight+.10,h=top-bottom;
 if(bay.displayFormat==='round-vitrine'){
  const radius=bay.w/2-.12,n=24;
  for(const yy of[bottom,top]){for(let i=0;i<n;i++){const a=i*Math.PI*2/n,c=(i+1)*Math.PI*2/n;b.beam([Math.cos(a)*radius,yy,Math.sin(a)*radius],[Math.cos(c)*radius,yy,Math.sin(c)*radius],.028,metal,41,5);}}
  for(let i=0;i<n;i++){const a=i*Math.PI*2/n,c=(i+1)*Math.PI*2/n,p=[Math.cos(a)*radius,bottom,Math.sin(a)*radius],q=[Math.cos(c)*radius,bottom,Math.sin(c)*radius],pt=[p[0],top,p[2]],qt=[q[0],top,q[2]];glass.quad(p,q,qt,pt,'#d2e2d9',76);glass.tri([0,top,0],pt,qt,'#e4ebe2',76);}
  for(const a of[Math.PI/4,Math.PI*3/4,Math.PI*5/4,Math.PI*7/4])b.box(Math.cos(a)*radius,(bottom+top)/2,Math.sin(a)*radius,.035,h,.035,metal,41);
  return;
 }
 const w=bay.w-.14,d=bay.d-.14,wall=bay.displayFormat==='wall-case';
 for(const xx of[-w/2,w/2])for(const zz of[-d/2,d/2])b.box(xx,(bottom+top)/2,zz,.042,h,.042,metal,41);
 for(const yy of[bottom,top]){for(const s of[-1,1]){b.box(s*w/2,yy,0,.047,.047,d,metal,41);b.box(0,yy,s*d/2,w,.047,.047,metal,41);}}
 if(wall){
  // A recessed, lit display window in a cabinet: a real backing and side
  // reveals give the empty volume definition without inventing an exhibit.
  b.box(0,(bottom+top)/2,-d/2-.018,w+.12,h+.10,.12,r.id==='curiosity'?'#665f4e':'#b2b6a1',22);
  b.box(0,(bottom+top)/2,-d/2+.052,w-.14,h-.10,.03,r.id==='curiosity'?'#a7ac91':'#d1d2bc',53);
  for(const s of[-1,1])b.box(s*(w/2+.015),(bottom+top)/2,0,.10,h+.10,d+.10,r.id==='curiosity'?'#8a7453':'#b3b69f',22);
  b.box(0,top+.016,0,w+.12,.11,d+.12,r.id==='curiosity'?'#947f59':'#bdc1a8',22);
  b.box(0,top-.065,d*.28,w*.68,.045,.055,'#e6dfb5',10);
  for(const s of[-1,1]){b.box(s*(w/2-.025),(bottom+top)/2,d/2+.07,.075,h+.06,.035,metal,41);b.box(0,s<0?bottom:top,d/2+.07,w,.075,.035,metal,41);}
  b.box(w/2-.16,bottom+.16,d/2+.078,.05,.09,.04,metal,41);
 }else{
  glass.quad([w/2,bottom,-d/2],[-w/2,bottom,-d/2],[-w/2,top,-d/2],[w/2,top,-d/2],'#d4e3da',76);
  glass.quad([-w/2,top,-d/2],[-w/2,top,d/2],[w/2,top,d/2],[w/2,top,-d/2],'#e0e9df',76);
 }
 glass.quad([-w/2,bottom,d/2],[w/2,bottom,d/2],[w/2,top,d/2],[-w/2,top,d/2],'#d4e3da',76);
 if(!wall)for(const side of[-1,1])glass.quad([side*w/2,bottom,-d/2],[side*w/2,bottom,d/2],[side*w/2,top,d/2],[side*w/2,top,-d/2],'#d4e3da',76);
}
function grandHallPassageHalf(passage,ownerRoom){
 const start=passage.from===ownerRoom?passage.p0:passage.p1,end=[(passage.p0[0]+passage.p1[0])/2,(passage.p0[1]+passage.p1[1])/2],b=new Builder(),[x0,z0]=start,[x1,z1]=end,cx=(x0+x1)/2,cz=(z0+z1)/2,horizontal=x0!==x1,length=Math.hypot(x1-x0,z1-z0),w=passage.width;
 b.push(cx,0,cz,0,horizontal?Math.PI/2:0);b.box(0,-.14,0,w,.28,length+.04,'#bdb69e',52);b.box(0,.015,0,w-.65,.025,length+.04,'#cbd0b8',52);
 for(const side of[-1,1]){b.box(side*(w/2-.1),.52,0,.2,1.04,length+.04,'#b9bca2',52);b.box(side*(w/2-.1),1.10,0,.35,.16,length+.04,'#d2c7a5',52);b.box(side*(w/2-.1),4.8,0,.14,.14,length+.04,'#748c76',41);}
 for(const z of[-length/2,length/2])for(const side of[-1,1]){b.beam([side*(w/2-.1),1.15,z],[side*(w/2-.1),4.8,z],.055,'#748c76',41,6);b.beam([side*(w/2-.1),4.8,z],[0,5.65,z],.055,'#748c76',41,6);}
 for(const side of[-1,1])b.quad([side*w/2,4.83,-length/2],[0,5.68,-length/2],[0,5.68,length/2],[side*w/2,4.83,length/2],'#b9c9b1',72);
 b.pop();addRecord(gpu(b.mesh()),I,ownerRoom,false,{ownerRoom,rooms:[passage.from,passage.to],passage:true});
}
// A scoped build emits only this gallery and its halves of the covered links.
// Portal UI belongs to the persistent catalogue, not evictable GPU records.
// The unfiltered form remains useful for geometry QA and standalone tooling.
function buildGrandHallArchitecture(roomIndex=null){
 if(roomIndex!==null&&(!Number.isInteger(roomIndex)||!GRAND_HALL_GALLERIES[roomIndex]))throw new RangeError('Unknown Hall gallery index');
 for(const [ri,r]of GRAND_HALL_GALLERIES.entries()){
  if(roomIndex!==null&&ri!==roomIndex)continue;
  const floor=new Builder();grandHallFloor(floor,r);grandHallRecord(floor,ri,false);
  const walls=new Builder(),doors=grandHallRoomDoors(ri);for(const side of['left','right','back','front'])grandHallWall(walls,r,side,doors[side]);grandHallRecord(walls,ri,false);
  const frame=new Builder();grandHallRoof(frame,r);grandHallRoomDetails(frame,r);grandHallRecord(frame,ri,true);
  const furniture=new Builder(),glass=new Builder();for(const bay of GRAND_HALL_BAYS){if(bay.room!==ri)continue;furniture.push(bay.x-r.x,0,bay.z-r.z,0,bay.yaw);glass.push(bay.x-r.x,0,bay.z-r.z,0,bay.yaw);grandHallBayShape(furniture,bay);grandHallDisplayCase(furniture,glass,bay);furniture.pop();glass.pop();}grandHallRecord(furniture,ri,true);grandHallRecord(glass,ri,false,{displayGlass:true});
  for(const passage of GRAND_HALL_PASSAGES)if(passage.from===ri||passage.to===ri)grandHallPassageHalf(passage,ri);
 }
 if(roomIndex===null)for(const passage of GRAND_HALL_PASSAGES){createPortal(passage.from,passage.to);createPortal(passage.to,passage.from);}
}
