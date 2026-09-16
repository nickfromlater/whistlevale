# From a reference image to roaming safari animals

The safari characters use Pixal3D surfaces, Blender armatures and the house's
native WebGL renderer. Generation is an authoring step. Visitors need no model
service, account, library or API key.

## 1. Make a reference that can become a mesh

Use an isolated, full-body animal on a plain background, with all four legs
separated and no cropped ears, tail or feet. A near-profile three-quarter view
shows both the silhouette and body depth. Check the image before spending on
reconstruction: fused legs or hidden joints make later weighting harder.

The zebra and elephant references were generated with `gpt-image-1.5` at
1536 × 1024, then processed by the official Pixal3D Space. Each character's
`reference.png` is the actual processed reconstruction input, rather than an
illustration of the intended result.

## 2. Reconstruct once and keep the result

The companion models used TencentARC/Pixal3D Space revision
`40a1519aadf70a82110a500997c19b626668a144` and Pixal3D-T revision
`b0cb2e1b794cab9aa0ac38a95d794a4d9337437f`: seed 42, resolution 1536,
12 sampling steps, 49,152 maximum tokens, an 18,000-triangle export target and
a 4096px coat. Archive the generated latent, original GLB, input hash and receipt
before moving on. Re-rigging should never require paying to regenerate a mesh.

The public Space's quota and downloadable-file route were unreliable during
this run, so generation ran in a bounded Hugging Face H200 job. The first job
failed because full generation enters a sparse-attention path absent from the
earlier decoder-only giraffe workflow. The working environment used PyTorch
2.8/CUDA 12.8, SDPA for dense attention and the vendor Flash Attention 3 wheel
for sparse attention. Sparse attention does not support an `sdpa` setting in
this revision. Run a small CUDA sparse-attention check before downloading
weights or launching generation; check both packed and cross-attention paths.

Each job had a 30-minute hard timeout. Both jobs are stopped. Their combined
761 seconds of provider-reported compute cost approximately $1.06 at $5/hour,
or $1.17 when each run is rounded up to a whole minute. The two reference-image
outputs added approximately $0.40 plus input tokens. These are estimates, not
an invoice; queue time is recorded separately. The cumulative authoring budget
also included the earlier giraffe and music work and remained below the user's
$20 cap.

## 3. Author the real surface in Blender

Inspect side, front and top views of the imported GLB. Align the animal to +X
with Z up, establish its size, and place landmarks on the actual shoulders,
hips, joints, feet, neck and face. For the elephant, also trace the trunk's
centerline. Preserve the coat UVs while welding duplicates, removing small
detached fragments and reducing the mesh to the renderer's budget.

Weight the continuous mesh to anatomical bones, keeping at most four normalized
influences per vertex. The zebra has 19 bones, including two neck segments; the elephant has 23, including
six trunk segments. Both fit the existing 24-bone palette. Check extreme poses,
not just the rest pose: shoulder bends, grazing neck, trunk curl and lifted feet
reveal misplaced joints and weight seams.

Author a four-beat walk and a separate grazing or foraging action. Stance should
occupy most of each foot's cycle; a hoof should release before it swings forward.
Keep both actions editable in the saved Blender file. Pack the original coat
so the source remains usable independently of generation caches.

## 4. Integrate movement and behavior

The [companion exporter](../../models/safari-companions/README.md) samples the
saved actions and writes a classic JavaScript asset with vertices, weights,
bones, inverse bind matrices and an embedded 2048px delivery coat. Export
receipts connect the original GLB, input, landmarks, authoring script, Blender
file and runtime asset by SHA-256 hashes.

Use distance traveled to advance the walk cycle. Blend into feeding only after
the animal slows to a stop. Terrain-aware leg solves and stance anchors adapt
the animation to the actual landscape. Keep one mesh and coat per species,
with independent poses for each animal. The room, map and shadow passes must
consume the same pose without advancing animation time. The existing clock
handles pause and reduced motion, and scene disposal releases shared meshes.

## 5. Verify the result in the exhibit

The independent companion check skins the exported vertices, measures actual
sole contact, and checks complete-surface clearance from tracks, riverbanks and
paths across full behavior cycles. It also checks weights, finite poses, motion
continuity, pause, matching color/shadow poses and resource disposal. Preserve
the existing geometry and contact limits when fixing failures.

Run `npm test`, `npm run test:geometry:full` and
`npm run check:contributions -- --json`. Then inspect the running app: walk and
feed cycles, daylight and night, close and room views, desktop and narrow
viewports, the live house map and portable export. Look for sliding feet,
rubbery joints, grazing above the grass, trunk intersections and detached
shadows. Automated checks cannot judge those qualities alone. Record physical
device checks separately from resized desktop-browser captures.

Keep screenshots and diagnostic logs in ignored `evidence/`; commit editable
sources, export receipts, native runtime assets and the process recipe. Push
the reviewed changes to the existing contribution branch and leave merging to
the maintainer.
