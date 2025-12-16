import React, { useState } from 'react';
import { Link2, Copy, CheckCircle, QrCode, ExternalLink } from 'lucide-react';
import QRCode from 'qrcode';
import { getSiteUrl } from '@/config';

interface PublicUploadLinkCardProps {
  token: string;
  compact?: boolean;
}

const PublicUploadLinkCard: React.FC<PublicUploadLinkCardProps> = ({ token, compact = false }) => {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const publicUrl = `${getSiteUrl()}/documentos/${token}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  const handleShowQR = async () => {
    if (!qrDataUrl) {
      try {
        const dataUrl = await QRCode.toDataURL(publicUrl, {
          width: 300,
          margin: 2,
          color: {
            dark: '#1e40af', // primary-700
            light: '#ffffff',
          },
        });
        setQrDataUrl(dataUrl);
      } catch (err) {
        console.error('Error generando QR:', err);
      }
    }
    setShowQR(!showQR);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-3 bg-primary-50 border border-primary-200 rounded-lg">
        <Link2 className="w-4 h-4 text-primary-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-primary-900 truncate">
            {publicUrl}
          </p>
        </div>
        <button
          onClick={handleCopy}
          className="p-2 hover:bg-primary-100 rounded transition-colors flex-shrink-0"
          title="Copiar enlace"
        >
          {copied ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : (
            <Copy className="w-4 h-4 text-primary-600" />
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Header - Compact */}
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 bg-primary-50 rounded-lg">
          <Link2 className="w-4 h-4 text-primary-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900">
            Tu liga privada para cargar documentos
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Solo para carga segura - Sin acceso a tus datos personales
          </p>
        </div>
      </div>

      {/* URL Display - Sleek */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-2.5 mb-3">
        <div className="flex items-center gap-2">
          <p className="text-xs text-gray-600 font-mono truncate flex-1">
            {publicUrl}
          </p>
          <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
            title="Copiar enlace"
          >
            {copied ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Action Buttons - Modern & Compact */}
      <div className="flex gap-2">
        <button
          onClick={handleShowQR}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-xs font-medium text-gray-700 transition-colors"
        >
          <QrCode className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{showQR ? 'Ocultar' : 'Mostrar'} QR</span>
          <span className="sm:hidden">QR</span>
        </button>
        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-xs font-medium transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Abrir Liga</span>
          <span className="sm:hidden">Abrir</span>
        </a>
      </div>

      {/* QR Code Display - Compact */}
      {showQR && qrDataUrl && (
        <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-md">
          <p className="text-xs text-gray-600 font-medium mb-2 text-center">
            Escanea para acceder desde móvil
          </p>
          <img src={qrDataUrl} alt="QR Code" className="mx-auto w-32 h-32 rounded" />
        </div>
      )}
    </div>
  );
};

export default PublicUploadLinkCard;
