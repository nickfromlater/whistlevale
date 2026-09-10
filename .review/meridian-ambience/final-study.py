from pathlib import Path
import os,subprocess
work=Path(os.environ.get('WORKDIR','/tmp/meridian-ambience-candidate'));out=work/'evidence/ambience'
p=out/'build-preview.py';s=p.read_text()
s=s.replace('uniform vec3 eye;uniform float t,mood;', 'uniform vec3 eye;uniform vec2 resolution;uniform float t,mood;')
old="lit+=vec3(.025,.026,.025)*exp(-dot((p.xz-vec2(2,2))*.18,(p.xz-vec2(2,2))*.18))*.4;}"
new="""lit+=vec3(.025,.026,.025)*exp(-dot((p.xz-vec2(2,2))*.18,(p.xz-vec2(2,2))*.18))*.4;
  vec2 screen=gl_FragCoord.xy/resolution,q=screen-vec2(.52,.57);float glow=exp(-dot(q*vec2(2.0,1.4),q*vec2(2.0,1.4))*3.);
  vec3 backdrop=mix(vec3(.002,.006,.012),vec3(.011,.024,.042),glow);backdrop+=vec3(.003,.004,.003)*exp(-dot((screen-vec2(.65,.13))*3.,(screen-vec2(.65,.13))*3.));
  lit=mix(backdrop,lit,1.-smoothstep(9.,24.,length(p.xz)));frag=vec4(lit,1.);return;}"""
assert old in s;s=s.replace(old,new)
old="gl.uniform3fv(loc(main,'eye'),eye);val(main,'t',"
new="gl.uniform3fv(loc(main,'eye'),eye);gl.uniform2f(loc(main,'resolution'),W,H);val(main,'t',"
assert old in s;s=s.replace(old,new);p.write_text(s)
subprocess.run(['python3',str(p)],cwd=work,check=True)
