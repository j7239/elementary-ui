document.addEventListener('DOMContentLoaded', () => {
    /* ==========================================================================
       Sidebar & Navigation Logic
       ========================================================================== */
    const menuToggle = document.getElementById('menu-toggle');
    const wrapper = document.getElementById('wrapper');
    const fullDemoLink = document.getElementById('full-demo-link');

    // Helpers — single source of truth for the Full Page button visibility
    const showFullPageLink = (url) => {
        if (!fullDemoLink) return;
        fullDemoLink.dataset.href = url;
        fullDemoLink.classList.remove('d-none');
        fullDemoLink.classList.add('d-flex');
    };
    const hideFullPageLink = () => {
        if (!fullDemoLink) return;
        fullDemoLink.classList.remove('d-flex');
        fullDemoLink.classList.add('d-none');
        delete fullDemoLink.dataset.href;
    };

    // Open URL in new tab when clicked
    fullDemoLink && fullDemoLink.addEventListener('click', () => {
        const url = fullDemoLink.dataset.href;
        if (url) window.open(url, '_blank');
    });

    // Guarantee hidden on initial load
    hideFullPageLink();

    // Icon Toggle Logic
    const updateMenuIcon = () => {
        if (!menuToggle) return;
        const icon = menuToggle.querySelector('i');
        const isMobile = window.innerWidth <= 768;
        const isOpen = isMobile ? wrapper.classList.contains('toggled') : !wrapper.classList.contains('toggled');
        icon.className = isOpen ? 'fal fa-xmark fs-5' : 'fal fa-bars fs-5';
    };

    // Toggle sidebar on click
    if (menuToggle && wrapper) {
        menuToggle.addEventListener('click', () => {
            wrapper.classList.toggle('toggled');
            document.body.classList.toggle('sidebar-toggled', wrapper.classList.contains('toggled'));
            updateMenuIcon();
        });
    }

    const checkWidth = () => {
        if (window.innerWidth <= 768) {
            wrapper.classList.remove('toggled'); // mobile: open by default
        } else {
            wrapper.classList.add('toggled');    // desktop: closed by default
        }
        document.body.classList.toggle('sidebar-toggled', wrapper.classList.contains('toggled'));
        updateMenuIcon();
    };

    window.addEventListener('resize', checkWidth);

    // Suppress all transitions for the very first layout pass so the sidebar
    // doesn't animate closed/open on page load.
    document.body.classList.add('no-transitions');
    checkWidth();
    // Two rAFs: first lets the browser apply the class changes, second lets it
    // paint them, then we re-enable transitions for all future interactions.
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            document.body.classList.remove('no-transitions');
        });
    });

    /* ==========================================================================
       Hash-Based Routing
       ========================================================================== */

    // Tracks the last clicked doc file so activateSection can restore the correct active link
    let activeDocFile = null;

    /**
     * Parse the current window.location.hash into { sectionId, demoUrl }.
     * Formats:
     *   #getting-started          → { sectionId: 'getting-started', demoUrl: null }
     *   #sandbox?demo=path/to/x  → { sectionId: 'sandbox', demoUrl: 'path/to/x' }
     */
    const parseHash = () => {
        const raw = window.location.hash.slice(1); // strip leading '#'
        if (!raw) {
            const welcome = !(window._brand && window._brand.hideWelcome);
            return { sectionId: welcome ? 'getting-started' : 'docs', demoUrl: null, docFile: null };
        }

        const [sectionPart, queryPart] = raw.split('?');
        const sectionId = sectionPart || 'getting-started';
        let demoUrl = null;
        let docFile = null;
        if (queryPart) {
            const params = new URLSearchParams(queryPart);
            demoUrl = params.get('demo') || null;
            docFile = params.get('file') || null;
        }
        return { sectionId, demoUrl, docFile };
    };

    /**
     * Build a hash string from sectionId (and optional demoUrl for sandbox).
     */
    const buildHash = (sectionId, demoUrl = null, docFile = null) => {
        if (sectionId === 'sandbox' && demoUrl) {
            return `#sandbox?demo=${encodeURIComponent(demoUrl)}`;
        }
        if (sectionId === 'docs' && docFile) {
            return `#docs?file=${encodeURIComponent(docFile)}`;
        }
        return `#${sectionId}`;
    };

    /**
     * Activate a section by ID.
     * Returns true if the section was found, false otherwise.
     */
    const activateSection = (sectionId, demoUrl, { pushHash = false, docFile = null } = {}) => {
        const contentSections = document.querySelectorAll('.content-section');
        const targetEl = document.getElementById(sectionId);
        if (!targetEl) return false;

        const pageWrapper = document.getElementById('page-content-wrapper');

        // ── Perform the actual DOM swap (hidden behind the fade) ──────────────
        const doSwap = () => {
            // Reset scroll on the content wrapper (our scroll container, not window)
            pageWrapper?.scrollTo({ top: 0, behavior: 'instant' });

            // Hide all sections
            contentSections.forEach(s => {
                s.classList.remove('d-flex', 'section-fade-in');
                s.classList.add('d-none');
            });

            // Reveal target
            targetEl.classList.remove('d-none');
            targetEl.classList.add('d-flex', 'section-fade-in');
            targetEl.addEventListener('animationend', () => targetEl.classList.remove('section-fade-in'), { once: true });

            // Re-measure iframe height + fix tab indicators now that section is visible
            // (iframes and getBoundingClientRect() return 0 inside d-none sections)
            setTimeout(() => {
                targetEl.querySelectorAll('.comp-preview-window').forEach(iframe => {
                    try {
                        const h = iframe.contentDocument?.body?.scrollHeight;
                        if (h) iframe.style.height = Math.max(180, h) + 'px';
                    } catch (_) {}
                });
            }, 100);

            // Update active nav link
            const allNavLinks = document.querySelectorAll('.list-group-item[data-target]');
            allNavLinks.forEach(l => {
                l.classList.remove('active');
                l.removeAttribute('aria-current');
            });

            const matchingLink = (() => {
                if (sectionId === 'sandbox' && demoUrl) {
                    return document.querySelector(`.list-group-item[data-target="sandbox"][data-demo="${demoUrl}"]`)
                        || document.querySelector('.list-group-item[data-target="sandbox"]');
                }
                if (sectionId === 'docs') {
                    const file = docFile || activeDocFile;
                    if (file) return document.querySelector(`[data-doc-file="${file}"]`);
                }
                return document.querySelector(`.list-group-item[data-target="${sectionId}"]`);
            })();
            if (matchingLink) {
                matchingLink.classList.add('active');
                matchingLink.setAttribute('aria-current', 'page');
            }

            // Load the appropriate doc file when the docs section is shown
            if (sectionId === 'docs') {
                const docsContent = document.getElementById('docs-content');
                if (docsContent) {
                    const file = docFile
                        || (!docsContent.dataset.loaded && document.querySelector('[data-doc-file]')?.dataset.docFile)
                        || null;
                    if (file) {
                        activeDocFile = file;
                        loadDocFile(file);
                        docsContent.dataset.loaded = '1';
                    }
                }
            }

            // Handle sandbox iframe / full-page link
            hideFullPageLink();
            if (sectionId === 'sandbox' && demoUrl) {
                const iframe = document.getElementById('sandbox-iframe');
                if (iframe) iframe.src = demoUrl;
                showFullPageLink(demoUrl);
            }

            // Update hash without triggering another hashchange loop
            if (pushHash) {
                const newHash = buildHash(sectionId, demoUrl, docFile);
                if (window.location.hash !== newHash) {
                    history.pushState(null, '', newHash);
                }
            }

            // Close sidebar on mobile after navigation
            if (window.innerWidth <= 768) {
                wrapper.classList.remove('toggled');
                document.body.classList.toggle('sidebar-toggled', wrapper.classList.contains('toggled'));
                updateMenuIcon();
            }
        };

        // ── Fade in (curtain) → swap → hold → fade out ────────────────────────
        // Phase 1: 250ms  — curtain fades in (CSS transition)
        // Phase 2: swap   — DOM swap fires while curtain is fully opaque
        // Phase 3: 350ms  — hold: new section renders safely behind curtain
        // Phase 4: 250ms  — curtain fades out, new content revealed
        const curtain = document.getElementById('route-curtain');
        if (curtain) {
            curtain.classList.add('curtain-active');
            setTimeout(() => {
                doSwap();
                // Hold the curtain opaque while the new section paints,
                // then fade it out to reveal the finished result
                setTimeout(() => {
                    void curtain.offsetHeight;
                    curtain.classList.remove('curtain-active');
                }, 350);
            }, 250);
        } else {
            // Fallback: no curtain found, swap immediately
            doSwap();
        }

        return true;
    };

    /**
     * Resolve the current hash — called on load and on hashchange.
     * Falls back to 'getting-started' if the section isn't in the DOM yet.
     */
    const resolveHash = () => {
        const { sectionId, demoUrl, docFile } = parseHash();
        const found = activateSection(sectionId, demoUrl, { docFile });

        // If the section isn't in the DOM yet (e.g. dynamic component not loaded),
        // store it so loadComponents() can retry after injecting sections.
        if (!found) {
            pendingRoute = { sectionId, demoUrl, docFile };
        }
    };

    // Pending route — set when a hash resolves before dynamic content is ready
    let pendingRoute = null;

    // Listen for back/forward navigation
    window.addEventListener('hashchange', resolveHash);

    /* ==========================================================================
       Sidebar Nav Click Handler
       ========================================================================== */
    document.addEventListener('click', (e) => {
        const link = e.target.closest('.list-group-item[data-target]');
        if (!link) return;
        e.preventDefault();

        const sectionId = link.getAttribute('data-target');
        const demoUrl = link.getAttribute('data-demo') || null;
        const docFile = link.getAttribute('data-doc-file') || null;

        activateSection(sectionId, demoUrl, { pushHash: true, docFile });
    });

    /* ==========================================================================
       Dynamic Demo Generation from test-envs
       ========================================================================== */
    const loadDemos = async () => {
        const sandboxCollapse = document.getElementById('sandboxCollapse');
        if (!sandboxCollapse) return;

        try {
            const res = await fetch('test-envs/manifest.json');
            if (!res.ok) return;
            const demos = await res.json();

            if (demos.length > 0) {
                sandboxCollapse.innerHTML = '';

                demos.forEach(({ name, path }) => {
                    const demoName = name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    const a = document.createElement('a');
                    a.href = buildHash('sandbox', path);
                    a.className = 'list-group-item list-group-item-action bg-transparent text-white fw-medium mb-1';
                    a.setAttribute('data-target', 'sandbox');
                    a.setAttribute('data-demo', path);
                    a.textContent = demoName;
                    sandboxCollapse.appendChild(a);
                });
            }
        } catch (e) {
            console.error('Failed to load demos manifest:', e);
        }
    };

    /* ==========================================================================
       Component Playground — JSON-model renderer
       ========================================================================== */

    /**
     * Interpolate a template string using current prop values and the model definitions.
     * Replaces every {{propId}} token. If the prop has an "attribute" defined, it renders 'attr="value"' or 'attr' (for boolean).
     */
    const interpolateTemplate = (template, values, model) => {
        const html = template.replace(/\{\{([\w-]+)\}\}/g, (_, key) => {
            if (!(key in values)) return '';

            const propDef = model.props.find(p => p.id === key);
            const val = values[key];

            // Repeater: render child elements inline
            if (propDef && propDef.type === 'repeater') {
                const items = Array.isArray(val) ? val : [];
                return items.map(item => {
                    // Determine child tag — _fieldType (multi-type repeater) > legacy type check > childTag default
                    let childTag;
                    if (item._fieldType) {
                        childTag = item._fieldType;
                    } else {
                        childTag = propDef.childTag || '';
                    }

                    const isDropdown = false;

                    // Resolve the props definition for this specific field type
                    const fieldTypeDef = (propDef.fieldTypes || []).find(ft => ft.tag === childTag);
                    const itemPropsDef = fieldTypeDef ? fieldTypeDef.props : (propDef.props || []);

                    const attrs = itemPropsDef
                        .filter(p => !p.innerContent)
                        .map(p => {
                            if (!item[p.id] && item[p.id] !== false) return '';
                            const attrName = p.attribute || p.id;
                            // Suppress 'type' only when it's used as a tag-switcher (no explicit attribute mapping)
                            if (p.id === 'type' && !p.attribute) return '';
                            if (p.type === 'boolean') return item[p.id] ? attrName : '';
                            return `${attrName}="${escAttr(String(item[p.id]))}"`;
                        })
                        .filter(Boolean);

                    // innerContent props render as inner HTML, not attributes
                    const innerContentProp = itemPropsDef.find(p => p.innerContent);
                    let content = innerContentProp ? (item[innerContentProp.id] || '') : '';


                    return `<${childTag} ${attrs.join(' ')}>${content}</${childTag}>`;
                }).join('\n  ');
            }

            // If it's specifically mapped to an HTML attribute
            if (propDef && propDef.attribute) {
                if (propDef.type === 'boolean') {
                    // Boolean attributes: just the name if true, empty if false
                    return val ? propDef.attribute : '';
                } else {
                    // String attributes: attr="value" if not empty, empty otherwise
                    return val ? `${propDef.attribute}="${escAttr(val)}"` : '';
                }
            }

            // Otherwise, just inject the raw string value
            return String(val);
        });

        // Collapse multiple spaces left by empty attribute slots (preserve newlines)
        return html.replace(/ {2,}/g, ' ').replace(/ >/g, '>');
    };

    /**
     * Build a current-values map from the model defaults.
     */
    const buildDefaults = (model) => {
        const vals = {};
        for (const prop of model.props) {
            if (prop.type === 'boolean') {
                vals[prop.id] = !!prop.default;
            } else if (prop.type === 'repeater') {
                vals[prop.id] = (prop.default || []).map(item => ({ ...item }));
            } else {
                vals[prop.id] = String(prop.default ?? '');
            }
        }
        return vals;
    };

    /**
     * Build a complete HTML document string for rendering inside a sandboxed iframe.
     * Uses the parent origin as <base> so relative asset paths resolve correctly.
     * @param {string} snippet - HTML snippet to render
     * @param {string} scriptSrc - primary component script path
     * @param {string[]} depScripts - additional dependency component script paths
     */
    const buildIframeSrcdoc = (snippet, scriptSrc, depScripts = []) => {
        const base = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
        const depTags = depScripts.map(src => `<script type="module" src="${src}"><\/script>`).join('\n');
        return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<base href="${base}">
<style>
    body {
        margin: 0;
        padding: 1rem;
        min-height: 180px;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background-color: transparent;
        box-sizing: border-box;
    }
    .ui-wrap {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }
</style>
<script src="component-assets/js/theme-engine.js"><\/script>
<link rel="stylesheet" href="dist/css/styles.min.css">
</head>
<body>
<div class="ui-wrap">${snippet}</div>
${depTags}
${scriptSrc ? `<script type="module" src="${scriptSrc}"><\/script>` : ''}
</body>
</html>`;
    };

    /**
     * Render the inner HTML for a repeater's items list.
     * Called both during initial build and after add/remove events.
     */
    const renderRepeaterItemsHTML = (prop, items) => {
        return items.map((item, idx) => {
            // Resolve props for this item — field type overrides generic prop list
            const fieldTypeDef = (prop.fieldTypes || []).find(ft => ft.tag === item._fieldType);
            const itemPropsDef = fieldTypeDef ? fieldTypeDef.props : (prop.props || []);
            const itemTypeLabel = fieldTypeDef ? fieldTypeDef.label : (prop.itemLabel || 'Item');

            return `
            <div class="comp-repeater-item" data-repeater-index="${idx}">
                <div class="comp-repeater-item-header">
                    <span class="comp-repeater-item-title">${itemTypeLabel} ${idx + 1}</span>
                    <button class="comp-repeater-remove" data-remove-repeater="${prop.id}" data-index="${idx}" type="button" title="Remove">
                        <i class="fal fa-xmark"></i>
                    </button>
                </div>
                ${itemPropsDef.map(p => {
                    let control = '';
                    if (p.type === 'select') {
                        const optionsHTML = (p.options || []).map(o =>
                            `<option value="${escAttr(o.value)}"${o.value === (item[p.id] ?? p.default) ? ' selected' : ''}>${escAttr(o.label)}</option>`
                        ).join('');
                        control = `<select data-repeater="${prop.id}" data-index="${idx}" data-prop="${p.id}">${optionsHTML}</select>`;
                    } else if (p.type === 'boolean') {
                        const checked = (item[p.id] ?? p.default) ? 'checked' : '';
                        control = `<label class="comp-prop-toggle">
                            <input type="checkbox" data-repeater="${prop.id}" data-index="${idx}" data-prop="${p.id}" ${checked} />
                            <span class="comp-prop-toggle-label">${(item[p.id] ?? p.default) ? 'On' : 'Off'}</span>
                        </label>`;
                    } else if (p.type === 'code') {
                        const codeVal = String(item[p.id] ?? p.default ?? '');
                        control = `<div class="comp-code-editor" data-code-prop="${p.id}">
                            <pre class="comp-code-highlight" aria-hidden="true"><code class="language-html"></code></pre>
                            <textarea class="comp-code-textarea" data-repeater="${prop.id}" data-index="${idx}" data-prop="${p.id}" rows="${p.rows ?? 3}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">${escAttr(codeVal)}</textarea>
                        </div>`;
                    } else {
                        control = `<input type="text" data-repeater="${prop.id}" data-index="${idx}" data-prop="${p.id}" value="${escAttr(String(item[p.id] ?? ''))}" autocomplete="off" />`;
                    }
                    return `
                <div class="comp-prop-row comp-prop-row--nested${p.type === 'code' ? ' comp-prop-row--code' : ''}">
                    <div class="comp-prop-label-wrap">
                        <span class="comp-prop-label">${p.label}</span>
                        <span class="comp-prop-badge">${p.id}</span>
                    </div>
                    <div>${control}</div>
                </div>`;
                }).join('')}
            </div>`;
        }).join('');
    };

    /**
     * Build the full playground section innerHTML from a component.json model.
     * Returns an HTMLElement (div.comp-page) ready to be inserted.
     * @param {object} model - component.json model
     * @param {string} sectionId - unique section ID
     * @param {string} componentPath - path to the component folder, e.g. "components/button/"
     */
    const buildPlayground = (model, sectionId, componentPath = '') => {
        const defaults = buildDefaults(model);

        // ── Derive component script src from path ────────────────────────────
        const compName = componentPath.split('/').filter(Boolean).pop() || '';
        const componentScriptSrc = compName ? `${componentPath}${compName}.js` : '';

        // ── Resolve dependency script paths from model.dependencies ──────────
        const depScriptSrcs = (model.dependencies || []).map(depPath => {
            const depName = depPath.split('/').filter(Boolean).pop() || '';
            return depName ? `${depPath}${depName}.js` : null;
        }).filter(Boolean);

        // ── Group props by their 'group' field ──────────────────────────────
        const groups = {};
        for (const prop of model.props) {
            const g = prop.group || 'Properties';
            if (!groups[g]) groups[g] = [];
            groups[g].push(prop);
        }

        // ── Build props form HTML ────────────────────────────────────────────
        let propsHTML = '';
        for (const [groupName, props] of Object.entries(groups)) {
            propsHTML += `<div class="comp-prop-group">${groupName}</div>`;
            for (const prop of props) {
                let control = '';

                if (prop.type === 'text') {
                    control = `<input type="text" data-prop="${prop.id}" value="${escAttr(String(prop.default ?? ''))}" autocomplete="off" />`;

                } else if (prop.type === 'select') {
                    const optionsHTML = (prop.options || []).map(o =>
                        `<option value="${escAttr(o.value)}"${o.value === prop.default ? ' selected' : ''}>${escAttr(o.label)}</option>`
                    ).join('');
                    control = `<select data-prop="${prop.id}">${optionsHTML}</select>`;

                } else if (prop.type === 'boolean') {
                    const checked = prop.default ? 'checked' : '';
                    control = `<label class="comp-prop-toggle">
                        <input type="checkbox" data-prop="${prop.id}" ${checked} />
                        <span class="comp-prop-toggle-label">${prop.default ? 'On' : 'Off'}</span>
                    </label>`;

                } else if (prop.type === 'range') {
                    const unit = prop.unit || '';
                    control = `<div class="comp-prop-range-wrap">
                        <input type="range" data-prop="${prop.id}"
                               min="${prop.min ?? 0}" max="${prop.max ?? 100}" step="${prop.step ?? 1}"
                               value="${prop.default ?? prop.min ?? 0}" />
                        <span class="comp-prop-range-val">${prop.default ?? prop.min ?? 0}${unit}</span>
                    </div>`;

                } else if (prop.type === 'color') {
                    control = `<div class="comp-prop-color-wrap">
                        <input type="color" data-prop="${prop.id}" value="${escAttr(String(prop.default ?? '#000000'))}" />
                        <span class="comp-prop-color-hex">${prop.default ?? '#000000'}</span>
                    </div>`;

                } else if (prop.type === 'code') {
                    const codeDefault = String(prop.default ?? '');
                    control = `<div class="comp-code-editor" data-code-prop="${prop.id}">
                        <pre class="comp-code-highlight" aria-hidden="true"><code class="language-html"></code></pre>
                        <textarea class="comp-code-textarea" data-prop="${prop.id}" rows="${prop.rows ?? 4}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">${escAttr(codeDefault)}</textarea>
                    </div>`;

                } else if (prop.type === 'repeater') {
                    const defaultItems = Array.isArray(prop.default) ? prop.default : [];
                    const hasFieldTypes = Array.isArray(prop.fieldTypes) && prop.fieldTypes.length > 0;

                    const addButtonHTML = hasFieldTypes
                        ? `<div class="comp-repeater-add-wrap" data-repeater-wrap="${prop.id}">
                            <button class="comp-repeater-add comp-repeater-add--dropdown"
                                    data-toggle-repeater-menu="${prop.id}" type="button">
                                <i class="fal fa-plus"></i> Add ${escAttr(prop.itemLabel || 'Item')}
                                <i class="fal fa-chevron-down comp-repeater-add-chevron"></i>
                            </button>
                            <ul class="comp-repeater-add-menu" id="${sectionId}-menu-${prop.id}">
                                ${prop.fieldTypes.map(ft => `
                                <li>
                                    <button data-add-repeater="${prop.id}" data-field-type="${ft.tag}" type="button">
                                        ${escAttr(ft.label)}
                                    </button>
                                </li>`).join('')}
                            </ul>
                        </div>`
                        : `<button class="comp-repeater-add" data-add-repeater="${prop.id}" type="button">
                            <i class="fal fa-plus"></i> Add ${escAttr(prop.itemLabel || 'Item')}
                        </button>`;

                    propsHTML += `<div class="comp-prop-repeater-section">
                        <div class="comp-prop-repeater-header">
                            <span class="comp-prop-label">${prop.label}</span>
                        </div>
                        <div class="comp-repeater" data-repeater-id="${prop.id}">
                            <div class="comp-repeater-items" id="${sectionId}-repeater-${prop.id}">
                                ${renderRepeaterItemsHTML(prop, defaultItems)}
                            </div>
                            ${addButtonHTML}
                        </div>
                    </div>`;
                    continue;
                }

                const badgeText = getBadgeText(prop);
                propsHTML += `<div class="comp-prop-row">
                    <div class="comp-prop-label-wrap">
                        <span class="comp-prop-label">${prop.label}</span>
                        <span class="comp-prop-badge" data-badge-prop="${prop.id}">${badgeText}</span>
                    </div>
                    <div>${control}</div>
                </div>`;
            }
        }

        // ── Assemble the page ────────────────────────────────────────────────
        const page = document.createElement('div');
        page.className = 'comp-page';
        page.innerHTML = `
            <!-- Header -->
            <div class="comp-header">
                <h1 class="comp-header__title">${model.title}</h1>
                <p class="comp-header__desc">${model.description}</p>
            </div>

            <!-- Preview window -->
            <div class="comp-preview-card">
                <div class="comp-preview-bar">
                    <div class="w-100">
                    </div>
                    <div class="code-view-actions btn-group btn-group-sm rounded-0">
                        <button class="btn sandbox-code-btn rounded-0 btn-sm" id="${sectionId}-fullscreen" title="Open in new tab" aria-label="Open preview in new tab">
                            <i class="fal fa-arrow-up-right-from-square"></i>
                        </button>
                        <button class="btn sandbox-code-btn rounded-0 btn-sm" id="${sectionId}-code-toggle" title="View Code" aria-label="Toggle code view">
                            <i class="fal fa-code"></i>
                        </button>
                        <button class="btn sandbox-code-btn rounded-0 btn-sm" id="${sectionId}-code-copy" title="Copy Code" aria-label="Copy generated code">
                            <i class="fal fa-clipboard"></i>
                        </button>
                    </div>
                </div>
                <iframe class="comp-preview-window" id="${sectionId}-preview" frameborder="0" scrolling="no" allowtransparency="true"></iframe>
                <div class="comp-code-panel d-none" id="${sectionId}-code-panel">
                    <pre class="m-0"><code id="${sectionId}-code-output" class="language-html"></code></pre>
                </div>
            </div>

            <!-- Props panel -->
            <div class="comp-props-card">
                <div class="comp-props-header">
                    <i class="fal fa-sliders" style="font-size:0.85rem;"></i> Properties
                    <button class="comp-props-reset ms-auto" id="${sectionId}-props-reset" title="Reset to defaults" aria-label="Reset props to defaults">
                        <i class="fal fa-rotate-left"></i> Reset
                    </button>
                </div>
                <div class="comp-props-body" id="${sectionId}-props">
                    ${propsHTML}
                </div>
            </div>
        `;

        // ── Wire up live controls ────────────────────────────────────────────
        // Defer until after the element is in the DOM (called by caller)
        page._wireControls = () => {
            const propsBody = page.querySelector(`#${sectionId}-props`);
            const previewFrame = page.querySelector(`#${sectionId}-preview`);
            const codeOutput = page.querySelector(`#${sectionId}-code-output`);
            const codePanel = page.querySelector(`#${sectionId}-code-panel`);
            const codeToggleBtn = page.querySelector(`#${sectionId}-code-toggle`);
            const codeCopyBtn = page.querySelector(`#${sectionId}-code-copy`);
            const fullscreenBtn  = page.querySelector(`#${sectionId}-fullscreen`);
            const resetBtn       = page.querySelector(`#${sectionId}-props-reset`);
            if (!propsBody || !previewFrame) return;

            // ── localStorage persistence ─────────────────────────────────────
            const storageKey = `elm-props-${sectionId}`;

            const saveProps = (values) => {
                try { localStorage.setItem(storageKey, JSON.stringify(values)); } catch (_) {}
            };

            const loadProps = () => {
                try {
                    const raw = localStorage.getItem(storageKey);
                    return raw ? JSON.parse(raw) : null;
                } catch (_) { return null; }
            };

            const applyValuesToControls = (values) => {
                for (const [id, val] of Object.entries(values)) {
                    const input = propsBody.querySelector(`[data-prop="${id}"]`);
                    if (!input) continue;
                    if (input.type === 'checkbox') {
                        input.checked = !!val;
                        const lbl = input.nextElementSibling;
                        if (lbl) lbl.textContent = val ? 'On' : 'Off';
                    } else {
                        input.value = val;
                    }
                }
                // Re-sync all code editors after value injection
                propsBody.querySelectorAll('.comp-code-editor').forEach(syncCodeEditor);
            };

            // Snapshot of current values — start at defaults, overlay saved if present
            const currentValues = { ...defaults };
            const saved = loadProps();
            if (saved) Object.assign(currentValues, saved);

            const formatSnippet = (snippet) => {
                // Collapse runs of spaces (not newlines) left by empty attribute slots
                // Then split adjacent tags onto their own lines so beautify indents correctly
                const cleaned = snippet.replace(/ {2,}/g, ' ').trim().replace(/></g, '>\n<');
                if (typeof html_beautify !== 'undefined') {
                    return html_beautify(cleaned, {
                        indent_size: 2,
                        wrap_attributes: 'auto',
                        wrap_line_length: 120,
                        inline: [],
                        extra_liners: [],
                    });
                }
                return cleaned;
            };

            const updateCodePanel = (snippet) => {
                if (!codeOutput) return;
                codeOutput.textContent = formatSnippet(snippet);
                if (typeof hljs !== 'undefined') {
                    delete codeOutput.dataset.highlighted;
                    hljs.highlightElement(codeOutput);
                }
            };

            // Track whether the iframe's document is ready (CSS + scripts loaded)
            let iframeReady = false;

            const fitFrame = () => {
                try {
                    const h = previewFrame.contentDocument?.body?.scrollHeight;
                    if (h) previewFrame.style.height = Math.max(180, h) + 'px';
                } catch (_) {}
            };

            previewFrame.addEventListener('load', () => {
                iframeReady = true;
                setTimeout(() => {
                    fitFrame();
                    try {
                    } catch (_) {}
                }, 1000);
            });

            const renderPreview = (snippet) => {
                if (iframeReady && previewFrame.contentDocument?.body) {
                    previewFrame.contentDocument.body.innerHTML = `<div class="ui-wrap">${snippet}</div>`;
                    fitFrame();
                } else {
                    previewFrame.srcdoc = buildIframeSrcdoc(snippet, componentScriptSrc, depScriptSrcs);
                }
            };

            const rerender = () => {
                const snippet = interpolateTemplate(model.template, currentValues, model);
                renderPreview(snippet);
                updateCodePanel(snippet);
                saveProps(currentValues);
            };

            // ── Code editor widgets ──────────────────────────────────────────
            // For each comp-code-editor, sync the textarea value into the
            // highlighted <pre><code> overlay on every keystroke.
            const syncCodeEditor = (editor) => {
                const textarea = editor.querySelector('.comp-code-textarea');
                const pre      = editor.querySelector('.comp-code-highlight');
                const codeEl   = pre?.querySelector('code');
                if (!textarea || !pre || !codeEl) return;

                const highlight = () => {
                    // Trailing newline ensures last line renders at full height
                    codeEl.textContent = textarea.value + '\n';
                    if (typeof hljs !== 'undefined') {
                        delete codeEl.dataset.highlighted;
                        hljs.highlightElement(codeEl);
                    }
                    // Keep pre scroll in lock-step with the textarea
                    pre.scrollTop  = textarea.scrollTop;
                    pre.scrollLeft = textarea.scrollLeft;
                };

                textarea.addEventListener('input', highlight);
                textarea.addEventListener('scroll', () => {
                    pre.scrollTop  = textarea.scrollTop;
                    pre.scrollLeft = textarea.scrollLeft;
                });

                // Initial highlight
                highlight();
            };

            propsBody.querySelectorAll('.comp-code-editor').forEach(syncCodeEditor);

            // Apply saved values to controls (after DOM is ready)
            if (saved) applyValuesToControls(currentValues);

            // Seed initial render and code panel
            const initialSnippet = interpolateTemplate(model.template, currentValues, model);
            renderPreview(initialSnippet);
            updateCodePanel(initialSnippet);

            // Reset button — restore defaults, clear storage, re-apply controls
            resetBtn?.addEventListener('click', () => {
                Object.assign(currentValues, defaults);
                applyValuesToControls(currentValues);
                try { localStorage.removeItem(storageKey); } catch (_) {}
                rerender();
            });

            // Toggle code panel
            codeToggleBtn?.addEventListener('click', () => {
                const isHidden = codePanel.classList.contains('d-none');
                codePanel.classList.toggle('d-none', !isHidden);
                codeToggleBtn.classList.toggle('active', isHidden);
            });

            // Open-in-new-tab button
            fullscreenBtn?.addEventListener('click', () => {
                const snippet = interpolateTemplate(model.template, currentValues, model);
                const html = buildIframeSrcdoc(snippet, componentScriptSrc, depScriptSrcs);
                const blob = new Blob([html], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
                setTimeout(() => URL.revokeObjectURL(url), 15000);
            });

            // Copy button
            codeCopyBtn?.addEventListener('click', async () => {
                const snippet = formatSnippet(interpolateTemplate(model.template, currentValues, model));
                const icon = codeCopyBtn.querySelector('i');
                if (icon) {
                    icon.className = 'fal fa-clipboard-check';
                    setTimeout(() => { icon.className = 'fal fa-clipboard'; }, 1800);
                }
                try {
                    await navigator.clipboard.writeText(snippet);
                } catch {
                    const ta = document.createElement('textarea');
                    ta.value = snippet;
                    ta.style.position = 'fixed'; ta.style.opacity = '0';
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand('copy');
                    document.body.removeChild(ta);
                }
            });

            // ── Repeater: add / remove items ────────────────────────────────
            propsBody.addEventListener('click', (e) => {
                // Toggle the field-type dropdown menu
                const toggleBtn = e.target.closest('[data-toggle-repeater-menu]');
                if (toggleBtn) {
                    const wrap = toggleBtn.closest('.comp-repeater-add-wrap');
                    if (wrap) wrap.classList.toggle('is-open');
                    e.stopPropagation();
                    return;
                }

                const addBtn = e.target.closest('[data-add-repeater]');
                if (addBtn) {
                    const repeaterId = addBtn.dataset.addRepeater;
                    const fieldType  = addBtn.dataset.fieldType;   // present when chosen from dropdown
                    const repeaterProp = model.props.find(p => p.id === repeaterId);
                    if (!repeaterProp) return;

                    // Close dropdown if open
                    const wrap = addBtn.closest('.comp-repeater-add-wrap');
                    if (wrap) wrap.classList.remove('is-open');

                    // Resolve which props to initialise for this item
                    const fieldTypeDef = (repeaterProp.fieldTypes || []).find(ft => ft.tag === fieldType);
                    const propsToInit  = fieldTypeDef ? fieldTypeDef.props : (repeaterProp.props || []);

                    const newItem = {};
                    if (fieldType) newItem._fieldType = fieldType;
                    for (const p of propsToInit) {
                        newItem[p.id] = p.default !== undefined ? p.default : '';
                    }

                    currentValues[repeaterId].push(newItem);
                    const container = propsBody.querySelector(`#${sectionId}-repeater-${repeaterId}`);
                    if (container) {
                        container.innerHTML = renderRepeaterItemsHTML(repeaterProp, currentValues[repeaterId]);
                        container.querySelectorAll('.comp-code-editor').forEach(syncCodeEditor);
                    }
                    rerender();
                    return;
                }

                const removeBtn = e.target.closest('[data-remove-repeater]');
                if (removeBtn) {
                    const repeaterId = removeBtn.dataset.removeRepeater;
                    const index = parseInt(removeBtn.dataset.index, 10);
                    const repeaterProp = model.props.find(p => p.id === repeaterId);
                    if (!repeaterProp) return;
                    currentValues[repeaterId].splice(index, 1);
                    const container = propsBody.querySelector(`#${sectionId}-repeater-${repeaterId}`);
                    if (container) {
                        container.innerHTML = renderRepeaterItemsHTML(repeaterProp, currentValues[repeaterId]);
                        container.querySelectorAll('.comp-code-editor').forEach(syncCodeEditor);
                    }
                    rerender();
                }
            });

            propsBody.addEventListener('input', (e) => {
                const el = e.target;
                const prop = el.dataset.prop;
                if (!prop) return;

                // Repeater sub-prop input
                if (el.dataset.repeater !== undefined) {
                    const repeaterId = el.dataset.repeater;
                    const index = parseInt(el.dataset.index, 10);
                    if (el.type === 'checkbox') {
                        currentValues[repeaterId][index][prop] = el.checked;
                        // Update toggle label
                        const lbl = el.nextElementSibling;
                        if (lbl) lbl.textContent = el.checked ? 'On' : 'Off';
                    } else {
                        currentValues[repeaterId][index][prop] = el.value;
                    }
                    rerender();
                    return;
                }

                if (el.type === 'checkbox') {
                    const isChecked = el.checked;
                    currentValues[prop] = isChecked;
                    // Update toggle label
                    const lbl = el.nextElementSibling;
                    if (lbl) lbl.textContent = isChecked ? 'On' : 'Off';

                } else if (el.type === 'range') {
                    const unit = model.props.find(p => p.id === prop)?.unit || '';
                    currentValues[prop] = el.value;
                    const valDisplay = el.closest('.comp-prop-range-wrap')?.querySelector('.comp-prop-range-val');
                    if (valDisplay) valDisplay.textContent = el.value + unit;

                } else if (el.type === 'color') {
                    currentValues[prop] = el.value;
                    const hexDisplay = el.nextElementSibling;
                    if (hexDisplay) hexDisplay.textContent = el.value;

                } else {
                    currentValues[prop] = el.value;
                }

                rerender();
            });

            // Handle select change events (for repeater selects)
            propsBody.addEventListener('change', (e) => {
                const el = e.target;
                const prop = el.dataset.prop;
                if (!prop) return;

                // Repeater sub-prop select
                if (el.dataset.repeater !== undefined && el.tagName === 'SELECT') {
                    const repeaterId = el.dataset.repeater;
                    const index = parseInt(el.dataset.index, 10);
                    currentValues[repeaterId][index][prop] = el.value;
                    rerender();
                    return;
                }

                // Regular select
                if (el.tagName === 'SELECT') {
                    currentValues[prop] = el.value;
                    rerender();
                }
            });
        };

        return page;
    };

    /** Returns the attribute badge text for a prop given its current value */
    const getBadgeText = (prop) => prop.attribute || '';

    /** Minimal attribute-safe escaper */
    const escAttr = (s) => String(s)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    /* ==========================================================================
       Dynamic Component Generation from components folder
       ========================================================================== */
    const loadComponents = async () => {
        const componentsCollapse = document.getElementById('componentsCollapse');
        const pageContentWrapper = document.getElementById('page-content-wrapper');
        const sandboxNode = document.getElementById('sandbox');

        if (!componentsCollapse) return;

        componentsCollapse.innerHTML = '';
        let firstComponentId = null;

        const processEntry = async (entry, container, paddingLevel) => {
            if (entry.children) {
                // ── Collapsible category group ───────────────────────────────
                const collapseId = `collapse-cat-${entry.name}`;
                const titleName = entry.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

                const toggleA = document.createElement('a');
                toggleA.href = '#';
                toggleA.className = `list-group-item list-group-item-action bg-transparent text-white fw-medium mb-1 py-2 ps-${paddingLevel} d-flex justify-content-between align-items-center opacity-75`;
                toggleA.setAttribute('data-bs-toggle', 'collapse');
                toggleA.setAttribute('data-bs-target', `#${collapseId}`);
                toggleA.setAttribute('aria-expanded', 'true');
                toggleA.innerHTML = `<span>${titleName}</span> <i class="fal fa-chevron-down small text-white-50 chevron-animated"></i>`;
                container.appendChild(toggleA);

                const collapseDiv = document.createElement('div');
                collapseDiv.className = 'collapse show';
                collapseDiv.id = collapseId;
                container.appendChild(collapseDiv);

                for (const child of entry.children) {
                    await processEntry(child, collapseDiv, paddingLevel + 1);
                }
            } else {
                // ── Component ────────────────────────────────────────────────
                const { name, path } = entry;
                const sectionId = `comp-${name}`;
                const titleName = name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

                if (!firstComponentId) firstComponentId = sectionId;

                // Sidebar link
                const a = document.createElement('a');
                a.href = `#${sectionId}`;
                a.className = `list-group-item list-group-item-action bg-transparent text-white fw-medium mb-1 py-2 ps-${paddingLevel}`;
                a.setAttribute('data-target', sectionId);
                a.textContent = titleName;
                container.appendChild(a);

                // Content section
                const section = document.createElement('div');
                section.className = 'container-fluid p-0 content-section d-none';
                section.id = sectionId;

                const modelRes = await fetch(`${path}component.json`);
                if (modelRes.ok) {
                    let model;
                    try { model = await modelRes.json(); } catch { model = null; }

                    if (model) {
                        const playground = buildPlayground(model, sectionId, path);
                        section.appendChild(playground);
                        pageContentWrapper.insertBefore(section, sandboxNode);
                        playground._wireControls?.();
                    } else {
                        const htmlRes = await fetch(`${path}index.html`);
                        const contentHtml = htmlRes.ok ? await htmlRes.text() : '';
                        section.innerHTML = `<elm-preview><div class="ui-wrap">${contentHtml}</div></elm-preview>`;
                        pageContentWrapper.insertBefore(section, sandboxNode);
                    }
                } else {
                    const htmlRes = await fetch(`${path}index.html`);
                    const contentHtml = htmlRes.ok ? await htmlRes.text() : '';
                    section.classList.add('p-4', 'p-md-5');
                    section.innerHTML = `<elm-preview><div class="ui-wrap">${contentHtml}</div></elm-preview>`;
                    pageContentWrapper.insertBefore(section, sandboxNode);
                }

                // Load component JS if present
                const scriptRes = await fetch(`${path}${name}.js`);
                if (scriptRes.ok) {
                    const script = document.createElement('script');
                    script.type = 'module';
                    script.src = `${path}${name}.js`;
                    document.body.appendChild(script);
                }
            }
        };

        try {
            const res = await fetch('components/manifest.json');
            if (!res.ok) return;
            const manifest = await res.json();

            for (const entry of manifest) {
                await processEntry(entry, componentsCollapse, 4);
            }
        } catch (e) {
            console.error('Failed to load components manifest:', e);
        }

        // After all dynamic content is injected, retry any pending route
        if (pendingRoute) {
            let { sectionId, demoUrl, docFile } = pendingRoute;
            pendingRoute = null;

            if (sectionId === 'auto-first' && firstComponentId) {
                sectionId = firstComponentId;
            }

            activateSection(sectionId, demoUrl, { docFile });
        }
    };



    /* ==========================================================================
       Dark Mode Toggle Logic
       Uses color-scheme on <html> so light-dark() tokens resolve automatically.
       isDarkMode is initialized from localStorage, falling back to OS preference.
       ========================================================================== */
    // Reset all component props — clears every elm-props-* key from localStorage
    document.getElementById('open-all-groups')?.addEventListener('click', () => {
        document.querySelectorAll('.sidebar-section-trigger[data-bs-toggle="collapse"]').forEach(trigger => {
            const targetId = trigger.getAttribute('data-bs-target');
            const collapseEl = document.querySelector(targetId);
            if (collapseEl && !collapseEl.classList.contains('show')) {
                bootstrap.Collapse.getOrCreateInstance(collapseEl).show();
            }
        });
    });

    document.getElementById('collapse-all-groups')?.addEventListener('click', () => {
        document.querySelectorAll('.sidebar-section-trigger[data-bs-toggle="collapse"]').forEach(trigger => {
            const targetId = trigger.getAttribute('data-bs-target');
            const collapseEl = document.querySelector(targetId);
            if (collapseEl && collapseEl.classList.contains('show')) {
                bootstrap.Collapse.getOrCreateInstance(collapseEl).hide();
            }
        });
    });

    document.getElementById('reset-all-props')?.addEventListener('click', () => {
        const keys = Object.keys(localStorage).filter(k => k.startsWith('elm-props-'));
        keys.forEach(k => localStorage.removeItem(k));
        // Click each visible reset button to also update the live controls
        document.querySelectorAll('.comp-props-reset').forEach(btn => btn.click());
    });

    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle?.querySelector('i');
    const themeLabel = themeToggle?.querySelector('span');
    const hljsThemeLink = document.getElementById('hljs-theme-link');

    // Initialize from storage, default to light
    let isDarkMode = (() => {
        const stored = localStorage.getItem('elm-color-scheme');
        return stored === 'dark';
    })();

    // Resolve a CSS colour expression to a normalised [r, g, b] triple (0–1 each)
    const resolveCssColor = (expr) => {
        const tmp = document.createElement('span');
        tmp.style.cssText = `position:absolute;visibility:hidden;color:${expr}`;
        document.body.appendChild(tmp);
        const raw = getComputedStyle(tmp).color; // "rgb(r, g, b)"
        document.body.removeChild(tmp);
        const m = raw.match(/\d+/g);
        return m ? [+m[0] / 255, +m[1] / 255, +m[2] / 255] : [1, 1, 1];
    };

    // Walk a Lottie data object and replace solid-white fills with `color`
    const patchLottieWhiteFills = (data, color) => {
        const clone = JSON.parse(JSON.stringify(data));
        const isWhite = (k) => Array.isArray(k) && k[0] >= 0.99 && k[1] >= 0.99 && k[2] >= 0.99;
        const walk = (obj) => {
            if (Array.isArray(obj)) { obj.forEach(walk); return; }
            if (!obj || typeof obj !== 'object') return;
            if (obj.ty === 'fl' && obj.c?.k && !obj.c.a && isWhite(obj.c.k)) {
                obj.c.k = [...color, 1];
            }
            Object.values(obj).forEach(walk);
        };
        walk(clone);
        return clone;
    };

    let _lottieSourceData = null;
    const syncLottieColor = async () => {
        const lottieEl = document.getElementById('hero-lottie');
        if (!lottieEl) return;
        if (!_lottieSourceData) {
            const res = await fetch('elementary-assets/elementary-logo-animation.json');
            _lottieSourceData = await res.json();
        }
        const color = resolveCssColor('var(--elm-text-default)');
        lottieEl.load(patchLottieWhiteFills(_lottieSourceData, color));
    };

    const applyColorScheme = (dark) => {
        const scheme = dark ? 'dark' : 'light';
        document.documentElement.style.colorScheme = scheme;
        localStorage.setItem('elm-color-scheme', scheme);
        if (themeIcon) themeIcon.className = dark ? 'fal fa-sun' : 'fal fa-moon-stars';
        if (themeLabel) themeLabel.textContent = dark ? 'Light Mode' : 'Dark Mode';
        syncHljsTheme(dark);
        syncLottieColor();
    };

    const syncHljsTheme = (dark) => {
        if (!hljsThemeLink) return;
        hljsThemeLink.href = dark
            ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css'
            : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css';
    };

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            isDarkMode = !isDarkMode;
            applyColorScheme(isDarkMode);
        });
    }

    // Apply on load (FOUC script handles very first paint; this syncs UI state)
    applyColorScheme(isDarkMode);



    /* ==========================================================================
       Sidebar Collapse Chevron Logic
       ========================================================================== */
    const collapses = document.querySelectorAll('.collapse');
    collapses.forEach(collapse => {
        collapse.addEventListener('show.bs.collapse', (e) => {
            const btn = document.querySelector(`[data-bs-target="#${e.target.id}"] i.fa-chevron-down`);
            if (btn) btn.classList.add('chevron-rotated');
        });
        collapse.addEventListener('hide.bs.collapse', (e) => {
            const btn = document.querySelector(`[data-bs-target="#${e.target.id}"] i.fa-chevron-down`);
            if (btn) btn.classList.remove('chevron-rotated');
        });

        if (collapse.classList.contains('show')) {
            const btn = document.querySelector(`[data-bs-target="#${collapse.id}"] i.fa-chevron-down`);
            if (btn) btn.classList.add('chevron-rotated');
        }
    });

    /* ==========================================================================
       Sidebar Nav Bloom — cursor-tracking radial glow on list-group-items
       ========================================================================== */
    const sidebarWrapper = document.getElementById('sidebar-wrapper');

    if (sidebarWrapper) {
        sidebarWrapper.addEventListener('mousemove', (e) => {
            const item = e.target.closest('.list-group-item');
            if (!item) return;
            const rect = item.getBoundingClientRect();
            item.style.setProperty('--bx', `${e.clientX - rect.left}px`);
            item.style.setProperty('--by', `${e.clientY - rect.top}px`);
        });

        sidebarWrapper.addEventListener('mouseleave', () => {
            sidebarWrapper.querySelectorAll('.list-group-item').forEach(item => {
                item.style.setProperty('--bx', '-200px');
            });
        });
    }

    /* ==========================================================================
       Bootstrap: update chevrons on dynamically-added collapses
       ========================================================================== */
    // Re-runs after component injection to wire up newly created collapse elements
    const wireNewCollapses = () => {
        document.querySelectorAll('.collapse').forEach(collapse => {
            if (collapse.dataset.chevronWired) return;
            collapse.dataset.chevronWired = '1';

            collapse.addEventListener('show.bs.collapse', (e) => {
                const btn = document.querySelector(`[data-bs-target="#${e.target.id}"] i.fa-chevron-down`);
                if (btn) btn.classList.add('chevron-rotated');
            });
            collapse.addEventListener('hide.bs.collapse', (e) => {
                const btn = document.querySelector(`[data-bs-target="#${e.target.id}"] i.fa-chevron-down`);
                if (btn) btn.classList.remove('chevron-rotated');
            });
            if (collapse.classList.contains('show')) {
                const btn = document.querySelector(`[data-bs-target="#${collapse.id}"] i.fa-chevron-down`);
                if (btn) btn.classList.add('chevron-rotated');
            }
        });
    };

    /* ==========================================================================
       Docs Section Loader
       ========================================================================== */
    const loadDocs = async () => {
        const docsCollapse = document.getElementById('docsCollapse');
        if (!docsCollapse) return;
        try {
            const res = await fetch('docs/manifest.json');
            if (!res.ok) return;
            const docs = await res.json();

            docsCollapse.innerHTML = docs.map(doc => `
                <a href="#docs?file=${encodeURIComponent(doc.file)}"
                   class="list-group-item list-group-item-action bg-transparent text-white fw-medium mb-1 ps-4"
                   data-target="docs"
                   data-doc-file="${doc.file}">
                    <i class="fal fa-file-lines me-2 fs-6 align-middle"></i>${doc.title}
                </a>`).join('');
        } catch (e) {
            console.error('Failed to load docs manifest:', e);
        }
    };

    const loadDocFile = async (file) => {
        const content = document.getElementById('docs-content');
        if (!content) return;
        try {
            const res = await fetch(file);
            if (!res.ok) throw new Error(`Failed to fetch ${file}`);
            const md = await res.text();
            content.innerHTML = typeof marked !== 'undefined'
                ? marked.parse(md)
                : `<pre>${md}</pre>`;

            // Apply syntax highlighting to code blocks
            content.querySelectorAll('pre code').forEach(block => {
                if (typeof hljs !== 'undefined') hljs.highlightElement(block);
            });
        } catch (e) {
            console.error('Failed to load doc file:', e);
            content.innerHTML = `<p class="text-danger">Failed to load document.</p>`;
        }
    };


    /* ==========================================================================
       Getting Started Section Loader
       ========================================================================== */
    const loadGettingStarted = async () => {
        const panel = document.getElementById('getting-started-docs');
        if (!panel) return;
        try {
            const res = await fetch('getting-started.html');
            if (!res.ok) return;
            let html = await res.text();

            // Replace brand tokens with values from brand.json
            const b = window._brand || {};
            const brandName = b.title || b.distName || 'elementary-ui';
            const distName = b.distName || 'elementary-ui';
            const globalName = b.globalName || 'ElementaryUI';
            html = html.replace(/\{\{brandName\}\}/g, brandName)
                       .replace(/\{\{distName\}\}/g, distName)
                       .replace(/\{\{globalName\}\}/g, globalName);

            panel.innerHTML = html;
        } catch (e) {
            console.error('Failed to load getting-started.html:', e);
        }
    };

    const loadBrand = async () => {
        try {
            const res = await fetch('brand.json');
            if (!res.ok) return;
            const brand = await res.json();
            window._brand = brand;

            if (brand.hideHero) document.body.classList.add('hide-hero-section');
            if (brand.hideWelcome) {
                const navWelcome = document.getElementById('nav-welcome');
                if (navWelcome) navWelcome.classList.add('d-none');
            }

            // Page title
            const title = brand.title || brand.distName;
            if (title) document.title = title;

            // Version badge — prefer brand.version, fallback to package.json
            const badge = document.querySelector('.sidebar-version-badge');
            if (badge) {
                if (brand.version) {
                    badge.textContent = `v${brand.version}`;
                } else {
                    try {
                        const pkgRes = await fetch('package.json');
                        if (pkgRes.ok) {
                            const pkg = await pkgRes.json();
                            if (pkg.version) badge.textContent = `v${pkg.version}`;
                        }
                    } catch (_) { /* keep existing badge text */ }
                }
            }
        } catch (e) {
            console.error('Failed to load brand.json:', e);
        }
    };

    const loadElementaryHero = async () => {
        if (document.body.classList.contains('hide-hero-section')) return;

        const container = document.getElementById('elementary-hero');
        if (!container) return;
        const src = container.getAttribute('data-src');
        if (!src) return;

        const loadScript = (url) => new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = url;
            s.onload = resolve;
            s.onerror = reject;
            document.body.appendChild(s);
        });

        try {
            const res = await fetch(src);
            if (res.ok) {
                container.outerHTML = await res.text();
                syncLottieColor();

                // Load 3D hero scripts dynamically (sequential — each depends on the previous)
                await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js');
                await loadScript('https://cdnjs.cloudflare.com/ajax/libs/cannon.js/0.6.2/cannon.min.js');
                await loadScript('elementary-assets/js/hero-3d.js?v=1');

                if (typeof window.initHero3D === 'function') {
                    window.initHero3D();
                }
            }
        } catch (e) {
            console.error('Failed to load elementary-hero:', e);
        }
    };

    /* ==========================================================================
       Boot sequence
       ========================================================================== */
    document.addEventListener('click', () => {
        document.querySelectorAll('.comp-repeater-add-wrap.is-open').forEach(w => w.classList.remove('is-open'));
    });

    loadBrand().then(() =>
        Promise.all([loadGettingStarted(), loadDocs()])
    ).then(() => {
        loadElementaryHero();
        // Open docs collapse by default
        const docsCollapse = document.getElementById('docsCollapse');
        if (docsCollapse) bootstrap.Collapse.getOrCreateInstance(docsCollapse).show();
        resolveHash();
        Promise.all([loadDemos(), loadComponents()]).then(wireNewCollapses);
    });

    /* ==========================================================================
       Code Panel Controller
       ========================================================================== */


    // ── DOM refs ──────────────────────────────────────────────────────────────
    const codePanel = document.getElementById('sandbox-code-panel');
    const codePanelCode = document.getElementById('sandbox-code-content');
    const codePanelName = document.getElementById('sandbox-code-filename');
    const sandboxSplitContainer = document.getElementById('sandbox-split-container');
    const btnViewCode = document.getElementById('sandbox-view-code-btn');

    const btnBottom = document.getElementById('sandbox-code-bottom-btn');
    const btnRight = document.getElementById('sandbox-code-right-btn');
    const btnClose = document.getElementById('sandbox-code-close-btn');
    const btnCopy = document.getElementById('sandbox-code-copy-btn');

    // ── State ─────────────────────────────────────────────────────────────────
    let panelMode = 'bottom';   // 'bottom' | 'right'
    let panelOpen = false;
    let currentSourcePath = null;       // e.g. 'test-envs/demo-1/index.html'
    let rawSourceCode = '';         // last fetched raw HTML string

    // ── Helpers ───────────────────────────────────────────────────────────────

    const applyPanelMode = (mode) => {
        panelMode = mode;
        if (sandboxSplitContainer) {
            sandboxSplitContainer.classList.remove('split-bottom', 'split-right');
            sandboxSplitContainer.classList.add(`split-${mode}`);
        }

        // Sync button active states
        btnBottom?.classList.toggle('active', mode === 'bottom');
        btnRight?.classList.toggle('active', mode === 'right');
    };

    const openPanel = async () => {
        if (!currentSourcePath) return;

        // Fetch source if we don't have it yet or source changed
        if (!rawSourceCode) {
            try {
                const res = await fetch(currentSourcePath);
                rawSourceCode = res.ok ? await res.text() : '<!-- Could not load source -->';
            } catch {
                rawSourceCode = '<!-- Could not load source -->';
            }
        }

        // Populate code block using highlight.js
        if (codePanelCode) {
            codePanelCode.textContent = rawSourceCode; // Safely set text content
            if (typeof hljs !== 'undefined') {
                delete codePanelCode.dataset.highlighted; // Force re-highlight
                hljs.highlightElement(codePanelCode);
            }
        }
        if (codePanelName) codePanelName.textContent = currentSourcePath.split('/').pop() || 'index.html';

        // Open
        panelOpen = true;
        if (codePanel) {
            codePanel.classList.remove('d-none');
            codePanel.classList.add('d-flex');
        }
        btnViewCode?.classList.add('active'); // indicate it's toggled
    };

    const closePanel = () => {
        panelOpen = false;
        if (codePanel) {
            codePanel.classList.remove('d-flex');
            codePanel.classList.add('d-none');
        }
        btnViewCode?.classList.remove('active');
    };

    const togglePanel = () => {
        if (panelOpen) {
            closePanel();
        } else {
            openPanel();
        }
    };

    // ── Show / hide toolbar buttons based on active section ───────────────────
    /**
     * Call this every time a section is activated.
     * Pass the component source path (e.g. 'test-envs/demo-1/index.html')
     * or null when not on a component section.
     */
    const setCodePanelContext = (sourcePath) => {
        currentSourcePath = sourcePath;
        rawSourceCode = '';  // invalidate so next open re-fetches

        const isSandbox = !!sourcePath;

        if (btnViewCode) {
            btnViewCode.classList.toggle('d-none', !isSandbox);
            btnViewCode.classList.toggle('d-flex', isSandbox);
        }

        // If panel is open and we navigate away from a sandbox, close it
        if (!isSandbox && panelOpen) closePanel();
        // If panel is already open and we change to a new sandbox, re-fetch
        if (isSandbox && panelOpen) openPanel();
    };

    // ── Wire buttons ──────────────────────────────────────────────────────────
    btnViewCode?.addEventListener('click', togglePanel);
    btnClose?.addEventListener('click', closePanel);

    btnBottom?.addEventListener('click', () => applyPanelMode('bottom'));
    btnRight?.addEventListener('click', () => applyPanelMode('right'));

    // Copy to clipboard
    btnCopy?.addEventListener('click', async () => {
        if (!rawSourceCode) return;
        const icon = btnCopy.querySelector('i');
        if (icon) {
            icon.className = 'fal fa-clipboard-check';
            setTimeout(() => { icon.className = 'fal fa-clipboard'; }, 1800);
        }
        try {
            await navigator.clipboard.writeText(rawSourceCode);
        } catch {
            // fallback for non-HTTPS
            const ta = document.createElement('textarea');
            ta.value = rawSourceCode;
            ta.style.position = 'fixed'; ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        }
    });

    // Initialise panel in bottom-mode
    applyPanelMode('right');

    /* ==========================================================================
       Patch activateSection to inform the code panel controller
       ========================================================================== */
    /**
     * We wrap the original activateSection closure by hooking into navigation.
     * Since activateSection is called by resolveHash and the click handler,
     * we intercept at the click-handler level AND the hashchange level by
     * patching the click delegate that already exists.
     *
     * The cleanest hook: observe which section becomes active by watching
     * the sidebar link clicks + hashchange, reading data-target to derive
     * the component path.
     */
    const deriveSourcePath = (sectionId, demoUrl = null) => {
        if (sectionId === 'sandbox' && demoUrl) {
            return demoUrl;
        }
        return null; // View Code is currently only supported in sandbox mode
    };

    // Observe nav clicks
    document.addEventListener('click', (e) => {
        const link = e.target.closest('.list-group-item[data-target]');
        if (!link) return;
        const sectionId = link.getAttribute('data-target');
        const demoUrl = link.getAttribute('data-demo') || null;
        setCodePanelContext(deriveSourcePath(sectionId, demoUrl));
    }, true); // capture phase so it runs before the existing handler

    // Observe hash changes (back/forward)
    window.addEventListener('hashchange', () => {
        const { sectionId, demoUrl } = parseHash();
        setCodePanelContext(deriveSourcePath(sectionId, demoUrl));
    });

    // Set initial context from URL hash
    const initialHashParsed = parseHash();
    setCodePanelContext(deriveSourcePath(initialHashParsed.sectionId, initialHashParsed.demoUrl));

    /* ==========================================================================
       Docs code-block copy buttons
       ========================================================================== */
    document.addEventListener('click', async (e) => {
        const btn = e.target.closest('.docs-copy-btn');
        if (!btn) return;
        const code = btn.closest('.docs-code-block')?.querySelector('code');
        if (!code) return;
        const icon = btn.querySelector('i');
        if (icon) {
            icon.className = 'fal fa-clipboard-check';
            setTimeout(() => { icon.className = 'fal fa-clipboard'; }, 60000);
        }
        try {
            await navigator.clipboard.writeText(code.innerText);
        } catch {
            const ta = document.createElement('textarea');
            ta.value = code.innerText;
            ta.style.position = 'fixed'; ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        }
    });
});
