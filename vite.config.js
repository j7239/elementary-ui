import { defineConfig } from 'vite';
import { resolve } from 'path';
import brand from './brand.json';

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.js'),
            name: brand.globalName || 'ElementaryUI',
            fileName: (format) => `${brand.distName || 'elementary-ui'}.${format}.js`
        },
        target: 'es2020',
        // Inline assets (including the woff2 font) as base64 data URIs so the
        // built library is fully self-contained — no separate webfonts/ folder needed.
        assetsInlineLimit: 500000,
        // Prevent Vite from wiping dist/ — CSS, fonts, and other static assets
        // are built separately and live alongside the JS bundle in dist/.
        emptyOutDir: false,
        rollupOptions: {}
    }
});
