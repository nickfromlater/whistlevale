# Morrow House & the Midnight Line

A haunted Victorian estate inside a collector's candlelit parlour. The story is
quietly uncanny rather than a jump-scare attraction: the station clock has
stopped at 11:59; the house clock still moves; a tiny congregation waits by an
open-air organ; the greenhouse seems to be keeping something in.

## The miniature

An asymmetric Second-Empire mansion stands on a stone undercroft through which
the railway actually passes. Its five projecting dormers, slate mansard,
clock tower, octagonal oriel, widow's walk, parted curtains, cornices, turned
verandah columns and ivy are native geometry, not a facade image.

The curved circuit visits a scalloped station canopy, ruined abbey with an
open rose window and pipe organ, crooked family plot with an ajar mausoleum,
a glass winter garden, a pond and skiff, raven fountain and broken hedge maze.
Bare branching trees and wind-pruned yews leave air around the architecture.
The scalloped walnut cabinet has turned supports. The larger room includes
paneled walls, damask, velvet curtains, a modeled moon, silhouette portraits,
a fireplace, grandfather clock and wingback chair.

Seven places are available through the existing room navigation, alongside
the house's ordinary layout, trackside, locomotive, follow and cab views.
Room key: `morrow`. No stable room-plot ID was requested, so placement is left
to the registry-driven map rather than claiming an open plot.

## The Mourning Star, No. XIII

Original 4-4-0 rolling stock in plum, blackened iron and brass, not a repaint
of an existing train. The engine has a flared chimney, riveted smokebox,
boiler bands, bell, cowcatcher, cab fittings and raised Roman numberplates.
A coal tender leads clerestory observation coaches with upholstered seats,
table lamps, sash windows and open end platforms.

The house cutaway removes the cab and coach roofs. Wheel phase drives the
spokes and quartered side rods. Leading and coach bogies follow their own
positions along the circuit. Coupling links join the actual vehicle ends.
The public `cars` value includes the tender, so the initial value of three
means one tender and two coaches. Geometry is allocated during stock creation,
never in the draw loop; replacement and failure paths dispose owned meshes.

Four small apparitions, five bats, two tower-clock hands and eight steam puffs
reuse cached meshes. Reduced motion freezes these decorative animations. No
new interval, event listener, audio context, network fetch or persistence is
introduced. Existing pause, sound and ambience controls remain in charge.

## Source and integration

- `src/rooms/morrow.js`: landscape, structures, shell, route, room registration.
- `src/trains/morrow.js`: bespoke stock, moving parts and bounded haunting.
- `scripts/morrow-qa.mjs`: actual shared-runtime geometry and motion checks.
- `index.html`: the two classic scripts load after shared stock and before
  startup. The standard public build discovers them through this entrypoint.

Credit: **nickfromlater**, original design and implementation with agent
assistance. No external models, textures, recordings or runtime libraries are
added. Existing repository licensing applies.

## Review

Run with Node 24 or newer:

```sh
npm run test:morrow
npm test
npm run test:geometry:full
npm run check:contributions -- --json
npm run dev
```

The native QA checks script order, finite triangle data, bounded world geometry,
a closed flat circuit, lateral portal clearance, coach height under the vault,
stock construction, car counts, roof cutaway, reduced motion, real couplings
and zero geometry allocation while drawing. The new checks do not loosen any
existing budgets.

Review the actual house at desktop, 390px and 320px widths, including the map,
room changes, the undercroft from both sides, stock cutaway and cab view.
Check actual phone performance separately. Do not infer phone frame rate from
software-rendered Chromium.

An independent single-file presentation harness was used to inspect the same
new geometry locally. It renders successfully at desktop, 390px and 320px,
with no page or WebGL errors in the recorded checks. Its lighting and camera
adapter are not the house renderer; its screenshots are not evidence of
end-to-end house integration. The measured presentation total is 803,034
vertices, including all walls, furnishings and stock. Native measurements and
full-suite results must be taken from the commands above, not substituted with
those preview measurements.
