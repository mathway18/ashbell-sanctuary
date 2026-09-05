import * as THREE from 'three';
import {Brush,Evaluator,SUBTRACTION,ADDITION} from 'three-bvh-csg';

// Bake real voids into terrain meshes; no invisible walls and no render-only clipping.
export function carvePassage(group,points,width=5.7,height=5.5){
 group.updateMatrixWorld(true);const evaluator=new Evaluator();evaluator.useGroups=false;evaluator.attributes=['position','normal'];let count=0;
 const cutters=[];
 for(let i=0;i<points.length-1;i++){let a=new THREE.Vector3(...points[i]),b=new THREE.Vector3(...points[i+1]);let length=a.distanceTo(b);const geo=new THREE.BoxGeometry(width,height,length+width*.9);geo.translate(0,height/2-.7,0);let brush=new Brush(geo);brush.position.copy(a).add(b).multiplyScalar(.5);brush.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),b.clone().sub(a).normalize());brush.updateMatrixWorld(true);cutters.push({brush,box:new THREE.Box3().setFromObject(brush)})}
 const meshes=[];group.traverse(o=>{if(o.isMesh&&o.userData.zone===8)meshes.push(o)});
 // Union intersecting rock and masonry first, so cut walls have no coincident internal faces.
 const affected=meshes.filter(o=>cutters.some(c=>c.box.intersectsBox(new THREE.Box3().setFromObject(o))));let result=null;
 for(const o of affected){let g=o.geometry.clone().applyMatrix4(o.matrixWorld);g.clearGroups();let brush=new Brush(g,o.material);brush.updateMatrixWorld(true);result=result?evaluator.evaluate(result,brush,ADDITION):brush;result.updateMatrixWorld(true);}
 if(result){for(const c of cutters){result=evaluator.evaluate(result,c.brush,SUBTRACTION);result.updateMatrixWorld(true);}result.geometry.applyMatrix4(group.matrixWorld.clone().invert());const replacement=new THREE.Mesh(result.geometry,affected[0].material);replacement.name='Unified citadel foundation with through tunnel';replacement.userData.concave=true;replacement.userData.zone=8;replacement.castShadow=replacement.receiveShadow=true;affected.forEach(o=>o.removeFromParent());group.add(replacement);count=affected.length;}
 return count;
}

export function landingRoute(points){const result=[points[0]];for(let i=0;i<points.length-1;i++){let a=points[i],b=points[i+1],len=Math.hypot(b[0]-a[0],b[2]-a[2]);if(Math.abs(a[1]-b[1])>.01&&len>4){let t=Math.min(1.25/len,.18);result.push([a[0]+(b[0]-a[0])*t,a[1],a[2]+(b[2]-a[2])*t]);result.push([b[0]-(b[0]-a[0])*t,b[1],b[2]-(b[2]-a[2])*t]);}result.push(b)}return result}

export function projectionXZ(p,a,b){const dx=b[0]-a[0],dz=b[2]-a[2],sq=dx*dx+dz*dz,t=sq?THREE.MathUtils.clamp(((p[0]-a[0])*dx+(p[2]-a[2])*dz)/sq,0,1):0;return {distance:Math.hypot(p[0]-a[0]-dx*t,p[2]-a[2]-dz*t),y:a[1]+(b[1]-a[1])*t};}
