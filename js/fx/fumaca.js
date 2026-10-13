// Fumaça volumétrica procedural (WebGL puro, sem dependências).
// Renderiza em resolução reduzida (a fumaça é macia, o upscale do CSS não aparece),
// limita os quadros por segundo e pausa fora da tela ou com a aba oculta.

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uFocus;     // centro da coluna de fumaça, em unidades de altura (0,0 = centro)
uniform float uColumn;   // 0 = espalhada, 1 = coluna concentrada atrás do foco
uniform float uFog;      // névoa rasteira na base
uniform float uIntensity;

float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = m * p; a *= 0.5; }
  return v;
}
void main(){
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float t = uTime * 0.04;
  vec2 q = vec2(fbm(p * 1.5 + vec2(0.0, -t * 2.2)), fbm(p * 1.5 + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(p * 1.3 + 2.0 * q + vec2(1.7, 9.2) + t * 0.6), fbm(p * 1.3 + 2.0 * q + vec2(8.3, 2.8) - t * 0.4));
  float d = fbm(p * 1.15 + 1.9 * r + vec2(0.0, -t * 3.0));

  vec2 f = p - uFocus;
  float column = exp(-pow(f.x * 1.25, 2.0)) * smoothstep(0.75, -0.55, f.y);
  float spread = smoothstep(0.65, -0.5, p.y) * 0.45 * (1.0 - uFog);
  float fog = uFog * smoothstep(-0.3, -0.52, p.y) * (0.6 + 0.4 * fbm(vec2(p.x * 2.0 - t * 1.5, p.y * 4.0)));
  float shape = mix(spread, column, uColumn) + fog;
  float dens = smoothstep(0.38, 0.86, d) * shape;

  // Luz âmbar vinda de trás do produto; bordas frias e escuras.
  float glow = exp(-dot(f * vec2(1.0, 1.25), f * vec2(1.0, 1.25)) * 2.4);
  vec3 cold = vec3(0.16, 0.13, 0.12);
  vec3 warm = vec3(1.0, 0.47, 0.12);
  vec3 col = mix(cold, warm, clamp(glow * 1.35 + r.x * 0.2, 0.0, 1.0));
  float a = clamp(dens * uIntensity, 0.0, 1.0);
  gl_FragColor = vec4(col * a, a);
}`;

export class Fumaca {
  constructor(canvas, { focus = [0, -0.05], column = 0.8, fog = 0.6, intensity = 0.9, scale = 0.5, fps = 30, reduced = false } = {}) {
    this.canvas = canvas;
    this.opts = { focus, column, fog, intensity, scale, fps };
    this.reduced = reduced;
    const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false, powerPreference: 'low-power' });
    if (!gl) throw new Error('WebGL indisponível');
    this.gl = gl;
    const prog = gl.createProgram();
    for (const [type, src] of [[gl.VERTEX_SHADER, VERT], [gl.FRAGMENT_SHADER, FRAG]]) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      gl.attachShader(prog, s);
    }
    gl.linkProgram(prog);
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    this.u = Object.fromEntries(['uRes', 'uTime', 'uFocus', 'uColumn', 'uFog', 'uIntensity'].map((n) => [n, gl.getUniformLocation(prog, n)]));

    this.visible = false;
    this.t0 = performance.now() - Math.random() * 40000;
    this.last = 0;
    this.raf = 0;
    this.resize = this.resize.bind(this);
    this.loop = this.loop.bind(this);
    new ResizeObserver(this.resize).observe(canvas);
    new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting;
      this.kick();
    }, { rootMargin: '100px' }).observe(canvas);
    document.addEventListener('visibilitychange', () => this.kick());
    this.resize();
  }

  set(partial) {
    Object.assign(this.opts, partial);
    if (this.reduced) this.draw(performance.now());
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    const s = this.opts.scale;
    this.canvas.width = Math.max(2, Math.round(r.width * s));
    this.canvas.height = Math.max(2, Math.round(r.height * s));
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.draw(performance.now());
  }

  draw(now) {
    const { gl, u, opts } = this;
    gl.uniform2f(u.uRes, this.canvas.width, this.canvas.height);
    gl.uniform1f(u.uTime, (now - this.t0) / 1000);
    gl.uniform2f(u.uFocus, opts.focus[0], opts.focus[1]);
    gl.uniform1f(u.uColumn, opts.column);
    gl.uniform1f(u.uFog, opts.fog);
    gl.uniform1f(u.uIntensity, opts.intensity);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  kick() {
    if (this.reduced) return;
    if (this.visible && !document.hidden && !this.raf) this.raf = requestAnimationFrame(this.loop);
  }

  loop(now) {
    this.raf = 0;
    if (!this.visible || document.hidden) return;
    if (now - this.last >= 1000 / this.opts.fps) {
      this.last = now;
      this.draw(now);
    }
    this.raf = requestAnimationFrame(this.loop);
  }
}

export function criarFumaca(canvas, opts) {
  try {
    return new Fumaca(canvas, opts);
  } catch (err) {
    console.warn('Fumaça indisponível:', err);
    canvas.remove();
    return null;
  }
}
