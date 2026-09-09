# Grow The Commons

The Commons (`commons`) is the house's shared starting landscape: a winding
stream, low wooded hills and open meadows. Willowbank Pottery, by
[nickfromlater](https://x.com/nickfromlater), is its first contribution. The rest
of the landscape stays open for considered additions. A single steam service
runs around the whole board, with two low stream bridges and Willowbank Halt.

Read [AGENTS.md](../../AGENTS.md) and [attribution](attribution.md). Start locally
with `npm run contribute -- commons`. Run
`python3 scripts/serve.py --port 4175`, then open
http://127.0.0.1:4175/?room=commons. If that port is already in use, choose another
free port and use it consistently; do not stop another contributor’s server.

## Choose a place

The board spans X −54…54 and Z −33…33. Positive Z faces the room entrance.
Coordinates are model units; `at` is `[x,z]`, and angles are radians.

| Starting area | Suggested center | Character |
| --- | --- | --- |
| Western meadow | `[-23, -3]` | Level ground north of Willowbank Pottery, with room to breathe |
| Eastern field | `[25, 7]` | Open ground below the woodland, suitable for a small workshop or garden |
| Northern clearing | `[18, -3]` | Open interior ground, with the wooded hill farther behind |

These are terrain examples, not reserved plots or a fixed town plan. Check
the latest catalogue before choosing a location: an accepted contribution may
already occupy one. The scene test checks these ground samples independently;
it does not promise that they remain vacant. Updating a suggestion when it fills
is helpful, but a contribution must not require moving an unrelated test fixture. Keep open space between works,
retain views across the water, and leave the riverbanks and established trees
clear. The perimeter railway stays fixed; rerouting it or adding a large district
should start with an agreed proposal.

## Add a small contribution

Add a separate work to `contributions/world.json`, preserving all existing work:

```json
{
  "id": "your-cottage",
  "title": "A meadow cottage",
  "kind": "building",
  "room": "commons",
  "source": "contributions/world.json",
  "credits": [{"name": "Your chosen public name"}],
  "miniatures": [{"builder": "cottage", "at": [-23, -3], "angle": 0.2}]
}
```

Replace the example identity, title and coordinates; this JSON illustrates the
format, not a guaranteed vacant site. `cottage` uses the established cottage model. For original
architecture, follow the [building recipe](buildings.md) and add the actual
geometry plus a bounded builder mapping. A new title alone does not make a new model.
[Willowbank Pottery](../../src/scenery/willowbank.js) is the complete original
building example: geometry, declared footprint, catalogue credit and close-up view.
For figures and small arrangements, see [available builders](../../contributions/README.md#shared-buildings-people-and-scenery).

Omit `y`: the adapter places the work on the finished terrain. The room's
`scene.canPlace(x,z,radius)` rejects water, board edges and existing woodland;
the shared adapter also checks slopes and neighboring contribution footprints.
The checker reports the work ID, placement index, coordinates and reason when a
placement cannot be built. Move it to appropriate ground or correct the model;
do not guess a deck height or shrink a footprint to bypass a failed check.
These static additions are reviewed repository contributions; the live editor
continues to edit Alder Valley.

The landscape and shell live in `src/rooms/commons.js`. `commonsHeight` generates
terrain; `commonsSurface` samples its emitted triangles. Keep those aligned.
Oaks, birches, conifers and two riverside willows use room-local geometry and
protected canopy footprints. Roots follow the finished surface; woodland
understory and bank sedges stay out of the open plots. Natural details use
coordinate hashes, never shared random-sequence consumption.
The room has one continuous circuit with normal train selection, camera and
sound behavior. `COMMONS_ROUTE` follows a rounded rectangle at X ±47 and Z ±26;
its rails stay at Y 1.5. `commonsRailDistance` shapes the supported track bench,
while the stream bed remains open below the two bridges. Preserve the bridge
abutments and the halt at `[-28,23.1]`. The two miniature light slots correspond
to its real lamps; unused slots stay below the floor. Keep independent scenery
clear of the track, halt, woodland and other contributed footprints.

## Check the work

Run `npm run check:contributions -- --json`, `npm test`, and
`npm run test:geometry:full`. The contribution scene check builds The Commons
and fails if a requested placement was omitted or exceeds the existing budget.

Inspect the live map, room, named viewpoints (including the new work), and cinema on desktop and
390px/320px phones. Check daytime and night, terrain contact, water and tree
clearances, and **More → The builders**. Test a playable export for new source
modules or credit changes. Include before/after screenshots, chosen credit,
checks actually run and measured geometry impact in the PR template. The
[local review guide](review.md) gives the export menu route, evidence directory
and checks specific to static annex scenery.

A useful agent request:

> Read AGENTS.md and the Commons recipe. Add a [describe the building or scene]
> to The Commons, credited to [public name]. Preserve the landscape and existing
> credits, test locally, and prepare a focused pull request.
