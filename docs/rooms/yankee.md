# The Bronx Gallery

Open **The Bronx Gallery** in the house directory, select **west-4** on the
live map, or visit `index.html?room=yankee`. Choose **Night run** in Lighting
for the floodlit ballpark and warm River Avenue windows. The room lamp dimmer
controls the gallery lamps independently of the stadium and street lights.

The room brings nickfromlater's approved standalone miniature into the native
Whistlevale renderer. Proposal: [#34](https://github.com/nickfromlater/whistlevale/issues/34).
It uses the existing navigation, camera, lighting, throttle, pause, train cabinet,
credits panel and playable HTML exporter. No guest renderer, iframe, external
assets, runtime fonts or new browser dependencies are required for this room.

## The model

The current Yankee Stadium, interpreted as a handcrafted model railroad display:
four seating tiers, 35,829 individual seats, white frieze and roof trusses,
limestone window bays, the Great Hall, scoreboard, bleachers, bullpens, Monument
Park and Heritage Field. The compressed neighborhood has masonry buildings,
fire escapes, rooftop water tanks, awnings, vendors, benches and 467 miniature
figures, plus small seated crowd marks.

The field uses 0.136 scene units per foot. The 90-foot base square and 60.5-foot
pitching distance share that scale with the published 318 / 399 / 408 / 385 / 314
foot field anchors. These anchors are dimensional; the outer building, seating
count and surrounding street edges are modelmaking interpretations, not a
survey or an exact seat-by-seat reproduction. Diagonal mowing bands are native
polygons clipped to the grass, underneath the clay.

The three-track River Avenue structure models the elevated **4** service at
161 St–Yankee Stadium. The **B/D** service is represented on the gallery diagram;
those trains run underground and are not placed on the elevated tracks.

Two R142-family ten-car formations run opposite services. They slow into the
station, berth completely within the platforms, open the platform-side doors,
close them before departure, then accelerate away. The shared throttle scales
the timetable; pause holds its state. Bogies, rotating wheelsets, roofs and door
leaves reuse ten small meshes. Roof cutaway also exposes the interior benches
and grab poles. When both services are outside the display, the follow camera
waits at the platform. The clipped staging beyond the board edges is a theatrical
model railway return, not a modeled closed Bronx track circuit.

## The gallery and night lighting

Walnut trestles support the brass-trimmed display cabinet. Navy walls and walnut
paneling surround a woven runner, a reading bench and potted plants. Framed
pinstriped jerseys, a field blueprint, 1923 / 2009 prints, a subway diagram,
pennants, books and individually stitched display baseballs dress the room.
Ceiling beams and pendants lift away in high aerial views; close views retain
them. Brass sconces and pendant lamps use the room dimmer.

Six aimed stadium floodlights illuminate the grass and seating. Two warm
uplights pick out the limestone facade; localized platform and street lighting
and lit city windows surround the field. The native HDR bloom supplies the light
glow. Floodlight positions, directions and falloff radii follow the actual room
transform on the live map. Other rooms receive zero floodlight strength.

The larger display has a proportional camera near plane, a 1,600-unit far plane,
and matching depth reconstruction in the macro lens pass. Its actual footprint
is 292 × 282 units at map scale 0.22. The stable west-4 plot preserves the newly
merged Yamaai room's place in the east wing.

## Ownership and checks

Original model, gallery, subway and visual direction: **nickfromlater**, built
with agent assistance. Code is covered by the repository's MIT license. Sign
lettering is baked into geometry; no font binary or photographic texture is
distributed. Earlier house and renderer credits remain intact.

Architectural and dimensional references:

- [Populous: Yankee Stadium](https://populous.com/showcases/yankee-stadium)
- [MLB: Yankee Stadium guide](https://www.mlb.com/news/featured/yankee-stadium-guide-capacity-seating-chart-parking-and-more)
- [161st Street–Yankee Stadium station](https://en.wikipedia.org/wiki/161st_Street%E2%80%93Yankee_Stadium_station)

`npm run test:yankee` checks emitted geometry and footprint, field scale, station
berths, door interlocks, throttle stop, staging, complete formations, wheel and
roof drawing, mapped lighting, public credit, and mesh disposal on replacement
and failed construction. The full room has a fixed 5.1-million-vertex ceiling;
existing contribution and Hall budgets are unchanged. Static room construction
is cached and there is no geometry generation in the frame loop.

This is a dense model: approximately 139 MiB of indexed room, wall and stock
buffers before renderer targets and the other rooms. Desktop/phone browser
performance remains a review requirement. Local evidence was rendered from the
native emitted geometry, shaders and camera parameters using Mesa EGL; those
images do not constitute browser interaction or physical-device testing.

Selected review images are in `docs/rooms/yankee-preview/`; the complete local
geometry measurements, checks and render receipts remain under ignored
`evidence/yankee-room/`.


![The floodlit ballpark in its walnut and navy gallery.](yankee-preview/night.jpg)

![A ten-car 4 service calls at the elevated station.](yankee-preview/subway.jpg)

![The complete handcrafted display in daylight.](yankee-preview/day.jpg)

The images above are native-shader review renders, without the browser UI.
