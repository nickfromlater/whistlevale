import * as THREE from 'three';

// Closed, sculpted background ridges. Each layer has its own geological rhythm
// and atmospheric colour; they do not share the foreground's uniform fog.
export function createAtmosphere(scene, shared) {
  const group=new THREE.Group();group.name='Three receding mountain ranges';scene.add(group);
  const materials=[];
  const layers=[{radius:145,depth:40,height:42,seed:.7,haze:.32},
    {radius:235,depth:62,height:66,seed:2.4,haze:.58},
    {radius:370,depth:85,height:103,seed:4.8,haze:.78}];
  for(const [layer,config] of layers.entries()){
    const {radius,depth,height,seed,haze}=config,positions=[],indices=[],cols=256,rows=12;
    for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
      const a=i/cols*Math.PI*2,f=j/rows;
      const silhouette=.64+.13*Math.sin(a*5+seed)+.11*Math.sin(a*9+seed*.7)+.05*Math.cos(a*17-seed);
      const shoulder=Math.pow(Math.max(0,Math.sin(f*Math.PI)),.74);
      const r=radius+(f-.5)*depth;
      positions.push(Math.cos(a)*r,-30+height*silhouette*shoulder,Math.sin(a)*r);
      if(i<cols&&j<rows){const a=j*(cols+1)+i,b=a+cols+1;indices.push(a,b,a+1,a+1,b,b+1);}
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();
    const material=new THREE.ShaderMaterial({uniforms:{uNight:shared.night,uRain:{value:0},uHaze:{value:haze},uSky:{value:new THREE.Color('#aabbbc')},uWarm:{value:1},uSunDir:shared.sunDir??{value:new THREE.Vector3(-.6,.5,.4).normalize()},uSunAmt:shared.sunAmt??{value:1}},
      vertexShader:`varying vec3 vWorld;varying vec3 vNormal;void main(){vWorld=(modelMatrix*vec4(position,1.)).xyz;vNormal=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.);}`,
      fragmentShader:`uniform float uNight;uniform float uRain;uniform float uHaze;uniform float uWarm;uniform vec3 uSky;uniform vec3 uSunDir;uniform float uSunAmt;varying vec3 vWorld;varying vec3 vNormal;void main(){
        vec3 nrm=normalize(vNormal);
        float slope=.76+.24*max(0.,dot(nrm,normalize(vec3(-.6,.5,.4))));
        vec3 land=mix(vec3(.047,.111,.093),vec3(.009,.021,.038),uNight)*slope;
        float valley=1.-smoothstep(-5.,26.,vWorld.y);float haze=clamp(uHaze+valley*.18+uRain*.22,0.,.97);
        vec3 sky=mix(uSky*.90,vec3(.012,.028,.053),uNight*(1.-smoothstep(.12,.50,uRain)));
        // Successive ranges shed saturation and local contrast toward the sky,
        // while remaining sculpted: shading survives inside the haze.
        float lum=dot(land,vec3(.299,.587,.114));
        land=mix(vec3(lum),land,1.-haze*.42);
        vec3 col=mix(land,sky,haze);
        // Low sun rims the sun-facing shoulders; shaded flanks stay cool.
        float rim=pow(max(dot(nrm,uSunDir),0.),2.2)*(.4+.6*max(0.,nrm.y));
        col+=vec3(.34,.17,.05)*rim*uWarm*uSunAmt*(1.-uNight)*(1.-uRain*.6)*(1.-haze*.65)*.30;
        col+=vec3(.045,.026,.004)*uWarm*(1.-uNight)*max(0.,nrm.y)*.2;
        gl_FragColor=vec4(col,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,side:THREE.DoubleSide});
    const mesh=new THREE.Mesh(geometry,material);mesh.name=`Atmospheric ridge ${layer+1}`;mesh.castShadow=false;group.add(mesh);materials.push(material);
  }
  return {group,update(rain,warm,sky){for(const m of materials){m.uniforms.uRain.value=rain;m.uniforms.uWarm.value=warm;m.uniforms.uSky.value.copy(sky);}}};
}

export function createMountainSky(shared) {
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute([-1,-1,0,3,-1,0,-1,3,0],3));
  const uniforms={uTime:shared.time,uNight:shared.night,uRain:{value:0},uWarm:{value:1},uTop:{value:new THREE.Color('#758e9d')},uBottom:{value:new THREE.Color('#d9ceb1')},uInvProjection:{value:new THREE.Matrix4()},uCameraBasis:{value:new THREE.Matrix3()},uMoon:{value:new THREE.Vector3(-.04,.20,-1).normalize()},uSunDir:shared.sunDir??{value:new THREE.Vector3(-.5,.8,.5).normalize()},uSunAmt:shared.sunAmt??{value:1}};
  const material=new THREE.ShaderMaterial({uniforms,depthTest:false,depthWrite:false,
    vertexShader:`varying vec2 vUv;void main(){vUv=position.xy*.5+.5;gl_Position=vec4(position,1.);}`,
    fragmentShader:`varying vec2 vUv;uniform float uTime,uNight,uRain,uWarm,uSunAmt;uniform vec3 uTop,uBottom,uMoon,uSunDir;uniform mat4 uInvProjection;uniform mat3 uCameraBasis;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
      void main(){vec4 ray=uInvProjection*vec4(vUv*2.-1.,1.,1.);vec3 dir=normalize(uCameraBasis*ray.xyz);
        float elevation=max(0.,dir.y);vec3 col=mix(uBottom,uTop,smoothstep(-.10,.55,dir.y));
        // Restrained solar presence: a compact disk, gentle forward scatter, and
        // warm air near the horizon on the sunward side. Hidden by night/rain.
        float sunDot=dot(dir,uSunDir);
        vec3 sunCol=mix(vec3(1.,.87,.64),vec3(1.,.56,.26),uWarm);
        float sunVis=uSunAmt*(1.-uNight)*(1.-smoothstep(.04,.5,uRain));
        float sunAngle=acos(clamp(sunDot,-1.,1.));
        float sunDisk=1.-smoothstep(.0145,.0185,sunAngle);
        col+=sunCol*sunDisk*(2.4-1.5*uWarm)*sunVis;
        col+=sunCol*pow(max(sunDot,0.),64.)*(.10+.16*uWarm)*sunVis;
        col+=sunCol*exp(-elevation*6.5)*pow(max(sunDot*.5+.5,0.),3.)*(.05+.17*uWarm)*sunVis;
        col+=vec3(.98,.72,.42)*exp(-elevation*10.)*(.03+.05*uWarm)*sunVis;
        vec2 cloudUV=dir.xz/max(.15,dir.y+.34)*1.6+vec2(uTime*.006,uTime*.001);
        float cloud=noise(cloudUV*2.)*.58+noise(cloudUV*4.3+7.)*.27+noise(cloudUV*9.)*.15;
        float wisps=smoothstep(.51,.75,cloud)*smoothstep(-.05,.14,dir.y);
        vec3 dayCloud=mix(vec3(.47,.52,.51),vec3(.76,.57,.34),uWarm*.6);col=mix(col,dayCloud,wisps*(.10+.32*uRain)*(1.-uNight));
        vec2 starUV=vec2(atan(dir.z,dir.x),asin(clamp(dir.y,-1.,1.)))*vec2(170.,250.);
        vec2 cell=floor(starUV),local=fract(starUV)-.5;float star=step(.9983,hash(cell))*exp(-dot(local,local)*105.);
        star*=smoothstep(.07,.44,dir.y)*(1.-wisps*.96)*(1.-uRain)*uNight;
        col+=vec3(.24,.31,.39)*star*(.8+.2*sin(uTime*.27+hash(cell)*20.));
        float angle=acos(clamp(dot(dir,uMoon),-1.,1.));float radius=.011;
        float disk=1.-smoothstep(radius-.00045,radius+.00045,angle);
        vec3 east=normalize(cross(vec3(0,1,0),uMoon)),north=normalize(cross(uMoon,east));vec2 moonUV=vec2(dot(dir,east),dot(dir,north))/radius;
        float maria=noise(moonUV*3.2)*.20+noise(moonUV*8.1)*.08;
        float cloudVeil=1.-wisps*.75;float visibility=smoothstep(.25,.95,uNight)*(1.-smoothstep(.08,.4,uRain))*cloudVeil;
        col+=vec3(.72,.83,1.)*disk*(2.7-maria*3.2)*visibility;
        float halo=exp(-angle*angle/ .0032)*.085+exp(-angle*angle/.020)*.013;
        col+=vec3(.29,.44,.69)*halo*visibility;
        col+=vec3(.021,.032,.053)*wisps*uNight*(.20+exp(-angle*angle/.04)*.75);
        gl_FragColor=vec4(col,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`});
  const mesh=new THREE.Mesh(geometry,material);mesh.frustumCulled=false;mesh.renderOrder=-100000;
  mesh.onBeforeRender=(_r,_s,camera)=>{uniforms.uInvProjection.value.copy(camera.projectionMatrixInverse);uniforms.uCameraBasis.value.setFromMatrix4(camera.matrixWorld);};
  return {mesh,uniforms};
}
