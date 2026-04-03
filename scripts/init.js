#!/usr/bin/env node
/**
 * init.js — One-time setup after forking / customizing brand.json.
 * Syncs package.json with brand.json, scaffolds missing SCSS files,
 * and generates component + demo manifests.
 *
 * Usage:  npm run init
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const brand = JSON.parse(fs.readFileSync(path.join(root, 'brand.json'), 'utf-8'));
const distName = brand.distName || 'elementary-ui';

console.log(`\nInitializing "${distName}"...\n`);

// ── 1. Sync package.json ────────────────────────────────────────────────────
const pkgPath = path.join(root, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

pkg.name = distName;
pkg.main = `./dist/${distName}.umd.js`;
pkg.module = `./dist/${distName}.es.js`;
pkg.exports = {
    '.': {
        import: `./dist/${distName}.es.js`,
        require: `./dist/${distName}.umd.js`
    }
};

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 4) + '\n');
console.log('  ✓ Synced package.json name & dist paths');

// ── 2. Scaffold SCSS entry point if missing ─────────────────────────────────
const scssDir = path.join(root, 'component-assets', 'scss');
fs.mkdirSync(scssDir, { recursive: true });

const mainScss = path.join(scssDir, 'main.scss');
if (!fs.existsSync(mainScss)) {
    fs.writeFileSync(mainScss, `// Entry point — compiled by "npm run build:css"\n// Override Bootstrap variables before the import, add your own styles after.\n\n$primary:          #635bff;\n$secondary:        #6c757d;\n$font-family-base: 'Inter', sans-serif;\n$font-size-base:   0.875rem;\n\n@import 'bootstrap/scss/bootstrap';\n`);
    console.log('  ✓ Created component-assets/scss/main.scss');
} else {
    console.log('  · main.scss already exists — skipped');
}

// ── 3. Generate manifests ───────────────────────────────────────────────────
execSync('node build.js', { cwd: root, stdio: 'inherit' });
console.log('  ✓ Manifests generated');

// ── Done ────────────────────────────────────────────────────────────────────
console.log(`
Done! Next steps:
  1. Edit brand.json to set your distName, title, and version
  2. Customize component-assets/scss/main.scss with your brand tokens
  3. Run "npm run dev" to start the playground
  4. Run "npm run new -- <name>" to scaffold a new component
`);
