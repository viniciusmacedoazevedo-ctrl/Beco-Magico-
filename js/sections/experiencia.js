import { experiencia } from '../data/cardapio.js';

// Experiência opcional e delimitada: uma fotografia real do produto percorrida camada por camada.
// - Controle direto: slider (arrastar/teclado/toque) e botões de cada camada.
// - Scroll local: enquanto o visitante não toca nos controles, a passagem da seção pela tela
//   conduz a apresentação. Nada prende a página; a seção tem altura normal.
// - Com `camadasFotos` preenchido, as camadas recortadas se separam de verdade.

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const ease = (t) => t * t * (3 - 2 * t);
const A = 0.07, B = 0.9; // início e fim do percurso pelas camadas

export function initExperiencia(section, { reduced }) {
  const quadro = section.querySelector('.exp-quadro');
  const foto = section.querySelector('.exp-foto');
  const slider = section.querySelector('.exp-slider');
  const lista = section.querySelector('.exp-paradas');
  const atualNum = section.querySelector('.exp-atual-num');
  const atualNome = section.querySelector('.exp-atual-nome');
  const marcador = section.querySelector('.exp-marcador');
  const marcadorTxt = marcador.querySelector('.exp-marcador-txt');
  const finais = section.querySelector('.exp-finais');
  const paradas = experiencia.paradas;
  const n = paradas.length;
  const modoCamadas = experiencia.camadasFotos.length > 1;

  // Foto real (ou pilha de camadas recortadas, quando existir).
  quadro.style.aspectRatio = `${experiencia.largura} / ${experiencia.altura}`;
  if (modoCamadas) {
    foto.innerHTML = experiencia.camadasFotos
      .map((src, i) => `<img class="exp-camada" src="${src}" alt="" style="z-index:${i + 1}" decoding="async">`)
      .join('');
    foto.setAttribute('role', 'img');
    foto.setAttribute('aria-label', experiencia.alt);
  } else {
    foto.innerHTML = `<picture>
      <source media="(max-width: 700px)" srcset="${experiencia.fotoMobile}">
      <img src="${experiencia.foto}" alt="${experiencia.alt}" width="${experiencia.largura}" height="${experiencia.altura}" loading="lazy" decoding="async">
    </picture>`;
  }
  const camadas = [...foto.querySelectorAll('.exp-camada')];

  // Botões de cada camada (de cima para baixo) e rótulos da composição final.
  const valorDa = (i) => A + (i / (n - 1)) * (B - A);
  lista.innerHTML = paradas
    .map((p, i) => `<li><button type="button" data-i="${i}"><span>${String(i + 1).padStart(2, '0')}</span>${p.rotulo}</button></li>`)
    .join('');
  finais.innerHTML = paradas
    .map((p, i) => `<span class="exp-final" data-lado="${i % 2 ? 'dir' : 'esq'}" style="top:${p.y * 100}%">${p.rotulo}</span>`)
    .join('');
  const botoes = [...lista.querySelectorAll('button')];
  const rotulosFinais = [...finais.children];

  const state = { v: 0, target: 0, manual: false, raf: 0, last: 0, tween: null, ativo: -1 };
  const zoomMax = () => (quadro.clientWidth < 520 ? 0.38 : 0.5);

  function render() {
    const v = state.v;
    const H = quadro.clientHeight;
    let k, y, ativo;
    if (v < A) {
      k = ease(v / A);
      y = paradas[0].y;
      ativo = v > A * 0.5 ? 0 : -1;
    } else if (v <= B) {
      k = 1;
      const pos = ((v - A) / (B - A)) * (n - 1);
      const i = Math.min(n - 2, Math.floor(pos));
      y = paradas[i].y + (paradas[i + 1].y - paradas[i].y) * ease(pos - i);
      ativo = Math.round(pos);
    } else {
      k = 1 - ease((v - B) / (1 - B));
      y = paradas[n - 1].y;
      ativo = v > 0.97 ? n : n - 1;
    }

    const s = 1 + zoomMax() * k;
    const layerPx = y * H;
    const t = -(layerPx - H / 2) * s * k;
    const screenY = H / 2 + (layerPx - H / 2) * s + t;

    if (modoCamadas) {
      // Separação real das camadas: o topo sobe primeiro, cada camada com o próprio atraso.
      const open = ease(clamp01(v / B));
      camadas.forEach((img, i) => {
        const fromTop = camadas.length - 1 - i;
        const local = ease(clamp01((open - fromTop * 0.06) / (1 - (camadas.length - 1) * 0.06)));
        const centro = (camadas.length - 1) / 2;
        img.style.transform = `translate3d(0, ${-(i - centro) * 9 * local}%, 0) rotate(${(i % 2 ? 1 : -1) * 1.2 * local}deg)`;
      });
      foto.style.transform = `scale(${1 - 0.18 * open})`;
    } else {
      foto.style.transform = `translate3d(0, ${t.toFixed(1)}px, 0) scale(${s.toFixed(4)})`;
    }

    quadro.style.setProperty('--ly', `${screenY.toFixed(1)}px`);
    quadro.style.setProperty('--lk', String(modoCamadas ? 0 : k));
    marcador.style.opacity = String(ativo >= 0 && ativo < n ? k : 0);
    marcador.style.transform = `translate3d(0, ${screenY.toFixed(1)}px, 0)`;
    const fim = v > B ? ease((v - B) / (1 - B)) : 0;
    rotulosFinais.forEach((el, i) => (el.style.opacity = String(clamp01(fim * 1.6 - i * 0.08))));

    if (ativo !== state.ativo) {
      state.ativo = ativo;
      botoes.forEach((b, i) => b.setAttribute('aria-current', String(i === ativo)));
      if (ativo >= 0 && ativo < n) {
        atualNum.textContent = `${String(ativo + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}`;
        atualNome.textContent = paradas[ativo].rotulo;
        marcadorTxt.textContent = paradas[ativo].rotulo;
      } else if (ativo === n) {
        atualNum.textContent = `${n} camadas`;
        atualNome.textContent = 'Tudo à mostra';
      } else {
        atualNum.textContent = `${n} camadas`;
        atualNome.textContent = 'Montado';
      }
      slider.setAttribute('aria-valuetext', atualNome.textContent);
    }
    slider.value = String(Math.round(v * 1000));
    slider.style.setProperty('--fill', `${v * 100}%`);
  }

  function tick(now) {
    const dt = Math.min(0.05, (now - (state.last || now)) / 1000);
    state.last = now;
    if (state.tween) {
      const { from, to, start, dur } = state.tween;
      const p = clamp01((now - start) / dur);
      state.v = from + (to - from) * (1 - Math.pow(1 - p, 3));
      if (p >= 1) state.tween = null;
    } else {
      state.v += (state.target - state.v) * (1 - Math.exp(-dt * 7));
      if (Math.abs(state.target - state.v) < 0.0005) state.v = state.target;
    }
    render();
    state.raf = state.tween || state.v !== state.target ? requestAnimationFrame(tick) : 0;
  }
  const wake = () => {
    if (!state.raf) {
      state.last = 0;
      state.raf = requestAnimationFrame(tick);
    }
  };

  function irPara(v, dur = 700) {
    state.manual = true;
    state.target = v;
    if (reduced) {
      state.v = v;
      render();
      return;
    }
    state.tween = { from: state.v, to: v, start: performance.now(), dur };
    wake();
  }

  slider.addEventListener('input', () => {
    state.manual = true;
    state.tween = null;
    state.target = state.v = Number(slider.value) / 1000;
    render();
  });
  botoes.forEach((b) => b.addEventListener('click', () => irPara(valorDa(Number(b.dataset.i)))));
  section.querySelector('[data-exp="montar"]').addEventListener('click', () => irPara(0));
  section.querySelector('[data-exp="abrir"]').addEventListener('click', () => irPara(1, 900));

  // Scroll local: só conduz enquanto o visitante não assumiu o controle.
  if (!reduced) {
    const onScroll = () => {
      if (state.manual) return;
      const r = section.getBoundingClientRect();
      const p = clamp01((innerHeight * 0.7 - r.top) / (r.height * 0.95));
      state.target = p;
      wake();
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  new ResizeObserver(render).observe(quadro);
  render();
}
