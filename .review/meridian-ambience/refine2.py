from pathlib import Path
import json,hashlib
work=Path('/tmp/meridian-ambience-candidate');out=work/'evidence/ambience'
p=work/'src/grandhall-exhibits.js';s=p.read_text();old='view:{target:[0,7.0,0],distance:29,yaw:-.18,pitch:.23}';assert old in s;p.write_text(s.replace(old,'view:{target:[0,6.4,0],distance:23,yaw:-.18,pitch:.23}'))
expected=json.loads((out/'expected.json').read_text());expected['src/grandhall-exhibits.js']='dc1e6cd990ea3144b99cb574fa7baa58bcf2bf15249e330f273ce9028979d5c3'
for file,digest in expected.items():assert hashlib.sha256((work/file).read_bytes()).hexdigest()==digest,file
(out/'expected.json').write_text(json.dumps(expected,indent=2))
p=out/'build-preview.py';s=p.read_text();s=s.replace('||material===82','||m===82').replace('innerWidth<700?38:34','innerWidth<700?41:37').replace('let target=[0,6.7,0],','let target=[0,innerWidth<700?6.7:6.1,0],').replace("goal=which==='home'?[0,6.7,0]","goal=which==='home'?[0,innerWidth<700?6.7:6.1,0]");p.write_text(s)
p=out/'browser.cjs';s=p.read_text();s=s.replace("report.url=url;await page.goto", "await page.addInitScript(()=>{window.addEventListener('error',()=>{window.reviewError=true;});});report.url=url;await page.goto")
s=s.replace("'window.meridianReady===true'","'window.meridianReady===true||window.reviewError'").replace("'window.hallReady===true'","'window.hallReady===true||window.reviewError'").replace("report.ready=true;save();","if(report.errors.length)throw Error(report.errors.join(' / '));report.ready=true;save();")
p.write_text(s)
