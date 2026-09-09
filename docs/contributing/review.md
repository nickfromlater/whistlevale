# Local contribution review

Keep local screenshots, exported HTML, measurements and draft PR notes in
`evidence/<work-id>/`. Both Git and Vercel ignore `evidence/`; the public build
does not copy it. Include selected screenshots in the PR when submission is
authorized. An ignored local path alone is not evidence a remote reviewer can see.

## Match the checks to the change

Run `npm run check:contributions -- --json` and `npm test`. For geometry changes,
also run `npm run test:geometry:full`. Record actual results and limitations in
`.github/PULL_REQUEST_TEMPLATE.md`.

| Contribution | Manual review |
| --- | --- |
| Any visible change | Desktop, 390px and 320px views; daylight/night; actual room and live 3D map; keyboard access; chosen credit. |
| Static annex building or scene | Wide view, named close-up and low orbit; foundation contact, roof and props; tree/water/rail/neighbor clearances; landscape cinema where relevant. These pieces are not editable objects. |
| Editable Alder Valley asset | Above, plus select/move, reset, duplicate, undo/redo and layout JSON import/export. |
| Train or livery | Every finish, formation, working wheels/bogies/roofs, sound and running motion in railway rooms; cabinet focus and phone navigation. |
| New source module or credit | Playable export includes the model and chosen credit; open the contributed room and its named view in the exported house. |

Responsive desktop viewports do not verify native phone gestures or physical
phone performance. Say which device and interactions were actually checked.

## Measure the addition

The contribution checker reports `models`: each placed work's builder vertices,
measured XZ radius and declared radius, including its selected scale and pose.
It rejects geometry outside the declared footprint. `scenes` reports the actual
room contribution total, including any ground terrace added by the adapter.
Model vertices and room totals can differ for that reason.

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
the contributed room, then choose **Views → Places → your work**. Check
**More → The builders** too. Keep generated exports in the ignored evidence
directory. If browser tooling blocks the local file, record playback as
unverified; do not bypass its URL policy. Source inspection and automated
round-trip tests are useful evidence, but do not prove local-file playback.
