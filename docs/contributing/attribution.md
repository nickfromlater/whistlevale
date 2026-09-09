# Attribution that travels with the work

Use the same optional `credits` array on a layout, an editable object, a
`TRAIN_COLLECTION` definition, a room definition or a community work:

```json
"credits": [
  {"name": "Your chosen public name", "platform": "github", "handle": "your-handle", "note": "Built the station."}
]
```

This is an example, not a credit to copy unchanged. Ask the contributor which
name they want displayed. A pseudonym with no link is valid; omit `platform`
and `handle` together. Supported platforms are GitHub, X and Bluesky. Handles
omit `@`, URLs and paths. Links are constructed by the app from validated
handles, never accepted as arbitrary URLs. Names are capped at 64 characters,
notes at 160, and arrays at 12 credits. Strings are plain text.

Credit the people responsible for the contribution. Preserve source credits
when adapting someone else's work; add a note describing your part. Do not
silently substitute a tool or model name for an author. Contributors remain
responsible for agent-assisted work and its sources. Avoid putting private
names, email addresses or account links into a public patch without permission.

**Where it appears:** More → The builders lists community works, train and room
credits, and credits in the current layout. The train cabinet shows a model's
credit and the editor inspector shows a selected object's credit. There are no
floating author labels or unsolicited popups over the railway.

**Where it persists:** `validateProject()` retains validated layout and object
credits. Save, duplicate, undo/redo, JSON export/import and playable HTML keep
them. Layouts without credits remain compatible; importing one clears the
previous layout's credit. The server embeds the shared catalogue and portable
exports retain it along with train and room source. A submitted shared layout
should carry top-level credit even if its scenery has object-level credits.
Earlier app releases can discard unknown credit fields on JSON import; a playable
HTML export carries its own updated validator. Check recipient versions when sharing JSON.

For artwork, audio and external source material, document origin and permission
in the PR as well as attribution. Displaying a name is not a substitute for
permission or a required license notice. Keep existing notices intact. Optional
recordings have the separate process in [the audio guide](../../assets/audio/README.md).

A correction or removal request should identify the work and desired public
credit. Maintainers can update the relevant data and review the diff. Published
copies already downloaded by other people cannot be recalled by a repo change.
