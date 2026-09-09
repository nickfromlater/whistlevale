'use strict';

// Willowbank Pottery — the first Commons contribution, by nickfromlater.
// Authored for Whistlevale with the shared Builder primitives. The reviewed
// placement, chosen public credit and viewpoint live in contributions/world.json.
function willowbankVessel(b,x,y,z,scale=1,color='#b77e59',bowl=false){
 b.push(x,y,z,0,0,0,scale);
 const profile=bowl?[[0,.067],[.035,.081],[.095,.137],[.145,.154]]:[[0,.057],[.035,.073],[.11,.112],[.20,.102],[.255,.061],[.29,.067]];
 for(let i=1;i<profile.length;i++){const a=profile[i-1],q=profile[i];b.cylinder(0,(a[0]+q[0])/2,0,a[1],q[1],q[0]-a[0],color,23,12);}
 const [top,r]=profile.at(-1);b.cylinder(0,top+.003,0,r,r,.012,shade(color,1.1),23,12);b.cylinder(0,top+.010,0,r*.76,r*.76,.003,shade(color,.43),23,12);b.pop();
}
function willowbankPottery(b,x,y,z,angle=0){
 b.push(x,y,z,0,angle);
 const stone='#b6ad94',timber='#b5996d',trim='#ded0ac',green='#527b6e',roof='#5b7175';
 // A low, deep foundation meets gentle terrain instead of floating over it.
 b.box(0,-.10,.38,6.2,.60,6.35,stone,4);b.box(0,.205,.38,6.28,.05,6.41,'#c8bea4',4);
 for(const zz of[-2.75,3.5])for(let i=0;i<13;i++)b.box(-2.88+i*.48,.05,zz,.018,.27,.018,'#8f927e',4);
 // Small planks over the porch; the front door has a clear approach.
 for(let i=0;i<18;i++)b.box(-2.79+i*.328,.265,2.66,.317,.075,1.58,i%3?timber:'#ad9167',22);
 b.box(-1.42,.105,3.87,1.48,.21,.68,'#b5b199',4);b.box(-1.42,-.025,4.19,1.72,.19,.36,stone,4);
 const bottom=.23,eave=3.03,peak=4.26;
 b.box(-2.48,(bottom+eave)/2,0,.16,eave-bottom,4.02,'#c9baa0',4);
 b.box(2.48,(bottom+eave)/2,0,.16,eave-bottom,4.02,'#d1c1a3',4);
 b.box(0,(bottom+eave)/2,-1.97,4.96,eave-bottom,.18,'#c4b69b',4);
 // Front wall segments form actual recesses around the door and display.
 for(const [cx,w]of[[-2.26,.44],[-.59,.88],[2.18,.60]])b.box(cx,1.63,2,w,2.8,.16,'#d8c9a9',4);
 b.box(-1.51,2.70,2,1.06,.65,.16,'#d8c9a9',4);b.box(.91,.62,2,2.10,.78,.16,'#d8c9a9',4);b.box(.91,2.76,2,2.10,.55,.16,'#d8c9a9',4);
 for(const zz of[-2.02,2.02]){const side=zz>0?1:-1;b.tri([-2.49*side,eave,zz],[2.49*side,eave,zz],[0,peak,zz],zz>0?'#cab894':'#bbad93',4);}
 // Weatherboards and a calm, slightly open painted door.
 for(const xx of[-2.49,2.49])for(const zz of[-2.07,2.07])b.box(xx,1.63,zz,.12,2.91,.13,timber,22);
 b.box(-1.51,1.19,1.77,1.02,1.91,.06,'#344f47',23);
 for(const xx of[-2.07,-.95])b.box(xx,1.29,2.12,.10,2.13,.14,trim,22);b.box(-1.51,2.34,2.12,1.22,.11,.14,trim,22);
 b.push(-2.01,.29,2.10,0,-.20);b.box(.49,.96,0,.98,1.92,.075,green,22);
 for(let i=1;i<6;i++)b.box(i*.163,.89,.044,.014,1.70,.012,'#42675b',22);
 b.box(.49,1.42,.052,.63,.58,.018,'#38564e',6);for(const xx of[.15,.49,.83])b.box(xx,1.42,.066,.028,.64,.027,trim,22);
 for(const yy of[1.10,1.73])b.box(.49,yy,.067,.70,.035,.025,trim,22);
 b.sphere(.83,.94,.094,.035,.035,.027,'#c6ad6d',41,8,5);for(const yy of[.30,1.67])b.box(.06,yy,.067,.11,.043,.038,'#4d5f52',41);b.pop();
 // Open display hatch: shadowed shelves and individually thrown pots.
 b.box(.91,1.71,1.58,2.10,1.40,.07,'#465c51',22);
 for(const xx of[-.16,1.98])b.box(xx,1.73,2.10,.10,1.60,.18,trim,22);
 for(const yy of[.94,1.66,2.47])b.box(.91,yy,1.97,2.30,.085,.48,timber,22);
 b.box(.91,2.54,2.15,2.36,.11,.24,trim,22);
 for(let row=0;row<2;row++)for(let i=0;i<5;i++)willowbankVessel(b,.12+i*.38,.99+row*.715,1.96,.78+(i%3)*.17,['#b98564','#aab4a0','#6e9691','#d2bd91','#b77557'][(i+row)%5],i===3);
 // A round vent and an unlettered maker's plaque avoid another atlas slot.
 b.cylinder(0,3.43,2.075,.205,.205,.06,'#536c60',22,20,PI/2);
 for(let i=-2;i<=2;i++)b.box(i*.055,3.43,2.116,.018,.31,.018,timber,22);
 b.box(-1.51,2.64,2.12,1.08,.24,.12,green,22);b.cylinder(-1.51,2.64,2.193,.074,.074,.016,'#d7c397',23,12,PI/2);
 // Thin courses and raised seams describe the slate without dense tessellation.
 for(const side of[-1,1])for(let course=0;course<7;course++){
  const a=course/7,q=(course+1)/7,xx=t=>side*2.79*t,yy=t=>peak+.07-(peak-eave+.13)*t;
  const points=[[xx(a),yy(a),-2.29],[xx(a),yy(a),2.29],[xx(q),yy(q),2.29],[xx(q),yy(q),-2.29]];if(side<0)points.reverse();
  b.quad(...points,shade(roof,1+(course%3-1)*.035),5);
  b.beam([xx(q),yy(q)+.016,-2.29],[xx(q),yy(q)+.016,2.29],.016,'#778c8b',5,4);
 }
 b.beam([0,peak+.085,-2.32],[0,peak+.085,2.32],.045,'#899893',5,6);
 for(const side of[-1,1]){
  b.beam([side*2.79,eave-.09,-2.33],[side*2.79,eave-.09,2.33],.045,'#697b72',41,7);
  b.beam([side*2.72,eave-.12,-2.07],[side*2.72,.38,-2.07],.035,'#7d8c7b',41,7);
 }
 // A lean-to keeps a practical worktable and greenware out of the rain.
 for(const xx of[-2.67,2.67]){b.box(xx,1.28,3.43,.11,2.08,.11,timber,22);b.beam([xx,1.84,3.43],[xx,2.25,2.91],.035,timber,22,4);}
 b.box(0,2.30,3.43,5.56,.13,.13,timber,22);
 b.quad([-2.82,2.37,3.65],[2.82,2.37,3.65],[2.82,2.76,2.14],[-2.82,2.76,2.14],'#879b8a',5);
 for(let i=0;i<11;i++)b.beam([-2.78+i*.556,2.78,2.14],[-2.78+i*.556,2.39,3.65],.012,'#b3b9a1',5,4);
 b.box(1.04,1.03,2.86,1.69,.10,.68,'#bba279',22);
 for(const xx of[.32,1.76])for(const zz of[2.61,3.11])b.box(xx,.65,zz,.075,.73,.075,timber,22);
 b.box(1.04,.45,2.86,1.51,.07,.56,'#a38b62',22);
 for(const [xx,zz,s,c,bowl]of[[.55,2.8,1.05,'#b18b65',false],[1.12,2.87,1.35,'#c6ad86',true],[1.60,2.84,.85,'#8daca0',false]])willowbankVessel(b,xx,1.09,zz,s,c,bowl);
 b.box(.71,.505,2.82,.55,.05,.39,'#d3c3a0',23);b.box(.74,.55,2.81,.54,.04,.38,'#bfae8d',23);
 // One glazed planter, a supply crate, and a small side window finish the scene.
 willowbankVessel(b,-2.67,.24,2.56,1.85,'#759a88');
 for(let i=0;i<5;i++){const a=i*2.4;b.beam([-2.67,.71,2.56],[-2.67+Math.sin(a)*.18,1.12+hash(i,29)*.12,2.56+Math.cos(a)*.18],.009,'#678660',8,5);}
 b.box(1.89,.44,3.29,.56,.33,.42,'#aa8e62',22);for(let i=0;i<4;i++)b.box(1.66+i*.15,.45,3.507,.045,.31,.025,'#c4ac7e',22);
 b.push(2.58,0,-.30,0,PI/2);windowPane(b,0,1.78,0,.85,.95);b.pop();
 b.pop();return 0;
}
