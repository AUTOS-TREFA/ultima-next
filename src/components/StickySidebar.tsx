import React, { useState, useEffect } from 'react';

interface StickySidebarProps {
  children: React.ReactNode;
  topOffset?: number;
}

const StickySidebar: React.FC<StickySidebarProps> = ({ children, topOffset = 24 }) => {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('down');
  const [lastScrollY, setLastScrollY] = useState(0);

  // Detect scroll direction for potential future enhancements
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY) {
        setScrollDirection('down');
      } else {
        setScrollDirection('up');
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <div
      style={{
        position: 'sticky',
        top: `${topOffset}px`,
        alignSelf: 'flex-start',
        height: 'fit-content',
        maxHeight: `calc(100vh - ${topOffset}px - 24px)`,
        overflowY: 'auto',
        overflowX: 'hidden',
        zIndex: 10,
      }}
      className="will-change-transform scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 transition-all duration-200"
    >
      {children}
    </div>
  );
};

export default StickySidebar;
