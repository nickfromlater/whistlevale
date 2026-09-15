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
The monorail route, stock and no-animals scope are unchanged.

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

## Source and checks

- `src/rooms/safari.js`: landscape, guideway, stations, room shell and registration.
- `src/trains/safari.js`: original monorail stock, motion and stock-cache adapter.
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
