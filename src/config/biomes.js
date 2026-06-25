// src/config/biomes.js — paletas REACESAS por bioma. Dono: art-director.
// O estado ADORMECIDO é o mesmo em todo bioma (escuro/dessaturado — ver palette.js);
// só o REACESO muda. Atravessar o limiar regenera o mundo com o próximo tema.
// Estrutura "reinos" ordenados (Sky), costura contínua (Journey) — ver GAME_BIBLE §7.2.
// Cada bioma tem identidade PRÓPRIA (não só recolor — GAME_BIBLE §7.3):
//  fogScale  : densidade da névoa REACESA (Dunas = baixa visibilidade)
//  current   : força da correnteza que CARREGA a centelha (Recife = fluxo, refs Abzu)
//  drift     : comportamento das partículas ambientes ('float' | 'rise' | 'side')
//  track     : faixa de exploração própria (domínio público) — ver Music/CREDITS
export const BIOMES = [
  {
    name: 'O Bosque',
    leafLit: '#4dd064', trunkLit: '#5a4a2a', groundLit: '#357a4a',
    fogLit: '#bfe6d0', bgLit: '#9fd9c4', skyLit: '#dfffe9', sunLit: '#fff1d6', hemiGround: '#3d6b4d',
    bioglow: '#66ff88', ether: '#aaffff', flower: '#ffaa44',
    fogScale: 1, current: 0, drift: 'float', track: 'satie-gymnopedie',
  },
  {
    name: 'O Recife',
    leafLit: '#33d6c0', trunkLit: '#3a5a6a', groundLit: '#2a7080',
    fogLit: '#bfe2ea', bgLit: '#9fcdd9', skyLit: '#dffaff', sunLit: '#d6f0ff', hemiGround: '#2d5a6b',
    bioglow: '#5cf0e0', ether: '#aaffff', flower: '#ff77cc',
    fogScale: 1.15, current: 3.2, drift: 'rise', track: 'satie-gymnopedie',
  },
  {
    name: 'As Dunas',
    leafLit: '#e0c24a', trunkLit: '#7a5e30', groundLit: '#9a7a36',
    fogLit: '#ece2bf', bgLit: '#d9c79f', skyLit: '#fff4df', sunLit: '#ffe9c0', hemiGround: '#6b5a2d',
    bioglow: '#ffd766', ether: '#fff0aa', flower: '#ff8a44',
    fogScale: 1.9, current: 0, drift: 'side', track: 'satie-gnossienne',
  },
  {
    name: 'O Núcleo', // o destino: a origem da luz (clímax da jornada — quebra o padrão)
    leafLit: '#ffffff', trunkLit: '#caa86a', groundLit: '#cfc2a0',
    fogLit: '#fdf6e3', bgLit: '#f0e6c8', skyLit: '#ffffff', sunLit: '#fff6e0', hemiGround: '#9a8a6a',
    bioglow: '#fff0c0', ether: '#ffffff', flower: '#ffd9a0',
    fogScale: 1, current: 0, drift: 'rise', track: 'satie-gymnopedie', nucleo: true,
  },
];
