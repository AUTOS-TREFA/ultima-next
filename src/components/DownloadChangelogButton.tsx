import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DownloadIcon, Loader2Icon } from '@/components/icons';
import { toast } from 'sonner';

interface DownloadChangelogButtonProps {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  className?: string;
}

/**
 * Componente para descargar el changelog HTML completo
 * Solo visible para administradores
 */
const DownloadChangelogButton: React.FC<DownloadChangelogButtonProps> = ({
  variant = 'default',
  className = '',
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);

      // Fetch el archivo HTML del changelog
      const response = await fetch('/changelog.html');

      if (!response.ok) {
        throw new Error('No se pudo cargar el changelog');
      }

      const htmlContent = await response.text();

      // Crear un blob con el contenido HTML
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);

      // Crear un elemento <a> temporal para descargar
      const link = document.createElement('a');
      link.href = url;
      link.download = `changelog-trefa-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Limpiar el objeto URL
      URL.revokeObjectURL(url);

      toast.success('Changelog descargado exitosamente');
    } catch (error) {
      console.error('Error al descargar changelog:', error);
      toast.error('Error al descargar el changelog');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      variant={variant}
      className={className}
      disabled={isDownloading}
    >
      {isDownloading ? (
        <>
          <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
          Descargando...
        </>
      ) : (
        <>
          <DownloadIcon className="w-4 h-4 mr-2" />
          Descargar Changelog
        </>
      )}
    </Button>
  );
};

export default DownloadChangelogButton;
