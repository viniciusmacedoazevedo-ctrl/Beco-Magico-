import * as THREE from 'three';
import { fbm, rng } from './noise.js';
import { bumpTexture, tomatoTexture, pickleTexture, baconTexture } from './textures.js';

// Cada ingrediente devolve { object, height, below }.
// - object: origem na base da camada (y = 0), centrado em x/z.
// - height: espessura usada para empilhar o hambúrguer montado.
// - below: quanto a camada pendura abaixo da origem (queijo, molho), usado no espaçamento aberto.

const BUN_R = 1.1;
const col = (hex) => new THREE.Color(hex);
const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function setColors(geo, fn) {
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    fn(pos.getX(i), pos.getY(i), pos.getZ(i), c, i);
    colors.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}

// Desloca vértices ao longo da normal. fn devolve a amplitude em unidades de mundo.
function displaceAlongNormal(geo, fn) {
  computeWeldedNormals(geo);
  const pos = geo.attributes.position;
  const nor = geo.attributes.normal;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const d = fn(x, y, z);
    pos.setXYZ(i, x + nor.getX(i) * d, y + nor.getY(i) * d, z + nor.getZ(i) * d);
  }
  pos.needsUpdate = true;
  computeWeldedNormals(geo);
}

// Normais suavizadas também na costura do lathe/esfera (vértices duplicados na mesma posição).
function computeWeldedNormals(geo) {
  geo.computeVertexNormals();
  const pos = geo.attributes.position, nor = geo.attributes.normal;
  const groups = new Map();
  const key = (i) => `${Math.round(pos.getX(i) * 1e4)},${Math.round(pos.getY(i) * 1e4)},${Math.round(pos.getZ(i) * 1e4)}`;
  for (let i = 0; i < pos.count; i++) {
    const k = key(i);
    const g = groups.get(k);
    if (g) g.push(i); else groups.set(k, [i]);
  }
  const v = new THREE.Vector3();
  for (const idx of groups.values()) {
    if (idx.length < 2) continue;
    v.set(0, 0, 0);
    for (const i of idx) v.x += nor.getX(i), v.y += nor.getY(i), v.z += nor.getZ(i);
    v.normalize();
    for (const i of idx) nor.setXYZ(i, v.x, v.y, v.z);
  }
  nor.needsUpdate = true;
}

// Reamostra o perfil por comprimento de arco: faces planas também recebem vértices
// suficientes para o relevo aparecer.
function resample(points, n) {
  const seg = [];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const l = Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
    seg.push(l);
    total += l;
  }
  const out = [points[0]];
  let idx = 0, acc = 0;
  for (let k = 1; k < n; k++) {
    const target = (k / (n - 1)) * total;
    while (idx < seg.length - 1 && acc + seg[idx] < target) acc += seg[idx++];
    const t = seg[idx] ? (target - acc) / seg[idx] : 0;
    const [x0, y0] = points[idx], [x1, y1] = points[idx + 1];
    out.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t]);
  }
  out[out.length - 1] = points[points.length - 1];
  return out;
}

function lathe(points, segments = 128, samples = 72) {
  return new THREE.LatheGeometry(resample(points, samples).map(([x, y]) => new THREE.Vector2(x, y)), segments);
}

// ——— Pães ———

function domeProfile(R, H, base) {
  return (t) => [R * Math.pow(Math.cos(t), 0.58), base + (H - base) * Math.pow(Math.sin(t), 0.82)];
}

