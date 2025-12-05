import React from 'react';
import { Link } from 'react-router-dom';

const TrefaHeroHeader: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center">
            <img
              src="/images/trefalogo.png"
              alt="TREFA Logo"
              className="h-10 w-auto"
            />
          </Link>
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/autos"
              className="text-gray-700 hover:text-primary transition-colors font-medium"
            >
              Inventario
            </Link>
            <Link
              to="/financiamientos"
              className="text-gray-700 hover:text-primary transition-colors font-medium"
            >
              Financiamiento
            </Link>
            <Link
              to="/kit-trefa"
              className="text-gray-700 hover:text-primary transition-colors font-medium"
            >
              Kit TREFA
            </Link>
            <Link
              to="/acceder"
              className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors font-semibold"
            >
              Acceder
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default TrefaHeroHeader;
