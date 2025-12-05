import {
  Environment,
  Float,
  Html,
  MeshTransmissionMaterial,
  OrbitControls,
  Text,
} from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Share2, Sparkles, TrendingUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

// Modern particle system with trails
const ContentParticle = ({
  startPlatform,
  endPlatform,
  speed = 1,
  color,
  delay = 0,
}) => {
  const particleRef = useRef();
  const trailRef = useRef();
  const [progress, setProgress] = useState(0);
  const [trail, setTrail] = useState([]);

  const platformPositions = {
    instagram: new THREE.Vector3(-4, 3, 0),
    facebook: new THREE.Vector3(4, 3, 0),
    twitter: new THREE.Vector3(0, 0, 4),
    tiktok: new THREE.Vector3(-4, -3, 0),
    youtube: new THREE.Vector3(4, -3, 0),
    linkedin: new THREE.Vector3(0, 0, -4),
  };

  const startPos =
    platformPositions[startPlatform] || new THREE.Vector3(0, 0, 0);
  const endPos = platformPositions[endPlatform] || new THREE.Vector3(0, 0, 0);

  useFrame((state) => {
    if (!particleRef.current) return;

    const t = (progress / 100) % 1;
    const easedT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    const controlPoint = new THREE.Vector3()
      .addVectors(startPos, endPos)
      .multiplyScalar(0.5)
      .add(new THREE.Vector3(0, Math.sin(t * Math.PI) * 4, 0));

    const position = new THREE.Vector3()
      .copy(startPos)
      .multiplyScalar(Math.pow(1 - easedT, 2))
      .add(
        new THREE.Vector3()
          .copy(controlPoint)
          .multiplyScalar(2 * (1 - easedT) * easedT)
      )
      .add(
        new THREE.Vector3().copy(endPos).multiplyScalar(Math.pow(easedT, 2))
      );

    particleRef.current.position.copy(position);

    // Glowing pulse effect
    const pulseScale = 1 + Math.sin(state.clock.elapsedTime * 5 + delay) * 0.3;
    particleRef.current.scale.set(pulseScale, pulseScale, pulseScale);

    setProgress((prev) => (prev + speed * 0.3) % 100);
  });

  useEffect(() => {
    const timer = setTimeout(() => setProgress(delay), delay * 10);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <Float speed={1} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={particleRef}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.5}
          metalness={0.9}
          roughness={0.1}
          transparent
          opacity={0.95}
        />
        <pointLight color={color} intensity={2} distance={3} />
      </mesh>
    </Float>
  );
};

