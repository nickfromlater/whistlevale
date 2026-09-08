'use strict';

// Bergwald is kept as a complete, authored room: a collector's timber attic
// around an asymmetric mountain relief and a folded, climbing railway.
Object.assign(HOUSE_ROOMS.alpine,{name:'The Mountain Loft',layout:'Bergwald Railway',tag:'THE HIGH COUNTRY',description:'A red train climbs through folded mountain country. Stone arches, a lakeside hamlet, and the hush of a timber attic.',color:'#8b9c89',distance:150,target:[0,5,-3],pitch:.59,yaw:.37});

function alpineOculus(b,x,y,z,r){
 const uv=roomLabels.window;
 b.push(x,y,z);archRing(b,0,0,0,r,r+1.35,2.0,'#564432',36,0,TAU);archRing(b,0,0,.95,r-.17,r+.13,.16,'#ae9368',36,0,TAU);
 for(let i=0;i<48;i++){const a=i*TAU/48,q=(i+1)*TAU/48,point=t=>[Math.cos(t)*r,Math.sin(t)*r,-.45],tex=t=>[mix(uv.u0,uv.u1,(Math.cos(t)+1)/2),mix(uv.v0,uv.v1,(Math.sin(t)+1)/2)];b.tri([0,0,-.45],point(a),point(q),'#ffffff',33,[[0,0,1],[0,0,1],[0,0,1]],[[mix(uv.u0,uv.u1,.5),mix(uv.v0,uv.v1,.5)],tex(a),tex(q)]);}
 for(const a of[0,PI/2])b.beam([-Math.cos(a)*r,-Math.sin(a)*r,.15],[Math.cos(a)*r,Math.sin(a)*r,.15],.16,'#bba47b',22,6);
 archRing(b,0,0,.27,r*.53,r*.53+.16,.14,'#a58d65',32,0,TAU);b.pop();
}
function alpineSconce(b,x,y,z,angle=0){
 b.push(x,y,z,0,angle);b.box(0,0,0,2.2,4.1,.30,'#453f34',41);b.beam([0,0,.2],[0,0,2.2],.14,'#ac8c59',41,10);b.cylinder(0,1.0,2.2,1.75,.95,2.1,'#59624e',41,18);b.cylinder(0,-.09,2.2,1.57,1.57,.06,'#ebce99',25,18);b.pop();
}
ROOM_SHELLS.alpine=b=>{
 const walls=[];
 // Wide dark boards, no carpet: a mountain attic rather than a shop gallery.
 b.box(0,FLOOR-.25,0,158,.45,130,'#65543e',22);
 for(let x=-76;x<78;x+=5.2){b.box(x,FLOOR+.012,0,.045,.018,128,'#3f4034',0);for(let z=-61;z<64;z+=25.5){b.box(x+2.6,FLOOR+.013,z+(Math.floor(x/5.2)%2)*12.5,5.1,.018,.045,'#4a4435',0);}}
 for(const which of['back','left','right','front']){
  const w=new Builder(),back=which==='back',front=which==='front',width=back||front?156:128,angle=back?0:front?PI:which==='left'?PI/2:-PI/2,pos=back?[0,0,-64]:front?[0,0,64]:which==='left'?[-78,0,0]:[78,0,0];
  w.push(...pos,0,angle);
  // Heavy stone knee walls and a visible timber frame make the attic legible.
  w.box(0,-15.4,0,width,17.1,1.25,'#7c8070',4);w.box(0,-6.5,.55,width,.7,1.8,'#4d4535',22);
  if(back){
   w.box(0,10.7,-.32,width,34,.8,'#746347',22);for(let x=-76;x<78;x+=4.0)w.box(x,10.7,.11,.06,33.9,.09,'#4e4837',22);
   w.tri([-78,27,-.3],[78,27,-.3],[0,49,-.3],'#665a43',22);
   for(const x of[-75,-50,-25,25,50,75]){w.box(x,1.5,.7,1.6,51,1.5,'#4f4030',22);w.beam([x,20,1.0],[x+(x<0?8:-8),28.5,1.0],.50,'#8f714b',22,4);}
   w.beam([-78,27,1.0],[0,49,1.0],.83,'#514231',22,4);w.beam([0,49,1.0],[78,27,1.0],.83,'#514231',22,4);w.beam([-76,28,1],[76,28,1],.55,'#9a7d52',22,4);
   alpineOculus(w,0,13,1.6,11.7);w.box(0,-.10,2.0,26,1.1,5.0,'#967b52',22);
   roomFrame(w,'mountain-sign',-49,14,1.1,28,8);roomFrame(w,'house-2',48,16,1.1,28,7);
   alpineSconce(w,-27,6,1.2);alpineSconce(w,28,6,1.2);
  }else if(front){
   w.box(0,-9,0,20,30,.9,'#66583d',22);for(let x=-8;x<=8;x+=2.2)w.box(x,-9,.49,.045,29,.06,'#423e30',0);w.box(7,-8,.66,.32,2.4,.3,'#c3a06a',41);roomFrame(w,'shop-sign',0,10,.9,27,7);
  }else{
   // Knee-wall windows are intentionally long and low, with deep reveals.
   w.box(0,-2.0,-.12,width,9,.75,'#887b60',22);w.box(0,3.0,0,width,1.1,2.0,'#534732',22);
   for(const x of[-58,0,58])w.box(x,-10,.8,1.35,28,1.45,'#584734',22);
   if(which==='left')roomFrame(w,'blueprint',-23,-10,1.12,31,17);
   else{for(const x of[-33,32]){w.box(x,-10,.81,13,18,.5,'#536052',22);for(let j=0;j<7;j++)w.box(x,-17+j*2.35,1.15,12,.20,.3,'#a18a60',22);}}
  }
  w.pop();walls.push({which,mesh:w.mesh()});
 }
 // A built-in leather-topped bench and flat plan drawers under the oculus.
 cabinet(b,0,-54,40,12,12);b.box(0,-10.7,-54,39,.8,11.2,'#66694f',23);for(const x of[-15,15])b.box(x,-8.9,-58.5,10,3,2.7,'#8c8765',23);
 b.push(-60,FLOOR,-42,0,.23);b.box(0,4.1,0,17,8.2,13,'#6f573d',22);b.box(0,8.35,0,18,.65,14,'#8c714a',22);for(const side of[-1,1]){b.box(side*7.5,4.4,.2,.5,8,13.2,'#a99061',22);b.beam([side*6.6,5.3,6.85],[side*3.6,5.3,6.85],.12,'#c3a16b',41,8);}onTop(b,'manual',-1,8.71,0,11,7);mug(b,5.4,8.72,3.5,1.6);b.pop();
 // The cast-iron stove and stacked firewood belong to this room alone.
 b.push(61,FLOOR,-40);b.box(0,.19,0,17,.38,17,'#656d61',4);for(const side of[-1,1])for(const t of[-1,1])b.box(side*3.6,2,t*3.1,.75,3.3,.75,'#3e453b',41);
 b.box(0,8.1,0,9,11.1,8,'#414c42',41);b.box(0,8.4,4.12,6.7,7.3,.3,'#252f29',41);b.box(0,8.4,4.30,5.1,5.8,.06,'#29392f',0);for(const x of[-1.2,0,1.2]){b.tri([x-.65,6.4,4.36],[x+.68,6.4,4.36],[x+.22,9.9-Math.abs(x)*.6,4.36],'#c27d3d',25);b.tri([x-.27,6.5,4.38],[x+.35,6.5,4.38],[x-.05,8.5,4.38],'#e6bd68',25);}for(const x of[-.8,.8])b.cylinder(x,6.35,4.40,.24,.24,2.7,'#644c35',22,9,0,PI/2);for(let i=0;i<5;i++)b.beam([-2.2+i*1.1,6,4.38],[-1.7+i*.9,10.6,4.38],.055,'#4a4e37',41,5);b.box(0,14,0,10.2,.65,8.8,'#556052',41);b.cylinder(0,24,-2.0,1.0,1.0,20,'#4c5143',41,18);b.box(3.3,8.5,4.55,.3,2.2,.35,'#b49761',41);b.pop();
 for(let row=0;row<3;row++)for(let i=0;i<5-row;i++)b.cylinder(48+i*1.25+row*.6,FLOOR+.8+row*1.16,-49,.61,.61,6.7,'#a08b61',22,10,PI/2);
 // A freestanding reading lamp stays beside the wall, outside the miniature.
 b.cylinder(-58,FLOOR+.15,30,3.4,3.4,.30,'#525741',41,20);b.cylinder(-58,-8.3,30,.16,.16,30.8,'#b19661',41,12);b.cylinder(-58,7.7,30,4.6,2.5,5.0,'#a7956a',23,22);b.cylinder(-58,5.15,30,4.35,4.35,.10,'#e5c792',25,22);
 return walls;
};

