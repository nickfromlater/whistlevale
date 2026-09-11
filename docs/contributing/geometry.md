# Small geometry reference

Use this with the [building recipe](buildings.md). The implementation lives in
`Builder` near the start of `src/railway.js`; shared details such as `windowPane`
are in that file and `src/rooms.js`. Geometry uses model units, Y up, and a local
origin at ground level. In The Commons, positive Z faces the room entrance.

## Transforms and primitives

| Call | Meaning |
| --- | --- |
| `b.push(x,y,z,ax,ay,az,sx,sy,sz)` | Save the transform, then translate/rotate/scale. Angles are radians. The local point is scaled, rotated Z then X then Y, and translated. Scale defaults to 1; `sy` and `sz` default to `sx`. |
| `b.pop()` | Restore the previous transform. Match every push, including inside helpers. |
| `b.box(x,y,z,w,h,d,color,mat)` | Center position and **full** width/height/depth. |
| `b.cylinder(x,y,z,r1,r2,h,color,mat,segs)` | Centered on local Y, bottom/top radii, full height. Start with 8–12 segments for small details. |
| `b.sphere(x,y,z,sx,sy,sz,color,mat,segments,rings)` | Ellipsoid radii, not diameters. Use few segments for tiny props. |
| `b.beam(a,b,r,color,mat,sides)` | Beam between two 3D endpoints. `r` is its radius, not its full thickness. |
| `b.tri(a,b,c,color,mat)` / `b.quad(a,b,c,d,color,mat)` | Ordered corners. Normal follows `(b-a) × (c-a)`; face outward. A quad is two triangles. Use solid panels when both sides or edges should be visible. |

Materials are shader IDs, not texture files. Useful existing choices:

| ID | Appearance / behavior |
| --- | --- |
| `0` | Plain painted surface |
| `4` | Rough masonry with mortar pattern |
| `5` | Roof courses |
| `6` | Opaque window surface that warms and glows at night in railway rooms; the Hall remaps it to reflective glazing |
| `20` | Subtle plaster texture |
| `10` | Small luminous lamp surfaces; use on modeled bulbs and lanterns |
| `22` | Timber grain |
| `23` | Matte detail surface |
| `41` | Reflective metal |
| `77` | Legacy miniature pinlights: UV `[phaseRadians, amplitude]`; bounded brightness and reduced-motion support |
| `78` | Local nebula veil: UV in the unit disk; deterministic, softly evolving light |
| `79` | Soft star cards: UV X stores `phase * 4 + localX`, with local coordinates 0–2 |
| `80` | Local practical-light haze, using the same card coordinates as 79 |
| `81` | Miniature world surfaces, native spherical UVs; opaque |
| `82` | Intermittent meteor: UV 0–1 along a fixed track |
| `76` | Clear architectural glazing: transparent in both renderers, with no opaque shadow; use for greenhouse panes with visible interiors |

Use material `76` only on complete triangles or quads. Thin single-surface panes
work best; do not overlap duplicate glass faces. The renderer keeps these panes
in a separate transparent pass after opaque geometry. Their buffers belong to
the normal mesh and are released with it; no custom per-frame builder is needed.
Material `6` remains useful for warm ticket windows and lanterns that should not
reveal an interior.

Do not use atlas materials `15`, `32` or `33` without allocated UVs. Existing
foliage material `8` sways in the shader; it is unsuitable for rigid architecture.

## A minimal construction example

This is a geometry exercise, not a finished contribution or catalogue entry.
Give your actual design its own identity and details.

```js
function exampleCanopy(b,x,y,z,angle=0){
 b.push(x,y,z,0,angle);
 // Bottom -0.40, top +0.20: a footing that meets gently varying ground.
 b.box(0,-.10,0,4,.60,3,'#b6ad94',4);
 for(const xx of[-1.6,1.6])for(const zz of[-1.1,1.1])
  b.box(xx,1.35,zz,.14,2.30,.14,'#b5996d',22);
 b.box(0,2.56,0,4.2,.12,3.2,'#5b7175',5);
 b.beam([-1.6,2.1,1.1],[-1.2,2.5,1.1],.04,'#b5996d',22,4);
 b.pop();return 0;
}
```

The furthest roof corner is `hypot(2.1,1.6) ≈ 2.641`; a declared radius of
2.65 contains this example. Measure again after adding steps, gutters or props.
The community adapter applies the catalogue rotation and scale before invoking
the mapped builder at its local origin. Do not read and apply the catalogue
transform again inside the builder.

Foundation depth is a design decision, not a permission to bridge uneven ground.
Default placement rejects a boundary sample more than 0.30 model units above
or below the center placement height. It checks eight samples, not every point
under the model. Inspect all foundation edges on the finished terrain and keep its top above the ground.
Do not call `b.mesh()` inside a contribution: the room owns upload and disposal.
Keep procedural detail deterministic with coordinate hashes; avoid consuming
the shared random sequence.

Large opaque meshes share byte-identical vertex records during GPU upload.
Positions, normals, colors, materials, UV seams and triangle order stay intact;
transparent triangles retain their sortable buffers. Geometry budgets still
count the original emitted vertices. Do not increase a model's allowance based
on compression. Keep builder data in double precision until upload and let the
room release its vertex and index buffers together through `disposeMesh`.

Celestial materials 78–80 and 82 use the existing transparent pass, with depth
testing, no depth writes, no opaque shadows and the same buffer disposal as glazing.
All effect geometry must fit its declared footprint. Both renderers share the
same bounded linear-light shader functions; the model never owns a frame loop.
