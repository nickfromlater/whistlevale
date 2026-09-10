"""Author The Night Post in Blender. Run explicitly; never part of the app/build.
Original concept and model for nickfromlater, with Codex assistance. MIT.
The saved .blend is editable independently of this authoring recipe.
"""
import bpy
import math
from mathutils import Vector
from pathlib import Path
from math import sin, cos, pi

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'models/night-post'
EVIDENCE = ROOT / 'evidence/night-post'
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'
collections = {}
for name in ['EXPORT', 'STUDIO']:
    c = bpy.data.collections.new(name); scene.collection.children.link(c); collections[name] = c
for name in ['01 Architecture', '02 Iron and glass', '03 Clockwork', '04 Postal works', '05 Railway', '06 Yesterday', '07 The Moon', '08 Home Again', '09 Typography']:
    c = bpy.data.collections.new(name); collections['EXPORT'].children.link(c); collections[name] = c
current = '01 Architecture'
materials = {}

def linear(v):
    return v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4

def mat(name, color, native=0, metal=0, rough=.4, emission=0, glass=False):
    rgb = tuple(linear(int(color[i:i+2], 16) / 255) for i in (1, 3, 5))
    m = bpy.data.materials.new(name); m.diffuse_color = (*rgb, 1)
    m['whistlevale_material'] = native
    m.use_nodes = True; bs = m.node_tree.nodes.get('Principled BSDF')
    bs.inputs['Base Color'].default_value = (*rgb, 1)
    bs.inputs['Metallic'].default_value = metal; bs.inputs['Roughness'].default_value = rough
    if emission:
        bs.inputs['Emission Color'].default_value = (*rgb, 1); bs.inputs['Emission Strength'].default_value = emission
    if glass:
        bs.inputs['Transmission Weight'].default_value = .8; bs.inputs['IOR'].default_value = 1.45
        bs.inputs['Roughness'].default_value = .12
    materials[name] = m; return m

mat('Midnight enamel', '#173846', 0, .45, .28)
mat('Deep petrol', '#0e222e', 0, .15, .43)
mat('Oxidised teal', '#427d7b', 41, .55, .4)
mat('Old brass', '#c9a45e', 41, .78, .26)
mat('Light brass', '#e8c47d', 41, .6, .26)
mat('Warm limestone', '#d1c4a9', 23, 0, .78)
mat('Ivory', '#f5e1b7', 23, 0, .5)
mat('Burgundy mail', '#8e3340', 0, .3, .34)
mat('Oxblood edge', '#481f2c', 0, .2, .4)
mat('Walnut', '#543b37', 22, .1, .65)
mat('Dark steel', '#2b343b', 41, .75, .45)
mat('Amber light', '#ffb758', 10, .15, .28, 3)
mat('Moon light', '#addef0', 10, 0, .55, 1.1)
mat('Window blue', '#72b6c1', 76, .08, .15, glass=True)
mat('Moon stone', '#93aeb7', 23, .1, .7)
mat('Lunar dark', '#405867', 23, 0, .9)
mat('Night sky', '#112b46', 0, .05, .65)
mat('Autumn ochre', '#c6853e', 23, 0, .8)
mat('Autumn red', '#ad5140', 23, 0, .85)
mat('Moss', '#617c69', 23, 0, .85)
mat('Letter cream', '#f3dfb5', 23, 0, .8)
mat('Ink', '#273e47', 23, 0, .7)
mat('Parcel kraft', '#aa7850', 23, 0, .8)
mat('Dusk lavender', '#7c7f97', 23, 0, .8)
mat('Rain silver', '#9ac4c8', 41, .35, .4)

def own(o, name, material=None, group=None):
    o.name = name
    for c in list(o.users_collection): c.objects.unlink(o)
    collections[group or current].objects.link(o)
    if material: o.data.materials.append(materials[material])
    return o

def bevel(o, width=.035, segments=1):
    mod = o.modifiers.new('Small crafted edge', 'BEVEL'); mod.width = width; mod.segments = segments
    return o

def box(name, loc, dims, material, edge=0, rot=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc); o = own(bpy.context.object, name, material)
    o.scale = dims; bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if rot: o.rotation_euler = rot
    if edge and min(dims)>.12 and max(dims)>1.5: bevel(o, edge)
    return o

def cyl(name, loc, radius, depth, material, vertices=16, rotation=None, r2=None):
    if radius<.25: vertices=min(vertices,8)
    if r2 is None:
        bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc)
    else:
        bpy.ops.mesh.primitive_cone_add(vertices=vertices, radius1=radius, radius2=r2, depth=depth, location=loc)
    o = own(bpy.context.object, name, material)
    if rotation: o.rotation_euler = rotation
    return o

def sphere(name, loc, scale, material, segments=12, rings=6):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1 if max(scale)<.3 else 2, radius=1, location=loc)
    o = own(bpy.context.object, name, material); o.scale = scale
    for p in o.data.polygons: p.use_smooth = True
    return o

