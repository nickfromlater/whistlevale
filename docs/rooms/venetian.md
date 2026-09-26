# The Venetian Salon · La Serenissima

Open `/?room=venetian`, choose **The Venetian Salon**, or enter **east-7** on
the live house map. This is an original, compressed Venetian fantasy inside a
collector's salon, not a geographic reconstruction or historical railway claim.

## A city around the canal

Eleven individually authored canal palazzi now sit within a connected district
of eleven smaller calle houses and a new pierced-stone waterfront palace.
Secondary roofs and occupied street fronts create depth behind the canal rather
than leaving each tall building alone on the board. The existing basilica,
campanile, cafe, market arcade, well and piazzas retain their distinct places.

The new palace has nine lower colonnade bays, an open pointed-arch upper gallery,
a band of actual four-lobed openings through thick stone, and a pink/ivory attic
storey. Floors, benches and tiny figures are visible inside. Its openings are
geometry, not black window images pasted onto an opaque facade. The ten named
views include **The lace palace**; triangle-ray tests check three facade
sightlines from the authored desktop camera. Portrait framing remains a separate
lengthwise composition, and browser checks project the board corners and tower.

The main palazzi retain complete three- or four-storey fenestration, recessed
glazing, thick reveals, projecting cornices, shutters, stone and iron balconies,
hipped roofs, flared chimneys, drainpipes and exposed-brick accents. Three open
piano-nobile loggias and three supported rooftop terraces vary the silhouette.
New plaster and limestone materials add broad restrained weathering; original
materials in other rooms are unchanged.

The central **Ponte delle Lanterne** is wider and has eight stepped shops, four
on either side of an open stair aisle. Each shop has a supported masonry wedge,
real side/back walls, an open counter and small displayed wares beneath its
individual tiled roof. An open upper portico joins the shop rows. The original
elliptic arch remains navigable underneath, and both smaller bridges remain.

Cut-stone quays, recessed water stairs, moorings, landings, inlaid piazzas,
laundry, cypress/olive plantings and authored pedestrians connect the districts.
Building envelopes are checked against other buildings, bridge landings, the
canal and the existing perimeter railway. This railway uses coastal steam stock
with normal throttle, pause, train selection and removable roofs; it is not a
new locomotive model. The salon has darker blue-green walls, sea-glass
chandeliers, gilt molding, lagoon-window geometry and the boatbuilding bench.

## Rowing and camera experience

Four gondolas follow an independent closed water circuit. Their silver bow
ornaments are curved longitudinal forms rather than transverse ladders. Each
rower now has two articulated arms whose upper/lower links solve toward two
points on the actual oar handle. The power stroke dips the tapered blade into
the water; recovery lifts it clear. The earlier static extra arms are removed.
Both arm lengths, handle contact and blade clearance are checked throughout the
stroke and around the entire water circuit. Geometry is cached, not rebuilt
while rowing.

**Cinema → Alongside the gondolier** follows behind and slightly beside a boat,
with the camera's position sampled from the same water route. **The gondola
ride** retains its bow-seat view. Both eyes stay inside the canal and below the
real bridge intrados, including at the turning basins. Their look targets and
the panorama are fixed-world cinema presets, so manual takeover anchors the
visible boat scene rather than unexpectedly following the unrelated train.
Native drag, pinch, pause, automatic-camera restoration and exit remain in use.
The fourth cinema shot retains native train-follow behavior. Boats are automatic,
not player-steered.

## Actual native planar reflections

Material **102** now samples a real planar reflection of the native scene.
`venetian-render.js` redraws the same room, boats, train and architectural glass
through a camera mirrored about the canal's water plane. Above-water clipping
and water exclusion prevent recursive reflection; the water shader adds filtered
ripple distortion, soft sampling and angle-dependent reflection strength.
These are actual planar scene reflections, not ray tracing or screen-space
reflections. The house-map view deliberately uses the inexpensive water fallback.
Material 7 and other rooms' water remain unchanged.

There is one extra offscreen pass and one room-owned framebuffer with RGBA8
color and DEPTH_COMPONENT16 depth, plus reflection uniforms on the existing
program. There is no second renderer, new scene graph, duplicated geometry,
external texture, or additional animation loop. The target uses 55% of the main
buffer dimensions, capped at **896 pixels on its longest edge**, or **512 on
phones**. At 1440 × 1024/DPR 1 this is 792 × 563, about **2.55 MiB** for color and
depth payload. This excludes driver padding and all other renderer resources.

