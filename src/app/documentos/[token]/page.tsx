'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Upload, CheckCircle, AlertCircle, FileText, X, Eye, Download } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import imageCompression from 'browser-image-compression';

interface Document {
  id: string;
  document_type: string;
  file_name: string;
  created_at: string;
  status: string;
}

interface ApplicationInfo {
  id: string;
  status: string;
  created_at: string;
  vehicle: string;
}

const REQUIRED_DOCUMENTS = [
  { id: 'INE Front', name: 'INE (Frente)', required: true },
  { id: 'INE Back', name: 'INE (Reverso)', required: true },
  { id: 'Comprobante Domicilio', name: 'Comprobante de Domicilio', required: true },
  { id: 'Comprobante Ingresos', name: 'Comprobante de Ingresos', required: true },
];

const OPTIONAL_DOCUMENTS = [
  { id: 'Constancia Fiscal', name: 'Constancia de Situación Fiscal', required: false },
];

export default function PublicDocumentUploadPage() {
  const params = useParams();
  const token = params?.token as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [application, setApplication] = useState<ApplicationInfo | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [compressing, setCompressing] = useState(false);
  const [tokenExpired, setTokenExpired] = useState(false);
  const [expirationMessage, setExpirationMessage] = useState<string>('');
  const [hasBusinessActivity, setHasBusinessActivity] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Cargar información de la aplicación y documentos
  useEffect(() => {
    loadApplicationData();
  }, [token]);

  const loadApplicationData = async () => {
    if (!token) {
      setError('Token inválido');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/public-document-upload?token=${token}`,
        {
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.expired) {
          setTokenExpired(true);
          setExpirationMessage(errorData.message || 'Este enlace ha expirado');
        }
        throw new Error(errorData.message || 'Token inválido o expirado');
      }

      const data = await response.json();
      setApplication(data.application);
      setDocuments(data.documents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar información');
    } finally {
      setLoading(false);
    }
  };

  const compressImageIfNeeded = async (file: File): Promise<File> => {
    // Solo comprimir imágenes
    if (!file.type.startsWith('image/')) {
      return file;
    }

    // Si es menor a 1MB, no comprimir
    if (file.size < 1024 * 1024) {
      return file;
    }

    setCompressing(true);
    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: file.type,
      };

      const compressedFile = await imageCompression(file, options);
      console.log('Imagen comprimida:', {
        original: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        compressed: `${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`,
      });

      return compressedFile;
    } catch (error) {
      console.error('Error al comprimir imagen:', error);
      return file;
    } finally {
      setCompressing(false);
    }
  };

  const handleFileUpload = async (documentType: string, file: File) => {
    if (!token) return;

    // Validaciones
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('El archivo es muy grande. El tamaño máximo es 10MB');
      return;
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      alert('Tipo de archivo no permitido. Solo se permiten PDF, JPG y PNG');
      return;
    }

    setUploading(documentType);
    setUploadProgress({ ...uploadProgress, [documentType]: 0 });

    try {
      // Comprimir imagen si es necesario
      const processedFile = await compressImageIfNeeded(file);

      const formData = new FormData();
      formData.append('file', processedFile);
      formData.append('document_type', documentType);

      // Simular progreso
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const current = prev[documentType] || 0;
          if (current < 90) {
            return { ...prev, [documentType]: current + 10 };
          }
          return prev;
        });
      }, 200);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/public-document-upload?token=${token}`,
        {
          method: 'POST',
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: formData,
        }
      );

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.expired) {
          setTokenExpired(true);
          setExpirationMessage(errorData.message || 'Este enlace ha expirado');
        }
        throw new Error(errorData.error || errorData.message || 'Error al subir archivo');
      }

      const result = await response.json();

      // Actualizar lista de documentos
      setDocuments([...documents, result.document]);
      setUploadProgress({ ...uploadProgress, [documentType]: 100 });

      // Limpiar input
      if (fileInputRefs.current[documentType]) {
        fileInputRefs.current[documentType]!.value = '';
      }

      // Mostrar éxito brevemente
      setTimeout(() => {
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[documentType];
          return newProgress;
        });
      }, 2000);

    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al subir archivo');
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[documentType];
        return newProgress;
      });
    } finally {
      setUploading(null);
    }
  };

  const handleFileSelect = async (documentType: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !token) return;
    await handleFileUpload(documentType, file);
  };

  const getDocumentStatus = (docType: string) => {
    const doc = documents.find(d => d.document_type === docType);
    return doc ? { uploaded: true, fileName: doc.file_name, uploadedAt: doc.created_at, doc } : { uploaded: false, fileName: null, uploadedAt: null, doc: null };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          {/* Animación sutil de carga */}
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Upload className="w-8 h-8 text-primary" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
            tokenExpired ? 'bg-yellow-100' : 'bg-red-100'
          }`}>
            <AlertCircle className={`w-10 h-10 ${tokenExpired ? 'text-yellow-600' : 'text-red-600'}`} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {tokenExpired ? '⏰ Enlace Expirado' : 'Acceso Denegado'}
          </h1>
          <p className="text-gray-600 mb-4">{error}</p>

          {tokenExpired && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>¿Qué hacer?</strong><br/>
                Contacta a tu asesor de TREFA para que reactive el enlace y puedas continuar subiendo tus documentos.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const allDocsToCheck = hasBusinessActivity
    ? [...REQUIRED_DOCUMENTS, ...OPTIONAL_DOCUMENTS]
    : REQUIRED_DOCUMENTS;
  const uploadedCount = allDocsToCheck.filter(doc => getDocumentStatus(doc.id).uploaded).length;
  const progress = (uploadedCount / allDocsToCheck.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Header con logo TREFA */}
      <div className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <img src="/images/trefalogo.png" alt="TREFA Logo" className="h-8" />
          <div className="text-right">
            <p className="text-xs text-muted-foreground font-mono">ID: {application?.id.slice(0, 8)}</p>
            <p className="text-sm font-semibold text-primary">{application?.vehicle}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header con animación pulsante cuando está esperando documentos */}
        <div className="text-center mb-8">
          <div className="relative w-24 h-24 mx-auto mb-4">
            {uploadedCount < REQUIRED_DOCUMENTS.length && (
              <>
                {/* Ondas pulsantes sutiles */}
                <div className="absolute inset-0 rounded-full bg-primary/15 animate-ping" style={{ animationDuration: '2s' }}></div>
                <div className="absolute inset-2 rounded-full bg-primary/10 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.3s' }}></div>
              </>
            )}
            <div className="absolute inset-0 rounded-full bg-primary flex items-center justify-center">
              <Upload className="w-10 h-10 text-primary-foreground" />
            </div>
          </div>

          <h1 className="text-2xl font-bold tracking-tight mb-2">Carga de Documentos</h1>
          <p className="text-muted-foreground">
            {uploadedCount === 0
              ? 'Esperando archivos...'
              : uploadedCount < allDocsToCheck.length
              ? 'Sube los documentos faltantes'
              : '¡Todos los documentos recibidos!'}
          </p>

          {/* Barra de progreso */}
          <div className="max-w-md mx-auto mt-6">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>Progreso</span>
              <span className="font-medium">{uploadedCount} de {allDocsToCheck.length}</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Mensaje de compresión */}
        {compressing && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg text-center">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Comprimiendo imagen...
            </p>
          </div>
        )}

        {/* Lista de documentos requeridos */}
        <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
          <div className="p-6 border-b bg-muted/50">
            <h2 className="text-lg font-semibold flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Documentos Requeridos
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Los siguientes documentos son necesarios para procesar tu solicitud
            </p>
          </div>

          <div className="p-6">
            {/* Grid layout para documentos requeridos - 4 columnas en desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {REQUIRED_DOCUMENTS.map((doc) => {
                const status = getDocumentStatus(doc.id);
                const isUploading = uploading === doc.id;
                const currentProgress = uploadProgress[doc.id];

                return (
                  <DocumentDropzone
                    key={doc.id}
                    doc={doc}
                    status={status}
                    isUploading={isUploading}
                    currentProgress={currentProgress}
                    onFileSelect={(file) => handleFileUpload(doc.id, file)}
                    fileInputRef={(el) => fileInputRefs.current[doc.id] = el}
                    tokenExpired={tokenExpired}
                  />
                );
              })}
            </div>

            {/* Checkbox para persona con actividad empresarial */}
            <div className="mb-4 p-4 bg-muted/30 rounded-lg border">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasBusinessActivity}
                  onChange={(e) => setHasBusinessActivity(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium">
                  Soy persona con actividad empresarial
                </span>
              </label>
              <p className="text-xs text-muted-foreground mt-2 ml-8">
                Selecciona esta opción si eres persona física con actividad empresarial para habilitar la carga de la Constancia de Situación Fiscal
              </p>
            </div>

            {/* Documento opcional: Constancia de Situación Fiscal */}
            {hasBusinessActivity && (
              <div className="space-y-4">
                {OPTIONAL_DOCUMENTS.map((doc) => {
                  const status = getDocumentStatus(doc.id);
                  const isUploading = uploading === doc.id;
                  const currentProgress = uploadProgress[doc.id];

                  return (
                    <DocumentDropzone
                      key={doc.id}
                      doc={doc}
                      status={status}
                      isUploading={isUploading}
                      currentProgress={currentProgress}
                      onFileSelect={(file) => handleFileUpload(doc.id, file)}
                      fileInputRef={(el) => fileInputRefs.current[doc.id] = el}
                      tokenExpired={tokenExpired}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Información de seguridad */}
          <div className="p-6 bg-muted/30 border-t">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Información Segura</h3>
                <p className="text-sm text-muted-foreground">
                  Todos tus documentos se almacenan de forma segura y encriptada. Solo el personal autorizado de TREFA podrá acceder a ellos.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Formatos aceptados: PDF, JPG, PNG • Tamaño máximo: 10MB por archivo
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Las imágenes grandes se comprimen automáticamente
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mensaje de completado */}
        {uploadedCount === allDocsToCheck.length && uploadedCount > 0 && (
          <div className="mt-6 bg-green-500 dark:bg-green-600 rounded-lg border shadow-sm p-6 text-white">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">¡Documentos Completos!</h3>
              <p className="text-white/90 text-sm">
                Todos los documentos han sido recibidos correctamente. Nos pondremos en contacto contigo pronto.
              </p>
            </div>

            {/* Lista de documentos subidos */}
            <div className="bg-white/10 rounded-lg p-4 mb-6">
              <h4 className="font-semibold mb-3 text-sm">Documentos recibidos:</h4>
              <div className="space-y-2">
                {allDocsToCheck.map((doc) => {
                  const status = getDocumentStatus(doc.id);
                  if (!status.uploaded) return null;
                  return (
                    <div key={doc.id} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1">{doc.name}</span>
                      {status.fileName && (
                        <span className="text-xs text-white/70 truncate max-w-[150px]">
                          {status.fileName}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="text-center">
              <Link
                href={`/escritorio/seguimiento/${application?.id}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-green-600 font-semibold rounded-lg hover:bg-green-50 transition-colors"
              >
                Ver mi solicitud
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>© 2025 Autos TREFA • Todos los derechos reservados</p>
        </div>
      </div>
    </div>
  );
}

