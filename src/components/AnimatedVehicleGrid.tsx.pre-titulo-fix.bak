import React, { useState, useEffect, useMemo } from 'react';
import { useVehicles } from '../context/VehicleContext';
import { getVehicleImage } from '../utils/getVehicleImage';
import { motion } from 'framer-motion';

interface AnimatedVehicleGridProps {
  maxVehicles?: number;
  gradientDirection?: 'diagonal' | 'bottom';
}

const AnimatedVehicleGrid: React.FC<AnimatedVehicleGridProps> = ({
  maxVehicles = 20, // Reduced default for faster initial load
  gradientDirection = 'diagonal'
}) => {
  const { vehicles } = useVehicles();
  const [visibleCount, setVisibleCount] = useState(0);
  const [animationSpeed, setAnimationSpeed] = useState(150); // Start faster at 150ms

  // Select random vehicles and prepare grid
  const gridVehicles = useMemo(() => {
    if (!vehicles || vehicles.length === 0) {
      console.log('AnimatedVehicleGrid: No vehicles available');
      return [];
    }

    console.log('AnimatedVehicleGrid: Loading with', vehicles.length, 'vehicles');
    // Shuffle and take the first maxVehicles
    const shuffled = [...vehicles].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(maxVehicles, shuffled.length));
  }, [vehicles, maxVehicles]);

  // Calculate responsive grid columns
  const getGridColumns = () => {
    if (typeof window === 'undefined') return 6;
    const width = window.innerWidth;
    if (width < 640) return 3;  // Mobile: 3 columns (more rows to cover screen)
    if (width < 1024) return 5; // Tablet: 5 columns
    return 6; // Desktop: 6 columns
  };

  const [cols, setCols] = useState(6);

  useEffect(() => {
    // Set initial value
    setCols(getGridColumns());

    const handleResize = () => setCols(getGridColumns());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Progressive animation with increasing speed - optimized with proper cleanup
  useEffect(() => {
    if (visibleCount >= gridVehicles.length) return;

    // Calculate speed based on current iteration to avoid circular dependency
    // Start at 150ms, reduce by 5ms per vehicle, minimum 30ms for faster loading
    const currentSpeed = Math.max(30, 150 - (visibleCount * 5));

    const timer = setTimeout(() => {
      setVisibleCount(prev => Math.min(prev + 1, gridVehicles.length));
      setAnimationSpeed(currentSpeed);
    }, currentSpeed);

    return () => clearTimeout(timer);
  }, [visibleCount, gridVehicles.length]);

  // Reset animation when vehicles change
  useEffect(() => {
    setVisibleCount(0);
  }, [gridVehicles]);

  // Calculate responsive transform for mobile vertical screens
  const getTransform = () => {
    if (typeof window === 'undefined') return 'rotate(-8deg) scale(1.4)';
    const width = window.innerWidth;
    if (width < 640) {
      // Mobile: adjust rotation and scale for vertical screens
      return 'rotate(-12deg) scale(1.8) translateY(-5%)';
    }
    return 'rotate(-8deg) scale(1.4)';
  };

  const [transform, setTransform] = useState('rotate(-8deg) scale(1.4)');

  useEffect(() => {
    // Set initial value
    setTransform(getTransform());

    const handleResize = () => setTransform(getTransform());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate gradient overlay style
  const getGradientStyle = () => {
    if (gradientDirection === 'bottom') {
      return {
        background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 30%, rgba(255,255,255,0.7) 60%, rgba(255,255,255,1) 100%)'
      };
    } else {
      // Diagonal gradient from top-left to bottom-right
      return {
        background: 'linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 25%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.85) 75%, rgba(255,255,255,1) 100%)'
      };
    }
  };

  // Fix: Check for empty vehicles AFTER all hooks are called to maintain consistent hook order
  if (!gridVehicles.length) {
    console.log('AnimatedVehicleGrid: Not rendering (no vehicles)');
    return null;
  }

  console.log('AnimatedVehicleGrid: Rendering with', gridVehicles.length, 'vehicles, visibleCount:', visibleCount);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Vehicle Grid Container - Diagonal Mosaic with Row Animation */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '4px',
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: '3px',
          alignItems: 'start',
          alignContent: 'start',
          opacity: 0.25,
          transform: transform,
          transformOrigin: 'center center',
        }}
      >
        {gridVehicles.map((vehicle, index) => {
          const isVisible = index < visibleCount;
          const imageSrc = getVehicleImage(vehicle);

          // Calculate position for staggered diagonal appearance
          const row = Math.floor(index / cols);
          const col = index % cols;

          // Alternating row direction for sway
          const rowDirection = row % 2 === 0 ? 1 : -1;

          return (
            <motion.div
              key={`${vehicle.id}-${index}`}
              initial={{ opacity: 0, scale: 0.7, y: 20 }}
              animate={isVisible ? {
                opacity: 1,
                scale: 1,
                y: 0,
              } : {
                opacity: 0,
                scale: 0.7,
                y: 20
              }}
              transition={{
                duration: 0.3,
                delay: index * 0.05, // Sequential appearance
                ease: [0.4, 0, 0.2, 1],
              }}
              style={{
                opacity: isVisible ? 1 : 0,
                aspectRatio: '4/3',
                width: '100%',
                height: 'auto',
                borderRadius: '4px',
                overflow: 'hidden',
                backgroundColor: '#f3f4f6',
                margin: 0,
                padding: 0,
                display: 'block',
                lineHeight: 0,
                willChange: isVisible ? 'opacity, transform' : 'auto',
              }}
            >
              <motion.div
                animate={isVisible ? {
                  x: [0, rowDirection * 5, 0], // Whole row slides slowly
                } : false}
                transition={{
                  duration: 12 + row * 2, // Varying duration per row
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: row * 0.5, // Stagger by row
                  repeatType: "loop",
                }}
                style={{
                  willChange: isVisible ? 'transform' : 'auto',
                }}
                className="w-full h-full"
              >
                <img
                  src={imageSrc}
                  alt={vehicle.titulo}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* Gradient Overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={getGradientStyle()}
      />
    </div>
  );
};

export default AnimatedVehicleGrid;
