'use strict';

// A working atelier: finished scenery on the left, the next railway taking
// shape on the right. Furniture and traces of its makers provide the scale.
Object.assign(HOUSE_ROOMS.studio,{layout:'The art of little worlds',tag:'ON THE WORKBENCH',description:'A sunlit atelier of timber, paint, and patient hands. A finished branch line runs beside the next little world taking shape.',distance:154,target:[-2,-5,-5],pitch:.60,yaw:.30});

function studioRing(b,x,y,z,r,t,color,angle=0){
 b.push(x,y,z,angle);for(let i=0;i<24;i++){const a=i*TAU/24,q=(i+1)*TAU/24;b.beam([Math.cos(a)*r,Math.sin(a)*r,0],[Math.cos(q)*r,Math.sin(q)*r,0],t,color,41,6);}b.pop();
}
function studioBottle(b,x,y,z,color,s=1){
 b.cylinder(x,y+.58*s,z,.42*s,.42*s,1.12*s,color,23,12);b.cylinder(x,y+1.20*s,z,.44*s,.44*s,.22*s,'#464d45',42,12);
 b.box(x,y+.56*s,z+.425*s,.61*s,.54*s,.018*s,'#e9dfc7',0);b.box(x,y+.56*s,z+.438*s,.39*s,.15*s,.01*s,color,0);
}
function studioTaskLamp(b,x,y,z,s=1){
 b.push(x,y,z,0,0,0,s);b.cylinder(0,.17,0,1.1,1.0,.34,'#546b5b',41,24);b.cylinder(0,1.96,0,.09,.09,3.6,'#b69e70',41,12);
 b.sphere(0,3.75,0,.20,.20,.20,'#c6b283',41,12,7);b.beam([0,3.75,0],[2.75,5.1,0],.085,'#b29d72',41,10);
 b.push(2.85,4.69,0,0,0,-.24);b.cylinder(0,0,0,1.03,.31,1.3,'#607a62',41,24);b.cylinder(0,-.657,0,.94,.94,.035,'#efdbac',25,24);b.pop();b.pop();
}
function studioStool(b,x,z,turn=0){
 b.push(x,FLOOR,z,0,turn);b.cylinder(0,10,0,2.7,2.7,.8,'#a17c50',22,24);b.cylinder(0,9.53,0,2.2,2.2,.18,'#35483f',41,18);
 for(const s of[-1,1])for(const t of[-1,1])b.beam([s*1.55,9.5,t*1.55],[s*2.2,.25,t*2.2],.14,'#45594f',41,8);
 for(const s of[-1,1]){b.beam([s*1.9,3.1,-1.9],[s*1.9,3.1,1.9],.085,'#75816d',41,7);b.beam([-1.9,3.1,s*1.9],[1.9,3.1,s*1.9],.085,'#75816d',41,7);}b.pop();
}
function studioWindow(b,x,y,z,w,h){
 b.box(x,y,z,w+1.8,h+1.8,.8,'#57635b',22);roomSign(b,'window',x,y,z+.45,w,h,0,33);
 for(let i=0;i<=3;i++)b.box(x-w/2+i*w/3,y,z+.68,.38,h+.5,.38,'#d7ccb3',22);
 for(const yy of[-h/2,0,h/2])b.box(x,y+yy,z+.7,w+.6,.38,.4,'#d7ccb3',22);
 b.box(x,y-h/2-.6,z+1.35,w+2.4,.65,3.2,'#b9a281',22);
}
function studioShelf(b,x,z,w,angle=0){
 b.push(x,FLOOR,z,0,angle);b.box(0,16,-1.3,w,32,.65,'#4c6059',22);
 for(const xx of[-w/2,w/2])b.box(xx,16,.8,.75,32,5.4,'#967e59',22);
 for(let row=0;row<4;row++){
  const y=1.6+row*8.8;b.box(0,y,.8,w,.52,5.6,'#ba9b6b',22);
  if(row===3)continue;
  const n=Math.floor(w/6);for(let i=0;i<n;i++){
   const xx=-w/2+3+i*(w-3)/n;
   if(row===1&&i%3!==2){for(let k=0;k<3;k++)book(b,xx-1.7+k*1.12,y+.27,.8,.83,4.8+hash(i,k)*1.6,3.2,['#b1a17c','#536e68','#965f4d'][(i+k)%3],k===2?.08:0);}
   else{const h=4.4+hash(i,row)*1.4;b.box(xx,y+h/2+.27,.8,5.1,h,4.4,['#b1a17a','#789085','#af785b','#64777d'][(i+row)%4],23);roomSign(b,'kit-'+((i+row)%4),xx,y+h/2+.27,3.03,4.6,h*.85);}
  }
 }
 b.box(0,32.5,.8,w+1.4,.9,6,'#b49a70',22);b.pop();
}
function studioClamp(b,x,y,z){
 b.box(x,y-.65,z,.50,3.4,.55,'#485d54',41);b.box(x,y+.91,z-.60,.50,.35,1.65,'#485d54',41);b.box(x,y-2.2,z-.65,.50,.36,1.75,'#485d54',41);
 b.cylinder(x,y-1.25,z-1.12,.085,.085,2.45,'#c2b18b',41,10);b.cylinder(x,y-.14,z-1.12,.35,.35,.12,'#6c7661',41,12);b.beam([x-.7,y-2.5,z-1.12],[x+.7,y-2.5,z-1.12],.065,'#ab8961',22,7);
}
function studioContour(b,x,y,z,rx,rz,h,color,phase=0){
 const points=[];for(let i=0;i<24;i++){const a=i*TAU/24,r=1+.07*Math.sin(a*3+phase)+.03*Math.sin(a*7);points.push([x+Math.cos(a)*rx*r,z+Math.sin(a)*rz*r]);}
 for(let i=0;i<points.length;i++){const a=points[i],q=points[(i+1)%points.length];b.tri([x,y+h/2,z],[q[0],y+h/2,q[1]],[a[0],y+h/2,a[1]],color,23);b.quad([a[0],y-h/2,a[1]],[q[0],y-h/2,q[1]],[q[0],y+h/2,q[1]],[a[0],y+h/2,a[1]],shade(color,.87),23);}
}
function studioToolboard(b){
 b.push(-31,1.2,-54);b.box(0,0,0,70,21,.72,'#ae966d',22);
 for(const yy of[-10.7,10.7])b.box(0,yy,.1,72,.6,1.1,'#75674e',22);
 for(let x=-33;x<=33;x+=1.8)for(let y=-9;y<10;y+=1.8)b.quad([x-.08,y-.08,.375],[x+.08,y-.08,.375],[x+.08,y+.08,.375],[x-.08,y+.08,.375],'#605c48',0);
 // Hanging saw, brass square, brushes, rulers, wire and miniature clamps.
 b.push(-22,1,.8,0,0,-.12);b.box(0,0,0,13,3.3,.12,'#8d9990',41);b.box(-7.4,0,.02,3.7,3.4,.3,'#776148',22);b.box(-7.4,0,.19,2.0,1.8,.02,'#b29b72',0);
 for(let i=0;i<26;i++){const x=-6.4+i*.49;b.tri([x,-1.65,.06],[x+.46,-1.65,.06],[x+.18,-1.99,.06],'#859087',41);}b.pop();
 for(const xx of[-28,-24]){b.cylinder(xx,6,.94,1.25,1.25,.8,'#6e8076',22,18,PI/2);for(const zz of[.47,1.39])b.cylinder(xx,6,zz,1.43,1.43,.14,'#c4ac79',22,18,PI/2);}
 for(let i=0;i<5;i++){const x=-10+i*1.05;b.cylinder(x,-1.75,.77,.065,.065,8.5,'#b69362',22,7);b.box(x,2.4,.77,.28,1.35,.15,'#cfceb6',41);b.box(x,3.48,.77,.25,.85,.13,'#6c5c42',23);}
 b.box(1,1,.8,.65,14,.17,'#c6b27b',41);b.box(5.5,-5.7,.8,9.5,.66,.17,'#c6b27b',41);
 for(let i=0;i<30;i++)b.box(1.16,-5.6+i*.43,.91,.25,.025,.02,'#647365',0);
 roomFrame(b,'manual',16,2,.65,15,10.8);for(const xx of[10,22])b.sphere(xx,6.4,1.12,.15,.15,.055,'#ae7050',41,8,5);
 b.push(29,-.6,.9,0,0,.11);b.box(0,0,0,1.1,12,.25,'#976948',22);for(let i=0;i<22;i++)b.box(.2,-5.2+i*.5,.15,.55,.05,.03,'#d5c19c',0);b.pop();
 b.box(0,-9,2,68,.5,4,'#9d8057',22);for(let i=0;i<12;i++)studioBottle(b,-27+i*2.9,-8.73,2.5,['#788a64','#b8986f','#9e7861','#d2c6a6','#637d80','#97684e'][i%6],.85);
 b.pop();
}
function studioWorkbench(b){
 const top=-7.7;
 b.box(-9,top-.6,-43,118,1.2,15.2,'#bc9c68',22);b.box(-9,top-.05,-35.35,118,.12,.32,'#e0c08c',22);
 for(const xx of[-62,-10,44])for(const zz of[-48,-38]){b.box(xx,(FLOOR+top-1.2)/2,zz,1.25,top-1.2-FLOOR,1.25,'#4e6357',41);b.box(xx,FLOOR+.2,zz,2.5,.4,2.5,'#35483d',42);}
 for(const x of[-47,25])cabinet(b,x,-43,24,12.4,14.8);
 studioToolboard(b);onTop(b,'mat',-33,top+.045,-43,33,11.9);onTop(b,'manual',18,top+.055,-43,14,9.8);
 // A partly assembled cottage, detached roof, trimming knife and brass rule.
 b.box(-37,top+.24,-42,10,.4,7,'#b3a17b',23);b.box(-37,top+.5,-42,9.3,.15,6.3,'#d5ceb6',23);
 for(const xx of[-40.3,-33.7])b.box(xx,top+1.7,-42,.20,2.4,4.7,'#e1d5b5',23);
 for(const zz of[-44.3,-39.7])b.box(-37,top+1.7,zz,6.8,2.4,.20,'#ddd0b1',23);
 b.push(-27,top+.45,-44,0,.12);b.box(0,0,0,7,.18,4.3,'#8b9a80',23);for(let i=0;i<10;i++)b.box(-3.15+i*.68,.10,0,.065,.055,4.4,'#657c68',0);b.pop();
 b.push(-31,top+.13,-38.5,0,.20);b.box(0,0,0,12,.08,.65,'#c7b283',41);for(let i=0;i<30;i++)b.box(-5.7+i*.39,.052,.13,.028,.02,.33,'#65715c',0);b.pop();
 b.beam([-44,top+.13,-37.5],[-38.5,top+.13,-38.3],.15,'#64857a',41,9);b.tri([-38.6,top+.14,-38.1],[-36.7,top+.14,-38.5],[-38.5,top+.14,-38.6],'#c7c9b0',41);
 studioTaskLamp(b,-54,top,-46,1.8);studioTaskLamp(b,35,top,-47,1.35);mug(b,4,top,-38.2,1.7);
 for(const x of[14.0,15.6])studioRing(b,x,top+.12,-42,.64,.033,'#79715a',PI/2);b.beam([14.65,top+.12,-42],[14.95,top+.12,-42],.028,'#79715a',41,5);b.beam([13.37,top+.12,-42],[13.32,top+.14,-40.5],.03,'#79715a',41,5);
 b.cylinder(-4,top+.65,-46,1.1,1.1,1.3,'#938a69',23,18);for(let i=0;i<9;i++){const x=-4+Math.sin(i*2.4)*.67,z=-46+Math.cos(i*2.4)*.67;b.beam([x,top+.65,z],[x+.25,top+4.5+hash(i,8),z+.3],.075,'#c4a676',22,7);}
 for(let i=0;i<8;i++)studioBottle(b,9+i*1.8,top,-48,['#74845b','#aa835c','#ccbb8d','#a06449','#6a8181','#a9ae98'][i%6]);
 for(let i=0;i<5;i++){b.box(42,top+.18+i*.32,-41,9,.28,6,['#b7c3b0','#e2d7b8','#9da995'][i%3],23);b.box(42,top+.35+i*.32,-41,8,.05,5,'#e3d7b6',23);}
 // A linen apron hangs by the plans. There is no full-size person underneath.
 b.box(61,-4,-59,8,13,.12,'#a4ac92',23);b.box(61,4,-59,5.4,4.5,.12,'#a4ac92',23);b.box(61,-3,-58.85,5.5,3,.10,'#b6ba9c',23);
 b.beam([58.5,6,-59],[59.5,10,-59],.12,'#d3c4a1',23,6);b.beam([59.5,10,-59],[62.5,10,-59],.12,'#d3c4a1',23,6);b.beam([62.5,10,-59],[63.5,6,-59],.12,'#d3c4a1',23,6);
 studioStool(b,-39,-23,.2);studioStool(b,16,-27,-.12);
}
function studioFinishedLayout(scene,b){
 const cx=-28,cz=7,ground=-4.8;
 modelTable(b,cx,cz,49,37,ground,'#829268');
 const height=(x,z)=>{const trackDistance=Math.abs(Math.hypot(x/20.2,z/13.7)-1)*13.7;return .47+(3.7*Math.exp(-((x+4)**2/65+(z+5)**2/24))+.24*noise(x*.5,z*.5))*smooth(1.1,3.4,trackDistance);};
 b.push(cx,ground,cz);houseTerrain(b,48,36,height,(x,y,z)=>lerpV(col('#758a5b'),col('#a4ac72'),noise(x*.36,z*.36)*.7),.72);b.pop();
 const edge=ovalRoute('The finished meadow branch',cx,cz,20.2,13.7,ground+.68);createRail(b,edge);
 houseStation(scene,b,cx-1,ground+.49,cz+9.3,'shop-sign',false);
 for(const [x,z,c]of[[-42,5,'#d7c39d'],[-39,0,'#d4bf9a'],[-20,4,'#c3c8a8']])cottage(b,x,ground+height(x-cx,z-cz),z,3.2,2.8,2.5,c,'#6c7f66',-.08);
 b.sphere(-16,ground+.49,9,3.4,.035,2.5,'#739c90',7,24,7);b.box(-16,ground+.64,9,1.0,.15,5.6,'#b3a278',22);for(const z of[7,8,9,10,11])b.box(-16,ground+.75,z,1.0,.08,.045,'#7d805f',22);
 for(let i=0;i<62;i++){
  const x=-50+hash(i,74)*44,z=-9+hash(i,93)*31,dx=x-cx,dz=z-cz,d=Math.abs(Math.hypot(dx/20.2,dz/13.7)-1)*13.7;
  if(d<2.0||z>13||Math.hypot(x+16,z-9)<5.0||Math.hypot(x+40,z-3)<6.5)continue;
  roomTree(b,x,ground+height(dx,dz),z,2.0+hash(i,53)*2.0,i%5===0);
 }
 for(let i=0;i<9;i++)b.box(-20+i*.7,ground+.50,-1.4,.12,.045,4.4,i%2?'#b8ad70':'#899368',3);
 for(let i=0;i<10;i++)scenePerson(scene,b,-34+i*1.02,ground+.78,18.3,i%3?'bag':'talk',i*.47);
 scenePerson(scene,b,-13.7,ground+.5,9.6,'stand',.8);scenePerson(scene,b,-14.1,ground+.5,11,'talk',2.1);
 b.box(cx,-7.7,25.65,30,3.4,.45,'#4b6655',22);roomSign(b,'workshop-class',cx,-7.7,25.91,28,2.6);
 b.push(-46,-7.7,25.8,-.15);b.box(0,0,0,5.4,3.3,.65,'#445d53',41);b.cylinder(0,0,.5,.76,.65,.60,'#bdad7b',41,20,PI/2);b.cylinder(-1.7,.7,.4,.18,.18,.18,'#d4be81',25,10,PI/2);b.pop();
 return {edge,height:(x,z)=>ground+height(x-cx,z-cz)};
}
function studioConstructionLayout(scene,b){
 const cx=29,cz=7,w=42,d=37,top=-5.22;
 b.box(cx,top-.22,cz,w,.44,d,'#cbbb92',22);
 for(const s of[-1,1]){b.box(cx+s*(w/2-.45),top-1.8,cz,.9,3.1,d,'#b29a6c',22);b.box(cx,top-1.8,cz+s*(d/2-.45),w,3.1,.9,'#b29a6c',22);}
 for(const x of[13,26,39,46])b.box(x,top-1.8,cz,.6,3.1,d-1,'#a99168',22);
 for(const x of[13,45])for(const z of[-7,21]){b.box(x,(FLOOR+top-3)/2,z,1.5,top-3-FLOOR,1.5,'#a58d62',22);b.box(x,FLOOR+4.2,z,.9,.8,26,'#988059',22);}
 for(const x of[13,45])b.beam([x,FLOOR+1,-6],[x,top-3,20],.32,'#b59a70',22,4);
 for(let i=0;i<5;i++){b.box(20+i*1.9,FLOOR+6.5,7,1.6,.45,26,'#baa57e',22);b.box(20+i*1.9,FLOOR+6.99,7,1.6,.45,24,'#d2c199',22);}
 // Pencil grid and survey marks remain visible on the unfinished birch.
 for(let x=9;x<50;x+=2)b.box(x,top+.015,7,.025,.016,35,'#a99f7c',0);
 for(let z=-10;z<25;z+=2)b.box(29,top+.016,z,40,.016,.025,'#a99f7c',0);
 const edge=ovalRoute('The railway taking shape',cx,cz,17.0,13.7,top+.21);ribbon(b,edge,1.80,0,-.20,'#b2976b',22,0,edge.length,.38);createRail(b,edge);
 // Cut foam terraces make the technique legible from the room view.
 for(let i=0;i<7;i++)studioContour(b,32+i*.28,top+.38+i*.64,3.8,10.4-i*1.06,7.2-i*.71,.62,['#b3c4bc','#d5d1b1','#c0cdc0'][i%3],.7);
 studioContour(b,34.2,top+4.79,3.8,3.2,2.1,.19,'#e4dfc4',.7);
 // Detached foam sheets, a tracing plan, and white card walls awaiting paint.
 for(let i=0;i<3;i++)b.box(18.8,top+.18+i*.30,11.3,7,.29,4.5,['#b8c9bf','#d9d4b7','#b8c9bf'][i],23);
 onTop(b,'manual',32,top+.035,15,8.4,4.6);
 for(const xx of[17.8,22.2])b.box(xx,top+1.4,.2,.18,2.8,3.3,'#ded9bf',23);
 for(const zz of[-1.4,1.8])b.box(20,top+1.4,zz,4.6,2.8,.18,'#ded9bf',23);
 b.box(24.2,top+.12,-.4,2.7,.18,3.8,'#b9c6b7',23);b.beam([15.5,top+.1,14],[20.2,top+.1,14.7],.075,'#b19156',22,7);
 for(const x of[16,41])studioClamp(b,x,top,26.2);
 // Softly hanging electrical leads make the exposed baseboard believable.
 for(let k=0;k<2;k++)for(let i=0;i<14;i++){const a=i/14,q=(i+1)/14;const p=t=>[19+t*17,top-3.5-Math.sin(t*PI)*(4+k),25.1];b.beam(p(a),p(q),.045,k?'#9d5644':'#556e58',23,6);}
 b.box(29,-9.7,25.75,24,2.0,.32,'#b1976b',22);roomSign(b,'kits-sign',29,-9.7,25.94,22,1.5);
 return {edge};
}
function studioRoom(scene,b){
 studioWorkbench(b);
 const finished=studioFinishedLayout(scene,b),construction=studioConstructionLayout(scene,b);
 scene.routes=[finished.edge,construction.edge];scene.trains=[{edge:finished.edge,distance:12,speed:.64,type:'steam',cars:2},{edge:construction.edge,distance:48,speed:.68,type:'mountain',cars:1}];
 studioShelf(b,-73,-7,57,PI/2);studioShelf(b,56,-60,25);
 // The apothecary paint rack is a single organized colour library.
 b.push(-64,0,-36,0,PI/2);b.box(0,-8,0,21,24,.6,'#4f6559',22);
 for(let row=0;row<5;row++){const y=-19+row*4.5;b.box(0,y,1.2,22,.35,3,'#b59a6b',22);for(let i=0;i<9;i++)studioBottle(b,-9+i*2.2,y+.18,1.5,['#ae7853','#c5b58a','#84956c','#597b71','#a07464','#909e94'][(i+row)%6],.9);}b.pop();
 // Counter beside the tiled street entrance: till, parcels and a quiet bell.
 cabinet(b,-57,38,27,13,16);b.box(-61,-6.7,38,5.5,2.2,4,'#909b83',41);b.push(-61,-5,37.7,-.25);b.box(0,0,0,4.8,1.3,.9,'#4a6056',41);b.box(0,0,.47,3.5,.7,.025,'#c1c5a3',6);b.pop();
 for(let i=0;i<3;i++){b.box(-51,-7.35+i*.85,38.5,6.5,.8,4.3,['#bd9b70','#c5ab80','#a8ad8d'][i],23);b.box(-51,-6.93+i*.85,38.5,.12,.035,4.4,'#ece0c0',23);b.box(-51,-6.92+i*.85,38.5,6.6,.035,.12,'#ece0c0',23);}
 b.sphere(-55,-7.1,42,.64,.39,.64,'#cfb786',41,18,8);b.cylinder(-55,-6.67,42,.12,.12,.20,'#cfb786',41,10);onTop(b,'manual',-63,-7.43,42,5.4,3.9);roomSign(b,'shop-counter',-57,-13.1,44.72,23,4.7);
 // A movable materials cart, rather than a second formal display cabinet.
 b.push(62,0,25,0,-.12);for(const yy of[-19.5,-11.8])b.box(0,yy,0,16,.6,11,'#9b8e6c',22);for(const x of[-7,7])for(const z of[-4.5,4.5]){b.box(x,-16,z,.45,14,.45,'#556c60',41);b.cylinder(x,FLOOR+.85,z,.72,.72,.4,'#394d43',42,12,0,PI/2);}
 for(let i=0;i<3;i++)b.box(-1,-19+i*.5,0,13,.46,8.7,['#c6c0a0','#b5c5b9','#e1d7b8'][i],23);
 b.box(-2,-10.1,0,7,2.8,5,'#ab9470',23);b.box(-2,-8.62,0,7.3,.25,5.3,'#c7b18b',22);mug(b,5,-11.45,3,1.3);b.pop();
 // Rolled plans in a rack; offcuts and small deliveries under the benches.
 b.box(65,FLOOR+3,-37,10,6,8,'#967e5c',22);for(let i=0;i<8;i++){const x=61.5+(i%4)*2.1,z=-39+Math.floor(i/4)*3;b.cylinder(x,FLOOR+8,z,.64,.64,12,'#ddd1b2',23,12);b.cylinder(x,FLOOR+14.02,z,.40,.40,.025,'#9c8d6d',0,12);}
 for(const [x,z,w]of[[-44,9,12],[-11,-42,16],[30,-44,11]]){b.box(x,FLOOR+2.7,z,w,5.4,7,'#b49b72',23);b.box(x,FLOOR+5.43,z,w+.3,.2,7.3,'#ccb589',22);b.box(x,FLOOR+2.7,z+3.52,w*.65,2.1,.025,'#ded1b0',0);}
 plant(b,-70,49,.68);
 scene.height=(x,z)=>x>-52.5&&x<-3.5&&z>-11.5&&z<25.5?finished.height(x,z):x>8&&x<50&&z>-11.5&&z<25.5?-5.22:FLOOR;
 scene.spots=[
  {name:'The making bench',detail:'A cottage in pieces. Brass rulers, paint, and a well-loved cutting mat.',target:[-27,-5,-42],distance:62,yaw:.14,pitch:.67},
  {name:'A finished little world',detail:'The meadow branch, tended one tiny tree at a time.',target:[-28,-1.5,7],distance:55,yaw:.30,pitch:.64},
  {name:'Before the scenery',detail:'Birch, cut foam, and a working railway. Every landscape begins here.',target:[29,-2,7],distance:52,yaw:.25,pitch:.71},
  {name:'The record of a hobby',detail:'A library of ideas, old kits, and the promise of a Saturday afternoon.',target:[-60,-7,15],distance:58,yaw:.62,pitch:.48}
 ];
}

