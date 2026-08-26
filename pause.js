'use strict';

// Menú de pausa: overlay independiente (#pause-menu) con Reanudar, Reiniciar,
// "Ver controles" y un selector de nivel inicial persistido en localStorage.
// Este script sólo define cosas: no ejecuta lógica de arranque del juego.
// Se carga antes que game.js, así que game.js puede usar `nivelInicial`,
// `abrirMenuPausa()` y `cerrarMenuPausa()` como globales ya definidos.

const NIVEL_INICIAL_MIN = 1;
const NIVEL_INICIAL_MAX = 15;
const NIVEL_INICIAL_KEY = 'tetris.startLevel';

let nivelInicial = cargarNivelInicial();

let pauseMenuEl, pauseLevelSelect, pauseControlsBox;
let pauseResumeBtn, pauseRestartBtn, pauseControlsBtn;

function esNivelValido(n) {
  return Number.isInteger(n) && n >= NIVEL_INICIAL_MIN && n <= NIVEL_INICIAL_MAX;
}

function cargarNivelInicial() {
  try {
    const guardado = parseInt(localStorage.getItem(NIVEL_INICIAL_KEY), 10);
    if (esNivelValido(guardado)) return guardado;
  } catch (e) {
    // localStorage no disponible: usar el valor por defecto
  }
  return 1;
}

function guardarNivelInicial(nivel) {
  try {
    localStorage.setItem(NIVEL_INICIAL_KEY, String(nivel));
  } catch (e) {
    // ignorar si localStorage no está disponible
  }
}

function construirMenuPausa() {
  pauseMenuEl = document.getElementById('pause-menu');
  if (!pauseMenuEl) return;

  pauseResumeBtn = document.getElementById('pause-resume-btn');
  pauseRestartBtn = document.getElementById('pause-restart-btn');
  pauseControlsBtn = document.getElementById('pause-controls-btn');
  pauseControlsBox = document.getElementById('pause-controls-box');
  pauseLevelSelect = document.getElementById('pause-level-select');

  // Poblar el selector de nivel inicial (1 a 15)
  for (let n = NIVEL_INICIAL_MIN; n <= NIVEL_INICIAL_MAX; n++) {
    const opt = document.createElement('option');
    opt.value = String(n);
    opt.textContent = String(n);
    pauseLevelSelect.appendChild(opt);
  }
  pauseLevelSelect.value = String(nivelInicial);

  pauseResumeBtn.addEventListener('click', () => {
    if (paused) togglePause();
  });

  pauseRestartBtn.addEventListener('click', () => {
    cerrarMenuPausa();
    init();
  });

  pauseControlsBtn.addEventListener('click', () => {
    pauseControlsBox.classList.toggle('hidden');
  });

  pauseLevelSelect.addEventListener('change', () => {
    const valor = parseInt(pauseLevelSelect.value, 10);
    if (esNivelValido(valor)) {
      nivelInicial = valor;
      guardarNivelInicial(valor);
    }
  });
}

function abrirMenuPausa() {
  if (!pauseMenuEl) return;
  pauseLevelSelect.value = String(nivelInicial);
  pauseControlsBox.classList.add('hidden');
  pauseMenuEl.classList.remove('hidden');
  pauseResumeBtn.focus();
}

function cerrarMenuPausa() {
  if (!pauseMenuEl) return;
  pauseMenuEl.classList.add('hidden');
  // Evita que un botón del menú conserve el foco: si quedara enfocado,
  // la siguiente pulsación de Space/flecha podría "hacer clic" en él
  // en vez de mover la pieza (el movimiento accidental al volver).
  if (document.activeElement && pauseMenuEl.contains(document.activeElement)) {
    document.activeElement.blur();
  }
}

construirMenuPausa();
