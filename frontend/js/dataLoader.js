// ============================================================================
// Data Loading and File Handling
// ============================================================================

import { state, resetState } from './state.js';
import { displayCode } from './codeDisplay.js';

export function processHtmlData(html, filename = 'info.html') {
    // Reset state
    resetState();
    state.currentFile = filename;
    
    // Update filename display
    document.getElementById('current-file-name').textContent = filename;
    
    displayCode(html);
}

export async function loadDefaultFile() {
    try {
        const response = await fetch('info.html');
        if (!response.ok) {
            throw new Error('File not found');
        }
        const html = await response.text();
        processHtmlData(html, 'info.html');
    } catch (error) {
        console.error('Error loading info.html:', error);
        alert('Error: Could not load info.html. Generate it first with: lake exe staticInfoView <file.lean>');
    }
}

export function loadFromFile(file) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
        try {
            const html = e.target.result;
            processHtmlData(html, file.name);
        } catch (error) {
            console.error('Error loading file:', error);
            alert(`Error: ${error.message}`);
        }
    };
    
    reader.onerror = () => {
        alert('Error reading file');
    };
    
    reader.readAsText(file);
}

export function setupFilePickerListeners() {
    const fileInput = document.getElementById('file-input');
    const changeFileBtn = document.getElementById('change-file-btn');
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            loadFromFile(e.target.files[0]);
        }
    });
    
    changeFileBtn.addEventListener('click', () => {
        // Trigger native file picker
        fileInput.click();
    });
    
    // Auto-load default file on startup
    loadDefaultFile();
}
