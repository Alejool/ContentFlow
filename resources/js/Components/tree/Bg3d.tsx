import React, {
  useRef,
  useState,
  useEffect,
  useMemo,
  useCallback,
  Suspense,
} from "react";
import { Canvas, useFrame, ThreeElements } from "@react-three/fiber";
import * as THREE from "three";
import {
  OrbitControls,
  Text,
  Html,
  Float,
  Sparkles,
  Trail,
  Stars,
  Sky,
  Environment,
  Lightformer,
} from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import {
  Share2,
  TrendingUp,
  Zap,
  RefreshCw,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Settings,
  ChevronDown,
  Sparkles as SparklesIcon,
  Globe,
  BarChart3,
  Users,
  Target,
} from "lucide-react";

// Types
interface PlatformConfig {
  color: string;
  gradient: [string, string];
  icon: string;
  name: string;
  description: string;
  category: string;
}

interface PlatformStats {
  posts: number;
  engagement: number;
  reach: number;
  growth: number;
  followers: number;
}

interface ContentParticleProps {
  id: number;
  startPlatform: string;
  endPlatform: string;
  speed?: number;
  color: string;
  delay?: number;
  size?: number;
  type?: "text" | "video" | "image" | "audio";
}

interface PlatformNodeProps {
  platform: string;
  position: [number, number, number];
  stats?: PlatformStats;
  isActive?: boolean;
  onClick?: () => void;
  onHover?: (hovered: boolean) => void;
}

interface PlatformConnectionProps {
  start: [number, number, number];
  end: [number, number, number];
  color: string;
  intensity?: number;
  animated?: boolean;
}

interface ControlPanelProps {
  speed: number;
  particleCount: number;
  isPlaying: boolean;
  quality: "low" | "medium" | "high";
  onSpeedChange: (speed: number) => void;
  onParticleCountChange: (count: number) => void;
  onQualityChange: (quality: "low" | "medium" | "high") => void;
  onPlayPause: () => void;
  onReset: () => void;
  activePlatforms: string[];
  onTogglePlatform: (platform: string) => void;
  totalMetrics: {
    totalReach: number;
    totalEngagement: number;
    totalPosts: number;
  };
}

// Platform configuration - MOVER FUERA DEL COMPONENTE
const PLATFORM_CONFIG: Record<string, PlatformConfig> = {
  instagram: {
    color: "#E4405F",
    gradient: ["#E4405F", "#833AB4"],
    icon: "IG",
    name: "Instagram",
    description: "Visual Content",
    category: "Social Media",
  },
  facebook: {
    color: "#1877F2",
    gradient: ["#1877F2", "#0D8BF0"],
    icon: "FB",
    name: "Facebook",
    description: "Social Network",
    category: "Social Media",
  },
  twitter: {
    color: "#1DA1F2",
    gradient: ["#1DA1F2", "#1A91DA"],
    icon: "X",
    name: "X (Twitter)",
    description: "Microblogging",
    category: "Social Media",
  },
  tiktok: {
    color: "#000000",
    gradient: ["#000000", "#FF0050"],
    icon: "TT",
    name: "TikTok",
    description: "Short Video",
    category: "Video",
  },
  youtube: {
    color: "#FF0000",
    gradient: ["#FF0000", "#282828"],
    icon: "YT",
    name: "YouTube",
    description: "Video Platform",
    category: "Video",
  },
  linkedin: {
    color: "#0A66C2",
    gradient: ["#0A66C2", "#004182"],
    icon: "IN",
    name: "LinkedIn",
    description: "Professional",
    category: "Professional",
  },
  threads: {
    color: "#000000",
    gradient: ["#000000", "#404040"],
    icon: "TH",
    name: "Threads",
    description: "Conversations",
    category: "Social Media",
  },
};

// Default config for unknown platforms
const DEFAULT_PLATFORM_CONFIG: PlatformConfig = {
  color: "#666666",
  gradient: ["#666666", "#888888"],
  icon: "?",
  name: "Unknown",
  description: "Platform",
  category: "Other",
};

// Galaxy Background Component
const GalaxyBackground = () => {
  return (
    <>
      <Stars
        radius={100}
        depth={50}
        count={5000}
        factor={4}
        saturation={0}
        fade
        speed={0.5}
      />
      <mesh>
        <sphereGeometry args={[100, 64, 64]} />
        <meshBasicMaterial
          color="#000000"
          side={THREE.BackSide}
          transparent
          opacity={0.8}
        />
      </mesh>
    </>
  );
};

