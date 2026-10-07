import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { EchoState } from '../types';
import { EMOTION_METADATA, emotionEngine } from '../lib/emotionEngine';
import { useEchoEmotion } from '../lib/useEchoEmotion';
import { Sparkles, Heart, PartyPopper, Smile, Zap, RefreshCw, Battery, BatteryCharging } from 'lucide-react';

interface EchoRobot3DProps {
  state: EchoState;
  subAction?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  interactive?: boolean;
  className?: string;
  showBadge?: boolean;
  onClick?: () => void;
}

export const EchoRobot3D: React.FC<EchoRobot3DProps> = ({
  state = 'idle',
  subAction,
  size = 'md',
  interactive = true,
  className = '',
  showBadge = true,
  onClick,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<EchoState>(state);
  stateRef.current = state;

  const subActionRef = useRef<string | undefined>(subAction);
  subActionRef.current = subAction;

  const [showEmotePicker, setShowEmotePicker] = useState<boolean>(false);
  const { lowPowerMode, toggleLowPowerMode } = useEchoEmotion();

  const currentMeta = EMOTION_METADATA[state] || EMOTION_METADATA.idle;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isLowPower = lowPowerMode.enabled;
    const targetFPS = isLowPower ? 15 : 60;
    const frameInterval = 1000 / targetFPS;

    // Dimensions based on size prop
    const sizeMap = {
      sm: { width: 140, height: 140 },
      md: { width: 220, height: 220 },
      lg: { width: 300, height: 300 },
      xl: { width: 380, height: 380 },
    };
    const dimensions = sizeMap[size] || sizeMap.md;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, dimensions.width / dimensions.height, 0.1, 1000);
    camera.position.set(0, 0, 7.5);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !isLowPower });
    renderer.setSize(dimensions.width, dimensions.height);
    renderer.setPixelRatio(isLowPower ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isLowPower;

    // Clear previous children
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // Robot Parent Group
    const robotGroup = new THREE.Group();
    scene.add(robotGroup);

    // Materials
    const bodyMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf6f7fb, // Pristine pearlescent white ceramic
      metalness: 0.08,
      roughness: 0.12,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
    });

    const visorMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x0f172a, // Glossy deep obsidian visor
      metalness: 0.8,
      roughness: 0.08,
      transmission: 0.1,
    });

    const eyeMaterial = new THREE.MeshBasicMaterial({
      color: 0xd946ef, // Glowing vibrant magenta/violet eyes
    });

    const mintGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0xd946ef, // Glowing magenta/violet mouth and core
    });

    const accentMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b5cf6, // Vibrant purple accent
      metalness: 0.3,
      roughness: 0.2,
      emissive: 0x7c3aed,
      emissiveIntensity: 0.5,
    });

    // Eyelid Material for sleeping/blinking
    const eyelidMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x0f172a,
      roughness: 0.1,
      metalness: 0.8,
    });

    // --- 1. ROBOT HEAD ---
    const headGroup = new THREE.Group();

    // Head Base
    const headGeo = new THREE.SphereGeometry(1.2, 32, 32);
    headGeo.scale(1.15, 1.0, 1.0);
    const headMesh = new THREE.Mesh(headGeo, bodyMaterial);
    headGroup.add(headMesh);

    // Visor
    const visorGeo = new THREE.SphereGeometry(1.02, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.55);
    visorGeo.scale(1.0, 0.7, 0.6);
    visorGeo.rotateX(Math.PI * 0.1);
    const visorMesh = new THREE.Mesh(visorGeo, visorMaterial);
    visorMesh.position.set(0, 0.05, 0.45);
    headGroup.add(visorMesh);

    // Left Eye
    const eyeGeo = new THREE.CapsuleGeometry(0.18, 0.25, 16, 16);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMaterial);
    leftEye.position.set(-0.42, 0.1, 1.25);
    headGroup.add(leftEye);

    // Right Eye
    const rightEye = new THREE.Mesh(eyeGeo, eyeMaterial);
    rightEye.position.set(0.42, 0.1, 1.25);
    headGroup.add(rightEye);

    // Eyelids (Upper covers for blinking / sleeping)
    const eyelidGeo = new THREE.SphereGeometry(0.25, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const leftEyelid = new THREE.Mesh(eyelidGeo, eyelidMaterial);
    leftEyelid.position.set(-0.42, 0.22, 1.27);
    leftEyelid.scale.set(1.1, 0, 1.1); // Scaled y=0 when open
    headGroup.add(leftEyelid);

    const rightEyelid = new THREE.Mesh(eyelidGeo, eyelidMaterial);
    rightEyelid.position.set(0.42, 0.22, 1.27);
    rightEyelid.scale.set(1.1, 0, 1.1);
    headGroup.add(rightEyelid);

    // Mouth
    const mouthGeo = new THREE.CapsuleGeometry(0.04, 0.35, 8, 8);
    mouthGeo.rotateZ(Math.PI / 2);
    const mouthMesh = new THREE.Mesh(mouthGeo, mintGlowMaterial);
    mouthMesh.position.set(0, -0.3, 1.22);
    headGroup.add(mouthMesh);

    // Ear Pods
    const earGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.15, 24);
    earGeo.rotateZ(Math.PI / 2);

    const leftEar = new THREE.Mesh(earGeo, accentMaterial);
    leftEar.position.set(-1.38, 0, 0);
    headGroup.add(leftEar);

    const rightEar = new THREE.Mesh(earGeo, accentMaterial);
    rightEar.position.set(1.38, 0, 0);
    headGroup.add(rightEar);

    // Antenna
    const antennaPoleGeo = new THREE.CylinderGeometry(0.03, 0.05, 0.5, 16);
    const antennaPole = new THREE.Mesh(antennaPoleGeo, bodyMaterial);
    antennaPole.position.set(0, 1.2, 0);
    headGroup.add(antennaPole);

    const orbGeo = new THREE.SphereGeometry(0.15, 16, 16);
    const orbMesh = new THREE.Mesh(orbGeo, mintGlowMaterial);
    orbMesh.position.set(0, 1.5, 0);
    headGroup.add(orbMesh);

    headGroup.position.set(0, 0.6, 0);
    robotGroup.add(headGroup);

    // --- 2. ROBOT BODY ---
    const bodyGroup = new THREE.Group();

    const chestGeo = new THREE.SphereGeometry(1.0, 32, 32);
    chestGeo.scale(0.9, 1.05, 0.8);
    const chestMesh = new THREE.Mesh(chestGeo, bodyMaterial);
    bodyGroup.add(chestMesh);

    const coreGeo = new THREE.OctahedronGeometry(0.28, 0);
    const coreMesh = new THREE.Mesh(coreGeo, mintGlowMaterial);
    coreMesh.position.set(0, 0.2, 0.72);
    bodyGroup.add(coreMesh);

    const shoulderGeo = new THREE.SphereGeometry(0.35, 24, 24);

    const leftShoulder = new THREE.Mesh(shoulderGeo, accentMaterial);
    leftShoulder.position.set(-1.05, 0.3, 0);
    bodyGroup.add(leftShoulder);

    const rightShoulder = new THREE.Mesh(shoulderGeo, accentMaterial);
    rightShoulder.position.set(1.05, 0.3, 0);
    bodyGroup.add(rightShoulder);

    bodyGroup.position.set(0, -0.9, 0);
    robotGroup.add(bodyGroup);

    // --- 3. RINGS & PARTICLES ---
    const ringGeo = new THREE.TorusGeometry(1.7, 0.025, 16, isLowPower ? 32 : 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.55 });
    const haloRing = new THREE.Mesh(ringGeo, ringMat);
    haloRing.rotation.x = Math.PI / 2;
    haloRing.position.set(0, 0.3, 0);
    robotGroup.add(haloRing);

    const outerRingGeo = new THREE.TorusGeometry(2.1, 0.015, 16, isLowPower ? 32 : 64);
    const outerRingMat = new THREE.MeshBasicMaterial({ color: 0xc084fc, transparent: true, opacity: 0.35 });
    const outerHaloRing = new THREE.Mesh(outerRingGeo, outerRingMat);
    outerHaloRing.rotation.x = Math.PI / 2;
    outerHaloRing.position.set(0, -0.2, 0);
    if (!isLowPower) {
      robotGroup.add(outerHaloRing);
    }

    // Dynamic Ambient Particles (Reduced in low power mode)
    const particleCount = isLowPower ? 10 : 36;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 5.5;
      particlePositions[i + 1] = (Math.random() - 0.5) * 5.5;
      particlePositions[i + 2] = (Math.random() - 0.5) * 4.5;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      size: isLowPower ? 0.05 : 0.07,
      color: 0xd8b4fe,
      transparent: true,
      opacity: isLowPower ? 0.4 : 0.7,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    if (!isLowPower) {
      scene.add(particles);
    }

    // --- 4. LIGHTS ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const violetKeyLight = new THREE.DirectionalLight(0xa855f7, 1.8);
    violetKeyLight.position.set(3, 4, 5);
    scene.add(violetKeyLight);

    const magentaPointLight = new THREE.PointLight(0xd946ef, 2.5, 10);
    magentaPointLight.position.set(0, 1.5, 2);
    scene.add(magentaPointLight);

    const skyBlueRimLight = new THREE.PointLight(0x93c5fd, 1.4, 8);
    skyBlueRimLight.position.set(-3, -2, -2);
    scene.add(skyBlueRimLight);

    // Pointer Interaction
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let targetRotationY = 0;
    let targetRotationX = 0;
    let clickSpinBoost = 0;

    const handlePointerDown = (e: PointerEvent) => {
      if (!interactive) return;
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!interactive || !isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      targetRotationY += deltaX * 0.01;
      targetRotationX += deltaY * 0.005;
      targetRotationX = Math.max(-0.4, Math.min(0.4, targetRotationX));

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = () => {
      isDragging = false;
    };

    const handleContainerClick = () => {
      clickSpinBoost = Math.PI * 2;
      // Trigger random emote if clicked
      const emotes: EchoState[] = ['happy', 'excited', 'love', 'celebrating', 'curious'];
      const randomEmote = emotes[Math.floor(Math.random() * emotes.length)];
      emotionEngine.triggerEmote(randomEmote, 3000);

      if (onClick) onClick();
    };

    const domEl = renderer.domElement;
    domEl.style.cursor = interactive ? 'grab' : 'default';
    domEl.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    domEl.addEventListener('click', handleContainerClick);

    // --- ANIMATION LOOP WITH ULTRA-SMOOTH LERP TRANSITIONS ---
    let animationFrameId: number;
    let clock = new THREE.Clock();

    // Lerp Target Values
    const curEyeColor = new THREE.Color(0xd946ef);
    const targetEyeColor = new THREE.Color(0xd946ef);

    const curParticleColor = new THREE.Color(0xd8b4fe);
    const targetParticleColor = new THREE.Color(0xd8b4fe);

    const curLightColor = new THREE.Color(0xa855f7);
    const targetLightColor = new THREE.Color(0xa855f7);

    let curLightIntensity = 2.0;
    let targetLightIntensity = 2.0;

    let curLeftEyeScaleX = 1, targetLeftEyeScaleX = 1;
    let curLeftEyeScaleY = 1, targetLeftEyeScaleY = 1;
    let curRightEyeScaleX = 1, targetRightEyeScaleX = 1;
    let curRightEyeScaleY = 1, targetRightEyeScaleY = 1;

    let curLeftEyelidY = 0, targetLeftEyelidY = 0;
    let curRightEyelidY = 0, targetRightEyelidY = 0;

    let curLeftEyeRotZ = 0, targetLeftEyeRotZ = 0;
    let curRightEyeRotZ = 0, targetRightEyeRotZ = 0;

    let curMouthScaleX = 1, targetMouthScaleX = 1;
    let curMouthScaleY = 1, targetMouthScaleY = 1;

    let curHeadRotX = 0, targetHeadRotX = 0;
    let curHeadRotY = 0, targetHeadRotY = 0;
    let curHeadRotZ = 0, targetHeadRotZ = 0;

    let curHeadPosY = 0.6, targetHeadPosY = 0.6;
    let curRobotPosY = 0, targetRobotPosY = 0;

    let curOrbScale = 1, targetOrbScale = 1;
    let curHaloScale = 1, targetHaloScale = 1;

    let lastFrameTime = performance.now();
    let frameCount = 0;
    let fpsCheckTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const now = performance.now();
      const elapsedSinceLast = now - lastFrameTime;

      // Frame rate throttling in Low Power Mode
      if (isLowPower && elapsedSinceLast < frameInterval) {
        return;
      }
      lastFrameTime = now - (elapsedSinceLast % frameInterval);

      // Rolling FPS check for automatic performance throttling
      frameCount++;
      if (now - fpsCheckTime >= 3000) {
        const measuredFPS = (frameCount * 1000) / (now - fpsCheckTime);
        if (measuredFPS < 22 && !isLowPower) {
          console.warn(`Low rendering performance detected (${measuredFPS.toFixed(1)} FPS). Auto-enabling Low Power Mode.`);
          emotionEngine.setLowPowerMode(true, 'performance_throttle');
        }
        frameCount = 0;
        fpsCheckTime = now;
      }

      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsedTime = clock.getElapsedTime();
      const currentState = stateRef.current;
      const activeSubAction = subActionRef.current;

      // Smooth interpolation factor (frame-rate independent)
      const lerpSpeed = Math.min(1, delta * 10);
      const fastLerpSpeed = Math.min(1, delta * 16);

      // Default targets each frame
      targetLeftEyeScaleX = 1;
      targetLeftEyeScaleY = 1;
      targetRightEyeScaleX = 1;
      targetRightEyeScaleY = 1;
      targetLeftEyelidY = 0;
      targetRightEyelidY = 0;
      targetLeftEyeRotZ = 0;
      targetRightEyeRotZ = 0;
      targetMouthScaleX = 1;
      targetMouthScaleY = 1;
      targetHeadRotX = 0;
      targetHeadRotY = 0;
      targetHeadRotZ = 0;
      targetHeadPosY = 0.6;
      targetRobotPosY = 0;
      targetOrbScale = 1;
      targetHaloScale = 1;

      // 1. Idle Floating Bobbing
      const floatY = Math.sin(elapsedTime * 2.2) * 0.12;

      // 2. Smooth Rotations & Click Spin
      if (clickSpinBoost > 0) {
        const spinStep = Math.min(clickSpinBoost, delta * 12);
        robotGroup.rotation.y += spinStep;
        clickSpinBoost -= spinStep;
      } else {
        const targetRotY = targetRotationY + Math.sin(elapsedTime * 0.8) * 0.08;
        robotGroup.rotation.y += (targetRotY - robotGroup.rotation.y) * lerpSpeed;
        robotGroup.rotation.x += (targetRotationX - robotGroup.rotation.x) * lerpSpeed;
      }

      particles.rotation.y = elapsedTime * 0.08;

      // SubAction overlays
      if (activeSubAction === 'blink') {
        targetLeftEyelidY = 1.2;
        targetRightEyelidY = 1.2;
      } else if (activeSubAction === 'head_tilt') {
        targetHeadRotZ = 0.25;
      } else if (activeSubAction === 'look_left') {
        targetHeadRotY = -0.3;
      } else if (activeSubAction === 'look_right') {
        targetHeadRotY = 0.3;
      } else if (activeSubAction === 'smile') {
        targetMouthScaleX = 1.6;
      } else if (activeSubAction === 'wave') {
        rightShoulder.position.y = 0.5 + Math.sin(elapsedTime * 10) * 0.15;
      } else if (activeSubAction === 'stretch') {
        targetRobotPosY = 0.25 + Math.sin(elapsedTime * 4) * 0.1;
      }

      // 3. FULL EMOTION BEHAVIORS (SET TARGETS)
      switch (currentState) {
        case 'happy':
          targetEyeColor.setHex(0x10b981);
          targetLeftEyeScaleX = 1.2; targetLeftEyeScaleY = 0.5;
          targetRightEyeScaleX = 1.2; targetRightEyeScaleY = 0.5;
          targetMouthScaleX = 1.8; targetMouthScaleY = 1.2;
          targetHeadPosY = 0.6 + Math.abs(Math.sin(elapsedTime * 8)) * 0.12;
          targetParticleColor.setHex(0x10b981);
          targetLightColor.setHex(0x10b981);
          targetLightIntensity = 3.5;
          break;

        case 'excited':
          targetEyeColor.setHex(0xa855f7);
          targetLeftEyeScaleX = 1.4; targetLeftEyeScaleY = 1.4;
          targetRightEyeScaleX = 1.4; targetRightEyeScaleY = 1.4;
          antennaPole.rotation.z = Math.sin(elapsedTime * 20) * 0.2;
          targetHeadPosY = 0.6 + Math.sin(elapsedTime * 12) * 0.2;
          targetHaloScale = 1 + Math.sin(elapsedTime * 15) * 0.25;
          targetParticleColor.setHex(0xc084fc);
          targetLightColor.setHex(0xa855f7);
          targetLightIntensity = 3.2;
          break;

        case 'curious':
          targetEyeColor.setHex(0xf59e0b);
          targetHeadRotZ = 0.22;
          targetRightEyeScaleX = 1.3; targetRightEyeScaleY = 1.3;
          antennaPole.position.y = 1.3;
          targetParticleColor.setHex(0xfcd34d);
          targetLightColor.setHex(0xf59e0b);
          targetLightIntensity = 2.5;
          break;

        case 'thinking':
          targetEyeColor.setHex(0x38bdf8);
          haloRing.rotation.z += delta * 2.5;
          outerHaloRing.rotation.z -= delta * 1.8;
          targetHeadRotZ = Math.sin(elapsedTime * 4) * 0.08;
          targetHeadRotX = -0.1 + Math.cos(elapsedTime * 2) * 0.05;
          targetOrbScale = 1 + Math.sin(elapsedTime * 12) * 0.3;
          targetParticleColor.setHex(0x38bdf8);
          targetLightColor.setHex(0x38bdf8);
          targetLightIntensity = 2.8;
          break;

        case 'listening':
          targetEyeColor.setHex(0x06b6d4);
          targetHaloScale = 1 + Math.sin(elapsedTime * 8) * 0.18;
          haloRing.rotation.z += delta * 1.2;
          targetHeadRotX = 0.15;
          targetLightIntensity = 3.5 + Math.sin(elapsedTime * 10) * 1.5;
          targetParticleColor.setHex(0x22d3ee);
          targetLightColor.setHex(0x22d3ee);
          break;

        case 'speaking':
          targetEyeColor.setHex(0x34d399);
          targetMouthScaleX = 1 + Math.sin(elapsedTime * 18) * 0.8;
          targetMouthScaleY = 1 + Math.cos(elapsedTime * 15) * 0.4;
          targetHeadPosY = 0.6 + Math.sin(elapsedTime * 6) * 0.05;
          targetParticleColor.setHex(0x34d399);
          targetLightColor.setHex(0x34d399);
          targetLightIntensity = 2.8;
          break;

        case 'confused':
          targetEyeColor.setHex(0xeab308);
          targetHeadRotZ = -0.25;
          targetLeftEyeScaleX = 1.3; targetLeftEyeScaleY = 0.8;
          targetRightEyeScaleX = 0.8; targetRightEyeScaleY = 1.3;
          targetParticleColor.setHex(0xfef08a);
          targetLightColor.setHex(0xeab308);
          break;

        case 'surprised':
          targetEyeColor.setHex(0xec4899);
          targetLeftEyeScaleX = 1.6; targetLeftEyeScaleY = 1.6;
          targetRightEyeScaleX = 1.6; targetRightEyeScaleY = 1.6;
          targetHeadPosY = 0.75;
          targetOrbScale = 1.6;
          targetParticleColor.setHex(0xf472b6);
          targetLightColor.setHex(0xec4899);
          targetLightIntensity = 3.5;
          break;

        case 'sad':
          targetEyeColor.setHex(0x64748b);
          targetHeadRotX = -0.2;
          targetRobotPosY = -0.2;
          targetLeftEyeRotZ = 0.2;
          targetRightEyeRotZ = -0.2;
          targetLeftEyelidY = 0.6;
          targetRightEyelidY = 0.6;
          targetParticleColor.setHex(0x94a3b8);
          targetLightColor.setHex(0x64748b);
          targetLightIntensity = 1.0;
          break;

        case 'worried':
          targetEyeColor.setHex(0xf97316);
          targetHeadRotZ = Math.sin(elapsedTime * 18) * 0.05;
          targetLeftEyeScaleX = 0.9; targetLeftEyeScaleY = 1.2;
          targetRightEyeScaleX = 0.9; targetRightEyeScaleY = 1.2;
          targetParticleColor.setHex(0xfdba74);
          targetLightColor.setHex(0xf97316);
          break;

        case 'angry':
          targetEyeColor.setHex(0xef4444);
          targetHeadRotZ = Math.sin(elapsedTime * 20) * 0.08;
          targetParticleColor.setHex(0xfca5a5);
          targetLightColor.setHex(0xef4444);
          targetLightIntensity = 3.2;
          break;

        case 'love':
          targetEyeColor.setHex(0x10b981);
          targetLeftEyeScaleX = 1.3; targetLeftEyeScaleY = 0.6;
          targetRightEyeScaleX = 1.3; targetRightEyeScaleY = 0.6;
          targetMouthScaleX = 1.8; targetMouthScaleY = 1.3;
          targetHeadPosY = 0.6 + Math.abs(Math.sin(elapsedTime * 6)) * 0.15;
          targetParticleColor.setHex(0xf43f5e);
          targetLightColor.setHex(0x10b981);
          targetLightIntensity = 3.2;
          break;

        case 'celebrating':
          targetEyeColor.setHex(0xf43f5e);
          targetHeadPosY = 0.6 + Math.abs(Math.sin(elapsedTime * 10)) * 0.25;
          targetHeadRotY = Math.sin(elapsedTime * 8) * 0.2;
          targetParticleColor.setHex(0xfde047);
          haloRing.rotation.z += delta * 3.0;
          targetLightColor.setHex(0xf43f5e);
          break;

        case 'sleeping':
          targetEyeColor.setHex(0x334155);
          targetLeftEyelidY = 1.3;
          targetRightEyelidY = 1.3;
          targetHeadRotX = -0.15;
          targetRobotPosY = Math.sin(elapsedTime * 0.8) * 0.05 - 0.1;
          targetLightIntensity = 0.6;
          targetParticleColor.setHex(0x64748b);
          targetLightColor.setHex(0x334155);
          break;

        case 'error':
          targetEyeColor.setHex(0xef4444);
          targetHeadRotZ = Math.sin(elapsedTime * 25) * 0.12;
          targetLightColor.setHex(0xef4444);
          targetParticleColor.setHex(0xf87171);
          targetLightIntensity = 3.5;
          break;

        case 'success':
          targetEyeColor.setHex(0x10b981);
          targetHeadPosY = 0.6 + Math.abs(Math.sin(elapsedTime * 6)) * 0.15;
          targetOrbScale = 1.5;
          targetParticleColor.setHex(0x34d399);
          targetLightColor.setHex(0x10b981);
          targetLightIntensity = 3.5;
          break;

        case 'offline':
          targetEyeColor.setHex(0x64748b);
          targetLightColor.setHex(0x475569);
          targetLightIntensity = 0.8;
          targetParticleColor.setHex(0x475569);
          break;

        case 'idle':
        default:
          targetEyeColor.setHex(0xd946ef);
          targetMouthScaleX = 1; targetMouthScaleY = 1;
          haloRing.rotation.z += delta * 0.3;
          outerHaloRing.rotation.z -= delta * 0.2;
          targetLightColor.setHex(0xa855f7);
          targetLightIntensity = 2.2;
          targetParticleColor.setHex(0xd8b4fe);
          if (!activeSubAction) {
            targetHeadRotZ = Math.sin(elapsedTime) * 0.02;
            targetHeadRotX = Math.cos(elapsedTime * 0.8) * 0.02;
          }
          break;
      }

      // 4. APPLY SMOOTH LERP INTERPOLATIONS
      curEyeColor.lerp(targetEyeColor, lerpSpeed);
      eyeMaterial.color.copy(curEyeColor);

      curParticleColor.lerp(targetParticleColor, lerpSpeed);
      particleMat.color.copy(curParticleColor);

      curLightColor.lerp(targetLightColor, lerpSpeed);
      magentaPointLight.color.copy(curLightColor);

      curLightIntensity += (targetLightIntensity - curLightIntensity) * lerpSpeed;
      magentaPointLight.intensity = curLightIntensity;

      // Scales
      curLeftEyeScaleX += (targetLeftEyeScaleX - curLeftEyeScaleX) * fastLerpSpeed;
      curLeftEyeScaleY += (targetLeftEyeScaleY - curLeftEyeScaleY) * fastLerpSpeed;
      leftEye.scale.set(curLeftEyeScaleX, curLeftEyeScaleY, 1);

      curRightEyeScaleX += (targetRightEyeScaleX - curRightEyeScaleX) * fastLerpSpeed;
      curRightEyeScaleY += (targetRightEyeScaleY - curRightEyeScaleY) * fastLerpSpeed;
      rightEye.scale.set(curRightEyeScaleX, curRightEyeScaleY, 1);

      curLeftEyelidY += (targetLeftEyelidY - curLeftEyelidY) * fastLerpSpeed;
      leftEyelid.scale.set(1.1, curLeftEyelidY, 1.1);

      curRightEyelidY += (targetRightEyelidY - curRightEyelidY) * fastLerpSpeed;
      rightEyelid.scale.set(1.1, curRightEyelidY, 1.1);

      curLeftEyeRotZ += (targetLeftEyeRotZ - curLeftEyeRotZ) * lerpSpeed;
      leftEye.rotation.z = curLeftEyeRotZ;

      curRightEyeRotZ += (targetRightEyeRotZ - curRightEyeRotZ) * lerpSpeed;
      rightEye.rotation.z = curRightEyeRotZ;

      curMouthScaleX += (targetMouthScaleX - curMouthScaleX) * fastLerpSpeed;
      curMouthScaleY += (targetMouthScaleY - curMouthScaleY) * fastLerpSpeed;
      mouthMesh.scale.set(curMouthScaleX, curMouthScaleY, 1);

      curHeadRotX += (targetHeadRotX - curHeadRotX) * lerpSpeed;
      curHeadRotY += (targetHeadRotY - curHeadRotY) * lerpSpeed;
      curHeadRotZ += (targetHeadRotZ - curHeadRotZ) * lerpSpeed;
      headGroup.rotation.set(curHeadRotX, curHeadRotY, curHeadRotZ);

      curHeadPosY += (targetHeadPosY - curHeadPosY) * lerpSpeed;
      headGroup.position.y = curHeadPosY;

      curRobotPosY += (targetRobotPosY - curRobotPosY) * lerpSpeed;
      robotGroup.position.y = floatY + curRobotPosY;

      curOrbScale += (targetOrbScale - curOrbScale) * fastLerpSpeed;
      orbMesh.scale.setScalar(curOrbScale);

      curHaloScale += (targetHaloScale - curHaloScale) * lerpSpeed;
      haloRing.scale.setScalar(curHaloScale);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      domEl.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      domEl.removeEventListener('click', handleContainerClick);
      if (container.contains(domEl)) {
        container.removeChild(domEl);
      }
      renderer.dispose();
    };
  }, [size, interactive, onClick, lowPowerMode.enabled]);

  return (
    <div className={`echo-robot-container relative flex flex-col items-center justify-center select-none ${className}`}>
      {/* LOW POWER MODE BADGE */}
      {lowPowerMode.enabled && showBadge && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleLowPowerMode();
          }}
          className="absolute -top-2 right-0 px-2.5 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-[10px] font-bold text-amber-300 flex items-center gap-1.5 transition-all shadow-lg backdrop-blur-md cursor-pointer active:scale-95 z-20"
          title={`Low Power Mode Active (${lowPowerMode.reason || 'manual'}). 15 FPS reduced frame rate. Click to restore 60 FPS.`}
        >
          <Zap className="w-3 h-3 text-amber-400 animate-pulse" />
          <span>Low Power (15 FPS)</span>
        </button>
      )}

      {/* 3D WEBGL CONTAINER */}
      <div
        ref={mountRef}
        className="echo-robot-container relative flex items-center justify-center cursor-grab active:cursor-grabbing"
        title="Echo 3D Mascot — Click or drag to interact!"
      />
    </div>
  );
};

