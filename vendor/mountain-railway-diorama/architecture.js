import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// The village is built from shaped joinery, swept profiles and tiled roof patches.
// All permanent joinery is consolidated by finish after it has been assembled.
export function createArchitecture(scene, world, shared) {
  const objects = [], lamps = [], litMaterials = [];
  let seed = 61473;
  const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const palette = {};
  function finish(name, color, roughness, type = '') {
    const m = new THREE.MeshStandardMaterial({ color, roughness, metalness: type === 'metal' ? .5 : .04 });
    m.name = name;
    m.onBeforeCompile = s => {
      s.uniforms.uArchitecturalWetness = shared.wetness;
      s.vertexShader = 'varying vec3 vLocalSurface;\n' + s.vertexShader;
      s.vertexShader = s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvLocalSurface = position;');
      s.fragmentShader = 'uniform float uArchitecturalWetness;\nvarying vec3 vLocalSurface;\n' + s.fragmentShader;
      const grain = type === 'wood' ? 'sin(vLocalSurface.y*9.0 + sin(vLocalSurface.x*61.0)*.7 + sin(vLocalSurface.z*49.0)*.8)' : 'sin(dot(vLocalSurface,vec3(37.0,19.0,43.0)))*sin(dot(vLocalSurface,vec3(11.0,61.0,23.0)))';
      s.fragmentShader = s.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>\nfloat materialGrain = (${grain}) * (1.0-smoothstep(.4,2.0,length(fwidth(vLocalSurface*49.0))));\ndiffuseColor.rgb *= .965 + .035*materialGrain;\ndiffuseColor.rgb *= 1.0-uArchitecturalWetness*.12;`);
      s.fragmentShader = s.fragmentShader.replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = max(.21, roughnessFactor - uArchitecturalWetness * .21);');
    };
    m.customProgramCacheKey = () => `architecture-${type}`;
    palette[name] = m;
    return m;
  }
  const wood = finish('dark cedar timber', '#3e3128', .86, 'wood');
  const warmWood = finish('honey cedar', '#956848', .79, 'wood');
  const oldWood = finish('silvered cedar boards', '#6e6f60', .92, 'wood');
  const plaster = finish('warm lime plaster', '#dfd4b6', .96);
  const tile = finish('indigo ceramic roof', '#394d50', .56);
  const tileAlt = finish('tile glaze variation', '#485b5d', .6);
  const tileEdge = finish('ridge caps', '#647472', .58);
  const metal = finish('oxidized iron', '#384a48', .67, 'metal');
  const rust = finish('weathered copper', '#946446', .67, 'metal');
  const zinc = finish('canopy standing seam metal', '#76887b', .63, 'metal');
  const concrete = finish('worn platform concrete', '#a5a18d', .95);
  const stone = finish('hand dressed granite', '#7d8174', .97);
  const stoneDark = finish('stone joints', '#4f5c50', 1);
  const paving = finish('paving variation', '#929484', .99);
  const yellow = finish('faded tactile paving', '#c4ac60', .93);
  const moss = finish('velvet moss', '#647441', .98);
  const red = finish('vermillion', '#a44731', .66);
  const cream = finish('enamel ivory', '#e7ddc4', .52, 'metal');
  const black = finish('rubber and deep shadow', '#172723', .93);
  const blue = finish('drink label blue', '#84a2a0', .44);
  const flowerPink = finish('small camellia petals', '#d78281', .88);
  const foliage = finish('planter leaves', '#577040', .96);
  const ropeMat = finish('rice straw rope', '#c6b27b', .95);
  const glass = new THREE.MeshStandardMaterial({ color: '#789c98', roughness: .22, metalness: .15, transparent: true, opacity: .72 });
  const glow = new THREE.MeshStandardMaterial({ color:'#f4db9a',emissive:'#ffc375',emissiveIntensity:.08,roughness:.47 });
  const cabinGlow = new THREE.MeshStandardMaterial({color:'#bfaf76',emissive:'#ffb963',emissiveIntensity:.04,roughness:.53});
  // View-dependent shallow room projection behind the existing recessed shoji.
  // Warm walls, a timber bench and a little hanging shade give the panes depth.
  cabinGlow.onBeforeCompile=shader=>{
    shader.vertexShader='varying vec2 vRoomUV;varying vec3 vRoomRay;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>', `#include <project_vertex>
      vRoomUV=uv;vec3 roomN=normalize(normalMatrix*normal);vec3 roomT=normalize(cross(vec3(.001,1.,0.),roomN));
      vRoomRay=vec3(dot(mvPosition.xyz,roomT),dot(mvPosition.xyz,cross(roomN,roomT)),dot(mvPosition.xyz,roomN));`);
    shader.fragmentShader='varying vec2 vRoomUV;varying vec3 vRoomRay;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      vec2 room=vRoomUV+clamp(vRoomRay.xy/max(.3,abs(vRoomRay.z)),vec2(-2.),vec2(2.))*.075;
      float floorShade=smoothstep(.17,.32,room.y);float roomEdge=smoothstep(0.,.12,room.x)*(1.-smoothstep(.88,1.,room.x));
      float seat=step(.13,room.x)*step(room.x,.86)*step(.22,room.y)*step(room.y,.32);
      float shade=step(.36,room.x)*step(room.x,.64)*step(.72,room.y)*step(room.y,.77);
      float roomLight=(.40+.55*floorShade)*(.72+.28*roomEdge)*(1.-seat*.68)*(1.-shade*.50);
      diffuseColor.rgb*=roomLight;
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance*=roomLight;');
  };
  litMaterials.push(glow, cabinGlow);

  function add(geo, mat, parent, position, rotation) {
    const o = new THREE.Mesh(geo, mat);
    if(position) o.position.set(...position);
    if(rotation) o.rotation.set(...rotation);
    o.castShadow = true; o.receiveShadow = true;
    parent.add(o); objects.push(o); return o;
  }
  function polygon(points, depth, bevel = .025) {
    const s = new THREE.Shape(); s.moveTo(...points[0]);
    for(let i=1;i<points.length;i++) s.lineTo(...points[i]); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, {depth,bevelEnabled:bevel>0,bevelThickness:bevel,bevelSize:bevel,bevelSegments:2,curveSegments:4,steps:1});
    g.translate(0,0,-depth/2); return g;
  }
  function panel(parent, x,y,z,w,h,d,mat,bevel=.025) {
    const q = Math.min(w,h)*.025;
    const geo=polygon([[-w/2+q,-h/2],[w/2-q,-h/2],[w/2,-h/2+q],[w/2,h/2-q],[w/2-q,h/2],[-w/2+q,h/2],[-w/2,h/2-q],[-w/2,-h/2+q]],d,bevel);
    if(mat===cabinGlow){const pos=geo.attributes.position,uv=geo.attributes.uv;for(let i=0;i<pos.count;i++)uv.setXY(i,pos.getX(i)/w+.5,pos.getY(i)/h+.5);}
    return add(geo,mat,parent,[x,y,z]);
  }
  function beam(parent,a,b,width,depth,mat,taper=1) {
    const p = new THREE.Vector3(...a), q = new THREE.Vector3(...b), len = p.distanceTo(q);
    const c=.16, outline=[[-.5+c,-.5],[.5-c,-.5],[.5,-.5+c],[.5,.5-c],[.5-c,.5],[-.5+c,.5],[-.5,.5-c],[-.5,-.5+c]];
    const pos=[], idx=[];
    for(let r=0;r<2;r++) for(const [x,z] of outline) pos.push(x*width*(r?taper:1),r*len,z*depth*(r?taper:1));
    for(let i=0;i<8;i++){let j=(i+1)%8;idx.push(i,j,8+j,i,8+j,8+i);}
    for(let i=1;i<7;i++)idx.push(0,i+1,i,8,8+i,8+i+1);
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();
    const o=add(g,mat,parent,a);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),q.sub(p).normalize()); return o;
  }
  function tube(parent,points,r,mat,closed=false,segments=32) {
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),closed,'centripetal');
    return add(new THREE.TubeGeometry(curve,segments,r,5,closed),mat,parent);
  }
  function turned(parent,center,profile,mat,sides=12) {
    const pos=[],idx=[];
    for(const [radius,y] of profile)for(let j=0;j<sides;j++){const a=j/sides*Math.PI*2;pos.push(center[0]+Math.cos(a)*radius,center[1]+y,center[2]+Math.sin(a)*radius);}
    for(let i=0;i<profile.length-1;i++)for(let j=0;j<sides;j++){const a=i*sides+j,b=i*sides+(j+1)%sides;idx.push(a,b,b+sides,a,b+sides,a+sides);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();return add(g,mat,parent);
  }
  function label(parent,text,sub,w,h,pos,back='#e8e0be',ink='#233f39') {
    const canvas=document.createElement('canvas');canvas.width=768;canvas.height=Math.round(768*h/w);
    const c=canvas.getContext('2d');c.fillStyle=back;c.fillRect(0,0,canvas.width,canvas.height);
    c.strokeStyle=ink;c.lineWidth=6;c.strokeRect(13,13,canvas.width-26,canvas.height-26);
    c.fillStyle=ink;c.textAlign='center';c.textBaseline='middle';
    if(text==='時刻表'){
      // The printed schedule belongs on the board's texture, not on nearly
      // coplanar mesh strips in front of the board.
      c.font=`500 ${canvas.width*.19}px "Hiragino Mincho ProN", serif`;c.fillText(text,384,canvas.height*.12);
      c.font=`${canvas.width*.115}px sans-serif`;
      for(let r=0;r<8;r++){
        const y=canvas.height*(.27+r*.084);c.fillText(['06 18','07 41','09 06','10 35','12 18','14 52','16 24','18 07'][r],384,y);
        c.fillRect(canvas.width*.15,y+canvas.height*.031,canvas.width*.7,2);
      }
    }else{
      c.font=`500 ${sub?canvas.height*.48:canvas.height*.52}px "Hiragino Mincho ProN", "Noto Serif CJK JP", serif`;c.fillText(text,384,canvas.height*(sub?.38:.51));
      if(sub){c.font=`${canvas.height*.145}px sans-serif`;c.fillText(sub,384,canvas.height*.77);}
    }
    const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;
    const mat=new THREE.MeshStandardMaterial({map:tex,roughness:.83});
    const o=panel(parent,...pos,w,h,.028,mat,.009);
    const p=o.geometry.attributes.position,n=o.geometry.attributes.normal,uv=o.geometry.attributes.uv;
    for(let i=0;i<p.count;i++)uv.setXY(i,n.getZ(i)<-.5?.5-p.getX(i)/w:p.getX(i)/w+.5,p.getY(i)/h+.5);
    uv.needsUpdate=true;return o;
  }
  function practical(parent,x,y,z,power=15,radius=9,colour='#ffd293') {
    const l=new THREE.PointLight(colour,power,radius,2);l.position.set(x,y,z);parent.add(l);lamps.push({light:l,power});return l;
  }
  function roof(parent,cx,cy,cz,length,halfWidth,mat=tile) {
    const arch = z => cy - .49*Math.abs(z) + .029*z*z + .15*Math.pow(Math.abs(z)/halfWidth,9);
    const cols=Math.round(length/.34), rows=Math.ceil(halfWidth/.5);
    for(let side of [-1,1])for(let j=0;j<cols;j++)for(let k=0;k<rows;k++){
      const x0=-length/2+j*length/cols, dx=length/cols, z0=k*halfWidth/rows, dz=halfWidth/rows+.035;
      const pos=[],idx=[];
      for(let iz=0;iz<=3;iz++)for(let ix=0;ix<=4;ix++){
        const z=Math.min(halfWidth+.08,z0+iz/3*dz),xx=x0+ix/4*dx;
        const barrel=Math.sin(ix/4*Math.PI)*.062;
        pos.push(cx+xx,arch(z)+barrel+.028*(1-iz/3),cz+z*side);
      }
      for(let iz=0;iz<3;iz++)for(let ix=0;ix<4;ix++){const a=iz*5+ix,b=a+1,c=a+5,d=c+1;if(side>0)idx.push(a,c,b,b,c,d);else idx.push(a,b,c,b,d,c);}
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();add(g,rand()<.2?tileAlt:mat,parent);
    }
    // Exposed verge boards describe the upturned eaves under individual tile courses.
    for(const x of [-length/2,length/2])for(const s of [-1,1]){
      const points=[];for(let i=0;i<=12;i++){let z=i/12*halfWidth;points.push([cx+x,arch(z)-.1,cz+s*z]);}tube(parent,points,.09,wood,false,16);
    }
    for(const s of [-1,1])beam(parent,[cx-length/2,arch(halfWidth)-.1,cz+s*halfWidth],[cx+length/2,arch(halfWidth)-.1,cz+s*halfWidth],.13,.14,wood);
    for(let i=0;i<Math.ceil(length/.47);i++){
      const x=cx-length/2+i*.47+.2;
      const g=polygon([[-.25,-.035],[.25,-.035],[.29,.04],[.19,.14],[0,.2],[-.19,.14],[-.29,.04]],.36,.018);
      add(g,tileEdge,parent,[x,cy+.015,cz],[0,Math.PI/2,0]);
    }
  }
  function bench(parent,x,y,z,length=2.5){
    for(let i=0;i<4;i++)panel(parent,x,y+.48,z-.3+i*.18,length,.07,.145,warmWood,.012);
    for(let i=0;i<3;i++)panel(parent,x,y+.87+i*.14,z+.35,length,.105,.07,warmWood,.014);
    for(const s of [-1,1]){const xx=x+s*(length/2-.3);beam(parent,[xx,y,z-.25],[xx,y+.5,z-.25],.09,.09,metal);beam(parent,[xx,y,z+.27],[xx,y+1.21,z+.36],.09,.09,metal);beam(parent,[xx,y+.46,z-.33],[xx,y+.46,z+.39],.08,.09,metal);}
  }
  function plant(parent,x,y,z,scale=1,flower=false){
    turned(parent,[x,y,z],[[.25*scale,0],[.32*scale,.06*scale],[.39*scale,.5*scale],[.42*scale,.53*scale],[.4*scale,.61*scale],[.33*scale,.61*scale],[.32*scale,.49*scale]],rust,10);
    for(let n=0;n<8;n++){
      const a=rand()*Math.PI*2,len=(.45+rand()*.45)*scale;
      const bx=x+Math.cos(a)*.35*scale,bz=z+Math.sin(a)*.35*scale;
      tube(parent,[[x,y+.51*scale,z],[bx,y+.65*scale+len*.3,bz],[bx*1+.1*Math.cos(a),y+.6*scale+len,bz+.1*Math.sin(a)]],.012*scale,foliage,false,5);
      const leaf=polygon([[0,0],[.10*scale,.18*scale],[.04*scale,.34*scale],[-.08*scale,.18*scale]],.012*scale,0);
      add(leaf,foliage,parent,[bx,y+.65*scale+len*.35,bz],[.6,a,-.5]);
      if(flower&&n%2===0){
        for(let k=0;k<5;k++){const pa=k*Math.PI*2/5;add(polygon([[0,0],[.055*scale,.035*scale],[.072*scale,.105*scale],[0,.14*scale],[-.065*scale,.1*scale],[-.05*scale,.03*scale]],.013,0),flowerPink,parent,[bx,y+.6*scale+len,bz],[Math.PI/2,0,pa]);}
      }
    }
  }
  function lantern(parent,x,y,z,scale=1){
    turned(parent,[x,y,z],[[.52,0],[.57,.12],[.39,.24],[.29,.28],[.24,.84],[.35,.97],[.43,1.06],[.43,1.14]].map(p=>p.map(a=>a*scale)),stone,8);
    panel(parent,x,y+1.43*scale,z,.43*scale,.48*scale,.43*scale,glow,.025);
    for(const sx of [-1,1])for(const sz of [-1,1])beam(parent,[x+sx*.29*scale,y+1.12*scale,z+sz*.29*scale],[x+sx*.25*scale,y+1.71*scale,z+sz*.25*scale],.1*scale,.1*scale,stone);
    turned(parent,[x,y,z],[[.42,1.7],[.7,1.75],[.66,1.83],[.46,1.96],[.32,2.11],[.13,2.17],[.11,2.28],[.025,2.35]].map(p=>p.map(a=>a*scale)),stone,8);
    practical(parent,x,y+1.48*scale,z,9,7);
  }

  const station = new THREE.Group();scene.add(station);
  const routePoint=world.curve.getPointAt(world.stationU), tangent=world.curve.getTangentAt(world.stationU);
  station.position.copy(routePoint);station.rotation.y=-Math.atan2(tangent.z,tangent.x);
  station.updateMatrixWorld(true);
  // Retaining masonry is keyed down to the hillside rather than floating above it.
  for(let edge of [1.16,5.13])for(let x=-11.65;x<=11.7;x+=.78){
    const foot=station.localToWorld(new THREE.Vector3(x,0,edge)),bottom=world.height(foot.x,foot.z)-routePoint.y-.1;
    for(let y=-.01;y>bottom;y-=.34)panel(station,x,y-.15,edge,.73,.30,.42,(Math.floor(x*2)+Math.floor(y*3))%7===0?moss:stoneDark,.025);
  }
  // Platform edge faces the track, and the small forecourt is tucked behind it.
  panel(station,0,.215,3.2,24,.39,4.1,stoneDark,.035);
  panel(station,0,.49,3.15,24.3,.14,4.0,concrete,.02);
  for(let x=-11.6;x<11.7;x+=.78){
    panel(station,x,.590,1.26,.70,.032,.51,concrete,.006);
    panel(station,x,.613,1.73,.70,.024,.34,yellow,.004);
    for(let j=0;j<5;j++)panel(station,x-.25+j*.12,.639,1.73,.035,.013,.24,yellow,.003);
    for(let z=2.2;z<4.9;z+=.58)if(rand()<.22)panel(station,x,.593,z,.72,.020,.51,paving,.003);
  }
  // Fine open slot drainage runs behind the walking surface.
  panel(station,0,.585,4.93,23.6,.028,.16,black,.008);
  for(let x=-11.6;x<11.7;x+=.38)beam(station,[x,.61,4.85],[x,.61,5.00],.025,.025,metal);

  // The station forecourt is a supported terrace, continuous with the platform.
  // Its masonry follows the ground beneath every edge rather than hovering as
  // a flat slab. The wider outline also supports the bicycle and rear fence.
  function groundedCourt(outline,top){
    const contour=outline.map(([x,z])=>new THREE.Vector2(x,z));
    const capPositions=outline.flatMap(([x,z])=>[x,top,z]),capIndices=[];
    for(const face of THREE.ShapeUtils.triangulateShape(contour,[])){
      const [a,b,c]=face,pa=contour[a],pb=contour[b],pc=contour[c];
      if((pb.x-pa.x)*(pc.y-pa.y)-(pb.y-pa.y)*(pc.x-pa.x)>0)capIndices.push(a,c,b);else capIndices.push(a,b,c);
    }
    const cap=new THREE.BufferGeometry();cap.setAttribute('position',new THREE.Float32BufferAttribute(capPositions,3));cap.setIndex(capIndices);cap.computeVertexNormals();add(cap,concrete,station);
    const perimeter=[];
    for(let j=0;j<outline.length;j++){
      const a=outline[j],b=outline[(j+1)%outline.length],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.6);
      for(let k=0;k<n;k++)perimeter.push([THREE.MathUtils.lerp(a[0],b[0],k/n),THREE.MathUtils.lerp(a[1],b[1],k/n)]);
    }
    const wallPositions=[],wallIndices=[];
    for(const [x,z]of perimeter){
      const p=station.localToWorld(new THREE.Vector3(x,0,z)),bottom=Math.min(top-.06,world.height(p.x,p.z)-routePoint.y-.22);
      wallPositions.push(x,bottom,z,x,top-.038,z);
    }
    for(let j=0;j<perimeter.length;j++){
      const a=j*2,b=((j+1)%perimeter.length)*2;wallIndices.push(a,b,a+1,b,b+1,a+1);
    }
    const walls=new THREE.BufferGeometry();walls.setAttribute('position',new THREE.Float32BufferAttribute(wallPositions,3));walls.setIndex(wallIndices);walls.computeVertexNormals();
    add(walls,stoneDark,station);
    const rimPositions=[],rimIndices=[];
    for(const [x,z]of perimeter)rimPositions.push(x,top-.038,z,x,top,z);
    for(let j=0;j<perimeter.length;j++){const a=j*2,b=((j+1)%perimeter.length)*2;rimIndices.push(a,b,a+1,b,b+1,a+1);}
    const rim=new THREE.BufferGeometry();rim.setAttribute('position',new THREE.Float32BufferAttribute(rimPositions,3));rim.setIndex(rimIndices);rim.computeVertexNormals();add(rim,concrete,station);
  }
  groundedCourt([[-11.95,4.87],[-11.95,8.70],[-11.18,9.65],[-8.65,10.35],[-5.25,10.48],[1.95,10.38],[4.70,10.05],[7.15,9.80],[10.45,9.42],[11.60,8.55],[11.85,5.05],[10.80,4.87]],.61);
  // A few inset-looking repair stones preserve the worn, quiet yard surface.
  for(const [x,z,w,d]of [[3.25,6.7,.8,.55],[7.3,7.1,.9,.65],[9.7,6.9,.72,.61],[-10.7,7.4,.8,.64],[-9.3,8.1,.78,.56],[5.1,8.1,.9,.6]])panel(station,x,.609,z,w,.018,d,paving,.004);
  panel(station,2.78,.665,8.67,1.05,.10,1.08,stone,.015);
  panel(station,6.5,.623,5.54,.90,.028,.90,stone,.003);
  panel(station,5.82,.612,6.65,.61,.012,.56,paving,.002);
  panel(station,-7.65,.713,5.00,.57,.20,.54,stone,.007);

  const bx=-2.6,bz=7.35;
  panel(station,bx,.38,bz,10,.7,5.1,stone,.1);
  for(let n=0;n<15;n++)panel(station,bx-4.5+n*.63,.75,bz, .58,.15,4.76,oldWood,.024);
  panel(station,bx,2.01,bz,9.25,2.47,4.32,plaster,.065);
  // Board-clad lower wall, subtly different lengths and weathered seams.
  for(let side of [-1,1])for(let n=0;n<33;n++){
    const h=.91+rand()*.08;panel(station,bx-4.52+n*.28,.81+h/2,bz+side*2.245,.247,h,.074,rand()<.13?oldWood:warmWood,.011);
  }
  for(let xx of [-4.65,-2.3,0,2.3,4.65])for(let zz of [-2.25,2.25])beam(station,[bx+xx,.77,bz+zz],[bx+xx,3.45,bz+zz],.17,.17,wood);
  for(let zz of [-2.29,2.29])for(let yy of [1.63,3.37])beam(station,[bx-4.77,yy,bz+zz],[bx+4.77,yy,bz+zz],.17,.18,wood);
  // Gable panels and visible king post trusses.
  for(let s of [-1,1]){
    const g=polygon([[-2.26,0],[2.26,0],[0,1.34]],.13,.025);const o=add(g,plaster,station,[bx+s*4.66,3.37,bz],[0,Math.PI/2,0]);
    beam(station,[bx+s*4.78,3.38,bz],[bx+s*4.78,4.65,bz],.14,.14,wood);
    for(const z of [-2.24,2.24])beam(station,[bx+s*4.78,3.36,bz+z],[bx+s*4.78,4.68,bz],.13,.14,wood);
  }
  function windowAt(x,z,w=1.85){
    panel(station,x,2.27,z,w+.19,1.39,.11,wood,.029);
    panel(station,x,2.27,z-.066,w,1.21,.035,cabinGlow,.012);
    panel(station,x,2.27,z-.102,w-.065,1.15,.021,glass,.007);
    for(let j=-1;j<=1;j++)beam(station,[x+j*w/3,1.69,z-.128],[x+j*w/3,2.85,z-.128],.039,.045,warmWood);
    beam(station,[x-w/2,2.24,z-.13],[x+w/2,2.24,z-.13],.036,.045,warmWood);
    panel(station,x,1.57,z-.11,w+.22,.095,.3,wood,.021);
  }
  windowAt(bx-3.08,bz-2.27,1.92);windowAt(bx+2.9,bz-2.27,2.15);
  // The approach-side elevation has paired shoji windows and a sheltered doorway.
  for(const x of [bx-3.0,bx+2.9]){
    panel(station,x,2.28,bz+2.29,1.88,1.40,.12,wood,.03);
    panel(station,x,2.28,bz+2.362,1.68,1.20,.024,cabinGlow,.012);
    for(let j=0;j<5;j++)beam(station,[x-.78+j*.39,1.72,bz+2.387],[x-.78+j*.39,2.86,bz+2.387],.038,.041,warmWood);
    for(let y of [2.05,2.43])beam(station,[x-.82,y,bz+2.391],[x+.82,y,bz+2.391],.036,.039,warmWood);
  }
  panel(station,bx-.05,1.89,bz+2.28,1.58,2.18,.14,wood,.035);
  panel(station,bx-.05,1.89,bz+2.364,1.37,2.01,.029,warmWood,.014);
  panel(station,bx-.05,2.22,bz+2.388,1.17,1.14,.02,cabinGlow,.009);
  for(let j=0;j<4;j++)beam(station,[bx-.58+j*.36,1.66,bz+2.41],[bx-.58+j*.36,2.79,bz+2.41],.038,.038,wood);
  beam(station,[bx-.05,.91,bz+2.417],[bx-.05,2.91,bz+2.417],.045,.042,wood);
  label(station,'山あい','Y A M A A I',1.87,.48,[bx,3.10,bz+2.375]);
  // Pair of recessed sliding doors, with a glimpse of seating behind the glass.
  panel(station,bx-.1,1.92,bz-2.285,1.76,2.22,.14,wood,.03);
  for(let s of [-1,1]){
    const x=bx-.1+s*.406;panel(station,x,1.89,bz-2.365,.753,2.11,.065,warmWood,.014);
    panel(station,x,2.2,bz-2.409,.60,1.35,.018,cabinGlow,.005);
    for(let j=0;j<3;j++)beam(station,[x-.3,1.72+j*.41,bz-2.43],[x+.3,1.72+j*.41,bz-2.43],.033,.03,wood);
    beam(station,[x,1.54,bz-2.43],[x,2.88,bz-2.43],.03,.03,wood);
    beam(station,[x-s*.21,1.65,bz-2.45],[x-s*.21,1.9,bz-2.45],.033,.034,metal);
  }
  label(station,'山あい','Y A M A A I',2.36,.58,[bx,3.12,bz-2.355]);
  roof(station,bx,4.83,bz,11.15,3.42);
  // Rain gutters, curved downpipes and a gently folded metal platform canopy.
  for(let side of [-1,1])tube(station,[[bx-5.6,3.34,bz+side*3.39],[bx,3.30,bz+side*3.39],[bx+5.6,3.28,bz+side*3.39]],.058,metal,false,16);
  tube(station,[[bx+5.45,3.29,bz-3.39],[bx+5.48,2.95,bz-3.36],[bx+4.87,2.61,bz-2.61],[bx+4.84,.77,bz-2.59],[bx+5.04,.42,bz-2.69]],.052,metal,false,12);
  const canopyY=z=>3.20+.115*(z-1.3)+.025*Math.pow(z-3.0,2);
  for(let j=0;j<41;j++){
    const x=-9.2+j*.39;const points=[[-.193,canopyY(1.18)],[-.18,canopyY(1.18)+.025],[.18,canopyY(1.18)+.025],[.193,canopyY(1.18)]];
    const pos=[],idx=[];for(let k=0;k<=8;k++){const z=1.16+k*.48;for(let c=0;c<4;c++)pos.push(x+points[c][0],canopyY(z)+(c===1||c===2?.013:0),z);}
    for(let k=0;k<8;k++)for(let c=0;c<3;c++){const a=k*4+c;idx.push(a,a+4,a+1,a+1,a+4,a+5);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();add(g,zinc,station);
    beam(station,[x+.195,canopyY(1.17)+.016,1.17],[x+.195,canopyY(5)+.018,5],.029,.035,metal);
  }
  for(let x of [-8.45,-3.37,1.71,6.0]){
    beam(station,[x,.62,3.83],[x,3.47,3.83],.145,.145,wood);
    panel(station,x,.71,3.83,.25,.18,.26,stone,.03);
    beam(station,[x,3.02,1.28],[x,3.47,4.98],.125,.14,wood);
    beam(station,[x,2.65,3.83],[x,3.2,2.1],.093,.1,wood);
    beam(station,[x,2.7,3.83],[x,3.41,4.9],.09,.1,wood);
  }
  beam(station,[-9.45,3.13,1.28],[6.76,3.13,1.28],.15,.15,wood);
  beam(station,[-9.45,3.3,3.83],[6.76,3.3,3.83],.18,.17,wood);
  // Warm suspended platform luminaires and hand-painted directional boards.
  for(const x of [-6.2,.1,5.2]){
    beam(station,[x,3.31,2.8],[x,3.03,2.8],.032,.032,black);
    panel(station,x,3.0,2.8,1.12,.13,.28,cream,.015);panel(station,x,2.895,2.8,.99,.024,.19,glow,.005);practical(station,x,2.83,2.8,20,11);
  }
  // One cached shadow pool gives benches, joinery and flowers physical weight.
  // Other practical sources retain their inexpensive local point illumination.
  const platformPool=new THREE.SpotLight('#ffd39a',25,12,1.12,.58,2);
  platformPool.position.set(.1,2.85,2.8);platformPool.target.position.set(.1,.58,3.4);
  platformPool.castShadow=true;platformPool.shadow.mapSize.set(512,512);
  platformPool.shadow.camera.near=.12;platformPool.shadow.bias=-.0002;platformPool.shadow.normalBias=.024;
  platformPool.shadow.autoUpdate=false;platformPool.shadow.needsUpdate=true;
  station.add(platformPool,platformPool.target);lamps.push({light:platformPool,power:25});
  label(station,'山あい','YAMAAI',2.2,.61,[-6.1,2.59,3.99]);
  for(let x of [-7.08,-5.12])beam(station,[x,2.91,3.99],[x,3.29,3.99],.02,.02,metal);
  label(station,'1','',.37,.45,[4.99,2.67,3.73],'#34514a','#e9e5cc');
  bench(station,-8.1,.60,4.12,2.8);bench(station,3.86,.60,4.16,2.54);
  // Freestanding station-name board at the open end of the platform.
  for(const x of [8.02,10.46])beam(station,[x,.58,4.48],[x,2.6,4.48],.07,.08,cream);
  label(station,'山あい','← KAWANE     YAMAAI     MORI →',2.76,.83,[9.24,2.09,4.47]);
  // Timetable casing, fine schedule marks and small pinboard notices.
  panel(station,bx+1.65,2.1,bz-2.36,.62,1.13,.09,wood,.033);
  label(station,'時刻表','',.49,.96,[bx+1.65,2.1,bz-2.454]);
  panel(station,-7.99,2.17,5.10,.83,1.13,.058,wood,.015);
  for(let r=0;r<2;r++)for(let c=0;c<2;c++)panel(station,-8.18+c*.37,1.91+r*.46,5.040,.27,.36,.009,r===c?cream:yellow,.003);

  // A rounded, recessed vending cabinet. Individual bottles catch its soft light.
  const vx=4.58,vz=6.25;
  panel(station,vx,1.68,vz,1.12,2.14,.78,red,.055);
  panel(station,vx,1.87,vz-.478,.92,1.37,.040,cream,.012);
  panel(station,vx,2.13,vz-.512,.79,.76,.023,black,.007);
  panel(station,vx,2.13,vz-.541,.75,.73,.008,glow,.003);
  for(let r=0;r<2;r++)for(let c=0;c<5;c++){
    const x=vx-.29+c*.146, yy=1.89+r*.34;
    turned(station,[x,yy,vz-.582],[[.041,0],[.049,.025],[.049,.17],[.036,.2],[.026,.211],[.026,.246],[0,.246]],c%3===0?blue:c%3===1?red:cream,7);
    panel(station,x,yy-.045,vz-.606,.09,.028,.018,cream,.004);
  }
  panel(station,vx-.13,1.45,vz-.531,.50,.1,.011,black,.005);
  panel(station,vx+.31,1.7,vz-.531,.1,.17,.011,black,.005);
  panel(station,vx-.02,.97,vz-.476,.62,.24,.020,black,.008);
  label(station,'つめたい','',.76,.16,[vx,2.645,vz-.485],'#a44731','#efe6cf');
  plant(station,-10.9,.59,4.35,.87,true);plant(station,6.5,.64,5.54,1.1,true);plant(station,-7.65,.82,5.00,.61,false);
  // Broom, hose reel, watering can and a rain barrel at the station side.
  beam(station,[2.28,.86,8.3],[2.63,2.37,8.33],.035,.035,warmWood);
  add(polygon([[-.20,0],[.20,0],[.07,.34],[-.07,.34]],.10,.007),ropeMat,station,[2.28,.83,8.3]);
  turned(station,[2.78,.73,8.67],[[.38,0],[.46,.12],[.48,.89],[.44,1.02],[.38,1.025],[.38,.96]],oldWood,12);
  for(let y of [.99,1.46])turned(station,[2.78,y,8.67],[[.472,0],[.476,.07]],metal,12);
  turned(station,[5.82,.62,6.65],[[.18,0],[.23,.08],[.23,.37],[.18,.43],[.12,.44]],zinc,10);
  tube(station,[[5.99,.81,6.65],[6.22,.96,6.65],[6.34,1.12,6.65]],.032,zinc,false,8);
  tube(station,[[5.68,.75,6.65],[5.51,.93,6.65],[5.60,1.17,6.65],[5.8,1.10,6.65]],.025,zinc,false,10);
  // Bicycle: swept tire sections, open spokes, brazed frame and leather saddle.
  function bicycle(x,y,z){
    const wheelRadius=.43,centres=[x-.7,x+.7];
    for(const cx of centres){
      const pts=[];for(let j=0;j<40;j++){const a=j/40*Math.PI*2;pts.push([cx+Math.cos(a)*wheelRadius,y+.48+Math.sin(a)*wheelRadius,z]);}
      tube(station,pts,.035,black,true,40);const rim=pts.map(p=>[cx+(p[0]-cx)*.92,y+.48+(p[1]-y-.48)*.92,z]);tube(station,rim,.014,cream,true,40);
      for(let j=0;j<12;j++){const a=j/12*Math.PI*2;beam(station,[cx,y+.48,z],[cx+Math.cos(a)*wheelRadius*.9,y+.48+Math.sin(a)*wheelRadius*.9,z],.01,.01,metal);}
    }
    const rear=[x-.7,y+.48,z],pedal=[x-.1,y+.43,z],seat=[x-.32,y+1.01,z],neck=[x+.44,y+1.06,z],front=[x+.7,y+.48,z];
    for(const [a,b] of [[rear,pedal],[pedal,seat],[seat,rear],[seat,neck],[neck,pedal],[neck,front]])tube(station,[a,b],.025,red,false,2);
    beam(station,[x-.32,y+.9,z],[x-.37,y+1.19,z],.032,.032,metal);panel(station,x-.37,y+1.2,z,.32,.072,.22,wood,.04);
    tube(station,[[x+.43,y+1.01,z],[x+.40,y+1.28,z],[x+.34,y+1.31,z-.22]],.022,metal,false,6);
    tube(station,[[x+.40,y+1.27,z],[x+.40,y+1.29,z+.22]],.022,metal,false,3);
    beam(station,[x-.1,y+.43,z-.11],[x+.1,y+.33,z-.11],.02,.024,metal);panel(station,x+.1,y+.33,z-.17,.15,.035,.12,black,.01);
    tube(station,[[x-.85,y+.99,z-.15],[x-.65,y+1.05,z-.15],[x-.42,y+1.03,z-.15]],.018,metal,false,6);
    beam(station,[x-.45,y+.45,z],[x-.45,y+.01,z+.25],.018,.018,metal);
  }
  bicycle(8.39,.6,6.01);
  for(let x=-11.4;x<12;x+=1.4){
    if((x>-7.5&&x<3)||(x>4.1&&x<6.7))continue;
    beam(station,[x,.3,8.84],[x,1.75,8.84],.09,.1,oldWood);
    if(x<10.9&&!(x>3.9&&x<6.7))for(let y of [.99,1.49])beam(station,[x,y,8.84],[x+1.4,y,8.84],.075,.065,oldWood);
  }
  practical(station,bx,2.24,bz-1.74,18,8);

  // A tiny mountain sanctuary, partially hidden above its irregular stair path.
  const shrine = new THREE.Group();scene.add(shrine);
  const shrineY=world.height(-43,-12)+.24;shrine.position.set(-43,shrineY,-12);shrine.rotation.y=-.28;
  world.shrineCenter=new THREE.Vector3(-43,shrineY,-12);
  panel(shrine,0,.20,0,5.05,.38,5.05,stoneDark,.05);
  for(let ix=0;ix<5;ix++)for(let iz=0;iz<5;iz++)panel(shrine,-2+ix,.482,-2+iz,.94,.095,.94,(ix+iz)%4===0?moss:stone,.01);
  panel(shrine,0,.71,-.26,3.72,.44,3.47,wood,.07);
  for(let j=0;j<16;j++)panel(shrine,-1.72+j*.23,.972,-.3,.20,.09,3.3,warmWood,.012);
  panel(shrine,0,2.06,-.7,3.20,2.10,2.65,wood,.05);
  for(let side of [-1,1])for(let j=0;j<17;j++)panel(shrine,side*1.638,2.03,-1.91+j*.151,.078,1.91,.11,warmWood,.015);
  for(let x of [-1.53,1.53])for(let z of [-1.96,.63])beam(shrine,[x,.94,z],[x,3.25,z],.17,.17,warmWood);
  for(const x of [-.77,.77]){
    panel(shrine,x,2.14,.659,1.33,1.94,.064,warmWood,.014);
    panel(shrine,x,2.14,.702,1.19,1.76,.028,black,.004);
    for(let j=0;j<10;j++)beam(shrine,[x-.56+j*.124,1.3,.741],[x-.56+j*.124,2.99,.741],.04,.04,warmWood);
    beam(shrine,[x-.61,2.02,.759],[x+.61,2.02,.759],.046,.042,warmWood);
  }
  roof(shrine,0,4.15,-.7,4.85,2.52,tile);
  for(const x of [-1.75,1.75]){beam(shrine,[x,.97,1.45],[x,2.98,1.45],.13,.14,warmWood);beam(shrine,[x,2.46,1.45],[x,3.18,.71],.10,.10,wood);}
  // A deep small porch with paired brackets and a carved beam.
  beam(shrine,[-1.85,2.99,1.47],[1.85,2.99,1.47],.23,.18,warmWood);
  for(let x of [-1.55,1.55]){add(polygon([[-.25,0],[.28,0],[.18,.14],[.13,.35],[-.12,.35],[-.17,.14]],.24,.02),wood,shrine,[x,2.82,1.46]);}
  const porchRoof=[];for(let j=0;j<=6;j++){const z=.75+j*.2;porchRoof.push([z,3.56-(z-.75)*.44+.08*(z-.75)**2]);}
  for(let j=0;j<15;j++){
    const x=-1.98+j*.28;const pos=[],idx=[];for(let k=0;k<porchRoof.length;k++)for(let q=0;q<3;q++)pos.push(x+q*.14,porchRoof[k][1]+(q===1?.04:0),porchRoof[k][0]);
    for(let k=0;k<porchRoof.length-1;k++)for(let q=0;q<2;q++){let a=k*3+q;idx.push(a,a+3,a+1,a+1,a+3,a+4);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();add(g,tile,shrine);
  }
  for(let n=0;n<3;n++)panel(shrine,0,.20+n*.23,2.35-n*.38,2.4,.25,.7,stone,.065);
  // Shimenawa rope and folded paper offerings.
  const ropePoints=[];for(let j=0;j<=16;j++){const x=-1.52+j*3.04/16;ropePoints.push([x,2.7-.2*(1-(x/1.52)**2),1.12]);}
  tube(shrine,ropePoints,.057,ropeMat,false,30);
  for(let j=0;j<3;j++){
    const x=-.76+j*.76;const g=polygon([[-.045,0],[.07,0],[.07,-.14],[.19,-.23],[.11,-.32],[.2,-.42],[.12,-.53],[-.01,-.41],[.04,-.32],[-.07,-.24],[-.01,-.16]],.009,0);add(g,cream,shrine,[x,2.52,1.15]);
  }
  panel(shrine,0,1.29,1.6,.96,.50,.61,oldWood,.024);
  for(let j=0;j<9;j++)panel(shrine,-.40+j*.10,1.60,1.6,.055,.06,.53,wood,.005);
  tube(shrine,[[0,3.1,1.19],[.02,2.25,1.25],[0,1.61,1.43]],.035,ropeMat,false,12);
  turned(shrine,[0,2.94,1.2],[[.09,0],[.16,.07],[.16,.16],[.07,.25],[0,.28]],rust,10);
  lantern(shrine,-2.58,.02,2.38,.81);lantern(shrine,2.58,.03,2.38,.81);
  // A torii with subtly splayed tapered pillars and a swept, rising crown.
  const gate = new THREE.Group();scene.add(gate);
  gate.position.set(-44.1,world.height(-44.1,-3.7)+.07,-3.7);gate.rotation.y=-.28;
  for(const s of [-1,1]){
    beam(gate,[s*1.37,0,0],[s*1.18,3.54,0],.25,.27,red,.77);
    turned(gate,[s*1.36,0,0],[[.27,0],[.30,.14],[.24,.25],[.18,.27]],stone,8);
    panel(gate,s*1.2,2.83,0,.55,.15,.38,red,.025);
  }
  beam(gate,[-1.83,2.9,0],[1.83,2.9,0],.19,.22,red);
  const crownShape=[[-2.22,.15],[-1.73,.05],[-.8,0],[.8,0],[1.73,.05],[2.22,.15],[2.11,.36],[1.65,.22],[.7,.17],[-.7,.17],[-1.65,.22],[-2.11,.36]];
  add(polygon(crownShape,.39,.025),wood,gate,[0,3.47,0]);
  add(polygon([[-2.02,0],[-1.57,-.06],[1.57,-.06],[2.02,0],[1.96,.11],[1.55,.06],[-1.55,.06],[-1.96,.11]],.30,.02),red,gate,[0,3.41,0]);
  beam(gate,[0,2.89,0],[0,3.48,0],.20,.12,red);label(gate,'山神','',.35,.52,[0,3.11,.154],'#453c28','#cbbb86');

  // Stair treads follow the terrain, with staggered retaining stones and mossy margins.
  const stairs=new THREE.Group();scene.add(stairs);
  const pathA=new THREE.Vector3(-45.2,0,4.1),pathB=new THREE.Vector3(-43.9,0,-8.5);
  for(let i=0;i<29;i++){
    const u=i/28,x=THREE.MathUtils.lerp(pathA.x,pathB.x,u),z=THREE.MathUtils.lerp(pathA.z,pathB.z,u);
    const yy=world.height(x,z)+.22;
    const step=panel(stairs,x,yy-.16,z,1.65+rand()*.12,.34,.52,rand()<.18?paving:stone,.045);step.rotation.y=-.1;
    for(const s of [-1,1])if(i%2===0){
      const o=panel(stairs,x+s*.89,yy-.21,z,.36,.46+rand()*.24,.60,rand()<.3?moss:stoneDark,.065);o.rotation.y=-.1+rand()*.1;
    }
  }
  // Small foundation masonry rises organically beneath the back of the sanctuary.
  for(let r=0;r<3;r++)for(let c=0;c<8;c++){
    const x=-45.35+c*.67+(r%2)*.14,z=-14.51,y=shrineY-.22-r*.40;
    if(y>world.height(x,z)-.15)panel(scene,x,y,z,.61,.37,.59,rand()<.23?moss:stoneDark,.08);
  }

  // One inhabited farmhouse peeks through the trees behind the approach path.
  const house=new THREE.Group();house.name='Farmhouse above the station approach';scene.add(house);
  house.position.set(-44,0,18);house.rotation.y=.21;
  const housePoint=(x,z)=>new THREE.Vector3(x,0,z).applyAxisAngle(new THREE.Vector3(0,1,0),house.rotation.y).add(house.position);
  let houseSill=-Infinity;
  for(let x=-2.75;x<=2.76;x+=.55)for(let z=-2.2;z<=2.21;z+=.44){const p=housePoint(x,z);houseSill=Math.max(houseSill,world.height(p.x,p.z));}
  house.position.y=houseSill+.10;
  // Site clearance includes the roof and planter, rather than only the walls.
  world.farmhouseSite={x:house.position.x,z:house.position.z,yaw:house.rotation.y};
  world.nearFarmhouse=(x,z,padding=0)=>{const dx=x-house.position.x,dz=z-house.position.z,c=Math.cos(house.rotation.y),s=Math.sin(house.rotation.y);return Math.abs(dx*c-dz*s)<3.65+padding&&Math.abs(dx*s+dz*c)<3.10+padding;};
  // Individual stone courses meet the hillside beneath the level sill.
  for(let side=0;side<4;side++)for(let i=0,n=side<2?9:7;i<n;i++){
    const x=side<2?-2.48+i*.62:(side===2?-2.65:2.65),z=side<2?(side===0?-2.08:2.08):-1.86+i*.62;
    const p=housePoint(x,z),bottom=world.height(p.x,p.z)-house.position.y-.16;
    for(let top=.045;top>bottom;top-=.30){const h=Math.min(.285,top-bottom);panel(house,x,top-h/2,z,side<2?.59:.35,h,side<2?.35:.59,(i+side)%4===0?stone:stoneDark,Math.min(.025,h*.2));}
  }
  panel(house,0,.2,0,5.5,.4,4.4,stoneDark,.10);panel(house,0,1.65,0,5.0,2.65,3.95,plaster,.06);
  for(let x of [-2.46,0,2.46])for(let z of [-1.97,1.97])beam(house,[x,.35,z],[x,3.07,z],.13,.13,wood);
  for(let x=-2.36;x<2.4;x+=.23)panel(house,x,.81,2.0,.204,.92,.069,oldWood,.014);
  for(let x of [-1.23,1.15]){panel(house,x,1.86,2.025,1.45,1.24,.05,wood,.014);panel(house,x,1.86,2.100,1.29,1.10,.023,cabinGlow,.006);for(let j=0;j<4;j++)beam(house,[x-.6+j*.4,1.33,2.140],[x-.6+j*.4,2.39,2.140],.041,.035,wood);}
  for(let s of [-1,1])add(polygon([[-1.98,0],[1.98,0],[0,1.18]],.11,.02),plaster,house,[s*2.49,2.98,0],[0,Math.PI/2,0]);
  roof(house,0,4.2,0,6.25,2.89,tileAlt);practical(house,1.15,1.8,2.3,8,5);
  const potGround=[];
  for(let i=0;i<8;i++){const a=i*Math.PI/4,p=housePoint(-2.9+Math.cos(a)*.36,2.36+Math.sin(a)*.36);potGround.push(world.height(p.x,p.z)-house.position.y);}
  const potTop=Math.max(...potGround)+.035,potBottom=Math.min(...potGround)-.08;
  panel(house,-2.9,(potTop+potBottom)/2,2.36,.68,potTop-potBottom,.68,stone,.018);
  plant(house,-2.9,potTop,2.36,.7,true);

  // Bake permanent architecture into a few finishes, retaining every shadow gap.
  scene.updateMatrixWorld(true);
  const buckets = new Map();
  for(const object of objects){
    let g=object.geometry.clone();g.applyMatrix4(object.matrixWorld);if(g.index)g=g.toNonIndexed();
    if(object.material!==cabinGlow)g.deleteAttribute('uv');g.deleteAttribute('uv1');g.deleteAttribute('color');
    // Texture-mapped signs need their UVs, so leave those small objects independent.
    if(object.material.map){g.dispose();continue;}
    if(!buckets.has(object.material))buckets.set(object.material,[]);buckets.get(object.material).push(g);object.removeFromParent();object.geometry.dispose();
  }
  for(const [material,geometries] of buckets){
    const g=mergeGeometries(geometries,false);for(const piece of geometries)piece.dispose();
    if(!g)continue;const mesh=new THREE.Mesh(g,material);mesh.castShadow=true;mesh.receiveShadow=true;mesh.name=material.name||'village details';scene.add(mesh);
  }
  const stationTarget=station.localToWorld(new THREE.Vector3(-2,1.7,4.6));
  const shrineTarget=shrine.localToWorld(new THREE.Vector3(0,1.6,0));
  return {
    stationTarget,shrineTarget,lights:lamps.map(p=>p.light),
    update(time, night, rain) {
      const n=THREE.MathUtils.smoothstep(night,.12,.88);
      for(let i=0;i<lamps.length;i++)lamps[i].light.intensity=lamps[i].power*(.035+.965*n);
      glow.emissiveIntensity=.12+n*2.3;cabinGlow.emissiveIntensity=.06+n*.75;
      glass.opacity=.71+n*.08;
    }
  };
}
