# Beco Mágico — Hamburgueria

Landing page estática com um cheeseburger em 3D (Three.js) que se desmonta camada por camada
conforme o scroll, seguido de um cardápio editorial.

## Rodar localmente

Os módulos ES precisam de um servidor HTTP (abrir o arquivo direto não funciona):

```sh
python3 -m http.server 8000
# abra http://localhost:8000
```

Não há build nem dependências para instalar: o Three.js (r169) está em `vendor/three/`.

## Onde editar

| O quê | Onde |
|---|---|
| Produtos, descrições, preços, moeda, camadas de cada hambúrguer | `js/data/cardapio.js` |
| Link de pedidos (WhatsApp, iFood…) — botões só aparecem quando preenchido | `config.pedidosUrl` em `js/data/cardapio.js` |
| Fotos reais no lugar das renderizações 3D | `foto` e `fotoAberta` de cada produto |
| Cores, fontes, espaçamentos | tokens em `:root`, `css/styles.css` (ver `DESIGN.md`) |
| Ingredientes 3D (forma, cor, material) | `js/three/ingredients.js` |
| Ritmo da animação de scroll | `js/sections/anatomia.js` |

## Estrutura

```
index.html              marcação semântica de todas as seções
css/styles.css          estilos e tokens
js/main.js              inicialização, fallbacks, cabeçalho, entradas
js/data/cardapio.js     fonte única de conteúdo
js/sections/anatomia.js abertura + desmontagem controlada pelo scroll (palco sticky)
js/sections/cardapio.js renderização do cardápio e alternância montado/aberto
js/three/ingredients.js geometria e materiais de cada ingrediente
js/three/burger.js      empilhamento e trajetórias de explosão
js/three/stage.js       renderer, luz de estúdio, enquadramento de câmera
js/three/snapshots.js   fotos do cardápio renderizadas pelo mesmo motor
```

## Pendências do cliente

- **Confirmar preços e moeda.** Os valores vieram dos prints de referência (que estavam em `$`).
- Endereço, horários, redes sociais e canal de pedidos: não foram fornecidos e não aparecem no site.
- Fotografia real é opcional: o 3D funciona sozinho, mas `foto`/`fotoAberta` aceitam imagens.

## Acessibilidade e desempenho

- `prefers-reduced-motion`: sem animação de scroll; a abertura vira estática e as camadas aparecem em lista.
- Sem WebGL: a página continua completa, com as camadas em texto e o cardápio sem imagens.
- A cena só renderiza quando algo muda (scroll, mouse, entrada) e para fora da tela.
