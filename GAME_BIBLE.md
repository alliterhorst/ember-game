# GAME BIBLE — EMBER (título de trabalho)

> **Documento-fonte único da verdade.** Toda skill e todo agente DEVE ler este arquivo antes
> de agir. Nenhuma decisão geral é tomada fora daqui. Mudanças de rota só editando este arquivo
> (via `game-director`). Cada decisão abaixo está **ligada a um pilar** (rastreável/auditável).
>
> **Título de trabalho:** EMBER (slug: `ember`). O `narrative-designer` pode refinar o nome;
> candidatos: Ember, Luma, Wisp, Rekindle. O conceito não muda.

---

## 0. Visão em uma frase

Você guia uma pequena **centelha de vida** por um mundo 3D adormecido e lindo; ao absorver luz e
**crescer**, você **reacende biomas inteiros** — trazendo cor, plantas e criaturas de volta — tudo
controlado **só com o cursor/dedo**, num web game que roda igualmente bem **no celular e no PC**.

> A sinergia central: **crescer = reacender = a história = o show visual**, tudo no mesmo gesto.

---

## 1. Pilares (e a lógica auditável por trás — vinda da pesquisa)

| # | Pilar | Por quê (pesquisa) |
|---|---|---|
| P1 | **Controle universal "seguir o cursor/dedo"** (Pointer Events). | É o único esquema **idêntico** no mouse e no toque, e o mais viciante+acessível (o segredo dos `.io`). Resolve "fácil + roda igual no celular e no PC" de um golpe. |
| P2 | **Crescer = reacender = o show.** O loop de absorver/crescer (do `.io`) dispara a recompensa visual (reacender) e avança a história — tudo junto. | `.io` vicia pelo crescer; a reacendida é o "juice" e o propósito. Um gesto, três recompensas. |
| P3 | **Mundo denso e variado gerado por IA.** A "impressão de mundo vasto e detalhado" vem da **quantidade e variedade** de flora/criaturas/formações. | É onde a IA brilha de verdade — gerar variedade que pareceria handcrafted. Nosso diferencial: "olha quanta coisa, e foi tudo gerado". |
| P4 | **Estética neon low-poly + bloom.** Low-poly estilizado, glow/bloom, névoa, paleta restrita. | Máximo impacto visual com custo baixo; roda liso em mobile (bloom+partículas = 70% do "uau" com 5% do custo). |
| P5 | **Mundo vivo com história leve.** A escuridão tem um porquê; reacender revela o mundo e dá propósito. | Exploração precisa de propósito; a transformação (apagado→vivo) é o motor emocional. |
| P6 | **Mobile-web-first, performático.** Mundo setorizado (~1,5–2 km²), InstancedMesh, LOD, fog, devicePixelRatio cap 2, KTX2. | Limites reais do navegador mobile; mundo "setorizado/ilhas" dá sensação de vastidão sem estourar o celular. |

---

## 2. Loop central (o que o jogador faz, segundo a segundo)

1. **Explorar** o bioma adormecido (cinza/escuro, silhuetas apagadas), guiando a centelha pelo cursor/dedo.
2. **Absorver** motas de luz e pequenas criaturas-sombra → a centelha **cresce** (fica maior/mais brilhante) e enche uma **barra de luz**.
3. **Desviar** de sombras maiores (perigo: encostar quando você é pequeno apaga parte do seu progresso → tensão justa).
4. Ao encher a barra, **REACENDER**: um pulso de luz se espalha e a região ao redor **ganha vida** — cor, plantas brotando, criaturas surgindo, partículas (o momento-uau, P2+P4).
5. Reacender abre **caminho** para novas áreas e concede **evoluções** da centelha (mais raio de absorção, dash, etc.).
6. Repetir por biomas até **reacender o Núcleo** (clímax/história).

> Ritmo: sessões curtas e "só mais uma" — cada reacendida é um pico de recompensa. Vício por crescimento + descoberta, não por competição (single-player; multiplayer fica como expansão futura).

---

## 3. Controle (P1 — núcleo da sensação)

- A centelha **segue o cursor/dedo** suavemente (lerp). **Centro da tela = parado**; quanto mais
  longe o ponteiro, mais rápido ela vai naquela direção (magnitude proporcional, com zona morta).
