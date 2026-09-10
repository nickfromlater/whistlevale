'use strict';

// Exhibition coordinates are metres. The railway renderer uses six scene units
// per metre; the house map applies its usual uniform room scale after this.
const GRAND_HALL_UNIT_SCALE=6;
const GRAND_HALL_FEATURED_BAY='GH-08';

// One allowance for the complete reviewed exhibit catalogue. The eager house
// map keeps its smaller allowance; neither limit is renewed per bay or gallery.
const GRAND_HALL_LIMITS=Object.freeze({exhibitVertices:600000,mapPreviewVertices:300000});

// A sequence of differently proportioned rooms, rather than seven copies of a
// hall. IDs and bay numbers are stable; positions, architecture and furniture
// are shared by the exhibition, its house-map model and contributor tools.
const GRAND_HALL_GALLERIES=[
 {id:'grand',code:'GH',roman:'I',name:'The Grand Hall',short:'Grand Hall',x:0,z:0,width:32,depth:46,height:12,roof:'vault',category:'The community collection',tag:'Where it all began',description:'A generous arrival hall, an ironwork canopy, and a collection beginning with Willowbank Pottery.',invitation:'A little of anything wonderful.',cloth:'#d3c8af',palette:{wall:'#ded6c2',trim:'#4c605a',metal:'#40534d',floor:'#c8c2ac'},view:{camera:[3.0,3.45,20],phone:[-3.5,3.6,20.3],target:[-3.8,1.7,5.0]},map:[193,336,144,130]},
 {id:'steam',code:'SS',roman:'II',name:'Steam & Steel',short:'Steam & Steel',x:-38,z:0,width:26,depth:44,height:9.2,roof:'sawtooth',category:'Locomotives & rolling stock',tag:'For things with wheels and stories',description:'Brick piers, northlight trusses, and long display platforms recall an old locomotive works.',invitation:'Locomotives, carriages, railcars, or anything on rails.',cloth:'#7e827d',palette:{wall:'#aa755f',trim:'#626765',metal:'#35484b',floor:'#969b94'},view:{camera:[2.5,3.3,19.3],phone:[0,3.6,20.0],target:[-1,1.25,-3]},map:[25,342,117,124]},
 {id:'worlds',code:'LW',roman:'III',name:'Little Worlds',short:'Little Worlds',x:38,z:0,width:34,depth:38,height:8.4,roof:'lantern',category:'Villages, landscapes & dioramas',tag:'A whole world on a small table',description:'Broad landscape islands and oak window seats gather around a sunlit lantern court.',invitation:'Dioramas, imaginary towns, miniature landscapes.',cloth:'#c8b995',palette:{wall:'#e0d6be',trim:'#9a805a',metal:'#786b52',floor:'#ab8c62'},view:{camera:[3.8,3.1,16.5],phone:[1.0,3.5,17.1],target:[-2.5,1.0,1.0]},map:[363,349,153,108]},
 {id:'conservatory',code:'WC',roman:'IV',name:'The Conservatory',short:'Conservatory',x:0,z:-48,width:36,depth:32,height:10.4,roof:'glasshouse',category:'Wild places & living things',tag:'Let a little of the outside in',description:'Pale stone, slender glasshouse ribs, and a sheltered garden court for small natural wonders.',invitation:'Forests, creatures, gardens, habitats, and natural wonders.',cloth:'#bac6a8',palette:{wall:'#d8e0ca',trim:'#849d83',metal:'#5b8172',floor:'#cbd0b9'},view:{camera:[1.8,3.05,14.0],phone:[0,3.5,14.1],target:[-2.7,1.15,-3.0]},map:[184,202,162,90]},
 {id:'architecture',code:'AR',roman:'V',name:'The Architects’ Gallery',short:'Architecture',x:-38,z:-48,width:30,depth:32,height:8.8,roof:'clerestory',category:'Buildings & imagined places',tag:'A place for places',description:'A quiet limestone study, with drafting tables, low partitions, and a band of northern light.',invitation:'Architecture, buildings, city scenes, and places to inhabit.',cloth:'#dedbcc',palette:{wall:'#e4e2d5',trim:'#aaa99b',metal:'#686e70',floor:'#b8bdb5'},view:{camera:[2.6,2.9,14.0],phone:[0,3.4,14.1],target:[-1.5,1.0,-2.5]},map:[16,202,135,90]},
 {id:'curiosity',code:'CC',roman:'VI',name:'The Curiosity Cabinet',short:'Curiosity Cabinet',x:38,z:-48,width:26,depth:36,height:7.6,roof:'octagon',category:'Art, instruments & curious objects',tag:'For the beautifully unclassifiable',description:'An intimate walnut-lined room, with an octagonal lantern and cabinets tucked into reading alcoves.',invitation:'Sculptures, automata, instruments, art, and happy accidents.',cloth:'#58504a',palette:{wall:'#817267',trim:'#503b31',metal:'#ae895b',floor:'#6b503e'},view:{camera:[2.0,2.65,15.5],phone:[0,3.1,16],target:[-.8,1.3,-1.7]},map:[381,196,117,102]},
 {id:'workshop',code:'OW',roman:'VII',name:'The Open Workshop',short:'Open Workshop',x:0,z:-88,width:42,depth:28,height:8,roof:'shed',category:'Experiments & works in progress',tag:'It does not have to be finished',description:'A wide, bright workroom: trestles, folded plans, and a generous communal bench under timber rafters.',invitation:'Experiments, prototypes, works in progress, and first attempts.',cloth:'#cab898',palette:{wall:'#e0d1b2',trim:'#a3865f',metal:'#61716b',floor:'#ad8e68'},view:{camera:[3.3,2.85,12.1],phone:[0,3.35,12.3],target:[-2,1.0,-2.5]},map:[171,77,189,80]}
];
const GRAND_HALL_CONNECTIONS=[[0,1],[0,2],[0,3],[1,4],[2,5],[3,4],[3,5],[3,6]];
const GRAND_HALL_PASSAGES=GRAND_HALL_CONNECTIONS.map(([from,to])=>{
 const a=GRAND_HALL_GALLERIES[from],b=GRAND_HALL_GALLERIES[to],horizontal=a.x!==b.x,s=horizontal?Math.sign(b.x-a.x):Math.sign(b.z-a.z);
 const z=horizontal?a.z+Math.min(a.depth,b.depth)/2-4.1:0;
 return {from,to,width:5.4,p0:horizontal?[a.x+s*a.width/2,z]:[a.x,a.z+s*a.depth/2],p1:horizontal?[b.x-s*b.width/2,z]:[b.x,b.z-s*b.depth/2]};
});
const GRAND_HALL_HOUSE_DOORS=[{room:1,side:'left',at:17.9},{room:4,side:'left',at:11.9},{room:2,side:'right',at:14.9},{room:5,side:'right',at:13.9},{room:6,side:'left',at:9.9},{room:6,side:'right',at:9.9},{room:0,side:'front',at:0}];
const GRAND_HALL_BOUNDS={x0:Math.min(...GRAND_HALL_GALLERIES.map(r=>r.x-r.width/2)),x1:Math.max(...GRAND_HALL_GALLERIES.map(r=>r.x+r.width/2)),z0:Math.min(...GRAND_HALL_GALLERIES.map(r=>r.z-r.depth/2)),z1:Math.max(...GRAND_HALL_GALLERIES.map(r=>r.z+r.depth/2))};

