# Whistlevale

**A house of little worlds.** An interactive miniature railway hobby shop,
made for wandering, watching trains, and taking the long way round.

The repository is private while the experience is being developed.

Four rooms share one house, with their own architecture and working layouts:

- **Alder Valley** — an English county railway, a riverside town, and three services.
- **Coastal Gallery** — a sea-glass conservatory, chalk headland, harbor, and lighthouse.
- **Mountain Loft** — a timber attic, folded mountain railway, stone viaduct, and lakeside hamlet.
- **Makers’ Shop** — a sunlit atelier with two small layouts, workbenches, and scenery in progress.

The app runs entirely in the browser. It uses a custom WebGL 2 renderer and
plain JavaScript, with no package dependencies, CDN, account, or runtime API key.

## Run locally

Requirements: **Node.js 24+**, **Python 3.10+**, and a browser with WebGL 2.

```sh
git clone https://github.com/nickfromlater/whistlevale.git
cd whistlevale
npm run dev
```

Open [localhost:4174](http://127.0.0.1:4174/). No `npm install` is necessary.
The preview server serves only the app and public assets.

## Explore

Open the illustrated **shop map** to choose a room. Drag to orbit, scroll or
pinch to get closer, and use each room’s place buttons to explore its details.
**Slow cinema** calmly follows the train and hides the operating controls.

| Key | Action |
| --- | --- |
| G | Open the shop map |
| C | Enter or leave slow cinema |
| Escape | Close the map or leave cinema |
| Space | Pause or resume the railway |
| H | Sound the whistle |

Direct room links use `?room=valley`, `?room=coast`, `?room=alpine`, or
`?room=studio`. Alder Valley also includes a layout editor, route controls,
train liveries, save/import, and a portable HTML export.

## Sound and optional music

A fresh clone includes procedural railway sounds and ambience. Enable sound
with a sound or cinema control; nothing starts before a user gesture. The
mixer controls music, surroundings, and trains separately.

Generated recordings are **not included in the source repository** and are
not covered by the source license. You can add your own recordings to
`assets/audio/`; the development server and build discover available files.
Missing recordings use procedural sound without failed audio requests.
See [the audio guide](assets/audio/README.md) for filenames, optional ElevenLabs
generation, and separate recording rights. Generating audio is never part of
running or building the app.

When recordings are present, the record shelf in `src/playlist.js` selects a
room’s score during cinema. Outside cinema, automatic music is silent; a
piece explicitly chosen from the shelf can keep playing. Evening cinema has
its own cue. Music can be replaced independently of the room sound effects.
Use gentle starts and tails, tracks longer than 20 seconds, and consistent
loudness; per-track `trim` values adjust playback level.

## Build and deploy

```sh
npm run build
```

Serve `dist/` with any static host. `vercel.json` configures Vercel’s build and
output directory; connect this repository to Vercel and attach your domain.
Whistlevale’s intended home is **whistlevale.com**.

The build includes the app and any locally supplied recordings. Credentials,
generation receipts, scripts, and local design studies stay outside `dist/`.
A deployment from this repository uses procedural sound until you supply
recordings through your own asset workflow. Keep `.vercelignore` alongside
`.gitignore`: they control different upload paths.

## Source

| File | Purpose |
| --- | --- |
| `src/railway.js` | Renderer, Alder Valley, train simulation, layout editor |
| `src/people.js` | Miniature figures, vignettes, and animated walkers |
| `src/rooms.js` | Shared room registry, materials, and geometry helpers |
| `src/rooms/` | Distinct coastal, alpine, and studio landscapes and room shells |
| `src/house-map-art.js` | Illustrated hobby shop |
| `src/house-map.js` / `.css` | Map navigation and room selection |
| `src/hobby.js` / `.css` | Room navigation, cinema, controls, and portable export |
| `src/soundscape.js` | Procedural and recorded sound, mixer buses, transitions |
| `src/playlist.js` | Record shelf and automatic score selection |

## Check and contribute

```sh
npm run check
npm run test:audio
npm run build
```

Checks work without optional recordings. Audio tests exercise scheduling,
room transitions, mixer routing, and missing-file behavior with a simulated
audio context. Visual and playback changes also need a real-browser check.
See [CONTRIBUTING.md](CONTRIBUTING.md) for room design and development guidance.

Code and repository artwork are available under the [MIT license](LICENSE).
Optional recordings have separate rights; see the audio guide.
