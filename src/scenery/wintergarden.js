'use strict';

// Wintergarden Station, by nickfromlater. Original miniature architecture for
// both the exhibition and The Commons, made with Whistlevale's shared Builder.
// Clear architectural glazing keeps the planted interior visible through the
// complete iron-and-glass vault, in both the exhibition and the living railway.
const WINTERGARDEN_COLORS={iron:'#365d51',edge:'#709387',brass:'#bc9f63',stone:'#b8b399',pale:'#d6cbb0',brick:'#b68e73',roof:'#547e75',glass:'#afc6bf'};

function wintergardenArc(b,x,y,z,rx,ry,radius,color,start=0,end=Math.PI,segments=16){
 for(let i=0;i<segments;i++){
  const a=start+(end-start)*i/segments,q=start+(end-start)*(i+1)/segments;
  b.beam([x+Math.cos(a)*rx,y+Math.sin(a)*ry,z],[x+Math.cos(q)*rx,y+Math.sin(q)*ry,z],radius,color,41,5);
 }
}
function wintergardenLettering(b,text,x,y,z,size,color){
 const letters={
  A:[[[0,0],[.5,1],[1,0]],[[.2,.4],[.8,.4]]],B:[[[0,0],[0,1],[.7,1],[1,.78],[.7,.53],[0,.53]],[[.7,.53],[1,.28],[.7,0],[0,0]]],
  D:[[[0,0],[0,1],[.55,1],[1,.75],[1,.25],[.55,0],[0,0]]],E:[[[1,1],[0,1],[0,0],[1,0]],[[0,.51],[.75,.51]]],
  G:[[[1,.8],[.75,1],[.2,1],[0,.7],[0,.25],[.2,0],[1,0],[1,.45],[.55,.45]]],I:[[[0,1],[1,1]],[[.5,1],[.5,0]],[[0,0],[1,0]]],
  N:[[[0,0],[0,1],[1,0],[1,1]]],R:[[[0,0],[0,1],[.75,1],[1,.75],[.75,.51],[0,.51]],[[.55,.51],[1,0]]],
  S:[[[1,.9],[.75,1],[.15,1],[0,.75],[.15,.55],[.85,.45],[1,.25],[.85,0],[.15,0],[0,.1]]],T:[[[0,1],[1,1]],[[.5,1],[.5,0]]],
  W:[[[0,1],[.18,0],[.5,.6],[.82,0],[1,1]]],O:[[[.2,0],[0,.25],[0,.75],[.2,1],[.8,1],[1,.75],[1,.25],[.8,0],[.2,0]]]
 };
 const step=size*.85,start=x-(text.length*step-step*.30)/2;
 for(let i=0;i<text.length;i++)for(const path of letters[text[i]]||[]){
  for(let j=1;j<path.length;j++)b.beam([start+i*step+path[j-1][0]*size*.58,y+path[j-1][1]*size,z],[start+i*step+path[j][0]*size*.58,y+path[j][1]*size,z],size*.031,color,23,4);
 }
}
function wintergardenClock(b,x,y,z,angle=0){
 const c=WINTERGARDEN_COLORS;b.push(x,y,z,0,angle);
 b.cylinder(0,0,0,.83,.83,.10,c.iron,41,40,Math.PI/2);
 b.cylinder(0,0,.065,.755,.755,.055,c.brass,41,40,Math.PI/2);
 b.cylinder(0,0,.10,.69,.69,.025,'#efe2bd',23,40,Math.PI/2);
 for(let i=0;i<60;i++){
  const a=i*Math.PI/30,r=i%5===0?.52:.60;
  b.beam([Math.sin(a)*r,Math.cos(a)*r,.126],[Math.sin(a)*.64,Math.cos(a)*.64,.126],i%5===0?.017:.007,c.iron,23,4);
 }
 // The last afternoon departure: the same carefully set hands on every face.
 b.beam([0,0,.144],[-.22,.31,.144],.027,c.iron,41,5);
 b.beam([0,0,.154],[.40,.32,.154],.018,c.iron,41,5);
 b.cylinder(0,0,.17,.055,.055,.028,c.brass,41,12,Math.PI/2);
 b.pop();
}
function wintergardenLantern(b,x,y,z,scale=1){
 const c=WINTERGARDEN_COLORS;b.push(x,y,z,0,0,0,scale);
 b.box(0,.25,0,.23,.40,.23,'#ead29b',10);
 for(const dx of[-.135,.135])for(const dz of[-.135,.135])b.beam([dx,.03,dz],[dx*.83,.48,dz*.83],.019,c.iron,41,4);
 b.box(0,.02,0,.33,.06,.33,c.iron,41);b.cylinder(0,.56,0,.27,.065,.17,c.iron,41,4);
 b.beam([0,.65,0],[0,.83,0],.025,c.brass,41,6);b.pop();
}
function wintergardenTower(b){
 const c=WINTERGARDEN_COLORS;b.push(-7.25,.34,-2.50);
 b.box(0,3.2,0,2.62,6.4,2.62,c.brick,4);
 for(const y of[.15,2.7,5.95,6.43,8.26])b.box(0,y,0,y===8.26?3.20:2.89,.16,y===8.26?3.20:2.89,c.pale,4);
 // Alternating pale corner quoins give the slim tower its masonry scale.
 for(let k=0;k<14;k++)for(const x of[-1.28,1.28])for(const z of[-1.28,1.28])b.box(x,.42+k*.39,z,k%2?.31:.44,.20,k%2?.44:.31,c.pale,4);
 b.box(0,7.35,0,2.69,1.78,2.69,'#c3b997',4);
 for(const [x,z,a]of[[0,1.40,0],[1.40,0,Math.PI/2],[0,-1.40,Math.PI],[-1.40,0,-Math.PI/2]])wintergardenClock(b,x,7.36,z,a);
 // Tall louvres are recessed in all four sides beneath the clock chamber.
 for(let side=0;side<4;side++){
  b.push(0,0,0,0,side*Math.PI/2);b.box(0,4.72,1.325,.91,1.55,.04,'#384f43',23);
  for(let j=0;j<8;j++)b.box(0,4.06+j*.19,1.37,.94,.073,.14,c.edge,22);
  for(const x of[-.51,.51])b.box(x,4.69,1.37,.12,1.72,.15,c.pale,4);
  wintergardenArc(b,0,5.53,1.40,.5,.31,.055,c.pale);b.pop();
 }
 // A swept copper pavilion roof has a shallow flared skirt and steep shoulder.
 const profile=[[8.36,1.68],[8.47,1.46],[8.66,1.27],[9.46,.40],[9.68,.08]];
 for(let ring=0;ring<profile.length-1;ring++)for(let side=0;side<4;side++){
  const [yy,r]=profile[ring],[qy,s]=profile[ring+1],p=(u,v)=>[u,yy,v],q=(u,v)=>[u,qy,v];
  b.push(0,0,0,0,side*Math.PI/2);
  b.quad(p(-r,r),p(r,r),q(s,s),q(-s,s),side%2?'#729487':c.roof,5);
  for(const fraction of[-1,-.5,0,.5,1])b.beam(p(r*fraction,r+.007),q(s*fraction,s+.007),.018,c.edge,41,4);
  b.pop();
 }
 b.sphere(0,9.72,0,.12,.12,.12,c.brass,41,10,6);
 b.beam([0,9.7,0],[0,10.50,0],.027,c.brass,41,5);
 b.beam([-.48,10.25,0],[.42,10.25,0],.023,c.brass,41,4);
 b.tri([.61,10.25,0],[.34,10.40,0],[.34,10.10,0],c.brass,41);
 b.quad([-.48,10.10,0],[-.70,10.10,0],[-.70,10.40,0],[-.48,10.40,0],c.brass,41);
 b.pop();
}
function wintergardenTicketHall(b){
 const c=WINTERGARDEN_COLORS;b.push(-7.15,.34,1.45);
 const w=3.16,d=4.5,eave=3.35,peak=4.72;
 b.box(0,1.63,-d/2,w,3.26,.18,c.brick,4);b.box(-w/2,1.63,0,.18,3.26,d,c.brick,4);
 // An open passage joins the glasshouse; the front has real door/window gaps.
 for(const z of[-1.88,1.77])b.box(w/2,1.63,z,.18,3.26,z<0?.72:.96,c.brick,4);
 b.box(w/2,2.95,0,.18,.55,d,c.brick,4);
 for(const [x,width]of[[-1.43,.30],[-.30,.28],[1.41,.34]])b.box(x,1.55,d/2,width,3.10,.18,c.brick,4);
 b.box(-.90,.66,d/2,.82,1.32,.18,c.brick,4);b.box(0,2.97,d/2,w,.40,.18,c.brick,4);
 for(const side of[-1,1])b.box(side*w/2,3.35,0,.23,.17,d+.20,c.pale,4);
 b.box(0,3.35,d/2,w+.25,.17,.23,c.pale,4);
 b.box(-.90,1.96,1.70,.90,1.32,.055,'#384e45',23);
 for(let r=0;r<3;r++)for(let j=0;j<3;j++){
  b.box(-1.21+j*.30,1.51+r*.32,1.76,.25,.27,.035,'#ba9e74',22);
  b.box(-1.21+j*.30,1.48+r*.32,1.79,.17,.06,.025,'#e1d6bc',23);
 }
 for(const x of[-1.37,-.43])b.box(x,2.01,2.34,.085,1.42,.20,c.iron,41);
 for(const y of[1.30,2.74])b.box(-.90,y,2.34,1.07,.09,.20,c.iron,41);
 b.box(-.90,1.30,2.37,1.14,.10,.52,'#bba27a',22);
 b.box(-.90,1.95,2.34,.045,1.34,.055,c.brass,41);
 // A half-open door, paneled below a warm transom.
 b.push(.17,.05,2.25,0,-.30);b.box(.49,1.02,0,.98,2.04,.08,c.iron,22);
 b.box(.49,1.52,.051,.71,.69,.022,'#bed0b4',6);b.box(.49,.49,.051,.68,.66,.025,'#567666',22);
 b.box(.49,1.52,.073,.035,.74,.02,c.pale,22);b.box(.49,1.53,.074,.74,.035,.02,c.pale,22);
 b.sphere(.87,1.04,.10,.035,.035,.03,c.brass,41,8,5);b.pop();
 b.box(.74,2.43,2.26,1.08,.38,.07,'#baceb3',6);
 for(const x of[.16,1.30])b.box(x,1.42,2.36,.10,2.82,.13,c.pale,4);
 wintergardenArc(b,.73,2.64,2.38,.61,.35,.065,c.pale);
 // Warm lamp and a tiny stationmaster's desk are visible through the passage.
 b.box(.54,.86,.65,1.31,.095,.68,'#a18a65',22);
 for(const x of[.02,1.04])for(const z of[.43,.85])b.box(x,.47,z,.06,.77,.06,c.iron,41);
 b.box(.32,.923,.67,.48,.018,.33,'#e3d8b8',23);b.box(.86,.947,.68,.29,.07,.29,'#8b7454',22);
 wintergardenLantern(b,1.06,1.03,.52,.70);
 // Cream gables, slate courses, copper ridge and a slim brick chimney.
 for(const z of[-d/2-.02,d/2+.02])b.tri([-w/2,3.43,z],[w/2,3.43,z],[0,peak,z],c.pale,4);
 b.cylinder(0,3.91,d/2+.044,.29,.29,.045,c.iron,41,24,Math.PI/2);
 b.cylinder(0,3.91,d/2+.073,.23,.23,.017,'#485e50',23,24,Math.PI/2);
 for(let i=0;i<8;i++){const a=i*Math.PI/4;b.beam([0,3.91,d/2+.087],[Math.cos(a)*.235,3.91+Math.sin(a)*.235,d/2+.087],.015,c.brass,41,4);}
 for(const s of[-1,1])for(let row=0;row<7;row++){
  const a=row/7,q=(row+1)/7,point=(t,z)=>[s*(w/2+.28)*t,peak+.08-(peak-eave+.09)*t,z];
  b.quad(point(a,-d/2-.3),point(q,-d/2-.3),point(q,d/2+.3),point(a,d/2+.3),row%2?c.roof:'#54786f',5);
  b.beam(point(q,-d/2-.3),point(q,d/2+.3),.016,c.edge,41,4);
 }
 b.beam([0,peak+.10,-d/2-.32],[0,peak+.10,d/2+.32],.055,c.brass,41,6);
 b.box(-.89,4.22,-.93,.43,1.53,.49,c.brick,4);b.box(-.89,5.01,-.93,.55,.14,.61,c.pale,4);
 b.cylinder(-.89,5.21,-.93,.15,.14,.32,'#ac7759',4,10);
 b.box(-.35,3.09,2.39,2.14,.28,.08,c.iron,41);
 wintergardenLettering(b,'STATION',-.35,3.00,2.443,.18,c.pale);
 b.pop();
}
function wintergardenConservatory(b){
 const c=WINTERGARDEN_COLORS,half=5.65,radius=3.72,eave=3.90,rise=2.55,z0=-.15;
 // Deliberate floor composition: cool borders around a warm tessellated walk.
 for(let i=0;i<24;i++)for(let j=0;j<4;j++){
  const x=-5.52+i*.46,z=-1.05+j*.53;
  b.quad([x,.369,z],[x,.369,z+.50],[x+.43,.369,z+.50],[x+.43,.369,z],(i+j)%2?'#d5cfb5':'#81968a',23);
 }
 for(const z of[-1.11,1.13])b.box(0,.371,z,11.1,.013,.048,c.brass,41);
 for(const s of[-1,1]){
  b.box(0,.62,z0+s*radius,11.52,.50,.24,c.pale,4);
  b.box(0,.91,z0+s*radius,11.70,.11,.34,c.iron,41);
  b.beam([-half,eave,z0+s*radius],[half,eave,z0+s*radius],.075,c.iron,41,6);
  b.beam([-half,eave+.12,z0+s*radius],[half,eave+.12,z0+s*radius],.028,c.brass,41,5);
 }
 const roofPoint=(x,a)=>[x,eave+Math.sin(a)*rise,z0+Math.cos(a)*radius];
 // Closely paired ribs and articulated cast feet read as fabricated ironwork.
 for(let k=0;k<9;k++){
  const x=-half+k*half/4;
  for(const s of[-1,1]){
   b.box(x,2.35,z0+s*radius,.10,3.1,.13,c.iron,41);
   b.box(x,.99,z0+s*radius,.26,.24,.25,c.edge,41);
   b.box(x,3.72,z0+s*radius,.23,.15,.23,c.brass,41);
   b.beam([x,eave-.6,z0+s*radius],[x,eave+.05,z0+s*(radius-.58)],.035,c.iron,41,5);
  }
  for(let j=0;j<18;j++){
   const a=j*Math.PI/18,q=(j+1)*Math.PI/18;
   b.beam(roofPoint(x,a),roofPoint(x,q),k%4===0?.062:.043,c.iron,41,5);
  }
  if(k%2===0){
   b.beam([x,eave+.04,z0-radius],[x,eave+.04,z0+radius],.027,c.edge,41,4);
   b.beam([x,eave+.04,z0],[x,eave+rise,z0],.025,c.brass,41,4);
  }
 }
 for(let j=1;j<8;j++)b.beam(roofPoint(-half,j*Math.PI/8),roofPoint(half,j*Math.PI/8),.025,c.edge,41,4);
 // Individual clear panes fill the complete barrel vault; narrow lead joints
 // remain separate from the iron structure and catch the light along each edge.
 for(let k=0;k<8;k++)for(let j=0;j<8;j++){
  if((k===3||k===4)&&(j===3||j===4))continue;
  const x=-half+k*half/4+.055,q=x+half/4-.11,a=j*Math.PI/8+.018,t=(j+1)*Math.PI/8-.018;
  b.quad(roofPoint(x,a),roofPoint(q,a),roofPoint(q,t),roofPoint(x,t),(k+j)%3===0?'#c1d1c6':(k+j)%2?'#a6c6bb':'#b6cdc3',76);
 }
 b.beam([-half-.12,eave+rise+.035,z0],[half+.12,eave+rise+.035,z0],.072,c.iron,41,6);
 for(let i=0;i<=12;i++){
  const x=-half+i*half/6;b.beam([x,eave+rise+.04,z0],[x,eave+rise+.32,z0],.021,c.brass,41,4);
  b.sphere(x,eave+rise+.34,z0,.038,.05,.038,c.brass,41,7,4);
  if(i<12){b.beam([x,eave+rise+.21,z0],[x+half/12,eave+rise+.10,z0],.014,c.iron,41,4);b.beam([x+half/12,eave+rise+.10,z0],[x+half/6,eave+rise+.21,z0],.014,c.iron,41,4);}
 }
 // Tall glazed lights and arched fanlights form a complete conservatory facade.
 for(let k=0;k<8;k++){
  const x=-half+(k+.5)*half/4,w=half/4-.16;
  for(const sign of[-1,1]){if(sign>0&&(k===3||k===4))continue;
   const z=z0+sign*radius;b.quad([x-w/2,1.0,z],[x+w/2,1.0,z],[x+w/2,3.74,z],[x-w/2,3.74,z],c.glass,76);
  }
  for(const z of[z0-radius-.005,z0+radius+.015]){
   b.box(x,2.30,z,w,.033,.042,c.edge,41);
   wintergardenArc(b,x,3.12,z,w/2,.58,.025,c.edge);
   if(!(z>z0&&(k===3||k===4)))b.box(x,2.38,z,.028,2.74,.032,c.edge,41);
  }
 }
 // End facades with radiating fanlight bars, open double doors and railings.
 for(const side of[-1,1]){
  b.push(side*half,0,z0,0,side*Math.PI/2);
  for(const x of[-2.7,-1.8,1.8,2.7])b.box(x,2.36,0,.055,3.06,.070,c.iron,41);
  for(const z of[-.035,.035])wintergardenArc(b,0,eave,z,radius,rise,.045,c.iron);
  for(let j=1;j<12;j++){const a=j*Math.PI/12;b.beam([0,eave,0],[Math.cos(a)*radius,eave+Math.sin(a)*rise,0],.018,c.edge,41,4);}
  for(let j=0;j<12;j++){const a=j*Math.PI/12,q=(j+1)*Math.PI/12;b.tri([0,eave,.006],[Math.cos(a)*radius,eave+Math.sin(a)*rise,.006],[Math.cos(q)*radius,eave+Math.sin(q)*rise,.006],c.glass,76);}
  for(const sign of[-1,1])for(let j=0;j<3;j++){const lo=1.10+j*.85,hi=Math.min(lo+.80,radius-.10);b.quad([sign*lo,1.0,.005],[sign*hi,1.0,.005],[sign*hi,eave-.08,.005],[sign*lo,eave-.08,.005],c.glass,76);}
  b.box(0,3.35,.04,2.6,.31,.09,c.iron,41);wintergardenLettering(b,'GARDEN',0,3.27,.098,.18,c.pale);
  for(const x of[-1.03,1.03]){b.box(x,1.66,.02,.09,2.6,.10,c.iron,41);b.push(x,.38,.03,0,x<0?-.6:.6);b.box(x<0?.44:-.44,1.13,0,.88,2.26,.06,c.edge,41);b.box(x<0?.44:-.44,1.43,.037,.68,1.19,.023,'#adbdab',76);b.pop();}
  b.pop();
 }
 // A front entrance opens onto the platform canopy, preserving a clear route.
 b.box(0,3.17,3.78,8.30,.49,.15,c.iron,41);
 b.box(0,3.40,3.81,8.45,.045,.21,c.brass,41);
 wintergardenLettering(b,'WINTERGARDEN',0,3.01,3.875,.29,'#ebdcb5');
}
function wintergardenRoofLantern(b){
 const c=WINTERGARDEN_COLORS,z0=-.15;
 // An octagonal glazed lantern brings high light directly onto the fountain.
 // Its square curb follows the existing vault and covers the four open panes.
 for(const sign of[-1,1]){
  b.box(sign*1.43,6.35,z0,.12,.35,2.97,c.iron,41);
  b.box(0,6.35,z0+sign*1.43,2.97,.35,.12,c.iron,41);
  b.beam([sign*1.43,6.13,z0-1.43],[sign*1.43,6.62,z0],.035,c.brass,41,4);
  b.beam([sign*1.43,6.62,z0],[sign*1.43,6.13,z0+1.43],.035,c.brass,41,4);
 }
 const n=12,profile=[[6.54,1.55],[7.10,1.55],[7.32,1.43],[7.61,1.17],[7.89,.78],[8.05,.30],[8.08,.08]],point=(a,r,y)=>[Math.cos(a)*r,y,z0+Math.sin(a)*r];
 for(let j=0;j<n;j++){
  const a=(j+.5)*Math.PI*2/n,q=(j+1.5)*Math.PI*2/n;
  for(let i=0;i<profile.length-1;i++){
   const [y,r]=profile[i],[yy,rr]=profile[i+1],p0=point(a,r,y),p1=point(q,r,y),p2=point(q,rr,yy),p3=point(a,rr,yy);
   b.quad(p0,p1,p2,p3,'#b3cbbd',76);b.beam(p0,p3,.027,c.iron,41,5);
   if(i===0||i===1)b.beam(p0,p1,.030,c.brass,41,5);
  }
 }
 b.cylinder(0,8.11,z0,.19,.11,.10,c.iron,41,12);
 b.sphere(0,8.22,z0,.085,.11,.085,c.brass,41,10,5);
 b.beam([0,8.26,z0],[0,8.66,z0],.020,c.brass,41,5);
 b.sphere(0,8.69,z0,.035,.048,.035,c.brass,41,8,4);
}
function wintergardenCanopy(b){
 const c=WINTERGARDEN_COLORS,z=5.66;
 for(const x of[-5.15,-1.80,1.80,5.15]){
  b.box(x,1.62,z,.105,2.58,.105,c.iron,41);b.box(x,.47,z,.28,.26,.28,c.edge,41);
  for(const s of[-1,1]){b.beam([x,2.37,z],[x+s*.58,2.97,z],.035,c.iron,41,5);wintergardenArc(b,x+s*.33,2.52,z,.28,.31,.018,c.brass,0,Math.PI);}
  b.beam([x,2.99,3.65],[x,2.85,5.93],.045,c.iron,41,5);
 }
 b.box(0,2.91,z,10.55,.12,.13,c.iron,41);b.box(0,2.94,5.99,10.77,.045,.08,c.brass,41);
 for(let k=0;k<16;k++){
  const x=-5.36+k*.67;b.beam([x,3.035,3.66],[x,2.885,5.96],.025,c.edge,41,4);
  b.quad([x,3.02,3.69],[x+.61,3.02,3.69],[x+.61,2.87,5.92],[x,2.87,5.92],'#b3c8be',76);
  b.box(x+.31,2.83,5.96,.51,.05,.045,c.pale,23);
  for(const dx of[.12,.31,.50])b.box(x+dx,2.76,5.96,.06,.10,.045,c.pale,23);
 }
 wintergardenLantern(b,-1.80,2.08,5.62,.80);wintergardenLantern(b,1.80,2.08,5.62,.80);
 // Polished baggage, a little trolley and a neatly folded newspaper.
 b.push(3.75,.37,4.88,0,.15);
 for(const x of[-.45,.45])b.cylinder(x,.16,0,.13,.13,.055,c.iron,41,12,0,Math.PI/2);
 b.box(0,.27,0,1.08,.065,.61,'#ac9068',22);
 for(const x of[-.5,.5])b.beam([x,.30,-.26],[x,.95,-.36],.027,c.iron,41,5);
 b.beam([-.5,.95,-.36],[.5,.95,-.36],.034,c.iron,41,5);
 b.box(-.1,.48,.02,.76,.38,.44,'#956a4d',22);b.box(-.02,.77,.04,.61,.20,.38,'#c1a57c',22);
 for(const x of[-.30,.15]){b.box(x,.48,.25,.05,.36,.017,c.brass,41);b.box(x,.79,.241,.035,.15,.016,c.iron,41);}
 b.box(.31,.425,-.17,.08,.07,.02,'#e2d7b7',23);b.pop();
 b.box(-3.85,.91,4.99,1.65,.075,.46,'#a78c64',22);
 for(const x of[-4.43,-3.26]){b.box(x,.64,4.99,.08,.52,.48,c.iron,41);b.beam([x,.83,4.75],[x,1.43,4.72],.028,c.iron,41,5);}
 for(let j=0;j<3;j++)b.box(-3.85,1.13+j*.12,4.72,1.65,.083,.045,'#bba37a',22);
 b.box(-3.51,.96,4.99,.48,.016,.33,'#e1d7bd',23);for(let i=0;i<4;i++)b.box(-3.51,.970,4.90+i*.045,.37,.006,.009,'#949480',23);
}
function wintergardenStation(b,x,y,z,angle=0){
 const c=WINTERGARDEN_COLORS;b.push(x,y,z,0,angle);
 // One substantial terrace grounds the station in a room or on an exhibit.
 b.box(-1.15,-.14,.65,16,.82,11.7,c.stone,4);
 b.box(-1.15,.302,.65,16.10,.064,11.80,c.pale,4);
 // Slightly varied limestone flags and a dark border articulate the forecourt.
 for(let i=0;i<24;i++)for(let j=0;j<3;j++){
  const xx=-8.87+i*.645,zz=4.10+j*.70;
  b.quad([xx,.337,zz],[xx,.337,zz+.667],[xx+.615,.337,zz+.667],[xx+.615,.337,zz],(i+j)%4===0?'#c6c3a6':(i+j)%3===0?'#dcd0ae':'#d5cbb0',23);
 }
 for(const zz of[3.99,6.25])b.box(-1.10,.343,zz,15.55,.016,.042,'#869589',23);
 for(let i=0;i<29;i++)b.box(-8.90+i*.55,.347,6.31,.52,.045,.37,i%3?'#d3c7a6':'#bdbaa0',4);
 for(const side of[-1,1])for(let i=0;i<16;i++)b.box(side<0?-9.17:6.87,.35,-4.63+i*.69,.20,.04,.65,'#e0d2b1',4);
 // Three broad, shallow entrance treads align with the Commons garden path.
 for(let i=0;i<3;i++)b.box(0,.14-i*.18,6.62+i*.18,2.8+i*.20,.18,.40,c.pale,4);
 wintergardenTower(b);wintergardenTicketHall(b);wintergardenConservatory(b);wintergardenRoofLantern(b);
 wintergardenInterior(b);
 wintergardenCanopy(b);wintergardenTerraceDetails(b);
 b.beam([0,6.62,0],[0,5.22,0],.019,c.iron,41,5);
 wintergardenLantern(b,0,4.55,0,.80);
 b.pop();return 0;
}

