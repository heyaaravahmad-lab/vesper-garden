# Vesper

A garden for your mind. A full-screen illustrated 2.5D sanctuary with detailed sunlit foliage, flowing-water distortion, drifting pollen, botanical plants, and changing atmospheres. See VISUAL-DIRECTION.md for the rendering approach and its limits.

## Live garden

https://heyaaravahmad-lab.github.io/vesper-garden/

## Run locally

Requires Node.js 22+.

```sh
npm ci
npm run dev
```

```sh
npm test
npm run build
npm run preview
```

## Make yourself at home

- Click **Plant something** or the foreground planting area. Thoughts become lights, tasks grow into flowers, ideas form mushroom clusters, and goals grow into branching trees.
- Select a plant to write, record progress with **Give it some care**, or complete it with **Let it bloom**. Plants never lose progress over time.
- Use the atmosphere menu for twilight, daybreak, soft rain, or moonlight.
- Enable synthesized ambient sound with the speaker control. Audio starts only after a deliberate click.
- Open **Field notes** to find plants without using the canvas, export a JSON backup, or merge plants from another garden. Importing preserves existing plants and skips duplicate IDs.
- Plant release requires a second in-app confirmation. Export a backup first if you want to keep it.

## Data and privacy

Garden data is saved in IndexedDB on the current browser and origin. No accounts, analytics, API calls, or cloud sync. Clearing browser data clears the garden; use Export garden to keep a backup or move between devices. Google Fonts is the only externally hosted design asset; system fonts are used if unavailable. Changing the hostname creates a different local garden unless you import your backup.

The initial four plants are editable example content. A garden supports up to 100 plants; rendering cost grows with plant count. Requires a WebGL-capable browser. The environment uses one shader plane and CSS particles, with a limited pixel density. Reduced-motion preferences stop environmental animation. No universal frame-rate claim is made; performance still depends on GPU, browser, and garden size.

## Build and hosting

React + TypeScript, React Three Fiber / Three.js, Zustand, IndexedDB via idb-keyval, Vite. The scene loads separately from the interface. Interactive botanical plants are procedural SVGs. The environment is bundled generated artwork; no API key or generation service is needed at runtime.

GitHub Actions runs the data-integrity tests, builds the static site, and publishes `dist/` to GitHub Pages on pushes to `main`. Vite uses relative asset paths so project hosting works. In the repository's Pages settings, the build source must be **GitHub Actions**.

## First-version scope

Growth is recorded manually; there is no calendar or task deadline system. Goal care adds foliage, but individually named milestones and links between notes and plants are future work. Completed goals flower; there is no separate project-landmark type yet. Sound is a gentle synthesized ambient bed, rather than a recorded, mood-specific sound library. Visual moods change light, scenery, particles, and pond color. Seasonal worlds and account sync are not implemented.

Use **Just be here** to hide the interface and enjoy the scene. Press Escape to return. This is a browser viewing mode, not an installed macOS screensaver.
