# The Rift Observatory

Original safari miniature, Solstice monorail, and expedition gallery by
`nickfromlater`, built with agent assistance. Requested scope: proposal #39.
The later giraffe addition uses a Pixal3D-generated surface, cleaned and rigged
in Blender, for the family in the western clearing. Its source and process are
credited in the [model guide](../../models/safari-giraffe/README.md).

## Visit

Start the normal preview with `npm run dev`, then open `/?room=safari`.
The live house map discovers this native room at **west-4**.
Use **Views → Places** for the thirteen authored compositions, or choose
train-follow, cab, cutaway, and cinema through the existing house controls.

## Landscape and architecture

A 112 × 80-unit landscape carries a winding green river, amber grass, umbrella
acacias, two escarpments, a spring-fed cascade, a high observation deck, and
stratified exposed edges.
The gallery has its own timber-and-bronze case, sisal mat, paneled walls,
geological relief pictures, windows, roof ribs, and woven pendants.

Terrain, supports, tree roots, paths, and low camera queries use the same emitted
triangle surface. Water polygons are clipped against those triangles at one
consistent elevation. Coordinate hashes make vegetation deterministic without
consuming the house's shared random stream. Trees occupy gentle planting shelves,
not sheer cliff faces, and are excluded by their whole
canopy envelope, not just their trunk centers.

## Kopje Field Lodge

The lodge is an expedition base, not a resort. The pool, spillway, rear leisure
deck, parasols, loungers, pergola and sunken fire court have been removed from
the geometry. Their footprint is planted earth again, crossed by one narrow
approach from the suspension bridge to broad stone entrance steps.

A steep thatched gable and exposed timber trusses cover the main hall. Rough,
individually relieved fieldstone foundations and walls replace the continuous
raised deck. Inside are a large reserve-map briefing table, contour lines and a
river drawn in geometry, binoculars, rolled maps, a compass, enamel mugs, a field
library, radio desk and compact stone hearth. A canvas mess fly and supply trunks
sit alongside the lodge. The stone equipment wing has a shuttered opening and a
raised timber surveying hide with optics and an aerial.

The lodge remains native, deterministic geometry. Existing caption, viewpoint,
lighting, planting-exclusion and arrival-path metadata now describe the field
lodge. Use **Views → Places → Kopje House** or **The expedition approach**.
The monorail route is preserved; the observation stock is rebuilt for the
passenger-window experience described below.

The rework adds regression proofs that the removed pool builders and water
materials are absent, buildings stop before the former leisure terrace, and the
old pool/fire-court footprints are available for planting. Existing clearance,
finite geometry, cache, motion and unchanged upper vertex budgets still apply.

## The giraffe family

Choose **Views → Places → The giraffe family**. Two adults and a calf follow
walking routes through the western acacia clearing, pausing independently to
browse real leaf crowns. A low sapling gives the calf reachable foliage. Their necks, heads, ears, tails,
upper legs, lower legs and hooves deform through the saved Blender armature. Distance-matched steps and smoothly released foot plants avoid a slow-motion
shuffle and abrupt toe-off. The hoof targets sample the emitted terrain. Pause stops wildlife
alongside the railway; reduced motion holds the family still.

The [editable Blender source and export recipe](../../models/safari-giraffe/README.md)
include the packed generated coat, weighted skin and editable walking timeline.
One indexed skin and coat texture are shared by the herd, with the same bone
poses in the color, moving-shadow and live-map passes. Room replacement and
failed uploads release those resources.
The generated model and credit travel in playable HTML. Blender is only needed
for authoring; the website and ordinary checks remain dependency-free.

### Music

**Acacia Express**, the optional two-minute ElevenLabs instrumental, accompanies
automatic safari cinema by day and night. To hear it while observing the family,
choose **More → Sound & music → The record shelf → Acacia Express**. Its warm
marimba, woodwind and railway-pulse prompt, checksum and mastering record are in
[`scripts/safari-music.json`](../../scripts/safari-music.json). The local master
stays outside Git; source-only editions retain the normal house-score fallback.