// Wintergarden Station — botanical interior, by nickfromlater.
// Native, deterministic geometry shared by the Grand Hall and railway rooms.
// Both renderers draw both sides and flip their normals, so no duplicate faces.
function wintergardenLeaf(b,a,q,width,color){
 const dx=q[0]-a[0],dz=q[2]-a[2],length=Math.hypot(dx,dz)||1;
 const x=a[0]+dx*.44,y=a[1]+(q[1]-a[1])*.44-width*.20,z=a[2]+dz*.44;
 const l=[x+dz/length*width,y,z-dx/length*width],r=[x-dz/length*width,y,z+dx/length*width];
 b.tri(a,l,q,color,8);b.tri(a,q,r,color,8);
}

function wintergardenFrond(b,height,angle,length,spread,fern=false){
 const c=Math.cos(angle),s=Math.sin(angle),point=t=>[c*length*t,height+Math.sin(t*Math.PI)*.49-length*t*t*.32,s*length*t*spread];
 const green=fern?'#427457':'#52875e',rib=fern?'#729560':'#9aaa6b';
 for(let i=0;i<4;i++)b.beam(point(i/4),point((i+1)/4),fern?.011:.016,rib,8,3);
 const pairs=fern?6:7;
 for(let j=0;j<pairs;j++){
  const t=.12+j*(.77/(pairs-1)),p=point(t),fan=Math.sin(t*Math.PI)*length*(fern?.34:.35);
  for(const side of[-1,1]){
   const q=[p[0]+c*length*.17-s*side*fan,p[1]-.10-.08*t,p[2]+s*length*.17*spread+c*side*fan*spread];
   wintergardenLeaf(b,p,q,(fern?.073:.10)*(1-t*.37),shade(green,1+(j%3-1)*.12));
  }
 }
 wintergardenLeaf(b,point(.84),point(1.065),fern?.064:.074,green);
}