def mesh(name, verts, faces, material):
    data = bpy.data.meshes.new(name); data.from_pydata(verts, [], faces); data.update()
    o = bpy.data.objects.new(name, data); collections[current].objects.link(o); data.materials.append(materials[material]); return o

def line(name, points, radius, material, sides=6, closed=False):
    if len(points)>20:
        points=points[::2] + ([points[-1]] if (len(points)-1)%2 else [])
    # An editable poly curve, evaluated to a small round-section mesh on export.
    data = bpy.data.curves.new(name, 'CURVE'); data.dimensions='3D'; data.resolution_u=1
    data.bevel_depth=radius; data.bevel_resolution=0; data.resolution_u=1; data.use_fill_caps=True
    sp=data.splines.new('POLY'); sp.points.add(len(points)-1)
    for p, co in zip(sp.points, points): p.co=(*co, 1)
    sp.use_cyclic_u=closed
    o=bpy.data.objects.new(name,data); collections[current].objects.link(o); data.materials.append(materials[material]);return o

def beam(name, a, b, radius, material, sides=6):
    a,b=Vector(a),Vector(b);o=cyl(name,(a+b)/2,radius,(b-a).length,material,min(sides,4) if radius<.04 else sides)
    o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler();return o

def ring(name, center, radius, tube, material, segments=40, plane='XZ', start=0, end=2*pi):
    cx,cy,cz=center;pts=[]
    for i in range(segments+1):
        t=start+(end-start)*i/segments
        pts.append((cx+radius*cos(t),cy,cz+radius*sin(t)) if plane=='XZ' else (cx+radius*cos(t),cy+radius*sin(t),cz))
    return line(name,pts,tube,material)

def text(name, body, loc, size, material='Ivory', extrude=.003, align='CENTER'):
    data=bpy.data.curves.new(name,'FONT');data.body=body;data.size=size;data.align_x=align;data.align_y='CENTER';data.extrude=0;data.resolution_u=2
    o=bpy.data.objects.new(name,data);collections[current].objects.link(o);data.materials.append(materials[material]);o.location=loc;o.rotation_euler=(pi/2,0,0);return o

def empty(name, loc, group=None):
    o=bpy.data.objects.new(name,None);collections[group or current].objects.link(o);o.location=loc;return o

def parent_keep(objects, parent):
    bpy.context.view_layer.update()
    for o in objects:
        matrix=o.matrix_world.copy();o.parent=parent;o.matrix_world=matrix

def pointlight(name, loc, color, power, radius=.3):
    data=bpy.data.lights.new(name,'POINT');data.energy=power;data.color=color;data.shadow_soft_size=radius
    o=bpy.data.objects.new(name,data);collections['STUDIO'].objects.link(o);o.location=loc;return o

# A jewel-box foundation, with a deliberately open front and supported steps.
box('Floating workshop foundation',(0,0,.25),(16,10.7,.5),'Deep petrol',.16)
box('Brass foundation reveal',(0,0,.54),(15.85,10.55,.09),'Old brass',.035)
box('Limestone station floor',(0,0,.67),(15.6,10.3,.18),'Warm limestone',.07)
box('Inset concourse paving',(0,.15,.78),(12.9,7.9,.08),'Midnight enamel')
for x in [-6.3,0,6.3]: box('Concourse brass inlay',(x,0,.825),(.025,7.6,.012),'Old brass')
for y in [-3.65,0,3.65]: box('Cross inlay',(0,y,.825),(12.6,.025,.012),'Old brass')
for i in range(3):
    box('Entry stair '+str(i),(0,-5.2+.21*i,.16+.14*i),(5.8-.32*i,.8-.1*i,.25+.28*i),'Warm limestone',.04)
# Back facade is open around three great circular destination apertures.
for x in [-7.45,-2.5,2.5,7.45]:
    box('Portal supporting pier',(x,3.76,2.95),(.38,.65,4.35),'Midnight enamel',.05)
    box('Pier foot',(x,3.76,1.02),(.62,.9,.46),'Warm limestone',.04)
    box('Pier capital',(x,3.76,5.06),(.67,.94,.18),'Old brass',.025)
box('Destination entablature',(0,3.8,5.32),(15.35,.72,.38),'Midnight enamel',.05)
box('Cornice brass line',(0,3.38,5.39),(15.45,.08,.09),'Light brass')
for x in [-7.65,7.65]:
    box('Tower footing',(x,2.7,.88),(.7,1.2,.26),'Warm limestone',.025)
    box('Corner clockwork tower',(x,2.7,4.3),(.6,1.1,6.7),'Midnight enamel',.06)
    for z,w in [(6.5,.8),(7.05,.64),(7.42,.44)]: box('Tower stepped crown',(x,2.7,z),(w,1.2 if z<7 else .9,.26),'Old brass',.025)
    sphere('Tower finial',(x,2.7,7.75),(.18,.18,.26),'Light brass')

