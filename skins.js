'use strict';

// Skins visuales del tablero. Cada skin define su propia paleta de colores
// (índice 0 = vacío, 1-7 alineados con PIECES/COLORS), sus fondos y su
// propia función de dibujo, con la misma firma que drawBlock en game.js.
const SKINS = {
  retro: {
    nombre: 'Retro',
    colors: [
      null,
      '#4dd0e1', // I - cyan
      '#ffd54f', // O - amarillo
      '#ba68c8', // T - morado
      '#81c784', // S - verde
      '#e57373', // Z - rojo
      '#7986cb', // J - indigo
      '#ffb74d', // L - naranja
    ],
    boardBg: '#1a1a25',
    boardBgLight: '#ffffff',
    nextBg: '#1a1a25',
    nextBgLight: '#ffffff',
    gridColor: '#22222e',
    gridColorLight: '#d0d0dc',
    blockHighlight: 'rgba(255,255,255,0.12)',
    blockHighlightLight: 'rgba(255,255,255,0.35)',
    drawBlock(context, x, y, colorIndex, size, alpha) {
      context.globalAlpha = alpha ?? 1;
      context.fillStyle = this.colors[colorIndex];
      context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
      // franja de brillo arriba
      context.fillStyle = blockHighlight;
      context.fillRect(x * size + 1, y * size + 1, size - 2, 4);
      context.globalAlpha = 1;
    },
  },

  neon: {
    nombre: 'Neón',
    colors: [
      null,
      '#00e5ff',
      '#fff176',
      '#e040fb',
      '#69f0ae',
      '#ff1744',
      '#536dfe',
      '#ff9100',
    ],
    boardBg: '#000000',
    boardBgLight: '#0a0a14',
    nextBg: '#000000',
    nextBgLight: '#0a0a14',
    gridColor: '#1a1a2e',
    gridColorLight: '#242440',
    blockHighlight: 'rgba(255,255,255,0.25)',
    blockHighlightLight: 'rgba(255,255,255,0.25)',
    drawBlock(context, x, y, colorIndex, size, alpha) {
      const color = this.colors[colorIndex];
      context.globalAlpha = alpha ?? 1;
      context.shadowColor = color;
      context.shadowBlur = 12;
      context.fillStyle = color;
      context.fillRect(x * size + 2, y * size + 2, size - 4, size - 4);
      // restaurar el glow antes de seguir dibujando cualquier otra cosa
      context.shadowBlur = 0;
      context.fillStyle = blockHighlight;
      context.fillRect(x * size + 2, y * size + 2, size - 4, 3);
      context.globalAlpha = 1;
    },
  },

  pastel: {
    nombre: 'Pastel',
    colors: [
      null,
      '#6ec6d9', // I
      '#f0c14b', // O
      '#b98cd9', // T
      '#7fc99e', // S
      '#e8827a', // Z
      '#8fa3e0', // J
      '#f0a35f', // L
    ],
    boardBg: '#2a2438',
    boardBgLight: '#f3ece0',
    nextBg: '#2a2438',
    nextBgLight: '#f3ece0',
    gridColor: 'rgba(255,255,255,0.08)',
    gridColorLight: 'rgba(0,0,0,0.08)',
    blockHighlight: 'rgba(255,255,255,0.35)',
    blockHighlightLight: 'rgba(255,255,255,0.55)',
    drawBlock(context, x, y, colorIndex, size, alpha) {
      const color = this.colors[colorIndex];
      const px = x * size + 2;
      const py = y * size + 2;
      const w = size - 4;
      const h = size - 4;
      const r = Math.min(6, w / 2, h / 2);
      context.globalAlpha = alpha ?? 1;
      context.fillStyle = color;
      if (typeof context.roundRect === 'function') {
        context.beginPath();
        context.roundRect(px, py, w, h, r);
        context.fill();
      } else {
        context.fillRect(px, py, w, h);
      }
      context.fillStyle = blockHighlight;
      if (typeof context.roundRect === 'function') {
        context.beginPath();
        context.roundRect(px, py, w, Math.min(4, h), [r, r, 0, 0]);
        context.fill();
      } else {
        context.fillRect(px, py, w, 4);
      }
      context.globalAlpha = 1;
    },
  },

  pixel: {
    nombre: 'Pixel Art',
    colors: [
      null,
      '#00b8d4',
      '#ffc400',
      '#aa00ff',
      '#00c853',
      '#d50000',
      '#304ffe',
      '#ff6d00',
    ],
    boardBg: '#0d0d0d',
    boardBgLight: '#e8e8e8',
    nextBg: '#0d0d0d',
    nextBgLight: '#e8e8e8',
    gridColor: '#2a2a2a',
    gridColorLight: '#c4c4c4',
    blockHighlight: 'rgba(255,255,255,0.2)',
    blockHighlightLight: 'rgba(255,255,255,0.4)',
    drawBlock(context, x, y, colorIndex, size, alpha) {
      const color = this.colors[colorIndex];
      const px = x * size + 1;
      const py = y * size + 1;
      const w = size - 2;
      const h = size - 2;
      context.globalAlpha = alpha ?? 1;
      context.fillStyle = color;
      context.fillRect(px, py, w, h);
      // patrón pixel-art: subdivisión ~4x4 con celdas alternadas
      const sub = 4;
      const cw = w / sub;
      const ch = h / sub;
      for (let sy = 0; sy < sub; sy++) {
        for (let sx = 0; sx < sub; sx++) {
          const claro = (sx + sy) % 2 === 0;
          context.fillStyle = claro ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
          context.fillRect(px + sx * cw, py + sy * ch, cw, ch);
        }
      }
      // borde tipo sprite
      context.fillStyle = 'rgba(0,0,0,0.35)';
      context.fillRect(px, py, w, 1);
      context.fillRect(px, py, 1, h);
      context.globalAlpha = 1;
    },
  },
};