Unchanged paused views reuse the target. With a steady camera, changing time
refreshes it at approximately 30 Hz on desktop or 20 Hz on phones; moving the
camera refreshes immediately, so these are not absolute frame-rate caps. The
pass restores the main camera, matrices, framebuffer, viewport, winding,
renderbuffer and active texture unit. It also mirrors the camera used to sort
architectural glass. Its texture is unbound while being rendered to, avoiding
read/write feedback.

The target is released on room replacement, resize, normal room departure,
opening the map and renderer recreation. An incomplete framebuffer leaves the
water fallback active without allocating again every frame. Injected allocation
and draw failures exercise cleanup and restoration in focused tests. Physical
phone timing, thermal load and memory stability still require device evidence;
this additional pass is not claimed to be free or faster than the old water.

## Ownership, integration and credit

Five room modules load through normal startup/export script discovery:
`venetian-architecture.js`, `venetian-life.js`, `venetian-city.js`, the registering
`venetian.js`, and `venetian-render.js`. Native lettering, Builder, route sampling,
stock, registry, map transforms and camera controls remain in use. No browser
runtime dependencies, imported artwork, recordings, network calls or persistence
formats were added. Playwright is isolated review tooling, not a site dependency.

Each of **29 moving entries** owns a distinct mesh: four boats, four oars,
sixteen articulated arm links, four wakes and one bell. Normal and failed-build
paths release them. The scene clock advances only through the existing room/map
simulation hooks with clamped time steps. Pause and reduced motion freeze the
rowing and boat positions; water motion observes the house's reduced-motion
uniform. Every room/light uniform slot is authored. `canPlace` rejects community
placements that might obstruct the canal.

The room occupies east-7 so concurrent Orrery work in PR #49 can retain east-6.
Preserve both rooms' startup, cinema, simulation and npm hooks when integrating
both PRs. A combined two-PR build is not certified by this room's tests.

Credit: **nickfromlater**, original miniature and direction with agent assistance.
Existing house/helper authorship is preserved. Original geometry uses the
repository's MIT license; no external artwork was imported.

## Verification and budgets

`npm run test:venetian` runs room, district and reflection-lifecycle tests.
Coverage includes finite geometry, closed routes, sampled hull/blade/arch
clearances, full-route camera poses, fixed-view manual anchors, all rowing
phases, paused/reduced motion, no animation-time mesh creation, registration,
credits and normal/failed-build disposal. District tests check actual pierced
openings, building envelopes, camera occlusion and reflection projection.

Measured geometry: **548,913** static room/floor/furnishing vertices, **25,500**
wall vertices and **34,188** moving vertices, **608,601** combined, excluding
shared train stock. Existing static/moving/combined ceilings remain **550,000 /
40,000 / 620,000**. Redundant roof-seam and straight-handrail geometry was reduced
rather than increasing the budgets. Sampled minimum hull-to-bank clearance is
**2.49 scene units**; minimum overhead arch clearance is **2.04** after widening
the central bridge. These are miniature-scene units, not real engineering data.

The read-only review workflow runs Node 24 checks and native Chromium/SwiftShader
captures at desktop, 390px and 320px; day, lamplight and night; palace and bridge
views; cinema/manual-camera and map lifecycles; and a same-camera pixel A/B that
requires the reflection to visibly affect the rendered image. Separate checks
run `npm test`, `npm run test:geometry:full` and the contribution JSON report.
The full geometry comparison checks builder equivalence on the new scene, not
pixel equality to an earlier artwork revision.

`node scripts/venetian-experience-qa.cjs` adds actual synthetic mouse/two-finger
input, normal room departure/return, and the real playable-download path. It
opens those downloaded bytes as a standalone file with HTTP(S) blocked and
checks the room, credits, boat motion, reflection and lack of external requests.
With `VENETIAN_CAPTURE_FILM=1` it also renders 120 real simulation steps into a
six-second rowing clip. This deterministic film is not a real-time performance
benchmark. Consult the PR's exact source-specific runs for completed results.

Artifacts retain source IDs, reports and actual renders for 14 days. Local
review work belongs under ignored `evidence/`. Physical iPhone gestures/GPU
performance and long-duration thermal/memory stability remain separate acceptance
checks. Desktop touch emulation is not physical-phone evidence, and passing
geometry tests does not establish the owner's visual approval.