function alpineFir(b,x,y,z,h,variant=0){
 b.cylinder(x,y+h*.29,z,.10,.035,h*.58,'#6c5943',22,7);
 for(let i=0;i<5;i++){const t=i/5,r=h*(.24-t*.19),off=Math.sin(i*2.8+variant)*h*.025;b.cylinder(x+off,y+h*(.33+t*.67),z-off,r,.012,h*(.34-t*.06),['#345744','#4b6850','#607758'][(variant+i)%3],8,8);if(y>15&&i>2)b.cylinder(x+off,y+h*(.39+t*.67),z-off,r*.73,.007,h*.19,'#d4ddcf',3,8);}
}
function alpineChalet(b,x,y,z,w=4.8,d=4.0,h=3.4,angle=0,pale=false){
 b.push(x,y,z,0,angle);b.box(0,.18,0,w+.3,.36,d+.3,'#a2aa96',4);b.box(0,1.0,0,w,1.7,d,pale?'#c4c4a6':'#b4b491',4);b.box(0,(h+1.6)/2,0,w,h-1.6,d,'#856f4b',22);
 const X=w/2+.55,Z=d/2+.50,R=1.85;b.quad([-X,h,-Z],[-X,h,Z],[0,h+R,Z],[0,h+R,-Z],'#677465',5);b.quad([0,h+R,-Z],[0,h+R,Z],[X,h,Z],[X,h,-Z],'#56675d',5);for(const zz of[-d/2,d/2])b.tri([-w/2,h,zz],[w/2,h,zz],[0,h+R-.14,zz],'#a59168',22);
 b.beam([0,h+R+.04,-Z],[0,h+R+.04,Z],.08,'#87917a',5,6);for(const side of[-1,1]){b.box(side*X,h-.045,0,.12,.15,d+1.06,'#af9870',22);b.box(side*(w/2-.12),h/2,d/2+.035,.13,h,.12,'#584b35',22);}
 for(const xx of[-w*.28,w*.28]){windowPane(b,xx,1.14,d/2+.04,.65,.78);windowPane(b,xx,2.60,d/2+.04,.63,.74);flowerBox(b,xx,2.02,d/2+.31,.72);}
 b.box(0,.73,d/2+.055,.61,1.45,.10,'#586c57',22);b.box(0,1.95,d/2+.57,w+.50,.16,1.40,'#8a754f',22);for(let i=0;i<12;i++)b.box(-w/2+i*w/11,2.34,d/2+1.21,.07,.68,.07,'#aa9164',22);b.box(0,2.66,d/2+1.21,w+.2,.09,.09,'#b6a079',22);
 b.box(w*.27,h+1.12,-.6,.46,1.57,.52,'#929983',4);b.pop();
}
function alpineRelief(b,height,palette){
 const nx=150,nz=96,W=104,D=66,R=8,pts=[],ns=[],colors=[];
 const bound=(x,z)=>{if(Math.abs(x)>W/2-R&&Math.abs(z)>D/2-R){const dx=Math.abs(x)-(W/2-R),dz=Math.abs(z)-(D/2-R),l=Math.hypot(dx,dz);if(l>R){x=Math.sign(x)*(W/2-R+dx/l*R);z=Math.sign(z)*(D/2-R+dz/l*R);}}return[x,z];};
 for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const [x,z]=bound(-W/2+i*W/nx,-D/2+j*D/nz),y=height(x,z),n=norm([height(x-.12,z)-height(x+.12,z),.24,height(x,z-.12)-height(x,z+.12)]);pts.push([x,y,z]);ns.push(n);colors.push(palette(x,y,z,n));}
 for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i;for(const ids of[[a,a+nx+1,a+1],[a+1,a+nx+1,a+nx+2]])for(const k of ids)b.vertex(pts[k],ns[k],colors[k],3);}
 const outline=roundRect(W,D,R,20);for(let i=0;i<outline.length;i++){const a=outline[i],q=outline[(i+1)%outline.length];b.quad([a[0],-.2,a[1]],[q[0],-.2,q[1]],[q[0],height(...q),q[1]],[a[0],height(...a),a[1]],'#65725a',3);}
}
function alpineViaduct(b,edge,start,end,height){
 // Centre an open arch on the lower railway crossing; a pier must never fall
 // into the lower train's clearance envelope merely because spans were tiled.
 const span=4.7;let anchor=(start+end)/2,closest=Infinity;
 for(let d=start;d<end;d+=.045){const a=edge.at(d),distance=Math.hypot(a.p[0]-4.7579,a.p[2]-11.4925);if(distance<closest){closest=distance;anchor=d;}}
 const first=anchor-Math.ceil((anchor-start)/span-.5)*span;
 for(let d=first;d<end+span/2;d+=span){
  const a=edge.at(d),left=edge.at(d-span/2),right=edge.at(d+span/2),w=Math.hypot(right.p[0]-left.p[0],right.p[2]-left.p[2])+.07,top=a.p[1]-.21,g=Math.min(height(a.p[0],a.p[2]),height(left.p[0],left.p[2]),height(right.p[0],right.p[2]),top-1.4),r=Math.min(w*.385,(top-g)*.54),cy=top-.43-r,pw=(w-r*2)*.5;
  b.matrix(basis([a.p[0],0,a.p[2]],norm([a.f[0],0,a.f[2]])));b.push(0,0,0,0,PI/2);
  for(const side of[-1,1]){const xx=side*(r+pw/2);b.box(xx,(top+g)/2,0,pw,top-g,1.7,'#abb09d',4);b.box(xx,g+.12,0,pw+.22,.25,2.0,'#8e9b88',4);b.box(xx,(top+g)/2,1.0,pw*.62,top-g,.32,'#9da793',4);}
  archRing(b,0,cy,0,r,r+.27,1.71,'#c4c4ac',20);for(let k=0;k<18;k++){const a=k*PI/18,q=(k+1)*PI/18,xa=(r+.265)*Math.cos(a),xb=(r+.265)*Math.cos(q),ya=cy+(r+.265)*Math.sin(a),yb=cy+(r+.265)*Math.sin(q);for(const z of[-.85,.85])b.quad([xa,ya,z],[xb,yb,z],[xb,top,z],[xa,top,z],'#acb29e',4);}
  b.pop();b.pop();
 }
 ribbon(b,edge,1.88,0,-.21,'#bdc0a8',4,start,end,.28);
 for(const side of[-1,1])for(let d=start;d<end;d+=.55){const a=edge.at(d);b.matrix(basis(a.p,a.f));b.box(side*.90,.10,0,.16,.32,.58,'#afb89f',4);b.box(side*.90,.30,0,.24,.08,.60,'#d0ceb5',4);b.pop();}
}
function alpineStoneWall(b,points,height,nearest){
 for(let i=0;i<points.length-1;i++){const a=points[i],q=points[i+1],n=Math.ceil(Math.hypot(q[0]-a[0],q[1]-a[1])/.39);for(let j=0;j<n;j++){const x=mix(a[0],q[0],j/n),z=mix(a[1],q[1],j/n),y=height(x,z);if(nearest(x,z).dist<1.7)continue;for(let row=0;row<2;row++)b.sphere(x+(row?.10:0),y+.15+row*.21,z,.26,.16,.18,row?'#afb49a':'#859279',4,7,4,true);}}
}
function alpineSlate(b,height,nearest){
 // Broad irregular fracture planes replace the smooth powdery appearance of
 // a height field. Each slab is a few metres across in the miniature world.
 for(let row=0;row<11;row++)for(let col=0;col<13;col++){
  const x=3+col*3.4+(row%2)*1.65,z=-31+row*1.9,dx=3.7+hash(col,row)*.55,dz=1.95+hash(row,col)*.45;
  const xz=[[x,z],[x-.32,z+dz],[x+dx-.42,z+dz+.10],[x+dx,z-.15]],ys=xz.map(p=>height(...p));
  if(Math.min(...ys)<8.0||xz.some(p=>nearest(...p).dist<1.8)||Math.max(...ys)>28.5)continue;
  const pts=xz.map(([xx,zz],i)=>[xx,ys[i]+.07+(i===1||i===2?.14:0),zz]);
  const tone=(row+col)%5===0?'#7f8a79':(row+col)%3===0?'#697b72':'#4c6662';
  b.tri(pts[0],pts[1],pts[3],tone,3);b.tri(pts[1],pts[2],pts[3],shade(tone,.91),3);
  // The front lip of the stratum is exposed stone, not a painted stripe.
  b.quad(pts[1],pts[2],add(pts[2],[0,-.23,-.07]),add(pts[1],[0,-.23,-.07]),'#3e5652',3);
 }
 const fractures=[[[19,-27],[19.5,-24],[17.6,-20],[18.2,-17],[16,-13]],[[25,-27],[26,-24],[24,-21],[25,-18],[23.5,-15]],[[31,-28],[30.5,-25],[32,-23],[31,-19],[32.4,-15]],[[39,-28],[38,-25],[39,-22],[37.8,-18]],[[8,-30],[8.5,-27],[7,-24],[8,-21]]];
 for(const points of fractures)for(let i=0;i<points.length-1;i++){
  const a=points[i],q=points[i+1],n=Math.ceil(Math.hypot(q[0]-a[0],q[1]-a[1])/.30);
  for(let j=0;j<n;j++){const p=lerpV(a,q,j/n),v=lerpV(a,q,(j+1)/n),y=height(...p),yy=height(...v);if(y<9||yy<9||nearest(...p).dist<1.7)continue;b.beam([p[0],y+.19,p[1]],[v[0],yy+.19,v[1]],.035,'#354c49',3,4);}
 }
 // Buttresses split the ridgeline into individual crags with asymmetric tops.
 for(const [x,z,h]of[[13,-23,3.5],[18.5,-18.2,4.1],[25.5,-21,4.4],[34,-24,3.6],[41.5,-22,4.0],[8,-26,2.8]]){
  const y=height(x,z),base=[[-1.4,1.3],[1.25,1.5],[1.65,-.6],[-.8,-1.2]].map(([dx,dz])=>[x+dx,height(x+dx,z+dz)-.2,z+dz]),a=[x-.25,y+h,z-.45],q=[x-1.0,y+h*.74,z+.48];
  b.tri(base[0],base[1],q,'#465f5c',3);b.tri(base[1],a,q,'#75877b',3);b.tri(base[1],base[2],a,'#3d5654',3);b.tri(base[2],base[3],a,'#627b71',3);b.tri(base[3],q,a,'#8c9985',3);b.tri(base[3],base[0],q,'#526e64',3);
  if(y>21)b.tri(add(a,[-.13,.035,.08]),add(a,[-.65,-.28,.25]),add(a,[.20,-.22,.45]),'#d9e0d1',3);
 }
}

