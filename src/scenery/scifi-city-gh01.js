'use strict';

// Sci-Fi City (bay GH-01), an original Hall miniature by Sonur11.
// Deterministic native Builder geometry; the Hall adapter owns placement,
// scale and credits. Positive Z faces the aisle; origin at street level.
function scifiCityGH01(b,x,y,z,angle=0){
 b.push(x,y,z,0,angle);
 const concrete='#4c534d',concreteDark='#343a36',shadow='#2a2f2b';
 const glass='#1f2624',steel='#8fa39b',steelDark='#5b6a64';
 const rust='#6d4f3e',panel='#3d443f',roofMetal='#3c423d';
 const pink='#ff5ec4',cyan='#4fd2ff',amber='#ffb347',lime='#b8e356',white='#e8f0ea';
 // Street plinth and kerbs: the ground the city stands on.
 b.box(0,.05,0,10.7,.10,2.7,concreteDark,4);
 b.box(0,.115,0,10.35,.03,2.4,concrete,4);
 for(const zz of[-1.29,1.29])b.box(0,.09,zz,10.6,.05,.09,steelDark,23);
 for(let i=0;i<9;i++)b.box(-4.1+i*1.03,.115,0,1.0,.032,.05,i%2?concreteDark:shadow,23);
 // Core tower A: stepped body, window bands, antenna mast.
 const ax=-2.35,az=-.30;
 b.box(ax,1.5,az,1.95,3.0,1.65,concrete,4);
 for(let i=0;i<5;i++){const yy=.60+i*.52;
  b.box(ax,yy,az+.84,1.5,.30,.05,glass,6);b.box(ax,yy,az-.84,1.5,.30,.05,glass,6);
  b.box(ax-1.0,yy,az,.08,.30,1.2,glass,6);b.box(ax+1.0,yy,az,.08,.30,1.2,glass,6);}
 b.box(ax+.10,3.40,az,1.5,.80,1.35,'#414741',4);
 b.box(ax+.10,4.6,az,1.1,1.6,1.0,'#464d46',4);
 for(let i=0;i<3;i++){const yy=4.05+i*.55;
  b.box(ax+.10,yy,az+.52,.72,.26,.04,glass,6);b.box(ax+.10,yy,az-.52,.72,.26,.04,glass,6);}
 b.box(ax+.10,5.47,az,1.2,.14,1.08,steel,41);
 b.cylinder(ax+.10,5.86,az,.030,.012,.55,steel,41,6);
 b.sphere(ax+.10,6.13,az,.030,.030,.030,amber,10,6,4);
 // Core tower B: slab body with a rooftop billboard and setback crown.
 const bx=-.42,bz=.28;
 b.box(bx,1.9,bz,1.45,3.8,1.3,'#51584f',4);
 for(let i=0;i<7;i++){const yy=.55+i*.50;
  b.box(bx,yy,bz+.67,1.0,.28,.045,glass,6);b.box(bx,yy,bz-.67,1.0,.28,.045,glass,6);
  b.box(bx-.75,yy,bz,.045,.28,1.0,glass,6);b.box(bx+.75,yy,bz,.045,.28,1.0,glass,6);}
 b.box(bx,4.02,bz-.04,1.0,.44,.88,'#454b45',4);
 b.cylinder(bx-.30,4.4,bz-.04,.20,.16,.34,roofMetal,41,8);
 b.sphere(bx-.30,4.62,bz-.04,.17,.10,.17,steelDark,41,8,5);
 b.box(bx,4.62,bz+.42,1.0,.78,.08,steelDark,41);
 b.box(bx,4.62,bz+.445,.84,.62,.02,pink,10);
 b.box(bx,4.62,bz+.452,.84,.05,.02,white,10);
 // Core tower C: low corner block with a rooftop water tank.
 const cx=-4.55,cz=.40;
 b.box(cx,1.3,cz,1.3,2.6,1.05,'#565c53',4);
 for(let i=0;i<4;i++){const yy=.45+i*.62;
  b.box(cx,yy,cz+.55,.85,.26,.045,glass,6);b.box(cx,yy,cz-.55,.85,.26,.045,glass,6);}
 for(const [lx,lz]of[[-.35,-.28],[.35,-.28],[.35,.28],[-.35,.28]])
  b.box(cx+lx,2.72,cz+lz,.05,.24,.05,steelDark,41);
 b.cylinder(cx,3.05,cz,.22,.17,.42,rust,22,8);
 b.cylinder(cx,3.29,cz,.24,.19,.05,steelDark,41,8);
 // Micro-district: scattered low blocks, alleys and one graffiti wall.
 b.box(1.05,.95,-.42,1.55,1.9,1.25,'#535a53',4);
 for(let i=0;i<3;i++){const yy=.42+i*.55;
  b.box(1.05,yy,.21,1.05,.24,.04,glass,6);}
 b.box(1.05,2.05,-.56,.98,.30,.68,'#4a504a',4);
 b.box(1.05,1.3,-.42,.5,.06,.5,steel,41);
 b.box(2.85,.66,-.08,1.3,1.32,1.0,'#5d635b',4);
 for(let i=0;i<2;i++)b.box(2.85,.55+i*.6,.43,1.0,.22,.04,glass,6);
 b.cylinder(2.62,1.42,.02,.05,.05,.7,steelDark,41,6);
 b.cylinder(3.05,1.40,-.22,.04,.04,.5,steelDark,41,6);
 b.box(4.5,.46,-.52,1.35,.92,1.28,'#575e56',4);
 b.box(4.5,.5,.14,1.0,.28,.02,glass,6);
 b.quad([3.84,.95,.13],[5.16,.95,.13],[5.16,.78,.58],[3.84,.78,.58],'#2e312c',23);
 b.box(4.5,.73,.585,1.36,.05,.05,cyan,10);
 // Graffiti wall: spray slashes, a tagged ring and dashes face the aisle.
 b.box(1.72,.80,.98,1.05,1.60,.30,'#5a534a',4);
 b.quad([1.25,.50,1.14],[1.62,.50,1.14],[2.32,1.28,1.14],[1.95,1.28,1.14],pink,0);
 ringZ(b,1.78,1.38,1.145,.12,.17,.03,cyan,0,10);
 for(let i=0;i<3;i++)b.quad([1.30+i*.16,.32,1.14],[1.42+i*.16,.32,1.14],[1.44+i*.16,.42,1.14],[1.32+i*.16,.42,1.14],lime,0);
 // Spray tags on tower A's street side and tower C's front.
 b.quad([ax-1.02,.70,.30],[ax-1.02,1.62,-.55],[ax-1.02,1.24,-.70],[ax-1.02,.32,-.62],amber,0);
 b.quad([cx-.45,.55,cz+.585],[cx+.15,.55,cz+.585],[cx+.10,.85,cz+.585],[cx-.50,.85,cz+.585],pink,0);
 // Monorail: elevated spine with real pylons, rail cap and a stopped car,
 // plus parked/flying hovercar above the market.
 const beamY=2.33,beamZ=-1.15;
 b.beam([-5.35,beamY,beamZ],[5.15,beamY,beamZ],.11,steelDark,41,6);
 b.box(-.10,2.48,beamZ,10.5,.06,.05,steel,41);
 for(const px of[-4.9,-.5,2.0,3.65]){
  b.box(px,1.16,beamZ,.26,2.32,.26,steelDark,41);
  b.box(px,2.41,beamZ,.40,.10,.40,'#6f7873',41);}
 b.box(5.16,2.33,beamZ,.06,.30,.34,steelDark,41);
 b.box(-5.36,2.33,beamZ,.06,.30,.34,steelDark,41);
 const carx=1.55;
 b.box(carx,2.06,beamZ,1.62,.44,.78,'#a29f92',0);
 for(const yy of[1.92,2.14])b.box(carx,yy,beamZ,1.44,.13,.80,steelDark,23);
 for(const cxx of[carx-.55,carx+.55])b.box(cxx,2.48,beamZ,.30,.13,.84,steelDark,23);
 b.box(carx,2.20,beamZ-.40,1.30,.20,.04,glass,6);
 b.box(carx,2.20,beamZ+.40,1.30,.20,.04,glass,6);
 b.tri([carx+.81,2.28,beamZ-.40],[carx+.81,2.28,beamZ+.40],[carx+1.08,2.02,beamZ],'#b0ada0',0);
 b.tri([carx+.81,1.84,beamZ-.40],[carx+1.08,2.02,beamZ],[carx+.81,1.84,beamZ+.40],'#8e8b80',0);
 b.box(carx+1.09,1.93,beamZ,.02,.07,.38,white,10);
 // Hovercar: wedged spinner hull, glazing and engine glow, banking slightly.
 b.push(3.3,3.15,.48,0,-.32);
 b.box(0,0,0,1.05,.22,.46,'#b3b8ae',0);
 b.tri([.52,.11,.23],[.52,.11,-.23],[.80,-.02,0],'#c6cbc2',0);
 b.tri([.52,-.11,.23],[.52,-.11,-.23],[.80,-.02,0],'#8e948a',0);
 b.box(.08,.15,0,.46,.12,.34,glass,6);
 for(const s of[-1,1])b.quad([-.32,.11,s*.23],[-.02,.11,s*.23],[-.02,.04,s*.40],[-.32,.04,s*.40],'#2c302c',23);
 for(const s of[-.10,.10])b.cylinder(-.42,-.14,s,.045,.035,.12,pink,10,6);
 b.box(-.555,-.01,0,.03,.09,.26,amber,10);
 b.pop();
 // Street props: lamppost, bollards and a holo pole with floating rings.
 b.cylinder(-3.95,1.06,1.02,.035,.03,2.10,steelDark,41,6);
 b.box(-3.95,2.14,.92,.10,.07,.30,panel,23);
 b.box(-3.95,2.14,.77,.09,.05,.05,amber,10);
 for(const px of[-2.2,-1.4,2.9,3.9])b.cylinder(px,.20,1.24,.045,.045,.16,'#6a716a',0,6);
 b.cylinder(.55,1.30,.98,.028,.022,2.60,steel,41,6);
 ringZ(b,.55,1.75,.98,.24,.28,.05,cyan,10,14);
 ringZ(b,.55,1.92,.98,.19,.23,.05,pink,10,12);
 ringZ(b,.55,2.08,.98,.14,.18,.05,lime,10,10);
 b.box(.55,2.72,.98,.06,.18,.06,steel,41);
 b.sphere(.55,2.80,.98,.045,.045,.045,white,10,6,4);
 b.pop();return 0;
}