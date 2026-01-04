// ============================================================================
// Code Display
// ============================================================================

import { setupMarkerClickHandlers } from './navigation.js';

/**
 * Recursively walk the DOM and highlight text nodes while preserving marker spans
 */
function highlightTextNodes(node) {
    if (!node) return;
    
    // If it's a text node, highlight it
    if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        if (text.trim()) {
            // Use hljs to highlight this text fragment
            const highlighted = hljs.highlight(text, { language: 'lean', ignoreIllegals: true });
            
            // Create a temporary container to parse the highlighted HTML
            const temp = document.createElement('span');
            temp.innerHTML = highlighted.value;
            
            // Replace the text node with the highlighted content
            const parent = node.parentNode;
            while (temp.firstChild) {
                parent.insertBefore(temp.firstChild, node);
            }
            parent.removeChild(node);
        }
    } 
    // If it's an element node, recurse into its children
    else if (node.nodeType === Node.ELEMENT_NODE) {
        // Process children in reverse to handle node removal safely
        const children = Array.from(node.childNodes);
        for (const child of children) {
            highlightTextNodes(child);
        }
    }
}

export function displayCode(html) {
    const codeContent = document.getElementById('code-content');
    
    const pre = document.createElement('pre');
    const code = document.createElement('code');
    code.className = 'language-lean';
    
    // Inject the HTML with markers
    code.innerHTML = html;
    
    pre.appendChild(code);
    codeContent.innerHTML = '';
    codeContent.appendChild(pre);
    
    // Apply syntax highlighting by walking the DOM tree
    if (typeof hljs !== 'undefined') {
        highlightTextNodes(code);
    }
    
    // Set up click handlers on markers
    setupMarkerClickHandlers();
}
