# Component Architecture

This document covers the structure, conventions, and patterns for building components in elementary-ui. It's written for developers authoring new components or extending existing ones.

---

## Overview

Every component is a native **Web Component** (`HTMLElement` subclass with Shadow DOM). They are framework-agnostic — they work in plain HTML, React, Vue, or any other framework. Each component lives in its own directory under `components/` and is accompanied by a `component.json` that drives the playground UI.

```
components/
└── button/
    ├── button.js        # Web Component class
    └── component.json   # Playground config
```

You can scaffold a new component with:

```bash
npm run new -- my-card
```

This creates the directory, a stub JS class, and a starter `component.json`, then updates the manifest automatically.

---

## The JavaScript Component

### Structure

Every component follows the same lifecycle contract. Here's the minimal pattern:

```js
export class MyComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    const shared = window.sharedStyles || [];
    this.shadowRoot.innerHTML = `<div class="my-component"></div>`;

    if (shared.length > 0) {
      this.shadowRoot.adoptedStyleSheets = shared;
    }
  }

  connectedCallback() {
    this.updateUI();
  }

  static get observedAttributes() {
    return ['label', 'variant'];
  }

  attributeChangedCallback(_name, oldValue, newValue) {
    if (oldValue !== newValue) this.updateUI();
  }

  updateUI() {
    // read attributes, write to shadow DOM
  }
}

customElements.define('elm-my-component', MyComponent);
```

### Real Example: Button

The built-in `elm-button` demonstrates this pattern in practice:

```js
export class Button extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    const shared = window.sharedStyles || [];
    this.shadowRoot.innerHTML = `<button type="button" class="btn"></button>`;
    if (shared.length > 0) this.shadowRoot.adoptedStyleSheets = shared;
  }

  connectedCallback() { this.updateUI(); }

  static get observedAttributes() {
    return ['label', 'btn-style', 'size', 'disabled', 'icon', 'icon-pos'];
  }

  attributeChangedCallback(_name, oldValue, newValue) {
    if (oldValue !== newValue) this.updateUI();
  }

  updateUI() {
    const label    = this.getAttribute('label')     || 'Button';
    const btnStyle = this.getAttribute('btn-style') || 'btn-primary';
    const size     = this.getAttribute('size')      || '';
    const disabled = this.hasAttribute('disabled');
    const icon     = this.getAttribute('icon')      || '';
    const iconPos  = this.getAttribute('icon-pos')  || 'start';

    const btn = this.shadowRoot.querySelector('button');
    btn.className = ['btn', btnStyle, size ? `btn-${size}` : ''].filter(Boolean).join(' ');
    btn.disabled = disabled;
    btn.innerHTML = '';

    if (icon && iconPos === 'end') {
      btn.appendChild(document.createTextNode(label + ' '));
      const i = document.createElement('i');
      i.className = icon;
      btn.appendChild(i);
    } else if (icon) {
      const i = document.createElement('i');
      i.className = `${icon} me-1`;
      btn.appendChild(i);
      btn.appendChild(document.createTextNode(label));
    } else {
      btn.textContent = label;
    }
  }
}

customElements.define('elm-button', Button);
```

---

### Key Conventions

**`constructor` — structure only**
Set the shadow DOM template once. Never read attributes here — they aren't available yet. Cache frequently accessed shadow elements to avoid repeated queries in `updateUI()`.

**`connectedCallback` — wire behaviour**
Call `updateUI()` first, then attach event listeners. Keep listeners scoped: shadow DOM events go on shadow elements, light DOM delegation goes on `this` (the host). Never add listeners in `updateUI()` — it runs on every attribute change and will stack.

**`attributeChangedCallback` — always guard**
Always check `if (oldValue !== newValue)` before triggering `updateUI()`. The browser calls this on initial attribute set too, so without the guard you'll double-render on connect.

**`updateUI` — surgical writes only**
Read all attributes at the top, then write to the DOM. Never recreate the entire shadow tree here — only mutate what changed (class names, text content, styles, visibility). This keeps rerenders cheap and avoids destroying event listeners on child elements.

