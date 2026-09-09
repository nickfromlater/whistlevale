# Contribute to the Grand Hall

The Grand Hall is the central exhibition in the house map. Its connected
galleries offer display spaces for original miniatures. Accepted examples include
Willowbank Pottery in **GH-08**, by [nickfromlater](https://x.com/nickfromlater),
and Meridian Hill Observatory in **AR-03**, by
[nickfromlater](https://github.com/nickfromlater). The reviewed catalogue in
[`src/grandhall-exhibits.js`](../../src/grandhall-exhibits.js) on current `main`
is the source of truth for occupied bays. An empty space is an invitation;
selecting one does not reserve it or publish a contribution.

## Choose a bay and copy its prompt

Run `npm run dev`, enter the Hall from the house map and select an empty bay.
Copy its prompt into Codex, Claude Code, Copilot or another coding agent, then
describe what you want to build and which public name to credit. A pseudonym
without a profile link is valid. If either answer is missing, the agent asks
before authoring.

The same prompt is available in the terminal:

```sh
npm run bay -- AR-04
```

Both actions use `grandHallAgentPrompt()` in `src/grandhall-contribute.js` and
derive the gallery and position from `src/grandhall-data.js`. A link such as
`/grandhall.html?bay=AR-03` opens the selected bay; `?gallery=architecture` opens
its gallery. Check current `main` before beginning: a bay that was empty on an
older page may already have an accepted exhibit.

Contributions are source changes reviewed in pull requests. There is no asset
upload, browser draft, account or reservation step. The copied prompt describes
the complete path from your idea to a reviewable native model.

A PR preview has its own review URL and does not update the production site.
A maintainer's merge to `main` publishes production through the connected build.
Do not edit `vercel.json` or project deployment settings to disable previews as
part of a contribution. If a preview is unavailable, state that in the PR and
provide the local checks you could complete.

## Propose a whole room beside the Hall

The full house map also shows open **room plots** in its flanking wings. Select
one and copy its room prompt. These are places for complete future rooms,
separate from the miniature display bays inside the Hall. The prompt asks for
the intended theme and chosen public credit and starts with an accepted room
proposal, as required by [Adding a room](../../CONTRIBUTING.md#adding-a-room).
Choosing a plot is an invitation to propose; it does not reserve or publish it.

`grandHallRoomPrompt(plot)` in `src/grandhall-contribute.js` generates this brief
from the selected plot's `id`, `name` and `side`. `src/shop-house.js` derives the
available plots and supplies their labels, footprints and positions. Plot IDs
such as `east-3` and `west-4` mean the east/west wing and one-based row. A new
registered room uses `map: {plot: 'east-3', ...}` to replace that exact open site.
Confirm the plot remains free on current `main` before implementing it.

Build an original `src/rooms/<key>.js` with its real scene, room shell, accurate
footprint, floor at `FLOOR`, deliberate cameras and chosen credits. Register it
before atlas creation and startup. The normal registry then handles the map,
preloading, scene caching and portable script discovery. Keep authored room
scale, connecting paths and the Grand Hall's full footprint intact. Follow the
room recipe for railway stock, landscape-only rooms, materials, disposal,
exports and the complete checks. The agent prepares a PR for maintainer review;
it does not merge or deploy the room.

## Build an original exhibit

Read [AGENTS.md](../../AGENTS.md), [CONTRIBUTING.md](../../CONTRIBUTING.md), the
[geometry reference](geometry.md) and the [attribution contract](attribution.md).
Inspect `git status`, preserve existing work, and make a contribution branch
from current `main`. Follow the existing classic-script loading order; no npm
installation or API key is needed.

1. Write `src/scenery/<slug>.js` with a uniquely named procedural builder. Use
   [Willowbank Pottery](../../src/scenery/willowbank.js) and
   [Meridian Hill Observatory](../../src/scenery/meridian-observatory.js) as
   original model examples. Shared `Builder` primitives live in `src/railway.js`; room
   helpers live in `src/rooms.js`. Balance every transform push/pop and build
   around a local origin. The exhibition adapter positions and scales the work.
2. Register the source in `grandhall.html` before inline startup as a deferred
   classic script. The source loads only when its gallery is needed:

   ```html
   <script type="application/x-whistlevale-exhibit" data-source="src/scenery/my-miniature.js" data-src="src/scenery/my-miniature.js"></script>
   ```

   Keep `data-source` equal to the registry's canonical source path. The build
   fingerprints `data-src`; portable export embeds the file without executing it
   until needed. For a Hall-only work, this declaration is sufficient; do not
   add an eager source tag to `index.html`. A work also placed in a railway room,
   or explicitly opted into the house-map preview, needs the normal source tag
   in `index.html` before `hobby.js` as well.

   Keep code initialization limited to definitions. Both renderers support
   `Builder` primitives, `ringX`/`ringZ`, `hash`/`shade` and `windowPane`. For the
   Hall adapter use material IDs `0, 4, 5, 6, 8, 22, 23, 41`; do not assume railway
   atlas labels or every room helper is available. Test the actual model.
   Compare the intended finishes in the Hall renderer and, for a railway
   placement or reviewed map preview, the house renderer. A supported material
   ID alone does not establish that copper, stone, wood or glazing looks right.
3. Add a dispatch mapping to `grandHallBuildExhibit()` in
   `src/grandhall-exhibits.js`. Wrap the builder reference in a function so other
   unloaded sources are never resolved eagerly, for example
   `miniature: (...args) => myMiniature(...args)`. Add one `GRAND_HALL_EXHIBITS` record there with
   `bay`, a unique `id`, `title`, `credits`, `story`, `builder`, uniform `scale`,
   and `source` pointing to the new scenery file. Use the normal attribution
   array: each credit has a chosen `name`, optional paired `platform`/`handle`
   and optional `note`. Preserve every original author when adapting work.
   `grandHallExhibitCredits()` validates these credits for the Hall and
   **More → The builders** in the main house. Source packing retains them in
   both parts of a playable export. The helper accepts the original legacy
   `maker`/`link` fields for compatibility; new exhibits use `credits`.
   Safe profile links open in a new tab. A Hall exhibit with the same `id` and
   `source` as a reviewed railway miniature gains a link to that exact placement,
   with the camera focused on the built model. Do not replace an occupied bay or
   copy a credit you were not given.
4. Inspect the bay's actual display shape and its surroundings. Open tables,
   low or tall glass cases, wall cabinets and round cases offer different
   usable areas and heights. Scale the complete miniature inside those clear
   dimensions, with its foundation in contact and its roof and props clear of
   the glass and frame. Leave room for walking and for neighboring exhibits to
   be seen. A catalogue record alone does not create a new model: the geometry
   and its renderer mapping must exist.
   For buildings, inspect low and side views to confirm roofs bear on walls or
   beams, roof/wall joints close without unintended gaps, and stairs have
   visible support. Deliberate openings should remain clear from those views.

Hall builders use their own registry. A Hall-only miniature does not need an
entry in `COMMUNITY_BUILDERS` or `communityMiniatures`; those serve railway room
placements. For a separately requested Commons placement, follow the additional
registration steps in the [building recipe](buildings.md).

Use deterministic, static geometry with an intentional silhouette and restrained
small detail. Use the shared deferred loader; do not add third-party downloads, dependencies or per-frame rebuilding.
Keep local buffers owned by their existing scene lifecycle and disposal paths.

## Keep the coordinates and credits intact

`src/grandhall-data.js` owns gallery, connection and bay identities. Keep bay IDs
stable. Gallery layouts, positions and display shapes can vary; use the chosen
bay's current record instead of assuming a repeated grid or a universal table.
Its `width`/`depth` (also exposed as `w`/`d`) describe the furniture's outer
dimensions in its local axes; `yaw` gives its rotation in radians. These outer
dimensions protect walking clearance and are not the space available to a model.
Use `usableWidth` and `usableDepth` for the clear display rectangle, or
`usableRadius` for a round case's circle. A rectangle's corner can lie outside
that circle. `maxHeight` is the maximum height **above `bay.surfaceY`**, the
actual cloth or platform surface. It does not include the furniture below it.

`displayFormat` identifies an `open-table`, `low-vitrine`, `tall-vitrine`,
`wall-case` or `round-vitrine`. The copied prompt states the format and actual
usable dimensions. Leave a margin to the glass, frame and any shaped corners;
do not enlarge the case or change its limits just to make a contribution fit.
Hall coordinates describe metres. `GRAND_HALL_UNIT_SCALE` maps them into the
railway renderer's scene units; the house map applies the room's uniform scale.
An exhibit record's `scale` converts the native model into its Hall display size.
`grandHallPlaceExhibit()` builds the native model once, measures its lowest
vertex, and aligns that vertex with `bay.surfaceY`, the actual cloth or platform
surface. It then applies the bay's position, yaw and the exhibit's uniform scale.
Keep the model around its local origin; do not add a second bay transform or
hand-tuned vertical lift. The helper rejects empty, nonfinite or unbalanced
geometry and preserves the target builder's transform stack.

The Hall and The Commons have separate placement catalogues. Never put Hall
coordinates or bay IDs into `contributions/world.json`; Hall exhibits belong in
`GRAND_HALL_EXHIBITS`. An additional Commons placement is a separate contribution
following the [Commons recipe](commons.md). The obsolete `grandhall:align`
conversion remains disabled.

Willowbank is the same native model in both places, with the original
`nickfromlater` credit and X profile preserved. Keep original credits and any
required source notices when adapting another person's work. State authorship
and source permissions in the PR; an agent's assistance is not a replacement
for the chosen human credit.

## Performance as the collection grows

The entered Hall builds static architecture and native exhibits only for the
current gallery and the neighboring galleries needed by its visible view.
Geometry from inactive, unvisited galleries is not constructed at startup.
Its residency cache retains at most **three galleries on desktop** and **two
on phones**. Galleries in the current view are pinned; when another gallery is
needed, the least recently used hidden gallery releases its GPU buffers and
vertex-array objects. Revisiting it rebuilds deterministic geometry from source.

Source loading and geometry residency have separate lifetimes. A reviewed
exhibit script is loaded and executed once when needed, with duplicate requests
sharing the same load. Source stays available for the page visit even after its
gallery's GPU resources are evicted. Portable exports retain these sources for
offline visits. Keep script initialization limited to definitions; building
meshes or creating large caches at file load would defeat gallery loading.

The house map uses a lightweight overview; enter the Hall for full exhibit
inspection. By default, a Hall-only contribution marks its occupied display with
a small brass edge plaque. Use `mapPreview: true` only for an explicitly reviewed
full-model preview, accounting for its added geometry in the overview. Willowbank
and Meridian retain those previews. Such a preview needs its source available at
main-house startup. Ordinary Hall-only source can wait for entry to its gallery.
Always preserve the complete entered model, chosen credit and portable export.
The main Builders list retains the credit whether the map shows a marker or a
full preview.

The gallery-count limit is not a byte or frame-time guarantee. Keep the existing
geometry budgets and measure the complete emitted model, including its props.
The renderer stores 12 float32 values per vertex, or **48 bytes per vertex** in
its vertex buffer; shared textures, shadows and temporary CPU arrays add memory
beyond that figure. Review the total contribution allowance across the Hall,
rather than treating it as a fresh allowance for every bay or visible gallery.
Do not increase budgets to fit a detailed model. Reduce unnecessary geometry
and verify that useful detail remains visible from its actual viewing distance.

With `grandhall.html?profile`, compare first entry, a neighboring-gallery visit,
and return after eviction on the same device, viewport, camera and lighting.
Visit more galleries than the cache can retain and check that hidden GPU
resources are released. Verify retry after a failed source load and that a
rapid change of destination cannot activate or retain an abandoned scene.
`node scripts/hall-residency-qa.mjs` exercises these ownership and loading rules
with a synthetic catalogue; it adds no public exhibits and does not substitute
for physical phone performance checks.

## Check the whole route

```sh
npm run check:contributions -- --json
npm test
npm run test:geometry:full
python3 scripts/serve.py --port 4175
```

Use another free port if 4175 is already occupied. The supplied server injects
the optional audio manifest; a bare static server does not. No recordings are
required for these checks.

The JSON contribution report currently measures railway placements; it omits
Hall-only exhibits. Include the Hall measurements printed by `npm run test:hall`
as well. For Meridian's focused measurements, run
`node scripts/meridian-observatory-qa.mjs`; its output includes vertex count,
vertex-buffer size and the placed model's dimensions.

Inspect the live house map, Hall entry and return, direct bay links, pointer and
keyboard bay selection, your complete miniature, credit and creator link. Check
desktop and **390px/320px** phone widths, with no overflowing controls or blocked
walking paths. Compare frame timing and geometry against the same camera before
the change. Keep existing budgets; simplify unnecessary geometry if needed.
Use the [review checklist](review.md) for export and attribution checks affected
by shared source changes. Mark physical touch or other unavailable checks as
unverified rather than treating desktop resizing as a device test.
If WebGL/GPU review is unavailable, say so explicitly. A Canvas fallback or
standalone model preview does not verify the actual Hall or house renderer's
appearance or performance.

The main map loads a lightweight Hall overview through its own scene renderer.
Entering the Hall opens its dedicated page with the complete native exhibits.
Check both the overview and the entered work when reviewing a contribution.
`map.position: 'central'` reserves its authored footprint, while bounds,
connecting corridors, picking and framing grow from the registered room sizes.
Do not shrink the Hall to a standard railway-room cell.

A playable house export also embeds the Hall's page, scripts and original exhibit
credits. Its Hall opens from that embedded copy and carries a return link to the
exported house. Re-exporting the house reuses its embedded Hall without fetching
public files. From a railway room, use **More → Build in Alder Valley → Project
menu → Export playable HTML**, then check Hall entry, the miniature and creator
credit, house return and repacking while offline. The Hall page itself is not a
separate draft or upload format.

Keep screenshots and measurements in ignored `evidence/<work-id>/`. Prepare a
focused commit and PR description using
[the template](../../.github/PULL_REQUEST_TEMPLATE.md), with the bay ID, requested
subject, chosen credit, sources, screenshots, measured impact and checks actually
run. Push or open the PR only when authorized. Maintainer review and merge make
the exhibit part of the catalogue; agents do not merge, deploy or change the
repository's visibility.
