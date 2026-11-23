'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { WardrobeItemRecord, AvatarRecord, FitTransform } from '@/types/database';
import { RotateCw, RefreshCcw, Eye, Compass, ZoomIn, ZoomOut } from 'lucide-react';

interface Avatar3DStageProps {
  avatar: AvatarRecord | null;
  equippedItems: WardrobeItemRecord[];
  onSelectGarment?: (item: WardrobeItemRecord) => void;
  selectedItemId?: string | null;
}

export function Avatar3DStage({
  avatar,
  equippedItems,
  onSelectGarment,
  selectedItemId,
}: Avatar3DStageProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);

  // References for animation loop and interaction
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const characterGroupRef = useRef<THREE.Group | null>(null);
  const pedestalGroupRef = useRef<THREE.Group | null>(null);
  const garmentMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());

  const isDraggingRef = useRef<boolean>(false);
  const previousMousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const rotationVelocityRef = useRef<number>(0);
  const autoRotateRef = useRef<boolean>(autoRotate);
  autoRotateRef.current = autoRotate;

  // Initialize Three.js Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x09090b, 0.04);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 1.1, 3.8);
    cameraRef.current = camera;

    // 3. Renderer with antialiasing and alpha
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // 4. Lighting (Iron Man / Studio Hall of Armor Lighting)
    // Overhead Spotlight
    const spotLight = new THREE.SpotLight(0xfff0dd, 3.5);
    spotLight.position.set(0, 4.5, 0.8);
    spotLight.angle = Math.PI / 4.5;
    spotLight.penumbra = 0.8;
    spotLight.castShadow = true;
    scene.add(spotLight);

    // Cyan / Amber Rim Lights
    const rimLightLeft = new THREE.DirectionalLight(0x38bdf8, 1.8);
    rimLightLeft.position.set(-3, 2, -2);
    scene.add(rimLightLeft);

    const rimLightRight = new THREE.DirectionalLight(0xf59e0b, 2.0);
    rimLightRight.position.set(3, 2, -1);
    scene.add(rimLightRight);

    // Ambient Light
    const ambientLight = new THREE.AmbientLight(0x27272a, 1.2);
    scene.add(ambientLight);

    // 5. High-Tech Circular Pedestal (Iron Man Hall of Armor / Free Fire Stage)
    const pedestalGroup = new THREE.Group();
    pedestalGroupRef.current = pedestalGroup;
    scene.add(pedestalGroup);

    // Main base platform
    const baseGeo = new THREE.CylinderGeometry(1.2, 1.3, 0.12, 48);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      metalness: 0.85,
      roughness: 0.25,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -0.06;
    baseMesh.receiveShadow = true;
    pedestalGroup.add(baseMesh);

    // Inner glowing glass ring
    const ringGeo = new THREE.RingGeometry(0.85, 1.05, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 0.002;
    pedestalGroup.add(ringMesh);

    // Center circular light core
    const coreGeo = new THREE.CircleGeometry(0.45, 32);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffedd5,
      transparent: true,
      opacity: 0.65,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.rotation.x = -Math.PI / 2;
    coreMesh.position.y = 0.003;
    pedestalGroup.add(coreMesh);

    // Outer segmented tactical ticks
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const tickGeo = new THREE.BoxGeometry(0.04, 0.01, 0.12);
      const tickMat = new THREE.MeshBasicMaterial({ color: 0x71717a });
      const tick = new THREE.Mesh(tickGeo, tickMat);
      tick.position.set(Math.cos(angle) * 1.12, 0.004, Math.sin(angle) * 1.12);
      tick.rotation.y = -angle;
      pedestalGroup.add(tick);
    }

    // 6. 3D Character Group
    const characterGroup = new THREE.Group();
    characterGroupRef.current = characterGroup;
    scene.add(characterGroup);

    // Procedural 3D Stylized Mannequin Mesh
    const mannequinMaterial = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      metalness: 0.6,
      roughness: 0.35,
    });

    const jointMaterial = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0xd97706,
      emissiveIntensity: 0.15,
    });

    // Head
    const headGeo = new THREE.SphereGeometry(0.13, 24, 24);
    headGeo.scale(1, 1.25, 1.1);
    const head = new THREE.Mesh(headGeo, mannequinMaterial);
    head.position.y = 1.95;
    characterGroup.add(head);

    // Visor glow
    const visorGeo = new THREE.BoxGeometry(0.14, 0.04, 0.08);
    const visorMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 1.97, 0.11);
    characterGroup.add(visor);

    // Neck
    const neckGeo = new THREE.CylinderGeometry(0.05, 0.06, 0.1, 16);
    const neck = new THREE.Mesh(neckGeo, jointMaterial);
    neck.position.y = 1.78;
    characterGroup.add(neck);

    // Upper Torso / Chest
    const chestGeo = new THREE.CylinderGeometry(0.24, 0.18, 0.38, 20);
    const chest = new THREE.Mesh(chestGeo, mannequinMaterial);
    chest.position.y = 1.54;
    characterGroup.add(chest);

    // Arc Core on chest (Iron Man reactor nod)
    const arcGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.02, 16);
    const arcMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const arc = new THREE.Mesh(arcGeo, arcMat);
    arc.rotation.x = Math.PI / 2;
    arc.position.set(0, 1.58, 0.19);
    characterGroup.add(arc);

    // Abdomen & Waist
    const waistGeo = new THREE.CylinderGeometry(0.17, 0.19, 0.24, 20);
    const waist = new THREE.Mesh(waistGeo, mannequinMaterial);
    waist.position.y = 1.25;
    characterGroup.add(waist);

    // Pelvis
    const pelvisGeo = new THREE.CylinderGeometry(0.2, 0.16, 0.16, 20);
    const pelvis = new THREE.Mesh(pelvisGeo, mannequinMaterial);
    pelvis.position.y = 1.05;
    characterGroup.add(pelvis);

    // Shoulders
    const shoulderGeo = new THREE.SphereGeometry(0.07, 16, 16);
    const leftShoulder = new THREE.Mesh(shoulderGeo, jointMaterial);
    leftShoulder.position.set(-0.28, 1.66, 0);
    characterGroup.add(leftShoulder);

    const rightShoulder = new THREE.Mesh(shoulderGeo, jointMaterial);
    rightShoulder.position.set(0.28, 1.66, 0);
    characterGroup.add(rightShoulder);

    // Arms & Forearms
    const armGeo = new THREE.CylinderGeometry(0.055, 0.05, 0.32, 16);
    const leftArm = new THREE.Mesh(armGeo, mannequinMaterial);
    leftArm.position.set(-0.31, 1.45, 0);
    leftArm.rotation.z = -0.15;
    characterGroup.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, mannequinMaterial);
    rightArm.position.set(0.31, 1.45, 0);
    rightArm.rotation.z = 0.15;
    characterGroup.add(rightArm);

    const forearmGeo = new THREE.CylinderGeometry(0.05, 0.04, 0.3, 16);
    const leftForearm = new THREE.Mesh(forearmGeo, mannequinMaterial);
    leftForearm.position.set(-0.36, 1.15, 0.02);
    leftForearm.rotation.z = -0.12;
    characterGroup.add(leftForearm);

    const rightForearm = new THREE.Mesh(forearmGeo, mannequinMaterial);
    rightForearm.position.set(0.36, 1.15, 0.02);
    rightForearm.rotation.z = 0.12;
    characterGroup.add(rightForearm);

    // Thighs
    const thighGeo = new THREE.CylinderGeometry(0.085, 0.065, 0.44, 16);
    const leftThigh = new THREE.Mesh(thighGeo, mannequinMaterial);
    leftThigh.position.set(-0.13, 0.76, 0);
    characterGroup.add(leftThigh);

    const rightThigh = new THREE.Mesh(thighGeo, mannequinMaterial);
    rightThigh.position.set(0.13, 0.76, 0);
    characterGroup.add(rightThigh);

    // Knees
    const kneeGeo = new THREE.SphereGeometry(0.06, 16, 16);
    const leftKnee = new THREE.Mesh(kneeGeo, jointMaterial);
    leftKnee.position.set(-0.13, 0.52, 0);
    characterGroup.add(leftKnee);

    const rightKnee = new THREE.Mesh(kneeGeo, jointMaterial);
    rightKnee.position.set(0.13, 0.52, 0);
    characterGroup.add(rightKnee);

    // Shins & Boots
    const shinGeo = new THREE.CylinderGeometry(0.065, 0.055, 0.42, 16);
    const leftShin = new THREE.Mesh(shinGeo, mannequinMaterial);
    leftShin.position.set(-0.13, 0.28, 0);
    characterGroup.add(leftShin);

    const rightShin = new THREE.Mesh(shinGeo, mannequinMaterial);
    rightShin.position.set(0.13, 0.28, 0);
    characterGroup.add(rightShin);

    const bootGeo = new THREE.BoxGeometry(0.1, 0.08, 0.2);
    const leftBoot = new THREE.Mesh(bootGeo, jointMaterial);
    leftBoot.position.set(-0.13, 0.04, 0.04);
    characterGroup.add(leftBoot);

    const rightBoot = new THREE.Mesh(bootGeo, jointMaterial);
    rightBoot.position.set(0.13, 0.04, 0.04);
    characterGroup.add(rightBoot);

    // Animation Loop with Smooth Inertia
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (characterGroupRef.current) {
        // Auto-rotation when not dragging
        if (!isDraggingRef.current && autoRotateRef.current) {
          characterGroupRef.current.rotation.y += 0.0075;
          if (pedestalGroupRef.current) {
            pedestalGroupRef.current.rotation.y += 0.0025;
          }
        } else if (!isDraggingRef.current && Math.abs(rotationVelocityRef.current) > 0.0001) {
          // Inertia damping
          characterGroupRef.current.rotation.y += rotationVelocityRef.current;
          rotationVelocityRef.current *= 0.94;
        }

        setRotationAngle(Math.round(((characterGroupRef.current.rotation.y % (Math.PI * 2)) * 180) / Math.PI));
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update camera zoom
  useEffect(() => {
    if (!cameraRef.current) return;
    cameraRef.current.position.z = 3.8 / zoomLevel;
  }, [zoomLevel]);

  // Load and attach layered garments onto the 3D character
  useEffect(() => {
    const characterGroup = characterGroupRef.current;
    if (!characterGroup) return;

    // Clear previous garment planes
    garmentMeshesRef.current.forEach((mesh) => {
      characterGroup.remove(mesh);
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => m.dispose());
      } else {
        mesh.material.dispose();
      }
    });
    garmentMeshesRef.current.clear();

    const textureLoader = new THREE.TextureLoader();

    equippedItems.forEach((item) => {
      textureLoader.load(item.image_url, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;

        // Determine 3D anchor position and dimensions based on category
        let yPos = 1.45;
        let zPos = 0.22;
        let width = 0.8;
        let height = 0.8;

        switch (item.category) {
          case 'accessory':
            yPos = 1.95;
            zPos = 0.18;
            width = 0.45;
            height = 0.45;
            break;
          case 'outerwear':
            yPos = 1.48;
            zPos = 0.25;
            width = 0.95;
            height = 0.95;
            break;
          case 'shirt':
          case 'tshirt':
            yPos = 1.45;
            zPos = 0.22;
            width = 0.82;
            height = 0.82;
            break;
          case 'bottom':
            yPos = 0.72;
            zPos = 0.19;
            width = 0.78;
            height = 0.85;
            break;
          case 'footwear':
            yPos = 0.16;
            zPos = 0.16;
            width = 0.55;
            height = 0.4;
            break;
        }

        // Apply custom fit transform scale/offsets
        const t = item.fit_transform;
        if (t) {
          width *= t.scale * t.scaleX;
          height *= t.scale * t.scaleY;
          yPos += (t.y / 100) * 0.5;
        }

        const planeGeo = new THREE.PlaneGeometry(width, height);
        const planeMat = new THREE.MeshStandardMaterial({
          map: texture,
          transparent: true,
          roughness: 0.4,
          metalness: 0.1,
          side: THREE.DoubleSide,
          alphaTest: 0.05,
        });

        const garmentMesh = new THREE.Mesh(planeGeo, planeMat);
        garmentMesh.position.set((t?.x ? (t.x / 100) * 0.5 : 0), yPos, zPos);

        // Also duplicate to rear side for true 360-degree viewing
        const rearMesh = garmentMesh.clone();
        rearMesh.position.z = -zPos;
        rearMesh.rotation.y = Math.PI;

        const garmentSubgroup = new THREE.Group();
        garmentSubgroup.add(garmentMesh);
        garmentSubgroup.add(rearMesh);

        characterGroup.add(garmentSubgroup);
        garmentMeshesRef.current.set(item.id, garmentMesh);
      });
    });
  }, [equippedItems]);

  // Mouse & Touch Drag Handlers for 360-degree rotation
  const handlePointerDown = (clientX: number, clientY: number) => {
    isDraggingRef.current = true;
    previousMousePositionRef.current = { x: clientX, y: clientY };
    rotationVelocityRef.current = 0;
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isDraggingRef.current || !characterGroupRef.current) return;

    const deltaX = clientX - previousMousePositionRef.current.x;
    const rotSpeed = 0.007;

    characterGroupRef.current.rotation.y += deltaX * rotSpeed;
    if (pedestalGroupRef.current) {
      pedestalGroupRef.current.rotation.y += deltaX * rotSpeed * 0.4;
    }

    rotationVelocityRef.current = deltaX * rotSpeed;
    previousMousePositionRef.current = { x: clientX, y: clientY };
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  // Preset Angle Snapping
  const snapToAngle = (radians: number) => {
    if (!characterGroupRef.current) return;
    characterGroupRef.current.rotation.y = radians;
    rotationVelocityRef.current = 0;
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* Three.js Canvas Container */}
      <div
        ref={mountRef}
        onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
        onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={(e) => handlePointerDown(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={(e) => handlePointerMove(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={handlePointerUp}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Top 3D Control HUD */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/10 text-[10px] font-mono text-zinc-300">
          <Compass className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '8s' }} />
          <span>3D ROTATABLE // {((rotationAngle % 360 + 360) % 360)}°</span>
        </div>

        {/* Quick Angle Presets & Controls */}
        <div className="flex items-center gap-1 pointer-events-auto bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/10">
          <button
            onClick={() => snapToAngle(0)}
            title="Front View"
            className="px-2 py-0.5 rounded text-[10px] font-mono text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            0°
          </button>
          <button
            onClick={() => snapToAngle(Math.PI / 2)}
            title="Profile Right"
            className="px-2 py-0.5 rounded text-[10px] font-mono text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            90°
          </button>
          <button
            onClick={() => snapToAngle(Math.PI)}
            title="Back View"
            className="px-2 py-0.5 rounded text-[10px] font-mono text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            180°
          </button>
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            title={autoRotate ? 'Pause Auto-Spin' : 'Start Auto-Spin'}
            className={`p-1 rounded transition-colors ${
              autoRotate ? 'text-amber-400 bg-amber-500/20' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <RotateCw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Drag Hint Overlay */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 pointer-events-none text-center">
        <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 bg-black/40 px-3 py-1 rounded-full border border-white/5 backdrop-blur-sm">
          &larr; Drag horizontally to rotate 360° &rarr;
        </span>
      </div>
    </div>
  );
}
