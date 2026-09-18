# Briarwatch Castle

A native Whistlevale railway room, created by **nickfromlater** with agent assistance.
Approved scope: [proposal #42](https://github.com/nickfromlater/whistlevale/issues/42).
No dragon, placeholder creature, flight system or associated controls are included.

## Visit

Serve with `npm run dev`, then open `http://127.0.0.1:4174/?room=briarwatch`.
The room is also available from the house map at `west-5`. Views offers eleven
composed camera positions, including authored portrait distances. The usual train,
cinema, lighting, sound and pause controls remain available.

## The miniature

The contoured walnut-and-green cabinet wraps around the room in a horseshoe,
with a castle peninsula, village peninsula and connecting rear gorge shelf.
The central visitor aisle is an actual void in terrain and cabinet geometry,
with the gallery floor below it, not a painted recess in a rectangular table.

The ridge carries an asymmetrical limestone castle: old keep and stair turret,
open twin-tower gatehouse, raised portcullis and drawbridge, great hall, braced
timber river gallery, chapel, bellcote, arcaded courtyard, kitchen and herb beds.
The external keep stair and landing connect through real masonry openings.
Foundations meet the finished terrain. Corbelled bartizans, supported hoarding,
an oriel, dormers, tracery, stepped gables, rose windows and a roof lantern give
the buildings distinct silhouettes. Banners, dressings, rainspouts and ivy are
anchored to the actual walls rather than floating in front of them.

Eight individually placed lower-town buildings include the Copper Hart inn,
open smithy, bakehouse and oven, weaver, farrier's house, orchard house,
ferryman's cottage and watermill. Projecting bays, braced jetties, bargeboards,
cloth canopies, signboards and shop fittings differentiate them. The clipped
river, stone-lined millrace, road bridge, orchard, gardens and station connect
the town to its landscape.

Fifty-six fixed miniature trees use tapered branches and asymmetric crowns.
Oak, beech, apple, willow and pine are grouped with roots, fallen timber,
bracken, wildflowers and clearings. Dissected quarry slopes, limestone ribs,
cliff buttresses and localized talus replace uniform hill contours. A roofless
watchtower has a genuinely open entrance. A separately surveyed spring has a
carved bed, downhill water ribbon, source pool, cascade and open packhorse
bridge joining the river without changing the millrace or railway.

This is an authored miniature, not a freely walkable interior game. Most village
buildings are exterior models; the gate passage, courtyard, hall windows and
smithy reward close cameras. No historical accuracy is claimed for the
intentionally anachronistic railway.

## The Crown & Cinder Line

A continuous, graded folded-dogbone steam circuit crosses a five-arch stone
viaduct on the high rear line, returns across an open-sided covered timber
bridge, curves over a braced trestle, follows a cliff-side retaining balcony
and passes through a short rock tunnel. A connected goods siding, loading
crane, stationary wagon and modeled semaphore signals enrich the station.
The siding and signals are scenic, not an interactive switching or dispatch
simulation. The default train uses an estate finish of the existing Tern steam
family: Brunswick-green tanks, claret-and-cream coaches, doubled lining,
injector pipes, step treads and a diamond headcode plate. The original gauge,
wheelbase, quartered valve gear, coupling offsets and native cab cutaway remain.
User catalogue selections take precedence over this room-specific default.
No new catalogue family, model portrait or label-atlas allocation is added.

## Fieldcraft: trees, terrain and miniature life

Seven surveyed hero trees distinguish the gate, quarry, trestle, mill, river,
watch ridge and orchard. Bent, tapering trunks, splayed roots, uneven limbs,
exposed broken branches and smaller edge foliage replace more uniform crowns.
Oak, upright beech, cultivated apple, drooping willow and wind-combed pine
have separate branching and crown profiles. The 56 placements remain fixed.
Localized leaf litter, flower spikes, quarry spoil and moss connect the trees
to their terrain rather than scattering detail uniformly.

Woodland hummocks and drainage gullies are applied before engineered road,
rail, river and village grading. Soil normals blend across neighboring terrain
samples; rock faces retain sharper normals. Grassed railway fills no longer
switch abruptly to white rock on alternating triangles. The surface sampler
still matches the emitted collision triangles exactly.

The station has a cast-iron water column, milk churns and luggage trolley.
A small platelayer's hut, spare sleepers, shovel and whistle boards add a
working right-of-way. Bridge joint plates, washers, pier seepage and crown
soot follow the existing structures. Orchard ladder, fruit crates, laundry
and cut timber provide a few separate village stories. These are scenic
vignettes, not new interactive operations or simulated workers.

## The Lantern Gallery

The room is a private estate railway gallery, not another medieval building
inside the model. Deep green dado panels, paired oak pilasters, layered
cornices and picture rails give it a full-size architectural scale.

A large brass-trimmed railway clock anchors the rear wall. Its hands, moon
subdial and original winged-wheel motif are fixed decoration, not a live
clock or astronomical instrument. Tied-back pleated curtains frame the two
estate windows without closing their clear apertures. Curtain headings meet
the modeled rails; hems, ties and tassels are actual geometry.

Six-sided opal lanterns with diamond metalwork hang from supported outriggers.
Their soft emission and the reading-lamp diffusers use opt-in material 100,
with bounded radiance to avoid bright bloom replicas. The native six-light
rig and its surveyed positions are retained. The existing wall washes remain
dimmable; no additional shadow-casting light rig is introduced.

A shallow green ceiling cove with brass seams and alternating compass-star
inlays runs around the perimeter. Its corner miters and surface-attached
ornament belong to each wall's native cutaway mesh. It leaves the center of
the ceiling open and stays above the window heads.

The visitor floor has room-local herringbone parquet, walnut borders and fine
inlay through opt-in material 99, plus flush compass marquetry and a restrained
runner. Two upholstered viewing benches have splayed legs, brass feet, low
arms and raised, softly shaded cushions. Cushions use textile shading rather
than timber grain. Bench feet meet the room floor and stay outside the scenic
peninsulas. A shallow archive bookcase and survey table with folio, rolled
plans, brass rule, pencil and cup add a few human-scale details.

## Estate outlooks and lamplight

The two rear windows contain distinct shallow, forced-perspective estate
scenes with hills, branching trees, a lodge or garden pavilion, paths and
stone balustrades. Clear arched casements use the existing sorted architectural
glazing pass. Solid upper and side returns and thin soffits seal the casings
without sky leaks or bulky projections above the arches.

Opt-in materials 92/93/98 keep exterior sky, scenery and cottage windows
independent of the gallery dimmer. Daylight changes to blue-hour and night
skies with a still crescent and sparse stars. Materials 94/95/96 add authored
surface light to the plaster using wall-local UVs, which remain attached
through the live house-map transform. These are not volumetric beams.

The outlooks remain within the room footprint and share the back wall's
cutaway, glazing and disposal lifecycle. They are not a navigable exterior.
The Lantern Gallery pass preserves their geometry, the miniature, terrain,
railway, public viewpoints, automatic lighting settings and global mood presets.

## Source and lifecycle

- `src/rooms/briarwatch.js`: terrain, river, routes, bridges, vegetation, gallery,
  outlooks, viewpoints and room registration.
- `src/rooms/briarwatch-castle.js`: masonry openings, roof and timber helpers,
  castle buildings, defenses and courtyard.
- `src/rooms/briarwatch-village.js`: houses, station, gardens, vignettes and mill.
- `src/railway.js`: opt-in estate, gallery-plaster, parquet and opal shading.
- `src/trains.js`: optional Tern finish and its bounded shared stock cache.

The three room scripts load before house startup and atlas construction.
No new runtime dependency, imported model, texture, recording, atlas slot,
uniform or per-frame geometry is needed. Original credits are preserved.
Grounded details sample the exact emitted terrain triangles. Fixed placements
and coordinate hashes do not consume the shared scene seed.

The waterwheel is a cached `scene.movingParts` mesh tied to train travel.
Pausing the railway pauses the mechanism; reduced motion holds it still.
It participates in native dynamic and shadow passes. Room replacement and
failed-build cleanup dispose its buffer with the other owned room resources.

## Geometry budgets

The complete fieldcraft scene has **890,385 static scene vertices** against
the unchanged **900,000** ceiling. The four wall meshes contain **24,504 /
3,468 / 3,468 / 8,076** vertices, totaling **39,516** against **40,000**.
That wall total includes **132 clear-glass vertices** owned by the back wall;
the opaque wall total is **39,384**. The moving wheel remains **5,592 / 6,000**.

Each upholstered bench has 768 vertices. Ceiling coves use 348 vertices on
the long walls and 324 on the side walls. Backs buried against existing solid
geometry are omitted where appropriate. Geometry ceilings and test timeouts
were not raised. These budgets do not establish physical-device frame rate.

Adaptive track surface stations preserve the native route and sleeper layout
while allocating fewer faces to straight sections. The main circuit uses 400
surface intervals; maximum sampled outer-edge deviation is 0.024535 units
against a 0.026 bound. Static geometry fell from the prior 899,550 despite the
added scenery. The separately cached six-part estate Tern uses 90,552 vertices,
including the alternative open-cab mesh; it shares the existing running gear.
Partial upload failure releases already-built parts, and construction restores
the shared seed and paint callback. The standard stock rebuild owns disposal.

## Checks and visual review

Run `npm test`, `npm run test:geometry:full`, and
`npm run check:contributions -- --json`. `npm run test:briarwatch` is part of
the full suite. Architectural glazing and lighting also have dedicated checks.

Focused coverage includes finite/deterministic geometry, real castle and ruin
openings, terrain contact, river and spring continuity, masonry backing for
ivy and rainspouts, 61,711 scenic triangle/envelope checks, route closure/grade,
track and tree clearance, cabinet voids, portrait framing, reduced motion,
wheel transform/draw, disposal, credits and script/map/export inclusion.
Gallery checks cover open casements, sealed high-angle rays, wall-local UVs,
curtain clearances and headings, clock orientation, floor-local parquet,
fixture alignment, bounded opal radiance, cove/bench bounds, floor contact,
solid supported cushions and correct textile material assignment.
Fieldcraft checks add adaptive rail coverage/error bounds, deterministic hero
trees, constant per-triangle terrain materials, new vignette envelope clipping,
platform contact and estate-stock cache, bounds and partial-failure recovery.
The original train catalogue keeps its independent isolation/selection tests.

The earlier 21-state Lantern Gallery browser review covers day/evening/night,
dimmer-off, clock and lanterns, curtained estate, archive, survey table,
marquetry, ceiling cove, upholstered bench, reverse entry, portrait layouts,
train view, native-frame smoke, house map and switching to Coast and back.

The final fieldcraft review is [run 35301363036](https://github.com/nickfromlater/whistlevale/actions/runs/35301363036).
Its 21 native states cover the hero trees, quarry, gorge, trestle, village,
engine and coaches, water column, orchard ladder, railway hut, cab view,
evening overview, 390px/320px portrait, native motion, live map, Coast and
return. It also selects Cinder to verify that user train choices override the
estate default. Page, console and reported WebGL errors were all zero.
The full Node 24 suite, production build, 501-mesh geometry comparison and
contribution audit passed on the same runtime and QA hashes. The publisher
then reproduced those exact bytes in commit
`8f578d6e9dc9d3d817678b607f67779ca116d1ed`; this documentation update does not
change the rendered implementation. The three artifacts on the run contain
native views, full check logs and the published-source receipt respectively.

Store native images and logs in ignored `evidence/` folders with the exact
source commit or hashes, camera, viewport and renderer. A workflow trigger
commit is not necessarily the rendered source when patches are applied first.

Chromium/SwiftShader stills are appearance evidence, not physical-iPhone FPS
or native-touch verification. Still captures hold the animation callback and
settle the native camera; a separate frame smoke check is included. Scripted
export inclusion does not substitute for manually opening a fresh playable
export. Earlier spring/sconce close-ups were occluded; use the composed room
views for their visible context rather than treating those shots as evidence
of every detail.