export function paoTopo({ brioche = false, seed = 7 } = {}) {
  const R = BUN_R, H = brioche ? 0.82 : 0.78, base = 0.07;
  const dome = domeProfile(R, H, base);
  const pts = [[0, 0], [R * 0.6, 0], [R * 0.93, 0.004], [R * 0.985, 0.025]];
  for (let i = 0; i <= 44; i++) pts.push(dome((i / 44) * (Math.PI / 2)));
  pts[pts.length - 1][0] = 0;
  const geo = lathe(pts, 144);
  displaceAlongNormal(geo, (x, y, z) => (y < 0.01 ? 0 : fbm(x * 3, y * 3, z * 3, seed) * 0.014));

  const crumb = col('#d6ac74'), crumbDark = col('#bd8d55');
  const low = col(brioche ? '#c9762f' : '#e4a85c');
  const mid = col(brioche ? '#93410f' : '#c4712a');
  const top = col(brioche ? '#6e2a08' : '#9a4816');
  setColors(geo, (x, y, z, c) => {
    const n = fbm(x * 4, y * 4, z * 4, seed + 5);
    if (y < 0.012) {
      c.copy(crumb).lerp(crumbDark, smooth(-0.3, 0.6, n));
      return;
    }
    const t = y / H;
    c.copy(low).lerp(mid, smooth(0.05, 0.45, t)).lerp(top, smooth(0.45, 1, t) * 0.9);
    c.multiplyScalar(1 + n * 0.16);
  });

  const mat = new THREE.MeshPhysicalMaterial({
    vertexColors: true,
    roughness: brioche ? 0.42 : 0.56,
    clearcoat: brioche ? 0.7 : 0.25,
    clearcoatRoughness: brioche ? 0.28 : 0.5,
    sheen: 0.5,
    sheenColor: col('#ffcf9a'),
    sheenRoughness: 0.6,
    bumpMap: bumpTexture(5, 0.8),
    bumpScale: 0.6,
  });
  const group = new THREE.Group();
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  group.add(mesh);

  if (!brioche) group.add(sesame(R, H, base, seed));
  return { object: group, height: H, below: 0 };
}

function sesame(R, H, base, seed) {
  const r = rng(seed * 13);
  const count = 120;
  const seedGeo = new THREE.SphereGeometry(1, 10, 6);
  const seedMat = new THREE.MeshPhysicalMaterial({ color: col('#f2e2b8'), roughness: 0.45, clearcoat: 0.3, sheen: 0.4 });
  const inst = new THREE.InstancedMesh(seedGeo, seedMat, count);
  const dome = domeProfile(R, H, base);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), q2 = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0), n = new THREE.Vector3(), p = new THREE.Vector3();
  const s = new THREE.Vector3();
  let placed = 0;
  while (placed < count) {
    const t = 0.18 + r() * 1.3;
    if (r() > Math.cos(t) * 1.15) continue; // densidade proporcional à área da cúpula
    const phi = r() * Math.PI * 2;
    const [x0, y0] = dome(t);
    const [x1, y1] = dome(t + 0.01);
    const dx = x1 - x0, dy = y1 - y0;
    const len = Math.hypot(dx, dy);
    const nx = dy / len, ny = -dx / len;
    n.set(nx * Math.cos(phi), ny, nx * Math.sin(phi)).normalize();
    p.set(x0 * Math.cos(phi), y0, x0 * Math.sin(phi)).addScaledVector(n, 0.006);
    q.setFromUnitVectors(up, n);
    q2.setFromAxisAngle(up, r() * Math.PI);
    q.multiply(q2);
    s.set(0.045, 0.014, 0.024).multiplyScalar(0.85 + r() * 0.3);
    m.compose(p, q, s);
    inst.setMatrixAt(placed++, m);
  }
  inst.castShadow = true;
  return inst;
}

