// ============================================================================
// Main Initialization
// ============================================================================

import { loadDefaultFile, setupFilePickerListeners } from './dataLoader.js';
import { setupKeyboardNavigation } from './navigation.js';
import { setupResizeHandle } from './resize.js';

window.addEventListener('DOMContentLoaded', () => {
    loadDefaultFile();
    setupFilePickerListeners();
    setupKeyboardNavigation();
    setupResizeHandle();
});
