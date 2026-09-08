'use strict';

const HouseMapArt=(()=>{
 const palettes={valley:{floor:'#ad8355',wall:'#d8cba8',panel:'#3e5b46',land:'#809657'},coast:{floor:'#d1daca',wall:'#dce4ce',panel:'#8daea4',land:'#76a9a5'},alpine:{floor:'#7d6347',wall:'#96784f',panel:'#574b37',land:'#778772'},studio:{floor:'#b8946c',wall:'#ddd3b8',panel:'#7b8b70',land:'#8a9e70'}};
 const bounds={alpine:[0,0,208,179],coast:[234,0,208,179],valley:[0,205,208,179],studio:[234,205,208,179]};
 const P=(x,y,z=0)=>[579+(x-y)*1.18,106+(x+y)*.55-z];
 const pt=p=>p.map(v=>Number(v.toFixed(2))).join(',');
 const pts=a=>a.map(pt).join(' ');
 const poly=(a,fill,stroke='none',width=.6,extra='')=>`<polygon points="${pts(a)}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" ${extra}/>`;
 const line=(a,b,color,width=1,extra='')=>`<path d="M${pt(a)}L${pt(b)}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" ${extra}/>`;
 const path=(a,color,width=1,close=false,extra='')=>`<path d="M${a.map(pt).join('L')}${close?'Z':''}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linejoin="round" ${extra}/>`;
 const circle=(x,y,r,fill,extra='')=>`<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${r}" fill="${fill}" ${extra}/>`;
 const floor=(x,y,w,d,z,c,stroke='none')=>poly([P(x,y,z),P(x+w,y,z),P(x+w,y+d,z),P(x,y+d,z)],c,stroke);
 function box(x,y,w,d,z,h,top,front,left){
  return poly([P(x,y+d,z),P(x+w,y+d,z),P(x+w,y+d,z+h),P(x,y+d,z+h)],front||top)+poly([P(x+w,y,z),P(x+w,y+d,z),P(x+w,y+d,z+h),P(x+w,y,z+h)],left||front||top)+floor(x,y,w,d,z+h,top);
 }
 function tree(x,y,z=29,size=1,pine=false,snow=false){
  const [sx,sy]=P(x,y,z),s=size;
  let out=`<ellipse cx="${sx}" cy="${sy+1}" rx="${5*s}" ry="${2.1*s}" fill="#354b35" opacity=".18"/>`;
  out+=line(P(x,y,z),P(x,y,z+12*s),'#725b3b',1.7*s);
  if(pine){for(let i=0;i<3;i++){let [a,b]=P(x,y,z+(4+i*4.1)*s);out+=poly([[a-5.1*s+i*.9*s,b],[a,b-9*s],[a+5.1*s-i*.9*s,b]],['#536e56','#3f6250','#60816a'][i]);if(snow)out+=poly([[a-3.3*s+i*.6*s,b-2.8*s],[a,b-9*s],[a+3.3*s-i*.6*s,b-2.8*s]],'#e8eadb');}}
  else{for(const [dx,dy,r,c]of[[-2,-9,4.8,'#748654'],[3,-11,4.5,'#94a271'],[-.3,-15,5,'#9da77a'],[-3,-14,3,'#abb386']])out+=circle(sx+dx*s,sy+dy*s,r*s,c);}
  return out;
 }
 function person(x,y,z=0,c='#6b7e82',s=1){
  const [a,b]=P(x,y,z);return `<ellipse cx="${a+1}" cy="${b+1}" rx="${3.4*s}" ry="${1.6*s}" fill="#4d4938" opacity=".17"/>`+line([a-1*s,b],[a-.5*s,b-4*s],'#4a4a3b',1.4*s)+line([a+1.2*s,b+.5*s],[a+.6*s,b-4*s],'#4a4a3b',1.4*s)+line([a,b-3.2*s],[a,b-8*s],c,4.1*s)+line([a-1.6*s,b-6.5*s],[a-2.4*s,b-3.3*s],c,1.3*s)+line([a+1.5*s,b-6.5*s],[a+2.7*s,b-4.8*s],c,1.3*s)+circle(a,b-10.5*s,2.1*s,'#d8b892')+path([[a-1.8*s,b-11.1*s],[a-.7*s,b-12.1*s],[a+1.5*s,b-11.5*s]],'#6d5740',1.5*s);
 }
 function house(x,y,w=10,d=8,z=29,c='#dfcfad',roof='#936c53',h=9){
  let out=box(x,y,w,d,z,h,c,'#c1ad8d','#ab9a7d');
  out+=poly([P(x-1,y-1,z+h),P(x+w+1,y-1,z+h),P(x+w/2,y-1,z+h+5)],roof);
  out+=poly([P(x+w/2,y-1,z+h+5),P(x+w+1,y-1,z+h),P(x+w+1,y+d+1,z+h),P(x+w/2,y+d+1,z+h+5)],roof);
  out+=poly([P(x-1,y-1,z+h),P(x+w/2,y-1,z+h+5),P(x+w/2,y+d+1,z+h+5),P(x-1,y+d+1,z+h)],'#ac8465');
  for(let i=0;i<2;i++)out+=poly([P(x+2+i*w*.45,y+d+.1,z+3),P(x+4+i*w*.45,y+d+.1,z+3),P(x+4+i*w*.45,y+d+.1,z+6),P(x+2+i*w*.45,y+d+.1,z+6)],'#f2d898','#997954',.35);
  out+=box(x+w*.6,y+2,1.5,2,z+h,5,'#a18b6a','#8f775a','#8f775a');return out;
 }
 function table(x,y,w,d,c){
  let out='';for(const xx of[x+5,x+w-7])for(const yy of[y+4,y+d-6])out+=box(xx,yy,2.2,2.2,0,26,'#a18055','#765635','#654c34');
  out+=box(x,y,w,d,23,4,'#c0a174','#81603a','#725634');out+=box(x+.7,y+.7,w-1.4,d-1.4,27,1.5,c,'#9f9369','#7d805d');
  out+=line(P(x,y+d,25.7),P(x+w,y+d,25.7),'#d3b47c',.65);return out;
 }
 function rails(route,z=29,trainT=.3,color='#496952',speed=76){
  const arr=route.map(p=>P(p[0],p[1],p[2]??z));let out=path(arr,'#c7b895',5.3,true)+path(arr,'#596456',3.0,true)+path(arr,'#dfd2ac',1.15,true);
  for(let i=0;i<route.length;i+=3){const a=route[i],b=route[(i+1)%route.length],v=[b[0]-a[0],b[1]-a[1]],length=Math.hypot(...v)||1,n=[-v[1]/length*2.5,v[0]/length*2.5];out+=line(P(a[0]+n[0],a[1]+n[1],a[2]??z),P(a[0]-n[0],a[1]-n[1],a[2]??z),'#675e44',.7);}
  const d='M'+arr.map(pt).join('L')+'Z',timing=`animation-duration:${speed}s;animation-delay:${-trainT*speed}s`,staticOffset=-trainT*1000;
  out+=`<g class="hm-map-train" aria-hidden="true"><path class="hm-train-motion" d="${d}" pathLength="1000" fill="none" stroke="${color}" stroke-width="4.2" stroke-linecap="round" stroke-dasharray="12 4 14 4 14 952" stroke-dashoffset="${staticOffset}" style="${timing}"/><path class="hm-train-motion" d="${d}" pathLength="1000" fill="none" stroke="#263f37" stroke-width="4.5" stroke-linecap="round" stroke-dasharray="12 988" stroke-dashoffset="${staticOffset}" style="${timing}"/></g>`;
  return out;
 }
 function curve(points,steps=8){
  const out=[],n=points.length;for(let i=0;i<n;i++)for(let j=0;j<steps;j++){const t=j/steps,t2=t*t,t3=t2*t,a=points[(i-1+n)%n],b=points[i],c=points[(i+1)%n],d=points[(i+2)%n];out.push(b.map((_,k)=>.5*((2*b[k])+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*t2+(-a[k]+3*b[k]-3*c[k]+d[k])*t3)));}return out;
 }
 function island(points,z,h,top,front='#97a68a'){
  let out='';for(let i=0;i<points.length;i++){const a=points[i],q=points[(i+1)%points.length];if(q[0]-a[0]<0||q[1]-a[1]>0)out+=poly([P(a[0],a[1],z),P(q[0],q[1],z),P(q[0],q[1],z+h),P(a[0],a[1],z+h)],front);}
  return out+poly(points.map(q=>P(...q,z+h)),top);
 }
 function seaPine(x,y,z=29,s=1){
  const [a,b]=P(x,y,z);let out=line([a,b],[a+s*2,b-s*10],'#7f7350',1.1*s);for(const [dx,dy,rx,ry]of[[-3,-10,4,2.5],[3,-12,5,2.4],[0,-14,4,2.6]])out+=`<ellipse cx="${a+dx*s}" cy="${b+dy*s}" rx="${rx*s}" ry="${ry*s}" fill="${dx<0?'#658c71':'#91a77d'}"/>`;return out;
 }
 function oval(cx,cy,rx,ry){return Array.from({length:90},(_,i)=>{let a=i/90*Math.PI*2;return[cx+Math.cos(a)*rx,cy+Math.sin(a)*ry];});}
 function shelf(x,y,w=50){
  let out=box(x,y,w,5,0,30,'#a28355','#6d6c4e','#766446');
  for(let row=0;row<3;row++){
   out+=box(x,y+4.5,w,1,2+row*8.9,.8,'#c2a774','#a18455','#846a49');
   for(let j=0;j<Math.floor(w/6);j++)out+=box(x+1+j*6,y+4.7,4.5,.7,3+row*8.9,5.7,['#91a6a1','#ccb791','#a88164','#75876c','#aeac8c'][(row+j)%5],'#c5b995','#8e8a70')+line(P(x+1.7+j*6,y+5.5,6+row*8.9),P(x+4.6+j*6,y+5.5,6+row*8.9),'#657467',.8);
  }return out;
 }
 function plant(x,y,z=0){let out=box(x-3,y-3,6,6,z,5,'#8f8060','#9b7e57','#816344');for(let i=0;i<5;i++){const a=i*1.25,[sx,sy]=P(x,y,z+7);out+=`<ellipse cx="${sx+Math.sin(a)*3}" cy="${sy-Math.cos(a)*4}" rx="2.1" ry="6" fill="${i%2?'#7f8e63':'#566f51'}" transform="rotate(${i*35-70} ${sx} ${sy})"/>`;}return out;}
 function wall(x,y,w,d,p){
  let out=box(x,y,w,d,0,42,p.wall,p.wall,p.panel);
  out+=box(x,y+d-.3,w,.6,0,18,p.panel,p.panel,p.panel)+line(P(x,y+d,18.8),P(x+w,y+d,18.8),'#b7a179',1.2);
  for(let xx=x+5;xx<x+w;xx+=13)out+=line(P(xx,y+d,2),P(xx,y+d,17),'#a7ad8e',.5);
  out+=box(x-.7,y-.7,w+1.4,d+1.4,42,1.5,'#e2d8bc','#c9b894','#a49b7e');return out;
 }
 function windowArt(x,y){
  let out=poly([P(x,y,20),P(x+32,y,20),P(x+32,y,39),P(x,y,39)],'#97afb0','#eadfc1',2.7);
  out+=poly([P(x,y+.03,20),P(x+32,y+.03,20),P(x+32,y+.03,28),P(x+20,y+.03,31),P(x+10,y+.03,27),P(x,y+.03,28)],'#b9c4a2');
  for(const xx of[x+10.7,x+21.3])out+=line(P(xx,y+.1,20),P(xx,y+.1,39),'#e8ddbf',1.5);out+=line(P(x,y+.1,29),P(x+32,y+.1,29),'#e8ddbf',1.5);return out;
 }
 function baseRoom(key){
  const [x,y,w,d]=bounds[key],p=palettes[key];let out=`<g class="hm-room-scene" data-room="${key}" role="button" tabindex="0" aria-label="Visit ${HOUSE_ROOMS[key].name}: ${HOUSE_ROOMS[key].layout}">`;
  out+=floor(x,y,w,d,0,p.floor);
  if(key==='coast'){
   for(let i=0;i<12;i++)for(let j=0;j<10;j++)if((i+j)%2===0||i===0||j===0||i===11||j===9)out+=floor(x+i*w/12+.2,y+j*d/10+.2,w/12-.4,d/10-.4,.08,i===0||j===0||i===11||j===9?'#aac5ba':'#e0e3d0');
  }else if(key==='studio'){
   for(let i=0;i<10;i++)for(let j=0;j<9;j++){out+=floor(x+i*w/10+.15,y+j*d/9+.15,w/10-.3,d/9-.3,.07,['#b4936c','#bf9d73','#b7956b'][(i+j*2)%3]);}
   for(let i=0;i<5;i++)for(let j=0;j<3;j++)out+=floor(x+5+i*11,y+d-35+j*11,10.7,10.7,.15,(i+j)%2?'#547263':'#ddd5bb');
  }else{
   for(let yy=y+4;yy<y+d;yy+=key==='alpine'?11:7){out+=line(P(x,yy),P(x+w,yy),key==='alpine'?'#4c4435':'#79613e',.7,'opacity=".38"');for(let xx=x+((yy-y)%3)*19;xx<x+w;xx+=43)out+=line(P(xx,yy),P(xx,Math.min(yy+7,y+d)),'#574931',.55,'opacity=".24"');}
  }
  out+=`<path class="hm-room-selection" d="M${pts([P(x+2,y+2),P(x+w-2,y+2),P(x+w-2,y+d-2),P(x+2,y+d-2)]).replaceAll(' ','L')}Z"/>`;
  if(key==='coast'){
   out+=wall(x,y,w,3,{wall:'#c8d9c6',panel:'#96b7a9'});
   out+=poly([P(x+3,y+3.4,14),P(x+w-3,y+3.4,14),P(x+w-3,y+3.4,57),P(x+3,y+3.4,57)],'#b9d3cc');
   out+=poly([P(x+3,y+3.5,14),P(x+w-3,y+3.5,14),P(x+w-3,y+3.5,33),P(x+3,y+3.5,33)],'#7aaba9');
   out+=poly([P(x+3,y+3.55,32),P(x+45,y+3.55,35),P(x+67,y+3.55,34),P(x+89,y+3.55,31),P(x+w-3,y+3.55,31),P(x+w-3,y+3.55,33),P(x+3,y+3.55,33)],'#a2c0b3');
   for(let i=0;i<=6;i++)out+=line(P(x+3+i*(w-6)/6,y+3.8,14),P(x+3+i*(w-6)/6,y+3.8,58),'#eff0d8',1.75);
   for(const z of[14,38,58])out+=line(P(x+2,y+3.8,z),P(x+w-2,y+3.8,z),'#e5e8ce',1.65);
   out+=poly([P(x,y+3,14),P(x,y+47,14),P(x,y+47,52),P(x,y+3,58)],'#b0cec4','#e4ead3',1.5);
   out+=line(P(x,y+25,14),P(x,y+25,55),'#f0edda',1.55)+line(P(x,y+3,38),P(x,y+47,34),'#e6e8cc',1.5);
   for(const xx of[x+12,x+122]){out+=box(xx,y+5,74,10,0,11,'#b4c4ad','#8eae9b','#749b8b');for(let i=0;i<4;i++){out+=floor(xx+2+i*18,y+6,16,7,11.4,'#79a9a2');out+=line(P(xx+5+i*18,y+6,11.5),P(xx+5+i*18,y+13,11.5),'#dce4c9',1.2);}}
   for(const xx of[x+69,x+147]){const [sx,sy]=P(xx,y+25,46);out+=line(P(xx,y+25,59),[sx,sy-7],'#b29b63',.7)+`<rect x="${sx-3}" y="${sy-6}" width="6" height="10" rx="1" fill="#e3d09b" stroke="#ab9259" stroke-width=".8"/>`+line([sx,sy-6],[sx,sy+4],'#b0985e',.65);}
   // A recognizable telescope and low chart table, seen from the doorway.
   const tel=P(x+w-14,y+44,16);for(const a of[-1,1])out+=line(P(x+w-14+a*4,y+44+a*3,0),tel,'#a18c5b',1.25);out+=line(P(x+w-14,y+48,0),tel,'#a18c5b',1.25)+line(P(x+w-14,y+47,15),P(x+w-14,y+35,20),'#c7ad73',3.1);
   out+=box(x+8,y+123,17,21,0,16,'#c5b38e','#a7b49d','#8caa95')+floor(x+10,y+126,13,14,16.1,'#e6dfc5');out+=plant(x+w-13,y+d-12);
  }else if(key==='alpine'){
   out+=box(x,y,w,3,0,51,'#a18257','#8d7250','#675238');
   out+=poly([P(x,y,51),P(x+w,y,51),P(x+w*.51,y,87)],'#80633f');
   for(let i=1;i<17;i++)out+=line(P(x+i*w/17,y+3.2,16),P(x+i*w/17,y+3.2,50),'#5f4b34',.65);
   for(const xx of[x+2,x+42,x+82,x+125,x+166,x+w-2])out+=line(P(xx,y+3.5,0),P(xx,y+3.5,51),'#51442f',3.2);
   for(const zz of[15,50])out+=line(P(x,y+3.6,zz),P(x+w,y+3.6,zz),'#634c31',2.9);
   out+=line(P(x,y+2.7,51),P(x+w*.51,y+2.7,87),'#c29d63',3.3)+line(P(x+w*.51,y+2.7,87),P(x+w,y+2.7,51),'#a48250',3.3);
   const cx=x+104,cy=y+4,cz=34,r=13;out+=poly(Array.from({length:48},(_,i)=>P(cx+Math.cos(i*Math.PI/24)*r,cy,cz+Math.sin(i*Math.PI/24)*r)),'#95b6a9','#d0b174',3.4);
   out+=poly(Array.from({length:32},(_,i)=>P(cx+Math.cos(i*Math.PI/16)*r*.54,cy+.1,cz+Math.sin(i*Math.PI/16)*r*.54)),'none','#ccb57e',.9);
   out+=line(P(cx-r,cy+.2,cz),P(cx+r,cy+.2,cz),'#e0c591',1.2)+line(P(cx,cy+.2,cz-r),P(cx,cy+.2,cz+r),'#e0c591',1.2);
   out+=box(x,y,3,43,0,32,'#7e7053','#5a543e','#6d674e')+box(x,y+d-42,3,42,0,15,'#8a8365','#706d53','#68624a');
   out+=box(x+78,y+5,53,13,0,12,'#a49269','#7f6846','#655438')+floor(x+80,y+6,49,10,12.4,'#737b5a');
   out+=box(x+w-26,y+15,12,12,0,19,'#455951','#334a42','#2d423d');out+=poly([P(x+w-23,y+27.1,4),P(x+w-17,y+27.1,4),P(x+w-17,y+27.1,12),P(x+w-23,y+27.1,12)],'#c9a267');out+=line(P(x+w-20,y+19,19),P(x+w-20,y+19,46),'#41564c',3.8);
   for(let i=0;i<5;i++)out+=box(x+w-43+i%3*4,y+13+Math.floor(i/3)*5,3.5,5,0,3.3,'#bf9f68','#926f43','#785635');
  }else if(key==='studio'){
   out+=wall(x,y,w,3,{wall:'#d8ceb0',panel:'#c4b89a'});
   for(const xx of[x+19,x+82,x+145]){
    out+=poly([P(xx,y+3.4,23),P(xx+44,y+3.4,23),P(xx+44,y+3.4,45),P(xx,y+3.4,45)],'#9fbbb0','#647c6b',2.0);
    for(let i=0;i<4;i++)out+=line(P(xx+i*14.7,y+3.6,23),P(xx+i*14.7,y+3.6,45),'#e1d5b1',.9);out+=line(P(xx,y+3.6,34),P(xx+44,y+3.6,34),'#e1d5b1',1);
   }
   out+=box(x,y,3,41,0,37,'#d1c4a4','#bdaf8e','#a49672');
   out+=box(x+9,y+7,107,3,7,20,'#c1a679','#b19665','#8b714a');
   for(let i=0;i<8;i++)for(let j=0;j<3;j++){const [a,c]=P(x+14+i*12.5,y+10.1,10+j*5.0);out+=circle(a,c,.4,'#88734f');}
   for(const [xx,zz]of[[x+22,14],[x+42,17],[x+71,12],[x+90,17]]){out+=line(P(xx,y+10.4,zz),P(xx+9,y+10.4,zz+1),'#63806d',2.3)+line(P(xx+2,y+10.4,zz-4),P(xx+2,y+10.4,zz+4),'#bda16e',1.1);}
   out+=shelf(x+w-30,y+6,24);
  }else{
   out+=wall(x,y,w,3,p)+windowArt(x+w*.58,y+3.15);
   out+=box(x,y,3,d*.26,0,42,p.wall,p.panel,p.panel)+box(x,y+d*.73,3,d*.27,0,18,p.wall,p.panel,p.panel);
   out+=shelf(x+10,y+4,48)+plant(x+w-12,y+16);
  }
  return out;
 }
 function grand(){
  const x=32,y=237,w=146,d=116;let out=baseRoom('valley');
  out+=floor(18,224,170,143,.2,'#9c7951');out+=floor(21,227,164,137,.3,'#b39464');
  out+=table(x,y,w,d,'#859264');
  out+=poly([[x+72,y+3],[x+88,y+7],[x+90,y+28],[x+80,y+38],[x+81,y+58],[x+99,y+71],[x+96,y+100],[x+107,y+113],[x+117,y+113],[x+107,y+99],[x+110,y+65],[x+94,y+52],[x+94,y+37],[x+103,y+27],[x+102,y+4]].map(q=>P(...q,28.7)),'#81aaa6');
  for(let i=0;i<8;i++){const yy=y+8+i*12;out+=line(P(x+87+(i%3)*5,yy,29),P(x+93+(i%3)*5,yy,29),'#c4c8ad',.65,'opacity=".6"');}
  out+=rails(oval(x+73,y+57,63,46),29,.33,'#ac8760');out+=rails(oval(x+62,y+58,42,28),29,.82,'#7c7f62');
  out+=floor(x+17,y+29,42,38,29,'#b6aa81');out+=floor(x+31,y+29,4,44,29.2,'#d3c09a');out+=floor(x+13,y+47,53,4,29.2,'#d3c09a');
  for(const [xx,yy]of[[18,31],[39,31],[17,55],[40,55],[51,43]])out+=house(x+xx,y+yy,8.5,7.5,29.5,'#d1c5a3','#866a55');
  for(let i=0;i<30;i++){const xx=x+6+(i*37)%133,yy=y+8+(i*23)%102;if(xx<x+13||xx>x+123||yy<y+16||yy>y+98)out+=tree(xx,yy,29,.66+i%3*.09,i%3===0);}
  // A church green, allotments, and a second street reward a closer look.
  out+=floor(x+34,y+73,30,13,29.1,'#b7ae84');
  for(let i=0;i<3;i++)out+=house(x+35+i*10,y+75,7,6,29.3,'#d8c8a5','#7f7059',6);
  out+=house(x+57,y+35,8,13,29.2,'#c5bea0','#788274',10)+box(x+59,y+44,4,4,29.2,18,'#b9b79c','#c9c2a3','#a5ad92');
  out+=poly([P(x+58,y+43,47.2),P(x+64,y+43,47.2),P(x+61,y+46,55),P(x+58,y+49,47.2)],'#6f8070');
  for(let i=0;i<16;i++){const xx=x+105+(i%4)*6.7,yy=y+13+Math.floor(i/4)*8;out+=tree(xx,yy,29,.54+i%3*.055);}
  for(let i=0;i<5;i++)out+=floor(x+17,y+76+i*3.2,11,1.7,29.2,i%2?'#7d8b59':'#a79865');
  // The old stone viaduct crosses the river, with its piers visible beneath.
  for(let i=0;i<5;i++)out+=box(x+77+i*5,y+92,1.4,4,29,4,'#d3c6a0','#aaa58a','#989780');out+=box(x+76,y+91,26,5,33,1.4,'#c3b894','#aaa58b','#93947f');
  out+=house(x+103,y+55,13,5,29,'#d7c29b','#697d67',6);out+=floor(x+103,y+61,20,3,29.2,'#d9c99e');
  for(let i=0;i<13;i++)out+=person(x+22+i%4*7,y+43+Math.floor(i/4)*7,29.2,['#a77656','#72848a','#5e7356'][i%3],.37);
  out+=plant(17,362)+plant(194,362);
  return out+'</g>';
 }
 function coastal(){
  const x=270,y=37,w=145,d=113;let out=baseRoom('coast');
  for(const xx of[x+7,x+w-10])for(const yy of[y+6,y+d-9])out+=box(xx,yy,2.7,2.7,0,25,'#c7cead','#94afa0','#7b9b8c');
  out+=box(x,y,w,d,24,4,'#d9c99c','#69988d','#557f75')+floor(x+.8,y+.8,w-1.6,d-1.6,28.3,'#609ba0');out+=line(P(x,y+d,27.5),P(x+w,y+d,27.5),'#e8d6a4',1.1);
  const shore=[[0,0],[145,0],[145,75],[133,87],[126,85],[125,69],[114,67],[110,54],[115,39],[105,29],[89,30],[78,39],[63,31],[51,31],[44,40],[43,63],[45,88],[35,104],[0,112]];
  out+=poly(shore.map(([xx,yy])=>P(x+xx,y+yy,29)),'#b6c297');
  out+=island([[x+100,y+18],[x+134,y+13],[x+144,y+26],[x+140,y+56],[x+132,y+72],[x+119,y+74],[x+111,y+64],[x+106,y+51],[x+113,y+38]],29,9,'#b6c29a','#e4dcc0');
  out+=poly([[x+1,y+1],[x+103,y+1],[x+107,y+16],[x+82,y+22],[x+67,y+16],[x+51,y+23],[x+34,y+15],[x+1,y+21]].map(q=>P(...q,32)),'#a1b789');
  for(let i=0;i<15;i++){const xx=x+53+(i%4)*18,yy=y+47+Math.floor(i/4)*15;out+=line(P(xx,yy,29),P(xx+7,yy-.7,29),'#b5d2c2',.75);}
  const route=curve([[-40,1.65,-5],[-37,1.65,12],[-26,1.7,23],[-10,1.9,26],[9,2.45,25],[25,3,18],[33,3.65,3],[39,4.1,-8],[32,4.1,-22],[16,3.6,-25],[2,2.8,-19],[-15,2.1,-23],[-31,1.65,-19]].map(([xx,zz,yy])=>[x+(xx+48)/96*w,y+(yy+32)/64*d,29+zz*1.6]));
  for(let i=0;i<route.length;i+=3){const [xx,yy,zz]=route[i];if(yy>y+83&&xx>x+37&&xx<x+126)out+=box(xx-.6,yy-.6,1.2,1.2,29,zz-29,'#c4c7a7','#91a88f','#7b9b87');}
  out+=rails(route,29,.26,'#47705b',86);
  out+=floor(x+22,y+32,16,53,29.4,'#d8c8a0');out+=floor(x+37,y+36,5,57,29.6,'#e2d3ad');
  for(const [i,xx,yy]of[[0,14,34],[1,14,48],[2,14,62],[3,16,76]])out+=house(x+xx,y+yy,10,8,29.6,['#d8b294','#b3c6b3','#ded0aa','#afc6c2'][i],['#628b80','#af8769'][i%2],8);
  for(let i=0;i<3;i++){out+=floor(x+42,y+44+i*16,23,3.6,30,'#b99a69');for(let j=0;j<4;j++)out+=box(x+43+j*6,y+43.8+i*16,1,4,28,2.6,'#cdb782','#9a8e67','#8b8767');}
  for(const [i,xx,yy]of[[0,59,51],[1,62,79],[2,83,67]]){out+=poly([P(x+xx,y+yy-5,29.7),P(x+xx+3,y+yy-1,29.7),P(x+xx+2,y+yy+7,29.7),P(x+xx-2,y+yy+7,29.7),P(x+xx-3,y+yy-1,29.7)],i===1?'#b77960':'#ded1a7');out+=line(P(x+xx,y+yy,30),P(x+xx,y+yy,45),'#d4c49b',.85);out+=poly([P(x+xx,y+yy,45),P(x+xx,y+yy,32),P(x+xx+8,y+yy,33)],'#f5eccc');}
  const lx=x+115,ly=y+47;out+=floor(lx-4,ly-3,11,10,38.2,'#d9d3ae');out+=box(lx,ly,5,5,38.5,21,'#e7e0bf','#f0e4c5','#c3c6ac');out+=box(lx,ly,5,5,47,3,'#b88568','#b38369','#a97861');out+=box(lx-1,ly-1,7,7,59.5,1,'#6d9182','#597d70','#4f7367');out+=box(lx+.2,ly+.2,4.6,4.6,60.5,4,'#e9dbaf','#c8ddbb','#9fc2af');out+=poly([P(lx-1,ly-1,65),P(lx+6,ly-1,65),P(lx+2.5,ly+2.5,69),P(lx-1,ly+6,65)],'#507568');
  out+=house(x+129,y+26,9,7,38,'#e0d5b3','#789986',6);
  for(const [xx,yy,ss]of[[11,11,.74],[24,14,.64],[39,9,.80],[62,10,.63],[85,12,.64],[139,13,.79],[7,94,.68]])out+=seaPine(x+xx,y+yy,32,ss);
  for(let i=0;i<6;i++)out+=person(x+33,y+40+i*8,30,['#a97b5e','#78998c','#c4ae78'][i%3],.32);
  return out+'</g>';
 }
 function mountain(){
  const x=30,y=40,w=152,d=112;let out=baseRoom('alpine');out+=table(x,y,w,d,'#728c73');
  out+=island([[x+46,y+12],[x+93,y+3],[x+133,y+13],[x+150,y+39],[x+138,y+79],[x+108,y+88],[x+76,y+70],[x+50,y+44]],29,7,'#87997c','#637e69');
  const lake=curve([[x+35,y+52],[x+49,y+45],[x+65,y+50],[x+74,y+59],[x+66,y+74],[x+52,y+78],[x+41,y+72],[x+28,y+65]],5);out+=poly(lake.map(q=>P(...q,29.5)),'#adc2a0');out+=poly(lake.map(([xx,yy])=>P(x+51+(xx-x-51)*.88,y+62+(yy-y-62)*.85,29.7)),'#467f7c');
  out+=path([[x+52,y+77],[x+57,y+91],[x+53,y+109]].map(q=>P(...q,29.8)),'#679b90',2.5);
  const route=curve([[-38,2.8,9],[-29,2.8,21],[-8,3.3,24],[4,4.3,15],[6,5.4,-3],[19,8.2,-14],[35,10.6,-10],[43,11.6,3],[32,11.3,16],[16,10.5,18],[0,8.8,8],[-16,6,-6],[-32,4.1,-14],[-43,2.8,-6]].map(([xx,zz,yy])=>[x+(xx+52)/104*w,y+(yy+33)/66*d,29+zz*1.3]));
  // The high traverse reads as a folded railway, with stone piers on its ridge.
  for(let i=0;i<route.length;i+=3){const [xx,yy,zz]=route[i];if(zz>39&&yy>y+70)out+=box(xx-.8,yy-.8,1.6,2,29,zz-29-.5,'#c7c5a8','#adb39a','#919f8d');}
  out+=rails(route,29,.40,'#bc5b42',96);
  const crag=(xx,yy,rx,ry,h)=>{
   const b0=P(xx-rx,yy+ry*.15,33),b1=P(xx-rx*.50,yy+ry,33),b2=P(xx+rx*.35,yy+ry*.83,33),b3=P(xx+rx,yy-ry*.1,33),rear=P(xx+rx*.48,yy-ry,33),p0=P(xx-rx*.22,yy-ry*.10,33+h),p1=P(xx+rx*.29,yy-ry*.22,33+h*.71),ledge=P(xx-rx*.23,yy+ry*.31,33+h*.43);
   let a=poly([b0,b1,ledge,p0],'#64786c')+poly([b1,b2,p1,ledge],'#829084')+poly([ledge,p1,p0],'#9ba697')+poly([b2,b3,p1],'#4d695f')+poly([p1,b3,rear,p0],'#3b5952');
   a+=poly([p0,[p0[0]+(b0[0]-p0[0])*.18,p0[1]+(b0[1]-p0[1])*.18],[p0[0]+(ledge[0]-p0[0])*.23,p0[1]+(ledge[1]-p0[1])*.23],[p0[0]+(p1[0]-p0[0])*.43,p0[1]+(p1[1]-p0[1])*.43]],'#e0e3d1');
   a+=line([p0[0]+2,p0[1]+8],ledge,'#50665e',.9)+line(ledge,[b1[0]+4,b1[1]-6],'#425f53',.85)+line(p1,[b3[0]-5,b3[1]-6],'#2e5048',1.05);return a;
  };
  out+=crag(x+68,y+17,24,15,42)+crag(x+99,y+21,25,18,60)+crag(x+123,y+37,19,15,37);
  for(const [xx,yy,ss]of[[12,30,.65],[16,42,.68],[22,25,.6],[21,86,.67],[34,91,.8],[86,93,.65],[96,99,.74],[138,78,.66],[139,58,.63],[130,95,.62],[39,29,.55],[46,37,.51]])out+=tree(x+xx,y+yy,30,ss,true,yy<35);
  for(const [xx,yy,ww]of[[13,61,10],[15,74,9],[28,78,9],[8,49,8]])out+=house(x+xx,y+yy,ww,8,30,'#c0b394','#615e48',7.5);
  out+=house(x+112,y+26,7,6,43,'#aa9875','#6e6e56',6);
  for(let i=0;i<5;i++)out+=person(x+30+i*6,y+84-i%2*3,30,['#af7253','#819783','#c3ad76'][i%3],.32);
  return out+'</g>';
 }
 function shop(){
  let out=baseRoom('studio');
  // An asymmetric working bench runs under the toolboard. The stools are empty;
  // open plans, paint pots, and one lit task lamp carry the human presence.
  out+=box(244,220,114,22,0,21,'#c7aa74','#907049','#725e3d');
  for(let i=0;i<4;i++)out+=box(248+i*26,240,22,1,3,14,'#a58d5f','#aa8d5b','#7b6843')+line(P(254+i*26,242,11),P(263+i*26,242,11),'#5e765d',1.8);
  out+=floor(251,223,31,14,21.2,'#548273')+floor(290,223,24,15,21.2,'#e6d8b5')+floor(322,225,24,12,21.2,'#75977b');
  for(let i=0;i<8;i++)out+=box(253+i*5.8,222.5,2.3,2.3,21.3,3.6,['#ded1aa','#ab7058','#7c9f92','#beab6c'][i%4],'#b1ac86','#899276');
  out+=line(P(345,230,21),P(345,230,34),'#587563',1.25)+line(P(345,230,34),P(333,230,38),'#819269',1.4)+poly([P(329,228,34),P(338,228,34),P(334,230,39)],'#587c65');
  for(const xx of[271,317]){out+=box(xx,248,7,7,0,10,'#aa8855','#716047','#5d624c');}
  // The finished branch line has a rolling little landscape and a deep timber
  // edge; beside it the next railway is still pale cork and layered foam.
  out+=table(258,273,91,69,'#879e65');
  out+=island([[265,279],[284,277],[303,283],[309,296],[296,301],[275,295]],29,6,'#98ab78','#7d9568');
  out+=rails(curve([[268,316],[268,295],[278,284],[306,284],[333,294],[339,317],[326,330],[298,329],[282,334]]),29,.25,'#597e60',64);
  out+=house(276,308,10,8,29,'#e0cfaa','#957457',7)+house(289,310,8,6,29,'#cbbd96','#7c7452',6)+house(307,305,10,7,29,'#dcc7a2','#6c8062',6);
  out+=floor(273,320,44,3,29.3,'#cabb92');
  for(const [xx,yy,ss]of[[273,283,.47],[285,286,.48],[296,288,.58],[329,320,.5],[320,328,.46],[268,321,.45]])out+=tree(xx,yy,29,ss);
  out+=table(366,282,60,53,'#c9b88d');
  out+=floor(371,287,49,42,29,'#d8c8a1');
  const foam=[[374,289],[393,287],[402,293],[399,302],[386,307],[375,302]];out+=island(foam,29.3,3.1,'#dddccc','#bcbfaa');out+=island(foam.map(([x,y])=>[385+(x-385)*.73,296+(y-296)*.69]),32.4,3.5,'#f0ebd4','#d1d3bb');
  out+=rails(curve([[374,316],[375,300],[386,292],[406,292],[418,304],[416,320],[397,326],[380,325]]),29.4,.52,'#9b8d6b',84);
  out+=floor(399,307,11,11,29.6,'#dfd4b1')+house(401,309,7,6,29.8,'#e4d7b8','#b1ae8b',5);
  for(const [xx,yy]of[[367,301],[367,319],[408,334]]){out+=box(xx,yy,2,2,23,8,'#6e8170','#5e7465','#446153');out+=line(P(xx+1,yy+1,23),P(xx+1,yy+1,32),'#b6a573',.8);}
  out+=box(407,350,24,20,0,19,'#c6ad78','#657d64','#4f6c59')+floor(408,351,22,18,19.3,'#e0ce9f')+box(420,353,7,6,19.5,3,'#92a28c','#6f856e','#5b735e');
  out+=floor(391,345,10,15,.2,'#889976')+box(388,351,6,9,0,6,'#c5ac77','#9e8c61','#817d54');
  out+=plant(252,369)+plant(434,375);
  return out+'</g>';
 }
 function label(key,x,y,anchor){
  const r=HOUSE_ROOMS[key],left=anchor==='end';
  return `<g class="hm-room-label" data-room="${key}" aria-hidden="true"><rect class="hm-label-bg" x="${left?x-190:x}" y="${y-23}" width="190" height="54" rx="3"/><circle class="hm-label-index" cx="${left?x-168:x+22}" cy="${y+3}" r="13"/><text class="hm-label-number" x="${left?x-168:x+22}" y="${y+6.5}" text-anchor="middle">${r.number}</text><text class="hm-label-title" x="${left?x-145:x+45}" y="${y}" >${r.name.replace('The ','')}</text><text class="hm-label-sub" x="${left?x-145:x+45}" y="${y+15}">${r.layout}</text><path class="hm-label-arrow" d="M${left?x-18:x+172},${y-4}l4 4-4 4"/></g>`;
 }
 function draw(){
  let out=`<svg class="hm-dollhouse" viewBox="0 0 1160 695" role="group" aria-label="An illustrated map of the Whistlevale Hobby House. Choose a room to explore."><style>.hm-train-motion{animation:hm-miniature-train 76s linear infinite;animation-play-state:paused}.house-map[open] .hm-train-motion{animation-play-state:running}@keyframes hm-miniature-train{from{stroke-dashoffset:0}to{stroke-dashoffset:-1000}}@media(prefers-reduced-motion:reduce){.hm-train-motion{animation:none!important}}</style><defs><linearGradient id="hm-floor-light" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#eddbad" stop-opacity=".17"/><stop offset="1" stop-color="#624a30" stop-opacity=".08"/></linearGradient><filter id="hm-shadow" x="-25%" y="-25%" width="150%" height="165%"><feDropShadow dx="0" dy="17" stdDeviation="17" flood-color="#756446" flood-opacity=".20"/></filter><radialGradient id="hm-paper-glow"><stop stop-color="#fffbed"/><stop offset="1" stop-color="#efe8d6" stop-opacity="0"/></radialGradient><pattern id="hm-paper" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".35" fill="#9f947a" opacity=".14"/></pattern></defs><ellipse cx="580" cy="370" rx="530" ry="315" fill="url(#hm-paper-glow)"/><rect width="1160" height="695" fill="url(#hm-paper)" opacity=".45"/><g class="hm-building" filter="url(#hm-shadow)">`;
  out+=box(-9,-9,460,402,-17,14,'#c7b28b','#a38a60','#87704d')+box(-11,-11,464,406,-4,3,'#ddc69b','#c4ad7e','#b59a6c');
  out+=floor(0,0,442,384,0,'#b49b70');
  // A continuous, softly patterned gallery connects all four rooms.
  out+=floor(208,0,26,384,.2,'#d3c6a5')+floor(0,179,442,26,.2,'#d3c6a5');
  for(let i=0;i<22;i++)out+=floor(216,i*17+4,10,8,.25,i%2?'#b2b093':'#c2b89a');
  for(let i=0;i<25;i++)out+=floor(i*17+4,187,8,10,.3,i%2?'#b2b093':'#c2b89a');
  out+=mountain()+coastal()+grand()+shop();
  out+=`</g>`;
  // A pair of entrance doors, open to the little world inside.
  out+=poly([P(211,384,0),P(211,400,0),P(211,400,29),P(211,384,29)],'#687963','#d3c4a2',1.2)+poly([P(231,384,0),P(231,400,0),P(231,400,29),P(231,384,29)],'#748268','#d3c4a2',1.2);
  out+=`<g class="hm-map-annotations" aria-hidden="true">${path([[294,153],[355,153],[409,196]],'#a5997b',.8)}${path([[875,177],[829,177],[806,222]],'#a5997b',.8)}${path([[249,487],[300,469],[344,415]],'#a5997b',.8)}${path([[902,523],[820,514],[768,479]],'#a5997b',.8)}<text x="579" y="623" class="hm-entrance" text-anchor="middle">COME IN. STAY A WHILE.</text><path d="M579 606v-20m-4 5 4-5 4 5" stroke="#9d8b61" fill="none" stroke-width="1"/><text x="70" y="636" class="hm-drawing-note">THE HOUSE, IN MINIATURE</text><text x="70" y="651" class="hm-drawing-sub">A place for taking the long way round.</text><g transform="translate(1060 610)"><circle r="21" fill="none" stroke="#b4a68a" stroke-width=".65"/><path d="M0-16 4 5 0 2-4 5Z" fill="#8d937b"/><path d="M0 16 4-5 0-2-4-5Z" fill="#bdb293"/><text y="-27" text-anchor="middle" class="hm-compass">N</text></g></g>`;
  out+=label('alpine',109,150,'start')+label('coast',1060,175,'end')+label('valley',60,483,'start')+label('studio',1092,520,'end');
  out+='</svg>';return out;
 }
 return {draw};
})();
