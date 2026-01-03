// ============================================================================
// Data Loading and File Handling
// ============================================================================

import { state, resetState } from './state.js';
import { displayCode } from './codeDisplay.js';

export function processInfoData(data, filename = 'info.json') {
    state.infoData = data;
    
    // Reset state
    resetState();
    
    // Build position map and tactic offset array using info_strings lookup
    if (data.positions && data.info_strings) {
        const offsets = [];
        data.positions.forEach(pos => {
            const infoText = data.info_strings[pos.info_id];
            state.positionMap.set(pos.offset, [infoText]);
            offsets.push(pos.offset);
        });
        // Sort offsets for binary search
        state.tacticOffsets = offsets.sort((a, b) => a - b);
    }
    
    // Update filename display
    document.getElementById('current-file-name').textContent = filename;
    
    displayCode(data.source);
}

export async function loadDefaultFile() {
    try {
        const response = await fetch('info.json');
        if (!response.ok) {
            throw new Error('File not found');
        }
        const data = await response.json();
        processInfoData(data, 'info.json');
    } catch (error) {
        console.error('Error loading info.json:', error);
        alert('Error: Could not load info.json. Generate it first with: lake exe staticInfoView <file.lean>');
    }
}

export function loadFromFile(file) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            
            // Validate structure
            if (!data.source || !data.positions || !data.info_strings) {
                throw new Error('Invalid JSON structure');
            }
            
            processInfoData(data, file.name);
        } catch (error) {
            console.error('Error parsing JSON:', error);
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