## Railway and Solstice

The continuous, vertically graded guideway is a **single straddle beam**, not
ordinary railway track. It has grounded tapered piers, side guide strips, a
running strip, expansion joints, and a twin-arch river crossing. Acacia Gate
and Rift Lookout have elevated timber platforms, canvas canopies, seating,
station signs, lighting, and stairs connected to the landscape.

Solstice is original cream-and-jade panoramic stock: two cab cars and two
intermediate cars, furnished interiors, separate glazed roofs, independently
swiveling U-shaped bogies, rotating load tyres, and horizontal guide tyres.
The native simulation, camera, cutaway, renderer passes, and shared stock-cache
disposal own its lifecycle. No geometry is created in the frame loop.

The room sets `trainCollection: false` and supplies its own train label.
Conventional cabinet trains cannot be selected or restored onto the beam.
Switching to a conventional railway restores the cabinet controls.

## Sculpted rift and observation cars

The escarpments use explicitly authored asymmetric polygon footprints and
separate bedding levels, rather than radial hills. Fracture gullies, narrow
shelves, crest slabs, fallen rock, dry washes, scrub colonies and ragged acacia
crowns give the landscape large, medium and small-scale detail. The spring bed
is cut into the same terrain field. Narrow falls alternate with wider ledges;
local flow coordinates replace the earlier world-space striped ribbon.

Safari-only surface materials 86–89 provide rock, flowing water, ground and
concrete. Their receiver-plane shadow comparison accounts for sloping surfaces
inside the shadow-map filter, avoiding diagonal self-shadow hatching. Material
90 carries the Pixal3D wildlife coats and weighted skins. Gallery plaque
material 91 uses the existing atlas with matte lighting, no sun or lamp
specular reflection, and receiver-plane shadows, keeping lettering readable
from either side. Other materials retain their existing behavior.

Solstice now has a continuous chamfered ivory/green body, bronze window reveals,
rounded clear apertures, transparent roof skylights, upholstered observation
seats, timber floors, window tables, and compact rounded guide-truck fairings.
The actual transparent-glass pass is used, not painted opaque glass. The camera
and car body share `safariCarMatrix`, including the native running-height offset.

## Window seat

Choose **Train → Take a window seat** or **Views → Window seat**. The camera
sits inside the second carriage at passenger eye height. The visible window
frame, roof, seats and passing scenery are the same 3D geometry seen outside.
Select either side with **Left window / Right window**. Drag to look around;
pinch or scroll adjusts field of view without moving the eye through the wall.
The recenter button and Home key reset the view. Arrow keys look around, and
Escape or **Leave seat** restores the previous camera and keyboard focus.

Only local look angles are smoothed. World-space translation follows the exact
moving-car transform, so corners and the route seam cannot cause camera lag
through the carriage. Reduced-motion preferences disable look easing. Pointer
capture is released on cancellation, blur, tab hiding and exit. Map entry and
room changes clean up the seat controls. Sound, pause and throttle remain under
the user's control. Roof cutaway does not remove the passenger's enclosing roof.
The separately corrected driver view remains available.

## Source and checks

- `src/rooms/safari.js`: landscape, guideway, stations, room shell and registration.
- `models/safari-giraffe/`: editable Blender source, authoring and export recipes.
- `src/scenery/safari-giraffe-model.js`: generated articulated model data.
- `src/rooms/safari-wildlife.js`: shared meshes, terrain-aware poses and roaming.
- `scripts/safari-companions-qa.mjs`: native animal surface contact, clearances,
  behavior cycles, shared rendering and resource cleanup.
- `scripts/safari-behavior-qa.mjs`: giraffe feeding contact, cadence and hoof continuity.
- `scripts/safari-giraffe-qa.mjs`: source/export hashes, grounding, clearances,
  animation, shared rendering and resource cleanup.
