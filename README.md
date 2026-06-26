# EMBER — *a última centelha*

Um jogo de navegador **3D**, **mobile-first**, sobre **reacender um mundo que se apagou**.

Você guia uma centelha de luz — a última do mundo — por um bosque adormecido. Reunindo luz e
crescendo, você **reacende** os "Corações" de cada região: o que era cinza e morto volta a ter cor,
floresce e ganha vida. Reacender tudo abre um **limiar de luz** que leva ao próximo bioma — até o
**Núcleo**, a origem de toda a luz. Sem combate; a tensão vem das **Sombras**, que drenam sua luz
(nunca matam) e recuam diante dela.

> **Não é um "joguinho relaxante" passivo** — é sobre **transformação e ação**: você *age*, e o mundo
> responde. O ritmo é calmo; o que você faz, não.

🎮 Jogue: *(em breve — protótipo jogável)* · Controle de **uma mão** (mouse = toque).

---

## Rodar localmente

```bash
npm install
npm run dev      # abre em http://localhost:5174
npm run build    # build de produção (deploy estático)
```

## Stack

- **Three.js** (render 3D) + **Vite** + JavaScript (ES Modules)
- Pós-processamento: **bloom** (UnrealBloomPass) · névoa **FogExp2** · câmera top-down
- **Howler.js** para a trilha (gravações de domínio público)
- **InstancedMesh** para performance (milhares de objetos em poucos draw calls) — alvo ~60fps no celular

## Como foi feito

EMBER foi construído por um **estúdio de agentes de IA** (o Murmur Studio) orquestrados, com
**direção e curadoria humana no comando a cada passo**. A IA acelera o "como fazer";
o trabalho humano que decide a qualidade é o gosto, o julgamento, a verificação e o saber pedir ajuda.
É um experimento transparente — os jogos são o caso, não a vitrine.

Documentos de design (abertos de propósito):
- [`GAME_GUIDE.md`](GAME_GUIDE.md) — o documento mestre (decisões, pilares, mecânicas).
- [`ART_IDENTITY.md`](ART_IDENTITY.md) — a direção de arte.
- [`PLAN.md`](PLAN.md) — o plano de produção faseado.

## Open source — da comunidade, para a comunidade

EMBER **só existe** porque a comunidade open source existe. Ele roda sobre **three.js**, **Howler.js**
e **Vite** (todos MIT), com modelos 3D **CC0** do **[Kenney](https://kenney.nl/)** e uma trilha de
**domínio público** liberada pelo **[Musopen](https://musopen.org/)**. Nada disso foi pago; tudo foi
**doado ao comum** por quem veio antes.

Então a gente devolve na mesma moeda:

- **Código sob [MIT](LICENSE)** — use, estude, faça fork, construa em cima.
- **Documentos de design abertos** (`GAME_GUIDE.md`, `ART_IDENTITY.md`, `PLAN.md`) — não só o "o quê",
  mas o **porquê** de cada decisão.
- **Créditos honestos e rastreáveis** em [`CREDITS.md`](CREDITS.md): cada asset com autoria, origem e
  licença verificada **no nível da obra**.

Se isso te ajudar a aprender ou a fazer o seu jogo, já valeu. Fork, issue e PR são bem-vindos — e se
usar algo daqui, conta pra gente. **A corrente do open source só segue se a gente devolver.** 💛

## Créditos e licenças

Toda a trilha e os modelos 3D são de **domínio público / CC0 / CC BY-SA**, com a licença verificada
**no nível da gravação/modelo** e creditada em [`CREDITS.md`](CREDITS.md) (Satie, Grieg / Czech
National Symphony via Musopen·Wikimedia; Kenney Nature Kit; Three.js; Howler.js).

O **código** é distribuído sob a licença **MIT** (ver [`LICENSE`](LICENSE)). Os **assets** (trilha e
modelos 3D) **não** são cobertos pela MIT — cada um segue a própria licença, listada em [`CREDITS.md`](CREDITS.md).

> **Status:** protótipo jogável (vertical slice avançado). Não é um produto à venda.
