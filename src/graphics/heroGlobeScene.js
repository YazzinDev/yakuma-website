import * as THREE from 'three';
import landMaskUrl from '../assets/design/natural-earth-land-mask.png';

const ACCENT = new THREE.Color('#c9b8ef');
const RADIUS = 1.5;
const CAMERA_DISTANCE = 6.72;
const OCCLUDER_RADIUS = 1.47;
const SCENE_OVERSCAN = 1.4;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
let lossPreviewTriggered = false;
const GLOBE_VERTEX = `
  attribute float aIntensity;
  attribute float aOpacity;
  uniform float uPointSize;
  varying float vIntensity;
  varying float vOpacity;
  void main() {
    vIntensity = aIntensity;
    vOpacity = aOpacity;
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = uPointSize * (4.2 / -viewPosition.z);
  }
`;
const GLOBE_FRAGMENT = `
  uniform vec3 uColor;
  varying float vIntensity;
  varying float vOpacity;
  void main() {
    float radius = length(gl_PointCoord - vec2(0.5));
    if (radius > 0.5) discard;
    float edge = smoothstep(0.5, 0.28, radius);
    gl_FragColor = vec4(uColor * vIntensity, vOpacity * edge);
  }
`;
const ORBIT_VERTEX = `
  attribute float aOpacity;
  varying float vOpacity;
  void main() {
    vOpacity = aOpacity;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const ORBIT_FRAGMENT = `
  uniform vec3 uColor;
  varying float vOpacity;
  void main() {
    gl_FragColor = vec4(uColor, vOpacity);
  }
