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

# Corrections from actual native stills. The same strict source/output checks
# apply; no file is written until the complete corrected revision is verified.
s=pending['src/rooms/briarwatch.js'].decode()
a=s.index('function briarGalleryCurtains(')
b=s.index('function briarGalleryBracket(',a)
t=s[a:b].replace('v-.71','v-.725').replace('40.95-v*38.3+.25*Math.sin(u*PI)','43.15-v*40.5+.15*Math.sin(u*PI)').replace("'#eed4a0',25","'#eed4a0',100").replace("'#f4dcaf',25","'#f4dcaf',100")
pending['src/rooms/briarwatch.js']=(s[:a]+t+s[b:]).encode()
s=pending['src/railway.js'].decode()
needle=' if(m==25.){em=3.0*uRoomLevel+.025;rough=.32;}'
assert s.count(needle)==1
s=s.replace(needle,needle+'\n // Large opal panels keep their detail without feeding sharp replicas into bloom.\n if(m==100.){em=.72*uRoomLevel+.015;rough=.48;}',1)
needle=' lit=mix(lit,uInvalid>.5?'
assert s.count(needle)==1
s=s.replace(needle,' if(m==100.)lit=min(lit,vec3(1.02));\n'+needle,1)
pending['src/railway.js']=s.encode()
s=pending['scripts/briarwatch-qa.mjs'].decode()
needle="  assert.equal(briarQASegmentHits(b,[x,24,0],[x,24,7]),0,'curtains leave the estate aperture clear');"
assert s.count(needle)==1
s=s.replace(needle,needle+"\n  assert.ok(b.data.some((v,i)=>i%12===1&&v>=43.17&&b.data[i+8]===23),'fabric pleats reach the actual curtain rail');",1)
needle=' const clockFace=new Builder();'
assert s.count(needle)==1
s=s.replace(needle," const opal=new Builder();briarGalleryLantern(opal,0,19);let opalVertices=0;for(let i=9;i<opal.data.length;i+=12){assert.notEqual(opal.data[i],25,'large lanterns do not use high-energy bulb material');if(opal.data[i]===100)opalVertices++;}assert.equal(opalVertices,54,'six opal panes and underside');\n"+needle,1)
needle=r'assert.match(atmosphereSource,/if\(m==99'
a=s.index(needle)
b=s.index('\n',a)
s=s[:b]+"\n"+r"assert.match(atmosphereSource,/if\(m==100\.\)lit=min\(lit,vec3\(1\.02\)\)/,'opal radiance stays below the sparse bloom extraction threshold');"+s[b:]
pending['scripts/briarwatch-qa.mjs']=s.encode()
final={
 'src/rooms/briarwatch.js':'d00f1171a5581674ef25ad8d15acd860bd212faeef2c7a96f66a262f54bb29c4',
 'src/railway.js':'7a83bb15aa2764e3eba5a0b0d1e5a971852ba5365e717c3cb2991e0648f2e1b3',
 'scripts/briarwatch-qa.mjs':'f26d37919df7f11408bb882b2b8ceb9d02cd8ff0d87cfebbba61a6442e48ad7f'
}
for name,after in pending.items():
    assert hashlib.sha256(after).hexdigest()==final[name],'Refined output mismatch: '+name
for name,after in pending.items():
    Path(name).write_bytes(after)
    print(hashlib.sha256(after).hexdigest(),name)
