"""Export a Pixal3D/Blender companion skin, coat, bones and editable actions.
Blender --background models/safari-companions/zebra/safari-zebra.blend --python-exit-code 1 --python models/safari-companions/export.py -- zebra
"""
import bpy,json,math,hashlib,base64,struct,sys
from pathlib import Path
from mathutils import Matrix
ROOT=Path(__file__).resolve().parents[2]
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
SPECIES=args[0] if args else 'zebra'
if SPECIES not in ('zebra','elephant'):raise ValueError('Expected zebra or elephant')
OUT=ROOT/'models/safari-companions'/SPECIES
OUT.mkdir(parents=True,exist_ok=True)
EVIDENCE=ROOT/'evidence/safari-companions'/SPECIES
EVIDENCE.mkdir(parents=True,exist_ok=True)
AXES=Matrix(((1,0,0,0),(0,0,1,0),(0,-1,0,0),(0,0,0,1)))
rig=next(o for o in bpy.data.objects if o.type=='ARMATURE' and o.get('companion_rig'))
objects=[o for o in bpy.data.objects if o.type=='MESH' and o.get('companion_skin')]
def depth(b):return 0 if not b.parent else 1+depth(b.parent)
bones=sorted(rig.data.bones,key=lambda b:(depth(b),b.name));boneids={b.name:i for i,b in enumerate(bones)}
if len(bones)>24:raise ValueError('Wildlife shader supports at most 24 bones')
def flatten(m):return [round(m[r][c],7) for c in range(4) for r in range(4)]
def trs(m):
    p,q,s=m.decompose()
    if any(abs(x-1)>1e-4 for x in s):raise ValueError('Apply rig scale; animated bone scale is unsupported')
    return [*[round(x,7) for x in p],round(q.x,7),round(q.y,7),round(q.z,7),round(q.w,7)]
records=[]
for bone in bones:
    rest=AXES@rig.matrix_world@bone.matrix_local@AXES.inverted()
    parent=AXES@rig.matrix_world@bone.parent.matrix_local@AXES.inverted() if bone.parent else Matrix.Identity(4)
    records.append({'name':bone.name,'parent':boneids.get(bone.parent.name) if bone.parent else None,'rest':trs(parent.inverted()@rest),'inverseBind':flatten(rest.inverted())})
vertices=[];indices=[];unique={};texture=None
rig.data.pose_position='REST';bpy.context.view_layer.update()
for obj in objects:
    for modifier in obj.modifiers:
        if modifier.type!='ARMATURE':raise ValueError('Apply mesh modifiers before exporting the weighted skin')
    mesh=obj.data;mesh.calc_loop_triangles()
    if not mesh.uv_layers.active:raise ValueError('The Pixal3D coat requires preserved UVs')
    mat=mesh.materials[0]
    nodes=[n for n in mat.node_tree.nodes if n.type=='TEX_IMAGE' and n.image]
    image=next((n.image for n in nodes if 'base' in n.name.lower()),nodes[0].image)
    if texture is not None and texture!=image:raise ValueError('Use one baked coat image')
    texture=image
    matrix=AXES@obj.matrix_world;normalmatrix=matrix.to_3x3().inverted().transposed()
    weights=[]
    for v in mesh.vertices:
        pairs=sorted([(boneids[obj.vertex_groups[g.group].name],g.weight) for g in v.groups if obj.vertex_groups[g.group].name in boneids and g.weight>1e-6],key=lambda q:-q[1])[:4]
        if not pairs:raise ValueError('Every skin vertex requires bone weights')
        total=sum(w for _,w in pairs);pairs=[(b,w/total) for b,w in pairs]
        pairs+=( [(0,0)]*(4-len(pairs)) );weights.append(pairs)
    for tri in mesh.loop_triangles:
        for loopid in tri.loops:
            loop=mesh.loops[loopid];pos=matrix@mesh.vertices[loop.vertex_index].co
            normal=(normalmatrix@mesh.corner_normals[loopid].vector).normalized();uv=mesh.uv_layers.active.data[loopid].uv
            skin=weights[loop.vertex_index]
            tint=mesh.color_attributes.get('Anatomical coat tint')
            color=tuple(max(0,c)**(1/2.2) for c in tint.data[loop.vertex_index].color[:3]) if tint else (1,1,1)
            v=tuple(round(x,6) for x in (*pos,*normal,*uv,*[i for i,w in skin],*[w for i,w in skin],*color))
            if not all(math.isfinite(x) for x in v):raise ValueError('Nonfinite exported skin')
            if v not in unique:unique[v]=len(vertices);vertices.append(v)
            indices.append(unique[v])
