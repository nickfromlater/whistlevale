'use strict';

// The Big Red Reset, an original miniature by nickfromlater with Codex assistance.
// Static native geometry with a tagged, shader-depressed button. The Hall owns projection and the interaction lifecycle.
function codexResetEngine(b,x,y,z,angle=0){
 b.push(x,y,z,0,angle);
 const ink='#29272a',dark='#151518',brass='#c6a46a',gold='#e0c38c',red='#e52b28',ivory='#eee4ce';
 const ring=(cy,r,thick,color,cz=0)=>{for(let i=0;i<48;i++){const a=i*Math.PI/24,c=(i+1)*Math.PI/24;b.beam([Math.cos(a)*r,cy,cz+Math.sin(a)*r],[Math.cos(c)*r,cy,cz+Math.sin(c)*r],thick,color,41,4);}};
 // A machined, concentric pedestal, with an inset enamel field and brass studs.
 b.cylinder(0,.15,0,3.9,3.9,.3,dark,23,48);
 b.cylinder(0,.36,0,3.88,3.72,.12,brass,41,48);
 b.cylinder(0,.52,0,3.65,3.65,.22,ink,0,48);
 ring(.645,3.49,.045,gold);
 for(let i=0;i<24;i++){const a=i*Math.PI/12;b.sphere(Math.cos(a)*3.46,.69,Math.sin(a)*3.46,.065,.045,.065,gold,41,6,4);}
 // Main pedestal and oversized lacquered push button, tilted toward the visitor.
 b.cylinder(0,1.01,.65,1.87,1.65,.74,dark,23,48);
 for(let i=0;i<24;i++){const a=i*Math.PI/12;b.beam([Math.cos(a)*1.8,.7,.65+Math.sin(a)*1.8],[Math.cos(a)*1.63,1.32,.65+Math.sin(a)*1.63],.055,brass,41,5);}
 b.push(0,1.47,.65,.18);
 b.cylinder(0,0,0,1.73,1.73,.2,brass,41,48);
 b.cylinder(0,.14,0,1.51,1.51,.17,dark,23,48);
 // UV -91 marks only the movable cap and its inlaid lettering. The Hall
 // applies a small shader translation; all geometry stays in its owned mesh.
 const capStart=b.data.length;
 b.cylinder(0,.31,0,1.48,1.48,.31,'#b61b20',41,48);
 b.sphere(0,.45,0,1.48,.20,1.48,red,41,40,6);
 // White RESET lettering follows the convex cap. No font or texture download.
 const letters={R:[[[0,1],[0,0],[.65,0],[.8,.16],[.65,.48],[0,.48]],[[.4,.48],[.8,1]]],E:[[[.8,0],[0,0],[0,1],[.8,1]],[[0,.48],[.65,.48]]],S:[[[.8,.08],[.65,0],[.14,0],[0,.16],[.12,.46],[.67,.54],[.8,.82],[.66,1],[0,1]]],T:[[[0,0],[.8,0]],[[.4,0],[.4,1]]]};
 for(const [j,ch]of [...'RESET'].entries())for(const path of letters[ch])for(let i=1;i<path.length;i++){
  const point=([xx,zz])=>{const px=-1.05+j*.43+xx*.36,pz=(zz-.5)*.47;return[px,.454+.20*Math.sqrt(Math.max(0,1-(px*px+pz*pz)/(1.48*1.48))),pz];};
  b.beam(point(path[i-1]),point(path[i]),.023,'#fff4e7',0,5);
 }
 for(let i=capStart;i<b.data.length;i+=12){b.data[i+10]=-91;b.data[i+11]=0;}
 b.pop();
 // Rear dial: a freestanding astronomical reset meter with visible supports.
 for(const xx of[-1.4,1.4]){b.box(xx,1.55,-1.8,.24,1.85,.28,brass,41);b.box(xx,.76,-1.8,.6,.21,.6,brass,41);}
 b.push(0,3.35,-1.8,-Math.PI/2);
 b.cylinder(0,0,0,1.86,1.86,.18,brass,41,48);
 b.cylinder(0,-.115,0,1.7,1.7,.07,dark,23,48);
 b.cylinder(0,-.16,0,1.58,1.58,.035,ink,0,48);
 for(let i=0;i<48;i++){const a=i*Math.PI/24,r=i%4?1.4:1.29;b.beam([Math.cos(a)*r,-.19,Math.sin(a)*r],[Math.cos(a)*1.51,-.19,Math.sin(a)*1.51],i%4?.015:.029,gold,41,4);}
 // Twelve inset red charge windows and a substantial central needle.
 for(let i=0;i<12;i++){const a=.42+i*.45;b.push(Math.cos(a)*1.03,-.2,Math.sin(a)*1.03,0,-a);b.box(0,0,0,.14,.025,.27,i<2?red:'#52675a',i<2?10:0);b.pop();}
 b.beam([0,-.23,0],[-.83,-.23,.63],.045,ivory,0,6);b.sphere(0,-.25,0,.16,.065,.16,gold,41,12,6);b.pop();
 // Twin ceramic inductors, copper windings, connecting pipes, and pilot lamps.
 for(const side of[-1,1]){
  const xx=side*2.55;
  b.cylinder(xx,.81,-.25,.45,.45,.34,brass,41,20);
  b.cylinder(xx,1.67,-.25,.29,.29,1.5,ivory,0,16);
  for(let i=0;i<10;i++){
   const yy=1.03+i*.135;b.cylinder(xx,yy,-.25,.41,.41,.055,i%2?brass:gold,41,16);
  }
  b.sphere(xx,2.54,-.25,.33,.36,.33,red,10,16,8);
  b.beam([xx,.82,-.25],[xx,.82,-1.22],.1,brass,41,8);
  b.beam([xx,.82,-1.22],[side*1.4,.82,-1.8],.1,brass,41,8);
 }
 // Front instrument plaque and five jewel indicators.
 b.box(0,.82,2.66,1.9,.28,.19,brass,41);b.box(0,.83,2.765,1.7,.17,.025,dark,23);
 for(let i=0;i<5;i++)b.sphere((i-2)*.26,.84,2.795,.045,.045,.025,red,10,8,4);
 b.pop();return 0;
}
