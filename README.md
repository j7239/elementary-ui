# elementary-ui

A component playground and distributable web component library. Fork it, brand it, fill it with your components, and ship a living style guide and compiled JS bundle.

## Quick Start

1. **Fork or clone** this repository
2. **Edit `brand.json`** with your project identity:
   ```json
   {
     "distName": "my-brand-ui",
     "globalName": "MyBrandUI",
     "title": "My Brand Design System",
     "version": "1.0.0"
   }
   ```
3. **Initialize:**
   ```bash
   npm install
   npm run init
   ```
4. **Launch the playground:**
   ```bash
   npm run dev
   ```

## What You Customize

| File / Directory | Purpose |
|---|---|
| `brand.json` | Playground title, dist name, logo, hero visibility |
| `component-assets/scss/main.scss` | Your styles entry point — brand tokens, Bootstrap import, custom CSS |
| `components/` | Your web components + `component.json` playground configs |
| `docs/` | Markdown documentation shown in the Docs sidebar section |
| `test-envs/` | Sandbox demo pages |
| `src/index.js` | Library exports (what ships in the built JS bundle) |

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

## Documentation

The playground itself is the primary documentation. Launch it with `npm run dev` and visit the **Welcome** page for the full getting-started guide, or browse **Docs** in the sidebar for the style guide and component reference.
