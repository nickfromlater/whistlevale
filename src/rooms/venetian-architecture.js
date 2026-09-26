'use strict';

// Original modelmaking for the Venetian Salon. All detail is native geometry.
function venetianArch(b,x,y,z,r,rise,thick,depth,color){
 const n=14;
 for(let i=0;i<n;i++){
  const a=i*PI/n,q=(i+1)*PI/n,p=(t,R,H,d)=>[x+Math.cos(t)*R,y+Math.sin(t)*H,z+d];
  for(const d of[-depth/2,depth/2])b.quad(p(a,r,rise,d),p(q,r,rise,d),p(q,r+thick,rise+thick,d),p(a,r+thick,rise+thick,d),shade(color,i%2?1:.96),24);
  b.quad(p(a,r,rise,-depth/2),p(a,r,rise,depth/2),p(q,r,rise,depth/2),p(q,r,rise,-depth/2),color,24);
 }
}
function venetianWindow(b,x,y,z,w,h,balcony=false,lit=true){
 const C=VENETIAN_COLORS,r=w/2,spring=y+h/2-r;
 b.box(x,y-r*.28,z-.075,w,h-r*.5,.12,'#345052',0);
 b.quad([x-r,y-h/2,z],[x+r,y-h/2,z],[x+r,spring,z],[x-r,spring,z],lit?'#dbc398':'#527a77',lit?6:43,[0,0,1]);
 for(let i=0;i<12;i++){const a=i*PI/12,q=(i+1)*PI/12;b.tri([x,spring,z],[x+r*Math.cos(a),spring+r*Math.sin(a),z],[x+r*Math.cos(q),spring+r*Math.sin(q),z],lit?'#e7cea1':'#527a77',lit?6:43);}
 venetianArch(b,x,spring,z+.055,r,r,.10,.14,C.stone);
 for(const side of[-1,1])b.box(x+side*(r+.07),y-r/2,z+.08,.12,h-r,.20,C.stone,24);
 b.box(x,y-.12,z+.095,.067,h-.18,.08,C.stone,24);b.box(x,spring-.07,z+.09,w,.06,.07,C.stone,24);
 b.box(x,y-h/2-.07,z+.12,w+.30,.17,.35,C.stone,24);
 if(balcony){
  b.box(x,y-h/2-.13,z+.52,w+.6,.17,1.18,C.stone,24);
  for(const side of[-1,1])b.beam([x+side*r,y-h/2-.70,z],[x+side*r,y-h/2-.18,z+.8],.085,C.stone,24,6);
  for(let k=0;k<=6;k++)b.cylinder(x-(w+.4)/2+k*(w+.4)/6,y-h/2+.26,z+1.02,.035,.05,.68,C.ink,41,6);
  b.beam([x-(w+.5)/2,y-h/2+.62,z+1.02],[x+(w+.5)/2,y-h/2+.62,z+1.02],.054,C.ink,41,6);
 }
}
function venetianFlowers(b,x,y,z,w=1.6){
 b.box(x,y,z,w,.24,.38,'#a26652',24);
 for(let i=0;i<7;i++){const xx=x-w*.43+i*w*.86/6,h=.15+hash(i,x)*.14;b.sphere(xx,y+h,z,.19,.18,.23,i%3?'#6d8765':'#497f69',8,6,3);b.sphere(xx,y+h+.12,z+.08,.13,.10,.12,i%2?'#d59b9b':'#e4c6a6',0,6,3);}
}
// Every storey is built around openings. There is no opaque building box
// behind the loggias: the soffits, jambs and internal floors have real depth.
const VENETIAN_BLOCKS=[
 {id:'salvia',x:-46,side:-1,w:7.4,d:6.0,h:11.3,color:'#b7b596',floors:3,variant:0},
 {id:'rosa',x:-36.8,side:-1,w:8.0,d:6.6,h:14.2,color:'#bd8074',floors:4,variant:1,terrace:true},
 {id:'oro',x:-20.6,side:-1,w:10.0,d:7.1,h:13.3,color:'#dfc5a2',floors:3,variant:2,loggia:true},
 {id:'acqua',x:-10.4,side:-1,w:6.8,d:6.0,h:11.7,color:'#7c9b91',floors:3,variant:3},
 {id:'levante',x:46,side:-1,w:8,d:6.4,h:14.6,color:'#d0a582',floors:4,variant:4,terrace:true},
 {id:'sale',x:-46,side:1,w:7.4,d:6,h:10.6,color:'#8dada2',floors:3,variant:5},
 {id:'corallo',x:-35.8,side:1,w:8.2,d:6,h:12.7,color:'#c99b88',floors:3,variant:6},
 {id:'mercante',x:-20.8,side:1,w:10,d:6.1,h:11.6,color:'#c5af8b',floors:3,variant:7,loggia:true},
 {id:'dogana',x:17.4,side:1,w:9.6,d:6.7,h:13.2,color:'#c69387',floors:3,variant:8,loggia:true},
 {id:'giada',x:28.4,side:1,w:7,d:6,h:10.8,color:'#9daa92',floors:3,variant:9,terrace:true},
 {id:'tramonto',x:46,side:1,w:8,d:6.6,h:14.1,color:'#ceaa80',floors:4,variant:10}
];
function venetianBuildingSpec(block){
 // Set back from the ENTIRE curved frontage, not just its centre. Include
 // the projecting balcony, coping and roof in the dry-land clearance margin.
 let edge=block.side<0?Infinity:-Infinity;
 for(let i=0;i<=20;i++){
  const x=block.x+(i/20-.5)*(block.w+.9),bounds=venetianWaterBounds(x);
  if(bounds)edge=block.side<0?Math.min(edge,bounds[0]):Math.max(edge,bounds[1]);
 }
 return {...block,z:edge+block.side*(1.38+block.d/2),angle:block.side<0?0:PI};
}
function venetianFaceRect(b,x0,y0,x1,y1,z,c,mat=20){
 if(x1-x0<.0001||y1-y0<.0001)return;
 b.quad([x0,y0,z],[x1,y0,z],[x1,y1,z],[x0,y1,z],c,mat,[0,0,1]);
}
function venetianOpeningProfile(t,r,spring,rise,pointed){
 const x=-r+2*r*t,u=Math.abs(x/r);
 return [x,spring+rise*(pointed?Math.sqrt(Math.max(0,1-((u+1)/2)**2))/Math.sqrt(.75):Math.sqrt(Math.max(0,1-u*u)))];
}
function venetianFacadeCell(b,{x,y0,y1,pitch,r,front,color,variant,open=false,pointed=false,door=false,segments=10}){
 const C=VENETIAN_COLORS,sill=y0+(door?.08:.58),rise=pointed?r*1.22:r*.9,spring=y1-.42-rise,n=segments;
 const wall=(a,c,d,e)=>venetianFaceRect(b,a,c,d,e,front,color);
 wall(x-pitch/2,y0,x-r,y1);wall(x+r,y0,x+pitch/2,y1);wall(x-r,y0,x+r,sill);
 for(let i=0;i<n;i++){
  const A=venetianOpeningProfile(i/n,r,spring,rise,pointed),B=venetianOpeningProfile((i+1)/n,r,spring,rise,pointed);
  b.quad([x+A[0],A[1],front],[x+B[0],B[1],front],[x+B[0],y1,front],[x+A[0],y1,front],color,20,[0,0,1]);
  // Thick, shaded masonry intrados. Its silhouette also casts a real shadow.
  b.quad([x+A[0],A[1],front],[x+A[0],A[1],front-.30],[x+B[0],B[1],front-.30],[x+B[0],B[1],front],C.shadow,24);
  const a=venetianOpeningProfile(i/n,r+.10,spring,rise+.12,pointed),q=venetianOpeningProfile((i+1)/n,r+.10,spring,rise+.12,pointed);
  b.quad([x+A[0],A[1],front+.05],[x+B[0],B[1],front+.05],[x+q[0],q[1],front+.05],[x+a[0],a[1],front+.05],C.stone,24,[0,0,1]);
 }
 for(const side of[-1,1]){
  b.quad([x+side*r,sill,front],[x+side*r,spring,front],[x+side*r,spring,front-.30],[x+side*r,sill,front-.30],C.shadow,24);
  b.box(x+side*(r+.052),(sill+spring)/2,front+.035,.10,spring-sill,.12,C.stone,24);
 }
 b.box(x,sill-.045,front-.02,r*2+.28,.13,.52,C.stone,24);
 if(open)return;
 // Dark saloon behind glass, with different curtain openings and occasional
 // warm windows. No luminous solid card on the exterior wall plane.
 const back=front-.38,lit=variant%4===0;
 venetianFaceRect(b,x-r,sill,x+r,spring,back,lit?'#ab9474':'#304a49',lit?6:43);
 for(let i=0;i<n;i++){
  const a=venetianOpeningProfile(i/n,r,spring,rise,pointed),q=venetianOpeningProfile((i+1)/n,r,spring,rise,pointed);
  b.tri([x,spring,back],[x+q[0],q[1],back],[x+a[0],a[1],back],lit?'#ad977d':'#304a49',lit?6:43);
 }
 if(door){
  for(const side of[-1,1]){b.box(x+side*r*.51,(sill+spring)/2,front-.32,r*.89,spring-sill,.08,'#49665f',22);b.box(x+side*.12,sill+.98,front-.25,.035,.32,.06,C.gold,41);}
 }else{
  b.box(x,(sill+spring+rise)/2,front-.18,.055,spring+rise-sill,.06,C.stone,24);
  b.box(x,spring-.30,front-.18,r*2,.05,.07,C.stone,24);
  if(variant%3===0)for(const side of[-1,1])b.box(x+side*r*.78,(sill+spring)/2,front-.27,r*.32,spring-sill,.035,'#d4c6a7',23);
 }
}
function venetianBalcony(b,x,y,z,w,stone=false){
 const C=VENETIAN_COLORS,c=stone?C.stone:'#36514d';
 b.box(x,y-.12,z+.27,w+.30,.18,.90,C.stone,24);
 for(const side of[-1,1]){
  b.beam([x+side*w*.34,y-.65,z-.12],[x+side*w*.34,y-.18,z+.53],.072,C.stone,24,5);
  b.box(x+side*(w/2+.03),y+.38,z+.27,.065,.82,.82,c,stone?24:41);
 }
 for(let i=0;i<=Math.ceil(w/.29);i++){
  const xx=x-w/2+i*w/Math.ceil(w/.29);
  b.box(xx,y+.40,z+.70,stone?.072:.029,.84,.055,c,stone?24:41);
  if(stone)b.cylinder(xx,y+.27,z+.70,.077,.047,.27,C.stone,24,6);
 }
 b.box(x,y+.85,z+.70,w+.18,.065,.085,c,stone?24:41);
}
function venetianShutters(b,x,y,z,r,h,variant){
 const c=['#547a69','#365e58','#75877c'][variant%3];
 for(const side of[-1,1]){
  b.push(x+side*(r+.14),y,z,0,-side*.22);
  b.box(side*.21,0,0,.43,h,.07,c,22);
  for(let k=0;k<6;k++)venetianFaceRect(b,side*.21-.16,-h*.40+k*h*.15,side*.21+.16,-h*.40+k*h*.15+.036,.04,'#274f48',22);
  b.pop();
 }
}
function venetianRoof(b,w,d,y,rise,variant){
 const C=VENETIAN_COLORS,X=w/2+.28,Z=d/2+.28,R=Math.max(.65,X-Z*.62),color=['#98624f','#ab7057','#9f6d55'][variant%3];
 const A=[-X,y,Z],B=[X,y,Z],D=[-X,y,-Z],E=[X,y,-Z],L=[-R,y+rise,0],Q=[R,y+rise,0];
 b.quad(A,B,Q,L,color,5);b.quad(E,D,L,Q,shade(color,.88),5);b.tri(D,A,L,shade(color,.92),5);b.tri(B,E,Q,shade(color,1.02),5);
 // Curved cap tiles sit above the hipped roof instead of a single flat gable.
 const cap=(a,q)=>{const v=sub(q,a),r=norm(cross(v,[0,1,0]));
  for(let j=0;j<5;j++){const t=j*PI/5,u=(j+1)*PI/5,p=(s,h)=>add(add(s,mul(r,Math.cos(h)*.085)),[0,.027+Math.sin(h)*.085,0]);b.quad(p(a,t),p(q,t),p(q,u),p(a,u),shade(color,1.15),5);}
 };
 cap(L,Q);for(const [a,q]of[[A,L],[D,L],[B,Q],[E,Q]])cap(a,q);
 for(const side of[-1,1]){
  for(let i=0;i<Math.floor(w/.43);i++){
   const x=-w/2+(i+.5)*w/Math.floor(w/.43);
   b.beam([x,y+.012,side*Z],[x*.82,y+rise*.62,side*Z*.38],.018,shade(color,1.14),5,4);
  }
  b.box(0,y-.11,side*(Z-.07),w+.58,.22,.20,C.stone,24);
  for(let x=-w/2+.25;x<w/2;x+=.62)b.box(x,y-.30,side*(Z-.11),.15,.28,.28,C.stone,24);
 }
 // Bell-mouthed Venetian chimney pots. Each is modeled as a flared stack.
 for(const x of[-w*.31,w*.31]){
  b.box(x,y+.70,-d*.22,.43,1.32,.48,C.brick,4);
  b.push(x,y+1.43,-d*.22,0,PI/4);b.cylinder(0,0,0,.36,.57,.56,'#c18f73',4,4);b.pop();
  b.box(x,y+1.78,-d*.22,.86,.15,.86,C.stone,24);
  b.box(x,y+1.87,-d*.22,.47,.06,.47,'#3e4942',0);
 }
}
function venetianAltana(b,w,d,y,variant){
 const C=VENETIAN_COLORS,W=Math.min(4.5,w*.55),D=Math.min(3,d*.55),z=-.4;
 for(const x of[-W/2,W/2])for(const q of[-D/2,D/2]){
  const X=w/2+.28,Z=d/2+.28,R=Math.max(.65,X-Z*.62),foot=y-1.1+1.45*clamp(Math.min(1-Math.abs(z+q)/Z,(X-Math.abs(x))/(X-R)))-.035,top=y+1.94;
  b.box(x,(foot+top)/2,z+q,.11,top-foot,.11,'#6f7155',22);
 }
 b.box(0,y+.58,z,W+.25,.16,D+.25,'#8c8060',22);
 for(const side of[-1,1]){
  b.box(0,y+1.43,z+side*D/2,W+.22,.08,.09,C.ink,41);
  for(let i=0;i<=7;i++)b.box(-W/2+i*W/7,y+1.03,z+side*D/2,.045,.8,.045,C.ink,41);
  b.box(side*W/2,y+1.43,z,.09,.08,D,C.ink,41);
 }
 for(let i=0;i<6;i++)b.box(-W/2+i*W/5,y+1.87,z,.12,.12,D+.48,'#797453',22);
 for(const x of[-W*.34,W*.34]){
  b.cylinder(x,y+.89,z+.52,.24,.32,.51,'#b88668',24,8);b.sphere(x,y+1.29,z+.52,.45,.52,.40,'#64846e',8,7,4);
 }
}
function venetianPalazzo(b,block){
 const {x,z,w=8,d=6,h=11,color='#ce9a88',angle=0,variant=0,floors=3,loggia=false,terrace=false}=block,C=VENETIAN_COLORS;
 b.push(x,VENETIAN.quay,z,0,angle);
 b.box(0,.20,0,w+.12,.40,d+.12,'#b6aa92',24);
 const step=(h-.45)/floors;
 // Subtle interior floors make the open arcades legible from a moving boat.
 for(let k=0;k<=floors;k++)b.box(0,.43+k*step,0,w,.14,d,'#b9a78a',24);
 for(let face=0;face<4;face++){
  const width=face%2?d:w,depth=face%2?w:d,hero=face===0&&loggia,bays=hero?5:face%2?1:width>8?3:2,pitch=width/bays;
  b.push(0,0,0,0,face*PI/2);
  for(let floor=0;floor<floors;floor++){
   const y0=.45+floor*step,y1=y0+step;
   for(let i=0;i<bays;i++){
    const xx=(i-(bays-1)/2)*pitch,open=hero&&floor===1,r=Math.min(pitch*.34,open?.74:.63),v=variant+i+floor*3+face;
    venetianFacadeCell(b,{x:xx,y0,y1,pitch,r,front:depth/2,color:face===0?color:shade(color,.94),variant:v,open,pointed:hero||variant%3===1,door:floor===0&&i===Math.floor(bays/2),segments:face===0?10:6});
    if(open){
     b.cylinder(xx-pitch/2+.07,y0+1.10,depth/2-.02,.075,.062,1.35,C.stone,24,7);
     b.box(xx-pitch/2+.07,y0+1.80,depth/2,.29,.16,.32,C.stone,24);
    }else if(floor>0&&face===0&&variant%3!==2){
     venetianShutters(b,xx,(y0+y1)/2,depth/2+.10,r,step-1.02,variant+floor);
    }
    if(face===0&&floor===1&&!hero&&i%2===variant%2){venetianBalcony(b,xx,y0+.55,depth/2,r*2+.28);venetianFlowers(b,xx,y0+.86,depth/2+.66,r*1.7);}
   }
   b.box(0,y1-.03,depth/2+.08,width+.24,.13,.25,C.stone,24);
   if(hero&&floor===1){
    venetianBalcony(b,0,y0+.49,depth/2,width-.3,true);
    b.box(0,y0+.50,depth/2-1.0,width-.6,.16,2.2,C.stone,24);
    b.box(-width*.24,y0+1.15,depth/2-1.55,1.1,1.25,.45,'#865d56',23);
    venetianFlowers(b,width*.31,y0+.81,depth/2+.67,1.65);
   }
  }
  // Patches of exposed masonry, drainpipes and uneven cornice blocks reward
  // close inspection without random clutter or another texture atlas.
  for(const side of[-1,1]){
   b.box(side*(width/2-.095),h/2+.4,depth/2+.035,.18,h-.3,.13,C.stone,24);
   if(face===0)b.beam([side*(width/2-.36),.55,depth/2+.20],[side*(width/2-.36),h-.1,depth/2+.20],.037,'#6e7e6c',41,5);
  }
  if(face===0){
   for(let j=0;j<3;j++){const xx=-width/2+.55+j*.36;venetianFaceRect(b,xx,.53+j*.1,xx+.30,1.1+j*.1,depth/2+.006,'#af8871',4);}
   if(loggia)for(let i=0;i<9;i++){
    const xx=-width*.42+i*width*.84/8,yy=h-.45;
    b.quad([xx-.20,yy,depth/2+.06],[xx,yy-.20,depth/2+.06],[xx+.20,yy,depth/2+.06],[xx,yy+.20,depth/2+.06],variant===8?'#8c7368':C.gold,24,[0,0,1]);
   }
  }
  b.pop();
 }
 venetianRoof(b,w,d,h+.20,1.45,variant);
 if(terrace)venetianAltana(b,w,d,h+1.3,variant);
 if(loggia){
  for(let i=0;i<7;i++){
   const xx=-w*.44+i*w*.88/6;b.cylinder(xx,h+.58,d/2+.06,.08,.04,.55,C.stone,24,6);b.sphere(xx,h+.91,d/2+.06,.14,.19,.14,C.stone,24,7,4);
  }
 }
 b.pop();
}
function venetianFondaco(b){
 const C=VENETIAN_COLORS;b.push(-28,1.2,-30.4);
 // Deep arched market arcade, with a shaded garden behind its columns.
 b.box(0,.09,0,44,.18,5.4,'#bbbaa2',24);b.box(0,2.6,-2.2,44,5.2,.32,'#bcaa8b',20);
 for(let i=0;i<10;i++){
  const x=-20+i*4.4;
  for(const side of[-1,1])b.box(x+side*1.92,1.43,1.8,.34,2.85,.50,C.stone,24);
  venetianArch(b,x,2.65,1.8,1.75,1.60,.22,.55,C.stone);
  b.box(x,4.70,1.8,4.4,.90,.55,'#c4ae8b',20);
  if(i%2===0){b.box(x,.7,-.8,2.6,1.3,.9,'#7b8162',22);b.sphere(x,1.80,-.8,.68,.84,.56,'#658069',8,8,5);}
 }
 venetianRoof(b,44,5.1,5.22,1.0,2);
 b.pop();
}

