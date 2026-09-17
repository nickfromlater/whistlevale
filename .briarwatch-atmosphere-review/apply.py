from pathlib import Path
import base64
import hashlib
import json
import zlib

allowed = {'src/rooms/briarwatch.js', 'src/railway.js', 'scripts/briarwatch-qa.mjs', 'docs/rooms/briarwatch.md'}
encoded = Path('.briarwatch-atmosphere-review/revision.b64').read_text().strip()
payload = json.loads(zlib.decompress(base64.b64decode(encoded, validate=True)))
assert set(payload) == allowed, 'Unexpected source paths'
pending = {}
for filename, entry in payload.items():
    source = Path(filename).read_bytes()
    assert hashlib.sha256(source).hexdigest() == entry['before'], 'Source changed: ' + filename
    lines = source.decode('utf-8').splitlines(keepends=True)
    previous = len(lines) + 1
    for edit in reversed(entry['edits']):
        start, end = edit['start'], edit['end']
        assert 0 <= start <= end < previous, 'Overlapping or invalid edit'
        previous = start
        lines[start:end] = [edit['text']]
    revised = ''.join(lines).encode('utf-8')
    assert hashlib.sha256(revised).hexdigest() == entry['after'], 'Transfer differs from tested source: ' + filename
    pending[filename] = revised
# Apply atomically with respect to validation: no file is touched before every
# source and output hash matches the locally tested revision.
for filename, revised in pending.items():
    Path(filename).write_bytes(revised)
    print(hashlib.sha256(revised).hexdigest(), filename, flush=True)
