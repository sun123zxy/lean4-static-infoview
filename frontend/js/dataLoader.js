// ============================================================================
// Data Loading and File Handling
// ============================================================================
//
// Handles:
// - Loading HTML files with embedded info markers
// - Parsing meta information (export flags)
// - Setting up file picker and display toggles
// - Managing marker visibility based on user preferences
// ============================================================================

import { state, resetState } from './state.js';

/**
 * Process HTML data from a loaded file
 * @param {string} html - The HTML content to process
 * @param {string} filename - Name of the loaded file
 */
export function processHtmlData(html, filename = 'output.html') {
    // Reset state
    resetState();
    state.currentFile = filename;
    
    // Update filename display
    document.getElementById('current-file-name').textContent = filename;
    
    // Inject HTML into code content
    const codeContent = document.getElementById('code-content');
    codeContent.innerHTML = html;
    
    // Initialize InfoView
    window.initInfoview();
}

/**
 * Load the default output.html file from the frontend directory
 */
export async function loadDefaultFile() {
    try {
        const response = await fetch('output.html');
        if (!response.ok) {
            throw new Error('File not found');
        }
        const html = await response.text();
        processHtmlData(html, 'output.html');
    } catch (error) {
        console.error('Error loading output.html:', error);
        alert('Error: Could not load output.html. Generate it first with: lake exe staticInfoView <file.lean>');
    }
}

/**
 * Load HTML from a user-selected file
 * @param {File} file - The file to load
 */
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

/**
 * Setup file picker button and toggle event listeners
 */
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
}
