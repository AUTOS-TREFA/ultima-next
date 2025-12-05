import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Loader2, UploadCloud, Image as ImageIcon, AlertTriangle, X } from 'lucide-react';
import StorageService from '../services/StorageService';

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  className?: string;
  helpText?: string;
}

const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label,
  value,
  onChange,
  folder = 'homepage',
  className = '',
  helpText
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const { publicURL } = await StorageService.uploadFile(file, folder);
      onChange(publicURL);
    } catch (err: any) {
      console.error('Error uploading image:', err);
      setError(err.message || 'Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif'] },
    multiple: false,
    disabled: uploading,
  });

  const getBorderColor = () => {
    if (isDragActive) return 'border-primary-600 bg-primary-50';
    if (error) return 'border-red-500 bg-red-50';
    if (value) return 'border-green-500';
    return 'border-gray-300 hover:border-primary-500';
  };

  const clearImage = () => {
    onChange('');
    setError(null);
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      {helpText && (
        <p className="text-xs text-gray-500 mb-2">{helpText}</p>
      )}

      {value && !uploading ? (
        <div className="relative group">
          <img
            src={value}
            alt={label}
            className="w-full h-48 object-cover rounded-lg border-2 border-green-500"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all rounded-lg flex items-center justify-center">
            <button
              onClick={clearImage}
              className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-500 truncate">
            {value}
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${getBorderColor()}`}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
              <p className="mt-2 text-sm text-gray-500">Subiendo a R2...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <p className="mt-2 text-sm text-red-700">{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-2 text-xs text-primary-600 hover:underline"
                type="button"
              >
                Intentar de nuevo
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <UploadCloud className="w-8 h-8 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">
                {isDragActive ? 'Suelta la imagen aquí' : 'Arrastra o haz clic para subir'}
              </p>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP, GIF</p>
            </div>
          )}
        </div>
      )}

      {/* URL Input as fallback */}
      <div className="mt-2">
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="O pega una URL de imagen"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
    </div>
  );
};

export default ImageUploadField;