function wintergardenPalm(b,x,z,height,angle=0){
 b.push(x,.64,z,0,angle);
 // A gently leaning ringed trunk; the crown is airy instead of spherical.
 for(let j=0;j<7;j++){
  const t=j/7,u=(j+1)/7,a=[.13*t*t,height*t,0],q=[.13*u*u,height*u,0];
  b.beam(a,q,.115-.045*t,j%2?'#978066':'#a18a69',22,6);
 }
 b.cylinder(.13,height-.10,0,.11,.075,.34,'#727955',23,7);
 b.push(.13,0,0);
 for(let j=0;j<10;j++)wintergardenFrond(b,height,j*Math.PI/5+.16,1.22+(j%3)*.045,.46);
 for(let j=0;j<5;j++)wintergardenFrond(b,height+.11,j*Math.PI*2/5+.42,.90+(j%2)*.08,.53);
 for(let j=0;j<3;j++){
  const a=j*2.1,p=[.08*Math.cos(a),height+.44,.08*Math.sin(a)];
  b.beam([0,height-.10,0],p,.018,'#94a36b',8,4);
  wintergardenLeaf(b,[0,height+.12,0],[p[0]*2,height+.72,p[2]*2],.11,'#9bac71');
 }
 b.pop();b.pop();
}

function wintergardenFern(b,x,z,height,angle=0){
 b.push(x,.64,z,0,angle);
 b.cylinder(0,height/2,0,.15,.11,height,'#796f50',22,7);
 for(let j=0;j<6;j++)wintergardenFrond(b,height,j*Math.PI/3,.87+(j%2)*.10,.70,true);
 for(let j=0;j<3;j++)b.beam([0,height-.05,0],[Math.sin(j*2.4)*.075,height+.26,Math.cos(j*2.4)*.075],.022,'#89955b',8,4);
 b.pop();
}

