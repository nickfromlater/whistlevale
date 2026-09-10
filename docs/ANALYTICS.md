# Lightweight usage analytics

The production railway and Grand Hall use Vercel Web Analytics. Local previews,
Vercel previews and portable exports do not send analytics. The bootstrap respects
Do Not Track and Global Privacy Control; blocked delivery cannot interrupt the app.

Custom events answer a few aggregate questions:

| Event | Meaning | Properties |
| --- | --- | --- |
| `room_visit` | First ready, visible visit to each room on this page | `room` |
| `cinema_start` | First visible cinema session in each room | `room` |
| `visit_time` | Cumulative visible, ready page time reaches a threshold | `seconds` |
| `room_time` | Cumulative visible time in a room reaches a threshold | `room`, `seconds` |
| `cinema_time` | The cinema subset of room time reaches a threshold | `room`, `seconds` |
| `control_used` | First use of an allowlisted control in each room | `room`, `control` |

Thresholds are 30, 60, 180, 300, 900 and 1,800 seconds. Map time counts toward the
page total, but not toward room or cinema time. Transitions, hidden tabs and long
suspended/stalled gaps are excluded. These are threshold counts, **not an exact
average visit duration**. Separate page loads start fresh; missing historical
engagement cannot be recovered. First-use control counts are not total clicks.

Only fixed action names, canonical room names and thresholds enter custom event
properties. No typed text, slider values, coordinates, contribution text or
persistent client identifiers are added. Vercel handles its own pageview metrics.
The documented `beforeSend` hook removes URL queries and fragments from event
URLs; it does not expose Vercel's referrer field. No custom referrer data is added.

## Maintaining it

`src/analytics.js` owns the sender and accounting. House and Hall adapters call
`sync({ready, room, cinema, map})` at lifecycle boundaries and `control(name)`,
`panel(id)` or `shortcut(key)` for actions. Keep hooks out of animation, rendering,
pointer-move and input handlers. New control names must be allowlisted centrally.
A map snapshot uses the current room but sets `map: true`.

There is at most one timer, with no polling faster than the next threshold; coarse
accounting wakes at most every 30 seconds between thresholds. Each page is capped
at 60 custom events. The fallback queue is bounded and sender failures disable
custom tracking. Portable packing strips both the bootstrap and injected sender,
including embedded Hall copies that are packed again.

Run `npm run test:analytics`, `npm run test:delivery` and `npm test` for changes.
Verify a production deployment by using real controls, leaving the page visible
past a threshold, and checking Vercel's `vercel.analytics_event` metrics after
processing. QA visits are included in those aggregate production counts.
