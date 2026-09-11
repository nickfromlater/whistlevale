import * as THREE from 'three';

// Keep a fixed set of lights/programs through weather transitions. The local
// lights have finite reach: evaluating their full BRDF outside it adds no light.
export function configureSurfaceLighting() {
  const direct = 'RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );';
  THREE.ShaderChunk.lights_fragment_begin = THREE.ShaderChunk.lights_fragment_begin.replaceAll(direct, `if ( directLight.visible ) { ${direct} }`);
}

// GPU queries are asynchronous. Never wait for a GPU result or read pixels in
// the animation loop. Diagnostics are available on <html> without a scene UI.
export function createRenderBudget(renderer) {
  const gl = renderer.getContext();
  const timer = gl.getExtension('EXT_disjoint_timer_query_webgl2');
  const pending = [];
  const nativeRatio = Math.min(devicePixelRatio, 1.5);
  let active = null, gpuMs = 0, cpuMs = 0, last = 0, started = 0, reportAt = 0;
  let frames = 0, calls = 0, triangles = 0, reflections = 0, shadowPasses = 0;
  let slowSince = 0, fastSince = 0, lastResize = 0;
  renderer.info.autoReset = false;
  return {
    begin(now, frameStarted = performance.now()) {
      while (pending.length && gl.getQueryParameter(pending[0], gl.QUERY_RESULT_AVAILABLE)) {
        const query = pending.shift();
        if (!gl.getParameter(timer.GPU_DISJOINT_EXT)) {
          const ms = gl.getQueryParameter(query, gl.QUERY_RESULT) / 1e6;
          gpuMs = gpuMs ? THREE.MathUtils.lerp(gpuMs, ms, .12) : ms;
        }
        gl.deleteQuery(query);
      }
      // Reduce supersampling only after sustained GPU pressure. Long hysteresis
      // prevents resolution oscillations while moving between weather modes.
      const ratio = renderer.getPixelRatio();
      slowSince = gpuMs > 25 ? slowSince || now : 0;
      fastSince = gpuMs > 0 && gpuMs < 13 ? fastSince || now : 0;
      let next = ratio;
      if (slowSince && now - slowSince > 2500 && now - lastResize > 6000) next = Math.max(1, ratio - .25);
      else if (fastSince && now - fastSince > 12000 && now - lastResize > 15000) next = Math.min(nativeRatio, ratio + .25);
      if (next !== ratio) { renderer.setPixelRatio(next); lastResize = now; slowSince = fastSince = 0; }
      renderer.info.reset();
      started = frameStarted;
      if (timer && pending.length < 4) { active = gl.createQuery(); gl.beginQuery(timer.TIME_ELAPSED_EXT, active); }
      if (!reportAt) reportAt = now;
      last = now;
    },
    end(reflected, shadowed, vegetation) {
      if (active) { gl.endQuery(timer.TIME_ELAPSED_EXT); pending.push(active); active = null; }
      cpuMs = THREE.MathUtils.lerp(cpuMs, performance.now() - started, .1);
      frames++; calls += renderer.info.render.calls; triangles += renderer.info.render.triangles;
      reflections += Number(reflected); shadowPasses += Number(shadowed);
      if (last - reportAt < 1500) return;
      Object.assign(document.documentElement.dataset, {
        fps: (frames * 1000 / (last - reportAt)).toFixed(1),
        gpuMs: timer ? gpuMs.toFixed(1) : 'unavailable', cpuMs: cpuMs.toFixed(1),
        drawCalls: Math.round(calls / frames), triangles: Math.round(triangles / frames),
        reflectionHz: (reflections * 1000 / (last - reportAt)).toFixed(1),
        shadowHz: (shadowPasses * 1000 / (last - reportAt)).toFixed(1),
        pixelRatio: renderer.getPixelRatio(), nearTrees: vegetation.stats().nearTrees
      });
      frames = calls = triangles = reflections = shadowPasses = 0; reportAt = last;
    }
  };
}