ROOM_SHELLS.studio=b=>{
 const walls=[];
 // Cork tiles and a small tiled vestibule distinguish the practical shop floor.
 b.box(0,FLOOR-.42,0,158,.80,130,'#8f8166',23);
 for(let x=-72;x<=72;x+=12)for(let z=-58;z<=58;z+=12)b.box(x,FLOOR+.018,z,11.94,.045,11.94,shade('#b09b77',.92+hash(x,z)*.12),23);
 for(let i=0;i<8;i++)for(let j=0;j<4;j++)b.box(-69+i*6,FLOOR+.055,43+j*6,5.95,.045,5.95,(i+j)%2?'#59665a':'#d4cbb0',23);
 b.box(-48,FLOOR+.075,40,48,.04,.20,'#bda777',41);b.box(-23.9,FLOOR+.075,51, .20,.04,22,'#bda777',41);
 b.box(-10,FLOOR+.075,-36,115,.06,11,'#596657',23);for(let x=-65;x<46;x+=1.3)b.box(x,FLOOR+.112,-36,.035,.015,10.2,'#77806a',0);
 for(const which of['back','left','right','front']){
  const w=new Builder(),back=which==='back',front=which==='front',width=back||front?156:128,pos=back?[0,0,-64]:front?[0,0,64]:which==='left'?[-78,0,0]:[78,0,0],angle=back?0:front?PI:which==='left'?PI/2:-PI/2;
  w.push(...pos,0,angle);w.box(0,4,0,width,56,.75,'#d0c8b1',20);w.box(0,-22,.6,width,3.4,.75,'#70796a',22);w.box(0,30.7,.4,width,1.5,1.3,'#697467',22);
  // Painted brick below the factory windows, with deliberately broader courses.
  if(back){
   for(let row=0;row<9;row++)for(let x=-74+(row%2)*3.4;x<77;x+=6.8)w.box(x,-19+row*2.75,.43,6.55,2.53,.17,shade('#c9bea3',.96+hash(x,row)*.07),23);
   for(const x of[-44,0,44])studioWindow(w,x,18,.55,30,21);
   for(const x of[-65,-22,22,65]){w.box(x,5,.8,.36,46,.30,'#a8ad96',41);w.box(x,27,1.05,1.2,1.5,.7,'#66766a',41);}
   roomFrame(w,'house-3',-44,31.2,1.0,33,5.7);roomFrame(w,'clock',67,20,1,5,5);
  }else if(front){
   // A glazed street door, transom and display window make the shop a place.
   w.box(48,-3,.7,21,42,1.0,'#486257',22);studioWindow(w,48,4,1.28,16.8,23);w.box(48,-15.2,1.4,16.8,12,.23,'#617866',22);w.cylinder(41,-4,1.98,.32,.32,.5,'#d2b986',41,12,PI/2);
   studioWindow(w,-17,5,.65,78,34);roomFrame(w,'shop-sign',-4,27.5,1.1,70,7.7);w.box(48,FLOOR+.2,3.0,23,.4,8,'#a5987c',23);
  }else if(which==='left'){
   studioWindow(w,34,15,.6,32,27);roomFrame(w,'blueprint',-29,17,.7,25,18);
   for(let i=0;i<15;i++)w.box(21+i*1.8,-14,1.2,1.10,10,2.3,'#c0c1ab',41);for(const y of[-18.3,-9.7])w.beam([19,y,1.5],[48,y,1.5],.19,'#a2aa97',41,8);
  }else{
   studioWindow(w,-26,20,.6,48,16);roomFrame(w,'kits-sign',28,18,.7,33,8);roomFrame(w,'workshop-class',28,6,.7,31,6);
   for(const x of[3,53])w.box(x,-5,.75,.42,42,.36,'#89917c',41);
  }
  w.pop();walls.push({which,mesh:w.mesh()});
 }
 // One long suspended task-light frame replaces the matching railway pendants.
 for(const x of[-49,44])b.cylinder(x,31,-5,.048,.048,10,'#5a6358',41,7);
 for(const z of[-8.3,-1.7]){b.box(-2.5,25.6,z,96,1.05,.72,'#57685d',41);b.box(-2.5,25.03,z,93,.10,.55,'#e7d4a6',25);}
 for(const x of[-50.5,45.5])b.box(x,25.6,-5,.72,1.05,7.3,'#57685d',41);
 // Side-mounted lamps leave the tabletop compositions unobstructed.
 for(const x of[-54,36]){b.beam([x,10,-55],[x,10,-47],.10,'#677b68',41,9);b.cylinder(x,9.5,-47,1.35,.50,1.4,'#6c8170',41,20);b.cylinder(x,8.79,-47,1.21,1.21,.03,'#f1d7a2',25,20);}
 return walls;
};

registerHouseRoom('studio',{build:studioRoom,lights:[
 // Two points along the suspended light strips illuminate both workboards.
 [-28,25.03,-8.3],[24,25.03,-1.7],
 // Wall task lights, then the transformed undersides of the two desk lamps.
 [-54,8.79,-47],[36,8.79,-47],[-49.1511,-.4067,-46],[38.6367,-2.23,-47]
]});