- `src/trains/safari.js`: original monorail stock, motion and stock-cache adapter.
- `src/safari-ride.js` and `.css`: passenger camera, controls and input lifecycle.
- `scripts/safari-passenger-qa.mjs`: shared pose/glass and lifecycle contracts.
- `scripts/safari-ride-review.mjs`: native passenger, touch-fixture and export review.
- `scripts/safari-qa.mjs`: deterministic geometry, emitted-surface interpolation,
  continuous track, terrain/tree clearances, tyre contact, incompatible-stock
  rejection, cache disposal, credits and live-map registration.

Run `npm test`, `npm run test:geometry:full`, and
`npm run check:contributions -- --json`. The dedicated check is `npm run test:safari`.
No runtime packages or external assets are required.

For optional browser evidence, supply a separate Playwright installation through
`PLAYWRIGHT_MODULE_PATH` and run `node scripts/safari-visual-review.mjs` with
`scripts/serve.py --port 4175` already running. The script exercises the actual
native app and saves screenshots, a review report, and a playable house export
under the ignored `evidence/safari/` directory. Playwright is not a project
dependency and is not shipped in the public build.

Responsive desktop captures are not physical-phone performance or touch tests.
See PR #40 for the exact reviewed revision, measurements, and remaining checks.

The additional passenger review is `node scripts/safari-ride-review.mjs`, using
the same external Playwright variable and preview server. Its evidence is kept
in `evidence/safari-ride/`. A software-rendered browser is not a frame-rate
measurement or a physical-phone gesture test.

Rock and concrete shading use the actual triangle face normal, alongside
receiver-plane shadow filtering. Same-camera comparisons isolated the diagonal
hatching to smoothed normals lighting geometrically back-facing cliff facets,
not depth-sampler precision. This keeps the sharply cut shelves legible without
disabling their shadows or applying a large detached-shadow bias. The source
remains native to the house renderer; other materials keep their existing normals.

## The grazing lawn and expedition archive

Two textured, Blender-rigged plains zebras inhabit the western lawn at approximately
`(-27, -5)` and `(-23, -7)`. The **zebra lawn** view frames their independent
32-second walk/graze cycles. The whole neck bows from its shoulder and carries
the head into the grass; ears and tails remain independently articulated.
An African elephant inhabits the open southeastern lawn around `(17.5, 21.7)`,
framed by **The elephant trail**. Its 44-second cycle combines a measured amble
with foraging, six articulated trunk sections, fanning ears and a swaying tail.
All four feet sample the existing terrain and use two-segment leg articulation.
The original giraffe family and its textured skin are unchanged.

Pixal3D generated both animal surfaces and coats from isolated reference
images. Blender supplies cleanup, anatomical weights, and separate editable
walk and grazing/foraging actions. The [editable characters and export recipe](../../models/safari-companions/README.md)
retain the generated UV-mapped surfaces; the runtime does not substitute
procedural animal parts. One immutable skin per species belongs to
`scene.wildlife.parts`; individual bone palettes belong to
`scene.wildlife.companions`. The two zebras share their geometry and coat. Room,
map and shadow passes consume the same poses. The existing wildlife clock
controls pause and reduced motion, and the room's mesh ownership controls
disposal. No additional recordings or runtime service dependencies are used.

The [animal authoring process](safari-animals.md) records reference preparation,
the working GPU environment, cost tracking, rigging and independent validation.

The house-scale expedition archive adds botanical study plates, warm timber
bookcases, specimen drawers, field cases and an open survey folio with a brass
compass and lantern. Wall-mounted displays belong to their wall's cutaway mesh.
**The expedition archive** looks across the northwestern work desk from the
western aisle, outside the miniature table footprint. These are room
furnishings, separate from the miniature Kopje House lodge.
