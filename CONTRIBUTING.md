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
npm run test:delivery
npm run test:geometry
npm run test:lighting
npm run test:startup
npm run test:rooms
npm run test:map
npm run test:cinema
npm run test:analytics
npm run test:trains
npm run build
```

`test:geometry` runs the quick byte-exact primitive and track-query comparison
used in CI. After changing geometry generation, also run
`npm run test:geometry:full` to compare every room and train mesh. Use `?profile`
in the browser for local frame, startup, draw-call and memory diagnostics;
compare the same room, camera and device. The panel sends no telemetry.

The geometry builder shares read-only circle and sphere samples across instances.
Keep their points immutable and retain double precision until GPU upload; the
geometry checks compare against the original primitive code, including seams,
fractional subdivisions, nested transforms and normals.

Startup can reuse a validated factory snapshot from the optional local-storage
entry `whistlevale-factory-snapshot`; it never stores meshes. Bump
`WORKSHOP_FACTORY_CACHE_VERSION` when factory scenery, default tracks, default
stock/services, or procedural seed consumption changes. Fresh visits and invalid
caches rebuild the pristine factory before applying saved edits, preserving the
factory-reset and meadow actions.

For visual changes, include desktop and phone screenshots and describe which
room and camera views you checked. Check the live 3D house, room selection and
entry, orbit, train-follow and cinema, plus keyboard and touch navigation. Changes to tracks should preserve
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
Sound is enabled by default, but the first user gesture unlocks playback. Keep
the mute control and independent music, surroundings and train levels working.

### Landscape detail and camera checks

Coastal and alpine details use each room’s finished height function, after rail
benches and village platforms are formed. Sample that same surface when placing
rocks or plants; sampling the raw mountain can leave details floating over a
cutting. Check the footprint of a prop as well as its center against the nearest
track. Leave additional space beside stations, paths, buildings and viewpoints.
Use fixed groups and coordinate hashes for small details so adding plants does
not consume the shared procedural random sequence. Keep detail in the existing
static scene mesh; avoid new per-frame geometry or atlas slots for small accents.

Water colors interpolate at vertices from the shoreline or basin field. Keep
water levels consistent with boats, jetties and camera height queries, and check
for shore gaps from low camera angles. In the Mountain Loft, preserve the open
arch over the lower railway and both grades’ support when adjusting terrain.
Short rock ledges must follow the relief rather than span several steep facets.
`alpineRelief` returns a sampler of its emitted triangles for paths and props;
use it after the terrain build so details do not sink into the mesh between
analytic height samples. Its grid is reused during construction and can then
be collected. The quick geometry check verifies the sampler against actual
triangle interiors.

Cinema input lives in `src/hobby.js`. Its captured gestures must keep the cinema
lifecycle active and preserve sound, throttle and pause. Manual framing follows
the active room’s train; automatic shots resume only on request. Keep the camera
slot compact on phones, preserve keyboard focus when replacing its control, and
release pointers on cancellation, blur and exit. Run `npm run test:cinema` after
changing these controls, then verify drag, pinch, keyboard and the return to an
automatic shot in a browser. Scripted touch fixtures supplement physical touch
checks; desktop mouse input alone does not verify a phone’s native gestures.

## Adding a room

Define the landscape and room shell in a new `src/rooms/<key>.js` module, then
register them once. A room key is a lowercase URL-safe name, such as `marsh`.

```js
registerHouseRoom('marsh', {
  name: 'The Marsh Gallery',
  layout: 'The Reedwater Branch',
  tag: 'ALONG THE WATER',
  description: 'A quiet railway through reed beds and a small riverside station.',
  color: '#8b9e83',
  ambient: 'forest',
  target: [0, 2, 0],
  distance: 145,
  build: buildMarshRoom,
  shell: buildMarshShell,
  map: {scale: .40, footprint: [156, 128], focus: [0, 2, 0]}
});
```

`build(scene, builder)` adds landscape and furniture to the supplied `Builder`.
Every room must populate `scene.trains` with at least one valid train. Each train
needs an `edge` with an `at(distance)` function and a positive finite `length`,
plus finite `distance` and `speed` values. A speed of zero is valid for a stationary
exhibit. Invalid trains are rejected with a room-specific error before scenery
upload; allocated shell walls are released and the partial room is not cached.
Also populate `scene.routes`, `scene.spots` and `scene.height(x, z)` as appropriate.
A place in `scene.spots` has a name, target, camera distance and
optionally detail, yaw and pitch. The framework uploads the finished scene,
adds miniature life details, and caches it by key. `getHouseScene(key)` returns
that cached scene; registering the same key again disposes its scene, wall and
life-detail meshes and increments the registry revision.

`shell(builder)` adds the room floor and shared furniture, then returns an array
of `{which, mesh}` walls. Wall keys are `back`, `left`, `right` and `front`.
Keep the room floor at `FLOOR` and use the existing rail gauge. The standard
shell spans approximately X ±78 and Z ±64; provide map footprint metadata when
your room differs. A shell is optional and falls back to the shared room shell,
but a new room should earn its own architectural character.

Add the new script to `index.html` after `src/rooms.js` and before startup, next
to the other room modules. Register every room before the atlas and scene build
begins. Keep its script included in portable exports too: the export gathers the
page’s app script assets, so check the exported HTML after adding a module.
The static build copies `src/` automatically. No map menu or fixed position list
needs to be extended for another room.

The current script order is the renderer, people and shared room registry,
individual room modules, trains/audio/playlist, then `hobby.js`. The live map
modules `shop-house.js`, `shop-map-ui.js` and `shop-map.js` load after `hobby.js`
and before its delayed startup runs. The earlier `house-map*` SVG files are
legacy artwork and are not the active map.

`src/controls.js` loads after the map modules and initializes during house
startup. It coordinates the optional Views, Train, More, atmosphere, sound,
record-shelf and guide panels. Keep secondary controls inside these disclosures;
the default scene has only the room selector, mute and compact bottom bar.
Preserve one-panel-at-a-time dismissal, visible focus restoration, 44-pixel touch
targets, and safe-area spacing. Runtime panel headings must be removed when
packing a portable export so they are created only once on its next startup.

### House layout metadata

`src/shop-house.js` arranges registered rooms in two columns, adds rows and
connecting corridors, aligns floors, and derives the overview camera. Metadata
under `definition.map` is optional:

| Field | Meaning |
| --- | --- |
| `order` | Sort order in the house; new rooms append by default. Top-level `mapOrder` takes precedence. |
| `scale` | Uniform scale for the entire scene, walls and trains; default `.40`. |
| `footprint` | Room width and depth in its original scene units; default `[156, 128]`. |
| `focus` | Camera target in local scene coordinates; defaults to `definition.target`. |
| `signKey` | Optional existing room-atlas key for the doorway plaque. |

The valley uses a smaller `.33` scale because its original shell is larger.
`buildShopHouse()` returns `{mesh, layout}`; `layout.rooms` and `layout.byKey`
contain room transforms, bounds, picking bounds, doorways, label anchors, outer
and cutaway wall sets, and camera metadata. `shop-map.js` draws the existing room
meshes and trains through those transforms. Keep the map and an entered room
connected to the same scene and simulation state.

### Train collection

`TRAIN_COLLECTION` in `src/trains.js` defines the eight authored trains, their
finishes and formation defaults. `collectionGeometry` captures the real railway
builders without uploading to its GPU; always restore the builder, paint,
random seed and label aliases in `finally`. The cabinet owns a separate WebGL
preview and its GPU resources. Build only the selected model, coalesce pointer
and resize frames, and animate only when requested. Release model and plinth
buffers on close and on replacement. Context restoration recreates the preview;
closed or hidden previews must not schedule animation.

`chooseCollectionTrain` prepares geometry before changing the live selection.
Selections belong to registered room keys and change the primary service only.
A model/finish pair shares one running mesh set across rooms. Dispose it when
its last room switches away; a world/atlas rebuild invalidates the cache. Keep
route history, position, speed, pause, bogie swivelling, roof cutaways and the
steam/electric/diesel audio distinction intact. Newly registered rooms must work
without additions to the cabinet UI. The local-storage format is versioned and
validated; portable choices override browser preferences.

Collection plates occupy the original fixed 2048×1024 train atlas, allocated
before geometry creation. Check every UV and preserve the bounds guard. The
small WebP portraits in `assets/trains/` are renders of the actual models, loaded
only on cabinet entry and embedded in portable exports. Regenerate affected
portraits when changing a model’s default finish or shape; never generate them
at app startup or in the build.

Run `npm run test:trains` for all 24 model/finish combinations, finite geometry,
working wheels and roofs, cache ownership, failed-build recovery and validated
persistence. The full geometry comparison includes every collection variant.
Also inspect each model and full formation in the browser, test keyboard
navigation and focus return, and check 390-pixel and 320-pixel phone layouts.
The public preview server accepts `--port 4175` for an isolated test origin;
this keeps automated selections out of a collaborator’s local preferences.

### Trains and illustrations

Add trains as `{edge, distance, speed, type, cars, stock}`. `edge` is a continuous
rail circuit, `distance` is distance along it, and `cars` counts vehicles behind
the locomotive or powered railcar. Use `type: 'steam'` for tank locomotives and
`type: 'mountain'` for electric railcars. `stock` is optional: new rooms use the
coastal steam set or alpine electric set by default. Explicit steam sets are
`coast` and `studio`; electric sets are `alpine` and `workshop`. Keep stock and
type compatible. To create a new set, extend `src/trains.js` and its disposal
path, preserving wheel motion, valve gear, coupling gaps, swivelling bogies and
cutaway roofs. Do not bake another set of wheels into a vehicle with separate
bogies.

The room illustration atlas is painted at startup. It grows from 4096×2048 by
200-pixel rows for each four additional plaques; all UVs use its actual size.
Growth is capped by the GPU limit and a 4096-pixel height budget. Up to 44 room
plaques fit; further plaques are omitted while the rooms remain available.
Guard optional plaque drawing with `roomLabels[key]`. Runtime registrations
that change atlas size require a full atlas and dependent geometry rebuild;
re-registering a scene alone does not update baked UV coordinates. Prefer
registering modules before startup. Coordinate any other custom `artSlot`
allocations so illustrations never overlap.

Run `npm run test:rooms` after registry, shell, layout or stock-dispatch changes.
It checks default and custom fifth/sixth rooms, finite transforms, floor
alignment, nonoverlap, metadata, cache disposal, invalid-train cleanup, failure recovery and stock
fallback, with a geometry budget for the connecting architecture. It does not
replace checking landscape composition, camera clearances, moving trains and
map selection in the browser.

`npm run test:map` checks controller loading, cancellation, room registration
during a load, revision reloads while open, return cameras, entry projection,
selected-room sound, restored globals, pause and simulation, pointer gestures,
Escape and reduced-motion cinema entry. Run it after changing map input,
rendering wrappers, camera transitions or the UI/controller contract.

Please discuss broad interaction or art-direction changes in an issue first.
Small fixes can go straight to a pull request. Describe the problem, what
changes for the visitor, and how you verified it.

## Engagement analytics

`src/analytics.js` owns the production hostname allowlist and loads the existing
first-party Vercel script asynchronously. It uses the vanilla
`window.va('event', {name, data})` protocol without adding a package. Vercel
custom events require a supported plan; see the [official event guide](https://vercel.com/docs/analytics/custom-events).
Failures must never show a toast, block startup, capture a gesture, or affect
rendering or sound. The single timer, event queue and deduplication sets are
bounded; once the 60-event cap is reached, no more timing work is scheduled.

Room/cinema/map lifecycle changes call the optional `railwayAnalytics.sync()`.
It reads the final state in a microtask, excluding startup and room fades.
Never poll room globals during rendering: the shop map temporarily borrows them
to draw each room. Keep both map open/close and completed room entry hooks.
Control tracking uses fixed names and committed changes, with first-use
semantics per page load. It must not collect pointer movement, input values,
layout names, text, or persistent identifiers. Do not wrap shared setters such
as `setThrottle`: cinema and startup call them automatically.

Visible time includes watching without interaction, with hidden tabs, BFCache
absence and long suspended/stalled clock gaps excluded. Milestones are
cumulative within a page load, including repeated room/cinema visits. Do not
sum their `seconds` values or call the result average session length. The cap,
blocked delivery and abrupt mobile exits can undercount. Historical pageviews
contain no room-duration or control detail to recover.

The authenticated CLI can read counts without opening the dashboard:

```sh
vercel metrics vercel.analytics_event.count --project endless-railroad \
  --scope project-scope --prod --since 24h --group-by event_name --json
