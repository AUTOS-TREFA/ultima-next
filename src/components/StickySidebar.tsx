import React from 'react';

interface StickySidebarProps {
  children: React.ReactNode;
  topOffset?: number;
}

const StickySidebar: React.FC<StickySidebarProps> = ({ children, topOffset = 16 }) => {
  return (
    <div
      style={{
        position: 'sticky',
        top: `${topOffset}px`,
        alignSelf: 'flex-start',
        maxHeight: `calc(100vh - ${topOffset}px - 32px)`,
        overflowY: 'auto',
        overflowX: 'hidden',
        zIndex: 10,
      }}
      className="will-change-transform scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400"
    >
      {children}
    </div>
  );
};

export default StickySidebar;
