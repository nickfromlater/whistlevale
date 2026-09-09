'use strict';

// Exhibition coordinates are metres. The railway renderer uses six scene units
// per metre; the house map applies its usual uniform room scale after this.
const GRAND_HALL_UNIT_SCALE=6;
const GRAND_HALL_FEATURED_BAY='GH-08';

// A sequence of differently proportioned rooms, rather than seven copies of a
// hall. IDs and bay numbers are stable; positions, architecture and furniture
// are shared by the exhibition, its house-map model and contributor tools.
const GRAND_HALL_GALLERIES=[
 {id:'grand',code:'GH',roman:'I',name:'The Grand Hall',short:'Grand Hall',x:0,z:0,width:32,depth:46,height:12,roof:'vault',category:'The community collection',tag:'Where it all began',description:'A generous arrival hall, an ironwork canopy, and a collection beginning with Willowbank Pottery.',invitation:'A little of anything wonderful.',cloth:'#526953',palette:{wall:'#d0c5a9',trim:'#647565',metal:'#40584b',floor:'#8c7153'},view:{camera:[1,8.4,20.5],phone:[0,7.1,21],target:[0,2.8,-3]},map:[193,336,144,130]},
 {id:'steam',code:'SS',roman:'II',name:'Steam & Steel',short:'Steam & Steel',x:-38,z:0,width:26,depth:44,height:9.2,roof:'sawtooth',category:'Locomotives & rolling stock',tag:'For things with wheels and stories',description:'Brick piers, northlight trusses, and long display platforms recall an old locomotive works.',invitation:'Locomotives, carriages, railcars, or anything on rails.',cloth:'#596b61',palette:{wall:'#ae8970',trim:'#8a7862',metal:'#3e514b',floor:'#978e78'},view:{camera:[1,7.1,19.8],phone:[0,6.4,20],target:[0,2.2,-5]},map:[25,342,117,124]},
 {id:'worlds',code:'LW',roman:'III',name:'Little Worlds',short:'Little Worlds',x:38,z:0,width:34,depth:38,height:8.4,roof:'lantern',category:'Villages, landscapes & dioramas',tag:'A whole world on a small table',description:'Broad landscape islands and oak window seats gather around a sunlit lantern court.',invitation:'Dioramas, imaginary towns, miniature landscapes.',cloth:'#849171',palette:{wall:'#d4c8ab',trim:'#aaa27f',metal:'#737960',floor:'#a8926d'},view:{camera:[1.2,5.4,16.7],phone:[0,4.8,17],target:[0,2.3,-2]},map:[363,349,153,108]},
 {id:'conservatory',code:'WC',roman:'IV',name:'The Conservatory',short:'Conservatory',x:0,z:-48,width:36,depth:32,height:10.4,roof:'glasshouse',category:'Wild places & living things',tag:'Let a little of the outside in',description:'Pale stone, slender glasshouse ribs, and a sheltered garden court for small natural wonders.',invitation:'Forests, creatures, gardens, habitats, and natural wonders.',cloth:'#809979',palette:{wall:'#c2cbb5',trim:'#a9b89c',metal:'#688674',floor:'#c3c1a2'},view:{camera:[1.1,7.2,13.7],phone:[0,6.5,14],target:[0,2.2,-2.5]},map:[184,202,162,90]},
 {id:'architecture',code:'AR',roman:'V',name:'The Architects’ Gallery',short:'Architecture',x:-38,z:-48,width:30,depth:32,height:8.8,roof:'clerestory',category:'Buildings & imagined places',tag:'A place for places',description:'A quiet limestone study, with drafting tables, low partitions, and a band of northern light.',invitation:'Architecture, buildings, city scenes, and places to inhabit.',cloth:'#c0baa0',palette:{wall:'#d9d2bb',trim:'#b9b397',metal:'#8a876f',floor:'#bbb6a0'},view:{camera:[1.2,6.8,13.7],phone:[0,6.1,14],target:[0,2,-2.5]},map:[16,202,135,90]},
 {id:'curiosity',code:'CC',roman:'VI',name:'The Curiosity Cabinet',short:'Curiosity Cabinet',x:38,z:-48,width:26,depth:36,height:7.6,roof:'octagon',category:'Art, instruments & curious objects',tag:'For the beautifully unclassifiable',description:'An intimate walnut-lined room, with an octagonal lantern and cabinets tucked into reading alcoves.',invitation:'Sculptures, automata, instruments, art, and happy accidents.',cloth:'#777968',palette:{wall:'#a29780',trim:'#745c47',metal:'#8d7958',floor:'#705a45'},view:{camera:[.7,4.8,15.6],phone:[0,4.4,16],target:[0,2.2,-2.5]},map:[381,196,117,102]},
 {id:'workshop',code:'OW',roman:'VII',name:'The Open Workshop',short:'Open Workshop',x:0,z:-88,width:42,depth:28,height:8,roof:'shed',category:'Experiments & works in progress',tag:'It does not have to be finished',description:'A wide, bright workroom: trestles, folded plans, and a generous communal bench under timber rafters.',invitation:'Experiments, prototypes, works in progress, and first attempts.',cloth:'#a79b78',palette:{wall:'#d2c8a8',trim:'#a79774',metal:'#6f7967',floor:'#9b805c'},view:{camera:[1.2,6.4,11.7],phone:[0,5.8,12],target:[0,1.9,-1.5]},map:[171,77,189,80]}
];
const GRAND_HALL_CONNECTIONS=[[0,1],[0,2],[0,3],[1,4],[2,5],[3,4],[3,5],[3,6]];
const GRAND_HALL_PASSAGES=GRAND_HALL_CONNECTIONS.map(([from,to])=>{
 const a=GRAND_HALL_GALLERIES[from],b=GRAND_HALL_GALLERIES[to],horizontal=a.x!==b.x,s=horizontal?Math.sign(b.x-a.x):Math.sign(b.z-a.z);
 const z=horizontal?a.z+Math.min(a.depth,b.depth)/2-4.1:0;
 return {from,to,width:5.4,p0:horizontal?[a.x+s*a.width/2,z]:[a.x,a.z+s*a.depth/2],p1:horizontal?[b.x-s*b.width/2,z]:[b.x,b.z-s*b.depth/2]};
});
const GRAND_HALL_HOUSE_DOORS=[{room:1,side:'left',at:17.9},{room:4,side:'left',at:11.9},{room:2,side:'right',at:14.9},{room:5,side:'right',at:13.9},{room:6,side:'left',at:9.9},{room:6,side:'right',at:9.9},{room:0,side:'front',at:0}];
const GRAND_HALL_BOUNDS={x0:Math.min(...GRAND_HALL_GALLERIES.map(r=>r.x-r.width/2)),x1:Math.max(...GRAND_HALL_GALLERIES.map(r=>r.x+r.width/2)),z0:Math.min(...GRAND_HALL_GALLERIES.map(r=>r.z-r.depth/2)),z1:Math.max(...GRAND_HALL_GALLERIES.map(r=>r.z+r.depth/2))};

