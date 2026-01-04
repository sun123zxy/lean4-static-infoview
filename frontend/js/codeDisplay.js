// ============================================================================
// Code Display
// ============================================================================

import { setupMarkerClickHandlers } from './navigation.js';

export function displayCode(html) {
    const codeContent = document.getElementById('code-content');
    
    const pre = document.createElement('pre');
    const code = document.createElement('code');
    code.className = 'language-lean';
    
    // Simply inject the HTML directly
    code.innerHTML = html;
    
    pre.appendChild(code);
    codeContent.innerHTML = '';
    codeContent.appendChild(pre);
    
    // Set up click handlers on markers
    setupMarkerClickHandlers();
}
