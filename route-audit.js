// Sample a 1.2 m wide, 2.3 m tall traffic envelope against the actual convex model meshes.
// Uses local-space convex half-planes, not screen-space overlap or bounding boxes alone.
export function auditRoutes(THREE,model,routes,{spacing=.35,radius=.6,checkSupport=true}={}){
 model.updateMatrixWorld(true);
 const colliders=[];const planeCache=new Map();
 model.traverse(o=>{if(!o.isMesh||o.userData.auditIgnore||o.material.transparent)return;const g=o.geometry;if(!g.boundingBox)g.computeBoundingBox();if(g.boundingBox.max.y-g.boundingBox.min.y<.00001)return;
  let planes=planeCache.get(g);if(!planes){planes=[];let pos=g.attributes.position,idx=g.index;const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();for(let t=0;t<(idx?idx.count:pos.count);t+=3){a.fromBufferAttribute(pos,idx?idx.getX(t):t);b.fromBufferAttribute(pos,idx?idx.getX(t+1):t+1);c.fromBufferAttribute(pos,idx?idx.getX(t+2):t+2);let p=new THREE.Plane().setFromCoplanarPoints(a,b,c);if(p.normal.lengthSq()>.5&&!planes.some(q=>q.normal.distanceToSquared(p.normal)<1e-8&&Math.abs(q.constant-p.constant)<1e-5))planes.push(p);}planeCache.set(g,planes)}
  colliders.push({o,box:new THREE.Box3().setFromObject(o),inv:o.matrixWorld.clone().invert(),local:g.boundingBox,planes});
 });
 const blocked=[],unsupported=[];let samples=0;const v=new THREE.Vector3(),local=new THREE.Vector3(),ray=new THREE.Raycaster(),insideRay=new THREE.Raycaster();let objects=colliders.map(c=>c.o);
 const insideDirection=new THREE.Vector3(1,.217,.431).normalize();
 function inside(c,point){if(!c.o.userData.concave)return c.planes.every(p=>p.distanceToPoint(point)<-1e-5);const old=c.o.material.side;c.o.material.side=THREE.DoubleSide;insideRay.set(v,insideDirection);insideRay.near=.0001;let hits=insideRay.intersectObject(c.o,false);c.o.material.side=old;let ds=[];for(let h of hits)if(!ds.some(d=>Math.abs(d-h.distance)<.001))ds.push(h.distance);return ds.length%2===1;}
 for(const route of routes){for(let s=0;s<route.points.length-1;s++){let a=new THREE.Vector3(...route.points[s]),b=new THREE.Vector3(...route.points[s+1]),len=a.distanceTo(b),horizontal=Math.hypot(b.x-a.x,b.z-a.z);if(horizontal<.01)continue;let normal=new THREE.Vector3(b.z-a.z,0,a.x-b.x).normalize();let steps=Math.ceil(len/spacing);
  for(let k=0;k<=steps;k++){let center=a.clone().lerp(b,k/steps);samples++;let found=new Map();for(let offset of [-radius,0,radius]){for(let h of [.42,1.1,1.8,2.3]){v.copy(center).addScaledVector(normal,offset);v.y+=h;for(let c of colliders){if(!c.box.containsPoint(v))continue;local.copy(v).applyMatrix4(c.inv);if(c.local.containsPoint(local)&&inside(c,local)){found.set(c.o.uuid,c);}}}}
   if(found.size)blocked.push({route:route.name,segment:s,at:center.toArray().map(v=>+v.toFixed(2)),objects:[...found.values()].map(c=>({name:c.o.name||c.o.parent.name||'unnamed',material:c.o.material.color?.getHexString(),center:c.box.getCenter(new THREE.Vector3()).toArray().map(v=>+v.toFixed(2))}))});
   if(checkSupport)for(let offset of [-radius,0,radius]){v.copy(center).addScaledVector(normal,offset);v.y+=.36;ray.set(v,new THREE.Vector3(0,-1,0));ray.near=0;ray.far=.95;let hits=ray.intersectObjects(objects,false);if(!hits.length){unsupported.push({route:route.name,segment:s,at:center.toArray().map(v=>+v.toFixed(2)),offset});break}}
  }
 }}
 return {spacing,radius,height:2.3,samples,blockedSamples:blocked.length,unsupportedSamples:unsupported.length,blocked,unsupported};
}
