from pathlib import Path
import hashlib

root=Path('.')
work=root/'.briarwatch-atmosphere'
expected={
 'src/rooms/briarwatch.js':('7d86f7cd58eb6de9695aa6e0ba093bc33cca0832abcb63fca653d82a065581a1','3f30c7663be92635bd6767d4e99b66fee345504c9f08f39290ed334755306d30'),
 'src/railway.js':('901d91ec21229208dbaf6708eb2dc59b84dc48444e672bc18d328ace11c39435','b0bfa3aa2ab1c14a96c1e15b52649a6bd1b73e15cbff69e80bd3cd3a03dd0813'),
 'scripts/briarwatch-qa.mjs':('4971d84bb1718399d3556df876068b76cdaa61b23dadb81f685c8657a3436e13','b5735cfa7cf9cb386a23af72b5e60992d6f7780cb0919090ac776786a939e1be')
}
for name,digest in {'geometry.js':'076b5b056954ca483da606168283be76b35d7e5936d48f903fc6922a07af2e0a','shader.js':'6aef95c3d02ee33dfc6cf72b5e1c9648dfde94d1ecbc69516e4b2a84e7e0063e','tests.js':'12ac2e7f6e269af2800d6bc55596dca9f92d845ae81fb9f60f40f468eaea5d14'}.items():
 assert hashlib.sha256((work/name).read_bytes()).hexdigest()==digest,name
original={name:(root/name).read_text() for name in expected}
for name,s in original.items():assert hashlib.sha256(s.encode()).hexdigest()==expected[name][0],name
revised={}
s=original['src/rooms/briarwatch.js']
s=s.replace('function briarShell(b){',(work/'geometry.js').read_text()+'\nfunction briarShell(b){',1)
a=s.index('   for(const x of[-42,42]){',s.index('function briarShell(b){'));z=s.index('   // A restrained heraldic',a)
s=s[:a]+"   for(const [i,x]of[-42,42].entries())briarEstateOutlook(w,x,i);\n"+s[z:]
s=s.replace('   w.box(x,14,.82,.72,58.2,.72',"   if(back&&Math.abs(Math.abs(x)-42)<12)continue;\n   w.box(x,14,.82,.72,58.2,.72",1)
s=s.replace('  w.pop();walls.push({which,mesh:w.mesh()});','  briarGalleryReceiver(w,which,pos,angle);w.pop();walls.push({which,mesh:w.mesh()});',1)
s=s.replace(' b.box(0,FLOOR+.018,51,53',' for(const x of[-24,24])briarReadingLamp(b,x,56);\n b.box(0,FLOOR+.018,51,53',1)
s=s.replace('[-42,17,-62],[42,17,-62]','[-24,-14.1,56],[24,-14.1,56]')
revised['src/rooms/briarwatch.js']=s
s=original['src/railway.js']
a=s.index('void main(){float m=floor(vMat+.5);');s=s[:a]+(work/'shader.js').read_text()+s[a:]
s=s.replace(' if(m==1.||m==11.){rough=.3;metal=.72;}',''' if(m==92.){frag=vec4(briarEstateSky(vUV,dusk,deepNight),1.);return;}
 if(m==93.){vec3 a=pow(max(base,vec3(0.)),vec3(2.2));vec3 day=a*(.54+max(n.y,0.)*.42+max(n.z,0.)*.18);vec3 dark=a*vec3(.055,.11,.17)+vec3(.003,.008,.010);frag=vec4(mix(day,dark,dusk),1.);return;}
 if(m==98.){frag=vec4(mix(pow(base,vec3(2.2))*.12,vec3(.78,.39,.10),dusk),1.);return;}
 if(m==1.||m==11.){rough=.3;metal=.72;}''',1)
s=s.replace(' if(m==20.){base*=',' if(m==20.||(m>=94.&&m<=96.)){base*=',1)
s=s.replace(' if(dusk>.01){for(int i=0;i<8;i++){',''' // Stylized surface light, not extra shadow-casting lights. The real six
 // practical lamps still illuminate the scene and the dimmer drives both.
 if(m>=94.&&m<=96.)lit+=albedo*vec3(1.,.54,.23)*briarPracticalWash(m,vUV)*uRoomLevel*2.0;
 if(dusk>.01){for(int i=0;i<8;i++){''',1)
revised['src/railway.js']=s
s=original['scripts/briarwatch-qa.mjs'];needle="Object.assign(report,state.run(`(()=>{\n const s=getHouseScene('briarwatch'),part="
assert needle in s;s=s.replace(needle,(work/'tests.js').read_text()+'\n'+needle,1);revised['scripts/briarwatch-qa.mjs']=s
for name,s in revised.items():assert hashlib.sha256(s.encode()).hexdigest()==expected[name][1],name
for name,s in revised.items():(root/name).write_text(s);print(expected[name][1],name)
# Append design notes without replacing prior credits or review limitations.
p=root/'docs/rooms/briarwatch.md'
p.write_text(p.read_text()+'''
## Estate outlooks and lamplight

The two rear windows now contain different shallow, forced-perspective estate
scenes with layered hills, trees, a lodge or garden pavilion, and a foreground
stone balustrade. Clear arched casements use the existing sorted architectural
glazing pass. The outlooks stay inside the room footprint and share the back
wall cutaway and disposal lifecycle; they are not a navigable outdoor world.

Opt-in materials 92/93/98 keep exterior sky, scenery and cottage windows
independent of the gallery dimmer. Daylight fades into a blue-hour sky with a
still crescent and sparse stars. The native six-light rig remains; its two task
lights now coincide with modeled reading lamps beside the benches. Materials
94/95/96 add a stylized, dimmable light wash to the gallery plaster using local
UVs, so it remains attached in the transformed house map. This is authored
surface lighting, not extra shadow-casting lamps or volumetric scattering.

No new textures, atlas slots, dependencies, uniforms or per-frame geometry.
The castle, scenery, railway, cameras, automatic lighting settings and global
mood presets are unchanged. The existing 900,000 static-vertex ceiling remains,
with an additional 40,000-vertex ceiling across the four room-wall meshes.
''')