// Animated Connection Lines with Particles
const AnimatedConnection: React.FC<PlatformConnectionProps> = ({
  start,
  end,
  color,
  intensity = 1,
  animated = true,
}) => {
  const lineRef = useRef<THREE.Line>(null);
  const [time, setTime] = useState(0);

  const startVec = new THREE.Vector3(...start);
  const endVec = new THREE.Vector3(...end);

  // Create curved path
  const midPoint = new THREE.Vector3()
    .addVectors(startVec, endVec)
    .multiplyScalar(0.5)
    .add(new THREE.Vector3(0, 2, 0));

  const curve = new THREE.QuadraticBezierCurve3(startVec, midPoint, endVec);
  const points = curve.getPoints(32);
  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  useFrame((state) => {
    if (animated) {
      setTime(state.clock.elapsedTime);
    }
  });

  // Create moving particles along the line
  const particleCount = Math.floor(points.length * 0.3);
  const particles = useMemo(() => {
    return Array.from({ length: particleCount }, (_, i) => {
      const t = i / particleCount;
      const point = curve.getPoint(t);
      return {
        position: point,
        offset: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 1.5,
      };
    });
  }, [curve, particleCount]);

  return (
    <group>
      {/* Main connection line */}
      <line ref={lineRef} geometry={geometry}>
        <lineBasicMaterial
          color={color}
          transparent
          opacity={0.2 + intensity * 0.3}
          linewidth={1}
        />
      </line>

      {/* Pulsing glow effect */}
      <line geometry={geometry}>
        <lineBasicMaterial
          color={color}
          transparent
          opacity={0.1 + Math.sin(time * 2) * 0.1}
          linewidth={3}
        />
      </line>

      {/* Animated particles along the line */}
      {animated &&
        particles.map((particle, i) => (
          <mesh
            key={i}
            position={particle.position}
            scale={
              0.05 + Math.sin(time * particle.speed + particle.offset) * 0.03
            }
          >
            <sphereGeometry args={[0.15]} />
            <meshBasicMaterial color={color} transparent opacity={0.7} />
          </mesh>
        ))}
    </group>
  );
};

// Enhanced Particle with Type-based Appearance
const ContentParticle: React.FC<ContentParticleProps> = React.memo(
  ({
    id,
    startPlatform,
    endPlatform,
    speed = 1,
    color,
    delay = 0,
    size = 0.15,
    type = "text",
  }) => {
    const particleRef = useRef<THREE.Group>(null);
    const [progress, setProgress] = useState(0);
    const [rotationSpeed] = useState(0.5 + Math.random() * 1);

    const platformPositions: Record<string, THREE.Vector3> = useMemo(
      () => ({
        instagram: new THREE.Vector3(-5, 2.5, 0),
        facebook: new THREE.Vector3(5, 2.5, 0),
        twitter: new THREE.Vector3(0, 1.5, 5),
        tiktok: new THREE.Vector3(-5, -1.5, 0),
        youtube: new THREE.Vector3(5, -1.5, 0),
        linkedin: new THREE.Vector3(0, 1.5, -5),
        threads: new THREE.Vector3(0, -2.5, 0),
      }),
      []
    );

    const startPos = platformPositions[startPlatform];
    const endPos = platformPositions[endPlatform];

    useFrame((state) => {
      if (!particleRef.current || !startPos || !endPos) return;

      const t = (progress / 100) % 1;
      const easedT = Math.sin(t * Math.PI * 0.5);

      // Create more natural curve with multiple control points
      const cp1 = new THREE.Vector3()
        .copy(startPos)
        .add(new THREE.Vector3(0, 3, 0));

      const cp2 = new THREE.Vector3()
        .copy(endPos)
        .add(new THREE.Vector3(0, 3, 0));

      // Cubic bezier curve for smoother motion
      const position = new THREE.Vector3()
        .copy(startPos)
        .multiplyScalar(Math.pow(1 - easedT, 3))
        .add(
          new THREE.Vector3()
            .copy(cp1)
            .multiplyScalar(3 * Math.pow(1 - easedT, 2) * easedT)
        )
        .add(
          new THREE.Vector3()
            .copy(cp2)
            .multiplyScalar(3 * (1 - easedT) * Math.pow(easedT, 2))
        )
        .add(
          new THREE.Vector3().copy(endPos).multiplyScalar(Math.pow(easedT, 3))
        );

      particleRef.current.position.copy(position);

      // Rotation based on type
      if (type === "video") {
        particleRef.current.rotation.x =
          state.clock.elapsedTime * rotationSpeed;
        particleRef.current.rotation.y =
          state.clock.elapsedTime * rotationSpeed * 0.7;
      } else {
        particleRef.current.rotation.y =
          state.clock.elapsedTime * rotationSpeed;
      }

      setProgress((prev) => prev + speed * 0.5);
    });

    useEffect(() => {
      const timer = setTimeout(() => {
        setProgress(delay);
      }, delay * 10);
      return () => clearTimeout(timer);
    }, [delay]);

    // Different geometries based on content type
    const getGeometry = () => {
      switch (type) {
        case "video":
          return <boxGeometry args={[size, size * 0.6, size * 0.1]} />;
        case "image":
          return <planeGeometry args={[size * 1.2, size * 1.2]} />;
        case "audio":
          return <sphereGeometry args={[size * 0.8, 16, 16]} />;
        default: // text
          return <dodecahedronGeometry args={[size, 0]} />;
      }
    };

    return (
      <Trail
        width={0.15}
        length={6}
        color={new THREE.Color(color)}
        attenuation={(t) => t * t}
        decay={2}
      >
        <group ref={particleRef}>
          <mesh>
            {getGeometry()}
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.8}
              metalness={type === "video" ? 0.9 : 0.7}
              roughness={type === "image" ? 0.3 : 0.2}
              transparent
              opacity={0.9}
            />
          </mesh>

          {/* Add a small glow */}
          <mesh scale={1.2}>
            <sphereGeometry args={[size * 0.3, 8, 8]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.3}
              side={THREE.BackSide}
            />
          </mesh>
        </group>
      </Trail>
    );
  }
);

