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

The native room is a tennis pavilion with green walls, walnut paneling,
parquet, brass picture lights, wire-strung racquets, a glazed trophy cabinet,
court drawings, banker lamp, cutting mat, paint pots, rolled plans, ferns,
leather bench and a cup left beside a programme. The model's wooden board sits
on a native turned-leg table. A low relief stadium and railway plan remain on
the live map while the guest renderer is absent.

## Explore

- **Explore the miniature** frames the complete tabletop.
- **Pause train** stops both railways, traffic and model animation. Reduced
  motion starts paused. Global pause remains effective too.
- **At the stadium** opens roof and final-point controls. The imagined point
  moves the camera courtside, lifts the roof, animates a rally and celebration,
  and updates the miniature scoreboard. Scores are not live.
- **Views → Places** includes the stadium, station, racquet collection,
  maker's bench and attribution plaque.
- **Cinema** offers Arthur Ashe, At the station, A little Queens and Follow
  the 7. House drag, pinch, keyboard framing and manual/automatic controls remain.
- House atmosphere controls govern day/night lighting. The pavilion is an
  indoor model; outdoor rain is not added to its tabletop. House music and mute
  remain in control; the standalone's separate audio engine is not loaded.

## Integration and limits

Native room: `src/rooms/queens.js`. Reviewed adapter: `src/guest-queens.js`.
Original snapshot, adapted builders, pinned renderer and licences:
`vendor/queens-miniature/`. [Source and presentation changes](../../vendor/queens-miniature/SOURCE.md).

The existing guest framework imports the renderer only on room entry. It
transforms the house camera into model space, copies opaque native depth once,
and follows native wall cutaways. There is no iframe. Scene resources and the
guest WebGL context are released on leaving, cancelling or opening the map.
Re-entry builds a fresh scene. The house owns the single animation schedule.

The two renderers share projected depth, but cannot exchange shadows or glass
reflections. The house's fullscreen lens effect does not process the guest
canvas. Portable HTML retains the furnished room, low relief map model,
attribution and source links; the detailed guest module is available in the
online house, following the existing Yamaai export behavior. The original
standalone HTML remains a separate self-contained artifact.

This is a handcrafted interpretation. The court uses regulation proportions,
but the seating count, cutaway roof, rail curves and condensed neighbourhood
serve the tabletop composition rather than survey accuracy. There is no live
score service or official association.

## Review

Run `npm test`, `npm run test:geometry:full`,
`npm run check:contributions -- --json` and `npm run test:queens`.
The focused check covers room geometry and footprint, attribution atlas slots,
camera/depth equivalence, original model counts, closed rail curves, station
stopping, pause, roof and match choreography, and pinned source identity.

Browser screenshots, export files and measured reports belong in ignored
`evidence/queens-pavilion/`. A resized Chromium viewport is not a physical
iPhone test. Review the PR for the actual checks completed and measurements.
