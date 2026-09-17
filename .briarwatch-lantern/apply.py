from pathlib import Path
import base64, hashlib, json, zlib

allowed={'src/rooms/briarwatch.js','src/railway.js','scripts/briarwatch-qa.mjs'}
encoded=Path('.briarwatch-lantern/revision.b64').read_text().strip()
assert hashlib.sha256(encoded.encode()).hexdigest()=='0a7491d74f5cb3cce21050f8b66b01c3901668a07464b3f18a7c049c7fa82fda','Transfer checksum'
payload=json.loads(zlib.decompress(base64.b64decode(encoded,validate=True)))
assert set(payload)==allowed
pending={}
for name,entry in payload.items():
    before=Path(name).read_bytes()
    assert hashlib.sha256(before).hexdigest()==entry['before'],'Source changed: '+name
    lines=before.decode().splitlines(keepends=True)
    previous=len(lines)+1
    for edit in reversed(entry['edits']):
        a,b=edit['start'],edit['end']
        assert 0<=a<=b<previous
        previous=a
        lines[a:b]=[edit['text']]
    after=''.join(lines).encode()
    assert hashlib.sha256(after).hexdigest()==entry['after'],'Output mismatch: '+name
    pending[name]=after
for name,after in pending.items():
    Path(name).write_bytes(after)
    print(hashlib.sha256(after).hexdigest(),name)
