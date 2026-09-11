# Embedded projects

Some contributions already exist. Somebody built a thing, it works, it is theirs,
and it is on GitHub under a licence that lets it be shown. Whistlevale hosts that
work **as it is**, in a guest room, rather than asking the author to rewrite it
against this house's renderer.

The first one is [Yamaai](../../src/rooms/yamaai.js) — the Mountain Railway
Diorama by [Techartist](https://x.com/techartist_), a three.js scene running on
its own renderer on the table.

## Why not rewrite it

Rewriting a finished piece of work into house geometry loses the thing that made
it worth showing, and it quietly moves authorship: the commits that built it stop
being the record of who made it. Hosting the original keeps the work and the
credit together.

The cost is that the house is dependency-free and the guest usually is not. Two
rules pay for that.

## The two rules

**Nothing loads until someone walks in.** The project's entry is a URL held in
data — never a `<script>` or an `<iframe src>` in `index.html`. `embeddedEnter()`
is called on room entry and creates the frame; `embeddedLeave()` destroys it. A
visitor who never opens the room never fetches the project, never parses its
renderer, and never pays for a second WebGL context. The frame is destroyed
rather than hidden, because hiding an iframe gives back neither its context, its
animation loop, nor its audio.

**It sits on the table.** The frame is mapped onto four world-space corners with
a projective transform, so the work reads as a miniature under the house lights
rather than a web page covering the house. While it is docked the frame takes no
pointer events, so the room's camera stays in charge; *Step closer* fills the
view and hands the project its own controls back.

## Adding one

Everything below is data except the surface, which is four corners of whatever
the work stands on.

1. **Check the licence, and get permission.** A permissive licence is not the
   same as the author wanting their work here. Record both: the SPDX id and how
   permission was given, with a date. If you cannot point at the permission, the
   work does not go in.
2. **Vendor it** under `vendor/<project>/`, whole, including its own `LICENSE`
   and its own vendored dependencies. Write the upstream commit into
   `UPSTREAM-COMMIT.txt`. Do not edit their source: if it needs changes to run
   here, that is a patch to send them, not a divergence to keep.
3. **Build a room** that gives the work a surface and says whose it is. See
   `src/rooms/yamaai.js`; `railway: false` belongs on a room whose railway is the
   guest's, not the house's.
4. **Register the project** with `registerEmbeddedProject(room, {...})`:

   ```js
   registerEmbeddedProject('yamaai',{
    entry:'vendor/mountain-railway-diorama/index.html',
    title:'Mountain Railway Diorama', subtitle:'Yamaai 山あい',
    source:'https://github.com/iamtechartist/mountain-railway-diorama',
    licence:'MIT',
    permission:'Shown here with the author’s permission, given publicly on 11 September 2026.',
    credits:[{name:'Techartist',platform:'x',handle:'techartist_'}],
    frame:[640,400], closeFrame:[1280,800],
    surface:yamaaiSurface
   });
   ```

   `surface()` returns the four corners of the display surface in world space,
   far edge first: `[topLeft, topRight, bottomRight, bottomLeft]`.

5. **Add the scripts** to `index.html` — `src/embedded.js` before your room
   module. This registers the project; it does not load it.

## What you get for free

One credit record feeds every surface, so they cannot disagree with each other:

- the **credit dock**, visible in the room without clicking anything, with the
  author's name linked to their profile, the original project, the licence and
  the permission note;
- the **plaque in the room**, lettered from the same record into the art atlas,
  and omitted the way the house's room plaques are when the atlas is full;
- the room's **name, tag and description** on the house map;
- the room's `credits`, which the builders panel reads.

## Things that will bite

- **Guest scenes can be slow to build.** The diorama takes the better part of a
  minute on a cold, throttled tab. The frame is mounted on a short delay so it is
  not racing the room's own geometry, and the table shows a holding card until
  the frame's `load` fires. Do not remove either: starting both renderers in the
  same tick locks the tab on the way in, which reads as a broken room.
- **The sandbox is `allow-scripts` only.** The project may render; it may not
  reach this document, this origin's storage, the top window, or navigate us. If
  a project needs more than that, it does not go in a room.
- **The build ships `vendor/` verbatim and never fingerprints it.** Their import
  maps, ES imports and relative asset paths are written against their own
  filenames. `scripts/serve.py` serves `vendor/` for the same reason.
- **Do not put the entry in the page.** `scripts/delivery-qa.mjs` requires every
  asset referenced from the built HTML to be content-fingerprinted. A vendored
  entry cannot be, which is one more reason it is loaded from data at run time.
- **A corner behind the camera makes the transform meaningless**, not merely
  ugly. `embeddedFrameUpdate()` hides the frame rather than drawing a
  turned-inside-out quad.
