# The Venetian Salon · La Serenissima

Open `/?room=venetian`, choose **The Venetian Salon**, or enter **east-7** on
the live house map. This is an original, compressed Venetian fantasy in a
collector's salon, not a geographic reconstruction or a historical railway claim.

## The miniature

A winding lagoon-green canal has shaped masonry banks, cut-stone quays,
water steps and rounded turning basins. Four gondolas follow a separate closed
navigation circuit beneath three genuinely open stone arches. The central
covered bridge retains its stairs, balustrades, open arcades and terracotta roof.

The eleven palazzi are individually authored in `VENETIAN_BLOCKS`. Each has
three or four complete storeys, recessed glazing, thick arched reveals,
shutters and projecting cornices. The three piano-nobile loggias are actual
openings with internal floors, not dark window cards over opaque boxes. Iron
and stone balconies, hipped tiled roofs, flared chimney pots, corner masonry,
drainpipes, exposed-brick patches and restrained flower boxes provide detail.
Three supported timber rooftop terraces change the skyline. A long shaded
market arcade replaces the earlier row of blank rear blocks.

Building setbacks sample the entire curved frontage, including projecting
balconies and roofs. Building envelopes remain on dry land, separate from one
another, clear of bridge landings and inside the perimeter railway. The
basilica's five copper domes, open clock tower and swinging bronze bell,
inlaid piazzas, carved well, cafe, moorings and market remain part of the city.

Gondolas have a longitudinal curved silver bow ornament with forward-facing
teeth and tapered oar blades. The prior transverse ladder-like bow and cuboid
paddle have been removed. Boats retain animated oars, wakes and passengers.
The perimeter railway uses existing coastal steam stock with the normal
throttle, pause, train-selection and roof controls, not a new locomotive model.

The surrounding salon retains sea-glass chandeliers, gilt moldings,
lagoon-window panels, patterned stone, velvet benches and a gondola-builder's
workbench. Its window scenes are native colored geometry, not photographs.
Nine named viewpoints include **The golden loggia**. Portrait arrival uses a
separate lengthwise composition, not a cropped desktop camera. Cinema offers
the bow-seat gondola ride, bridge, panorama and native train-follow shot.
The gondola ride is automatic, not player-steered; normal manual camera
controls and automatic-camera restoration are preserved.

## Native lagoon material

Material **102** is a Venetian-only branch in the existing house fragment
shader. Material 7 and other rooms' water remain unchanged. The lagoon has
room-local UVs, derivative-filtered intersecting waves, grazing-angle sky
color and broken specular response to the existing practical lights. Soft
bank-color fields are authored from the actual building manifest. There is
no additional renderer, texture, uniform, reflection framebuffer or draw pass.

These are **stylized bank-color and light reflections**, not planar, ray-traced
or screen-space reflections of the buildings. The old permanently glowing
rectangles on the surface have been removed. Water animation uses the existing
house clock and reduced-motion uniform. Local coordinates are scene units,
not a real-world scale claim.

## Ownership and integration

`venetian-architecture.js` and `venetian-life.js` load before the registering
`venetian.js`. Native lettering, Builder, route sampling, stock, room registry,
map transforms, camera controls and cache lifecycle remain in use. No browser
dependencies, imported images, recordings, timers, listeners, network calls
or persistence formats were added. Portable script collection includes all
three modules and the existing renderer containing the lagoon material.

Each of thirteen moving entries owns a distinct mesh. Existing normal and
failed-build disposal release them. The bounded scene clock advances through
the existing room/map hooks only while unpaused. Reduced motion freezes boats,
oars, wakes and the bell. Leaving the room schedules no independent animation.
All six room-light and eight layout-light slots are authored, preventing stale
lighting from previously visited rooms. `canPlace` rejects community placement
rather than allowing imported scenery to obstruct the canal.

The room uses east-7 so concurrent Orrery work in PR #49 can retain east-6.
Neither PR depends on the other. Shared startup, cinema, simulation and npm
entries require preserving both implementations when eventually integrated.
A combined two-PR build is not certified by this room's checks.

## Verification and budgets

`npm run test:venetian` checks finite geometry, route closure, sampled swept
hull and every authored oar-blade vertex at both rotation extremes, actual arch
clearance, finite camera poses, reduced motion, bounded deltas, allocation-free
animation, registration, credits and normal/failed-build mesh disposal.

Architecture regressions check every storey for fenestration, actual generated
roof/balcony envelopes, bridge-landing clearance, true open arcade apertures,
glazing behind the reveal and all 17,280 water vertices' room-local UVs.
The 390px and 320px browser checks also project the display corners and bell
tower to ensure the entire miniature stays inside the portrait viewport.

Measured geometry: **538,875** static room/floor/furnishing vertices,
**25,500** wall vertices and **32,700** moving vertices, **597,075** combined,
excluding shared train stock. Existing ceilings remain **550,000 / 40,000 /
620,000** for static / moving / combined geometry. Coplanar floor inlays and
open-backed copper dome seams replace unnecessary hidden faces; new detail
does not rely on increasing the budgets. Sampled minimum hull-to-bank clearance
is **2.49 scene units** and overhead arch clearance is **2.18**.

The retained review workflow is read-only. It runs Node 24, isolated
Playwright/Chromium desktop and portrait checks, day/lamplight/night captures,
both canal directions, the new loggia, cinema/manual-camera lifecycle,
play/pause/reduced motion, live-map entry/return and light-slot restoration.
Separate checks run `npm test`, the full byte-exact geometry comparison and
`npm run check:contributions -- --json`. Artifacts record the tested source
commit, captures and logs; consult the PR for the exact completed runs.

Still separate acceptance checks: physical iPhone performance and gestures,
long-duration thermal/memory behavior and playback of a downloaded standalone
export. Software-rendered stills and resized desktop windows are not phone or
frame-rate evidence. No performance improvement is claimed.

Credit: **nickfromlater**, original scene and direction with agent assistance.
Existing house/helper authorship is preserved. Original native geometry uses
the repository's MIT license; no external artwork was imported.
