
import { useRef, useEffect } from 'react';
import { AudioContextState } from './useAudioContext';
import { sharedFrameController } from './useAudioVisualizer';
import * as THREE from 'three';

export interface ParticleVisualizerOptions {
  particleCount?: number;
  particleSize?: number;
  baseColor?: string;
  colorVariation?: number;
  sensitivity?: number;
  rotationSpeed?: number;
  targetFPS?: number;
}

export function useParticleVisualizer(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  audioContext: AudioContextState,
  isPlaying: boolean,
  options: ParticleVisualizerOptions = {}
) {
  const dataArray = useRef<Uint8Array | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const particleGeometryRef = useRef<THREE.BufferGeometry | null>(null);
  const canvasDimensions = useRef({ width: 0, height: 0 });
  const animationFrameId = useRef<number | null>(null);
  const lastDrawTime = useRef(0);
  const frequencyBandsRef = useRef<number[]>([]);

  // Default options
  const {
    particleCount = 1000,
    particleSize = 2.0,
    baseColor = '#9b87f5',
    colorVariation = 0.5,
    sensitivity = 1.0,
    rotationSpeed = 0.001,
    targetFPS = 30,
  } = options;

  // Initialize the frequency data array
  useEffect(() => {
    if (!audioContext.analyserNode) return;
    
    const analyser = audioContext.analyserNode;
    analyser.fftSize = 1024;
    
    dataArray.current = new Uint8Array(analyser.frequencyBinCount);
    
    // Initialize frequency bands
    frequencyBandsRef.current = Array(4).fill(0);
    
    return () => {
      sharedFrameController.unregister(draw);
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      if (particleGeometryRef.current) {
        particleGeometryRef.current.dispose();
      }
    };
  }, [audioContext.analyserNode]);

  // Setup Three.js scene
  const setupThreeScene = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    
    // Create scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    // Create camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 30;
    cameraRef.current = camera;
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true
    });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    rendererRef.current = renderer;
    
    // Create particles
    createParticles();
  };

  // Create particle system
  const createParticles = () => {
    if (!sceneRef.current) return;
    
    // Create geometry
    const geometry = new THREE.BufferGeometry();
    particleGeometryRef.current = geometry;
    
    // Create positions for particles (randomly distributed in a sphere)
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    // Parse base color
    const baseColorHex = baseColor.replace('#', '');
    const r = parseInt(baseColorHex.substr(0, 2), 16) / 255;
    const g = parseInt(baseColorHex.substr(2, 2), 16) / 255;
    const b = parseInt(baseColorHex.substr(4, 2), 16) / 255;
    
    for (let i = 0; i < particleCount; i++) {
      // Generate random spherical coordinates
      const radius = 5 + Math.random() * 15;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      // Convert to Cartesian coordinates
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);     // x
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta); // y
      positions[i * 3 + 2] = radius * Math.cos(phi);                   // z
      
      // Add slight color variation
      colors[i * 3] = r * (1 - colorVariation/2 + Math.random() * colorVariation);
      colors[i * 3 + 1] = g * (1 - colorVariation/2 + Math.random() * colorVariation);
      colors[i * 3 + 2] = b * (1 - colorVariation/2 + Math.random() * colorVariation);
      
      // Random sizes
      sizes[i] = particleSize * (0.5 + Math.random() * 0.5);
    }
    
    // Add attributes to geometry
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // Create material
    const material = new THREE.PointsMaterial({
      size: particleSize,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
    });
    
    // Create points system
    const particles = new THREE.Points(geometry, material);
    particlesRef.current = particles;
    
    // Add to scene
    sceneRef.current.add(particles);
  };

  // Update particle positions based on audio data
  const updateParticles = () => {
    if (!particlesRef.current || !dataArray.current || !particleGeometryRef.current) return;
    
    const positions = particleGeometryRef.current.attributes.position.array as Float32Array;
    const sizes = particleGeometryRef.current.attributes.size.array as Float32Array;
    
    // Get average frequency values for different bands
    const bands = frequencyBandsRef.current;
    const binCount = dataArray.current.length;
    
    // Bass (0-200Hz), Mids (200Hz-2kHz), High (2kHz-20kHz), Full spectrum
    const bandRanges = [
      [0, Math.floor(binCount * 0.05)],          // Bass
      [Math.floor(binCount * 0.05), Math.floor(binCount * 0.3)],  // Mids
      [Math.floor(binCount * 0.3), binCount],    // Highs
      [0, binCount]                               // Full spectrum
    ];
    
    // Calculate average values for each band
    for (let i = 0; i < bands.length; i++) {
      let sum = 0;
      const [start, end] = bandRanges[i];
      for (let j = start; j < end; j++) {
        sum += dataArray.current[j];
      }
      bands[i] = (sum / (end - start)) * sensitivity / 255;
    }
    
    // Update particle positions and sizes
    const bassIntensity = bands[0];
    const midIntensity = bands[1];
    const highIntensity = bands[2];
    const fullIntensity = bands[3];
    
    // Loop through all particles
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Get the particle's current position
      const x = positions[i3];
      const y = positions[i3 + 1];
      const z = positions[i3 + 2];
      
      // Calculate distance from origin
      const distance = Math.sqrt(x*x + y*y + z*z);
      
      // Normalize the position to get a direction vector
      const nx = x / distance;
      const ny = y / distance;
      const nz = z / distance;
      
      // Update the position based on audio intensity
      // High frequencies affect particles farther from center
      const positionFactor = 1 + (distance > 10 ? highIntensity : bassIntensity) * 0.5;
      
      positions[i3] = x * positionFactor;
      positions[i3 + 1] = y * positionFactor;
      positions[i3 + 2] = z * positionFactor;
      
      // Update particle size based on audio
      sizes[i] = particleSize * (0.5 + fullIntensity * 1.5);
    }
    
    // Mark attributes for update
    particleGeometryRef.current.attributes.position.needsUpdate = true;
    particleGeometryRef.current.attributes.size.needsUpdate = true;
    
    // Rotate the particle system
    particlesRef.current.rotation.y += rotationSpeed * (1 + bassIntensity);
    particlesRef.current.rotation.x += rotationSpeed * 0.5 * (1 + midIntensity);
  };

  // Draw the visualizer frame
  const draw = () => {
    if (!canvasRef.current || !audioContext.analyserNode || !dataArray.current) {
      return;
    }

    const now = performance.now();
    const frameInterval = 1000 / targetFPS;
    
    // Skip frame if not enough time has elapsed
    if (now - lastDrawTime.current < frameInterval) {
      return;
    }
    
    lastDrawTime.current = now;
    
    // Get current dimensions
    const canvas = canvasRef.current;
    const parent = canvas.parentElement;
    const width = parent ? parent.clientWidth : canvas.width;
    const height = parent ? parent.clientHeight : canvas.height;
    
    // Only setup or resize if necessary
    if (canvasDimensions.current.width !== width || 
        canvasDimensions.current.height !== height || 
        !sceneRef.current) {
      
      canvas.width = width;
      canvas.height = height;
      canvasDimensions.current = { width, height };
      
      // Initialize Three.js if not already done
      if (!sceneRef.current) {
        setupThreeScene();
      } else if (rendererRef.current && cameraRef.current) {
        // Just resize renderer and update camera
        rendererRef.current.setSize(width, height);
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
      }
    }
    
    // Get audio data
    audioContext.analyserNode.getByteFrequencyData(dataArray.current);
    
    // Update and render particles
    if (sceneRef.current && cameraRef.current && rendererRef.current) {
      updateParticles();
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  };

  // Start/stop animation based on playing state
  useEffect(() => {
    if (isPlaying && audioContext.isInitialized) {
      // Resume the audio context if it's suspended
      if (audioContext.audioContext?.state === 'suspended') {
        audioContext.audioContext.resume().catch(console.error);
      }
      
      sharedFrameController.register(draw);
    } else {
      sharedFrameController.unregister(draw);
    }
    
    return () => {
      sharedFrameController.unregister(draw);
    };
  }, [isPlaying, audioContext.isInitialized]);

  return { draw };
}
