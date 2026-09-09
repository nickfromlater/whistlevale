# Make something for Whistlevale

[Agents start here](../AGENTS.md) · [Train recipe](../docs/contributing/trains.md) ·
[Building recipe](../docs/contributing/buildings.md) · [Attribution](../docs/contributing/attribution.md)

There are two contribution paths: reviewed scene data for existing builders,
and reviewed JavaScript for new models and behavior. Both go through a pull
request. Nothing submitted here is automatically published or loaded remotely.

## Find a bay in the Grand Hall

The [Grand Hall](../docs/contributing/grandhall.md) has seven distinct galleries
and 112 numbered display bays. Willowbank Pottery, by
[nickfromlater](https://x.com/nickfromlater), occupies **GH-08**; the other bays
begin empty. Enter from the house map, select a bay and copy its agent prompt.
The terminal prints the same prompt:

```sh
npm run bay -- CC-07
```

The brief supplies the selected bay's gallery, display dimensions and position,
native model recipe and required checks. It asks what you want to build and which
public name to credit if you have not already supplied them. Choosing a bay
does not reserve or publish it; confirm it remains empty on current `main`.

Hall contributions are reviewed native source changes in `src/scenery/`, with
the builder and credited exhibit registered in `src/grandhall-exhibits.js`.
Follow the Hall recipe to include the model in both the house map and the
entered exhibition. Hall coordinates do not belong in `contributions/world.json`.
There is no upload or browser-draft step; the obsolete `grandhall:align`
conversion is disabled.

Open **room plots** on the full house map have a separate prompt for a complete
future room. They require an accepted proposal and a registered room using the
selected `map.plot` ID. See the Hall recipe for that larger contribution path.

## A shared place to begin

[The Commons](../docs/contributing/commons.md) has a stream, open meadows and its
first contribution, Willowbank Pottery. It welcomes small buildings, miniature
scenes and details. Use `room: "commons"`
and a `miniatures` entry; the recipe gives starting coordinates and placement
checks. It remains a reviewed shared scene, not a second live layout editor.

## Layouts

Copy [the starter](layouts/starter/starter.railway.json), or use **More → Build
your railway**, then **Project menu → Export layout (.json)**. Import with the
same menu. Place a submission in `contributions/layouts/<slug>/` with its
`.railway.json` and a short README describing the idea, chosen credit and checked
views. Preserve `format`, `version`, connected tracks and existing credits.
Add a top-level `credits` array as described in the attribution guide.

The validator accepts at most 2,400 scenery objects and bounded cubic tracks.
It checks types, coordinates, dimensions and connected running alignments.
An accepted layout remains a downloadable example; it does not replace the
default house. We do not claim that format validation proves collision-free or
fast rendering. Run it locally and inspect clearances before submission.

## Shared buildings, people and scenery

`world.json` is the active catalogue. Each work has a stable `id`, `title`,
`kind`, registered `room`, existing repository `source`, and `credits`.
The bakery/inn placements, six small scenes and Willowbank Pottery are worked examples.
Each work can have either or both of these placement arrays:

- `workshop`: editable Alder Valley objects. `type` names an `ASSETS` entry;
  `at` is `[x,z]`, `angle` is radians and `scale` is an optional multiplier.
  Cottage/bakery/inn `params` use `w`, `d`, `h`, `paint`, `roof`, `name` from
  `validateProject()`. Adding a new object shape also needs an editor builder.
- `miniatures`: static details in an annex room. `builder` names an allowlisted
  builder in `COMMUNITY_BUILDERS`; `at`, `angle`, `scale`, optional `y` for an
  existing deck, and person `pose`, `variant`, `color` are bounded. Missing `y`
  uses the room's finished ground. Never use a guessed deck height to bypass
  slope checks. These are miniature details, not full-sized shop visitors.

Available miniature builders include people, birds, dogs, bicycles, chairs,
cases, packs, books, rope, trolleys, cottages, trees, lamps, benches, and the
harbor/porter/map-party/reading/atelier compositions. New compositions can add a
reviewed builder, declared footprint in `src/community-core.js` and mapping in
`src/community.js`. Original buildings live in `src/scenery/`; follow the
[building recipe](../docs/contributing/buildings.md#original-buildings-in-the-commons-or-another-annex)
for script registration and optional `view` metadata.
Touching objects belong inside one composition; independent footprints may not
overlap. Register new room modules before startup and use their registry key.

The catalogue's 128-work cap is an initial curation choice, not a technical
renderer limit; it can be raised as the collection grows. There is also a cap
of 64 placed pieces per room. Miniature
geometry is capped at 300,000 vertices per room. These are guardrails, not a
promise of phone performance; compare `?profile` on the same device and camera.
`npm run check:contributions -- --json` validates data, credits, sources, train
portraits, layout imports, shared workshop clearances and actual annex placement.
It builds contributed scenes, reports per-placement model vertices and measured
radii, and rejects omitted work with its coordinates and the reason. Room totals
include any supporting terrain terraces. The scene tests also verify model footprints.

The dev server and build embed this JSON into the page; the browser never
fetches it. Portable HTML includes it. Refresh after data edits and use **Restore
Alder Valley** when checking changed factory objects: saved personal layouts
take precedence. Bump the factory cache version after factory placement changes.

## More ways to contribute

New trains, liveries, props, trees, furniture, bridges, districts, working signals,
room shells and posters use the source map in `npm run contribute -- --list`.
Start whole rooms and broad changes with a proposal so maintainers can agree on
the space and scope. Existing functions are examples, not arbitrary plugin APIs.
Audio submissions need a source and recording permission; discuss them before
adding files because generated recordings are intentionally ignored.

Use a credit-bearing work without placements to credit reviewed source changes
(for example a poster, bridge, soundtrack or district). Trains have their own
`credits`; new room definitions may include `credits` too. Keep the `source`
path accurate. Data never contains scripts, HTML, arbitrary links or API keys.
