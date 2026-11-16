import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { ChevronDown, ChevronUp, Lightbulb, RotateCw } from 'lucide-react';
import type { ColorOption, Vehicle } from '../data/vehicles';

interface Showroom3DStageProps {
  vehicle: Vehicle;
  selectedColor: ColorOption;
  onSelectColor: (color: ColorOption) => void;
}

type CameraPresetKey = 'hero' | 'side' | 'front' | 'rear' | 'top';

interface CameraPreset {
  id: CameraPresetKey;
  label: string;
  position: [number, number, number];
  target: [number, number, number];
}

const CAMERA_PRESETS: CameraPreset[] = [
  { id: 'hero', label: '3/4 Studio', position: [4.6, 1.85, 4.8], target: [0, 0.65, 0] },
  { id: 'side', label: 'Side Profile', position: [0.1, 1.35, 6.2], target: [0, 0.65, 0] },
  { id: 'front', label: 'Front Optics', position: [5.4, 1.25, 0.25], target: [0, 0.65, 0] },
  { id: 'rear', label: 'Rear Aero', position: [-5.3, 1.45, 0.9], target: [0, 0.65, 0] },
  { id: 'top', label: 'Overhead', position: [0.2, 6.4, 1.8], target: [0, 0.4, 0] },
];

const _desiredPos = new THREE.Vector3();
const _desiredTarget = new THREE.Vector3();

