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

ElevenLabs recordings have separate [Sound Effects Terms](https://elevenlabs.io/sound-effects-terms),
[Music Terms](https://elevenlabs.io/music-terms), and a
[Prohibited Use Policy](https://elevenlabs.io/use-policy), including restrictions
on distributing sound-effect outputs as isolated files or a sound library.
The source license does not grant rights to those recordings.
