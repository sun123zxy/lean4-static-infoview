// ============================================================================
// Code Display
// ============================================================================

import { state } from './state.js';
import { setPosition } from './navigation.js';

export function displayCode(source) {
    const codeContent = document.getElementById('code-content');
    codeContent.innerHTML = '';
    
    const lines = source.split('\n');
    let offset = 0;
    const offsets = [];
    const elemMap = new Map();
    const lineOffsetCache = [0]; // First line starts at 0
    
    lines.forEach((line, lineIndex) => {
        const lineDiv = document.createElement('div');
        lineDiv.className = 'code-line';
        
        // Line number
        const lineNum = document.createElement('span');
        lineNum.className = 'line-number';
        lineNum.textContent = (lineIndex + 1).toString();
        lineDiv.appendChild(lineNum);
        
        // Line content - iterate through actual characters in source
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const span = document.createElement('span');
            span.className = 'code-char';
            span.textContent = char;
            span.dataset.offset = offset;
            
            offsets.push(offset);
            elemMap.set(offset, span);
            lineDiv.appendChild(span);
            // Increment by byte length for UTF-8 encoding
            offset += new Blob([char]).size;
        }
        
        // Add newline character
        if (lineIndex < lines.length - 1) {
            const newline = document.createElement('span');
            newline.className = 'code-char';
            newline.textContent = '\n';
            newline.dataset.offset = offset;
            offsets.push(offset);
            elemMap.set(offset, newline);
            lineDiv.appendChild(newline);
            offset += 1; // newline is 1 byte
            lineOffsetCache.push(offset); // Start of next line
        }
        
        codeContent.appendChild(lineDiv);
    });
    
    // Cache data structures for element lookup
    state.offsetToElement = elemMap;
    state.lineOffsets = lineOffsetCache;
    
    // Event delegation for clicks
    codeContent.addEventListener('click', (e) => {
        if (e.target.classList.contains('code-char')) {
            setPosition(parseInt(e.target.dataset.offset, 10));
        }
    });
}
