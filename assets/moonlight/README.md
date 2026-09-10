# Moonlight Drive-In programme

`moon-clip.mp4` and `poster.jpg` are the original, unchanged media supplied with
the Moonlight Drive-In miniature (published version 3, source commit
`fc734f64f060d47f63312cec4f5b8a1d9e494c06`).

The film is an excerpt from **A Trip to the Moon (1902), directed by Georges
Méliès**. The supplied [Wikimedia Commons source and rights record](https://commons.wikimedia.org/wiki/File:Le_Voyage_dans_la_lune_(black_and_white,_1902).webm)
identifies this black-and-white silent film as public domain. The poster is a
still from the same film. Preserve this attribution with copied media; these
historical film images are distinct from the repository's original artwork.

The supplied excerpt is 64 seconds, H.264, 512 × 384 pixels at 24 frames per
second, 4,141,563 bytes. It has **no audio track**. No film is downloaded from
Wikimedia at runtime and neither the app nor its build regenerates the media.

## Railway shorts

The two additional pictures were prepared on 10 September 2026. Each MP4 is
H.264, 512 × 384, 24 fps, `yuv420p`, with fast-start metadata and **no audio
stream**. Posters are stills from their corresponding local clips.

| Files | Film and public credit | Selection | Bytes (film / poster) |
| --- | --- | --- | --- |
| `arrival-clip.mp4`, `arrival-poster.jpg` | *Arrival of a Train at La Ciotat* (1896), Auguste and Louis Lumière | Complete short, 51.708333 seconds; poster at 12 seconds | 1,970,261 / 14,112 |
| `train-robbery-clip.mp4`, `train-robbery-poster.jpg` | *The Great Train Robbery* (1903), Edwin S. Porter; Edison Manufacturing Co. | Water-tower excerpt, 62.208333 seconds; poster at 32 seconds | 3,207,058 / 18,531 |

**Arrival of a Train:** the [Commons source and rights record](https://commons.wikimedia.org/wiki/File:L%27Arriv%C3%A9e_d%27un_train_en_gare_de_La_Ciotat,_Complete.webm)
identifies the film as public domain in the United States and its country of
origin. We used its [silent original WebM](https://upload.wikimedia.org/wikipedia/commons/6/67/L%27Arriv%C3%A9e_d%27un_train_en_gare_de_La_Ciotat%2C_Complete.webm),
5,590,218 bytes, preserving the full picture with narrow horizontal padding.

**The Great Train Robbery:** the [Library of Congress catalogue](https://www.loc.gov/item/00694220/)
identifies the 1903 Edison production and Porter’s role. The [Commons copy and
rights record](https://commons.wikimedia.org/wiki/File:The_Great_Train_Robbery_1903.webm)
records its Library of Congress source and U.S. public-domain status. We used
the [480p WebM derivative](https://upload.wikimedia.org/wikipedia/commons/transcoded/1/1d/The_Great_Train_Robbery_1903.webm/The_Great_Train_Robbery_1903.webm.480p.vp9.webm),
68,280,456 bytes, selecting approximately 01:19.6–02:21.8. Only the existing
black side padding was cropped (640 × 480 at x=106); the film picture was
scaled uniformly. All source audio was discarded. Archive credit: Library
of Congress, Motion Picture, Broadcasting, and Recorded Sound Division.

The short excerpts are independent programme choices. Keep the film authors,
years, excerpt labels and archive credit with redistributed media; the film
images do not acquire the miniature’s artwork credit or source-code license.

## Reproducing the additional encodes

These are maintainer commands, not part of development or the public build.
Download the linked sources into a temporary directory first; do not commit
the full source films. The two commands below assume those local filenames.

```sh
ffmpeg -i arrival-source.webm -map 0:v:0 -an \
  -vf 'scale=512:384:force_original_aspect_ratio=decrease:force_divisible_by=2,pad=512:384:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=24' \
  -c:v libx264 -preset slow -crf 25 -maxrate 480k -bufsize 960k \
  -pix_fmt yuv420p -movflags +faststart arrival-clip.mp4
ffmpeg -ss 79.6 -i train-robbery-source.webm -t 62.25 -map 0:v:0 -an \
  -vf 'crop=640:480:106:0,scale=512:384,setsar=1,fps=24' \
  -c:v libx264 -preset slow -crf 25 -maxrate 480k -bufsize 960k \
  -pix_fmt yuv420p -movflags +faststart train-robbery-clip.mp4
```

Posters use `ffmpeg -ss <seconds> -i <clip.mp4> -frames:v 1 -q:v 3 <poster.jpg>`.
The output hashes below identify the checked-in encodes; encoder versions may
produce different bytes when reproducing them.

```text
SHA-256
moon-clip.mp4          ee37b5d47f682d0c2d91cf66c64a141ba3a59a47d18680f17c008a8677fd8a55
poster.jpg             1d425efa19609c0f205a65837feb865a655a8d684ae3d4d66c58fbb3e755f31a
arrival-clip.mp4       adcf980785cb876f55475436e9770f19ea4508f973b9c6394b16363238d02b5e
arrival-poster.jpg     addde7bdbd2a869ddf2c5ce9777fbea0df3a6078aa94c351a25405e85f5ef28d
train-robbery-clip.mp4  344df243849fda9511a590559569a55e469ee6e25816545f51e7e67ffd4483cd
train-robbery-poster.jpg 74ddb90380f1c7e4d7f2b0765f75669a7d80f6d2b33513bad9021336803f9cf0

Downloaded sources (not shipped)
arrival-source.webm    a0996a8f446013c7965319d16e3389a4e28a1453d43593a0e11b9710ca109e9c
train-robbery-source.webm 8117f3942ee80f58b4f69e148732a4d24733c6af947235cf0d466fdbe185ae1e
```

## Playback and export

The shared projection controller loads the poster when its screen is visible
and plays the muted picture only during nearby viewing. Hidden pages and
inactive rooms release the video decoder. Reduced motion keeps a still picture
unless the visitor chooses Play film. Playable exports embed the media once and
pass it to the portable Hall when opening that page.
