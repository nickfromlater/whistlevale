# Morrow House & the Midnight Line

## Third pass: the living phantasmagoria

The haunting now behaves like part of the miniature rather than a layer of
generic effects. A fully modeled Victorian magic lantern sits on the old
sacristy terrace with turned tripod legs, a walnut table, chimney, focusing
bellows, glass lens, hand crank, slide gate, operator's stool and a box of
painted glass plates. Its active beam is a cached translucent mesh aimed at the
mansion facade, where the projected Mourning Lady flickers between bright and
dim registrations, drifts slightly and raises one hand. The projection and beam
freeze to a stable pose when reduced motion is enabled.

Seven important gas and oil sources now receive independent cached halos. Their
flicker uses different frequencies and phases so the estate never pulses in
lockstep. Rare beats shift individual lamps to a corpse-green glow, suggesting
the magic lantern is drawing something other than electricity. A separate
apparition makes a slow procession through the family plot, while a pair of eyes
appears in an unlit east window only during a short interval of a much longer
cycle. The infrequency is deliberate: the room should reward lingering rather
than announce every trick immediately.

The phantasmagoria is a tenth named viewpoint. No timers, frame listeners,
runtime geometry allocation, images, audio assets, network requests or storage
were added. All moving haunting pieces reuse the room's existing frame clock and
cached stock meshes; transparent projection, beam, halos and watching eyes use
the renderer's existing material-84 effect path.

## Second pass: the terraced estate

A haunted Victorian estate inside a collector's candlelit parlour. The station
clock is fixed at 11:59 while the mansion clock runs backwards. Small apparitions
wait in the graveyard, ruined abbey, winter garden and verandah. No jump scares
or new external assets are introduced.

The estate is arranged as connected garden terraces, rather than separate
buildings on a flat board. Four open front vaults replace the mansion's solid
foundation facade. The original east and west railway portals remain aligned
with the circuit. An arched gallery bridge joins the abbey to the verandah; a
second arched stair descends toward the conservatory. A curved retaining wall
and promenade give the family plot a substantial planted edge.

The mansion has staggered slate tiles, projecting ornamental dormers, turned
porch columns, scroll brackets, a curved metal canopy, upstairs balconies,
four clock faces, an oriel balcony and flowering ivy. The conservatory has a
curved glazed dome, fretwork, a mosaic floor and a luminous botanical specimen.
The ruined abbey has layered Gothic tracery, organ ranks, keyboards and pews.
A hollow mausoleum and small weeping angel sit beside the family plot.

The foreground moonwater pond contains a hollow planked skiff and worn landing.
Its stream continues beneath an actual railway bridge. The station platform is
placed from the running rail, and a yew labyrinth surrounds a brass armillary.
Ten viewpoints include the horologist's garden, moonwater landing and the phantasmagoria terrace.

The larger parlour includes modeled bookcases and book spines, shaped curtain
folds and tiebacks, a moon window, open fireplace, grandfather clock, leather
chair and collector's desk. The scalloped walnut display cabinet retains the
miniature exhibit identity.

## The Mourning Star, No. XIII

Original plum-and-brass 4-4-0 stock, not a recolored existing locomotive. The
second pass replaces solid wheel discs with annular tires and open spokes.
Carriage side windows have separate reveals, transparent panes and curtains;
the cab side walls have openings. Underframe rods, upholstered seats, table
lamps, clerestory roofs and open end platforms remain modeled.

The room is explicitly marked `trainCollection: false` with its own steam-train
metadata so the controls identify The Mourning Star rather than a fallback
cabinet locomotive. The public `cars` value includes the tender: the default
three vehicles behind the locomotive are one tender and two coaches.

Cab and coach roofs support the house cutaway. Wheels, quartered rods, bogies
and couplings use the existing circuit transforms. Seven apparitions, five bats,
two clock hands and at most six steam puffs reuse cached meshes. Decorative
haunting freezes under reduced motion; plume draws are omitted inside the crypt.
There are no new animation listeners, intervals, network requests or storage.

## Source and review

- `src/rooms/morrow.js`: terrain, structures, shell, route and room registration.
- `src/trains/morrow.js`: bespoke stock, motion, cached haunting geometry and phantasmagoria effects.
- `scripts/morrow-qa.mjs`: checks against the actual shared repository runtime.
- `index.html`: both classic modules load before house startup.

Credit remains **nickfromlater**, original design and implementation with agent
assistance. No third-party models, textures, recordings or runtime libraries are
added. Existing repository licensing applies.

Use Node 24 or newer for the repository checks:

```sh
npm run test:morrow
npm test
npm run test:geometry:full
npm run check:contributions -- --json
npm run dev
```

The room-specific checks cover finite geometry, balanced transforms, ten
viewpoints, locomotive labeling and power, transparent glazing, projection/effect materials, route closure,
portal clearance, coach height, cutaways, coupling transforms, frozen reduced-
motion poses and no geometry allocation while drawing. The original 650,000
room-vertex budget is retained; an additional assertion applies that same limit
to the room plus floor. Wall budgets are unchanged.

Use the current PR's CI results for the native measurements and check status.
The independent presentation harness is not the native Whistlevale renderer.
Reference images and software geometry-review renders do not establish native
browser appearance or physical-phone performance. The second pass still needs
native-browser visual review at desktop, 390px and 320px, including map entry,
room changes, both crypt portals, cab view and roof cutaway. Physical iPhone
performance remains a separate review. Publishing the PR does not merge it.
