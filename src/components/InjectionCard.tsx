import React from 'react';
import Link from 'next/link';

const FinanciamientoCard = () => {
  return (
    <Link
      href="/acceder"
      className="block w-full h-full relative rounded-2xl overflow-hidden transition-transform duration-200 hover:scale-[1.02] no-underline"
    >
      <img
        src="https://res.cloudinary.com/drznoiotp/image/upload/v1761702104/Frame_40_2_yagqiu.png"
        alt="Financiamiento"
        className="absolute top-0 left-0 w-full h-full object-cover"
      />
      <div className="absolute top-0 left-0 p-5 z-10">
        <h2 className="text-black text-2xl leading-tight m-0 p-2 font-black">
          Financiamiento
          <span className="block mt-2 text-base font-light">
            100% en línea. Comienza aquí
          </span>
        </h2>
      </div>
    </Link>
  );
};

export default FinanciamientoCard;
