import { Canvas } from '@react-three/fiber';
import { Float, Environment } from '@react-three/drei';
import { Suspense, useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

const BlobGeometry = () => {
  return (
    <Float speed={1.5} rotationIntensity={1.2} floatIntensity={1.5}>
      <mesh>
        <torusKnotGeometry args={[1, 0.4, 128, 16]} />
        <meshStandardMaterial color="#12B7A5" roughness={0.1} metalness={0.2} />
      </mesh>
    </Float>
  );
};

const Fallback = () => (
  <div className="w-full h-full bg-gradient-to-tr from-accent to-blue-500 rounded-full blur-3xl opacity-30" />
);

export const HeroCanvas = () => {
  const prefersReducedMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (prefersReducedMotion || isMobile) {
    return <Fallback />;
  }

  return (
    <div className="w-full h-full absolute inset-0 z-0">
      <Suspense fallback={<Fallback />}>
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 10]} intensity={1.5} />
          <Environment preset="city" />
          <BlobGeometry />
        </Canvas>
      </Suspense>
    </div>
  );
};

export default HeroCanvas;
