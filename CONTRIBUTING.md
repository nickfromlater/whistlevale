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
npm run test:rooms
npm run test:map
npm run build
```

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

## Files that should stay local

Never commit credentials, `.env`, `.vercel/`, private generation logs, or audio
files whose rights do not allow redistribution. The project does not need
runtime credentials. New artwork and code contributions must be compatible
with the MIT license. Recorded audio has separate rights; see the audio notes.
