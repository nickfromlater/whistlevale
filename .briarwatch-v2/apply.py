import base64, hashlib, json, pathlib, zlib
root = pathlib.Path('.')
allowed = {'docs/rooms/briarwatch.md', 'scripts/briarwatch-qa.mjs', 'src/rooms/briarwatch-castle.js', 'src/rooms/briarwatch-village.js', 'src/rooms/briarwatch.js'}
repairs = json.loads((root / '.briarwatch-v2/repairs.json').read_text())
pending = {}
for path in sorted((root / '.briarwatch-v2').glob('payload-*.json')):
    for file, entry in json.loads(path.read_text()).items():
        assert file in allowed and file not in pending, file
        old = (root / file).read_bytes()
        digest = hashlib.sha256(old).hexdigest()
        if digest == entry['sha256']:
            pending[file] = old
            continue
        assert digest == entry['base'], 'Base source changed: ' + file
        text = entry['data']
        fix = repairs[file]
        assert hashlib.sha256(text.encode()).hexdigest() == fix['sha256'], 'Transfer changed: ' + file
        for start, end, value in reversed(fix['edits']):
            text = text[:start] + value + text[end:]
        decoder = zlib.decompressobj(zdict=old[-32768:])
        new = decoder.decompress(base64.b64decode(text, validate=True)) + decoder.flush()
        assert decoder.eof and not decoder.unused_data, file
        assert hashlib.sha256(new).hexdigest() == entry['sha256'], 'Source verification failed: ' + file
        pending[file] = new
assert set(pending) == allowed
file = 'src/hobby.js'
old = (root / file).read_bytes()
digest = hashlib.sha256(old).hexdigest()
if digest == '72c0c122faf05ae890c7022fe2d72fb7ea73131ebbec854e2f33c2744a0688aa':
    pending[file] = old
else:
    assert digest == '6d4418c0369c7eb2f1440acf0ed87a1442124656097df39b14d0b981e285c6e0'
    before = b'orbit.pitch=phone?Math.max(.74,q.pitch):q.pitch;orbit.yaw=phone?.12:q.yaw;'
    after = b'orbit.pitch=phone?(q.phonePitch??Math.max(.74,q.pitch)):q.pitch;orbit.yaw=phone?(q.phoneYaw??.12):q.yaw;'
    assert old.count(before) == 1
    new = old.replace(before, after)
    assert hashlib.sha256(new).hexdigest() == '72c0c122faf05ae890c7022fe2d72fb7ea73131ebbec854e2f33c2744a0688aa'
    pending[file] = new
for file, data in pending.items():
    (root / file).write_bytes(data)
    print(hashlib.sha256(data).hexdigest(), file)
