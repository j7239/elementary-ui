// ── Data carrier ────────────────────────────────────────────────────────────
// elm-dropdown-item is a hidden light-DOM child whose sole purpose is passing
// structured item data to elm-dropdown via attributes.
class DropdownItem extends HTMLElement {
    constructor() { super(); }
    connectedCallback() { this.style.display = 'none'; }
    static get observedAttributes() { return ['label', 'href', 'divider']; }
}
customElements.define('elm-dropdown-item', DropdownItem);

// ── elm-dropdown ─────────────────────────────────────────────────────────────
export class Dropdown extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const shared = window.sharedStyles || [];
        this.shadowRoot.innerHTML = `
            <div class="dropdown">
                <button type="button" class="btn btn-secondary dropdown-toggle" aria-expanded="false"></button>
                <ul class="dropdown-menu"></ul>
            </div>`;
        if (shared.length > 0) this.shadowRoot.adoptedStyleSheets = shared;

        // Cache items so updateUI works before and after connectedCallback
        this._items = [];

        // Bind handlers once so removeEventListener works across reconnects
        this._handleToggle = () => {
            const menu = this.shadowRoot.querySelector('.dropdown-menu');
            menu.classList.contains('show') ? this._close() : this._open();
        };

        this._handleOutsideClick = (e) => {
            if (!e.composedPath().includes(this)) this._close();
        };

        this._handleKeydown = (e) => {
            if (e.key === 'Escape') this._close();
        };
    }

    connectedCallback() {
        // Read item data from light-DOM data carriers
        this._items = Array.from(this.querySelectorAll('elm-dropdown-item')).map(el => ({
            label:   el.getAttribute('label')  || '',
            href:    el.getAttribute('href')   || '#',
            divider: el.hasAttribute('divider'),
        }));

        this.updateUI();

        const toggle = this.shadowRoot.querySelector('.dropdown-toggle');
        toggle.addEventListener('click', this._handleToggle);
        document.addEventListener('click', this._handleOutsideClick);
        document.addEventListener('keydown', this._handleKeydown);
    }

    disconnectedCallback() {
        document.removeEventListener('click', this._handleOutsideClick);
        document.removeEventListener('keydown', this._handleKeydown);
    }

    static get observedAttributes() {
        return ['label', 'btn-style', 'align'];
    }

    attributeChangedCallback(_name, oldValue, newValue) {
        if (oldValue !== newValue) this.updateUI();
    }

    updateUI() {
        const label    = this.getAttribute('label')     || 'Dropdown';
        const btnStyle = this.getAttribute('btn-style') || 'btn-secondary';
        const align    = this.getAttribute('align')     || 'start';

        const toggle = this.shadowRoot.querySelector('.dropdown-toggle');
        toggle.className = `btn ${btnStyle} dropdown-toggle`;
        toggle.textContent = label;

        const menu = this.shadowRoot.querySelector('.dropdown-menu');
        menu.className = `dropdown-menu${align === 'end' ? ' dropdown-menu-end' : ''}`;

        // Rebuild items without destroying the toggle's event listener
        menu.innerHTML = '';
        for (const item of this._items) {
            const li = document.createElement('li');
            if (item.divider) {
                li.innerHTML = '<hr class="dropdown-divider">';
            } else {
                const a = document.createElement('a');
                a.className = 'dropdown-item';
                a.href = item.href;
                a.textContent = item.label;
                li.appendChild(a);
            }
            menu.appendChild(li);
        }
    }

    _open() {
        this.shadowRoot.querySelector('.dropdown-menu').classList.add('show');
        this.shadowRoot.querySelector('.dropdown-toggle').setAttribute('aria-expanded', 'true');
    }

    _close() {
        this.shadowRoot.querySelector('.dropdown-menu').classList.remove('show');
        this.shadowRoot.querySelector('.dropdown-toggle').setAttribute('aria-expanded', 'false');
    }
}

customElements.define('elm-dropdown', Dropdown);
