import elmCSS from '../dist/css/styles.min.css?inline';
import faCSS from '@fortawesome/fontawesome-free/css/all.min.css?inline';
import bsCSS from 'bootstrap/dist/css/bootstrap.min.css?inline';

const elmSheet = new CSSStyleSheet();
const faSheet = new CSSStyleSheet();
const bsSheet = new CSSStyleSheet();

elmSheet.replaceSync(elmCSS.replace(/:root/g, ':root, :host'));
faSheet.replaceSync(faCSS.replace(/:root/g, ':root, :host'));
bsSheet.replaceSync(bsCSS.replace(/:root/g, ':root, :host'));

export const sharedStyles = [bsSheet, elmSheet, faSheet];

window.sharedStyles = sharedStyles;

document.adoptedStyleSheets = [...document.adoptedStyleSheets, bsSheet, elmSheet, faSheet];