function detectSoftwareWebGL(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function buildCarSilhouette(
  bodyStyle: Vehicle['bodyStyle'],
  paintMat: THREE.MeshPhysicalMaterial,
  glassMat: THREE.MeshPhysicalMaterial,
  trimMat: THREE.MeshStandardMaterial,
  carbonMat: THREE.MeshStandardMaterial,
  tireMat: THREE.MeshStandardMaterial,
  alloyMat: THREE.MeshStandardMaterial,
  caliperMat: THREE.MeshStandardMaterial,
  headlightMat: THREE.MeshStandardMaterial,
  taillightMat: THREE.MeshStandardMaterial
): THREE.Group {
  const carGroup = new THREE.Group();

  const isSuv = bodyStyle === 'suv';
  const isWagon = bodyStyle === 'wagon';
  const isRoadster = bodyStyle === 'roadster';
  const isSedan = bodyStyle === 'sedan';

  const rideHeight = isSuv ? 0.26 : isWagon ? 0.2 : 0.14;
  const roofPeakY = isSuv ? 1.44 : isWagon ? 1.28 : isRoadster ? 1.12 : 1.18;
  const hoodY = isSuv ? 0.92 : isWagon ? 0.84 : 0.72;
  const bodyWidth = isSuv ? 1.92 : 1.88;
  const halfW = bodyWidth / 2;

  // 1. Lower sculpted chassis body (ExtrudeGeometry side profile)
  const bodyShape = new THREE.Shape();
  bodyShape.moveTo(-2.32, rideHeight + 0.08);
  bodyShape.lineTo(2.26, rideHeight + 0.04);
  bodyShape.quadraticCurveTo(2.44, rideHeight + 0.14, 2.38, hoodY - 0.12);
  bodyShape.quadraticCurveTo(2.15, hoodY, 1.38, hoodY + 0.06);
  bodyShape.lineTo(0.84, hoodY + 0.14);
  bodyShape.lineTo(-1.35, hoodY + (isSuv || isWagon ? 0.2 : 0.16));
  bodyShape.quadraticCurveTo(-2.22, hoodY + (isSuv ? 0.22 : 0.14), -2.35, rideHeight + 0.34);
  bodyShape.closePath();

  const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, {
    depth: bodyWidth - 0.16,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.06,
    bevelSegments: 4,
    curveSegments: 16,
  });
  bodyGeo.translate(0, 0, -(bodyWidth - 0.16) / 2);
  const bodyMesh = new THREE.Mesh(bodyGeo, paintMat);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  carGroup.add(bodyMesh);

  // 2. Sculpted Greenhouse / Cabin Canopy
  const cabinShape = new THREE.Shape();
  const cabinStartX = isRoadster ? 0.68 : 0.92;
  const cabinEndX = isSuv || isWagon ? -1.96 : isSedan ? -1.65 : -1.58;
  const cabinBaseY = hoodY + 0.06;

  cabinShape.moveTo(cabinStartX, cabinBaseY);
  cabinShape.quadraticCurveTo(
    cabinStartX - 0.48,
    roofPeakY + 0.02,
    isRoadster ? 0.0 : 0.1,
    roofPeakY
  );
  if (isSuv || isWagon) {
    cabinShape.lineTo(-1.25, roofPeakY - 0.04);
    cabinShape.quadraticCurveTo(-1.72, roofPeakY - 0.08, cabinEndX, cabinBaseY + 0.1);
  } else {
    cabinShape.quadraticCurveTo(-0.92, roofPeakY - 0.02, cabinEndX, cabinBaseY + 0.08);
  }
  cabinShape.closePath();

  const cabinGeo = new THREE.ExtrudeGeometry(cabinShape, {
    depth: bodyWidth - 0.44,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.05,
    bevelSegments: 3,
    curveSegments: 14,
  });
  cabinGeo.translate(0, 0, -(bodyWidth - 0.44) / 2);
  const cabinMesh = new THREE.Mesh(cabinGeo, glassMat);
  cabinMesh.castShadow = true;
  carGroup.add(cabinMesh);

  // 3. Painted Roof Arch / Spine (or acoustic soft top for roadster)
  const roofRibbonGeo = new THREE.ExtrudeGeometry(cabinShape, {
    depth: bodyWidth - 0.56,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.02,
    bevelSegments: 2,
  });
  roofRibbonGeo.translate(0, 0.015, -(bodyWidth - 0.56) / 2);
  const roofMat = isRoadster ? trimMat : paintMat;
  const roofRibbon = new THREE.Mesh(roofRibbonGeo, roofMat);
  roofRibbon.scale.set(0.94, 0.99, 1);
  carGroup.add(roofRibbon);

  // 4. Lower Carbon Front Splitter & Side Aero Skirts
  const splitterGeo = new THREE.BoxGeometry(0.46, 0.045, bodyWidth - 0.06);
  const splitter = new THREE.Mesh(splitterGeo, carbonMat);
  splitter.position.set(2.26, rideHeight + 0.03, 0);
  splitter.castShadow = true;
  carGroup.add(splitter);

  const skirtGeo = new THREE.BoxGeometry(2.75, 0.05, bodyWidth + 0.02);
  const skirts = new THREE.Mesh(skirtGeo, carbonMat);
  skirts.position.set(-0.04, rideHeight + 0.04, 0);
  carGroup.add(skirts);

  // 5. Rear Diffuser & Aero Fin Housing
  const diffuserGeo = new THREE.BoxGeometry(0.38, 0.13, bodyWidth - 0.14);
  const diffuser = new THREE.Mesh(diffuserGeo, carbonMat);
  diffuser.position.set(-2.22, rideHeight + 0.11, 0);
  carGroup.add(diffuser);

  // 6. Front Matrix LED Light Blade
  const frontLightGeo = new THREE.BoxGeometry(0.06, 0.045, bodyWidth - 0.24);
  const frontLight = new THREE.Mesh(frontLightGeo, headlightMat);
  frontLight.position.set(2.38, hoodY - 0.14, 0);
  carGroup.add(frontLight);

  // 7. Rear Full-Width Tail Light Bar
  const rearLightGeo = new THREE.BoxGeometry(0.05, 0.04, bodyWidth - 0.22);
  const rearLight = new THREE.Mesh(rearLightGeo, taillightMat);
  rearLight.position.set(-2.36, hoodY - 0.02, 0);
  carGroup.add(rearLight);

  // 8. Side Wing Mirrors (left & right)
  const mirrorGeo = new THREE.BoxGeometry(0.16, 0.075, 0.12);
  [-1, 1].forEach((side) => {
    const mirror = new THREE.Mesh(mirrorGeo, carbonMat);
    mirror.position.set(0.68, hoodY + 0.14, side * (halfW + 0.04));
    mirror.castShadow = true;
    carGroup.add(mirror);
  });

  // 9. Four Wheel Assemblies (Tire + Forged Multi-Spoke Rim + Rotor + Caliper)
  const wheelRadius = isSuv ? 0.39 : 0.35;
  const wheelWidth = 0.27;
  const axlePositions: [number, number][] = [
    [1.48, halfW - 0.05],
    [1.48, -(halfW - 0.05)],
    [-1.46, halfW - 0.05],
    [-1.46, -(halfW - 0.05)],
  ];

  const tireGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 32);
  tireGeo.rotateX(Math.PI / 2);
  const rimGeo = new THREE.CylinderGeometry(wheelRadius * 0.72, wheelRadius * 0.72, wheelWidth + 0.015, 24);
  rimGeo.rotateX(Math.PI / 2);
  const hubGeo = new THREE.CylinderGeometry(wheelRadius * 0.22, wheelRadius * 0.22, wheelWidth + 0.03, 16);
  hubGeo.rotateX(Math.PI / 2);
  const spokeGeo = new THREE.BoxGeometry(0.032, wheelRadius * 1.36, wheelWidth + 0.018);
  const caliperGeo = new THREE.BoxGeometry(0.14, 0.21, 0.12);

  axlePositions.forEach(([ax, az]) => {
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(ax, wheelRadius, az);

    const tire = new THREE.Mesh(tireGeo, tireMat);
    tire.castShadow = true;
    wheelGroup.add(tire);

    const rim = new THREE.Mesh(rimGeo, alloyMat);
    wheelGroup.add(rim);

    const hub = new THREE.Mesh(hubGeo, carbonMat);
    wheelGroup.add(hub);

    for (let s = 0; s < 5; s += 1) {
      const spoke = new THREE.Mesh(spokeGeo, alloyMat);
      spoke.rotation.z = (s * Math.PI) / 5;
      wheelGroup.add(spoke);
    }

    const caliper = new THREE.Mesh(caliperGeo, caliperMat);
    caliper.position.set(ax > 0 ? -0.14 : 0.14, 0.03, az > 0 ? 0.02 : -0.02);
    wheelGroup.add(caliper);

    carGroup.add(wheelGroup);
  });

  // 10. Ground Contact Shadow Plane beneath car
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 256;
  shadowCanvas.height = 256;
  const ctx = shadowCanvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(128, 128, 22, 128, 128, 122);
    grad.addColorStop(0, 'rgba(0,0,0,0.65)');
    grad.addColorStop(0.55, 'rgba(0,0,0,0.28)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
  }
  const shadowTex = new THREE.CanvasTexture(shadowCanvas);
  const shadowGeo = new THREE.PlaneGeometry(5.6, 2.9);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    depthWrite: false,
    opacity: 0.72,
  });
  const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
  contactShadow.position.y = 0.015;
  carGroup.add(contactShadow);

  return carGroup;
}