- **Pointer Events** unificados (mouse = toque = mesma lógica). Jogável **com uma mão**.
- Câmera **de cima** (top-down levemente inclinado), seguindo a centelha. Sem controles extras
  obrigatórios. Ação secundária (ex.: dash) = **um toque/clique**, se houver.

---

## 4. O mundo (P3, P5, P6)

- **Setorizado em biomas** (não um contínuo gigante). MVP: 1 bioma; alvo: 5–6 (ex.: **Bosque,
  Recife, Dunas, Tundra, Cavernas, Núcleo**). Cada bioma ~0,5 km², denso.
- Cada bioma tem **dois estados**: **adormecido** (dessaturado, escuro, névoa densa, silhuetas) e
  **reaceso** (cor viva, bloom, criaturas, vegetação animada). Reacender transiciona um do outro —
  o coração do "uau".
- **Geração por IA** preenche cada bioma com **variedade**: espécies de flora, criaturas-luz,
  formações, paletas — quantidade que sugere um mundo feito à mão.
- Performance: **InstancedMesh** para vegetação/criaturas (milhares = 1 draw call), **LOD**,
  frustum culling, névoa para esconder o "fim do mundo", carregamento por setor.

---

## 5. A centelha (o player)

- Uma **esfera de luz neon** com trail/partículas. **Cresce** ao absorver (raio e brilho aumentam,
  como agar.io) — feedback de poder constante.
- O tamanho define o que pode absorver/enfrentar (sombras maiores exigem você maior).
- Evoluções desbloqueadas ao reacender: **raio de absorção**, **dash curto** (toque), **velocidade**,
  **escudo de luz**. (Números: `balance-designer`.)

---

## 6. Estética visual (P4)

- **Low-poly estilizado + bloom/glow** (UnrealBloomPass), **névoa** (FogExp2), **paleta restrita**
  por bioma (adormecido = cinza-azulado; reaceso = paleta vibrante única do bioma).
- Contraste dramático **escuridão → luz** como linguagem visual central. Partículas para vida/juice.
- Legibilidade primeiro: a centelha sempre clara; perigos e coletáveis distinguíveis à primeira vista.

---

## 7. História (P5 — leve, serve o gameplay)

Premissa: o mundo de **EMBER** mergulhou na escuridão quando sua luz central se apagou. Você é a
**última centelha** — pequena, mas viva. Reacendendo cada bioma você restaura a vida, liberta as
criaturas presas na sombra e revela, em fragmentos, **o que apagou o mundo** — até reacender o
Núcleo. Tom: contemplativo, esperançoso, sem texto pesado (conta-se pela transformação do mundo).

### 7.1 Orientação (wayfinding) — "a luz é o HUD"

Decisão de design (pesquisa auditável: Journey, Gris, Abzu, Sky, Zelda BotW — ver resumo abaixo).
Os jogos-referência **não orientam por HUD**; orientam por **luz, som e arquitetura do mundo**.
Minimapa persistente foi **descartado** (quebra a imersão e a estética minimalista, e em mobile
rouba tela/atenção da mão única). O problema real não é "falta mapa" — é que **o destino não
furava a névoa** e **não havia feedback de rumo**. Solução, toda na mesma gramática (luz):

- **Farol do Coração:** cada Coração apagado emite um **brilho/feixe de luz** que fura a névoa
  (poça de luz no chão + coluna), visível de longe. É o "farol distante" do Journey, local e
  múltiplo. Pulsa mais forte quando o jogador tem luz pra entregar (barra cheia). Ao reacender,
  o farol-chamado (quente) vira **brilho verde estável** (vira um marco do mundo já vivo).
- **Centelha-bússola:** com a barra cheia, a centelha **brilha/pulsa mais do lado que aponta**
  pro Coração apagado mais próximo (princípio do "Sheikah sensor", traduzido pra luz — mobile
  costuma estar no mudo). Sem seta, sem texto — a própria luz puxa.
- **Indicadores de borda:** quando há objetivo (barra cheia), pequenas centelhas na **margem da
  tela** apontam Corações fora de vista. Somem quando o Coração entra em quadro. Vocabulário de
  luz, não seta de HUD.
- **Mapa (se um dia):** só estilo **Sky** — tela de pausa à parte mostrando o mundo reaceso vs.
  apagado (o mapa É o registro da transformação). Nunca overlay de canto.

