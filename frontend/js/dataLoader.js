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
import { displayCode } from './codeDisplay.js';

/**
 * Parse meta information from the HTML content
 * @param {string} html - The HTML content
 * @returns {Object} - Parsed metadata
 */
function parseMetaInfo(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const metaSpan = doc.querySelector('.meta-info');
    
    if (metaSpan) {
        const exportGoals = metaSpan.getAttribute('data-export-goals') === 'true';
        const exportTerms = metaSpan.getAttribute('data-export-terms') === 'true';
        return { exportGoals, exportTerms };
    }
    
    // Default: assume both are exported if no meta info
    return { exportGoals: true, exportTerms: true };
}

/**
 * Update toggle controls based on export metadata
 * Goals are toggleable if exported, terms are informational only
 * @param {boolean} hasGoals - Whether goals were exported
 * @param {boolean} hasTerms - Whether terms were exported
 */
function updateToggleControls(hasGoals, hasTerms) {
    const toggleGoals = document.getElementById('toggle-goals');
    const toggleTerms = document.getElementById('toggle-terms');
    
    // Goals are toggleable if available
    toggleGoals.disabled = !hasGoals;
    toggleGoals.checked = hasGoals && state.displayGoals;
    
    // Terms are always disabled (informational only)
    toggleTerms.disabled = true;
    toggleTerms.checked = hasTerms;
    
    // Visual feedback - dim if not available
    toggleGoals.parentElement.style.opacity = hasGoals ? '1' : '0.5';
    toggleTerms.parentElement.style.opacity = hasTerms ? '1' : '0.5';
}

/**
 * Process HTML data from a loaded file
 * Parses meta information and updates UI controls
 * @param {string} html - The HTML content to process
 * @param {string} filename - Name of the loaded file
 */
export function processHtmlData(html, filename = 'info.html') {
    // Reset state
    resetState();
    state.currentFile = filename;
    
    // Parse meta information
    const metaInfo = parseMetaInfo(html);
    state.exportedGoals = metaInfo.exportGoals;
    state.exportedTerms = metaInfo.exportTerms;
    
    // Update filename display
    document.getElementById('current-file-name').textContent = filename;
    
    // Update toggle controls
    updateToggleControls(state.exportedGoals, state.exportedTerms);
    
    displayCode(html);
}

/**
 * Load the default info.html file from the frontend directory
 */
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
    
    // Setup toggle listeners
    setupToggleListeners();
    
    // Auto-load default file on startup
    loadDefaultFile();
}

/**
 * Setup event listeners for display toggles
 */
function setupToggleListeners() {
    const toggleGoals = document.getElementById('toggle-goals');
    
    toggleGoals.addEventListener('change', (e) => {
        state.displayGoals = e.target.checked;
        updateMarkerVisibility();
    });
}

/**
 * Update visibility of goal markers based on toggle state
 */
function updateMarkerVisibility() {
    const goalMarkers = document.querySelectorAll('.goal-marker');
    
    goalMarkers.forEach(marker => {
        marker.style.display = state.displayGoals ? '' : 'none';
    });
}