# The train-shed roof is a shallow barrel vault; front stays open for inspection.
current='02 Iron and glass'
for y in [-2.1,.2,2.5]:
    for x in [-6.25,6.25]:
        cyl('Cast iron column',(x,y,3.0),.115,4.3,'Midnight enamel',12)
        cyl('Column brass base',(x,y,1.05),.24,.34,'Old brass',12)
        cyl('Column capital',(x,y,5.05),.24,.18,'Old brass',12)
        beam('Knee brace',(x,y,4.25),(x-math.copysign(.75,x),y,5.17),.07,'Old brass')
    points=[(6.25*cos(pi*i/28),y,5.1+2.35*sin(pi*i/28)) for i in range(29)]
    line('Vault structural rib',points,.095,'Midnight enamel')
    points2=[(6.25*cos(pi*i/28),y-.02,5.1+2.35*sin(pi*i/28)+.14) for i in range(29)]
    line('Vault brass cap',points2,.035,'Old brass')
# Limited panes leave the front and central clock readable, like a roof cutaway.
for j in range(12):
    a=pi*j/12;b=pi*(j+1)/12
    for y0,y1 in [(.28,2.42),(-2.02,.12)]:
        # Omit the two front centre panes intentionally for the cutaway.
        if y0<0 and j in [5,6]: continue
        mesh('Blue vault glazing',[(6.23*cos(a),y0,5.1+2.35*sin(a)),(6.23*cos(b),y0,5.1+2.35*sin(b)),(6.23*cos(b),y1,5.1+2.35*sin(b)),(6.23*cos(a),y1,5.1+2.35*sin(a))],[(0,1,2,3)],'Window blue')
    line('Longitudinal roof seam',[(6.25*cos(a),-2.12,5.1+2.35*sin(a)+.025),(6.25*cos(a),2.53,5.1+2.35*sin(a)+.025)],.028,'Old brass')
line('Ridge spine',[(0,-2.45,7.52),(0,2.8,7.52)],.07,'Light brass')
for x in [-6.25,6.25]:
    line('Eave gutter',[(x,-2.4,5.13),(x,2.85,5.13)],.08,'Old brass')
# Front arch carries the title, tiny brass stars and a suspended timepiece.
current='09 Typography'
box('Station enamel nameplate',(0,-2.24,7.78),(6.6,.22,.62),'Midnight enamel',.065)
box('Nameplate lower trim',(0,-2.385,7.48),(6.65,.035,.045),'Old brass')
text('The Night Post title','T H E   N I G H T   P O S T',(0,-2.38,7.81),.38,'Ivory')
text('Station motto','LETTERS BEYOND TIME',(0,-2.39,7.58),.103,'Light brass',0)

current='03 Clockwork'
beam('Clock suspension', (0,-2.16,7.45),(0,-2.16,6.84),.065,'Old brass')
cyl('Clock bronze housing',(0,-2.14,5.86),1.11,.23,'Old brass',48,(pi/2,0,0))
cyl('Clock ink dial',(0,-2.29,5.86),.98,.045,'Deep petrol',48,(pi/2,0,0))
ring('Clock outer bezel',(0,-2.35,5.86),1.025,.055,'Light brass',48)
ring('Clock inner minute track',(0,-2.36,5.86),.83,.012,'Old brass',48)
for i in range(60):
    a=2*pi*i/60; major=i%5==0
    p=(.86*sin(a),-2.37,5.86+.86*cos(a));q=((.74 if major else .81)*sin(a),-2.37,5.86+(.74 if major else .81)*cos(a))
    beam('Clock hour' if major else 'Clock minute',p,q,.018 if major else .009,'Ivory',4)
for body,x,z in [('XII',0,6.5),('III',.63,5.86),('VI',0,5.23),('IX',-.63,5.86)]:text('Clock numeral '+body,body,(x,-2.39,z),.16,'Ivory',0)
minute=beam('Minute hand',(0,-2.43,5.86),(.12,-2.43,6.56),.025,'Light brass',6)
hour=beam('Hour hand',(0,-2.46,5.86),(-.39,-2.46,6.05),.034,'Light brass',6)
clockpivot=empty('ANIM Clock minute pivot',(0,-2.43,5.86));parent_keep([minute],clockpivot)
clockpivot.rotation_euler[1]=0;clockpivot.keyframe_insert('rotation_euler',frame=1,index=1)
clockpivot.rotation_euler[1]=-2*pi;clockpivot.keyframe_insert('rotation_euler',frame=721,index=1)
sphere('Clock spindle',(0,-2.49,5.86),(.07,.05,.07),'Amber light')
# A little planetary escapement sits above the vault.
ring('Celestial orbit',(0,1.1,8.13),.68,.027,'Old brass',36)
ring('Celestial horizontal orbit',(0,1.1,8.13),.5,.022,'Light brass',32,plane='XY')
sphere('Escapement moon',(0,1.1,8.13),(.19,.19,.19),'Moon light',16,8)
beam('Orrery stem',(0,1.1,7.48),(0,1.1,7.7),.07,'Old brass')

