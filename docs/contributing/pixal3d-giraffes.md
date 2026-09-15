# From Pixal3D to an animated safari character

This records the giraffe workflow used for Whistlevale. Pixal3D supplied a
textured surface; Blender supplied cleanup, anatomy alignment, weights and the
walk. The native renderer supplies lighting, shadows and terrain adaptation.
The editable deliverable is [the Blender character](../../models/safari-giraffe/README.md).

## 1. Generate an isolated reference

Keep the actual safari screenshot and desired composition as separate review
references. Generate a full-body giraffe image with separated legs, visible
hooves, ears and tail, and a clean background. A scene screenshot is poor input
for reconstructing one animal. The reference here was generated with OpenAI
image generation; it was not copied from a photographer or asset marketplace.

## 2. Generate the surface in Pixal3D

Use the [official Space](https://huggingface.co/spaces/TencentARC/Pixal3D).
This run used seed **42**, resolution **1536**, manual field of view **0.2 radians**,
and the default guidance with **12 steps**. Save the latent state as well as the
preview: it lets extraction resume without repeating generation.

Recorded upstream revisions:

- Space: `40a1519aadf70a82110a500997c19b626668a144`.
- [Pixal3D-T](https://huggingface.co/TencentARC/Pixal3D-T):
  `b0cb2e1b794cab9aa0ac38a95d794a4d9337437f` (MIT).
- Saved latent SHA-256:
  `b9d5deea5934a079a5b934e38e4a85427a11d99c144c95e9e96b1086e7da484a`.

The Space generated the surface but rejected its 240-second extraction request
under the available quota, even after sign-in. The alternative official servers
were offline. Repeated generation would not have solved that extraction limit.

## 3. Extract once on a bounded GPU job

A dedicated Hugging Face H200 job decoded the saved shape and texture latents.
Only the two decoders were loaded; generation models and camera estimation were
unnecessary. The environment used Python 3.10, CUDA 12.8.1, PyTorch SDPA and the
Space's native export libraries. Extraction used **18,000 target triangles**,
**4096px texture**, remeshing enabled, band 1 and projection 0, followed by the
Space's coordinate rotation and GLB export with embedded WebP images.

Three short A100 attempts exposed dependency/index conflicts and a vendor
FlexGEMM wheel lacking a compatible kernel. The supplied wheel worked on H200.
Do not assume a GPU is compatible just because the upstream source supports it.
Pin a resolved environment and confirm the installed binary's architecture.

The successful raw GLB was 5,310,736 bytes, with SHA-256
`34fb1e8ee10570540e5cd46878f84b6656a5c87e08c51c6feabfac902f1c0250`.
It is archived privately; the checked-in Blender source contains everything
needed for subsequent editing and export.

### Cost control

The user authorized a **$20 total ceiling**. Every job had an explicit timeout;
all four jobs stopped. Recorded running times were 24, 21 and 90 seconds on
A100 at $2.50/hour, then 159 seconds on H200 at $5/hour. Running-time compute is
**approximately $0.32 before rounding, minimum charges or other billing items**.
This is an estimate, not a verified invoice or a promise of current pricing.
No recurring subscription was purchased. Local Blender work uses no paid GPU.

## 4. Clean and rig in Blender

The raw reconstruction was not animation-ready. It had a diagonal orientation,
asymmetric walking legs, duplicated UV-boundary vertices, detached pale
fragments and uneven surface details. The authoring script:

1. Aligns and scales the animal, preserves UV loops, welds duplicate geometry,
   removes detached fragments and gently smooths the surface.
2. Establishes a neutral stance and anatomical tint for dark details while
   keeping the generated coat packed in the file.
3. Builds an 18-bone armature, assigns normalized skin weights and uses linear
   blend skinning to match the browser shader.
4. Authors a 49-frame looping walk from solved foot paths. The saved timeline
   remains editable independently of the browser.

Inspect the saved file, not just a script claiming to create a rig. Independent
inspection found normalized weights on every skin vertex, up to three bone
influences per vertex, packed coat imagery and actual local mesh deformation
across sampled animation frames.

## 5. Export to Whistlevale's renderer

The [export recipe](../../models/safari-giraffe/README.md#export-edits) packs an
indexed surface, weights, bone hierarchy, inverse bind matrices and sampled
local bone transforms into a classic script. The full source texture stays in
Blender; delivery uses a shared embedded 2048px JPEG with mipmaps.

Material 90 enables skinning in both native color and shadow shaders. Other
materials retain their existing path. Three animals share the immutable skin;
only their root transforms and small bone palettes change each frame. Runtime
leg solving adapts the authored stride to the actual terrain. A later motion
pass replaced the 130-second miniature orbit with a 32-second walking and
browsing cycle. Stance corrections ramp smoothly in and out; dropping a foot
anchor abruptly had produced visible toe-off jumps. Actual deformed muzzle
positions are checked against the leaf targets, including the calf-height crown. Simulation owns
the clock so extra shadow/map drawing cannot advance animation.

## 6. Verify the result

Run the repository checks and review the live scene at desktop, 390px and 320px.
Check motion, resting feet, body deformation, shadows, pause, reduced motion,
room switching, the live map and a reopened portable export. A still image
cannot prove a good walk, and resizing a desktop browser is not a phone test.

`scripts/safari-giraffe-qa.mjs` checks source/export hashes, finite data,
normalized weights, bone limits, actual weighted sole clearance over two roaming
circuits, shared render passes, reduced motion and resource cleanup. The
60,000-expanded-vertex and hoof-lift limits were preserved; a discovered raised
foot was fixed with individual terrain adaptation instead of relaxing a limit.

Local generation records, cost ledger, raw/source inspections and check reports
are kept in ignored `evidence/safari-giraffes/pixal3d/`. Those records contain no
authentication tokens. Do not commit credentials or make runtime code depend on
a private model repository or a paid generation service.