function wintergardenCitrus(b,x,z,angle=0){
 b.push(x,.40,z,0,angle);
 // Terracotta rim, dark soil and an open branched standard with individual fruit.
 b.cylinder(0,.22,0,.22,.32,.44,'#ad694e',23,10);
 b.cylinder(0,.43,0,.34,.34,.09,'#d29168',23,10);
 b.cylinder(0,.48,0,.284,.284,.015,'#4c5140',23,10);
 b.beam([0,.45,0],[.04,1.38,0],.043,'#8b7959',22,6);
 for(let j=0;j<8;j++){
  const a=j*2.399,c=Math.cos(a),s=Math.sin(a),h=1.25+(j%3)*.20;
  const p=[c*.36,h,s*.30];b.beam([.025,1.09,0],p,.017,'#8d855c',22,4);
  for(let k=0;k<5;k++){
   const angle=a+(k-2)*.82,q=[p[0]+Math.cos(angle)*.27,p[1]+.18-(k%2)*.17,p[2]+Math.sin(angle)*.21];
   wintergardenLeaf(b,p,q,.135,['#3d7148','#638b4d','#316443'][(j+k)%3]);
  }
  if(j%2===0)b.sphere(p[0],p[1]-.13,p[2],.095,.105,.095,j%4?'#e8aa36':'#ecbd55',23,7,4);
 }
 b.pop();
}