let currentSkin = 'retro';

const skinSelect = document.getElementById('skin-select');

// Lee la skin guardada en localStorage (o 'retro' por defecto) y la aplica
// a la variable de estado, sin dibujar todavía.
function cargarSkin() {
  let skin = 'retro';
  try {
    const guardada = localStorage.getItem('tetris.skin');
    if (guardada && SKINS[guardada]) skin = guardada;
  } catch (e) {
    // localStorage no disponible (modo privado, etc.): usar valor por defecto
  }
  currentSkin = skin;
  return skin;
}

// Punto único de refresco visual: recalcula colores según la skin activa y
// el modo claro/oscuro actual, y repinta si el juego ya está inicializado.
function refrescarVisual() {
  const skin = SKINS[currentSkin] || SKINS.retro;
  const esClaro = typeof themeToggle !== 'undefined' && themeToggle && themeToggle.checked;
  gridColor = esClaro ? skin.gridColorLight : skin.gridColor;
  blockHighlight = esClaro ? skin.blockHighlightLight : skin.blockHighlight;
  boardBg = esClaro ? skin.boardBgLight : skin.boardBg;
  nextBg = esClaro ? skin.nextBgLight : skin.nextBg;
  if (typeof current !== 'undefined' && current) draw();
  if (typeof next !== 'undefined' && next) drawNext();
}

// Cambia la skin activa, la persiste, sincroniza el <select> y redibuja.
function aplicarSkin(nombre) {
  if (!SKINS[nombre]) nombre = 'retro';
  currentSkin = nombre;
  try {
    localStorage.setItem('tetris.skin', nombre);
  } catch (e) {
    // ignorar si localStorage no está disponible
  }
  if (skinSelect) skinSelect.value = nombre;
  refrescarVisual();
}

if (skinSelect) {
  skinSelect.addEventListener('change', () => aplicarSkin(skinSelect.value));
}

cargarSkin();
if (skinSelect) skinSelect.value = currentSkin;
