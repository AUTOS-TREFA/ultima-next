'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { WhatsAppIcon, HeartIcon, SolidHeartIcon } from '../icons';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface VehicleCardActionsProps {
  isSeparado: boolean;
  ordencompra?: string;
  whatsappUrl: string;
  onToggleFavorite: (e: React.MouseEvent) => Promise<void>;
  isFavorite: boolean;
  marca?: string;
  carroceria?: string;
  precio?: number;
  vehicleTitle?: string;
  vehicleSlug?: string;
}

const VehicleCardActions: React.FC<VehicleCardActionsProps> = ({
  isSeparado,
  ordencompra,
  whatsappUrl,
  onToggleFavorite,
  isFavorite,
  marca,
  carroceria,
  precio,
  vehicleTitle,
  vehicleSlug,
}) => {
  const { session } = useAuth();
  const router = useRouter();

  const shareUrl = vehicleSlug ? `${window.location.origin}/autos/${vehicleSlug}` : window.location.href;
  const shareText = vehicleTitle ? `Mira este auto: ${vehicleTitle}` : 'Mira este auto en TREFA';

  const handleFinancingClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSeparado) return;

    if (session) {
      const urlWithParams = ordencompra ? `/escritorio/aplicacion?ordencompra=${ordencompra}` : '/escritorio/aplicacion';
      router.push(urlWithParams);
    } else {
      const redirectPath = ordencompra ? `/escritorio/aplicacion?ordencompra=${ordencompra}` : '/escritorio/aplicacion';
      localStorage.setItem('loginRedirect', redirectPath);
      const loginUrl = ordencompra ? `/acceder?ordencompra=${ordencompra}` : '/acceder';
      router.push(loginUrl);
    }
  };

  const handleSimilarVehiclesClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const params = new URLSearchParams();

    if (marca) {
      params.append('marca', marca);
    }

    if (carroceria) {
      params.append('carroceria', carroceria);
    }

    if (precio) {
      // Set price range to ±20% of current price
      const minPrice = Math.round(precio * 0.8);
      const maxPrice = Math.round(precio * 1.2);
      params.append('preciomin', minPrice.toString());
      params.append('preciomax', maxPrice.toString());
    }

    const url = `/autos${params.toString() ? `?${params.toString()}` : ''}`;
    router.push(url);
  };

  const handleShareWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
    window.open(whatsappShareUrl, '_blank');
  };

  const handleShareFacebook = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(facebookShareUrl, '_blank');
  };

  const handleShareEmail = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const emailSubject = encodeURIComponent(shareText);
    const emailBody = encodeURIComponent(`${shareText}\n\n${shareUrl}`);
    window.location.href = `mailto:?subject=${emailSubject}&body=${emailBody}`;
  };

  return (
    <div className="flex flex-col gap-2 relative z-30">
      <div className="flex items-center gap-2">
        <Button
          onClick={handleFinancingClick}
          disabled={isSeparado}
          data-gtm-id="card-list-finance"
          size="default"
          className="px-6 md:px-7 text-sm md:text-base"
        >
          Financiar
        </Button>
        <Button
          asChild
          size="icon"
          data-gtm-id="card-list-whatsapp"
          className="bg-green-500 hover:bg-green-600 text-white"
        >
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Contactar por WhatsApp"
          >
            <WhatsAppIcon className="w-5 h-5" />
          </a>
        </Button>
        <Button
          onClick={onToggleFavorite}
          data-gtm-id="card-list-favorite"
          variant="outline"
          size="icon"
          className="hover:bg-red-100 hover:text-red-500 relative z-10"
          aria-label="Añadir a favoritos"
        >
          {isFavorite ? <SolidHeartIcon className="w-5 h-5 text-red-500" /> : <HeartIcon className="w-5 h-5" />}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              data-gtm-id="card-list-share"
              variant="outline"
              size="icon"
              className="hover:bg-blue-100 hover:text-blue-600"
              aria-label="Compartir"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
              </svg>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="z-50">
            <DropdownMenuItem onClick={handleShareWhatsApp}>
              <WhatsAppIcon className="w-4 h-4 mr-2" />
              WhatsApp
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleShareFacebook}>
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleShareEmail}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isSeparado && (
        <Button
          onClick={handleSimilarVehiclesClick}
          data-gtm-id="card-list-similar-vehicles"
          className="w-full bg-[#FF6801] hover:bg-[#E55E01] text-white"
          size="default"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          Ver autos similares
        </Button>
      )}
    </div>
  );
};

export default VehicleCardActions;