export function Showroom3DStage({
  vehicle,
  selectedColor,
  onSelectColor,
}: Showroom3DStageProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [activePreset, setActivePreset] = useState<CameraPresetKey>('hero');
  const [headlightsOn, setHeadlightsOn] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [dockCollapsed, setDockCollapsed] = useState(false);

  const presetRef = useRef<CameraPreset | null>(CAMERA_PRESETS[0]);
  const headlightsRef = useRef(headlightsOn);
  const autoRotateRef = useRef(autoRotate);
  const paintMaterialRef = useRef<THREE.MeshPhysicalMaterial | null>(null);
  const headlightMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const taillightMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const requestRenderRef = useRef<() => void>(() => {});
  const carContainerRef = useRef<THREE.Group | null>(null);
  const bodyStyleRef = useRef(vehicle.bodyStyle);

  headlightsRef.current = headlightsOn;
  autoRotateRef.current = autoRotate;
  bodyStyleRef.current = vehicle.bodyStyle;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGL();
    const width = container.clientWidth || 900;
    const height = container.clientHeight || 520;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#141517');
    scene.fog = new THREE.Fog('#141517', 12, 30);

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(4.6, 1.85, 4.8);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmremGenerator.dispose();

    // 3-Point Warm/Cool Studio Rig + Softboxes
    const hemiLight = new THREE.HemisphereLight(0xcbd5e1, 0x262420, 0.65);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff4e6, 2.2);
    keyLight.position.set(6, 8, 5);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 25;
    keyLight.shadow.camera.left = -5;
    keyLight.shadow.camera.right = 5;
    keyLight.shadow.camera.top = 5;
    keyLight.shadow.camera.bottom = -5;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x93c5fd, 0.9);
    rimLight.position.set(-6, 4, -5);
    scene.add(rimLight);

    if (!isSoftwareGl) {
      RectAreaLightUniformsLib.init();
      const softbox = new THREE.RectAreaLight(0xffffff, 4.2, 7.5, 2.4);
      softbox.position.set(0, 4.4, 0);
      softbox.lookAt(0, 0, 0);
      scene.add(softbox);
    }

    // Architectural Showroom Floor & Turntable Plinth
    const floorGeo = new THREE.PlaneGeometry(42, 42);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x17181b,
      roughness: 0.58,
      metalness: 0.15,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.y = -0.04;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    const plinthGeo = new THREE.CylinderGeometry(3.35, 3.45, 0.06, 64);
    const plinthMat = new THREE.MeshStandardMaterial({
      color: 0x222429,
      roughness: 0.38,
      metalness: 0.25,
    });
    const plinth = new THREE.Mesh(plinthGeo, plinthMat);
    plinth.position.y = -0.03;
    plinth.receiveShadow = true;
    scene.add(plinth);

    const ringGeo = new THREE.RingGeometry(3.33, 3.36, 72);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xb45309,
      roughness: 0.3,
      metalness: 0.85,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.002;
    scene.add(ring);

    // Materials for Vehicle
    const paintMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(selectedColor.hex),
      metalness: selectedColor.metalness,
      roughness: selectedColor.roughness,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
    });
    paintMaterialRef.current = paintMat;

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x101318,
      metalness: 0.1,
      roughness: 0.08,
      transmission: isSoftwareGl ? 0 : 0.45,
      transparent: true,
      opacity: isSoftwareGl ? 0.88 : 0.96,
      ior: 1.52,
      clearcoat: 1.0,
    });

    const trimMat = new THREE.MeshStandardMaterial({
      color: 0x1c1d21,
      roughness: 0.72,
      metalness: 0.1,
    });

    const carbonMat = new THREE.MeshStandardMaterial({
      color: 0x151618,
      roughness: 0.36,
      metalness: 0.32,
    });

    const tireMat = new THREE.MeshStandardMaterial({
      color: 0x141416,
      roughness: 0.86,
      metalness: 0.05,
    });

    const alloyMat = new THREE.MeshStandardMaterial({
      color: 0xcbd2d9,
      roughness: 0.18,
      metalness: 0.92,
    });

    const caliperMat = new THREE.MeshStandardMaterial({
      color: 0xb45309,
      roughness: 0.25,
      metalness: 0.75,
    });

    const headlightMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      emissive: new THREE.Color(0xf8fafc),
      emissiveIntensity: headlightsRef.current ? 2.4 : 0.05,
      roughness: 0.1,
    });
    headlightMatRef.current = headlightMat;

    const taillightMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      emissive: new THREE.Color(0xef4444),
      emissiveIntensity: headlightsRef.current ? 2.0 : 0.1,
      roughness: 0.15,
    });
    taillightMatRef.current = taillightMat;

    const carContainer = new THREE.Group();
    carContainerRef.current = carContainer;
    const carGroup = buildCarSilhouette(
      bodyStyleRef.current,
      paintMat,
      glassMat,
      trimMat,
      carbonMat,
      tireMat,
      alloyMat,
      caliperMat,
      headlightMat,
      taillightMat
    );
    carContainer.add(carGroup);
    scene.add(carContainer);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 3.2;
    controls.maxDistance = 9.5;
    controls.minPolarAngle = 0.2;
    controls.maxPolarAngle = Math.PI / 2 - 0.04;
    controls.enablePan = false;
    controls.target.set(0, 0.65, 0);

    controls.addEventListener('start', () => {
      presetRef.current = null;
    });

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    let frameId = 0;
    let disposed = false;
    let renderBusy = false;
    let renderDirty = false;
    const clock = new THREE.Clock();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function stepFrame() {
      const delta = Math.min(clock.getDelta(), 0.05);
      let keepAnimating = false;

      if (autoRotateRef.current && !isSoftwareGl) {
        carContainer.rotation.y += delta * 0.22;
        keepAnimating = true;
      }

      if (presetRef.current) {
        _desiredPos.set(...presetRef.current.position);
        _desiredTarget.set(...presetRef.current.target);
        const lambda = isSoftwareGl ? 18 : 6.5;
        camera.position.x = THREE.MathUtils.damp(camera.position.x, _desiredPos.x, lambda, delta);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, _desiredPos.y, lambda, delta);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, _desiredPos.z, lambda, delta);
        controls.target.x = THREE.MathUtils.damp(controls.target.x, _desiredTarget.x, lambda, delta);
        controls.target.y = THREE.MathUtils.damp(controls.target.y, _desiredTarget.y, lambda, delta);
        controls.target.z = THREE.MathUtils.damp(controls.target.z, _desiredTarget.z, lambda, delta);

        if (camera.position.distanceTo(_desiredPos) < 0.03) {
          camera.position.copy(_desiredPos);
          controls.target.copy(_desiredTarget);
          presetRef.current = null;
        } else {
          keepAnimating = true;
        }
      }

      controls.update();
      return keepAnimating;
    }

    function requestRender() {
      if (disposed) return;
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = requestAnimationFrame(() => {
        if (disposed) return;
        renderDirty = false;
        const keepGoing = stepFrame();
        renderer.render(scene, camera);
        const done = () => {
          renderBusy = false;
          if (!disposed && (renderDirty || keepGoing)) {
            requestRender();
          }
        };
        if (isSoftwareGl) {
          afterDraw(done);
        } else {
          done();
        }
      });
    }

    requestRenderRef.current = requestRender;
    controls.addEventListener('change', requestRender);

    const handleResize = () => {
      if (!container || disposed) return;
      const w = container.clientWidth || 900;
      const h = container.clientHeight || 520;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      requestRender();
    };
    window.addEventListener('resize', handleResize);

    requestRender();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      controls.removeEventListener('change', requestRender);
      controls.dispose();
      envTex.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m) => {
            if ('map' in m && m.map instanceof THREE.Texture) {
              m.map.dispose();
            }
            m.dispose();
          });
        }
      });
      renderer.dispose();
    };
    // Rebuild stage only on vehicle bodyStyle change
  }, [vehicle.id, vehicle.bodyStyle]);

  // Update paint color dynamically without resetting WebGL scene
  useEffect(() => {
    if (paintMaterialRef.current) {
      paintMaterialRef.current.color.set(selectedColor.hex);
      paintMaterialRef.current.metalness = selectedColor.metalness;
      paintMaterialRef.current.roughness = selectedColor.roughness;
      requestRenderRef.current();
    }
  }, [selectedColor]);

  // Update headlights emissive state
  useEffect(() => {
    if (headlightMatRef.current) {
      headlightMatRef.current.emissiveIntensity = headlightsOn ? 2.4 : 0.05;
    }
    if (taillightMatRef.current) {
      taillightMatRef.current.emissiveIntensity = headlightsOn ? 2.0 : 0.1;
    }
    requestRenderRef.current();
  }, [headlightsOn]);

  // Trigger render loop when autoRotate toggles on
  useEffect(() => {
    requestRenderRef.current();
  }, [autoRotate]);

  const handleSelectPreset = (preset: CameraPreset) => {
    setActivePreset(preset.id);
    presetRef.current = preset;
    requestRenderRef.current();
  };

  return (
    <div className="relative w-full h-[460px] md:h-[540px] bg-[#141517] overflow-hidden select-none">
      {/* Isolated WebGL canvas mount */}
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        aria-label={`Interactive 3D showroom view of ${vehicle.name}`}
      />

      {/* Minimal Top-Left Vehicle Title */}
      <div className="pointer-events-none absolute top-5 left-5 flex flex-col gap-0.5">
        <span className="text-xs tracking-wide text-[#A1A1AA]">
          Interactive 3D Stage · Drag to Orbit · Scroll to Zoom
        </span>
        <span className="font-display text-lg font-semibold text-white">
          {vehicle.name} — {selectedColor.name}
        </span>
      </div>

      {/* Collapsible Bottom Control Dock (no backdrop-blur over WebGL) */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 max-w-[94vw] flex flex-col items-center">
        <button
          type="button"
          onClick={() => setDockCollapsed((prev) => !prev)}
          className="mb-2 inline-flex items-center gap-1.5 rounded-t-lg bg-[#1E2024] border border-white/10 px-3 py-1 text-xs font-medium text-[#E4E4E7] hover:text-white transition-colors whitespace-nowrap shrink-0"
        >
          {dockCollapsed ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" />
              Show Controls
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              Hide Controls
            </>
          )}
        </button>

        {!dockCollapsed && (
          <div className="flex flex-wrap items-center justify-center gap-3 rounded-xl bg-[#1C1E22]/95 border border-white/12 px-4 py-2.5 shadow-xl">
            {/* Camera Presets */}
            <div className="flex items-center gap-1 pr-3 border-r border-white/10">
              {CAMERA_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    activePreset === preset.id
                      ? 'bg-[#B45309] text-white'
                      : 'text-[#D4D4D8] hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Paint Swatches */}
            <div className="flex items-center gap-2 pr-3 border-r border-white/10">
              <span className="text-xs text-[#A1A1AA] hidden sm:inline">Finish</span>
              {vehicle.exteriorColors.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => onSelectColor(color)}
                  title={color.name}
                  aria-label={`Select ${color.name} paint`}
                  className={`h-6 w-6 rounded-full border-2 transition-transform ${
                    selectedColor.id === color.id
                      ? 'border-white scale-110'
                      : 'border-white/25 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.hex }}
                />
              ))}
            </div>

            {/* Toggles */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setHeadlightsOn((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  headlightsOn
                    ? 'bg-white text-[#141517]'
                    : 'bg-white/10 text-[#D4D4D8] hover:text-white'
                }`}
              >
                <Lightbulb className="h-3.5 w-3.5" />
                Optics
              </button>
              <button
                type="button"
                onClick={() => setAutoRotate((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  autoRotate
                    ? 'bg-white/15 text-white border border-white/25'
                    : 'bg-white/5 text-[#A1A1AA] hover:text-white'
                }`}
              >
                <RotateCw className="h-3.5 w-3.5" />
                Spin
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
