import bootstrapCSS from 'bootstrap/dist/css/bootstrap.min.css?inline';
import faCSS from '@fortawesome/fontawesome-free/css/all.min.css?inline';

const bootstrapSheet = new CSSStyleSheet();
const faSheet = new CSSStyleSheet();

bootstrapSheet.replaceSync(bootstrapCSS.replace(/:root/g, ':root, :host'));
faSheet.replaceSync(faCSS.replace(/:root/g, ':root, :host'));

export const sharedStyles = [bootstrapSheet, faSheet];

window.sharedStyles = sharedStyles;

document.adoptedStyleSheets = [...document.adoptedStyleSheets, faSheet];