// Positions form small groups and courts. Empty bays are clear, usable surfaces;
// furniture is part of the room, never an invented community contribution.
const GRAND_HALL_BAY_LAYOUTS=[
 [[-11,16],[11,16],[-11,-17],[11,-17],[-11,-10],[-11,-3],[-11,4],[-5,10],[11,-10],[11,-3],[11,4],[11,10],[-5,-16],[5,-16],[-5,-7],[5,-7]],
 [[-8.5,-16],[-8.5,-10],[-8.5,-4],[-8.5,2],[-8.5,8],[-8.5,14],[8.5,-16],[8.5,-10],[8.5,-4],[8.5,2],[8.5,8],[8.5,14],[-3.3,-15],[3.3,-15],[-3.3,1],[3.3,1]],
 [[-11.8,-12],[-5.8,-12],[5.8,-12],[11.8,-12],[-11.8,-5.5],[-5.8,-5],[5.8,-5],[11.8,-5.5],[-11.8,1.5],[-5.8,2],[5.8,2],[11.8,1.5],[-11.8,9],[-5.8,9],[5.8,9],[11.8,9]],
 [[-13,-10],[-6.5,-10],[6.5,-10],[13,-10],[-13,-4],[-7,-3],[7,-3],[13,-4],[-13,3],[-7,4],[7,4],[13,3],[-13,10],[-6.5,10],[6.5,10],[13,10]],
 [[-10,-10],[-4.8,-10],[4.8,-10],[10,-10],[-10,-4],[-4.8,-3.5],[4.8,-3.5],[10,-4],[-10,3],[-4.8,3],[4.8,3],[10,3],[-10,9.5],[-4.8,9.5],[4.8,9.5],[10,9.5]],
 [[-8.2,-13.3],[-3.2,-12.5],[3.2,-12.5],[8.2,-13.3],[-8.2,-6.7],[-3.2,-5.8],[3.2,-5.8],[8.2,-6.7],[-8.2,0],[-3.2,1],[3.2,1],[8.2,0],[-8.2,8],[-3.2,8.8],[3.2,8.8],[8.2,8]],
 [[-15,-8],[-8.5,-8],[8.5,-8],[15,-8],[-15,-1],[-8.5,-1],[8.5,-1],[15,-1],[-15,6],[-8.5,6],[8.5,6],[15,6],[-3.3,-8],[3.3,-8],[-3.3,6],[3.3,6]]
];
// Exact resting planes from grandHallBayShape: top of the display cloth,
// except railway platforms where wheels/resting foundations meet the rail heads.
// y remains the authored furniture datum. Exhibits rest on surfaceY, and their
// allowed model height is measured upward from that plane after auto-grounding.
const GRAND_HALL_SURFACE_OFFSETS=Object.freeze({island:.012,honour:.012,landscape:.012,round:.016,study:.0145,cabinet:.015,platform:.055,trestle:.012});
const GRAND_HALL_BAYS=[];
for(const [ri,room] of GRAND_HALL_GALLERIES.entries()){
 GRAND_HALL_BAY_LAYOUTS[ri].forEach(([x,z],index)=>{
  const furniture=['island','platform','landscape','round','study','cabinet','trestle'][ri];
  let w=[4.6,3.7,4.6,4.4,3.9,3.65,4.8][ri],d=[3.6,4.5,4.4,4.4,3.8,3.4,4.0][ri],y=[1.38,1.16,1.06,1.17,1.26,1.48,1.24][ri];
  if(ri===0&&index===7){w=3.3;d=3.35;y=1.24;}
  if(ri===2){y=[.90,1.12,1.02,1.26][index%4];}
  if(ri===3){w=d=[4.0,4.65,4.4,4.15][index%4];y=[1.02,1.27,1.16][index%3];}
  let yaw=ri===2&&index%4===0?.10:ri===2&&index%4===3?-.10:0,displayFormat='open-table',maxHeight=5;
  if(ri===0&&index===7){displayFormat='low-vitrine';maxHeight=1.7;}
  if(ri===0&&[2,3].includes(index)){displayFormat='tall-vitrine';w=3.8;d=3.2;maxHeight=2.2;}
  if(ri===1&&[0,2,6,8,12,13].includes(index)){displayFormat='low-vitrine';maxHeight=index<12?1.1:1.6;}
  if(ri===2&&[0,3].includes(index)){displayFormat='low-vitrine';maxHeight=1.4;}
  if(ri===3&&[1,6,12].includes(index)){displayFormat='round-vitrine';maxHeight=index===6?2.5:1.6;}
  if(ri===4&&[0,3,4,7,8,11].includes(index)){displayFormat='wall-case';x=Math.sign(x)*12.35;w=index<4?4.4:4.0;d=2.2;maxHeight=index<4?2.4:1.85;y=1.05;yaw=x<0?Math.PI/2:-Math.PI/2;}
  if(ri===5){
   if([0,3,4,7,8,11].includes(index)){displayFormat='wall-case';x=Math.sign(x)*10.85;w=index<4?4.8:4.3;d=2.6;y=1.0;maxHeight=index<4?2.7:index<8?2.15:1.8;yaw=x<0?Math.PI/2:-Math.PI/2;}
   else if([1,6,9,14].includes(index)){displayFormat='tall-vitrine';w=3.3;d=2.9;y=1.15;maxHeight=index<8?2.35:1.75;}
   else{displayFormat='low-vitrine';y=1.3;maxHeight=1.0;}
  }
  const enclosed=displayFormat!=='open-table',usableWidth=w-(enclosed?.34:.24),usableDepth=d-(enclosed?.34:.24),usableRadius=ri===3?(w-(enclosed?.34:.24))/2:null;
  const bx=room.x+x,bz=room.z+z,front=d/2+.09,displayFurniture=ri===0&&index===7?'honour':furniture,surfaceY=y+GRAND_HALL_SURFACE_OFFSETS[displayFurniture];
  GRAND_HALL_BAYS.push({id:room.code+'-'+String(index+1).padStart(2,'0'),index,room:ri,x:bx,z:bz,w,d,width:w,depth:d,y,surfaceY,yaw,displayFormat,usableWidth,usableDepth,usableRadius,maxHeight,furniture:displayFurniture,marker:[bx+Math.sin(yaw)*front,y+.68,bz+Math.cos(yaw)*front],target:[bx,y+(enclosed?maxHeight*.45:.8),bz],camera:[bx+(x<0?4.9:-4.9),y+(enclosed?Math.max(2.8,maxHeight*.65+1.6):3.35),bz+6.1]});
 });
}
