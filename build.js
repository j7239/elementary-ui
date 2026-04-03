/**
 * generate-manifests.js
 * Scans components/ and test-envs/ and writes their manifest.json files.
 * Run: node generate-manifests.js
 */

const fs = require('fs');
const path = require('path');

const root = __dirname;

// Load grouping configuration from components/.grouping.json
function loadGrouping() {
    const groupingFile = path.join(root, 'components', '.grouping.json');
    if (fs.existsSync(groupingFile)) {
        try {
            return JSON.parse(fs.readFileSync(groupingFile, 'utf-8'));
        } catch (e) {
            console.warn('Could not parse .grouping.json:', e.message);
        }
    }
    return {};
}

// Recursively scan components/.
// Directories with an index.html are component leaves.
// Directories without one are category groups with children.
function scanComponents(dir, relBase, grouping = {}) {
    const entries = [];
    let items;
    try {
        items = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
        return entries;
    }

    const subDirs = items
        .filter(d => d.isDirectory())
        .sort((a, b) => a.name.localeCompare(b.name));

    for (const subDir of subDirs) {
        const fullPath = path.join(dir, subDir.name);
        const relPath = `${relBase}${subDir.name}/`;
        const isComponent = fs.existsSync(path.join(fullPath, 'index.html'))
                         || fs.existsSync(path.join(fullPath, 'component.json'));

        if (isComponent) {
            entries.push({ name: subDir.name, path: relPath });
        } else {
            const children = scanComponents(fullPath, relPath, grouping);
            if (children.length > 0) {
                entries.push({ name: subDir.name, children });
            }
        }
    }

    return entries;
}

// Create manual groups from grouping config
function applyGrouping(entries, grouping) {
    if (!grouping || !grouping.groups || grouping.groups.length === 0) {
        return entries;
    }

    const grouped = new Set();
    const result = [];

    // Build map of group entries
    const groupMap = {};
    for (const group of grouping.groups) {
        groupMap[group.name] = [];
        for (const itemName of group.items) {
            const entry = entries.find(e => e.name === itemName && !e.children);
            if (entry) {
                groupMap[group.name].push(entry);
                grouped.add(itemName);
            }
        }
    }

    // Get ungrouped entries
    const ungrouped = [];
    for (const entry of entries) {
        if (!grouped.has(entry.name)) {
            ungrouped.push(entry);
        }
    }

    // Merge groups and ungrouped, then sort alphabetically
    const allEntries = [];
    for (const group of grouping.groups) {
        if (groupMap[group.name].length > 0) {
            allEntries.push({ name: group.name, children: groupMap[group.name] });
        }
    }
    allEntries.push(...ungrouped);

    // Sort by name alphabetically
    allEntries.sort((a, b) => a.name.localeCompare(b.name));

    return allEntries;
}

// Scan test-envs/ for subdirectories that contain an index.html.
function scanDemos(dir) {
    const entries = [];
    let items;
    try {
        items = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
        return entries;
    }

    const subDirs = items
        .filter(d => d.isDirectory())
        .sort((a, b) => a.name.localeCompare(b.name));

    for (const subDir of subDirs) {
        const fullPath = path.join(dir, subDir.name);
        if (fs.existsSync(path.join(fullPath, 'index.html'))) {
            entries.push({
                name: subDir.name,
                path: `test-envs/${subDir.name}/index.html`
            });
        }
    }

    return entries;
}

function writeManifest(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 4) + '\n');
    console.log(`  wrote ${path.relative(root, filePath)}`);
}

console.log('Generating manifests...');
const grouping = loadGrouping();
const componentEntries = scanComponents(path.join(root, 'components'), 'components/', grouping);
const finalEntries = applyGrouping(componentEntries, grouping);

writeManifest(
    path.join(root, 'components', 'manifest.json'),
    finalEntries
);
writeManifest(
    path.join(root, 'test-envs', 'manifest.json'),
    scanDemos(path.join(root, 'test-envs'))
);
console.log('Done.');