export function paoBase({ brioche = false, seed = 9 } = {}) {
  const R = BUN_R, H = 0.34;
  const geo = lathe([
    [0, 0], [R * 0.86, 0], [R * 0.96, 0.025], [R * 0.995, 0.09], [R, 0.2],
    [R * 0.99, 0.28], [R * 0.965, 0.325], [R * 0.9, H], [R * 0.5, H], [0, H],
  ], 144);
  displaceAlongNormal(geo, (x, y, z) => fbm(x * 3.2, y * 3.2, z * 3.2, seed) * 0.012);
  const crumb = col('#d9b07a'), crumbDark = col('#c0915a');
  const side = col(brioche ? '#b05f22' : '#c97f36'), sideTop = col(brioche ? '#d48a45' : '#e0a55e');
  setColors(geo, (x, y, z, c) => {
    const n = fbm(x * 5, y * 5, z * 5, seed + 3);
    const r = Math.hypot(x, z);
    if (y > H - 0.012 && r < R * 0.93) {
      c.copy(crumb).lerp(crumbDark, smooth(-0.3, 0.6, n));
      return;
    }
    c.copy(side).lerp(sideTop, smooth(0.12, 0.32, y));
    c.multiplyScalar(1 + n * 0.14);
  });
  const mat = new THREE.MeshPhysicalMaterial({
    vertexColors: true, roughness: 0.62, clearcoat: brioche ? 0.5 : 0.15, sheen: 0.5,
    sheenColor: col('#ffcf9a'), bumpMap: bumpTexture(5, 0.8), bumpScale: 0.6,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = mesh.receiveShadow = true;
  const g = new THREE.Group();
  g.add(mesh);
  return { object: g, height: H, below: 0 };
}

// ——— Proteínas ———

function pattyGeo({ R, H, seed, edgeLace = 0 }) {
  const geo = lathe([
    [0, 0], [R * 0.86, 0], [R * 0.97, 0.03], [R * 1.01, H * 0.32], [R * 1.01, H * 0.68],
    [R * 0.97, H - 0.03], [R * 0.86, H], [0, H],
  ], 160);
  // Lathe de perfil grosso: subdivide via Lathe com mais pontos interpolados.
  displaceAlongNormal(geo, (x, y, z) => {
    const r = Math.hypot(x, z) / R;
    const lace = edgeLace * smooth(0.8, 1.0, r) * (0.5 + fbm(x * 9, y * 9, z * 9, seed + 9));
    return fbm(x * 3.4, y * 3.4, z * 3.4, seed) * 0.05 + fbm(x * 12, y * 12, z * 12, seed + 1) * 0.018 + lace;
  });
  return geo;
}

function pattyMaterial(bumpSeed) {
  return new THREE.MeshPhysicalMaterial({
    vertexColors: true, roughness: 0.78, clearcoat: 0.22, clearcoatRoughness: 0.45,
    bumpMap: bumpTexture(bumpSeed, 1.4), bumpScale: 1.2,
  });
}

export function carne({ seed = 21 } = {}) {
  const R = 1.16, H = 0.36;
  const geo = pattyGeo({ R, H, seed });
  const base = col('#3b2114'), crust = col('#6e3b1c'), char = col('#1a0d06');
  setColors(geo, (x, y, z, c) => {
    const n = fbm(x * 4, y * 4, z * 4, seed + 2);
    const fine = fbm(x * 14, y * 14, z * 14, seed + 4);
    c.copy(base).lerp(crust, smooth(-0.1, 0.5, n)).lerp(char, smooth(0.25, 0.6, fine) * 0.8);
  });
  const mesh = new THREE.Mesh(geo, pattyMaterial(17));
  mesh.castShadow = mesh.receiveShadow = true;
  const g = new THREE.Group();
  g.add(mesh);
  return { object: g, height: H, below: 0 };
}

export function smash({ seed = 41 } = {}) {
  const R = 1.2, H = 0.19;
  const geo = pattyGeo({ R, H, seed, edgeLace: 0.06 });
  const base = col('#34190c'), crust = col('#7a4520'), edge = col('#9a5a26');
  setColors(geo, (x, y, z, c) => {
    const r = Math.hypot(x, z) / R;
    const n = fbm(x * 5, y * 5, z * 5, seed + 2);
    c.copy(base).lerp(crust, smooth(-0.2, 0.5, n)).lerp(edge, smooth(0.86, 1.02, r) * 0.7);
  });
  const mesh = new THREE.Mesh(geo, pattyMaterial(19));
  mesh.castShadow = mesh.receiveShadow = true;
  const g = new THREE.Group();
  g.add(mesh);
  return { object: g, height: H, below: 0 };
}

export function frango({ seed = 61 } = {}) {
  const geo = new THREE.SphereGeometry(1, 128, 72);
  geo.scale(1.26, 0.27, 1.06);
  const disp = new Float32Array(geo.attributes.position.count);
  let k = 0;
  displaceAlongNormal(geo, (x, y, z) => {
    const d = fbm(x * 2.4, y * 2.4, z * 2.4, seed) * 0.12 + fbm(x * 9, y * 9, z * 9, seed + 3) * 0.04;
    disp[k++] = d;
    return d;
  });
  const deep = col('#874515'), gold = col('#d99445'), light = col('#efc073');
  setColors(geo, (x, y, z, c, i) => {
    const d = disp[i];
    c.copy(deep).lerp(gold, smooth(-0.08, 0.02, d)).lerp(light, smooth(0.03, 0.1, d) * 0.7);
  });
  geo.translate(0, 0.3, 0);
  const mat = new THREE.MeshPhysicalMaterial({
    vertexColors: true, roughness: 0.66, clearcoat: 0.18, bumpMap: bumpTexture(29, 2), bumpScale: 1.6,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = mesh.receiveShadow = true;
  const g = new THREE.Group();
  g.add(mesh);
  return { object: g, height: 0.6, below: 0 };
}

export function bacon({ seed = 33 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const mat = new THREE.MeshPhysicalMaterial({
    map: baconTexture(), roughness: 0.42, clearcoat: 0.55, clearcoatRoughness: 0.35, side: THREE.DoubleSide,
    bumpMap: bumpTexture(37, 1), bumpScale: 0.8,
  });
  [-0.4, 0.15, 0.68].forEach((angle, i) => {
    const geo = new THREE.PlaneGeometry(2.55, 0.36, 120, 8);
    geo.rotateX(-Math.PI / 2);
    const phase = r() * 6;
    const pos = geo.attributes.position;
    for (let v = 0; v < pos.count; v++) {
      const x = pos.getX(v), z = pos.getZ(v);
      const y = Math.sin(x * 4.6 + phase) * 0.06 + Math.sin(x * 11 + phase) * 0.012 + z * Math.sin(x * 2 + phase) * 0.12;
      pos.setY(v, y);
    }
    computeWeldedNormals(geo);
    const m = new THREE.Mesh(geo, mat);
    m.rotation.y = angle;
    m.position.set((r() - 0.5) * 0.2, 0.06 + i * 0.03, (r() - 0.5) * 0.4);
    m.castShadow = true;
    g.add(m);
  });
  return { object: g, height: 0.16, below: 0 };
}

// ——— Queijos e molhos ———

function cheese({ color, Rc = 1.08, droop = 0.5, seed = 51, rotation = 0.3 }) {
  const geo = new THREE.PlaneGeometry(2.24, 2.24, 72, 72);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i), z = pos.getZ(i);
    const d = Math.hypot(x, z);
    let y = fbm(x * 2, 0, z * 2, seed) * 0.012;
    if (d > Rc) {
      const o = d - Rc;
      y -= Math.min(0.42, Math.pow(o * 2.3, 1.7) * droop);
      const pull = 1 - Math.min(0.2, o * 0.28);
      x *= pull;
      z *= pull;
    }
    pos.setXYZ(i, x, y, z);
  }
  computeWeldedNormals(geo);
  const mat = new THREE.MeshPhysicalMaterial({
    color: col(color), roughness: 0.34, clearcoat: 0.45, clearcoatRoughness: 0.25,
    emissive: col('#4a1c00'), emissiveIntensity: 0.18, side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.y = rotation;
  mesh.position.y = 0.012;
  mesh.castShadow = true;
  const g = new THREE.Group();
  g.add(mesh);
  return { object: g, height: 0.03, below: 0.4 };
}

export const cheddar = () => cheese({ color: '#e07a0a', seed: 51, rotation: 0.35 });
export const queijoAmericano = (o = {}) =>
  cheese({ color: '#eb9a12', Rc: 1.12, droop: 0.42, seed: 53 + (o.seed || 0), rotation: 0.85 + (o.seed || 0) * 0.4 });

function sauce({ color, drips = 7, seed = 71, roughness = 0.18 }) {
  const r = rng(seed);
  const angles = Array.from({ length: drips }, (_, i) => (i / drips) * Math.PI * 2 + r() * 0.6);
  const lens = angles.map(() => 0.18 + r() * 0.22);
  const geo = new THREE.RingGeometry(0.001, 1, 160, 24);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const t = Math.hypot(x, z);
    const a = Math.atan2(z, x);
    let edge = 1.0 + 0.05 * Math.sin(a * 5 + seed);
    angles.forEach((da, k) => {
      let dd = Math.abs(a - da);
      dd = Math.min(dd, Math.PI * 2 - dd);
      edge += lens[k] * Math.exp(-Math.pow(dd / 0.08, 2));
    });
    const rr = t * edge;
    let y = 0.014 * (1 - t * t);
    if (rr > 1.04) y -= (rr - 1.04) * 1.6;
    pos.setXYZ(i, Math.cos(a) * rr, y, Math.sin(a) * rr);
  }
  computeWeldedNormals(geo);
  const mat = new THREE.MeshPhysicalMaterial({
    color: col(color), roughness, clearcoat: 1, clearcoatRoughness: 0.1, side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = 0.01;
  const g = new THREE.Group();
  g.add(mesh);
  return { object: g, height: 0.03, below: 0.36 };
}

export const molhoBarbecue = () => sauce({ color: '#561a0b', drips: 8, seed: 71 });
export const maionesePicante = () => sauce({ color: '#e68a4c', drips: 6, seed: 73, roughness: 0.3 });

// ——— Vegetais ———

export function alface({ seed = 81 } = {}) {
  const geo = new THREE.RingGeometry(0.001, 1, 200, 30);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const radial = new Float32Array(pos.count);
  const angle = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const t = Math.hypot(x, z);
    const a = Math.atan2(z, x);
    const ca = Math.cos(a), sa = Math.sin(a);
    const R = 1.2 * (1 + 0.07 * Math.sin(a * 6 + 1.3) + 0.06 * fbm(ca * 2, sa * 2, 0, seed));
    const wob = fbm(ca * 3, sa * 3, t * 2, seed + 2);
    const y =
      Math.pow(t, 1.5) * (0.075 * Math.sin(a * 13 + wob * 3) + 0.035 * Math.sin(a * 31 + 1)) -
      Math.pow(t, 3) * 0.22 +
      fbm(x * 3, 0, z * 3, seed + 4) * 0.025;
    pos.setXYZ(i, ca * t * R, y + 0.04, sa * t * R);
    radial[i] = t;
    angle[i] = a;
  }
  computeWeldedNormals(geo);
  const heart = col('#cfe38a'), body = col('#6fae2e'), edge = col('#3d7a17');
  setColors(geo, (x, y, z, c, i) => {
    const t = radial[i];
    c.copy(heart).lerp(body, smooth(0.05, 0.55, t)).lerp(edge, smooth(0.6, 1, t));
    const vein = Math.pow(Math.abs(Math.sin(angle[i] * 13)), 40);
    c.lerp(heart, vein * 0.5 * (1 - t));
    c.multiplyScalar(1 + fbm(x * 6, y * 6, z * 6, seed + 6) * 0.12);
  });
  const mat = new THREE.MeshPhysicalMaterial({
    vertexColors: true, roughness: 0.6, clearcoat: 0.1, clearcoatRoughness: 0.4, sheen: 0.35,
    sheenColor: col('#c8f08a'), side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  const g = new THREE.Group();
  g.add(mesh);
  return { object: g, height: 0.11, below: 0.16 };
}

export function tomate({ seed = 91 } = {}) {
  const r = rng(seed);
  const face = new THREE.MeshPhysicalMaterial({ map: tomatoTexture(), roughness: 0.22, clearcoat: 0.9, clearcoatRoughness: 0.15 });
  const skin = new THREE.MeshPhysicalMaterial({ color: col('#b4190c'), roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.1 });
  const geo = new THREE.CylinderGeometry(0.58, 0.58, 0.11, 72, 1);
  const g = new THREE.Group();
  [90, 210, 330].forEach((deg, i) => {
    const a = (deg * Math.PI) / 180;
    const m = new THREE.Mesh(geo, [skin, face, face]);
    m.position.set(Math.cos(a) * 0.47, 0.055 + i * 0.014, Math.sin(a) * 0.47);
    m.rotation.set((r() - 0.5) * 0.08, r() * Math.PI, (r() - 0.5) * 0.08);
    m.castShadow = m.receiveShadow = true;
    g.add(m);
  });
  return { object: g, height: 0.15, below: 0 };
}

export function cebolaRoxa({ seed = 101 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const rings = [[0.82, 0.1, 0.05], [0.62, -0.2, -0.1], [0.46, 0.25, -0.25], [0.7, -0.05, 0.22]];
  rings.forEach(([R, ox, oz], i) => {
    const geo = new THREE.TorusGeometry(R, 0.045, 14, 120);
    geo.rotateX(Math.PI / 2);
    geo.scale(1, 0.55, 1);
    const outer = col('#8a2b66'), inner = col('#f0d8e6');
    setColors(geo, (x, y, z, c) => {
      const d = Math.hypot(x, z);
      c.copy(outer).lerp(inner, smooth(R + 0.01, R - 0.035, d));
    });
    const mat = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.32, clearcoat: 0.8, clearcoatRoughness: 0.2 });
    const m = new THREE.Mesh(geo, mat);
    m.position.set(ox, 0.03 + i * 0.012, oz);
    m.rotation.set((r() - 0.5) * 0.1, 0, (r() - 0.5) * 0.1);
    m.castShadow = true;
    g.add(m);
  });
  return { object: g, height: 0.07, below: 0 };
}

export function onionRings({ seed = 111 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  [20, 140, 260].forEach((deg, i) => {
    const geo = new THREE.TorusGeometry(0.38, 0.13, 24, 72);
    geo.rotateX(Math.PI / 2);
    geo.scale(1, 0.78, 1);
    const disp = [];
    displaceAlongNormal(geo, (x, y, z) => {
      const d = fbm(x * 5 + i, y * 5, z * 5, seed) * 0.035 + fbm(x * 16, y * 16, z * 16, seed + 1) * 0.012;
      disp.push(d);
      return d;
    });
    const deep = col('#9a5419'), gold = col('#dc9a45'), light = col('#f1c47a');
    setColors(geo, (x, y, z, c, k) => {
      const d = disp[k];
      c.copy(deep).lerp(gold, smooth(-0.025, 0.005, d)).lerp(light, smooth(0.01, 0.035, d) * 0.6);
    });
    const mat = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.6, clearcoat: 0.25, bumpMap: bumpTexture(43, 2), bumpScale: 1.4 });
    const m = new THREE.Mesh(geo, mat);
    const a = (deg * Math.PI) / 180;
    m.position.set(Math.cos(a) * 0.48, 0.11 + i * 0.03, Math.sin(a) * 0.48);
    m.rotation.set((r() - 0.5) * 0.25, 0, (r() - 0.5) * 0.25);
    m.castShadow = true;
    g.add(m);
  });
  return { object: g, height: 0.26, below: 0 };
}

export function picles({ seed = 121 } = {}) {
  const r = rng(seed);
  const face = new THREE.MeshPhysicalMaterial({ map: pickleTexture(), roughness: 0.3, clearcoat: 0.8 });
  const skin = new THREE.MeshPhysicalMaterial({ color: col('#3b4a15'), roughness: 0.5 });
  const geo = new THREE.CylinderGeometry(0.22, 0.22, 0.035, 40);
  const g = new THREE.Group();
  const spots = [[0, 0], [0.48, 0.12], [-0.42, 0.25], [0.12, -0.5], [-0.3, -0.38], [0.35, 0.55], [-0.62, -0.05]];
  spots.forEach(([x, z], i) => {
    const m = new THREE.Mesh(geo, [skin, face, face]);
    m.position.set(x, 0.02 + (i % 3) * 0.008, z);
    m.rotation.set((r() - 0.5) * 0.12, r() * 3, (r() - 0.5) * 0.12);
    m.castShadow = true;
    g.add(m);
  });
  return { object: g, height: 0.05, below: 0 };
}

export function coleslaw({ seed = 131 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const base = alface({ seed: seed + 1 }).object;
  base.scale.set(0.9, 0.5, 0.9);
  base.traverse((o) => {
    if (o.material) {
      o.material = o.material.clone();
      o.material.color = col('#f4f1dc');
    }
  });
  g.add(base);
  const count = 520;
  const strand = new THREE.BoxGeometry(0.22, 0.014, 0.024);
  const mat = new THREE.MeshPhysicalMaterial({ roughness: 0.4, clearcoat: 0.6, clearcoatRoughness: 0.3 });
  const inst = new THREE.InstancedMesh(strand, mat, count);
  const palette = [col('#f6f2e2'), col('#f1eed6'), col('#d5e6a6'), col('#8b3a7a'), col('#f0b36a')];
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  for (let i = 0; i < count; i++) {
    const rad = Math.sqrt(r()) * 1.1, a = r() * Math.PI * 2;
    e.set((r() - 0.5) * 0.6, r() * Math.PI, (r() - 0.5) * 0.6);
    q.setFromEuler(e);
    m.compose(new THREE.Vector3(Math.cos(a) * rad, 0.04 + r() * 0.07 * (1 - rad * 0.5), Math.sin(a) * rad), q, new THREE.Vector3(1, 1, 1));
    inst.setMatrixAt(i, m);
    const p = r();
    inst.setColorAt(i, palette[p < 0.45 ? 0 : p < 0.7 ? 1 : p < 0.86 ? 2 : p < 0.95 ? 3 : 4]);
  }
  inst.castShadow = true;
  g.add(inst);
  return { object: g, height: 0.12, below: 0.08 };
}

export const INGREDIENTES = {
  paoTopo, paoBase, carne, smash, frango, bacon, cheddar, queijoAmericano,
  molhoBarbecue, maionesePicante, alface, tomate, cebolaRoxa, onionRings, picles, coleslaw,
};