`;

function pointMaterial(size) {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: ACCENT }, uPointSize: { value: size } },
    vertexShader: GLOBE_VERTEX,
    fragmentShader: GLOBE_FRAGMENT,
    transparent: true,
    depthWrite: false,
    depthTest: true,
  });
}

async function loadMask() {
  const image = new Image();
  image.src = landMaskUrl;
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.drawImage(image, 0, 0);
  return { data: context.getImageData(0, 0, canvas.width, canvas.height).data, width: canvas.width, height: canvas.height };
}

function globePointCloud(mask, mobile) {
  const candidates = mobile ? 8000 : 14000;
  const positions = [];
  const intensity = [];
  const opacity = [];
  for (let index = 0; index < candidates; index += 1) {
    const vertical = 1 - 2 * (index + 0.5) / candidates;
    const horizontal = Math.sqrt(1 - vertical * vertical);
    const angle = index * GOLDEN_ANGLE;
    const longitude = ((angle / Math.PI * 180 + 180) % 360 + 360) % 360 - 180;
    const x = Math.min(mask.width - 1, Math.floor((longitude + 180) / 360 * mask.width));
    const y = Math.min(mask.height - 1, Math.floor((1 - vertical) / 2 * mask.height));
    const land = mask.data[(y * mask.width + x) * 4] > 127;
    if (!land && index % 3 !== 0) continue;
    const point = [RADIUS * horizontal * Math.sin(angle), RADIUS * vertical, RADIUS * horizontal * Math.cos(angle)];
    positions.push(...point);
    intensity.push(land ? 1 : 0.32);
    opacity.push(land ? 0.96 : 0.28);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('aIntensity', new THREE.Float32BufferAttribute(intensity, 1));
  geometry.setAttribute('aOpacity', new THREE.Float32BufferAttribute(opacity, 1));
  const material = pointMaterial(mobile ? 2.2 : 2.6);
  return { points: new THREE.Points(geometry, material) };
}

function orbitArc(radius, span, count, angles, speed, phase) {
  const positions = new Float32Array(count * 3);
  const opacity = new Float32Array(count);
  for (let index = 0; index < count; index += 1) {
    const fraction = index / (count - 1);
    const angle = (fraction - 1) * span;
    positions[index * 3] = radius * Math.cos(angle);
    positions[index * 3 + 1] = radius * Math.sin(angle);
    // The bright head must lead in the direction the arc actually travels.
    opacity[index] = Math.pow(speed >= 0 ? fraction : 1 - fraction, 1.4) * 0.62;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aOpacity', new THREE.BufferAttribute(opacity, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: ACCENT } },
    vertexShader: ORBIT_VERTEX,
    fragmentShader: ORBIT_FRAGMENT,
    transparent: true,
    depthWrite: false,
    depthTest: true,
  });
  const segment = new THREE.Line(geometry, material);
  const plane = new THREE.Group();
  plane.rotation.set(...angles);
  plane.add(segment);
  segment.rotation.z = phase;
  return { plane, segment, speed };
}

function particleEmitter(mobile) {
  const count = mobile ? 28 : 54;
  const positions = new Float32Array(count * 3);
  const intensity = new Float32Array(count).fill(1);
  const opacity = new Float32Array(count);
  const particles = Array.from({ length: count }, () => ({ age: 0, lifetime: 0, velocity: new THREE.Vector3() }));
  const geometry = new THREE.BufferGeometry();
  const positionAttribute = new THREE.BufferAttribute(positions, 3);
  const opacityAttribute = new THREE.BufferAttribute(opacity, 1);
  positionAttribute.setUsage(THREE.DynamicDrawUsage);
  opacityAttribute.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute('position', positionAttribute);
  geometry.setAttribute('aIntensity', new THREE.BufferAttribute(intensity, 1));
  geometry.setAttribute('aOpacity', opacityAttribute);
  const points = new THREE.Points(geometry, pointMaterial(mobile ? 2.4 : 2.8));
  let seed = 0x4a4b4d41;
  let accumulated = 0;
  let emitted = 0;
  let faded = 0;
  const random = () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return (seed >>> 0) / 4294967296;
  };
  const current = new THREE.Vector3();
  function emit() {
    const index = particles.findIndex(particle => particle.lifetime <= 0);
    if (index < 0) return;
    // Spawn on the visible silhouette, never on the near face of the globe.
    const angle = random() * Math.PI * 2;
    const depth = RADIUS * RADIUS / CAMERA_DISTANCE;
    const rim = Math.sqrt(RADIUS * RADIUS - depth * depth);
    current.set(rim * Math.cos(angle), rim * Math.sin(angle), depth);
    const particle = particles[index];
    particle.age = 0;
    particle.lifetime = 1.25 + random() * 1.5;
    particle.velocity.copy(current).normalize().multiplyScalar(0.16 + random() * 0.2);
    particle.velocity.x += (random() - 0.5) * 0.12;
    particle.velocity.y += (random() - 0.5) * 0.12;
    current.toArray(positions, index * 3);
    emitted += 1;
  }
  function update(delta) {
    accumulated += delta;
    const interval = mobile ? 0.27 : 0.16;
    while (accumulated >= interval) { accumulated -= interval; emit(); }
    particles.forEach((particle, index) => {
      if (particle.lifetime <= 0) return;
      particle.age += delta;
      if (particle.age >= particle.lifetime) { particle.lifetime = 0; opacity[index] = 0; faded += 1; return; }
      positions[index * 3] += particle.velocity.x * delta;
      positions[index * 3 + 1] += particle.velocity.y * delta;
      positions[index * 3 + 2] += particle.velocity.z * delta;
      opacity[index] = 0.8 * (1 - particle.age / particle.lifetime);
    });
    positionAttribute.needsUpdate = true;
    opacityAttribute.needsUpdate = true;
  }
  return { points, update, statistics: () => ({ active: particles.filter(particle => particle.lifetime > 0).length, emitted, faded }) };
}

export async function createHeroGlobeScene(container, { mobile, onReady }) {
  const mask = await loadMask();
  const exportPreview = import.meta.env.DEV && new URLSearchParams(window.location.search).has('exportGlobeFrame');
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !mobile, powerPreference: 'low-power', preserveDrawingBuffer: exportPreview });
  renderer.domElement.setAttribute('aria-hidden', 'true');
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 20);
  camera.position.z = CAMERA_DISTANCE;
  const globe = new THREE.Group();
  globe.rotation.y = -0.35;
  globe.rotation.z = -0.11;
  const pointCloud = globePointCloud(mask, mobile);
  if (import.meta.env.DEV) {
    renderer.domElement.dataset.quality = mobile ? 'mobile' : 'desktop';
    renderer.domElement.dataset.points = String(pointCloud.points.geometry.getAttribute('position').count);
  }
  globe.add(pointCloud.points);
  scene.add(globe);
  const occluder = new THREE.Mesh(new THREE.SphereGeometry(OCCLUDER_RADIUS, 40, 24), new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: true }));
  occluder.renderOrder = -1;
  scene.add(occluder);
  // Equal-magnitude counter-rotating tracks and staggered phases keep a trail
  // visible while other heads or trail fragments pass behind the globe.
  const orbits = [
    orbitArc(2.02, 2.1, mobile ? 64 : 110, [1.2, 0.14, -0.58], 0.22, 5.882),
    orbitArc(2.06, 2, mobile ? 60 : 104, [-1.2, 0.30, 0.64], -0.22, 5.760),
    orbitArc(2.04, 0.85, mobile ? 36 : 60, [0.4, 1.1, 0.3], 0.22, 1.606),
  ];
  orbits.forEach(orbit => scene.add(orbit.plane));
  const emitter = particleEmitter(mobile);
  scene.add(emitter.points);
  container.appendChild(renderer.domElement);
  let exportButton;
  if (exportPreview) {
    exportButton = document.createElement('button');
    exportButton.type = 'button';
    exportButton.textContent = 'Export globe first frame';
    Object.assign(exportButton.style, { position: 'fixed', top: '12px', left: '12px', zIndex: '1000' });
    exportButton.addEventListener('click', () => {
      renderer.domElement.toBlob(blob => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'yakuma-globe-first-frame.png';
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }, 'image/png');
    });
    document.body.appendChild(exportButton);
  }
  let rendered = false;
  let lastWidth = 0;
  let lastHeight = 0;
  const resize = () => {
    const width = Math.round(container.clientWidth * SCENE_OVERSCAN);
    const height = Math.round(container.clientHeight * SCENE_OVERSCAN);
    if (!width || !height || (width === lastWidth && height === lastHeight)) return;
    lastWidth = width;
    lastHeight = height;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    renderer.render(scene, camera);
    if (!rendered) {
      rendered = true;
      onReady?.();
    }
  };
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();
  let running = false;
  let frame = 0;
  let lastTime = 0;
  let lastDiagnostic = 0;
  const previewTimers = [];
  function updateDiagnostic(now) {
    if (!import.meta.env.DEV || now - lastDiagnostic < 250) return;
    lastDiagnostic = now;
    renderer.domElement.dataset.rotation = globe.rotation.y.toFixed(3);
    renderer.domElement.dataset.orbits = orbits.map(orbit => orbit.segment.rotation.z.toFixed(3)).join(',');
    const particles = emitter.statistics();
    renderer.domElement.dataset.particles = String(particles.active);
    renderer.domElement.dataset.emitted = String(particles.emitted);
    renderer.domElement.dataset.faded = String(particles.faded);
    renderer.domElement.dataset.running = String(running);
  }
  function animate(now) {
    if (!running) return;
    const delta = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 0;
    lastTime = now;
    globe.rotation.y += delta * 0.16;
    orbits.forEach(orbit => { orbit.segment.rotation.z += delta * orbit.speed; });
    emitter.update(delta);
    renderer.render(scene, camera);
    updateDiagnostic(now);
    frame = requestAnimationFrame(animate);
  }
  if (import.meta.env.DEV && !lossPreviewTriggered && new URLSearchParams(window.location.search).has('simulateGlobeLoss')) {
    lossPreviewTriggered = true;
    const extension = renderer.getContext().getExtension('WEBGL_lose_context');
    renderer.domElement.dataset.lossPreview = extension ? 'supported' : 'unsupported';
    if (extension) {
      previewTimers.push(setTimeout(() => extension.loseContext(), 500));
      previewTimers.push(setTimeout(() => extension.restoreContext(), 8000));
    }
  }
  return {
    setActive(active) {
      if (active === running) return;
      running = active;
      if (import.meta.env.DEV) renderer.domElement.dataset.running = String(running);
      if (active) { lastTime = 0; frame = requestAnimationFrame(animate); }
      else cancelAnimationFrame(frame);
    },
    dispose() {
      running = false;
      cancelAnimationFrame(frame);
      previewTimers.forEach(clearTimeout);
      exportButton?.remove();
      observer.disconnect();
      scene.traverse(object => {
        object.geometry?.dispose();
        object.material?.dispose();
      });
      // Detach before forcing a context loss so cleanup cannot masquerade as a
      // recoverable loss on the still-mounted Hero container.
      renderer.domElement.remove();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
