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
git clone https://github.com/nickpaolino/whistlevale.git
cd whistlevale
npm run dev
```

Open [localhost:4174](http://127.0.0.1:4174/). No `npm install` is necessary.
The preview server serves only the app and public assets.

## Explore

Open the **3D shop map** to explore a cutaway of the whole hobby house. Its rooms
contain the actual miniature landscapes and moving trains. Select a room and
enter its railway, then drag to orbit, scroll or pinch to get closer, and use
the room’s place buttons to explore its details. **Slow cinema** calmly follows
the train and hides the operating controls.

The house grows from a room registry. Additional rooms get their own place in
the building, connecting corridors, room selection and camera framing; see
[Adding a room](CONTRIBUTING.md#adding-a-room) for the registration contract.

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

Automatic lighting follows the viewer’s local clock: night from 19:00 until
07:00, daylight otherwise. Choose a manual atmosphere to keep that lighting
across visits; switching back to automatic follows local time again.

## Sound and optional music

A fresh clone includes procedural railway sounds and ambience. Sound is enabled
by default and starts after the first user gesture, respecting browser playback
rules. Use the sound control to mute it. The mixer controls music, surroundings,
and trains separately.

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

JavaScript, styles, the favicon, and recordings receive content-hashed URLs in
the build. Their bytes stay unchanged. Vercel caches these versioned assets as
immutable for a year and revalidates HTML, so a new build references new files
while unchanged assets remain reusable. There is no per-visitor application
server; simulation, rendering, and audio run on the visitor’s device.

For local performance inspection, add `?profile` (or `&profile` to a room URL).
The opt-in panel reports frame timing, draw calls, geometry and decoded-audio
memory estimates; GPU timing appears when supported. It sends no telemetry and
does no diagnostic work on ordinary visits. Measurements describe the device
and view being inspected, rather than a traffic-capacity guarantee.

## Source

| File | Purpose |
| --- | --- |
| `src/railway.js` | Renderer, Alder Valley, train simulation, layout editor |
| `src/people.js` | Miniature figures, vignettes, and animated walkers |
| `src/rooms.js` | Shared room registry, materials, and geometry helpers |
| `src/rooms/` | Distinct coastal, alpine, and studio landscapes and room shells |
| `src/trains.js` | Room-specific rolling stock, formations and working motion |
| `src/shop-house.js` | Extensible 3D house layout, architecture and room transforms |
| `src/shop-map.js` | Live room rendering, map camera, picking and navigation |
| `src/shop-map-ui.js` / `src/shop-map.css` | Accessible room selection and map controls |
| `src/hobby.js` / `.css` | Room navigation, cinema, controls, and portable export |
| `src/soundscape.js` | Procedural and recorded sound, mixer buses, transitions |
| `src/playlist.js` | Record shelf and automatic score selection |
| `src/performance.js` | Opt-in local performance diagnostics |

## Check and contribute

```sh
npm run check
npm run test:audio
npm run test:delivery
npm run test:geometry
npm run test:lighting
npm run test:startup
npm run test:rooms
npm run test:map
npm run build
```

Checks work without optional recordings. Audio tests exercise scheduling,
room transitions, mixer routing, and missing-file behavior with a simulated
audio context. Room tests exercise fifth/sixth-room registration, dynamic house
geometry, cache invalidation, default/custom shells and train stock selection
without a browser or GPU. Visual and playback changes also need a real-browser check.
Delivery tests cover source-only builds, exact asset bytes and cache versioning.
Geometry tests compare uploaded Float32 bytes against the original builder;
normal CI uses primitive/transform and track-query checks. Run
`npm run test:geometry:full` for all room and train meshes after geometry changes.
Lighting tests cover local-time boundaries and saved manual choices.
Startup tests cover saved layouts, portable-layout precedence, recovery and undo.
See [CONTRIBUTING.md](CONTRIBUTING.md) for room design and development guidance.

Code and repository artwork are available under the [MIT license](LICENSE).
Optional recordings have separate rights; see the audio guide.