# Three portals: framed apertures containing small, physically authored worlds.
for idx,(x,title,label,color) in enumerate([(-5,'Yesterday','01  /  YESTERDAY','Autumn ochre'),(0,'The Moon','02  /  THE MOON','Moon light'),(5,'Home Again','03  /  HOME AGAIN','Amber light')]):
    current='02 Iron and glass'
    ring(title+' portal rim',(x,3.58,3.06),1.9,.14,'Midnight enamel',40)
    ring(title+' portal brass',(x,3.39,3.06),1.76,.055,'Light brass',40)
    ring(title+' luminous threshold',(x,3.44,3.06),1.66,.025,color,40)
    for side in [-1,1]:
        box(title+' gate foot',(x+side*1.65,3.63,1.18),(.48,.9,.64),'Midnight enamel',.035)
        cyl(title+' foot rivet',(x+side*1.65,3.14,1.2),.07,.04,'Old brass',8,(pi/2,0,0))
    for i in range(12):
        t=2*pi*i/12;sphere(title+' rim stud',(x+1.9*cos(t),3.42,3.06+1.9*sin(t)),(.05,.035,.05),'Old brass',8,4)
    cyl(title+' world backdrop',(x,4.08,3.06),1.65,.07,'Night sky' if idx!=0 else 'Dusk lavender',40,(pi/2,0,0))
    current='09 Typography'
    box(title+' destination board',(x,3.05,5.05),(3.75,.16,.45),'Deep petrol',.03)
    text(title+' address',label,(x,2.95,5.08),.205,'Ivory',.002)
    text(title+' departure', ['LAST LIGHT','NO RETURN','WELCOME HOME'][idx],(x,2.94,4.88),.075,'Light brass',0)

current='06 Yesterday'
# An autumn afternoon contained within the left gate: bridge, stream, tree, bench.
mesh('Yesterday rolling bank',[(-6.45,3.84,2.35),(-5.9,3.75,2.48),(-5.3,3.76,2.3),(-4.5,3.78,2.48),(-3.58,3.83,2.2),(-4.0,3.83,1.78),(-5,3.83,1.4),(-6.1,3.83,1.77)],[(0,1,2,3,4,5,6,7)],'Moss')
box('Yesterday footbridge',(-5.18,3.48,2.21),(1.15,.46,.12),'Walnut')
for x in [-5.67,-4.7]:beam('Bridge post',(x,3.29,2.23),(x,3.29,2.63),.033,'Old brass',6)
beam('Bridge handrail',(-5.7,3.29,2.63),(-4.67,3.29,2.63),.025,'Old brass')
line('River of remembered light',[(-5.35,3.64,2.25),(-5.18,3.64,2.0),(-5.37,3.64,1.65)],.09,'Rain silver')
for x,z,s in [(-6.06,2.48,1),(-4.14,2.3,.74)]:
    beam('Autumn tree trunk',(x,3.7,z),(x+.08,3.7,z+1.2*s),.065*s,'Walnut',7)
    for dx,dz in [(-.32,.7),(.32,.85),(-.15,1.13)]:
        beam('Autumn branch',(x,3.7,z+.4),(x+dx*s,3.7,z+dz*s),.035,'Walnut',6)
    for j,(dx,dz) in enumerate([(-.32,.84),(.28,.99),(-.1,1.23),(.08,.73)]):
        sphere('Autumn leaf crown',(x+dx*s,3.66,z+dz*s),(.35*s,.19,.32*s),'Autumn ochre' if j%2 else 'Autumn red',10,5)
cyl('Yesterday sun',(-4.48,3.96,4.03),.29,.04,'Amber light',24,(pi/2,0,0))
for x in [-5.85,-4.2]:
    box('Park bench seat',(x,3.4,2.37),(.43,.22,.07),'Warm limestone')
    box('Park bench back',(x,3.51,2.53),(.43,.06,.22),'Warm limestone')

current='07 The Moon'
# The moon is a relief disk with nested crater rims and a tiny observatory.
cyl('Lunar disc',(.22,3.77,3.36),1.08,.12,'Moon stone',40,(pi/2,0,0))
for x,z,r in [(-.32,3.71,.21),(.52,3.92,.16),(.81,3.23,.18),(-.18,2.91,.14),(.28,3.32,.12),(.44,2.62,.09),(-.58,3.29,.11)]:
    cyl('Crater shadow',(x,3.688,z),r,.012,'Lunar dark',12,(pi/2,0,0))
    ring('Crater rim',(x,3.65,z),r,.025,'Moon stone',12)
mesh('Lunar foreground',[(-1.42,3.63,2.28),(-.92,3.53,2.5),(-.43,3.53,2.35),(.24,3.53,2.46),(1.39,3.63,2.23),(.95,3.63,1.71),(0,3.63,1.42),(-.95,3.63,1.71)],[(0,1,2,3,4,5,6,7)],'Lunar dark')
cyl('Moon observatory drum',(-.73,3.35,2.44),.19,.32,'Ivory',12)
sphere('Moon observatory dome',(-.73,3.35,2.62),(.21,.21,.18),'Old brass',12,6)
beam('Lunar telescope',(-.74,3.28,2.67),(-.42,3.16,2.86),.055,'Ivory',8)
beam('Moon flag mast',(.7,3.32,2.25),(.7,3.32,2.92),.02,'Ivory',6)
mesh('Lunar postal pennant',[(.71,3.32,2.91),(1.06,3.32,2.91),(.96,3.32,2.76),(.71,3.32,2.76)],[(0,1,2,3)],'Burgundy mail')
for x,z in [(-1.18,3.63),(-.95,4.08),(.98,4.06),(.13,4.52),(1.4,3.43),(-1.36,2.96)]:sphere('Faraway star',(x,3.87,z),(.025,.015,.025),'Moon light',8,4)

