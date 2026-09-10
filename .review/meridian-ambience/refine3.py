from pathlib import Path
import json,hashlib
work=Path('/tmp/meridian-ambience-candidate');out=work/'evidence/ambience'
p=work/'src/scenery/meridian-observatory.js';s=p.read_text()
for old,new in [('if(j>0){vertex(a,t);vertex(a,v);vertex(c,t);}','if(j>0){vertex(a,t);vertex(c,t);vertex(a,v);}'),('if(j<rings-1){vertex(c,t);vertex(a,v);vertex(c,v);}','if(j<rings-1){vertex(c,t);vertex(c,v);vertex(a,v);}')]:
 assert old in s;s=s.replace(old,new)
p.write_text(s)
p=work/'scripts/meridian-celestial-qa.mjs';s=p.read_text();needle=' const nested=new Builder();';assert needle in s
regression=""" // Explicit spherical normals must agree with triangle winding, otherwise
 // two-sided renderer lighting reverses them and leaves the worlds black.
 for(let i=0;i<b.data.length;i+=36){if(b.data[i+9]!==81)continue;
  const a=b.data.slice(i,i+3),c=b.data.slice(i+12,i+15),d=b.data.slice(i+24,i+27),normal=add(add(b.data.slice(i+3,i+6),b.data.slice(i+15,i+18)),b.data.slice(i+27,i+30));
  assert.ok(dot(cross(sub(c,a),sub(d,a)),normal)>0,'planet faces point outward in both renderers');
 }
"""
p.write_text(s.replace(needle,regression+needle))
expected=json.loads((out/'expected.json').read_text())
expected['src/scenery/meridian-observatory.js']='6985d6d1639c817924d00ad771900e0c5c6bb286c47fe8478f4c3af64aca7013'
expected['scripts/meridian-celestial-qa.mjs']='e968de3d5de3ef60ec726045ca93f9e0a23d4a608fa21b778f17b154b91520f8'
for file,digest in expected.items():assert hashlib.sha256((work/file).read_bytes()).hexdigest()==digest,file
(out/'expected.json').write_text(json.dumps(expected,indent=2))
