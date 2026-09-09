# Add a building, end to end

Read [AGENTS.md](../../AGENTS.md), then choose the smallest path that can produce
the requested architecture. Ask for the contributor's public credit if absent.

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

## Make a genuinely new shape

The editor needs more than a new catalogue row. Inspect a similar `ASSETS` or
`newDivisionAssets` row, `getTemplate`, `workshopGetTemplate`, `divisionAsset`, `registerObject`,
`placementCheck`, `validateProject` and `seedDivisionScenery` in `src/railway.js`.
Implement its builder, choose accurate dimensions and materials, and add the
template dispatch that actually draws it. Match the renderer's coordinate and
transform conventions. House geometry must clear trains at roof and platform
height as well as at ground level.

For a building in an annex room, inspect `cottage` in `src/rooms.js` and the
room's own building functions. Existing cottage details can use a `miniatures`
entry; a distinct building needs a bounded builder mapping or a room module
change. Place it on the finished terrain sampler, preserving authored platforms
and retaining walls. Add a credited community work pointing to the real source.

## Check and submit

```sh
npm run check:contributions -- --json
npm test
npm run test:geometry:full
```

Check the actual room and 3D map at desktop and 390px/320px phone sizes, daylight
and night, wide and low viewpoints. Compare frame time, draw calls and vertices
using `?profile`; keep the device/camera identical. Test reset, duplicate,
undo/redo and JSON round-trip for editor assets. Export playable HTML and check
the credit and model there. Report unavailable physical touch checks honestly.

Use the PR template with before/after images, source/credit, positioning rationale,
test results and measured impact. A bigger district or architectural change
starts with a proposal. The maintainer reviews and merges; deployment is separate.
