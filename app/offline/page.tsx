'use client';

/**
 * Página Offline
 *
 * Se muestra cuando el usuario está sin conexión y
 * la página solicitada no está en cache.
 */

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 px-4">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="mx-auto w-24 h-24 mb-8 text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-full h-full"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 3l18 18"
              className="stroke-red-500"
              strokeWidth={2}
            />
          </svg>
        </div>

        {/* Content */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Sin conexion a internet
        </h1>

        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Parece que no tienes conexion a internet. Por favor, verifica tu conexion e intenta de nuevo.
        </p>

        {/* Actions */}
        <div className="space-y-4">
          <button
            onClick={() => window.location.reload()}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            Reintentar
          </button>

          <button
            onClick={() => window.history.back()}
            className="w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium rounded-lg transition-colors duration-200"
          >
            Volver atras
          </button>
        </div>

        {/* Tips */}
        <div className="mt-12 text-left bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Consejos:
          </h2>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>Verifica que tu WiFi o datos moviles esten activos</li>
            <li>Intenta acercarte a tu router</li>
            <li>Reinicia tu router o dispositivo</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
