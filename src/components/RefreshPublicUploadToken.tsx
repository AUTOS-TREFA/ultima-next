import React, { useState } from 'react';
import { RefreshCw, Clock, Link2, Copy, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import PublicUploadLinkCard from './PublicUploadLinkCard';

interface RefreshPublicUploadTokenProps {
  applicationId: string;
  currentToken?: string;
  tokenExpiresAt?: string | null;
  onTokenRefreshed?: (newToken: string, expiresAt: string) => void;
}

const RefreshPublicUploadToken: React.FC<RefreshPublicUploadTokenProps> = ({
  applicationId,
  currentToken,
  tokenExpiresAt,
  onTokenRefreshed,
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [newExpiresAt, setNewExpiresAt] = useState<string | null>(null);

  const isExpired = tokenExpiresAt ? new Date(tokenExpiresAt) < new Date() : false;
  const daysUntilExpiration = tokenExpiresAt
    ? Math.ceil((new Date(tokenExpiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const handleRefreshToken = async () => {
    setRefreshing(true);
    setError(null);
    setSuccess(false);

    try {
      const { data, error: rpcError } = await supabase.rpc('regenerate_public_upload_token', {
        application_id_param: applicationId,
      });

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      if (data && data.length > 0) {
        const { new_token, expires_at } = data[0];
        setNewToken(new_token);
        setNewExpiresAt(expires_at);
        setSuccess(true);

        if (onTokenRefreshed) {
          onTokenRefreshed(new_token, expires_at);
        }

        // Limpiar mensaje de éxito después de 5 segundos
        setTimeout(() => {
          setSuccess(false);
        }, 5000);
      }
    } catch (err) {
      console.error('Error regenerando token:', err);
      setError(err instanceof Error ? err.message : 'Error al regenerar token');
    } finally {
      setRefreshing(false);
    }
  };

  const displayToken = newToken || currentToken;
  const displayExpiresAt = newExpiresAt || tokenExpiresAt;

  return (
    <div className="space-y-4">
      {/* Estado del token */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Link2 className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Estado del Dropzone Público</h3>
          </div>

          {isExpired ? (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
              <AlertCircle className="w-3 h-3 mr-1" />
              Expirado
            </span>
          ) : daysUntilExpiration !== null && daysUntilExpiration <= 1 ? (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
              <Clock className="w-3 h-3 mr-1" />
              Expira pronto
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
              <CheckCircle className="w-3 h-3 mr-1" />
              Activo
            </span>
          )}
        </div>

        {displayExpiresAt && (
          <div className="flex items-center text-sm text-gray-600 mb-3">
            <Clock className="w-4 h-4 mr-2" />
            {isExpired ? (
              <span className="text-red-600 font-medium">
                Expiró el {new Date(displayExpiresAt).toLocaleDateString('es-MX', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            ) : (
              <span>
                Expira el {new Date(displayExpiresAt).toLocaleDateString('es-MX', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
                {daysUntilExpiration !== null && (
                  <span className={`ml-2 font-medium ${daysUntilExpiration <= 1 ? 'text-yellow-600' : 'text-gray-700'}`}>
                    ({daysUntilExpiration} {daysUntilExpiration === 1 ? 'día' : 'días'} restantes)
                  </span>
                )}
              </span>
            )}
          </div>
        )}

        {/* Botón de refrescar */}
        <button
          onClick={handleRefreshToken}
          disabled={refreshing}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
            refreshing
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-primary-600 hover:bg-primary-700 text-white'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Regenerando...' : isExpired ? 'Reactivar Dropzone' : 'Renovar Token (3 días más)'}
        </button>

        {/* Mensajes */}
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700 font-medium">
              ✓ Token renovado exitosamente. El dropzone estará activo por 3 días más.
            </p>
          </div>
        )}
      </div>

      {/* Link público */}
      {displayToken && (
        <PublicUploadLinkCard token={displayToken} />
      )}

      {/* Información */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-blue-900">Sobre el Dropzone Público</p>
            <ul className="text-xs text-blue-700 mt-2 space-y-1">
              <li>• Los tokens expiran automáticamente después de 3 días</li>
              <li>• Puedes renovar el token en cualquier momento</li>
              <li>• El cliente podrá subir documentos mientras el token esté activo</li>
              <li>• Los documentos quedan vinculados a la solicitud permanentemente</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefreshPublicUploadToken;
