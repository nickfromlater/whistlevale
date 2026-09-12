import * as THREE from 'three';
const V=(x,y,z)=>new THREE.Vector3(x,y,z),inRange=(u,a,b)=>{u=(u-a+1)%1;return u<(b-a+1)%1;};

export function createCinematography(world,architecture,train){
  // Composed hero: train reads instantly left-of-center on the bridge, the deck
  // sweeps right as a leading line into cascade and tunnel portal, station glow
  // at the far left edge, ridges layered behind, foliage framing the corners.
  const hero={position:V(22,13,60),target:V(6,9,12)};
  const night={position:V(22,14,69),target:V(8,7,12)};
  const exit=world.portals[1],t=world.curve.getTangentAt(world.tunnelEnd),side=V(t.z,0,-t.x);
  const emergence={position:exit.clone().addScaledVector(t,11).addScaledVector(side,-5).add(V(0,3.6,0)),target:exit.clone().add(V(0,1.1,0))};
  const shots={
    hero,night,
    // Lower, settled framings: foreground rails, water and foliage supply
    // parallax while the train and atmosphere provide the motion.
    bridge:{position:V(27,13,58),target:V(13,6,13)},
    river:{position:V(world.riverX(33)+.4,world.waterLevel(33)+3.0,33),target:V(21,5,16)},
    cascade:{position:V(world.riverX(27)+.3,world.waterLevel(27)+5.5,27),target:V(world.riverX(7),-1.2,7)},
    station:{position:architecture.stationTarget.clone().add(V(16,.4,-5.0)),target:architecture.stationTarget.clone().add(V(-1,-.3,1))},
    shrine:{position:architecture.shrineTarget.clone().add(V(-11,4.5,15)),target:architecture.shrineTarget.clone()},
    tunnel:{position:world.portals[0].clone().add(V(15,4.5,17)),target:world.portals[0].clone().add(V(0,1.2,0))},
    emergence,
    wide:{position:V(107,82,132),target:V(0,12,0)}
  };
  let active='',shotStarted=0,transition=null,lap=0,previousProgress=train.progress;
  const fitted=(shot,aspect)=>{const scale=Math.max(1,1.0/aspect),position=shot.target.clone().add(shot.position.clone().sub(shot.target).multiplyScalar(scale));
    position.y=Math.max(position.y,world.inFootprint(position.x,position.z)?world.height(position.x,position.z)+2.3:2.3);return {position,target:shot.target.clone()};};
  function desired(nightness){const u=train.progress;
    // The exit shot starts far enough inside the bore for its six-second camera
    // approach to finish before the headlights reach the portal.
    if(u>.90||u<world.stationU+.035)return 'station';
    if(u<world.tunnelStart-.018)return nightness>.55?'night':'bridge';
    if(u<world.tunnelEnd-.14)return lap%2?'river':'cascade';
    if(u<world.tunnelEnd+.09)return 'emergence';
    return 'shrine';
  }
  return {shots,fitted,reset(){active='';transition=null;},update(now,dt,camera,controls,nightness){
    if(train.progress<previousProgress-.5)lap++;previousProgress=train.progress;
    const next=desired(nightness);
    if(!active||(next!==active&&now-shotStarted>7200)){
      const shot=fitted(shots[next],camera.aspect);transition={from:camera.position.clone(),fromTarget:controls.target.clone(),to:shot.position,target:shot.target,start:now,duration:active?5400:3800,lift:0};
      for(let i=1;i<32;i++){const f=i/32,p=transition.from.clone().lerp(transition.to,f);if(!world.inFootprint(p.x,p.z))continue;
        transition.lift=Math.max(transition.lift,(world.height(p.x,p.z)+2.3-p.y)/Math.pow(Math.sin(f*Math.PI),.35));}
      transition.lift=Math.max(transition.lift,Math.min(10,transition.from.distanceTo(transition.to)*.10));active=next;shotStarted=now;
    }
    if(transition){const t=Math.min(1,(now-transition.start)/transition.duration),e=t*t*t*(t*(t*6-15)+10);camera.position.lerpVectors(transition.from,transition.to,e);controls.target.lerpVectors(transition.fromTarget,transition.target,e);
      camera.position.y+=Math.pow(Math.max(0,Math.sin(e*Math.PI)),.35)*transition.lift;if(t===1)transition=null;
    }else{
      // Once a shot settles, the camera is effectively still: only a slow,
      // heavy push remains while the train, leaves and water supply motion.
      const shot=fitted(shots[active],camera.aspect),phase=Math.max(0,Math.min(1,(now-shotStarted-5400)/22000));
      const drift=V(Math.sin(phase*.4)*.55,Math.sin(phase*.5)*.12,-phase*.5);
      camera.position.lerp(shot.position.add(drift),1-Math.exp(-dt*.5));controls.target.lerp(shot.target,1-Math.exp(-dt*.6));
    }
    document.documentElement.dataset.shot=active;
  }};
}
