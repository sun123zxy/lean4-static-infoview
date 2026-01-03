// ============================================================================
// Code Display
// ============================================================================

import { setupMarkerClickHandlers } from './navigation.js';

export function displayCode(html) {
    const codeContent = document.getElementById('code-content');
    // Wrap in pre/code for proper formatting
    codeContent.innerHTML = `<pre><code id="code-text">${html}</code></pre>`;
    
    // Set up click handlers on markers
    setupMarkerClickHandlers();
}
