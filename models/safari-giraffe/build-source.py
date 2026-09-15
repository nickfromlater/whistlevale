"""Import the Pixal3D surface and author its editable Blender character rig.
Blender --background --python-exit-code 1 --python models/safari-giraffe/build-source.py -- [source.glb]
The generated source GLB is an authoring input, never a runtime dependency.
"""
import bpy,bmesh,math,json,sys,hashlib
from pathlib import Path
from mathutils import Vector,Matrix
ROOT=Path(__file__).resolve().parents[2]
(ROOT/'evidence/safari-giraffes').mkdir(parents=True,exist_ok=True)
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
SOURCE=Path(args[0]) if args else ROOT/'.dream-loop/pixal-export/giraffe-pixal3d.glb'
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(SOURCE))
objects=[o for o in bpy.context.scene.objects if o.type=='MESH']
bpy.ops.object.select_all(action='DESELECT')
for o in objects:o.select_set(True)
bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();skin=bpy.context.object;skin.name='Pixal3D giraffe • weighted skin'
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
# Align the generated diagonal animal to +X and retain the generated UV map.
# Fixed alignment is part of this asset's authoring recipe, not runtime magic.
angle=math.atan2(.79,-.613);rotation=Matrix.Rotation(-angle,3,'Z')
for v in skin.data.vertices:v.co=rotation@v.co
zmin=min(v.co.z for v in skin.data.vertices);zmax=max(v.co.z for v in skin.data.vertices)
scale=5.6/(zmax-zmin)
for v in skin.data.vertices:v.co=Vector((v.co.x*scale,v.co.y*scale,(v.co.z-zmin)*scale))
# Center the torso, not the bounding box (the head reaches forward of the chest).
body=[v.co for v in skin.data.vertices if 2.1<v.co.z<2.8];center=sum(body,Vector())/len(body)
for v in skin.data.vertices:v.co.x-=center.x;v.co.y-=center.y
# Surface reconstruction left tiny disconnected fragments near the feet.
# Preserve anatomical islands higher up; remove only small ground-level debris.
bm=bmesh.new();bm.from_mesh(skin.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00003);unseen=set(bm.verts);remove=[];components=[]
while unseen:
 start=unseen.pop();stack=[start];group=[start]
 while stack:
  v=stack.pop()
  for e in v.link_edges:
   w=e.other_vert(v)
   if w in unseen:unseen.remove(w);stack.append(w);group.append(w)
 components.append(len(group))
 if len(group)<200 and max(v.co.z for v in group)<1.9:remove.extend(group)
if remove:bmesh.ops.delete(bm,geom=remove,context='VERTS')
# Two light sculpt-smoothing passes remove reconstruction burrs without
# changing topology, UV seams, silhouette proportions or the triangle budget.
for _ in range(2):bmesh.ops.smooth_vert(bm,verts=list(bm.verts),factor=.22,use_axis_x=True,use_axis_y=True,use_axis_z=True)
bm.to_mesh(skin.data);bm.free();skin.data.update()
for face in skin.data.polygons:face.use_smooth=True
skin['giraffe_skin']=True;skin['source_sha256']=hashlib.sha256(SOURCE.read_bytes()).hexdigest()
# Keep a packed PNG base-color image in the editable file and native export.
material=skin.data.materials[0];bsdf=next(n for n in material.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
base=bsdf.inputs['Base Color'].links[0].from_node.image;base.name='Pixal3D generated giraffe coat';base.file_format='PNG'
base.filepath_raw=str(ROOT/'evidence/safari-giraffes/pixal-coat.png');base.save();base.pack()
bsdf.inputs['Metallic'].default_value=0
for link in list(bsdf.inputs['Metallic'].links):material.node_tree.links.remove(link)
bsdf.inputs['Roughness'].default_value=.88
for link in list(bsdf.inputs['Roughness'].links):material.node_tree.links.remove(link)
# Landmark inspection data is authoring evidence, never an app dependency.
points=[tuple(v.co) for v in skin.data.vertices]
(ROOT/'evidence/safari-giraffes/pixal-aligned-vertices.json').write_text(json.dumps(points))
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'evidence/safari-giraffes/pixal-aligned.blend'))
print('ALIGNED',len(points),'components',sorted(components,reverse=True)[:20])

# Anatomical FK armature. The foot paths are solved as two-link chains while
# authoring, then baked as ordinary editable transform keys on the bones.
# Runtime exports the evaluated action, not a second unrelated procedural walk.
arm=bpy.data.armatures.new('Giraffe anatomical armature');rig=bpy.data.objects.new('Giraffe • walking rig',arm);bpy.context.collection.objects.link(rig)
rig['giraffe_rig']=True;rig['walk_stride']=.55/.70;rig.show_in_front=True
bpy.context.view_layer.objects.active=rig;rig.select_set(True);skin.select_set(False);bpy.ops.object.mode_set(mode='EDIT')
spec={}
def bone(name,head,tail,parent=None):
 b=arm.edit_bones.new(name);b.head=head;b.tail=tail
 if parent:b.parent=arm.edit_bones[parent]
 spec[name]=(Vector(head),Vector(tail),parent)
 return b
