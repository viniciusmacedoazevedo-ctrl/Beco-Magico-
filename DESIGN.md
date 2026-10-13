# Beco Mágico — Design

## Mundo visual
Estúdio de fotografia gastronômica no escuro. Fundo preto quente, uma luz principal âmbar
vinda do alto à esquerda, contraluz laranja separando o produto do fundo. O hambúrguer é o
único objeto iluminado da cena; o resto da interface é tipografia e silêncio.
Derivado dos prints de referência (preto + laranja + condensada pesada), mas sem cards
repetidos, sem ícones decorativos e sem script manuscrito.

## Tokens (`css/styles.css`, `:root`)
| token | valor | uso |
|---|---|---|
| `--bg` | `#0b0907` | fundo base |
| `--bg-raise` | `#14100c` | faixas e superfícies |
| `--line` | `rgb(255 236 214 / .1)` | divisores |
| `--text` | `#f6ede1` | texto principal |
| `--muted` | `#a8988a` | texto secundário |
| `--ember` | `#f07c1e` | ação principal, destaques |
| `--ember-ink` | `#1a0d03` | texto sobre `--ember` |
| `--mustard` | `#f4b43c` | preços |
| `--glow` | `rgb(240 124 30 / .22)` | halo de luz atrás do produto |

## Tipografia
- Display: **Big Shoulders Display** 800–900, caixa-alta, entrelinha apertada.
- Texto: **Geist** 400–600.
- Rótulos, números, preços pequenos: **Geist Mono**, caixa-alta, espaçada.

## Produto em 3D
`js/three/` gera cada ingrediente como geometria com material físico (pão com gergelim,
carne com crosta, cheddar escorrendo, alface ondulada, tomate, cebola roxa, bacon, onion
rings, frango empanado, picles, coleslaw, molhos). As imagens do cardápio são renderizadas
pelo mesmo motor, com a mesma luz e câmera. Para trocar por fotografia real, preencha
`foto`/`fotoAberta` no produto em `js/data/cardapio.js`.

## Movimento
- Entrada: o hambúrguer desce e assenta em ~1s; nada bloqueia o scroll.
- Seção de anatomia: progresso do scroll → separação das camadas (pão de cima primeiro,
  cada camada com atraso, inclinação e rotação próprias), rótulos com linhas guia,
  frase final, transição para o cardápio.
- `prefers-reduced-motion`: sem entrada animada; anatomia mostrada já aberta, estática.