function alpineRoom(scene,b){
 // A substantial, rounded walnut relief plinth on dark trestles. Its edge and
 // footprint have their own proportions; it is not the coastal display table.
 slab(b,107,69,2.8,-1.9,9,'#544331',22);slab(b,107.3,69.3,.10,-.46,9.1,'#b79c63',41);slab(b,106.7,68.7,.36,-.22,8.9,'#6a6145',22);
 for(const x of[-34,34]){for(const z of[-19,19])b.beam([x,-3,z],[x+(x<0?-3:3),FLOOR,z+Math.sign(z)*4],.95,'#414b3b',22,4);b.beam([x,FLOOR+4,-23],[x,FLOOR+4,23],.55,'#6e6143',22,4);}
 b.beam([-37,FLOOR+4,0],[37,FLOOR+4,0],.62,'#64563c',22,4);
 const points=[[-38,2.8,9],[-29,2.8,21],[-8,3.3,24],[4,4.3,15],[6,5.4,-3],[19,8.2,-14],[35,10.6,-10],[43,11.6,3],[32,11.3,16],[16,10.5,18],[0,8.8,8],[-16,6.0,-6],[-32,4.1,-14],[-43,2.8,-6]];
 const edge=new Edge('Bergwald folded mountain railway',splineCurves(points,true,.73));scene.routes=[edge];scene.trains=[{edge,distance:147,speed:.59,type:'mountain',cars:2}];
 const upperBridge=p=>p[1]>7.1&&p[2]>1.1&&p[0]<36.5,lowerBridge=p=>p[1]<4.5&&p[2]>18.2&&p[0]>-10&&p[0]<2;
 const bridge=p=>upperBridge(p)||lowerBridge(p),allCells=new Map(),earthCells=new Map();
 for(let i=0;i<edge.points.length;i+=3){const p=edge.points[i].p,key=`${Math.floor(p[0]/3.4)},${Math.floor(p[2]/3.4)}`;for(const map of bridge(p)?[allCells]:[allCells,earthCells]){if(!map.has(key))map.set(key,[]);map.get(key).push(p);}}
 const nearest=(x,z,earth=false)=>{const map=earth?earthCells:allCells,gx=Math.floor(x/3.4),gz=Math.floor(z/3.4);let best={dist:999,p:[0,0,0]};for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){const ps=map.get(`${gx+dx},${gz+dz}`);if(ps)for(const p of ps){const d=Math.hypot(x-p[0],z-p[2]);if(d<best.dist)best={dist:d,p};}}return best;};
 const peak=(x,z,cx,cz,rx,rz,h,a)=>{const dx=x-cx,dz=z-cz,u=(dx*Math.cos(a)-dz*Math.sin(a))/rx,v=(dx*Math.sin(a)+dz*Math.cos(a))/rz,r=Math.max(Math.abs(u)*.88+Math.abs(v)*.43,Math.abs(u)*.36+Math.abs(v)*.97);return Math.max(0,1-r)*h;};
 const raw=(x,z)=>{
  const crag=Math.max(peak(x,z,24,-23,23,15,30,.15),peak(x,z,40,-24,15,14,21,-.13),peak(x,z,4,-28,16,11,17,.1),peak(x,z,-31,-25,21,13,13,-.25));
  const spur=7.5*Math.exp(-(((x-38)/10)**2+(z/17)**2))+3.8*Math.exp(-(((x+13)/14)**2+((z+7)/13)**2));
  let y=2.2+Math.max(crag*(.93+.12*noise(x*.34,z*.31)),spur)+.58*noise(x*.10,z*.13);
  return y+(.15*Math.sin(y*1.35+x*.27)+.055*Math.sin(y*3.8-z*.36))*smooth(7,12,y);
 };
 const lakeField=(x,z)=>Math.hypot((x+13.6)/10.1,(z-7.9)/6.7)+.082*Math.sin(x*.33+z*.42)+.035*Math.sin(z*.91);
 const streamX=z=>-8.0+(z-13)*.66+Math.sin((z-13)*.37)*1.0;
 const height=(x,z)=>{
  let y=raw(x,z),n=nearest(x,z,true);
  const village=(1-smooth(.75,1.14,Math.hypot((x+31)/12,(z-8)/12)));y=mix(y,2.48,village);
  y=mix(1.25,y,smooth(.79,1.13,lakeField(x,z)));
  if(z>12.0){const dist=Math.abs(x-streamX(z)),fade=smooth(12,15,z);y=mix(y,1.48,fade*(1-smooth(.46,1.18,dist)));}
  if(n.dist<2.8)y=mix(n.p[1]-.24,y,smooth(.85,2.8,n.dist));
  return y;
 };
 scene.height=(x,z)=>Math.abs(x)<52&&Math.abs(z)<33?height(x,z):FLOOR;
 alpineRelief(b,height,(x,y,z,n)=>{
  const pasture=smooth(21,26,z),grassTexture=mix(noise(x*.26,z*.26),(Math.sin(x*.44+z*.11)*.5+.5)*.64+.15,pasture*.65);
  const meadow=lerpV(col('#385738'),col('#88935d'),grassTexture*.69),stratum=Math.sin(y*1.4+x*.24+z*.11)*.5+.5,rock=lerpV(col('#3d5956'),col('#829281'),stratum*.24+noise(x*.64,z*.63)*.36);
  const stone=Math.max(smooth(.13,.44,1-n[1])*smooth(4,9,y),smooth(7,12,y)*.97),snow=smooth(27,31.6,y+noise(x*.35,z*.35)*1.3)*smooth(.48,.88,n[1]);
  let color=lerpV(meadow,rock,stone);color=lerpV(color,col('#dce2d8'),snow);
  if(lakeField(x,z)<1.18)color=lerpV(col('#b4b795'),color,smooth(.99,1.18,lakeField(x,z)));return color;
 });
 alpineSlate(b,height,nearest);
 // The lake is a continuous surface beneath a carved, non-elliptical basin.
 for(let z=-1;z<18;z+=.5)for(let x=-27;x<1;x+=.5)b.quad([x,1.86,z],[x,1.86,z+.5],[x+.5,1.86,z+.5],[x+.5,1.86,z],'#67988d',7,[0,1,0],[[0,0],[0,1],[1,1],[1,0]]);
 const waterPoints=[];for(let z=12.8;z<=33;z+=1.2)waterPoints.push([streamX(z),1.76,z]);const stream=new Edge('Bergwald lake outflow',splineCurves(waterPoints,false,.72));ribbon(b,stream,.99,0,0,'#6f9b8d',7,0,stream.length,.24);
 for(const [start,end]of bridgeRange(edge,a=>upperBridge(a.p)))alpineViaduct(b,edge,start,end,height);
 for(const [start,end]of bridgeRange(edge,a=>lowerBridge(a.p))){
  ribbon(b,edge,1.7,0,-.23,'#7f7552',22,start,end,.28);
  for(let d=start;d<=end;d+=1.75){const a=edge.at(d),h=a.p[1]-1.48;b.matrix(basis(a.p,a.f));for(const side of[-1,1]){b.beam([side*.63,-.25,0],[side*.86,-h,0],.095,'#69745a',22,6);b.beam([side*.63,-.25,0],[-side*.86,-h,0],.046,'#ac9465',22,6);}b.pop();}
 }
 // Mountain retaining walls and rockfall fences describe the climbing grade.
 for(let d=0;d<edge.length;d+=.65){const a=edge.at(d);if(bridge(a.p))continue;const r=norm([a.f[2],0,-a.f[0]]);for(const side of[-1,1]){const x=a.p[0]+side*r[0]*1.3,z=a.p[2]+side*r[2]*1.3;if(raw(x,z)>a.p[1]+1.1){b.matrix(basis(a.p,a.f));const h=Math.min(2.4,raw(x,z)-a.p[1]);b.box(side*1.18,h*.4,0,.30,h,.70,'#909d89',4);b.box(side*1.18,h*.90,0,.38,.12,.72,'#adb89e',4);b.pop();}}}
 createRail(b,edge);
 // A small triangular station square, with houses sited around lanes rather
 // than arranged in a showroom row. The lake is their shared view.
 const lane=[[-37,-1],[-31,1],[-28,6],[-29,12],[-30,17]];housePath(b,lane,1.2,height,'#bcb596');housePath(b,[[-30,11],[-24,15],[-18,16.4],[-10,16],[-4,12]],.67,height,'#b2af8c');
 for(const [i,x,z,w,d,h,a]of[[0,-36.0,1.9,4.8,4.2,3.7,-.30],[1,-29.3,-1.8,4.7,4.2,3.5,.30],[2,-24.2,2.0,4.1,3.8,3.2,-.60],[3,-34.3,9.2,5.2,4.7,4.0,.22],[4,-27.0,11.9,3.7,3.4,3.3,-.42]]){
  const y=height(x,z);b.box(x,y-.11,z,w+.55,.32,d+.55,'#a2aa91',4);alpineChalet(b,x,y+.05,z,w,d,h,a,i===3);
 }
 houseStation(scene,b,-29.6,2.52,17.2,'alpine-station',true);b.box(-29.6,2.66,19.4,12,.23,1.4,'#c4c6aa',4);
 for(const [x,z]of[[-31.1,6.1],[-30.2,8.7]]){cafeScene(b,x,height(x,z)+.05,z,.24);scene.population+=3;}
 const fy=height(-29,10.1);b.cylinder(-29,fy+.18,10.1,.73,.73,.36,'#a7b09b',4,16);b.cylinder(-29,fy+.39,10.1,.59,.59,.06,'#799f91',7,16);b.cylinder(-29,fy+.69,10.1,.14,.13,.68,'#9dab95',4,10);b.sphere(-29,fy+1.13,10.1,.23,.27,.23,'#c1c4a9',4,10,6);
 for(const [x,z]of[[-34,18.6],[-25.3,18.6],[-31,3.6],[-23,14.4]])houseLamp(b,x,height(x,z)+.05,z,2.0);
 // An old mountain chapel anchors the upper end of the village.
 b.push(-38.4,height(-38.4,-6.1),-6.1,0,.22);b.box(0,1.9,0,3.5,3.8,4.5,'#c2c4ac',4);gable(b,3.6,4.8,3.8,1.45,'#6b7868');b.box(-2,2.8,.7,1.6,5.6,1.7,'#b6bea5',4);b.cylinder(-2,6.45,.7,1.27,0,2.0,'#596d60',5,4);windowPane(b,-2,4.35,1.58,.65,.76);b.box(0,.82,2.28,.65,1.64,.07,'#62745d',22);for(const x of[-1.05,1.05])windowPane(b,x,2.28,2.28,.53,1.20);b.pop();
 // Jetty and boat house: small stories belong to specific shore locations.
 const jettyX=-20.8;for(let i=0;i<18;i++)b.box(jettyX,2.15,7.4+i*.19,1.18,.13,.17,'#a79061',22);for(const side of[-1,1])for(const z of[7.65,10.50])b.cylinder(jettyX+side*.46,1.87,z,.067,.067,.89,'#7f7454',22,7);
 for(let i=0;i<17;i++)b.box(-24.0+i*.2,2.15,7.45,.18,.13,.83,'#a79061',22);
 for(let i=0;i<2;i++)scenePerson(scene,b,jettyX-.23+i*.48,2.25,10.44,'sit',0,i?.75:1);
 b.push(-17.5,1.96,10.4,0,.7);b.sphere(0,0,0,.43,.17,1.08,'#a78155',22,14,7);b.sphere(0,.11,0,.34,.025,.94,'#d1b889',22,12,5);b.box(0,.17,-.17,.61,.05,.13,'#7d7752',22);b.beam([-.74,.25,.25],[.74,.25,-.31],.02,'#cbb181',22,6);b.pop();
 alpineChalet(b,-22.6,height(-22.6,5.4),5.4,2.4,2.9,2.2,PI/2);
 // Irregular shore stones, reeds on the sheltered edge, and a picnic clearing.
 for(let i=0;i<90;i++){const a=i*TAU/90,x=-13.6+Math.cos(a)*(10.3+.37*Math.sin(a*3)),z=7.9+Math.sin(a)*(6.9+.3*Math.cos(a*4));if(i%4===0||nearest(x,z).dist<1.7)continue;const y=height(x,z);b.sphere(x,y+.05,z,.16+hash(i,67)*.31,.13+hash(i,91)*.2,.16+hash(i,27)*.25,'#a7b39e',4,7,5,true);}
 for(let i=0;i<28;i++){const x=-9.2+i*.13,z=13.3+Math.sin(i*1.7)*.35;for(let j=0;j<3;j++)b.beam([x,1.7,z],[x+.05*j,2.1+hash(i,j)*.43,z+.06*j],.01,'#88966b',8,4);}
 const picnicY=height(-8,16.2);bench(b,-8,picnicY+.03,16.2,.45);scenePerson(scene,b,-8,picnicY+.15,16.2,'sit',.45);scenePerson(scene,b,-7.4,picnicY+.03,16.8,'bag',1.9);littleDog(b,-7.1,picnicY+.04,16.5,1.2);
 // Purposeful forest zones: village edge, northern catchment, gorge, eastern
 // spur, and the river's lower bank. High stone and open grass stay exposed.
 const groves=[[-45,3,5,13,36],[-35,-24,13,6,44],[-16,-12,10,7,36],[39,-3,8,15,56],[43,24,7,7,30],[15,-7,9,5,24],[-4,27,12,4,26]];
 for(let g=0;g<groves.length;g++){const [cx,cz,rx,rz,count]=groves[g];for(let i=0;i<count;i++){const a=i*2.399963,r=Math.sqrt((i+.5)/count),x=cx+Math.cos(a)*rx*r,z=cz+Math.sin(a)*rz*r,y=height(x,z);if(Math.abs(x)>50||Math.abs(z)>31||nearest(x,z).dist<2.1||y>19||lakeField(x,z)<1.20||(x<-22&&x>-40&&z>-9&&z<17))continue;alpineFir(b,x,y,z,2.9+hash(i,g+17)*3.1,i+g);}}
 // Broken talus along the base of the main rock wall, following the contour.
 for(let i=0;i<70;i++){const x=13+i*.40,z=-11.7+Math.sin(i*.21)*2.8+hash(i,74)*1.3,y=height(x,z);if(nearest(x,z).dist<1.55||y<5)continue;b.sphere(x,y+.08,z,.25+hash(i,2)*.53,.27+hash(i,5)*.48,.28+hash(i,7)*.45,['#8f9a89','#aeb49f','#778879'][i%3],4,6,4,true);}
 // A marked hiking traverse to a stone refuge, kept away from the railway.
 const trail=housePath(b,[[11,7],[16,5],[21,2],[26,0],[28,-4],[26,-8],[27,-12],[30,-15]],.52,height,'#b9b59a');
 for(let i=0;i<9;i++){const a=trail.at(trail.length*(i+.5)/10),p=a.p;if(nearest(p[0],p[2]).dist<2)continue;scenePerson(scene,b,p[0],height(p[0],p[2])+.04,p[2],i%3?'bag':'wave',Math.atan2(a.f[0],a.f[2]));b.beam([p[0]+.13,p[1]+.35,p[2]],[p[0]+.22,p[1],p[2]+.16],.008,'#a58f60',22,5);}
 const hutX=31,hutZ=-17,hutY=height(hutX,hutZ);b.box(hutX,hutY-.10,hutZ,5.8,.3,5.0,'#a7b09b',4);alpineChalet(b,hutX,hutY+.06,hutZ,3.4,3.2,2.6,-.18,true);houseRailing(b,[[28.2,-14.5],[34,-14.5],[34,-18.8]],hutY+.06,.68,'#a9a681');scenePerson(scene,b,29.3,hutY+.10,-15,'bag',.5);scenePerson(scene,b,30,hutY+.1,-14.8,'wave',.6);
 // A few resting sheep occupy the sheltered pasture, not the summit.
 for(let i=0;i<8;i++){const x=-18+(i%4)*1.2,z=-20+Math.floor(i/4)*1.3,y=height(x,z);if(nearest(x,z).dist<2)continue;b.sphere(x,y+.21,z,.21,.20,.34,'#c8cbb1',23,9,6);b.sphere(x+.02,y+.29,z+.35,.12,.11,.14,'#8e9679',23,7,5);for(const side of[-1,1])for(const zz of[-.20,.20])b.beam([x+side*.12,y+.20,z+zz],[x+side*.12,y,z+zz],.021,'#787e66',23,5);}
 // Grazing meadows continue below the railway. Their stone boundaries follow
 // contours, leaving a broad clear foreground for the high viaduct.
 alpineStoneWall(b,[[-47,17],[-43,23],[-35,28],[-26,30.1],[-16,29.5],[-12,27]],height,nearest);
 alpineStoneWall(b,[[7,29],[15,30],[24,28.8],[32,26],[36.5,21]],height,nearest);
 housePath(b,[[-40,21],[-33,25],[-25,27.1],[-17,28],[-10,28.5],[-2.8,28]],.56,height,'#ada986');
 housePath(b,[[4,28],[10,28.5],[18,27.9],[28,25]],.55,height,'#aaa986');
 for(const [x,z,a]of[[-32,26.2,.8],[-28.2,27.3,-.4],[-25.8,25.6,.1],[-21.8,27.8,.7],[-19.2,26.4,-.5]]){
  const y=height(x,z);b.push(x,y,z,0,a);b.sphere(0,.28,0,.26,.25,.44,'#c7cab0',23,9,6);b.sphere(.01,.38,.43,.13,.13,.16,'#829078',23,8,5);for(const side of[-1,1])for(const zz of[-.29,.28])b.beam([side*.17,.25,zz],[side*.17,.01,zz],.023,'#748269',23,5);b.pop();
 }
 const footZ=27.8,footX=streamX(footZ),footY=2.57;
 for(let i=0;i<22;i++)b.box(footX-2.4+i*.23,footY,footZ,.21,.13,1.0,'#a69362',22);
 for(const side of[-1,1]){for(const xx of[-2.15,0,2.15])b.box(footX+xx,footY+.34,footZ+side*.48,.045,.68,.045,'#9ca17a',22);b.beam([footX-2.3,footY+.64,footZ+side*.48],[footX+2.4,footY+.64,footZ+side*.48],.024,'#b8b695',22,5);}
 scenePerson(scene,b,footX+.4,footY+.08,footZ,'talk',-.4);scenePerson(scene,b,footX-.25,footY+.08,footZ,'wave',1.6,.72);littleDog(b,footX+1.05,footY+.08,footZ,.5,.85);
 scenePerson(scene,b,-22.5,height(-22.5,28.4)+.04,28.4,'bag',.7);b.beam([-22.35,height(-22.5,28.4)+.48,28.4],[-22.18,height(-22.5,28.4),28.55],.012,'#96895f',22,5);
 for(const [x,z,h]of[[-46,22.5,3.9],[-38,27.2,3.2],[-35,29.6,2.9],[16,29.5,3.0]]){alpineFir(b,x,height(x,z),z,h,2);for(let i=0;i<6;i++){const a=i*TAU/6,xx=x+Math.cos(a)*1.3,zz=z+Math.sin(a)*.9;b.sphere(xx,height(xx,zz)+.12,zz,.19,.14,.17,'#929e7b',8,6,4);}}
 for(let i=0;i<13;i++)scenePerson(scene,b,-34+i*.67,2.85,19.45,i%4?'bag':'wave',i*.63,i%6===0?.72:1);
 for(const [x,z,pose,a]of[[-32,6,'bag',.7],[-31.4,6.5,'talk',1.2],[-36,4,'wave',.1],[-25,13.4,'bag',2.1],[-24.6,13.7,'talk',.4]])scenePerson(scene,b,x,height(x,z)+.04,z,pose,a);
 for(let i=0;i<5;i++)scene.actors.push({a:[-33.2,2.84,19.18],b:[-25.8,2.84,19.18],speed:.10,offset:i*.23,variant:i,scale:1});
 b.box(0,-3.2,34.7,29,4.1,.62,'#444e3d',22);roomSign(b,'mountain-sign',0,-3.15,35.04,27,3.45);
 scene.spots=[{name:'The lakeside hamlet',detail:'A village gathered around its station and mountain water.',target:[-29,5,7],distance:45,yaw:.26,pitch:.60},{name:'The high traverse',detail:'A red train above the valley, crossing its own long way home.',target:[10,9,13],distance:47,yaw:.50,pitch:.56},{name:'The mountain refuge',detail:'A small warm shelter below the weathered ridge.',target:[29,15,-16],distance:40,yaw:.75,pitch:.54},{name:'Still water',detail:'Two readers, a rowing boat, and the hush of the pines.',target:[-14,3,8],distance:33,yaw:.3,pitch:.67}];
}
