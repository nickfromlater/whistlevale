"""Clean a Pixal3D surface and author an editable, weighted animal in Blender.
blender --background --python build-source.py -- zebra source.glb landmarks.json
Landmarks are explicit authored coordinates in Blender Z-up, facing +X.
"""
import bpy,bmesh,math,json,sys,hashlib
from pathlib import Path
from mathutils import Vector,Matrix
ROOT=Path(__file__).resolve().parents[2]
args=sys.argv[sys.argv.index('--')+1:];species,source,landmarks=args
SOURCE=Path(source);cfg=json.loads(Path(landmarks).read_text());OUT=ROOT/'models/safari-companions'/species;OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(SOURCE));objects=[o for o in bpy.context.scene.objects if o.type=='MESH']
bpy.ops.object.select_all(action='DESELECT')
for o in objects:o.select_set(True)
bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();skin=bpy.context.object;skin.name='Pixal3D '+species+' • weighted skin'
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
rotation=Matrix.Rotation(cfg['yaw'],3,'Z')
for v in skin.data.vertices:v.co=rotation@v.co
zmin=min(v.co.z for v in skin.data.vertices);zmax=max(v.co.z for v in skin.data.vertices);scale=cfg['height']/(zmax-zmin)
for v in skin.data.vertices:v.co=Vector((v.co.x*scale-cfg['center'][0],v.co.y*scale-cfg['center'][1],(v.co.z-zmin)*scale))
bm=bmesh.new();bm.from_mesh(skin.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00003)
unseen=set(bm.verts);remove=[]
while unseen:
 start=unseen.pop();stack=[start];group=[start]
 while stack:
  v=stack.pop()
  for e in v.link_edges:
   w=e.other_vert(v)
   if w in unseen:unseen.remove(w);stack.append(w);group.append(w)
 if len(group)<cfg.get('remove_fragments',12):remove.extend(group)
if remove:bmesh.ops.delete(bm,geom=remove,context='VERTS')
bmesh.ops.smooth_vert(bm,verts=list(bm.verts),factor=.10,use_axis_x=True,use_axis_y=True,use_axis_z=True)
bm.to_mesh(skin.data);bm.free();skin.data.update()
# Both species share a 100,000-expanded-vertex budget. Reduce only the
# reconstructed surface before weight painting; retain its UV loops and coat.
skin.data.calc_loop_triangles();triangles=len(skin.data.loop_triangles)
if triangles>16000:
 bpy.context.view_layer.objects.active=skin
 decimate=skin.modifiers.new('Delivery topology cleanup','DECIMATE');decimate.ratio=16000/triangles;decimate.use_collapse_triangulate=True
 bpy.ops.object.modifier_apply(modifier=decimate.name)