current='08 Home Again'
# A lit kitchen window, rain, a tiled roof and a red door.
box('Home cottage',(5.03,3.77,2.74),(1.63,.4,1.57),'Warm limestone',.03)
mesh('Home gable',[(4.13,3.55,3.46),(5.03,3.55,4.17),(5.94,3.55,3.46),(4.13,3.97,3.46),(5.03,3.97,4.17),(5.94,3.97,3.46)],[(0,1,2),(3,5,4),(0,3,4,1),(1,4,5,2)],'Oxblood edge')
for a,b in [((4.05,3.47,3.45),(5.03,3.47,4.21)),((5.03,3.47,4.21),(6.01,3.47,3.45))]:beam('Home roof fascia',a,b,.07,'Old brass',6)
box('Kitchen window glow',(4.65,3.526,2.94),(.6,.035,.64),'Amber light')
for x in [4.33,4.65,4.97]:box('Kitchen window frame',(x,3.48,2.94),(.045,.055,.71),'Walnut')
for z in [2.59,2.94,3.28]:box('Kitchen crossbar',(4.65,3.48,z),(.68,.055,.045),'Walnut')
box('Home red door',(5.53,3.53,2.57),(.43,.07,1.12),'Burgundy mail',.02)
sphere('Home door handle',(5.4,3.48,2.55),(.027,.02,.027),'Old brass',8,4)
box('Home chimney',(5.62,3.86,3.94),(.24,.29,.75),'Warm limestone')
for z in [2.02,1.93,1.84]:box('Home approach',(5.51,3.45-(2.02-z)*1.6,z),(.6,.4,.12),'Warm limestone')
box('Kitchen flowerbox',(4.64,3.36,2.5),(.72,.22,.17),'Oxidised teal')
for x in [4.42,4.61,4.81]:sphere('Windowsill geranium',(x,3.35,2.65),(.11,.08,.11),'Autumn red',8,4)
for x,z in [(3.85,3.2),(4.03,4.0),(5.18,4.5),(6.15,3.6),(6.3,2.8),(3.94,2.52),(5.93,4.02)]:beam('Silver rain',(x,3.38,z),(x-.045,3.38,z-.15),.012,'Rain silver',4)

current='04 Postal works'
# A raised sorting office on the left with pigeonholes and a descending mail chute.
box('Sorting office pedestal',(-4.2,-.12,1.31),(3.0,2.12,.9),'Midnight enamel',.05)
box('Sorting counter top',(-4.2,-.12,1.82),(3.2,2.25,.15),'Walnut',.04)
box('Sorting cabinet back',(-4.3,.56,2.57),(2.67,.2,1.35),'Deep petrol')
for x in [-5.65,-5.12,-4.58,-4.04,-3.51,-2.97]:box('Pigeonhole divider',(x,.24,2.58),(.055,.62,1.38),'Old brass')
for z in [1.91,2.36,2.81,3.25]:box('Pigeonhole shelf',(-4.31,.24,z),(2.72,.66,.055),'Old brass')
for row in range(3):
    for col in range(5):
        if (row+col)%3==0:continue
        x=-5.38+col*.535;z=2.02+row*.45
        box('Sorted letter bundle',(x,.2,z),(.34,.32,.13),'Letter cream',.008,rot=(0,.07*((row+col)%2),0))
text('Sorting sign','DEAD LETTER OFFICE',(-4.3,-.11,3.41),.12,'Light brass',0)
# Brass helical letter chute with a solid ribbon and guard rails.
pts=[]
for i in range(65):
    t=i/64;angle=t*2*pi*1.5
    pts.append((-2.4+.54*cos(angle),.12+.54*sin(angle),3.72-2.22*t))
verts=[]
for i,p in enumerate(pts):
    t=i/64;angle=t*2*pi*1.5
    for rr in [-.11,.11]:verts.append((p[0]+rr*cos(angle),p[1]+rr*sin(angle),p[2]))
mesh('Spiral mail slide',verts,[(i*2,i*2+1,i*2+3,i*2+2) for i in range(64)],'Old brass')
for side in [-1,1]:line('Spiral slide lip',[(p[0]+side*.12*cos(i/64*3*pi),p[1]+side*.12*sin(i/64*3*pi),p[2]+.04) for i,p in enumerate(pts)],.018,'Light brass')
beam('Chute central mast',(-2.4,.12,.85),(-2.4,.12,3.8),.055,'Midnight enamel')
cyl('Mail chute hopper',(-1.86,.12,3.92),.35,.36,'Old brass',16,r2=.52)
# Sorting conveyor points toward the dispatch platform.
box('Conveyor frame',(-.5,-.85,1.49),(3.4,.68,.24),'Midnight enamel',.04)
for i in range(15):cyl('Conveyor brass roller',(-2.05+i*.22,-.85,1.63),.07,.55,'Old brass',8,(pi/2,0,0))
for x in [-1.65,.75]:
    for y in [-1.08,-.62]:beam('Conveyor legs',(x,y,.85),(x,y,1.5),.045,'Dark steel')
