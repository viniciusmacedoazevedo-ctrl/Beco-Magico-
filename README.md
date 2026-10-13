# Beco Mágico — Hamburgueria

Landing page estática: hero com fotografia real e fumaça, experiência interativa com o
cheeseburger, cardápio, localização em um beco 3D, avaliações e chamada final.

## Rodar localmente

```sh
python3 -m http.server 8000
# abra http://localhost:8000
```

Sem build e sem dependências: o Three.js (r169, só para o beco 3D) está em `vendor/three/`.
No GitHub Pages: Settings → Pages → Deploy from a branch → esta branch, pasta `/ (root)`.

## Onde editar

| O quê | Onde |
|---|---|
| Produtos, descrições, preços, moeda, fotos | `produtos` em `js/data/cardapio.js` |
| Link de pedidos (botões só aparecem quando preenchido) | `config.pedidosUrl` |
| Endereço real, horário, link do mapa | `local` (mude `ficticio` para `false`) |
| Avaliações verificadas e origem | `avaliacoes` (mude `verificadas` para `true`, preencha `fonte`) |
| Foto e camadas da experiência | `experiencia` |
| Cores, fontes, espaçamentos | `:root` em `css/styles.css` (ver `DESIGN.md`) |

## Fotos — pendência importante

As fotos em `assets/fotos/` foram recortadas dos prints de referência (≈300 px cada) e
ampliadas com super-resolução. Servem como versão provisória; para a qualidade de campanha:

1. **Hero**: hambúrguer em fundo preto, ≥ 2000 px de altura (o fundo é recortado automaticamente
   se for escuro e uniforme; PNG/WebP com transparência é ainda melhor).
2. **Cardápio**: uma foto por produto, ≥ 1600 px de largura, fundo escuro.
3. **Experiência com camadas reais** (opcional): o MESMO hambúrguer fotografado camada por
   camada, mesmo ângulo e enquadramento, PNG com fundo transparente. Liste os arquivos em
   `experiencia.camadasFotos` (de baixo para cima).

## Acessibilidade e desempenho

- Cabeçalho fixo compacto com menu recolhível no celular; âncoras com compensação do cabeçalho.
- Nenhuma seção prende o scroll; a experiência funciona por slider, botões e teclado.
- `prefers-reduced-motion` respeitado; sem WebGL a página continua completa.
- Fumaça em baixa resolução e fps limitado; beco 3D carregado só perto da seção, com versão leve no celular.
