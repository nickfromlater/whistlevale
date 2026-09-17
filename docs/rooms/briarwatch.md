# Briarwatch Castle

A native Whistlevale railway room, created by **nickfromlater** with agent assistance.
Approved scope: [proposal #42](https://github.com/nickfromlater/whistlevale/issues/42).
No dragon, placeholder creature, flight system or associated controls are included.

## Visit

Serve with `npm run dev`, then open `http://127.0.0.1:4174/?room=briarwatch`.
The room is also available from the house map at `west-5`. Views offers eleven
composed camera positions. The usual train, cinema, lighting, sound and pause
controls remain available. Portrait views have deliberately authored distances.

The Crown & Cinder Line is a continuous, graded folded-dogbone steam circuit.
It crosses a five-arch stone viaduct on the high rear line, returns across an
open-sided covered timber bridge, curves over a braced wooden trestle, follows
a cliff-side retaining balcony, and passes through a short rock tunnel. A
connected goods siding, loading crane, stationary wagon and modeled semaphore
signals enrich the station. The siding and signals are scenic, not an
interactive switching or dispatch simulation. It uses the existing Tern steam family rather than
claiming a new locomotive model.

## The miniature

The ridge carries an asymmetrical limestone castle: old keep and stair turret,
open twin-tower gatehouse, raised portcullis and drawbridge, great hall and
braced timber river gallery, chapel and bellcote, courtyard well, arcades,
kitchen, herb beds and terrain-following defenses. The keep entrance connects
its external stair and landing through real masonry openings. Major plinths
and round-tower foundations reach the finished terrain. Corbelled bartizans,
a supported timber hoarding, an oriel, hall dormers, gable tracery and stone
consoles articulate the castle at silhouette, architectural and detail scales.

Eight individually placed lower-town buildings include the Copper Hart inn,
an open working smithy, bakehouse and oven, weaver, farrier's house, orchard
house, ferryman's cottage and watermill. A clipped river, working native mill wheel, mature branching trees, orchard
and cultivated ground connect those places. Projecting window bays, roof
dormers, braced jetties, carved bargeboards, cloth canopies, signboards and
differentiated shop fittings give the town a more authored character.
The contoured walnut-and-green cabinet wraps around the room in a horseshoe,
with a castle peninsula, a village peninsula and a connecting rear gorge shelf.
The central visitor aisle is an actual void in terrain and cabinet geometry,
with the room floor below it, not a painted recess in a rectangular table.
The oak-and-plaster estate gallery retains its wall-linked roof cutaways. The room
uses Whistlevale's existing day/evening lighting and native material system.

This is an authored miniature, not a freely walkable interior game. The castle's
courtyard, gate passage, hall windows and smithy reward close cameras; most
village houses are exterior miniatures. No historical accuracy is claimed for
the intentionally anachronistic railway.

## Scenery and castle revision 3

The keep now has projecting crow-stepped limestone gables, six-petal loft roses,
louvered vents, chamfered arch dressings, dressed tower plinths and a slender
roof lantern above the great hall. Swallowtail standards, carved keystones,
machicolation consoles and climbing ivy break up the gate and curtain walls.
The original open gate, keep entrance, bridge openings and courtyard paths remain.

The landscape uses dissected quarry slopes, slope-embedded limestone ribs,
projecting cliff buttresses, localized talus fans and bracken-filled woodland.
Fifty-six explicitly placed trees replace the earlier thirty-four-tree planting.
Oak, beech, apple, willow and pine have tapered branch skeletons and asymmetric,
volumetric foliage with blended normals instead of pointed umbrella crowns.
Fallen timber, roots, wildflowers and low vegetation are grouped by habitat.
A roofless watchtower with a true open entrance anchors the eastern wooded ridge.

A separate surveyed spring has a carved bed, continuous downhill water ribbon,
source pool, small cascade and open packhorse bridge. It joins the existing
submerged river without changing the train circuit or the millrace. Raised beds,
a clipped hedge and a small trellis connect the inn and weaver's yards.

The focused native geometry check measures **895,086 static scene vertices**,
against the unchanged 900,000 ceiling, and **5,592 moving wheel vertices** against
6,000. That adds roughly 0.6% to the prior static scene while increasing planting
from 34 to 56 trees. Buried roof-ridge and sleeper faces are omitted; small arch
and tracery tessellation is scaled to their size. No shared renderer was changed.

## Source and lifecycle

- `src/rooms/briarwatch.js`: terrain, river, routes, bridges, vegetation, shell,
  viewpoints and room registration.
- `src/rooms/briarwatch-castle.js`: masonry openings, roof and timber helpers,
  castle buildings, defenses and courtyard.
- `src/rooms/briarwatch-village.js`: houses, station, gardens, vignettes and mill.

All three scripts load before house startup and atlas construction. No new
runtime dependency, imported asset, recording or atlas allocation is required.
Grounded details sample the exact triangles emitted by the terrain builder.
Fixed placements and coordinate hashes do not consume the shared scene seed.

The waterwheel is a cached `scene.movingParts` mesh. Its transform is tied to
train travel, so pausing the railway also pauses the mechanism; reduced motion
holds it still. It participates in the native dynamic and shadow passes. Room
cache replacement and failed-build cleanup dispose its buffer with other room
resources. The static scene has a fixed 900,000-vertex test ceiling; the moving
mechanism has a separate 6,000-vertex ceiling. Existing budgets are unchanged.

## Checks

Run `npm test`, `npm run test:geometry:full`, and
`npm run check:contributions -- --json`. `npm run test:briarwatch` also runs as
part of the full suite. Its focused checks cover the closed circuit, actual
mesh-to-track and tree clearances, clipped river continuity, genuine cabinet voids, graded rail support, tunnel roof, real gate and
keep and ruined-watchtower openings, swept train-envelope clipping against new scenic triangles, carved spring-bed clearance, deterministic mechanism, reduced motion, disposal, credits,
script inclusion and house-map placement.

Screenshots and measured browser evidence belong in ignored `evidence/briarwatch/`.
Report the exact camera, viewport, renderer and commit used. Software-rendered
Chromium screenshots are appearance evidence, not physical-phone performance or
touch-gesture verification. Source/export inclusion checks do not substitute
for opening the exported playable house.