# Right hand dispatch desk, sacks, parcels and a hanging postal horn.
box('Dispatch counter',(4.05,-.25,1.38),(2.62,1.38,1.07),'Burgundy mail',.06)
box('Dispatch top',(4.05,-.25,1.98),(2.78,1.53,.13),'Walnut',.04)
for x in [3.13,4.05,4.97]:box('Counter brass panel',(x,-.96,1.42),(.71,.035,.7),'Old brass',.025)
for x in [3.13,4.05,4.97]:box('Counter enamel inset',(x,-.984,1.42),(.62,.025,.61),'Burgundy mail',.02)
text('Dispatch motto','ALWAYS DELIVERED',(4.05,-1.01,1.43),.13,'Ivory',0)
for i,(x,y,z,s) in enumerate([(3.1,-.3,2.18,.38),(4.8,.04,2.23,.47),(4.83,.04,2.62,.3),(5.75,-.55,1.02,.42),(5.76,-.55,1.45,.34),(3.52,-1.43,1.03,.33)]):
    box('Tied parcel '+str(i),(x,y,z),(s,s*.8,s*.65),'Parcel kraft',.018)
    box('Parcel ribbon long',(x,y,z+s*.33),(s*.12,s*.83,.012),'Letter cream')
    box('Parcel ribbon cross',(x,y,z+s*.337),(s*1.02,s*.11,.012),'Letter cream')
for x,y in [(5.78,.64),(6.3,.65),(6.23,.04)]:
    sphere('Canvas mail sack',(x,y,1.13),(.27,.24,.42),'Warm limestone',10,6)
    cyl('Mail sack tie',(x,y,1.47),.09,.07,'Burgundy mail',8)
    text('Sack POST','POST',(x,y-.225,1.17),.1,'Ink',0)
# Miniature desk lamp: a real shade, stem and warm pool.
cyl('Desk lamp base',(3.7,.03,2.08),.19,.08,'Old brass',16)
beam('Desk lamp stem',(3.7,.03,2.1),(3.7,.03,2.68),.035,'Old brass')
cyl('Desk lamp shade',(3.7,.03,2.7),.29,.23,'Oxidised teal',16,r2=.11)
cyl('Desk lamp warm underside',(3.7,.03,2.59),.22,.015,'Amber light',16)
pointlight('Desk warm light',(3.7,.03,2.47),(1,.52,.2),24,.3)
# Individually folded envelopes, one on the belt is the animated hero letter.
def envelope(name,x,y,z,s=.34):
    before=set(bpy.data.objects)
    box(name,(x,y,z),(s,s*.65,.025),'Letter cream',.006)
    line(name+' folded flap',[(x-s*.48,y+s*.3,z+.017),(x,y-s*.035,z+.017),(x+s*.48,y+s*.3,z+.017)],.006,'Parcel kraft')
    cyl(name+' red wax seal',(x,y-.02,z+.027),s*.075,.014,'Burgundy mail',8)
    return list(set(bpy.data.objects)-before)
for i,(x,y,z) in enumerate([(-4.7,-.4,1.93),(-4.24,-.7,1.93),(4.05,-.55,2.065),(-1.7,-.85,1.725)]):envelope('Waiting envelope '+str(i),x,y,z)
hero=envelope('Hero letter',-.75,-.85,1.725,.38)
heroPivot=empty('ANIM Letter on rollers',(-.75,-.85,1.725));parent_keep(hero,heroPivot)
for f,x in [(1,-.75),(180,.62),(181,-1.55),(360,-.75)]:heroPivot.location.x=x;heroPivot.keyframe_insert('location',frame=f)

# A long oval railway, with real rails, sleepers and a richly trimmed mail train.
current='05 Railway'
rx,ry,corner=6.9,4.65,1.25
def rounded_track(offset=0):
    X,Y,R=rx+offset,ry+offset,corner+offset
    points=[]
    for cx,cy,start in [(X-R,Y-R,0),(-X+R,Y-R,pi/2),(-X+R,-Y+R,pi),(X-R,-Y+R,3*pi/2)]:
        points.extend([Vector((cx+R*cos(start+pi*i/32),cy+R*sin(start+pi*i/32),0)) for i in range(17)])
    return points+[points[0]]
route=rounded_track()
distances=[0.0]
for a,b in zip(route,route[1:]):distances.append(distances[-1]+(b-a).length)
length=distances[-1]
def sample(distance):
    import bisect
    d=distance%length;i=max(0,min(len(route)-2,bisect.bisect_right(distances,d)-1))
    t=(d-distances[i])/(distances[i+1]-distances[i]);p=route[i].lerp(route[i+1],t)
    tangent=route[i+1]-route[i]
    return p,math.atan2(tangent.y,tangent.x)
