// ============================================================================
// Code Display
// ============================================================================

import { setupMarkerClickHandlers } from './navigation.js';

export function displayCode(html) {
    const codeContent = document.getElementById('code-content');
    
    // Parse HTML first to get a proper DOM structure
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    const pre = document.createElement('pre');
    const code = document.createElement('code');
    code.className = 'language-lean';
    
    // Walk through all nodes and process them
    const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_ALL, null, false);
    let currentTextSegment = '';
    
    function flushTextSegment() {
        if (currentTextSegment) {
            // Highlight accumulated text
            const highlightedResult = window.hljs.highlight(currentTextSegment, { language: 'lean', ignoreIllegals: true });
            const span = document.createElement('span');
            span.innerHTML = highlightedResult.value;
            code.appendChild(span);
            currentTextSegment = '';
        }
    }
    
    while (walker.nextNode()) {
        const node = walker.currentNode;
        
        if (node.nodeType === Node.TEXT_NODE) {
            // Accumulate text nodes
            currentTextSegment += node.textContent;
        } else if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('goal-marker')) {
            // Flush any pending text before marker
            flushTextSegment();
            // Add the marker as-is
            code.appendChild(node.cloneNode(true));
        }
    }
    
    // Flush any remaining text
    flushTextSegment();
    
    pre.appendChild(code);
    codeContent.innerHTML = '';
    codeContent.appendChild(pre);
    
    // Set up click handlers on markers
    setupMarkerClickHandlers();
}
