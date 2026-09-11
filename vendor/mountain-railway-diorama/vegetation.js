import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Hand-shaped reusable botanical meshes. Every specimen is built from bent,
// tapering branch profiles and individual jagged sprays, never solid crown blobs.
const TAU = Math.PI * 2;
const UP = new THREE.Vector3(0, 1, 0);
const _v = new THREE.Vector3();
function random(seed) {
  let a = seed >>> 0;
  return () => { a += 0x6D2B79F5; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function mix(a, b, t) { return a + (b - a) * t; }
function vec(x, y, z) { return new THREE.Vector3(x, y, z); }

class BotanicalGeometry {
  constructor() { this.p = []; this.c = []; this.flex = []; this.flutter = []; this.ix = []; }
  vertex(p, color, bend = 0, flutter = 0) {
    const n = this.p.length / 3;
    this.p.push(p.x, p.y, p.z); this.c.push(color.r, color.g, color.b);
    this.flex.push(bend); this.flutter.push(flutter);
    return n;
  }
  triangle(a, b, c) { this.ix.push(a, b, c); }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute('aFlex', new THREE.Float32BufferAttribute(this.flex, 1));
    g.setAttribute('aFlutter', new THREE.Float32BufferAttribute(this.flutter, 1));
    g.setIndex(this.ix); g.computeVertexNormals(); g.computeBoundingSphere();
    return g;
  }
  limb(points, radii, color, height, sides = 7, stiffness = 0.065) {
    const first = this.p.length / 3;
    for (let j = 0; j < points.length; j++) {
      const tangent = points[Math.min(j + 1, points.length - 1)].clone().sub(points[Math.max(j - 1, 0)]).normalize();
      const axis = Math.abs(tangent.y) < 0.94 ? UP : vec(1, 0, 0);
      const side = new THREE.Vector3().crossVectors(tangent, axis).normalize();
      const other = new THREE.Vector3().crossVectors(tangent, side).normalize();
      for (let k = 0; k < sides; k++) {
        const a = k / sides * TAU;
        const r = radii[j] * (1 + Math.sin(k * 5.19 + j * 0.51) * 0.1);
        const p = points[j].clone().addScaledVector(side, Math.cos(a) * r).addScaledVector(other, Math.sin(a) * r * 0.9);
        const col = color.clone().multiplyScalar(0.83 + Math.cos(a + 0.8) * 0.1 + j / points.length * 0.18);
        this.vertex(p, col, Math.pow(Math.max(0, p.y) / height, 2) * stiffness, 0);
        if (j) {
          const b = first + j * sides + k, c = first + j * sides + (k + 1) % sides;
          this.triangle(b - sides, c - sides, b); this.triangle(c - sides, c, b);
        }
      }
    }
    for (let k = 1; k < sides - 1; k++) this.triangle(first, first + k + 1, first + k);
    const last = first + (points.length - 1) * sides;
    for (let k = 1; k < sides - 1; k++) this.triangle(last, last + k, last + k + 1);
  }
  // A narrow branch spray with an uneven sawtooth silhouette and a folded spine.
  spray(origin, direction, width, length, color, seed, flex, kind = 'cedar') {
    const rng = random(seed);
    const forward = direction.clone().normalize();
    const lateral = new THREE.Vector3().crossVectors(forward, UP).normalize();
    if (lateral.lengthSq() < .01) lateral.set(1, 0, 0);
    const normal = new THREE.Vector3().crossVectors(lateral, forward).normalize();
    const segments = kind === 'pine' ? 7 : 6;
    const bases = [];
    for (let k = 0; k <= segments; k++) {
      const t = k / segments;
      const spread = Math.pow(Math.sin(Math.PI * t), .65) * width * (k % 2 ? .68 : 1.08);
      const p = origin.clone().addScaledVector(forward, t * length).addScaledVector(normal, Math.sin(t * Math.PI) * length * .085);
      const tone = .83 + rng() * .28 + t * .12;
      const c = color.clone().multiplyScalar(tone);
      const center = this.vertex(p, c, flex * (.55 + t * .45), .1 + .35 * t);
      const a = p.clone().addScaledVector(lateral, -spread * (.82 + rng() * .26)).addScaledVector(normal, -spread * .17);
      const b = p.clone().addScaledVector(lateral, spread * (.82 + rng() * .26)).addScaledVector(normal, -spread * .12);
      const left = this.vertex(a, c.clone().multiplyScalar(.86), flex * (.55 + t * .45), .3 + t * .55);
      const right = this.vertex(b, c, flex * (.55 + t * .45), .3 + t * .55);
      if (k) {
        const prev = bases[k - 1];
        this.triangle(prev[0], left, center); this.triangle(prev[0], prev[1], left);
        this.triangle(prev[0], center, right); this.triangle(prev[0], right, prev[2]);
      }
      bases.push([center, left, right]);
    }
  }
  // An authored compound bough: interlocking needle lobes form one folded
  // silhouette. Interior twigs are deliberately omitted where needles hide them.
  bough(origin, direction, width, length, color, seed, flex, pine = false) {
    const rng = random(seed), forward = direction.clone().normalize();
    const side = new THREE.Vector3().crossVectors(forward, UP).normalize();
    const normal = new THREE.Vector3().crossVectors(side, forward).normalize();
    const outline = pine
      ? [[0,0],[.18,-.55],[.31,-.47],[.43,-.95],[.60,-.77],[.78,-.84],[.78,-.39],[1,0],[.84,.39],[.74,.82],[.54,.73],[.39,1],[.30,.51],[.13,.53]]
      : [[0,0],[.22,-.36],[.22,-.68],[.38,-.54],[.42,-1],[.58,-.77],[.74,-.72],[.70,-.45],[.95,-.28],[1,0],[.9,.29],[.7,.43],[.74,.66],[.54,.82],[.40,1],[.35,.6],[.2,.7],[.23,.35]];
    const crown = origin.clone().addScaledVector(forward, length * .51).addScaledVector(normal, width * .20);
    const center = this.vertex(crown, color.clone().multiplyScalar(1.03), flex * .75, .18);
    const ring = outline.map(([t, w], i) => {
      // Jitter the radius about the fan center. Independent sideways jitter
      // can reverse two neighboring angles and create intersecting triangles.
      const radialJitter = .9 + rng() * .2;
      const point = origin.clone().addScaledVector(forward, (.51 + (t - .51) * radialJitter) * length)
        .addScaledVector(side, w * width * radialJitter)
        .addScaledVector(normal, -Math.abs(w) * width * (.10 + rng() * .08));
      return this.vertex(point, color.clone().multiplyScalar(.68 + rng() * .38 + t * .14), flex * (.5 + t * .5), .2 + t * .3);
    });
    ring.forEach((p, i) => this.triangle(center, p, ring[(i + 1) % ring.length]));
  }
  // True small leaves with five pointed lobes, a raised midrib and cupped edges.
  mapleLeaf(center, size, rotation, inclination, color, flex) {
    const outline = [[0, 1.1], [.19, .49], [.64, .75], [.47, .23], [.91, .21], [.39, -.09], [.32, -.49], [0, -.22], [-.32, -.49], [-.39, -.09], [-.91, .21], [-.47, .23], [-.64, .75], [-.19, .49]];
    const a = vec(Math.cos(rotation), 0, Math.sin(rotation));
    const b = vec(-Math.sin(rotation) * Math.cos(inclination), Math.sin(inclination), Math.cos(rotation) * Math.cos(inclination));
    const c = this.vertex(center.clone().add(vec(0, size * .095, 0)), color, flex, .75);
    const ring = outline.map(([x, y], i) => this.vertex(center.clone().addScaledVector(a, x * size).addScaledVector(b, y * size).add(vec(0, -.07 * size * (i % 3), 0)), color.clone().multiplyScalar(.85 + (i % 4) * .07), flex, 1));
    ring.forEach((p, i) => this.triangle(c, p, ring[(i + 1) % ring.length]));
  }
  lance(center, axis, width, color, flex, flutter = .8) {
    const side = new THREE.Vector3().crossVectors(axis, UP).normalize().multiplyScalar(width);
    const tip = center.clone().add(axis), middle = center.clone().addScaledVector(axis, .43);
    const a = this.vertex(center, color.clone().multiplyScalar(.78), flex * .75, flutter * .3);
    const b = this.vertex(middle.clone().add(side), color, flex, flutter);
    const c = this.vertex(middle.clone().add(vec(0, width * .15, 0)), color.clone().multiplyScalar(1.12), flex, flutter * .7);
    const d = this.vertex(middle.clone().sub(side), color.clone().multiplyScalar(.92), flex, flutter);
    const e = this.vertex(tip, color, flex * 1.1, flutter);
    this.triangle(a, b, e); this.triangle(a, e, d);
  }
}

function cedar(seed) {
  const rng = random(seed), wood = new BotanicalGeometry(), leaves = new BotanicalGeometry();
  const h = mix(6.0, 9.6, rng()), width = mix(1.8, 2.75, rng());
  const bark = new THREE.Color('#6b6751'), green = new THREE.Color().setHSL(.345 + rng() * .033, .29 + rng() * .085, .215 + rng() * .045, THREE.SRGBColorSpace);
  const bend = vec((rng() - .5) * .72, 0, (rng() - .5) * .7);
  const trunk = [];
  for (let i = 0; i <= 10; i++) trunk.push(vec(bend.x * (i / 10) ** 1.8 + Math.sin(i * .8 + seed) * .035, h * i / 10, bend.z * (i / 10) ** 1.5));
  wood.limb(trunk, trunk.map((_, i) => i === 0 ? .28 : .185 * (1 - i / 11) ** .9 + .012), bark, h, 6);
  for (let k = 0; k < 4; k++) {
    const angle = k / 4 * TAU + rng() * .4;
    wood.limb([vec(Math.cos(angle) * .65, .02, Math.sin(angle) * .65), vec(Math.cos(angle) * .21, .22, Math.sin(angle) * .21), trunk[1]], [.025, .13, .13], bark, h, 4);
  }
  const tiers = 8;
  for (let t = 0; t < tiers; t++) {
    const y = h * (.19 + t * .092), ratio = y / h;
    const ringWidth = width * Math.pow(1 - ratio, .69) * 1.65;
    const n = 5 + (t % 3);
    for (let j = 0; j < n; j++) {
      if (rng() < .07) continue;
      const a = j / n * TAU + t * 1.931 + rng() * .22;
      const len = ringWidth * mix(.75, 1.15, rng());
      const origin = vec(bend.x * ratio * ratio, y + (rng() - .5) * .22, bend.z * ratio * ratio);
      const radial = vec(Math.cos(a), 0, Math.sin(a));
      const elbow = origin.clone().addScaledVector(radial, len * .48).add(vec(0, -.17 - len * .10, 0));
      const end = origin.clone().addScaledVector(radial, len).add(vec(0, -.12 + rng() * .25, 0));
      if (t < 2 && j % 3 === 0) wood.limb([origin, elbow, end], [.053, .018, .003], bark, h, 4, .095);
      const base = origin.clone().addScaledVector(radial, .06 * len).add(vec(0, -.11, 0));
      leaves.bough(base, radial.clone().add(vec(0, .18 + rng() * .12, 0)), len * .62, len * 1.52, green, seed * 331 + t * 51 + j * 8, .10 + ratio * .16);

    }
  }
  for (let j = 0; j < 4; j++) leaves.bough(trunk[8], vec(Math.sin(j * 1.57) * .26, 1, Math.cos(j * 1.57) * .26), .28, h * .24, green, seed + j, .30);
  return { wood: wood.build(), leaves: leaves.build(), height: h };
}

function pine(seed) {
  const rng = random(seed), wood = new BotanicalGeometry(), leaves = new BotanicalGeometry();
  const h = mix(4.2, 7.2, rng()), bark = new THREE.Color('#77634e');
  const green = new THREE.Color().setHSL(.315 + rng() * .04, .28, .25 + rng() * .045, THREE.SRGBColorSpace);
  const lean = vec((rng() - .5) * 1.8, 0, (rng() - .5) * 1.2);
  const trunk = [];
  for (let k = 0; k <= 8; k++) trunk.push(vec(Math.sin(k * .52 + seed) * k * .038 + lean.x * (k / 8) ** 1.5, h * k / 8, Math.sin(k * .69) * .13 + lean.z * k / 8));
  wood.limb(trunk, trunk.map((_, i) => .24 * (1 - i / 9) + .014), bark, h, 6);
  for (let b = 0; b < 12; b++) {
    const t = .30 + b / 12 * .64, a = b * 2.399 + rng() * .6;
    const len = (1 - t * .7) * mix(1.8, 3.1, rng());
    const o = trunk[Math.floor(t * 8)].clone(), dir = vec(Math.cos(a), 0, Math.sin(a));
    const mid = o.clone().addScaledVector(dir, len * .58).add(vec(0, -.20 + rng() * .4, 0));
    const tip = o.clone().addScaledVector(dir, len).add(vec(0, .35 + rng() * .5, 0));
    wood.limb([o, mid, tip], [.105 * (1 - t) + .017, .052, .009], bark, h, 4, .11);
    for (let l = 0; l < 3; l++) {
      const aa = a - 1.05 + l * 1.0;
      const base = mid.clone().lerp(tip, .45 + rng() * .32);
      const ldir = vec(Math.cos(aa), .10 + rng() * .17, Math.sin(aa));
      leaves.bough(base, ldir, .70 + rng() * .26, 1.28 + rng() * .45, green, seed + b * 197 + l * 53, .16 + t * .11, true);
    }

  }
  return { wood: wood.build(), leaves: leaves.build(), height: h };
}

// Four momiji palettes, each with warm outer leaves and deeper inner branches.
const mapleColors = ['#a9383e', '#c04c29', '#cd772d', '#d3a13d'];
function maple(seed, palette = 0) {
  const rng = random(seed), wood = new BotanicalGeometry(), leaves = new BotanicalGeometry();
  const h = mix(3.5, 5.3, rng()), bark = new THREE.Color('#736957');
  const baseColor = new THREE.Color(mapleColors[palette]);
  const tipColor = new THREE.Color(['#d06437', '#e2953c', '#e4b653', '#e5c36b'][palette]);
  const main = [vec(0, 0, 0), vec(.08, h * .27, -.02), vec(-.14, h * .54, .08), vec(.14, h * .86, -.18), vec(.25, h, -.20)];
  wood.limb(main, [.20, .14, .105, .043, .007], bark, h, 5);
  for (let b = 0; b < 11; b++) {
    const t = .37 + (b % 5) * .105, a = b * 2.399 + rng() * .38;
    const o = vec(.02, h * t, .03), r = (1.6 - t * .65) * mix(1.1, 1.8, rng());
    const mid = vec(Math.cos(a) * r * .55, h * t + .40, Math.sin(a) * r * .55);
    const tip = vec(Math.cos(a) * r, h * t + .90, Math.sin(a) * r);
    wood.limb([o, mid, tip], [.064, .035, .005], bark, h, 4, .10);
    for (let c = 0; c < 3; c++) {
      const aa = a + (c - 1) * .65;
      const twig = tip.clone().add(vec(Math.cos(aa) * .50, c === 1 ? .3 : .06, Math.sin(aa) * .50));
      for (let l = 0; l < 4; l++) {
        const angle = l * 2.4 + rng(), radius = Math.sqrt(rng()) * .71;
        const center = twig.clone().add(vec(Math.cos(angle) * radius, (rng() - .5) * .43 - radius * .22, Math.sin(angle) * radius));
        const sunTip = .10 + .26 * Math.max(0, center.y / h - .45) + .13 * Math.sin(b * 1.8 + c);
        leaves.mapleLeaf(center, mix(.34, .54, rng()), rng() * TAU, (rng() - .5) * 1.0, baseColor.clone().lerp(tipColor, sunTip).multiplyScalar(.79 + rng() * .39), .21 + center.y / h * .14);
      }
    }
  }
  return { wood: wood.build(), leaves: leaves.build(), height: h };
}

function bamboo(seed) {
  const rng = random(seed), wood = new BotanicalGeometry(), leaves = new BotanicalGeometry();
  const h = mix(4.4, 6.7, rng()), bark = new THREE.Color('#828065'), green = new THREE.Color('#7c874f');
  for (let c = 0; c < 5; c++) {
    const a = c * 2.4, radius = .25 + rng() * .42, ch = h * mix(.65, 1, rng());
    const origin = vec(Math.sin(a) * radius, 0, Math.cos(a) * radius);
    const bend = vec(Math.sin(a + .3) * .65, 0, Math.cos(a) * .65);
    const points = [];
    for (let k = 0; k <= 12; k++) {
      const t = k / 12;
      points.push(origin.clone().add(vec(bend.x * t ** 2.5, ch * t, bend.z * t ** 2.5)));
    }
    wood.limb(points, points.map((_, k) => .046 * (1 - k / 18)), bark, h, 4, .22);
    for (let k = 2; k < 12; k++) {
      const node = points[k], r = .049 * (1 - k / 18);
      // Subtle node collars are represented by stem color, not hidden ring geometry.
      if (k < 5) continue;
      const aa = a + k * 2.1;
      const tip = node.clone().add(vec(Math.cos(aa) * .65, .22, Math.sin(aa) * .65));
      wood.limb([node, tip], [.016, .003], bark, h, 3, .3);
      for (let l = 0; l < 7; l++) {
        const t = .2 + l / 8;
        const pos = node.clone().lerp(tip, t);
        const angle = aa + (l % 2 ? 1 : -1) * .7;
        leaves.lance(pos, vec(Math.cos(angle) * .49, .07 - t * .19, Math.sin(angle) * .49), .067, green.clone().multiplyScalar(.79 + rng() * .38), .32 + k * .035);
      }
    }
  }
  return { wood: wood.build(), leaves: leaves.build(), height: h };
}

function grass(seed, flower = false) {
  const rng = random(seed), g = new BotanicalGeometry();
  const green = new THREE.Color(flower ? '#a89b64' : seed === 812 ? '#909363' : '#b5a06c');
  for (let i = 0; i < (flower ? 9 : 9); i++) {
    const a = rng() * TAU, r = rng() * .34, h = mix(.20, .68, rng());
    const origin = vec(Math.cos(a) * r, 0, Math.sin(a) * r);
    const axis = vec(Math.cos(a), 0, Math.sin(a));
    const side = vec(-Math.sin(a), 0, Math.cos(a));
    const width = mix(.018, .041, rng()), indices = [];
    for (let k = 0; k <= 2; k++) {
      const t = k / 2, mid = origin.clone().add(vec(0, t * h, 0)).addScaledVector(axis, t * t * h * .49);
      const ww = width * (1 - t ** 1.3);
      const col = green.clone().multiplyScalar(.73 + t * .50 + rng() * .1);
      const left = g.vertex(mid.clone().addScaledVector(side, -ww), col, t * t * .60, .2 * t);
      const right = g.vertex(mid.clone().addScaledVector(side, ww), col, t * t * .60, .2 * t);
      if (k) { g.triangle(indices[k - 1][0], indices[k - 1][1], left); g.triangle(indices[k - 1][1], right, left); }
      indices.push([left, right]);
    }
    if (flower && i < 4) {
      const center = origin.clone().add(vec(0, h * .9, 0)).addScaledVector(axis, h * .4);
      const petals = new THREE.Color(i % 3 ? '#e9dfb3' : '#d4a9b7');
      for (let k = 0; k < 5; k++) g.lance(center, vec(Math.cos(k / 5 * TAU) * .13, .026, Math.sin(k / 5 * TAU) * .13), .034, petals, .40, .4);
    }
  }
  return g.build();
}

function fern(seed) {
  const rng = random(seed), g = new BotanicalGeometry(), green = new THREE.Color('#737b4d');
  for (let f = 0; f < 6; f++) {
    const a = f * 2.399, length = mix(.58, 1.12, rng());
    const dir = vec(Math.cos(a), 0, Math.sin(a));
    const side = vec(-Math.sin(a), 0, Math.cos(a));
    for (let k = 1; k <= 7; k++) {
      const t = k / 8, center = dir.clone().multiplyScalar(length * t * .75).add(vec(0, Math.sin(t * Math.PI * .80) * length * .50, 0));
      for (const s of [-1, 1]) {
        const leaflet = side.clone().multiplyScalar(s * .23 * Math.sin(t * Math.PI)).addScaledVector(dir, .12);
        g.lance(center, leaflet, .025 * Math.sin(t * Math.PI) + .006, green.clone().multiplyScalar(.85 + t * .30), t * .28, .4);
      }
    }
  }
  return g.build();
}

function shrub(seed) {
  const rng = random(seed), g = new BotanicalGeometry(), green = new THREE.Color('#a36742');
  for (let b = 0; b < 6; b++) {
    const a = b * 2.399, h = mix(.35, .85, rng()), o = vec(Math.cos(a) * .2, 0, Math.sin(a) * .2);
    for (let k = 0; k < 6; k++) {
      const t = k / 6, pos = o.clone().add(vec(Math.cos(a) * t * .25, h * t, Math.sin(a) * t * .25));
      const aa = a + k * 2.39;
      g.lance(pos, vec(Math.cos(aa) * .29, .08, Math.sin(aa) * .29), .075, green.clone().multiplyScalar(.76 + rng() * .4), t * .28, .7);
    }
  }
  return g.build();
}

// Gust phase is evaluated once per specimen on the CPU. Close foliage adds
// branch and leaf motion; distant crowns need only the shared hierarchical bend.
const windShader = (detailed) => /* glsl */`
uniform float uBotanicalTime;
attribute float aFlex;
attribute float aFlutter;
attribute vec4 iWindState;
vec3 botanicalDeform(vec3 p) {
  vec3 delta = vec3(iWindState.x, iWindState.z, iWindState.y) * aFlex;
  ${detailed ? `
    vec3 placement = vec3(0.0);
    #ifdef USE_INSTANCING
      placement = instanceMatrix[3].xyz;
    #endif
    float phase = placement.x * .139 + placement.z * .107;
    float branch = sin(uBotanicalTime * 1.83 + p.y * 1.37 + phase) * .10 * aFlex;
    float flutter = sin(uBotanicalTime * 5.13 + p.x * 7.73 + p.z * 6.29 + phase) * aFlutter * .022;
    delta.x += (branch + flutter) * iWindState.w;
    delta.z += flutter * iWindState.w * .41;
  ` : ''}
  return p + delta;
}
`;

// Preserve each compound bough's outer points while removing folds that are
// smaller than a pixel in the wide view. Close geometry is never modified.
function distantCanopy(geometry, type) {
  const index = geometry.index.array, reduced = [];
  for (let k = 0; k < index.length;) {
    const center = index[k]; let end = k + 3;
    while (end < index.length && index[end] === center) end += 3;
    const count = (end - k) / 3;
    if (count >= 12) {
      let keep;
      if (type === 'maple') keep = [0, 4, 7, 10];
      else if (count === 18) keep = [0, 2, 4, 6, 9, 11, 14, 16];
      else keep = [0, 1, 3, 5, 7, 9, 11, 13].filter(i => i < count);
      for (let i = 0; i < keep.length; i++) reduced.push(center, index[k + keep[i] * 3 + 1], index[k + keep[(i + 1) % keep.length] * 3 + 1]);
    } else for (let j = k; j < end; j++) reduced.push(index[j]);
    k = end;
  }
  const g = geometry.clone(); g.setIndex(reduced); return g;
}

function distantTree(asset, type) {
  const wood = asset.wood.clone();
  const stemTriangles = {cedar:128, pine:104, maple:46}[type];
  if (stemTriangles) wood.setIndex(Array.from(wood.index.array.slice(0, stemTriangles * 3)));
  const leaves = distantCanopy(asset.leaves, type);
  const merged = mergeGeometries([wood, leaves], false);
  wood.dispose(); leaves.dispose(); return merged;
}

export function createVegetation(scene, world, shared = {}) {
  const timeUniform = shared.time && typeof shared.time === 'object' ? shared.time : { value: 0 };
  const windUniform = shared.wind && typeof shared.wind === 'object' ? shared.wind : { value: shared.wind ?? .7 };
  const wetUniform = shared.wetness && typeof shared.wetness === 'object' ? shared.wetness : { value: 0 };
  const woodMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .96, color: '#dddacb' });
  const foliageMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .88, color: '#ffffff', side: THREE.DoubleSide, shadowSide: THREE.DoubleSide });
  const farMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .92, color: '#ffffff', side: THREE.DoubleSide, shadowSide: THREE.DoubleSide });
  const groundMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .97, color: '#ffffff', side: THREE.DoubleSide, shadowSide: THREE.DoubleSide });
  const applyWind = (material, name, detailed = true) => {
    material.onBeforeCompile = shader => {
      shader.uniforms.uBotanicalTime = timeUniform;
      shader.uniforms.uBotanicalWind = windUniform;
      shader.uniforms.uBotanicalWet = wetUniform;
      if (!name.startsWith('depth')) {
        shader.fragmentShader = 'uniform float uBotanicalWet;\n' + shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= 1.0 - uBotanicalWet * 0.16;');
        shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor *= 1.0 - uBotanicalWet * 0.19;');
      }
      shader.vertexShader = windShader(detailed) + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', 'vec3 transformed = botanicalDeform(position);');
    };
    material.customProgramCacheKey = () => 'mountain-botanical-wind-' + name;
  };
  applyWind(woodMaterial, 'wood'); applyWind(foliageMaterial, 'foliage'); applyWind(groundMaterial, 'ground'); applyWind(farMaterial, 'far', false);
  const depthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, side: THREE.DoubleSide });
  applyWind(depthMaterial, 'depth');
  const farDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, side: THREE.DoubleSide });
  applyWind(farDepthMaterial, 'depth-far', false);
  const group = new THREE.Group(); group.name = 'Botanical garden — cedar / red pine / maple / bamboo'; scene.add(group);
  const variants = [];
  for (let i = 0; i < 6; i++) variants.push({ type: 'cedar', asset: cedar(711 + i * 83), items: [] });
  for (let i = 0; i < 4; i++) variants.push({ type: 'pine', asset: pine(922 + i * 67), items: [] });
  for (let i = 0; i < 4; i++) variants.push({ type: 'maple', asset: maple(1323 + i * 107, i), items: [] });
  for (let i = 0; i < 3; i++) variants.push({ type: 'bamboo', asset: bamboo(432 + i * 133), items: [] });
  const buckets = Object.fromEntries(['cedar', 'pine', 'maple', 'bamboo'].map(type => [type, variants.filter(v => v.type === type)]));
  const rng = random(80318), points = [], matrix = new THREE.Matrix4(), quat = new THREE.Quaternion(), scale = new THREE.Vector3();
  const terrain = (x, z) => world.height(x, z);
  const riverDistance = (x, z) => Math.abs(x - world.riverX(z));
  const footprint = (x, z) => world.inFootprint(x, z);
  const railDistance = (x, z) => world.railDistance(x, z);
  const station = world.stationCenter || vec(-22, 0, 31), shrine = world.shrineCenter || vec(-43, 0, -12);
  const heroSites=[
    {type:'maple',variant:3,x:-9.8,z:35,scale:1.38,rotation:-.35},
    {type:'cedar',variant:2,x:-48,z:-13.5,scale:1.48,rotation:.6},
    {type:'cedar',variant:4,x:-39.5,z:-17.8,scale:1.40,rotation:2.1},
    {type:'pine',variant:1,x:-16,z:-20,scale:1.06,rotation:-.7},
    {type:'pine',variant:3,x:41,z:30.3,scale:1.23,rotation:1.2},
    {type:'pine',variant:0,x:-6,z:38.4,scale:1.05,rotation:2.4},
    {type:'cedar',variant:1,x:44.8,z:1.7,scale:1.38,rotation:.8},
    {type:'bamboo',variant:2,x:world.riverX(18)-6.9,z:18,scale:1.02,rotation:2.1},
    // Two reallocated specimens frame the hero composition's outer edges without
    // entering the bridge/river proscenium or the station approach sightline.
    {type:'maple',variant:1,x:10.5,z:36,scale:1.30,rotation:1.9},
    {type:'pine',variant:3,x:31.5,z:33,scale:1.18,rotation:.4}
  ];
  const validTree = (x, z) => {
    if(heroSites.some(p=>(p.x-x)**2+(p.z-z)**2<6.25))return false;
    // Open the downstream view into the cascade; forest remains dense behind it.
    if(z>1&&z<18&&x>world.riverX(z)+3.4&&x<world.riverX(z)+9.8)return false;
    if(x>-16&&x<3&&z<-30)return false; // A view into the outward-facing exit throat.
    if(x>-29&&x<-7&&z>18&&z<24)return false; // Platform approach sightline, below the cedar slope.
    if(world.nearFarmhouse?.(x,z,1.65)) return false;
    if(world.lanternSites?.some(p => (p.x-x)**2+(p.z-z)**2 < 5.2)) return false;
    if (!footprint(x, z) || !footprint(x - 1, z) || !footprint(x + 1, z) || !footprint(x, z + 1)) return false;
    if (railDistance(x, z) < 4.0 || riverDistance(x, z) < 4.8) return false;
    if (x > -38 && x < -5 && z > 25 && z < 39) return false;
    if ((x - shrine.x) ** 2 + (z - shrine.z) ** 2 < 22) return false;
    if (z > -10 && z < 5.5 && Math.abs(x - (-44.6 - z * .06)) < 2.2) return false;
    // A clear proscenium preserves the river/bridge composition from the arrival view.
    if (x > 0 && x < 34 && z > 20 && z < 31) return false;
    return true;
  };
  let count = 0;
  for (let attempt = 0; attempt < 14500 && count < 620; attempt++) {
    const x = mix(-55, 55, rng()), z = mix(-40, 40, rng());
    if (!validTree(x, z)) continue;
    const y = terrain(x, z);
    if (!Number.isFinite(y)) continue;
    const sx = terrain(x + .8, z) - terrain(x - .8, z), sz = terrain(x, z + .8) - terrain(x, z - .8);
    const slope = Math.hypot(sx, sz) / 1.6;
    if (slope > 2.3 || (slope > 1.15 && rng() < .82) || (y > 26 && rng() < .73)) continue;
    // Stronger cluster contrast: connected groves with deliberate openings that
    // reveal railway, water and distant ranges between the masses.
    const patch = .55 + Math.sin(x * .19 + z * .04) * .30 + Math.cos(z * .27 - x * .1) * .26;
    if (rng() > patch) continue;
    const near = points.some(p => (x - p.x) ** 2 + (z - p.z) ** 2 < 3.3);
    if (near) continue;
    let type;
    const r = rng();
    // Evergreen crests frame connected autumn groves on sheltered lower slopes.
    // Retain the existing placement exclusions and total population budget.
    const grove = .5 + .27 * Math.sin(x * .105 + z * .062) + .23 * Math.cos(z * .13 - x * .04);
    if (riverDistance(x, z) < 10 && y < 13 && r < .18) type = 'bamboo';
    else if (slope > 1.2 || y > 30) type = r < .58 ? 'pine' : 'cedar';
    else if (y > 22 || slope > .8) type = r < .28 + grove * .20 ? 'maple' : r < .73 ? 'pine' : 'cedar';
    else type = r < .53 + grove * .24 ? 'maple' : r < .87 ? 'cedar' : 'pine';
    // Low, spreading trees and young specimens frame the inhabited foreground.
    if (z > 30 && r < .7) type = 'maple';
    const choices = buckets[type];
    let variantIndex = Math.floor(rng() * choices.length);
    if (type === 'maple') {
      // Neighbouring crowns share a seasonal hue instead of random confetti.
      const colorPatch = .5 + .31 * Math.sin(x * .115 + z * .07) + .18 * Math.cos(z * .17);
      variantIndex = Math.min(3, Math.floor(colorPatch * 4));
    }
    const asset = choices[variantIndex];
    const age = mix(.59, 1.12, rng());
    const foreground = z > 29 ? .67 : 1;
    const horizontal = age * mix(.85, 1.15, rng()) * foreground;
    asset.items.push({ x, y: y - .03, z, sy: age * foreground, sx: horizontal, rotation: rng() * TAU, tone: mix(.84, 1.12, rng()) });
    points.push({ x, z }); count++;
  }
  for(const h of heroSites){
    if(!footprint(h.x,h.z)||world.nearFarmhouse?.(h.x,h.z,1))continue;
    const bucket=buckets[h.type][h.variant];bucket.items.push({x:h.x,y:terrain(h.x,h.z)-.025,z:h.z,sy:h.scale,sx:h.scale*.94,rotation:h.rotation,tone:1.04,hero:true});count++;
  }
  world.autumnGroves = buckets.maple.flatMap(v => v.items).filter(p => p.z > 6 && p.sy > .63);
  const allMeshes = [], allItems = [];
  const initializeItem = p => {
    p.phase = p.x * .139 + p.z * .107;
    p.gustPhase = p.x * .082 + p.z * .049;
    p.cos = Math.cos(p.rotation); p.sin = Math.sin(p.rotation);
    p.near = false; p.wind = new Float32Array(4); allItems.push(p);
  };
  const assignItems = (object, items) => {
    object.count = items.length; object.userData.population = items;
    items.forEach((p, i) => {
      quat.setFromAxisAngle(UP, p.rotation);
      matrix.compose(vec(p.x, p.y, p.z), quat, scale.set(p.sx, p.sy, p.sx));
      object.setMatrixAt(i, matrix);
      object.setColorAt(i, new THREE.Color().setScalar(p.tone));
    });
    object.instanceMatrix.needsUpdate = true;
    if (object.instanceColor) object.instanceColor.needsUpdate = true;
  };
  const instances = (geometry, material, items, name, shadow = true, far = false) => {
    if (!items.length) return null;
    const object = new THREE.InstancedMesh(geometry, material, items.length);
    object.name = name; object.castShadow = shadow; object.receiveShadow = true;
    object.customDepthMaterial = far ? farDepthMaterial : depthMaterial;
    geometry.setAttribute('iWindState', new THREE.InstancedBufferAttribute(new Float32Array(items.length * 4), 4).setUsage(THREE.DynamicDrawUsage));
    assignItems(object, items);
    object.computeBoundingSphere();
    if (object.boundingSphere) object.boundingSphere.radius += 2;
    group.add(object); allMeshes.push(object); return object;
  };
  variants.forEach((v, i) => {
    v.items.forEach(initializeItem);
    v.nearWood = instances(v.asset.wood, woodMaterial, v.items, `${v.type} close sculpted branches ${i}`);
    v.nearLeaves = instances(v.asset.leaves, foliageMaterial, v.items, `${v.type} close botanical sprays ${i}`);
    v.far = instances(distantTree(v.asset, v.type), farMaterial, v.items, `${v.type} distant sculpted crown ${i}`, true, true);
    if (v.nearWood) { assignItems(v.nearWood, []); assignItems(v.nearLeaves, []); }
  });
  const grounds = [
    { name: 'valley fern fronds', geometry: fern(483), items: [], max: 330 },
    { name: 'forest floor shrubs', geometry: shrub(998), items: [], max: 400 },
    { name: 'meadow grass', geometry: grass(387), items: [], max: 1000 },
    { name: 'river grass', geometry: grass(812), items: [], max: 450 },
    { name: 'little wildflowers', geometry: grass(246, true), items: [], max: 190 }
  ];
  for (let k = 0; k < 18000; k++) {
    const x = mix(-55, 55, rng()), z = mix(-40, 40, rng());
    if(world.nearFarmhouse?.(x,z,.35)) continue;
    if (!footprint(x, z) || railDistance(x, z) < 2.7 || riverDistance(x, z) < 3.4) continue;
    if (x > -37 && x < -6 && z > 26 && z < 36.7) continue;
    if ((x - shrine.x) ** 2 + (z - shrine.z) ** 2 < 18) continue;
    if (z > -10 && z < 5.5 && Math.abs(x - (-44.6 - z * .06)) < 1.3) continue;
    const y = terrain(x, z), slope = Math.hypot(terrain(x + .5, z) - terrain(x - .5, z), terrain(x, z + .5) - terrain(x, z - .5));
    if (!Number.isFinite(y) || slope > 1.9 || y > 27) continue;
    const rd = riverDistance(x, z);
    let type = rd < 7.5 ? (rng() < .55 ? 3 : 0) : rng() < .18 ? 0 : rng() < .24 ? 1 : 2;
    if (z > 22 && rng() < .19) type = 4;
    if (grounds[type].items.length >= grounds[type].max) continue;
    const size = mix(.65, 1.5, rng());
    grounds[type].items.push({ x, y: y - .035, z, sx: size, sy: size * mix(.7, 1.1, rng()), rotation: rng() * TAU, tone: mix(.79, 1.18, rng()) });
  }
  grounds.forEach(g => {
    g.items.forEach(initializeItem);
    g.object = instances(g.geometry, groundMaterial, g.items, g.name, false);
  });
  const lastCamera = vec(Infinity, Infinity, Infinity);
  const updateLOD = camera => {
    if (!camera || lastCamera.distanceToSquared(camera.position) < .64) return;
    lastCamera.copy(camera.position);
    for (const v of variants) {
      if (!v.far) continue;
      const near = [], far = [];
      for (const p of v.items) {
        const d2 = (p.x-camera.position.x)**2 + (p.y+v.asset.height*p.sy*.55-camera.position.y)**2 + (p.z-camera.position.z)**2;
        p.near = d2 < (p.hero ? 90*90 : (p.near ? 54*54 : 46*46));
        (p.near ? near : far).push(p);
      }
      assignItems(v.nearWood, near); assignItems(v.nearLeaves, near); assignItems(v.far, far);
    }
    for (const g of grounds) {
      const selected = g.items.filter((p, i) => i % 2 === 0 || (p.x-camera.position.x)**2+(p.y-camera.position.y)**2+(p.z-camera.position.z)**2 < 70*70);
      assignItems(g.object, selected);
    }
  };
  return {
    count,
    group,
    prepareCompile() {
      allMeshes.forEach(object => { object.userData.compileCount = object.count; if (!object.count) object.count = 1; });
    },
    finishCompile() {
      allMeshes.forEach(object => { if (object.userData.compileCount !== undefined) { object.count = object.userData.compileCount; delete object.userData.compileCount; } });
    },
    stats() {
      return { trees: count, draws: allMeshes.filter(m => m.count > 0).length, triangles: allMeshes.reduce((n, m) => n + m.geometry.index.count / 3 * m.count, 0), nearTrees: variants.reduce((n,v) => n+(v.nearWood?.count||0),0) };
    },
    update(time, camera) {
      timeUniform.value = time;
      if (typeof shared.wind === 'number') windUniform.value = shared.wind;
      updateLOD(camera);
      const wind = windUniform.value;
      for (const p of allItems) {
        // Gusts travel slowly across the slopes; calm pockets remain nearly still.
        const w = Math.max(0, Math.sin(p.gustPhase - time * .55));
        const gust = w*w*w*w*w;
        const region = .5 + .5 * Math.sin(p.x * .033 + 1.7) * Math.sin(p.z * .047 - .6);
        const stillness = .30 + .70 * region * region;
        const slow = Math.sin(time * .93 + p.phase) * .40 + Math.sin(time * .43 + p.phase * 1.31) * .24;
        const amplitude = wind * (.28 + gust * 1.9) * stillness;
        const dx = (slow + .40 * gust) * amplitude;
        const dz = Math.sin(time * .64 + p.phase + p.sy * .9) * amplitude * .33;
        p.wind[0] = dx * p.cos - dz * p.sin;
        p.wind[1] = dx * p.sin + dz * p.cos;
        p.wind[2] = -Math.abs(slow) * amplitude * .045;
        // Close foliage answers the wind; distant crowns stay calm.
        p.wind[3] = amplitude * (p.near ? 1.3 : .55);
      }
      for (const object of allMeshes) {
        if (!object.count) continue;
        const attribute = object.geometry.getAttribute('iWindState');
        object.userData.population.forEach((p, i) => attribute.array.set(p.wind, i * 4));
        attribute.needsUpdate = true;
      }
    },
    dispose() {
      group.traverse(obj => { if (obj.isMesh) obj.geometry.dispose(); });
      woodMaterial.dispose(); foliageMaterial.dispose(); groundMaterial.dispose(); farMaterial.dispose(); depthMaterial.dispose(); farDepthMaterial.dispose();
      scene.remove(group);
    }
  };
}
