# The giraffe family

A Pixal3D-generated giraffe surface, cleaned and rigged in Blender for
**nickfromlater**, with Codex assistance. The contribution uses the repository's
MIT license. Generation used [TencentARC Pixal3D](https://huggingface.co/spaces/TencentARC/Pixal3D)
and its [MIT-licensed Pixal3D-T model](https://huggingface.co/TencentARC/Pixal3D-T).
See [the process record](../../docs/contributing/pixal3d-giraffes.md) for provenance,
settings, cleanup and costs.

## Editable character

Open `safari-giraffe.blend` in Blender 5.1.1. It contains a continuous UV-mapped
skin, normalized weights, an 18-bone armature, packed 4096px coat texture and an
editable 49-frame walk action. Bones articulate the torso, neck, head, ears,
tail and four upper/lower/hoof chains. This is a weighted deforming mesh.
The walk uses solved foot paths with a planted stance and short recovery.

The game shares one indexed mesh and a 2048px coat between two adults and a calf.
It interpolates the authored walk, adds subtle head/ear/tail motion, offsets rest
intervals, and adjusts each leg to the rendered terrain. Color, shadow and live
map passes consume the same bone palette. Pause and reduced motion freeze the
family; room disposal releases the shared buffers and texture.

## Export edits

From the repository root:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background \
  models/safari-giraffe/safari-giraffe.blend --python-exit-code 1 \
  --python models/safari-giraffe/export.py
```

Substitute your Blender executable on other systems. Save edits before exporting:
`export-report.json` hashes the saved `.blend` and generated script. The exporter
writes the mesh, normalized weights, inverse bind matrices, 25 sampled walk poses
and embedded JPEG to `src/scenery/safari-giraffe-model.js`. It rejects unsupported
modifiers, missing weights/UVs, bone scaling, more than 24 bones or more than
60,000 expanded vertices. No Blender or network dependency runs in the website.
The portable HTML carries the coat and animation with it.

Current delivery: 17,439 triangles, 16,289 indexed vertices, 52,317 expanded
vertices, 18 bones and three draw calls per pass. Geometry buffers total about
1.51 MB; the shared 2048 RGBA texture with mipmaps is about 22.4 MB on the GPU.
The 4096px original stays packed in the authoring file.

## Rebuild from the generated surface

The saved `.blend` is self-contained; routine edits do not require the raw GLB.
To repeat the import and rig authoring from the same generated input (this
**overwrites edits**):

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background \
  --python-exit-code 1 --python models/safari-giraffe/build-source.py \
  -- /absolute/path/to/giraffe-pixal3d.glb
```

The expected input SHA-256 is
`34fb1e8ee10570540e5cd46878f84b6656a5c87e08c51c6feabfac902f1c0250`.
The raw generation is archived separately; it is not fetched by builds. Run the
export command after rebuilding, then `npm test`, `npm run test:geometry:full`
and `npm run check:contributions -- --json`. Inspect actual motion in
**Views → Places → The giraffe family**, including the narrow phone compositions.
