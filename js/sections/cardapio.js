import { config, produtos, formatarPreco } from '../data/cardapio.js';

// Cardápio a partir da fonte única de dados. O primeiro produto é o destaque.

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function renderCardapio(lista) {
  lista.innerHTML = produtos
    .map((p, i) => {
      const num = String(i + 1).padStart(2, '0');
      const pedido = config.pedidosUrl
        ? `<a class="btn btn-ember btn-sm" href="${esc(config.pedidosUrl)}" target="_blank" rel="noopener">${esc(config.pedidosRotulo)}<span class="sr-only"> — ${esc(p.nome)}</span></a>`
        : '';
      return `
      <article class="prato revela${i === 0 ? ' prato--destaque' : ''}" id="prato-${esc(p.id)}" aria-labelledby="prato-${esc(p.id)}-nome">
        <div class="prato-foto">
          <img src="${esc(p.foto)}" alt="${esc(p.alt)}" loading="lazy" decoding="async">
        </div>
        <div class="prato-texto">
          <p class="prato-meta"><span>${num}</span><span>${esc(p.categoria)}</span></p>
          <h3 class="prato-nome" id="prato-${esc(p.id)}-nome">${esc(p.nome)}</h3>
          <p class="prato-desc">${esc(p.descricao)}</p>
          <div class="prato-acoes">
            <p class="preco"><span class="sr-only">Preço: </span>${esc(formatarPreco(p.preco))}</p>
            ${pedido}
          </div>
        </div>
      </article>`;
    })
    .join('');
}
