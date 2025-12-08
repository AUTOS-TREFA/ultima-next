#!/bin/bash

# Script simple para descargar imágenes externas

set -e

# Crear directorio
mkdir -p temp-images-migration/branches
mkdir -p temp-images-migration/app

echo "📥 Descargando imágenes de sucursales..."

curl -L --insecure -o temp-images-migration/branches/TREFA-San-JEronimo.jpg "http://5.183.8.48/wp-content/uploads/2025/02/TREFA-San-JEronimo.jpg"
echo "✓ TREFA-San-JEronimo.jpg"

curl -L --insecure -o temp-images-migration/branches/Reynosa.jpg "http://5.183.8.48/wp-content/uploads/2025/02/Reynosa.jpg"
echo "✓ Reynosa.jpg"

curl -L --insecure -o temp-images-migration/branches/Guadalupe-2023-02-03.jpg "http://5.183.8.48/wp-content/uploads/2025/02/2023-02-03.jpg"
echo "✓ Guadalupe-2023-02-03.jpg"

curl -L --insecure -o temp-images-migration/branches/Saltillo-Autos-TREFA.jpeg "http://5.183.8.48/wp-content/uploads/2025/02/Saltillo-Autos-TREFA.jpeg"
echo "✓ Saltillo-Autos-TREFA.jpeg"

echo ""
echo "📥 Descargando imágenes de la aplicación..."

curl -L --insecure -o temp-images-migration/app/trefa-no-encontrado.png "http://5.183.8.48/wp-content/uploads/2024/09/trefa-no-encontrado.png"
echo "✓ trefa-no-encontrado.png"

curl -L --insecure -o temp-images-migration/app/circulos-naranjas-trefa-fondo.png "http://5.183.8.48/wp-content/uploads/2024/09/circulos-naranjas-trefa-fondo.png"
echo "✓ circulos-naranjas-trefa-fondo.png"

echo ""
echo "✅ Todas las imágenes descargadas en: ./temp-images-migration"
echo ""
echo "📤 Para subir a Cloudflare R2, ejecuta:"
echo ""
echo "# Sucursales"
echo "wrangler r2 object put trefa-images/branches/TREFA-San-JEronimo.jpg --file=temp-images-migration/branches/TREFA-San-JEronimo.jpg"
echo "wrangler r2 object put trefa-images/branches/Reynosa.jpg --file=temp-images-migration/branches/Reynosa.jpg"
echo "wrangler r2 object put trefa-images/branches/Guadalupe-2023-02-03.jpg --file=temp-images-migration/branches/Guadalupe-2023-02-03.jpg"
echo "wrangler r2 object put trefa-images/branches/Saltillo-Autos-TREFA.jpeg --file=temp-images-migration/branches/Saltillo-Autos-TREFA.jpeg"
echo ""
echo "# App"
echo "wrangler r2 object put trefa-images/app/trefa-no-encontrado.png --file=temp-images-migration/app/trefa-no-encontrado.png"
echo "wrangler r2 object put trefa-images/app/circulos-naranjas-trefa-fondo.png --file=temp-images-migration/app/circulos-naranjas-trefa-fondo.png"
echo ""
echo "Después de subirlas, actualiza las URLs en el código con:"
echo "node scripts/update-image-urls.js"
echo ""