for offset in [-.34,.34]:
    line('Continuous delivery rail',[(p.x,p.y,.98) for p in rounded_track(offset)],.034,'Dark steel')
for i in range(104):
    p,angle=sample(length*i/104)
    box('Rail sleeper',(p.x,p.y,.9),(.105,.94,.075),'Walnut',rot=(0,0,angle))
# Platform safety edge and little pools of light.
for y in [-3.99,3.02]:
    box('Platform coping',(0,y,.9),(10.7,.24,.16),'Warm limestone',.025)
    box('Brass safety line',(0,y-.05,.989),(10.45,.018,.008),'Old brass')
trainRoot=empty('ANIM Night mail locomotive',(0,0,0))
trainObjects=[]
def stock(x, powered=False):
    before=set(bpy.data.objects)
    y=-4.04;length=1.85 if powered else 1.95
    box('Locomotive chassis' if powered else 'Mail coach chassis',(x,y,1.19),(length,.68,.16),'Dark steel',.025)
    if powered:
        cyl('Locomotive brass boiler',(x-.12,y,1.69),.31,1.12,'Burgundy mail',16,(0,pi/2,0))
        for dx in [-.53,-.15,.25]:
            # Rings perpendicular to X, made as editable curves.
            line('Boiler brass band',[(x+dx,y+.315*cos(2*pi*i/24),1.69+.315*sin(2*pi*i/24)) for i in range(25)],.026,'Old brass')
        box('Locomotive cab',(x+.59,y,1.71),(.62,.68,.88),'Midnight enamel',.03)
        for side in [-1,1]:box('Cab glazed window',(x+.61,y+side*.348,1.86),(.36,.012,.3),'Amber light')
        box('Locomotive cab roof',(x+.57,y,2.19),(.85,.88,.09),'Deep petrol',.045)
        cyl('Locomotive chimney',(x-.49,y,2.11),.095,.42,'Dark steel',12,r2=.13)
        cyl('Chimney brass rim',(x-.49,y,2.34),.145,.065,'Old brass',12)
        sphere('Steam dome',(x+.04,y,2.02),(.13,.13,.16),'Old brass',12,6)
        cyl('Headlamp housing',(x-.98,y,1.65),.14,.15,'Old brass',12,(0,pi/2,0))
        cyl('Headlamp lens',(x-1.066,y,1.65),.105,.013,'Amber light',12,(0,pi/2,0))
    else:
        box('Royal mail coach body',(x,y,1.64),(1.86,.67,.78),'Burgundy mail',.045)
        box('Coach roof',(x,y,2.08),(2.02,.84,.14),'Deep petrol',.075)
        for side in [-1,1]:
            box('Coach waist brass',(x,y+side*.345,1.5),(1.83,.025,.04),'Old brass')
            for dx in [-.56,0,.56]:box('Coach warm window',(x+dx,y+side*.345,1.82),(.31,.019,.26),'Amber light')
        text('Coach postal lettering','NIGHT MAIL',(x,y-.362,1.54),.115,'Ivory',0)
    for dx in [-.61,.61]:
        for side in [-1,1]:
            cyl('Working wheel',(x+dx,y+side*.36,1.19),.22,.065,'Dark steel',12,(pi/2,0,0))
            cyl('Wheel brass hub',(x+dx,y+side*.4,1.19),.072,.02,'Old brass',10,(pi/2,0,0))
            for a in [0,pi/3,2*pi/3]:beam('Wheel spoke',(x+dx-.17*cos(a),y+side*.405,1.19-.17*sin(a)),(x+dx+.17*cos(a),y+side*.405,1.19+.17*sin(a)),.015,'Old brass',4)
    for dx in [-length/2-.07,length/2+.07]:beam('Stock coupling',(x+dx-.08,y,1.22),(x+dx+.08,y,1.22),.045,'Old brass')
    return list(set(bpy.data.objects)-before)
# Each vehicle has its own pivot and follows the same ellipse at a fixed
# arc-length separation. Static frame 1 also rests correctly on the rails.
for index,(x,powered) in enumerate([(-2.9,True),(-.65,False),(1.65,False)]):
    objs=stock(x,powered);pivot=empty('ANIM Vehicle '+str(index),(x,-4.04,0));parent_keep(objs,pivot)
    previous_angle=None
    for f in range(1,362,4):
        # One complete 12-second circuit; the final frame duplicates the start.
        distance=length*.75-2.9+index*2.25-length*(f-1)/360
        p,a=sample(distance)
        if previous_angle is not None:
            while a-previous_angle>pi:a-=2*pi
            while a-previous_angle<-pi:a+=2*pi
        previous_angle=a
        pivot.location=(p.x,p.y,0);pivot.rotation_euler[2]=a
        pivot.keyframe_insert('location',frame=f);pivot.keyframe_insert('rotation_euler',frame=f,index=2)