if len(indices)>60000:raise ValueError(f'{len(indices)} expanded vertices exceeds the unchanged 60000 limit')
# The coat is packed into the classic script, so portable HTML is self-contained.
if not texture.packed_file: texture.pack()
# Keep the original 4096 coat packed in the .blend; deliver a 2048 mipmapped
# copy to limit shared GPU texture storage on phones.
delivery=texture.copy();delivery.scale(2048,2048);delivery.file_format='JPEG'
delivery.filepath_raw=str(EVIDENCE/'pixal-coat-delivery.jpg');delivery.save(quality=95)
texturebytes=Path(delivery.filepath_raw).read_bytes()
rig.data.pose_position='POSE'
def action_frames(key):
    action=bpy.data.actions[rig[key]];rig.animation_data.action=action
    if hasattr(action,'slots') and len(action.slots):rig.animation_data.action_slot=action.slots[0]
    frames=[]
    for frame in range(1,50,2):
        bpy.context.scene.frame_set(frame);bpy.context.view_layer.update();row=[]
        for bone in bones:
            pose=rig.pose.bones[bone.name]
            world=AXES@rig.matrix_world@pose.matrix@AXES.inverted()
            parent=AXES@rig.matrix_world@pose.parent.matrix@AXES.inverted() if pose.parent else Matrix.Identity(4)
            row.append(trs(parent.inverted()@world))
        frames.append(row)
    return frames
frames=action_frames('walk_action');browse=action_frames('browse_action')
rig.animation_data.action=bpy.data.actions[rig['walk_action']]
if hasattr(rig.animation_data.action,'slots') and len(rig.animation_data.action.slots):rig.animation_data.action_slot=rig.animation_data.action.slots[0]
bpy.context.scene.frame_set(1)
pack=lambda fmt,values:base64.b64encode(struct.pack('<'+fmt*len(values),*values)).decode()
model={'format':'whistlevale-skinned-v1','source':'Pixal3D image-to-3D; Blender authored armature, weights and walk','bones':records,'vertices':len(vertices),'vertexData':pack('f',[v for row in vertices for v in row]),'indexData':pack('I',indices),'texture':'data:'+'image/jpeg'+';base64,'+base64.b64encode(texturebytes).decode(),'walk':{'frames':frames,'stride':float(rig['walk_stride'])},'browse':{'frames':browse,'duration':float(rig['browse_duration'])},'species':SPECIES,'landmarks':json.loads(rig['landmarks']),'feet':json.loads(rig['feet']),'bounds':[[round(min(v[i] for v in vertices),6),round(max(v[i] for v in vertices),6)] for i in range(3)]}
script="'use strict';\n// Pixal3D mesh, rigged in Blender for nickfromlater (MIT), with agent assistance.\n// Generated from models/safari-companions/"+SPECIES+"/safari-"+SPECIES+".blend; do not edit packed data.\nconst SAFARI_"+SPECIES.upper()+"_MODEL="+json.dumps(model,separators=(',',':'))+';\n'
path=ROOT/('src/scenery/safari-'+SPECIES+'-model.js');path.write_text(script)
report={'sourceGLBSHA256':objects[0]['source_sha256'],'landmarksSHA256':objects[0]['landmarks_sha256'],'referenceSHA256':objects[0]['reference_sha256'],'authoringScriptSHA256':objects[0]['authoring_script_sha256'],'exporterSHA256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'triangles':len(indices)//3,'bones':len(bones),'parts':1,'vertices':len(indices),'uniqueVertices':len(vertices),'textureSize':list(delivery.size),'authoringTextureSize':list(texture.size),'textureBytes':len(texturebytes),'sourceBytes':len(script.encode()),'sha256':hashlib.sha256(script.encode()).hexdigest(),'blendSHA256':hashlib.sha256(Path(bpy.data.filepath).read_bytes()).hexdigest(),'blenderVersion':bpy.app.version_string,'walkFrames':len(frames),'browseFrames':len(browse),'bounds':model['bounds']}
(OUT/'export-report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
