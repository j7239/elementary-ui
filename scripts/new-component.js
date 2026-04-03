#!/usr/bin/env node
/**
 * new-component.js — Scaffold a new web component for the playground.
 * Creates the directory, a stub JS class, and a component.json config.
 *
 * Usage:  npm run new -- my-card
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const name = process.argv[2];

if (!name) {
    console.error('Usage: npm run new -- <component-name>');
    console.error('  e.g. npm run new -- my-card');
    process.exit(1);
}

const dir = path.join(root, 'components', name);
if (fs.existsSync(dir)) {
    console.error(`Component "${name}" already exists at components/${name}/`);
    process.exit(1);
}

// Derive tag name (elm-my-card) and class name (MyCard)
const tagName = `elm-${name}`;
const className = name
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');

fs.mkdirSync(dir, { recursive: true });

// ── component.json ──────────────────────────────────────────────────────────
const componentJson = {
    version: 1,
    title: className,
    description: `<code>&lt;${tagName}&gt;</code> — Your component description here.`,
    dependencies: [],
    template: `<${tagName} label="Hello"></${tagName}>`,
    props: [
        {
            id: 'label',
            label: 'Label',
            type: 'text',
            attribute: 'label',
            default: 'Hello'
        }
    ]
};

fs.writeFileSync(
    path.join(dir, 'component.json'),
    JSON.stringify(componentJson, null, 4) + '\n'
);

// ── Component JS ────────────────────────────────────────────────────────────
const js = `class ${className} extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        if (window.sharedStyles) {
            this.shadowRoot.adoptedStyleSheets = [...window.sharedStyles];
        }
    }

    static get observedAttributes() {
        return ['label'];
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback(_name, oldVal, newVal) {
        if (oldVal !== newVal) this.render();
    }

    render() {
        const label = this.getAttribute('label') || '';
        this.shadowRoot.innerHTML = \`<span>\${label}</span>\`;
    }
}

customElements.define('${tagName}', ${className});
export { ${className} };
`;

fs.writeFileSync(path.join(dir, `${name}.js`), js);

// ── Rebuild manifests ───────────────────────────────────────────────────────
execSync('node build.js', { cwd: root, stdio: 'inherit' });

console.log(`\nCreated components/${name}/`);
console.log(`  • ${name}.js       — Web Component class`);
console.log(`  • component.json  — playground config`);
console.log(`\nManifest updated. Add an export to src/index.js if you want it in the built library.`);