# Platform clocks, lit signals and hanging lanterns.
for x,y in [(-5.9,-3.0),(5.95,-3.0)]:
    cyl('Platform signal foot',(x,y,1.0),.22,.16,'Old brass',12)
    beam('Platform signal mast',(x,y,1.02),(x,y,3.13),.055,'Midnight enamel')
    box('Signal black housing',(x,y,3.08),(.26,.18,.52),'Deep petrol',.04)
    for z,m in [(3.21,'Burgundy mail'),(2.96,'Amber light')]:cyl('Signal lens',(x,y-.105,z),.077,.027,m,12,(pi/2,0,0))
for x in [-4.8,4.8]:
    current='02 Iron and glass'
    beam('Lantern suspension',(x,-2.1,6.53),(x,-2.1,4.9),.025,'Old brass')
    cyl('Lantern cap',(x,-2.1,4.9),.24,.2,'Midnight enamel',8,r2=.1)
    cyl('Lantern amber glass',(x,-2.1,4.59),.155,.43,'Amber light',8)
    cyl('Lantern foot',(x,-2.1,4.35),.2,.09,'Old brass',8)
    for a in range(4):beam('Lantern metal stile',(x+.16*cos(a*pi/2),-2.1+.16*sin(a*pi/2),4.37),(x+.16*cos(a*pi/2),-2.1+.16*sin(a*pi/2),4.8),.018,'Midnight enamel',4)
    pointlight('Lantern glow',(x,-2.1,4.5),(1,.63,.29),45,.45)
current='09 Typography'
box('Exhibit front plaque',(0,-5.355,.38),(7.2,.06,.26),'Deep petrol',.02)
text('Exhibit signature','THE NIGHT POST   /   nickfromlater',(0,-5.39,.4),.14,'Light brass',0)
# Every modeled object remains editable and semantically named.
scene['title']='The Night Post'
scene['creator']='nickfromlater'
scene['license']='MIT'
scene['authoring']='Blender native Python API with Codex assistance; editable meshes, curves and modifiers.'
scene['runtime_note']='Hall export is static. Blender animation is a motion study, not the final app interaction.'
scene.frame_start=1;scene.frame_end=360;scene.render.fps=30
scene.frame_set(1)

# A separate photographic studio, excluded from game export.
current='STUDIO'
mat('Studio floor','#13232d',23,0,.65)
box('Studio ground',(0,0,-.18),(200,200,.15),'Studio floor')
world=bpy.data.worlds.new('Night photographic world');scene.world=world;world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.075,.12,.18,1)
world.node_tree.nodes['Background'].inputs[1].default_value=.35

def area(name,loc,power,color,size,target):
    data=bpy.data.lights.new(name,'AREA');data.energy=power;data.color=color;data.shape='DISK';data.size=size
    o=bpy.data.objects.new(name,data);collections['STUDIO'].objects.link(o);o.location=loc;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler();return o
area('Warm key softbox',(-8,-10,15),2300,(1,.8,.59),8,(0,0,2))
area('Blue rim softbox',(7,5,13),2800,(.4,.7,1),7,(0,0,4))
area('Front fill',(3,-12,8),1300,(.78,.87,1),9,(0,0,3))
area('Portals warm wash',(-4,1.8,7),500,(1,.65,.32),4,(-4,3.5,3))
area('Moon wash',(0,2.4,4),90,(.48,.78,1),2,(0,3.7,3))
pointlight('Home kitchen bounce',(5.05,3.1,3),(1,.5,.19),18,.6)
camdata=bpy.data.cameras.new('Hero camera');camera=bpy.data.objects.new('Hero camera',camdata);collections['STUDIO'].objects.link(camera)
camera.location=(16,-24,16);target=Vector((0,0,3.4));camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler()
camdata.type='ORTHO';camdata.ortho_scale=23.5;camdata.lens=50;scene.camera=camera
scene.render.engine='CYCLES';scene.cycles.samples=48;scene.cycles.use_denoising=True
scene.render.resolution_x=1800;scene.render.resolution_y=1500;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.filepath='//../../evidence/night-post/night-post-hero.png'
scene.view_settings.view_transform='AgX'
# Open in a useful material-colored view without the photographic set obscuring it.
collections['STUDIO'].hide_viewport=True
for screen in bpy.data.screens:
    for a in screen.areas:
        if a.type=='VIEW_3D':
            a.spaces.active.clip_end=1000;a.spaces.active.region_3d.view_distance=24
            a.spaces.active.region_3d.view_location=(0,0,3.1)
            a.spaces.active.shading.color_type='MATERIAL'
            a.spaces.active.region_3d.view_rotation=camera.rotation_euler.to_quaternion()
OUT.mkdir(parents=True,exist_ok=True);EVIDENCE.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'night-post.blend'))
print('NIGHT_POST_SAVED', len(collections['EXPORT'].all_objects), 'editable objects')
# Rendering is explicit and independent of the runtime asset export.
if '--render' in __import__('sys').argv:
    collections['STUDIO'].hide_viewport=False
    bpy.ops.render.render(write_still=True)
