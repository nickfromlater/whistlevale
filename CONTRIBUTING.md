# Contributing to Whistlevale

Whistlevale is a house of miniature railway worlds. Contributions should make
it a calmer, more convincing place to explore.

## Local development

Use Node.js 24 and Python 3. Run `npm run dev`, then open
http://127.0.0.1:4174/. No package installation or API key is needed to run the
renderer. Optional recorded audio is described in `assets/audio/README.md`.

Before opening a pull request, run:

```sh
npm run check
npm run test:audio
npm run build
```

For visual changes, include desktop and phone screenshots and describe which
room and camera views you checked. Check room entry, orbit, train-follow and
cinema, plus keyboard and touch navigation. Changes to tracks should preserve
continuous circuits and give bridges, retaining walls and tunnels believable
support. Keep geometry finite and watch the vertex count.

## Working on a room

Each additional room has its own source module in `src/rooms/`. Shared geometry
helpers and the room registry live in `src/rooms.js`; Alder Valley and its
editor use the original renderer in `src/railway.js`. Give rooms distinct
architecture, landscape silhouettes, materials, lighting and sound. Keep full
size shop visitors out of the rooms; tiny people within the railways are welcome.

Prefer authored scenes over random clutter. Leave space around trains, keep
foreground props out of camera paths, and make details reward a closer look.
Respect reduced-motion preferences and never start audio before a user gesture.

Please discuss broad interaction or art-direction changes in an issue first.
Small fixes can go straight to a pull request. Describe the problem, what
changes for the visitor, and how you verified it.

## Files that should stay local

Never commit credentials, `.env`, `.vercel/`, private generation logs, or audio
files whose rights do not allow redistribution. The project does not need
runtime credentials. New artwork and code contributions must be compatible
with the MIT license. Recorded audio has separate rights; see the audio notes.