function wintergardenBroadleaf(b,x,z,scale=1,angle=0){
 b.push(x,.64,z,0,angle,0,scale,scale,scale*.73);
 // Large arching blades have a folded midrib and cut margins, like young
 // philodendron and bird-of-paradise plants, rather than faceted shrub balls.
 for(let j=0;j<7;j++){
  const a=j*2.399,c=Math.cos(a),s=Math.sin(a),h=.46+(j%3)*.18;
  const length=.72+(j%3)*.11,width=.23+(j%2)*.07;
  const point=t=>[c*(.10+length*t),h+.39*Math.sin(t*Math.PI)-.16*t,s*(.10+length*t)];
  const stem=point(0);b.beam([0,.025,0],stem,.020,'#789260',8,4);
  const color=['#28644b','#427e58','#579469','#337054'][j%4];
  for(let k=0;k<6;k++){
   const t=k/6,u=(k+1)/6,p=point(t),q=point(u);
   const w=t=>Math.pow(Math.sin(t*Math.PI),.7)*width;
   const edge=(p,t,side)=>[p[0]-s*w(t)*side,p[1]-.055-Math.sin(t*Math.PI)*.045,p[2]+c*w(t)*side];
   for(const side of[-1,1]){
    const l=edge(p,t,side),r=edge(q,u,side);
    // Four deliberate open notches along the margin of the larger blades.
    if(k>0&&k<5&&j%2===0){
     const v=t+(u-t)*.42,m=point(v),notch=edge(m,v,side);
     notch[0]=m[0]+(notch[0]-m[0])*.40;notch[2]=m[2]+(notch[2]-m[2])*.40;
     b.tri(p,l,notch,color,8);b.tri(p,notch,q,color,8);b.tri(q,notch,r,color,8);
    }else b.quad(p,l,r,q,side>0?color:shade(color,1.1),8);
   }
   const edgeR=v=>[v[0]-s*.008,v[1]+.004,v[2]+c*.008];
   b.quad(p,q,edgeR(q),edgeR(p),'#96ac70',8);
  }
 }
 b.pop();
}

