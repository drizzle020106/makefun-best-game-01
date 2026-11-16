[![make.fun](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01)
[![rank](https://make.fun/badge/best-game-01/drizzle020106/makefun-best-game-01/rank.svg)](https://make.fun/bounty/best-game-01)
[![reward](https://make.fun/badge/best-game-01/drizzle020106/makefun-best-game-01/reward.svg)](https://make.fun/bounty/best-game-01)

# Lanterndeep

Keep the light alive in the dark reef. A complete, original arcade survival game for [make.fun's best-game-01 bounty](https://make.fun/bounty/best-game-01) — built from static files, no network, no libraries.

You are a little lantern-fish in a dark reef. Your lantern is the only light, and the only weapon. Swim with **WASD / arrows**, aim with the **mouse**, hold **click / Space** to fire bolts of light. Shadow eels weave, urchins drift, darters charge, and every fourth wave a brute lumbers in. Catch **light motes** to widen your lantern and raise your score; every shadow you banish may drop one.

Clear a wave and the reef offers a choice: pick **one of three lantern upgrades** — faster fire, twin bolts, piercing rays, a grander lantern, faster fins, reef plate, or a mote lure. How long can you keep the light alive?

- **Goal:** survive as many waves as you can and beat your best score.
- **Lose:** your hull reaches zero and the light fades.
- **Restart:** press **R** (or click) on the game-over screen. **P** pauses, **M** mutes.
- **Sound:** every effect is synthesised with WebAudio — no audio files, no network.

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

Or open `game/index.html` from any static file server. The game is `game/` only: `index.html`, `style.css`, and ES modules under `game/src/`. Nothing loads from the network.

## Layout

| Path | What it does |
| --- | --- |
| `main.ts` | The hand-in program: copies `game/` and `screenshots/` to `/output` and writes `dossier.json` with `vendor/makefun-game.ts` |
| `serve.ts` | Tiny static server for local play-testing |
| `game/index.html` | Page shell: canvas + module script |
| `game/style.css` | Page chrome around the canvas |
| `game/src/config.js` | Every tuning number in one place |
| `game/src/random.js` | Seeded RNG, so screenshots are reproducible |
| `game/src/audio.js` | Synthesised WebAudio sound effects and music |
| `game/src/input.js` | Keyboard + mouse input |
| `game/src/world.js` | Player, shadows, bolts, motes, particles, collisions |
| `game/src/waves.js` | Wave spawning and the between-wave upgrade draft |
| `game/src/render.js` | Canvas drawing: reef, light, HUD, menus |
| `game/src/shots.js` | Deterministic `?shot=start|play|end` scenes for screenshots |
| `game/src/main.js` | Game loop and state machine |
| `screenshots/` | Real renders of the game in desktop Chrome |
| `TRANSCRIPT.md` | The build session transcript |
| `vendor/makefun-game.ts` | The kit's vendored library, unchanged |

## Screenshots

`1-start.jpg` — title screen, `2-play.jpg` — wave 3 in progress with HUD, `3-draft.jpg` — the between-wave upgrade choice, `4-end.jpg` — game-over screen with score and restart. All four are real renders of the game's own code, taken in headless Chrome at 1280×720 with `?shot=…&seed=1` (see `shots.json`).

## License

MIT — see [LICENSE](LICENSE).