// Componente DocumentDropzone con drag & drop
interface DocumentDropzoneProps {
  doc: { id: string; name: string; required: boolean };
  status: { uploaded: boolean; fileName: string | null; uploadedAt: string | null; doc: Document | null };
  isUploading: boolean;
  currentProgress?: number;
  onFileSelect: (file: File) => void;
  fileInputRef: (el: HTMLInputElement | null) => void;
  tokenExpired: boolean;
}

const DocumentDropzone: React.FC<DocumentDropzoneProps> = ({
  doc,
  status,
  isUploading,
  currentProgress,
  onFileSelect,
  fileInputRef,
  tokenExpired,
}) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxFiles: 1,
    disabled: status.uploaded || isUploading || tokenExpired,
  });

  return (
    <div
      className={`border-2 rounded-lg p-4 transition-all ${
        status.uploaded
          ? 'border-green-500/50 bg-green-50 dark:bg-green-950/20'
          : isDragActive
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50 bg-card'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          {status.uploaded ? (
            <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-muted-foreground" />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-sm">{doc.name}</h3>
            {status.uploaded && (
              <p className="text-xs text-green-600 dark:text-green-400">Subido correctamente</p>
            )}
          </div>
        </div>
      </div>

      {status.uploaded && status.fileName && (
        <div className="mb-3 p-3 bg-background rounded-lg border space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-foreground truncate flex-1">{status.fileName}</p>
          </div>
          {status.uploadedAt && (
            <div className="flex items-center text-xs text-muted-foreground">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {new Date(status.uploadedAt).toLocaleDateString('es-MX', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          )}
        </div>
      )}

      {!status.uploaded && (
        <div>
          <div {...getRootProps()}>
            <input {...getInputProps()} ref={fileInputRef} />
            <div
              className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-all ${
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50'
              } ${isUploading || tokenExpired ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Upload className={`w-10 h-10 mx-auto mb-2 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
              {isDragActive ? (
                <p className="text-sm font-medium text-primary">Suelta el archivo aquí</p>
              ) : isUploading ? (
                <p className="text-sm text-muted-foreground">Subiendo...</p>
              ) : tokenExpired ? (
                <p className="text-sm text-muted-foreground">Enlace expirado</p>
              ) : (
                <>
                  <p className="text-sm font-medium">
                    Arrástralos o haz click para cargarlos
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, JPG o PNG (máx. 10MB)</p>
                </>
              )}
            </div>
          </div>

          {/* Botón alternativo para seleccionar archivo */}
          {!isUploading && !tokenExpired && (
            <div className="mt-3">
              <input
                type="file"
                id={`file-input-${doc.id}`}
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onFileSelect(file);
                }}
                className="hidden"
              />
              <label
                htmlFor={`file-input-${doc.id}`}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-primary text-white rounded-lg cursor-pointer hover:bg-primary/90 transition-colors font-medium text-sm"
              >
                <Upload className="w-4 h-4" />
                Seleccionar Archivo
              </label>
            </div>
          )}
        </div>
      )}

      {isUploading && currentProgress !== undefined && (
        <div className="mt-3">
          <div className="w-full bg-secondary rounded-full h-1.5">
            <div
              className="bg-primary h-1.5 rounded-full transition-all"
              style={{ width: `${currentProgress}%` }}
            ></div>
          </div>
          <p className="text-xs text-muted-foreground mt-1 text-center">{currentProgress}%</p>
        </div>
      )}
    </div>
  );
};