function wintergardenTallBanana(b,x,z,angle=0){
 b.push(x,.64,z,0,angle);
 // Seven substantial, folded banana blades fill the middle storey. Their
 // living stalks bend into the glasshouse; the broad fountain sightline stays open.
 for(let j=0;j<7;j++){
  const a=j*2.399+.30,c=Math.cos(a),s=Math.sin(a),h=2.04+(j%3)*.30;
  const length=1.04+(j%3)*.10,width=.31+(j%2)*.075;
  const start=[.10+c*.11,h,-.20+s*.08],elbow=[.035,h*.51,-.075];
  b.beam([0,.025,0],elbow,.046,'#608053',8,5);
  b.beam(elbow,start,.031,'#75935d',8,5);
  const point=t=>[start[0]+c*length*.84*t,start[1]+.87*Math.sin(t*Math.PI*.88)-.28*t*t,start[2]+s*length*.60*t];
  const color=['#1f6249','#296f4f','#20573f','#357658'][j%4];
  for(let k=0;k<6;k++){
   const t=k/6,u=(k+1)/6,p=point(t),q=point(u);
   const w=v=>Math.pow(Math.max(0,Math.sin(v*Math.PI)),.66)*width;
   const edge=(v,t,side)=>[v[0]-s*w(t)*side,v[1]-.025-.12*Math.sin(t*Math.PI),v[2]+c*w(t)*side*.68];
   for(const side of[-1,1])b.quad(p,edge(p,t,side),edge(q,u,side),q,side<0?shade(color,1.10):color,8);
   const ridge=v=>[v[0]-s*.009,v[1]+.005,v[2]+c*.009];
   b.quad(p,q,ridge(q),ridge(p),'#7c9d68',8);
  }
 }
 b.pop();
}

function wintergardenUnderstory(b,x,z,angle=0){
 b.push(x,.64,z,0,angle);
 // A low hosta rosette groups broad sage leaves over the soil between trunks.
 for(let j=0;j<8;j++){
  const a=j*2.399,h=.18+(j%3)*.08,c=Math.cos(a),s=Math.sin(a);
  wintergardenLeaf(b,[0,.03,0],[c*.43,h,s*.31],.17,['#74976a','#567f59','#91ad78'][j%3]);
  wintergardenLeaf(b,[c*.13,.11,s*.09],[c*.34,h+.22,s*.23],.13,['#5d885f','#88a772'][j%2]);
 }
 b.pop();
}

function wintergardenHangingBasket(b,x,z,angle=0){
 b.push(x,3.58,z,0,angle);
 // The upper ring hangs from a real roof tie attachment at Y3.94.
 b.cylinder(0,-.06,0,.22,.34,.21,'#855d43',22,10);
 b.cylinder(0,.056,0,.35,.35,.045,'#3f6954',41,10);
 b.cylinder(0,.08,0,.30,.30,.012,'#48583d',23,10);
 for(let j=0;j<3;j++){
  const a=j*Math.PI*2/3;
  b.beam([Math.cos(a)*.31,.075,Math.sin(a)*.31],[0,.36,0],.013,'#a2a676',41,4);
 }
 for(let j=0;j<7;j++){
  const a=j*2.399,c=Math.cos(a),s=Math.sin(a),drop=.40+(j%3)*.17;
  for(let k=0;k<3;k++){
   const p=[c*(.16+k*.058),.11-drop*k/3,s*(.16+k*.058)],q=[c*(.16+(k+1)*.058),.11-drop*(k+1)/3,s*(.16+(k+1)*.058)];
   b.beam(p,q,.011,'#6d905f',8,3);
   for(const side of[-1,1])wintergardenLeaf(b,p,[p[0]+c*.11-s*side*.13,p[1]-.13,p[2]+s*.11+c*side*.13],.088,['#6c9865','#417d59','#89a871'][(j+k)%3]);
  }
  wintergardenLeaf(b,[0,.07,0],[c*.42,.18+(j%2)*.15,s*.32],.15,'#679562');
 }
 b.pop();
}

function wintergardenBench(b,x,z,angle=0){
 b.push(x,.39,z,0,angle);
 const iron='#3a6256',wood='#bca37b';
 // Four seat slats and three back slats leave the iron frame visible.
 for(let i=0;i<4;i++)b.box(0,.45,-.20+i*.133,1.55,.045,.111,wood,22);
 for(let i=0;i<3;i++)b.box(0,.70+i*.14,-.285,1.55,.083,.042,wood,22);
 for(const xx of[-.59,.59]){
  for(const zz of[-.20,.20])b.beam([xx,.025,zz],[xx,.43,zz*.85],.026,iron,41,5);
  b.beam([xx,.12,-.24],[xx,1.06,-.285],.029,iron,41,5);
  b.beam([xx,.67,-.29],[xx,.67,.24],.027,iron,41,5);
  b.beam([xx,.43,.19],[xx,.67,.19],.025,iron,41,5);
 }
 b.beam([-.62,.22,0],[.62,.22,0],.028,iron,41,5);b.pop();
}

function wintergardenFountain(b){
 const stone='#c4c4a9',rim='#ded8b8';
 b.cylinder(0,.43,0,.72,.72,.09,stone,4,16);
 b.cylinder(0,.53,0,.63,.67,.13,stone,4,16);
 // A real open basin, with a raised octadecagonal stone lip and still water.
 for(let i=0;i<18;i++){
  const a=i*Math.PI/9,q=(i+1)*Math.PI/9,point=(r,y,t)=>[Math.cos(t)*r,y,Math.sin(t)*r];
  b.quad(point(.67,.54,a),point(.67,.70,a),point(.67,.70,q),point(.67,.54,q),stone,4);
  b.quad(point(.57,.60,q),point(.57,.70,q),point(.57,.70,a),point(.57,.60,a),shade(stone,.87),4);
  b.quad(point(.57,.70,a),point(.57,.70,q),point(.67,.70,q),point(.67,.70,a),rim,4);
  b.tri([0,.613,0],point(.57,.613,q),point(.57,.613,a),'#77a297',41);
 }
 b.cylinder(0,.87,0,.12,.085,.50,stone,4,10);
 b.cylinder(0,1.11,0,.095,.29,.14,stone,4,12);
 b.cylinder(0,1.195,0,.31,.31,.045,rim,4,12);
 b.cylinder(0,1.221,0,.263,.263,.008,'#8baea0',41,12);
 b.cylinder(0,1.33,0,.067,.035,.22,'#bdc2a2',4,8);
 b.sphere(0,1.48,0,.055,.079,.055,'#c9c7a7',4,8,5);
 // Fine, static spill threads suggest a quiet trickle without particles.
 for(const a of[.25,2.35,4.45]){
  const c=Math.cos(a),s=Math.sin(a);
  b.beam([c*.25,1.22,s*.25],[c*.31,.96,s*.31],.012,'#a6c9b9',41,4);
  b.beam([c*.31,.96,s*.31],[c*.30,.62,s*.30],.010,'#a6c9b9',41,4);
  // Two delicate flat rings catch the light where each spill meets the basin.
  for(const r of[.055,.094])for(let j=0;j<12;j++){
   const u=j*Math.PI/6,v=(j+1)*Math.PI/6,point=(t,r)=>[c*.30+Math.cos(t)*r,.617,s*.30+Math.sin(t)*r];
   b.quad(point(u,r),point(v,r),point(v,r+.009),point(u,r+.009),'#a5c0ab',41);
  }
 }
}

