# The Venetian Salon · La Serenissima

Open `index.html?room=venetian`, select **The Venetian Salon** in the room
picker, or enter its **east-6** plot on the live house map. This is an original,
compressed Venetian fantasy in a collector's salon, not a reconstruction of
Venice, a geographically accurate Rialto or a historical railway claim.

## The miniature

A continuous turquoise canal has shaped masonry banks and rounded turning
basins. Four gondolas travel a separate closed navigation circuit beneath three
real open stone arches. The central bridge has stairs, balustrades, two open
arcades and a terracotta roof. Palazzi have recessed arched windows, shutters,
stone balconies and flower boxes; alleys retain breathing room. Five ribbed
copper domes, a clocked campanile with an open belfry and a slowly moving bronze
bell, a compass-inlaid piazza, striped café, mooring posts and timber landings
reward closer views. The perimeter railway uses the house's existing coastal
steam stock, with its existing train selection, pause, throttle and roof controls.
It is not a newly modeled locomotive.

The surrounding room has sea-glass chandeliers, gilt moldings, lagoon-window
panels, a patterned stone floor, velvet benches and a small gondola-builder's
workbench. The windows are native colored geometry, not photographic imagery.
The water uses the house's existing ripple/specular material. Warm broken strips
suggest lantern reflections; they are authored glints, not planar reflections.

Eight named viewpoints include portrait distances. Cinema offers a bow-seat
gondola ride, the covered bridge, a panorama and the native train-follow shot.
The normal captured gestures and manual/automatic camera lifecycle are retained.
The gondola ride is a visual ride, not a player-steered boat.

## Ownership and integration

`venetian-architecture.js` and `venetian-life.js` load before the registering
`venetian.js` module. Shared helpers come from the existing house, including its
native lettering (`hudsonText`), Builder, materials, route sampler and stock.
There are no new browser dependencies, images, recordings, timers, listeners,
network calls, shader materials or persistence formats. Automatic portable
script collection includes all three modules.

Each of 13 moving entries owns its own mesh. The existing house disposal and
failed-construction paths release them. A bounded scene clock advances from the
existing room/map simulation hooks, only while unpaused; reduced motion freezes
boats, oars, wakes and the bell. Native water motion already observes the house's
reduced-motion uniform. Leaving a room schedules no independent animation.
The canal is conservative about future community placement: `canPlace` rejects
placements rather than letting imported scenery obstruct navigation.

## Verification

`npm run test:venetian` measures static room, wall and moving geometry; enforces
fixed 550,000 / 40,000 / 620,000 static / moving / combined vertex limits; checks
closed rail/water routes, sampled swept hull and oar clearances, every arch's
navigation clearance, finite camera poses, reduced motion, bounded deltas, no
animation-time geometry allocation, registration order, credits and both normal
and failed-build mesh disposal. The room is included in the full test sequence.

Initial measured geometry: **488,331** static room/floor/furnishing vertices,
**25,266** wall vertices, **33,816** moving vertices; **547,413** total, excluding
the shared train stock. The conservative sampled hull envelope clears the bank
by at least **2.49 units** and the stone intrados by **2.18 units**.

The branch review workflow runs Node 24 checks, an isolated Playwright browser,
desktop/390px/320px native views, cinema/manual-camera and house-map lifecycle
checks, the full test suite and full byte-exact geometry comparison. Its artifact
contains the tested source commit, captures and logs. Local evidence belongs in
ignored `evidence/venetian/`. Software-rendered screenshots and resized browser
views are not physical-phone or frame-rate measurements. A physical iPhone,
long-session GPU/memory behavior and played-back downloaded exports remain
separate acceptance checks. No performance uplift is claimed.

Credit: **nickfromlater**, original scene and direction with agent assistance.
Existing house and helper authorship is preserved; original source geometry uses
the repository's MIT license. No external artwork was imported.