// Each gallery is composed around its own circulation and proportions. Bay
// IDs retain their original index; only empty furniture is re-authored. GH-08's
// dimensions, surface and position are the published Willowbank contract.
// Layout tuples are [x, z, display type, optional yaw]. Dimensions are metres.
const GRAND_HALL_DISPLAY_TYPES={
 plinth:{furniture:'landscape',w:2.7,d:2.05,y:.92,displayFormat:'open-table',maxHeight:3.4},
 island:{furniture:'landscape',w:3.65,d:2.7,y:.84,displayFormat:'open-table',maxHeight:3.4},
 landscape:{furniture:'landscape',w:4.35,d:3.25,y:.72,displayFormat:'open-table',maxHeight:3.8},
 lowGlass:{furniture:'landscape',w:2.8,d:2.1,y:1.0,displayFormat:'low-vitrine',maxHeight:1.05},
 tallGlass:{furniture:'cabinet',w:1.9,d:1.65,y:.96,displayFormat:'tall-vitrine',maxHeight:1.85},
 museumWindow:{furniture:'cabinet',w:3.4,d:1.25,y:.90,displayFormat:'wall-case',maxHeight:1.75},
 wideWindow:{furniture:'cabinet',w:4.1,d:1.35,y:.82,displayFormat:'wall-case',maxHeight:2.05},
 studyWindow:{furniture:'study',w:3.1,d:1.2,y:.95,displayFormat:'wall-case',maxHeight:1.5},
 cabinetWindow:{furniture:'cabinet',w:3.65,d:1.4,y:.86,displayFormat:'wall-case',maxHeight:2.05},
 rail:{furniture:'platform',w:2.2,d:4.85,y:.84,displayFormat:'open-table',maxHeight:2.8},
 railGlass:{furniture:'platform',w:2.25,d:4.7,y:.86,displayFormat:'low-vitrine',maxHeight:1.25},
 shortRail:{furniture:'platform',w:1.9,d:3.2,y:.92,displayFormat:'open-table',maxHeight:2.4},
 round:{furniture:'round',w:2.8,d:2.8,y:.86,displayFormat:'open-table',maxHeight:3.0},
 smallRound:{furniture:'round',w:2.05,d:2.05,y:1.08,displayFormat:'open-table',maxHeight:2.5},
 largeRound:{furniture:'round',w:3.4,d:3.4,y:.68,displayFormat:'open-table',maxHeight:3.4},
 roundGlass:{furniture:'round',w:2.65,d:2.65,y:.90,displayFormat:'round-vitrine',maxHeight:1.55},
 tallRound:{furniture:'round',w:2.3,d:2.3,y:.86,displayFormat:'round-vitrine',maxHeight:2.05},
 study:{furniture:'study',w:3.2,d:1.95,y:.96,displayFormat:'open-table',maxHeight:2.8},
 smallStudy:{furniture:'study',w:2.3,d:1.65,y:1.04,displayFormat:'open-table',maxHeight:2.6},
 bench:{furniture:'trestle',w:3.35,d:1.7,y:.96,displayFormat:'open-table',maxHeight:2.8},
 workbench:{furniture:'trestle',w:4.15,d:2.2,y:.93,displayFormat:'open-table',maxHeight:3.0},
 smallBench:{furniture:'trestle',w:2.4,d:1.45,y:1.0,displayFormat:'open-table',maxHeight:2.5},
 willowbank:{furniture:'honour',w:3.3,d:3.35,y:1.24,displayFormat:'low-vitrine',maxHeight:1.7}
};
const GRAND_HALL_BAY_LAYOUTS=[
 // Arrival concourse: perimeter windows, an open center and the first work.
 [[-14,9.0,'museumWindow',Math.PI/2],[14,9.0,'museumWindow',-Math.PI/2],[-14,-17,'wideWindow',Math.PI/2],[14,-17,'wideWindow',-Math.PI/2],[-11.7,-8.5,'lowGlass'],[-14,-4.4,'museumWindow',Math.PI/2],[-11.3,6.5,'smallRound'],[-5,10,'willowbank'],[11.7,-8.5,'tallGlass'],[14,-4.4,'museumWindow',-Math.PI/2],[10.3,7.0,'roundGlass'],[8.9,13.4,'plinth'],[-5.6,-16.2,'island'],[5.6,-16.2,'island'],[-5.6,-6.1,'plinth'],[5.6,-6.1,'lowGlass']],
 // Two rail galleries with a broad cross aisle, not sixteen parallel desks.
 [[-8.7,-16.5,'railGlass'],[-8.7,-9.8,'rail'],[-8.7,.3,'railGlass'],[-8.7,7.2,'rail'],[-8.7,14.2,'shortRail'],[-3.3,-16.2,'tallGlass'],[8.7,-16.5,'railGlass'],[8.7,-9.8,'rail'],[8.7,.3,'railGlass'],[8.7,7.2,'rail'],[8.7,14.2,'shortRail'],[3.3,-16.2,'tallGlass'],[-3.3,-7.0,'lowGlass'],[3.3,-7.0,'lowGlass'],[-3.4,5.4,'shortRail',Math.PI/2],[3.4,5.4,'shortRail',Math.PI/2]],
 // Landscape islands form loose courts, with a meandering route between them.
 [[-11.8,-11.5,'landscape',-.14],[-5.6,-13.2,'island',.10],[5.0,-12,'round'],[11.5,-10.3,'landscape',.12],[-10,-4.3,'island',.18],[-4.6,-5.7,'smallRound'],[6.2,-3.7,'landscape',-.20],[12.7,-1.7,'plinth'],[-12,4.7,'island',-.1],[-5.7,5.5,'landscape',.1],[3.5,5.2,'lowGlass'],[10.7,6.4,'round'],[-9.5,12.5,'lowGlass'],[-2.8,12.3,'plinth'],[5.1,12.5,'smallRound'],[12.5,12.5,'tallGlass']],
 // Round studies vary in scale along a sheltered garden promenade.
 [[-13,-10,'largeRound'],[-6.3,-10.5,'roundGlass'],[1.2,-11.5,'smallRound'],[10.2,-10,'largeRound'],[-11.4,-3.1,'roundGlass'],[-5.3,-4.5,'round'],[7.8,-4.8,'tallRound'],[13.2,-1.7,'smallRound'],[-13,4.0,'round'],[-6.8,3.3,'largeRound'],[3.8,2.8,'smallRound'],[10.8,5.8,'round'],[-11,11,'roundGlass'],[-3.8,10,'round'],[3.2,10.7,'largeRound'],[12.5,11.6,'smallRound']],
 // Shallow museum windows around low drafting islands and a central void.
 [[-13.45,-10.5,'studyWindow',Math.PI/2],[-4.4,-9,'study',.12],[4.5,-8,'smallStudy',-.12],[13.45,-10.5,'studyWindow',-Math.PI/2],[-13.45,-2.5,'studyWindow',Math.PI/2],[-4,-1.2,'smallStudy'],[4.4,2,'study',-.12],[13.45,-2.5,'studyWindow',-Math.PI/2],[-13.45,6,'studyWindow',Math.PI/2],[-6.5,7.5,'study',.12],[.5,8.5,'smallStudy'],[13.45,6,'studyWindow',-Math.PI/2],[-9.5,12.2,'smallStudy'],[-3.5,12.4,'lowGlass'],[4.5,12,'study'],[9.8,11.7,'smallStudy']],
 // Intimate cabinet alcoves around a handful of freestanding vitrines.
 [[-11.85,-11,'cabinetWindow',Math.PI/2],[-4.2,-11.3,'tallGlass'],[3.8,-12.2,'smallRound'],[11.85,-11,'wideWindow',-Math.PI/2],[-11.85,-2.5,'museumWindow',Math.PI/2],[-5.3,-3.2,'lowGlass',.15],[3.8,-4.0,'tallRound'],[11.85,-2.5,'cabinetWindow',-Math.PI/2],[-11.85,7.5,'cabinetWindow',Math.PI/2],[-4.5,5.8,'roundGlass'],[4.2,5.8,'lowGlass',-.15],[11.85,7.5,'museumWindow',-Math.PI/2],[-8.7,13.0,'smallRound'],[-2.5,11.6,'tallGlass'],[4.3,12.4,'roundGlass'],[9,12.8,'tallGlass']],
 // Working groups and generous cross aisles, with a communal rear bench.
 [[-15,-8,'smallBench'],[-8,-7,'workbench',.08],[8,-7,'bench',-.08],[15,-8,'smallBench'],[-14.2,-.6,'bench',Math.PI/2],[-8.2,.5,'workbench'],[7.6,-.6,'bench',Math.PI/2],[14.5,.8,'workbench'],[-14,6.8,'smallBench'],[-7.5,7,'bench',-.1],[7,6.8,'workbench',.1],[15,7.4,'smallBench'],[-2.9,-7.5,'smallBench',Math.PI/2],[2.9,-7.5,'smallBench',Math.PI/2],[-2.8,7.2,'smallBench'],[2.8,7.2,'smallBench']]
];
const GRAND_HALL_SURFACE_OFFSETS=Object.freeze({island:.012,honour:.012,landscape:.012,round:.016,study:.0145,cabinet:.015,platform:.055,trestle:.012});
const GRAND_HALL_BAYS=[];
for(const [ri,room]of GRAND_HALL_GALLERIES.entries()){
 GRAND_HALL_BAY_LAYOUTS[ri].forEach(([x,z,type,yaw=0],index)=>{
  const spec=GRAND_HALL_DISPLAY_TYPES[type];if(!spec)throw Error('Unknown exhibition display type: '+type);
  const {furniture,w,d,y,displayFormat,maxHeight}=spec,enclosed=displayFormat!=='open-table',usableWidth=w-(enclosed?.34:.24),usableDepth=d-(enclosed?.34:.24),usableRadius=furniture==='round'?Math.min(usableWidth,usableDepth)/2:null;
  // Museum windows meet the interior wall face; the source tuple names its side.
  if(displayFormat==='wall-case')x=Math.sign(x)*(room.width/2-d/2-.28);
  const bx=room.x+x,bz=room.z+z,front=d/2+.09,surfaceY=y+GRAND_HALL_SURFACE_OFFSETS[furniture],targetHeight=y+(enclosed?Math.min(1.0,maxHeight*.43):.55),distance=Math.max(3.8,Math.max(w,d)*1.1),frontX=Math.sin(yaw),frontZ=Math.cos(yaw);
  GRAND_HALL_BAYS.push({id:room.code+'-'+String(index+1).padStart(2,'0'),index,room:ri,x:bx,z:bz,w,d,width:w,depth:d,y,surfaceY,yaw,displayFormat,usableWidth,usableDepth,usableRadius,maxHeight,furniture,displayType:type,marker:[bx+frontX*front,y+.42,bz+frontZ*front],target:[bx,targetHeight,bz],camera:[bx+frontX*distance+(yaw===0?(x<0?1.5:-1.5):0),targetHeight+Math.max(1.6,enclosed?maxHeight*.38:1.5),bz+frontZ*distance]});
 });
}