bone('body',(0,0,2.4),(.65,0,2.65))
bone('neck',(.58,.02,2.8),(1.83,.05,4.91),'body')
bone('head',(1.83,.05,4.91),(2.5,.05,4.78),'neck')
bone('ear.L',(1.89,-.17,5.08),(1.80,-.42,5.16),'head')
bone('ear.R',(1.89,.24,5.08),(1.82,.47,5.16),'head')
bone('tail',(-.73,-.15,2.58),(-1.12,-.49,1.31),'body')
legs=[
 ('front.L',(.63,-.10,2.42),(.61,-.10,1.20),(.55,-.08,.115)),
 ('front.R',(.72,.32,2.42),(.93,.45,1.18),(1.04,.55,.115)),
 ('hind.L',(-.55,-.28,2.37),(-.78,-.30,1.43),(-.99,-.30,.115)),
 ('hind.R',(-.55,.27,2.37),(-.69,.35,1.34),(-.52,.58,.115))]
for name,hip,knee,ankle in legs:
 bone(name,hip,knee,'body');bone(name+'.lower',knee,ankle,name);bone(name+'.hoof',ankle,(ankle[0]+.18,ankle[1],ankle[2]-.03),name+'.lower')
bpy.ops.object.mode_set(mode='OBJECT')
for name in spec:skin.vertex_groups.new(name=name)
def smooth(a,b,x):
 t=max(0,min(1,(x-a)/(b-a)));return t*t*(3-2*t)
def segment_distance(p,a,b):
 q=b-a;t=max(0,min(1,(p-a).dot(q)/q.length_squared));return (p-a-t*q).length
for v in skin.data.vertices:
 p=v.co;x,y,z=p;weights={}
 # Each leg has its own anatomical corridor; smooth transitions retain skin
 # continuity through shoulder, haunch, knee and fetlock.
 if z<2.55:
  candidates=[]
  for name,hip,knee,ankle in legs:
   a,b,c=map(Vector,(hip,knee,ankle));d=min(segment_distance(p,a,b),segment_distance(p,b,c))
   candidates.append((d,name,a,b,c))
  d,name,a,b,c=min(candidates,key=lambda q:q[0])
  leg=1-smooth(1.92,2.55,z)
  if x<-.95 and y<-.34 and z>1.18:
   tail=smooth(-.92,-1.1,x)*smooth(-.28,-.48,y)*smooth(1.05,1.35,z)
  else:tail=0
  upper=smooth(b.z-.15,b.z+.17,z);hoof=1-smooth(.21,.41,z)
  weights[name]=leg*upper*(1-tail);weights[name+'.lower']=leg*(1-upper)*(1-hoof)*(1-tail);weights[name+'.hoof']=leg*(1-upper)*hoof*(1-tail)
  weights['tail']=tail;weights['body']=(1-leg)*(1-tail)
 else:
  neck=smooth(2.62,3.18,z);head=smooth(4.67,4.91,z)
  weights={'body':1-neck,'neck':neck*(1-head),'head':neck*head}
  if z>4.96 and abs(y-.05)>.15:
   ear=smooth(.15,.32,abs(y-.05))*smooth(4.96,5.09,z)*(1-smooth(5.22,5.34,z))
   weights['head']*=1-ear;weights['ear.L' if y<.05 else 'ear.R']=ear
  if x<-.6 and z<2.84:weights={'body':.7,'tail':.3}
 total=sum(weights.values())
 for name,w in weights.items():
  if w>1e-6:skin.vertex_groups[name].add([v.index],w/total,'REPLACE')
modifier=skin.modifiers.new('Weighted anatomical deformation','ARMATURE');modifier.object=rig;modifier.use_deform_preserve_volume=False
skin.parent=rig
# Editable vertex paint restores dark mane and ossicone tips where image-to-3D
# left pale reconstruction speckles. The source coat and its UVs stay intact.
tint=skin.data.color_attributes.new(name='Anatomical coat tint',type='FLOAT_COLOR',domain='POINT')
for v in skin.data.vertices:
 x,y,z=v.co;dark=0
 if z>5.30:dark=smooth(5.30,5.43,z)
 # A narrow dorsal strip from the withers to the poll follows the neck's
 # actual rear silhouette, rather than putting a line through its flank.
 if 3.1<z<4.9:
  profile=[(3.1,-.17),(3.3,.28),(3.5,.46),(3.7,.75),(3.9,.96),(4.1,1.11),(4.3,1.21),(4.5,1.33),(4.7,1.44),(4.9,1.57)]
  a,b=next((a,b) for a,b in zip(profile,profile[1:]) if a[0]<=z<=b[0])
  back=a[1]+(b[1]-a[1])*(z-a[0])/(b[0]-a[0])
  dark=max(dark,(1-smooth(back+.045,back+.13,x))*.98)
 tint.data[v.index].color=(1-dark*.96,1-dark*.968,1-dark*.975,1)
