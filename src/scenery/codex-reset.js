'use strict';

// The Reset Engine, an original miniature by nickfromlater with Codex assistance.
// Static native geometry. The Hall owns projection and the interaction lifecycle.
function codexResetEngine(b,x,y,z,angle=0){
 b.push(x,y,z,0,angle);
 const ink='#234a42',dark='#182f2d',brass='#c6a46a',gold='#e0c38c',mint='#a4efd0',ivory='#eee4ce';
 const ring=(cy,r,thick,color,cz=0)=>{for(let i=0;i<64;i++){const a=i*Math.PI/32,c=(i+1)*Math.PI/32;b.beam([Math.cos(a)*r,cy,cz+Math.sin(a)*r],[Math.cos(c)*r,cy,cz+Math.sin(c)*r],thick,color,41,6);}};
 // A machined, concentric pedestal, with an inset enamel field and brass studs.
 b.cylinder(0,.15,0,3.9,3.9,.3,dark,23,64);
 b.cylinder(0,.36,0,3.88,3.72,.12,brass,41,64);
 b.cylinder(0,.52,0,3.65,3.65,.22,ink,0,64);
 ring(.645,3.49,.045,gold);
 for(let i=0;i<32;i++){const a=i*Math.PI/16;b.sphere(Math.cos(a)*3.46,.69,Math.sin(a)*3.46,.065,.045,.065,gold,41,6,4);}
 // Main pedestal and oversized porcelain push button, tilted toward the visitor.
 b.cylinder(0,1.01,.65,1.87,1.65,.74,dark,23,48);
 for(let i=0;i<24;i++){const a=i*Math.PI/12;b.beam([Math.cos(a)*1.8,.7,.65+Math.sin(a)*1.8],[Math.cos(a)*1.63,1.32,.65+Math.sin(a)*1.63],.055,brass,41,5);}
 b.push(0,1.47,.65,.18);
 b.cylinder(0,0,0,1.73,1.73,.2,brass,41,64);
 b.cylinder(0,.14,0,1.51,1.51,.17,dark,23,64);
 b.cylinder(0,.28,0,1.4,1.37,.27,mint,0,64);
 b.sphere(0,.4,0,1.37,.18,1.37,mint,0,48,8);
 // An inlaid return arrow, constructed from geometry rather than atlas lettering.
 for(let i=0;i<33;i++){const a=.1+i*.145,c=a+.145;b.beam([Math.cos(a)*.67,.582,Math.sin(a)*.67],[Math.cos(c)*.67,.582,Math.sin(c)*.67],.062,ink,0,6);}
 b.tri([.07,.59,-.95],[.41,.59,-.52],[-.2,.59,-.5],ink,0);b.pop();
 // Rear dial: a freestanding astronomical reset meter with visible supports.
 for(const xx of[-1.4,1.4]){b.box(xx,1.55,-1.8,.24,1.85,.28,brass,41);b.box(xx,.76,-1.8,.6,.21,.6,brass,41);}
 b.push(0,3.35,-1.8,-Math.PI/2);
 b.cylinder(0,0,0,1.86,1.86,.18,brass,41,64);
 b.cylinder(0,-.115,0,1.7,1.7,.07,dark,23,64);
 b.cylinder(0,-.16,0,1.58,1.58,.035,ink,0,64);
 for(let i=0;i<48;i++){const a=i*Math.PI/24,r=i%4?1.4:1.29;b.beam([Math.cos(a)*r,-.19,Math.sin(a)*r],[Math.cos(a)*1.51,-.19,Math.sin(a)*1.51],i%4?.015:.029,gold,41,4);}
 // Twelve inset mint charge windows and a substantial central needle.
 for(let i=0;i<12;i++){const a=.42+i*.45;b.push(Math.cos(a)*1.03,-.2,Math.sin(a)*1.03,0,-a);b.box(0,0,0,.14,.025,.27,i<2?mint:'#52675a',i<2?10:0);b.pop();}
 b.beam([0,-.23,0],[-.83,-.23,.63],.045,ivory,0,6);b.sphere(0,-.25,0,.16,.065,.16,gold,41,12,6);b.pop();
 // Twin ceramic inductors, copper windings, connecting pipes, and pilot lamps.
 for(const side of[-1,1]){
  const xx=side*2.55;
  b.cylinder(xx,.81,-.25,.45,.45,.34,brass,41,20);
  b.cylinder(xx,1.67,-.25,.29,.29,1.5,ivory,0,16);
  for(let i=0;i<10;i++){
   const yy=1.03+i*.135;b.cylinder(xx,yy,-.25,.41,.41,.055,i%2?brass:gold,41,16);
  }
  b.sphere(xx,2.54,-.25,.33,.36,.33,mint,10,16,8);
  b.beam([xx,.82,-.25],[xx,.82,-1.22],.1,brass,41,8);
  b.beam([xx,.82,-1.22],[side*1.4,.82,-1.8],.1,brass,41,8);
 }
 // Front instrument plaque and five jewel indicators.
 b.box(0,.82,2.66,1.9,.28,.19,brass,41);b.box(0,.83,2.765,1.7,.17,.025,dark,23);
 for(let i=0;i<5;i++)b.sphere((i-2)*.26,.84,2.795,.045,.045,.025,mint,10,8,4);
 b.pop();return 0;
}
