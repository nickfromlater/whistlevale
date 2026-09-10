# Blender-authored models: experimental bridge

[The Night Post](../../models/night-post/README.md) is the first Blender-authored
exhibit using this bridge, registered in LW-01. The bridge remains deliberately
small: a successful mesh export does not itself verify appearance in the Hall.

## Source and delivery

Keep the editable `.blend` in a dedicated `models/<slug>/` directory, with a
README recording Blender version, chosen public credit, source permissions and
the exact export command. Keep render evidence under ignored `evidence/`.
Do not put authoring files under `assets/` or `src/`: the public build copies
those directories. The app and ordinary build must not require Blender.

The offline exporter writes a classic-script builder using the existing
`Builder.vertex` API. The generated file belongs in `src/scenery/` only when
ready for exhibit integration. Register it through the normal
[Hall recipe](grandhall.md), preserving deferred loading, placement, credits,
portable export and scene-owned GPU disposal. The `.blend` remains the editable
source; do not hand-edit generated vertices.

## Current export contract

- Put export objects in the `EXPORT` collection. Cameras and render lights
  belong in a separate collection. Render-hidden objects are omitted.
- Meshes, curves, surfaces and text are evaluated to triangles. Modifiers remain
  editable in the source. Plain empty parents are allowed; instance objects,
  constraints and mesh shape keys are rejected. Animation requires an explicit
  `--frame N` to export a still snapshot; it is rejected by default.
- Each face needs a material with an integer custom property named
  `whistlevale_material`: one of `0, 4, 5, 6, 8, 10, 22, 23, 41, 76`.
  See the [geometry reference](geometry.md) for their meanings.
- Material viewport diffuse color supplies tint. The exporter converts linear
  RGB to sRGB for the existing renderer. Shader nodes, image textures, lighting,
  alpha and Blender's rendering effects are not transferred. Use material `76`
  for architectural glass and `10` for luminous lamp surfaces, then check their
  actual appearance in the Hall. UV coordinates alone do not add texture support.
- Blender coordinates `(x,y,z)` become `(x,z,-y)`. World transforms are evaluated;
  inverse-transpose normals and mirrored winding are preserved. Model around the
  local origin and let the Hall adapter ground and place the complete work.
- This initial bridge exports a static snapshot. Realize generated instances
  before export. It is not a general glTF importer or an animation exporter.

Run from the repository root, substituting the actual model and function name:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background models/example/source.blend \
  --python-exit-code 1 --python scripts/blender-export.py -- \
  --collection EXPORT --name exampleModel --max-vertices 60000 \
  --output evidence/example/model.js
```

On other systems use the installed Blender executable. The example input is a
placeholder, not a checked-in asset. A neighboring `.report.json` records bounds,
per-object counts, buffer size and the generated script hash. Export order is
deterministic for a fixed evaluated scene and Blender version.

The 60,000-vertex default is a provisional per-export ceiling, not a new Hall
allowance. Measure the combined exhibit catalogue against the existing shared
300,000-vertex budget. Never raise an existing budget to accommodate a model.

## Night Post outcome and remaining motion work

The editable model, authoring recipe and hashed export report live in
[`models/night-post/`](../../models/night-post/README.md). The model was created
with Blender's native Python API after desktop UI input proved unavailable.
It carries the contributor's chosen `nickfromlater` credit. It was not modeled
manually through the interface.

The Hall uses its existing static geometry pipeline. The `.blend` includes a
train circuit, clock hand and letter motion study, while the Hall shows frame 1.
Visitor-triggered departures, changing tunnel worlds and letter-following are
future interaction work, not features provided by this exporter. If that work
requires a major renderer change, follow the repository's proposal process.

The generated script uses a material palette and indexed complete corner
attributes to reduce source size, preserving normals, UV seams and material
boundaries. It emits ordinary, non-indexed `Builder` vertices at gallery build
time and retains no custom GPU resources or large global geometry cache.

## Bridge verification so far

On Blender 5.1.1, a disposable 684-vertex fixture verified evaluated bevels,
smooth normals, mirrored winding, axis conversion, color conversion, identical
output on repeated export, nested builder transforms, and identical vertex
output through the House and Hall APIs. Invalid material and budget rejection
were exercised. This is a technical fixture, not Night Post artwork or visual QA.

Relevant Blender references: [glTF export and its material limitations](https://docs.blender.org/manual/en/5.1/addons/import_export/scene_gltf2.html)
and [mesh triangles and corner normals](https://docs.blender.org/api/5.0/bpy.types.Mesh.html).