function venetianDome(b,x,y,z,r,h){
 const C=VENETIAN_COLORS;
 b.cylinder(x,y+.36,z,r*.97,r*.97,.72,C.stone,24,24);
 const point=(a,t)=>[x+r*Math.cos(t)*Math.cos(a),y+.7+h*Math.sin(t),z+r*Math.cos(t)*Math.sin(a)];
 for(let i=0;i<28;i++)for(let j=0;j<9;j++){
  const a=i*TAU/28,q=(i+1)*TAU/28,t=j*PI/18,u=(j+1)*PI/18;
  b.quad(point(a,t),point(q,t),point(q,u),point(a,u),shade(C.green,i%2?.94:1.05),41);
 }
 // Raised copper seams share the dome surface. Open-backed ribbons avoid
 // spending most of the roof budget on hidden cylindrical faces.
 for(let i=0;i<14;i++)for(let j=0;j<9;j++){
  const a=i*TAU/14,t=j*PI/18,u=(j+1)*PI/18,p=(angle,phi,up)=>add(point(angle,phi),[0,up,0]);
  b.quad(p(a-.009,t,.027),p(a+.009,t,.027),p(a+.009,u,.027),p(a-.009,u,.027),'#a2b19a',41);
  for(const side of[-1,1])b.quad(p(a+side*.009,t,0),p(a+side*.009,t,.027),p(a+side*.009,u,.027),p(a+side*.009,u,0),'#7b9988',41);
 }
 b.cylinder(x,y+h+1.0,z,.22,.16,.72,C.gold,41,10);b.sphere(x,y+h+1.5,z,.21,.21,.21,C.gold,41,10,6);
 b.beam([x,y+h+1.5,z],[x,y+h+2.25,z],.037,C.gold,41,6);b.beam([x-.23,y+h+1.99,z],[x+.23,y+h+1.99,z],.037,C.gold,41,6);
}
function venetianBasilica(b){
 const C=VENETIAN_COLORS;
 b.push(17.8,1.2,-25.2);
 b.box(0,.15,0,21,.3,14.2,C.stone,24);b.box(0,3.45,0,18,6.4,11.4,'#d6c3a2',24);
 b.box(0,6.6,0,18.7,.32,12.1,C.gold,41);
 for(const xx of[-6,0,6]){
  // Dark set-back portal and its two nested archivolts, not flat painted doors.
  b.box(xx,2.6,5.79,3.6,4.7,.12,C.ink,0);
  venetianWindow(b,xx,2.6,5.89,3.3,4.6,false,false);
  venetianArch(b,xx,3.25,6.04,1.85,2.12,.23,.5,C.stone);
  for(const side of[-1,1]){
   b.cylinder(xx+side*2.15,1.8,6.06,.16,.16,3.4,'#b7a990',24,10);b.cylinder(xx+side*2.15,3.58,6.06,.26,.26,.25,C.gold,41,10);
   b.cylinder(xx+side*2.52,1.8,6.08,.15,.15,3.4,C.stone,24,10);b.cylinder(xx+side*2.52,3.58,6.08,.24,.24,.25,C.gold,41,10);
  }
  // Curved gables and gold mosaic tympana make a distinct Venetian silhouette.
  for(let i=0;i<20;i++){const a=i*PI/20,q=(i+1)*PI/20;b.tri([xx,6.73,5.9],[xx+2.9*Math.cos(a),6.73+2.55*Math.sin(a),5.9],[xx+2.9*Math.cos(q),6.73+2.55*Math.sin(q),5.9],i%2?'#bea374':'#c6b182',24);}
  venetianArch(b,xx,6.73,6.03,2.87,2.55,.17,.28,C.stone);
  b.cylinder(xx,7.56,6.10,.68,.68,.05,C.gold,41,20,PI/2);
  b.cylinder(xx,7.56,6.15,.49,.49,.05,'#799e97',43,18,PI/2);
  for(let k=0;k<8;k++){const a=k*TAU/8;b.beam([xx,7.56,6.19],[xx+.48*Math.cos(a),7.56+.48*Math.sin(a),6.19],.037,C.stone,24,6);}
 }
 for(let i=0;i<=14;i++){const x=-8.7+i*1.24;b.cylinder(x,6.16,6.2,.055,.055,.64,C.stone,24,6);}
 b.box(0,6.54,6.2,18.2,.13,.20,C.stone,24);
 for(const [x,z,r,h]of[[-5.8,-2,2.9,2.5],[5.8,-2,2.9,2.5],[-5.8,3,2.65,2.25],[5.8,3,2.65,2.25],[0,-.2,3.65,4.15]])venetianDome(b,x,7.1,z,r,h);
 for(let i=0;i<3;i++)b.box(0,.10+i*.10,7.2-i*.32,20-i*.5,.2,.7,C.stone,24);
 b.pop();
}
function venetianCampanile(b){
 const C=VENETIAN_COLORS;
 b.push(37,1.2,-25);
 b.box(0,.24,0,5.5,.48,5.5,C.stone,24);b.box(0,9.3,0,4.1,18.2,4.1,'#b67e65',4);
 for(const y of[1,4,8,12,16,18.4])b.box(0,y,0,4.32,.16,4.32,C.stone,24);
 for(const side of[-1,1])for(const z of[-1.84,1.84])b.box(side*1.84,9.3,z,.3,18.1,.3,'#ccb091',24);
 for(let i=0;i<4;i++){
  b.push(0,0,0,0,i*PI/2);
  b.box(0,12.5,2.07,.54,2.4,.06,'#506463',0);venetianWindow(b,0,5.6,2.10,.58,1.5,false,false);
  b.cylinder(0,16.2,2.10,.90,.90,.10,C.stone,24,24,PI/2);
  b.cylinder(0,16.2,2.17,.75,.75,.055,'#477270',41,24,PI/2);
  for(let k=0;k<12;k++){const a=k*TAU/12;b.beam([Math.sin(a)*.6,16.2+Math.cos(a)*.6,2.205],[Math.sin(a)*.68,16.2+Math.cos(a)*.68,2.205],.022,C.gold,41,5);}
  b.beam([0,16.2,2.23],[.35,16.43,2.23],.036,C.gold,41,6);b.beam([0,16.2,2.24],[-.05,16.79,2.24],.028,C.gold,41,6);
  // Belfry is open on all four sides and contains a modeled swinging bell.
  for(const x of[-1.87,1.87])b.box(x,20.0,1.87,.38,2.95,.38,C.stone,24);
  venetianArch(b,0,20.65,1.87,1.67,.75,.28,.38,C.stone);
  b.pop();
 }
 b.box(0,18.5,0,5.15,.45,5.15,C.stone,24);b.box(0,21.8,0,5.2,.43,5.2,C.stone,24);
 b.cylinder(0,22.55,0,2.65,2.65,1.15,'#b9c5ae',24,4,0,PI/4);
 const corners=[[-2.7,-2.7],[2.7,-2.7],[2.7,2.7],[-2.7,2.7]];
 for(let i=0;i<4;i++){const a=corners[i],q=corners[(i+1)%4];b.tri([a[0],23.1,a[1]],[q[0],23.1,q[1]],[0,28,0],shade(C.green,.85+i*.065),41);b.beam([a[0],23.1,a[1]],[0,28,0],.055,C.gold,41,6);}
 b.cylinder(0,28.55,0,.09,.09,1.2,C.gold,41,8);b.sphere(0,29.2,0,.27,.27,.27,C.gold,41,10,6);
 b.tri([0,29.35,0],[1.4,29.70,0],[0,30.05,0],C.gold,41);
 b.pop();
}
function venetianChair(b,x,z,angle=0){
 b.push(x,1.2,z,0,angle);for(const a of[-.24,.24])for(const d of[-.22,.22])b.beam([a,0,d],[a*.85,.55,d*.85],.028,'#405b58',41,5);
 b.cylinder(0,.58,0,.33,.33,.10,'#a8765e',22,10);b.beam([-.25,.55,-.25],[-.25,1.12,-.25],.03,'#405b58',41,5);b.beam([.25,.55,-.25],[.25,1.12,-.25],.03,'#405b58',41,5);b.beam([-.25,1.12,-.25],[.25,1.12,-.25],.045,'#a8765e',22,6);b.pop();
}
function venetianCafe(b){
 const C=VENETIAN_COLORS;
 b.push(-27,1.2,22);
 b.box(0,2.0,0,12.7,4,4.8,'#a87969',20);b.box(0,.25,2.45,13,.5,.24,C.stone,24);
 for(const x of[-4,0,4])venetianWindow(b,x,1.95,2.48,2.2,2.8,false,true);
 for(let i=0;i<24;i++){const x=-6.9+i*.6;b.quad([x,3.2,2.5],[x+.6,3.2,2.5],[x+.6,2.73,5.9],[x,2.73,5.9],i%2?'#dfcba8':'#547f7b',23);b.box(x+.3,2.65,5.89,.6,.23,.10,i%2?'#dfcba8':'#547f7b',23);}
 b.box(0,3.95,2.62,9,.56,.13,C.ink,22);hudsonText(b,'CAFFE DELLA LUNA',0,3.93,2.70,8.6,C.stone);
 for(const x of[-6.8,6.8])b.cylinder(x,1.4,5.8,.045,.045,2.8,C.ink,41,7);
 gable(b,13.1,5.0,4.2,1.1,C.roof);b.pop();
 for(const x of[-32,-27,-22]){
  b.cylinder(x,2.12,28.1,.61,.61,.11,C.stone,24,14);b.cylinder(x,1.64,28.1,.065,.065,.94,C.ink,41,8);
  b.cylinder(x,1.23,28.1,.33,.33,.07,C.ink,41,10);
  for(const side of[-1,1])venetianChair(b,x+side*.96,28.1,side*PI/2);
  b.cylinder(x-.17,2.24,28.04,.07,.09,.17,'#efe0c3',24,8);b.cylinder(x+.19,2.23,28.2,.10,.08,.13,'#e5c29c',24,8);
 }
}
function venetianCompass(b,x,z,r,y=1.23){
 for(let i=0;i<16;i++){const a=i*TAU/16,q=(i+1)*TAU/16,m=(a+q)/2,R=i%2?r*.67:r;
  b.tri([x,y,z],[x+Math.sin(a)*r*.25,y,z+Math.cos(a)*r*.25],[x+Math.sin(m)*R,y,z+Math.cos(m)*R],i%2?'#bfa67d':'#577b76',24);
  b.tri([x,y,z],[x+Math.sin(m)*R,y,z+Math.cos(m)*R],[x+Math.sin(q)*r*.25,y,z+Math.cos(q)*r*.25],i%2?'#d4c4a3':'#98afa0',24);
 }
 for(let i=0;i<64;i++){const a=i*TAU/64,q=(i+1)*TAU/64;b.beam([x+Math.sin(a)*r,y,z+Math.cos(a)*r],[x+Math.sin(q)*r,y,z+Math.cos(q)*r],.035,'#c2a276',41,5);}
}
function venetianArchitecture(scene,b){
 for(const block of VENETIAN_BLOCKS)venetianPalazzo(b,venetianBuildingSpec(block));
 venetianPiazzas(b);venetianBasilica(b);venetianCampanile(b);venetianCafe(b);
 venetianCompass(b,17.8,-12.1,3.6);venetianCompass(b,6.5,23,5.0);venetianWell(b,6.5,23);
 venetianMarket(b,39.5,26.5,0);venetianMarket(b,46,30.3,1);
 venetianFondaco(b);
 for(const [x,z]of[[-53,19],[-51,-23],[51,-26],[52,22],[11,28],[27,25]]){
  b.cylinder(x,1.58,z,.6,.8,.78,'#ab7d64',24,10);b.sphere(x,2.88,z,1.15,1.45,1.1,'#6d9277',8,10,7);
 }
 // One suspended laundry line in an alley; deterministic, not random scatter.
 b.beam([-40,7.5,15],[-37.5,7.1,21],.025,'#968b70',2,5);
 for(let i=0;i<4;i++){const t=(i+.5)/5,p=lerpV([-40,7.5,15],[-37.5,7.1,21],t);b.box(p[0],p[1]-.45,p[2],.8,.95,.055,i%2?'#e6d5b6':'#b29998',23);}
 // A slim lantern promenade follows the banks and leaves the bridge landings clear.
 for(const x of[-45,-36,-17,12,25,46])for(const side of[-1,1])venetianLantern(b,x,1.2,venetianCenter(x)+side*8.3,.76);
}
function venetianChandelier(b,x,y,z,s=1){
 const C=VENETIAN_COLORS;b.push(x,y,z,0,0,0,s);
 b.beam([0,1.4,0],[0,7,0],.06,C.gold,41,8);b.sphere(0,.2,0,.82,1.5,.82,'#accdc0',43,12,8);
 b.cylinder(0,-.7,0,1.1,.8,.45,C.gold,41,16);
 for(let i=0;i<8;i++){
  const a=i*TAU/8,x=Math.cos(a),z=Math.sin(a);
  b.beam([0,-.3,0],[x*2.4,-1.4,z*2.4],.09,C.gold,41,7);b.beam([x*2.4,-1.4,z*2.4],[x*3.3,-.5,z*3.3],.09,C.gold,41,7);
  b.cylinder(x*3.3,-.36,z*3.3,.49,.24,.4,'#b6d4bf',43,12);b.cylinder(x*3.3,.21,z*3.3,.12,.12,.92,'#ecddba',25,8);
  b.sphere(x*3.3,.78,z*3.3,.16,.30,.16,'#f0d8a1',25,8,5);
  b.sphere(x*2.4,-2.05,z*2.4,.18,.50,.18,'#a2c4b5',43,8,5);
 }
 b.sphere(0,-2.1,0,.28,.57,.28,'#b8d0b5',43,10,6);b.pop();
}
function venetianShell(b){
 const C=VENETIAN_COLORS,walls=[];
 b.box(0,FLOOR-.3,0,158,.6,130,'#adbdad',24);
 for(let x=-75;x<78;x+=6)for(let z=-61;z<64;z+=6){b.push(x,FLOOR+.025,z,0,PI/4);b.quad([-1.9,.018,-1.9],[-1.9,.018,1.9],[1.9,.018,1.9],[1.9,.018,-1.9],(Math.round(x+z)/6)%2?'#a7b9aa':'#c7cbb6',24,[0,1,0]);b.pop();}
 for(const z of[-59,59])b.box(0,FLOOR+.045,z,146,.045,.18,C.gold,41);
 for(const x of[-73,73])b.box(x,FLOOR+.045,0,.18,.045,118,C.gold,41);
 venetianCompass(b,0,55,6.5,FLOOR+.09);
 for(const which of['back','left','right','front']){
  const w=new Builder(),back=which==='back',front=which==='front',wide=back||front,width=wide?156:128,pos=back?[0,0,-64]:front?[0,0,64]:which==='left'?[-78,0,0]:[78,0,0],angle=back?0:front?PI:which==='left'?PI/2:-PI/2;
  w.push(...pos,0,angle);w.box(0,4,0,width,56,.6,'#a0b6aa',20);
  w.box(0,-16,.4,width,16,.45,'#3e6265',22);w.box(0,-8,.8,width,.45,1,C.gold,41);w.box(0,-23.3,.7,width,1.2,.9,'#496c6b',22);
  w.box(0,30.7,.7,width,1.6,1.8,C.stone,24);w.box(0,29.4,1,width,.21,1.1,C.gold,41);
  for(let xx=-width/2+4;xx<width/2;xx+=9.5){w.box(xx,-16,.73,.14,12,.14,C.gold,41);w.box(xx+4.5,-10.3,.74,8.4,.13,.14,C.gold,41);w.box(xx+4.5,-21.7,.74,8.4,.13,.14,C.gold,41);}
  if(!front){
   const count=wide?5:4,spacing=(width-17)/count;
   for(let i=0;i<count;i++){
    const xx=(i-(count-1)/2)*spacing,r=spacing*.33;
    // A painted lagoon beyond each recessed arched window, made from native
    // geometry rather than a newly allocated atlas or external image asset.
    w.quad([xx-r,-7.3,.43],[xx+r,-7.3,.43],[xx+r,15.9,.43],[xx-r,15.9,.43],'#93b7b0',0,[0,0,1]);
    for(let k=0;k<16;k++){const a=k*PI/16,q=(k+1)*PI/16;w.tri([xx,15.9,.43],[xx+r*Math.cos(a),15.9+r*.93*Math.sin(a),.43],[xx+r*Math.cos(q),15.9+r*.93*Math.sin(q),.43],'#93b7b0',0);}
    w.box(xx,.4,.53,r*2,8.5,.065,'#6d9d99',0);w.box(xx,-4.9,.54,r*2,2.0,.07,'#527d7d',0);
    for(let k=0;k<6;k++){const cx=xx-r+1.4+k*r*.30,h=1.4+hash(k,i)*2.8;w.box(cx,3.25+h/2,.57,r*.3,h,.08,k%2?'#adc2b4':'#a2b9ad',0);}
    venetianArch(w,xx,15.9,.95,r,r*.93,.8,1.0,C.stone);
    for(const side of[-1,1]){w.box(xx+side*(r+.36),4.1,.95,.8,24.1,1.0,C.stone,24);w.box(xx+side*(r+.36),-7.75,1.05,1.5,.5,1.4,C.gold,41);}
    w.box(xx,-7.6,1.12,r*2+1.9,.5,2.0,C.stone,24);
    for(const dx of[-r*.48,0,r*.48])w.box(xx+dx,5.2,1.07,.19,25.9,.28,'#7d9c92',41);
    for(const y of[-1.2,9.0,15.7])w.box(xx,y,1.07,r*2,.19,.28,'#7d9c92',41);
   }
   if(back){const key='house-'+Object.keys(HOUSE_ROOMS).indexOf('venetian');if(roomLabels[key])roomFrame(w,key,0,-16,1.1,39,7);}
  }else{
   w.box(0,-4,1,20,40,1.1,'#385b5f',22);
   for(const s of[-1,1]){w.box(s*4.8,-3.7,1.7,8.6,37.5,.22,'#668b83',22);w.box(s*1.4,-4,1.95,.15,2.2,.24,C.gold,41);}
   w.box(0,19.7,1.2,28,3,.6,C.ink,22);hudsonText(w,'LA SERENISSIMA',0,19.5,1.54,25,C.stone);
   for(const xx of[-44,44]){w.box(xx,6,1,23,25,.6,'#6e9690',22);for(const s of[-1,1]){w.box(xx+s*11.6,6,1.5,.15,25.4,.2,C.gold,41);w.box(xx,6+s*12.6,1.5,23.2,.15,.2,C.gold,41);}w.sphere(xx,7,1.75,3.0,4,1.25,C.stone,24,16,10);for(const s of[-1,1])w.sphere(xx+s*1.12,7.5,2.8,.64,.42,.2,C.ink,0,10,6);w.beam([xx,6.8,3],[xx,5.4,3.8],.21,C.gold,41,8);}
  }
  w.pop();walls.push({which,mesh:w.mesh()});
 }
 for(const [x,z]of[[-34,-8],[34,-8],[0,29]])venetianChandelier(b,x,29,z,1.1);
 // Squero workbench, timber ribs and a hand-built model hull in the west aisle.
 b.push(-71,FLOOR,21,0,PI/2);
 b.box(0,11.6,0,18,.7,6.5,'#9e7859',22);for(const x of[-7,7])for(const z of[-2.3,2.3])b.box(x,5.8,z,.7,11.6,.7,C.ink,22);
 for(let i=0;i<7;i++){const x=-5+i*1.7,r=1.35*Math.sin((i+1)*PI/8);b.beam([x,12.1,-r],[x,11.97,0],.07,C.stone,22,6);b.beam([x,11.97,0],[x,12.1,r],.07,C.stone,22,6);}
 b.beam([-6.3,12,0],[6.3,12,0],.09,'#a97953',22,7);for(let i=0;i<5;i++)b.box(4+i*.35,12.1,2,.11,.16,1.8,'#c8b58c',22);b.pop();
 for(const x of[-38,38]){
  b.box(x,FLOOR+4,55,20,1.2,5.5,'#ac7770',23);b.box(x,FLOOR+6.3,57.3,20,4.5,.9,'#ba8d80',23);
  for(const side of[-1,1])b.box(x+side*8.8,FLOOR+1.9,55,.5,3.8,4.1,C.gold,41);
 }
 return walls;
}


