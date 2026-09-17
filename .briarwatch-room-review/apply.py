from pathlib import Path
p=Path('src/rooms/briarwatch.js')
s=p.read_text()
a=s.index('function briarShell(b){')
z=s.index('\n\n\n// Track uses',a)
new=r'''function briarShell(b){
 const walls=[];b.box(0,FLOOR-.25,0,158,.45,130,'#826c4c',21);
 // The room is an old estate railway gallery, not a neutral box. Furniture and
 // fittings hug the perimeter so the miniature remains the visual center.
 b.box(2,-18,47,12,1.0,5,'#6d553a',22);
 for(const x of[-2,6])for(const z of[45,49])b.box(x,-21,z,.6,6,.6,'#5d4934',22);
 b.box(2,-17.25,47,7,.36,4.8,'#d8c9a6',23);b.push(2,-17.02,47,-PI/2);roomSign(b,'blueprint',0,0,0,6.8,4.5);b.pop();
 // Two museum benches and a narrow runner make the central aisle feel inhabited
 // without blocking the horseshoe cabinet or any authored camera.
 for(const x of[-24,24]){b.box(x,-20.72,50,10,.55,2.1,'#70573b',22);for(const dx of[-4.1,4.1])b.box(x+dx,-22.25,50,.45,3,.45,'#5b4936',22);}
 b.box(0,FLOOR+.018,51,53,.035,5.2,'#6e4038',23);b.box(0,FLOOR+.038,51,49,.018,4.55,'#b18c62',23);
 for(const which of['back','left','right','front']){
  const w=new Builder(),back=which==='back',front=which==='front',side=!back&&!front,width=back||front?156:128,pos=back?[0,0,-64]:front?[0,0,64]:which==='left'?[-78,0,0]:[78,0,0],angle=back?0:front?PI:which==='left'?PI/2:-PI/2;
  w.push(...pos,0,angle);
  // Warm lime plaster above a deep oak dado, with layered skirting/cornice.
  w.box(0,13,0,width,74,.6,'#c2bca7',20);w.box(0,-16,.45,width,16,.6,'#30483e',22);
  w.box(0,-23.2,.92,width,.62,1.05,'#6b5438',22);w.box(0,-8.1,.90,width,.75,.92,'#806746',22);w.box(0,42.7,.82,width,.82,1.05,'#765d3e',22);
  // Authored wall bays: broad recessed plaster fields framed by oak pilasters.
  const bay=side?16:18;
  for(let x=-width/2+5;x<width/2;x+=bay){
   w.box(x,14,.82,.72,58.2,.72,'#70583d',22);
   w.box(x+bay*.42,35.5,.80,bay*.72,.34,.72,'#9a8058',22);
   w.box(x+bay*.42,-7.0,.80,bay*.72,.26,.66,'#9a8058',22);
  }
  // Raised dado panels read at room scale instead of a picket-fence rhythm.
  for(let x=-width/2+8;x<width/2-3;x+=12){w.box(x,-15.7,1.00,9.4,10.7,.16,'#3a5448',22);w.box(x,-15.7,1.10,8.2,9.5,.08,'#56705d',22);}
  if(back){
   for(const x of[-42,42]){
    // Deep arched window embrasures with stone-toned reveals and oak mullions.
    w.box(x,18,.72,24,31,.50,'#9f9b8c',20);roomSign(w,'window',x,18,1.12,21,29,0,33);
    for(const dx of[-10.6,0,10.6])w.box(x+dx,18,1.28,.48,29.6,.82,'#aa9167',22);
    for(const y of[3.1,18,32.9])w.box(x,y,1.28,22,.55,.82,'#b39a70',22);
    archRing(w,x,33,1.28,10.5,11.3,.86,'#958364',20);
    w.box(x,1.7,1.35,23.6,.55,1.25,'#7b6547',22);
   }
   // A restrained heraldic centerpiece gives the far wall a focal point.
   w.box(0,20,.92,28,29,.28,'#a9a38f',20);w.box(0,20,1.10,25.5,26.5,.16,'#c8c0aa',20);
   w.push(0,20,1.24,0,0);w.cylinder(0,0,0,5.4,5.4,.16,'#72563d',22,16,PI/2);w.cylinder(0,0,.12,4.5,4.5,.12,'#9b7b50',22,16,PI/2);w.box(0,.2,.24,1.0,6.0,.18,'#3d5145',22);w.box(0,.2,.25,6.0,1.0,.18,'#3d5145',22);w.pop();
   const key='house-'+Object.keys(HOUSE_ROOMS).indexOf('briarwatch');if(roomLabels[key])roomFrame(w,key,0,36,1.15,42,8);
  }else if(side){
   // Framed railway drawings sit inside the wall bays, with small brass labels.
   roomFrame(w,'blueprint',-29,11,1.12,23,18);roomFrame(w,'slow',29,10,1.12,14,20);
   for(const x of[-29,29]){w.box(x,-1.3,1.32,7.5,.42,.16,'#9c8355',41);w.cylinder(x-3.1,-1.3,1.42,.13,.13,.08,'#d0b778',41,10,PI/2);}
  }
  if(front){
   // Entry portal becomes a proper paneled gallery door surround.
   w.box(0,-3,1,21,44,1,'#684f36',22);w.box(0,-3,1.62,16,39,.22,'#3c5145',22);
   for(const x of[-7.2,7.2])w.box(x,-3,1.82,.55,39,.32,'#a0875d',22);
   w.box(0,16.4,1.82,15,.55,.32,'#a0875d',22);w.cylinder(6,-4,1.98,.35,.35,.5,'#c3a977',41,14,PI/2);roomFrame(w,'shop-sign',0,24,1.05,35,8);
  }
  // Wall sconces create pools of warm detail while staying above the layout.
  const sconces=back?[-65,-19,19,65]:side?[-47,-15,15,47]:[-55,-30,30,55];
  for(const x of sconces){w.box(x,25,1.22,.24,3.2,.34,'#725f43',22);w.beam([x,24.4,1.30],[x,23.1,2.2],.055,'#9f875a',41,6);w.cylinder(x,22.75,2.28,.72,.34,.66,'#d7bd83',41,14);w.cylinder(x,22.40,2.28,.61,.61,.05,'#f0d9a7',25,14);}
  // Roof fittings follow their wall's native cutaway. Layered trusses and
  // lanterns suggest a timber gallery ceiling without spanning the miniature.
  if(back||front){
   const z=back?15:18,lampZ=back?19:20;
   w.beam([-77,43,z],[77,43,z],.58,'#665039',22,4);
   for(const x of[-68,-34,0,34,68]){w.beam([x-7,35,z],[x,43,z],.34,'#806343',22,4);w.beam([x+7,35,z],[x,43,z],.34,'#806343',22,4);}
   for(const x of[-44,44]){
    w.beam([x,43,lampZ],[x,46,lampZ],.045,'#51473a',41,6);w.cylinder(x,42.5,lampZ,3.0,1.35,1.15,'#94794f',41,20);w.cylinder(x,41.91,lampZ,2.72,2.72,.07,'#f0dcb0',25,20);
    for(let i=0;i<6;i++){const a=i*TAU/6;w.beam([x,42.35,lampZ],[x+Math.cos(a)*2.2,41.55,lampZ+Math.sin(a)*2.2],.045,'#8f744d',41,5);w.sphere(x+Math.cos(a)*2.2,41.5,lampZ+Math.sin(a)*2.2,.18,.24,.18,'#e5c889',25,8,4);}
   }
  }
  w.pop();walls.push({which,mesh:w.mesh()});
 }
 return walls;
}'''
p.write_text(s[:a]+new+s[z:])
