# Guest miniatures

A guest room can display an existing artist’s scene as real geometry on a table.
[Yamaai](../../src/rooms/yamaai.js) hosts the **Mountain Railway Diorama** by
[Techartist](https://x.com/techartist_), using the original three.js builders.
Orbiting the house camera orbits the miniature; the mountain rises above the
surface and the room’s opaque furniture and walls occlude it.

This is an adaptation of the guest’s presentation, **not its original web page
running unmodified**. The vendored source files remain unchanged. The house
adapter bypasses `main.js`, its camera, OrbitControls, UI and animation loop.
The guest’s authorship and licence remain attached to the work.

## Loading and ownership

- `src/embedded.js` owns entry, loading status, attribution and teardown.
  `activateHouseRoom()` calls `embeddedEnter()` after choosing the room.
- `src/guest-yamaai.js` is a small classic script. Its `import()` calls run only
  on actual room entry, after the native room has built and a 520 ms delay.
  The adapter installs the vendored project’s `three` and `three/addons/`
  mappings as a **scoped runtime import map** before importing the builders.
- The builders run in stages, with a pen-drawn landscape on the table and a
  compact progress card. Only actual builder stages advance the progress;
  fetching modules does not claim completed geometry. **Back to rooms** cancels
  the load. Loading remains visible in cinema. Re-entry restores the sketch,
  and its drawing buffer is released when the miniature takes over.
  Between stages, loading yields to the house and waits for a visible tab.
  Each original builder is synchronous: a large stage can still briefly block
  interaction. Background-tab timings do not describe foreground performance.
- Shader readiness uses the vendored renderer's program readiness checks with
  house-owned, abortable waits. Never use the upstream `compileAsync()` loop:
  its polling timers can outlive a destroyed context.
- The two renderers share a maximum 60 Hz cadence while a guest is open, so
  their cameras stay aligned. The guest framebuffer is limited to roughly
  2.1 million pixels at typical desktop sizes, shadows refresh at 10 Hz and
  river reflections at 5 Hz. The original geometry and near/far LOD remain.
- `embeddedFrameUpdate()` runs once in the house render path, after the final
  camera update, including room, layout and cinema views. The guest creates no
  animation loop and starts no audio. A pause button stops its train and weather
  motion; reduced-motion visitors start paused.
- Leaving, opening the house map, or cancelling a partial build disposes scene
  resources, removes the canvas and explicitly calls `forceContextLoss()` on
  the guest renderer. This also releases the original river’s private reflection
  target. It never loses the house renderer’s context. Late results are disposed.
- Re-entry builds a fresh scene. Browsers retain imported **module code** in
  their module cache for the page lifetime; geometry and a live GPU context are
  not kept in a hidden room. Map previews show only native furniture and credits.

## Camera and depth

The authored geometry remains in its original coordinate system, so procedural
shaders and animation still use the units they were written for. A uniform fit
places the physical scene within the table footprint, with its lowest surface
resting just above the wood. Weather particles do not determine that fit.

The adapter transforms the house camera into miniature coordinates and adjusts
its projection’s near/far translation by the same scale. Both renderers therefore
agree on projected positions and depth, including off-axis house cameras.

Separate WebGL contexts cannot share a depth buffer. On entry, the adapter copies
only positions and indices from the native room’s opaque GPU buffers. It draws
that small copy with color writes disabled into the guest renderer’s depth
buffer, then draws the original guest scene. Native wall cutaways use the same
visibility function in both renderers. This is a full-viewport transparent
canvas containing 3D geometry; there is no iframe, screenshot texture or CSS
homography. Pointer gestures pass through to the house.

The compromise: the two renderers do not exchange shadows or translucent-glass
lighting. The miniature keeps its own shadows and reflections, but does not cast
shadows onto house furniture. The house’s depth-of-field/vignette pass does not
process the guest canvas. The original fullscreen sky, distant backdrop mountains
and bloom/compositing are omitted because they describe an outside world, not a
physical tabletop object. Day/evening/night lighting, lanterns, rain and wetness
follow the house controls using the original scene’s uniforms and light palette,
with a little additional room fill at night so details remain readable.

## Cinema

The usual Cinema button starts with **Follow the local**, zoomed into the moving
train. **Mountain drift**, **Station side** and **Whole miniature** remain
available. Station and landscape anchors come
from the original builders, transformed into house coordinates. The house
interpolates the camera and retains drag, pinch, scroll, keyboard framing and
return-to-automatic controls. The opening shot moves close to the railway,
inside the front wall and its trim. Close shots stay close on phones; only
**Whole miniature** backs out to fit the complete model across a narrow screen.
Reduced motion disables automatic drift.
The adapter supplies close train/station framing through `session.cinemaView`,
using the original train focus, station position and terrain clearance. Away
from the station the following camera rides ahead on the original rail curve,
inside its clear corridor and tunnel bore, instead of cutting through trees.
`groundHandled:true` keeps the house's unrelated floor-height clamp from lifting
that camera into the tunnel roof. The
station angle sees the train past the platform canopy. A guest's default shot
does not overwrite the camera selection saved for other rooms. The adapter also
publishes its moving train pose in house coordinates for manual framing.
A guest pose does **not** populate the native
train registry. Use `hobbyHasNativeTrain()` for native matrices, steam and
throttle controls; `hobbyHasTrain()` also accepts a guest camera anchor. This
distinction prevents an empty native train list from crashing the frame loop.
The guest’s pause control is available beside its credit outside cinema.

Yamaai sets `conductor:false` in its room definition. Both conductor calls and
the spoken arrival greeting are suppressed, including audio finishing a fetch
after navigation. Entering the room stops an existing announcement without
changing the visitor's global conductor preference. Its optional host score,
**Between the Mountains**, plays in automatic cinema by day and night; pinned
record selections and the regular music/mute controls still take precedence.
This ElevenLabs instrumental belongs to the host presentation, not Techartist's
original project. See the [recording handoff](../../assets/audio/README.md#yamaai-score).

## Attribution comes from one record

`YAMAAI_PROJECT`, registered before the room, supplies:

1. The room dock: title, linked author profiles and original source. The dock
   yields to the loading card during construction and hides in cinema.
2. The in-world plaque painted by `initEmbeddedArt()`.
3. The house map’s room name, tag and description.
4. The room’s validated `credits`, used by the builders panel and exports.

`hostCredits` separately preserves Nick’s credit for the guest room. It does not
attribute the guest model to the host. Use the artist’s supplied public identity;
never infer another person or turn an `@handle` into a different platform.
The supplied permission was public on 11 September 2026; the maintainer removed
the on-screen permission notice. MIT remains recorded with the project and in
the vendored licence; do not describe the current dock as displaying that notice.

Plaques are painted **before** `initHouseArt()` uploads the texture. The reserved
780 × 196 slots are `(3310,1056)` and `(610,524)`. Do not use the old `(3310,856)`
slot: the Coastal Gallery paints its window at `(3390,620,690,420)` on first visit
and would overwrite that credit. The plaque’s lettered face must also be in
front of its backing. Yamaai mounts it on the back wall beside the window, clear
of the mountain; Views → Places → The plaque brings it close enough to read.
Additional guests need a checked atlas allocation; exceeding these two slots
omits the optional in-world plaque and is not acceptable for a new guest review.

## Contributing another guest room

Agree the room proposal with the maintainer first. Then:

1. Verify a compatible licence and the author’s permission. Record the source,
   exact upstream commit, public credit and permission date.
2. Vendor the project and required dependencies under `vendor/<project>/`.
   Preserve `LICENSE`, dependency licences and `UPSTREAM-COMMIT.txt`. Prefer
   unchanged original files plus a separate host adapter. Document every patch
   if an approved integration actually needs upstream source edits.
3. Review the modules you will execute. **This is no longer a sandboxed iframe:**
   imported code runs with the house page’s privileges. Only reviewed, locally
   vendored modules are allowed. Contributor JSON never selects executable code.
4. Build a native room and table, then register one project record with
   `registerEmbeddedProject()`. Follow `src/rooms/yamaai.js` for `base`, `create`,
   `credits`, `hostCredits`, `table`, `focus` and map metadata. Set `railway:false`
   when the train belongs to the guest rather than the native train registry.
5. Write a project-specific adapter with an abortable asynchronous factory that
   returns `{frame(state), dispose()}`. The original builders must remain the
   source of the model. Keep the house camera, input, frame scheduling and audio
   ownership intact. Use `embeddedRoomDepth()` for native occlusion and release
   *all* guest resources, including partially built scenes, on abort.
6. Load the small classic adapter after `src/embedded.js`, before its room
   registration in `index.html`. Guest ES modules are the explicit exception to
   the house’s classic-script rule and are reached only through runtime data.

If the author’s code cannot be driven cleanly, discuss a GLB export with the
maintainer and artist. Do not silently recreate the scene or change its authorship.

## Build, portability and review

The public build copies `vendor/` byte-for-byte without fingerprinting it.
Relative imports depend on those filenames. Never reference a vendor entry from
static HTML `script[src]` or `iframe[src]`: delivery QA requires directly linked
HTML assets to be fingerprinted under `immutable/`. The lightweight adapter is
fingerprinted normally. Use `npm run dev` / `scripts/serve.py`; its public path
allowlist includes `vendor/` and it injects the required audio catalogue.

Playable HTML exports retain the room, the attribution record and links, but do
**not** bundle this large ES-module graph. File/blob exports show an explanatory
message instead of attempting guest imports. Runtime guest canvases and import
maps are removed during packing. The rest of the exported house remains playable. Photographs composite both
canvases and include an artist/source footer.

Run `npm test`, `npm run test:geometry:full` and
`npm run check:contributions -- --json`. `npm run test:guests` checks camera/depth
agreement, native buffer copying, wall cutaways, credit/atlas integrity, cancelled
loads, map teardown and portable fallback. It does not replace browser review.

In a **focused foreground browser tab**, check desktop, 390px and 320px widths:
room entry/loading, orbit/zoom, furniture and wall occlusion, the lettered plaque,
credit links, pause, day/night/rain, cinema, map navigation and repeated re-entry.
Check that an unvisited guest causes no vendor requests. The `#embedStage`
dataset exposes guest state, foreground status, draw/triangle counts, geometry
and texture counts, model bounds/scale and context release for local inspection.
Check `data-context="released"` and the removed canvas on exit. A resized desktop
browser is not a physical-phone performance or WebGL compatibility test.
