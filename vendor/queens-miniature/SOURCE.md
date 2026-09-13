# A little Queens

Original miniature by **nickfromlater**, with agent assistance. The maintainer
requested its Whistlevale room on 13 September 2026; scope is recorded in
[proposal #36](https://github.com/nickfromlater/whistlevale/issues/36).

This was authored in the same creation session, not fetched from a third-party
miniature repository. There is no external upstream commit to invent.
`original-model.js` is the unchanged JavaScript from the approved standalone
`us-open-tabletop-world.html`. It is retained as a source snapshot, never loaded
by the room. Its SHA-256 is:

```
9068666955859b62f98eae97afbf108830d24dfa3e0597ef524c78f91f2c478d
```

`model.js` is the explicit host adaptation. The builders, original deterministic
seed, textures, seat counts, neighbourhood, routes and stock are retained.
The original fixed ball path is replaced by explicit exhibition choreography. Presentation changes:

- An asynchronous factory yields between eight actual construction stages.
- The house owns camera, rendering cadence, input, lighting state and audio.
  Standalone UI, sound, timers and animation loop are removed.
- The standalone background floor, shadow plane and postprocessing are removed.
  A native walnut gallery table replaces the source's legs and stretchers.
- Geometry remains in original coordinates. A uniform `.49` transform places
  it in the house, with its board underside resting at `y=-11.14`.
- Animated flags and water rings stay outside static mesh consolidation.
  Removed source geometries are disposed after consolidation. Static wirework
  is consolidated by identical appearance into disconnected line segments,
  retaining every original segment while reducing draw calls.
- Exact vertex indexing preserves all Float32 positions, normals and UVs while
  reducing GPU geometry memory. No seat, person, triangle or texture is removed.
- Guest shadows are limited to 2048 pixels, or 1536 on narrow viewports. A
  separate native depth pass preserves room and furniture occlusion.
- The roof and imagined final point are driven through an explicit model API.
- The facade now has an opaque concourse shell behind its glazing, closed
  balcony undersides and wider window panels. The canopy's missing sector is
  filled and its edges are bound; the roof still lifts through the same API.
- Added painted court lines, wear marks, net hardware, spare racquets,
  stitched bags, bottles, towels, ball baskets, cameras, courtside clocks,
  planters and umpire details. Original crowd/seat counts remain unchanged.
- At the owner's request, Queens omits its visible attribution card and
  authorship text on the wall inscription. Controls fold into one compact tray.
  The original source and licence records are retained.
- Added a seated stadium camera through the house cinema API, with a wider
  club-level view on portrait screens and a court anchor for manual framing.
- Enlarged both physical scoreboards and their type. Added more detailed
  articulated players, caps, wristbands, shoes and racquets; their footwork and
  swings meet each ball contact. Exhibition play runs while the visitor watches
  from the Stadium seat view. Pause, scheduling and audio remain house-owned.
- `tennis.js` now supplies twelve varied rallies with alternating servers,
  tosses, ballistic flight and elastic bounces. Jointed knees, planted shots,
  recovery steps, torso turns, moving contact shadows, smaller time-sampled
  trails and landing marks refine the original figures.
- The host supplies the real 13 September 2026 men's final from ESPN through
  `src/queens-scores.js`. Five set columns, tiebreaks, available game points and
  final winner replace the imagined score. Source, freshness, offline status and
  the distinction between real scores and exhibition motion remain visible.
  No networking, timers or listeners are added to the guest model.

`three.module.min.js` is the unchanged ES-module build of **Three.js 0.160.1**,
from `https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.min.js`.
SHA-256:

```
3e690ac7d180b0aadf0891bea39eec643e29e2d3e75c99b18689518665f69ba6
```

The miniature and its adaptation use `LICENSE`; Three.js retains `THREE-LICENSE`.
No font binaries, photographs, credentials or audio recordings are included.
Score data is fetched at runtime from ESPN's public ATP scoreboard endpoint,
[dated 13 September 2026](https://site.api.espn.com/apis/site/v2/sports/tennis/atp/scoreboard?dates=20260913),
selecting US Open event `189-2026`, men's final `182677`. The
[official match preview](https://www.usopen.org/en_US/news/articles/2026-09-12/2026_us_open_mens_final_breakdown.html)
also identifies Zverev and Shelton. The scheduled test fixture is a minimal
excerpt of the public feed observed before play; synthetic live/final test cases
are labelled as fixtures and are never shipped as match results. Stadium signage identifies the subject; this is an independent
modelmaking interpretation, not an official US Open product.
