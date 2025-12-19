import React from 'react';

const AnimatedBlobs: React.FC = () => {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute top-1/4 -left-24 w-72 h-72 bg-blue-500/10 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob"></div>
      <div className="absolute top-1/2 -right-24 w-72 h-72 bg-gray-400/10 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-trefa-blue/10 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob animation-delay-4000"></div>
    </div>
  );
};

export default AnimatedBlobs;
