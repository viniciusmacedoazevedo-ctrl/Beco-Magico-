import * as THREE from 'three';
import { INGREDIENTES } from './ingredients.js';
import { rng } from './noise.js';

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smoother = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a, b, t) => a + (b - a) * t;

// Um hambúrguer montado a partir de uma receita (camadas de baixo para cima)
// que sabe se abrir: setExplode(0) = montado, setExplode(1) = camadas suspensas.
export class Burger {
  constructor(receita, { spread = 5.0, seed = 4 } = {}) {
    this.group = new THREE.Group();
    this.stack = new THREE.Group();
    this.group.add(this.stack);
    this.layers = [];

    const seen = {};
    for (const item of receita) {
      const make = INGREDIENTES[item.tipo];
      if (!make) throw new Error(`Ingrediente desconhecido: ${item.tipo}`);
      const n = (seen[item.tipo] = (seen[item.tipo] || 0) + 1) - 1;
      const built = make({ ...(item.opcoes || {}), ...(n > 0 ? { seed: 200 + n * 7 } : {}) });
      built.object.traverse((o) => {
        if (o.isMesh) o.castShadow = o.receiveShadow = true;
      });
      this.stack.add(built.object);
      this.layers.push({ ...built, rotulo: item.rotulo, tipo: item.tipo });
    }

    // Posições montadas: empilhamento simples.
    let y = 0;
    for (const l of this.layers) {
      l.ay = y;
      y += l.height;
    }
    this.assembledHeight = y;

    // Posições abertas: espaço constante entre camadas, mais o que cada uma pendura.
    const n = this.layers.length;
    const solid = this.layers.reduce((s, l, i) => s + l.height + (i > 0 ? l.below : 0), 0);
    const gap = Math.max(0.28, (spread - solid) / Math.max(1, n - 1));
    let ey = 0;
    this.layers.forEach((l, i) => {
      if (i > 0) ey += gap + l.below;
      l.ey = ey;
      ey += l.height;
    });
    this.explodedHeight = ey + this.layers[0].below;

    // Cada camada tem a própria trajetória: atraso (de cima para baixo), inclinação e giro.
    const r = rng(seed);
    const maxDelay = 0.38;
    this.maxDelay = maxDelay;
    this.layers.forEach((l, i) => {
      const fromTop = n - 1 - i;
      l.delay = (fromTop / Math.max(1, n - 1)) * maxDelay;
      const isTop = i === n - 1, isBottom = i === 0;
      l.tiltX = isTop ? -0.06 : isBottom ? 0.32 : 0.2 + r() * 0.12;
      l.tiltZ = (r() - 0.5) * 0.14;
      l.spin = (r() - 0.5) * 0.7;
      l.drift = (i % 2 ? 1 : -1) * (0.03 + r() * 0.05);
      l.scale = isTop || isBottom ? 1 : 1 + r() * 0.03;
    });

    this.crumbs = makeCrumbs(r, this.explodedHeight);
    this.group.add(this.crumbs.mesh);
    this.explode = -1;
    this.setExplode(0);
  }

  // Progresso local de uma camada, já suavizado.
  layerT(l, e) {
    return smoother(clamp01((e - l.delay) / (1 - this.maxDelay)));
  }

  setExplode(e) {
    if (e === this.explode) return;
    this.explode = e;
    const ca = this.assembledHeight / 2;
    const ce = this.explodedHeight / 2;
    for (const l of this.layers) {
      const t = this.layerT(l, e);
      const o = l.object;
      o.position.y = lerp(l.ay - ca, l.ey - ce, t);
      o.position.x = l.drift * t;
      o.rotation.set(l.tiltX * t, l.spin * t, l.tiltZ * t);
      o.scale.setScalar(lerp(1, l.scale, t));
    }
    this.crumbs.update(e);
  }

  height(e = this.explode) {
    return lerp(this.assembledHeight, this.explodedHeight, smoother(clamp01(e)));
  }

  // Limites verticais reais (cada camada anda no próprio ritmo).
  extent() {
    let top = -Infinity, bottom = Infinity;
    for (const l of this.layers) {
      const y = l.object.position.y;
      top = Math.max(top, y + l.height);
      bottom = Math.min(bottom, y - l.below * 0.6);
    }
    return { top, bottom };
  }

  // Altura da base do pão de baixo (para a sombra de contato).
  bottomY() {
    return this.layers[0].object.position.y;
  }

  dispose() {
    this.group.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) [].concat(o.material).forEach((m) => m.dispose());
    });
  }
}

// Migalhas e gergelim soltos que só aparecem quando o hambúrguer se abre.
function makeCrumbs(r, h) {
  const count = 34;
  const geo = new THREE.IcosahedronGeometry(1, 0);
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.7 });
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  const palette = [new THREE.Color('#e7c08a'), new THREE.Color('#c7853f'), new THREE.Color('#f2e2b8'), new THREE.Color('#8a4a1e')];
  const items = Array.from({ length: count }, (_, i) => {
    const a = r() * Math.PI * 2;
    const rad = 1.25 + r() * 1.0;
    mesh.setColorAt(i, palette[Math.floor(r() * palette.length)]);
    return {
      a, rad,
      y: (r() - 0.5) * h * 0.9,
      s: 0.018 + r() * 0.03,
      rot: new THREE.Euler(r() * 6, r() * 6, r() * 6),
      delay: 0.25 + r() * 0.4,
    };
  });
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3();
  return {
    mesh,
    update(e) {
      items.forEach((c, i) => {
        const t = smoother(clamp01((e - c.delay) / 0.35));
        const rad = c.rad * (0.6 + 0.4 * t);
        p.set(Math.cos(c.a) * rad, c.y * t, Math.sin(c.a) * rad);
        q.setFromEuler(c.rot);
        s.setScalar(c.s * t + 1e-5);
        m.compose(p, q, s);
        mesh.setMatrixAt(i, m);
      });
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
}
