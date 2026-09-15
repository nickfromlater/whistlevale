from pathlib import Path
import hashlib

# One-use, branch-scoped integration of the locally tested field-lodge revision.
# Abort on an unexpected starting file rather than overwriting concurrent work.
p = Path('src/rooms/safari-lodge.js')
raw = p.read_bytes()
assert hashlib.sha1(b'blob ' + str(len(raw)).encode() + b'\0' + raw).hexdigest() == 'dce84b77ed132a6af99f3c5463e03c8c16321b90'
s = raw.decode()
s = s[:s.index('function kopjeMainHall')] + Path('.github/safari-field-functions.js').read_text() + s[s.index('function kopjeSteps'):]
a = s.index(' const bottom=[12.2,')
e = s.index(' // A quiet entrance gate', a)
s = s[:a] + s[e:]
a = s.index('function safariLodge(b)')
e = s.index('function safariPalm(', a)
s = s[:a] + '''function safariLodge(b){
 kopjeMainHall(b);kopjeGearWing(b);kopjeMessTent(b);kopjeStoneSteps(b);kopjeArrival(b);
 // The old pool and rear porch footprint is earth again, crossed by a narrow
 // footpath. A field noticeboard gives the approach a purpose, not a terrace.
 const x=18.6,z=9.0,y=safariSurface(x,z);
 for(const xx of[x-1.18,x+1.18])b.cylinder(xx,y+1.0,z,.073,.058,2.05,KOPJE.timber,22,7);
 b.box(x,y+1.6,z,2.8,1.3,.14,'#3b513d',22);
 b.box(x,y+1.6,z+.079,2.42,.96,.018,'#bbae80',23);
 for(let i=0;i<5;i++)b.beam([x-.92,y+1.91-i*.14,z+.094],[x+.28+(i%2)*.55,y+1.91-i*.14,z+.094],.011,'#596849',0,4);
 b.push(x,y+2.21,z+.03,-.10);b.box(0,0,0,3.10,.10,.68,'#655237',22);b.pop();
 kopjeLantern(b,18.0,y+.10,9.65,.60);
}

''' + s[e:]
s = s.replace('// All decking is cut around the pool and fire court, rather than covering it.', '// A compact expedition lodge on fieldstone foundations, without resort amenities.')
for name, end in [('kopjeDeck','kopjeRoof'),('kopjeSofa','kopjeChair'),('kopjeRug','kopjeChair')]:
    a=s.index('function '+name+'(');e=s.index('function '+end+'(',a);s=s[:a]+s[e:]
a=s.index('// The frame meets');e=s.index('function kopjeLantern',a);s=s[:a]+s[e:]
for name,end in [('kopjeGlass','kopjeScreen'),('kopjeScreen','kopjeMasonry')]:
    a=s.index('function '+name+'(');e=s.index('function '+end+'(',a);s=s[:a]+s[e:]
p.write_text(s)

p=Path('src/rooms/safari.js');s=p.read_text()
replacements=[
 ('bounds:[7.5,-8.5,40.5,20.5]','bounds:[8,-7.3,39,8.5]'),
 ('[[-10,31.3],[-12,26],[-10,23],[-6,20]]]','[[-10,31.3],[-12,26],[-10,23],[-6,20]],[[10.3,20],[12,18.1],[16.5,12.6],[21.2,9.1],[24,7.8]]]'),
 ('scene.safari={revision:2,','scene.safari={revision:3,'),
 ("target:[24,7,1],distance:34,phoneDistance:63,pitch:.34,yaw:.38,detail:'A vaulted thatch-roofed lodge above the river. Open lounges, a library loft, a dining pavilion and an infinity pool are connected by teak verandas.'","target:[24,7,-.8],distance:36,phoneDistance:65,pitch:.29,yaw:.43,detail:'A stone-and-thatch expedition lodge. Briefings around a reserve map, a field library and radio, a canvas mess fly and a timber observation hide. No pool or rear leisure deck.'"),
 ("{name:'The sundowner terrace',target:[25,4.8,12],distance:24,phoneDistance:44,pitch:.38,yaw:.64,detail:'A pool overlooking the river, woven loungers, parasols and a sunken fire circle. Little lanterns come on after sunset.'}","{name:'The expedition approach',target:[23,5.6,4],distance:26,phoneDistance:48,pitch:.30,yaw:-.58,detail:'An earth path reaches broad stone steps between lanterns. The former leisure terrace has returned to grasses, acacias and riverbank scrub.'}"),
 ('Visit Kopje House, a timber-and-thatch safari lodge with open lounges, an infinity pool and a sundowner terrace, then follow Solstice around the rift.','Visit Kopje House, a rugged stone-and-thatch expedition lodge with a map room, canvas mess fly and observation hide, then follow Solstice around the rift.'),
 ('[24,7.8,1],[14,6.8,0],[35,6.8,-2],[32.5,4.9,15.8]','[23.8,8.2,.25],[12.25,4.0,-.6],[34.45,11.2,-2.2],[24,4.6,5.1]'),
 (' return trees;\n})();',' for(const [x,z,h,v]of[[15.8,10.0,5.4,901],[30.8,13.3,6.1,902],[21.2,19,5.0,903],[37.1,17.5,4.2,904]])addTree(x,z,h,v);\n return trees;\n})();')
]
for old,new in replacements:
    assert old in s, old
    s=s.replace(old,new)