### 7.2 Fluxo entre biomas — limiar de luz (sem tela de fase)

Ao reacender o **último Coração** de um bioma, a luz **se espalha e abre um limiar** (ponte/raiz/
passagem antes velada pela névoa). O jogador **atravessa com a própria centelha**, contínuo como
Journey — sem loading, sem menu, sem warp seco. Macroestrutura de "reinos" ordenados (Sky), costura
invisível (Journey).

### 7.3 Perigo — "as Sombras" (decisões TRAVADAS, do plano multi-agente)

A tensão prevista na bíblia vira sistema, mas **sem virar combate**. Decisões não-negociáveis:

1. **A Sombra DRENA luz (a carga/progresso), nunca mata.** Não há vida, não há game-over. O pior
   caso de errar é *recuar* — reacender de novo. Como reacender é o pico de prazer, a punição
   realimenta o loop gostoso em vez de frustrar. (Mantém Gris/Abzu: medo sereno, não adrenalina.)
2. **A defesa é a LUZ, nunca o ataque.** Crescer e reacender empurra a sombra; a centelha grande a
   repele/atravessa; a pequena desvia. Verbos da centelha (sopro/dash, raio maior, eco) iluminam
   melhor — nunca destroem.
3. **Sempre justo:** sombra/criatura-sombra é mais lenta que o jogador (desviável por construção);
   telegrafada (lida à primeira vista + drone grave); vencível a partir do estado mínimo (sem
   evoluções). Evolução = atalho/conforto, nunca requisito.
4. **Crescer desbloqueia VERBO, não número:** cada Coração reaceso dá um verbo de luz contemplativo.
5. **Identidade de bioma = mecânica + visual + som + narrativa próprios** (não recolor). A jornada
   tem FIM: o **Núcleo** (Bosque→Recife→Dunas→Tundra→Cavernas→Núcleo); fragmentos = colar contínuo.

> Plano de execução faseado em `PLAN.md`.

---

## 8. Stack técnica (decisões não-negociáveis)

| Decisão | Escolha | Por quê |
|---|---|---|
| Engine | **Three.js + Vite**, JS ESM + JSDoc | Maior base de exemplos (código IA confiável); glTF, pós-processamento, deploy estático. |
| Plataforma | **Web: navegador desktop E mobile** | O diferencial. Mobile-web-first, responsivo. |
| Controle | **Pointer Events** (mouse=toque) | P1. |
| Render | WebGL, **bloom** (postprocessing), **FogExp2** | P4. |
| Performance | **InstancedMesh**, LOD, culling, `devicePixelRatio` cap 2, **KTX2** | P6 — rodar liso em celular. |
| Mundo | Setorizado por bioma, carregamento por setor | P6. |
| Geração | IA gera variedade de flora/criaturas/paletas por bioma (pipeline a definir) | P3. |
| Áudio | Música ambiente generativa + SFX (CC0/procedural) | Reforça o tom contemplativo. |
| Deploy | Estático (GitHub Pages) | Custo zero. |

---

## 9. Escopo — MVP (a primeira fatia vertical, "impecável")

**Um bioma jogável (o Bosque), com o loop completo e a primeira reacendida como momento-uau:**
1. Centelha controlável pelo cursor/dedo (mouse+toque), câmera de cima.
2. Bosque adormecido (low-poly + névoa + paleta dessaturada), com InstancedMesh de flora/silhuetas.
3. Absorver luz/criaturas → crescer + barra de luz; uma sombra-perigo.
4. **Reacender**: pulso que transforma a região (cor, plantas, criaturas, bloom) — o clímax do MVP.
5. HUD mínimo (barra de luz, tamanho), áudio ambiente, juice.
6. Roda a 60fps no desktop e fluido no **navegador do celular** (gate obrigatório).

> Só depois: mais biomas, evoluções, história em fragmentos, geração por IA em escala, polish.

---

## 10. Princípios de produção (do estúdio)

A bíblia é a verdade; uma entrega verificável por vez; **nada fecha sem o `qa-tester` validar a
build rodando COM evidência (vídeo/sequência de frames + leitura de estado), inclusive em viewport
mobile**; números só em config; arte passa pelo `art-director` antes de produzir; **evidência
direta, não indireta** (regra dos 3 strikes anti-loop). Tudo coeso por esta bíblia (sinergia).
