# Enhancement validation

Validated in the browser at 1280 × 720 and 390 × 844, with Three.js revision 185.

- 21 loaded ES modules; 52 resolved import references; all dependencies vendored.
- 201 constructed meshes checked for finite geometry attributes.
- 36 unobstructed terrain/portal rays through the tunnel mouths.
- Gorge rock remains outside the train loading envelope, including beneath the bridge.
- Farmhouse footprint remains 4.879 m from the railway centreline; foundation follows the modified terrain.
- Courtyard support checks passed for the barrel, planter, watering can, both bicycle wheels and fence.
- 250 seconds of simulated train movement, including three station stops and pause verification.
- Vegetation and ballast detail levels respond to camera distance.
- Browser shader compilation and console checks were clear.
- Day, evening, rain and night modes inspected, including moving practical light, moon, river and cascade.
- Eighteen captured frames per night/rain transition showed a smooth brightness progression without a whole-viewport flash.
- Authored tunnel, station, shrine, gorge and cascade views inspected. Event timing checked through tunnel emergence and station arrival; excessively high camera travel was corrected.
- Desktop dragging and portrait resizing checked. Canvas matches the viewport; no horizontal overflow. Temporary viewport overrides were reset.
- Compact interface checked at 390 × 844: the open panel is 236 × 159 pixels, with all twelve camera views accessible. Slider keyboard input, view selection, automatic dismissal, Escape and keyboard pause passed. Fresh-load browser error/warning logs were empty.
- Autumn pass: inspected day, evening, rain and night, plus the station close view. Maple groves use four spatially grouped palettes; evergreen crests, riverbank moss and bamboo retain green. The 54 drifting leaves share one mesh and receive scene lighting. Browser shader/error logs were empty; the existing geometry, grounding, service and LOD checks passed again.
- Cinematic pass (v2.2): the default hero view was re-composed — the train reads instantly on the bridge, the deck leads into cascade and tunnel portal, and the station remains visible at the frame edge. All four modes re-inspected from the new hero: day keeps distinct sun and shade; evening adds warm crowns, rail glints and horizon warmth; rain shows the strongest warm-cool contrast with glowing cabin windows and lantern islands; night keeps deep blacks with silhouetted ridges and tightly controlled warm points. First load settles into the hero frame with a single short push-in before full control. Headless captures report ~580 draw calls and ~2.9 M triangles at the hero frame (SwiftShader software rendering; fps/gpu timers unavailable there) — within the envelope of the previous wide hero framing. Vegetation population is unchanged to slightly reduced (234 close trees); instancing, LOD, adaptive pixel density, reflection throttling, sun/headlight shadow throttling and the quarter-resolution bloom chain are untouched. No new render passes, shadow maps, runtime assets or dependencies were added; `npm test` passes with the same module/import counts.

Observed steady views generally reached 60 fps on the test browser. Moving-camera measurements ranged approximately 40–60 fps, including screenshot capture overhead. These are observations on one browser, not a hardware-independent performance guarantee.

Run `npm test` for repeatable geometry/service/import regressions. Run `npm run build` to regenerate `dist/` and the content manifest. The local preview and downloadable source share the same `build-manifest.json` asset hashes.