p.write_text(s)

p=Path('scripts/safari-qa.mjs');s=p.read_text()
for old,new in [
 ("s.name==='The sundowner terrace'","s.name==='The expedition approach'"),
 ("'lodge roof, decks, furniture and approach clear the monorail: '","'lodge roof, hide, equipment and approach clear the monorail: '"),
 ('for(let x=8;x<40;x+=.8)for(let z=-7;z<13;z+=.8)','for(let x=17.45;x<37.6;x+=.8)for(let z=-5.2;z<3.5;z+=.8)'),
 ("'terrace structure is above finished terrain'","'building floor is above finished terrain'")]:
    assert old in s
    s=s.replace(old,new)
s=s.replace(' return {lodgeVertices:count,', ''' // User removal is a geometry invariant, not just hidden UI or a material change.
 assert.equal(typeof kopjePool,'undefined');assert.equal(typeof kopjeFireCourt,'undefined');assert.equal(typeof kopjePergola,'undefined');
 for(let i=9;i<b.data.length;i+=12)assert.ok(b.data[i]!==7&&b.data[i]!==44,'no pool or spillway water remains in lodge geometry');
 const buildings=new Builder();kopjeMainHall(buildings);kopjeGearWing(buildings);kopjeMessTent(buildings);kopjeStoneSteps(buildings);
 for(let i=2;i<buildings.data.length;i+=12)assert.ok(buildings.data[i]<8.5,'buildings do not occupy the removed rear leisure deck');
 assert.ok(safariLodgeClear(16.2,12.05,1),'old basin footprint is returned to planting');
 assert.ok(safariLodgeClear(33,16,1),'old fire court footprint is returned to planting');
 assert.ok(!getHouseScene('safari').spots.some(s=>/sundowner/i.test(s.name)),'obsolete leisure viewpoint removed');
 return {lodgeVertices:count,''')
p.write_text(s)

p=Path('scripts/safari-lodge-visual.mjs');s=p.read_text()
a=s.index(" await capture('01-complete-landscape'")
e=s.index(' report.horizontalOverflow=',a)
s=s[:a]+''' await capture('01-complete-landscape',[0,5,-1],138,.32,.60);
 await capture('02-field-lodge',[24,7,0],44,.40,.32);
 await capture('03-earth-approach',[23,4.8,6],31,-.68,.27);
 await capture('04-map-room',[23.8,6.6,-.3],15,.10,.16);
 await capture('05-lodge-evening',[24,7,0],44,.40,.32,'evening');
 await capture('06-survey-hide',[34.5,10,-2],18,.65,.28);
 await capture('07-acacia-country',[-25,5,7],36,-.40,.40);
 await capture('08-rear-stonework',[24,7,-2],38,2.9,.31);
 for(const width of[390,320]){
  await page.setViewportSize({width,height:width===390?844:693});await capture('09-lodge-phone-'+width,[24,7,0],80,.40,.34);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 }
''' + s[e:]
p.write_text(s)
p=Path('scripts/safari-visual-review.mjs');s=p.read_text().replace('07-spring-cascade','07-field-lodge').replace('09-observation-deck','09-expedition-approach');p.write_text(s)

p=Path('docs/rooms/safari.md');s=p.read_text()
a=s.index('## Kopje House');e=s.index('## Railway and Solstice',a)
s=s[:a]+'''## Kopje Field Lodge

The lodge is an expedition base, not a resort. The pool, spillway, rear leisure
deck, parasols, loungers, pergola and sunken fire court have been removed from
the geometry. Their footprint is planted earth again, crossed by one narrow
approach from the suspension bridge to broad stone entrance steps.

A steep thatched gable and exposed timber trusses cover the main hall. Rough,
individually relieved fieldstone foundations and walls replace the continuous
raised deck. Inside are a large reserve-map briefing table, contour lines and a
river drawn in geometry, binoculars, rolled maps, a compass, enamel mugs, a field
library, radio desk and compact stone hearth. A canvas mess fly and supply trunks
sit alongside the lodge. The stone equipment wing has a shuttered opening and a
raised timber surveying hide with optics and an aerial.

The lodge remains native, deterministic geometry. Existing caption, viewpoint,
lighting, planting-exclusion and arrival-path metadata now describe the field
lodge. Use **Views → Places → Kopje House** or **The expedition approach**.
The monorail route, stock and no-animals scope are unchanged.

The rework adds regression proofs that the removed pool builders and water
materials are absent, buildings stop before the former leisure terrace, and the
old pool/fire-court footprints are available for planting. Existing clearance,
finite geometry, cache, motion and unchanged upper vertex budgets still apply.

''' + s[e:]
p.write_text(s)
print('Integrated field lodge; obsolete leisure geometry removed.')
