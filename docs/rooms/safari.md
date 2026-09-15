# The Rift Observatory

Original safari miniature, Solstice monorail, and expedition gallery by
`nickfromlater`, built with agent assistance. Requested scope: proposal #39.
No animals or imported scenery are included.

## Visit

Start the normal preview with `npm run dev`, then open `/?room=safari`.
The live house map discovers this native room at **west-4**.
Use **Views → Places** for the eight authored compositions, or choose
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
The monorail route and no-animals scope are preserved; the observation stock
is now rebuilt for the passenger-window experience described below.

The rework adds regression proofs that the removed pool builders and water
materials are absent, buildings stop before the former leisure terrace, and the
old pool/fire-court footprints are available for planting. Existing clearance,
finite geometry, cache, motion and unchanged upper vertex budgets still apply.

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
inside the shadow-map filter, avoiding diagonal self-shadow hatching. Other
materials retain the original shadow comparison. No shader dependencies or
image textures have been added.

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
