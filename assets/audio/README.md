# Optional recordings

The source repository contains the railway, procedural sounds, sound mixer,
and audio generation tooling. Generated MP3s used in the hosted experience
are kept outside the source repository and are not covered by its MIT license.

To use your own recordings, place them here using the names in
`src/soundscape.js` and `src/playlist.js`. The room effects are `town.mp3`,
`coast.mp3`, `forest.mp3`, `workshop.mp3`, `steam.mp3`, and `whistle.mp3`.
The playlist module defines the music files and room choices. Update per-track
playback trims when replacing masters, and use soft starts and tails for loops.

For the original base effects and two fallback cues, copy `.env.example` to
`.env`, set your own ElevenLabs key, and run:

```sh
python3 scripts/generate_audio.py
```

Generation uses your ElevenLabs account and is billable. Existing recordings
are kept. The nine-piece playlist is supplied separately; the generator does
not recreate those pieces. Contributions and forks should supply recordings
that they have permission to use and distribute.

`npm run check -- --require-audio` verifies a complete local audio collection.
Normal source and audio-routing tests do not require recorded files.

## Hosted builds

Vercel's production and preview environments set `WHISTLEVALE_AUDIO_ORIGIN` to
`https://whistlevale.com`. Before building, `scripts/hosted-audio.mjs` retrieves
the existing recordings from that origin's immutable asset paths. The reviewed
`scripts/hosted-audio.json` contains only their IDs, byte lengths and SHA-256
checksums. Every file must match before the build proceeds. Matching local
masters are reused; an unavailable or mismatched recording fails the build,
leaving the current production deployment live.

This adds no runtime request or generation step: each deployment serves its own
fingerprinted copies as before. Without the environment variable, development,
forks and CI keep their usual optional-recording behavior and make no request to
the hosted site. `npm run test:hosted-audio` exercises verification, bounded
downloads and failure cleanup with mocked responses.

The live site is a preservation source, not a backup. Keep the original masters
separately. A domain outage or a rollback that removes these assets can block the
next hosted build; restore a known-good deployment or build from the matching
local masters before retrying. When deliberately adding or replacing recordings,
review their rights, update the metadata to match the new local masters, and
publish that complete collection from the maintainer's machine first. Automatic
Git builds can then retrieve the new immutable paths. Never commit the recordings
or regenerate them as part of a build.

ElevenLabs recordings have separate [Sound Effects Terms](https://elevenlabs.io/sound-effects-terms),
[Music Terms](https://elevenlabs.io/music-terms), and a
[Prohibited Use Policy](https://elevenlabs.io/use-policy), including restrictions
on distributing sound-effect outputs as isolated files or a sound library.
The source license does not grant rights to those recordings.

## Yamaai score

**Between the Mountains** (`yamaai-between-mountains.mp3`) is a 90-second
instrumental generated with ElevenLabs `music_v2` for the host room: sparse
koto, bamboo flute, felt piano and a quiet sustained bed. It is separate from
Techartist's original scene and music. Generation was requested by nickfromlater.
The [master metadata](../../scripts/yamaai-music.json) preserves the prompt,
processing and exact checksum; the recording itself remains outside Git.

Place the supplied master in this directory to preview it. Automatic cinema
selects it in Yamaai by day and night, while pinned tracks and the existing mixer
remain available. A source checkout without it falls back to the house score.
No recording is fetched from ElevenLabs by the browser or build.

The new master is published on the reviewed Yamaai preview. Its manifest entry
has an explicit HTTPS `origin`, allowing Git builds to retrieve it before the
production site carries it. All other recordings still use
`WHISTLEVALE_AUDIO_ORIGIN`. A per-record origin uses the same exact immutable
path, byte limit, checksum, timeout and no-redirect rules as the main collection;
source-only builds remain offline. No playback request goes to another host:
each build packages its own copy.

Keep that source deployment available until production carries the recording.
After verifying its exact immutable file on production, remove the temporary
`origin` override so later builds use the main preservation collection. Never
add a master to the manifest before its reviewed source actually serves it.