ContentParticle.displayName = "ContentParticle";

// Enhanced Platform Node with Realistic Effects - CORREGIDO
const PlatformNode: React.FC<PlatformNodeProps> = React.memo(
  ({
    platform,
    position,
    stats = { posts: 0, engagement: 0, reach: 0, growth: 0, followers: 0 },
    isActive = false,
    onClick,
    onHover,
  }) => {
    const nodeRef = useRef<THREE.Group>(null);
    const [hovered, setHovered] = useState(false);
    const [clicked, setClicked] = useState(false);
    const [pulsePhase] = useState(Math.random() * Math.PI * 2);

    // Usar la configuración global
    const config = PLATFORM_CONFIG[platform] || DEFAULT_PLATFORM_CONFIG;

    useFrame((state) => {
      if (nodeRef.current) {
        // Floating animation
        const floatY =
          Math.sin(state.clock.elapsedTime * 0.8 + pulsePhase) * 0.15;
        nodeRef.current.position.y = position[1] + floatY;

        // Rotation
        nodeRef.current.rotation.y = state.clock.elapsedTime * 0.2;

        // Scale animation on hover/active
        const targetScale = hovered ? 1.15 : isActive ? 1.1 : 1;
        const currentScale = nodeRef.current.scale.x;
        const newScale = THREE.MathUtils.lerp(currentScale, targetScale, 0.1);
        nodeRef.current.scale.setScalar(newScale);

        // Pulsing effect when active
        if (isActive) {
          const pulse = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.05;
          nodeRef.current.scale.multiplyScalar(pulse);
        }
      }
    });

    const handlePointerOver = useCallback(() => {
      setHovered(true);
      onHover?.(true);
    }, [onHover]);

    const handlePointerOut = useCallback(() => {
      setHovered(false);
      onHover?.(false);
    }, [onHover]);

    const handleClick = useCallback(() => {
      setClicked(true);
      onClick?.();
      setTimeout(() => setClicked(false), 300);
    }, [onClick]);

    return (
      <group position={position} ref={nodeRef}>
        {/* Outer orbital ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.2, 2.4, 32]} />
          <meshBasicMaterial
            color={config.color}
            transparent
            opacity={0.15}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Glow sphere */}
        <mesh>
          <sphereGeometry args={[1.6, 32, 32]} />
          <meshBasicMaterial
            color={config.color}
            transparent
            opacity={0.08}
            side={THREE.BackSide}
          />
        </mesh>

        {/* Main platform sphere */}
        <mesh
          onClick={handleClick}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        >
          <icosahedronGeometry args={[1.2, 2]} />
          <meshStandardMaterial
            color={config.color}
            emissive={config.color}
            emissiveIntensity={isActive ? 0.6 : 0.3}
            metalness={0.9}
            roughness={0.1}
            transparent
            opacity={0.95}
            envMapIntensity={1}
          />
        </mesh>

        {/* Inner detail sphere */}
        <mesh scale={0.7}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.2}
            wireframe
          />
        </mesh>

        {/* Platform icon/text */}
        <Text
          position={[0, 0, 1.4]}
          fontSize={0.5}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.05}
          outlineColor="#000000"
          fontWeight="bold"
        >
          {config.icon}
        </Text>

        {/* Platform name */}
        <Text
          position={[0, -1.9, 0]}
          fontSize={0.3}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          fontWeight="500"
        >
          {config.name}
        </Text>

        {/* Click explosion effect */}
        {clicked && (
          <Sparkles
            count={30}
            scale={2.5}
            size={2}
            speed={0.4}
            color={config.color}
          />
        )}

        {/* Hover stats panel */}
        {hovered && (
          <Html
            position={[0, 2.8, 0]}
            center
            distanceFactor={15}
            zIndexRange={[100, 0]}
            style={{ pointerEvents: "none" }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-gray-900/95 backdrop-blur-xl p-4 rounded-xl border border-gray-800 shadow-2xl min-w-[240px]"
              style={{ borderColor: config.color }}
            >
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                  style={{
                    background: `linear-gradient(135deg, ${config.gradient[0]}, ${config.gradient[1]})`,
                  }}
                >
                  {config.icon}
                </div>
                <div>
                  <h3 className="text-white font-bold">{config.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-gray-400 text-xs">
                      {config.category}
                    </span>
                    <span className="text-gray-600">•</span>
                    <span className="text-gray-400 text-xs">
                      {config.description}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-gray-800/40 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 className="w-3 h-3 text-blue-400" />
                    <span className="text-gray-400 text-xs">Posts</span>
                  </div>
                  <div className="text-white font-bold text-lg">
                    {stats.posts}
                  </div>
                </div>
                <div className="bg-gray-800/40 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="w-3 h-3 text-green-400" />
                    <span className="text-gray-400 text-xs">Engagement</span>
                  </div>
                  <div className="text-green-400 font-bold text-lg">
                    {stats.engagement}%
                  </div>
                </div>
                <div className="bg-gray-800/40 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-3 h-3 text-purple-400" />
                    <span className="text-gray-400 text-xs">Reach</span>
                  </div>
                  <div className="text-white font-bold text-lg">
                    {(stats.reach / 1000).toFixed(0)}K
                  </div>
                </div>
                <div className="bg-gray-800/40 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-3 h-3 text-yellow-400" />
                    <span className="text-gray-400 text-xs">Growth</span>
                  </div>
                  <div className="text-yellow-400 font-bold text-lg">
                    +{stats.growth}%
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-800/50">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Status</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      isActive
                        ? "bg-green-900/30 text-green-400"
                        : "bg-gray-800 text-gray-400"
                    }`}
                  >
                    {isActive ? "● Active" : "○ Inactive"}
                  </span>
                </div>
              </div>
            </motion.div>
          </Html>
        )}
      </group>
    );
  }
);

PlatformNode.displayName = "PlatformNode";

// Enhanced Content Flow Core with Data Visualization
const ContentFlowCore: React.FC<{ isPlaying: boolean }> = ({ isPlaying }) => {
  const coreRef = useRef<THREE.Group>(null);
  const ringsRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (coreRef.current) {
      const time = state.clock.elapsedTime;

      // Core rotation
      coreRef.current.rotation.y = time * 0.1;
      coreRef.current.rotation.x = Math.sin(time * 0.05) * 0.1;

      // Breathing animation
      const breath = Math.sin(time * 0.3) * 0.05 + 1;
      coreRef.current.scale.setScalar(breath);

      // Rings animation
      if (ringsRef.current) {
        ringsRef.current.children.forEach((ring, i) => {
          ring.rotation.y = time * (0.05 + i * 0.02);
          ring.rotation.x = time * (0.03 + i * 0.01);
        });
      }
    }
  });

  return (
    <group ref={coreRef}>
      {/* Central data core */}
      <mesh>
        <dodecahedronGeometry args={[1.8, 1]} />
        <meshStandardMaterial
          color="#8B5CF6"
          emissive="#8B5CF6"
          emissiveIntensity={0.7}
          metalness={0.95}
          roughness={0.05}
          transparent
          opacity={0.9}
          envMapIntensity={1}
        />
      </mesh>

      {/* Inner energy sphere */}
      <mesh scale={0.6}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.3}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Animated data rings */}
      <group ref={ringsRef}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[2.5 + i * 0.8, 0.03, 16, 100]} />
            <meshBasicMaterial
              color="#8B5CF6"
              transparent
              opacity={0.2 - i * 0.04}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}
      </group>

      {/* Floating data particles */}
      {isPlaying && (
        <Sparkles
          count={40}
          scale={6}
          size={1.5}
          speed={0.3}
          color="#8B5CF6"
          noise={1}
        />
      )}

      {/* Core label */}
      <Text
        position={[0, 0, 3]}
        fontSize={0.6}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.03}
        outlineColor="#000000"
        fontWeight="bold"
      >
        DATA HUB
      </Text>

      {/* Connection points */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const radius = 2.8;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        return (
          <mesh key={i} position={[x, 0, z]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshBasicMaterial
              color="#8B5CF6"
              emissive="#8B5CF6"
              emissiveIntensity={0.5}
            />
          </mesh>
        );
      })}
    </group>
  );
};

// Enhanced Control Panel
const ControlPanel: React.FC<ControlPanelProps> = ({
  speed,
  particleCount,
  isPlaying,
  quality,
  onSpeedChange,
  onParticleCountChange,
  onQualityChange,
  onPlayPause,
  onReset,
  activePlatforms,
  onTogglePlatform,
  totalMetrics,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<"platforms" | "visuals" | "data">(
    "platforms"
  );

  const platforms = [
    { id: "instagram", name: "Instagram", color: "#E4405F", icon: "📸" },
    { id: "facebook", name: "Facebook", color: "#1877F2", icon: "👥" },
    { id: "twitter", name: "Twitter", color: "#1DA1F2", icon: "💬" },
    { id: "tiktok", name: "TikTok", color: "#000000", icon: "🎵" },
    { id: "youtube", name: "YouTube", color: "#FF0000", icon: "▶️" },
    { id: "linkedin", name: "LinkedIn", color: "#0A66C2", icon: "💼" },
    { id: "threads", name: "Threads", color: "#000000", icon: "🧵" },
  ];

  const qualityOptions = [
    { value: "low", label: "Low", description: "Better Performance" },
    { value: "medium", label: "Medium", description: "Balanced" },
    { value: "high", label: "High", description: "Best Quality" },
  ];

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="absolute top-6 left-6 z-50 bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-gray-800/50 shadow-2xl overflow-hidden"
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-900/30 rounded-lg">
              <Globe className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-white font-bold">Network Controls</h3>
              <p className="text-gray-400 text-sm">Real-time Visualization</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
          >
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </motion.button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-gray-800/40 p-3 rounded-lg">
            <div className="text-gray-400 text-xs mb-1">Total Reach</div>
            <div className="text-white font-bold">
              {(totalMetrics.totalReach / 1000).toFixed(0)}K
            </div>
          </div>
          <div className="bg-gray-800/40 p-3 rounded-lg">
            <div className="text-gray-400 text-xs mb-1">Engagement</div>
            <div className="text-green-400 font-bold">
              {totalMetrics.totalEngagement.toFixed(1)}%
            </div>
          </div>
          <div className="bg-gray-800/40 p-3 rounded-lg">
            <div className="text-gray-400 text-xs mb-1">Active</div>
            <div className="text-white font-bold">
              {activePlatforms.length}/7
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-4 overflow-hidden"
            >
              {/* Tabs */}
              <div className="flex border-b border-gray-800">
                {[
                  { id: "platforms", label: "Platforms", icon: "🌐" },
                  { id: "visuals", label: "Visuals", icon: "🎨" },
                  { id: "data", label: "Data", icon: "📊" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm transition-colors ${
                      activeTab === tab.id
                        ? "text-purple-400 border-b-2 border-purple-400"
                        : "text-gray-400 hover:text-gray-300"
                    }`}
                  >
                    <span>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="space-y-4">
                {activeTab === "platforms" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      {platforms.map((platform) => (
                        <button
                          key={platform.id}
                          onClick={() => onTogglePlatform(platform.id)}
                          className={`flex items-center gap-2 p-3 rounded-xl transition-all ${
                            activePlatforms.includes(platform.id)
                              ? "bg-gray-800 ring-1 ring-opacity-30"
                              : "bg-gray-800/30 hover:bg-gray-800/50"
                          }`}
                          style={{
                            borderColor: platform.color,
                            borderWidth: activePlatforms.includes(platform.id)
                              ? "1px"
                              : "0",
                          }}
                        >
                          <span className="text-lg">{platform.icon}</span>
                          <div className="text-left flex-1">
                            <div className="text-white text-sm font-medium">
                              {platform.name}
                            </div>
                            <div
                              className="text-xs"
                              style={{ color: platform.color }}
                            >
                              {activePlatforms.includes(platform.id)
                                ? "Active"
                                : "Inactive"}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "visuals" && (
                  <div className="space-y-4">
                    {/* Play/Pause Controls */}
                    <div className="flex gap-2">
                      <button
                        onClick={onPlayPause}
                        className="flex-1 flex items-center justify-center gap-2 p-3 bg-gray-800/50 hover:bg-gray-800 rounded-xl transition-colors"
                      >
                        {isPlaying ? (
                          <>
                            <Pause className="w-4 h-4" />
                            <span className="text-sm">Pause</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />
                            <span className="text-sm">Play</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={onReset}
                        className="p-3 bg-gray-800/50 hover:bg-gray-800 rounded-xl transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Speed Control */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-yellow-400" />
                          <span className="text-sm text-gray-300">Speed</span>
                        </div>
                        <span className="text-white font-medium">
                          {speed.toFixed(1)}x
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="3"
                        step="0.1"
                        value={speed}
                        onChange={(e) =>
                          onSpeedChange(parseFloat(e.target.value))
                        }
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500"
                      />
                    </div>

                    {/* Particle Control */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <SparklesIcon className="w-4 h-4 text-purple-400" />
                          <span className="text-sm text-gray-300">
                            Particles
                          </span>
                        </div>
                        <span className="text-white font-medium">
                          {particleCount}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        step="10"
                        value={particleCount}
                        onChange={(e) =>
                          onParticleCountChange(parseInt(e.target.value))
                        }
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500"
                      />
                    </div>

                    {/* Quality Settings */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-300">Quality</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {qualityOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() =>
                              onQualityChange(
                                option.value as "low" | "medium" | "high"
                              )
                            }
                            className={`p-2 rounded-lg text-sm transition-colors ${
                              quality === option.value
                                ? "bg-purple-900/50 text-purple-300 ring-1 ring-purple-500"
                                : "bg-gray-800/30 text-gray-400 hover:bg-gray-800/50"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "data" && (
                  <div className="space-y-3">
                    <div className="bg-gray-800/30 p-3 rounded-xl">
                      <div className="text-gray-400 text-xs mb-2">
                        Data Flow Rate
                      </div>
                      <div className="flex items-end gap-1 h-8">
                        {[40, 60, 80, 70, 90, 75, 85].map((height, i) => (
                          <motion.div
                            key={i}
                            animate={{ height: `${height}%` }}
                            transition={{
                              duration: 0.5,
                              delay: i * 0.1,
                              repeat: Infinity,
                              repeatType: "reverse",
                              repeatDelay: 0.5,
                            }}
                            className="flex-1 bg-gradient-to-t from-purple-500 to-purple-300 rounded-t"
                            style={{ height: `${height}%` }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-gray-800/30 p-3 rounded-xl">
                        <div className="text-gray-400 text-xs">Posts Today</div>
                        <div className="text-white font-bold">
                          {totalMetrics.totalPosts}
                        </div>
                      </div>
                      <div className="bg-gray-800/30 p-3 rounded-xl">
                        <div className="text-gray-400 text-xs">
                          Engagement Rate
                        </div>
                        <div className="text-green-400 font-bold">
                          {totalMetrics.totalEngagement.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// Main Component
const Bg3d: React.FC<{
  data?: any;
  isPlaying?: boolean;
  onPlatformSelect?: (platform: string) => void;
  className?: string;
}> = ({
  data = {},
  isPlaying: initialPlaying = true,
  onPlatformSelect,
  className = "",
}) => {
  const [activePlatforms, setActivePlatforms] = useState<string[]>([
    "instagram",
    "facebook",
    "twitter",
    "tiktok",
    "youtube",
    "linkedin",
  ]);
  const [speed, setSpeed] = useState(1);
  const [particleCount, setParticleCount] = useState(40);
  const [quality, setQuality] = useState<"low" | "medium" | "high">("medium");
  const [isPlaying, setIsPlaying] = useState(initialPlaying);
  const [isLoading, setIsLoading] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [hoveredPlatform, setHoveredPlatform] = useState<string | null>(null);

  // Platform statistics
  const platformStats = useMemo(
    () => ({
      instagram: {
        posts: 24,
        engagement: 5.2,
        reach: 18500,
        growth: 12,
        followers: 12500,
      },
      facebook: {
        posts: 15,
        engagement: 3.8,
        reach: 32000,
        growth: 8,
        followers: 28000,
      },
      twitter: {
        posts: 42,
        engagement: 3.1,
        reach: 15600,
        growth: 5,
        followers: 9800,
      },
      tiktok: {
        posts: 18,
        engagement: 8.7,
        reach: 72000,
        growth: 32,
        followers: 45000,
      },
      youtube: {
        posts: 9,
        engagement: 6.3,
        reach: 42000,
        growth: 18,
        followers: 32500,
      },
      linkedin: {
        posts: 8,
        engagement: 2.4,
        reach: 9500,
        growth: 7,
        followers: 6200,
      },
      threads: {
        posts: 31,
        engagement: 4.2,
        reach: 12800,
        growth: 45,
        followers: 8400,
      },
    }),
    []
  );

  // Calculate total metrics
  const totalMetrics = useMemo(() => {
    return activePlatforms.reduce(
      (acc, platform) => {
        const stats = platformStats[platform as keyof typeof platformStats];
        if (stats) {
          acc.totalReach += stats.reach;
          acc.totalEngagement += stats.engagement;
          acc.totalPosts += stats.posts;
        }
        return acc;
      },
      { totalReach: 0, totalEngagement: 0, totalPosts: 0 }
    );
  }, [activePlatforms, platformStats]);

  // Generate optimized particles based on quality
  const particles = useMemo(() => {
    const count = quality === "low" ? particleCount / 2 : particleCount;
    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#96CEB4",
      "#FFEAA7",
      "#DDA0DD",
      "#8B5CF6",
      "#10B981",
      "#F59E0B",
      "#EC4899",
    ];

    const types: Array<"text" | "video" | "image" | "audio"> = [
      "text",
      "video",
      "image",
      "audio",
    ];

    return Array.from({ length: count }, (_, i) => {
      const startPlatform =
        activePlatforms[Math.floor(Math.random() * activePlatforms.length)];
      let endPlatform;

      do {
        endPlatform =
          activePlatforms[Math.floor(Math.random() * activePlatforms.length)];
      } while (endPlatform === startPlatform && activePlatforms.length > 1);

      return {
        id: i,
        startPlatform,
        endPlatform,
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: 0.2 + Math.random() * speed * 0.8,
        delay: Math.random() * 100,
        size:
          quality === "high"
            ? 0.1 + Math.random() * 0.2
            : 0.1 + Math.random() * 0.15,
        type: types[Math.floor(Math.random() * types.length)],
      };
    });
  }, [particleCount, speed, activePlatforms, quality]);

  const handleTogglePlatform = useCallback((platform: string) => {
    setActivePlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  }, []);

  const handleReset = useCallback(() => {
    setActivePlatforms([
      "instagram",
      "facebook",
      "twitter",
      "tiktok",
      "youtube",
      "linkedin",
    ]);
    setSpeed(1);
    setParticleCount(40);
    setIsPlaying(true);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="w-full h-screen relative bg-gradient-to-br from-gray-900 via-black to-purple-900/30 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-32 h-32 border-4 border-purple-500/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <div className="absolute inset-6 border-4 border-pink-500 border-b-transparent rounded-full animate-spin-reverse" />
            <div
              className="absolute inset-12 border-4 border-blue-500 border-r-transparent rounded-full animate-spin"
              style={{ animationDuration: "3s" }}
            />
          </div>
          <div>
            <h3 className="text-white text-2xl font-bold mb-2">
              Initializing Network
            </h3>
            <p className="text-gray-400">
              Loading 3D visualization environment...
            </p>
            <div className="mt-4 w-64 h-1 bg-gray-800 rounded-full overflow-hidden mx-auto">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1, ease: "easeInOut" }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative ${
        fullscreen ? "fixed inset-0 z-50" : `w-full h-[800px] ${className}`
      } bg-gradient-to-br from-gray-900 via-black to-purple-900/30 rounded-3xl overflow-hidden border border-gray-800/50 shadow-2xl`}
    >
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />

      {/* Control Panel */}
      <ControlPanel
        speed={speed}
        particleCount={particleCount}
        isPlaying={isPlaying}
        quality={quality}
        onSpeedChange={setSpeed}
        onParticleCountChange={setParticleCount}
        onQualityChange={setQuality}
        onPlayPause={() => setIsPlaying(!isPlaying)}
        onReset={handleReset}
        activePlatforms={activePlatforms}
        onTogglePlatform={handleTogglePlatform}
        totalMetrics={totalMetrics}
      />

      {/* Stats Overview */}
      <div className="absolute top-6 right-6 z-50">
        <div className="bg-gray-900/90 backdrop-blur-xl rounded-2xl p-4 border border-gray-800/50 shadow-2xl">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                {activePlatforms.length}
              </div>
              <div className="text-gray-400 text-sm">Platforms</div>
            </div>
            <div className="h-10 w-px bg-gradient-to-b from-transparent via-gray-700 to-transparent" />
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">
                {particleCount}
              </div>
              <div className="text-gray-400 text-sm">Particles</div>
            </div>
            <div className="h-10 w-px bg-gradient-to-b from-transparent via-gray-700 to-transparent" />
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">
                {speed.toFixed(1)}x
              </div>
              <div className="text-gray-400 text-sm">Speed</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-800/50">
            <div className="text-xs text-gray-400 text-center">
              {quality.charAt(0).toUpperCase() + quality.slice(1)} Quality
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Toggle */}
      <button
        onClick={() => setFullscreen(!fullscreen)}
        className="absolute top-6 right-48 z-50 p-3 bg-gray-900/90 backdrop-blur-xl rounded-xl border border-gray-800/50 hover:bg-gray-800/80 transition-all hover:scale-105"
      >
        {fullscreen ? (
          <Minimize2 className="w-5 h-5 text-gray-300" />
        ) : (
          <Maximize2 className="w-5 h-5 text-gray-300" />
        )}
      </button>

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [12, 8, 12], fov: 60 }}
        className="cursor-grab active:cursor-grabbing"
        shadows={quality !== "low"}
        dpr={quality === "high" ? [1, 2] : 1}
        performance={{ min: 0.5 }}
      >
        <Suspense fallback={null}>
          {/* Environment */}
          <Environment preset="night" />

          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={1.2} color="#8B5CF6" />
          <pointLight
            position={[-10, 5, -10]}
            intensity={0.8}
            color="#4ECDC4"
          />
          <pointLight position={[0, 15, 0]} intensity={0.5} color="#FFFFFF" />
          <hemisphereLight
            intensity={0.3}
            color="#ffffff"
            groundColor="#080820"
          />

          {/* Galaxy Background */}
          <GalaxyBackground />

          {/* Fog */}
          <fog attach="fog" args={["#000000", 10, 35]} />
          <color attach="background" args={["#000000"]} />

          {/* Controls */}
          <OrbitControls
            enableZoom={true}
            enablePan={true}
            zoomSpeed={0.8}
            autoRotate={isPlaying}
            autoRotateSpeed={0.4}
            maxPolarAngle={Math.PI / 1.8}
            minDistance={6}
            maxDistance={30}
            enableDamping
            dampingFactor={0.05}
            rotateSpeed={0.8}
          />

          {/* Core */}
          <ContentFlowCore isPlaying={isPlaying} />

          {/* Platform Nodes */}
          {[
            {
              platform: "instagram",
              position: [-5, 2.5, 0] as [number, number, number],
            },
            {
              platform: "facebook",
              position: [5, 2.5, 0] as [number, number, number],
            },
            {
              platform: "twitter",
              position: [0, 1.5, 5] as [number, number, number],
            },
            {
              platform: "tiktok",
              position: [-5, -1.5, 0] as [number, number, number],
            },
            {
              platform: "youtube",
              position: [5, -1.5, 0] as [number, number, number],
            },
            {
              platform: "linkedin",
              position: [0, 1.5, -5] as [number, number, number],
            },
            {
              platform: "threads",
              position: [0, -2.5, 0] as [number, number, number],
            },
          ].map(({ platform, position }) => (
            <PlatformNode
              key={platform}
              platform={platform}
              position={position}
              stats={platformStats[platform as keyof typeof platformStats]}
              isActive={activePlatforms.includes(platform)}
              onClick={() => onPlatformSelect?.(platform)}
              onHover={(hovered) =>
                setHoveredPlatform(hovered ? platform : null)
              }
            />
          ))}

          {/* Platform Connections */}
          {activePlatforms.length > 1 &&
            hoveredPlatform &&
            activePlatforms
              .filter((p) => p !== hoveredPlatform)
              .map((targetPlatform) => {
                const startPos = {
                  instagram: [-5, 2.5, 0],
                  facebook: [5, 2.5, 0],
                  twitter: [0, 1.5, 5],
                  tiktok: [-5, -1.5, 0],
                  youtube: [5, -1.5, 0],
                  linkedin: [0, 1.5, -5],
                  threads: [0, -2.5, 0],
                }[hoveredPlatform] as [number, number, number];

                const endPos = {
                  instagram: [-5, 2.5, 0],
                  facebook: [5, 2.5, 0],
                  twitter: [0, 1.5, 5],
                  tiktok: [-5, -1.5, 0],
                  youtube: [5, -1.5, 0],
                  linkedin: [0, 1.5, -5],
                  threads: [0, -2.5, 0],
                }[targetPlatform] as [number, number, number];

                const color =
                  PLATFORM_CONFIG[hoveredPlatform]?.color || "#8B5CF6";

                return (
                  <AnimatedConnection
                    key={`${hoveredPlatform}-${targetPlatform}`}
                    start={startPos}
                    end={endPos}
                    color={color}
                    intensity={0.8}
                    animated={isPlaying}
                  />
                );
              })}

          {/* Content Particles */}
          {isPlaying &&
            particles.map((particle) => (
              <ContentParticle key={particle.id} {...particle} />
            ))}

          {/* Additional Stars */}
          {quality !== "low" && (
            <Sparkles
              count={300}
              scale={60}
              size={0.6}
              speed={0.2}
              color="#FFFFFF"
              noise={2}
            />
          )}
        </Suspense>
      </Canvas>

      {/* Bottom Info Panel */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, type: "spring", stiffness: 100 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-40"
      >
        <div className="bg-gray-900/90 backdrop-blur-xl rounded-2xl p-5 border border-gray-800/50 shadow-2xl min-w-[500px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-900/30 rounded-xl">
                <Share2 className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h4 className="text-white font-bold text-lg">
                  Content Distribution Network
                </h4>
                <p className="text-gray-400 text-sm">
                  Real-time data flow across {activePlatforms.length} active
                  platforms • {particles.length} content particles
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-ping" />
                </div>
                <div>
                  <div className="text-green-400 text-sm font-medium">
                    Live Data Stream
                  </div>
                  <div className="text-gray-400 text-xs">Updated now</div>
                </div>
              </div>

              <div className="h-8 w-px bg-gradient-to-b from-transparent via-gray-700 to-transparent" />

              <div className="text-center">
                <div className="text-xl font-bold text-white">
                  {totalMetrics.totalPosts}
                </div>
                <div className="text-gray-400 text-xs">Total Posts</div>
              </div>

              <div className="text-center">
                <div className="text-xl font-bold text-blue-400">
                  {(totalMetrics.totalReach / 1000).toFixed(0)}K
                </div>
                <div className="text-gray-400 text-xs">Total Reach</div>
              </div>
            </div>
          </div>

          {/* Progress bars */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {activePlatforms.slice(0, 3).map((platform) => {
              const stats =
                platformStats[platform as keyof typeof platformStats];
              const config =
                PLATFORM_CONFIG[platform] || DEFAULT_PLATFORM_CONFIG;
              return (
                <div key={platform} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">{config.name}</span>
                    <span className="text-white font-medium">
                      {stats.engagement}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stats.engagement}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                      className="h-full rounded-full"
                      style={{
                        background: `linear-gradient(90deg, ${config.gradient[0]}, ${config.gradient[1]})`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Floating particles overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(quality === "high" ? 30 : 15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 4 + 1 + "px",
              height: Math.random() * 4 + 1 + "px",
              background: `radial-gradient(circle at center, 
                ${Math.random() > 0.5 ? "#8B5CF6" : "#4ECDC4"}20, 
                transparent 70%)`,
            }}
            initial={{
              x: Math.random() * 100 + "vw",
              y: Math.random() * 100 + "vh",
              opacity: 0,
            }}
            animate={{
              x: Math.random() * 100 + "vw",
              y: Math.random() * 100 + "vh",
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              repeatType: "loop",
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Performance warning for low quality */}
      {quality === "low" && (
        <div className="absolute bottom-4 left-4 z-40">
          <div className="px-3 py-1 bg-yellow-900/50 backdrop-blur-sm rounded-full border border-yellow-800/50">
            <span className="text-yellow-300 text-xs font-medium">
              Performance Mode
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bg3d;
