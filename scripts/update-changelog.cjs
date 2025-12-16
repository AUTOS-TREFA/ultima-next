#!/usr/bin/env node
/**
 * Script para actualizar changelog.html automáticamente desde commits de Git
 * Uso: node scripts/update-changelog.cjs [número de commits]
 * Ejemplo: node scripts/update-changelog.cjs 7
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuración
const CHANGELOG_PATH = path.join(__dirname, '..', 'public', 'changelog.html');
const DEFAULT_COMMITS = 5;

// Colores para terminal
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

// Categorías de commits
const COMMIT_CATEGORIES = {
    'feat': { badge: 'badge-feature', icon: '✨', label: 'Nueva Funcionalidad' },
    'fix': { badge: 'badge-fix', icon: '🐛', label: 'Corrección' },
    'refactor': { badge: 'badge-improvement', icon: '♻️', label: 'Refactorización' },
    'perf': { badge: 'badge-improvement', icon: '⚡', label: 'Mejora de Rendimiento' },
    'docs': { badge: 'badge-improvement', icon: '📚', label: 'Documentación' },
    'style': { badge: 'badge-improvement', icon: '💄', label: 'Estilo' },
    'chore': { badge: 'badge-improvement', icon: '🔧', label: 'Mantenimiento' },
    'test': { badge: 'badge-improvement', icon: '🧪', label: 'Tests' },
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function getCommits(count) {
    try {
        const format = '%H|||%s|||%an|||%ad';
        const output = execSync(
            `git log -${count} --pretty=format:"${format}" --date=short`,
            { encoding: 'utf-8' }
        );

        return output.split('\n').filter(Boolean).map(line => {
            const [hash, message, author, date] = line.split('|||');
            return { hash: hash.substring(0, 7), fullHash: hash, message, author, date };
        });
    } catch (error) {
        console.error('Error obteniendo commits:', error.message);
        return [];
    }
}

function parseCommitMessage(message) {
    // Detectar tipo de commit (feat, fix, etc.)
    const typeMatch = message.match(/^(feat|fix|refactor|perf|docs|style|chore|test)(\(.+?\))?:\s*(.+)$/i);

    if (typeMatch) {
        const [, type, scope, description] = typeMatch;
        return {
            type: type.toLowerCase(),
            scope: scope ? scope.replace(/[()]/g, '') : null,
            description: description.trim(),
            category: COMMIT_CATEGORIES[type.toLowerCase()] || COMMIT_CATEGORIES['chore']
        };
    }

    // Si no tiene formato convencional, inferir tipo
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('fix') || lowerMessage.includes('corrige') || lowerMessage.includes('bug')) {
        return { type: 'fix', description: message, category: COMMIT_CATEGORIES['fix'] };
    }
    if (lowerMessage.includes('add') || lowerMessage.includes('agrega') || lowerMessage.includes('nuevo')) {
        return { type: 'feat', description: message, category: COMMIT_CATEGORIES['feat'] };
    }

    return { type: 'chore', description: message, category: COMMIT_CATEGORIES['chore'] };
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${date.getDate()} de ${months[date.getMonth()]}, ${date.getFullYear()}`;
}

function generateVersionHTML(commits, version) {
    const today = new Date().toISOString().split('T')[0];
    const formattedDate = formatDate(today);

    // Agrupar commits por categoría
    const grouped = {};
    commits.forEach(commit => {
        const parsed = parseCommitMessage(commit.message);
        const type = parsed.type;
        if (!grouped[type]) {
            grouped[type] = [];
        }
        grouped[type].push({ ...commit, ...parsed });
    });

    let categoriesHTML = '';

    Object.entries(grouped).forEach(([type, items]) => {
        const category = COMMIT_CATEGORIES[type] || COMMIT_CATEGORIES['chore'];

        const itemsHTML = items.map(item => `
                        <li class="change-item">
                            <div class="change-icon">${category.icon}</div>
                            <div class="change-text">
                                <strong>${item.description}</strong>
                                <span class="commit-hash">${item.hash}</span>
                                <p class="change-description">Por ${item.author} - ${formatDate(item.date)}</p>
                            </div>
                        </li>`).join('\n');

        categoriesHTML += `
                <div class="change-category">
                    <div class="category-title">
                        <span class="badge ${category.badge}">${category.label}</span>
                    </div>
                    <ul class="change-list">${itemsHTML}
                    </ul>
                </div>
`;
    });

    return `
            <!-- Version ${version} - Auto-generated -->
            <div class="version">
                <div class="version-header">
                    <span class="version-number">v${version}</span>
                    <span class="version-date">${formattedDate}</span>
                    <span class="badge badge-feature" style="margin-left: 10px;">🤖 Auto-generado</span>
                </div>
${categoriesHTML}
            </div>

`;
}

function updateChangelog(newContent) {
    let html = fs.readFileSync(CHANGELOG_PATH, 'utf-8');

    // Buscar el inicio del contenido después del div.content
    const contentStart = html.indexOf('<div class="content">');
    if (contentStart === -1) {
        throw new Error('No se encontró el div.content en changelog.html');
    }

    // Insertar el nuevo contenido justo después de <div class="content">
    const insertPosition = contentStart + '<div class="content">'.length;
    html = html.slice(0, insertPosition) + '\n' + newContent + html.slice(insertPosition);

    fs.writeFileSync(CHANGELOG_PATH, html);
    log('✅ changelog.html actualizado exitosamente', 'green');
}

function getCurrentVersion() {
    try {
        const packageJson = require(path.join(__dirname, '..', 'package.json'));
        return packageJson.version || '1.0.0';
    } catch {
        return '1.0.0';
    }
}

function incrementVersion(version) {
    const parts = version.split('.').map(Number);
    parts[2] = (parts[2] || 0) + 1;
    return parts.join('.');
}

// Main
function main() {
    const args = process.argv.slice(2);
    const commitCount = parseInt(args[0]) || DEFAULT_COMMITS;

    log(`\n📝 Actualizando changelog con los últimos ${commitCount} commits...\n`, 'cyan');

    // Obtener commits
    const commits = getCommits(commitCount);

    if (commits.length === 0) {
        log('⚠️  No se encontraron commits', 'yellow');
        return;
    }

    log(`📦 Encontrados ${commits.length} commits:`, 'blue');
    commits.forEach(c => {
        const parsed = parseCommitMessage(c.message);
        log(`   ${parsed.category.icon} ${c.hash} - ${c.message.substring(0, 60)}...`);
    });

    // Generar nueva versión
    const currentVersion = getCurrentVersion();
    const newVersion = incrementVersion(currentVersion);

    log(`\n🔢 Versión actual: ${currentVersion}`, 'blue');
    log(`🆕 Nueva versión: ${newVersion}`, 'green');

    // Generar HTML
    const html = generateVersionHTML(commits, newVersion);

    // Actualizar archivo
    updateChangelog(html);

    log(`\n✅ Changelog actualizado con ${commits.length} commits`, 'green');
    log(`📄 Archivo: ${CHANGELOG_PATH}`, 'cyan');
    log(`\n💡 Revisa el archivo y haz commit de los cambios:\n`, 'yellow');
    log(`   git add public/changelog.html`, 'reset');
    log(`   git commit -m "docs: Actualiza changelog v${newVersion}"`, 'reset');
    log(`   git push\n`, 'reset');
}

main();
