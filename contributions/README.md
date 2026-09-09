# Make something for Whistlevale

[Agents start here](../AGENTS.md) · [Train recipe](../docs/contributing/trains.md) ·
[Building recipe](../docs/contributing/buildings.md) · [Attribution](../docs/contributing/attribution.md)

There are two contribution paths: reviewed scene data for existing builders,
and reviewed JavaScript for new models and behavior. Both go through a pull
request. Nothing submitted here is automatically published or loaded remotely.

## Claim a bay in the Grand Exhibition

`grandhall.html` is the front door: seven galleries and one hundred numbered
display bays, all currently open. Open it, find an empty bay, and take its id.

Then get the brief for that bay and hand it to your coding agent:

```
npm run bay -- CC-07
```

It prints a self-contained block with the bay's gallery, its floor position, the
allowlisted builders, the three rules that fail review most often, and the checks
to run. **Its first instruction is that the agent asks you what you want to build
there** — a brief that guesses produces a generic bench.

Contributions are repository pull requests. Nothing is uploaded and no asset is
stored in the browser: your work lands in `contributions/world.json` (or
`src/scenery/` for an original building) and is reviewed like any other change.

If you drafted in the Hall and have one of its exports, align it to this
repository's format first:

```
npm run grandhall:align -- my-export.json --out contributions/world.json
```

That translates `whistlevale.community.v1` entries into `whistlevale-community`
works and runs them through the real validator, so you learn whether a bay will
land before you open a pull request.

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
