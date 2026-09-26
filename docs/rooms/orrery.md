# The Orrery · Comet

A celestial clockwork rollercoaster, requested by **nickfromlater**. The room is
native Whistlevale geometry, on **east-6**, at `/?room=orrery`. No external art,
models, recordings, renderer or runtime dependencies were added. Public credit:
**nickfromlater**, with agent assistance. Existing project credits are unchanged.

## What to explore

Platform Zero dispatches five open Comet cars through a slow chain lift, a high
stardrop, a complete inversion in twin brass orbital trusses, a banked circuit
around a ringed planet, and a low return underneath the departure track. The
miniature has a walnut plinth, enamel rails, gold ties, supported elevated track,
a striped station canopy, ticket booth, tiny visitors, lunar rock gardens,
practical lamps, a crescent sculpture and a clockmaker's star-lined gallery.
Seven authored viewpoints include explicit portrait framing. Connected cream-edged
promenades join the kiosk, station stair and eastern lookout. The planet now
stands over three physical open-spoked, counter-rotating gears. A graduated
dispatch clock and five swinging boarding gates make the station operational.

The ticket boards the **actual lead car at Platform Zero** and holds only Comet
while the visitor gets comfortable. **Dispatch Comet** explicitly starts a full
circuit, with gates and restraints closing together before departure. The train
returns to the platform, opens for boarding and waits with **Ride again** and
**Leave seat** available. Arrival does not pause the rest of the house. Leaving,
changing rooms/views, opening the map or entering cinema releases the temporary
train hold. The generic Cab viewpoint still joins the currently running train
without restarting it.

Drag or use arrow keys to look, pinch/scroll to adjust field of view, Home to
recenter, and Escape or **Leave seat** to return. The moving seat banks and
inverts. **Steady overlook** is available without stopping the train and is the
initial choice with reduced motion. Removing the OS motion preference never
silently re-enables the inverting camera; that remains an explicit choice.
Dispatch resumes a paused railway and restores the normal 42% throttle only
when it was zero. Other nonzero throttle choices are respected.

## Implementation

- `src/rooms/orrery-track.js`: sampled closed 3D ribbon, inversion-safe frames,
  physical arc distance and a monotone dispatch timetable.
- `src/rooms/orrery.js`: authored room, native map registration, static scenery,
  structural members, seven views and ten owned cached mechanism meshes.
- `src/trains/orrery.js`: original fixed Comet stock with moving load/upstop/guide
  wheels, open seating, restraint mechanism and physical car separation.
- `src/orrery-ride.js` and `.css`: room-scoped camera and accessible controls.

The `edge` is **drive-coordinate parameterized**, not distance parameterized.
The existing room and map loops advance it without special simulation branches.
At the usual throttle of 42, a circuit takes approximately 94 seconds including
an approximately 3.8-second station dwell. Changing throttle scales the entire
sequence. `edge.motionAt()` maps that coordinate to physical track distance;
all car offsets, wheel rotation, rails and camera transforms use the same physical
track. Do not apply generic railway car offsets to the timed edge. This is an
authored miniature ride, not an engineering or real-world coaster simulation.

All scenery is built once. The train reuses six stock meshes; no runtime geometry
uploads or new frame loop are introduced. Shared stock disposal and room cache
ownership are preserved. Room re-registration and partial-build failures release every mechanism through
`movingParts`. Ornamental motion follows train progression, not wall-clock time,
and is parked by reduced motion. The room-scoped simulation wrapper checks trip completion after the existing
update; it adds no scheduler and never edits shared simulation or map modules.
The new script and stylesheet tags are gathered by the existing playable exporter;
generated controls use `quiet-generated` so they are not duplicated on reopening.

## Review

```
npm run test:orrery
npm test
npm run test:geometry:full
npm run check:contributions -- --json
```

The focused tests cover route closure, continuous orthonormal frames, inversion,
nonlocal track separation, station timing and restraint interlocks, finite mesh
attributes, fixed geometry ceilings, support-envelope separation, failed upload
cleanup, cached stock and draw paths without geometry uploads. The separate trip tests exercise
boarding, explicit dispatch, complete circuits, replay, focus, temporary speed
ownership, room/map/cinema exits, extra fingers and live motion preferences. These supplement rather
than weaken the existing suite. The full geometry comparison discovers the new
room and stock from the normal script registry.

The optional `scripts/orrery-browser-qa.cjs` runs against `scripts/serve.py` and
uses an **external** Playwright installation, not an app dependency. The review
workflow captures desktop, 390px and 320px views, checks seat/focus/keyboard
behavior, reduced motion, pause, a complete native-simulation lap, room navigation
and the native live map. It also downloads the actual playable export and opens
it offline, checking dispatch, controls and mechanism ownership. Its
screenshots and JSON report are uploaded as a review artifact.

Local review environment: Node 22, finite geometry checks available; Chromium
was unable to create a WebGL 2 context. Native browser screenshots must therefore
come from the Node 24 review runner rather than be represented as local renders.
A physical iPhone's gesture behavior, GPU performance and long-duration thermal
behavior remain device checks. A resized desktop is not device evidence. The workflow reports standalone playback only after its offline reopen check
actually passes; source inclusion alone is not playback evidence.
