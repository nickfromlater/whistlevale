"""One-use, allowlisted transfer of the locally reviewed Briarwatch revision."""
import base64
import hashlib
import json
from pathlib import Path
import zlib

ROOT = Path('.')
ALLOWED = {
    'docs/rooms/briarwatch.md',
    'scripts/briarwatch-qa.mjs',
    'src/rooms/briarwatch.js',
    'src/rooms/briarwatch-castle.js',
    'src/rooms/briarwatch-village.js',
}
pending = {}
for name in ('structure.json', 'landscape.json'):
    payload = json.loads((ROOT / '.briarwatch-scenery-review' / name).read_text())
    for filename, entry in payload.items():
        if filename not in ALLOWED or filename in pending:
            raise RuntimeError('Unexpected or duplicate file: ' + filename)
        current = (ROOT / filename).read_bytes()
        digest = hashlib.sha256(current).hexdigest()
        if digest == entry['after']:
            pending[filename] = current
            continue
        if digest != entry['before']:
            raise RuntimeError('Source changed since review: ' + filename)
        encoded = entry['data']
        print('Transfer', filename, len(encoded), hashlib.sha256(encoded.encode()).hexdigest(), flush=True)
        decoder = zlib.decompressobj(zdict=current[-32768:])
        try:
            revised = decoder.decompress(base64.b64decode(encoded, validate=True)) + decoder.flush()
        except Exception as error:
            raise RuntimeError('Invalid transfer for ' + filename) from error
        if not decoder.eof or decoder.unused_data or decoder.unconsumed_tail:
            raise RuntimeError('Incomplete or extra compressed data: ' + filename)
        if hashlib.sha256(revised).hexdigest() != entry['after']:
            raise RuntimeError('Reviewed source hash mismatch: ' + filename)
        revised.decode('utf-8')
        pending[filename] = revised
if set(pending) != ALLOWED:
    raise RuntimeError('The complete five-file revision is required')
# Nothing is written until all five replacements have passed verification.
for filename, revised in sorted(pending.items()):
    (ROOT / filename).write_bytes(revised)
    print(hashlib.sha256(revised).hexdigest(), filename, flush=True)
