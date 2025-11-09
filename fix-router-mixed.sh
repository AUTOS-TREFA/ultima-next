#!/bin/bash

# Fix files with mixed react-router-dom imports

FILES="/home/user/ultima-next/src/pages/AdminClientProfilePage.tsx
/home/user/ultima-next/src/pages/AdminInspectionPage.tsx
/home/user/ultima-next/src/pages/AdminLoginPage.tsx
/home/user/ultima-next/src/pages/Application.tsx
/home/user/ultima-next/src/pages/AuthPage.tsx
/home/user/ultima-next/src/pages/AutosConOfertaPage.tsx
/home/user/ultima-next/src/pages/FinanciamientosPage.tsx
/home/user/ultima-next/src/pages/MarketingCategoryPage.tsx
/home/user/ultima-next/src/pages/PerfilacionBancariaPage.tsx
/home/user/ultima-next/src/pages/SalesClientProfilePage.tsx
/home/user/ultima-next/src/pages/SeguimientoPage.tsx
/home/user/ultima-next/src/pages/Solicitudes.tsx
/home/user/ultima-next/src/pages/VacancyDetailPage.tsx
/home/user/ultima-next/src/pages/VehicleDetailPage.tsx
/home/user/ultima-next/src/pages/VehicleForSaleDetailPage.tsx"

for file in $FILES; do
    echo "Processing: $file"

    # Use Python for more complex text manipulation
    python3 << 'PYTHON_SCRIPT' "$file"
import sys
import re

filename = sys.argv[1]

with open(filename, 'r') as f:
    content = f.read()

# Extract imports from react-router-dom
router_import_match = re.search(r"import\s+{([^}]+)}\s+from\s+['\"]react-router-dom['\"];", content)

if router_import_match:
    imports = [imp.strip() for imp in router_import_match.group(1).split(',')]

    # Separate Link from other imports
    link_present = 'Link' in imports
    other_imports = [imp for imp in imports if imp != 'Link']

    # Build new import statements
    new_imports = []

    # Next.js navigation imports
    next_nav_imports = []
    if 'useParams' in other_imports:
        next_nav_imports.append('useParams')
    if 'useNavigate' in other_imports:
        next_nav_imports.append('useRouter')
    if 'useSearchParams' in other_imports:
        next_nav_imports.append('useSearchParams')
    if 'useLocation' in other_imports:
        next_nav_imports.append('usePathname')

    if next_nav_imports:
        new_imports.append(f"import {{ {', '.join(next_nav_imports)} }} from 'next/navigation';")

    # Next.js Link import
    if link_present:
        new_imports.append("import Link from 'next/link';")

    # Replace old import with new imports
    new_import_block = '\n'.join(new_imports)
    content = re.sub(r"import\s+{[^}]+}\s+from\s+['\"]react-router-dom['\"];", new_import_block, content)

    # Replace useNavigate with useRouter
    content = re.sub(r'const\s+navigate\s*=\s*useNavigate\(\);', 'const router = useRouter();', content)
    content = re.sub(r'navigate\(', 'router.push(', content)

    # Replace useLocation with usePathname
    content = re.sub(r'const\s+location\s*=\s*useLocation\(\);', 'const pathname = usePathname();', content)
    content = re.sub(r'location\.pathname', 'pathname', content)

    with open(filename, 'w') as f:
        f.write(content)

    print(f"Fixed: {filename}")
else:
    print(f"No react-router-dom import found in {filename}")

PYTHON_SCRIPT

done

echo "Done!"