// Modern glass-morphic platform node
const PlatformNode = ({
  platform,
  position,
  stats = { posts: 0, engagement: 0, reach: 0 },
  isActive = false,
}) => {
  const nodeRef = useRef();
  const [hovered, setHovered] = useState(false);

  const platformConfig = {
    instagram: {
      color: "#E4405F",
      gradient: ["#E4405F", "#F77737"],
      icon: "📸",
      name: "Instagram",
    },
    facebook: {
      color: "#1877F2",
      gradient: ["#1877F2", "#4267B2"],
      icon: "👥",
      name: "Facebook",
    },
    twitter: {
      color: "#1DA1F2",
      gradient: ["#1DA1F2", "#14A1F2"],
      icon: "💬",
      name: "Twitter",
    },
    tiktok: {
      color: "#FE2C55",
      gradient: ["#FE2C55", "#000000"],
      icon: "🎵",
      name: "TikTok",
    },
    youtube: {
      color: "#FF0000",
      gradient: ["#FF0000", "#CC0000"],
      icon: "▶️",
      name: "YouTube",
    },
    linkedin: {
      color: "#0A66C2",
      gradient: ["#0A66C2", "#004182"],
      icon: "💼",
      name: "LinkedIn",
    },
  };

  const config = platformConfig[platform] || {
    color: "#666666",
    gradient: ["#666666", "#444444"],
    icon: "📱",
    name: platform,
  };

  useFrame((state) => {
    if (nodeRef.current && isActive) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.15;
      nodeRef.current.scale.set(scale, scale, scale);
      nodeRef.current.rotation.y += 0.01;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.3}>
      <group position={position}>
        <mesh
          ref={nodeRef}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <sphereGeometry args={[1.2, 32, 32]} />
          <MeshTransmissionMaterial
            transmission={0.95}
            thickness={0.5}
            roughness={0.1}
            chromaticAberration={0.5}
            anisotropy={1}
            distortion={0.3}
            distortionScale={0.5}
            temporalDistortion={0.1}
            color={config.color}
            emissive={config.color}
            emissiveIntensity={isActive ? 0.3 : 0.1}
          />
        </mesh>

        {/* Outer glow rings */}
        {[1.5, 1.8, 2.1].map((radius, i) => (
          <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[radius, 0.03, 16, 100]} />
            <meshBasicMaterial
              color={config.color}
              transparent
              opacity={0.4 - i * 0.1}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}

        {/* Animated icon */}
        <Float speed={2} rotationIntensity={0} floatIntensity={0.5}>
          <Text
            position={[0, 0, 1.5]}
            fontSize={0.6}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            {config.icon}
          </Text>
        </Float>

        <Text
          position={[0, -2, 0]}
          fontSize={0.35}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff"
          fontWeight={600}
        >
          {config.name}
        </Text>

        {hovered && (
          <Html position={[0, 2.5, 0]} center distanceFactor={8}>
            <div className="bg-black/70 backdrop-blur-xl p-4 rounded-lg border border-white/20 shadow-2xl min-w-[200px] animate-in fade-in slide-in-from-bottom-3 duration-300">
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-3 h-3 rounded-full animate-pulse"
                  style={{ backgroundColor: config.color }}
                />
                <div className="text-white font-bold text-base">
                  {config.name}
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center group">
                  <span className="text-gray-300">Posts</span>
                  <span className="text-white font-semibold">
                    {stats.posts}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Engagement</span>
                  <span className="text-emerald-400 font-semibold">
                    {stats.engagement}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Reach</span>
                  <span className="text-blue-400 font-semibold">
                    {stats.reach.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </Html>
        )}

        {isActive && (
          <pointLight color={config.color} intensity={3} distance={8} />
        )}
      </group>
    </Float>
  );
};

// Modern animated core with glass material
const ContentFlowCore = () => {
  const coreRef = useRef();
  const outerRingRef = useRef();

  useFrame((state) => {
    if (coreRef.current) {
      coreRef.current.rotation.y = state.clock.elapsedTime * 0.3;
      coreRef.current.rotation.x =
        Math.sin(state.clock.elapsedTime * 0.2) * 0.15;
    }
    if (outerRingRef.current) {
      outerRingRef.current.rotation.y = -state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <group>
      <group ref={coreRef}>
        <mesh>
          <icosahedronGeometry args={[1.8, 1]} />
          <MeshTransmissionMaterial
            transmission={0.98}
            thickness={1}
            roughness={0}
            chromaticAberration={0.6}
            anisotropy={1}
            distortion={0.5}
            distortionScale={0.5}
            temporalDistortion={0.2}
            color="#8B5CF6"
            emissive="#8B5CF6"
            emissiveIntensity={0.5}
          />
        </mesh>
        <pointLight color="#8B5CF6" intensity={5} />
      </group>

      <group ref={outerRingRef}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} rotation={[Math.PI / 2 + (i * Math.PI) / 4, 0, 0]}>
            <torusGeometry args={[2.5 + i * 0.4, 0.04, 16, 100]} />
            <meshBasicMaterial
              color="#8B5CF6"
              transparent
              opacity={0.5 - i * 0.08}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}
      </group>

      <Float speed={3} rotationIntensity={0} floatIntensity={0.5}>
        <Text
          position={[0, 0, 3]}
          fontSize={0.5}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff"
          fontWeight={700}
          letterSpacing={0.05}
        >
          ContentFlow
        </Text>
      </Float>
    </group>
  );
};

// Main component
const ContentFlowVisualization3D = () => {
  const [activePlatforms, setActivePlatforms] = useState([
    "instagram",
    "facebook",
    "twitter",
    "tiktok",
  ]);
  const [particleCount, setParticleCount] = useState(25);
  const [isLoading, setIsLoading] = useState(true);

  const generateParticles = () => {
    const particles = [];
    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#96CEB4",
      "#FFEAA7",
      "#DDA0DD",
      "#FF69B4",
      "#00CED1",
    ];

    for (let i = 0; i < particleCount; i++) {
      const startPlatform =
        activePlatforms[Math.floor(Math.random() * activePlatforms.length)];
      let endPlatform;
      do {
        endPlatform =
          activePlatforms[Math.floor(Math.random() * activePlatforms.length)];
      } while (endPlatform === startPlatform);

      particles.push({
        id: i,
        startPlatform,
        endPlatform,
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: 0.8 + Math.random() * 1.2,
        delay: Math.random() * 100,
      });
    }
    return particles;
  };

  const particles = generateParticles();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
            <Sparkles className="w-8 h-8 text-purple-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-white text-xl font-semibold">
            Initializing 3D Space...
          </p>
          <p className="text-gray-400 text-sm">Loading content visualization</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      <Canvas
        camera={{ position: [12, 8, 12], fov: 55 }}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={["#000000"]} />
        <fog attach="fog" args={["#0a0a0a", 18, 35]} />

        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={2} color="#8B5CF6" />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#4ECDC4" />
        <spotLight
          position={[0, 15, 0]}
          angle={0.3}
          penumbra={1}
          intensity={2}
          color="#ffffff"
        />

        <Environment preset="night" />

        <OrbitControls
          enableZoom={true}
          enablePan={true}
          zoomSpeed={0.8}
          autoRotate={true}
          autoRotateSpeed={0.3}
          maxPolarAngle={Math.PI / 1.8}
          minDistance={8}
          maxDistance={25}
        />

        <ContentFlowCore />

        <PlatformNode
          platform="instagram"
          position={[-5, 3, 0]}
          stats={{ posts: 12, engagement: 4.5, reach: 15000 }}
          isActive={activePlatforms.includes("instagram")}
        />
        <PlatformNode
          platform="facebook"
          position={[5, 3, 0]}
          stats={{ posts: 8, engagement: 3.2, reach: 25000 }}
          isActive={activePlatforms.includes("facebook")}
        />
        <PlatformNode
          platform="twitter"
          position={[0, 0, 5]}
          stats={{ posts: 15, engagement: 2.8, reach: 12000 }}
          isActive={activePlatforms.includes("twitter")}
        />
        <PlatformNode
          platform="tiktok"
          position={[-5, -3, 0]}
          stats={{ posts: 6, engagement: 7.2, reach: 50000 }}
          isActive={activePlatforms.includes("tiktok")}
        />
        <PlatformNode
          platform="youtube"
          position={[5, -3, 0]}
          stats={{ posts: 4, engagement: 5.1, reach: 35000 }}
          isActive={activePlatforms.includes("youtube")}
        />
        <PlatformNode
          platform="linkedin"
          position={[0, 0, -5]}
          stats={{ posts: 5, engagement: 1.8, reach: 8000 }}
          isActive={activePlatforms.includes("linkedin")}
        />

        {particles.map((particle) => (
          <ContentParticle key={particle.id} {...particle} />
        ))}
      </Canvas>

      {/* Modern gradient overlays */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-purple-100/5 via-transparent
       to-blue-100/5 pointer-events-none"
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent pointer-events-none" />

      {/* Modern stats bar */}
      <div
        className="absolute 
      top-3
      left-1/2 transform 
      -translate-x-1/2 
      bg-black/40 backdrop-blur-xl rounded-lg px-6 py-4 
      border 
      border-white/10 shadow-2xl"
      >
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Share2 className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="text-white font-bold text-sm">Content Flow</div>
              <div className="text-gray-400 text-xs">Real-time Analytics</div>
            </div>
          </div>

          <div className="h-8 w-px " />

          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-gray-300 text-sm">
              {activePlatforms.length} Active Platforms
            </span>
          </div>

          <div className="h-8 w-px " />

          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 text-sm font-semibold">Live</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentFlowVisualization3D;
