# Zebra and elephant characters

Pixal3D generated each textured animal surface from an isolated reference image.
Blender supplies the anatomical armatures, normalized vertex weights and editable
walk and grazing/foraging actions. The contribution is credited to
**nickfromlater**, with agent assistance, under the repository's MIT license.
The generator is [TencentARC Pixal3D](https://huggingface.co/spaces/TencentARC/Pixal3D),
using the [MIT-licensed Pixal3D-T model](https://huggingface.co/TencentARC/Pixal3D-T).

## Source files

Each species directory contains its self-contained `safari-<species>.blend`,
authored `landmarks.json`, `export-report.json` receipt, and the small processed
`reference.png` actually supplied to Pixal3D. Generation metadata and the raw
GLB hash accompany each character; the original high-resolution isolated
reference and private job logs remain outside the public build. The Blender files
pack the generated coat and preserve its UV mapping. The zebra has 19 bones, including two neck segments;
the elephant has 23, including six continuous weighted trunk segments. Both use
four upper-leg/lower-leg/foot chains. Their two named actions remain editable
in Blender's Action Editor. Select the walk or grazing/forage action to edit it.

The runtime shares one immutable mesh and 2048px coat per species. Two zebras
have independent routes and poses; the elephant has its own slower route.
Distance traveled sets the walk cadence. Stance anchors and two-link leg solves
adapt feet to the rendered ground. Room, shadow and map rendering consume the
same pose; draw passes do not advance time. The existing simulation clock
preserves pause and reduced motion. Room disposal releases each shared skin.

## Export saved Blender edits

From the repository root, substitute `elephant` for `zebra` to export that animal:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background \
  models/safari-companions/zebra/safari-zebra.blend --python-exit-code 1 \
  --python models/safari-companions/export.py -- zebra
```

The exporter writes `src/scenery/safari-zebra-model.js` and updates the receipt.
It samples both saved actions, retaining the bone hierarchy, inverse bind
matrices, normalized weights, UVs and embedded coat. It preserves the existing
24-bone and 60,000-expanded-vertex limits per model. No Blender, model service,
network request or additional JavaScript library runs in the shipped site.

## Rebuild the authored source

The Blender files are the editable deliverables; routine editing does not need
the original generation input. To repeat cleanup and authoring from the same
raw GLB, use the command below. This overwrites edits to the species' `.blend`.

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background \
  --python-exit-code 1 --python models/safari-companions/build-source.py \
  -- zebra /absolute/path/to/zebra-pixal3d.glb \
  models/safari-companions/zebra/landmarks.json
```

Landmark boxes and oblique planes are feathered weight-painting regions,
not generated geometry. The zebra's neck and sloping jaw use broad anatomical
transitions to preserve a continuous mane-to-poll curve while grazing.
The script imports the Pixal mesh, aligns it, welds duplicated vertices, removes
small reconstruction fragments, and preserves its textured surface. Solved
foot paths become ordinary keyed bone transforms. The separate grazing/forage
action adds neck/head movement, weighted trunk curling, ear motion and tail sway.

After export, run the repository checks and review actual motion, shadows,
terrain contacts, pause, reduced motion, the live map and portable export at
desktop and narrow viewports. A resized browser is not a physical-phone test.