for face in skin.data.polygons:face.use_smooth=True
skin['companion_skin']=True;skin['source_sha256']=hashlib.sha256(SOURCE.read_bytes()).hexdigest();skin['landmarks_sha256']=hashlib.sha256(Path(landmarks).read_bytes()).hexdigest();skin['authoring_script_sha256']=hashlib.sha256(Path(__file__).read_bytes()).hexdigest();skin['reference_sha256']=hashlib.sha256((OUT/'reference.png').read_bytes()).hexdigest()
for material in skin.data.materials:
 bsdf=next(n for n in material.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
 for name,value in [('Metallic',0),('Roughness',.88)]:
  for link in list(bsdf.inputs[name].links):material.node_tree.links.remove(link)
  bsdf.inputs[name].default_value=value
 for node in material.node_tree.nodes:
  if node.type=='TEX_IMAGE' and node.image:node.image.pack()
arm=bpy.data.armatures.new(species.title()+' anatomical armature');rig=bpy.data.objects.new(species.title()+' • editable walk rig',arm);bpy.context.collection.objects.link(rig)
rig['companion_rig']=True;rig['walk_stride']=cfg['stride'];rig.show_in_front=True
bpy.context.view_layer.objects.active=rig;rig.select_set(True);skin.select_set(False);bpy.ops.object.mode_set(mode='EDIT');spec={}
def bone(name,head,tail,parent=None):
 b=arm.edit_bones.new(name);b.head=head;b.tail=tail
 if parent:b.parent=arm.edit_bones[parent]
 spec[name]=(Vector(head),Vector(tail),parent)
for row in cfg['bones']:bone(*row)
legs=cfg['legs']
for name,hip,knee,ankle in legs:
 bone(name,hip,knee,'body');bone(name+'.lower',knee,ankle,name);bone(name+'.hoof',ankle,(ankle[0]+.14,ankle[1],ankle[2]-.02),name+'.lower')
bpy.ops.object.mode_set(mode='OBJECT')
for name in spec:skin.vertex_groups.new(name=name)
def smooth(a,b,x):
 t=max(0,min(1,(x-a)/(b-a)));return t*t*(3-2*t)
def dist(p,a,b):
 q=b-a;t=max(0,min(1,(p-a).dot(q)/q.length_squared));return(p-a-t*q).length
for v in skin.data.vertices:
 p=v.co;x,y,z=p;weights={'body':1}
 # Anatomical regions have soft transitions; narrow structures are assigned
 # from explicit segment landmarks instead of automatic heat weights.
 if z<cfg['leg_blend'][1]:
  d,name,a,b,c=min((min(dist(p,Vector(hip),Vector(knee)),dist(p,Vector(knee),Vector(ankle))),name,Vector(hip),Vector(knee),Vector(ankle)) for name,hip,knee,ankle in legs)
  leg=(1-smooth(*cfg['leg_blend'],z))*(1-smooth(*cfg['leg_radius'],d));upper=smooth(b.z-.12,b.z+.12,z);hoof=1-smooth(c.z+.07,c.z+.24,z)
  weights={'body':1-leg,name:leg*upper,name+'.lower':leg*(1-upper)*(1-hoof),name+'.hoof':leg*(1-upper)*hoof}
 for region in cfg['regions']:
  # Each authored region is a box with feathered boundaries, used only for
  # weight painting. It never generates or replaces any surface geometry.
  amount=1
  for axis,(lo,hi,feather) in enumerate(region['box']):
   amount*=smooth(lo,lo+feather,p[axis])*(1-smooth(hi-feather,hi,p[axis]))
  if 'plane' in region:
   nx,ny,nz,lo,hi=region['plane'];amount*=smooth(lo,hi,nx*x+ny*y+nz*z)
  if amount>0:
   for key in weights:weights[key]*=1-amount
   candidates=[]
   for name in region['bones']:
    a,b,_=spec[name];candidates.append((dist(p,a,b),name))
   candidates.sort();best=candidates[:3];values=[1/(d+.05)**2 for d,_ in best];total=sum(values)
   for (_,name),w in zip(best,values):weights[name]=weights.get(name,0)+amount*w/total
 pairs=sorted(weights.items(),key=lambda q:-q[1])[:4];total=sum(w for _,w in pairs)
 for name,w in pairs:
  if w>1e-6:skin.vertex_groups[name].add([v.index],w/total,'REPLACE')
modifier=skin.modifiers.new('Weighted anatomical deformation','ARMATURE');modifier.object=rig;modifier.use_deform_preserve_volume=False;skin.parent=rig
# Soles are actual reconstructed mesh minima in each foot's weighted region.
def depth(b):return 0 if not b.parent else 1+depth(b.parent)
order=sorted(arm.bones,key=lambda b:(depth(b),b.name));ids={b.name:i for i,b in enumerate(order)}
feet=[]
for name,hip,knee,ankle in legs:
 group=skin.vertex_groups[name+'.hoof'].index
 points=[v.co for v in skin.data.vertices if any(g.group==group and g.weight>.5 for g in v.groups)]
 if not points:raise ValueError('No weighted sole for '+name)
 low=min(p.z for p in points);sole=[p for p in points if p.z<low+.025];center=sum(sole,Vector())/len(sole)
 feet.append({'bone':ids[name+'.hoof'],'position':[center.x,low,-center.y]})
rig['feet']=json.dumps(feet)
rig['landmarks']=json.dumps({name:[point[0],point[2],-point[1]] for name,point in cfg.get('surface_landmarks',{}).items()})
scene=bpy.context.scene;scene.render.fps=12 if species=='elephant' else 24;scene.frame_start=1;scene.frame_end=49;rig['browse_duration']=4 if species=='elephant' else 2
for p in rig.pose.bones:p.rotation_mode='QUATERNION'
def set_global(name,head,tail):
 rest=arm.bones[name];turn=(rest.tail_local-rest.head_local).normalized().rotation_difference((tail-head).normalized()).to_matrix().to_4x4()
 rig.pose.bones[name].matrix=Matrix.Translation(head)@turn@rest.matrix_local.to_3x3().to_4x4();bpy.context.view_layer.update()
for frame in range(1,50):
 scene.frame_set(frame);phase=(frame-1)/48;drop=Vector((0,0,-cfg.get('body_drop',.035)+.004*math.cos(phase*math.tau*2)))
 for name in spec:rig.pose.bones[name].matrix_basis=Matrix.Identity(4)
 bpy.context.view_layer.update();rig.pose.bones['body'].matrix=Matrix.Translation(drop)@arm.bones['body'].matrix_local;bpy.context.view_layer.update()
 for name,hip,knee,ankle in legs:
  a,b,c=map(Vector,(hip,knee,ankle));a+=drop;offset=(0 if name.endswith('.L') else .5)+(0 if name.startswith('front') else .18);clock=(phase+offset)%1;duty=.70;span=cfg['stride']*duty
  if clock<duty:step=span*(.5-clock/duty);lift=0
  else:u=(clock-duty)/(1-duty);step=-span*.5*math.cos(u*math.pi);lift=cfg['lift']*math.sin(u*math.pi)**2
  foot=c+Vector((step,0,lift));l1=(Vector(knee)-Vector(hip)).length;l2=(Vector(ankle)-Vector(knee)).length;delta=foot-a;distance=min(l1+l2-.0002,delta.length);direction=delta.normalized();axis=Vector((1,0,0));perpendicular=(axis-direction*axis.dot(direction)).normalized();along=(l1*l1+distance*distance-l2*l2)/(2*distance);height=math.sqrt(max(0,l1*l1-along*along));joint=a+direction*along+perpendicular*height*(1 if name.startswith('front') else -1)
  set_global(name,a,joint);set_global(name+'.lower',joint,foot);rig.pose.bones[name+'.hoof'].matrix=Matrix.Translation(foot)@arm.bones[name+'.hoof'].matrix_local.to_3x3().to_4x4();bpy.context.view_layer.update()
 for p in rig.pose.bones:p.keyframe_insert(data_path='location',frame=frame,group=p.name);p.keyframe_insert(data_path='rotation_quaternion',frame=frame,group=p.name)
walk=rig.animation_data.action;walk.name=species.title()+' four-beat walk • editable foot-path keys';walk.use_fake_user=True;rig['walk_action']=walk.name
rig.animation_data_clear()
def rotate_world(name,angle,axis):
 p=rig.pose.bones[name];origin=p.matrix.translation.copy();p.matrix=Matrix.Translation(origin)@Matrix.Rotation(angle,4,axis)@Matrix.Translation(-origin)@p.matrix;bpy.context.view_layer.update()
for frame in range(1,50):
 scene.frame_set(frame);phase=(frame-1)/48
 for name in spec:rig.pose.bones[name].matrix_basis=Matrix.Identity(4)
 bpy.context.view_layer.update()
 if species=='zebra':
  rotate_world('neck',cfg.get('graze_angle',1.0),'Y');rotate_world('neck.upper',cfg.get('graze_upper_angle',1.0),'Y');rotate_world('head',-cfg.get('graze_head_counter',1.25)+.018*math.sin(phase*math.tau*4),'Y')
 else:
  rotate_world('head',.045,'Y')
  # Solve a visible reach-and-scoop with the reconstructed trunk's actual
  # segment lengths. These become ordinary editable FK keys, not live IK.
  names=['trunk.'+str(i) for i in range(6)]
  points=[rig.pose.bones[name].head.copy() for name in names]+[rig.pose.bones[names[-1]].tail.copy()]
  lengths=[(b-a).length for a,b in zip(points,points[1:])];anchor=points[0].copy();tip=points[-1].copy()
  goal=Vector((tip.x+cfg.get('forage_sweep',.22)*math.sin(phase*math.tau),tip.y,cfg.get('forage_ground',.10)+cfg.get('forage_lift',.22)*(.5-.5*math.cos(phase*math.tau))))
  if (goal-anchor).length>sum(lengths)*.97:goal=anchor+(goal-anchor).normalized()*sum(lengths)*.97
  for _ in range(12):
   points[-1]=goal.copy()
   for i in range(5,-1,-1):points[i]=points[i+1]+(points[i]-points[i+1]).normalized()*lengths[i]
   points[0]=anchor.copy()
   for i in range(6):points[i+1]=points[i]+(points[i+1]-points[i]).normalized()*lengths[i]
  for i,name in enumerate(names):set_global(name,points[i],points[i+1])
 for side in ('L','R'):
  sign=1 if side=='L' else -1
  rotate_world('ear.'+side,sign*(.12 if species=='elephant' else .055)*math.sin(phase*math.tau),'Z' if species=='elephant' else 'X')
 rotate_world('tail',.12*math.sin(phase*math.tau*2),'X')
 for p in rig.pose.bones:p.keyframe_insert(data_path='location',frame=frame,group=p.name);p.keyframe_insert(data_path='rotation_quaternion',frame=frame,group=p.name)
browse=rig.animation_data.action;browse.name=species.title()+(' grazing' if species=='zebra' else ' trunk forage')+' • editable secondary motion';browse.use_fake_user=True;rig['browse_action']=browse.name
rig.animation_data.action=walk
if hasattr(walk,'slots') and len(walk.slots):rig.animation_data.action_slot=walk.slots[0]
scene.frame_set(1);rig['authoring']='Pixal3D surface and coat; Blender cleanup, anatomical weights, keyed four-beat walk and separate browse/forage action.'
bpy.ops.file.pack_all();bpy.context.view_layer.objects.active=rig;bpy.ops.wm.save_as_mainfile(filepath=str(OUT/('safari-'+species+'.blend')))
print('AUTHORED',species,len(arm.bones),'bones',len(skin.data.vertices),'skin vertices')
