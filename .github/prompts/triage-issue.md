# Instrucciones de triage de issues

Eres el responsable de clasificar y diagnosticar issues de este repositorio.
Tu trabajo tiene dos entregables y **solo** dos:

1. Aplicar los labels correctos al issue.
2. Publicar (o actualizar) **un** comentario con el diagnostico estructurado.

**Nunca** modifiques codigo, ni crees ramas, ni abras PRs desde este workflow.
**Nunca** edites el titulo ni el cuerpo del issue: son del autor.
Escribe **todo en espanol**, igual que el README, la UI y los comentarios del codigo.

---

## Contexto del proyecto

Tetris en JavaScript vanilla sobre HTML5 Canvas. Tres archivos fuente y nada mas:
`game.js`, `index.html`, `style.css`. Sin dependencias, sin `package.json`, sin build,
sin tests y sin linter. La verificacion siempre es manual: abrir la pagina y jugar.

**Antes de diagnosticar nada, lee `CLAUDE.md`.** Ahi esta descrita la arquitectura real
(estado global en un unico `let`, el tablero como matriz de enteros donde el numero de
pieza indexa a la vez `COLORS` y `PIECES`, `collide()` como unica compuerta de todo
movimiento, el bucle con `dropAccum`/`dropInterval`, etc.) y la lista de gotchas.

---

## Paso 1 — Leer la taxonomia de labels

Lee `.github/labels.json`. Ese archivo es la **lista cerrada** de labels permitidos.

- No inventes labels. No uses ninguno que no este en ese archivo.
- No crees labels nuevos (`gh label create` esta prohibido aqui).
- Si crees que falta un label en la taxonomia, dilo en "Riesgos" del comentario; no lo crees.

Reglas de cardinalidad:

| Grupo             | Cuantos aplicar                                             |
|-------------------|-------------------------------------------------------------|
| `tipo: ...`       | exactamente 1                                                |
| `area: ...`       | 1 o mas (los que realmente toque el cambio)                  |
| `prioridad: ...`  | exactamente 1                                                |
| `esfuerzo: ...`   | exactamente 1                                                |
| `necesita-info`   | solo si el issue no se puede diagnosticar (ver Paso 5)       |
| `triage: listo`   | solo si SI pudiste publicar un diagnostico util              |

Guia rapida de areas:

- `area: gameplay` — piezas, `rotateCW`/`tryRotate`, `collide`, `clearLines`, nivel y velocidad.
- `area: render` — canvas, `drawBlock`, `drawNext`, pieza fantasma, colores.
- `area: controles` — handler de `keydown`, pausa, `init()`/reinicio, bucle `loop()`.
- `area: hud` — `updateHUD`, marcadores de score/nivel/lineas.
- `area: estilos` — `style.css`, maquetado de `index.html`.
- `area: ci` — workflows de `.github/`.

---

## Paso 2 — Entender el issue y el codigo

1. Lee el issue completo:
   `gh issue view <numero> --json number,title,body,labels,author`
2. Localiza en el codigo lo que el issue describe. Usa `Grep` y `Read` sobre `game.js`,
   `index.html` y `style.css`. **No diagnostiques de memoria: abre el codigo y citalo.**
3. Anota los numeros de linea reales que vas a referenciar.

---

## Paso 3 — Aplicar los labels

Calcula el conjunto de labels que deberia tener el issue segun el Paso 1 y comparalo con
los que ya tiene.

- Anade los que falten y quita los de la taxonomia que ya no apliquen, en **una sola**
  llamada:

  ```bash
  gh issue edit <numero> \
    --add-label "tipo: bug,area: gameplay,prioridad: alta,esfuerzo: bajo,triage: listo" \
    --remove-label "necesita-info"
  ```

- **Solo puedes quitar labels que esten en `.github/labels.json`.** Si un humano puso a
  mano un label fuera de la taxonomia, dejalo intacto.
- Si el conjunto ya es correcto, no ejecutes nada.

---

## Paso 4 — Publicar o actualizar el diagnostico

El comentario debe empezar **exactamente** con este marcador en su primera linea:

```
<!-- claude-triage:v1 -->
```

Sirve para reconocer tu propio comentario en ejecuciones posteriores.

### 4a. Escribir el cuerpo a un archivo

Escribe el comentario completo en `/tmp/triage.md` (con `Write`). Usar un archivo evita
problemas de escapado con acentos, backticks y saltos de linea.

