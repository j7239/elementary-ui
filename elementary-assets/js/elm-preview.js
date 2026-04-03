class ElmPreview extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        // Defer one frame so Light DOM assigned via innerHTML is ready
        setTimeout(() => {
            const html = this.innerHTML;
            if (!html.trim()) return;

            this.innerHTML = ''; // clear light DOM

            this.shadowRoot.innerHTML = `
                <style>
                    @import url('${new URL('elementary-assets/shared.css', document.baseURI).href}');
                    :host {
                        display: block;
                        width: 100%;
                    }
                </style>
                <div class="elm-preview-container">
                    ${html}
                </div>
            `;

            // Safely evaluate scripts so they run inside the preview context
            const scripts = this.shadowRoot.querySelectorAll('script');
            scripts.forEach(oldScript => {
                const newScript = document.createElement('script');
                Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                newScript.appendChild(document.createTextNode(oldScript.innerHTML));
                oldScript.parentNode.replaceChild(newScript, oldScript);
            });
        }, 0);
    }
}
customElements.define('elm-preview', ElmPreview);
