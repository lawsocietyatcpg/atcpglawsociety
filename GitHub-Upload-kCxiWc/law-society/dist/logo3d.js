import * as THREE from './vendor/three.module.js';

// The medallion image supplies the embossed artwork; actual cylinder geometry supplies coin thickness.
export function mountLogo(host,src) {
  let renderer;
  try { renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'}); }
  catch { host.innerHTML='<p class="small">Interactive 3D is unavailable in this browser.</p>'; const img=new Image();img.src=src;img.alt='Law Society medallion';host.append(img);return ()=>{}; }
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.setClearColor(0x000000,0);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.domElement.tabIndex=0;
  renderer.domElement.setAttribute('role','img');
  renderer.domElement.setAttribute('aria-label','Interactive silver Law Society coin. Drag to rotate, use arrow keys to turn, or press Home to reset.');
  host.append(renderer.domElement);

  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(37,1,.1,100);
  camera.position.set(0,-.12,4.65);camera.lookAt(0,0,0);
  scene.add(new THREE.AmbientLight(0xffffff,1.15));
  const key=new THREE.DirectionalLight(0xffffff,2.6);key.position.set(3.5,4,5);scene.add(key);
  const rimLight=new THREE.DirectionalLight(0xd7e0ec,1.7);rimLight.position.set(-3,2,-4);scene.add(rimLight);
  const fill=new THREE.PointLight(0xffffff,7,15);fill.position.set(-3,-2,4);scene.add(fill);

  const group=new THREE.Group();group.rotation.set(.16,.42,0);scene.add(group);
  let dead=false,dragging=false,x=0,y=0,vx=0,vy=0,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,lastInteraction=0,lastFrame=performance.now();
  let texture,edgeTexture,geometry,faceGeometry,ringGeometry,faceMaterial,edgeMaterial,capMaterial,ringMaterial;
  new THREE.TextureLoader().load(src,tex=>{
    if(dead){tex.dispose();return}
    texture=tex;tex.colorSpace=THREE.SRGBColorSpace;
    tex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
    faceMaterial=new THREE.MeshBasicMaterial({map:tex,transparent:true,alphaTest:.03,side:THREE.DoubleSide});
    const ridge=document.createElement('canvas');ridge.width=256;ridge.height=32;
    const context=ridge.getContext('2d');
    for(let i=0;i<256;i++){
      const shine=Math.cos(i*Math.PI/4)*19+Math.cos(i*Math.PI/2)*7;
      const base=Math.round(155+shine);
      context.fillStyle=`rgb(${base},${base+2},${base+4})`;
      context.fillRect(i,0,1,32);
    }
    edgeTexture=new THREE.CanvasTexture(ridge);edgeTexture.colorSpace=THREE.SRGBColorSpace;
    edgeMaterial=new THREE.MeshStandardMaterial({map:edgeTexture,color:0xc9ced2,metalness:.72,roughness:.31});
    capMaterial=new THREE.MeshStandardMaterial({color:0xa4a9ad,metalness:.7,roughness:.38});
    geometry=new THREE.CylinderGeometry(1.28,1.28,.18,128,1,false);
    geometry.rotateX(Math.PI/2);
    group.add(new THREE.Mesh(geometry,[edgeMaterial,capMaterial,capMaterial]));
    faceGeometry=new THREE.CircleGeometry(1.279,128);
    const front=new THREE.Mesh(faceGeometry,faceMaterial);front.position.z=.091;group.add(front);
    const back=new THREE.Mesh(faceGeometry,faceMaterial);back.position.z=-.091;back.rotation.y=Math.PI;group.add(back);
    ringGeometry=new THREE.TorusGeometry(1.272,.014,8,128);
    ringMaterial=new THREE.MeshStandardMaterial({color:0xd7d9d8,metalness:.8,roughness:.24});
    for(const depth of [-.092,.092]){const ring=new THREE.Mesh(ringGeometry,ringMaterial);ring.position.z=depth;group.add(ring)}
    host.dataset.ready='true';
  },undefined,()=>{host.dataset.ready='error';host.insertAdjacentHTML('beforeend','<p class="small">Unable to load the medallion.</p>')});

  const resize=()=>{if(!host.isConnected)return;const w=host.clientWidth,h=host.clientHeight;camera.aspect=w/Math.max(h,1);camera.updateProjectionMatrix();renderer.setSize(w,h)};
  const observer=new ResizeObserver(resize);observer.observe(host);resize();
  const canvas=renderer.domElement;canvas.style.cursor='grab';
  canvas.addEventListener('pointerdown',e=>{dragging=true;vx=vy=0;x=e.clientX;y=e.clientY;canvas.setPointerCapture(e.pointerId);canvas.style.cursor='grabbing';lastInteraction=performance.now()});
  canvas.addEventListener('pointermove',e=>{if(!dragging)return;vx=(e.clientX-x)*.01;vy=(e.clientY-y)*.01;group.rotation.y+=vx;group.rotation.x+=vy;x=e.clientX;y=e.clientY;host.dataset.rotation=String(group.rotation.y.toFixed(3))});
  const release=e=>{dragging=false;lastInteraction=performance.now();if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);canvas.style.cursor='grab'};
  canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);
  canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key))return;e.preventDefault();lastInteraction=performance.now();if(e.key==='Home')group.rotation.set(.16,.42,0);else if(e.key==='ArrowLeft')group.rotation.y-=.2;else if(e.key==='ArrowRight')group.rotation.y+=.2;else group.rotation.x+=e.key==='ArrowUp'?-.15:.15;host.dataset.rotation=String(group.rotation.y.toFixed(3))});
  host.parentElement.querySelector('[data-logo-pause]')?.addEventListener('click',e=>{paused=!paused;e.target.textContent=paused?'Resume rotation':'Pause rotation';e.target.setAttribute('aria-pressed',String(paused));vx=vy=0});
  host.parentElement.querySelector('[data-logo-reset]')?.addEventListener('click',()=>{group.rotation.set(.16,.42,0);vx=vy=0;lastInteraction=performance.now()});
  const pause=host.parentElement.querySelector('[data-logo-pause]');if(pause){pause.textContent=paused?'Resume rotation':'Pause rotation';pause.setAttribute('aria-pressed',String(paused))}
  renderer.setAnimationLoop(now=>{if(dead)return;const delta=Math.min((now-lastFrame)/16.667,3);lastFrame=now;if(document.hidden)return;if(!dragging&&!paused){if(Math.abs(vx)+Math.abs(vy)>.0008){group.rotation.y+=vx*delta;group.rotation.x+=vy*delta;vx*=Math.pow(.94,delta);vy*=Math.pow(.94,delta)}else if(now-lastInteraction>1600)group.rotation.y+=.006*delta}group.rotation.x=THREE.MathUtils.clamp(group.rotation.x,-.85,1.05);renderer.render(scene,camera)});
  return ()=>{dead=true;observer.disconnect();renderer.setAnimationLoop(null);geometry?.dispose();faceGeometry?.dispose();ringGeometry?.dispose();faceMaterial?.dispose();edgeMaterial?.dispose();capMaterial?.dispose();ringMaterial?.dispose();texture?.dispose();edgeTexture?.dispose();renderer.dispose();renderer.forceContextLoss();canvas.remove()};
}
