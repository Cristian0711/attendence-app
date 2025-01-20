import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-4 h-4 bg-black animate-pulse transform rotate-45"></div>
    </div>
  );
};

export default Loader;