function venetianPiazzas(b){
 const C=VENETIAN_COLORS;
 // Low-contrast inlaid paving separates the piazzas and garden from the quay.
 for(const [cx,cz,w,d]of[[6.5,23,23,20],[19,-12.2,25,9]]){
  b.box(cx,1.208,cz,w,.015,d,'#c5c7af',24);
  for(let x=cx-w/2+.8;x<cx+w/2;x+=1.65)for(let z=cz-d/2+.8;z<cz+d/2;z+=1.65){
   b.push(x,1.221,z,0,PI/4);b.quad([-.49,0,-.49],[-.49,0,.49],[.49,0,.49],[.49,0,-.49],'#e4d7b7',24,[0,1,0]);b.pop();
  }
  for(const side of[-1,1]){b.box(cx,1.222,cz+side*d/2,w,.018,.13,C.stone,24);b.box(cx+side*w/2,1.222,cz,.13,.018,d,C.stone,24);}
 }
 b.box(-27.5,1.212,-29,47,.020,10,'#93a48a',3);
 b.box(-27.5,1.235,-32.7,46,.025,1.4,'#d4c5a5',24);
 // A single suspended garland, supported by its own poles, lights the evening market.
 const a=[-3,7.6,32],z=[17,7.6,32];
 for(const p of[a,z]){b.cylinder(p[0],4.43,p[2],.09,.055,6.45,C.ink,41,8);b.sphere(p[0],7.78,p[2],.15,.24,.15,C.gold,41,8,5);}
 const cable=t=>[mix(a[0],z[0],t),7.6-1.0*Math.sin(PI*t),32];
 for(let i=0;i<24;i++)b.beam(cable(i/24),cable((i+1)/24),.025,C.ink,41,5);
 for(let i=0;i<11;i++){const p=cable((i+.5)/11);b.beam(p,[p[0],p[1]-.32,p[2]],.018,C.ink,41,5);b.sphere(p[0],p[1]-.45,p[2],.16,.22,.16,'#edcf9b',6,8,5);}
}
function venetianWell(b,x,z){
 const C=VENETIAN_COLORS;b.push(x,1.235,z);
 b.cylinder(0,.13,0,1.58,1.58,.26,C.stone,24,24);
 // A hollow carved well, with an actual inset water surface and iron lifting arch.
 for(let i=0;i<24;i++){
  const a=i*TAU/24,q=(i+1)*TAU/24,p=(t,r,y)=>[Math.cos(t)*r,y,Math.sin(t)*r];
  b.quad(p(a,1.11,.26),p(q,1.11,.26),p(q,1.20,1.26),p(a,1.20,1.26),shade(C.stone,i%3?.96:1.05),24);
  b.quad(p(a,.84,.35),p(a,.84,1.35),p(q,.84,1.35),p(q,.84,.35),C.shadow,24);
  b.quad(p(a,1.31,1.35),p(q,1.31,1.35),p(q,.84,1.35),p(a,.84,1.35),C.stone,24,[0,1,0]);
  b.tri([0,.38,0],p(q,.84,.38),p(a,.84,.38),'#537d78',7);
 }
 for(const side of[-1,1])b.beam([side*1.1,1.28,0],[side*1.1,2.55,0],.045,C.ink,41,7);
 for(let i=0;i<20;i++){const a=i*PI/20,q=(i+1)*PI/20;b.beam([Math.cos(a)*1.1,2.55+Math.sin(a)*.85,0],[Math.cos(q)*1.1,2.55+Math.sin(q)*.85,0],.045,C.ink,41,6);}
 b.beam([0,3.35,0],[0,1.5,0],.018,C.ink,41,5);b.cylinder(0,1.34,0,.19,.24,.33,'#9f815b',22,10);b.pop();
}
function venetianMarket(b,x,z,variant){
 const C=VENETIAN_COLORS;b.push(x,1.2,z,0,variant?-.18:.08);
 for(const xx of[-2.1,2.1])for(const zz of[-1.1,1.1])b.cylinder(xx,1.62,zz,.055,.055,3.25,C.ink,41,7);
 for(let i=0;i<12;i++){const xx=-2.4+i*.4,c=i%2?'#e2d1ad':variant?'#9c6b68':'#749689';b.quad([xx,3.22,-1.38],[xx+.4,3.22,-1.38],[xx+.4,3.55,0],[xx,3.55,0],c,23);b.quad([xx,3.55,0],[xx+.4,3.55,0],[xx+.4,3.22,1.38],[xx,3.22,1.38],c,23);b.box(xx+.2,3.10,1.38,.4,.25,.06,c,23);}
 b.box(0,1.08,0,4.15,.15,2.2,'#b3926e',22);
 for(const xx of[-1.4,0,1.4]){
  b.box(xx,1.26,0,1.26,.20,1.7,'#916e50',22);
  for(let i=0;i<7;i++){const dx=xx+((i%3)-1)*.30,dz=(Math.floor(i/3)-1)*.40;b.sphere(dx,1.47,dz,.16,.17,.16,variant?'#bc867e':i%2?'#c6aa60':'#8fa77d',0,7,4);}
 }
 b.box(0,2.7,1.2,3.2,.40,.075,C.ink,22);hudsonText(b,variant?'FIORI':'MERCATO',0,2.69,1.246,2.8,C.stone);b.pop();
}

