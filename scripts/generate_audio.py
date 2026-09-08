"""Generate the shop's original score and Foley once; never ships credentials.

Run from any directory with Python 3. Existing files are kept. To regenerate a
particular asset, move its file aside first. A failed request is not retried
automatically because generation is billable.
"""
import concurrent.futures
import json
import os
from pathlib import Path
import time
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'assets' / 'audio'
JOBS = [
    ('the-long-way-home', 'music', 150, 'An exceptionally peaceful instrumental score for slowly following a miniature steam railway through a handmade English countryside. Intimate soft felt piano, warm sustained cello and bowed strings, very sparse delicate nylon guitar harmonics, a soft airy analog pad. 58 BPM, gentle major and suspended harmonies, nostalgic, comforting, quietly wondrous. Unhurried breathing space between notes, stable low dynamics, no percussion, no drums, no vocals, no choir, no dramatic swells, no sudden changes, no sound effects. Long continuous ambient composition with a soft beginning and a delicate tail, suitable for seamless crossfading. The feeling of a rainy afternoon in a beloved hobby shop.'),
    ('lamplight-nocturne', 'music', 120, 'Deeply calming ambient instrumental nocturne for watching little trains in a warmly lit model railway workshop at night. Very slow sparse felt piano, soft warm low cello, floating muted string harmonics and a barely audible tape-like pad. Around 52 BPM with spacious rubato, gentle consonant harmony, tender and safe. Quiet consistent dynamics, no beat, no drums, no voices or choir, no crescendo, no dramatic transitions, no bright bells, no sound effects. A continuous tranquil composition, gentle opening and sustained fading ending, suitable for crossfading on repeat.'),
    ('town', 'sound', 24, 'A very peaceful small English village square in the afternoon, distant indistinct friendly conversation, a few soft footsteps on cobblestones, faint sparrows, quiet airy outdoor space. Faraway gentle activity, no intelligible words, no traffic, no horns, no music, no sharp sounds. Natural subtle stereo ambience, smooth seamless loop.'),
    ('coast', 'sound', 24, 'Quiet sheltered seaside harbor on a still afternoon. Soft small waves lapping a wooden jetty, gentle water swishing under moored little boats, very occasional distant soft gull calls, tiny rope and timber creaks. Extremely peaceful, no strong wind, no horns, no voices, no music. Wide natural stereo ambience with no dramatic changes, seamless loop.'),
    ('forest', 'sound', 24, 'Serene mountain pine forest, gentle breeze in pine needles, soft small stream trickling in the distance, occasional quiet songbirds far away. A deeply soothing natural atmosphere, no insects close to microphone, no loud calls, no human voices, no music. Soft diffuse stereo soundscape, stable seamless loop.'),
    ('workshop', 'sound', 24, 'A cozy quiet traditional model railway hobby shop, very soft distant murmuring visitors without intelligible words, gentle paper rustle, delicate brush work and tiny occasional wooden taps, warm indoor room tone. Calm concentrated craftsmanship, no loud machinery, no music, no prominent clicks. Subtle stereo ambient bed, continuous seamless loop.'),
    ('steam', 'sound', 12, 'A small vintage steam locomotive rolling steadily and slowly: soft rhythmic chuff chuff chuff chuff, warm breathy steam exhaust, light even metallic wheel rhythm on rails, gentle mechanical rumble. Close intimate miniature scale, soothing repetitive texture, no whistle, no bell, no loud hiss, no music, constant speed around 2 chuffs per second, seamless looping.'),
    ('whistle', 'sound', 4, 'One gentle mellow nostalgic steam locomotive whistle, two soft rounded choo choo notes, breathy warm harmonics, distant outdoor echo fading naturally. Reassuring and musical, low intensity, no shrill frequencies, no train motion, no music, quiet beginning and ending.'),
]

def key():
    value = os.environ.get('ELEVENLABS_API_KEY')
    if not value:
        for line in (ROOT / '.env').read_text().splitlines():
            if line.strip().startswith('ELEVENLABS_API_KEY='):
                value = line.split('=', 1)[1].strip().strip('\"\'')
    if not value:
        raise SystemExit('ELEVENLABS_API_KEY is missing from .env or environment.')
    return value

def generate(job, api_key):
    name, kind, duration, prompt = job
    path = DEST / f'{name}.mp3'
    if path.exists() and path.stat().st_size > 1000:
        return {'name': name, 'status': 'kept', 'bytes': path.stat().st_size}
    model = 'music_v2' if kind == 'music' else 'eleven_text_to_sound_v2'
    body = ({'prompt': prompt, 'music_length_ms': duration * 1000,
             'force_instrumental': True, 'model_id': model} if kind == 'music'
            else {'text': prompt, 'duration_seconds': duration, 'loop': name != 'whistle',
                  'model_id': model, 'prompt_influence': .45})
    endpoint = 'music' if kind == 'music' else 'sound-generation'
    request = urllib.request.Request(
        f'https://api.elevenlabs.io/v1/{endpoint}', data=json.dumps(body).encode(),
        headers={'xi-api-key': api_key, 'Content-Type': 'application/json'}, method='POST')
    started = time.time()
    try:
        with urllib.request.urlopen(request, timeout=600) as response:
            data = response.read()
            content_type = response.headers.get('Content-Type', '')
            if len(data) < 1000 or ('audio' not in content_type and 'octet-stream' not in content_type):
                raise ValueError('Response was not an audio asset')
            path.with_suffix('.part').write_bytes(data)
            path.with_suffix('.part').replace(path)
            return {'name': name, 'status': 'generated', 'model': model,
                    'seconds': duration, 'bytes': len(data),
                    'elapsed_seconds': round(time.time() - started),
                    'request_id': response.headers.get('request-id'),
                    'character_cost': response.headers.get('character-cost')}
    except urllib.error.HTTPError as error:
        detail = error.read().decode(errors='replace')[:1200].replace(api_key, '[redacted]')
        return {'name': name, 'status': 'failed', 'http_status': error.code, 'detail': detail}
    except Exception as error:
        return {'name': name, 'status': 'failed', 'detail': str(error).replace(api_key, '[redacted]')}

if __name__ == '__main__':
    DEST.mkdir(parents=True, exist_ok=True)
    api_key = key()
    receipts = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        pending = [pool.submit(generate, job, api_key) for job in JOBS]
        for future in concurrent.futures.as_completed(pending):
            result = future.result()
            receipts.append(result)
            print(json.dumps(result), flush=True)
            (DEST / 'generation-receipts.json').write_text(json.dumps(receipts, indent=2) + '\n')
    (DEST / 'manifest.json').write_text(json.dumps([
        {'id': name, 'kind': kind, 'duration': duration, 'prompt': prompt,
         'file': f'{name}.mp3', 'provider': 'ElevenLabs'}
        for name, kind, duration, prompt in JOBS
    ], indent=2) + '\n')
    if any(r['status'] == 'failed' for r in receipts):
        raise SystemExit(1)
