export class Button extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const shared = window.sharedStyles || [];
        this.shadowRoot.innerHTML = `<button type="button" class="btn"></button>`;
        if (shared.length > 0) this.shadowRoot.adoptedStyleSheets = shared;
    }

    connectedCallback() {
        this.updateUI();
    }

    static get observedAttributes() {
        return ['label', 'btn-style', 'size', 'disabled', 'icon', 'icon-pos'];
    }

    attributeChangedCallback(_name, oldValue, newValue) {
        if (oldValue !== newValue) this.updateUI();
    }

    updateUI() {
        const label    = this.getAttribute('label')    || 'Button';
        const btnStyle = this.getAttribute('btn-style') || 'btn-primary';
        const size     = this.getAttribute('size')     || '';
        const disabled = this.hasAttribute('disabled');
        const icon     = this.getAttribute('icon')     || '';
        const iconPos  = this.getAttribute('icon-pos') || 'start';

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
