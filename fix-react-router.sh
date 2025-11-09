#!/bin/bash

# Script to fix react-router-dom imports and convert to Next.js Link
# Usage: ./fix-react-router.sh

FILES=$(grep -rl "from 'react-router-dom'" /home/user/ultima-next/src/pages --include="*.tsx" --include="*.ts" | grep -v ".backup")

for file in $FILES; do
    echo "Processing: $file"

    # Create backup
    cp "$file" "$file.bak"

    # Check if file already has 'use client'
    if ! grep -q "^'use client'" "$file"; then
        # Add 'use client' at the beginning if it's not there
        sed -i "1i'use client';\n" "$file"
    fi

    # Replace react-router-dom Link import with next/link
    sed -i "s/import { Link } from 'react-router-dom';/import Link from 'next\/link';/g" "$file"
    sed -i "s/import { Link, useNavigate } from 'react-router-dom';/import Link from 'next\/link';\nimport { useRouter } from 'next\/navigation';/g" "$file"
    sed -i "s/import { useNavigate } from 'react-router-dom';/import { useRouter } from 'next\/navigation';/g" "$file"
    sed -i "s/import { useLocation } from 'react-router-dom';/import { usePathname } from 'next\/navigation';/g" "$file"
    sed -i "s/import { useParams } from 'react-router-dom';/import { useParams } from 'next\/navigation';/g" "$file"

    # Remove useSEO import
    sed -i "/import useSEO from/d" "$file"

    # Comment out useSEO calls (multi-line aware)
    # This is tricky with sed, so we'll use perl instead
    perl -i -0pe 's/useSEO\(\{[^}]*\}\);/\/\/ SEO metadata is handled in the page.tsx file in Next.js/gs' "$file"

    # Replace to= with href= in Link components
    sed -i 's/to="/href="/g' "$file"
    sed -i "s/to='/href='/g" "$file"
    sed -i 's/to={/href={/g' "$file"

    # Replace useNavigate with useRouter
    sed -i 's/const navigate = useNavigate();/const router = useRouter();/g' "$file"
    sed -i 's/navigate(/router.push(/g' "$file"

    # Replace useLocation with usePathname
    sed -i 's/const location = useLocation();/const pathname = usePathname();/g' "$file"
    sed -i 's/location.pathname/pathname/g' "$file"

    echo "Fixed: $file"
done

echo "Done! Processed ${#FILES[@]} files"
echo "Backups saved with .bak extension"