function wintergardenInterior(b){
 // Long low beds frame the clear axial walk and its central fountain.
 for(const side of[-1,1]){
  const z=side*2.73;
  b.box(0,.49,z,9.55,.22,1.12,'#bebc9e',4);
  b.box(0,.607,z,9.34,.025,.91,'#656d4e',23);
  for(const edge of[-1,1])b.box(0,.635,z+edge*.52,9.58,.07,.105,'#d8ccb0',4);
  for(const x of[-4.74,4.74])b.box(x,.635,z,.10,.07,1.10,'#d8ccb0',4);
 }
 wintergardenPalm(b,-3.00,-2.63,3.74,.05);
 wintergardenPalm(b,3.02,2.63,3.52,-.10);
 wintergardenFern(b,2.68,-2.65,1.17,.15);
 wintergardenFern(b,-2.67,2.65,1.01,-.30);
 wintergardenBroadleaf(b,.08,-2.72,1.03,.16);
 wintergardenBroadleaf(b,-.27,2.72,1.08,-.45);
 wintergardenBroadleaf(b,-3.80,2.73,.83,.4);
 wintergardenBroadleaf(b,3.83,-2.73,.83,-.24);
 for(const [x,z,a]of[[-4.19,-2.78,.3],[-1.68,-2.79,.6],[1.33,-2.76,-.7],[-1.50,2.79,.2],[1.45,2.80,-.6],[4.21,2.80,.8]])wintergardenUnderstory(b,x,z,a);
 wintergardenHangingBasket(b,-2.825,2.30,.25);
 wintergardenHangingBasket(b,2.825,-2.30,-.45);
 wintergardenCitrus(b,-4.32,1.67,.2);
 wintergardenCitrus(b,4.32,-1.67,-.6);
 wintergardenBench(b,-1.54,-1.70,0);
 wintergardenBench(b,1.54,1.70,Math.PI);
 wintergardenTallBanana(b,1.65,-2.72,Math.PI);
 wintergardenTallBanana(b,-1.65,2.72,0);
 wintergardenFountain(b);
 // A pair of low specimen labels is legible as brass furniture, no atlas needed.
 for(const side of[-1,1]){
  b.beam([side*3.66,.64,side*2.16],[side*3.66,.94,side*2.16],.012,'#8e996f',41,4);
  b.push(side*3.66,.96,side*2.16,-.35,side<0?Math.PI:0);
  b.box(0,0,0,.29,.12,.016,'#bcaa71',41);b.box(0,.016,.01,.19,.012,.004,'#5d705b',23);b.pop();
 }
}

