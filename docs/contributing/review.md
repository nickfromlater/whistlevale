# Local contribution review

Keep local screenshots, exported HTML, measurements and draft PR notes in
`evidence/<work-id>/`. Both Git and Vercel ignore `evidence/`; the public build
does not copy it. Include selected screenshots in the PR when submission is
authorized. An ignored local path alone is not evidence a remote reviewer can see.

## Match the checks to the change

For code or scene changes, run `npm test`; geometry also needs
`npm run test:geometry:full`. For contributions, include the measured report from
`npm run check:contributions -- --json`. Documentation-only changes need the
command and link checks below. Record actual results in the PR template.

| Contribution | Manual review |
| --- | --- |
| Documentation or guidance CLI | Verify local links and anchors, command names, examples and generated guidance against this checkout. Scene screenshots are unnecessary unless app UI also changes. |
| Any visible change | Desktop, 390px and 320px views; daylight/night; actual room and live 3D map; keyboard access; chosen credit. |
| Static annex building or scene | Wide view, named close-up and low orbit; foundation contact, roof and props; tree/water/rail/neighbor clearances; landscape cinema where relevant. These pieces are not editable objects. |
| Grand Hall exhibit | Complete native model and chosen credit in the entered Hall; default occupancy marker in the house map, or full model only for an explicitly reviewed `mapPreview: true`; selected bay and close views; display-surface contact and usable case bounds; creator links and main Builders credit; the Hall export route below. |
| Editable Alder Valley asset | Above, plus select/move, reset, duplicate, undo/redo and layout JSON import/export. |
| Train or livery | Every finish, formation, working wheels/bogies/roofs, sound and running motion in railway rooms; cabinet focus and phone navigation. |
| New source module or credit | Playable export includes the model and chosen credit; open the contributed room and its named view or Hall bay in the exported house. |

Responsive desktop viewports do not verify native phone gestures or physical
phone performance. Say which device and interactions were actually checked.

For buildings, inspect low and side views for roofs bearing on walls or beams,
closed roof/wall joints and supported stairs. Check that deliberate openings
remain clear. Inspect the intended finishes in every renderer where the work
appears. For a Hall exhibit, this means the actual Hall renderer and, for a
railway placement or reviewed map preview, the house renderer: supported material
IDs can still give the wrong appearance for copper, stone, wood or glass.
If WebGL/GPU review is unavailable, report it as unverified. A Canvas fallback
or standalone model preview does not prove the actual app's appearance or
performance.

PR previews use separate review URLs and do not publish production. A
maintainer's merge to `main` publishes production. Contributions must not edit
`vercel.json` or project deployment settings to disable previews; disclose an
unavailable preview and the local checks completed in the PR.

## Measure the addition

For railway placements from `contributions/world.json`, the contribution checker
reports `models`: each placed work's builder vertices,
measured XZ radius and declared radius, including its selected scale and pose.
It rejects geometry outside the declared footprint. `scenes` reports the actual
room contribution total, including any ground terrace added by the adapter.
Model vertices and room totals can differ for that reason.

Hall-only exhibits are currently absent from that JSON report. Include the
geometry measurements printed by `npm run test:hall` as well. Meridian's focused
check, `node scripts/meridian-observatory-qa.mjs`, reports its vertex count,
vertex-buffer size and placed dimensions. Keep the existing aggregate Hall
budgets; a measurement for one exhibit is not a new allowance for every bay.

Use `?profile` (or `&profile` after `?room=commons`) for local runtime diagnostics.
Match device, viewport, room, camera, lighting and sound; reset measurements
after startup settles. Compare frame times, draw calls and vertex-buffer memory.
These measurements stay local and add no telemetry to normal visits.

## Export the complete house

From an annex, use **More → Build in Alder Valley → Project menu → Export
playable HTML**. Packing from the editor still includes every room and its
reviewed contribution catalogue. The editor's separate **Export layout (.json)**
contains the Alder Valley layout; it is not a Commons scenery export.

Open the downloaded `whistlevale.html` in a browser, use **Switch room** to enter
the contributed room, then choose **Views → Places → your work** in rooms with
the standard house controls. Check **More → The builders** too.

For a **Grand Hall exhibit**, use **← House map** in the entered Hall, select
**Alder Valley** and enter it, then use **More → Build your railway → Project
menu → Export playable HTML**. The export packs the dedicated Hall page, its
native exhibit scripts and their credits together with the house. In the
downloaded house, use **Switch room → Grand Hall → Enter**, select the exhibit's
bay, and inspect the complete model, chosen credit and creator link if supplied.
For the original Willowbank Pottery, use **GH-08** and verify `nickfromlater` and
the existing X profile link. Use **← House map** to check the occupancy marker or
explicitly reviewed full-model preview in the exported overview, then enter
**Alder Valley** and check **More → The builders**.
The Hall's own bay details provide its exhibit inspection.

Keep generated exports in the ignored evidence directory. If browser tooling
blocks the local file, record playback as unverified; do not bypass its URL
policy. Source inspection and automated
round-trip tests are useful evidence, but do not prove local-file playback.