**`disconnectedCallback` — always clean up**
Any global listener registered with `document.addEventListener` must be removed here. Keyboard handlers, outside-click handlers — all of it. Failing to do this causes memory leaks and ghost behaviour on component removal. See `elm-dropdown` for the full pattern.

---

### Shared Styles

Styles are injected as `CSSStyleSheet` objects via `adoptedStyleSheets`, set on `window.sharedStyles` by the theme engine before components are defined. This gives every component access to Bootstrap and Font Awesome classes inside Shadow DOM.

```js
const shared = window.sharedStyles || [];
if (shared.length > 0) {
  this.shadowRoot.adoptedStyleSheets = shared;
}
```

This happens in the `constructor` — by the time an element connects, the stylesheets are already compiled and available.

---

### Slots

Components can use named slots for user-provided content:

```html
<slot name="header"></slot>
<slot name="body">Default content</slot>
```

**Shadow DOM events don't bubble past the host by default.** For interactions on slotted content, listen on the host element (`this`) and use `e.target.closest()` to detect:

```js
this.addEventListener('click', e => {
  if (e.target.closest('[data-action="close"]')) this.hide();
});
```

**Bootstrap can't pierce Shadow DOM.** Any Bootstrap JS that relies on data-attribute discovery (dropdowns, tooltips) must be initialised manually inside the component using `window.bootstrap.Dropdown`, etc.

---

### Light DOM Data Carriers

Components with dynamic child items (dropdowns, accordions, tab panels) use a **data carrier pattern**: child elements are hidden light DOM nodes whose only purpose is to pass structured data to the parent via attributes.

The built-in `elm-dropdown` demonstrates this. `elm-dropdown-item` children carry the data; the parent reads them in `connectedCallback` and renders everything in its own shadow DOM.

**The child class is minimal — hide itself and declare its attributes:**

```js
class DropdownItem extends HTMLElement {
  constructor() { super(); }
  connectedCallback() { this.style.display = 'none'; }
  static get observedAttributes() { return ['label', 'href', 'divider']; }
}
customElements.define('elm-dropdown-item', DropdownItem);
```

**The parent reads items once in `connectedCallback`:**

```js
connectedCallback() {
  this._items = Array.from(this.querySelectorAll('elm-dropdown-item')).map(el => ({
    label:   el.getAttribute('label')  || '',
    href:    el.getAttribute('href')   || '#',
    divider: el.hasAttribute('divider'),
  }));
  this.updateUI();
}
```

Child classes are defined in the same file as the parent and are **not** exported from `src/index.js`. Importing the parent registers both custom elements automatically.

---

### Animation Timing

For enter/exit animations, use the **double `requestAnimationFrame`** pattern. A single rAF is not reliable — the browser may batch the `display` change and the class toggle into the same paint cycle, killing the CSS transition:

```js
element.style.display = 'block';
requestAnimationFrame(() => requestAnimationFrame(() => {
  element.classList.add('show');
}));
```

Exit animations use a `setTimeout` matching the CSS transition duration, after which the element is hidden and cleanup runs.

---

## The component.json Model

Each `component.json` drives the playground UI: the live preview, the props panel, and the generated code snippet.

### Top-Level Fields

```json
{
  "version": 1,
  "title": "Button",
  "description": "<code>&lt;elm-button&gt;</code> — Bootstrap-styled button with optional icon support.",
  "dependencies": [],
  "template": "<elm-button {{btn-style}} {{label}}></elm-button>",
  "props": []
}
```

| Field | Purpose |
|---|---|
| `version` | Schema version. Currently always `1`. |
| `title` | Display name shown in the sidebar and playground header. |
| `description` | HTML string shown below the title. Use `<code>` tags for element names. |
| `dependencies` | Component paths that must be loaded for the preview to work (e.g. `["components/button/"]`). |
| `template` | Live preview markup. Uses `{{propId}}` tokens that are interpolated at render time. |
| `props` | Array of prop definitions that drive the props panel controls. |

---

### Template Interpolation

Tokens in the template (`{{propId}}`) are replaced at render time based on the prop definition:

- If the prop has `"attribute": "foo"` → renders as `foo="value"` (or just `foo` for booleans)
- If the prop has no `attribute` → the raw value is injected as-is (used for slot HTML and repeater children)
- Empty values collapse cleanly — multiple spaces are normalised to one, so unused optional attributes don't leave gaps

```json
"template": "<elm-button {{btn-style}} {{label}} {{disabled}}></elm-button>"
```

When `disabled` is false, `{{disabled}}` resolves to an empty string. The cleanup pass collapses the resulting double space.

---

### Prop Types

#### `text`
Renders a plain text input. Value is injected as an attribute string.

```json
{ "id": "label", "label": "Label", "type": "text", "attribute": "label", "default": "Click Me" }
```

#### `select`
Renders a dropdown. Requires an `options` array of `{ label, value }` objects.

```json
{
  "id": "btn-style", "label": "Style", "type": "select", "attribute": "btn-style",
  "default": "btn-primary",
  "options": [
    { "label": "Primary", "value": "btn-primary" },
    { "label": "Secondary", "value": "btn-secondary" }
  ]
}
```

#### `boolean`
Renders a toggle. When true, injects the attribute name alone (boolean attribute). When false, injects nothing.

```json
{ "id": "disabled", "label": "Disabled", "type": "boolean", "attribute": "disabled", "default": false }
```

#### `code`
Renders a syntax-highlighted textarea for raw HTML input. The value is injected directly into the template — no attribute wrapping. Use for slot content.

```json
{ "id": "body", "label": "Body HTML", "type": "code", "rows": 5, "default": "<div slot=\"body\">Content</div>" }
```

#### `range`
Renders a range slider. Use for numeric values like width or opacity.

```json
{ "id": "value", "label": "Value", "type": "range", "attribute": "value", "default": "50", "min": 0, "max": 100 }
```

#### `color`
Renders a colour picker input. Value is injected as an attribute string.

```json
{ "id": "color", "label": "Color", "type": "color", "attribute": "color", "default": "#000000" }
```

#### `repeater`
Renders a dynamic list of child elements — add, remove, and reorder. Each item generates a child tag in the template. Requires `childTag` and a nested `props` array defining each item's fields.

```json
{
  "id": "items",
  "label": "Items",
  "type": "repeater",
  "itemLabel": "Item",
  "childTag": "elm-dropdown-item",
  "default": [
    { "label": "Action", "href": "#", "divider": false },
    { "label": "Another action", "href": "#", "divider": false }
  ],
  "props": [
    { "id": "label", "label": "Label", "type": "text", "attribute": "label" },
    { "id": "href", "label": "Href", "type": "text", "attribute": "href" },
    { "id": "divider", "label": "Divider", "type": "boolean", "attribute": "divider", "default": false }
  ]
}
```

**`innerContent: true`** — marks a prop whose value is injected as the child element's inner HTML rather than as an attribute. Useful for freeform HTML body content inside repeater items.

---

### Prop Groups

Props can be visually grouped in the panel by adding a `"group"` key. Props without a group fall into the default `"Properties"` group.

```json
{ "id": "nav-util", "label": "Nav Utilities", "type": "text", "group": "Advanced" }
```

---

## Exports

The library entry point at `src/index.js` exports component classes. Child element classes (e.g. `DropdownItem`) are **not** exported — they are registered as a side effect of importing the parent.

```js
// src/index.js
import './lib-styles.js';

export { Button } from '../components/button/button.js';
export { Dropdown } from '../components/dropdown/dropdown.js';
```

The `sharedStyles` export from `lib-styles.js` exposes the processed `CSSStyleSheet` objects for use in custom components that need to share the same Bootstrap/Font Awesome styles without re-parsing them.

---

## Manifest Registration

Components appear in the playground sidebar via `components/manifest.json`. This file is auto-generated by running:

```bash
npm run build:manifests
```

It scans `components/` for directories containing a `component.json` and builds the navigation tree. You can group components under collapsible headings using `components/.grouping.json`:

```json
{
  "groups": [
    { "name": "Form Components", "items": ["input", "checkbox", "select"] }
  ]
}
```

Components not listed in any group appear ungrouped at the top level.
