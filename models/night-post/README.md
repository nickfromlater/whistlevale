# The Night Post

An original Blender-authored miniature for **nickfromlater**, created with Codex
assistance. Code and artwork: MIT, as licensed by the repository. No downloaded
models, image textures, fonts, recordings or third-party artwork are used.
Lettering uses Blender's built-in Bfont.

Open **night-post.blend** in Blender 5.1.1 or later. The editable file contains
named meshes, curves, text, bevel modifiers, materials and a separate render
studio. Its `EXPORT` collection holds the exhibit; its `STUDIO` collection holds
the camera, lights and photographic floor. The studio is hidden in the saved
viewport and excluded from the Hall export.

The model was authored through Blender's Python API after desktop click and
keyboard control failed. `build-source.py` records that authoring process; the
work was not manually modeled through the interface. The `.blend` can be edited
independently of the recipe. Re-running the recipe **overwrites that source**;
exporting the existing file does not.

## What is built

- An open station under a blue-glass barrel vault, brass roof ribs, corner
  towers, suspended lanterns, a large clock and a miniature celestial mechanism.
- A sorting office with filled pigeonholes, folded and sealed envelopes, a
  spiral mail slide, roller conveyor, dispatch desk, parcels and mail sacks.
- A burgundy locomotive and two postal coaches on a continuous rounded circuit.
- Three circular destination dioramas: **Yesterday** (autumn trees and a bridge),
  **The Moon** (craters, observatory and postal pennant), and **Home Again** (a
  lamplit kitchen window, red door, flowers and rain).

The Blender timeline includes a train circuit, a clock hand and a letter on the
conveyor. These are motion studies. The **Hall exhibit is a static frame-1
export**: visitor-triggered departures, changing portals and letter-following
are not implemented in the app. The train study does not yet articulate bogies,
animate wheels or enforce coupling lengths around corners.

## Export the current editable file

From the repository root on this Mac:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background models/night-post/night-post.blend \
  --python-exit-code 1 --python scripts/blender-export.py -- \
  --collection EXPORT --name nightPost --frame 1 --max-vertices 60000 \
  --output src/scenery/night-post.js
mv src/scenery/night-post.report.json models/night-post/export-report.json
node scripts/night-post-qa.mjs
```

On another system substitute its Blender executable. `--frame 1` explicitly
requests a still snapshot, so animated objects are not silently flattened.
The report ties the generated script to the `.blend` SHA-256 and records the
geometry, source size and individual object counts. No Blender installation is
needed to run, test or build Whistlevale; Blender is only an authoring tool.

The generated script is indexed to reduce repeated corner data, but the runtime
still emits ordinary Whistlevale vertices. No new renderer or runtime loader is
required. The existing Hall loader requests it only when Little Worlds is needed,
and playable exports embed it. Do not edit generated vertices by hand.

## Rebuild the original recipe and studio render

Only after preserving any edits to the `.blend`:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 \
  --python models/night-post/build-source.py -- --render
```

The recipe writes the `.blend` and a studio image to ignored
`evidence/night-post/night-post-hero.png`. Re-export afterward. It never runs in
the website, ordinary build, or test sequence.

The Hall placement is **LW-01** in Little Worlds, with uniform scale `.245`.
Its chosen camera includes the whole miniature at 390px and 320px widths.
Physical phone performance and touch input still require a real-device review.

See [the Blender bridge guide](../../docs/contributing/blender.md) and
[the Hall contribution recipe](../../docs/contributing/grandhall.md).