function venetianQuays(b){
 const C=VENETIAN_COLORS;
 // Individually cut paving follows the finished bank, with transverse seams
 // and a continuous walking strip between the coping and the palazzo doors.
 for(let i=0;i<82;i++){
  const x=-53+i*106/82,q=x+106/82-.055,A=venetianWaterBounds(x),B=venetianWaterBounds(q);if(!A||!B)continue;
  for(const side of[-1,1])for(let row=0;row<2;row++){
   const j=side<0?0:1,a=A[j]+side*(.48+row*.43),c=B[j]+side*(.48+row*.43),w=side*.39;
   b.quad([x,1.232,a],[q,1.232,c],[q,1.232,c+w],[x,1.232,a+w],['#c8bda3','#d4c7ac','#c0b79f'][(i+row)%3],24,[0,1,0]);
  }
 }
 // Recessed stone water-steps occupy only the outer 0.6 of the canal. Their
 // geometry is included in the occupied-water clearance test.
 for(const [x,side]of[[-12,-1],[14,1]]){
  const bounds=venetianWaterBounds(x),edge=bounds[side<0?0:1];
  for(let j=0;j<5;j++)b.box(x,1.09-j*.29,edge+side*(.40-j*.19),1.7,.22,.34,shade(C.stone,.98-j*.035),24);
  for(const dx of[-1,1])b.box(x+dx,1.33,edge+side*.55,.20,.56,.65,C.stone,24);
 }
}
