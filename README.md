<p align="left">
  <img src="https://kinferra.com/elm-ui-demo/elementary-assets/elementary-logo.png" alt="Elementary UI" width="250">
</p>

Built primarily for Shadow DOM based HTML web components. Brand your library, fill it with your components, and manage your team’s component system from a single place. 
Give your components a home for stakeholders to view your props and test out the components. 
Allow your favorite AI agents a centeralized folder to access your components and a direct location to build/save your prototypes.

## Quick Start

### Install from npm

```bash
npm install @j7239/elementary-ui
```

Copy the brand layer into your project (one-time):

```bash
cp -r node_modules/@j7239/elementary-ui/component-assets ./component-assets
```

### Or fork/clone the repository

1. **Edit `brand.json`** with your project identity:
   ```json
   {
     "distName": "my-brand-ui",
     "globalName": "MyBrandUI",
     "title": "My Brand Design System",
     "version": "1.0.0"
   }
   ```
2. **Initialize:**
   ```bash
   npm install
   npm run init
   ```
3. **Launch the playground:**
   ```bash
   npm run dev
   ```

## Staying Up to Date

```bash
npm update @j7239/elementary-ui
```

Updates only affect the JS bundle in `node_modules/`. Your `component-assets/`, `brand.json`, and `components/` configs are never touched.

## What You Customize

| File / Directory | Purpose |
|---|---|
| `brand.json` | Playground title, dist name, logo, hero visibility |
| `component-assets/scss/main.scss` | Your styles entry point — brand tokens, Bootstrap import, custom CSS |
| `components/` | Your web components + `component.json` playground configs |
| `docs/` | Markdown documentation shown in the Docs sidebar section |
| `test-envs/` | Sandbox demo pages |
| `src/index.js` | Library exports (what ships in the built JS bundle) |

## Styles

All component styling flows from a single entry point: `component-assets/scss/main.scss`. This file is where you define your brand tokens, override Bootstrap variables, and add any custom CSS. It compiles to `dist/css/styles.min.css` via `npm run build:css`.

That compiled CSS is delivered to your components through two separate systems depending on the context:

### Theme Engine (Component Playground)

`component-assets/js/theme-engine.js` powers the playground's live preview. It fetches `dist/css/styles.min.css` at runtime and creates shared `CSSStyleSheet` objects that are adopted into each component's Shadow DOM. This is what makes your styles appear when previewing components in the playground during development.

### Lib Styles (Built Library)

`src/lib-styles.js` serves the same purpose but for the built ES module (`dist/elementary-ui.es.js`). It inlines the compiled CSS directly into the bundle and exposes it as `window.sharedStyles` — an array of `CSSStyleSheet` objects that every component adopts into its Shadow DOM:

```js
const shared = window.sharedStyles || [];
this.shadowRoot.adoptedStyleSheets = [...shared];
```

This is what test environments and production consumers of your library use. If your styles aren't showing up in a test environment, make sure you've rebuilt with `npm run build:css` and `npm run build`.

### Adding Your Styles

1. Add your custom SCSS or CSS rules to `component-assets/scss/main.scss` (after the Bootstrap import if you need Bootstrap utilities available)
2. Run `npm run build:css` to compile to `dist/css/styles.min.css`
3. Both the theme engine and lib-styles will pick up the changes automatically — the theme engine fetches the compiled file, and lib-styles inlines it at build time

## Key Commands

| Command | Description |
|---|---|
| `npm run dev` | Start the playground dev server on port 8000 |
| `npm run new -- <name>` | Scaffold a new component (`components/<name>/`) |
| `npm run build` | Build the distributable JS library to `dist/` |
| `npm run build:manifests` | Regenerate `components/manifest.json` and `test-envs/manifest.json` |
| `npm run build:css` | Compile `component-assets/scss/main.scss` to `dist/css/styles.min.css` |
| `npm run init` | Sync `package.json` with `brand.json`, scaffold SCSS, generate manifests |

## Adding a Component

```bash
npm run new -- my-card
```

This creates `components/my-card/` with:
- `my-card.js` — Web Component class (Shadow DOM, shared styles)
- `component.json` — playground props editor config

Edit both files, then open the playground to see it live. See `docs/COMPONENTS.md` in the playground for the full schema reference.

## Test Environments

The `test-envs/` folder holds standalone sandbox pages for testing your components outside the playground. Each subfolder (e.g. `test-envs/test-demo/`) contains an `index.html` that you can freely edit to compose layouts, test interactions, or demo features.

Every test environment must import its components from the built ES module via a `<script type="module">` tag:

```html
<script type="module">
    import { Button, Dropdown } from '../../dist/elementary-ui.es.js';
</script>
```

Only components exported in `src/index.js` are available in the bundle. If you add a new component and want to use it in a test environment, make sure it is exported from `src/index.js` and rebuild with `npm run build`.

To register a test environment in the playground sidebar, add an entry to `test-envs/manifest.json`:

```json
{ "name": "my-test", "path": "test-envs/my-test/index.html" }
```

## Documentation

The playground itself is the primary documentation. Launch it with `npm run dev` and visit the **Welcome** page for the full getting-started guide, or browse **Docs** in the sidebar for the style guide and component reference.
