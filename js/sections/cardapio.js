import { config, produtos, formatarPreco } from '../data/cardapio.js';

// Monta o cardápio a partir da fonte única de dados.
// As imagens chegam depois (fotografia real se houver, senão renderizadas em 3D).

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function renderCardapio(lista) {
  lista.innerHTML = produtos
    .map((p, i) => {
      const num = String(i + 1).padStart(2, '0');
      const camadas = [...p.receita].reverse().map((c) => `<li>${esc(c.rotulo)}</li>`).join('');
      const pedido = config.pedidosUrl
        ? `<a class="btn btn-ember" href="${esc(config.pedidosUrl)}" target="_blank" rel="noopener">${esc(config.pedidosRotulo)}<span class="sr-only"> — ${esc(p.nome)}</span></a>`
        : '';
      return `
      <article class="prato revela${i === 0 ? ' prato--destaque' : ''}" id="prato-${esc(p.id)}" aria-labelledby="prato-${esc(p.id)}-nome">
        <div class="prato-foto" data-aberto="false" data-carregado="false">
          <div class="prato-foto-luz" aria-hidden="true"></div>
          <img class="foto-fechado" alt="${esc(p.nome)} montado" decoding="async" hidden>
          <img class="foto-aberto" alt="${esc(p.nome)} com as camadas separadas" decoding="async" hidden>
          <span class="prato-foto-num" aria-hidden="true">${num}</span>
        </div>
        <div class="prato-texto">
          <p class="prato-meta"><span>Nº ${num}</span><span>${esc(p.categoria)}</span></p>
          <h3 class="prato-nome" id="prato-${esc(p.id)}-nome">${esc(p.nome)}</h3>
          <p class="prato-desc">${esc(p.descricao)}</p>
          <div class="prato-camadas">
            <p class="prato-camadas-titulo">De cima para baixo</p>
            <ol>${camadas}</ol>
          </div>
          <div class="prato-acoes">
            <p class="preco"><span class="sr-only">Preço: </span>${esc(formatarPreco(p.preco))}</p>
            <button class="btn btn-linha" type="button" aria-pressed="false" data-toggle="${esc(p.id)}">
              <span class="btn-txt">Abrir camadas</span>
            </button>
            ${pedido}
          </div>
        </div>
      </article>`;
    })
    .join('');

  // Alternar montado/aberto: botão (toque e teclado) e hover no desktop.
  lista.querySelectorAll('.prato').forEach((art) => {
    const foto = art.querySelector('.prato-foto');
    const btn = art.querySelector('[data-toggle]');
    const set = (aberto, fromButton = false) => {
      foto.dataset.aberto = String(aberto);
      if (fromButton) {
        btn.setAttribute('aria-pressed', String(aberto));
        btn.querySelector('.btn-txt').textContent = aberto ? 'Fechar camadas' : 'Abrir camadas';
      }
    };
    btn.addEventListener('click', () => set(btn.getAttribute('aria-pressed') !== 'true', true));
    if (matchMedia('(hover: hover)').matches) {
      foto.addEventListener('pointerenter', () => set(true));
      foto.addEventListener('pointerleave', () => set(btn.getAttribute('aria-pressed') === 'true'));
    }
  });
}

export function aplicarFotos(lista, id, { fechado, aberto }) {
  const art = lista.querySelector(`#prato-${CSS.escape(id)}`);
  if (!art) return;
  const foto = art.querySelector('.prato-foto');
  const a = art.querySelector('.foto-fechado');
  const b = art.querySelector('.foto-aberto');
  let pending = 2;
  const done = () => {
    if (--pending === 0) foto.dataset.carregado = 'true';
  };
  for (const [img, src] of [[a, fechado], [b, aberto]]) {
    img.onload = done;
    img.onerror = done;
    img.src = src;
    img.hidden = false;
  }
}

export function fotosReais() {
  return produtos.filter((p) => p.foto && p.fotoAberta).map((p) => ({ id: p.id, fechado: p.foto, aberto: p.fotoAberta }));
}
