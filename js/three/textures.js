import * as THREE from 'three';
import { rng } from './noise.js';

// Texturas desenhadas em canvas: superfícies que geometria sozinha não resolve.

const cache = new Map();

function canvasTexture(key, size, draw, { color = true, repeat = 1 } = {}) {
  if (cache.has(key)) return cache.get(key);
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  draw(ctx, size);
  const tex = new THREE.CanvasTexture(c);
  if (color) tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.anisotropy = 4;
  cache.set(key, tex);
  return tex;
}

// Relevo fino genérico (poros, crosta, empanado).
export function bumpTexture(seed = 3, density = 1) {
  return canvasTexture(`bump-${seed}-${density}`, 512, (ctx, s) => {
    const r = rng(seed);
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, s, s);
    const n = Math.floor(5200 * density);
    for (let i = 0; i < n; i++) {
      const v = Math.floor(r() * 255);
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      const rad = 0.6 + r() * 2.6;
      ctx.beginPath();
      ctx.arc(r() * s, r() * s, rad, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.filter = 'blur(1.2px)';
    ctx.drawImage(ctx.canvas, 0, 0);
  }, { color: false, repeat: 3 });
}

// Face cortada do tomate: pele, polpa, lóculos com gel e sementes.
export function tomatoTexture() {
  return canvasTexture('tomato', 512, (ctx, s) => {
    const r = rng(11);
    const c = s / 2;
    ctx.fillStyle = '#8f140c';
    ctx.fillRect(0, 0, s, s);
    ctx.beginPath(); ctx.arc(c, c, s * 0.49, 0, Math.PI * 2); ctx.fillStyle = '#b81e12'; ctx.fill();
    ctx.beginPath(); ctx.arc(c, c, s * 0.455, 0, Math.PI * 2); ctx.fillStyle = '#d93a22'; ctx.fill();
    const lobes = 5;
    for (let i = 0; i < lobes; i++) {
      const a = (i / lobes) * Math.PI * 2 + 0.3;
      ctx.save();
      ctx.translate(c + Math.cos(a) * s * 0.23, c + Math.sin(a) * s * 0.23);
      ctx.rotate(a);
      const g = ctx.createRadialGradient(0, 0, 4, 0, 0, s * 0.15);
      g.addColorStop(0, '#ff8a5a');
      g.addColorStop(0.7, '#f2603a');
      g.addColorStop(1, '#d93a22');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(0, 0, s * 0.16, s * 0.11, 0, 0, Math.PI * 2); ctx.fill();
      for (let k = 0; k < 9; k++) {
        ctx.fillStyle = r() > 0.5 ? '#f6d48a' : '#eac070';
        ctx.beginPath();
        ctx.ellipse((r() - 0.5) * s * 0.2, (r() - 0.5) * s * 0.12, 5, 3, r() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    const core = ctx.createRadialGradient(c, c, 0, c, c, s * 0.09);
    core.addColorStop(0, '#f07a52'); core.addColorStop(1, 'rgba(217,58,34,0)');
    ctx.fillStyle = core; ctx.beginPath(); ctx.arc(c, c, s * 0.1, 0, Math.PI * 2); ctx.fill();
  });
}

// Fatia de picles: casca verde-escura, polpa clara, anel de sementes.
export function pickleTexture() {
  return canvasTexture('pickle', 256, (ctx, s) => {
    const r = rng(23);
    const c = s / 2;
    ctx.fillStyle = '#3d4d17'; ctx.fillRect(0, 0, s, s);
    ctx.beginPath(); ctx.arc(c, c, s * 0.47, 0, Math.PI * 2); ctx.fillStyle = '#7d8f2c'; ctx.fill();
    ctx.beginPath(); ctx.arc(c, c, s * 0.4, 0, Math.PI * 2); ctx.fillStyle = '#a9b552'; ctx.fill();
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      ctx.fillStyle = '#d8d6a0';
      ctx.beginPath();
      ctx.ellipse(c + Math.cos(a) * s * 0.2, c + Math.sin(a) * s * 0.2, 6, 3.5, a, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 400; i++) {
      ctx.fillStyle = `rgba(60,70,20,${r() * 0.25})`;
      ctx.fillRect(r() * s, r() * s, 2, 2);
    }
  });
}

// Fatia de bacon: listras de carne e gordura, bordas tostadas.
export function baconTexture() {
  return canvasTexture('bacon', 512, (ctx, s) => {
    const r = rng(31);
    ctx.fillStyle = '#7a2114'; ctx.fillRect(0, 0, s, s);
    const bands = [
      [0.0, 0.14, '#4a1409'], [0.14, 0.3, '#e9b58a'], [0.3, 0.52, '#8e2a18'],
      [0.52, 0.62, '#f0c49c'], [0.62, 0.84, '#9b3320'], [0.84, 1, '#4f160a'],
    ];
    for (const [a, b, col] of bands) {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(0, a * s);
      for (let x = 0; x <= s; x += 16) ctx.lineTo(x, a * s + Math.sin(x * 0.03 + a * 10) * 6);
      for (let x = s; x >= 0; x -= 16) ctx.lineTo(x, b * s + Math.sin(x * 0.027 + b * 9) * 6);
      ctx.fill();
    }
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = `rgba(40,10,4,${r() * 0.35})`;
      ctx.beginPath(); ctx.arc(r() * s, r() * s, r() * 3, 0, Math.PI * 2); ctx.fill();
    }
  });
}

// Sombra de contato macia sob o produto.
export function shadowTexture() {
  return canvasTexture('shadow', 256, (ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(0,0,0,0.85)');
    g.addColorStop(0.45, 'rgba(0,0,0,0.45)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  });
}
