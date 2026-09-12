import * as THREE from 'three';

// A small HDR highlight chain. Only super-white light contributes to the glow;
// the sharp scene and dark surfaces are sampled independently in the final pass.
export function createLuminousResponse(renderer) {
  const options={type:THREE.HalfFloatType,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,depthBuffer:false};
  const sceneTarget=new THREE.WebGLRenderTarget(1,1,{...options,depthBuffer:true});
  const bloomA=new THREE.WebGLRenderTarget(1,1,options),bloomB=new THREE.WebGLRenderTarget(1,1,options);
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute([-1,-1,0,3,-1,0,-1,3,0],3));
  const vertex=`varying vec2 vUv;void main(){vUv=position.xy*.5+.5;gl_Position=vec4(position,1.);}`;
  const filter=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,toneMapped:false,uniforms:{uSource:{value:null},uStep:{value:new THREE.Vector2()},uThreshold:{value:1}},vertexShader:vertex,
    fragmentShader:`varying vec2 vUv;uniform sampler2D uSource;uniform vec2 uStep;uniform float uThreshold;
      vec3 sampleLight(vec2 uv){vec3 c=texture2D(uSource,uv).rgb;float l=max(c.r,max(c.g,c.b));return c*mix(1.,smoothstep(1.35,2.7,l),uThreshold);}
      void main(){vec3 c=sampleLight(vUv)*.227027;c+=(sampleLight(vUv+uStep*1.384615)+sampleLight(vUv-uStep*1.384615))*.316216;c+=(sampleLight(vUv+uStep*3.230769)+sampleLight(vUv-uStep*3.230769))*.070270;gl_FragColor=vec4(c,1.);}`});
  const output=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,toneMapped:false,uniforms:{uScene:{value:sceneTarget.texture},uBloom:{value:bloomB.texture},uStrength:{value:.06},uExposure:{value:1}},vertexShader:vertex,
    fragmentShader:`varying vec2 vUv;uniform sampler2D uScene,uBloom;uniform float uStrength,uExposure;
      vec3 filmic(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
      void main(){vec3 sharp=texture2D(uScene,vUv).rgb,glow=texture2D(uBloom,vUv).rgb;gl_FragColor=vec4(filmic((sharp+glow*uStrength)*uExposure),1.);
        #include <colorspace_fragment>
      }`});
  const quad=new THREE.Mesh(geometry,filter),postScene=new THREE.Scene(),postCamera=new THREE.Camera();quad.frustumCulled=false;postScene.add(quad);
  const size=new THREE.Vector2();let width=0,height=0;
  return {render(scene,camera,night){
    renderer.getDrawingBufferSize(size);
    if(size.x!==width||size.y!==height){width=size.x;height=size.y;sceneTarget.setSize(width,height);bloomA.setSize(Math.max(1,Math.floor(width/4)),Math.max(1,Math.floor(height/4)));bloomB.setSize(bloomA.width,bloomA.height);}
    const previous=renderer.getRenderTarget();renderer.setRenderTarget(sceneTarget);renderer.render(scene,camera);
    quad.material=filter;filter.uniforms.uSource.value=sceneTarget.texture;filter.uniforms.uStep.value.set(2/width,0);filter.uniforms.uThreshold.value=1;
    renderer.setRenderTarget(bloomA);renderer.render(postScene,postCamera);
    filter.uniforms.uSource.value=bloomA.texture;filter.uniforms.uStep.value.set(0,1.6/bloomA.height);filter.uniforms.uThreshold.value=0;
    renderer.setRenderTarget(bloomB);renderer.render(postScene,postCamera);
    quad.material=output;output.uniforms.uStrength.value=.018+night*.17;output.uniforms.uExposure.value=renderer.toneMappingExposure;
    renderer.setRenderTarget(previous);renderer.render(postScene,postCamera);
  },dispose(){sceneTarget.dispose();bloomA.dispose();bloomB.dispose();geometry.dispose();filter.dispose();output.dispose();}};
}
