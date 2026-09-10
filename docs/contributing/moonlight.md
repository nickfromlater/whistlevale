# Moonlight Drive-In

Moonlight is one original miniature by [nickfromlater](https://x.com/nickfromlater),
with homes in **LW-04** and Alder Valley's lakeside meadow. Start with the
[Hall recipe](grandhall.md) or [building recipe](buildings.md) before adapting it.

The port follows the author's standalone Moonlight Drive-In, published version
3, source commit `fc734f64f060d47f63312cec4f5b8a1d9e494c06`.
[`src/scenery/moonlight-drive-in.js`](../../src/scenery/moonlight-drive-in.js)
retains its procedural layout, 13 enamel cars, 25 tiny spectators, projection
house, diner, picnic furniture, bicycle, speaker poles and planted perimeter.
Small primitives use fewer segments and buried rod caps are omitted. Temporary
groups emit native `Builder` triangles and are released after construction;
there is no Three.js dependency, separate scene loop or file-load geometry cache.
Fixed signs use native lettering; the visitor nameplate has its own small
texture. This model requires no illustration-atlas slots.

## Two homes, one model

`moonlightDriveIn(b,x,y,z,angle,{landscape:false})` builds the Hall version with
its timber display base. The [Hall registry](../../src/grandhall-exhibits.js)
scales it by **0.096** and aligns its lowest vertex with LW-04's display surface.
Its source is deferred until needed; it does not add a full-model Hall map preview.

Alder Valley's editable `moonlight` asset calls the same builder with
`{landscape:true}` at a native scale of **0.32**. This replaces the timber plinth
with a shallow earth edge; the native bottom is −0.25, turf top 0.36 and lot top
0.44. Placement, orientation and creator credit live in
[`contributions/world.json`](../../contributions/world.json). Use the normal
editor to move, rotate or resize it. Its **Views → Places** camera and the Hall's
railway link follow the actual saved placement. A removed model has no invented
destination. The projected face looks toward the default desktop and phone
arrival cameras. Its short gravel lane connects the old town’s street to the
rear asphalt through the screen’s open, raised span. The placement preserves
every house and track, clearing 28 uncredited trees and
one café table group while keeping the miniature’s 18 authored trees.
Preserve the shared contribution ID, source path and original
[public credit](attribution.md) across both locations and portable exports.

The current port emits **268,104 vertices in the Hall** and **266,610 in Alder
Valley**, before the editor's placement transform. Those figures include all
props. The shared Hall allowance and railway contribution ceiling still apply;
do not change them to conceal an oversized revision.

## Picture and verification

The single screen uses material **83**, facing native +Z with UVs 0–1.
Three feathered transparent sheets use material **84** for soft, slowly shifting,
film-lit haze (18 vertices). UV X crosses a sheet and UV Y runs from the actual
lens toward the screen. The shared projection controller also draws **3,600
film-lit dust motes** with the reference's soft flecks, flutter and directional
scattering. Their native positions follow the actual Hall/Valley transform;
GPU currents animate one static **86,400-byte** seed buffer with one depth-tested,
additive draw per nearby theater. Bright picture areas illuminate the dust;
dark areas let it disappear. No CPU particle updates or extra animation loop.

[`src/moonlight-projection.js`](../../src/moonlight-projection.js) owns the dust
resources, shared silent texture and playback lifecycle. Dust is allocated only
for a nearby visible exhibit, omitted from distant/map views, stationary with
reduced motion, and frozen when playback is paused. Context loss and disposal
release its resources. The supplied film and poster are retained
unchanged; two small railway shorts give the programme three choices. Only the
selected picture is decoded. See [media attribution and provenance](../../assets/moonlight/README.md).

Material **85** is the booth's 650 × 120 nameplate texture on a native 2.6 × 0.48
plaque, facing +Z with upright UVs 0–1. **At the drive-in →
Put your name on the booth** lets visitors become tonight's projectionist; the
canvas redraws only after a name changes. Names stay on that device and are
excluded from playable exports and artwork attribution. Emptying the name
restores the original sign. Keep input normalization, storage-failure handling,
Unicode support and text-only DOM updates intact.

In Alder Valley, click the actual miniature to approach it, or use **Views →
Places → Moonlight Drive-In**. Its compact **Now showing** control opens the
programme; **Look at the booth** frames the visitor nameplate. Drag, pinch,
cinema and building mode retain their normal controls.

Run the focused checks during iteration, then the normal contribution checks:

```sh
node scripts/moonlight-model-qa.mjs
node scripts/moonlight-valley-qa.mjs
node scripts/moonlight-media-qa.mjs
node scripts/moonlight-click-qa.mjs
npm run check:contributions -- --json
npm test
npm run test:geometry:full
```

With `npm run dev`, inspect `/grandhall.html?bay=LW-04` and
`/index.html?room=valley&work=moonlight-drive-in&placement=0`. Check daytime and
nighttime, desktop and 390px/320px widths, the map, neighboring displays and
train clearance. Verify the picture is upright and legible, Play/Pause works,
hidden tabs and inactive rooms stop playback, and reduced motion starts with a
still picture. Test save/import and a playable export with the media available
offline. The geometry checks cannot establish visual quality or physical-phone
performance; record which browser and device checks were actually completed.
