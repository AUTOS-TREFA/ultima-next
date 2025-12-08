#!/bin/bash

# Script para migrar imágenes externas a Cloudflare R2
# Este script descarga las imágenes y las sube a R2

set -e

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔═══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Migración de Imágenes Externas a R2        ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════╝${NC}"
echo ""

# Crear directorio temporal para imágenes
TEMP_DIR="./temp-images-migration"
mkdir -p "$TEMP_DIR"

echo -e "${YELLOW}📁 Directorio temporal creado: $TEMP_DIR${NC}"
echo ""

# Lista de imágenes a descargar
declare -A images=(
    ["TREFA-San-JEronimo.jpg"]="http://5.183.8.48/wp-content/uploads/2025/02/TREFA-San-JEronimo.jpg"
    ["Reynosa.jpg"]="http://5.183.8.48/wp-content/uploads/2025/02/Reynosa.jpg"
    ["Guadalupe-2023-02-03.jpg"]="http://5.183.8.48/wp-content/uploads/2025/02/2023-02-03.jpg"
    ["Saltillo-Autos-TREFA.jpeg"]="http://5.183.8.48/wp-content/uploads/2025/02/Saltillo-Autos-TREFA.jpeg"
    ["trefa-no-encontrado.png"]="http://5.183.8.48/wp-content/uploads/2024/09/trefa-no-encontrado.png"
    ["circulos-naranjas-trefa-fondo.png"]="http://5.183.8.48/wp-content/uploads/2024/09/circulos-naranjas-trefa-fondo.png"
)

# Descargar imágenes
echo -e "${YELLOW}⬇️  Descargando imágenes...${NC}"
for filename in "${!images[@]}"; do
    url="${images[$filename]}"
    echo "  📥 Descargando: $filename"
    if curl -f -o "$TEMP_DIR/$filename" "$url" 2>/dev/null; then
        echo -e "  ${GREEN}✓${NC} $filename descargada"
    else
        echo -e "  ${RED}✗${NC} Error descargando $filename"
    fi
done

echo ""
echo -e "${GREEN}✓ Descarga completada${NC}"
echo ""

# Verificar si wrangler está instalado
if ! command -v wrangler &> /dev/null; then
    echo -e "${YELLOW}⚠️  Wrangler CLI no está instalado${NC}"
    echo ""
    echo "Para instalar Wrangler:"
    echo "  npm install -g wrangler"
    echo ""
    echo "Después de instalarlo, ejecuta:"
    echo "  wrangler login"
    echo ""
fi

# Instrucciones para subir a R2
echo -e "${YELLOW}📋 Instrucciones para subir a Cloudflare R2:${NC}"
echo ""
echo "1. Asegúrate de tener configurado Wrangler:"
echo "   wrangler login"
echo ""
echo "2. Sube las imágenes a tu bucket R2:"
echo ""
for filename in "${!images[@]}"; do
    # Determinar la ruta en R2 según el tipo de imagen
    if [[ $filename == *"TREFA"* ]] || [[ $filename == *"Reynosa"* ]] || [[ $filename == *"Saltillo"* ]] || [[ $filename == *"Guadalupe"* ]]; then
        r2_path="branches/$filename"
    else
        r2_path="app/$filename"
    fi
    echo "   wrangler r2 object put trefa-images/$r2_path --file=$TEMP_DIR/$filename"
done

echo ""
echo -e "${YELLOW}3. Verifica que las imágenes se hayan subido:${NC}"
echo "   wrangler r2 object list trefa-images"
echo ""
echo -e "${GREEN}4. Una vez subidas, ejecuta el script de actualización:${NC}"
echo "   node scripts/update-image-urls.js"
echo ""
echo -e "${YELLOW}📁 Las imágenes descargadas están en: $TEMP_DIR${NC}"
echo ""
