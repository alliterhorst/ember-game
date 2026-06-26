# Créditos — EMBER

> EMBER existe porque a **comunidade open source** existe. Engine, bibliotecas, modelos 3D e a
> trilha sonora são trabalho de outras pessoas, liberado livremente. Este arquivo credita cada
> fonte com **autoria, origem e licença verificada** — e é a nossa forma de retribuir: créditos
> honestos, links que funcionam e licenças respeitadas. **Da comunidade open source, para a
> comunidade open source.**
>
> Toda licença foi verificada **no nível da obra específica** (a gravação/o modelo), não só da
> composição ou do pacote. Onde a licença exige atribuição, ela está aqui.

---

## 🎵 Trilha sonora

Compositores em domínio público; o que importa é a licença da **gravação** (a performance tem
direito próprio). Todas as gravações abaixo são livres, verificadas na fonte.

| Obra | Performance / Fonte | Licença | Arquivo |
|---|---|---|---|
| **Erik Satie — Gymnopédie nº 1** *(leito de exploração)* | Robin Alciatore, via [Musopen](https://musopen.org/) | **Domínio público** ([PD Mark](https://creativecommons.org/publicdomain/mark/1.0/)) | `public/assets/audio/satie-gymnopedie.ogg` |
| **Erik Satie — Gnossienne nº 1** *(bioma "As Dunas")* | La Pianista | **CC BY-SA 3.0** *(atribuição obrigatória)* | `public/assets/audio/satie-gnossienne.ogg` |
| **Edvard Grieg — "Morning Mood"** (Peer Gynt, Suíte nº 1) *(clímax / o bosque renasce)* | Czech National Symphony Orchestra ("Musopen Symphony"), Projeto Kickstarter [Musopen](https://musopen.org/) | **Domínio público** ([PD Mark](https://creativecommons.org/publicdomain/mark/1.0/)) | `public/assets/audio/grieg-morning.ogg` |

**Origens (links diretos):**
- Gymnopédie nº 1 — Wikimedia Commons: https://commons.wikimedia.org/wiki/File:Erik_Satie_-_gymnopedies_-_la_1_ere._lent_et_douloureux.ogg
- Gnossienne nº 1 — Wikimedia Commons: https://commons.wikimedia.org/wiki/File:Satie_-_Gnossienne_1.ogg
  · Licença: [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) — atribuição a **La Pianista**, compartilhada sob a mesma licença.
- Morning Mood — Wikimedia Commons: https://commons.wikimedia.org/wiki/File:Musopen_-_Morning.ogg

> 💛 Obrigada ao **[Musopen](https://musopen.org/)** por financiar e liberar gravações orquestrais
> ao domínio público — sem isso, um protótipo não teria uma orquestra de verdade no clímax.

---

## 🌿 Modelos 3D

Toda a vegetação e os elementos de cenário vêm do **Kenney Nature Kit**, liberado em **CC0 1.0**
(domínio público — uso livre, sem atribuição obrigatória; creditamos por gratidão).

- **Kenney — Nature Kit** — https://kenney.nl/assets/nature-kit
- Autor: **Kenney** (kenney.nl) · Licença: [**CC0 1.0**](https://creativecommons.org/publicdomain/zero/1.0/)

| Arquivo | O que é |
|---|---|
| `public/assets/models/nature/flower_purpleC.glb` | flor roxa |
| `public/assets/models/nature/flower_redA.glb` | flor vermelha |
| `public/assets/models/nature/flower_yellowB.glb` | flor amarela |
| `public/assets/models/nature/grass_leafs.glb` | tufo de grama |
| `public/assets/models/nature/mushroom_red.glb` | cogumelo vermelho |
| `public/assets/models/nature/mushroom_tanGroup.glb` | grupo de cogumelos |
| `public/assets/models/nature/plant_bushSmall.glb` | arbusto pequeno |
| `public/assets/models/nature/rock_smallC.glb` | pedra pequena |
| `public/assets/models/nature/rock_tallD.glb` | pedra alta |
| `public/assets/models/nature/stone_smallB.glb` | seixo |

> 💛 Obrigada ao **Kenney** por anos de assets CC0 que sustentam protótipos e jogos da comunidade
> inteira.

---

## 🛠️ Engine, bibliotecas e ferramentas

Tudo open source, tudo MIT — a base sobre a qual o EMBER roda.

| Projeto | Para quê | Licença |
|---|---|---|
| **[three.js](https://threejs.org/)** (`^0.171`) | render 3D / WebGL | [MIT](https://github.com/mrdoob/three.js/blob/dev/LICENSE) |
| **[Howler.js](https://howlerjs.com/)** (`^2.2`) | áudio web (trilha adaptativa) | [MIT](https://github.com/goldfire/howler.js/blob/master/LICENSE) |
| **[Vite](https://vitejs.dev/)** (`^6`) | dev server + build | [MIT](https://github.com/vitejs/vite/blob/main/LICENSE) |
| **[Vitest](https://vitest.dev/)** (`^2.1`) | testes da lógica pura | [MIT](https://github.com/vitest-dev/vitest/blob/main/LICENSE) |

---

## 📜 Licença deste projeto

- **Código:** [MIT](LICENSE) — use, modifique, faça fork, aprenda, construa em cima.
- **Assets:** seguem as licenças listadas acima (a MIT do código **não** os cobre). Em especial, a
  gravação da **Gnossienne nº 1** é **CC BY-SA 3.0** — se você reusar esse arquivo, mantenha a
  atribuição a La Pianista e a mesma licença.
- **Documentos de design** (`GAME_GUIDE.md`, `ART_IDENTITY.md`, `PLAN.md`): abertos de propósito,
  pra quem quiser ver como o jogo foi pensado.

> Se você usar EMBER (código, design ou ideias) em algo seu, adoraríamos saber. Sem obrigação —
> só o gosto de ver a corrente do open source seguir.