// Wintergarden Station — small garden/station details for the outer terrace.
// Native coordinates, no atlas allocations, stable authored arrangements.
function wintergardenTerraceStroke(b,a,q,width,color,mat=41,twoSides=true){
 const dx=q[0]-a[0],dy=q[1]-a[1],length=Math.hypot(dx,dy)||1,ox=-dy/length*width/2,oy=dx/length*width/2;
 const p=[[a[0]+ox,a[1]+oy,a[2]],[q[0]+ox,q[1]+oy,q[2]],[q[0]-ox,q[1]-oy,q[2]],[a[0]-ox,a[1]-oy,a[2]]];
 b.quad(...p.slice().reverse(),color,mat);if(twoSides)b.quad(...p,color,mat);
}
function wintergardenTerraceScroll(b,x,y,z,side=1,scale=1){
 // Tapered inward scroll, drawn as a thin forged ribbon with real open space.
 for(let i=0;i<10;i++){
  const point=t=>{const angle=t*Math.PI*1.70,r=.19*(1-t*.76)*scale;return[x+side*(Math.cos(angle)*r-.19*scale),y+Math.sin(angle)*r,z];};
  wintergardenTerraceStroke(b,point(i/10),point((i+1)/10),.022,'#719486');
 }
}
function wintergardenTerraceRail(b,x,z,angle=0){
 const iron='#355c51',brass='#b99e67';b.push(x,.34,z,0,angle);
 for(const xx of[-1.02,0,1.02]){
  b.box(xx,.41,0,.055,.82,.055,iron,41);b.box(xx,.045,0,.12,.09,.12,iron,41);
  b.box(xx,.835,0,.095,.045,.095,brass,41);
 }
 for(const yy of[.17,.72])b.box(0,yy,0,2.06,.035,.045,iron,41);
 for(const xx of[0]){
  wintergardenTerraceStroke(b,[xx,.19,.006],[xx,.71,.006],.023,iron);
  for(const side of[-1,1])wintergardenTerraceScroll(b,xx,.44,.013,side,1.45);
  for(const side of[-1,1]){
   wintergardenTerraceStroke(b,[xx,.19,.014],[xx+side*.15,.33,.014],.019,brass);
   wintergardenTerraceStroke(b,[xx+side*.15,.33,.014],[xx,.47,.014],.019,brass);
  }
 }
 b.pop();
}
function wintergardenTerraceLeaf(b,a,q,width,color){
 const dx=q[0]-a[0],dz=q[2]-a[2],length=Math.hypot(dx,dz)||1,m=[a[0]+dx*.5,a[1]+(q[1]-a[1])*.55+.025,a[2]+dz*.5];
 const l=[m[0]+dz/length*width,m[1],m[2]-dx/length*width],r=[m[0]-dz/length*width,m[1],m[2]+dx/length*width];
 b.tri(a,l,q,color,8);b.tri(a,q,r,color,8);b.tri(q,l,a,shade(color,.88),8);b.tri(r,q,a,shade(color,.88),8);
}
function wintergardenTerraceFlower(b,x,y,z,color){
 // Five cupped petals around a small ochre heart, facing the sun above.
 for(let j=0;j<5;j++){
  const a=j*Math.PI*.4,q=a+Math.PI*.28,p=[x,y-.018,z],l=[x+Math.cos(a)*.085,y+.031,z+Math.sin(a)*.085],r=[x+Math.cos(q)*.085,y+.027,z+Math.sin(q)*.085];
  b.tri(p,r,l,color,23);b.tri(l,r,p,shade(color,.91),23);
 }
 b.quad([x-.022,y+.019,z-.022],[x-.022,y+.019,z+.022],[x+.022,y+.019,z+.022],[x+.022,y+.019,z-.022],'#d9b975',23);
}
function wintergardenTerraceUrn(b,x,z,angle=0){
 b.push(x,.34,z,0,angle);
 b.box(0,.045,0,.41,.09,.41,'#b49878',4);
 b.cylinder(0,.16,0,.16,.12,.14,'#a86f52',23,8);
 b.cylinder(0,.38,0,.16,.32,.30,'#b98360',23,8);
 b.cylinder(0,.595,0,.32,.285,.13,'#c28b68',23,8);
 b.cylinder(0,.665,0,.34,.34,.065,'#d3a17d',23,8);
 b.cylinder(0,.704,0,.287,.287,.012,'#525744',23,8);
 // A low rosemary crown, trailing sage and three flowering geranium stems.
 for(let j=0;j<7;j++){
  const a=j*2.399,c=Math.cos(a),s=Math.sin(a),tip=[c*.43,.83+(j%3)*.10,s*.39];
  if(j%2===0)b.beam([0,.70,0],tip,.009,'#849067',8,3);
  wintergardenTerraceLeaf(b,[c*.12,.76,s*.12],[c*.54,.77+(j%2)*.14,s*.49],.085,j%2?'#71895f':'#8ca17b');
  wintergardenTerraceLeaf(b,[c*.08,.77,s*.08],[c*.29,.98+(j%3)*.06,s*.25],.069,'#597e59');
 }
 for(const [xx,zz,h,color]of[[-.14,-.10,1.26,'#d9a17e'],[.17,.06,1.16,'#e4b5a0'],[-.03,.19,1.37,'#b77b68']]){
  b.beam([xx*.2,.72,zz*.2],[xx,h,zz],.012,'#71865c',8,4);
  wintergardenTerraceLeaf(b,[xx*.7,.96,zz*.7],[xx+.17,1.03,zz-.11],.073,'#76936a');
  wintergardenTerraceFlower(b,xx,h,zz,color);
 }
 b.pop();
}
function wintergardenTimetableText(b,text,x,y,z,size,color){
 // Each mark is a letter/digit stroke. No pseudo-random blocks or atlas glyphs.
 const glyphs={
  '0':[[0,0,0,1],[0,1,1,1],[1,1,1,0],[1,0,0,0]],'1':[[.25,.75,.55,1],[.55,1,.55,0]],
  '2':[[0,1,1,1],[1,1,1,.55],[1,.55,0,.55],[0,.55,0,0],[0,0,1,0]],
  '4':[[0,1,0,.45],[0,.45,1,.45],[.8,1,.8,0]],'5':[[1,1,0,1],[0,1,0,.55],[0,.55,1,.55],[1,.55,1,0],[1,0,0,0]],
  'A':[[0,0,.5,1],[.5,1,1,0],[.22,.43,.78,.43]],'D':[[0,0,0,1],[0,1,.65,1],[.65,1,1,.7],[1,.7,1,.3],[1,.3,.65,0],[.65,0,0,0]],
  'E':[[1,1,0,1],[0,1,0,0],[0,0,1,0],[0,.52,.75,.52]],'G':[[1,.85,.8,1],[.8,1,0,1],[0,1,0,0],[0,0,1,0],[1,0,1,.45],[1,.45,.55,.45]],
  'N':[[0,0,0,1],[0,1,1,0],[1,0,1,1]],'R':[[0,0,0,1],[0,1,1,1],[1,1,1,.55],[1,.55,0,.55],[.5,.55,1,0]],
  'S':[[1,1,0,1],[0,1,0,.55],[0,.55,1,.55],[1,.55,1,0],[1,0,0,0]],'T':[[0,1,1,1],[.5,1,.5,0]],
  'V':[[0,1,.5,0],[.5,0,1,1]],'I':[[.5,0,.5,1]],'L':[[0,1,0,0],[0,0,1,0]],'Y':[[0,1,.5,.55],[1,1,.5,.55],[.5,.55,.5,0]]
 };
 for(let i=0;i<text.length;i++)for(const p of glyphs[text[i]]||[])wintergardenTerraceStroke(b,[x+i*size*.83+p[0]*size*.52,y+p[1]*size,z],[x+i*size*.83+p[2]*size*.52,y+p[3]*size,z],size*.08,color,23,false);
}
function wintergardenDepartureBoard(b){
 const iron='#355b50',brass='#b99f6b';b.push(6.20,.34,2.65,0,-.11);
 for(const x of[-.51,.51]){
  b.box(x,1.05,0,.058,2.10,.075,iron,41);b.box(x,.06,0,.17,.12,.22,'#b4ad90',4);
 }
 b.box(0,1.64,0,1.17,1.24,.13,iron,41);b.box(0,1.64,.078,1.03,1.10,.025,'#29483e',23);
 for(const y of[1.05,2.23])b.box(0,y,.074,1.22,.035,.09,brass,41);
 for(const x of[-.57,.57])b.box(x,1.64,.074,.036,1.2,.09,brass,41);
 wintergardenTimetableText(b,'TRAINS',-.285,2.045,.102,.118,'#decfad');
 for(const [row,time,to]of[[0,'10 24','GARDEN'],[1,'11 10','VALLEY'],[2,'12 45','GARDEN']]){
  const y=1.83-row*.255;wintergardenTimetableText(b,time,-.42,y,.102,.080,'#decfad');
  wintergardenTimetableText(b,to,-.42,y-.115,.102,.063,'#b3bea1');
  b.box(0,y-.164,.102,.86,.010,.007,'#6d8370',23);
 }
 // A pressed copper rain cap and small, symmetric scroll shoulders.
 b.push(0,2.27,0,-.11);b.box(0,0,0,1.32,.058,.36,'#66897a',41);b.pop();
 for(const side of[-1,1])wintergardenTerraceScroll(b,side*.36,2.43,.025,-side);
 b.pop();
}
function wintergardenTerraceDetails(b){
 wintergardenTerraceRail(b,-8.79,5.13,Math.PI/2);
 wintergardenTerraceRail(b,6.42,5.13,Math.PI/2);
 wintergardenTerraceUrn(b,-2.53,6.00,.35);
 wintergardenTerraceUrn(b,2.53,6.00,-.45);
 wintergardenDepartureBoard(b);
 // Fine suspension rods physically connect the lamps to the canopy purlin.
 for(const x of[-3.35,3.35]){
  b.beam([x,2.942,5.15],[x,2.681,5.15],.017,'#bfa36c',41,4);
  wintergardenLantern(b,x,2.10,5.15,.70);
 }
}
