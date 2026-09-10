"""Offline Blender mesh export to Whistlevale's existing classic-script builder.

Run with Blender --background source.blend --python scripts/blender-export.py --
  --collection EXPORT --name exampleModel --output evidence/example.js
Materials must have a whistlevale_material integer custom property. Their
viewport diffuse color supplies the tint; arbitrary shader nodes are not baked.
This bridge exports static meshes only; --frame explicitly samples animation.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import re
import sys

import bpy
from mathutils import Matrix


MATERIALS = {0, 4, 5, 6, 8, 10, 22, 23, 41, 76}
# Proper rotation: Blender Z-up -> Whistlevale Y-up; determinant +1.
AXES = Matrix(((1, 0, 0, 0), (0, 0, 1, 0), (0, -1, 0, 0), (0, 0, 0, 1)))


def srgb(value):
    return 12.92 * value if value <= .0031308 else 1.055 * value ** (1 / 2.4) - .055


def export(collection, name, output, max_vertices, frame=None):
    if not re.fullmatch(r'[A-Za-z][A-Za-z0-9_]*', name):
        raise ValueError('Builder name must be a simple JavaScript identifier')
    source = bpy.data.collections.get(collection)
    if source is None:
        raise ValueError('Missing export collection: ' + collection)
    if frame is not None:
        bpy.context.scene.frame_set(frame)
    graph = bpy.context.evaluated_depsgraph_get()
    records = []
    parts = []
    for obj in sorted(source.all_objects, key=lambda item: item.name):
        if obj.hide_render:
            continue
        if obj.instance_type != 'NONE' or (obj.animation_data and frame is None) or obj.constraints:
            raise ValueError(obj.name + ': instances, animation and constraints need a separate bridge')
        if obj.type == 'EMPTY':
            continue
        if obj.type not in {'MESH', 'CURVE', 'FONT', 'SURFACE'}:
            raise ValueError(obj.name + ': unsupported export object type ' + obj.type)
        ancestor = obj.parent
        while ancestor:
            if (ancestor.animation_data and frame is None) or ancestor.constraints:
                raise ValueError(obj.name + ': animated/constrained parent is unsupported')
            ancestor = ancestor.parent
        if obj.type == 'MESH' and obj.data.shape_keys:
            raise ValueError(obj.name + ': shape keys are unsupported')
        evaluated = obj.evaluated_get(graph)
        mesh = evaluated.to_mesh()
        start = len(records)
        try:
            mesh.calc_loop_triangles()
            transform = AXES @ evaluated.matrix_world
            linear = transform.to_3x3()
            if abs(linear.determinant()) < 1e-12:
                raise ValueError(obj.name + ': singular transform')
            normals = linear.inverted().transposed()
            mirrored = linear.determinant() < 0
            for tri in mesh.loop_triangles:
                material = mesh.materials[tri.material_index] if tri.material_index < len(mesh.materials) else None
                if material is None:
                    raise ValueError(obj.name + ': every face needs an explicit material')
                material = material.original
                mat = material.get('whistlevale_material')
                if type(mat) is not int or mat not in MATERIALS:
                    raise ValueError(material.name + ': unsupported/missing whistlevale_material')
                rgb = [srgb(max(0, min(1, float(c)))) for c in material.diffuse_color[:3]]
                loops = list(tri.loops)
                if mirrored:
                    loops.reverse()
                for loop in loops:
                    position = transform @ mesh.vertices[mesh.loops[loop].vertex_index].co
                    normal = normals @ mesh.corner_normals[loop].vector
                    if normal.length < 1e-10:
                        raise ValueError(obj.name + ': zero normal')
                    normal.normalize()
                    uv = mesh.uv_layers.active.data[loop].uv[:] if mesh.uv_layers.active else (0, 0)
                    record = [*position, *normal, *rgb, mat, *uv]
                    if not all(math.isfinite(v) for v in record):
                        raise ValueError(obj.name + ': nonfinite vertex')
                    # Evaluated bevel UVs can move by a final float32 bit after
                    # saving/reloading Blender. Keep sub-texel precision without
                    # baking that irrelevant noise into the reviewed source.
                    records.append([round(v, 6 if i >= 10 else 7) if isinstance(v, float) else v for i, v in enumerate(record)])
                if len(records) > max_vertices:
                    raise ValueError('Export exceeds the selected vertex budget')
        finally:
            evaluated.to_mesh_clear()
        parts.append({'name': obj.name, 'vertices': len(records) - start})
    if not records:
        raise ValueError('Export collection is empty')
    bounds = [[min(r[i] for r in records), max(r[i] for r in records)] for i in range(3)]
    # Index complete corner attributes, not just positions: hard normals, UV
    # seams and material boundaries must survive deduplication exactly.
    palette, palette_ids, vertices, vertex_ids, indices = [], {}, [], {}, []
    for r in records:
        finish = tuple(r[6:10])
        if finish not in palette_ids:
            palette_ids[finish] = len(palette)
            palette.append(finish)
        packed = tuple(r[:6] + [palette_ids[finish]] + r[10:12])
        if packed not in vertex_ids:
            vertex_ids[packed] = len(vertices)
            vertices.append(packed)
        indices.append(vertex_ids[packed])
    encode = lambda value: json.dumps(value, separators=(',', ':'), allow_nan=False)
    # Data lives inside the function: no large geometry cache at script load.
    script = "'use strict';\n// Generated from Blender. Edit the .blend source, then re-export.\n"
    script += f'function {name}(b,x=0,y=0,z=0,angle=0){{\n const vertices={encode(vertices)},indices={encode(indices)},palette={encode(palette)};\n'
    script += ' b.push(x,y,z,0,angle);\n try{\n'
    script += '  for(const index of indices){const v=vertices[index],c=palette[v[6]];b.vertex(v.slice(0,3),v.slice(3,6),c.slice(0,3),c[3],v.slice(7,9));}\n'
    script += ' }finally{b.pop();}\n}\n'
    destination = Path(output)
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(script)
    report = {'builder': name, 'frame': frame, 'vertices': len(records), 'triangles': len(records) // 3,
              'vertexBufferBytes': len(records) * 48, 'sourceBytes': len(script.encode()),
              'uniqueCorners': len(vertices), 'bounds': bounds, 'parts': parts,
              'sha256': hashlib.sha256(script.encode()).hexdigest()}
    if bpy.data.filepath:
        report['blendSHA256'] = hashlib.sha256(Path(bpy.data.filepath).read_bytes()).hexdigest()
    report['blenderVersion'] = bpy.app.version_string
    destination.with_suffix('.report.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report))
    return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--collection', default='EXPORT')
    parser.add_argument('--name', required=True)
    parser.add_argument('--output', required=True)
    parser.add_argument('--max-vertices', type=int, default=60000)
    parser.add_argument('--frame', type=int, help='Explicit static snapshot of an animated scene')
    args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
    export(args.collection, args.name, args.output, args.max_vertices, args.frame)
