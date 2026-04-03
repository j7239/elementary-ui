(function () {
    const bootstrapSheet = new CSSStyleSheet();
    const faSheet = new CSSStyleSheet();

    window.sharedStyles = [bootstrapSheet, faSheet];

    async function loadCSS(url, sheet) {
        try {
            const response = await fetch(url);
            if (!response.ok) return;
            let css = await response.text();

            css = css.replace(/:root/g, ':root, :host');

            const cssAbsUrl = new URL(url, document.baseURI).href;
            const cssDir = cssAbsUrl.substring(0, cssAbsUrl.lastIndexOf('/') + 1);
            css = css.replace(/url\(\.\.\/([^)]+)\)/g, (_, p) =>
                `url(${new URL('../' + p, cssDir).href})`
            );

            await sheet.replace(css);
        } catch (err) {
            console.error('Theme Engine Error:', err);
        }
    }

    const bsScript = document.createElement('script');
    bsScript.src = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js';
    bsScript.addEventListener('load', () => document.dispatchEvent(new Event('bootstrap:ready')));
    document.head.appendChild(bsScript);

    loadCSS('https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css', bootstrapSheet);
    loadCSS('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css', faSheet);
})();
