#!/usr/bin/env node
/**
 * sync-pkg.js — Syncs package.json dist paths with brand.json distName.
 * Runs automatically as a postbuild hook.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const brand = JSON.parse(fs.readFileSync(path.join(root, 'brand.json'), 'utf-8'));
const pkgPath = path.join(root, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

const name = brand.distName || 'elementary-ui';

pkg.main = `./dist/${name}.umd.js`;
pkg.module = `./dist/${name}.es.js`;
pkg.exports = {
    '.': {
        import: `./dist/${name}.es.js`,
        require: `./dist/${name}.umd.js`
    }
};

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 4) + '\n');
console.log(`  Synced package.json dist paths → "${name}"`);
