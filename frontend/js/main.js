// ============================================================================
// Main Initialization
// ============================================================================

import { loadDefaultFile, setupFilePickerListeners } from './dataLoader.js';

window.addEventListener('DOMContentLoaded', () => {
    loadDefaultFile();
    setupFilePickerListeners();
});