```

Use identical explicit `--since` and `--until` timestamps when comparing
queries. Add `-a unique/visitor_id` for Vercel's daily visitor estimate, which
is distinct from page-load event counts. Inspect event properties in the
Analytics Events panel for room, control and milestone breakdowns.

Run `npm run test:analytics` after tracking or lifecycle changes. It covers
visibility, deep links, new registry rooms, map exclusion, cumulative cinema,
BFCache, sleep, deduplication, passive input, blocked/throwing delivery and both
source/hashed portable export scripts. Keep `#analyticsBootstrap` and the injected
`[data-railway-analytics]` script excluded before export inlines app assets.

## Files that should stay local

Never commit credentials, `.env`, `.vercel/`, private generation logs, or audio
files whose rights do not allow redistribution. The project does not need
runtime credentials. New artwork and code contributions must be compatible
with the MIT license. Recorded audio has separate rights; see the audio notes.

### Local review branch

`codex/train-collection-20260909` is excluded from Vercel Git deployments in
`vercel.json` while the collection is reviewed locally. Pushing that branch
backs up the work without publishing a preview or production release. Other
branches retain their existing deployment behavior. See Vercel’s
[branch deployment configuration](https://vercel.com/docs/project-configuration/git-configuration#gitdeploymentenabled).
