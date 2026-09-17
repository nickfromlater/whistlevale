// BRIARWATCH_ATMOSPHERE_BEGIN: opt-in materials; other rooms keep their shading.
// 92 = estate sky, 93 = exterior models, 94/95/96 = gallery plaster,
// 98 = estate windows. No textures, new uniforms or per-frame geometry.
vec3 briarEstateSky(vec2 uv,float dusk,float deepNight){
 float height=clamp(uv.y,0.,1.);
 vec3 day=mix(vec3(.66,.69,.48),vec3(.23,.42,.49),smoothstep(.10,.94,height));
 vec3 blueHour=mix(vec3(.10,.075,.062),vec3(.015,.037,.067),smoothstep(.12,.88,height));
 vec3 dark=mix(vec3(.020,.034,.038),vec3(.005,.015,.032),height);
 vec3 sky=mix(day,mix(blueHour,dark,deepNight),dusk);
 // A still crescent and sparse stars belong to the sky, not the room lamps.
 vec2 moon=(uv-vec2(1.68,.77))*vec2(1.,1.84);float d=length(moon),aa=max(fwidth(d),.0006);
 float disc=1.-smoothstep(.033-aa,.033+aa,d),cut=1.-smoothstep(.030-aa,.030+aa,length(moon-vec2(.016,.007)));
 float crescent=disc*(1.-cut);sky+=vec3(.39,.46,.40)*crescent*dusk;
 sky+=vec3(.013,.024,.030)*exp(-d*d*230.)*dusk;
 vec2 grid=uv*vec2(69.,116.),cell=floor(grid),p=fract(grid)-.5;
 float star=smoothstep(.985,1.,meridianHash(cell))*exp(-dot(p,p)*100.);
 sky+=vec3(.15,.21,.23)*star*smoothstep(.40,.94,height)*dusk;
 return sky;
}
float briarPracticalWash(float material,vec2 uv){
 float x=abs(uv.x),y=uv.y,dx=material==94.?min(abs(x-19.),abs(x-65.)):material==95.?min(abs(x-15.),abs(x-47.)):min(abs(x-30.),abs(x-55.));
 float below=max(0.,22.4-y),spread=1.9+below*.28;
 vec2 q=vec2(dx/spread,(y-22.4)/(y>22.4?3.0:10.5));
 return exp(-dot(q,q)*1.35);
}
// BRIARWATCH_ATMOSPHERE_END
