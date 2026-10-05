import * as THREE from './vendor/three.module.js';

// Keep the complete square artwork, including its pink background, on a 3D tile.
export function mountLogo(host,src) {
  let renderer;
  try { renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'}); }
  catch { host.innerHTML='<p class="small">Interactive 3D is unavailable in this browser.</p>'; const img=new Image();img.src=src;img.alt='Law Society logo';host.append(img);return ()=>{}; }
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.setClearColor(0x000000,0);
  renderer.domElement.tabIndex=0;
  renderer.domElement.setAttribute('role','img');
  renderer.domElement.setAttribute('aria-label','Interactive 3D Law Society logo. Drag to rotate, use arrow keys to turn, or press Home to reset.');
  host.append(renderer.domElement);
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(36,1,.1,100);
  camera.position.set(0,-.28,5.55);camera.lookAt(0,.22,0);
  scene.add(new THREE.AmbientLight(0xffffff,.9));
  const key=new THREE.DirectionalLight(0xffffff,2.3);key.position.set(3.5,4.5,5);scene.add(key);
  const rim=new THREE.DirectionalLight(0xb6b4ed,1.0);rim.position.set(-4,1.5,-2);scene.add(rim);
  const fill=new THREE.PointLight(0xeacb82,8,20);fill.position.set(0,-2,3);scene.add(fill);
  const group=new THREE.Group();group.position.y=.18;group.rotation.set(.20,.4,0);scene.add(group);
  let dead=false,dragging=false,x=0,y=0,vx=0,vy=0,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,lastInteraction=0,lastFrame=performance.now();
  let texture,geometry,material;
  new THREE.TextureLoader().load(src,tex=>{
    if(dead){tex.dispose();return;} texture=tex;tex.colorSpace=THREE.SRGBColorSpace;
    tex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
    const face=new THREE.MeshBasicMaterial({map:tex});
    const edge=new THREE.MeshStandardMaterial({color:0xf8cbc7,metalness:.15,roughness:.65});
    material=[edge,edge,edge,edge,face,face];
    geometry=new THREE.BoxGeometry(2.75,2.75,.18);
    group.add(new THREE.Mesh(geometry,material));
    host.dataset.ready='true';
  },undefined,()=>{host.dataset.ready='error';host.insertAdjacentHTML('beforeend','<p class="small">Unable to load the logo.</p>')});
  const resize=()=>{if(!host.isConnected)return;const w=host.clientWidth,h=host.clientHeight;camera.aspect=w/Math.max(h,1);camera.updateProjectionMatrix();renderer.setSize(w,h);};
  const observer=new ResizeObserver(resize);observer.observe(host);resize();
  const canvas=renderer.domElement;
  canvas.addEventListener('pointerdown',e=>{dragging=true;vx=vy=0;x=e.clientX;y=e.clientY;canvas.setPointerCapture(e.pointerId);canvas.style.cursor='grabbing';lastInteraction=performance.now()});
  canvas.addEventListener('pointermove',e=>{if(!dragging)return;vx=(e.clientX-x)*.01;vy=(e.clientY-y)*.01;group.rotation.y+=vx;group.rotation.x+=vy;x=e.clientX;y=e.clientY;host.dataset.rotation=String(group.rotation.y.toFixed(3));});
  const release=e=>{dragging=false;lastInteraction=performance.now();if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);canvas.style.cursor='grab'};
  canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);
  canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key))return;e.preventDefault();lastInteraction=performance.now();if(e.key==='Home')group.rotation.set(.20,.4,0);else if(e.key==='ArrowLeft')group.rotation.y-=.2;else if(e.key==='ArrowRight')group.rotation.y+=.2;else group.rotation.x+=e.key==='ArrowUp'?-.15:.15;host.dataset.rotation=String(group.rotation.y.toFixed(3))});
  host.parentElement.querySelector('[data-logo-pause]')?.addEventListener('click',e=>{paused=!paused;e.target.textContent=paused?'Resume rotation':'Pause rotation';e.target.setAttribute('aria-pressed',String(paused));vx=vy=0});
  host.parentElement.querySelector('[data-logo-reset]')?.addEventListener('click',()=>{group.rotation.set(.20,.4,0);vx=vy=0;lastInteraction=performance.now()});
  const pause=host.parentElement.querySelector('[data-logo-pause]');if(pause){pause.textContent=paused?'Resume rotation':'Pause rotation';pause.setAttribute('aria-pressed',String(paused))}
  renderer.setAnimationLoop(now=>{if(dead)return;const delta=Math.min((now-lastFrame)/16.667,3);lastFrame=now;if(document.hidden)return;if(!dragging&&!paused){if(Math.abs(vx)+Math.abs(vy)>.0008){group.rotation.y+=vx*delta;group.rotation.x+=vy*delta;vx*=Math.pow(.94,delta);vy*=Math.pow(.94,delta)}else if(now-lastInteraction>1600)group.rotation.y+=.0045*delta;}group.rotation.x=THREE.MathUtils.clamp(group.rotation.x,-.85,1.05);renderer.render(scene,camera)});
  return ()=>{dead=true;observer.disconnect();renderer.setAnimationLoop(null);geometry?.dispose();if(material)for(const m of new Set(material))m.dispose();texture?.dispose();renderer.dispose();renderer.forceContextLoss();canvas.remove()};
}
