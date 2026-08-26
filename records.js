'use strict';

// Gestión de la tabla de récords en localStorage (clave 'tetris.records').
// Este archivo sólo define funciones: no ejecuta lógica de arranque al cargarse.

const RECORDS_KEY = 'tetris.records';
const MAX_RECORDS = 5;

function registrosPorDefecto() {
  return { top: [], mejorCombo: 0, maxLineas: 0 };
}

// Lee y valida lo guardado en localStorage. Si no existe, está corrupto o es
// de una forma antigua, devuelve la forma por defecto sin romper el juego.
function cargarRecords() {
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    if (!raw) return registrosPorDefecto();

    const datos = JSON.parse(raw);
    if (!datos || typeof datos !== 'object') return registrosPorDefecto();

    const top = Array.isArray(datos.top)
      ? datos.top
          .filter(r => r && typeof r.score === 'number')
          .map(r => ({
            nombre: typeof r.nombre === 'string' && r.nombre ? r.nombre.slice(0, 10) : '---',
            score: r.score,
            lines: typeof r.lines === 'number' ? r.lines : 0,
            level: typeof r.level === 'number' ? r.level : 1,
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, MAX_RECORDS)
      : [];

    return {
      top,
      mejorCombo: typeof datos.mejorCombo === 'number' ? datos.mejorCombo : 0,
      maxLineas: typeof datos.maxLineas === 'number' ? datos.maxLineas : 0,
    };
  } catch (err) {
    return registrosPorDefecto();
  }
}

function guardarEnStorage(registros) {
  try {
    localStorage.setItem(RECORDS_KEY, JSON.stringify(registros));
  } catch (err) {
    // localStorage no disponible o lleno: se ignora, el juego sigue funcionando.
  }
}

// ¿Una puntuación entraría en el top 5 actual?
function entraEnTop(score) {
  const registros = cargarRecords();
  if (registros.top.length < MAX_RECORDS) return true;
  return score > registros.top[registros.top.length - 1].score;
}

// Inserta un nuevo récord, reordena y trunca a 5. Devuelve el índice donde
// quedó insertado (o -1 si no llegó a entrar en el top).
function guardarRecord({ nombre, score, lines, level }) {
  const registros = cargarRecords();
  const entrada = {
    nombre: (nombre && String(nombre).trim().slice(0, 10)) || 'AAA',
    score,
    lines,
    level,
  };
  registros.top.push(entrada);
  registros.top.sort((a, b) => b.score - a.score);
  registros.top = registros.top.slice(0, MAX_RECORDS);
  guardarEnStorage(registros);
  return registros.top.indexOf(entrada);
}

// Actualiza el mejor combo y el máximo de líneas históricos si se han superado.
function actualizarMejores({ combo, lineas }) {
  const registros = cargarRecords();
  registros.mejorCombo = Math.max(registros.mejorCombo, combo || 0);
  registros.maxLineas = Math.max(registros.maxLineas, lineas || 0);
  guardarEnStorage(registros);
}

function resetearRecords() {
  guardarEnStorage(registrosPorDefecto());
}

function escaparHtmlRecords(texto) {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}

// Pinta el top 5 + estadísticas dentro de `contenedor`. Si `indiceDestacado`
// coincide con una fila, se resalta visualmente.
function renderRecords(contenedor, indiceDestacado) {
  if (!contenedor) return;
  const registros = cargarRecords();

  let filasHtml;
  if (registros.top.length === 0) {
    filasHtml = '<li class="record-vacio">Sin récords todavía</li>';
  } else {
    filasHtml = registros.top
      .map((registro, indice) => `
        <li class="record-row${indice === indiceDestacado ? ' record-destacado' : ''}">
          <span class="record-rank">${indice + 1}</span>
          <span class="record-nombre">${escaparHtmlRecords(registro.nombre)}</span>
          <span class="record-score">${registro.score.toLocaleString()}</span>
        </li>`)
      .join('');
  }

  contenedor.innerHTML = `
    <ol class="records-list">${filasHtml}</ol>
    <div class="records-stats">
      <div class="records-stat">
        <span class="label">MEJOR COMBO</span>
        <span class="value">${registros.mejorCombo}</span>
      </div>
      <div class="records-stat">
        <span class="label">MAX LINEAS</span>
        <span class="value">${registros.maxLineas}</span>
      </div>
    </div>
  `;
}
