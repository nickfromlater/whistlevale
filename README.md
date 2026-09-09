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
enter its railway, then drag to orbit or scroll or pinch to get closer. **Switch
room** at the top opens the shop map, with your current room shown beneath its
label; the sound button beside it mutes the room.
The small bottom bar holds **Views**, **Train**, pause, **Cinema**, and **More**.
Views contains cameras and places; Train opens the throttle and operating tools;
More contains atmosphere, sound and music, photographs, the layout editor, and
the guide. Only one panel opens at a time. Close it, press Escape, or touch the
scene to return to the railway. **Cinema** calmly follows the train and lets its
controls fade while you watch. Drag to look around, or scroll or pinch to zoom;
your framing keeps following the train. **Auto camera** resumes the selected
cinematic shot. With the scene focused, arrow keys orbit, +/− zoom, and 0 resumes
the automatic camera. Map room descriptions expand with the info button.

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
save/import, and a portable HTML export.

Automatic lighting follows the viewer’s local clock: night from 19:00 until
07:00, daylight otherwise. Choose a manual atmosphere to keep that lighting
across visits; switching back to automatic follows local time again.

## Choose your train

Open **Train → Choose your train** to explore the collection. Eight miniature
trains share the railway: Nightingale and Meridian tender engines, Tern and Wren
tank engines, Cinder’s diesel goods service, Kingfisher’s diesel railcar, and the
Bergwald and Juniper electrics. Each has three finishes and a formation of one
to six trailing vehicles. These are original miniature designs, rather than
licensed replicas of historical locomotives.

Select a card or use the previous/next arrows to inspect a train. Drag the actual
3D model, scroll or pinch to zoom, lift its roofs, watch the wheels, or inspect
the whole formation. Arrow keys rotate the focused preview, +/− zoom, and 0
resets the view. **Run [name]** puts that choice on the current railway. Browsing
and changing a finish leave the running train alone until you choose Run;
Escape closes the collection and restores focus to the train controls.

Each room remembers its own train on this device. The other services keep
running, and choosing a train preserves the current route, position, throttle
and pause state. Steam engines retain their steam sounds; diesels and electrics
use motor sound and a horn. Portable HTML exports include the choices and
portraits. Railway JSON files continue to describe the editable Alder Valley
layout; collection preferences are saved separately.

The cabinet loads portraits only when opened and builds only the inspected 3D
model. Its preview rests between interactions unless you request wheel motion;
closing it releases the preview meshes. The covered railway keeps simulating
while its rendering is suspended.

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

## Engagement analytics

The production site uses Vercel Web Analytics for pageviews and a small set of
custom events. They add no interface, dependencies, cookies, or app-defined
visitor identifier. The tracker records the first visit to each room, cinema
starts, the first use of named controls, and cumulative visible-time milestones
at 30 seconds, 1, 3, 5, 15 and 30 minutes. It pauses while the tab is hidden;
map browsing is excluded from room time. Passive cinema viewing still counts.

In the Vercel project, open **Analytics → Events** and select an event to inspect
its properties. `room_visit` and `cinema_start` have a `room` property;
`control_used` has `control` and `room`; `visit_time`, `room_time`, and
`cinema_time` have a `seconds` milestone (and `room` where applicable).
These are cumulative thresholds, not durations to add together. They show how
many visits reached each threshold, rather than exact average visit length or
proof of attention. Each room/control is counted once per page load; returning
to a room accumulates its time. Previous traffic cannot be backfilled.

Custom events are capped at 60 per page load. One lightweight timer checks every
30 seconds, or sooner when a milestone is due; nothing runs in the animation
loop and no drag coordinates, slider values, or free text are collected.
Delivery is best effort: blocked scripts and errors stop tracking quietly.
Local/preview hosts, portable exports, Do Not Track and Global Privacy Control
are excluded. See [the maintenance notes](CONTRIBUTING.md#engagement-analytics)
for lifecycle hooks and report queries.

## Source

| File | Purpose |
| --- | --- |
| `src/railway.js` | Renderer, Alder Valley, train simulation, layout editor |
| `src/people.js` | Miniature figures, vignettes, and animated walkers |
| `src/rooms.js` | Shared room registry, materials, and geometry helpers |
| `src/rooms/` | Distinct coastal, alpine, and studio landscapes and room shells |
| `src/trains.js` | Rolling stock, selectable train catalogue, formations and working motion |
| `src/train-cabinet.js` / `.css` | Train selection, accessible dialog and on-demand 3D model preview |
| `src/shop-house.js` | Extensible 3D house layout, architecture and room transforms |
| `src/shop-map.js` | Live room rendering, map camera, picking and navigation |
| `src/shop-map-ui.js` / `src/shop-map.css` | Accessible room selection and map controls |
| `src/hobby.js` / `.css` | Room navigation, cinema, controls, and portable export |
| `src/controls.js` | Quiet toolbar, optional panels, dismissal and keyboard focus |
| `src/soundscape.js` | Procedural and recorded sound, mixer buses, transitions |
| `src/playlist.js` | Record shelf and automatic score selection |
| `src/performance.js` | Opt-in local performance diagnostics |
| `src/analytics.js` | Optional, bounded Vercel engagement milestones |

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
npm run test:cinema
npm run test:analytics
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
Cinema tests cover gestures, keyboard framing, train following, return to the
automatic camera, focus, pause preservation and pointer cleanup.
See [CONTRIBUTING.md](CONTRIBUTING.md) for room design and development guidance.

Code and repository artwork are available under the [MIT license](LICENSE).
Optional recordings have separate rights; see the audio guide.