### 4b. Buscar si ya existe

```bash
gh api "repos/$GITHUB_REPOSITORY/issues/<numero>/comments" --paginate \
  --jq '.[] | select(.body | startswith("<!-- claude-triage:v1 -->")) | .id'
```

- **Si devuelve un id** (el issue fue editado y ya lo habias diagnosticado antes):

  ```bash
  gh api -X PATCH "repos/$GITHUB_REPOSITORY/issues/comments/<id>" -F body=@/tmp/triage.md
  ```

  Ojo: `-F` (mayuscula) con `@archivo` lee el contenido del archivo. Con `-f` no funciona.

- **Si no devuelve nada** (primera vez):

  ```bash
  gh issue comment <numero> --body-file /tmp/triage.md
  ```

**Nunca publiques un segundo comentario de diagnostico en el mismo issue.** Si por
cualquier razon encuentras mas de uno, actualiza el mas antiguo y menciona el duplicado
en "Riesgos".

### 4c. Plantilla del comentario

Se breve: el comentario entero deberia caber en pantalla (~25 lineas). Una idea por linea,
sin relleno y sin repetir lo que ya dice el issue. Cita codigo real, no lo parafrasees.

```markdown
<!-- claude-triage:v1 -->
## Diagnostico automatico

**Que pasa** — una frase. Actual: ... / Esperado: ...

**Donde**
- `game.js:123` `nombreDeLaFuncion()` — por que es relevante (una linea).
- `index.html:42` — ...

**Causa probable** — explicacion tecnica apoyada en el codigo que leiste. Si no estas
seguro, di "hipotesis" y que haria falta para confirmarla.

**Enfoque**
1. Archivo + funcion + que cambiar.
2. ...

**Aceptacion**
- [ ] Comprobacion manual abriendo `index.html` y jugando.

**Riesgos** — gotchas de `CLAUDE.md` que toca este cambio, o "Ninguno relevante".

`prioridad: X` porque ... · `esfuerzo: Y` porque ...

---
Para implementar: comenta `@claude implementa el enfoque propuesto en el diagnostico`
```

### 4d. Gotchas que SIEMPRE debes revisar antes de proponer un enfoque

Estos son invariantes reales del repo. Si tu propuesta los toca, dilo en "Riesgos":

1. `COLS`, `ROWS` y `BLOCK` en `game.js` deben seguir cuadrando con los atributos
   `width`/`height` del `<canvas id="board">` en `index.html` (`COLS*BLOCK` x `ROWS*BLOCK`,
   hoy 300x600). Nada lo calcula ni lo valida.
2. `drawNext` tiene hardcodeados un grid de centrado 4x4 y `NB = 30` contra el canvas
   120x120 de `#next-canvas`. Cambiar uno obliga a cambiar los otros.
3. Al reanudar tras una pausa hay que re-sembrar `lastTime = performance.now()` antes de
   relanzar el bucle; si no, el primer frame recibe un `dt` enorme.
4. El HUD solo se refresca desde el handler de `keydown` y desde `clearLines()`. El bucle
   nunca lo actualiza por su cuenta.
5. `collide()` permite a proposito `ny < 0` para que las piezas puedan aparecer pegadas al
   techo. No lo "arregles" sin entender que rompe el spawn.
6. El numero de pieza guardado en el tablero indexa a la vez `COLORS` y `PIECES`; por eso
   fusionar una pieza es una copia directa sin buscar color.

---

## Paso 5 — Cuando el issue es demasiado vago

Si con lo que hay escrito no puedes producir un diagnostico util (por ejemplo "no
funciona", sin pasos ni descripcion):

- Aplica `necesita-info` y el `tipo:` y `area:` que puedas inferir.
- **No** apliques `triage: listo`.
- No apliques `prioridad:` ni `esfuerzo:` si no tienes base para estimarlos.
- En el comentario deja solo el marcador, el titulo y una lista de **exactamente que datos
  faltan** (pasos para reproducir, navegador, que se esperaba, captura, si ocurre siempre o
  a veces). Nada mas: sin secciones vacias ni diagnostico especulativo.

---

## Recordatorio final

Termina siempre habiendo hecho las dos cosas: labels aplicados y comentario publicado o
actualizado. Si algun comando falla, reintenta una vez y, si sigue fallando, deja
constancia del error en el comentario en vez de terminar en silencio.
