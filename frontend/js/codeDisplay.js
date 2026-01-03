// ============================================================================
// Code Display
// ============================================================================

import { setupMarkerClickHandlers } from './navigation.js';

export function displayCode(html) {
    const codeContent = document.getElementById('code-content');
    
    // Split HTML at goal markers, highlight each segment separately
    const markerRegex = /(<span class="goal-marker"[^>]*>.*?<\/span>)/g;
    const parts = html.split(markerRegex);
    
    const pre = document.createElement('pre');
    const code = document.createElement('code');
    code.className = 'language-lean';
    
    // Process each part
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        
        if (part.match(markerRegex)) {
            // This is a goal marker - insert as-is
            const temp = document.createElement('div');
            temp.innerHTML = part;
            code.appendChild(temp.firstChild);
        } else if (part.trim()) {
            // This is code text - highlight it
            const highlightedResult = window.hljs.highlight(part, { language: 'lean', ignoreIllegals: true });
            const span = document.createElement('span');
            span.innerHTML = highlightedResult.value;
            code.appendChild(span);
        }
    }
    
    pre.appendChild(code);
    codeContent.innerHTML = '';
    codeContent.appendChild(pre);
    
    // Set up click handlers on markers
    setupMarkerClickHandlers();
}
