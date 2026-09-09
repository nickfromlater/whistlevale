# Add a building, end to end

Read [AGENTS.md](../../AGENTS.md), then choose the smallest path that can produce
the requested architecture. Ask for the contributor's public credit if absent.

If the request is for the new shared room, start with the
[Commons recipe](commons.md): it has open meadows, starting coordinates, and
credited miniature placements. The editor path below is for Alder Valley.

## Place or customize an existing building

1. Inspect `contributions/world.json`: `village-shops` is active data, containing
   the bakery and inn. Add a separate work with a unique slug, title, `kind:
   "building"`, `room: "valley"`, `source: "contributions/world.json"`, credits
   and a `workshop` entry. Do not replace another contributor's work.
2. Find supported `type`s in `ASSETS` and `newDivisionAssets` in `src/railway.js`.
   For a cottage/bakery/inn, `params` can set width/depth/height (0.5–7), six-digit
   hex paint and roof colors, and the existing sign key (`bakery`, `inn`, `post`,
   or `null`). A custom sign needs an atlas slot and a reviewed builder change.
3. Site it intentionally. Inspect neighboring buildings, track gauge, overhangs,
   doors, riverbanks and camera sightlines. Angles are radians; `at` is `[x,z]`.
   The checker compares footprints with factory buildings and the editor's
   rail/water checks. Do not shrink bounds to get a passing check.
4. Bump `WORKSHOP_FACTORY_CACHE_VERSION`. Run the app on port 4175 and use the
   project menu's **Restore Alder Valley** so a saved layout cannot mask it.
   Confirm it is selectable, movable and credited in the inspector.

## Make a new shape

The editor needs more than a new catalogue row. Inspect a similar `ASSETS` or
`newDivisionAssets` row, `getTemplate`, `workshopGetTemplate`, `divisionAsset`, `registerObject`,
`placementCheck`, `validateProject` and `seedDivisionScenery` in `src/railway.js`.
Implement its builder, choose accurate dimensions and materials, and add the
template dispatch that actually draws it. Match the renderer's coordinate and
transform conventions. House geometry must clear trains at roof and platform
height as well as at ground level.

### Original buildings in The Commons or another annex

Use [Willowbank Pottery](../../src/scenery/willowbank.js) and its row in
`contributions/world.json` as a complete example. For primitive dimensions,
rotation order, winding and material IDs, use the compact
[geometry reference](geometry.md).

Register the source, page script, footprint and function mapping together:

1. Add `src/scenery/<slug>.js` with a uniquely named builder
   `function yourBuilding(b,x,y,z,angle=0)`. Push the placement transform,
   build in local coordinates, and pop it. Return the miniature population
   (zero for an empty building). Shared helpers are in `src/rooms.js` and
   `src/people.js`; `Builder` primitives are in `src/railway.js`.
2. Include the script in `index.html` after its shared helpers and before
   `src/community.js`. Classic scripts share a scope: do not add module imports.
   Build, export and geometry checks discover these scripts from the page.
3. Add its key and conservative **XZ radius** to `COMMUNITY_BUILDERS` in
   `src/community-core.js`, then map that key to the function in
   `communityMiniatures` in `src/community.js`. The radius is measured from the
   local origin to the farthest vertex, including roofs, steps and props.
   `npm run check:contributions -- --json` reports its measured radius and
   vertices; `npm run test:contributions` checks every mapped builder.
   The adapter owns placement rotation and scale; your mapped builder receives
   a local origin. Do not apply the catalogue transform a second time.
4. Add a separate catalogue work with `source` pointing to the new source file,
   the chosen public credit, and its `miniatures` placement. Preserve the
   original authors when adapting shared details. Omit `y` to sample the room’s
   finished terrain. Check foundation contact across the whole footprint.
5. For a building worth a closer look, add an optional `view` to that work:
   `{"distance":19,"yaw":0.45,"pitch":0.48}`. This adds its title under
   **Views → Places**, aimed at its first placed miniature. Angles are radians;
   distance accepts 10–120, yaw ±2π and pitch 0.2–1.35. Omitted fields get
   reasonable defaults. Only successfully placed work gets a viewpoint.

Keep small details in the static mesh. Existing materials and an unlettered
maker’s plaque avoid extra texture slots; original sign artwork needs deliberate
atlas allocation before geometry creation. Placement metadata alone cannot
introduce new architecture. Existing buildings can use an existing builder;
original buildings need original geometry.

## Check and submit

```sh
npm run check:contributions -- --json
npm test
npm run test:geometry:full
```

Follow the [local review checklist](review.md) for your contribution type.
Static annex buildings need terrain, roof, clearances, viewpoints, map and
portable checks; editor reset/duplicate/undo/JSON checks apply to editable
Alder Valley assets. Save local evidence in `evidence/<work-id>/`.

From an annex, portable export is **More → Build in Alder Valley → Project
menu → Export playable HTML**. The exported house includes every room.

Use the PR template with before/after images, source/credit, positioning rationale,
test results and measured impact. A bigger district or architectural change
starts with a proposal. The maintainer reviews and merges; deployment is separate.
