#!/bin/bash

# Script para subir imágenes descargadas a Cloudflare R2
# Ejecutar después de descargar las imágenes con download-external-images.sh

set -e

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔═══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║      Subida de Imágenes a Cloudflare R2      ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════╝${NC}"
echo ""

# Verificar que wrangler está instalado
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ Error: Wrangler CLI no está instalado${NC}"
    echo ""
    echo "Para instalar Wrangler:"
    echo "  npm install -g wrangler"
    echo ""
    echo "Después de instalarlo, ejecuta:"
    echo "  wrangler login"
    echo ""
    exit 1
fi

# Verificar que el directorio de imágenes existe
if [ ! -d "temp-images-migration" ]; then
    echo -e "${RED}❌ Error: No se encontró el directorio temp-images-migration${NC}"
    echo "Ejecuta primero: bash scripts/download-external-images.sh"
    exit 1
fi

echo -e "${YELLOW}📤 Subiendo imágenes de sucursales a R2...${NC}"
echo ""

# Función para subir un archivo
upload_image() {
    local file=$1
    local r2_path=$2
    local filename=$(basename "$file")

    if [ ! -f "$file" ]; then
        echo -e "${RED}  ✗ Archivo no encontrado: $filename${NC}"
        return 1
    fi

    # Verificar que no sea un archivo HTML (error de descarga)
    if file "$file" | grep -q "HTML"; then
        echo -e "${RED}  ✗ $filename es un archivo HTML (descarga fallida), omitiendo...${NC}"
        return 1
    fi

    echo -e "  📤 Subiendo: $filename"

    # Usar --remote para subir a Cloudflare R2 (no local)
    # Usar el account_id de cloudflare-workers/wrangler.toml
    output=$(CLOUDFLARE_ACCOUNT_ID=a5de5a4fb11ab70d53e850749ece3cf7 wrangler r2 object put "$r2_path" --file="$file" --remote 2>&1)

    if echo "$output" | grep -q "Upload complete\|success\|uploaded\|Created"; then
        echo -e "${GREEN}  ✓ $filename subida correctamente${NC}"
        return 0
    else
        echo -e "${RED}  ✗ Error subiendo $filename${NC}"
        echo -e "${RED}     Error: $output${NC}"
        return 1
    fi
}

# Contador de éxitos y fallos
success_count=0
fail_count=0

# Subir imágenes de sucursales
echo "Sucursales:"
for img in temp-images-migration/branches/*; do
    if [ -f "$img" ]; then
        filename=$(basename "$img")
        if upload_image "$img" "trefa-images/branches/$filename"; then
            ((success_count++))
        else
            ((fail_count++))
        fi
    fi
done

echo ""
echo "App:"
for img in temp-images-migration/app/*; do
    if [ -f "$img" ]; then
        filename=$(basename "$img")
        if upload_image "$img" "trefa-images/app/$filename"; then
            ((success_count++))
        else
            ((fail_count++))
        fi
    fi
done

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              Resumen de Subida                ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "✅ Subidas exitosas: ${GREEN}$success_count${NC}"
if [ $fail_count -gt 0 ]; then
    echo -e "❌ Fallos: ${RED}$fail_count${NC}"
fi
echo ""

if [ $success_count -gt 0 ]; then
    echo -e "${YELLOW}📋 Próximos pasos:${NC}"
    echo ""
    echo "1. Verifica que las imágenes se subieron correctamente:"
    echo "   wrangler r2 object list trefa-images"
    echo ""
    echo "2. Actualiza las URLs en el código:"
    echo "   node scripts/update-image-urls.js"
    echo ""
    echo "3. Verifica que las imágenes se vean correctamente en tu sitio"
    echo ""
    echo "4. Haz commit de los cambios:"
    echo "   git add ."
    echo "   git commit -m \"feat: Migrar imágenes de sucursales a Cloudflare R2\""
    echo ""
fi
