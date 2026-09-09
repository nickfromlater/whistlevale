
'use strict';

// Alder Valley. A self-contained WebGL 2 miniature, with no external assets or libraries.
const $=id=>document.getElementById(id), TAU=Math.PI*2, PI=Math.PI;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)), mix=(a,b,t)=>a+(b-a)*t, smooth=(a,b,x)=>{x=clamp((x-a)/(b-a));return x*x*(3-2*x)};
let seed=72491; const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return(seed>>>0)/4294967296}, rnd=(a,b)=>mix(a,b,rand());
const V=(x=0,y=0,z=0)=>[x,y,z], add=(a,b)=>a.map((v,i)=>v+b[i]), sub=(a,b)=>a.map((v,i)=>v-b[i]), mul=(a,k)=>a.map(v=>v*k), dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2], cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]], len=a=>Math.hypot(...a), norm=a=>mul(a,1/(len(a)||1)), lerpV=(a,b,t)=>a.map((v,i)=>mix(v,b[i],t));
const colorCache=new Map();function col(hex){if(Array.isArray(hex))return hex;if(colorCache.has(hex))return colorCache.get(hex);let h=parseInt(hex.replace('#',''),16),c=[(h>>16&255)/255,(h>>8&255)/255,(h&255)/255];colorCache.set(hex,c);return c}const shade=(c,v)=>col(c).map(x=>clamp(x*v));
const ident=()=>new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
function mm(a,b){let o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];return o}
function trans(x,y,z){let a=ident();a[12]=x;a[13]=y;a[14]=z;return a}function scaling(x,y=x,z=x){let a=ident();a[0]=x;a[5]=y;a[10]=z;return a}
function rx(t){let a=ident(),c=Math.cos(t),s=Math.sin(t);a[5]=c;a[6]=s;a[9]=-s;a[10]=c;return a}function ry(t){let a=ident(),c=Math.cos(t),s=Math.sin(t);a[0]=c;a[2]=-s;a[8]=s;a[10]=c;return a}function rz(t){let a=ident(),c=Math.cos(t),s=Math.sin(t);a[0]=c;a[1]=s;a[4]=-s;a[5]=c;return a}
function transform(p,m){return[m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12],m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13],m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14]]}
function normalCofactors(m){
 // Keep these as JS doubles: Float32 would round before normalization and
 // change the emitted normals under nonuniform scale or nested transforms.
 return[m[5]*m[10]-m[6]*m[9],m[6]*m[8]-m[4]*m[10],m[4]*m[9]-m[5]*m[8],m[9]*m[2]-m[10]*m[1],m[10]*m[0]-m[8]*m[2],m[8]*m[1]-m[9]*m[0],m[1]*m[6]-m[2]*m[5],m[2]*m[4]-m[0]*m[6],m[0]*m[5]-m[1]*m[4]];
}
function normalTransform(n,m,c=normalCofactors(m)){
 // Preserve the original cross-product sum order and reciprocal length.
 const x=(c[0]*n[0]+c[3]*n[1])+c[6]*n[2],y=(c[1]*n[0]+c[4]*n[1])+c[7]*n[2],z=(c[2]*n[0]+c[5]*n[1])+c[8]*n[2],s=1/(Math.hypot(x,y,z)||1);
 return[x*s,y*s,z*s];
}
function lookAt(eye,target){let z=norm(sub(eye,target)),x=norm(cross([0,1,0],z)),y=cross(z,x);return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1])}
function perspective(fov,aspect,near,far){let f=1/Math.tan(fov/2),nf=1/(near-far);return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*nf,-1,0,0,2*far*near*nf,0])}
function ortho(l,r,b,t,n,f){return new Float32Array([2/(r-l),0,0,0,0,2/(t-b),0,0,0,0,-2/(f-n),0,-(r+l)/(r-l),-(t+b)/(t-b),-(f+n)/(f-n),1])}
function basis(p,f){f=norm(f);const reference=Math.abs(f[1])>.999?[0,0,1]:[0,1,0];let right=norm(cross(reference,f)),up=cross(f,right);return new Float32Array([...right,0,...up,0,...f,0,...p,1])}
function hash(x,z){let a=Math.sin(x*127.1+z*311.7)*43758.5453123;return a-Math.floor(a)}
function noise(x,z){let ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz;fx=fx*fx*(3-2*fx);fz=fz*fz*(3-2*fz);return mix(mix(hash(ix,iz),hash(ix+1,iz),fx),mix(hash(ix,iz+1),hash(ix+1,iz+1),fx),fz)}
function fbm(x,z){return .56*noise(x,z)+.28*noise(x*2.03,z*2.03)+.16*noise(x*4.07,z*4.07)}
// Reuse unit topology across trees, wheels, lamps and miniature figures.
// These points are read-only inputs; transforms and colours remain per instance.
const primitiveCircles=new Map(),primitiveSpheres=new Map();
function primitiveCircle(segments){
 let points=primitiveCircles.get(segments);
 if(!points){points=[];for(let i=0;i<=Math.ceil(segments);i++){const a=i*TAU/segments;points.push([Math.cos(a),Math.sin(a)]);}primitiveCircles.set(segments,points);}
 return points;
}
function primitiveSphere(segments,rings){
 const key=segments+','+rings;let points=primitiveSpheres.get(key);
 if(!points){
  points=[];const circle=primitiveCircle(segments);
  for(let j=0;j<=Math.ceil(rings);j++){const t=j*PI/rings,s=Math.sin(t),c=Math.cos(t);for(const [x,z]of circle)points.push([s*x,c,s*z]);}
  primitiveSpheres.set(key,points);
 }
 return points;
}
class Builder{
 constructor(){this.data=[];this.m=ident();this.stack=[];this.normalMatrix=null;this.normalStack=[]}
 push(x=0,y=0,z=0,ax=0,ay=0,az=0,sx=1,sy=sx,sz=sx){this.stack.push(this.m);this.normalStack.push(this.normalMatrix);this.normalMatrix=null;this.m=mm(this.m,mm(trans(x,y,z),mm(ry(ay),mm(rx(ax),mm(rz(az),scaling(sx,sy,sz))))));return this}
 matrix(m){this.stack.push(this.m);this.normalStack.push(this.normalMatrix);this.normalMatrix=null;this.m=mm(this.m,m);return this}pop(){this.m=this.stack.pop()||ident();this.normalMatrix=this.normalStack.pop()||null;return this}
 vertex(p,n,c,mat=0,uv=null){
  // Millions of vertices share this path. Write scalar attributes directly,
  // retaining double precision and the original transform/normal sum order.
  const m=this.m,k=this.normalMatrix||(this.normalMatrix=normalCofactors(m)),rgb=col(c);
  const nx=(k[0]*n[0]+k[3]*n[1])+k[6]*n[2],ny=(k[1]*n[0]+k[4]*n[1])+k[7]*n[2],nz=(k[2]*n[0]+k[5]*n[1])+k[8]*n[2],s=1/(Math.hypot(nx,ny,nz)||1);
  const data=this.data;let i=data.length;
  data[i++]=m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12];data[i++]=m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13];data[i++]=m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14];
  data[i++]=nx*s;data[i++]=ny*s;data[i++]=nz*s;
  data[i++]=rgb[0];data[i++]=rgb[1];data[i++]=rgb[2];data[i++]=mat;data[i++]=uv?uv[0]:0;data[i]=uv?uv[1]:0;
 }
 tri(a,b,c,color,mat=0,ns=null,uv=null){let n=ns?null:norm(cross(sub(b,a),sub(c,a)));this.vertex(a,ns?ns[0]:n,color,mat,uv?uv[0]:[0,0]);this.vertex(b,ns?ns[1]:n,color,mat,uv?uv[1]:[0,0]);this.vertex(c,ns?ns[2]:n,color,mat,uv?uv[2]:[0,0])}
 quad(a,b,c,d,color,mat=0,n=null,uv=null){this.tri(a,b,c,color,mat,n?[n,n,n]:null,uv?[uv[0],uv[1],uv[2]]:null);this.tri(a,c,d,color,mat,n?[n,n,n]:null,uv?[uv[0],uv[2],uv[3]]:null)}
 box(x,y,z,w,h,d,color,mat=0){let X=w/2,Y=h/2,Z=d/2;this.push(x,y,z);this.quad([-X,-Y,Z],[X,-Y,Z],[X,Y,Z],[-X,Y,Z],color,mat);this.quad([X,-Y,-Z],[-X,-Y,-Z],[-X,Y,-Z],[X,Y,-Z],shade(color,.91),mat);this.quad([X,-Y,Z],[X,-Y,-Z],[X,Y,-Z],[X,Y,Z],color,mat);this.quad([-X,-Y,-Z],[-X,-Y,Z],[-X,Y,Z],[-X,Y,-Z],color,mat);this.quad([-X,Y,Z],[X,Y,Z],[X,Y,-Z],[-X,Y,-Z],shade(color,1.04),mat);this.quad([-X,-Y,-Z],[X,-Y,-Z],[X,-Y,Z],[-X,-Y,Z],shade(color,.75),mat);this.pop();return this}
 cylinder(x,y,z,r1,r2,h,color,mat=0,segs=12,ax=0,az=0){
  this.push(x,y,z,ax,0,az);const circle=primitiveCircle(segs);
  for(let i=0;i<segs;i++){
   const a=circle[i],b=circle[i+1],pa=[a[0]*r1,-h/2,a[1]*r1],pb=[b[0]*r1,-h/2,b[1]*r1],pc=[b[0]*r2,h/2,b[1]*r2],pd=[a[0]*r2,h/2,a[1]*r2],na=norm([a[0],(r1-r2)/h,a[1]]),nb=norm([b[0],(r1-r2)/h,b[1]]);
   this.tri(pa,pd,pc,color,mat,[na,na,nb]);this.tri(pa,pc,pb,color,mat,[na,nb,nb]);if(r2>0)this.tri([0,h/2,0],pc,pd,shade(color,1.05),mat);if(r1>0)this.tri([0,-h/2,0],pa,pb,color,mat);
  }
  this.pop();return this;
 }
 sphere(x,y,z,sx,sy,sz,color,mat=0,segments=10,rings=7,flat=false){
  this.push(x,y,z,0,0,0,sx,sy,sz);const points=primitiveSphere(segments,rings),stride=Math.ceil(segments)+1;
  for(let j=0;j<rings;j++)for(let i=0;i<segments;i++){
   const k=j*stride+i,a=points[k],b=points[k+stride],c=points[k+stride+1],d=points[k+1],tint=flat?shade(color,.93+.13*hash(i,j)):color;
   this.tri(a,c,b,tint,mat,flat?null:[a,c,b]);this.tri(a,d,c,tint,mat,flat?null:[a,d,c]);
  }
  this.pop();return this;
 }
 beam(a,b,r,color,mat=0,sides=6){let f=sub(b,a),m=basis(mul(add(a,b),.5),f);this.matrix(m);this.cylinder(0,0,0,r,r,len(f),color,mat,sides,PI/2);this.pop();return this}
 mesh(){return upload(this.data)}
}
const canvas=$('world');let gl,mainProgram,shadowProgram,postProgram,particleProgram,staticMesh,groundMesh,waterMesh,atlasTexture,whiteTexture,sceneFbo,sceneTex,sceneDepth,shadowFbo,shadowTex,shadowSize=3072,shadowCacheFbo,shadowCacheTex,shadowDirty=true,screenW=0,screenH=0;
const I=ident();let VP=ident(),lightVP=ident(),cameraPos=[38,44,62],cameraTarget=[0,1,0],sunDir=norm([-48,74,-25]);let clock=0,night=.62,targetNight=.62,viewMode='room',reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const VS=`#version 300 es
precision highp float;
layout(location=0)in vec3 aPosition;layout(location=1)in vec3 aNormal;layout(location=2)in vec3 aColor;layout(location=3)in float aMat;layout(location=4)in vec2 aUV;
uniform mat4 uModel,uVP,uLightVP;uniform float uTime;out vec3 vPos,vNormal,vColor;out float vMat;out vec2 vUV;out vec4 vShadow;
void main(){vec4 p=uModel*vec4(aPosition,1.);if(abs(aMat-8.)<.1){p.x+=sin(uTime*.9+p.x*.71+p.z*.28)*.021; p.z+=sin(uTime*.67+p.z*.55)*.012;}if(abs(aMat-15.)<.1)p.xyz+=normalize(mat3(uModel)*aNormal)*.007;if(abs(aMat-32.)<.1)p.xyz+=normalize(mat3(uModel)*aNormal)*.035;vPos=p.xyz;vNormal=normalize(mat3(uModel)*aNormal);vColor=aColor;vMat=aMat;vUV=aUV;vShadow=uLightVP*p;gl_Position=uVP*p;}`;
const FS=`#version 300 es
precision highp float;
in vec3 vPos,vNormal,vColor;in float vMat;in vec2 vUV;in vec4 vShadow;
uniform sampler2D uShadow,uAtlas,uRoomAtlas;
uniform vec3 uEye,uSun,uHead,uForward,uLamps[8],uRoomLights[6];
uniform float uNight,uTime,uRoomLevel,uRain,uPreview,uInvalid;out vec4 frag;
float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float shadow(vec3 n){vec3 p=vShadow.xyz/vShadow.w*.5+.5;if(p.x<0.||p.x>1.||p.y<0.||p.y>1.||p.z>1.)return 1.;float bias=max(.00024,.00064*(1.-dot(n,uSun)));float s=0.;vec2 texel=1./vec2(textureSize(uShadow,0));for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++){float w=(x==0?2.:1.)*(y==0?2.:1.);s+=w*(p.z-bias<texture(uShadow,p.xy+vec2(x,y)*texel*1.05).r?1.:0.);}return s/16.;}
void main(){float m=floor(vMat+.5);vec3 n=normalize(vNormal);if(!gl_FrontFacing)n=-n;vec3 p=vPos,base=vColor;float rough=.78,metal=0.,em=0.;
 float dusk=smoothstep(.08,.62,uNight),deepNight=smoothstep(.70,1.,uNight),sunlight=pow(1.-dusk,1.7);
 if(m==1.||m==11.){rough=.3;metal=.72;}
 if(m==2.){float w=noise(vec3(p.x*.75,p.y*12.,p.z*8.));base*=.87+.21*w;rough=.55;}
 if(m==3.){float textureN=noise(p*4.5);base*=.87+.18*textureN;rough=.97;}
 if(m==4.){float row=floor(p.y*4.2);vec2 brick=vec2(fract((abs(n.z)>.7?p.x:p.z)*2.2+mod(row,2.)*.5),fract(p.y*4.2));float mortar=1.-smoothstep(.018,.048,min(brick.x,brick.y));base*=mix(.9+.1*noise(p*8.),.70,mortar*.65);rough=.92;}
 if(m==5.){float r=fract(p.y*8.);base*=.86+.14*smoothstep(.02,.13,r);rough=.74;}
 if(m==6.){base=mix(base,vec3(1.,.68,.34),dusk*.94);em=dusk*1.25;rough=.19;metal=.24;}
 if(m==8.){base*=.87+.23*noise(p*19.);rough=.95;}
 if(m==44.){float streak=sin(p.x*33.+p.y*5.+uTime*5.5)*.06+sin(p.z*42.-uTime*4.)*.04;base*=.89+streak;em=.12;rough=.22;}
 if(m==9.){base*=.77+.37*noise(p*26.);rough=.96;}
 if(m==10.){em=mix(.38,3.0,dusk);rough=.3;}
 if(m==15.){base=texture(uAtlas,vUV).rgb;rough=.79;}
 if(m==20.){base*=.955+.06*noise(p*1.4);rough=.95;}
 if(m==21.){
  vec2 q=p.xz;float row=floor(q.x/2.6);float joint=fract((q.y+mod(row,3.)*4.1)/13.);float side=fract(q.x/2.6);float seam=min(min(joint,1.-joint)*13.,min(side,1.-side)*2.6);
  float cell=hash(vec3(row,floor((q.y+mod(row,3.)*4.1)/13.),1.));float grain=noise(vec3(q.x*7.,q.y*.075,cell*4.));base=mix(vec3(.43,.32,.21),vec3(.68,.53,.35),cell*.65+grain*.30);float seamAA=max(fwidth(seam),.004);base*=1.-.30*(1.-smoothstep(.008-seamAA,.026+seamAA,seam));base*=.93+.10*noise(vec3(q.x*21.,0.,q.y*.32));rough=.47;metal=.045;
 }
 if(m==22.){vec3 q=abs(n.y)>.65?p.xzy:p;float gr=noise(vec3(q.x*.14,q.y*5.5,q.z*6.));base*=.88+.20*gr;rough=.45;metal=.06;}
 if(m==23.){base*=.96+.05*noise(p*14.);rough=.8;}
 if(m==24.){base*=.91+.15*noise(p*6.);rough=.42;}
 if(m==25.){em=3.0*uRoomLevel+.025;rough=.32;}
 if(m==32.||m==33.){base=texture(uRoomAtlas,vUV).rgb;rough=.83;}
 if(m==40.){rough=.22;metal=.35;base*=.975+.025*noise(p*35.);}
 if(m==41.){rough=.17;metal=.92;}
 if(m==42.){rough=.65;metal=.16;}
 if(m==43.){rough=.10;metal=.36;base=mix(base,vec3(.8,.85,.72),pow(1.-max(dot(n,normalize(uEye-p)),0.),4.)*.55);}
 vec3 v=normalize(uEye-p),l=uSun,h=normalize(l+v);float nl=max(dot(n,l),0.),nv=max(dot(n,v),.02);float sh=shadow(n);
 // Sunset removes direct daylight before the workshop lamps take over.
 // Cool sky fill preserves the shape of unlit scenery and the room corners.
 vec3 lightColor=vec3(1.85,1.61,1.19)*sunlight+vec3(.035,.055,.095)*dusk;
 vec3 eveningAmbient=mix(vec3(.075,.105,.16),vec3(.040,.060,.10),deepNight);
 vec3 ambient=mix(vec3(.33,.37,.31),eveningAmbient,dusk);float hemi=dot(n,vec3(0,1,0))*.5+.5;
 vec3 albedo=pow(max(base,vec3(0)),vec3(2.2));float ao=1.;
 if(p.y< -9.){float under=(1.-smoothstep(49.,60.,abs(p.x)))*(1.-smoothstep(30.,40.,abs(p.z)));ao*=1.-under*.57*(1.-smoothstep(-24.,-8.,p.y));}
 vec3 lit=albedo*(ambient*(.44+.62*hemi)*ao+lightColor*nl*sh);
 float spec=pow(max(dot(n,h),0.),mix(10.,145.,1.-rough))*mix(.045,.67,metal);lit+=lightColor*spec*sh*mix(vec3(1),albedo,.48*metal);
 lit+=albedo*ambient*.13*(1.-hemi)*ao;lit+=albedo*vec3(.10,.082,.055)*max(n.z,0.)*ao*mix(1.,.18,dusk);
 if(m==8.||m==24.)lit+=albedo*lightColor*max(dot(-n,l),0.)*.16*sh;
 // Warm practical lights keep their own dimmer, independent of the sun. The
 // pendants have broad central pools; task lamps fall off more locally.
 for(int i=0;i<6;i++){
  vec3 lp=uRoomLights[i]-p;float ld=dot(lp,lp);vec3 ll=normalize(lp);float fall=1./(1.+ld*(i<2?.0018:.018));float diff=max(dot(n,ll),0.);
  float blocker=1.;if(i<2&&p.y< -5.)blocker=1.-.74*(1.-smoothstep(50.,57.,abs(p.x)))*(1.-smoothstep(33.,38.,abs(p.z)));
  float strength=i<2?1.40:1.02;vec3 warm=vec3(1.,.65,.31)*fall*strength*uRoomLevel*blocker;
  lit+=albedo*warm*(diff+.08)*ao;
  vec3 rh=normalize(ll+v);lit+=warm*pow(max(dot(n,rh),0.),mix(12.,140.,1.-rough))*mix(.025,.22,metal);
 }
 if(dusk>.01){for(int i=0;i<8;i++){vec3 lp=uLamps[i]-p;float ld=dot(lp,lp);float fall=1./(1.+ld*.65);lit+=albedo*vec3(1.,.66,.31)*max(dot(n,normalize(lp)),.08)*dusk*fall*3.;}}
 vec3 toHead=uHead-p;float hd=length(toHead);float cone=pow(max(dot(-normalize(toHead),uForward),0.),18.);lit+=albedo*vec3(1.,.69,.32)*cone*max(dot(n,normalize(toHead)),.1)*(dusk*.9+.08)*4./(1.+hd*hd*.15);
 if(m==7.){
  float w1=sin(p.z*13.+p.x*6.-uTime*.95),w2=sin(p.x*23.-p.z*8.+uTime*.67);n=normalize(vec3(w1*.037,1.,w2*.028));float fres=pow(1.-max(dot(n,v),0.),3.);vec3 wh=normalize(l+v);float sparkle=pow(max(dot(n,wh),0.),260.);
  vec3 water=pow(base,vec3(2.2))*.48+vec3(.008,.030,.028);lit=water*mix(.7,mix(.25,.16,deepNight),dusk)*(.75+.25*sh)+mix(vec3(.30,.43,.37),vec3(.035,.07,.10),dusk)*fres*.7;
  lit+=lightColor*sparkle*sh*.8;for(int i=0;i<2;i++){vec3 lp=normalize(uRoomLights[i]-p);float ss=pow(max(dot(n,normalize(lp+v)),0.),240.);lit+=vec3(1.,.68,.29)*ss*.65*uRoomLevel;}
 }
 lit+=pow(max(base,vec3(0)),vec3(1.6))*em;
 if(m==33.){vec3 sky=pow(base,vec3(2.2));vec3 exterior=mix(sky*vec3(.075,.16,.28)+vec3(.008,.018,.030),sky*vec3(.015,.036,.075)+vec3(.003,.007,.015),deepNight);lit=mix(sky*1.28,exterior,dusk);if(uRain>.01){vec2 q=vUV*vec2(160.,54.);float cell=floor(q.x);float h=hash(vec3(cell,0.,2.));float y=fract(q.y+uTime*(.09+h*.13));float x=fract(q.x);float drop=exp(-pow((x-.5)*14.,2.)-pow((y-.5)*9.,2.));float tail=exp(-pow((x-.5)*22.,2.))*smoothstep(.10,.5,y)*(1.-smoothstep(.5,.97,y));lit=mix(lit,lit*.88+vec3(.06,.075,.085)*(drop+tail*.28),uRain);}}
 // The window softly paints the oak, rather than illuminating an outdoor void.
 if(m==21.&&p.y< -23.){vec2 patchCoord=vec2(p.x+p.z*.16,(p.z+30.)*.65);float inside=(1.-smoothstep(19.,22.,abs(patchCoord.x-3.)))*(1.-smoothstep(14.,17.,abs(patchCoord.y)));float mull=step(.17,abs(sin((patchCoord.x+17.)/10.5*3.14159)));lit+=vec3(.09,.067,.033)*inside*mull*sunlight*sh;}
 lit=mix(lit,uInvalid>.5?vec3(.48,.12,.06):vec3(.12,.42,.22),uPreview*.25);float dist=length(uEye-p);vec3 fog=mix(vec3(.07,.077,.062),mix(vec3(.018,.027,.044),vec3(.011,.019,.033),deepNight),dusk);float fogF=1.-exp(-dist*dist*.0000010);lit=mix(lit,fog,clamp(fogF,0.,.25));frag=vec4(lit,1.);
}`;
const SHVS=`#version 300 es
precision highp float;layout(location=0)in vec3 aPosition;uniform mat4 uModel,uVP;void main(){gl_Position=uVP*uModel*vec4(aPosition,1.);}`;
const SHFS=`#version 300 es
precision highp float;void main(){}`;
const FULLVS=`#version 300 es
precision highp float;out vec2 uv;void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);uv=p;gl_Position=vec4(p*2.-1.,0.,1.);}`;
const POSTFS=`#version 300 es
precision highp float;in vec2 uv;out vec4 frag;
uniform sampler2D uScene,uDepth;uniform vec2 uResolution;uniform float uTime,uNight,uMacro,uFocus,uNear;
vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
float lum(vec3 c){return dot(c,vec3(.2126,.7152,.0722));}
float linearDepth(float d){return 1000.*uNear/(500.+uNear-(d*2.-1.)*(500.-uNear));}
void main(){vec2 t=1./uResolution;vec3 c=texture(uScene,uv).rgb;
 vec3 a=texture(uScene,uv+vec2(t.x,0)).rgb,b=texture(uScene,uv-vec2(t.x,0)).rgb,d=texture(uScene,uv+vec2(0,t.y)).rgb,e=texture(uScene,uv-vec2(0,t.y)).rgb;
 float edge=max(max(lum(a),lum(b)),max(lum(d),lum(e)))-min(min(lum(a),lum(b)),min(lum(d),lum(e)));c=mix(c,(c*2.+a+b+d+e)/6.,clamp(edge*1.5,0.,.55));
 float dep=linearDepth(texture(uDepth,uv).r);float coc=clamp(abs(dep-uFocus)/max(dep,1.)*uMacro*10.,0.,5.0);vec3 soft=c;float sum=1.;
 if(coc>.15){for(int i=0;i<12;i++){float an=float(i)*2.399963;vec2 off=vec2(cos(an),sin(an))*sqrt((float(i)+.5)/12.)*coc;vec2 sampleUV=uv+off*t;float sd=linearDepth(texture(uDepth,sampleUV).r);float weight=1.-smoothstep(1.0,4.0,dep-sd);soft+=texture(uScene,sampleUV).rgb*weight;sum+=weight;}c=mix(c,soft/sum,smoothstep(.15,.7,coc));}
 vec3 bloom=vec3(0.);for(int i=0;i<8;i++){float an=float(i)*.785398;vec2 o=vec2(cos(an),sin(an));vec3 q=texture(uScene,uv+o*t*6.).rgb,q2=texture(uScene,uv+o*t*16.).rgb,q3=texture(uScene,uv+o*t*33.).rgb;bloom+=max(q-vec3(1.05),vec3(0.))*.065+max(q2-vec3(1.20),vec3(0.))*.045+max(q3-vec3(1.5),vec3(0.))*.025;}c+=bloom*.64;
 c=aces(c*1.1);c=pow(c,vec3(1./2.2));float vignette=1.-.25*dot((uv-.5)*vec2(.97,1.),(uv-.5)*vec2(.97,1.));c*=vignette;
 float grain=fract(sin(dot(uv*uResolution,vec2(12.9898,78.233)))*43758.5453);c+=(grain-.5)*.0025;frag=vec4(c,1.);
}`;
function program(vs,fs){function compile(s,t){let sh=gl.createShader(t);gl.shaderSource(sh,s);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(sh));return sh}let p=gl.createProgram();gl.attachShader(p,compile(vs,gl.VERTEX_SHADER));gl.attachShader(p,compile(fs,gl.FRAGMENT_SHADER));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));p.u={};return p}
function uniform(p,n){return p.u[n]??(p.u[n]=gl.getUniformLocation(p,n))}const uf=(p,n,x)=>gl.uniform1f(uniform(p,n),x), uv3=(p,n,v)=>gl.uniform3fv(uniform(p,n),v), um=(p,n,m)=>gl.uniformMatrix4fv(uniform(p,n),false,m);
function upload(data){let vao=gl.createVertexArray();gl.bindVertexArray(vao);let buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);let stride=48;[3,3,3,1,2].forEach((n,i)=>{gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,n,gl.FLOAT,false,stride,[0,12,24,36,40][i])});gl.bindVertexArray(null);return{vao,buf,count:data.length/12}}
function draw(mesh,model=I,p=mainProgram){if(!mesh)return;um(p,'uModel',model);gl.bindVertexArray(mesh.vao);gl.drawArrays(gl.TRIANGLES,0,mesh.count)}
function createTexture(w,h,depth=false){let tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);if(depth)gl.texImage2D(gl.TEXTURE_2D,0,gl.DEPTH_COMPONENT24,w,h,0,gl.DEPTH_COMPONENT,gl.UNSIGNED_INT,null);else gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA16F,w,h,0,gl.RGBA,gl.HALF_FLOAT,null);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,depth?gl.NEAREST:gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,depth?gl.NEAREST:gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);return tex}
function resize(){let maxRatio=innerWidth<700?1.6:1.5,ratio=Math.min(devicePixelRatio||1,maxRatio,Math.sqrt(2600000/(innerWidth*innerHeight))),w=Math.round(innerWidth*ratio),h=Math.round(innerHeight*ratio);if(w===screenW&&h===screenH)return;screenW=w;screenH=h;canvas.width=w;canvas.height=h;if(sceneFbo){gl.deleteFramebuffer(sceneFbo);gl.deleteTexture(sceneTex);gl.deleteTexture(sceneDepth)}sceneFbo=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,sceneFbo);sceneTex=createTexture(w,h);sceneDepth=createTexture(w,h,true);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,sceneTex,0);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,sceneDepth,0);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE){gl.bindTexture(gl.TEXTURE_2D,sceneTex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null)}
 if(msaaFbo){gl.deleteFramebuffer(msaaFbo);gl.deleteRenderbuffer(msaaColor);gl.deleteRenderbuffer(msaaDepth);}
 msaaFbo=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,msaaFbo);msaaSamples=Math.min(4,gl.getParameter(gl.MAX_SAMPLES));
 const hdr=!!gl.getExtension('EXT_color_buffer_float');let fmt=hdr?gl.RGBA16F:gl.RGBA8;let allowed=gl.getInternalformatParameter(gl.RENDERBUFFER,fmt,gl.SAMPLES);msaaSamples=Math.min(msaaSamples,allowed?.[0]||0);
 if(msaaSamples>=2){msaaColor=gl.createRenderbuffer();gl.bindRenderbuffer(gl.RENDERBUFFER,msaaColor);gl.renderbufferStorageMultisample(gl.RENDERBUFFER,msaaSamples,fmt,w,h);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.RENDERBUFFER,msaaColor);msaaDepth=gl.createRenderbuffer();gl.bindRenderbuffer(gl.RENDERBUFFER,msaaDepth);gl.renderbufferStorageMultisample(gl.RENDERBUFFER,msaaSamples,gl.DEPTH_COMPONENT24,w,h);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,msaaDepth);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE){gl.deleteFramebuffer(msaaFbo);msaaFbo=null;}}else{gl.deleteFramebuffer(msaaFbo);msaaFbo=null;}
 gl.bindFramebuffer(gl.FRAMEBUFFER,null)}
function initGL(){gl=canvas.getContext('webgl2',{alpha:false,antialias:false,powerPreference:'high-performance',preserveDrawingBuffer:true});if(!gl)throw new Error('WebGL 2 is needed to run this railway. Open the HTML in Safari, Chrome, Firefox, or Edge with hardware acceleration enabled.');gl.getExtension('EXT_color_buffer_float');mainProgram=program(VS,FS);shadowProgram=program(SHVS,SHFS);postProgram=program(FULLVS,POSTFS);gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);shadowFbo=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,shadowFbo);shadowTex=createTexture(shadowSize,shadowSize,true);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,shadowTex,0);gl.drawBuffers([gl.NONE]);gl.readBuffer(gl.NONE);gl.bindFramebuffer(gl.FRAMEBUFFER,null);shadowCacheFbo=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,shadowCacheFbo);shadowCacheTex=createTexture(shadowSize,shadowSize,true);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,shadowCacheTex,0);gl.drawBuffers([gl.NONE]);gl.readBuffer(gl.NONE);gl.bindFramebuffer(gl.FRAMEBUFFER,null);lightVP=mm(ortho(-120,120,-107,107,1,440),lookAt(add(mul(sunDir,235),[0,-8,0]),[0,-8,0]));resize()}
// A small, generated sign atlas keeps all lettering crisp in the 3D world.
const atlas=document.createElement('canvas');atlas.width=2048;atlas.height=1024;const actx=atlas.getContext('2d');let atlasX=2,atlasY=2,atlasRow=0;const labels={};
function label(key,text,w=300,h=70,bg='#234239',fg='#eddfb3',size=30,serif=false){if(atlasX+w+2>2048){atlasX=2;atlasY+=atlasRow+3;atlasRow=0}const x=atlasX,y=atlasY;actx.fillStyle=bg;actx.fillRect(x,y,w,h);actx.strokeStyle=fg+'77';actx.lineWidth=2;actx.strokeRect(x+5,y+5,w-10,h-10);actx.fillStyle=fg;actx.textAlign='center';actx.textBaseline='middle';actx.font=`${serif?'':'600 '}${size}px ${serif?'Georgia':'Arial'}`;let lines=text.split('\n');lines.forEach((t,i)=>actx.fillText(t,x+w/2,y+h/2+(i-(lines.length-1)/2)*size*1.25));labels[key]={u0:x/2048,v0:1-(y+h)/1024,u1:(x+w)/2048,v1:1-y/1024};atlasX+=w+3;atlasRow=Math.max(atlasRow,h);return labels[key]}
function sign(b,key,x,y,z,w,h,angle=0){let q=labels[key];b.push(x,y,z,0,angle);b.quad([-w/2,-h/2,0],[w/2,-h/2,0],[w/2,h/2,0],[-w/2,h/2,0],'#ffffff',15,[0,0,1],[[q.u0,q.v0],[q.u1,q.v0],[q.u1,q.v1],[q.u0,q.v1]]);b.pop()}
function initLabels(){label('station','ALDER VALE',440,90,'#1b3a32','#f3e3b3',46,true);label('railway','ALDER VALLEY RAILWAY',620,100,'#483820','#e7ce92',42,true);label('engine','07',100,100,'#183b33','#f2d384',62,true);label('name','NIGHTINGALE',360,60,'#6c2823','#f1d397',34,true);label('post','POST OFFICE',280,65,'#533e33','#f5e6c6',29,true);label('bakery','THE DAILY BREAD',350,70,'#264b45','#f2e4c1',30,true);label('inn','THE FOX & FIR',340,75,'#633d36','#f2dfb2',33,true);label('whistle','W',60,80,'#e7e1ca','#263b33',48);label('tunnel','1898',140,60,'#6a705d','#eee6cc',34,true);label('platform','1',60,70,'#1e3a32','#eee6cb',40,true);label('table','ALDER VALLEY  /  No. 07\nA WORLD IN MINIATURE',650,140,'#4d3f29','#e9d295',31,true);let q=label('clock','',120,120,'#eee9d5','#ede6ce',10),x=(q.u0+q.u1)*1024,y=(1-(q.v0+q.v1)*.5)*1024;actx.beginPath();actx.arc(x,y,50,0,TAU);actx.fillStyle='#f8f0d6';actx.fill();actx.strokeStyle='#5b604c';actx.lineWidth=3;actx.stroke();for(let i=0;i<12;i++){let a=i*TAU/12;actx.beginPath();actx.moveTo(x+Math.sin(a)*39,y-Math.cos(a)*39);actx.lineTo(x+Math.sin(a)*45,y-Math.cos(a)*45);actx.stroke()}actx.lineWidth=4;actx.beginPath();actx.moveTo(x-24,y-13);actx.lineTo(x,y);actx.lineTo(x+6,y-34);actx.stroke();}
function uploadAtlas(){atlasTexture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,atlasTexture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,atlas);gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false)}

class Edge{
 constructor(name,curves){this.curves=JSON.parse(JSON.stringify(curves));this.name=name;this.points=[];this.length=0;let prev=null;for(let curve of curves){for(let i=this.points.length?1:0;i<=180;i++){let t=i/180,u=1-t,p=[0,1,2].map(k=>u*u*u*curve[0][k]+3*u*u*t*curve[1][k]+3*u*t*t*curve[2][k]+t*t*t*curve[3][k]);if(prev)this.length+=len(sub(p,prev));this.points.push({p,d:this.length});prev=p}}}
 at(d){d=clamp(d,0,this.length);let l=0,r=this.points.length-1;while(l+1<r){let m=(l+r)>>1;if(this.points[m].d>d)r=m;else l=m}let a=this.points[l],b=this.points[r],t=(d-a.d)/(b.d-a.d||1);return{p:lerpV(a.p,b.p,t),f:norm(sub(b.p,a.p)),d,edge:this}}
}
const P=(x,z,y=1.06)=>[x,y,z];let common,highline,lowline,yard,edges,trackGrid=new Map(),tunnelStart=0,tunnelEnd=0;
function baseInitTracks(){common=new Edge('common',[[P(9,-14),P(0,-14),P(-8,-14),P(-18,-14)],[P(-18,-14),P(-25.5,-14),P(-28,-10),P(-28,-3)],[P(-28,-3),P(-28,6),P(-26,14),P(-18,14)],[P(-18,14),P(-11,14),P(-5,14),P(0,14)]]);highline=new Edge('highline',[[P(0,14),P(8,14),P(12,14,4.45),P(19,10,4.45)],[P(19,10,4.45),P(25,6.57,4.45),P(28,3),P(28,-3)],[P(28,-3),P(28,-11),P(24,-14),P(18,-14)],[P(18,-14),P(15,-14),P(12,-14),P(9,-14)]]);lowline=new Edge('lowline',[[P(0,14),P(6,14),P(10,8),P(10,2)],[P(10,2),P(10,-5),P(19,-8),P(17,-12)],[P(17,-12),P(16,-14),P(12,-14),P(9,-14)]]);yard=new Edge('yard',[[P(-21,13.5),P(-16,13.5),P(-18,9),P(-13,9)],[P(-13,9),P(-9,9),P(-5,9),P(-2,9)]]);edges=[common,highline,lowline,yard];for(let edge of edges)for(let d=0;d<edge.length;d+=.5){let a=edge.at(d),k=`${Math.floor(a.p[0]/2)},${Math.floor(a.p[2]/2)}`;if(!trackGrid.has(k))trackGrid.set(k,[]);trackGrid.get(k).push(a)}let inside=[];for(let d=0;d<common.length;d+=.25){let a=common.at(d);if(naturalH(a.p[0],a.p[2])>3.3)inside.push(d)}tunnelStart=inside[0]||12;tunnelEnd=inside[inside.length-1]||38;}
function nearestTrack(x,z){
 const gx=Math.floor(x/2),gz=Math.floor(z/2);let best=null,dist=99;
 for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){
  const cell=trackGrid.get(`${gx+i},${gz+j}`);if(!cell)continue;
  for(const a of cell){
   const dx=x-a.p[0],dz=z-a.p[2];
   if(Math.abs(dx)>dist||Math.abs(dz)>dist)continue;
   const d=Math.hypot(dx,dz);if(d<dist){best=a;dist=d;}
  }
 }
 return best?{...best,dist}:{dist:99,p:[0,1.06,0],edge:null,d:0};
}
function riverX(z){return 15.7+2.1*Math.sin((z+5)*.16)+.7*Math.sin(z*.32)}function riverWidth(z){return 1.35+1.32*Math.exp(-Math.pow((z-1)/6,2))+.22*Math.cos(z*.24)}
function baseNaturalH(x,z){let peaks=7.9*Math.exp(-Math.pow((x+13)/8.4,2)-Math.pow((z+13.5)/5.3,2))+3.2*Math.exp(-Math.pow((x+23)/4.7,2)-Math.pow((z+9)/5.1,2))+3.0*Math.exp(-Math.pow((x+2)/4.1,2)-Math.pow((z+17.3)/3.3,2));peaks*=.82+.3*fbm(x*.44,z*.44);return .68+peaks+(fbm(x*.26,z*.26)-.5)*.24}
function terrainH(x,z){let h=naturalH(x,z),rd=Math.abs(x-riverX(z))-riverWidth(z);if(rd<1.2)h=mix(-.28,h,smooth(-.4,1.1,rd));let t=nearestTrack(x,z);if(t.dist<1.6&&!(t.edge===common&&t.d>tunnelStart-1.8&&t.d<tunnelEnd+1.8)&&rd>.4){let elevate=t.edge!==highline||t.d<10.5||t.d>39;if(elevate)h=mix(h,t.p[1]-.24,1-smooth(.6,1.6,t.dist))}return h}
function roundedOutline(w,d,r,n=12){let arr=[];for(let q=0;q<4;q++){let cx=(q===0||q===3?1:-1)*(w/2-r),cz=(q<2?1:-1)*(d/2-r),start=q*PI/2;for(let i=0;i<=n;i++){let a=start+i*PI/2/n;arr.push([cx+r*Math.cos(a),cz+r*Math.sin(a)])}}return arr}
// Consistently ordered rounded rectangles in the XZ plane.
function roundRect(w,d,r,n=10){let out=[];const corners=[[w/2-r,d/2-r,0],[-w/2+r,d/2-r,PI/2],[-w/2+r,-d/2+r,PI],[w/2-r,-d/2+r,PI*1.5]];for(let [x,z,a]of corners)for(let i=0;i<=n;i++){let t=a+i*PI*.5/n;out.push([x+Math.cos(t)*r,z+Math.sin(t)*r])}return out}
function slab(b,w,d,h,y,r,c,mat=0){let out=roundRect(w,d,r,14);for(let i=0;i<out.length;i++){let a=out[i],q=out[(i+1)%out.length];b.quad([a[0],y-h/2,a[1]],[q[0],y-h/2,q[1]],[q[0],y+h/2,q[1]],[a[0],y+h/2,a[1]],c,mat);b.tri([0,y+h/2,0],[q[0],y+h/2,q[1]],[a[0],y+h/2,a[1]],c,mat)}}
function createGround(){let b=new Builder();b.box(0,-24.15,1,260,.3,240,'#88704b',21);groundMesh=b.mesh();b=new Builder();slab(b,67.5,43.5,1.28,-1.05,3.3,'#59422f',2);slab(b,67.7,43.7,.11,-.395,3.4,'#8b704d',2);slab(b,67.1,43.1,.12,-1.74,3.1,'#342e23',2);slab(b,67.25,43.25,.035,-1.55,3.2,'#b19a65',1);let outline=roundRect(65.8,41.8,2.8,20);for(let i=0;i<outline.length;i++){let p=outline[i],q=outline[(i+1)%outline.length],yp=terrainH(p[0],p[1]),yq=terrainH(q[0],q[1]);b.quad([p[0],-.33,p[1]],[q[0],-.33,q[1]],[q[0],yq,q[1]],[p[0],yp,p[1]],'#78664a',4)}b.box(0,-.94,21.82,9.1,.72,.045,'#b7a071',1);sign(b,'table',0,-.93,21.854,8.7,.66);for(let x of[-4.37,4.37])for(let y of[-1.2,-.69])b.sphere(x,y,21.897,.047,.047,.025,'#dcc591',1,6,4);
 const nx=190,nz=120,minX=-32.85,minZ=-20.85,dx=65.7/nx,dz=41.7/nz,positions=[],normals=[],colors=[];
 for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){let x=minX+i*dx,z=minZ+j*dz;let ax=Math.abs(x),az=Math.abs(z);if(ax>30&&az>18){let a=ax-30,c=az-18,l=Math.hypot(a,c);if(l>2.84){x=Math.sign(x)*(30+a/l*2.84);z=Math.sign(z)*(18+c/l*2.84)}}let y=terrainH(x,z);positions.push([x,y,z]);let n=norm([terrainH(x-.14,z)-terrainH(x+.14,z),.28,terrainH(x,z-.14)-terrainH(x,z+.14)]);normals.push(n);let v=fbm(x*.48,z*.48),grass=lerpV(col('#557d44'),col('#919359'),v*.8),slope=1-n[1],rock=clamp(smooth(.18,.5,slope)*smooth(1.6,3.2,y)+smooth(4.5,7.5,y)*.60);let c=lerpV(grass,lerpV(col('#858473'),col('#b0aa8d'),v),rock);let rd=Math.abs(x-riverX(z))-riverWidth(z);if(rd<.55)c=lerpV(col('#8f9875'),col('#657a58'),smooth(-.15,.55,rd));colors.push(c)}
 for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){let a=j*(nx+1)+i,inds=[[a,a+nx+1,a+1],[a+1,a+nx+1,a+nx+2]];for(let ids of inds){let mid=mul(add(add(positions[ids[0]],positions[ids[1]]),positions[ids[2]]),1/3),near=nearestTrack(mid[0],mid[2]);if(near.edge===common&&near.d>tunnelStart-2&&near.d<tunnelEnd+2&&near.dist<1.03&&mid[1]<3.36)continue;let ns=ids.map(k=>normals[k]);for(let k=0;k<3;k++)b.vertex(positions[ids[k]],ns[k],colors[ids[k]],3)}}
 return b;
}
function ribbon(b,edge,width,offset,yoff,c,mat=0,start=0,end=edge.length,step=.27){for(let d=start;d<end;d+=step){let a=edge.at(d),q=edge.at(Math.min(d+step,end)),ra=norm([a.f[2],0,-a.f[0]]),rb=norm([q.f[2],0,-q.f[0]]),p1=add(a.p,mul(ra,offset-width/2)),p2=add(a.p,mul(ra,offset+width/2)),p3=add(q.p,mul(rb,offset+width/2)),p4=add(q.p,mul(rb,offset-width/2));for(let p of[p1,p2,p3,p4])p[1]+=yoff;b.quad(p1,p4,p3,p2,c,mat,[0,1,0],[[0,d],[0,d+step],[1,d+step],[1,d]]);}}
function createRail(b,edge){ribbon(b,edge,1.36,0,-.13,'#777e70',9,0,edge.length,.32);ribbon(b,edge,1.51,0,-.21,'#676e57',9,0,edge.length,.4);for(let d=0;d<edge.length;d+=.30){let a=edge.at(d),r=hash(d,edge.length);b.matrix(basis(a.p,a.f));b.box(0,-.062,0,1.04,.075,.13,shade('#655e48',.88+r*.24),2);for(let s of[-1,1]){b.box(s*.32,-.011,0,.14,.025,.17,'#4e554e',11);if(Math.floor(d/.3)%3===0)b.box(s*.415,.003,0,.032,.032,.07,'#9d9b85',1)}b.pop()}for(let s of[-1,1]){ribbon(b,edge,.055,s*.32,.021,'#606d64',11,0,edge.length,.20);ribbon(b,edge,.07,s*.32,.057,'#acb3a6',1,0,edge.length,.20)} }
function archRing(b,x,y,z,r,R,depth,c,segments=18,start=0,end=PI){for(let i=0;i<segments;i++){let a=mix(start,end,i/segments),q=mix(start,end,(i+1)/segments),pa=[x+r*Math.cos(a),y+r*Math.sin(a)],pb=[x+r*Math.cos(q),y+r*Math.sin(q)],qa=[x+R*Math.cos(a),y+R*Math.sin(a)],qb=[x+R*Math.cos(q),y+R*Math.sin(q)],cc=shade(c,.91+.14*hash(i,x));for(let zz of[z-depth/2,z+depth/2])b.quad([pa[0],pa[1],zz],[pb[0],pb[1],zz],[qb[0],qb[1],zz],[qa[0],qa[1],zz],cc,4);b.quad([pa[0],pa[1],z-depth/2],[pa[0],pa[1],z+depth/2],[pb[0],pb[1],z+depth/2],[pb[0],pb[1],z-depth/2],shade(c,.72),4);b.quad([qa[0],qa[1],z-depth/2],[qb[0],qb[1],z-depth/2],[qb[0],qb[1],z+depth/2],[qa[0],qa[1],z+depth/2],cc,4);}}
function viaduct(b){const start=10.8,end=37.7,n=7,span=(end-start)/n;for(let i=0;i<n;i++){let d=start+(i+.5)*span,a=highline.at(d),left=highline.at(d-span/2),right=highline.at(d+span/2),f=norm([a.f[0],0,a.f[2]]),horizontal=len([right.p[0]-left.p[0],0,right.p[2]-left.p[2]]),top=a.p[1]-.18,r=horizontal*.365,center=top-.66-r,ground=.06,W=horizontal+.07; b.matrix(basis([a.p[0],0,a.p[2]],f)); // Local Z runs along the line; rotate masonry into the X/Y arch plane.
 b.push(0,0,0,0,PI/2);let pierW=(W-2*r)/2;for(let side of[-1,1]){b.box(side*(r+pierW/2),(center+ground)/2,0,pierW,Math.max(.12,center-ground),1.35,'#aaa58a',4);b.box(side*(r+pierW/2),.20,0,pierW+.13,.29,1.56,'#94947c',4)}archRing(b,0,center,0,r,r+.27,1.36,'#b8b094',17);for(let k=0;k<18;k++){let aa=k*PI/18,bb=(k+1)*PI/18,xa=(r+.265)*Math.cos(aa),xb=(r+.265)*Math.cos(bb),ya=center+(r+.265)*Math.sin(aa),yb=center+(r+.265)*Math.sin(bb);for(let z of[-.675,.675])b.quad([xa,ya,z],[xb,yb,z],[xb,top,z],[xa,top,z],'#a9a58b',4)}for(let s of[-1,1]){b.box(s*(W/2-pierW/2),(top+center)/2,0,pierW,top-center,1.35,'#aaa58a',4)}b.pop();b.pop();}
 ribbon(b,highline,1.53,0,-.195,'#b7b299',4,start-.3,end+.3,.2);for(let s of[-1,1]){ribbon(b,highline,.13,s*.77,.22,'#c4bda2',4,start,end,.2);for(let d=start;d<=end;d+=.40){let a=highline.at(d),r=norm([a.f[2],0,-a.f[0]]);b.matrix(basis(add(a.p,mul(r,s*.77)),a.f));b.box(0,.065,0,.115,.30,.43,'#aaa990',4);b.pop()}}
}
function smallBridge(b,edge,start,end){ribbon(b,edge,1.4,0,-.19,'#425f55',1,start,end,.18);for(let s of[-1,1])for(let d=start;d<end;d+=.8){let a=edge.at(d),q=edge.at(Math.min(d+.8,end)),r=norm([a.f[2],0,-a.f[0]]),rr=norm([q.f[2],0,-q.f[0]]),pa=add(a.p,mul(r,s*.65)),pb=add(q.p,mul(rr,s*.65));pa[1]+=.55;pb[1]+=.55;b.beam(pa,pb,.047,'#486759',1);let low=pa.slice();low[1]-=.76;b.beam(low,pa,.043,'#466356',1);b.beam(low,pb,.032,'#577365',1)}for(let d of[start,end]){let a=edge.at(d);b.matrix(basis(a.p,a.f));b.box(0,-.64,0,1.7,1.1,.5,'#a5a18b',4);b.pop()}}
function tunnel(b){let a0=common.at(tunnelStart),a1=common.at(tunnelEnd);for(let [a,sgn]of[[a0,-1],[a1,1]]){let f=mul(a.f,sgn);b.matrix(basis(a.p,f));for(let s of[-1,1]){b.box(s*1.18,.43,0,.38,1.27,.55,'#969781',4);b.box(s*1.18,-.13,0,.55,.21,.80,'#93917b',4);b.box(s*1.18,1.04,0,.52,.16,.69,'#c1b69a',4)}archRing(b,0,1.04,0,1.,1.4,.57,'#b6ad91',20);b.box(0,2.53,0,.96,.26,.52,'#8e9079',4);sign(b,'tunnel',0,2.54,.29,.74,.20);for(let side of[-1,1]){b.push(side*1.48,0,-.85,0,side*.65);b.box(0,.54,0,.30,1.36,1.75,'#8f917a',4);b.box(0,1.25,0,.42,.15,1.85,'#b7ae92',4);b.pop()}b.pop()}
 for(let d=tunnelStart+.05;d<tunnelEnd;d+=.42){let a=common.at(d),q=common.at(Math.min(d+.42,tunnelEnd)),ra=norm([a.f[2],0,-a.f[0]]),rq=norm([q.f[2],0,-q.f[0]]);for(let i=-1;i<16;i++){let crossPoint=k=>{if(k<0)return[-1,-.16];if(k>16)return[1,-.16];let t=PI-k*PI/16;return[Math.cos(t),1.04+Math.sin(t)]};let p=crossPoint(i),r=crossPoint(i+1),make=(pt,n,cp)=>add(pt,[n[0]*cp[0],cp[1],n[2]*cp[0]]);b.quad(make(a.p,ra,p),make(q.p,rq,p),make(q.p,rq,r),make(a.p,ra,r),'#414838',4)}for(let s of[-1,1]){let p1=add(a.p,mul(ra,s)),p2=add(q.p,mul(rq,s));b.quad(add(p1,[0,-.17,0]),add(p2,[0,-.17,0]),add(p2,[0,1.04,0]),add(p1,[0,1.04,0]),'#363e31',4)}}
}
const houseZones=[],roads=[];let road;
function makeRoad(b){road=new Edge('road',[[P(-22,21,.75),P(-22,13,.75),P(-20,7,.75),P(-15,7,.75)],[P(-15,7,.75),P(-8,7,.75),P(-2,6,.75),P(3,3,.75)],[P(3,3,.75),P(7,0,.75),P(3,-4,.75),P(-4,-4,.75)]]);roads.push(road);ribbon(b,road,1.55,0,.01,'#aaa68b',9,0,road.length,.3);for(let d=0;d<road.length;d+=2.3)ribbon(b,road,.035,0,.018,'#d1c7a6',0,d,Math.min(d+.7,road.length),.2);for(let s of[-1,1])ribbon(b,road,.15,s*.85,0,'#c3b99b',4,6,road.length-4,.3)}
function roadDistance(x,z){let best=99;for(let road of roads)for(let d=0;d<road.length;d+=1){let p=road.at(d).p;best=Math.min(best,Math.hypot(x-p[0],z-p[2]))}return best}
function barrelRoof(b,w,d,base,color){let r=w/2+.09,rise=.30,n=12;for(let i=0;i<n;i++){let x0=-r+2*r*i/n,x1=-r+2*r*(i+1)/n,y0=base+Math.sqrt(Math.max(0,1-(x0/r)**2))*rise,y1=base+Math.sqrt(Math.max(0,1-(x1/r)**2))*rise;b.quad([x0,y0,-d/2],[x0,y0,d/2],[x1,y1,d/2],[x1,y1,-d/2],color,1);for(let z of[-d/2,d/2])b.tri([0,base,z],[x0,y0,z],[x1,y1,z],color,1)}}
function gable(b,w,d,y,rise,color){let X=w/2+.18,Z=d/2+.18;b.quad([-X,y,Z],[X,y,Z],[X,y+rise,0],[-X,y+rise,0],color,5);b.quad([X,y,-Z],[-X,y,-Z],[-X,y+rise,0],[X,y+rise,0],shade(color,.83),5);b.tri([-w/2,y,-d/2],[-w/2,y,d/2],[-w/2,y+rise,0],'#bfb591',0);b.tri([w/2,y,d/2],[w/2,y,-d/2],[w/2,y+rise,0],'#bfb591',0);b.beam([-X,y+rise+.03,0],[X,y+rise+.03,0],.06,shade(color,1.13),5);for(let s of[-1,1])b.box(0,y-.035,s*Z,w+.43,.09,.075,'#5d624e',2);}
function windowPane(b,x,y,z,w,h){b.box(x,y,z,w+.10,h+.10,.06,'#e3d7b2',0);b.box(x,y,z+.037,w,h,.025,'#667f75',6);b.box(x,y,z+.06,.035,h,.025,'#e0d2ac',0);b.box(x,y-.02,z+.061,w,.034,.03,'#e0d2ac',0);b.box(x,y-h/2-.065,z+.035,w+.18,.08,.16,'#aaa688',4)}
function flowerBox(b,x,y,z,width){b.box(x,y,z,width,.17,.22,'#594e39',2);for(let i=0;i<7;i++){let xx=x+(i/6-.5)*width*.83;b.sphere(xx,y+.15,z,.08,.13,.08,'#4b713b',8,6,4,true);b.sphere(xx,y+.22,z+.03,.061,.06,.063,i%3?'#d08269':'#e0c982',0,6,4)}}
function baseHouse(b,x,z,w,d,h,paint,roof,angle=0,name=null){let y=terrainH(x,z);houseZones.push({x,z,r:Math.hypot(w,d)/2+.9});b.push(x,y,z,0,angle);b.box(0,.10,0,w+.24,.25,d+.25,'#a1a084',4);b.box(0,h/2+.12,0,w,h,d,paint,0);gable(b,w,d,h+.12,.85,roof);for(let xx of[-w/2+.07,w/2-.07])for(let j=.25;j<h;j+=.36)b.box(xx,j,d/2+.014,.20,.20,.048,'#d4c6a4',4);let floors=h>2.3?2:1;for(let f=0;f<floors;f++){let yy=f? h-.5:1.25;for(let xx of[-w*.29,w*.29])windowPane(b,xx,yy,d/2+.038,.47,.56)}b.box(0,.65,d/2+.045,.47,1.05,.08,'#4c6858',2);b.box(0,1.44,d/2+.07,.52,.08,.13,'#e0cfac',0);b.sphere(.13,.64,d/2+.101,.032,.032,.025,'#e3c28b',1,6,4);b.box(0,.11,d/2+.22,.82,.18,.43,'#b4ad91',4);b.box(0,.03,d/2+.41,.95,.10,.34,'#aba88d',4);b.box(w*.26,h+.64,-d*.2,.34,1.04,.38,'#9b846d',4);b.box(w*.26,h+1.17,-d*.2,.43,.13,.47,'#b0a88c',4);for(let s of[-1,1]){b.push(s*(w/2+.04),1.18,0,0,s*PI/2);windowPane(b,0,0,0,.55,.63);b.pop()}if(name){sign(b,name,0,1.85,d/2+.09,w*.85,.29);b.push(0,1.70,d/2+.23,.26);b.box(0,0,.23,w*.86,.07,.61,name==='bakery'?'#668672':'#b8986e',0);b.pop()}flowerBox(b,-w*.29,.86,d/2+.22,.54);flowerBox(b,w*.29,.86,d/2+.22,.54);b.pop()}
function person(b,x,y,z,c='#d9ba88',angle=0,scale=1){b.push(x,y,z,0,angle,0,scale);b.cylinder(0,.34,0,.098,.072,.29,c,0,7);b.sphere(0,.57,0,.075,.083,.073,'#d9b994',0,8,5);b.cylinder(0,.635,0,.082,.067,.045,'#665941',2,8);for(let s of[-1,1]){b.beam([s*.045,.24,0],[s*.054,.025,.015],.031,'#445849',0,5);b.beam([s*.08,.43,0],[s*.135,.23,.014],.025,c,0,5);b.box(s*.055,.027,.038,.07,.043,.13,'#454c3d',0)}b.pop()}
const lampPositions=[];
function lamp(b,x,z,h=2.35){let y=terrainH(x,z);b.cylinder(x,y+.10,z,.16,.13,.20,'#485b49',1,8);b.cylinder(x,y+h/2,z,.049,.032,h,'#435a48',1,10);b.cylinder(x,y+h,z,.13,.09,.13,'#4e624c',1,8);b.box(x,y+h+.18,z,.19,.29,.19,'#ead5a0',6);b.cylinder(x,y+h+.36,z,.20,.02,.17,'#485e4a',1,6);for(let sx of[-1,1])for(let sz of[-1,1])b.beam([x+sx*.10,y+h+.04,z+sz*.1],[x+sx*.08,y+h+.32,z+sz*.08],.017,'#4c5e4a',1,5);lampPositions.push([x,y+h+.16,z])}
function bench(b,x,y,z,angle=0){b.push(x,y,z,0,angle);for(let i=0;i<3;i++)b.box(0,.32,(i-1)*.12,.83,.05,.10,'#977951',2);for(let i=0;i<3;i++)b.box(0,.46+i*.09,-.18,.83,.06,.04,'#977951',2);for(let s of[-1,1]){b.box(s*.31,.17,0,.05,.29,.31,'#465947',1);b.beam([s*.32,.2,-.16],[s*.32,.71,-.16],.024,'#485c4b',1)}b.pop()}
function fence(b,a,c,height=.6,spacing=.72,color='#aea184'){let distance=len(sub(c,a)),n=Math.ceil(distance/spacing);for(let i=0;i<=n;i++){let p=lerpV(a,c,i/n);p[1]=terrainH(p[0],p[2]);b.box(p[0],p[1]+height/2,p[2],.07,height,.07,color,2)}for(let h of[height*.42,height*.83]){let p=a.slice(),q=c.slice();p[1]=terrainH(p[0],p[2])+h;q[1]=terrainH(q[0],q[2])+h;b.beam(p,q,.026,color,2,5)}}
function baseStation(b){let x=-10.5,z=10.4,y=.84;houseZones.push({x:-11.5,z:11,r:6.3});b.box(-11.5,.935,12.4,14.2,.35,1.91,'#b9b69c',4);b.box(-11.5,1.10,13.36,14.4,.08,.15,'#e5d8b5',0);for(let xx=-18.5;xx<-4.4;xx+=.28)b.box(xx,1.145,13.31,.16,.015,.055,'#d7c794',0);b.push(x,y,z);b.box(0,1.14,0,4.6,2.3,2.1,'#c5b485',4);gable(b,4.7,2.2,2.3,.85,'#485f54');for(let xx of[-1.5,0,1.5])windowPane(b,xx,1.12,1.07,.60,.91);b.box(0,.68,1.12,.61,1.30,.04,'#4a6555',2);sign(b,'station',0,1.96,1.122,3.37,.37);sign(b,'clock',1.63,1.97,1.124,.35,.35);b.box(1.25,3.04,-.3,.32,.98,.35,'#aa9878',4);b.box(1.25,3.53,-.3,.42,.1,.45,'#b8ad8c',4);b.pop();for(let xx of[-17.2,-14.7,-12.2,-7.2,-5.6]){b.cylinder(xx,2.02,12.85,.044,.037,1.75,'#536b53',1,8);b.beam([xx,2.46,12.85],[xx-.36,2.77,12.85],.028,'#657961',1);b.beam([xx,2.46,12.85],[xx+.36,2.77,12.85],.028,'#657961',1)}b.push(-11.5,2.88,12.1,-.07);b.box(0,0,0,13.2,.10,1.85,'#536c59',1);for(let i=-6.5;i<=6.5;i+=.31)b.box(i,.055,0,.03,.045,1.85,'#82907a',1);b.pop();for(let xx of[-16.3,-6.0])bench(b,xx,1.10,12.20);for(let xx of[-17.9,-5]){lamp(b,xx,13.04,2.2);b.push(xx,2.87,13.05);sign(b,'platform',0,0,.12,.24,.28);b.pop()}for(let i=0;i<12;i++){let px=-17.9+i*1.03,pz=i%3===0?12.05:12.80;person(b,px,1.11,pz,['#d2b476','#af7562','#768f8a','#d0c7a4','#425c4f'][i%5],rnd(-.4,.4),rnd(.85,1.05));if(i%4===0)b.box(px+.20,1.27,pz,.25,.30,.18,'#7e6341',2)}b.box(-6.3,1.29,11.58,.4,.5,.37,'#557659',2);fence(b,[-18.4,0,11.5],[-18.4,0,13.1],.64);}
function village(b){house(b,-16.5,3.6,2.45,2.15,2.45,'#c9b687','#84715b',-.06,'post');house(b,-11.8,3.6,2.9,2.05,2.65,'#d5c6a0','#936d50',.025,'bakery');house(b,-7.0,3.8,2.55,2.0,2.5,'#b4b7a0','#7b6254',-.03,'inn');house(b,-2.3,1.25,2.6,2.35,2.5,'#cdbb95','#5c6b5a',-.22);house(b,-7,-1.2,2.2,2.0,2.1,'#d2c7ab','#99725b',.14);house(b,-17.5,-1.5,2.3,2.1,1.95,'#b9ac88','#656e59',-.11);house(b,2.9,-2.6,2.2,2.1,1.85,'#c9c6a2','#8e7158',.2);house(b,-23.0,4.0,2.7,2.2,1.55,'#a1664d','#5c6655',PI/2);house(b,23.5,1.0,2.25,2.65,1.65,'#b58364','#687a62',-.1);
 church(b,-12,-3.6);
 for(let p of[[-16.9,5.7],[-11.9,5.7],[-6.2,6],[.8,3.7],[-19.1,7],[-14,-1]])lamp(b,...p,2.0);bench(b,-9.0,terrainH(-9,5.9),5.9,PI);person(b,-10.1,terrainH(-10.1,5.9),5.9,'#aa7a62');person(b,-10.6,terrainH(-10.6,5.95),5.95,'#c6b68b',.9);fence(b,[-19,0,-4],[-23,0,-3],.6);fence(b,[-25,0,1],[-25,0,6.7],.65);fence(b,[-25,0,6.7],[-21,0,6.7],.65);}
function baseRock(b,x,z,s=1){let y=terrainH(x,z);b.push(x,y,z,0,rnd(0,TAU));b.sphere(0,.2*s,0,.64*s,.46*s,.5*s,shade('#a7a78e',rnd(.8,1.12)),4,7,4,true);b.pop()}
function basePine(b,x,z,h){let y=terrainH(x,z),c=lerpV(col('#254d3c'),col('#557750'),rand()*.6);b.cylinder(x,y+h*.32,z,.085*h,.027*h,h*.63,'#695d43',2,7);for(let i=0;i<6;i++){let t=i/6,yy=y+h*(.29+t*.61),r=h*(.24*(1-t)+.035),hh=h*(.32-t*.09);b.push(x+rnd(-.06,.06)*h,yy,z+rnd(-.045,.045)*h,0,rnd(0,TAU));let n=10;for(let k=0;k<n;k++){let a=k*TAU/n,q=(k+1)*TAU/n,rr=r*rnd(.85,1.12),rq=r*rnd(.85,1.12),p=[Math.cos(a)*rr,-hh*.40+rnd(-.1,.08),Math.sin(a)*rr],r2=[Math.cos(q)*rq,-hh*.4+rnd(-.1,.08),Math.sin(q)*rq],cc=shade(c,rnd(.88,1.1));b.tri(p,[.015,hh*.6,.02],r2,cc,8);b.tri([0,-hh*.45,0],p,r2,shade(c,.8),8)}b.pop()}}
function baseTree(b,x,z,h=2.9,warm=false){let y=terrainH(x,z),c=warm?lerpV(col('#ad9e52'),col('#a7884b'),rand()):lerpV(col('#507245'),col('#8b9454'),rand());b.cylinder(x,y+h*.29,z,.13,.052,h*.58,'#756a48',2,8);for(let i=0;i<5;i++){let a=i*2.4+rnd(-.3,.3),r=h*rnd(.1,.24),p=[x+Math.cos(a)*r,y+h*rnd(.61,.84),z+Math.sin(a)*r];b.beam([x,y+h*.35,z],p,.041,'#776c4b',2,6);b.sphere(...p,h*rnd(.24,.31),h*rnd(.25,.34),h*rnd(.24,.31),shade(c,rnd(.92,1.09)),8,11,7,false)}b.sphere(x,y+h*.86,z,h*.24,h*.26,h*.25,c,8,11,7,false)}
function vegetation(b){let trees=0;for(let i=0;i<1650&&trees<265;i++){let x=rnd(-31.6,31.6),z=rnd(-19.4,19.4),h=terrainH(x,z),near=nearestTrack(x,z);if(Math.abs(x-riverX(z))-riverWidth(z)<1.20||near.dist<1.8||h>6.6||h<.4)continue;if(houseZones.some(q=>Math.hypot(x-q.x,z-q.z)<q.r+1.1))continue;if(roadDistance(x,z)<1.8)continue;if(x>-21&&x<7&&z>0&&z<13&&rand()<.78)continue;if(z>15.5&&rand()<.62)continue;let isPine=z<-6||x>25||x<-25;isPine?pine(b,x,z,rnd(2.0,3.8)):tree(b,x,z,rnd(2.1,3.1),rand()<.17);trees++}
 for(let p of[[-18.7,4.7,2.4],[-3.9,8.1,2.5],[-1,6.8,2.4],[-20,10,2.7],[-20,-.1,2.5],[24,5.3,2.8],[25,-4,3.1]])if(nearestTrack(p[0],p[1]).dist>1.8)tree(b,...p);for(let i=0;i<210;i++){let z=rnd(-20,20),side=rand()<.5?-1:1,x=riverX(z)+side*(riverWidth(z)+rnd(.18,.8));if(nearestTrack(x,z).dist<.65)continue;if(i%3===0)rock(b,x,z,rnd(.22,.75));else{let y=terrainH(x,z);for(let k=0;k<5;k++){let xx=x+rnd(-.15,.15),zz=z+rnd(-.15,.15),hh=rnd(.2,.65);b.tri([xx-.025,y,zz],[xx+.05,y+hh,zz-.04],[xx+.025,y,zz],'#797b48',8)}}}
 for(let i=0;i<650;i++){let x=rnd(-31,31),z=rnd(-19.5,19.5),y=terrainH(x,z);if(y<.4||nearestTrack(x,z).dist<1.05||houseZones.some(q=>Math.hypot(x-q.x,z-q.z)<q.r)||roadDistance(x,z)<1.1)continue;let c=y>3?'#838b5c':'#779449';for(let j=0;j<3;j++){let a=rnd(0,TAU),s=rnd(.06,.13),h=rnd(.13,.30);b.tri([x+Math.cos(a)*s,y,z+Math.sin(a)*s],[x,y+h,z],[x-Math.cos(a)*s,y,z-Math.sin(a)*s],c,8)}}for(let i=0;i<33;i++){let x=rnd(-24,-5),z=rnd(-18,-8);if(terrainH(x,z)>4.6)rock(b,x,z,rnd(.4,.85));}}
function details(b){ // Boathouse pier, boat, kitchen garden, and a timber siding.
 for(let j=0;j<20;j++)b.box(20.0+j*.16,.49,3.4,.145,.12,1.08,'#a88b5b',2);for(let x of[20.1,22.9])for(let z of[2.96,3.84])b.cylinder(x,.23,z,.06,.06,.75,'#776c46',2,8);person(b,20.3,.56,3.4,'#d0b78a',-PI/2);b.beam([20.13,1.04,3.4],[18.7,1.65,3.4],.014,'#967e4c',2,5);b.beam([18.7,1.65,3.4],[18.65,.18,3.4],.003,'#c1bca1',1,3);b.push(18.8,.24,3.8,0,.2);b.sphere(0,0,0,.36,.16,.85,'#b99052',2,12,6);b.sphere(0,.055,0,.27,.13,.66,'#434e3e',2,10,5);for(let z of[-.32,.25])b.box(0,.09,z,.53,.04,.14,'#b69360',2);b.beam([-.46,.11,-.4],[.64,.11,.43],.029,'#d2b578',2);b.pop();
 let x=-21.5,z=-.7,y=terrainH(x,z);b.box(x,y+.02,z,2.8,.045,3.3,'#726343',9);for(let i=0;i<5;i++)for(let j=0;j<7;j++){let xx=x+(i-2)*.46,zz=z+(j-3)*.40;b.sphere(xx,y+.11,zz,.16,.16,.13,i%2?'#6a853d':'#728148',8,6,4,true)}fence(b,[-23.1,0,-2.6],[-19.8,0,-2.6],.48);for(let i=0;i<4;i++){let xx=-24.1+i*.70,zz=5.8+(i%2)*.4,yy=terrainH(xx,zz);b.sphere(xx,yy+.33,zz,.25,.24,.36,'#e3dec5',0,8,5,true);b.sphere(xx,yy+.39,zz+.34,.12,.14,.15,'#77765e',0,7,5);for(let a of[-1,1])for(let s of[-1,1])b.beam([xx+a*.15,yy+.04,zz+s*.20],[xx+a*.15,yy+.28,zz+s*.20],.028,'#7c775c',0,5)}
 for(let i=0;i<9;i++){let xx=-1.1+Math.floor(i/3)*.24,zz=8.1+i%3*.34;b.cylinder(xx,.97,zz,.11,.11,1.45,'#af9260',2,9,PI/2);b.cylinder(xx,.97,zz+.727,.09,.09,.02,'#d1b987',0,9,PI/2)}let e=yard.at(yard.length-.28);b.matrix(basis(e.p,e.f));b.box(0,.21,0,1.07,.35,.15,'#623f30',2);for(let side of[-1,1])b.beam([side*.44,-.06,.0],[side*.44,.38,-.55],.085,'#6d6d53',1);b.box(0,.26,.09,.62,.11,.06,'#b9754d',0);b.pop();
 for(let p of[[-22.3,15.1],[-3.1,14.9],[8.9,-15]]){let yy=terrainH(p[0],p[1]);b.cylinder(p[0],yy+.7,p[1],.03,.025,1.4,'#d2c5a0',0,7);sign(b,'whistle',p[0],yy+1.35,p[1]+.015,.28,.34)}
}
let crossingMesh,crossingModel=I,signalMesh,signalGreenMesh,signalRedMesh,signalModels=[];
function signals(b){for(let p of[[1.0,15.2],[-4.3,-12.5],[-26,-7]]){let y=terrainH(...p);b.cylinder(p[0],y+.7,p[1],.045,.04,1.4,'#566451',1,8);b.box(p[0],y+1.5,p[1],.29,.62,.22,'#334b3e',1);for(let dy of[1.38,1.64])b.cylinder(p[0],y+dy,p[1]+.14,.089,.089,.03,'#253a30',1,10,PI/2);signalModels.push(trans(p[0],y+1.41,p[1]+.16))}let s=new Builder();s.sphere(0,0,0,.066,.066,.022,'#a8d479',10,10,6);signalGreenMesh=s.mesh();s=new Builder();s.sphere(0,.23,0,.066,.066,.022,'#ef7752',10,10,6);signalRedMesh=s.mesh();let cx=-21.3,cz=15.0,cy=terrainH(cx,cz);b.box(cx,cy+.37,cz,.23,.74,.25,'#686f54',1);b.box(cx,cy+.77,cz,.39,.15,.36,'#dad2af',0);let arm=new Builder();for(let i=0;i<10;i++)arm.box(.12+i*.18,0,0,.18,.10,.09,i%2?'#a45d45':'#e5d5ae',0);crossingMesh=arm.mesh();crossingModel=trans(cx,cy+.87,cz);}
function createWater(){let b=new Builder(),n=360;for(let j=0;j<n;j++){let z0=-20.8+j*41.6/n,z1=-20.8+(j+1)*41.6/n;for(let i=0;i<10;i++){let u0=i/10,u1=(i+1)/10,x=(z,u)=>riverX(z)+(u*2-1)*(riverWidth(z)+.28),c='#397c6e';b.quad([x(z0,u0),.13,z0],[x(z1,u0),.13,z1],[x(z1,u1),.13,z1],[x(z0,u1),.13,z0],c,7,[0,1,0],[[u0,j/n],[u0,(j+1)/n],[u1,(j+1)/n],[u1,j/n]])}}waterMesh=b.mesh()}
function baseBuildWorld(){initTracks();initLabels();let b=createGround();makeRoad(b);for(let edge of edges)createRail(b,edge);if(highline.points.some(a=>a.p[1]>2.5))viaduct(b);smallBridge(b,highline,highline.length-8.6,highline.length-5.3);smallBridge(b,lowline,lowline.length-9.6,lowline.length-6.4);if(Number.isFinite(tunnelStart)&&tunnelEnd>tunnelStart)tunnel(b);station(b);village(b);details(b);vegetation(b);signals(b);staticMesh=b.mesh();createWater();uploadAtlas();}

let locoMesh,locoCabMesh,tenderMesh,coachMesh,wheelMesh,bogieMesh,rodMesh,dieselMesh,flatcarMesh,carMesh,steamVAO,steamBuffer;
const GREEN='#305749',DARK='#25382e',GOLD='#cbb37c',CREAM='#dccca2',WHEEL='#784b39';
function smallAxle(b,z,r=.19,width=.86){b.cylinder(0,r+.02,z,.036,.036,width,'#48564b',1,8,0,PI/2);for(let s of[-1,1]){b.cylinder(s*width/2,r+.02,z,r,r,.075,'#3d4c41',1,14,0,PI/2);b.cylinder(s*(width/2+.04),r+.02,z,r*.78,r*.78,.012,'#737b66',1,12,0,PI/2);b.cylinder(s*(width/2+.05),r+.02,z,r*.57,r*.57,.014,'#425449',1,10,0,PI/2)}}
function makeLoco(withRoof=true){let b=new Builder();b.box(0,.35,.12,.88,.17,3.35,DARK,1);b.box(0,.53,-.64,.86,.13,1.45,GREEN,1);for(let z of[-1.50,1.85]){b.box(0,.36,z,1.02,.21,.16,'#9a573c',1);for(let x of[-.35,.35]){b.cylinder(x,.39,z+(z>0?.12:-.12),.073,.073,.18,DARK,1,10,PI/2);b.cylinder(x,.39,z+(z>0?.22:-.22),.11,.11,.035,'#73786a',1,12,PI/2)}b.beam([0,.31,z],[0,.27,z+(z>0?.35:-.35)],.035,DARK,1)}
 b.cylinder(0,.99,.34,.36,.36,1.97,GREEN,1,28,PI/2);b.cylinder(0,.99,1.29,.365,.365,.28,'#35453a',1,28,PI/2);b.cylinder(0,.99,1.443,.308,.308,.022,'#48564a',1,28,PI/2);for(let z of[-.42,.10,.68,1.18]){b.cylinder(0,.99,z,.369,.369,.021,GOLD,1,28,PI/2)}for(let i=0;i<12;i++){let a=i*TAU/12;b.sphere(Math.sin(a)*.265,.99+Math.cos(a)*.265,1.461,.020,.020,.015,GOLD,1,6,4)}b.cylinder(0,.99,1.48,.051,.051,.043,GOLD,1,10,PI/2);b.beam([-.12,.99,1.503],[.12,.99,1.503],.016,GOLD,1);b.beam([0,.87,1.503],[0,1.11,1.503],.016,GOLD,1);
 b.box(0,.91,-.74,.79,.69,.57,GREEN,1);b.cylinder(0,1.38,-.16,.16,.135,.23,GOLD,1,18);b.sphere(0,1.49,-.16,.136,.1,.136,GOLD,1,16,7);b.cylinder(0,1.35,.48,.12,.105,.18,GREEN,1,16);b.sphere(0,1.44,.48,.108,.06,.108,GREEN,1,14,6);b.cylinder(0,1.43,1.03,.14,.16,.40,'#3c4b3d',1,20);b.cylinder(0,1.66,1.03,.21,.21,.072,GOLD,1,20);b.cylinder(0,1.706,1.03,.153,.153,.017,'#293c31',0,18);
 // Open cab, arched roof, individual window frames, and a warm firebox.
 b.box(0,.63,-1.06,.88,.14,.87,GREEN,1);for(let s of[-1,1]){b.box(s*.418,.89,-1.07,.062,.41,.85,GREEN,1);b.box(s*.421,1.385,-1.07,.06,.12,.85,GREEN,1);for(let z of[-1.47,-.67])b.box(s*.421,1.13,z,.064,.51,.066,CREAM,0);b.box(s*.424,1.12,-1.07,.017,.39,.64,'#617466',6);b.box(s*.437,1.12,-1.07,.02,.39,.029,GOLD,1);b.box(s*.439,.927,-1.07,.015,.028,.67,GOLD,1);b.box(s*.434,.79,-1.07,.012,.023,.76,GOLD,1);b.push(s*.46,.91,-1.09,0,s*PI/2);sign(b,'engine',0,0,0,.27,.24);b.pop();b.box(s*.38,.48,-1.43,.17,.06,.24,DARK,1);b.box(s*.42,.34,-1.43,.15,.06,.19,DARK,1)}b.box(0,1.20,-.65,.76,.42,.06,GREEN,1);b.box(0,1.2,-.609,.52,.25,.01,'#b87b44',6);if(withRoof){b.push(0,0,-1.07);barrelRoof(b,1.04,1.06,1.46,'#354b41');b.pop();}b.box(0,.90,-.805,.28,.28,.08,'#e09343',6);b.cylinder(.20,1.03,-.875,.09,.09,.026,GOLD,1,12,PI/2);b.cylinder(.20,1.03,-.895,.074,.074,.025,'#dacead',0,12,PI/2);
 for(let s of[-1,1]){b.box(s*.49,.59,.38,.18,.073,2.5,DARK,1);b.beam([s*.40,1.125,-.58],[s*.40,1.125,1.32],.021,GOLD,1,8);for(let z of[-.44,.28,.98])b.beam([s*.34,1.08,z],[s*.42,1.13,z],.019,GOLD,1);b.cylinder(s*.41,.72,.90,.072,.072,.35,'#57705a',1,10,PI/2);b.beam([s*.44,.63,.8],[s*.48,.4,.89],.025,GOLD,1);b.push(s*.374,1.07,.30,0,s*PI/2);sign(b,'name',0,0,0,.76,.115);b.pop()}
 // Bell, lamp, pilot, and two leading wheelsets.
 b.cylinder(0,1.33,.77,.075,.045,.11,GOLD,1,14);b.beam([-.07,1.35,.77],[-.07,1.51,.77],.014,GOLD,1);b.beam([.07,1.35,.77],[.07,1.51,.77],.014,GOLD,1);b.beam([-.07,1.51,.77],[.07,1.51,.77],.014,GOLD,1);b.cylinder(0,1.30,1.53,.121,.121,.22,DARK,1,18,PI/2);b.cylinder(0,1.30,1.653,.100,.100,.025,'#ffe7aa',10,18,PI/2);for(let x=-.4;x<=.4;x+=.1)b.beam([x,.4,1.89],[x*.72,.17,2.12],.018,DARK,1);smallAxle(b,1.14,.17,.74);smallAxle(b,1.61,.17,.74);return b.mesh()}
function makeWheels(){let b=new Builder();b.cylinder(0,0,0,.037,.037,1.02,'#5e6352',1,10,0,PI/2);for(let s of[-1,1]){b.cylinder(s*.46,0,0,.304,.304,.086,'#adb198',1,22,0,PI/2);b.cylinder(s*.511,0,0,.268,.268,.017,WHEEL,1,22,0,PI/2);b.cylinder(s*.524,0,0,.215,.215,.014,'#3e4e40',1,20,0,PI/2);for(let i=0;i<10;i++){let a=i*TAU/10;b.beam([s*.536,0,0],[s*.536,Math.sin(a)*.258,Math.cos(a)*.258],.023,'#a37450',1,5)}b.cylinder(s*.541,0,0,.074,.074,.026,GOLD,1,12,0,PI/2);b.cylinder(s*.565,.15,0,.042,.042,.04,GOLD,1,10,0,PI/2)}return b.mesh()}
function makeTender(){let b=new Builder();b.box(0,.30,0,.92,.16,1.72,DARK,1);b.box(0,.69,-.09,.89,.65,1.44,GREEN,1);b.box(0,1.05,-.14,.92,.09,1.53,GOLD,1);b.box(0,1.08,-.10,.82,.025,1.37,'#293d31',0);for(let i=0;i<50;i++)b.sphere(rnd(-.35,.35),1.1+rnd(0,.11),rnd(-.70,.49),rnd(.08,.14),rnd(.06,.09),rnd(.08,.12),shade('#3d493b',rnd(.8,1.1)),1,6,4,true);for(let s of[-1,1]){b.box(s*.452,.45,-.1,.01,.032,1.41,GOLD,1);b.box(s*.452,.94,-.1,.01,.025,1.41,GOLD,1);b.push(s*.461,.73,-.08,0,s*PI/2);sign(b,'engine',0,0,0,.34,.30);b.pop()}smallAxle(b,-.52,.18,.84);smallAxle(b,.52,.18,.84);for(let z of[-.89,.89])b.beam([0,.3,z],[0,.3,z+Math.sign(z)*.15],.032,DARK,1);for(let i=0;i<5;i++)b.box(.27,.45+i*.13,-.83,.28,.025,.055,GOLD,1);for(let x of[.12,.42])b.beam([x,.3,-.82],[x,1.05,-.82],.015,GOLD,1);return b.mesh()}
function makeCoach(){let b=new Builder();b.box(0,.34,0,.89,.14,2.76,DARK,1);b.box(0,.69,0,.94,.60,2.53,GREEN,1);b.box(0,1.13,0,.925,.48,2.49,CREAM,0);b.box(0,1.385,0,.98,.06,2.59,GOLD,1);for(let s of[-1,1]){b.box(s*.48,.87,0,.017,.035,2.53,GOLD,1);b.box(s*.48,.50,0,.017,.03,2.51,GOLD,1);for(let j=0;j<7;j++){let z=(j-3)*.335;b.box(s*.477,1.13,z,.023,.366,.241,'#5a756c',6);b.box(s*.49,1.13,z-.134,.025,.389,.025,'#b2a37c',1);b.box(s*.49,1.13,z+.134,.025,.389,.025,'#b2a37c',1);b.box(s*.49,1.31,z,.026,.025,.272,'#b7a77f',1);b.box(s*.49,.94,z,.026,.025,.272,'#b7a77f',1)}b.push(s*.490,.70,0,0,s*PI/2);sign(b,'railway',0,0,0,1.57,.16);b.pop()}barrelRoof(b,1.06,2.86,1.40,'#566051');for(let z of[-.85,0,.85])b.cylinder(0,1.73,z,.06,.085,.10,'#59634e',1,9);for(let s of[-1,1]){b.box(0,.96,s*1.273,.31,.84,.025,'#7c8b71',6);b.box(0,.43,s*1.44,.84,.08,.26,DARK,1);for(let x of[-.36,.36])b.beam([x,.48,s*1.51],[x,1.08,s*1.51],.018,GOLD,1);b.beam([-.36,.96,s*1.51],[.36,.96,s*1.51],.018,GOLD,1);b.beam([0,.3,s*1.45],[0,.3,s*1.60],.025,'#3a4a3c',1);b.box(.47,.28,s*1.30,.18,.055,.24,DARK,1)}return b.mesh()}
function makeBogie(){let b=new Builder();b.box(0,.22,0,.86,.13,.70,DARK,1);smallAxle(b,-.22,.17,.87);smallAxle(b,.22,.17,.87);for(let s of[-1,1]){b.box(s*.48,.23,0,.075,.085,.66,'#69705a',1);for(let z of[-.22,.22])b.cylinder(s*.526,.23,z,.065,.065,.045,'#6f735c',1,10,0,PI/2);b.box(s*.49,.29,0,.06,.09,.27,'#7a7b62',1)}return b.mesh()}
function makeDiesel(){let b=new Builder();b.box(0,.3,0,.85,.17,2.17,'#526451',1);b.box(0,.67,.27,.64,.65,1.16,'#778b78',1);b.box(0,1.04,-.66,.87,1.00,.73,'#708975',1);b.box(0,1.58,-.66,1.0,.1,.86,'#425e52',1);for(let s of[-1,1]){b.box(s*.449,1.2,-.66,.02,.39,.45,'#526f63',6);for(let j=0;j<6;j++)b.box(s*.327,.7,.55-j*.10,.022,.32,.035,'#3c5749',1);b.box(s*.37,.35,0,.14,.04,2.1,'#c2b284',1);b.beam([s*.43,.5,.76],[s*.43,.93,.76],.02,GOLD,1);b.beam([s*.43,.9,.80],[s*.43,.9,-.25],.02,GOLD,1)}for(let z of[-1.13,1.13])b.box(0,.36,z,.98,.20,.1,'#ac845c',1);smallAxle(b,.6,.20,.81);smallAxle(b,-.67,.20,.81);b.cylinder(0,1.13,.55,.046,.046,.40,DARK,1,8);return b.mesh()}
function makeFlatcar(){let b=new Builder();b.box(0,.31,0,.96,.13,2.38,DARK,1);for(let i=0;i<20;i++)b.box(0,.41,(i-9.5)*.114,.98,.055,.10,'#a88c60',2);for(let z of[-.79,.79])smallAxle(b,z,.19,.85);for(let s of[-1,1])for(let z of[-.86,.0,.86])b.box(s*.49,.78,z,.06,.74,.06,'#676a4d',1);for(let i=0;i<9;i++){let x=(i%3-1)*.24,y=.53+Math.floor(i/3)*.18;b.cylinder(x,y,0,.11,.11,2.0,'#ad8e58',2,10,PI/2);b.cylinder(x,y,1.012,.086,.086,.024,'#ddc08a',0,10,PI/2)}return b.mesh()}
function makeCar(){let b=new Builder();b.box(0,.24,0,.55,.22,1.04,'#ad6e4b',1);b.box(0,.45,-.08,.50,.29,.55,'#bb8055',1);b.box(0,.61,-.1,.54,.065,.60,'#8b5e41',1);b.box(0,.47,.205,.40,.18,.021,'#769082',6);b.box(0,.46,-.367,.40,.17,.025,'#739081',6);for(let x of[-.27,.27])b.box(x,.47,-.07,.015,.19,.41,'#748d7f',6);for(let z of[-.31,.35]){b.cylinder(0,.19,z,.14,.14,.65,'#354638',1,12,0,PI/2);for(let x of[-.337,.337])b.cylinder(x,.19,z,.074,.074,.02,'#c9c0a0',1,10,0,PI/2)}for(let x of[-.19,.19])b.box(x,.28,.534,.105,.09,.03,'#e9daaf',10);b.box(0,.2,.57,.59,.06,.08,'#b6b298',1);return b.mesh()}
function buildTrains(){locoMesh=makeLoco();locoCabMesh=makeLoco(false);wheelMesh=makeWheels();tenderMesh=makeTender();coachMesh=makeCoach();bogieMesh=makeBogie();dieselMesh=makeDiesel();flatcarMesh=makeFlatcar();carMesh=makeCar();let b=new Builder();b.box(0,0,0,.042,.047,1.16,'#ccbd91',1);for(let z of[-.55,0,.55])b.cylinder(.017,0,z,.040,.04,.045,GOLD,1,10,0,PI/2);rodMesh=b.mesh();}
// Each vehicle queries a continuous history of actually traversed edges.
// Changing a turnout never changes the route underneath a moving carriage.
let journeyHistory=[],travel=0,chosenRoute='highline',speed=2.23,throttle=42,paused=false,stopRequested=false,atStation=false,completedLaps=0,travelled=0,arrivalTime=0;
const offsets=[0,2.70,5.19,8.37,11.55];let trainModels=[],bogieModels=[],leadInfo=null,wheelPhase=0;
function initJourney(){journeyHistory=[{edge:highline,start:0,end:highline.length},{edge:common,start:highline.length,end:highline.length+common.length}];travel=highline.length+common.length-7.6;updateTrainModels()}
function where(s){let tail=journeyHistory[journeyHistory.length-1];if(s>tail.end){let next=tail.edge===common?(chosenRoute==='highline'?highline:lowline):common;return next.at(s-tail.end)}for(let i=journeyHistory.length-1;i>=0;i--){let h=journeyHistory[i];if(s>=h.start-.00001&&s<=h.end+.00001){let a=h.edge.at(s-h.start);a.absolute=s;return a}}let h=journeyHistory[0];return h.edge.at(clamp(s-h.start,0,h.edge.length))}
function appendEdge(){let last=journeyHistory[journeyHistory.length-1],edge;if(last.edge===common){edge=chosenRoute==='highline'?highline:lowline;completedLaps++;}else edge=common;journeyHistory.push({edge,start:last.end,end:last.end+edge.length});if(journeyHistory.length>16)journeyHistory.shift()}
function advance(distance){travel+=Math.max(0,distance);travelled+=Math.max(0,distance);while(travel>journeyHistory[journeyHistory.length-1].end-1e-6)appendEdge()}
function distanceToStation(){let a=where(travel),stopD=common.length-7.0;if(a.edge===common&&a.d<=stopD+.05)return Math.max(0,stopD-a.d);let rem=a.edge.length-a.d;if(a.edge===common)return rem+(chosenRoute==='highline'?highline.length:lowline.length)+stopD;return rem+stopD}
function vehicleMatrix(s){let center=where(s),front=where(s+.60),rear=where(s-.60),f=norm(sub(front.p,rear.p));return basis(add(center.p,[0,.072,0]),f)}
function updateTrainModels(){leadInfo=where(travel);trainModels=offsets.map(o=>vehicleMatrix(travel-o));bogieModels=[];for(let o of offsets.slice(2))for(let d of[-.91,.91])bogieModels.push(vehicleMatrix(travel-o+d));}
let gateAngle=1.32;
function drawTrains(p=mainProgram){draw(viewMode==='cab'&&p===mainProgram?locoCabMesh:locoMesh,trainModels[0],p);draw(tenderMesh,trainModels[1],p);for(let i=2;i<5;i++)draw(coachMesh,trainModels[i],p);for(let m of bogieModels)draw(bogieMesh,m,p);for(let z of[-.70,-.15,.40])draw(wheelMesh,mm(trainModels[0],mm(trans(0,.325,z),rx(wheelPhase))),p);for(let s of[-1,1])draw(rodMesh,mm(trainModels[0],trans(s*.57,.325+.15*Math.cos(wheelPhase),-.15+.15*Math.sin(wheelPhase))),p);let a=yard.at(yard.length-3.0);draw(dieselMesh,basis(add(a.p,[0,.072,0]),a.f),p);a=yard.at(yard.length-5.83);draw(flatcarMesh,basis(add(a.p,[0,.072,0]),a.f),p);let ca=road.at(17.8);draw(carMesh,basis(add(ca.p,[0,.045,0]),ca.f),p);draw(crossingMesh,mm(crossingModel,rz(gateAngle)),p)}
const steam=[],maxSteam=110;let steamAccumulator=0,whistleSteam=0;
const PARTVS=`#version 300 es
precision highp float;layout(location=0)in vec4 aPosSize;layout(location=1)in vec4 aColor;uniform mat4 uVP;uniform vec3 uEye;uniform float uHeight;out vec4 vColor;void main(){vec4 p=uVP*vec4(aPosSize.xyz,1.);gl_Position=p;gl_PointSize=clamp(aPosSize.w*uHeight/max(p.w,.1),1.,220.);vColor=aColor;}`;
const PARTFS=`#version 300 es
precision highp float;in vec4 vColor;out vec4 frag;void main(){vec2 p=gl_PointCoord*2.-1.;float d=dot(p,p);if(d>1.)discard;float a=exp(-d*3.8)*(1.-smoothstep(.35,1.,d))*vColor.a;frag=vec4(vColor.rgb,a);}`;
function initSteam(){particleProgram=program(PARTVS,PARTFS);steamVAO=gl.createVertexArray();steamBuffer=gl.createBuffer();gl.bindVertexArray(steamVAO);gl.bindBuffer(gl.ARRAY_BUFFER,steamBuffer);gl.bufferData(gl.ARRAY_BUFFER,(maxSteam+150)*8*4,gl.DYNAMIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,4,gl.FLOAT,false,32,0);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,4,gl.FLOAT,false,32,16);gl.bindVertexArray(null)}
function emitSteam(big=false){if(steam.length>=maxSteam)steam.shift();let p=transform(big?[.0,1.58,-.07]:[0,1.75,1.03],trainModels[0]),f=leadInfo.f;steam.push({p,v:[rnd(-.10,.18)-f[0]*.15,rnd(.54,.78),rnd(-.10,.16)-f[2]*.15],age:0,life:rnd(2.4,4.0),size:big?.30:.17,big})}
function updateSteam(dt){steamAccumulator+=dt*(speed>0.1?6+speed*3.2:1.5);while(steamAccumulator>=1){emitSteam(whistleSteam>0);steamAccumulator--}whistleSteam=Math.max(0,whistleSteam-dt);for(let i=steam.length-1;i>=0;i--){let s=steam[i];s.age+=dt;if(s.age>s.life){steam.splice(i,1);continue}s.p=add(s.p,mul(s.v,dt));s.p[0]+=Math.sin(s.age*.9)*dt*.13;s.size+=dt*.21}}
function drawSteam(){let total=steam.length+roomDust.length;let data=new Float32Array(total*8);steam.forEach((s,i)=>{let fade=1-s.age/s.life,light=night?.50:.91;data.set([...s.p,s.size,light,light*.97,light*.86,fade*.35],i*8)});roomDust.forEach((d,i)=>{let t=roomClock*.16+d.phase;data.set([d.p[0]+Math.sin(t)*.7,d.p[1]+Math.sin(t*.51)*.6,d.p[2]+Math.cos(t*.7)*.5,d.size,.68,.57,.37,.2*roomLampLevel],(steam.length+i)*8)});gl.useProgram(particleProgram);um(particleProgram,'uVP',VP);uv3(particleProgram,'uEye',cameraPos);uf(particleProgram,'uHeight',screenH);gl.bindVertexArray(steamVAO);gl.bindBuffer(gl.ARRAY_BUFFER,steamBuffer);gl.bufferSubData(gl.ARRAY_BUFFER,0,data);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);gl.drawArrays(gl.POINTS,0,total);gl.depthMask(true);gl.disable(gl.BLEND)}

let audio=null,toastTimer=0,frame=0,lastTime=0,uiTime=0,currentPlace='',hidden=false,dragMoved=false;
let orbit={yaw:.40,pitch:.48,distance:124,target:[0,-2,0]},drag=null,pointers=new Map(),pinchStart=null,returnHelpFocus=null;
function toast(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3600)}
function savePrefs(){try{localStorage.setItem('alder-valley-grand-prefs-v1',JSON.stringify({throttle:typeof hobby==='object'&&hobby.cinema&&hobby.saved?hobby.saved.throttle:throttle,lightingMode,mood:lightingMoodForNight(targetNight),night:targetNight,roomLamps:roomLampTarget,route:chosenRoute}))}catch{}}
class RailwayAudio{
 constructor(){const AC=window.AudioContext||window.webkitAudioContext;this.ctx=new AC();this.master=this.ctx.createGain();this.master.gain.value=.48;this.master.connect(this.ctx.destination);let length=this.ctx.sampleRate*2;this.noise=this.ctx.createBuffer(1,length,this.ctx.sampleRate);let data=this.noise.getChannelData(0),last=0;for(let i=0;i<length;i++){last=(last+(Math.random()*2-1)*.03)/1.03;data[i]=last*6}this.rolling=this.ctx.createBufferSource();this.rolling.buffer=this.noise;this.rolling.loop=true;let filter=this.ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=460;this.rollGain=this.ctx.createGain();this.rollGain.gain.value=0;this.rolling.connect(filter).connect(this.rollGain).connect(this.master);this.rolling.start();this.active=true;this.lastChuff=-99;this.lastJoint=-99;this.nextBird=5;this.panner=this.ctx.createStereoPanner();this.panner.connect(this.master);}
 enable(on){this.active=on;if(on)this.ctx.resume();this.master.gain.setTargetAtTime(on?.48:0,this.ctx.currentTime,.12)}
 puff(volume=.1,duration=.12){if(!this.active)return;const c=this.ctx,t=c.currentTime,s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=this.noise;f.type='bandpass';f.frequency.value=500+speed*90;f.Q.value=.65;g.gain.setValueAtTime(.001,t);g.gain.linearRampToValueAtTime(volume,t+.016);g.gain.exponentialRampToValueAtTime(.001,t+duration);s.connect(f).connect(g).connect(this.panner);s.start(t,Math.random());s.stop(t+duration+.02)}
 tone(freq,time,duration,volume=.03,type='sine'){if(!this.active)return;let c=this.ctx,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(freq,time);g.gain.setValueAtTime(.001,time);g.gain.linearRampToValueAtTime(volume,time+.018);g.gain.exponentialRampToValueAtTime(.001,time+duration);o.connect(g).connect(this.panner);o.start(time);o.stop(time+duration+.05);return o}
 whistle(){if(!this.active)return;let c=this.ctx,t=c.currentTime;for(let [f,v]of[[392,.10],[493.88,.055],[587.33,.045]]){let o=c.createOscillator(),g=c.createGain(),flt=c.createBiquadFilter();o.type='triangle';o.frequency.setValueAtTime(f*.95,t);o.frequency.exponentialRampToValueAtTime(f,t+.15);o.frequency.setValueAtTime(f,t+.92);o.frequency.exponentialRampToValueAtTime(f*.97,t+1.45);flt.type='lowpass';flt.frequency.value=1900;g.gain.setValueAtTime(.001,t);g.gain.linearRampToValueAtTime(v,t+.14);g.gain.setValueAtTime(v,t+.91);g.gain.exponentialRampToValueAtTime(.001,t+1.53);o.connect(flt).connect(g).connect(this.panner);o.start();o.stop(t+1.56)}this.puff(.035,1.1)}
 bell(){let t=this.ctx.currentTime;for(let k=0;k<3;k++){this.tone(1046,t+k*.37,.8,.06);this.tone(1677,t+k*.37,.45,.012)}}
 switch(){let t=this.ctx.currentTime;this.tone(320,t,.07,.06,'triangle');this.tone(190,t+.075,.11,.04,'triangle')}
 update(dt){if(!this.active)return;let c=this.ctx;this.rollGain.gain.setTargetAtTime(paused?0:Math.min(speed*.008,.036),c.currentTime,.15);let p=project(leadInfo.p);this.panner.pan.setTargetAtTime(clamp((p.x/innerWidth-.5)*1.2,-.8,.8),c.currentTime,.15);let chuff=Math.floor(travel/.45),joint=Math.floor(travel/1.42);if(!paused&&speed>.08&&chuff!==this.lastChuff){this.puff(.05+speed*.01,.10);this.lastChuff=chuff}if(!paused&&speed>.08&&joint!==this.lastJoint){this.tone(165,c.currentTime,.045,.022,'triangle');this.tone(140,c.currentTime+.06,.04,.015,'triangle');this.lastJoint=joint}this.nextBird-=dt;if(this.nextBird<0&&!night&&!paused){this.nextBird=rnd(6,15);for(let i=0;i<3;i++){let o=this.tone(rnd(1700,2300),c.currentTime+i*.14,.09,.008);if(o)o.frequency.exponentialRampToValueAtTime(rnd(2600,3100),c.currentTime+i*.14+.07)}}}
}
function enableSound(force=false){try{if(!audio){audio=new RailwayAudio();}else audio.enable(force?true:!audio.active);$('audioBtn').classList.toggle('on',audio.active);$('audioBtn').setAttribute('aria-pressed',String(audio.active));$('audioBtn').setAttribute('aria-label',audio.active?'Mute railway sounds':'Enable railway sounds');$('audioBtn').querySelector('use').setAttribute('href',audio.active?'#i-sound':'#i-mute');if(!force)toast(audio.active?'The valley has a soundtrack.':'Railway sounds muted.')}catch(e){toast('Sound could not start in this browser.');console.warn(e)}}
function whistle(){if(!audio||!audio.active)enableSound(true);if(audio)audio.whistle();whistleSteam=1.6;for(let i=0;i<5;i++)emitSteam(true);$('whistleBtn').classList.add('active');setTimeout(()=>$('whistleBtn').classList.remove('active'),1500);if(navigator.vibrate)navigator.vibrate(22)}
function togglePause(){paused=!paused;$('playBtn').setAttribute('aria-label',paused?'Run the railway':'Pause the railway');$('playBtn').setAttribute('aria-pressed',String(paused));$('playBtn').querySelector('use').setAttribute('href',paused?'#i-play':'#i-pause');$('playBtn').classList.toggle('active',paused);updateUI();}
function setThrottle(v){throttle=clamp(Number(v)||0,0,100);$('throttle').value=String(throttle);$('throttle').style.setProperty('--fill',throttle+'%');$('throttleValue').textContent=Math.round(throttle)+'%';savePrefs()}
function switchRoute(){chosenRoute=chosenRoute==='highline'?'lowline':'highline';$('routeLabel').textContent=chosenRoute==='highline'?'The viaduct ↗':'The riverside ↗';$('routeButtonLabel').textContent=chosenRoute==='highline'?'Viaduct':'Riverside';$('routeBtn').classList.toggle('active',chosenRoute==='lowline');if(audio)audio.switch();toast(chosenRoute==='highline'?'Next junction: up and over the viaduct.':'Next junction: take the quiet riverside line.');savePrefs();if(navigator.vibrate)navigator.vibrate(12)}
function baseToggleStop(){if(atStation){atStation=false;stopRequested=false;throttle=throttle||42;setThrottle(throttle);$('stopBtn').classList.remove('active');$('stopLabel').textContent='Station stop';toast('All aboard. Next stop: the open countryside.');if(audio)audio.bell();if(paused)togglePause()}else{stopRequested=!stopRequested;$('stopBtn').classList.toggle('active',stopRequested);$('stopLabel').textContent=stopRequested?'Stop requested':'Station stop';toast(stopRequested?'Alder Vale is expecting you. Braking is automatic.':'Station stop cancelled. Enjoy the journey.')}updateUI()}
function project(p){let x=p[0],y=p[1],z=p[2],w=VP[3]*x+VP[7]*y+VP[11]*z+VP[15];return{x:(VP[0]*x+VP[4]*y+VP[8]*z+VP[12])/w*innerWidth/2+innerWidth/2,y:innerHeight/2-(VP[1]*x+VP[5]*y+VP[9]*z+VP[13])/w*innerHeight/2,visible:w>0}}
// Forward is local +Z: positive X rotation rolls the bottom of the wheel back
// against the rail. The wheels and valve gear share this phase.
function workshopUpdateSimulation(dt){night=mix(night,targetNight,1-Math.exp(-dt*.9));if(paused)return;let desired=throttle/100*5.3;if(atStation)desired=0;let distance=stopRequested&&!atStation?distanceToStation():Infinity;if(stopRequested&&!atStation)desired=Math.min(desired,Math.sqrt(2*.68*Math.max(distance-.025,0)));let rate=desired>speed?.42:.9;speed+=clamp(desired-speed,-rate*dt,rate*dt);let step=speed*dt;if(stopRequested&&!atStation&&distance<.08&&(step>=distance-.012||speed<.08)){advance(Math.max(0,distance));speed=0;atStation=true;arrivalTime=clock;$('stopLabel').textContent='Depart';toast('A perfect arrival. Welcome to Alder Vale.');if(audio)audio.bell()}else advance(step);wheelPhase+=step/.304;updateTrainModels();updateSteam(dt);let near=false;for(let o of[0,3,6,9,12]){let p=where(travel-o).p;if(Math.hypot(p[0]+21.3,p[2]-13)<8.0)near=true}gateAngle=mix(gateAngle,near?0:1.32,1-Math.exp(-dt*2));}
const mapctx=$('map').getContext('2d');
function drawMap(){const c=mapctx,w=c.canvas.width,h=c.canvas.height;c.clearRect(0,0,w,h);let tx=x=>w*.48+x*w*.0137,tz=z=>h*.50+z*h*.023;let selected=chosenRoute==='highline'?highline:lowline;c.strokeStyle='#8fada326';c.lineWidth=5;c.beginPath();for(let z=-20;z<=20;z+=.5){let x=riverX(z);z===-20?c.moveTo(tx(x),tz(z)):c.lineTo(tx(x),tz(z))}c.stroke();function path(edge,color,width){c.strokeStyle=color;c.lineWidth=width;c.lineJoin='round';c.lineCap='round';c.beginPath();for(let d=0;d<edge.length;d+=.35){let p=edge.at(d).p;d===0?c.moveTo(tx(p[0]),tz(p[2])):c.lineTo(tx(p[0]),tz(p[2]))}let p=edge.at(edge.length).p;c.lineTo(tx(p[0]),tz(p[2]));c.stroke()}path(highline,'#647c6d66',2.0);path(lowline,'#647c6d66',2.0);path(yard,'#647c6d55',1.3);path(selected,'#dfc18a',2.3);path(common,'#b8c5a4',2.1);c.fillStyle='#283d30';c.strokeStyle='#ebd9ab';c.lineWidth=1.5;c.fillRect(tx(-15),tz(14)+5,26,5);c.strokeRect(tx(-15),tz(14)+5,26,5);c.fillStyle='#aebfa7';c.font='11px Arial';c.textAlign='center';c.fillText('ALDER VALE',tx(-11),tz(14)+27);c.beginPath();c.arc(tx(0),tz(14),4.3,0,TAU);c.fillStyle='#e6c581';c.fill();for(let o of[11.55,8.37,5.19,2.7]){let p=where(travel-o).p;c.beginPath();c.arc(tx(p[0]),tz(p[2]),2.25,0,TAU);c.fillStyle='#d9d3ac';c.fill()}let p=leadInfo.p;c.shadowColor='#f0ce88';c.shadowBlur=9;c.fillStyle='#fbe2ac';c.beginPath();c.arc(tx(p[0]),tz(p[2]),3.9,0,TAU);c.fill();c.shadowBlur=0;}
function updateBaseUI(){if(!leadInfo)return;$('speedValue').textContent=Math.round((paused?0:speed)*8.073);$('runState').textContent=paused?'Railway paused':atStation?'At Alder Vale':stopRequested?'Calling at Alder Vale':'Miniature, not motionless';$('engineStatus').innerHTML='<span class="status-dot">●</span> '+(atStation?'At the platform · Ready to depart':stopRequested?'Alder Vale · Stop requested':paused?'Taking a little breather':'4-6-0 · Passenger service');let place,title,detail,overline='A WORLD WORTH SLOWING DOWN FOR';if(atStation){place='station-stop';title='Welcome to Alder Vale.';detail='A moment to linger. Choose Depart when you’re ready.';overline='PLATFORM 1 · A PERFECT ARRIVAL'}else if(leadInfo.edge===highline&&leadInfo.d>9&&leadInfo.d<38){place='viaduct';title='A little above it all.';detail='Seven stone arches. One unhurried crossing.';overline='ALDER VIADUCT · THE HIGH LINE'}else if(leadInfo.edge===common&&leadInfo.d>tunnelStart&&leadInfo.d<tunnelEnd){place='tunnel';title='Through the old mountain.';detail='Built in 1898. Still the best way through.';overline='FERNHOLLOW TUNNEL · KEEP LISTENING'}else if(leadInfo.edge===lowline){place='riverside';title='The road less hurried.';detail='Along the water, beneath the willows.';overline='RIVERSIDE BRANCH · THE LOW LINE'}else if(leadInfo.edge===common&&leadInfo.d>common.length-20){place='station';title='All aboard, Nightingale.';detail='Past the village. Over the valley. Home again.'}else{place='countryside';title='Nowhere else to be.';detail='A winding line through a world in miniature.';overline='THE ALDER VALLEY RAILWAY · SINCE 1898'}if(place!==currentPlace){$('locationTitle').textContent=title;$('locationDetail').textContent=detail;$('locationOverline').textContent=overline;currentPlace=place}drawMap()}
function render(){gl.enable(gl.DEPTH_TEST);gl.disable(gl.BLEND);gl.viewport(0,0,shadowSize,shadowSize);gl.useProgram(shadowProgram);um(shadowProgram,'uVP',lightVP);
 if(shadowDirty){gl.bindFramebuffer(gl.FRAMEBUFFER,shadowCacheFbo);gl.clear(gl.DEPTH_BUFFER_BIT);drawHobbyStatic(shadowProgram,true);shadowDirty=false;}
 gl.bindFramebuffer(gl.READ_FRAMEBUFFER,shadowCacheFbo);gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER,shadowFbo);gl.blitFramebuffer(0,0,shadowSize,shadowSize,0,0,shadowSize,shadowSize,gl.DEPTH_BUFFER_BIT,gl.NEAREST);gl.bindFramebuffer(gl.FRAMEBUFFER,shadowFbo);drawHobbyTrains(shadowProgram);if(building&&gesture?.kind==='move')renderObject(getSelected(),shadowProgram);
 gl.bindFramebuffer(gl.FRAMEBUFFER,msaaFbo||sceneFbo);gl.viewport(0,0,screenW,screenH);let bg=lerpV([.019,.036,.037],[.014,.024,.04],night);gl.clearColor(...bg,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(mainProgram);um(mainProgram,'uVP',VP);um(mainProgram,'uLightVP',lightVP);uv3(mainProgram,'uEye',cameraPos);uv3(mainProgram,'uSun',sunDir);uv3(mainProgram,'uHead',transform([0,1.3,1.7],hobbyTrainMatrix()));uv3(mainProgram,'uForward',hobbyTrainInfo().f);gl.uniform3fv(uniform(mainProgram,'uLamps[0]'),new Float32Array(lampPositions.slice(0,8).flat()));uf(mainProgram,'uNight',night);uf(mainProgram,'uTime',clock*(reduceMotion?0:1));gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,shadowTex);gl.uniform1i(uniform(mainProgram,'uShadow'),0);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,atlasTexture);gl.uniform1i(uniform(mainProgram,'uAtlas'),1);gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,roomAtlasTexture);gl.uniform1i(uniform(mainProgram,'uRoomAtlas'),2);gl.uniform3fv(uniform(mainProgram,'uRoomLights[0]'),new Float32Array(houseRoomLights(hobby.room).flat()));uf(mainProgram,'uRoomLevel',roomLampLevel);uf(mainProgram,'uRain',rainAmount);drawHobbyStatic(mainProgram,false);drawHobbyTrains(mainProgram);if(hobby.room==='valley'&&!(typeof isShopMapActive==='function'&&isShopMapActive()))for(let i=0;i<signalModels.length;i++){let occupied=i===1&&leadInfo.edge===common&&leadInfo.d>tunnelStart-3&&leadInfo.d<tunnelEnd+12;draw(occupied?signalRedMesh:signalGreenMesh,signalModels[i]);}drawHobbyParticles();
 if(msaaFbo){gl.bindFramebuffer(gl.READ_FRAMEBUFFER,msaaFbo);gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER,sceneFbo);gl.blitFramebuffer(0,0,screenW,screenH,0,0,screenW,screenH,gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT,gl.NEAREST);}gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,screenW,screenH);gl.disable(gl.DEPTH_TEST);gl.useProgram(postProgram);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,sceneTex);gl.uniform1i(uniform(postProgram,'uScene'),0);gl.uniform2f(uniform(postProgram,'uResolution'),screenW,screenH);uf(postProgram,'uTime',clock);uf(postProgram,'uNight',night);uf(postProgram,'uMacro',(building?0:lensAmount)*(viewMode==='cab'?.20:viewMode==='room'?.32:viewMode==='station'?1.1:.65));uf(postProgram,'uFocus',len(sub(cameraPos,cameraTarget)));uf(postProgram,'uNear',cameraNear);gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,sceneDepth);gl.uniform1i(uniform(postProgram,'uDepth'),3);gl.bindVertexArray(null);gl.drawArrays(gl.TRIANGLES,0,3);}
function animate(now){if(document.hidden){lastTime=now;requestAnimationFrame(animate);return}let dt=lastTime?Math.min((now-lastTime)/1000,.065):1/60;lastTime=now;clock+=paused?0:dt;roomClock+=dt;rainAmount=mix(rainAmount,rainTarget,1-Math.exp(-dt*2));roomLampLevel=mix(roomLampLevel,roomLampTarget,1-Math.exp(-dt*3));resize();updateSimulation(dt);updateCamera(dt);if(audio)audio.update(dt);updateHobbyAudio(dt);render();updateEditorOverlay();uiTime+=dt;if(uiTime>.12){updateUI();uiTime=0}frame++;requestAnimationFrame(animate)}
function showHelp(){returnHelpFocus=document.activeElement;$('help').hidden=false;$('helpClose').focus()}function closeHelp(){$('help').hidden=true;if(returnHelpFocus&&returnHelpFocus.focus)returnHelpFocus.focus()}
function hideUI(){hidden=!hidden;document.body.classList.toggle('hidden-ui',hidden)}
function workshopSetView(mode,announce=true){
 viewMode=mode;tourStart=roomClock;document.body.classList.toggle('train-focus',mode==='engine');$('trainInspector').hidden=mode!=='engine'||building;
 for(const btn of document.querySelectorAll('[data-camera]')){const active=btn.dataset.camera===mode;btn.classList.toggle('selected',active);btn.setAttribute('aria-pressed',String(active));}
 $('cabMark').classList.toggle('show',mode==='cab');
 const portrait=innerWidth<700&&innerHeight>innerWidth;
 if(mode==='room'){orbit.distance=portrait?178:113;orbit.target=[0,-2,0];orbit.pitch=portrait?.69:.50;orbit.yaw=portrait?.24:.40;}
 if(mode==='overview'){orbit.distance=portrait?149:88;orbit.target=[0,1.8,0];orbit.pitch=portrait?.92:.79;orbit.yaw=portrait?.12:.48;}
 if(announce&&mode==='cab')toast('On the footplate. H sounds the whistle.');
 currentPlace='';updateUI();
}
function workshopUpdateCamera(dt){
 let pos,target,fov=.73,rate=5;
 if(viewMode==='room'||viewMode==='overview'){
  let r=orbit.distance,cp=Math.cos(orbit.pitch);pos=add(orbit.target,[Math.sin(orbit.yaw)*cp*r,Math.sin(orbit.pitch)*r,Math.cos(orbit.yaw)*cp*r]);target=orbit.target;rate=9;fov=innerWidth<700?.87:.73;
 }else if(viewMode==='engine'){
  const portrait=innerWidth<700;pos=engineInspectionView();target=transform([0,.95,portrait?.15:-.35],trainModels[0]);fov=portrait?.96:.62;rate=5;
 }else if(viewMode==='station'){
  pos=[-12.5,5.9,29.0];target=[-10.5,2.05,12.5];fov=innerWidth<700?.85:.70;rate=3.5;
 }else if(viewMode==='follow'){
  const p=leadInfo.p,f=leadInfo.f,r=norm([f[2],0,-f[0]]);pos=add(add(add(p,mul(f,-8.8)),mul(r,6.7)),[0,4.8,0]);pos[1]=Math.max(pos[1],naturalH(pos[0],pos[2])+2.2);target=add(p,[0,1.0,0]);fov=.81;rate=2.3;
 }else if(viewMode==='tour'){
  const views=[
   {p:[42,53,96],t:[0,-2,0]},
   {p:[26,11,36],t:[17,2.2,11]},
   {p:[-14,7.2,34],t:[-9,2.2,12]},
   {p:[-10,33,53],t:[-5,2.5,-3]},
   {p:[-23,8,28],t:[-36,-7,-5]},
   {p:[58,36,58],t:[0,-2,-2]}
  ];
  let tt=(roomClock-tourStart)/13,idx=Math.floor(tt)%views.length,phase=tt%1,a=views[idx],b=views[(idx+1)%views.length],t=smooth(.45,1,phase);pos=lerpV(a.p,b.p,t);target=lerpV(a.t,b.t,t);fov=innerWidth<700?.96:.72;rate=2;
 }else{
  pos=transform([.39,1.68,-.97],trainModels[0]);target=add(where(travel+8).p,[0,1.45,0]);fov=1.02;rate=16;
 }
 const blend=1-Math.exp(-dt*rate);cameraPos=lerpV(cameraPos,pos,blend);cameraTarget=lerpV(cameraTarget,target,blend);
 cameraNear=clamp(len(sub(cameraPos,cameraTarget))*.006,.06,.75);const projection=perspective(fov,screenW/screenH,cameraNear,500);
 // Viewing controls are now tucked away; only the workbench needs extra space.
 if(building){projection[8]=innerWidth<821?0:-.22;projection[9]=innerWidth<821?-.20:-.05;}cameraProjection=projection;
 VP=mm(projection,lookAt(cameraPos,cameraTarget));
}
function beginManualOrbit(){
 if(viewMode==='room'||viewMode==='overview')return;
 let delta=sub(cameraPos,cameraTarget),r=len(delta);orbit.target=cameraTarget.slice();orbit.distance=r;orbit.pitch=Math.asin(clamp(delta[1]/r,-.95,.95));orbit.yaw=Math.atan2(delta[0],delta[2]);
 viewMode='overview';for(let b of document.querySelectorAll('[data-camera]')){let active=b.dataset.camera===viewMode;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active));}$('cabMark').classList.remove('show');
}
const LIGHT_MOODS={day:{night:0,lamps:.40,label:'Afternoon'},evening:{night:.62,lamps:1,label:'Lamplight'},night:{night:1,lamps:.38,label:'Night run'}};
let lightingMode='auto',lightingClockTimer=null,lightingClockListening=false;
function lightingMoodForNight(value){return value<.2?'day':value>.85?'night':'evening';}
function localLightingMood(date=new Date()){const hour=date.getHours();return hour>=19||hour<7?'night':'day';}
function scheduleLocalLighting(){
 if(!lightingClockListening){document.addEventListener('visibilitychange',syncLocalLighting);lightingClockListening=true;}
 clearTimeout(lightingClockTimer);lightingClockTimer=null;
 if(lightingMode==='auto'&&!document.hidden)lightingClockTimer=setTimeout(syncLocalLighting,60000);
}
function syncLocalLighting(){
 if(lightingMode==='auto'&&!document.hidden&&lightingMoodForNight(targetNight)!==localLightingMood())setMood('auto',{persist:false});
 else scheduleLocalLighting();
}
function toggleLight(){setMood(lightingMoodForNight(targetNight)==='day'?'evening':'day');}
function setMood(mood,options={}){
 lightingMode=mood==='auto'?'auto':'manual';if(lightingMode==='auto')mood=localLightingMood();
 if(!Object.hasOwn(LIGHT_MOODS,mood))mood='evening';
 const preset=LIGHT_MOODS[mood];targetNight=preset.night;roomLampTarget=Number.isFinite(options.lamps)?clamp(options.lamps):preset.lamps;
 if(options.immediate){night=targetNight;roomLampLevel=roomLampTarget;}
 $('lightBtn').querySelector('span').textContent=preset.label;$('lightBtn').querySelector('use').setAttribute('href',mood==='day'?'#i-sun':'#i-moon');
 $('lightBtn').setAttribute('aria-label',preset.label+(lightingMode==='auto'?', matching local time':'')+'. Change lighting.');
 $('lightBtn').title=preset.label+(lightingMode==='auto'?' · Matching local time':' · Change lighting');
 $('roomDimmer').value=Math.round(roomLampTarget*100);$('roomDimmer').style.setProperty('--fill',Math.round(roomLampTarget*100)+'%');$('lampValue').textContent=Math.round(roomLampTarget*100)+'%';
 for(const button of document.querySelectorAll('[data-mood]'))button.setAttribute('aria-pressed',String(button.dataset.mood===(lightingMode==='auto'?'auto':mood)));
 scheduleLocalLighting();
 if(options.persist!==false)savePrefs();
}
function restoreLightingPrefs(saved){
 const valid=saved&&typeof saved==='object'&&!Array.isArray(saved);
 const previous=valid&&Object.hasOwn(LIGHT_MOODS,saved.mood)?saved.mood:valid&&Number.isFinite(saved.night)?lightingMoodForNight(clamp(saved.night)):null;
 // Untagged saved moods predate automatic lighting; retain those existing choices.
 // Automatic throttle/route saves must never turn the current hour into a preset.
 const manual=valid&&(saved.lightingMode==='manual'||saved.lightingMode===undefined&&previous);
 const mood=manual&&previous?previous:'auto',resolved=mood==='auto'?localLightingMood():mood;
 const lamps=valid&&(manual||previous===resolved)&&Number.isFinite(saved.roomLamps)?saved.roomLamps:undefined;
 setMood(mood,{immediate:true,persist:false,lamps});
}
function workshopUpdateUI(){
 updateBaseUI();
 if(viewMode==='room'){$('locationOverline').textContent='A small world. A place of your own.';$('locationTitle').textContent=night>.3?'An evening at the railway.':'The afternoon is yours.';$('locationDetail').textContent='Oak, brass, and the sound of the wheels.';currentPlace='room';}
 if(viewMode==='engine'){$('locationOverline').textContent='THE LOCOMOTIVE WORKS · No. 07';$('locationTitle').textContent='Made to be looked at.';$('locationDetail').textContent='Open spokes, moving valve gear, and warm carriage interiors.';currentPlace='engine';}
 if(viewMode==='tour'){$('locationOverline').textContent='THE SLOW TOUR';$('locationTitle').textContent='Let the world go by.';$('locationDetail').textContent='A closer look, one little story at a time.';currentPlace='tour';}
 $('runState').textContent=paused?'Railway paused':atStation?'At the platform':stopRequested?'Calling at Alder Vale':'Passenger service';
}
function capturePhoto(){
 render();try{const a=document.createElement('a');a.download='whistlevale-'+(typeof hobby==='object'?hobby.room:'valley')+'.png';a.href=canvas.toDataURL('image/png');a.click();toast('Your railway room, photographed.');}catch{toast('This browser could not save the photograph.');}
}
function toggleDiagram(){let show=$('layoutPanel').hidden;$('layoutPanel').hidden=!show;$('ambiencePanel').hidden=true;$('mapBtn').setAttribute('aria-expanded',String(show));$('diagramToggle').setAttribute('aria-pressed',String(show));$('ambienceBtn').setAttribute('aria-expanded','false');if(show)drawMap();}
function workshopBindControls(){
 $('playBtn').onclick=togglePause;$('throttle').oninput=e=>setThrottle(e.target.value);$('whistleBtn').onclick=whistle;$('routeBtn').onclick=switchRoute;$('map').onclick=switchRoute;$('stopBtn').onclick=toggleStop;$('lightBtn').onclick=toggleLight;$('audioBtn').onclick=()=>enableSound();$('helpBtn').onclick=()=>{$('ambiencePanel').hidden=true;showHelp()};$('helpClose').onclick=closeHelp;$('restore').onclick=hideUI;$('photoBtn').onclick=capturePhoto;
 $('mobilePhotoBtn').onclick=capturePhoto;$('immerseBtn').onclick=()=>{$('ambiencePanel').hidden=true;hideUI();};
 $('mapBtn').onclick=toggleDiagram;$('diagramToggle').onclick=toggleDiagram;
 $('ambienceBtn').onclick=()=>{let show=$('ambiencePanel').hidden;$('ambiencePanel').hidden=!show;$('layoutPanel').hidden=true;$('ambienceBtn').setAttribute('aria-expanded',String(show));$('mapBtn').setAttribute('aria-expanded','false');};
 $('roomDimmer').oninput=e=>{roomLampTarget=clamp(Number(e.target.value)/100);e.target.style.setProperty('--fill',Math.round(roomLampTarget*100)+'%');$('lampValue').textContent=Math.round(roomLampTarget*100)+'%';savePrefs();};
 $('lensBtn').onclick=()=>{lensAmount=lensAmount?0:.65;$('lensBtn').setAttribute('aria-pressed',String(lensAmount>0));};
 $('rainBtn').onclick=()=>{rainTarget=rainTarget?0:1;$('rainBtn').setAttribute('aria-pressed',String(rainTarget>0));};
 for(const b of document.querySelectorAll('[data-camera]'))b.onclick=()=>setView(b.dataset.camera);
 for(const b of document.querySelectorAll('[data-mood]'))b.onclick=()=>setMood(b.dataset.mood);
 document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){closeHelp();$('ambiencePanel').hidden=true;$('layoutPanel').hidden=true;$('mapBtn').setAttribute('aria-expanded','false');$('ambienceBtn').setAttribute('aria-expanded','false');if(hidden)hideUI();return;}
  if(!$('help').hidden){if(e.key==='Tab'){const first=$('helpClose');e.preventDefault();first.focus();}return;}
  if(e.target.closest('button')&&(e.key===' '||e.key==='Enter'))return;
  if(e.target.matches('input,textarea,select')||e.ctrlKey||e.metaKey||e.altKey)return;
  const k=e.key.toLowerCase();if(k===' '){e.preventDefault();togglePause();}else if(k==='h')whistle();else if(k==='r')switchRoute();else if(k==='s')toggleStop();else if(k==='n')toggleLight();else if(k==='f')hideUI();else if(k==='p')capturePhoto();else if(k==='m')toggleDiagram();else if('123456'.includes(k)&&k.length===1)setView(['room','overview','station','follow','cab','tour'][Number(k)-1]);
  window.railwayAnalytics?.shortcut?.(k);
 });
 canvas.addEventListener('pointerdown',e=>{
  if(!$('help').hidden)return;
  $('ambiencePanel').hidden=true;$('layoutPanel').hidden=true;
  canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);dragMoved=false;
  if(pointers.size===1){drag={x:e.clientX,y:e.clientY,yaw:orbit.yaw,pitch:orbit.pitch,target:orbit.target.slice(),pan:e.button===2||e.shiftKey,auto:viewMode!=='room'&&viewMode!=='overview'};}
  if(pointers.size===2){beginManualOrbit();const p=[...pointers.values()];pinchStart={distance:Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1]),zoom:orbit.distance,cx:(p[0][0]+p[1][0])/2,cy:(p[0][1]+p[1][1])/2,target:orbit.target.slice()};}
 });
 canvas.addEventListener('pointermove',e=>{
  if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,[e.clientX,e.clientY]);
  if(pointers.size===2&&pinchStart){beginManualOrbit();const p=[...pointers.values()],d=Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1]);orbit.distance=clamp(pinchStart.zoom*pinchStart.distance/Math.max(d,10),6,430);const cx=(p[0][0]+p[1][0])/2,cy=(p[0][1]+p[1][1])/2,r=[Math.cos(orbit.yaw),0,-Math.sin(orbit.yaw)],f=[Math.sin(orbit.yaw),0,Math.cos(orbit.yaw)],scale=orbit.distance*.001;orbit.target=add(pinchStart.target,add(mul(r,-(cx-pinchStart.cx)*scale),mul(f,-(cy-pinchStart.cy)*scale)));dragMoved=true;return;}
  if(!drag||pointers.size!==1)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>4)dragMoved=true;if(!dragMoved)return;if(drag.auto){beginManualOrbit();drag.yaw=orbit.yaw;drag.pitch=orbit.pitch;drag.target=orbit.target.slice();drag.auto=false;}
  if(drag.pan){const scale=orbit.distance*.00085,r=[Math.cos(orbit.yaw),0,-Math.sin(orbit.yaw)],f=[Math.sin(orbit.yaw),0,Math.cos(orbit.yaw)];orbit.target=add(drag.target,add(mul(r,-dx*scale),mul(f,-dy*scale)));orbit.target[0]=clamp(orbit.target[0],-92,92);orbit.target[2]=clamp(orbit.target[2],-76,76);}else{orbit.yaw=drag.yaw-dx*.0048;orbit.pitch=clamp(drag.pitch+dy*.0036,.065,1.43);}
 });
 const release=e=>{
  pointers.delete(e.pointerId);
  if(!dragMoved&&drag&&(viewMode==='overview'||viewMode==='room')){let p=project([0,1.2,14]);if(p.visible&&Math.hypot(p.x-e.clientX,p.y-e.clientY)<20)switchRoute();let r=project([13,-4,24]);if(r.visible&&Math.hypot(r.x-e.clientX,r.y-e.clientY)<17)switchRoute();}
  drag=null;pinchStart=null;
 };
 canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('contextmenu',e=>e.preventDefault());
 canvas.addEventListener('wheel',e=>{e.preventDefault();beginManualOrbit();orbit.distance=clamp(orbit.distance*Math.exp(clamp(e.deltaY,-160,160)*.0012),6,430);},{passive:false});
 canvas.addEventListener('dblclick',()=>{beginManualOrbit();orbit.target=add(leadInfo.p,[0,1,0]);orbit.distance=15;toast('A closer look. Drag to explore.');});
 document.addEventListener('visibilitychange',()=>{lastTime=0;if(audio){if(document.hidden)audio.ctx.suspend();else if(audio.active)audio.ctx.resume().catch(()=>{});}});
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();paused=true;$('error').style.display='block';$('error').innerHTML='The graphics context was interrupted.<br><button onclick="location.reload()" style="margin-top:12px;color:#e7cc91;text-decoration:underline">Reload the railway room</button>';});
 let wasPortrait=innerHeight>innerWidth;window.addEventListener('resize',()=>{resize();let portraitNow=innerHeight>innerWidth;if(portraitNow!==wasPortrait&&(viewMode==='room'||viewMode==='overview'))setView(viewMode,false);wasPortrait=portraitNow;});
}

// The collector's atelier. All geometry, illustrations and surfaces are built here.
// Scene units are shared with the railway: the board is at Y=0, floor at Y=-24.
let cameraNear=.7,msaaFbo=null,msaaColor=null,msaaDepth=null,msaaSamples=0;let roomFloorMesh, roomFurnitureMesh, roomCeilingMesh, roomWalls=[], roomAtlasTexture;
let rainAmount=0,rainTarget=0;let roomClock=0, roomLampLevel=1, roomLampTarget=1, lensAmount=.5, tourStart=0;
const roomDisplays=[], roomDust=[], FLOOR=-23.97;
const roomLightPositions=[[-22,26,-7],[21,27,0],[-46,5,5],[-39,13,-43],[42,6,-43],[42,-7,23]];
const roomArt=document.createElement('canvas');roomArt.width=4096;roomArt.height=2048;
const rctx=roomArt.getContext('2d'),roomLabels={};
function artSlot(key,x,y,w,h,paint){
 if(![x,y,w,h].every(Number.isFinite)||x<0||y<0||w<=0||h<=0||x+w>roomArt.width||y+h>roomArt.height){delete roomLabels[key];return null;}
 rctx.save();try{rctx.translate(x,y);rctx.beginPath();rctx.rect(0,0,w,h);rctx.clip();paint(rctx,w,h);}finally{rctx.restore();}
 return roomLabels[key]={u0:x/roomArt.width,v0:1-(y+h)/roomArt.height,u1:(x+w)/roomArt.width,v1:1-y/roomArt.height};
}
function roomSign(b,key,x,y,z,w,h,angle=0,mat=32){const q=roomLabels[key];b.push(x,y,z,0,angle);b.quad([-w/2,-h/2,0],[w/2,-h/2,0],[w/2,h/2,0],[-w/2,h/2,0],'#ffffff',mat,[0,0,1],[[q.u0,q.v0],[q.u1,q.v0],[q.u1,q.v1],[q.u0,q.v1]]);b.pop();}
function onTop(b,key,x,y,z,w,d){b.push(x,y,z,-PI/2);roomSign(b,key,0,0,0,w,d);b.pop();}
function initRoomArt(){
 // Register room modules before startup. Changing this height changes every UV;
 // runtime additions require the whole atlas and all geometry using it to rebuild.
 const roomCount=typeof HOUSE_ROOMS==='object'?Object.keys(HOUSE_ROOMS).length:4;
 const textureLimit=gl.getParameter(gl.MAX_TEXTURE_SIZE);
 if(textureLimit<roomArt.width||textureLimit<2048)throw new Error('This device cannot load the hobby house illustration atlas.');
 const requestedHeight=2048+Math.ceil(Math.max(0,roomCount-4)/4)*200;
 const atlasHeight=Math.min(requestedHeight,textureLimit,4096); // Bound canvas and GPU memory even for a very large registry.
 if(roomArt.height!==atlasHeight)roomArt.height=atlasHeight;
 rctx.clearRect(0,0,roomArt.width,roomArt.height);
 for(const key of Object.keys(roomLabels))delete roomLabels[key];
 artSlot('poster',4,4,600,840,(c,w,h)=>{
  c.fillStyle='#e7d8b6';c.fillRect(0,0,w,h);c.fillStyle='#264d46';c.fillRect(26,26,w-52,h-52);c.fillStyle='#b6c8ad';c.fillRect(38,38,w-76,548);
  c.fillStyle='#e3c27e';c.beginPath();c.arc(403,168,72,0,TAU);c.fill();
  for(let i=0;i<3;i++){c.fillStyle=['#8caa98','#547e70','#315c50'][i];c.beginPath();c.moveTo(38,600);for(let x=38;x<=w-38;x+=8)c.lineTo(x,252+i*88+Math.sin(x*.008+i*3)*67+Math.sin(x*.021+i)*26);c.lineTo(w-38,610);c.closePath();c.fill();}
  c.fillStyle='#d4bea0';c.fillRect(56,428,488,42);for(let x=74;x<540;x+=86){c.fillRect(x,450,66,127);c.save();c.globalCompositeOperation='destination-out';c.beginPath();c.arc(x+33,483,24,PI,TAU);c.lineTo(x+57,577);c.lineTo(x+9,577);c.closePath();c.fill();c.restore();c.fillStyle='#244f47';c.beginPath();c.arc(x+33,483,24,PI,TAU);c.lineTo(x+57,577);c.lineTo(x+9,577);c.closePath();c.fill();c.fillStyle='#d4bea0';}
  c.fillStyle='#1a3934';c.fillRect(132,405,126,19);c.fillRect(177,388,15,21);c.fillRect(214,389,27,24);for(let x=269;x<440;x+=59){c.fillRect(x,401,53,22);c.fillStyle='#d6c999';for(let j=0;j<5;j++)c.fillRect(x+6+j*9,405,5,8);c.fillStyle='#1a3934';}
  c.strokeStyle='#eff0d0';c.lineWidth=8;c.lineCap='round';c.beginPath();c.moveTo(181,384);c.bezierCurveTo(130,359,151,348,93,332);c.stroke();
  c.fillStyle='#edddba';c.textAlign='center';c.font='58px Georgia';c.fillText('ALDER VALLEY',300,665);c.font='18px Arial';c.fillText('T H E   S C E N I C   R A I L W A Y',300,710);c.strokeStyle='#bea36d';c.lineWidth=1;c.beginPath();c.moveTo(132,748);c.lineTo(468,748);c.stroke();c.font='italic 24px Georgia';c.fillText('Take the long way home.',300,784);
 });
 artSlot('blueprint',610,4,900,510,(c,w,h)=>{
  c.fillStyle='#203b41';c.fillRect(0,0,w,h);c.strokeStyle='#a6d0c421';c.lineWidth=1;for(let x=20;x<w;x+=24){c.beginPath();c.moveTo(x,20);c.lineTo(x,h-20);c.stroke();}for(let y=20;y<h;y+=24){c.beginPath();c.moveTo(20,y);c.lineTo(w-20,y);c.stroke();}
  c.strokeStyle='#c5d4bd';c.lineWidth=2;c.strokeRect(22,22,w-44,h-44);c.fillStyle='#ced9c3';c.textAlign='left';c.font='28px Georgia';c.fillText('NIGHTINGALE  ·  No. 07',48,74);c.font='13px Arial';c.fillText('ALDER VALLEY WORKS     /     LOCOMOTIVE PLATE 04     /     4-6-0',48,103);
  c.beginPath();c.roundRect(245,180,305,98,30);c.stroke();c.strokeRect(145,150,100,128);c.strokeRect(120,135,142,15);c.strokeRect(125,280,480,20);c.strokeRect(505,127,23,65);c.strokeRect(330,157,36,22);c.strokeRect(40,210,80,85);c.strokeRect(160,167,50,51);
  for(let x of[230,323,416]){c.beginPath();c.arc(x,310,43,0,TAU);c.stroke();for(let a=0;a<TAU;a+=PI/5){c.beginPath();c.moveTo(x,310);c.lineTo(x+Math.cos(a)*38,310+Math.sin(a)*38);c.stroke();}}
  for(let x of[517,570,62,99]){c.beginPath();c.arc(x,326,24,0,TAU);c.stroke();}
  c.strokeRect(224,310,196,7);c.beginPath();c.moveTo(125,360);c.lineTo(603,360);c.moveTo(125,373);c.lineTo(603,373);c.stroke();c.font='15px monospace';c.fillText('GAUGE  16.5 MM',665,196);c.fillText('DRIVER  72 IN',665,230);c.fillText('BUILT   1898',665,264);c.fillText('SCALE   Freeform',665,298);c.font='italic 23px Georgia';c.fillText('Every great journey begins in a small workshop.',48,451);
 });
 artSlot('window',1516,4,1320,750,(c,w,h)=>{
  let g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#688d9c');g.addColorStop(.52,'#b6c2b3');g.addColorStop(.82,'#d9c19c');g.addColorStop(1,'#566f63');c.fillStyle=g;c.fillRect(0,0,w,h);
  let glow=c.createRadialGradient(958,350,0,958,350,260);glow.addColorStop(0,'#ffe3a470');glow.addColorStop(1,'#ffe3a400');c.fillStyle=glow;c.fillRect(0,0,w,h);
  for(let i=0;i<5;i++){c.fillStyle=['#869d95','#718e83','#52756c','#3c6055','#254b43'][i];c.beginPath();c.moveTo(0,h);for(let x=0;x<=w;x+=8)c.lineTo(x,440+i*49+Math.sin(x*.009+i*1.7)*40+Math.sin(x*.024+i*3)*15);c.lineTo(w,h);c.closePath();c.fill();}
  c.strokeStyle='#183d39';c.lineWidth=7;for(let i=0;i<12;i++){let x=hash(i,28)*w,hh=130+hash(i,36)*210,y=h-30;c.beginPath();c.moveTo(x,y);c.lineTo(x+10,y-hh);c.stroke();for(let j=0;j<6;j++){let yy=y-hh+j*hh*.13,ww=(j+1)*9;c.fillStyle=i%2?'#345a4b':'#22483f';c.beginPath();c.moveTo(x+10,yy-20);c.lineTo(x-ww,yy+45);c.lineTo(x+ww+16,yy+40);c.closePath();c.fill();}}
 });
 artSlot('slow',2842,4,540,760,(c,w,h)=>{
  c.fillStyle='#d4b587';c.fillRect(0,0,w,h);c.fillStyle='#183f3e';c.fillRect(22,22,w-44,h-44);c.fillStyle='#c79756';c.beginPath();c.arc(w*.5,260,160,0,TAU);c.fill();c.fillStyle='#315a52';c.beginPath();c.moveTo(24,500);c.lineTo(269,270);c.lineTo(w-24,498);c.closePath();c.fill();c.strokeStyle='#e7d7af';c.lineWidth=10;c.beginPath();c.moveTo(66,540);c.lineTo(260,295);c.moveTo(w-66,540);c.lineTo(280,295);c.stroke();for(let i=0;i<9;i++){let t=i/9,yy=310+t*t*231,ww=10+t*t*167;c.lineWidth=3+t*6;c.beginPath();c.moveTo(270-ww,yy);c.lineTo(270+ww,yy);c.stroke();}c.fillStyle='#e8d8af';c.textAlign='center';c.font='72px Georgia';c.fillText('SLOW TRAVEL',270,635);c.font='16px Arial';c.fillText('A  B E T T E R  W A Y  T O  G O',270,687);
 });
 artSlot('rug',4,850,1080,740,(c,w,h)=>{
  c.fillStyle='#3b514d';c.fillRect(0,0,w,h);for(let i=0;i<6;i++){c.strokeStyle=['#887e60','#bba37b','#6b6854','#ad8b65','#2c4240','#927555'][i];c.lineWidth=[9,4,13,3,12,4][i];c.strokeRect(10+i*9,10+i*9,w-20-i*18,h-20-i*18);}c.strokeStyle='#a491664a';c.lineWidth=2;
  for(let x=88;x<w-80;x+=95)for(let y=85;y<h-75;y+=84){let dx=((y-85)/84%2)*40;c.beginPath();c.moveTo(x+dx,y-27);c.lineTo(x+dx+29,y);c.lineTo(x+dx,y+27);c.lineTo(x+dx-29,y);c.closePath();c.stroke();c.fillStyle='#b393621e';c.fill();}
  c.save();c.translate(w/2,h/2);for(let i=0;i<5;i++){c.strokeStyle=['#b1986c','#716e55','#be9c70','#27403c','#887653'][i];c.lineWidth=7;c.beginPath();c.moveTo(0,-210+i*16);c.lineTo(289-i*21,0);c.lineTo(0,210-i*16);c.lineTo(-289+i*21,0);c.closePath();c.stroke();}c.restore();
  for(let i=0;i<40000;i++){let x=hash(i,4)*w,y=hash(i,8)*h;c.fillStyle=i%2?'#e1c69a0a':'#0000000d';c.fillRect(x,y,1,4);}
 });
 artSlot('mat',1090,850,800,510,(c,w,h)=>{c.fillStyle='#284d48';c.fillRect(0,0,w,h);c.strokeStyle='#c2d0b835';c.lineWidth=1;for(let x=20;x<w;x+=20){c.beginPath();c.moveTo(x,20);c.lineTo(x,h-20);c.stroke();}for(let y=20;y<h;y+=20){c.beginPath();c.moveTo(20,y);c.lineTo(w-20,y);c.stroke();}c.strokeStyle='#d9d8bb88';c.strokeRect(23,23,w-46,h-46);c.font='13px monospace';c.fillStyle='#d5d6b5';for(let x=40;x<w-30;x+=40)c.fillText(x/20,x,15);c.font='21px Arial';c.fillText('ALDER VALLEY  /  WORKSHOP 07',32,h-30);});
 artSlot('control',1896,850,820,400,(c,w,h)=>{c.fillStyle='#203c38';c.fillRect(0,0,w,h);c.strokeStyle='#acb9a260';c.lineWidth=2;c.strokeRect(12,12,w-24,h-24);c.fillStyle='#dccc9e';c.font='23px Georgia';c.fillText('ALDER VALLEY',30,48);c.font='12px monospace';c.fillText('THE MAIN LINE  •  1:87',30,71);c.strokeStyle='#d2b578';c.lineWidth=5;c.lineCap='round';c.beginPath();c.roundRect(70,118,515,176,75);c.stroke();c.beginPath();c.moveTo(318,294);c.bezierCurveTo(388,291,390,122,448,118);c.stroke();c.fillStyle='#a2b697';for(let x of[128,168,208,248]){c.fillRect(x,305,28,12);}c.font='14px Arial';c.fillText('ALDER VALE',134,346);c.strokeStyle='#b79c69';c.beginPath();c.arc(709,220,58,0,TAU);c.stroke();c.font='12px Arial';c.fillText('REGULATOR',671,310);c.fillText('POWER',580,361);c.fillText('POINTS',65,361);});
 artSlot('manual',2722,850,580,410,(c,w,h)=>{c.fillStyle='#ede2c7';c.fillRect(0,0,w,h);c.fillStyle='#334c47';c.font='31px Georgia';c.fillText('The art of',30,57);c.font='34px Georgia';c.fillText('small railways',30,99);c.strokeStyle='#9c9c80';c.lineWidth=2;for(let y=140;y<355;y+=15){c.beginPath();c.moveTo(32,y);c.lineTo(236,y);c.stroke();}c.strokeStyle='#596e62';c.beginPath();c.roundRect(313,67,220,168,57);c.stroke();c.beginPath();c.moveTo(403,235);c.lineTo(504,132);c.stroke();c.fillStyle='#727b63';c.font='15px Georgia';c.fillText('Designing the perfect journey.',301,281);c.strokeStyle='#b4ad97';for(let y=314;y<374;y+=13){c.beginPath();c.moveTo(303,y);c.lineTo(538,y);c.stroke();}c.fillStyle='#413e3024';c.fillRect(286,0,9,h);});
 artSlot('roomname',4,1596,1075,220,(c,w,h)=>{c.fillStyle='#1a342e';c.fillRect(0,0,w,h);c.strokeStyle='#a78e57';c.lineWidth=3;c.strokeRect(12,12,w-24,h-24);c.fillStyle='#d4bd83';c.font='72px Georgia';c.textAlign='center';c.fillText('ALDER VALLEY',w/2,112);c.font='21px Arial';c.fillText('W H I S T L E V A L E     /     T H E  F I R S T  R O O M',w/2,171);});
 artSlot('clock',3388,4,600,600,(c,w,h)=>{c.fillStyle='#d9ccaa';c.fillRect(0,0,w,h);c.fillStyle='#ede1bc';c.beginPath();c.arc(300,300,280,0,TAU);c.fill();c.strokeStyle='#293c33';c.lineWidth=4;for(let i=0;i<60;i++){let a=i*TAU/60,r=i%5?252:230;c.beginPath();c.moveTo(300+Math.sin(a)*r,300-Math.cos(a)*r);c.lineTo(300+Math.sin(a)*265,300-Math.cos(a)*265);c.stroke();}c.font='38px Georgia';c.fillStyle='#293c33';c.textAlign='center';c.textBaseline='middle';for(let i=1;i<=12;i++){let a=i*TAU/12;c.fillText(i.toString(),300+Math.sin(a)*199,300-Math.cos(a)*199);}c.font='18px Georgia';c.fillText('ALDER VALLEY',300,394);c.font='12px Arial';c.fillText('REGULATOR',300,422);c.lineWidth=11;c.beginPath();c.moveTo(192,242);c.lineTo(300,300);c.lineTo(422,220);c.stroke();c.fillStyle='#a3884a';c.beginPath();c.arc(300,300,13,0,TAU);c.fill();});
 roomAtlasTexture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,roomAtlasTexture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,roomArt);gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
}
function roomFrame(b,key,x,y,z,w,h,angle=0){b.push(x,y,z,0,angle);b.box(0,0,0,w+.8,h+.8,.55,'#322e24',22);b.box(0,0,.3,w+.23,h+.23,.07,'#b79960',1);b.box(0,0,.35,w,h,.04,'#cbbc98',0);roomSign(b,key,0,0,.38,w-.32,h-.32);b.pop();}
function cabinet(b,x,z,w,d,h,angle=0){b.push(x,FLOOR,z,0,angle);b.box(0,h/2,0,w,h,d,'#493b2c',22);b.box(0,h+.23,0,w+.5,.48,d+.5,'#826344',22);b.box(0,1.1,d/2+.06,w-.8,1.7,.11,'#252e27',0);for(let row=0;row<3;row++){let yy=3.2+row*(h-3)/3;for(let side of[-1,1]){let xx=side*w*.25;b.box(xx,yy,d/2+.14,w*.47,(h-3)/3-.36,.28,'#68503a',22);b.box(xx,yy,d/2+.295,w*.40,(h-3)/3-.9,.033,'#70553b',22);b.beam([xx-.75,yy+.25,d/2+.48],[xx+.75,yy+.25,d/2+.48],.055,'#cfb174',1,10);for(let dx of[-.75,.75])b.cylinder(xx+dx,yy+.25,d/2+.36,.095,.095,.21,'#b8995e',1,10,PI/2);}}b.pop();}
function book(b,x,y,z,w,h,d,color,rot=0){b.push(x,y+h/2,z,0,0,rot);b.box(0,0,0,w,h,d,color,23);b.box(0,0,d/2+.03,w*.86,h*.94,.045,color,0);for(let a of[-.36,.3])b.box(0,h*a,d/2+.057,w*.78,.047,.025,'#b8a076',1);b.box(0,0,d/2+.07,w*.58,h*.12,.025,'#c5b78b',0);b.pop();}
function bookcase(b,x,z,w,h,angle=0){b.push(x,FLOOR,z,0,angle);b.box(0,h/2,-1.5,w,h,1.0,'#423b2c',22);b.box(0,h/2,-.91,w-.8,h-1,.12,'#32483b',0);for(let s of[-1,1])b.box(s*(w/2-.35),h/2,.3,.7,h,4.1,'#6d5037',22);b.box(0,h+.4,.3,w+1.2,.9,4.6,'#82613d',22);b.box(0,h+1.0,.3,w+1.7,.3,4.9,'#a28352',22);b.box(0,.65,.3,w+.5,1.3,4.5,'#5b4631',22);
 const shelfYs=[1.9,1.9+(h-3)/3,1.9+(h-3)*2/3,h-1.2];
 for(let j=0;j<shelfYs.length;j++){let yy=shelfYs[j];b.box(0,yy,.3,w-.7,.38,4,'#916b43',22);b.box(0,yy-.27,1.86,w-1,.12,.13,'#e6c27c',25);if(j===3)continue;
  if(j===0||j===2){for(let i=0;i<Math.floor(w/1.5)-4;i++){let xx=-w/2+1.2+i*1.28;if(j===2&&i>w/2.1)continue;book(b,xx,yy+.2,.27,rnd(.65,1.05),rnd(4,6.5),2.4,['#8e5140','#344e4a','#a3926d','#5e6d73','#776043'][i%5],i===2?.09:0);}}
  if(j===1||j===2){b.box(j===2?w*.30:0,yy+.45,.2,j===2?w*.28:w*.8,.45,2.3,'#292e28',0);let model=mm(b.m,mm(trans(j===2?w*.30:0,yy+.71,.25),mm(ry(PI/2),scaling(j===2?1.35:2.4))));roomDisplays.push({kind:j===1?'loco':'coach',tender:j===1,model});}
 }
 b.pop();}
function plant(b,x,z,scale=1,small=false){b.push(x,FLOOR,z,0,rnd(0,TAU),0,scale);b.cylinder(0,1.7,0,1.35,1.95,3.4,'#a67957',22,32);b.cylinder(0,3.37,0,1.99,2.04,.22,'#b78e67',22,32);b.cylinder(0,3.47,0,1.82,1.82,.09,'#383b28',9,28);for(let j=0;j<10;j++){let a=j*2.399,ht=rnd(5.5,12),r=rnd(1.1,3.5),end=[Math.cos(a)*r,ht,Math.sin(a)*r];b.beam([0,3.45,0],end,.055,'#64714b',0,7);for(let k=0;k<2;k++){let ay=a+(k?1.1:-.5),lenL=rnd(2.2,4.1),width=rnd(.75,1.25);b.push(end[0],end[1]-k*.85,end[2],rnd(-.2,.5),ay);let pts=[];for(let i=0;i<=10;i++){let t=i/10,ww=Math.sin(t*PI)*width,cy=Math.sin(t*PI)*.4-t*t*.65;pts.push([[-ww,cy,lenL*t],[0,cy+.19*Math.sin(t*PI),lenL*t],[ww,cy,lenL*t]]);}for(let i=0;i<10;i++)for(let s=0;s<2;s++)b.quad(pts[i][s],pts[i+1][s],pts[i+1][s+1],pts[i][s+1],shade(j%3?'#476841':'#7e915a',.95+s*.12),24);b.beam([0,0,0],[0,-.61,lenL],.018,'#a3aa65',0,5);b.pop();}}
 b.pop();}
function deskLamp(b,x,y,z,scale=1){b.push(x,y,z,0,0,0,scale);b.cylinder(0,.12,0,1.05,1.0,.24,'#484638',1,32);b.beam([0,.2,0],[0,3.9,0],.085,'#b6a272',1,12);b.beam([0,3.9,0],[1.7,4.65,0],.065,'#b6a272',1,10);b.sphere(0,3.9,0,.17,.17,.17,'#d1b777',1,12,8);b.push(1.75,4.34,0,0,0,-.15);b.cylinder(0,0,0,.85,.28,1.1,'#3d5946',1,32);b.cylinder(0,-.558,0,.77,.77,.025,'#f2d199',25,32);b.pop();b.pop();}
function mug(b,x,y,z,s=1){b.push(x,y,z,0,0,0,s);b.cylinder(0,.43,0,.38,.45,.86,'#d8ceb3',23,24);b.cylinder(0,.875,0,.388,.388,.023,'#463d2b',0,24);for(let i=0;i<16;i++){let a=i*TAU/16,q=(i+1)*TAU/16;b.beam([.47+Math.cos(a)*.30,.45+Math.sin(a)*.31,0],[.47+Math.cos(q)*.30,.45+Math.sin(q)*.31,0],.074,'#d7cbb1',23,6);}b.pop();}
function workshopCreateRoom(){
 initRoomArt();let b=new Builder();
 // A woven rug, not a floating landscape. The cabinet feet meet the floor.
 b.push(0,FLOOR+.012,0,-PI/2);roomSign(b,'rug',0,0,0,83,59);b.pop();
 for(let x=-39;x<40;x+=.29)for(let s of[-1,1])b.box(x,FLOOR+.029,s*29.75,.08,.02,rnd(.55,.8),'#a79a79',23);
 roomFloorMesh=b.mesh(); b=new Builder();
 // Walnut benchwork, rounded outer rails, brass inlay and storage drawers.
 slab(b,66.4,42.3,3.1,-3.3,2.9,'#63482e',22);slab(b,66.6,42.5,.19,-4.86,2.95,'#352c22',22);slab(b,66.42,42.32,.055,-2.21,2.92,'#c9b17a',1);
 cabinet(b,-23.5,0,12.5,30,18.5);cabinet(b,23.5,0,12.5,30,18.5);
 for(let x of[-26,26])for(let z of[-14.3,14.3]){b.box(x,-22.7,z,1.5,2.4,1.5,'#9c875b',1);b.box(x,-23.85,z,1.65,.12,1.65,'#2d332a',0);}
 for(let s of[-1,1]){b.box(0,-20.5,s*12.5,35,.65,.65,'#675033',22);b.beam([-17,-20.2,s*12.5],[17,-5,s*12.5],.34,'#705a3c',22,4);b.beam([17,-20.2,s*12.5],[-17,-5,s*12.5],.34,'#705a3c',22,4);}
 // Under-board archive boxes and a rolled track plan.
 for(let i=0;i<3;i++){b.box(-6+i*4.6,-21.8,-9,4,3.3,5.7,['#66705c','#a88e61','#536b68'][i],23);b.box(-6+i*4.6,-20.08,-9,4.2,.2,5.9,'#bba784',22);b.box(-6+i*4.6,-21.8,-6.11,1.3,.68,.045,'#d9cbb0',0);}
 // The real control panel on the front fascia.
 b.push(17.5,-2.7,23.2,-.54);b.box(0,0,0,12.6,5.9,.8,'#4c3a29',22);b.box(0,0,.43,12.1,5.45,.08,'#b89959',1);roomSign(b,'control',0,0,.49,11.7,5.10);b.cylinder(4.12,-.25,.78,.58,.51,.57,'#30372f',1,32,PI/2);for(let i=0;i<24;i++){let a=i*TAU/24;b.beam([4.12+.54*Math.cos(a),-.25+.54*Math.sin(a),.62],[4.12+.49*Math.cos(a),-.25+.49*Math.sin(a),1.05],.023,'#acaa85',1,5);}b.cylinder(2.88,-2.02,.61,.17,.17,.18,'#cb6844',10,16,PI/2);b.cylinder(-4.62,-2.02,.61,.19,.19,.18,'#b6c582',10,16,PI/2);b.beam([-4.62,-2.02,.78],[-4.50,-1.78,1.29],.055,'#c7bb95',1,10);b.pop();
 // Bespoke rear-wall cases. Books and preserved rolling stock share the shelves.
 bookcase(b,-39,-44,27,43);bookcase(b,42,-44,24,31);
 // Rolling library ladder.
 b.push(-50,FLOOR,-36,.15,0,-.04);for(let s of[-1,1]){b.beam([s*2.1,.4,0],[s*2.1,35,-4.4],.24,'#9d784c',22,8);}for(let y=3;y<33;y+=3.2)b.beam([-2.12,y,-y*.126],[2.12,y,-y*.126],.19,'#b59261',22,8);b.pop();
 // Left-hand workbench and all of its small human traces.
 b.push(-49,0,3,0,PI/2);b.box(0,-5.5,0,28,1.1,10,'#9d7850',22);for(let x of[-12,12])for(let z of[-3.9,3.9])b.box(x,-14.75,z,.85,17.3,.85,'#435446',1);b.box(0,-20.5,0,26,.45,8,'#66543a',22);onTop(b,'mat',-2,-4.92,0,17,8);onTop(b,'manual',8,-4.80,-.2,7.8,5.7);b.box(8,-5.03,-.2,7.95,.20,5.85,'#453f2d',22);
 for(let j=0;j<7;j++){let xx=-12+j*.92;b.cylinder(xx,-4.3,-3.55,.31,.30,1.13,['#967952','#9e644c','#bdc0a6','#4f6d55','#d0b982','#ad7251','#758281'][j],0,14);b.cylinder(xx,-3.69,-3.55,.335,.335,.16,'#33392f',1,14);}
 b.cylinder(-10,-4.18,2.8,.55,.63,1.45,'#647163',23,20);for(let i=0;i<7;i++){let xx=-10+rnd(-.35,.35),zz=2.8+rnd(-.35,.35);b.beam([xx,-4.2,zz],[xx+rnd(-.2,.2),-1.25+rnd(-.2,.5),zz+.1],.043,'#b4a37c',2,7);b.cylinder(xx,-1.3,zz+.1,.048,.030,.60,i%2?'#65503a':'#c7b080',0,8);}
 b.box(-1,-4.80,1.25,5.5,.16,.34,'#c8b67b',1);for(let i=0;i<30;i++)b.box(-3.55+i*.18,-4.704,1.32,.025,.01,i%5?.11:.24,'#3d483a',0);
 b.beam([2.1,-4.65,2],[5.0,-4.65,2.45],.08,'#baa876',1,8);b.cylinder(2.1,-4.62,2,.22,.22,.11,'#6a5040',1,12);mug(b,9.8,-4.88,3,1.4);deskLamp(b,-9,-4.95,-3.6,1.8);
 b.box(-4,-4.52,-1.85,9.8,.72,2.05,'#5b4d35',22);roomDisplays.push({kind:'loco',model:mm(b.m,mm(trans(-3.8,-4.09,-1.8),mm(ry(PI/2),scaling(1.9))))});
 b.pop();
 // Pegboard, hooks, paint swatches and an instrument drawing.
 b.push(-56.4,3.5,3,0,PI/2);b.box(0,3.3,0,29,14,.48,'#806b4a',22);for(let x=-13.5;x<=13.5;x+=.78)for(let y=-2.7;y<9.4;y+=.78)b.cylinder(x,y,.253,.055,.055,.022,'#3a3c2c',0,6,PI/2);
 roomFrame(b,'blueprint',2,4.1,.40,17,9.7);for(let i=0;i<3;i++){let x=-11+i*2.3;b.beam([x,4,.9],[x,-.1,.9],.16,'#b49a61',22,8);b.box(x,4.2,.95,2,.5,.65,'#718277',1);b.beam([x,4.8,.4],[x,4.8,1],.05,'#c5b986',1,8);}b.box(0,-4.2,1.1,30,.38,2.8,'#786240',22);b.pop();
 // A height-adjustable workshop stool.
 b.cylinder(-37,-15.2,4,3.2,3.2,.95,'#6d4834',23,40);b.cylinder(-37,-19.25,4,.19,.24,7.2,'#a49b7d',1,16);for(let i=0;i<4;i++){let a=i*PI/2;b.beam([-37,-18,4],[-37+Math.cos(a)*3,-23.7,4+Math.sin(a)*3],.14,'#465348',1,8);}for(let i=0;i<32;i++){let a=i*TAU/32,q=(i+1)*TAU/32;b.beam([-37+Math.cos(a)*2.1,-20.9,4+Math.sin(a)*2.1],[-37+Math.cos(q)*2.1,-20.9,4+Math.sin(q)*2.1],.065,'#a39a79',1,6);}
 // Window-side radiator, open book, little pots.
 for(let i=0;i<25;i++){let x=-13+i*1.28;b.box(x,-16,-46.2,.66,11.5,1.3,'#c5bda3',1);b.sphere(x,-10.2,-46.2,.34,.55,.64,'#c7bea5',1,8,6);b.sphere(x,-21.8,-46.2,.34,.55,.64,'#c7bea5',1,8,6);}b.beam([-14,-20.5,-46.2],[20,-20.5,-46.2],.18,'#b6ab8c',1,12);
 b.box(4,-.45,-46.7,45,.55,3.1,'#957957',22);for(let x of[-11,20]){b.cylinder(x,.23,-46, .67,.83,1.0,'#8b6147',22,20);for(let j=0;j<7;j++){let a=j*2.4;b.beam([x,.7,-46],[x+Math.cos(a)*.9,2+rnd(0,1),-46+Math.sin(a)*.55],.034,'#718954',8,5);b.sphere(x+Math.cos(a)*.8,2+rnd(0,1),-46+Math.sin(a)*.55,.39,.30,.21,'#72884e',8,8,5);}}
 onTop(b,'manual',7,-.13,-46.2,6.5,2.6);
 // An old station clock, railway posters, and a collector's nameplate.
 b.cylinder(42,23,-47.1,4.45,4.45,.7,'#544834',22,64,PI/2);b.cylinder(42,23,-46.71,4.10,4.10,.09,'#c8b078',1,64,PI/2);{let q=roomLabels.clock,u=(q.u0+q.u1)/2,v=(q.v0+q.v1)/2;for(let i=0;i<72;i++){let a=i*TAU/72,d=(i+1)*TAU/72;b.tri([42,23,-46.47],[42+3.88*Math.cos(a),23+3.88*Math.sin(a),-46.47],[42+3.88*Math.cos(d),23+3.88*Math.sin(d),-46.47],'#ffffff',32,[[0,0,1],[0,0,1],[0,0,1]],[[u,v],[u+Math.cos(a)*(q.u1-q.u0)*.5,v+Math.sin(a)*(q.v1-q.v0)*.5],[u+Math.cos(d)*(q.u1-q.u0)*.5,v+Math.sin(d)*(q.v1-q.v0)*.5]]);}}roomFrame(b,'roomname',-39,26,-47.4,27,5.52);
 // A handsome leather reading chair, ottoman and a side table.
 b.push(43,FLOOR,21,0,-.58);b.box(0,2.7,0,8.1,2.1,8.3,'#463427',22);b.sphere(0,4.05,.5,4.05,1.32,3.65,'#875b3c',23,24,12);b.push(0,7.25,-3.3,.12);b.sphere(0,0,0,4.35,4.10,1.34,'#946844',23,26,14);b.sphere(0,.15,.9,3.48,3.34,.63,'#9e734a',23,24,12);for(let x of[-1.8,0,1.8])for(let y of[-1.4,1.3])b.sphere(x,y,1.49,.11,.11,.06,'#654831',0,8,6);b.pop();for(let s of[-1,1]){b.sphere(s*4,4.96,0,1.0,1.15,4.1,'#855b3e',23,20,10);for(let z of[-2.6,2.6])b.box(s*3.3,1.35,z,.5,2.7,.5,'#4b3d2a',22);}b.pop();
 b.push(38,FLOOR,31,0,-.58);for(let s of[-1,1])for(let t of[-1,1])b.box(s*2.6,1.4,t*2.0,.45,2.8,.45,'#513e2b',22);b.sphere(0,3.2,0,3.45,1.2,2.75,'#896444',23,20,10);b.pop();
 b.cylinder(49,-14.1,20,3.2,3.2,.38,'#a48252',22,40);b.cylinder(49,-19,20,.18,.20,9.7,'#a99871',1,16);b.cylinder(49,-23.74,20,2.3,2.5,.25,'#4a4535',1,32);mug(b,48.2,-13.9,21,1.7);deskLamp(b,49.7,-13.92,19,1.65);
 plant(b,50,-33,1.22);plant(b,-51,28,.83);
 // Pendant shades are spun, not opaque cones; their lit interiors remain visible.
 for(let [x,y,z] of roomLightPositions.slice(0,2)){b.beam([x,y+1.9,z],[x,40,z],.042,'#332f28',1,8);b.cylinder(x,y+2.03,z,.41,.38,.35,'#c0a774',1,20);let R=3.1;for(let j=0;j<12;j++){let t0=j/12,t1=(j+1)/12,r0=.37+(R-.37)*Math.pow(t0,.8),r1=.37+(R-.37)*Math.pow(t1,.8),y0=y+1.9-t0*2,y1=y+1.9-t1*2;for(let i=0;i<48;i++){let a=i*TAU/48,q=(i+1)*TAU/48;b.quad([x+Math.cos(a)*r0,y0,z+Math.sin(a)*r0],[x+Math.cos(q)*r0,y0,z+Math.sin(q)*r0],[x+Math.cos(q)*r1,y1,z+Math.sin(q)*r1],[x+Math.cos(a)*r1,y1,z+Math.sin(a)*r1],'#3c5043',1);b.quad([x+Math.cos(a)*r0*.97,y0-.04,z+Math.sin(a)*r0*.97],[x+Math.cos(a)*r1*.97,y1-.04,z+Math.sin(a)*r1*.97],[x+Math.cos(q)*r1*.97,y1-.04,z+Math.sin(q)*r1*.97],[x+Math.cos(q)*r0*.97,y0-.04,z+Math.sin(q)*r0*.97],'#d1c49c',22);}}
  for(let i=0;i<64;i++){let a=i*TAU/64,q=(i+1)*TAU/64;b.beam([x+Math.cos(a)*3.1,y-.1,z+Math.sin(a)*3.1],[x+Math.cos(q)*3.1,y-.1,z+Math.sin(q)*3.1],.065,'#b8a57a',1,6);}b.sphere(x,y+.03,z,.56,.64,.56,'#ffe2a2',25,20,14);}
 roomFurnitureMesh=b.mesh();
 // Four complete walls, individually cut away only when the camera passes outside.
 function wall(which){let b=new Builder(),pos,angle,width;
  if(which==='back'){pos=[0,0,-49];angle=0;width=114;}
  if(which==='front'){pos=[0,0,51];angle=PI;width=114;}
  if(which==='left'){pos=[-57,0,1];angle=PI/2;width=100;}
  if(which==='right'){pos=[57,0,1];angle=-PI/2;width=100;}
  b.push(...pos,0,angle);
  if(which==='back'){
   b.box(-37,-1.5,-.15,40,77,.5,'#c6bfb1',20);b.box(41,-1.5,-.15,32,77,.5,'#c6bfb1',20);b.box(4,-11.75,-.15,42,24.5,.5,'#c6bfb1',20);b.box(4,34.5,-.15,42,11,.5,'#c6bfb1',20);
   // A real opening with a painted landscape outside, individual glazing and mullions.
   roomSign(b,'window',4,14.75,-.30,41.5,28.5,0,33);
   for(let x of[-17,25]){b.box(x,14.7,.4,.85,29.4,1.25,'#ac9f7a',22);b.box(x,14.7,1.05,.27,29.4,.10,'#d8c9a1',0);}for(let yy of[.25,29.3]){b.box(4,yy,.4,43,.85,1.25,'#ab9e78',22);b.box(4,yy,1.06,43,.2,.08,'#d3c39a',0);}for(let x of[-6.5,4,14.5])b.box(x,14.8,.46,.48,28.6,.65,'#b7aa81',22);b.box(4,13.8,.57,41.5,.38,.47,'#c2b690',22);for(let x of[-11.75,-1.25,9.25,19.75]){b.box(x,13.15,.82,.5,.14,.3,'#a38850',1);b.beam([x-.24,13.15,.98],[x+.24,13.15,.98],.058,'#ba9f64',1,10);}
   // Gathered linen curtains, their folds have real geometry.
   for(let side of[-1,1]){let xx=side<0?-19.1:27.1;for(let k=0;k<28;k++){let x0=xx+(k/28-.5)*4.6,x1=xx+((k+1)/28-.5)*4.6,z0=1.25+Math.sin(k/28*TAU*4)*.35,z1=1.25+Math.sin((k+1)/28*TAU*4)*.35;b.quad([x0,-.4,z0],[x1,-.4,z1],[x1,30.4,z1],[x0,30.4,z0],shade('#8b9380',.95+.07*Math.sin(k)),23);}}b.beam([-23,30.9,1.4],[31,30.9,1.4],.12,'#a68b55',1,12);
  }else b.box(0,8,-.15,width,64,.5,'#c3bcae',20);
  // Raised olive wainscoting and decorative oak mouldings.
  b.box(0,-16.7,.19,width,14.2,.35,'#46564a',22);b.box(0,-9.35,.47,width,.38,.70,'#8a8260',22);b.box(0,-9.7,.48,width,.17,.68,'#c0ad7b',1);b.box(0,-22.95,.48,width,1.4,.7,'#827b5e',22);
  for(let x=-width/2+2.8;x<width/2;x+=6.1){b.box(x,-16.35,.42,.2,11.9,.17,'#768066',22);for(let yy of[-11.1,-21.6])b.box(x+2.85,yy,.42,5.5,.17,.17,'#768066',22);}
  b.box(0,39,.6,width,1.25,1.6,'#82724f',22);b.box(0,37.8,.38,width,.45,1.1,'#b2a17a',22);
  if(which==='right'){roomFrame(b,'poster',-25,9,.8,12,16.8);roomFrame(b,'slow',-8,9,.8,12,16.8);roomFrame(b,'blueprint',20,10,.8,26,14.7);}
  if(which==='left'){roomFrame(b,'poster',-29,8.5,.8,14,19.6);roomFrame(b,'slow',31,9,.8,12,16.8);}
  if(which==='front'){roomFrame(b,'roomname',0,23,.7,38,7.8);roomFrame(b,'poster',-31,8,.7,12,16.8);roomFrame(b,'slow',31,8,.7,12,16.8);b.box(0,-1,.8,19,42,.6,'#7d6d4c',22);b.box(0,-1,1.15,16,39,.18,'#354b3d',22);b.cylinder(6,-4,1.44,.38,.38,.45,'#cfb374',1,20,PI/2);}
  b.pop();roomWalls.push({which,mesh:b.mesh()});
 }
 for(let w of['back','front','left','right'])wall(w);
 b=new Builder();b.box(0,40.7,1,114,.8,100,'#c9bda0',20);for(let x=-44;x<50;x+=22)b.box(x,39.2,1,1.5,2.1,100,'#7f6341',22);roomCeilingMesh=b.mesh();
 for(let i=0;i<150;i++)roomDust.push({p:[rnd(-45,45),rnd(-15,27),rnd(-42,27)],phase:rnd(0,TAU),size:rnd(.02,.07)});
}
function visibleRoomWalls(){return roomWalls.filter(w=>w.which==='back'?cameraPos[2]>-48.5:w.which==='front'?cameraPos[2]<50.5:w.which==='left'?cameraPos[0]>-56.5:cameraPos[0]<56.5);}
function workshopDrawRoom(p=mainProgram,shadow=false){if(!shadow){draw(roomFloorMesh,I,p);for(let w of visibleRoomWalls())draw(w.mesh,I,p);if(cameraPos[1]<37.8&&viewMode!=='overview')draw(roomCeilingMesh,I,p);}draw(roomFurnitureMesh,I,p);for(let d of roomDisplays){draw(d.kind==='loco'?locoMesh:coachMesh,d.model,p);if(d.kind!=='loco')draw(coachRoofMesh,d.model,p);if(d.tender)draw(tenderMesh,mm(d.model,trans(0,0,-2.70)),p);if(d.kind==='loco')for(let z of[-.7,-.15,.4])draw(wheelMesh,mm(d.model,trans(0,.325,z)),p);else for(let z of[-.91,.91])draw(bogieMesh,mm(d.model,trans(0,0,z)),p);}}


function baseChurch(b,x,z){ let y=terrainH(x,z);houseZones.push({x,z,r:2.7});b.push(x,y,z);b.box(0,1.13,0,2.5,2.25,3.1,'#c6c0a4',4);gable(b,2.5,3.1,2.26,1.1,'#657668');b.box(-.67,2.0,1.25,1.13,4.0,1.12,'#c2bca0',4);for(let side of[-1,1])b.box(-.67+side*.57,3.24,1.25,.016,.75,.45,'#5c6b54',0);b.box(-.67,3.23,1.818,.44,.77,.025,'#5d6b54',0);for(let j=0;j<6;j++)b.box(-.67,2.92+j*.115,1.845,.44,.035,.09,'#c1b89a',2);sign(b,'clock',-.67,2.38,1.823,.49,.49);b.cylinder(-.67,4.48,1.25,.86,0,1.25,'#607366',5,4,0,0);b.beam([-.67,5.10,1.25],[-.67,5.55,1.25],.027,'#b7ae7d',1);b.beam([-.80,5.40,1.25],[-.54,5.40,1.25],.025,'#b7ae7d',1);b.box(.30,.67,1.575,.50,1.30,.045,'#596e56',2);b.pop();
}

// Collector-grade rolling stock. All dimensions use the existing rail gauge.
let liveries={green:{body:'#214b3b',line:'#d4b369',wheel:'#733e29',coach:'#294c3a'},blue:{body:'#243d50',line:'#c7b887',wheel:'#3c4c54',coach:'#304f63'},claret:{body:'#582c31',line:'#d4b369',wheel:'#3b3034',coach:'#62353a'}};
let livery='green',cutaway=false,observationMesh=null,pistonMesh=null,jointMesh=null,couplingMesh=null,coachRoofMesh=null;
function trainPaint(){return liveries[livery]||liveries.green;}
function ringX(b,x,y,z,r,R,d,c,mat=41,n=36){
 for(let i=0;i<n;i++){let a=i*TAU/n,q=(i+1)*TAU/n,pt=(xx,rr,t)=>[xx,y+Math.cos(t)*rr,z+Math.sin(t)*rr];
  for(let side of[-1,1])b.quad(pt(x+side*d/2,r,a),pt(x+side*d/2,r,q),pt(x+side*d/2,R,q),pt(x+side*d/2,R,a),c,mat,[side,0,0]);
  b.quad(pt(x-d/2,R,a),pt(x+d/2,R,a),pt(x+d/2,R,q),pt(x-d/2,R,q),c,mat);
  b.quad(pt(x+d/2,r,a),pt(x-d/2,r,a),pt(x-d/2,r,q),pt(x+d/2,r,q),c,mat);
 }
}
function ringZ(b,x,y,z,r,R,d,c,mat=41,n=40){b.push(x,y,z,0,-PI/2);ringX(b,0,0,0,r,R,d,c,mat,n);b.pop();}
function fineRivets(b,a,q,count=12,c='#b7ad88',radius=.012){for(let i=0;i<=count;i++)b.sphere(...lerpV(a,q,i/count),radius,radius,radius,c,41,6,4);}
function locoRoof(b){
 const w=1.075,d=1.18,y=1.52;barrelRoof(b,w,d,y,'#172b27');
 for(let z of[-d/2+.05,d/2-.05])for(let i=0;i<24;i++){let a=(i/24-.5)*PI,q=((i+1)/24-.5)*PI;b.beam([Math.sin(a)*w*.55,y+Math.cos(a)*.30,z],[Math.sin(q)*w*.55,y+Math.cos(q)*.30,z],.014,'#b9a877',41,5);}
 b.box(0,1.825,-.04,.25,.042,.33,'#20352c',40);b.box(0,1.854,-.03,.20,.024,.25,'#4c5e4d',41);
}
function makeLoco(withRoof=true){
 const b=new Builder(),p=trainPaint(),paint=p.body,brass=p.line,black='#172722',steel='#aab7aa';
 b.box(0,.35,.11,.89,.14,3.41,black,42);b.box(0,.46,-.92,.85,.15,1.04,paint,40);
 // A riveted frame and finely lined running boards.
 for(let s of[-1,1]){
  b.box(s*.40,.365,.25,.07,.21,2.52,'#304036',42);
  b.box(s*.486,.61,.32,.195,.055,2.52,black,40);b.box(s*.589,.611,.32,.013,.041,2.51,brass,41);
  fineRivets(b,[s*.444,.39,-1.35],[s*.444,.39,1.64],34,'#778070',.012);
  for(let z of[-.75,-.18,.38]){b.box(s*.39,.47,z,.13,.08,.36,black,42);for(let j=0;j<5;j++)b.box(s*.43,.41+j*.022,z,.07,.01,.22-.02*j,'#717d6c',41);}
 }
 for(let z of[-1.55,1.86]){
  b.box(0,.36,z,1.095,.215,.13,'#852c27',40);b.box(0,.47,z,1.07,.018,.155,'#b36841',41);
  for(let s of[-1,1]){b.cylinder(s*.369,.36,z+Math.sign(z)*.1,.060,.059,.20,black,42,16,PI/2);b.cylinder(s*.369,.36,z+Math.sign(z)*.216,.109,.109,.047,steel,41,24,PI/2);fineRivets(b,[s*.18,.295,z+Math.sign(z)*.08],[s*.50,.295,z+Math.sign(z)*.08],3,brass,.014);}
  b.beam([0,.35,z],[0,.29,z+Math.sign(z)*.25],.043,black,41,10);ringZ(b,0,.27,z+Math.sign(z)*.25,.054,.078,.04,steel,41,16);
  b.beam([.20,.34,z],[.19,.12,z+Math.sign(z)*.13],.018,'#302b23',42,8);
 }
 // Boiler cladding, individual bands, smokebox door, hinges and dart handle.
 b.cylinder(0,1.016,.27,.357,.361,1.94,paint,40,64,PI/2);
 b.cylinder(0,1.016,1.285,.368,.368,.292,black,42,56,PI/2);
 b.cylinder(0,1.016,1.447,.319,.319,.041,'#293731',42,52,PI/2);
 ringZ(b,0,1.016,1.473,.294,.317,.022,steel,41,52);
 b.sphere(0,1.016,1.489,.287,.287,.027,'#20332b',40,36,18);
 for(let z of[-.57,-.11,.44,.98]){b.cylinder(0,1.016,z,.365,.365,.027,brass,41,64,PI/2);b.cylinder(0,1.016,z+.018,.364,.364,.010,'#eee0ae',41,64,PI/2);}
 for(let i=0;i<20;i++){let a=i*TAU/20;b.sphere(Math.sin(a)*.337,1.016+Math.cos(a)*.337,1.441,.014,.014,.012,'#717c6a',41,7,4);}
 for(let y of[.88,1.16]){b.box(-.223,y,1.52,.11,.038,.047,steel,41);b.cylinder(-.275,y,1.52,.022,.022,.07,steel,41,8);}
 b.cylinder(0,1.016,1.536,.045,.045,.075,brass,41,16,PI/2);b.beam([-.092,1.016,1.581],[.092,1.016,1.581],.015,steel,41,8);b.beam([0,.93,1.576],[0,1.102,1.576],.015,steel,41,8);
 // Copper-capped chimney, hollow mouth and two turned domes.
 b.cylinder(0,1.40,1.03,.143,.103,.29,black,42,40);b.cylinder(0,1.555,1.03,.101,.157,.115,black,40,40);b.cylinder(0,1.623,1.03,.170,.170,.055,'#b5824f',41,48);
 b.cylinder(0,1.655,1.03,.125,.125,.005,'#111b17',42,40);
 b.cylinder(0,1.383,-.20,.167,.139,.184,brass,41,32);b.sphere(0,1.480,-.20,.14,.11,.14,brass,41,28,16);
 b.cylinder(0,1.378,.39,.122,.100,.152,paint,40,28);b.sphere(0,1.458,.39,.103,.064,.103,paint,40,24,12);b.cylinder(0,1.48,.39,.037,.037,.022,brass,41,16);
 b.cylinder(-.088,1.545,-.43,.029,.029,.19,brass,41,14);b.cylinder(.076,1.497,-.43,.033,.025,.09,brass,41,14);
 // Sand pipes, grab irons, injectors, cylinder blocks and washout plugs.
 for(let s of[-1,1]){
  b.beam([s*.39,1.16,-.54],[s*.39,1.16,1.33],.015,brass,41,10);
  for(let z of[-.48,.16,.77,1.25]){b.beam([s*.328,1.17,z],[s*.397,1.16,z],.013,steel,41,8);b.sphere(s*.398,1.16,z,.023,.023,.022,brass,41,8,5);}
  b.beam([s*.17,1.39,.38],[s*.373,.89,.32],.013,brass,41,8);b.beam([s*.373,.89,.32],[s*.48,.43,.21],.013,brass,41,8);
  b.beam([s*.36,.86,-.56],[s*.55,.58,-.47],.025,'#b37b48',41,9);b.beam([s*.55,.58,-.47],[s*.53,.48,.99],.026,'#b37b48',41,9);
  b.cylinder(s*.475,.345,1.12,.115,.115,.38,paint,40,28,PI/2);b.cylinder(s*.475,.345,1.324,.116,.116,.034,steel,41,28,PI/2);
  ringZ(b,s*.475,.345,1.346,.075,.106,.012,brass,41,20);
  for(let i=0;i<8;i++){let a=i*TAU/8;b.sphere(s*.475+Math.sin(a)*.087,.345+Math.cos(a)*.087,1.36,.011,.011,.009,steel,41,6,4);}
  b.beam([s*.573,.278,.29],[s*.573,.278,1.03],.017,steel,41,8);b.beam([s*.573,.415,.29],[s*.573,.415,1.03],.017,steel,41,8);
  b.push(s*.374,1.087,.16,0,s*PI/2);b.box(0,0,0,.87,.153,.032,brass,41);sign(b,'name',0,0,.022,.815,.118);b.pop();
  // Splasher tops over the three driving wheels.
  for(let z of[-.70,-.15,.40])for(let i=0;i<18;i++){let a=i*PI/18,q=(i+1)*PI/18;let y0=.325+Math.sin(a)*.348,y1=.325+Math.sin(q)*.348;let z0=z+Math.cos(a)*.348,z1=z+Math.cos(q)*.348;b.quad([s*.37,y0,z0],[s*.57,y0,z0],[s*.57,y1,z1],[s*.37,y1,z1],paint,40);}
 }
 // Open cab: real apertures, interior controls, gauges, seats and coal shovel.
 b.box(0,.594,-1.04,.904,.09,.96,'#454330',22);
 for(let s of[-1,1]){
  b.box(s*.445,.837,-1.077,.058,.405,.88,paint,40);b.box(s*.445,1.475,-1.077,.058,.102,.88,paint,40);
  for(let z of[-1.492,-.663])b.box(s*.447,1.21,z,.057,.54,.049,paint,40);
  b.box(s*.479,1.057,-1.077,.030,.034,.81,brass,41);b.box(s*.471,1.40,-1.077,.018,.023,.81,brass,41);
  b.box(s*.481,.674,-1.077,.012,.022,.84,brass,41);fineRivets(b,[s*.48,.74,-1.45],[s*.48,.74,-.70],12,brass,.009);
  b.push(s*.483,.89,-1.08,0,s*PI/2);sign(b,'engine',0,0,0,.29,.22);b.pop();
  b.beam([s*.48,.66,-1.52],[s*.48,1.36,-1.52],.017,brass,41,10);
  for(let i=0;i<3;i++){b.box(s*.51,.47-i*.12,-1.46,.20,.035,.255,black,42);for(let j=0;j<4;j++)b.box(s*.51,.491-i*.12,-1.55+j*.056,.15,.006,.018,steel,41);}
  b.cylinder(s*.30,.80,-1.30,.062,.054,.33,black,41,10);b.box(s*.30,.985,-1.32,.18,.056,.20,'#6a432b',23);
 }
 b.box(0,.987,-.664,.865,.67,.068,paint,40);b.box(0,1.505,-.664,.87,.07,.064,paint,40);
 b.box(0,.958,-.746,.46,.49,.090,black,42);b.cylinder(0,.823,-.801,.123,.123,.024,'#eb8242',10,24,PI/2);ringZ(b,0,.823,-.823,.106,.138,.02,'#75644a',41,24);
 for(let [x,y,r] of[[-.216,1.219,.089],[.178,1.22,.075],[.33,1.11,.044]]){
  b.cylinder(x,y,-.727,r+.012,r+.012,.025,brass,41,26,PI/2);b.cylinder(x,y,-.747,r,r,.009,'#eee3c0',0,26,PI/2);b.beam([x,y,-.758],[x+r*.51,y+r*.38,-.758],.006,'#314638',1,5);
  for(let i=0;i<12;i++){let a=i*TAU/12;b.beam([x+Math.sin(a)*r*.72,y+Math.cos(a)*r*.72,-.758],[x+Math.sin(a)*r*.91,y+Math.cos(a)*r*.91,-.758],.003,'#515549',1,4);}
 }
 for(let s of[-1,1]){b.beam([s*.27,.80,-.77],[s*.27,1.13,-.77],.012,'#c69753',41,8);ringZ(b,s*.28,1.018,-.803,.049,.062,.011,'#b85035',40,16);}
 b.beam([-.13,1.28,-.751],[.18,1.29,-.93],.021,brass,41,9);b.beam([.18,1.29,-.93],[.26,1.29,-1.02],.027,'#4c362b',23,10);
 b.beam([-.31,.71,-1.40],[-.27,1.34,-1.28],.015,'#96764a',22,8);b.box(-.315,.70,-1.40,.14,.14,.06,black,41);
 if(withRoof){b.push(0,0,-1.045);locoRoof(b);b.pop();}
 // Bell yoke, reflector lamp and slatted pilot.
 b.cylinder(0,1.408,.713,.079,.038,.115,brass,41,26);for(let x of[-.085,.085])b.beam([x,1.38,.713],[x,1.546,.713],.011,brass,41,8);b.beam([-.085,1.546,.713],[.085,1.546,.713],.014,brass,41,8);
 b.box(0,1.329,1.531,.11,.18,.11,black,41);b.cylinder(0,1.404,1.596,.105,.105,.142,black,40,28,PI/2);ringZ(b,0,1.404,1.675,.082,.11,.03,brass,41,30);b.cylinder(0,1.404,1.695,.081,.081,.008,'#ffe2a0',10,28,PI/2);
 for(let x=-.44;x<=.441;x+=.073)b.beam([x,.36,1.96],[x*.88,.14,2.13],.012,black,41,7);b.beam([-.42,.135,2.13],[.42,.135,2.13],.024,steel,41,9);
 smallAxle(b,1.16,.17,.64);smallAxle(b,1.64,.17,.64);
 return b.mesh();
}
function makeWheels(){
 const b=new Builder(),p=trainPaint();b.cylinder(0,0,0,.034,.034,.88,'#667061',41,14,0,PI/2);
 for(let s of[-1,1]){
  ringX(b,s*.32,0,0,.257,.305,.082,'#abb9af',41,48);ringX(b,s*.352,0,0,.237,.273,.036,p.wheel,40,44);ringX(b,s*.280,0,0,.290,.316,.015,'#777e70',41,44);
  const q=s<0?PI/2:0;
  for(let i=0;i<12;i++){let a=i*TAU/12+q;b.beam([s*.365,Math.cos(a)*.050,Math.sin(a)*.050],[s*.365,Math.cos(a)*.254,Math.sin(a)*.254],.017,p.wheel,40,8);}
  // A cast counterweight opposite the crank, leaving the spokes genuinely open.
  for(let i=0;i<10;i++){let a=q+PI-.58+i*.116,t=a+.116;const pt=(r,aa)=>[s*.377,Math.cos(aa)*r,Math.sin(aa)*r];b.quad(pt(.17,a),pt(.17,t),pt(.251,t),pt(.251,a),p.wheel,40,[s,0,0]);}
  b.cylinder(s*.375,0,0,.066,.066,.048,p.wheel,40,22,0,PI/2);b.cylinder(s*.402,0,0,.041,.041,.018,'#bbc3b2',41,20,0,PI/2);
  b.cylinder(s*.407,.143*Math.cos(q),.143*Math.sin(q),.037,.037,.056,'#bdbfa8',41,16,0,PI/2);
 }
 return b.mesh();
}
function makeTender(){
 const b=new Builder(),p=trainPaint(),paint=p.body,brass=p.line;
 b.box(0,.30,0,.94,.145,1.80,'#1d3027',42);b.box(0,.605,-.02,.94,.46,1.57,paint,40);
 for(let s of[-1,1]){
  b.box(s*.447,.855,-.10,.065,.31,1.52,paint,40);b.box(s*.468,1.009,-.1,.075,.042,1.6,brass,41);
  for(let y of[.445,.938])b.box(s*.484,y,-.07,.012,.014,1.47,brass,41);
  for(let z of[-.78,.64])b.box(s*.484,.69,z,.012,.49,.014,brass,41);
  fineRivets(b,[s*.488,.495,-.74],[s*.488,.495,.61],22,'#b3985f',.01);
  b.push(s*.49,.708,-.06,0,s*PI/2);sign(b,'railway',0,0,0,1.15,.124);b.pop();
 }
 b.box(0,.85,-.831,.87,.29,.09,paint,40);b.box(0,.76,.66,.86,.40,.07,paint,40);b.box(0,.773,0,.82,.021,1.34,'#13221c',42);
 for(let i=0;i<125;i++){let x=rnd(-.38,.38),z=rnd(-.53,.57),h=.055+.14*(1-Math.abs(x)/.45);b.sphere(x,.84+h+rand()*.025,z,.052+rnd(0,.03),.04+rnd(0,.04),.068,'#252f28',42,7,4,true);}
 b.box(0,.93,-.65,.83,.075,.31,paint,40);b.cylinder(0,1,-.659,.112,.112,.055,brass,41,24);b.box(0,1.043,-.659,.104,.028,.028,'#4c4d39',41);
 smallAxle(b,-.53,.18,.66);smallAxle(b,.53,.18,.66);
 for(let s of[-1,1]){b.box(s*.374,.275,0,.065,.088,1.34,'#394438',42);for(let z of[-.53,.53]){b.box(s*.42,.249,z,.08,.09,.11,'#8f997f',41);for(let i=0;i<5;i++)b.box(s*.422,.32+i*.019,z,.06,.01,.33-i*.025,'#737b64',41);}b.beam([s*.40,.39,.79],[s*.40,1.08,.79],.015,brass,41,8);}
 for(let i=0;i<6;i++)b.box(.27,.40+i*.11,-.90,.235,.024,.049,'#9fa68c',41);for(let x of[.15,.385])b.beam([x,.33,-.889],[x,1.04,-.889],.012,brass,41,8);
 for(let z of[-.94,.94])b.beam([0,.29,z],[0,.29,z+Math.sign(z)*.16],.030,'#707665',41,8);
 b.cylinder(-.25,.80,-.903,.045,.045,.06,'#9b3126',40,12,PI/2);
 return b.mesh();
}
function makeCoachRoof(){
 const b=new Builder();barrelRoof(b,1.09,2.87,1.417,'#26362e');
 for(let i=0;i<7;i++){let z=(i-3)*.35;b.cylinder(0,1.704,z,.056,.061,.07,'#a39e7b',41,14);b.sphere(0,1.745,z,.08,.025,.08,'#57614c',41,14,6);}
 for(let x of[-.513,.513])b.box(x,1.451,0,.025,.034,2.85,'#dcc896',41);
 return b.mesh();
}
function makeCoach(observation=false){
 const b=new Builder(),p=trainPaint(),paint=p.coach,brass=p.line,ivory='#d5c5a1';
 b.box(0,.351,0,.99,.14,2.81,'#223429',42);b.box(0,.427,0,.89,.049,2.62,'#8b704a',22);
 // Truss rods, vacuum tanks, battery boxes and underfloor brake rigging.
 for(let s of[-1,1]){b.beam([s*.29,.36,-1.12],[s*.29,.13,-.37],.012,steelColor(),41,8);b.beam([s*.29,.13,-.37],[s*.29,.13,.37],.012,steelColor(),41,8);b.beam([s*.29,.13,.37],[s*.29,.36,1.12],.012,steelColor(),41,8);}
 b.cylinder(0,.22,0,.12,.12,.57,'#354738',42,18,PI/2);b.box(.26,.231,-.37,.21,.16,.32,'#253a2d',42);
 for(let s of[-1,1]){
  b.box(s*.459,.693,0,.071,.48,2.56,paint,40);b.box(s*.459,1.389,0,.071,.079,2.56,ivory,0);
  for(let y of[.481,.894])b.box(s*.504,y,0,.012,.014,2.57,brass,41);
  b.box(s*.488,.94,0,.074,.064,2.57,ivory,0);
  for(let i=0;i<8;i++){let z=(i-3.5)*.333;b.box(s*.458,1.175,z,.07,.432,.041,ivory,0);b.box(s*.507,1.18,z,.023,.384,.012,brass,41);}
  for(let i=0;i<7;i++){
   let z=(i-3)*.333;
   for(let zz of[z-.14,z+.14])b.box(s*.491,1.179,zz,.027,.368,.014,brass,41);
   for(let y of[1.004,1.351])b.box(s*.491,y,z,.027,.016,.282,brass,41);
   b.box(s*.407,1.249,z-.115,.027,.199,.038,'#baa881',23);b.box(s*.407,1.249,z+.115,.027,.199,.038,'#baa881',23);
   // Divided exterior panels and individual compartment seating.
   for(let zz of[z-.128,z+.128])b.box(s*.504,.685,zz,.009,.317,.010,brass,41);
   b.box(s*.502,.533,z,.01,.011,.256,brass,41);b.box(s*.502,.831,z,.01,.011,.256,brass,41);
   b.box(s*.28,.543,z,.243,.122,.234,'#735049',23);b.box(s*.375,.683,z,.063,.30,.23,'#69443d',23);b.box(s*.272,.45,z,.19,.035,.20,'#695637',22);
   if(i%2===0){b.sphere(s*.27,.796,z,.046,.054,.045,'#d1ad83',0,8,5);b.sphere(s*.27,.692,z,.054,.077,.043,['#567165','#a08054','#74615d'][i%3],23,8,5);}
  }
  b.push(s*.512,.69,0,0,s*PI/2);sign(b,'railway',0,0,.002,1.18,.095);b.pop();
 }
 for(let s of[-1,1]){
  b.box(0,.89,s*1.299,.88,.904,.042,paint,40);b.box(0,1.139,s*1.326,.23,.321,.015,'#364e40',43);
  b.box(0,.99,s*1.332,.283,.74,.011,brass,41);b.box(0,1.02,s*1.341,.252,.661,.012,paint,40);b.box(0,1.148,s*1.352,.18,.271,.009,'#a89966',6);
  b.box(0,.43,s*1.45,.84,.064,.272,'#443e2a',22);for(let x of[-.37,.37])b.beam([x,.45,s*1.55],[x,1.134,s*1.55],.014,brass,41,8);
  b.beam([-.37,1.019,s*1.55],[.37,1.019,s*1.55],.014,brass,41,8);b.beam([-.37,.704,s*1.55],[.37,.704,s*1.55],.010,brass,41,8);
  for(let x of[-.23,-.08,.08,.23])b.beam([x,.46,s*1.55],[x,1.01,s*1.55],.009,brass,41,6);
  b.beam([0,.30,s*1.44],[0,.30,s*1.65],.023,'#7a846a',41,8);
  for(let x of[-.495,.495])for(let j=0;j<2;j++)b.box(x,.332-j*.095,s*1.35,.17,.028,.235,'#526047',41);
 }
 if(observation)for(let x of[-.35,.35]){b.cylinder(x,1.11,-1.573,.052,.052,.058,'#472f20',41,14,PI/2);b.cylinder(x,1.11,-1.61,.038,.038,.009,'#ed5739',10,14,PI/2);}
 return b.mesh();
}
function steelColor(){return '#99a491';}
function makeBogie(){
 const b=new Builder();b.box(0,.207,0,.55,.096,.735,'#2d3a2c',42);
 smallAxle(b,-.22,.17,.66);smallAxle(b,.22,.17,.66);
 for(let s of[-1,1]){
  b.box(s*.392,.217,0,.075,.075,.714,'#4a5946',41);
  for(let z of[-.22,.22]){b.box(s*.395,.208,z,.10,.109,.13,'#69755f',41);b.cylinder(s*.454,.211,z,.041,.041,.016,'#adb39c',41,14,0,PI/2);}
  for(let i=0;i<4;i++)b.box(s*.399,.288+i*.018,0,.069,.011,.34-i*.025,'#748068',41);
  for(let z of[-.34,.34])b.box(s*.267,.125,z,.038,.107,.037,'#716e50',42);
 }
 return b.mesh();
}
function smallAxle(b,z,r=.17,width=.66){
 b.cylinder(0,r+.016,z,.027,.027,width,'#626f5b',41,10,0,PI/2);
 for(let s of[-1,1]){b.cylinder(s*width/2,r+.016,z,r,r,.057,'#283c2e',42,24,0,PI/2);ringX(b,s*(width/2+.034),r+.016,z,r*.78,r,.016,'#9ca791',41,24);b.cylinder(s*(width/2+.048),r+.016,z,r*.30,r*.30,.023,'#758469',41,16,0,PI/2);}
}
function workshopBuildTrains(){
 for(let m of[locoMesh,locoCabMesh,wheelMesh,tenderMesh,coachMesh,bogieMesh,observationMesh,coachRoofMesh,pistonMesh,jointMesh,couplingMesh,dieselMesh,flatcarMesh,carMesh,rodMesh])if(m){gl.deleteBuffer(m.buf);gl.deleteVertexArray(m.vao);}
 const oldSeed=seed;seed=80183;
 locoMesh=makeLoco();locoCabMesh=makeLoco(false);wheelMesh=makeWheels();tenderMesh=makeTender();coachMesh=makeCoach();observationMesh=makeCoach(true);coachRoofMesh=makeCoachRoof();bogieMesh=makeBogie();dieselMesh=makeDiesel();flatcarMesh=makeFlatcar();carMesh=makeCar();
 let b=new Builder();b.box(0,0,.5,.034,.041,1,'#b7c0ab',41);rodMesh=b.mesh();b=new Builder();b.box(0,0,0,.067,.091,.131,'#899784',41);pistonMesh=b.mesh();b=new Builder();b.sphere(0,0,0,.024,.031,.031,'#dbcca7',41,10,6);jointMesh=b.mesh();b=new Builder();b.cylinder(0,0,.5,.018,.018,1,'#969d87',41,10,PI/2);couplingMesh=b.mesh();seed=oldSeed;shadowDirty=true;
}
function drawLink(mesh,a,b,base,p){let d=sub(b,a);draw(mesh,mm(base,mm(basis(a,d),scaling(1,1,len(d)))),p);}
function workshopDrawTrains(p=mainProgram){
 if(!trainModels[0])return;
 const m=trainModels[0];draw((viewMode==='cab'||cutaway)&&p===mainProgram?locoCabMesh:locoMesh,m,p);draw(tenderMesh,trainModels[1],p);
 for(let i=2;i<trainModels.length;i++){draw(i===trainModels.length-1?observationMesh:coachMesh,trainModels[i],p);if(!cutaway||p!==mainProgram)draw(coachRoofMesh,trainModels[i],p);}
 for(let model of bogieModels)draw(bogieMesh,model,p);
 for(let z of[-.70,-.15,.40])draw(wheelMesh,mm(m,mm(trans(0,.325,z),rx(wheelPhase))),p);
 for(let s of[-1,1]){
  const q=wheelPhase+(s<0?PI/2:0),cy=.325+.143*Math.cos(q),cz=.143*Math.sin(q),xx=s*.447;
  const back=[xx,cy,-.70+cz],front=[xx,cy,.40+cz],middle=[xx,cy,-.15+cz];
  drawLink(rodMesh,back,front,m,p);
  for(let z of[-.70,-.15,.40])draw(jointMesh,mm(m,trans(xx,cy,z+cz)),p);
  const sliderZ=middle[2]+Math.sqrt(Math.max(.01,.91*.91-(.345-cy)**2)),crosshead=[s*.565,.345,sliderZ];
  drawLink(rodMesh,[s*.474,cy,middle[2]],crosshead,m,p);draw(pistonMesh,mm(m,trans(...crosshead)),p);drawLink(couplingMesh,crosshead,[s*.565,.345,1.23],m,p);
  const ecc=[s*.492,.325+.054*Math.cos(q+.85),-.15+.054*Math.sin(q+.85)];drawLink(couplingMesh,ecc,[s*.583,.5,.83],m,p);draw(jointMesh,mm(m,trans(...ecc)),p);
 }
 for(let i=1;i<trainModels.length;i++){
  const front=transform([0,.29,i===1?.98:1.64],trainModels[i]);const rear=transform([0,.29,i===1?-1.82:i===2?-1.04:-1.64],trainModels[i-1]);drawLink(couplingMesh,front,rear,I,p);
 }

}

// Scene objects are independent, serializable instances. Batching keeps editing responsive.
let objects=[],objectSerial=0,worldBuilding=false,captureScenery=true,sceneryMesh=null,baseDesign=null,trackDesign=null,flatTerrain=false;
let terrainStamps=[];const sceneryRanges=new Map();
const templates=new Map(),assetGeometry=new Map();
const ASSETS=[
 {id:'cottage',name:'Stone cottage',cat:'Village',w:2.8,d:2.8,h:3.8,desc:'Slate roof, window boxes and a little front step.'},
 {id:'bakery',name:'Village bakery',cat:'Village',w:3.25,d:2.7,h:4,desc:'The Daily Bread, complete with striped awning.'},
 {id:'inn',name:'Country inn',cat:'Village',w:3.0,d:2.65,h:4,desc:'A welcoming stop on the village green.'},
 {id:'church',name:'Village church',cat:'Village',w:3.5,d:4.1,h:5.7,desc:'Stone clock tower, slate roof and brass cross.'},
 {id:'station',name:'Alder Vale station',cat:'Railway',w:15.0,d:5.0,h:4.1,desc:'The whole platform, canopy, lamps and passengers.'},
 {id:'signalbox',name:'Signal cabin',cat:'Railway',w:2.6,d:2.8,h:3.6,desc:'Timber upper storey, glazing and external stairs.'},
 {id:'watertower',name:'Water tower',cat:'Railway',w:2.4,d:2.4,h:4.2,desc:'Banded timber tank, inspection ladder and pipe.'},
 {id:'goods',name:'Goods shed',cat:'Railway',w:4.5,d:3.2,h:3.3,desc:'Brick loading shed with sliding doors and crates.'},
 {id:'oak',name:'English oak',cat:'Nature',w:2.2,d:2.2,h:3.0,desc:'An irregular, full canopy with branching structure.'},
 {id:'pine',name:'Silver fir',cat:'Nature',w:1.8,d:1.8,h:3.3,desc:'Layered branches and a slender woodland silhouette.'},
 {id:'autumn',name:'Autumn maple',cat:'Nature',w:2.4,d:2.4,h:3.0,desc:'Ochre and copper foliage for a touch of autumn.'},
 {id:'willow',name:'Weeping willow',cat:'Nature',w:3.2,d:3.2,h:3.5,desc:'Drooping branches. At home beside the water.'},
 {id:'orchard',name:'Little orchard',cat:'Nature',w:4.8,d:3.6,h:2.4,desc:'Six fruit trees arranged in a neat, leafy patch.'},
 {id:'rock',name:'Weathered rocks',cat:'Nature',w:1.5,d:1.3,h:.75,desc:'A small outcrop, ready to nestle into a hillside.'},
 {id:'flowers',name:'Kitchen garden',cat:'Details',w:2.6,d:2.0,h:.55,desc:'Raised beds, tiny vegetables and flowering borders.'},
 {id:'bench',name:'Platform bench',cat:'Details',w:1.05,d:.6,h:.8,desc:'Individual wooden slats on a cast-iron frame.'},
 {id:'lamp',name:'Station lamp',cat:'Details',w:.45,d:.45,h:2.7,desc:'A warm lantern with a turned metal post.'},
 {id:'fence',name:'Picket fence',cat:'Details',w:3.5,d:.2,h:.7,desc:'Painted timber fencing, ideal around a cottage.'},
 {id:'sheep',name:'Grazing sheep',cat:'Details',w:2.5,d:2.3,h:.6,desc:'A little flock brings the pasture to life.'},
 {id:'picnic',name:'Picnic table',cat:'Details',w:2.1,d:1.9,h:1.0,desc:'Planked table and benches for the village green.'},
 {id:'hill',name:'Sculpt a hill',cat:'Landscape',w:10,d:10,h:3,desc:'Raises the actual terrain. Use scale to widen the slope.'}
];
const assetById=Object.fromEntries(ASSETS.map(a=>[a.id,a]));
function registerObject(type,x,z,angle=0,scale=1,params=null,yoff=0){const o={id:'o'+(++objectSerial),type,x,z,angle,scale,seed:Math.floor(rand()*999999),params,yoff};objects.push(o);return o;}
function house(b,x,z,w,d,h,paint,roof,angle=0,name=null){
 if(!worldBuilding)return baseHouse(b,x,z,w,d,h,paint,roof,angle,name);
 houseZones.push({x,z,r:Math.hypot(w,d)/2+.9});if(captureScenery)registerObject(name==='bakery'?'bakery':name==='inn'?'inn':'cottage',x,z,angle,1,{w,d,h,paint,roof,name});
}
function tree(b,x,z,h=2.9,warm=false){if(!worldBuilding)return baseTree(b,x,z,h,warm);if(captureScenery)registerObject(warm?'autumn':'oak',x,z,rand()*TAU,h/3);}
function pine(b,x,z,h=3.3){if(!worldBuilding)return basePine(b,x,z,h);if(captureScenery)registerObject('pine',x,z,rand()*TAU,h/3.3);}
function rock(b,x,z,s=1){if(!worldBuilding)return baseRock(b,x,z,s);if(captureScenery)registerObject('rock',x,z,rand()*TAU,s);}
function station(b){
 if(!worldBuilding)return baseStation(b);
 houseZones.push({x:-11.5,z:11,r:6.3});if(captureScenery)registerObject('station',-11.5,11.5,0,1,null,.84-terrainH(-11.5,11.5));
 // Keep the existing local-light positions independently of cached geometry.
 for(let x of[-17.9,-5])lampPositions.push([x,3.22,13.04]);
}
function church(b,x,z){if(!worldBuilding)return baseChurch(b,x,z);houseZones.push({x,z,r:2.7});if(captureScenery)registerObject('church',x,z);}
function naturalH(x,z){let h=flatTerrain?.70:baseNaturalH(x,z);for(const o of terrainStamps){const radius=4.8*o.scale;h+=3.5*Math.exp(-((x-o.x)**2+(z-o.z)**2)/(radius*radius));}return h;}
function initTracks(){
 trackGrid.clear();baseInitTracks();
 if(!baseDesign)baseDesign=Object.fromEntries(edges.map(e=>[e.name,JSON.parse(JSON.stringify(e.curves))]));
 if(trackDesign){common=new Edge('common',trackDesign.common);highline=new Edge('highline',trackDesign.highline);lowline=new Edge('lowline',trackDesign.lowline);yard=new Edge('yard',trackDesign.yard);edges=[common,highline,lowline,yard];trackGrid.clear();for(let edge of edges)for(let d=0;d<=edge.length;d+=.33){let a=edge.at(d),k=`${Math.floor(a.p[0]/2)},${Math.floor(a.p[2]/2)}`;if(!trackGrid.has(k))trackGrid.set(k,[]);trackGrid.get(k).push(a);}let inside=[];for(let d=0;d<common.length;d+=.25){let a=common.at(d);if(naturalH(a.p[0],a.p[2])>a.p[1]+2.25)inside.push(d);}tunnelStart=inside.length?inside[0]:Infinity;tunnelEnd=inside.length?inside.at(-1):-Infinity;}
}
function buildWorld(){
 terrainStamps=objects.filter(o=>o.type==='hill');
 const oldSeed=seed;seed=72491;worldBuilding=true;houseZones.length=0;roads.length=0;lampPositions.length=0;signalModels.length=0;
 baseBuildWorld();worldBuilding=false;seed=oldSeed;
 if(!trackDesign)trackDesign=JSON.parse(JSON.stringify(baseDesign));
}
function templateKey(o){return o.type+(o.params?JSON.stringify(o.params):'')+'_'+(o.seed%3);}
function workshopGetTemplate(o){
 const key=templateKey(o);if(templates.has(key))return templates.get(key);
 const b=new Builder(),oldSeed=seed,oldZones=houseZones.length,oldLamps=lampPositions.length;seed=104729+(o.seed%3)*9103;
 const th=terrainH(0,0);let type=o.type;
 if(['cottage','bakery','inn'].includes(type)){
  const q=o.params||{w:type==='bakery'?2.9:2.55,d:2.05,h:2.45,paint:type==='inn'?'#d0c1a5':'#d5c6a5',roof:type==='bakery'?'#907452':'#576b60',name:type==='cottage'?null:type};
  b.push(0,-th,0);baseHouse(b,0,0,q.w,q.d,q.h,q.paint,q.roof,0,q.name);b.pop();
 }else if(type==='station'){b.push(11.5,-.84,-11.5);baseStation(b);b.pop();}
 else if(type==='church'){b.push(0,-th,0);baseChurch(b,0,0);b.pop();}
 else if(type==='oak'||type==='autumn'){b.push(0,-th,0);baseTree(b,0,0,3,type==='autumn');b.pop();}
 else if(type==='pine'){b.push(0,-th,0);basePine(b,0,0,3.3);b.pop();}
 else if(type==='rock'){b.push(0,-th,0);baseRock(b,0,0,1);baseRock(b,.48,.19,.6);baseRock(b,-.35,-.20,.45);b.pop();}
 else if(type==='bench')bench(b,0,0,0);
 else if(type==='lamp'){b.push(0,-th,0);lamp(b,0,0,2.15);b.pop();}
 else if(type==='fence'){
  for(let x=-1.7;x<=1.701;x+=.17){b.box(x,.31,0,.102,.57,.06,'#d4c7a0',22);b.tri([x-.051,.595,.031],[x+.051,.595,.031],[x,.69,.031],'#e0d4ae',22);}
  b.box(0,.24,-.045,3.5,.067,.066,'#b7ac87',22);b.box(0,.50,-.045,3.5,.067,.066,'#b7ac87',22);
 }else if(type==='flowers'){
  b.box(0,.033,0,2.6,.065,1.94,'#7a7150',9);
  for(let z of[-.48,.48]){b.box(0,.125,z,2.3,.16,.69,'#82643f',22);b.box(0,.21,z,2.13,.025,.54,'#3f3d28',9);for(let x=-.90;x<1;x+=.24)for(let zz of[-.12,.12]){b.sphere(x,.29,z+zz,.10,.14,.10,'#6c8743',8,8,5);if(z<0)b.sphere(x,.40,z+zz,.064,.053,.064,'#d0a275',0,7,4);}}
 }else if(type==='signalbox'){
  b.box(0,.71,0,1.8,1.42,1.72,'#a7906d',4);b.box(0,1.49,0,2.08,.15,1.98,'#d1bc8f',22);b.box(0,1.74,0,1.93,.40,1.8,'#446953',22);
  for(let side=0;side<4;side++){b.push(0,0,0,0,side*PI/2);for(let x of[-.64,0,.64])windowPane(b,x,2.32,.915,.53,.68);b.pop();}gable(b,2.15,2.12,2.86,.68,'#4c6255');
  for(let j=0;j<8;j++)b.box(1.32,.12+j*.19,.94-j*.20,.55,.16,.28,'#94835d',22);b.beam([1.60,.65,1.02],[1.60,2.06,-.54],.025,'#bca772',22,8);b.box(1.25,1.54,-.70,.74,.09,.62,'#9b8b61',22);
 }else if(type==='watertower'){
  for(let x of[-.62,.62])for(let z of[-.62,.62])b.box(x,1.24,z,.13,2.48,.13,'#696548',22);
  for(let s of[-1,1]){b.beam([-.62,.25,s*.62],[.62,2.27,s*.62],.045,'#8e825d',22);b.beam([.62,.25,s*.62],[-.62,2.27,s*.62],.045,'#8e825d',22);b.beam([s*.62,.25,-.62],[s*.62,2.27,.62],.042,'#8e825d',22);}
  b.cylinder(0,3.06,0,.91,.91,1.42,'#9b774b',22,40);for(let i=0;i<32;i++){let a=i*TAU/32;b.beam([Math.cos(a)*.913,2.35,Math.sin(a)*.913],[Math.cos(a)*.913,3.77,Math.sin(a)*.913],.010,'#655238',22,5);}
  for(let y of[2.48,3.05,3.67])b.cylinder(0,y,0,.928,.928,.048,'#414e42',41,48);
  b.cylinder(0,3.88,0,1.03,0,.45,'#5f6d53',5,32);
  b.beam([.97,.02,.04],[.97,3.92,.04],.025,'#b7a477',41,8);b.beam([1.2,.02,.04],[1.2,3.92,.04],.025,'#b7a477',41,8);for(let y=.1;y<3.94;y+=.22)b.beam([.97,y,.04],[1.2,y,.04],.019,'#a79876',41,8);
  b.beam([-.97,.03,0],[-.97,2.66,0],.06,'#4c6655',41,10);b.beam([-.97,2.66,0],[-.4,2.66,0],.06,'#4c6655',41,10);
 }else if(type==='goods'){
  b.box(0,.13,0,4.4,.26,3.05,'#98967b',4);b.box(0,1.32,0,3.65,2.38,2.35,'#a68662',4);gable(b,3.78,2.50,2.51,.83,'#596e60');b.box(0,1.04,1.198,1.66,1.82,.08,'#557264',22);for(let x=-.74;x<.80;x+=.18)b.box(x,1.05,1.243,.022,1.70,.024,'#8f9a7e',22);b.box(0,2.06,1.27,2.06,.073,.054,'#444e38',41);
  for(let x of[-1.39,1.39])windowPane(b,x,1.73,1.20,.50,.62);for(let i=0;i<3;i++){let x=1.36+i*.29;b.box(x,.43,1.23,.42,.43,.37,'#ad8855',22);b.box(x,.45,1.421,.33,.04,.025,'#6d653e',22);}
 }else if(type==='willow'){
  b.cylinder(0,.85,0,.13,.047,1.7,'#695e43',22,10);
  for(let j=0;j<9;j++){let a=j*2.399,r=.6+rand()*.32,x=Math.cos(a)*r,z=Math.sin(a)*r,y=2.2+rand()*.55;b.beam([0,1.15,0],[x,y,z],.033,'#766544',22);b.sphere(x,y,z,.71,.54,.71,shade('#789457',rnd(.88,1.08)),8,12,8);for(let k=0;k<4;k++){let aa=a+k*.42;let xx=x+Math.cos(aa)*.40,zz=z+Math.sin(aa)*.40;for(let t=0;t<6;t++){let yy=y-.15-t*.24;b.sphere(xx+t*.035,yy,zz,.13,.23,.12,shade('#718a4f',rnd(.89,1.08)),8,7,5);}}}
 }else if(type==='orchard'){
  for(let x of[-1.55,0,1.55])for(let z of[-.85,.85]){b.push(x,-th,z,0,rand()*TAU,0,.68);baseTree(b,0,0,3,false);b.pop();}
 }else if(type==='sheep'){
  for(let j=0;j<4;j++){b.push(rnd(-.9,.9),0,rnd(-.8,.8),0,rnd(0,TAU));b.sphere(0,.29,0,.18,.20,.32,'#e0d9bc',23,12,8);b.sphere(.01,.32,.34,.077,.12,.13,'#555741',0,10,6);for(let x of[-.115,.115])for(let z of[-.19,.19])b.beam([x,.21,z],[x,.028,z+.01],.028,'#6e6a50',0,6);b.pop();}
 }else if(type==='picnic'){
  for(let i=0;i<5;i++)b.box((i-2)*.17,.89,0,.15,.06,1.86,'#b0925b',22);for(let x of[-.74,.74]){b.box(x,.47,0,.28,.06,1.88,'#a88a57',22);for(let z of[-.63,.63])b.beam([x*.65,.91,z],[x*1.25,.02,z],.045,'#7c714c',22,7);}
 }else if(type==='hill'){
  for(let j=0;j<20;j++)for(let i=0;i<20;i++){let x=-5+i*.5,z=-5+j*.5,p=(xx,zz)=>[xx,3.5*Math.exp(-(xx*xx+zz*zz)/23),zz];b.quad(p(x,z),p(x,z+.5),p(x+.5,z+.5),p(x+.5,z),'#79905a',3);}
 }
 houseZones.length=oldZones;lampPositions.length=oldLamps;seed=oldSeed;
 const data=b.data;let min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];for(let i=0;i<data.length;i+=12)for(let j=0;j<3;j++){min[j]=Math.min(min[j],data[i+j]);max[j]=Math.max(max[j],data[i+j]);}
 const result={data,min,max,mesh:b.mesh()};templates.set(key,result);return result;
}
function objectY(o){return terrainH(o.x,o.z)+(o.yoff||0);}
function objectMatrix(o){return mm(trans(o.x,objectY(o),o.z),mm(ry(o.angle),scaling(o.scale)));}
function appendInstance(dst,src,m){
 const a=dst.data,s=Math.hypot(m[0],m[1],m[2])||1;
 for(let i=0;i<src.length;i+=12){const x=src[i],y=src[i+1],z=src[i+2],nx=src[i+3],ny=src[i+4],nz=src[i+5];
  a.push(m[0]*x+m[4]*y+m[8]*z+m[12],m[1]*x+m[5]*y+m[9]*z+m[13],m[2]*x+m[6]*y+m[10]*z+m[14],(m[0]*nx+m[4]*ny+m[8]*nz)/s,(m[1]*nx+m[5]*ny+m[9]*nz)/s,(m[2]*nx+m[6]*ny+m[10]*nz)/s,src[i+6],src[i+7],src[i+8],src[i+9],src[i+10],src[i+11]);
 }
}
function disposeMesh(m){if(m){gl.deleteVertexArray(m.vao);gl.deleteBuffer(m.buf);}}
function rebuildScenery(exclude=null){
 if(exclude){shadowDirty=true;return;}
 const b=new Builder();sceneryRanges.clear();stationMarkerCache=null;
 for(const o of objects)if(o.type!=='hill'){const start=b.data.length/12;appendInstance(b,getTemplate(o).data,objectMatrix(o));sceneryRanges.set(o.id,{start,count:b.data.length/12-start});}
 disposeMesh(sceneryMesh);sceneryMesh=b.mesh();shadowDirty=true;engineCamChoice=null;
}
function updateSceneryObject(o){
 stationMarkerCache=null;
 if(!o||o.type==='hill')return;
 const range=sceneryRanges.get(o.id),template=getTemplate(o);if(!range||range.count!==template.data.length/12){rebuildScenery();return;}
 const b=new Builder();appendInstance(b,template.data,objectMatrix(o));gl.bindBuffer(gl.ARRAY_BUFFER,sceneryMesh.buf);gl.bufferSubData(gl.ARRAY_BUFFER,range.start*48,new Float32Array(b.data));shadowDirty=true;engineCamChoice=null;
}
function drawScenery(p){
 const range=gesture?.kind==='move'?sceneryRanges.get(gesture.id):null;
 if(!range){draw(sceneryMesh,I,p);return;}
 um(p,'uModel',I);gl.bindVertexArray(sceneryMesh.vao);
 if(range.start)gl.drawArrays(gl.TRIANGLES,0,range.start);
 const end=range.start+range.count;if(end<sceneryMesh.count)gl.drawArrays(gl.TRIANGLES,end,sceneryMesh.count-end);
}
function renderObject(o,p=mainProgram){if(o&&o.type!=='hill')draw(getTemplate(o).mesh,objectMatrix(o),p);}
// Runtime detail pass: railway infrastructure that follows the real alignment.
let setDetailMesh=null;
function buildSetDetails(){
 const b=new Builder(),saved=seed;seed=88117;
 for(let d=6;d<common.length-22;d+=6.5){const a=common.at(d);if(a.d>tunnelStart-2&&a.d<tunnelEnd+2)continue;const r=norm([a.f[2],0,-a.f[0]]),p=add(a.p,mul(r,-1.72)),y=terrainH(p[0],p[2]);b.cylinder(p[0],y+1.6,p[2],.060,.035,3.2,'#79613d',22,10);b.matrix(basis([p[0],y,p[2]],a.f));b.box(0,2.91,0,1.10,.064,.079,'#765f3f',22);for(let x of[-.45,-.23,.23,.45]){b.cylinder(x,3.005,0,.028,.022,.13,'#b5c6b0',43,10);b.sphere(x,3.086,0,.041,.026,.041,'#afc3ac',43,10,5);}b.pop();}
 // Kilometer markers, lineside cabinets and cable troughs.
 for(let edge of[common,highline,lowline])for(let d=4;d<edge.length-2;d+=13){let a=edge.at(d),r=norm([a.f[2],0,-a.f[0]]),p=add(a.p,mul(r,1.07));if(edge===common&&d>tunnelStart-1&&d<tunnelEnd+1)continue;b.box(p[0],terrainH(p[0],p[2])+.22,p[2],.15,.44,.14,'#d4c8a7',4);b.box(p[0],terrainH(p[0],p[2])+.35,p[2]+.077,.094,.04,.005,'#464f3b',0);}
 seed=saved;disposeMesh(setDetailMesh);setDetailMesh=b.mesh();shadowDirty=true;
}

// -------------------------- Interactive layout workshop --------------------------
let building=false,category='Village',selectedId=null,draft=null,ghost=null,ghostCheck={ok:true},gridVisible=true,snapEnabled=true,trackEditing=false,editRoute='common',chosenKnot=null,chosenSegment=0,showTangents=false;
let layoutCredits=[];
let layoutTitle='Alder Valley Grand Division',undoStack=[],redoStack=[],factorySnapshot=null,gesture=null,editPointers=new Map(),preGesture=null,rebuilding=false,pendingRebuild=false,saveTimer=0,confirmAction=null,gridMesh=null,ringMesh=null,oldInspector='',cameraProjection=ident();
const overlay=$('editorOverlay'),ectx=overlay.getContext('2d'),thumbs=new Map();
const clone=v=>JSON.parse(JSON.stringify(v));
const STORAGE_KEY='alder-valley-grand-division-v2';
function workshopSnapshot(){return {format:'alder-valley-workshop',version:1,name:layoutTitle,credits:validateCredits(layoutCredits),objects:clone(objects),tracks:clone(trackDesign),flat:flatTerrain,livery,coaches:offsets.length-2};}
function pushUndo(state=snapshot()){undoStack.push(state);if(undoStack.length>40)undoStack.shift();redoStack=[];updateUndo();}
function updateUndo(){$('undoBuild').disabled=!undoStack.length;$('redoBuild').disabled=!redoStack.length;}
function saveProjectSoon(){clearTimeout(saveTimer);$('saveState').textContent='Saving…';saveTimer=setTimeout(()=>{try{localStorage.setItem(STORAGE_KEY,JSON.stringify(snapshot()));$('saveState').textContent='Saved on this device';}catch{$('saveState').textContent='Export a copy to save';}},500);}
function validateProject(value){
 if(!value||value.format!=='alder-valley-workshop'||value.version!==1)throw new Error('This is not an Alder Valley workshop layout.');
 if(!Array.isArray(value.objects)||value.objects.length>2400)throw new Error('Layouts can contain up to 2,400 scenery pieces.');
 const isNum=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
 const clean={format:value.format,version:1,name:typeof value.name==='string'?value.name.slice(0,48):'Untitled railway',objects:[],tracks:{},flat:!!value.flat,livery:Object.hasOwn(liveries,value.livery)?value.livery:'green',coaches:isNum(value.coaches,1,8)?Math.round(value.coaches):3};
 for(let i=0;i<value.objects.length;i++){
  const o=value.objects[i];if(!o||!Object.hasOwn(assetById,o.type)||!isNum(o.x,-56,56)||!isNum(o.z,-35,35)||!isNum(o.scale,.05,3)||!isNum(o.angle,-100,100))throw new Error('A scenery piece has invalid coordinates or dimensions.');
  let params=null;if(o.params&&['cottage','bakery','inn'].includes(o.type)){
   const p=o.params;if(!isNum(p.w,.5,7)||!isNum(p.d,.5,7)||!isNum(p.h,.5,7)||typeof p.paint!=='string'||typeof p.roof!=='string'||!/^#[0-9a-f]{6}$/i.test(p.paint)||!/^#[0-9a-f]{6}$/i.test(p.roof))throw new Error('A building has invalid dimensions or colors.');
   params={w:p.w,d:p.d,h:p.h,paint:p.paint,roof:p.roof,name:['post','bakery','inn'].includes(p.name)?p.name:null};
  }
  const credits=validateCredits(o.credits);
  clean.objects.push({...(credits.length?{credits}:{}),id:'o'+(i+1),type:o.type,x:o.x,z:o.z,angle:o.angle,scale:o.scale,seed:isNum(o.seed,0,1e9)?Math.floor(o.seed):i*101,params,yoff:isNum(o.yoff,-24,24)?o.yoff:0});
 }
 for(let key of Object.keys(value.tracks||{})){
  if(!/^(common|highline|lowline|yard|freight|mountain|siding[0-9]+|depot)$/.test(key))continue;const curves=value.tracks?.[key];if(!Array.isArray(curves)||curves.length<1||curves.length>50)throw new Error('The layout track data is missing or too large.');
  clean.tracks[key]=curves.map(c=>{if(!Array.isArray(c)||c.length!==4)throw new Error('Invalid track curve.');return c.map(p=>{if(!Array.isArray(p)||p.length!==3||!isNum(p[0],-54,54)||!isNum(p[1],.5,20)||!isNum(p[2],-33,33))throw new Error('A track control point is outside the board.');return p.slice();});});
  for(let i=1;i<curves.length;i++)if(len(sub(curves[i-1][3],curves[i][0]))>.01)throw new Error('One of the track sections is disconnected.');
 }
 for(const key of ['common','highline','lowline','yard'])if(!clean.tracks[key])throw new Error('Missing running alignment.');
 for(const key of ['freight','mountain'])if(clean.tracks[key]&&len(sub(clean.tracks[key][0][0],clean.tracks[key].at(-1)[3]))>.01)throw new Error('A closed circuit has been disconnected.');
 const t=clean.tracks;
 for(let key of['highline','lowline'])if(len(sub(t.common.at(-1)[3],t[key][0][0]))>.01||len(sub(t[key].at(-1)[3],t.common[0][0]))>.01)throw new Error('The running lines must connect at both junctions.');
 if(value.credits!==undefined)clean.credits=validateCredits(value.credits);
 clean.division='grand-v2';clean.services={freight:value.services?.freight!==false,mountain:value.services?.mountain!==false};return clean;
}
function workshopApplySnapshot(s,initial=false){
 const changedTerrain=flatTerrain!==!!s.flat||JSON.stringify(trackDesign)!==JSON.stringify(s.tracks)||JSON.stringify(objects.filter(o=>o.type==='hill'))!==JSON.stringify(s.objects.filter(o=>o.type==='hill'));
 layoutTitle=s.name;layoutCredits=validateCredits(s.credits);objects=clone(s.objects);objectSerial=objects.reduce((n,o)=>Math.max(n,parseInt(o.id.slice(1))||0),0);trackDesign=clone(s.tracks);flatTerrain=!!s.flat;
 selectedId=null;draft=null;ghost=null;chosenKnot=null;
 const needTrain=s.livery!==livery||s.coaches!==offsets.length-2;livery=s.livery;setCoachOffsets(s.coaches);
 if(needTrain&&!initial)buildTrains();$('layoutName').value=layoutTitle;updateTrainControls();
 if(!initial){if(changedTerrain)queueWorldRebuild();else{rebuildScenery();updateTrainModels();refreshInspector(true);}}
}
function undoBuild(){if(!undoStack.length||rebuilding)return;redoStack.push(snapshot());const s=undoStack.pop();applySnapshot(s);updateUndo();saveProjectSoon();refreshInspector(true);}
function redoBuild(){if(!redoStack.length||rebuilding)return;undoStack.push(snapshot());const s=redoStack.pop();applySnapshot(s);updateUndo();saveProjectSoon();refreshInspector(true);}
function setCoachOffsets(count){offsets.splice(0,offsets.length,0,2.75);for(let i=0;i<count;i++)offsets.push(5.21+3.26*i);$('coachCount').value=count;$('coachCountValue').textContent=count;$('coachCount').style.setProperty('--fill',((count-1)/7*100)+'%');if(leadInfo)updateTrainModels();}
function updateTrainControls(){for(let b of document.querySelectorAll('[data-livery]'))b.classList.toggle('chosen',b.dataset.livery===livery);$('liveryName').textContent={green:'Brunswick green',blue:'Midnight blue',claret:'Claret'}[livery];}
function exportBlob(content,type,name){const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);}
function safeFilename(){return layoutTitle.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'my-railway';}
function exportProject(){exportBlob(JSON.stringify(snapshot(),null,2),'application/json',safeFilename()+'.railway.json');$('projectMenu').hidden=true;toast('Your layout is packed and ready to keep.');}
function exportPlayable(){
 const source=document.documentElement.cloneNode(true);source.querySelector('#embeddedLayout').textContent=JSON.stringify(snapshot()).replace(/</g,'\\u003c');source.querySelector('#loader').classList.remove('done');source.querySelector('#builderUI').hidden=true;source.querySelector('#trainInspector').hidden=true;source.querySelector('#projectMenu').hidden=true;source.querySelector('#workshopBusy').hidden=true;source.querySelector('#worldTip').hidden=true;source.querySelector('body').className='';source.querySelector('#error').removeAttribute('style');
 // Browser event listeners are reattached on startup; the whole engine is included.
 exportBlob('<!DOCTYPE html>\n'+source.outerHTML,'text/html',safeFilename()+'.html');$('projectMenu').hidden=true;toast('A complete, playable HTML copy has been created.');
}
function askReset(kind){$('projectMenu').hidden=true;confirmAction=()=>{pushUndo();const s=clone(factorySnapshot);if(kind==='meadow'){s.name='My little railway';s.flat=true;s.objects=[];for(let c of s.tracks.highline)for(let p of c)p[1]=1.06;}applySnapshot(s);saveProjectSoon();renderCatalog();};$('confirmTitle').textContent=kind==='meadow'?'Start a meadow layout?':'Restore Alder Valley?';$('projectConfirm').querySelector('p').textContent=kind==='meadow'?'Clears the movable scenery and levels the hills. Keeps your room and a connected railway. Your current layout stays in Undo.':'Your current layout is kept in Undo. Export a copy to keep it separately.';$('confirmDo').textContent=kind==='meadow'?'Start fresh':'Restore the valley';$('projectConfirm').showModal();}
function queueWorldRebuild(){
 if(rebuilding){pendingRebuild=true;return;}
 rebuilding=true;$('workshopBusy').hidden=false;
 requestAnimationFrame(()=>setTimeout(()=>{try{
  const wasPaused=paused;captureScenery=false;
  for(let m of[staticMesh,groundMesh,waterMesh,signalGreenMesh,signalRedMesh,crossingMesh])disposeMesh(m);
  if(atlasTexture)gl.deleteTexture(atlasTexture);
  buildWorld();buildSetDetails();rebuildScenery();rebuildGrid();initJourney();paused=wasPaused;steam.length=0;shadowDirty=true;refreshInspector(true);renderCatalog();
 }catch(e){console.error(e);toast('The layout could not rebuild. Undo returns to the previous layout.');}finally{rebuilding=false;$('workshopBusy').hidden=true;if(pendingRebuild){pendingRebuild=false;queueWorldRebuild();}}},30));
}
function thumb(type){
 if(thumbs.has(type))return thumbs.get(type);
 const t=getTemplate({type,seed:0}),b=t.data,c=document.createElement('canvas');c.width=220;c.height=164;const ctx=c.getContext('2d');
 const v=norm([6,4.5,7]),right=norm([v[2],0,-v[0]]),up=cross(v,right),center=mul(add(t.min,t.max),.5),pts=[],faces=[];let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
 for(let i=0;i<b.length;i+=12){const p=sub(b.slice(i,i+3),center),x=dot(right,p),y=-dot(up,p),z=dot(v,p);pts.push([x,y,z]);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
 const scale=Math.min(178/(maxX-minX||1),126/(maxY-minY||1)),cx=110-(minX+maxX)*scale*.5,cy=81-(minY+maxY)*scale*.5;
 const shadow=ctx.createRadialGradient(110,137,0,110,137,72);shadow.addColorStop(0,'#737b5940');shadow.addColorStop(1,'#737b5900');ctx.fillStyle=shadow;ctx.save();ctx.translate(0,85);ctx.scale(1,.38);ctx.beginPath();ctx.arc(110,137,72,0,TAU);ctx.fill();ctx.restore();
 const light=norm([-1,2,3]);
 for(let i=0;i<pts.length;i+=3){let idx=i*12,n=norm(add(add(b.slice(idx+3,idx+6),b.slice(idx+15,idx+18)),b.slice(idx+27,idx+30)));if(dot(n,v)<-.25)continue;let shade=.58+.44*Math.max(0,dot(n,light));let rgb=b.slice(idx+6,idx+9).map(x=>Math.round(clamp(x*shade)*255));if(Math.round(b[idx+9])===15)rgb=[151,137,99];faces.push({p:[pts[i],pts[i+1],pts[i+2]],z:(pts[i][2]+pts[i+1][2]+pts[i+2][2])/3,c:'rgb('+rgb.join(',')+')'});}
 faces.sort((a,b)=>a.z-b.z);for(let f of faces){ctx.beginPath();f.p.forEach((p,i)=>i?ctx.lineTo(cx+p[0]*scale,cy+p[1]*scale):ctx.moveTo(cx+p[0]*scale,cy+p[1]*scale));ctx.closePath();ctx.fillStyle=f.c;ctx.fill();}
 const data=c.toDataURL('image/png');thumbs.set(type,data);return data;
}
function workshopRenderCatalog(){
 const root=$('partCatalog');root.replaceChildren();for(let b of document.querySelectorAll('[data-category]'))b.classList.toggle('chosen',b.dataset.category===category);
 if(category==='Railway'){
  const button=document.createElement('button');button.className='track-card';button.innerHTML='<svg><use href="#i-route"/></svg><strong>'+(trackEditing?'Your running lines.':'Shape the running line.')+'</strong><p>'+(trackEditing?'Drag a gold node to move a section. The connected track follows.':'Edit real track curves. The locomotive runs on the railway you shape.')+'</p>';button.onclick=()=>toggleTrackEditing(!trackEditing);root.append(button);
  if(trackEditing){
   const tools=document.createElement('div');tools.className='track-tools';tools.innerHTML='<label>RUNNING LINE<select id="routeSelect">'+Object.keys(trackDesign).map(k=>'<option value="'+k+'">'+(DIVISION_NAMES[k]||k)+'</option>').join('')+'</select></label><button id="splitTrack">+ Add a shaping point</button><button id="removeKnot">Remove selected point</button><button id="curveHandles">'+(showTangents?'Hide':'Show')+' curve handles</button><label>POINT HEIGHT<input id="knotHeight" type="range" min="1.06" max="18" step="0.1" value="'+(chosenKnot?getKnotPosition(chosenKnot)[1]:1.06)+'"></label><p>Both running routes remain connected. Gold nodes shape the railway; small square handles fine-tune a curve. Rebuilding pauses briefly when you release.</p><button id="finishTrack">Finish shaping track</button>';
   root.append(tools);$('routeSelect').value=editRoute;$('routeSelect').onchange=e=>{editRoute=e.target.value;chosenKnot=null;chosenSegment=0;refreshInspector(true);};$('splitTrack').onclick=splitTrack;$('removeKnot').onclick=removeTrackKnot;$('curveHandles').onclick=()=>{showTangents=!showTangents;renderCatalog();};$('finishTrack').onclick=()=>toggleTrackEditing(false);
   $('knotHeight').disabled=!chosenKnot;$('knotHeight').onpointerdown=()=>{if(chosenKnot)preGesture=snapshot();};$('knotHeight').oninput=e=>{if(!chosenKnot)return;let p=getKnotPosition(chosenKnot).slice();p[1]=Number(e.target.value);if(!preGesture)preGesture=snapshot();if(chosenKnot.handle)trackDesign[chosenKnot.route][chosenKnot.index][chosenKnot.point]=p;else moveTrackKnot(chosenKnot,p);};$('knotHeight').onchange=()=>{if(!chosenKnot)return;pushUndo(preGesture||snapshot());preGesture=null;queueWorldRebuild();saveProjectSoon();};
   return;
  }
 }
 if(category==='Landscape'){
  const q=document.createElement('div');q.className='terrain-choice';q.innerHTML='<button id="terrainValley" class="'+(!flatTerrain?'chosen':'')+'">Mountain valley</button><button id="terrainMeadow" class="'+(flatTerrain?'chosen':'')+'">Open meadow</button>';root.append(q);
  $('terrainValley').onclick=()=>{if(!flatTerrain)return;pushUndo();flatTerrain=false;queueWorldRebuild();saveProjectSoon();};$('terrainMeadow').onclick=()=>{if(flatTerrain)return;pushUndo();flatTerrain=true;queueWorldRebuild();saveProjectSoon();};
 }
 for(const a of ASSETS.filter(a=>a.cat===category)){
  const btn=document.createElement('button');btn.className='asset-card'+(draft?.type===a.id?' chosen':'');btn.setAttribute('aria-label','Place '+a.name.toLowerCase());btn.title=a.desc;
  const im=document.createElement('img');im.src=thumb(a.id);im.alt='';const plus=document.createElement('span');plus.className='asset-plus';plus.textContent='+';const label=document.createElement('span');label.className='asset-label';label.textContent=a.name;btn.append(im,plus,label);btn.onclick=()=>armAsset(a.id);root.append(btn);
 }
}
function enterBuild(on=true){
 if(rebuilding)return;
 building=on;document.body.classList.toggle('building',on);$('builderUI').hidden=!on;$('buildMode').classList.toggle('selected',on);$('operateMode').classList.toggle('selected',!on);$('trainInspector').hidden=true;$('projectMenu').hidden=true;$('ambiencePanel').hidden=true;$('layoutPanel').hidden=true;document.body.classList.remove('train-focus');
 if(on){if(!paused)togglePause();setView('overview',false);fitBuild();renderCatalog();refreshInspector(true);rebuildGrid();}
 else{cancelAction();selectedId=null;trackEditing=false;chosenKnot=null;setView('room',false);if(paused)togglePause();saveProjectSoon();overlayClear();}
}
function fitBuild(plan=false){
 viewMode='overview';const portrait=innerWidth<821;orbit.pitch=plan?1.43:portrait?1.05:.99;orbit.yaw=plan?0:portrait?.12:.14;orbit.distance=portrait?173:108;orbit.target=[0,1,0];
 $('buildPlan').classList.toggle('chosen',plan);$('build3d').classList.toggle('chosen',!plan);
}
function armAsset(type,copy=null){
 trackEditing=false;chosenKnot=null;selectedId=null;
 draft=copy?{...clone(copy),id:'o'+(++objectSerial)}:{id:'o'+(++objectSerial),type,x:0,z:0,angle:0,scale:1,seed:Math.floor(Math.random()*900000),params:null,yoff:0};ghost=null;
 $('selectTool').classList.remove('chosen');$('editTrack').classList.remove('chosen');refreshInspector(true);renderCatalog();
}
function cancelAction(){if(gesture?.kind==='move'&&preGesture){objects=clone(preGesture.objects);shadowDirty=true;}if(gesture?.kind==='knot'&&preGesture)trackDesign=clone(preGesture.tracks);editPointers.clear();draft=null;ghost=null;gesture=null;preGesture=null;$('worldTip').hidden=true;oldInspector='';$('selectTool').classList.add('chosen');renderCatalog();refreshInspector(true);}
function toggleTrackEditing(on){
 if(!building)enterBuild(true);draft=null;ghost=null;selectedId=null;trackEditing=on;chosenKnot=null;category='Railway';$('editTrack').classList.toggle('chosen',on);$('selectTool').classList.toggle('chosen',!on);renderCatalog();refreshInspector(true);
}
function getSelected(){return objects.find(o=>o.id===selectedId)||null;}
function selectObject(id){selectedId=id;draft=null;ghost=null;trackEditing=false;$('editTrack').classList.remove('chosen');$('selectTool').classList.add('chosen');refreshInspector(true);}
function refreshInspector(force=false){
 const o=getSelected(),key=[building,o?.id,draft?.type,trackEditing,chosenKnot?.index,chosenKnot?.route].join('|');if(!force&&key===oldInspector)return;oldInspector=key;
 let title='Lay a little possibility.',description='Choose a piece. Place it on the table. Make it yours.',overline='THE WORKBENCH';
 if(draft){const a=assetById[draft.type];title=a.name;description='Tap an open spot to place. R turns the piece. Keep placing or choose Select.';overline='READY TO PLACE';}
 else if(o){title=assetById[o.type].name;description=o.type==='hill'?'Drag to reposition. Increase Size to widen the terrain.':'Drag to move. Fine-tune, duplicate, or remove this piece.';overline='YOUR '+(o.type==='hill'?'LANDSCAPE':'SCENERY');}
 else if(trackEditing){title=chosenKnot?'Shape the curve.':'A railway that follows your hand.';description=chosenKnot?'Drag the node or adjust its height. Attached rails stay joined.':'Gold circles move connected sections. Select a line in the tray.';overline='THE RUNNING LINE';}
 $('inspectorTitle').textContent=title;$('inspectorDescription').textContent=description+(o?.credits?.length?' Made by '+communityCreditLine(o.credits)+'.':'');$('inspectorOverline').textContent=overline;$('objectControls').hidden=!o;$('placementControls').hidden=!draft;
 document.body.classList.toggle('no-selection',!o&&!draft&&!trackEditing);
 if(o){$('objectAngle').value=Math.round((o.angle*180/PI+360)%360);$('objectScale').value=o.scale.toFixed(1);}
 updateUndo();
}
function mutateSelected(fn,needsTerrain=false){const o=getSelected();if(!o)return;pushUndo();fn(o);if(needsTerrain||o.type==='hill')queueWorldRebuild();else updateSceneryObject(o);saveProjectSoon();refreshInspector(true);}
function rotateSelection(step=PI/12){
 if(draft){draft.angle=(draft.angle+step+TAU)%TAU;if(ghost)ghost.angle=draft.angle;return;}
 mutateSelected(o=>{o.angle=(o.angle+step+TAU)%TAU;});
}
function removeSelected(){const o=getSelected();if(!o)return;pushUndo();objects=objects.filter(q=>q.id!==o.id);selectedId=null;if(o.type==='hill')queueWorldRebuild();else rebuildScenery();saveProjectSoon();refreshInspector(true);}
function duplicateSelected(){const o=getSelected();if(!o)return;armAsset(o.type,o);toast('Place the copy wherever it belongs.');}
function screenRay(x,y){
 const f=norm(sub(cameraTarget,cameraPos)),r=norm(cross(f,[0,1,0])),u=cross(r,f);const nx=(x/innerWidth*2-1+cameraProjection[8])/cameraProjection[0],ny=(1-y/innerHeight*2+cameraProjection[9])/cameraProjection[5];return{origin:cameraPos.slice(),dir:norm(add(f,add(mul(r,nx),mul(u,ny))))};
}
function groundAtScreen(x,y){
 const r=screenRay(x,y);if(r.dir[1]>=-.01)return null;
 let lo=Math.max(0,(r.origin[1]-25)/-r.dir[1]),hi=(r.origin[1]+.5)/-r.dir[1];if(hi<0)return null;
 for(let i=0;i<19;i++){let t=(lo+hi)*.5,p=add(r.origin,mul(r.dir,t));if(p[1]>terrainH(p[0],p[2]))lo=t;else hi=t;}
 const p=add(r.origin,mul(r.dir,(lo+hi)*.5));if(Math.abs(p[0])>54.7||Math.abs(p[2])>34.5)return null;return p;
}
function rayBox(ray,o){
 if(o.type==='hill')return Infinity;
 const c=Math.cos(o.angle),s=Math.sin(o.angle),delta=sub(ray.origin,[o.x,objectY(o),o.z]),local=p=>[(p[0]*c-p[2]*s)/o.scale,p[1]/o.scale,(p[0]*s+p[2]*c)/o.scale];
 const p=local(delta),d=local(ray.dir),t=getTemplate(o);let near=-Infinity,far=Infinity;
 for(let i=0;i<3;i++){if(Math.abs(d[i])<1e-9){if(p[i]<t.min[i]||p[i]>t.max[i])return Infinity;continue;}let a=(t.min[i]-p[i])/d[i],b=(t.max[i]-p[i])/d[i];if(a>b)[a,b]=[b,a];near=Math.max(near,a);far=Math.min(far,b);if(near>far)return Infinity;}
 return near>0?near:far>0?far:Infinity;
}
function pickObject(x,y){let ray=screenRay(x,y),best=Infinity,id=null;for(const o of objects){let t=rayBox(ray,o);if(t<best){best=t;id=o.id;}}if(id)return id;const g=groundAtScreen(x,y);if(g)for(const o of objects)if(o.type==='hill'&&Math.hypot(g[0]-o.x,g[2]-o.z)<o.scale*3)return o.id;return null;}
function placementCheck(o){
 const a=assetById[o.type],w=(o.params?.w||a.w)*o.scale,d=(o.params?.d||a.d)*o.scale;
 if(Math.abs(o.x)+w*.5>54.4||Math.abs(o.z)+d*.5>34.1)return{ok:false,reason:'Keep the piece on the layout.'};
 if(o.type==='hill')return{ok:true};
 const near=nearestTrack(o.x,o.z),right=[Math.cos(o.angle),0,-Math.sin(o.angle)],forward=[Math.sin(o.angle),0,Math.cos(o.angle)],tn=norm([near.f?.[2]||1,0,-(near.f?.[0]||0)]),extent=Math.abs(dot(right,tn))*w*.5+Math.abs(dot(forward,tn))*d*.5;
 if(near.dist<extent+.67&&near.p[1]<objectY(o)+a.h*o.scale+.4)return{ok:false,reason:'Give the train a little more clearance.'};
 const rd=Math.abs(o.x-riverX(o.z))-riverWidth(o.z);if(rd<Math.min(w,d)*.30)return{ok:false,reason:'Choose a dry spot beside the water.'};
 return{ok:true};
}
function positionDraft(x,y){
 const g=groundAtScreen(x,y);if(!g){ghost=null;$('worldTip').hidden=true;return;}
 ghost={...clone(draft),x:snapEnabled?Math.round(g[0]*2)/2:g[0],z:snapEnabled?Math.round(g[2]*2)/2:g[2]};ghostCheck=placementCheck(ghost);showTip(x,y,ghostCheck.ok?'Place '+assetById[ghost.type].name.toLowerCase():ghostCheck.reason,!ghostCheck.ok);
}
function commitPlacement(x,y){
 if(!draft)return;positionDraft(x,y);if(!ghost||!ghostCheck.ok){if(ghostCheck.reason)toast(ghostCheck.reason);return;}
 if(objects.length>=2400){toast('The layout is full: remove a piece before placing another.');return;}
 pushUndo();const o=clone(ghost);o.id='o'+(++objectSerial);objects.push(o);if(o.type==='hill')queueWorldRebuild();else rebuildScenery();draft.seed=Math.floor(Math.random()*900000);saveProjectSoon();
 if(navigator.vibrate)navigator.vibrate(9);$('saveState').textContent='Placed '+assetById[o.type].name.toLowerCase();
}
function showTip(x,y,text,invalid=false){$('worldTip').hidden=false;$('worldTip').textContent=text;$('worldTip').classList.toggle('invalid',invalid);$('worldTip').style.left=clamp(x+17,8,innerWidth-265)+'px';$('worldTip').style.top=clamp(y+20,8,innerHeight-55)+'px';}
function rebuildGrid(){
 disposeMesh(gridMesh);const b=new Builder();
 for(let x=-32;x<=32;x+=2)for(let z=-20;z<20;z+=.75){let c=x%10===0?'#bbc6a0':'#89986e',w=x%10===0?.018:.010;let y1=terrainH(x,z)+.023,y2=terrainH(x,z+.75)+.023;b.quad([x-w,y1,z],[x-w,y2,z+.75],[x+w,y2,z+.75],[x+w,y1,z],c,0);}
 for(let z=-20;z<=20;z+=2)for(let x=-32;x<32;x+=.75){let c=z%10===0?'#bbc6a0':'#89986e',w=z%10===0?.018:.010;let y1=terrainH(x,z)+.023,y2=terrainH(x+.75,z)+.023;b.quad([x,y1,z-w],[x,y1,z+w],[x+.75,y2,z+w],[x+.75,y2,z-w],c,0);}
 gridMesh=b.mesh();
}
function drawWorkshop(p=mainProgram,shadow=false){
 drawScenery(p);draw(setDetailMesh,I,p);
 if(!shadow&&gesture?.kind==='move')renderObject(getSelected(),p);
 if(!building||shadow)return;
 if(gridVisible)draw(gridMesh,I,p);
 if(ghost){uf(p,'uPreview',1);uf(p,'uInvalid',ghostCheck.ok?0:1);if(ghost.type==='hill')draw(getTemplate(ghost).mesh,objectMatrix(ghost),p);else renderObject(ghost,p);uf(p,'uPreview',0);}
}
function overlayClear(){ectx.clearRect(0,0,overlay.width,overlay.height);}
let editorOverlayWasActive=false;
function updateEditorOverlay(){
 const width=Math.round(innerWidth*devicePixelRatio),height=Math.round(innerHeight*devicePixelRatio),resized=overlay.width!==width||overlay.height!==height;
 if(resized){overlay.width=width;overlay.height=height;overlay.style.width=innerWidth+'px';overlay.style.height=innerHeight+'px';}
 if(!building&&!editorOverlayWasActive&&!resized)return;
 editorOverlayWasActive=building;
 ectx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);ectx.clearRect(0,0,innerWidth,innerHeight);if(!building)return;
 if(trackEditing)drawTrackOverlay();
 const o=ghost||getSelected();if(!o)return;
 const a=assetById[o.type],c=Math.cos(o.angle),s=Math.sin(o.angle),w=(o.params?.w||a.w)*o.scale*.54,d=(o.params?.d||a.d)*o.scale*.54;
 const pts=[[-w,-d],[-w,d],[w,d],[w,-d]].map(([x,z])=>{const xx=o.x+x*c+z*s,zz=o.z-x*s+z*c;return project([xx,terrainH(xx,zz)+.09,zz]);});
 ectx.strokeStyle=ghost&&!ghostCheck.ok?'#d98968':'#f3dda7';ectx.lineWidth=1.8;ectx.shadowColor='#122b2860';ectx.shadowBlur=4;ectx.setLineDash(ghost?[5,4]:[]);ectx.beginPath();pts.forEach((p,i)=>i?ectx.lineTo(p.x,p.y):ectx.moveTo(p.x,p.y));ectx.closePath();ectx.stroke();ectx.setLineDash([]);ectx.shadowBlur=0;
 for(const p of pts){ectx.beginPath();ectx.arc(p.x,p.y,2.3,0,TAU);ectx.fillStyle='#f7e8bb';ectx.fill();}
 const top=project([o.x,objectY(o)+a.h*o.scale+.3,o.z]);if(top.visible&&!ghost){ectx.font='10px -apple-system,Arial';const text=a.name,ww=ectx.measureText(text).width+20;ectx.fillStyle='#f2eddbe8';ectx.beginPath();ectx.roundRect(top.x-ww/2,top.y-12,ww,23,7);ectx.fill();ectx.fillStyle='#3d6048';ectx.textAlign='center';ectx.textBaseline='middle';ectx.fillText(text,top.x,top.y);}
}
function allKnots(route=editRoute){const curves=trackDesign[route],out=curves.map((c,i)=>({route,index:i,point:0}));out.push({route,index:curves.length-1,point:3});return out;}
function getKnotPosition(k){return trackDesign[k.route][k.index][k.point];}
function knotReferences(k){
 const p=getKnotPosition(k),refs=[];for(let [name,curves]of Object.entries(trackDesign))for(let i=0;i<curves.length;i++)for(let j of[0,3])if(len(sub(curves[i][j],p))<.001)refs.push({route:name,index:i,point:j});return refs;
}
function moveTrackKnot(k,p){
 const old=getKnotPosition(k).slice(),delta=sub(p,old),refs=knotReferences(k);
 for(const ref of refs){const curve=trackDesign[ref.route][ref.index],j=ref.point,handle=j===0?1:2;curve[j]=p.slice();curve[handle]=add(curve[handle],delta);}
}
function pickKnot(x,y){
 let best=innerWidth<821?24:16,result=null;
 for(const k of allKnots()){const p=project(getKnotPosition(k));let d=Math.hypot(p.x-x,p.y-y);if(d<best){best=d;result=k;}}
 if(showTangents)for(let i=0;i<trackDesign[editRoute].length;i++)for(let j of[1,2]){const p=project(trackDesign[editRoute][i][j]),d=Math.hypot(p.x-x,p.y-y);if(d<best){best=d;result={route:editRoute,index:i,point:j,handle:true};}}
 return result;
}
function bezierAt(c,t){const u=1-t;return[0,1,2].map(k=>u*u*u*c[0][k]+3*u*u*t*c[1][k]+3*u*t*t*c[2][k]+t*t*t*c[3][k]);}
function drawTrackOverlay(){
 for(const name of Object.keys(trackDesign)){
  const active=name===editRoute;ectx.strokeStyle=active?'#f1d795':'#f2e4ae50';ectx.lineWidth=active?3:1.4;ectx.shadowColor='#405039';ectx.shadowBlur=active?5:0;
  for(const c of trackDesign[name]){ectx.beginPath();for(let i=0;i<=50;i++){const p=project(add(bezierAt(c,i/50),[0,.11,0]));if(i===0)ectx.moveTo(p.x,p.y);else ectx.lineTo(p.x,p.y);}ectx.stroke();}
 }
 ectx.shadowBlur=0;
 if(showTangents)for(let i=0;i<trackDesign[editRoute].length;i++){
  const c=trackDesign[editRoute][i];ectx.strokeStyle='#f4e8bc80';ectx.lineWidth=1;ectx.setLineDash([3,4]);
  for(let [j,k]of[[0,1],[3,2]]){let p=project(c[j]),q=project(c[k]);ectx.beginPath();ectx.moveTo(p.x,p.y);ectx.lineTo(q.x,q.y);ectx.stroke();ectx.fillStyle='#e4deb0';ectx.fillRect(q.x-3.5,q.y-3.5,7,7);}
  ectx.setLineDash([]);
 }
 for(const k of allKnots()){
  const p=project(getKnotPosition(k));if(!p.visible)continue;let active=chosenKnot&&chosenKnot.route===k.route&&chosenKnot.index===k.index&&chosenKnot.point===k.point;
  ectx.beginPath();ectx.arc(p.x,p.y,active?8.5:6,0,TAU);ectx.fillStyle=active?'#f6d996':'#385940';ectx.fill();ectx.lineWidth=1.8;ectx.strokeStyle='#f3dfaa';ectx.stroke();
  ectx.beginPath();ectx.arc(p.x,p.y,active?2.1:1.6,0,TAU);ectx.fillStyle=active?'#56734d':'#f3dfaa';ectx.fill();
 }
}
function splitTrack(){
 if(rebuilding)return;pushUndo();const curves=trackDesign[editRoute],idx=clamp(chosenKnot?.index??chosenSegment,0,curves.length-1),c=curves[idx];
 const a=lerpV(c[0],c[1],.5),b=lerpV(c[1],c[2],.5),d=lerpV(c[2],c[3],.5),e=lerpV(a,b,.5),f=lerpV(b,d,.5),mid=lerpV(e,f,.5);
 curves.splice(idx,1,[c[0],a,e,mid],[mid.slice(),f,d,c[3]]);chosenKnot={route:editRoute,index:idx+1,point:0};queueWorldRebuild();saveProjectSoon();
}
function removeTrackKnot(){
 if(!chosenKnot||chosenKnot.handle){toast('Choose a gold shaping point first.');return;}
 const k=chosenKnot,curves=trackDesign[k.route],idx=k.point===0?k.index:k.index+1;
 if(idx===0||idx===curves.length||knotReferences(k).some(r=>r.route!==k.route)){toast('Keep the junctions: they connect the running lines.');return;}
 pushUndo();const a=curves[idx-1],b=curves[idx];curves.splice(idx-1,2,[a[0],a[1],b[2],b[3]]);chosenKnot=null;queueWorldRebuild();saveProjectSoon();
}
function editPointerDown(e){
 if(!building)return;e.preventDefault();e.stopImmediatePropagation();if(rebuilding)return;
 $('projectMenu').hidden=true;$('worldTip').hidden=true;canvas.setPointerCapture(e.pointerId);editPointers.set(e.pointerId,[e.clientX,e.clientY]);
 if(editPointers.size===2){
  if(gesture?.kind==='move'&&preGesture){objects=clone(preGesture.objects);rebuildScenery();}else if(gesture?.kind==='knot'&&preGesture)trackDesign=clone(preGesture.tracks);
  const [a,b]=[...editPointers.values()];gesture={kind:'pinch',dist:Math.hypot(a[0]-b[0],a[1]-b[1]),distance:orbit.distance,x:(a[0]+b[0])/2,y:(a[1]+b[1])/2,target:orbit.target.slice()};preGesture=null;return;
 }
 if(editPointers.size>2)return;
 const base={x:e.clientX,y:e.clientY,yaw:orbit.yaw,pitch:orbit.pitch,target:orbit.target.slice(),moved:false};
 if(e.shiftKey||e.button===2||e.button===1){gesture={...base,kind:'orbit',pan:true};return;}
 if(draft){gesture={...base,kind:'place'};positionDraft(e.clientX,e.clientY);return;}
 if(trackEditing){
  const k=pickKnot(e.clientX,e.clientY);if(k){chosenKnot=k;chosenSegment=k.index;preGesture=snapshot();const g=groundAtScreen(e.clientX,e.clientY);gesture={...base,kind:'knot',k,origin:getKnotPosition(k).slice(),ground:g};refreshInspector(true);return;}
 }else{
  const id=pickObject(e.clientX,e.clientY);if(id){selectObject(id);preGesture=snapshot();const o=getSelected(),g=groundAtScreen(e.clientX,e.clientY);gesture={...base,kind:'move',id,origin:clone(o),ground:g};rebuildScenery(id);return;}
 }
 gesture={...base,kind:'orbit',pan:false};
}
function editPointerMove(e){
 if(!building)return;e.stopImmediatePropagation();
 if(!editPointers.has(e.pointerId)){if(draft&&e.pointerType!=='touch')positionDraft(e.clientX,e.clientY);return;}
 editPointers.set(e.pointerId,[e.clientX,e.clientY]);if(!gesture||rebuilding)return;e.preventDefault();
 if(gesture.kind==='pinch'){
  if(editPointers.size<2)return;const [a,b]=[...editPointers.values()],dist=Math.hypot(a[0]-b[0],a[1]-b[1]);orbit.distance=clamp(gesture.distance*gesture.dist/Math.max(5,dist),8,430);const x=(a[0]+b[0])/2,y=(a[1]+b[1])/2;panOrbit(x-gesture.x,y-gesture.y,gesture.target);return;
 }
 const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;if(Math.abs(dx)+Math.abs(dy)>4)gesture.moved=true;
 if(gesture.kind==='place'){positionDraft(e.clientX,e.clientY);return;}
 if(gesture.kind==='orbit'){
  if(gesture.pan)panOrbit(dx,dy,gesture.target);else{orbit.yaw=gesture.yaw-dx*.0048;orbit.pitch=clamp(gesture.pitch+dy*.0036,.21,1.43);}return;
 }
 if(!gesture.moved)return;
 const g=groundAtScreen(e.clientX,e.clientY);if(!g||!gesture.ground)return;
 const x=gesture.origin.x!==undefined?gesture.origin.x+(g[0]-gesture.ground[0]):gesture.origin[0]+(g[0]-gesture.ground[0]);
 const z=gesture.origin.z!==undefined?gesture.origin.z+(g[2]-gesture.ground[2]):gesture.origin[2]+(g[2]-gesture.ground[2]);
 if(gesture.kind==='move'){
  const o=getSelected();o.x=clamp(snapEnabled?Math.round(x*2)/2:x,-54,54);o.z=clamp(snapEnabled?Math.round(z*2)/2:z,-33,33);const check=placementCheck(o);showTip(e.clientX,e.clientY,check.ok?'Release to place':check.reason,!check.ok);
 }else if(gesture.kind==='knot'){
  const p=[clamp(snapEnabled?Math.round(x*2)/2:x,-53,53),gesture.origin[1],clamp(snapEnabled?Math.round(z*2)/2:z,-32,32)];
  if(gesture.k.handle)trackDesign[gesture.k.route][gesture.k.index][gesture.k.point]=p;else moveTrackKnot(gesture.k,p);
 }
}
function panOrbit(dx,dy,target){const s=orbit.distance*.00090,r=[Math.cos(orbit.yaw),0,-Math.sin(orbit.yaw)],f=[Math.sin(orbit.yaw),0,Math.cos(orbit.yaw)];orbit.target=add(target,add(mul(r,-dx*s),mul(f,-dy*s)));}
function editPointerUp(e){
 if(!building)return;e.preventDefault();e.stopImmediatePropagation();if(!editPointers.has(e.pointerId))return;editPointers.delete(e.pointerId);$('worldTip').hidden=true;
 if(gesture?.kind==='pinch'){if(editPointers.size===1){const [p]=[...editPointers.values()];gesture={kind:'orbit',x:p[0],y:p[1],yaw:orbit.yaw,pitch:orbit.pitch,target:orbit.target.slice(),pan:false,moved:true};}else gesture=null;return;}
 const g=gesture;gesture=null;if(!g)return;
 if(g.kind==='place')commitPlacement(e.clientX,e.clientY);
 if(g.kind==='move'){
  const o=getSelected();if(g.moved){const valid=placementCheck(o);if(!valid.ok){Object.assign(o,g.origin);toast(valid.reason);}else{pushUndo(preGesture);saveProjectSoon();}}
  if(o?.type==='hill'&&g.moved)queueWorldRebuild();else updateSceneryObject(o);shadowDirty=true;
 }
 if(g.kind==='knot'){if(g.moved){pushUndo(preGesture);queueWorldRebuild();saveProjectSoon();}renderCatalog();}
 if(g.kind==='orbit'&&!g.moved&&!trackEditing)selectedId=null;
 preGesture=null;refreshInspector(true);
}
function cancelPointer(e){
 if(!building)return;e.stopImmediatePropagation();editPointers.delete(e.pointerId);
 if(gesture?.kind==='move'&&preGesture){objects=clone(preGesture.objects);rebuildScenery();}
 if(gesture?.kind==='knot'&&preGesture)trackDesign=clone(preGesture.tracks);
 gesture=null;preGesture=null;$('worldTip').hidden=true;
}
function bindWorkshop(){
 $('operateMode').onclick=()=>enterBuild(false);$('buildMode').onclick=()=>enterBuild(true);$('runMyRailway').onclick=()=>enterBuild(false);
 $('selectTool').onclick=()=>{trackEditing=false;chosenKnot=null;$('editTrack').classList.remove('chosen');cancelAction();};
 for(let b of document.querySelectorAll('[data-category]'))b.onclick=()=>{category=b.dataset.category;if(category!=='Railway'){trackEditing=false;chosenKnot=null;$('editTrack').classList.remove('chosen');}renderCatalog();refreshInspector(true);};
 $('undoBuild').onclick=undoBuild;$('redoBuild').onclick=redoBuild;
 $('projectMenuBtn').onclick=()=>{$('projectMenu').hidden=!$('projectMenu').hidden;$('projectMenuBtn').setAttribute('aria-expanded',String(!$('projectMenu').hidden));};
 $('exportQuick').onclick=exportProject;$('exportProject').onclick=exportProject;$('exportPlayable').onclick=exportPlayable;$('importProject').onclick=()=>{$('projectMenu').hidden=true;$('projectFile').click();};
 $('projectFile').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>3e6)throw new Error('Choose a layout file smaller than 3 MB.');const data=validateProject(JSON.parse(await file.text()));pushUndo();applySnapshot(data);saveProjectSoon();toast('Your railway is back on the workbench.');}catch(err){toast(err.message||'This file could not be opened.');}e.target.value='';};
 $('meadowProject').onclick=()=>askReset('meadow');$('restoreProject').onclick=()=>askReset('restore');$('confirmCancel').onclick=()=>$('projectConfirm').close();$('confirmDo').onclick=()=>{$('projectConfirm').close();confirmAction?.();confirmAction=null;};
 $('layoutName').onfocus=()=>{preGesture=snapshot();};$('layoutName').onchange=e=>{pushUndo(preGesture||snapshot());layoutTitle=e.target.value.trim()||'Untitled railway';e.target.value=layoutTitle;saveProjectSoon();preGesture=null;};
 $('build3d').onclick=()=>fitBuild(false);$('buildPlan').onclick=()=>fitBuild(true);$('buildFit').onclick=()=>fitBuild($('buildPlan').classList.contains('chosen'));
 $('buildGrid').onclick=()=>{gridVisible=!gridVisible;$('buildGrid').classList.toggle('chosen',gridVisible);};$('buildSnap').onclick=()=>{snapEnabled=!snapEnabled;$('buildSnap').classList.toggle('chosen',snapEnabled);};$('editTrack').onclick=()=>toggleTrackEditing(!trackEditing);
 $('objectAngle').onchange=e=>{const n=Number(e.target.value);if(Number.isFinite(n))mutateSelected(o=>o.angle=clamp(n,-360,360)*PI/180);};$('objectScale').onchange=e=>{const n=Number(e.target.value);if(Number.isFinite(n))mutateSelected(o=>o.scale=clamp(n,.4,2.5));};
 $('rotateObject').onclick=()=>rotateSelection();$('duplicateObject').onclick=duplicateSelected;$('deleteObject').onclick=removeSelected;$('rotateDraft').onclick=()=>rotateSelection();$('cancelDraft').onclick=cancelAction;
 for(let b of document.querySelectorAll('[data-livery]'))b.onclick=()=>{if(livery===b.dataset.livery||rebuilding)return;pushUndo();livery=b.dataset.livery;buildTrains();updateTrainControls();saveProjectSoon();};
 $('coachCount').onpointerdown=()=>{preGesture=snapshot();};$('coachCount').oninput=e=>setCoachOffsets(Number(e.target.value));$('coachCount').onchange=()=>{pushUndo(preGesture||snapshot());preGesture=null;saveProjectSoon();};$('cutawayTrain').onclick=()=>{cutaway=!cutaway;$('cutawayTrain').setAttribute('aria-pressed',String(cutaway));};$('leaveTrainInspector').onclick=()=>setView('room');
 canvas.addEventListener('pointerdown',editPointerDown,true);canvas.addEventListener('pointermove',editPointerMove,true);canvas.addEventListener('pointerup',editPointerUp,true);canvas.addEventListener('pointercancel',cancelPointer,true);
 canvas.addEventListener('wheel',e=>{if(!building)return;e.preventDefault();e.stopImmediatePropagation();orbit.distance=clamp(orbit.distance*Math.exp(clamp(e.deltaY,-160,160)*.0013),8,260);},{capture:true,passive:false});
 canvas.addEventListener('dblclick',e=>{if(building){e.preventDefault();e.stopImmediatePropagation();}},{capture:true});canvas.addEventListener('pointerleave',()=>{if(!gesture){ghost=null;$('worldTip').hidden=true;}});
 document.addEventListener('keydown',e=>{
  if(e.target.matches('input,textarea,select')||$('projectConfirm').open)return;
  if(e.key.toLowerCase()==='b'&&!e.ctrlKey&&!e.metaKey){e.preventDefault();e.stopImmediatePropagation();enterBuild(!building);return;}
  if(!building)return;const k=e.key.toLowerCase();
  if((e.ctrlKey||e.metaKey)&&k==='z'){e.preventDefault();e.stopImmediatePropagation();e.shiftKey?redoBuild():undoBuild();return;}
  if((e.ctrlKey||e.metaKey)&&k==='y'){e.preventDefault();e.stopImmediatePropagation();redoBuild();return;}
  if((e.ctrlKey||e.metaKey)&&k==='s'){e.preventDefault();e.stopImmediatePropagation();exportProject();return;}
  if(e.ctrlKey||e.metaKey||e.altKey)return;e.stopImmediatePropagation();
  if(k==='escape'){trackEditing=false;chosenKnot=null;$('editTrack').classList.remove('chosen');cancelAction();selectedId=null;$('projectMenu').hidden=true;refreshInspector(true);}
  else if(k==='r'||k==='e')rotateSelection(e.shiftKey?-PI/12:PI/12);else if(k==='q')rotateSelection(-PI/12);
  else if(k==='d')duplicateSelected();else if(k==='delete'||k==='backspace'){e.preventDefault();removeSelected();}
  else if(k==='v'){trackEditing=false;cancelAction();}else if(k===' '){e.preventDefault();enterBuild(false);}
  else if(['arrowleft','arrowright','arrowup','arrowdown'].includes(k)){e.preventDefault();mutateSelected(o=>{o.x+=k==='arrowleft'?-.5:k==='arrowright'?.5:0;o.z+=k==='arrowup'?-.5:k==='arrowdown'?.5:0;o.x=clamp(o.x,-54,54);o.z=clamp(o.z,-33,33);});}
 },true);
}
// Bump this version when factory placements, tracks, stock/services or seeded
// generation changes. Only a validated pristine snapshot can skip factory capture;
// the cache contains editable layout data, never GPU meshes or generated artwork.
const WORKSHOP_FACTORY_CACHE_VERSION='grand-v2-factory-2-community',WORKSHOP_FACTORY_CACHE_KEY='whistlevale-factory-snapshot';
let workshopStartup=null;
function workshopFactoryChecksum(text){let hash=2166136261;for(let i=0;i<text.length;i++)hash=Math.imul(hash^text.charCodeAt(i),16777619);return(hash>>>0).toString(16);}
function readWorkshopStartupLayout(){
 try{
  const embedded=JSON.parse($('embeddedLayout').textContent||'null');
  const saved=embedded||JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
  return saved?validateProject(saved):null;
 }catch(error){console.warn('Stored layout was not loaded:',error.message);return null;}
}
function validateWorkshopFactory(value){
 validateProject(value);
 if(value.division!=='grand-v2'||value.flat!==false||value.livery!=='green'||value.coaches!==6||value.name!=='Alder Valley Grand Division'||!value.objects.length||value.services?.freight!==true||value.services?.mountain!==true||JSON.stringify(value.tracks)!==JSON.stringify(divisionDesign()))throw new Error('The cached layout is not the current factory railway.');
 return value;
}
function cacheWorkshopFactory(){
 try{
  validateWorkshopFactory(factorySnapshot);const text=JSON.stringify(factorySnapshot);
  localStorage.setItem(WORKSHOP_FACTORY_CACHE_KEY,JSON.stringify({version:WORKSHOP_FACTORY_CACHE_VERSION,checksum:workshopFactoryChecksum(text),snapshot:factorySnapshot}));
 }catch{} // Storage is optional; an uncached visit follows the original build path.
}
function prepareWorkshopStartup(){
 const saved=readWorkshopStartupLayout();workshopStartup={saved,preloaded:false};
 if(!saved)return;
 let factory;
 try{
  const cached=JSON.parse(localStorage.getItem(WORKSHOP_FACTORY_CACHE_KEY)||'null');
  if(cached?.version!==WORKSHOP_FACTORY_CACHE_VERSION||cached.checksum!==workshopFactoryChecksum(JSON.stringify(cached.snapshot)))return;
  factory=clone(validateWorkshopFactory(cached.snapshot));
 }catch{return;}
 // Keep capture disabled exactly as it was for the old second (saved-world)
 // build. buildWorld resets/restores its own seed, so skipped factory geometry
 // cannot change the saved world's procedural sequence or the room shell.
 applySnapshot(saved,true);factorySnapshot=factory;captureScenery=false;workshopStartup.preloaded=true;
}
function initializeWorkshop(){
 captureScenery=false;
 if(!workshopStartup?.preloaded){
  setCoachOffsets(6);factorySnapshot=snapshot();cacheWorkshopFactory();
  const saved=workshopStartup?workshopStartup.saved:readWorkshopStartupLayout();
  if(saved){applySnapshot(saved,true);for(let m of[staticMesh,groundMesh,waterMesh,signalGreenMesh,signalRedMesh,crossingMesh])disposeMesh(m);buildWorld();}
 }
 workshopStartup=null;
 rebuildScenery();buildSetDetails();rebuildGrid();bindWorkshop();updateTrainControls();updateUndo();
 window.WORKSHOP={get state(){return{building,selectedId,placing:draft?.type,objects:objects.length,name:layoutTitle,trackEditing,undo:undoStack.length,redo:redoStack.length,rebuilding,livery,coaches:offsets.length-2};},enter:enterBuild,snapshot,validate:validateProject,select:selectObject,arm:armAsset,undo:undoBuild,redo:redoBuild,editTrack:toggleTrackEditing,split:splitTrack,project:project,screenToGround:groundAtScreen,check:placementCheck,save:exportProject,exportHTML:exportPlayable,selectKnot:k=>{chosenKnot=k;editRoute=k.route;renderCatalog();},add:(type,x,z)=>{pushUndo();const o=registerObject(type,x,z);rebuildScenery();saveProjectSoon();return o.id;},remove:removeSelected,rebuild:queueWorldRebuild,load:s=>{const v=validateProject(s);pushUndo();applySnapshot(v);saveProjectSoon();}};
}
// Find a clear collector's view rather than parking the lens inside scenery.
let engineCamChoice=null,engineCamCheck=-Infinity;
function engineInspectionView(){
 if(!engineCamChoice||roomClock-engineCamCheck>.75){
  const aim=transform([0,.95,-.35],trainModels[0]),near=objects.filter(o=>Math.hypot(o.x-aim[0],o.z-aim[2])<15&&o.type!=='hill');
  let best=Infinity;const candidates=[[-5.3,3.25,6.3],[-6.7,4.5,5.5],[-5.5,5.8,6.5],[5.3,3.25,6.3],[6.7,4.5,5.5],[5.5,5.8,6.5],[-6.8,4.5,1.8],[6.8,4.5,1.8],[-6.2,7,6.2],[6.2,7,6.2]];
  for(let i=0;i<candidates.length;i++){
   let cp=transform(candidates[i],trainModels[0]),score=i*.12;
   for(const target of[[0,.95,-.35],[0,1.1,1.1],[0,.55,-1.2]]){let end=transform(target,trainModels[0]),delta=sub(end,cp),distance=len(delta),ray={origin:cp,dir:norm(delta)};
    for(let o of near)if(rayBox(ray,o)<distance-.12)score+=8;
    for(let t of[.1,.25,.45,.65,.8]){let p=lerpV(cp,end,t);if(p[1]<terrainH(p[0],p[2])+.2)score+=12;}
   }
   if(score<best){best=score;engineCamChoice=candidates[i];}if(score===0)break;
  }
  engineCamCheck=roomClock;
 }
 return transform(innerWidth<700?mul(engineCamChoice,1.35):engineCamChoice,trainModels[0]);
}
// Station calls follow the platform that the builder actually placed.
let stationMarkerCache=null;
function stationMarkers(){
 if(stationMarkerCache)return stationMarkerCache;
 const markers=[];
 for(const station of objects.filter(o=>o.type==='station')){
  const anchor=transform([4.5,0,2.5],objectMatrix(station));let best=null;
  for(const edge of[common,highline,lowline])for(let d=0;d<edge.length;d+=.12){const p=edge.at(d).p,dist=Math.hypot(p[0]-anchor[0],p[2]-anchor[2]);if(!best||dist<best.dist)best={edge,d,dist};}
  if(best&&best.dist<5*station.scale)markers.push(best);
 }
 return stationMarkerCache=markers;
}
function distanceToStation(){
 const markers=stationMarkers();if(!markers.length)return Infinity;
 let current=where(travel),edge=current.edge,from=current.d,covered=0;
 for(let i=0;i<6;i++){
  const ahead=markers.filter(m=>m.edge===edge&&m.d>=from-.04).sort((a,b)=>a.d-b.d);
  if(ahead.length)return Math.max(0,covered+ahead[0].d-from);
  covered+=edge.length-from;edge=edge===common?(chosenRoute==='highline'?highline:lowline):common;from=0;
 }
 return Infinity;
}
function toggleStop(){if(!stopRequested&&!atStation&&!stationMarkers().length){toast('Place a station beside a running line to make a platform call.');return;}baseToggleStop();}



// ============================================================================
// ALDER VALLEY : GRAND DIVISION
// A larger, editable network. Scene dimensions change; rolling-stock gauge does
// not. Independent circuits have their own arc-length clocks and never teleport.
// ============================================================================
const BOARD={w:110,d:70,minX:-54.6,maxX:54.6,minZ:-34.5,maxZ:34.5};
const DIVISION_NAMES={common:'Alder Vale main line',highline:'Grand stone viaduct',lowline:'River cut-off',freight:'Independent freight circuit',mountain:'Summit mountain circuit',yard:'Goods-yard lead',siding1:'Arrival road',siding2:'Coal road',siding3:'Timber road',siding4:'Warehouse road',siding5:'Engine servicing',depot:'Roundhouse approach'};
let divisionEdges={},tunnelRanges=[],freightDistance=49,mountainDistance=31,freightRunning=true,mountainRunning=true,turntableAngle=0,turntableTarget=0,turntableDeck=null,boxcarMesh=null,tankerMesh=null,brakevanMesh=null,railcarMesh=null,railcarTrailer=null,divisionDetailMesh=null;
let turntableBay=-1;
function indexTurntable(){turntableBay=(turntableBay+1)%7;turntableTarget=turntableBay===6?TAU:PI+(turntableBay-2.5)*.28;turntableTarget+=Math.floor(turntableAngle/TAU)*TAU;if(turntableTarget<turntableAngle-.04)turntableTarget+=TAU;}
let divisionSceneReady=false,activeDistrict='grand',waterfallMesh=null;
const roomScale=scaling(1.67,1,1.66);
function lineCurve(a,b){return[a,lerpV(a,b,1/3),lerpV(a,b,2/3),b];}
function splineCurves(points,closed=false,tension=.8){const out=[],n=points.length;for(let i=0;i<(closed?n:n-1);i++){const a=points[i],b=points[(i+1)%n],prev=points[(i-1+n)%n],next=points[(i+2)%n];const start=!closed&&i===0?sub(b,a):mul(sub(b,prev),.5),end=!closed&&i===n-2?sub(b,a):mul(sub(next,a),.5);out.push([a.slice(),add(a,mul(start,tension/3)),sub(b,mul(end,tension/3)),b.slice()]);}return out;}
function divisionDesign(){
 const B=P(-24,-16),A=P(13,26);
 const common=[
 [B,P(-32,-16),P(-43,-17),P(-48,-7)],
 [P(-48,-7),P(-52,3),P(-48,17),P(-40,23)],
 [P(-40,23),P(-37,25.5),P(-34,26),P(-29,26)],
 lineCurve(P(-29,26),P(-8,26)),lineCurve(P(-8,26),A)
 ];
 const highline=[
 [A,P(25,26),P(39,27),P(46,19,2.0)],
 [P(46,19,2),P(53,12,2.9),P(51,-1,5.0),P(45,-11,6.5)],
 [P(45,-11,6.5),P(42,-17,7.2),P(34,-20,7.5),P(27,-20,7.5)],
 [P(27,-20,7.5),P(17,-20,7.5),P(7,-20,7.5),P(-3,-20,7.5)],
 [P(-3,-20,7.5),P(-12,-20,7.5),P(-18,-21,3),P(-21,-18,1.55)],
 [P(-21,-18,1.55),P(-22,-17,1.25),P(-23,-16),B]
 ];
 const lowline=[
 [A,P(17,26),P(23,18),P(23,12)],
 [P(23,12),P(23,3),P(26,-7),P(15,-11)],
 [P(15,-11),P(5,-14),P(-10,-14),B]
 ];
 const fpts=[P(-35,23),P(-12,23),P(14,23),P(33,23),P(43,17),P(44,-3),P(33,-12),P(16,-13),P(-8,-13),P(-27,-13),P(-43,-4),P(-45,10)];
 const freight=splineCurves(fpts,true,.77);
 // Front tangent is straight; the yard shares its exact junction coordinate.
 const yard=[[P(14,23),P(19,23),P(20,19),P(25,19)]];let lastYard=25;for(const x of [27.5,30,32.5,35,44]){yard.push(lineCurve(P(lastYard,19),P(x,19)));lastYard=x;}
 const design={common,highline,lowline,freight,mountain:splineCurves([P(35,-28,10.7),P(10,-30,11.8),P(-15,-30,13.0),P(-34,-28,13.2),P(-42,-22,10.3),P(-32,-21.8,8.7),P(-13,-25,9.3),P(10,-26,9.7),P(32,-24,10.1),P(43,-22,10.5)],true,.6),yard};
 for(let i=1;i<=5;i++){const x=25+(i-1)*2.5,z=19-i*1.65;design['siding'+i]=[[P(x,19),P(x+3.2,19),P(x+3,z),P(x+6.1,z)],lineCurve(P(x+6.1,z),P(44,z))];}
 design.depot=[ [P(41.1,10.75),P(38,10.75),P(37,6.5),P(37,4.0)] ];
 return design;
}
function initTracks(){
 if(!baseDesign)baseDesign=divisionDesign();if(!trackDesign)trackDesign=clone(baseDesign);
 divisionEdges=Object.fromEntries(Object.entries(trackDesign).map(([k,c])=>[k,new Edge(k,c)]));
 common=divisionEdges.common;highline=divisionEdges.highline;lowline=divisionEdges.lowline;yard=divisionEdges.yard;edges=Object.values(divisionEdges);trackGrid.clear();
 for(const edge of edges)for(let d=0;d<=edge.length;d+=.38){const a=edge.at(d),key=`${Math.floor(a.p[0]/2)},${Math.floor(a.p[2]/2)}`;if(!trackGrid.has(key))trackGrid.set(key,[]);trackGrid.get(key).push(a);}
 tunnelRanges=[];
 for(const edge of [common,highline,lowline,divisionEdges.freight,divisionEdges.mountain].filter(Boolean)){
  let start=null;
  for(let d=0;d<=edge.length+.5;d+=.4){const a=edge.at(d),buried=d<edge.length&&naturalH(a.p[0],a.p[2])>a.p[1]+2.45;
   if(buried&&start===null)start=d;
   if(!buried&&start!==null){if(d-start>2.2)tunnelRanges.push({edge,start:Math.max(0,start-.6),end:Math.min(edge.length,d+.6)});start=null;}
  }
 }
 const primary=tunnelRanges.find(t=>t.edge===common);tunnelStart=primary?.start??Infinity;tunnelEnd=primary?.end??-Infinity;
}
function inTunnel(edge,d,pad=0){return tunnelRanges.some(r=>r.edge===edge&&d>r.start-pad&&d<r.end+pad);}
function riverX(z){return 7.2+2.1*Math.sin((z+7)*.11)+.5*Math.sin(z*.29);}
function riverWidth(z){return 1.05+6.0*Math.exp(-Math.pow((z+.4)/10.8,2))+.30*Math.cos(z*.16);}
function baseNaturalH(x,z){
 const peak=(cx,cz,sx,sz,h)=>h*Math.exp(-Math.pow((x-cx)/sx,2)-Math.pow((z-cz)/sz,2));
 let mountain=peak(-32,-28,12.2,6.1,16.2)+peak(-45,-16,7,8,9.2)+peak(41,-27,9.5,7.1,15.3)+peak(-7,-33,13,4,8.5)+peak(23,-30,5.5,4.7,5.3)+peak(49,-6,4,10,3.6);
 mountain*=.80+.31*fbm(x*.34,z*.34)+.12*noise(x*1.04,z*.78);
 const valley=.65+(fbm(x*.27,z*.27)-.5)*.22;
 return valley+mountain;
}
// The original collector's railway has an English patchwork of small fields.
// These footprints colour the existing terrain; the track and hill geometry,
// editor stamps, tunnel ranges, and saved object positions stay authoritative.
const valleyFields=[
 {id:'west-paddock',kind:'pasture',a:'#5a7843',b:'#7f9256',points:[[-52.5,25.2],[-46,23.5],[-38,26.9],[-36.5,32.8],[-50.8,33.6]]},
 {id:'station-meadow',kind:'pasture',a:'#587641',b:'#7e9254',points:[[-35.5,28.2],[-22.3,28.3],[-21.4,33.8],[-35.2,33.8]]},
 {id:'riverside-meadow',kind:'pasture',a:'#53723f',b:'#7b9152',points:[[-20.2,28.1],[-7.8,28.1],[-4.1,33.8],[-20.7,33.8]]},
 {id:'east-meadow',kind:'pasture',a:'#617e46',b:'#8b995c',points:[[16.5,28.8],[26,28.6],[35.7,28],[39,32.7],[29,34],[17.8,33.7]]},
 {id:'orchard-pasture',kind:'pasture',a:'#507440',b:'#819456',points:[[40.5,24.5],[48.8,22],[53,28.6],[51.3,33.6],[41.8,33.7]]},
 {id:'mill-paddock',kind:'pasture',a:'#728948',b:'#9da563',points:[[-45.1,-.6],[-40.3,-1.1],[-38.8,7.7],[-42.0,12],[-46,9.2]]}
];
for(const f of valleyFields){f.minX=Math.min(...f.points.map(p=>p[0]));f.maxX=Math.max(...f.points.map(p=>p[0]));f.minZ=Math.min(...f.points.map(p=>p[1]));f.maxZ=Math.max(...f.points.map(p=>p[1]));}
function valleyFieldAt(x,z){
 if(flatTerrain)return null;
 for(const f of valleyFields){if(x<f.minX||x>f.maxX||z<f.minZ||z>f.maxZ)continue;let inside=false;for(let i=0,j=f.points.length-1;i<f.points.length;j=i++){const a=f.points[i],b=f.points[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside;}if(inside)return f;}
 return null;
}
function terrainH(x,z){
 let h=naturalH(x,z),rd=Math.abs(x-riverX(z))-riverWidth(z);
 if(rd<1.8&&z>-19)h=mix(-.38,h,smooth(-.4,1.8,rd));
 const t=nearestTrack(x,z);
 if(t.edge&&t.dist<1.65&&!inTunnel(t.edge,t.d,1.1)){
  const viaductArea=t.edge===highline&&t.p[1]>4.5&&t.p[2]<-15&&t.p[0]>-18&&t.p[0]<35;
  const trestleArea=t.edge===divisionEdges.mountain&&t.p[0]>-24&&t.p[0]<-4&&t.p[2]<-27;
  const overWater=rd<.7&&z>-19;
  if(!viaductArea&&!trestleArea&&!overWater)h=mix(h,t.p[1]-.23,1-smooth(.66,1.65,t.dist));
 }
 return h;
}
function createGroundUncached(){
 let b=new Builder();b.box(0,FLOOR-.18,1,330,.3,300,'#88704b',21);disposeMesh(groundMesh);groundMesh=b.mesh();b=new Builder();
 slab(b,112.5,72.5,1.28,-1.05,3.3,'#59422f',22);slab(b,112.7,72.7,.11,-.395,3.4,'#ad8855',22);slab(b,112.1,72.1,.14,-1.74,3.2,'#342e23',22);slab(b,112.25,72.25,.035,-1.55,3.2,'#c8a873',41);
 const outline=roundRect(110,70,2.6,18);for(let i=0;i<outline.length;i++){const p=outline[i],q=outline[(i+1)%outline.length];b.quad([p[0],-.33,p[1]],[q[0],-.33,q[1]],[q[0],terrainH(...q),q[1]],[p[0],terrainH(...p),p[1]],'#7d7051',4);}
 b.box(-13,-.94,36.37,15,.72,.045,'#b7a071',41);sign(b,'table',-13,-.93,36.403,14.6,.66);
 const nx=244,nz=158,positions=[],normals=[],colors=[];
 for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
  let x=-54.9+i*109.8/nx,z=-34.9+j*69.8/nz;const ax=Math.abs(x),az=Math.abs(z);if(ax>52.3&&az>32.3){const a=ax-52.3,c=az-32.3,l=Math.hypot(a,c);if(l>2.6){x=Math.sign(x)*(52.3+a/l*2.6);z=Math.sign(z)*(32.3+c/l*2.6);}}
  const y=terrainH(x,z),n=norm([terrainH(x-.16,z)-terrainH(x+.16,z),.32,terrainH(x,z-.16)-terrainH(x,z+.16)]),v=fbm(x*.63,z*.63);
  let grass=lerpV(col('#3f6639'),col('#879356'),v*.88),stone=lerpV(col('#657767'),col('#a9b097'),v*.69),r=clamp(smooth(.18,.50,1-n[1])*smooth(2,4,y)+smooth(9,15,y)*.5);
  const field=valleyFieldAt(x,z);if(field){const meadow=.50*noise(x*.09,z*.09)+.30*noise(x*.22,z*.22)+.20*v;grass=lerpV(col(field.a),col(field.b),.24+meadow*.54);}
  // Moorland keeps warm limestone ledges and green seams, rather than a
  // pale, uniformly dusted mountain surface behind the station town.
  if(y>5){const ledge=Math.sin(y*1.55+x*.19+z*.13)*.5+.5;stone=lerpV(stone,col('#bac0a4'),smooth(.83,.98,ledge)*.27);}
  let c=lerpV(grass,stone,r);if(Math.abs(x-riverX(z))-riverWidth(z)<.8&&z>-19)c=lerpV(col('#8c9472'),col('#627853'),v);
  positions.push([x,y,z]);normals.push(n);colors.push(c);
 }
 for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i;for(const ids of [[a,a+nx+1,a+1],[a+1,a+nx+1,a+nx+2]]){
  const mid=mul(add(add(positions[ids[0]],positions[ids[1]]),positions[ids[2]]),1/3),near=nearestTrack(mid[0],mid[2]);
  if(near.edge&&near.dist<1.06&&inTunnel(near.edge,near.d,1.6)&&mid[1]<near.p[1]+2.28)continue;
  for(const k of ids)b.vertex(positions[k],normals[k],colors[k],3);
 }}return b;
}
function createGround(){
 // Track cells cannot change during this synchronous terrain build. Reuse the
 // same ordered neighbors for nearby height/normal/triangle samples, then drop
 // the entire cache before any editor or simulation work can run.
 const previousNearestTrack=nearestTrack,neighbors=new Map();
 nearestTrack=function(x,z){
  const gx=Math.floor(x/2),gz=Math.floor(z/2),key=`${gx},${gz}`;let candidates=neighbors.get(key);
  if(!candidates){
   candidates=[];
   for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){
    const cell=trackGrid.get(`${gx+i},${gz+j}`);if(cell)for(const a of cell)candidates.push(a);
   }
   neighbors.set(key,candidates);
  }
  let best=null,dist=99;
  for(const a of candidates){
   const dx=x-a.p[0],dz=z-a.p[2];
   if(Math.abs(dx)>dist||Math.abs(dz)>dist)continue;
   const d=Math.hypot(dx,dz);if(d<dist){best=a;dist=d;}
  }
  return best?{...best,dist}:{dist:99,p:[0,1.06,0],edge:null,d:0};
 };
 try{return createGroundUncached();}finally{nearestTrack=previousNearestTrack;}
}
function createWater(){
 const b=new Builder();for(let j=0;j<350;j++){const z0=-18.2+j*52.9/350,z1=-18.2+(j+1)*52.9/350;for(let i=0;i<12;i++){const u=i/12,v=(i+1)/12,x=(z,t)=>riverX(z)+(t*2-1)*(riverWidth(z)+.30);b.quad([x(z0,u),.13,z0],[x(z1,u),.13,z1],[x(z1,v),.13,z1],[x(z0,v),.13,z0],'#448b84',7,[0,1,0],[[u,j/350],[u,(j+1)/350],[v,(j+1)/350],[v,j/350]]);}}
 disposeMesh(waterMesh);waterMesh=b.mesh();
}
function bridgeRange(edge,test){const ranges=[];let start=null;for(let d=0;d<=edge.length+.8;d+=.5){const a=edge.at(d);if(d<edge.length&&test(a)){if(start===null)start=d;}else if(start!==null){if(d-start>1.1)ranges.push([Math.max(0,start-.65),Math.min(edge.length,d+.65)]);start=null;}}return ranges;}
function stoneViaduct(b,edge,start,end){
 const n=Math.max(2,Math.round((end-start)/4.5)),span=(end-start)/n;
 for(let i=0;i<n;i++){
  const d=start+(i+.5)*span,a=edge.at(d),left=edge.at(d-span/2),right=edge.at(d+span/2),w=Math.hypot(right.p[0]-left.p[0],right.p[2]-left.p[2])+.045,top=a.p[1]-.19;
  const g=Math.min(terrainH(a.p[0],a.p[2]),top-1.9),r=Math.min(w*.36,(top-g)*.6),cy=top-.50-r,pw=(w-r*2)*.5;
  b.matrix(basis([a.p[0],0,a.p[2]],norm([a.f[0],0,a.f[2]])));b.push(0,0,0,0,PI/2);
  for(const s of [-1,1]){const px=s*(r+pw*.5);b.box(px,(g+cy)*.5,0,pw,Math.max(.08,cy-g),1.56,'#9d9d8a',4);b.box(px,g+.15,0,pw+.18,.28,1.80,'#8c9380',4);b.box(px,(cy+top)*.5,0,pw,top-cy,1.56,'#a9a58f',4);}
  archRing(b,0,cy,0,r,r+.26,1.56,'#c1b89d',18);
  for(let k=0;k<18;k++){const aa=k*PI/18,bb=(k+1)*PI/18,xa=(r+.255)*Math.cos(aa),xb=(r+.255)*Math.cos(bb),ya=cy+(r+.255)*Math.sin(aa),yb=cy+(r+.255)*Math.sin(bb);for(const z of [-.78,.78])b.quad([xa,ya,z],[xb,yb,z],[xb,top,z],[xa,top,z],'#a5a28d',4);}
  b.pop();b.pop();
 }
 ribbon(b,edge,1.72,0,-.20,'#b4b09a',4,start,end,.32);
 for(const s of [-1,1])for(let d=start;d<end;d+=.65){const a=edge.at(d),r=norm([a.f[2],0,-a.f[0]]);b.matrix(basis(add(a.p,mul(r,s*.83)),a.f));b.box(0,.15,0,.17,.40,.68,'#b2ae97',4);b.box(0,.385,0,.24,.08,.70,'#cec4a8',4);b.pop();}
}
function trussBridge(b,edge,start,end){
 ribbon(b,edge,1.7,0,-.23,'#4e625a',41,start,end,.25);
 const n=Math.max(3,Math.round((end-start)/1.8)),step=(end-start)/n;
 for(const side of [-1,1])for(let i=0;i<n;i++){
  const a=edge.at(start+i*step),q=edge.at(start+(i+1)*step),r=norm([a.f[2],0,-a.f[0]]),rr=norm([q.f[2],0,-q.f[0]]),p=add(a.p,mul(r,side*.88)),v=add(q.p,mul(rr,side*.88)),u=add(p,[0,1.95,0]),w=add(v,[0,1.95,0]);
  for(const pair of [[p,v],[u,w],[p,u],[p,w],[u,v]])b.beam(...pair,.046,'#364d43',41,6);
  if(i%2===0)b.beam(u,add(u,mul(r,-side*1.76)),.039,'#526658',41,6);
 }
 for(const d of [start,end]){const a=edge.at(d);b.matrix(basis(a.p,a.f));b.box(0,-.6,0,2.10,1.1,.68,'#959c86',4);b.pop();}
}
function timberTrestle(b,edge,start,end){
 ribbon(b,edge,1.45,0,-.22,'#796341',22,start,end,.28);
 for(let d=start;d<end;d+=2.1){const a=edge.at(d),g=terrainH(a.p[0],a.p[2]),h=Math.max(.3,a.p[1]-g);b.matrix(basis(a.p,a.f));
  for(const s of [-1,1]){b.beam([s*.75,-.2,0],[s*1.03,-h,0],.095,'#6c583c',22,6);b.beam([s*1.03,-h,0],[-s*.75,-.3,0],.065,'#9b7d4e',22,6);}b.box(0,-.30,0,2.1,.2,.27,'#a08151',22);b.pop();
 }
}
function buildTunnelRange(b,r){
 const {edge,start,end}=r;
 for(const [d,sgn]of [[start,-1],[end,1]]){const a=edge.at(d);b.matrix(basis(a.p,mul(a.f,sgn)));
  for(const s of [-1,1]){b.box(s*1.25,.42,0,.45,1.36,.64,'#979b87',4);b.box(s*1.25,1.1,0,.54,.16,.80,'#c4bda6',4);b.push(s*1.70,0,-.8,0,s*.38);b.box(0,.70,0,.35,1.8,1.8,'#8f9582',4);b.pop();}
  archRing(b,0,1.1,0,1.03,1.50,.67,'#b4b29b',22);b.box(0,2.66,0,1.06,.20,.60,'#8d9481',4);sign(b,'tunnel',0,2.67,.32,.74,.16);b.pop();
 }
 for(let d=start;d<end;d+=.55){const a=edge.at(d),q=edge.at(Math.min(end,d+.55)),ra=norm([a.f[2],0,-a.f[0]]),rq=norm([q.f[2],0,-q.f[0]]);for(let i=0;i<14;i++){
  const at=(p,r,t)=>add(p,[r[0]*Math.cos(t)*1.045,1.1+Math.sin(t)*1.045,r[2]*Math.cos(t)*1.045]);const t0=i*PI/14,t1=(i+1)*PI/14;
  b.quad(at(a.p,ra,t0),at(q.p,rq,t0),at(q.p,rq,t1),at(a.p,ra,t1),'#384235',4);
 }for(const s of [-1,1]){const p=add(a.p,mul(ra,s*1.045)),v=add(q.p,mul(rq,s*1.045));b.quad(add(p,[0,-.18,0]),add(v,[0,-.18,0]),add(v,[0,1.1,0]),add(p,[0,1.1,0]),'#303b30',4);}}
}
function makeRoad(b){
 const roadPaths=[
 [P(-47,5,.77),P(-35,11,.77),P(-22,11,.77),P(-12,9,.77),P(-5,9,.77)],
 [P(-33,-8,.77),P(-32,0,.77),P(-31,11,.77),P(-33,20,.77)],
 [P(-19,-9,.77),P(-19,0,.77),P(-20,11,.77),P(-20,19,.77)],
 [P(-31,-6,.77),P(-18,-6,.77),P(-9,-4,.77),P(-6,3,.77)],
 [P(-5,9,.77),P(0,11,1.9),P(14,11,1.9),P(20,8,.77),P(30,6,.77),P(43,7,.77)]
 ];
 for(let i=0;i<roadPaths.length;i++){const e=new Edge('road'+i,splineCurves(roadPaths[i],false,.68));roads.push(e);if(!i)road=e;ribbon(b,e,2.4,0,0,'#8f907d',9,0,e.length,.3);for(const s of [-1,1])ribbon(b,e,.30,s*1.3,.035,'#c3bca2',4,0,e.length,.4);}
 const bridge=roads[4];for(const [start,end] of bridgeRange(bridge,a=>Math.abs(a.p[0]-riverX(a.p[2]))<riverWidth(a.p[2])+1)){ribbon(b,bridge,3.05,0,-.2,'#969d8a',4,start,end,.25);for(let d=start;d<=end;d+=3){let a=bridge.at(d);b.box(a.p[0],.76,a.p[2],.48,1.25,.62,'#9da48e',4);}for(const s of[-1,1])for(let d=start;d<end;d+=.6){const a=bridge.at(d),q=bridge.at(Math.min(end,d+.6)),r=norm([a.f[2],0,-a.f[0]]);b.beam(add(a.p,[r[0]*s*1.50,.52,r[2]*s*1.50]),add(q.p,[r[0]*s*1.50,.52,r[2]*s*1.50]),.031,'#b9bba1',41,6);}}
}
// New collection pieces reuse the same instanced editing, picking and saving path.
const newDivisionAssets=[
 {id:'townhouse',name:'High-street shop',cat:'Village',w:3.7,d:3.4,h:5.5,desc:'Two storeys, storefront glazing, cornice, striped awning and chimney.'},
 {id:'warehouse',name:'Harbor warehouse',cat:'Village',w:5.8,d:4.4,h:4.9,desc:'Brick riverside warehouse with loading doors and a raised goods platform.'},
 {id:'chalet',name:'Summit chalet',cat:'Village',w:3.3,d:3.2,h:3.8,desc:'Alpine timber balconies, deep eaves and a stone base.'},
 {id:'barn',name:'Red timber barn',cat:'Village',w:4.7,d:3.8,h:4.6,desc:'A weathered barn with braced doors, a hayloft and a cupola.'},
 {id:'windmill',name:'Meadow windmill',cat:'Village',w:3.3,d:3.3,h:6.8,desc:'A whitewashed mill tower with four timber sails.'},
 {id:'sawmill',name:'Valley sawmill',cat:'Railway',w:6.8,d:4.8,h:4.5,desc:'Timber loading platform, industrial chimney and open log racks.'},
 {id:'crane',name:'Harbor crane',cat:'Railway',w:3.1,d:3.1,h:5.5,desc:'Lattice dock crane, machinery house, cables and a hanging hook.'},
 {id:'silo',name:'Grain elevators',cat:'Railway',w:4.6,d:3.2,h:7.2,desc:'Riveted silos with cone roofs, pipework and an inspection walkway.'},
 {id:'lighthouse',name:'Harbor beacon',cat:'Details',w:1.8,d:1.8,h:4.6,desc:'Stone navigation beacon with a warmly illuminated lantern.'},
 {id:'fir',name:'Alpine spruce',cat:'Nature',w:2.5,d:2.5,h:4.9,desc:'Tall, irregular branch whorls for the high forests.'},
 {id:'boulder',name:'Granite outcrop',cat:'Nature',w:3.9,d:3.3,h:3.9,desc:'Fractured granite with moss-filled seams and a broken silhouette.'}
];
for(const a of newDivisionAssets){ASSETS.push(a);assetById[a.id]=a;}
function divisionAsset(b,type,variant=0){
 if(type==='townhouse'){
  const colors=['#b7a37f','#a17a5b','#8a9a8c'],paint=colors[variant%3];b.box(0,.18,0,3.6,.36,3.3,'#b8b49a',4);b.box(0,2.15,0,3.28,3.95,2.88,paint,4);b.box(0,.89,1.48,2.95,1.46,.10,'#30594b',22);
  for(const x of[-.93,.91]){windowPane(b,x,.95,1.57,.89,1.07);windowPane(b,x,2.89,1.47,.76,1.03);flowerBox(b,x,2.31,1.55,.83);}b.box(0,.83,1.55,.50,1.5,.09,'#517262',22);b.box(0,1.84,1.58,3.27,.30,.12,'#405741',22);sign(b,['bakery','post','inn'][variant%3],0,1.84,1.652,2.40,.19);
  for(let i=0;i<12;i++){b.push(-1.51+i*.274,0,0);b.quad([0,1.69,1.50],[.27,1.69,1.50],[.27,1.36,2.12],[0,1.36,2.12],i%2?'#dbcaa5':'#59725a',23);b.pop();}
  b.box(0,4.13,0,3.49,.18,3.14,'#d0c3a4',4);b.box(0,4.33,0,3.60,.15,3.24,'#6e7664',4);b.box(0,4.29,0,3.22,.11,2.90,'#404e43',5);for(const s of[-1,1])b.box(s*1.66,4.48,0,.17,.40,3.19,'#aeaa91',4);b.box(0,4.48,1.51,3.39,.41,.17,'#b6b099',4);b.box(.87,4.77,-.6,.49,.82,.46,'#91775d',4);b.box(.87,5.22,-.6,.60,.12,.56,'#b7a889',4);
 }else if(type==='warehouse'||type==='sawmill'){
  const w=type==='warehouse'?5.6:6.3,d=3.7;b.box(0,.2,0,w+.5,.4,d+.7,'#9fa28b',4);b.box(0,1.75,0,w,3.2,d,type==='warehouse'?'#a38b6b':'#9c825a',type==='warehouse'?4:22);gable(b,w+.1,d+.1,3.4,1.15,'#53685b');
  for(const x of[-w*.30,0,w*.30]){b.box(x,1.19,d*.5+.045,1.13,1.98,.12,'#3c6152',22);for(let j=0;j<5;j++)b.box(x-.45+j*.225,1.19,d*.5+.116,.025,1.94,.015,'#829682',22);windowPane(b,x,2.71,d*.5+.07,.77,.52);}b.box(0,3.57,d*.5+.13,2.9,.42,.07,'#344d3e',22);sign(b,'railway',0,3.57,d*.5+.18,2.5,.19);
  b.box(-w*.33,4.21,-.65,.64,1.93,.60,'#987856',4);b.box(-w*.33,5.19,-.65,.78,.13,.73,'#ad9b7f',4);
  if(type==='sawmill'){for(let i=0;i<8;i++){const z=.8+(i%4)*.35,y=.59+Math.floor(i/4)*.3;b.cylinder(w*.54,y,z,.19,.19,2.5,'#957448',22,10,PI/2);b.cylinder(w*.54,y,z+1.26,.155,.155,.02,'#d0b67f',0,10,PI/2);}}
 }else if(type==='chalet'){
  b.box(0,.38,0,2.85,.76,2.55,'#a3a88f',4);b.box(0,1.45,0,2.78,1.43,2.5,'#936e46',22);gable(b,3.15,2.95,2.2,1.35,'#536f60');
  for(const x of[-.7,.7])windowPane(b,x,1.63,1.28,.51,.65);b.box(0,.85,1.77,3.2,.12,.99,'#b49563',22);
  for(let x=-1.45;x<=1.45;x+=.23)b.box(x,1.16,2.15,.055,.63,.06,'#c4a574',22);b.box(0,1.51,2.15,3.15,.074,.10,'#d0b484',22);b.box(-.83,2.92,-.5,.41,1.02,.44,'#a5987d',4);
 }else if(type==='barn'){
  b.box(0,.15,0,4.3,.3,3.5,'#a9a58b',4);b.box(0,1.65,0,4.2,3.0,3.35,'#935b42',22);gable(b,4.42,3.6,3.18,1.25,'#667462');b.box(0,1.2,1.72,2.2,2.25,.10,'#6e4735',22);
  for(const x of [-1.08,0,1.08])b.box(x,1.22,1.80,.08,2.35,.05,'#d5c5a0',22);for(const s of[-1,1]){b.beam([s*.98,.18,1.81],[0,2.32,1.81],.034,'#d5c5a0',22);b.box(s*2.06,1.61,1.70,.09,3.14,.12,'#d1bf98',22);}windowPane(b,0,3.1,1.70,.71,.54);b.box(0,4.19,0,.8,.67,.8,'#c6bd99',22);gable(b,1.0,.95,4.51,.35,'#4d6555');
 }else if(type==='windmill'){
  b.cylinder(0,2.2,0,1.25,.81,4.4,'#cdc6a9',4,24);b.cylinder(0,4.62,0,1.02,0,.78,'#567260',5,24);b.box(0,.63,1.16,.53,1.24,.10,'#526e57',22);windowPane(b,.48,2.67,.86,.32,.43);
  b.push(0,3.55,1.05,0,0,.27);for(let k=0;k<4;k++){b.push(0,0,0,0,0,k*PI/2);b.beam([0,0,.0],[0,2.6,.0],.045,'#8d784d',22);for(let i=0;i<9;i++)b.box(.25,.65+i*.21,0,.57,.13,.07,'#d3c7a0',22);b.pop();}b.cylinder(0,0,.08,.17,.17,.30,'#b6a16c',41,16,PI/2);b.pop();
 }else if(type==='crane'){
  for(const x of[-.65,.65])for(const z of[-.6,.6])b.beam([x,0,z],[x*.7,2.55,z*.7],.073,'#7b836c',41,8);
  for(const s of[-1,1])b.beam([-s*.65,.2,.6],[s*.48,2.45,.48],.037,'#b2a57b',41,6);
  b.box(0,2.62,0,1.7,.28,1.8,'#657664',41);b.box(0,3.10,-.3,1.22,.91,1.17,'#b6a270',22);windowPane(b,0,3.25,.315,.81,.49);
  for(const s of[-1,1]){b.beam([s*.35,3.1,.2],[s*.18,5.15,2.4],.055,'#567463',41,8);b.beam([s*.35,3.1,-.1],[s*.18,5.15,2.4],.032,'#a49975',41,6);}b.beam([0,5.12,2.4],[0,1.85,2.4],.014,'#454c3c',41,5);b.cylinder(0,1.73,2.4,.10,.07,.23,'#8e8261',41,12);
 }else if(type==='silo'){
  for(const x of[-1.1,1.1]){b.cylinder(x,2.7,0,.96,.96,5.4,'#b7b9aa',41,32);b.cylinder(x,5.75,0,1.03,.13,.7,'#a2b0a4',41,32);for(let y=.45;y<5.4;y+=.85)b.cylinder(x,y,0,.974,.974,.035,'#7b8b7c',41,32);b.beam([x,.1,1],[x,5.65,1],.026,'#667b6c',41,8);for(let j=0;j<24;j++)b.box(x,j*.23+.13,1.01,.35,.033,.04,'#748b7c',41);}
  b.box(0,5.41,0,4.2,.09,.63,'#6b8071',41);b.beam([-1.1,6.05,0],[-1.1,6.75,0],.11,'#708778',41,12);b.beam([-1.1,6.75,0],[1.1,6.15,0],.11,'#708778',41,12);
 }else if(type==='lighthouse'){
  b.cylinder(0,1.64,0,.69,.43,3.28,'#d6cdb0',4,24);b.cylinder(0,3.31,0,.79,.79,.16,'#617967',41,24);b.cylinder(0,3.67,0,.43,.43,.69,'#ffdda0',6,16);for(let j=0;j<8;j++){const a=j*TAU/8;b.beam([Math.cos(a)*.48,3.30,Math.sin(a)*.48],[Math.cos(a)*.48,4.04,Math.sin(a)*.48],.027,'#526656',41,6);}b.cylinder(0,4.21,0,.66,0,.39,'#5c705b',41,24);
 }else if(type==='fir'){
  basePine(b,0,0,4.6);for(let j=0;j<12;j++){const a=j*2.399,y=.9+j*.23,r=(1-j/14)*.67;b.beam([0,y,0],[Math.cos(a)*r,y+.08,Math.sin(a)*r],.025,'#81795b',22,5);}
 }else if(type==='boulder'){
  for(let i=0;i<7;i++){const x=rnd(-1.3,1.3),z=rnd(-1.1,1.1),sy=rnd(.7,2.1);b.push(x,sy*.43,z,rnd(-.25,.25),rnd(0,TAU),rnd(-.22,.22));b.sphere(0,0,0,rnd(.65,1.15),sy,rnd(.50,.85),shade('#a2a795',rnd(.72,1.1)),4,8,5,true);b.pop();}
 }
}
function getTemplate(o){
 if(!newDivisionAssets.some(a=>a.id===o.type))return workshopGetTemplate(o);
 const key=templateKey(o);if(templates.has(key))return templates.get(key);
 const old=seed;seed=97777+(o.seed%3)*1357;const b=new Builder();if(o.type==='fir')b.push(0,-terrainH(0,0),0);divisionAsset(b,o.type,o.seed%3);if(o.type==='fir')b.pop();seed=old;
 const data=b.data,min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];for(let i=0;i<data.length;i+=12)for(let k=0;k<3;k++){min[k]=Math.min(min[k],data[i+k]);max[k]=Math.max(max[k],data[i+k]);}
 const result={data,min,max,mesh:b.mesh()};templates.set(key,result);return result;
}

function seedDivisionScenery(){
 if(!captureScenery)return;
 const addO=(type,x,z,angle=0,scale=1,params=null)=>{const o=registerObject(type,x,z,angle,scale,params);const a=assetById[type];if(!['pine','fir','oak','autumn','rock','boulder','flowers','fence','sheep'].includes(type))houseZones.push({x,z,r:Math.hypot(a.w,a.d)*scale*.53});return o;};
 addO('station',-20.0,19.95,0,1.36);
 addO('station',13.4,-28.9,PI,.68);
 addO('church',-25,-1.45,-.10,1.22);
 // A street grid of shops, cottages, back gardens and small civic places.
 for(const x of[-36.5,-31.8,-27.1,-22.4,-17.7,-13.0])addO('townhouse',x,7.5,0,.96+rnd(-.04,.08));
 for(const x of[-35.8,-28.9,-23.8,-16.2,-10.5])addO('townhouse',x,14.1,PI,.91+rnd(-.06,.08));
 for(const x of[-35.8,-29.1,-16.2,-10.6])addO('cottage',x,-1.25,.03+rnd(-.07,.07),1.02,{w:rnd(2.5,3.0),d:2.4,h:rnd(2,2.65),paint:['#d0bd98','#bbc6ab','#b7af92'][Math.floor(rand()*3)],roof:['#647b69','#8d7456','#5c6d64'][Math.floor(rand()*3)],name:null});
 for(const x of[-37,-31,-24.9,-18.0]){addO('cottage',x,-8.7,0,.88);addO('flowers',x,-6.8,0,.72);}
 communityWorkshop(addO);
 addO('fence',-26,-5.3,0,1.25);addO('flowers',-30.2,3.0,0,.74);addO('bench',-23,2.5,PI,1);addO('bench',-20,2.5,PI,1);
 // The harbor is at the edge of the lake, not on top of the water.
 addO('warehouse',-3.3,-.7,-PI/2,1.08);addO('crane',-1.0,4.25,PI/2,.86);addO('lighthouse',-2.0,6.8,0,.76);
 addO('warehouse',20,-1.4,PI/2,.82);addO('willow',17.9,4.1,0,1.05);addO('picnic',16.8,8.8,0,.8);
 // Five sorted goods roads and the engine facilities on the east bank.
 addO('goods',35,20.9,PI,.86);addO('warehouse',35.0,7.8,0,.91);addO('sawmill',29.4,3.4,-.07,.84);
 addO('watertower',45.1,2.8,0,1.18);addO('signalbox',26.3,21.3,-.10,.89);addO('silo',46.9,8.3,0,.80);
 addO('goods',47.2,14.3,PI/2,.65);addO('watertower',-38.9,19.0,0,.79);
 // Alpine hamlets and farmsteads give the journeys distinct destinations.
 for(const [x,z,s]of[[-36,-25,.90],[-29,-25.6,.92],[-19,-28,.76],[23,-28.8,.78],[35,-29,.73],[45,-18,.78]])addO('chalet',x,z,rand()*.4-.2,s);
 addO('barn',-39,1.0,.12,.98);addO('windmill',-39.0,8.0,.3,.84);addO('sheep',-41,4.1,0,1.1);addO('orchard',-36.1,4.2,.12,.65);
 addO('barn',32.7,-15.1,.12,.67);
 // Trees are individual editable instances; clearances cover every route.
 let trees=0;const occupied=objects.filter(o=>!['pine','fir','oak','autumn','rock','boulder'].includes(o.type));
 for(let attempt=0;attempt<6000&&trees<620;attempt++){
  const x=rnd(-53,53),z=rnd(-33.3,33.3),y=terrainH(x,z),near=nearestTrack(x,z),rd=Math.abs(x-riverX(z))-riverWidth(z);
  if(near.dist<1.65||rd<1.15&&z>-19||y<.4||y>18.0)continue;
  if(roadDistance(x,z)<1.85)continue;
  if(occupied.some(o=>{const a=assetById[o.type];return Math.hypot(x-o.x,z-o.z)<Math.hypot(a.w,a.d)*o.scale*.53+1.2;}))continue;
  if(x>25&&x<47&&z>-9&&z<21)continue;
  if(x>-39&&x<-6&&z>-10&&z<18&&rand()<.83)continue;
  if(x>-4&&x<20&&z>-20&&z<-9)continue;
  if(z>27&&rand()<.73)continue;
  const field=valleyFieldAt(x,z);if(field)continue;
  const high=z<-17||x<-44||x>46,typ=high?(rand()<.31?'fir':'pine'):(rand()<.48?'pine':rand()<.2?'autumn':'oak');
  addO(typ,x,z,rand()*TAU,high?rnd(.62,1.12):rnd(.58,.95));trees++;
 }
 for(let i=0;i<145;i++){
  const x=rnd(-51,52),z=rnd(-33,-15),y=terrainH(x,z);if(y<4||nearestTrack(x,z).dist<1.50)continue;
  addO('boulder',x,z,rand()*TAU,rnd(.45,.95));
 }
 for(let i=0;i<95;i++){const z=rnd(-18,32),side=rand()<.5?-1:1,x=riverX(z)+side*(riverWidth(z)+rnd(.10,.8));if(nearestTrack(x,z).dist<1)continue;addO('rock',x,z,rand()*TAU,rnd(.40,.91));}
 // Thoughtful avenue planting between blocks instead of randomly filling town.
 for(const [x,z]of[[-39,13],[-35,19],[-31,18],[-27,18],[-8,16],[-5.6,6],[-3.5,12],[-13,1.1],[-27.5,3],[-33,2.5],[-19,3.4],[22,6.8],[25.4,4.0]])if(nearestTrack(x,z).dist>1.8)addO('autumn',x,z,0,.75);
 for(const [x,z]of[[-37.8,10],[-33,10],[-28,10],[-23,10],[-18,10],[-12,10],[-35,15.6],[-24,15.6],[-11,15.5],[-5.3,3.2],[-3.5,5.6],[18,5.9],[29,8]])addO('lamp',x,z,0,1);
}
function buildStationDistrict(b){
 // A long island platform for the express, with separate freight tracks behind it.
 const y=1.10; b.box(-16.5,y-.12,24.56,45,.28,1.53,'#b8b39c',4);b.box(-16.5,y+.06,25.33,45,.07,.13,'#eee0b8',0);
 for(let x=-38.5;x<6;x+=.36)b.box(x,y+.101,25.27,.18,.011,.06,'#d4bf86',0);
 for(const x of[-32,-28,-24,-20,-16,-12,-8,-4,0,4]){b.cylinder(x,y+1.03,24.60,.047,.038,2.04,'#426453',41,10);b.beam([x,y+1.49,24.60],[x-.40,y+2.01,24.60],.026,'#8c9b78',41,6);b.beam([x,y+1.49,24.60],[x+.40,y+2.01,24.60],.026,'#8c9b78',41,6);}
 b.push(-14,y+2.11,24.49,-.05);b.box(0,0,0,37,.10,1.69,'#4b6c5b',41);for(let x=-18.2;x<18.5;x+=.3)b.box(x,.069,0,.025,.035,1.69,'#859378',41);b.pop();
 for(let i=0;i<32;i++){let x=-36+i*1.24;person(b,x,y+.10,24.55+(i%2)*.33,['#c1a577','#8b5748','#4b6c67','#b6bea5','#795844'][i%5],rnd(-1,1),rnd(.85,1.10));if(i%5===0)b.box(x+.23,y+.23,24.70,.22,.29,.18,'#886c47',22);}
 for(const x of[-36,-26,-16,-6,6]){bench(b,x,y+.09,24.18,0);b.cylinder(x,2.07,25.04,.04,.027,1.93,'#4e6755',41,8);b.box(x,3.16,25.04,.16,.28,.16,'#efd39a',6);}
 // A footbridge actually clears the freight line.
 b.box(-8.0,3.96,22.32,1.12,.16,4.6,'#697e64',41);for(const s of[-1,1]){b.beam([-8+s*.51,4.54,20.1],[-8+s*.51,4.54,24.6],.024,'#bac29d',41,6);for(let z=20.1;z<24.8;z+=.33)b.beam([-8+s*.51,3.98,z],[-8+s*.51,4.56,z],.016,'#9dab87',41,5);}
 for(let i=0;i<13;i++){const yy=1.05+i*.23;b.box(-8-3.6+i*.28,yy,20.25,.31,.15,1.1,'#81927b',41);b.box(-8+3.6-i*.28,yy,24.55,.31,.15,.9,'#81927b',41);}
 // Station forecourt paving and passenger movement.
 b.box(-20,.76,17.3,23,.045,2.1,'#c0b49a',9);for(let i=0;i<16;i++)person(b,-31+i*1.27,.80,17.2+rnd(-.6,.5),['#a2825e','#516f66','#b1b390'][i%3],rand()*TAU,.97);
}
function buildHarbor(b){
 const y=.68;
 // Timber piles, planked wharf, capstans and rope rails.
 for(let k=0;k<42;k++)b.box(-.80+k*.14,y,2.30,.129,.14,2.05,'#a08453',22);
 for(const x of[-.65,1.25,3.0,4.85])for(const z of[1.4,3.2]){b.cylinder(x,.32,z,.12,.1,1.18,'#645b3f',22,10);b.cylinder(x,.91,z,.13,.13,.1,'#555c48',41,12);}
 for(let j=0;j<14;j++){const x=-1.8+(j%5)*.62,z=.0+Math.floor(j/5)*.62;b.box(x,.87,z,.53,.54,.52,'#af8e59',22);b.box(x,.98,z+.27,.41,.038,.018,'#78673e',22);}
 // A second landing beyond the road bridge.
 for(let k=0;k<29;k++)b.box(14.2+k*.14,.64,7.2,.13,.14,1.9,'#aa8b5c',22);
 function boat(x,z,angle,s=1){b.push(x,.20,z,0,angle,0,s);b.sphere(0,0,0,.53,.25,1.6,'#624936',22,18,7);b.sphere(0,.11,0,.41,.08,1.23,'#cab386',22,16,6);for(let zz of[-.65,.1,.77])b.box(0,.18,zz,.75,.05,.22,'#b9a471',22);b.beam([-.61,.28,-.6],[.5,.31,.67],.025,'#cfb57b',22,7);b.pop();}
 boat(5,4.6,.25,.85);boat(12.1,5.6,-.55,.66);boat(9.6,15.0,.75,.69);
 // Small tug moored against the warehouse quay.
 b.push(4.8,.20,-1.5,0,-.20);b.sphere(0,.10,0,.8,.46,2.0,'#435d53',41,22,9);b.box(0,.49,-.15,1.15,.16,2.6,'#cab88e',22);b.box(0,1.04,-.4,.91,1.1,1.29,'#d4c5a0',22);b.box(0,1.63,-.4,1.05,.12,1.48,'#516d5c',41);windowPane(b,0,1.19,.27,.59,.44);b.cylinder(0,1.68,-.83,.14,.14,.8,'#6c5a3c',41,16);b.beam([0,.66,1.0],[0,2.2,1.0],.024,'#ae9c6b',41,8);b.pop();
}
function buildEngineYard(b){
 const cx=37,cz=0,ground=terrainH(cx,cz),railY=1.06;
 // Recessed turntable well and a radial six-road roundhouse.
 b.cylinder(cx,ground+.025,cz,4.5,4.5,.08,'#888f7a',4,96);b.cylinder(cx,ground+.075,cz,4.11,4.11,.08,'#394c40',9,96);
 for(let i=0;i<80;i++){let a=i*TAU/80,q=(i+1)*TAU/80;b.beam([cx+3.82*Math.cos(a),ground+.20,cz+3.82*Math.sin(a)],[cx+3.82*Math.cos(q),ground+.20,cz+3.82*Math.sin(q)],.033,'#b6bda5',41,6);}
 for(let i=0;i<6;i++){
  const angle=PI+(i-2.5)*.28,f=[Math.sin(angle),0,Math.cos(angle)],rad=[Math.cos(angle),0,-Math.sin(angle)],mid=add([cx,railY,cz],mul(f,7.25));
  const points=[add([cx,railY,cz],mul(f,4.05)),add([cx,railY,cz],mul(f,10.65))],edge=new Edge('stall'+i,[lineCurve(...points)]);createRail(b,edge);
  b.matrix(basis(mid,f));
  const w=2.22,d=5.7;for(const s of[-1,1])b.box(s*w*.5,1.63,0,.15,3.33,d,'#9b8b6c',4);b.box(0,1.66,d*.5,2.34,3.34,.18,'#a18f70',4);b.box(0,3.22,-d*.5,2.32,.25,.18,'#beb290',4);
  for(const s of[-1,1]){b.box(s*.90,1.51,-d*.5,.18,3.03,.22,'#a8a07f',4);b.push(s*.95,0,-d*.5-.05,0,s*.60);b.box(0,1.41,0,.77,2.83,.075,'#395e4d',22);for(let j=0;j<5;j++)b.box((j-2)*.125,1.43,.048,.016,2.66,.018,'#7f9375',22);b.pop();}
  b.box(0,3.55,0,2.52,.17,5.94,'#4b6d58',5);b.box(0,3.92,.3,.60,.54,2.45,'#7f9075',22);b.box(0,4.21,.3,.78,.07,2.70,'#3c5c4a',41);for(const s of[-1,1])for(const z of[-.60,0,.60])b.box(s*.315,3.93,z,.025,.3,.37,'#e7c18d',6);b.cylinder(.63,3.98,1.1,.10,.10,.85,'#60765e',41,12);
  b.pop();
 }
 // Coal stage, fuel barrels and servicing detail placed clear of through tracks.
 for(let i=0;i<22;i++){let x=29.2+rnd(0,2.6),z=-4.8+rnd(0,2.1);b.sphere(x,.65+rnd(0,.45),z,rnd(.25,.6),rnd(.15,.4),rnd(.2,.5),'#3c4238',42,7,4,true);}
 b.box(30.6,.77,-4.0,3.7,.16,2.7,'#857557',22);for(let i=0;i<9;i++)b.box(29.1+i*.34,1.08,-2.7,.11,.77,.12,'#9c8558',22);
 for(const p of[[44,4.5],[44.7,4.5],[45.4,4.5],[44,5.25],[44.7,5.25]]){b.cylinder(p[0],.94,p[1],.24,.24,.67,'#657b63',41,14);for(const yy of [.69,1.19])b.cylinder(p[0],yy,p[1],.253,.253,.037,'#a0a78b',41,14);}
 // Buffer stops at the end of each goods road.
 for(const key of['yard','siding1','siding2','siding3','siding4','siding5']){const e=divisionEdges[key];if(!e)continue;const a=e.at(e.length-.32);b.matrix(basis(a.p,a.f));for(const s of[-1,1])b.beam([s*.48,.09,-.45],[s*.48,.67,0],.069,'#5a6c56',41,8);b.box(0,.64,0,1.13,.18,.15,'#b68a5b',22);b.pop();}
}
function buildValleyCountryside(b){
 if(flatTerrain)return;
 const buildings=objects.filter(o=>!['pine','fir','oak','autumn','willow','orchard','rock','boulder','flowers','fence','sheep','lamp','bench','picnic'].includes(o.type));
 const clear=(x,z,margin=.6)=>nearestTrack(x,z).dist>1.70&&roadDistance(x,z)>1.05&&!(z>-19&&Math.abs(x-riverX(z))-riverWidth(z)<.65)&&!buildings.some(o=>{const a=assetById[o.type];return a&&Math.hypot(x-o.x,z-o.z)<Math.hypot(a.w,a.d)*o.scale*.50+margin;});
 // Quiet grass fields are framed by low hawthorn hedges. Their open centres
 // give the town and passing trains space, with no livestock enclosures.
 for(const f of valleyFields){
  for(let i=0;i<f.points.length;i++){
   const a=f.points[i],q=f.points[(i+1)%f.points.length],length=Math.hypot(q[0]-a[0],q[1]-a[1]),n=Math.ceil(length/.38);
   for(let j=0;j<n;j++){const t=j/n;if(i===0&&Math.abs(t-.5)*length<.78)continue;const x=mix(a[0],q[0],t),z=mix(a[1],q[1],t);if(!clear(x,z))continue;const y=terrainH(x,z);
    const h=.34+hash(j,i)*.12;b.sphere(x,y+h*.47,z,.34,h*.60,.31,j%4?'#52743f':'#738b4f',8,7,5,true);
   }
   if(i===0){const x=(a[0]+q[0])/2,z=(a[1]+q[1])/2,dx=(q[0]-a[0])/length,dz=(q[1]-a[1])/length,y=terrainH(x,z);if(clear(x,z,1)){for(const s of[-1,1])b.beam([x+dx*s*.72,y,z+dz*s*.72],[x+dx*s*.72,y+.70,z+dz*s*.72],.044,'#99865d',22,6);for(const h of[.16,.39,.62])b.beam([x-dx*.68,y+h,z-dz*.68],[x+dx*.68,y+h,z+dz*.68],.021,'#b3a272',22,5);b.beam([x-dx*.65,y+.17,z-dz*.65],[x+dx*.65,y+.62,z+dz*.65],.019,'#a18e63',22,5);}}
  }
 }
 // Three small boundary oaks, each sited at a field edge, replace scattered
 // farm activity. A saved layout's nearby trees take precedence.
 const oldFieldSeed=seed;seed=91073;
 for(const [x,z,h]of[[-34.1,31.7,2.55],[-19.0,32.4,2.35],[35.0,30.7,2.65]]){
  if(clear(x,z,1.3)&&!objects.some(o=>['oak','pine','fir','autumn','willow','orchard'].includes(o.type)&&Math.hypot(x-o.x,z-o.z)<3.1))baseTree(b,x,z,h);
 }
 seed=oldFieldSeed;
 // Reeds and sedges occupy sheltered stretches, away from the harbour's quays.
 for(const [center,side,count]of[[-9,-1,18],[12,1,16],[19,-1,23],[28,1,24],[32,-1,18]]){
  for(let i=0;i<count;i++){const z=center+(i-count/2)*.15,x=riverX(z)+side*(riverWidth(z)+.16+hash(i,center)*.21),y=terrainH(x,z);if(nearestTrack(x,z).dist<1.25||roadDistance(x,z)<1.15)continue;for(let j=0;j<3;j++){const tip=[x+side*(.08+j*.055),y+.38+hash(i,j)*.29,z+(j-1)*.07];b.beam([x,y+.015,z],tip,.009,j%2?'#759455':'#a2a56c',8,4);if(j===1)b.cylinder(tip[0],tip[1],tip[2],.019,.016,.11,'#806e48',8,6);}}
 }
 const bx=riverX(16.5)+riverWidth(16.5)+2.0,bz=16.5;
 if(clear(bx,bz,1.0)){const y=terrainH(bx,bz);bench(b,bx,y+.04,bz,-PI/2);person(b,bx-.15,y+.17,bz,'#8f6c55',-PI/2,.83);person(b,bx+.65,terrainH(bx+.65,bz)+.04,bz+.48,'#657b62',-2.0,.74);}
 // A handful of long weathered limestone plates follow the existing ridge.
 // No height profile changes: track grades, tunnels and user hills are intact.
 for(const [x,z,w,d]of[[-47,-18,3.5,2.1],[-42,-23,4.5,1.8],[-35,-27,3.4,2.0],[-30,-25,3.9,1.7],[36,-28,3.8,2.0],[40,-24,4.0,1.8],[46,-22,3.2,2.0]]){
  const xz=[[x-w*.5,z-d*.5],[x-w*.4,z+d*.5],[x+w*.5,z+d*.4],[x+w*.4,z-d*.6]];if(xz.some(p=>nearestTrack(...p).dist<2.05))continue;const pts=xz.map(([xx,zz])=>[xx,terrainH(xx,zz)+.07,zz]);if(Math.min(...pts.map(p=>p[1]))<4.5)continue;b.tri(pts[0],pts[1],pts[3],'#8a9a7b',3);b.tri(pts[1],pts[2],pts[3],'#a5b092',3);
 }
}
function buildValleyDetails(b){
 buildStationDistrict(b);buildHarbor(b);buildEngineYard(b);
 // Layered falls with a narrow feeder, stepping from granite shelves into the lake.
 const wb=new Builder();const path=[[8.7,5.1,-18.1],[8.9,4.95,-16.7],[9.2,3.0,-15.9],[9.4,2.85,-14.8],[9.7,.22,-13.7]];
 for(let i=0;i<path.length-1;i++){const p=path[i],q=path[i+1];for(let j=0;j<12;j++){const a=(j/12-.5)*1.78,z=((j+1)/12-.5)*1.78;wb.quad([p[0]+a,p[1],p[2]],[q[0]+a,q[1],q[2]],[q[0]+z,q[1],q[2]],[p[0]+z,p[1],p[2]],'#b1c9bf',44);}}
 for(let i=0;i<25;i++)wb.sphere(9.7+rnd(-1.1,1.1),.21+rnd(0,.06),-13.3+rnd(-.9,.8),rnd(.13,.36),.045,rnd(.16,.35),'#c1d5c6',44,9,4);
 for(const s of[-1,1])for(let i=0;i<9;i++){const z=-18.5+i*.59,y=4.5-i*.45;b.sphere(9+s*rnd(1.1,1.7),y,z,rnd(.5,.95),rnd(.5,.9),rnd(.6,1.0),'#929e8b',4,8,5,true);}
 disposeMesh(waterfallMesh);waterfallMesh=wb.mesh();
 fence(b,[-44,0,1],[-42,0,10],.60);
 buildValleyCountryside(b);
 for(let i=0;i<75;i++){const x=rnd(-39,-5),z=rnd(-8,17);if(roadDistance(x,z)>.9||nearestTrack(x,z).dist<1.0)continue;person(b,x,terrainH(x,z)+.09,z,['#a9815c','#486c5c','#b9b799','#977163'][i%4],rand()*TAU,rnd(.8,1.05));}
 // Telegraph poles carry real catenaries along the long outer main line.
 let prior=null;for(let d=4;d<common.length-3;d+=6.8){const a=common.at(d);if(inTunnel(common,d,2)){prior=null;continue;}const r=norm([a.f[2],0,-a.f[0]]),p=add(a.p,mul(r,1.58)),y=terrainH(p[0],p[2]);b.cylinder(p[0],y+1.48,p[2],.049,.033,2.96,'#816c43',22,8);b.matrix(basis([p[0],y,p[2]],a.f));b.box(0,2.66,0,1.0,.07,.09,'#7f6a44',22);b.pop();for(const s of[-1,1]){const c=add(p,[r[0]*s*.38,y-p[1]+2.79,r[2]*s*.38]);b.sphere(...c,.046,.061,.045,'#b4c5af',43,8,4);if(prior){for(let k=0;k<8;k++){const u=k/8,v=(k+1)/8,old=prior[s<0?0:1],p0=lerpV(old,c,u),p1=lerpV(old,c,v);p0[1]-=Math.sin(u*PI)*.2;p1[1]-=Math.sin(v*PI)*.2;b.beam(p0,p1,.0075,'#696f59',41,4);}}}prior=[add(p,[r[0]*-.38,y-p[1]+2.79,r[2]*-.38]),add(p,[r[0]*.38,y-p[1]+2.79,r[2]*.38])];}
}
function signals(b){
 signalModels.length=0;
 for(const [edge,d]of [[common,common.length-1.6],[common,common.length-48],[highline,9],[highline,highline.length-5],[lowline,lowline.length-6],[divisionEdges.freight,27],[divisionEdges.mountain,32]]){
  if(!edge)continue;const a=edge.at(d),r=norm([a.f[2],0,-a.f[0]]),p=add(a.p,mul(r,1.05)),y=terrainH(p[0],p[2]);b.cylinder(p[0],y+.95,p[2],.042,.033,1.9,'#435b48',41,9);b.box(p[0],y+1.97,p[2],.28,.68,.21,'#263f32',41);for(const dy of[1.80,2.07])b.cylinder(p[0],y+dy,p[2]+.135,.083,.083,.04,'#23382c',41,12,PI/2);signalModels.push(trans(p[0],y+1.82,p[2]+.163));
 }
 let b0=new Builder();b0.sphere(0,0,0,.065,.065,.021,'#b0d989',10,10,6);signalGreenMesh=b0.mesh();b0=new Builder();b0.sphere(0,.25,0,.065,.065,.021,'#ef7954',10,10,6);signalRedMesh=b0.mesh();b0=new Builder();crossingMesh=b0.mesh();crossingModel=I;
}
function buildWorld(){
 terrainStamps=objects.filter(o=>o.type==='hill');const old=seed;seed=72491;worldBuilding=true;houseZones.length=0;roads.length=0;lampPositions.length=0;signalModels.length=0;
 initTracks();atlasX=2;atlasY=2;atlasRow=0;actx.clearRect(0,0,2048,1024);initLabels();
 let b=createGround();makeRoad(b);
 for(const edge of edges)createRail(b,edge);
 for(const [a,z]of bridgeRange(highline,p=>p.p[1]>4.5&&p.p[2]<-15&&p.p[0]>-18&&p.p[0]<35))stoneViaduct(b,highline,a,z);
 if(divisionEdges.mountain)for(const [a,z]of bridgeRange(divisionEdges.mountain,p=>p.p[0]>-24&&p.p[0]<-4&&p.p[2]<-27))timberTrestle(b,divisionEdges.mountain,a,z);
 for(const edge of [common,highline,lowline,divisionEdges.freight].filter(Boolean))for(const [a,z]of bridgeRange(edge,p=>p.p[2]>-19&&Math.abs(p.p[0]-riverX(p.p[2]))<riverWidth(p.p[2])+.8))trussBridge(b,edge,a,z);
 for(const r of tunnelRanges)buildTunnelRange(b,r);
 seedDivisionScenery();buildValleyDetails(b);signals(b);
 for(const p of[[-29,3.0,25],[-16,3.0,25],[-4,3,25],[-28,3.4,10],[-17,3.4,10],[-2,3.4,4],[37,4.3,-5],[45,4,8]])lampPositions.push(p);
 disposeMesh(staticMesh);staticMesh=b.mesh();createWater();uploadAtlas();worldBuilding=false;seed=old;divisionSceneReady=true;
}
function buildSetDetails(){disposeMesh(setDetailMesh);setDetailMesh=null;shadowDirty=true;}
function createRoom(){
 // Expand the workshop around the board, leaving vertical human scale unchanged.
 const original=Builder.prototype.mesh;
 Builder.prototype.mesh=function(){const data=this.data;for(let i=0;i<data.length;i+=12){data[i]*=1.67;data[i+2]*=1.66;const n=norm([data[i+3]/1.67,data[i+4],data[i+5]/1.66]);data[i+3]=n[0];data[i+4]=n[1];data[i+5]=n[2];}return original.call(this);};
 try{workshopCreateRoom();}finally{Builder.prototype.mesh=original;}
 for(const d of roomDisplays)d.model=mm(roomScale,d.model);for(const p of roomLightPositions){p[0]*=1.67;p[2]*=1.66;}for(const d of roomDust){d.p[0]*=1.67;d.p[2]*=1.66;}
}
function visibleRoomWalls(){return roomWalls.filter(w=>w.which==='back'?cameraPos[2]>-80.5:w.which==='front'?cameraPos[2]<83.8:w.which==='left'?cameraPos[0]>-94.4:cameraPos[0]<94.4);}
function drawRoom(p=mainProgram,shadow=false){workshopDrawRoom(p,shadow);}

function makeGoodsVehicle(type){
 const b=new Builder();b.box(0,.32,0,.92,.14,2.34,'#3b4c40',42);smallAxle(b,-.76,.18,.66);smallAxle(b,.76,.18,.66);
 if(type==='box'){
  b.box(0,.90,0,.94,1.03,2.16,'#9b6845',22);b.box(0,1.45,0,1.02,.095,2.29,'#8b8c70',41);
  for(const s of[-1,1]){b.box(s*.488,.94,0,.021,.85,.73,'#795837',22);for(const z of[-.93,-.52,0,.52,.93])b.box(s*.495,.87,z,.025,.97,.029,'#c29665',41);b.box(s*.501,1.39,0,.022,.034,2.17,'#d1b17c',41);b.push(s*.51,1.09,.62,0,s*PI/2);sign(b,'engine',0,0,0,.27,.22);b.pop();}
 }else if(type==='tank'){
  b.cylinder(0,.87,0,.40,.40,1.91,'#859b93',41,28,PI/2);b.sphere(0,.87,.98,.4,.4,.18,'#9aafa1',41,18,10);b.sphere(0,.87,-.98,.4,.4,.18,'#9aafa1',41,18,10);for(const z of[-.59,.59])b.cylinder(0,.87,z,.414,.414,.045,'#475e4b',41,28,PI/2);b.cylinder(0,1.31,0,.13,.13,.19,'#566e59',41,16);b.box(0,1.43,0,.32,.035,.32,'#adbaa4',41);for(let y=.38;y<1.44;y+=.14)b.box(.49,y,0,.03,.025,.3,'#bdc6ac',41);
 }else{
  b.box(0,.84,0,.88,.95,1.55,'#824c38',22);barrelRoof(b,1.01,1.75,1.32,'#627760');for(const s of[-1,1]){b.box(s*.456,1.01,0,.019,.45,.62,'#d0c69f',22);b.box(s*.47,1.03,0,.020,.31,.43,'#657f72',43);for(const z of[-.95,.95])b.beam([s*.40,.37,z],[s*.40,.89,z],.018,'#b9b193',41,6);}for(const z of[-1.03,1.03])b.beam([-.4,.89,z],[.4,.89,z],.018,'#c1b896',41,6);
 }
 for(const z of[-1.24,1.24])b.beam([0,.30,z],[0,.30,z+Math.sign(z)*.18],.028,'#899780',41,6);return b.mesh();
}
function makeMountainRailcar(trailer=false){
 const b=new Builder(),length=trailer?2.40:2.95;
 b.box(0,.28,0,.87,.14,length,'#354d40',42);b.box(0,.64,0,.87,.60,length-.14,'#733e35',40);b.box(0,1.08,0,.87,.40,length-.16,'#dfcfaa',22);barrelRoof(b,.99,length+.08,1.31,'#536b5b');
 for(const s of[-1,1]){b.box(s*.445,.82,0,.016,.035,length-.1,'#d2b778',41);for(let i=0;i<(trailer?5:6);i++){const z=(i-((trailer?5:6)-1)/2)*.39;b.box(s*.447,1.095,z,.013,.294,.286,'#718e7d',43);b.box(s*.461,1.095,z-.15,.018,.34,.022,'#e7d9ad',22);}}
 for(const z of[-length*.5,length*.5]){b.box(0,1.055,z,.66,.35,.024,'#8ea08a',43);for(const x of[-.31,.31])b.cylinder(x,.73,z+Math.sign(z)*.04,.055,.055,.05,'#ffe2a8',10,12,PI/2);}
 for(const z of[-length*.33,length*.33])smallAxle(b,z,.17,.66);if(!trailer)b.cylinder(0,1.62,-.30,.052,.052,.38,'#6c7866',41,12);return b.mesh();
}
function buildTrains(){
 workshopBuildTrains();for(const mesh of[boxcarMesh,tankerMesh,brakevanMesh,railcarMesh,railcarTrailer,turntableDeck])disposeMesh(mesh);
 boxcarMesh=makeGoodsVehicle('box');tankerMesh=makeGoodsVehicle('tank');brakevanMesh=makeGoodsVehicle('brake');railcarMesh=makeMountainRailcar(false);railcarTrailer=makeMountainRailcar(true);
 const b=new Builder();b.box(0,-.14,0,1.31,.24,8.13,'#708775',41);for(let z=-3.9;z<4;z+=.20)b.box(0,-.012,z,1.25,.06,.175,'#a18c60',22);for(const x of[-.32,.32])b.box(x,.06,0,.06,.06,8.16,'#c6ceba',41);for(const s of[-1,1]){b.beam([s*.64,.78,-3.75],[s*.64,.78,3.75],.022,'#a8b598',41,6);for(let z=-3.7;z<=3.8;z+=.72)b.beam([s*.64,.06,z],[s*.64,.80,z],.018,'#a8b598',41,5);}b.box(.83,.43,-2.55,.53,.8,.88,'#3c5e4e',22);turntableDeck=b.mesh();
}
function circuitAt(edge,d){const s=((d%edge.length)+edge.length)%edge.length;return edge.at(s);}
function circuitMatrix(edge,d){const a=circuitAt(edge,d),front=circuitAt(edge,d+.60),rear=circuitAt(edge,d-.60);return basis(add(a.p,[0,.072,0]),norm(sub(front.p,rear.p)));}
function updateSimulation(dt){
 turntableAngle=mix(turntableAngle,turntableTarget,1-Math.exp(-dt*1.6));
 workshopUpdateSimulation(dt);
 if(paused||building)return;
 if(freightRunning&&divisionEdges.freight)freightDistance=(freightDistance+dt*1.32)%divisionEdges.freight.length;
 if(mountainRunning&&divisionEdges.mountain)mountainDistance=(mountainDistance+dt*.94)%divisionEdges.mountain.length;
}
function drawTrains(p=mainProgram){
 workshopDrawTrains(p);if(!boxcarMesh)return;
 const freight=divisionEdges.freight,mountain=divisionEdges.mountain;
 if(freight){draw(dieselMesh,circuitMatrix(freight,freightDistance),p);const cars=[boxcarMesh,boxcarMesh,tankerMesh,flatcarMesh,boxcarMesh,brakevanMesh];for(let i=0;i<cars.length;i++)draw(cars[i],circuitMatrix(freight,freightDistance-2.80*(i+1)),p);}
 if(mountain){draw(railcarMesh,circuitMatrix(mountain,mountainDistance),p);draw(railcarTrailer,circuitMatrix(mountain,mountainDistance-3.02),p);}
 for(const [key,stock,count] of[['siding1',boxcarMesh,3],['siding2',tankerMesh,2],['siding3',flatcarMesh,2],['siding4',boxcarMesh,1]]){
  const e=divisionEdges[key];if(!e)continue;for(let i=0;i<count;i++){const a=e.at(e.length-1.5-i*2.65);draw(stock,basis(add(a.p,[0,.072,0]),a.f),p);}
 }
 const turn=mm(trans(37,1.06,0),ry(turntableAngle));draw(turntableDeck,turn,p);const parked=mm(turn,trans(0,.072,1.0));draw(locoMesh,parked,p);for(const z of[-.70,-.15,.40])draw(wheelMesh,mm(parked,trans(0,.325,z)),p);draw(tenderMesh,mm(parked,trans(0,0,-2.75)),p);
 for(const [x,z,angle]of[[-28,10.9,PI/2],[-16,11.1,-PI/2],[-33,2.3,0],[-20,-3.0,PI],[-4.5,10.8,PI/2],[26,6.2,PI/2],[35,6.5,PI]])draw(carMesh,mm(trans(x,terrainH(x,z)+.06,z),ry(angle)),p);
 draw(waterfallMesh,I,p);
}
function rebuildGrid(){
 disposeMesh(gridMesh);const b=new Builder();
 for(let x=-54;x<=54;x+=2)for(let z=-34;z<34;z+=1){const w=x%10===0?.018:.008,y1=terrainH(x,z)+.029,y2=terrainH(x,z+1)+.029;b.quad([x-w,y1,z],[x-w,y2,z+1],[x+w,y2,z+1],[x+w,y1,z],x%10===0?'#bbc6a0':'#89986e',0);}
 for(let z=-34;z<=34;z+=2)for(let x=-54;x<54;x+=1){const w=z%10===0?.018:.008,y1=terrainH(x,z)+.029,y2=terrainH(x+1,z)+.029;b.quad([x,y1,z-w],[x,y1,z+w],[x+1,y2,z+w],[x+1,y2,z-w],z%10===0?'#bbc6a0':'#89986e',0);}
 gridMesh=b.mesh();
}
function fitBuild(plan=false){viewMode='overview';const portrait=innerWidth<821;orbit.pitch=plan?1.43:portrait?1.03:.99;orbit.yaw=plan?0:.09;orbit.distance=portrait?285:173;orbit.target=[0,2,-2];$('buildPlan').classList.toggle('chosen',plan);$('build3d').classList.toggle('chosen',!plan);}
function setView(mode,announce=true){
 workshopSetView(mode,announce);const phone=innerWidth<700&&innerHeight>innerWidth;
 if(mode==='room'){orbit.distance=phone?278:153;orbit.target=[0,-1.5,-1];orbit.pitch=phone?.75:.57;orbit.yaw=phone?.16:.38;activeDistrict='grand';}
 if(mode==='overview'){orbit.distance=phone?252:147;orbit.target=[0,2,-1];orbit.pitch=phone?1.02:.88;orbit.yaw=phone?.09:.26;activeDistrict='grand';}
 for(const btn of document.querySelectorAll('[data-district]'))btn.classList.toggle('chosen',btn.dataset.district===activeDistrict);
}
const DISTRICTS={
 grand:{name:'A whole world, connected.',subtitle:'THREE SERVICES · ONE LITTLE WORLD',target:[0,-1.5,-1],distance:153,pitch:.57,yaw:.38},
 town:{name:'The streets of Alder Vale.',subtitle:'OLD TOWN · ALDER VALE CENTRAL',target:[-21,2.0,4],distance:53,pitch:.63,yaw:.36},
 harbor:{name:'Down by the water.',subtitle:'WILLOW QUAY · THE LOWER VALLEY',target:[8.5,1.8,1],distance:47,pitch:.52,yaw:.37},
 summit:{name:'A railway above the clouds.',subtitle:'FERNHOLLOW SUMMIT · THE HIGH FORESTS',target:[-7.5,9.5,-25],distance:82,pitch:.40,yaw:.31},
 yard:{name:'Where the engines come home.',subtitle:'EASTBANK WORKS · SIX-ROAD ROUNDHOUSE',target:[36,1.2,0],distance:43,pitch:.79,yaw:.32}
};
function visitDistrict(key){
 const q=DISTRICTS[key];if(!q)return;
 if(building){enterBuild(false);}setView('overview',false);activeDistrict=key;const phone=innerWidth<700;
 orbit.target=q.target.slice();orbit.distance=q.distance*(phone?1.62:1);orbit.pitch=phone?Math.max(.70,q.pitch):q.pitch;orbit.yaw=phone?.12:q.yaw;
 if(key==='grand'){setView('room',false);activeDistrict='grand';}
 for(const btn of document.querySelectorAll('[data-district]'))btn.classList.toggle('chosen',btn.dataset.district===key);
 $('locationTitle').textContent=q.name;$('locationOverline').textContent=q.subtitle;$('layoutPanel').hidden=true;$('ambiencePanel').hidden=true;updateUI();
}
function updateCamera(dt){
 if(viewMode!=='station'&&viewMode!=='tour'){workshopUpdateCamera(dt);return;}
 let pos,target,fov=innerWidth<700?.94:.73;
 if(viewMode==='station'){pos=[-10,6.5,41];target=[-18,2.1,25.0];}
 else{
  const views=[{p:[70,85,151],t:[0,1,-2]},{p:[-1,11,38],t:[-18,2,25]},{p:[34,14,24],t:[7,2,1]},{p:[25,21,10],t:[0,8,-22]},{p:[55,16,24],t:[37,2,-1]},{p:[-31,14,17],t:[-24,2,4]}];
  const tt=(roomClock-tourStart)/14,i=Math.floor(tt)%views.length,a=views[i],q=views[(i+1)%views.length],t=smooth(.45,1,tt%1);pos=lerpV(a.p,q.p,t);target=lerpV(a.t,q.t,t);
  if(innerWidth<700)pos=add(target,mul(sub(pos,target),1.6));
 }
 const blend=1-Math.exp(-dt*3);cameraPos=lerpV(cameraPos,pos,blend);cameraTarget=lerpV(cameraTarget,target,blend);cameraNear=clamp(len(sub(cameraPos,cameraTarget))*.004,.06,.7);cameraProjection=perspective(fov,screenW/screenH,cameraNear,500);VP=mm(cameraProjection,lookAt(cameraPos,cameraTarget));
}
function renderCatalog(){workshopRenderCatalog();}
function drawMap(){
 if($('layoutPanel').hidden)return;
 const c=mapctx,w=c.canvas.width,h=c.canvas.height;c.clearRect(0,0,w,h);const tx=x=>26+(x+55)/110*(w-52),tz=z=>21+(z+35)/70*(h-42);
 c.lineCap='round';c.lineJoin='round';c.fillStyle='#adcab015';c.beginPath();for(let z=-18;z<=34;z++){const x=riverX(z)-riverWidth(z);z===-18?c.moveTo(tx(x),tz(z)):c.lineTo(tx(x),tz(z));}for(let z=34;z>=-18;z--)c.lineTo(tx(riverX(z)+riverWidth(z)),tz(z));c.closePath();c.fill();
 function path(edge,color,width){if(!edge)return;c.strokeStyle=color;c.lineWidth=width;c.beginPath();for(let d=0;d<=edge.length;d+=.7){const p=edge.at(d).p;d===0?c.moveTo(tx(p[0]),tz(p[2])):c.lineTo(tx(p[0]),tz(p[2]));}let p=edge.at(edge.length).p;c.lineTo(tx(p[0]),tz(p[2]));c.stroke();}
 for(const edge of edges)path(edge,'#677e704f',1.7);
 path(divisionEdges.freight,'#a6c9b4',2.2);path(divisionEdges.mountain,'#d4a58f',2.1);path(common,'#e3c283',2.7);path(chosenRoute==='highline'?highline:lowline,'#e3c283',2.7);
 function marker(p,color,r){c.fillStyle=color;c.beginPath();c.arc(tx(p[0]),tz(p[2]),r,0,TAU);c.fill();}
 for(const o of(typeof selectedCollection!=='undefined'&&selectedCollection.valley?collectionOffsets(selectedCollection.valley):offsets))marker(where(travel-o).p,o?'#d0bd92':'#ffdfa0',o?2.4:4.7);
 if(divisionEdges.freight)marker(circuitAt(divisionEdges.freight,freightDistance).p,'#c5efda',4.4);
 if(divisionEdges.mountain)marker(circuitAt(divisionEdges.mountain,mountainDistance).p,'#f4be9e',4.4);
 c.font='11px Arial';c.fillStyle='#d2d6bc';c.textAlign='center';for(const [text,x,z]of[['ALDER VALE',-23,4],['WILLOW QUAY',6,7],['EASTBANK',36,-4],['SUMMIT',-7,-33]])c.fillText(text,tx(x),tz(z));
}
function updateUI(){
 workshopUpdateUI();if(!divisionSceneReady)return;
 if((viewMode==='overview'||viewMode==='room')&&!building){const d=DISTRICTS[activeDistrict]||DISTRICTS.grand;$('locationTitle').textContent=d.name;$('locationOverline').textContent=d.subtitle;$('locationDetail').textContent=activeDistrict==='grand'?'Mountain villages, working yards, and the long way home.':'Drag to explore. Every little place has a closer view.';}
 if(viewMode==='station'){$('locationTitle').textContent='The long platform.';$('locationOverline').textContent='ALDER VALE CENTRAL · EXPRESS SERVICE';}
 $('networkMetrics').textContent=`${edges.length} editable alignments · ${objects.length} scenery pieces · 3 independent services`;
 $('freightToggle').setAttribute('aria-pressed',String(freightRunning));$('mountainToggle').setAttribute('aria-pressed',String(mountainRunning));
 $('routeLabel').textContent=chosenRoute==='highline'?'Mountain viaduct ↗':'River cut-off ↗';
}
function snapshot(){return{...workshopSnapshot(),division:'grand-v2',services:{freight:freightRunning,mountain:mountainRunning}};}
function applySnapshot(s,initial=false){workshopApplySnapshot(s,initial);if(s.services){freightRunning=s.services.freight!==false;mountainRunning=s.services.mountain!==false;}if(!initial)updateUI();}
function bindControls(){
 workshopBindControls();
 for(const b of document.querySelectorAll('[data-district]'))b.onclick=()=>visitDistrict(b.dataset.district);
 $('divisionNetwork').onclick=toggleDiagram;$('closeNetwork').onclick=()=>{$('layoutPanel').hidden=true;};$('networkRoute').onclick=switchRoute;
 $('freightToggle').onclick=()=>{freightRunning=!freightRunning;updateUI();saveProjectSoon();};$('mountainToggle').onclick=()=>{mountainRunning=!mountainRunning;updateUI();saveProjectSoon();};
 $('turntableBtn').onclick=()=>{indexTurntable();toast('Turning the engine at Eastbank Works.');visitDistrict('yard');};
 $('map').onclick=e=>{const r=$('map').getBoundingClientRect(),x=(e.clientX-r.left)/r.width*110-55,z=(e.clientY-r.top)/r.height*70-35;let best='grand',distance=999;for(const [key,q]of Object.entries(DISTRICTS)){if(key==='grand')continue;const dd=Math.hypot(q.target[0]-x,q.target[2]-z);if(dd<distance){distance=dd;best=key;}}visitDistrict(best);};
 window.DIVISION={visit:visitDistrict,get state(){return{alignments:edges.length,length:edges.reduce((a,e)=>a+e.length,0),tunnels:tunnelRanges.length,freightDistance,mountainDistance,freightRunning,mountainRunning,turntableAngle,objects:objects.length,board:{...BOARD}}},get routes(){return Object.fromEntries(edges.map(e=>[e.name,{length:e.length,curves:e.curves.length}]));},turn:()=>{indexTurntable();},setServices:(f,m)=>{freightRunning=!!f;mountainRunning=!!m;}};
}

function start(){try{initGL();prepareWorkshopStartup();buildWorld();createRoom();initializeWorkshop();buildTrains();initJourney();initSteam();setView('room',false);cameraPos=add(orbit.target,[Math.sin(orbit.yaw)*Math.cos(orbit.pitch)*orbit.distance,Math.sin(orbit.pitch)*orbit.distance,Math.cos(orbit.yaw)*Math.cos(orbit.pitch)*orbit.distance]);cameraTarget=orbit.target.slice();let savedPrefs=null;try{savedPrefs=JSON.parse(localStorage.getItem('alder-valley-grand-prefs-v1')||'null');}catch{}restoreLightingPrefs(savedPrefs);if(savedPrefs&&typeof savedPrefs==='object'&&!Array.isArray(savedPrefs)){if(savedPrefs.route==='lowline'){chosenRoute='lowline';$('routeLabel').textContent='The riverside ↗';$('routeButtonLabel').textContent='Riverside';$('routeBtn').classList.add('active')}setThrottle(savedPrefs.throttle??42);}bindControls();document.querySelector('.engine-medallion').onclick=()=>setView('engine');document.querySelector('.engine-medallion').style.cursor='pointer';for(let i=0;i<14;i++){emitSteam();steam[steam.length-1].age=i*.13;steam[steam.length-1].p[1]+=i*.10;steam[steam.length-1].size+=i*.035}updateCamera(1);updateUI();render();$('loader').classList.add('done');window.RAILWAY={get state(){return{route:chosenRoute,edge:leadInfo.edge.name,d:leadInfo.d,travel,speed,throttle,paused,stopRequested,atStation,laps:completedLaps,view:viewMode,night,lightingMode,mood:lightingMoodForNight(targetNight),targetNight,roomLightTarget:roomLampTarget,geometry:staticMesh.count/3,roomGeometry:roomFurnitureMesh.count/3,msaa:msaaFbo?msaaSamples:0,roomLights:roomLampLevel,rain:rainAmount,cam:cameraPos.slice()}},setMood,setView,setThrottle,switchRoute,toggleStop,togglePause,toggleLight,step:seconds=>{for(let t=0;t<seconds;t+=1/60)updateSimulation(1/60);updateUI()},inspect:()=>({common:common.length,highline:highline.length,lowline:lowline.length,tunnel:[tunnelStart,tunnelEnd],vehicles:offsets.map(o=>where(travel-o).edge.name)}),render};window.READY=true;window.RAILWAY.orbitTo=(yaw,pitch,distance,target)=>{viewMode='room';orbit.yaw=yaw;orbit.pitch=pitch;orbit.distance=distance;if(target)orbit.target=target;};requestAnimationFrame(animate)}catch(e){console.error(e);$('loader').classList.add('done');$('error').style.display='block';$('error').textContent=e.message||String(e)}}
