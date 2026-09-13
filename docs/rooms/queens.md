# The Queens Pavilion

Open `index.html?room=queens` or choose **The Queens Pavilion** on the house map.
The room occupies **east-5**, leaving west-4 available for the proposed Bronx
Gallery. [Proposal #36](https://github.com/nickfromlater/whistlevale/issues/36)
records the maintainer's requested room and scope.

**A little Queens**, by nickfromlater with agent assistance, is the original
US Open tabletop model. Arthur Ashe Stadium sits within a complete railway
world: two running circuits, six silver 7-line cars, a four-car local,
Mets–Willets Point station, Queens shops, parks, practice courts, globe fountain,
creek, boats, footbridge, railway bridges and a tunnel. The stadium retains
8,198 individually painted chairs and its miniature audience.

The facade has a continuous opaque concourse behind the glazing, closed
balcony undersides and a complete roof canopy with bound edges. The court has
crisp painted lines, net collars and winders, spare wire-strung racquets,
stitched bags, bottles, folded towels, wheeled ball baskets, a scoring console,
broadcast cameras and small courtside planters.

The **Stadium seat** camera sits inside the bowl, looking across both players
to the far scoreboard. Narrow screens use a higher club-level seat and a wider
lens so both baselines remain visible. The two painted figures have caps,
collars, wristbands, articulated legs, laced shoes and wire-strung racquets.
They bend their knees, split-step, prepare a forehand or backhand, plant for
contact and recover toward the centre. Twelve deterministic exhibition rallies
vary direction and length, with alternating servers, an overhead toss, ballistic
flight, elastic bounces and a brief landing mark. Motion is sampled from elapsed
time, with moving contact shadows and a restrained ball trail.

Both physical scoreboards show **Alexander Zverev vs. Ben Shelton**, the real
US Open men's final on **13 September 2026**, scheduled for **2 p.m. Eastern**.
The reviewed host adapter reads ESPN's public score feed: five set columns,
tiebreak superscripts, game points and service indicators when explicitly
provided, and the final winner. Missing scores remain dashes. The board and
accessible control-tray readout identify the source and last successful check.
The on-court exhibition is independent of real match events and never changes
these scores.

The native room is a tennis pavilion with green walls, walnut paneling,
parquet, brass picture lights, wire-strung racquets, a glazed trophy cabinet,
court drawings, banker lamp, cutting mat, paint pots, rolled plans, ferns,
leather bench and a cup left beside a programme. The model's wooden board sits
on a native turned-leg table. A low relief stadium and railway plan remain on
the live map while the guest renderer is absent.

## Explore

- **Miniature controls** opens the compact control tray. The owner requested
  no visible attribution card for this room; the source and licence records
  remain attached to the work. The wall inscription names the model and place.
- **Explore the miniature** frames the complete tabletop.
- **Take a seat** enters Stadium seat, replaces a lifted roof and starts a
  varied exhibition rallies. **Pause match** freezes the players, ball and
  trains; **Resume match** continues. The real score feed keeps refreshing
  while animation is paused. Changing to another cinema view or leaving
  cinema ends the exhibition. The normal Cinema entry respects reduced-motion
  pause; Take a seat is an explicit request to start watching.
- **Pause train** stops both railways, traffic and model animation. Reduced
  motion starts paused. Global pause remains effective too.
- **Lift stadium roof** and **Play final point** are in the same tray. The imagined point
  moves the camera courtside, lifts the roof, animates a rally and celebration,
  while the board continues showing the real final. The celebration belongs
  only to this imagined point.
- **Views → Places** includes the stadium, station, racquet collection,
  maker's bench and pavilion inscription.
- **Cinema** offers Stadium seat, At the station, A little Queens and Follow
  the 7. House drag, pinch, keyboard framing and manual/automatic controls remain.
  Manual stadium framing keeps the court as its anchor and preserves the seated
  lens; it does not start following the passing train.
- House atmosphere controls govern day/night lighting. The pavilion is an
  indoor model; outdoor rain is not added to its tabletop. House music and mute
  remain in control; the standalone's separate audio engine is not loaded.

## Integration and limits

Native room: `src/rooms/queens.js`. Reviewed adapter: `src/guest-queens.js`.
Score-feed parsing and lifecycle: `src/queens-scores.js`.
Original snapshot, adapted builders, exhibition motion, pinned renderer and licences:
`vendor/queens-miniature/`. [Source and presentation changes](../../vendor/queens-miniature/SOURCE.md).

The existing guest framework imports the renderer only on room entry. It
transforms the house camera into model space, copies opaque native depth once,
and follows native wall cutaways. There is no iframe. Scene resources and the
guest WebGL context are released on leaving, cancelling or opening the map.
Re-entry builds a fresh scene. The house owns the single animation schedule.

The two renderers share projected depth, but cannot exchange shadows or glass
reflections. The house's fullscreen lens effect does not process the guest
canvas. Portable HTML retains the furnished room, low relief map model,
source credit records; the detailed guest module is available in the
online house, following the existing Yamaai export behavior. The original
standalone HTML remains a separate self-contained artifact.

This is a handcrafted interpretation. The court uses regulation proportions,
but the seating count, lifting roof, rail curves and condensed neighbourhood
serve the tabletop composition rather than survey accuracy. There is no
official association.

The match remains pinned to this dated final, including its eventual result.
Scores refresh every minute during play and near the scheduled start, every five
minutes before then, and every fifteen minutes after completion. Hidden tabs
suspend requests; room exit aborts outstanding work and prevents late updates.
The public ESPN endpoint requires no credentials but is not a contracted service.
An outage preserves the last verified score with a delayed label. On a first-load
outage, the dated scheduled matchup remains visible with scores unavailable.
There is no fabricated score, real video stream or reconstruction of live shots.

## Review

Run `npm test`, `npm run test:geometry:full`,
`npm run check:contributions -- --json` and `npm run test:queens`.
The focused check covers room geometry and footprint, attribution atlas slots,
camera/depth equivalence, opaque facade and roof continuity from both sides,
51 spectator framing/architectural sightline samples at desktop, 390px and
320px, 88 actual racquet/ball contacts and net crossings across twelve rallies,
valid service boxes, frame-rate independence and frozen player poses, original model
counts, closed rail curves, station stopping, pause, roof and match choreography,
and pinned source identity. Score-feed QA covers the observed
scheduled fixture, controlled live/final/tiebreak cases, wrong-match rejection,
refresh cadence, stale/offline handling, suspension and disposal.
Guest geometry is 41.07 MiB under its 55 MiB budget;
the native room remains 192,087 vertices including all walls.

Browser screenshots, export files and measured reports belong in ignored
`evidence/queens-live-match/`. A resized Chromium viewport is not a physical
iPhone test. Review the PR for the actual checks completed and measurements.