attr=material.node_tree.nodes.new('ShaderNodeVertexColor');attr.layer_name=tint.name
texnode=bsdf.inputs['Base Color'].links[0].from_node
mix=material.node_tree.nodes.new('ShaderNodeMixRGB');mix.blend_type='MULTIPLY';mix.inputs[0].default_value=1
material.node_tree.links.new(texnode.outputs['Color'],mix.inputs[1]);material.node_tree.links.new(attr.outputs['Color'],mix.inputs[2]);material.node_tree.links.new(mix.outputs[0],bsdf.inputs['Base Color'])
# Save foot sole markers in native axes for terrain contact at runtime.
def depth(b):return 0 if not b.parent else 1+depth(b.parent)
order=sorted(arm.bones,key=lambda b:(depth(b),b.name));ids={b.name:i for i,b in enumerate(order)}
rig['feet']=json.dumps([{'bone':ids[name+'.hoof'],'position':[ankle[0],.015,-ankle[1]]} for name,hip,knee,ankle in legs])
scene=bpy.context.scene;scene.render.fps=24;scene.frame_start=1;scene.frame_end=49
for p in rig.pose.bones:p.rotation_mode='QUATERNION'
def set_global(name,head,tail):
 rest=arm.bones[name];direction=(tail-head).normalized();original=(rest.tail_local-rest.head_local).normalized()
 turn=original.rotation_difference(direction).to_matrix().to_4x4();matrix=Matrix.Translation(head)@turn@rest.matrix_local.to_3x3().to_4x4()
 rig.pose.bones[name].matrix=matrix;bpy.context.view_layer.update()
for frame in range(1,50):
 scene.frame_set(frame);phase=(frame-1)/48;drop=Vector((0,0,-.072+.006*math.cos(phase*math.tau*2)))
 for name in spec:
  p=rig.pose.bones[name];p.matrix_basis=Matrix.Identity(4)
 bpy.context.view_layer.update();rig.pose.bones['body'].matrix=Matrix.Translation(drop)@arm.bones['body'].matrix_local;bpy.context.view_layer.update()
 for index,(name,hip,knee,ankle) in enumerate(legs):
  a,b,c=map(Vector,(hip,knee,ankle));a+=drop
  offset=(0 if name.endswith('.L') else .5)+(0 if name.startswith('front') else .18)
  clock=(phase+offset)%1;duty=.70
  if clock<duty:step=.275*(1-2*clock/duty);lift=0
  else:
   u=(clock-duty)/(1-duty);step=-.275*math.cos(u*math.pi);lift=.13*math.sin(u*math.pi)**2
  foot=c+Vector((step,0,lift));l1=(Vector(knee)-Vector(hip)).length;l2=(Vector(ankle)-Vector(knee)).length
  delta=foot-a;distance=min(l1+l2-.0002,delta.length);direction=delta.normalized()
  # A forward-bending carpal joint and backward-bending hind hock produce
  # the characteristic long, measured giraffe step.
  axis=Vector((1,0,0));perpendicular=(axis-direction*axis.dot(direction)).normalized()
  along=(l1*l1+distance*distance-l2*l2)/(2*distance);height=math.sqrt(max(0,l1*l1-along*along))
  joint=a+direction*along+perpendicular*height*(1 if name.startswith('front') else -1)
  set_global(name,a,joint);set_global(name+'.lower',joint,foot)
  rig.pose.bones[name+'.hoof'].matrix=Matrix.Translation(foot)@arm.bones[name+'.hoof'].matrix_local.to_3x3().to_4x4();bpy.context.view_layer.update()
 for p in rig.pose.bones:
  p.keyframe_insert(data_path='location',frame=frame,group=p.name);p.keyframe_insert(data_path='rotation_quaternion',frame=frame,group=p.name)
if rig.animation_data and rig.animation_data.action:rig.animation_data.action.name='Measured four-beat walk • planted stance and recovery'
scene.frame_set(1);rig['authoring']='Pixal3D source mesh, Blender cleanup, anatomical vertex paint, 18-bone weighted FK rig and solved foot-path walk.'
# Preserve the imported coat inside the .blend; no external texture paths needed.
bpy.ops.file.pack_all();bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'models/safari-giraffe/safari-giraffe.blend'))
print('RIGGED',len(arm.bones),'bones',len(skin.data.vertices),'vertices')
