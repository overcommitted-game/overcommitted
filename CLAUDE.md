# Overcommitted — reglas para Claude Code

Juego de navegador (Phaser 4 + React 19 + TypeScript + Vite) hecho por dos devs que **están aprendiendo**. Antes de cada tarea, leé:

- la spec: `docs/2026-11-20-diseno-v1.md` (fuente de verdad);
- el plan: `docs/2026-11-20-plan-v1.md` (cada tarea = un issue de GitHub).

## Cómo trabajamos

- **Una tarea por sesión**, en su rama `<tipo>/<issue>-<slug>` (ej: `feat/3-station-work`). Nunca pushear a `main`.
- **SDD:** la spec manda. Si hace falta un comportamiento nuevo o distinto, primero se actualiza la spec (commit `docs:` en el mismo PR) y después el código.
- **TDD:** test primero, de a un comportamiento: rojo → verde → refactor. La lógica de Phaser y React sale a funciones puras testeadas; las escenas y componentes quedan finos.
- **Commits atómicos por tema:** un comportamiento = su test + su código = un commit, y cada commit deja `npm run check` en verde. Nunca un commit gigante.
- Conventional Commits **en inglés** (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `ci:`). **Nunca agregar el trailer `Co-Authored-By`.**
- Antes de cada commit: `npm run check` (typecheck + lint + tests + build).
- **Al terminar cada tarea, explicá en español qué hiciste, por qué se hace así y cómo funciona**, y dejá escrito el texto del PR (Qué / Por qué / Cómo probarlo).

## Arquitectura

| Carpeta | Qué va | Regla |
|---|---|---|
| `src/core` | Reglas del juego | TypeScript puro: **no importa `phaser` ni `react`** (lo valida ESLint). Todo testeado con Vitest (`*.test.ts` al lado). |
| `src/game` | Phaser: mundo, input, dibujo | Llama al núcleo en cada frame. |
| `src/ui` | React: HUD y pantallas | Recibe snapshots por el `EventBus`, nunca toca el núcleo directamente. |
| `src/data` | Contenido | Recetas, balance, textos, íconos. |

- Phaser ↔ React **solo** por los eventos de `src/game/events.ts`, a través de `src/game/EventBus.ts`.
- Textos del juego **solo** en `src/data/texts.ts`, en español rioplatense con voseo.
- Números de balance **solo** en `src/data/balance.ts` y `src/data/recipes.ts`.
- Agregar una tarea, estación o incidente nuevo tiene que ser principalmente agregar datos.

## Calidad de código

- TypeScript estricto. **Prohibido `any`.**
- **Nada de `undefined`** como valor ni tipo propio: la ausencia se modela con `null` explícito (`ItemType | null`), sin propiedades opcionales en tipos de dominio.
- **Nada de `!` (non-null assertion)** fuera de los tests.
- **Tipos e interfaces solo cuando hacen falta.** Los compartidos van en `src/core/types.ts`; el resto se infiere o se declara al lado de donde se usa. Nada de interfaces "por las dudas".
- **No instalar dependencias** para lo que se resuelve en pocas líneas propias o con la plataforma (DOM, CSS, React, Phaser). Toda dependencia nueva se justifica en el PR.
- La solución más simple que funcione, sin abstracciones ni código "para más adelante".

## Assets

Solo gratis: **CC0**, o con licencia que permita explícitamente uso público gratuito. Cada uno se registra en `CREDITS.md` (pack, autor, link, licencia). No usar LimeZu Modern Interiors free.

## Entorno

- Node 24 (`.nvmrc`).
- Si `npm install` falla con `ESTRICTALLOWSCRIPTS`, aprobar o denegar solo el paquete puntual con `npm install-scripts approve|deny <pkg>` y que quede en `allowScripts` del `package.json`. Nunca `--dangerously-allow-all-scripts`.
