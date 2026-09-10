// Moonlight Drive-In, an original miniature by nickfromlater.
// Native port of the author's standalone scene: the complete authored parking
// layout, cars, spectators, buildings and props share the house mesh lifecycle.
// Positive Z faces the entrance. Ground surface is .36; timber base bottom -1.18.
// All temporary nodes and primitive samples are local to this build, never a
// file-load cache or frame-loop allocation. The host owns film and lighting.
function moonlightDriveIn(b,x=0,y=0,z=0,angle=0,{landscape=false}={}){
 const pi=Math.PI,tau=pi*2;
 // The original three decorative canvas textures consumed this deterministic
 // sequence before scenery. Starting here preserves every authored placement.
 let seed=593565823;const rnd=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296),range=(a,c)=>a+rnd()*(c-a);
 const point=(x=0,y=0,z=0)=>({x,y,z,set(x,y,z){this.x=x;this.y=y;this.z=z;return this},setScalar(v){return this.set(v,v,v)},toArray(){return[this.x,this.y,this.z]}});
 const group=()=>({position:point(),rotation:point(),scale:point(1,1,1),children:[],add(o){this.children.push(o);return this}}),world=group();
 const m=(color,roughness=.8,metalness=0)=>({color,mat:metalness>=.45?41:23});
 const materials={ivory:m('#d7cbb0'),ochre:m('#b19b6b'),metal:m('#b4b4a7',.32,.65),steel:m('#526764',.5,.5),wood:{color:'#715844',mat:22},rubber:m('#202b2a'),glass:{color:'#638883',mat:41},red:m('#943f39',.52,.14),cream:m('#f1dbab'),grass:m('#777e51'),dark:m('#253535')};
 const groundMat={color:'#7a8158',mat:23},lotMat={color:'#919184',mat:23},roadMat={color:'#777a70',mat:23};
 const bulbMat={color:'#ffd19b',mat:10},redGlow={color:'#dc6a48',mat:10},windowMat={color:'#f2be75',mat:10};
 const mesh=(draw,mat,x=0,y=0,z=0,parent=world)=>{const o=group();o.position.set(x,y,z);o.draw=()=>draw(mat.color,mat.mat);parent.add(o);return o};
 const box=(w,h,d,x,y,z,mat,parent=world)=>mesh((c,id)=>b.box(0,0,0,w,h,d,c,id),mat,x,y,z,parent);
 // Flat faces, twelve chamfered edges and eight corners retain the rounded
 // enamel silhouette while fine seams and pin-sized fittings use solid boxes.
 function round(w,h,d,x,y,z,mat,r=.12,parent=world){
  return mesh((c,id)=>{
   const r0=Math.max(0,Math.min(r,w/2-.001,h/2-.001,d/2-.001));
   if(r0<.022||Math.max(w,h,d)<.18){b.box(0,0,0,w,h,d,c,id);return;}
   const half=[w/2,h/2,d/2],inner=half.map(v=>v-r0);
   const face=(p,n)=>{for(let i=1;i<p.length-1;i++)b.tri(p[0],p[i],p[i+1],c,id,[n,n,n]);};
   const orient=(p,n)=>{const a=p[0],q=p[1],s=p[2],u=q.map((v,i)=>v-a[i]),v=s.map((t,i)=>t-a[i]);if((u[1]*v[2]-u[2]*v[1])*n[0]+(u[2]*v[0]-u[0]*v[2])*n[1]+(u[0]*v[1]-u[1]*v[0])*n[2]<0)p.reverse();face(p,n);};
   for(let a=0;a<3;a++)for(const sign of[-1,1]){const j=(a+1)%3,k=(a+2)%3,p=[];for(const [u,v]of[[-1,-1],[1,-1],[1,1],[-1,1]]){const q=[0,0,0];q[a]=sign*half[a];q[j]=u*inner[j];q[k]=v*inner[k];p.push(q);}const n=[0,0,0];n[a]=sign;orient(p,n);}
   for(let a=0;a<3;a++){const j=(a+1)%3,k=(a+2)%3;for(const sj of[-1,1])for(const sk of[-1,1]){const p=[];for(const [sa,edge]of[[-1,0],[1,0],[1,1],[-1,1]]){const q=[0,0,0];q[a]=sa*inner[a];q[j]=sj*(edge?inner[j]:half[j]);q[k]=sk*(edge?half[k]:inner[k]);p.push(q);}const n=[0,0,0];n[j]=sj/Math.SQRT2;n[k]=sk/Math.SQRT2;orient(p,n);}}
   for(const sx of[-1,1])for(const sy of[-1,1])for(const sz of[-1,1]){const signs=[sx,sy,sz],p=[];for(let a=0;a<3;a++)p.push(half.map((v,i)=>signs[i]*(i===a?v:inner[i])));orient(p,signs.map(v=>v/Math.sqrt(3)));}
  },mat,x,y,z,parent);
 }
 const cyl=(r,h,x,y,z,mat,parent=world,top=r,n=12)=>mesh((c,id)=>{const sides=Math.min(n,r<.08?6:r<.23?8:12);if(top===0){for(let i=0;i<sides;i++){const a=i*tau/sides,q=(i+1)*tau/sides;b.tri([0,h/2,0],[Math.sin(a)*r,-h/2,Math.cos(a)*r],[Math.sin(q)*r,-h/2,Math.cos(q)*r],c,id);}}else b.cylinder(0,0,0,r,top,h,c,id,sides);},mat,x,y,z,parent);
 const icoPoints=[[-1,(1+Math.sqrt(5))/2,0],[1,(1+Math.sqrt(5))/2,0],[-1,-(1+Math.sqrt(5))/2,0],[1,-(1+Math.sqrt(5))/2,0],[0,-1,(1+Math.sqrt(5))/2],[0,1,(1+Math.sqrt(5))/2],[0,-1,-(1+Math.sqrt(5))/2],[0,1,-(1+Math.sqrt(5))/2],[(1+Math.sqrt(5))/2,0,-1],[(1+Math.sqrt(5))/2,0,1],[-(1+Math.sqrt(5))/2,0,-1],[-(1+Math.sqrt(5))/2,0,1]].map(p=>{const l=Math.hypot(...p);return p.map(v=>v/l)});
 const icoFaces=[[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
 function sphere(r,x,y,z,mat,parent=world,sx=1,sy=1,sz=1){
  const o=mesh((c,id)=>{
   const emit=(a,q,s)=>b.tri(a.map(v=>v*r),q.map(v=>v*r),s.map(v=>v*r),c,id,[a,q,s]);
   if(r<.08||(id===8&&r<.3)){const top=[0,1,0],bottom=[0,-1,0],ring=[[1,0,0],[0,0,-1],[-1,0,0],[0,0,1]];for(let i=0;i<4;i++){emit(top,ring[i],ring[(i+1)%4]);emit(bottom,ring[(i+1)%4],ring[i]);}}
   else for(const f of icoFaces){const[a,q,s]=f.map(i=>icoPoints[i]);if(r>1.25){const mid=(u,v)=>{const p=u.map((n,i)=>n+v[i]),l=Math.hypot(...p);return p.map(n=>n/l)},aq=mid(a,q),qs=mid(q,s),sa=mid(s,a);emit(a,aq,sa);emit(q,qs,aq);emit(s,sa,qs);emit(aq,qs,sa);}else emit(a,q,s);}
  },mat,x,y,z,parent);o.scale.set(sx,sy,sz);return o;
 }
 // Slender rods meet other solid parts; buried end caps would add thousands
 // of unseen triangles. Larger exposed timbers keep both end faces.
 const beam=(a,q,r,c,id,sides=4,caps=r>=.07)=>{const d=q.map((v,i)=>v-a[i]),length=Math.hypot(...d);if(!length)return;const n=d.map(v=>v/length),up=Math.abs(n[1])>.95?[1,0,0]:[0,1,0],cross=(u,v)=>[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],u0=cross(n,up),ul=Math.hypot(...u0),u=u0.map(v=>v/ul),v=cross(n,u),normal=t=>u.map((k,i)=>k*Math.cos(t)+v[i]*Math.sin(t)),at=(p,t)=>p.map((k,i)=>k+normal(t)[i]*r);for(let i=0;i<sides;i++){const t=i*tau/sides,w=(i+1)*tau/sides,na=normal(t),nb=normal(w),pa=at(a,t),pb=at(q,t),pc=at(q,w),pd=at(a,w);b.tri(pa,pc,pb,c,id,[na,nb,na]);b.tri(pa,pd,pc,c,id,[na,nb,nb]);if(caps){b.tri(a,pd,pa,c,id,[n.map(k=>-k),n.map(k=>-k),n.map(k=>-k)]);b.tri(q,pb,pc,c,id,[n,n,n]);}}};
 const rod=(a,q,r,mat,parent=world)=>mesh((c,id)=>beam(a,q,r,c,id,r<.08?4:6),mat,0,0,0,parent);
 function torus(r,t,x,y,z,mat,parent=world){return mesh((c,id)=>{const segments=r>.2?16:12,sides=4;const p=(a,v)=>[(r+t*Math.cos(v))*Math.cos(a),(r+t*Math.cos(v))*Math.sin(a),t*Math.sin(v)],n=(a,v)=>[Math.cos(v)*Math.cos(a),Math.cos(v)*Math.sin(a),Math.sin(v)];for(let i=0;i<segments;i++)for(let j=0;j<sides;j++){const a=i*tau/segments,q=(i+1)*tau/segments,v=j*tau/sides,w=(j+1)*tau/sides;b.tri(p(a,v),p(q,v),p(q,w),c,id,[n(a,v),n(q,v),n(q,w)]);b.tri(p(a,v),p(q,w),p(a,w),c,id,[n(a,v),n(q,w),n(a,w)]);}},mat,x,y,z,parent);}
 function slab(w,d,h,r,x,y,z,mat){return mesh((c,id)=>{const outline=[];for(let corner=0;corner<4;corner++){const a=corner*pi/2,cx=(corner===0||corner===3?1:-1)*(w/2-r),cz=(corner<2?1:-1)*(d/2-r);for(let k=0;k<=4;k++){const t=a+k*pi/8;outline.push([cx+Math.cos(t)*r,cz+Math.sin(t)*r]);}}for(let i=0;i<outline.length;i++){const a=outline[i],q=outline[(i+1)%outline.length];b.tri([0,h,0],[q[0],h,q[1]],[a[0],h,a[1]],c,id);b.tri([0,0,0],[a[0],0,a[1]],[q[0],0,q[1]],c,id);b.quad([a[0],0,a[1]],[a[0],h,a[1]],[q[0],h,q[1]],[q[0],0,q[1]],c,id);}},mat,x,y,z);}
 const glyphs={A:['01110','10001','10001','11111','10001','10001','10001'],B:['11110','10001','10001','11110','10001','10001','11110'],C:['01111','10000','10000','10000','10000','10000','01111'],D:['11110','10001','10001','10001','10001','10001','11110'],E:['11111','10000','10000','11110','10000','10000','11111'],F:['11111','10000','10000','11110','10000','10000','10000'],G:['01111','10000','10000','10111','10001','10001','01111'],H:['10001','10001','10001','11111','10001','10001','10001'],I:['111','010','010','010','010','010','111'],J:['00111','00010','00010','00010','10010','10010','01100'],K:['10001','10010','10100','11000','10100','10010','10001'],L:['10000','10000','10000','10000','10000','10000','11111'],M:['10001','11011','10101','10101','10001','10001','10001'],N:['10001','11001','11001','10101','10011','10011','10001'],O:['01110','10001','10001','10001','10001','10001','01110'],P:['11110','10001','10001','11110','10000','10000','10000'],Q:['01110','10001','10001','10001','10101','10010','01101'],R:['11110','10001','10001','11110','10100','10010','10001'],S:['01111','10000','10000','01110','00001','00001','11110'],T:['11111','00100','00100','00100','00100','00100','00100'],U:['10001','10001','10001','10001','10001','10001','01110'],V:['10001','10001','10001','10001','10001','01010','00100'],W:['10001','10001','10001','10101','10101','10101','01010'],X:['10001','10001','01010','00100','01010','10001','10001'],Y:['10001','10001','01010','00100','00100','00100','00100'],Z:['11111','00001','00010','00100','01000','10000','11111'],'-':['000','000','000','111','000','000','000'],'/':['00001','00001','00010','00100','01000','10000','10000'],'·':['0','0','0','1','0','0','0']};
 function label(lines,w,h,x,y,z,{bg='#344d49',fg='#edddae',border=true}={},parent=world){
  return mesh(()=>{b.quad([-w/2,-h/2,0],[w/2,-h/2,0],[w/2,h/2,0],[-w/2,h/2,0],bg,23);if(border){for(const sy of[-1,1])b.box(0,sy*(h/2-.035),.004,w-.08,.012,.006,fg,23);for(const sx of[-1,1])b.box(sx*(w/2-.035),0,.004,.012,h-.08,.006,fg,23);}
   const rows=(Array.isArray(lines)?lines:[lines]).map(s=>s.toUpperCase());rows.forEach((line,j)=>{const width=[...line].reduce((n,ch)=>n+(glyphs[ch]?.[0].length||3)+1,0)-1,s=Math.min((w-.15)/width,(h-.11)/(rows.length*9)),top=(rows.length-1)*4.5*s-j*9*s+3.5*s;let xx=-width*s/2;for(const ch of line){const glyph=glyphs[ch];if(glyph)for(let row=0;row<7;row++){let col=0;while(col<glyph[row].length){if(glyph[row][col]!=='1'){col++;continue;}const start=col;while(glyph[row][col]==='1')col++;const left=xx+start*s,right=xx+col*s,yy=top-row*s;b.quad([left,yy-s,.007],[right,yy-s,.007],[right,yy,.007],[left,yy,.007],fg,23);}}xx+=((glyph?.[0].length||3)+1)*s;}});
  },materials.ivory,x,y,z,parent);
 }
 function curve(points){return{getPoint(t){const f=Math.min(1,Math.max(0,t))*(points.length-1),i=Math.min(points.length-2,Math.floor(f)),u=f-i,a=points[Math.max(0,i-1)],q=points[i],s=points[i+1],v=points[Math.min(points.length-1,i+2)];return point(...['x','y','z'].map(k=>.5*(2*q[k]+(-a[k]+s[k])*u+(2*a[k]-5*q[k]+4*s[k]-v[k])*u*u+(-a[k]+3*q[k]-3*s[k]+v[k])*u*u*u)))}};}
 const tube=(line,segments,r)=>((c,id)=>{for(let i=0;i<segments;i++)beam(line.getPoint(i/segments).toArray(),line.getPoint((i+1)/segments).toArray(),r,c,id,4,false);});
 const coneSector=(r,h,start,span)=>((c,id)=>{b.tri([0,h/2,0],[Math.sin(start)*r,-h/2,Math.cos(start)*r],[Math.sin(start+span)*r,-h/2,Math.cos(start+span)*r],c,id);});
 // Modeled emissive bulbs use the host lighting and normal mesh lifecycle.
 // AUTHORED_SCENE_BEGIN
 // Turned timber foundation with fine painted edge and inset brass maker's plate.
 if(!landscape){slab(30,29,1.05,2,0,-1.18,0,materials.wood);slab(30.12,29.12,.18,2.05,0,-.22,0,m('#b6a489'));}else slab(29.9,28.9,.21,2.05,0,-.25,0,m('#777660'));slab(29.9,28.9,.34,2.05,0,-.04,0,groundMat);slab(29.6,28.6,.08,2.05,0,.28,0,groundMat);
 if(!landscape){label(['MOONLIGHT  /  AFTER DARK'],7.5,.36,0,-.61,14.54,{bg:'#817354',fg:'#ead7a9',size:47,border:false});for(let x of [-3.88,3.88]){let o=sphere(.035,x,-.61,14.56,materials.metal);o.scale.z=.3}}
 // Gently raised perimeter turf banks and an irregular cut-stone retaining edge.
 for(let i=0;i<48;i++){let a=i/48*Math.PI*2;let x=Math.cos(a)*14.1,z=Math.sin(a)*13.6;let r=range(.55,1);sphere(r,x,.28,z,groundMat,world,1.4,.40,1.1)}
 slab(21,21.7,.06,3.2,0,.38,-.3,lotMat);
 // Acurved entry road flares around the booth, with individual little curb stones.
 round(6,.06,4.8,-1,.42,12,roadMat,.028);
 for(let side of [-1,1])for(let z=-11;z<=10;z+=.66){round(.24,.17,.52,side*10.7,.48,z,m(rnd()>.5?'#c7c0a7':'#aaa88f'),.055)}
 // Timber screen structure, double posts, bolted braces and a gently weathered surround.
 const sz=-10.1,screenY=8.1,screenW=12.6,screenH=9.45;
 for(let x of [-6.3,6.3]){round(.33,12,.38,x,6.35,sz-.33,materials.wood,.035);round(.4,.22,.58,x,12.39,sz-.33,materials.wood,.04);rod([x,.38,sz-3.3],[x,10,sz-.35],.105,materials.wood);rod([x,.4,sz+1.9],[x,6.3,sz-.35],.1,materials.wood);for(let y of [3.2,6.2,9.2,11.9]){let o=sphere(.065,x,y,sz+.045,materials.metal);o.scale.z=.32}}
 for(let y of [4.4,8,11.5])box(13,.15,.2,0,y,sz-.5,materials.wood);
 round(13.6,10.2,.35,0,screenY,sz,materials.ivory,.14);round(13.02,9.76,.14,0,screenY,sz+.21,m('#4a5047'),.06);
 mesh(()=>b.quad([-screenW/2,-screenH/2,0],[screenW/2,-screenH/2,0],[screenW/2,screenH/2,0],[-screenW/2,screenH/2,0],'#fff6dd',83,[0,0,1],[[0,0],[1,0],[1,1],[0,1]]),materials.ivory,0,screenY,sz+.295);
 // Painted boards and tiny festoon bulbs frame the moving picture.
 for(let y of [3.09,13.1])round(13.7,.15,.46,0,y,sz+.04,materials.ivory,.05);for(let x of [-6.76,6.76])round(.15,10.1,.46,x,8.1,sz+.04,materials.ivory,.05);
 label('M O O N L I G H T',7.3,.63,0,2.65,sz+.25,{bg:'#49675f',fg:'#eddbad',size:67});for(let x=-6.55;x<=6.55;x+=.53){sphere(.052,x,13.08,sz+.26,bulbMat);}
 // Enamel cars and hand-painted spectators share a small material palette.
 const convertibles=[];let population=0;
 const detailPalette=new Map();function paintMat(color,rough=.67,metal=.05){const key=color+rough+metal;if(!detailPalette.has(key))detailPalette.set(key,m(color,rough,metal));return detailPalette.get(key)}
 const carPalette=['#7fa69b','#b86551','#e2c89e','#608d9b','#b3ae9d','#9cae7e','#d0a165','#657d78'];
 const skins=['#d2ad87','#ae7a54','#e1bf9a','#86583b','#c0926b','#634838'],shirts=['#c2a063','#759995','#ac6c55','#d6c29a','#717e96','#8f9a69'];
 const upholstery=paintMat('#ae5748',.88),piping=paintMat('#dccbab',.8),hairColors=['#3e3028','#5d412c','#99846a','#bb9858','#202b2b'];
 function popcorn(x,y,z,parent=world,scale=1){const g=group();g.position.set(x,y,z);g.scale.setScalar(scale);parent.add(g);round(.16,.22,.14,0,.11,0,materials.cream,.018,g);for(let i=0;i<3;i++){box(.022,.19,.007,-.053+i*.053,.11,.074,materials.red,g);box(.007,.19,.022,.084,.11,-.04+i*.04,materials.red,g)}for(let k=0;k<11;k++)sphere(.025,range(-.065,.065),range(.216,.25),range(-.05,.05),piping,g,1,.8,1);return g}
 function drink(x,y,z,parent=world,scale=1){const g=group();g.position.set(x,y,z);g.scale.setScalar(scale);parent.add(g);cyl(.049,.14,0,.07,0,materials.cream,g,.061,12);cyl(.066,.014,0,.145,0,materials.red,g,.066,12);rod([.01,.15,0],[.02,.245,-.012],.008,materials.cream,g);return g}
 function person(x,y,z,color,rot=0,sitting=false,opts={},parent=world){population++;const g=group();g.position.set(x,y,z);g.rotation.y=rot;g.scale.setScalar(opts.scale||1);parent.add(g);
  const shade=opts.variant||0,skin=paintMat(skins[shade%skins.length]),shirt=paintMat(color),trousers=paintMat(shade%2?'#586366':'#544f45'),hair=paintMat(hairColors[shade%5]),shoe=paintMat('#473c31');
  const hip=sitting?.055:.40,shoulder=hip+.33,neck=shoulder+.105;
  round(.24,.18,.18,0,hip,0,trousers,.068,g);round(.30,.32,.205,0,hip+.22,0,shirt,.086,g);
  for(let side of [-1,1]){if(sitting){rod([side*.074,hip,.01],[side*.095,hip-.01,-.23],.058,trousers,g);rod([side*.095,hip-.01,-.23],[side*.096,hip-.22,-.25],.047,trousers,g);round(.103,.075,.18,side*.096,hip-.245,-.28,shoe,.03,g)}else{rod([side*.075,hip-.04,0],[side*.095,.095,side*.023],.055,trousers,g);round(.12,.09,.20,side*.095,.055,-.04+side*.02,shoe,.036,g)}}
  cyl(.048,.10,0,neck-.028,0,skin,g);for(let side of [-1,1]){const collar=round(.085,.023,.09,side*.068,shoulder+.045,-.09,piping,.009,g);collar.rotation.z=side*.23}
  for(let j=0;j<3;j++)sphere(.009,0,hip+.15+j*.07,-.108,piping,g);if(shade%3===0)round(.072,.078,.015,-.09,hip+.245,-.11,piping,.008,g);
  const head=group();head.position.set(0,neck+.092,0);g.add(head);sphere(.118,0,0,0,skin,head,.85,1.08,.9);sphere(.027,0,-.005,-.104,skin,head,.7,.8,1);for(let side of [-1,1]){sphere(.022,side*.102,-.005,0,skin,head,.6,.9,.6);sphere(.012,side*.042,.020,-.099,materials.dark,head,.65,.65,.4);rod([side*.023,.046,-.099],[side*.062,.043,-.099],.007,hair,head)}
  sphere(.119,0,.064,.013,hair,head,.9,.66,.87);if(shade%3===1){sphere(.066,0,-.003,.101,hair,head,.9,1,.7);for(let side of [-1,1])sphere(.06,side*.09,.012,.026,hair,head,.37,1,.55)}else if(shade%3===2){sphere(.055,-.07,.076,-.064,hair,head,1,.55,.8)}
  rod([-.025,-.056,-.094],[.025,-.052,-.094],.005,paintMat('#a86d57'),head);
  if(opts.hat){cyl(.158,.023,0,.119,0,piping,head,.158,20);sphere(.104,0,.149,0,piping,head,1,.5,.9);cyl(.104,.018,0,.139,0,shirt,head,.104,16)}
  if(opts.animate)rnd(); // Preserve the authored pose sequence without a frame loop.
  for(let side of [-1,1]){const reach=side===1&&opts.prop;let elbow=[side*.22,shoulder-.14,reach?-.14:-.055],hand=[side*.16,hip+.07,reach?-.30:-.19];rod([side*.153,shoulder-.025,0],elbow,.052,shirt,g);rod(elbow,hand,.04,skin,g);sphere(.047,...hand,skin,g,.75,.85,.72);if(reach){if(opts.prop==='popcorn')popcorn(hand[0]-.03,hand[1]-.06,hand[2],g,.9);else drink(hand[0],hand[1]-.035,hand[2],g,.9)}}
  return g;
 }
 function car(x,z,color,angle=0,convertible=false,variant=0){const g=group();g.position.set(x,.45,z);g.rotation.y=angle;world.add(g);const paint=paintMat(color,.29,.2),chrome=materials.metal,trim=variant%2?materials.cream:piping;
  // A real open cockpit: floor and separate curved sill bodies leave the seats exposed.
  round(1.48,.32,3.12,0,.44,0,paint,.15,g);round(1.19,.14,1.57,0,.61,.09,materials.dark,.06,g);
  for(let side of [-1,1]){round(.22,.30,2.87,side*.626,.65,.04,paint,.10,g);sphere(.24,side*.57,.65,-1.09,paint,g,.84,.68,1.5);sphere(.225,side*.59,.67,1.10,paint,g,.79,.68,1.48);round(.055,.12,2.64,side*.749,.54,0,trim,.025,g);rod([side*.756,.61,-1.30],[side*.756,.61,1.30],.017,chrome,g);rod([side*.696,.81,-.58],[side*.696,.81,.71],.012,chrome,g);round(.09,.025,.15,side*.755,.74,.07,chrome,.01,g)}
  round(1.19,.20,1.0,0,.75,-1.04,paint,.094,g);round(1.20,.22,.68,0,.77,1.18,paint,.10,g);rod([0,.858,-1.44],[0,.86,-.65],.011,chrome,g);
  for(let side of [-1,1]){let fin=round(.09,.30,.65,side*.622,.85,1.04,paint,.04,g);fin.rotation.x=.12;rod([side*.621,.996,.79],[side*.621,1.02,1.28],.014,chrome,g)}
  round(1.12,.15,.18,0,.83,-.54,paint,.04,g);round(1.02,.075,.13,0,.92,-.51,materials.dark,.027,g);
  for(let xg of [-.39,-.24]){let dial=cyl(.050,.016,xg,.883,-.421,piping,g,.05,16);dial.rotation.x=Math.PI/2;rod([xg,.884,-.408],[xg+.020,.901,-.407],.004,materials.dark,g)}
  for(let k=0;k<3;k++)sphere(.013,.02+k*.065,.883,-.416,chrome,g);round(.24,.043,.018,.24,.886,-.416,materials.dark,.012,g);
  const steering=torus(.135,.018,-.33,.99,-.31,chrome,g);steering.rotation.x=-.58;rod([-.33,.75,-.46],[-.33,.99,-.31],.021,chrome,g);for(let k=0;k<3;k++){let a=k/3*6.28;rod([-.33,.99,-.31],[-.33+Math.cos(a)*.12,.99+Math.sin(a)*.10,-.31-Math.sin(a)*.065],.010,chrome,g)}
  const seatMat=variant%2?paintMat('#b97558',.88):upholstery;
  for(let side of [-1,1]){round(.43,.13,.46,side*.29,.708,.075,seatMat,.06,g);let back=round(.44,.39,.13,side*.29,.902,.31,seatMat,.058,g);back.rotation.x=.12;for(let k=0;k<5;k++)rod([side*.29-.16+k*.08,.78,.228],[side*.29-.16+k*.08,1.04,.26],.008,piping,g);round(.49,.035,.48,side*.29,.660,.075,piping,.017,g)}
  round(1.04,.32,.15,0,.84,.75,seatMat,.065,g);round(1.0,.11,.3,0,.68,.61,seatMat,.045,g);
  if(convertible){const wind=round(1.10,.44,.037,0,1.055,-.48,materials.glass,.015,g);wind.rotation.x=-.29;for(let side of [-1,1])rod([side*.56,.845,-.55],[side*.50,1.27,-.421],.022,chrome,g);rod([-.50,1.27,-.421],[.50,1.27,-.421],.022,chrome,g);rod([0,.855,-.55],[0,1.265,-.421],.012,chrome,g);
   for(let k=0;k<4;k++)round(1.05-k*.02,.055,.115,0,.85+k*.024,.86+k*.045,paintMat('#807464',.98),.026,g);
   for(let side of [-1,1]){rod([side*.48,.70,.57],[side*.48,.91,.94],.018,chrome,g);rod([side*.48,.91,.94],[side*.44,.79,1.13],.018,chrome,g)}
   const a=person(-.28,.73,.07,shirts[variant%6],0,true,{variant,animate:variant<6,hat:variant%4===0},g);
   if(variant!==6)person(.29,.73,.085,shirts[(variant+2)%6],-.065,true,{variant:variant+2,animate:variant<4,prop:variant%2?'drink':'popcorn'},g);
   if(variant%3===0)popcorn(.0,.70,.56,g,1.2);else drink(.0,.70,.40,g);
   convertibles.push(g);
  }else{round(1.09,.47,1.34,0,1.055,.08,materials.glass,.17,g);round(1.10,.13,1.08,0,1.331,.13,variant%2?materials.cream:paint,.06,g);for(let side of [-1,1]){rod([side*.55,.835,-.64],[side*.46,1.295,-.37],.026,chrome,g);rod([side*.55,.84,.72],[side*.47,1.29,.61],.029,paint,g);rod([side*.55,.84,.17],[side*.51,1.30,.17],.023,paint,g)}}
  for(let side of [-1,1])for(let zz of [-1.03,1.02]){const tire=cyl(.322,.185,side*.72,.33,zz,materials.rubber,g,.322,24);tire.rotation.z=Math.PI/2;const white=cyl(.244,.196,side*.72,.33,zz,piping,g,.244,24);white.rotation.z=Math.PI/2;const hub=cyl(.148,.209,side*.72,.33,zz,chrome,g,.148,20);hub.rotation.z=Math.PI/2;const cap=sphere(.109,side*.83,.33,zz,chrome,g,.28,1,1);for(let k=0;k<7;k++){let a=k/7*6.28;sphere(.017,side*.833,.33+Math.sin(a)*.185,zz+Math.cos(a)*.185,materials.dark,g,.3,1,1)}}
  round(1.51,.13,.16,0,.39,-1.56,chrome,.055,g);round(1.51,.12,.15,0,.39,1.56,chrome,.05,g);round(.76,.23,.044,0,.605,-1.552,materials.dark,.018,g);for(let k=0;k<10;k++)rod([-.34+k*.075,.53,-1.583],[-.34+k*.075,.70,-1.583],.010,chrome,g);
  for(let side of [-1,1]){const light=cyl(.13,.035,side*.55,.675,-1.494,materials.cream,g,.13,24);light.rotation.x=Math.PI/2;torus(.133,.024,side*.55,.675,-1.52,chrome,g);round(.11,.14,.05,side*.61,.88,1.44,redGlow,.034,g);round(.13,.11,.045,side*.45,.48,-1.53,materials.ochre,.035,g)}
  round(.27,.12,.023,0,.42,1.65,materials.cream,.005,g);for(let j=0;j<4;j++)box(.027,.043,.003,-.075+j*.05,.42,1.665,materials.steel,g);rod([.42,.33,1.4],[.42,.30,1.68],.034,chrome,g);
  rod([-.60,.81,-.55],[-.84,.93,-.52],.018,chrome,g);sphere(.075,-.84,.95,-.52,chrome,g,1,.4,.8);rod([.57,.85,-1.10],[.62,1.70,-1.14],.009,chrome,g);sphere(.019,.62,1.70,-1.14,chrome,g);
  return g;
 }
 const parkingLine=m('#c9c5a5');
 for(let row=0;row<3;row++){let z=-3.3+row*4.25;for(let col=0;col<5;col++){let x=(col-2)*3.8,zz=z+.048*x*x,angle=-x*.035;const bay=group();bay.position.set(x,.45,zz);bay.rotation.y=angle;world.add(bay);for(let side of [-1,1])round(.04,.008,3.5,side*1.32,.008,0,parkingLine,.003,bay);
  if((row===0&&col===4)||(row===2&&col===2))continue;
  const openTop=(row===0||row===1&&col!==3||row===2&&col===1);car(x+range(-.09,.09),zz+range(-.15,.15),carPalette[(row*3+col)%8],angle+range(-.035,.035),openTop,row*5+col);
  let poleX=x+1.50,poleZ=zz-.6;round(.30,.10,.30,poleX,.52,poleZ,materials.ivory,.03);cyl(.034,.94,poleX,1.01,poleZ,materials.steel);round(.22,.34,.18,poleX,1.55,poleZ,materials.steel,.055);for(let j=0;j<4;j++)box(.14,.014,.008,poleX,1.5+j*.043,poleZ+.095,materials.dark);
  const cord=curve([[poleX,1.65,poleZ],[poleX-.13,1.22,poleZ+.13],[x+.84,1.40,zz-.5]].map(p=>point(...p)));mesh(tube(cord,16,.012,4,false),materials.rubber);
 }}
 // Weatherboard projection house with tiled roof, access stair and real reels.
 const booth=group();booth.position.set(-.6,0,10.9);world.add(booth);round(3.2,.23,2.8,0,.55,0,materials.ivory,.08,booth);round(2.95,2.20,2.45,0,1.65,0,m('#577669'),.06,booth);
 for(let y=.73;y<2.7;y+=.16){box(3,.05,.065,0,y,1.25,m('#789586'),booth);box(.065,.05,2.46,1.5,y,0,m('#638073'),booth);box(3,.05,.065,0,y,-1.25,m('#678778'),booth)}
 round(3.45,.20,2.95,0,2.84,0,m('#657065'),.08,booth);for(let x=-1.6;x<1.7;x+=.18)box(.035,.065,2.86,x,2.98,0,materials.steel,booth);
 round(.74,1.6,.08,.65,1.35,1.27,materials.wood,.03,booth);sphere(.035,.86,1.37,1.32,materials.metal,booth);for(let i=0;i<3;i++)round(1.02,.15,.40,.65,.32+i*.15,2.01-i*.3,materials.wood,.03,booth);
 round(1.0,.73,.1,-.60,1.78,1.28,materials.ivory,.04,booth);box(.83,.58,.11,-.60,1.78,1.3,windowMat,booth);box(.045,.62,.08,-.60,1.78,1.39,materials.wood,booth);box(.88,.045,.08,-.60,1.78,1.39,materials.wood,booth);box(2.68,.52,.03,-.6,2.48,12.19,materials.ivory);mesh(()=>b.quad([-1.3,-.24,0],[1.3,-.24,0],[1.3,.24,0],[-1.3,.24,0],'#ffffff',85,[0,0,1],[[0,0],[1,0],[1,1],[0,1]]),materials.ivory,-.6,2.48,12.208);
 const projector=group();projector.position.set(-.6,3.06,10.55);world.add(projector);round(.75,.65,1.1,0,.42,0,materials.steel,.1,projector);round(.84,.12,1.3,0,.08,0,materials.dark,.04,projector);for(let k=0;k<5;k++)box(.025,.28,.3,.384,.42,-.1+k*.085,materials.dark,projector);const lens=cyl(.18,.4,0,.46,-.73,materials.metal,projector,.22,24);lens.rotation.x=Math.PI/2;const lensGlass=cyl(.157,.03,0,.46,-.952,bulbMat,projector,.157,24);lensGlass.rotation.x=Math.PI/2;
 for(let z of [-.38,.54]){rod([0,.55,z],[0,1.28,z],.05,materials.steel,projector);let reel=group();reel.position.set(0,1.27,z);projector.add(reel);for(let side of [-1,1]){let ring=torus(.39,.029,side*.065,0,0,materials.metal,reel);ring.rotation.y=Math.PI/2;for(let k=0;k<6;k++){let a=k/6*Math.PI*2;rod([side*.065,0,0],[side*.065,Math.sin(a)*.36,Math.cos(a)*.36],.026,materials.metal,reel)}}let center=cyl(.1,.19,0,0,0,materials.metal,reel);center.rotation.z=Math.PI/2;}
 // A little enamel diner. Corrugated roof, awning, warm windows, brick chimney and stools.
 const diner=group();diner.position.set(10.8,0,9.8);diner.rotation.y=-.27;world.add(diner);round(4.55,.2,3.4,0,.54,0,materials.ivory,.08,diner);round(4.0,2.05,2.75,0,1.64,0,m('#ddd0ab'),.12,diner);for(let y=.80;y<2.58;y+=.20)box(4.02,.03,.025,0,y,1.385,materials.ochre,diner);round(4.38,.25,3.18,0,2.76,0,m('#974c3d'),.09,diner);for(let x=-2;x<2.2;x+=.20)box(.035,.06,3.1,x,2.91,0,materials.red,diner);
 round(3.3,1.03,.07,0,1.70,1.43,materials.red,.04,diner);box(3.11,.85,.1,0,1.70,1.46,windowMat,diner);for(let x of [-1.05,0,1.05])box(.055,.89,.08,x,1.7,1.53,materials.wood,diner);round(3.8,.13,.65,0,1.15,1.65,materials.red,.05,diner);for(let i=0;i<12;i++){let awning=box(.32,.055,1,-1.77+i*.32,2.44,1.68,i%2?materials.cream:materials.red,diner);awning.rotation.x=.18;round(.32,.20,.10,-1.77+i*.32,2.23,2.17,i%2?materials.cream:materials.red,.04,diner)}
 label(['THE LUNAR DINER','HOT POPCORN  ·  COLD SODA'],4,.82,0,3.37,.2,{bg:'#496b61',fg:'#f2dbae',size:68},diner);rod([-1.5,2.8,0],[-1.5,3.5,0],.045,materials.steel,diner);rod([1.5,2.8,0],[1.5,3.5,0],.045,materials.steel,diner);
 for(let x of [-1.35,-.45,.45,1.35]){cyl(.20,.08,x,.55,2.16,materials.steel,diner);cyl(.045,.45,x,.80,2.16,materials.metal,diner);cyl(.23,.13,x,1.06,2.16,materials.red,diner)}for(let x of [-1.2,-.2,.7]){cyl(.055,.19,x,1.33,1.66,materials.cream,diner);rod([x,1.35,1.66],[x+.015,1.50,1.66],.009,materials.red,diner)}
 round(.60,1.18,.58,1.35,3.1,-.7,m('#a27b58'),.05,diner);for(let y=2.65;y<3.6;y+=.18)box(.61,.024,.59,1.35,y,-.7,materials.ivory,diner);
 // Picnic nook. Tiny painted benches and striped parasols.
 function picnic(x,z,rot){const g=group();g.position.set(x,.4,z);g.rotation.y=rot;world.add(g);for(let j=0;j<4;j++)round(.22,.1,1.8,-.36+j*.24,.82,0,materials.wood,.03,g);for(let side of [-1,1]){for(let j=0;j<2;j++)round(.19,.09,1.9,side*.70+j*.20,.48,0,materials.wood,.025,g);rod([side*.9,.15,-.63],[side*.28,.8,-.63],.043,materials.wood,g);rod([side*.9,.15,.63],[side*.28,.8,.63],.043,materials.wood,g)}cyl(.026,2.45,0,1.24,0,materials.cream,g);for(let k=0;k<12;k++){const geom=coneSector(1.14,.40,k/12*Math.PI*2,Math.PI*2/12);mesh(geom,k%2?materials.cream:materials.red,0,2.46,0,g)}sphere(.07,0,2.72,0,materials.cream,g);cyl(.08,.14,.26,.95,.32,materials.cream,g);round(.23,.05,.19,-.18,.91,.18,materials.ivory,.02,g)}picnic(-11.2,7.8,-.28);picnic(-11.1,11.0,.23);
 // The authored crowd remains in quiet, static poses in the shared room mesh.
 person(8.9,.46,12.3,'#b2865e',-.6,false,{variant:2,animate:true,prop:'popcorn'});
 person(9.6,.46,12.4,'#587b76',.5,false,{variant:4,animate:true,prop:'drink'});
 person(-10.7,.46,10.3,'#c7a879',2.4,false,{variant:3,hat:true});
 person(8.45,.46,12.52,'#b46e53',-.5,false,{variant:1,scale:.68,prop:'drink'});
 person(-1.82,.46,12.36,'#779189',.8,false,{variant:5,animate:true,hat:true});
 const blanketMat=paintMat('#c6ba91',.95);
 function blanket(w,d,x,y,z,parent=world,rot=0){const g=group();g.position.set(x,y,z);g.rotation.y=rot;parent.add(g);round(w,.025,d,0,0,0,blanketMat,.01,g);const stripe=paintMat('#8e6753',.95);for(let xx=-w/2+.08;xx<w/2;xx+=.21)box(.04,.004,d-.025,xx,.017,0,stripe,g);for(let zz=-d/2+.08;zz<d/2;zz+=.23)box(w-.025,.005,.036,0,.021,zz,stripe,g);for(let xx=-w/2+.035;xx<w/2;xx+=.065){rod([xx,0,d/2],[xx,.002,d/2+.07],.006,piping,g);rod([xx,0,-d/2],[xx,.002,-d/2-.07],.006,piping,g)}return g}
 function cooler(x,y,z,parent=world,rot=0){const g=group();g.position.set(x,y,z);g.rotation.y=rot;parent.add(g);round(.54,.31,.36,0,.16,0,paintMat('#a05b49',.56),.055,g);round(.56,.065,.39,0,.345,0,materials.cream,.025,g);round(.12,.045,.032,0,.25,.197,materials.metal,.01,g);for(let side of [-1,1]){rod([side*.29,.20,-.08],[side*.32,.20,-.08],.012,materials.metal,g);rod([side*.32,.20,-.08],[side*.32,.20,.08],.012,materials.metal,g)}return g}
 function radio(x,y,z,parent=world){const g=group();g.position.set(x,y,z);parent.add(g);round(.36,.24,.12,0,.14,0,paintMat('#99674d'),.034,g);round(.19,.15,.022,-.049,.145,-.071,materials.ochre,.021,g);for(let j=0;j<5;j++)box(.15,.009,.005,-.049,.09+j*.027,-.086,materials.dark,g);for(let yy of [.09,.205]){const k=cyl(.022,.01,.111,yy,-.071,materials.cream,g,.022,12);k.rotation.x=Math.PI/2}rod([-.12,.26,0],[-.20,.59,0],.008,materials.metal,g);rod([-.12,.28,0],[-.12,.34,0],.013,materials.wood,g);rod([-.12,.34,0],[.10,.34,0],.013,materials.wood,g);rod([.10,.34,0],[.10,.28,0],.013,materials.wood,g);return g}
 function chair(x,z,angle,color){const g=group();g.position.set(x,.46,z);g.rotation.y=angle;world.add(g);const canvas=paintMat(color,.94);round(.48,.035,.40,0,.35,0,canvas,.012,g);const back=round(.48,.49,.04,0,.58,.19,canvas,.018,g);back.rotation.x=-.13;for(let side of [-1,1]){rod([side*.27,.04,-.24],[side*.27,.64,.17],.018,materials.metal,g);rod([side*.27,.04,.28],[side*.27,.44,-.19],.018,materials.metal,g);rod([side*.27,.37,.17],[side*.27,.91,.24],.018,materials.metal,g);round(.078,.028,.42,side*.285,.53,0,materials.wood,.012,g)}return g}
 // The unused front-right bay becomes a quiet picnic spot, facing the picture.
 blanket(2.4,2.3,7.5,.472,-.12,world,-.15);const c1=chair(6.78,-.15,.05,'#718a78'),c2=chair(7.65,-.03,-.07,'#bd9668');
 person(0,.39,.05,shirts[1],0,true,{variant:4,animate:true,prop:'drink'},c1);
 person(0,.39,.05,shirts[2],0,true,{variant:2,animate:true,prop:'popcorn'},c2);
 cooler(8.25,.49,.76,world,.1);radio(6.62,.49,.72);popcorn(7.18,.49,.86,world,1.2);drink(7.65,.49,.85);person(7.42,.51,-1.0,shirts[3],-.16,true,{variant:3,scale:.65});
 // A rolled blanket in a back seat, a little tray, and supplies at the projection house.
 blanket(.87,.57,0,.82,.66,convertibles[3],.06);
 const tray=round(.47,.035,.32,-.93,1.13,-.24,materials.metal,.015,convertibles[1]);rod([-.72,.94,-.24],[-.93,1.12,-.24],.018,materials.metal,convertibles[1]);drink(-1.02,1.16,-.25,convertibles[1],.85);popcorn(-.83,1.15,-.25,convertibles[1],.7);
 cooler(-2.88,.43,11.9,world,.2);round(.64,.34,.41,-2.61,.58,10.75,materials.wood,.04);for(let k=0;k<4;k++)box(.57,.013,.012,-2.61,.49+k*.065,10.963,materials.ochre);radio(-2.58,.77,10.75);
 for(let i=0;i<3;i++){const tin=cyl(.29,.06,-2.62,.47+i*.065,12.7,materials.steel,world,.29,24);const rim=torus(.25,.013,-2.62,.51+i*.065,12.7,materials.metal);rim.rotation.x=Math.PI/2}
 const bike=group();bike.position.set(-2.7,.47,9.10);bike.rotation.y=.35;bike.rotation.z=-.10;world.add(bike);for(let z of [-.4,.4]){let wheel=torus(.26,.021,0,.28,z,materials.rubber,bike);wheel.rotation.y=Math.PI/2;let rim=torus(.232,.010,0,.28,z,materials.metal,bike);rim.rotation.y=Math.PI/2;for(let k=0;k<8;k++){let a=k/8*6.28;rod([0,.28,z],[0,.28+Math.cos(a)*.23,z+Math.sin(a)*.23],.004,materials.metal,bike)}}for(let ab of [[[0,.28,.4],[0,.62,.13]],[[0,.62,.13],[0,.28,0]],[[0,.28,0],[0,.28,.4]],[[0,.62,.13],[0,.62,-.28]],[[0,.62,-.28],[0,.28,0]],[[0,.62,-.28],[0,.28,-.4]]])rod(...ab,.018,materials.red,bike);round(.17,.038,.13,0,.66,.12,materials.wood,.018,bike);rod([0,.58,-.3],[0,.80,-.33],.013,materials.metal,bike);rod([-.16,.8,-.33],[.16,.8,-.33],.013,materials.metal,bike);
 // Flat ticket stubs, salt shakers and a tray on the picnic tables.
 for(let z of [7.8,11.0]){popcorn(-11.5,1.28,z,world,.9);drink(-10.9,1.28,z+.2);round(.19,.005,.09,-11.2,1.29,z-.35,piping,.002)}
 // Sculptural tree armatures under flocked canopies, with flecks and branch tips.
 const leafMats=['#59725b','#647e62','#708564','#536e57','#80926b'].map(color=>({color,mat:8}));
 function tree(x,z,height=4,variant=0){const g=group();g.position.set(x,.32,z);world.add(g);const trunk=m('#75644c');cyl(.12,height*.52,0,height*.26,0,trunk,g,.075,9);let crownY=height*.68;for(let i=0;i<6;i++){let a=i/6*Math.PI*2+.3,rr=range(.35,.8);let end=[Math.cos(a)*rr,crownY+range(-.35,.48),Math.sin(a)*rr];rod([0,height*.37,0],end,.057,trunk,g);let r=height*range(.18,.28);sphere(r,end[0],end[1],end[2],leafMats[(variant+i)%leafMats.length],g,1,range(.75,1.2),1);for(let k=0;k<8;k++)sphere(r*.20,end[0]+range(-r*.88,r*.88),end[1]+range(-r*.6,r*.85),end[2]+range(-r*.88,r*.88),leafMats[(variant+i+k)%leafMats.length],g)}sphere(height*.27,0,height*.88,0,leafMats[variant%5],g,.9,1,.9)}
 for(let i=0;i<7;i++){tree(-13.05+range(-.25,.25),-11+i*2.35,range(3.0,4.8),i);tree(13.0+range(-.3,.3),-11.2+i*2.25,range(2.8,4.3),i+2)}for(let x of [-9.8,-7.8,8.7,10.8])tree(x,-12.8,range(3.2,4.7),2);
 // The original grass tufts join the static mesh; their buried caps are omitted.
 for(let i=0;i<1100;i++){const side=rnd()>.5?1:-1,x=side*range(11.0,14.2),z=range(-13,13.6),g=group();g.position.set(x,.40+range(0,.15),z);g.rotation.set(range(-.2,.2),rnd()*6.28,range(-.2,.2));g.scale.setScalar(range(.5,1.5));world.add(g);cyl(.065,.20,0,0,0,m('#8f9a64'),g,0,3);}
 // Split-rail fencing, softly sagging festoons and a ticket hut at the gate.
 for(let side of [-1,1]){let x=side*11.55;for(let z=-10;z<8;z+=1.5){round(.10,.84,.10,x,.82,z,materials.wood,.02);for(let y of [.68,1.02])rod([x,y,z],[x,y,z+1.44],.025,materials.wood)}for(let z of [-7,-.3,6.4]){cyl(.048,3.9,x,2.27,z,materials.wood);let next=z+6.7;let points=[];for(let i=0;i<=25;i++){let t=i/25;points.push(point(x,4.2-.65*Math.sin(t*Math.PI),z+(next-z)*t))}let wire=curve(points);mesh(tube(wire,25,.016,4,false),materials.dark);for(let i=0;i<11;i++){let p=wire.getPoint(i/10);rod(p.toArray(),[p.x,p.y-.12,p.z],.012,materials.dark);sphere(.055,p.x,p.y-.15,p.z,bulbMat);}}}
 // Nostalgic roadside marquee set on two slim metal posts.
 const sign=group();sign.position.set(-7.3,.4,12.7);sign.rotation.y=.10;world.add(sign);for(let x of [-1.1,1.1])cyl(.067,4.2,x,2.1,0,materials.steel,sign);round(4.6,1.15,.24,0,4.28,0,m('#974f3f'),.27,sign);label('Moonlight',4.3,.95,0,4.28,.14,{bg:'#974f3f',fg:'#eedbb8',size:178,border:false},sign);round(4.06,1.0,.22,0,3.11,0,materials.cream,.07,sign);label(['DRIVE-IN THEATRE','A TRIP TO THE MOON'],3.87,.87,0,3.11,.13,{bg:'#e0d2ac',fg:'#3e5951',size:85,border:false},sign);for(let side of [-1,1])for(let i=0;i<7;i++){let x=-1.89+i*.63,y=3.11+side*.44;sphere(.042,x,y,.18,bulbMat,sign);}const star=group();star.position.set(0,5.25,0);sign.add(star);for(let a=0;a<4;a++){let r=box(.07,.76,.08,0,0,0,bulbMat,star);r.rotation.z=a*Math.PI/4}
 // AUTHORED_SCENE_END
 // A restrained trace of the original projection cone, made from three static
 // crossed sheets. The shared shader controls transparency and nighttime gain;
 // these surfaces never rebuild, cast opaque shadows or own a particle loop.
 // UV X crosses a sheet, UV Y runs from the modeled lens to the picture. Both
 // ends fade before touching the lens glass or the actual screen surface.
 const beamLens=[-.6,3.52,9.59],beamPicture=[0,screenY,sz+.298];
 for(const a of[0,pi/2,pi/4]){
  const far=[screenW/2*Math.cos(a),screenH/2*Math.sin(a),0],near=far.map(v=>v*.008);
  const corner=(center,offset,side)=>center.map((v,i)=>v+offset[i]*side);
  mesh((color,mat)=>b.quad(corner(beamLens,near,-1),corner(beamLens,near,1),corner(beamPicture,far,1),corner(beamPicture,far,-1),color,mat,null,[[0,0],[1,0],[1,1],[0,1]]),{color:'#d6dbc4',mat:84});
 }
 // Source Euler order is XYZ. Most parts use one rotation axis; grass has
 // coupled X/Y rotations and needs two pushes to retain that exact order.
 const emit=o=>{const p=o.position,r=o.rotation,s=o.scale,coupled=r.x&&r.y;if(coupled){b.push(p.x,p.y,p.z,r.x);b.push(0,0,0,0,r.y,r.z,s.x,s.y,s.z);}else b.push(p.x,p.y,p.z,r.x,r.y,r.z,s.x,s.y,s.z);if(o.draw)o.draw();for(const child of o.children)emit(child);b.pop();if(coupled)b.pop();};
 b.push(x,y,z,0,angle);emit(world);b.pop();return population;
}
