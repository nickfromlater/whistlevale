from pathlib import Path
import base64, hashlib, json, sys, zlib

name=sys.argv[1]
assert name in ('stage1','stage2','polish')
encoded=Path('.briarwatch-field/'+name+'.b64').read_text().strip()
if name=='stage1':
    # Correct one duplicated transfer character; the tested output hashes remain mandatory.
    encoded=encoded.replace('PL6IXXc8','PL6IXc8')
    assert hashlib.sha256(encoded.encode()).hexdigest()=='e9659dbb137d57b5d4ce3def56d1aa29d8d415c838c82d81de4c1e0cae612c24'
payload=json.loads(zlib.decompress(base64.b64decode(encoded,validate=True)))
allowed={'src/rooms/briarwatch.js','src/rooms/briarwatch-village.js','src/trains.js','scripts/briarwatch-qa.mjs','docs/rooms/briarwatch.md'}
assert payload and set(payload)<=allowed
pending={}
for filename,entry in payload.items():
    before=Path(filename).read_bytes()
    assert hashlib.sha256(before).hexdigest()==entry['before'],'Source changed: '+filename
    lines=before.decode().splitlines(keepends=True)
    previous=len(lines)+1
    for edit in reversed(entry['edits']):
        a,z=edit['a'],edit['z']
        assert 0<=a<=z<previous,'Overlapping edits'
        previous=a
        lines[a:z]=[edit['text']]
    after=''.join(lines).encode()
    assert hashlib.sha256(after).hexdigest()==entry['after'],'Output mismatch: '+filename
    pending[filename]=after
for filename,after in pending.items():
    Path(filename).write_bytes(after)
    print(hashlib.sha256(after).hexdigest(),filename,flush=True)
